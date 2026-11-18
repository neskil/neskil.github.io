// OVER THE RIM: hero set piece. The whole canyon bowl that opens under the cable car at the rim.
//
// WHAT IT IS
//   A 3.2 km bowl cut into a dead-flat plateau: a knife-edge rim, a 45 m fluted clay cliff, a wall that falls
//   400 m in spurs, pale fins and gullies, ~12,000 sunlit brick cubes (each with a lit tin/slab top, a lit wall,
//   a cool shadowed wall and a hard blue-black ground shadow) stacked on every buildable slope, a painted city of
//   tens of thousands more in the terrain shader beyond them, switchback roads, a ledge football pitch, a knot of
//   glass towers on the floor, the ropeway (cables, 8 pylons, the portal gantry, ~28 red cabins travelling both
//   ways, spinning sheaves) and the triple-summit ice mountain with its streaming banner cloud.
//
// FRAMES
//   opts.frame = 'hero' (default): contract frame. Origin at the centre of the bowl floor, +Y up, the rim the
//     cabin leaves is toward +Z and the cabin travels toward -Z (so the "front" you look at faces +Z).
//   opts.frame = 'brief': the brief's own axes. Origin at the cliff lip under the cable, X east along the
//     cable, Z south (right of travel), Y height above the plateau. Use this to drop the piece straight into
//     the world as designed. All anchors and heightAt() are always given in the frame you asked for.
//
// OPTS
//   palette   array of 7 hex strings (brief order: sky blue, brick, pale clay, ice white, cabin red, emerald, violet)
//   frame     'hero' | 'brief' (above)
//   clearNear metres (default 0): leave a strip this wide either side of the cable free of hero houses on the
//             two close-pass spurs so the world can seat its full-detail houses there. With 0 the hero houses
//             run under the line with every roof at least 6.3 m from the eye path.
//   ownCabin  false: the cabin the camera rides (travel slot 0) is not drawn once setProgress/setTravel is used.
//   peak      true: build the ice mountain and banner cloud (set false if the world has its own).
//   beyond    true: the ropeway continues past the portal gantry to a floor station (three more masts).
//
// RETURNS (besides the contract fields)
//   heightAt(x, z)            terrain height in the chosen frame (seat houses, trees, minibuses, dogs on it)
//   setProgress(u)            u 0..1 along the 531 m ride: places every cabin (ours 75 m behind the next,
//                             oncoming ones mirrored), so each pass is keyed to u. Until it is called the
//                             cabins drift on wall-clock time (viewer only).
//   setTravel(metres)         same, in metres of cable from the entry.
//   setSun(dirWorld, sunColorLinear, skyColorLinear)   the piece's own shaders are lit analytically; default is
//                             the brief's sun (64 degrees up, north-north-west) in the piece's own frame.
//   extent                    { radius: 1900, depth: 400, peakTop } true size (radius/height below are framing hints)
//
// ANCHORS (chosen frame)
//   rim            the cliff lip under the cable (brief origin)
//   entry          eye point where the ride starts (x=-90, 9.5 m up)
//   flyThrough     ordered eye points of the whole ride, ready for makePath(): level over the plateau, tipping
//                  to 22 degrees down at the rim, easing to 10 degrees for the last 62 m. >= 6.3 m clear of
//                  every hero solid except, by the brief's design, the haul cable 2.9 m overhead, the sheave
//                  trains and cross-arms just above it and each mast shaft 5.1 m to the left.
//   portalSeat     { position, facing, radius: 7, tilt } centre of the 18 m gantry bay, facing back up the line
//   viewpoints     { rimReveal, firstSpur, secondSpur, approach } eye points for the brief's four must-work frames
//   lookAt         { bowl, towers, peak, pitch, farWall } gaze targets (pois)
//   pylons         [{ base, top }] every mast, in ride order; gantry is the object at index gantryIndex
//   spurs          [{ from, to }] eye points bounding the two close passes (roofs 6.3 m under the eye)
//   pitch          centre of the ledge football pitch; sunDir: unit vector toward the sun
//   briefToLocal   Matrix4 mapping brief coordinates to the chosen frame
//
// SIZE   bowl 3.2 km rim to rim (x) by about 4 km, 400 m deep, plateau apron 250 m wide all round; peak 4.3 km out.
//        radius/height/center returned are framing values for the viewer (the near wall), not the bounds.
// COST   about 145k triangles, 12 draw calls, about 250 ms of build, no lights, no textures, no render targets.
//        ctx.quality.detail thins houses and smoke and shortens the far city's lattice walk. Needs camera.far >= 6000 for the peak.
// WORLD  extras for the world that hosts it (brief frame): opts.sunDir / opts.green; uniforms (shared U: sun, sky, uNight,
//        uRimSh, uCab, uHaze, uZen, uHM + uHMRect height-map shadows, uCloudY, uWet = wet season, uCloudU = a ninth cloud shadow the world runs on its clock,
//        uAir.x = a thin haze lying in the bowl; uPxK = one pixel's width per metre of distance, set in update() from the
//        drawing buffer so the cable ribbons hold about 1.7 px at any resolution);
//        roadLines; setCabinGlow(k); setPitchDots(k); makeCable(lines); houseAt(x, z); landmarks; opts.keepOut = [[x0, x1, z0, z1]] rects
//        left free of houses; RIM_GLSL export (district(), lampPool() for the world's own shaders).
//        RIM_PLACES export { cliffFoot, gantry }: named places along the line (x). massif { bearing, half } and
//        farRimAt(bearing): where the massif stands seen from the lip and how far the far rim is on a bearing.
//        The far city's lattice walk in the terrain shader takes its length from ctx.quality.detail (see makeTerrainMaterial).
// LIGHT  hard high sun; cubes, terrain, towers, peak are self-lit ShaderMaterials (linear HDR, scene fog,
//        only pinpoint glints exceed 1). Cabins, pylons, cables and roads are MeshStandardMaterial and take the
//        world's light rig. Wants thin fog (about 0.00012) so the far wall stays crisp.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeNoise, makeRng, clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#143F9E', '#B4603D', '#CFA57C', '#F4F8FC', '#D62222', '#10A56B', '#7A3DB8'];
const BOWL_A = 1600, BOWL_CX = 1600, FLOOR_Y = -400, CLIFF_H = 45, CLIFF_W = 14, WALL_W = 900;
const TAN22 = Math.tan(22 * Math.PI / 180), TAN10 = Math.tan(10 * Math.PI / 180);
const RIDE_X0 = -90, RIDE_X1 = 415, EYE_Y = 9.5, CABLE_UP = 2.9, RETURN_DZ = -7, CABIN_GAP = 75;
const STATION_X = 905;
const ROAD0_W = 8.5;                                    // the first switchback road (the one that crosses under the line twice), kerb to kerb
// landmarks painted on the floor (brief frame): x, z, half size, kind (0 tarpaulin market, 1 church square, 2 stadium, 3 park)
const LANDMARKS = [[1000, -60, 70, 0], [1150, -330, 105, 2], [1080, 250, 55, 1], [1330, -520, 80, 0], [1800, 420, 75, 0], [1250, 560, 90, 3], [1950, -300, 55, 1], [2000, 150, 85, 3]];

// ---------- the ride profile (brief frame): eye height and slope as a function of x ----------
const X_A = -6, X_B = 38, X_C = 325, X_D = 325 + (RIDE_X1 - 325 - 62 * Math.cos(10 * Math.PI / 180));
const Y_B = EYE_Y - TAN22 * (X_B - X_A) * 0.5;
const Y_C = Y_B - TAN22 * (X_C - X_B);
const Y_D = Y_C - (TAN22 + TAN10) * 0.5 * (X_D - X_C);
const Y_END = Y_D - TAN10 * (RIDE_X1 - X_D);
function eyeY(x) {
  if (x <= X_A) return EYE_Y;
  if (x <= X_B) { const t = x - X_A; return EYE_Y - TAN22 * t * t / (2 * (X_B - X_A)); }
  if (x <= X_C) return Y_B - TAN22 * (x - X_B);
  if (x <= X_D) { const t = x - X_C, L = X_D - X_C; return Y_C - TAN22 * t + (TAN22 - TAN10) * t * t / (2 * L); }
  if (x <= RIDE_X1) return Y_D - TAN10 * (x - X_D);
  // beyond the portal gantry: the line steepens again and runs down to the floor station
  const t = x - RIDE_X1, L = 50, s1 = 0.56;
  if (t <= L) return Y_END - TAN10 * t - (s1 - TAN10) * t * t / (2 * L);
  const yL = Y_END - TAN10 * L - (s1 - TAN10) * L * 0.5;
  const xs = STATION_X - 45;
  if (x <= xs) return yL - s1 * (t - L);
  const ys = yL - s1 * (xs - RIDE_X1 - L), u = Math.min(1, (x - xs) / 45);
  return ys - s1 * 45 * (u - u * u * 0.5);
}

// knots of (x along the line, clearance of the ground below the eye): the two spurs, the gully, the gap, the gantry spur
const CLR = [[30, 45.5], [75, 39], [104, 18], [124, 13.2], [166, 13.2], [186, 26], [203, 45], [221, 24], [240, 13.2],
  [312, 13.2], [334, 25], [362, 33], [394, 30.5], [432, 30.5], [470, 44], [540, 60]];
function clearanceAt(x) {
  if (x <= CLR[0][0]) return CLR[0][1];
  for (let i = 1; i < CLR.length; i++) {
    if (x <= CLR[i][0]) { const a = CLR[i - 1], b = CLR[i]; return lerp(a[1], b[1], smoothstep(a[0], b[0], x)); }
  }
  return CLR[CLR.length - 1][1];
}

// ---------- the bowl as a height function (brief frame) ----------
function makeBowl(noise, rng) {
  const n2 = noise.n2;
  const B = rng.range(1880, 2150);                       // half-width of the bowl across the line of travel
  const o = []; for (let i = 0; i < 12; i++) o.push(rng.range(-50, 50));
  const spurAmp = rng.range(48, 66), finAmp = rng.range(44, 62), gullyAmp = rng.range(30, 44);
  const pitch = { x: rng.range(268, 296), z: rng.range(56, 68), hx: 23, hz: 14, y: 0 };
  const info = { d: 0, th: 0, sa: 0, env: 0 };
  const wobRaw = (th) => {
    const a = Math.abs(th);
    return 1 + 0.085 * n2(Math.cos(th) * 1.4 + o[0], Math.sin(th) * 1.4 + o[1]) * smoothstep(0.12, 0.5, a)
             + 0.03 * n2(Math.cos(th) * 4.1 + o[2], Math.sin(th) * 4.1) * smoothstep(0.2, 0.6, a);
  };
  const WN = 4096, wobT = new Float32Array(WN + 2);
  for (let i = 0; i < WN + 2; i++) wobT[i] = wobRaw(-Math.PI + (i / WN) * 2 * Math.PI);
  const wob = (th) => { const f = (th + Math.PI) / (2 * Math.PI) * WN, i = Math.max(0, Math.min(WN, Math.floor(f))); return wobT[i] + (wobT[i + 1] - wobT[i]) * (f - i); };
  function raw(x, z) {
    const ex = (BOWL_CX - x) / BOWL_A, ez = z / B;
    const th = Math.atan2(ez, ex), rr = Math.sqrt(ex * ex + ez * ez);
    let d = (1 - rr / wob(th)) * BOWL_A;
    const sArc = th * 1750;
    info.th = th; info.d = d; info.sa = sArc;
    if (d <= 0) { info.env = 0; return 0; }
    // scalloped flutes eat into the lip
    let dc = d - 1.3;
    if (d < 40) { const fl = Math.abs(Math.sin(sArc / 9.5 + 1.7 * n2(sArc / 60, o[3]))); dc = Math.max(0, d - lerp(2.6 * fl * smoothstep(0, 6, d), 1.3, smoothstep(24, 40, d))); }
    let base;
    if (dc < CLIFF_W) { const t = dc / CLIFF_W; base = -CLIFF_H * (1 - Math.pow(1 - t, 2.3)); }
    else { const t = Math.min(1, (dc - CLIFF_W) / (WALL_W - CLIFF_W)); base = -CLIFF_H - (-FLOOR_Y - CLIFF_H) * (1 - Math.pow(1 - t, 1.12)); }
    const env = smoothstep(CLIFF_W + 2, 150, d) * (1 - smoothstep(760, 1010, d));
    info.env = env;
    if (env <= 0 && d > WALL_W) return base + 5 * n2(x / 420 + o[4], z / 420);
    const nearSide = 0.62 + 0.38 * smoothstep(140, 520, Math.abs(z)) + 0.38 * smoothstep(900, 1300, x);
    const nd = Math.min(1, nearSide);
    const sa = sArc + 55 * n2(d / 330 + o[5], sArc / 520);
    const spur = n2(sa / 310 + o[6], d / 1500 + o[7]) * spurAmp;
    const gq = 1 - Math.abs(n2(sa / 190 + o[8], d / 1100)); const g2 = gq * gq;
    const fq = 1 - Math.abs(n2(sa / 120 + o[9], d / 700 + o[10])); const f2 = fq * fq;
    const envFin = smoothstep(18, 110, d) * (1 - smoothstep(500, 830, d));
    const fin = f2 * Math.sqrt(fq) * finAmp * envFin * (0.6 + 0.4 * n2(d / 70, sa / 160 + o[11]));
    const rdg = (1 - Math.abs(n2(sa / 46 + o[2], d / 210 + o[4]))); const rills = rdg * rdg * 13 - 5;
    const small = n2(x / 38 + o[0], z / 38) * 4.5;
    let h = base + (spur - g2 * g2 * gullyAmp + small + rills) * env * nd + fin * nd + (d > 700 ? 5 * n2(x / 420 + o[4], z / 420) * smoothstep(700, 950, d) : 0);
    // the buttress the ropeway rides: ground follows the eye line at the brief's clearances
    const az = Math.abs(z);
    if (x > 28 && x < 560 && az < 150) {
      const w = smoothstep(28, 80, x) * (1 - smoothstep(470, 560, x)) * (1 - smoothstep(16, 150, az));
      const T = eyeY(x) - clearanceAt(x - 0.3 * z) - az * 0.1 + n2(x / 14, z / 14 + o[1]) * 1.2;
      h = lerp(h, T, w);
    }
    if (x > 470 && x < STATION_X + 30 && az < 70) {         // keep the lower line clear of fins
      const cap = eyeY(x) - 17 + Math.max(0, az - 26) * 1.6;
      if (h > cap) h = cap;
    }
    return Math.max(h, FLOOR_Y - 8);
  }
  // The pitch is a terrace built out level with the ground on its uphill side, 33 m from the cable, so the cabin
  // looks down onto it. The house placement still reads the ground with the ledge where it first stood (pitchOld,
  // cut into the slope 62 m out and hidden from the line), which keeps every random draw of the piece as it was.
  const pitchOld = { x: pitch.x, z: pitch.z, hx: pitch.hx, hz: pitch.hz, y: raw(pitch.x, pitch.z) - 2.5 };
  pitch.z = 47 + (pitch.z - 62) * 0.5; pitch.y = raw(pitch.x, pitch.z - pitch.hz) - 1.5;
  const ledge = (p, x, z) => {
    let h = raw(x, z);
    const wp = (1 - smoothstep(p.hx, p.hx + 12, Math.abs(x - p.x))) * (1 - smoothstep(p.hz, p.hz + 11, Math.abs(z - p.z)));
    if (wp > 0) h = lerp(h, p.y, wp);
    return h;
  };
  const height = (x, z) => ledge(pitch, x, z), heightPlace = (x, z) => ledge(pitchOld, x, z);
  const barrio = (x, z) => smoothstep(-0.7, -0.46, n2(x / 205 + o[2], z / 205 + o[3]) + 0.25 * n2(x / 70, z / 70 + o[5]));
  // position on the bowl from (d, theta): used for the terrain rings
  const at = (d, th, out) => { const rr = (1 - d / BOWL_A) * wob(th); out.x = BOWL_CX - BOWL_A * rr * Math.cos(th); out.z = B * rr * Math.sin(th); return out; };
  return { height, heightPlace, info, barrio, pitch, pitchOld, at, B, wob };
}

// ---------- GLSL shared by the self-lit materials ----------
const GLSL_COMMON = /* glsl */`
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform vec3 uCam; uniform float uTime;
uniform float uNight; uniform vec3 uRimSh; uniform vec4 uCab; uniform vec4 uLine; uniform vec3 uHaze; uniform vec3 uZen;
uniform sampler2D uHM; uniform vec4 uHMRect; uniform float uCloudY; uniform float uWet; uniform vec3 uFarK;   // uFarK = far-fog cap, far haze, warm bounce
uniform vec4 uCloudU; uniform vec4 uDist; uniform vec4 uAir;   // uAir.x = thin haze lying in the bowl (0 = none); uCloudU = the ninth cloud shadow, run by the world on its clock (x, z, radius, strength); uDist = offsets of the district field
float h11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec2 h22(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ return 0.5 * vn(p) + 0.3 * vn(p * 2.03 + 7.1) + 0.2 * vn(p * 4.01 + 3.7); }
// cumulus shadows sweeping across the bowl at about 40 m/s: five from the rim toward the far wall, three smaller ones
// across the floor from left to right; soft-edged, deep enough to read from the rim. Each fades in and out at the
// ends of its run, so none ever appears or goes at a stroke
float cloudOne(vec2 p, vec2 c, vec2 r, float e0){ vec2 d = (p - c) / r; return 1.0 - smoothstep(e0, 1.0, dot(d, d)); }
float cloudRunX(float ph, float sp){ return mod(uTime * sp + ph, 3600.0) - 200.0; }
float cloudEndX(float x){ return smoothstep(-200.0, 220.0, x) * (1.0 - smoothstep(2980.0, 3400.0, x)); }
float cloudRunZ(float ph, float sp){ return mod(uTime * sp + ph, 4400.0) - 2200.0; }
float cloudEndZ(float z){ return smoothstep(-2200.0, -1800.0, z) * (1.0 - smoothstep(1800.0, 2200.0, z)); }
float cloudShade(vec2 xz){
  float s = 0.0;
  vec2 w = vec2(fbm(xz * 0.006), fbm(xz * 0.006 + 9.0)) * 160.0, p = xz + w;
  float x1 = cloudRunX(300.0, 41.0), x2 = cloudRunX(1500.0, 37.0), x3 = cloudRunX(2500.0, 43.0), x5 = cloudRunX(900.0, 39.0), x6 = cloudRunX(2050.0, 40.0);
  s = max(s, cloudOne(p, vec2(x1, -520.0 + 60.0 * sin(uTime * 0.02)), vec2(330.0, 210.0), 0.42) * cloudEndX(x1));
  s = max(s, cloudOne(p, vec2(x2, 380.0), vec2(260.0, 190.0), 0.42) * cloudEndX(x2));
  s = max(s, cloudOne(p, vec2(x3, 1150.0), vec2(380.0, 240.0), 0.42) * cloudEndX(x3));
  s = max(s, cloudOne(p, vec2(x5, 760.0), vec2(240.0, 170.0), 0.42) * cloudEndX(x5));
  s = max(s, cloudOne(p, vec2(x6, -130.0), vec2(300.0, 180.0), 0.42) * cloudEndX(x6) * smoothstep(520.0, 760.0, xz.x));   // this one keeps off the wall the cabin rides
  float z7 = cloudRunZ(500.0, 47.0), z8 = cloudRunZ(2100.0, 53.0), z9 = cloudRunZ(3400.0, 44.0);
  float off = smoothstep(600.0, 820.0, xz.x);                                 // these three cross the floor and the far wall only
  s = max(s, cloudOne(p, vec2(1280.0, z7), vec2(170.0, 230.0), 0.45) * cloudEndZ(z7) * off);
  s = max(s, cloudOne(p, vec2(1950.0, z8), vec2(190.0, 250.0), 0.45) * cloudEndZ(z8) * off);
  s = max(s, cloudOne(p, vec2(2600.0, z9), vec2(210.0, 280.0), 0.45) * cloudEndZ(z9) * off);
  vec2 d4 = (xz + w * 0.3 - uCloudU.xy) / max(uCloudU.z, 1.0) * vec2(1.0, 1.3);
  s = max(s, uCloudU.w * (1.0 - smoothstep(0.3, 1.0, dot(d4, d4))));
  return 1.0 - 0.6 * s;
}
// painted districts (the same field in the placement code): x = how painted this barrio is, y = its palette
// (0 turquoise and white, 1 pink and yellow, 2 mint and violet)
vec2 district(vec2 p){
  float a = sin(p.x * 0.0117 + uDist.x) * cos(p.y * 0.0131 + uDist.y) + 0.7 * sin((p.x * 0.6 + p.y * 0.8) * 0.0093 + uDist.x * 1.7) + 0.5 * cos((p.x * 0.8 - p.y * 0.6) * 0.0171 + uDist.y * 2.3);
  float b = sin(p.x * 0.0083 + uDist.y * 3.1 + 1.0) * sin(p.y * 0.0097 + uDist.x * 2.3) + 0.6 * sin((p.x - p.y) * 0.0061 + 4.0);
  return vec2(smoothstep(-0.15, 0.25, a), b < -0.22 ? 0.0 : (b < 0.22 ? 1.0 : 2.0));
}
vec3 districtPaint(float pal, float h){
  float k = floor(h * 4.0);
  if (pal < 0.5) return k < 1.5 ? vec3(0.014, 0.392, 0.527) : (k < 2.5 ? vec3(0.78, 0.76, 0.69) : vec3(0.20, 0.40, 0.66));
  if (pal < 1.5) return k < 0.5 ? vec3(0.807, 0.069, 0.323) : (k < 1.5 ? vec3(0.888, 0.539, 0.010) : (k < 2.5 ? vec3(0.871, 0.254, 0.012) : vec3(0.78, 0.76, 0.69)));
  return k < 0.5 ? vec3(0.005, 0.376, 0.147) : (k < 1.5 ? vec3(0.195, 0.047, 0.479) : (k < 2.5 ? vec3(0.30, 0.62, 0.45) : vec3(0.78, 0.76, 0.69)));
}
// night street lamps beside the ride: four cells in seven of a 9 m lattice (the world hangs a glow on each);
// returns the lamp light a point stands in, from its own cell and the eight round it
vec2 lampCell(vec2 c){ return (c + 0.5) * 9.0 + 1.2 * vec2(sin(c.x * 1.7 + c.y * 2.3), cos(c.x * 2.9 + c.y * 1.3)); }
vec3 lampPool(vec3 p){
  vec2 c0 = floor(p.xz / 9.0); vec3 acc = vec3(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = c0 + vec2(float(i), float(j));
    float on = step(mod(c.x * 3.0 + c.y * 5.0, 7.0), 3.5) * step(10.5, c.x) * step(c.x, 36.5) * step(abs(c.y + 0.5), 3.6);
    float k = 1.0 - smoothstep(0.0, 8.5, length(p.xz - lampCell(c)));
    acc += mix(vec3(1.0, 0.60, 0.25), vec3(0.80, 0.90, 1.0), step(5.5, mod(c.x * 2.0 + c.y * 7.0, 8.0))) * (k * k * k * on);
  }
  return acc;
}
// low sun behind the rim: everything under the shadow plane that leaves the cliff lip is in shade (x = tan elevation, z = strength)
float rimShade(vec3 p){
  return 1.0 - uRimSh.z * smoothstep(0.0, 8.0, p.x) * (1.0 - smoothstep(-10.0, 10.0, p.y + (p.x - uRimSh.y) * uRimSh.x));
}
// the square shadow of the cabin the camera rides (uCab.xyz = its centre, w = half size; 0 = off)
// every cabin on the straight 22 degree run throws one too (uLine = slope, intercept of the eye line, phase of each row)
float cabRow(vec3 p, float zl, float ph){
  float t = (zl - p.z) / min(uSunDir.z, -0.03); vec3 h = p + uSunDir * t;
  float dx = mod(h.x - ph + 34.77, 69.54) - 34.77, e = 0.1 + 0.004 * t;
  float yc = uLine.x * (h.x - dx) + uLine.y - 0.1;
  return step(0.3, t) * (1.0 - smoothstep(1.0 - e, 1.0 + e, abs(dx))) * (1.0 - smoothstep(1.1 - e, 1.1 + e, abs(h.y - yc))) * step(42.0, h.x) * step(h.x, 322.0) * (1.0 - smoothstep(70.0, 120.0, t));
}
float cabShade(vec3 p){
  vec3 d = uCab.xyz - p; float t = dot(d, uSunDir); vec3 r = d - uSunDir * t;
  float m = max(abs(r.x), max(abs(r.y) * 0.8, abs(r.z)));
  float own = step(0.5, t) * (1.0 - smoothstep(uCab.w - 0.12, uCab.w + 0.12 + 0.012 * t, m)) * step(0.001, uCab.w);
  float rows = uSunDir.z < -0.03 && uLine.x < 0.0 ? max(cabRow(p, 0.0, uLine.z), cabRow(p, -7.0, uLine.w)) : 0.0;
  return 1.0 - max(0.74 * own, 0.45 * rows);
}
// hard shadows near the ride from a top-down height map the world supplies (uHMRect = x0, z0, 1/width, 1/depth)
float hmShade(vec3 p, vec3 n){
  vec2 u0 = (p.xz - uHMRect.xy) * uHMRect.zw;
  vec2 e = min(u0, 1.0 - u0);
  float inside = smoothstep(0.0, 0.02, min(e.x, e.y * 4.0));
  vec3 q0 = p + n * 0.7; float s = 0.0, t = 0.45, k = 1.0 / max(uSunDir.y, 0.3);
  for (int i = 0; i < 8; i++) {
    vec3 q = q0 + uSunDir * (t * k);
    float h = textureLod(uHM, (q.xz - uHMRect.xy) * uHMRect.zw, 0.0).r;
    s = max(s, smoothstep(0.05, 0.5, h - q.y));
    t *= 1.75;
  }
  return 1.0 - s * inside;
}
// morning cloud sea: light thins and whitens toward the deck (uCloudY = top of the deck, -1e5 when there is none)
float seaVeil(float y){ return 1.0 - smoothstep(uCloudY - 14.0, uCloudY + 26.0, y); }
// aerial haze in layers: it thickens with distance and pools low in the bowl, so each ridge stands a value lighter
// than the one in front of it and the far rim melts toward the sky (uAir.x = strength in the bowl, uAir.y = at the far rim)
vec3 bowlAir(vec3 col, vec3 p){
  float d = length(uCam - p), low = 1.0 - smoothstep(-390.0, -40.0, p.y);
  float k = uAir.x * smoothstep(150.0, 1500.0, d) * (0.45 + 0.55 * low) + uAir.y * smoothstep(1300.0, 3900.0, d);
  return mix(col, uHaze * (uSunCol * 0.45 + uSkyCol * 1.2), min(k, 0.8));
}
`;
export const RIM_GLSL = GLSL_COMMON;
// Named places along the line (brief frame, metres of x from the lip) for what a world builds beside it: the foot of the
// cliff under the lip (the cliff is CLIFF_W wide and its flutes set its toe back by up to 2.6 m) and the portal gantry.
export const RIM_PLACES = { cliffFoot: CLIFF_W + 2.6, gantry: RIDE_X1, road0Width: ROAD0_W };   // road0Width: kerb to kerb, of the switchback that crosses under the line (roadLines[0])

