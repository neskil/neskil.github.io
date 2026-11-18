// THE STILL LAKE IN THE MIDDLE OF THE HERD (from Moby-Dick, the chapter of the great herd in the straits).
// A whaleboat is drawn through ring upon ring of circling sperm whales into the calm at the centre, where the sea
// is clear as a lake and the mothers hang with their calves far down in the blue, and out by a lane between two
// ranks of bulls to a strait between two green islands. THE EYE RIDES OVER HER, two boat lengths up (LAKE_UP) from
// the first metre, she below and ahead on a course of her own (see THE BOAT'S STATION). It comes DOWN TO HER BOW
// TWICE (a harpooneer's height, EYE): along the bulls' water between the two ranks of bulls, and at the lane's
// mouth, beside the berth where a great bull breaches on his round; from there it rides her level to the gate. No hunt: no iron,
// no lance, no line fast to anything.
//
// MAP OF THIS FILE
//   MOODS            noon / golden / dawn / night: sky, sun, water colours, exposure (ctx.vary.hour picks one)
//   makeRipples      one tileable texture: ripple slopes, cloud blotches, foam lace
//   makePanorama     what the calm mirrors far off: the cloud towers and the far shore, round the whole horizon
//   SEA_*, DEEP_*    the sea surface (swell and chop outside; on the lake an oily swell, a mirror at low angles and
//                    clear blue straight down) and the blue under it
//   SHAFT_*          the sun's shafts going down into the lake
//   LAND_*, SURF_*   the islands (trees, rock cliffs, beaches, palms), the surf round them; RAIN_* the far rain;
//                    BIRD_* divers
//   bowGeometry      the whaleboat, whole, with her crew, her oars and her line
//   build(ctx)       STREAMS -> LAYOUT (lake, lane, islands, ranks, the boat's line with its corners, heights, places,
//                    the boat's station, the film's pace and clock, the axis behind the entry) -> SKY -> SEA -> LAND -> THE
//                    BOAT -> THE HERD (ranks, host, loungers, lane bulls, the named pair, tiers, the sounding
//                    bull, breaches, the lane's leaps, the great breach) -> BIRDS -> GAZE -> return
// WHAT IS DRIVEN BY WHAT. THE PLACE STANDS AND KEEPS ITS HABITS: nothing of the herd begins, turns or ends because
// the boat or the eye comes. On the WORLD CLOCK, over and over, whether anyone is there or not: every whale of the
// ranks, the host, the lake and the lane (the part's whaleAt: each comes up, blows, lies awash and goes down on a
// round of its own, its phase drawn from its own stream), the herd's breaches, the lane's leaps and the great
// bull's breaches in his berth beside the lane (one long round of seconds), the sounding bull on his beat in the
// bulls' water, the nosing calves on their ovals in the calm, the newborn on its circle, the long swell and the
// wind sea (they travel), birds, rain, clouds, palms, spray, the oars' stroke.
// By THE EYE'S METRES (through the film's own clock, filmT: the seconds the declared pace takes to each metre; see
// THE WORLD'S OWN FILM CLOCK): the eye's heights, the film's pace, the gaze's pulls (each to a place that stands),
// and THE BOAT'S STATION: she goes before the eye by a law of the eye's metres, from the first metre to the last,
// and with her station goes her wake (its strength by her speed); she is drawn at every frame.
// THE LANE OF DEEP WATER ALONG THE ROUTE'S LINE IS A STANDING LAW OF THE PLACE (the part's WAY block): a whale
// is under water wherever ITS OWN PLACE lies within 6.2 m of the route's line (the boat's half beam, her oars'
// sweep and two metres; the body's own reach across the line counted), lying level with a level body's top 6.2 m
// under the water (a whale keeps its standing pitch and the set of its back besides, so the highest drawn point of a
// great bull lies 5.9 m under at the least, counted on the placed vertices), AT EVERY CLOCK, WHETHER A BOAT IS THERE OR NOT; over 18 m beyond, the depth eases back to the
// height the whale's own clock gives. The herd swims under the lane. The law reads the whale's own place and its
// own clock: never the boat's station, the eye's metres, the film's clock or the engine's speed. A whale of the
// rounds (the great bulls, the cows of the ranks) is carried round its rank by the world clock as ever and the
// lane's depth is a function of where it is; it gives no blow where the lane has it under at the second its own
// clock's blow begins. A whale that keeps a place (the host, the lake's cows, the cows and calves that hang in
// the lake) takes the same law, worked once at the build (laneHung): one whose body reaches within 6.2 m of the
// line hangs whole, with its highest part 6.2 m under the water or more, and one that does not is left as dealt (a
// keeper has no easing: it does not cross). The newborn, whose small circle runs in and out
// of the lane's reach, takes the lane's depth by its own place each frame. In the lane of smooth water the whales
// of the rounds go deep by that lane's own rule of place (the part's whaleAt). The
// sounding bull's beat and the nosing calves' ovals are laid clear of the line and stand; so are the diving birds'
// companies and every gull's round (a gull whose round would pass near the line flies it higher).
// WHAT ANSWERS THE VISITOR'S NEARNESS, IN METRES: only the makes by distance (rules of the place, each stated
// where it is made); nothing of the herd answers the boat or the eye. A whale within
// three of its lengths of the route's line is drawn in THE FULL MAKE (lineD, bandOf); THE HIDE'S MARKS (folds,
// scuffs, scars, the blowhole, the water running off it) are drawn at their strongest within three of a whale's
// lengths of the eye and are gone by six, and within the same nearness the wet hide is drawn dark under its sheen
// (the part's WHALE_FRAG); A BLOW within thirty metres of the eye is drawn as mist (larger, thinner drops), going
// back to bright strokes by seventy (SPOUT_VERT); A SPLASH beyond fifty metres is drawn as one body of white
// water (larger, softer drops), wholly so by a hundred and ten (HAND_VERT); and A BLOW'S AND A SPLASH'S DROPS THIN
// AT THE LENS, a medium passed through: whole at 7 m of the lens, nothing at 1.5 m (SPOUT_VERT, HAND_VERT).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig, makeCloudField } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as T from '../kit/terrain.js';
import { makeWhaleKit, makeWay, WAY, GLSL_HERD, GLSL_REFRACT, GLSL_WATER, GLSL_SEA, GLSL_DEEP, FLOOR, OPEN_HIDE } from '../parts/still-lake-in-the-herd.js';

// EYE: the eye's height in the boat (a harpooneer standing in the bow on the bottom boards: 1.85 m over the water,
// 0.65 m over the stem head); the gate's middle stands at the same height. BL: a whaleboat's length; WLEN: a cow's
// length; BULL: a bull's
const TAU = Math.PI * 2, EYE = 1.85, GATE_R = 8.6, BL = 8.5, WLEN = 12, BULL = 18;
// LANE_W: half the breadth of the lane of smooth water: the lane's bulls lie a length and a half from its middle
// line, and the smooth water reaches four metres beyond them
const LANE_W = 1.6 * BULL + 5;
// LAKE_UP: the eye's height over the heart of the lake; LEAD_K: the boat's lead over the eye, in the eye's heights
// over the bow's own, and STATION_LEAST: the least share of the eye's way she ever makes (see THE BOAT'S STATION); MOUTH: where the lane's mouth lies, in lake radii from the heart
// (there the lane's rank begins on either hand); SEAT: the eye's place in the boat, metres
// ahead of her origin (a metre and a half behind the stem head, the thigh in the clumsy cleat)
const LAKE_UP = 2 * BL, LEAD_K = 2.5, STATION_LEAST = 0.15, MOUTH = 0.4, SEAT = 1.2;
// KNEE: the metres over which a slope of the route or a ramp of the pace is rounded into the level
const KNEE = 12;
// ARRIVE: a world is entered through a gate with the eye on the level frame of the route's first metre; the way in
// keeps that level for its first ARRIVE metres (the first slope's knee begins beyond them), and no gaze pull is on at
// the first metre (the first rises from nothing over its fade)
const ARRIVE = 60;
const col = (h) => new THREE.Color(h);

const MOODS = {
  noon: {
    sky: { preset: 'day', zenith: '#0f4db8', mid: '#3a8ae6', horizon: '#b2d9f8', sunElevation: 41, sunColor: '#fff1c7', clouds: { coverage: 0.4, scale: 1.15, softness: 0.3, lit: '#ffffff', shade: '#7c92bc' }, clouds2: { coverage: 0.3, stretch: 1, opacity: 0.4 } },
    sunBehind: true, sun: [3.1, 2.95, 2.55], skyAmb: [0.5, 0.72, 1.05], bounce: [0.1, 0.3, 0.46],
    seaDeep: '#0b2f7a', turq: '#1fa7c9', cobalt: '#0d3b8f', seaLit: 1, skin: '#4d4640', scar: '#8a827a',
    spoutLit: [1.55, 1.56, 1.58], spoutShade: [0.52, 0.66, 0.92], foam: [1.12, 1.15, 1.18], fogDen: 0.00042, fogMix: 0.25,
    seaFire: [0, 0, 0], glint: 1, bow: 1, shaft: [0.5, 0.95, 1.0], exposure: 1.0, shadowTint: '#0a1440', island: 1,
    portal: '#fff1c7',
  },
  golden: {
    sky: { preset: 'goldenHour', sunElevation: 9, clouds: { coverage: 0.4, scale: 1.1 } },
    sunBehind: false, sun: [3.3, 2.0, 0.95], skyAmb: [0.5, 0.5, 0.75], bounce: [0.2, 0.26, 0.3],
    seaDeep: '#123a5c', turq: '#3fb59a', cobalt: '#0f4a70', seaLit: 0.9, skin: '#4d463f', scar: '#857a72',
    spoutLit: [2.3, 1.45, 0.75], spoutShade: [0.7, 0.42, 0.42], foam: [1.2, 0.95, 0.72], fogDen: 0.00048, fogMix: 0.4,
    seaFire: [0, 0, 0], glint: 1.5, bow: 0.3, shaft: [0.9, 0.7, 0.35], exposure: 1.0, shadowTint: '#1a1038', island: 0.8,
    portal: '#ffd28a',
  },
  dawn: {
    sky: { preset: 'dawn', sunElevation: 6, clouds: { coverage: 0.36, scale: 1.2 } },
    sunBehind: false, sun: [2.4, 1.6, 1.5], skyAmb: [0.6, 0.55, 0.8], bounce: [0.25, 0.28, 0.36],
    seaDeep: '#2a3f78', turq: '#8fc4cf', cobalt: '#3a5a98', seaLit: 0.9, skin: '#4e4944', scar: '#857d79',
    spoutLit: [1.9, 1.25, 1.3], spoutShade: [0.6, 0.5, 0.7], foam: [1.15, 1.0, 1.02], fogDen: 0.00055, fogMix: 0.4,
    seaFire: [0, 0, 0], glint: 1.2, bow: 0.3, shaft: [0.8, 0.7, 0.8], exposure: 1.02, shadowTint: '#1c1444', island: 0.75,
    portal: '#ffd0d8',
  },
  night: {
    sky: { preset: 'night', clouds: { coverage: 0.3, scale: 1.2 } },
    sunBehind: false, sun: [0.75, 0.9, 1.25], skyAmb: [0.16, 0.22, 0.42], bounce: [0.05, 0.12, 0.2],
    seaDeep: '#081a40', turq: '#147a8c', cobalt: '#0a2a5c', seaLit: 0.75, skin: '#524f4f', scar: '#807d80',
    spoutLit: [0.6, 0.68, 0.9], spoutShade: [0.16, 0.2, 0.34], foam: [0.5, 0.58, 0.75], fogDen: 0.0005, fogMix: 0.5,
    seaFire: [0.05, 0.55, 0.5], glint: 1.1, bow: 0, shaft: [0.25, 0.5, 0.6], exposure: 1.25, shadowTint: '#050a24', island: 0.5,
    portal: '#bfe4ff',
  },
};

