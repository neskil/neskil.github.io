// HERO SET PIECE for "oculus-day": THE BEAM AND ITS DISC inside the coffered dome.
//
// What it is
//   The whole lighting machine of the rotunda, six times life size: the hemispherical dome (inner radius 130 m,
//   springing at y = 130, crown 260) with 140 stepped coffers (five rings of 28, four 1 m steps each, a gilt
//   rosette in every one), the smooth band and the bronze rim of the oculus (clear radius 26.4 m, eye plane
//   y = 257.2, rim 9 m deep), the stepped outer shell seen for the last second, the coloured marble floor
//   (18 m squares, circles and squares, drains, wet and snow masks, a blurred sheen of the eye and of the disc),
//   a stand-in drum wall, and the BEAM: one analytic shaft of light from the eye along -sunDir with its
//   travelling disc of sun, motes blazing inside it, and a column of rain, snow or rose petals under the eye.
//   Origin = centre of the floor. +Y up. The DOOR is at +Z (front). Azimuths in this file are "door-clockwise
//   seen from above": az -> (x, z) = (-sin az, cos az). The camera comes in travelling toward -Z, so "right of
//   the door" is +X. THE HERO MUST SIT AT THE WORLD ORIGIN, UNROTATED AND UNSCALED: every shader works in world
//   space (the room is the world).
//
// The one uniform block (hero.uniforms, shared by every material here and by anything you make with
// hero.makeStoneMaterial): uSunDir, uSunColor (colour x power), uFill (cool light falling from the eye),
// uAmbient, uBouncePos / uBounceCol (soft light from the disc, tinted by what it lands on), uEye, uCloud,
// uSky. All of it is a function of the journey progress u (noon at 0.52), set by setProgress(u).
// A point is sunlit when its ray toward the sun passes through both the bottom and the top of the eye's throat,
// so the disc is a lens at dawn and dusk and a full ellipse at noon, exactly as the beam is.
//
// opts
//   palette   [shadow, stone blue, travertine, noon white, gold, porphyry, copper] hex strings (brief default)
//   look      'summer' | 'april' | 'shower' | 'snow' | 'night'   (default: picked from ctx.rng / ctx.vary.hour)
//             april: lower sun, the noon disc lands on the wall over the door (centre about y = 50).
//             shower: cloud shuts the eye from u 0.35 to 0.5, rain falls as a bright column (short streaks of every
//             length inside a silver veil, a second beam volume), rings open where drops land, a wet circle
//             spreads on the floor and drains. snow: slow flakes, a white disc gathers, beam at a quarter.
//             night: the moon's silver disc makes the same journey.
//   rare      true: red rose petals pour through the eye from u 0.55 (default ctx.vary.rare)
//   drum      true (default): stand-in drum wall, lower order + attic, so the disc has somewhere to land.
//             'attic': keep only the attic band (y 78..130, coloured panels and blind windows) and its cornice.
//             false: no drum at all. The world builds niches, columns and door and drops the stand-in.
//   floor     true (default) the marble floor disc (radius 131). false: bring your own.
//   exterior  true (default) outer stepped shell of the dome, seen after leaving through the eye.
//   sunAt     optional (u) => { az, el } in degrees to replace the sun track (az = where the sun IS).
//
// anchors (hero-local = world space)
//   eye          Vector3 (0, 257.2, 0) centre of the oculus plane;  eyeRadius 26.4;  rimTop y = 266.2
//   portalSeat   { position (0, 271.2, 0), normal, radius 7 }: the portal hangs in the middle of the eye 5 m
//                above the rim, tilted; normal points back down the approach (66 degrees from level, coming
//                from 16 degrees clockwise of the door side), so use portal { tilt: true }.
//   flyThrough   ordered points: the last 150 m of a safe line (curl under the eye, then 60 m dead straight
//                at 66 degrees up the throat). At least 19 m clear of the rim everywhere.
//   reveal       { position, lookAt }: just inside the door, the whole beam from eye to disc (u 0.10).
//   closePass    { position, lookAt, ring, y }: 12 m off the second ring of coffers at 182 m up (u 0.77).
//   viewpoints   a few more good camera positions.
//   door         { az: 0, position (0,0,130) }   apse { az: 180 }
// Extra API
//   setProgress(u)       REQUIRED every frame from the world's update(u): moves the sun, the disc, the colour
//                        of the day, the weather of the look and the rare petals. Never wall-clock.
//                        (Until it is first called the piece demos itself: the day follows the camera round.)
//   uniforms             the shared block. state: { u, sunDir, sunColor, power, cloud, fill, sky, fog, disc,
//                        discOn ('dome'|'drum'|'floor'), look } refreshed by setProgress; state.sky and
//                        state.fog are suggested sky-in-the-eye and haze colours (linear) for this hour;
//                        state.disc is the live centre of the disc of sun (use it for a poi).
//   makeStoneMaterial({ kind, color, gloss, vertexColors })  a material lit by the same block for the world's
//                        columns, niches, door and portico. kind: 'marble' (veined), 'concrete', 'bronze',
//                        'gilt', 'plain', 'revet' (veined slabs with joints), 'granite', 'paving' (6 m slabs on
//                        an 18 m grid). outer: true = the piece stands beyond the door wall (passage, portico):
//                        the sun reaches it only through the doorway and the open sky lights it. open: true (with
//                        uniforms: { uOpen: { value: Vector2(sun gain, sky gain) } }) = it stands in the open square.
//                        Works with InstancedMesh + instanceColor and vertex colours.
//   mop                  Vector4 (x0, z0, x1, z1): the two ends of the mopped stripe on the floor.
//   GLSL                 the shader chunk (uniform declarations + oculusSun(p), oculusLight(p, n, albedo, ao))
//                        if you write your own material: spread hero.uniforms into yours and include it.
//   sunAt(u), discAt(u)  the sun direction and the disc centre for any u (for planning pois and bird bursts).
//   domePoint(azDeg, elevDeg, inset)  a point on the dome's inner face (elevation above the springing).
//   setBeamGain(g, cap, near), setMoteGain(g), setFall(kind, amount)  manual overrides ('rain' | 'snow' | 'petals' |
//                        'none' | 'auto'). near: metres over which the lit air thins to a veil toward the camera.
//                        floorSun: { value } how much of the sun the paving takes (0.5).
//   setLook(name, rare)  change the look after building (all looks share the geometry).
//   setBeamShape(knee, gain, foot)  the shaft is light, never a solid: its brightness goes through a soft knee, it is
//                        brightest on its axis and fades to nothing at its edge, and thins toward its foot (foot = share left).
//                        uniforms.uHalo: strength of the warm glow round the disc of sun (soft-edged, about 30 m wide).
//
// Size and cost: the room is 130 m in radius and 266 m tall (outer shell radius 168). `radius` (40) and `height`
// (275) describe the beam column and are what the orbit viewer needs to stay inside the room. About 108k
// triangles (115k while rain, snow or petals fall), 11 or 12 draw calls, no lights, about 130 ms build.
// ctx.quality.detail thins only the motes and the falling particles.
// Lighting it expects: NONE from the scene. Every material is self-lit from the shared block (scene lights are
// ignored), honours scene fog (pale haze, FogExp2 about 0.0016, colour state.fog) and writes linear HDR: the
// disc of sun reaches about 2 to 3.5, the beam core about 1, the hall sits four stops below. Bloom threshold
// about 0.9 keeps bloom on the disc, the beam core and the sky. The sky seen through the eye is the world's.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';

const DEFAULT_PALETTE = ['#121620', '#3C4A66', '#B9B2A6', '#FFF6E0', '#D9A441', '#6E2A3A', '#E07A3A'];
const R_DOME = 130, Y_SPRING = 130, EYE_R = 26.4, THROAT = 6.0, RIM_DEPTH = 9;
const EYE_Y = Y_SPRING + Math.sqrt(R_DOME * R_DOME - 27 * 27);      // 257.17
const DEG = Math.PI / 180, NBAY = 28;
const C_DOME = new THREE.Vector3(0, Y_SPRING, 0);

