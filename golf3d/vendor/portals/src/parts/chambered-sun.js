// HERO: The Chambered Sun: a seashell the size of a moon, seen from inside, grown round a small sun.
//
// COORDINATES (the brief's own, NOT "origin at the base centre"): the sun sits at the local origin,
// the shell's axis is +Z at y 0, +Y is up; the flight runs from the sun (z 0) out of the mouth (z 3710)
// to the exit ring (z 3960, on the axis 250 m outside the lip). Angles round the axis are PHI, from the bottom (-Y) toward +X:
//   x = rho * sin(phi), y = -rho * cos(phi).   Flying +Z with +Y up, +X is on the LEFT.
//
// WHAT IS BUILT (17 draw calls, about 128k triangles, about 270 ms of build, no lights)
//   chambers 1..4   inward faces only. 1 is ribbed pearl with gold moss and mist in its grooves; 2..4 carry
//                   the "country" shader: Voronoi fields with hedges and furrows, forest with crowns seen
//                   from above, rivers as bright threads, lakes that glint toward the door, white towns with
//                   window glints, contour terraces, crawling cloud shadows. The lake of chamber 2 and its
//                   terraces are painted at fixed places (anchors.lake) so a real lake can sit on them.
//   domes 1..3      thick nacre septa bulging mouthward, door in the centre with a rolled, glowing lip;
//                   30 radial ribs by displacement, scalloped growth lines, alabaster glow from the door rim.
//   sun             radius 60, animated cell-noise granules (6 s), lanes, limb darkening; five prominences
//                   (ribbon arches rising and draining over 20 s); additive halo.
//   ribs            nine sickle-curved nacre blades from the wall of chamber 1 to 20 m short of the sun.
//   shafts          three additive light cones, one through each door.
//   cloudBells      the cataract in each door: a neck and a flared trumpet of sliding vapour (alpha <= 0.5).
//   cradle          rolled mouth lip, the swan-neck spur, its 406 m level run with a beaded ridge 9 m under
//                   the flight line, two horns with pearl rows and the ring seat for the 14 m portal.
//
// LIGHT IT EXPECTS: none. Every material is a ShaderMaterial lit analytically: the sun at the origin
// seen through the three door discs (a soft cone, so a bright disc lands on the next dome and a ring of
// full light on the land round it), key colours #FFE6A3 / #FFF0CC / #EEF2FF at 1 / 0.7 / 0.45, a wrap fill
// from the inner dome (0.35), cloud-river scatter from the axis (0.25), a violet floor (0.18), distance haze
// to #7FA3C8 (hero.setHaze(metres), default 2100) and one exposure uniform. Scene fog is applied on top
// (fog chunks), so keep the world's fog thin and blue or leave it out. Wants a dark indigo sky with stars
// in the mouth; bloom wide and gold. Exposure is automatic from the camera's z (0.6 beside the sun, 0.9 in
// chamber 2, 1.0 in 3, 1.15 in 4); hero.setExposure(x) overrides it, setExposure(null) hands it back.
//
// OPTS: palette (7 hex strings: pearl, rose, sea-green, gold, forest, violet, ink), detail (0.6..1: fewer
// lathe segments below 0.75), season ('summer' | 'blossom'; default picked by the seed), view (set-piece
// viewer only: 'country' | 'sun' | 'door' | 'lake' | 'room3' | 'room4' | 'mouth'; also ?view= in the URL).
// PER SEED: the whole map of the country (noise tile), the season, the ribs' twist and spacing, the
// prominences' places and sizes, the granule pattern, the lean of the cradle's neck.
//
// RETURNED: radius / height / center describe a VANTAGE INSIDE the shell for the orbiting viewer, not the
// bounding size; the true size is anchors.bounds (radius 1480, z -420 .. 4030). ground: false.
// No progress hook is needed: nothing in the piece is timed to the camera. update(dt, time, camera) only
// writes uniforms (time, camera position in local space, exposure).
//
// ANCHORS (local space)
//   sun, sunRadius            centre and radius of the sun
//   doors[3]                  { center, radius (clear opening 45 / 95 / 210), z0, z1, facing }
//   domes[3]                  { doorZ, rimZ, outerRadius, bulge }
//   chambers[4]               { z0, z1, radius }
//   wall(ch, z, phi, lift)    -> { position, up }: a point on chamber ch's (1..4) inner wall, lifted toward
//                             the axis; `up` is the local "up" there (use it to seat lakes, trees, boats)
//   lake                      chamber 2: z 520..780, phi -15..+38 degrees, terraces on to 62 degrees
//   mouth, spur, hornTips     the lip ring, the level run of the spur (its ridge line; neckReach: the z of the
//                             sunward face of its swan neck), the two horn tips
//   portalSeat                { position (0, 0, 3960), facing (0, 0, -1), radius 8 }: the ring between the horns
//   flyThrough                12 points: beside the sun at x 95, onto the axis, through the three doors, out
//                             of the mouth and along the spur to the ring; at least 6 m clear everywhere
//   viewpoints                entry, firstCountry, lakeRamp, shaft2, cradle: { position, lookAt }
//   ribTips, bounds, parts    parts = { chambers[], domes[], sun, ribs, cradle, shafts[], cloud } for hiding
//                             far pieces by progress (set .visible; nothing is created after build)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#F3E9E2', '#E8B7C4', '#9FD8C6', '#FFE6A3', '#3F8F6A', '#5B4A78', '#0A0C1E'];

// ---- built sizes (metres), from the brief ----
const SUN_R = 60;
const DOOR_Z = [210, 1010, 2210];        // door centres on the axis
const DOOR_R = [45, 95, 210];            // door radii
const DOME_BULGE = [90, 180, 260];       // the rim of each dome sits this far sunward of its door
const DOME_ROUT = [338, 676, 1000];      // dome outer radius = next chamber's radius at the rim
const DOME_THICK = 25;
const MOUTH_Z = 3710, MOUTH_R = 620;

// sunward face of dome k at radius r
const domeZ = (k, r) => DOOR_Z[k] - DOME_BULGE[k] * Math.min(1, (r / DOME_ROUT[k]) ** 2);

// Chamber profiles as [z, rho] lists (t 0..1 from the sunward end to the mouthward end).
function chamberProfile(k, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n; let z, r;
    if (k === 0) {            // bulb round the sun, closed behind it, meeting dome 1 at r ~165
      const a = lerp(0.02, 1, t) * Math.PI * 0.5;
      if (t < 0.6) { const b = lerp(0.03, 1, t / 0.6) * Math.PI * 0.5; z = 20 - 440 * Math.cos(b); r = 225 * Math.pow(Math.sin(b), 0.5); }   // an egg drawn out behind the sun (the apex), so the sun can be seen whole from the entry
      else { const q = (t - 0.6) / 0.4; z = lerp(20, 190, q); r = 225 - 59 * q * Math.sqrt(q); }
      void a;
    } else if (k === 1) {     // barrel, radius 360
      // the same barrel as far as z 968, then straight on to z 985, where it ends inside dome 2's slab: past the sunward face
      // wherever the ribs put it (z 959 to 971 at this radius) and short of the mouthward face (z 1003 to 1015), so no gap shows at the rim
      const q = t * (985 - (DOOR_Z[0] - DOME_BULGE[0])) / (968 - (DOOR_Z[0] - DOME_BULGE[0]));
      z = lerp(DOOR_Z[0] - DOME_BULGE[0], 968, q); r = 360 * (0.94 + 0.06 * Math.sin(Math.PI * Math.min(1, q * 1.15)));
    } else if (k === 2) {     // barrel, radius 720
      // the same barrel as far as z 2115, where it ends inside dome 3's slab: past the sunward face wherever the ribs put it
      // (z 2075 to 2108 at this radius) and short of the mouthward face (z 2122 to 2155), so no land shows through the dome's back
      const q = t * (2115 - (DOOR_Z[1] - DOME_BULGE[1])) / (2142 - (DOOR_Z[1] - DOME_BULGE[1]));
      z = lerp(DOOR_Z[1] - DOME_BULGE[1], 2142, q); r = 720 * (0.94 + 0.06 * Math.sin(Math.PI * Math.min(1, q * 1.15)));
    } else {                  // the great last room: swells to 1450 at z 2900, curls in to the lip
      if (t < 0.5) { const q = t * 2; z = lerp(DOOR_Z[2] - DOME_BULGE[2], 2900, q); r = lerp(1000, 1450, Math.sin(q * Math.PI * 0.5)); }
      else { const q = (t - 0.5) * 2, b = q * Math.PI * 0.5; z = 2900 + (MOUTH_Z - 2900) * Math.sin(b); r = MOUTH_R + (1450 - MOUTH_R) * Math.pow(Math.cos(b), 0.85); }
    }
    pts.push([z, r]);
  }
  return pts;
}

