// HERO SET PIECE for "attic-railway" (The Attic Line): THE MOUNTAIN IN THE MOON SHAFT.
//
// A papier-mache toy mountain (1 unit = 1 "toy centimetre", same units as the brief) with a
// flocked green foot, painted umber rock and a mica-snow summit horn. One track climbs it
// anticlockwise (seen from above) for about one and a half turns (a 375 degree tightening helix plus a
// 120 degree closing curve) from y=30 to y=127, radius 85 -> 50,
// on spindly timber trestles, cut ledges and one real tunnel under the summit horn (2 mouths),
// then runs straight for 70 units along a snowy summit ledge into a grand keystone arch 14 wide
// (the 3rd mouth) where the exit portal sits. A second, closed "lower loop" circles the foot.
// Three tinplate trains run at three heights: the red express (ours), a blue tank engine + 2
// coaches about half a turn ahead of it that runs into the arch and is gone, and a green goods
// train of six wagons on the lower loop running the other way.
//
// LOCAL SPACE: origin = centre of the mountain's base on the table top, +Y up, +X = east (toward
// the oculus / moon), +Z = south = FRONT (the table edge the train arrives from). The summit ledge
// runs north (-Z); the arch faces +Z, so the front view looks straight up the ledge into the portal.
//
// opts:
//   palette      7 hex strings, brief order [air, umber, moonShadow, moon, gold, red, flock]
//   moonDir      Vector3/array, direction TOWARD the moon (default east, 9.5 deg up)
//   shaft        true: draw the local 300-unit segment of the moon shaft (set false if the world
//                draws its own cone; the surface lighting keeps its shaft mask either way)
//   shaftRadius  45
//   portalFill   true: emissive placeholder disc inside the arch (set false in the world)
//   express      true: draw the red express (set false if the world's own footplate loco rides it)
//   dust         true: silver dust sparks + mica glints (one Points draw)
//
// RETURN extras (beyond the contract):
//   setProgress(u)   u in 0..1 = the express's place along the hero track (0 = anchors.trackStart,
//                    1 = arch). Drives the express, the blue engine ahead of it (vanishes into the
//                    arch over u ~ 0.69-0.82; the goods train is keyed to u too: it meets the express at track s = 150) and the portal's light spill. Until it is called the trains
//                    loop on time so the piece is alive when viewed alone. setProgress(null) = auto.
//   track            { length, at(s, outPos, outTan) } rail-top centreline, s in units from start.
//   uniforms         shared uniforms (uMoonCol, uMoonI, uAmb, uPortalCol, uPortalI, uShaftR ...).
//   setMoon(dir, colorHex, intensity)
//
// anchors (all local space):
//   portalSeat   { position, normal(+Z), width 14, height 15.5, shape 'arch' }: centre of the arch
//                opening, on the arch plane; the portal faces back down the summit ledge.
//   flyThrough   ordered Vector3 list, the footplate eye line (9 above the rail, 2 left of centre)
//                from the lead-in trestle up the whole helix to the portal seat. Clear by >= 6 except
//                inside the tunnel bore (14 wide, 17 tall) and under the arch itself.
//   trackStart   { position, tangent }: rail-top start of the lead-in trestle, to join the world's
//                track to (it stands 30 above the table at the south-west foot).
//   summitStraightStart, tunnelIn, tunnelOut, summit, shaftAxis {point, dir}, lowerLoop {radius,y},
//   viewpoints   { front, reveal, summitApproach } good camera positions looking at `center`.
//
// WORLD HOOKS (added by the world builder; all optional, all in hero-local space):
//   opts.moonTarget   Vector3: aim the shaft axis from the summit at this point (the oculus centre).
//   opts.preAt(s,out) + opts.preLength: the world's own track in front of trackStart (s < 0), so the
//                     blue engine can run ahead of the express before either reaches the mountain.
//   opts.goods        { at, angle }: the goods engine stands at this angle round the lower loop (radians, 0 = +X, anticlockwise
//                     from above) when the express is at track s = at (may be negative); it runs clockwise at 3/4 of our speed.
//   opts.extraTrains  [{ track:{at(s,out),closed,length}, dir, kinds, livery, cols, s(time,progress) }]
//                     more tinplate trains on world tracks (4 trains in total at most).
//   opts.expressKinds the express's cars (default loco, tender, three coaches); a world that rides its footplate passes ['loco'].
//   return.setRide(lead, blue, vis)  for that world: how far the express's nose runs ahead of setProgress's place, the blue
//                     engine's lead (null = its own), and vis = false to hide the express while the world is seen through a portal.
//   opts.goods.speed  the goods train's speed as a share of ours (default 0.75).
//   The west and south-west faces carry a dead-end mine spur (ledge, bents, adit arch, three ore wagons), chalets on cut
//   terraces, pegged lanterns and lichen clumps: what a rider sees of the mountain from the table and the tall trestle.
//   return.kit        { Batch, G, treeGeo, mkMat, tinMat, mtnMat, U, makeTrack, PTS_*, GLSL_*, buildArch }
//                     so the world's props share the same materials, light block and uniforms
//                     (uHeadP/uHeadD = footplate headlamp cone, uFlash = lightning, uGlow = bulb gain).
//   Lamps and signals stand on the LEFT of travel: the footplate eye rides right of the centre line.
//
// SIZE: radius ~119, height 160. COST: ~136k triangles, 10 draw calls, ~400 ms build, no lights, no textures.
// LIGHTING: self-lit (ShaderMaterials, linear HDR, scene fog honoured). It wants a dark blue-black
// scene (fog #0B0E1A), strong bloom, and nothing else lighting it: the moon key only reaches
// surfaces inside the shaft cylinder (axis through the summit along moonDir), everything else is dim
// blue ambient plus warm pools baked around its own bulbs and moving pools under the train windows.
//
// STYLE (tinplate toy realism), so the world can match: every "tin" surface is a flat vertex colour
// lit by a 3-step toon ramp plus ONE hard specular stripe (smoothstep on N.H, no falloff), printed
// windows are separate emissive rectangles (gold x4-6), tabs/rivets are slightly oversized boxes.
// Scenery is honestly fake: papier-mache = vertex-coloured rock with newsprint-strip banding and
// brush streaks in the fragment shader; flock = high-frequency speckle with stitched seams; mica =
// hashed cells that flash point by point with view angle and time, only strongly inside the shaft.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEF_PAL = ['#0B0E1A', '#3A2A1E', '#2A3C66', '#DCE6F7', '#FFC857', '#B5202A', '#4F6B3A'];
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- geometry batcher
// Accumulates transformed primitives into one vertex-coloured geometry.
// aFx = (emissive multiplier, instance-tint amount, gloss amount)
export class Batch {
  constructor() { this.p = []; this.n = []; this.c = []; this.f = []; this.i = []; this.nv = 0; }
  add(geo, m, col, e = 0, tint = 0, gloss = 1) {
    const P = geo.attributes.position, N = geo.attributes.normal, ix = geo.index, base = this.nv;
    const v = _bv, nm = _bn.getNormalMatrix(m);
    for (let k = 0; k < P.count; k++) {
      v.fromBufferAttribute(P, k).applyMatrix4(m); this.p.push(v.x, v.y, v.z);
      v.fromBufferAttribute(N, k).applyMatrix3(nm).normalize(); this.n.push(v.x, v.y, v.z);
      this.c.push(col.r, col.g, col.b); this.f.push(e, tint, gloss);
    }
    if (ix) for (let k = 0; k < ix.count; k++) this.i.push(base + ix.getX(k));
    else for (let k = 0; k < P.count; k++) this.i.push(base + k);
    this.nv += P.count;
  }
  // box centred at (x,y,z) with size (sx,sy,sz), optional yaw about Y and parent matrix
  box(x, y, z, sx, sy, sz, col, e = 0, tint = 0, gloss = 1, parent = null, ry = 0) {
    _bm.compose(_bp.set(x, y, z), _bq.setFromAxisAngle(_Y, ry), _bs.set(sx, sy, sz));
    if (parent) _bm.premultiply(parent);
    this.add(G.box, _bm, col, e, tint, gloss);
  }
  // beam between two points with square section w
  beam(a, b, w, col, parent = null, gloss = 0.3) {
    _bd.subVectors(b, a); const len = _bd.length(); if (len < 1e-4) return;
    _bq.setFromUnitVectors(_Y, _bd.divideScalar(len));
    _bm.compose(_bp.addVectors(a, b).multiplyScalar(0.5), _bq, _bs.set(w, len, w));
    if (parent) _bm.premultiply(parent);
    this.add(G.box, _bm, col, 0, 0, gloss);
  }
  // cylinder along local axis: 'y' upright, 'z' lying fore-aft, 'x' lying across
  cyl(x, y, z, r0, r1, h, col, axis = 'y', e = 0, tint = 0, gloss = 1, parent = null, geo = G.cyl) {
    if (axis === 'z') _bq.setFromAxisAngle(_X, Math.PI / 2); else if (axis === 'x') _bq.setFromAxisAngle(_Z, Math.PI / 2); else _bq.identity();
    _bm.compose(_bp.set(x, y, z), _bq, _bs.set(r0, h, r1));
    if (parent) _bm.premultiply(parent);
    this.add(geo, _bm, col, e, tint, gloss);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aFx', new THREE.Float32BufferAttribute(this.f, 3));
    g.setIndex(this.i);
    return g;
  }
  // the same, handing a frame back between the big array copies (a large batch is tens of milliseconds otherwise)
  async buildAsync(ctx) {
    const g = new THREE.BufferGeometry(), CH = 24000;
    const copy = async (src, dst) => { for (let o = 0; o < src.length; o += CH) { const e = Math.min(src.length, o + CH); for (let i = o; i < e; i++) dst[i] = src[i]; await ctx.yield(); } return dst; };
    g.setAttribute('position', new THREE.BufferAttribute(await copy(this.p, new Float32Array(this.p.length)), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(await copy(this.n, new Float32Array(this.n.length)), 3));
    g.setAttribute('color', new THREE.BufferAttribute(await copy(this.c, new Float32Array(this.c.length)), 3));
    g.setAttribute('aFx', new THREE.BufferAttribute(await copy(this.f, new Float32Array(this.f.length)), 3));
    g.setIndex(new THREE.BufferAttribute(await copy(this.i, this.nv > 65535 ? new Uint32Array(this.i.length) : new Uint16Array(this.i.length)), 1));
    return g;
  }
  get tris() { return this.i.length / 3; }
}
const _bv = new THREE.Vector3(), _bn = new THREE.Matrix3(), _bm = new THREE.Matrix4(), _bp = new THREE.Vector3(),
  _bq = new THREE.Quaternion(), _bs = new THREE.Vector3(), _bd = new THREE.Vector3();
const _X = new THREE.Vector3(1, 0, 0), _Y = new THREE.Vector3(0, 1, 0), _Z = new THREE.Vector3(0, 0, 1);
const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 12, 1),
  cyl6: new THREE.CylinderGeometry(1, 1, 1, 6, 1),
  cone: new THREE.CylinderGeometry(0.55, 1, 1, 10, 1),
  dome: new THREE.SphereGeometry(1, 10, 6, 0, TAU, 0, Math.PI / 2),
  cyl24: new THREE.CylinderGeometry(1, 1, 1, 24, 1), dome18: new THREE.SphereGeometry(1, 18, 9, 0, TAU, 0, Math.PI / 2),
  blob: new THREE.IcosahedronGeometry(1, 1),
};
const C = (hex) => new THREE.Color(hex);
const shade = (col, k) => col.clone().multiplyScalar(k);

// ---------------------------------------------------------------- shaders (all shading in hero-local space)
const GLSL_LIGHT = /* glsl */`
uniform float uTime, uMoonI, uShaftR, uPortalI, uFlash, uGlow, uMtnFill;
uniform vec3 uMoonDir, uMoonCol, uAmb, uShaftP, uPortalP, uPortalCol, uWarm, uCamL, uHeadD;
uniform vec4 uTrainL[8];
uniform vec4 uHeadP;
float gShaftK = 1.0;          // 0 for surfaces inside a tunnel: the moon does not reach them
float gTrainK = 1.0;          // the trains' window light on what they pass (little of it on the trains themselves)
float gHeadK = 1.0;           // our headlamp's cone on other tin trains: enough to pick them out, not to blow them out
float shaftMask(vec3 lp) {
  float sd = length(cross(lp - uShaftP, uMoonDir));
  return 1.0 - smoothstep(uShaftR * 0.80, uShaftR * 1.06, sd);
}
// alb: albedo, N: local normal, lp: local position, gloss: hard stripe amount, toon: ramp hardness
vec3 atticLight(vec3 alb, vec3 N, vec3 lp, float gloss, float toon) {
  vec3 V = normalize(uCamL - lp);
  float shaft = shaftMask(lp) * gShaftK;
  float ndl = dot(N, uMoonDir);
  float wrap = clamp(ndl * 0.62 + 0.38, 0.0, 1.0);
  wrap = mix(wrap, floor(wrap * 3.0 + 0.6) / 3.0, toon);
  vec3 c = alb * uAmb * (0.6 + 0.4 * N.y);
  c += alb * uMoonCol * uMoonI * (shaft * (0.08 + 0.85 * wrap) + 0.085 * wrap * gShaftK);
  c += alb * uWarm * 0.07 * clamp(dot(N, normalize(vec3(-0.75, 0.25, 0.6))) * 0.6 + 0.4, 0.0, 1.0);   // the town's glow, opposite the moon
  vec3 Lp = uPortalP - lp; float d2 = dot(Lp, Lp);
  c += alb * uPortalCol * uPortalI * clamp(dot(N, Lp * inversesqrt(d2)) * 0.7 + 0.3, 0.0, 1.0) * 500.0 / (500.0 + d2);
  c += alb * vec3(0.72, 0.82, 1.0) * uFlash * (0.3 + 0.7 * wrap);                                       // lightning through the oculus
  { vec3 Lh = lp - uHeadP.xyz; float dh = length(Lh) + 0.001; Lh /= dh;                                    // our own headlamp cone
    c += alb * vec3(1.0, 0.86, 0.6) * uHeadP.w * (gHeadK * smoothstep(0.74, 0.97, dot(Lh, uHeadD)) * clamp(dot(N, -Lh) * 0.6 + 0.4, 0.0, 1.0) / (1.0 + dh * dh * 0.0006)
      + 0.42 * clamp(dot(N, -Lh) * 0.5 + 0.5, 0.0, 1.0) / (1.0 + dh * dh * 0.007)); }
  for (int i = 0; i < 8; i++) {
    vec3 L = uTrainL[i].xyz - lp; float e2 = dot(L, L);
    c += alb * uWarm * uGlow * gTrainK * uTrainL[i].w * clamp(dot(N, L * inversesqrt(e2 + 0.01)) * 0.5 + 0.5, 0.0, 1.0) / (1.0 + e2 * 0.02);
  }
  vec3 H = normalize(uMoonDir + V);
  float s = smoothstep(0.90, 0.925, dot(N, H)) + 0.35 * smoothstep(0.93, 0.95, dot(N, normalize(vec3(0.2, 1.0, 0.3) + V)));
  c += gloss * s * uMoonCol * (0.055 + shaft * uMoonI * 0.5);
  return c;
}
float hash13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
`;
const GLSL_FOGFADE = /* glsl */`
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float fogF = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #else
    float fogF = 0.0;
  #endif
`;

