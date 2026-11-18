// THE BRIMSTONE PARASOL. Daylight on an airless sulphur moon: a volcanic plume with no wind to bend it rises as a pencil
// of white and falls back as a ribbed blue-white umbrella from horizon to zenith, snowing in a ring where its rim lands.
// We cross a black brimstone lake paved with gold crust, pass a harvester convoy, fly through the snow curtain, under the
// ribbed ceiling, along the vermilion caldera crest, half round the braided jet and up to a frost-collared ring.
//
// Coordinates: the vent is the origin, +Z is north (the entry heading). The hero mirrors the brief's map so that the sun
// is to starboard at entry: east = -X, west = +X. Everything here is lit by ONE analytic rig shared by all shaders
// (hard key, sulphur bounce, plume fill, planet-shine): no scene lights, no shadow maps (stretched dark quads instead).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildHero } from '../parts/brimstone-parasol.js';

const TAU = Math.PI * 2, RIM = 2500, APEX = 2400;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const col = (hex) => new THREE.Color(hex);

// chemistry: [plain, snow, caldera, sage, ghost blue, sky, dark] + lemon far plain, ochre, seam glow, hull
const CHEM = [
  { name: 'custard', pal: ['#F2D24B', '#E9EFE6', '#D9502B', '#9DB89A', '#6FB4FF', '#0A0C1A', '#1A1410'], lemon: '#F4E27A', ochre: '#D9A03A', seam: '#FF8A2A', hull: '#9DB89A', crust: '#E8B93A' },
  { name: 'lime', pal: ['#E4EDB0', '#F1F4EC', '#3FA98C', '#A9B8C8', '#7FC0FF', '#080B18', '#12161A'], lemon: '#F0F3D2', ochre: '#B9CC7A', seam: '#B06CFF', hull: '#D8C6A0', crust: '#D5E08A' },
  { name: 'burnt', pal: ['#E08A3C', '#F3DCD8', '#B8402E', '#B9A58C', '#7FB0FF', '#0B0A16', '#1A1210'], lemon: '#EDB46A', ochre: '#C06A2C', seam: '#FFB040', hull: '#A9C2B8', crust: '#E9A04A' },
];

// ---------- GLSL shared by every solid of this world ----------
const G_LIT = /* glsl */`
uniform vec3 uSun, uKey, uBounce, uPlume, uPlanetC, uPlanetDir, uSnowSh;
uniform float uTime, uSunK, uLineY, uRibDrift, uPlumeK;
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fb2(vec2 p){ return vn2(p) * 0.5 + vn2(p * 2.03 + 7.1) * 0.3 + vn2(p * 4.1 + 3.7) * 0.2; }
// sun reaching the ground under the dome: 70 percent, with the ribs' shadows as radial stripes that crawl west
float domeSun(vec3 P){
  float r = length(P.xz), inside = 1. - smoothstep(2180., 2520., r);
  float a01 = atan(P.z, P.x + 1e-4) / 6.2831853;
  float x = a01 * 96. + uRibDrift, f = abs(fract(x) - 0.5);
  float hair = abs(fract(x * 5.) - 0.5);
  float fx = fwidth(a01) * 96., kx = 1. - smoothstep(0.35, 0.9, fx), kh = 1. - smoothstep(0.35, 0.9, fx * 5.);
  float stripe = 1. - 0.44 * mix(0.3, 1. - smoothstep(0.05 - fx * 0.5, 0.12 + fx * 0.5, f), kx) - 0.4 * mix(0.3, 1. - smoothstep(0.07, 0.16, hair), kh) * smoothstep(200., 600., r);
  stripe = mix(1., stripe, smoothstep(140., 420., r));
  return mix(1., 0.74 * stripe, inside) * smoothstep(uLineY - 1.5, uLineY + 1.5, P.y);
}
// frost: 0 bare sulphur .. 1 snow. key: sun term already shaped by the caller (0..~1.3)
vec3 moonLit(vec3 alb, vec3 N, vec3 P, float frost, float key){
  vec3 toV = vec3(-P.x, 260., -P.z); toV /= max(length(toV), 1e-3);
  vec3 fill = mix(uBounce * 0.35, uSnowSh * 0.62, frost * 0.85) * (0.78 - 0.22 * N.y)
            + uPlume * uPlumeK * (0.35 + 0.65 * max(dot(N, toV), 0.))
            + uPlanetC * 0.12 * max(dot(N, uPlanetDir), 0.);
  return alb * (uKey * key + fill);
}
`;

export default {
  id: 'brimstone-parasol',
  name: 'The Brimstone Parasol',
  category: 'alien',
  weirdness: 0.5,
  media: ['space'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');

    // ---------- variations (seeded) ----------
    const vr = rng.fork ? rng.fork('looks') : rng;
    const hourPick = vr();
    let sunEl = hourPick < 0.12 ? 40 : (hourPick < 0.62 ? 14 : (hourPick < 0.84 ? 4 : 40));
    if (vary.hour === 'dawn' || vary.hour === 'golden' || vary.hour === 'night') sunEl = 4;
    else if (vary.hour === 'day') sunEl = hourPick < 0.6 ? 14 : 40;
    const skyPick = vr(), skyKind = skyPick < 0.5 ? 'gibbous' : (skyPick < 0.78 ? 'crescent' : 'stars');
    const chem = CHEM[(() => { const c = vr(); return c < 0.5 ? 0 : (c < 0.76 ? 1 : 2); })()];
    const castPick = vr(), cast = castPick < 0.22 ? 'halted' : (castPick < 0.34 ? 'stakes' : 'convoy');
    const nHarv = cast === 'stakes' ? 0 : (cast === 'halted' ? 4 : clamp(Math.round(vr.range(3, 9.4) * (0.8 + 0.2 * dens)), 3, 9));
    const surging = vr.chance(0.4);
    const rare = !!vary.rare;
    const pal = chem.pal;
    const elR = sunEl * Math.PI / 180;
    const SUN = V3(-Math.cos(elR), Math.sin(elR), 0);
    const PLANET = V3(Math.sin(32 * Math.PI / 180), 0.115, Math.cos(32 * Math.PI / 180)).normalize();
    const grazing = sunEl < 8, high = sunEl > 30;

    // ---------- shared uniforms of the analytic light rig ----------
    const L = {
      uSun: { value: SUN }, uKey: { value: col('#FFF6E4').multiplyScalar(grazing ? 1.05 : 1.12) },
      uBounce: { value: col(pal[0]).multiplyScalar(grazing ? 0.3 : 1) }, uPlume: { value: grazing ? col('#C9D6FF') : col('#CFE4FF') },
      uPlumeK: { value: grazing ? 0.4 : (skyKind === 'crescent' ? 0.3 : 0.2) },
      uPlanetC: { value: col(pal[3]).multiplyScalar(skyKind === 'stars' ? 0 : (skyKind === 'crescent' ? 0.5 : 1)) }, uPlanetDir: { value: PLANET },
      uSnowSh: { value: col('#8FA6C8') }, uTime: { value: 0 }, uRibDrift: { value: 0 },
      uSunK: { value: grazing ? 0.5 : (high ? 0.92 : 0.66) }, uLineY: { value: grazing ? 5.5 : -500 },
    };

    // ---------- the path (world coordinates; see header) ----------
    // The climb (u 0.83 to 1) is one held picture: a steep pull-up beside the jet, then a wide shallow quarter-spiral so that
    // the ring ahead and the jet (never more than about 75 degrees apart) share the frame while the caldera drops away
    // under us. For that the ring hangs a little lower than the brief's 545 m, on the lining's inner shell (k 0.166), and
    // the last 200 m run 13 degrees west of south climbing 19 degrees. The path is the old length to within a metre, so
    // every earlier moment keeps its u.
    const RING = V3(-307, 455, -213);
    const RING_DIR = V3(Math.sin(13 * Math.PI / 180) * Math.cos(19 * Math.PI / 180), Math.sin(19 * Math.PI / 180), -Math.cos(13 * Math.PI / 180) * Math.cos(19 * Math.PI / 180));
    // The middle (u 0.25 to 0.68) is four different pictures instead of one long level pass: out of the curtain LOW, with the
    // gaze lifted to the whole umbrella from vent to crown; low past a glass bell with its own bead jet; low between chimney
    // spires with the white jet framed ahead; a climb to 196 m for the caldera, the lake and the striped plain from above;
    // and a dive onto the terraced rampart. The route is 86 m longer than the one every other moment was keyed to, so all
    // scripted moments keep that route's u (uO: this path's u -> the old u; uN: back): outside the middle a position has the
    // u it always had to within a few metres.
    const swingX = (z) => 380 - 62 * Math.exp(-((z + 1230) / 260) * ((z + 1230) / 260));      // at the gate the route leans 62 m toward the jet, so the jet stands ahead between the spires
    const path = makePath([
      [380, 8, -3315], [380, 9.5, -3130], [380, 30, -2950], [380, 12, -2770], [380, 10, -2500], [380, 10, -2200], [380, 13, -1950], [swingX(-1740), 16, -1740], [swingX(-1500), 13, -1500], [swingX(-1330), 15, -1330],
      [swingX(-1200), 52, -1200], [swingX(-1090), 132, -1090], [swingX(-990), 194, -990], [swingX(-900), 196, -900], [swingX(-760), 150, -760], [380, 95, -600], [380, 64, -470], [380, 50, -340], [380, 47, -220], [380, 47, -120], [380, 47, 0],
      [377, 47, 53], [306, 50, 124], [195, 56, 164],
      [103, 62, 165], [39, 67, 155], [0, 70, 150], [-58, 98, 159], [-136, 176, 165], [-222, 257, 146], [-293, 320, 97], [-342, 365, 30],
      RING.clone().addScaledVector(RING_DIR, -200), RING.clone().addScaledVector(RING_DIR, -100), RING,
    ]);
    const L_OLD = 4540.4, S_A = 1099.7 + 15, S_B = path.length - (L_OLD - 3035.9), UA = 1099.7 / L_OLD, UB = 3035.9 / L_OLD;      // the old route's length; where the two routes part (z -2200) and meet again (z -270)
    const uO = (u) => { const sd = u * path.length; return sd <= S_A ? Math.max(sd - 15, 0) / L_OLD : (sd >= S_B ? 1 - (path.length - sd) / L_OLD : lerp(UA, UB, (sd - S_A) / (S_B - S_A))); };
    const uN = (uo) => (uo <= UA ? (uo * L_OLD + 15) : (uo >= UB ? path.length - (1 - uo) * L_OLD : lerp(S_A, S_B, (uo - UA) / (UB - UA)))) / path.length;
    const PA = (uo, out) => path.pointAt(uN(uo), out), TA = (uo, out) => path.tangentAt(uN(uo), out);
    const duration = 52;
    const NEAR = V3(280, 0, -1590), GATE = V3(swingX(-1215) + 42, 0, -1215);

    // ---------- the land: height in metres at (x, z) ----------
    const LAKE = { x: 300, z: -3290, rx: 520, rz: 450, y: 0 };            // entry lake: north shore 460 m from the start
    const CAL_Y = 1.5;                                                     // caldera lake level
    const nz0 = rng.range(0, 500);
    const crestR = (th) => {                                               // the west rim runs straight under the path for 270 m
      let d = Math.abs(Math.atan2(Math.sin(th), Math.cos(th)));
      const w = 1 - smoothstep(0.3, 0.72, d);
      return 380 * lerp(1, 1 / Math.cos(Math.min(d, 0.8)), w) + 14 * noise.n2(Math.cos(th) * 1.7 + nz0, Math.sin(th) * 1.7) * (1 - w);
    };
    const lakeD = (x, z) => {
      const dx = (x - LAKE.x) / LAKE.rx, dz = (z - LAKE.z) / LAKE.rz;
      return Math.hypot(dx, dz) + 0.1 * noise.n2(x * 0.004 + nz0, z * 0.004) + 0.04 * noise.n2(x * 0.017, z * 0.017 + nz0);
    };
    const chanX = (z) => swingX(z) - 31 + 9 * Math.sin(z / 61) + 4.5 * Math.sin(z / 23.5 + 1.3), CHAN_Y = 0.4;
    const heightAt = (x, z) => {
      const r = Math.hypot(x, z);
      let h = 5.5 + 5.5 * noise.fbm2(x / 520 + nz0, z / 520, 3) + 1.6 * noise.n2(x / 85, z / 85 + nz0);
      h *= 0.45 + 0.55 * smoothstep(40, 420, Math.abs(r - 2330));          // the snow ring lies on gentler ground
      h = lerp(-5, h, smoothstep(0.93, 1.1, lakeD(x, z)));                 // entry lake basin
      if (z < -150 || r > 560) {                                           // corridor along the northward straight
        const cx = swingX(z), d = Math.abs(x - cx), py = z < -2200 ? 9 : path.nearestXZ(cx, z).y;
        if (d < 130 && z > -3400) h = lerp(Math.min(h, py - 8 - 0.4 * noise.n2(x * 0.05, z * 0.05)), h, smoothstep(22, 130, d));
      }
      if (z > -2130 && z < -1240 && x > 200 && x < 470) {                  // the brimstone channel: a leveed trench of melt that runs from the gate's vent field out to the snow ring, 30 m to starboard of the route
        const kz = smoothstep(-2130, -2050, z) * (1 - smoothstep(-1330, -1268, z)), dC = Math.abs(x - chanX(z));
        const pond = 1 - smoothstep(20, 34, Math.hypot(x - chanX(-1296), z + 1296));
        h = Math.max(h, 1.6) + 2.1 * Math.exp(-((dC - 23) / 5.5) * ((dC - 23) / 5.5)) * kz * (1 - pond);
        h = lerp(h, -3.5, Math.max((1 - smoothstep(6.5, 17, dC)) * kz, pond));
      }
      h = lerp(h, 6, smoothstep(3900, 5200, r));                           // far out the plain lies level, so the horizon is one straight line
      if (r < 640) {                                                       // the caldera rampart, terraced, and its sunken floor
        const th = Math.atan2(z, x), cr = crestR(th), d = r - cr;
        let ram = 35 * Math.exp(-(d * d) / (d > 0 ? 62 * 62 : 34 * 34));
        const kT = 0.85 * smoothstep(2, 9, ram) * (1 - smoothstep(31, 35, ram));
        ram += 2.2 * noise.n2(x * 0.03 + nz0, z * 0.03) * smoothstep(4, 20, ram) * (1 - smoothstep(26, 34, ram));
        h = lerp(h, 3, smoothstep(640, 470, r)) + ram;
        const st = (h - 3) / 5.8, fs = st - Math.floor(st);                 // terraces: level steps 5.8 m high (the ground shader reads the same contours)
        h = lerp(h, 3 + (Math.floor(st) + smoothstep(0.55, 0.95, fs)) * 5.8, kT);
        h = lerp(-4, h, smoothstep(cr - 100, cr - 72, r));                 // the floor drops under the caldera lake
      }
      return h;
    };
    const groundAt = (x, z) => Math.max(heightAt(x, z), (lakeD(x, z) < 1 ? LAKE.y : -99), (Math.hypot(x, z) < 330 ? CAL_Y : -99));

    // ---------- sky: vacuum black, sharp stars at half strength, a band of star-dust, a fierce small sun, the planet ----------
    const pR = V3().crossVectors(V3(0, 1, 0), PLANET).normalize().negate(), pU = V3().crossVectors(pR, PLANET).normalize();
    if (pU.y < 0) pU.negate();
    const skyU = {
      uSun: L.uSun, uTime: L.uTime, uPDir: { value: PLANET }, uPR: { value: pR }, uPU: { value: pU },
      uPLight: { value: skyKind === 'crescent' ? V3().copy(pR).multiplyScalar(0.62).addScaledVector(PLANET, 0.74).addScaledVector(pU, 0.25).normalize() : SUN },      // crescent: lit from the sun's side and a little behind, about an eighth of the disc
      uPGain: { value: skyKind === 'crescent' ? 1.7 : 0.95 }, uPLimb: { value: skyKind === 'crescent' ? 0 : 0.45 },
      uPOn: { value: skyKind === 'stars' ? 0 : 1 }, uStars: { value: skyKind === 'stars' ? 1.25 : 0.62 }, uDust: { value: skyKind === 'stars' ? 1.7 : 0.8 },
      uSage: { value: col(pal[3]) }, uCream: { value: col('#E9EFE6') }, uRust: { value: col('#B8683C') }, uSkyC: { value: new THREE.Color(0.0105, 0.0115, 0.0175) },      // shows as the brief's vacuum black (about #0A0C1A after the tone map and grade), not zero
      uSeed: { value: rng.range(0, 40) }, uHalo: { value: 0 }, uBandK: { value: 1 },
    };
    const stars0 = skyU.uStars.value;
    const skyMat = new THREE.ShaderMaterial({
      uniforms: skyU, depthWrite: false, depthTest: false, side: THREE.BackSide, fog: false,
      vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: /* glsl */`
uniform vec3 uSun, uPDir, uPR, uPU, uPLight, uSage, uCream, uRust, uSkyC; uniform float uTime, uPOn, uStars, uDust, uSeed, uHalo, uBandK, uPGain, uPLimb;
varying vec3 vD;
float h31(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7)) + uSeed) * 43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
vec3 starLayer(vec3 d, float n, float px, float thresh){
  vec3 p = d * n, c = floor(p);
  float h = h31(c); vec3 o = vec3(h31(c + 3.1), h31(c + 7.7), h31(c + 11.3)) * 0.6 + 0.2;
  float dist = length(p - c - o), rad = max(0.07, px * n * 1.1);
  float m = 1. - smoothstep(rad * 0.35, rad, dist);
  float e = min(1., (0.07 * 0.07) / (rad * rad)) * 0.6 + 0.4;
  float b = step(thresh, h) * (0.3 + 0.7 * h31(c + 19.)); b *= b * b;
  vec3 tint = mix(vec3(1., 0.86, 0.72), vec3(0.78, 0.88, 1.), h31(c + 23.));
  return tint * m * b * e;
}
void main(){
  vec3 d = normalize(vD);
  float px = length(fwidth(d)) * 0.7;
  vec3 c = uSkyC;
  vec3 st = starLayer(d, 150., px, 0.9) * 2.2 + starLayer(d.zxy, 260., px, 0.86) * 1.1 + starLayer(d.yzx, 90., px, 0.93) * 3.6;
  float band = exp(-d.x * d.x / 0.035) * (0.4 + 0.6 * vn2(vec2(atan(d.z, d.y + 1e-4) * 5., d.x * 9.)));
  float dustN = vn2(d.yz * 7. + d.x * 3.) * 0.6 + vn2(d.zy * 19.) * 0.4;
  float band2 = exp(-d.x * d.x / 0.09) * (0.55 + 0.45 * vn2(vec2(atan(d.z, d.y + 1e-4) * 3., d.x * 5. + 9.)));
  c += vec3(0.62, 0.7, 0.9) * (band * dustN * 0.03 + (uBandK - 1.) * band2 * (0.35 + 0.65 * dustN) * 0.012) * uDust;
  st *= 1. + 1.4 * band * uDust;
  float up = smoothstep(-0.02, 0.01, d.y);
  // the sun: a hard white coin, no sky glow (bloom makes the only halo)
  float sd = dot(d, uSun), disc = smoothstep(0.99992, 0.99996, sd);
  float g1 = max(sd, 0.); g1 *= g1; g1 *= g1; g1 *= g1; g1 *= g1; g1 *= g1; g1 *= g1; g1 *= g1; g1 *= g1;   // ^256
  float g2 = g1 * g1; g2 *= g2; g2 *= g2;                                                                        // ^2048
  float g0 = max(sd, 0.); g0 *= g0; g0 *= g0; g0 *= g0; float g64 = g0 * g0; g64 *= g64; g64 *= g64;
  vec3 sun = vec3(1., 0.96, 0.88) * (disc * 26. + g2 * 1.6 + g1 * 0.05 + uHalo * (g1 * 0.9 + g64 * 0.3 + g0 * 0.07));
  // the parent planet: 16 degrees across, banded, sheared, one pale storm; its night side hides the stars
  float pm = 0.;
  vec2 q = vec2(dot(d, uPR), dot(d, uPU)) / (max(dot(d, uPDir), 0.2) * 0.1405);
  float rr = dot(q, q), fwr = min(fwidth(rr), 0.2);
  if (uPOn > 0.5 && dot(d, uPDir) > 0.9) {
    if (rr < 1.) {
      float zz = sqrt(max(1. - rr, 0.));
      vec3 n = q.x * uPR + q.y * uPU - zz * uPDir;
      float lat = q.y * 0.97 + q.x * 0.24, lon = q.x * 0.97 - q.y * 0.24;
      float lo = lon / max(sqrt(max(1. - lat * lat, 0.)), 0.15);
      float shear = uTime * 0.012 * (0.4 + sin(lat * 9.)) + uSeed;
      float w = vn2(vec2(lo * 2.2 + shear, lat * 16.)) * 0.5 + vn2(vec2(lo * 5. - shear * 1.7, lat * 34.)) * 0.25;
      float b = sin(lat * 15. + w * 2.6 + sin(lat * 4. + uSeed) * 1.5);
      vec3 pc = mix(uSage, uCream, smoothstep(-0.5, 0.6, b));
      pc = mix(pc, uRust, (1. - smoothstep(0.03, 0.075, abs(lat + 0.17 + 0.03 * w))) * 0.8);
      pc = mix(pc, uSage * 0.6, smoothstep(0.68, 0.98, abs(lat)) * 0.6);
      vec2 so = vec2((lo - 0.25 - 0.1 * sin(uTime * 0.02)) / 0.24, (lat - 0.32) / 0.09);
      pc = mix(pc, vec3(0.97, 0.95, 0.88), (1. - smoothstep(0.5, 1., dot(so, so))) * 0.85);
      float ndl = dot(n, uPLight), lit = smoothstep(-0.06, 0.3, ndl) * (0.35 + 0.65 * max(ndl, 0.));
      float edge = 1. - smoothstep(1. - 1.5 * fwr - 0.01, 1., rr);
      c = mix(c, pc * (lit * uPGain + 0.004) * (1. - uPLimb + uPLimb * zz), edge);
      pm = edge;
    }
  }
  c += st * uStars * up * (1. - pm);
  c += sun * step(-0.01, d.y) * (1. - pm);
  gl_FragColor = vec4(c, 1.);
}`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(100, 24, 16), skyMat);
    sky.frustumCulled = false; sky.renderOrder = -10;
    scene.add(sky);

    await ctx.yield();
    // ---------- the hero ----------
    const hero = await buildHero(ctx, { palette: pal, detail, sunDir: SUN, snowRing: false, surge: surging ? 0.9 : 0.32, fog: 0, portal: RING, portalDir: RING_DIR });
    hero.uniforms.uGold.value.set('#FFDFA0').multiplyScalar(1.12);
    scene.add(hero.object);
    const seat = hero.anchors.portalSeat;
    await ctx.yield();

    // ---------- ground shader: banded sulphur plain, snow ring with spokes, tracks, cracks, pebbles, frost ----------
    const solidMat = (vs, fs, extra = {}, o = {}) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: { ...L, ...extra }, fog: false, ...o });
    const GROUND_V = /* glsl */`
attribute vec3 color; varying vec3 vW, vN, vC;
void main(){ vC = color; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
    const GROUND_F = /* glsl */`
${G_LIT}
uniform vec3 uSnow, uOchre, uGold; uniform float uTrackOn, uCal, uRelief;
varying vec3 vW, vN, vC;
// value noise with its analytic gradient (value, d/dx, d/dz): the relief is lit from exact slopes, never from screen derivatives
vec3 vnd(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f), du = 6. * f * (1. - f);
  float a = h21(i), b = h21(i + vec2(1., 0.)), c = h21(i + vec2(0., 1.)), d = h21(i + vec2(1., 1.));
  float k1 = b - a, k2 = c - a, k4 = a - b - c + d;
  return vec3(a + k1 * u.x + k2 * u.y + k4 * u.x * u.y, du * vec2(k1 + k4 * u.y, k2 + k4 * u.x)); }