// Lathe about +Z from a [z, rho] profile. Attributes: position, normal (pointing at the axis side
// given by `inward`), uv (x = phi / TAU, y = arc length along the profile in metres).
function latheZ(profile, segs, inward = true) {
  const n = profile.length, pos = new Float32Array(n * (segs + 1) * 3), nor = new Float32Array(n * (segs + 1) * 3), uv = new Float32Array(n * (segs + 1) * 2);
  let s = 0, q = 0; const idx = new (n * (segs + 1) > 65535 ? Uint32Array : Uint16Array)((n - 1) * segs * 6);
  const SX = new Float64Array(segs + 1), CY = new Float64Array(segs + 1);
  for (let j = 0; j <= segs; j++) { const phi = (j / segs) * TAU; SX[j] = Math.sin(phi); CY[j] = -Math.cos(phi); }
  for (let i = 0; i < n; i++) {
    const [z, r] = profile[i];
    if (i > 0) s += Math.hypot(z - profile[i - 1][0], r - profile[i - 1][1]);
    const a = profile[Math.max(0, i - 1)], b = profile[Math.min(n - 1, i + 1)];
    let tz = b[0] - a[0], tr = b[1] - a[1]; const tl = Math.hypot(tz, tr) || 1; tz /= tl; tr /= tl;
    // normal in the (z, rho) plane: (tr, -tz) points toward the axis for a profile running +z
    const nz = inward ? tr : -tr, nr = inward ? -tz : tz;
    for (let j = 0; j <= segs; j++) {
      const sx = SX[j], cy = CY[j], o = (i * (segs + 1) + j);
      pos[o * 3] = r * sx; pos[o * 3 + 1] = r * cy; pos[o * 3 + 2] = z;
      nor[o * 3] = nr * sx; nor[o * 3 + 1] = nr * cy; nor[o * 3 + 2] = nz;
      uv[o * 2] = j / segs; uv[o * 2 + 1] = s;
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < segs; j++) {
    const a = i * (segs + 1) + j, b = a + 1, c = a + segs + 1, d = c + 1;
    if (inward) { idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; } else { idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.userData.length = s;
  return g;
}

// 256 px tileable RGBA8 noise: four independent fbm channels (value noise, periods 8..64).
async function makeNoiseTile(ctx, rng) {
  const N = 256, data = new Uint8Array(N * N * 4);
  const lat = [];
  for (let c = 0; c < 4; c++) { const o = []; for (const p of [8, 16, 32, 64]) { const a = new Float32Array(p * p); for (let i = 0; i < a.length; i++) a[i] = rng(); o.push([p, a]); } lat.push(o); await ctx.yield(); }
  const amp = [0.5, 0.27, 0.15, 0.08];
  // per octave: the lattice cell and the eased fraction of every pixel column (rows use the same tables)
  const PS = [8, 16, 32, 64], IX = [], I1 = [], UX = [];
  for (const p of PS) {
    const ix = new Int32Array(N), i1 = new Int32Array(N), ux = new Float64Array(N);
    for (let x = 0; x < N; x++) { const fx = x / N * p, i = Math.floor(fx); let u = fx - i; u = u * u * (3 - 2 * u); ix[x] = i; i1[x] = (i + 1) % p; ux[x] = u; }
    IX.push(ix); I1.push(i1); UX.push(ux);
  }
  for (let y = 0; y < N; y++) {
    if (y % 6 === 0) await ctx.yield();
    for (let x = 0; x < N; x++) for (let c = 0; c < 4; c++) {
      let v = 0;
      for (let o = 0; o < 4; o++) {
        const p = PS[o], a = lat[c][o][1], ix = IX[o][x], i1 = I1[o][x], ux = UX[o][x], r0 = IX[o][y] * p, r1 = I1[o][y] * p;
        v += amp[o] * lerp(lerp(a[r0 + ix], a[r0 + i1], ux), lerp(a[r1 + ix], a[r1 + i1], ux), UX[o][y]);
      }
      data[(y * N + x) * 4 + c] = clamp(Math.round((0.5 + (v - 0.5) * 1.7) * 255), 0, 255);
    }
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------- shared GLSL
const VERT = /* glsl */`
varying vec2 vUv; varying vec3 vP; varying vec3 vN;
#include <fog_pars_vertex>
void main(){
  vUv = uv; vP = position; vN = normal;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// Light of the shell: sun at the origin seen through the door discs, three fills, haze, exposure.
const LIGHT = /* glsl */`
uniform vec3 uCam; uniform float uExpo, uTime, uHazeLen; uniform sampler2D uNoise;
uniform vec3 uPearl, uRose, uSea, uGold, uForest, uViolet, uHaze;
uniform vec4 uHb, uTw; uniform mat3 uHbM;      // the harbour of the last room: centre of its water (w: the angle of its spire); the spire's foot and tip in the harbour's frame; the harbour's axes (its up points at the axis of the shell)
varying vec2 vUv; varying vec3 vP; varying vec3 vN;
#include <fog_pars_fragment>
float doorVis(vec3 p, float zd, float rd){
  float k = max(p.z - zd, 0.) / zd, rho = length(p.xy);
  return 1. - smoothstep(rd + (rd - 60.) * k - 2., rd + (rd + 60.) * k + 2., rho);
}
// how much of the sun a point in chamber ch (0..3) sees
float sunVis(vec3 p, float ch){
  float v = 1.;
  if (ch > 0.5) v *= doorVis(p, 210., 45.);
  if (ch > 1.5) v *= doorVis(p, 1010., 95.);
  if (ch > 2.5) v *= doorVis(p, 2210., 210.);
  return v;
}
// The first room, one rule for every nacre: beside the sun the light itself carries the pearl toward white-gold. The
// share is set by nearness to the sun and by how squarely the surface faces it, the same on ivory, honey and black
// nacre; what lies in a groove or turns from the sun keeps the nacre's own colour, as does all from door 1 outward.
const vec3 WHITE_GOLD = vec3(.80, .73, .56);
float sunShare(vec3 p, vec3 n){
  return .82 * (1. - smoothstep(240., 400., length(p))) * clamp(dot(n, normalize(-p + vec3(0., 0., 1e-3))) * 1.25 + .15, 0., 1.);
}
vec3 keyColor(float ch){
  vec3 c = vec3(1., .79, .36) * 1.0;                                  // #FFE6A3
  c = mix(c, vec3(1., .87, .60) * .7, clamp(ch - 1., 0., 1.));        // #FFF0CC
  c = mix(c, vec3(.85, .89, 1.) * .45, clamp(ch - 2., 0., 1.));       // #EEF2FF
  return c;
}
// centre of the door on the sunward side of chamber ch
vec3 innerDoor(float ch){ return vec3(0., 0., ch < 0.5 ? 0. : ch < 1.5 ? 210. : ch < 2.5 ? 1010. : 2210.); }
vec3 shellLight(vec3 p, vec3 n, float ch, float relief, float shadow){
  vec3 toSun = normalize(-p + vec3(0., 0., 1e-3));
  vec3 toDoor = normalize(innerDoor(ch) - p + vec3(0., 0., 1e-3));
  float ndl = clamp(dot(n, toSun) * 2.2 + .25, 0., 1.);
  float key = sunVis(p, ch) * (.4 + .6 * ndl) * relief * shadow;
  if (ch < .5) key *= clamp(pow(150. / max(length(p), 40.), 1.6), .6, 1.8);
  float wrap = clamp(dot(n, toDoor) * .5 + .5, 0., 1.);
  vec3 l = keyColor(ch) * key * 1.1;
  if (ch < .5) l += vec3(1., .88, .64) * .42;                         // the sun's own room: its lit walls light each other, so nothing in it stands dark
  vec3 toAxis = normalize(vec3(-p.xy, length(p.xy) * .7 + 1.));
  float ax = clamp(dot(n, toAxis) * .5 + .5, 0., 1.);
  if (ch > .5 && ch < 2.5) {
    // the lit dome at the far end of the room is a lamp: a pool of warm full light on the land within about a dome
    // radius of its rim, and the rest of the room a step darker and bluer
    float zr = ch < 1.5 ? 965. : 2090., rr = ch < 1.5 ? 300. : 560.;
    float lampD = exp(-max(zr - p.z, 0.) / rr);
    vec3 toDome = normalize(vec3(0., 0., zr + 60.) - p + vec3(0., 1e-3, 0.));                 // |p.xy| is never under 100 on a wall; in the air p.z differs
    float nd = clamp(dot(n, toDome) * .75 + .5, 0., 1.);
    l += vec3(1., .80, .50) * lampD * nd * .78 * relief * (.6 + .4 * shadow);
    l += mix(uPearl, uGold, .35) * .24 * wrap * relief;                 // the inner dome as an area light
    l += vec3(.86, .92, 1.) * .22 * (.6 + .4 * shadow) * (.35 + .9 * ax * ax);   // cloud-river scatter
    l += mix(uViolet, vec3(.74, .82, 1.), .5) * .15;                    // floor
    return l;
  }
  l += mix(uPearl, uGold, .35) * .35 * wrap * relief;     // the inner dome as an area light
  l += vec3(.93, .95, 1.) * .25 * (.75 + .25 * shadow) * (.35 + .9 * ax * ax);   // cloud-river scatter
  l += mix(uViolet, vec3(.8, .85, 1.), .45) * .18;                    // floor
  return l;
}
vec3 hazed(vec3 c, vec3 p){
  float d = length(p - uCam);
  float far4 = smoothstep(2150., 2500., p.z);                        // the last room is the widest: its far land goes almost pure blue,
  float g = d / (uHazeLen * .56);                                    // pale and not dim, while what is near (the harbour) keeps its colours
  float f = 1. - exp(-mix(d / (uHazeLen * 1.9), g * g * g / (.6 + g * g), far4));
  return mix(c, uHaze * mix(vec3(.56, .66, .80), vec3(.80, .90, 1.0), far4), f * .92);
}
// two-hue pearl sheen, 12 percent at most
vec3 sheen(float ndv, float phase, float nz){
  float t = sin(7. * ndv + 4. * phase + 2. * nz + uTime * .35);
  float e = 1. - ndv;
  return mix(uRose, uSea, .5 + .5 * t) * .12 * e * e;
}
`;

// ---------------------------------------------------------------- the country on the walls
const COUNTRY_FRAG = LIGHT + /* glsl */`
uniform float uCh, uCirc, uN1, uSeason;
vec2 hash2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
float tileOf(float approx){ return uCirc / floor(uCirc / approx + .5); }
void main(){
  vec2 L = vec2(vUv.x * uCirc, vUv.y);                    // metres round the wall, metres along it
  float fw = max(max(fwidth(L.x), fwidth(L.y)), 1e-3);    // metres per pixel
  float T = uCirc / uN1;
  vec2 q = vec2(vUv.x * uN1, L.y / T);
  vec2 q3 = q * 3. + vec2(.37, .11);
  float h = .68 * texture2D(uNoise, q).r + .32 * texture2D(uNoise, q3).g;
  float hs = .68 * texture2D(uNoise, q + vec2(0., 14. / T)).r + .32 * texture2D(uNoise, q3 + vec2(0., 42. / T)).g;
  float micro = texture2D(uNoise, L / tileOf(90.)).b;
  // the lake of chamber 2 and its terraces (fixed, so the real lake can sit on the painted one)
  float phis = (vUv.x > .5 ? vUv.x - 1. : vUv.x) * 6.2831853;
  float isC2 = 1. - step(.5, abs(uCh - 1.));
  vec2 lb = abs(vec2(phis * 345. - 69., vP.z - 650.)) - vec2(160., 130.) + 60.;
  float lakeD = length(max(lb, 0.)) + min(max(lb.x, lb.y), 0.) - 60. + (texture2D(uNoise, q * 4.).a - .5) * 46.;
  float lake = isC2 * (1. - smoothstep(-4., 4., lakeD));
  h = mix(h, .2, isC2 * (1. - smoothstep(0., 60., lakeD)));
  hs = mix(hs, h, isC2 * (1. - smoothstep(0., 60., lakeD)));
  float slope = (hs - h) * 30.;
  // ---- fields: Voronoi cells with hedgerows and furrows
  float cnt = floor(uCirc / 96. + .5), cs = uCirc / cnt;
  vec2 g = L / cs, gi = floor(g), gf = g - gi;
  float d1 = 9., d2 = 9.; vec2 cid = vec2(0.);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)), id = gi + o; id.x = mod(id.x, cnt);
    vec2 r = o + .14 + .72 * hash2(id) - gf; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; cid = id; } else if (d < d2) { d2 = d; }
  }
  float edge = (sqrt(max(d2, 1e-8)) - sqrt(max(d1, 1e-8))) * cs;                 // metres from the nearest hedge
  vec2 hc = hash2(cid + 7.3);
  vec3 cGreen = mix(uForest, uGold, .40) * vec3(.52, .86, .36);
  vec3 cDeep = mix(uForest, uGold, .16) * vec3(.80, .92, .62);
  vec3 cMust = uGold * vec3(.70, .57, .22), cStraw = mix(uGold, uSea, .35) * vec3(.62, .66, .40), cRose = uRose * vec3(.78, .58, .60);
  vec3 cB = mix(cMust, cRose, uSeason), cC = mix(cRose, vec3(.80, .78, .76), uSeason);
  vec3 field = hc.x < .34 ? cGreen : hc.x < .56 ? cDeep : hc.x < .72 ? cB : hc.x < .80 ? cC : cStraw;
  field *= .78 + .36 * hc.y;
  float fa = hc.y * 3.1416; vec2 fdir = vec2(cos(fa), sin(fa));
  float furrow = sin(dot(L, fdir) * 1.5708) * (1. - smoothstep(.7, 2.2, fw));
  // wind over the crops: bright bands sweeping down-shell
  float gust = smoothstep(.42, .8, texture2D(uNoise, vec2(vUv.x * uN1 * 2. + .2, (L.y - uTime * 26.) / (T * .09))).r);
  gust *= .75 + .25 * sin(L.y * .11 + L.x * .05 - uTime * 3.);
  field *= 1. + .13 * furrow + .10 * (micro - .5) + .26 * gust;
  float hw = max(2.2, fw * 1.3);
  float hedge = (1. - smoothstep(hw * .5, hw, edge)) * (1. - .6 * smoothstep(20., 60., fw));
  vec3 col = mix(field, uForest * .5, hedge * .85);
  // ---- terraces: contour bands on the high ground, and the fixed flight above the lake
  float tfn = (texture2D(uNoise, q * 4. + .31).a - .5) * 44.;                           // the terraces meet the lake along an uneven shore
  float terFix = isC2 * (1. - smoothstep(0., 26., abs(phis * 345. - 301.) - 72. + tfn)) * (1. - smoothstep(0., 30., abs(vP.z - 650.) - 135. + tfn));
  float tb = mix(h * 60., phis * 345. / 10.5, terFix);
  float ter = max(smoothstep(.70, .712, h) * (1. - smoothstep(.79, .80, h)), terFix);
  float tf = fract(tb), ti = floor(tb);
  vec2 th = hash2(vec2(ti, floor(L.y / 70.)));
  vec3 tcol = th.x < .6 ? mix(cGreen, uSea * .6, .3) * 1.1 : th.x < .9 ? mix(cMust, cGreen, .55) : mix(cRose, cGreen, .3);
  float twid = max(fwidth(tb), 1e-4);
  float lip = (1. - smoothstep(.0, .12 + twid, tf)) * (1. - smoothstep(.5, 1.5, twid));
  tcol = mix(tcol * (.8 + .3 * tf), uPearl * .5, lip);
  col = mix(col, tcol, ter);
  // ---- forest: dark, mottled, crowns seen from above
  float fo = texture2D(uNoise, q * 2. + vec2(.6, .2)).a + .3 * (h - .5);
  float forest = smoothstep(.54, .59, fo + .06 * (micro - .5)) * (1. - ter) ;
  float crown = 0.;
  for (int k = 0; k < 2; k++) {
    vec2 cg = L / (k == 0 ? 12.5 : 8.3) + float(k) * 3.7, cgi = floor(cg), cgf = cg - cgi; vec2 ch2 = hash2(cgi + float(k) * 17.);
    vec2 dc = cgf - .28 - .44 * ch2; float rr = length(dc) / (.34 + .22 * ch2.y);
    float star = .82 + .18 * cos(8. * atan(dc.y, dc.x + 1e-4) + ch2.x * 6.);
    crown = max(crown, (1. - smoothstep(.25, 1., rr / star)) * (.75 + .25 * ch2.x));
  }
  float nearF = 1. - smoothstep(1.5, 6., fw);
  vec3 fcol = uForest * vec3(.8, .9, .85) * (.5 + .5 * micro) * mix(1., .5 + .95 * crown, nearF);
  fcol = mix(fcol, mix(uGold, uForest, .55) * .9, nearF * smoothstep(.75, 1., crown) * .6);   // pale fiddlehead centres
  fcol = fcol * (1. + .34 * gust) + uSea * .035 * gust;
  col = mix(col, fcol, forest);
  // ---- towns: white specks with rose roofs and a window glint
  float tn = texture2D(uNoise, q * 5. + vec2(.5, .3)).g;
  float town = smoothstep(.79, .83, tn) * (1. - forest) * step(.36, h) * (1. - lake);
  vec2 hg = L / 9., hgi = floor(hg), hgf = hg - hgi; vec2 hh = hash2(hgi + 3.1);
  float nearT = 1. - smoothstep(2.5, 7., fw);
  vec2 hb = abs(hgf - .5) - .29;
  float house = step(.42, hh.x) * (1. - smoothstep(-.03, .03, max(hb.x, hb.y)));
  house *= 1. - isC2 * step(-470., phis * 345.) * step(phis * 345., 640.) * step(300., vP.z) * step(vP.z, 960.);   // real houses stand here (the world builds them)
  float roof = step(.0, hgf.y - .5 + (hh.y - .5) * .2);
  vec3 hcol = mix(vec3(.80, .78, .74), mix(uRose, vec3(.75, .36, .30), .55), roof * .8);
  vec3 tmean = mix(col, vec3(.80, .74, .70), .62);
  vec3 tnear = mix(mix(col, uPearl * .62, .5), hcol, house);
  col = mix(col, mix(tmean, tnear, nearT), town);
  float glint = town * step(.42, hh.x) * pow(max(.5 + .5 * sin(uTime * 1.1 + hh.y * 60.), 1e-3), 24.) * step(.7, hh.y);
  // ---- water: lakes below the water line, rivers as bright threads
  float rv = texture2D(uNoise, q + vec2(.13, .71)).b + .08 * texture2D(uNoise, q * 6.).a;
  float rw = max(mix(.0045, .0028, step(2.5, uCh)), mix(1.6, 1.3, step(2.5, uCh)) * fwidth(rv));   // threads, finer in the blue room
  float river = (1. - smoothstep(rw * .55, rw, abs(rv - .5))) * (1. - .5 * ter);
  float wl = .30;
  float shore = 1. - smoothstep(wl, wl + .012 + fwidth(h), h);
  float water = max(max(shore, lake), river);
  vec3 sand = mix(uPearl, uGold, .3) * .7;
  col = mix(col, sand, (1. - smoothstep(wl + .01, wl + .03, h)) * (1. - forest * .5));
  vec3 n = normalize(vN + vec3(0., 1e-6, 0.));
  vec3 V = normalize(uCam - vP + vec3(1e-3, 0., 0.));
  vec2 rp = L / tileOf(60.);
  float rip = texture2D(uNoise, rp + vec2(uTime * .011, uTime * .004)).r - texture2D(uNoise, rp * 1.7 - vec2(uTime * .008, 0.)).g;
  vec3 toDoor = normalize(innerDoor(uCh) - vP + vec3(0., 0., 1e-3));
  vec3 Hh = normalize(V + toDoor + vec3(0., 1e-3, 0.));
  float ndh = clamp(dot(n, Hh), 0., 1.);
  float gl = texture2D(uNoise, L / tileOf(7.) + vec2(uTime * .05, -uTime * .033)).a * texture2D(uNoise, L / tileOf(11.) - vec2(uTime * .04, 0.)).b;
  float lobe = pow(max(ndh, 1e-3), 48.);
  float spec = pow(max(ndh, 1e-3), 14.) * .22 + lobe * (.5 + smoothstep(.36, .5, gl) * (.6 + .4 * sin(uTime * 2. + gl * 60.)) * 2.3 * (1. - .7 * smoothstep(2., 10., fw)));
  // the lit dome ahead lies on the water as a warm band with moving sparkle in it
  vec3 toDome = normalize(vec3(0., 0., uCh < 1.5 ? 1010. : 2210.) - vP + vec3(0., 0., 1e-3));
  float nd2 = clamp(dot(n, normalize(V + toDome + vec3(0., 1e-3, 0.))), 0., 1.);
  float p4 = nd2 * nd2; p4 *= p4; float p16 = p4 * p4; p16 *= p16; float p20 = p16 * p4;
  float spark = smoothstep(.33, .5, gl) * (.55 + .45 * sin(uTime * 2.3 + gl * 70.)) * (1. - .75 * smoothstep(1.5, 9., fw));
  float fleck = smoothstep(.34, .8, p20 * p20 * (.3 + 2.3 * gl) + .2 * p20 * p20) * (.4 + .6 * spark);        // a path of gold flecks, solid only in its core
  float domeGl = (fleck * .30 + p20 * p20 * p20 * spark * 1.1) * (1. - step(2.5, uCh)) * (1. - smoothstep(150., 340., length(uCam - vP)));   // a near thing: from across the chamber the lake keeps its colour
  float fres = 1. - clamp(dot(n, V), 0., 1.); fres = fres * fres;
  vec3 wcol = mix(uSea * vec3(.36, .62, .68), uHaze * .9, fres * .7) * (1. + .16 * rip * nearF);
  // near water: wavelets, sparkle on their crests and fish rings (all gone by a metre per pixel)
  float nearW = 1. - smoothstep(.22, 1.1, fw);
  float wave = texture2D(uNoise, L / tileOf(26.) + vec2(uTime * .021, uTime * .013)).r + texture2D(uNoise, L / tileOf(15.) - vec2(uTime * .017, uTime * .024)).g - 1.;
  float wave2 = texture2D(uNoise, L / tileOf(6.) + vec2(-uTime * .05, uTime * .04)).b - .5;
  vec2 rg = L / 19., rgi = floor(rg); vec2 rh = hash2(rgi + 11.7);
  float rph = fract(uTime * .19 + rh.x * 7.), rr2 = length(rg - rgi - .25 - .5 * rh) * 19.;
  float ring = step(.45, rh.y) * (1. - rph) * (1. - smoothstep(0., .35, abs(rr2 - rph * 5.5))) * smoothstep(.02, .12, rph);
  ring += step(.45, rh.y) * (1. - rph) * .6 * (1. - smoothstep(0., .3, abs(rr2 - rph * 3.2))) * smoothstep(.1, .25, rph);
  float fineW = texture2D(uNoise, L / tileOf(2.6) + vec2(uTime * .07, -uTime * .05)).a + texture2D(uNoise, L / tileOf(4.1) - vec2(uTime * .06, uTime * .03)).r - 1.;
  float wv = wave + .5 * wave2 + .55 * fineW;
  wcol *= 1. + nearW * (.10 * wave + .14 * wave2 + .16 * fineW);
  wcol += nearW * (smoothstep(-.1, .9, wv) * .07 + ring * .22) * mix(uPearl, keyColor(uCh), .5);          // light on the backs of the ripples
  wcol *= 1. - nearW * .15 * (1. - smoothstep(-.9, .1, wv));                                               // and darker troughs
  // the banks stand in the water: a soft violet-green reflection along every shore
  float bank = smoothstep(wl - .055, wl - .002, h) * max(shore, lake) * (.72 + .28 * sin(L.x * 1.9 + wave2 * 9. + uTime * 1.3) * nearW);
  wcol = mix(wcol, mix(uForest * .55, uViolet, .55) * .5, bank * .62);
  // flooded terraces: each step a mirror, pale and brightening toward its lip
  float terS = isC2 * (1. - smoothstep(-80., 50., abs(phis * 345. - 301.) - 72. + tfn)) * (1. - smoothstep(-80., 50., abs(vP.z - 650.) - 135. + tfn));
  float padd = terS * max(shore, lake);
  float tfw = fract(phis * 345. / 10.5 + (texture2D(uNoise, L / tileOf(120.)).r + .5 * texture2D(uNoise, L / tileOf(41.)).g - .75) * 2.4);   // under water the steps wander
  vec3 mirror = mix(uSea, vec3(.84, .96, 1.), .5) * (.94 + .16 * texture2D(uNoise, L / tileOf(150.) + .4).b) * (1. + .14 * wave * nearW) + vec3(1., .84, .56) * .3 * smoothstep(.8, .97, tfw);   // pale aqua, a warm line where the lamp lies on it
  mirror *= 1. - .3 * (1. - smoothstep(.0, .16, tfw));                                   // the lip's shadow in the still water
  wcol = mix(wcol, mirror, padd * .42 * (1. - .6 * bank));
  wcol = mix(wcol, wcol * 1.5 + .12, river * (1. - max(shore, lake)) * smoothstep(1., 8., fw));
  wcol += river * (1. - max(shore, lake)) * (.3 + .5 * step(2.5, uCh)) * smoothstep(.2, 1., sin(L.y * .19 + L.x * .16 - uTime * 2.4)) * mix(keyColor(uCh), uGold, step(2.5, uCh));      // glints running along the rivers; across the last room they are its bright threads
  col = mix(col, wcol, water);
  // ---- the last room: window glints seen across the room. Daylight on glass, never a lamp: near, one to a house; far, one
  // to a 36 m block held a pixel and a half across. Each flashes hard gold as the view turns past its own angle, so the
  // flashes run along a town as we fly.
  float glT = smoothstep(.60, .76, tn) * (1. - .7 * forest) * step(.33, h) * (1. - max(shore, lake));
  float dl1 = length(hgf - .5 - (hh - .5) * .5) * 9.;
  float glN = step(.45, hh.y) * (1. - smoothstep(.5, max(1.6, fw * 1.5), dl1));
  vec2 bg = L / 36., bgi = floor(bg); vec2 bh = hash2(bgi + 5.7);
  float rad2 = max(3., fw * 1.6) * (.8 + .9 * bh.y * bh.y), dl2 = length(bg - bgi - .25 - .5 * bh) * 36.;
  float glF = step(.2, bh.x) * (1. - smoothstep(rad2 * .4, rad2, dl2)) * min(1., 50. / (rad2 * rad2));
  float turn = dot(V, vec3(.62, .31, .72)) * 46. + dot(L, vec2(.021, .013)) + uTime * .8;
  float flashN = smoothstep(.55, .95, sin(turn + hh.x * 6.2831853)), flashF = smoothstep(.45, .95, sin(turn + bh.x * 6.2831853));
  vec2 fg = L / 150., fgi = floor(fg); vec2 fh = hash2(fgi + 9.1);
  float rad3 = max(3.5, fw * 1.6), dl3 = length(fg - fgi - .2 - .6 * fh) * 150.;
  float farm = step(.72, fh.x) * (1. - forest) * (1. - water) * (1. - smoothstep(rad3 * .4, rad3, dl3)) * min(1., 30. / (rad3 * rad3));
  float glints = step(2.5, uCh) * (glT * mix(glN * flashN, glF * flashF, smoothstep(1.2, 3.5, fw)) * 2.4 + farm * smoothstep(.5, .95, sin(turn + fh.y * 6.2831853)) * 1.3);
  // lakes with a glint: hard gold flecks on the water where it mirrors the lit door toward the eye
  float lobe6 = ndh * ndh; lobe6 *= lobe6 * lobe6;
  glints += step(2.5, uCh) * max(shore, lake) * step(.4, bh.y) * (1. - smoothstep(rad2 * .4, rad2, dl2)) * min(1., 50. / (rad2 * rad2)) * smoothstep(.2, .9, sin(turn * 1.3 + bh.x * 6.2831853)) * smoothstep(.12, .5, lobe6) * 1.8;
  // ---- light
  vec2 cq = vec2(vUv.x * uN1, (L.y - uTime * 14.) / T);
  float cloud = smoothstep(.50, .66, texture2D(uNoise, cq * vec2(2., 1.5) + .21).g);      // a whole number of tiles round the wall: no cut at the seam under the lake
  float shadow = 1. - .5 * cloud;
  float relief = clamp(1. + slope * 2.4, .5, 1.6) * (.78 + .44 * h);
  relief = mix(relief, 1., water);
  vec3 lit = shellLight(vP, n, uCh, relief, shadow);
  col = mix(vec3(dot(col, vec3(.3, .55, .15))), col, 1.08);
  vec3 c = max(col, 0.) * .92 * lit;
  c = mix(c, c * mix(vec3(1.), uViolet * 1.9, .4) * .8, .5 * cloud);          // soft violet cloud shadows crossing the fields
  float vis = sunVis(vP, uCh);
  c += (spec * water * keyColor(uCh) * mix(vec3(1.), vec3(1.08, .80, .46), isC2) * (.25 + .75 * vis) + glint * vec3(3., 2.7, 2.2) * (.3 + .7 * vis)) * shadow;
  c += domeGl * water * vec3(1.1, .60, .17) * (.6 + .4 * shadow);
  vec3 cz = hazed(c, vP);
  if (uCh > 2.5) {
    // The last room is pale blue with distance, and the land is still drawn in it: fields a patchwork of blues netted
    // with hedges, forest a second, deeper blue, rivers and lake shores brighter than the land, towns pale flecks.
    // Value inside the one hue, nothing dark; near land keeps its own colours.
    float dd = length(uCam - vP), g4 = dd / (uHazeLen * .56), f4 = (1. - exp(-g4 * g4 * g4 / (.6 + g4 * g4))) * .92;
    float m = .94 + .34 * (hc.y - .5) + (hc.x < .34 ? -.03 : hc.x < .56 ? -.11 : hc.x < .72 ? .07 : .03);
    m *= 1. - .34 * hedge;
    m = mix(m, .80 + .22 * step(.5, tf), ter);
    m = mix(m, .58 + .18 * micro, forest);
    m = mix(m, 1.25, town * .85);
    m = mix(m, 1.08, max(shore, lake));
    m = mix(m, 1.34, river * (1. - max(shore, lake)));
    m *= 1. - .14 * cloud;
    vec3 K = uHaze * vec3(.80, .90, 1.0);
    vec3 blue = mix(mix(K * vec3(.54, .69, .90), K, clamp((m - .55) / .45, 0., 1.)), vec3(.95, .98, 1.), clamp((m - 1.) / .5, 0., 1.) * .9);
    cz = mix(c, blue, f4);
    // the pearl lip: where the wall curls in to the mouth it is bare nacre, ribbed every 12 degrees, with growth
    // ridges 3 m apart and its sheen, lit pale gold from behind us: the rim of the disc of stars
    float rho = length(vP.xy), lipT = (1. - smoothstep(715., 790., rho)) * step(2900., vP.z);
    float ribL = .5 + .5 * cos(phis * 30.), ridL = mix(.5, .5 + .5 * sin(rho * 2.0944), 1. - smoothstep(.6, 2.4, fw));
    vec3 albL = uPearl * clamp(.50 / max(dot(uPearl, vec3(.3, .55, .15)), .05), 0., 1.7) * (.70 + .30 * smoothstep(.1, .9, ribL)) * (.92 + .08 * ridL);
    albL = mix(albL, mix(uPearl, uViolet, .55) * .6, (1. - smoothstep(.0, .22, ribL)) * .5);
    float wrapL = clamp(dot(n, normalize(vec3(0., 0., 2210.) - vP + vec3(0., 1e-3, 0.))) * .6 + .5, 0., 1.);
    vec3 cl = albL * (vec3(1., .80, .46) * (.46 + .50 * wrapL) + vec3(.80, .86, 1.) * .14) + sheen(clamp(dot(n, V), 0., 1.), phis * 3. + rho * .01, ribL);
    cz = mix(cz, mix(cl, K, f4 * .3), lipT);
    glints *= 1. - lipT;
  }
  c = mix(cz, uGold * .95, clamp(glints * exp(-length(uCam - vP) / 5200.), 0., 1.));      // hard gold over the blue, not a glow added to it
  c *= uExpo;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- nacre (chamber 1, ribs, cradle)
const BUMP = /* glsl */`
vec3 bumped(vec3 n, vec3 p, float hgt){
  vec3 dpx = dFdx(p), dpy = dFdy(p); float dhx = dFdx(hgt), dhy = dFdy(hgt);
  vec3 r1 = cross(dpy, n), r2 = cross(n, dpx); float det = dot(dpx, r1);
  vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
  return normalize(abs(det) * n - grad + n * 1e-7);
}`;
const NACRE_FRAG = LIGHT + BUMP + /* glsl */`
uniform float uCh, uRibs, uMoss, uRidge, uMist, uAmp, uTrans, uGild, uFill; uniform vec4 uSeat;
void main(){
  float ph = vUv.y / uRidge;
  float fade = 1. - smoothstep(.1, .34, fwidth(ph));
  float ridge = sin(ph * 6.2831853) * fade;
  float rib = (cos(vUv.x * 6.2831853 * uRibs) * .8 + .2 * cos(vUv.x * 6.2831853 * uRibs / 3. + 1.)) * step(.5, uRibs);
  float ribF = 1. - smoothstep(.15, .5, fwidth(vUv.x * uRibs));
  // (the cradle is flown along its length: its grain is as fine along it as across, so nothing on it is drawn out into streaks)
  float nz = texture2D(uNoise, vec2(vUv.x * 6., vUv.y / mix(170., 9., uSeat.w))).r;
  float fine = texture2D(uNoise, vec2(vUv.x * 40., vUv.y / mix(23., 1.4, uSeat.w))).b;
  float ch0 = 1. - step(.5, uCh);                                     // chamber 1: clean ribbed pearl, no cloud to dapple it
  float isBead = uSeat.w * step(abs(vUv.y - 2.25), .002) * step(vUv.x, .002);
  float cross = sin(vUv.y * 2.618) * uSeat.w * (1. - isBead) * (1. - smoothstep(.1, .34, fwidth(vUv.y / 2.4)));      // the cradle: a rib across it every 2.4 m, like the rings of a horn
  float hgt = .09 * uAmp * ridge + rib * ribF * 2.0 * uAmp + (fine - .5) * .2 * fade + (nz - .5) * 1.5 * uAmp * (1. - .7 * ch0) + .2 * cross;
  vec3 n0 = normalize(vN + vec3(0., 1e-6, 0.));
  vec3 n = bumped(n0, vP, hgt);
  vec3 V = normalize(uCam - vP + vec3(1e-3, 0., 0.));
  float ndv = clamp(dot(n, V), 0., 1.);
  float groove = (1. - smoothstep(-.85, .1, rib)) * step(.5, uRibs) + (1. - step(.5, uRibs)) * (1. - smoothstep(-.8, .2, ridge)) * .6;
  vec3 alb = uPearl * .76 * (.94 + .06 * ridge) * (.9 + .2 * nz * (1. - .6 * ch0));
  alb *= mix(1., clamp(.45 / max(dot(uPearl, vec3(.3, .55, .15)), .05), .0, 1.7), uSeat.w);      // the cradle: pale pearl against the stars, whatever the nacre
  alb = mix(alb, mix(uPearl, uViolet, .55) * .6, groove * .62);                 // shadowed pearl goes lilac
  float hollow = (1. - smoothstep(-1., .5, rib)) * ribF * step(.5, uRibs) * ch0;       // chamber 1: each rib stands out of a hollow of thin violet shade
  alb = mix(alb, mix(alb, uViolet, .55) * .74, hollow * .62);
  float mossN = texture2D(uNoise, vec2(vUv.x * 21., vUv.y / mix(37., 2.6, uSeat.w))).g;
  float moss = groove * groove * smoothstep(.5, .66, mossN + .3 * (fine - .5)) * uMoss;
  moss = mix(moss, groove * groove * groove * groove * (.5 + .5 * smoothstep(.3, .6, mossN)) * uMoss * 1.3, ch0);      // chamber 1: a thread of gold moss down each groove, nowhere else
  alb = mix(alb, uGold * vec3(.50, .42, .09) * (.6 + .8 * fine), moss * .9);
  // the cradle: growth rings every 18 m that read from across the room, a fringe of moss hanging from its flanks, and its pearls
  alb *= 1. - .1 * uSeat.w * (1. - smoothstep(-.6, .2, cross));                 // the seam between two ribs, a little darker
  float grow2 = uSeat.w * (1. - isBead) * smoothstep(.43, .47, abs(fract(vUv.y / 18.) - .5));
  alb = mix(alb, mix(uPearl, uViolet, .55) * .62, grow2 * .6);
  float fz = texture2D(uNoise, vec2(vUv.y / 29., .37)).r, fa = -.62 + .6 * fz;
  float fringe = uSeat.w * (1. - isBead) * (1. - smoothstep(fa - .1, fa, n0.y)) * smoothstep(-.99, -.86, n0.y) * (.7 + .3 * fine);
  alb = mix(alb, mix(uForest, uGold, .45) * vec3(.42, .50, .16) * (.6 + .8 * fine), fringe * .9);
  alb = mix(alb, alb * 1.14 + .03, isBead);
  float dap = mix(.6 + .85 * smoothstep(.22, .78, texture2D(uNoise, vec2(vUv.x * 2. + uTime * .02, vUv.y / 210. - uTime * .085)).g), 1., ch0);
  vec3 lit = shellLight(vP, n, uCh, 1., dap) * uFill;
  lit /= 1. + uSeat.w * .25 * max(max(lit.r, lit.g), lit.b);                  // the cradle stands in the shaft from door 3: its light is eased so pale nacre does not burn out
  vec3 c = alb * lit;
  c = mix(c, WHITE_GOLD * lit, ch0 * sunShare(vP, n) * (1. - .85 * groove) * (1. - .5 * hollow));      // the first room's rule: lit white-gold beside the sun, whatever the nacre
  float away = ch0 * (1. - smoothstep(-.15, .5, dot(n, normalize(-vP + vec3(0., 0., 1e-3)))));      // chamber 1: what turns from the sun stands in its own shade, violet, never black
  c = mix(c, c * vec3(.56, .49, .70), away * .8);
  c += alb * vec3(1., .74, .38) * uGild * dap * sunVis(vP, uCh) * clamp(dot(n, normalize(-vP + vec3(0., 0., 1e-3))) * 1.6 + .3, 0., 1.);
  float lum = dot(lit, vec3(.33));
  float back = clamp(-dot(n, normalize(-vP + vec3(0., 0., 1e-3))), 0., 1.);
  c += mix(uGold, uRose, .45) * vec3(1., .7, .5) * back * uTrans * sunVis(vP, uCh) * clamp(pow(118. / max(length(vP), 40.), 1.7), .28, 1.8);
  c += sheen(ndv, ph + rib, nz) * (.5 + lum) * (1. - moss);
  c += pow(clamp(dot(n, normalize(V + normalize(-vP + vec3(0., 0., 1e-3)) + vec3(0., 1e-3, 0.))), 1e-3, 1.), 40.) * keyColor(uCh) * .35 * sunVis(vP, uCh) * (1. - moss);
  // mist running in the grooves
  float mist = groove * uMist * smoothstep(.35, .75, texture2D(uNoise, vec2(vUv.x * 9., vUv.y / 120. - uTime * .035)).a);
  c = mix(c, vec3(1., .93, .8) * (.4 + .5 * lum), mist * .4);
  // the ring's own cool light on the horns that hold it
  vec3 toRing = uSeat.xyz - vP; float dr = length(toRing);
  c += alb * vec3(.70, .86, 1.) * uSeat.w * exp(-dr / 75.) * 1.3 * (.3 + .7 * clamp(dot(n, toRing / max(dr, 1.)), 0., 1.));
  float rimE = 1. - ndv; rimE *= rimE;
  c += alb * uGold * uSeat.w * sunVis(vP, uCh) * rimE * .5;                                 // the shaft from behind us catches its edges pale gold
  float hb = clamp(dot(n, normalize(V + normalize(-vP + vec3(0., 0., 1e-3)) + vec3(0., 1e-3, 0.))), 0., 1.), hb4 = hb * hb * hb * hb;
  c += isBead * vec3(1., .95, .82) * hb4 * hb4 * hb4 * hb4 * .9;                            // each pearl carries a highlight of the sun behind us
  c += alb * vec3(1., .80, .46) * .5 * uSeat.w * (1. - sunVis(vP, uCh)) * clamp(dot(n, normalize(-vP + vec3(0., 0., 1e-3))) * .6 + .45, 0., 1.);
  c = mix(c, c * vec3(1.22, 1.03, .70), uSeat.w * max(sunVis(vP, uCh), .6) * .85);         // and washes the whole cradle pale gold, from behind us (the rolled lip too, outside the shaft)
  c = mix(c, hazed(c, vP), 1. - .55 * uSeat.w) * uExpo;                                    // the cradle stands in the mouth: it keeps its pearl and gold through the blue air
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;
// the band of cool light the portal sits in, and its halo
const RING_VERT = /* glsl */`
varying vec3 vP;
void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const RING_FRAG = /* glsl */`
uniform vec4 uSeat; uniform float uR, uExpo, uTime; varying vec3 vP;
void main(){
  float r = length(vP - uSeat.xyz), t = clamp((r - uR - .2) / 3.4, 0., 1.);
  float b = sin(3.14159265 * t); b = b * b * (.9 + .1 * sin(uTime * 1.3 + (vP.x + vP.y) * .45));
  gl_FragColor = vec4(vec3(.74, .90, 1.) * 2.6 * b * uExpo, 1.);
}`;
const RHALO_VERT = /* glsl */`
uniform vec4 uSeat; uniform float uR; varying vec2 vQ;
void main(){
  vQ = position.xy * uR * 7.;
  vec4 mv = modelViewMatrix * vec4(uSeat.xyz, 1.);
  mv.xy += vQ;
  gl_Position = projectionMatrix * mv;
}`;
const RHALO_FRAG = /* glsl */`
uniform float uR, uExpo, uTime; varying vec2 vQ;
void main(){
  float d = length(vQ), o = max(d - uR, 0.);
  float g = exp(-o / (uR * .8)) * .30 + exp(-o / (uR * 2.6)) * .10;
  g *= mix(.12, 1., smoothstep(uR * .8, uR * 1.05, d)) * (1. - smoothstep(uR * 5.5, uR * 7., d));     // the opening itself stays clear
  g *= .92 + .08 * sin(uTime * .9);
  gl_FragColor = vec4(vec3(.62, .82, 1.) * g * uExpo, 1.);
}`;

// ---------------------------------------------------------------- the alabaster domes
const DOME_VERT = /* glsl */`
attribute float aFace;
varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying float vFace;
#include <fog_pars_vertex>
void main(){
  vUv = uv; vP = position; vN = normal; vFace = aFace;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DOME_FRAG = LIGHT + BUMP + /* glsl */`
uniform float uCh, uRout, uRd, uRprev; uniform vec3 uLamp;      // uLamp = (lamp core, lamp skirt, sheen)
varying float vFace;      // 0 sunward face, 1 lip, 2 mouthward face
void main(){
  float r = vUv.y, phi = vUv.x * 6.2831853;
  float ribA = smoothstep(uRd + 6., uRd + uRout * .12, r) * r * .011;
  float rib = cos(phi * 30.);
  float rib2 = cos(phi * 60. + 1.3) * smoothstep(.45, .8, r / uRout);         // ribs fork toward the rim
  float ph = r / 3.;
  float fade = 1. - smoothstep(.2, .55, fwidth(ph));
  float ridge = sin(ph * 6.2831853) * fade;
  float nz = texture2D(uNoise, vec2(vUv.x * 7., r / 260.)).r;
  float fine = texture2D(uNoise, vec2(vUv.x * 60., r / 31.)).b;
  float lipness = 1. - abs(vFace - 1.);  lipness = clamp(lipness, 0., 1.);
  float back = clamp(vFace - 1., 0., 1.), front = clamp(1. - vFace, 0., 1.);
  float hgt = (rib * 1.6 + rib2 * .7) * ribA + .22 * ridge + (fine - .5) * .2 * fade;
  hgt *= 1. - lipness;
  vec3 n0 = normalize(vN + vec3(0., 1e-6, 0.));
  vec3 n = bumped(n0, vP, hgt);
  vec3 V = normalize(uCam - vP + vec3(1e-3, 0., 0.));
  float ndv = clamp(dot(n, V), 0., 1.), ndv0 = clamp(dot(n0, V), 0., 1.);
  float vein = clamp(.5 + .5 * (rib * .75 + rib2 * .35), 0., 1.) * smoothstep(uRd + 6., uRd + uRout * .12, r);       // 1 on a rib crest
  vein = max(vein * vein, .35 * (.5 + .5 * ridge));
  float ribOn = smoothstep(uRd + 6., uRd + uRout * .12, r);
  // comarginal growth lines, scalloped between the ribs like a real shell
  float gb = r / (.055 * uRout) + .10 * rib * ribOn + texture2D(uNoise, vec2(vUv.x * 3., r / 400.)).a * .7;
  float gline = smoothstep(.80, .97, fract(gb)) * (1. - smoothstep(.97, 1., fract(gb)));
  float band = .5 + .5 * sin(floor(gb) * 2.4);
  vec3 alb = uPearl * .76 * (.93 + .07 * ridge) * (.88 + .2 * nz) * (.92 + .1 * band) * (1. - .22 * gline * (1. - lipness));
  float d = max(r - uRd, 0.);
  float glow = exp(-d / (.35 * uRout));
  // the lamp: one door radius of near-white gold round the door, then a long soft skirt
  float lampL = uRd * mix(1.5, .6, clamp(uCh, 0., 1.));
  float lamp = exp(-d / lampL), lampW = exp(-d / (lampL * 2.8));
  // 0 at the door, 1 at 1.35 door radii out or at the edge of the face we can see, whichever comes first
  float rimT = clamp(d / max(min(mix(uRprev, uRout, back) - uRd, uRd * 1.35), 1.), 0., 1.);
  float dusk = smoothstep(.08, .95, rimT) * clamp(uCh + .4, 0., 1.);
  alb *= mix(vec3(1.), vec3(.84, .83, .97), smoothstep(.25, 1., r / uRout));
  alb = mix(alb, mix(uPearl, uViolet, .5) * .66, (1. - smoothstep(-.7, .35, rib + rib2 * .4)) * ribOn * .78 * (1. - lamp));
  // surface light: the sunward face gets the shaft's disc, the mouthward face only the fills
  float chF = uCh, chB = uCh + 1.;
  vec3 litF = shellLight(vP, n, chF, 1., 1.);
  vec3 litB = shellLight(vP, n, chB, 1., 0.);
  float dap = .76 + .5 * texture2D(uNoise, vec2(vUv.x * 3. + uTime * .03, r / (uRout * .9) - uTime * .07)).g;
  // away from the door the stone falls to dusky lilac pearl
  vec3 surfF = alb * litF * .74 * dap * mix(1., .5, dusk);
  surfF = mix(surfF, WHITE_GOLD * litF * .74 * dap, (1. - step(.5, uCh)) * front * sunShare(vP, n) * (1. - .8 * (1. - smoothstep(-.7, .35, rib + rib2 * .4)) * ribOn));      // the first room's rule on the first dome's sunward face
  vec3 lilac = mix(uPearl, uViolet, .7) * 1.04;                       // pearl gone toward violet #5B4A78: no blue of its own
  surfF = mix(surfF, lilac * dot(surfF, vec3(.3, .55, .15)) * 3.1, .8 * dusk);
  surfF += mix(uPearl, uViolet, .8) * .28 * dusk * (.8 + .4 * vein);                                  // and is never left black: the far skirt keeps a dusky lilac of its own
  vec3 c = mix(surfF, alb * litB * mix(1., .3, step(1.5, uCh)), back);
  // lamp behind stone: glow falling off from the door rim, cut under the ribs and growth lines (dark veins)
  float disc = sunVis(vec3(vP.xy, min(vP.z, innerDoor(chB).z)), chF) * (1. - smoothstep(uRprev - 30., uRprev + 6., r));
  vec3 amber = mix(uGold, uRose, .38) * vec3(1.05, .80, .58);
  float cut = (1.08 - .72 * vein) * (1. - .45 * gline) * (.75 + .5 * nz);
  vec3 lampC = mix(mix(amber, mix(uPearl, uViolet, .62) * 1.2, smoothstep(.3, 1., rimT)), vec3(1., .88, .62), lamp);   // gold at the door, dusky lilac far out
  vec3 sssF = lampC * (lamp * uLamp.x + lampW * uLamp.y + .05) * mix(cut, 1., lamp * .3);
  vec3 sssB = amber * (glow * glow * 1.6 + glow * 1.5 + .12) * cut + amber * vec3(1.1, .9, .7) * disc * cut * 1.1;
  float gN = exp(-d / (.75 * uRd)), gS = exp(-d / (2.6 * uRd));      // dome 3's mouthward face (the flight never turns to look at it): a ring of gold round the door, dusky lilac beyond
  sssB = mix(sssB, mix(amber, mix(uPearl, uViolet, .6) * 1.1, smoothstep(.2, 1., rimT)) * (gN * gN * 2.4 + gN * 1.5 + gS * .15 + .012) * cut, step(1.5, uCh));
  vec3 lampKey = keyColor(min(chF, 1.)) * mix(1., .9, clamp(chF - 1., 0., 1.));
  lampKey = mix(lampKey, vec3(.57, .48, .78), .6 * smoothstep(.35, 1., rimT) * clamp(uCh, 0., 1.));       // the far skirt of the glow is violet
  c += mix(sssF * lampKey * .62, sssB * keyColor(chF) * 1.05, back) * dap;
  // the orient of the nacre: two hues that slide over the stone as the view turns
  float nzs = texture2D(uNoise, vec2(vUv.x * 2., r / 900.)).a;
  float ir = sin(9. * ndv0 + 2.2 * nzs + .5 * (ndv - ndv0) + uTime * .2);            // broad bands from the smooth face, a little grain from the ribs
  vec3 irid = mix(uRose, uSea, smoothstep(-.6, .6, ir));
  float irA = (1. - lipness) * (1. - .85 * lamp) * smoothstep(.1, .7, abs(ir)) * uLamp.z * (1. - .7 * dusk);      // on the far skirt the sheen is a trace over the lilac, 12 percent at most
  c = mix(c, c * irid * 1.9, .4 * irA) + irid * .05 * irA;
  // cut section of the lip: laminated, emissive
  float lam = .78 + .22 * sin(vP.z * 2.1);
  lam *= (.62 + .38 * sin(r * 1.7 + 1.3 * sin(phi * 45.))) * (.34 + .5 * ndv0) * (.8 + .4 * nz);      // growth lines round the roll, darker where it turns away
  vec3 lipC = mix(uGold, uRose, .3) * vec3(1.1, .85, .66) * 1.6 * lam * keyColor(chF);
  c = mix(c, lipC + alb * .3, lipness * .85);
  c += sheen(ndv, ph + rib, nz) * (.6 + dot(litF, vec3(.2))) ;
  c = hazed(c, vP) * uExpo;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// One dome: sunward face, rolled lip round the door, mouthward face, ribbed by displacement.
function domeGeometry(k, segs) {
  const Rout = DOME_ROUT[k], rd = DOOR_R[k], lipR = DOME_THICK * 0.5 + 4 + k * 2;
  const prof = [];   // [z, rho, face, nz, nr, ribScale]
  const NF = 15, NL = 10;
  for (let i = 0; i <= NF; i++) {               // sunward face, rim -> door
    const t = i / NF, r = lerp(Rout, rd + lipR * 0.9, 1 - (1 - t) * (1 - t));
    prof.push([domeZ(k, r), r, 0, 1]);
  }
  for (let i = 1; i < NL; i++) {                // the roll
    const a = Math.PI * (i / NL), zc = domeZ(k, rd) + DOME_THICK * 0.5;
    prof.push([zc - Math.cos(a) * lipR, rd + lipR * 0.9 - Math.sin(a) * lipR * 0.9, 1, 0]);
  }
  for (let i = 0; i <= NF; i++) {               // mouthward face, door -> rim (thickens outward)
    const t = i / NF, r = lerp(rd + lipR * 0.9, Rout, t * t);
    prof.push([domeZ(k, r) + DOME_THICK * (1 + 1.2 * t), r, 2, 1]);
  }
  const n = prof.length, cols = segs + 1;
  const pos = new Float32Array(n * cols * 3), nor = new Float32Array(n * cols * 3), uv = new Float32Array(n * cols * 2), face = new Float32Array(n * cols);
  const idx = [];
  const SX = new Float64Array(cols), CY = new Float64Array(cols), C30 = new Float64Array(cols), C60 = new Float64Array(cols);
  for (let j = 0; j <= segs; j++) { const phi = (j / segs) * TAU; SX[j] = Math.sin(phi); CY[j] = -Math.cos(phi); C30[j] = Math.cos(phi * 30) * 1.6; C60[j] = Math.cos(phi * 60 + 1.3) * 0.7; }
  for (let i = 0; i < n; i++) {
    const [z, r, f, rs] = prof[i];
    const a = prof[Math.max(0, i - 1)], b = prof[Math.min(n - 1, i + 1)];
    let tz = b[0] - a[0], tr = b[1] - a[1]; const tl = Math.hypot(tz, tr) || 1; tz /= tl; tr /= tl;
    const nz = tr, nr = -tz;                    // outward of the slab for a profile running rim -> door -> rim
    const ribA = rs * smoothstep(rd + 6, rd + Rout * 0.12, r) * r * 0.011, fork = smoothstep(0.45, 0.8, r / Rout);
    for (let j = 0; j <= segs; j++) {
      const sx = SX[j], cy = CY[j], o = i * cols + j;
      const h = (C30[j] + C60[j] * fork) * ribA;
      const rr = r + nr * h, zz = z + nz * h;
      pos[o * 3] = rr * sx; pos[o * 3 + 1] = rr * cy; pos[o * 3 + 2] = zz;
      nor[o * 3] = nr * sx; nor[o * 3 + 1] = nr * cy; nor[o * 3 + 2] = nz;
      uv[o * 2] = j / segs; uv[o * 2 + 1] = r; face[o] = f;
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < segs; j++) {
    const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aFace', new THREE.BufferAttribute(face, 1));
  g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- the sun
const SUN_FRAG = /* glsl */`
uniform vec3 uCam, uSeed; uniform float uExpo, uTime;
varying vec3 vP;
#include <fog_pars_fragment>
vec3 hash3(vec3 p){
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453);
}
// animated cell noise: x = distance to the nearest cell centre, y = gap to the second
vec2 cells(vec3 p, float t){
  vec3 pi = floor(p), pf = p - pi; float d1 = 9., d2 = 9.;
  for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec3 o = vec3(float(i), float(j), float(k)); vec3 h = hash3(pi + o);
    vec3 r = o + .5 + .38 * sin(t * (.6 + .8 * h.yzx) + 6.2831853 * h) - pf;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
  }
  d1 = max(d1, 1e-8); d2 = max(d2, 1e-8);
  return vec2(sqrt(max(d1, 1e-8)), sqrt(max(d2, 1e-8)) - sqrt(max(d1, 1e-8)));
}
void main(){
  vec3 n = normalize(vP + vec3(0., 0., 1e-4));                                   // |vP| = 60, never zero
  vec3 V = normalize(uCam - vP + vec3(1e-3, 0., 0.));
  float mu = clamp(dot(n, V), 0., 1.);
  float t = uTime * 1.0472;                                 // granules turn over in 6 s
  vec3 drift = vec3(0., uTime * .05, uTime * .02);
  vec3 w = vP + 1.5 * sin(vP.yzx * .31 + t * .25) + .8 * sin(vP.zxy * .83 - t * .4);
  vec2 c1 = cells(w / 5.2 + drift + uSeed, t);
  vec2 c2 = cells(vP / 16. - drift * .6, t * .4);
  float lane = 1. - smoothstep(.0, .12, c1.y);                                   // thin dark lanes between cells
  float dome = clamp(1.15 - 1.5 * c1.x * c1.x, 0., 1.);                          // each granule wells up bright in the middle
  float sup = .62 + .38 * smoothstep(.0, .45, c2.y);                             // slow supergranule network
  float fine = .5 + .5 * sin(w.x * 2.3 + sin(w.y * 1.9 + t)) * sin(w.z * 2.1 - t * .7);
  float hot = dome * (1. - lane) * sup * (.86 + .14 * fine);
  vec3 laneC = vec3(.89, .35, .07) * 1.6, centre = vec3(1., .66, .21) * 3.5;
  vec3 c = mix(laneC, centre, hot * sqrt(max(hot, 1e-6)));
  c *= .9 + .2 * (1. - c2.x);
  vec3 limb = vec3(.81, .25, .042) * 1.5;
  float ld = sqrt(max(mu, 1e-6));
  c = mix(limb * (.6 + .4 * hot), c, ld * (1.1 - .1 * ld));
  c.b = min(c.b, c.r * .35);
  gl_FragColor = vec4(c * uExpo, 1.);
  #include <fog_fragment>
}`;
const SUN_VERT = /* glsl */`
varying vec3 vP;
#include <fog_pars_vertex>
void main(){
  vP = position;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// prominences: tubes whose arch rises and drains; aUp is the arch's own height at that vertex
const PROM_VERT = /* glsl */`
attribute vec3 aUp; attribute float aPhase;
uniform float uTime;
varying vec2 vUv; varying vec3 vN; varying vec3 vP; varying float vLife;
void main(){
  float life = .62 + .38 * sin(uTime * .31416 + aPhase);              // 20 s
  vec3 p = position - aUp * (1. - life);
  p += normalize(aUp + vec3(0., 1e-4, 0.)) * sin(uTime * .7 + aPhase * 3. + uv.y * 9.) * 1.2 * uv.y * (1. - uv.y);
  vUv = uv; vN = normal; vP = p; vLife = life;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
const PROM_FRAG = /* glsl */`
uniform vec3 uCam; uniform float uExpo, uTime; uniform sampler2D uNoise;
varying vec2 vUv; varying vec3 vN; varying vec3 vP; varying float vLife;
void main(){
  vec3 V = normalize(uCam - vP + vec3(1e-3, 0., 0.));
  float ndv = abs(dot(normalize(vN + vec3(0., 1e-5, 0.)), V));
  float core = ndv * ndv;
  float s1 = texture2D(uNoise, vec2(vUv.x * 2., vUv.y * 1.6 - uTime * .035)).r;
  float s2 = texture2D(uNoise, vec2(vUv.x * 5., vUv.y * 4. + uTime * .05)).g;
  float streak = smoothstep(.25, .8, s1 * .7 + s2 * .5);
  float ends = smoothstep(0., .06, vUv.y) * (1. - smoothstep(.94, 1., vUv.y));
  float e = abs(cos(vUv.x * 6.2831853)); e = e * e * (3. - 2. * e);                // soft ribbon edges
  float fil = smoothstep(.35, .75, texture2D(uNoise, vec2(vUv.x * 9., vUv.y * .7 - uTime * .02)).a);
  float a = min(core * e * (.2 + .7 * streak + .5 * fil * streak) * ends * (.5 + .5 * vLife), .6);
  vec3 c = mix(vec3(1., .22, .035), vec3(1., .5, .12), streak * e) * 3.4;
  gl_FragColor = vec4(c * a * uExpo, 1.);
}`;
const HALO_VERT = /* glsl */`
varying vec2 vQ;
void main(){
  vQ = position.xy;
  vec4 mv = modelViewMatrix * vec4(0., 0., 0., 1.);
  mv.xy += position.xy;
  gl_Position = projectionMatrix * mv;
}`;
const HALO_FRAG = /* glsl */`
uniform float uExpo, uTime; varying vec2 vQ;
void main(){
  float d = length(vQ);
  float g = exp(-max(d - 58., 0.) / 26.) * .55 + exp(-max(d - 58., 0.) / 90.) * .16;
  g *= 1. - smoothstep(250., 330., d);
  float ang = atan(vQ.y, vQ.x + 1e-4);
  g *= .9 + .1 * sin(ang * 9. + uTime * .2) * sin(ang * 4. - uTime * .13);
  gl_FragColor = vec4(vec3(1., .62, .22) * g * uExpo, 1.);
}`;

// Tube along a centreline. fn(t) -> Vector3, rad(t) -> [rx, ry]; uv = (side / sides, arc length m).
function tubeAlong(fn, rad, rings, sides, up0, cap = true) {
  const P = [], T = [];
  for (let i = 0; i <= rings; i++) P.push(fn(i / rings));
  for (let i = 0; i <= rings; i++) T.push(P[Math.min(rings, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize());
  const pos = [], nor = [], uv = [], idx = [];
  let N = up0.clone().addScaledVector(T[0], -up0.dot(T[0])).normalize(), s = 0;
  const B = new THREE.Vector3(), v = new THREE.Vector3(), nn = new THREE.Vector3();
  for (let i = 0; i <= rings; i++) {
    if (i > 0) { s += P[i].distanceTo(P[i - 1]); N.addScaledVector(T[i], -N.dot(T[i])).normalize(); }
    B.crossVectors(T[i], N);
    const [rx, ry] = rad(i / rings);
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      v.copy(P[i]).addScaledVector(N, ca * ry).addScaledVector(B, sa * rx);
      nn.set(0, 0, 0).addScaledVector(N, ca * rx).addScaledVector(B, sa * ry).normalize();
      pos.push(v.x, v.y, v.z); nor.push(nn.x, nn.y, nn.z); uv.push(j / sides, s);
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < sides; j++) {
    const a = i * (sides + 1) + j, b = a + 1, c = a + sides + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  if (cap) {   // rounded end: a fan to a point pushed out along the tangent
    const [rx] = rad(1); const o = pos.length / 3, e = P[rings].clone().addScaledVector(T[rings], rx * 0.8);
    pos.push(e.x, e.y, e.z); nor.push(T[rings].x, T[rings].y, T[rings].z); uv.push(0.5, s + rx);
    for (let j = 0; j < sides; j++) { const a = rings * (sides + 1) + j; idx.push(a, o, a + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
// a pearl bead: low sphere with uv = (phi, small arc) so the nacre shader stays calm on it
function bead(center, r) {
  const g = new THREE.SphereGeometry(r, 8, 6);
  g.translate(center.x, center.y, center.z);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0, 0.75 * 3);
  return g;
}

const SHAFT_FRAG = /* glsl */`
uniform vec3 uCam; uniform float uExpo, uTime, uCh, uZ0, uZ1, uGain, uSoft; uniform sampler2D uNoise;
varying vec2 vUv; varying vec3 vP; varying vec3 vN;
vec3 keyColor(float ch){
  vec3 c = vec3(1., .79, .36);
  c = mix(c, vec3(1., .87, .60) * .7, clamp(ch - 1., 0., 1.));
  c = mix(c, vec3(.85, .89, 1.) * .45, clamp(ch - 2., 0., 1.));
  return c;
}
void main(){
  // nested cones of streaked light (uv.x carries a per-shell offset): seen from outside as a pale cone,
  // from inside as rays fanning out from the door behind us onto the next dome
  vec3 V = normalize(uCam - vP + vec3(1e-3, 0., 0.));
  float ndv = abs(dot(normalize(vN + vec3(0., 1e-6, 0.)), V));
  float t = clamp((vP.z - uZ0) / max(uZ1 - uZ0, 1.), 0., 1.);
  float s1 = texture2D(uNoise, vec2(vUv.x * 3. + uTime * .004, t * .35 - uTime * .006)).r;
  float s2 = texture2D(uNoise, vec2(vUv.x * 11. - uTime * .003, .3 + t * .04)).g;
  float s3 = texture2D(uNoise, vec2(vUv.x * 29. + uTime * .002, .7)).b;
  float streak = smoothstep(.28, .78, s2 * .7 + s3 * .3) * (.45 + 1.1 * s1) + .12;
  // the last shaft is seen from outside, across the widest room: broad soft bands, no hard rays
  streak = mix(streak, (.4 + .6 * smoothstep(.2, .8, texture2D(uNoise, vec2(vUv.x * 2. + uTime * .003, t * .22 - uTime * .004)).g)) * (.7 + .5 * s1), uSoft);
  float near = smoothstep(10., 110., length(uCam - vP));
  float a = uGain * (.3 + .7 * ndv) * streak * smoothstep(0., .05, t) * (1. - .45 * t) * (1. - smoothstep(.9, 1., t)) * near;
  // from outside, a cone of light has no edge: each shell thins away toward its silhouette
  float slope = length(vP.xy) / max(vP.z, 1.);
  float outside = smoothstep(1., 1.25, length(uCam.xy) / max(slope * uCam.z, 1.));
  a *= mix(1., smoothstep(0., .6, ndv), outside);
  a *= mix(1., mix(.3, 1., outside) * (1. - .85 * smoothstep(.75, .97, abs(V.z))), uSoft);      // from inside it, or looked at end-on, the last shaft is only a faint brightness: the stars in the mouth stay hard
  gl_FragColor = vec4(keyColor(uCh) * a * uExpo, 1.);
}`;

// ---------------------------------------------------------------- build
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const season = opts.season === 'blossom' ? 1 : opts.season === 'summer' ? 0 : (rng() < 0.3 ? 1 : 0);
  const root = new THREE.Group(); root.name = 'chambered-sun';

  const noise = await makeNoiseTile(ctx, rng);
  await ctx.yield();
  const shared = {
    uCam: { value: new THREE.Vector3(95, 0, -70) }, uExpo: { value: 1 }, uTime: { value: 0 }, uHazeLen: { value: 2100 },
    uNoise: { value: noise },
    uPearl: { value: pal[0] }, uRose: { value: pal[1] }, uSea: { value: pal[2] }, uGold: { value: pal[3] },
    uForest: { value: pal[4] }, uViolet: { value: pal[5] }, uHaze: { value: new THREE.Color('#7FA3C8') },
    // the world's harbour in the last room: centre of its water (xyz; w the spire's angle), the spire (x, tip height, z in the harbour's frame), the harbour's axes
    uHb: { value: new THREE.Vector4(0, -1e5, 0, 0) }, uTw: { value: new THREE.Vector4(0, -1e5, 0, 0) }, uHbM: { value: new THREE.Matrix3() },
  };
  const mk = (vert, frag, own, extra = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, ...own },
    vertexShader: vert, fragmentShader: frag, fog: true, side: THREE.DoubleSide, ...extra,
  });
  const glow = (vert, frag, own) => new THREE.ShaderMaterial({
    uniforms: { ...shared, ...own }, vertexShader: vert, fragmentShader: frag, fog: false, side: THREE.DoubleSide,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const f = (v) => ({ value: v });

  // ---- the four chambers
  const chambers = [], profiles = [];
  const CIRC = [TAU * 170, TAU * 360, TAU * 720, TAU * 1150], N1 = [1, 1, 2, 3];
  for (let k = 0; k < 4; k++) {
    const prof = chamberProfile(k, k === 0 ? 40 : k === 3 ? 56 : 40);
    profiles.push(prof);
    const geo = latheZ(prof, detail < 0.75 ? 96 : k === 0 ? 108 : 120, true);
    await ctx.yield();
    const m = k === 0
      ? mk(VERT, NACRE_FRAG, { uCh: f(0), uRibs: f(36), uMoss: f(0.5), uRidge: f(3), uMist: f(0.45), uAmp: f(1), uTrans: f(0), uGild: f(0.3), uFill: f(1.12), uSeat: f(new THREE.Vector4(0, 0, 0, 0)) })
      : mk(VERT, COUNTRY_FRAG, { uCh: f(k), uCirc: f(CIRC[k]), uN1: f(N1[k]), uSeason: f(season) });
    const mesh = new THREE.Mesh(geo, m); mesh.name = 'chamber' + (k + 1); mesh.frustumCulled = false;
    root.add(mesh); chambers.push(mesh);
    await ctx.yield();
  }

  // ---- the three domes
  const domes = [], RPREV = [165, 338, 677];
  for (let k = 0; k < 3; k++) {
    const geo = domeGeometry(k, detail < 0.75 ? 120 : 180);
    await ctx.yield();
    const mesh = new THREE.Mesh(geo, mk(DOME_VERT, DOME_FRAG, { uCh: f(k), uRout: f(DOME_ROUT[k]), uRd: f(DOOR_R[k]), uRprev: f(RPREV[k]), uLamp: f(new THREE.Vector3(k === 0 ? 1.5 : 1.8, k === 0 ? 1.1 : 0.22, k === 0 ? 0.3 : 1)) }));
    mesh.name = 'dome' + (k + 1); mesh.frustumCulled = false; root.add(mesh); domes.push(mesh);
  }
  await ctx.yield();

  // ---- the sun, its halo and five prominences
  const sunGroup = new THREE.Group(); sunGroup.name = 'sun'; root.add(sunGroup);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(SUN_R, 72, 44), mk(SUN_VERT, SUN_FRAG, { uSeed: f(new THREE.Vector3(rng() * 40, rng() * 40, rng() * 40)) }, { side: THREE.FrontSide }));
  sunGroup.add(sun);
  await ctx.yield();
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(680, 680), glow(HALO_VERT, HALO_FRAG, {}));
  halo.frustumCulled = false; halo.renderOrder = 2; sunGroup.add(halo);
  const promGeos = [];
  for (let i = 0; i < 5; i++) {
    // foot directions: spread round the sun, leaning to the side the camera passes (+X) and forward
    const th = (i / 5) * TAU + rng.range(-0.35, 0.35), el = rng.range(-0.55, 0.75);
    const d = new THREE.Vector3(Math.cos(th) * Math.cos(el), Math.sin(el), Math.sin(th) * Math.cos(el)).normalize();
    const tang = new THREE.Vector3(rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)); tang.addScaledVector(d, -tang.dot(d)).normalize();
    const axis = new THREE.Vector3().crossVectors(d, tang).normalize();
    const span = rng.range(0.42, 0.7), hgt = rng.range(30, 50), phase = rng() * TAU, lean = rng.range(-0.25, 0.25);
    const dirAt = (t) => d.clone().applyAxisAngle(axis, (t - 0.5) * span).applyAxisAngle(tang, lean * Math.sin(Math.PI * t));
    const arch = (t) => hgt * Math.pow(Math.sin(Math.PI * t), 0.75);
    const g = tubeAlong((t) => dirAt(t).multiplyScalar(SUN_R - 3 + arch(t)), (t) => [5.5 * (0.55 + 0.45 * Math.sin(Math.PI * t)), 1.7], 40, 8, axis, false);
    const n = g.attributes.position.count, up = new Float32Array(n * 3), ph = new Float32Array(n);
    const uvA = g.attributes.uv; let len = uvA.getY(n - 1) || 1;
    for (let v = 0; v < n; v++) {
      const t = Math.floor(v / 9) / 40, u = dirAt(t).multiplyScalar(arch(t));
      up[v * 3] = u.x; up[v * 3 + 1] = u.y; up[v * 3 + 2] = u.z; ph[v] = phase;
      uvA.setY(v, uvA.getY(v) / len);
    }
    g.setAttribute('aUp', new THREE.BufferAttribute(up, 3)); g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    promGeos.push(g);
    await ctx.yield();
  }
  await ctx.yield();
  const prom = new THREE.Mesh(mergeGeometries(promGeos), glow(PROM_VERT, PROM_FRAG, {}));
  prom.frustumCulled = false; prom.renderOrder = 3; sunGroup.add(prom);
  await ctx.yield();

  // ---- nine nacre ribs cradling the sun (three rings of three, sickle-curved, stopping 20 m short)
  const rhoAt = (prof, z) => { for (let i = 1; i < prof.length; i++) if (prof[i][0] >= z) { const a = prof[i - 1], b = prof[i]; return lerp(a[1], b[1], (z - a[0]) / Math.max(1e-3, b[0] - a[0])); } return prof[prof.length - 1][1]; };
  const ribGeos = [], ribTips = [];
  const RING = [{ z0: 28, th: 1.52 }, { z0: 128, th: 0.92 }, { z0: -92, th: 2.2 }];
  const twist = rng.range(0.30, 0.36), phi0 = (60 + rng.range(-2, 2)) * Math.PI / 180;
  for (let i = 0; i < 9; i++) {
    const ring = RING[i % 3], z0 = ring.z0 + rng.range(-10, 10), th = ring.th + rng.range(-0.06, 0.06);
    const rw = rhoAt(profiles[0], z0) + 3, phi = phi0 + i * TAU / 9;
    const zt = (SUN_R + 20) * Math.cos(th), rt = (SUN_R + 20) * Math.sin(th);
    const zc = lerp(z0, zt, 0.12) + (z0 - zt) * 0.18, rc = lerp(rw, rt, 0.62);
    const fn = (t) => {
      const u = 1 - t, z = u * u * z0 + 2 * u * t * zc + t * t * zt, r = u * u * rw + 2 * u * t * rc + t * t * rt, p = phi + twist * t * t * (3 - 2 * t);
      return new THREE.Vector3(r * Math.sin(p), -r * Math.cos(p), z);
    };
    const rad = (t) => { const r = 2.5 + 7.5 * Math.pow(1 - t, 4) + 0.9 * Math.sin(Math.PI * t) + 1.6 * Math.exp(-((t - 1) * (t - 1)) / 0.004); return [r * 1.55, r * 0.72]; };
    ribGeos.push(tubeAlong(fn, rad, 44, 10, new THREE.Vector3(0, 0, 1), true));
    await ctx.yield();
    const tip = fn(1); ribTips.push(tip);
    ribGeos.push(bead(tip.clone().multiplyScalar((SUN_R + 17.5) / (SUN_R + 20)), 3.4));
  }
  await ctx.yield();
  const ribs = new THREE.Mesh(mergeGeometries(ribGeos), mk(VERT, NACRE_FRAG, { uCh: f(0), uRibs: f(3), uMoss: f(0.12), uRidge: f(4.5), uMist: f(1), uAmp: f(0.3), uTrans: f(1.15), uGild: f(0), uFill: f(1.5), uSeat: f(new THREE.Vector4(0, 0, 0, 0)) }));
  ribs.name = 'ribs'; root.add(ribs);
  await ctx.yield();

  // ---- the mouth's rolled lip, and the cradle: one pearl spur that springs from the lower lip of the mouth, leans back
  // into the room as it climbs, bends over at the axis and runs level out through the mouth, where it parts into two
  // horns that hold the ring (the exit) against the stars
  const SEAT = new THREE.Vector3(0, 0, MOUTH_Z + 250);     // centre of the ring: on the axis, 250 m outside the lip
  const FWD = new THREE.Vector3(0, 0, 1);                  // the flight meets it straight down the axis, the sun far behind
  const SIDE = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), FWD).normalize(), UPV = new THREE.Vector3(0, 1, 0);
  const seatAt = (sx, uy, fz) => SEAT.clone().addScaledVector(SIDE, sx).addScaledVector(UPV, uy).addScaledVector(FWD, fz);
  const RING_R = 8;                                         // the brief's ring: 30 percent of the frame's height from 40 m
  const crGeos = [];
  const lipProf = []; for (let i = 0; i <= 12; i++) { const a = (i / 12) * TAU; lipProf.push([MOUTH_Z + 4 + 30 * Math.cos(a), MOUTH_R - 4 + 30 * Math.sin(a)]); }
  crGeos.push(latheZ(lipProf, 96, true));
  const bez = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };
  const bez3 = (a, b, c, d, t) => new THREE.Vector3(bez(a.x, b.x, c.x, d.x, t), bez(a.y, b.y, c.y, d.y, t), bez(a.z, b.z, c.z, d.z, t));
  const sway = rng.range(-1, 1) * 40;                       // the swan neck leans a little to one side, per seed
  const S0 = new THREE.Vector3(0, -(MOUTH_R - 30), MOUTH_Z - 6);      // on the rolled lip, at the bottom of the mouth
  const SPUR_Y = -19.2;                                     // the level run: its ridge 10.6 m under our line, the pearls on it reaching to 9 m
  const TOP = seatAt(0, SPUR_Y, -590), BASE = seatAt(0, SPUR_Y, -12);      // where the spur comes level under our line; its end, under the ring
  const S1 = S0.clone().add(new THREE.Vector3(sway * 1.6, 250, -420)), S2 = TOP.clone().add(new THREE.Vector3(sway * 0.6, -6, -250));
  const NECK = 0.62;                                        // the share of the tube's rings spent on the neck
  const spurFn = (t) => t < NECK ? bez3(S0, S1, S2, TOP, t / NECK) : TOP.clone().lerp(BASE, (t - NECK) / (1 - NECK));
  const spurRad = (t) => { const r = 8.6 + 27 * Math.pow(Math.max(0, 1 - t / NECK), 1.5) + 2.2 * Math.exp(-((t - 1) * (t - 1)) / 0.0012); return [r * (t < NECK ? 1.15 : 0.92), r]; };      // the level run is crested: narrower than it is deep
  crGeos.push(tubeAlong(spurFn, spurRad, 96, 14, new THREE.Vector3(0, 0, -1), true));
  let neckReach = Infinity;                                  // the sunward face of the swan neck, where it swings farthest back into the room (a z)
  for (let i = 0; i <= 62; i++) { const t = NECK * i / 62; neckReach = Math.min(neckReach, spurFn(t).z - spurRad(t)[0]); }
  await ctx.yield();
  for (let i = 0; i < 82; i++) {                             // 2 m pearls along the level ridge of the spur, one every 7 m
    const t = NECK + (1 - NECK) * (0.012 + 0.975 * i / 81), pnt = spurFn(t), r = spurRad(t)[1];
    crGeos.push(bead(pnt.add(new THREE.Vector3(0, r + 0.6, 0)), 1.0));
    if (i % 10 === 9) await ctx.yield();
  }
  const hornTips = [];
  for (const sg of [-1, 1]) {
    // each horn: parts from the spur 385 m before the ring (as the last straight begins), swings out 60 m and rises
    // beside our line, then closes in over the ring to a tip 50 m above its centre: the two stand either side of the whole straight
    const H0 = seatAt(sg * 4, SPUR_Y + 1, -385), H1 = seatAt(sg * 88, -44, -250), H2 = seatAt(sg * 62, 40, -14), H3 = seatAt(sg * 13, 50, 0);
    const hfn = (t) => bez3(H0, H1, H2, H3, t);
    const hrad = (t) => { const r = 8.2 * Math.pow(1 - t, 0.8) + 1.3; return [r, r * 0.85]; };
    crGeos.push(tubeAlong(hfn, hrad, 56, 12, UPV.clone(), true));
    await ctx.yield();
    hornTips.push(hfn(1));
    crGeos.push(bead(hfn(1).add(new THREE.Vector3(0, 2.0, 0)), 1.6));
    const out = UPV.clone().multiplyScalar(0.78).addScaledVector(SIDE, -sg * 0.45).addScaledVector(FWD, -0.42).normalize();
    for (let k = 0; k < 44; k++) {                           // a row of 2 m pearls along each horn, on the flank that faces us
      const t = 0.05 + k * 0.021, pnt = hfn(t), r = hrad(t)[0];
      crGeos.push(bead(pnt.addScaledVector(out, r + 0.55), 1.0));
      if (k % 15 === 14) await ctx.yield();
    }
    // a stay from each horn to the ring, so the ring is held, not floating
    const st0 = hfn(0.9), st1 = seatAt(sg * (RING_R + 2.2), 0, 0);
    crGeos.push(tubeAlong((t) => st0.clone().lerp(st1, t).addScaledVector(UPV, -3 * Math.sin(Math.PI * t)), () => [0.7, 0.7], 6, 6, UPV, false));
    await ctx.yield();
  }
  { // the ring seat: a pearl band the portal sits in, and a low claw under it
    const ring = new THREE.TorusGeometry(RING_R + 1.9, 1.5, 10, 64);
    const uv = ring.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i) * 50);
    ring.applyMatrix4(new THREE.Matrix4().makeBasis(SIDE, UPV, FWD).setPosition(SEAT));
    crGeos.push(ring);
    const c0 = seatAt(0, SPUR_Y + 4, -9), c1 = seatAt(0, -RING_R - 2.4, 0);
    crGeos.push(tubeAlong((t) => c0.clone().lerp(c1, t).addScaledVector(FWD, 3 * Math.sin(Math.PI * t)), (t) => [3.2 - 1.6 * t, 2.6 - 1.2 * t], 10, 8, SIDE, false));
  }
  await ctx.yield();
  const crParts = [];                                        // merged in batches so no one step is long (same vertices, same order)
  for (let i = 0; i < crGeos.length; i += 16) { crParts.push(mergeGeometries(crGeos.slice(i, i + 16))); await ctx.yield(); }
  const crGeo = mergeGeometries(crParts);
  await ctx.yield();
  const seatU = f(new THREE.Vector4(SEAT.x, SEAT.y, SEAT.z, 1));
  const cradle = new THREE.Mesh(crGeo, mk(VERT, NACRE_FRAG, { uCh: f(3), uRibs: f(4), uMoss: f(0.6), uRidge: f(3), uMist: f(0), uAmp: f(0.5), uTrans: f(0.5), uGild: f(0.6), uFill: f(1.7), uSeat: seatU }));
  cradle.name = 'cradle'; cradle.frustumCulled = false; root.add(cradle);
  await ctx.yield();
  // the ring's own light: a cool-white band just outside the portal and a soft halo round it
  const ringGlow = new THREE.Mesh(new THREE.RingGeometry(RING_R + 0.2, RING_R + 3.6, 72, 1), glow(RING_VERT, RING_FRAG, { uSeat: seatU, uR: f(RING_R) }));
  ringGlow.geometry.applyMatrix4(new THREE.Matrix4().makeBasis(SIDE, UPV, FWD).setPosition(SEAT));
  ringGlow.name = 'ringGlow'; ringGlow.frustumCulled = false; ringGlow.renderOrder = 6; root.add(ringGlow);
  const ringHalo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), glow(RHALO_VERT, RHALO_FRAG, { uSeat: seatU, uR: f(RING_R) }));
  ringHalo.name = 'ringHalo'; ringHalo.frustumCulled = false; ringHalo.renderOrder = 6; root.add(ringHalo);
  await ctx.yield();

  // ---- three shafts of light, one through each door
  const shafts = [], SH_END = [1003, 2204, 3800], SH_FR = [0.97, 0.74, 0.5, 0.27];
  for (let k = 0; k < 3; k++) {
    const shells = [];
    for (let j = 0; j < SH_FR.length; j++) {
      const p = []; for (let i = 0; i <= 6; i++) { const z = lerp(DOOR_Z[k] + 18, SH_END[k] - j * 6, i / 6); p.push([z, DOOR_R[k] * SH_FR[j] * z / DOOR_Z[k]]); }
      const g = latheZ(p, 48, false), uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) + j * 0.37);      // each shell carries its own streaks
      shells.push(g);
      await ctx.yield();
    }
    const m = new THREE.Mesh(mergeGeometries(shells), glow(VERT, SHAFT_FRAG, { uCh: f(k + 1), uZ0: f(DOOR_Z[k]), uZ1: f(SH_END[k]), uGain: f([0.05, 0.06, 0.06][k]), uSoft: f(k === 2 ? 1 : 0) }));
    m.name = 'shaft' + (k + 1); m.frustumCulled = false; m.renderOrder = 4; root.add(m); shafts.push(m);
    await ctx.yield();
  }
  await ctx.yield();

  // ---- the cloud cataract in each door: a neck and a trumpet bell of sliding vapour
  const bellGeos = [];
  for (let k = 0; k < 3; k++) {
    const rd = DOOR_R[k], zd = DOOR_Z[k] + DOME_THICK * 0.5, NB = 18, prof = [];
    for (let i = 0; i <= NB; i++) {
      const t = i / NB;
      const z = zd + rd * (-1.6 + 4.6 * t);
      const neck = 0.40 + 0.16 * Math.pow(Math.abs(t - 0.35) / 0.35, 1.5) * (t < 0.35 ? 1 : 0);
      const flare = t > 0.35 ? 2.3 * Math.pow((t - 0.35) / 0.65, 1.9) : 0;
      prof.push([z, rd * (neck + flare)]);
    }
    const g = latheZ(prof, 48, false);
    const n = g.attributes.position.count, fa = new Float32Array(n);
    for (let v = 0; v < n; v++) fa[v] = k * 2 + Math.floor(v / 49) / NB;
    g.setAttribute('aFace', new THREE.BufferAttribute(fa, 1));
    bellGeos.push(g);
  }
  const cloud = new THREE.Mesh(mergeGeometries(bellGeos), new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared }, vertexShader: DOME_VERT, fragmentShader: CLOUD_FRAG,
    fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
  }));
  cloud.name = 'cloudBells'; cloud.frustumCulled = false; cloud.renderOrder = 3; root.add(cloud);
  await ctx.yield();

  // ---- anchors (all local space)
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  // a point on the inner wall of chamber ch (1..4) at axial z and angle phi, lifted `lift` m toward the axis
  const wall = (ch, z, phi, lift = 0) => {
    const prof = profiles[clamp(ch - 1, 0, 3)], r = rhoAt(prof, z), dr = (rhoAt(prof, z + 2) - rhoAt(prof, z - 2)) / 4;
    const il = 1 / Math.hypot(1, dr), nr = -il, nz = dr * il, sx = Math.sin(phi), cy = -Math.cos(phi);
    return { position: V3((r + nr * lift) * sx, (r + nr * lift) * cy, z + nz * lift), up: V3(nr * sx, nr * cy, nz) };
  };
  const anchors = {
    sun: V3(0, 0, 0), sunRadius: SUN_R,
    doors: DOOR_Z.map((z, k) => ({ center: V3(0, 0, z + DOME_THICK * 0.5), radius: DOOR_R[k], z0: z - 5, z1: z + DOME_THICK + 5, facing: V3(0, 0, 1) })),
    domes: DOOR_Z.map((z, k) => ({ doorZ: z, rimZ: z - DOME_BULGE[k], outerRadius: DOME_ROUT[k], bulge: DOME_BULGE[k] })),
    chambers: [{ z0: -170, z1: 194, radius: 170 }, { z0: 120, z1: 968, radius: 360 }, { z0: 830, z1: 2115, radius: 720 }, { z0: 1950, z1: MOUTH_Z, radius: 1450 }],
    wall,                                         // wall(ch, z, phi, lift) -> { position, up }
    lake: { chamber: 2, z0: 520, z1: 780, phi0: -15 * Math.PI / 180, phi1: 38 * Math.PI / 180, terracePhi1: 62 * Math.PI / 180, radius: 345 },
    mouth: { center: V3(0, 0, MOUTH_Z), radius: MOUTH_R - 34 },
    spur: { root: S0.clone(), top: TOP.clone(), base: BASE.clone(), neckReach },
    hornTips,
    portalSeat: { position: SEAT.clone(), facing: FWD.clone().negate(), forward: FWD.clone(), radius: RING_R },
    // a safe line with at least 6 m clearance everywhere: beside the sun, onto the axis, down it, along the spur
    flyThrough: [V3(170, 6, -232), V3(142, 3, -112), V3(98, 0, 22), V3(20, 0, 165), V3(0, 0, 218), V3(0, 0, 330), V3(0, 0, 1020), V3(0, 0, 2222), V3(0, 0, 3300), SEAT.clone()],
    viewpoints: {
      entry: { position: V3(170, 6, -232), lookAt: V3(40, 0, 100) },
      firstCountry: { position: V3(0, 0, 300), lookAt: V3(0, 0, 1010) },
      lakeRamp: { position: wall(2, 560, 0.05, 22).position, lookAt: wall(2, 720, 0.6, 10).position },
      shaft2: { position: V3(40, 60, 760), lookAt: V3(0, 0, 1010) },
      cradle: { position: seatAt(0, 0, -160), lookAt: SEAT.clone() },
    },
    ribTips,
    bounds: { radius: 1480, zMin: -420, zMax: MOUTH_Z + 320 },
    parts: { chambers, domes, sun: sunGroup, ribs, cradle, shafts, cloud, ringGlow, ringHalo },
  };

  // The set-piece viewer orbits `center` at about 2.4 * radius, so these three describe a vantage
  // INSIDE the shell (the true size is anchors.bounds). opts.view (or ?view= in the viewer) picks it.
  let view = opts.view;
  if (!view) { try { view = new URLSearchParams(globalThis.location?.search || '').get('view'); } catch (e) { view = null; } }
  const VIEWS = {
    country: { c: V3(0, 0, 640), r: 100, h: 110 }, sun: { c: V3(0, 0, 0), r: 55, h: 44 },
    door: { c: V3(0, 20, 150), r: 38, h: 30 }, room3: { c: V3(0, 0, 1600), r: 235, h: 300 },
    room4: { c: V3(0, 0, 2960), r: 240, h: 420 }, mouth: { c: V3(SEAT.x, SEAT.y, 2790), r: 60, h: 60 }, lake: { c: V3(60, -318, 650), r: 11, h: 20 },
  };
  const vw = VIEWS[view] || VIEWS.country;

  let manualExpo = null;
  const _inv = new THREE.Matrix4(), _c = new THREE.Vector3();
  const expoAt = (z) => 0.6 + 0.3 * smoothstep(120, 420, z) + 0.1 * smoothstep(1000, 1500, z) + 0.15 * smoothstep(2200, 2900, z);
  return {
    object: root, radius: vw.r, height: vw.h, center: vw.c, anchors,
    ground: false, groundY: 0,
    // exposure: null = automatic from the camera's place along the axis (0.6 beside the sun to 1.15 in chamber 4)
    setExposure(e) { manualExpo = e; },
    setHaze(len) { shared.uHazeLen.value = len; },
    uniforms: shared,
    update(dt, time, camera) {
      shared.uTime.value = time;
      if (camera) {
        root.updateWorldMatrix(true, false);
        _c.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(_inv.copy(root.matrixWorld).invert());
        shared.uCam.value.copy(_c);
      }
      shared.uExpo.value = manualExpo ?? expoAt(shared.uCam.value.z);
    },
    dispose() {},
  };
}