// ---------- terrain: rings of constant distance inside the rim, columns dense round the ropeway ----------
async function buildTerrainGeometry(ctx, bowl, sun) {
  const ds = [-236, -235, -150, -70, -25, -6, 0, 1.2, 3.5, 7, 10.5, 14, 19, 26];
  for (let d = 26; ;) { d += 8.5 + (d / 900) * 22; if (d >= 892) break; ds.push(d); }
  ds.push(900, 940, 1000, 1090, 1200, 1330, 1470, 1596);
  const half = [0];
  for (let a = 0; ;) {
    a += 0.0054 + 0.0095 * smoothstep(0.15, 0.3, a) + 0.031 * smoothstep(0.5, 0.95, a);
    if (a >= Math.PI - 0.02) break; half.push(a);
  }
  const ths = [];
  for (let i = half.length - 1; i > 0; i--) ths.push(-half[i]);
  for (let i = 0; i < half.length; i++) ths.push(half[i]);
  ths.push(Math.PI);
  const R = ds.length, C = ths.length, N = R * C;
  const pos = new Float32Array(N * 3), dat = new Float32Array(N * 4), tmp = { x: 0, z: 0 };
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      bowl.at(ds[r], ths[c], tmp);
      const k = (r * C + c) * 3;
      pos[k] = tmp.x; pos[k + 2] = tmp.z;
      pos[k + 1] = r === 0 ? FLOOR_Y - 30 : (ds[r] <= 0 ? 0 : bowl.height(tmp.x, tmp.z));
    }
    await ctx.yield();
  }
  const idx = new Uint32Array((R - 1) * C * 6); let q = 0;
  for (let r = 0; r < R - 1; r++) for (let c = 0; c < C; c++) {
    const c1 = (c + 1) % C, a = r * C + c, b = r * C + c1, e = (r + 1) * C + c, f = (r + 1) * C + c1;
    idx[q++] = a; idx[q++] = b; idx[q++] = e; idx[q++] = b; idx[q++] = f; idx[q++] = e;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  await ctx.yield();
  geo.computeVertexNormals();
  const nor = geo.attributes.normal.array;
  // flip if the winding came out facing down
  if (nor[(8 * C) * 3 + 1] < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } geo.computeVertexNormals(); }
  await ctx.yield();
  const sl = Math.hypot(sun.x, sun.z) || 1, sx = sun.x / sl, sz = sun.z / sl, tanE = sun.y / sl;
  const steps = tanE < 1.4 ? [9, 30, 85, 210] : [9, 30];                 // a lower sun: ridges and spurs throw their shadows a long way
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (c === 0) await ctx.yield();                                        // once a ring
    const i = r * C + c, k = i * 3, x = pos[k], y = pos[k + 1], z = pos[k + 2], d = ds[r];
    let shade = 1;
    if (d > 0 && d < 1010) {
      for (let s = 0; s < steps.length; s++) {
        const st = steps[s], over = bowl.height(x + sx * st, z + sz * st) - (y + st * tanE);
        if (over > 0) shade = Math.min(shade, 1 - clamp(over / (st * 0.3), 0, 1));
      }
    }
    let ao = 1;
    if (r > 6 && r < R - 1) {
      const cm = (c + C - 1) % C, cp = (c + 1) % C;
      const avg = (pos[(r * C + cm) * 3 + 1] + pos[(r * C + cp) * 3 + 1] + pos[((r - 1) * C + c) * 3 + 1] + pos[((r + 1) * C + c) * 3 + 1]) * 0.25;
      const span = Math.hypot(pos[(r * C + cp) * 3] - x, pos[(r * C + cp) * 3 + 2] - z) + 4;
      ao = 1 - clamp((avg - y) / span * 2.2, 0, 0.55);
    }
    const ny = nor[k + 1];
    let city = 0, flat = 0;
    if (d <= 0) { flat = r === 0 ? 0 : 1; city = 0.72 * smoothstep(210, 400, Math.hypot(x, z)); }
    else {
      const far = Math.max(smoothstep(520, 720, x), smoothstep(300, 440, Math.abs(z)));
      city = bowl.barrio(x, z) * smoothstep(0.66, 0.79, ny) * far * smoothstep(20, 60, d);
      if (d > 900) city *= 0.85;
    }
    dat[i * 4] = shade; dat[i * 4 + 1] = city; dat[i * 4 + 2] = flat; dat[i * 4 + 3] = ao;
  }
  geo.setAttribute('aData', new THREE.BufferAttribute(dat, 4));
  geo.computeBoundingSphere();
  geo.userData.grid = { ds, ths };
  return geo;
}

