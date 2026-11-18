// THE SEA ABOVE: a field of ripe wheat under an ocean that hangs where the sky should be.
// Blue whales swim in the ceiling and their shadows cross the grain. The largest one breaches DOWN (hero:
// src/parts/the-sea-above.js): the flight leaves the track, climbs toward the dive, swings in behind the whale's
// shoulder at the bottom of its arc and flies the long climb back to the sea beside it, then climbs steadily on to a level run
// just under the water and a portal beside an upside-down lighthouse.
//
// MAP OF THIS FILE
//   SEA_FN, SEA_FOG        one light pattern for everything: a caustic net, up to four whale shadows and three soft
//                          shoal shadows projected along the sun onto every lit material (seaPatch in build), and the pool of
//                          lamplight where the lighthouse beam meets the land
//   GROUND_*               the ground's own paint: parcels, rows, the dirt track, the cut field with its swaths, the furrow,
//                          and a grainy canopy the tufts sink into when the lens is above the crop
//   CEIL_*                 the sea ceiling (a polar grid that rides with the camera): swell and breach rings from the hero, the net in
//                          three sizes (each hands over to a coarser one as it closes up with distance, so cells stay crisp down to
//                          the seam); where the lens looks UP at the water from 15 to 35 m, between the middle and the last run, a net
//                          a third the size (kM); on the run just under the water (uRun) the first net alone, long bold streaks over
//                          deep water and the one sun's glitter as a road of brighter net toward its bearing; a calmed, paler pool
//                          round the hole the breaching whale leaves (uCalm); the sun's glow, whales as blue shapes, wakes, foam rings where kelp,
//                          fish and the spout break the surface, round the lighthouse's rock a ring of broken water as wide again as the rock with the
//                          rock's shadow inside it, the seam's haze
//   small builders         barn, hull, kite and its ribbon string, anchor chain and its weed, field tree, ragged hedge, church, the
//                          lighthouse's rock of four knuckles, the lobed raft a kelp clump hangs from, the long arm of the
//                          lamp's one beam, bale, blob shadows, seam (a bank of light at eye level with far woods in it)
//   build()                1 visit (ctx.vary: hour -> mood, density, mood -> breeze and rain, rare -> a calf breaches too)
//                          2 hero and flight line (the hero's anchors place the whole second half)   3 track table, land, the
//                          built places of the home field, the breach's clock   4 light uniforms + seaPatch   5 ground
//                          6 ceiling, seam   7 flora   8 far plain   9 built things   10 fauna   10b the kelp
//                          11 between sea and field: waterspout, anchor chain, upward rain, light   12 update, the gaze
//
// THE FLIGHT, by places. The low run down the dirt track: 6 m over the wheat at the portal, never under 4 m, poppies, the fence and
// an oak beside the lens, two 28 m whales hanging belly-down through the surface in the sun's glow ahead for the whole of the
// low run (live's own crossing); a kite flies from the fence 250 m down the track; a whale's shadow runs on down the track and
// the gaze lifts to its pod; a second pair crosses side-on. The windmill stands beside the track and the red barn across it
// further on; one sail's length of route (10.5 to 12.4 m) before the lens passes the mill THE DIVE begins: the big whale (44 m,
// dark slate, the only one over 28 m) comes down through a pool of stilled water round the hole she leaves, three of her
// lengths across, watched by one pull of the gaze whose point is capped low (gazeHero) so that the land ahead stays under it;
// the fish ribbon swims along with the lens and climbs to the sea beside the dragged anchor's chain, a bait ball and wheeling
// rays hang by the hole. At the nadir cue she levels out in front of the lens, and the climb is flown alongside, under her
// flank, with the cut field, the waterspout and a church with its barn on the plain below. At the re-entry cue she goes in under
// a crown; the gaze holds the crown while it stands and slides round to the run as it falls. A vee of rays is out of the water
// ahead from that cue until the route has climbed to within 20 m of their level. From the same cue to 50 m short of the ring
// whale 3 and its companion (28 and 24 m) swim on beside the run on the open-sea side, closing on its line from 59 to 92 m
// out to 20 m and never across it: down out of the sea, belly-down through the water for the middle half, up again beside
// the ring (27 to 39 m to its open-sea side); a light pull of the gaze goes with them. The run climbs steadily, levels 7.5 m under
// the water for its last 90 m and ends at the ring, its top touching the water, beside the striped lighthouse on its islet;
// the lamp's one beam rakes a pool of light round the fields every six seconds, from a phase the lighthouse's fork deals.
// RULES OF THIS SEA. The pod and the two pairs of the first half keep live's own crossings: they hang belly-down through the
// surface for the whole of their way. Whale 3, its companion and the rays come down out of the water and end their way up
// inside it (section 10). The kelp
// is a scatter (section 10b): eight clumps dealt from a stream of their own, kept by margins in metres out of the flight line
// and the sea's other open lanes; nothing else places a clump. What runs on the world's clock (the far hull's circle, the
// beam, the kite, swell, wind, shoals) starts from a phase of its own and is there at every clock; what belongs to a place of
// the flight (the breach, every crossing, the rays, the anchored hull) is driven by metres flown.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as S from '../kit/structures.js';
import * as fx from '../kit/fx.js';
import { buildHero, SEA_GLSL } from '../parts/the-sea-above.js';

const PALETTE = ['#0a3f6a', '#1f8fb8', '#8fe0e8', '#f2d27a', '#c99a3a', '#5a3f1a', '#ff5a3a'];
const C = 120;                 // the hero's ceiling plane (its foam / ring decal lives here)
const CEIL = C + 0.3;          // the world's sea surface, just above the decal
const TRK_N = 512, TRK_Z0 = 140, TRK_Z1 = -1900;
const NSPOT = 12;

// ------------------------------------------------------------------------------------------
// shared GLSL: noise, caustic net, whale silhouette, light multiplier
// ------------------------------------------------------------------------------------------
const SEA_FN = /* glsl */`
uniform float uSeaT;
uniform vec3 uSeaSun;
uniform vec4 uSeaWh[4];      // x, z on the ceiling plane (projected along the sun), cos, sin of the heading
uniform vec3 uSeaWhK[4];     // shadow strength on the land, tint strength in the ceiling, half length
uniform vec4 uSeaBlob[3];    // soft shoal shadows: x, z on the ceiling plane, radius, strength
uniform vec4 uSeaCaus;       // net scale, gain, base, plane height
uniform vec4 uSeaWind;       // dir.x, dir.z, speed, amount of the wheat waves
uniform vec3 uSeaSeam;
uniform vec4 uSeaPool;      // the lighthouse beam where it meets the land: x, z, and the beam's heading on the ground
uniform vec3 uSeaPoolK;     // half length, half width, strength
float seaHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float seaVN(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(seaHash(i), seaHash(i + vec2(1.0, 0.0)), f.x), mix(seaHash(i + vec2(0.0, 1.0)), seaHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
// a wandering web of bright lines: three warped line families, 0..1
float seaNet(vec2 p, float t) {
  vec2 q = p + 0.75 * vec2(sin(p.y * 0.83 + t * 0.8 + 1.4 * sin(p.x * 0.31)), sin(p.x * 0.71 - t * 0.7 + 1.4 * sin(p.y * 0.37)));
  float a = abs(sin(q.x + 0.6 * sin(q.y * 0.7 + t * 0.3)));
  float b = abs(sin(q.x * 0.5 + q.y * 0.866 + 0.6 * sin(q.x * 0.6 - t * 0.25) + 1.0));
  float c = abs(sin(q.x * 0.5 - q.y * 0.866 + 0.6 * sin(q.y * 0.8 + t * 0.2) + 2.0));
  float m = 1.0 - min(a, min(b, c));
  m *= m; m *= m;
  return m * m;
}
// soft whale silhouette (body, flukes, flippers) around whale i, 0..1
float seaWhaleD(vec2 p, int i) {
  vec2 d = p - uSeaWh[i].xy; float hl = uSeaWhK[i].z;
  float al = dot(d, uSeaWh[i].zw) / hl, ac = (d.x * uSeaWh[i].w - d.y * uSeaWh[i].z) / hl;
  float body = length(vec2(al, ac / max(0.17 + 0.05 * al, 0.02)));
  float fluke = length(vec2((al + 0.97) / 0.11, ac / 0.33));
  float flip = length(vec2((al - 0.36 + 0.5 * (abs(ac) - 0.2)) / 0.1, (abs(ac) - 0.26) / 0.15));
  return min(body, min(fluke, flip));
}
float seaWhale(vec2 p, int i) { return (1.0 - smoothstep(0.62, 1.3, seaWhaleD(p, i))); }
// multiplier for direct light at world point w
float seaLight(vec3 w, float wave) {
  vec2 pc = w.xz + uSeaSun.xz * ((uSeaCaus.w - w.y) / uSeaSun.y);
  float fd = 1.0 / (1.0 + distance(w, cameraPosition) * 0.006);
  float c = mix(0.16, seaNet(pc * uSeaCaus.x, uSeaT * 0.55) * (0.35 + 1.3 * seaVN(pc * 0.045 + uSeaT * 0.03)), fd);
  float big = 0.5 + 0.5 * sin(pc.x * 0.021 + uSeaT * 0.21 + 2.0 * sin(pc.y * 0.017 - uSeaT * 0.13));
  float cl = seaVN(pc * 0.0125 + vec2(uSeaT * 0.045, -uSeaT * 0.03));              // slow cloud-like pools of brighter water
  float l = (uSeaCaus.z + uSeaCaus.y * c) * (0.72 + 0.46 * big) * (0.8 + 0.36 * smoothstep(0.25, 0.8, cl));
  if (wave > 0.5) {
    float ph = dot(w.xz, uSeaWind.xy) * 0.11 - uSeaT * uSeaWind.z + 5.0 * seaVN(w.xz * 0.016 + uSeaT * 0.02);
    l *= 1.0 + uSeaWind.w * (smoothstep(0.1, 0.95, sin(ph)) - 0.35);
  }
  return l;
}
// the pool of lamplight the hanging lighthouse rakes over the fields
float seaPool(vec3 w) {
  vec2 d = w.xz - uSeaPool.xy; float al = dot(d, uSeaPool.zw), ac = d.x * uSeaPool.w - d.y * uSeaPool.z;
  return uSeaPoolK.z * exp(-(al * al) / (uSeaPoolK.x * uSeaPoolK.x) - (ac * ac) / (uSeaPoolK.y * uSeaPoolK.y));
}
// 1 in the open, down to ~0.1 inside a whale's shadow; shoals throw softer, rounder shade
float seaShade(vec3 w) {
  vec2 pc = w.xz + uSeaSun.xz * ((uSeaCaus.w - w.y) / uSeaSun.y);
  float s = 1.0;
  for (int i = 0; i < 4; i++) s *= 1.0 - (1.0 - smoothstep(0.8, 1.16, seaWhaleD(pc, i))) * uSeaWhK[i].x;
  for (int i = 0; i < 3; i++) s *= 1.0 - uSeaBlob[i].w * (1.0 - smoothstep(0.3, 1.0, length(pc - uSeaBlob[i].xy) / max(uSeaBlob[i].z, 1.0) + 0.3 * (seaVN(pc * 0.11 + float(i) * 9.0) - 0.5)));
  return s;
}`;
const SEA_FOG = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float seaF = max(1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth), smoothstep(2200.0, 3100.0, vFogDepth));
  #else
    float seaF = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  gl_FragColor.rgb = mix(gl_FragColor.rgb, mix(fogColor, uSeaSeam, smoothstep(0.7, 1.0, seaF)), seaF);
#endif`;
// ground only: wheat rows, tramlines, the dirt track, the cut field and the anchor's furrow painted over the vertex colour
const GROUND_PARS = /* glsl */`
uniform sampler2D uTrk; uniform vec2 uTrkZ; uniform vec3 uDirt; uniform vec2 uGndRow;
uniform vec4 uGndHero;       // world -> hero-local XZ: origin x, z, cos, sin
uniform vec4 uCut;           // the cut field in hero-local XZ: centre x, z, half sizes
uniform vec4 uFur;           // the anchor's furrow: from x, z to x, z`;
const GROUND_COLOR = /* glsl */`
{
  vec2 gp = vSeaW.xz; float gd = distance(vSeaW, cameraPosition);
  float tz = clamp((uTrkZ.x - gp.y) / (uTrkZ.x - uTrkZ.y), 0.0, 1.0) * ${(TRK_N - 1).toFixed(1)};
  int ti = int(floor(tz));
  vec2 tk = mix(texelFetch(uTrk, ivec2(ti, 0), 0).rg, texelFetch(uTrk, ivec2(min(ti + 1, ${TRK_N - 1}), 0), 0).rg, tz - float(ti));
  // farmland beyond the home field: parcels with their own tone, row direction and a hedge line between them
  float pk = smoothstep(60.0, 150.0, abs(gp.x - tk.x));
  vec2 pp = gp / 190.0 + 0.24 * vec2(sin(gp.y / 230.0 + 1.0), sin(gp.x / 205.0));
  vec2 pid = floor(pp), pf = fract(pp);
  float ph = seaHash(pid + 3.7), pa = fract(ph * 13.7) * 3.1416;
  vec3 tone = ph < 0.42 ? vec3(1.0) : ph < 0.62 ? vec3(1.18, 1.16, 1.25) : ph < 0.84 ? vec3(0.84, 0.72, 0.58) : vec3(0.66, 0.9, 0.5);
  // the cut field under the climb: pale stubble combed into swaths
  vec2 hd = gp - uGndHero.xy, hl = vec2(hd.x * uGndHero.z - hd.y * uGndHero.w, hd.x * uGndHero.w + hd.y * uGndHero.z);
  vec2 cq = (hl - uCut.xy) / uCut.zw; cq += 0.05 * (vec2(seaVN(hl * 0.02), seaVN(hl * 0.02 + 7.0)) - 0.5);
  float cut = (1.0 - smoothstep(0.95, 1.0, max(abs(cq.x), abs(cq.y))));
  diffuseColor.rgb *= mix(vec3(1.0), tone, pk * (1.0 - cut));
  float pe = min(min(pf.x, 1.0 - pf.x), min(pf.y, 1.0 - pf.y)) * 190.0;
  diffuseColor.rgb *= 1.0 - 0.5 * pk * (1.0 - cut) * (1.0 - smoothstep(1.2, 3.0, pe)) / (1.0 + gd * 0.0012);
  vec2 rd = pk > 0.5 ? vec2(cos(pa), sin(pa)) : uGndRow;
  float ac = dot(gp, vec2(-rd.y, rd.x)), al = dot(gp, rd);
  float fk = 1.0 / (1.0 + gd * 0.012);
  float fine = mix(seaVN(vec2(ac * 0.5, al * 0.035) + 9.0), seaVN(vec2(ac * 2.3, al * 0.12)), fk);
  diffuseColor.rgb *= 0.84 + 0.32 * fine;
  float tl = abs(fract(ac / 21.0) - 0.5) * 21.0;
  diffuseColor.rgb *= 1.0 - 0.34 * (1.0 - cut) * (1.0 - smoothstep(0.18, 0.5, abs(tl - 0.9))) / (1.0 + gd * 0.005);
  diffuseColor.rgb *= mix(vec3(0.5, 0.46, 0.4), vec3(1.0), smoothstep(8.0, 62.0, gd));
  // close to the lens the ground between the tufts is a mat of straw, stalk feet and their shadows, not a smooth sheet
  float stb = 0.55 * seaVN(vec2(ac * 6.5, al * 1.1)) + 0.45 * seaVN(gp * 9.0 + 4.0);
  float stm = seaVN(vec2(ac * 1.7, al * 0.4) + 21.0);
  diffuseColor.rgb *= mix(1.0, 0.5 + 0.95 * stb, (1.0 - smoothstep(5.0, 26.0, gd))) * mix(1.0, 0.72 + 0.56 * stm, (1.0 - smoothstep(12.0, 70.0, gd)));
  // seen from above, the standing crop is a combed, grainy canopy that the tufts sink into
  float canUp = smoothstep(9.0, 22.0, cameraPosition.y - vSeaW.y);
  float can = 0.6 * seaVN(vec2(ac * 1.9, al * 0.7) + 5.0) + 0.4 * seaVN(gp * 3.1);
  diffuseColor.rgb *= mix(1.0, 0.5 + 0.7 * can, canUp * (1.0 - smoothstep(30.0, 140.0, gd)) * (1.0 - cut));
  // from the air the fields are combed: drill rows in bands, and paler lodged patches where the wind has laid the grain
  float air = smoothstep(40.0, 110.0, gd) * (1.0 - smoothstep(320.0, 900.0, gd));
  diffuseColor.rgb *= 1.0 + air * (1.0 - cut) * (0.14 * sin(ac * 0.83 + 1.5 * seaVN(vec2(ac * 0.02, al * 0.011))) + 0.3 * (seaVN(gp * 0.021 + ph * 40.0) - 0.5) + 0.12 * (seaVN(gp * 0.085 + 7.0) - 0.5));
  {
    float sw = sin(hl.y * 0.7 + 1.3 * seaVN(hl * vec2(0.012, 0.05))), sf = 1.0 / (1.0 + gd * 0.0035);
    float row = smoothstep(0.45, 0.92, sw), shd = (1.0 - smoothstep(0.05, 0.4, abs(sw - 0.18)));
    vec3 stub = diffuseColor.rgb * vec3(1.13, 1.1, 0.97) * (0.9 + 0.2 * seaVN(hl * 0.03 + 3.0));
    stub *= 1.0 + sf * (0.34 * row * (0.6 + 0.8 * seaVN(vec2(hl.x * 0.6, hl.y * 2.5))) - 0.26 * shd);
    diffuseColor.rgb = mix(diffuseColor.rgb, stub, cut);
  }
  // the track: two wheel lines of packed earth and a pale grassy crown between them
  float dT = abs(gp.x - tk.x) * tk.y + (seaVN(gp * 0.33) - 0.5) * 0.3;
  float trk = (1.0 - smoothstep(1.45, 2.05, dT));
  float rut = (1.0 - smoothstep(0.1, 0.36, abs(dT - 0.86)));
  vec3 dirt = uDirt * (0.84 + 0.4 * seaVN(gp * 2.3)) * (1.0 - 0.3 * rut);
  dirt = mix(dirt, diffuseColor.rgb * 0.86, (1.0 - smoothstep(0.15, 0.55, dT)) * 0.6);
  diffuseColor.rgb = mix(diffuseColor.rgb, dirt, trk * (0.62 + 0.38 / (1.0 + gd * 0.012)));
  // poppies in drifts along the verge: beyond the reach of the real flowers they are flecks of red in the crop, so from the air the
  // road keeps its red edge all the way on
  float pv = (1.0 - smoothstep(5.0, 16.0, dT)) * smoothstep(2.0, 3.4, dT) * smoothstep(40.0, 95.0, gd) * (1.0 - cut);
  if (pv > 0.01) {
    float pd = 0.25 + 0.75 * max(0.0, sin(gp.x * 0.13 + sin(gp.y * 0.05) * 2.0));
    float pf = mix(seaVN(gp * 2.6 + 11.0), seaVN(gp * 0.8 + 5.0), smoothstep(70.0, 190.0, gd)) * (0.55 + 0.45 * seaVN(gp * 0.33 + 2.0));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.8, 0.13, 0.05), pv * pd * smoothstep(0.3, 0.52, pf) * 0.85);
  }
  // the furrow the dragged anchor leaves
  vec2 fa = gp - uFur.xy, fb = uFur.zw - uFur.xy;
  float fh = clamp(dot(fa, fb) / max(dot(fb, fb), 1e-3), 0.0, 1.0), fdist = length(fa - fb * fh) + 0.5 * (seaVN(gp * 0.8) - 0.5);
  diffuseColor.rgb = mix(diffuseColor.rgb, uDirt * 0.42, (1.0 - smoothstep(0.5, 1.5, fdist)) * 0.85);
  diffuseColor.rgb *= 1.0 + 0.3 * smoothstep(1.4, 2.0, fdist) * (1.0 - smoothstep(2.0, 3.2, fdist));
}`;