// three octaves; each fades to its mean tone (0.5, flat) once it is finer than the pixel footprint fw (in units of p)
vec3 fbd(vec2 p, float fw){
  vec3 a = vnd(p), b = vnd(p * 2.03 + 7.1), c = vnd(p * 4.1 + 3.7);
  float ka = 1. - smoothstep(0.3, 0.8, fw), kb = 1. - smoothstep(0.3, 0.8, fw * 2.03), kc = 1. - smoothstep(0.3, 0.8, fw * 4.1);
  return vec3(0.5, 0., 0.) + vec3(a.x - 0.5, a.yz) * 0.5 * ka + vec3(b.x - 0.5, b.yz * 2.03) * 0.3 * kb + vec3(c.x - 0.5, c.yz * 4.1) * 0.2 * kc; }
// a pair of ruts 5.2 m apart: x = coverage, y = chevron tread (filtered to its mean tone when finer than a pixel)
vec3 rutPair(float dx, float z, float w, float fd, float fz){
  float d = abs(abs(dx) - 2.6), rut = 1. - smoothstep(0.6 - fd * 0.5, 0.6 + w + fd * 0.5, d);
  rut *= min(1., 1.5 / max(fd, 1e-3));
  float tri = abs(fract((z + d * 1.3) / 1.5) - 0.5) * 2.;
  float tread = mix(0.55, smoothstep(0.38 - fz, 0.5 + fz, tri), 1. - smoothstep(0.2, 0.55, fz));
  float wall = (1. - smoothstep(0.03, 0.2 + fd, abs(d - 0.68))) * sign(abs(dx) - 2.6) * sign(dx) * (1. - smoothstep(0.1, 0.5, fd));
  return vec3(rut, tread, wall);
}
void main(){
  vec3 P = vW, N = normalize(vN), V = cameraPosition - P; float dist = length(V); V /= max(dist, 1e-3);
  float r = length(P.xz), mid = 1. - smoothstep(500., 2600., dist);
  float fwp = length(fwidth(P.xz)), fwx = fwidth(P.x), fwz = fwidth(P.z);
  vec3 n1 = fbd(P.xz * 0.011, fwp * 0.011), n2 = fbd(P.xz * 0.09 + 13., fwp * 0.09), n3 = fbd(P.xz * 0.7 + 5., fwp * 0.7), n4 = vnd(P.xz * 4.3);
  float k4 = 1. - smoothstep(0.25, 0.7, fwp * 4.3);
  // polygonal crust plates (7 m), one 3x3 Voronoi: the two nearest centres give the edge distance and its direction
  vec2 g = P.xz / 7., gi = floor(g), gf = fract(g); float f1 = 9., f2 = 9., cid = 0.; vec2 c1 = vec2(0.), c2 = vec2(0.);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)), c = o + vec2(h21(gi + o), h21(gi + o + 31.7)) * 0.8 + 0.1 - gf;
    float d = dot(c, c); if (d < f1) { f2 = f1; c2 = c1; f1 = d; c1 = c; cid = h21(gi + o + 5.3); } else if (d < f2) { f2 = d; c2 = c; }
  }
  vec2 en = c2 - c1; float enl = max(length(en), 1e-3); en /= enl;
  float ed = (f2 - f1) / (2. * enl) * 7.;                                  // metres to the plate edge (exact for a Voronoi)
  float fe = max(fwp * 0.6, 1e-3), kPl = (1. - smoothstep(0.35, 1.5, fe)) * smoothstep(0.34, 0.52, fbd(P.xz * 0.019 + 17., fwp * 0.019).x + 0.25 * (1. - smoothstep(20., 90., dist)));
  float crack = (1. - smoothstep(0.035, 0.035 + fe, ed)) * min(1., 0.13 / fe + 0.25) * kPl;
  float bev = (1. - smoothstep(0.03, 0.5, ed)) * kPl;
  // pebbles: little domes with a sharp shadow thrown away from the sun
  vec2 pc = floor(P.xz * 0.8); float ph = h21(pc);
  vec2 pf = fract(P.xz * 0.8) - 0.5 - (vec2(h21(pc + 3.), h21(pc + 9.)) - 0.5) * 0.5;
  float pr = 0.09 + 0.17 * fract(ph * 31.), kP = step(0.8, ph) * smoothstep(0.42, 0.55, n3.x + 0.15 * (n2.x - 0.5)) * (1. - smoothstep(0.06, 0.22, fwp));
  float pd = length(pf), peb = (1. - smoothstep(pr * 0.8, pr, pd)) * kP;
  vec2 sdir = -uSun.xz / max(length(uSun.xz), 1e-3); float sL = min(pr * 0.75 / max(uSun.y, 0.12), 0.3);
  float sa = dot(pf, sdir), sb = abs(pf.x * sdir.y - pf.y * sdir.x), sw = pr * (1. - 0.6 * clamp(sa / max(sL, 1e-3), 0., 1.));
  float pebSh = step(0., sa) * (1. - smoothstep(sL * 0.85, sL, sa)) * (1. - smoothstep(sw * 0.8, sw, sb)) * kP * (1. - peb);
  // snow: the ring under the curtain, the lining's fall on the rampart, frost on the crest and in the lee
  float a01 = atan(P.z, P.x + 1e-4) / 6.2831853;
  float wob = (n1.x - 0.5) * 150. + (n2.x - 0.5) * 40.;
  float ring = smoothstep(2140., 2260., r + wob) * (1. - smoothstep(2450., 2570., r + wob));
  float lin = smoothstep(395., 425., r + wob * 0.3) * (1. - smoothstep(455., 500., r + wob * 0.3)) * smoothstep(0.44, 0.6, n2.x + 0.5 * N.y * N.y - 0.15 + 0.2 * (n3.x - 0.5)) * 0.88;
  // the rampart's terraces, read from the height contours the mesh was stepped on. On the terraced band frost keeps to
  // the treads (white strips, bare vermilion risers) instead of to noise, so the wall never breaks into blotches
  float tst = (P.y - 3.25) / 5.8, tfs = fract(tst), tfw = fwidth(tst);
  float kTm = smoothstep(6., 11., P.y) * (1. - smoothstep(32., 36., P.y)) * (1. - smoothstep(560., 640., r)) * uCal, kTf = 1. - smoothstep(0.35, 0.9, tfw);
  float crest = smoothstep(25., 33., P.y + (n3.x - 0.5) * 5. + 2.5 + (n2.x - 0.5) * 9.) * (1. - smoothstep(560., 640., r)) * uCal * smoothstep(0.445, 0.48 + fwp * 0.1, fbd(P.xz * 0.19 + 3., fwp * 0.19).x + 0.22 * (n3.x - 0.5) + 0.12 * (n2.x - 0.5)) * (1. - kTm);      // ragged: about a third of the crest is bare rock
  float lee = smoothstep(0.6, 0.72, 0.55 * n2.x + 0.45 * fbd(P.xz * 0.027 + 71., fwp * 0.027).x + 0.1 * (n3.x - 0.5) - 0.6 * dot(N, uSun)) * 0.85 * mid * (1. - kTm);
  // the harvesters' ruts: the working track (14 m to port) and an older pair wandering under the path
  float trZ = smoothstep(-2850., -2800., P.z) * (1. - smoothstep(-700., -560., P.z)) * uTrackOn;
  float fz = (fwz + fwx * 1.3) / 1.5;
  vec3 t1 = rutPair(P.x - 394., P.z, 0.12, fwx, fz), t2 = rutPair(P.x - (mix(371., 414., smoothstep(-2300., -2150., P.z)) + mix(24., 12., smoothstep(-2300., -2150., P.z)) * sin(P.z / 230.)), P.z, 0.16, fwx, fz);
  t2.xz *= 0.8;
  float trK = trZ * (1. - smoothstep(350., 1100., dist)), track = max(t1.x, t2.x) * trK, tread = t1.x > t2.x ? t1.y : t2.y, wall = (t1.z + t2.z) * trK;
  float frost = clamp(max(max(ring, lin), max(crest, lee)), 0., 1.) * (1. - 0.92 * track);
  float bare = 1. - frost;
  crack *= bare; bev *= bare; peb *= bare; pebSh *= bare;
  // sunlit risers, frosted treads; beyond the reach of the contours the band settles to its mean striped tone
  float kT = kTm * kTf;
  float riser = smoothstep(0.5 - tfw, 0.58 + tfw, tfs) * (1. - smoothstep(0.93 - tfw, 0.99, tfs)) * kT, treadT = (1. - smoothstep(0.42, 0.56, tfs)) * kT;
  float trF = mix(0.5, (1. - smoothstep(0.44 - tfw, 0.54 + tfw, tfs)) + smoothstep(0.95 - tfw, 1., tfs), kTf) * smoothstep(7., 15., P.y) * (0.84 + 0.16 * smoothstep(0.3, 0.6, n2.x));
  frost = max(frost, trF * kTm * (1. - 0.92 * track)); bare = 1. - frost;
  // snow relief: spokes and combs round the ring (one ridge family per rib), wind ridges everywhere else
  float fwa = fwidth(a01); vec2 tanA = vec2(-P.z, P.x) / max(r, 1.);
  float kS1 = 1. - smoothstep(0.2, 0.6, fwa * 480.), kS2 = 1. - smoothstep(0.2, 0.6, fwa * 1920.), kS3 = 1. - smoothstep(0.2, 0.6, fwa * 7680.);
  float x1 = a01 * 480. * 6.2831853, x2 = a01 * 1920. * 6.2831853 + 1.5 * sin(r * 0.021), x3 = a01 * 7680. * 6.2831853 + 2. * n3.x;
  float ridge = sin(x2) + 0.45 * sin(2. * x2 + 0.6);
  float slopeT = (sin(x1) * 0.1 * kS1 + ridge * (0.16 + 0.2 * n2.x) * kS2 + sin(x3) * 0.1 * kS3) * ring;
  vec2 wd = vec2(0.82, 0.57), we = vec2(-0.57, 0.82);
  vec3 sas = fbd(vec2(dot(P.xz, wd) * 0.07, dot(P.xz, we) * 0.6) + 3., fwp * 0.6);
  vec2 gSas = (sas.y * 0.07 * wd + sas.z * 0.6 * we) * (0.7 + 1.9 * crest) * (frost - frost * ring);      // on the crest the snow is combed into sharp ridges
  // the height gradient in world xz, each part already filtered by its own footprint
  vec2 G = n2.yz * (0.09 * 0.9 * mid) + n3.yz * (0.7 * 0.1 * (0.35 + 0.65 * bare)) + n4.yz * (4.3 * 0.02 * k4 * bare);
  G += -en * bev * 0.42 + (vec2(cid, fract(cid * 7.3)) - 0.5) * 0.1 * kPl * bare;
  G += -pf / max(pd, 1e-3) * smoothstep(pr * 0.15, pr, pd) * peb * 1.1;
  G += tanA * slopeT + gSas;
  G *= 1. - 0.85 * track;
  G.x += wall * 0.5;
  vec2 dn = N.xz / max(length(N.xz), 1e-3);
  G += -dn * riser * 0.55 + N.xz * treadT * 0.6 - en * crack * 0.3;
  float gl = length(G); G *= min(1., 0.75 / max(gl, 1e-4));
  vec3 Nb = normalize(vec3(N.x - G.x, N.y, N.z - G.y));
  // colour
  vec3 alb = vC * (0.76 + 0.28 * n1.x + 0.14 * (n2.x - 0.5) * mid + 0.1 * (n3.x - 0.5));
  alb = mix(alb, uOchre * (0.6 + 0.3 * n3.x), smoothstep(0.56, 0.74, fbd(P.xz * 0.023 + 40., fwp * 0.023).x) * 0.55);
  // the open plain beyond the snow ring, seen from the climb: broad ochre and sage-grey provinces, so it reads as land
  float farK = smoothstep(900., 2600., dist) * smoothstep(2450., 2750., r) * bare;
  float mA = fb2(P.xz * 0.0012 + 9.), mB = fb2(P.zx * 0.0027 + 31.);
  alb = mix(alb, mix(uOchre * 0.9, alb * vec3(0.66, 0.76, 0.7), smoothstep(0.42, 0.58, mB)), smoothstep(0.38, 0.66, mA) * 0.38 * farK);
  alb *= 1. - (0.2 + 0.22 * smoothstep(0.5, 0.75, fb2(P.xz * 0.0045 + 77.))) * farK;                 // a darker custard than the ground under the bell
  // razor shadows of far boulders and scarps, many times longer than what casts them, and a few black lakes flecked with gold
  vec2 sc = vec2(P.x / 330., P.z / 46.), sci = floor(sc), scf = fract(sc); float sh1 = h21(sci + 7.), sLen = 0.3 + 0.6 * h21(sci + 3.), sx0 = h21(sci + 11.) * (1. - sLen);
  float fsz = fwidth(sc.y), shd = step(0.7, sh1) * step(sx0, scf.x) * (1. - smoothstep(sx0 + sLen * 0.7, sx0 + sLen, scf.x)) * (1. - smoothstep(0.1, 0.16 + fsz, abs(scf.y - 0.5))) * min(1., 0.5 / max(fsz, 1e-3));
  alb *= 1. - 0.62 * shd * farK;
  float lk = smoothstep(0.69, 0.71, fb2(P.xz * 0.0017 + 51.)) * farK * smoothstep(2900., 3300., r);
  alb = mix(alb, vec3(0.02, 0.018, 0.02) + uGold * 0.5 * mix(0.2, step(0.8, h21(floor(P.xz / 34.))), 1. - smoothstep(10., 30., fwp)), lk);
  alb = mix(alb, uOchre * 0.5, (1. - smoothstep(0.3, 2.6, P.y)) * 0.7);                 // damp dark crust round the lakes
  alb *= (1. - 0.55 * crack) * (0.92 + 0.16 * cid * kPl * bare) * (1. + 0.22 * peb * (fract(ph * 13.) - 0.3));
  alb = mix(alb, alb * vec3(0.78, 0.6, 0.52), riser * (0.7 + 0.3 * step(0.5, fract(P.y * 1.7 + n3.x))));
  alb = mix(alb, vC * vec3(0.5, 0.43, 0.34) * mix(0.42, 0.8, tread), track * 0.94);
  float sn = 0.5 + 0.5 * ridge * kS2 * ring;
  vec3 snow = uSnow * (0.75 + 0.1 * (n2.x - 0.5) + 0.08 * (n3.x - 0.5) + 0.04 * (sn - 0.5));
  alb = min(mix(alb, snow, frost), vec3(0.78));
  float sy = max(uSun.y, 0.07), ndl = dot(Nb, uSun);
  float key = uSunK * clamp(mix(1., ndl / sy, uRelief * (1. - 0.3 * frost * (1. - crest))), 0., mix(1.9, 1.5, frost * (1. - 0.6 * crest))) * domeSun(P) * (1. - 0.85 * pebSh);
  vec3 c = moonLit(alb, Nb, P, frost, key);
  // fallout: under the bell the plume's grain never stops arriving. Soft pools of its light drift outward over the plain
  // (brighter where a thick fall is overhead) and single grains flash gold where they land
  float kIn = (1. - smoothstep(1950., 2200., r)) * smoothstep(430., 700., r);
  vec2 rdir = P.xz / max(r, 1.);
  float pool = vn2(P.xz * 0.0085 - rdir * (uTime * 0.11)) * vn2(P.xz * 0.0031 + 17. - rdir * (uTime * 0.05));
  c *= 1. + (1.2 * smoothstep(0.18, 0.7, pool) - 0.12) * kIn * step(0.01, key);
  vec2 fcell = floor(P.xz * 0.9); float fh = h21(fcell + 61.);
  vec2 fq = fract(P.xz * 0.9) - 0.5 - (vec2(h21(fcell + 12.), h21(fcell + 28.)) - 0.5) * 0.7;
  float fl = fract(uTime * (0.18 + 0.2 * fh) + fh * 31.), flash = smoothstep(0., 0.08, fl) * (1. - smoothstep(0.08, 0.5, fl));
  c += uGold * vec3(1., 0.86, 0.55) * 1.8 * step(0.955, fh) * flash * kIn * (1. - smoothstep(30., 220., dist)) * (1. - smoothstep(0.0006, 0.0035 + fwp * fwp * 2., dot(fq, fq)));
  // snow glints
  float near = 1. - smoothstep(60., 420., dist);
  vec2 cell = floor(P.xz * 1.7); float hh = h21(cell);
  vec2 gq = fract(P.xz * 1.7) - 0.5 - (vec2(h21(cell + 2.), h21(cell + 8.)) - 0.5) * 0.6;
  c += uGold * 3.2 * step(0.92, hh) * smoothstep(0.5, 1., sin(uTime * (0.7 + hh * 1.9) + hh * 50.)) * frost * near * step(0.01, key) * (1. - smoothstep(0.002, 0.012 + fwp * fwp * 2., dot(gq, gq)));
  gl_FragColor = vec4(c, 1.);
}`;
    const groundMat = solidMat(GROUND_V, GROUND_F, {
      uSnow: { value: col(pal[1]) }, uOchre: { value: col(chem.ochre) }, uGold: { value: col('#FFF0C8') },
      uTrackOn: { value: cast === 'stakes' ? 0.5 : 1 }, uCal: { value: 1 }, uRelief: { value: grazing ? 0.3 : 0.86 },
    });

    await ctx.yield();
    // side vents: 14 chimney fields inside the dome; three of them sit by the path (two puff, one is the rare bell)
    const pAt = (u) => PA(u, V3());      // u of the old route (see uN)
    const vents = [];
    // (NEAR: a glass bell 150 m across with its own bead jet, 160 m off to starboard where the path runs low; GATE: the vent in the
    // chimney field the path threads at u 0.43, which on a rare-event seed opens into the 300 m bell we fly up through)
    { const b = pAt(0.585);
      vents.push({ x: GATE.x, z: GATE.z, puff: rare ? 2 : 1, u: 0.43 }, { x: NEAR.x, z: NEAR.z, puff: 3, u: 0.34 }, { x: b.x - 62, z: b.z, puff: 1, u: 0.585 });
      vents.push({ x: swingX(-1290) - 70, z: -1290, puff: 0 }, { x: 520, z: -1840, puff: 1, u: 0.3 }, { x: 322, z: -700, puff: 3, u: 0.55, gain: 1.5, R: 60, H: 82 });
      let guard = 0;
      while (vents.length < 14 && guard++ < 200) {
        const a2 = rng.range(0, TAU), r2 = rng.range(620, 2000), x = Math.cos(a2) * r2, z = Math.sin(a2) * r2;
        if (Math.abs(x - swingX(z)) < 140 || vents.some((v) => Math.hypot(v.x - x, v.z - z) < 260)) continue;
        vents.push({ x, z, puff: vents.length < 9 ? 1 : 0 });
      }
      for (const v of vents) v.y = heightAt(v.x, v.z);
    }

    // ---------- ground meshes: one tensor grid (dense along the path), one polar mesh for the terraced rampart ----------
    const cLemon = col(chem.lemon), cPlain = col(pal[0]), cOchre = col(chem.ochre), cSage = col(pal[3]).lerp(col('#8a8a78'), 0.35), cVer = col(pal[2]);
    const tmpC = new THREE.Color();
    const bandColor = (x, z, h, out) => {
      const r = Math.hypot(x, z) + 260 * noise.n2(x / 900 + nz0, z / 900) + 70 * noise.n2(x / 140, z / 140 + nz0);
      out.copy(cLemon).lerp(cPlain, 1 - smoothstep(2500, 3100, r));
      out.lerp(cOchre, (1 - smoothstep(1250, 1650, r)) * 0.75);
      out.lerp(cSage, (1 - smoothstep(760, 1000, r)) * 0.8);
      out.lerp(cVer, (1 - smoothstep(520, 720, r)) * (0.62 + 0.3 * smoothstep(-0.2, 0.5, noise.n2(x / 55 + nz0, z / 55))));
      let halo = 0;
      for (const v of vents) { const d = Math.hypot(v.x - x, v.z - z); if (d < 190) halo = Math.max(halo, 1 - smoothstep(30, 190, d + 40 * noise.n2(x / 60, z / 60))); }
      out.lerp(cVer, halo * 0.8);
      return out.multiplyScalar(0.72 / 0.82);
    };
    const lines = (lo, hi, step, grow, far) => {
      const a = []; for (let v = lo; v <= hi + 1e-3; v += step) a.push(v);
      let s = step * 1.3, v = lo; const left = [];
      while (v > -far) { v -= s; left.push(v); s *= grow; }
      s = step * 1.3; v = hi; const right = [];
      while (v < far) { v += s; right.push(v); s *= grow; }
      return left.reverse().concat(a, right);
    };
    {
      const xs = lines(302, 458, 6, 1.24, 9200), zs = lines(-2890, 540, 12.5, 1.26, 9200), nx = xs.length, nzz = zs.length;
      const pos = new Float32Array(nx * nzz * 3), colr = new Float32Array(nx * nzz * 3), idx = new Uint32Array((nx - 1) * (nzz - 1) * 6);
      let k = 0;
      for (let j = 0; j < nzz; j++) {
        for (let i = 0; i < nx; i++) {
          const x = xs[i], z = zs[j], r = Math.hypot(x, z);
          let h = heightAt(x, z); if (r < 512) h -= 12;
          pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
          bandColor(x, z, h, tmpC); colr[k * 3] = tmpC.r; colr[k * 3 + 1] = tmpC.g; colr[k * 3 + 2] = tmpC.b; k++;
        }
        if (j % 12 === 11) await ctx.yield();
      }
      k = 0;
      for (let j = 0; j < nzz - 1; j++) for (let i = 0; i < nx - 1; i++) {
        const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(colr, 3));
      g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
      const m = new THREE.Mesh(g, groundMat); m.frustumCulled = false; scene.add(m);
      await ctx.yield();
    }
    {
      // rampart: r = crest - 110 .. 525, rows packed round the crest so the terraces are real geometry
      const nA = 288, rows = [];
      for (let i = 0; i <= 44; i++) rows.push(-112 + 150 * Math.pow(i / 44, 0.9));
      for (let i = 1; i <= 12; i++) rows.push(38 + i * 9);
      const pos = [], colr = [], idx = [];
      for (let j = 0; j < rows.length; j++) { if (j % 2 === 1) await ctx.yield(); for (let i = 0; i <= nA; i++) {
        const th = (i / nA) * TAU, cr = crestR(th), last = j === rows.length - 1;
        let r = cr + rows[j]; if (rows[j] > 60) r = lerp(r, 380 + rows[j], smoothstep(60, 146, rows[j]));
        const x = Math.cos(th) * r, z = Math.sin(th) * r;
        const h = heightAt(x, z) + (last ? -4 : 0.25);
        pos.push(x, h, z); bandColor(x, z, h, tmpC);
        colr.push(tmpC.r, tmpC.g, tmpC.b);
      } }
      for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < nA; i++) {
        const a = j * (nA + 1) + i, b = a + 1, c = a + nA + 1, d = c + 1; idx.push(a, b, c, b, d, c);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
      g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, groundMat); m.frustumCulled = false; scene.add(m);
      await ctx.yield();
    }

    // ---------- the brimstone lakes: drifting gold crust plates, seams that open orange and skin over, black melt that mirrors the bell ----------
    const LAKE_F = /* glsl */`