// ---------- the bowl seen from above, one texel to 14 m: R = how clear of the ridges and spurs each spot stands toward
// the sun (their long shadows, smooth across the mesh instead of one value a vertex), G = how built-up it is (the same
// rule as the terrain's vertex data: barrio, slope, distance from the line; nothing on the painted landmarks) ----------
const MAP_RES = 14;
async function buildBowlMap(ctx, bowl, sun) {
  const X0 = -252, X1 = 3640, ZH = Math.ceil((bowl.B * 1.12 + 250) / MAP_RES) * MAP_RES;
  const nx = Math.ceil((X1 - X0) / MAP_RES), nz = Math.round(2 * ZH / MAP_RES), Z0 = -ZH;
  const H = new Float32Array(nx * nz), Dn = new Float32Array(nx * nz), data = new Uint8Array(nx * nz * 4);
  for (let j = 0; j < nz; j++) {
    if ((j & 15) === 0) await ctx.yield();
    const z = Z0 + (j + 0.5) * MAP_RES;
    for (let i = 0; i < nx; i++) { const x = X0 + (i + 0.5) * MAP_RES; H[j * nx + i] = bowl.height(x, z); Dn[j * nx + i] = bowl.info.d; }
  }
  const sl = Math.hypot(sun.x, sun.z) || 1, sx = sun.x / sl / MAP_RES, sz = sun.z / sl / MAP_RES, tanE = Math.max(0.08, sun.y / sl);
  const hAt = (fi, fj) => {                                               // bilinear, in texels
    const a = fi < 0 ? 0 : (fi > nx - 1.001 ? nx - 1.001 : fi), b = fj < 0 ? 0 : (fj > nz - 1.001 ? nz - 1.001 : fj), i = a | 0, j = b | 0, tx = a - i, tz = b - j, k = j * nx + i;
    return (H[k] * (1 - tx) + H[k + 1] * tx) * (1 - tz) + (H[k + nx] * (1 - tx) + H[k + nx + 1] * tx) * tz;
  };
  for (let j = 0; j < nz; j++) {
    if ((j & 7) === 0) await ctx.yield();
    const z = Z0 + (j + 0.5) * MAP_RES;
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i, x = X0 + (i + 0.5) * MAP_RES, y = H[k], d = Dn[k];
      // the sun ray leaves the spot and is tested against the ground at steps that lengthen by 6 %, until it is above the rim
      let shade = 1;
      if (d > 0) {
        for (let s = 10, n = 0; n < 48; n++, s *= 1.06) {
          const ry = y + s * tanE; if (ry > 24) break;
          const over = hAt(i + sx * s, j + sz * s) - ry, soft = 1.5 + 0.035 * s;
          if (over > -soft) { const v = 1 - (over + soft) / (2 * soft); if (v < shade) shade = v < 0 ? 0 : v; if (shade <= 0) break; }
        }
      }
      let city;
      if (d <= 0) city = 0.72 * smoothstep(210, 400, Math.hypot(x, z));
      else {
        const i0 = i > 0 ? i - 1 : i, i1 = i < nx - 1 ? i + 1 : i, j0 = j > 0 ? j - 1 : j, j1 = j < nz - 1 ? j + 1 : j;
        const gx = (H[j * nx + i1] - H[j * nx + i0]) / ((i1 - i0) * MAP_RES), gz = (H[j1 * nx + i] - H[j0 * nx + i]) / ((j1 - j0) * MAP_RES);
        const ny = 1 / Math.sqrt(1 + gx * gx + gz * gz);
        const far = Math.max(smoothstep(520, 720, x), smoothstep(300, 440, Math.abs(z)));
        city = bowl.barrio(x, z) * smoothstep(0.66, 0.80, ny) * far * smoothstep(20, 60, d) * (d > 900 ? 0.85 : 1);   // houses climb every slope up to about 40 degrees
      }
      for (const L of LANDMARKS) if (Math.abs(x - L[0]) < L[2] * 1.02 + MAP_RES && Math.abs(z - L[1]) < L[2] * 1.02 + MAP_RES) city = 0;
      data[k * 4] = Math.round(shade * 255); data[k * 4 + 1] = Math.round(clamp(city, 0, 1) * 255); data[k * 4 + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, nx, nz, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.generateMipmaps = false; tex.needsUpdate = true;
  return { tex, rect: new THREE.Vector4(X0, Z0, 1 / (nx * MAP_RES), 1 / (nz * MAP_RES)) };
}

const FOG_V_PARS = '#include <common>\n#include <fog_pars_vertex>\n';
const FOG_F_PARS = '#include <common>\n#include <fog_pars_fragment>\n';

function makeTerrainMaterial(U, pal, pitch, green, detail = 1) {
  // The far city's walk through its lattice is as long as the quality level allows (the kit's detail value: 1 at high and
  // ultra, 0.8 at medium, 0.6 at low): cells walked along the eye ray 9, 7 or 5 and toward the sun 6, 5 or 4, each with the
  // reach in cells that its count can cover, and the share of every doubling of distance over which two pitches of the
  // lattice are both walked (their cross-fade) 0.40, 0.32 or 0.24. At low a far house hides and shades a shorter stretch
  // of the ground behind it and one pitch gives way to the next over a shorter distance; the city is the same city.
  const seeN = Math.round(9 * detail), shadeN = Math.round(6 * detail);
  return new THREE.ShaderMaterial({
    fog: true,
    defines: { RC_SEE: seeN, RC_SHADE: shadeN, RC_REACH: (5.5 * seeN / 9).toFixed(3), RC_SREACH: (3.5 * shadeN / 6).toFixed(3), RC_BAND: (1 - 0.4 * detail).toFixed(3) },
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uBrick: { value: pal.brick }, uPale: { value: pal.pale }, uPitch: { value: new THREE.Vector4(pitch.x, pitch.z, pitch.hx, pitch.hz) },
      uGreen: { value: green }, uAccent: { value: pal.blue }, uDots: { value: 1 }, uLm: { value: LANDMARKS.map((l) => new THREE.Vector4(l[0], l[1], l[2], l[3])) },
    }]),
    vertexShader: FOG_V_PARS + /* glsl */`
      attribute vec4 aData; varying vec3 vP; varying vec3 vN; varying vec4 vData;
      void main(){ vP = position; vN = normal; vData = aData;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F_PARS + GLSL_COMMON + /* glsl */`
      uniform vec3 uBrick; uniform vec3 uPale; uniform vec4 uPitch; uniform float uGreen; uniform vec3 uAccent; uniform float uDots; uniform vec4 uLm[8];
      varying vec3 vP; varying vec3 vN; varying vec4 vData;
      vec2 gPd; float gFar;                                                          // this fragment's district, and how far off it is (set in main)
      // the long shadows of the towers on the floor (uTw = x, z, half width, height; height 0 = unused): each is the
      // tower's footprint swept away from the sun, narrowing a little toward its tip
      uniform vec4 uTw[48];
      float towerShade(vec3 p, float fw){
        float hl = max(length(uSunDir.xz), 1e-3); vec2 sd = uSunDir.xz / hl; float k = hl / max(uSunDir.y, 0.22 * hl);
        float s = 0.0;
        for (int i = 0; i < 48; i++) {
          vec4 t = uTw[i]; vec2 d = p.xz - t.xy; float L = max(t.w * k, 1.0);
          float a = clamp(-dot(d, sd), 0.0, L); vec2 r = d + sd * a;
          float w = t.z * (1.0 - 0.3 * a / L), e = 2.5 + 0.03 * a + 0.5 * fw;
          s = max(s, (1.0 - smoothstep(w - e, w + e, length(r))) * step(1.0, t.w));
        }
        return 1.0 - 0.74 * s * (1.0 - 0.6 * uNight);
      }
      float tri(float x){ return abs(fract(x) - 0.5) * 2.0; }
      // erosion flutes for one plan direction of fall: narrow across the slope, long down it (1 on the rill line)
      float flute(vec2 xz, vec2 dir, float w){ float v = vn(vec2(dot(xz, vec2(-dir.y, dir.x)) * 0.14 + w, dot(xz, dir) * 0.026) + 17.0 * dir); return 1.0 - abs(2.0 * v - 1.0); }
      // landmarks painted on the floor of the bowl: L = centre x, z, half size, kind (0 a market of striped tarpaulins,
      // 1 a paved church square, 2 a stadium, 3 a park); lit = light on a level surface here
      vec3 landmark(vec3 col, vec2 xz, vec4 L, float fwP, vec3 lit){
        vec2 q = (xz - L.xy) / max(L.z, 1.0);
        if (L.z < 1.0 || max(abs(q.x), abs(q.y)) > 1.5) return col;
        float e = fwP / max(L.z, 1.0), m = 0.0; vec3 c = vec3(0.0);
        if (L.w < 0.5) {
          m = 1.0 - smoothstep(0.92 - e, 0.92 + e, max(abs(q.x), abs(q.y)));
          vec2 g = (xz - L.xy) / 30.0; vec2 id = floor(g), f = fract(g) - 0.5; float hh = h21(id + L.xy * 0.01), eg = fwP / 30.0;   // market halls under awnings 30 m across
          float aisle = 1.0;
          float tarp = aisle * (1.0 - smoothstep(0.44 - eg, 0.44 + eg, max(abs(f.x), abs(f.y))));
          vec3 tc = hh < 0.34 ? vec3(0.04, 0.14, 0.60) : (hh < 0.5 ? vec3(0.62, 0.05, 0.04) : (hh < 0.64 ? vec3(0.80, 0.55, 0.03) : (hh < 0.76 ? vec3(0.03, 0.36, 0.14) : (hh < 0.88 ? vec3(0.75, 0.74, 0.68) : vec3(0.78, 0.25, 0.02)))));
          tc *= 0.72 + 0.28 * step(0.5, fract(f.x * 3.0 + 0.5)) * (1.0 - smoothstep(0.1, 0.3, eg));
          c = mix(vec3(0.42, 0.35, 0.28), tc, mix(0.75 * aisle, tarp, 1.0 - smoothstep(0.5, 1.6, eg)));
        } else if (L.w < 1.5) {
          float rr = length(q);
          m = 1.0 - smoothstep(0.95 - e, 0.95 + e, max(abs(q.x), abs(q.y)));
          c = vec3(0.60, 0.56, 0.50);
          c = mix(c, vec3(0.42, 0.33, 0.28), (1.0 - smoothstep(0.03, 0.03 + e, min(abs(q.x), abs(q.y)))) * 0.6);
          c = mix(c, vec3(0.70, 0.68, 0.64), 1.0 - smoothstep(0.0, e + 0.02, abs(rr - 0.45)));
          vec2 tf = fract(q * 6.0) - 0.5;
          float tree = step(0.72, max(abs(q.x), abs(q.y))) * (1.0 - smoothstep(0.28, 0.34 + e * 6.0, length(tf)));
          c = mix(c, vec3(0.08, 0.17, 0.07), tree * 0.9);
        } else if (L.w < 2.5) {
          vec2 o = q * vec2(1.0, 1.38); float rr = length(o);
          m = 1.0 - smoothstep(1.0 - e, 1.0 + e, rr);
          float ang = atan(o.y, o.x + 1e-5);
          vec2 sdn = uSunDir.xz / max(length(uSunDir.xz), 1e-3); float toSun = dot(o / max(rr, 1e-3), sdn);
          float blk = fract(ang * 0.955 + 0.3);                                          // blocks of seats: grey concrete, blue, a few red
          c = mix(vec3(0.27, 0.27, 0.29), vec3(0.07, 0.15, 0.40), step(0.55, blk)); c = mix(c, vec3(0.42, 0.10, 0.07), step(0.85, blk));
          c *= (0.88 + 0.12 * step(0.5, fract(ang * 3.82))) * (0.62 + 0.38 * smoothstep(0.66, 0.92, rr));   // the rake of the stand: darker toward the pitch
          c *= 0.50 + 0.50 * smoothstep(-0.1, 0.6, -toSun);                                 // the stand under the sun turns its face away from it
          c = mix(c, vec3(0.50, 0.49, 0.46), smoothstep(0.90, 0.93 + e, rr));                // the roof ring
          c = mix(c, vec3(0.08, 0.08, 0.10), (1.0 - smoothstep(0.0, 0.025 + e, abs(rr - 0.90))) * 0.8);
          c = mix(c, vec3(0.40, 0.15, 0.09), 1.0 - smoothstep(0.66, 0.66 + e, rr));
          vec2 pq = abs(q) / vec2(0.5, 0.33);
          vec3 grass = vec3(0.10, 0.30, 0.08) * (0.85 + 0.15 * step(0.5, fract(q.x * 6.0)));
          grass = mix(grass, vec3(0.8), (1.0 - smoothstep(0.0, 0.03 + e * 2.0, min(abs(q.x), abs(length(q) - 0.12)))) * 0.7);
          c = mix(c, grass * 1.25, 1.0 - smoothstep(1.0 - e * 3.0, 1.0 + e * 3.0, max(pq.x, pq.y)));
          col = mix(col, col * vec3(0.40, 0.44, 0.62), (1.0 - smoothstep(1.0, 1.30, rr - 0.12 * toSun)) * smoothstep(0.1, 0.7, -toSun) * (1.0 - m) * (1.0 - uNight));   // its shadow on the streets beyond
        } else {
          m = 1.0 - smoothstep(0.9 - e, 0.9 + e, length(q) + 0.15 * (vn(xz * 0.03) - 0.5));
          vec2 tg = xz / 11.0; vec2 tid = floor(tg); vec2 tf = fract(tg) - 0.5 - (h22(tid) - 0.5) * 0.5;
          float tree = step(h21(tid + 3.0), 0.7) * (1.0 - smoothstep(0.30, 0.36 + fwP / 11.0, length(tf)));
          c = mix(vec3(0.26, 0.34, 0.12), vec3(0.07, 0.16, 0.07), tree);
          c = mix(c, vec3(0.62, 0.55, 0.42), (1.0 - smoothstep(0.02, 0.03 + e, abs(abs(q.x) - abs(q.y)))) * 0.8);
        }
        return mix(col, c * lit, m);
      }
      // ---- the far city in relief ----
      // One lattice of houses for the whole bowl, bent by a slow warp so its streets curve. It is walked along the eye
      // ray, so every house is a true box (a level roof, the walls toward the eye, the ground between) and walked again
      // toward the sun for the shadow each one throws. Cells of 9 m are houses; cells of 18, 36 and 72 m are rows and
      // blocks for where a house is under a few pixels. Every 72 m of the lattice is a street and every 288 m an avenue,
      // at every pitch. Nothing here is a flat pattern laid on the ground, so nothing can stretch on a slope.
      uniform sampler2D uBS; uniform vec4 uBSRect; uniform float uPxK;
      vec2 rcWarp(vec2 xz){ return xz + 110.0 * vec2(vn(xz * 0.0013 + 3.0), vn(xz * 0.0013 + 11.0)) + 20.0 * vec2(vn(xz * 0.0045 + 7.0), vn(xz * 0.0045 + 17.0)); }
      vec2 gG0; vec2 gUv0; mat2 gUvM;          // this fragment's place in the lattice and in the bowl map, and the map's step per grid metre (set in main)
      // the building of cell id in the lattice of pitch c: its height (0 = an open lot) and its footprint lo..hi in grid metres
      float rcBox(vec2 id, float c, float hk, out vec2 lo, out vec2 hi){
        vec2 r = h22(id + c * 1.37 + 3.1), e0 = id * c, e1 = e0 + c;
        vec2 s0 = step(abs(mod(e0 + 36.0, 72.0) - 36.0), vec2(0.5)), s1 = step(abs(mod(e1 + 36.0, 72.0) - 36.0), vec2(0.5));
        vec2 a0 = step(abs(mod(e0 + 144.0, 288.0) - 144.0), vec2(0.5)), a1 = step(abs(mod(e1 + 144.0, 288.0) - 144.0), vec2(0.5));
        float al = 0.07 * c + 0.4, st = 3.4 + 0.03 * c, av = 7.0 + 0.03 * c;
        lo = e0 + mix(mix(vec2(al), vec2(st), s0), vec2(av), a0) + 0.08 * c * r;
        hi = e1 - mix(mix(vec2(al), vec2(st), s1), vec2(av), a1) - 0.08 * c * (1.0 - r.yx);
        float dens = textureLod(uBS, gUv0 + gUvM * (0.5 * (lo + hi) - gG0), 0.0).g;
        float pres = step(h21(id + c * 0.71 + 11.0), min(0.92, dens * 1.45)) * step(0.3 * c, min(hi.x - lo.x, hi.y - lo.y));
        return pres * (0.36 + 0.50 * h21(id + c * 0.13 + 5.0)) * 9.0 * hk;
      }
      // the eye ray walked down to the ground point gG0: dg = grid metres per metre of ray, ay = its fall per metre, dh = its
      // fall toward the ground plane, gr = the plane's gradient in the lattice. Returns 0 = the ground is seen, 1 = a roof,
      // 2 = a wall; oP = (where, metres below the roof, the house's height), oI = (cell, the wall's normal), oB = footprint
      float rcSee(vec2 dg, float ay, float dh, vec2 gr, float c, float hk, out vec4 oP, out vec4 oI, out vec4 oB){
        oP = vec4(gG0, 0.0, 0.0); oI = vec4(0.0); oB = vec4(0.0);
        vec2 d = vec2(abs(dg.x) < 1e-4 ? 1e-4 : dg.x, abs(dg.y) < 1e-4 ? 1e-4 : dg.y), sg = sign(d), inv = 1.0 / d;
        float top = 7.8 * hk + 0.5 * c * (abs(gr.x) + abs(gr.y));
        float tS = -min(top / max(-dh, 0.02), RC_REACH * c / max(abs(d.x), abs(d.y)));
        vec2 p = gG0 + d * tS, id = floor(p / c);
        vec2 tM = tS + ((id + max(sg, 0.0)) * c - p) * inv, tD = c * abs(inv);
        float kind = 0.0;
        for (int i = 0; i < RC_SEE; i++) {
          vec2 lo, hi; float h = rcBox(id, c, hk, lo, hi);
          if (h > 0.0) {
            vec2 ta = (lo - gG0) * inv, tb = (hi - gG0) * inv, t1 = min(ta, tb), t2 = max(ta, tb);
            float te = max(max(t1.x, t1.y), tS), tx = min(min(t2.x, t2.y), 0.0);
            if (te < tx) {
              float b = dot(gr, gG0 - 0.5 * (lo + hi)) - h, fe = ay * te + b;
              if (fe < 0.0) { kind = 2.0; oP = vec4(gG0 + d * te, -fe, h); oI = vec4(id, t1.x > t1.y ? vec2(-sg.x, 0.0) : vec2(0.0, -sg.y)); oB = vec4(lo, hi); break; }
              if (ay * tx + b < 0.0) { float tr = clamp(-b / min(ay, -1e-3), te, tx); kind = 1.0; oP = vec4(gG0 + d * tr, 0.0, h); oI = vec4(id, 0.0, 0.0); oB = vec4(lo, hi); break; }
            }
          }
          if (min(tM.x, tM.y) >= 0.0) break;
          if (tM.x < tM.y) { id.x += sg.x; tM.x += tD.x; } else { id.y += sg.y; tM.y += tD.y; }
        }
        return kind;
      }
      // the same lattice walked from the ground point toward the sun: 1 where a house stands in the way
      float rcShade(vec2 ds, float sy, float sdh, vec2 gr, float c, float hk){
        vec2 d = vec2(abs(ds.x) < 1e-4 ? 1e-4 : ds.x, abs(ds.y) < 1e-4 ? 1e-4 : ds.y), sg = sign(d), inv = 1.0 / d;
        float top = 7.8 * hk + 0.5 * c * (abs(gr.x) + abs(gr.y));
        float tE = min(top / max(sdh, 0.05), RC_SREACH * c / max(abs(d.x), abs(d.y)));
        vec2 id = floor(gG0 / c);
        vec2 tM = ((id + max(sg, 0.0)) * c - gG0) * inv, tD = c * abs(inv);
        float s = 0.0;
        for (int i = 0; i < RC_SHADE; i++) {
          vec2 lo, hi; float h = rcBox(id, c, hk, lo, hi);
          if (h > 0.0) {
            vec2 ta = (lo - gG0) * inv, tb = (hi - gG0) * inv, t1 = min(ta, tb), t2 = max(ta, tb);
            float te = max(max(t1.x, t1.y), 0.0), tx = min(min(t2.x, t2.y), tE);
            if (te < tx && sy * te + dot(gr, gG0 - 0.5 * (lo + hi)) - h < 0.0) { s = 1.0; break; }
          }
          if (min(tM.x, tM.y) >= tE) break;
          if (tM.x < tM.y) { id.x += sg.x; tM.x += tD.x; } else { id.y += sg.y; tM.y += tD.y; }
        }
        return s;
      }
      // what the eye meets in the lattice of pitch c, lit: a roof under the sun and the sky, a wall by the same rule as
      // the real houses (sun on the faces turned to it, cool sky and a little bounce on the others), or the ground between,
      // in the sun (gLit) or in a house's shadow (gSh). sunK = the sun left here by ridges and clouds; px = metres to a pixel
      vec3 rcCity(float c, float hk, vec2 dg, float dh, vec2 gr0, vec2 ds, float sdh, mat2 J, vec3 gLit, vec3 gSh, float sunK, float px){
        // a house has a level roof; a block of houses steps down the slope with it, so its roof leans as the ground does
        // by the share its houses cannot level (none for a 9 m house, three quarters for a 36 m block)
        vec2 gr = gr0 * min(1.0, 9.0 / c); float ay = dh + dot(gr, dg), sy = sdh + dot(gr, ds);
        vec4 oP, oI, oB; float kind = rcSee(dg, ay, dh, gr, c, hk, oP, oI, oB);
        if (kind < 0.5) {
          float s = (sunK > 0.01 && sdh > 0.02) ? rcShade(ds, sy, sdh, gr, c, hk) : 0.0;
          return mix(gLit, gSh, s);
        }
        // a 9 m cell is one house; a larger cell is a block of four, each with a roof and a front of its own tone
        float sub = 0.5 * c; vec2 sid = c < 13.0 ? oI.xy : floor(oP.xy / sub) + 0.37 * c;
        float pk = h21(sid + 11.0), pk2 = h21(sid + 17.0);
        float isP = step(h21(sid + 23.0), mix(0.10, 0.40, gPd.x));
        vec3 paintC = districtPaint(gPd.y, h21(sid + 37.0)) * 0.78;
        vec3 brick = mix(uBrick, vec3(0.62, 0.27, 0.12), 0.45) * (0.85 + 0.5 * pk2);
        float wt = h21(sid + 61.0);                                              // most walls are bare brick; some are cement render, some pale adobe
        vec3 wallC = mix(wt < 0.16 ? vec3(0.47, 0.45, 0.42) * (0.8 + 0.4 * pk2) : (wt < 0.28 ? vec3(0.60, 0.50, 0.37) * (0.8 + 0.4 * pk2) : brick), paintC, isP);
        vec3 lampC = mix(vec3(1.0, 0.62, 0.26), vec3(0.85, 0.92, 1.0), step(0.62, pk));
        if (kind > 1.5) {
          vec2 nW = vec2(dot(J[0], oI.zw), dot(J[1], oI.zw)); nW /= max(length(nW), 1e-3);
          float sunT = max(nW.x * uSunDir.x + nW.y * uSunDir.z, 0.0) * sunK;
          vec3 light = uSunCol * min(sunT * 1.9, 1.0) + uSkyCol * 0.75 + vec3(0.34, 0.25, 0.17) * uFarK.z * 0.45 * (0.3 + 0.7 * sunK) * (1.0 - 0.75 * uNight);
          float u = abs(oI.z) > 0.5 ? oP.y : oP.x, below = oP.z;
          float ws = c / 9.0;                                                  // a block's front is drawn in bays as much larger as the block is: its dark openings hold a few pixels at the distance it is seen from
          float wk = 1.0 - smoothstep(0.22, 0.6, px / (2.8 * ws));
          vec2 wg = vec2(u / (3.1 * ws), below / (2.8 * ws)), wf = fract(wg); float hw = h21(floor(wg) + sid * 1.3);
          float win = step(0.3, hw) * step(abs(wf.x - 0.5), 0.24) * step(0.32, wf.y) * step(wf.y, 0.78) * wk;
          vec3 col = wallC * (0.88 + 0.24 * h21(vec2(floor(u / (3.1 * ws)), 3.0) + sid)) * mix(1.0, 0.93 + 0.07 * step(0.12, wf.y), wk);
          col = mix(col, vec3(0.05, 0.06, 0.09), win * 0.85) * light;
          float foot = oP.w - dot(gr, oP.xy - 0.5 * (oB.xy + oB.zw)) - below;   // metres above the ground at the wall's foot
          col *= (0.66 + 0.34 * smoothstep(-0.3, 2.2, foot)) * (0.74 + 0.26 * smoothstep(0.03 * c + 0.15, 0.05 * c + 0.3, below));   // dark at the foot, and the line of shade under the eave
          col += uNight * lampC * win * step(0.5, fract(hw * 37.0)) * 1.8;
          return col;
        }
        vec3 tinC = pk2 < 0.55 ? vec3(0.54, 0.55, 0.58) * (0.8 + 0.45 * pk2) : (pk2 < 0.80 ? vec3(0.40, 0.22, 0.14) : (pk2 < 0.87 ? vec3(0.46, 0.10, 0.07) : (pk2 < 0.94 ? vec3(0.07, 0.28, 0.16) : vec3(0.08, 0.19, 0.46))));
        vec3 roof = pk < 0.45 ? tinC : (pk < 0.65 ? vec3(0.45, 0.42, 0.39) * (0.8 + 0.35 * pk2) : brick * 0.78);
        roof = mix(roof, paintC * 0.85, isP * step(0.45, h21(sid + 51.0)) * 0.7);
        vec2 ed = min(oP.xy - oB.xy, oB.zw - oP.xy); float fine = 1.0 - smoothstep(0.25, 0.8, px);
        roof *= 1.0 - 0.32 * fine * (1.0 - smoothstep(0.0, 0.5, min(ed.x, ed.y)));                       // the parapet or the eave
        if (c > 13.0) { vec2 sf = abs(fract(oP.xy / sub) - 0.5) * sub; roof *= 1.0 - 0.55 * (1.0 - smoothstep(0.25, 0.3 + px, 0.5 * sub - max(sf.x, sf.y))) * (1.0 - smoothstep(0.1, 0.35, px / sub)); }   // the alley between the houses of a block
        return roof * (uSunCol * (uSunDir.y * 1.05 * sunK) + uSkyCol * 0.9) + uNight * lampC * 0.02;
      }
      void main(){
        vec3 N0 = normalize(vN + vec3(0.0, 1e-4, 0.0));
        float flatTop = vData.z, ao = vData.w;
        vec4 bm = textureLod(uBS, (vP.xz - uBSRect.xy) * uBSRect.zw, 0.0);            // the bowl map: ridge and spur shadows, city density (none where it is too steep to build)
        float shade = bm.r, dens = bm.g;
        // rills and creases too fine for the mesh: a ridged bump that only bites on slopes
        float camD = length(uCam - vP); gFar = smoothstep(420.0, 820.0, camD);
        float bfade = (1.0 - flatTop) * (1.0 - smoothstep(900.0, 2600.0, camD));
        vec2 bp = vP.xz * 0.045;
        float b0 = abs(2.0 * vn(bp) - 1.0) + 0.5 * abs(2.0 * vn(bp * 2.3 + 5.0) - 1.0);
        float bx = abs(2.0 * vn(bp + vec2(0.09, 0.0)) - 1.0) + 0.5 * abs(2.0 * vn((bp + vec2(0.09, 0.0)) * 2.3 + 5.0) - 1.0);
        float bz = abs(2.0 * vn(bp + vec2(0.0, 0.09)) - 1.0) + 0.5 * abs(2.0 * vn((bp + vec2(0.0, 0.09)) * 2.3 + 5.0) - 1.0);
        vec3 N = normalize(N0 + bfade * 0.22 * (1.0 - 0.6 * N0.y * N0.y) * vec3(b0 - bx, 0.0, b0 - bz) * 4.0);
        float n1 = fbm(vP.xz * 0.011), n2v = fbm(vP.xz * 0.07 + 3.0), n3 = vn(vP.xz * 0.45);
        float steep = 1.0 - smoothstep(0.70, 0.89, N0.y);
        // bare clay: vertical fluting on steep faces, faint strata everywhere
        vec2 hn = abs(N.xz) / max(abs(N.x) + abs(N.z), 1e-3);
        float fwP = max(fwidth(vP.x), fwidth(vP.z));
        float fwY = fwidth(vP.y) * 1.6, fwSx = max(fwidth(vP.z), fwY), fwSz = max(fwidth(vP.x), fwY);   // footprints of the terrace grids on slopes
        float ffade = 1.0 - smoothstep(0.08, 0.3, fwP * 0.19);
        float fl = mix(0.5, tri(vP.x * 0.19 + 2.0 * vn(vP.xz * 0.05)) * hn.y + tri(vP.z * 0.19 + 2.0 * vn(vP.zx * 0.05 + 4.0)) * hn.x, ffade);
        float fl2 = mix(0.5, tri(vP.x * 0.61 + n3) * hn.y + tri(vP.z * 0.61 + n3) * hn.x, ffade * ffade);
        float strata = 0.5 + 0.5 * sin(vP.y * 0.55 + n1 * 9.0);
        vec3 clay = mix(uPale, vec3(0.80, 0.70, 0.56), 0.35) * (0.78 + 0.34 * fl + 0.10 * fl2) * (0.92 + 0.10 * strata);
        clay = mix(clay, uBrick * 1.1, 0.16 * smoothstep(0.45, 0.8, n1) + 0.08 * strata);
        vec3 earth = mix(uPale * 0.9, uBrick, 0.26 + 0.34 * n1) * (0.66 + 0.26 * n2v) * (0.9 + 0.1 * b0);
        earth *= 0.86 + 0.28 * fl * (1.0 - smoothstep(0.75, 0.95, N0.y)) * (1.0 - flatTop);
        vec3 alb = mix(earth, clay, steep);
        // erosion big enough to read from across the bowl: irregular flutes run down every bare slope, dark in the rill
        // and pale on the crest, the creases of the ground between them are dark, and strata band every 6 m of height
        float slopeK = (1.0 - smoothstep(0.80, 0.97, N0.y)) * (1.0 - flatTop) * (1.0 - 0.7 * clamp(dens * 2.0, 0.0, 1.0));
        float fadeA = 1.0 - smoothstep(1.6, 4.6, fwP), fadeB = 1.0 - smoothstep(5.0, 15.0, fwP);
        float rillA = 0.0, crestA = 0.0, rillC = 0.0;
        if (slopeK * fadeA > 0.004) {
          vec2 gd = N0.xz / max(length(N0.xz), 1e-3);
          vec4 wq = vec4(gd.x, gd.y, (gd.x + gd.y) * 0.7071, (gd.x - gd.y) * 0.7071); wq *= wq; wq *= wq; wq *= wq; wq *= wq;
          float fw = 0.9 * vn(vP.xz * 0.021 + 5.0) + 0.5 * n2v;
          float r = (wq.x * flute(vP.xz, vec2(1.0, 0.0), fw) + wq.y * flute(vP.xz, vec2(0.0, 1.0), fw) + wq.z * flute(vP.xz, vec2(0.7071, 0.7071), fw) + wq.w * flute(vP.xz, vec2(0.7071, -0.7071), fw)) / max(wq.x + wq.y + wq.z + wq.w, 1e-3);
          rillA = smoothstep(0.76, 0.97, r) * fadeA; crestA = (1.0 - smoothstep(0.0, 0.4, r)) * fadeA;
          float fadeC = 1.0 - smoothstep(0.8, 2.6, fwP);                                // a finer set between them, for the slopes the cabin passes
          if (fadeC > 0.004) {
            vec2 x2 = vP.xz * 2.9 + 31.0; float fw2 = fw * 1.7 + 0.4 * n3;
            float r2 = (wq.x * flute(x2, vec2(1.0, 0.0), fw2) + wq.y * flute(x2, vec2(0.0, 1.0), fw2) + wq.z * flute(x2, vec2(0.7071, 0.7071), fw2) + wq.w * flute(x2, vec2(0.7071, -0.7071), fw2)) / max(wq.x + wq.y + wq.z + wq.w, 1e-3);
            rillC = smoothstep(0.58, 0.95, r2) * fadeC;
          }
        }
        float crease = (1.0 - smoothstep(0.02, 0.34, b0)) * fadeB;
        alb *= 1.0 - slopeK * (0.25 * rillA + 0.15 * crease + 0.09 * rillC - 0.07 * crestA);
        alb = mix(alb, alb * vec3(0.80, 0.62, 0.52), slopeK * 0.36 * max(rillA, 0.6 * crease));
        float fy = fwidth(vP.y), st6 = smoothstep(0.30, 0.70, tri(vP.y / 6.0 + 0.9 * n1)) * (1.0 - smoothstep(1.0, 3.0, fy));
        alb *= 1.0 + slopeK * 0.16 * (st6 - 0.45);
        alb = mix(alb, uBrick * 0.95, slopeK * 0.10 * st6);
        // wet season: the clay is dark and red with rain, with a flush of new grass on the gentler ground
        alb = mix(alb, alb * vec3(0.74, 0.58, 0.50), uWet * 0.6 * (1.0 - flatTop));
        alb = mix(alb, vec3(0.20, 0.30, 0.11) * (0.8 + 0.4 * n2v), uWet * 0.42 * (1.0 - flatTop) * (1.0 - steep) * smoothstep(0.42, 0.62, n1));
        // gullies: darker, a breath of eucalyptus green; terraces on gentler far slopes
        float gul = (1.0 - ao) * (1.0 - steep);
        gul *= 0.5 + 1.0 * vn(vP.xz * 0.075 + 21.0);
        alb = mix(alb, vec3(0.215, 0.21, 0.125), clamp(gul * 1.5, 0.0, 0.26));
        { vec2 tg = vP.xz / 6.5; vec2 tid = floor(tg); vec2 tf = fract(tg) - 0.5 - (h22(tid + 1.3) - 0.5) * 0.6;       // eucalyptus crowns gather in the gullies
          float crown = step(h21(tid + 3.0), 0.7) * (1.0 - smoothstep(0.24, 0.36 + fwP / 6.5, length(tf))) * (1.0 - smoothstep(1.2, 4.5, fwP));
          alb = mix(alb, vec3(0.085, 0.14, 0.085) * (0.7 + 0.6 * h21(tid + 8.0)), crown * clamp(gul * 2.6 - 0.25, 0.0, 0.9)); }
        float terr = smoothstep(0.66 - 0.22 * uWet, 0.84 - 0.2 * uWet, vn(vP.xz * 0.0045 + 11.0)) * (1.0 - steep) * uGreen * (1.0 - flatTop) * smoothstep(900.0 - 420.0 * uWet, 1700.0 - 600.0 * uWet, vP.x);
        alb = mix(alb, vec3(0.22, 0.33, 0.13) * (0.8 + 0.4 * step(0.5, fract(vP.y * 0.16))), terr * (0.7 + 0.2 * uWet) * (1.0 - dens * (1.0 - 0.5 * uWet)));
        // plateau top: pale dust with wheel-worn lots
        vec3 dust = mix(uPale, vec3(0.62, 0.52, 0.40), 0.45) * (0.80 + 0.22 * n2v);
        // trodden earth, damp patches, wheel ruts and a scatter of litter where the market stands
        float dfade = flatTop * (1.0 - smoothstep(0.05, 0.3, fwP));
        dust *= 1.0 - dfade * (0.16 * (1.0 - n3) + 0.2 * smoothstep(0.52, 0.8, fbm(vP.xz * 0.23 + 7.0)));
        dust *= 1.0 - 0.12 * dfade * smoothstep(0.75, 0.95, tri(vP.z * 0.42 + 1.5 * vn(vP.xz * 0.11)));
        vec2 lc = floor(vP.xz * 4.0); float lh = h21(lc);
        dust = mix(dust, 0.5 + 0.4 * cos(6.2832 * (lh * 37.0 + vec3(0.0, 0.33, 0.67))), step(0.988, lh) * dfade * (1.0 - smoothstep(0.02, 0.08, fwP)) * 0.8);
        alb = mix(alb, dust, flatTop);
        // the ledge pitch
        vec2 pq = (vP.xz - uPitch.xy) / uPitch.zw;
        float inP = step(abs(pq.x), 1.0) * step(abs(pq.y), 1.0);
        float pwr = max(fwidth(pq.x), fwidth(pq.y)), pw = min(pwr * 1.2, 0.028) + 0.009;     // chalk lines keep their width at a glancing angle and fade instead
        float lines = max(max(1.0 - smoothstep(0.0, pw, abs(abs(pq.x) - 0.94)), 1.0 - smoothstep(0.0, pw * 1.6, abs(abs(pq.y) - 0.9))),
                          max(1.0 - smoothstep(0.0, pw, abs(pq.x)), 1.0 - smoothstep(0.0, pw * 2.0, abs(length(pq * vec2(1.0, 0.62)) - 0.2))));
        // the goal areas: a chalk box at each end
        float boxL = max(1.0 - smoothstep(0.0, pw, abs(abs(pq.x) - 0.70)), 1.0 - smoothstep(0.0, pw * 1.6, abs(abs(pq.y) - 0.42))) * step(0.70 - pw, abs(pq.x)) * step(abs(pq.y), 0.42 + pw * 1.6);
        lines = max(lines, boxL);
        lines *= step(abs(pq.x), 0.95) * step(abs(pq.y), 0.92) * clamp(0.035 / max(pwr, 1e-4), 0.3, 1.0);
        vec2 pc = floor((pq * 0.5 + 0.5) * vec2(5.0, 3.0));
        vec2 pf = fract((pq * 0.5 + 0.5) * vec2(5.0, 3.0)) - 0.5 - 0.3 * vec2(sin(uTime * 0.9 + pc.x * 2.1 + pc.y), cos(uTime * 0.7 + pc.y * 3.3 + pc.x));
        float dot14 = (1.0 - smoothstep(0.05, 0.09, length(pf * vec2(1.0, 0.7)))) * step(h21(pc + 2.0), 0.94);
        vec3 pitchCol = vec3(0.33, 0.205, 0.105) * (0.86 + 0.2 * n3 + 0.16 * (n2v - 0.5));
        pitchCol = mix(pitchCol, vec3(0.44, 0.31, 0.18), 0.6 * max(1.0 - smoothstep(0.0, 0.34, length((abs(pq) - vec2(0.84, 0.0)) * vec2(1.0, 0.7))), 0.7 * (1.0 - smoothstep(0.0, 0.3, length(pq * vec2(1.0, 0.62))))));   // worn pale where the play is
        pitchCol = mix(pitchCol, vec3(0.16, 0.20, 0.08), 0.5 * smoothstep(0.5, 0.75, vn(vP.xz * 0.5 + 9.0)) * smoothstep(0.55, 0.9, max(abs(pq.x), abs(pq.y))));          // weeds at the edges
        pitchCol = mix(pitchCol, vec3(0.80, 0.78, 0.72), lines * (0.62 + 0.3 * n3));
        pitchCol = mix(pitchCol, mix(vec3(0.7, 0.1, 0.1), vec3(0.1, 0.15, 0.6), step(0.5, h21(pc))), dot14 * uDots);
        // close to the eye the clay has grain: pebbles, stones, rills, trodden footpaths and specks of ichu
        float nearD = (1.0 - smoothstep(0.1, 0.5, fwP)) * (1.0 - flatTop);
        if (nearD > 0.001) {
          float g1 = vn(vP.xz * 2.3), g2 = vn(vP.xz * 7.1 + 3.0);
          alb *= 1.0 + nearD * (0.26 * (g1 - 0.5) + 0.18 * (g2 - 0.5));
          float rill = smoothstep(0.78, 0.97, tri(dot(vP.xz, vec2(0.13, 0.29)) + 1.8 * vn(vP.xz * 0.13) + vP.y * 0.23));
          alb *= 1.0 - 0.32 * rill * nearD;
          vec2 sc = floor(vP.xz * 1.6); vec2 sf = fract(vP.xz * 1.6) - 0.5 - (h22(sc) - 0.5) * 0.6; float sh2 = h21(sc + 5.0);
          float stone = step(sh2, 0.24) * (1.0 - smoothstep(0.10, 0.16 + fwP, length(sf) / (0.5 + sh2 * 2.5)));
          alb = mix(alb, vec3(0.40, 0.37, 0.33) * (0.6 + 2.2 * sh2), stone * nearD);
          float path = 1.0 - smoothstep(0.012, 0.035 + fwP * 0.05, abs(vn(vP.xz * 0.07 + 20.0) - 0.5));
          alb = mix(alb, uPale * 0.98, 0.55 * path * nearD * (1.0 - steep));
          vec2 ic = floor(vP.xz * 0.9); vec2 jf = fract(vP.xz * 0.9) - 0.5 - (h22(ic + 7.0) - 0.5) * 0.7;
          float ichu = step(h21(ic + 9.0), 0.34) * (1.0 - smoothstep(0.10, 0.2 + fwP, length(jf)));
          alb = mix(alb, mix(vec3(0.50, 0.42, 0.20), vec3(0.22, 0.30, 0.10), uGreen * 0.6) * (0.7 + 0.6 * g2), ichu * nearD * 0.85 * (1.0 - path));
        }
        alb = mix(alb, pitchCol, inP);

        float cloud = cloudShade(vP.xz) * rimShade(vP) * cabShade(vP) * hmShade(vP, vec3(0.0, 1.0, 0.0));
        if (vP.x > 950.0 && vP.x < 2400.0 && abs(vP.z - 120.0) < 900.0) cloud *= towerShade(vP, fwP);
        float sunT = max(dot(N, uSunDir), 0.0) * shade * cloud;
        float unlit = (1.0 - clamp(dot(N, uSunDir) * 4.0, 0.0, 1.0) * shade * cloud) * (1.0 - uNight);    // ground the sun does not reach takes the whole blue sky: a shadow is blue, not black
        vec3 light = uSunCol * sunT + uSkyCol * (0.5 + 0.5 * N.y) * ao * (1.0 + 0.9 * unlit) + uBrick * 0.10 * uFarK.z * (1.0 - 0.6 * N.y) * (0.35 + 0.65 * shade);
        light += uSunCol * vec3(0.10, 0.075, 0.055) * uFarK.z * (1.0 - shade * cloud) * (1.0 - uNight);       // sunlit clay across the gully throws a little warmth into the shade
        if (uNight > 0.5 && vP.x > 80.0 && vP.x < 350.0 && abs(vP.z) < 50.0) light += lampPool(vP) * 2.0;
        vec3 col = alb * light;
        gPd = district(vP.xz);

        // the city: real boxes found along the eye ray (see rcCity). Houses on the 9 m lattice near; rows, blocks and
        // whole blocks (18, 36, 72 m) as a house falls under about eight pixels, each pitch fading into the next, so the far
        // wall still shows lit roofs, a lit and a shaded wall and the shadow beside them at 3 km.
        if (dens > 0.004) {
          float sunK = shade * cloud;
          vec3 fill = uSunCol * vec3(0.10, 0.075, 0.055) * uFarK.z * sunK * (1.0 - uNight);
          vec3 gLit = alb * light * 0.9, gSh = alb * (light - uSunCol * sunT + fill) * 0.9;        // the ground between the houses, in the sun and in a house's shadow
          vec3 topLight = uSunCol * (uSunDir.y * sunK) + uSkyCol;
          vec3 dAvg = districtPaint(gPd.y, clamp(vn(vP.xz * 0.011 + 3.0) * 1.3 - 0.15, 0.0, 0.99));
          vec3 avgRoof = mix(mix(vec3(0.38, 0.36, 0.35), uBrick * 0.9, 0.55), dAvg * 0.8, 0.3 * gPd.x) * topLight;
          vec3 city = mix(gLit * 0.8, avgRoof * 0.9, 0.75);
          vec3 rd = (vP - uCam) / max(camD, 1.0);
          vec2 grad = -N0.xz / max(N0.y, 0.45);
          float dh = rd.y - dot(grad, rd.xz), sdh = uSunDir.y - dot(grad, uSunDir.xz);
          vec2 W0 = rcWarp(vP.xz);
          float px = camD * uPxK;
          if (dh < -0.012) {
            vec2 Wx = (rcWarp(vP.xz + vec2(6.0, 0.0)) - W0) / 6.0, Wz = (rcWarp(vP.xz + vec2(0.0, 6.0)) - W0) / 6.0;
            mat2 J = mat2(Wx, Wz); float det = J[0].x * J[1].y - J[1].x * J[0].y; det = abs(det) < 0.2 ? 0.2 : det;
            mat2 Ji = mat2(J[1].y, -J[0].y, -J[1].x, J[0].x) * (1.0 / det);
            vec2 gr = vec2(dot(Ji[0], grad), dot(Ji[1], grad));                    // the ground's gradient in the lattice
            vec2 dg = J * rd.xz, dsn = J * uSunDir.xz;
            gG0 = W0; gUv0 = (vP.xz - uBSRect.xy) * uBSRect.zw; gUvM = mat2(Ji[0] * uBSRect.zw, Ji[1] * uBSRect.zw);
            float lv = clamp(log2(max(px * 8.0, 9.0) / 9.0), 0.0, 3.0), l0 = min(floor(lv), 2.0), kb = smoothstep(RC_BAND, 1.0, lv - l0);
            float c0 = 9.0 * exp2(l0), hk0 = exp2(0.6 * l0);
            vec3 rc = rcCity(c0, hk0, dg, dh, gr, dsn, sdh, J, gLit, gSh, sunK, px);
            if (kb > 0.004) rc = mix(rc, rcCity(2.0 * c0, hk0 * 1.5157, dg, dh, gr, dsn, sdh, J, gLit, gSh, sunK, px), kb);
            city = mix(city, rc, smoothstep(0.012, 0.035, -dh) * (1.0 - smoothstep(24.0, 40.0, px)));
          }
          // by night the streets are lines of sodium light and each house a lamp; by day a window or a windscreen catches
          // the sun and lets it go again: points on the 9 m and 36 m lattices that hold a pixel
          {
            float full = clamp(dens * 2.5, 0.0, 1.0);
            vec2 g72 = abs(mod(W0 + 36.0, 72.0) - 36.0), g288 = abs(mod(W0 + 144.0, 288.0) - 144.0);
            float aw = 0.55 * fwP + 1e-3, hwA = max(7.0, 0.85 * fwP), hwS = max(3.5, 0.5 * fwP);
            float ave = 1.0 - smoothstep(hwA - aw, hwA + aw, min(g288.x, g288.y)), st = (1.0 - smoothstep(hwS - aw, hwS + aw, min(g72.x, g72.y))) * (1.0 - smoothstep(0.30, 0.75, fwP / 72.0));
            city += uNight * vec3(0.90, 0.55, 0.20) * (ave * 0.24 + st * 0.08) * full * (1.0 - 0.6 * smoothstep(1500.0, 2600.0, camD));
            float k9 = 1.0 - smoothstep(0.12, 0.30, fwP / 9.0), k36 = (1.0 - smoothstep(0.30, 0.80, fwP / 36.0)) * (1.0 - k9);
            vec2 c9 = floor(W0 / 9.0), q9 = fract(W0 / 9.0) - 0.29; float h9 = h21(c9 + 11.0), r9 = max(0.07, 0.7 * fwP / 9.0);
            float on9 = step(h21(c9 + 9.0), min(0.88, dens * 1.45)) * (1.0 - smoothstep(r9 * 0.55, r9, length(q9))) * k9;
            vec2 c36 = floor(W0 / 36.0), q36 = fract(W0 / 36.0) - 0.5 - (h22(c36 + 4.4) - 0.5) * 0.5; float hb = h21(c36 + 2.0), r36 = max(0.045, 0.75 * fwP / 36.0);
            float on36 = step(h21(c36 + 36.0), min(0.88, dens * 1.45)) * (1.0 - smoothstep(r36 * 0.55, r36, length(q36))) * k36;
            vec3 l9 = mix(vec3(1.0, 0.60, 0.22), vec3(0.82, 0.90, 1.0), step(0.64, h21(c9 + 17.0))), l36 = mix(vec3(1.0, 0.60, 0.22), vec3(0.82, 0.90, 1.0), step(0.64, h21(c36 + 17.0)));
            city += uNight * (l9 * on9 * 2.8 * (0.75 + 0.25 * sin(uTime * 1.7 + h9 * 50.0)) * step(0.35 + 0.5 * smoothstep(1.5, 5.0, fwP), h21(c9 + 23.0))
                            + l36 * on36 * step(0.3, hb) * (1.3 + 1.9 * hb) * (0.8 + 0.2 * sin(uTime * 1.3 + hb * 40.0)));
            float sp9 = max(sin(uTime * (0.9 + 1.6 * fract(h9 * 13.0)) + h9 * 97.0), 0.0), sp36 = max(sin(uTime * (0.9 + 1.6 * fract(hb * 13.0)) + hb * 97.0), 0.0);
            sp9 *= sp9; sp9 *= sp9; sp9 *= sp9; sp9 *= sp9; sp36 *= sp36; sp36 *= sp36; sp36 *= sp36; sp36 *= sp36;
            city += uSunCol * (1.0 - uNight) * sunK * (on9 * step(0.90, h9) * 2.2 * sp9 + on36 * step(0.80, hb) * 1.6 * sp36);
          }
          col = mix(col, city, smoothstep(0.004, 0.05, dens));
        }
        if (vP.x > 850.0) {
          vec3 lmLight = uSunCol * uSunDir.y * shade * cloud + uSkyCol;
          col = landmark(col, vP.xz, uLm[0], fwP, lmLight); col = landmark(col, vP.xz, uLm[1], fwP, lmLight);
          col = landmark(col, vP.xz, uLm[2], fwP, lmLight); col = landmark(col, vP.xz, uLm[3], fwP, lmLight);
          col = landmark(col, vP.xz, uLm[4], fwP, lmLight); col = landmark(col, vP.xz, uLm[5], fwP, lmLight);
          col = landmark(col, vP.xz, uLm[6], fwP, lmLight); col = landmark(col, vP.xz, uLm[7], fwP, lmLight);
        }
        col = bowlAir(col, vP);
        col = mix(col, uHaze * 1.25 * (uSunCol * 0.55 + uSkyCol * 1.4), seaVeil(vP.y) * 0.9);
        gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------- houses: three-face cubes that always turn their two visible walls to the eye, plus a ground shadow ----------
function buildCubeGeometry() {
  const P = [], Nn = [], F = [], I = [];
  const quad = (v, n, f) => { const b = P.length / 3; for (const q of v) { P.push(q[0], q[1], q[2]); Nn.push(n[0], n[1], n[2]); F.push(f); } I.push(b, b + 1, b + 2, b, b + 2, b + 3); };
  quad([[-0.5, 1, 0.5], [0.5, 1, 0.5], [0.5, 1, -0.5], [-0.5, 1, -0.5]], [0, 1, 0], 0);
  quad([[0.5, 0, 0.5], [0.5, 0, -0.5], [0.5, 1, -0.5], [0.5, 1, 0.5]], [1, 0, 0], 1);
  quad([[-0.5, 0, 0.5], [0.5, 0, 0.5], [0.5, 1, 0.5], [-0.5, 1, 0.5]], [0, 0, 1], 2);
  quad([[-0.5, 0, 0.5], [-0.5, 1, 0.5], [0.5, 1, -0.5], [0.5, 0, -0.5]], [0, 1, 0], 3);   // shadow: y = 1 marks the swept edge
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
  g.setAttribute('aFace', new THREE.Float32BufferAttribute(F, 1));
  g.setIndex(I);
  return g;
}

const CUBE_VERT = FOG_V_PARS + /* glsl */`
  uniform vec3 uSunDir; uniform vec3 uCam; uniform float uFarGrow;
  attribute float aFace; attribute vec3 iPos; attribute vec3 iSize0; attribute vec4 iRotGrad; attribute vec3 iCol; attribute vec4 iMisc;
  varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying vec4 vMisc; varying vec3 vUv; varying vec3 vSize; varying float vFace; varying vec2 vSunL;
  void main(){
    float c = iRotGrad.x, s = iRotGrad.y; vec2 grad = iRotGrad.zw;
    // across the bowl a house is a pixel or two: there half the blocks go and the rest stand half as large again, so the far city reads as blocks
    float grow = uFarGrow * smoothstep(750.0, 1250.0, max(iPos.x, abs(iPos.z) * 0.9));
    vec3 iSize = iSize0 * vec3(1.0 + 0.55 * grow, 1.0 + 0.3 * grow, 1.0 + 0.55 * grow) * (1.0 - grow * step(0.5, fract(iMisc.x * 17.31)));
    vSunL = vec2(c * uSunDir.x - s * uSunDir.z, s * uSunDir.x + c * uSunDir.z);
    vec3 p = position, n = normal; vec3 L; vec3 uv = vec3(0.0);
    float sink = (abs(grad.x) + abs(grad.y)) * max(iSize.x, iSize.z) * 0.5 + 0.6;
    if (aFace < 2.5) {
      vec3 dc = uCam - iPos; vec2 dl = vec2(c * dc.x - s * dc.z, s * dc.x + c * dc.z);
      float mx = dl.x < 0.0 ? -1.0 : 1.0, mz = dl.y < 0.0 ? -1.0 : 1.0;
      p.x *= mx; p.z *= mz; n.x *= mx; n.z *= mz;
      float rise = iMisc.y < 0.5 ? (0.25 + 0.55 * step(0.0, p.x)) * p.y : 0.0;
      L = vec3(p.x * iSize.x, p.y * (iSize.y + sink) - sink + rise, p.z * iSize.z);
      if (aFace < 0.5) { uv = vec3(L.x, L.z, 0.0); if (iMisc.y < 0.5) n = normalize(vec3(-0.55 / max(iSize.x, 1.0), 1.0, 0.0)); }
      else if (aFace < 1.5) uv = vec3(L.z + iSize.z * 0.5 + mx * 3.7, iSize.y - L.y + rise, L.y);
      else uv = vec3(L.x + iSize.x * 0.5 + mz * 9.1 + 17.0, iSize.y - L.y + rise, L.y);
    } else {
      // at a low sun the sweep would leave the slope as a slab in the air: it shrinks away (the long shadows of those
      // hours come from the rim shade and the height map), and it never reaches further than 5 m
      vec2 sl = vSunL; float lowSun = smoothstep(0.25, 0.5, uSunDir.y);
      vec2 o = -sl / max(uSunDir.y, 0.55) * (iSize.y + 0.5) * lowSun;
      o *= min(1.0, 5.0 / max(length(o), 1e-3)) * (1.0 - smoothstep(0.55, 0.95, length(grad)));   // on ground steeper than about 35 degrees the sweep would stand off the slope as a dark slab: there the house keeps its shadow under itself
      p.x *= o.x < 0.0 ? -1.0 : 1.0; p.z *= o.y < 0.0 ? -1.0 : 1.0;
      vec2 xz = p.xz * iSize.xz + o * p.y;
      vec2 wxz = vec2(c * xz.x + s * xz.y, -s * xz.x + c * xz.y);
      L = vec3(xz.x, dot(grad, wxz) + 0.28 + 0.15 * length(grad) * length(xz) + 0.0007 * length(uCam - iPos), xz.y);
    }
    vec3 W = iPos + vec3(c * L.x + s * L.z, L.y, -s * L.x + c * L.z);
    vN = vec3(c * n.x + s * n.z, n.y, -s * n.x + c * n.z);
    vP = W; vCol = iCol; vMisc = iMisc; vUv = uv; vSize = iSize; vFace = aFace;
    vec4 mvPosition = modelViewMatrix * vec4(W, 1.0); gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;

const CUBE_FRAG = FOG_F_PARS + GLSL_COMMON + /* glsl */`
  uniform vec3 uBrick; uniform vec3 uPale;
  varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying vec4 vMisc; varying vec3 vUv; varying vec3 vSize; varying float vFace; varying vec2 vSunL;
  void main(){
    float seed = vMisc.x, roofType = vMisc.y, shade = vMisc.z;
    float cloud = cloudShade(vP.xz) * rimShade(vP) * cabShade(vP);
    vec2 dU = fwidth(vUv.xy);
    vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0));
    vec3 col;
    vec3 lampC = mix(vec3(1.0, 0.62, 0.26), vec3(0.85, 0.92, 1.0), step(0.62, fract(seed * 7.7)));
    if (vFace > 2.5) {
      // hard blue-black shadow thrown on the clay
      vec3 earth = mix(uPale, uBrick, 0.42) * 0.80;
      col = earth * (uSkyCol * 0.9 + uBrick * 0.03);
    } else if (vFace > 0.5) {
      vec2 uv = vUv.xy;
      float bay = 3.1 + fract(seed * 7.3) * 0.7;
      vec2 g = vec2(uv.x / bay, uv.y / 2.7);
      float lod = 1.0 - smoothstep(0.12, 0.45, max(dU.x / bay, dU.y / 2.7));
      vec2 id = floor(g), f = fract(g);
      float painted = step(0.5, vMisc.w);
      vec3 brick = vCol * (0.86 + 0.26 * vn(uv * vec2(1.3, 4.0) + seed * 40.0));
      float course = 0.93 + 0.07 * step(0.5, fract(uv.y * 5.5));
      brick *= mix(1.0, course, lod * (1.0 - painted));
      vec3 conc = vec3(0.50, 0.49, 0.47) * (0.85 + 0.2 * vn(uv * 2.0 + seed));
      float frame = max(step(f.y, 0.11), step(0.455, abs(f.x - 0.5)));
      float hw = h21(id + seed * 91.0);
      float wxh = 0.2 + 0.08 * fract(hw * 9.0), wqx = abs(f.x - 0.5) / wxh, wqy = (f.y - 0.36) / 0.38;
      float win = step(0.3, hw) * step(wqx, 1.0) * step(0.0, wqy) * step(wqy, 1.0);
      // near the eye a window has a pale frame with a mullion and a concrete sill under it (f.y runs down the wall)
      float fineW = 1.0 - smoothstep(0.035, 0.10, max(dU.x, dU.y));
      float wfr = win * max(max(step(0.84, wqx), step(wqx, 0.07)), max(step(0.9, wqy), step(wqy, 0.1))) * fineW;
      float sill = step(0.3, hw) * step(wqx, 1.22) * step(abs(wqy - 1.1), 0.1) * fineW;
      float open = step(0.82, hw);                               // unglazed black hole
      vec3 V = normalize(uCam - vP + vec3(0.0, 1e-3, 0.0));
      vec3 R = reflect(-V, N);
      vec3 glass = mix(vec3(0.03, 0.04, 0.06), uSkyCol * 1.6 + vec3(0.05), (1.0 - open) * smoothstep(-0.2, 0.6, R.y) * 0.8);
      vec3 curtain = mix(vec3(0.75, 0.7, 0.6), vec3(0.2, 0.45, 0.6), fract(hw * 23.0));
      glass = mix(glass, curtain * 0.5, step(0.62, fract(hw * 5.0)) * (1.0 - open) * step(0.55, f.y));
      vec3 wall = mix(brick, conc, frame * (1.0 - 0.75 * painted));
      wall = mix(wall, conc * 1.2, sill);
      wall = mix(wall, vec3(0.66, 0.64, 0.58) * (0.55 + 0.45 * fract(hw * 3.0)), wfr);
      vec3 detail = wall;
      float sunT = max(dot(N, uSunDir), 0.0) * shade * cloud;
      vec3 light = uSunCol * min(sunT * 1.9, 1.0) + uSkyCol * 0.55 + vec3(0.34, 0.25, 0.17) * uFarK.z * (0.3 + 0.7 * shade) * (0.3 + 0.7 * cloud) * (1.0 - 0.75 * uNight) * (1.0 - 0.5 * smoothstep(0.0, 8.0, vUv.z));
      detail = detail * light;
      vec3 glassL = glass * (0.5 + sunT) + uSunCol * 5.0 * pow(max(dot(R, uSunDir), 0.0), 240.0) * (1.0 - open) * shade;
      detail = mix(detail, glassL, win * (1.0 - wfr));
      vec3 flatC = mix(brick, conc, 0.24 * (1.0 - 0.75 * painted)) * light * 0.93;
      col = mix(flatC, detail, lod);
      // grime under the roof line, damp at the foot
      float streak = vn(vec2(uv.x * 1.7 + seed * 13.0, 0.5)) * (1.0 - smoothstep(0.0, 1.8, uv.y));
      col *= 1.0 - 0.28 * streak;
      col *= 0.62 + 0.38 * smoothstep(-0.4, 1.6, vUv.z);
      float litW = step(0.52, fract(hw * 37.0)) * (0.7 + 0.3 * sin(uTime * 0.9 + hw * 60.0));
      vec2 lq = vec2(mod(uv.x + seed * 9.0, 9.0) - 4.5, uv.y - 1.6) / max(0.6, 0.8 * max(dU.x, dU.y));
      float farLamp = (1.0 - smoothstep(0.5, 1.0, length(lq))) * step(0.45, fract(seed * 13.7));
      col += uNight * lampC * (win * (1.0 - wfr) * litW * lod * 3.2 * (1.0 - open) + (1.0 - lod) * farLamp * 2.4);
    } else {
      vec2 uv = vUv.xy; vec2 hs = vSize.xz * 0.5;
      float px = max(max(dU.x, dU.y), 1e-4);
      float lod = 1.0 - smoothstep(0.10, 0.5, px), fine = 1.0 - smoothstep(0.035, 0.16, px);
      float edge = min(hs.x - abs(uv.x), hs.y - abs(uv.y));
      vec2 sl = vSunL / max(uSunDir.y, 0.35);                         // roof-space reach of a shadow per metre of height
      vec3 alb; float gl = 0.0, shd = 1.0, twk = 0.0;
      if (roofType < 0.5) {
        // tin sheets weighted with stones and old tyres: rust in soft stains that gather along the laps, each sheet
        // only a touch lighter or darker than the next
        vec2 sg = vec2(uv.x / 2.4, uv.y / 0.95) + seed * 31.0; vec2 sf = fract(sg);
        float hsht = h21(floor(sg));
        float rustN = 0.55 * vn(uv * 0.45 + seed * 5.0) + 0.3 * vn(uv * 1.7 + seed * 11.0) + 0.15 * vn(uv * 6.0);
        float rust = max(0.85 * step(0.70, fract(hsht * 7.31 + seed * 3.1)), 0.8 * smoothstep(0.58, 0.84, rustN + 0.10 * (hsht - 0.5)));   // about three sheets in ten have rusted through
        rust = max(rust, 0.5 * fine * (1.0 - smoothstep(0.0, 0.1, min(sf.y, 1.0 - sf.y))) * smoothstep(0.35, 0.6, rustN));
        vec3 tin = vec3(0.44, 0.46, 0.50);
        float rc = fract(seed * 23.7);
        vec3 tinP = rc < 0.1 ? vec3(0.42, 0.10, 0.06) : (rc < 0.2 ? vec3(0.07, 0.27, 0.16) : vec3(0.08, 0.18, 0.44));
        tin = mix(tin, tinP * (0.85 + 0.3 * hsht), step(rc, 0.3) * 0.8);
        tin = mix(tin, vCol * 0.8, step(0.5, vMisc.w) * step(0.5, fract(seed * 31.3)) * 0.7);
        tin *= (0.78 + 0.44 * hsht) * (1.0 + 0.08 * vec3(hsht - 0.5, 0.0, 0.5 - hsht));
        tin = mix(tin, vec3(0.38, 0.20, 0.11) * (0.8 + 0.5 * vn(uv * 3.0 + seed)), rust);
        float corr = 0.84 + 0.16 * sin(uv.y * 26.0);
        float lap = clamp(0.6 * (1.0 - smoothstep(0.0, 0.05, sf.y)) + (1.0 - smoothstep(0.0, 0.016, sf.x)), 0.0, 1.0);
        alb = tin * mix(1.0, corr, lod * (1.0 - smoothstep(0.02, 0.09, px))) * (1.0 - 0.42 * lap * fine);
        vec2 nq = vec2((fract(uv.x / 0.8) - 0.5) * 3.4, fract(uv.y / 0.2375) - 0.5);           // nail heads along the laps
        alb *= 1.0 - 0.5 * (1.0 - smoothstep(0.012, 0.045, px)) * (1.0 - smoothstep(0.05, 0.09, length(nq)));
        vec2 sgr = uv / 1.5 + seed * 17.0; vec2 sid = floor(sgr); vec2 sc0 = (h22(sid) - 0.5) * 0.5;
        vec2 sfr = fract(sgr) - 0.5 - sc0;
        float hr = h21(sid + 4.0); float rr = length(sfr) * 1.5, rs = length(sfr + sl * 0.12) * 1.5;
        float stone = step(hr, 0.34) * (1.0 - smoothstep(0.16, 0.2, rr));
        float tyre = step(0.34, hr) * step(hr, 0.44) * (1.0 - smoothstep(0.30, 0.34, rr)) * smoothstep(0.15, 0.19, rr);
        shd *= 1.0 - 0.8 * lod * step(hr, 0.44) * (1.0 - smoothstep(0.15, 0.24 + 0.14 * step(0.34, hr), rs));
        alb = mix(alb, vec3(0.36, 0.32, 0.28) * (0.75 + 0.6 * fract(hr * 31.0)), stone * lod);
        alb = mix(alb, vec3(0.03) + 0.03 * smoothstep(0.2, 0.3, rr), tyre * lod);
        alb *= 1.0 - 0.10 * (1.0 - lod);
        gl = step(0.45, hsht) * step(fract(seed * 11.7), 0.5) * (1.0 - rust);
        // six tin roofs in ten have a spot that catches the sun and lets it go again: the bowl twinkles
        vec2 tq = uv - (vec2(fract(seed * 5.3), fract(seed * 9.1)) - 0.5) * max(vSize.xz - 1.5, vec2(0.5));
        float trad = max(0.2, 1.1 * px);
        twk = step(fract(seed * 11.7), 0.6) * (1.0 - smoothstep(trad * 0.5, trad, length(tq))) * pow(max(sin(uTime * (1.0 + 2.0 * fract(seed * 7.3)) + seed * 90.0), 0.0), 20.0) * min(1.0, 0.2 / max(px, 0.02) + 0.35);
      } else {
        // concrete slab with a brick parapet, a water tank, washing on a line, rebar where it is unfinished
        vec3 slab = mix(vec3(0.34, 0.32, 0.30), vCol * 0.62, 0.4 * step(0.5, vMisc.w)) * (0.82 + 0.25 * vn(uv * 0.8 + seed * 9.0));
        slab *= 1.0 - 0.2 * fine * smoothstep(0.5, 0.72, vn(uv * 2.3 + seed * 3.0));                      // stains and patches
        slab *= 1.0 - 0.18 * fine * step(0.93, fract(uv.x / 2.7 + seed)) ;                                // pour joints
        float hasPar = step(roofType, 1.5);
        float par = 1.0 - smoothstep(0.28, 0.34, edge);
        alb = mix(slab, vCol * 0.95 * (0.9 + 0.2 * step(0.5, fract((uv.x + uv.y) * 2.2)) * fine), par * hasPar);
        alb *= 1.0 - 0.45 * hasPar * lod * (1.0 - smoothstep(0.0, 0.07 + px, abs(edge - 0.33)));          // the dark inner face of the parapet
        // the parapet's shade on the slab along the two sides toward the sun
        vec2 din = (hs - 0.33) - uv * vec2(sl.x < 0.0 ? -1.0 : 1.0, sl.y < 0.0 ? -1.0 : 1.0);
        vec2 reach = 0.6 * abs(sl);
        float pSh = max(1.0 - smoothstep(reach.x - px, reach.x + px + 0.03, din.x), 1.0 - smoothstep(reach.y - px, reach.y + px + 0.03, din.y));
        shd *= 1.0 - pSh * hasPar * (1.0 - par) * lod;
        // a water tank: a lit drum with a lid, and the shadow it throws
        vec2 tc = (vec2(fract(seed * 5.3), fract(seed * 9.1)) - 0.5) * (vSize.xz - 2.6);
        vec2 pa = uv - tc, ba = -sl * 1.05; float td = length(pa);
        float hasTank = step(fract(seed * 13.3), 0.7);
        float hseg = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
        shd *= 1.0 - hasTank * lod * (1.0 - smoothstep(0.58, 0.70, length(pa - ba * hseg)));
        vec3 tankC = fract(seed * 2.7) < 0.55 ? vec3(0.03, 0.03, 0.035) : vec3(0.05, 0.16, 0.50);
        vec2 sn = vSunL / max(length(vSunL), 1e-3);
        float tsh = 0.62 + 0.55 * clamp(dot(pa / max(td, 1e-3), sn) * smoothstep(0.2, 0.6, td), -1.0, 1.0);
        vec3 tk = tankC * tsh + 0.09 * (1.0 - smoothstep(0.0, 0.3, length(pa - sn * 0.2)));
        tk = mix(tk, tankC * 0.45, (1.0 - smoothstep(0.0, 0.035 + px, abs(td - 0.28))) * fine);           // lid
        float tank = (1.0 - smoothstep(0.62, 0.70, td)) * hasTank;
        alb = mix(alb, tk, tank); shd = mix(shd, 1.0, tank);
        // washing: a thin row of cloths that snap in the wind, and their shade beside them
        float ly = (fract(seed * 4.9) - 0.5) * (vSize.z - 2.0);
        float lx = uv.x * 1.4 + seed * 3.0; float cid = floor(lx);
        float flut = 0.10 * sin(uTime * 5.0 + cid * 2.3 + uv.x * 3.0) * (0.5 + 0.5 * sin(uTime * 0.7 + seed * 6.0));
        float hasW = step(fract(seed * 6.1), 0.55) * hasPar * lod * (1.0 - tank);
        float cOn = step(0.16, fract(lx)) * step(h11(cid * 1.7 + seed * 3.0), 0.75) * step(abs(uv.x), hs.x - 0.6);
        float cw = 0.07 + 0.05 * h11(cid + seed);
        float cloth = (1.0 - smoothstep(cw, cw + px + 0.02, abs(uv.y - ly - flut))) * cOn;
        float cshade = (1.0 - smoothstep(0.22, 0.32 + px, abs(uv.y - ly + sl.y * 1.1))) * cOn;
        shd *= 1.0 - 0.7 * cshade * hasW * (1.0 - cloth);
        vec3 cc = 0.5 + 0.5 * cos(6.2832 * (h11(cid + seed * 8.0) + vec3(0.0, 0.33, 0.67)));
        cc = mix(mix(cc, vec3(dot(cc, vec3(0.333))), 0.35) * 0.72, vec3(0.84, 0.82, 0.76), step(0.6, h11(cid * 3.1 + seed)));
        alb = mix(alb, cc, cloth * hasW);
        alb = mix(alb, vec3(0.05), (1.0 - smoothstep(0.0, 0.02 + px, abs(uv.y - ly))) * hasW * fine * (1.0 - cloth) * step(abs(uv.x), hs.x - 0.5));   // the line
        if (roofType > 1.5) {
          vec2 cg = (uv + hs) / 3.3; vec2 cf = abs(fract(cg + 0.5) - 0.5) * 3.3;
          float stub = 1.0 - smoothstep(0.16, 0.24, max(cf.x, cf.y));
          vec2 cf2 = abs(fract(cg + 0.5 + sl * 0.4 / 3.3) - 0.5) * 3.3;
          shd *= 1.0 - 0.75 * lod * (1.0 - smoothstep(0.16, 0.26, max(cf2.x, cf2.y)));
          alb = mix(alb, vec3(0.20, 0.13, 0.10), stub * lod);
          alb = mix(alb, vCol * 0.8, step(0.86, vn(uv * 1.9 + seed * 3.0)) * 0.8 * lod);
        }
      }
      float sunT = max(dot(N, uSunDir), 0.0) * shade * cloud * shd;
      col = alb * (uSunCol * sunT * 1.05 + uSkyCol * (0.9 + 0.35 * (1.0 - shd) * (1.0 - uNight)) + uSunCol * vec3(0.10, 0.07, 0.045) * uFarK.z * (1.0 - shd));
      col *= 0.8 + 0.2 * smoothstep(0.0, 0.5, edge + (1.0 - lod));
      // pinpoint glints that slide over the tin as the eye moves
      vec3 V = normalize(uCam - vP + vec3(0.0, 1e-3, 0.0));
      vec3 Ng = normalize(N + 0.10 * vec3(fract(seed * 19.0) - 0.5, 0.0, fract(seed * 29.0) - 0.5));
      vec3 Rr = reflect(-V, Ng);
      // wet season: standing water on a quarter of the roof area mirrors the sky and flashes
      float wetM = uWet * smoothstep(0.48, 0.60, vn(uv * 0.6 + seed * 31.0)) * (roofType < 0.5 ? 0.6 : 1.0) * smoothstep(0.0, 0.5, edge);
      float fre = 0.22 + 0.78 * pow(1.0 - clamp(dot(V, N), 0.0, 1.0), 3.0);
      col = mix(col, mix(col * 0.5, mix(uHaze, uZen, smoothstep(0.02, 0.22, Rr.y)) * (0.5 + 0.5 * cloud), fre), wetM);
      gl = max(gl, 1.5 * wetM);
      float sp = pow(max(dot(Rr, uSunDir), 0.0), 700.0);
      col += uSunCol * (6.0 * sp * gl + 3.0 * twk) * shade * cloud * (1.0 - uNight);
      col += uNight * lampC * 0.02;
    }
    if (vFace < 2.5) col = mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2))) * vec3(1.06, 0.98, 0.9), 0.34 * step(0.5, vMisc.w) * smoothstep(420.0, 820.0, length(uCam - vP)) * (1.0 - uNight));
    col = bowlAir(col, vP);
    col = mix(col, uHaze * 1.25 * (uSunCol * 0.55 + uSkyCol * 1.4), seaVeil(vP.y) * 0.9);
    gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
    #include <fog_fragment>
  }`;

// ---------- switchback roads: level ribbons benched into the wall, with retaining skirts ----------
const roadKey = (x, z) => (Math.floor(x / 8) + 2048) * 8192 + (Math.floor(z / 8) + 4096);
function buildRoads(bowl, rng, pal, U, sun) {
  const P = [], Nn = [], Rd = [], Sh = [], I = [], taken = new Set(), lines = [];
  const tmp = { x: 0, z: 0 };
  const sl = Math.hypot(sun.x, sun.z) || 1, sx = sun.x / sl, sz = sun.z / sl, tanE = sun.y / sl;
  const shadeAt = (x, y, z) => {                                            // the shadow a ridge throws on the road (as the terrain bakes it)
    let sh = 1;
    for (const st of [30, 85, 210]) { const over = bowl.height(x + sx * st, z + sz * st) - (y + st * tanE); if (over > 0) sh = Math.min(sh, 1 - clamp(over / (st * 0.3), 0, 1)); }
    return sh;
  };
  const specs = [{ s0: 0, amp: 96, per: 318, ph: 203, d0: 58, d1: 893, w: ROAD0_W }];
  const extra = [-rng.range(390, 480), rng.range(430, 540), (Math.PI - rng.range(0.15, 0.45)) * 1750, -(Math.PI - rng.range(0.25, 0.6)) * 1750, rng.range(1500, 2300) * rng.sign()];
  for (const s0 of extra) specs.push({ s0, amp: rng.range(85, 125), per: rng.range(270, 350), ph: rng.range(0, 300), d0: rng.range(24, 60), d1: 893, w: 9 });
  const addLine = (pts, w) => {
    const b0 = P.length / 3, n = pts.length; lines.push(pts); let along = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], p = pts[i];
      if (i > 0) along += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]);
      let tx = b[0] - a[0], tz = b[2] - a[2]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      const nx = -tz, nz = tx, hw = w * 0.5, tone = 0.9 + 0.2 * rng(), sh = shadeAt(p[0], p[1], p[2]);
      for (let k = -1; k <= 1; k += 2) taken.add(roadKey(p[0] + nx * 5 * k, p[2] + nz * 5 * k));
      taken.add(roadKey(p[0], p[2]));
      // aRd = (metres across | metres down the skirt, metres along, 0 road | 1 skirt, half width)
      const put = (ox, oy, nrx, nry, nrz, u, part) => { P.push(p[0] + nx * ox, p[1] + oy, p[2] + nz * ox); Nn.push(nrx, nry, nrz); Rd.push(u, along, part, hw); Sh.push(sh, tone); };
      put(-hw, 0, 0, 1, 0, -hw, 0); put(hw, 0, 0, 1, 0, hw, 0);
      put(-hw, 0, -nx, 0.5, -nz, 0, 1); put(-hw - 2.2, -7, -nx, 0.5, -nz, 7.3, 1);
      put(hw, 0, nx, 0.5, nz, 0, 1); put(hw + 2.2, -7, nx, 0.5, nz, 7.3, 1);
      if (i < n - 1) { const q = b0 + i * 6, r = q + 6; I.push(q, q + 1, r, q + 1, r + 1, r, q + 2, r + 2, q + 3, r + 2, r + 3, q + 3, q + 4, q + 5, r + 4, q + 5, r + 5, r + 4); }
    }
  };
  for (const sp of specs) {
    const pts = [];
    for (let d = sp.d0; d <= sp.d1; d += 6.5) {
      const sway = sp.amp * (2 / Math.PI) * Math.asin(0.965 * Math.sin(2 * Math.PI * (d - sp.ph) / sp.per));
      bowl.at(d, (sp.s0 + sway) / (1750 * (1 - d / 2100)), tmp);
      pts.push([tmp.x, bowl.height(tmp.x, tmp.z) + 2.3, tmp.z]);
    }
    for (let i = 1; i < pts.length - 1; i++) pts[i][1] = (pts[i - 1][1] + pts[i][1] * 2 + pts[i + 1][1]) * 0.25;
    addLine(pts, sp.w);
  }
  // the avenue across the floor to the towers and on to the far wall
  const av = [];
  for (let i = 0; i <= 70; i++) { const x = 895 + i * 26, z = 60 + 110 * Math.sin(i * 0.09) + 40 * Math.sin(i * 0.31); av.push([x, bowl.height(x, z) + 0.8, z]); }
  addLine(av, 13);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
  g.setAttribute('aRd', new THREE.Float32BufferAttribute(Rd, 4));
  g.setAttribute('aSh', new THREE.Float32BufferAttribute(Sh, 2));
  g.setIndex(I);
  // worn asphalt with a dashed centre line, pale kerbs and dust blown in from the verges; the retaining skirt is laid in
  // stone-block courses with a darker foot. Self-lit like the terrain, so cloud and ridge shadows cross it too.
  const mat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uBrick: { value: pal.brick }, uPale: { value: pal.pale } }]),
    vertexShader: FOG_V_PARS + /* glsl */`
      attribute vec4 aRd; attribute vec2 aSh; varying vec3 vP; varying vec3 vN; varying vec4 vRd; varying vec2 vSh;
      void main(){ vP = position; vN = normal; vRd = aRd; vSh = aSh;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F_PARS + GLSL_COMMON + /* glsl */`
      uniform vec3 uBrick; uniform vec3 uPale;
      varying vec3 vP; varying vec3 vN; varying vec4 vRd; varying vec2 vSh;
      void main(){
        vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0));
        float pxA = max(fwidth(vRd.x), 1e-4), pxL = max(fwidth(vRd.y), 1e-4), px = max(pxA, pxL);
        float n1 = vn(vP.xz * 0.55), n2 = vn(vP.xz * 3.3 + 7.0), hw = max(vRd.w, 1.0); vec3 alb;
        if (vRd.z < 0.5) {
          float ax = abs(vRd.x), lod = 1.0 - smoothstep(0.2, 0.9, px);
          alb = vec3(0.215, 0.20, 0.185) * (0.80 + 0.30 * n1 + 0.14 * n2 * lod) * vSh.y;
          alb *= 1.0 - 0.16 * (1.0 - smoothstep(0.3, 0.9, abs(ax - hw * 0.46))) * (0.55 + 0.45 * vn(vec2(vRd.x * 2.0, vRd.y * 0.07)));   // wheel tracks
          alb = mix(alb, vec3(0.16, 0.15, 0.145), 0.6 * lod * smoothstep(0.62, 0.8, vn(vec2(vRd.y * 0.12, vRd.x * 0.5) + 9.0)));       // tar patches
          float dustE = smoothstep(hw * 0.5, hw, ax + 1.1 * (vn(vec2(vRd.y * 0.19, 3.0)) - 0.5));
          alb = mix(alb, vec3(0.46, 0.37, 0.27) * (0.85 + 0.3 * n2), 0.6 * dustE);                                                    // dust blown in from the verges
          alb = mix(alb, vec3(0.44, 0.36, 0.27), 0.45 * smoothstep(0.55, 0.85, vn(vec2(vRd.y * 0.045, vRd.x * 0.9 + 4.0))) * (1.0 - smoothstep(0.0, hw, ax)));   // tyre-dust streaks
          float dash = (1.0 - smoothstep(0.10, 0.10 + pxA, ax)) * mix(0.5, step(fract(vRd.y / 9.0), 0.5), 1.0 - smoothstep(1.5, 5.0, pxL));
          alb = mix(alb, vec3(0.62, 0.57, 0.40), dash * clamp(0.22 / pxA, 0.25, 0.85));
          float kerb = smoothstep(hw - 0.62 - pxA, hw - 0.62, ax);
          vec3 kc = mix(vec3(0.55, 0.53, 0.49), vec3(0.47, 0.15, 0.11), step(0.5, fract(vRd.y / 2.6)) * (1.0 - smoothstep(0.3, 1.0, pxL)));
          alb = mix(alb, kc * (0.85 + 0.25 * n2), kerb);
        } else {
          float h = vRd.x, lod = 1.0 - smoothstep(0.12, 0.5, px);
          float crs = h / 0.62, row = floor(crs), fc = fract(crs);
          float bx = vRd.y / 1.35 + 0.5 * mod(row, 2.0) + 0.37 * h21(vec2(row, 3.0)), fb = fract(bx), hb = h21(vec2(floor(bx), row));
          float joint = max(1.0 - smoothstep(0.0, 0.07 + pxA / 0.62, min(fc, 1.0 - fc)), 1.0 - smoothstep(0.0, 0.04 + pxL / 1.35, min(fb, 1.0 - fb)));
          alb = mix(uPale * 0.82, uBrick * 0.95, 0.30 + 0.34 * hb * lod) * (0.74 + 0.36 * mix(0.5, hb, lod)) * (0.9 + 0.2 * n1);
          alb *= 1.0 - 0.5 * joint * lod;
          alb *= 1.0 - 0.5 * smoothstep(2.6, 7.3, h);                                                 // a darker, damper foot
          alb = mix(alb, vec3(0.50, 0.48, 0.45), (1.0 - smoothstep(0.22, 0.30 + pxA, h)) * 0.8);       // concrete coping under the kerb
          alb = mix(alb, alb * vec3(0.55, 0.6, 0.45), 0.5 * lod * smoothstep(0.55, 0.8, vn(vec2(vRd.y * 0.3, h * 0.8) + 5.0)) * smoothstep(2.0, 6.0, h));   // weeds and damp
        }
        float sh = vSh.x * cloudShade(vP.xz) * rimShade(vP) * hmShade(vP, N);
        float sunT = max(dot(N, uSunDir), 0.0) * sh;
        float unlit = (1.0 - clamp(dot(N, uSunDir) * 4.0, 0.0, 1.0) * sh) * (1.0 - uNight);
        vec3 light = uSunCol * sunT + uSkyCol * (0.5 + 0.5 * N.y) * (1.0 + 0.9 * unlit) + uBrick * 0.10 * uFarK.z * (1.0 - 0.6 * N.y) * (0.35 + 0.65 * sh);
        vec3 col = bowlAir(alb * light, vP);
        col = mix(col, uHaze * 1.25 * (uSunCol * 0.55 + uSkyCol * 1.4), seaVeil(vP.y) * 0.9);
        gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
        #include <fog_fragment>
      }`,
  });
  Object.assign(mat.uniforms, U);
  const mesh = new THREE.Mesh(g, mat);
  return { mesh, taken, lines };
}

