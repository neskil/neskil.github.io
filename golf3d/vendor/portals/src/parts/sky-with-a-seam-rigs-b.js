// SKY WITH A SEAM, THE RIGS (second file): THE GANTRY'S WORKING LAMPS in the opening between the two panels, and
// (lower in this file, each with its own head) THE PAINTERS' BARGE AND ITS HOIST MAST at the wall's foot, THE LARGE
// WORK STAGES hung from the wall, THE WALL SCAFFOLDS on their floats, and THE SHADOWS of cradles and stages on the wall.
// The steel of the gantry, the decks and the panels is the hero part's; this file only hangs lamps and tackle on it.
//
// THE MOTION AT THE WAY OUT COMES FROM THINGS THAT STAND THERE AT EVERY METRE of the flight and move BY THE CLOCK
// (no phase is typed: the beacons', the weight's and the hook's are drawn by makeRigs from the stream sky-movers):
//   three amber beacons that turn (one turn in 3.4 s and slower, eased; never a flash): the two on the bridge
//   throw a short turning beam in the dusty air over the bridge's own steel; the one on the far panel's cut edge
//   turns its lamp and throws no beam in the air (nothing of it lies across the painted jamb); a row of three work lamps over each deck with moths of dust in their cones;
//   a winch whose cable runs over a sheave to a weight that rises and sinks; a chain hoist whose hook swings a
//   little. Nothing comes on, goes, quickens or changes by the metres still to fly. Two of the lamps stand ON the
//   panels' cut edges and so go where the panels go (the panels' own declared pacing, read from sky.gap.half).
//
// CLEAR OF THE RING AND THE LINE (counted by tools/film/sky-rigs-proof.mjs): every eye rides at the ring's own
// height, so a sight line to the ring's rim plus 3 m never rises over 10 m above the ring's middle: whatever of
// this file hangs in the opening before the ring's plane hangs over that band (the work lamps LAMPS.lampY = 15 m
// up; the hero's own hung weights come no lower than its BEYOND.hungLow, 13.4 m); everything lower stands
// behind the ring's plane and 24 m and more to either hand of the line (no nearer the ring than the gantry's own legs). NO LIGHT (all emissive) and NO DOUBLE OF
// THE RING: no lamp here is ring-shaped; the beacons are small amber domes 26 m and 42 m up.
//
// Places are in the gap's own frame (the hero's): r metres behind the painted face along the gap's bearing, y up,
// t along the wall clockwise. The gap's bearing is the sky's (sky.gap.bearing), taken at build.
import * as THREE from 'three';
import * as HERO from './sky-with-a-seam.js';

const { SHELL, wallPoint, dirOf } = HERO, RAD = Math.PI / 180;
// the hero's own measures of what stands beyond the face (its export BEYOND, read alone: nothing of it is typed here)
const BY = HERO.BEYOND;
// (dust: the cones' strength: the lamp's light times the share of it the dust turns toward the eye in a metre of air)
export const LAMPS = { beaconTurn: [3.4, 4.1, 4.9], beam: 13, edgeArc: 26, lampY: 15, cone: 5.2, dust: 1.2, hookY: 9.5, hookSwing: 0.03, weight: { lo: 12, hi: 19, period: 17 } };

// ---- LIGHT IN THE DUSTY AIR: the beacons' turning beams, the work lamps' cones and their pools on the decks.
// Additive, thinned by the scene's own air; aB = (along: 0 at the lamp to 1 at the far end, across: -1 to 1 over
// a flat beam's width; 2 marks a work lamp's cone, whose corners carry the lamp's place in aApex).
// A WORK LAMP'S CONE GLOWS AS LIGHT DOES; NO TERM OF THE EYE'S BEARING SOFTENS IT. The cone is a round body of
// lit dusty air: its apex at the lamp, straight down, LAMPS.cone m of radius at the deck. At each pixel the
// eye's ray is cut by that round cone (its crossings of the cone's side, kept between the lamp's level and the
// deck's: coneGlow) and the glow is the lamp's light scattered toward the eye along THE LENGTH OF LIT AIR THE RAY
// CROSSES, each metre of it lit by the inverse square of its distance from the lamp (and no nearer than the
// lamp's own half size). That sum has a closed form, worked here: for a ray that runs from u0 to u1 m, passes
// q m from the lamp and is nearest it at -m m, it is (atan((u1 + m) / q) - atan((u0 + m) / q)) / q. So the
// cone is brightest where a ray runs long through it close under the lamp, and falls to nothing at its outline
// because the chord there is nothing: its soft edge is the body's own round section. The drawn skin (a pyramid
// laid about the round cone) only says where the sum is worked: each of a ray's two crossings of the skin
// carries half of it, and one alone all of it where the ray comes in or goes out by the open foot or the eye
// stands inside the cone.
// THE BEACONS' BEAMS are two crossed flat sheets each (brightest along their middle by their own width's
// measure, fading along their length): they carry no term of the eye's bearing.
// ONE DRAW FOR ALL THE LIGHT IN THE AIR: the cones, the pools and the two turning beams lie in one geometry; a
// beam's corners stay in the beam's own frame and carry its slot (aSlot 1 or 2), whose frame (uTurn) is set at
// each draw from the beam's own pose (slot 0 stands still).
const AIR_VERT = /* glsl */`
attribute vec3 color, aApex; attribute vec2 aB; attribute float aSlot; uniform mat4 uTurn[3]; varying vec3 vCol, vN, vW, vApex; varying vec2 vB;
#include <fog_pars_vertex>
void main(){
  mat4 mm = modelMatrix * uTurn[int(aSlot + .5)];
  vCol = color; vB = aB; vec4 wp = mm * vec4(position, 1.); vW = wp.xyz; vN = normalize(mat3(mm) * normal);
  vApex = (mm * vec4(aApex, 1.)).xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const AIR_FRAG = /* glsl */`