// door-clockwise azimuth + elevation (radians) -> unit vector
const dirAzEl = (az, el, out = new THREE.Vector3()) => out.set(-Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
// point on a sphere round the dome centre
const sph = (az, el, r, out = new THREE.Vector3()) => dirAzEl(az, el, out).multiplyScalar(r).add(C_DOME);

// ---------------------------------------------------------------------------------------------
// the day: sun track and colour ramp, both pure functions of u
// ---------------------------------------------------------------------------------------------
function sunTrack(u, look) {
  const noonEl = look === 'april' ? 58 : 76;
  let az, el;
  if (u <= 0.52) { const s = (u - 0.09) / 0.43; az = 75 + 105 * s; el = 12 + (noonEl - 12) * s; }
  else { const s = (u - 0.52) / 0.48; az = 180 + 106 * s; el = noonEl - (noonEl - 14) * Math.pow(s, 0.6); }
  return { az, el: Math.max(el, 5) };
}
// keys: [u, sun colour, sun power, fill colour, fill power, sky colour, sky power]
function dayKeys(pal, look) {
  const C = (h) => new THREE.Color(h);
  const dawn = C(pal[1]).lerp(C('#9aa2dc'), 0.6), white = C(pal[3]), copper = C(pal[6]).lerp(C('#ffd9b0'), 0.15), gold = C(pal[4]).lerp(C('#fff0d0'), 0.3);
  if (look === 'night') {
    const moon = C('#d2dbf2'), f = C('#5b627a');
    return [[0, moon, 0.5, f, 0.8, C('#0a1230'), 0.5], [0.09, moon, 1.25, f, 0.9, C('#0c1638'), 0.6], [0.52, C('#e4e9f6'), 1.9, C('#666c82'), 0.95, C('#101c44'), 0.7], [1, C('#d6dcf2'), 1.5, f, 0.9, C('#0c1638'), 0.6]];
  }
  const k = [
    // sunrise comes in rose gold through a hall still blue with the night; by mid-morning it is warm white
    [0.0, C('#ffa878'), 2.2, dawn.clone(), 1.05, C('#2a3266'), 0.7],
    [0.09, C('#ffbc84'), 3.7, dawn.clone(), 1.45, C('#4a5aa6'), 1.2],
    [0.25, C('#ffdcae'), 4.2, C('#8a93ae'), 1.15, C('#4d86d6'), 1.9],
    [0.4, C('#ffeed6'), 4.3, C('#95a6c0'), 1.05, C('#5592e4'), 2.2],
    [0.52, white.clone(), 4.3, C('#9db2cf'), 1.0, C('#5a9cf0'), 2.4],
    [0.6, C('#ffe6b4'), 4.3, C('#97a4c6'), 1.0, C('#6a9ee8'), 2.3],
    [0.70, gold, 4.2, C('#8c8fb2'), 1.05, C('#7fa0dc'), 2.0],
    [0.82, copper.clone(), 3.5, C('#807aa8'), 1.4, C('#d98a78'), 1.8],
    [1.0, copper.clone().lerp(C(pal[6]), 0.4), 3.3, C('#6c6494'), 1.3, C('#e0855a'), 1.7],
  ];
  if (look === 'snow') for (const r of k) { r[1] = r[1].clone().lerp(C('#e8eef8'), 0.75); r[2] *= 0.25; r[3] = r[3].clone().lerp(C('#aab4c6'), 0.6); r[4] *= 1.15; r[5] = C('#c9d0dc'); r[6] = 1.3; }
  if (look === 'april') for (const r of k) { r[1] = r[1].clone().lerp(C('#fff4e4'), 0.25); r[2] *= 0.92; r[5] = r[5].clone().lerp(C('#bcd4f2'), 0.3); }
  return k;
}
function sampleDay(keys, u, out) {
  let i = 0; while (i < keys.length - 2 && u > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1], t = smoothstep(0, 1, clamp((u - a[0]) / (b[0] - a[0]), 0, 1));
  out.sun.copy(a[1]).lerp(b[1], t); out.power = lerp(a[2], b[2], t);
  out.fill.copy(a[3]).lerp(b[3], t).multiplyScalar(lerp(a[4], b[4], t));
  out.sky.copy(a[5]).lerp(b[5], t).multiplyScalar(lerp(a[6], b[6], t));
  return out;
}
// where the beam's axis lands: floor, drum or dome. Returns the surface kind.
function discHit(S, out) {
  const k = 129.2;
  const tf = EYE_Y / Math.max(S.y, 1e-3);
  const hx = S.x, hz = S.z, hl = Math.hypot(hx, hz);
  const tc = hl > 1e-4 ? k / hl : 1e9;
  if (tf <= tc) { out.set(-S.x * tf, 0, -S.z * tf); return 'floor'; }
  const yc = EYE_Y - S.y * tc;
  if (yc <= Y_SPRING) { out.set(-S.x * tc, yc, -S.z * tc); return 'drum'; }
  // sphere: |E - S t - C| = k, E - C = (0, e, 0)
  const e = EYE_Y - Y_SPRING, b = -S.y * e, c = e * e - k * k, t = -b + Math.sqrt(Math.max(b * b - c, 0));
  out.set(-S.x * t, EYE_Y - S.y * t, -S.z * t); return 'dome';
}

// ---------------------------------------------------------------------------------------------
// shared GLSL: the uniform block, the "is this point in the sun" test and the stone lighting
// ---------------------------------------------------------------------------------------------
const OC_GLSL = fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + /* glsl */`
#ifndef OCULUS_GLSL
#define OCULUS_GLSL
uniform vec3 uSunDir, uSunColor, uFill, uAmbient, uBouncePos, uBounceCol, uSky, uCandle;
uniform vec3 uLamp;       // lamp light welling up the drum at dusk (zero by day)
uniform float uBounceK;   // 1 / (reach of the bounce squared)
uniform float uHalo;      // strength of the glow round the disc of sun
uniform float uOuter;     // how bright the porch and the square stand next to the hall (1; lower once the eye is inside at night)
uniform vec4 uEye;     // x: y of the eye plane, y: clear radius, z: throat depth, w: cloud texture amount
uniform vec4 uCloud;   // xy: scroll (m), z: overall transmission 0..1, w: time
// cloud shadows crossing the eye, in eye-plane metres: 1 = clear
float ocCloudTex(vec2 h){
  vec2 q = (h + uCloud.xy)*0.021;
  float n = vnoise(q)*0.65 + vnoise(q*2.3 + 3.7)*0.35;
  return 1. - uEye.w*smoothstep(0.42, 0.74, n);
}
// 0..1: does the ray from p toward the sun pass through the bottom and the top of the throat?
float oculusSun(vec3 p){
  float sy = max(uSunDir.y, 0.02);
  vec2 k = uSunDir.xz/sy;
  vec2 h = p.xz + k*max(uEye.x - p.y, 0.);
  vec2 h2 = p.xz + k*max(uEye.x + uEye.z - p.y, 0.);
  float d = max(length(h), length(h2));
  return (1. - smoothstep(uEye.y - 6., uEye.y + 1.5, d))*ocCloudTex(h)*uCloud.z;
}
// the glow round the disc of sun: light scattered out of the shaft by its dust and thrown back by the lit stone, so the
// ellipse has no cut edge but a warm halo that dies away over some twenty metres
float ocHalo(vec3 p){
  float sy = max(uSunDir.y, 0.02);
  vec2 k = uSunDir.xz/sy;
  float d = max(length(p.xz + k*max(uEye.x - p.y, 0.)), length(p.xz + k*max(uEye.x + uEye.z - p.y, 0.)));
  float hl = 1. - smoothstep(uEye.y - 9., uEye.y + 30., d);
  return hl*hl*uCloud.z;
}
// soft light from the disc of sun: xyz direction to it, w strength
vec4 ocBounce(vec3 p){
  vec3 L = uBouncePos - p; float d2 = dot(L, L); float dl = sqrt(d2 + 1.);
  return vec4(L/dl, (1./(1. + d2*uBounceK))*(1. - smoothstep(120., 210., dl)));
}
// candle light on the stones round the drum: two tall candelabra inside each exedra, two small ones in each shrine,
// two in the portico. Positions repeat every 45 degrees, so the point is folded into one bay.
float ocCandleAt(vec3 d, vec3 n){ float d2 = dot(d, d); return (0.35 + 0.65*max(dot(n, -d)/sqrt(d2 + 1e-3), 0.))*30./(d2 + 14.); }
vec3 ocCandles(vec3 p, vec3 n){
  float r = length(p.xz);
  // at dusk the lamps of the exedrae throw their light up the wall above them: warm on the entablature and the attic,
  // dying away into the lowest coffers, strongest over the middle of each bay
  vec3 up = vec3(0.);
  if (r > 92. && p.y > 56. && p.z < 150.) {
    float bay = 0.6 + 0.4*cos(8.*atan(-p.x, p.z + 1e-5));
    up = uLamp*(smoothstep(56., 66., p.y)*exp(-max(p.y - 64., 0.)/30.)*bay*(0.5 + 0.5*max(-n.y, 0.)));
  }
  if (r < 92. || p.y > 76.) return up;
  float e = 0.;
  if (p.z > 150.) {
    e = ocCandleAt(p - vec3(18.2, 18.2, 174.), n) + ocCandleAt(p - vec3(-18.2, 18.2, 174.), n);
  } else {
    float az = atan(-p.x, p.z + 1e-5);
    float a1 = az - 0.7853982*floor(az/0.7853982 + 0.5);
    float c1 = cos(a1), s1 = sin(a1), sA = (-p.x*c1 - p.z*s1)/r, cA = (p.z*c1 - p.x*s1)/r;
    // bay frame: x runs clockwise along the wall, z outward through it
    vec3 q = vec3(s1*r, p.y, c1*r), nq = vec3(-n.x*cA - n.z*sA, n.y, -n.x*sA + n.z*cA);
    float door = step(0.3927, abs(az));
    e += door*(ocCandleAt(q - vec3(12.6, 21.2, 134.5), nq) + ocCandleAt(q - vec3(-12.6, 21.2, 134.5), nq));
    float a2 = az - 0.3926991; a2 -= 0.7853982*floor(a2/0.7853982 + 0.5);
    float c2 = cos(a2), s2 = sin(a2); sA = (-p.x*c2 - p.z*s2)/r; cA = (p.z*c2 - p.x*s2)/r;
    q = vec3(s2*r, p.y, c2*r); nq = vec3(-n.x*cA - n.z*sA, n.y, -n.x*sA + n.z*cA);
    e += 0.3*(ocCandleAt(q - vec3(5.4, 13.6, 124.1), nq) + ocCandleAt(q - vec3(-5.4, 13.6, 124.1), nq));
  }
  return uCandle*e + up;
}
// shadows of the big projecting mouldings on the drum wall, so that the disc of sun models the wall it lands on.
// One ring: a point at radius r and height y, under a moulding whose lip stands at radius ro between yb and yt, is in
// shadow when its ray toward the sun (which climbs k metres for every metre it travels inward) meets that lip.
float ocBand(float y, float r, float k, float yb, float yt, float ro){
  float yh = y + max(r - ro, 0.)*k;
  return 1. - smoothstep(yb - 0.6, yb + 0.6, yh)*(1. - smoothstep(yt - 0.5, yt + 2.5, yh))*step(y, yb + 0.6)*step(ro + 0.2, r);
}
// a slab standing out from the wall (the entablature of a shrine, the cornice over the door) in the frame of its bay:
// q = (along the wall, height, metres out from the wall), sl = the sun in that frame (along, out)
float ocSlab(vec3 q, vec2 sl, float ys, float hx, float zo){
  float t = (ys - q.y)/max(uSunDir.y, 0.05);
  float lx = abs(q.x + sl.x*t), lz = q.z + sl.y*t;
  return 1. - (1. - smoothstep(hx - 0.5, hx + 0.5, lx))*smoothstep(-0.9, -0.2, lz)*(1. - smoothstep(zo - 0.5, zo + 0.5, lz))*step(q.y, ys - 0.2);
}
float ocMould(vec3 p){
  float r = length(p.xz);
  if (r < 116. || p.y > 122. || p.z > 131.) return 1.;
  vec2 ni = -p.xz/r;
  float k = uSunDir.y/max(dot(uSunDir.xz, ni), 0.05);
  float s = ocBand(p.y, r, k, 64., 72., 127.6)*ocBand(p.y, r, k, 71.5, 79.6, 126.9)*ocBand(p.y, r, k, 121.5, 132.6, 125.8)*ocBand(p.y, r, k, 46.6, 48., 129.3);
  float az = atan(-p.x, p.z + 1e-5);
  // the shrine in the middle of every pier
  float a2 = az - 0.3926991; a2 -= 0.7853982*floor(a2/0.7853982 + 0.5);
  float mid = az - a2, sm = sin(mid), cm = cos(mid);
  vec2 sl = vec2(-cm*uSunDir.x - sm*uSunDir.z, sm*uSunDir.x - cm*uSunDir.z);
  s *= ocSlab(vec3(r*sin(a2), p.y, 130. - r*cos(a2)), sl, 31., 11.2, 7.);
  // the cornice over the door
  s *= ocSlab(vec3(-p.x, p.y, 130. - p.z), vec2(-uSunDir.x, -uSunDir.z), 48.6, 19., 4.2);
  return s;
}
// the portico (z 166..266, roofed at 84 m, open at both sides and in front) in the low sun: a point is lit when its ray
// toward the sun leaves under the roof beams by an open side, and does not meet one of the sixteen columns on the way
float ocPorchCol(vec3 p, vec2 sd, float xc){
  float t = (xc - p.x)/sd.x;
  if (t < 0. || abs(xc - p.x) < 6.5) return 1.;
  float zc = p.z + sd.y*t, dz = abs(mod(zc - 167.5, 25.) - 12.5);
  float inRow = step(168., zc)*step(zc, 267.);
  return 1. - inRow*(1. - smoothstep(3.6, 5.6, dz*abs(sd.x)/max(length(sd), 1e-3)));
}
// (the low sun is taken to stand in front of the porch, on the side it really is: it rakes across the door wall and
// the bronze leaves, and the columns lay their shadows over them)
vec3 ocPorchDir(){ return normalize(vec3(uSunDir.x + 0.25*sign(uSunDir.x + 1e-4), uSunDir.y*0.8, abs(uSunDir.z) + 0.5)); }
float ocPorch(vec3 p){
  if (p.z < 160.) return 0.;
  vec3 S = ocPorchDir();
  float sg = sign(S.x), t = min((62.*sg - p.x)/S.x, (266. - p.z)/S.z);
  float yE = p.y + S.y*t;
  float lit = 1. - smoothstep(78., 86., yE);
  vec2 sd = S.xz;
  return lit*ocPorchCol(p, sd, 56.*sg)*ocPorchCol(p, sd, 21.5*sg)*ocPorchCol(p, sd, -21.5*sg);
}
// diffuse light on a stone surface: sun through the eye (times your own shadow term), fill from the eye, bounce.
// In the sun a coloured stone keeps its depth: its albedo is pulled toward its own hue and held down against the
// white stone beside it (the eye is exposed for the white), so porphyry stays purple and giallo stays gold under a
// light that would otherwise bleach them.
vec3 oculusLightS(vec3 p, vec3 n, vec3 albedo, float ao, float shadow){
  float ndl = max(dot(n, uSunDir), 0.);
  vec3 toE = vec3(0., uEye.x, 0.) - p; toE /= max(length(toE), 1e-3);
  float fe = 0.16 + 0.84*max(dot(n, toE)*0.55 + 0.45, 0.);
  vec4 b = ocBounce(p);
  float bw = max(dot(n, b.xyz), 0.)*0.85 + 0.15;
  float mxa = max(albedo.r, max(albedo.g, albedo.b)), mna = min(albedo.r, min(albedo.g, albedo.b));
  vec3 deep = albedo*mix(vec3(1.), albedo/max(mxa, 0.04), 0.45)*(1. - 0.46*(1. - mna/max(mxa, 0.04)));
  return deep*(uSunColor*(ndl*shadow*oculusSun(p))) + albedo*((uFill*fe + uAmbient*(1.05 - 0.6*n.y))*ao + uBounceCol*(bw*b.w*ao) + ocCandles(p, n)*ao
    + uSunColor*vec3(1., 0.86, 0.66)*(ocHalo(p)*uHalo*(0.4 + 0.6*bw)*(0.5 + 0.5*ao)));
}
vec3 oculusLight(vec3 p, vec3 n, vec3 albedo, float ao){ return oculusLightS(p, n, albedo, ao, 1.); }
#endif
`;

const STONE_VERT = fx.GLSL_FOG_PARS_VERT + /* glsl */`
#ifdef COFFER
attribute vec4 aCofA; attribute vec4 aCofB; attribute vec2 aMisc;
varying vec4 vCofA; varying vec4 vCofB; varying vec2 vMisc;
#endif
varying vec3 vW; varying vec3 vN; varying vec3 vCol;
void main(){
  vec4 wp = vec4(position, 1.); vec3 n = normal;
  #ifdef USE_INSTANCING
  wp = instanceMatrix*wp; n = mat3(instanceMatrix)*n;
  #endif
  wp = modelMatrix*wp; vW = wp.xyz; vN = mat3(modelMatrix)*n;
  vCol = vec3(1.);
  #ifdef USE_COLOR
  vCol *= color.rgb;
  #endif
  #ifdef USE_INSTANCING_COLOR
  vCol *= instanceColor;
  #endif
  #ifdef COFFER
  vCofA = aCofA; vCofB = aCofB; vMisc = aMisc;
  #endif
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
` + fx.GLSL_FOG_VERT + '}';

// marbles shared by the drum and the floor
const MARBLE_GLSL = /* glsl */`
uniform vec3 uPorph, uGold, uWhite, uGrey, uGreen; uniform float uSeed;
float ocVein(vec2 p, float f){ return 1. - smoothstep(0., 0.11, abs(sin(dot(p, vec2(.31, .23)) + f*6.))); }
vec3 mPorphyry(vec2 p){ float f = fbmLo(p*0.33); float sp = vnoise(p*8.), s2 = vnoise(p*3.1 + 4.);
  vec3 c = uPorph*(0.62 + 0.8*f); c = mix(c, c*vec3(0.55, 0.5, 0.75), smoothstep(.45, .8, s2)*.6);
  return c + vec3(.22, .13, .16)*smoothstep(.74, .92, sp)*0.3; }
vec3 mGiallo(vec2 p){ float f = fbmLo(p*0.2); float v = ocVein(p*1.3, f);
  vec3 c = uGold*(0.72 + 0.5*f); c = mix(c, c*vec3(1.1, .72, .55), smoothstep(.5, .85, vnoise(p*0.8 + 3.))*.55);
  // giallo antico: pale clasts in a deeper, redder ground, the whole crossed by rust veins
  float cl = vnoise(p*1.15 + 13.) - 0.3*vnoise(p*3.7);
  c = mix(c*vec3(0.9, 0.78, 0.66), c*vec3(1.07, 1.05, 0.98) + vec3(.02, .02, .012), smoothstep(.24, .44, cl));
  return mix(c, c*vec3(.5, .34, .32), clamp(v*.7 + ocVein(p.yx*2.1 + 4., f)*.4, 0., 1.)*.7); }
vec3 mWhite(vec2 p){ float f = fbmLo(p*0.17);
  float v = 1. - smoothstep(0., 0.34, abs(sin(dot(p, vec2(.31, .23)) + f*6.))), v2 = 1. - smoothstep(0., 0.3, abs(sin(dot(p.yx*1.7 + 9., vec2(.31, .23)) + f*6.)));
  return mix(uWhite*(0.84 + 0.2*f), uWhite*vec3(0.5, 0.46, 0.56), clamp(v*.6 + v2*.35, 0., 1.)*(0.3 + 0.5*fbmLo(p*0.6 + 3.))); }
vec3 mGranite(vec2 p){ float sp = vnoise(p*7.), s2 = vnoise(p*17. + 5.);
  return uGrey*(0.6 + 0.3*fbmLo(p*.3))*(0.8 + 0.35*sp) + vec3(.05)*step(.8, s2); }
vec3 mGreen(vec2 p){ float f = fbmLo(p*0.3); float sp = vnoise(p*5.), v = ocVein(p*1.1 + 5., f), v2 = ocVein(p.yx*2.3 + 2., f);
  vec3 c = uGreen*(0.55 + 0.85*f); c = mix(c, c*vec3(0.3, 0.42, 0.4), smoothstep(.4, .75, vnoise(p*1.7 + 8.))*.7);
  c = mix(c, vec3(.3, .36, .3), clamp(v*.5 + v2*.3, 0., 1.)*.6);
  return c + vec3(.16, .2, .15)*smoothstep(.76, .92, sp)*.4; }
float ocBox(vec2 p, vec2 b){ vec2 d = abs(p) - b; return max(d.x, d.y); }
float ocLine(float d, float w){ float aa = max(fwidth(d), 1e-4); return (1. - smoothstep(w, w + aa*1.5, abs(d)))*clamp(w*2.5/aa, 0., 1.); }
`;

const STONE_FRAG_HEAD = fx.GLSL_NOISE + fx.GLSL_FOG_PARS_FRAG + OC_GLSL + /* glsl */`
uniform vec3 uColor; uniform float uGloss;
#ifdef OC_OPEN
uniform vec2 uOpen;    // gain of the sun and of the sky on what stands in the open square
#endif
varying vec3 vW; varying vec3 vN; varying vec3 vCol;
#ifdef COFFER
varying vec4 vCofA; varying vec4 vCofB; varying vec2 vMisc;
#endif
`;

// albedo + ao + shadow for the dome: weathered concrete, trowel marks, pour lines, stains, coffer step shadows
const CONCRETE_GLSL = /* glsl */`
void surface(vec3 p, inout vec3 n, float dist, out vec3 alb, out float ao, out float sh, out float gloss, out vec3 tint){
  vec3 q = p - vec3(0., 130., 0.); float ql = max(length(q), 1e-3); q /= ql;
  float fine = 1. - smoothstep(50., 200., dist);
  float az1 = atan(q.x, q.z + 1e-5), az2 = atan(-q.x, -q.z + 1e-5);
  float el = asin(clamp(q.y, -1., 1.));
  float sw = smoothstep(2.0, 2.9, abs(az1));
  vec2 c1 = vec2(az1*130., el*130.), c2 = vec2(az2*130. + 77., el*130.);
  vec2 w1 = c1 + 3.2*vec2(vnoise(c1*0.3), vnoise(c1*0.3 + 7.)), w2 = c2 + 3.2*vec2(vnoise(c2*0.3), vnoise(c2*0.3 + 7.));
  float trowel = mix(vnoise(w1*vec2(0.8, 2.3)), vnoise(w2*vec2(0.8, 2.3)), sw);
  float streak = mix(vnoise(c1*vec2(0.33, 0.035)), vnoise(c2*vec2(0.33, 0.035)), sw);
  float crk = mix(vnoise(w1*0.1), vnoise(w2*0.1), sw);
  float big = fbm(p*0.045);
  float pm = fbm(p*0.085 + 3.);
  float fine2 = 1. - smoothstep(18., 70., dist);
  float pits = vnoise(p*2.7), pit2 = smoothstep(0.78, 0.9, vnoise(p*5.3));
  // the smooth band round the eye (above the fifth ring) is seen close as we leave. No grain there: a broad soft tone,
  // trowel courses in rings, stains running down from the rim, and a little more light toward the eye
  float bandK = smoothstep(0.985, 1.03, el), bt = clamp((1.361 - el)/0.384, 0., 1.);
  alb = uColor*vCol*mix(0.7 + 0.55*big, 0.84 + 0.2*big, bandK);
  // old stucco still clinging in patches over the darker, cooler bare concrete
  float stucco = smoothstep(0.5, 0.54, pm);
  alb = mix(alb, mix(alb*vec3(0.86, 0.88, 0.92), alb*vec3(1.06, 1.03, 0.97), stucco), 1. - 0.75*bandK);
  // rain streaks only low on the dome (they would crowd into scratches round the eye); up there, soft broad stains
  float hi = smoothstep(0.62, 1.0, el);
  alb *= 1. - 0.38*smoothstep(0.48, 0.8, streak)*(0.4 + 0.6*big)*(1. - hi);
  alb *= 1. - 0.3*hi*smoothstep(0.42, 0.75, mix(vnoise(c1*vec2(0.035, 0.05) + 9.), vnoise(c2*vec2(0.035, 0.05) + 9.), sw))*(0.5 + 0.5*pm)*(1. - bandK);
  alb *= 1. + fine*((trowel - 0.5)*0.36 + (pits - 0.5)*0.22)*(1. - 0.92*bandK);
  alb *= 1. - 0.4*pit2*fine2*(1. - bandK);
  if (bandK > 0.001) {
    vec2 hq = q.xz/max(length(q.xz), 1e-4);
    float crs = el*130./0.85, cj = abs(fract(crs) - 0.5), cwd = 0.06 + dist*0.0025;
    float course = (0.95 + 0.1*hash12(vec2(floor(crs + 0.5), 7.)))*(1. - 0.14*(1. - smoothstep(cwd, cwd*2.2 + 0.04, cj))*clamp(0.2/cwd, 0., 1.));
    course = mix(1., course, 1. - smoothstep(90., 180., dist));
    float sa = vnoise(hq*13. + 3.), sb = vnoise(hq*37. + 11.), sl = 0.15 + 0.7*vnoise(hq*23. + 20.);
    float stain = smoothstep(0.56, 0.8, sa*0.6 + sb*0.4)*(1. - smoothstep(sl*0.3, sl, bt))*(0.6 + 0.4*smoothstep(0., 0.08, bt));
    float spill = (1. - bt)*(1. - bt);      // light from the sky in the eye spills a little way down the band
    alb *= mix(vec3(1.), course*(1. - 0.26*stain)*(0.74 + 1.25*spill)*mix(vec3(1.), vec3(1.22, 1.0, 0.82), spill), bandK);
    alb = mix(alb, alb*vec3(0.9, 0.97, 0.92), stain*0.4*bandK);     // a green-grey tinge where the water runs
  }
  // formwork: broad rings 2.7 m high, each pour a slightly different tone, with a soft lip between them
  float fb = el*130./2.7, fj = abs(fract(fb) - 0.5), fw = 0.05 + dist*0.0012;
  alb *= (0.94 + 0.12*hash12(vec2(floor(fb + 0.5), 3.)))*(1. - 0.1*(1. - smoothstep(fw, fw*2.5 + 0.03, fj))*clamp(0.16/fw, 0., 1.));
  // old settlement cracks: no more than a soft seam of darker stone, and nothing at all close to
  float cw = 0.035 + dist*0.0003;
  alb *= 1. - 0.13*(1. - smoothstep(0., cw, abs(crk - 0.5)))*smoothstep(0.45, 0.6, big)*smoothstep(20., 70., dist)*(1. - smoothstep(160., 320., dist));
  ao = 1.; sh = 1.; gloss = uGloss; tint = vec3(1.);
  #ifdef COFFER
  if (vMisc.y > 0.5) {
    // local frame of the sphere here: tA along azimuth, tE up the dome, -q into the room
    vec2 hz = q.xz/max(length(q.xz), 1e-4);
    vec3 tA = vec3(-hz.y, 0., hz.x);
    float ce = length(q.xz);
    vec3 tE = vec3(-hz.x*q.y, ce, -hz.y*q.y);
    float sn = dot(uSunDir, -q);
    vec2 shift = vec2(dot(uSunDir, tA), dot(uSunDir, tE))/max(sn, 0.06);
    if (vMisc.y < 1.5) {
      vec2 a = abs(vCofA.xy + shift) - vCofA.zw;            // wall of this step, 1 m high
      vec2 b = abs(vCofB.xy + shift*vMisc.x) - vCofB.zw;    // mouth of the coffer
      float m = max(max(a.x, a.y), max(b.x, b.y));
      sh = 1. - smoothstep(-0.35, 0.1, m);
      vec2 e = vCofA.zw - abs(vCofA.xy);
      ao = 0.62 + 0.38*smoothstep(0., 1.6, min(e.x, e.y));
      alb *= 1. - 0.22*(1. - smoothstep(0., 0.9, min(e.x, e.y)))*(0.5 + pits);
      alb *= 1. - 0.16*smoothstep(-0.3, 1., vCofA.y/max(vCofA.w, 0.1));        // soot gathers under the upper lip
    } else {
      ao = 0.62 + 0.38*(1. - fract(vMisc.x));               // risers darken toward the tread they stand on
      float fr = fract(vMisc.x);
      alb *= 1. + 0.38*(1. - smoothstep(0., 0.16, fr))*(0.3 + 1.1*trowel);   // worn, chipped arris
      alb *= 1. - 0.25*smoothstep(0.65, 1., fr);
      vec2 b = abs(vCofB.xy + shift*vMisc.x) - vCofB.zw;
      sh = 1. - smoothstep(-0.35, 0.1, max(b.x, b.y));
    }
    ao *= 1. - 0.15*floor(vMisc.x + 0.01);
    // far away the steps would alias: lean the normal toward the smooth sphere
    n = normalize(mix(n, -q, smoothstep(220., 380., dist)*0.4));
  }
  #endif
}
`;

const GENERIC_GLSL = /* glsl */`
void surface(vec3 p, inout vec3 n, float dist, out vec3 alb, out float ao, out float sh, out float gloss, out vec3 tint){
  ao = 1.; sh = 1.; gloss = uGloss; tint = vec3(1.);
  float fine = 1. - smoothstep(40., 180., dist);
  #if defined(K_MARBLE)
  float f = fbm(p*0.11); float v = 1. - smoothstep(0., 0.2, abs(sin(p.y*0.27 + p.x*0.11 + p.z*0.13 + f*7.)));
  float v2 = 1. - smoothstep(0., 0.12, abs(sin(p.y*0.61 - p.x*0.37 + f*9. + 2.)));
  alb = uColor*vCol*(0.82 + 0.3*f);
  alb = mix(alb, alb*vec3(0.5, 0.36, 0.44) + vec3(0.03, 0.01, 0.03), clamp(v*0.7 + v2*0.4*fine, 0., 1.)*0.55);
  alb *= 1. + fine*(vnoise(p*1.9) - 0.5)*0.12;
  #elif defined(K_BRONZE)
  vec3 q = p - vec3(0., 130., 0.);
  float az = atan(q.x, q.z + 1e-5), rr = length(p.xz);
  vec2 pc = vec2(az*max(rr, 1.)/2.2, p.y/2.2); vec2 pf = fract(pc) - 0.5;
  float stud = 1. - smoothstep(0.12, 0.17, length(pf));
  float seam = 1. - smoothstep(0.015, 0.05, min(abs(pf.x), abs(pf.y)) + 0.0);
  float f = fbm(p*0.35);
  float drip = vnoise(vec2(az*rr*0.6, p.y*0.07));
  alb = uColor*vCol*(0.6 + 0.7*f);
  alb = mix(alb, vec3(0.19, 0.42, 0.34)*(0.5 + 0.7*f), smoothstep(0.52, 0.8, drip*0.7 + f*0.5)*0.55);
  #ifdef OC_RIM
  // the rim of the eye: cast plates of aged bronze, each a little darker or lighter than its neighbour, and verdigris
  // only where the rain runs down from the plants on its top
  float plate = hash12(floor(pc) + 5.);
  alb = uColor*vCol*(0.56 + 0.5*f)*(0.7 + 0.42*plate);
  alb = mix(alb, vec3(0.085, 0.2, 0.15)*(0.6 + 0.6*f), smoothstep(0.5, 0.8, drip*0.6 + f*0.5)*0.6*smoothstep(uEye.x + 2.5, uEye.x + 8.5, p.y));
  #endif
  #ifdef OC_LEAF
  // cast panels: a warm polish on what stands proud, verdigris and soot where the relief turns in
  float rub = vnoise(p*vec3(1.7, 0.5, 1.7));
  alb = uColor*vCol*(0.7 + 0.6*f)*(0.85 + 0.3*rub);
  alb = mix(alb, vec3(0.17, 0.36, 0.3)*(0.5 + 0.7*f), smoothstep(0.55, 0.85, drip*0.6 + f*0.5)*0.4*(1. - smoothstep(0.9, 1.3, max(vCol.r, vCol.g)*2.2)));
  gloss = uGloss*(0.9 + 0.7*rub); tint = vec3(1., 0.74, 0.44);
  #else
  float sfade = fine*(1. - smoothstep(30., 110., dist));
  alb *= 1. - 0.45*seam*(1. - stud)*sfade;
  alb = mix(alb, alb*1.9 + vec3(0.05, 0.035, 0.01), stud*sfade*0.8);
  gloss = uGloss*(0.6 + 0.6*stud*sfade + 0.4*f); tint = vec3(1., 0.72, 0.42);
  #endif
  #elif defined(K_GILT)
  float f = fbm(p*0.5), w = vnoise(p*1.3 + 4.), g2 = vnoise(p*7.);
  alb = uColor*vCol*(0.7 + 0.5*f);
  alb = mix(alb, vec3(0.2, 0.11, 0.05)*(0.7 + 0.6*f), smoothstep(0.56, 0.86, w)*0.4);    // gilding worn to bronze
  alb = mix(alb, vec3(0.16, 0.3, 0.24), smoothstep(0.7, 0.9, vnoise(p*0.6 + 11.))*0.3);  // a little verdigris
  alb *= 0.85 + 0.3*g2*fine;
  gloss = uGloss*(1. - 0.6*smoothstep(0.52, 0.8, w)); tint = vec3(1., 0.78, 0.36);
  #elif defined(K_EXTERIOR)
  float rr = length(p.xz);
  float f = fbm(p*0.05), s = vnoise(vec2(atan(p.x, p.z + 1e-5)*40., rr*0.05));
  alb = uColor*vCol*(0.65 + 0.5*f)*(1. - 0.25*smoothstep(0.5, 0.8, s));
  alb *= 1. - 0.3*(1. - smoothstep(0.03, 0.1, abs(fract(rr/3.4) - 0.5)))*fine;
  #elif defined(K_REVET)
  // marble revetment: white fields with grey-violet veins; coloured slabs (told by the chroma of the vertex colour) are
  // breccias: clouded, with dark veins and pale flecks, so they read as stone in shade and not as paint
  float f = fbm(p*0.11), f2 = fbm(p*0.37 + 7.3);
  float wv = f*7. + f2*2.2;
  float v = 1. - smoothstep(0., 0.1, abs(sin(p.y*0.27 + p.x*0.11 + p.z*0.13 + f*7.)));
  float v2 = 1. - smoothstep(0., 0.07, abs(sin(p.y*0.61 - p.x*0.37 + f*9. + 2.)));
  float v3 = 1. - smoothstep(0., 0.13, abs(sin(p.y*1.3 + p.x*0.7 - p.z*0.9 + wv*1.6)));
  float sp = vnoise(p*2.7 + 1.3), sp2 = vnoise(p*6.1 + 4.);
  vec3 base = uColor*vCol;
  float mx = max(base.r, max(base.g, base.b)), mn = min(base.r, min(base.g, base.b));
  float chroma = smoothstep(0.16, 0.34, (mx - mn)/max(mx, 1e-3));
  vec3 wht = base*(0.8 + 0.34*f);
  float sv = 1. - smoothstep(0., 0.36, abs(sin(p.y*0.27 + p.x*0.11 + p.z*0.13 + f*7.)));
  wht = mix(wht, wht*vec3(0.56, 0.5, 0.6), clamp(sv*0.7 + v2*0.25*fine, 0., 1.)*(0.25 + 0.5*f2));
  vec3 brc = base*(0.5 + 0.5*f + 0.4*f2);
  brc = mix(brc, mix(base, vec3(mx), 0.5)*1.25, smoothstep(0.56, 0.7, f2)*0.45);                 // paler clouds
  brc = mix(brc, base*vec3(0.34, 0.3, 0.36), clamp(v*0.8 + (v2*0.5 + v3*0.6)*fine, 0., 1.)*0.8);  // dark veins
  brc = mix(brc, mix(base, vec3(mx), 0.45)*1.35, smoothstep(0.62, 0.86, sp)*smoothstep(0.3, 0.7, sp2)*0.3*fine*smoothstep(8., 60., dist));   // pale clasts: none in a close look, where the veins carry it
  brc *= 1. + 0.5*(fbm(p*0.9 + 11.) - 0.5)*fine*(1. - smoothstep(30., 90., dist));
  alb = mix(wht, brc, chroma);
  float rr = length(p.xz), sa = atan(p.x, p.z + 1e-5)*max(rr, 1.);
  float crs = floor(p.y/5.8);
  vec2 sj = vec2(fract(sa/8.6 + 0.5*mod(crs, 2.)), fract(p.y/5.8));
  vec2 dj = (0.5 - abs(sj - 0.5))*vec2(8.6, 5.8);
  float jw = 0.05 + dist*0.0014;
  float jl = (1. - smoothstep(jw, jw*2.2, min(dj.x, dj.y)))*clamp(0.14/jw, 0., 1.);
  float wallF = abs(n.y) < 0.7 ? 1. : 0.;
  alb *= 1. - 0.3*jl*wallF;
  alb *= 1. + wallF*fine*(0.1*(1. - smoothstep(0.2, 1.2, (1. - sj.y)*5.8)) - 0.13*(1. - smoothstep(0.2, 1.0, sj.y*5.8)));
  alb *= (0.9 + 0.18*hash12(floor(vec2(sa/8.6 + 0.5*mod(crs, 2.), crs)) + 7.))*(1. + fine*(vnoise(p*1.9) - 0.5)*0.14);
  gloss = uGloss*(0.7 + 0.6*f);
  #elif defined(K_GRANITE)
  float f = fbm(p*0.06), sp = vnoise(p*5.5), s2 = vnoise(p*13. + 5.), s3 = vnoise(p*1.1 + 9.);
  float streak = vnoise(vec3(p.x*0.5, p.y*0.035, p.z*0.5));
  alb = uColor*vCol*(0.62 + 0.5*f)*(0.78 + 0.4*sp*mix(0.4, 1., fine));
  alb = mix(alb, alb*vec3(1.16, 0.96, 0.9), smoothstep(0.45, 0.8, s3)*0.5);
  alb += vec3(0.06, 0.055, 0.05)*step(0.82, s2)*fine;
  alb *= 1. - 0.3*smoothstep(0.5, 0.85, streak);
  gloss = uGloss*(0.6 + 0.8*sp);
  #ifdef OC_OUTER
  if (p.z > 166.2 && p.y < 84.) {
    // the porch: column shafts built of drums, the door wall of big blocks on a darker base course; light comes in by
    // the open front and sides, so what turns toward the door wall falls into shade
    float ax = abs(p.x), cz = mod(p.z - 167.5, 25.) - 12.5;
    float dcol = length(vec2(ax - (ax < 38.75 ? 21.5 : 56.), cz));
    float jf = 1. - smoothstep(60., 200., dist);
    if (dcol < 5.6 && p.z > 170.) {
      float jy = (p.y - 6.)/11.1, dj = (0.5 - abs(fract(jy) - 0.5))*11.1;
      alb *= (0.86 + 0.26*hash12(vec2(floor(jy), floor(p.x/30.) + 7.*floor(p.z/25.))))*(1. - 0.55*(1. - smoothstep(0.03, 0.14 + dist*0.002, dj))*jf);
      alb *= 1. + 0.12*(1. - smoothstep(0.1, 0.9, dj))*jf;
      ao *= 0.42 + 0.58*smoothstep(-0.95, 0.5, n.z);
    } else if (abs(n.y) < 0.5) {
      float crs = floor(p.y/7.);
      vec2 bq = vec2(fract((p.x + p.z)/14. + 0.5*mod(crs, 2.)), fract(p.y/7.)), bd = (0.5 - abs(bq - 0.5))*vec2(14., 7.);
      alb *= (0.88 + 0.22*hash12(vec2(floor((p.x + p.z)/14. + 0.5*mod(crs, 2.)), crs)))*(1. - 0.5*(1. - smoothstep(0.04, 0.16 + dist*0.002, min(bd.x, bd.y)))*jf);
      alb *= 1. - 0.3*(1. - smoothstep(6.6, 7.2, p.y));
      ao *= 0.6 + 0.4*smoothstep(0., 30., p.y);
    }
  }
  #endif
  #elif defined(K_PAVING)
  vec2 x = p.xz; float f = fbm(x*0.03);
  vec2 sl = x/6.; float st = hash12(floor(sl) + 3.), st2 = hash12(floor(sl)*1.7 + 9.);
  vec2 dj = (0.5 - abs(fract(sl) - 0.5))*6.;
  float jw = 0.05 + dist*0.0016;
  float jl = (1. - smoothstep(jw, jw*2.2, min(dj.x, dj.y)))*clamp(0.16/jw, 0., 1.);
  vec2 bd = abs(fract(x/18. + 0.5) - 0.5)*18.;
  float band = 1. - smoothstep(1.4, 1.5, min(bd.x, bd.y));
  vec3 trav = uColor*vCol*(0.74 + 0.34*st)*(0.8 + 0.4*f);
  trav = mix(trav, trav*vec3(1.08, 0.97, 0.86), step(0.6, st2));
  vec3 gran = uColor*vCol*vec3(0.42, 0.43, 0.47)*(0.7 + 0.5*vnoise(x*4.));
  alb = mix(trav, gran, band);
  alb *= 1. - 0.5*jl;
  alb *= 1. + fine*(vnoise(x*2.1) - 0.5)*0.2;
  alb *= 1. - 0.25*smoothstep(0.55, 0.85, vnoise(x*0.11 + 4.));
  gloss = uGloss*(0.5 + 0.8*st);
  #else
  alb = uColor*vCol*(0.85 + 0.3*fbm(p*0.13));
  alb *= 1. + fine*(vnoise(p*2.3) - 0.5)*0.14;
  #endif
}
`;

// the stand-in drum: marble revetment below, attic of coloured panels and blind windows above
const DRUM_GLSL = /* glsl */`
void surface(vec3 p, inout vec3 n, float dist, out vec3 alb, out float ao, out float sh, out float gloss, out vec3 tint){
  ao = 1.; sh = 1.; gloss = uGloss; tint = vec3(1.);
  float az = atan(p.x, -p.z + 1e-5);               // seam on the door axis
  float s = az*130., y = p.y;
  vec2 m = vec2(s, y);
  float bayW = 6.2831853*130./16.;
  float bi = floor(s/bayW + 8.);
  float bx = (fract(s/bayW + 8.) - 0.5)*bayW;
  float alt = mod(bi, 2.);
  float h1 = hash12(vec2(bi, 3. + uSeed)), fine = 1. - smoothstep(60., 260., dist);
  vec3 col = mWhite(m*0.5); float ln = 0.;
  if (y < 78.) {
    float pil = smoothstep(21.2, 21.5, abs(bx))*step(6., y)*step(y, 64.);
    col = mix(col, mGiallo(m*0.6)*(0.8 + 0.2*sin(bx*3.9)), pil);
    float dP = ocBox(vec2(bx, y - 35.), vec2(18., 25.));
    col = mix(col, mGiallo(m*0.45), 1. - smoothstep(-0.1, 0.1, dP));
    ln += ocLine(dP, 0.14) + ocLine(dP + 1.6, 0.1);
    float dM = alt < 0.5 ? length(vec2(bx, y - 35.)) - 9.5 : ocBox(vec2(bx, y - 35.), vec2(8., 14.));
    col = mix(col, mWhite(m*0.7), 1. - smoothstep(-0.1, 0.1, dM - 1.5));
    col = mix(col, h1 < 0.3 ? mGreen(m*0.6) : mPorphyry(m*0.6), 1. - smoothstep(-0.1, 0.1, dM));
    ln += ocLine(dM, 0.12) + ocLine(dM - 1.5, 0.1);
    col = mix(col, mGranite(m*0.5), 1. - smoothstep(5.9, 6.1, y));
    if (y > 64.) {
      col = mWhite(m*0.4)*(0.92 + 0.08*step(0.5, fract((y - 64.)/1.4)));
      col = mix(col, mPorphyry(m*0.5), step(68., y)*step(y, 73.));
      float teeth = step(75., y)*step(y, 76.6)*step(0.5, fract(s/1.7));
      col *= 1. - 0.45*teeth*fine;
      ln += ocLine(y - 68., 0.12) + ocLine(y - 73., 0.12) + ocLine(y - 64.1, 0.14);
      ao *= 0.8 + 0.2*smoothstep(64., 67., y);
    }
    ln += ocLine(y - 6., 0.12);
    ln += ocLine(abs(bx) - 21.4, 0.12)*step(6., y)*step(y, 64.);
    // slab joints
    vec2 sj = abs(fract(m/vec2(8.5, 6.)) - 0.5);
    ln += 0.35*(ocLine(sj.x*8.5, 0.05) + ocLine(sj.y*6., 0.05))*fine;
  } else {
    float yy = y - 78.;
    // slabs of the white field, each a little different, with drafted joints
    vec2 sq = vec2(s/8.6 + 0.5*mod(floor(yy/5.5), 2.), yy/5.5), sd = (0.5 - abs(fract(sq) - 0.5))*vec2(8.6, 5.5);
    col *= 0.8 + 0.28*hash12(floor(sq) + 3. + uSeed);
    ln += 0.7*(1. - smoothstep(0.06, 0.22 + dist*0.002, min(sd.x, sd.y)))*fine;
    // each slab is a little pillowed: its upper arris catches the light from the eye, its lower one is in shade
    float sfy = fract(sq.y)*5.5;
    col *= 1. + fine*(0.16*(1. - smoothstep(0.2, 1.3, 5.5 - sfy)) - 0.2*(1. - smoothstep(0.2, 1.1, sfy)));
    // where a ray toward the sun gets to for every metre of relief: (along the wall, up)
    vec2 tg = vec2(cos(az), sin(az));
    vec2 shf = vec2(dot(uSunDir.xz, tg), uSunDir.y)/max(dot(uSunDir.xz, vec2(-tg.y, tg.x)), 0.06);
    vec2 pw = vec2(bx, yy - 22.);
    // blind window with a pediment
    float dW = ocBox(vec2(bx, yy - 22.), vec2(6.6, 10.4));
    float dI = ocBox(vec2(bx, yy - 22.), vec2(5.0, 8.8));
    vec3 grille = vec3(0.13, 0.135, 0.16)*(0.6 + 0.8*step(0.25, abs(fract(bx/1.25) - 0.5))*step(0.25, abs(fract(yy/1.25) - 0.5)));
    col = mix(col, mWhite(m*0.9)*1.05, 1. - smoothstep(-0.1, 0.1, dW));
    col = mix(col, grille, 1. - smoothstep(-0.1, 0.1, dI));
    float ped = max(abs(bx)*0.62 + (yy - 39.), 33.2 - yy);
    col = mix(col, mWhite(m*0.9)*1.08, 1. - smoothstep(-0.1, 0.1, ped));
    ln += ocLine(dW, 0.12) + ocLine(dI, 0.16) + ocLine(ped, 0.12);
    ao *= 1. - 0.5*(1. - smoothstep(-0.1, 0.1, dI))*smoothstep(26., 31., yy);
    // the grille stands 1.6 m back in its frame; the frame and the pediment stand proud and throw their shadows down the wall
    sh *= 1. - (1. - smoothstep(-0.1, 0.1, dI))*smoothstep(-0.3, 0.2, ocBox(pw + shf*1.6, vec2(5.0, 8.8)));
    vec2 pp = vec2(bx, yy) + shf*1.3;
    sh *= 1. - (1. - smoothstep(-0.25, 0.25, max(abs(pp.x)*0.62 + (pp.y - 39.), 33.2 - pp.y)))*smoothstep(-0.1, 0.1, ped);
    sh *= 1. - 0.85*(1. - smoothstep(-0.2, 0.2, ocBox(pw + shf*0.6, vec2(6.6, 10.4))))*smoothstep(-0.1, 0.1, dW)*smoothstep(-0.1, 0.1, ped);
    // coloured panels either side
    float px = abs(bx);
    float pc = px < 16.8 ? 12.7 : 21.2;
    float dC = ocBox(vec2(px - pc, yy - 22.), vec2(3.3, 12.5));
    // up here in the shade the porphyry is a paler, redder slab than the bands below, or it goes out to a black opening;
    // it and the green are polished slabs and take a sheen of the eye's light
    vec3 pcol = px < 16.8 ? (alt < 0.5 ? mPorphyry(m*0.6)*vec3(1.9, 3.6, 1.3) + vec3(0.007) : mGreen(m*0.6)) : mGiallo(m*0.6);
    col = mix(col, pcol, 1. - smoothstep(-0.1, 0.1, dC));
    gloss = mix(gloss, 0.5, (1. - smoothstep(-0.1, 0.1, dC))*step(px, 16.8));
    ln += ocLine(dC, 0.12) + ocLine(dC - 0.9, 0.08);
    // the panels are let 0.5 m into the wall inside a raised fillet
    sh *= 1. - (1. - smoothstep(-0.1, 0.1, dC))*smoothstep(-0.2, 0.15, ocBox(vec2(px - pc + shf.x*sign(bx)*0.5, yy - 22. + shf.y*0.5), vec2(3.3, 12.5)));
    sh *= 1. - 0.8*(1. - smoothstep(-0.15, 0.15, ocBox(vec2(px - pc + shf.x*sign(bx)*0.3, yy - 22. + shf.y*0.3), vec2(4.2, 13.4))))*smoothstep(0.8, 1.0, dC);
    sh *= 1. - 0.9*smoothstep(43.6, 44.2, yy + shf.y*1.1)*(1. - smoothstep(43.9, 44.1, yy));
    // base band and upper cornice bands
    col = mix(col, mGranite(m*0.5)*1.15, 1. - smoothstep(4.9, 5.1, yy));
    col = mix(col, mWhite(m*0.4)*(0.9 + 0.1*step(0.5, fract(yy/1.5))), smoothstep(43.9, 44.1, yy));
    col = mix(col, mPorphyry(m*0.5), step(45.5, yy)*step(yy, 47.5));
    ln += ocLine(yy - 5., 0.12) + ocLine(yy - 44., 0.14);
    ao *= 0.75 + 0.25*(1. - smoothstep(46., 52., yy));
  }
  alb = col*vCol*(1. - 0.55*clamp(ln, 0., 1.));
  alb *= 1. + fine*(vnoise(m*2.1) - 0.5)*0.1;
}
`;

// the floor: 18 m squares holding a circle or a smaller square, drains, wet and snow
const FLOOR_GLSL = /* glsl */`
uniform float uFloorSun;           // how much of the sun the paving takes (the eye stops down on the disc)
uniform float uFloorLift;          // extra soft light on the paving while the hall is held dark, so its inlays keep their colour
// wet stone draws a bright thing out into a long streak toward the eye: how much of a source standing at src (xz), hw
// metres wide, the mirror ray R from the floor point x picks up
float wetStreak(vec2 x, vec3 R, vec2 src, float hw){
  vec2 to = src - x; float rl = max(length(R.xz), 1e-3); vec2 rh = R.xz/rl;
  float miss = abs(rh.x*to.y - rh.y*to.x);
  return (1. - smoothstep(hw, hw*2.4 + 2., miss))*step(0., dot(rh, to))*smoothstep(0.02, 0.12, R.y)*(1. - smoothstep(0.45, 0.9, R.y));
}
uniform vec4 uWet, uMop, uSnow;    // wet circle (x, z, radius, amount); mop stripe (x0, z0, x1, z1); snow (radius, amount, mop amount, -)
void surface(vec3 p, inout vec3 n, float dist, out vec3 alb, out float ao, out float sh, out float gloss, out vec3 tint){
  ao = 1.; sh = uFloorSun; tint = vec3(1.);
  vec2 x = p.xz; float fine = 1. - smoothstep(60., 240., dist);
  vec2 g = x/18.; vec2 c = floor(g + 0.5); vec2 f = (g - c)*18.;
  float par = mod(c.x + c.y, 2.), h = hash12(c + uSeed), h2 = hash12(c*1.7 + 5. + uSeed);
  float bx = max(abs(f.x), abs(f.y));
  vec3 col; float ln = 0.;
  float dIn;
  if (par < 0.5) {
    dIn = length(f) - 6.3;
    vec3 disc = h < 0.6 ? mPorphyry(x*0.7) : mGranite(x*0.6);
    col = mix(disc, mGiallo(x*0.5), smoothstep(-0.05, 0.05, dIn));
    float dR = abs(dIn - 0.45) - 0.45;                      // white ring round the disc
    col = mix(col, mWhite(x*0.8), 1. - smoothstep(-0.05, 0.05, dR));
    ln += ocLine(dIn, 0.05) + ocLine(dIn - 0.9, 0.05);
  } else {
    dIn = bx - 4.9;
    vec3 sq = h < 0.5 ? mGiallo(x*0.5) : mPorphyry(x*0.7);
    col = mix(sq, mGranite(x*0.6)*1.1, smoothstep(-0.05, 0.05, dIn));
    float dR = abs(dIn - 0.4) - 0.4;
    col = mix(col, mWhite(x*0.8), 1. - smoothstep(-0.05, 0.05, dR));
    ln += ocLine(dIn, 0.05) + ocLine(dIn - 0.8, 0.05);
    // a small disc in the middle of every other square
    float dd = length(f) - 2.1;
    col = mix(col, h2 < 0.5 ? mGreen(x*0.8) : mPorphyry(x*0.8), (1. - smoothstep(-0.05, 0.05, dd))*step(0.4, h2));
    ln += ocLine(dd, 0.05)*step(0.4, h2);
  }
  col = mix(col, mWhite(x*0.6 + 31.), smoothstep(7.55, 7.65, bx));
  ln += ocLine(bx - 7.6, 0.05) + ocLine(bx - 9., 0.06);
  // slabs: slight tone steps and joints inside the bands and fields
  vec2 sl = x/3.; float st = hash12(floor(sl) + 11.);
  col *= 0.94 + 0.12*st*fine;
  vec2 sj = abs(fract(sl) - 0.5)*3.;
  ln += 0.3*fine*(ocLine(1.5 - sj.x, 0.03) + ocLine(1.5 - sj.y, 0.03))*smoothstep(7.5, 7.7, bx);
  // drains: bronze rosette of holes at the centre of the inner circle cells
  float rc = length(c)*18.;
  if (par < 0.5 && rc < 62.) {
    float r = length(f); float a5 = atan(f.y, f.x + 1e-5);
    float petal = length(vec2(r - 0.62, (fract(a5/1.0472) - 0.5)*0.65)) - 0.13;
    float hole = min(r - 0.2, petal);
    col = mix(col, vec3(0.3, 0.2, 0.09), (1. - smoothstep(0.95, 1.0, r)));
    col = mix(col, vec3(0.006), 1. - smoothstep(-0.02, 0.03, hole));
    ln += ocLine(r - 1.0, 0.04);
  }
  alb = col*(1. - 0.6*clamp(ln, 0., 1.));
  alb *= 1. + fine*(vnoise(x*3.1) - 0.5)*0.08;
  // wet: the shower's circle and the mopped stripe
  float wn = vnoise(x*0.13)*6. + vnoise(x*0.9)*1.2;
  float wet = uWet.w*(1. - smoothstep(uWet.z - 3., uWet.z + 0.5, length(x - uWet.xy) + wn - 3.));
  vec2 pa = x - uMop.xy, ba = uMop.zw - uMop.xy; float hm = clamp(dot(pa, ba)/max(dot(ba, ba), 1e-3), 0., 1.);
  float dm = length(pa - ba*hm);
  wet = max(wet, uSnow.z*(1. - smoothstep(3.2, 4.4, dm + wn*0.25))*(0.75 + 0.25*sin(dm*5. + x.x)));
  gWet = clamp(wet, 0., 1.);
  alb *= mix(1., 0.52, gWet);
  // rain landing in the circle under the eye: rings that open and fade
  float rainK = uSnow.w*(1. - smoothstep(uEye.y - 4., uEye.y + 1., length(x)))*(1. - smoothstep(45., 110., dist));
  if (rainK > 0.01) {
    vec2 ra = x/2.3, rb = x/3.1 + 5.37; vec2 ia = floor(ra), ib = floor(rb);
    float ha = hash12(ia + 17.), hb = hash12(ib + 41.);
    float ta = fract(uCloud.w*(1.0 + 0.7*ha) + ha*7.), tb = fract(uCloud.w*(0.8 + 0.6*hb) + hb*5.);
    vec2 ca = (fract(ra) - 0.5 - (vec2(hash12(ia + 3.), hash12(ia + 9.)) - 0.5)*0.4)*2.3, cb = (fract(rb) - 0.5 - (vec2(hash12(ib + 5.), hash12(ib + 13.)) - 0.5)*0.4)*3.1;
    float da = length(ca), db = length(cb), wdt = 0.07 + dist*0.004;
    float ga = (1. - smoothstep(0., wdt + 0.12*ta, abs(da - ta*0.95)))*(1. - ta)*(1. - ta), gb = (1. - smoothstep(0., wdt + 0.14*tb, abs(db - tb*1.3)))*(1. - tb)*(1. - tb);
    alb += vec3(0.42, 0.46, 0.52)*((ga + gb)*rainK*0.5); gRing = (ga + gb)*rainK;
    n = normalize(n + vec3(ca.x, 0., ca.y)*(ga*0.3*rainK/max(da, 0.08)) + vec3(cb.x, 0., cb.y)*(gb*0.3*rainK/max(db, 0.08)));
  }
  float sn = uSnow.y*(1. - smoothstep(uSnow.x*0.82, uSnow.x + 0.5, length(x) + (vnoise(x*0.22) - 0.5)*7. + (vnoise(x*1.3) - 0.5)*2.));
  gSnow = clamp(sn, 0., 1.);
  alb = mix(alb, vec3(0.8, 0.84, 0.9)*(0.9 + 0.1*vnoise(x*2.)), gSnow);
  gloss = mix(mix(0.55, 1., gWet), 0.05, gSnow);
}
`;

const STONE_MAIN = /* glsl */`
void main(){
  vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-3);
  vec3 n = normalize(vN + vec3(0., 1e-6, 0.)); if (!gl_FrontFacing) n = -n;
  vec3 alb, tint; float ao, sh, gloss; vec3 gOpen = vec3(0.); float gOw = 0., gPorch = 0.;
  surface(vW, n, dist, alb, ao, sh, gloss, tint);
  #if defined(K_EXTERIOR)
  vec3 col = alb*(uSunColor*(max(dot(n, uSunDir), 0.)*uCloud.z*0.5) + uSky*(0.24 + 0.2*n.y) + uAmbient);
  #elif defined(OC_OPEN)
  // out in the square, in the open sun: seen from the hall through the door it is a glare
  vec3 col = alb*(uSunColor*((max(dot(n, uSunDir), 0.)*0.92 + 0.08)*(0.25 + 0.75*uCloud.z)*uOpen.x) + (uSky*(0.6 + 0.4*n.y) + uAmbient*2.)*uOpen.y)*uOuter;
  #else
  #if !defined(K_FLOOR) && !defined(K_CONCRETE)
  if (oculusSun(vW) > 0.003) sh *= ocMould(vW);
  #endif
  #ifdef OC_OUTER
  // beyond the door wall (z > 130): the sun only reaches in through the doorway, and the open sky lights the portico
  if (vW.z > 130.) {
    float sz = min(uSunDir.z, -0.02);
    vec3 dq = vW + uSunDir*((130. - vW.z)/sz);
    sh *= (1. - smoothstep(10.5, 12., abs(dq.x)))*(1. - smoothstep(42., 44., dq.y))*step(uSunDir.z, -0.02);
  }
  #endif
  vec3 col = oculusLightS(vW, n, alb, ao, sh);
  #ifdef K_BRONZE
  // the rim of the eye stands in the open sky: its inner face takes a sheen of it all the way round
  col += alb*uSky*(0.14*smoothstep(246., 258., vW.y)*(0.6 + 0.4*abs(n.y)));
  #endif
  #ifdef OC_OUTER
  {
    gOw = smoothstep(126., 172., vW.z);
    vec3 os = uSky*(0.62 + 0.3*n.y) + uSunColor*0.035;
    gOpen = (os*(1./(dot(os, vec3(0.3, 0.5, 0.2)) + 0.16)) + uAmbient)*uOuter;      // the eye adapts in the shade of the porch
    vec3 pd = ocPorchDir(); float pnl = max(dot(n, pd), 0.);
    float porch = ocPorch(vW)*(0.3 + 0.7*uCloud.z)*uOuter;
    gPorch = porch*step(0.001, pnl);
    vec3 psun = uSunColor*vec3(1., 1.12, 0.86)/(dot(uSunColor, vec3(0.3, 0.5, 0.2)) + 0.6);     // the eye adapts in the porch
    col = mix(col, alb*(uSunColor*(max(dot(n, uSunDir), 0.)*sh*oculusSun(vW)) + psun*(pnl*porch*1.5) + gOpen*ao*(1. - 0.3*(1. - porch)*smoothstep(160., 172., vW.z))), gOw);
  }
  #endif
  vec3 R = reflect(-V, n);
  float lit = oculusSun(vW)*sh*step(0., dot(n, uSunDir));
  vec4 b = ocBounce(vW);
  float fr = 1. - max(dot(V, n), 0.); float F = 0.1 + 0.9*fr*fr*fr*fr*fr;
  float sg = pow(max(dot(R, uSunDir), 0.), mix(10., 160., gloss))*lit;
  float bg = pow(max(dot(R, b.xyz), 0.), mix(3., 30., gloss));
  float sg2 = pow(max(dot(R, uSunDir), 0.), 9.)*lit;
  col += tint*gloss*(uSunColor*(sg*0.6 + sg2*0.22*gloss) + uBounceCol*(bg*b.w*1.5) + uFill*(0.5*smoothstep(-0.2, 0.8, R.y)*ao))*(0.35 + 0.65*F);
  #ifdef OC_OUTER
  col += tint*gloss*gOpen*(gOw*(0.2 + 0.8*F));
  col += tint*gloss*uSunColor*(pow(max(dot(R, ocPorchDir()), 0.), mix(8., 60., gloss))*gPorch*gOw*0.35);
  #endif
  #ifdef K_FLOOR
  float Ry = max(R.y, 0.03);
  vec2 hE = vW.xz + R.xz*((uEye.x - vW.y)/Ry);
  float blur = mix(15., 5., gWet);
  float eyeRef = 1. - smoothstep(uEye.y - blur, uEye.y + blur, length(hE));
  col += (uSky*(eyeRef*mix(0.75, 1.1, gWet)) + uFill*0.3)*F*(1. - gSnow);
  col += uSky*(eyeRef*gWet*0.07) + (uSky*0.35 + uFill*0.9)*(gRing*0.5);     // the wet circle mirrors the eye; each ring of a drop glints
  if (gWet > 0.01) {
    // and it doubles the bright doorway and the lamps of the exedrae either side of it as long streaks
    float fw = (0.2 + 0.8*fr*fr)*gWet*(1. - gSnow)*clamp(uWet.w*2., 0., 1.);      // (the shower's water only: the mopped stripe is a film)
    float cs = wetStreak(vW.xz, R, vec2(-104., 86.2), 1.2) + wetStreak(vW.xz, R, vec2(-86.2, 104.), 1.2) + wetStreak(vW.xz, R, vec2(104., 86.2), 1.2) + wetStreak(vW.xz, R, vec2(86.2, 104.), 1.2);
    col += ((uSky*0.45 + uFill*2.2)*(wetStreak(vW.xz, R, vec2(0., 130.), 8.)*uOuter) + uCandle*(cs*0.22) + vec3(1., 0.5, 0.2)*(cs*0.25))*fw;
  }
  col += alb*(uFill*1.7 + uAmbient*1.3 + uSky*0.03)*uFloorLift;
  #endif
  #endif
  #ifdef OC_RIM
  {
    // aged bronze under a coloured sky: copper where the low sun strikes it, brown-violet in the shade (the red of the
    // evening on brown metal would otherwise come out as paint)
    float l = dot(col, vec3(0.3, 0.5, 0.2));
    float warm = clamp((uSunColor.r - uSunColor.b)/max(uSunColor.r, 1e-3)*2., 0., 1.);
    float w = smoothstep(0.02, 0.3, oculusSun(vW)*max(dot(n, uSunDir), 0.)*sh)*warm;
    col = mix(col, l*mix(vec3(1.36, 0.83, 0.62), vec3(1.6, 0.82, 0.36), w), 0.8)*mix(2.1, 1.5, w);
  }
  #endif
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}
`;

function makeStone(shared, kind, o = {}) {
  const defines = {}; defines['K_' + kind.toUpperCase()] = 1; if (o.coffer) defines.COFFER = 1; if (o.outer) defines.OC_OUTER = 1; if (o.open) defines.OC_OPEN = 1;
  const surf = kind === 'concrete' ? CONCRETE_GLSL : kind === 'drum' ? MARBLE_GLSL + DRUM_GLSL
    : kind === 'floor' ? 'float gWet = 0.; float gSnow = 0.; float gRing = 0.;\n' + MARBLE_GLSL + FLOOR_GLSL : GENERIC_GLSL;
  return new THREE.ShaderMaterial({
    defines, fog: true, vertexColors: !!o.vertexColors, side: o.side ?? THREE.FrontSide,
    uniforms: { ...shared, ...fx.fogUniforms(), uColor: { value: new THREE.Color(o.color ?? '#ffffff') }, uGloss: { value: o.gloss ?? 0.1 }, ...(o.uniforms || {}) },
    vertexShader: STONE_VERT, fragmentShader: STONE_FRAG_HEAD + surf + STONE_MAIN,
  });
}

// ---------------------------------------------------------------------------------------------
// geometry
// ---------------------------------------------------------------------------------------------
const RING_EL = [3.0, 15.2, 27.0, 38.0, 47.8, 56.0];      // elevation bounds of the five coffer rings (degrees)
const STEP_W = 0.105, STEP_B = 0.12, STEP_T = 0.075, MOUTH_W = 0.8, MOUTH_M = 0.105;

// rectangle j of ring k in (half azimuth width, el bottom, el top), radians
function cofferRect(k, j) {
  const hb = Math.PI / NBAY, e0 = RING_EL[k] * DEG, e1 = RING_EL[k + 1] * DEG, de = e1 - e0;
  const b0 = e0 + de * MOUTH_M, t0 = e1 - de * MOUTH_M, h0 = t0 - b0;
  return { hw: hb * (MOUTH_W - STEP_W * j), eb: b0 + h0 * STEP_B * j, et: t0 - h0 * STEP_T * j };
}
function perimeter(rc, na, ne) {
  const out = [];
  for (let i = 0; i < na; i++) out.push([lerp(-rc.hw, rc.hw, i / na), rc.eb]);
  for (let i = 0; i < ne; i++) out.push([rc.hw, lerp(rc.eb, rc.et, i / ne)]);
  for (let i = 0; i < na; i++) out.push([lerp(rc.hw, -rc.hw, i / na), rc.et]);
  for (let i = 0; i < ne; i++) out.push([-rc.hw, lerp(rc.et, rc.eb, i / ne)]);
  return out;
}

// One bay of ring k (coffer + its share of the ribs), centred on azimuth 0, as flat-shaded triangle soup.
function buildBay(k) {
  const NA = 4, NE = 3, P = [], N = [], A = [], B = [], M = [], T = [];
  const e0 = RING_EL[k] * DEG, e1 = RING_EL[k + 1] * DEG, elMid = (e0 + e1) / 2, ce = Math.cos(elMid);
  const rects = [0, 1, 2, 3].map((j) => cofferRect(k, j));
  const X = (daz) => daz * R_DOME * ce, Y = (el) => (el - elMid) * R_DOME;
  const rcData = rects.map((r) => ({ cy: Y((r.eb + r.et) / 2), hx: r.hw * R_DOME * ce, hy: (r.et - r.eb) / 2 * R_DOME }));
  const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), ab = new THREE.Vector3(), ac = new THREE.Vector3(), nn = new THREE.Vector3();
  // vertex spec: [daz, el, r, depth]; j = enclosing rect, kind 0 rib, 1 tread/back, 2 riser; tone = vertex shade
  const put = (s, p, j, kind, tone) => {
    P.push(p.x, p.y, p.z); N.push(nn.x, nn.y, nn.z);
    const x = X(s[0]), y = Y(s[1]), d = rcData[j], d0 = rcData[0];
    A.push(x, y - d.cy, d.hx, d.hy); B.push(x, y - d0.cy, d0.hx, d0.hy); M.push(s[3], kind); T.push(tone);
  };
  const quad = (a, b, c, d, j, kind, tone) => {
    sph(a[0], a[1], a[2], v0); sph(b[0], b[1], b[2], v1); sph(c[0], c[1], c[2], v2); sph(d[0], d[1], d[2], v3);
    ab.subVectors(v1, v0); ac.subVectors(v2, v0); nn.crossVectors(ab, ac);
    if (nn.lengthSq() < 1e-10) { ab.subVectors(v2, v0); ac.subVectors(v3, v0); nn.crossVectors(ab, ac); }
    nn.normalize();
    put(a, v0, j, kind, tone); put(b, v1, j, kind, tone); put(c, v2, j, kind, tone);
    put(a, v0, j, kind, tone); put(c, v2, j, kind, tone); put(d, v3, j, kind, tone);
  };
  const loop = (pa, ra, da, pb, rb, db, j, kind, tone) => {
    const m = pa.length;
    for (let i = 0; i < m; i++) {
      const i2 = (i + 1) % m;
      quad([pa[i][0], pa[i][1], ra, da], [pa[i2][0], pa[i2][1], ra, da], [pb[i2][0], pb[i2][1], rb, db], [pb[i][0], pb[i][1], rb, db], j, kind, tone);
    }
  };
  const bay = { hw: Math.PI / NBAY, eb: e0, et: e1 };
  const per = rects.map((r) => perimeter(r, NA, NE));
  loop(perimeter(bay, NA, NE), R_DOME, 0, per[0], R_DOME, 0, 0, 0, 1.06);            // ribs round the mouth
  for (let j = 0; j < 4; j++) {
    loop(per[j], R_DOME + j, j, per[j], R_DOME + j + 1, j + 0.999, j, 2, 0.97);       // riser
    if (j < 3) loop(per[j], R_DOME + j + 1, j + 1, per[j + 1], R_DOME + j + 1, j + 1, j, 1, 1.0);   // tread
  }
  const r3 = rects[3];
  for (let a = 0; a < NA; a++) for (let e = 0; e < NE; e++) {
    const a0 = lerp(-r3.hw, r3.hw, a / NA), a1 = lerp(-r3.hw, r3.hw, (a + 1) / NA), b0 = lerp(r3.eb, r3.et, e / NE), b1 = lerp(r3.eb, r3.et, (e + 1) / NE);
    quad([a0, b0, R_DOME + 4, 4], [a1, b0, R_DOME + 4, 4], [a1, b1, R_DOME + 4, 4], [a0, b1, R_DOME + 4, 4], 3, 1, 0.94);
  }
  return { P, N, A, B, M, T, panel: { el: (r3.eb + r3.et) / 2, hx: rcData[3].hx, hy: rcData[3].hy } };
}