// ---------- house placement ----------
async function buildCubes(ctx, bowl, rng, pal, sun, roads, pylonXZ, opts, U) {
  const height = bowl.heightPlace, info = bowl.info, detail = ctx.quality?.detail ?? 1;
  const NEAR_MAX = Math.round(9000 * (0.55 + 0.45 * detail)), FAR_MAX = Math.round(15000 * (0.55 + 0.45 * detail));
  const sl = Math.hypot(sun.x, sun.z) || 1, sx = sun.x / sl, sz = sun.z / sl, tanE = sun.y / sl;
  const paints = [new THREE.Color('#9fc4dc'), new THREE.Color('#e9e6dc'), new THREE.Color('#a9d8c0'), new THREE.Color('#d9c48f'), pal.green.clone().lerp(new THREE.Color('#ffffff'), 0.35)];
  const brickHot = pal.brick.clone().lerp(new THREE.Color('#cf7f4c'), 0.55), brickDark = pal.brick.clone().multiplyScalar(0.7);
  const paintFrac = rng.range(0.1, 0.2), tinFrac = rng.range(0.48, 0.64), clearNear = opts.clearNear ?? 0;
  const tmpC = new THREE.Color();
  function makeSet(max) {
    return { n: 0, max, pos: new Float32Array(max * 3), size: new Float32Array(max * 3), rg: new Float32Array(max * 4), col: new Float32Array(max * 3), misc: new Float32Array(max * 4) };
  }
  function tryPlace(set, x, z, big) {
    const h = height(x, z); const d = info.d;
    if (d < 17 || h < FLOOR_Y - 4) return false;
    if (roads.taken.has(roadKey(x, z))) return false;
    for (let i = 0; i < pylonXZ.length; i += 2) if (Math.abs(x - pylonXZ[i]) < 8 && Math.abs(z - pylonXZ[i + 1]) < 9) return false;
    const p = bowl.pitchOld; if (Math.abs(x - p.x) < p.hx + 6 && Math.abs(z - p.z) < p.hz + 6) return false;
    const gx = (height(x + 3, z) - h) / 3, gz = (height(x, z + 3) - h) / 3, slope = Math.hypot(gx, gz);
    if (slope > 0.84) return false;
    if (slope > 0.56 && rng() < (slope - 0.56) * 2.6) return false;
    let w = (big ? rng.range(9, 15) : rng.range(5.2, 8.6)), dp = (big ? rng.range(8, 13) : rng.range(5, 8));
    const fr = rng(); let floors = fr < 0.27 ? 1 : fr < 0.66 ? 2 : fr < 0.9 ? 3 : 4; if (big) floors += rng.int(0, 2);
    if (slope > 0.45) { w *= 0.85; dp *= 0.85; }
    let roof = rng() < tinFrac ? 0 : (rng() < 0.3 ? 2 : 1);
    // keep the ride clear: every roof at least 6.3 m from the eye line
    const az = Math.abs(z);
    if (x > -30 && x < RIDE_X1 + 40 && az < 14) {
      if (az < clearNear && x > 95 && x < 335) return false;
      const reach = Math.max(0, az - (w + dp) * 0.36);
      if (reach < 6.4) {
        const drop = Math.sqrt(6.4 * 6.4 - reach * reach) + 0.9;
        const capY = Math.min(eyeY(x - 5), eyeY(x + 5)) - drop;
        while (floors > 0 && h + floors * 2.7 + 0.3 + 0.9 > capY) floors--;
        if (floors < 1) return false;
      }
    }
    if (x > RIDE_X1 && x < STATION_X + 20 && az < 16 && h + floors * 2.7 + 6 > eyeY(x)) return false;
    let shade = 1;
    if (!big && slope > 0.3) { const o1 = height(x + sx * 20, z + sz * 20) - (h + 3 + 20 * tanE); if (o1 > 0) shade = 1 - clamp(o1 / 6, 0, 1); }
    const i = set.n++;
    let ang = slope > 0.06 ? Math.atan2(-gz, gx) : ctx.noise.n2(x / 300, z / 300) * 3;
    ang += rng.range(-0.1, 0.1) + (rng() < 0.12 ? rng.range(-0.5, 0.5) : 0);
    set.pos[i * 3] = x; set.pos[i * 3 + 1] = h; set.pos[i * 3 + 2] = z;
    set.size[i * 3] = w; set.size[i * 3 + 1] = floors * 2.7 + 0.3; set.size[i * 3 + 2] = dp;
    set.rg[i * 4] = Math.cos(ang); set.rg[i * 4 + 1] = Math.sin(ang); set.rg[i * 4 + 2] = gx; set.rg[i * 4 + 3] = gz;
    let painted = 0; const pr = rng();
    if (pr < paintFrac) { tmpC.copy(rng.pick(paints)).multiplyScalar(rng.range(0.7, 0.9)); painted = 1; }
    else if (pr < paintFrac + 0.07) { tmpC.setRGB(0.42, 0.41, 0.40).multiplyScalar(rng.range(0.85, 1.1)); painted = 1; }
    else { tmpC.copy(pal.brick).lerp(rng() < 0.66 ? brickHot : brickDark, rng() * 0.75).multiplyScalar(rng.range(0.92, 1.2)); }
    set.col[i * 3] = tmpC.r; set.col[i * 3 + 1] = tmpC.g; set.col[i * 3 + 2] = tmpC.b;
    set.misc[i * 4] = rng(); set.misc[i * 4 + 1] = roof; set.misc[i * 4 + 2] = shade; set.misc[i * 4 + 3] = painted;
    return true;
  }
  // near wall: a jittered 8 m lattice, kept only inside the barrios
  const near = makeSet(NEAR_MAX), cell = 5.7, thin = 0.55 + 0.45 * detail;
  const cellsX = Math.floor((700 - 18) / cell), cellsZ = Math.floor(860 / cell);
  for (let ix = 0; ix < cellsX && near.n < near.max; ix++) {
    for (let iz = 0; iz < cellsZ && near.n < near.max; iz++) {
      const x = 18 + (ix + 0.2 + 0.6 * rng()) * cell, z = -430 + (iz + 0.2 + 0.6 * rng()) * cell;
      const onLine = Math.abs(z) < 60 && x < 440;
      const b = bowl.barrio(x, z);
      const edgeFade = 1 - 0.8 * Math.max(smoothstep(540, 700, x), smoothstep(320, 430, Math.abs(z)));
      if (!onLine && rng() > Math.min(1, b * 1.6) * edgeFade * thin) continue;
      if (onLine && rng() > 0.93) continue;
      tryPlace(near, x, z, false);
    }
    await ctx.yield();
  }
  // the rest of the bowl: bigger blocks, thickest on the far wall and the floor the rim looks at. Each accepted
  // site seeds a terrace: more blocks stepped along the contour, so barrios form rows that follow the ground
  const far = makeSet(FAR_MAX + 8), tp = { x: 0, z: 0 }, used = new Set(); far.max = FAR_MAX;
  const farKey = (x, z) => (Math.floor(x / 9) + 2048) * 8192 + (Math.floor(z / 9) + 4096);
  for (let tries = 0; tries < FAR_MAX * 1.6 && far.n < far.max; tries++) {
    if ((tries & 63) === 0) await ctx.yield();
    const facing = rng() < 0.72;
    const th = facing ? Math.PI + rng.gauss() * 0.55 : rng.range(-Math.PI, Math.PI);
    const d = rng() < 0.3 ? rng.range(900, 1560) : 20 + 880 * Math.pow(rng(), 0.8);
    bowl.at(d, th, tp);
    if (tp.x < 690 && Math.abs(tp.z) < 425) continue;
    const key = farKey(tp.x, tp.z); if (used.has(key)) continue;
    if (rng() > 0.25 + 0.75 * bowl.barrio(tp.x, tp.z)) continue;
    if (!tryPlace(far, tp.x, tp.z, true)) continue;
    used.add(key);
    const i0 = far.n - 1, sx0 = far.pos[i0 * 3], sz0 = far.pos[i0 * 3 + 2], gx = far.rg[i0 * 4 + 2], gz = far.rg[i0 * 4 + 3], gl = Math.hypot(gx, gz);
    const cxn = gl > 0.03 ? -gz / gl : 1, czn = gl > 0.03 ? gx / gl : 0, dxn = gl > 0.03 ? -gx / gl : 0, dzn = gl > 0.03 ? -gz / gl : 1;
    const rows = rng() < 0.45 ? 2 : 1, len = rng.int(2, 4);
    for (let r = 0; r < rows && far.n < far.max; r++) for (let sgn = -1; sgn <= 1; sgn += 2) {
      let px = sx0 + dxn * r * rng.range(13, 17), pz = sz0 + dzn * r * rng.range(13, 17);
      for (let k = (r === 0 ? 1 : 0); k <= len && far.n < far.max; k++) {
        if (r > 0 && k === 0 && sgn > 0) continue;
        const st = k === 0 ? 0 : rng.range(10.5, 14);
        px += cxn * sgn * st; pz += czn * sgn * st;
        if (px < 690 && Math.abs(pz) < 425) break;
        const kk = farKey(px, pz); if (used.has(kk)) continue;
        if (bowl.barrio(px, pz) < 0.12) break;
        if (tryPlace(far, px, pz, true)) used.add(kk); else if (rng() < 0.6) break;
      }
    }
  }
  // bare clay stays bare: outside the barrios a house survives only with two neighbours within 14 m, so the edges
  // of the city arrive as clusters and the fins are not sprinkled with single cubes (no random draws: the seed's
  // towers and peak stay as they were)
  const keepOut = (opts.keepOut || []).concat(LANDMARKS.map((l) => [l[0] - l[2], l[0] + l[2], l[1] - l[2], l[1] + l[2]]));
  keepOut.push([bowl.pitch.x - bowl.pitch.hx - 5, bowl.pitch.x + bowl.pitch.hx + 5, bowl.pitch.z - bowl.pitch.hz - 5, bowl.pitch.z + bowl.pitch.hz + 5]);
  const prune = async (set, crowd) => {
    const C = 14, key = (x, z) => (Math.floor(x / C) + 4096) * 16384 + (Math.floor(z / C) + 8192), grid = new Map();
    for (let i = 0; i < set.n; i++) { if ((i & 2047) === 0) await ctx.yield(); const k = key(set.pos[i * 3], set.pos[i * 3 + 2]); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(i); }
    const keep = new Uint8Array(set.n);
    for (let i = 0; i < set.n; i++) {
      if ((i & 1023) === 0) await ctx.yield();
      const x = set.pos[i * 3], z = set.pos[i * 3 + 2]; keep[i] = 1;
      let out = false;
      for (const k of keepOut) if (x > k[0] && x < k[1] && z > k[2] && z < k[3]) { out = true; break; }
      if (out) { keep[i] = 0; continue; }
      // on the near wall the thin scatter goes too: a house stays only in a crowd (five neighbours), so the barrios
      // end in an edge and the clay between them is clean
      const sgx = set.rg[i * 4 + 2], sgz = set.rg[i * 4 + 3], slope = Math.sqrt(sgx * sgx + sgz * sgz), beside = Math.abs(z) < 60 && x < 440;
      if (beside) { if (crowd && slope > 0.5) { keep[i] = 0; continue; } if (slope <= 0.36) continue; }   // beside the line nothing clings to the steepest flanks
      // on a slope a house needs company: without two neighbours within 12 m it is a lone cube on bare clay, and goes
      const need = beside ? 2 : (crowd || 2), rad = beside || slope > 0.5 ? 12 : C, rad2 = rad * rad;
      if (!beside && need <= 2 && slope <= 0.5 && bowl.barrio(x, z) >= 0.3) continue;
      let nb = 0;
      for (let ox = -1; ox <= 1 && nb < need; ox++) for (let oz = -1; oz <= 1 && nb < need; oz++) {
        const a = grid.get(key(x + ox * C, z + oz * C)); if (!a) continue;
        for (let q = 0; q < a.length; q++) { const j = a[q], dx = set.pos[j * 3] - x, dz = set.pos[j * 3 + 2] - z; if (j !== i && dx * dx + dz * dz < rad2 && ++nb >= need) break; }
      }
      if (nb < need) keep[i] = 0;
    }
    await compact(set, keep);
  };
  const compact = async (set, keep) => {
    const cols = [[set.pos, 3], [set.size, 3], [set.rg, 4], [set.col, 3], [set.misc, 4]]; let w = 0;
    for (let i = 0; i < set.n; i++) {
      if ((i & 2047) === 0) await ctx.yield();
      if (!keep[i]) continue;
      if (w !== i) for (let q = 0; q < 5; q++) { const arr = cols[q][0], c = cols[q][1]; for (let k = 0; k < c; k++) arr[w * c + k] = arr[i * c + k]; }
      w++;
    }
    set.n = w;
  };
  // near the ropeway no two houses stand in each other: a house whose footprint (plus half a metre) cuts into one
  // already standing is drawn in a little, three times at most, and goes if it still does not fit (no random draws)
  const unstack = async (set) => {
    const C = 12, key = (x, z) => (Math.floor(x / C) + 4096) * 16384 + (Math.floor(z / C) + 8192), grid = new Map(), keep = new Uint8Array(set.n).fill(1);
    const P = set.pos, S = set.size, R = set.rg;
    const apart = (ax, az, dx, dz, i, j) => {
      const ci = R[i * 4], si = R[i * 4 + 1], cj = R[j * 4], sj = R[j * 4 + 1];
      const ri = (S[i * 3] * 0.5 + 0.25) * Math.abs(ax * ci - az * si) + (S[i * 3 + 2] * 0.5 + 0.25) * Math.abs(ax * si + az * ci);
      const rj = (S[j * 3] * 0.5 + 0.25) * Math.abs(ax * cj - az * sj) + (S[j * 3 + 2] * 0.5 + 0.25) * Math.abs(ax * sj + az * cj);
      return Math.abs(dx * ax + dz * az) > ri + rj;
    };
    const cuts = (i, j) => {
      const dx = P[j * 3] - P[i * 3], dz = P[j * 3 + 2] - P[i * 3 + 2];
      if (dx * dx + dz * dz > 196) return false;
      const ci = R[i * 4], si = R[i * 4 + 1], cj = R[j * 4], sj = R[j * 4 + 1];
      return !(apart(ci, -si, dx, dz, i, j) || apart(si, ci, dx, dz, i, j) || apart(cj, -sj, dx, dz, i, j) || apart(sj, cj, dx, dz, i, j));
    };
    for (let i = 0; i < set.n; i++) {
      if ((i & 255) === 0) await ctx.yield();
      const x = P[i * 3], z = P[i * 3 + 2];
      if (Math.abs(z) > 125 || x > 600) continue;
      let ok = false;
      for (let pass = 0; pass < 4 && !ok; pass++) {
        ok = true;
        for (let ox = -1; ox <= 1 && ok; ox++) for (let oz = -1; oz <= 1 && ok; oz++) {
          const a = grid.get(key(x + ox * C, z + oz * C)); if (!a) continue;
          for (let q = 0; q < a.length; q++) if (cuts(i, a[q])) { ok = false; break; }
        }
        if (!ok && pass < 3) { S[i * 3] *= 0.86; S[i * 3 + 2] *= 0.86; }
      }
      if (!ok) { keep[i] = 0; continue; }
      const k = key(x, z); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(i);
    }
    await compact(set, keep);
  };
  // painted districts, the same field the terrain shader paints with (hashes of the site, no random draws)
  const dO = opts.districtOffset || [0, 0], hsh = (x, z, k) => { const v = Math.sin(x * 12.9898 + z * 78.233 + k * 37.719) * 43758.5453; return v - Math.floor(v); };
  const L3 = (r, g, b) => [r, g, b], WH = L3(0.78, 0.76, 0.69);
  const PALS = [[L3(0.014, 0.392, 0.527), L3(0.014, 0.392, 0.527), WH, L3(0.20, 0.40, 0.66)], [L3(0.807, 0.069, 0.323), L3(0.888, 0.539, 0.010), L3(0.871, 0.254, 0.012), WH], [L3(0.005, 0.376, 0.147), L3(0.195, 0.047, 0.479), L3(0.30, 0.62, 0.45), WH]];
  const paintSet = async (set) => {
    for (let i = 0; i < set.n; i++) {
      if ((i & 2047) === 0) await ctx.yield();
      const x = set.pos[i * 3], z = set.pos[i * 3 + 2];
      const a = Math.sin(x * 0.0117 + dO[0]) * Math.cos(z * 0.0131 + dO[1]) + 0.7 * Math.sin((x * 0.6 + z * 0.8) * 0.0093 + dO[0] * 1.7) + 0.5 * Math.cos((x * 0.8 - z * 0.6) * 0.0171 + dO[1] * 2.3);
      if (hsh(x, z, 1) > 0.34 * smoothstep(-0.10, 0.30, a)) continue;
      if (x < 170 && hsh(x, z, 5) > 0.42) continue;
      const b = Math.sin(x * 0.0083 + dO[1] * 3.1 + 1.0) * Math.sin(z * 0.0097 + dO[0] * 2.3) + 0.6 * Math.sin((x - z) * 0.0061 + 4.0);
      const c = PALS[b < -0.22 ? 0 : b < 0.22 ? 1 : 2][Math.min(3, Math.floor(hsh(x, z, 2) * 4))], m = 0.66 + 0.15 * hsh(x, z, 3);
      const lum = 0.3 * c[0] + 0.5 * c[1] + 0.2 * c[2], q = x < 170 ? 0.55 : Math.hypot(x - 200, z) > 330 ? 0.42 : 0.2;     // quieter away from the line
      set.col[i * 3] = lerp(c[0], lum, q) * m; set.col[i * 3 + 1] = lerp(c[1], lum, q) * m; set.col[i * 3 + 2] = lerp(c[2], lum, q) * m; set.misc[i * 4 + 3] = 1;
    }
  };
  for (const set of [near, far, near, far]) { await prune(set, set === near ? 5 : 0); await ctx.yield(); }
  for (const set of [near, far]) {                                        // on a slope every house squares up to the contour, so rows read as terraces
    for (let i = 0; i < set.n; i++) {
      const gx = set.rg[i * 4 + 2], gz = set.rg[i * 4 + 3];
      if (Math.hypot(gx, gz) > 0.3) { const ang = Math.atan2(-gz, gx) + (hsh(set.pos[i * 3], set.pos[i * 3 + 2], 5) - 0.5) * 0.2; set.rg[i * 4] = Math.cos(ang); set.rg[i * 4 + 1] = Math.sin(ang); }
    }
    await ctx.yield();
  }
  await unstack(near); await ctx.yield();
  await paintSet(near); await ctx.yield(); await paintSet(far); await ctx.yield();
  { const pp = bowl.pitch;                                                // between the cable and the ledge pitch the houses stay low, so the cabin sees the game
    for (let i = 0; i < near.n; i++) {
      const x = near.pos[i * 3], z = near.pos[i * 3 + 2];
      if (z > 18 && z < pp.z - pp.hz - 2 && x > pp.x - 66 && x < pp.x + 22) near.size[i * 3 + 1] = Math.min(near.size[i * 3 + 1], 3.0);
      if (Math.abs(x - pp.x) < 50 && z > 8 && z < 110) {                  // seat the houses round the terrace on the ground as it now is
        const h = bowl.height(x, z); near.pos[i * 3 + 1] = h; near.rg[i * 4 + 2] = (bowl.height(x + 3, z) - h) / 3; near.rg[i * 4 + 3] = (bowl.height(x, z + 3) - h) / 3;
      }
    }
    await ctx.yield(); }
  {                                                                       // a lower sun: houses a ridge stands in front of are in its shade (no random draws)
    const lowSun = tanE < 1.4;
    for (const set of [near, far]) {
      const steps = set === near ? [30, 90] : [70, 190];
      for (let i = 0; i < set.n; i++) {
        if ((i & 255) === 0) await ctx.yield();
        const x = set.pos[i * 3], z = set.pos[i * 3 + 2];
        if (!lowSun) break;
        let sh = set.misc[i * 4 + 2]; const y = set.pos[i * 3 + 1] + set.size[i * 3 + 1] * 0.6;
        for (const st of steps) { const over = bowl.height(x + sx * st, z + sz * st) - (y + st * tanE); if (over > 0) sh = Math.min(sh, 1 - clamp(over / (st * 0.25), 0, 1)); }
        set.misc[i * 4 + 2] = sh;
      }
    }
  }
  // a white twin-towered church on each church square
  for (const L of LANDMARKS) {
    if (L[3] !== 1) continue;
    for (const b of [[0.1 * L[2], 0, 22, 19, 46, 0], [-0.38 * L[2], 16, 10, 42, 10, 1], [-0.38 * L[2], -16, 10, 42, 10, 1]]) {
      if (far.n >= FAR_MAX + 8) break;
      const i = far.n++, x = L[0] + b[0], z = L[1] + b[1];
      far.pos[i * 3] = x; far.pos[i * 3 + 1] = bowl.height(x, z); far.pos[i * 3 + 2] = z; far.size[i * 3] = b[2]; far.size[i * 3 + 1] = b[3]; far.size[i * 3 + 2] = b[4];
      far.rg[i * 4] = 1; far.rg[i * 4 + 1] = 0; far.rg[i * 4 + 2] = 0; far.rg[i * 4 + 3] = 0;
      far.col[i * 3] = 0.80; far.col[i * 3 + 1] = 0.78; far.col[i * 3 + 2] = 0.72;
      far.misc[i * 4] = 0.137 + 0.21 * b[5]; far.misc[i * 4 + 1] = b[5]; far.misc[i * 4 + 2] = 1; far.misc[i * 4 + 3] = 1;
    }
  }
  // a house more than a kilometre off throws a ground shadow smaller than a pixel: those go to the end of the far set
  // and are drawn without the shadow quad
  let farNear = far.n;
  {
    const n = far.n, order = new Uint32Array(n), off = (i) => far.pos[i * 3] > 1150 || Math.abs(far.pos[i * 3 + 2]) > 1150; let a = 0;
    // across the bowl half the blocks go and the rest are drawn larger (see CUBE_VERT): the ones that would shrink to nothing are left out here
    const gone = (i) => { const f = far.misc[i * 4] * 17.31; return Math.max(far.pos[i * 3], Math.abs(far.pos[i * 3 + 2]) * 0.9) >= 1250 && f - Math.floor(f) > 0.5; };
    for (let i = 0; i < n; i++) if (!off(i) && !gone(i)) order[a++] = i;
    farNear = a;
    for (let i = 0; i < n; i++) if (off(i) && !gone(i)) order[a++] = i;
    const kept = a;
    await ctx.yield();
    for (const key of ['pos', 'size', 'rg', 'col', 'misc']) {
      const src = far[key], c = key === 'rg' || key === 'misc' ? 4 : 3, dst = new Float32Array(src.length);
      for (let i = 0; i < kept; i++) { const o = order[i] * c; for (let k = 0; k < c; k++) dst[i * c + k] = src[o + k]; }
      far[key] = dst; await ctx.yield();
    }
    far.n = kept;
  }
  const base = buildCubeGeometry(), meshes = [];
  for (const part of [[near, 0, near.n, 24], [far, 0, farNear, 24], [far, farNear, far.n, 18]]) {
    const set = part[0], i0 = part[1], cnt = part[2] - part[1]; if (cnt < 1) continue;
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('normal', base.attributes.normal); g.setAttribute('aFace', base.attributes.aFace);
    const ia = (arr, n) => new THREE.InstancedBufferAttribute(arr.subarray(i0 * n, (i0 + cnt) * n), n);
    g.setAttribute('iPos', ia(set.pos, 3)); g.setAttribute('iSize0', ia(set.size, 3)); g.setAttribute('iRotGrad', ia(set.rg, 4));
    g.setAttribute('iCol', ia(set.col, 3)); g.setAttribute('iMisc', ia(set.misc, 4));
    g.instanceCount = cnt; g.setDrawRange(0, part[3]);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(BOWL_CX, -200, 0), 2600);
    const mat = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, vertexShader: CUBE_VERT, fragmentShader: CUBE_FRAG,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uBrick: { value: pal.brick }, uPale: { value: pal.pale }, uFarGrow: { value: set === far ? 1 : 0 } }]) });
    Object.assign(mat.uniforms, U);
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; meshes.push(m);
  }
  return { meshes, count: near.n + far.n, near };
}