const TIN_VERT = /* glsl */`
attribute vec3 aFx;
varying vec3 vCol, vN, vL, vFx, vO;
varying float vInst;              // 1 on instanced meshes (three.js defines USE_INSTANCING for the vertex shader only)
#include <fog_pars_vertex>
void main() {
  vec4 lp = vec4(position, 1.0); vec3 n = normal; vCol = color; vO = position; vInst = 0.0;
  #ifdef USE_INSTANCING
    lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n; vInst = 1.0;
  #endif
  #ifdef USE_INSTANCING_COLOR
    vCol *= mix(vec3(1.0), instanceColor, aFx.y);
  #endif
  vN = n; vL = lp.xyz; vFx = aFx;
  vec4 mvPosition = modelViewMatrix * lp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const TIN_FRAG = /* glsl */`
varying vec3 vCol, vN, vL, vFx, vO;
varying float vInst;
#include <fog_pars_fragment>
${GLSL_LIGHT}
void main() {
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 alb = vCol * (0.93 + 0.14 * vnoise(vL * 0.9));          // faint litho mottling
  float wallish = step(abs(N.y), 0.35) * step(vFx.x, 0.01);
  #ifndef USE_INSTANCING
    gShaftK = 1.0 - step(0.5, vFx.y);                           // static batches use the tint slot as an 'indoors' flag
    // lithographed print on the upright sheets: brick / plank courses, a tab seam every few courses, a rivet row
    float printed = wallish * smoothstep(0.85, 0.95, vFx.z) * (1.0 - smoothstep(1.1, 1.2, vFx.z));
    float cy = vL.y / 0.9, cf = fract(cy), cid = floor(cy);
    float hz = dot(vL.xz, vec2(-N.z, N.x));
    float course = smoothstep(0.0, 0.12, cf) * smoothstep(1.0, 0.88, cf);
    float bf = fract(hz / 2.2 + 0.5 * mod(cid, 2.0)), perp = smoothstep(0.0, 0.07, bf) * smoothstep(1.0, 0.93, bf);
    alb *= mix(1.0, (0.8 + 0.2 * course * perp) * (0.92 + 0.16 * hash13(vec3(cid, floor(hz / 2.2 + 0.5 * mod(cid, 2.0)), 3.0))), printed);
    float rv = length(vec2(fract(hz / 1.8) - 0.5, (fract(vL.y / 5.4) - 0.5) * 3.0));
    alb *= 1.0 + printed * 0.5 * (1.0 - smoothstep(0.1, 0.16, rv));
  #endif
  vec3 c = atticLight(alb, N, vL, vFx.z, 0.75);
  // the one hard gloss stripe of pressed tin: a diagonal band fixed in the sheet, brightest toward the eye
  float band = fract((vL.x + vL.z) * 0.045 + vL.y * 0.11);
  float stripe = smoothstep(0.0, 0.015, band) * (1.0 - smoothstep(0.075, 0.09, band)) + 0.5 * smoothstep(0.13, 0.14, band) * (1.0 - smoothstep(0.155, 0.165, band));
  c += alb * (uAmb * 0.55 + uMoonCol * 0.12 + uWarm * 0.06 * uGlow) * stripe * wallish * clamp(vFx.z, 0.0, 1.6) * 0.8;
  float em = vFx.x;
  #ifdef USE_INSTANCING
    // sponge trees and bristle grass (matt, unlit by their own bulbs) share the landscape's sky-fill, so they never stand as black cut-outs
    c += (alb + 0.012) * (uMoonCol * 0.42 + uAmb * 0.5) * uMtnFill * (0.55 + 0.4 * N.y) * 1.5 * (1.0 - step(0.05, vFx.z)) * step(em, 0.01);
  #endif
  if (vInst > 0.5 && em > 4.52 && em < 4.58) {                   // coach windows: lit compartments, not blank yellow cards; a coach sliding past the eye does not blind it
    float fz = fract((vO.z + 9.6) / 2.75 + 0.5) - 0.5, wy = vO.y - 5.55;
    float mull = smoothstep(0.02, 0.05, abs(fz)) * smoothstep(0.02, 0.07, abs(wy - 0.42));        // a mullion and a top-light bar
    float seat = smoothstep(-0.05, 0.05, wy + 0.3 + 0.24 * cos(fz * 12.566));                      // two seat backs against the light
    em = mix(1.0, 4.3, smoothstep(12.0, 70.0, length(uCamL - vL))) * mix(0.2, 1.0, mull * seat) * (0.7 + 0.3 * smoothstep(-0.8, 0.8, wy)) * (0.88 + 0.12 * sin(uTime * 5.0 + floor((vO.z + 9.6) / 2.75 + 0.5) * 2.4));
  }
  c += vCol * em * uGlow * mix(0.4, 1.0, smoothstep(3.0, 15.0, length(uCamL - vL)));   // printed windows, lamps (a lamp right beside the eye does not blind it)
  gl_FragColor = vec4(c, 1.0);
  #include <fog_fragment>
}`;

const MTN_VERT = /* glsl */`
attribute vec3 aMat;   // snow, flock, baked warm glow
varying vec3 vCol, vN, vL, vMat;
#include <fog_pars_vertex>
void main() {
  vCol = color; vN = normal; vL = position; vMat = aMat;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const MTN_FRAG = /* glsl */`
varying vec3 vCol, vN, vL, vMat;
uniform vec4 uHelix;   // A0, sweep, r0, r1
uniform vec4 uTun;     // a1, a2, y0, y1
uniform vec3 uSnowCol, uCutA, uCutB;   // a straight bore (the world's hill tunnel): rail-top ends of its axis, level
#include <fog_pars_fragment>
${GLSL_LIGHT}
void main() {
  // --- bore the tunnel through the shell (analytic arch section swept along the helix)
  float ang = atan(-vL.z, vL.x);
  float am = 0.5 * (uTun.x + uTun.y);
  float a = ang + 6.2831853 * floor((am - ang) / 6.2831853 + 0.5);
  if (a > uTun.x && a < uTun.y) {
    float t = (a - uHelix.x) / uHelix.y;
    float lat = length(vL.xz) - mix(uHelix.z, uHelix.w, t);
    float v = vL.y - mix(uTun.z, uTun.w, t);
    if (v > -0.35 && ((abs(lat) < 7.0 && v < 10.0) || length(vec2(lat, v - 10.0)) < 7.0)) discard;
  }
  { vec3 ab = uCutB - uCutA; float L2 = dot(ab.xz, ab.xz);
    if (L2 > 1.0) { float tc = dot(vL.xz - uCutA.xz, ab.xz) / L2, latc = dot(vL.xz - uCutA.xz, vec2(-ab.z, ab.x)) * inversesqrt(L2), vc = vL.y - uCutA.y;
      if (tc > 0.0 && tc < 1.0 && vc > -0.35 && ((abs(latc) < 7.0 && vc < 10.0) || length(vec2(latc, vc - 10.0)) < 7.0)) discard; } }
  vec3 N = normalize(vN);
  float camD = length(uCamL - vL), nearK = 1.0 - smoothstep(50.0, 260.0, camD), midK = 1.0 - smoothstep(220.0, 700.0, camD);
  vec3 bn = vec3(vnoise(vL * 0.42 + 3.1), vnoise(vL * 0.42 + 17.7), vnoise(vL * 0.42 + 41.3)) - 0.5;
  bn = 0.7 * bn + 0.45 * (vec3(vnoise(vL * 1.3 + 7.0), vnoise(vL * 1.3 + 23.0), vnoise(vL * 1.3 + 51.0)) - 0.5);
  bn += 0.4 * nearK * (vec3(vnoise(vL * 3.7 + 5.0), vnoise(vL * 3.7 + 29.0), vnoise(vL * 3.7 + 61.0)) - 0.5);
  float snow = smoothstep(0.35, 0.65, vMat.x + 0.25 * (vnoise(vL * 0.22) - 0.5) + 0.22 * (vnoise(vL * 0.9 + 13.0) - 0.5));
  float flock = vMat.y * (1.0 - snow);
  // papier-mache: overlapping paper strips (soft bands with dark torn edges), brush streaks, and the paint's own grit up close
  vec3 q = vL * vec3(0.16, 0.5, 0.16) + 2.0 * vnoise(vL * 0.07);
  float strip = vnoise(q); float edge = smoothstep(0.03, 0.0, abs(fract(strip * 3.0) - 0.5) - 0.465);
  float brush = vnoise(vL * vec3(1.3, 0.25, 1.3));
  float fine = vnoise(vL * 2.6) - 0.5, grit = vnoise(vL * 6.0) - 0.5;
  float crack = smoothstep(0.03, 0.0, abs(vnoise(vL * vec3(0.33, 0.8, 0.33) + 20.0) - 0.5 + 0.06 * fine)) * smoothstep(0.35, 0.65, vnoise(vL * 0.13 + 4.0)) * smoothstep(0.3, 0.6, vnoise(vL * 0.9 + 31.0)) * (0.3 + 0.7 * smoothstep(14.0, 60.0, camD));
  vec3 alb = vCol * (0.76 + 0.26 * strip + 0.22 * (brush - 0.5) + midK * 0.2 * fine + nearK * 0.14 * grit) * (1.0 - (0.17 * edge * (0.3 + 0.7 * brush) + 0.34 * crack * midK) * (1.0 - flock));
  alb *= 1.0 + (1.0 - flock) * (1.0 - snow) * nearK * smoothstep(0.75, 0.95, vN.y) * (0.55 * (vnoise(vL * 3.3) - 0.5) + 0.45 * (vnoise(vL * 7.7 + 3.0) - 0.5));   // ballast and gravel, close to
  // painted strata: paler and darker beds that dip and wander round the rock, thin seams between them
  float bed = vL.y * 0.21 + 0.022 * (vL.x + vL.z) + 2.6 * vnoise(vL * 0.045 + 11.0);
  float bf = fract(bed), bid = floor(bed);
  float bed2 = bed * 3.7 + 0.8 * fine, bf2 = fract(bed2);
  alb *= mix(1.0, (0.78 + 0.42 * hash13(vec3(bid, 5.0, 9.0))) * (0.74 + 0.26 * smoothstep(0.0, 0.14, bf) * smoothstep(1.0, 0.9, bf)) * (0.9 + 0.2 * midK * hash13(vec3(floor(bed2), 2.0, 4.0))) * (1.0 - 0.16 * midK * (1.0 - smoothstep(0.0, 0.12, bf2))), (1.0 - flock) * 0.85);
  // flock: speckle, tufted patches of straw and moss, stitched seams where the green sheets meet
  float sp = hash13(floor(vL * 3.0));
  float seam = smoothstep(0.06, 0.0, abs(fract(vL.x * 0.031 + vL.y * 0.02 + 0.6 * vnoise(vL * 0.03)) - 0.5) - 0.47);
  float pch = vnoise(vL * 0.1 + 7.0), tuft = vnoise(vL * vec3(0.9, 0.3, 0.9) + 3.0);
  vec3 fcol = vCol * (0.6 + 0.4 * sp + 0.3 * tuft) * mix(vec3(1.0), vec3(1.45, 1.1, 0.75), smoothstep(0.5, 0.72, pch) * 0.5) * mix(1.0, 0.62, smoothstep(0.5, 0.25, pch) * smoothstep(0.4, 0.7, vnoise(vL * 0.4)));
  alb = mix(alb, fcol, flock * 0.85) * (1.0 - 0.45 * seam * flock);
  float hollow = smoothstep(0.32, 0.68, vnoise(vL * 0.085 + 5.0) * 0.7 + 0.3 * vnoise(vL * 0.3));
  alb = mix(alb, uSnowCol * (0.66 + 0.2 * brush + 0.16 * midK * fine) * mix(vec3(0.7, 0.78, 1.0) * 0.74, vec3(1.0), hollow), snow);      // packed snow: blue in the hollows
  N = normalize(N + bn * mix(1.0, 0.7, snow) * (1.0 - 0.5 * flock));   // crumpled paper / packed snow relief
  vec3 c = atticLight(alb, N, vL, 0.0, 0.0);
  vec3 albW = mix(alb, vec3(dot(alb, vec3(0.34, 0.45, 0.21))), 0.45);
  c += albW * mix(uWarm, vec3(1.0, 0.8, 0.55), 0.45) * vMat.z * 1.05 * uGlow * (1.0 - 0.45 * snow) * mix(0.3, 1.0, smoothstep(4.0, 18.0, camD));
  // the attic's own bounce: a cool sky-fill so the unlit flanks keep their papier-mache form, and a moon rim
  float mdl = dot(N, uMoonDir);
  float hemi = 0.5 + 0.36 * N.y + 0.2 * mdl + 0.2 * max(-mdl, 0.0);            // the window side is the lit side; the far side falls to shadow
  c += alb * (uMoonCol * 0.42 + uAmb * 0.5) * uMtnFill * hemi * (1.0 - 0.72 * snow);
  c += alb * mix(uMoonCol, uAmb * 0.35, 0.3) * (0.42 + 0.35 * uMoonI) * uMtnFill * pow(1.0 - clamp(dot(N, normalize(uCamL - vL)), 0.0, 1.0), 2.5) * (1.0 - 0.5 * snow);
  { vec3 Lh = vL - uHeadP.xyz; float dh = length(Lh) + 0.001; Lh /= dh;                                    // the headlamp again, wider, on rock near the line
    c += albW * vec3(1.0, 0.84, 0.58) * uHeadP.w * 0.95 * smoothstep(3.0, 17.0, dh) * smoothstep(0.45, 0.95, dot(Lh, uHeadD)) * clamp(dot(N, -Lh) * 0.55 + 0.45, 0.0, 1.0) / (1.0 + dh * dh * 0.0009); }
  // mica: point-by-point flashes, strong only inside the moon shaft
  vec3 cp = vL * 1.25; vec3 ci = floor(cp); float h = hash13(ci);
  vec3 V = normalize(uCamL - vL);
  float tw = pow(max(0.0, sin(uTime * (0.8 + 2.6 * h) + h * 60.0 + dot(V, vec3(9.0, 5.0, 7.0)) * 5.0)), 10.0);
  float dotm = 1.0 - smoothstep(0.12, 0.42, length(fract(cp) - 0.5));
  c += uMoonCol * snow * step(0.86, h) * tw * dotm * (0.10 + 5.0 * shaftMask(vL)) * uMoonI * 0.5;
  { vec3 gp = vL * 4.0; float gh = hash13(floor(gp));                                                       // finer grains, everywhere there is snow
    float gt = 0.3 + 0.7 * pow(max(0.0, sin(uTime * (1.2 + 3.0 * gh) + gh * 90.0 + dot(V, vec3(13.0, 7.0, 11.0)) * 6.0)), 4.0);
    c += uMoonCol * snow * step(0.985, gh) * gt * (1.0 - smoothstep(0.15, 0.5, length(fract(gp) - 0.5))) * (0.45 + 3.2 * shaftMask(vL)) * uMoonI * nearK; }
  gl_FragColor = vec4(c, 1.0);
  #include <fog_fragment>
}`;

const PTS_VERT = /* glsl */`
attribute vec3 aCol; attribute vec4 aPar;   // size, kind(0 bulb,1 dust,2 mica,3 blink), phase, speed
uniform float uPx;
varying vec3 vC;
#include <fog_pars_vertex>
${GLSL_LIGHT}
void main() {
  vec3 p = position; float k = aPar.y, ph = aPar.z, sp = aPar.w, b = 1.0;
  if (k > 0.5 && k < 1.5) {
    p += vec3(sin(uTime * sp + ph), 0.7 * sin(uTime * sp * 0.63 + ph * 2.3), cos(uTime * sp * 0.81 + ph * 3.1)) * 7.0;
    p.y -= mod(uTime * 0.35 * sp + ph * 3.0, 14.0) - 7.0;
    float tw = pow(max(0.0, sin(uTime * (1.0 + sp * 2.0) + ph * 9.0)), 6.0);
    b = shaftMask(p) * (0.25 + 2.2 * tw) * uMoonI * 0.5 + 0.015;
  } else if (k > 1.5 && k < 2.5) {
    vec3 V = normalize(uCamL - p);
    float tw = pow(max(0.0, sin(uTime * sp + ph * 20.0 + dot(V, vec3(8.0, 4.0, 6.0)) * 4.0)), 14.0);
    b = tw * (0.04 + shaftMask(p)) * uMoonI * 0.5;
  } else if (k > 2.5) {
    b = smoothstep(0.0, 0.35, sin(uTime * 3.2 + ph)) * uGlow;
  } else {
    b = (0.88 + 0.12 * sin(uTime * 7.0 * sp + ph * 11.0)) * uGlow;
  }
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float px = aPar.x * uPx * projectionMatrix[1][1] / max(-mvPosition.z, 1.0);
  if (k > 0.5 && k < 2.5) px = min(px, 5.0);
  gl_PointSize = clamp(px, 1.6, 34.0);
  vC = aCol * b * clamp(px / 1.6, 0.35, 1.0) * mix(0.1, 1.0, smoothstep(7.0, 48.0, -mvPosition.z));   // bulbs right beside the eye do not blind it
  #include <fog_vertex>
}`;
const PTS_FRAG = /* glsl */`
varying vec3 vC;
#include <fog_pars_fragment>
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = exp(-d * d * 7.0) + 0.35 * exp(-d * d * 1.8); a *= 1.0 - smoothstep(0.8, 1.0, d);
  ${GLSL_FOGFADE}
  gl_FragColor = vec4(vC * a * (1.0 - fogF), 1.0);
}`;

const SHAFT_VERT = /* glsl */`
varying vec3 vN, vL; varying float vAx;
#include <fog_pars_vertex>
void main() {
  vN = normal; vAx = uv.y; vL = position;                      // geometry is baked in hero-local space
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHAFT_FRAG = /* glsl */`
varying vec3 vN, vL; varying float vAx;
#include <fog_pars_fragment>
${GLSL_LIGHT}
void main() {
  float f = abs(dot(normalize(vN), normalize(uCamL - vL)));
  float streak = vnoise(vec3(vL.y * 0.07, vL.z * 0.07, vL.x * 0.008 + uTime * 0.03)) * 0.7 + 0.3 * vnoise(vL * 0.25 + uTime * 0.05);
  float fade = smoothstep(0.0, 0.22, vAx) * (1.0 - smoothstep(0.55, 1.0, vAx));
  ${GLSL_FOGFADE}
  gl_FragColor = vec4(uMoonCol * uMoonI * 0.04 * pow(f, 1.6) * (0.55 + 0.9 * streak) * fade * (1.0 - fogF), 1.0);
}`;
const SMOKE_VERT = /* glsl */`
attribute vec2 aPar;   // size, alpha
uniform float uPx;
varying vec4 vC;
#include <fog_pars_vertex>
${GLSL_LIGHT}
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = clamp(aPar.x * uPx * projectionMatrix[1][1] / max(-mvPosition.z, 1.0), 2.0, 160.0);
  vec3 Lp = uPortalP - position;
  vec3 c = uAmb * 0.9 + uMoonCol * uMoonI * (0.03 + 0.42 * shaftMask(position)) + uPortalCol * uPortalI * 220.0 / (220.0 + dot(Lp, Lp)) + uWarm * 0.05;
  vC = vec4(mix(c, vec3(dot(c, vec3(0.3333))), 0.7) * 0.8 + uWarm * 0.012, aPar.y * smoothstep(3.0, 15.0, -mvPosition.z));   // a puff passing right over the eye thins out
  #include <fog_vertex>
}`;
const SMOKE_FRAG = /* glsl */`
varying vec4 vC;
#include <fog_pars_fragment>
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = 1.0 - smoothstep(0.0, 1.0, d); a = a * a * vC.a;
  gl_FragColor = vec4(vC.rgb, a);
  #include <fog_fragment>
}`;

// uniform-step polyline: arrays + O(1) lookup by arc length
export function makeTrack(raw, closed) {
  const pts = [], step = 1;
  let acc = 0; pts.push(raw[0].clone());
  for (let i = 1; i < raw.length; i++) {
    const a = raw[i - 1], b = raw[i], L = a.distanceTo(b); let t = (step - acc);
    while (t <= L) { pts.push(a.clone().lerp(b, t / L)); t += step; }
    acc = (acc + L) % step;
  }
  const n = pts.length, length = closed ? n : n - 1;
  const tr = {
    pts, n, length, closed,
    at(s, out, tan) {
      if (closed) s = ((s % n) + n) % n; else s = clamp(s, 0, n - 1.001);
      const i = Math.floor(s), f = s - i, a = pts[i], b = pts[(i + 1) % n];
      out.lerpVectors(a, b, f);
      if (tan) {
        const p0 = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], p1 = pts[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
        tan.subVectors(p1, p0).normalize();
      }
      return out;
    },
  };
  return tr;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('attic-hero') : ctx.rng, noise = ctx.noise, rngMain = rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PAL).map(C);
  const [cAir, cUmber, cShadow, cMoon, cGold, cRed, cFlock] = pal;
  const root = new THREE.Group(); root.name = 'attic-railway-hero';
  let _sd = 0; { const t = String(ctx.seed ?? 1) + ':attic-spur'; for (let i = 0; i < t.length; i++) _sd = (Math.imul(_sd, 31) + t.charCodeAt(i)) >>> 0; }
  const r2 = (a = 0, b = 1) => { _sd = (Math.imul(_sd, 1664525) + 1013904223) >>> 0; return a + (b - a) * (_sd / 4294967296); };
  const moonDir = new THREE.Vector3(0.986, 0.165, 0);
  if (opts.moonDir) { Array.isArray(opts.moonDir) ? moonDir.fromArray(opts.moonDir) : moonDir.copy(opts.moonDir); }
  moonDir.normalize();
  const shaftR = opts.shaftRadius ?? 45;

  // ------------------------------------------------------------ the track
  const A0 = THREE.MathUtils.degToRad(225), SWEEP = THREE.MathUtils.degToRad(375), R0 = 85, R1 = 50, Y0 = 30, Y1 = 125, YS = 127;
  const LEAD = 64, STRAIGHT = 70, ARC_R = 22;
  const raw = [];
  const hp = (a) => { const t = (a - A0) / SWEEP, r = lerp(R0, R1, t); return new THREE.Vector3(r * Math.cos(a), lerp(Y0, Y1, t), -r * Math.sin(a)); };
  { // lead-in trestle, straight and level, tangent to the helix start
    const p0 = hp(A0), p1 = hp(A0 + 0.01), d = p1.clone().sub(p0).setY(0).normalize();
    for (let i = LEAD; i >= 1; i -= 2) raw.push(p0.clone().addScaledVector(d, -i));
  }
  const helixS0 = LEAD;
  for (let a = A0; a < A0 + SWEEP; a += 0.012) raw.push(hp(a));
  raw.push(hp(A0 + SWEEP));
  { // closing arc: keep turning left until the heading is due north, climbing the last 2 units
    const b = raw[raw.length - 1], a = raw[raw.length - 2];
    let psi = Math.atan2(-(b.x - a.x), -(b.z - a.z)); const p = b.clone(), psi0 = psi;
    while (psi < 0) { psi = Math.min(0, psi + 0.5 / ARC_R); p.x += -Math.sin(psi) * 0.5; p.z += -Math.cos(psi) * 0.5; p.y = lerp(Y1, YS, smoothstep(psi0, 0, psi)); raw.push(p.clone()); }
    for (let i = 1; i <= STRAIGHT; i++) raw.push(new THREE.Vector3(p.x, YS, p.z - i));
  }
  const track = makeTrack(raw, false);
  const TL = track.length, straightS0 = TL - STRAIGHT;
  const archP = track.pts[track.n - 1].clone();                 // rail-top centre on the arch plane
  // lower loop: a closed circuit round the foot, gently undulating
  const LOOP_R = 100, loopPh = rng.range(0, TAU), rawL = [];
  for (let i = 0; i <= 420; i++) { const a = (i / 420) * TAU; rawL.push(new THREE.Vector3(LOOP_R * Math.cos(a), 12.5 + 1.8 * Math.sin(2 * a + loopPh), -LOOP_R * Math.sin(a))); }
  const loop = makeTrack(rawL, true);

  // ------------------------------------------------------------ the mountain's height field
  const pk = new THREE.Vector2(archP.x + rng.range(-2.5, 2.5), archP.z - 14 - rng.range(0, 2));
  const PKH = 160, p1 = rng.range(0, TAU), p2 = rng.range(0, TAU), p3 = rng.range(0, TAU), nOff = rng.range(0, 500);
  const lobeA = rng.range(0.07, 0.12), lobeB = rng.range(0.04, 0.075);
  const PROF = [[0, 129], [28, 127], [42, 123], [50, 110], [57, 88], [68, 58], [80.5, 34], [95, 15], [106, 4], [114, 0], [400, 0]];
  const prof = (r) => { let i = 1; while (PROF[i][0] < r) i++; const a = PROF[i - 1], b = PROF[i]; const t = (r - a[0]) / (b[0] - a[0]); return lerp(a[1], b[1], t * t * (3 - 2 * t) * 0.5 + t * 0.5); };
  function hNat(x, z) {
    const r = Math.hypot(x, z), th = Math.atan2(-z, x);
    let lobe = lobeA * Math.sin(3 * th + p1) + lobeB * Math.sin(5 * th + p2) + 0.045 * Math.sin(2 * th + p3) + 0.11 * noise.fbm2(x * 0.011 + nOff, z * 0.011, 3);
    lobe = 1 + lobe * lerp(1, 0.3, smoothstep(84, 112, r));
    let h = prof(r / lobe);
    h += (4.5 * noise.fbm2(x * 0.045 + nOff, z * 0.045 + 7, 4) + 2.2 * noise.ridged2(x * 0.09, z * 0.09 + nOff, 2) - 1.2) * smoothstep(0, 18, h) * (1 - 0.6 * smoothstep(110, 128, h));
    h += 2.7 * Math.max(0, noise.fbm2(x * 0.085 + nOff, z * 0.085 + 3, 2) + 0.12) * smoothstep(117, 125, h);   // snow drifts and outcrops on the summit shelf
    const dx = x - pk.x, dz = z - pk.y;
    const d = Math.hypot(dx, dz > 0 ? dz * 0.68 : dz) * (1 + 0.16 * noise.fbm2(x * 0.06 + 40, z * 0.06 + nOff, 3));
    const hp2 = PKH - 0.02 * d * d - Math.max(0, d - 21) * 3.4 + 3 * noise.fbm2(x * 0.11 + nOff, z * 0.11, 3) * smoothstep(3, 14, d);
    const k = 9, m = clamp(0.5 + 0.5 * (hp2 - h) / k, 0, 1);
    h = lerp(h, hp2, m) + k * m * (1 - m);
    return h * (1 - smoothstep(107, 119, r));
  }
  await ctx.yield();

  // ------------------------------------------------------------ carve ledges, find the tunnel
  const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _q = new THREE.Vector3(), _r = new THREE.Vector3();
  const gapM = new Float32Array(track.n);
  for (let i = 0; i < track.n; i++) { const p = track.pts[i]; gapM[i] = p.y - hNat(p.x, p.z); }
  let iMin = helixS0; for (let i = helixS0; i < straightS0 - 40; i++) if (gapM[i] < gapM[iMin]) iMin = i;
  let tunI0 = iMin, tunI1 = iMin;
  while (tunI0 > helixS0 + 5 && gapM[tunI0 - 1] < -21) tunI0--;
  while (tunI1 < straightS0 - 45 && gapM[tunI1 + 1] < -21) tunI1++;
  if (tunI1 - tunI0 < 24) { tunI0 = iMin - 14; tunI1 = iMin + 14; }
  const aOfY = (y) => A0 + SWEEP * (y - Y0) / (Y1 - Y0);
  const tunA0 = aOfY(track.pts[tunI0].y), tunA1 = aOfY(track.pts[tunI1].y);
  const inTunnel = (i) => i > tunI0 && i < tunI1;
  await ctx.yield();

  const CELL = 20, GN = 14, cells = Array.from({ length: GN * GN }, () => []);
  const cs = []; // carve samples: x, z, y, halfWidth, embank flag
  const pushS = (p, hw, gap) => { const ci = Math.floor((p.x + 140) / CELL), cj = Math.floor((p.z + 140) / CELL); if (ci < 0 || cj < 0 || ci >= GN || cj >= GN) return; cells[cj * GN + ci].push(cs.length / 5); cs.push(p.x, p.z, p.y, hw, gap > -0.5 && gap < 4.5 ? 1 : 0); };
  for (let i = 0; i < track.n; i++) if (!inTunnel(i)) { const j = Math.min(Math.abs(i - tunI0), Math.abs(i - tunI1)); pushS(track.pts[i], 6.5 + 3.4 * smoothstep(1, 9, j) * smoothstep(34, 16, j), gapM[i]); }
  const csMain = cs.length;
  await ctx.yield();
  const gapL = new Float32Array(loop.n);
  for (let i = 0; i < loop.n; i++) { const p = loop.pts[i]; gapL[i] = p.y - hNat(p.x, p.z); pushS(p, 5.5, gapL[i] < 7 ? 2 : 9); }
  // the mine spur: a dead-end siding on a ledge cut round the bare south-west face (the face the reveal looks at),
  // now in a cutting, now out on timber bents, running into a mine adit at its north end
  await ctx.yield();
  const SPUR_Y = 52, rawS = [];
  for (let k = 0; k <= 170; k++) { const f = k / 170, a = THREE.MathUtils.degToRad(lerp(216, 90, f)), r = 72 - 13 * smoothstep(0.84, 1, f); rawS.push(new THREE.Vector3(r * Math.cos(a), SPUR_Y, -r * Math.sin(a))); }
  const spur = makeTrack(rawS, false);
  for (let i = 0; i < spur.n; i++) { const p = spur.pts[i]; pushS(p, 5.5, p.y - hNat(p.x, p.z)); }
  // little terraces for chalets up the bare west and south-west faces: lit windows and door lamps at many heights, seen from below
  // (the summit horn makes that face a cliff, so places on it are found by height: the radius at which the face stands at y)
  const rAtY = (hf, a, y) => { const c = Math.cos(a), sn = -Math.sin(a); let lo = 44, hi = 117; for (let i = 0; i < 13; i++) { const m = (lo + hi) / 2; if (hf(m * c, m * sn) > y) lo = m; else hi = m; } return (lo + hi) / 2; };
  const nearLine = (x, z, y, rad, dy) => { for (let o = 0; o < cs.length; o += 5) { const dx = x - cs[o], dz = z - cs[o + 1]; if (dx * dx + dz * dz < rad * rad && Math.abs(cs[o + 2] - y) < dy) return true; } return false; };
  await ctx.yield();
  const perch = [];
  for (let k = 0; k < 19; k++) {
    if (k % 3 === 0) await ctx.yield();                               // (the last six: the south-east face, beside the driver as the express comes onto the mountain)
    const a = THREE.MathUtils.degToRad(k < 5 ? r2(24, 100) : k < 9 ? r2(36, 114) : k < 13 ? r2(102, 178) : r2(206, 264)), y = k < 5 ? r2(28, 62) : k < 9 ? r2(66, 100) : k < 13 ? r2(22, 40) : r2(52, 100);
    const r = rAtY(hNat, a, y) - 2.2, x = r * Math.cos(a), z = -r * Math.sin(a);
    if (r < 50 || nearLine(x, z, y, 15, 24)) continue;
    let bore = false; for (let i = tunI0 - 4; i <= tunI1 + 4 && !bore; i += 3) { const q = track.pts[i]; if (Math.hypot(x - q.x, z - q.z) < 17 && Math.abs(q.y + 8 - y) < 24) bore = true; }
    if (bore) continue;
    perch.push({ x, z, a }); pushS(new THREE.Vector3(x, y, z), 4.8, 1);
  }
  let lastD = 99;
  function hFinal(x, z) {
    let h = hNat(x, z), mn = 1e9, mx = -1e9, dn = 99;
    const ci = Math.floor((x + 140) / CELL), cj = Math.floor((z + 140) / CELL);
    for (let j = Math.max(0, cj - 1); j <= Math.min(GN - 1, cj + 1); j++) for (let i = Math.max(0, ci - 1); i <= Math.min(GN - 1, ci + 1); i++) {
      const c = cells[j * GN + i];
      for (let k = 0; k < c.length; k++) {
        const o = c[k] * 5, dx = x - cs[o], dz = z - cs[o + 1], d = Math.sqrt(dx * dx + dz * dz), e = Math.max(0, d - cs[o + 3]);
        const lim = cs[o + 2] - 0.75 + e * (2.4 + 1.8 * smoothstep(50, 100, cs[o + 2])) + e * e * 0.25; if (lim < mn) mn = lim;
        if (cs[o + 4] > 0) { const f = cs[o + 2] - 0.75 - Math.max(0, d - cs[o + 3] + 1.5) * 1.3; if (f > mx) mx = f; }
        if (d < dn && Math.abs(cs[o + 2] - 0.75 - Math.min(h, lim)) < 2.5) dn = d;
      }
    }
    lastD = dn;
    return Math.max(Math.min(h, mn), Math.min(mx, h + 6));
  }

  // ------------------------------------------------------------ mountain shell (polar grid)
  const NR = 92, NA = 240, RG = 119.5;
  const mPos = new Float32Array((NR + 1) * NA * 3), mCol = new Float32Array((NR + 1) * NA * 3), mMat = new Float32Array((NR + 1) * NA * 3), mBed = new Float32Array((NR + 1) * NA);
  for (let i = 0; i <= NR; i++) {
    const r = RG * Math.pow(i / NR, 0.92);
    for (let j = 0; j < NA; j++) {
      const a = (j / NA) * TAU + (i & 1) * (Math.PI / NA), x = r * Math.cos(a), z = -r * Math.sin(a), o = (i * NA + j) * 3;
      mPos[o] = x; mPos[o + 1] = i === NR ? 0 : hFinal(x, z); mPos[o + 2] = z; mBed[i * NA + j] = lastD;
    }
    await ctx.yield();
  }
  const mIdx = [];
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) {
    const a = i * NA + j, b = i * NA + (j + 1) % NA, c = (i + 1) * NA + j, d = (i + 1) * NA + (j + 1) % NA;
    if (i === 0) { mIdx.push(a, c, d); continue; }
    if (i & 1) mIdx.push(a, c, d, a, d, b); else mIdx.push(a, c, b, b, c, d);
  }
  const mGeo = new THREE.BufferGeometry();
  mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  mGeo.setIndex(mIdx); await ctx.yield(); mGeo.computeVertexNormals(); await ctx.yield();
  {
    const nrm = mGeo.attributes.normal.array;
    const rockA = cUmber.clone().lerp(C('#8a7a68'), 0.55), rockB = cUmber.clone().lerp(C('#6b5a4e'), 0.35), rockC = cUmber.clone().lerp(C('#9a8266'), 0.5);
    const flA = cFlock.clone(), flB = cFlock.clone().lerp(C('#8a8a3c'), 0.45), flC = cFlock.clone().multiplyScalar(0.62);
    const bed = cUmber.clone().lerp(C('#77706a'), 0.5), col = new THREE.Color();
    const snowLine = 104 + rng.range(-4, 5), flockLine = 34 + rng.range(-6, 10);
    for (let v = 0; v < (NR + 1) * NA; v++) {
      const o = v * 3, x = mPos[o], y = mPos[o + 1], z = mPos[o + 2], ny = nrm[o + 1];
      const n1 = noise.fbm2(x * 0.03 + 11, z * 0.03 + nOff, 3), n2 = noise.n3(x * 0.07, y * 0.16, z * 0.07);
      col.copy(rockA).lerp(rockB, smoothstep(-0.4, 0.5, n2)).lerp(rockC, smoothstep(0.1, 0.7, n1) * 0.6);
      col.multiplyScalar(0.8 + 0.25 * smoothstep(0.2, 0.9, ny));
      const fl = smoothstep(0.5, 0.72, ny) * (1 - smoothstep(flockLine - 8, flockLine + 14, y + 16 * n1));
      if (fl > 0) { const g = n2 > 0.25 ? flB : n1 < -0.2 ? flC : flA; col.lerp(g, fl); }
      const bd = 1 - smoothstep(4.2, 6.2, mBed[v]);
      col.lerp(bed, bd * 0.85);
      let sn = smoothstep(snowLine - 7, snowLine + 9, y + 9 * n1) * smoothstep(0.3, 0.62, ny + 0.5 * smoothstep(122, 148, y + 6 * n1));
      sn = Math.max(sn * (1 - 0.8 * bd), 0);
      mCol[o] = col.r; mCol[o + 1] = col.g; mCol[o + 2] = col.b;
      mMat[o] = sn; mMat[o + 1] = fl * (1 - bd); mMat[o + 2] = 0;
      if ((v & 511) === 511) await ctx.yield();
    }
  }
  mGeo.setAttribute('color', new THREE.BufferAttribute(mCol, 3));
  mGeo.setAttribute('aMat', new THREE.BufferAttribute(mMat, 3));
  await ctx.yield();

  // ------------------------------------------------------------ static props: track, trestles, bore, masonry
  const B = new Batch();
  const bulbs = [];   // { p: Vector3, c: Color (HDR), size, kind, phase, speed }
  const addBulb = (p, c, size, kind = 0) => bulbs.push({ p: p.clone(), c, size, kind, phase: rng.range(0, TAU), speed: rng.range(0.6, 1.4) });
  const gold = cGold.clone(), goldHDR = cGold.clone().multiplyScalar(5.0);
  const cTimber = [C('#7a5532'), C('#684526'), C('#8a6540'), C('#5a3c22')], cSleeper = cUmber.clone().multiplyScalar(1.3), cRail = C('#aab2c0'), cSteel = C('#3b3a3a'), cGlint = C('#77736e');
  const cSleepers = [1.0, 0.82, 1.18, 0.92, 1.08].map((k) => cUmber.clone().lerp(C('#6a5a4a'), 0.25).multiplyScalar(1.3 * k));
  const cStone = [C('#7d7466'), C('#8f8472'), C('#6c645a'), C('#9d917b')], cSoot = C('#1c1815'), cBrass = C('#c9973a'), cBlack = C('#16161a');
  const frame = (tr, s, m) => {  // matrix with +Z = travel direction, +X = left... (x = t x up => right-handed basis x:right? see below)
    tr.at(s, _p, _t); _q.crossVectors(_Y, _t).normalize(); _r.crossVectors(_t, _q).normalize();
    return m.makeBasis(_q, _r, _t).setPosition(_p);            // x = LEFT of travel, y = up, z = forward
  };
  const M = new THREE.Matrix4(), M2 = new THREE.Matrix4();
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), vd = new THREE.Vector3();
  async function layTrack(tr, gauge) {
    const n = Math.floor(tr.length / 2);
    for (let k = 0; k < n; k++) {
      if ((k & 31) === 31) await ctx.yield();
      const s0 = k * 2, s1 = Math.min(tr.closed ? s0 + 2 : tr.length - 0.01, s0 + 2);
      tr.at(s0, va, _t); _q.crossVectors(_Y, _t).normalize(); tr.at(s1, vb, _t); _r.crossVectors(_Y, _t).normalize();
      if (k % 2 === 0) for (const sd of [-1, 1]) {
        tr.at(Math.min(tr.closed ? s0 + 4 : tr.length - 0.01, s0 + 4), vb, _t); _r.crossVectors(_Y, _t).normalize();
        vc.copy(va).addScaledVector(_q, sd * gauge).setY(va.y - 0.22); vd.copy(vb).addScaledVector(_r, sd * gauge).setY(vb.y - 0.22);
        vd.addScaledVector(vd.clone().sub(vc).normalize(), 0.06); B.beam(vc, vd, 0.3, cSteel, null, 0.4);
        vc.y += 0.17; vd.y += 0.17; B.beam(vc, vd, 0.1, cGlint, null, 0.6);            // the polished running surface: a thin glint
      }
      frame(tr, s0 + 1, M); B.box(0, -0.6, 0, gauge * 2 + 1.4, 0.36, 0.95, k % 7 === 3 ? cTimber[3] : cSleepers[(k * 3 + (k >> 2)) % 5], 0, 0, 0.1, M);
    }
  }
  await layTrack(track, 2); await ctx.yield(); await layTrack(loop, 2); await ctx.yield(); await layTrack(spur, 2);
  await ctx.yield();

  // timber trestle bents wherever the rail floats above the shell
  async function trestles(tr, isMain, pick = () => rng.pick(cTimber)) {
    let prev = null, nb = 0; const span = 9;
    for (let s = isMain ? 3 : 0; s < tr.length - (isMain ? 3 : 0); s += span) {
      if ((++nb & 7) === 0) await ctx.yield();
      const i = Math.floor(s); if (isMain && i > tunI0 - 5 && i < tunI1 + 5) { prev = null; continue; }
      tr.at(s, _p, _t); const y = _p.y - 0.8, gc = y - hFinal(_p.x, _p.z);
      if (gc < 2.2) { prev = null; continue; }
      _q.crossVectors(_Y, _t).normalize(); const P = _p.clone(), L = _q.clone();
      const feet = []; let ok = true;
      for (const sd of [-1, 1]) {
        let lat = 3.3, g = 0, h = gc;
        for (let it = 0; it < 3; it++) { lat = 3.3 + 0.13 * h; va.copy(P).addScaledVector(L, sd * lat); g = hFinal(va.x, va.z); h = Math.max(0.5, y - g); }
        const rf = Math.hypot(va.x, va.z);
        if (isMain && Math.abs(rf - LOOP_R) < 5.5 && g < 20) ok = false;
        feet.push({ sd, lat, g: g - 0.6, h });
      }
      const col = pick();
      if (ok) {
        const top = [], foot = [];
        for (const f of feet) {
          const a = P.clone().addScaledVector(L, f.sd * 3.3).setY(y), b = P.clone().addScaledVector(L, f.sd * f.lat).setY(f.g);
          B.beam(a, b, 0.85, col); top.push(a); foot.push(b);
          B.box(b.x, b.y + 0.5, b.z, 2.0, 1.0, 2.0, cStone[2], 0, 0, 0.1);            // footing block
        }
        // horizontals + X bracing in tiers between the two legs
        const hMin = Math.min(feet[0].h, feet[1].h), tiers = Math.min(8, Math.floor(hMin / 6.5));
        let pa = top[0], pb = top[1];
        for (let k = 1; k <= tiers; k++) {
          const f = k / (tiers + 0.35) * (hMin / feet[0].h), g2 = k / (tiers + 0.35) * (hMin / feet[1].h);
          const qa = top[0].clone().lerp(foot[0], f), qb = top[1].clone().lerp(foot[1], g2);
          B.beam(qa, qb, 0.5, col); B.beam(pa, qb, 0.36, col); B.beam(pb, qa, 0.36, col); pa = qa; pb = qb;
        }
      }
      // cap beam, and stringers + guard rail back to the previous bent
      va.copy(P).addScaledVector(L, -4.3).setY(y); vb.copy(P).addScaledVector(L, 4.3).setY(y); B.beam(va, vb, 0.8, col);
      const cur = { P, L, y };
      if (prev) {
        for (const sd of [-2, 2]) { va.copy(prev.P).addScaledVector(prev.L, sd).setY(prev.y + 0.05); vb.copy(P).addScaledVector(L, sd).setY(y + 0.05); B.beam(va, vb, 0.6, cTimber[1]); }
        va.copy(prev.P).addScaledVector(prev.L, -4.2).setY(prev.y + 2.6); vb.copy(P).addScaledVector(L, -4.2).setY(y + 2.6); B.beam(va, vb, 0.26, cTimber[2]);
      }
      va.copy(P).addScaledVector(L, -4.2).setY(y); vb.copy(va).setY(y + 2.7); B.beam(va, vb, 0.3, cTimber[2]);
      prev = cur;
    }
  }
  await trestles(track, true); await ctx.yield(); await trestles(loop, false); await ctx.yield(); await trestles(spur, false, () => cTimber[Math.floor(r2(0, 4))]);
  await ctx.yield();

  // tunnel bore: an arch section swept from mouth to mouth, facing inward, sooty with paler rib rings
  const boreI0 = tunI0 - 3, boreI1 = tunI1 + 3;
  {
    const prof2 = [[-7, -0.75], [7, -0.75], [7, 10]];
    for (let k = 1; k <= 8; k++) { const a = (k / 8) * Math.PI; prof2.push([7 * Math.cos(a), 10 + 7 * Math.sin(a)]); }
    prof2.push([-7, -0.75]);
    const np = prof2.length, base = B.nv; let rings = 0;
    for (let i = boreI0; i <= boreI1; i += 2, rings++) {
      frame(track, Math.min(i, boreI1), M);
      const rib = rings % 3 === 0 ? 1.5 : 1.0;
      for (let k = 0; k < np; k++) {
        const [u, v] = prof2[k]; va.set(u, v, 0).applyMatrix4(M); B.p.push(va.x, va.y, va.z);
        const floor = k === 0 || k === 1 || k === np - 1;
        va.set(floor ? 0 : -u, floor ? 1 : -(v - 8) * 0.6, 0).normalize().transformDirection(M); B.n.push(va.x, va.y, va.z);
        const cc = floor ? cSleeper : cStone[(rings + k) % 4], kk = floor ? 1.0 : (rings % 2 ? 0.5 : 0.72) * (k % 2 ? 1.0 : 0.86); B.c.push(cc.r * kk, cc.g * kk, cc.b * kk); B.f.push(0, 1, 0);
      }
    }
    B.nv += rings * np;
    for (let r = 0; r < rings - 1; r++) for (let k = 0; k < np - 1; k++) {
      const a = base + r * np + k, b = a + 1, c = a + np, d = c + 1; B.i.push(a, c, b, b, c, d);
    }
  }

  await ctx.yield();
  // rotated box in a parent frame (rz about the frame's forward axis)
  const _e = new THREE.Euler();
  let BA = B;
  const rbox = (P, x, y, z, sx, sy, sz, rz, col, e = 0, gloss = 0.5, tint = 0) => {
    _bm.compose(_bp.set(x, y, z), _bq.setFromEuler(_e.set(0, 0, rz)), _bs.set(sx, sy, sz)).premultiply(P); BA.add(G.box, _bm, col, e, tint, gloss);
  };
  // keystone arch in frame P (x across, y up from rail, face toward -z, body behind it)
  function buildArch(P, hw, spring, grand) {
    const pw = grand ? 4 : 2.6, th = grand ? 3.2 : 2.4, dp = grand ? 4.5 : 2.6, top = spring + hw + th;
    for (const sd of [-1, 1]) {
      let k = 0;
      for (let y = -0.75; y < spring - 0.01; y += 2.2, k++) {
        const hh = Math.min(2.2, spring - y);
        BA.box(sd * (hw + pw / 2 + (k & 1 ? 0.12 : 0)), y + hh / 2, dp / 2 - (k & 1 ? 0.15 : 0), pw - 0.1, hh - 0.12, dp, cStone[(k + (sd > 0 ? 1 : 0)) % 4], 0, 0, 0.5, P);
      }
      BA.box(sd * (hw + pw / 2), spring + 0.3, dp / 2 - 0.3, pw + 0.7, 0.7, dp + 0.5, cStone[3], 0, 0, 0.6, P);   // impost
      const sx0 = hw * 0.75, sx1 = hw + pw;
      BA.box(sd * (sx0 + sx1) / 2, (spring + hw * 0.66 + top) / 2, dp / 2 + 0.4, sx1 - sx0, top - spring - hw * 0.66, dp - 0.6, cStone[2], 0, 0, 0.4, P);
      if (grand) {
        BA.box(sd * (hw + pw + 3.2), (spring + 3) / 2 - 0.4, dp / 2 + 0.5, 6.4, spring + 3.8, dp - 1, cStone[0], 0, 0, 0.4, P);
        BA.box(sd * (hw + pw + 3.2), spring + 3.6, dp / 2 + 0.3, 7.0, 0.8, dp, cStone[3], 0, 0, 0.6, P);
        // pier lantern
        BA.box(sd * (hw + pw / 2), spring - 2.2, -0.7, 1.0, 1.5, 1.0, gold, 5, 0, 0, P); BA.box(sd * (hw + pw / 2), spring - 1.3, -0.7, 1.4, 0.3, 1.4, cBlack, 0, 0, 1, P);
        addBulb(va.set(sd * (hw + pw / 2), spring - 2.2, -1.5).applyMatrix4(P), goldHDR, 3.0);
      }
    }
    const n = grand ? 15 : 11, rm = hw + th / 2, mid = (n - 1) / 2;
    for (let k = 0; k < n; k++) {
      if (k === mid) continue;
      const a = Math.PI * (k + 0.5) / n;
      rbox(P, Math.cos(a) * rm, spring + Math.sin(a) * rm, dp / 2 - 0.25, Math.PI * rm / n * 0.95, th, dp + 0.4, a - Math.PI / 2, cStone[k % 2 ? 1 : 0], 0, 0.6);
    }
    BA.box(0, spring + rm + 0.5, dp / 2 - 0.7, th * 0.95, th * 1.55, dp + 1.3, cStone[3], 0, 0, 0.9, P);                 // keystone
    BA.box(0, top + 0.9, dp / 2 - 0.3, 2 * (hw + pw) + 1.6, 1.1, dp + 1.0, cStone[3], 0, 0, 0.7, P);                      // cornice
    if (grand) {
      BA.box(0, top + 2.4, dp / 2, 2 * (hw + pw) - 1, 2.0, dp - 0.6, cStone[0], 0, 0, 0.4, P);
      for (let k = -3; k <= 3; k++) BA.box(k * 3.6, top + 4.0, dp / 2, 2.2, 1.3, dp - 0.4, cStone[(k + 4) % 2 ? 1 : 3], 0, 0, 0.5, P);
      _bm.compose(_bp.set(0, top + 2.4, -0.2), _bq.setFromAxisAngle(_X, Math.PI / 2), _bs.set(1.5, 0.5, 1.5)).premultiply(P); BA.add(G.cyl, _bm, cBrass, 0.6, 0, 2);
    }
  }
  // pit-prop frames every 8 units down the bore: two posts and a five-piece timber arch
  for (let i = boreI0 + 5, k = 0; i < boreI1 - 2; i += 8, k++) {
    frame(track, i, M); const col = cTimber[k % 4];
    for (const sd of [-1, 1]) B.box(sd * 6.5, 4.6, 0, 0.9, 10.8, 1.0, col, 0, 1, 0.3, M);
    for (let q = 0; q < 5; q++) { const a = Math.PI * (q + 0.5) / 5; rbox(M, Math.cos(a) * 6.45, 10 + Math.sin(a) * 6.45, 0, Math.PI * 6.45 / 5 * 1.04, 0.9, 1.0, a - Math.PI / 2, col, 0, 0.3, 1); }
  }
  await ctx.yield();
  frame(track, boreI0, M); buildArch(M, 7, 10, false); await ctx.yield();
  frame(track, boreI1, M); M.multiply(M2.makeRotationY(Math.PI)); buildArch(M, 7, 10, false); await ctx.yield();
  frame(track, TL - 0.01, M); buildArch(M, 7, 8.5, true);
  const archFrame = M.clone();
  await ctx.yield();
  // the mine spur's furniture: an adit arch with a sooty mouth and a lantern, a red buffer stop, lamps on the open side
  {
    const sl = spur.length;
    frame(spur, sl - 3, M); buildArch(M, 5.5, 7, false);
    B.box(0, 6, 3.0, 14, 15, 1.2, cSoot, 0, 1, 0, M);
    B.box(6.9, 9.6, -0.7, 0.8, 1.0, 0.8, cGold, 5, 0, 0, M); addBulb(va.set(6.9, 9.6, -1.5).applyMatrix4(M), cGold.clone().multiplyScalar(4.2), 2.6);
    frame(spur, 1.5, M); B.box(0, 1.5, 0, 5.8, 1.0, 0.9, cRed, 0, 0, 1.4, M); for (const sd of [-1, 1]) { B.box(sd * 2, 0.5, 0.5, 0.7, 2.6, 0.7, cTimber[1], 0, 0, 0.3, M); B.box(sd * 2, 0.2, 1.6, 0.6, 0.6, 2.6, cTimber[1], 0, 0, 0.3, M); }
    for (let sp = 16; sp < sl - 18; sp += 29) {
      frame(spur, sp, M); B.cyl(4.1, 2.4, 0, 0.2, 0.2, 6.4, cBlack, 'y', 0, 0, 1.2, M, G.cyl6); B.box(4.1, 5.9, 0, 0.9, 1.1, 0.9, cGold, 5, 0, 0, M); B.cyl(4.1, 6.7, 0, 0.75, 0.75, 0.3, cBlack, 'y', 0, 0, 1.2, M, G.cone);
      addBulb(va.set(4.1, 5.9, 0).applyMatrix4(M), cGold.clone().multiplyScalar(5.0), 2.6);
    }
  }
  await ctx.yield();

  // lamps and signals
  const groundAt = (s, lat) => { track.at(s, _p, _t); _q.crossVectors(_Y, _t).normalize(); va.copy(_p).addScaledVector(_q, lat); return hFinal(va.x, va.z); };
  function lampPost(s, lat, tall, colHDR, colLamp, size) {
    if (s > boreI0 - 6 && s < boreI1 + 6) return;
    track.at(s, _p, _t); const g = groundAt(s, lat), railY = _p.y;
    const onGround = g > railY - 3.5, baseY = onGround ? g - 0.3 : railY - 0.8, h = onGround ? tall : 3.6;
    const x = va.x, z = va.z;
    B.cyl(x, baseY + h / 2, z, 0.2, 0.2, h, cBlack, 'y', 0, 0, 1.2, null, G.cyl6);
    B.cyl(x, baseY + 0.4, z, 0.5, 0.5, 0.8, cBlack, 'y', 0, 0, 1.2, null, G.cyl6);
    B.box(x, baseY + h + 0.55, z, 0.9, 1.1, 0.9, colLamp, 5, 0, 0);
    B.cyl(x, baseY + h + 1.3, z, 0.75, 0.75, 0.3, cBlack, 'y', 0, 0, 1.2, null, G.cone);
    addBulb(vb.set(x, baseY + h + 0.6, z), colHDR, size);
  }
  const lampStep = rng.range(40, 50);
  for (let s = LEAD + rng.range(4, 20); s < straightS0 - 12; s += lampStep * 0.6) { track.at(s, _p, _t); const ry = _p.y, g9 = groundAt(s, 9.6); lampPost(s, g9 > ry - 3.5 && g9 < ry + 6 ? 9.6 : 6.4, 7, goldHDR, gold, 2.6); }   // well clear of the driver's eye where there is ground to stand on
  for (let s = boreI0 + 7, k = 0; s < boreI1 - 4; s += 11, k++) {                       // miners' lamps on the bore's left wall
    frame(track, s, M); B.box(6.55, 8.4, 0, 0.4, 0.8, 0.6, gold, 2.2, 0, 0, M); B.box(6.75, 9.2, 0, 0.5, 0.3, 1.2, cBlack, 0, 0, 1, M);
    addBulb(va.set(6.2, 8.4, 0).applyMatrix4(M), cGold.clone().multiplyScalar(k % 3 === 1 ? 2.4 : 3.2), 2.0);
    if (s + 5.5 < boreI1 - 2) { frame(track, s + 5.5, M); B.box(-6.55, 7.6, 0, 0.4, 0.8, 0.6, gold, 2.2, 0, 0, M); B.box(-6.75, 8.4, 0, 0.5, 0.3, 1.2, cBlack, 0, 0, 1, M);
      addBulb(va.set(-6.2, 7.6, 0).applyMatrix4(M), cGold.clone().multiplyScalar(k % 3 === 0 ? 2.4 : 3.2), 2.0); }
  }
  await ctx.yield();
  {                                                                                     // two strings of coloured bulbs under the bore's crown, from mouth to mouth (their phases are fixed: no draw from rng)
    const fc = ['#ff5a3c', '#ffc23a', '#58e088', '#5a9cff', '#ff78d0', '#fff0c4'].map((h) => C(h).multiplyScalar(3.4)), last = [null, null];
    for (let s = boreI0 + 1, k = 0; s < boreI1 - 0.5; s += 2.5, k++) {
      const bx = k & 1 ? 4.4 : 2.2, by = (k & 1 ? 13.8 : 15.0) - 0.5 * Math.abs(Math.sin(k * 0.52)); frame(track, s, M); va.set(bx, by, 0).applyMatrix4(M);   // one string on the wall side, one under the crown: both clear of the driver's head on the open side
      bulbs.push({ p: va.clone(), c: fc[(k * 5 + (k >> 1)) % 6], size: 3.0, kind: 0, phase: k * 1.7, speed: 0.7 + 0.1 * (k % 7) });
      B.box(bx, by, 0, 0.26, 0.34, 0.26, fc[(k * 5 + (k >> 1)) % 6], 1.6, 1, 0, M);
      const li = k & 1; if (last[li]) B.beam(last[li], va, 0.14, cBlack); last[li] = va.clone();
    }
    for (const [i0, flip] of [[boreI0, 0], [boreI1, 1]]) {                                // a garland of bulbs round each stone mouth
      frame(track, i0, M); if (flip) M.multiply(M2.makeRotationY(Math.PI));
      for (let k = 0; k <= 12; k++) { const a = Math.PI * k / 12; va.set(Math.cos(a) * 9.6, 10 + Math.sin(a) * 9.6 - 0.7 * Math.abs(Math.sin(k * 1.57)), -0.9).applyMatrix4(M); bulbs.push({ p: va.clone(), c: fc[(k * 5) % 6], size: 2.6, kind: 0, phase: k * 2.3, speed: 0.8 + 0.1 * (k % 5) }); }
    }
  }
  for (let k = 0; k < 5; k++) for (const sd of [-1, 1]) lampPost(straightS0 + 4 + k * 13 + (sd > 0 ? 0 : 6.5), sd * (8.2 + ((k * 3 + (sd > 0 ? 1 : 0)) % 4) * 1.1), 4.6 + ((k * 2 + (sd > 0 ? 0 : 1)) % 3) * 1.5, goldHDR, gold, 2.4);
  const cSigR = C('#ff2a1c'), cSigG = C('#2cff7a');
  const signal = (s, green, lat = 6.0) => {
    track.at(s, _p, _t); const g = Math.max(groundAt(s, lat), _p.y - 0.8), x = va.x, z = va.z, col = green ? cSigG : cSigR;
    B.cyl(x, g + 5, z, 0.22, 0.3, 10, cStone[3], 'y', 0, 0, 1.2, null, G.cyl6);
    B.box(x, g + 9.2, z, 1.3, 2.6, 0.9, cBlack, 0, 0, 1);
    B.box(x, g + (green ? 8.6 : 9.8), z, 0.8, 0.8, 1.0, col, 5, 0, 0);
    frame(track, s, M); rbox(M, lat + 1.9, g + 10.2 - _p.y - (green ? 0.9 : 0), 0, 3.6, 0.7, 0.2, green ? 0.7 : 0, cRed, 0, 1.5);
    addBulb(vb.set(x, g + (green ? 8.6 : 9.8), z), col.clone().multiplyScalar(4), 2.2);
  };
  signal(boreI0 - 16, true); signal(straightS0 - 46, true, 8.6); signal(LEAD + 2, false);

  // tin chalets with printed gold windows: two on the summit shelf, a ring of them round the foot
  const cWall = [C('#d9c9a0'), C('#c7b08a'), C('#b9c2c8'), C('#d6a88a')], cRoof = [cRed.clone(), C('#7d2a22'), cShadow.clone().lerp(C('#4a6aa0'), 0.5), C('#3d5a35')];
  function hut(x, z, yaw, sc, rng = rngMain) {
    const y = hFinal(x, z) - 0.5;
    M.compose(_bp.set(x, y, z), _bq.setFromAxisAngle(_Y, yaw), _bs.set(sc, sc, sc));
    const wall = rng.pick(cWall), roof = rng.pick(cRoof), w = 7, h = 4.4, d = 5.6;
    B.box(0, h / 2, 0, w, h, d, wall, 0, 0, 1, M); B.box(0, 0.35, 0, w + 0.4, 0.7, d + 0.4, cStone[2], 0, 0, 0.3, M);
    B.box(0, h + 0.75, 0, w * 0.52, 1.5, d - 0.1, wall, 0, 0, 1, M);
    for (const sd of [-1, 1]) rbox(M, sd * 2.0, h + 1.25, 0, 4.9, 0.4, d + 1.0, -sd * 0.62, roof, 0, 1.4);
    B.box(0, h + 2.75, 0, 0.7, 0.35, d + 1.1, shade(roof, 0.7), 0, 0, 1, M);
    B.box(1.9, h + 2.6, -1.2, 0.9, 2.2, 0.9, cStone[0], 0, 0, 0.4, M);
    const lit = () => (rng.chance(0.82) ? 4.5 : 0.25);
    for (const sx of [-2.1, 2.1]) for (const sz of [-1, 1]) B.box(sx * 0.55 + (sz > 0 ? 1.0 : 0), 2.5, sz * (d / 2 + 0.04), 1.2, 1.5, 0.1, gold, lit(), 0, 0, M);
    B.box(-2.2, 1.7, d / 2 + 0.05, 1.3, 2.6, 0.1, shade(roof, 0.6), 0, 0, 1, M);
    for (const sx of [-1, 1]) B.box(sx * (w / 2 + 0.04), 2.5, 0, 0.1, 1.5, 1.4, gold, lit(), 0, 0, M);
    addBulb(vb.set(0.6, 2.6, d / 2 + 1.2).applyMatrix4(M), cGold.clone().multiplyScalar(2.2), 3.2 * sc);
  }
  await ctx.yield();
  hut(archP.x - 14 - rng.range(0, 4), archP.z + 22 + rng.range(0, 16), rng.range(-0.5, 0.5) + Math.PI / 2, 1.0);
  hut(archP.x - 30 - rng.range(0, 8), archP.z + 44 + rng.range(-6, 10), rng.range(0, TAU), 0.9);
  { const XR = { pick: (a) => a[Math.floor(r2() * a.length)], chance: (p) => r2() < p, range: r2 };
    for (const q of perch) hut(q.x, q.z, q.a + Math.PI / 2 + r2(-0.35, 0.35), r2(0.85, 1.1), XR); }
  for (let k = 0; k < 20; k++) {                                // lanterns pegged to the bare west face: pools of warm light on the papier-mache
    const a = THREE.MathUtils.degToRad(r2(16, 132)), y0 = r2(20, 112), r = rAtY(hFinal, a, y0) + 0.4, x = r * Math.cos(a), z = -r * Math.sin(a), y = Math.max(y0 - 2, hFinal(x, z));
    if (r < 50 || nearLine(x, z, y, 10.5, 16)) continue;
    B.cyl(x, y + 0.9, z, 0.16, 0.16, 2.4, cBlack, 'y', 0, 0, 1.2, null, G.cyl6); B.box(x, y + 2.5, z, 0.8, 1.0, 0.8, cGold, 5, 0, 0);
    addBulb(va.set(x + Math.cos(a) * 0.9, y + 2.5, z - Math.sin(a) * 0.9), cGold.clone().multiplyScalar(4.4), 2.4);
  }
  {                                                             // the south-east face, the wall beside the driver as the express comes onto the mountain: lanterns, and a waterfall of tinsel
    const rp = () => r2(0, TAU), put = (p, c, size, kind) => bulbs.push({ p: p.clone(), c, size, kind, phase: rp(), speed: r2(0.6, 1.4) });
    for (let k = 0; k < 14; k++) {
      const a = THREE.MathUtils.degToRad(r2(204, 268)), y0 = r2(40, 104), r = rAtY(hFinal, a, y0) + 0.4, x = r * Math.cos(a), z = -r * Math.sin(a), y = Math.max(y0 - 2, hFinal(x, z));
      if (r < 46 || nearLine(x, z, y, 10.5, 16)) continue;
      B.cyl(x, y + 0.9, z, 0.16, 0.16, 2.4, cBlack, 'y', 0, 0, 1.2, null, G.cyl6); B.box(x, y + 2.5, z, 0.8, 1.0, 0.8, cGold, 5, 0, 0);
      put(va.set(x + Math.cos(a) * 0.9, y + 2.5, z - Math.sin(a) * 0.9), cGold.clone().multiplyScalar(4.4), 2.4, 0);
    }
    const cTin = C('#cfe2ff'), tinHDR = C('#dcebff').multiplyScalar(3.4), a0 = THREE.MathUtils.degToRad(72);   // on the south-west face, where the reveal looks up it
    const clearOfLine = (p) => { for (let i = 0; i < track.n; i += 3) if (track.pts[i].distanceToSquared(p) < 196) return false; return true; };
    for (let st = 0; st < 5; st++) {
      const a = a0 + (st - 2) * 0.016; let prev = null;
      for (let y = 112 - st * 1.5; y > 40; y -= 2.2) {
        const r = rAtY(hFinal, a + 0.012 * Math.sin(y * 0.21 + st), y) + 0.35, x = r * Math.cos(a), z = -r * Math.sin(a);
        const p = new THREE.Vector3(x, y, z);
        if (r < 45.5 || r > 110 || nearLine(x, z, y, 11, 15) || !clearOfLine(p)) { prev = null; continue; }
        if (prev && prev.distanceTo(p) < 4.6) {
          _bd.subVectors(p, prev); const len = _bd.length(); _bq.setFromUnitVectors(_Y, _bd.divideScalar(len));
          _bm.compose(_bp.addVectors(p, prev).multiplyScalar(0.5), _bq, _bs.set(0.34 + 0.12 * (st % 2), len, 0.12)); B.add(G.box, _bm, cTin, 0.9, 0, 2.2);
          if (((y * 10) | 0) % 3 === st % 3) put(p, tinHDR, 1.5, 3);
        }
        prev = p;
      }
    }
  }
  await ctx.yield();
  const nHuts = rng.int(7, 10), hutA = rng.range(0, TAU);
  for (let k = 0; k < nHuts; k++) { const a = hutA + (k + rng.range(-0.3, 0.3)) / nHuts * TAU, r = rng.range(109, 114); const am = ((a % TAU) + TAU) % TAU; if (am > 3.15 && am < 4.05) continue; hut(r * Math.cos(a), -r * Math.sin(a), a + Math.PI / 2 + rng.range(-0.3, 0.3), rng.range(0.8, 1.05)); }
  await ctx.yield();

  // ------------------------------------------------------------ uniforms + materials
  const summit = new THREE.Vector3(pk.x, PKH, pk.y);
  if (opts.moonTarget) moonDir.copy(opts.moonTarget).sub(_p.copy(summit).setY(PKH - shaftR * 0.5)).normalize();   // aim the shaft at the world's oculus
  const portalSeat = new THREE.Vector3(archP.x, archP.y - 0.75 + 7.75, archP.z);
  const U = {
    uTime: { value: 0 }, uMoonI: { value: opts.moonIntensity ?? 1.5 }, uShaftR: { value: shaftR }, uPortalI: { value: 1.3 },
    uMoonDir: { value: moonDir }, uMoonCol: { value: cMoon.clone() }, uAmb: { value: cShadow.clone().lerp(cMoon, 0.1).multiplyScalar(3.6) },
    uShaftP: { value: summit.clone().setY(PKH - shaftR * 0.5) }, uPortalP: { value: portalSeat.clone().add(new THREE.Vector3(0, 0, 3)) },
    uPortalCol: { value: C('#ffd9a0').multiplyScalar(1.5) }, uWarm: { value: cGold.clone() }, uCamL: { value: new THREE.Vector3(0, 80, 300) },
    uMtnFill: { value: 1 }, uHeadP: { value: new THREE.Vector4(0, -999, 0, 0) }, uHeadD: { value: new THREE.Vector3(0, 0, 1) }, uFlash: { value: 0 }, uGlow: { value: 1 },
    uTrainL: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, -999, 0, 0)) }, uPx: { value: 540 },
  };
  const mkMat = (vertexShader, fragmentShader, extra = {}, o = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra }, vertexShader, fragmentShader, fog: true, ...o,
  });
  const tinMat = mkMat(TIN_VERT, TIN_FRAG, {}, { vertexColors: true });
  const mtnMat = mkMat(MTN_VERT, MTN_FRAG, {
    uHelix: { value: new THREE.Vector4(A0, SWEEP, R0, R1) },
    uTun: { value: new THREE.Vector4(aOfY(track.pts[boreI0].y) - 0.012, aOfY(track.pts[boreI1].y) + 0.012, Y0, Y1) },
    uSnowCol: { value: cMoon.clone().multiplyScalar(0.5) }, uCutA: { value: new THREE.Vector3() }, uCutB: { value: new THREE.Vector3() },
  }, { vertexColors: true });

  // bake the warm pools round the fixed bulbs into the shell
  {
    const nb = bulbs.length, bx = new Float32Array(nb), by = new Float32Array(nb), bz = new Float32Array(nb), bw = new Float32Array(nb);
    bulbs.forEach((b, i) => { bx[i] = b.p.x; by[i] = b.p.y; bz[i] = b.p.z; bw[i] = b.c.r > b.c.g * 1.2 || b.c.g < b.c.r * 1.3 ? Math.min(1, b.c.r * 0.16) : 0.25; });
    for (let v = 0; v < (NR + 1) * NA; v++) {
      const o = v * 3, x = mPos[o], y = mPos[o + 1], z = mPos[o + 2]; let w = 0;
      for (let i = 0; i < nb; i++) { const dx = x - bx[i], dy = y - by[i], dz = z - bz[i], d2 = dx * dx + dy * dy + dz * dz; if (d2 < 3600) w += bw[i] / (1 + d2 * 0.011); }
      mMat[o + 2] = Math.min(w, 1.1);
      if ((v & 511) === 511) await ctx.yield();
    }
  }
  const mountain = new THREE.Mesh(mGeo, mtnMat); mountain.name = 'mountain'; root.add(mountain);
  await ctx.yield();
  const props = new THREE.Mesh(await B.buildAsync(ctx), tinMat); props.name = 'track-trestles-masonry'; root.add(props);
  await ctx.yield();

  // ------------------------------------------------------------ lichen / sponge trees on wire trunks (instanced)
  let treeGeo = null;
  {
    const T = new Batch(), wire = C('#2a2018'), w1 = C('#ffffff'), w2 = C('#c8c8c8'), w3 = C('#8e8e8e');
    T.beam(va.set(0, -0.6, 0), vb.set(0.15, 4.6, 0), 0.34, wire); T.beam(va.set(0.1, 3.0, 0), vb.set(1.3, 5.0, 0.5), 0.22, wire); T.beam(va.set(0.1, 2.6, 0), vb.set(-1.2, 4.4, -0.6), 0.22, wire);
    const blob = (x, y, z, sx, sy, sz, col, geo) => { _bm.compose(_bp.set(x, y, z), _bq.setFromEuler(_e.set(x * 2, y, z * 3)), _bs.set(sx, sy, sz)); T.add(geo, _bm, col, 0, 1, 0); };
    const ico0 = new THREE.IcosahedronGeometry(1, 0);
    blob(0.1, 6.2, 0, 2.5, 2.2, 2.4, w1, G.blob); blob(1.6, 5.2, 0.7, 1.6, 1.4, 1.6, w2, ico0); blob(-1.5, 4.7, -0.8, 1.7, 1.3, 1.5, w3, ico0); blob(-0.2, 7.6, 0.5, 1.4, 1.2, 1.3, w2, ico0);
    const tGeo = T.build(); ico0.dispose(); treeGeo = tGeo;
    const clear = (x, z, y) => {
      const ci = Math.floor((x + 140) / CELL), cj = Math.floor((z + 140) / CELL);
      for (let j = Math.max(0, cj - 1); j <= Math.min(GN - 1, cj + 1); j++) for (let i = Math.max(0, ci - 1); i <= Math.min(GN - 1, ci + 1); i++) {
        const c = cells[j * GN + i];
        for (let k = 0; k < c.length; k++) { const o = c[k] * 5, dx = x - cs[o], dz = z - cs[o + 1]; if (dx * dx + dz * dz < 92 && cs[o + 2] > y - 1.5 && cs[o + 2] < y + 15) return false; }
      }
      return true;
    };
    const crowds = (x, z, y) => {                            // within 15 of our own line, where the line is level with the tree or above it
      for (let o = 0; o < csMain; o += 5) { const dx = x - cs[o], dz = z - cs[o + 1]; if (dx * dx + dz * dz < 225 && cs[o + 2] > y - 14 && cs[o + 2] < y + 36) return true; }
      return false;
    };
    const MAXT = 330, trees = new THREE.InstancedMesh(tGeo, tinMat, MAXT), tc = new THREE.Color();
    const lich = [cFlock.clone().multiplyScalar(1.5), cFlock.clone().lerp(C('#9aa04a'), 0.6).multiplyScalar(1.3), cFlock.clone().lerp(C('#2f5a3a'), 0.6), C('#a8743a'), C('#7e8f4a')];
    let nt = 0;
    for (let tries = 0; tries < 220 && nt < MAXT; tries++) {
      const a = rng.range(0, TAU), r = rng.range(58, 117), cx = r * Math.cos(a), cz = -r * Math.sin(a), cc = rng.pick(lich), m = rng.int(2, 6);
      for (let k = 0; k < m && nt < MAXT; k++) {
        const x = cx + rng.range(-6, 6), z = cz + rng.range(-6, 6), y = hFinal(x, z);
        if (y > 52 || Math.hypot(x, z) > 117 || Math.abs(hFinal(x + 1.6, z) - y) > 2.4 || Math.abs(hFinal(x, z + 1.6) - y) > 2.4 || !clear(x, z, y)) continue;
        const sc = rng.range(0.75, 1.3) * (y > 30 ? 0.8 : 1);
        M.compose(_bp.set(x, y, z), _bq.setFromAxisAngle(_Y, rng.range(0, TAU)), _bs.set(sc, sc * rng.range(0.85, 1.25), sc));
        tc.copy(cc).multiplyScalar(rng.range(0.75, 1.15));
        if (crowds(x, z, y)) continue;                       // nothing bushy right under the driver's eye
        trees.setMatrixAt(nt, M); trees.setColorAt(nt, tc); nt++;
      }
      if (tries % 12 === 11) await ctx.yield();
    }
    // lichen clumps glued to the steep south-west face, between the spur and the foot
    for (let tries = 0; tries < 420 && nt < MAXT; tries++) {
      const a = THREE.MathUtils.degToRad(r2(12, 228)), cliff = tries & 1, r = cliff ? rAtY(hFinal, a, r2(16, 104)) + 0.3 : r2(58, 112), x = r * Math.cos(a), z = -r * Math.sin(a), y = hFinal(x, z);
      if (y > 106 || y < 13 || r < 50 || (!cliff && (Math.abs(hFinal(x + 1.6, z) - y) > 9 || Math.abs(hFinal(x, z + 1.6) - y) > 9)) || !clear(x, z, y) || crowds(x, z, y)) continue;
      const sc = r2(0.7, 1.15);
      M.compose(_bp.set(x, y - 0.4, z), _bq.setFromAxisAngle(_Y, r2(0, TAU)), _bs.set(sc, sc * r2(0.85, 1.2), sc));
      trees.setMatrixAt(nt, M); trees.setColorAt(nt, tc.copy(lich[Math.floor(r2(0, 5))]).multiplyScalar(r2(0.75, 1.15))); nt++;
      if (tries % 24 === 23) await ctx.yield();
    }
    trees.count = nt; trees.instanceMatrix.needsUpdate = true; if (trees.instanceColor) trees.instanceColor.needsUpdate = true;
    trees.frustumCulled = false; trees.name = 'lichen-trees'; root.add(trees);
  }
  await ctx.yield();

  // ------------------------------------------------------------ tinplate rolling stock (3 instanced car types)
  const W = C('#ffffff'), cCream = C('#e8d9ae'), cHot = C('#ff8a2a');
  const wheelPair = (b, z, r, col = cBlack) => {
    for (const sd of [-1, 1]) { b.cyl(sd * 2.25, r, z, r, r, 0.5, col, 'x', 0, 0, 1.2); b.cyl(sd * 2.55, r, z, r * 0.42, r * 0.42, 0.25, cBrass, 'x', 0, 0, 2, null, G.cyl6); }
  };
  function carGeo(kind) {
    const b = new Batch();
    if (kind === 'loco') {
      b.box(0, 2.3, 0, 5.4, 0.6, 25.5, cBlack, 0, 0, 1); b.box(0, 2.66, 0, 5.5, 0.14, 25.5, cBrass, 0, 0, 2);
      b.cyl(0, 4.9, 3.4, 2.3, 2.3, 15.5, W, 'z', 0, 1, 1.8, null, G.cyl24);
      for (const z of [-2.5, 2, 6.5]) b.cyl(0, 4.9, z, 2.38, 2.38, 0.4, cBrass, 'z', 0, 0, 2, null, G.cyl24);
      b.cyl(0, 4.9, 11.9, 2.45, 2.45, 2.6, cBlack, 'z', 0, 0, 1.6, null, G.cyl24); b.cyl(0, 4.9, 13.3, 1.9, 1.9, 0.3, cBrass, 'z', 0, 0, 2, null, G.cyl24); b.cyl(0, 4.9, 13.5, 0.5, 0.5, 0.3, cBlack, 'z');
      b.cyl(0, 8.3, 11.6, 1.15, 1.15, 2.8, cBlack, 'y', 0, 0, 1.6, null, G.cone); b.cyl(0, 9.75, 11.6, 0.95, 0.95, 0.35, cBrass, 'y', 0, 0, 2);
      b.cyl(0, 7.0, 5.2, 1.25, 1.25, 0.6, cBrass, 'y', 0, 0, 2); _bm.compose(_bp.set(0, 7.3, 5.2), _bq.identity(), _bs.set(1.25, 1.35, 1.25)); b.add(G.dome18, _bm, cBrass, 0, 0, 2.2);
      b.cyl(0, 7.4, 0.2, 0.4, 0.4, 1.0, cBrass, 'y', 0, 0, 2, null, G.cyl6);
      b.box(0, 5.3, -8.3, 5.8, 5.6, 7.4, W, 0, 1, 1.6); b.box(0, 8.3, -8.3, 6.5, 0.45, 8.6, cBlack, 0, 0, 1.4); b.box(0, 8.65, -8.3, 4.6, 0.3, 8.0, cBlack, 0, 0, 1.4);
      for (const sd of [-1, 1]) {
        b.box(sd * 2.92, 6.2, -8.6, 0.08, 1.7, 3.2, cHot, 2.6, 0, 0); b.box(sd * 2.94, 4.0, -8.3, 0.06, 0.25, 6.6, cBrass, 0, 0, 2);
        for (let k = 0; k < 7; k++) b.box(sd * 2.95, 3.0, -11.3 + k, 0.14, 0.26, 0.26, cBrass, 0, 0, 2);
        b.cyl(sd * 2.5, 2.6, 10.8, 1.0, 1.0, 3.2, W, 'z', 0, 1, 1.6); b.box(sd * 3.0, 1.9, 3, 0.22, 0.42, 11.0, cRail, 0, 0, 2); b.box(sd * 3.0, 2.2, 8.6, 0.2, 0.3, 5.0, cRail, 0, 0, 2);
        b.cyl(sd * 1.9, 3.4, 13.9, 0.55, 0.55, 0.5, cRail, 'z', 0, 0, 2, null, G.cyl6);
      }
      b.box(0, 5.6, -4.55, 5.0, 3.6, 0.1, cHot, 1.2, 0, 0);
      for (const z of [-2.4, 3, 8.4]) wheelPair(b, z, 1.95); wheelPair(b, 11.8, 1.1); wheelPair(b, -9.6, 1.35);
      b.box(0, 2.6, 13.4, 6.0, 1.3, 0.5, W, 0, 1, 1.5); b.box(0, 2.6, -12.9, 6.0, 1.3, 0.5, W, 0, 1, 1.5);
      b.cyl(0, 7.9, 13.0, 0.8, 0.8, 1.1, cBrass, 'z', 0, 0, 2); b.cyl(0, 7.9, 13.6, 0.62, 0.62, 0.12, C('#fff1c8'), 'z', 7, 0, 0);
    } else if (kind === 'coach') {
      b.box(0, 2.2, 0, 5.0, 0.7, 23.0, cBlack, 0, 0, 1); b.box(0, 4.9, 0, 5.4, 4.8, 23.4, W, 0, 1, 1.7);
      b.box(0, 5.5, 0, 5.46, 2.1, 22.6, cCream, 0, 0, 1.4); b.box(0, 7.5, 0, 5.0, 0.5, 23.8, C('#8b8f96'), 0, 0, 1.6); b.box(0, 7.95, 0, 3.4, 0.45, 23.2, C('#9a9ea6'), 0, 0, 1.6);
      for (const sd of [-1, 1]) {
        for (let k = 0; k < 8; k++) { const z = -9.6 + k * 2.75; b.box(sd * 2.75, 5.55, z, 0.08, 1.6, k === 0 || k === 7 ? 1.1 : 2.0, gold, 4.55, 0, 0); }
        for (const z of [-11.2, 11.2]) b.box(sd * 2.75, 4.4, z, 0.1, 3.6, 0.2, cBrass, 0, 0, 2);
        b.box(sd * 2.74, 3.0, 0, 0.06, 0.2, 22.8, cGold, 0, 0, 2);
        for (let k = 0; k < 12; k++) b.box(sd * 2.74, 2.72, -11 + k * 2, 0.12, 0.24, 0.24, cBrass, 0, 0, 2);
      }
      for (const z of [-8.8, -6.0, 6.0, 8.8]) wheelPair(b, z, 1.1);
      b.box(0, 5.2, -11.75, 1.6, 3.2, 0.1, gold, 2.5, 0, 0); b.box(0, 5.2, 11.75, 1.6, 3.2, 0.1, gold, 2.5, 0, 0);
    } else {
      b.box(0, 2.2, 0, 5.0, 0.7, 15.4, cBlack, 0, 0, 1); b.box(0, 3.9, 0, 5.2, 2.9, 15.0, W, 0, 1, 1.5);
      for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) b.box(sd * 2.64, 3.9, -6.4 + k * 3.2, 0.1, 3.0, 0.4, W, 0, 0.55, 1.2);
      b.box(0, 5.42, 0, 5.4, 0.2, 15.2, W, 0, 0.6, 1.8);
      const load = C('#1d1b1c');
      for (let k = 0; k < 5; k++) { _bm.compose(_bp.set((k % 2) * 0.9 - 0.45, 5.4, -5.6 + k * 2.8), _bq.setFromEuler(_e.set(k, k * 2, k * 3)), _bs.set(2.0, 1.2 + (k % 3) * 0.3, 2.1)); b.add(G.blob, _bm, load, 0, 0, 0.8); }
      wheelPair(b, -4.6, 1.2); wheelPair(b, 4.6, 1.2);
      b.box(0, 2.6, 7.75, 5.6, 1.0, 0.4, cBlack); b.box(0, 2.6, -7.75, 5.6, 1.0, 0.4, cBlack);
    }
    return b.build();
  }
  const LEN = { loco: 26, coach: 24, wagon: 16 }, GAPC = 1.6;
  const showExpress = opts.express !== false;
  const liveries = [cRed.clone(), C('#2a66d8'), C('#2c7a3e')];
  const goodsCols = [C('#7a4a2a'), C('#55606a'), C('#2c6a3a'), C('#a07a30'), C('#6a2a22'), C('#3e4a58')];
  const mkTrain = (tr, dir, livery, kinds, cols) => { let off = 0; const cars = kinds.map((k, i) => { const c = { kind: k, off: off + LEN[k] / 2, col: cols ? cols[i] : livery }; off += LEN[k] + GAPC; return c; }); return { tr, dir, cars, s: 0, len: off, vis: true }; };
  const trains = [
    mkTrain(track, 1, liveries[0], opts.expressKinds || ['loco', 'wagon', 'coach', 'coach', 'coach']),
    mkTrain(track, 1, liveries[1], ['loco', 'coach', 'coach']),
    mkTrain(loop, -1, liveries[2], ['loco', 'wagon', 'wagon', 'wagon', 'wagon', 'wagon', 'wagon'], [liveries[2], ...rng.shuffle(goodsCols.slice())]),
  ];
  for (const x of (opts.extraTrains || [])) trains.push(mkTrain(x.track, x.dir || 1, x.livery || liveries[1], x.kinds || ['loco', 'coach', 'coach'], x.cols));
  const NT = Math.min(4, trains.length); trains.length = NT;
  const preAt = opts.preAt || null, S_MIN = preAt ? -(opts.preLength || 0) : 0;   // world track joined in front of trackStart
  const carMesh = {};
  for (const kind of ['loco', 'coach', 'wagon']) {
    const n = trains.reduce((a, t) => a + t.cars.filter((c) => c.kind === kind).length, 0);
    const nPark = kind === 'wagon' ? 3 : 0;                    // ore wagons standing on the mine spur
    const im = new THREE.InstancedMesh(carGeo(kind), tinMat, n + nPark); im.frustumCulled = false; im.name = 'cars-' + kind; root.add(im); carMesh[kind] = im;
    let k = 0; for (const t of trains) for (const c of t.cars) if (c.kind === kind) { c.idx = k; im.setColorAt(k, c.col); k++; }
    for (let q = 0; q < nPark; q++) { frame(spur, spur.length * 0.52 + q * 17.4, M); im.setMatrixAt(n + q, M); im.setColorAt(n + q, goodsCols[(q * 2 + 1) % 6]); }
    im.instanceColor.needsUpdate = true;
    await ctx.yield();
  }
  const endDir = new THREE.Vector3(0, 0, -1);
  const atX = (tr, s, out) => { if (!tr.closed && s > TL) return out.copy(archP).addScaledVector(endDir, s - TL); if (tr === track && s < 0) { if (preAt) return preAt(s, out); tr.at(0, out, _t); return out.addScaledVector(_t, s); } return tr.at(s, out); };
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), pf = new THREE.Vector3(), pb = new THREE.Vector3();
  function placeTrain(t) {
    for (const c of t.cars) {
      const sc = t.s - t.dir * c.off, L = LEN[c.kind], im = carMesh[c.kind];
      const hidden = !t.vis || (t.tr === track && (sc - L * 0.5 > TL || sc + L * 0.5 < S_MIN));
      if (hidden) { im.setMatrixAt(c.idx, ZERO); continue; }
      atX(t.tr, sc + t.dir * L * 0.32, pf); atX(t.tr, sc - t.dir * L * 0.32, pb);
      _t.subVectors(pf, pb).normalize(); _q.crossVectors(_Y, _t).normalize(); _r.crossVectors(_t, _q);
      M.makeBasis(_q, _r, _t).setPosition(pf.add(pb).multiplyScalar(0.5)); if (t.roll) M.multiply(M2.makeRotationZ(t.roll));
      im.setMatrixAt(c.idx, M);
    }
  }

  // ------------------------------------------------------------ bulbs, mica glints, dust (one Points draw) + smoke
  const wantDust = opts.dust !== false, nMica = wantDust ? 520 : 0, nDust = wantDust ? 850 : 0, nDyn = 2 * NT;
  const nPts = bulbs.length + nMica + nDust + nDyn, dynBase = nPts - nDyn;
  const qPos = new Float32Array(nPts * 3), qCol = new Float32Array(nPts * 3), qPar = new Float32Array(nPts * 4);
  let qi = 0;
  const putPt = (p, c, size, kind, phase, speed) => { qPos.set([p.x, p.y, p.z], qi * 3); qCol.set([c.r, c.g, c.b], qi * 3); qPar.set([size, kind, phase, speed], qi * 4); qi++; };
  for (const b of bulbs) putPt(b.p, b.c, b.size, b.kind, b.phase, b.speed);
  {
    const micaC = cMoon.clone().multiplyScalar(7), dustC = cMoon.clone().multiplyScalar(3.2), nV = (NR + 1) * NA;
    for (let k = 0, guard = 0; k < nMica && guard < 60000; guard++) {
      const v = rng.int(0, nV - 1); if (mMat[v * 3] < 0.6) continue;
      putPt(va.set(mPos[v * 3], mPos[v * 3 + 1] + 0.3, mPos[v * 3 + 2]), micaC, rng.range(0.7, 1.3), 2, rng.range(0, TAU), rng.range(0.8, 3)); k++;
    }
    while (qi < bulbs.length + nMica) putPt(va.set(0, -500, 0), micaC, 0.1, 2, 0, 1);
    const e1 = new THREE.Vector3().crossVectors(moonDir, _Y).normalize(), e2 = new THREE.Vector3().crossVectors(moonDir, e1);
    for (let k = 0; k < nDust; k++) {
      const t = rng.range(-70, 150) * (rng.chance(0.5) ? 0.45 : 1), a = rng.range(0, TAU), rr = shaftR * Math.sqrt(rng()) * 0.98;
      va.copy(U.uShaftP.value).addScaledVector(moonDir, t).addScaledVector(e1, Math.cos(a) * rr).addScaledVector(e2, Math.sin(a) * rr);
      putPt(va, dustC, rng.range(0.45, 1.0), 1, rng.range(0, TAU), rng.range(0.25, 0.8));
    }
  }
  const headC = C('#fff0c4').multiplyScalar(7), tailC = C('#ff2616').multiplyScalar(4);
  for (let k = 0; k < NT; k++) putPt(va.set(0, -500, 0), headC, 4.6, 0, k, 1);
  for (let k = 0; k < NT; k++) putPt(va.set(0, -500, 0), tailC, 3.0, 0, k + 3, 1);
  const ptsGeo = new THREE.BufferGeometry();
  const qPosA = new THREE.BufferAttribute(qPos, 3); qPosA.setUsage(THREE.DynamicDrawUsage);
  ptsGeo.setAttribute('position', qPosA); ptsGeo.setAttribute('aCol', new THREE.BufferAttribute(qCol, 3)); ptsGeo.setAttribute('aPar', new THREE.BufferAttribute(qPar, 4));
  const pts = new THREE.Points(ptsGeo, mkMat(PTS_VERT, PTS_FRAG, {}, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.frustumCulled = false; pts.renderOrder = 5; pts.name = 'bulbs-mica-dust'; root.add(pts);

  const NPUFF = 22, smPos = new Float32Array(NT * NPUFF * 3), smPar = new Float32Array(NT * NPUFF * 2);
  const smGeo = new THREE.BufferGeometry();
  const smPosA = new THREE.BufferAttribute(smPos, 3), smParA = new THREE.BufferAttribute(smPar, 2); smPosA.setUsage(THREE.DynamicDrawUsage); smParA.setUsage(THREE.DynamicDrawUsage);
  smGeo.setAttribute('position', smPosA); smGeo.setAttribute('aPar', smParA);
  const smoke = new THREE.Points(smGeo, mkMat(SMOKE_VERT, SMOKE_FRAG, {}, { transparent: true, depthWrite: false }));
  smoke.frustumCulled = false; smoke.renderOrder = 4; smoke.name = 'smoke'; root.add(smoke);

  // the local stretch of the moon shaft, and a placeholder glow inside the arch
  if (opts.shaft !== false) {
    const len = 330, g = new THREE.CylinderGeometry(shaftR, shaftR, len, 48, 12, true);
    M.compose(U.uShaftP.value.clone().addScaledVector(moonDir, len / 2 - 85), _bq.setFromUnitVectors(_Y, moonDir), _bs.set(1, 1, 1)); g.applyMatrix4(M);
    const shaft = new THREE.Mesh(g, mkMat(SHAFT_VERT, SHAFT_FRAG, {}, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    shaft.frustumCulled = false; shaft.renderOrder = 3; shaft.name = 'moon-shaft'; root.add(shaft);
  }
  let portalFill = null;
  if (opts.portalFill !== false) {
    const sh = new THREE.Shape(); sh.moveTo(-6.95, -0.75); sh.lineTo(6.95, -0.75); sh.lineTo(6.95, 8.5); sh.absarc(0, 8.5, 6.95, 0, Math.PI, false); sh.lineTo(-6.95, -0.75);
    portalFill = new THREE.Mesh(new THREE.ShapeGeometry(sh, 16), new THREE.MeshBasicMaterial({ color: U.uPortalCol.value.clone().multiplyScalar(2.2), fog: false, toneMapped: false }));
    portalFill.position.set(archP.x, archP.y, archP.z - 1.6); portalFill.name = 'portal-placeholder'; root.add(portalFill);
  }

  // ------------------------------------------------------------ anchors
  const flyThrough = [];
  for (let s = 0; s <= TL; s += 12) {
    const k = smoothstep(TL - 45, TL - 4, s); track.at(Math.min(s, TL - 0.01), _p, _t); _q.crossVectors(_Y, _t).normalize();
    flyThrough.push(_p.clone().addScaledVector(_q, 2 * (1 - k)).setY(_p.y + lerp(9, 7, k)));
  }
  flyThrough.push(portalSeat.clone());
  const tan0 = new THREE.Vector3(); track.at(0, _p, tan0);
  const anchors = {
    portalSeat: { position: portalSeat.clone(), normal: new THREE.Vector3(0, 0, 1), width: 14, height: 15.5, shape: 'arch' },
    flyThrough,
    trackStart: { position: track.pts[0].clone(), tangent: tan0 },
    summitStraightStart: track.pts[straightS0].clone(),
    tunnelIn: track.pts[boreI0].clone(), tunnelOut: track.pts[boreI1].clone(),
    summit: summit.clone(), shaftAxis: { point: U.uShaftP.value.clone(), dir: moonDir.clone(), radius: shaftR },
    lowerLoop: { radius: LOOP_R, y: 12.5 },
    viewpoints: { front: new THREE.Vector3(25, 118, 300), reveal: new THREE.Vector3(-200, 70, 170), summitApproach: track.pts[straightS0 - 30].clone().add(new THREE.Vector3(0, 12, 0)) },
  };

  // ------------------------------------------------------------ animation
  let progress = null; const gPhase = rng.range(0, loop.length), gKey = opts.goods || { at: 150, angle: Math.atan2(-track.pts[150].z, track.pts[150].x) }, gMeet = ((((gKey.angle % TAU) + TAU) % TAU) / TAU) * loop.length, blueLead = 215, gSpeed = gKey.speed ?? 0.75, inv = new THREE.Matrix4(), size = new THREE.Vector2();
  const setDyn = (i, p, on) => { const o = (dynBase + i) * 3; if (on) { qPos[o] = p.x; qPos[o + 1] = p.y; qPos[o + 2] = p.z; } else qPos[o + 1] = -500; };
  const ridden = { lead: 0, blue: null, vis: true, on: false, smokeUp: 6.5 };   // set by a world whose camera rides the express
  function update(dt, time, camera) {
    U.uTime.value = time;
    if (camera) { root.updateWorldMatrix(true, false); inv.copy(root.matrixWorld).invert(); U.uCamL.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv); }
    if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uPx.value = size.y * 0.5; }
    const period = TL + 150;
    let sE, sB;
    if (progress === null) { sE = ((time * 24) % period) - 10; sB = sE + blueLead; if (sB > TL + 70) sB -= period; } else { sE = progress * TL; sB = sE + lerp(blueLead, 196, smoothstep(40, boreI0, sE)); }
    for (let k = 3; k < NT; k++) if (opts.extraTrains[k - 3].s) trains[k].s = opts.extraTrains[k - 3].s(time, progress);
    if (ridden.blue !== null && progress !== null) sB = sE + ridden.blue;
    trains[0].s = sE + ridden.lead; trains[0].vis = showExpress && ridden.vis; trains[1].s = sB;
    if (ridden.on) { const j = trains[0].s / 12, ph = j - Math.floor(j); trains[0].roll = 0.05 * Math.exp(-ph * 6) * Math.sin(ph * 30) * (Math.floor(j) & 1 ? 1 : -1) + 0.004 * Math.sin(time * 21); }   // a lurch on every rail joint
    trains[2].s = progress === null ? gPhase - time * 20 : gMeet - (sE - gKey.at) * gSpeed;   // keyed: its engine is at gKey.angle round the loop when the express is at track s = gKey.at
    const TLv = U.uTrainL.value;
    for (let k = 0; k < NT; k++) {
      const t = trains[k]; placeTrain(t);
      const main = t.tr === track, sh = t.s + t.dir * 0.9, onH = t.vis && (!main || (sh < TL && sh > S_MIN));
      atX(t.tr, sh, _p); _p.y += 7.9; setDyn(k, _p, onH);
      atX(t.tr, t.s + t.dir * 24, _p); TLv[k * 2].set(_p.x, _p.y + 3.5, _p.z, onH ? 1.5 : 0);
      const sm = t.s - t.dir * t.len * 0.6, onM = t.vis && (!main || (sm < TL && sm > S_MIN));
      atX(t.tr, sm, _p); TLv[k * 2 + 1].set(_p.x, _p.y + 4, _p.z, onM ? (k === 2 ? 0.3 : 0.7) : 0);
      const st = t.s - t.dir * (t.len - 1.2), onT = t.vis && (!main || (st < TL && st > S_MIN));
      atX(t.tr, st, _p); _p.y += 3.2; setDyn(NT + k, _p, onT);
      for (let j = 0; j < NPUFF; j++) {
        const o = k * NPUFF + j, age = ((time * 0.42 + j / NPUFF) % 1) * 2.6, sp = t.s - t.dir * (1.4 + age * 22);   // from the funnel, streaming back
        const inB = sp > boreI0 - 2 && sp < boreI1 + 2, on = t.vis && (!main || (sp < TL - 1 && sp > S_MIN && (!inB || (k === 0 && ridden.on))));
        atX(t.tr, sp, _p);
        smPos[o * 3] = _p.x + Math.sin(j * 7.1 + k) * age * 1.1; smPos[o * 3 + 1] = _p.y + Math.min(inB ? 14.6 : 99, 10.2 + (k === 0 ? ridden.smokeUp : 6.5) * Math.pow(age / 2.6, 0.6)); /* in the bore it rolls along the roof */ smPos[o * 3 + 2] = _p.z + Math.cos(j * 5.3 + k) * age * 1.1;
        smPar[o * 2] = 1.7 + 3.2 * age; smPar[o * 2 + 1] = on ? 0.42 * (1 - age / 2.6) * Math.min(1, age * 7) : 0;
      }
    }
    for (const kind in carMesh) carMesh[kind].instanceMatrix.needsUpdate = true;
    qPosA.needsUpdate = true; smPosA.needsUpdate = true; smParA.needsUpdate = true;
    const gulp = Math.exp(-Math.pow((sB - TL - 22) / 26, 2));   // the blue engine running into the light
    U.uPortalI.value = (1.25 + 0.1 * Math.sin(time * 2.3) + 0.9 * gulp) * (progress === null ? 1 : 0.75 + 0.9 * smoothstep(0.7, 1, progress));
    if (portalFill) portalFill.material.color.copy(U.uPortalCol.value).multiplyScalar(0.55 + 0.3 * U.uPortalI.value);
  }
  update(0, 0, null);

  return {
    object: root, radius: 119, height: PKH, center: new THREE.Vector3(0, 78, 0), anchors,
    track: { length: TL, at: (s, out = new THREE.Vector3(), tan) => track.at(s, out, tan) },
    uniforms: U,
    setProgress(u) { progress = u === null || u === undefined ? null : clamp(u, -4, 1); },
    // for a world that rides the express: lead = how far the engine's nose runs ahead of setProgress's place, blue = the same
    // for the blue engine (null = its own half-turn lead), vis = false hides the express (while the world is seen through a portal)
    setRide(lead, blue = null, vis = true, smokeUp = 9.5) { ridden.on = true; ridden.lead = lead; ridden.blue = blue; ridden.vis = vis; ridden.smokeUp = smokeUp; },
    trains, tunnel: { s0: boreI0, s1: boreI1 },
    // for the world: build more props in the same style and light (everything in hero-local space)
    kit: { Batch, G, treeGeo, mkMat, tinMat, mtnMat, U, makeTrack, PTS_VERT, PTS_FRAG, GLSL_LIGHT, GLSL_FOGFADE, buildArch(batch, P, hw, spring) { BA = batch; buildArch(P, hw, spring, false); BA = B; } },
    setMoon(dir, colorHex, intensity) { if (dir) moonDir.copy(dir).normalize(); if (colorHex) U.uMoonCol.value.set(colorHex); if (intensity !== undefined) U.uMoonI.value = intensity; },
    update, dispose() {}, ground: true, groundY: 0,
  };
}