// lathe: profile [[r, y, tone?], ...] swept round Y; indexed, smooth normals, wrapped seam
function latheGeo(profile, segs, color, toneFn) {
  const n = profile.length, pos = new Float32Array(n * segs * 3), col = new Float32Array(n * segs * 3), idx = [];
  for (let s = 0; s < segs; s++) {
    const a = (s / segs) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    for (let i = 0; i < n; i++) {
      const o = (s * n + i) * 3, t = (profile[i][2] ?? 1) * (toneFn ? toneFn(s, i) : 1);
      pos[o] = profile[i][0] * sa; pos[o + 1] = profile[i][1]; pos[o + 2] = profile[i][0] * ca;
      col[o] = color.r * t; col[o + 1] = color.g * t; col[o + 2] = color.b * t;
    }
  }
  for (let s = 0; s < segs; s++) {
    const s2 = (s + 1) % segs;
    for (let i = 0; i < n - 1; i++) { const a = s * n + i, b = s2 * n + i; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// the whole inner dome as one geometry: 140 coffers with ribs, lower band, smooth band, springing cornice
async function buildDome(ctx, rng, tint) {
  const bays = [];
  for (let k = 0; k < 5; k++) { bays.push(buildBay(k)); await ctx.yield(); }
  let nv = 0; for (const b of bays) nv += (b.P.length / 3) * NBAY;
  const SEG = 112, bandRows = [[0, RING_EL[0], 1], [RING_EL[5], 78.0, 7]];
  let bandV = 0; for (const b of bandRows) bandV += SEG * b[2] * 6;
  const cor = [[130.4, 121.5, 0.8], [128.7, 122.6, 1.02], [128.7, 124.6, 1.1], [127.3, 125.5, 0.85], [127.3, 127.8, 1.12], [125.8, 128.7, 0.9], [125.8, 130.5, 1.16], [127.6, 131.0, 0.95], [129.3, 131.3, 1.0], [130.2, 132.6, 1.0]];
  const corV = SEG * (cor.length - 1) * 6;
  const tot = nv + bandV + corV;
  const pos = new Float32Array(tot * 3), nor = new Float32Array(tot * 3), col = new Float32Array(tot * 3), cA = new Float32Array(tot * 4), cB = new Float32Array(tot * 4), mi = new Float32Array(tot * 2);
  let o = 0;
  const c = new THREE.Color();
  for (let k = 0; k < 5; k++) {
    const b = bays[k], n = b.P.length / 3;
    for (let i = 0; i < NBAY; i++) {
      if ((i & 3) === 0) await ctx.yield();                    // four bays a slice
      const d = ((i + 0.5) / NBAY) * Math.PI * 2, cd = Math.cos(d), sd = Math.sin(d);
      const tone = 0.9 + 0.2 * rng(), warm = rng.range(-0.05, 0.05), patch = rng.chance(0.12) ? rng.range(0.82, 1.14) : 1;
      for (let v = 0; v < n; v++, o++) {
        const x = b.P[v * 3], y = b.P[v * 3 + 1], z = b.P[v * 3 + 2], nx = b.N[v * 3], ny = b.N[v * 3 + 1], nz = b.N[v * 3 + 2];
        pos[o * 3] = x * cd - z * sd; pos[o * 3 + 1] = y; pos[o * 3 + 2] = z * cd + x * sd;
        nor[o * 3] = nx * cd - nz * sd; nor[o * 3 + 1] = ny; nor[o * 3 + 2] = nz * cd + nx * sd;
        const t = b.T[v] * tone * (b.M[v * 2 + 1] > 0.5 ? patch : 1);
        col[o * 3] = tint.r * t * (1 + warm); col[o * 3 + 1] = tint.g * t; col[o * 3 + 2] = tint.b * t * (1 - warm);
        cA.set([b.A[v * 4], b.A[v * 4 + 1], b.A[v * 4 + 2], b.A[v * 4 + 3]], o * 4);
        cB.set([b.B[v * 4], b.B[v * 4 + 1], b.B[v * 4 + 2], b.B[v * 4 + 3]], o * 4);
        mi[o * 2] = b.M[v * 2]; mi[o * 2 + 1] = b.M[v * 2 + 1];
      }
    }
  }
  await ctx.yield();
  const p = new THREE.Vector3(), q = new THREE.Vector3();
  const vert = (az, el, tone) => {
    sph(az, el, R_DOME, p); q.copy(C_DOME).sub(p).normalize();
    pos[o * 3] = p.x; pos[o * 3 + 1] = p.y; pos[o * 3 + 2] = p.z; nor[o * 3] = q.x; nor[o * 3 + 1] = q.y; nor[o * 3 + 2] = q.z;
    col[o * 3] = tint.r * tone; col[o * 3 + 1] = tint.g * tone; col[o * 3 + 2] = tint.b * tone; o++;
  };
  for (const [ea, eb, rows] of bandRows) for (let r = 0; r < rows; r++) for (let s = 0; s < SEG; s++) {
    const a0 = (s / SEG) * Math.PI * 2, a1 = ((s + 1) / SEG) * Math.PI * 2, b0 = lerp(ea, eb, r / rows) * DEG, b1 = lerp(ea, eb, (r + 1) / rows) * DEG;
    const t = rows > 1 ? 1.08 : 1.02;
    vert(a0, b0, t); vert(a1, b0, t); vert(a1, b1, t); vert(a0, b0, t); vert(a1, b1, t); vert(a0, b1, t);
  }
  // cornice at the springing, lighter marble
  const cv = (s, i) => {
    const a = (s / SEG) * Math.PI * 2, pr = cor[i], i2 = Math.min(i + 1, cor.length - 1), i0 = Math.max(i - 1, 0);
    const dr = cor[i2][0] - cor[i0][0], dy = cor[i2][1] - cor[i0][1], l = Math.hypot(dr, dy) || 1;
    const nr = -dy / l, ny = dr / l, sg = 1;                 // geometric normal of this winding (the shader flips back faces)
    pos[o * 3] = -Math.sin(a) * pr[0]; pos[o * 3 + 1] = pr[1]; pos[o * 3 + 2] = Math.cos(a) * pr[0];
    nor[o * 3] = -Math.sin(a) * nr * sg; nor[o * 3 + 1] = ny * sg; nor[o * 3 + 2] = Math.cos(a) * nr * sg;
    const t = pr[2] * 1.25; col[o * 3] = tint.r * t * 1.04; col[o * 3 + 1] = tint.g * t; col[o * 3 + 2] = tint.b * t * 0.94; o++;
  };
  for (let s = 0; s < SEG; s++) for (let i = 0; i < cor.length - 1; i++) { cv(s, i); cv(s + 1, i); cv(s + 1, i + 1); cv(s, i); cv(s + 1, i + 1); cv(s, i + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aCofA', new THREE.BufferAttribute(cA, 4));
  g.setAttribute('aCofB', new THREE.BufferAttribute(cB, 4)); g.setAttribute('aMisc', new THREE.BufferAttribute(mi, 2));
  return { geometry: g, panels: bays.map((b) => b.panel) };
}

// 140 gilt rosettes, one in the back of every coffer
async function buildRosettes(ctx, rng, panels, gold) {
  // rings of 16: even spokes are the tips of the eight outer petals, odd spokes the tips of the eight inner ones
  // [radius even, radius odd, height even, height odd, tone even, tone odd]
  const SEGS = 16, rings = [
    [0.09, 0.09, 0.97, 0.97, 1.35, 1.35], [0.17, 0.17, 0.72, 0.72, 1.05, 1.05], [0.2, 0.2, 0.42, 0.42, 0.45, 0.45],
    [0.3, 0.34, 0.42, 0.68, 0.32, 1.25], [0.36, 0.6, 0.36, 0.5, 0.3, 1.3], [0.4, 0.63, 0.33, 0.28, 0.32, 0.4],
    [0.72, 0.66, 0.58, 0.2, 1.25, 0.28], [1.0, 0.7, 0.34, 0.1, 1.35, 0.26],
    [1.12, 1.12, 0.02, 0.02, 0.5, 0.5], [1.18, 1.18, 0.2, 0.2, 1.1, 1.1], [1.3, 1.3, 0.2, 0.2, 1.2, 1.2], [1.36, 1.36, 0, 0, 0.55, 0.55]];
  const nV = 1 + rings.length * SEGS, lp = new Float32Array(nV * 3), lt = new Float32Array(nV), idx = [];
  lp.set([0, 0, 1.0]); lt[0] = 1.4;
  for (let r = 0; r < rings.length; r++) for (let s = 0; s < SEGS; s++) {
    const th = (s / SEGS) * Math.PI * 2, odd = s & 1, i = 1 + r * SEGS + s, rad = rings[r][odd], hh = rings[r][2 + odd];
    lp[i * 3] = Math.cos(th) * rad; lp[i * 3 + 1] = Math.sin(th) * rad; lp[i * 3 + 2] = hh; lt[i] = rings[r][4 + odd];
  }
  for (let s = 0; s < SEGS; s++) { const s2 = (s + 1) % SEGS; idx.push(0, 1 + s, 1 + s2); }
  for (let r = 0; r < rings.length - 1; r++) for (let s = 0; s < SEGS; s++) {
    const s2 = (s + 1) % SEGS, a = 1 + r * SEGS + s, b = 1 + r * SEGS + s2, c = a + SEGS, d = b + SEGS; idx.push(a, c, b, b, c, d);
  }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setIndex(idx); lg.computeVertexNormals();
  const ln = lg.attributes.normal.array; lg.dispose();
  const count = 5 * NBAY, pos = new Float32Array(count * nV * 3), nor = new Float32Array(count * nV * 3), col = new Float32Array(count * nV * 3), index = [];
  const pc = new THREE.Vector3(), nI = new THREE.Vector3(), tA = new THREE.Vector3(), tE = new THREE.Vector3();
  let o = 0, base = 0;
  for (let k = 0; k < 5; k++) for (let i = 0; i < NBAY; i++) {
    if ((i & 7) === 0) await ctx.yield();                      // eight rosettes a slice
    const az = ((i + 0.5) / NBAY) * Math.PI * 2, el = panels[k].el;
    sph(az, el, R_DOME + 3.95, pc); nI.copy(C_DOME).sub(pc).normalize();
    tA.set(-Math.cos(az), 0, -Math.sin(az)); tE.crossVectors(tA, nI).normalize(); if (tE.y < 0) tE.negate();
    const rad = Math.min(panels[k].hx, panels[k].hy) * 0.6, hgt = rad * 0.62, tone = rng.range(0.8, 1.15), spin = rng.range(0, Math.PI);
    const cs = Math.cos(spin), sn = Math.sin(spin);
    for (let v = 0; v < nV; v++, o++) {
      const lx = lp[v * 3] * cs - lp[v * 3 + 1] * sn, ly = lp[v * 3] * sn + lp[v * 3 + 1] * cs, lz = lp[v * 3 + 2];
      pos[o * 3] = pc.x + (tA.x * lx + tE.x * ly) * rad + nI.x * lz * hgt;
      pos[o * 3 + 1] = pc.y + (tA.y * lx + tE.y * ly) * rad + nI.y * lz * hgt;
      pos[o * 3 + 2] = pc.z + (tA.z * lx + tE.z * ly) * rad + nI.z * lz * hgt;
      const nx = ln[v * 3] * cs - ln[v * 3 + 1] * sn, ny = ln[v * 3] * sn + ln[v * 3 + 1] * cs, nz = ln[v * 3 + 2] * 1.6;
      const wx = tA.x * nx + tE.x * ny + nI.x * nz, wy = tA.y * nx + tE.y * ny + nI.y * nz, wz = tA.z * nx + tE.z * ny + nI.z * nz, wl = Math.hypot(wx, wy, wz) || 1;
      nor[o * 3] = wx / wl; nor[o * 3 + 1] = wy / wl; nor[o * 3 + 2] = wz / wl;
      const t = lt[v] * tone; col[o * 3] = gold.r * t; col[o * 3 + 1] = gold.g * t; col[o * 3 + 2] = gold.b * t;
    }
    for (let j = 0; j < idx.length; j++) index.push(idx[j] + base);
    base += nV;
  }
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(index);
  return g;
}

// ---------------------------------------------------------------------------------------------
// the beam, its motes, and the column of rain / snow / petals under the eye
// ---------------------------------------------------------------------------------------------
const BEAM_HIT_GLSL = /* glsl */`
// distance along -S from a point Q of the eye plane to the first room surface (floor, drum, dome)
float ocBeamHit(vec3 Q, vec3 S){
  const float K = 129.4;
  float tf = Q.y/max(S.y, 0.02);
  float a = dot(S.xz, S.xz), b = -dot(Q.xz, S.xz), c = dot(Q.xz, Q.xz) - K*K;
  float tc = a > 1e-6 ? (-b + sqrt(max(b*b - a*c, 0.)))/a : 1e6;
  float yc = Q.y - S.y*tc;
  vec3 q = Q - vec3(0., 130., 0.); float bs = -dot(q, S), cs = dot(q, q) - K*K;
  float ts = -bs + sqrt(max(bs*bs - cs, 0.));
  return min(tf, yc > 130. ? ts : tc);
}
`;

// veil: the same volume pointed straight down, for the column of rain (its own uSunDir, no sun in it)
function makeBeam(shared, veil = false) {
  const SEG = 48, NS = 8, pos = [], idx = [];
  for (let r = 0; r <= NS; r++) for (let s = 0; s < SEG; s++) { const a = (s / SEG) * Math.PI * 2; pos.push(Math.cos(a), r / NS, Math.sin(a)); }
  for (let r = 0; r < NS; r++) for (let s = 0; s < SEG; s++) { const s2 = (s + 1) % SEG, a = r * SEG + s, b = r * SEG + s2; idx.push(a, b, a + SEG, b, b + SEG, a + SEG); }
  const mid = pos.length / 3;
  for (let s = 0; s < SEG; s++) { const a = (s / SEG) * Math.PI * 2; pos.push(Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5); }
  const cEnd = pos.length / 3; pos.push(0, 1, 0); const cTop = cEnd + 1; pos.push(0, 0, 0);
  for (let s = 0; s < SEG; s++) {
    const s2 = (s + 1) % SEG, a = NS * SEG + s, b = NS * SEG + s2;
    idx.push(a, b, mid + s, b, mid + s2, mid + s, mid + s, mid + s2, cEnd, s2, s, cTop);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 130, 0), 200);
  const uniforms = { ...shared, ...fx.fogUniforms(), uBeamCol: { value: new THREE.Color(1, 1, 1) }, uBeam: { value: new THREE.Vector4(0.017, 1, 0.12, 120) }, uBeam2: { value: new THREE.Vector4(1.1, 1.35, 0.66, 250) } };
  if (veil) uniforms.uSunDir = { value: new THREE.Vector3(0, 1, 0) };
  const mat = new THREE.ShaderMaterial({
    uniforms, defines: veil ? { OC_VEIL: 1 } : {}, fog: true, side: THREE.BackSide, transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
    vertexShader: fx.GLSL_FOG_PARS_VERT + 'uniform vec3 uSunDir; uniform vec4 uEye;\n' + BEAM_HIT_GLSL + /* glsl */`
      varying vec3 vW;
      void main(){
        float rb = uEye.y*1.016 + 0.3;
        vec3 Q = vec3(position.x*rb, uEye.x, position.z*rb);
        vW = Q - uSunDir*(ocBeamHit(Q, uSunDir)*position.y);
        #ifdef OC_VEIL
        vW.y += 0.06*position.y;     // the veil's foot stands a hair over the paving: laid in the floor's own plane, the two fought for each pixel
        #endif
        vec4 mvPosition = viewMatrix*vec4(vW, 1.); gl_Position = projectionMatrix*mvPosition;
      ` + fx.GLSL_FOG_VERT + '}',
    fragmentShader: fx.GLSL_NOISE + fx.GLSL_FOG_PARS_FRAG + OC_GLSL + /* glsl */`
      uniform vec3 uBeamCol; uniform vec4 uBeam2;   // knee, gain after the knee, how much is left at the foot, length of the shaft
      uniform vec4 uBeam;   // density, gain, how much a long look down the beam is held back, metres over which it thins toward the camera
      varying vec3 vW;
      vec2 ocSeg(vec2 h0, vec2 hd, float r){
        float a = dot(hd, hd), b = dot(h0, hd), c = dot(h0, h0) - r*r;
        if (a < 1e-7) return c < 0. ? vec2(-1e6, 1e6) : vec2(1., -1.);
        float disc = b*b - a*c; if (disc <= 0.) return vec2(1., -1.);
        float sq = sqrt(disc); return vec2((-b - sq)/a, (-b + sq)/a);
      }
      void main(){
        // only the far side of the volume is shaded (it hugs the room, so the scene's depth cuts it correctly)
        vec3 O = cameraPosition; vec3 d = vW - O; float dl = length(d); d /= max(dl, 1e-3);
        float sy = max(uSunDir.y, 0.02); vec2 k = uSunDir.xz/sy;
        vec2 h0 = O.xz + k*(uEye.x - O.y), hd = d.xz - k*d.y;
        vec2 i1 = ocSeg(h0, hd, uEye.y), i2 = ocSeg(h0 + k*uEye.z, hd, uEye.y);
        float t0 = max(max(i1.x, i2.x), 0.), t1 = min(min(i1.y, i2.y), dl);
        float L = max(t1 - t0, 0.), tm = t0 + L*0.5;
        vec3 pm = O + d*tm;
        vec2 hm = h0 + hd*tm;            // where the middle of the lit stretch stands in the eye
        // cloud dimmings and thin rays run down the beam: both live in the plane of the eye, so they lie along the axis
        float cl = (ocCloudTex(h0 + hd*(t0 + L*0.2)) + ocCloudTex(hm) + ocCloudTex(h0 + hd*(t0 + L*0.8)))/3.;
        float ray = vnoise(hm*0.2 + uCloud.xy*0.004)*0.6 + vnoise(hm*0.57 + 3. - uCloud.xy*0.007)*0.4;
        float hz = fbm(pm*0.017 + vec3(uCloud.w*0.05, -uCloud.w*0.1, uCloud.w*0.04));
        float hz2 = vnoise(pm*0.09 + vec3(uCloud.w*0.22, -uCloud.w*0.34, uCloud.w*0.1));
        float r2 = min(dot(hm, hm)/(uEye.y*uEye.y), 1.);
        float core = 1.3 - 0.6*r2;
        #ifdef OC_VEIL
        // rain: curtains of streaks falling through the column, thick and thin with the gusts; silver, no sun in it
        float fl = uCloud.w*1.6;
        float s1 = vnoise(vec3(hm*0.4, pm.y*0.03 + fl)), s2 = vnoise(vec3(hm*1.2 + 7., pm.y*0.08 + fl*2.3));
        float gust = fbm(vec3(hm*0.05, pm.y*0.012 + uCloud.w*0.25));
        float Iv = 1. - exp(-L*(0.3 + 0.9*s1 + 0.5*s2)*(0.45 + 1.1*gust)*core*uBeam.x);
        Iv *= 1. - uBeam.z*Iv;
        vec3 cv = uBeamCol*(Iv*uBeam.y*(0.05 + 0.95*smoothstep(uBeam.w*0.2, uBeam.w*0.8, tm)));
        gl_FragColor = vec4(cv*(1. - 0.5*fxFog()), 1.);
        #else
        // the shaft has a soft shoulder (the lit dust thins toward its edge) and is combed into rays along its axis
        float soft = pow(max(1. - r2, 0.), 0.6);
        float dens = (0.28 + 1.1*hz + 0.4*hz2)*(0.32 + 2.5*ray*ray)*1.3*soft;
        float mu = dot(d, uSunDir);
        float m1 = max(mu, 0.), m2 = max(-mu, 0.);
        float phase = 0.62 + 0.8*m1*m1*m1 + 0.12*m2*m2;
        float I = 1. - exp(-L*dens*uBeam.x);
        I *= 1. - uBeam.z*I;
        phase = mix(phase, 0.75, uBeam.z);
        // lit air close to the camera is no more than a thin gold veil: the eye is stopped down on the disc, and it is
        // the motes that blaze. Far off, the same air stands as a column.
        float nk = 0.03 + 0.97*smoothstep(uBeam.w*0.28, uBeam.w*0.84, tm);
        vec3 bc = mix(uBeamCol, uBeamCol*uBeamCol/max(max(uBeamCol.r, uBeamCol.g), max(uBeamCol.b, 0.01)), 0.75);   // the look's own tint, deepened
        vec3 col = mix(bc*vec3(1.08, 0.84, 0.56), bc, nk)*(0.78*I*phase*cl*uCloud.z*uBeam.y*nk);
        // a long look up or down the beam would saturate into a flat wedge: there the core stands brighter than the
        // edge, the thin rays and the drifting haze show through, and the edge is a little soft
        float lw = max(smoothstep(45., 160., L), smoothstep(0.5, 0.86, abs(mu)));
        vec2 ha = h0 + hd*(t0 + L*0.25), hb = h0 + hd*(t0 + L*0.75);
        float ray3 = (ray + vnoise(ha*0.2 + uCloud.xy*0.004)*0.6 + vnoise(ha*0.57 + 3. - uCloud.xy*0.007)*0.4 + vnoise(hb*0.2 + uCloud.xy*0.004)*0.6 + vnoise(hb*0.57 + 3. - uCloud.xy*0.007)*0.4)/3.;
        float drift = vnoise(vec3(hm*0.075, tm*0.012 - uCloud.w*0.35))*0.6 + vnoise(vec3(hm*0.21 + 5., tm*0.03 - uCloud.w*0.7))*0.4;
        // light, never a solid: however strong the shaft, it goes through a soft knee (the wall behind always shows through
        // it), is brightest along its axis and dies away to nothing at its edge, is combed into rays, brightens where the
        // dust drifts through it, and thins from the eye down to its foot
        float pr = max(1. - r2, 0.), shp = pr*pr*(3. - 2.*pr);
        col *= mix(1., 1.9*pow(pr, 0.75), lw);
        float lum = max(col.r, max(col.g, col.b));
        float kn = uBeam2.y/(1. + lum*uBeam2.x*mix(1., 0.3, lw));
        col *= kn; lum *= kn;
        col = mix(col, col*col/max(lum, 1e-3), 0.4);       // lit dust keeps the colour of the hour
        float along = (uEye.x - pm.y)/sy;
        float tail = mix(1., uBeam2.z, smoothstep(0.2, 1.05, along/max(uBeam2.w, 1.)));
        float shim = 0.72 + 0.56*vnoise(vec3(hm*0.3 + 9., uCloud.w*1.2 + tm*0.02));      // dust turning over in the light
        col *= (0.04 + 0.96*mix(pr, shp, 0.6))*(0.45 + 1.1*ray3)*(0.5 + 1.0*drift)*shim*tail;
        col *= 1. - 0.5*fxFog();
        gl_FragColor = vec4(col, 1.);
        #endif
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2;
  return { mesh, uniforms };
}

async function quadCloud(ctx, count, rng) {
  const pos = new Float32Array(count * 12), seed = new Float32Array(count * 16), idx = new Uint32Array(count * 6), cx = [-1, 1, 1, -1], cy = [-1, -1, 1, 1];
  for (let i = 0; i < count; i++) {
    if ((i & 1023) === 0) await ctx.yield();                   // a thousand quads a slice
    const a = rng(), b = rng(), c = rng(), d = rng();
    for (let v = 0; v < 4; v++) { pos.set([cx[v], cy[v], 0], i * 12 + v * 3); seed.set([a, b, c, d], i * 16 + v * 4); }
    idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 130, 0), 300);
  return g;
}

// dust that only shows where the sun is: a box of motes that wraps round the camera
async function makeMotes(ctx, shared, rng, count) {
  const uniforms = { ...shared, uBox: { value: new THREE.Vector3(76, 52, 76) }, uMoteCol: { value: new THREE.Color(1, 1, 1) } };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: OC_GLSL + /* glsl */`
      attribute vec4 aSeed; uniform vec3 uBox; varying vec2 vUv; varying float vI;
      void main(){
        float t = uCloud.w;
        vec3 drift = vec3(sin(t*0.21 + aSeed.w*40.), 0.35*t*(aSeed.w - 0.35) + cos(t*0.17 + aSeed.w*70.), sin(t*0.19 + aSeed.w*90.))*1.3;
        vec3 P = mod(aSeed.xyz*uBox + drift - cameraPosition + uBox*0.5, uBox) - uBox*0.5 + cameraPosition;
        float lit = oculusSun(P)*step(0.3, P.y);
        vec4 mv = viewMatrix*vec4(P, 1.); float dist = max(-mv.z, 0.01);
        float s0 = 0.035 + 0.1*aSeed.w*aSeed.w, size = max(s0, dist*0.0019);
        mv.xy += position.xy*size; gl_Position = projectionMatrix*mv;
        vec3 e = (uBox*0.5 - abs(P - cameraPosition))/uBox;
        float edge = smoothstep(0., 0.12, min(e.x, min(e.y, e.z)));
        float tw = 0.55 + 0.45*sin(t*(1.5 + aSeed.w*4.) + aSeed.w*200.);
        float q = s0/size;
        vI = lit*edge*tw*smoothstep(3., 14., dist)*min(1., q*q*9.);
        vUv = position.xy;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uMoteCol; varying vec2 vUv; varying float vI;
      void main(){ float a = 1. - smoothstep(0.15, 1., length(vUv)); gl_FragColor = vec4(uMoteCol*(a*a*vI), 1.); }`,
  });
  const mesh = new THREE.Mesh(await quadCloud(ctx, count, rng), mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return { mesh, uniforms };
}

// rain, snow or petals falling in the 54 m column under the eye
async function makeFall(ctx, shared, rng, count) {
  const uniforms = { ...shared, ...fx.fogUniforms(), uFall: { value: new THREE.Vector4(0, 0, 0, 60) }, uFallCol: { value: new THREE.Color(1, 1, 1) } };
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    vertexShader: fx.GLSL_FOG_PARS_VERT + OC_GLSL + /* glsl */`
      attribute vec4 aSeed; uniform vec4 uFall; uniform vec3 uFallCol;
      varying vec2 vUv; varying vec4 vC; varying float vR;
      void main(){
        float t = uCloud.w, mode = uFall.x, H = uEye.x + 8.;
        float soft = step(0.5, mode);
        float y = H - fract(aSeed.z + t*uFall.w/H*(0.75 + 0.5*aSeed.w))*H;
        float ang = aSeed.y*6.2831853 + soft*(t*0.22*(aSeed.w - 0.3) + y*0.011);
        float rr = sqrt(aSeed.x)*uEye.y*0.97 + soft*sin(t*0.6 + aSeed.w*50.)*1.6;
        vec3 P = vec3(cos(ang)*rr, y, sin(ang)*rr);
        float show = step(fract(aSeed.w*7.31), uFall.y)*step(uFall.z, y)*step(0.001, uFall.y);
        vec4 mvPosition = viewMatrix*vec4(P, 1.); float dist = max(-mvPosition.z, 0.01);
        vec2 off;
        float fade = 1., tumble = 1.;
        if (mode < 0.5) {                      // rain: short streaks along world up, of every length and brightness
          float w = max(0.045 + 0.05*aSeed.w, dist*0.0013), ln = min(0.5 + 2.8*aSeed.w*aSeed.w, dist*0.045);
          fade = min(1., 0.07/w*2.2)*(0.25 + 0.75*fract(aSeed.w*23.7))*smoothstep(5., 18., dist);
          vec2 up = (viewMatrix*vec4(0., 1., 0., 0.)).xy; up /= max(length(up), 1e-3);
          off = vec2(up.y, -up.x)*position.x*w + up*position.y*ln;
        } else if (mode < 1.5) {               // snow: small soft flakes, and a few large faint ones out of focus near the lens
          float big = step(0.93, fract(aSeed.w*13.7));
          float s = clamp(0.34 + 0.4*aSeed.w, dist*0.0024, dist*0.012);
          s = mix(s, min(1.4 + 1.8*aSeed.x, dist*0.045), big);
          fade = mix(smoothstep(5., 16., dist), 0.2*smoothstep(5., 14., dist)*(1. - smoothstep(34., 64., dist)), big);
          off = position.xy*s;
        } else {                               // petals: tumbling
          float big = fract(aSeed.w*17.3);
          float s = max(0.38 + 1.15*big*big, dist*0.0022), sp = t*(1.5 + 2.5*aSeed.w) + aSeed.w*60.;
          float cs = cos(sp*0.6), sn = sin(sp*0.6);
          tumble = cos(sp);
          vec2 q = vec2(position.x*tumble, position.y*0.8);
          off = vec2(q.x*cs - q.y*sn, q.x*sn + q.y*cs)*s;
        }
        mvPosition.xy += off*show; gl_Position = projectionMatrix*mvPosition;
        float lit = oculusSun(P);
        vec3 light = uFill*1.5 + uAmbient*2. + uSunColor*(lit*0.55) + uSky*(0.5*(1. - soft));   // rain carries the sky down with it
        vec3 c = uFallCol*light*(0.75 + 0.5*aSeed.w);
        if (mode > 1.5) {
          // rose petals: three reds, deep crimson in the shade, glowing copper-rose where they turn in the beam
          float h = fract(aSeed.x*91.7 + aSeed.w*5.3);
          vec3 pc = h < 0.4 ? vec3(0.34, 0.012, 0.045) : (h < 0.8 ? vec3(0.62, 0.03, 0.075) : vec3(0.8, 0.1, 0.16));
          float face = 0.35 + 0.65*abs(tumble);
          c = pc*((uFill*1.3 + uAmbient*2.)*face + uSunColor*(lit*(0.25 + 0.75*face)*0.6))
            + vec3(1., 0.42, 0.24)*uSunColor*(lit*(1. - 0.6*abs(tumble))*0.14);
        }
        float alpha = mode < 0.5 ? 0.0 : (mode < 1.5 ? 0.25*fade : 1.0);
        float gain = mode < 0.5 ? 0.9*fade : (mode < 1.5 ? 1.5*fade : 1.0);
        vC = vec4(c*gain, alpha)*show*smoothstep(1., 5., dist);
        vUv = position.xy; vR = aSeed.w;
      ` + fx.GLSL_FOG_VERT + '}',
    fragmentShader: fx.GLSL_FOG_PARS_FRAG + /* glsl */`
      uniform vec4 uFall; varying vec2 vUv; varying vec4 vC; varying float vR;
      void main(){
        float a; vec3 col = vC.rgb;
        if (uFall.x < 0.5) a = (1. - abs(vUv.x))*(1. - vUv.y*vUv.y);
        else if (uFall.x < 1.5) { a = 1. - smoothstep(0., 1., length(vUv)); a *= a; }
        else {
          // a rose petal by its own outline and surface: a broad rounded top with a shallow cleft, narrowing to its pale claw;
          // a crease up the middle, one cheek cupped toward the light, a rim that curls and catches it
          float tt = clamp((vUv.y + 0.95)/1.9, 0., 1.), ax = abs(vUv.x);
          float hw = 0.98*pow(max(sin(3.14159*pow(tt, 1.35)), 0.), 0.62), e = ax/max(hw, 0.05);
          a = smoothstep(0., 0.1, hw - ax)*smoothstep(0., 0.07, 0.95 - 0.2*exp(-vUv.x*vUv.x*25.) - vUv.y);
          float sh = (1. - 0.24*exp(-vUv.x*vUv.x*200.)*smoothstep(0.08, 0.3, tt)*(1. - smoothstep(0.6, 0.92, tt)))
            *(1. + 0.2*(vR > 0.5 ? 1. : -1.)*vUv.x/max(hw, 0.05))*(1. + 0.22*smoothstep(0.55, 1., e));
          col = mix(col*sh, vec3(col.r)*vec3(1.05, 0.8, 0.7), 0.6*(1. - smoothstep(0., 0.22, tt)));
        }
        if (a*vC.r + a*vC.a < 0.002) discard;
        float f = 1. - fxFog()*0.7;
        gl_FragColor = vec4(col*(a*f), vC.a*a);
      }`,
  });
  const mesh = new THREE.Mesh(await quadCloud(ctx, count, rng), mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return { mesh, uniforms };
}

// ---------------------------------------------------------------------------------------------
// the hero
// ---------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, pal = opts.palette ?? DEFAULT_PALETTE, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
  let look = opts.look;
  if (!look) {
    look = rng.pick(['summer', 'summer', 'april', 'shower', 'snow', 'night']);
    if (vary.hour === 'night') look = 'night'; else if (vary.hour && vary.hour !== 'any' && look === 'night') look = 'summer';
  }
  let rare = opts.rare ?? !!vary.rare;
  const C = (h) => new THREE.Color(h);
  const keysBy = {}, keysFor = (l) => (keysBy[l] ??= dayKeys(pal, l)), sunAtFn = opts.sunAt ?? ((u) => sunTrack(u, look));
  const windA = rng.range(0, Math.PI * 2), wind = new THREE.Vector2(Math.cos(windA), Math.sin(windA)).multiplyScalar(rng.range(22, 30));

  const shared = {
    uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunColor: { value: new THREE.Color(1, 1, 1) }, uFill: { value: new THREE.Color(0.2, 0.25, 0.35) },
    uAmbient: { value: new THREE.Color(0.01, 0.012, 0.02) }, uBouncePos: { value: new THREE.Vector3(0, 2, 0) }, uBounceCol: { value: new THREE.Color(0, 0, 0) },
    uSky: { value: new THREE.Color(0.3, 0.5, 1) }, uEye: { value: new THREE.Vector4(EYE_Y, EYE_R, THROAT, look === 'snow' ? 0.2 : look === 'night' ? 0.4 : look === 'april' ? 0.6 : 0.55) },
    uCloud: { value: new THREE.Vector4(rng.range(0, 500), rng.range(0, 500), 1, 0) },
    uCandle: { value: new THREE.Color(0, 0, 0) }, uLamp: { value: new THREE.Color(0, 0, 0) }, uBounceK: { value: 1 / 3600 }, uOuter: { value: 1 }, uHalo: { value: 0.16 },
  };
  const marble = {
    uPorph: { value: C(pal[5]).lerp(C('#4c1e58'), 0.38).multiplyScalar(1.04) }, uGold: { value: C(pal[4]).lerp(C('#ead9b0'), 0.24).multiplyScalar(0.85) }, uWhite: { value: C('#bdb6a8') },
    uGrey: { value: C(pal[2]).multiplyScalar(0.8) }, uGreen: { value: C('#44705a').multiplyScalar(0.95) }, uSeed: { value: rng.range(0, 60) },
  };
  const floorU = { uWet: { value: new THREE.Vector4(0, 0, 0, 0) }, uMop: { value: new THREE.Vector4(rng.range(-20, -8), rng.range(-66, -52), rng.range(4, 16), rng.range(-14, 2)) }, uSnow: { value: new THREE.Vector4(0, 0, 0, 0) }, uFloorSun: { value: 0.5 }, uFloorLift: { value: 0 } };

  const object = new THREE.Group(); object.name = 'oculus-day-hero';
  const add = (geo, mat, name) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.frustumCulled = false; object.add(m); return m; };

  // dome + coffers
  const concrete = C(pal[2]).multiplyScalar(0.86).lerp(C('#8d8f96'), rng.range(0.1, 0.3));
  const dome = await buildDome(ctx, rng.fork('dome'), concrete);
  add(dome.geometry, makeStone(shared, 'concrete', { coffer: true, vertexColors: true, side: THREE.DoubleSide, gloss: 0.05, color: new THREE.Color(1.32, 1.32, 1.32) }), 'dome');
  await ctx.yield();
  add(await buildRosettes(ctx, rng.fork('ros'), dome.panels, C(pal[4]).lerp(C('#ffd070'), 0.3).multiplyScalar(0.72)), makeStone(shared, 'gilt', { vertexColors: true, side: THREE.DoubleSide, gloss: 0.75 }), 'rosettes');
  await ctx.yield();

  // bronze rim of the eye
  const y0 = EYE_Y, bz = C('#7a5026').lerp(C(pal[4]), 0.12);
  const rimP = [[31.0, y0 - 1.1, 0.7], [29.2, y0 - 1.9, 1.1], [27.8, y0 - 2.2, 0.8], [26.4, y0 - 1.6, 1.25], [26.4, y0 + 0.4, 1.0], [27.0, y0 + 1.0, 0.75], [27.0, y0 + 3.4, 0.9],
    [26.6, y0 + 3.7, 1.2], [26.6, y0 + 4.3, 1.2], [27.0, y0 + 4.6, 0.8], [27.0, y0 + 7.4, 0.9], [27.5, y0 + 8.2, 1.1], [28.6, y0 + RIM_DEPTH, 1.2], [31.2, y0 + RIM_DEPTH, 1.0], [31.8, y0 + 8.0, 0.8]];
  const rimMat = makeStone(shared, 'bronze', { vertexColors: true, side: THREE.DoubleSide, gloss: 0.5 }); rimMat.defines.OC_RIM = 1;
  add(latheGeo(rimP, 112, bz, () => 1), rimMat, 'rim');
  await ctx.yield();

  // outer shell, seen after leaving through the eye
  if (opts.exterior !== false) {
    const ex = [[31.8, y0 + 8.0, 0.8], [33.5, y0 + 4.5, 1]];
    for (const r of [40, 52, 64, 76, 88, 99]) ex.push([r, Y_SPRING + Math.sqrt(139 * 139 - r * r), 1]);
    let ry = Y_SPRING + Math.sqrt(139 * 139 - 99 * 99), rr = 99;
    for (let i = 0; i < 7; i++) { rr += 1.2; ry -= 7.2; ex.push([rr, ry, 0.82]); rr += 5.6; ry -= 0.8; ex.push([rr, ry, 1.05]); }
    ex.push([rr + 3.5, ry - 1.5, 1.1], [rr + 3.5, ry - 5, 0.9], [rr + 0.5, ry - 7, 0.8], [rr + 0.5, 60, 0.75]);
    add(latheGeo(ex, 96, C('#8f8a84')), makeStone(shared, 'exterior', { vertexColors: true, side: THREE.DoubleSide }), 'shell');
  }
  await ctx.yield();

  // floor and stand-in drum
  let floorMat = null;
  if (opts.floor !== false) {
    floorMat = makeStone(shared, 'floor', { uniforms: { ...marble, ...floorU } });
    add(new THREE.CircleGeometry(131, 96).rotateX(-Math.PI / 2), floorMat, 'floor');
  }
  await ctx.yield();
  const drum = opts.drum ?? true;
  if (drum) {
    const dm = makeStone(shared, 'drum', { side: THREE.DoubleSide, gloss: 0.3, uniforms: marble });
    if (drum === true) add(new THREE.CylinderGeometry(R_DOME, R_DOME, 72, 112, 1, true).translate(0, 36, 0), dm, 'drum-lower');
    add(new THREE.CylinderGeometry(R_DOME, R_DOME, 43, 112, 1, true).translate(0, 100.5, 0), dm, 'drum-attic');
    const ent = [[130.3, 71.5], [128.4, 72.4], [128.4, 75.2], [126.9, 76.0], [126.9, 78.2], [128.6, 78.8], [130.3, 79.6]];
    add(latheGeo(ent, 112, C('#ffffff')), dm, 'drum-cornice');
  }
  await ctx.yield();

  const beam = makeBeam(shared); object.add(beam.mesh);
  const veil = makeBeam(shared, true); veil.mesh.visible = false; veil.mesh.renderOrder = 2; veil.uniforms.uBeam.value.set(0.02, 0, 0.1, 70); object.add(veil.mesh);
  await ctx.yield();
  const motes = await makeMotes(ctx, shared, rng.fork('motes'), Math.round(2800 * detail)); object.add(motes.mesh);
  await ctx.yield();
  const fall = await makeFall(ctx, shared, rng.fork('fall'), Math.round((rare ? 7000 : look === 'shower' ? 9000 : 3600) * detail)); object.add(fall.mesh);
  await ctx.yield();

  // ----- the day -----
  const state = { u: 0, look, rare, sunDir: shared.uSunDir.value, sunColor: new THREE.Color(), power: 1, cloud: 1, fill: new THREE.Color(), sky: new THREE.Color(), fog: new THREE.Color(), disc: new THREE.Vector3(), discOn: 'dome', open: 1 };
  const day = { sun: new THREE.Color(), fill: new THREE.Color(), sky: new THREE.Color(), power: 1 };
  const fillBase = new THREE.Color(), tmpS = new THREE.Vector3(), shadowC = C(pal[0]), greyFill = C('#9aa0aa').multiplyScalar(0.55), greySky = C('#9aa0aa').multiplyScalar(1.2);
  const BOUNCE_TINT = { floor: C('#ffc9a0'), drum: C('#ffdca4'), dome: C('#e6e0d6') };
  const EYE_V = new THREE.Vector3(0, EYE_Y, 0);
  let progress = 0, progressSet = false, shut = 0, beamGain = 1, moteGain = 1, fallManual = null, lastTime = 0;
  const sunAt = (u, out = new THREE.Vector3()) => { const s = sunAtFn(u); return dirAzEl(s.az * DEG, Math.max(s.el, 3) * DEG, out); };
  const discAt = (u, out = new THREE.Vector3()) => { discHit(sunAt(u, tmpS), out); return out; };
  const FALL = { rain: [0, 70, C('#c4cfdf')], snow: [1, 7, C('#f4f6fb')], petals: [2, 11, C('#ffffff')] };

  function applyDay(u) {
    state.u = u;
    const st = sunAtFn(u);
    dirAzEl(st.az * DEG, Math.max(st.el, 3) * DEG, shared.uSunDir.value);
    sampleDay(keysFor(look), u, day);
    // (few clouds cross the eye early in the day: the morning shaft stands steady)
    shared.uEye.value.w = (look === 'snow' ? 0.2 : look === 'night' ? 0.4 : look === 'april' ? 0.6 : 0.55) * (0.45 + 0.55 * smoothstep(0.15, 0.4, u));
    // weather of the look
    shut = look === 'shower' ? smoothstep(0.33, 0.4, u) * (1 - smoothstep(0.445, 0.5, u)) : 0;
    if (look === 'shower') { day.fill.lerp(greyFill, shut * 0.7); day.sky.lerp(greySky, shut * 0.9); }
    state.power = day.power; state.sunColor.copy(day.sun).multiplyScalar(day.power);
    state.fill.copy(day.fill); state.sky.copy(day.sky);
    state.fog.copy(day.fill).multiplyScalar(0.55).lerp(day.sky, 0.12);
    // how much of the throat the sun sees (a lens at low sun)
    const el = Math.max(st.el, 3) * DEG, off = THROAT / Math.tan(el), x = clamp(off / (2 * EYE_R), 0, 1);
    state.open = (2 / Math.PI) * (Math.acos(x) - x * Math.sqrt(1 - x * x));
    state.discOn = discHit(shared.uSunDir.value, state.disc);
    shared.uFill.value.copy(day.fill).multiplyScalar(0.34);
    fillBase.copy(shared.uFill.value);
    shared.uAmbient.value.copy(day.fill).multiplyScalar(0.15).add(tmpC.copy(shadowC).multiplyScalar(0.3));
    shared.uSky.value.copy(day.sky);
    // floor: wet circle of the shower, mopped stripe drying, snow gathering
    floorU.uWet.value.w = 0;
    if (look === 'shower') floorU.uWet.value.set(0, 0, 30 * smoothstep(0.34, 0.45, u) * (1 - 0.55 * smoothstep(0.66, 1, u)), smoothstep(0.35, 0.42, u) * (1 - 0.6 * smoothstep(0.66, 1, u)));
    floorU.uSnow.value.set(look === 'snow' ? 9 + 19 * smoothstep(0, 0.9, u) : 0, look === 'snow' ? 1 : 0, look === 'snow' ? 0 : 1 - smoothstep(0.4, 0.52, u), shut);
    // what falls under the eye
    let kind = 'none', amount = 0, front = 0;
    if (look === 'shower') { kind = 'rain'; amount = shut; }
    if (look === 'snow') { kind = 'snow'; amount = 1; }
    if (rare && u > 0.55) { kind = 'petals'; amount = smoothstep(0.55, 0.6, u); front = Math.max(0, EYE_Y - ((u - 0.55) / 0.11) * EYE_Y); }
    if (fallManual) { kind = fallManual[0]; amount = fallManual[1]; front = 0; }
    const f = FALL[kind];
    if (f) { fall.uniforms.uFall.value.set(f[0], amount, front, f[1]); fall.uniforms.uFallCol.value.copy(f[2]); } else fall.uniforms.uFall.value.y = 0;
    fall.mesh.visible = !!f && amount > 0.001;
    const rain = kind === 'rain' ? amount : 0;
    veil.mesh.visible = rain > 0.001; veil.uniforms.uBeam.value.y = rain * 1.25; veil.uniforms.uBeamCol.value.copy(day.sky).multiplyScalar(0.5).add(tmpC.copy(day.fill).multiplyScalar(0.5));
  }
  const tmpC = new THREE.Color(), cloud0 = new THREE.Vector2(shared.uCloud.value.x, shared.uCloud.value.y);
  function applyCloud(time) {
    const depth = (look === 'snow' ? 0.3 : look === 'night' ? 0.3 : 0.4) * (0.45 + 0.55 * smoothstep(0.15, 0.4, state.u));
    const n = ctx.noise ? ctx.noise.n2(time * 0.42, 3.7) : Math.sin(time * 1.3);
    const cl = (1 - depth * smoothstep(0.1, 0.6, n)) * (1 - shut);
    state.cloud = cl;
    shared.uCloud.value.set(cloud0.x + wind.x * time, cloud0.y + wind.y * time, cl, time);
    shared.uSunColor.value.copy(state.sunColor);
    shared.uFill.value.copy(fillBase).multiplyScalar(0.84 + 0.16 * cl);     // the whole hall dims a little under a cloud
    shared.uBounceCol.value.copy(state.sunColor).multiply(BOUNCE_TINT[state.discOn]).multiplyScalar(0.105 * cl * state.open);
    shared.uBouncePos.value.copy(state.disc); if (state.discOn === 'floor') shared.uBouncePos.value.y = 2.5;
    const mx = Math.max(day.sun.r, day.sun.g, day.sun.b, 1e-3);
    beam.uniforms.uBeamCol.value.copy(day.sun).multiplyScalar(1 / mx);
    // (lit dust in the rose light of morning is gold: laid over the blue hall, a redder shaft would turn mauve)
    if (look !== 'night' && look !== 'snow') beam.uniforms.uBeamCol.value.lerp(tmpC.setRGB(1, 0.78, 0.42), 0.5 * (1 - smoothstep(0.22, 0.45, state.u)));
    beam.uniforms.uBeamCol.value.lerp(tmpC.set(1, 1, 1), 0.12).multiplyScalar(clamp(0.25 + 0.15 * day.power, 0.3, 1) * (look === 'snow' ? 0.5 : 1));
    beam.uniforms.uBeam.value.y = beamGain; beam.uniforms.uBeam2.value.w = Math.max(state.disc.distanceTo(EYE_V), 60);
    motes.uniforms.uMoteCol.value.copy(day.sun).multiplyScalar((1.5 / mx) * Math.min(1, day.power / 3.5) * moteGain).multiply(look === 'night' ? tmpC.setRGB(0.9, 0.95, 1) : tmpC.setRGB(1, 0.86, 0.6));
  }
  applyDay(0.1); applyCloud(0);

  // ----- anchors -----
  const travel = dirAzEl(16 * DEG, 66 * DEG), seat = new THREE.Vector3(0, EYE_Y + RIM_DEPTH + 5, 0);
  const pb = seat.clone().addScaledVector(travel, -60), hd = new THREE.Vector2(travel.x, travel.z).normalize(), right = new THREE.Vector2(-hd.y, hd.x);
  const cen = new THREE.Vector2(pb.x, pb.z).addScaledVector(right, 50), rel = new THREE.Vector2(pb.x - cen.x, pb.z - cen.y);
  const arcPt = (deg, y, sgn) => { const a = deg * DEG * sgn, c = Math.cos(a), s = Math.sin(a); return new THREE.Vector3(cen.x + rel.x * c - rel.y * s, y, cen.y + rel.x * s + rel.y * c); };
  const probe = arcPt(5, pb.y, 1), sgn = (pb.x - probe.x) * hd.x + (pb.z - probe.z) * hd.y > 0 ? 1 : -1;
  const flyThrough = [arcPt(100, 190, sgn), arcPt(60, 199, sgn), arcPt(28, 208, sgn), pb, seat.clone().addScaledVector(travel, -40), seat.clone().addScaledVector(travel, -20), seat.clone()];
  const domePoint = (azDeg, elevDeg, inset = 0) => sph(azDeg * DEG, elevDeg * DEG, R_DOME - inset);
  const anchors = {
    eye: new THREE.Vector3(0, EYE_Y, 0), eyeRadius: EYE_R, rimTop: EYE_Y + RIM_DEPTH,
    portalSeat: { position: seat, normal: travel.clone().negate(), radius: 7 },
    exitDir: travel, flyThrough,
    reveal: { position: new THREE.Vector3(5, 17, 106), lookAt: discAt(0.1).lerp(new THREE.Vector3(0, EYE_Y, 0), 0.5) },
    closePass: { position: domePoint(60, 23.6, 12), lookAt: domePoint(84, 25, 0), ring: 2, y: 182 },
    viewpoints: [
      { name: 'reveal', position: new THREE.Vector3(5, 17, 106), lookAt: new THREE.Vector3(60, 215, -20) },
      { name: 'acrossFromApse', position: new THREE.Vector3(-20, 22, -68), lookAt: new THREE.Vector3(0, 90, 60) },
      { name: 'noonCrossing', position: new THREE.Vector3(0, 14, -10), lookAt: new THREE.Vector3(0, 8, 64) },
      { name: 'underTheEye', position: new THREE.Vector3(10, 200, -30), lookAt: new THREE.Vector3(0, EYE_Y + 6, 0) },
    ],
    door: { az: 0, position: new THREE.Vector3(0, 0, R_DOME) }, apse: { az: 180, position: new THREE.Vector3(0, 0, -R_DOME) },
    size: { drumRadius: R_DOME, springing: Y_SPRING, crown: 260, eyeY: EYE_Y, outerRadius: 168 },
  };

  return {
    object, radius: 40, height: 275, center: new THREE.Vector3(0, 70, 0),
    anchors, ground: false, groundY: 0,
    uniforms: shared, state, GLSL: OC_GLSL, sunAt, discAt, domePoint, mop: floorU.uMop.value, wind: wind.clone().normalize(),
    makeStoneMaterial: (o = {}) => makeStone(shared, ({ marble: 'marble', concrete: 'concrete', bronze: 'bronze', gilt: 'gilt', exterior: 'exterior', revet: 'revet', granite: 'granite', paving: 'paving' })[o.kind] ?? 'plain', { side: THREE.DoubleSide, ...o }),
    setProgress(u) { progressSet = true; progress = clamp(u, 0, 1); applyDay(progress); applyCloud(lastTime); },
    setBeamGain(g, cap, near) { beamGain = g; if (cap !== undefined) beam.uniforms.uBeam.value.z = cap; if (near !== undefined) beam.uniforms.uBeam.value.w = near; },
    setBeamShape(knee, gain, foot) { beam.uniforms.uBeam2.value.x = knee; beam.uniforms.uBeam2.value.y = gain; beam.uniforms.uBeam2.value.z = foot; },
    setMoteGain(g) { moteGain = g; }, floorSun: floorU.uFloorSun, floorLift: floorU.uFloorLift,
    setLook(name, isRare = rare) { look = name; rare = isRare; state.look = look; state.rare = rare; applyDay(progress); },
    setFall(kind, amount = 1) { fallManual = kind && kind !== 'auto' ? [kind, amount] : null; applyDay(progress); },
    update(dt, time, camera) {
      lastTime = time;
      if (!progressSet && camera) {
        // viewed alone: the day follows the camera round the room
        const cm = camera.matrixWorld.elements, a = Math.atan2(cm[12], cm[14]);
        const t = clamp((((a + 0.3) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 1.5), 0, 1);
        applyDay(0.1 + 0.85 * t);
      }
      applyCloud(time);
    },
    dispose() {},
  };
}