// ---------- ropeway ----------
export function returnZ(x) { return RETURN_DZ - 5.6 * smoothstep(322, 398, x) * (1 - smoothstep(432, 500, x)); }   // brief frame: where the return cable runs, metres right of the line (exported for what a world builds beside it)
function makeLineTable() {
  // positions every metre of cable, from the entry to the floor station
  const xs = [], ys = [], ss = []; let s = 0, px = RIDE_X0, py = eyeY(RIDE_X0) + CABLE_UP;
  const fine = [];
  for (let x = RIDE_X0; x <= STATION_X; x += 0.5) { const y = eyeY(x) + CABLE_UP; s += Math.hypot(x - px, y - py); fine.push(s, x, y); px = x; py = y; }
  const total = s; let j = 0;
  for (let d = 0; d <= total; d += 1) {
    while (j < fine.length / 3 - 2 && fine[(j + 1) * 3] < d) j++;
    const s0 = fine[j * 3], s1 = fine[(j + 1) * 3], t = s1 > s0 ? clamp((d - s0) / (s1 - s0), 0, 1) : 0;
    xs.push(lerp(fine[j * 3 + 1], fine[(j + 1) * 3 + 1], t)); ys.push(lerp(fine[j * 3 + 2], fine[(j + 1) * 3 + 2], t)); ss.push(d);
  }
  let ride = 0; for (let i = 0; i < xs.length; i++) if (xs[i] <= RIDE_X1) ride = i;
  const at = (d, out) => {
    const f = clamp(d, 0, xs.length - 1.001), i = Math.floor(f), t = f - i;
    out.x = lerp(xs[i], xs[i + 1], t); out.y = lerp(ys[i], ys[i + 1], t); out.slope = (ys[i + 1] - ys[i]) / Math.max(1e-4, xs[i + 1] - xs[i]);
    return out;
  };
  return { total: xs.length - 1, ride, at };
}