uniform vec3 uCone;                                   // the cones: (radius over height) squared, height (m), the lamp's half size squared (m2)
varying vec3 vCol, vN, vW, vApex; varying vec2 vB;
#include <fog_pars_fragment>
// the glow of a lamp's cone along the eye's ray (o: the eye from the lamp; d: the ray, unit; tf: m along it to
// this fragment of the skin): the lamp's inverse square summed over the ray's stretch inside the round cone
float coneGlow(vec3 o, vec3 d, float tf){
  float k2 = uCone.x, H = uCone.y, dy = abs(d.y) < 1e-4 ? 1e-4 : d.y;
  // the ray's stretch between the lamp's level and the cone's foot, before the eye
  float ta = -o.y / dy, tb = (-H - o.y) / dy, s0 = max(min(ta, tb), 0.), s1 = max(ta, tb);
  // its crossings of the cone's round side
  float a = dot(d.xz, d.xz) - k2 * d.y * d.y, b = dot(o.xz, d.xz) - k2 * o.y * d.y, c = dot(o.xz, o.xz) - k2 * o.y * o.y, disc = b * b - a * c;
  if (abs(a) < 1e-5) a = 1e-5;
  float sq = sqrt(max(disc, 0.)), t1 = (-b - sq) / a, t2 = (-b + sq) / a, lo = min(t1, t2), hi = max(t1, t2), u0 = s0, u1 = s1;
  // a ray less steep than the cone's side is inside between its two crossings; a steeper one, past the crossing that lies under the lamp
  if (a > 0.) { u0 = max(lo, s0); u1 = min(hi, s1); } else if (d.y < 0.) u0 = max(hi, s0); else u1 = min(lo, s1);
  if (disc <= 0. || u1 <= u0) return 0.;
  float m = dot(o, d), q = sqrt(max(dot(o, o) - m * m + uCone.z, 1e-4)), glow = (atan((u1 + m) / q) - atan((u0 + m) / q)) / q;
  // each crossing of the skin carries half; one alone carries all where the other end is not on the side (the open foot, the eye inside)
  float isExit = step(.5 * (u0 + u1), tf), otherOnSide = mix(step(u1 + 1e-3, s1), step(s0 + 1e-3, u0), isExit);
  return glow * mix(1., .5, otherOnSide);
}
void main(){
  float along = clamp(vB.x, 0., 1.), a = (1. - along); a *= a;
  vec3 vd = vW - cameraPosition; float tf = length(vd);
  // a flat beam: brightest along its middle, fading along its length; a cone: the lit air the ray crosses (coneGlow)
  float soft = clamp(1. - vB.y * vB.y, 0., 1.);
  if (vB.y > 1.5) { a = 1.; soft = coneGlow(cameraPosition - vApex, vd / max(tf, 1e-4), tf); }
  float air = 1.;
  #ifdef USE_FOG
    air = exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #endif
  gl_FragColor = vec4(vCol * a * soft * air, 1.);
}`;
// ---- THE MOTHS OF DUST in a lamp's cone: points that wander round their own places by the clock (bounded: three
// sines each), drawn never under 1.5 pixels wide and, where drawn wider than the mote is, at the cover it truly
// has (its area over the area drawn, whole). A medium. THEY TAKE THE SCENE'S OWN AIR, BY ITS OWN LAW, as the
// cones they fly in do: a mote is a light added to what stands behind it, so the air between it and the eye
// dims it by the fog's own share at its depth and gives it none of the air's colour (the same line as the
// cones' in AIR_FRAG; the depth is the mote's own, handed on by three's own fog pieces). (A mote's width on the
// picture is reckoned by its depth, held at half a metre or more: a guard for an eye at the mote itself.)
const DUST_VERT = /* glsl */`
attribute vec4 aSeed; uniform float uTime, uH; varying float vA;
#include <fog_pars_vertex>
void main(){
  vec3 p = position + vec3(sin(uTime * (.31 + .2 * aSeed.x) + aSeed.y * 6.283), .55 * sin(uTime * (.23 + .17 * aSeed.y) + aSeed.z * 6.283), cos(uTime * (.27 + .21 * aSeed.z) + aSeed.x * 6.283)) * (.25 + .5 * aSeed.w);
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
  float px = (.035 + .05 * aSeed.w) * projectionMatrix[1][1] * uH / max(-mvPosition.z, .5);
  gl_PointSize = max(px, 1.5); vA = min(1., px * px / 2.25) * (.55 + .45 * sin(uTime * (1.1 + aSeed.x) + aSeed.z * 40.));
  #include <fog_vertex>
}`;
const DUST_FRAG = /* glsl */`
uniform vec3 uDust; varying float vA;
#include <fog_pars_fragment>
void main(){ vec2 q = gl_PointCoord - .5; float d = clamp(1. - dot(q, q) * 4., 0., 1.), air = 1.;
  #ifdef USE_FOG
    air = exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #endif
  gl_FragColor = vec4(uDust * (vA * d * d * air), 1.); }`;
// a small builder of the light's own meshes (position, normal, colour, aB)
class Air {
  constructor() { this.P = []; this.N = []; this.C = []; this.B = []; this.X = []; this.S = []; this.slot = 0; this.col = new THREE.Color(); }
  color(hex, m = 1) { this.col.set(hex).multiplyScalar(m); return this; }
  tri(a, b, c, ba, bb, bc, apex) {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize(), q = [a, b, c], w = [ba, bb, bc];
    for (let i = 0; i < 3; i++) { this.P.push(q[i].x, q[i].y, q[i].z); this.N.push(n.x, n.y, n.z); this.C.push(this.col.r, this.col.g, this.col.b); this.B.push(w[i][0], w[i][1]);
      if (apex) this.X.push(apex.x, apex.y, apex.z); else this.X.push(0, 0, 0); this.S.push(this.slot); }
  }
  // a flat beam from a (half width wa) to b (half width wb), its width along the unit e
  beam(a, b, e, wa, wb) {
    const p = (c, w, k) => c.clone().addScaledVector(e, w * k);
    for (const k of [-1, 1]) { this.tri(p(a, wa, 0), p(b, wb, 0), p(b, wb, k), [0, 0], [1, 0], [1, k]); this.tri(p(a, wa, 0), p(b, wb, k), p(a, wa, k), [0, 0], [1, k], [0, k]); }
  }
  // a lamp's cone of lit air from its apex straight down to a circle of radius r about c: the skin is a pyramid
  // of n sides laid ABOUT the round cone (its corners r / cos(pi / n) out), so every ray that crosses the round
  // cone crosses the skin; each corner carries the apex (the paint works the glow from the round cone itself)
  cone(apex, c, r, n) {
    const rr = r / Math.cos(Math.PI / n), pt = (i) => new THREE.Vector3(c.x + Math.cos((i / n) * 2 * Math.PI) * rr, c.y, c.z + Math.sin((i / n) * 2 * Math.PI) * rr);
    for (let i = 0; i < n; i++) this.tri(apex, pt(i), pt(i + 1), [0, 2], [1, 2], [1, 2], apex);
  }
  // a pool of light lying on a deck: a disc about c, bright at its middle
  pool(c, r, n) {
    const pt = (i) => new THREE.Vector3(c.x + Math.cos((i / n) * 2 * Math.PI) * r, c.y, c.z + Math.sin((i / n) * 2 * Math.PI) * r);
    for (let i = 0; i < n; i++) this.tri(c, pt(i + 1), pt(i), [0.25, 0], [0.25, 1], [0.25, 1]);
  }
  geometry() { const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(this.B, 2)); g.setAttribute('aApex', new THREE.Float32BufferAttribute(this.X, 3)); g.setAttribute('aSlot', new THREE.Float32BufferAttribute(this.S, 1)); g.computeBoundingSphere(); return g; }
  get triangles() { return this.P.length / 9; }
}
// a beacon on its post, built into g with its foot at c: a drum, an amber dome (glow kind k: 1 to 3), a guard
// of four hoops. Returns the dome's middle.
function beaconParts(K, g, c, k) {
  const { V, UP } = K, X = V(1, 0, 0), Z = V(0, 0, 1), top = c.clone().add(V(0, 1.1, 0));
  g.lamp(0, 0).color('#3a3d44'); g.tube(c, top, 0.11, 5, true); g.box(top.clone().add(V(0, 0.12, 0)), X, UP, Z, 0.52, 0.12, 0.52);
  const d = top.clone().add(V(0, 0.66, 0));
  g.color('#ffac30').lamp(3.0, k); g.tube(top.clone().add(V(0, 0.24, 0)), d, 0.46, 10); g.ball(d, 0.46, 10, 3, 0, Math.PI / 2);
  g.lamp(0, 0).color('#22252a');
  for (let i = 0; i < 4; i++) { const a = (i / 4) * 2 * Math.PI, e = V(Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55);
    g.tube(top.clone().add(V(0, 0.24, 0)).add(e), d.clone().add(V(0, 0.25, 0)).add(e), 0.02, 4, true); g.tube(d.clone().add(V(0, 0.25, 0)).add(e), d.clone().add(V(0, 0.62, 0)), 0.02, 4, true); }
  return d;
}
// a beacon's turning beam, laid into A in the beam's own frame: one long flat beam and a short one behind it,
// each crossed by an upright fan
function beamParts(K, A, len) {
  const { V, UP } = K, Z = V(0, 0, 1), o = V(0.2, 0, 0);
  A.color('#ff9a22', 1.9); A.beam(o, V(len, 0, 0), Z, 0.35, 0.13 * len); A.beam(o, V(len, 0, 0), UP, 0.35, 0.09 * len);
  A.color('#ff9a22', 0.7); A.beam(V(-0.2, 0, 0), V(-len * 0.35, 0, 0), Z, 0.3, 0.04 * len); A.beam(V(-0.2, 0, 0), V(-len * 0.35, 0, 0), UP, 0.3, 0.03 * len);
}
// the beam as its own mesh: ITS SKIN, kept for the movers and the proof and NOT DRAWN (userData.joined: its
// corners are drawn in the air's one draw, by its slot)
function beamMesh(K, mat, len, name) {
  const A = new Air(); beamParts(K, A, len);
  const m = new THREE.Mesh(A.geometry(), mat); m.frustumCulled = false; m.renderOrder = 3; m.name = name; m.userData.joined = true;
  return { mesh: m, triangles: A.triangles };
}
// ---- THE GANTRY'S WORKING LAMPS. K: the first file's kit { Geo, mesh, V, UP }; o: { ctx, mat (the rigs' one
// material), sky, length (the route's), ring (the ring's middle), detail, phases: { beacons: [three turns' phases,
// 0 to 1], weight, hook: [two] } (radians; drawn by makeRigs from the part's own stream: no phase is typed) }.
// Returns { group, movers, statics, triangles, update(dt, time), dispose() }.
export function makeGantryLamps(K, o) {
  const { Geo, mesh, V, UP } = K, ctx = o.ctx, sky = o.sky, gb = sky.gap.bearing, G = BY.gantry, D = BY.deck, L = LAMPS, U = o.mat.uniforms;
  const detail = o.detail != null ? o.detail : 1, back = SHELL.doorBack, X = V(1, 0, 0), Z = V(0, 0, 1);
  const O = wallPoint(gb, 0, 0), rh = dirOf(gb), th = dirOf(gb + 90), at = (r, y, t) => O.clone().addScaledVector(rh, r).addScaledVector(th, t).setY(y);
  const group = new THREE.Group(); group.name = 'gantry-working-lamps';
  // the ring's own place in this frame (given at build): whatever of ours hangs low stands 12 m and more behind it
  const ringR = o.ring ? (o.ring.x - O.x) * rh.x + (o.ring.z - O.z) * rh.z : 0, lowR = (r) => Math.max(r, ringR + 12);
  // (the cones' measures for the paint: their slope squared, their height from the lamp's face down to the deck, the lamp's own half size squared)
  const coneH = L.lampY - 0.1 - (D.top + 0.1), airMat = new THREE.ShaderMaterial({ vertexShader: AIR_VERT, fragmentShader: AIR_FRAG, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uCone: { value: new THREE.Vector3((L.cone / coneH) ** 2, coneH, 0.3 * 0.3) }, uTurn: { value: [0, 1, 2].map(() => new THREE.Matrix4()) } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, forceSinglePass: true });      // (one pass: light adds up the same in any order)
  const S = new Geo(), A = new Air(), movers = [], statics = [], beams = []; let tris = 0;
  // --- the beacons: two on the bridge's ends, one on the far panel's cut edge (it rides the panel)
  const bridgeTop = G.top + 2.6;
  [-1, 1].forEach((sd, i) => { const d = beaconParts(K, S, at(G.r, bridgeTop, sd * (G.legT + 1)), i + 1), b = beamMesh(K, airMat, L.beam, 'beacon-beam-' + i);
    A.slot = i + 1; beamParts(K, A, L.beam); A.slot = 0;                                                  // (the beam's corners in the air's one draw, by its slot)
    b.mesh.position.copy(d); group.add(b.mesh); beams.push({ mesh: b.mesh, k: i, slot: i + 1, period: L.beaconTurn[i], ph: o.phases.beacons[i] }); });
  // the two riders: each a group that rolls about the dome's own axis with its panel (the hero's law of the gap)
  const riders = [-1, 1].map((sd) => { const R = new THREE.Group(), g = new Geo(), step = 360 / SHELL.gores, b = gb - sd * 0.13;
    // a bracket from the panel's back frame out past its cut edge into the opening, L.edgeArc m up the wall
    const foot = wallPoint(gb + sd * 0.5, L.edgeArc - 0.4, -(back + 0.4)), head = wallPoint(b, L.edgeArc, -(back + 1.1));
    g.color('#4a4d55'); g.tube(foot, head, 0.09, 5, true); g.tube(wallPoint(gb + sd * 0.5, L.edgeArc + 2.2, -(back + 0.4)), head, 0.05, 4, true);
    if (sd > 0) { const d = beaconParts(K, g, head, 3), turner = new THREE.Object3D(); turner.position.copy(d); R.add(turner);      // (its lamp turns; it throws no beam in the air)
      beams.push({ mesh: turner, k: 2, period: L.beaconTurn[2], ph: o.phases.beacons[2], bare: true }); }
    else { g.color('#3a3d44'); g.box(head.clone().add(V(0, 0.2, 0)), X, UP, Z, 0.3, 0.2, 0.3); g.color('#ffb648').lamp(1.7, 0); g.ball(head.clone().add(V(0, 0.55, 0)), 0.26, 8, 4); g.lamp(0, 0); }
    const m = mesh(g, o.mat, 'panel-edge-lamp'); R.add(m); group.add(R); tris += g.triangles;
    return { R, sd, m, step }; });
  const roll = (half) => { for (const r of riders) { r.R.rotation.y = -r.sd * half / SHELL.R; r.R.updateMatrixWorld(true); } };
  movers.push({ name: 'the lamps on the panels\' edges', meshes: riders.map((r) => r.m), dims: 'gap', set: (metres) => roll(HERO.gapWidth(metres, o.length) / 2), at: () => roll(sky.gap.half) });
  // --- the work lamps: a boom from each leg out over its deck, three lamps under it, their cones and pools
  const lampAt = [], lampY = L.lampY, n = detail < 1 ? 10 : 16;
  for (const sd of [-1, 1]) { const t = sd * (G.legT + 2.5), p0 = at(G.r - G.half, lampY + 1, t), p1 = at(G.r - 17.5, lampY + 1, t);
    S.lamp(0, 0).color('#c09a3c'); S.tube(p0, p1, 0.16, 5, true); S.color('#8d8672'); S.tube(at(G.r - G.half * 0.6, lampY + 9.5, t - sd * 0.9), p1, 0.05, 4, true); S.tube(at(G.r - G.half * 0.6, lampY + 9.5, t - sd * 0.9), at(G.r - 10, lampY + 1, t), 0.05, 4, true);
    for (let i = 0; i < 3; i++) { const c = at(lowR(G.r - 6.5 - 5 * i), lampY, t); lampAt.push(c);
      S.lamp(0, 0).color('#8d8672'); S.tube(c.clone().setY(lampY + 1), c.clone().setY(lampY + 0.3), 0.03, 4, true);
      S.color('#2e3136'); S.box(c.clone().setY(lampY + 0.12), th, UP, rh, 0.5, 0.18, 0.34);
      S.color('#ffe2b0').lamp(3.2, 0); S.box(c.clone().setY(lampY - 0.08), th, UP, rh, 0.42, 0.02, 0.27); S.lamp(0, 0);
      A.color('#ffdca0', L.dust); A.cone(c.clone().setY(lampY - 0.1), c.clone().setY(D.top + 0.1), L.cone, n); A.color('#ffdca0', 0.42); A.pool(c.clone().setY(D.top + 0.07), L.cone * 1.05, n); } }
  [0, 2, 3, 5].forEach((k, i) => U.uWork.value[i].set(lampAt[k].x, lampAt[k].y - 0.5, lampAt[k].z, 2.4));
  const airMesh = new THREE.Mesh(A.geometry(), airMat); airMesh.frustumCulled = false; airMesh.renderOrder = 3; airMesh.name = 'light-in-the-air (cones, pools, beams)'; group.add(airMesh); tris += A.triangles;
  // --- the winch on the far deck: a drum, its cable up over a sheave at the bridge's end and down to a weight that
  // rises and sinks by the clock (a sine); drum and sheave turn with the cable
  const W = L.weight, wt = G.legT + 7.5, shY = G.top - 1.2, shR = 0.8, drR = 1.1, drumC = at(G.r, D.top + 1.9, wt - shR), shC = at(G.r, shY, wt);
  S.lamp(0, 0).color('#c09a3c'); S.tube(at(G.r, G.top + 1.3, G.legT + 4.5), shC.clone().setY(shY + 1.4), 0.2, 5, true); S.tube(shC.clone().setY(shY + 1.4), shC, 0.12, 5, true);
  S.color('#9a8f70'); for (const k of [-1.5, 1.5]) for (const q of [-1.2, 1.2]) S.tube(drumC.clone().addScaledVector(rh, k).addScaledVector(th, q).setY(D.top), drumC.clone().addScaledVector(rh, k), 0.12, 4, true);
  S.color('#c9c5b8'); S.tube(drumC.clone().addScaledVector(th, -drR).setY(D.top + 1.9), shC.clone().addScaledVector(th, -shR), 0.04, 4, true);       // the cable from the drum up to the sheave
  const wheel = (rad, len, name) => { const g = new Geo(); g.color('#8d8672'); g.tube(V(0, 0, -len), V(0, 0, len), rad, 12);
    for (const z of [-len, len]) { g.color('#b3542c'); g.tube(V(0, 0, z - 0.06), V(0, 0, z + 0.06), rad + 0.35, 12, false, rad + 0.35, true); g.color('#e6dcb6'); g.box(V(0, 0, z + Math.sign(z) * 0.08), X, UP, Z, rad + 0.25, 0.11, 0.02); }
    return { m: mesh(g, o.mat, name), tris: g.triangles }; };
  const hub = (c, w) => { const H = new THREE.Group(); H.position.copy(c); H.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(th.clone().negate(), UP, rh)); H.add(w.m); group.add(H); tris += w.tris; return H; };
  const drum = wheel(drR, 1.0, 'winch-drum'), sheave = wheel(shR, 0.12, 'winch-sheave'); hub(drumC, drum); hub(shC, sheave);
  const fallG = new Geo(); fallG.color('#c9c5b8'); fallG.tube(V(0, 0, 0), V(0, -1, 0), 0.04, 4, true);
  const fall = mesh(fallG, o.mat, 'winch-fall'), wG = new Geo(); fall.position.copy(shC).addScaledVector(th, shR); group.add(fall); tris += fallG.triangles;
  wG.color('#3a3d44'); wG.tube(V(0, 0, 0), V(0, -0.5, 0), 0.05, 4, true); for (let i = 0; i < 4; i++) { wG.color(i % 2 ? '#e0b83a' : '#a9aba6', 1.3); wG.box(V(0, -0.85 - i * 0.62, 0), th, UP, rh, 1.15, 0.29, 1.0); }
  const weight = mesh(wG, o.mat, 'winch-weight'); group.add(weight); tris += wG.triangles;
  const haul = (a) => { const y = W.lo + (W.hi - W.lo) * (0.5 + 0.5 * a), len = fall.position.y - y; fall.scale.y = len; weight.position.copy(fall.position).setY(y);
    drum.m.rotation.z = (y - W.lo) / drR; sheave.m.rotation.z = (y - W.lo) / shR; for (const m of [fall, weight, drum.m, sheave.m]) m.updateWorldMatrix(true, false); };
  movers.push({ name: 'the winch\'s weight, cable, drum and sheave', meshes: [fall, weight, drum.m, sheave.m], dims: 1, set: haul, at: (time) => haul(Math.sin(time * 2 * Math.PI / W.period + o.phases.weight)) });
  // --- the chain hoist on an arm from the bridge's near end (outside the leg): a chain, a block and hook that swing a little
  const hc = at(G.r, G.top - 1.2, -(G.legT + 6.5)), HL = hc.y - L.hookY, hG = new Geo(), HK = new THREE.Group(); HK.position.copy(hc); group.add(HK);
  S.color('#c09a3c'); S.tube(at(G.r, G.top + 1.3, -(G.legT + 4.5)), hc.clone().setY(G.top + 0.2), 0.2, 5, true); S.tube(hc.clone().setY(G.top + 0.2), hc, 0.12, 5, true); S.color('#2e3136'); S.box(hc.clone().setY(hc.y + 0.1), th, UP, rh, 0.6, 0.3, 0.45);
  hG.color('#9a927c', 1.4); hG.tube(V(0, -0.3, 0), V(0, -HL, 0), 0.05, 4, true); hG.color('#e0b83a', 1.3); hG.box(V(0, -HL - 0.55, 0), X, UP, Z, 0.5, 0.55, 0.32);
  hG.color('#22252a'); const hk = [V(0, -HL - 1.1, 0), V(0, -HL - 1.7, 0), V(0.3, -HL - 2.05, 0), V(0.62, -HL - 1.75, 0)]; for (let i = 0; i < 3; i++) hG.tube(hk[i], hk[i + 1], 0.09, 5, true);
  const hook = mesh(hG, o.mat, 'hoist-hook'); HK.add(hook); tris += hG.triangles;
  const swing = (a, b) => { HK.rotation.set(a * L.hookSwing, 0, b * L.hookSwing * 0.7); HK.updateMatrixWorld(true); }, hT = 2.0 * Math.sqrt(HL);
  movers.push({ name: 'the hoist\'s chain and hook', meshes: [hook], dims: 2, set: swing, at: (time) => swing(Math.sin(time * 2 * Math.PI / hT + o.phases.hook[0]), Math.sin(time * 2 * Math.PI / (hT * 0.83) + o.phases.hook[1])) });
  const steel = mesh(S, o.mat, 'gantry-lamps-steel'); group.add(steel); statics.push(steel); tris += S.triangles;
  // --- the moths of dust in the work lamps' cones (their own stream; every die drawn in one order)
  const rng = ctx.core.makeRng(ctx.core.hashSeed('sky-lamp-moths:' + ctx.seed)), per = Math.round(44 * detail), dp = [], ds = [];
  for (const c of lampAt) for (let i = 0; i < 44; i++) { const h = 0.6 + 8.5 * rng() * rng(), a = rng() * 6.283, q = Math.sqrt(rng()) * L.cone * (h / (lampY - D.top)) * 0.85 + 0.2, sd = [rng(), rng(), rng(), rng()];
    if (i >= per) continue; dp.push(c.x + Math.cos(a) * q, lampY - h, c.z + Math.sin(a) * q); ds.push(...sd); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('aSeed', new THREE.Float32BufferAttribute(ds, 4)); dg.computeBoundingSphere();
  const dustMat = new THREE.ShaderMaterial({ vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: { value: 0 }, uH: { value: 360 }, uDust: { value: new THREE.Color('#ffe6b8').multiplyScalar(0.9) } } });
  const dust = new THREE.Points(dg, dustMat); dust.frustumCulled = false; dust.renderOrder = 4; dust.name = 'lamp-moths'; group.add(dust);
  // the beams as movers (they turn in place): a turn from 0 to 1
  const dir = new THREE.Vector3(), pos = new THREE.Vector3(), size = new THREE.Vector2();
  const turn = (b, f) => { b.mesh.rotation.y = f * 2 * Math.PI; b.mesh.updateWorldMatrix(true, false); };
  for (const b of beams) if (!b.bare) movers.push({ name: 'the beam of beacon ' + b.k, meshes: [b.mesh], dims: 'turn', set: (f) => turn(b, f), at: (time) => turn(b, (time / b.period + b.ph) % 1) });
  return { group, movers, statics, triangles: tris,
    update(dt, time) {
      // (the movers are posed by the caller; here the shader's lamps follow them: each beacon's place and where its beam points)
      for (const b of beams) { if (b.bare) turn(b, (time / b.period + b.ph) % 1); b.mesh.getWorldPosition(pos); dir.setFromMatrixColumn(b.mesh.matrixWorld, 0); const hl = Math.hypot(dir.x, dir.z) || 1;
        U.uBeaconP.value[b.k].copy(pos); U.uBeam.value[b.k].set(dir.x / hl, dir.z / hl, 1.1, 0); if (b.slot) airMat.uniforms.uTurn.value[b.slot].copy(b.mesh.matrixWorld); }
      dustMat.uniforms.uTime.value = time;
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); dustMat.uniforms.uH.value = size.y / 2; }
    },
    dispose() { airMat.dispose(); dustMat.dispose(); } };
}

// ---- THE PAINTERS' BARGE AND ITS HOIST MAST: one large thing on the water, at the wall's foot. A BROAD WORK BARGE
// moored there (44 by 14 m, 3 m of freeboard in red lead, a dark waterline, a white band along its deck's edge, a pale deck,
// fenders along its side, yellow bollards, a white deckhouse with dark windows, a small crane, drums of paint in
// two colours, a coiled hose) and on it, its feet on a yellow steel grillage on the deck, a HOIST MAST of tubes
// and plank decks, SCAF.tower.lifts lifts up the painted sky: standards, ledgers and transoms, yellow cross
// braces, plank decks with guard rails and toe boards, safety netting over two decks, tarps, lamps on poles, and
// at its top a gallows whose lift cage rides up and down its cables by the clock. No stair, no ladder, no door;
// nobody on it.
// ITS PLACE, from the hero's laws at build: BEFORE (anticlockwise of) the stretch of wall on which our boat's
// shadow stands while the line still runs straight at the wall (shadowClimb below: the route as built, the lamp
// over its whole swing, shadowPoint), SCAF.clear m of wall and more short of it, and so far along the wall that
// THE BARGE'S BAY SIDE (and so the mast behind it) STANDS AT LEAST SCAF.far TIMES THE MAST'S HEIGHT FROM THE ROUTE
// (level, skin to line) along the route's whole length: a mast 71 m tall stands 128 m and more from the line (the
// proof counts it on every seed). Its wall-side standards rake with the leaning wall, its bay-side ones stand
// plumb: it is deep at its foot and narrow at its head. Its decks are plain work platforms reached by the lift
// cage alone. NOTHING STAIR-LIKE OR LADDER-LIKE stands on it or on the barge: no stair flight, no landing, no
// ladder, no door; every panel of its lattice is CROSS-braced.
export const SCAF = {
  clear: 6,                                             // m of the wall's foot left free between the shadow's stretch and the barge's end toward it
  far: 1.8,                                             // the barge's bay side stands this many times the mast's height from the line as flown (level), at the least, along the line's whole length
  barge: { len: 44, beam: 14, off: 0.8, free: 3, draft: 0.8 },         // off: m of water between it and the paint
  // from: the first frame, m along the barge from its middle; wall: the raking row's distance off the paint;
  // depth: from that row out to the plumb row at the top; mid: a middle row, m in from the plumb row, while there is room
  // tube: the radii of its standards, of its ledgers and transoms, of its cross-braces: A MAST 71 m TALL STANDS
  // ON STOUT STANDARDS (0.26 m across; ledgers 0.12 m, braces 0.10 m). A tube narrower than one and a half of a
  // pixel's footprint is drawn that wide and carries only its true cover (its thickness over the width drawn),
  // so the mast reads from the line (128 m and more off) by its tubes' own thickness: a standard is drawn as it
  // is while a pixel covers under 17 cm of it, and covers 0.5 of its line where a pixel covers 35 cm, 0.2 where 87 cm
  tower: { from: -9, bay: 4.5, bays: 4, lift: 2.5, lifts: 25, wall: 0.9, depth: 3, mid: 2.6, tube: [0.13, 0.06, 0.05] },
  nets: [10, 18],                                       // the two decks (lifts) over which safety netting hangs, two lifts high
  hoist: { a: 6.75, out: 1.9, head: 4.4, cage: [1.5, 2.2], period: 76 },  // the gallows: m along the barge, m out past the plumb row, its beam over the top deck; the lift cage's side and height; one trip up and down
};
const turnBy = (a, b) => ((b - a + 540) % 360) - 180;
// the last metre of straight line before the metre D (the line turns from there on): where the bay's line ends
function straightEnd(path, length, D) {
  const t = new THREE.Vector3(), u = new THREE.Vector3();
  for (let m = Math.floor(D); m > 4; m--) { path.tangentAt(m / length, t); path.tangentAt((m - 4) / length, u); if (t.angleTo(u) < 1e-3) return m; }
  return 0;
}
// WHERE OUR BOAT'S SHADOW FIRST CLIMBS THE WALL: the stretch of wall (degrees of bearing, lo to hi) on which any
// end of the boat's casting bodies throws its shadow, for every place of the lamp's swing, from the metre the
// shadow first stands on the wall (first) to the metre C where the bay's straight line ends. (Fixed at build:
// eight places of the hero's undealt lampPlace over one period, which hold both ends of the swing, so the stretch
// is the same whatever phase a sky's lamp is dealt)
export function shadowClimb(path, length, look, C) {
  const v = new THREE.Vector3(), t = new THREE.Vector3(), lamp = new THREE.Vector3(), out = new THREE.Vector3(), B = HERO.BOAT, ends = [];
  for (const c of B.cast) ends.push([c[0], c[1], c[2]], [c[3], c[4], c[5]]);
  ends.push([B.hull[0] + B.hull[3], B.hull[1], 0], [B.hull[0] - B.hull[3], B.hull[1], 0], [B.hull[0], B.hull[1], B.hull[5]], [B.hull[0], B.hull[1], -B.hull[5]]);
  let lo = Infinity, hi = -Infinity, first = C, ref = null;
  for (let m = C; m >= 0; m -= 2) {
    path.pointAt(m / length, v); path.tangentAt(m / length, t); v.y = 0; const hd = Math.atan2(t.x, -t.z); let on = false;
    for (let k = 0; k < 8; k++) { HERO.lampPlace(look, (k / 8) * HERO.LAMP.period, lamp);
      for (const e of ends) { HERO.shadowPoint(lamp, v, hd, e[0], e[1], e[2], out); if (out.y < 0.05) continue;
        const b = HERO.bearingOf(out.x, out.z); if (ref === null) ref = b; const bb = ref + turnBy(ref, b); lo = Math.min(lo, bb); hi = Math.max(hi, bb); on = true; } }
    if (!on) break; first = m;
  }
  return { first, lo, hi };
}
// the barge's own frame: a along the wall the way the line flies, y up, b off the barge's middle toward the bay;
// ring(a, y, r): the place a m along at the world's radius r (the mast's rows are arcs about the dome's axis)
function scafFrame(bearing) {
  const B = SCAF.barge, rc = SHELL.R - B.off - B.beam / 2, O = dirOf(bearing).multiplyScalar(rc), th = dirOf(bearing + 90), inn = dirOf(bearing).negate();
  const at = (a, y, b) => O.clone().addScaledVector(th, a).addScaledVector(inn, b).setY(y);
  return { O, th, inn, rc, at, deck: B.free, ring: (a, y, r) => at(a, y, rc - Math.sqrt(r * r - a * a)) };
}
// THE BARGE and what lies on it, built into g: a broad hull with 3 m of freeboard in red lead, a dark waterline
// band, a white band along its deck's edge, a pale deck, fenders, bollards, a white deckhouse, a small crane, drums and gear.
// o: { blue (the sky's paint) }
function bargeParts(K, g, F, o) {
  const { UP } = K, B = SCAF.barge, hl = B.len / 2, hw = B.beam / 2, th = F.th, inn = F.inn, at = F.at, dk = B.free, H = SCAF.hoist;
  // the hull: a steel box in strong red lead, 3 m of freeboard, a dark waterline band, a white band along the deck's edge, a pale deck
  g.lamp(0, 0).color('#b8402a'); g.box(at(0, (dk - B.draft) / 2, 0), th, UP, inn, hl, (dk + B.draft) / 2, hw);
  g.color('#1a1210'); g.box(at(0, 0.2, 0), th, UP, inn, hl + 0.02, 0.5, hw + 0.02);
  g.color('#f6f3ea'); g.box(at(0, dk - 0.4, 0), th, UP, inn, hl + 0.05, 0.36, hw + 0.05);
  g.color('#bdb7a6'); g.box(at(0, dk + 0.02, 0), th, UP, inn, hl - 0.2, 0.02, hw - 0.2);
  // fenders hung along the bay's side and at the ends: plain black cylinders, each on its lanyard
  const fender = (c) => { g.color('#17191c'); g.tube(c.clone().setY(0.35), c.clone().setY(1.75), 0.34, 6, false, 0.34, true);
    g.color('#d9d2bd'); g.tube(c.clone().setY(1.75), c.clone().setY(dk + 0.05), 0.02, 3, true); };
  const nf = 5; for (let i = 0; i < nf; i++) fender(at(-hl + 2 + (i * (B.len - 4)) / (nf - 1), 0, hw + 0.36));
  for (const s of [-1, 1]) for (const b of [-3.5, 3.5]) fender(at(s * (hl + 0.36), 0, b));
  // bollards: a pair of yellow posts at each corner and two pairs along the bay's side; an anchor chain from either end
  const boll = (a, b) => { g.color('#d6a92b'); for (const k of [-0.3, 0.3]) g.tube(at(a + k, dk, b), at(a + k, dk + 0.7, b), 0.16, 6, false, 0.2, true); };
  for (const s of [-1, 1]) { for (const q of [-1, 1]) boll(s * (hl - 1.2), q * (hw - 0.9)); boll(s * 7, hw - 0.9);
    g.color('#5a4a3c'); for (const q of [-1, 1]) g.tube(at(s * (hl - 0.4), dk + 0.1, q * 4.2), at(s * (hl + 1.6), -0.5, q * 4.2), 0.04, 3, true); }
  // the white deckhouse at the far end: white walls on a red plinth band, a blue-grey roof with eaves, dark
  // windows on three sides (no door), a stove pipe
  const hc = [15.2, -1.2], hx = 3.6, hz = 3.0, hh = 1.5;
  g.color('#f3f0e6'); g.box(at(hc[0], dk + hh + 0.02, hc[1]), th, UP, inn, hx, hh, hz); g.color('#7d8c98'); g.box(at(hc[0], dk + 2 * hh + 0.1, hc[1]), th, UP, inn, hx + 0.35, 0.08, hz + 0.35);
  g.color('#a8472d'); g.box(at(hc[0], dk + 0.3, hc[1]), th, UP, inn, hx + 0.03, 0.28, hz + 0.03);
  g.color('#10161d'); for (const a of [-2.2, 0, 2.2]) g.box(at(hc[0] + a, dk + 1.95, hc[1] + hz + 0.01), th, UP, inn, 0.7, 0.45, 0.02);
  for (const s of [-1, 1]) for (const b of [-1.3, 1.3]) g.box(at(hc[0] + s * (hx + 0.01), dk + 1.95, hc[1] + b), th, UP, inn, 0.02, 0.45, 0.75);
  g.color('#3a3d44'); g.tube(at(hc[0] + 2.4, dk + 3.1, hc[1] - 1.6), at(hc[0] + 2.4, dk + 4.4, hc[1] - 1.6), 0.11, 5, true);
  // the small crane at the nearer end: a pedestal, a yellow house with a dark window, a boom raised over the drums
  const pc = [-16.5, 0.6], tip = at(-11.6, dk + 9.6, 4.4), top = at(pc[0] - 0.5, dk + 4.7, pc[1]);
  g.color('#30353b'); g.tube(at(pc[0], dk, pc[1]), at(pc[0], dk + 1.5, pc[1]), 0.6, 8, false, 0.5, true);
  g.color('#d6a92b'); g.box(at(pc[0], dk + 2.1, pc[1]), th, UP, inn, 1.1, 0.6, 0.9); g.tube(at(pc[0] + 0.7, dk + 2.3, pc[1] + 0.5), tip, 0.24, 4, false, 0.13);
  g.color('#10161d'); g.box(at(pc[0] + 0.2, dk + 2.25, pc[1] + 0.91), th, UP, inn, 0.5, 0.3, 0.02);
  g.color('#30353b'); g.tube(at(pc[0] - 0.5, dk + 2.7, pc[1]), top, 0.08, 4, true); g.color('#b9b29a'); g.tube(top, tip, 0.02, 3, true);
  g.tube(tip, tip.clone().setY(dk + 4.4), 0.02, 3, true); g.color('#22252a'); g.box(tip.clone().setY(dk + 4.2), th, UP, inn, 0.14, 0.22, 0.1);
  // drums of paint in two colours (the sky's blue, white), in blocks by the bay's side; a second tier on the blue
  const drum = (a, b, y, col) => { g.color(col); g.tube(at(a, y + 0.03, b), at(a, y + 0.91, b), 0.29, 8, false, 0.29, true); };
  let n = 0; const every = 2;                                         // (every other drum of the blocks: the barge stands 1.8 heights of its mast and more from the line)
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if (n++ % every === 0) drum(-14.4 + 0.66 * i, 4.2 + 0.66 * j, dk, o.blue);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (n++ % every === 0) drum(-11.2 + 0.66 * i, 4.2 + 0.66 * j, dk, '#ecebe4');
  drum(-14.07, 4.53, dk + 0.9, o.blue); drum(-13.4, 5.2, dk + 0.9, o.blue); drum(H.a + 1.6, 4.9, dk, '#ecebe4'); drum(H.a + 2.25, 4.8, dk, o.blue);
  // spilt paint on the deck, a stack of planks and spare tubes by the bay's side, a pallet under the hoist
  g.color(o.blue); g.quad(at(-8.6, dk + 0.045, 4.3), at(-7.5, dk + 0.045, 4.6), at(-7.8, dk + 0.045, 5.3), at(-9.0, dk + 0.045, 5.0));
  g.color('#ecebe4'); g.quad(at(-1.2, dk + 0.045, 4.4), at(-0.3, dk + 0.045, 4.1), at(0, dk + 0.045, 4.8), at(-1.0, dk + 0.045, 4.9));
  g.color('#c4a274'); g.box(at(1.2, dk + 0.22, 5.9), th, UP, inn, 2.4, 0.18, 0.4); g.color('#b08a5a'); g.box(at(H.a, dk + 0.11, F.hoistB), th, UP, inn, 0.62, 0.07, 0.52);
  g.color('#aab0b6'); for (let i = 0; i < 3; i++) g.tube(at(-7.6, dk + 0.1, 6.0 + 0.12 * i), at(-2.4, dk + 0.1, 6.1 + 0.12 * i), 0.03, 3, true);
  // the coiled hose (stacked turns), its tail to a red pump on skids
  const ho = [11.2, 5.2]; g.color('#2d6a4f');
  for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) { const r = 0.82 - 0.04 * j, a0 = (i / 8) * 6.2832, a1 = ((i + 1) / 8) * 6.2832;
    g.tube(at(ho[0] + Math.cos(a0) * r, dk + 0.12 + 0.15 * j, ho[1] + Math.sin(a0) * r), at(ho[0] + Math.cos(a1) * r, dk + 0.12 + 0.15 * j, ho[1] + Math.sin(a1) * r), 0.07, 3, true); }
  g.tube(at(ho[0] - 0.8, dk + 0.1, ho[1]), at(9.9, dk + 0.3, 5.3), 0.07, 3, true);
  g.color('#c7492b'); g.box(at(9.5, dk + 0.5, 5.3), th, UP, inn, 0.5, 0.4, 0.35); g.color('#30353b'); g.box(at(9.5, dk + 0.08, 5.3), th, UP, inn, 0.62, 0.05, 0.45);
}
// the tower's measures: y(k) the k-th lift's height, the raking row's radius at a height, the plumb rows' radii,
// the radius at which the hoist's load hangs
const towerDims = () => { const T = SCAF.tower, dk = SCAF.barge.free, y = (k) => dk + 0.2 + k * T.lift, yTop = y(T.lifts);
  const rIn = (yy) => Math.sqrt((SHELL.R - T.wall) ** 2 - yy * yy), rOut = rIn(yTop) - T.depth, A = [];
  for (let j = 0; j <= T.bays; j++) A.push(T.from + j * T.bay);
  let kMid = 0; while (kMid < T.lifts && rIn(y(kMid + 1)) - (rOut + T.mid) >= 1) kMid++;
  return { y, yTop, rIn, rOut, rMid: rOut + T.mid, kMid, A, loadR: rOut - SCAF.hoist.out - 0.3 }; };
// THE MAST'S TUBES, built into g: a yellow steel grillage on the deck (the mast's feet), standards (the wall's row rakes with the wall in straight
// lengths of five lifts), a ledger along the two outer rows on every lift, the middle row's ledger and a transom
// at each frame on every second lift (the mast stands 1.8 heights and more from the line; its tubes' radii are
// SCAF.tower.tube: stout standards, lighter ledgers and braces), CROSS-braces in every panel of the bay's face (yellow) and of the two end frames (panels two
// lifts tall; the odd top lift has none; no zigzag: nothing here reads as a flight of stairs)
function towerTubes(K, g, F, o) {
  const { UP } = K, T = SCAF.tower, M = towerDims(), { y, yTop, rIn, rOut, rMid, kMid, A } = M, th = F.th, inn = F.inn, dk = F.deck, L = T.lifts, P = F.ring, [ts, tl, tb] = T.tube;
  // THE MAST'S FEET, plainly on the deck: a grillage of yellow steel beams under every row and every frame, a dark base plate under each standard
  g.lamp(0, 0).color('#d6a92b'); for (const r of [rOut, rMid, rIn(dk)]) g.box(P((A[0] + A[T.bays]) / 2, dk + 0.2, r), th, UP, inn, (T.bay * T.bays) / 2 + 0.9, 0.18, 0.17);
  for (const a of A) { g.color('#d6a92b'); g.box(P(a, dk + 0.2, (rOut + rIn(dk)) / 2 - 0.3), th, UP, inn, 0.17, 0.17, (rIn(dk) - rOut) / 2 + 0.4);
    g.color('#2b2f35'); for (const r of [rOut, rIn(dk)]) g.box(P(a, dk + 0.42, r), th, UP, inn, 0.34, 0.04, 0.34); }
  g.color('#5d646c');
  for (const a of A) { g.tube(P(a, dk + 0.1, rOut), P(a, yTop + 1.15, rOut), ts, 4, true); g.tube(P(a, dk + 0.1, rMid), P(a, y(kMid) + 0.3, rMid), ts, 4, true);
    for (let k = 0; k < L; k += 5) { const y0 = k ? y(k) : dk + 0.1, y1 = k + 5 >= L ? yTop + 1.15 : y(k + 5); g.tube(P(a, y0, rIn(y0)), P(a, y1, rIn(y1)), ts, 4, true); } }
  g.color('#727981');
  for (let k = 0; k <= L; k++) { const yk = y(k), rI = rIn(yk), a0 = A[0] - 0.3, a1 = A[T.bays] + 0.3, some = !(k % 2);
    g.tube(P(a0, yk, rOut), P(a1, yk, rOut), tl, 3, true); g.tube(P(a0, yk, rI), P(a1, yk, rI), tl, 3, true); if (k <= kMid && some) g.tube(P(a0, yk, rMid), P(a1, yk, rMid), tl, 3, true);
    if (some) for (const a of A) g.tube(P(a, yk + 0.05, rOut - 0.25), P(a, yk + 0.05, rI + 0.2), tl, 3, true); }
  g.color('#d8b23c');
  for (let q = 0; 2 * q + 2 <= L; q++) { const y0 = y(2 * q), y1 = y(2 * q + 2), rT = (yy) => (2 * q + 2 <= kMid ? rMid : rIn(yy));
    for (let j = 0; j < T.bays; j++) for (const up of [0, 1]) { g.color('#d8b23c'); g.tube(P(A[j + up], y0, rOut - 0.07), P(A[j + 1 - up], y1, rOut - 0.07), tb, 3, true); }
    A.forEach((a, i) => { if (i % T.bays) return; g.color('#727981'); for (const fl of [0, 1]) g.tube(P(a + 0.07, y0, fl ? rOut : rT(y0)), P(a + 0.07, y1, fl ? rT(y1) : rOut), tb, 3, true); }); }
  return M;
}
// WHAT THE TOWER CARRIES, built into g and nets (the netting's own veils: a corner's aAxis is its place on the
// cloth in metres): plank decks on every second lift and the top (a bay is laid or left open by the dice), each
// with a toe board and two guard rails; netting two lifts high over two decks and round the nearer end; tarps
// that belly out at their foot; lamps on poles; the gallows, its wheel, its hauling part and its winch.
// EACH THING ITS OWN DIE, AND EVERY DIE DRAWN IS READ (o.dice: mastDice() of them, drawn all at once before
// anything is built, read here in one fixed order whatever they say): for each deck its planks' tone, and, where
// the deck is not laid whole, each bay's (laid or open); for each net its hem's three inner points; for each
// tarp its belly's depth, four belly points and nine tones, and for a canvas tarp three spatters
const TARPS = [[0, 2, 2, 0], [2, 4, 2, 1], [1, 7, 2, 2], [3, 13, 2, 0], [0, 14, 2, 1], [2, 15, 2, 0], [1, 21, 2, 0], [3, 22, 2, 2], [0, 22, 2, 1]];      // bay, lift, lifts tall, colour (0 canvas, 1 blue, 2 green)
const mastDecks = () => { const T = SCAF.tower, d = []; for (let k = 2; k < T.lifts; k += 2) d.push(k); d.push(T.lifts); return d; };
const deckWhole = (k) => k === SCAF.tower.lifts || SCAF.nets.includes(k);
export const mastDice = () => { const d = mastDecks(); return d.length + d.filter((k) => !deckWhole(k)).length * SCAF.tower.bays + SCAF.nets.length * (SCAF.tower.bays - 1) + TARPS.length * 14 + TARPS.filter((t) => t[3] === 0).length * 3; };
function towerDress(K, g, nets, F, o, M) {
  const { V, UP } = K, T = SCAF.tower, { y, yTop, rIn, rOut, A } = M, th = F.th, inn = F.inn, dk = F.deck, L = T.lifts, P = F.ring, D = o.dice, nb = T.bays;
  let dn = 0; const die = () => D[dn++];
  mastDecks().forEach((k) => { const yk = y(k), rI = rIn(yk), w = (rI - rOut + 0.2) / 2, full = deckWhole(k), dt = die(); let laid = 0;
    for (let j = 0; j < nb; j++) { const dl = full ? 0 : die(), lay = full || dl < 0.7 || (j === nb - 1 && !laid); if (!lay) continue; laid++;
      const am = (A[j] + A[j + 1]) / 2, tone = 0.86 + 0.2 * dt + 0.04 * (j % 2);
      g.color('#b3a58c', tone); g.box(P(am, yk + 0.1, rOut - 0.1 + w / 2), th, UP, inn, T.bay / 2 - 0.04, 0.025, w / 2 - 0.015);
      g.color('#a3957e', 1.9 - tone); g.box(P(am + 0.1, yk + 0.1, rOut - 0.1 + 1.5 * w), th, UP, inn, T.bay / 2 - 0.04, 0.025, w / 2 - 0.015);
      g.color('#b3a58c', 0.95); g.tube(P(A[j], yk + 0.2, rOut - 0.13), P(A[j + 1], yk + 0.2, rOut - 0.13), 0.08, 4, true);
      g.color('#727981'); for (const h of [0.55, 1.05]) g.tube(P(A[j], yk + h, rOut - 0.04), P(A[j + 1], yk + h, rOut - 0.04), 0.025, 3, true);
      if (j === 0) g.tube(P(A[0], yk + 1.05, rOut), P(A[0], yk + 1.05, rI), 0.025, 3, true);
      if (j === nb - 1) g.tube(P(A[nb], yk + 1.05, rOut), P(A[nb], yk + 1.05, rI), 0.025, 3, true); } });
  nets.lamp(0, 0).color('#e4571b');
  SCAF.nets.forEach((k, ni) => { const y0 = y(k) - 0.15, y1 = y(k + 2) + 0.1, pts = [];
    for (let j = 0; j <= nb; j++) pts.push([A[j] + (j === 0 ? -0.2 : j === nb ? 0.2 : 0), 0.16 + (j % nb ? 0.25 * die() : 0)]);
    for (let j = 0; j < nb; j++) { const [a0, e0] = pts[j], [a1, e1] = pts[j + 1];
      nets.quad(P(a0, y0, rOut - e0 * 1.6), P(a1, y0, rOut - e1 * 1.6), P(a1, y1, rOut - e1), P(a0, y1, rOut - e0), [V(a0, y0), V(a1, y0), V(a1, y1), V(a0, y1), 0]); }
    const a = pts[0][0], d0 = rIn(y0) - rOut, d1 = rIn(y1) - rOut;
    nets.quad(P(a, y0, rIn(y0) - 0.1), P(a, y0, rOut - 0.26), P(a, y1, rOut - 0.16), P(a, y1, rIn(y1) - 0.1), [V(a - d0, y0), V(a, y0), V(a, y1), V(a - d1, y1), 0]); });
  const spat = '#' + new THREE.Color('#d9d2bd').lerp(new THREE.Color(o.blue), 0.45).getHexString();
  const sheet = (j, k, h, canvas, tc) => { const a0 = A[j] + 0.2, a1 = A[j + 1] - 0.2, y0 = y(k) + 0.35, y1 = y(k + h) - 0.05, n = 3, amp = 0.4 + 0.5 * die();
    const belly = [die(), die(), die(), die()], tones = Array.from({ length: n * n }, () => die()), spats = canvas ? [die(), die(), die()] : null;
    const pt = (i, q) => { const u = i / n, v = q / n; return P(a0 + (a1 - a0) * u, y0 + (y1 - y0) * v, rOut - 0.12 - (1 - v) * (0.45 * Math.sin(Math.PI * u) + 0.2 * belly[i]) * amp); };
    for (let i = 0; i < n; i++) for (let q = 0; q < n; q++) { g.color(canvas && q === 0 && spats[i] < 0.45 ? spat : tc, 0.9 + 0.16 * tones[i * n + q]); g.quad(pt(i, q), pt(i + 1, q), pt(i + 1, q + 1), pt(i, q + 1)); } };
  // tarps two lifts high (canvas, blue, green), none where the netting hangs nor low before the hoist's ropes
  TARPS.forEach((s) => sheet(s[0], s[1], s[2], s[3] === 0, ['#e6dfcc', '#2c62b5', '#3e7d5c'][s[3]]));
  const lampOn = (foot, head) => { g.lamp(0, 0).color('#3a3d44'); g.tube(foot, head, 0.035, 4, true); g.color('#2e3136'); g.box(head, th, UP, inn, 0.42, 0.1, 0.24);
    g.color('#ffe2b0').lamp(3.4, 0); g.box(head.clone().add(V(0, -0.13, 0)), th, UP, inn, 0.38, 0.03, 0.2); g.lamp(0, 0); };
  for (const e of [0, nb]) lampOn(P(A[e], yTop + 1.15, rOut), P(A[e], yTop + 3.1, rOut - 0.7));
  // work lamps on outriggers over the laid decks (the two under the netting, the top), each with its pool of
  // light on the planks; three more on poles between
  [[1, 10], [3, 10], [2, 18], [4, 18], [2, 25], [2, 4], [1, 14], [3, 22]].forEach(([j, k], i) => { lampOn(P(A[j], y(k) + 1.1, rOut), P(A[j], y(k) + 2.3, rOut - 1.5));
    if (i < 5) for (const s of [-1, 1]) { const a = A[j] + s * 1.6; if (a < A[0] || a > A[nb]) continue; g.color('#ffc878').lamp(0.8, 0); g.box(P(a, y(k) + 0.135, rOut + 0.8), th, UP, inn, 1.4, 0.008, 0.75); g.lamp(0, 0); } });
  const H = SCAF.hoist, yb = yTop + H.head, rT = rIn(yTop), tipR = rOut - H.out;
  g.color('#c09a3c'); g.tube(P(H.a, yTop, rOut), P(H.a, yb + 1.0, rOut), 0.05, 4, true); g.tube(P(H.a, yTop, rT), P(H.a, yb, rT), 0.05, 4, true); g.tube(P(H.a, yb, rT), P(H.a, yb, tipR - 0.45), 0.07, 4, true);
  g.color('#8d8672'); g.tube(P(H.a, yb + 1.0, rOut), P(H.a, yb, tipR - 0.3), 0.02, 3, true); g.tube(P(H.a, yb + 1.0, rOut), P(H.a, yb, rT), 0.02, 3, true);
  g.color('#b3542c'); g.tube(P(H.a - 0.05, yb - 0.3, tipR), P(H.a + 0.05, yb - 0.3, tipR), 0.3, 8, false, 0.3, true);
  g.color('#c9c5b8'); g.tube(P(H.a, yb - 0.3, tipR + 0.3), P(H.a, dk + 0.7, rOut - 0.5), 0.012, 3, true); g.color('#3f6f8f'); g.box(P(H.a, dk + 0.4, rOut - 0.5), th, UP, inn, 0.4, 0.3, 0.3);
  const gw = H.cage[0] / 2 + 0.25; g.color('#c09a3c'); g.tube(P(H.a - gw - 0.15, yb, M.loadR), P(H.a + gw + 0.15, yb, M.loadR), 0.06, 4, true);
  g.color('#c9c5b8'); for (const s of [-1, 1]) g.tube(P(H.a + s * gw, yb, M.loadR), P(H.a + s * gw, dk + 0.1, M.loadR), 0.012, 3, true);
  return { top: yb - 0.3, at: P(H.a, 0, M.loadR), diceRead: dn };
}
// ---- THE BARGE AND ITS HOIST MAST, whole. K: the first file's kit { Geo, mesh, V, UP }; o: { ctx, detail, mat,
// image (the same paint as an image in the sea), net, netImage (the netting's paint and its image's), look, path,
// length, C (the metre where the bay's straight line ends, if the world gives it), D (the wall leg's first
// metre), blue, phases: { cage } (the lift cage's phase, radians, drawn by makeRigs: none is typed) }.
// ASYNC: it yields between its pieces. Returns { group, movers, statics, triangles, bearing, near, far, climb,
// place, height, head, keep, dice: [drawn, read] }. Its meshes: painters-barge, hoist-mast, hoist-mast-nets, hoist-mast-cable,
// hoist-mast-lift-cage (each with its image).
export async function makeScaffold(K, o) {
  const { Geo, mesh, V } = K, ctx = o.ctx, B = SCAF.barge, HS = SCAF.hoist, detail = o.detail != null ? o.detail : 1;
  const rng = ctx.core.makeRng(ctx.core.hashSeed('sky-scaffold:' + ctx.seed)), dice = Array.from({ length: mastDice() }, () => rng());
  const C = o.C != null ? o.C : straightEnd(o.path, o.length, o.D), climb = shadowClimb(o.path, o.length, o.look, C), rc = SHELL.R - B.off - B.beam / 2;
  // THE BARGE STANDS BEFORE (anticlockwise of) the stretch of wall where our boat's shadow first climbs: its end
  // toward that stretch SCAF.clear m of wall and more short of it, and as near it as leaves SCAF.far times the
  // mast's height (its gallows' top over the water) between the barge's bay side and the line as flown, level,
  // along the line's whole length
  const half = Math.atan2(B.len / 2 + 1.4, rc - B.beam / 2) / RAD, line = [], v = new THREE.Vector3();
  for (let m = 0; m <= o.length; m += 4) { o.path.pointAt(m / o.length, v); line.push(v.x, v.z); }
  const head = towerDims().yTop + HS.head + 1.0, keep = SCAF.far * head + 1;
  const least = (b) => { const d = dirOf(b), t = dirOf(b + 90), rb = rc - B.beam / 2 - 0.35; let best = Infinity;
    for (let k = -2; k <= 2; k++) { const a = (k / 2) * (B.len / 2 + 1.4), x = d.x * rb + t.x * a, z = d.z * rb + t.z * a;      // (five places along its bay side: at 100 m and more that is good to 0.2 m, and `keep` has a metre to spare)
      for (let i = 0; i < line.length; i += 2) { const dx = line[i] - x, dz = line[i + 1] - z, q = dx * dx + dz * dz; if (q < best) best = q; } }
    return Math.sqrt(best); };
  let bearing = climb.lo - SCAF.clear / SHELL.R / RAD - half; for (let i = 0; i < 900 && least(bearing) < keep; i++) { bearing -= 0.1; if (i % 50 === 49) await ctx.yield(); }      // (the search yields: no long step)
  const near = bearing - half;
  await ctx.yield();
  const F = scafFrame(bearing), M0 = towerDims(); F.hoistB = F.rc - Math.sqrt(M0.loadR ** 2 - HS.a ** 2);
  const group = new THREE.Group(); group.name = 'painters-barge-and-hoist-mast';
  // each solid is drawn twice from one geometry: itself, and its image in the sea (an image is a sheen, no body)
  const pair = (geo, name, mat, img, order) => { const bg = geo.geometry(), m = mesh(bg, mat, name), im = mesh(bg, img, 'image:' + name); im.renderOrder = order; return [m, im]; };
  const S = new Geo(); bargeParts(K, S, F, { blue: o.blue });
  const [barge, bargeIm] = pair(S, 'painters-barge', o.mat, o.image, 1.5); group.add(barge, bargeIm);
  await ctx.yield();
  const Tg = new Geo(), N = new Geo(), M = towerTubes(K, Tg, F, { detail });
  await ctx.yield();
  const hs = towerDress(K, Tg, N, F, { blue: o.blue, dice }, M);
  const [tower, towerIm] = pair(Tg, 'hoist-mast', o.mat, o.image, 1.5); group.add(tower, towerIm);
  await ctx.yield();
  // (the netting's image: the first file's joinDraws then gives it a geometry of its own, these veils and after
  // them the joined bodies' imaged thin members' strips, whose images it lays where they are drawn wider than they are)
  const [veil, veilIm] = pair(N, 'hoist-mast-nets', o.net, o.netImage, 1.6); veil.renderOrder = 2.5; group.add(veil, veilIm);
  // the hoist's load: A LIFT CAGE on the hoist's cable (nobody in it): a hook block over its bail, four posts, a
  // roof, a floor, kick plates on three sides (open toward the mast), a shoe on each guide cable; two drums of
  // paint in it. The group's place is the hook's.
  const fg = new Geo(); fg.color('#d8d4c6'); fg.tube(V(0, 0, 0), V(0, -1, 0), 0.02, 3, true);
  const cs = HS.cage[0] / 2, ch = HS.cage[1], tg = new Geo(), e1 = F.th, e2 = F.inn, e3 = V(0, 1, 0), cp = (a, y, b) => V(0, y, 0).addScaledVector(e1, a).addScaledVector(e2, b), fy = -0.75 - ch;
  tg.color('#22252a'); tg.box(cp(0, -0.12, 0), e1, e3, e2, 0.09, 0.12, 0.09);
  for (const sa of [-1, 1]) for (const sb of [-1, 1]) { tg.color('#8d8672'); tg.tube(cp(0, -0.24, 0), cp(sa * cs, -0.75, sb * cs), 0.02, 3, true); tg.color('#d6a92b'); tg.tube(cp(sa * cs, -0.75, sb * cs), cp(sa * cs, fy, sb * cs), 0.05, 4, true); }
  tg.color('#3a3d44'); tg.box(cp(0, -0.75, 0), e1, e3, e2, cs + 0.05, 0.04, cs + 0.05); tg.color('#8d9296'); tg.box(cp(0, fy, 0), e1, e3, e2, cs + 0.05, 0.05, cs + 0.05);
  tg.color('#d6a92b'); for (const sa of [-1, 1]) { tg.box(cp(sa * cs, fy + 0.55, 0), e1, e3, e2, 0.02, 0.5, cs); tg.box(cp(sa * (cs + 0.14), -1.2, 0), e1, e3, e2, 0.12, 0.06, 0.06); }
  tg.box(cp(0, fy + 0.55, cs), e1, e3, e2, cs, 0.5, 0.02);
  for (const [a, col] of [[-0.35, o.blue], [0.35, '#ecebe4']]) { tg.color(col); tg.tube(cp(a, fy + 0.06, 0.15), cp(a, fy + 0.94, 0.15), 0.29, 8, false, 0.29, true); }
  const FL = new THREE.Group(), BK = new THREE.Group(), [fall, fallIm] = pair(fg, 'hoist-mast-cable', o.mat, o.image, 1.5), [tub, tubIm] = pair(tg, 'hoist-mast-lift-cage', o.mat, o.image, 1.5);
  FL.add(fall, fallIm); BK.add(tub, tubIm); group.add(FL, BK); FL.position.copy(hs.at).setY(hs.top);
  // its course: from just over the pallet on the barge's deck to where its floor is level with the top deck, and back (a is -1 to 1)
  const lo = F.deck + 0.35 - fy + 0.05, hi = hs.top - 1.05;
  const run = (a) => { const y = lo + (hi - lo) * (0.5 + 0.5 * a); BK.position.copy(hs.at).setY(y); FL.scale.y = hs.top - y; FL.updateMatrixWorld(true); BK.updateMatrixWorld(true); };
  run(0);
  const tris = 2 * (S.triangles + Tg.triangles + N.triangles + fg.triangles + tg.triangles);
  return { group, triangles: tris, statics: [barge, tower, veil], bearing, near, far: bearing + half, climb, place: F.O, height: M.yTop, head, keep, dice: [dice.length, hs.diceRead],
    movers: [{ name: 'the hoist mast\'s lift cage and its cable', meshes: [fall, tub], dims: 1, set: run, at: (time) => run(Math.sin((time * 2 * Math.PI) / HS.period + o.phases.cage)) }] };
}
// ---- THE LARGE WORK STAGES hung from the wall on ropes along the wall leg: three long decks (two before the
// unpainted stretch, hung far over the band our sail's shade sweeps; one at it under the half-made cloud), each
// held off the paint by bumper arms
// and STANDING STILL: a timber deck on steel bearers, yellow toe boards, guard rails, three hanging frames with
// their winches and stout dark wire ropes up to dark brackets at the cradles' rail far above, tarps over the bay's rail, drums of paint in two
// colours, planks, and under its bay edge A ROW OF LIT LANTERNS (emissive: there is no light here). No stair, no
// ladder; nobody on it. Its deck hangs 8 to 16 m over the water; its skin stands 18 to 30 m from the line (the
// proof counts both). K: the first file's kit; o: { mat, detail, blue, paint, wide, off (m between its wall side
// and the paint, at its middle), list: [{ bearing, len, y, spray (true: it carries the spray rig and pots) }], top: (bearing) => the rail's point over it, fix: (bearing) => the wall's point behind it, dice }.
// Returns { mesh, triangles, shades (what throws its shadow on the wall: its bay side, its outer ropes), diceRead }.
// THE STAGES' ROPES ARE STOUT IN THE BODY: a stage 24 to 28 m long hangs 90 m under the rail on three pairs of
// bridge strand 0.12 m thick (radius STAGE_ROPE), the two of a pair 0.28 m apart. A rope narrower than one and
// a half of a pixel's footprint carries only its true cover, its thickness over the width drawn (the first
// file's law of a thin member), so what reads from afar is the rope's own thickness: a strand covers 0.3 of its
// line where a pixel covers 27 cm of it and 0.12 where a pixel covers 67 cm.
const STAGE_ROPE = 0.06;
export function makeStages(K, o) {
  const { Geo, mesh, UP } = K, g = new Geo(), lite = o.detail < 1, hw = o.wide / 2, shades = [], D = o.dice; let di = 0;
  // the planks' tones and the tarps' and drums' places and tones take o.dice BY A RUNNING COUNT (30 a stage at
  // detail 1, 21 under it): a lighter build's tarps and drums are dealt anew, not the whole build's left standing
  const die = () => D[di++ % D.length];
  for (const s of o.list) {
    const hl = s.len / 2, rc = Math.sqrt(SHELL.R * SHELL.R - s.y * s.y) - o.off - hw, O = dirOf(s.bearing).multiplyScalar(rc), th = dirOf(s.bearing + 90), inn = dirOf(s.bearing).negate();
    const at = (a, h, c) => O.clone().addScaledVector(th, a).addScaledVector(inn, c).setY(s.y + h);
    // the deck: three runs of planks on two long steel bearers and cross bearers; yellow toe boards
    for (let i = 0; i < 3; i++) { g.lamp(0, 0).color('#b8a585', 0.85 + 0.25 * die()); g.box(at(0, 0, ((i - 1) * o.wide) / 3), th, UP, inn, hl, 0.05, o.wide / 6 - 0.01); }
    g.color('#3f454d'); for (const c of [-hw + 0.25, hw - 0.25]) g.box(at(0, -0.24, c), th, UP, inn, hl + 0.1, 0.19, 0.08);
    const nc = lite ? 4 : 6; for (let i = 0; i < nc; i++) g.box(at(-hl + 0.6 + ((s.len - 1.2) * i) / (nc - 1), -0.16, 0), th, UP, inn, 0.07, 0.1, hw);
    g.color('#d6a92b'); for (const c of [-hw, hw]) g.box(at(0, 0.17, c), th, UP, inn, hl, 0.17, 0.025);
    // guard rails: posts and two rails on the bay's side, one on the wall's, the ends closed
    g.color('#c9ced4'); const np = lite ? 5 : 8;
    for (let i = 0; i < np; i++) { const a = -hl + (s.len * i) / (np - 1); g.tube(at(a, 0, hw), at(a, 1.15, hw), 0.035, 4, true); g.tube(at(a, 0, -hw), at(a, 1.0, -hw), 0.035, 4, true); }
    for (const h of [0.62, 1.15]) g.tube(at(-hl, h, hw), at(hl, h, hw), 0.035, 4, true);
    g.tube(at(-hl, 1.0, -hw), at(hl, 1.0, -hw), 0.035, 4, true); for (const e of [-hl, hl]) g.tube(at(e, 1.0, -hw), at(e, 1.15, hw), 0.035, 4, true);
    // three hanging frames (orange), each with its winch and a pair of wire ropes up to the rail far above; a
    // bumper arm and its wheel to the paint (half a metre off the wall's true face)
    const ropes = [];
    for (const f of [-1, 0, 1]) { const a = f * (hl - 1.3), bb = s.bearing + a / rc / RAD, up = o.top(bb), bar = at(a, 2.7, 0), wc = -hw - (o.off - (a * a) / (2 * rc)) + 0.5;
      g.color('#c2562c'); g.tube(at(a, 0, -hw), at(a, 2.7, -hw * 0.5), 0.07, 5, true); g.tube(at(a, 0, hw), at(a, 2.7, hw * 0.5), 0.07, 5, true); g.tube(at(a, 2.7, -hw * 0.5), at(a, 2.7, hw * 0.5), 0.07, 5, true);
      g.color('#3a3f46'); g.box(at(a, 2.25, 0), th, UP, inn, 0.2, 0.3, 0.26);
      g.color('#353c45'); for (const k of [-0.14, 0.14]) g.tube(up.clone().addScaledVector(th, k), at(a + k, 2.7, 0), STAGE_ROPE, 4, true);      // stout dark wire ropes (bridge strand)
      g.color('#2b3037'); g.box(up, th, UP, inn, 0.6, 0.3, 0.4); g.tube(up, o.fix(bb), 0.12, 4, true);                                 // their fixing: a dark trolley on a bracket from the wall
      g.color('#4d535b'); g.tube(at(a, -0.1, -hw), at(a, -0.1, wc), 0.05, 4, true); g.color('#22252a'); g.tube(at(a - 0.16, -0.1, wc), at(a + 0.16, -0.1, wc), 0.18, 6, false, 0.18, true);
      if (f) ropes.push([up, bar]); }
    // tarps over the bay's rail (canvas, blue, green), each hung outside to a wavy hem and tucked inside
    const nt = lite ? 2 : 3;
    for (let t = 0; t < nt; t++) { const a0 = -hl + 2.2 + ((s.len - 8) * (t + 0.15 + 0.5 * die())) / nt, col = ['#e6dfcc', '#2c62b5', '#3e7d5c'][(t + Math.floor(3 * die())) % 3];
      for (let i = 0; i < 3; i++) { const xa = a0 + i * 1.2, xb = xa + 1.2, ha = -0.25 + 0.3 * Math.sin(i * 1.9 + t), hb = -0.25 + 0.3 * Math.sin((i + 1) * 1.9 + t);
        g.color(col, 0.88 + 0.16 * die()); g.quad(at(xa, 1.2, hw + 0.05), at(xb, 1.2, hw + 0.05), at(xb, hb, hw + 0.12), at(xa, ha, hw + 0.12));
        g.quad(at(xa, 1.2, hw + 0.05), at(xb, 1.2, hw + 0.05), at(xb, 0.7, hw - 0.1), at(xa, 0.7, hw - 0.1)); } }
    // drums of paint in two colours along the wall's side, a stack of planks
    const nd = lite ? 4 : 6;
    for (let i = 0; i < nd; i++) { const a = -hl + 3 + ((s.len - 6) * (i + 0.3 + 0.4 * die())) / nd, c = -hw + 0.5;
      g.color(i % 2 ? '#ecebe4' : o.paint, 0.92 + 0.12 * die()); g.tube(at(a, 0.06, c), at(a, 0.96, c), 0.3, 8, false, 0.3, true); }
    g.color('#c4a274'); g.box(at(hl * 0.35, 0.2, -0.2), th, UP, inn, 2.0, 0.14, 0.3);
    // A SPRAY RIG AND POTS on the stage at the unpainted stretch (s.spray): a compressor on a skid (an orange
    // box, a grey tank lying by it), its hose looped across the deck to a spray lance leant out over the bay's
    // rail, and a huddle of five paint pots (nothing lettered)
    if (s.spray) { const a = -hl * 0.45;
      g.color('#c2562c'); g.box(at(a, 0.55, 0.1), th, UP, inn, 0.7, 0.45, 0.5); g.color('#2b2f35'); g.box(at(a, 0.08, 0.1), th, UP, inn, 0.85, 0.05, 0.6);
      g.color('#8d949c'); g.tube(at(a + 1.0, 0.45, 0.1), at(a + 2.3, 0.45, 0.1), 0.36, 8, false, 0.36, true);
      g.color('#20242a'); let p = at(a + 2.3, 0.5, 0.3); for (let i = 1; i <= 6; i++) { const f = i / 6, q = at(a + 2.3 + 2.2 * f, 0.5 + 0.7 * f - 0.5 * Math.sin(Math.PI * f), 0.3 + (hw - 0.4) * f); g.tube(p, q, 0.04, 3, true); p = q; }
      g.color('#c9ced4'); g.tube(p, at(a + 4.9, 2.1, hw + 0.25), 0.03, 4, true);
      [o.paint, '#ecebe4', o.paint, '#e9c46a', '#ecebe4'].forEach((c, i) => { g.color(c); const pa = a - 1.6 - 0.45 * (i % 3), pc = -0.35 + 0.5 * Math.floor(i / 3); g.tube(at(pa, 0.06, pc), at(pa, 0.42, pc), 0.17, 6, false, 0.2, true); }); }
    // A ROW OF LIT LANTERNS under the bay's edge, each on a short wire; their glow on the deck's underside
    const nl = lite ? 5 : 8;
    for (let i = 0; i < nl; i++) { const a = -hl + 1.2 + ((s.len - 2.4) * i) / (nl - 1), c = hw - 0.12;
      g.lamp(0, 0).color('#2e3136'); g.tube(at(a, -0.42, c), at(a, -0.75, c), 0.012, 3, true);
      g.color('#ffd28a').lamp(3.4, 0); g.tube(at(a, -1.2, c), at(a, -0.75, c), 0.24, 5, false, 0.16, true); }
    g.color('#ffc878').lamp(0.55, 0); g.quad(at(-hl, -0.44, hw - 0.7), at(hl, -0.44, hw - 0.7), at(hl, -0.44, hw), at(-hl, -0.44, hw)); g.lamp(0, 0);
    shades.push({ quad: [at(-hl, -0.45, hw), at(hl, -0.45, hw), at(hl, 1.2, hw), at(-hl, 1.2, hw)], ropes, soft: 0.6, dark: 0.4 });
  }
  const m = mesh(g, o.mat, 'work-stages');
  return { mesh: m, triangles: g.triangles, shades, diceRead: di };
}
// ---- THE WALL SCAFFOLDS: tube scaffolds that stand AGAINST THE WALL on floats at its foot (great things on the
// wall's hand where the hung work leaves off: both beyond the unpainted stretch, past the leg's end, clear of
// the shadow's wall and of the paddles' bank: makeRigs tells their bearings). Each:
// a float (a green hull with a dark waterline band and a white band, 1.5 m of freeboard) moored at the wall's
// foot; two rows of uprights WSCAF.depth m apart, the wall's row WSCAF.wall m off the paint at the top; bays
// WSCAF.bay m wide, lifts WSCAF.lift m tall; a ledger along each row on every lift; plank decks on every second
// lift and the top, each with a yellow toe board and two guard rails; CROSS-braces (yellow) in every panel of
// the bay's face and of both end frames, two lifts tall (an odd top lift has none; cross-braced bays only: no
// flight, no ladder, no stepped line, nobody on it); a tarp hung on the bay's face under each deck but the top (its bay, colour and tone
// dealt: three dice a tarp, each read); drums of paint on the top deck; three lit lanterns under the second
// deck (emissive: no light). ITS IMAGE IN THE SEA shows the float, the uprights, the decks and the tarps (the
// fine tubes are under the ripple). K: the first file's kit; o: { mat, image, detail, blue, paint, list:
// [{ bearing, bays, lifts }], dice }. Returns { group, statics, triangles, sites: [{ bearing, bays, lifts, top, place }], diceRead }.
// (tube: the radii of its uprights, of its ledgers and transoms, of its cross-braces: A HEAVY SCAFFOLD, as bays
// 4.5 m wide want: uprights 0.18 m across, ledgers 0.10 m, braces 0.09 m. A tube narrower than one and a half of
// a pixel's footprint carries only its true cover, its thickness over the width drawn, so the scaffold reads
// from afar by its tubes' own thickness: an upright covers 0.5 of its line where a pixel covers 24 cm of it and
// 0.2 where a pixel covers 60 cm)
export const WSCAF = { bay: 4.5, lift: 2.4, depth: 2.4, wall: 0.9, free: 1.5, over: 1.6, tube: [0.09, 0.05, 0.045], list: [{ bays: 5, lifts: 9 }, { bays: 4, lifts: 8 }] };      // over: m of float beyond the end frames
export const scaffoldDice = () => WSCAF.list.reduce((n, q) => n + 3 * (Math.ceil(q.lifts / 2) - 1), 0);
export function makeWallScaffolds(K, o) {
  const { Geo, mesh, V, UP } = K, W = WSCAF, [tu, tl, tb] = W.tube, group = new THREE.Group(), statics = [], sites = []; group.name = 'wall-scaffolds';
  let tris = 0, di = 0;
  o.list.forEach((q, n) => {
    const core = new Geo(), fine = new Geo(), rh = dirOf(q.bearing), th = dirOf(q.bearing + 90), inn = rh.clone().negate(), dk = W.free, top = dk + q.lifts * W.lift;
    const rI = Math.sqrt(SHELL.R * SHELL.R - top * top) - W.wall, rO = rI - W.depth, hw = (q.bays * W.bay) / 2, y = (k) => dk + k * W.lift;
    const P = (a, yy, r) => rh.clone().multiplyScalar(r).addScaledVector(th, a).setY(yy), A = Array.from({ length: q.bays + 1 }, (_, j) => -hw + j * W.bay);
    // the float
    const rm = (rI + rO) / 2 - 0.6, fl = (c, yy, hy, g) => { core.color(c); core.box(P(0, yy, rm), th, UP, inn, hw + W.over + g, hy, 2.9 + g); };
    core.lamp(0, 0); fl('#2f6b55', dk / 2 - 0.3, dk / 2 + 0.3, 0); fl('#131c18', 0.2, 0.45, 0.03); fl('#f3f0e6', dk - 0.2, 0.18, 0.05);
    // uprights (in the image), ledgers, the decks' transoms
    core.color('#5d646c'); for (const a of A) for (const r of [rI, rO]) core.tube(P(a, dk, r), P(a, top + 1.1, r), tu, 4, true);
    fine.lamp(0, 0).color('#727981'); for (let k = 1; k <= q.lifts; k++) for (const r of [rI, rO]) fine.tube(P(-hw - 0.3, y(k), r), P(hw + 0.3, y(k), r), tl, 3, true);
    const decks = []; for (let k = 2; k < q.lifts; k += 2) decks.push(k); decks.push(q.lifts);
    decks.forEach((k, i) => { const yk = y(k), last = i === decks.length - 1;
      fine.color('#727981'); for (const a of A) fine.tube(P(a, yk, rO - 0.25), P(a, yk, rI + 0.2), tl, 3, true);
      core.color('#b8a585', 0.9 + 0.08 * (i % 2)); core.box(P(0, yk + 0.08, (rI + rO) / 2), th, UP, inn, hw, 0.04, W.depth / 2 + 0.1);
      fine.color('#d6a92b'); fine.box(P(0, yk + 0.25, rO - 0.06), th, UP, inn, hw, 0.13, 0.02);
      fine.color('#c9ced4'); for (const h of [0.6, 1.1]) fine.tube(P(-hw, yk + h, rO), P(hw, yk + h, rO), 0.03, 3, true);
      if (last) { for (let j = 0; j < 3; j++) { fine.color(j % 2 ? '#ecebe4' : o.paint); const a = -hw + 1.2 + j * 0.72; fine.tube(P(a, yk + 0.12, rI - 0.5), P(a, yk + 1.02, rI - 0.5), 0.3, 6, false, 0.3, true); } return; }
      // a tarp under this deck on the bay's face: its bay, colour and tone by the dice
      const j = Math.min(q.bays - 1, Math.floor(o.dice[di++] * q.bays)), col = ['#e6dfcc', '#2c62b5', '#3e7d5c'][Math.floor(o.dice[di++] * 3) % 3], a0 = A[j] + 0.2, a1 = A[j + 1] - 0.2;
      core.color(col, 0.9 + 0.14 * o.dice[di++]); core.quad(P(a0, yk - 0.1, rO - 0.08), P(a1, yk - 0.1, rO - 0.08), P(a1, yk - W.lift * 1.6, rO - 0.3), P(a0, yk - W.lift * 1.6, rO - 0.3)); });
    // cross-braces: the bay's face and both end frames, two lifts tall
    fine.color('#d8b23c');
    for (let k = 0; k + 2 <= q.lifts; k += 2) { for (let j = 0; j < q.bays; j++) for (const up of [0, 1]) fine.tube(P(A[j + up], y(k), rO - 0.07), P(A[j + 1 - up], y(k + 2), rO - 0.07), tb, 3, true);
      for (const a of [A[0], A[q.bays]]) for (const up of [0, 1]) fine.tube(P(a, y(k), up ? rO : rI), P(a, y(k + 2), up ? rI : rO), tb, 3, true); }
    // three lit lanterns under the second deck's bay edge
    if (decks.length > 1) for (let j = 0; j < 3; j++) { const a = (j - 1) * hw * 0.6, yl = y(decks[1]) - 0.1;
      fine.lamp(0, 0).color('#2e3136'); fine.tube(P(a, yl, rO - 0.2), P(a, yl - 0.45, rO - 0.2), 0.012, 3, true);
      fine.color('#ffd28a').lamp(3.4, 0); fine.tube(P(a, yl - 0.9, rO - 0.2), P(a, yl - 0.45, rO - 0.2), 0.24, 5, false, 0.16, true); fine.lamp(0, 0); }
    const mc = mesh(core, o.mat, 'wall-scaffold-' + n), mf = mesh(fine, o.mat, 'wall-scaffold-tubes-' + n), im = mesh(mc.geometry, o.image, 'image:wall-scaffold-' + n); im.renderOrder = 1.5;
    group.add(mc, mf, im); statics.push(mc, mf); tris += 2 * core.triangles + fine.triangles;
    sites.push({ bearing: q.bearing, bays: q.bays, lifts: q.lifts, top: top + 1.1, place: P(0, top / 2, rO) });
  });
  return { group, statics, triangles: tris, sites, diceRead: di };
}
// ---- THE CRADLES' AND THE STAGES' SHADOWS ON THE PAINTED WALL: soft dark shapes that lie on the wall as drawn where the lamp-sun
// (FIXED AT BUILD at the middle of its swing: the hero's undealt lampPlace at clock 0) throws each cradle's or stage's side and its ropes:
// things that stand on the wall (no eye's place is read; they do not move). K: { V }; o: { look, list: [{ quad:
// [four world points], ropes: [[top, foot], ..], soft (m of half-shade), dark }], wall: (bearing) => (unit
// direction) => the drawn wall's distance from the dome's middle }
const SHADE_VERT = /* glsl */`
attribute float aA; varying float vA;
#include <fog_pars_vertex>
void main(){
  vA = aA; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SHADE_FRAG = /* glsl */`
varying float vA;
#include <fog_pars_fragment>
void main(){
  float a = vA * vA * (3. - 2. * vA);
  #ifdef USE_FOG
    a *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #endif
  gl_FragColor = vec4(.03, .05, .12, a);
}`;
export function makeWallShadows(K, o) {
  const L = HERO.lampPlace(o.look, 0), R = SHELL.R, P = [], A = [];
  const cast = (q) => { const d = q.clone().sub(L), a = d.dot(d), b = L.dot(d), c = L.dot(L) - R * R; return L.clone().addScaledVector(d, (-b + Math.sqrt(Math.max(b * b - a * c, 0))) / a); };
  for (const s of o.list) { const rad = o.wall(HERO.bearingOf(s.quad[0].x + s.quad[2].x, s.quad[0].z + s.quad[2].z)), lay = (p) => { const d = p.clone().normalize(); return d.multiplyScalar(rad(d) - 0.11); };
    const tri = (a, b, c, wa, wb, wc) => { for (const [p, w] of [[a, wa], [b, wb], [c, wc]]) { P.push(p.x, p.y, p.z); A.push(w * s.dark); } };
    const q = s.quad.map(cast), mid = q[0].clone().add(q[1]).add(q[2]).add(q[3]).multiplyScalar(0.25), inn = q.map(lay), out = q.map((p) => lay(p.clone().add(p.clone().sub(mid).normalize().multiplyScalar(s.soft * 1.4))));
    tri(inn[0], inn[1], inn[2], 1, 1, 1); tri(inn[0], inn[2], inn[3], 1, 1, 1);
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; tri(inn[i], inn[j], out[j], 1, 1, 0); tri(inn[i], out[j], out[i], 1, 0, 0); }
    for (const [top, foot] of s.ropes) { const n = 14, w = 0.12 + s.soft * 0.25, at = (f) => cast(top.clone().lerp(foot, Math.min(1, Math.max(0, f)))); let prev = null;
      for (let i = 0; i <= n; i++) { const c = at(i / n), side = at((i + 0.5) / n).sub(at((i - 0.5) / n)).cross(c).normalize().multiplyScalar(w), row = [lay(c.clone().sub(side)), lay(c), lay(c.clone().add(side))];
        if (prev) { tri(prev[0], prev[1], row[1], 0, 0.75, 0.75); tri(prev[0], row[1], row[0], 0, 0.75, 0); tri(prev[1], prev[2], row[2], 0.75, 0, 0); tri(prev[1], row[2], row[1], 0.75, 0, 0.75); }
        prev = row; } } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 1)); g.computeBoundingSphere();
  const mat = new THREE.ShaderMaterial({ vertexShader: SHADE_VERT, fragmentShader: SHADE_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true,      // (one pass: sheets of one dark, the same in any order)
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog) } });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 1.2; m.name = 'cradle-shadows-on-the-wall';
  return { mesh: m, material: mat, triangles: P.length / 9 };
}