${G_LIT}
uniform vec3 uCrust, uLemon, uSeam, uGoldT, uBlueT, uSplit; uniform float uS, uPlateK;
varying vec3 vW;
// the parasol seen in the melt: one quadratic against the paraboloid of fall, ribs from the azimuth of the hit
vec3 bell(vec3 P, vec3 R){
  float q = ${APEX}. / (${RIM}. * ${RIM}.);
  float A = q * (R.x * R.x + R.z * R.z), B = 2. * q * (P.x * R.x + P.z * R.z) + R.y, C = q * dot(P.xz, P.xz) - ${APEX}. + P.y;
  float disc = B * B - 4. * A * C; vec3 acc = vec3(0.);
  if (disc > 0. && A > 1e-9) {
    float sq = sqrt(max(disc, 0.));
    for (int i = 0; i < 2; i++) {
      float t = (-B + (i == 0 ? -sq : sq)) / (2. * A);
      if (t > 0.) {
        vec3 H = P + R * t; float hr = max(length(H.xz), 1.);
        vec3 n = normalize(vec3(H.x / hr * 2. * q * hr, 1., H.z / hr * 2. * q * hr));
        float limb = min(4., 1. / max(0.08, abs(dot(n, R))));
        float x = atan(H.z, H.x + 1e-4) / 6.2831853 * 96., rib = 1. - smoothstep(0.04, 0.2, abs(fract(x) - 0.5));
        vec3 tint = mix(uBlueT * 0.33, uGoldT, smoothstep(-0.2, 0.5, dot(vec3(H.x, 0., H.z) / hr, uSun)));
        acc += tint * 0.07 * limb * (0.55 + 1.3 * rib) * (i == 0 ? 1. : 0.5) * smoothstep(0., 0.06, 1. - H.y / ${APEX}.);
      }
    }
  }
  return acc;
}
void main(){
  vec3 P = vW, V = cameraPosition - P; float dist = length(V); V /= max(dist, 1e-3);
  float t = uTime, near = 1. - smoothstep(80., 500., dist);
  vec2 g = (P.xz + vec2(0.25, 0.55) * t) / uS + 0.35 * vec2(vn2(P.xz * 0.004 + t * 0.004), vn2(P.zx * 0.004 - t * 0.004)) * 3.;
  vec2 gi = floor(g), gf = fract(g); float f1 = 9., f2 = 9., h1 = 0., h2 = 0.; vec2 c1 = vec2(0.), c2 = vec2(0.);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)); float hh = h21(gi + o);
    vec2 c = o + 0.5 + 0.36 * sin(t * (0.03 + 0.05 * hh) + 6.2831 * vec2(hh, h21(gi + o + 17.3))) - gf;
    float d = dot(c, c);
    if (d < f1) { f2 = f1; h2 = h1; c2 = c1; f1 = d; h1 = hh; c1 = c; } else if (d < f2) { f2 = d; h2 = hh; c2 = c; }
  }
  float edge = (sqrt(f2) - sqrt(f1)) * 0.5 * uS;                       // metres to the plate boundary (approx)
  vec2 en = c2 - c1; en /= max(length(en), 1e-3);                       // across the seam, toward the neighbour
  float plate = step(1. - uPlateK, fract(h1 * 7.13)), plate2 = step(1. - uPlateK, fract(h2 * 7.13));
  // the seam's life: open, orange, dull red, black, lemon skin, gold. It is a smooth field over the lake (not a hash of the
  // two plates), so width and glow run unbroken through every junction and a wide seam never stops dead at a straight cut
  float age = fract(fb2(P.xz * (0.26 / uS) + 7.) * 3.4 + t * 0.016);
  float wv = 0.3 + 1.7 * smoothstep(0., 0.05, age) * (1. - smoothstep(0.05, 0.6, age)) + 0.5 * vn2(P.xz * 0.11 + 3.);
  // the plate that splits under us at the start (uSplit: x, z, opening)
  float sx = abs(P.x - uSplit.x - 2.6 * sin(P.z * 0.11) - 0.9 * sin(P.z * 0.47));
  float sw = uSplit.z * 2.1 * smoothstep(-14., 6., P.z - uSplit.y) * (1. - smoothstep(60., 104., P.z - uSplit.y));
  float split = 1. - smoothstep(sw * 0.55, sw + 0.02, sx);
  float seam = max((1. - smoothstep(wv * 0.5, wv, edge)) * max(plate, plate2), split * step(0.02, sw));
  float isPlate = plate * (1. - seam);
  float hot = max(smoothstep(0., 0.04, age) * (1. - smoothstep(0.1, 0.42, age)) * (1. - smoothstep(wv * 0.2, wv * 0.8, edge)) * max(plate, plate2), split * (1. - smoothstep(sw * 0.2, sw * 0.9 + 1e-3, sx)));
  // crust: gold with lemon skins, mottled, raised rims lit from the sun side
  float m1 = fb2(P.xz * 0.21 + h1 * 40.), m2 = fb2(P.xz * 1.9), rim = 1. - smoothstep(wv, wv + 0.9, edge);
  vec3 alb = mix(uCrust, uLemon, smoothstep(0.45, 0.75, m1 + 0.3 * fract(h1 * 3.3) - 0.2)) * (0.66 + 0.3 * m1 + 0.14 * (m2 - 0.5) * near);
  alb *= 0.85 + 0.3 * fract(h1 * 9.7);
  alb = mix(alb, uLemon * 0.8, rim * 0.35);
  vec3 N = normalize(vec3((fract(h1 * 5.1) - 0.5) * 0.1 + (m1 - 0.5) * 0.12 - en.x * rim * 0.55, 1., (fract(h1 * 8.3) - 0.5) * 0.1 + (m2 - 0.5) * 0.1 * near - en.y * rim * 0.55));
  float sy = max(uSun.y, 0.07);
  float key = uSunK * clamp(mix(1., dot(N, uSun) / sy, 0.8), 0., 2.) * domeSun(P + vec3(0., 12., 0.));
  vec3 cPlate = moonLit(alb, N, P, 0., key);
  // melt: black glass with the bell, the jet and the sun in it
  vec3 Nm = normalize(vec3((vn2(P.xz * 0.13 + t * 0.03) - 0.5) * 0.012, 1., (vn2(P.zx * 0.13 - t * 0.025) - 0.5) * 0.012));
  vec3 R = reflect(-V, Nm); R.y = abs(R.y);
  float fr = 0.05 + 0.95 * pow(1. - max(V.y, 0.), 5.);
  vec3 refl = bell(P, R);
  vec2 toO = -P.xz / max(length(P.xz), 1.), rh = R.xz / max(length(R.xz), 1e-3);
  float jx = toO.x * rh.y - toO.y * rh.x, jel = R.y / max(length(R.xz), 1e-3) * length(P.xz);
  refl += vec3(1.5, 1.6, 1.8) * exp(-jx * jx * 9e4) * step(0., dot(toO, rh)) * step(jel, ${APEX}.) * 0.8;
  float sd = max(dot(R, uSun), 0.); float sg = pow(sd, 900.);
  refl += vec3(1., 0.95, 0.85) * sg * 9.;
  vec3 cMelt = vec3(0.05, 0.027, 0.014) + refl * fr * 2.3;
  // seam colour by age
  vec3 cSeam = mix(uSeam * vec3(0.3, 0.12, 0.1), vec3(0.02, 0.016, 0.014), smoothstep(0.42, 0.58, age));
  cSeam = mix(cSeam, uLemon * 0.5, smoothstep(0.6, 0.78, age));
  cSeam = mix(cSeam, uCrust * 0.6, smoothstep(0.82, 0.98, age));
  cSeam = mix(cSeam, uSeam * 0.25, split);
  float flick = 0.85 + 0.15 * vn2(P.xz * 0.8 + t * 0.6);
  cSeam += uSeam * 1.6 * hot * flick + vec3(1., 0.85, 0.5) * hot * hot * 0.5;
  vec3 c = mix(cMelt, cPlate, isPlate);
  c = mix(c, cSeam, seam);
  c += uSeam * 0.1 * rim * isPlate * (1. - smoothstep(0.0, 0.35, age));        // glow licking the plate edge beside a hot seam
  // seen from kilometres off (the climb) the plates are finer than a pixel: settle to their mean tone, never a speckle
  vec3 cFar = mix(vec3(0.02, 0.019, 0.022), moonLit(mix(uCrust, uLemon, 0.3) * 0.8, vec3(0., 1., 0.), P, 0., uSunK * domeSun(P + vec3(0., 12., 0.))), uPlateK * 0.8) + uSeam * 0.03;
  c = mix(c, cFar * (0.9 + 0.2 * vn2(P.xz * 0.006)), smoothstep(1300., 2500., dist));
  gl_FragColor = vec4(c, 1.);
}`;
    const LAKE_V = /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
    const splitAt = pAt(0.03), splitU = { value: V3(380, splitAt.z + 22, 0) };
    const lakeU = (S, plateK, split) => ({ uCrust: { value: col(chem.crust) }, uLemon: { value: col(chem.lemon) }, uSeam: { value: col(chem.seam) },
      uGoldT: { value: col('#FFF0C8') }, uBlueT: { value: col(pal[4]) }, uSplit: split ? splitU : { value: V3(0, 0, 0) }, uS: { value: S }, uPlateK: { value: plateK } });
    {
      const g1 = new THREE.PlaneGeometry(1500, 1240, 30, 62).rotateX(-Math.PI / 2).translate(LAKE.x, LAKE.y, LAKE.z);
      scene.add(new THREE.Mesh(g1, solidMat(LAKE_V, LAKE_F, lakeU(12, 0.72, true))));
      const g2 = new THREE.RingGeometry(60, 345, 48, 8).rotateX(-Math.PI / 2).translate(0, CAL_Y, 0);
      const g3 = new THREE.PlaneGeometry(270, 900, 6, 20).rotateX(-Math.PI / 2).translate(335, CHAN_Y, -1685);      // the channel's melt: the same drifting plates, smaller
      scene.add(new THREE.Mesh(g3, solidMat(LAKE_V, LAKE_F, lakeU(6.5, 0.62, false))));
      scene.add(new THREE.Mesh(g2, solidMat(LAKE_V, LAKE_F, lakeU(21, 0.7, false))));
    }

    // ---------- instanced solids: one shader for boulders, chimneys, frost flowers, machines ----------
    const OBJ_V = /* glsl */`