function partsBuilder() {
  const list = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0), a = new THREE.Vector3(), b = new THREE.Vector3();
  const paint = (g, col, col2) => {
    const n = g.attributes.position.count, c = new Float32Array(n * 3), py = g.attributes.position;
    g.computeBoundingBox(); const y0 = g.boundingBox.min.y, y1 = g.boundingBox.max.y;
    for (let i = 0; i < n; i++) { const t = col2 ? (py.getY(i) - y0) / Math.max(1e-4, y1 - y0) : 0; c[i * 3] = lerp(col.r, col2 ? col2.r : col.r, t); c[i * 3 + 1] = lerp(col.g, col2 ? col2.g : col.g, t); c[i * 3 + 2] = lerp(col.b, col2 ? col2.b : col.b, t); }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
  };
  const api = {
    list,
    box(w, h, d, x, y, z, col, rx = 0, ry = 0, rz = 0, col2 = null) {
      const g = paint(new THREE.BoxGeometry(w, h, d), col, col2);
      g.applyMatrix4(m4.compose(v.set(x, y, z), q.setFromEuler(e.set(rx, ry, rz)), one)); list.push(g); return g;
    },
    // tapered tube between two points
    tube(x0, y0, z0, x1, y1, z1, r0, r1, col, sides = 6, col2 = null) {
      a.set(x0, y0, z0); b.set(x1, y1, z1); const len = a.distanceTo(b);
      const g = paint(new THREE.CylinderGeometry(r1, r0, len, sides, 1, true), col, col2);
      b.sub(a).normalize(); q.setFromUnitVectors(up, b);
      g.applyMatrix4(m4.compose(v.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), q, one)); list.push(g); return g;
    },
    disc(r, t, x, y, z, col, sides = 10) {     // wheel with its axle along z
      const g = paint(new THREE.CylinderGeometry(r, r, t, sides, 1, false), col, null);
      g.applyMatrix4(m4.compose(v.set(x, y, z), q.setFromEuler(e.set(Math.PI / 2, 0, 0)), one)); list.push(g); return g;
    },
    merge() { const g = mergeGeometries(list, false); for (const p of list) p.dispose(); list.length = 0; return g; },
  };
  return api;
}

async function buildPylons(ctx, bowl, rng, pal, opts) {
  const S = partsBuilder(), Wh = partsBuilder(), pylons = [], pylonXZ = [];
  const steel = new THREE.Color(0.60, 0.62, 0.63), steelD = new THREE.Color(0.36, 0.37, 0.39), conc = new THREE.Color(0.52, 0.50, 0.47);
  const red = pal.red.clone().multiplyScalar(0.9), white = new THREE.Color(0.78, 0.78, 0.76), yellow = new THREE.Color(0.75, 0.55, 0.08), dark = new THREE.Color(0.06, 0.06, 0.07);
  const rust = new THREE.Color(0.36, 0.22, 0.14);
  const pivots = [];
  const wheel = (x, y, z) => {
    const g1 = Wh.disc(0.28, 0.13, x, y, z, dark, 8), g2 = Wh.box(0.5, 0.09, 0.15, x, y, z, yellow);
    for (const g of [g1, g2]) { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = z; } g.setAttribute('aPivot', new THREE.BufferAttribute(a, 3)); }
  };
  const train = (x, cy, z, slope, n, under) => {
    const ang = Math.atan(slope), ca = Math.cos(ang), sa = Math.sin(ang), off = under ? -0.3 : 0.3;
    S.box(n * 1.15 + 0.4, 0.2, 0.2, x, cy + off * 1.9, z - 0.22, steelD, 0, 0, ang);
    S.box(0.3, 0.7, 0.3, x, cy + off * 3.2, z - 0.22, steelD);
    for (let i = 0; i < n; i++) { const t = (i - (n - 1) / 2) * 1.15; wheel(x + ca * t - sa * off, cy + sa * t + ca * off, z); }
  };
  async function mast(x, wheels, heavy) {
    const za = -3.5, cy = eyeY(x) + CABLE_UP, slope = (eyeY(x + 1) - eyeY(x - 1)) / 2, armY = cy + 1.65;
    const low = armY - bowl.height(x, za) < 20, z = -5.1, gy = bowl.height(x, z);                  // the shaft stands 5.1 m from the eye, the arm reaches over both cables
    const fineArm = x < 500;                                                                                     // the masts below the portal are never seen from nearer than 130 m: no bolts, rungs, clamps or rust streaks on them (each is a few centimetres across)
    const H = armY - gy, tall = H > 25 && x < 500, rb = (heavy ? (low ? 0.58 : 0.75) : (low ? 0.46 : 0.5)) + H * 0.014 + (tall ? 0.28 : 0), rt = heavy ? (low ? 0.44 : 0.5) : (tall ? 0.5 : 0.38);
    S.box(low ? 2.6 : 3.4, 2.4, low ? 2.6 : 3.4, x, gy - 0.3, z, conc, 0, rng.range(-0.1, 0.1), 0, conc.clone().multiplyScalar(0.8));
    // shaft in rolled 3 m cans, each a slightly different grey, with a weld seam between and a rusty foot
    const hsh = (i) => { const v = Math.sin(i * 12.9898 + x * 0.371) * 43758.5453; return v - Math.floor(v); };
    const top = armY + 0.5, rAt = (y) => lerp(rb, rt, clamp((y - gy) / (top - gy), 0, 1)), base = rust.clone().lerp(steel, 0.55), cA = new THREE.Color(), cB = new THREE.Color();
    for (let y = gy, i = 0; y < top - 0.01; y += 3, i++) {
      const y1 = Math.min(top, y + 3), t0 = (y - gy) / (top - gy), t1 = (y1 - gy) / (top - gy), m = 0.86 + 0.24 * hsh(i);
      cA.copy(base).lerp(steel, Math.min(1, t0 * 1.6)).multiplyScalar(m * 0.93); cB.copy(base).lerp(steel, Math.min(1, t1 * 1.6)).multiplyScalar(m * 1.05);
      if (tall && t0 > 0.16) { const bc = Math.floor((top - y1) / 6) % 2 ? white : red; cA.copy(bc).multiplyScalar(m * 0.9); cB.copy(bc).multiplyScalar(m); }   // banded from the head down to the rusty foot
      S.tube(x, y, z, x, y1, z, rAt(y), rAt(y1), cA.clone(), 8, cB.clone());
      if (i > 0) S.tube(x, y - 0.05, z, x, y + 0.07, z, rAt(y) + 0.035, rAt(y) + 0.035, steelD, 8);
    }
    for (let y = gy + 7; y < armY - 3; y += 9) { const r = rAt(y) + 0.1; S.tube(x, y, z, x, y + 0.3, z, r, r, steelD, 8); }
    await ctx.yield();
    S.tube(x, gy + 0.9, z, x, gy + 1.08, z, rb + 0.32, rb + 0.32, steelD, 10, steel);                           // bolted base flange
    S.box((rb + 0.32) * 1.7, 0.03, (rb + 0.32) * 1.7, x, gy + 1.09, z, steel, 0, Math.PI / 4, 0);
    for (let k = 0; k < 10 && fineArm; k++) { const a = k / 10 * Math.PI * 2; S.box(0.11, 0.14, 0.11, x + Math.cos(a) * (rb + 0.2), gy + 1.15, z + Math.sin(a) * (rb + 0.2), dark, 0, -a, 0); }
    {                                                                                                           // ladder: two rails, rungs, cage hoops
      const lx = x - rb - 0.16, y0 = gy + 1.2, y1 = armY - 0.6, mid = (y0 + y1) / 2, step = H > 25 ? 0.75 : 0.5;
      S.box(0.06, y1 - y0, 0.06, lx, mid, z - 0.24, dark); S.box(0.06, y1 - y0, 0.06, lx, mid, z + 0.24, dark);
      for (let y = y0 + 0.3; y < y1 && fineArm; y += step) S.box(0.05, 0.05, 0.5, lx, y, z, steelD);
      for (let y = y0 + 3; y < y1; y += 3) { S.box(0.05, 0.07, 0.86, lx - 0.42, y, z, yellow); S.box(0.46, 0.07, 0.05, lx - 0.2, y, z - 0.42, yellow); S.box(0.46, 0.07, 0.05, lx - 0.2, y, z + 0.42, yellow); }
    }
    await ctx.yield();
    { const bh = H > 25 ? 2.4 : 1.1; for (let i = 0; i < (H > 25 ? 4 : 3); i++) { const y = armY - (H > 25 ? 2.2 : 1.5) - i * bh, r = lerp(rb, rt, (y - gy) / H) + 0.03; S.tube(x, y - bh, z, x, y, z, r + 0.02, r, i % 2 ? white : red, 8); } }
    // the side the cabin sees: a number plate, a cable conduit with clamps and a junction box, rust weeping from each seam
    {
      const pr = rAt(gy + 3.4) + 0.03;
      S.box(0.86, 0.62, 0.04, x, gy + 3.4, z + pr, dark); S.box(0.76, 0.52, 0.05, x, gy + 3.4, z + pr + 0.01, white); S.box(0.76, 0.14, 0.06, x, gy + 3.24, z + pr + 0.012, red); S.box(0.2, 0.2, 0.06, x + 0.2, gy + 3.5, z + pr + 0.012, yellow);
      const cx = x + 0.55 * rb, cz = (y) => z + Math.sqrt(Math.max(0.01, rAt(y) * rAt(y) - 0.3 * rb * rb)) + 0.07;
      S.tube(cx, gy + 1.2, cz(gy + 1.2), cx, armY - 0.8, cz(armY - 0.8), 0.045, 0.045, dark, 5);
      for (let y = gy + 2.2; y < armY - 1 && fineArm; y += 1.5) S.box(0.2, 0.05, 0.1, cx, y, cz(y), steelD);
      S.box(0.36, 0.5, 0.18, cx, gy + 2.0, cz(gy + 2.0) + 0.05, steelD, 0, 0, 0, steel);
      for (let y = gy + 3, k = 0; y < top - 0.5 && fineArm; y += 3, k++) for (let j = 0; j < 5; j++) {
        const a = hsh(k * 7 + j) * Math.PI * 2, r = rAt(y - 0.6) + 0.012, len = 0.5 + 1.6 * hsh(k * 13 + j * 3 + 1);
        S.box(0.02, len, 0.07 + 0.1 * hsh(k + j * 5), x + Math.cos(a) * r, y - len / 2, z + Math.sin(a) * r, rust.clone().multiplyScalar(0.85), 0, -a, 0);
      }
    }
    await ctx.yield();
    // cross-arm, 1.65 m above the cable: a slim plate girder painted in bands over a dark underside, bolted splices every
    // 1.5 m, a grated catwalk with handrails along the top, marked ends, and a hanger down to each sheave train
    {
      const under = steelD.clone().multiplyScalar(0.3), grey = steel.clone().multiplyScalar(0.9), bands = [red.clone().multiplyScalar(0.85), grey, white.clone().multiplyScalar(0.92), grey, white.clone().multiplyScalar(0.92), red.clone().multiplyScalar(0.85)];
      const seg = 9.4 / 6;
      for (let k = 0; k < 6; k++) S.box(0.34, 0.46, seg, x, armY, za - 4.7 + (k + 0.5) * seg, under, 0, 0, 0, bands[k]);
      S.box(0.6, 0.05, 9.5, x, armY + 0.255, za, steel.clone().multiplyScalar(1.1)); S.box(0.6, 0.05, 9.5, x, armY - 0.255, za, under);
      for (let k = 0; k <= 6 && fineArm; k++) {
        const zz = za - 4.7 + k * seg; if (Math.abs(zz - z) < 0.7) continue;
        S.box(0.5, 0.52, 0.07, x, armY, zz, under, 0, 0, 0, steelD);
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) S.box(0.05, 0.05, 0.13, x + sx * 0.2, armY + sy * 0.13, zz, dark);
      }
      for (const e of [-1, 1]) { S.box(0.64, 0.58, 0.1, x, armY, za + e * 4.75, yellow); S.box(0.66, 0.19, 0.11, x, armY, za + e * 4.75, dark); }
      S.box(0.74, 0.035, 8.8, x, armY + 0.3, za, dark.clone().multiplyScalar(1.8));                              // catwalk grating
      for (let k = 0; k < 12 && fineArm; k++) S.box(0.76, 0.045, 0.05, x, armY + 0.3, za - 4.2 + k * 0.764, steelD.clone().multiplyScalar(0.7));
      for (const sx of [-1, 1]) {
        S.box(0.035, 0.035, 8.8, x + sx * 0.37, armY + 1.25, za, yellow); S.box(0.03, 0.03, 8.8, x + sx * 0.37, armY + 0.8, za, yellow.clone().multiplyScalar(0.8));
        for (let k = 0; k < 7 && fineArm; k++) S.box(0.035, 0.95, 0.035, x + sx * 0.37, armY + 0.78, za - 4.3 + k * 1.433, yellow);
      }
      for (const zc of [0, RETURN_DZ]) S.box(0.2, armY - 0.25 - (cy + 1.2), 0.2, x, (armY - 0.25 + cy + 1.2) / 2, zc - 0.22, steelD);
    }
    S.box(1.3, 1.1, 1.3, x, armY - 0.1, z, steelD, 0, 0, 0, steel);                                             // saddle where the arm sits on the shaft
    { const br = steelD.clone().multiplyScalar(0.62); S.tube(x, armY - 3.2, z, x, armY - 0.3, za + 3.4, 0.075, 0.075, br, 5, steelD); S.tube(x, armY - 3.2, z, x, armY - 0.3, za - 3.4, 0.075, 0.075, br, 5, steelD); }
    S.box(1.5, 0.1, 5.2, x + 0.9, armY - 0.4, za, yellow.clone().multiplyScalar(0.7));                          // work platform and rail
    S.box(0.05, 1.0, 5.2, x + 1.65, armY + 0.1, za, yellow); S.box(1.5, 0.05, 0.05, x + 0.9, armY + 0.6, za - 2.6, yellow); S.box(1.5, 0.05, 0.05, x + 0.9, armY + 0.6, za + 2.6, yellow);
    if (heavy) { S.box(1.6, 1.3, 2.2, x - 0.2, armY + 1.0, za, new THREE.Color(0.2, 0.33, 0.3), 0, 0, 0); S.box(1.9, 0.14, 2.6, x - 0.2, armY + 1.72, za, steelD); }
    train(x, cy, 0, slope, wheels, false); train(x, cy, RETURN_DZ, slope, wheels, false);
    pylons.push({ base: new THREE.Vector3(x, gy, z), top: new THREE.Vector3(x, armY + 0.5, za) });
    pylonXZ.push(x, z);
  }
  for (const m of [[-60, 4, false], [-6, 6, true], [75, 4, false], [200, 4, false]]) { await mast(m[0], m[1], m[2]); await ctx.yield(); }
  // the portal gantry: an 18 m bay for the portal, a narrow bay for the return cable
  const gx = RIDE_X1, pc = Y_END, topY = pc + 10.2, sillY = pc - 9.6, legsZ = [9.9, -9.9, -15.6];
  let gBase = 0;
  for (const z of legsZ) {
    for (const fx of [-5.5, 5.5]) {
      const fy = bowl.height(gx + fx, z); gBase = Math.min(gBase, fy);
      S.box(2.6, 2.6, 2.6, gx + fx, fy - 0.4, z, conc);
      S.tube(gx + fx, fy, z, gx + fx * 0.16, topY, z, 0.62, 0.36, rust.clone().lerp(steel, 0.5), 6, steel);
      pylonXZ.push(gx + fx, z);
    }
    const f0 = bowl.height(gx, z);
    for (let k = 0; k < 4; k++) {                     // lacing between the two legs of each A-frame
      const t0 = 0.12 + k * 0.2, t1 = t0 + 0.2, y0 = lerp(f0, topY, t0), y1 = lerp(f0, topY, t1), w0 = 5.5 * (1 - t0 * 0.84), w1 = 5.5 * (1 - t1 * 0.84);
      S.tube(gx - w0, y0, z, gx + w1, y1, z, 0.1, 0.1, steelD, 4); S.tube(gx + w0, y0, z, gx - w1, y1, z, 0.1, 0.1, steelD, 4);
    }
    for (let i = 0; i < 3; i++) S.tube(gx, topY - 2.6 - i * 2.6 - 2.6, z, gx, topY - 2.6 - i * 2.6, z, 0.75 - i * 0.04, 0.7 - i * 0.04, i % 2 ? white : red, 6);
    await ctx.yield();
  }
  const zc = (legsZ[0] + legsZ[2]) / 2, zl = legsZ[0] - legsZ[2] + 2.4;
  S.box(0.5, 0.5, zl, gx - 0.9, topY + 0.2, zc, steel); S.box(0.5, 0.5, zl, gx + 0.9, topY + 0.2, zc, steel);          // top truss chords
  S.box(0.4, 0.4, zl, gx, topY + 2.0, zc, steel);
  for (let i = 0; i < 9; i++) { const z0 = legsZ[2] - 1 + i * (zl - 0.4) / 9, z1 = z0 + (zl - 0.4) / 9; S.tube(gx - 0.9, topY + 0.2, z0, gx, topY + 2.0, (z0 + z1) / 2, 0.08, 0.08, steelD, 4); S.tube(gx + 0.9, topY + 0.2, z1, gx, topY + 2.0, (z0 + z1) / 2, 0.08, 0.08, steelD, 4); }
  S.box(0.45, 0.6, legsZ[0] - legsZ[1], gx, sillY, 0, steel, 0, 0, 0, steelD);                                         // sill beam under the portal
  S.box(1.5, 0.1, zl - 1, gx, topY + 0.5, zc, steelD); S.box(0.06, 0.07, zl - 1, gx + 0.95, topY + 1.5, zc, yellow); S.box(0.06, 0.07, zl - 1, gx - 0.95, topY + 1.5, zc, yellow);
  for (const z of [legsZ[0], legsZ[1]]) { S.tube(gx, topY, z, gx, pc + 6.3, z - Math.sign(z) * 3.0, 0.12, 0.12, steelD, 4); S.tube(gx, sillY, z, gx, pc - 6.3, z - Math.sign(z) * 3.0, 0.12, 0.12, steelD, 4); }
  train(gx, eyeY(gx) + CABLE_UP, returnZ(gx), -TAN10, 4, false);
  S.box(0.3, topY - (eyeY(gx) + CABLE_UP) - 0.8, 0.3, gx, (topY + eyeY(gx) + CABLE_UP + 0.9) / 2, returnZ(gx) - 0.22, steelD);
  await ctx.yield();
  const lamps = [[gx, topY + 2.5, legsZ[0]], [gx, topY + 2.5, legsZ[2]]];
  const gantryIndex = pylons.length;
  pylons.push({ base: new THREE.Vector3(gx, gBase, 0), top: new THREE.Vector3(gx, topY + 2.2, 0) });
  if (opts.beyond !== false) {
    for (const x of [545, 675, 800]) { await mast(x, 4, false); await ctx.yield(); }
    const sy = bowl.height(STATION_X, -3.5), brick = pal.brick.clone().multiplyScalar(0.9);
    S.box(16, 7.5, 3, STATION_X + 4, sy + 3.4, 5.5, brick); S.box(16, 7.5, 3, STATION_X + 4, sy + 3.4, -12.5, brick);
    S.box(4, 7.5, 18, STATION_X + 10, sy + 3.4, -3.5, brick); S.box(18, 0.5, 22, STATION_X + 3.5, sy + 7.6, -3.5, red, 0, 0, 0.05);
    pylonXZ.push(STATION_X + 4, -3.5, STATION_X - 4, -3.5, STATION_X + 12, -3.5);
  }
  const structure = S.merge();
  await ctx.yield();
  const wheels = Wh.merge();
  return { structure, wheels, pylons, pylonXZ, gantryIndex, lamps };
}