// ------------------------------------------------------------------------------------------
// the sea ceiling: a polar grid that rides with whichever camera draws it
// ------------------------------------------------------------------------------------------
const CEIL_COMMON = /* glsl */`
${SEA_GLSL}
uniform vec4 uHero;          // world -> hero-local XZ: origin x, z, cos, sin
uniform float uCeilY;
varying vec3 vW; varying vec3 vG;
vec2 toLocal(vec2 w) { vec2 d = w - uHero.xy; return vec2(d.x * uHero.z - d.y * uHero.w, d.x * uHero.w + d.y * uHero.z); }`;
const CEIL_VERT = /* glsl */`
${CEIL_COMMON}
void main() {
  vec2 wxz = cameraPosition.xz + position.xz, lp = toLocal(wxz); float e = 1.2;
  float h0 = seaH(lp);
  vec2 gl = vec2(seaH(lp + vec2(e, 0.0)) - h0, seaH(lp + vec2(0.0, e)) - h0) / e;
  vG = vec3(gl.x * uHero.z + gl.y * uHero.w, h0, -gl.x * uHero.w + gl.y * uHero.z);   // world-space slope and height
  vW = vec3(wxz.x, uCeilY + h0, wxz.y);
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
}`;
const CEIL_FRAG = /* glsl */`
${CEIL_COMMON}
${SEA_FN}
uniform vec3 uSunCol, uDeep, uAqua, uRefl, uHaze, uPortalCol, uWhaleCol, uPortal, uCausCol, uPortalC, uSunT, uGlow;
uniform vec2 uPortalDir;
uniform vec4 uBoat[3];
uniform vec4 uSpot[${NSPOT}];  // x, z, radius, kind (0 = kelp holdfast, 1 = foam ring where fish or the spout pass; spot 10 is the spout's head, spot 11 the lighthouse's rock)
uniform vec3 uRock[4];       // the rock's four knuckles at the waterline: x, z, radius
uniform float uFogD, uNear, uNearDark, uBodyTint, uRun;
uniform vec4 uCalm; uniform float uCalmBody, uSpoutFoam;   // uRun: 1 on the run just under the water. uCalm: x, z, radius, amount of the stilled pool round the hole the breaching whale leaves in the sea (a place of the world: the ceiling point of her exit)
void main() {
  vec2 g = vG.xz; float h0 = vG.y;
  float dist = distance(vW, cameraPosition);
  float rf = 1.0 / (1.0 + dist * 0.006);
  vec2 w = vW.xz * 0.33;
  g += rf * 0.13 * vec2(sin(w.x * 1.3 + uTime * 1.1 + 1.7 * sin(w.y * 0.9 - uTime * 0.3)), cos(w.y * 1.1 - uTime * 0.9 + 1.7 * sin(w.x * 1.2)));
  vec3 nS = normalize(vec3(-g.x, 1.0, -g.y));                                       // the swell alone: what the mirror follows
  float rn = seaVN(vW.xz * 0.8 + uTime * 0.35);
  float rn2 = seaVN(vW.xz * 0.8 + vec2(37.2, 11.7) - uTime * 0.31);
  g += rf * 0.2 * (vec2(rn, rn2) - 0.5);
  vec3 nUp = normalize(vec3(-g.x, 1.0, -g.y));
  vec3 V = normalize(cameraPosition - vW);
  vec3 nF = V.y < 0.0 ? -nUp : nUp;
  float ndv = max(dot(nF, V), 0.0);
  float graze = smoothstep(0.0, 0.3, ndv);
  float ca2 = smoothstep(0.3, 0.95, seaVN(vW.xz * 0.045 + uTime * 0.03));
  // THE NET, in three sizes. fp is how many metres of water one line of a 450-line frame covers along the view: each net is
  // drawn while its cells are still a few lines tall and hands over to the next, three times coarser, as it closes up, so the
  // water carries crisp cells from overhead down to a finger's width above the seam and never smears into a pale veil.
  float ev = max(abs(V.y), 0.012), fp = dist * 0.0024 / ev;
  float k0 = 1.0 - smoothstep(mix(0.45, 1.0, uNear), mix(1.6, 4.5, uNear), fp * 0.27), k1 = 1.0 - smoothstep(0.45, 1.6, fp * 0.085), k2 = 1.0 - smoothstep(0.45, 1.6, fp * 0.027);
  float n1w = (1.0 - k0) * k1 * (1.0 - uNear), n2w = (1.0 - k1) * k2 * (1.0 - uNear), net = 0.14 * (1.0 - k0) * uNear;   // (seen from just under the water the coarse nets would be bolts of lightning: there the first net runs on alone and closes up into a shimmer)
  // Between the middle and the last run the lens is 15 to 35 m under the water and looks UP at it: the 12 m cells would be veins a
  // fifth of the frame across. There a net a third the size takes over by the same rule (kM: cells stay a few dozen lines tall,
  // as they are from the fields), and on the run itself (uRun), where the view is grazing, the big cells come back as long streaks.
  float kM = (1.0 - smoothstep(0.12, 0.24, fp)) * (1.0 - uRun);
  if (k0 > 0.002) {
    float n0 = seaNet(vW.xz * 0.27 + g * 1.2, uTime * 0.5);
    if (kM > 0.002) n0 = mix(n0, seaNet(vW.xz * 0.74 + g * 2.0 + 2.3, uTime * 0.62), kM);
    net += k0 * n0;
  }
  if (n1w > 0.002) net += n1w * seaNet(vW.xz * 0.085 + g * 0.5 + 3.7, uTime * 0.42);
  if (n2w > 0.002) net += n2w * seaNet(vW.xz * 0.027 + 9.1, uTime * 0.36);
  // close under the water fine glints join the net, and the swell itself carries form
  float nearK = uNear * (1.0 - smoothstep(22.0, 85.0, dist)) * (0.35 + 0.65 * graze), nearW = uNear * (1.0 - smoothstep(40.0, 420.0, dist));
  net = pow(max(net, 0.0), 1.0 + 0.9 * uNear * (1.0 - smoothstep(25.0, 150.0, dist)) * (1.0 - 0.7 * kM)) * (0.45 + 1.1 * ca2);   // (close to, its lines are drawn finer: at full width they would be smoke)
  float netB = seaNet(vW.xz * 0.95 + g * 2.6, uTime * 0.85) * (0.35 + 0.65 * rn) * uNear * smoothstep(8.0, 30.0, dist) * (1.0 - smoothstep(70.0, 220.0, dist));
  float ca = min((net + 0.3 * netB) * (0.55 + 0.45 * graze), 1.05);                 // grazing views: the net thins instead of smearing into glare
  float calmM = uCalm.w * (1.0 - smoothstep(0.3, 1.0, distance(vW.xz, uCalm.xy) / max(uCalm.z, 1.0)));
  ca *= 1.0 - calmM;                                                                // the net is stilled round the hole the hero leaves, so she comes out through quiet water
  float w1 = sin(dot(vW.xz, vec2(0.83, 0.55)) * 1.7 + 3.2 * rn + uTime * 1.5);
  float w2 = sin(dot(vW.xz, vec2(-0.48, 0.88)) * 2.4 + 3.2 * rn2 - uTime * 1.8);
  float w3 = sin(dot(vW.xz, vec2(0.2, -0.98)) * 0.8 + 5.0 * ca2 + uTime * 0.7);
  float glass = 0.6 * w1 * w2 + 0.4 * w3;
  // looking up into sunlit water; the sun is a dancing disc inside a tight glow (uSunT: the sun's direction inside the water)
  vec3 R = refract(-V, nF, 0.75);
  float sg = max(dot(R, uSunT), 0.0);
  vec3 body = mix(uAqua, uDeep, smoothstep(0.12, 0.92, 1.0 - ndv) * mix(0.72, 0.4, nearW));   // turquoise overhead, deeper toward the horizon
  vec3 trans = mix(uDeep, body, clamp(0.3 + 0.35 * ca2 + 0.14 * clamp(h0, -1.5, 1.5) + 0.6 * (1.0 - 0.75 * uNear) * pow(sg, 6.0), 0.0, 1.0));   // (the bulge over a breach is deep: clamped, or it paints navy blobs)
  float facet = clamp(dot(g, uSeaSun.xz) * 2.5, -1.0, 1.0);                         // wave faces toward / away from the sun
  trans *= 0.92 + 0.3 * facet;
  trans *= mix(1.0, 0.74 + 0.4 * smoothstep(-0.9, 0.9, h0) + 0.16 * facet, nearW);   // close: darker troughs, glassy crests
  trans *= mix(1.0, uNearDark, nearW);
  trans *= 1.0 + uCalmBody * calmM;                                                 // (and during the dive the calmed water is a shade paler than the sea round it)
  trans += uCausCol * ca * (0.42 + 0.58 * rf);                                      // the bright net
  trans += uSunCol * (pow(sg, 300.0) * (1.0 - 0.6 * uNear) + (pow(sg, 48.0) * 0.2 + pow(sg, 10.0) * 0.012) * (1.0 - 0.8 * uNear)) * (0.5 + 1.3 * ca);   // (from close under the water the wide glow would be a smear at the frame's edge)
  {   // one sun: on the last run its own glitter lies on the water as a road of brighter net toward the sun's bearing
    vec2 hv = vW.xz - cameraPosition.xz; hv /= max(length(hv), 1e-3);
    float road = pow(max(dot(hv, normalize(uSeaSun.xz)), 0.0), 24.0) * smoothstep(0.015, 0.16, ev);
    trans += uSunCol * uRun * road * 0.3 * ca;
  }
  trans *= mix(1.0, 0.84 + 0.28 * smoothstep(-0.7, 0.8, glass), nearK);
  trans += uSunCol * 0.09 * nearK * pow(max(w1 * w2, 0.0), 3.0) * (0.3 + 0.7 * rn2);   // fine dancing glints overhead
  trans = mix(trans, uWhaleCol * (0.7 + 0.6 * ca), uBodyTint * (0.7 + 0.3 * ca2) * (1.0 - 0.6 * nearW));  // the blue of deep water under everything
  for (int i = 0; i < 4; i++) trans = mix(trans, uWhaleCol * (0.7 + 0.6 * ca), seaWhale(vW.xz, i) * uSeaWhK[i].y * (0.7 + 0.3 * ca2));   // a body under water, not a cut-out
  // the underside mirrors what lies below it: the wheat where the mirror looks down, the seam where it looks out
  // (close under the water the mirror follows the swell, not every ripple: calm gold bands toward the horizon, clear glass overhead)
  vec3 nM = normalize(mix(nF, V.y < 0.0 ? -nS : nS, uNear));
  float FrM = 0.02 + 0.98 * pow(max(1.0 - max(dot(nM, V), 0.0), 0.0), 5.0);
  vec3 Rm = reflect(-V, nM);
  vec3 mirror = mix(mix(uSeaSeam * 0.86, mix(uRefl, uSeaSeam, 0.22), uNear), uRefl * (0.82 + 0.36 * ca2), smoothstep(0.0, mix(0.14, 0.05, uNear), abs(Rm.y)));
  mirror = mix(mirror, uAqua, 0.4 * nearW);                                         // seen from just under it the water stays water
  vec3 col = mix(trans, mirror, FrM * mix(0.2, 0.24, nearW));
  float foam = 0.0;
  for (int i = 0; i < 3; i++) {
    vec2 d = vW.xz - uBoat[i].xy; float al = dot(d, uBoat[i].zw), ac = d.x * uBoat[i].w - d.y * uBoat[i].z;
    float ring = (1.0 - smoothstep(1.2, 1.75, length(vec2(al / 7.8, ac / 2.6))));
    float wake = step(al, 0.0) * exp(al * 0.085) * (1.0 - smoothstep(0.3, 1.7, abs(abs(ac) + al * 0.3)));
    foam = max(foam, ring * 0.42 + wake * 0.5);                                     // a short wake: a long one is a ruled streak across the frame
  }
  float fn = seaVN(vW.xz * 1.3 + uTime * 0.4);
  for (int i = 0; i < ${NSPOT}; i++) {
    float sd = length(vW.xz - uSpot[i].xy) / max(uSpot[i].z, 0.5) + 0.35 * (seaVN(vW.xz * 0.4 + float(i) * 7.0) - 0.5);
    if (uSpot[i].w < 0.5) {                                                         // where kelp hangs: a dark mat of holdfasts, and a ring of foam where its stipes break the surface
      col = mix(col, uDeep * vec3(0.3, 0.52, 0.42), 0.8 * (1.0 - smoothstep(0.25, 1.0, sd)));
      foam = max(foam, mix(0.55, 0.95, uRun) * (1.0 - smoothstep(1.0, mix(1.25, 1.5, uRun), sd)) * smoothstep(0.8, 1.0, sd) * (0.55 + 0.45 * sin(sd * 14.0 - uTime * 1.8)));
    }
    else if (i == 10) foam = max(foam, 0.32 * uSpoutFoam * (1.0 - smoothstep(0.05, 1.0, sd)));   // the spout's head: a soft boil that fades outward (a ring here is a flat lid on the column)
    else if (i == 11) {                                                             // the lighthouse's rock: the sea breaks round it
      if (sd < 3.4) {
        float dR = 1.0e3; for (int k = 0; k < 4; k++) dR = min(dR, length(vW.xz - uRock[k].xy) - uRock[k].z);   // metres out from the rock's own outline (its knuckles), so the ring is as uneven as the rock
        float q = dR / max(uSpot[i].z, 0.5) + 0.34 * (seaVN(vW.xz * 0.11 + 3.0) - 0.5) + 0.14 * (seaVN(vW.xz * 0.45 + 9.0) - 0.5);   // 0 at the rock, 1 one rock's radius out: the ring is as wide again as the rock, its edges ragged
        col = mix(col, uDeep * vec3(0.4, 0.55, 0.6), 0.62 * (1.0 - smoothstep(0.1, 0.85, q)));   // the darker water of the rock's shadow, inside the ring
        float brk = seaVN(vW.xz * 0.7 + vec2(uTime * 0.45, -uTime * 0.3)) * (0.55 + 0.45 * seaVN(vW.xz * 2.1 - uTime * 0.5));   // broken water: torn patches that drift, not a band
        foam = max(foam, smoothstep(0.0, 0.3, q) * (1.0 - smoothstep(0.7, 1.05, q)) * (0.25 + 0.75 * smoothstep(0.2, 0.46, brk)) * (0.7 + 0.3 * sin(q * 12.0 - uTime * 2.0)));
      }
    }
    else foam = max(foam, (1.0 - smoothstep(0.75, 1.0, sd)) * smoothstep(0.3, 0.7, sd) * (0.6 + 0.4 * sin(sd * 9.0 - uTime * 2.2)));
  }
  col = mix(col, vec3(1.02, 1.05, 1.06), clamp(foam * (0.4 + 0.9 * fn), 0.0, 1.0));
  // the portal's ring mirrored in the underside: the reflected ray is carried to the portal's plane, so the image stands on the
  // ring itself: a dim, stretched, broken glimmer that wobbles with the swell. A faint spill of its light is drawn out toward the lens.
  {
    vec3 pN = vec3(uPortalDir.x, 0.0, uPortalDir.y);
    // (a calm mirror: a third of the swell's slope, so the image stays one broken ring that sways and breathes with the swell;
    // the full slope throws second and third rings high overhead, which read as halos adrift, not as a reflection)
    vec3 nC = normalize(vec3(-vG.x * 0.3, 1.0, -vG.z * 0.3)); if (V.y < 0.0) nC = -nC;
    vec3 Rc = reflect(-V, nC);
    float den = dot(Rc, pN); den = (den < 0.0 ? -1.0 : 1.0) * max(abs(den), 1e-3);
    float tt = dot(uPortalC - vW, pN) / den;
    vec3 hp = vW + Rc * tt - uPortalC; hp.y *= 0.62;                               // drawn out upward, as lights are in moving water
    float rr = length(hp);
    float ring = 0.42 * (1.0 - smoothstep(0.2, 1.7, abs(rr - 7.0))) + 0.07 * (1.0 - smoothstep(4.5, 7.0, rr));
    col += uPortalCol * step(0.0, tt) * (1.0 - smoothstep(200.0, 420.0, tt)) * ring * uPortal.z * (0.18 + 1.5 * fn * rn) * (0.55 + 0.45 * sin(vW.x * 0.9 + vW.z * 0.7 + uTime * 2.3 + 4.0 * rn2));   // far dimmer than the ring, torn by the ripple
    vec2 pd = vW.xz - uPortal.xy; float pal = dot(pd, uPortalDir), pac = pd.x * uPortalDir.y - pd.y * uPortalDir.x;
    col += uPortalCol * exp(-pac * pac / 150.0 - pal * pal / (pal > 0.0 ? 1100.0 : 120.0)) * 0.22 * (0.4 + 1.1 * ca + 0.5 * fn);
  }
  float fdn = uFogD * 0.62;
  col = mix(col, uHaze, 1.0 - exp(-fdn * fdn * dist * dist));                       // distance deepens the water
  // the seam's light climbs into the water as a graded haze, lumpy where the far swell rolls through it, white only on the horizon
  float lump = seaVN(vW.xz * 0.0031 + vec2(uTime * 0.008, 0.0)) + 0.5 * seaVN(vW.xz * 0.011 + 4.0);
  // (on the last run, a few metres under the water, the haze is held low and begins beyond the things that hang from the sea: the
  // water stays turquoise right down to the rafts, the islet and the upper half of the ring, and only the far horizon is white)
  float eh = ev * (0.6 + 0.5 * lump), farK = mix(smoothstep(25.0, 160.0, dist), smoothstep(90.0, 520.0, dist), uRun);
  col = mix(col, uGlow, mix(0.85, 0.7, uRun) * farK * exp(-max(eh - 0.016, 0.0) / mix(0.045, 0.011, uRun)));
  col = mix(col, uSeaSeam, max(farK * exp(-max(eh - 0.012, 0.0) / mix(0.016, 0.006, uRun)), smoothstep(2500.0, 3550.0, dist)));
  gl_FragColor = vec4(col, 1.0);
}`;