// One tileable 256 x 256 texture. R, G: slopes of fine ripples (0.5 = flat). B: soft blotches (clouds mirrored
// in the calm, patches of wind). A: lace (foam). All sums of whole-number waves, so the tile has no seam.
async function makeRipples(rng, yieldFn) {
  const N = 256, data = new Uint8Array(N * N * 4);
  const waves = [], blot = [], lace = [];
  // wavelets running mostly one way (the wind's), half of them sharp-crested: a sea, not an orange peel
  for (let i = 0; i < 20; i++) { const k = 2 + Math.floor(rng() * 15), a = 0.4 + (rng() - 0.5) * 2.3 + (rng() < 0.5 ? Math.PI : 0); waves.push([Math.round(Math.cos(a) * k), Math.round(Math.sin(a) * k), rng() * TAU, 1 / (0.6 + k * 0.12), i % 2]); }
  for (let i = 0; i < 7; i++) { const k = 1 + Math.floor(rng() * 4), a = rng() * TAU; blot.push([Math.round(Math.cos(a) * k), Math.round(Math.sin(a) * k), rng() * TAU, 1 / k]); }
  for (let i = 0; i < 9; i++) { const k = 5 + Math.floor(rng() * 12), a = rng() * TAU; lace.push([Math.round(Math.cos(a) * k), Math.round(Math.sin(a) * k), rng() * TAU, 1]); }
  for (let y = 0; y < N; y++) {
    const v = y / N * TAU;
    for (let x = 0; x < N; x++) {
      const u = x / N * TAU; let gx = 0, gy = 0, b = 0, l1 = 0, l2 = 0;
      for (const w of waves) {
        const ph = w[0] * u + w[1] * v + w[2], sn = Math.sin(ph);
        const c = (w[4] ? (sn > 0 ? -0.8 : 0.8) : 1) * Math.cos(ph) * w[3]; gx += c * w[0]; gy += c * w[1];
      }
      for (const w of blot) b += Math.sin(w[0] * u + w[1] * v + w[2]) * w[3];
      for (let i = 0; i < lace.length; i++) { const w = lace[i], sn = Math.sin(w[0] * u + w[1] * v + w[2]); if (i < 5) l1 += sn; else l2 += sn; }
      const la = (1 - Math.min(1, Math.abs(l1) * 0.75)) * 0.75 + (1 - Math.min(1, Math.abs(l2) * 0.9)) * 0.45;
      const o = (y * N + x) * 4;
      data[o] = clamp(128 + gx * 5.2, 0, 255); data[o + 1] = clamp(128 + gy * 5.2, 0, 255);
      data[o + 2] = clamp(128 + b * 56, 0, 255); data[o + 3] = clamp(la * 235, 0, 255);
    }
    if (y % 4 === 3) await yieldFn();
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4;
  tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}

// WHAT STANDS FAR OFF ROUND THE HORIZON, as a picture for the calm to mirror: 512 x 64, round the lake's heart at three
// kilometres, from the sea up to 1200 m. The cloud towers at their own bearings (lit heads, shaded bases) and the blue
// shore under them. towers: [x, base height, z, size]; cols: { lit, shade, shore } as [r, g, b] 0..1.
async function makePanorama(noise, towers, cols, yieldFn) {
  const W = 512, H = 64, data = new Uint8Array(W * H * 4);
  const tw = towers.map((t) => { const d = Math.hypot(t[0], t[2]), k = 3000 / d; return [Math.atan2(t[2], t[0]), t[1] * k, t[3] * k]; });
  const ridgeAt = new Float32Array(W);
  for (let i = 0; i < W; i++) { const az = (i + 0.5) / W * TAU - Math.PI; ridgeAt[i] = 55 + 70 * (0.5 + 0.5 * noise.n2(az * 3.1, 7.7)) + 40 * noise.n2(az * 11, 3.3); }
  await yieldFn();
  // (the towers that can stand over each bearing are found once; and a tower's lumps, at most 0.55 either way, are
  // not worked where it could not show even with them: the picture is the same, dot for dot)
  const over = [];
  for (let i = 0; i < W; i++) { const az = (i + 0.5) / W * TAU - Math.PI, l = []; for (const t of tw) { const dx = ((az - t[0] + Math.PI * 3) % TAU - Math.PI) * 3000; if (Math.abs(dx) <= 0.5 * t[2] * 1.5) l.push(t); } over.push(l); }
  for (let j = 0; j < H; j++) {
    const y = (j + 0.5) / H * 1200;
    for (let i = 0; i < W; i++) {
      const az = (i + 0.5) / W * TAU - Math.PI, o = (j * W + i) * 4;
      let f = -1, tt = 0;
      for (const t of over[i]) {
        const dx = ((az - t[0] + Math.PI * 3) % TAU - Math.PI) * 3000, hw = 0.5 * t[2], hh = 0.36 * t[2], cy = t[1] + 0.35 * t[2];
        if (Math.abs(dx) > hw * 1.5) continue;
        if (1 - (dx * dx) / (hw * hw) - ((y - cy) * (y - cy)) / (hh * hh) * (y < cy ? 2.2 : 1) + 0.75 <= f) continue;
        const lump = 0.35 * noise.n2(dx * 0.006 + t[0] * 9, y * 0.006) + 0.2 * noise.n2(dx * 0.017, y * 0.017 + t[0] * 5);
        const v = 1 - (dx * dx) / (hw * hw) - ((y - cy) * (y - cy)) / (hh * hh) * (y < cy ? 2.2 : 1) + lump;
        if (v > f) { f = v; tt = clamp((y - t[1]) / (0.7 * t[2]), 0, 1); }
      }
      const a = smoothstep(0, 0.3, f), lit = smoothstep(0.15, 0.9, tt + 0.3 * f);
      const ridge = ridgeAt[i], rk = 1 - smoothstep(ridge - 12, ridge + 12, y), al = Math.max(a * 0.92, rk);
      const c0 = lerp(lerp(cols.shade[0], cols.lit[0], lit), cols.shore[0], rk), c1 = lerp(lerp(cols.shade[1], cols.lit[1], lit), cols.shore[1], rk), c2 = lerp(lerp(cols.shade[2], cols.lit[2], lit), cols.shore[2], rk);
      data[o] = clamp(c0 * 255, 0, 255); data[o + 1] = clamp(c1 * 255, 0, 255); data[o + 2] = clamp(c2 * 255, 0, 255); data[o + 3] = clamp(al * 255, 0, 255);
    }
    if (j % 8 === 7) await yieldFn();
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}

// THE SHELF ROUND EVERY ISLAND, as a map for the sea's colour: 256 x 256 over a square of side 2 * ext round the
// lake's heart; each dot holds the metres from there to the nearest shore, as a share of SHELF metres (0 at a shore
// and on land, 1 from SHELF metres out). isles: [{ x, z, shore: Float32Array(256) of the shore's radius by bearing }].
const SHELF = 180;
async function makeShoal(isles, ext, yieldFn) {
  const N = 256, data = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) {
    const z = ((j + 0.5) / N * 2 - 1) * ext;
    for (let i = 0; i < N; i++) {
      const x = ((i + 0.5) / N * 2 - 1) * ext; let best = SHELF;
      for (const q of isles) {
        const dx = x - q.x, dz = z - q.z, d = Math.hypot(dx, dz);
        if (d > q.rMax + SHELF) continue;
        const a = (Math.atan2(dz, dx) / TAU + 1) % 1 * 256, i0 = Math.floor(a) % 256, f = a - Math.floor(a);
        best = Math.min(best, d - (q.shore[i0] * (1 - f) + q.shore[(i0 + 1) % 256] * f));
      }
      const o = (j * N + i) * 4, v = clamp(best / SHELF, 0, 1) * 255;
      data[o] = v; data[o + 1] = v; data[o + 2] = v; data[o + 3] = 255;
    }
    if (j % 16 === 15) await yieldFn();
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}
const HASH2 = /* glsl */`
float seaHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
`;
const SEA_VERT = /* glsl */`
varying vec3 vWp;
${GLSL_HERD}
${GLSL_SEA}
void main(){
  vec3 wp = (modelMatrix*vec4(position, 1.)).xyz;
  wp.y = waveH(wp.xz, uTime);
  vWp = wp;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.);
}`;
const SEA_FRAG = /* glsl */`
uniform sampler2D tRip, tPano;
uniform vec3 uSunDir, uSunCol, uFogCol, uSkyHor, uSkyZen, uCloudCol, uCloudShade, uFoam, uPortalCol;
uniform float uFogDen, uGlint, uSeaLit, uWake, uIsleLit, uBoatY;
uniform vec4 uRing, uPortal, uGate, uBreath[2], uIsle[8], uFall[2];
uniform vec2 uBullR;
varying vec3 vWp;
${GLSL_HERD}
${GLSL_SEA}
${GLSL_WATER}
${GLSL_DEEP}
${HASH2}
// WHAT THE WATER MIRRORS along the ray R from the place P on it, over the sky's own colour there: the far shore and the
// cloud towers (the picture tPano, on a wall three kilometres from the lake's heart) and the islands, each as the dome
// it is (uIsle: x, z, radius, height), upside down in the calm and hazed with their distance. A RAY THAT MISSES A DOME
// MIRRORS NOTHING OF IT: the test is nothing where the ray passes beside the dome (k = 0), it begins beyond the dome's
// near shore along the ray (not a metre from the place on the water), and the soft half metre over the dome's
// outline shrinks with the outline's own height there; the haze is by the true distance to the island.
vec3 mirrorOf(vec3 P, vec3 R, vec3 sky){
  float hl = max(length(R.xz), 1e-3); vec2 hd = R.xz/hl; float e = R.y/hl;
  float b = dot(P.xz, hd), t = -b + sqrt(max(b*b - dot(P.xz, P.xz) + 9.0e6, 0.));
  vec2 q = P.xz + hd*t; float y = e*t;
  vec4 pn = texture2D(tPano, vec2(atan(q.y, q.x + 1e-3)/6.2831853 + 0.5, clamp(y/1200., 0.01, 0.99)));
  vec3 c = mix(sky, pn.rgb, pn.a*(1. - smoothstep(1100., 1200., y)));
  for (int i = 0; i < 8; i++){
    vec4 I = uIsle[i]; vec2 dc = I.xy - P.xz; float ta = dot(dc, hd), la = dc.x*hd.y - dc.y*hd.x;
    float k = clamp(1. - la*la/(I.z*I.z), 0., 1.), hI = I.w*k*sqrt(k)*0.85, yr = e*ta;
    float hit = smoothstep(0., 0.02, k)*smoothstep(0., 2., ta - I.z*sqrt(k))*step(0.5, I.w)*(1. - smoothstep(hI*0.9, hI*1.03 + 0.5*k + 1e-3, yr));
    vec3 ic = mix(mix(vec3(0.3, 0.27, 0.2), vec3(0.06, 0.19, 0.1), smoothstep(0.02, 0.1, yr/max(hI, 1.))), vec3(0.15, 0.36, 0.17), clamp(yr/max(hI, 1.), 0., 1.))*uIsleLit;
    float fd = uFogDen*length(dc); ic = mix(ic, uFogCol, 1. - exp(-fd*fd));
    c = mix(c, ic, hit);
  }
  return c;
}
void main(){
  vec2 p = vWp.xz;
  vec3 toCam = cameraPosition - vWp; float dist = length(toCam); vec3 V = toCam/max(dist, 1e-3);
  float rho = lakeRho(p), lane = laneAt(p, 0.), state = seaState(p);
  vec4 r3 = texture2D(tRip, p*0.0061 + uTime*vec2(0.0016, -0.001));
  // THE EDGE OF THE RUFFLED WATER is no line: tongues of sleek water reach out between the last ranks and ruffled
  // water reaches in between them (rw, a warped distance: it sets only the surface's small ripples and its foam).
  // How CLEAR the water is (calm) reads the plain distance, the one rule (calmAt) by which the whales, the deep and
  // the shafts of light are seen through it; so do the waves' heights (seaState).
  vec2 dl = p - uLake.xy; float th = atan(dl.y, dl.x + 1e-3);
  float rw = rho + (r3.b - 0.5)*0.24 + 0.035*sin(th*11. + r3.a*5.) + 0.02*sin(th*23. - uTime*0.05);
  // rough: 0 on the lake, 1 in the open, growing rank by rank; every rank further in is smoother and bluer-green
  float rough = roughOf(rw, lane);
  float sleek = 1. - smoothstep(0.02, 0.8, rough);
  float calm = calmOf(roughOf(rho, lane));
  vec2 g = vec2(0.); float h = 0., hShort = 0.;
  for (int i = 0; i < 6; i++){ vec4 w = uWave[i]; float a = dot(w.xy, p)*w.z - sqrt(9.81*w.z)*uTime + uWavePh[i]; g += w.xy*(w.z*w.w*cos(a)); h += w.w*sin(a); if (i >= 2) hShort += w.w*sin(a); }
  // (close round the boat the wind sea is broken down by her hull and her oars, as in the part's chopH)
  { vec2 rbp = p - uBoat.xy; float st = state*mix(0.3, 1., smoothstep(9., 400., dot(rbp, rbp))); g *= st; h *= st; }
  vec3 sg = swellGH(p); g += sg.xy; h += sg.z*0.6;
  // the calm's slow oily swell bends the mirror
  vec3 oil = oilGH(p, uTime); g += oil.xy; h += oil.z;
  float nearK = 1./(1. + dist*0.02), midK = 1./(1. + dist*0.004);
  // THE RIPPLE DOES NOT REPEAT OVER THE WATER: the four layers of ripple are read at places pushed about by two slow fields
  // of the sea itself (gusts some forty and some seventeen metres across), each layer by its own share, and the
  // wind's gusts make them steeper here and slacker there
  float gustA = r3.b, gustB = texture2D(tRip, vec2(p.y, -p.x)*0.0147 + uTime*vec2(0.0011, -0.0007) + 0.37).b;
  vec2 push = vec2(gustA, gustB) - 0.5;
  vec4 r1 = texture2D(tRip, p*0.19 + push*2.6 + uTime*vec2(0.021, 0.013));
  vec4 r2 = texture2D(tRip, p*0.047 - push*1.1 - uTime*vec2(0.008, 0.011));
  vec4 r1b = texture2D(tRip, vec2(p.x*0.34 - p.y*0.94, p.x*0.94 + p.y*0.34)*0.283 - push.yx*3.1 + uTime*vec2(0.03, 0.012));
  vec4 r2b = texture2D(tRip, vec2(p.x*0.45 + p.y*0.89, -p.x*0.89 + p.y*0.45)*0.071 + push.yx*1.4 + uTime*vec2(-0.006, 0.009));
  // cat's-paws: where a breath of wind touches the calm it is ruffled; between them it is glass
  float paw = smoothstep(0.48, 0.7, texture2D(tRip, p*0.0113 - uTime*vec2(0.002, 0.0011)).b);
  paw = max(paw, 0.75*smoothstep(0.52, 0.72, texture2D(tRip, vec2(p.x*0.031, p.y*0.052) + uTime*vec2(0.004, -0.003)).b));
  float chop = mix(0.55 + 0.9*gustB, mix(0.05, 0.32, paw), sleek);
  float windH = hShort*state;
  g += ((r1.xy - 0.5)*0.42*nearK + (r1b.xy - 0.5)*0.34*nearK + (r2.xy + r2b.xy - 1.)*0.4*midK)*chop*(0.55 + 0.45*state) + (r3.xy - 0.5)*0.14*(1. - sleek);
  // rings spreading on the calm: from seeded points that come and go, and from the two latest breaths of the nosing
  // calves (uBreath)
  float ring = 0.;
  if (calm > 0.02){
    // (the four cells of seeded points NEAREST this place: a ring spreads at most nineteen metres from a point that
    // lies five metres or more inside its own 24 m cell, and has all but died by seventeen, so none is cut off
    // where it crosses into the next cell)
    vec2 cg = p/24., ci = floor(cg - 0.5);
    for (int j = 0; j < 4; j++){
      vec2 c = ci + vec2(float(j - (j/2)*2), float(j/2));
      float hs = seaHash(c), per = 7. + 9.*hs, tt = fract(uTime/per + hs*13. + uPhase.z);
      vec2 ctr = (c + 0.2 + 0.6*vec2(hs, seaHash(c + 7.7)))*24.;
      vec2 dv = p - ctr; float d = length(dv) + 1e-3, rad = 0.4 + tt*per*1.15;
      float env = (1. - tt)*(1. - tt)*(1. - smoothstep(rad - 2.6, rad + 0.4, d))*smoothstep(0., 1.2, d);
      float ph = (d - rad)*3.4;
      env *= midK;
      g += (dv/d)*cos(ph)*env*0.085*calm;
      ring += env*sin(ph);
    }
    for (int j = 0; j < 2; j++){
      vec2 dv = p - uBreath[j].xy; float d = length(dv) + 1e-3, rad = 0.3 + uBreath[j].z*1.25;
      float env = uBreath[j].w*(1. - smoothstep(rad - 2.4, rad + 0.3, d))*smoothstep(0., 0.6, d);
      float ph = (d - rad)*4.2;
      g += (dv/d)*cos(ph)*env*0.12*calm;
      ring += env*sin(ph)*1.3;
    }
  }
  // the boat's way through the water: on the sleek her bow lays two arms of ripples back from the stem, dying away
  // astern by their own decay (to a third in eleven metres of water). They are a few soft uneven ripples close
  // along each arm (the water's own slow field bends them; a metre off the arm they are down to a third), not a
  // comb of straight bars.
  vec2 rb = p - uBoat.xy; float alB = dot(rb, uBoat.zw), lS = rb.x*uBoat.w - rb.y*uBoat.z, laB = abs(lS), aft = 2.75 - alB;
  float arm = laB - 0.3 - max(aft, 0.)*0.36 + (r2.b - 0.5)*0.7 + (r3.a - 0.5)*0.5;
  float vEnv = smoothstep(-0.5, 0.3, aft)*exp(-max(aft, 0.)*0.1)*exp(-abs(arm)*1.1)*sleek*(0.45 + 0.55*uWake);
  float vph = arm*5.2 + uTime*0.8 + uPhase.w;
  g += (sign(lS)*vec2(uBoat.w, -uBoat.z) + 0.36*uBoat.zw)*(cos(vph)*vEnv*0.17);
  vec3 N = normalize(vec3(-g.x, 1., -g.y));
  vec3 Nf = normalize(vec3(-g.x*0.36, 1., -g.y*0.36));
  float nv = clamp(dot(Nf, V), 0., 1.);
  float fr = 1. - nv; float F = 0.02 + 0.98*fr*fr*fr*fr*fr;
  F *= mix(0.74, 0.96, sleek);
  // the sleek: long glossy slicks that give the sky back even where we look steeply down
  float slick = texture2D(tRip, vec2(p.x*0.011 + p.y*0.004, p.y*0.0023 - p.x*0.001) + uTime*vec2(0.0012, 0.0004)).b;
  F += sleek*(1. - F)*(0.06 + 0.06*smoothstep(0.4, 0.7, slick) + 0.08*paw);
  vec3 R = reflect(-V, N); R.y = abs(R.y) + 0.02; R = normalize(R);
  float e = clamp(R.y, 0.02, 1.);
  vec3 sky = mix(uSkyHor, uSkyZen, pow(e, 0.55));
  // the clouds in the mirror: lit heads, shaded bases
  float cl = texture2D(tRip, R.xz/(R.y + 0.4)*0.21 + uTime*vec2(0.002, 0.001)).b;
  sky = mix(sky, mix(mix(sky, uCloudShade, 0.4), uCloudCol, smoothstep(0.58, 0.86, cl)), smoothstep(0.5, 0.72, cl)*0.8*(0.35 + 0.65*sleek));
  // cat's-paws: a ruffled patch gives back the blue overhead, darker than the mirror round it
  // (in broken water the far things come back only as a blur: the mirror's ray is taken from a flatter surface there)
  { float mk = mix(0.25, 1., sleek); vec3 Rm0 = reflect(-V, normalize(vec3(-g.x*mk, 1., -g.y*mk))); Rm0.y = abs(Rm0.y) + 0.02; sky = mirrorOf(vWp, normalize(Rm0), sky); }
  sky = mix(sky, uSkyZen*0.85, 0.65*paw*sleek);
  // the sun in the water: a broad glitter on the chop; on the sleek a long narrow path of flashes, drawn out toward us
  // by the oily swell and broken by the finest ripples
  vec2 gq = g + ((r1.xy - 0.5)*0.55 + (r1b.xy - 0.5)*0.45)*sleek*(0.22 + 0.5*paw);
  vec3 Rg = reflect(-V, normalize(vec3(-gq.x, 1., -gq.y))); Rg.y = abs(Rg.y) + 0.02; Rg = normalize(Rg);
  float sd = clamp(dot(Rg, uSunDir), 0., 1.);
  vec3 glint = uSunCol*uGlint*min(pow(sd, mix(420., 600., sleek))*5. + pow(sd, 24.)*0.07*(1. - sleek), mix(6., 1.2, sleek));
  // the water's own colour outside the calm: a clear blue, greener in patches and in the crests the sun shines
  // through, and over the shelf the bed's pale light
  float bedD = bedDepth(p); vec3 bedL = bedLight(bedD);
  vec3 open = mix(uSeaDeep, uTurq, 0.27 + 0.18*gustA)*uSeaLit*(0.8 + 0.4*clamp(0.5 + h*0.9, 0., 1.)) + uTurq*uSeaLit*0.3*smoothstep(0.1, 0.8, h*1.3 + (r2.b - 0.5)*0.6)*(1. - sleek) + bedL*uSeaLit*0.8;
  // from the fourth rank in the sea goes greener and bluer rank by rank, until the water clears
  vec3 body = mix(open, mix(uSeaDeep, uTurq, 0.55)*uSeaLit*0.9, (1. - smoothstep(0.1, 1., rough))*(1. - calm));
  // cloud shadows going over the sea
  float shadow = smoothstep(0.42, 0.82, texture2D(tRip, p*0.0013 + uTime*vec2(0.0005, 0.0002)).b)*(1. - 0.65*calm);
  body *= 1. - 0.42*shadow; sky *= 1. - 0.2*shadow;
  float see = mix(0.62 + 0.33*smoothstep(0.1, 0.5, V.y), 1., calm);
  // looked into steeply the calm still has a skin: fine threads of sky drifting on it, the bow's ripples, the rings
  float skin = smoothstep(0.45, 0.85, r2.b)*0.35 + smoothstep(0.55, 0.9, r2b.b*0.6 + r1.b*0.4)*0.3*nearK + paw*0.25 + (0.5 + 0.5*cos(vph))*vEnv*0.5;
  float bowRip = (0.5 + 0.5*cos(vph))*vEnv;
  // (THE SURFACE SHOWS OVER WHAT IS UNDER IT: the threads of sky on the calm's skin, the rings and the sun's flashes
  // lie over every whale under the water, so a body looked down on is seen THROUGH a surface)
  vec3 C = F*sky + glint + (1. - F)*(1. - see)*body + uSkyHor*(max(ring, 0.)*0.14 + skin*0.13 + bowRip*0.16)*calm*(1. - 0.5*shadow);
  float A = 1. - (1. - F)*see + (abs(ring)*0.06 + skin*0.09 + bowRip*0.1)*calm;
  // white water only where a body or the bow breaks the sea: churned lanes where the ranks go round, worst in the
  // inner rings (the wind's chop itself carries no foam)
  // (THE FOAM'S LACE DOES NOT REPEAT: it is read at places pushed about by the sea's two slow fields, as the ripples
  // are, and a third field some fifty metres across makes its patches larger here and smaller there)
  float lace = texture2D(tRip, p*0.33 + push*3.3 + uTime*vec2(0.02, 0.006)).a;
  float rEq = rho*uLake.z, q = (rEq - uRing.x)/uRing.y;
  float inRings = step(-0.5, q)*step(q, uRing.z - 0.5);
  float wake = (1. - smoothstep(0.08, 0.5, abs(fract(q + 0.5) - 0.5)*2.))*inRings*(1. - sleek)*smoothstep(0.3, 0.7, r2.a + 0.25*r3.b);
  // (and where the bulls' two ranks go round, outside the cows')
  wake = max(wake, (1. - smoothstep(1.6, 9., min(abs(rEq - uBullR.x), abs(rEq - uBullR.y))))*smoothstep(0.3, 0.7, r2.a + 0.25*r3.b));
  // where the great bull broke out and where it fell (uFall: x, z, seconds since, metres): a boil of white that
  // spreads and thins, and a ring of broken water going out from it
  float fallA = 0.;
  for (int j = 0; j < 2; j++){
    vec4 Fl = uFall[j]; float ag = Fl.z;
    if (ag > 0.){
      float dF = length(p - Fl.xy), rad = Fl.w*(0.45 + 0.09*min(ag, 12.));
      float boil = (1. - smoothstep(0.55*rad, rad, dF + (lace - 0.5)*0.3*rad))*smoothstep(0., 0.25, ag)*exp(-ag*0.12);
      float crest = (1. - smoothstep(0., 1.2 + 0.25*ag, abs(dF - 0.4*Fl.w - 3.4*ag)))*exp(-ag*0.3);
      fallA = max(fallA, max(boil, 0.7*crest));
    }
  }
  // the last foam trailing in over the sleek: long streaks drawn out toward the lake (forty tiles round, no seam)
  float trail = smoothstep(0.55, 0.9, texture2D(tRip, vec2(th*6.3661977, rho*uLake.z*0.0045 + uTime*0.0015)).a)
    *smoothstep(0., 0.06, rough)*(1. - smoothstep(0.2, 0.55, rough))*(1. - lane);
  // the boat's bow wave: two feathers of white water falling away from the stem, gone by their own decay astern
  // (to a third in twenty metres of water)
  float feather = smoothstep(-0.25, 0.3, aft)*exp(-max(aft, 0.)*0.05)*(1. - smoothstep(0.25, 0.8 + max(aft, 0.)*0.34, abs(laB - 0.2 - aft*0.4)));
  // SHE SITS IN THE WATER. Her outline at the height the water stands against her (her frame: alB along her from
  // her origin, laB across; her beam and her section as she is built); outD = metres outside it. Along it the
  // water she parts breaks white (more the faster she goes) and a dark wet line lies against her planks; astern of
  // her stern post her wake trails, a band of broken white that widens and dies (to a third in twenty metres).
  float sBt = clamp((5.8 + alB)/8.5, 0., 1.), bmB = 0.95*pow(max(1. - pow(abs(2.*sBt - 1.), 2.3), 0.), 0.72), yBt = vWp.y - uBoatY;
  float fBt = yBt < 0.02 ? mix(0.5, 0.7, clamp((yBt + 0.3)/0.32, 0., 1.)) : yBt < 0.26 ? mix(0.7, 0.84, (yBt - 0.02)/0.24) : mix(0.84, 0.95, clamp((yBt - 0.26)/0.24, 0., 1.));
  float outD = length(vec2(max(laB - bmB*fBt, 0.), max(max(alB - 2.7, -5.8 - alB), 0.)));
  float hullWash = (1. - smoothstep(0.03, 0.3 + 0.45*uWake, outD))*(0.55 + 0.45*uWake);
  float asternB = -5.8 - alB;
  float sternWake = smoothstep(-0.3, 0.8, asternB)*exp(-max(asternB, 0.)*0.055)*(1. - smoothstep(0.35 + max(asternB, 0.)*0.1, 0.9 + max(asternB, 0.)*0.2, laB));
  // WHITE CAPS: where the wind's short seas (fifteen metres and under) stand highest, and most where a gust blows,
  // their crests break: two or three metres of torn white lace each, in the open only (none on the sleek or in the lane)
  float cap = smoothstep(0.17, 0.25, windH + 0.05*(gustB - 0.5))*(1. - sleek)*smoothstep(0.6, 1., rough);
  float amt = clamp(wake*0.45 + feather*(0.3 + 0.9*uWake)*mix(1.2, 0.7, sleek) + trail*0.72 + fallA + cap + hullWash*1.3 + sternWake*(0.45 + 0.7*uWake)*mix(1.1, 0.7, sleek), 0., 1.);
  float lace2 = texture2D(tRip, vec2(p.x*0.8 - p.y*0.6, p.x*0.6 + p.y*0.8)*0.097 - push.yx*1.7 - uTime*vec2(0.011, 0.004)).a;
  float lf = lace*0.62 + lace2*0.5 + (texture2D(tRip, p*0.021 + 0.61).a - 0.5)*0.22;
  float foam = smoothstep(1.08 - amt*0.8, 1.32 - amt*0.8, lf)*step(0.01, amt);
  C = mix(C, uFoam*(0.82 + 0.18*lace)*(1. - 0.3*shadow), foam); A = mix(A, 1., foam);
  // (the dark wet line where the water lies against her)
  { float wetL = (1. - smoothstep(0.02, 0.16, outD))*(1. - foam)*0.5; C *= 1. - wetL; A = mix(A, 1., wetL); }
  // THE GATE stands half in the water. What of it is under the surface is not seen through the water; in its place,
  // and out over the calm in front of it, lies the gate's own image, broken by the ripples
  vec3 dv = vWp - cameraPosition, ld = vec3(uLane.x, 0., uLane.y);
  float tg = ((uGate.x - cameraPosition.x)*uLane.x + (uGate.z - cameraPosition.z)*uLane.y)/max(dv.x*uLane.x + dv.z*uLane.y, 1e-3);
  float gate = step(1., tg)*(1. - smoothstep(uGate.w + 0.2, uGate.w + 0.7, length(cameraPosition + dv*tg - uGate.xyz)));
  vec3 Cg = F*sky + glint + (1. - F)*mix(body, deepColor(clamp(V.y, 0.02, 1.), calm)*uSeaLit, calm);
  Cg = mix(Cg, uFoam*(0.82 + 0.18*lace)*(1. - 0.3*shadow), foam);
  C = mix(C, Cg, gate); A = mix(A, 1., gate);
  vec3 Rm = reflect(-V, normalize(vec3(-g.x*0.7, 1., -g.y*0.7))); Rm.y = abs(Rm.y);
  float front = dot(uGate.xyz - vWp, ld), tm = front/max(dot(Rm, ld), 1e-3);
  float rr = length(vWp + Rm*tm - uGate.xyz)/uGate.w;
  float image = (1. - smoothstep(0.9, 1.04, rr))*step(0.5, front)*uPortal.w;
  float imageK = image*clamp(0.3 + 0.3*F + 0.45*r2.a + 0.25*(r1.a - 0.5), 0., 0.95);
  C = mix(C, uPortalCol*(0.7 + 0.75*smoothstep(0.5, 1., rr)), imageK); A = max(A, image*0.92);
  // and where it stands a ring of light lies on the surface and spreads
  vec2 dp = p - uPortal.xy; float alG = dot(dp, uLane.xy), laG = dp.x*uLane.y - dp.y*uLane.x;
  float dG = length(vec2(max(abs(laG) - sqrt(max(uGate.w*uGate.w - uGate.y*uGate.y, 0.01)), 0.), alG));
  float rip = 0.5 + 0.5*sin(dG*1.9 - uTime*1.3 + uPhase.y);
  // (strong at its foot, and a broad soft light going out over the water before it: half of it at ten metres)
  float glowG = uPortal.w*(exp(-dG*dG/9.)*0.5 + exp(-dG*1.6)*0.9 + 0.4*rip*rip*exp(-dG*0.14) + 0.3*exp(-dG*0.07));
  // the gate's light lying down the lane toward us
  vec2 tc = normalize(cameraPosition.xz - uPortal.xy + vec2(1e-3, 0.));
  float al = dot(dp, tc), la = dp.x*tc.y - dp.y*tc.x;
  float streak = uPortal.w*exp(-la*la/(uPortal.z*uPortal.z*0.3))*smoothstep(-3., 2., al)*exp(-max(al, 0.)/48.)*(0.45 + 1.1*r1.b*r2b.b);
  C += uPortalCol*(streak*0.55 + glowG*0.7); A = clamp(A + streak*0.36 + glowG*0.5, 0., 1.);
  // (the haze is warm toward the sun and cool away from it)
  float sunward = clamp(dot(normalize(-V.xz + vec2(1e-4, 0.)), normalize(uSunDir.xz + vec2(1e-4, 0.))), 0., 1.);
  float fd = uFogDen*dist, fog = 1. - exp(-fd*fd);
  C = mix(C, uFogCol*mix(vec3(1.), vec3(1.3, 1.1, 0.8), sunward*sunward), fog); A = mix(A, 1., fog);
  // NO WATER INSIDE HER: the sea's surface is left out within her own outline at the height the water stands
  // against her (her frame: alB along her from her origin, laB across; her beam and her section as she is built)
  { float keep = mix(1., smoothstep(bmB*fBt - 0.03, bmB*fBt, laB), step(-5.8, alB)*step(alB, 2.7));
    C *= keep; A *= keep; }
  gl_FragColor = vec4(C, A);
}`;

// The blue under the surface: what is seen where nothing swims. Cobalt straight down, turquoise at a glance.
const DEEP_VERT = /* glsl */`
varying vec3 vWp;
void main(){ vec4 wp = modelMatrix*vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`;
const DEEP_FRAG = /* glsl */`
uniform float uSeaLit;
varying vec3 vWp;
${GLSL_HERD}
${GLSL_WATER}
${GLSL_DEEP}
void main(){
  vec3 V = normalize(vWp - cameraPosition);
  vec2 s = cameraPosition.xz + V.xz*(max(cameraPosition.y, 0.)/clamp(-V.y, 0.02, 1.));
  gl_FragColor = vec4(deepSeen(cameraPosition, V, calmAt(s), uTime, uSeaLit), 1.);
}`;

// The sun's shafts in the lake: thin leaning beams of light, each standing at its own place in the water on its own
// slow flicker. Two crossed leaves to a beam, so nothing here turns to face the eye. THEY ARE UNDER THE WATER, and
// what is under the water is seen through its surface by the steepness of the sight (the rule of the whales' shades,
// the part's SHADE_VERT): whole where the sight goes down at twenty-five degrees or more, nothing under ten, where
// the calm gives back the sky. So from over the lake they stand in the blue below, and from a bow's height along
// the calm none lies across the water as a pale streak.
const SHAFT_VERT = /* glsl */`
attribute vec4 iS;
uniform vec3 uShaftDir;
varying vec3 vK;
${GLSL_HERD}
${GLSL_REFRACT}
void main(){
  float sway = uTime*(0.11 + 0.1*fract(iS.w*5.3)) + iS.w*23.;
  vec3 base = vec3(iS.x + 1.6*sin(sway), 0., iS.y + 1.6*cos(sway*0.83));
  float len = 18. + 18.*fract(iS.w*7.13);
  vec3 a1 = normalize(cross(uShaftDir, vec3(0.31, 0., 0.95))), a2 = cross(uShaftDir, a1);
  vec3 wp = base + uShaftDir*(position.y*len) + mix(a1, a2, position.z)*(position.x*iS.z*(0.5 + 1.1*position.y));
  float flick = 0.5 + 0.5*sin(uTime*(0.5 + 0.7*fract(iS.w*3.7)) + iS.w*40.);
  vec3 Vw = cameraPosition - base;
  float glance = smoothstep(0.17, 0.42, Vw.y*inversesqrt(max(dot(Vw, Vw), 1e-4)));
  vK = vec3(position.x, position.y, (0.3 + 0.7*flick)*calmAt(base.xz)*glance);
  vec4 ap = seenThroughWater(wp, cameraPosition);
  gl_Position = projectionMatrix*viewMatrix*vec4(ap.xyz, 1.);
}`;
const SHAFT_FRAG = /* glsl */`
uniform vec3 uShaftCol;
varying vec3 vK;
void main(){
  float x = clamp(vK.x, -1., 1.), y = clamp(vK.y, 0., 1.);
  float e = 1. - x*x;
  float a = e*e*e*smoothstep(0., 0.05, y)*(1. - y)*(1. - y)*clamp(vK.z, 0., 1.);
  gl_FragColor = vec4(uShaftCol*a*0.04, 1.);
}`;

// A green-headed island of the straits: steep sides, a domed top in jungle, a pale foot.
// its outline: the radius at bearing a, in shares of R (ox, oz: the island's own place in the noise)
const islandLump = (noise, ox, oz, a) => { const ca = Math.cos(a), sa = Math.sin(a); return 1 + 0.28 * noise.n2(ca * 1.4 + ox, sa * 1.4 + oz) + 0.1 * noise.n2(ca * 4 + oz, sa * 4 + ox); };
// THE ISLAND'S HEIGHT at (x, z) from its own middle (t: the share of the way out to its outline; the shore line
// lies at t = 0.955). From the sea inward: a beach apron rising three metres; then a bank or a CLIFF (by the
// bearing, from the island's own noise: on some coasts a low bank four hundredths of the island's height behind a
// broad beach, on others a rock wall up to three tenths of it standing almost in the water, its line wandering in
// headlands and coves); then the heights, cut by ridges and gullies that run down from the top.
const islandY = (noise, R, H, ox, oz, x, z, t) => {
  const a = Math.atan2(z, x), ca = Math.cos(a), sa = Math.sin(a);
  const cl = smoothstep(-0.15, 0.3, noise.n2(ca * 2.2 + ox * 3.1, sa * 2.2 + oz * 3.1));
  const tc = lerp(0.85, 0.93, cl) + 0.012 * noise.n2(ca * 9 + oz, sa * 9 + ox), wallH = H * lerp(0.04, 0.3, cl) * (0.75 + 0.25 * noise.n2(ca * 5 + ox, sa * 5 + oz));
  const f = noise.fbm2(x * 0.006 + ox, z * 0.006 + oz, 3), rg = 1 - Math.abs(noise.n2(x * 0.0065 + oz * 1.7, z * 0.0065 + ox * 1.3));
  const dome = (1 - smoothstep(0.42, tc, t)) * (0.62 + 0.38 * (1 - t)) * (0.75 + 0.5 * f) * (0.78 + 0.3 * rg * rg);
  const apron = 3 * Math.pow(clamp((0.955 - t) / 0.06, 0, 1), 0.8) - 6 * smoothstep(0.955, 1, t);
  return apron + wallH * (1 - smoothstep(tc - 0.006, tc + 0.022, t)) + (H - wallH) * dome;
};
// THE LAND'S OWN LIGHT AND COLOUR (islands and palms). The jungle is TREES: crowns six to eleven metres across from
// the place's own cells, each a round head lit on its sunward side with a dark gap round it (the pattern is
// filtered by its own rate of change, as a texture is, where a crown is finer than the sampling); where the ground is
// steep, ROCK in strata with dark clefts; at the sea's edge on a gentle shore, pale SAND, darker where it is wet;
// wet black rock at a cliff's foot. Lit by the sun and the sky of the hour (the side away from the sun stands in
// blue shade), hazed with distance.
const LAND_VERT = /* glsl */`
attribute vec3 color;
#ifdef PALM
attribute vec4 iP, iQ;
uniform float uTime;
#endif
varying vec3 vWp, vN, vC;
void main(){
  vec3 p = position, n = normal;
#ifdef PALM
  // a palm: set at its place (iP: x, y, z, height), turned (iQ.x), swaying from the foot up with the trade wind
  float c = cos(iQ.x), s = sin(iQ.x); p.xz = vec2(c*p.x + s*p.z, -s*p.x + c*p.z); n.xz = vec2(c*n.x + s*n.z, -s*n.x + c*n.z);
  float sw = p.y*p.y*(0.05*sin(uTime*0.9 + iQ.z) + 0.03*sin(uTime*2.3 + iQ.z*1.7) + 0.06);
  p = p*iP.w + iP.xyz; p.x += sw*iP.w*iQ.y; p.z += sw*iP.w*iQ.w;
  vec4 wp = vec4(p, 1.);
#else
  vec4 wp = modelMatrix*vec4(p, 1.);
#endif
  vWp = wp.xyz; vN = n; vC = color;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;
const LAND_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounce, uFogCol; uniform float uFogDen, uLandLit;
varying vec3 vWp, vN, vC;
float lh(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
float ln(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); return mix(mix(lh(i), lh(i + vec2(1., 0.)), f.x), mix(lh(i + vec2(0., 1.)), lh(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  vec3 c = vC;
#ifndef PALM
  float t1 = ln(vWp.xz*0.16), t2 = ln(vWp.xz*0.37 + 17.);
  // the crowns: the nearest of the cells' own trees (a cell 8 m; nine cells looked at)
  vec2 cp = vWp.xz*0.125, ci = floor(cp), cf = cp - ci; float d1 = 9.; vec2 to = vec2(0.), sid = vec2(0.);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)), site = o + vec2(lh(ci + o), lh(ci + o + 41.3))*0.8 + 0.1 - cf; float dd = dot(site, site);
    if (dd < d1) { d1 = dd; to = site; sid = ci + o; }
  }
  d1 = sqrt(d1);
  vec2 fw = fwidth(cp); float fine = 1. - smoothstep(0.35, 1.1, max(fw.x, fw.y));
  float head = 1. - smoothstep(0.1, 0.62, d1), gap = smoothstep(0.42, 0.75, d1);
  float steep = 1. - smoothstep(0.5, 0.74, N.y), low = 1. - smoothstep(1.2, 3.6, vWp.y);
  float beach = low*(1. - steep), wet = 1. - smoothstep(0.15, 0.9, vWp.y);
  // every crown has a green of its own: darker and bluer, or paler and yellower; one in nine stands pale (in flower
  // or dry); and the forest lies in broad patches of shade and light of its own
  float ct = lh(sid*1.7 + 3.1), pale = step(0.89, lh(sid*2.3 + 11.7));
  vec3 crownC = mix(mix(vec3(0.72, 0.88, 0.82), vec3(1.28, 1.16, 0.74), ct), vec3(1.7, 1.55, 0.95), pale*0.6);
  vec3 jungle = c*mix(vec3(0.95), crownC*(0.62 + 0.55*head)*(1. - 0.35*gap), fine)*(0.62 + 0.76*t1*t2);
  jungle = mix(vec3(dot(jungle, vec3(0.3, 0.6, 0.1))), jungle, 0.74);
  float strata = smoothstep(0.3, 0.7, fract(vWp.y*0.16 + 0.8*t1)), cleft = smoothstep(0.55, 0.8, ln(vec2(vWp.x + vWp.z, vWp.x - vWp.z)*0.22));
  vec3 rock = mix(vec3(0.5, 0.45, 0.38), vec3(0.3, 0.27, 0.23), strata)*(0.75 + 0.5*t2)*(1. - 0.55*cleft);
  rock = mix(rock, vec3(0.07, 0.065, 0.06), wet*0.85);
  // (SUNLIT ROCK IS DARKENED: a rock face loses up to six tenths of its tone as it turns square to the sun, so a
  // face in full sun comes out about as bright as one in shade and no cliff wall stands as one pale face)
  rock *= 1. - 0.6*smoothstep(0.2, 0.8, dot(N, uSunDir));
  vec3 sand = mix(vec3(0.9, 0.84, 0.66), vec3(0.6, 0.54, 0.42), wet)*(0.92 + 0.16*t2);
  c = mix(jungle, rock, steep*(0.7 + 0.3*t1));
  c = mix(c, sand, beach);
  // a crown's head leans its light toward the sun: the normal tilts away from the tree's middle
  N = normalize(N + (1. - steep)*(1. - beach)*fine*0.9*vec3(-to.x, 0., -to.y)*smoothstep(0.05, 0.5, d1));
#endif
  float ndl = clamp(dot(N, uSunDir), 0., 1.);
  vec3 col = c*uLandLit*(uSunCol*ndl*0.85 + mix(uBounce, uSkyCol, N.y*0.5 + 0.5)*0.55);
  // the haze is warm toward the sun and cool away from it
  vec3 vd = vWp - cameraPosition; float fd = uFogDen*length(vd), sunward = clamp(dot(normalize(vd.xz + vec2(1e-4, 0.)), normalize(uSunDir.xz + vec2(1e-4, 0.))), 0., 1.);
  gl_FragColor = vec4(mix(col, uFogCol*mix(vec3(1.), vec3(1.3, 1.1, 0.8), sunward*sunward), 1. - exp(-fd*fd)), 1.);
}`;
// rain falling from one far tower: a veil of slanted streaks, heavier and lighter falls, sliding on the world clock
const RAIN_VERT = /* glsl */`
uniform float uLean; varying vec2 vUv;
void main(){ vUv = uv; vec3 p = position; p.x += (1. - uv.y)*uLean; gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.); }`;
const RAIN_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uCol; varying vec2 vUv;
float rh(float x){ return fract(sin(x*127.1)*43758.5453); }
float rn(float x){ float i = floor(x), f = fract(x); f = f*f*(3. - 2.*f); return mix(rh(i), rh(i + 1.), f); }
void main(){
  float st = 0.5 + 0.5*rn(vUv.x*46. + 0.6*rn(vUv.y*5. + uTime*0.3));
  float fall = 0.35 + 0.65*rn(vUv.x*5. + 3. + uTime*0.015);
  float a = st*fall*smoothstep(0., 0.25, vUv.x)*(1. - smoothstep(0.75, 1., vUv.x))*(1. - smoothstep(0.7, 1., vUv.y))*(0.5 + 0.5*vUv.y);
  gl_FragColor = vec4(uCol, a*0.78);
}`;
// DIVING BIRDS (terns and boobies): each keeps a closed round of its own on the world clock and once a lap folds its
// wings, plunges to the water, is under for a moment and climbs back. iP = (centre x, z, radius, height),
// iQ = (phase, seconds to a lap, wing span, sense of the round); aW = 0 on the body .. 1 at a wing's tip.
const BIRD_VERT = /* glsl */`
attribute vec4 iP, iQ; attribute float aW;
uniform float uTime, uFogDen; varying float vW, vFog, vLit; uniform vec3 uSunDir;
vec3 course(float t){
  float f = fract(t), a = iQ.w*6.2832*t + iQ.x*40.;
  float d = smoothstep(0.52, 0.6, f)*(1. - smoothstep(0.66, 0.86, f));
  return vec3(iP.x + cos(a)*iP.z, iP.w*(1. - 1.1*d) + 0.6*sin(t*31. + iQ.x*9.), iP.y + sin(a)*iP.z);
}
void main(){
  float t = uTime/max(iQ.y, 1.) + iQ.x, f = fract(t);
  vec3 c = course(t), fw = normalize(course(t + 0.003) - c + vec3(1e-5, 0., 0.));
  vec3 rt = normalize(vec3(fw.z, 0., -fw.x) + vec3(1e-5, 0., 0.)), up = cross(rt, fw);
  float fold = smoothstep(0.5, 0.56, f)*(1. - smoothstep(0.66, 0.74, f)), s = 0.5*iQ.z;
  float flap = sin(uTime*(11. - 3.*iQ.z) + iQ.x*50.)*(1. - fold)*0.55;
  vec3 l = vec3(position.x*mix(1., 0.22, fold), aW*flap - 0.25*aW*aW*abs(flap), position.z - aW*fold*0.5)*s;
  vec3 p = c + rt*l.x + up*l.y + fw*l.z*1.1;
  vW = aW; vLit = 0.55 + 0.45*clamp(dot(normalize(up + rt*sign(position.x)*flap), uSunDir), 0., 1.);
  vec4 mv = viewMatrix*vec4(p, 1.); float fd = uFogDen*length(mv.xyz); vFog = 1. - exp(-fd*fd);
  gl_Position = projectionMatrix*mv;
}`;
const BIRD_FRAG = /* glsl */`
uniform vec3 uSunCol, uSkyCol, uFogCol; varying float vW, vFog, vLit;
void main(){
  vec3 col = mix(vec3(0.92, 0.93, 0.9), vec3(0.1, 0.1, 0.11), smoothstep(0.62, 0.9, vW))*(uSkyCol*0.6 + uSunCol*0.75*vLit);
  gl_FragColor = vec4(mix(col, uFogCol, vFog), 1.);
}`;
function birdGeometry() {
  const P = [], Wt = [], I = [];
  const v = (x, z, w) => { P.push(x, 0, z); Wt.push(w); return P.length / 3 - 1; };
  const n = v(0, 0.5, 0), t = v(0, -0.5, 0), l = v(-0.08, 0, 0), r = v(0.08, 0, 0);
  I.push(n, l, r, t, r, l);
  for (const s of [-1, 1]) {
    const a = v(s * 0.08, 0.17, 0), b = v(s * 0.08, -0.12, 0), m = v(s * 0.55, 0.14, 0.5), tip = v(s, -0.1, 1);
    I.push(a, m, b, m, tip, b);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(Wt, 1)); g.setIndex(I);
  return g;
}
// a coconut palm one unit high: a leaning three-sided trunk and six drooping fronds
function palmGeometry() {
  const pos = [], colr = [], idx = [], bark = [0.3, 0.24, 0.17], leaf = [0.16, 0.42, 0.14], leaf2 = [0.27, 0.5, 0.16];
  const v = (x, y, z, c) => { pos.push(x, y, z); colr.push(c[0], c[1], c[2]); return pos.length / 3 - 1; };
  const lean = (y) => 0.1 * y * y, rings = [];
  for (let i = 0; i <= 2; i++) { const y = i / 2, r = 0.034 - 0.014 * y, ring = []; for (let j = 0; j < 3; j++) { const a = j / 3 * TAU; ring.push(v(lean(y) + Math.cos(a) * r, y, Math.sin(a) * r, bark)); } rings.push(ring); }
  for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) { const k = (j + 1) % 3; idx.push(rings[i][j], rings[i + 1][j], rings[i + 1][k], rings[i][j], rings[i + 1][k], rings[i][k]); }
  for (let f = 0; f < 6; f++) {
    const a = f / 6 * TAU + 0.4, dx = Math.cos(a), dz = Math.sin(a), wx = -dz * 0.06, wz = dx * 0.06, c = f % 2 ? leaf : leaf2, row = [];
    for (const [l, h, w] of [[0.02, 0, 0.5], [0.24, 0.07, 1], [0.44, -0.1, 0.25]]) row.push([v(lean(1) + dx * l - wx * w, 1 + h, dz * l - wz * w, c), v(lean(1) + dx * l + wx * w, 1 + h, dz * l + wz * w, c)]);
    for (let i = 0; i < 2; i++) idx.push(row[i][0], row[i][1], row[i + 1][1], row[i][0], row[i + 1][1], row[i + 1][0]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
// SURF: a band of white water lying round an island's shore on the sea (uv.y: 0 at the shore, 1 at its seaward edge,
// sixteen metres out); the seas come in set after set and wash up the foot of the land
const SURF_VERT = /* glsl */`
uniform float uFogDen;
varying vec2 vUv; varying float vFog;
${GLSL_HERD}
${GLSL_SEA}
void main(){
  vec3 wp = position; wp.y = waveH(wp.xz, uTime) + 0.07;
  vUv = uv;
  vec4 mv = viewMatrix*vec4(wp, 1.); float fd = uFogDen*length(mv.xyz); vFog = 1. - exp(-fd*fd);
  gl_Position = projectionMatrix*mv;
}`;
const SURF_FRAG = /* glsl */`
uniform vec3 uFoam, uFogCol; uniform float uTime;
varying vec2 vUv; varying float vFog;
float lh(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
float ln(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); return mix(mix(lh(i), lh(i + vec2(1., 0.)), f.x), mix(lh(i + vec2(0., 1.)), lh(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  float s = clamp(vUv.y, 0., 1.), n = ln(vec2(vUv.x*0.05, 0.3)), f = fract(s*1.7 + uTime*0.12 + n*1.3);
  float crest = smoothstep(0.72, 0.97, f)*(1. - smoothstep(0.97, 1., f));
  float lace = ln(vec2(vUv.x*0.8, s*11. + uTime*0.35)), lace2 = ln(vec2(vUv.x*2.3, s*27. - uTime*0.2));
  float swash = (1. - smoothstep(0.05, 0.4, s))*(0.55 + 0.45*sin(uTime*0.55 + n*9.));
  float a = clamp(crest*(0.35 + 0.65*lace)*(1. - 0.6*s) + swash*(0.3 + 0.7*lace)*(0.5 + 0.5*lace2), 0., 1.)*(1. - smoothstep(0.8, 1., s));
  if (a < 0.004) discard;
  gl_FragColor = vec4(mix(uFoam*(0.85 + 0.15*lace2), uFogCol, clamp(vFog, 0., 1.))*a, a);
}`;
async function islandGeometry(noise, R, H, ox, oz, nr, na, yieldFn) {
  const pos = [], colr = [], idx = [];
  const g1 = col('#4c7f4c'), g2 = col('#2b4f38'), g3 = col('#86a05c');
  for (let i = 0; i <= nr; i++) {
    // (the rings stand closer toward the shore, where the cliff, the bank and the beach are)
    const t = Math.pow(i / nr, 0.58);
    for (let j = 0; j < na; j++) {
      const a = j / na * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const lump = islandLump(noise, ox, oz, a);
      const r = R * t * lump, x = ca * r, z = sa * r;
      let y = islandY(noise, R, H, ox, oz, x, z, t);
      if (i === nr) y = -6;
      pos.push(x, y, z);
      // the jungle's own greens (the rock and the sand are found in the shader, from the slope and the height)
      const hk = y / H, v = 0.5 + 0.5 * noise.n2(x * 0.02 + oz, z * 0.02 + ox);
      const g = g2.clone().lerp(g1, v).lerp(g3, smoothstep(0.55, 1.0, hk) * 0.5);
      colr.push(g.r, g.g, g.b);
    }
    if (i % 5 === 4) await yieldFn();
  }
  for (let i = 0; i < nr; i++) for (let j = 0; j < na; j++) {
    const a = i * na + j, b = i * na + (j + 1) % na, c = a + na, d = b + na;
    idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// THE WHALEBOAT, whole (she is seen from her own bow, where we stand, and from over the lake): slim white cedar,
// lapstrake, sharp at both ends; in the eyes of her the box with the box line coiled on it, the clumsy cleat behind
// it and the chocks in the stem head with the line led through; five thwarts with a man on each, his back to the
// bow; four oars pulling and the bow oar peaked; the line tub between the after thwarts; the cuddy board and the
// loggerhead; the steersman standing to the long steering oar. No iron and no lance in her.
// Boat space: the stem is 2.7 m ahead of the origin along -Z, the stern 5.8 m astern; y = 0 is the water. (The eye
// stands SEAT metres ahead of the origin, just behind the clumsy cleat.)
function bowGeometry() {
  // (row: what a vertex does at a stroke. w 0: nothing; w 1: it is of an oar that swings on its thole pin at xyz; w 2:
  // it is of a man who leans to his oar from his seat at height y)
  const pos = [], colr = [], idx = [], row = [];
  let cur = [0, 0, 0, 0];
  const v = (x, y, z, c) => { pos.push(x, y, z); colr.push(c[0], c[1], c[2]); row.push(cur[0], cur[1], cur[2], cur[3]); return pos.length / 3 - 1; };
  const quad = (a, b, c, d) => idx.push(a, b, c, a, c, d);
  const sc = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  const white = [0.62, 0.62, 0.58], wood = [0.3, 0.2, 0.11], cap = [0.38, 0.26, 0.14], rope = [0.5, 0.42, 0.25];
  const NS = 24, Z0 = 5.8, Z1 = -2.7;
  const beam = (s) => 0.95 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * s - 1), 2.3)), 0.72), sheer = (s) => 0.72 + 0.3 * (2 * s - 1) * (2 * s - 1) + 0.18 * Math.pow(Math.max(0, 2 * s - 1), 4);
  // THE PLANKING: five strakes a side from the keel to the gunwale, each a board of its own (its lower edge in the
  // shade of the lap above the next, its paint a little different from its neighbours'), and inside the same boards
  // in bare cedar
  const OUT = [[0.5, -0.3], [0.7, 0.02], [0.84, 0.26], [0.93, 0.5], [0.98, 0], [1.02, 0]], INN = [[1, 0], [0.92, 0.5], [0.8, 0.3], [0.55, 0.16], [0, 0.1]];
  for (const side of [1, -1]) {
    const c1 = [], c2 = [];
    for (let k = 0; k < 5; k++) {
      const tone = 0.9 + 0.1 * ((k * 7 + (side > 0 ? 0 : 3)) % 5) / 4, lo = [], hi = [], li = [], hj = [];
      for (let i = 0; i <= NS; i++) {
        const s = i / NS, z = lerp(Z0, Z1, s), b = beam(s), g = sheer(s);
        const y0 = k === 4 ? 0.5 + 0.55 * (g - 0.5) : OUT[k][1], y1 = k >= 3 ? (k === 3 ? 0.5 + 0.55 * (g - 0.5) : g) : OUT[k + 1][1];
        lo.push(v(side * b * OUT[k][0], y0, z, sc(white, tone * 0.62))); hi.push(v(side * (b * OUT[k + 1][0] + (k === 4 ? 0.02 : 0)), y1, z, sc(white, tone)));
        if (k < 4) {
          const ya = k === 0 ? g : INN[k][1], yb = INN[k + 1][1], t2 = 0.82 + 0.18 * ((k * 3 + i) % 4) / 3;
          li.push(v(side * (b * INN[k][0] - 0.05), ya, z, sc(wood, t2 * 1.15))); hj.push(v(side * Math.max(0, b * INN[k + 1][0] - (k < 3 ? 0.05 : 0)), yb, z, sc(wood, t2 * 0.8)));
        }
      }
      for (let i = 0; i < NS; i++) {
        if (side > 0) quad(lo[i], hi[i], hi[i + 1], lo[i + 1]); else quad(lo[i], lo[i + 1], hi[i + 1], hi[i]);
        if (k < 4) { if (side > 0) quad(li[i], li[i + 1], hj[i + 1], hj[i]); else quad(li[i], hj[i], hj[i + 1], li[i + 1]); }
      }
    }
    // the gunwale's cap, darker along its inner edge
    for (let i = 0; i <= NS; i++) { const s = i / NS, z = lerp(Z0, Z1, s), b = beam(s), g = sheer(s); c1.push(v(side * (b + 0.035), g + 0.025, z, cap)); c2.push(v(side * Math.max(0, b - Math.min(0.07, 0.3 * b)), g + 0.025, z, sc(cap, 0.7))); }
    for (let i = 0; i < NS; i++) { if (side > 0) quad(c1[i], c2[i], c2[i + 1], c1[i + 1]); else quad(c1[i], c1[i + 1], c2[i + 1], c2[i]); }
  }
  const box = (x0, y0, z0, x1, y1, z1, c) => {
    const p = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]].map((q) => v(q[0], q[1], q[2], c));
    quad(p[0], p[1], p[2], p[3]); quad(p[5], p[4], p[7], p[6]); quad(p[4], p[0], p[3], p[7]); quad(p[1], p[5], p[6], p[2]); quad(p[3], p[2], p[6], p[7]);
  };
  // a round thing lying along a line (rope, oar, pole): two crossed slats
  const slat = (a, b, w, c) => { for (const [ox, oy] of [[w, 0], [0, w]]) { const q = [v(a[0] - ox, a[1] - oy, a[2], c), v(a[0] + ox, a[1] + oy, a[2], c), v(b[0] + ox, b[1] + oy, b[2], c), v(b[0] - ox, b[1] - oy, b[2], c)]; quad(q[0], q[1], q[2], q[3]); } };
  // ribs inside and the floor boards
  const dark = [0.17, 0.115, 0.065], board = [0.34, 0.25, 0.15], board2 = [0.27, 0.2, 0.12], canvas = [0.66, 0.62, 0.52], iron = [0.1, 0.1, 0.11], oarC = [0.52, 0.42, 0.27];
  for (let i = 1; i < NS - 1; i++) {
    const s = (i + 0.5) / NS, z = lerp(Z0, Z1, s), b = beam(s), g = sheer(s);
    for (const side of [1, -1]) {
      const pr = [[b - 0.045, g - 0.02], [b * 0.92 - 0.045, 0.5], [b * 0.8 - 0.045, 0.3], [b * 0.55 - 0.045, 0.165]];
      for (let k = 0; k < 3; k++) {
        const a0 = v(side * pr[k][0], pr[k][1], z - 0.03, dark), a1 = v(side * pr[k][0], pr[k][1], z + 0.03, dark), b0 = v(side * pr[k + 1][0], pr[k + 1][1], z - 0.03, dark), b1 = v(side * pr[k + 1][0], pr[k + 1][1], z + 0.03, dark);
        if (side > 0) quad(a0, b0, b1, a1); else quad(a0, a1, b1, b0);
      }
    }
  }
  for (let k = -2; k <= 2; k++) box(k * 0.118 - 0.054, 0.12, 4.6, k * 0.118 + 0.054, 0.185, -1.7, k % 2 ? board2 : board);
  // THE BOW. The box: a little deck over the last 0.85 m, its boards laid athwart; on it the box line in its coil.
  // The clumsy cleat: the thick board across her behind the box, with the notch to port for the harpooneer's thigh.
  // The stem head, with the two cheeks of the chocks, the pin across them, and the line led out between and made up
  // on the box again (she is fast to nothing).
  const sOf = (z) => (Z0 - z) / (Z0 - Z1), deckY = (z) => sheer(sOf(z)) - 0.11;
  for (let j = 0; j < 5; j++) {
    const zA = -1.85 - j * 0.16, zB = zA - 0.15, bA = Math.max(0.03, beam(sOf(zA)) - 0.05), bB = Math.max(0.03, beam(sOf(zB)) - 0.05), c = sc(j % 2 ? board2 : board, 1.25);
    quad(v(-bA, deckY(zA), zA, c), v(bA, deckY(zA), zA, c), v(bB, deckY(zB), zB, c), v(-bB, deckY(zB), zB, c));
  }
  { const bc = beam(sOf(-1.72)) - 0.02, y = sheer(sOf(-1.72)) - 0.06;
    box(-0.02, y, -1.6, bc, y + 0.06, -1.84, cap); box(-bc, y, -1.6, -0.32, y + 0.06, -1.84, cap); box(-0.32, y, -1.74, -0.02, y + 0.06, -1.84, sc(cap, 0.85)); }
  { const yS = sheer(1);
    box(-0.04, yS - 0.14, -2.5, 0.04, yS + 0.02, -2.74, sc(cap, 0.8));
    box(-0.055, yS + 0.02, -2.6, -0.025, yS + 0.065, -2.74, sc(cap, 0.6)); box(0.025, yS + 0.02, -2.6, 0.055, yS + 0.065, -2.74, sc(cap, 0.6));
    box(-0.06, yS + 0.045, -2.66, 0.06, yS + 0.058, -2.675, iron);
    // the box line: its coil on the deck (three flat turns), and the lead through the chocks and back
    for (let r = 0; r < 3; r++) for (let a = 0; a < 8; a++) {
      const R = 0.1 + 0.05 * r, a0 = a / 8 * Math.PI * 2, a1 = (a + 1) / 8 * Math.PI * 2, zc = -2.08, y0 = deckY(zc) + 0.03 + 0.012 * r;
      slat([0.02 + R * Math.cos(a0), y0, zc + R * Math.sin(a0)], [0.02 + R * Math.cos(a1), y0, zc + R * Math.sin(a1)], 0.016, sc(rope, 0.85 + 0.1 * (a % 2)));
    }
    slat([0.1, deckY(-2.2) + 0.05, -2.2], [0, yS + 0.035, -2.6], 0.016, rope); slat([0, yS + 0.035, -2.6], [0.0, yS + 0.03, -2.78], 0.016, rope);
    slat([0.0, yS + 0.03, -2.78], [-0.09, yS - 0.03, -2.7], 0.016, rope); slat([-0.09, yS - 0.03, -2.7], [-0.12, deckY(-2.3) + 0.04, -2.3], 0.016, rope);
  }
  // THE CREW AND THE OARS. Five thwarts; a man on each of the four after ones with his back to the bow and his oar
  // out over the other gunwale, one to each side by turns; those four oars pull together (the stroke: see uRow) and
  // their men lean with it. THE BOW OAR IS PEAKED (its blade up and out, at rest) AND ITS THWART IS EMPTY: the man
  // who pulled it is the harpooneer, who has left it and stands in the bow, and his eye is the lens (a man seated
  // there would sit half a metre astern of the lens, the whole of him within a metre of it: NOTHING OF THE BOAT OR
  // HER MEN IS WITHIN A METRE OF THE LENS INSIDE THE PICTURE). The steersman stands in the stern to the long steering oar. Between the
  // two after thwarts the line tub with its coil; the line goes aft round the loggerhead and forward along her
  // middle, over the thwarts, to the box.
  const man = (x, y, z, shirt, hat, stand) => {
    const yT = y + (stand ? 0.78 : 0.08);
    if (stand) { box(x - 0.15, y, z - 0.1, x - 0.02, yT, z + 0.1, [0.2, 0.2, 0.24]); box(x + 0.02, y, z - 0.1, x + 0.15, yT, z + 0.1, [0.2, 0.2, 0.24]); }
    else box(x - 0.17, y - 0.02, z - 0.05, x + 0.17, yT + 0.08, z + 0.5, [0.22, 0.22, 0.27]);
    if (!stand) cur = [x, yT, z, 2];
    box(x - 0.21, yT, z - 0.2, x + 0.21, yT + 0.55, z + 0.05, shirt);
    box(x - 0.1, yT + 0.57, z - 0.17, x + 0.1, yT + 0.79, z + 0.03, [0.62, 0.43, 0.32]);
    box(x - 0.16, yT + 0.79, z - 0.23, x + 0.16, yT + 0.84, z + 0.09, hat);
    cur = [0, 0, 0, 0];
  };
  const SHIRTS = [[0.62, 0.2, 0.16], [0.55, 0.56, 0.52], [0.2, 0.3, 0.5], [0.6, 0.52, 0.34], [0.5, 0.5, 0.47]], HATS = [[0.5, 0.42, 0.25], [0.12, 0.12, 0.14], [0.5, 0.42, 0.25], [0.3, 0.2, 0.14], [0.5, 0.42, 0.25]];
  const TH = [0.2, 0.33, 0.46, 0.59, 0.76], thY = (n) => sheer(TH[n]) - 0.1 + 0.045;
  TH.forEach((sT, n) => {
    const zc = lerp(Z0, Z1, sT), bc = beam(sT) - 0.045, yc = sheer(sT) - 0.1, sd = n % 2 ? 1 : -1;
    box(-bc, yc, zc + 0.12, bc, yc + 0.045, zc - 0.12, cap);
    if (n < 4) man(-sd * 0.36, yc + 0.045, zc, SHIRTS[n], HATS[n], false);
    // the oar: on its thole pin at the gunwale, 0.3 m abaft the thwart; 1.25 m of loom inboard, 3.3 m out to the blade
    const px = sd * (beam(sT) + 0.01), py = sheer(sT) + 0.07, pz = zc + 0.3;
    box(px - 0.02, py - 0.07, pz + 0.05, px + 0.02, py + 0.05, pz + 0.09, iron);
    if (n < 4) {
      cur = [px, py, pz, 1];
      slat([px - sd * 1.25, py + 0.28, pz], [px + sd * 2.45, py - 0.56, pz], 0.045, sc(oarC, 1.15));
      slat([px + sd * 2.45, py - 0.56, pz], [px + sd * 3.3, py - 0.75, pz], 0.1, sc(oarC, 1.3));
      cur = [0, 0, 0, 0];
    } else {
      slat([px - sd * 1.2, py - 0.25, pz - 0.2], [px + sd * 2.5, py + 0.75, pz + 0.9], 0.045, sc(oarC, 1.15));
      slat([px + sd * 2.5, py + 0.75, pz + 0.9], [px + sd * 3.3, py + 0.97, pz + 1.14], 0.1, sc(oarC, 1.3));
    }
  });
  // the stern: the cuddy board, the loggerhead on it, the steersman before it and his long oar over the stern post
  for (let j = 0; j < 3; j++) {
    const zA = 5.74 - j * 0.17, zB = zA - 0.16, bA = Math.max(0.03, beam(sOf(zA)) - 0.05), bB = Math.max(0.03, beam(sOf(zB)) - 0.05), c = sc(j % 2 ? board2 : board, 1.2);
    quad(v(-bA, deckY(zA), zA, c), v(-bB, deckY(zB), zB, c), v(bB, deckY(zB), zB, c), v(bA, deckY(zA), zA, c));
  }
  box(0.1, deckY(5.45), 5.5, 0.2, deckY(5.45) + 0.28, 5.4, dark);
  man(-0.1, 0.19, 4.9, [0.2, 0.24, 0.32], [0.12, 0.12, 0.14], true);
  cur = [-0.12, sheer(0) + 0.06, 5.78, 3];
  // (the steering oar is the stoutest thing about her: a loom eleven centimetres through and a blade over a quarter
  // of a metre broad, of pale ash, so that from over her it reads as an oar and not as a line on the water)
  slat([-0.02, 1.32, 4.75], [-0.12, sheer(0) + 0.06, 5.78], 0.055, sc(oarC, 1.2)); slat([-0.12, sheer(0) + 0.06, 5.78], [-0.3, -0.25, 8.4], 0.055, sc(oarC, 1.2)); slat([-0.3, -0.25, 8.4], [-0.36, -0.5, 9.3], 0.14, sc(oarC, 1.35));
  cur = [0, 0, 0, 0];
  // the line tub and the line
  { const zt = 0.5 * (lerp(Z0, Z1, TH[0]) + lerp(Z0, Z1, TH[1])), R = 0.29, yb = 0.185, yt = 0.56, tubC = [0.4, 0.3, 0.18];
    const ctr = v(0, yt - 0.05, zt, sc(rope, 0.6));
    for (let a = 0; a < 10; a++) {
      const a0 = a / 10 * Math.PI * 2, a1 = (a + 1) / 10 * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), tc = sc(tubC, 0.85 + 0.15 * (a % 2));
      quad(v(R * c0, yb, zt + R * s0, sc(tc, 0.7)), v(R * c0, yt, zt + R * s0, tc), v(R * c1, yt, zt + R * s1, tc), v(R * c1, yb, zt + R * s1, sc(tc, 0.7)));
      const i0 = v(0.9 * R * c0, yt - 0.03, zt + 0.9 * R * s0, sc(rope, 0.8 + 0.2 * (a % 2))), i1 = v(0.9 * R * c1, yt - 0.03, zt + 0.9 * R * s1, sc(rope, 1 - 0.2 * (a % 2)));
      idx.push(ctr, i1, i0);
    }
    const way = [[0.1, yt, zt + 0.1], [0.15, deckY(5.45) + 0.2, 5.45]];
    for (let n = 0; n < 5; n++) way.push([0.03, thY(n) + 0.03, lerp(Z0, Z1, TH[n])]);
    way.push([0.06, deckY(-1.9) + 0.05, -1.9], [0.1, deckY(-2.05) + 0.05, -2.0]);
    for (let i = 0; i + 1 < way.length; i++) slat(way[i], way[i + 1], 0.016, sc(rope, 0.9 + 0.1 * (i % 2)));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setAttribute('aRow', new THREE.Float32BufferAttribute(row, 4)); g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export default {
  id: 'still-lake-in-the-herd',
  name: 'The Still Lake in the Middle of the Herd',
  category: 'books',
  placeKind: 'ocean',
  book: 'Moby-Dick',
  author: 'Herman Melville, 1819 to 1891',
  media: ['water', 'air'],
  weirdness: 0.3,
  async build(ctx) {
    const { noise } = ctx;
    const scene = new THREE.Scene();
    const vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    // EVERY STREAM OF CHANCE this world draws from, in one list. Each is made from the visit's seed and its own name
    // and draws nothing from any other. Where a thing is left out by a rule of the place (a leap too near land) its
    // draws are made all the same, so that what is dealt after it in the same stream does not change with it.
    const S = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    const rv = S('vary'), rCalf = S('calf'), rNose = S('nosing-calves'), rNb = S('newborn'), rBoat = S('boat'), rSky = S('sky'), rKit = S('kit'), rRip = S('ripples'), rShaft = S('shafts'), ir = S('islands'), rShore = S('shore'), rCloud = S('clouds'),
      rSwell = S('swell'), hr = S('herd'), lr = S('lake'), dg = S('deep-tiers'), dl = S('deep'), rHero = S('hero'),
      rHostS = S('host'), rHeads = S('heads'), rPalm = S('palms'), rDive = S('divers'), br = S('breach'), rLeap = S('lane-leap'), gr = [S('gulls-a'), S('gulls-b'), S('gulls-c')],
      rSun = S('sun'), rWave = S('waves'), rLane = S('lane-ranks'), rPh = S('phases'), rBull = S('bulls'), rSnd = S('sounder'), rSndR = S('sounder-round'), rGreat = S('great-breach'), rGreatR = S('great-round'), rUp = S('upper-tier'), rTail = S('tails');

    // ------------------------------------------------------------ LAYOUT: what this visit is like
    const hourPick = rv();
    const hour = vary.hour === 'golden' ? 'golden' : vary.hour === 'night' ? 'night' : vary.hour === 'dawn' ? 'dawn' : vary.hour === 'day' ? 'noon' : (hourPick < 0.74 ? 'noon' : 'golden');
    const M = MOODS[hour];
    const R0 = rv.range(105, 125);
    const shape = [rv.range(0.045, 0.1), rv.range(0, TAU), rv.range(0.02, 0.05), rv.range(0, TAU)];
    const lakeShape = (th) => 1 + shape[0] * Math.cos(2 * th + shape[1]) + shape[2] * Math.cos(3 * th + shape[3]);
    const lakeShapeD = (th) => -2 * shape[0] * Math.sin(2 * th + shape[1]) - 3 * shape[2] * Math.sin(3 * th + shape[3]);
    const sideSign = rv.chance(0.5) ? 1 : -1, dirSign = rv.chance(0.5) ? 1 : -1;
    const laneA = sideSign * rv.range(0.3, 0.5);
    const laneDir = [Math.sin(laneA), -Math.cos(laneA)], thLane = Math.atan2(laneDir[1], laneDir[0]), Rlane = R0 * lakeShape(thLane);
    const thIn = Math.PI / 2 + rv.range(-0.1, 0.1), Rin = R0 * lakeShape(thIn);
    // THE RANKS: NC ranks of cows round the lake, dr apart; outside them the host's bulls keep two ranks of their own,
    // the inner 1.5 bull lengths outside the last cow rank and the outer 3 bull lengths outside that (KO ranks in all)
    const NC = rv.int(8, 9), KO = NC + 2, dr = rv.range(18.5, 21), rIn = R0 * 1.08;
    const swellK = rv.range(0.85, 1.2), windA = rv.range(0, TAU);
    const rare = !!vary.rare, rareKind = rv.chance(0.5) ? 'heads' : 'white';
    const rhoOf = (x, z) => { const th = Math.atan2(z, x); return Math.hypot(x, z) / (R0 * lakeShape(th)); };
    // THE LONG SWELL (swellGH in the part is the same rule): two crossed trains of low hills of water, the longer one
    // near the wind's eye, travelling on the world clock at the speed of deep-water waves of their length. A low one
    // (the straits are sheltered): its crests never come within a metre of the eye in the boat. The boat rides it;
    // the route does not.
    const swellDef = (() => {
      const a0 = windA + rSwell.range(-0.5, 0.5), l0 = rSwell.range(74, 96), a1 = a0 + rSwell.sign() * rSwell.range(0.7, 1.2), l1 = rSwell.range(42, 58);
      return [[rSwell.range(0.2, 0.28) * swellK, Math.cos(a0) * TAU / l0, Math.sin(a0) * TAU / l0, rSwell.range(0, TAU), Math.sqrt(9.81 * TAU / l0)],
        [rSwell.range(0.08, 0.12) * swellK, Math.cos(a1) * TAU / l1, Math.sin(a1) * TAU / l1, rSwell.range(0, TAU), Math.sqrt(9.81 * TAU / l1)]];
    })();
    const laneJS = (x, z, pad) => { const al = x * laneDir[0] + z * laneDir[1], la = Math.abs(x * laneDir[1] - z * laneDir[0]); return smoothstep(0, R0 * 0.6, al) * (1 - smoothstep(LANE_W + pad, LANE_W + pad + 8, la)); };
    const swellAt = (x, z, t) => { let h = 0; for (const s of swellDef) h += s[0] * Math.sin(s[1] * x + s[2] * z - s[4] * t + s[3]); return h * smoothstep(-0.9, 3.6, (rhoOf(x, z) - rIn / R0) / (dr / R0)) * (1 - laneJS(x, z, 6)); };

    // ------------------------------------------------------------ the flight: open sea, in through the rings, over the heart of the lake, out by the lane
    // BL is a whaleboat's length: most distances below are told in it, or in the whales' own measures
    const tangentAngle = (th) => { const sh = lakeShape(th), shd = lakeShapeD(th), c = Math.cos(th), s = Math.sin(th); return Math.atan2(shd * s + sh * c, shd * c - sh * s); };
    const ringR = (k) => (k <= NC - 1 ? rIn + k * dr : rIn + (NC - 1) * dr + 1.5 * BULL * Math.min(1, k - NC + 1) + 3 * BULL * Math.max(0, k - NC));
    const Q = (d) => [laneDir[0] * d, laneDir[1] * d];
    const polar = (th, req, out) => { const r = req * lakeShape(th) + (out || 0); return [Math.cos(th) * r, Math.sin(th) * r]; };
    // the gate stands in the lane between the sixth and the seventh rank out from the lake, so the way to it passes six ranks
    const portalD = ringR(5.8) * lakeShape(thLane);
    // THE STRAIT AND THE ISLANDS, dealt first: the herd keeps clear of them by landNear (the shore's radius at a
    // place's own bearing, with each rule's own margin), the birds by landOff (the true distance to the shore's
    // line: see THE AXIS BEHIND THE ENTRY, where the islands' places are final). The lane runs out
    // toward a strait between two green islands; the gate stands in its mouth. Each of the two is set so that its
    // shore, from sixty metres short of the gate to a hundred beyond it, comes within 'half' metres of the lane's
    // middle line and no nearer (half = 36 to 46 m: a strait some eighty metres wide). The other islands stand round
    // the host, among its far pods, none on the lane's bearing.
    const isles = [], rHost = ringR(KO - 1) + dr;
    const shoreOf = (q, a) => q.R * 0.955 * islandLump(noise, q.ox, q.oz, a);
    const landNear = (x, z, pad) => isles.some((q) => { const dx = x - q.x, dz = z - q.z, d = Math.hypot(dx, dz); return d < q.R * 1.4 + pad && d < shoreOf(q, Math.atan2(dz, dx)) + pad; });
    for (const sd of [1, -1]) {
      const R = ir.range(190, 260), q = { R, H: R * ir.range(0.34, 0.46), ox: ir.range(-50, 50), oz: ir.range(-50, 50), strait: sd, x: 0, z: 0 };
      const half = ir.range(62, 74), al = portalD + R * ir.range(0.35, 0.6);
      let reach = 0;
      for (let j = 0; j < 240; j++) {
        const a = j / 240 * TAU, rr = shoreOf(q, a), ax = Math.cos(a) * rr, az = Math.sin(a) * rr, da = ax * laneDir[0] + az * laneDir[1] + al - portalD;
        if (da > -60 && da < 100) reach = Math.max(reach, -sd * (ax * laneDir[1] - az * laneDir[0]));
      }
      const lc = sd * (half + reach);
      q.x = laneDir[0] * al + laneDir[1] * lc; q.z = laneDir[1] * al - laneDir[0] * lc; q.half = half;
      isles.push(q);
    }
    for (let i = 0, n = ir.int(4, 6); i < n; i++) {
      const a = thLane + 0.5 + (i + ir.range(0.15, 0.85)) / n * (TAU - 1), R = ir.range(150, 330), d = rHost + R + ir.range(140, 640);
      isles.push({ R, H: R * ir.range(0.3, 0.46), ox: ir.range(-50, 50), oz: ir.range(-50, 50), strait: 0, x: Math.cos(a) * d, z: Math.sin(a) * d });
    }
    // the parts of an arc of a ring (radius r, centre bearing c, half width h) that keep thirty metres clear of land
    const freeArcs = (r, c, h) => {
      const out = [], n = Math.max(2, Math.ceil(2 * h * r / 3)); let a0 = null;
      for (let i = 0; i <= n; i++) {
        const a = c - h + 2 * h * i / n, sh = lakeShape(a), blocked = i === n || landNear(Math.cos(a) * r * sh, Math.sin(a) * r * sh, 30);
        if (!blocked && a0 === null) a0 = a;
        if (blocked && a0 !== null) { if ((a - a0) * r > 24) out.push([0.5 * (a0 + a), 0.5 * (a - a0)]); a0 = null; }
      }
      return out;
    };
    // THE HEART OF THE LAKE, where the named cow hangs with her calf: a seeded place within a tenth of the lake's
    // radius of its centre. Our way crosses the lake from where we come in to the head of the lane (half way out along
    // it) and passes a boat's length to one side of the heart.
    const heart = (() => { const a = rHero.range(0, TAU), r = rHero.range(0, 0.1) * R0; return [Math.cos(a) * r, Math.sin(a) * r]; })();
    // THE BOAT'S LINE ON THE WATER (the route's plan line), by places of the host. It starts five boat lengths
    // outside the outer rank of bulls (so the way in runs level for its first sixty metres and more: ARRIVE) and comes in across that rank at a slant of 25 degrees (the nearest whales cross
    // the bow); it runs ALONG the middle of the bulls' water, between their two ranks, for four bull lengths (each
    // rank's file passes at a bull's length and a half); there it turns in and runs straight across every rank of
    // cows to a point one boat length to one side of the lake's heart, on to the lane's mouth and out along the lane
    // to the gate. EVERY CORNER IS AN ARC OF A CIRCLE whose radius is the speed flown there divided by TURNRATE (0.33
    // rad/s: nineteen degrees of heading a second; the two corners of the bulls' water for the full way, though she
    // goes slower there), found in two passes: line, pace, speeds, line again.
    const gapSense = sideSign, rGap = 0.5 * (ringR(NC) + ringR(NC + 1)), laneMouth = Q(MOUTH * Rlane);
    // THE ALONG-STRETCH IS FOUR BULL LENGTHS of the bulls' water: the bulls of a rank go by twos and threes, a
    // company to every 2.6 bull lengths, so along four lengths she passes a company and a half and more on each
    // hand (each of them coming up, blowing, rolling and going down on its own round on the world clock, whether she
    // is there or not).
    const thB = thIn, thA = thB - gapSense * 4 * BULL / (rGap * lakeShape(thB));
    const tanAt = (th) => { const a = tangentAngle(th); return [gapSense * Math.cos(a), gapSense * Math.sin(a)]; };
    const SLANT = 25 * Math.PI / 180, TURNRATE = 0.33;
    // way points [x, z, the corner's radius or 0] for the four corners' radii Rs
    const layLine = (Rs) => {
      const A = polar(thA, rGap), B = polar(thB, rGap), tA = tanAt(thA), tB = tanAt(thB);
      // the way in: the gap's own heading at thA, turned SLANT toward the lake
      const sgn = (tA[0] * -A[1] - tA[1] * -A[0]) > 0 ? 1 : -1;
      const dIn = [tA[0] * Math.cos(SLANT) - sgn * tA[1] * Math.sin(SLANT), tA[1] * Math.cos(SLANT) + sgn * tA[0] * Math.sin(SLANT)];
      const t1 = Rs[0] * Math.tan(SLANT / 2), P1 = [A[0] - tA[0] * t1, A[1] - tA[1] * t1];
      let S0 = P1;
      for (let n0 = 0; n0 < 400; n0++) { if (Math.hypot(S0[0], S0[1]) / lakeShape(Math.atan2(S0[1], S0[0])) >= ringR(NC + 1) + 5 * BL) break; S0 = [S0[0] - dIn[0] * 2, S0[1] - dIn[1] * 2]; }
      // the corner where the line leaves the bulls' water for the lake lies on the gap's heading beyond thB by the
      // arc's own tangent length, so the arc begins where the along-stretch ends
      let P2 = B, hb = [heart[0], heart[1]];
      for (let it = 0; it < 5; it++) {
        const ux = laneMouth[0] - P2[0], uz = laneMouth[1] - P2[1], l = Math.hypot(ux, uz) || 1;
        hb = [heart[0] - sideSign * (-uz / l) * BL, heart[1] - sideSign * (ux / l) * BL];
        const vx = hb[0] - P2[0], vz = hb[1] - P2[1], vl = Math.hypot(vx, vz) || 1, phi = Math.acos(clamp((tB[0] * vx + tB[1] * vz) / vl, -1, 1));
        const t2 = Rs[1] * Math.tan(phi / 2);
        P2 = [B[0] + tB[0] * t2, B[1] + tB[1] * t2];
      }
      const way = [[S0[0], S0[1], 0], [P1[0], P1[1], Rs[0]]];
      for (let i = 0; i <= 9; i++) { const p = polar(thA + (thB - thA) * i / 9, rGap); way.push([p[0], p[1], 0]); }
      const G = Q(portalD);
      way.push([P2[0], P2[1], Rs[1]], [hb[0], hb[1], Rs[2]], [laneMouth[0], laneMouth[1], Rs[3]], [G[0], G[1], 0]);
      return way;
    };
    // the line through those points with its corners rounded to arcs, then a point every eight metres or so
    const roundLine = (way) => {
      const n = way.length, tl = new Array(n).fill(0), ang = new Array(n).fill(0);
      for (let i = 1; i < n - 1; i++) {
        if (!way[i][2]) continue;
        const ax = way[i][0] - way[i - 1][0], az = way[i][1] - way[i - 1][1], bx = way[i + 1][0] - way[i][0], bz = way[i + 1][1] - way[i][1];
        ang[i] = Math.acos(clamp((ax * bx + az * bz) / ((Math.hypot(ax, az) || 1) * (Math.hypot(bx, bz) || 1)), -1, 1));
        tl[i] = way[i][2] * Math.tan(ang[i] / 2);
      }
      // (two corners never take more than the leg between them)
      for (let i = 0; i < n - 1; i++) { const leg = Math.hypot(way[i + 1][0] - way[i][0], way[i + 1][1] - way[i][1]), sum = tl[i] + tl[i + 1]; if (sum > leg) { tl[i] *= leg / sum; tl[i + 1] *= leg / sum; } }
      const out = [[way[0][0], way[0][1]]];
      for (let i = 1; i < n - 1; i++) {
        const P = way[i], t = tl[i];
        if (t < 0.5) { out.push([P[0], P[1]]); continue; }
        const A = way[i - 1], B = way[i + 1], la = Math.hypot(P[0] - A[0], P[1] - A[1]), lb = Math.hypot(B[0] - P[0], B[1] - P[1]);
        const u = [(P[0] - A[0]) / la, (P[1] - A[1]) / la], v = [(B[0] - P[0]) / lb, (B[1] - P[1]) / lb];
        const R = t / Math.tan(ang[i] / 2), s = (u[0] * v[1] - u[1] * v[0]) > 0 ? 1 : -1;
        // the circle's centre lies R to the turn's side of the first tangent point
        const a = [P[0] - u[0] * t, P[1] - u[1] * t], c = [a[0] - s * u[1] * R, a[1] + s * u[0] * R], m = Math.max(2, Math.ceil(ang[i] / 0.1));
        for (let j = 0; j <= m; j++) {
          const q = s * ang[i] * j / m, rx = a[0] - c[0], rz = a[1] - c[1];
          out.push([c[0] + rx * Math.cos(q) - rz * Math.sin(q), c[1] + rx * Math.sin(q) + rz * Math.cos(q)]);
        }
      }
      out.push([way[n - 1][0], way[n - 1][1]]);
      const pl = [out[0]];
      for (let i = 1; i < out.length; i++) {
        const A = out[i - 1], B = out[i], d = Math.hypot(B[0] - A[0], B[1] - A[1]);
        if (d < 1e-6) continue;
        const k = Math.max(1, Math.round(d / 8));
        for (let j = 1; j <= k; j++) pl.push([A[0] + (B[0] - A[0]) * j / k, A[1] + (B[1] - A[1]) * j / k]);
      }
      return pl;
    };
    // PLACES ON A LINE, in metres along it (a step every metre): where it crosses the fourth rank of cows from the
    // lake (c3), the lake's rim, where the heart lies abeam (the heart's middle), the lane's mouth
    const measure = (plan) => {
      const S = [0]; for (let i = 1; i < plan.length; i++) S.push(S[i - 1] + Math.hypot(plan[i][0] - plan[i - 1][0], plan[i][1] - plan[i - 1][1]));
      const at = (s) => { let i = 1; while (i < plan.length - 1 && S[i] < s) i++; const t = clamp((s - S[i - 1]) / Math.max(1e-6, S[i] - S[i - 1]), 0, 1); return [lerp(plan[i - 1][0], plan[i][0], t), lerp(plan[i - 1][1], plan[i][1], t)]; };
      const end = S[plan.length - 1], pl = { c3: -1, rim: -1, hero: 0, mouth: -1, end, sl: 60, outer: -1, inner: -1, gapA: 0, gapB: 0 };
      const gA = polar(thA, rGap), gB = polar(thB, rGap);
      let best = 1e9, bA = 1e9, bB = 1e9;
      for (let s = 0; s <= end; s += 1) {
        const [x, z] = at(s), th = Math.atan2(z, x), rr = Math.hypot(x, z);
        if (pl.c3 < 0 && rr / lakeShape(th) <= ringR(3)) pl.c3 = s;
        if (pl.outer < 0 && rr / lakeShape(th) <= ringR(NC + 1)) pl.outer = s;
        const dA = Math.hypot(x - gA[0], z - gA[1]), dB = Math.hypot(x - gB[0], z - gB[1]);
        if (dA < bA) { bA = dA; pl.gapA = s; }
        if (dB < bB) { bB = dB; pl.gapB = s; }
        if (pl.inner < 0 && rr / lakeShape(th) <= ringR(NC)) pl.inner = s;
        if (pl.rim < 0 && rr / (R0 * lakeShape(th)) <= 1) pl.rim = s;
        const dh = Math.hypot(x - heart[0], z - heart[1]); if (dh < best) { best = dh; pl.hero = s; }
        if (pl.mouth < 0 && pl.rim >= 0 && x * laneDir[0] + z * laneDir[1] >= MOUTH * Rlane - 0.5) pl.mouth = s;
      }
      if (pl.mouth < 0) pl.mouth = end - 120;
      if (pl.outer < 0) pl.outer = Math.max(0, pl.gapA - 3 * BULL);
      pl.outer = Math.max(pl.outer, ARRIVE + KNEE);
      if (pl.inner < 0) pl.inner = pl.gapB + 3 * BULL;
      return { S, at, pl };
    };
    // THE FILM'S PACE, by places (d = the eye's metres; pl = the places of the line flown). We come in at 0.8 of full
    // way (from the first metre to the outer bulls' rank); AMONG THE BULLS she goes at 0.45 of it: the pace falls
    // over the slope by which the eye comes down (from the outer bulls' rank to KNEE metres short of the
    // along-stretch), holds along the bulls' water, and rises to full way over the slope up (to the inner bulls'
    // rank); full way over the outer ranks of cows; it falls to 0.8 from the fourth rank to the lake's rim (the
    // tumult thins); to 0.3 from the rim to two boat lengths short of the heart's middle; 0.3 over the whole lake; over
    // the two boat lengths before the lane's mouth the pace falls to 0.14 and holds it
    // for pl.sl metres: THE SLOW WATER BESIDE THE GREAT BULL'S BERTH, a length of the route and nothing more
    // (nothing begins or ends by it; he leaps on his round whether anyone is there): as many metres as the declared
    // pace itself makes from the mouth in SLOW_S seconds: 27 to 35 m on seeds 1 to 300, three to four boat lengths;
    // from there it rises: 0.6 within three boat lengths, 0.85 at the gate. Fifty seconds.
    const DUR = 50, SLOW_S = 6.5;
    const paceBulls = (pl, d) => 0.2 + 0.35 * smoothstep(pl.outer, pl.gapA - KNEE, d) - 0.55 * smoothstep(pl.gapB + KNEE, pl.inner, d);
    const paceBy = (pl, d) => 1 - paceBulls(pl, d) - 0.2 * smoothstep(pl.c3, pl.rim, d) - 0.5 * smoothstep(pl.rim, pl.hero - 2 * BL, d) - 0.16 * smoothstep(pl.mouth - 2 * BL, pl.mouth, d) + 0.46 * smoothstep(pl.mouth + pl.sl, pl.mouth + pl.sl + 3 * BL, d) + 0.25 * smoothstep(pl.mouth + pl.sl + 3 * BL, pl.end, d);
    // THE WORLD'S OWN FILM CLOCK IS NOT THE ENGINE'S. It is a function of the METRES FLOWN: the seconds a flight at
    // the declared pace takes to each metre, MODELLED on how the engine reads a pace. Three numbers here are COPIES
    // of src/core/engine.js (makePace, lines 23 to 25): PN = 64 (the engine reads a world's pace at 65 places of its
    // route and goes straight from one to the next) and the bounds 0.35 and 2.5 it keeps each value within. So the
    // paces are handed over times 2.5 (the slowest, 0.14, then stands on the engine's lower bound, not under it) and
    // the clock is worked from the same 65 values. THE DIFFERENCE: the engine eases its speed toward the pace
    // (engine.js line 640, 1 - exp(-dt*1.4)) and carries a speed in from the world before; this clock models
    // neither. So the engine runs ahead of this clock wherever the pace has just fallen (most where she checks her
    // way for the lane) and behind it where the pace has just risen, and a speed carried in moves that again.
    // NOTHING DEPENDS ON THE TWO AGREEING and nothing reads the difference: whatever is begun by a place takes its
    // course from the metres
    // flown (filmT of the eye's metres), never from the engine's seconds; if the engine's numbers change, only how
    // long a thing takes on the watch changes, never where it is or what it meets.
    const PN = 64;
    const paceTab = (pl) => {
      const p = new Float32Array(PN + 1);
      for (let i = 0; i <= PN; i++) p[i] = clamp(2.5 * paceBy(pl, i / PN * pl.end), 0.35, 2.5);
      return (d) => { const x = clamp(d / pl.end, 0, 1) * PN, i = Math.min(PN - 1, Math.floor(x)); return p[i] + (p[i + 1] - p[i]) * (x - i); };
    };
    // the film's seconds at each metre of a line with those places (a table every two metres); pl.sl is found with it
    const filmOf = (pl) => {
      const n = Math.ceil(pl.end / 2) + 2, FT = new Float32Array(n);
      const at = (d) => { const f = clamp(d, 0, pl.end) / 2, i = Math.min(n - 2, Math.floor(f)); return lerp(FT[i], FT[i + 1], f - i); };
      for (let it = 0; it < 5; it++) {
        const pt = paceTab(pl);
        for (let i = 1; i < n; i++) FT[i] = FT[i - 1] + 2 / pt(i * 2 - 1);
        const k = DUR / at(pl.end);
        for (let q = 0; q < n; q++) FT[q] *= k;
        if (it === 4) break;
        const tM = at(pl.mouth); let d = pl.mouth;
        while (d < pl.end && at(d) - tM < SLOW_S) d += 0.5;
        pl.sl = d - pl.mouth;
      }
      return { FT, at };
    };
    // the two passes: radii guessed, the line, its pace, the speed flown at each corner, the radii from them, the line
    let Rs = [50, 50, 25, 30], plan = null, way = null;
    for (let pass = 0; pass < 2; pass++) {
      way = layLine(Rs); plan = roundLine(way);
      if (pass) break;
      const m = measure(plan), film = filmOf(m.pl), corners = way.filter((w) => w[2] > 0);
      Rs = corners.map((c) => {
        let bs = 0, bd = 1e9;
        for (let s = 0; s <= m.pl.end; s += 2) { const p = m.at(s), d = Math.hypot(p[0] - c[0], p[1] - c[1]); if (d < bd) { bd = d; bs = s; } }
        // (the corners are laid for the full way: where she goes slower among the bulls the turn is slower too)
        return Math.max(12, 2 / Math.max(1e-3, film.at(bs + 1) - film.at(bs - 1)) * (1 + paceBulls(m.pl, bs) / paceBy(m.pl, bs)) / TURNRATE);
      });
      await ctx.yield();
    }
    const planM = measure(plan), sP = planM.pl, planS = planM.S;
    // THE EYE'S HEIGHT over that line, by its places (metres over still water; the route does not ride the swell).
    // LAKE_UP (two boat lengths: the round's order) from the first metre, LEVEL over the first ARRIVE + KNEE metres
    // at the least (the engine's eased camera comes in level along the route's first heading). DOWN TO THE BOW TWICE:
    //   among the bulls: one slope from LAKE_UP where the way crosses the outer bulls' rank to EYE at the beginning
    //   of the along-stretch in the bulls' water; EYE, level, along the whole of it; one slope from its end up to
    //   LAKE_UP where the way crosses the inner bulls' rank;
    //   for the lane: one slope from LAKE_UP where the heart lies abeam to EYE at the lane's mouth; EYE to the gate.
    // Each slope ends KNEE metres short of the level it runs into (or begins KNEE metres after it) and the knee is
    // rounded over KNEE metres either side: along the bulls' water the eye is at EYE from the first metre to the
    // last; past the lane's mouth it is at EYE from KNEE metres beyond the mouth to the gate.
    const ramp = (s, a, b) => clamp((s - a) / Math.max(1, b - a), 0, 1);
    const hRaw = (s) => (s < sP.gapA ? lerp(LAKE_UP, EYE, ramp(s, sP.outer, sP.gapA - KNEE)) : s < sP.hero ? lerp(EYE, LAKE_UP, ramp(s, sP.gapB + KNEE, sP.inner)) : lerp(LAKE_UP, EYE, ramp(s, sP.hero, sP.mouth)));
    const hAt = (s) => 0.25 * (hRaw(s - KNEE) + 2 * hRaw(s) + hRaw(s + KNEE));
    const pts = plan.map((p, i) => [p[0], hAt(planS[i]), p[1]]);
    await ctx.yield();
    const path = makePath(pts, { samples: 640 }), L = path.length;
    await ctx.yield();
    const portalAt = path.end.clone();
    const _p = new THREE.Vector3(), _t = new THREE.Vector3();
    const pathD = (x, z) => path.nearestXZ(x, z).dist;
    // THE AXIS BEHIND THE ENTRY. This world sets camera.nearThrough, so the camera that draws it inside the last
    // world's gate flies the route's first heading run straight back, level, at the entry's height. THE STRIP
    // AX_BACK metres back along that axis and AX_SIDE metres to either side is kept free of island ground and of
    // every bird's reach, by rules of the place (backAt(d): the axis's place d metres behind the entry).
    const AX_BACK = 340, AX_SIDE = 15;
    path.posAtDist(0, _p); path.tangentAtDist(0, _t);
    const axE = [_p.x, _p.y, _p.z], axH = (() => { const l = Math.hypot(_t.x, _t.z) || 1; return [_t.x / l, _t.z / l]; })();
    const backAt = (d) => [axE[0] - axH[0] * d, axE[2] - axH[1] * d];
    // AN ISLAND BEYOND THE STRAIT WHOSE GROUND WOULD STAND IN THAT STRIP IS SET FURTHER OUT ON ITS OWN BEARING (no
    // draw, nothing searched, the others stand as dealt). Its ground is in the strip where a place of its outline
    // (1440 places round it, under two metres apart: the whole of its ground, under water too) lies in the strip's
    // oblong taken a metre wider to either side and two metres longer at either end, or a place of the axis lies
    // inside the outline. Such an island stands as far from
    // the host's middle as the strip's farthest place, its own widest outline and that half width more, so the
    // whole of its ground lies beyond the strip's end.
    // (islesMoved: how many; the two of the strait are never near it: islesStrait counts one that would be.)
    let islesMoved = 0, islesStrait = 0;
    for (const q of isles) {
      const edge = (a) => q.R * islandLump(noise, q.ox, q.oz, a);
      let wide = 0, hit = false;
      for (let j = 0; j < 1440 && !hit; j++) {
        const a = j / 1440 * TAU, r = edge(a), x = q.x + Math.cos(a) * r - axE[0], z = q.z + Math.sin(a) * r - axE[2], back = -(x * axH[0] + z * axH[1]);
        wide = Math.max(wide, r); hit = back > -2 && back < AX_BACK + 2 && Math.abs(x * axH[1] - z * axH[0]) < AX_SIDE + 1;
      }
      for (let d = 0; d <= AX_BACK && !hit; d += 2) { const b = backAt(d), dx = b[0] - q.x, dz = b[1] - q.z; hit = Math.hypot(dx, dz) < edge(Math.atan2(dz, dx)); }
      if (!hit) continue;
      if (q.strait) { islesStrait++; continue; }
      for (let j = 0; j < 240; j++) wide = Math.max(wide, edge(j / 240 * TAU));
      const e = backAt(AX_BACK), far = Math.max(Math.hypot(axE[0], axE[2]), Math.hypot(e[0], e[1])), k = (far + wide + AX_SIDE + 3) / Math.hypot(q.x, q.z);
      if (k > 1) { q.x *= k; q.z *= k; islesMoved++; }
    }
    // THE SHORE'S LINE of every island (240 places round it) and landOff: the true distance in plan from a place to
    // the nearest shore's line (nought on land).
    const shoreXZ = isles.map((q) => { const a = new Float32Array(482); for (let j = 0; j <= 240; j++) { const th = j / 240 * TAU, r = shoreOf(q, th); a[j * 2] = q.x + Math.cos(th) * r; a[j * 2 + 1] = q.z + Math.sin(th) * r; } return a; });
    const landOff = (x, z) => {
      let best = 1e9;
      for (let n = 0; n < isles.length; n++) {
        const q = isles[n], dx = x - q.x, dz = z - q.z, d = Math.hypot(dx, dz);
        if (d - q.R * 1.4 >= best) continue;
        if (d < shoreOf(q, Math.atan2(dz, dx))) return 0;
        const s = shoreXZ[n];
        for (let j = 0; j < 240; j++) {
          const ax = s[j * 2], az = s[j * 2 + 1], ex = s[j * 2 + 2] - ax, ez = s[j * 2 + 3] - az, t = clamp(((x - ax) * ex + (z - az) * ez) / (ex * ex + ez * ez || 1), 0, 1), m = Math.hypot(x - ax - ex * t, z - az - ez * t);
          if (m < best) best = m;
        }
      }
      return best;
    };
    // a place beside the route: s metres from the start along it, lat metres to its right, heading psi off its tangent
    const onRoute = (s, lat, psi, o) => {
      path.posAtDist(s, _p); path.tangentAtDist(s, _t);
      const tl = Math.hypot(_t.x, _t.z) || 1, dx = _t.x / tl, dz = _t.z / tl, rx = -dz, rz = dx;
      o.x = _p.x + rx * lat; o.z = _p.z + rz * lat;
      const hx = rx * Math.sin(psi) + dx * Math.cos(psi), hz = rz * Math.sin(psi) + dz * Math.cos(psi);
      o.yaw = Math.atan2(hx, hz); o.hx = hx; o.hz = hz;
      return o;
    };

    // PLACES OF THE ROUTE, in metres from the start along it, each found on this visit's own route (a step every metre):
    //   dRing[k]  where it crosses rank k on the way in (0 the innermost rank of cows; NC and NC + 1 the bulls' two
    //             ranks); crossIn[k] its bearing from the lake's centre there
    //   dGapA, dGapB  the two ends of the along-stretch in the bulls' water
    //   dRim      the lake's rim            dHero   the heart's middle (where the heart lies abeam)
    //   dLane     the lane's mouth, abeam of the first bulls of its two ranks            dOut   where we leave the lake
    let dRim = -1, dOut = L, dHero = 0, dLane = -1;
    const crossIn = [], dRing = [];
    {
      let prev = 1e9, best = 1e9;
      for (let d = 0; d <= L; d += 1) {
        path.posAtDist(d, _p);
        const th = Math.atan2(_p.z, _p.x), rr = Math.hypot(_p.x, _p.z), req = rr / lakeShape(th), rho = rr / (R0 * lakeShape(th));
        if (rho <= 1) { if (dRim < 0) dRim = d; dOut = d; }
        if (dRim < 0) for (let k = 0; k < KO; k++) if (dRing[k] === undefined && prev > ringR(k) && req <= ringR(k)) { crossIn[k] = th; dRing[k] = d; }
        const dh = Math.hypot(_p.x - heart[0], _p.z - heart[1]); if (dh < best) { best = dh; dHero = d; }
        if (dLane < 0 && dRim >= 0 && _p.x * laneDir[0] + _p.z * laneDir[1] >= MOUTH * Rlane - 0.5) dLane = d;
        prev = req;
      }
      for (let k = 0; k < KO; k++) if (dRing[k] === undefined) { crossIn[k] = thIn; dRing[k] = -1; }
      if (dLane < 0) dLane = dOut - 1;
    }
    const dGapA = (() => { const p = polar(thA, rGap); return path.nearestXZ(p[0], p[1]).u * L; })(), dGapB = (() => { const p = polar(thB, rGap); return path.nearestXZ(p[0], p[1]).u * L; })();
    // dOutRing[k]: where the route on its way out along the lane crosses rank k (0 the innermost), -1 if the lane's mouth
    // lies beyond it or the gate short of it
    const dOutRing = [];
    for (let k = 0; k < 6; k++) {
      const s = ringR(k) * lakeShape(thLane); dOutRing[k] = -1;
      if (s > MOUTH * Rlane && s < portalD) for (let d = dLane; d <= L; d += 0.5) { path.posAtDist(d, _p); if (_p.x * laneDir[0] + _p.z * laneDir[1] >= s) { dOutRing[k] = d; break; } }
    }
    // THE BOAT'S STATION: ONE LAW FOR THE WHOLE FLIGHT (the visitor's own craft: she goes before the eye from the
    // first metre to the last and is no event). She is on the route's own line at b = d + lead, and HER LEAD IS
    // leadK TIMES THE EYE'S HEIGHT OVER THE BOW'S OWN: the height of the route's line at the eye's metres, less
    // EYE. So in her own frame the eye comes down to her bow, and leaves it, along one straight line. leadK is ONE
    // NUMBER FOR THE WHOLE VISIT: LEAD_K (2.5), or less on a visit whose line falls so steeply somewhere that she
    // would make less than STATION_LEAST of the eye's way there (a line falling 0.4 in one would hold her still at
    // 2.5, a steeper one send her astern): then it is the greatest factor that leaves her that share on the line's
    // steepest metre (fallMax: read off the whole line, not at a place). At 2.5, where the eye rides two of her
    // lengths up she lies 37.9 m ahead, 24 degrees under a level gaze (the visit begins with a level gaze, and the
    // picture's lower edge lies 31 degrees under it: she is whole inside the picture at the first metre); on the
    // steepest visits (the factor near 2.2) she lies 33 m ahead, 27 degrees under it, her after end at the picture's
    // edge. As the line comes down she is nearer; where the line is at the bow's height the eye is in her bow.
    // NOTHING OF THE LAW IS KEYED TO A PLACE OF THE ROUTE: it has no ramp and no knee of its own and is as smooth
    // as the line. She never lies still or goes astern; on the line's climbs she makes up to 1.6 times the eye's
    // way. Her wake, the low water round her and her shadow read her station; NOTHING OF THE HERD READS IT (the
    // lane of deep water along the route's line is by each whale's own place), and nothing aboard her changes at any place (her men pull one stroke, on the
    // world clock, the whole way).
    const dOuter = Math.max(ARRIVE + KNEE, dRing[KO - 1] > 0 ? dRing[KO - 1] : Math.max(0, dGapA - 3 * BULL)), dInner = dRing[NC] > dGapB ? dRing[NC] : dGapB + 3 * BULL;
    // HOW FAR THE LINE STRAYS, where the eye is down (within half a metre of the bow's height), from the middle of the
    // bulls' water (to the inside, to the outside; in ring radii at lake shape 1) and from the lane's middle line
    // (metres): the bulls on either hand keep off by that much more. shape: the least lake shape along that water.
    const stray = (() => {
      let gi = 0, go = 0, ln = 0, sh = 9;
      for (let d = 0; d <= L; d += 2) {
        path.posAtDist(d, _p); if (_p.y > EYE + 0.5) continue;
        if (d < dRim) { const s0 = lakeShape(Math.atan2(_p.z, _p.x)), rr = Math.hypot(_p.x, _p.z) / s0; gi = Math.max(gi, rGap - rr); go = Math.max(go, rr - rGap); sh = Math.min(sh, s0); }
        else ln = Math.max(ln, Math.abs(_p.x * laneDir[1] - _p.z * laneDir[0]));
      }
      return { gapIn: gi, gapOut: go, lane: ln, shape: Math.min(sh, 1) };
    })();
    const _lp = new THREE.Vector3();
    await ctx.yield();
    // (fallMax: the most the line comes down in one metre of its way, anywhere)
    let fallMax = 0; { let hp = 0; for (let d = 0; d <= L; d += 1) { path.posAtDist(d, _lp); if (d > 0) fallMax = Math.max(fallMax, hp - _lp.y); hp = _lp.y; } }
    const leadK = Math.min(LEAD_K, (1 - STATION_LEAST) / Math.max(fallMax, 0.05));
    const leadAt = (x) => { path.posAtDist(x, _lp); return leadK * (_lp.y - EYE); };
    const boatD = (d) => { const x = clamp(d, 0, L); return Math.min(L, x + leadAt(x)); };
    // (the least of her way to the eye's, along the whole route: she never lies still)
    let stationMin = 9; for (let d = 0; d < L - 1; d += 1) stationMin = Math.min(stationMin, boatD(d + 1) - boatD(d));
    // THE FILM'S PACE on this route's own places (paceBy above), and THE WORLD'S OWN FILM CLOCK (filmT): the seconds
    // the declared pace takes to each metre of the route (the layout reads it where it lays a thing by the film's
    // seconds). Everything the herd does runs on the world clock; nothing of the herd reads this clock.
    const places = { c3: dRing[3] > 0 ? dRing[3] : dRim - 3 * dr, rim: dRim, hero: dHero, mouth: dLane, end: L, sl: 60, outer: dOuter, gapA: dGapA, gapB: dGapB, inner: dInner };
    const film = filmOf(places), FT = film.FT, filmT = film.at;
    const pace = (u) => 2.5 * paceBy(places, u * L);
    const metresAt = (T) => { let i = 0; while (i < FT.length - 2 && FT[i + 1] < T) i++; return Math.min(L, 2 * (i + clamp((T - FT[i]) / Math.max(1e-6, FT[i + 1] - FT[i]), 0, 1))); };
    await ctx.yield();
    // THE FIRST OF THE NOSING CALVES AND ITS MOTHER: THEIR WATER (the habit itself is told at THE NOSING CALVES; it
    // runs on the world clock and answers nothing). A cow hangs 2.2 boat lengths off the route's line, nine metres
    // down (mum0), her calf at her flank (calf0), abeam of a point of the line beyond where the heart's middle lies
    // abeam: three and a half boat lengths and three metres beyond it, or 0.6 of the way to the lane's mouth and
    // three metres if that is nearer (sMeet). The tiers and the whales that lie on the
    // lake leave these two their water: round her place, along the stretch from the calf's place toward the line
    // (calf0 to calfMeet, a metre and a half short of the line), and along the stretch ahead of her, which crosses
    // the line twelve metres further on (mumKeel) and runs twice as far again beyond (mumFar). She heads along
    // that stretch.
    const calfSide = -sideSign;
    const _q = { x: 0, z: 0, yaw: 0, hx: 0, hz: 1 };
    const sMeet = dHero + Math.min(3.5 * BL, 0.6 * (dLane - dHero)) + 3;
    const mum0 = (() => { onRoute(sMeet, calfSide * 2.2 * BL, 0, _q); return { x: _q.x, z: _q.z }; })();
    const calf0 = (() => { onRoute(sMeet + 1.5, calfSide * (2.2 * BL - 2.6), 0, _q); return { x: _q.x, z: _q.z, y: -8.2 }; })();
    const calfMeet = (() => { onRoute(sMeet, calfSide * 1.5, 0, _q); return { x: _q.x, z: _q.z }; })();
    const mumKeel = (() => { onRoute(sMeet + 12, 0, 0, _q); return { x: _q.x, z: _q.z }; })();
    // ------------------------------------------------------------ SKY and light
    // THE LIGHT'S RULE (the world's, on the whole sky; nothing of it moves with the clock or the eye). THE SUN STANDS
    // OUT OVER THE STRAIT: its bearing is half the lane's own (sunAz = laneA / 2), to one side by 14 to 30 degrees at
    // noon and by 16 at most at the low hours. So we come in ACROSS the light (along the bulls' water the sun lies
    // 50 to 120 degrees off our bow) and from the turn in through the cows' ranks we head INTO it, to the gate
    // (within 45 degrees of it at noon, within 15 at the low hours): the lake, the lane, its bulls and the ring
    // stand against the sun's glitter and against the haze, which is WARM TOWARD THE SUN over the whole sea and both
    // islands (SEA_FRAG, LAND_FRAG: the fog's colour times (1.3, 1.1, 0.8) by the square of the bearing's nearness
    // to the sun's). THE RING LIGHTS what lies near it (uGateL: backs within some forty metres take its colour).
    // THE EXCEPTION, stated: in a third of the noon visits the sun stands behind us on the way out instead, and
    // the spouts carry pieces of rainbow.
    await ctx.yield();
    const sunDraw = [rSun(), rSun(), rSun(), rSun(), rSun()];
    const sunBehind = M.sunBehind && sunDraw[0] < 0.33;
    const sunAz = sunBehind ? 180 + sideSign * lerp(16, 38, sunDraw[1]) : laneA * 57.3 * 0.5 + (hour === 'noon' ? -sideSign * lerp(14, 30, sunDraw[1]) : lerp(-16, 16, sunDraw[2]));
    const skyOpts = { rng: rSky, ...M.sky, sunAzimuth: sunAz };
    if (hour === 'night') { skyOpts.bake = true; skyOpts.renderer = ctx.renderer; skyOpts.bodyOverrides = { 0: { elevation: lerp(30, 42, sunDraw[3]), azimuth: laneA * 57.3 * 0.5 + lerp(-20, 20, sunDraw[4]), phase: 1 } }; }
    const sky = makeSky(skyOpts);
    await ctx.yield();
    const fogCol = sky.horizonColor.clone().lerp(sky.zenithColor, M.fogMix);
    { const gv = sky.uniforms.uGround && sky.uniforms.uGround.value; if (gv && gv.isColor) gv.copy(fogCol); else if (gv && gv.isVector3) gv.set(fogCol.r, fogCol.g, fogCol.b); }
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(fogCol.clone(), M.fogDen);
    const rig = makeLightRig(sky, { intensity: 1, ambient: 1, bounce: 0.45 });
    scene.add(rig.object);
    const keyDir = (sky.keyDirection || sky.lightDirection).clone().normalize(), litDir = sky.lightDirection.clone().normalize();
    await ctx.yield();
    // cloud towers standing round the horizon over the straits, their bases in shade, drifting with the trade wind;
    // and a trade-wind cumulus towering over each island (the sky over the lake itself is left clear: the calm lies in the sun)
    const towers = [];
    for (const q of isles) towers.push([q.x + rCloud.range(-0.3, 0.3) * q.R, q.H + rCloud.range(140, 240), q.z + rCloud.range(-0.3, 0.3) * q.R, q.R * rCloud.range(1.7, 2.4)]);
    for (let i = 0, n = rCloud.int(9, 12); i < n; i++) {
      const a = (i + rCloud.range(0.15, 0.85)) / n * TAU, d = rCloud.range(2700, 3400);
      towers.push([Math.cos(a) * d, rCloud.range(130, 230), Math.sin(a) * d, rCloud.range(600, 1050)]);
    }
    await ctx.yield();
    const cloudField = makeCloudField({ rng: rCloud, sky, at: towers, puffs: 40, height: 0.7, wind: [1.3, 0, 0.5], farFade: [5200, 6000], fogFade: 0.4, opacity: 0.95, renderOrder: 0.8 });
    scene.add(cloudField.object);
    await ctx.yield();

    // ------------------------------------------------------------ the whales' shared block
    const kit = await makeWhaleKit(ctx, { rng: rKit });
    const U = kit.uniforms;
    U.uLake.value.set(0, 0, R0, 0); U.uShape.value.set(shape[0], shape[1], shape[2], shape[3]);
    U.uLane.value.set(laneDir[0], laneDir[1], LANE_W, 1);
    for (let i = 0; i < 2; i++) U.uSwell.value[i].set(swellDef[i][0], swellDef[i][1], swellDef[i][2], swellDef[i][3]);
    U.uTurq.value.set(M.turq); U.uCobalt.value.set(M.cobalt); U.uSeaDeep.value.set(M.seaDeep); U.uSeaFire.value.setRGB(M.seaFire[0], M.seaFire[1], M.seaFire[2]);
    // (how fast the water takes the light, a metre: on the lake bodies are seen to forty-five metres; outside whole
    // to twelve and not at all below twenty-six)
    U.uClear.value.set(0.023, 0.09);
    U.uSunDir.value.copy(litDir); U.uSunCol.value.setRGB(M.sun[0], M.sun[1], M.sun[2]);
    U.uSkyCol.value.setRGB(M.skyAmb[0], M.skyAmb[1], M.skyAmb[2]); U.uBounce.value.setRGB(M.bounce[0], M.bounce[1], M.bounce[2]);
    U.uFogCol.value.copy(fogCol); U.uFogDen.value = M.fogDen;
    U.uSkin.value.set(M.skin); U.uScar.value.set(M.scar); U.uSkyRefl.value.copy(sky.horizonColor).lerp(sky.zenithColor, 0.35);
    U.uSpoutLit.value.setRGB(M.spoutLit[0], M.spoutLit[1], M.spoutLit[2]); U.uSpoutShade.value.setRGB(M.spoutShade[0], M.spoutShade[1], M.spoutShade[2]);
    U.uFoam.value.setRGB(M.foam[0], M.foam[1], M.foam[2]); U.uBow.value = M.bow;
    U.uWind.value.set(Math.cos(windA) * 1.0, 0.22, Math.sin(windA) * 1.0);
    // (the ring's light on the whales: from its middle, half of it at forty metres)
    U.uGateL.value.set(portalAt.x, 0.5 * GATE_R, portalAt.z, 40); U.uGateCol.value.copy(col(M.portal)).multiplyScalar(2.2);
    const WL = [41, 26, 15, 9.2, 5.6, 3.3], WA = [0.3, 0.21, 0.13, 0.08, 0.05, 0.03];
    for (let i = 0; i < 6; i++) { const a = windA + rWave.range(-0.55, 0.55); U.uWave.value[i].set(Math.cos(a), Math.sin(a), TAU / WL[i], WA[i] * swellK); U.uWavePh.value[i] = rWave.range(0, TAU); }
    U.uRanks.value.set(rIn / R0, dr / R0, 0, 0); U.uPhase.value.set(rPh.range(0, 60), rPh.range(0, TAU), rPh.range(0, TAU), rPh.range(0, TAU));
    await ctx.yield();

    // ------------------------------------------------------------ SEA: the surface, the blue under it, the shafts
    const tRip = await makeRipples(rRip, ctx.yield);
    await ctx.yield();
    const c3 = (c, k) => [c.r * k, c.g * k, c.b * k];
    const tPano = await makePanorama(noise, towers, { lit: c3(sky.cloudLit || col('#ffffff'), 0.95), shade: c3(sky.cloudShade || col('#8ea4c8'), 0.9), shore: c3(col(hour === 'night' ? '#1a2a52' : '#5578b4').lerp(fogCol, 0.55), 1) }, ctx.yield);
    await ctx.yield();
    // the shelf's map (see makeShoal): every island's shore line by bearing, then the square that holds them all
    const shoalIsles = isles.map((q) => { const shore = new Float32Array(256); let rMax = 0; for (let i = 0; i < 256; i++) { shore[i] = shoreOf(q, i / 256 * TAU); rMax = Math.max(rMax, shore[i]); } return { x: q.x, z: q.z, shore, rMax }; });
    const shoalExt = isles.reduce((m, q) => Math.max(m, Math.abs(q.x) + q.R * 1.4 + SHELF, Math.abs(q.z) + q.R * 1.4 + SHELF), 400);
    await ctx.yield();
    const tShoal = await makeShoal(shoalIsles, shoalExt, ctx.yield);
    // (the whales' own shader reads the bed's chart and the sea's light too: a body under water fades into the deep's blue)
    U.tShoal.value = tShoal; U.uShoal.value.set(0.5 / shoalExt, SHELF); U.uSeaLit.value = M.seaLit;
    await ctx.yield();
    const SU = {
      ...U, tRip: { value: tRip }, tShoal: { value: tShoal }, uShoal: { value: new THREE.Vector2(0.5 / shoalExt, SHELF) }, uSkyHor: { value: sky.horizonColor.clone() }, uSkyZen: { value: sky.zenithColor.clone() },
      uCloudCol: { value: (sky.cloudLit ? sky.cloudLit.clone() : col('#ffffff')).multiplyScalar(0.95) }, uCloudShade: { value: (sky.cloudShade ? sky.cloudShade.clone() : col('#8ea4c8')).multiplyScalar(0.9) },
      uBreath: { value: [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)] }, uGlint: { value: M.glint }, uSeaLit: { value: M.seaLit },
      uRing: { value: new THREE.Vector4(rIn, dr, NC, 0) }, uBullR: { value: new THREE.Vector2(ringR(NC), ringR(NC + 1)) }, uPortal: { value: new THREE.Vector4(portalAt.x, portalAt.z, GATE_R, 1) }, uGate: { value: new THREE.Vector4(portalAt.x, portalAt.y, portalAt.z, GATE_R) }, uPortalCol: { value: col(M.portal).multiplyScalar(0.9) },
      tPano: { value: tPano }, uIsle: { value: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (isles[i] ? new THREE.Vector4(isles[i].x, isles[i].z, isles[i].R, isles[i].H) : new THREE.Vector4(0, 0, 1, 0))) }, uIsleLit: { value: M.island },
      uWake: { value: 0.5 }, uBoatY: { value: 0 }, uFall: { value: [new THREE.Vector4(0, 0, -1, 1), new THREE.Vector4(0, 0, -1, 1)] }, uShaftDir: { value: new THREE.Vector3() }, uShaftCol: { value: new THREE.Color(M.shaft[0], M.shaft[1], M.shaft[2]) },
    };
    SU.uSunDir = { value: keyDir };
    { const s = keyDir, hx = -s.x / 1.33, hz = -s.z / 1.33; SU.uShaftDir.value.set(hx, -Math.sqrt(Math.max(0.2, 1 - hx * hx - hz * hz)), hz).normalize(); }
    const seaGeo = (() => {
      const rings = 90, seg = 112, pos = [0, 0, 0], idx = [], ratio = Math.pow(3900 / 0.9, 1 / (rings - 1));
      for (let i = 0; i < rings; i++) { const r = 0.9 * Math.pow(ratio, i); for (let j = 0; j < seg; j++) { const a = (j + (i % 2) * 0.5) / seg * TAU; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); } }
      for (let j = 0; j < seg; j++) idx.push(0, 1 + (j + 1) % seg, 1 + j);
      for (let i = 0; i < rings - 1; i++) for (let j = 0; j < seg; j++) { const a = 1 + i * seg + j, b = 1 + i * seg + (j + 1) % seg, c = a + seg, d = b + seg; idx.push(a, b, d, a, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
      return g;
    })();
    await ctx.yield();
    const seaMat = new THREE.ShaderMaterial({
      uniforms: SU, vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });
    const sea = new THREE.Mesh(seaGeo, seaMat); sea.frustumCulled = false; sea.renderOrder = 1; scene.add(sea);
    await ctx.yield();
    const deepMat = new THREE.ShaderMaterial({ uniforms: SU, vertexShader: DEEP_VERT, fragmentShader: DEEP_FRAG, side: THREE.DoubleSide });
    const deepGeo = (() => {
      // rings of triangles of one kind round its middle, not one fan: the blue is worked at every corner and
      // carried straight across a triangle, and across one huge triangle that goes wrong
      const RR = [0, 24, 50, 100, 200, 400, 800, 1600, 2800, 3950], seg = 48, pos = [], idx = [];
      for (let i = 0; i < RR.length; i++) for (let j = 0; j < seg; j++) { const a = (j + (i % 2) * 0.5) / seg * TAU; pos.push(Math.cos(a) * RR[i], 0, Math.sin(a) * RR[i]); }
      for (let i = 0; i < RR.length - 1; i++) for (let j = 0; j < seg; j++) { const a = i * seg + j, b = i * seg + (j + 1) % seg, c = a + seg, d = b + seg; if (i > 0) idx.push(a, b, d); idx.push(a, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
      return g;
    })();
    const deep = new THREE.Mesh(deepGeo, deepMat); deep.position.y = -FLOOR; deep.frustumCulled = false; deep.renderOrder = -0.5; scene.add(deep);
    await ctx.yield();
    {
      // each beam stands at a place of its own in the lake, leaning with the sun: all over the clear water by one rule
      // of the lake (anywhere within 0.9 of its radius, some two hundred to the hectare)
      const list = [];
      for (let i = 0, n = Math.round(800 * detail); i < n; i++) {
        const a = rShaft.range(0, TAU), q = R0 * Math.sqrt(rShaft()) * 0.95, x = Math.cos(a) * q, z = Math.sin(a) * q, wd = rShaft.range(0.4, 1.0), sd = rShaft();
        if (rhoOf(x, z) <= 0.9) list.push(x, z, wd, sd);
      }
      const g = new THREE.InstancedBufferGeometry(), pos = [], idx = [];
      for (let leaf = 0; leaf < 2; leaf++) for (let r = 0; r < 4; r++) {
        pos.push(-1, r / 3, leaf, 1, r / 3, leaf);
        if (r < 3) { const o = leaf * 8 + r * 2; idx.push(o, o + 1, o + 3, o, o + 3, o + 2); }
      }
      g.setIndex(idx); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('iS', new THREE.InstancedBufferAttribute(new Float32Array(list), 4)); g.instanceCount = list.length / 4;
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
      const shafts = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: SU, vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      shafts.frustumCulled = false; shafts.renderOrder = 0.5; scene.add(shafts);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the straits: green islands, a far blue shore
    const LU = { uSunDir: U.uSunDir, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol, uBounce: U.uBounce, uFogCol: U.uFogCol, uFogDen: U.uFogDen, uTime: U.uTime, uLandLit: { value: M.island } };
    const landMat = new THREE.ShaderMaterial({ uniforms: LU, vertexShader: LAND_VERT, fragmentShader: LAND_FRAG });
    {
      // RAIN falls where the weather puts it: from the tower of the horizon's ring that stands furthest downwind
      // (the trade wind has carried it longest); from a third of the way up the cloud to the sea, leaning downwind.
      // On some visits an island or the ranks' blows stand before it.
      let tw = towers[isles.length], bestA = -1e9;
      for (let i = isles.length; i < towers.length; i++) { const dw = towers[i][0] * Math.cos(windA) + towers[i][2] * Math.sin(windA); if (dw > bestA) { bestA = dw; tw = towers[i]; } }
      const hgt = tw[1] + 0.3 * tw[3], wid = 0.6 * tw[3], yaw = Math.atan2(-tw[0], -tw[2]);
      const lean = (Math.cos(windA) * Math.cos(yaw) - Math.sin(windA) * Math.sin(yaw)) * 0.3 * hgt;
      const veil = new THREE.Mesh(new THREE.PlaneGeometry(wid, hgt), new THREE.ShaderMaterial({
        uniforms: { uTime: U.uTime, uLean: { value: lean }, uCol: { value: fogCol.clone().multiplyScalar(0.55) } },
        vertexShader: RAIN_VERT, fragmentShader: RAIN_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      veil.position.set(tw[0], 0.5 * hgt, tw[2]); veil.rotation.y = yaw; veil.renderOrder = 0.7; veil.frustumCulled = false; scene.add(veil);
    }
    for (const q of isles) {
      const m = new THREE.Mesh(await islandGeometry(noise, q.R, q.H, q.ox, q.oz, q.strait ? 44 : 18, q.strait ? 150 : 56, ctx.yield), landMat);
      m.position.set(q.x, 0, q.z); scene.add(m);
      await ctx.yield();
    }
    {
      // SURF round every island: a band from three metres inside its shore line to thirteen metres out
      const pos = [], uvs = [], idx = [];
      for (const q of isles) {
        const seg = q.strait ? 144 : 72, base = pos.length / 3; let run = 0;
        for (let j = 0; j <= seg; j++) {
          const a = j / seg * TAU, r = shoreOf(q, a), ca = Math.cos(a), sa = Math.sin(a);
          if (j > 0) run += TAU / seg * r;
          pos.push(q.x + ca * (r - 3), 0, q.z + sa * (r - 3), q.x + ca * (r + 13), 0, q.z + sa * (r + 13)); uvs.push(run, 0, run, 1);
          if (j < seg) { const o = base + j * 2; idx.push(o, o + 1, o + 3, o, o + 3, o + 2); }
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
      const surf = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: SU, vertexShader: SURF_VERT, fragmentShader: SURF_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor }));
      surf.frustumCulled = false; surf.renderOrder = 1.5; scene.add(surf);
      await ctx.yield();
      // PALMS along the shores of every island (150 to each island of the strait, 40 to each of the others): behind
      // the beach and on the cliff's brow, between 0.8 and 0.945 of the way out to the outline, all round, wherever
      // the ground stands more than a metre and a half out of the sea
      const iP = [], iQ = [];
      for (const q of isles) for (let i = 0, n = Math.round((q.strait ? 150 : 40) * detail); i < n; i++) {
        const a = rPalm.range(0, TAU), t = rPalm.range(0.8, 0.945), hgt = rPalm.range(7, 12), yaw = rPalm.range(0, TAU), ph = rPalm.range(0, TAU), la = rPalm.range(0, TAU);
        const rr = q.R * islandLump(noise, q.ox, q.oz, a) * t, x = Math.cos(a) * rr, z = Math.sin(a) * rr, y = islandY(noise, q.R, q.H, q.ox, q.oz, x, z, t);
        if (y < 1.5) continue;
        iP.push(q.x + x, y - 0.3, q.z + z, hgt); iQ.push(yaw, Math.cos(la), ph, Math.sin(la));
      }
      const pg = new THREE.InstancedBufferGeometry(), pb = palmGeometry();
      pg.index = pb.index; for (const k of Object.keys(pb.attributes)) pg.setAttribute(k, pb.attributes[k]);
      pg.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(iP), 4)); pg.setAttribute('iQ', new THREE.InstancedBufferAttribute(new Float32Array(iQ), 4));
      pg.instanceCount = iP.length / 4; pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
      const palms = new THREE.Mesh(pg, new THREE.ShaderMaterial({ uniforms: LU, defines: { PALM: 1 }, vertexShader: LAND_VERT, fragmentShader: LAND_FRAG, side: THREE.DoubleSide }));
      palms.frustumCulled = false; scene.add(palms);
      await ctx.yield();
    }
    const ridges = T.makeHorizonRidges({ rng: rShore, layers: 2, radius: [3000, 3700], height: [60, 210], base: -12, coverage: 0.5, jagged: 0.35,
      colorNear: hour === 'night' ? '#1a2a52' : '#5578b4', haze: fogCol, sunDir: litDir, sunColor: sky.lightColor, sunIntensity: 0.6, snow: null, rim: 0.2 });
    scene.add(ridges.object);
    await ctx.yield();

    // ------------------------------------------------------------ the boat
    // Wet wood. THE STROKE (uRow, a phase on the world's clock, 0.55 strokes a second): the four after oars swing on
    // their thole pins, dip for the pull and lift for the return; the men lean to them; the steering oar sculls a
    // little. Nothing else hangs on it.
    const boatMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0, side: THREE.DoubleSide });
    const uRow = { value: new THREE.Vector2(0, 1) };
    boatMat.onBeforeCompile = (sh) => {
      sh.uniforms.uRow = uRow;
      sh.vertexShader = 'attribute vec4 aRow;\nuniform vec2 uRow;\nvarying vec3 vWood;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vWood = position;
        if (aRow.w > 0.5) {
          vec3 q = transformed - aRow.xyz;
          float sd = aRow.x < 0. ? -1. : 1.;
          if (aRow.w > 1.5 && aRow.w < 2.5) q.z += 0.5*q.y*cos(uRow.x)*uRow.y;
          else {
            float a = (aRow.w < 1.5 ? 0.42*cos(uRow.x)*uRow.y : 0.07*sin(uRow.x*0.37))*sd, b = (aRow.w < 1.5 ? mix(0.1, 0.045 - 0.095*sin(uRow.x), uRow.y) : 0.)*sd;
            float ca = cos(a), sa = sin(a), cb = cos(b), sb = sin(b);
            q = vec3(ca*q.x + sa*q.z, q.y, -sa*q.x + ca*q.z);
            q = vec3(cb*q.x - sb*q.y, sb*q.x + cb*q.y, q.z);
          }
          transformed = aRow.xyz + q;
        }`);
      // the wood's grain: streaks along her length, finer and coarser, and darker damp patches
      sh.fragmentShader = 'varying vec3 vWood;\nfloat wh(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }\nfloat wn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); return mix(mix(wh(i), wh(i + vec2(1., 0.)), f.x), mix(wh(i + vec2(0., 1.)), wh(i + vec2(1., 1.)), f.x), f.y); }\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        { float across = vWood.x*37. + vWood.y*53.;
          float gr = 0.6*wn(vec2(across, vWood.z*2.2)) + 0.4*wn(vec2(across*2.7 + 9., vWood.z*5.));
          float damp = smoothstep(0.45, 0.75, wn(vWood.xz*1.7 + vWood.y*2.3));
          diffuseColor.rgb *= (0.74 + 0.42*gr)*(1. - 0.22*damp); }`).replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor *= 1. - 0.45*smoothstep(0.45, 0.75, wn(vWood.xz*1.7 + vWood.y*2.3));`);
    };
    const boat = new THREE.Mesh(bowGeometry(), boatMat);
    boat.frustumCulled = false; scene.add(boat);
    await ctx.yield();

    // ------------------------------------------------------------ THE HERD
    // Every whale is a record (see packWhale in the part); the GPU swims them. EVERY WHALE OF A RANK SWIMS THE WHOLE
    // ROUND of its rank, all round the lake, in one model for the whole rank (the rank model for the cows' ranks, the
    // middle model for the bulls' two ranks): none is set down or taken up anywhere, and no rank is dressed for where
    // the route crosses it. The visit's density thickens the host beyond the ranks and the tiers under the lake; the
    // ranks are as thick on every visit.
    // (a blow's height: 0.23 of a cow's length; 0.28 of a bull's; less for one that lies quiet)
    // THE MAKE IS BY DISTANCE FROM THE ROUTE'S LINE (lineD: metres from a place in the sea to the nearest point of
    // the line, its height counted): a whale within three of its own lengths of it is THE FULL MAKE (fulls); beyond,
    // a plainer make of the same outline. One that keeps its place has its make for good. The whales of the ranks
    // swim the whole round: each is drawn in the full make while it is within three lengths of the line and in the
    // plain one beyond (see THE RANKS' MAKE below).
    const lineD = (x, y, z) => { const n = path.nearestXZ(x, z); return Math.hypot(n.dist, n.y - y); };
    const xzOf = (rec) => { const sh = lakeShape(rec.th); return [Math.cos(rec.th) * rec.r * sh, Math.sin(rec.th) * rec.r * sh]; };
    const isNear = (rec, y) => { const p = xzOf(rec); return lineD(p[0], y || 0, p[1]) < 3 * rec.len; };
    const mids = [], fulls = [], fars = [], rankers = [], bulls = [], spoutList = [], plumeList = [], washList = [], washLite = [];
    const yawFor = (th, beta) => beta - tangentAngle(th);
    const place = (x, z) => { const th = Math.atan2(z, x); return { th, r: Math.hypot(x, z) / lakeShape(th) }; };
    const tintOf = (g) => { const v = g.range(0.84, 1.18), w = g.range(-0.04, 0.04); return [v * (1 + w), v, v * (1 - w)]; };
    // a pod of a rank: a file two abreast, the pairs following one another 1.2 of their length apart
    const addPod = (g, bull, r, th0, wAng, n, speed, kRank) => {
      const per = g.range(7.5, 11.5), ph0 = g();
      for (let j = 0; j < n; j++) {
        const side = j % 2, row = j >> 1, young = !bull && g.chance(0.16);
        const len = bull ? g.range(16.5, 19.5) : young ? g.range(5.2, 7.6) : g.range(9.6, 12.6), gapA = bull ? 24 : 14;
        // (a bull rides high: head and hump stand 1.9 to 2.7 m out of the water at the top of its roll: over the
        // head of a man standing in a boat)
        const amp = bull ? g.range(1.0, 1.5) : g.range(1.15, 1.6), top = bull ? g.range(1.9, 2.7) : g.range(0.6, 1.2);
        // (A BULL OF THE RANKS KEEPS A LENGTH AND A HALF OF ITS OWN from the middle of the bulls' water: its middle
        // line never comes nearer, whichever way it swings (its yaw and its wander), wherever the line strays; the
        // second of a pair lies 4.8 m beyond the first. THE MARGIN, STATED ONCE: a length and a half of a whale's
        // middle line from our line holds WHERE THE EYE IS DOWN, at the bow's height: along the bulls' water and
        // down the lane. Where the eye rides two boat lengths up, the whales of the ranks pass UNDER the line, deep:
        // the lane of deep water along the route's line (the part's WAY block) has every whale 5.9 m and more under
        // within 6.2 m of the line, by the whale's own place, at every clock; nothing gives way to the boat or the eye)
        const yw = bull ? g.range(-0.1, 0.1) : g.range(-0.2, 0.2), yawW = bull ? 0.05 : 0.08, jr = bull ? g.range(0, 1) : g.range(0, 2);
        const off = bull ? (1.5 * len + 0.5 * len * Math.sin(Math.abs(yw) + yawW) + side * 4.8 + jr) / stray.shape : 0;
        const rec = {
          r: bull ? (kRank === NC ? rGap - off - stray.gapIn : rGap + off + stray.gapOut) : r + (side - 0.5) * 3.4 + jr - 1, th: th0 - Math.sign(wAng) * (row * gapA + side * 0.45 * gapA + g.range(-3, 3)) / r, w: wAng, len,
          ph: ph0 + g.range(-0.22, 0.22) + row * 0.11 + side * 0.07, per: per * g.range(0.92, 1.08) * (bull ? 1.25 : 1), y: top - 0.092 * len - amp, amp, arch: g.range(0.1, 0.3), pitch: g.range(-0.03, 0.05),
          roll: g.range(0, 0.08), swim: 0.02 + 0.006 * speed, fluke: g.chance(0.5) ? g.range(0.6, 1) : g.range(0, 0.25), seed: g(),
          yaw: yw, yawW, tint: tintOf(g), calf: young ? 0.5 : 0, k: kRank,
        };
        // (on the rare visit when the innermost rank stands with its heads out, that rank's cows are those: see below)
        if (headsOut && kRank === 0) continue;
        // (a bull's places in the wash's, the shades' and the blows' lists: the world writes there what it keeps of it)
        if (bull) { rec.wi = washList.length; rec.si = spoutList.length; bulls.push(rec); washList.push(rec); spoutList.push({ whale: rec, n: 20, ph: 0.06, size: 0.28 * len }); }
        else { rec.wi = washLite.length; rec.si = spoutList.length; rankers.push(rec); washLite.push(rec); spoutList.push({ whale: rec, n: 7, ph: 0.06, size: 0.23 * len }); }
      }
    };
    // two of the cows' ranks go round against the rest; the bulls' two ranks go round against each other
    const counter = [hr.int(2, 4), hr.int(6, NC - 1)];
    const rankSense = (k) => dirSign * (k >= NC ? (k === NC ? 1 : -1) : counter.includes(k) ? -1 : 1);
    const headsOut = rare && rareKind === 'heads';
    for (let k = 0; k < KO; k++) {
      const bull = k >= NC, g = bull ? rBull : hr, r = ringR(k), tK = Math.min(1, k / (NC - 1));
      const speed = (bull ? 4.4 : lerp(1.6, 4.0, tK)) * g.range(0.9, 1.1), wAng = rankSense(k) * speed / r;
      // a pod (four to seven cows) to every 70 m of the innermost rank, to every 120 m of the outermost cows' rank; the
      // bulls go by twos and threes, a company to every 2.6 bull lengths of their rank, all round (one long file two
      // abreast: where the way runs down their water there is always a bull or two on either hand)
      const sp = bull ? 2.6 * BULL : lerp(70, 120, tK), nP = Math.max(3, Math.round(TAU * r / sp)), jt = bull ? 0.08 : 0.3;
      for (let p = 0; p < nP; p++) addPod(g, bull, r, (p + 0.5 + g.range(-jt, jt)) * TAU / nP, wAng, bull ? g.int(2, 3) : g.int(4, 7), speed, k);
    }
    await ctx.yield();
    // THE HOST BEYOND THE RANKS, all round: pods lying and rolling where they are, heading every way. A rule of the
    // place: the host lies widest to leeward (it reaches 90 m beyond the bulls to windward and 730 m to leeward) and
    // is as thick everywhere (a pod is kept with a chance that grows with the host's reach at its bearing);
    // a pod drawn within 110 m of a shore is left out (its draws are made all the same). Pods within HOST_NEAR metres of
    // the route's line are in the middle model with their white water, the rest in the far model: a pod keeps its
    // place, so none ever changes.
    {
      const rOut = ringR(KO - 1), g = rHostS, HOST_NEAR = 100;
      for (let i = 0, n = Math.round(350 * dens * detail); i < n; i++) {
        const th = g.range(0, TAU), ext = 90 + 640 * smoothstep(-0.3, 1, Math.cos(th - windA)), thick = g() < ext / 730, q = Math.pow(g(), 1.6), per = g.range(8, 13), ph0 = g(), head = g.range(0, TAU), nn = g.int(3, 7);
        const r = rOut + 24 + (ext - 24) * q, cx = Math.cos(th) * r * lakeShape(th), cz = Math.sin(th) * r * lakeShape(th), keep = thick && !landNear(cx, cz, 110), near = keep && pathD(cx, cz) < HOST_NEAR;
        for (let j = 0; j < 7; j++) {
          const len = g.range(9, 13), rj = g.range(-16, 16), tj = g.range(-20, 20), pj = g.range(-0.25, 0.25), fl = g.chance(0.3), sd = g(), yw = g.range(-0.5, 0.5), tint = tintOf(g);
          if (!keep || j >= nn) continue;
          const th1 = th + tj / r;
          const rec = { r: r + rj, th: th1, w: 0, len, ph: ph0 + pj, per, y: 0.5 - 0.092 * len - 1.3, amp: 1.3, arch: 0.2, swim: 0.012, fluke: fl ? 0.9 : 0.1, seed: sd, yaw: yawFor(th1, head + yw), yawW: 0.1, tint };
          const wp = xzOf(rec);
          if (pathD(wp[0], wp[1]) < 0.5 * len + 6.2) continue;
          if (near) { (isNear(rec) ? fulls : mids).push(rec); washList.push(rec); spoutList.push({ whale: rec, n: 8, ph: 0.07, size: 0.23 * len }); }
          else { fars.push(rec); plumeList.push({ whale: rec, n: 2, ph: 0.07, size: 0.25 * len }); }
        }
      }
    }
    // the strip of the lane inside the lake and out to the gate (with a margin): nothing lies or hangs in it but its two ranks
    const inLane = (x, z, pad) => x * laneDir[0] + z * laneDir[1] > (MOUTH - 0.1) * Rlane && Math.abs(x * laneDir[1] - z * laneDir[0]) < LANE_W + pad;
    // rare: every whale of the innermost ring lifts its head aslant out of the water, looking in at the lake
    if (rare && rareKind === 'heads') {
      const hr = rHeads, r = ringR(0) - 3, n = Math.round(TAU * r / 15), per = hr.range(6.5, 8.5), ph0 = hr();
      for (let i = 0; i < n; i++) {
        const th = (i + hr.range(-0.2, 0.2)) / n * TAU, x = Math.cos(th) * r * lakeShape(th), z = Math.sin(th) * r * lakeShape(th), len = hr.range(9.6, 12.4);
        const rec = { r: r + hr.range(-2, 2), th, w: 0, len, ph: ph0 + hr.range(-0.05, 0.05), per, y: -hr.range(0.03, 0.06) * len, amp: 0.8, swim: 0.006, seed: hr(), yaw: yawFor(th, th + Math.PI + hr.range(-0.25, 0.25)), yawW: 0.12, pitch: hr.range(0.3, 0.5), tint: tintOf(hr) };
        // (none in the boat's way or in the lane: half a length and 6.2 m from the line, as the host keeps)
        if (pathD(x, z) < 0.5 * len + 6.2 || inLane(x, z, 4)) continue;
        (isNear(rec) ? fulls : mids).push(rec); washList.push(rec);
      }
    }

    // ON THE LAKE, all over it by one rule of the lake (anywhere within 0.86 of its radius, seventeen metres apart): cows
    // and calves at their ease, heading round the lake as the innermost rank does (one in four the other way), give
    // or take 0.6 rad, each in a pose drawn for it: lying awash (half of them), rolling, lying on its side with a
    // flipper in the air, or (one in twelve) lifting its head aslant out of the water with its back awash behind it
    // (a third of its length at most, rising and sinking back, white water round it) to look round. NONE STANDS ON
    // END. None lies within half its length and 6.2 m of the boat's line (as the host keeps off it).
    // Every number of a cow and of her calf is drawn before any test.
    const spots = [];
    let whiteCalf = null, whiteD = 1e9;
    for (let i = 0, tries = 0, n = Math.round(46 * dens); i < n && tries < 5000; tries++) {
      const a = lr.range(0, TAU), rr = R0 * Math.sqrt(lr()) * 0.92, len = lr.range(9.6, 12.2), pose = lr(), bOff = lr.range(-0.6, 0.6), flip = lr.chance(0.25), per = lr.range(9, 17), ph = lr();
      const sd0 = lr.sign(), roll0 = lr.range(0, 0.1), seed = lr(), tint = tintOf(lr), q1 = lr(), q2 = lr(), q3 = lr(), blowPh = lr();
      const hasCalf = lr.chance(0.7), cl = lr.range(4, 5.4), csd = lr.sign(), back = lr.range(-2.5, 1.5), cbo = lr.range(-0.25, 0.25), cr1 = lr(), cr2 = lr.range(0.6, 1.3), cseed = lr(), cblow = lr();
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      if (rhoOf(x, z) > 0.86 || pathD(x, z) < len * 0.5 + 6.2) continue;
      if (inLane(x, z, 2 + len * 0.5) || Math.hypot(x - heart[0], z - heart[1]) < 15 || Math.hypot(x - mum0.x, z - mum0.z) < 14 || Math.hypot(x - 0.5 * (calf0.x + calfMeet.x), z - 0.5 * (calf0.z + calfMeet.z)) < 12) continue;
      if (spots.some((s) => Math.hypot(s[0] - x, s[1] - z) < 17)) continue;
      spots.push([x, z]); i++;
      const pl = place(x, z), beta = tangentAngle(pl.th) + (dirSign > 0 ? 0 : Math.PI) + (flip ? Math.PI : 0) + bOff, fx = Math.cos(beta), fz = Math.sin(beta);
      const cow = { ...pl, w: 0, len, ph, per, y: 0.5 - 0.092 * len, amp: 0.14, arch: 0.08 + 0.2 * ph, roll: roll0, swim: 0.006, seed, yaw: yawFor(pl.th, beta), yawW: 0.12, tint };
      if (pose > 0.917) { cow.pitch = 0.3 + 0.2 * q1; cow.y = -(0.03 + 0.03 * q2) * len; cow.amp = 0.8; cow.per = 6 + 3 * q3; cow.arch = 0; }
      else if (pose > 0.7) { cow.rollO = sd0 * (1.2 + 0.25 * q1); cow.y = -0.035 * len; cow.roll = 0.16; }
      else if (pose > 0.5) cow.roll = 0.5 + 0.6 * q1;
      (isNear(cow) ? fulls : mids).push(cow);
      spoutList.push({ whale: cow, n: 8, ph: blowPh, size: 0.15 * len }); washList.push(cow);
      if (pose <= 0.7 && hasCalf) {
        const off = 0.1 * len + 1.5, cx = x + fz * csd * off + fx * back, cz = z - fx * csd * off + fz * back;
        if (pathD(cx, cz) < cl * 0.5 + 6.2) continue;
        const cp = place(cx, cz);
        const calf = { ...cp, w: 0, len: cl, ph: ph + 0.3, per: per * 0.6, y: 0.26 - 0.092 * cl, amp: 0.12, roll: cr1 < 0.5 ? cr2 : 0.15, swim: 0.012, seed: cseed, yaw: yawFor(cp.th, beta + cbo), yawW: 0.25, tint: [1.42, 1.44, 1.5], calf: 1 };
        // (the rare white calf is the one that lies nearest the lake's heart)
        const hd = Math.hypot(cx - heart[0], cz - heart[1]);
        if (hd < whiteD) { whiteD = hd; whiteCalf = calf; }
        (isNear(calf) ? fulls : mids).push(calf); spoutList.push({ whale: calf, n: 5, ph: cblow, size: 0.17 * cl }); washList.push(calf);
      }
    }
    // A LEAP, the same course for every leaper (tau = the seconds of its own leap, read off the leaps' long round on
    // the world clock for every one of them, the great bull too, from the moment its snout is twelve metres under;
    // b = { x, z, fx, fz, len, top, run, hide }). It comes up from where the water hides it (its middle b.hide and
    // half its length down: the whole of it under its out-of-sight depth b.hide, at and under which the part draws
    // no point of a whale and toward which it thins every point away. In the lake that depth is the lake's floor
    // of blue and a metre, the part's FLOOR; outside it is the part's OPEN_HIDE),
    // driving up at fifty-four degrees; breaks out (tOut); stands so until the top of its leap
    // with its middle 'top' metres over the water (two thirds of it out); turns on its side as it tips over and
    // falls back along its length (tFall); then it SOUNDS: it turns head down and sinks at SINK metres a second
    // until the water hides it again, and only there is it put away (tEnd).
    const HIDE_OUT = OPEN_HIDE, HIDE_LAKE = FLOOR + 1, SINK = 7;
    const leapSet = (b) => {
      b.y0 = -(0.407 * b.len + 12); b.v = Math.sqrt(12 * (b.top - b.y0));
      b.tOut = (b.v - Math.sqrt(Math.max(0, b.v * b.v - 12 * (12 + 0.04 * b.len)))) / 6;
      b.tFall = (b.v + Math.sqrt(Math.max(0, b.v * b.v - 12 * (12 + 0.357 * b.len)))) / 6;
      const deep = b.hide + 0.5 * b.len, yFall = b.y0 + b.v * b.tFall - 3 * b.tFall * b.tFall;
      b.t0 = -Math.max(0, deep + b.y0) / b.v; b.tEnd = b.tFall + Math.max(0, deep + yFall) / SINK;
      return b;
    };
    // THE GREAT BULL AND HIS BERTH (the design's last stretch: beside the lane a great bull breaches, hangs, and
    // falls back in a wall of white water). HE DOES IT ON A ROUND OF THE WORLD CLOCK, over and over (see THE GREAT
    // BULL'S BREACHES below): nothing begins it. A bull of 19 to 20.5 m, one of the lane's rank on a drawn side:
    // HIS BERTH IN THAT RANK IS EMPTY, and he falls into it. He breaks out ONE OF HIS OWN LENGTHS from the lane's
    // middle line, heading back toward the lake and slanting away from the lane (0.4 to 0.6 rad), so he falls a
    // quarter of a length further off, in his rank's line. WHERE THE BERTH LIES along the lane IS A PLACE AND
    // NOTHING MORE (no clock is in it): 0.6 of his length inside the innermost rank of cows, in the lake's own clear
    // water, on the lane's side. It is found by stepping in along the lane, two metres at a time, from a first
    // place beyond that rank (a length worked from the route alone: the metres the declared pace makes from the
    // mouth in b.tFall seconds, his own run and 0.6 of his length more) until it lies so: where he falls is 30 to 36 m past the lane's mouth by the route's metres (seeds 1 to 300),
    // beside the slow water.
    const gbSide = rGreat.sign();
    const GB = (() => {
      const len = rGreat.range(19, 20.5), side = gbSide, tph = rGreat.range(0, TAU), slant = rGreat.range(0.4, 0.6);
      const fx = -laneDir[0] * Math.cos(slant) - laneDir[1] * side * Math.sin(slant), fz = -laneDir[1] * Math.cos(slant) + laneDir[0] * side * Math.sin(slant);
      const b = leapSet({ x: 0, z: 0, fx, fz, len, tph, top: 0.3 * len, run: 2.8, hide: HIDE_LAKE });
      const lat = len - b.run * b.tOut * Math.sin(slant);
      let al = MOUTH * Rlane + (metresAt(filmT(dLane) + b.tFall) - dLane) + 0.6 * len + b.run * b.tFall * Math.cos(slant);
      const at = (a) => [laneDir[0] * a - laneDir[1] * side * lat, laneDir[1] * a + laneDir[0] * side * lat];
      for (let n = 0; n < 60; n++) { const p = at(al); if (Math.hypot(p[0], p[1]) / lakeShape(Math.atan2(p[1], p[0])) <= ringR(0) - 0.6 * len) break; al -= 2; }
      const p = at(al);
      b.x = p[0]; b.z = p[1]; b.fallX = p[0] + fx * b.run * b.tFall; b.fallZ = p[1] + fz * b.run * b.tFall; b.outX = p[0] + fx * b.run * b.tOut; b.outZ = p[1] + fz * b.run * b.tOut;
      return b;
    })();
    // THE TWO RANKS THAT KEEP THE LANE, both whole: great bulls (16.5 to 19.5 m, half as long again as a cow and
    // more) lying along both its sides from the lane's mouth out past the gate, heading out, riding high (head and
    // hump 2.2 to 3 m out of the water at the top of the roll, their blows a third of their length high),
    // some going down flukes up. EACH LIES A LENGTH AND A HALF OF
    // ITS OWN FROM THE LANE'S MIDDLE LINE, and further by the half length its flukes can swing at its greatest yaw, by
    // the most our line strays from the lane's middle where the eye is down (stray.lane) and by a drawn metre and a
    // half at most: so its MIDDLE LINE never comes within a length and a half of our line (as drawn, its girth and
    // its flukes come to within about a length and a third of the eye); one after another with a quarter to a half
    // of a length of water between them.
    // On the great bull's side HIS BERTH AND THE NEXT ARE EMPTY (he breaks out in the one and falls into the other):
    // none lies within three quarters of the great bull's length of where he breaks out or of where he falls (its
    // draws are made), so some three bull lengths of open water stand there. THEY ROLL AND BLOW ONE AFTER ANOTHER: all on one period (LANE_PER seconds
    // of the world clock), each later than the one inside it by its distance along the lane at LANE_RUN metres a
    // second, so a wave of backs and blows runs out along the lane to the gate, over and over.
    const LANE_PER = 9, LANE_RUN = 16;
    // (gbNext: the first bull of the great bull's own rank beyond his berth, outward along the lane: the gaze's pull 3 reads it)
    const gbAl = GB.fallX * laneDir[0] + GB.fallZ * laneDir[1]; let gbNext = null;
    for (const side of [1, -1]) for (let al = MOUTH * Rlane + rLane.range(0, 8); al < portalD + 40;) {
      const len = rLane.range(16.5, 19.5), lat = side * (1.5 * len + 0.5 * len * Math.sin(0.15) + stray.lane + rLane.range(0, 1.5)), x = laneDir[0] * al - laneDir[1] * lat, z = laneDir[1] * al + laneDir[0] * lat;
      const beta = thLane + rLane.range(-0.1, 0.1), amp = rLane.range(0.6, 1.0), top = rLane.range(2.2, 3.0), jit = rLane.range(-0.04, 0.04), sound = rLane.chance(0.5) ? 0.9 : 0.1, seed = rLane(), tint = tintOf(rLane);
      const step = len * rLane.range(1.25, 1.5), here = al;
      al += step;
      const berth = side === gbSide && (Math.hypot(x - GB.outX, z - GB.outZ) < 0.75 * GB.len + 0.5 * len || Math.hypot(x - GB.fallX, z - GB.fallZ) < 0.75 * GB.len + 0.5 * len);
      if (berth || landNear(x, z, 0.5 * len) || spots.some((q) => Math.hypot(q[0] - x, q[1] - z) < 11)) continue;
      spots.push([x, z]);
      if (side === gbSide && here > gbAl && (!gbNext || here < gbNext[2])) gbNext = [x, z, here];
      const pl = place(x, z), ph = jit - here / (LANE_RUN * LANE_PER) + (side > 0 ? 0 : 0.5 * 16 / (LANE_RUN * LANE_PER));
      const rec = { ...pl, w: 0, len, ph: ph - Math.floor(ph), per: LANE_PER, y: top - 0.092 * len - amp, amp, roll: 0.07, swim: 0.01, fluke: sound, seed, yaw: yawFor(pl.th, beta), yawW: 0.05, pitch: 0.02 + 0.06 * seed, rollO: (seed - 0.5) * 0.25, arch: 0.1 + 0.16 * seed, tint, hold: 1 };
      fulls.push(rec); spoutList.push({ whale: rec, n: 30, ph: 0.06, size: 0.33 * len }); washList.push(rec);
    }
    // (the owner at intake, 10-08: no calf is tinted white on any visit; in a world from this book a white whale reads as the named one. The rare day of this kind is a usual day.)
    await ctx.yield();

    // ------------------------------------------------------------ the named pair's place, and the world below
    // at the heart, eleven metres down (the design: some twelve); she heads the way the innermost rank goes round, give or take
    path.posAtDist(dHero, _p);
    const heroAt = { x: heart[0], z: heart[1], beta: tangentAngle(Math.atan2(heart[1], heart[0])) + (dirSign > 0 ? 0 : Math.PI) + rHero.range(-0.4, 0.4), depth: 11, bx: _p.x, bz: _p.z };
    const heroR = place(heroAt.x, heroAt.z).r;
    const taken = [], upAt = [];
    // metres from (x, z) to the stretch a..b
    const segD = (x, z, a, b) => { const ux = b.x - a.x, uz = b.z - a.z, t = clamp(((x - a.x) * ux + (z - a.z) * uz) / Math.max(1e-6, ux * ux + uz * uz), 0, 1); return Math.hypot(x - a.x - ux * t, z - a.z - uz * t); };
    const mumFar = { x: mum0.x + (mumKeel.x - mum0.x) * 3, z: mum0.z + (mumKeel.z - mum0.z) * 3 };
    // THE UPPER TIER, all over the calm by one rule of the lake: cows hanging a few metres under the surface anywhere
    // within 0.8 of the lake's radius (fifteen to the hectare, times the visit's density), most of them with a calf at
    // the flank, six in ten heading round the lake as the innermost rank does. Each KEEPS HER OWN PLACE: her only
    // round is to rise and sink by 'amp' on a period of her own, and every one of them is dealt so deep that at the
    // top of it her back is still two and a half metres under a keel (a keel draws 0.45 m; her back stands a tenth
    // of her length over her middle), wherever she hangs. No two lie within twelve metres of each other unless five
    // metres apart in depth; none within seventeen metres of the heart, where the named pair hangs, none in the water
    // left to the first nosing calf and its mother. Those within UP_NEAR metres of the route's line are the finest model, the
    // rest the middle one; each keeps her place, so none ever changes.
    const upCows = [], upCalves = [], upFar = [];
    for (let i = 0, tries = 0, n = Math.round(40 * dens); i < n && tries < 6000; tries++) {
      const a = rUp.range(0, TAU), rr = R0 * Math.sqrt(rUp()) * 0.86, dMore = rUp.range(0, 4), round = rUp.chance(0.85), bOff = rUp.range(-0.4, 0.4), bAny = rUp.range(0, TAU);
      const len = rUp.range(10.4, 12.8), per = rUp.range(13, 24), ph = rUp(), amp = rUp.range(0.15, 0.4), depth = 2.95 + 0.1 * len + amp + dMore, seed = rUp(), pitch = rUp.range(-0.1, 0.12), rollO = rUp.range(-0.3, 0.3), tint = tintOf(rUp);
      const hasCalf = rUp.chance(0.75), cl = rUp.range(3.9, 5.2), sd = rUp.sign(), cdy = rUp.range(-0.3, 0.7), cseed = rUp(), croll = rUp.range(-0.4, 0.4);
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr, pl = place(x, z);
      if (rhoOf(x, z) > 0.8 || inLane(x, z, 8) || Math.hypot(x - heart[0], z - heart[1]) < 17 || Math.hypot(x - mum0.x, z - mum0.z) < 15) continue;
      if (segD(x, z, calf0, calfMeet) < 10 || segD(x, z, mum0, mumFar) < 10) continue;
      if (upAt.some((s) => Math.hypot(s[0] - x, s[1] - z) < 12 && Math.abs(s[2] - depth) < 5)) continue;
      upAt.push([x, z, depth]); taken.push([pl.r, pl.th, depth]); i++;
      const near = lineD(x, -depth, z) < 3 * len, beta = round ? tangentAngle(pl.th) + (dirSign > 0 ? 0 : Math.PI) + bOff : bAny, fx = Math.cos(beta), fz = Math.sin(beta);
      (near ? upCows : upFar).push({ ...pl, w: 0, len, ph, per, y: -depth, amp, swim: 0.01, seed, yaw: yawFor(pl.th, beta), pitch, rollO, arch: 0.3 * (seed - 0.35), tint });
      if (hasCalf) {
        const off = 0.1 * len + 1.2, cx = x + fz * sd * off - fx * 0.1 * len, cz = z - fx * sd * off - fz * 0.1 * len, cp = place(cx, cz);
        (near ? upCalves : upFar).push({ ...cp, w: 0, len: cl, ph, per, y: -depth + cdy, amp, swim: 0.016, seed: cseed, yaw: yawFor(cp.th, beta + 0.1 * sd), pitch: 0.06, rollO: croll, tint: [1.4, 1.42, 1.5], calf: 1 });
      }
    }
    await ctx.yield();
    // THE TIERS BELOW, all over the calm by the same rule of the lake (anywhere within 0.84 of its radius): every cow
    // of them hangs where she was dealt, rising and sinking a little on a round of her own (13 to 24 s); none is
    // carried round the lake by the clock. Half of them between 8.5 and 18 m down, a third between 19 and 31, the rest
    // down to 46. They are dealt after the upper tier and leave its cows room.
    const deeps = [], deepsLow = [];
    for (let i = 0, tries = 0, n = Math.round(72 * dens * (0.7 + 0.3 * detail)); i < n && tries < 6000; tries++) {
      // (every number of a cow of the tiers and of her calf is drawn before any test)
      const a = dg.range(0, TAU), rr = R0 * Math.sqrt(dg()) * 0.88, tier = dg(), dq = dg(), len = dg.range(9.8, 12.8), bOff = dg.range(-0.4, 0.4), flip = dg.chance(0.25), per = dg.range(13, 24), ph = dg(), amp = dg.range(0.2, 0.55);
      const seed = dg(), pitch = dg.range(-0.1, 0.12), rollO = dg.range(-0.15, 0.15), tint = tintOf(dg);
      const hasCalf = dg.chance(0.72), cl = dg.range(3.9, 5.2), sd = dg.sign(), nurse = dg.chance(0.55), c1 = dg(), c2 = dg(), c3q = dg(), c4 = dg(), cseed = dg();
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      if (rhoOf(x, z) > 0.84) continue;
      const depth = tier < 0.5 ? lerp(8.5, 18, dq) : tier < 0.85 ? lerp(19, 31, dq) : lerp(32, 46, dq), pl = place(x, z);
      if (Math.abs(pl.r - heroR) < 11 && Math.hypot(x - heart[0], z - heart[1]) < 16 && depth < 22) continue;
      if ((Math.hypot(x - mum0.x, z - mum0.z) < 13 && depth < 16) || (segD(x, z, mum0, mumFar) < 9 && depth < 16) || (inLane(x, z, 8) && depth < 14)) continue;
      if (taken.some((s) => Math.abs(s[0] - pl.r) < 13 && Math.abs(s[2] - depth) < 6 && Math.abs(((s[1] - pl.th + Math.PI * 3) % TAU) - Math.PI) * pl.r < 16)) continue;
      taken.push([pl.r, pl.th, depth]); i++;
      // she heads round the lake as the innermost rank does (one in four the other way), give or take 0.4 rad, level
      // or gently inclined
      const beta = tangentAngle(pl.th) + (dirSign > 0 ? 0 : Math.PI) + (flip ? Math.PI : 0) + bOff, fx = Math.cos(beta), fz = Math.sin(beta);
      const cow = { ...pl, w: 0, len, ph, per, y: -depth, amp, swim: 0.01, seed, yaw: yawFor(pl.th, beta), pitch, rollO, arch: 0.35 * (ph - 0.4), tint };
      const tierList = depth > 19 ? deepsLow : deeps;
      tierList.push(cow);
      if (hasCalf) {
        let cx, cz, cy, cb, cpitch, croll;
        if (nurse) {
          // nursing: nose up under the mother's belly two thirds of the way back, turned a little on its side
          cb = beta + sd * lerp(0.3, 0.6, c1); cpitch = lerp(0.2, 0.32, c2); croll = sd * lerp(0.3, 0.7, c3q);
          const tx = x - fx * 0.13 * len, tz = z - fz * 0.13 * len, hx = Math.cos(cb) * Math.cos(cpitch) * 0.5 * cl, hz = Math.sin(cb) * Math.cos(cpitch) * 0.5 * cl;
          cx = tx - hx; cz = tz - hz; cy = -depth - 0.1 * len - Math.sin(cpitch) * 0.5 * cl - 0.25;
        } else {
          const off = 0.1 * len + 1.3; cb = beta + lerp(-0.15, 0.15, c1); cpitch = lerp(-0.05, 0.12, c2); croll = lerp(-0.3, 0.3, c3q);
          cx = x + fz * sd * off - fx * 0.12 * len; cz = z - fx * sd * off - fz * 0.12 * len; cy = -depth + lerp(-0.2, 0.9, c4);
        }
        const cp = place(cx, cz);
        tierList.push({ ...cp, w: 0, len: cl, ph, per, y: cy, amp, swim: 0.016, seed: cseed, yaw: yawFor(cp.th, cb), pitch: cpitch, rollO: croll, tint: [1.4, 1.42, 1.5], calf: 1 });
      }
    }
    await ctx.yield();
    // calves going up for air and down again to their mothers, anywhere within 0.78 of the lake's radius (the keel's
    // clearance alone reads the route: none within nine metres of the boat's line)
    for (let i = 0, tries = 0; i < 6 && tries < 600; tries++) {
      const a = dl.range(0, TAU), rr = R0 * Math.sqrt(dl()) * 0.8, cl = dl.range(4, 5), dep = dl.range(9, 15), ph = dl(), per = dl.range(30, 44), seed = dl(), yaw = dl.range(0, TAU);
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      if (rhoOf(x, z) > 0.78 || pathD(x, z) < 9 || inLane(x, z, 6) || spots.some((s) => Math.hypot(s[0] - x, s[1] - z) < 10)) continue;
      i++;
      const pl = place(x, z);
      const rec = { ...pl, w: 0, len: cl, ph, per, y: -0.3 - dep / 1.6, amp: dep / 1.6, swim: 0.03, seed, yaw, yawW: 0.3, tint: [1.42, 1.44, 1.5], calf: 1 };
      (isNear(rec) ? fulls : mids).push(rec); spoutList.push({ whale: rec, n: 5, ph: 0.2, size: 0.17 * cl });
    }
    await ctx.yield();
    // THE NOSING CALVES, A HABIT ON THE WORLD CLOCK (nothing of it answers the boat or the eye). Beside the route
    // through the calm hang NOSE_N cows, each with a calf at her flank that LEAVES HER, NOSES ABOUT THE CALM AND
    // GOES BACK, over and over, on a round of its own (30 to 40 s, its phase drawn): it rests at her flank for a
    // fifth of the round, swims off the way she heads, goes round an oval of water beside her (6.5 to 9 m either
    // way along her heading, 12 to 18 m across, on the route's side of her, or on her other side if it cannot be
    // laid there) and comes back to her flank from astern; over the far half of the oval it is up at the surface, where it all but stops, rolls an eye up and
    // breathes three times. The first cow hangs where a cow has always hung here (mum0: the tiers leave her and
    // her calf their water); the others are dealt from a stream of their own, 18 to 34 m from the route's line at
    // a drawn place of it between the rim and the lane's mouth, 7 to 9.5 m down, heading round the lake, by the
    // tiers' own rules of room (every number is drawn before any test; a place that fails is passed over; they are
    // drawn with the upper tier, in its make). EVERY OVAL STANDS WHERE IT IS: no point of it comes within WAY.WAY
    // metres, half the calf's length and 0.3 m of the route's line in plan (so nothing of a calf is ever in her
    // hull's way or near our line, at any phase, at any clock), within reach of a whale that hangs or lies in the
    // lake, of the named pair, the newborn's circle, the great bull's berth, the lane or another oval; an oval
    // that cannot be laid so is drawn in (by 0.85, four times at most on either side of her); a dealt cow's place
    // is then passed over, and the first cow's calf then keeps its mother's flank.
    let dNb = dRim;
    for (let d = dRim; d < dHero; d += 1) { path.posAtDist(d, _p); if (rhoOf(_p.x, _p.z) <= 0.8) { dNb = d; break; } }
    const nbAt = (() => { onRoute(dNb, sideSign * BL, 0, _q); return { x: _q.x, z: _q.z }; })();
    const NOSE_N = 4, NOSE_REST = 0.2, NOSE = [], mumYaw = Math.atan2(mumKeel.x - mum0.x, mumKeel.z - mum0.z);
    const nosePoint = (c, phi, o) => {
      const h = 0.5 * (1 - Math.cos(phi)), k = smoothstep(0.12, 0.7, h), s = Math.sin(phi);
      o.x = c.fx + c.mx * c.A * s + c.nx * c.R * h; o.z = c.fz + c.mz * c.A * s + c.nz * c.R * h; o.y = lerp(c.fy, -0.14, k); o.h = h;
      return o;
    };
    {
      // every whale that keeps a place in the lake: where, how long, and between which heights its middle moves
      const lakeAll = [];
      for (const q of [mids, fulls, upCows, upCalves, upFar, deeps, deepsLow]) for (const w of q) {
        if ((w.w || 0) !== 0 || w.r > R0 * 1.05) continue;
        const p = polar(w.th, w.r), a = Math.abs(w.amp || 0), be = tangentAngle(w.th) + (w.yaw || 0); lakeAll.push([p[0], p[1], w.len, (w.y ?? -0.9) - (0.6 + 2.6 * (w.fluke || 0)) * a, (w.y ?? -0.9) + 1.4 * a, Math.cos(be), Math.sin(be)]);
      }
      const _n = { x: 0, y: 0, z: 0, h: 0 }, laid = [];
      const clear = (c, own, lakeW) => {
        const pts = [];
        for (let i = 0; i < 48; i++) {
          nosePoint(c, TAU * i / 48, _n); const x = _n.x, y = _n.y, z = _n.z;
          if (pathD(x, z) < WAY.WAY + 0.5 * c.len + 0.3 || rhoOf(x, z) > 0.84 || inLane(x, z, 4) || Math.hypot(x - heart[0], z - heart[1]) < 17 || Math.hypot(x - nbAt.x, z - nbAt.z) < 10) return null;
          if (Math.hypot(x - GB.outX, z - GB.outZ) < 1.2 * GB.len || Math.hypot(x - GB.fallX, z - GB.fallZ) < 1.2 * GB.len) return null;
          if (!own && Math.hypot(x - mum0.x, z - mum0.z) < 10) return null;
          // (a whale that hangs or lies there is a rod along its heading: the calf's middle keeps a tenth of that
          // whale's length, half its own and a metre and a half from it, unless it passes 2.5 m over or under)
          for (const w of lakeW) { if (w === c.cow || y < w[3] - 2.5 || y > w[4] + 2.5) continue; const al = clamp((x - w[0]) * w[5] + (z - w[1]) * w[6], -0.5 * w[2], 0.5 * w[2]); if (Math.hypot(x - w[0] - w[5] * al, z - w[1] - w[6] * al) < 0.1 * w[2] + 0.5 * c.len + 1.5) return null; }
          for (const q of laid) for (const p of q) if (Math.hypot(x - p[0], z - p[1]) < 6) return null;
          pts.push([x, z]);
        }
        return pts;
      };
      // (the whales near enough to matter to an oval about (x, z))
      const about = (x, z) => lakeAll.filter((w) => Math.hypot(w[0] - x, w[1] - z) < 50);
      const fit = (c, own, times, lakeW) => {
        for (let n = 0; n <= times; n++) { const pts = clear(c, own, lakeW); if (pts) { laid.push(pts); return true; } c.A *= 0.85; c.R *= 0.85; }
        return false;
      };
      const toRoute = (c) => { const sg = pathD(c.fx + 4 * c.mz, c.fz - 4 * c.mx) < pathD(c.fx - 4 * c.mz, c.fz + 4 * c.mx) ? 1 : -1; c.nx = sg * c.mz; c.nz = -sg * c.mx; c.side = sg; return c; };
      // the first: the cow at mum0 (an actor: she is drawn in the finest make) and her calf
      { const A = rNose.range(6.5, 9), R = rNose.range(12, 18), per = rNose.range(30, 40), ph = rNose(), wob = rNose.range(0, TAU);
        const c = toRoute({ fx: calf0.x, fz: calf0.z, fy: calf0.y, mx: Math.sin(mumYaw), mz: Math.cos(mumYaw), A, R, per, ph, wob, len: 4.3, cow: null }), near = about(c.fx, c.fz);
        if (!fit(c, true, 4, near)) {
          // (her other side: the calf's place at her flank is mirrored in her own line)
          const dn = (c.fx - mum0.x) * c.nx + (c.fz - mum0.z) * c.nz, fx0 = c.fx, fz0 = c.fz;
          c.A = A; c.R = R; c.fx -= 2 * dn * c.nx; c.fz -= 2 * dn * c.nz; c.nx = -c.nx; c.nz = -c.nz; c.side = -c.side;
          if (!fit(c, true, 4, near)) { c.A = 0; c.R = 0; c.fx = fx0; c.fz = fz0; }
        }
        NOSE.push(c); }
      await ctx.yield();
      for (let tries = 0, work = 0; NOSE.length < NOSE_N && tries < 1200; tries++) {
        if ((tries & 63) === 63 || work >= 4) { work = 0; await ctx.yield(); }
        const s = rNose.range(dRim + 15, Math.max(dRim + 16, dLane - 10)), sd = rNose.sign(), lat = rNose.range(18, 34), depth = rNose.range(7, 9.5), bOff = rNose.range(-0.4, 0.4), flip = rNose.chance(0.25);
        const len = rNose.range(10.6, 12.8), cper = rNose.range(13, 24), cph = rNose(), amp = rNose.range(0.15, 0.4), seed = rNose(), pitch = rNose.range(-0.06, 0.08), rollO = rNose.range(-0.2, 0.2), tint = tintOf(rNose);
        const A = rNose.range(6.5, 9), R = rNose.range(12, 18), per = rNose.range(30, 40), ph = rNose(), wob = rNose.range(0, TAU), cl = rNose.range(4, 4.8);
        onRoute(s, sd * lat, 0, _q); const x = _q.x, z = _q.z, pl = place(x, z);
        if (rhoOf(x, z) > 0.8 || inLane(x, z, 8) || pathD(x, z) < 15 || Math.hypot(x - heart[0], z - heart[1]) < 17 || Math.hypot(x - mum0.x, z - mum0.z) < 26 || Math.hypot(x - nbAt.x, z - nbAt.z) < 14) continue;
        if (NOSE.some((c) => Math.hypot(c.fx - x, c.fz - z) < 26)) continue;
        if (taken.some((q) => Math.abs(q[0] - pl.r) < 13 && Math.abs(q[2] - depth) < 6 && Math.abs(((q[1] - pl.th + Math.PI * 3) % TAU) - Math.PI) * pl.r < 16)) continue;
        const beta = tangentAngle(pl.th) + (dirSign > 0 ? 0 : Math.PI) + (flip ? Math.PI : 0) + bOff, mx = Math.cos(beta), mz = Math.sin(beta);
        const cow = [x, z, len, -depth - 0.6 * amp, -depth + 1.4 * amp, mx, mz];
        const c = toRoute({ fx: x, fz: z, fy: -depth + 0.5, mx, mz, A, R, per, ph, wob, len: cl, cow });
        c.fx = x + c.nx * (0.1 * len + 1.4) - mx * 0.1 * len; c.fz = z + c.nz * (0.1 * len + 1.4) - mz * 0.1 * len;
        // (a place where the oval cannot be laid on either side of her, drawn in four times at the most, is passed over)
        work++;
        { const near = about(x, z); if (!fit(c, false, 4, near)) { c.A = A; c.R = R; c.nx = -c.nx; c.nz = -c.nz; c.side = -c.side; c.fx = x + c.nx * (0.1 * len + 1.4) - mx * 0.1 * len; c.fz = z + c.nz * (0.1 * len + 1.4) - mz * 0.1 * len; if (!fit(c, false, 4, near)) continue; } }
        taken.push([pl.r, pl.th, depth]); lakeAll.push(cow);
        upCows.push({ ...pl, w: 0, len, ph: cph, per: cper, y: -depth, amp, swim: 0.01, seed, yaw: yawFor(pl.th, beta), pitch, rollO, arch: 0.3 * (seed - 0.35), tint });
        NOSE.push(c);
      }
    }
    await ctx.yield();
    // THE LANE OF DEEP WATER FOR A WHALE THAT KEEPS A PLACE (laneHung; the law of the part's WAY block, worked once:
    // its place never changes, so neither does the lane's depth on it: one number, written here). The host, the
    // lake's cows and the lane's bulls were dealt half a length and 6.2 m off the route's line; one that comes to
    // the surface and one that hangs under it (the lake's tiers, dealt two and a half metres under a keel and
    // more) alike, EVERY WHALE THAT KEEPS A PLACE whose body reaches
    // within WAY.WAY metres of the line (the body's own distance as the WAY block counts it: five points of its
    // axis, less its half breadth; at the two ends of its heading's wander and its middle; a quarter of a metre is
    // given over) hangs under the lane as it lies, its highest part WAY.DEPTH metres under the
    // water or more at the top of its bob however it is pitched or rolled (0.18 of its length: a fluke's tip of
    // one lying on its side), at every clock; one that already hangs that deep stands as dealt. No number is drawn
    // here and no list changes.
    const laneHung = [];
    for (const rec of mids.concat(fulls, fars, upCows, upCalves, upFar, deeps, deepsLow)) {
      if (rec.w) continue;
      const len = rec.len, amp = rec.amp ?? 0, tip = 0.5 * len * Math.abs(Math.sin(rec.pitch || 0));
      if ((rec.y ?? -0.9) + 1.4 * amp + tip + 0.18 * len <= -WAY.DEPTH) continue;
      const q = xzOf(rec), nr = path.nearestXZ(q[0], q[1]);
      if (nr.dist >= 0.59 * len + WAY.WAY) continue;
      const a0 = tangentAngle(rec.th) + (rec.yaw || 0), yw = rec.yawW || 0; let d = nr.dist;
      for (let k = -1; k <= 1; k++) { const fx = Math.cos(a0 + yw * k), fz = Math.sin(a0 + yw * k); for (let j = -2; j <= 2; j++) if (j) d = Math.min(d, pathD(q[0] + fx * len * j / 4, q[1] + fz * len * j / 4)); }
      if (d - 0.09 * len >= WAY.WAY + 0.25) continue;
      laneHung.push({ r: rec.r, th: rec.th, len, y: rec.y ?? -0.9, la: nr.dist }); rec.y = -(WAY.DEPTH + 1.4 * amp + tip + 0.18 * len);
    }
    // (THE MAKE IS BY DISTANCE IN SPACE: a whale that keeps its place within three of its own lengths of our line is
    // in the full make (the lists 'fulls'); every one beyond is in the plain make, here. The whales of the ranks swim
    // the whole round: each is drawn in the full make while it is within that distance and in the plain one beyond,
    // by bandTab, at the same place, pose and size)
    const herdMid = kit.herd(mids, 'plain'), herdDeep = kit.herd(deeps.concat(upFar), 'plain'), herdDeepLow = kit.herd(deepsLow, 'plain'), herdBull = kit.herd(bulls, 'plain', true); scene.add(herdMid.object, herdDeep.object, herdDeepLow.object, herdBull.object);
    await ctx.yield();
    const herdFar = kit.herd(fars, 'far'), herdUp = kit.herd(upCows.concat(fulls), 'full'), herdRank = kit.herd(rankers, 'plain', true); scene.add(herdFar.object, herdUp.object, herdRank.object);
    await ctx.yield();
    const herdUpCalf = kit.herd(upCalves, 'calf'); scene.add(herdUpCalf.object);
    await ctx.yield();
    // THE RANKS' MAKE. bandTab[k][i]: the metres from the place of rank k at bearing i / NT of its round to the route's
    // line. A whale of a rank is in the full make while that is under three of its lengths (read each frame from
    // where the world clock has carried it: a rule of the place it is in), in the plain make beyond; the full make
    // is drawn from a pool (kit.pool) that holds as many as can be that near at once: rank by rank the fullest
    // moment of its round (a step every half degree), summed.
    const NT = 720, bandTab = [];
    for (let k = 0; k < KO; k++) {
      const t = new Float32Array(NT), r = ringR(k);
      for (let i = 0; i < NT; i++) { const th = i / NT * TAU, sh = lakeShape(th); t[i] = lineD(Math.cos(th) * r * sh, 0, Math.sin(th) * r * sh); }
      bandTab.push(t);
      if (k % 3 === 2) await ctx.yield();
    }
    const bandOf = (q, time) => bandTab[q.k][Math.floor((((q.th + q.w * time) / TAU) % 1 + 1) % 1 * NT) % NT];
    let poolN = 0;
    for (let k = 0; k < KO; k++) {
      const list = (k >= NC ? bulls : rankers).filter((q) => q.k === k), t = bandTab[k]; let most = 0;
      // (each whale's place in the table and its own three lengths are worked once; the count is the same)
      const base = list.map((q) => Math.floor(((q.th / TAU) % 1 + 1) % 1 * NT) % NT), lim = list.map((q) => 3 * q.len), nq = list.length;
      for (let s = 0; s < NT; s++) { let c = 0; for (let n = 0; n < nq; n++) { let i = base[n] + s; if (i >= NT) i -= NT; if (t[i] < lim[n]) c++; } if (c > most) most = c; }
      poolN += most;
      if (k % 3 === 2) await ctx.yield();
    }
    const fullPool = kit.pool(poolN, 'full'); scene.add(fullPool.object);
    await ctx.yield();
    const spoutsAll = kit.spouts(spoutList), plumesAll = kit.spouts(plumeList, true); scene.add(spoutsAll.object, plumesAll.object);
    await ctx.yield();
    const washAll = kit.wash(washList), washRank = kit.wash(washLite, true); scene.add(washAll.object, washRank.object);
    // every whale that lies at the surface has its shade in the water under it (see kit.shade)
    const shades = kit.shade(washList.concat(washLite)); scene.add(shades.object);
    // THE LANE OF DEEP WATER (see the part's WAY block) is handed THE ROUTE'S LINE and nothing else: its x, z every
    // two metres, the whole route, first metre to the gate.
    const wayN = Math.ceil(L / 2) + 1, wayLine = new Float32Array(wayN * 2);
    for (let i = 0; i < wayN; i++) { path.posAtDist(Math.min(i * 2, L), _p); wayLine[i * 2] = _p.x; wayLine[i * 2 + 1] = _p.z; }
    const rounders = bulls.concat(rankers), deepLane = makeWay({ whales: rounders, cx: 0, cz: 0, shape, line: wayLine, step: 2 });
    await ctx.yield();

    // ------------------------------------------------------------ whales set each frame, every one by a rule of the world clock
    const NB = 12;
    const laneLeap = kit.actors(3, 'full', true), great = kit.actors(1, 'hi', true), sounder = kit.actors(1, 'full', true);
    const cows = kit.actors(2, 'hi'), leapers = kit.actors(NB, 'mid'), calves = kit.actors(1 + NOSE_N, 'calf'), newborn = kit.actors(1, 'newborn');
    // (slots of the hand-fired spray: 3 to each nosing calf for its breaths, two to a herd breach, two to a lane
    // leap, two for the sounding bull's blows; the great breach has white water of its own: eleven bursts of
    // forty-eight drops)
    const PF_BREACH = 3 * NOSE_N, PF_LL = PF_BREACH + NB * 2, PF_SND = PF_LL + 6, puffs = kit.puffs(PF_SND + 2, 16), greatSpray = kit.puffs(11, 48);
    scene.add(laneLeap.object, laneLeap.wash, great.object, great.wash, sounder.object, sounder.wash, greatSpray.object);
    scene.add(cows.object, leapers.object, calves.object, newborn.object, puffs.object);
    await ctx.yield();
    const actor = (len, tint, calf) => ({ x: 0, y: -500, z: 0, yaw: 0, pitch: 0, roll: 0, len, tail: 0, fluke: 0, swim: 0.03, speed: 0, tint, calf: calf || 0, hx: 0, hz: 1 });
    const _o2 = actor(12, [1, 1, 1]), _oc = actor(4.3, [1, 1, 1]);
    // a blow from whale o's blowhole, age seconds old (the puff's whole course is a rule of its age); y0 = the hole's height
    const blowAt = (slot, o, len, size, age, time, y0) => {
      if (age >= 0 && age < 9) {
        const x = o.x + o.hx * 0.46 * len, z = o.z + o.hz * 0.46 * len;
        puffs.fire(slot, x, y0 + swellAt(x, z, time - age), z, o.hx * 0.6 + o.hz * 0.37, 0.71, o.hz * 0.6 - o.hx * 0.37, size, time - age, 0);
      } else puffs.fire(slot, 0, -50, 0, 0, 1, 0, 1, -1e4, 0);
    };

    // THE SOUNDING BULL, A HABIT ON THE WORLD CLOCK (nothing of it answers the boat or the eye): a great bull that
    // keeps a beat of his own in the middle of the bulls' water, beyond the end of the stretch where our way runs
    // along it, heading the way that stretch runs. Over and over, on a round of SND.per seconds (its phase drawn):
    // he COMES UP head first from where the open water hides him (SND_UP seconds), blows as he breaks the surface,
    // swims awash rolling his back and blows again (SND_AW seconds), arches, tips and throws his flukes (SND_TIP),
    // goes down head first until the water hides him again (SND_DOWN) and is put away there for the rest of the
    // round (3 to 6 s, drawn), while he is taken back to where his beat begins. He makes SND_V metres a second
    // while he is seen. HIS BEAT STANDS WHERE IT IS: it begins at the first place along the middle of the bulls'
    // water, beyond the stretch's end, from which the whole of it keeps a length and a half of his own (and two
    // metres) from the route's line and half his length from land and from the lane; so no phase of his round
    // brings him nearer our line than that, at any clock. If the bulls' water has no such place he is left out.
    const SND = { len: rSnd.range(17.5, 19.5), seed: rSnd.range(1, 50), h: rSnd() };
    const SND_UP = 6, SND_AW = 9, SND_TIP = 4, SND_DOWN = 6, SND_V = 1.5, SND_SEEN = SND_UP + SND_AW + 0.72 * SND_TIP + SND_DOWN;
    SND.per = SND_SEEN + rSndR.range(3, 6); SND.ph = rSndR(); SND.off = -1;
    const sndPlace = (m) => polar(thB + gapSense * m / (rGap * lakeShape(thB)), rGap);
    for (let off = 0; off < 400 && SND.off < 0; off += 2) {
      let ok = true;
      for (let m = 0; m <= SND_V * SND_SEEN + 0.01 && ok; m += 3) { const q = sndPlace(off + m); ok = pathD(q[0], q[1]) >= 1.5 * SND.len + 2 && !landNear(q[0], q[1], 0.5 * SND.len) && !inLane(q[0], q[1], 0.5 * SND.len); }
      if (ok) SND.off = off;
    }
    // (s: the seconds of his round)
    const sndAt = (s, o) => {
      const a = s - SND_UP, up = smoothstep(0, SND_UP, s), dn = clamp((a - SND_AW) / SND_TIP, 0, 1), k = dn * dn * (3 - 2 * dn), tip = Math.sin(Math.PI * dn) * (dn < 0.5 ? 1 : 0.75);
      const dw = smoothstep(0, SND_DOWN, a - SND_AW - 0.72 * SND_TIP), roll = TAU * (Math.max(a, 0) / 4.2 + SND.h), aw = up * (1 - dn);
      const th = thB + gapSense * (SND.off + SND_V * Math.min(s, SND_SEEN)) / (rGap * lakeShape(thB)), p = polar(th, rGap), t = tanAt(th);
      o.x = p[0]; o.z = p[1]; o.hx = t[0]; o.hz = t[1]; o.yaw = Math.atan2(t[0], t[1]); o.len = SND.len;
      o.y = 1.5 + 0.35 * Math.sin(roll) * aw - 0.092 * SND.len - 0.3 * SND.len * k - (HIDE_OUT + 4 - 0.3 * SND.len) * dw - (HIDE_OUT + 4) * (1 - up) - (s >= SND_SEEN || SND.off < 0 ? 400 : 0);
      o.pitch = 0.05 * Math.cos(roll) * aw + 0.5 * Math.sin(Math.PI * up) * (up < 1 ? 1 : 0) - 0.9 * tip - 0.5 * Math.sin(Math.PI * dw); o.arch = 0.1 + 0.6 * tip; o.fluke = smoothstep(0.04, 0.4, dn) * (1 - smoothstep(0.7, 0.98, dn));
      o.roll = 0.04 * Math.sin(roll * 0.4 + SND.seed);
      return o;
    };
    // (his two blows, at these seconds of his round)
    const SND_BLOW = [SND_UP + 0.3, SND_UP + 5];
    const sndO = actor(SND.len, [0.92, 0.95, 1]); sndO.hide = HIDE_OUT;
    await ctx.yield();
    // ------------------------------------------------------------ the named pair, the newborn, the nosing calves, breachers
    const tph = [0, 1, 2, 3].map(() => rTail.range(0, TAU));
    // THE NAMED COW hangs rolled half over toward the route's side (so she hangs, always), her pale
    // jaw and belly up on that side; her calf noses up at her belly two thirds of the way back.
    const hc = actor(12.4, [1.04, 1.02, 1]);
    const hcalf = (() => {
      const fx = Math.cos(heroAt.beta), fz = Math.sin(heroAt.beta), bx = heroAt.bx - heroAt.x, bz = heroAt.bz - heroAt.z;
      // side = up x fwd; the belly of a whale rolled by r points down and to side*sin(r)
      const sx = fz, sz = -fx, toUs = sx * bx + sz * bz > 0 ? 1 : -1, roll = toUs * 1.12;
      hc.x = heroAt.x; hc.z = heroAt.z; hc.y = -heroAt.depth; hc.yaw = Math.atan2(fx, fz); hc.pitch = 0.1; hc.roll = roll; hc.swim = 0.012; hc.arch = -0.06;
      const bel = [sx * Math.sin(roll), -Math.cos(roll), sz * Math.sin(roll)];
      const cl = 4.6, o = actor(cl, [1.5, 1.5, 1.55], 1), tch = [heroAt.x - fx * 0.13 * hc.len + bel[0] * 0.105 * hc.len, -heroAt.depth + bel[1] * 0.105 * hc.len, heroAt.z - fz * 0.13 * hc.len + bel[2] * 0.105 * hc.len];
      // the calf lies from further out along the belly's side, nose to her
      const dir = [-bel[0] * 0.75 + fx * 0.6, -bel[1] * 0.75, -bel[2] * 0.75 + fz * 0.6], dl2 = Math.hypot(dir[0], dir[1], dir[2]);
      dir[0] /= dl2; dir[1] /= dl2; dir[2] /= dl2;
      o.x = tch[0] - dir[0] * 0.52 * cl; o.y = tch[1] - dir[1] * 0.52 * cl; o.z = tch[2] - dir[2] * 0.52 * cl;
      o.yaw = Math.atan2(dir[0], dir[2]); o.pitch = Math.asin(clamp(dir[1], -1, 1)); o.swim = 0.02;
      o.roll = ((heroAt.bx - o.x) * Math.cos(o.yaw) - (heroAt.bz - o.z) * Math.sin(o.yaw) > 0 ? 1 : -1) * 0.7;
      return o;
    })();
    const bobPh = rHero.range(0, TAU);
    // the newborn (a beat of the design's journey, so it lies by the route): it turns its small circle a boat's length
    // off our way where the route is 0.8 of the lake's radius from its centre (dNb), on the heart's side, four metres
    // down: pale and smooth, its cord trailing
    const nb = actor(3.7, [1.75, 1.72, 1.72], 1), nbPh = rNb.range(0, TAU), nbBob = rNb.range(0, TAU);
    nb.pitch = 0.1; nb.swim = 0.05;
    // the nosing calves (see THE NOSING CALVES): the cow at mum0, and where a calf is and how it lies at g of its
    // round (0..1: at her flank until NOSE_REST, then once round its oval, slow where it leaves and comes back to
    // her, all but still at the far end)
    const mum = actor(12.6, [0.98, 1, 1.02]), calfPh = rCalf.range(0, TAU);
    mum.x = mum0.x; mum.z = mum0.z; mum.yaw = mumYaw; mum.swim = 0.01;
    const _n0 = { x: 0, y: 0, z: 0, h: 0 };
    const noseAt = (c, g, o) => {
      const ga = clamp((g - NOSE_REST) / (1 - NOSE_REST), 0, 1), phi = TAU * ga - 0.5 * Math.sin(2 * TAU * ga), cs = Math.cos(phi), sn = Math.sin(phi);
      nosePoint(c, phi, _n0); o.x = _n0.x; o.y = _n0.y; o.z = _n0.z;
      // it heads the way its oval runs (at her flank: as she does) and slants as it climbs and goes down
      const vx = c.mx * c.A * cs + c.nx * c.R * 0.5 * sn, vz = c.mz * c.A * cs + c.nz * c.R * 0.5 * sn, vl = Math.hypot(vx, vz);
      const t = clamp((_n0.h - 0.12) / 0.58, 0, 1), dy = (-0.14 - c.fy) * 6 * t * (1 - t) / 0.58 * 0.5 * sn, look = smoothstep(0.8, 0.97, _n0.h);
      o.yaw = vl > 1e-6 ? Math.atan2(vx, vz) : Math.atan2(c.mx, c.mz); o.pitch = vl > 1e-6 ? clamp(Math.atan2(dy, vl), -0.5, 0.5) : 0;
      o.roll = c.side * 0.5 * look; o.arch = 0; o.hx = Math.sin(o.yaw); o.hz = Math.cos(o.yaw);
      return o;
    };
    // each calf's three breaths, at these parts of its round, where it then is
    for (const c of NOSE) {
      c.o = actor(c.len, [1.5, 1.5, 1.56], 1); c.blows = [];
      if (c.A > 0) for (const ga of [0.4, 0.5, 0.6]) { const g = NOSE_REST + (1 - NOSE_REST) * ga; noseAt(c, g, _oc); c.blows.push({ g, x: _oc.x + _oc.hx * 0.46 * c.len, z: _oc.z + _oc.hz * 0.46 * c.len, vx: _oc.hx * 0.5 + _oc.hz * 0.3, vz: _oc.hz * 0.5 - _oc.hx * 0.3 }); }
    }
    const leapAt = (b, tau, time, o) => {
      o.hide = b.hide;
      if (tau < b.t0 || tau > b.tEnd) { o.y = -500; return o; }
      const sunk = Math.max(0, tau - b.tFall), tb = Math.min(tau, b.tFall);
      o.x = b.x + b.fx * tb * b.run; o.z = b.z + b.fz * tb * b.run; o.y = b.y0 + b.v * tb - 3 * Math.max(0, tb) * tb - SINK * sunk; o.len = b.len;
      const tTop = b.v / 6, dn = smoothstep(0, 2.5, sunk);
      o.yaw = Math.atan2(b.fx, b.fz); o.pitch = lerp(0.95, 0.1, smoothstep(tTop - 0.3, b.tFall, tau)) - 0.5 * dn; o.roll = 1.4 * smoothstep(tTop - 0.6, b.tFall - 0.3, tau) * (1 - dn);
      o.arch = -0.25 * Math.sin(Math.PI * clamp((tau - b.tOut) / Math.max(0.1, b.tFall - b.tOut), 0, 1)); o.tail = time * 2 + b.tph; o.speed = 6;
      return o;
    };
    // THE LEAPS RUN ON THE WORLD CLOCK IN ONE LONG ROUND, DECLARED: LEAP_ROUND seconds, over and over. NO PLACE
    // BEGINS THEM: they go on while the world is seen through a gate and at their true speed however fast we fly.
    // The herd's breaches, the lane's leaps and the great bull's are all dealt across THE WHOLE of that round, and
    // a leap that starts up near the round's end plays on into the next (a leap's seconds are read modulo the
    // round's length): no stretch of the round is without them and the round has no seam.
    // THE ROUND IS CUT INTO EQUAL TURNS and the whales that play the leaps take the turns in order, over and over:
    // six turns for each of the herd's twelve (72 turns of 0.89 s), five for each of the lane's three (15 turns of
    // 4.27 s). A leap starts at a second drawn within the first part of its turn (three tenths of it for the herd,
    // two tenths for the lane), so a whale's next leap starts up 10.3 s or more after its last (the lane: 11.9 s),
    // and the longest leap takes 9.7 s from where the water hides it as it starts up to where it hides it again
    // (the lane: 9.8 s): NO WHALE IS ASKED FOR TWO LEAPS AT ONCE, across the round's end either, by arithmetic.
    const LEAP_ROUND = 64, BREACH_TURNS = 6, LANE_TURNS = 5;
    // BREACHES OF THE HERD are dealt to whales of the ranks, everywhere, one every 0.6 to 1.2 s somewhere in the
    // herd (a turn each), each at a radius drawn between the ranks'
    // second and the outermost and at a bearing drawn evenly from THE ALLOWED ARCS OF ITS OWN RADIUS: the round
    // (240 steps) less the lane and LANE_W + 30 m either side of it, less water within 30 m of land, and less every
    // bearing where THE WHALE ITSELF would come within BREACH_OFF (34) metres of the route's line: the place where
    // it starts up and the place where it falls are each kept BREACH_OFF metres from the line and, more, 0.59 of
    // its length (half its length and its half breadth) and half the run between the two (it runs 2.2 m/s through
    // its leap), so no part of the body at any second of the leap is within 34 m of the line. The bearing it is put
    // at within its step is tested the same way (one that fails takes the step's middle). A leap with no allowed
    // arc is not played and not redrawn. Those nearest our line are seen by chance. Each leaps the way its rank
    // goes round. None leaps inside the second rank, where the water is clear.
    const BREACH = [], breachO = [], breachBy = [], BREACH_OFF = 34;
    for (let i = 0; i < NB; i++) { breachO.push(actor(12, [0.95, 0.97, 1])); breachBy.push([]); }
    const angNear = (a, b) => (((a - b) % TAU + TAU + Math.PI) % TAU) - Math.PI;
    const NA = 240;
    await ctx.yield();
    for (let n = 0; n < NB * BREACH_TURNS; n++) {
      const T = (n + br.range(0, 0.3)) * LEAP_ROUND / (NB * BREACH_TURNS), k = br.range(1.2, KO - 1), r = ringR(k), kr = clamp(Math.round(k), 0, KO - 1);
      const pick = br.range(0, 1), jit = br.range(0, 1), len = kr >= NC ? br.range(15, 18.5) : br.range(10.5, 14), tph = br.range(0, TAU);
      const b = leapSet({ T, x: 0, z: 0, fx: 0, fz: 0, len, tph, top: 0.15 * len, run: 2.2, hide: HIDE_OUT });
      b.act = n % NB;
      const turn = rankSense(kr) > 0 ? 0 : Math.PI, offLane = (LANE_W + 30) / r, runA = b.run * b.t0, runB = b.run * b.tFall, need = BREACH_OFF + 0.59 * len + 0.5 * (runB - runA);
      const okAt = (th) => {
        if (Math.abs(angNear(th, thLane)) < offLane) return false;
        const sh = lakeShape(th), x = Math.cos(th) * r * sh, z = Math.sin(th) * r * sh;
        if (landNear(x, z, 30)) return false;
        const d = pathD(x, z);
        if (d >= need + runB) return true;
        if (d < need - runB) return false;
        const beta = tangentAngle(th) + turn, fx = Math.cos(beta), fz = Math.sin(beta);
        return pathD(x + fx * runA, z + fz * runA) >= need && pathD(x + fx * runB, z + fz * runB) >= need;
      };
      const list = [];
      for (let i = 0; i < NA; i++) if (okAt((i + 0.5) / NA * TAU)) list.push(i);
      if (n % 12 === 11) await ctx.yield();
      if (!list.length) continue;
      const step = list[Math.min(list.length - 1, Math.floor(pick * list.length))];
      let th = (step + jit) / NA * TAU; if (!okAt(th)) th = (step + 0.5) / NA * TAU;
      const sh = lakeShape(th), beta = tangentAngle(th) + turn;
      b.x = Math.cos(th) * r * sh; b.z = Math.sin(th) * r * sh; b.fx = Math.cos(beta); b.fz = Math.sin(beta);
      BREACH.push(b); breachBy[b.act].push(b);
    }
    // THE LANE'S LEAPS are dealt as the herd's are: turns of the same round, across the whole of it, and places
    // from a stream of their own, one every 3.4 to 5.1 seconds, each at a place drawn evenly along the lane from
    // its second rank
    // out to twenty metres short of the gate, on a drawn side, 12 to 20 m beyond the outer edge of the bulls' ranks
    // (LANE_W from the lane's middle line; one drawn within 12 m of land is left out). It leaps AWAY from the lane,
    // 57 to 77 degrees off the lane's heading: toward open water, never in among the bulls.
    const LEAP = [], leapO = [0, 1, 2].map(() => actor(18, [0.9, 0.93, 0.98])), leapBy = [[], [], []];
    {
      const a0 = ringR(1.5) * lakeShape(thLane), a1 = portalD - 20;
      for (let n = 0; n < 3 * LANE_TURNS; n++) {
        const T = (n + rLeap.range(0, 0.2)) * LEAP_ROUND / (3 * LANE_TURNS);
        const side = rLeap.sign(), lat = LANE_W + rLeap.range(12, 20), al = rLeap.range(a0, Math.max(a0 + 1, a1)), len = rLeap.range(16.5, 19.5), tph = rLeap.range(0, TAU), slant = rLeap.range(1.0, 1.35);
        const x = laneDir[0] * al - laneDir[1] * side * lat, z = laneDir[1] * al + laneDir[0] * side * lat;
        if (landNear(x, z, 12)) continue;
        const fx = laneDir[0] * Math.cos(slant) - laneDir[1] * side * Math.sin(slant), fz = laneDir[1] * Math.cos(slant) + laneDir[0] * side * Math.sin(slant);
        const b = leapSet({ T, x, z, fx, fz, len, tph, top: 0.15 * len, run: 2.8, hide: HIDE_OUT });
        b.act = n % 3; LEAP.push(b); leapBy[b.act].push(b);
      }
    }
    const greatO = actor(GB.len, [0.88, 0.92, 0.98]);
    // THE GREAT BULL'S BREACHES ARE LEAPS OF THE SAME LONG ROUND, on the world clock: as many as the round has room
    // for (each takes GREAT_SPAN seconds, from where the lake hides him as he starts up to where it hides him again
    // and six seconds more for his white water, and four seconds are left between two), evenly through the round,
    // the first beginning at a second drawn from a stream of its own. He breaches in his berth beside the lane
    // over and over, whether anyone is there or not; a leap that runs over the round's end goes on into the next.
    const GREAT_SPAN = GB.tEnd - GB.t0 + 6, GREAT_N = Math.max(1, Math.floor(LEAP_ROUND / (GREAT_SPAN + 4))), GREAT_T = [];
    { const gap = LEAP_ROUND / GREAT_N, t1 = rGreatR.range(0, gap); for (let j = 0; j < GREAT_N; j++) GREAT_T.push(t1 + j * gap - GB.t0); }
    await ctx.yield();

    // ------------------------------------------------------------ BIRDS: a flock of gulls wheeling over the bulls' water on the windward side of the host and one over each
    // headland of the strait (30 m inland of its shore, abreast of a place 30 m short of the gate); and the diving birds
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    await ctx.yield();
    // NO GULL'S ROUND COMES NEAR OUR LINE (a rule of the place; nothing of it reads where the eye is or what the
    // clock says). A gull flies its flock's loop shifted by an offset of its own and wanders about that (the kit's
    // numbers: 7.5 m, 2.5 m and 4 m along x, y, z at the most). One whose round would at any point of it come within
    // GULL_OFF metres of the route's line (2.5 m, 1.2 m of bird, and 1.5 m for the two metres both lines are stepped
    // by), counted from its wander's box, flies its round three metres higher, and three again, eight times at the
    // most; one that still cannot keep off is left out of its flock. THE LINE IS TAKEN WITH ITS ENTRY AXIS: off the
    // axis's 340 m behind the entry a gull's box keeps AX_SIDE metres in space (and the same 1.5 m), by the same
    // raising or leaving out. (gullInfo: gulls raised, gulls left out.)
    const GULL_OFF = 5.2, GULL_AXIS = AX_SIDE + 1.5, gullInfo = [0, 0];
    const gullClear = async (f) => {
      const A = f.geometry.attributes.iA.array, Bq = f.geometry.attributes.iB.array, Tn = f.geometry.attributes.iTint.array, w = f.uniforms.uWander.value, wx = 1.5 * w.x, wy = w.y, wz = w.z;
      const c = f.bounds.center, rr = f.bounds.radius + 30, near = [], nearG = [], loop = [], v = new THREE.Vector3(), free = new Uint8Array(9), G2 = GULL_OFF * GULL_OFF, GA2 = GULL_AXIS * GULL_AXIS;
      for (let d = 0; d <= L; d += 2) { path.posAtDist(d, v); if (v.distanceTo(c) < rr) { near.push(v.x, v.y, v.z); nearG.push(G2); } }
      for (let d = 2; d <= AX_BACK; d += 2) { const b = backAt(d); v.set(b[0], axE[1], b[1]); if (v.distanceTo(c) < rr + AX_SIDE) { near.push(v.x, v.y, v.z); nearG.push(GA2); } }
      if (!near.length) return f;
      for (let s = 0; s < f.route.length; s += 2) { f.route.pointAt(s, v); loop.push(v.x, v.y, v.z); }
      let n = f.count, most = 0;
      for (let i = 0; i < n; i++) {
        // (one pass: wherever its round passes over or under the line within GULL_OFF in plan, the heights it may not fly at;
        // the loop hands back every third gull, so that no step of it is long)
        if (i % 3 === 2) await ctx.yield();
        const ox = A[i * 4], oy = A[i * 4 + 1], oz = Bq[i * 4 + 3]; free.fill(1);
        for (let j = 0; j < loop.length; j += 3) { const x = loop[j] + ox, y = loop[j + 1] + oy, z = loop[j + 2] + oz;
          for (let k = 0; k < near.length; k += 3) { const dx = Math.max(0, Math.abs(x - near[k]) - wx), dz = Math.max(0, Math.abs(z - near[k + 2]) - wz), h2 = dx * dx + dz * dz, g2 = nearG[k / 3]; if (h2 >= g2) continue;
            const band = Math.sqrt(g2 - h2) + wy, dy = y - near[k + 1]; for (let r = 0; r < 9; r++) if (Math.abs(dy + 3 * r) < band) free[r] = 0; } }
        let up = 0; while (up < 9 && !free[up]) up++;
        if (up > 8) {
          // (left out: the last gull of the list takes its place in it)
          n--; for (let k = 0; k < 4; k++) { A[i * 4 + k] = A[n * 4 + k]; Bq[i * 4 + k] = Bq[n * 4 + k]; } for (let k = 0; k < 3; k++) Tn[i * 3 + k] = Tn[n * 3 + k];
          i--; gullInfo[1]++; continue;
        }
        if (up) { A[i * 4 + 1] += 3 * up; gullInfo[0]++; most = Math.max(most, up); }
      }
      f.geometry.instanceCount = n; f.count = n; f.bounds.radius += 3 * most;
      return f;
    };
    // (the flocks are kept by name for the proofs in node)
    const gullFlocks = [], gull = (f) => { gullFlocks.push(f); return f; };
    const gullAt = (th, r, y) => [Math.cos(th) * r * lakeShape(th), y, Math.sin(th) * r * lakeShape(th)];
    { const f = gull(F.makeFlock({ rng: gr[0], species: 'gulls', count: Math.round(24 * dens * detail), size: 1.5, center: gullAt(windA + Math.PI, rGap, 22), radius: 70, height: 14 })); await ctx.yield(); await gullClear(f); fauna.add(f); }
    await ctx.yield();
    const laneAt = (s, lat, y) => [laneDir[0] * s - laneDir[1] * lat, y, laneDir[1] * s + laneDir[0] * lat];
    const heads = isles.filter((q) => q.strait).map((q) => ({ side: Math.sign((q.x * -laneDir[1] + q.z * laneDir[0])) || 1, half: q.half }));
    for (let i = 0; i < heads.length; i++) { const h = heads[i]; if (i) await ctx.yield(); const f = gull(F.makeFlock({ rng: gr[1 + (i % 2)], species: 'gulls', count: Math.round((i ? 14 : 20) * dens * detail), size: 1.5, center: laneAt(portalD - 30, h.side * (h.half + 30), 30), radius: 60, height: 14 })); await ctx.yield(); await gullClear(f); fauna.add(f); }
    await ctx.yield();
    let birdsOff = 1e9, birdsKept = 0, birdsLeft = 0;
    {
      // the diving birds, in companies (see BIRD_VERT): six over the bulls' water, evenly round the host from a drawn
      // bearing, one to either hand of the lane near the gate.
      // EVERY COMPANY KEEPS THE WHOLE OF ITSELF OFF OUR LINE. A company reaches, from its middle, its widest round
      // (ROUND_MAX) and its scatter (SCATTER either way on both axes, so 1.42 of it) and a wing (0.9 m): its middle
      // lies no nearer the route's line IN PLAN than that reach and BIRD_CLEAR (3 m) more, so a bird at any height,
      // its plunge too, passes three metres and more from the line whatever the clock. One dealt nearer is moved
      // straight away from the line's nearest place until it is that far (again, if the line bends back on it; one
      // dealt on the line itself, within half a metre, goes out along the line's own normal there, its tangent
      // turned a quarter). THE LINE IS TAKEN WITH ITS ENTRY AXIS: the table of places begins at the far end of the
      // axis's 340 m behind the entry, and off those places a company keeps its reach and AX_SIDE metres. A
      // COMPANY'S MIDDLE LIES BIRD_REACH METRES OR MORE FROM EVERY SHORE'S LINE BY THE TRUE DISTANCE (landOff: the
      // least over the line's 240 places, not the shore's radius at the company's own bearing), where it is dealt
      // and where it is moved to, so no bird's round passes over land: one that does not, or that cannot be moved
      // far enough, is left out.
      const ROUND_MAX = 22, SCATTER = 10, BIRD_CLEAR = 3, BIRD_REACH = ROUND_MAX + SCATTER * Math.SQRT2 + 0.9, KEEP_OFF = BIRD_REACH + BIRD_CLEAR;
      // (the table: the axis behind the entry from its far end in, then the flown line, a place every two metres;
      // lineOff: what a company's middle keeps off each place, a metre in it for what lies between two places)
      const nBack = Math.floor(AX_BACK / 2), nTab = nBack + Math.floor(L / 2) + 2, lineXZ = new Float32Array(2 * nTab), lineOff = new Float32Array(nTab); let nLine = 0;
      for (let i = nBack; i >= 1; i--) { const b = backAt(i * 2); lineXZ[nLine * 2] = b[0]; lineXZ[nLine * 2 + 1] = b[1]; lineOff[nLine++] = BIRD_REACH + AX_SIDE + 1; }
      for (let d = 0; d < L; d += 2) { path.posAtDist(d, _p); lineXZ[nLine * 2] = _p.x; lineXZ[nLine * 2 + 1] = _p.z; lineOff[nLine++] = KEEP_OFF + 1; }
      path.posAtDist(L, _p); lineXZ[nLine * 2] = _p.x; lineXZ[nLine * 2 + 1] = _p.z; lineOff[nLine++] = KEEP_OFF + 1;
      const keepOff = (c) => {
        if (landOff(c[0], c[2]) < BIRD_REACH) return false;
        for (let n = 0; n < 16; n++) {
          // (the place of the table the company is deepest inside the keeping-off of)
          let best = 1e18, bx = 0, bz = 0, bi = 0, bd = 0;
          for (let i = 0; i < nLine; i++) { const dx = c[0] - lineXZ[i * 2], dz = c[2] - lineXZ[i * 2 + 1], d = Math.hypot(dx, dz), m = d - lineOff[i]; if (m < best) { best = m; bx = dx; bz = dz; bi = i; bd = d; } }
          if (best >= 0) {
            if (landOff(c[0], c[2]) < BIRD_REACH) return false;
            for (let i = nBack; i < nLine; i++) birdsOff = Math.min(birdsOff, Math.hypot(c[0] - lineXZ[i * 2], c[2] - lineXZ[i * 2 + 1]) - BIRD_REACH);
            return true;
          }
          const want = lineOff[bi] + 0.5;
          if (bd > 0.5) { const k = (want - bd) / bd; c[0] += bx * k; c[2] += bz * k; }
          else {
            const i0 = Math.max(0, bi - 1), i1 = Math.min(nLine - 1, bi + 1), tx = lineXZ[i1 * 2] - lineXZ[i0 * 2], tz = lineXZ[i1 * 2 + 1] - lineXZ[i0 * 2 + 1], tl = Math.hypot(tx, tz) || 1;
            const sd = bx * -tz + bz * tx < 0 ? -1 : 1;
            c[0] = lineXZ[bi * 2] - tz / tl * sd * want; c[2] = lineXZ[bi * 2 + 1] + tx / tl * sd * want;
          }
        }
        return false;
      };
      const dealt = [], a0 = rDive.range(0, TAU);
      // (birdsOff: the least water between any company's reach and the line, for the world's own account of itself)
      birdsOff = 1e9;
      for (let i = 0; i < 6; i++) dealt.push(gullAt(a0 + (i + rDive.range(-0.25, 0.25)) * TAU / 6, rGap + rDive.range(-20, 20), 0));
      for (const sd of [1, -1]) dealt.push(laneAt(portalD - rDive.range(60, 90), sd * rDive.range(25, 40), 0));
      // and one off the lakeward shore of every island beyond the strait, on the bearing of the lake's heart from
      // the island: the first place out along that bearing (two metres at a time, from its shore) where the true
      // distance to the shore's line is the company's reach and three metres (KEEP_OFF) or more: no draw
      for (const q of isles) if (!q.strait) {
        const a = Math.atan2(-q.z, -q.x); let rr = shoreOf(q, a) + KEEP_OFF, c = null;
        for (let n = 0; n < 40; n++, rr += 2) { c = [q.x + Math.cos(a) * rr, 0, q.z + Math.sin(a) * rr]; if (landOff(c[0], c[2]) >= KEEP_OFF) break; }
        dealt.push(c);
      }
      const at = dealt.filter(keepOff);
      birdsKept = at.length; birdsLeft = dealt.length - at.length;
      const per = Math.max(6, Math.round(16 * detail)), nb = at.length * per, g = birdGeometry();
      const iP = new Float32Array(nb * 4), iQ = new Float32Array(nb * 4);
      for (let i = 0; i < nb; i++) {
        const c = at[Math.floor(i / per)], booby = rDive.chance(0.4);
        iP[i * 4] = c[0] + rDive.range(-SCATTER, SCATTER); iP[i * 4 + 1] = c[2] + rDive.range(-SCATTER, SCATTER); iP[i * 4 + 2] = rDive.range(8, ROUND_MAX); iP[i * 4 + 3] = rDive.range(7, 16);
        iQ[i * 4] = rDive.range(0, 1); iQ[i * 4 + 1] = rDive.range(9, 15); iQ[i * 4 + 2] = booby ? 1.5 : 0.8; iQ[i * 4 + 3] = rDive.chance(0.5) ? 1 : -1;
      }
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(iQ, 4)); g.instanceCount = nb;
      const divers = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: LU, vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, side: THREE.DoubleSide }));
      divers.frustumCulled = false; scene.add(divers);
    }
    await ctx.yield();
    // ------------------------------------------------------------ the gaze, and the frame-by-frame life
    // THE GAZE follows the places: pulls ONE AT A TIME, each on a target of its own, each with its ends at places of
    // the route (the eye's metres), each coming and going over forty-five metres of flight; where two meet they hand
    // over across one shared stretch (as the one goes the other comes: the two weights cross; a pull whose own
    // stretch is shorter than twice its fade comes and goes over half that stretch, so where pull 0 hands to the
    // short pull 1 the two together stand a little over the larger weight for some metres). Pulls 3 and 4 hand over
    // across HAND metres, a length of the route: what the declared pace makes in 4.4 seconds about pull 3's end
    // (26 to 40 m on seeds 1 to 300; she goes slowly there and forty-five metres would be six seconds).
    //   0 THE BOAT'S WATER: the point of the route's line one boat length before her stem, on the water (the boat is
    //     the flight's subject from over her). It RISES FROM NOTHING over the first forty-five metres (the engine's
    //     eased camera comes in level along the route's first heading, and no pull stands on at the first metre),
    //     holds until pull 1 has come, and stands again from where pull 1 goes until pull 2 has come; weight G0;
    //   1 in the bulls' water: a PLACE, the middle of the sounding bull's beat on the water ahead (beyond the along-
    //     stretch's end; the place stands, whatever he is doing), from five of his lengths short of the along-
    //     stretch's end until twenty-two metres short of it; weight 0.6;
    //   2 on the lake: DOWN, on the named pair where they hang, from the rim until the heart lies abeam;
    //   3 a PLACE of the lane's rank on the great bull's side: midway between where he falls into his berth and the
    //     next bull of that rank beyond it, two metres over the water (the rank lies there at every phase, and the
    //     berth is in the picture whether he is leaping or not), from two boat lengths short
    //     of the lane's mouth (never before pull 2 has ended) until dFallen, A PLACE OF THE ROUTE (the name is
    //     old): where the declared pace has the eye GB.tFall + 2.2 seconds past the mouth, which is where the place
    //     he falls into lies abeam (within 3.6 m of it on seeds 1 to 300; 28 to 35 m past the mouth). Nothing is timed by it: the bull leaps on his round;
    //   4 the gate, from there to the end.
    const _look = new THREE.Vector3(), FADE = 45, sndMid = sndPlace(Math.max(SND.off, 0) + 0.5 * SND_V * SND_SEEN);
    const rankAt = gbNext ? [0.5 * (GB.fallX + gbNext[0]), 0.5 * (GB.fallZ + gbNext[1])] : [GB.fallX, GB.fallZ];
    const poi = (at, a, b, weight, fd) => ({ at, from: a / L, to: b / L, weight, fade: Math.min(0.5, (fd || FADE) / Math.max(1, b - a)) });
    const tFallen = filmT(dLane) + GB.tFall + 2.2, dFallen = metresAt(tFallen), HAND = Math.max(8, metresAt(tFallen + 2.2) - metresAt(tFallen - 2.2)), d3 = Math.max(dHero + 10, dLane - 2 * BL);
    const boatWater = (time, u) => { path.posAtDist(Math.min(L, boatD(u * L) + BL), _look); _look.y = 0.6; return _look; };
    const gA1 = dGapB - 5 * SND.len, gB1 = dGapB - 22, G0 = 0.75;
    const pois = [
      poi(boatWater, 0, gA1 + FADE, G0),
      poi(() => _look.set(sndMid[0], 1.5, sndMid[1]), gA1, gB1, 0.6),
      poi(boatWater, gB1 - FADE, dRim - 10 + FADE, G0),
      poi(() => _look.set(heroAt.x, -heroAt.depth, heroAt.z), dRim - 10, dHero + 10, 0.85),
      poi(() => _look.set(rankAt[0], 2, rankAt[1]), d3, dFallen + 0.5 * HAND, 0.72, HAND),
      poi(() => _look.copy(portalAt), dFallen - 0.5 * HAND, L + FADE + 20, 0.9, HAND),
    ];
    await sky.prewarm(ctx.renderer, null, scene);

    const rockPh = [rBoat.range(0, TAU), rBoat.range(0, TAU), rBoat.range(0, TAU)];
    boat.rotation.order = 'YXZ';
    const _cam = new THREE.Vector3();
    return {
      scene, path, duration: DUR, pace, ride: 'none', companion: 'none',
      camera: { fov: 62, near: 0.25, far: 4400, lookAhead: 34, sway: 1, bank: 0.1, nearThrough: 0.3 },
      pois,
      // (from where the ring shows the next world is left to the engine's own rule: no distance is typed here)
      portal: { shape: 'circle', radius: GATE_R, color: M.portal, glow: 1.5 },
      post: {
        exposure: M.exposure, bloom: { strength: 0.3, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 1.1, contrast: 1.06, tint: '#ffffff', shadowTint: M.shadowTint, vignette: 0.28, grain: 0.02, aberration: 0 },
      },
      // what this visit drew and where its places fell (for replays; nothing reads it)
      // (proof(): the line the lane of deep water is handed and the lists of what moves, for the proofs in node)
      info: { proof: () => {
        const snd = { per: SND.per, ph: SND.ph, len: SND.len, off: SND.off, tab: [] }, nose = [], o = actor(4, [1, 1, 1]);
        for (let s = 0; s < SND.per; s += 0.1) { sndAt(s, o); snd.tab.push(o.x, o.y, o.z, o.yaw); }
        for (const c of NOSE) { const q = { per: c.per, ph: c.ph, len: c.len, A: c.A, R: c.R, tab: [] }; for (let i = 0; i < 400; i++) { noseAt(c, i / 400, o); q.tab.push(o.x, o.y, o.z, o.yaw); } nose.push(q); }
        // (a gull flock: its middle every twentieth of a second over one turn of its loop, each bird's own offset
        // and lag behind the middle, the most it wanders)
        const gulls = gullFlocks.map((f) => { const sp = f.uniforms.uSpeed.value, per = f.route.length / sp, n = Math.ceil(per / 0.05), tab = [], birds = [], v = new THREE.Vector3(), a = f.geometry.attributes.iA.array, b = f.geometry.attributes.iB.array, w = f.uniforms.uWander.value;
          for (let i = 0; i < n; i++) { f.positionAt(i * per / n, undefined, v); tab.push(v.x, v.y, v.z); }
          for (let i = 0; i < f.count; i++) birds.push(a[i * 4], a[i * 4 + 1], b[i * 4 + 3], a[i * 4 + 2]);
          return { per, speed: sp, n, tab, birds, wander: [1.5 * w.x, w.y, w.z] }; });
        const groundY = (q, x, z) => { const dx = x - q.x, dz = z - q.z, t = Math.hypot(dx, dz) / (q.R * islandLump(noise, q.ox, q.oz, Math.atan2(dz, dx))); return t >= 1 ? -6 : islandY(noise, q.R, q.H, q.ox, q.oz, dx, dz, t); };
        return { land: { isles, shoreOf, groundY }, boat, uRow, rockPh, seat: SEAT, line: wayLine, shape, hung: laneHung, bulls: rounders, nBulls: bulls.length, filmT, boatD, breach: BREACH, leap: LEAP, great: GB, greatT: GREAT_T, leapLo: 0, leapRound: LEAP_ROUND, newbornAt: (time, o) => { const na = time * 0.22 * dirSign + nbPh, x = nbAt.x + Math.cos(na) * 3.4, z = nbAt.z + Math.sin(na) * 3.4, hx = -Math.sin(na) * dirSign, hz = Math.cos(na) * dirSign, d = deepLane.dist(x, z, hx, hz, nb.len)[0], y0 = -4 + 0.6 * Math.sin(time * 0.3 + nbBob); o.x = x; o.z = z; o.hx = hx; o.hz = hz; o.d = d; o.own = y0; o.y = y0 - deepLane.at(d) * Math.max(0, y0 + 0.18 * nb.len + WAY.DEPTH); return o; }, sink: SINK, snd, nose, gulls, mum: [mum0.x, -9, mum0.z, mumYaw, 12.6], nb: [nbAt.x, nbAt.z, 3.4, -4, 0.6, 3.7] };
      }, hour, sunBehind, sunAz: Math.round(sunAz), rare, rareKind, birds: [birdsKept, birdsLeft, Math.round(birdsOff * 10) / 10], gulls: gullInfo.slice(), islesMoved: [islesMoved, islesStrait], R0, NC, KO, dr, L, turnR: Rs.map((q) => Math.round(q)), lead: [Math.round(leadK * 100) / 100, Math.round(boatD(0) * 10) / 10, Math.round(stationMin * 100) / 100], sl: places.sl, dens: Math.round(dens * 1000) / 1000,
        places: { dOuter, dGapA, dGapB, dInner, c3: places.c3, dRim, dNb, dHero, dLane, dOut, sMeet, dFallen },
        T: [dRing[KO - 1], dGapA, dGapB, places.c3, dRim, dHero, dLane, dFallen, L].map((q) => Math.round(filmT(q) * 10) / 10),
        nose: NOSE.map((c) => [c.A, c.R, c.per].map((q) => Math.round(q * 10) / 10)), snd: [SND.off, Math.round(SND.per * 10) / 10], Tgreat: GREAT_T.concat([GREAT_SPAN, LEAP_ROUND]).map((q) => Math.round(q * 10) / 10),
        dRing: dRing.slice(), dOutRing: dOutRing.map((d) => Math.round(d)), breaches: BREACH.length, leaps: LEAP.length, upper: [upCows.length, upFar.length],
        counts: { pool: poolN, rankers: rankers.length, bulls: bulls.length, mids: mids.length, fulls: fulls.length, fars: fars.length, deeps: deeps.length, deepsLow: deepsLow.length } },
      update(dt, time, camera, u) {
        U.uTime.value = time;
        camera.getWorldPosition(_cam);
        sea.position.set(_cam.x, 0, _cam.z); deep.position.set(_cam.x, -FLOOR, _cam.z);
        // dEye: the eye's metres; dNow: the boat's station for them (see THE BOAT'S STATION)
        const dEye = u * L, dNow = boatD(dEye);
        path.posAtDist(dNow, _p); path.tangentAtDist(dNow, _t);
        // (the eye's place in her is SEAT metres forward of the boat's own origin: the harpooneer stands in the bow
        // with his thigh in the clumsy cleat, his eye a metre and a half behind the stem head and some 0.65 m over it)
        const tl = Math.hypot(_t.x, _t.z) || 1, dx = _t.x / tl, dz = _t.z / tl, bx = _p.x - dx * SEAT, bz = _p.z - dz * SEAT;
        // HER STATION IS KNOWN FROM THE FIRST FRAME THE WORLD IS SEEN, through the last world's gate too (there the eye's
        // metres are nought and she lies her whole lead, thirty metres and more, ahead of the start):
        // SHE HERSELF IS DRAWN AT EVERY FRAME, with her wake, her low water, her shadow and the hole in the sea.
        U.uBoat.value.set(bx, bz, dx, dz);
        SU.uWake.value = clamp(paceBy(places, dEye) * 0.75 * (boatD(dEye + 1) - boatD(dEye - 1)) * 0.5, 0.2, 1);
        // SHE IS STEADY: she takes none of the sea's rise or slope (long, laden and driven, she cuts through it and the
        // sea rises and falls along her sides); only a small rock of her own on the world clock. So where the eye is
        // down in her bow, it and her stem head keep their places against each other.
        // THE STROKE is on the world clock, one stroke and one swing of the oars the whole way: nothing aboard her
        // changes at a place of the route or for anything a whale does.
        uRow.value.set(time * 3.456, 1);
        const by = 0.03 * Math.sin(time * 1.1 + rockPh[0]);
        boat.position.set(bx, by, bz); SU.uBoatY.value = by;
        boat.rotation.set(0.006 * Math.sin(time * 0.8 + rockPh[1]), Math.atan2(-dx, -dz), 0.012 * Math.sin(time * 0.95 + rockPh[2]));
        sky.update(dt, time, camera); rig.update(dt, time, camera); ridges.update(dt, time, camera); cloudField.update(dt, time, camera);
        fauna.update(dt, time, camera, u);

        // THE LANE OF DEEP WATER along the route's line (the part's WAY block), worked on the world clock alone: the
        // clock carries each whale of the rounds round its rank, and where its own place lies in the lane it is under.
        deepLane.step(time);
        for (let i = 0; i < bulls.length; i++) { const q = bulls[i], v = q.keep; herdBull.keep(i, v); washAll.keep(q.wi, v); shades.keep(q.wi, v); spoutsAll.keep(q.si, v); }
        for (let i = 0, s0 = washList.length; i < rankers.length; i++) { const q = rankers[i], v = q.keep; herdRank.keep(i, v); washRank.keep(q.wi, v); shades.keep(s0 + q.wi, v); spoutsAll.keep(q.si, v); }
        // the ranks' make: who is within three lengths of the line just now is drawn from the pool, in the full make
        { let n = 0;
          for (let i = 0; i < rankers.length; i++) { const q = rankers[i], on = n < poolN && bandOf(q, time) < 3 * q.len; herdRank.show(i, !on); if (on) fullPool.put(n++, q); }
          for (let i = 0; i < bulls.length; i++) { const q = bulls[i], on = n < poolN && bandOf(q, time) < 3 * q.len; herdBull.show(i, !on); if (on) fullPool.put(n++, q); }
          fullPool.done(n); }
        // the named pair, hanging at ease; the newborn turning its small circle
        const bob = 0.3 * Math.sin(time * 0.35 + bobPh);
        hc.tail = time * 0.7 + bobPh; hc.y = -heroAt.depth + bob; cows.set(0, hc);
        const hy = hcalf.y; hcalf.tail = time * 1.6 + tph[0]; hcalf.y = hy + bob; calves.set(0, hcalf); hcalf.y = hy;
        const na = time * 0.22 * dirSign + nbPh;
        nb.x = nbAt.x + Math.cos(na) * 3.4; nb.z = nbAt.z + Math.sin(na) * 3.4; nb.yaw = Math.atan2(-Math.sin(na) * dirSign, Math.cos(na) * dirSign);
        nb.y = -4 + 0.6 * Math.sin(time * 0.3 + nbBob); nb.roll = 0.5 * Math.sin(time * 0.21 + nbBob); nb.tail = time * 3 + tph[1];
        // (THE LANE'S LAW ON THE NEWBORN, by its own place: its circle runs in and out of the lane's reach, so it
        // takes the lane's depth by the body's own distance to the route's line, as the whales of the rounds do)
        { const hx = -Math.sin(na) * dirSign, hz = Math.cos(na) * dirSign, wd = deepLane.at(deepLane.dist(nb.x, nb.z, hx, hz, nb.len)[0]); nb.y -= wd * Math.max(0, nb.y + 0.18 * nb.len + WAY.DEPTH); }
        newborn.set(0, nb);

        // the nosing calves on their rounds, the cow at mum0, the calves' breaths and the rings they leave on the
        // calm (all on the world clock)
        mum.y = -9 + 0.2 * Math.sin(time * 0.31 + calfPh); mum.tail = time * 1.3 + tph[3]; cows.set(1, mum);
        { let a0 = 1e9, a1 = 1e9, b0 = null, b1 = null;
          for (let j = 0; j < NOSE_N; j++) {
            const c = NOSE[j];
            if (!c) { for (let n = 0; n < 3; n++) puffs.fire(j * 3 + n, 0, -50, 0, 0, 1, 0, 1, -1e4, 0, 1); continue; }
            const gq = time / c.per + c.ph, g = gq - Math.floor(gq), o = c.o;
            noseAt(c, g, o);
            { const near = smoothstep(-3, -0.5, o.y); o.y += 0.05 * Math.sin(time * 1.7 + c.wob) * near; o.roll += 0.07 * Math.sin(time * 0.8 + c.wob); o.pitch += 0.05 * Math.sin(time * 1.1 + c.wob) * near; }
            o.tail = time * 3.4 + c.wob; calves.set(1 + j, o);
            for (let n = 0; n < 3; n++) {
              const b = c.blows[n], age = b ? (g - b.g) * c.per : -1;
              if (b && age >= 0 && age < 9) { puffs.fire(j * 3 + n, b.x, 0.3, b.z, b.vx, 0.8, b.vz, 0.9, time - age, 0, 1); if (age < a0) { a1 = a0; b1 = b0; a0 = age; b0 = b; } else if (age < a1) { a1 = age; b1 = b; } }
              else puffs.fire(j * 3 + n, 0, -50, 0, 0, 1, 0, 1, -1e4, 0, 1);
            }
          }
          // (a ring spreads from each of the two latest breaths)
          if (b0) SU.uBreath.value[0].set(b0.x, b0.z, a0, smoothstep(0, 0.3, a0) * (1 - smoothstep(2.6, 4.6, a0))); else SU.uBreath.value[0].set(0, 0, 0, 0);
          if (b1) SU.uBreath.value[1].set(b1.x, b1.z, a1, smoothstep(0, 0.3, a1) * (1 - smoothstep(2.6, 4.6, a1))); else SU.uBreath.value[1].set(0, 0, 0, 0);
        }

        // the sounding bull on his round, and his two blows (the world clock)
        { const g = time / SND.per + SND.ph, s = (g - Math.floor(g)) * SND.per;
          sndAt(s, sndO); sndO.speed = 2; sndO.tail = time * 2 + SND.seed; sounder.set(0, sndO);
          for (let j = 0; j < 2; j++) { sndAt(SND_BLOW[j], _o2); blowAt(PF_SND + j, _o2, SND.len, 0.28 * SND.len, SND.off < 0 || s < SND_BLOW[j] ? -1 : s - SND_BLOW[j], time, 1.9); } }

        // LEAPS: the herd's (BREACH, twelve whales to play them) and the lane's (LEAP, three) on the world clock, round
        // after round (tAmb: the round's second), and the great bull's in the same round. Each whale plays the leap
        // of its own that started up last, BY THE ROUND (a leap begun near the round's end plays on into the next:
        // its seconds are read modulo the round's length). A sheet of spray where each breaks out, a crown where it
        // falls.
        const tAmb = time - Math.floor(time / LEAP_ROUND) * LEAP_ROUND;
        const playLeaps = (by, O, set, pf) => {
          for (let i = 0; i < O.length; i++) {
            const mine = by[i], o = O[i]; let b = null, age = 1e9;
            for (let n = 0; n < mine.length; n++) { const c = mine[n]; let a = tAmb - c.T - c.t0; a -= Math.floor(a / LEAP_ROUND) * LEAP_ROUND; if (a < age) { age = a; b = c; } }
            if (!b) { o.y = -500; set.set(i, o); puffs.fire(pf + i * 2, 0, -50, 0, 0, 1, 0, 1, -1e4, 1); puffs.fire(pf + 1 + i * 2, 0, -50, 0, 0, 1, 0, 1, -1e4, 1); continue; }
            const tau = age + b.t0; leapAt(b, tau, time, o); set.set(i, o);
            const ox = b.x + b.fx * b.run * b.tOut, oz = b.z + b.fz * b.run * b.tOut, fx2 = b.x + b.fx * (b.run * b.tFall + 0.2 * b.len), fz2 = b.z + b.fz * (b.run * b.tFall + 0.2 * b.len);
            puffs.fire(pf + i * 2, ox, 0.3 + swellAt(ox, oz, time), oz, 0, 1, 0, 0.17 * b.len, tau >= b.tOut && tau < b.tOut + 6 ? time - (tau - b.tOut) : -1e4, 1);
            puffs.fire(pf + 1 + i * 2, fx2, 0.3 + swellAt(fx2, fz2, time), fz2, 0, 1, 0, 0.28 * b.len, tau >= b.tFall && tau < b.tFall + 6 ? time - (tau - b.tFall) : -1e4, 1);
          }
        };
        playLeaps(breachBy, breachO, leapers, PF_BREACH);
        playLeaps(leapBy, leapO, laneLeap, PF_LL);
        {
          // the great breach: a sheet of white where it breaks out (three bursts as it comes, a fourth streaming off
          // it as it stands), a wall of seven along its length where it falls; and the foam it leaves on the sea
          // (uFall: where, seconds since, the bull's length)
          // (tau: the seconds of his latest leap, by the long round)
          let q = 1e9; for (let j = 0; j < GREAT_T.length; j++) { let d = tAmb - GREAT_T[j] - GB.t0; d -= Math.floor(d / LEAP_ROUND) * LEAP_ROUND; if (d < q) q = d; }
          const tau = q + GB.t0, b = GB;
          leapAt(b, tau, time, greatO); great.set(0, greatO);
          for (let j = 0; j < 4; j++) {
            const tj = b.tOut + 0.22 * j;
            greatSpray.fire(j, b.outX + b.fx * j * 2.5, 0.3, b.outZ + b.fz * j * 2.5, b.fx * 0.3, 1, b.fz * 0.3, (0.2 + 0.035 * j) * b.len, tau >= tj && tau < tj + 7 ? time - (tau - tj) : -1e4, 1);
          }
          for (let j = 0; j < 7; j++) {
            const q = (j - 3) * 0.14 * b.len, tj = b.tFall + 0.06 * j;
            greatSpray.fire(4 + j, b.fallX + b.fx * q, 0.3, b.fallZ + b.fz * q, 0, 1, 0, (0.3 + 0.04 * (j % 3)) * b.len, tau >= tj && tau < tj + 7 ? time - (tau - tj) : -1e4, 1);
          }
          SU.uFall.value[0].set(b.outX, b.outZ, tau - b.tOut, 0.45 * b.len); SU.uFall.value[1].set(b.fallX, b.fallZ, tau - b.tFall, b.len);
        }
      },
      dispose() { sky.dispose?.(); cloudField.dispose?.(); },
    };
  },
};