function buildCables(line, U) {
  const lines = [];
  for (let c = 0; c < 2; c++) {
    const o = { x: 0, y: 0, slope: 0 }, pts = [];
    for (let d = 0; d <= line.total; d += 3) { line.at(d, o); pts.push([o.x, o.y, c ? returnZ(o.x) : 0]); }
    lines.push(pts);
  }
  return cableRibbon(lines, U, 0);
}
// ribbons that widen with distance to hold 1.5 pixels; lines = arrays of [x, y, z] points
function cableRibbon(lines, U, haul = -1) {
  const P = [], T = [], Sd = [], Hl = [], I = [];
  for (let li = 0; li < lines.length; li++) {
    const pts = lines[li];
    const b0 = P.length / 3;
    for (let n = 0; n < pts.length; n++) {
      const a = pts[Math.max(0, n - 1)], b = pts[Math.min(pts.length - 1, n + 1)], tl = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1;
      for (const sd of [-1, 1]) { P.push(pts[n][0], pts[n][1], pts[n][2]); T.push((b[0] - a[0]) / tl, (b[1] - a[1]) / tl, (b[2] - a[2]) / tl); Sd.push(sd); Hl.push(li === haul ? 1 : 0); }
      if (n > 0) { const q = b0 + (n - 1) * 2; I.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(T, 3)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(Sd, 1)); g.setAttribute('aHaul', new THREE.Float32BufferAttribute(Hl, 1));
  g.setIndex(I);
  const mat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
    vertexShader: FOG_V_PARS + /* glsl */`
      attribute vec3 aTan; attribute float aSide; attribute float aHaul; uniform float uPxK; varying float vS;
      void main(){
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vec3 tv = normalize((modelViewMatrix * vec4(aTan, 0.0)).xyz);
        vec3 sd = cross(tv, normalize(mvPosition.xyz + vec3(0.0, 0.0, -1e-3))) + vec3(1e-4, 0.0, 0.0);
        sd = normalize(sd);
        float w = max(0.012, 0.85 * uPxK * length(mvPosition.xyz));
        w *= mix(1.0, smoothstep(45.0, 90.0, length(mvPosition.xyz)), aHaul);   // the cable we hang from would rule a line down the middle of the picture: it draws in from 45 m ahead
        mvPosition.xyz += sd * aSide * w; vS = aSide;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F_PARS + GLSL_COMMON + /* glsl */`
      varying float vS;
      void main(){ vec3 col = vec3(0.090, 0.096, 0.108) * (uSkyCol * 1.5 + uSunCol * (0.30 + 0.55 * smoothstep(-0.2, 0.9, vS))) + vec3(0.012);   // steel grey with the sun along its top
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  Object.assign(mat.uniforms, U);
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}

function buildCabins(line, pal, opts) {
  const S = partsBuilder();
  const red = pal.red.clone(), redD = pal.red.clone().multiplyScalar(0.62), glass = new THREE.Color(0.075, 0.125, 0.20), white = new THREE.Color(0.8, 0.8, 0.78), dark = new THREE.Color(0.07, 0.07, 0.08), steelC = new THREE.Color(0.45, 0.46, 0.48);
  S.box(0.55, 0.24, 0.22, 0, 0.02, 0, dark);
  S.tube(0, -0.05, 0, 0, -0.3, 0.62, 0.07, 0.07, dark, 5); S.tube(0, -0.3, 0.62, 0, -1.7, 0.62, 0.07, 0.07, dark, 5); S.tube(0, -1.7, 0.62, 0, -1.93, 0, 0.07, 0.09, dark, 5);
  S.box(1.62, 0.12, 1.52, 0, -1.9, 0, red); S.box(2.08, 0.16, 1.98, 0, -2.02, 0, red);
  S.box(1.3, 0.05, 1.2, 0, -1.82, 0, white); S.box(0.5, 0.1, 0.36, -0.42, -1.78, 0.3, dark); S.box(0.36, 0.08, 0.5, 0.4, -1.79, -0.28, steelC);   // roof panel, vent, hatch
  S.box(2.1, 0.05, 2.0, 0, -2.11, 0, white);                                                                       // drip rail
  S.box(1.9, 0.94, 1.8, 0, -2.56, 0, glass);
  for (const sz of [-1, 1]) { S.box(0.05, 0.94, 0.05, 0, -2.56, sz * 0.91, redD); S.box(0.04, 0.9, 0.03, 0, -3.5, sz * 0.945, dark); S.box(0.5, 0.2, 0.02, -0.5, -3.42, sz * 0.945, white); }   // door post, door seam, number plate
  for (const sx of [-1, 1]) S.box(0.05, 0.94, 0.05, sx * 0.96, -2.56, 0, redD);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) S.box(0.15, 0.94, 0.15, sx * 0.93, -2.56, sz * 0.88, red);
  S.box(1.99, 0.1, 1.89, 0, -3.07, 0, white);
  S.box(1.97, 0.9, 1.87, 0, -3.5, 0, redD, 0, 0, 0, red);
  S.box(1.6, 0.16, 1.5, 0, -4.02, 0, redD);
  const geo = S.merge();
  const N = Math.ceil(line.total / CABIN_GAP), wrap = N * CABIN_GAP, count = N * 2;
  const glow = { value: 0 };
  const cmat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.15 });
  cmat.onBeforeCompile = (sh) => {
    sh.uniforms.uCabGlow = glow;
    sh.fragmentShader = 'uniform float uCabGlow;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n float cgGlass = step(vColor.r * 1.5, vColor.b) * step(vColor.b, 0.3), cgRed = step(vColor.g * 2.5, vColor.r) * (1.0 - cgGlass);\n totalEmissiveRadiance += (cgRed * vec3(1.0, 0.023, 0.009) * (0.3 + vColor.r) + cgGlass * vec3(1.0, 0.72, 0.42) * 1.0 + (1.0 - cgRed - cgGlass) * vColor.rgb * 0.35) * uCabGlow;');
  };
  const mesh = new THREE.InstancedMesh(geo, cmat, count);
  mesh.frustumCulled = false;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3(), o = { x: 0, y: 0, slope: 0 };
  function place(d0, time, hideOwn) {
    for (let i = 0; i < count; i++) {
      const back = i >= N, j = back ? i - N : i;
      let s = back ? (63 - d0 + j * CABIN_GAP) : (d0 + j * CABIN_GAP);
      s = ((s % wrap) + wrap) % wrap;
      const hidden = s > line.total - 1 || (hideOwn && !back && j === 0) || (opts.beyond === false && s > line.ride + 2);
      line.at(Math.min(s, line.total - 1), o);
      // a touch of swing, more just after a sheave train has been crossed
      const sw = 0.02 * Math.sin(time * 1.3 + i * 2.1) + 0.012 * Math.sin(time * 3.1 + i);
      e.set(sw, back ? Math.PI : 0, 0.5 * sw);
      p.set(o.x, o.y, back ? returnZ(o.x) : 0); sc.setScalar(hidden ? 1e-4 : 1 + 0.7 * smoothstep(line.ride + 25, line.ride + 150, s));
      mesh.setMatrixAt(i, m.compose(p, q.setFromEuler(e), sc));
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  return { mesh, place, glow };
}

// ---------- glass towers on the floor (same eye-turning cube trick, mirror-glass shader) ----------
const TOWER_FRAG = FOG_F_PARS + GLSL_COMMON + /* glsl */`
  uniform vec3 uBrick; uniform vec3 uPale;
  varying vec3 vP; varying vec3 vN; varying vec3 vCol; varying vec4 vMisc; varying vec3 vUv; varying vec3 vSize; varying float vFace;
  void main(){
    float seed = vMisc.x; float cloud = cloudShade(vP.xz) * rimShade(vP); vec2 dU = fwidth(vUv.xy);
    vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0)); vec3 col;
    if (vFace > 2.5) { col = mix(uPale, uBrick, 0.42) * 0.8 * (uSkyCol * 0.9 + uBrick * 0.03); }
    else if (vFace > 0.5 && vMisc.w > 0.5) {
      // a mid-rise in painted render: bands of windows floor by floor, a lit face and a shaded one
      vec2 g = vec2(vUv.x / 3.4, vUv.y / 3.1); vec2 id = floor(g), f = fract(g);
      float lod = 1.0 - smoothstep(0.15, 0.6, max(dU.x / 3.4, dU.y / 3.1)), hp = h21(id + seed * 57.0);
      float win = step(0.2, f.x) * step(f.x, 0.8) * step(0.28, f.y) * step(f.y, 0.78), band = step(0.28, f.y) * step(f.y, 0.78);
      float sunT = max(dot(N, uSunDir), 0.0) * cloud;
      vec3 light = uSunCol * min(sunT * 1.8, 1.0) + uSkyCol * 0.6 + vec3(0.30, 0.22, 0.15) * uFarK.z * 0.45 * (1.0 - 0.75 * uNight);
      vec3 wallC = vCol * (0.84 + 0.26 * vn(vUv.xy * 0.35 + seed * 9.0)) * (1.0 - 0.12 * step(0.5, fract(vUv.x / 6.8)));
      vec3 glass = mix(vec3(0.02, 0.03, 0.05), mix(uHaze, uZen, 0.5), 0.4 * (1.0 - step(0.8, hp)));
      col = mix(wallC * light, glass * (0.45 + 0.9 * sunT), mix(band * 0.5, win, lod));
      col += uSunCol * 2.2 * step(0.9, hp) * win * lod * sunT * (1.0 - uNight) * pow(max(sin(uTime * (0.8 + 1.5 * fract(hp * 13.0)) + hp * 90.0), 0.0), 12.0);
      col += uNight * mix(vec3(1.0, 0.80, 0.52), vec3(0.78, 0.88, 1.0), step(0.75, fract(hp * 3.3))) * step(0.45, hp) * mix(band * 0.35, win * 1.3, lod);
      col *= 0.5 + 0.5 * smoothstep(0.0, 9.0, vUv.z);
    }
    else if (vFace > 0.5) {
      vec2 g = vec2(vUv.x / 1.9, vUv.y / 3.7);
      float lod = 1.0 - smoothstep(0.15, 0.6, max(dU.x / 1.9, dU.y / 3.7));
      vec2 id = floor(g), f = fract(g);
      float hp = h21(id + seed * 57.0);
      vec3 V = normalize(uCam - vP + vec3(0.0, 1e-3, 0.0));
      vec3 Nj = normalize(N + 0.035 * lod * vec3(hp - 0.5, fract(hp * 7.0) - 0.5, fract(hp * 13.0) - 0.5));
      vec3 R = reflect(-V, Nj);
      vec3 sky = mix(uHaze, uZen, smoothstep(0.0, 0.8, R.y));
      vec3 land = uBrick * (0.55 + 0.3 * vn(R.xz * 6.0 + seed)) * (0.5 + 0.5 * cloud);
      vec3 sky2 = mix(uHaze, uZen * 1.2, smoothstep(0.0, 0.8, abs(R.y) * 0.7 + 0.12));
      float sunW = max(dot(N, uSunDir), 0.0) * cloud;
      vec3 refl = mix(mix(sky2, land, 0.22), sky, smoothstep(-0.06, 0.04, R.y)) * (0.40 + 0.60 * sunW);
      float fr = 0.62 + 0.38 * pow(1.0 - clamp(dot(V, N), 0.0, 1.0), 3.0);
      col = vCol * (0.03 + 0.07 * sunW) + refl * fr * mix(vec3(1.0), vCol * 2.0, 0.3) * (0.30 + 0.70 * sunW);
      col += uSunCol * 0.34 * sunW * fr * (1.0 - uNight);                                        // a low sun lights the whole facade it faces
      col *= 0.60 + 0.40 * step(0.24, fract(vUv.y / 14.8));                            // spandrel bands that survive distance
      vec2 id2 = floor(vUv.xy / vec2(7.6, 7.4)); float hq = h21(id2 + seed * 31.0);       // a pane here and there flashes the sun back and lets it go
      col += uSunCol * 2.4 * step(0.86, hq) * sunW * (1.0 - uNight) * pow(max(sin(uTime * (0.8 + 1.5 * fract(hq * 13.0)) + hq * 90.0), 0.0), 12.0);
      col *= 1.0 - 0.35 * lod * step(0.72, hp);                                      // blinds
      float mull = max(step(f.y, 0.10), step(0.46, abs(f.x - 0.5)));
      float sunT = max(dot(N, uSunDir), 0.0) * cloud;
      col = mix(col, vec3(0.36, 0.38, 0.40) * (uSunCol * sunT + uSkyCol * 0.6), mull * lod * 0.85);
      // glints: the true mirror direction, plus facades whose plan angle throws the sun toward the eye flare, single panes brightest
      vec2 rh = R.xz / max(length(R.xz), 1e-3), sh2 = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
      float az = max(dot(rh, sh2), 0.0), az2 = az * az, az8 = az2 * az2 * az2 * az2, az32 = az8 * az8 * az8 * az8;
      float flare = (0.10 * az8 * az8 + 1.2 * az32 * az32 * (0.3 + 0.7 * mix(1.0, step(0.55, hp), lod)) * (0.2 + 0.8 * step(0.62, fract(seed * 13.7)))) * (1.0 - mull * lod);
      col += uSunCol * (8.0 * pow(max(dot(R, uSunDir), 0.0), 900.0) + 1.6 * pow(max(dot(R, uSunDir), 0.0), 60.0) + flare * smoothstep(0.1, 0.5, uSunDir.y)) * cloud * (1.0 - uNight);
      col += uNight * mix(vec3(1.0, 0.86, 0.62), vec3(0.75, 0.88, 1.0), step(0.7, fract(hp * 3.3))) * step(0.5, hp) * (1.0 - mull * lod) * mix(0.55, 1.5, lod);
      col *= 0.42 + 0.58 * smoothstep(0.0, 16.0, vUv.z);                                 // dark podium: the towers stand on the floor, not in it
    } else {
      vec2 hs = vSize.xz * 0.5; float edge = min(hs.x - abs(vUv.x), hs.y - abs(vUv.y));
      vec3 alb = mix(vec3(0.30, 0.31, 0.32), vec3(0.20, 0.21, 0.23), step(edge, 0.7));
      alb = mix(alb, vec3(0.62), step(abs(vUv.x - hs.x * 0.3), hs.x * 0.22) * step(abs(vUv.y + hs.y * 0.2), hs.y * 0.3));
      col = alb * (uSunCol * max(uSunDir.y, 0.0) * cloud + uSkyCol) + uNight * vec3(1.0, 0.2, 0.1) * step(edge, 0.7) * 0.6 * (1.0 - step(0.5, vMisc.w));
    }
    col = mix(col, bowlAir(col, vP), 0.6);                                              // the towers stand clear of the haze that lies on the floor
    col = mix(col, uHaze * 1.25 * (uSunCol * 0.55 + uSkyCol * 1.4), seaVeil(vP.y) * 0.9);
    gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
    #include <fog_fragment>
  }`;

function buildTowers(bowl, rng, pal, U, roads, seedKey) {
  const n = 40, MID = 84, max = n * 3 + MID, pos = new Float32Array(max * 3), size = new Float32Array(max * 3), rg = new Float32Array(max * 4), col = new Float32Array(max * 3), misc = new Float32Array(max * 4);
  const cx = 1400 + rng.range(-40, 60), cz = 120 + rng.range(-60, 80), baseAng = rng.range(0, Math.PI), placed = [];
  const tints = [new THREE.Color('#4f86b8'), new THREE.Color('#3f9c98'), new THREE.Color('#8a94a6'), new THREE.Color('#b98a4e'), pal.blue.clone().lerp(new THREE.Color('#ffffff'), 0.3)];
  let k = 0; const casters = [];
  for (let i = 0, tries = 0; i < n && tries < 900; tries++) {
    const r = 230 * Math.sqrt(rng()), a = rng() * 6.283, x = cx + Math.cos(a) * r * 1.25, z = cz + Math.sin(a) * r;
    let ok = true; for (const p of placed) if (Math.hypot(p[0] - x, p[1] - z) < 34) { ok = false; break; }
    if (!ok) continue; placed.push([x, z]); i++;
    const h = (60 + 90 * Math.pow(rng(), 1.6)) * (1 - 0.35 * r / 230), w = rng.range(20, 30), d = rng.range(18, 28), ang = baseAng + (rng() < 0.7 ? 0 : rng.range(-0.5, 0.5));
    const tint = rng.pick(tints), y = bowl.height(x, z), sd = rng();
    const put = (ww, hh, dd) => {
      pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; size[k * 3] = ww; size[k * 3 + 1] = hh; size[k * 3 + 2] = dd;
      rg[k * 4] = Math.cos(ang); rg[k * 4 + 1] = Math.sin(ang); col[k * 3] = tint.r; col[k * 3 + 1] = tint.g; col[k * 3 + 2] = tint.b;
      misc[k * 4] = sd; misc[k * 4 + 1] = 1; misc[k * 4 + 2] = 1; k++;
    };
    put(w, h * (rng() < 0.6 ? rng.range(0.55, 0.8) : 1), d);
    if (size[(k - 1) * 3 + 1] < h - 1) put(w * rng.range(0.55, 0.75), h, d * rng.range(0.6, 0.8));
    else if ((sd * 7.31) % 1 < 0.5) put(w * 0.6, h * (1.14 + 0.1 * ((sd * 3.17) % 1)), d * 0.6);          // setback crown (no extra random draws)
    casters.push([x, z, 0.45 * (w + d) * 0.5, h]);
  }
  // round the glass knot, a wider ring of mid-rises in painted render, eight to eighteen floors, squared up to the
  // same street grid: downtown steps down into the brick city instead of ending at an edge (their own stream of draws)
  {
    const mr = makeRng('rim-midrise:' + seedKey), rend = ['#d9d2c0', '#c9b79a', '#b9c6d2', '#d2a48c', '#a8b0b4', '#c88a62', '#e2ddd0'].map((h) => new THREE.Color(h));
    const mids = [];
    for (let i = 0, tries = 0; i < MID && tries < 2400 && k < max; tries++) {
      const rr = Math.sqrt(mr()), r = 170 + 450 * rr, a = mr() * 6.283, x = cx + Math.cos(a) * r * 1.35, z = cz + Math.sin(a) * r;
      const hh = (24 + 32 * mr()) * (1 - 0.5 * rr), w = mr.range(17, 30), d = mr.range(13, 19), turn = mr() < 0.5, skew = mr() < 0.8 ? 0 : mr.range(-0.4, 0.4), tint = mr.pick(rend), m = mr.range(0.62, 0.8), sd = mr();
      let ok = !roads.taken.has(roadKey(x, z));
      for (const p of placed) if (ok && Math.hypot(p[0] - x, p[1] - z) < 31) ok = false;
      for (const L of LANDMARKS) if (ok && Math.abs(x - L[0]) < L[2] + 16 && Math.abs(z - L[1]) < L[2] + 16) ok = false;
      if (!ok) continue; placed.push([x, z]); i++;
      const ang = baseAng + (turn ? Math.PI / 2 : 0) + skew;
      pos[k * 3] = x; pos[k * 3 + 1] = bowl.height(x, z); pos[k * 3 + 2] = z; size[k * 3] = w; size[k * 3 + 1] = hh; size[k * 3 + 2] = d;
      rg[k * 4] = Math.cos(ang); rg[k * 4 + 1] = Math.sin(ang); col[k * 3] = tint.r * m; col[k * 3 + 1] = tint.g * m; col[k * 3 + 2] = tint.b * m;
      misc[k * 4] = sd; misc[k * 4 + 1] = 1; misc[k * 4 + 2] = 1; misc[k * 4 + 3] = 1; k++;
      mids.push([x, z, 0.45 * (w + d) * 0.5, hh]);
    }
    mids.sort((a, b) => b[3] - a[3]);
    for (const m of mids) casters.push(m);
  }
  const tw = U.uTw.value;
  for (let i = 0; i < tw.length; i++) { const c = casters[i]; if (c) tw[i].set(c[0], c[1], c[2], c[3]); else tw[i].set(0, 0, 0, 0); }
  const base = buildCubeGeometry(), g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const a of ['position', 'normal', 'aFace']) g.setAttribute(a, base.attributes[a]);
  const ia = (arr, c) => new THREE.InstancedBufferAttribute(arr.subarray(0, k * c), c);
  g.setAttribute('iPos', ia(pos, 3)); g.setAttribute('iSize0', ia(size, 3)); g.setAttribute('iRotGrad', ia(rg, 4)); g.setAttribute('iCol', ia(col, 3)); g.setAttribute('iMisc', ia(misc, 4));
  g.instanceCount = k;
  const mat = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, vertexShader: CUBE_VERT, fragmentShader: TOWER_FRAG,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uBrick: { value: pal.brick }, uPale: { value: pal.pale }, uFarGrow: { value: 0 } }]) });
  Object.assign(mat.uniforms, U);
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return { mesh: m, center: new THREE.Vector3(cx, bowl.height(cx, cz) + 60, cz) };
}

// ---------- the triple-summit ice mountain and its banner cloud ----------
const FAR_FOG = /* glsl */`
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, min(fogFactor, uFarK.x));
  #endif`;