function ceilingGeometry(rings = 104, segs = 120, radius = 3700) {
  const pos = new Float32Array((rings * segs + 1) * 3), idx = [];
  for (let k = 1; k <= rings; k++) {
    const r = radius * Math.pow(k / rings, 3.1);
    for (let j = 0; j < segs; j++) { const a = (j / segs) * Math.PI * 2, o = (1 + (k - 1) * segs + j) * 3; pos[o] = Math.cos(a) * r; pos[o + 2] = Math.sin(a) * r; }
  }
  for (let j = 0; j < segs; j++) idx.push(0, 1 + j, 1 + ((j + 1) % segs));
  for (let k = 1; k < rings; k++) for (let j = 0; j < segs; j++) {
    const a = 1 + (k - 1) * segs + j, b = 1 + (k - 1) * segs + ((j + 1) % segs), c = a + segs, d = b + segs;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}

// ------------------------------------------------------------------------------------------
// small hand-built pieces
// ------------------------------------------------------------------------------------------
const linCol = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
function tinted(geo, rgb, fn) {
  const g = geo.index ? geo.toNonIndexed() : geo; g.deleteAttribute('uv');
  const n = g.attributes.position.count, col = new Float32Array(n * 3), nor = g.attributes.normal, p = g.attributes.position;
  for (let i = 0; i < n; i++) { const c = fn ? fn(p.getX(i), p.getY(i), p.getZ(i), nor.getY(i)) || rgb : rgb; col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
function barnGeometry(rng) {
  const W = 5.6, H1 = 4.6, H2 = 7.6, H3 = 9.6, L = 17;
  const red = linCol('#a23226', rng.range(0.85, 1.05)), redD = [red[0] * 0.72, red[1] * 0.72, red[2] * 0.72], roof = linCol('#4c4640'), white = linCol('#e9e2d2', 0.9), dark = linCol('#2a1d16');
  const sh = new THREE.Shape([[-W, 0], [W, 0], [W, H1], [W * 0.6, H2], [0, H3], [-W * 0.6, H2], [-W, H1]].map((p) => new THREE.Vector2(p[0], p[1])));
  const parts = [];
  const body = new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false }).translate(0, 0, -L / 2);
  parts.push(tinted(body, red, (x, y, z, ny) => (ny > 0.25 ? roof : y < 0.7 ? redD : null)));
  const box = (sx, sy, sz, x, y, z, col, rz = 0) => { const g = new THREE.BoxGeometry(sx, sy, sz); if (rz) g.rotateZ(rz); parts.push(tinted(g.translate(x, y, z), col)); };
  // roof slabs with an overhang (gambrel: two pitches a side)
  for (const s of [-1, 1]) {
    const a1 = Math.atan2(H2 - H1, W * 0.4), l1 = Math.hypot(W * 0.4, H2 - H1) + 0.7;
    box(l1, 0.22, L + 1.6, s * (W * 0.8 + 0.22), (H1 + H2) / 2 + 0.02, 0, roof, -s * a1);
    const a2 = Math.atan2(H3 - H2, W * 0.6), l2 = Math.hypot(W * 0.6, H3 - H2) + 0.25;
    box(l2, 0.22, L + 1.6, s * W * 0.3, (H2 + H3) / 2 + 0.14, 0, roof, -s * a2);
    for (const e of [-1, 1]) box(0.34, H1, 0.34, s * W, H1 / 2, e * L / 2, white);              // corner boards
  }
  for (const e of [-1, 1]) {                                                                    // both gable ends: big door with an X, hay door, trim
    const z = e * (L / 2 + 0.06);
    box(4.4, 3.9, 0.1, 0, 1.95, z, redD);
    for (const s of [-1, 1]) { box(0.3, 3.9, 0.16, s * 2.2, 1.95, z, white); box(0.24, 5.6, 0.16, s * 1.1, 1.95, z, white, s * 0.5); }
    box(4.7, 0.3, 0.16, 0, 3.95, z, white); box(0.24, 3.9, 0.16, 0, 1.95, z, white);
    box(1.7, 1.7, 0.12, 0, 6.3, z, dark); box(2.1, 0.22, 0.16, 0, 7.25, z, white); box(2.1, 0.22, 0.16, 0, 5.35, z, white);
  }
  // silo
  const silo = new THREE.LatheGeometry([[0.01, 13.2], [1.2, 12.9], [2.5, 11.4], [2.6, 11.2], [2.6, 0]].map((p) => new THREE.Vector2(p[0], p[1])), 14);
  parts.push(tinted(silo.translate(W + 3.6, 0, -L * 0.22), linCol('#b9b4a6'), (x, y) => (y > 11.2 ? linCol('#7d8a90') : Math.abs((y % 2.2) - 1.1) < 0.09 ? linCol('#8a8478') : null)));
  return mergeGeometries(parts);
}
// a hull seen from below: stem to stern along +Z, waterline at y = 0, keel fin and rudder
function hullGeometry() {
  const pos = [], idx = [], NL = 18, NA = 8, L = 7.4, B = 2.3, D = 1.5;
  for (let i = 0; i <= NL; i++) {
    const t = (i / NL) * 2 - 1, f = t > 0 ? Math.pow(1 - Math.pow(t, 2.2), 0.75) : Math.pow(1 - Math.pow(-t, 3.4), 0.6);
    const b = B * f, d = D * Math.pow(f, 0.6) * (1 - 0.25 * Math.max(t, 0));
    for (let j = 0; j <= NA; j++) { const a = (j / NA) * Math.PI, sx = Math.cos(a), sy = Math.sin(a); pos.push(b * Math.sign(sx) * Math.pow(Math.abs(sx), 0.75), 0.35 - (d + 0.35) * Math.pow(sy, 0.8), t * L); }
  }
  for (let i = 0; i < NL; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const keel = new THREE.BoxGeometry(0.16, 1.9, 3.4).translate(0, -D - 0.7, 0.3), rud = new THREE.BoxGeometry(0.1, 1.5, 0.8).translate(0, -D * 0.6 - 0.3, -L * 0.82);
  const dark = linCol('#16242e');
  return mergeGeometries([tinted(g, dark, (x, y) => (y > -0.25 ? linCol('#a8412f', 0.8) : null)), tinted(keel, linCol('#0f1a22')), tinted(rud, dark)]);
}
const KITE_VERT = /* glsl */`
attribute float aT; uniform float uTime; varying float vT; varying float vShade;
#include <fog_pars_vertex>
void main() {
  vec3 p = position; vT = aT;
  p.x += sin(aT * 8.0 - uTime * 5.0) * 0.55 * aT; p.z += cos(aT * 6.0 - uTime * 4.1) * 0.5 * aT + aT * aT * 1.6;
  vShade = 0.75 + 0.25 * sin(position.x * 3.0 + position.y * 2.0);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const KITE_FRAG = /* glsl */`
uniform vec3 uColA, uColB; varying float vT; varying float vShade;
#include <fog_pars_fragment>
void main() {
  vec3 col = vT > 0.001 ? mix(uColB, uColA, step(0.5, fract(vT * 9.0))) : uColA * vShade;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
function kiteGeometry() {
  const pos = [0, 1.5, 0, 1.0, 0.45, 0.12, 0, -1.7, 0, -1.0, 0.45, 0.12], aT = [0, 0, 0, 0], idx = [0, 1, 2, 0, 2, 3], SEG = 18;
  for (let i = 0; i <= SEG; i++) { const t = i / SEG; for (const s of [-1, 1]) { pos.push(s * 0.11, -1.7 - t * 7.5, 0); aT.push(t + 0.0011); } }
  for (let i = 0; i < SEG; i++) { const a = 4 + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 1)); g.setIndex(idx);
  return g;
}
// the kite's string: a ribbon between two points with a little sag, widened with distance so it never falls under ~2 px
const STRING_VERT = /* glsl */`
attribute vec2 aTS;            // t along the string, side -1 / 1
uniform vec3 uA, uB; uniform float uSag, uPx;
varying float vS; varying float vFade;
#include <fog_pars_vertex>
vec3 strAt(float t) { vec3 p = mix(uA, uB, t); p.y -= uSag * 4.0 * t * (1.0 - t); return p; }
void main() {
  vec3 p = strAt(aTS.x), tn = normalize(strAt(aTS.x + 0.02) - p), tc = cameraPosition - p;
  float d = max(length(tc), 1e-3), hw = max(0.012, d * uPx);
  vec3 sd = normalize(cross(tn, tc / d) + vec3(0.0, 1e-5, 0.0));
  vFade = clamp(0.02 / hw, 0.3, 1.0); vS = aTS.y;
  vec4 mvPosition = viewMatrix * vec4(p + sd * aTS.y * hw, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const STRING_FRAG = /* glsl */`
uniform vec3 uCol; varying float vS; varying float vFade;
#include <fog_pars_fragment>
void main() {
  gl_FragColor = vec4(uCol, 0.62 * vFade * (1.0 - vS * vS));
  #include <fog_fragment>
}`;
function stringGeometry(seg = 28) {
  const ts = [], idx = [];
  for (let i = 0; i <= seg; i++) ts.push(i / seg, -1, i / seg, 1);
  for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('aTS', new THREE.Float32BufferAttribute(ts, 2)); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((seg + 1) * 6), 3)); g.setIndex(idx);
  return g;
}
// two links of an anchor chain (one across, one along), to be instanced down the chain; PITCH is one link's step
const LINK_PITCH = 0.92;
function chainPairGeometry() {
  const iron = linCol('#4c443c'), rust = linCol('#7a4a30');
  const lit = [iron[0] * 2.6, iron[1] * 2.7, iron[2] * 3.0];
  const link = (ry, y) => tinted(new THREE.TorusGeometry(0.44, 0.135, 5, 10).scale(1, 1.5, 1).rotateY(ry).translate(0, y, 0), iron, (x, yy, z, ny) => (x + z > 0.3 ? lit : ny > 0.35 ? [iron[0] * 1.5, iron[1] * 1.5, iron[2] * 1.6] : Math.abs(yy - y) > 0.45 ? rust : null));
  return mergeGeometries([link(0, 0), link(Math.PI / 2, -LINK_PITCH)]);
}
// an old stocked anchor, crown at the origin, shank up +Y, about 6.5 m tall
function anchorGeometry() {
  const iron = linCol('#3c3834'), rust = linCol('#6c4630'), parts = [];
  const sh = (g) => parts.push(tinted(g, iron, (x, y, z, ny) => (ny > 0.4 ? [iron[0] * 1.5, iron[1] * 1.5, iron[2] * 1.6] : (Math.sin(x * 5.0 + y * 3.1 + z * 4.3) > 0.55 ? rust : null))));
  sh(new THREE.CylinderGeometry(0.2, 0.3, 6.0, 8).translate(0, 3.0, 0));                                  // shank
  sh(new THREE.TorusGeometry(0.55, 0.12, 5, 12).translate(0, 6.5, 0));                                    // ring
  sh(new THREE.CylinderGeometry(0.16, 0.16, 4.4, 6).rotateX(Math.PI / 2).translate(0, 5.5, 0));           // stock
  for (const e of [-1, 1]) sh(new THREE.SphereGeometry(0.3, 6, 4).translate(0, 5.5, e * 2.2));
  for (const s of [-1, 1]) {                                                                              // arms and flukes
    sh(new THREE.TorusGeometry(2.3, 0.26, 5, 10, 1.25).rotateZ(Math.PI * 1.5 + (s > 0 ? 0 : -1.25)).translate(0, 2.3, 0));
    sh(new THREE.ConeGeometry(0.75, 1.7, 4).scale(1, 1, 0.3).rotateZ(-s * 0.55).translate(s * 2.25, 1.85, 0));
  }
  return mergeGeometries(parts);
}
// a tuft of weed grown on the chain: six ribbons hanging from the origin, olive at the root and gold where the light comes through
function weedGeometry() {
  const pos = [], colr = [], idx = [], a = linCol('#2e4a1c'), b = linCol('#a9a03a'), SEG = 5;
  for (let k = 0; k < 6; k++) {
    const an = k * 1.047 + 0.3 * Math.sin(k * 2.1), len = 3.2 + 2.6 * Math.abs(Math.sin(k * 1.7 + 0.4)), out = 0.5 + 0.5 * Math.abs(Math.cos(k * 2.9)), base = pos.length / 3;
    const ca = Math.cos(an), sa = Math.sin(an);
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG, r = 0.35 + out * Math.sin(t * 1.9) * 1.3, hw = 0.34 * (1 - 0.75 * t) + 0.04, y = -len * t, tw = an + 1.3 * t;
      for (const sd of [-1, 1]) { pos.push(ca * r - Math.sin(tw) * hw * sd, y, sa * r + Math.cos(tw) * hw * sd); const c = [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; colr.push(c[0], c[1], c[2]); }
    }
    for (let i = 0; i < SEG; i++) { const q = base + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// low field tree for the far plain (unit height): a short trunk under a spreading crown of six lumps, each pushed out of round
// and shaded smooth so the crown reads as foliage with a lit side, not as a ball on a stick; 130 triangles (lumps 3: 70, for the
// trees the flight never comes near)
function fieldTreeGeometry(lumps = 6) {
  const lo = linCol('#1a2a18'), hi = linCol('#8a9440'), parts = [tinted(new THREE.CylinderGeometry(0.03, 0.065, 0.46, 5, 1, true).translate(0, 0.23, 0), linCol('#4e3d2c'))];
  for (const [x, y, z, r] of [[0, 0.6, 0, 0.36], [0.29, 0.5, 0.1, 0.27], [-0.23, 0.53, -0.18, 0.29], [0.04, 0.47, 0.3, 0.24], [-0.11, 0.77, 0.05, 0.22], [0.21, 0.66, -0.17, 0.22]].slice(0, lumps)) {
    const g = new THREE.IcosahedronGeometry(r, 0), p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      const px = p.getX(i), py = p.getY(i), pz = p.getZ(i), l = Math.hypot(px, py, pz) || 1, k = 1 + 0.2 * Math.sin(px * 31 + x * 17) * Math.cos(pz * 27 + z * 13) + 0.12 * Math.sin(py * 37 + y * 9);
      n.setXYZ(i, px / l, py / l, pz / l); p.setXYZ(i, px * k, py * k * 0.74, pz * k);
    }
    parts.push(tinted(g.translate(x, y, z), lo, (px, py, pz, ny) => {
      const k = clamp(0.3 + 0.5 * ny + (py - 0.55) * 1.2 + 0.2 * Math.sin(px * 23 + pz * 17 + py * 11), 0, 1); return [lerp(lo[0], hi[0], k), lerp(lo[1], hi[1], k), lerp(lo[2], hi[2], k)]; }));
  }
  return mergeGeometries(parts);
}
// a run of hedge (unit box, along x): four segments with the top pushed up and down so the line is ragged, dusty olive like the trees it runs into
function hedgeGeometry() {
  const lo = linCol('#2a3420'), hi = linCol('#6a7038'), g = new THREE.BoxGeometry(1, 1, 1, 4, 1, 1).translate(0, 0.5, 0), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > 0.5) { const x = p.getX(i); p.setY(i, 1 + 0.3 * Math.sin(x * 23.0 + 1.3) + 0.14 * Math.sin(x * 61.0) + 0.1 * Math.sin(p.getZ(i) * 5.0 + x * 9.0)); }
  g.computeVertexNormals();
  const ix = Array.from(g.index.array); ix.splice(36, 24); g.setIndex(ix);   // (the underside is never seen: 28 triangles a run)
  return tinted(g, lo, (x, y, z) => { if (y < 0.5) return null; const k = 0.72 + 0.4 * Math.abs(Math.sin(x * 9)) + 0.25 * (y - 1); return [hi[0] * k, hi[1] * k, hi[2] * k * 0.95]; });
}
// a country church for the far plain: white nave under a slate roof, a square tower and a tall spire (42 m), door to +Z
function chapelGeometry() {
  const wall = linCol('#efe9dc', 0.92), wallD = linCol('#d8cfbc', 0.8), slate = linCol('#4a4f58'), dark = linCol('#1e2228'), parts = [];
  const box = (sx, sy, sz, x, y, z, c) => parts.push(tinted(new THREE.BoxGeometry(sx, sy, sz).translate(x, y, z), c, (px, py) => (c === wall && py < 1.2 ? wallD : null)));
  box(11, 9, 26, 0, 4.5, -4, wall);                                                                  // nave
  const gable = new THREE.Shape([[-6.3, 0], [6.3, 0], [0, 6.6]].map((q) => new THREE.Vector2(q[0], q[1])));
  parts.push(tinted(new THREE.ExtrudeGeometry(gable, { depth: 27, bevelEnabled: false }).translate(0, 9, -17.5), slate, (x, y, z, ny) => (Math.abs(ny) < 0.2 && y < 15.4 ? wall : null)));
  for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) box(0.3, 4.6, 1.5, sd * 5.5, 5.2, -14 + k * 5.6, dark);   // tall windows
  box(7.4, 24, 7.4, 0, 12, 11.5, wall);                                                              // tower
  for (const sd of [-1, 1]) { box(0.3, 3.4, 1.6, sd * 3.7, 19.5, 11.5, dark); box(1.6, 3.4, 0.3, 0, 19.5, 11.5 + sd * 3.7, dark); }
  box(2.2, 3.6, 0.3, 0, 1.8, 15.25, dark);                                                           // door
  parts.push(tinted(new THREE.ConeGeometry(5.4, 18.5, 4, 1).rotateY(Math.PI / 4).translate(0, 33.2, 11.5), slate));
  return mergeGeometries(parts);
}
// THE LIGHTHOUSE'S ROCK, in the islet's own coordinates (origin on the tower's axis at the waterline, y up: the rock hangs, so
// it lies below y = 0). Not a round plug: four knuckles of rock of different reach and depth, each a blunt block (|x/a|^3 +
// |y/b|^3 + |z/c|^3 = 1, turned about the vertical), all of them round the tower's axis. The deepest hangs about 10 m under the
// waterline and the tower's root sits in it; the others are shallower and reach further, each to a different side, so that
// from any side the rock shows steps, shoulders and an uneven outline. Stone is its colour (grey beds, paler where barnacled,
// wet and a little brighter underneath); weed is only a ragged fringe in the first metre under the waterline (the tufts lower
// down are hung on it in build()). Its foam is on the water round it (CEIL_FRAG), not on the rock.
const ROCK_KNUCKLES = [   // centre x, z; half sizes x, y (= how deep it hangs), z; its turn about the vertical
  [0.5, 0.4, 7.2, 10.2, 6.6, 0.35],     // the deepest: the tower's root
  [5.6, 1.4, 10.4, 5.6, 7.4, -0.6],
  [-5.2, 4.4, 8.8, 7.3, 7.2, 0.8],
  [-0.8, -5.4, 8.2, 4.2, 8.4, 0.15],
];
function isletGeometry() {
  const K = ROCK_KNUCKLES.map(([cx, cz, a, b, c, w]) => [cx, cz, a, b, c, Math.cos(w), Math.sin(w)]), cube = (v) => Math.abs(v * v * v);
  const inK = (k, x, y, z) => { const dx = x - k[0], dz = z - k[1]; return cube((dx * k[5] + dz * k[6]) / k[2]) + cube(y / k[3]) + cube((dz * k[5] - dx * k[6]) / k[4]) <= 1; };
  // how far the rock reaches from the origin along a direction: the farthest of the knuckles' own faces (every knuckle holds the
  // origin, so along a ray each is entered once and left once), then roughened: broad lumps, beds a few metres thick, cracks
  const rough = (x, y, z) => 1 + 0.07 * Math.sin(x * 0.9 + z * 0.6 + 1.3) * Math.cos(z * 0.8 - y * 0.7) + 0.05 * Math.sin(y * 1.9 + 0.8 * Math.sin(x * 0.5 + z * 0.4)) - 0.07 * Math.abs(Math.sin(x * 0.55 - z * 0.75 + y * 0.3));
  const reachAlong = (dx, dy, dz) => {
    let t = 0;
    for (const k of K) { let lo = 0, hi = 26; for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2; if (inK(k, dx * m, dy * m, dz * m)) lo = m; else hi = m; } if (lo > t) t = lo; }
    t *= rough(dx * t, dy * t, dz * t);
    return dy > 0 ? Math.min(t, 2.2 / dy) : t;                        // above the waterline it is cut flat 2.2 m up, inside the sea, where the swell never uncovers it
  };
  // a grid of rings round the vertical, close together at the waterline (where the weed's fringe is) and wider toward the root
  const ELEV = [35, 13, 6, 0, -3, -6, -10, -15, -21, -28, -36, -45, -55, -66, -78], SEG = 64, pos = [0, 2.2, 0], idx = [], RAD = Math.PI / 180;
  let radius = 0, mean = 0, deep = 0;
  ELEV.forEach((e, r) => {
    for (let j = 0; j < SEG; j++) {
      const th = ((j + 0.3 * Math.sin(r * 2.4 + j * 1.7)) / SEG) * Math.PI * 2, ce = Math.cos(e * RAD), dx = ce * Math.cos(th), dy = Math.sin(e * RAD), dz = ce * Math.sin(th), t = reachAlong(dx, dy, dz);
      pos.push(dx * t, dy * t, dz * t);
      if (e === 0) { radius = Math.max(radius, t); mean += t / SEG; }
      deep = Math.max(deep, -dy * t);
    }
  });
  { const t = reachAlong(0, -1, 0); pos.push(0, -t, 0); deep = Math.max(deep, t); }
  const NR = ELEV.length, last = 1 + NR * SEG;
  for (let j = 0; j < SEG; j++) { const j1 = (j + 1) % SEG; idx.push(0, 1 + j1, 1 + j, last, 1 + (NR - 1) * SEG + j, 1 + (NR - 1) * SEG + j1); }
  for (let r = 0; r < NR - 1; r++) for (let j = 0; j < SEG; j++) { const j1 = (j + 1) % SEG, a = 1 + r * SEG + j, b = 1 + r * SEG + j1, c = a + SEG, d = b + SEG; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const stone = linCol('#56676a'), stoneL = linCol('#8b9a92'), weedC = linCol('#4a682a'), barn = linCol('#c4cab8');
  const out = tinted(g, stone, (x, y, z, ny) => {
    const n = 0.5 + 0.5 * Math.sin(x * 0.9 + y * 1.3) * Math.cos(z * 1.1 - y * 0.7), bed = 0.5 + 0.5 * Math.sin(y * 1.9 + 0.8 * Math.sin(x * 0.5 + z * 0.4)), sp = Math.sin(x * 3.7 + z * 2.9) * Math.sin(y * 4.3 + x * 1.7);
    const wet = 1 + 0.5 * smoothstep(0.1, -0.7, ny);                                                  // the underside is wet rock that takes the light off the fields, not a black hole
    const fringe = 0.55 + 0.75 * (0.5 + 0.5 * Math.sin(x * 1.9 + z * 2.3));                           // the weed's fringe: 0.55 to 1.3 m deep, ragged
    if (y > -fringe) return [weedC[0] * (0.7 + 0.6 * n) * wet, weedC[1] * (0.7 + 0.6 * n) * wet, weedC[2] * wet];
    if (sp > 0.55 || (y > -fringe - 0.7 && sp > -0.2)) return [barn[0] * (0.8 + 0.2 * n), barn[1] * (0.8 + 0.2 * n), barn[2] * (0.8 + 0.2 * n)];   // barnacle crust: a broken pale line under the weed, patches lower
    const k = (0.7 + 0.35 * n + 0.25 * bed) * wet; return [lerp(stone[0], stoneL[0], n) * k, lerp(stone[1], stoneL[1], n) * k, lerp(stone[2], stoneL[2], n) * k];
  });
  // what build() asks of the rock: its greatest and its mean reach at the waterline, how deep it hangs, its knuckles, and how far
  // it reaches at a bearing (the rock's own) and a depth under the waterline
  const inside = (x, y, z) => { const l = Math.hypot(x, y, z) || 1e-6; return l <= reachAlong(x / l, y / l, z / l); };
  const reach = (bearing, depth) => {
    const cb = Math.cos(bearing), sb = Math.sin(bearing); let r = 21; while (r > 0 && !inside(cb * r, -depth, sb * r)) r -= 1;
    if (r <= 0) return 0;
    let lo = r, hi = r + 1; for (let i = 0; i < 5; i++) { const m = (lo + hi) / 2; if (inside(cb * m, -depth, sb * m)) lo = m; else hi = m; }
    return lo; };
  let root = 0; for (let ok = true; ok && root < deep; root += 0.25) for (let j = 0; j < 16 && ok; j++) ok = inside(Math.cos(j * 0.3927) * 5.25, -root, Math.sin(j * 0.3927) * 5.25);   // root: the depth at which the tower (5.2 m in radius there) first shows out of the rock
  out.userData = { radius, mean, deep, root, reach, knuckles: ROCK_KNUCKLES.map(([cx, cz, a, b, c]) => [cx, cz, (a + c) / 2]) };
  return out;
}
// The raft a clump of kelp hangs from: a shallow tangle of holdfasts and canopy, olive and gold, with a pale rim of foam at the
// water, so that from the side the streamers visibly start at something on the surface. Its outline is ragged: the mat spreads
// in lobes of different reach (three, five and eight to the round), and from its rim fronds trail down into the water.
function raftGeometry() {
  let g = new THREE.IcosahedronGeometry(1, 4); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-4);   // shared corners: the mat is shaded round, not in facets
  const p = g.attributes.position;
  const rock = linCol('#4a5c22'), rockL = linCol('#96a038'), weedC = linCol('#6e8030'), barn = linCol('#a89a36'), foamC = linCol('#e6f2ee', 0.9);
  const lobe = (a) => 1.04 + 0.2 * Math.sin(3 * a + 0.9) + 0.13 * Math.sin(5 * a + 2.6) + 0.07 * Math.sin(8 * a + 4.1);
  const lump = (x, y, z) => 1 + 0.17 * Math.sin(x * 5.1 + z * 3.3) * Math.cos(z * 4.7 - y * 2.9) + 0.1 * Math.sin(x * 11 + y * 7 + z * 13) + 0.05 * Math.sin(x * 23 - z * 19 + y * 17);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = lump(x, y, z), l = lobe(Math.atan2(z, x));
    p.setXYZ(i, x * 13.5 * k * l, y * (y > 0 ? 3 : 3.6) * k, z * 13.5 * k * l);
  }
  g.computeVertexNormals();
  const mat = tinted(g, rock, (x, y, z, ny) => {
    const n = 0.5 + 0.5 * Math.sin(x * 0.9 + y * 1.3) * Math.cos(z * 1.1 - y * 0.7), sp = Math.sin(x * 3.7 + z * 2.9) * Math.sin(y * 4.3 + x * 1.7);
    const wet = 1 + 0.5 * smoothstep(0.1, -0.7, ny);                                                  // the underside takes the light off the fields, not a black hole
    if (y > -0.6 - 0.45 * (0.5 + 0.5 * Math.sin(x * 1.9 + z * 2.3))) return foamC;                    // a ragged collar of foam where it breaks the surface
    if (sp > 0.7) return barn;                                                                        // a gold frond end
    if (y > -2.6 + 1.5 * n) return [weedC[0] * (0.7 + 0.6 * n) * wet, weedC[1] * (0.7 + 0.6 * n) * wet, weedC[2] * wet];
    const k = (0.75 + 0.5 * n) * wet; return [lerp(rock[0], rockL[0], n) * k, lerp(rock[1], rockL[1], n) * k, lerp(rock[2], rockL[2], n) * k];
  });
  // the trailing fronds: twenty tapering ribbons (drawn from both sides) that leave the mat's own rim just under the water, lean outward and hang
  const pos = [], nor = [], colr = [], NF = 20, SG = 4, A = new THREE.Vector3(), B = new THREE.Vector3(), N = new THREE.Vector3();
  for (let f = 0; f < NF; f++) {
    const a = (f + 0.35 * Math.sin(f * 2.7)) / NF * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), r0 = 13.5 * 0.96 * lump(ca * 0.995, -0.1, sa * 0.995) * lobe(a), len = 2.3 + 1.9 * Math.abs(Math.sin(f * 1.9 + 0.6)), w0 = 0.75 + 0.45 * Math.abs(Math.cos(f * 3.1)), curl = 0.9 * Math.sin(f * 4.3);
    const pts = [];
    for (let i = 0; i <= SG; i++) {
      const t = i / SG, out = r0 + len * 0.5 * Math.sin(t * 1.5), side = curl * t * t * len * 0.35, hw = w0 * (1 - 0.82 * t) * 0.5, tw = a + Math.PI / 2 + 1.1 * t * Math.sin(f * 1.3);
      const cx = ca * out - sa * side, cz = sa * out + ca * side, y = -0.35 - len * Math.pow(t, 1.25), c = [lerp(weedC[0], barn[0], t * 0.8) * (0.8 + 0.3 * t), lerp(weedC[1], barn[1], t * 0.8) * (0.8 + 0.3 * t), lerp(weedC[2], barn[2], t * 0.8) * (0.8 + 0.3 * t)];
      pts.push([[cx - Math.cos(tw) * hw, y, cz - Math.sin(tw) * hw], [cx + Math.cos(tw) * hw, y, cz + Math.sin(tw) * hw], c]);
    }
    for (let i = 0; i < SG; i++) {
      const [a0, b0, c0] = pts[i], [a1, b1, c1] = pts[i + 1];
      for (const tri of [[a0, b0, a1, c0, c0, c1], [b0, b1, a1, c0, c1, c1], [a0, a1, b0, c0, c1, c0], [b0, a1, b1, c0, c1, c1]]) {
        A.set(tri[1][0] - tri[0][0], tri[1][1] - tri[0][1], tri[1][2] - tri[0][2]); B.set(tri[2][0] - tri[0][0], tri[2][1] - tri[0][1], tri[2][2] - tri[0][2]); N.crossVectors(A, B).normalize();
        for (let v = 0; v < 3; v++) { pos.push(...tri[v]); nor.push(N.x, N.y, N.z); colr.push(...tri[3 + v]); }
      }
    }
  }
  const fr = new THREE.BufferGeometry();
  fr.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fr.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); fr.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
  return mergeGeometries([mat, fr]);
}
// one arm of lamplight from the lighthouse down to the fields, built like the kit's beam (its material fades along uv.y and
// toward the silhouette), along -x: it starts dark inside the kit's short beam and carries on to the ground
function rakeGeometry(len, r0, r1, rgb) {
  const seg = 14, pos = [], nor = [], colr = [], uv = [], idx = [], rings = [[20, 0, 0.2], [62, 1, 0.34], [len, 1, 0.6]];
  rings.forEach(([sx, k, v]) => { const r = lerp(r0, r1, sx / len);
    for (let j = 0; j <= seg; j++) { const a = (Math.PI * 2 * j) / seg, cy = Math.cos(a), cz = Math.sin(a); pos.push(-sx, cy * r, cz * r); nor.push(0, cy, cz); colr.push(rgb[0] * k, rgb[1] * k, rgb[2] * k); uv.push(j / seg, v); } });
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; idx.push(a, b, b + 1, a, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
function baleGeometry() {
  const a = linCol('#e2c068'), b = linCol('#b98f3c');
  return tinted(new THREE.CylinderGeometry(0.75, 0.75, 1.35, 12, 3).rotateZ(Math.PI / 2).translate(0, 0.72, 0), a, (x, y, z) => { const k = 0.5 + 0.5 * Math.sin(x * 14 + Math.atan2(y - 0.72, z) * 3); return [lerp(b[0], a[0], k), lerp(b[1], a[1], k), lerp(b[2], a[2], k)]; });
}
// soft shadows thrown on the ground by trees and bales: one instanced quad each, stretched away from the sun
const BLOB_VERT = /* glsl */`
varying vec2 vQ;
#include <fog_pars_vertex>
void main() {
  vQ = position.xz * 2.0;
  vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BLOB_FRAG = /* glsl */`
uniform vec3 uCol; uniform float uOpacity; varying vec2 vQ;
#include <fog_pars_fragment>
void main() {
  float a = (1.0 - smoothstep(0.15, 1.0, length(vQ)));
  gl_FragColor = vec4(uCol, a * a * uOpacity);
  #include <fog_fragment>
}`;
// the seam: a bank of light where the two horizons meet (eye level), thick here and thin there, with far woods standing in it
const SEAM_VERT = /* glsl */`
varying vec3 vP; varying float vE;
void main() { vP = position; vE = position.y - cameraPosition.y; gl_Position = projectionMatrix * viewMatrix * vec4(cameraPosition.x + position.x, position.y, cameraPosition.z + position.z, 1.0); }`;
const SEAM_FRAG = /* glsl */`
uniform vec3 uCol, uLand; uniform float uT; varying vec3 vP; varying float vE;
void main() {
  float a = atan(vP.z, vP.x);
  float n = 0.5 + 0.5 * sin(a * 9.0 + uT * 0.11 + 2.0 * sin(a * 4.0 - uT * 0.07));
  float n2 = 0.5 + 0.5 * sin(a * 23.0 - uT * 0.19 + 1.7 * sin(a * 11.0 + uT * 0.13));
  float n3 = 0.5 + 0.5 * sin(a * 61.0 + uT * 0.09 + 2.1 * sin(a * 29.0 - uT * 0.06));
  float h = vE - mix(34.0, -30.0, clamp(cameraPosition.y / 120.0, 0.0, 1.0)) - 18.0 * (n - 0.5);
  float cw = 9.0 + 34.0 * n2 * (0.35 + 0.65 * n3);
  float core = exp(-h * h / (2.0 * cw * cw)), soft = exp(-h * h / 26000.0);
  float al = clamp(core * (0.5 + 0.4 * n3) + soft * (0.2 + 0.2 * n), 0.0, 1.0) * (1.0 - smoothstep(170.0, 270.0, abs(vE)));
  vec3 col = uCol * (0.92 + 0.42 * core * (0.6 + 0.7 * n));
  float t1 = sin(a * 211.0 + 1.3 * sin(a * 97.0)), t2 = sin(a * 503.0 + 2.0 * sin(a * 61.0));
  float ridge = 5.0 + 20.0 * max(t1, 0.0) * max(t1, 0.0) + 9.0 * max(t2, 0.0) + 22.0 * smoothstep(0.55, 0.95, n2);
  float land = (1.0 - smoothstep(ridge - 5.0, ridge, vP.y)) * smoothstep(-40.0, -8.0, vP.y);
  col = mix(col, uLand, land * 0.7);
  gl_FragColor = vec4(col, max(al, land * 0.55));
}`;

// ------------------------------------------------------------------------------------------
export default {
  id: 'the-sea-above', name: 'The Sea Above', category: 'bizarre', weirdness: 0.85, media: ['air', 'open'],
  async build(ctx) {
    const { rng, noise } = ctx;
    const scene = new THREE.Scene();
    const vary = ctx.vary || {}, Q = ctx.quality?.detail ?? 1;

    // ---------- 1 what this visit is like ----------
    const vr = rng.fork('visit');                                   // well-mixed stream for the big choices
    const seeded = ['noon', 'amber', 'deep'][Math.floor(vr() * 9) % 3];         // three equally likely moods when the viewer asks for no hour
    const hour = vary.hour || 'any';
    const mood = hour === 'golden' ? 'amber' : hour === 'day' ? 'noon' : hour === 'dawn' || hour === 'night' ? 'deep' : seeded;
    const amber = mood === 'amber', deepM = mood === 'deep', night = hour === 'night' ? 1 : 0;
    const mir = vr.sign();                                          // which side the barn stands on, and which way the whale carries the flight
    const mood0 = vr(), moodK = vary.mood ?? mood0;                 // 0 a still day .. 1 gusts and heavy upward rain
    const dens = clamp(vary.density ?? 1, 0.6, 1.4), rare = !!vary.rare;
    const breeze = lerp(0.72, 1.3, moodK) + (deepM ? 0.3 : 0);
    const sunEl = amber ? vr.range(24, 30) : deepM ? vr.range(50, 60) : vr.range(40, 50), sunAz = vr.range(-28, 24);
    const er = (sunEl * Math.PI) / 180, ar = (sunAz * Math.PI) / 180;
    const sunDir = new THREE.Vector3(Math.sin(ar) * Math.cos(er), Math.sin(er), -Math.cos(ar) * Math.cos(er));
    // where the sun's glow hangs in the ceiling as seen from the field: low enough to sit in the entry frame (in deep, where the sun
    // is high, it is where the refracted sun really is), and the direction inside the water that puts it there
    const glowEl = deepM ? 0 : amber ? lerp(22, 25, (sunEl - 24) / 6) : lerp(23, 28, (sunEl - 40) / 10);
    const sunT = sunDir.clone();
    if (!deepM) { const tT = Math.asin(0.75 * Math.cos((glowEl * Math.PI) / 180)); sunT.set(Math.sin(ar) * Math.sin(tT), Math.cos(tT), -Math.cos(ar) * Math.sin(tT)); }
    const hueJit = rng.range(-0.025, 0.025);
    const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
    const pal = PALETTE.map((h) => new THREE.Color(h));
    // noon: bright turquoise water over pale gold. amber: low warm light. deep: dark blue water, a brighter seam, strong caustics
    const aqua = pal[2].clone().offsetHSL(hueJit + (deepM ? 0.03 : amber ? -0.02 : 0), 0, deepM ? -0.12 : 0);
    const deep = pal[1].clone().lerp(pal[0], deepM ? 0.92 : amber ? 0.3 : 0.4).offsetHSL(hueJit, 0, 0);
    const sunCol = col(amber ? '#ffc27a' : deepM ? '#eef6ff' : '#fff1d6');
    const haze = (amber ? col('#f0d9b0') : deepM ? col('#5f9fc4') : col('#bfe9ec')).multiplyScalar(amber ? 0.86 : deepM ? 0.62 - 0.1 * night : 0.9);
    const seam = (amber ? col('#ffeccc') : deepM ? col('#f2feff') : col('#eafcff')).multiplyScalar(deepM ? 1.02 : 0.92);
    const ripe = amber ? rng.range(0.7, 1) : deepM ? rng.range(0, 0.35) : rng.range(0.2, 0.8);   // paler straw .. deep amber grain
    const wheatA = col('#f0c666').lerp(col('#e6a23c'), ripe).multiplyScalar(amber ? 0.84 : deepM ? 0.8 : 0.8);
    const wheatB = col('#c88c32').lerp(col('#a8621e'), ripe).multiplyScalar(amber ? 0.84 : deepM ? 0.8 : 0.82);
    const fogD = deepM ? 0.00085 : amber ? 0.00065 : 0.0005;
    scene.background = seam.clone();
    scene.fog = new THREE.FogExp2(haze.clone(), fogD);

    const sun = new THREE.DirectionalLight(sunCol, amber ? 3.5 : deepM ? 3.3 : 3.1); sun.position.copy(sunDir).multiplyScalar(300);
    const hemi = new THREE.HemisphereLight(aqua.clone().lerp(col('#fff6e6'), deepM ? 0.2 : 0.62), wheatB.clone().lerp(col('#ffffff'), 0.15), deepM ? 0.82 - 0.14 * night : 1.5);
    scene.add(sun, hemi);
    const fLight = { sunDir: sunDir.toArray(), sunColor: sunCol, sunIntensity: 3.0, sky: aqua.clone().lerp(col('#ffffff'), deepM ? 0.1 : 0.3), skyIntensity: deepM ? 1.15 : 1.6, ground: wheatA, groundIntensity: 1.0 };

    // ---------- 2 hero first: its anchors place the second half of the flight ----------
    // She is the largest whale of this sea: 44 m, where every other whale keeps the design's 28 m, so she reads as the one hero. The
    // piece lays its camera line for the whale it builds (one length), and the route's length and every cue fall where they fall.
    const HERO_LEN = 44;
    const hero = await buildHero({ ...ctx, rng: rng.fork('breach') }, { palette: PALETTE, ceilingY: C, ceiling: 'decal', viewSide: mir, length: HERO_LEN, calf: rare, sunDir, sunColor: sunCol, skyColor: aqua, groundColor: wheatA, skin: { back: [[0.13, 0.155, 0.21], [0.11, 0.145, 0.2]], under: [0.2, 0.33, 0.43] } });
    const A = hero.anchors, fd = A.flyDirection;
    const th = Math.PI / 2 - Math.atan2(-fd.z, fd.x), cs = Math.cos(th), sn = Math.sin(th);
    const rot = (x, z) => [x * cs + z * sn, -x * sn + z * cs];
    const XA = 10 * mir, ZA = -347;                                 // where the piece's own line begins in the world: its first point (the exit cue) is set here, at the end of the low run. (The snout breaks the ceiling earlier, a sail's length short of the mill: dS, section 9)
    const aW = rot(A.cues.exit.x, A.cues.exit.z), hx = XA - aW[0], hz = ZA - aW[1];
    hero.object.rotation.y = th; hero.object.position.set(hx, 0, hz); hero.object.updateMatrixWorld(true);
    // cool fill from the sea above and only a faint warm bounce from the wheat, so the skin stays slate blue
    const heroSky = pal[2].clone().lerp(pal[1], 0.25).lerp(col('#ffffff'), 0.12).multiplyScalar(deepM ? 1.1 : 1.4);
    const heroGround = aqua.clone().lerp(wheatA, amber ? 0.22 : 0.4).multiplyScalar(0.5);
    hero.setLight({ sunColor: sunCol.clone().lerp(col('#eaf6ff'), amber ? 0.7 : 0.35),
      skyColor: heroSky.lerp(new THREE.Color(0.52, 0.56, 0.66), 0.75), groundColor: heroGround.lerp(new THREE.Color(0.2, 0.25, 0.265), 0.75) });
    scene.add(hero.object);
    const toWorld = (v) => v.clone().applyMatrix4(hero.object.matrixWorld);
    const loc = (x, z) => { const r = rot(x, z); return [hx + r[0], hz + r[1]]; };        // hero-local XZ -> world XZ
    const fly = A.flyThrough.map(toWorld);
    // swell of the ceiling (the hero's seaH without its ripple rings), world space
    const swell = (x, z, t) => { const dx = x - hx, dz = z - hz, lx = dx * cs - dz * sn, lz = dx * sn + dz * cs;
      return 0.55 * Math.sin(lx * 0.045 + t * 0.5) + 0.4 * Math.sin(lx * 0.031 + lz * 0.052 - t * 0.42 + 1.7) + 0.22 * Math.sin(-lx * 0.09 + lz * 0.07 + t * 0.8); };
    await ctx.yield();

    // ---------- land and path ----------
    const H0 = (x, z) => 2.4 * noise.fbm2(x * 0.0032 + 7.1, z * 0.0032 - 3.3, 3) + 0.8 * noise.n2(x * 0.012 + 1.7, z * 0.012) - 1.2;
    // THE LOW RUN, by metres of route from the portal: its knots stand 6 m over the land's own height (H0) at the entry (0 m), 4.6 m
    // at 71 m, 5.2 m at 149 m, 7.2 m at 220 m, 8.8 m at 287 m, and from there the route goes up the piece's own line. The ground
    // under it is laid by live's own rule (heightAt): within 36 m of the track it lies no higher than 5.4 m under the line,
    // rising 0.12 m for each metre out from it; so where the knots come nearer the land than 5.4 m (along roughly 12 to 166 m of
    // route) the wheat lies in a trough under the line, 0.8 to 2.4 m lower than the land's own height (seeds 1 to 120; over the
    // land's own height the eye would pass at 3.05 to 4.6 m). The eye is never lower than 4 m above the ground as built: with eyes
    // every 2 m of route its least height is 5.4 m over that rule and 4.9 m over the ground as built (whose 7 m grid cuts
    // across the trough's foot); at the portal it is 6 m over the wheat field.
    const low = [[64, 6, 0], [50, 4.6, -70], [30, 5.2, -145], [17, 7.2, -215], [11.5, 8.8, -282]].map(([x, o, z]) => [x * mir, H0(x * mir, z) + o, z]);
    const path = makePath([...low, ...fly]);
    const L = path.length, endP = path.end.clone(), _q = new THREE.Vector3();
    const distOf = (p) => {                                         // nearest point of the path, to half a metre: a coarse pass, then the half-metre grid round its best sample
      let bd = 1e9, bs = 0; for (let d = 0; d <= L; d += 2) { const e = path.posAtDist(d, _q).distanceToSquared(p); if (e < bd) { bd = e; bs = d; } }
      for (let d = Math.max(0, bs - 2), d1 = Math.min(L, bs + 2); d <= d1; d += 0.5) { const e = path.posAtDist(d, _q).distanceToSquared(p); if (e < bd) { bd = e; bs = d; } }
      return bs; };
    await ctx.yield();
    const dA = distOf(toWorld(A.cues.exit)); await ctx.yield();
    const dN = distOf(toWorld(A.cues.nadir)); await ctx.yield();
    const dE = distOf(toWorld(A.cues.enter)); await ctx.yield();
    const uA = dA / L, uN = dN / L, uE = dE / L;
    const hE = path.endTangent.clone().setY(0).normalize(), rE = new THREE.Vector3(-hE.z, 0, hE.x);   // final heading and its right
    const side = (d, lat, fwd = 0) => { const p = path.posAtDist(d, new THREE.Vector3()), t = path.tangentAtDist(d, new THREE.Vector3()); t.y = 0; t.normalize(); return [p.x - t.z * lat + t.x * fwd, p.z + t.x * lat + t.z * fwd, p.y]; };
    // samples of the high part of the flight (which field trees it looks down on from near: section 8)
    const hiPts = []; for (let i = 0; i <= 260; i++) { const p = path.pointAt(i / 260); if (p.y > 30) hiPts.push(p); }
    const hiDist = (x, z) => { let m = 1e9; for (const p of hiPts) m = Math.min(m, Math.hypot(p.x - x, p.z - z)); return m; };
    // track table: x of the track centre, cosine of its heading and the path height, by world z (the track follows
    // the low run and carries straight on where the flight leaves it)
    const trk = new Float32Array(TRK_N * 4), trkY = new Float32Array(TRK_N);
    {
      const NS = 400, sp = [], t0 = path.startTangent, p0 = path.start;
      for (let i = 0; i <= NS; i++) sp.push(path.pointAt((i / NS) * uA));
      const zEnd = sp[NS].z, xEnd = sp[NS].x, yEnd = sp[NS].y;
      let k = 0;
      for (let j = 0; j < TRK_N; j++) {
        const z = lerp(TRK_Z0, TRK_Z1, j / (TRK_N - 1)); let x, c = 1, y;
        if (z >= p0.z) { x = p0.x + (t0.x / t0.z) * (z - p0.z); c = Math.abs(t0.z) / Math.hypot(t0.x, t0.z); y = p0.y; }
        else if (z <= zEnd) { x = xEnd; y = yEnd; }
        else {
          while (k < NS - 1 && sp[k + 1].z > z) k++;
          const a = sp[k], b = sp[k + 1], f = clamp((a.z - z) / Math.max(1e-4, a.z - b.z), 0, 1);
          x = lerp(a.x, b.x, f); y = lerp(a.y, b.y, f); c = Math.abs(b.z - a.z) / Math.max(1e-4, Math.hypot(b.x - a.x, b.z - a.z));
        }
        trk[j * 4] = x; trk[j * 4 + 1] = c; trkY[j] = y;
      }
    }
    const trkAt = (z, arr, stride) => { const f = clamp((TRK_Z0 - z) / (TRK_Z0 - TRK_Z1), 0, 1) * (TRK_N - 1), i = Math.min(TRK_N - 2, Math.floor(f)); return lerp(arr[i * stride], arr[(i + 1) * stride], f - i); };
    const trackX = (z) => trkAt(z, trk, 4), pathYAt = (z) => trkAt(z, trkY, 1);
    const heightAt = (x, z) => {
      let h = H0(x, z);
      if (z < 90 && z > ZA - 60) { const d = Math.abs(x - trackX(z)); if (d < 36) h = Math.min(h, pathYAt(z) - 5.4 + d * 0.12); }
      return h;
    };
    // Built places of the home field, each by a rule of its own: the mill stands 21 m off the track where the track has run 294 m
    // north of the portal's line, the barn 31 m off it on the other side 104 m further on (live's places).
    const barnZ = -398, barnX = trackX(barnZ) + 31 * mir, millZ = -294, millX = trackX(millZ) - 21 * mir;
    const _gc = new THREE.Color();
    const groundColor = (x, z) => {
      const n = 0.5 + 0.5 * noise.fbm2(x * 0.006 + 3, z * 0.006, 2), far = 0.5 + 0.5 * noise.n2(x * 0.0013 - 9, z * 0.0013 + 4);
      _gc.copy(wheatA).lerp(wheatB, clamp(n * 0.9 + (far - 0.5) * 0.7, 0, 1));
      return [_gc.r, _gc.g, _gc.b];
    };
    await ctx.yield();

    // ---------- 4 shared light pattern uniforms and the material patch ----------
    const far4 = () => new THREE.Vector4(0, 9e4, 1, 0);
    const SU = {
      uSeaT: { value: 0 }, uSeaSun: { value: sunDir },
      uSeaWh: { value: [far4(), far4(), far4(), far4()] },                       // the breach whale, the two in the ceiling, the calf
      uSeaWhK: { value: [new THREE.Vector3(0, 0, 31), new THREE.Vector3(0, 0, 19), new THREE.Vector3(0, 0, 19), new THREE.Vector3(0, 0, 11)] },   // half lengths, well over life size: shadows thrown from 120 m up spread
      uSeaBlob: { value: [new THREE.Vector4(0, 9e4, 10, 0), new THREE.Vector4(0, 9e4, 10, 0), new THREE.Vector4(0, 9e4, 10, 0)] },
      uSeaCaus: { value: new THREE.Vector4(0.45, deepM ? 2.05 : 1.55, deepM ? 0.4 : 0.6, C) },
      uSeaWind: { value: new THREE.Vector4(0.8, 0.6, 1.25 * breeze, 0.4 + 0.16 * moodK) },
      uSeaPool: { value: new THREE.Vector4(0, 9e4, 1, 0) }, uSeaPoolK: { value: new THREE.Vector3(34, 15, 0) },
      uSeaSeam: { value: seam }, uSeaAq: { value: aqua.clone().lerp(deep, 0.6).multiplyScalar(0.62) },
    };
    // what a whale's shadow leaves of the ambient light: dimmer and cooler. Under the deep sea the ambient light is half as strong to
    // begin with, and a shadow that took the same share of it was a black hole in the wheat: there it leaves the ambient its strength
    // and turns it blue, and takes a little less of the sun (SHK), so the crop still shows inside it
    const SHADE = deepM ? 'mix(vec3(1.0), vec3(0.86, 1.0, 1.22), 1.0 - seaS)' : 'mix(vec3(1.0), vec3(0.46, 0.57, 0.72), 1.0 - seaS)', SHK = deepM ? 0.7 : 0.84;
    const trk16 = new Uint16Array(TRK_N * 4); for (let i = 0; i < trk16.length; i++) trk16[i] = THREE.DataUtils.toHalfFloat(trk[i]);
    const trkTex = new THREE.DataTexture(trk16, TRK_N, 1, THREE.RGBAFormat, THREE.HalfFloatType);
    trkTex.minFilter = trkTex.magFilter = THREE.NearestFilter; trkTex.generateMipmaps = false; trkTex.needsUpdate = true;
    const rowA = rng.range(-0.5, 0.5);
    const CUT = [345, 6 * mir, 217, 132];                            // the cut field under the last third of the flight (hero-local)
    const GU = { uTrk: { value: trkTex }, uTrkZ: { value: new THREE.Vector2(TRK_Z0, TRK_Z1) }, uDirt: { value: col('#9a7a4c', 0.85) }, uGndRow: { value: new THREE.Vector2(Math.sin(rowA), -Math.cos(rowA)) },
      uGndHero: { value: new THREE.Vector4(hx, hz, cs, sn) }, uCut: { value: new THREE.Vector4(...CUT) }, uFur: { value: new THREE.Vector4(0, 9e4, 1, 9e4) } };
    const CH = { uChain: { value: new THREE.Vector4(0, 0, CEIL, 100) } };   // lean x, z of the chain's foot, top height, length
    const patched = new WeakSet();
    function seaPatch(mat, o = {}) {
      if (!mat || patched.has(mat) || !(mat.isMeshLambertMaterial || mat.isMeshStandardMaterial || mat.isMeshPhongMaterial)) return mat;
      patched.add(mat);
      const prev = mat.onBeforeCompile, prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
      mat.onBeforeCompile = (sh, r) => {
        if (prev) prev.call(mat, sh, r);
        Object.assign(sh.uniforms, SU, o.ground ? GU : null, o.chain ? CH : null);
        if (sh.vertexShader.includes('fWorld')) {                  // kit flora (heavy overdraw): the light pattern per vertex
          sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSeaL;\n' + SEA_FN)
            .replace('#include <fog_vertex>', '#include <fog_vertex>\n vSeaL = vec3(seaLight(fWorld.xyz, ' + (o.wave ? '1.0' : '0.0') + '), seaShade(fWorld.xyz), fWorld.y);');
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vSeaL; uniform vec3 uSeaSeam, uSeaAq;')
            .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n { float seaS = vSeaL.y; reflectedLight.directDiffuse *= vSeaL.x * seaS; reflectedLight.indirectDiffuse *= ' + SHADE + '; }')
            .replace('#include <fog_fragment>', (o.kelp ? ' gl_FragColor.rgb = mix(gl_FragColor.rgb, uSeaAq, 0.18 * smoothstep(' + (C - 4).toFixed(1) + ', ' + (C + 0.5).toFixed(1) + ', vSeaL.z));\n' : '') + SEA_FOG);
          return;
        }
        const own = sh.vertexShader.includes('vWPos') ? 'vWPos' : null;
        if (!own) sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSeaW;')
          .replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 sw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n sw = instanceMatrix * sw;\n#endif\n vSeaW = (modelMatrix * sw).xyz; }');
        if (o.sway) sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uSeaT;')                // far trees lean and shiver in the breeze
          .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n { float sp = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23; transformed.xz += position.y * position.y * (0.05 * sin(uSeaT * 1.3 + sp) + 0.02 * sin(uSeaT * 3.7 + sp * 2.0 + position.x * 9.0)) * vec2(0.8, 0.6); }\n#endif');
        if (o.chain) sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uSeaT; uniform vec4 uChain;')  // the chain hangs in a curve to its dragged foot and swings a little; far off its links are drawn wider so it never thins to a dotted line
          .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n { float ch = clamp((uChain.z - (instanceMatrix[3].y + position.y)) / uChain.w, 0.0, 1.0); vec4 cw = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); transformed.xz *= max(1.0, distance(cw.xyz, cameraPosition) / 100.0); transformed.xz += uChain.xy * ch * ch + sin(3.14159 * ch) * 1.2 * vec2(sin(uSeaT * 0.5 + ch * 3.0), cos(uSeaT * 0.37 + ch * 2.3)); }\n#endif');
        let fs = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + (own ? '#define vSeaW ' + own + '\n' : 'varying vec3 vSeaW;\n') + SEA_FN + (o.ground ? GROUND_PARS : ''));
        if (o.ground) fs = fs.replace('#include <color_fragment>', '#include <color_fragment>\n' + GROUND_COLOR);
        if (o.planks) fs = fs.replace('#include <color_fragment>', '#include <color_fragment>\n if (diffuseColor.r > diffuseColor.g * 2.2) diffuseColor.rgb *= 0.8 + 0.2 * step(0.14, fract((vSeaW.x + vSeaW.z * 0.73) * 1.9)) * (0.85 + 0.3 * seaVN(vec2((vSeaW.x + vSeaW.z * 0.73) * 1.9, vSeaW.y * 0.35)));');
        fs = fs.replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n { float seaS = seaShade(vSeaW); reflectedLight.directDiffuse *= seaLight(vSeaW, ' + (o.wave ? '1.0' : '0.0') + ') * seaS; reflectedLight.indirectDiffuse *= ' + SHADE + '; reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3(1.0, 0.9, 0.62) * seaPool(vSeaW); }');
        sh.fragmentShader = fs.replace('#include <fog_fragment>', SEA_FOG);
      };
      mat.customProgramCacheKey = () => prevKey + '|sea5' + (o.ground ? 'g' : '') + (o.wave ? 'w' : '') + (o.planks ? 'p' : '') + (o.kelp ? 'k' : '') + (o.sway ? 's' : '') + (o.chain ? 'c' : '');
      mat.needsUpdate = true;
      return mat;
    }

    // ---------- 5 ground: a non-uniform grid, fine along the route ----------
    {
      const axis = (lo, hi, a, b, step) => {
        const v = []; for (let x = a; x <= b + 1e-3; x += step) v.push(x);
        let s = step, x = b; while (x < hi) { s *= 1.36; x += s; v.push(Math.min(x, hi)); }
        s = step; x = a; while (x > lo) { s *= 1.36; x -= s; v.unshift(Math.max(x, lo)); }
        return v;
      };
      const xs = axis(-3400, 3400, mir > 0 ? -150 : -250, mir > 0 ? 250 : 150, 7), zs = axis(-4000, 3200, -620, 66, 7), nx = xs.length, nz = zs.length;
      const pos = new Float32Array(nx * nz * 3), colr = new Float32Array(nx * nz * 3), idx = [];
      for (let j = 0; j < nz; j++) {
        for (let i = 0; i < nx; i++) {
          const o = (j * nx + i) * 3, x = xs[i], z = zs[j], c = groundColor(x, z);
          pos[o] = x; pos[o + 1] = heightAt(x, z); pos[o + 2] = z; colr[o] = c[0]; colr[o + 1] = c[1]; colr[o + 2] = c[2];
        }
        if (j % 6 === 5) await ctx.yield();
      }
      for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(colr, 3)); g.setIndex(idx);
      await ctx.yield();
      g.computeVertexNormals();
      await ctx.yield();
      const ground = new THREE.Mesh(g, seaPatch(new THREE.MeshLambertMaterial({ vertexColors: true }), { ground: true, wave: true }));
      ground.frustumCulled = false; ground.name = 'wheat-plain'; scene.add(ground);
    }
    await ctx.yield();

    // ---------- 6 the sea ceiling and the seam ----------
    const portalCol = col('#bff4ff');
    const spots = []; for (let i = 0; i < NSPOT; i++) spots.push(new THREE.Vector4(0, 9e4, 1, 0));
    const CU = {
      ...SU, uTime: hero.sea.uTime, uSiteA: hero.sea.uSiteA, uSiteB: hero.sea.uSiteB,
      uHero: { value: new THREE.Vector4(hx, hz, cs, sn) }, uCeilY: { value: CEIL },
      uSunCol: { value: sunCol.clone().multiplyScalar(amber || deepM ? 1.5 : 1.3) }, uSunT: { value: sunT },
      // in every mood the water is darker and more saturated than the seam: teal overhead that deepens with distance, a white net on it
      uDeep: { value: deep.clone().multiplyScalar(deepM ? 0.5 - 0.08 * night : amber ? 0.6 : 0.5) },
      uAqua: { value: aqua.clone().lerp(pal[1], deepM ? 0.55 : amber ? 0.4 : 0.55).multiplyScalar(deepM ? 0.74 : amber ? 0.8 : 0.74) },
      uCausCol: { value: amber ? aqua.clone().multiplyScalar(0.42).add(col('#ffc48a', 0.55)) : aqua.clone().multiplyScalar(deepM ? 0.72 : 0.66).addScalar(deepM ? 0.26 : 0.27) },
      uRefl: { value: wheatA.clone().lerp(haze, 0.3).multiplyScalar(0.9) },
      uHaze: { value: deepM ? aqua.clone().lerp(haze, 0.8).multiplyScalar(0.88) : deep.clone().lerp(aqua, amber ? 0.26 : 0.3).multiplyScalar(0.9) },
      uGlow: { value: seam.clone().lerp(aqua, deepM ? 0.55 : amber ? 0.3 : 0.45).multiplyScalar(deepM ? 0.8 : 0.92) }, uFogD: { value: Math.max(fogD, 0.0007) },
      uWhaleCol: { value: pal[0].clone().lerp(pal[1], 0.35).multiplyScalar(deepM ? 0.6 : 0.8) }, uPortalCol: { value: portalCol.clone() }, uNear: { value: 0 },
      uRun: { value: 0 }, uCalm: { value: new THREE.Vector4(0, 9e4, 1, 0) }, uCalmBody: { value: 0 }, uSpoutFoam: { value: 1 },
      uNearDark: { value: deepM ? 1.0 : 0.96 }, uBodyTint: { value: deepM ? 0.14 : 0.27 }, uPortalC: { value: endP.clone() },
      uPortal: { value: new THREE.Vector3(endP.x, endP.z, 1.0) }, uPortalDir: { value: new THREE.Vector2(-hE.x, -hE.z) }, uSpot: { value: spots },
      uBoat: { value: [far4(), far4(), far4()] }, uRock: { value: [new THREE.Vector3(0, 9e4, 1), new THREE.Vector3(0, 9e4, 1), new THREE.Vector3(0, 9e4, 1), new THREE.Vector3(0, 9e4, 1)] },
    };
    await ctx.yield();
    const ceilMat = new THREE.ShaderMaterial({ uniforms: CU, vertexShader: CEIL_VERT, fragmentShader: CEIL_FRAG, side: THREE.DoubleSide });
    const ceiling = new THREE.Mesh(ceilingGeometry(), ceilMat); ceiling.frustumCulled = false; ceiling.name = 'sea-ceiling'; scene.add(ceiling);
    await ctx.yield();
    const seamU = { uCol: { value: (amber ? col('#fff0d2') : col('#f2fdff')).multiplyScalar(deepM ? 1.12 : 0.98) }, uT: SU.uSeaT, uLand: { value: haze.clone().lerp(col('#3c5a34'), 0.5) } };
    const seamRing = new THREE.Mesh(new THREE.CylinderGeometry(2600, 2600, 640, 96, 6, true).translate(0, 60, 0),
      new THREE.ShaderMaterial({ uniforms: seamU, vertexShader: SEAM_VERT, fragmentShader: SEAM_FRAG, side: THREE.BackSide, transparent: true, depthWrite: false }));
    seamRing.frustumCulled = false; seamRing.renderOrder = 1; seamRing.name = 'seam'; scene.add(seamRing);
    await ctx.yield();

    // ---------- 7 flora: oaks, wheat, ears near the lens, poppies (the hanging kelp: 10b) ----------
    const wind = flora.makeWind({ direction: [0.8, 0.6], strength: breeze, speed: 1 });
    const leafOpts = { wind, backlight: 1.0, backlightTint: '#eaff8a' };
    await flora.prepareLeafTexture(leafOpts, ctx.yield);
    const leafMat = seaPatch(flora.windMaterial(leafOpts));
    const LX = endP.x + rE.x * mir * 42 + hE.x * 24, LZ = endP.z + rE.z * mir * 42 + hE.z * 24, lhH = 45;   // the hanging lighthouse (section 9): far enough on that the lamp is still in the frame when the lens is close
    const oakSpots = [[trackX(-100) - 18 * mir, -100, 14.5, 1], [barnX + 17 * mir, barnZ - 34, 12.5, 0.7], [trackX(-430) - 15 * mir, -430, 13.5, 0.7]];   // (the two the lens never comes near are lighter)
    const oaks = [];
    for (let i = 0; i < oakSpots.length; i++) {
      await ctx.yield();
      const [x, z, h, det] = oakSpots[i];
      const m = new THREE.Mesh(flora.oakGeometry({ rng: rng.fork('oak' + i), detail: det, height: h * rng.range(0.9, 1.1), leaf: '#4f7a2c', leafLight: '#9ab040', leafDark: '#2c4a22' }), leafMat);
      m.position.set(x, heightAt(x, z) - 0.15, z); m.rotation.y = rng() * 6.28; scene.add(m); oaks.push(m);
      await ctx.yield();
    }
    const oakShade = flora.makeGroundShadows({ objects: oaks, heightAt, sunDir, strength: 0.5, color: '#3a3020' });
    scene.add(oakShade.object);
    await ctx.yield();

    // where a hull has let its anchor go (section 9): the dragged anchor ploughs a strip of the wheat flat
    const CH_D = dA + 105, chainAt = side(CH_D, 27 * mir), chDir = path.tangentAtDist(CH_D, new THREE.Vector3()).setY(0).normalize();
    const furrow = (x, z) => { const dx = x - chainAt[0], dz = z - chainAt[1], al = dx * chDir.x + dz * chDir.z; return al > -78 && al < -12 && Math.abs(dx * chDir.z - dz * chDir.x) < 1.7; };
    // ripe wheat: narrow, tall tufts, amber toward the ears, in rollers of wind
    const wheat = await flora.makeGrassAsync({
      rng: rng.fork('wheat'), path, uRange: [0, (dA + 70) / L], radius: 56, bias: 2.6, count: Math.round(39500 * Q), chunks: 12, heightAt, wind, map: leafMat.map,
      groundColor, shade: [oakShade], width: [0.27, 0.48], height: [1.15, 1.62], flowers: 0, fade: [78, 112], rootGain: 1.0,
      density: (x, z, lat) => (lat < 2.1 || furrow(x, z) ? 0 : 1),
      materialOptions: { backlight: 1.1, backlightTint: '#ffe9a0', sheen: 0.5 },
    }, ctx.yield);
    seaPatch(wheat.material, { wave: true }); scene.add(wheat.object);
    await ctx.yield();
    // within ~35 m of the lens: real stalks with nodding ears standing a little proud of the tufts
    const earGeos = [0, 1, 2].map((i) => flora.reedGeometry({ rng: rng.fork('ear' + i), height: 1.6, blades: 2, cattails: 2, leaf: '#cf9c40', tip: '#f4d684', root: '#8c6a2e', head: '#e8b652' }));
    await ctx.yield();
    const ears = flora.makeReeds({ rng: rng.fork('ears'), path, uRange: [0, uA], radius: 13, corridor: 2.4, count: Math.round(860 * Q), heightAt, wind, map: leafMat.map,
      variants: earGeos, scale: [0.85, 1.2], chunks: 9, cullDistance: 44, materialOptions: { fade: [28, 42], backlight: 1.0, backlightTint: '#ffe9a0' } });
    seaPatch(ears.material, { wave: true }); scene.add(ears.object);
    await ctx.yield();
    const poppies = flora.makeFlowers({
      rng: rng.fork('poppy'), path, uRange: [0, uA * 0.94], radius: 15, corridor: 2.3, count: Math.round(rng.range(1500, 2000) * dens * Q), heightAt, wind, map: leafMat.map, groundColor,
      colors: ['#ff5a3a', '#f0452c', '#ff7a4a', '#e83a2a'], scale: [0.5, 0.85], chunks: 16,   // (chunks are counted along the whole flight: sixteen puts the poppies in six, so those behind the lens are not drawn)
      density: (x, z) => 0.25 + 0.75 * Math.max(0, Math.sin(x * 0.13 + Math.sin(z * 0.05) * 2.0)),
    });
    seaPatch(poppies.material, { wave: true }); scene.add(poppies.object);
    await ctx.yield();
    // the road carries on where the flight leaves it, and so do its poppies (a stream of their own, the same material: one more program-free draw per chunk)
    const roadPts = []; for (let z = path.pointAt(uA * 0.9).z; z > -600; z -= 30) roadPts.push([trackX(z), heightAt(trackX(z), z) + 2, z]);
    const poppies2 = flora.makeFlowers({
      rng: ctx.core.makeRng('the-sea-above:poppy2:' + ctx.seed), path: makePath(roadPts), radius: 14, corridor: 2.3, count: Math.round(700 * dens * Q), heightAt, wind, map: leafMat.map, groundColor,
      colors: ['#ff5a3a', '#f0452c', '#ff7a4a', '#e83a2a'], scale: [0.55, 0.9], chunks: 4, material: poppies.material,
      density: (x, z) => 0.3 + 0.7 * Math.max(0, Math.sin(x * 0.13 + Math.sin(z * 0.05) * 2.0)),
    });
    scene.add(poppies2.object);
    await ctx.yield();

    const builtMat = seaPatch(new THREE.MeshLambertMaterial({ vertexColors: true }), { planks: true });
    const kr = rng.fork('kelp');                                      // the kelp's own stream; the clumps are hung in section 10b, once the lanes they keep out of are known
    await ctx.yield();

    // ---------- 8 the far plain, dressed for the view from the air: hedgerows and trees on the parcel edges, bales, their shadows ----------
    const SPOUT = loc(428, -165 * mir);                               // where the waterspout stands (section 11)
    const farm2 = loc(215, 165 * mir);                               // a neighbour's farm beside the cut field, under the last run
    let hamlet;                                                       // and out on the plain a church with its one barn among trees, at a meeting of the plain's lanes (its place is drawn below, where the parcels are known)
    {
      const dr = rng.fork('plain'), drPlain = dr, farMat = seaPatch(new THREE.MeshLambertMaterial({ vertexColors: true }), { sway: true });
      const trees = [], treeTint = [], hedges = [], bales = [], shadows = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
      const put = (list, x, z, sx, sy, sz, ry, sink = 0.2) => list.push(m4.compose(p.set(x, H0(x, z) - sink, z), q.setFromAxisAngle(Y, ry), sc.set(sx, sy, sz)).clone());
      // a soft shadow stretched away from the sun
      const sl = Math.hypot(sunDir.x, sunDir.z) || 1, sdx = -sunDir.x / sl, sdz = -sunDir.z / sl, sAng = Math.atan2(-sdz, sdx), sLen = Math.min(2.4, Math.cos(er) / Math.sin(er));
      const shadow = (x, z, h, w) => { const len = h * sLen * 1.2, cx = x + sdx * len * 0.5, cz = z + sdz * len * 0.5; shadows.push(m4.compose(p.set(cx, H0(cx, cz) + 0.3, cz), q.setFromAxisAngle(Y, sAng), sc.set(len + w * 1.2, 1, w * 1.15)).clone()); };
      const tree = (x, z, dr = drPlain) => { const h = dr.range(8, 13.5), k = dr.range(0.7, 1.15); treeTint.push(dr() < 0.3 ? [k * 1.16, k, k * 0.6] : [k * 1.02, k, k * 0.8]);   // each its own dusty green, some olive
        if (dr() < 0.22) { put(trees, x, z, h * 0.5, h * 1.55, h * 0.5, dr() * 6.28); shadow(x, z, h * 1.4, h * 0.45); } else { put(trees, x, z, h * 1.2, h, h * 1.2, dr() * 6.28); shadow(x, z, h * 0.85, h * 0.9); }
        if (dr === drPlain && inYard(x, z)) { trees.pop(); treeTint.pop(); shadows.pop(); } };   // (the plain plants nothing of its own in the churchyard: dealt as ever, then left out, so no later draw moves)
      const inCut = (x, z) => { const dx = x - hx, dz = z - hz, lx = dx * cs - dz * sn, lz = dx * sn + dz * cs; return Math.abs(lx - CUT[0]) < CUT[2] + 6 && Math.abs(lz - CUT[1]) < CUT[3] + 6; };
      const open = (x, z) => Math.abs(x - trackX(z)) > 80 && Math.hypot(x - 30, z + 430) < 860 && !inCut(x, z);
      // the ground shader's parcels: cell edges are x = 190 (i - 0.24 sin(z / 230 + 1)) and z = 190 (j - 0.24 sin(x / 205))
      const STEP = 16, ex = (i, z) => 190 * (i - 0.24 * Math.sin(z / 230 + 1)), ez = (j, x) => 190 * (j - 0.24 * Math.sin(x / 205));
      {   // THE HAMLET'S PLACE, by a rule of the land: it stands at a meeting of lanes, which is a parcel corner. A field's width is the
        // parcels' own size, FIELD = 190 m. Among the corners of the far plain (the ones this section dresses: columns -5 to 5, rows
        // -7 to 2, on the open plain) that lie between one and two fields' widths (190 to 380 m) from the cut field's edge and
        // 110 m or more from the spout's foot, from the neighbour's farm and from the ground under the lighthouse, one is drawn
        // from a stream of the hamlet's own. (Were there none, the corner nearest a field and a half from the cut field's edge
        // among those that keep the three margins.)
        const FIELD = 190, pr = ctx.core.makeRng(ctx.core.hashSeed('the-sea-above:hamlet-place:' + ctx.seed)), fit = [], rest = [];
        const cutEdge = (x, z) => { const dx = x - hx, dz = z - hz, lx = dx * cs - dz * sn, lz = dx * sn + dz * cs; return Math.hypot(Math.max(Math.abs(lx - CUT[0]) - CUT[2], 0), Math.max(Math.abs(lz - CUT[1]) - CUT[3], 0)); };
        for (let i = -5; i <= 5; i++) for (let j = -7; j <= 2; j++) {
          let x = FIELD * i, z = FIELD * j; for (let k = 0; k < 6; k++) { x = ex(i, z); z = ez(j, x); }
          if (!open(x, z) || [SPOUT, farm2, [LX, LZ]].some((q) => Math.hypot(x - q[0], z - q[1]) < 110)) continue;
          const dc = cutEdge(x, z); (dc >= FIELD && dc <= 2 * FIELD ? fit : rest).push([x, z, Math.abs(dc - 1.5 * FIELD)]);
        }
        const pick = pr();
        hamlet = fit.length ? fit[Math.floor(pick * fit.length)] : rest.reduce((a, b) => (b[2] < a[2] ? b : a));
      }
      // THE CHURCHYARD. The lanes' hedges and the plain's own trees stop at the churchyard: within 30 m of the church and within
      // 22 m of its barn (which stands 38 m east and 20 m south of it) the plain plants no hedge run and no tree of its own; the
      // churchyard's trees are the hamlet's (below).
      const inYard = (x, z) => Math.hypot(x - hamlet[0], z - hamlet[1]) < 30 || Math.hypot(x - hamlet[0] - 38, z - hamlet[1] - 20) < 22;
      const seg = (x0, z0, x1, z1) => {
        const x = (x0 + x1) / 2, z = (z0 + z1) / 2; if (!open(x, z)) return;
        const d = noise.n2(x * 0.0045 + 11, z * 0.0045 - 5), len = Math.hypot(x1 - x0, z1 - z0);
        // (the runs overlap, and where the old hedge had a gap there is now a low stretch of it: a line, not dashes)
        if (d > 0.02) { if (dr() < 0.85) put(hedges, x, z, len * (0.72 + 0.5 * dr.range(0.7, 1.04)), 1.45 * dr.range(1.4, 2.3), dr.range(2.0, 3.0), Math.atan2(-(z1 - z0), x1 - x0)); else put(hedges, x, z, len * 1.1, 1.3, 2.1, Math.atan2(-(z1 - z0), x1 - x0)); if (inYard(x, z)) hedges.pop(); }
        if (dr() < (d > 0.25 ? 0.24 : 0.06)) tree(x + dr.range(-2, 2), z + dr.range(-2, 2));
      };
      for (let i = -5; i <= 5; i++) { for (let z = -1290, n = 0; z < 420; z += STEP) { seg(ex(i, z), z, ex(i, z + STEP), z + STEP); if (++n % 36 === 0) await ctx.yield(); } await ctx.yield(); }
      for (let j = -7; j <= 2; j++) { for (let x = -860, n = 0; x < 880; x += STEP) { seg(x, ez(j, x), x + STEP, ez(j, x + STEP)); if (++n % 36 === 0) await ctx.yield(); } await ctx.yield(); }
      // copses where four parcels meet: six to nine trees close together, so the plain reads as country and not as dots
      for (let i = -5; i <= 5; i++) {
        for (let j = -7; j <= 2; j++) {
          let x = 190 * i, z = 190 * j; for (let k = 0; k < 3; k++) { x = ex(i, z); z = ez(j, x); }
          if (!open(x, z) || dr() > 0.4) continue;
          for (let k = 0, n = dr.int(6, 9); k < n; k++) { const a = dr() * 6.28, r = 3 + 17 * Math.sqrt(dr()); tree(x + Math.cos(a) * r, z + Math.sin(a) * r * 0.7); }
        }
        await ctx.yield();
      }
      for (const [dx, dz] of [[-17, 9], [-12, -14], [15, -16], [21, 6]]) tree(farm2[0] + dx, farm2[1] + dz);   // the second farmstead's shelter trees
      {   // the hamlet's churchyard trees and windbreak (a stream of their own), and the long shadows of its church and barn
        const hr = ctx.core.makeRng('the-sea-above:hamlet:' + ctx.seed);
        for (let k = 0; k < 16; k++) { const a = k * 0.42 + hr.range(-0.12, 0.12), r = k < 9 ? hr.range(27, 34) : hr.range(48, 66); tree(hamlet[0] + Math.cos(a + 2.2) * r * 1.25, hamlet[1] + Math.sin(a + 2.2) * r, hr); }
        shadow(hamlet[0], hamlet[1], 30, 13); shadow(hamlet[0] + 38, hamlet[1] + 20, 9, 14);
      }
      // a ring of trees round the cut field, and round bales left in rows on its stubble
      for (let k = 0; k < 26; k++) { const f = k / 26 * 4, s = Math.floor(f), t = (f - s) * 2 - 1, e2 = 1.04, lp = s === 0 ? [t, e2] : s === 1 ? [e2, t] : s === 2 ? [-t, -e2] : [-e2, -t]; if (dr() < 0.7) { const w = loc(CUT[0] + lp[0] * CUT[2] + dr.range(-4, 4), CUT[1] + lp[1] * CUT[3] + dr.range(-4, 4)); tree(w[0], w[1]); } }
      for (let k = 0, tries = 0; k < 64 && tries < 700; tries++) {
        const w = loc(CUT[0] + dr.range(-0.92, 0.92) * CUT[2], CUT[1] + dr.range(-0.9, 0.9) * CUT[3]);
        if (bales.some((b) => Math.hypot(b[0] - w[0], b[1] - w[1]) < 11) || Math.hypot(w[0] - farm2[0], w[1] - farm2[1]) < 30) continue;
        bales.push(w); k++;
      }
      const inst = (geo, mat, list, name) => { const im = new THREE.InstancedMesh(geo, mat, list.length); list.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.name = name; scene.add(im); return im; };
      await ctx.yield();
      {   // the full crown only where the flight looks down on the trees from near; the rest, seen small on the horizon, are lighter
        const tc = new THREE.Color(), nearL = [], farL = [], nearT = [], farT = [];
        trees.forEach((m, i) => { const hi = hiDist(m.elements[12], m.elements[14]) < 360; (hi ? nearL : farL).push(m); (hi ? nearT : farT).push(treeTint[i]); });
        for (const [geo, list, tints] of [[fieldTreeGeometry(6), nearL, nearT], [fieldTreeGeometry(3), farL, farT]]) {
          if (!list.length) continue;
          const im = inst(geo, farMat, list, 'field-trees'); tints.forEach((c, i) => im.setColorAt(i, tc.setRGB(c[0], c[1], c[2]))); if (im.instanceColor) im.instanceColor.needsUpdate = true;
          await ctx.yield();
        }
      }
      await ctx.yield();
      inst(hedgeGeometry(), farMat, hedges, 'hedgerows');
      await ctx.yield();
      const bm = [], bAng = th + rowA * 0.2;
      for (const [x, z] of bales) { put(bm, x, z, 1.5, 1.5, 1.5, bAng + dr.range(-0.3, 0.3) + (dr() < 0.3 ? 1.57 : 0), 0.08); shadow(x, z, 2.4, 2.6); }
      inst(baleGeometry(), builtMat, bm, 'bales');
      const blobMat = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uCol: { value: col('#101c2a', 0.6) }, uOpacity: { value: amber ? 0.62 : 0.58 } },
        vertexShader: BLOB_VERT, fragmentShader: BLOB_FRAG, fog: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
      inst(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), blobMat, shadows, 'plain-shadows').renderOrder = 1;
    }
    await ctx.yield();

    // ---------- 9 built things: windmill, barn, fence, kite, lighthouse, hulls, the anchor chain ----------
    const mats = S.makeMaterials({ night: 0.1, beam: 30, lampDay: 1 });
    for (const m of [mats.facade, ...mats.facades]) seaPatch(m);
    const mill = S.makeBuilding({ rng: rng.fork('mill'), style: 'windmill', mats, height: rng.range(17, 20), bladeSpeed: 0.55 * breeze,
      position: [millX, heightAt(millX, millZ) - 0.2, millZ], rotationY: 0.55 * mir, palette: { wall: '#ebe3d0', roof: '#5a3a26', sail: '#f4ead2' } });
    scene.add(mill.object);
    // THE BREACH, a main event that IS the journey: it follows metres flown. The climb runs linearly in metres from the nadir cue to
    // the re-entry cue, as the hero asks. THE DIVE BEGINS AT THE WINDMILL, by the mill's own measure: the snout breaks the ceiling
    // when the lens is one sail's length of route short of the place where it passes the mill (dMill). The sail's length is read
    // off the sails the mill's builder made (MILL_SAIL, hub to tip: 10.5 to 12.4 m as the mill is drawn 17 to 20 m tall), so the
    // lens is still a sail's reach from the mill as the eye goes up to the sea beyond it; the cue falls where it falls. From there
    // to the nadir cue the dive runs linearly in metres too, slower than the climb, and comes down large and unhurried in front
    // of the lens. The two rates are joined by a short quadratic blend round the nadir (DIVE_W metres either side), so the whale
    // gathers speed into the climb instead of kicking off. (The clock is laid here, after the mill is built: nothing before this
    // line reads it.)
    let MILL_SAIL = 0;
    mill.object.traverse((m) => { if (m.isMesh && m.geometry !== mill.geometry) { m.geometry.computeBoundingBox(); MILL_SAIL = Math.max(MILL_SAIL, m.geometry.boundingBox.max.x); } });
    const dMill = distOf(new THREE.Vector3(trackX(millZ), pathYAt(millZ), millZ)), dS = dMill - MILL_SAIL;
    const tmg = hero.timing, DIVE_W = 30, kIn = (tmg.nadir - tmg.exit) / (dN - dS), kOut = (tmg.enter - tmg.nadir) / (dE - dN);
    const progAt = (u) => { const x = u * L - dN, bl = x < -DIVE_W ? 0 : x > DIVE_W ? x : ((x + DIVE_W) * (x + DIVE_W)) / (4 * DIVE_W); return clamp(tmg.nadir + kIn * x + (kOut - kIn) * bl, 0, 1); };
    await ctx.yield();
    const barnGeo = barnGeometry(rng.fork('barn'));
    await ctx.yield();
    const barn = new THREE.Mesh(barnGeo, builtMat);
    barn.position.set(barnX, heightAt(barnX, barnZ) - 0.15, barnZ); barn.rotation.y = -0.3 * mir + rng.range(-0.15, 0.15); barn.name = 'barn'; scene.add(barn);
    const barn2 = new THREE.Mesh(barnGeo, builtMat);                                              // the neighbour's barn by the cut field
    barn2.position.set(farm2[0], H0(farm2[0], farm2[1]) - 0.15, farm2[1]); barn2.rotation.y = th + rng.range(0.5, 1.1); barn2.scale.setScalar(0.9); scene.add(barn2);
    await ctx.yield();
    {   // The hamlet on the far plain: a white church with a tall spire (the land's one reach toward the sea above) and ONE barn
      // with its silo. Of the barns this sea's fields could carry, the one that stays is the church's own: a church does not stand
      // alone in the fields, it has a farm at its gate. (The home field's barn and the neighbour's by the cut field are live's.)
      const bld = (geo, x, z, ry, sc, name) => { const m = new THREE.Mesh(geo, builtMat); m.position.set(x, heightAt(x, z) - 0.15, z); m.rotation.y = ry; m.scale.setScalar(sc); m.name = name; scene.add(m); return m; };
      bld(chapelGeometry(), hamlet[0], hamlet[1], th + 2.4 * mir, 1, 'church');
      await ctx.yield();
      bld(barnGeo, hamlet[0] + 38, hamlet[1] + 20, th + 0.6, 1.15, 'hamlet-barn');
    }
    // The fence, in eight runs that share their end posts: it follows the road on past the place the flight leaves it. The first
    // five runs are live's and take their forks from the main stream as live does; the three that carry the fence on draw from
    // one stream of their own, so nothing dealt after the fence is touched by them.
    const fenceOn = ctx.core.makeRng(ctx.core.hashSeed('the-sea-above:fence-on:' + ctx.seed));
    for (let k = 0; k < 8; k++) {
      const fpts = []; for (let z = 46 - k * 88; z >= 46 - (k + 1) * 88; z -= 8) fpts.push([trackX(z) + 3.7 * mir, 0, z]);
      scene.add(S.makeFence({ rng: k < 5 ? rng.fork('fence' + k) : fenceOn, mats, type: 'rail', points: fpts, heightAt, palette: { wood: '#8a6a48' } }).object);
      await ctx.yield();
    }
    // a kite on a long string from the fence, 250 m down the track at a height drawn for the visit: the string is a ribbon that keeps
    // its width on screen. Its dance runs on the world's clock from a phase of its own.
    const kiteAnchor = new THREE.Vector3(trackX(-250) + 3.7 * mir, heightAt(trackX(-250) + 3.7 * mir, -250) + 1.25, -250);
    const kiteBase = kiteAnchor.clone().add(new THREE.Vector3(15 * mir, rng.range(27, 34), -46));
    const kiteT0 = ctx.core.makeRng(ctx.core.hashSeed('the-sea-above:kite:' + ctx.seed))() * 60;
    const kiteCols = vr.pick([[PALETTE[6], '#fff2d0'], ['#ffd23a', '#ff5a3a'], ['#ff7ab0', '#fff2d0'], ['#fff6e0', '#1f8fb8']]);
    const kiteU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: { value: 0 }, uColA: { value: col(kiteCols[0], 1.15) }, uColB: { value: col(kiteCols[1]) } };
    const kite = new THREE.Mesh(kiteGeometry(), new THREE.ShaderMaterial({ uniforms: kiteU, vertexShader: KITE_VERT, fragmentShader: KITE_FRAG, fog: true, side: THREE.DoubleSide }));
    kite.frustumCulled = false; kite.scale.setScalar(1.5); kite.name = 'kite'; scene.add(kite);
    const strU = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uA: { value: kiteAnchor.clone() }, uB: { value: kiteBase.clone() }, uSag: { value: 2.6 }, uPx: { value: 1 / 720 }, uCol: { value: col('#f6f0e2') } };
    const kiteString = new THREE.Mesh(stringGeometry(), new THREE.ShaderMaterial({ uniforms: strU, vertexShader: STRING_VERT, fragmentShader: STRING_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    kiteString.frustumCulled = false; kiteString.renderOrder = 2; kiteString.name = 'kite-string'; scene.add(kiteString);

    // the lighthouse hangs lamp-down from the sea beside the last run, on the far side from the whale; its beam rakes across the portal
    await ctx.yield();
    const lh = S.makeBuilding({ rng: rng.fork('lighthouse'), style: 'lighthouse', mats, height: lhH, width: 11, cottage: false, stripes: 3,
      beamSpeed: Math.PI / 3, beamLength: 62, beamRadius: 4, palette: { wall: '#f4f0e6', accent: '#d8452f', roof: '#8a2a22' } });
    lh.object.rotation.x = Math.PI; lh.object.position.set(LX, CEIL + 1.9, LZ);
    const lampY = CEIL + 1.9 - (lhH * 0.76 + 0.22 + (0.7 + lhH * 0.11) / 2);
    const beamTilt = Math.min(0.56, Math.atan2(endP.y - lampY, Math.hypot(LX - endP.x, LZ - endP.z)));
    let beamMesh = null;
    // ONE BEAM: the kit's lamp throws two arms; here only the arm that points down to the fields is drawn (the second half of the
    // kit beam's index). It turns once in six seconds on the world's clock, from the phase the lighthouse's own fork deals.
    lh.object.traverse((m) => { if (m.isMesh && m.material === mats.beam) { m.geometry.rotateZ(-beamTilt); m.geometry.setDrawRange(m.geometry.index.count / 2, m.geometry.index.count / 2); beamMesh = m; } });
    scene.add(lh.object);
    const lampPos = new THREE.Vector3(LX, lampY, LZ);
    await ctx.yield();
    // So that it reads as a lighthouse hanging from the sea, not as flipped geometry: it stands (hangs) on its islet, a rock of
    // four knuckles that comes down through the surface (isletGeometry) with broken water round it and its shadow on the water
    // inside that ring (CEIL_FRAG, spot 11); weed fringes the rock at the waterline, a few tufts hang lower on it and on the
    // tower, which is stained green where it leaves the rock; and the arm of its beam that points down is carried on to the
    // ground, where a pool of lamplight rakes round over the fields every six seconds.
    const isletGeo = isletGeometry(), rock = isletGeo.userData, isletTurn = ctx.core.makeRng('the-sea-above:islet:' + ctx.seed)() * 6.28;
    const ISLET_R = rock.radius;                                      // the rock's radius: its greatest reach at the waterline (16.8 m)
    spots[11].set(LX, LZ, rock.mean, 1);                             // (its mean reach at the waterline, 12.7 m: the ring of broken water is as wide again)
    { const c = Math.cos(isletTurn), sn2 = Math.sin(isletTurn); rock.knuckles.forEach(([kx, kz, kr], i) => CU.uRock.value[i].set(LX + kx * c + kz * sn2, LZ - kx * sn2 + kz * c, kr)); }
    const islet = new THREE.Mesh(isletGeo, builtMat); islet.position.set(LX, CEIL + 0.4, LZ); islet.rotation.y = isletTurn; islet.name = 'islet'; scene.add(islet);
    await ctx.yield();
    {
      const cA = lh.geometry.attributes.color, pA = lh.geometry.attributes.position;       // the tower: local y runs from the water (0) to the lamp
      if (cA && pA) for (let i = 0; i < cA.count; i++) {
        const y = pA.getY(i), k = 1 - smoothstep(rock.root + 1.5, rock.root + 8.5, y + 1.5 * Math.sin(pA.getX(i) * 1.7 + pA.getZ(i) * 2.3)), sp = k * (0.5 + 0.5 * Math.sin(y * 2.1 + pA.getX(i) * 3.1));   // (weed-stained only where it leaves the rock: the stripes read from there to the lamp)
        cA.setXYZ(i, cA.getX(i) * lerp(1, 0.5 + 0.2 * sp, k), cA.getY(i) * lerp(1, 0.64 + 0.2 * sp, k), cA.getZ(i) * lerp(1, 0.48 + 0.16 * sp, k));
      }
      if (cA) cA.needsUpdate = true;
      const wr = ctx.core.makeRng('the-sea-above:lhtufts:' + ctx.seed), wN = 22, wg = weedGeometry().scale(0.2, 0.2, 0.2);
      const tufts = new THREE.InstancedMesh(wg, seaPatch(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), { sway: true }), wN);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < wN; i++) {
        const a = wr() * 6.28, onTower = i >= 16, dpt = onTower ? rock.root + wr.range(0, 4.5) : wr.range(1.6, 5.4), r = onTower ? 5.6 - dpt * 0.06 : rock.reach(a + isletTurn, dpt) * 0.96, k = wr.range(6, 10) * (onTower ? 0.4 : 0.7);   // (on the rock: at the rock's own face on that bearing and depth; on the tower: from where it leaves the rock)
        tufts.setMatrixAt(i, m4.compose(p.set(LX + Math.cos(a) * r, CEIL + 0.4 - dpt, LZ + Math.sin(a) * r), q.setFromAxisAngle(Y, wr() * 6.28), sc.set(k, k, k)));
      }
      tufts.instanceMatrix.needsUpdate = true; tufts.frustumCulled = false; tufts.name = 'lighthouse-weed'; scene.add(tufts);
    }
    const rakeDir = new THREE.Vector3(-Math.cos(beamTilt), Math.sin(beamTilt), 0), rakeLen = (lampY - H0(LX, LZ)) / Math.max(Math.sin(beamTilt), 0.2);
    if (beamMesh) {
      const lamp = new THREE.Color('#fff0b8'), rake = new THREE.Mesh(rakeGeometry(rakeLen, 0.5, 0.5 + 3.5 * rakeLen / 62, [lamp.r * 2.2, lamp.g * 2.2, lamp.b * 2.2]).rotateZ(-beamTilt), mats.beam);
      rake.renderOrder = 3; rake.frustumCulled = false; rake.name = 'beam-to-the-fields'; beamMesh.add(rake);
    }
    await ctx.yield();

    // hulls afloat on the ceiling, keels down: one moored to the lighthouse's rock, one that sails a wide slow circle (HULL_R) out
    // over the first fields, so it is there at every clock, and one that has let its anchor go. Each sways from a phase of its own.
    // THE MOORED HULL lies a mooring's length (MOOR) from the islet's centre: the rock's radius (ISLET_R, 16.8 m) plus the hull's
    // half length (HULL_HALF, 7.4 m) plus 2 m of water, 26.2 m in all, on a bearing drawn from a stream of the hull's own; its bow
    // is to the rock, as a moored boat lies, swung up to 20 degrees either way (the same stream). It keeps out of the flight's
    // way by a margin in metres: the whole hull, with the 3 m it rides to and fro on its mooring (HULL_RIDE, update), stays
    // 12 m or more clear in plan of the flight line and of the ring's axis for 200 m beyond the ring, so its middle is 22.4 m or
    // more from both: the dice are thrown first, then the test, and they are thrown again until it passes.
    const hullGeo = hullGeometry(), boats = [], HULL_R = 70, HULL_HALF = 7.4, HULL_RIDE = 3, MOOR = ISLET_R + HULL_HALF + 2;
    await ctx.yield();
    {
      const mr = ctx.core.makeRng(ctx.core.hashSeed('the-sea-above:moored-hull:' + ctx.seed)), b0 = [LX, LZ, 0];
      const lineClear = (x, z) => { let m = 1e9; for (let d = 0; d <= L + 200; d += 2) { path.posAtDist(d, _q); m = Math.min(m, Math.hypot(_q.x - x, _q.z - z)); } return m; };   // (beyond its end the path runs straight on along the ring's axis)
      for (let tries = 0; tries < 200; tries++) {
        const bear = mr() * Math.PI * 2, swing = (mr.range(-20, 20) * Math.PI) / 180;
        b0[0] = LX + Math.cos(bear) * MOOR; b0[1] = LZ + Math.sin(bear) * MOOR; b0[2] = Math.atan2(LX - b0[0], LZ - b0[1]) + swing;
        if (lineClear(b0[0], b0[1]) >= 12 + HULL_HALF + HULL_RIDE) break;
      }
      const br = rng.fork('boats');
      const where = [[b0[0], b0[1], 1.0, b0[2], 0.3], [240 * mir, -380, 1.5, br() * 6.28, br.range(0.5, 1.1)], [chainAt[0], chainAt[1], 1.7, Math.atan2(chDir.x, chDir.z), 0.32]];
      for (const [x, z, s, a, v] of where) {
        const mesh = new THREE.Mesh(hullGeo, builtMat);
        mesh.scale.setScalar(s); mesh.rotation.order = 'YXZ'; mesh.name = 'hull'; scene.add(mesh);
        boats.push({ mesh, x, z, dx: Math.sin(a), dz: Math.cos(a), v, ph: br() * 6.28, s });
      }
    }
    // the chain: pairs of links instanced straight down, bent in the shader to the dragged foot; the anchor ploughs a furrow in the wheat
    const CHAIN_TOP = CEIL - 2.6, CH_LAG = 23, uCh = CH_D / L;          // the hull is driven by the flight: it is over its marked spot when the lens passes
    const chainN = Math.ceil((CHAIN_TOP + 6) / (2 * LINK_PITCH));
    const chain = new THREE.InstancedMesh(chainPairGeometry(), seaPatch(new THREE.MeshLambertMaterial({ vertexColors: true }), { chain: true }), chainN);
    { const m4 = new THREE.Matrix4(); for (let i = 0; i < chainN; i++) chain.setMatrixAt(i, m4.makeTranslation(0, CHAIN_TOP - i * 2 * LINK_PITCH, 0)); }
    chain.instanceMatrix.needsUpdate = true; chain.frustumCulled = false; chain.name = 'anchor-chain'; scene.add(chain);
    // weed has grown on it: tufts every few metres, thickest near the sea, bent and swung with the chain by the same shader
    const weedN = 15, weed = new THREE.InstancedMesh(weedGeometry(), seaPatch(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), { chain: true }), weedN);
    { const m4 = new THREE.Matrix4(); for (let i = 0; i < weedN; i++) weed.setMatrixAt(i, m4.makeTranslation(0.3 * Math.sin(i * 2.4), CHAIN_TOP - 3 - i * 5.2 - 2.5 * Math.sin(i * 1.9) - i * i * 0.09, 0.3 * Math.cos(i * 2.4))); }
    weed.instanceMatrix.needsUpdate = true; weed.frustumCulled = false; weed.name = 'chain-weed'; scene.add(weed);
    await ctx.yield();
    const anchor = new THREE.Mesh(anchorGeometry(), builtMat); anchor.name = 'anchor'; anchor.scale.setScalar(1.25); scene.add(anchor);
    {
      const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-chDir.z, chDir.x));
      anchor.quaternion.setFromAxisAngle(new THREE.Vector3(chDir.z, 0, -chDir.x), 1.12).multiply(yaw);       // shank laid over toward the hull, one fluke dug in
    }
    const AN_REACH = 6.5 * 1.25 * Math.sin(1.12), AN_UP = 6.5 * 1.25 * Math.cos(1.12);                        // from the crown to the ring
    await ctx.yield();

    // ---------- 10 fauna: whales in the ceiling, the fish loop, a bait ball, rays, swallows, gulls ----------
    // blue-grey underneath too (a pale belly reads as an aircraft), under the hero's cool light: sea light from above, little warm bounce
    const whaleLight = { ...fLight, sunColor: sunCol.clone().lerp(col('#eaf6ff'), amber ? 0.7 : 0.35), ground: aqua.clone().lerp(wheatA, 0.3), groundIntensity: 0.5 };
    const whaleLook = { length: 27, light: whaleLight, top: '#2c6f94', belly: '#7fb4cc', caustics: 0.4 };
    const W1Y = C - 4.2, W1SAG = 5;                                 // whale 1 hangs belly-down through the surface, lowest when the lens finds it
    // whale 1 is routed by its SHADOW: the sun throws it down the track, where it overtakes the lens and slides on ahead
    const uW = 0.21, crossOpt = { path, u: uW, window: 0.26, span: 760, side: 1, bow: 0, sag: W1SAG };
    {
      const sK = W1Y / sunDir.y, dQ = uW * L + 46, P0 = path.posAtDist(dQ, new THREE.Vector3()), tQ = path.tangentAtDist(dQ, new THREE.Vector3());
      tQ.y = 0; tQ.normalize();
      const wx = P0.x + sunDir.x * sK, wz = P0.z + sunDir.z * sK, P = new THREE.Vector3(), T = new THREE.Vector3();
      let lead = 0, bd = 1e9;
      for (let l = -uW * L; l <= 460; l += 3) { path.posAtDist(uW * L + l, P); path.tangentAtDist(uW * L + l, T); T.y = 0; T.normalize(); const al = Math.abs((wx - P.x) * T.x + (wz - P.z) * T.z); if (al < bd) { bd = al; lead = l; } }
      path.posAtDist(uW * L + lead, P); path.tangentAtDist(uW * L + lead, T); T.y = 0; T.normalize();
      crossOpt.lead = lead; crossOpt.offset = (wx - P.x) * -T.z + (wz - P.z) * T.x; crossOpt.height = W1Y - P.y;
      crossOpt.angle = (Math.atan2(tQ.x * -T.z + tQ.z * T.x, tQ.x * T.x + tQ.z * T.z) * 180) / Math.PI - 9 * mir;   // nearly along the track: the shadow runs on ahead down it
    }
    await ctx.yield();
    const whale1 = F.makeWhale({ rng: rng.fork('whale1'), ...whaleLook, length: 28, count: 3, cross: crossOpt });   // a pod: a 28 m whale (the design's length: none but the hero is longer) and two smaller
    await ctx.yield();
    const cp = F.crossPoints(path, crossOpt), w1Dir = cp[cp.length - 1].clone().sub(cp[0]);
    // The kit strings a pod's companions out 30 to 70 m behind its leader. Here they are brought in to the leader's flanks (metres
    // to its side, up, and behind), so the pod is one group.
    // HOW A WHALE LEAVES. The pod (whale 1) and the two pairs (whales 2 and 4) keep live's own lines: their ways sag 5 and 4 m,
    // so they hang belly-down through the surface from end to end (whale 1's ends lie 0.5 m above the water's level, the
    // pairs' 0.8 m under it), and the kit ends each open way as it ends any. Whale 3, its companion and the rays END UP IN THE
    // SEA (sag: the two ends of the way lie well above the surface): they come down out of the water, hang belly-down through
    // it in the middle of their way and sink back up into it, leaving their blue shape in the water.
    const packPod = (o, dir, offs) => {
      const a = o.geometry.attributes.iA, b = o.geometry.attributes.iB, l = Math.hypot(dir.x, dir.z) || 1, px = -dir.z / l, pz = dir.x / l;
      offs.forEach(([lat, up, back], k) => { if (k + 1 < o.count) { a.setXYZ(k + 1, lat * px, up, back); b.setW(k + 1, lat * pz); } });
      a.needsUpdate = b.needsUpdate = true;
    };
    packPod(whale1, w1Dir, [[11, -1.5, 8], [-10, 1, 4]]);
    const ring = (cx, cz, rx, rz, y, n, dir, a0 = 0.98) => { const pts = []; for (let i = 0; i < n; i++) { const a = a0 + dir * (i / n) * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, y + 0.4 * Math.sin(a * 3), cz + Math.sin(a) * rz]); } return pts; };
    // a broadside crossing placed in the sun's glow as the lens at uRef sees it: mid-route there, drifting across the view
    const sunAzX = Math.sin(ar), sunAzZ = -Math.cos(ar);
    const glowCross = (uRef, elDeg, o) => {
      const pr = path.pointAt(uRef), dg = (C - 4.5 - pr.y) / Math.tan((elDeg * Math.PI) / 180), gx = pr.x + sunAzX * dg, gz = pr.z + sunAzZ * dg;
      const lead = dg * 0.96, P = path.posAtDist(uRef * L + lead, new THREE.Vector3()), T = path.tangentAtDist(uRef * L + lead, new THREE.Vector3()); T.y = 0; T.normalize();
      const off = clamp((gx - P.x) * -T.z + (gz - P.z) * T.x, -120, 120);
      return { path, u: uRef, lead, offset: off, side: off > 0 ? -1 : 1, bow: 0, height: C - 4.5 - P.y, ...o };
    };
    // whale 2 and a smaller companion hang broadside in the glow over the first fields, in the entry frame from the first moment
    const w2r = rng.fork('whale2');
    const w2Cross = glowCross(0.09, deepM ? 21 : glowEl + 1, { window: 0.25, angle: 88, span: 150, sag: 4 }), w2p = F.crossPoints(path, w2Cross), w2Dir = w2p[w2p.length - 1].clone().sub(w2p[0]);
    const whale2 = F.makeWhale({ rng: w2r, ...whaleLook, length: 28, count: 2, cross: w2Cross });
    packPod(whale2, w2Dir, [[10, -1.5, 6]]);
    await ctx.yield();
    // and a second pair crosses side-on, higher, while the gaze is lifted to the pod (a stream of its own: nothing else is reseeded)
    const w4Cross = glowCross(0.27, 31, { window: 0.14, angle: 80, span: 300, sag: 4 }), W4P = [10, 6];   // (live's own line)
    const whale4 = F.makeWhale({ rng: ctx.core.makeRng('the-sea-above:w4:' + ctx.seed), ...whaleLook, length: 28, count: 2, cross: w4Cross });
    { const p4 = F.crossPoints(path, w4Cross); packPod(whale4, p4[p4.length - 1].clone().sub(p4[0]), [[W4P[0], -1.5, W4P[1]]]); }
    await ctx.yield();
    // WHALE 3 AND ITS COMPANION swim beside the last run, by this sea's rule for whales (down out of the water, on beside the run,
    // up again). The crossing is stated in metres of route: it begins (both still up inside the sea) when the lens is at the place
    // where the big whale goes back in (the re-entry cue, dE) and ends, both up in the sea again, when the lens is W3_END metres
    // short of the ring; in the middle half of it they hang belly-down through the water. Each swims a course of its own on the
    // open-sea side of the run (away from the lighthouse's rock), its middle 110 m and 145 m ahead of where the lens is at
    // mid-crossing (the companion ahead of the leader and nearer the run's line); offset and the companion's later start come
    // from each one's own stream.
    // THE BEARING keeps the pair BESIDE the run: neither course crosses the run's line, and neither comes nearer to it than
    // W3_CLEAR (20 m) in plan anywhere along its way. A course is a straight line in plan, span metres long, whose middle lies
    // offset metres out from the line and whose inner end lies span / 2 * sin(angle) nearer than that; so the greatest angle that
    // leaves the inner end W3_CLEAR out is asin((offset - W3_CLEAR) / (span / 2)), and that is each whale's angle to the run
    // (no angle is drawn). That sum measures from the run's heading at the course's middle. The run's line itself bends 2.7 degrees toward
    // the open sea between the leader's middle and the ring, so the course's own points (F.crossPoints, joined) are then measured
    // against the line itself (every half metre of route within one span of the course's middle; beyond the ring the line runs
    // straight on) and the angle is brought down by the least that gives W3_CLEAR: 2.2 degrees for the leader, 0.04 or less for
    // the companion (seeds 1 to 120). So the leader swims at 20 to 25 degrees to the run, from 75 to 92 m out of its line (182 m
    // short of the ring) in to 20 m (13 to 17 m beyond the ring), and goes back up through the water 19 to 21 m short of the
    // ring, 35 to 39 m out; the companion at 17.5 to 24.5 degrees, from 59 to 75 m out (97 to 104 m short of the ring) in to 20 m
    // (35 to 43 m beyond the ring), and goes up 15 to 21 m beyond the ring, 27 to 30 m out. Neither comes nearer the ring's
    // centre than 24 m, nor the rock than 45 m.
    const W3_END = 50, W3_CLEAR = 20, w3r = rng.fork('whale3'), w3b = ctx.core.makeRng(ctx.core.hashSeed('the-sea-above:whale3b:' + ctx.seed));
    const w3Cross = (r, d0, d1, lead, off, deep, sag, span) => {
      const u = (d0 + d1) / (2 * L), P = path.posAtDist(u * L + lead, new THREE.Vector3());
      const offset = -mir * (off + 8 * r()), plain = (Math.asin(clamp((Math.abs(offset) - W3_CLEAR) / (span / 2), 0, 1)) * 180) / Math.PI;
      const o = { path, u, window: (d1 - d0) / (2 * L), lead, offset, angle: plain, side: mir, span, bow: 0, sag, height: C - deep - P.y };
      const line = [], mid = u * L + lead;                            // the run's line beside the course, in plan
      for (let d = mid - span; d <= mid + span; d += 0.5) { path.posAtDist(d, _q); line.push(_q.x, _q.z); }
      const least = (angle) => {                                      // the least distance in plan from the course at this angle to that line
        const pts = F.crossPoints(path, { ...o, angle }); let m = 1e9;
        for (let i = 0; i + 1 < pts.length; i++) {
          const ax = pts[i].x, az = pts[i].z, bx = pts[i + 1].x - ax, bz = pts[i + 1].z - az, bb = bx * bx + bz * bz || 1;
          for (let j = 0; j < line.length; j += 2) { const t = clamp(((line[j] - ax) * bx + (line[j + 1] - az) * bz) / bb, 0, 1), x = ax + bx * t - line[j], z = az + bz * t - line[j + 1]; m = Math.min(m, x * x + z * z); }
        }
        return Math.sqrt(m);
      };
      let lo = o.angle, hi = lo;                                      // down a degree at a time to the first angle that clears, then halved back up to the greatest that does
      while (lo > 0 && least(lo) < W3_CLEAR) { hi = lo; lo = Math.max(lo - 1, 0); }
      for (let i = 0; i < 12 && hi > lo; i++) { const a = (lo + hi) / 2; if (least(a) < W3_CLEAR) hi = a; else lo = a; }
      o.angle = lo;
      return o;
    };
    const w3CrossA = w3Cross(w3r, dE, L - W3_END, 110, 56, 4.5, 14, 190), w3CrossB = w3Cross(w3b, dE + 8 + 10 * w3b(), L - W3_END + 12, 145, 41, 6.5, 15, 140);
    const w3Courses = [F.crossPoints(path, w3CrossA), F.crossPoints(path, w3CrossB)], w3Dir = w3Courses[0][6].clone().sub(w3Courses[0][0]);
    const whale3 = F.makeWhale({ rng: w3r, ...whaleLook, length: 28, count: 1, cross: w3CrossA });
    const whale3b = F.makeWhale({ rng: w3b, ...whaleLook, length: 24, count: 1, cross: w3CrossB });
    scene.add(whale3b.object);
    scene.add(whale1.object, whale2.object, whale3.object, whale4.object);
    await ctx.yield();

    // the fish: a dense silver ribbon that pours out of the sea beside the track, runs back past the lens on one side, turns under
    // the flight line and swims on WITH the lens along the other side, then crosses under it and climbs to the sea beside the chain.
    // rb(metres past the cue, metres to the chain's side, height above the flight line | world height)
    const rb = (dd, lat, y, world = false) => { const q = side(dA + dd, lat * mir); return new THREE.Vector3(q[0], world ? y : q[2] + y, q[1]); };
    const fishPts = [rb(40, 52, 131, true), rb(48, 40, 100, true), rb(55, 26, 62, true), rb(60, 15, 9), rb(45, 9.5, 1), rb(24, 8, -4), rb(9, 0, -7.5),
      rb(22, -8.5, -5), rb(55, -9.5, -2), rb(90, -8, 0), rb(118, 0, -9), rb(134, 13, 2), rb(141, 30, 70, true), rb(136, 44, 104, true), rb(126, 52, 131, true),
      rb(100, 60, 139, true), rb(66, 62, 140, true)];
    { const a = rb(44, 46, 0, true), b = rb(131, 48, 0, true); spots[8].set(a.x, a.z, 8.5, 1); spots[9].set(b.x, b.z, 8.5, 1); }
    const fishLen = new THREE.CatmullRomCurve3(fishPts, true, 'centripetal').getLength();
    const fishN = Math.round(vr.range(520, 620) * dens * Q), fishSize = rng.range(5.6, 6.6), fishLight = { ...fLight, sunIntensity: 4 };
    const schools = [0, 1 / 3, 2 / 3].map((start, i) => F.makeFishSchool({ rng: i < 2 ? rng.fork('fish' + i) : ctx.core.makeRng('the-sea-above:fish2:' + ctx.seed), species: 'sardines', form: 'school', count: Math.round(fishN * 0.64), size: fishSize, speed: 15, ...(i === 2 ? { lod: 'low' } : null),
      route: fishPts, closed: true, start, spread: [5.5, 4, fishLen * 0.31], wander: [1.1, 0.8, 0.8, 0.5], light: fishLight, top: '#3f6f8a', belly: '#e6f1f6' }));
    for (const f of schools) scene.add(f.object);
    await ctx.yield();
    // past the re-entry, hanging just under the water beside the level run: a turning ball of bait fish, then a squadron of rays
    const ballAt = side(dE + 52, -mir * 36), ballPos = new THREE.Vector3(ballAt[0], C - 12.5, ballAt[1]);
    const ball = F.makeFishSchool({ rng: rng.fork('ball'), species: 'sardines', form: 'baitball', count: Math.round(430 * dens * Q), lod: 'low', size: 5.2, spread: [10.5, 8], center: ballPos, radius: 5, drift: 0.5,
      light: fishLight, top: '#3f6f8a', belly: '#e6f1f6' });
    await ctx.yield();
    // A vee of rays swims the flight's own line, RAY_LEAD metres ahead of the lens and to the whale's side of it
    // (12 to 18 m, drawn: the side the gaze comes round from), while the lens climbs from the crown toward the run. Like the whales they come down out of the sea and go
    // up into it again, and their time out of the water is stated by places: they break the surface when the lens is at the
    // re-entry cue (dE), and they are back inside the sea at the place where the route has climbed to within RAY_UNDER metres of
    // their level (dRay1, read off the route): seen from below all the while, their whole planform against the bright net, and
    // never from their own height, where a ray is a pencil line.
    const rayRng = rng.fork('rays'), rayN = rng.int(5, 6), rayJ = rng(), rayS = rng();
    const RAY_LEAD = 40, RAY_UNDER = 20, RAY_SAG = 13, rayY = C - 2.5 - rayS, rayOut = Math.sqrt((C - rayY + 0.4) / (4 * RAY_SAG));   // rayOut: the share of the lane, either side of its middle, for which the rays hang below the surface
    let dRay1 = dE; while (dRay1 < L - RAY_LEAD - 2 && path.posAtDist(dRay1, _q).y < rayY - RAY_UNDER) dRay1 += 2;
    const rayHalf = (dRay1 - dE) / (4 * rayOut), rayMidD = (dE + dRay1) / 2, uR0 = (rayMidD - rayHalf) / L, uR1 = Math.min((rayMidD + rayHalf) / L, (L - RAY_LEAD) / L);
    const lanePt = (uu) => { const q = side(uu * L + RAY_LEAD, -(12 + 6 * rayJ) * mir); return new THREE.Vector3(q[0], rayY, q[1]); };
    const rayA = lanePt(uR0), rayB = lanePt(uR1), rayMid = rayA.clone().lerp(rayB, 0.5), rayHead = rayB.clone().sub(rayA).normalize();
    const rayBow = (() => { const m = lanePt((uR0 + uR1) / 2).sub(rayMid); return m.x * -rayHead.z + m.z * rayHead.x; })();   // the lane bends as the flight does
    const rayLane = { length: 1, posAtDist: (d, out = new THREE.Vector3()) => out.copy(rayMid), tangentAtDist: (d, out = new THREE.Vector3()) => out.copy(rayHead) };
    // (sag: both ends of the lane lie RAY_SAG metres higher than its middle, well above the surface)
    const rayCross = { path: rayLane, u: (uR0 + uR1) / 2, lead: 0, angle: 0, side: 1, span: rayA.distanceTo(rayB), window: (uR1 - uR0) / 2, offset: 0, height: 0, bow: rayBow, rise: 0, sag: RAY_SAG };
    const rays = F.makeMantaRay({ rng: rayRng, count: rayN, span: 4.6, spread: [3, 0.6, 3], cross: rayCross, light: fLight, top: '#27495e', belly: '#86abbd', caustics: 0.4 });
    // they fly as one vee (the kit scatters a group at random along 30 m and more of its route)
    packPod(rays, rayHead, [[3, -0.4, 4.5], [-3, 0.3, 5], [6, -0.8, 8.5], [-6, 0.5, 9], [0, -1.1, 9.5]]);
    scene.add(ball.object, rays.object);
    await ctx.yield();
    // around the dive, seen from below against the water: a second ball of bait fish hanging beside the hole the whale leaves,
    // and nine rays strung round it in one wheeling flight, so some are always on the arc the gaze can see
    const exitW = toWorld(A.exitPoint), ball2Pos = new THREE.Vector3(exitW.x - 52 * mir, C - 19, exitW.z - 14);
    const xr = ctx.core.makeRng('the-sea-above:dive:' + ctx.seed);     // a stream of its own, so nothing built after this is reseeded
    const ball2 = F.makeFishSchool({ rng: xr.fork('ball2'), species: 'sardines', form: 'baitball', count: Math.round(440 * dens * Q), lod: 'low', size: 8.8, spread: [12, 9.5], center: ball2Pos, radius: 4, drift: 0.4,
      light: fishLight, top: '#3f6f8a', belly: '#e6f1f6' });
    const r2r = xr.fork('rays2'), ray2Route = ring(ball2Pos.x, ball2Pos.z, 38, 30, C - 9, 10, -mir, r2r() * 6.28);
    const rays2 = [F.makeMantaRay({ rng: r2r.fork('g0'), count: 9, span: 6.4, route: ray2Route, closed: true, start: r2r(), speed: 6, spread: [12, 3, 170],
      light: fLight, top: '#27495e', belly: '#e4f2f4', caustics: 0.4 })];
    scene.add(ball2.object); for (const r of rays2) scene.add(r.object);
    await ctx.yield();
    // Swallows and gulls keep off the lens by place. Each call is handed its roam written out, its dealt places held at 3 scatters
    // (maxSigma) and keepClear with the route, which lays the flock's course so that no body, anywhere its roam can take it, comes
    // within 2.5 m of the flown line: 2.0 m of clear air and 0.5 m over, for the lens stands 0.45 m off the line's first point at the
    // crossing (under 1 mm off it from there on). Each of the two calls stands in a build step of its own.
    // The swallows escort the lens along the route's own line from the crossing until the switch in update() hides them at uN + 0.04:
    // keepClear reads that stretch of the route, every 4 m (the kit adds what the curve bulges between two readings; a finer reading makes this build step too long).
    // Roam 1.5 m along world x, 0.8 m up and down, 1.5 m along world z (the preset's: 13.5, 5 and 8 m). Dealt over [24, 10, 40], the
    // preset's [40, 16, 40] scaled (the same draws), so that the nearest swallow flies about 10 m from the lens, as it did.
    // The course is lifted bodily, never lowered (up: the low run is 4 to 6 m over the wheat): 11.5 m in the median world, 23 m at most, not at all in 4 worlds of 200.
    // Made by the kit's stepped form: the same flock to the bit (the same draws, places and course), but the clearing, 60 to 95 ms whole, is handed
    // back to the page in slices, so that no build step carries it.
    const swifts = await F.makeFlockAsync({ rng: rng.fork('swifts'), species: 'swifts', count: rng.int(9, 18), size: 1.5, light: fLight, spread: [24, 10, 40], wander: [1, 0.8, 1.5, 0.7], maxSigma: 3,
      along: { path, side: -5 * mir, up: -1.2, lead: 26, from: 0, to: uN - 0.03, drift: 5 }, keepClear: { path, dist: 2.5, up: true, step: 4, from: 0, to: uN + 0.04 } }, ctx.yield);
    await ctx.yield();
    // The gulls wheel round the lamp on the world's clock; their roam is the preset's, written out: 7.5 m along world x, 2.5 m up and
    // down, 4 m along world z. Their loop stands clear of the route in 178 worlds of 200; in the rest keepClear moves it bodily, by
    // 9.9 m at most.
    const gulls = F.makeFlock({ rng: rng.fork('gulls'), species: 'gulls', count: rng.int(7, 14), light: fLight, center: [LX - rE.x * mir * 8, lampY + 5, LZ - rE.z * mir * 8], radius: 22, height: 5,
      wander: [5, 2.5, 4, 0.35], maxSigma: 3, keepClear: { path, dist: 2.5, step: 2 } });
    scene.add(swifts.object, gulls.object);
    await ctx.yield();

    // ---------- 10b the kelp: a scatter by a rule of the sea ----------
    // Eight clumps of long streamers, each hanging from a raft of holdfasts and canopy in a ring of foam. Their places are dealt
    // from a stream of their own over the sea within KELP_REACH metres of the flight (the best of twelve candidates each time:
    // the one farthest from the clumps already hung, so the forest is spread and not bunched). Kelp keeps out of the open lanes
    // of this sea, each by a margin in metres: KELP_CLEAR from the flight line and from the ring's axis beyond it (60 m: this
    // version's margin; live's nearest clump hung 30 m from the line), 180 m from the big whale's arc (hers is open water), 110 m from the lighthouse's islet and from
    // the spout, 80 m from the courses of the pair that swims beside the last run. Nothing else places a clump.
    const kelpWind = flora.makeWind({ direction: [0.7, -0.7], speed: 0.5, strength: 1.5, gustScale: 0.03, gustiness: 0.4 });
    const kelpMat = seaPatch(flora.windMaterial({ wind: kelpWind, map: null, backlight: 1.3, backlightTint: '#f6e486', detail: 0.1 }), { kelp: true });
    {
      // olive-green streamers that glow gold where the light comes through them, and a few bare stipes that hang lower than the rest
      const kc = { base: '#263a18', mid: '#5f7222', tip: '#c2ac3c', float: '#dcc866' };
      const geos = [flora.kelpGeometry({ rng: kr, height: 55, detail: 1, stalks: 4, ...kc })];
      await ctx.yield();
      geos.push(flora.kelpGeometry({ rng: kr, height: 55, detail: 1, stalks: 3, ...kc }));
      await ctx.yield();
      geos.push(flora.kelpGeometry({ rng: kr, height: 55, detail: 1, stalks: 2, ...kc }));
      await ctx.yield();
      geos.push(flora.kelpGeometry({ rng: kr, height: 70, detail: 1, stalks: 2, blades: 0, width: 0.011, ...kc }));
      await ctx.yield();
      const ks = ctx.core.makeRng(ctx.core.hashSeed('the-sea-above:kelp-scatter:' + ctx.seed)), KELP_REACH = 300, KELP_CLEAR = 60;
      const keep = [], nLine = Math.floor(L / 10) + 1;                 // [x, z, margin]; the first nLine are the flight line itself
      let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
      for (let i = 0; i < nLine; i++) { path.posAtDist(i * 10, _q); keep.push([_q.x, _q.z, KELP_CLEAR]); bx0 = Math.min(bx0, _q.x); bx1 = Math.max(bx1, _q.x); bz0 = Math.min(bz0, _q.z); bz1 = Math.max(bz1, _q.z); }
      for (let f = 10; f <= 600; f += 10) keep.push([endP.x + hE.x * f, endP.z + hE.z * f, KELP_CLEAR]);
      { const a = toWorld(A.exitPoint), b = toWorld(A.entryPoint); for (let i = 0; i <= 24; i++) keep.push([lerp(a.x, b.x, i / 24), lerp(a.z, b.z, i / 24), 180]); }
      keep.push([LX, LZ, 110], [SPOUT[0], SPOUT[1], 110]);
      for (const pts of w3Courses) for (const q of pts) keep.push([q.x, q.z, 80]);
      const okAt = (x, z) => { let near = 1e9; for (let i = 0; i < keep.length; i++) { const d = Math.hypot(keep[i][0] - x, keep[i][1] - z); if (d < keep[i][2]) return false; if (i < nLine && d < near) near = d; } return near < KELP_REACH; };
      const clumps = [];                                              // x, z, streamers, full (the first three dealt carry the fullest streamers)
      for (let tries = 0; clumps.length < 8 && tries < 400; tries++) {
        let best = null, bd = -1;
        for (let k = 0; k < 12; k++) {
          const x = ks.range(bx0 - KELP_REACH, bx1 + KELP_REACH), z = ks.range(bz0 - KELP_REACH, bz1 + KELP_REACH); if (!okAt(x, z)) continue;
          let m = 1e9; for (const c of clumps) m = Math.min(m, Math.hypot(c[0] - x, c[1] - z));
          if (m > bd) { bd = m; best = [x, z]; }
        }
        if (best) clumps.push([best[0], best[1], ks.int(9, 12), clumps.length < 3 ? 1 : 0]);
        if (tries % 8 === 7) await ctx.yield();
      }
      const mats4 = [[], [], [], []], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), sc = new THREE.Vector3();
      clumps.forEach(([cx, cz, n, near], ci) => {
        spots[ci].set(cx, cz, 10.5, 0);
        for (let i = 0, m = Math.round(n * dens); i < m; i++) {
          const a = kr() * 6.28, r = Math.sqrt(kr()) * 8, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, s = kr.range(0.8, 1.3) * (i === 0 ? 1 : 1 - 0.3 * kr());
          e.set(Math.PI + kr.range(-0.04, 0.04), kr() * 6.28, kr.range(-0.04, 0.04), 'YXZ'); q.setFromEuler(e);
          p.set(x, CEIL + 1.2, z); sc.set(s * 0.9, s, s * 0.9);
          mats4[near ? 0 : 1 + (i % 2)].push(m4.compose(p, q, sc).clone());
          if (i < 3) { p.x += kr.range(-3, 3); p.z += kr.range(-3, 3); sc.set(1, kr.range(0.82, 1.08), 1); mats4[3].push(m4.compose(p, q, sc).clone()); }
        }
      });
      {   // short streamers grown on the lighthouse's rock (a stream of their own)
        const lr = ctx.core.makeRng('the-sea-above:lhweed:' + ctx.seed);
        for (let i = 0; i < 5; i++) {
          const a = i * 1.257 + lr.range(-0.3, 0.3), r = rock.reach(a + isletTurn, 2.2) * lr.range(0.86, 0.98), sK = lr.range(0.24, 0.4) * 0.36;   // (5 to 8 m long, hung on the rock's own face 2.2 m down: a fringe on the rim, never a curtain in front of the tower)
          e.set(Math.PI + lr.range(-0.05, 0.05), lr() * 6.28, lr.range(-0.05, 0.05), 'YXZ'); q.setFromEuler(e);
          mats4[1 + (i % 2)].push(m4.compose(p.set(LX + Math.cos(a) * r, CEIL - 2.2, LZ + Math.sin(a) * r), q, sc.set(sK * 1.6, sK, sK * 1.6)).clone());
        }
      }
      {   // the raft each clump hangs from: thick enough to show a pale rim of foam at the water and a lit olive underside, so it reads as afloat
        const rafts = new THREE.InstancedMesh(raftGeometry(), builtMat, Math.max(1, clumps.length));
        clumps.forEach(([cx, cz], ci) => rafts.setMatrixAt(ci, m4.compose(p.set(cx, CEIL + 0.5, cz), q.setFromAxisAngle(sc.set(0, 1, 0), ci * 2.1), sc.set(0.8, 1.8, 0.8))));
        rafts.count = clumps.length; rafts.instanceMatrix.needsUpdate = true; rafts.frustumCulled = false; rafts.name = 'kelp-rafts'; scene.add(rafts);
      }
      await ctx.yield();
      geos.forEach((g, k) => {
        if (!mats4[k].length) return;
        const im = new THREE.InstancedMesh(g, kelpMat, mats4[k].length);
        mats4[k].forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.name = 'hanging-kelp'; scene.add(im);
      });
    }
    await ctx.yield();

    // ---------- 11 between sea and field: a waterspout, chaff, rain that falls upward, curtains of light, the lamp ----------
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    // the spout stands beyond the climb, off to one side of the whale: a white column from the stubble to the water
    const spAt = SPOUT, spY = H0(spAt[0], spAt[1]);
    const spout = set.add(fx.makeDustDevil({ rng: rng.fork('spout'), time, position: [spAt[0], spY - 0.5, spAt[1]], height: 2 * (CEIL - spY), radius: [5, 31], count: 150, size: [9, 26], debris: 240, debrisSize: 0.35,
      color: '#d4eef4', colorTop: '#f4fdff', shadowColor: '#5d8ea6', opacity: 0.85, twist: 1.9, spin: 2.1, sway: 6, sunDir, sunColor: sunCol }));
    spots[10].set(spAt[0], spAt[1], 16, 1);
    const spoutK = spout.funnelUniforms ? spout.funnelUniforms.uOpacity : { value: 0.85 }, spoutK0 = spoutK.value;
    const spoutP = spout.uniforms && spout.uniforms.uOpacity ? spout.uniforms.uOpacity : { value: 1 }, spoutP0 = spoutP.value;
    const spoutD = spout.debris && spout.debris.material.uniforms.uOpacity ? spout.debris.material.uniforms.uOpacity : { value: 1 }, spoutD0 = spoutD.value;
    await ctx.yield();
    const chaff = set.add(fx.makeParticles({ rng: rng.fork('chaff'), preset: 'pollen', time, count: Math.round(1500 * Q), colors: ['#fff0b0', '#ffe08a', '#fffbe6'] }));
    const rainK = lerp(0.5, 1.2, moodK) * (deepM ? 1.15 : 1);
    const rain = set.add(fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time, count: Math.round(3200 * Q), velocity: [0.6, 15, 0.3], velocityRandom: [0.6, 5, 0.6],
      size: [0.012, 0.024], colors: ['#d8f6ff', '#ffffff', '#a8e6f0'], opacity: 0.34, intensity: 0.85, near: [5, 16] }));
    await ctx.yield();
    const rayDir = sunDir.clone().negate(), rayCol = aqua.clone().lerp(amber ? col('#ffd9a0') : col('#ffffff'), 0.5);
    // light shafts stand only where the lens is low: seen from above their cards show, so they fade out with height
    const shafts = [[-45 * mir, -120], [55 * mir, -330], loc(70, -96 * mir)].map(([x, z], i) =>
      set.add(fx.makeGodRays({ rng: rng.fork('rays' + i), time, position: [x + sunDir.x * 60, C + 12, z + sunDir.z * 60], direction: rayDir, radius: 55, count: 18, length: 130, width: [3, 9], color: rayCol, intensity: 0.35, near: [2, 7] })));
    set.add(fx.makeGlows({ rng: rng.fork('lamp'), time, positions: [[LX, lampY, LZ]], color: '#fff0b8', size: 14, intensity: 1.4, rays: 0.2 }));
    await ctx.yield();

    // ---------- 12 per-frame ----------
    const heroHead = new THREE.Vector3(), heroMid = toWorld(A.exitPoint), heroTail = new THREE.Vector3(), w1Pos = new THREE.Vector3();
    const crownAt = toWorld(A.entryPoint).add(new THREE.Vector3(0, -9, 0));
    // the calmed pool (see update): centred on the ceiling point of her exit, 1.5 of her lengths in radius (66 m), so the pool is
    // three lengths across and her whole body passes through still water as she comes out
    const CALM = toWorld(A.exitPoint); CU.uCalm.value.set(CALM.x, CALM.z, 1.5 * HERO_LEN, 0);
    const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _sz = new THREE.Vector2(1280, 720);
    const setWhale = (i, p, d, kLand, kCeil) => {
      const w = SU.uSeaWh.value[i], l = Math.hypot(d.x, d.z) || 1, k = (C - p.y) / sunDir.y;
      w.set(p.x + sunDir.x * k, p.z + sunDir.z * k, d.x / l, d.z / l);
      SU.uSeaWhK.value[i].x = kLand; SU.uSeaWhK.value[i].y = kCeil;
    };
    const setBlob = (i, p, r, k) => { const s = (C - p.y) / sunDir.y; SU.uSeaBlob.value[i].set(p.x + sunDir.x * s, p.z + sunDir.z * s, r, k); };
    const tintK = deepM ? 0.45 : 0.3, calf = rare ? hero.calf : null;
    // what is drawn of the far things, by their distance from the lens alone: of the fish ribbon and the ball by the hole two in five
    // (one in two) are drawn from beyond FAR_FISH[1] metres and all of them inside FAR_FISH[0], the rest joining one by one while
    // each is a speck; of the bales none beyond FAR_BALE[1] metres (under two lines of the picture tall there), all inside FAR_BALE[0]
    const FAR_FISH = [170, 330], FAR_BALE = [520, 760], fishMid = fishPts.reduce((a, q) => a.add(q), new THREE.Vector3()).multiplyScalar(1 / fishPts.length), cutMid = (() => { const w = loc(CUT[0], CUT[1]); return new THREE.Vector3(w[0], H0(w[0], w[1]), w[1]); })();
    const fishFull = schools.map((f) => f.object.geometry.instanceCount), ball2Full = ball2.object.geometry.instanceCount, balesIM = scene.getObjectByName('bales'), baleN = balesIM ? balesIM.count : 0;
    const uGo = (dN - tmg.nadir / kIn) / L;                          // where the breach clock starts: before it the big whale is a blue shape swimming in to the place it will break out
    if (calf) SU.uSeaWhK.value[3].z = 12; else SU.uSeaWhK.value[3].z = 25;
    const renderer = ctx.renderer, poolK = deepM ? 3.0 : amber ? 2.0 : 2.4;

    function update(dt, t, camera, u) {
      const camY = camera.matrixWorld.elements[13];
      time.value = t; SU.uSeaT.value = t; kiteU.uTime.value = t;
      // the breach, keyed to the flight
      const prog = progAt(u);
      hero.setProgress(prog); hero.update(dt, t, camera);
      const hm = hero.object.matrixWorld;
      heroHead.copy(hero.state.head).applyMatrix4(hm); heroMid.copy(hero.state.mid).applyMatrix4(hm); heroTail.copy(hero.state.tail).applyMatrix4(hm);
      _d.subVectors(heroHead, heroTail); _a.copy(heroMid);
      if (u < uGo) { const lurk = (uGo - u) * L * 0.5 / (Math.hypot(_d.x, _d.z) || 1); _a.x -= _d.x * lurk; _a.z -= _d.z * lurk; }
      setWhale(0, _a, _d, SHK, (prog > tmg.nadir || u < uGo ? 0.4 : 0.62) * (1 - hero.state.airborne) * (1 - smoothstep(tmg.enter, tmg.enter + 0.06, prog)));   // lurking it is a soft shape; going back in it fades under the white crown, where a dark shape reads as a hole
      const dive = u < uN + 0.06;                                       // which shoal and which rays throw the soft shadows just now
      // (a whale that has gone up into the sea goes on deeper: its shape in the water and its shadow on the land fade with it)
      whale1.update(dt, t, camera, u); whale1.positionAt(t, u, w1Pos);
      { const k = 1 - smoothstep(C + 2.5, C + 8.6, w1Pos.y); setWhale(1, w1Pos, w1Dir, SHK * k, tintK * k); }
      whale2.update(dt, t, camera, u); whale2.positionAt(t, u, _a);
      { const k = 1 - smoothstep(C + 3, C + 10.3, _a.y); setWhale(2, _a, w2Dir, SHK * k, tintK * k); }
      whale3.update(dt, t, camera, u); whale3b.update(dt, t, camera, u); whale4.update(dt, t, camera, u);
      if (calf) {
        const cm = calf.object.matrixWorld;
        _a.copy(calf.state.head).applyMatrix4(cm); _b.copy(calf.state.tail).applyMatrix4(cm); _d.subVectors(_a, _b); _a.copy(calf.state.mid).applyMatrix4(cm);
        setWhale(3, _a, _d, 0.7, 0.8 * (1 - calf.state.airborne));
      } else { whale3.positionAt(t, u, _a); const k = 1 - smoothstep(C + 2.5, C + 8.6, _a.y); setWhale(3, _a, w3Dir, SHK * k, tintK * k); }
      for (const f of schools) f.update(dt, t, camera, u);
      { _a.setFromMatrixPosition(camera.matrixWorld);
        const k = 1 - smoothstep(FAR_FISH[0], FAR_FISH[1], _a.distanceTo(fishMid)), kb = 1 - smoothstep(FAR_FISH[0], FAR_FISH[1], _a.distanceTo(ball2Pos));
        for (let i = 0; i < 2; i++) schools[i].object.geometry.instanceCount = Math.round(fishFull[i] * lerp(0.4, 1, k));
        ball2.object.geometry.instanceCount = Math.round(ball2Full * lerp(0.5, 1, kb));
        if (balesIM) balesIM.count = Math.round(baleN * (1 - smoothstep(FAR_BALE[0], FAR_BALE[1], _a.distanceTo(cutMid)))); }
      const late = u > uN - 0.06 || ctx.through;                        // the shoals of the last third are not drawn in the first, nor the dive's after the climb
      ball.object.visible = late; ball2.object.visible = u < uE;
      if (late) ball.update(dt, t, camera, u);
      rays.update(dt, t, camera, u);
      if (u < uE) ball2.update(dt, t, camera, u);
      for (const r of rays2) { r.object.visible = u < uE; if (u < uE) r.update(dt, t, camera, u); }
      (dive ? rays2[0] : rays).positionAt(t, u, _a); setBlob(1, _a, 13, 0.5 * (1 - smoothstep(C + 1, C + 6, _a.y)));   // (rays that have gone up into the sea throw no shadow)
      setBlob(0, dive ? ball2Pos : ballPos, 15, 0.62);
      swifts.object.visible = u < uN + 0.04; if (swifts.object.visible) swifts.update(dt, t, camera, u);
      gulls.update(dt, t, camera, u);
      // plants and wind
      wheat.update(dt, t, camera); ears.update(dt, t, camera); poppies.update(dt, t, camera); poppies2.update(dt, t, camera); kelpWind.update(t);
      // machines and lights
      mats.update(dt, t); mill.update(dt, t, camera); lh.update(dt, t, camera);
      const kt = t + kiteT0;
      kite.position.set(kiteBase.x + Math.sin(kt * 0.6) * 3.5, kiteBase.y + Math.sin(kt * 0.9 + 1) * 2.2, kiteBase.z + Math.cos(kt * 0.45) * 3);
      kite.rotation.set(-0.55 + 0.1 * Math.sin(kt * 1.3), 0.3 * mir + 0.25 * Math.sin(kt * 0.7), 0.2 * Math.sin(kt * 1.1));
      strU.uB.value.set(kite.position.x, kite.position.y - 0.5, kite.position.z);
      strU.uSag.value = 2.6 + 0.8 * Math.sin(kt * 0.8);
      if (renderer) { renderer.getDrawingBufferSize(_sz); strU.uPx.value = 0.95 / Math.max(_sz.y, 200); }
      for (let i = 0; i < boats.length; i++) {
        const b = boats[i]; let x, z, hx2 = b.dx, hz2 = b.dz;
        if (i === 1) { const a = b.ph + (b.v * t) / HULL_R; x = b.x + HULL_R * Math.sin(a); z = b.z + HULL_R * Math.cos(a); hx2 = Math.cos(a); hz2 = -Math.sin(a); }   // the far hull sails its circle: its drift never carries it away
        else { const bt = i === 0 ? 3 * Math.sin(t * 0.021 + b.ph) / 0.3 : (u - uCh) * 50 + 5 * Math.sin(t * 0.11 + b.ph); x = b.x + b.dx * b.v * bt; z = b.z + b.dz * b.v * bt; }
        b.mesh.position.set(x, CEIL - 0.05 + swell(x, z, t), z);
        b.mesh.rotation.set(0.05 * Math.sin(t * 0.7 + b.ph), Math.atan2(hx2, hz2), 0.07 * Math.sin(t * 0.9 + b.ph * 2));
        CU.uBoat.value[i].set(x, z, hx2, hz2);
        if (i === 2) {                                                // the chain to the dragged anchor, and the furrow behind it
          const fxz = x - b.dx * CH_LAG, fzz = z - b.dz * CH_LAG, gx = fxz - b.dx * AN_REACH, gz = fzz - b.dz * AN_REACH, gy = heightAt(gx, gz) + 0.35;
          chain.position.set(x, 0, z); weed.position.set(x, 0, z);
          CH.uChain.value.set(-b.dx * CH_LAG, -b.dz * CH_LAG, CHAIN_TOP, CHAIN_TOP - (gy + AN_UP));
          anchor.position.set(gx, gy, gz);
          GU.uFur.value.set(gx - b.dx * 46, gz - b.dz * 46, gx + b.dx * 1.5, gz + b.dz * 1.5);
          setBlob(2, b.mesh.position, 9, 0.55);
        }
      }
      // air
      CU.uNear.value = smoothstep(60, 96, camY); CU.uRun.value = smoothstep(97, 108, camY);
      {   // THE CALMED POOL: the sea is stilled round the hole she leaves. Its place and size are the world's (CALM, set once in
        // build: the ceiling point of her exit, one and a half of her lengths in radius); only how still it is changes, by her
        // own state: how far out of the water she is (airborne) and her own depth under the ceiling (dy)
        const dy = CEIL - heroMid.y;
        const dv = 1 - smoothstep(tmg.nadir - 0.05, tmg.nadir + 0.05, prog);   // 1 through the dive: there the pool is nearly still and its water a shade paler, so the dark body comes out through it; the net's cells come back at its rim
        CU.uCalm.value.w = dy > 3 && hero.state.airborne > 0.01 ? Math.min(1, 0.42 + 0.57 * dv) * hero.state.airborne * Math.min(1, (dy - 3) / 6) : 0;
        CU.uCalmBody.value = 0.3 * dv;
      }
      if (beamMesh) {   // where the beam's lower arm meets the land: the lamp's pool lies there whatever the eye's height (its rim is a soft falloff in the light pattern: seaPool, half lengths 34 and 15 m)
        beamMesh.updateWorldMatrix(true, false); _d.copy(rakeDir).transformDirection(beamMesh.matrixWorld);
        const pk = SU.uSeaPoolK.value;
        if (_d.y < -0.2) { const sl = rakeLen, hl = Math.hypot(_d.x, _d.z) || 1; SU.uSeaPool.value.set(LX + _d.x * sl, LZ + _d.z * sl, _d.x / hl, _d.z / hl); pk.z = poolK; } else pk.z = 0;
      }
      chaff.object.visible = rain.object.visible = !ctx.through;      // these two ride with the camera
      chaff.setOpacity(1 - smoothstep(22, 70, camY));
      rain.setOpacity(lerp(0.12, 1, smoothstep(uA - 0.06, uA + 0.08, u)) * (1 - 0.45 * smoothstep(0.8, 0.95, u)) * rainK);   // full from the dive on
      { const k = 1 - smoothstep(93, 107, camY); spoutK.value = spoutK0 * k * (1 - 0.5 * smoothstep(60, 93, camY)); spoutP.value = spoutP0 * k; spoutD.value = spoutD0 * k; CU.uSpoutFoam.value = spoutK.value / spoutK0; }   // the spout blows out as the eye climbs to the last run: whole, or gone (the code is live's own line; the boil at its head on the water goes by the funnel's own strength, so the spout is never puffs without a column)
      const shaftK = 0.35 * (1 - smoothstep(40, 70, camY));
      for (const s of shafts) s.uniforms.uIntensity.value = shaftK;
      set.update(dt, t, camera);
    }

    const dip = (u) => smoothstep(uA + 0.02, uN - 0.03, u) * (1 - smoothstep(uE - 0.02, uE + 0.07, u));
    // THE GAZE. One pull on the whale, of weight 1, whose point is worked out from u inside the pull itself (the whale's pose at
    // the breach's progress there, read from the piece without setting anything), so it is the same whatever was drawn before.
    // Pointed straight at the whale the lens would look 30 to 45 degrees up during the dive: nothing but ceiling. So the point is
    // capped in degrees above level, measured along the flight line from the lens's place on it: 21 degrees from the place the
    // dive begins to the end of the low run (dA, where the route joins the piece's own line), easing to 15 as the whale comes
    // down to the nadir cue, 14.5 through the climb flown beside her, and free (45 degrees) only for the crown at the re-entry.
    // Held that low, the look keeps the land ahead under it all the way: the seam, the wheat, and nearer the fish ribbon and
    // the chain stay below the whale.
    const gP = new THREE.Vector3(), gT = new THREE.Vector3(), gA = new THREE.Vector3(), gHero = new THREE.Vector3(), gW1 = new THREE.Vector3(), gMid = new THREE.Vector3(), gTail = new THREE.Vector3(), gW = new THREE.Vector3(), RAD = Math.PI / 180;
    const heroM = hero.object.matrixWorld;
    // THE CROWN HOLDS THE GAZE WHILE IT STANDS, by its own clock (hero.crownAt: 0 as the snout goes in, full height near 0.26,
    // fallen and gone at 1). Up to CROWN_HOLD the point stays on the crown; then, as the crown falls, the point itself slides
    // round from the crown to the point the lens would look at anyway, in one even move that lasts CROWN_TURN of the crown's
    // clock (about four seconds: let go at once, the lens would whip 55 degrees round in one), and the pull lets go only once
    // it is there, so letting go moves nothing. The same in both cameras.
    const CROWN_HOLD = 0.35, CROWN_TURN = 1.0;
    const gazeHero = (time, u) => {
      path.pointAt(u, gP);
      const prog = progAt(u);
      hero.poseAt(prog, null, gMid, gTail); gMid.applyMatrix4(heroM); gTail.applyMatrix4(heroM);
      // a little behind her middle and 4 m under her (on the climb, flown close beside her 44 m, half-way from her middle to her flukes and 1.5 m under), then the hole she leaves in the sea
      const close = smoothstep(tmg.nadir + 0.04, lerp(tmg.nadir, tmg.enter, 0.45), prog) * (1 - smoothstep(lerp(tmg.nadir, tmg.enter, 0.6), tmg.enter - 0.04, prog));
      gHero.copy(gMid).lerp(gTail, lerp(0.42, 0.5, close)); gHero.y -= lerp(4, 1.5, close);
      gHero.lerp(crownAt, smoothstep(tmg.enter - 0.05, tmg.enter + 0.08, prog));
      const cap = Math.tan((lerp(21, 15, smoothstep(uA, uN - 0.05, u)) - 0.5 * smoothstep(uN - 0.03, uN + 0.05, u) + 30.5 * smoothstep(uE - 0.06, uE + 0.03, u)) * RAD);
      gHero.y = Math.min(gHero.y, gP.y + Math.hypot(gHero.x - gP.x, gHero.z - gP.z) * cap);
      const st = clamp((hero.crownAt(prog) - CROWN_HOLD) / CROWN_TURN, 0, 1), sw = 0.6 * st + 0.4 * st * st * (3 - 2 * st);       // an even turn with eased ends (the lens's own lag rounds them)
      if (sw > 0) {
        path.posAtDist(Math.min(L, u * L + 24), gA); gA.sub(gP).normalize(); gHero.sub(gP).normalize();
        const w = Math.acos(clamp(gHero.dot(gA), -1, 1)), sn = Math.sin(w);
        if (sn > 1e-3) gHero.multiplyScalar(Math.sin((1 - sw) * w) / sn).addScaledVector(gA, Math.sin(sw * w) / sn); else gHero.lerp(gA, sw);
        gHero.normalize().multiplyScalar(100).add(gP);
      }
      return gHero;
    };
    // where the slide is done: the first place of the route at which the crown's clock has run CROWN_HOLD + CROWN_TURN
    let dTurned = dE; while (dTurned < L && hero.crownAt(progAt(dTurned / L)) < CROWN_HOLD + CROWN_TURN) dTurned += 2;
    // the first whale: the gaze lifts toward it while it is ahead of the lens, never past 38 degrees and never backward
    const gazeW1 = (time, u) => {
      path.pointAt(u, gP); path.tangentAt(u, gT); gT.y = 0; gT.normalize(); whale1.positionAt(time, u, gW);
      let dx = gW.x - gP.x, dz = gW.z - gP.z; const hd = Math.hypot(dx, dz) || 1; dx /= hd; dz /= hd;
      const k = smoothstep(0.1, 0.75, dx * gT.x + dz * gT.z), el = Math.min(Math.atan2(gW.y - gP.y, hd), 38 * RAD) * k;
      const hx2 = lerp(gT.x, dx, k), hz2 = lerp(gT.z, dz, k), hl = Math.hypot(hx2, hz2) || 1;
      return gW1.set(gP.x + (hx2 / hl) * 100, gP.y + Math.tan(el) * 100, gP.z + (hz2 / hl) * 100);
    };
    // the pair beside the last run: one light pull toward the leading whale while it hangs below the surface (the middle half of
    // its course, which is stated in metres of route)
    const gW3 = new THREE.Vector3(), gazeW3 = (time, u) => whale3.positionAt(time, u, gW3);
    const w3From = w3CrossA.u - 0.6 * w3CrossA.window, w3To = w3CrossA.u + 0.6 * w3CrossA.window;
    // the one pull on the whale: it comes in over GAZE_IN of the flight from the place the dive begins (dS) and is let go over the
    // same share after the slide is done (dTurned), by which time its point is the lens's own
    const GAZE_IN = 0.07, holdFrom = dS / L, holdTo = dTurned / L + GAZE_IN;
    return {
      scene, path, duration: 50, title: 'The Sea Above', ride: 'none',
      pace: (u) => 1.06 - 0.26 * dip(u),                              // linger beside the whale
      camera: { fov: 62, near: 0.3, far: 4300, lookAhead: 24, sway: 0.8, bank: 0.8 },
      pois: [
        { at: gazeW1, from: 0.13, to: 0.31, weight: 0.55 },
        { at: gazeHero, from: holdFrom, to: holdTo, weight: 1, fade: GAZE_IN / (holdTo - holdFrom) },
        { at: lampPos.clone().add(new THREE.Vector3(0, 14, 0)), from: 0.78, to: 0.9, weight: 0.14 },
        { at: gazeW3, from: w3From, to: w3To, weight: 0.45 },
      ],
      portal: { shape: 'circle', radius: 7, color: portalCol, glow: 1.2, revealDistance: 320 },
      post: { exposure: 1.0, bloom: { strength: 0.36, radius: 0.7, threshold: 0.96 },
        grade: { saturation: deepM ? 1.14 : 1.08, contrast: 1.05, tint: amber ? '#ffeed6' : deepM ? '#eef8ff' : '#fbfffd', shadowTint: deepM ? '#021426' : '#04202c', vignette: deepM ? 0.4 : 0.3, grain: 0.02, aberration: 0 } },
      update,
      dispose() { hero.dispose(); trkTex.dispose(); },
    };
  },
};