attribute vec3 color; attribute float aF; uniform float uTime, uBreath, uSpin;
varying vec3 vW, vN, vC, vL; varying float vF, vBy;
void main(){
  vC = color; vF = aF; vec3 p = position; vL = position; vBy = 0.;
  #ifdef USE_INSTANCING
    mat4 m = modelMatrix * instanceMatrix; vBy = m[3].y;
    float ph = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
    p *= 1. - uBreath * (0.5 + 0.5 * sin(uTime * (0.25 + 0.3 * ph) + ph * 6.2831));      // frost flowers sublime and feather back
  #else
    mat4 m = modelMatrix;
    float ph = 0.;
  #endif
  vec3 nn = normal;
  #ifdef WHEEL
    float ca = cos(uSpin + ph * 6.), sa = sin(uSpin + ph * 6.);
    p.yz = vec2(p.y * ca - p.z * sa, p.y * sa + p.z * ca); nn.yz = vec2(nn.y * ca - nn.z * sa, nn.y * sa + nn.z * ca);
    float sq = max(-1.62 - p.y, 0.); p.y = max(p.y, -1.62); p.x *= 1. + sq * 0.55 + 0.14 * (1. - smoothstep(-1.62, -0.7, p.y)); vBy -= 1.62;             // the balloon flattens where it bears
  #endif
  #ifdef MACHINE
    float mh = max(p.y - 9.2, 0.) / 10.; float sw = sin(uTime * 0.9 + ph * 6.2831) * 0.14 + sin(uTime * 2.3 + ph * 11.) * 0.03;
    p.z += mh * mh * 10. * sw; p.x += mh * mh * 10. * sw * 0.4;                              // the whip mast sways 8 degrees
  #endif
  vec4 w = m * vec4(p, 1.); vW = w.xyz; vN = normalize(mat3(m) * nn + vec3(0., 1e-5, 0.));
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
    const OBJ_F = /* glsl */`
${G_LIT}
uniform vec3 uSnow, uGold, uDustC; uniform float uCap, uEmis, uBaseY;
varying vec3 vW, vN, vC, vL; varying float vF, vBy;
void main(){
  vec3 P = vW, N = normalize(vN), V = normalize(cameraPosition - P + vec3(0., 1e-4, 0.));
  if (!gl_FrontFacing) N = -N;
  float r = length(P.xz), g1 = fb2(P.xz * 0.9 + P.y * 0.7), g2 = fb2(P.xz * 4.7 - P.y * 3.1);
  float inRing = smoothstep(2080., 2220., r) * (1. - smoothstep(2500., 2640., r));
  float cap = smoothstep(0.35, 0.75, N.y + 0.5 * (g1 - 0.5)) * mix(0.3, 1., inRing) + smoothstep(0.2, 0.6, N.z * 0.6 + N.x * 0.7 + 0.5 * (g1 - 0.5)) * 0.6;
  float frost = clamp(max(vF, cap * uCap), 0., 1.);
  vec3 alb = vC * (0.78 + 0.3 * (g1 - 0.5) + 0.2 * (g2 - 0.5));
  #if defined(MACHINE) || defined(WHEEL)
    float fwL = length(fwidth(vL)) + 1e-4, plain = step(vF, 0.5);
  #endif
  #ifdef WHEEL
    // balloon tyre: a dark diamond lattice of cords over a pale quilted skin (in the wheel's own frame, so it turns), hoop ribs, a dark hub
    float wr = length(vL.yz), wa = atan(vL.z, vL.y + 1e-5) / 6.2831853, tyre = smoothstep(0.86, 0.96, wr);
    float lu = wa * 16., lv = vL.x * 1.45, fl = fwL * (16. / (6.2831853 * max(wr, 0.6)) + 1.45);
    float d1 = abs(fract(lu + lv) - 0.5), d2 = abs(fract(lu - lv) - 0.5), kL = 1. - smoothstep(0.12, 0.4, fl);
    float cord = mix(0.28, max(smoothstep(0.42 - fl, 0.46, d1), smoothstep(0.42 - fl, 0.46, d2)), kL);
    float hoop = (1. - smoothstep(0.05, 0.08 + fwL * 2., abs(fract(vL.x * 2.4 + 0.5) - 0.5))) * (1. - smoothstep(0.03, 0.12, fwL));
    float quilt = mix(0.5, (1. - 2. * d1) * (1. - 2. * d2), kL);
    alb = vC * (0.82 + 0.34 * quilt) * (1. - 0.74 * max(cord, hoop * 0.8));
    vec3 hubC = vec3(0.1, 0.12, 0.12) * (0.7 + 0.9 * step(0.5, fract(wa * 6.)) * step(0.3, wr) + 0.8 * (1. - smoothstep(0.2, 0.26, wr)));
    alb = mix(hubC, alb, tyre);
    alb = mix(alb, uDustC * (0.75 + 0.3 * g1), (1. - smoothstep(0.1, 1.5, P.y - vBy + 0.5 * (g1 - 0.5))) * 0.55);
  #endif
  #ifdef MACHINE
    // pressure hull: riveted bands, panel seams, a ribbed hopper, a louvred fin; dust only round the skirts
    vec3 q = vL; float hr = length(vec2(q.x, q.y - 5.35)), ha = atan(q.x, q.y - 5.35 + 1e-5) / 6.2831853;
    float onHull = (1. - smoothstep(0.06, 0.14, abs(hr - 2.25))) * step(-2.95, q.z) * step(q.z, 1.75) * plain;
    float zb = abs(fract((q.z + 2.5) / 1.3 + 0.5) - 0.5) * 1.3, kD = 1. - smoothstep(0.05, 0.16, fwL);
    vec2 rv = vec2(abs(zb - 0.26), (fract(ha * 36.) - 0.5) * 0.393);
    float rivet = (1. - smoothstep(0.07, 0.085 + fwL, length(rv))) * onHull * kD;
    float seamL = (1. - smoothstep(0.012, 0.02 + fwL, abs(fract(ha * 6. + 0.08) - 0.5) * 2.36)) * step(0.3, zb) * onHull * kD;
    float pid = h21(vec2(floor(ha * 6. + 0.58), floor((q.z + 2.5) / 1.3 + 0.5)));
    alb = vC * (0.92 + 0.1 * (g2 - 0.5)) * (1. + 0.1 * (pid - 0.5) * onHull);
    alb *= (1. - 0.5 * seamL) * (1. + rivet * (0.9 * smoothstep(-0.02, 0.03, rv.y) - 0.55));
    float onBox = step(3.5, q.y) * step(q.y, 5.7) * step(q.z, -2.98) * step(1.9, max(abs(q.x), -q.z - 4.5)) * plain;
    float ribB = step(0.72, fract((abs(q.x) > 2.1 ? q.z : q.x) * 1.9)) * onBox;
    float louv = step(0.6, fract(q.y * 3.2)) * step(7.5, q.y) * step(q.y, 9.7) * step(abs(q.x), 0.1) * plain;
    alb *= 1. - 0.34 * mix(0.28, ribB, kD) - 0.52 * mix(0.4, louv, kD);
    alb *= 1. + 0.5 * step(0.5, fract(q.y * 3.2)) * step(fract(q.y * 3.2), 0.6) * step(7.5, q.y) * step(q.y, 9.7) * step(abs(q.x), 0.1) * plain * kD;      // a lit lip on every radiator slat
    // the hopper's rear face: a hatch with a rim and a handle, a ladder, a row of rivets under the rim; its flanks: a seam and rivets
    float rear = step(q.z, -6.4) * step(3.45, q.y) * step(q.y, 5.75) * step(abs(q.x), 2.2) * plain;
    float hd = max(abs(q.x - 0.35) - 0.8, abs(q.y - 4.5) - 0.78);
    float hatch = (1. - smoothstep(0.035, 0.05 + fwL, abs(hd))) + (1. - smoothstep(0.05, 0.07 + fwL, max(abs(q.x - 0.9) - 0.03, abs(q.y - 4.5) - 0.22)));
    float lad = max((1. - smoothstep(0.03, 0.045 + fwL, abs(abs(q.x + 1.35) - 0.3))), step(0.78, fract(q.y * 3.1)) * step(abs(q.x + 1.35), 0.3)) * step(q.y, 5.6);
    vec2 rv2 = vec2((fract(q.x * 2.6) - 0.5) / 2.6, q.y - 5.52);
    float flank = step(2.1, abs(q.x)) * step(3.45, q.y) * step(q.y, 5.75) * step(q.z, -2.98) * step(-6.44, q.z) * plain;
    vec2 rv3 = vec2((fract(q.z * 2.6) - 0.5) / 2.6, q.y - 5.52);
    float riv2 = (1. - smoothstep(0.06, 0.075 + fwL, length(rv2))) * rear + (1. - smoothstep(0.06, 0.075 + fwL, length(rv3))) * flank;
    float seam2 = (1. - smoothstep(0.02, 0.03 + fwL, abs(q.y - 4.4))) * flank;
    alb *= 1. - kD * (0.55 * clamp(hatch, 0., 1.) * rear + 0.6 * lad * rear + 0.5 * seam2);
    alb *= mix(1., 0.86, step(hd, 0.) * rear * kD) * (1. + riv2 * kD * (0.9 * smoothstep(-0.02, 0.03, rv2.y) - 0.55));
    alb = mix(alb, uDustC * (0.75 + 0.3 * g1), (1. - smoothstep(0.4, 3.2, P.y - vBy + 1.2 * (g1 - 0.5))) * 0.5 * plain);
  #endif
  alb = min(mix(alb, uSnow * (0.7 + 0.12 * g2), frost * step(vF, 0.99) + step(0.99, vF) * 0.), vec3(0.78));
  float ndl = dot(N, uSun);
  float key = mix(smoothstep(-0.02, 0.1, ndl) * max(ndl, 0.), clamp((ndl + 0.55) / 1.55, 0., 1.), frost * 0.5) * domeSun(P) * 1.05;
  #if !defined(MACHINE) && !defined(WHEEL)
    float ice = step(0.99, vF), nvI = abs(dot(N, V));
    key = mix(key, (0.62 + 0.5 * abs(ndl)) * domeSun(P), ice); alb = mix(alb, min(alb * 1.25, vec3(0.8)), ice);
  #endif
  vec3 c = moonLit(alb, N, P, frost, key);
  #if !defined(MACHINE) && !defined(WHEEL)
    c += uGold * 0.3 * ice * (1. - nvI) * (1. - nvI) * step(0.01, key);
  #endif
  #if defined(MACHINE) || defined(WHEEL)
    c += alb * uBounce * uSunK * (0.34 - 0.3 * N.y) * (1. - smoothstep(0., 12., P.y - vBy));   // sunlit ground lighting the flanks from below
  #endif
  vec3 H = normalize(uSun + V + vec3(0., 1e-3, 0.)); float sp = max(dot(N, H), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  c += uGold * sp * sp * frost * 0.5 * step(0., ndl);
  c += vC * uEmis * step(1.5, vF);
  gl_FragColor = vec4(c, 1.);
}`;
    const objU = (cap, breath = 0) => ({ uSnow: { value: col(pal[1]) }, uGold: { value: col('#FFF0C8') }, uCap: { value: cap }, uEmis: { value: 0 }, uBreath: { value: breath }, uDustC: { value: col(pal[0]) }, uBaseY: { value: 1.5 } });
    const rockMat = solidMat(OBJ_V, OBJ_F, objU(1));
    const dummy = new THREE.Object3D(), tmpM = new THREE.Matrix4(), tmpM2 = new THREE.Matrix4(), shadows = [];           // shadows: { x, z, y, h, w } cast away from the sun (+X)
    const cRock = col(pal[0]).lerp(col(chem.ochre), 0.5).multiplyScalar(0.8), cRockD = col(pal[2]).lerp(col(pal[6]), 0.35);
    const rockGeo = (det, seedK) => {
      const g = new THREE.IcosahedronGeometry(1, det), p = g.attributes.position, n = p.count, c = new Float32Array(n * 3), f = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const d = 1 + 0.34 * noise.n3(x * 1.3 + seedK, y * 1.3, z * 1.3) + 0.16 * noise.n3(x * 3.1, y * 3.1 + seedK, z * 3.1);
        x *= d; z *= d; y = Math.max(y * d * 0.8, -0.32) + 0.3;
        p.setXYZ(i, x, y, z);
        const t = 0.5 + 0.5 * noise.n3(x * 2 + seedK, y * 2, z * 2);
        tmpC.copy(cRockD).lerp(cRock, t); c[i * 3] = tmpC.r; c[i * 3 + 1] = tmpC.g; c[i * 3 + 2] = tmpC.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setAttribute('aF', new THREE.BufferAttribute(f, 1));
      g.deleteAttribute('normal'); g.deleteAttribute('uv');
      const gm = mergeVertices(g, 1e-3); g.dispose(); gm.computeVertexNormals(); return gm;
    };
    const rocksNear = [], nNear = Math.round(400 * detail * dens), nFar = Math.round(380 * detail * dens);
    {
      const rr = rng.fork ? rng.fork('rocks') : rng, pp = V3(), tt = V3();
      const place = async (count, det, latMin, latMax, big, u0 = 0, u1 = 0) => {
        const mesh = new THREE.InstancedMesh(rockGeo(det, rr.range(0, 50)), rockMat, count); let k = 0, guard = 0;
        while (k < count && guard++ < count * 6) {
          if (guard % 120 === 0) await ctx.yield();
          const u = u1 > 0 ? rr.range(u0, u1) : (big ? rr.range(0.1, 0.76) : (rr.chance(0.6) ? rr.range(0.105, 0.3) : rr.range(0.3, 0.76)));
          PA(u, pp); TA(u, tt);
          const lat = rr.range(latMin, latMax) * (rr.chance(0.5) ? 1 : -1) * (u > 0.3 && !big && u1 === 0 ? 1.8 : 1);
          const x = pp.x - tt.z * lat, z = pp.z + tt.x * lat, y = heightAt(x, z);
          if (lakeD(x, z) < 1.04 || (Math.hypot(x, z) < crestR(Math.atan2(z, x)) - 60) || Math.abs(x - 394) < 6 || y < 0.3) continue;
          const sz = big ? rr.range(1.5, 6) * (rr.chance(0.2) ? 1.6 : 1) : Math.min(0.5 + 3.2 * Math.pow(rr(), 2.2), 0.42 * (Math.abs(lat) - 3.5));
          if (sz < 0.35 || path.distanceTo(x, y + sz, z) < 6.5 + sz) continue;
          dummy.position.set(x, y, z); dummy.rotation.set(rr.range(-0.3, 0.3), rr.range(0, TAU), rr.range(-0.3, 0.3));
          dummy.scale.set(sz * rr.range(0.8, 1.3), sz * rr.range(0.6, 1.1), sz * rr.range(0.8, 1.3)); dummy.updateMatrix();
          mesh.setMatrixAt(k++, dummy.matrix);
          shadows.push({ x, z, y, h: dummy.scale.y * 1.15, w: sz * 1.9 });
          if (!big) rocksNear.push({ x, z, y, sz });
        }
        mesh.count = k; mesh.frustumCulled = false; scene.add(mesh);
      };
      await place(nNear, 1, 6.5, 34, false);
      await ctx.yield();
      await place(nFar, 1, 34, 420, true);
      await ctx.yield();
      await place(22, 1, 8, 24, false, 0.675, 0.745);      // fallen blocks on the crest we skim
      await ctx.yield();
    }

    // ---------- chimney fields round the side vents: spires 15 to 40 m ----------
    const spires = [];
    {
      const cr = rng.fork ? rng.fork('chimneys') : rng, nS = 10, nR = 10, pos = [], colr = [], fr = [], idx = [];
      const cBase = col(pal[2]).multiplyScalar(0.7), cMid = col(chem.ochre), cTip = col(chem.lemon);
      for (let j = 0; j <= nR; j++) for (let i = 0; i <= nS; i++) {
        const t = j / nR, a = (i / nS) * TAU;
        let r = 0.2 * Math.pow(1 - t, 1.6) + 0.045 * (1 - t) + 0.012;
        r *= 1 + 0.35 * noise.n3(Math.cos(a) * 1.5, Math.sin(a) * 1.5, t * 5) + 0.16 * Math.sin(t * 23 + a * 2);
        if (j === nR) r = 0.004;
        pos.push(Math.cos(a) * r + 0.03 * Math.sin(t * 7), t, Math.sin(a) * r + 0.03 * Math.cos(t * 5));
        tmpC.copy(cBase).lerp(cMid, smoothstep(0.05, 0.5, t)).lerp(cTip, smoothstep(0.55, 0.95, t)).multiplyScalar(0.8 + 0.2 * Math.sin(t * 31 + a));
        colr.push(tmpC.r, tmpC.g, tmpC.b); fr.push(smoothstep(0.6, 1, t) * 0.8);
      }
      for (let j = 0; j < nR; j++) for (let i = 0; i < nS; i++) { const a = j * (nS + 1) + i, b = a + 1, c = a + nS + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
      g.setAttribute('aF', new THREE.Float32BufferAttribute(fr, 1)); g.setIndex(idx); g.computeVertexNormals();
      for (const v of vents) {
        const n = cr.int(5, 9);
        for (let i = 0; i < n; i++) {
          const a = cr.range(0, TAU), d = i === 0 ? 0 : cr.range(7, 30), x = v.x + Math.cos(a) * d, z = v.z + Math.sin(a) * d;
          const h = (i === 0 ? cr.range(26, 40) : cr.range(15, 32)) * (v.puff === 2 ? 0.6 : 1), y = heightAt(x, z) - 0.5;
          if (path.distanceTo(x, y + h, z) < 22) continue;
          spires.push({ x, y, z, h, w: h * cr.range(0.55, 0.9), rot: cr.range(0, TAU), lean: cr.range(-0.07, 0.07) });
        }
        v.top = v.y + (spires.length ? spires[spires.length - 1].h * 0.5 : 10);
      }
      // the gate: two files of tall chimneys either side of the route where it runs low, the white jet standing between them
      for (const [z, lat, h] of [[-1284, 22, 38], [-1288, -18, 36], [-1262, -27, 30], [-1252, 24, 50], [-1226, -19, 46], [-1206, 30, 38], [-1188, -25, 54], [-1172, 21, 44], [-1140, -31, 40], [-1128, 34, 52], [-1345, 33, 30], [-1352, -30, 27]]) {
        const x = swingX(z) + lat, y = heightAt(x, z) - 0.5;
        spires.push({ x, y, z, h, w: h * cr.range(0.5, 0.7), rot: cr.range(0, TAU), lean: cr.range(-0.05, 0.05) });
      }
      const mesh = new THREE.InstancedMesh(g, solidMat(OBJ_V, OBJ_F, objU(0.5)), spires.length);
      spires.forEach((sp, i) => {
        dummy.position.set(sp.x, sp.y, sp.z); dummy.rotation.set(sp.lean, sp.rot, sp.lean * 0.7); dummy.scale.set(sp.w, sp.h, sp.w); dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix); shadows.push({ x: sp.x, z: sp.z, y: sp.y, h: sp.h, w: sp.w * 0.34, taper: 1 });
      });
      mesh.frustumCulled = false; scene.add(mesh);
      await ctx.yield();
    }

    // ---------- frost flowers: rosettes of lemon-white blades in every lee, along the ruts and the shore ----------
    {
      const fr2 = rng.fork ? rng.fork('flowers') : rng, pos = [], colr = [], ff = [], nB = 7;
      const cB = col(chem.lemon).lerp(col(pal[1]), 0.45).multiplyScalar(0.8), cT = col(pal[1]).multiplyScalar(0.86);
      for (let b = 0; b < nB; b++) {
        const a = (b / nB) * TAU + 0.3 * Math.sin(b * 5.1), el = 0.45 + 0.35 * Math.sin(b * 2.7), len = 0.75 + 0.25 * Math.sin(b * 3.3);
        const dx = Math.cos(a), dz = Math.sin(a), ce = Math.cos(el), se = Math.sin(el);
        const tip = [dx * ce * len, se * len, dz * ce * len], mid = [dx * ce * len * 0.42, se * len * 0.5, dz * ce * len * 0.42], w = 0.16 * len;
        const l = [mid[0] - dz * w, mid[1] - 0.05, mid[2] + dx * w], r = [mid[0] + dz * w, mid[1] - 0.05, mid[2] - dx * w];
        for (const tri of [[[0, 0, 0], l, tip], [[0, 0, 0], tip, r]]) tri.forEach((v, vi) => {
          pos.push(v[0], v[1], v[2]);
          const cc = v === tip ? cT : cB; colr.push(cc.r, cc.g, cc.b); ff.push(1);
        });
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
      g.setAttribute('aF', new THREE.Float32BufferAttribute(ff, 1)); g.computeVertexNormals();
      const count = Math.round(2300 * detail * dens), mesh = new THREE.InstancedMesh(g, solidMat(OBJ_V, OBJ_F, objU(0, 0.3), { side: THREE.DoubleSide }), count);
      let k = 0, guard = 0; const pp = V3(), tt = V3();
      while (k < count && guard++ < count * 5) {
        if (guard % 300 === 0) await ctx.yield();
        let x, z; const pick = fr2();
        if (pick < 0.5 && rocksNear.length) { const rk = fr2.pick(rocksNear), a = fr2.range(-0.6, 1.9), d = rk.sz * fr2.range(0.9, 2.2); x = rk.x + Math.cos(a) * d; z = rk.z + Math.sin(a) * d; }
        else if (pick < 0.72) { z = fr2.range(-2835, -2140); const tr = fr2.chance(0.6); x = (tr ? 394 : lerp(371, 414, smoothstep(-2300, -2150, z)) + lerp(24, 12, smoothstep(-2300, -2150, z)) * Math.sin(z / 230)) + (fr2.chance(0.5) ? 1 : -1) * (fr2.chance(0.4) ? fr2.range(0, 1.4) : fr2.range(3.7, 5.6)); }
        else { const cr2 = !fr2.chance(0.5), u = cr2 ? fr2.range(0.672, 0.745) : fr2.range(0.105, 0.3); PA(u, pp); TA(u, tt);
          const lat = (cr2 ? fr2.range(-22, 22) : fr2.range(-30, 30)) + fr2.gauss() * 4; x = pp.x - tt.z * lat; z = pp.z + tt.x * lat; }
        const y = heightAt(x, z); if (y < 0.25 || lakeD(x, z) < 1.01) continue;
        const patch = noise.n2(x * 0.045 + 9, z * 0.045); if (pick >= 0.72 && patch < -0.1) continue;
        const sz = fr2.range(0.7, 1.9) * (0.8 + 0.4 * smoothstep(-0.2, 0.6, patch)) * (y > 24 ? 2.1 : 1);
        dummy.position.set(x, y - 0.03, z); dummy.rotation.set(fr2.range(-0.2, 0.2), fr2.range(0, TAU), fr2.range(-0.2, 0.2)); dummy.scale.setScalar(sz); dummy.updateMatrix();
        mesh.setMatrixAt(k++, dummy.matrix);
      }
      mesh.count = k; mesh.frustumCulled = false; scene.add(mesh);
      await ctx.yield();
    }

    // ---------- razor shadows, four heights long: dark quads laid on the ground away from the sun ----------
    const shadowMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6, fog: false,
      uniforms: { uTint: { value: V3(0.4, 0.43, 0.47) } },
      vertexShader: /* glsl */`attribute vec3 aSeg; varying vec3 vS; varying vec2 vU;
void main(){ vS = aSeg; vU = uv;
  #ifdef USE_INSTANCING
    vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.);
  #else
    vec4 w = modelMatrix * vec4(position, 1.);
  #endif
  gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`uniform vec3 uTint; varying vec3 vS; varying vec2 vU;
void main(){ float u = mix(vS.x, vS.y, vU.x), v = abs(vU.y - 0.5) * 2.;
  float u2 = u * u, prof = mix(sqrt(max(1. - u2 * u2, 0.)), 1. - 0.86 * u, vS.z);
  float m = (1. - smoothstep(prof - 0.06, prof, v)) * (1. - smoothstep(0.985, 1., u));
  gl_FragColor = vec4(mix(vec3(1.), uTint, m), 1.); }`,
    });
    const shadowK = Math.min(1 / Math.tan(elR), 9);
    const addShadows = (list) => {
      const mats = [], segs = [];
      for (const sh of list) {
        const Lh = sh.h * shadowK, n = Math.max(1, Math.ceil(Lh / 22));
        for (let i = 0; i < n; i++) {
          const x0 = sh.x - sh.w * 0.25 + (Lh * i) / n, x1 = sh.x - sh.w * 0.25 + (Lh * (i + 1)) / n;
          const y0 = Math.max(heightAt(x0, sh.z), 0) + 0.1, y1 = Math.max(heightAt(x1, sh.z), 0) + 0.1;
          dummy.position.set(x0, y0, sh.z); dummy.rotation.set(0, 0, Math.atan2(y1 - y0, x1 - x0)); dummy.scale.set(Math.hypot(x1 - x0, y1 - y0), 1, sh.w); dummy.updateMatrix();
          mats.push(dummy.matrix.clone()); segs.push(i / n, (i + 1) / n, sh.taper || 0);
        }
      }
      const g = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0.5, 0, 0);
      g.setAttribute('aSeg', new THREE.InstancedBufferAttribute(new Float32Array(segs), 3));
      const mesh = new THREE.InstancedMesh(g, shadowMat, mats.length);
      mats.forEach((m, i) => mesh.setMatrixAt(i, m)); mesh.frustumCulled = false; mesh.renderOrder = 1; scene.add(mesh);
      return mesh;
    };
    await ctx.yield();
    if (!grazing) addShadows(shadows);
    await ctx.yield();

    // ---------- the harvesters: balloon-wheeled snow trucks, a whip mast with lamps, parabolic dust ----------
    const mergeParts = (parts) => {                       // parts: [geometry, colour, frost flag, matrix?]
      const pos = [], nor = [], colr = [], ff = [];
      for (const [g0, c, f, m] of parts) {
        const g = g0.index ? g0.toNonIndexed() : g0; if (m) g.applyMatrix4(m);
        const p = g.attributes.position.array, n = g.attributes.normal.array;
        for (let i = 0; i < p.length; i += 3) { pos.push(p[i], p[i + 1], p[i + 2]); nor.push(n[i], n[i + 1], n[i + 2]); colr.push(c.r, c.g, c.b); ff.push(f); }
        g.dispose(); if (g0 !== g) g0.dispose();
      }
      const out = new THREE.BufferGeometry();
      out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      out.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); out.setAttribute('aF', new THREE.Float32BufferAttribute(ff, 1));
      return out;
    };
    const M4 = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V3(sx, sy, sz));
    const hullGeo = (() => {
      const hull = col(chem.hull).multiplyScalar(0.8), band = col(chem.hull).multiplyScalar(0.42), hopC = col(chem.hull).multiplyScalar(0.62), dark = col('#141a1e'), steel = col('#8f9690').multiplyScalar(0.6);
      const white = col(pal[1]).multiplyScalar(0.84), ver = col(pal[2]), lampC = col('#DCEBFF'), amber = col('#FFB060');
      const parts = [
        [new THREE.BoxGeometry(4.4, 0.9, 11), steel, 0, M4(0, 2.7, 0)],
        [new THREE.CapsuleGeometry(2.25, 4.2, 5, 18), hull, 0, M4(0, 5.35, -0.6, Math.PI / 2)],
        [new THREE.SphereGeometry(2.1, 16, 10), hull, 0, M4(0, 6.95, 3.5, 0, 0, 0, 1, 1.12, 1.12)],
        [new THREE.SphereGeometry(2.14, 16, 3, 0.25, Math.PI - 0.5, 1.02, 0.36), dark, 0, M4(0, 6.95, 3.5, 0, 0, 0, 1, 1.12, 1.12)],
        [new THREE.BoxGeometry(5.4, 0.25, 2.6), steel, 0, M4(0, 1.3, 6.9, -0.5)], [new THREE.BoxGeometry(0.2, 1.7, 2.6), steel, 0, M4(2.7, 1.9, 6.6, -0.5)],
        [new THREE.BoxGeometry(0.2, 1.7, 2.6), steel, 0, M4(-2.7, 1.9, 6.6, -0.5)], [new THREE.SphereGeometry(1, 10, 6), white, 1, M4(0, 1.75, 6.4, 0, 0, 0, 2.4, 0.8, 1.1)],
        [new THREE.BoxGeometry(4.3, 2.3, 3.5), hopC, 0, M4(0, 4.6, -4.7)], [new THREE.SphereGeometry(1, 12, 7), white, 1, M4(0, 5.7, -4.7, 0, 0, 0, 2.05, 1.25, 1.65)],
        [new THREE.BoxGeometry(0.16, 2.3, 3.4), steel, 0, M4(0, 8.6, -0.9)], [new THREE.BoxGeometry(0.24, 0.22, 3.6), ver, 0, M4(0, 9.8, -0.9)],
        [new THREE.BoxGeometry(0.24, 2.4, 0.2), ver, 0, M4(0, 8.65, -2.65)], [new THREE.BoxGeometry(0.24, 2.4, 0.2), ver, 0, M4(0, 8.65, 0.85)],
        [new THREE.CylinderGeometry(0.06, 0.15, 10, 5), steel, 0, M4(1.3, 14, 1.6)],
        [new THREE.SphereGeometry(0.34, 8, 6), lampC, 2, M4(1.3, 19.1, 1.6)], [new THREE.SphereGeometry(0.17, 6, 4), amber, 2, M4(1.3, 16.2, 1.6)],
        [new THREE.SphereGeometry(0.17, 6, 4), amber, 2, M4(1.3, 12.8, 1.6)],
        [new THREE.BoxGeometry(1.5, 0.5, 0.2), lampC, 2, M4(0, 5.2, 5.9)],
      ];
      for (let i = 0; i < 4; i++) parts.push([new THREE.TorusGeometry(2.31, 0.1, 5, 18), band, 0, M4(0, 5.35, -2.5 + i * 1.3)]);
      for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) parts.push([new THREE.CylinderGeometry(0.28, 0.28, 1.5, 6), dark, 0, M4(sx * 2.5, 2.2, -4 + i * 4, 0, 0, Math.PI / 2)]);
      for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) {
        parts.push([new THREE.BoxGeometry(1.9, 0.12, 3.5), steel, 0, M4(sx * 3.25, 4.05, -4 + i * 4)]);
        parts.push([new THREE.BoxGeometry(0.12, 0.9, 0.12), dark, 0, M4(sx * 2.45, 3.6, -4 + i * 4)]);
      }
      for (const sx of [-1, 1]) {
        parts.push([new THREE.CapsuleGeometry(0.42, 3.4, 3, 8), white, 0, M4(sx * 2.42, 3.75, -0.7, Math.PI / 2)]);
        parts.push([new THREE.BoxGeometry(0.5, 0.5, 0.4), steel, 0, M4(sx * 1.55, 4.1, 5.35)], [new THREE.BoxGeometry(0.34, 0.34, 0.1), lampC, 2, M4(sx * 1.55, 4.1, 5.58)]);
        parts.push([new THREE.BoxGeometry(0.07, 0.07, 5.2), steel, 0, M4(sx * 1.1, 7.95, -0.6)]);
        for (let i = 0; i < 4; i++) parts.push([new THREE.BoxGeometry(0.07, 0.42, 0.07), steel, 0, M4(sx * 1.1, 7.72, -3 + i * 1.6)]);
      }
      for (let i = 0; i < 7; i++) parts.push([new THREE.ConeGeometry(0.16, 0.7, 4), dark, 0, M4(-2.25 + i * 0.75, 0.75, 8.25, 1.1)]);
      parts.push([new THREE.BoxGeometry(4.6, 0.14, 3.8), ver, 0, M4(0, 5.78, -4.7)], [new THREE.BoxGeometry(4.0, 0.2, 3.2), band, 0, M4(0, 5.8, -4.7)]);
      parts.push([new THREE.BoxGeometry(0.3, 0.3, 1.6), dark, 0, M4(0, 2.3, -6.3)]);
      return mergeParts(parts);
    })();
    await ctx.yield();
    const wheelGeo = (() => {
      // balloon tyre: a fat lathe profile round the axle (X), 4 m across and 2.1 m wide, with a recessed hub
      const prof = [new THREE.Vector2(0.001, 0.62), new THREE.Vector2(0.5, 0.66), new THREE.Vector2(0.84, 0.74)];
      for (let i = 0; i <= 7; i++) { const t = (0.5 - i / 7) * Math.PI * 0.94; prof.push(new THREE.Vector2(0.84 + 1.16 * Math.pow(Math.cos(t), 0.62), 1.05 * Math.sin(t))); }
      prof.push(new THREE.Vector2(0.84, -0.74), new THREE.Vector2(0.5, -0.66), new THREE.Vector2(0.001, -0.62));
      const g = new THREE.LatheGeometry(prof.reverse(), 22).rotateZ(-Math.PI / 2);
      const n = g.attributes.position.count, c = new Float32Array(n * 3), w1 = col(pal[1]).multiplyScalar(0.8);
      for (let i = 0; i < n; i++) { c[i * 3] = w1.r; c[i * 3 + 1] = w1.g; c[i * 3 + 2] = w1.b; }
      g.deleteAttribute('uv');
      g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.setAttribute('aF', new THREE.BufferAttribute(new Float32Array(n), 1));
      return g;
    })();
    await ctx.yield();
    const nFarH = cast === 'stakes' ? 0 : Math.max(2, Math.round(5 * detail)), nH = nHarv + nFarH;
    const harv = [];
    for (let i = 0; i < nHarv; i++) harv.push({ x: 394, lag: i * 34, tilt: 0, far: false });
    const camZ14 = pAt(0.14).z, camZ15 = pAt(0.15).z, camZ165 = pAt(0.165).z;
    if (cast === 'halted') { harv[1].lag = 19; harv[1].tilt = 0.09; harv[2].lag = camZ165 - camZ15 - 3; harv[3].lag = camZ165 - camZ14 - 1; }
    const passIdx = nHarv >= 4 ? nHarv - 2 : Math.max(nHarv - 1, 0);            // the machine 12 m ahead of us at u 0.15
    for (let i = 0; i < nFarH; i++) { const a = -Math.PI / 2 + 0.55 + i * 0.13 + rng.range(-0.03, 0.03), r = rng.range(2240, 2440); harv.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, far: true, yaw: -a + Math.PI, tilt: 0 }); }
    const machMat = solidMat(OBJ_V, OBJ_F, objU(0.25), { defines: { MACHINE: 1 } });
    machMat.uniforms.uEmis.value = 7;
    const wheelMat = solidMat(OBJ_V, OBJ_F, { ...objU(0.15), uSpin: { value: 0 } }, { defines: { WHEEL: 1 } });
    let hullMesh = null, wheelMesh = null, hShadow = null;
    if (nH > 0) {
      hullMesh = new THREE.InstancedMesh(hullGeo, machMat, Math.max(nHarv, 1)); hullMesh.count = nHarv;
      const hullC = col(chem.hull).multiplyScalar(0.8), farGeo = mergeParts([
        [new THREE.BoxGeometry(5.6, 3.6, 11), col('#8f9690').multiplyScalar(0.6), 0, M4(0, 2.4, 0)], [new THREE.CapsuleGeometry(2.25, 6.5, 2, 8), hullC, 0, M4(0, 5.35, 0.4, Math.PI / 2)],
        [new THREE.CylinderGeometry(0.1, 0.16, 10, 4), hullC, 0, M4(1.3, 14, 1.6)], [new THREE.SphereGeometry(0.4, 6, 4), col('#DCEBFF'), 2, M4(1.3, 19.1, 1.6)],
      ]);
      const farMesh = new THREE.InstancedMesh(farGeo, machMat, Math.max(nFarH, 1)); farMesh.count = nFarH; farMesh.frustumCulled = false; scene.add(farMesh);
      harv.forEach((h, i) => { if (!h.far) return; const y = Math.max(heightAt(h.x, h.z), 0);
        dummy.position.set(h.x, y, h.z); dummy.rotation.set(0, h.yaw, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); farMesh.setMatrixAt(i - nHarv, dummy.matrix); h.cy = y; }); wheelMesh = new THREE.InstancedMesh(wheelGeo, wheelMat, Math.max(nHarv, 1) * 6); wheelMesh.count = nHarv * 6;
      hullMesh.frustumCulled = wheelMesh.frustumCulled = false; scene.add(hullMesh, wheelMesh);
      const sg = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0.5, 0, 0), segs = new Float32Array(nH * 2 * 3);
      for (let i = 0; i < nH; i++) { segs.set([0, 1, 0.25], i * 6); segs.set([0, 1, 1], i * 6 + 3); }
      sg.setAttribute('aSeg', new THREE.InstancedBufferAttribute(segs, 3));
      hShadow = new THREE.InstancedMesh(sg, shadowMat, nH * 2); hShadow.frustumCulled = false; hShadow.renderOrder = 1; hShadow.visible = !grazing; scene.add(hShadow);
    }
    const convoyLead = (u) => (cast === 'halted' ? camZ165 + 14 : camZ15 + 14.3 + passIdx * 34 + 462 * (u - 0.15));      // 6 m/s at the pace we pass them
    const placeHarvesters = (u, time) => {
      if (!hullMesh) return;
      const lead = convoyLead(u);
      harv.forEach((h, i) => {
        const x = h.x, z = h.far ? h.z + (cast === 'halted' ? 0 : 0) : lead - h.lag, y = Math.max(heightAt(x, z), 0);
        h.cz = z; h.cy = y;
        dummy.position.set(x, y, z); dummy.rotation.set(-h.tilt, h.far ? h.yaw : 0, h.tilt * 0.4); dummy.scale.setScalar(1); dummy.updateMatrix();
        if (!h.far) hullMesh.setMatrixAt(i, dummy.matrix);
        if (!h.far) for (let w = 0; w < 6; w++) {
          tmpM2.copy(dummy.matrix).multiply(tmpM.makeTranslation((w % 2 ? 1 : -1) * 3.2, 1.64, -4 + Math.floor(w / 2) * 4));
          wheelMesh.setMatrixAt(i * 6 + w, tmpM2);
        }
        if (hShadow) {
          const Lh = 9.2 * shadowK, sx = h.far ? -SUN.x : 1;
          dummy.position.set(x - 2, y + 0.15, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(Lh, 1, 12); dummy.updateMatrix(); hShadow.setMatrixAt(i * 2, dummy.matrix);
          dummy.position.set(x + 1.3, y + 0.16, z + 1.6); dummy.scale.set(19.4 * shadowK, 1, 0.5); dummy.updateMatrix(); hShadow.setMatrixAt(i * 2 + 1, dummy.matrix);
        }
      });
      hullMesh.instanceMatrix.needsUpdate = true; wheelMesh.instanceMatrix.needsUpdate = true; if (hShadow) hShadow.instanceMatrix.needsUpdate = true;
      wheelMat.uniforms.uSpin.value = cast === 'halted' ? 0 : time * 3;
    };
    placeHarvesters(0, 0);
    if (cast === 'halted' && hullMesh) {      // the recovery: a tow bar from the lead machine's hitch to the nose of the one it is hauling, and a slack safety cable under it
      const z0 = harv[0].cz - 7.1, y0 = harv[0].cy + 2.3, z1 = harv[1].cz + 5.5, y1 = harv[1].cy + 2.6, len = Math.hypot(z0 - z1, y0 - y1);
      const parts = [[new THREE.BoxGeometry(0.22, 0.22, len), col('#8f9690').multiplyScalar(0.55), 0, M4(394, (y0 + y1) / 2, (z0 + z1) / 2, -Math.atan2(y0 - y1, z0 - z1))]];
      for (let k = 0; k < 8; k++) { const t0 = k / 8, t1 = (k + 1) / 8, sag = (t) => -1.5 * 4 * t * (1 - t), ya = lerp(y1, y0, t0) + sag(t0) - 0.3, yb = lerp(y1, y0, t1) + sag(t1) - 0.3, za = lerp(z1, z0, t0), zb = lerp(z1, z0, t1);
        parts.push([new THREE.BoxGeometry(0.1, 0.1, Math.hypot(zb - za, yb - ya)), col('#141a1e'), 0, M4(394.6, (ya + yb) / 2, (za + zb) / 2, -Math.atan2(yb - ya, zb - za))]); }
      const tow = new THREE.Mesh(mergeParts(parts), rockMat); tow.frustumCulled = false; scene.add(tow);
    }

    // ---------- wheel dust: every grain a clean parabola (p0 + v t - 0.9 t t), landing in a neat stripe ----------
    const resV = new THREE.Vector2();
    const ptU = { uPx: { value: 400 } };
    let dust = null;
    if (nHarv > 0 && cast !== 'halted') {
      const per = Math.round(440 * Math.max(detail, 0.7)), n = nHarv * 6 * per, aD = new Float32Array(n * 4), pz = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { aD[i * 4] = Math.floor(i / (6 * per)); aD[i * 4 + 1] = Math.floor(i / per) % 6; aD[i * 4 + 2] = rng(); aD[i * 4 + 3] = rng(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pz, 3)); g.setAttribute('aD', new THREE.BufferAttribute(aD, 4));
      const dU = { ...ptU, uTime: L.uTime, uHz: { value: new Float32Array(9) }, uHy: { value: new Float32Array(9) }, uCol: { value: col(chem.lemon).lerp(col(pal[0]), 0.35).multiplyScalar(grazing ? 0.45 : 1.05) } };
      dust = new THREE.Points(g, new THREE.ShaderMaterial({
        uniforms: dU, transparent: true, depthWrite: false, fog: false,
        vertexShader: /* glsl */`
attribute vec4 aD; uniform float uTime, uPx, uHz[9], uHy[9]; varying float vA;
void main(){
  int hi = int(aD.x + 0.5); float side = mod(aD.y, 2.) < 0.5 ? -1. : 1., row = floor(aD.y / 2.);
  // eight arcs per wheel (a fan): every grain rides one of them, p0 + v t - 0.9 t t, and lands on the stripe behind the wheel
  float arc = floor(aD.z * 6.), r3 = fract(aD.z * 6.), vy = 2.5 + 2.2 * (arc + 0.5) / 6. + 0.03 * (r3 - 0.5), T = vy / 0.9, tt = fract(uTime / T + aD.w) * T;
  float lat = (fract(arc * 0.37 + row * 0.21) - 0.5) * 1.4 + 0.05 * (r3 - 0.5);
  vec3 p = vec3(394. + side * 3.2 + lat * (0.6 + 0.12 * tt), uHy[hi] + 0.15 + vy * tt - 0.9 * tt * tt, uHz[hi] - 5.4 + row * 4. - 2.8 * tt);
  vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
  float sz = 0.05 + 0.07 * r3, px = sz * uPx / max(-mv.z, 0.5), cap = max(3.6, uPx * 0.0105);
  gl_PointSize = clamp(px, 1.6, cap); vA = min(1., px / 1.6) * (0.75 + 0.25 * r3) * smoothstep(0., 0.25, tt) * (1. - 0.5 * smoothstep(T * 0.8, T, tt));
}`,
        fragmentShader: /* glsl */`uniform vec3 uCol; varying float vA;
void main(){ vec2 q = gl_PointCoord - 0.5; float d = dot(q, q); if (d > 0.25) discard; gl_FragColor = vec4(uCol * (1.1 - 1.2 * d), vA * (1. - smoothstep(0.14, 0.25, d))); }`,
      }));
      dust.frustumCulled = false; dust.renderOrder = 2; scene.add(dust);
    }

    await ctx.yield();
    // ---------- side vents: child parasols (a pencil of grain that turns over and rains out in a small ribbed bell) ----------
    const puffing = vents.filter((v) => v.puff > 0), rareVent = vents.find((v) => v.puff === 2);
    const kidGeo = (() => {                                     // unit paraboloid of fall: uv = (azimuth 0..1, s 0..1)
      const nA = 48, nS = 12, pos = [], uv = [], idx = [];
      for (let j = 0; j <= nS; j++) for (let i = 0; i <= nA; i++) { const sv = 0.03 + 0.97 * (j / nS), a = (i / nA) * TAU; pos.push(Math.cos(a) * sv, 1 - sv * sv, Math.sin(a) * sv); uv.push(i / nA, sv); }
      for (let j = 0; j < nS; j++) for (let i = 0; i < nA; i++) { const a = j * (nA + 1) + i, b = a + 1, c = a + nA + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      return g;
    })();
    const kidInfo = new Float32Array(puffing.length * 4);       // period, phase, gain, ribs
    puffing.forEach((v, i) => {
      const r1 = rng.range(34, 44), h1 = rng.range(60, 76), p1 = rng.range(9, 14);
      v.R = v.R || (v.puff === 2 ? 150 : (v.puff === 3 ? 72 : r1)); v.H = v.H || (v.puff === 2 ? 180 : (v.puff === 3 ? 98 : h1)); v.per = v.puff === 2 ? 11 : (v.puff === 3 ? 9 : p1);
      kidInfo.set([v.per, rng(), v.gain || (v.puff === 2 ? 2.6 : (v.puff === 3 ? 3.2 : 1)), v.puff === 2 ? 36 : (v.puff === 3 ? 28 : 16)], i * 4);
    });
    const kidU = { uTime: L.uTime, uSun: L.uSun, uGoldT: { value: col('#FFF0C8') }, uBlueT: { value: col(pal[4]) }, uG: { value: 1 }, uKidIn: { value: 0 } };
    kidGeo.setAttribute('aK', new THREE.InstancedBufferAttribute(kidInfo, 4));
    const kids = new THREE.InstancedMesh(kidGeo, new THREE.ShaderMaterial({
      uniforms: kidU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`attribute vec4 aK; varying vec3 vW, vN; varying vec2 vAS; varying vec4 vK; varying float vTf;
void main(){ vAS = uv; vK = aK; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.); vW = w.xyz;
  float R = length(instanceMatrix[0].xyz), H = length(instanceMatrix[1].xyz); vTf = sqrt(H / 0.9);
  vN = normalize(vec3(position.x * 2. * H / R, 1., position.z * 2. * H / R)); gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`uniform float uTime, uG, uKidIn; uniform vec3 uSun, uGoldT, uBlueT; varying vec3 vW, vN; varying vec2 vAS; varying vec4 vK; varying float vTf;
float h11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
void main(){
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-4, 0.)), N = normalize(vN);
  float limb = min(4., 1. / max(0.1, abs(dot(N, V))));
  float x = vAS.x * vK.w, id = floor(x), f = abs(fract(x) - 0.5), fw = fwidth(vAS.x) * vK.w;
  float inK = uKidIn * step(2.55, vK.z) * step(vK.z, 2.65);            // from inside the rare bell its skin clears: thin bright ribs to the crown, no veil over the ground
  float rib = (1. - smoothstep(mix(0.05, 0.012, inK), mix(0.22, 0.06, inK) + fw, f)) * (0.4 + 0.6 * h11(id + 3.));
  float hair = (1. - smoothstep(0.1, 0.4, abs(fract(x * 5.) - 0.5))) * (1. - smoothstep(0.1, 0.35, fw * 5.)) * 0.3;
  float launch = (uTime - vAS.y * vTf) / vK.x + vK.y;                    // density is a function of when the grain left the vent
  float pulse = 0.22 + 0.78 * smoothstep(0.2, 0.75, 0.5 + 0.5 * sin(launch * 6.2831853)) + 0.25 * sin(launch * 40. + id);
  vec3 tint = mix(uBlueT * 0.4, uGoldT, smoothstep(-0.3, 0.5, dot(normalize(vec3(N.x, 0., N.z) + vec3(1e-4, 0., 0.)), uSun)));
  float a = 0.06 * limb * (mix(0.5, 0.035, inK) + (1.6 + 1.2 * inK) * rib + hair * (1. - 0.7 * inK)) * max(pulse, 0.) * vK.z * uG * smoothstep(0.03, 0.12, vAS.y) * (1. - smoothstep(0.93, 1., vAS.y) * 0.6);
  gl_FragColor = vec4(tint * a, 1.);
}`,
    }), puffing.length);
    puffing.forEach((v, i) => { dummy.position.set(v.x, v.top, v.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(v.R, v.H, v.R); dummy.updateMatrix(); kids.setMatrixAt(i, dummy.matrix); });
    kids.frustumCulled = false; kids.renderOrder = 3; scene.add(kids);
    await ctx.yield();
    {
      // grain: a rising pencil and the falling bell, both closed form
      const per = Math.round(520 * detail), tot = puffing.reduce((a, v) => a + (v.puff === 2 ? per * 5 : (v.puff === 3 ? per * 3.4 : (v.u ? per : per * 0.4))) | 0, 0);
      const aV = new Float32Array(tot * 4), aG = new Float32Array(tot * 4), aI = new Float32Array(tot * 2), pz = new Float32Array(tot * 3); let k = 0;
      puffing.forEach((v, vi) => {
        const n = (v.puff === 2 ? per * 5 : (v.puff === 3 ? per * 3.4 : (v.u ? per : per * 0.4))) | 0;
        for (let i = 0; i < n; i++, k++) {
          aV.set([v.x, v.top, v.z, v.H], k * 4); const jet = rng.chance(v.puff >= 2 ? 0.45 : 0.3);
          aG.set([rng.range(0, TAU), jet ? -1 : rng.range(0.8, 1) * v.R, rng(), rng()], k * 4); aI.set([kidInfo[vi * 4], kidInfo[vi * 4 + 1]], k * 2);
        }
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pz, 3));
      g.setAttribute('aV', new THREE.BufferAttribute(aV, 4)); g.setAttribute('aG', new THREE.BufferAttribute(aG, 4)); g.setAttribute('aI', new THREE.BufferAttribute(aI, 2));
      const pts = new THREE.Points(g, new THREE.ShaderMaterial({
        uniforms: { ...ptU, ...kidU }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
        vertexShader: /* glsl */`
attribute vec4 aV, aG; attribute vec2 aI; uniform float uTime, uPx; uniform vec3 uSun, uGoldT, uBlueT; varying vec3 vC;
void main(){
  float H = aV.w, Tf = sqrt(H / 0.9), jet = step(aG.y, 0.), Tup = 2.5 + H * 0.02;
  float sv = fract(aG.z + uTime / mix(Tf, Tup, jet)), ca = cos(aG.x), sa = sin(aG.x);
  float launch = (uTime - sv * mix(Tf, Tup, jet)) / aI.x + aI.y - jet * 0.02;
  float pulse = 0.2 + 0.8 * smoothstep(0.2, 0.75, 0.5 + 0.5 * sin(launch * 6.2831853));
  vec3 p = mix(aV.xyz + vec3(ca * aG.y * sv, H * (1. - sv * sv), sa * aG.y * sv),
               aV.xyz + vec3(ca, 0., sa) * (0.4 + 2.4 * aG.w * aG.w) * (0.5 + sv) * (0.6 + H * 0.006) + vec3(0., H * (1. - (1. - sv) * (1. - sv)), 0.), jet);
  vec4 mv = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
  float sz = (0.5 + 0.9 * aG.w) * (1. + 0.3 * jet), px = sz * uPx / max(-mv.z, 0.5), big = max(px, 1.6);
  gl_PointSize = min(big, 48.);
  vec3 tint = mix(uBlueT * 0.45, uGoldT, mix(smoothstep(-0.3, 0.5, -ca * -uSun.x + sa * uSun.z), 0.8, jet));
  vC = tint * pulse * (0.5 + 1.3 * jet) * min(1., (px * px) / (big * big) + 0.25) * 0.9;
}`,
        fragmentShader: /* glsl */`varying vec3 vC; void main(){ vec2 q = gl_PointCoord - 0.5; float d = dot(q, q); gl_FragColor = vec4(vC * exp(-d * 18.), 1.); }`,
      }));
      pts.frustumCulled = false; pts.renderOrder = 4; scene.add(pts);
    }
    await ctx.yield();

    // ---------- survey stakes with steady lamps on the caldera crest (and along the track when no convoy is out) ----------
    {
      const steel = col('#9aa39c').multiplyScalar(0.6), ver = col(pal[2]), lampC = col('#DCEBFF');
      const g = mergeParts([
        [new THREE.CylinderGeometry(0.07, 0.11, 4.6, 5), steel, 0, M4(0, 2.3, 0)], [new THREE.BoxGeometry(0.9, 0.5, 0.06), ver, 0, M4(0, 3.6, 0)],
        [new THREE.ConeGeometry(0.5, 0.9, 5), steel, 0, M4(0, 0.4, 0)], [new THREE.SphereGeometry(0.3, 8, 6), lampC, 2, M4(0, 4.8, 0)],
      ]);
      const list = [];
      for (let i = 0; i < 9; i++) { const z = -150 + i * 40, th = Math.atan2(z, 380), cr = crestR(th) - 10; list.push([Math.cos(th) * cr, Math.sin(th) * cr, 2.3]); }
      if (cast === 'stakes') for (let i = 0; i < 12; i++) list.push([391 + (i % 2) * 6, -2815 + i * 38, 2]);
      const mesh = new THREE.InstancedMesh(g, machMat, list.length);
      list.forEach(([x, z, sc], i) => {
        const y = heightAt(x, z) - 0.2; dummy.position.set(x, y, z); dummy.rotation.set(0, i * 1.3, 0); dummy.scale.setScalar(sc); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.frustumCulled = false; scene.add(mesh);
      if (!grazing) addShadows(list.map(([x, z, sc]) => ({ x, z, y: 0, h: 4.8 * sc, w: 0.5 * sc, taper: 0.4 })));
    }

    // ---------- sublimation mist: knee-deep sheets that creep downhill from the sun line (they never billow) ----------
    {
      const mr = rng.fork ? rng.fork('mist') : rng, n = Math.round(150 * detail), aM = new Float32Array(n * 4), mistZ0 = pAt(0.14).z;
      const g = new THREE.PlaneGeometry(1, 1, 4, 1).rotateX(-Math.PI / 2);
      for (let i = 0; i < n; i++) {
        let z = mr.range(-2835, -2130), x = 380 + (mr.chance(0.5) ? 1 : -1) * mr.range(5, 60);
        if (cast === 'halted' && i % 3 === 0) { z = mistZ0 + mr.range(-10, 95); x = mr.range(374, 408); }       // a halted convoy stands in its own frost mist: sheets slide across the plates round the machines
        const y = Math.max(heightAt(x, z), heightAt(x, z - 12), 0);
        aM.set([x, y + mr.range(0.25, 0.6), z, mr()], i * 4);
      }
      g.setAttribute('aM', new THREE.InstancedBufferAttribute(aM, 4));
      const mist = new THREE.InstancedMesh(g, new THREE.ShaderMaterial({
        uniforms: { uTime: L.uTime, uCol: { value: col(chem.lemon).lerp(col(pal[1]), 0.6).multiplyScalar(grazing ? 0.3 : 0.85) }, uA: { value: grazing ? 0.22 : 0.45 } },
        transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`attribute vec4 aM; uniform float uTime; varying vec2 vU; varying float vA; varying vec3 vW;
void main(){ float ph = fract(aM.w + uTime * (0.03 + 0.02 * fract(aM.w * 7.3))), sz = 9. + 16. * fract(aM.w * 13.7);
  vec3 p = vec3(position.x * sz * 0.7, 0., position.z * sz * 1.6) + aM.xyz + vec3(sin(aM.w * 40.) * 4. * ph, -0.25 * ph, -26. * ph + 8.);
  vU = uv; vA = smoothstep(0., 0.25, ph) * (1. - smoothstep(0.6, 1., ph)); vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`,
        fragmentShader: /* glsl */`uniform vec3 uCol; uniform float uTime, uA; varying vec2 vU; varying float vA; varying vec3 vW;
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
void main(){ vec2 q = vU * 2. - 1.; float d = dot(q, q);
  float st = vn2(vec2(vW.x * 0.5, vW.z * 0.09 + uTime * 0.08)) * 0.6 + vn2(vec2(vW.x * 1.7, vW.z * 0.2 + uTime * 0.13)) * 0.4;
  float a = (1. - smoothstep(0.15, 1., d)) * smoothstep(0.25, 0.75, st) * vA * uA;
  gl_FragColor = vec4(uCol, a); }`,
      }), n);
      mist.frustumCulled = false; mist.renderOrder = 2; scene.add(mist);
    }

    await ctx.yield();
    // ---------- the pearl wash inside the snow curtain: eased, never a flash ----------
    const veilU = { uVeil: { value: 0 }, uTime: L.uTime };
    {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
      const veil = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: veilU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false,
        vertexShader: /* glsl */`varying vec2 vP; void main(){ vP = position.xy; gl_Position = vec4(position.xy, 0., 1.); }`,
        fragmentShader: /* glsl */`uniform float uVeil; varying vec2 vP; void main(){ gl_FragColor = vec4(vec3(0.74, 0.8, 0.9) * uVeil * (0.2 + 0.08 * vP.y), 1.); }`,
      }));
      veil.frustumCulled = false; veil.renderOrder = 20; scene.add(veil);
    }

    // ---------- the exit ring as a pale-gold star from afar (it fades as the ring itself takes over) ----------
    const starGrow = { value: 0 };      // 0 the far star of the ceiling leg, 1 the goal of the climb: larger, with long rays
    {
      const star = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
        uniforms: { uPos: { value: seat.position.clone() }, uCol: { value: col('#FFD98A') }, uGrow: starGrow },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
        vertexShader: /* glsl */`uniform vec3 uPos; uniform float uGrow; varying vec2 vQ; varying float vK;
void main(){ vec4 mv = viewMatrix * vec4(uPos, 1.); float d = max(-mv.z, 1.);
  vK = smoothstep(mix(110., 60., uGrow), mix(330., 210., uGrow), d); vQ = position.xy; mv.xy += position.xy * d * mix(0.06, 0.2, uGrow);
  gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`uniform vec3 uCol; uniform float uGrow; varying vec2 vQ; varying float vK;
void main(){ float r = length(vQ), core = exp(-r * r * 60.), halo = exp(-r * mix(5., 4., uGrow)) * (0.18 + 0.34 * uGrow);
  float rays = (exp(-abs(vQ.x) * 46.) + exp(-abs(vQ.y) * 46.)) * exp(-r * mix(3.2, 2.3, uGrow)) * (0.55 + 0.6 * uGrow) + (exp(-abs(vQ.x + vQ.y) * 40.) + exp(-abs(vQ.x - vQ.y) * 40.)) * exp(-r * 6.) * (0.22 + 0.3 * uGrow);
  gl_FragColor = vec4(uCol * (core * 2.4 + halo + rays) * vK * (1. - smoothstep(0.7, 1., r)), 1.); }`,
      }));
      star.frustumCulled = false; star.renderOrder = 12; scene.add(star);
    }

    // ==NEXT==

    // ---------- flight, picture, life ----------
    const jetAim = V3(0, 260, 0), jetAim2 = V3(0, 150, 0);
    // The climb's gaze: the ring a little left of centre in the upper half, the jet a full-height column on the right,
    // and the pitch held low enough that the caldera and the plain stay along the bottom edge. Azimuth: turned from the
    // ring toward the jet far enough to put the jet about 38 degrees right of centre (never more than 32 off the ring);
    // pitch: 15 degrees under the ring's elevation, between 3 and 24. A pure function of u.
    const JET_FOOT = V3(0, 58, 0), OLD_RING = V3(-300, 545, -208), ringAim = V3(), ringAim2 = V3(), ringAim3 = V3(), camC = V3(), D2R = Math.PI / 180;
    const climbAim = (u, out) => {
      PA(u, camC);
      const azR = Math.atan2(RING.x - camC.x, -(RING.z - camC.z)), azJ = Math.atan2(-camC.x, camC.z);
      let sep = azJ - azR; sep = Math.atan2(Math.sin(sep), Math.cos(sep));
      const kOn = smoothstep(0.897, 0.936, u), off = clamp(sep - 38 * D2R, 0.4 * sep, 32 * D2R) * (1 - kOn);      // then the gaze swings onto the ring for the last 300 m
      const el = Math.atan2(RING.y - camC.y, Math.max(Math.hypot(RING.x - camC.x, RING.z - camC.z), 1));
      const pit = clamp(el - lerp(15, 6.5, kOn) * D2R, 3 * D2R, 24 * D2R), az = azR + off, cp = Math.cos(pit);
      return out.set(camC.x + Math.sin(az) * cp * 600, camC.y + Math.sin(pit) * 600, camC.z - Math.cos(az) * cp * 600);
    };
    const pois = [
      // up to the jet pass these two aim as they always did (the jet's foot, and the ring's old place high on the left);
      // from u 0.842 both glide to one composed gaze for the climb (climbAim, below) and hold it to the ring
      { at: (time, u) => climbAim(u, jetAim2).lerp(JET_FOOT, 1 - smoothstep(0.842, 0.868, u)), from: 0.7, to: 1, fade: 0.2, weight: 0.8 },
      { at: (time, u) => climbAim(u, ringAim).lerp(OLD_RING, 1 - smoothstep(0.842, 0.868, u)), from: 0.825, to: 1, weight: 0.82, fade: 0.2 },
      // two more on the same gaze, so that the steady camera (which follows a point of interest only a third as far) also
      // turns from the gold flank and the sun to the ring, the dark field and the land
      { at: (time, u) => climbAim(u, ringAim2), from: 0.842, to: 1, weight: 0.9, fade: 0.16 },
      { at: (time, u) => climbAim(u, ringAim3), from: 0.842, to: 1, weight: 0.9, fade: 0.16 },
    ];
    const convoyAim = V3(394, 7, -2600), camP2 = V3();
    if (nHarv > 0) pois.push({ at: (time, u) => convoyAim.set(394, 4.2, PA(u, camP2).z + 9), from: 0.09, to: 0.205, weight: 0.5 });
    { const pl = V3(-Math.sin(14 * D2R) * Math.cos(2 * D2R), -Math.sin(2 * D2R), Math.cos(14 * D2R) * Math.cos(2 * D2R)), plAim = V3();      // u 0.08: a rise to 30 m over the lake's north shore, the gaze a little to starboard on the jet and the gold flank
      pois.push({ at: (time, u) => PA(u, plAim).addScaledVector(pl, 3000), from: 0.04, to: 0.1, fade: 0.25, weight: 0.6 }); }
    for (const p of pois) { const f = p.at; p.at = (time, un) => f(time, uO(un)); p.from = uN(p.from); p.to = uN(p.to); }      // written in the old route's u
    // The middle's gaze, one keyed target (this path's own u): the whole umbrella from vent to crown as the curtain opens;
    // the near glass bell; the white jet framed between the chimney spires; the caldera from above; the terraced rampart.
    const GAZE = [[0.235, 0, 1000, 0], [0.275, 0, 1000, 0], [0.315, NEAR.x, NEAR.y + 46, NEAR.z], [0.35, NEAR.x, NEAR.y + 46, NEAR.z], [0.395, 0, 230, 0], [0.44, 0, 270, 0],
      [0.485, 0, -70, 0], [0.55, 0, -50, 0], [0.6, -150, 14, -189], [0.625, -150, 14, -189], [0.7, 0, 58, 0]];      // at u 0.61 the gaze swings sunward across the terraces: the sun's coin in its aureole on the gold wall
    const gazeAt = V3();
    pois.unshift({ at: (time, un) => {
      let i = 0; while (i < GAZE.length - 2 && un > GAZE[i + 1][0]) i++;
      const a = GAZE[i], b = GAZE[i + 1], k = smoothstep(a[0], b[0], un);
      return gazeAt.set(lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k));
    }, from: 0.215, to: 0.7, fade: 0.06, weight: 0.9 });
    const updaters = [], camP = V3();
    const pace = (un) => {      // this path's u
      let p = 0.84;
      p = lerp(p, 0.7, smoothstep(0.08, 0.12, un)); p = lerp(p, 0.55, smoothstep(0.165, 0.19, un)); p = lerp(p, 0.9, smoothstep(0.24, 0.27, un));
      p = lerp(p, 1.45, smoothstep(0.275, 0.33, un)); p = lerp(p, 1.2, smoothstep(0.38, 0.42, un)); p = lerp(p, 1.75, smoothstep(0.45, 0.5, un));
      p = lerp(p, 0.85, smoothstep(0.6, 0.72, un)); p = lerp(p, 0.62, smoothstep(0.78, 0.86, un));
      return p;
    };
    return {
      scene, path, duration, pace,
      camera: { fov: 62, near: 0.5, far: 9000, lookAhead: 46, sway: 0.3, bank: 0.45 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#FFD98A', glow: 1, revealDistance: 2400, tilt: true },
      post: {
        exposure: grazing ? 1.05 : (high ? 0.86 : 0.94),
        bloom: { strength: 0.5, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.06, contrast: 1.05, tint: '#ffffff', shadowTint: '#05060c', vignette: 0.26, grain: 0.012, aberration: 0 },
      },
      ride: 'none',
      update(dt, time, camera, uPath) {
        const u = uO(uPath);      // every scripted moment is keyed to the old route's u
        L.uTime.value = time; L.uRibDrift.value = time * 0.011;
        camP.setFromMatrixPosition(camera.matrixWorld); sky.position.copy(camP);
        hero.setProgress(u); hero.update(dt, time, camera);
        { const k = smoothstep(0.84, 0.915, u), kD = smoothstep(0.832, 0.86, u);          // on the climb the bell eases down (over two seconds, never a flash) so the ring and the jet stand in a dark field
          hero.uniforms.uDim.value = lerp(1, 0.045, kD); hero.uniforms.uDimR.value = lerp(1, 0.5, kD); hero.uniforms.uRibW.value = lerp(1, 0.2, kD); hero.uniforms.uDimL.value = lerp(1, 0.1, k); skyU.uStars.value = stars0 * lerp(1, skyKind === 'stars' ? 0.3 : 0.42, kD);
          starGrow.value = smoothstep(0.835, 0.868, u);
          skyU.uBandK.value = 1 + 4.2 * k * (skyKind === 'stars' ? 0.6 : 1); }      // as the bell dims the star-dust band comes up behind the ring
        ctx.renderer.getDrawingBufferSize(resV); ptU.uPx.value = resV.y * camera.projectionMatrix.elements[5] * 0.5;
        placeHarvesters(u, time);
        if (rareVent) { const dr = Math.hypot(camP.x - rareVent.x, camP.z - rareVent.z) / rareVent.R, wallY = rareVent.top + rareVent.H * (1 - dr * dr);      // how far inside the rare bell the camera is (eased over 30 m, never a pop)
          kidU.uKidIn.value = smoothstep(-6, 30, wallY - camP.y); }
        splitU.value.z = smoothstep(0.012, 0.05, u);
        { const cr = Math.hypot(camP.x, camP.z), kE = cr / (RIM * Math.sqrt(Math.max(1 - camP.y / APEX, 0.02)));
          veilU.uVeil.value = u > 0 ? 0.5 * smoothstep(0.86, 0.93, kE) * (1 - smoothstep(0.96, 1.01, kE)) : 0; skyU.uHalo.value = veilU.uVeil.value * 2; }
        if (dust) { const hz = dust.material.uniforms.uHz.value, hy = dust.material.uniforms.uHy.value; for (let i = 0; i < nHarv; i++) { hz[i] = harv[i].cz; hy[i] = harv[i].cy; } }
        for (const f of updaters) f(dt, time, camera, u);
      },
      dispose() { hero.dispose(); hullGeo.dispose(); wheelGeo.dispose(); wheelMat.dispose(); shadowMat.dispose(); },
    };
  },
};