async function buildPeak(ctx, noise, rng, pal, U) {
  // The massif stands 24 degrees right of the line just beyond the far rim. It is 1.26 times the size it was first built
  // (and 175 m further off, so its foot still stands behind the rim): the triple summit rises 16 degrees over the far rim.
  const bearing = 24 * Math.PI / 180, dist = 4475, cb = Math.cos(bearing), sb = Math.sin(bearing);
  const C = new THREE.Vector3(dist * cb, -90, dist * sb), ux = -sb, uz = cb, vx = cb, vz = sb;
  const Wd = 4400, Dp = 2400, H = 1370, NU = 120, NV = 44, o1 = rng.range(0, 50), o2 = rng.range(0, 50);
  const order = rng.shuffle([0.74, 1.0, 0.82]); if (order[0] === 1.0 && rng() < 0.5) order.reverse();
  const sum = [{ u: -0.26 + rng.range(-0.03, 0.03), v: 0.42, h: order[0], r: 0.30 }, { u: 0.01 + rng.range(-0.03, 0.03), v: 0.48, h: order[1], r: 0.33 }, { u: 0.27 + rng.range(-0.03, 0.03), v: 0.44, h: order[2], r: 0.29 }];
  const hAt = (u, v) => {
    let h = 0;
    for (const s of sum) {
      const du = (u - s.u), dv = (v - s.v) * 0.62, ang = Math.atan2(dv, du);
      const rr = Math.hypot(du, dv) / (s.r * (1 + 0.28 * noise.n2(ang * 1.9 + s.u * 9, o1) + 0.12 * noise.n2(ang * 5.3, o2 + s.u * 5)));
      const c = Math.max(0, 1 - rr); h = Math.max(h, s.h * (0.72 * Math.pow(c, 1.55) + 0.28 * c));
    }
    const saddle = 0.34 * Math.max(0, 1 - Math.abs(v - 0.46) / 0.42) * Math.max(0, 1 - Math.abs(u) / 0.5);
    h = Math.max(h, saddle * (0.8 + 0.3 * noise.n2(u * 6 + o1, v * 3)));
    h *= 0.80 + 0.30 * noise.ridged2(u * 3.4 + o1, v * 3.1 + o2, 4);       // buttresses and aretes
    h *= 0.95 + 0.10 * noise.ridged2(u * 11 + o2, v * 8 + o1, 2);          // ribs and couloirs between them
    return h * smoothstep(0.5, 0.42, Math.abs(u)) * smoothstep(0, 0.1, v) * smoothstep(1, 0.86, v);
  };
  const NVD = Math.ceil(0.66 * NV);                                        // the back of the massif, beyond its summit ridge, is never seen from the bowl: no triangles there
  const SU = NU + 1, N = SU * (NV + 1), pos = new Float32Array(N * 3), ah = new Float32Array(N), ash = new Float32Array(N * 2), idx = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const u = i / NU - 0.5, v = j / NV, k = j * SU + i, h = hAt(u, v);
    pos[k * 3] = C.x + ux * u * Wd + vx * (v - 0.35) * Dp; pos[k * 3 + 1] = C.y + h * H; pos[k * 3 + 2] = C.z + uz * u * Wd + vz * (v - 0.35) * Dp; ah[k] = h;
    if (i < NU && j < NV && j < NVD) idx.push(k, k + 1, k + SU, k + 1, k + SU + 1, k + SU);
  }
  await ctx.yield();
  // each vertex: is it in the shadow another part of the massif throws (the sun ray walked over the height grid), and how
  // deep in a hollow it lies. The lit faces and the blue ones are cut by these, crisp at any distance.
  {
    const sun = U.uSunDir.value, gAt = (fi, fj) => {
      const a = fi < 0 ? 0 : (fi > NU - 0.001 ? NU - 0.001 : fi), b = fj < 0 ? 0 : (fj > NV - 0.001 ? NV - 0.001 : fj), i = a | 0, j = b | 0, tx = a - i, tz = b - j, k = j * SU + i;
      return (ah[k] * (1 - tx) + ah[k + 1] * tx) * (1 - tz) + (ah[k + SU] * (1 - tx) + ah[k + SU + 1] * tx) * tz;
    };
    const di = (sun.x * ux + sun.z * uz) / Wd * NU, dj = (sun.x * vx + sun.z * vz) / Dp * NV, dy = Math.max(0.05, sun.y) / H;
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
      const k = j * SU + i, h = ah[k]; let sh = 1;
      for (let s = 50, n = 0; n < 20 && sh > 0; n++, s *= 1.24) {
        const over = (gAt(i + di * s, j + dj * s) - (h + dy * s)) * H, soft = 6 + 0.05 * s;
        if (over > -soft) sh = Math.min(sh, clamp(1 - (over + soft) / (2 * soft), 0, 1));
      }
      const avg = (gAt(i - 3, j) + gAt(i + 3, j) + gAt(i, j - 2) + gAt(i, j + 2)) * 0.25;
      ash[k * 2] = sh; ash[k * 2 + 1] = 1 - clamp((avg - h) * 9, 0, 1);
    }
    await ctx.yield();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aH', new THREE.BufferAttribute(ah, 1)); g.setAttribute('aSh', new THREE.BufferAttribute(ash, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  if (g.attributes.normal.array[(Math.round(NV / 3) * SU + (NU >> 1)) * 3 + 1] < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); g.computeVertexNormals(); }
  const mat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uIce: { value: pal.ice }, uPale: { value: pal.pale } }]),
    vertexShader: FOG_V_PARS + /* glsl */`attribute float aH; attribute vec2 aSh; varying vec3 vP; varying vec3 vN; varying float vH; varying vec2 vSh;
      void main(){ vP = position; vN = normal; vH = aH; vSh = aSh; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F_PARS + GLSL_COMMON + /* glsl */`uniform vec3 uIce; uniform vec3 uPale; varying vec3 vP; varying vec3 vN; varying float vH; varying vec2 vSh;
      void main(){
        vec3 N0 = normalize(vN + vec3(0.0, 1e-4, 0.0));
        float sh = clamp(vSh.x, 0.0, 1.0), ao = clamp(vSh.y, 0.0, 1.0);
        float n = fbm(vP.xz * 0.004 + vP.y * 0.003), n2v = fbm(vP.xz * 0.02 + vP.y * 0.017 + 5.0);
        vec3 N = normalize(N0 + 0.45 * vec3(n2v - 0.5, 0.0, fbm(vP.zx * 0.02 + 9.0) - 0.5));
        float steep = 1.0 - smoothstep(0.42, 0.74, N.y + 0.25 * (n2v - 0.5));
        // rock bands: cliffs that cross the snow faces at their own heights, too steep to hold it
        float band = smoothstep(0.60, 0.72, vn(vec2(dot(vP.xz, vec2(0.6, 0.8)) * 0.0032 + 4.0 * n, vP.y * 0.0075 + 3.0 * n2v))) * smoothstep(0.35, 0.6, vn(vP.xz * 0.0016 + 7.0)) * (1.0 - smoothstep(0.78, 0.94, N0.y));
        float snowline = smoothstep(0.24 - 0.13 * uWet, 0.40 - 0.16 * uWet, vH + 0.14 * (n - 0.5) + 0.10 * (1.0 - ao));
        vec3 rock = mix(vec3(0.13, 0.11, 0.125), vec3(0.24, 0.185, 0.17), n2v) * (0.9 + 0.2 * step(0.5, fract(vP.y * 0.013 + 3.0 * n)));
        vec3 scree = mix(uPale * 0.62, rock, 0.5 + 0.3 * n);
        vec3 ice = uIce * (1.02 + 0.10 * n2v);
        // glaciers lie in the hollows: blue ice, crossed by crevasses
        float gl = (1.0 - smoothstep(0.45, 0.85, ao)) * (1.0 - steep);
        float crev = smoothstep(0.72, 0.9, abs(sin(vP.y * 0.085 + 5.0 * n2v))) * gl;
        ice = mix(ice, vec3(0.56, 0.76, 0.93), 0.35 * smoothstep(0.55, 0.9, fbm(vP.xz * 0.012 + vP.y * 0.02)) + 0.4 * gl);
        ice = mix(ice, vec3(0.20, 0.40, 0.62), 0.6 * crev);
        vec3 alb = mix(scree, mix(ice, rock, max(steep * (0.82 - 0.3 * uWet), band * 0.85)), snowline);
        float sunT = max(dot(N, uSunDir), 0.0) * sh;
        vec3 col = alb * (uSunCol * sunT * 1.05 + uSkyCol * (0.55 + 0.5 * N.y) * (0.75 + 0.5 * ao));
        col = mix(col, uHaze, (0.16 + 0.14 * (1.0 - smoothstep(0.0, 0.35, vH))) * uFarK.y);        // air between here and there
        gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
        ${FAR_FOG}
      }`,
  });
  Object.assign(mat.uniforms, U);
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  // banner cloud off the highest summit, spindrift off the other two
  const P = [], UV = [], PH = [], I = [];
  let top = sum[0]; for (const s of sum) if (s.h > top.h) top = s;
  const dir = new THREE.Vector3(0.45 + ux * 0.9, 0.04, uz * 0.9).normalize();
  for (const s of sum) {
    const big = s === top, len = big ? 1900 : 600, segs = 12, b0 = P.length / 3, ph = rng.range(0, 20);
    const tx = C.x + ux * s.u * Wd + vx * (s.v - 0.35) * Dp, tz = C.z + uz * s.u * Wd + vz * (s.v - 0.35) * Dp, ty = C.y + hAt(s.u, s.v) * H - (big ? 15 : 8);
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, wdt = (big ? 38 + 315 * Math.pow(t, 0.7) : 18 + 113 * Math.pow(t, 0.7)), rise = (big ? 139 : 50) * t;
      for (const sd of [-1, 1]) { P.push(tx + dir.x * t * len, ty + rise + sd * wdt, tz + dir.z * t * len); UV.push(t, sd); PH.push(ph, big ? 1 : 0.55); }
      if (i < segs) { const q = b0 + i * 2; I.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
  }
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); bg.setAttribute('aPh', new THREE.Float32BufferAttribute(PH, 2)); bg.setIndex(I);
  const bmat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
    vertexShader: FOG_V_PARS + /* glsl */`attribute vec2 aPh; varying vec2 vUv; varying vec2 vPh;
      void main(){ vUv = uv; vPh = aPh; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F_PARS + GLSL_COMMON + /* glsl */`varying vec2 vUv; varying vec2 vPh;
      void main(){
        float t = clamp(vUv.x, 0.0, 1.0), s = clamp(vUv.y, -1.0, 1.0);
        vec2 q = vec2(t * 5.0 - uTime * 0.05 + vPh.x, s * 1.4 + vPh.x);
        float d = fbm(q) * 0.65 + fbm(q * 2.7 + 3.0) * 0.35;
        float env = smoothstep(0.0, 0.05, t) * (1.0 - t) * (1.0 - t * 0.3) * (1.0 - smoothstep(0.35, 1.0, abs(s + 0.25 * (d - 0.5))));
        float a = smoothstep(0.22, 0.52, d * (0.6 + env)) * sqrt(max(env, 0.0)) * vPh.y * 1.6;
        vec3 col = mix(vec3(0.62, 0.72, 0.90), vec3(1.0), smoothstep(-0.6, 0.7, s + d - 0.5)) * (uSunCol * 0.85 + uSkyCol * 0.5);
        gl_FragColor = vec4(col, clamp(a, 0.0, 0.92));
        ${FAR_FOG}
      }`,
  });
  Object.assign(bmat.uniforms, U);
  const banner = new THREE.Mesh(bg, bmat); banner.frustumCulled = false; banner.renderOrder = 2;
  return { mesh, banner, bearing, half: Math.atan(0.5 * Wd / dist), top: new THREE.Vector3(C.x + ux * top.u * Wd + vx * (top.v - 0.35) * Dp, C.y + hAt(top.u, top.v) * H, C.z + uz * top.u * Wd + vz * (top.v - 0.35) * Dp), look: new THREE.Vector3(C.x, C.y + H * 0.5, C.z) };
}

// ---------- smoke: soft plumes leaning east off the chimneys of the two spurs, thinner cooking-fire threads beyond ----------
function buildSmoke(set, rng, U, detail, seedKey) {
  const n = Math.min(Math.round(70 * detail), set.n), segs = 12, P = [], A = [], I = [];
  const sites = [];
  for (let k = 0; k < n; k++) {                                           // the same draws as ever, so the seed's towers and peak stay as they were
    const i = rng.int(0, set.n - 1), x = set.pos[i * 3] + rng.range(-1.5, 1.5), y = set.pos[i * 3 + 1] + set.size[i * 3 + 1] + 0.6, z = set.pos[i * 3 + 2] + rng.range(-1.5, 1.5), sd = rng();
    if (k % 2 === 0) sites.push([x, y, z, sd, 0]);                        // half of them stay, as threads
  }
  // sixteen proper plumes from house roofs on the spurs beside the line (their own stream of draws)
  const own = makeRng('rim-smoke:' + seedKey), cand = [], candNear = [];
  for (let i = 0; i < set.n; i++) { const x = set.pos[i * 3], z = set.pos[i * 3 + 2], az = Math.abs(z); if (x > 40 && x < 480 && az > 60 && az < 150) { cand.push(i); if (x < 170) candNear.push(i); } }
  for (let k = 0; k < 30 && cand.length > 0; k++) {                       // the first twelve rise from the cliff-foot houses the reveal looks down on
    const from = k < 12 && candNear.length > 0 ? candNear : cand, i = from[own.int(0, from.length - 1)];
    sites.push([set.pos[i * 3] + own.range(-1, 1), set.pos[i * 3 + 1] + set.size[i * 3 + 1] + 0.4, set.pos[i * 3 + 2] + own.range(-1, 1), own(), 1]);
  }
  for (const st of sites) {
    const b0 = P.length / 3;
    for (let j = 0; j <= segs; j++) {
      for (const side of [-1, 1]) { P.push(st[0], st[1], st[2]); A.push(j / segs, side, st[3], st[4]); }
      if (j < segs) { const q = b0 + j * 2; I.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aTS', new THREE.Float32BufferAttribute(A, 4)); g.setIndex(I);
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
    vertexShader: FOG_V_PARS + /* glsl */`
      uniform float uTime; attribute vec4 aTS; varying vec4 vTS; varying float vND;
      void main(){
        float t = aTS.x, sd = aTS.z, big = aTS.w; vTS = aTS;
        float H = mix(12.0 + 12.0 * sd, 17.0 + 13.0 * sd, big), ph = sd * 40.0;   // low and blown flat by the updraught: chimney smoke, not a pillar
        vec3 p = position + vec3(0.0, t * H, 0.0);
        p.x += t * mix(5.0 + 4.0 * sd, 9.0 + 7.0 * sd, big) + t * t * mix(8.0 + 6.0 * sd, 16.0 + 12.0 * sd, big) + sin(uTime * 0.7 + t * 5.0 + ph) * t * mix(1.6, 2.6, big);
        p.z += t * mix(2.0, 4.0, big) + t * t * mix(3.0, 7.0, big) + cos(uTime * 0.55 + t * 4.0 + ph * 1.3) * t * mix(1.5, 2.4, big);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        float w = max(mix(0.4 + 3.6 * t, 0.5 + 3.6 * t, big), 0.0016 * length(mvPosition.xyz));
        mvPosition.x += aTS.y * w; vND = length(mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F_PARS + GLSL_COMMON + /* glsl */`
      varying vec4 vTS; varying float vND;
      void main(){
        float t = clamp(vTS.x, 0.0, 1.0), s = clamp(vTS.y, -1.0, 1.0), big = vTS.w;   // along 0..1 and across -1..1, held to their ranges before the squares below
        // puffs that climb the plume: two scales of noise scrolling up it
        float puff = 0.62 * vn(vec2(s * 1.3 + vTS.z * 9.0, t * 4.5 - uTime * 0.55)) + 0.38 * vn(vec2(s * 3.1 + vTS.z * 5.0, t * 11.0 - uTime * 1.1));
        float edge = 1.0 - s * s; edge *= edge;
        float a = smoothstep(0.0, 0.07, t) * (1.0 - t) * edge * smoothstep(0.26, 0.74, puff + 0.34 * (1.0 - t)) * mix(0.36, (0.55 + 0.25 * (1.0 - smoothstep(0.0, 0.35, t))) * (1.0 - 0.7 * t), big);
        vec3 col = mix(vec3(0.50, 0.50, 0.53), vec3(0.74, 0.72, 0.70), puff) * (uSunCol * 0.8 * (1.0 - 0.7 * uRimSh.z) * (0.6 + 0.4 * smoothstep(-0.6, 0.6, s)) + uSkyCol * 1.1);
        a *= mix(smoothstep(14.0, 40.0, vND), smoothstep(45.0, 110.0, vND), big);                    // close to the eye a plume is a smear across the picture: it thins away
        gl_FragColor = vec4(col, a * (1.0 - 0.4 * uRimSh.z) * (1.0 - 0.55 * uNight));
        #include <fog_fragment>
      }`,
  });
  Object.assign(mat.uniforms, U);
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 3; return m;
}

// ---------- assembly ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = makeNoise(rng.int(1, 2147483000));
  const hex = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const pal = { blue: new THREE.Color(hex[0]), brick: new THREE.Color(hex[1]), pale: new THREE.Color(hex[2]), ice: new THREE.Color(hex[3]), red: new THREE.Color(hex[4]), green: new THREE.Color(hex[5]), violet: new THREE.Color(hex[6]) };
  pal.ice.multiplyScalar(0.84); pal.pale.multiplyScalar(0.92);
  // the brief's sun: 64 degrees up in the north-north-west (left of travel and a little behind)
  const el = 64 * Math.PI / 180, sunBrief = new THREE.Vector3(-0.38 * Math.cos(el), Math.sin(el), -0.925 * Math.cos(el)).normalize();
  if (opts.sunDir) { sunBrief.copy(opts.sunDir).normalize(); if (sunBrief.y < 0.12) { sunBrief.y = 0.12; sunBrief.normalize(); } }   // brief-frame key light for the baked shading
  const hmDefault = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); hmDefault.needsUpdate = true;
  const U = {
    uSunDir: { value: sunBrief.clone() }, uSunCol: { value: new THREE.Color('#FFF6E6').multiplyScalar(1.02) },
    uSkyCol: { value: new THREE.Color(0.115, 0.17, 0.33) }, uCam: { value: new THREE.Vector3(0, 60, 0) }, uTime: { value: 0 },
    uNight: { value: 0 }, uRimSh: { value: new THREE.Vector3(0, 0, 0) }, uCab: { value: new THREE.Vector4(0, 0, 0, 0) }, uLine: { value: new THREE.Vector4(0, 0, 0, 0) },
    uHaze: { value: new THREE.Color(0.50, 0.66, 0.90) }, uZen: { value: new THREE.Color(0.05, 0.14, 0.42) },
    uHM: { value: hmDefault }, uHMRect: { value: new THREE.Vector4(0, 0, 1e-7, 1e-7) }, uCloudY: { value: -1e5 }, uWet: { value: 0 }, uFarK: { value: new THREE.Vector3(0.42, 1, 1) },
    uCloudU: { value: new THREE.Vector4(0, 0, 100, 0) }, uDist: { value: new THREE.Vector4(0, 0, 0, 0) }, uAir: { value: new THREE.Vector4(0, 0, 0, 0) },
    uTw: { value: Array.from({ length: 48 }, () => new THREE.Vector4(0, 0, 0, 0)) },   // towers that throw a long shadow on the floor (terrain shader)
    uPxK: { value: 0.0016 },                                              // world size of one pixel per metre of distance, set each frame for the cable ribbons
    uBS: { value: hmDefault }, uBSRect: { value: new THREE.Vector4(0, 0, 1e-7, 1e-7) },   // the bowl from above: ridge shadows and city density (terrain shader)
  };
  { const dr = makeRng('rim-district:' + ctx.seed); U.uDist.value.set(dr.range(0, 6.283), dr.range(0, 6.283), 0, 0); }   // its own stream: the piece's draws stay as they were
  const inner = new THREE.Group(), object = new THREE.Group(); object.add(inner); object.name = 'over-the-rim-hero';
  if (opts.frame !== 'brief') { inner.rotation.y = Math.PI / 2; inner.position.set(0, -FLOOR_Y, BOWL_CX); }
  inner.updateMatrix();
  const M = inner.matrix.clone(), Minv = M.clone().invert();
  const P = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(M);
  const D = (x, y, z) => new THREE.Vector3(x, y, z).transformDirection(M);

  const bowl = makeBowl(noise, rng);
  await ctx.yield();
  const bmap = await buildBowlMap(ctx, bowl, sunBrief); U.uBS.value = bmap.tex; U.uBSRect.value.copy(bmap.rect);
  await ctx.yield();
  const tGeo = await buildTerrainGeometry(ctx, bowl, sunBrief);
  const green0 = rng.range(0.05, 0.7);
  const tMat = makeTerrainMaterial(U, pal, bowl.pitch, opts.green ?? green0, ctx.quality?.detail ?? 1); Object.assign(tMat.uniforms, U);
  const terrain = new THREE.Mesh(tGeo, tMat); terrain.frustumCulled = false; inner.add(terrain);
  await ctx.yield();

  const roads = buildRoads(bowl, rng, pal, U, sunBrief); inner.add(roads.mesh);
  await ctx.yield();
  const line = makeLineTable();
  const py = await buildPylons(ctx, bowl, rng, pal, opts);
  await ctx.yield();
  const metal = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65, metalness: 0.1 });
  metal.onBeforeCompile = (sh) => {                                       // bounce off the clay warms the shadow sides (the sky fill alone turns them pure blue)
    sh.uniforms.uFillSun = U.uSunCol;
    sh.fragmentShader = 'uniform vec3 uFillSun;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vColor.rgb * uFillSun * vec3(0.15, 0.10, 0.045);');
  };
  inner.add(new THREE.Mesh(py.structure, metal));
  const spin = { value: 0 };
  const wheelMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.3 });
  wheelMat.onBeforeCompile = (sh) => {
    sh.uniforms.uSpin = spin;
    sh.vertexShader = 'attribute vec3 aPivot; uniform float uSpin;\n' + sh.vertexShader
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n float csn = cos(uSpin), snn = sin(uSpin); objectNormal.xy = vec2(csn * objectNormal.x - snn * objectNormal.y, snn * objectNormal.x + csn * objectNormal.y);')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vec2 rel = transformed.xy - aPivot.xy; transformed.xy = aPivot.xy + vec2(csn * rel.x - snn * rel.y, snn * rel.x + csn * rel.y);');
  };
  const wheels = new THREE.Mesh(py.wheels, wheelMat); wheels.frustumCulled = false; inner.add(wheels);
  inner.add(buildCables(line, U));
  await ctx.yield();
  const cabins = buildCabins(line, pal, opts); inner.add(cabins.mesh);
  await ctx.yield();

  const cubes = await buildCubes(ctx, bowl, rng, pal, sunBrief, roads, py.pylonXZ, { ...opts, districtOffset: [U.uDist.value.x, U.uDist.value.y] }, U);
  for (const m of cubes.meshes) inner.add(m);
  await ctx.yield();
  if (cubes.near.n > 0) inner.add(buildSmoke(cubes.near, rng, U, ctx.quality?.detail ?? 1, ctx.seed));
  await ctx.yield();
  const towers = buildTowers(bowl, rng, pal, U, roads, ctx.seed); inner.add(towers.mesh);
  await ctx.yield();
  let peak = null;
  if (opts.peak !== false) { peak = await buildPeak(ctx, noise, rng, pal, U); inner.add(peak.mesh); inner.add(peak.banner); }
  await ctx.yield();

  // ---- anchors (chosen frame) ----
  const eye = (x) => P(x, eyeY(x), 0);
  const fx = [-90, -72, -54, -36, -20, -6, 4, 14, 26, 38, 62, 100, 150, 200, 250, 300, 325, 335, 345, X_D, 372, 393, RIDE_X1];
  const anchors = {
    rim: P(0, 0, 0), entry: eye(RIDE_X0), flyThrough: fx.map(eye),
    portalSeat: { position: P(RIDE_X1, Y_END, 0), facing: D(-Math.cos(10 * Math.PI / 180), Math.sin(10 * Math.PI / 180), 0), radius: 7, tilt: 10 * Math.PI / 180 },
    viewpoints: { rimReveal: eye(8), firstSpur: eye(142), secondSpur: eye(285), approach: eye(378) },
    lookAt: { bowl: P(1250, -330, 260), towers: towers.center.clone().applyMatrix4(M), peak: peak ? peak.look.clone().applyMatrix4(M) : P(3900, 450, 1750), pitch: P(bowl.pitch.x, bowl.pitch.y, bowl.pitch.z), farWall: P(3050, -160, 300) },
    pylons: py.pylons.map((p) => ({ base: p.base.clone().applyMatrix4(M), top: p.top.clone().applyMatrix4(M) })), gantryIndex: py.gantryIndex,
    spurs: [{ from: eye(104), to: eye(182) }, { from: eye(228), to: eye(325) }],
    pitch: P(bowl.pitch.x, bowl.pitch.y, bowl.pitch.z), sunDir: sunBrief.clone().transformDirection(M), briefToLocal: M.clone(),
    returnCableOffset: RETURN_DZ, cableAboveEye: CABLE_UP, rideLength: line.ride,
  };

  const occ = new Set();
  for (let i = 0; i < cubes.near.n; i++) { const x = cubes.near.pos[i * 3], z = cubes.near.pos[i * 3 + 2]; if (x < 470 && Math.abs(z) < 90) occ.add((Math.floor(x / 6) + 64) * 1024 + Math.floor(z / 6) + 64); }
  // ---- runtime ----
  let travel = -1, sunWorld = null;
  const view = { c: P(560, -130, 0), r: 300, h: 700 };
  const tv = new THREE.Vector3(), inv = new THREE.Matrix4(), tv2 = new THREE.Vector3(), bufSize = new THREE.Vector2();
  const hero = {
    object, radius: view.r, height: view.h, center: view.c, anchors, ground: false, groundY: 0,
    extent: { radius: 1900, depth: -FLOOR_Y, peakTop: peak ? peak.top.clone().applyMatrix4(M) : null },
    stats: { houses: cubes.count }, uniforms: U, roadLines: roads.lines, pitchInfo: bowl.pitch,
    setCabinGlow(k) { cabins.glow.value = k; },
    setPitchDots(k) { tMat.uniforms.uDots.value = k; },                 // 0 when the world fields its own players
    makeCable(lines) { return cableRibbon(lines, U); },                 // brief-frame ribbons for another ropeway (add to the scene yourself)
    landmarks: LANDMARKS,
    barrioAt(x, z) { return bowl.barrio(x, z); },
    houseAt(x, z) { const i = Math.floor(x / 6) + 64, j = Math.floor(z / 6) + 64; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (occ.has((i + a) * 1024 + j + b)) return true; return false; },   // brief frame: a hero house within about 8 m (near the ride only)                       // brief frame: 0..1 how built-up the hero made this spot
    massif: peak ? { bearing: peak.bearing, half: peak.half } : null,     // brief frame, radians: where the massif stands (right of the line, seen from the lip) and half the angle it spans
    farRimAt(bearing) {                                                 // brief frame: metres from the lip to the far rim of the bowl along a bearing (radians, to the right of the line)
      const c = Math.cos(bearing), s = Math.sin(bearing), inBowl = (r) => { bowl.height(c * r, s * r); return bowl.info.d > 0; };
      let hi = 200; while (hi < 8000 && inBowl(hi)) hi += 50;
      let lo = hi - 50; for (let i = 0; i < 10; i++) { const m = 0.5 * (lo + hi); if (inBowl(m)) lo = m; else hi = m; }
      return hi;
    },
    eyeYAt(x) { return eyeY(x); },                                      // brief frame: eye height of the ride above/below the plateau
    heightAt(x, z) { tv2.set(x, 0, z).applyMatrix4(Minv); return bowl.height(tv2.x, tv2.z) + M.elements[13]; },
    // The ground as it is drawn. The terrain mesh takes bowl.height at its own vertices only (beyond the cliff its rings and
    // spokes are 9 to 10 m apart) and draws flat triangles between them, so between vertices the drawn ground stands up to
    // a couple of metres over or under heightAt. This is the height of the mesh's own triangle over (x, z), chosen frame:
    // for what must lie on the ground that is seen (a paved lane), where heightAt would bury it or leave it in the air.
    groundAt(x, z) {
      tv2.set(x, 0, z).applyMatrix4(Minv);
      const g = tGeo.userData.grid, ds = g.ds, ths = g.ths, C = ths.length, pos = tGeo.attributes.position.array;
      const ex = (BOWL_CX - tv2.x) / BOWL_A, ez = tv2.z / bowl.B, th = Math.atan2(ez, ex), d = (1 - Math.hypot(ex, ez) / bowl.wob(th)) * BOWL_A;
      let r = 0, r1 = ds.length - 1, c = 0, c1 = C - 1;
      while (r1 - r > 1) { const m = (r + r1) >> 1; if (ds[m] <= d) r = m; else r1 = m; }
      while (c1 - c > 1) { const m = (c + c1) >> 1; if (ths[m] <= th) c = m; else c1 = m; }
      const a = (r * C + c) * 3, b = a + 3, e = a + C * 3, f = e + 3;                    // the cell's corners: a, b on the inner ring, e, f on the outer; its triangles are (a, b, e) and (b, f, e)
      const ux = pos[b] - pos[a], uz = pos[b + 2] - pos[a + 2], vx = pos[e] - pos[a], vz = pos[e + 2] - pos[a + 2], px = tv2.x - pos[a], pz = tv2.z - pos[a + 2];
      const k = 1 / (ux * vz - uz * vx), s = (px * vz - pz * vx) * k, t = (ux * pz - uz * px) * k;
      if (s + t <= 1) return pos[a + 1] + s * (pos[b + 1] - pos[a + 1]) + t * (pos[e + 1] - pos[a + 1]) + M.elements[13];
      const wx = pos[e] - pos[f], wz = pos[e + 2] - pos[f + 2], yx = pos[b] - pos[f], yz = pos[b + 2] - pos[f + 2], qx = tv2.x - pos[f], qz = tv2.z - pos[f + 2];
      const k2 = 1 / (wx * yz - wz * yx), s2 = (qx * yz - qz * yx) * k2, t2 = (wx * qz - wz * qx) * k2;
      return pos[f + 1] + s2 * (pos[e + 1] - pos[f + 1]) + t2 * (pos[b + 1] - pos[f + 1]) + M.elements[13];
    },
    setProgress(u) { travel = clamp(u, 0, 1) * line.ride; },
    setTravel(m) { travel = Math.max(0, m); },
    setSun(dirWorld, sunColor, skyColor) { sunWorld = dirWorld ? new THREE.Vector3().copy(dirWorld).normalize() : null; if (sunColor) U.uSunCol.value.copy(sunColor); if (skyColor) U.uSkyCol.value.copy(skyColor); },
    update(dt, time, camera) {
      U.uTime.value = time;
      inner.updateWorldMatrix(true, false); inv.copy(inner.matrixWorld).invert();
      if (camera) {
        tv.setFromMatrixPosition(camera.matrixWorld); U.uCam.value.copy(tv.applyMatrix4(inv));
        if (ctx.renderer && camera.projectionMatrix) { ctx.renderer.getDrawingBufferSize(bufSize); U.uPxK.value = 2 / (Math.max(0.2, Math.abs(camera.projectionMatrix.elements[5])) * Math.max(120, bufSize.y)); }
      }   // never getWorldPosition: it would rebuild the portal camera's matrix
      if (sunWorld) { tv.copy(sunWorld).transformDirection(inv); if (tv.y > 0.05) U.uSunDir.value.copy(tv); }
      const keyed = travel >= 0, d0 = keyed ? travel : time * 6;
      cabins.place(d0, time, keyed && !opts.ownCabin);
      spin.value = -(d0 / 0.28) % 6.2831853;
    },
    dispose() { hmDefault.dispose(); bmap.tex.dispose(); },
  };
  hero.update(0, 0, null);
  return hero;
}