// cloud pouring through a door: soft, lit gold inside the shaft and lilac-white outside it
const CLOUD_FRAG = LIGHT + /* glsl */`
varying float vFace;      // door index * 2 + t along the bell (0 upstream .. 1 the flared rim)
void main(){
  float k = floor(vFace * .5 + 1e-3), t = clamp(vFace - k * 2., 0., 1.);
  vec3 V = normalize(uCam - vP + vec3(1e-3, 0., 0.));
  float ndv = abs(dot(normalize(vN + vec3(0., 1e-6, 0.)), V));
  float flow = uTime * .022;
  float n1 = texture2D(uNoise, vec2(vUv.x * 3., t * 1.1 - flow)).r;
  float n2 = texture2D(uNoise, vec2(vUv.x * 7. + .3, t * 2.7 - flow * 1.7)).g;
  float n3 = texture2D(uNoise, vec2(vUv.x * 19. + .7, t * 6. - flow * 2.6)).b;
  float dens = smoothstep(.34, .78, n1 * .6 + n2 * .38 + n3 * .16 + .22 * (1. - t));
  float veil = smoothstep(.55, 1., t);                                   // the rim breaks into sinking veils
  dens *= mix(1., smoothstep(.45, .7, n2 + n3 * .4), veil);
  float a = .5 * dens * smoothstep(0., .14, t) * (1. - smoothstep(.72, 1., t)) * (.35 + .65 * ndv);
  float dc = length(uCam - vP);
  a *= smoothstep(25., 70., dc);
  // the great third bell: from inside it we look through streamers, not a wall of milk; it hangs heavier below
  float low = 1. - smoothstep(-.55, .45, vP.y / max(length(vP.xy), 1.));
  a *= mix(1., smoothstep(160., 820., dc) * (.22 + .78 * low), step(1.5, k));
  a *= 1. - .55 * step(1.5, k) * step(.34, t);      // its flare beyond the door is a thin veil, for every eye: the last room and the stars of the mouth show through it
  a *= mix(.3, 1., step(.5, k));
  a *= mix(1., smoothstep(.06, .5, ndv) * (.35 + .65 * smoothstep(60., 380., dc)), step(.5, k) * (1. - step(1.5, k)));
  a *= mix(1., smoothstep(.03, .32, ndv), step(1.5, k));      // the third bell: seen edge-on from close inside it, it thins to nothing
  float ch = k + 1.;
  float vis = sunVis(vP, ch) * step(.34, t) + (1. - step(.34, t)) * sunVis(vP, k);
  vec3 lit = keyColor(mix(k, ch, step(.34, t))) * vis * (.75 + .5 * n2) + mix(uViolet, vec3(.85, .9, 1.), .62) * .62;
  vec3 c = hazed(vec3(.93) * lit, vP) * uExpo;
  gl_FragColor = vec4(c, a);
  #include <fog_fragment>
}`;

// shared with the world (src/worlds/chambered-sun.js): the shell lighting chunk and the plain vertex shader
export { LIGHT as SHELL_LIGHT, VERT as SHELL_VERT };
