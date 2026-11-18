// The Snow Lattice: hero set piece "the growing face" (the terrace arm where the crystal is being made).
//
// WHAT IT IS  A chemist's ball-and-stick model of ice Ih the size of a city block: the flat top of one arm of the
// crystal, 350 m long and 300 m wide, narrowing to a 120 degree point. Three growth steps (each one bilayer, 16.6 m)
// rise like a staircase to the viewer's left; at the first step a row is being laid: a file of loose water molecules
// glides down out of the sky, each tumbling, slowing, turning to fit, seating with a click, a sink and a shiver of
// its springs, so the finished edge runs forward like a zip. At the corners a second kink peels away 60 degrees to
// the left; two more kinks work the upper steps; frost sprigs grow from both brinks; and on the point stands one
// upright six-ring (the exit portal's frame) whose last ball comes down and seats.
//
// THE STYLE, and how it is made (all unlit ShaderMaterials writing display colour: run the world with
// post { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } }, style 'none'):
//   balls    one camera-facing quad each, ray-cast as a true sphere in the fragment shader with real depth
//            (gl_FragDepth), so rods and springs meet them properly. Lacquer = slmLacquer(): full pigment on the lit
//            side, a cooler bluer half-tone away from the fixed sun, never black; a baked per-instance shade that
//            cools and greys balls deep in the lattice; a thin rim of sky; exactly one window highlight (a tall
//            rounded pane with a cross-bar, from the reflected view ray). Where a rod meets a ball: a brass collar
//            and a small dark contact ring; where a spring meets it: a steel ferrule; an open bond: a drilled socket
//            chipped to pale wood. These come from the dot of the normal with the lattice's own bond directions
//            (uBond table, 4 site classes), so no per-instance vectors. One ball in ~33 is from the orange batch.
//   links    one quad each, turned about its own axis to face the eye: kind 0 a brass rod (false cylinder normal),
//            kind 1 a steel coil (the true projection of a helix: front turns bright, back turns thin and dark, sky
//            between the turns; under 3 px per turn it becomes its flat average). Brass = bond inside a molecule,
//            spring = bond between molecules, without exception. Brass pegs (stubble) stand in the open sockets.
//   backing  backingMaterial(): any flat face drawn as the honeycomb it stands for, fading to flat rose.
//   distance slmAerial(): pales and cools toward sky, then toward rose (uHaze). No fog, no lights, no outline.
//   tone     (FIX 7) every factor in the shaders is a LINEAR value and the screen shows its sRGB: the half-tone away
//            from the key is base * (0.40, 0.40, 0.60) (two thirds of the lit side on screen, bluer), the baked shade
//            takes a ball to about half, and the nave's dark is uPal[5] * (0.10, 0.045, 0.085), a deep plum near
//            #4F2B3D: never black, but a real dark, so a lit ring, a bar of daylight and a far mouth stand against it.
//   motion   everything closed-form in the vertex shader from two uniforms: uClock (the zip clock: dock times) and
//            uTime (ambient: spring quiver in travelling waves, relays of ivory balls hopping bond to bond every 5 s,
//            vapour drifting on closed loops, caged guests tapping).
//
// EXPORTS for the world coder (shade the WHOLE world with these so the hero is not pasted in):
//   makeStyle(palette)         -> { palette, uniforms }: ONE shared uniform set (uClock, uTime, uSun, uWin*, uPal,
//                                 uBond, uGlide[8], uHaze, uPxH, uRelay, uRT, uBar, uBarK, uNear). Pass it as opts.style, or use hero.style.
//                                 uRT is the relay clock and uBarK.y the distance the bars of daylight have walked: hero.update()
//                                 sets both from time; a world that keys them to u sets them after calling it. uNear (x, y):
//                                 inside a nave, molecules whose home is nearer the lens than y metres of view depth draw in,
//                                 whole, to nothing at x (so no ball swells into a corner of the frame); (-2, -1) = off.
//   STYLE_GLSL                 uniforms + helpers for both stages (slmHash, quaternions, slmAerial).
//   SHADE_GLSL                 fragment only: slmWindow(r, soft), slmLacquer(base, n, v, shade, gloss).
//   MOTION_GLSL                vertex only: slmMolecule(site, dock, out centre, out quat, out scale), slmRelay, slmQuiver.
//   ballMaterial(style), linkMaterial(style), backingMaterial(style)   the three materials (a sky is yours to add:
//                                 uPal[4] overhead, near white at eye level, uPal[5] rose below the horizon).
//   makeBatch()                -> { ball(), link(), vapour(x,y,z,seed,loop,glide), guest(x,y,z,seed,range),
//                                 build(style, ctx) -> { balls, links } }: everything you add costs 2 draw calls.
//   buildLattice(ctx, batch, { bounds, site(x,y,z,cls), lane(a,b), pegs })   ice Ih in lattice space into a batch:
//                                 site() returns null or { T, glide, shade }; use it for the cliff, the shaft walls
//                                 and the far tiers (a shaft axis is x = 14.4 m, y = 8.315 m + 16.63 n; x 0, y 0 is one).
//   makeHelixPool(style, ctx, n) -> { mesh, update(eyeInLatticeSpace, cameraWorldMatrixElements, tanHalfFovX,
//                                 tanHalfFovY) }: after every batch is built, the n springs nearest the eye INSIDE
//                                 THE PICTURE as real wound wire (1,080 triangles each); call update() each frame (it
//                                 only writes four small instance buffers and uHelix; the impostors hide themselves).
//   Depth codes in a site's shade (aDock.z, decoded by slmDepth in the vertex stage): 0..1 a plain baked shade |
//                                 2 + shade: a site of the shafts, lit to full pigment by the bars of daylight that
//                                 walk down the naves (uBar, uBarK: one ring lit, the next dim) and otherwise truly dim: a dark,
//                                 greyed rose near the eye, the nave's own dim with distance, never sky and never black
//                                 | 4 + k: a site low on the cliff, k gone into the rose haze (a thing of distance: not within 24 m).
//                                 | 6 + k: a tier standing behind a growing row: lacquered wood in shade, a darker, cooler half-tone with its highlight
//                                 (the hero uses it for every tier behind an active row, so each growing row is one band of full pigment).
//   Waiting pegs                 batch.link(..., pegT, 1): a brass peg that waits in an acceptor's socket for a molecule docking
//                                 at pegT; it draws back into the socket before the spring stretches across, and carries a bright tip.
//   uShow[8]                   seconds before its seat that a molecule of each file shows; a glide index + 0.25 marks
//                                 a back-course site that only shows as it comes in to its place (so a file is one
//                                 spaced line of molecules: the top front line of its row).
//   Files: uFileP/uFileD give each glide index the axis of the row it feeds, so its molecules fly in single file.
//   LATTICE, PALETTE           the numbers and the seven pigments.
//
// opts.rare (the brief's rare event, the screw): no parallel steps and no fork; the terrace left of the course is one
//   hexagonal spiral ramp wound about a flaw 118 m left and 125 m ahead of the shaft's exit, drawn out along the course, three
//   turns high. Its side that faces the course is three bands of fresh row one above and behind the other, each laid away
//   from the eye by its own kink and file (anchors.kink / kinkB are the nearest two); fly beside it at lattice y 13.5, 18 m off the nearest face.
// buildHero(ctx, opts): opts.palette (7 hex strings, the brief's order), opts.detail (0.6..1: thins vapour, sprigs,
//   pegs and one deep layer, never the zip), opts.style (a makeStyle() to share), opts.skirt (depth in metres of the
//   rose skirts under the arm, default 420), opts.rootWall (true: also close the root end).
// Returns { object, radius, height, center, anchors, style, setClock(s), paceCamera(z, lead), setProgress(u),
//   update(dt, time, camera), dispose(), ground: false }. radius/height/center frame the zip for the viewer; the
//   true extent is in anchors (rootZ..tipZ, halfWidth, branchLength).
//
// SPACE  Local space is lattice space: origin on a shaft axis at the level of the lowest terrace (floor y 0), +Z the
//   course, +X the VIEWER'S LEFT looking down +Z (so the steps stand at x = +14, +64, +130). TRANSLATE ONLY: put
//   hero.object at anchors.place (0, -24.9, 700.7 in the brief's coordinates); never rotate or scale it.
// ANCHORS  place | portalSeat { position, facing, radius 7 } (the upright ring's centre: 7.3 m clear inside) |
//   flyThrough (6 points from the rampart mouth 25 m up, sinking to 17 m, dead straight through the ring; >= 12 m
//   clear) | viewpoints { burst, pace, fork, ring } | rootZ, tipZ, forkZ, halfWidth, floorY, bottomY, stepHeight,
//   stepX[3], branchLength | zipSpeed (16 m/s), forkClock, ringClock (22: the ring's sixth ball seats), loopSeconds |
//   kink(clock), kinkB(clock) -> Vector3 of the two kinks | clockForCameraZ(z, lead = 45) | relayLaneX | counts.
// PROGRESS  All docking is keyed to the zip clock, never to wall time: each frame call hero.paceCamera(cameraLocalZ)
//   (keeps the first kink 45 m ahead), or setClock(seconds) / setProgress(u 0..1 over the terrace leg): the first
//   step's row is done by clock 17.3, the fork starts at forkClock - 1.6, the ring's sixth ball seats at ringClock. If none is
//   called, the clock loops on `time` (the viewer). uGlide[1..7] are set by the hero; uGlide[0] is the vapour's.
// COST  about 58k triangles, 3 draw calls (balls, links, underfloor), no lights, no textures; build ~250 ms in
//   steps under 40 ms. Expects around it: sky, the cliff and shaft (buildLattice), haze below, far arms (backing).
import * as THREE from 'three';

// ---------------------------------------------------------------- the lattice (ice Ih, c axis along +Z)
const RING = 9.6;                          // circumradius of a six-ring seen along the shaft
const A_LAT = RING * Math.sqrt(3);         // 16.63 m between channels
const DX = A_LAT * Math.sqrt(3) / 2;       // 14.40 m between columns in x
const LAYER = A_LAT / 2;                   // 8.31 m: one growth layer in y (the brief's "bilayer")
const BOND = RING * 3 / (2 * Math.SQRT2);  // 10.18 m oxygen to oxygen
const C_LAT = BOND * 8 / 3;                // 27.15 m: two rings along a shaft
const R_O = 2.0, R_H = 1.2, R_ROD = 0.36, R_COIL = 0.62;
const GLIDE_V = 20, GLIDE_T = 6.6;          // a file's speed along its glide path (m/s) and how long before its seat a molecule shows
const HF = 0.4;                            // where the ivory ball sits along its link (0.4 or, after a relay hop, 0.6)
const ZC = [1 / 16, 7 / 16, 9 / 16, 15 / 16];
const E = [[1, 0], [-0.5, Math.sqrt(3) / 2], [-0.5, -Math.sqrt(3) / 2]];
const LATK = 2 * Math.SQRT2 / 3;
// bond directions of the four site classes: slot 0 is the bond along the shaft, 1..3 the lateral ones
const BONDS = [];
for (let c = 0; c < 4; c++) {
  const sgn = c < 2 ? 1 : -1, up = (c === 0 || c === 2) ? 1 : -1;
  BONDS.push(new THREE.Vector3(0, 0, up));
  for (let k = 0; k < 3; k++) BONDS.push(new THREE.Vector3(sgn * E[k][0] * LATK, sgn * E[k][1] * LATK, -up / 3));
}
export const LATTICE = { RING, A_LAT, DX, LAYER, BOND, C_LAT, R_O, R_H, R_ROD, R_COIL, ZC, BONDS };

export const PALETTE = ['#D8382B', '#F3EBD7', '#B88A3A', '#9AA4AE', '#DCE9F4', '#E7C3C4', '#1F3F7A'];
//                       vermilion  ivory      brass      steel      sky        rose haze  guest blue

// ---------------------------------------------------------------- shared uniforms (one set per world)
export function makeStyle(palette = PALETTE) {
  const pal = PALETTE.map((h, i) => new THREE.Color(palette[i] || h));
  const sun = new THREE.Vector3(0.765, 0.469, -0.441).normalize();          // 120 deg left of +Z, 28 deg up
  const winZ = new THREE.Vector3(0.62, 0.66, -0.42).normalize();           // the tall window: above the sun
  const winX = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), winZ).normalize();
  const winY = new THREE.Vector3().crossVectors(winZ, winX).normalize();
  const glide = []; for (let i = 0; i < 8; i++) glide.push(new THREE.Vector3(0.45, 0.5, 0.74).normalize());
  const fileP = [], fileD = []; for (let i = 0; i < 8; i++) { fileP.push(new THREE.Vector4(0, 0, 0, 0)); fileD.push(new THREE.Vector3(0, 0, 1)); }
  return {
    palette: pal,
    uniforms: {
      uClock: { value: 0 },                 // the zip clock, seconds: every dock time T is measured on it
      uTime: { value: 0 },                  // ambient time: quiver, vapour drift, relays
      uSun: { value: sun }, uWinX: { value: winX }, uWinY: { value: winY }, uWinZ: { value: winZ },
      uPal: { value: pal },
      uBond: { value: BONDS },
      uGlide: { value: glide },             // glide-path directions (unit, pointing back up the path), by index
      uFileP: { value: fileP },             // the row each file feeds: a point on its axis (xyz), w = 1 if the molecules fly in single file
      uFileD: { value: fileD },             // ... and the row's direction (unit)
      uHelix: { value: new THREE.Vector4(0, 1e6, 0, 0) },          // the eye of the real-helix pool (lattice space), w = switch radius
      uHaze: { value: new THREE.Vector4(480, 300, 1500, 0.93) },   // length, rose from, rose to, max
      uPxH: { value: 400 },                 // half the drawing-buffer height in pixels (set in update)
      uRelay: { value: new THREE.Vector4(-200, 45, 5, 0.35) },     // z start, speed, period, hop time
      uShow: { value: [GLIDE_T, GLIDE_T, GLIDE_T, GLIDE_T, GLIDE_T, GLIDE_T, GLIDE_T, GLIDE_T] },   // seconds before its seat that a molecule of each file shows
      uBar: { value: new THREE.Vector4(0.158, 0.099, 0.982, C_LAT) }, // bars of daylight in the naves: the normal of their sheets (unit), w = metres from bar to bar (two rings: one lit, one dim)
      uBarK: { value: new THREE.Vector2(1, 0) },                   // their strength (0: none), and how far they have walked (metres; the world keys it to u, the viewer to time)
      uRT: { value: 0 },                                           // the relay clock, seconds (the world keys it to u so the relay overtakes us at its beat)
      uMouth: { value: new THREE.Vector4(0, 1e6, 0, 1) },          // the pool of daylight on the cliff round the flown mouth: x how far the face beyond it has stepped back (0: not at all), y the pool's radius (m), z the shaft axis' y, w the feather (m)
      uTierX: { value: 1e6 },                                      // left of this x (lattice) the floor under the real layers lies under the tiers: inside the model, dark
      uGuest: { value: new THREE.Vector2(58, 84) },                // a caged guest draws in to nothing between these two view depths (m): blue is either two balls on a rod or not there
      uNear: { value: new THREE.Vector2(-2, -1) },                 // inside a nave: balls and links draw in to nothing between these two view depths (m), so none fills a corner
    },
  };
}

// ---------------------------------------------------------------- GLSL shared by every material of the style
export const STYLE_GLSL = /* glsl */`
uniform float uClock, uTime, uPxH;
uniform vec3 uSun, uWinX, uWinY, uWinZ;
uniform vec3 uPal[7];
uniform vec3 uBond[16];
uniform vec3 uGlide[8];
uniform vec4 uHaze, uRelay, uHelix, uBar;
uniform vec2 uBarK, uNear, uGuest;
uniform vec4 uMouth;
uniform float uRT, uTierX;
uniform float uShow[8];
uniform vec4 uFileP[8];
uniform vec3 uFileD[8];
float slmHash(float n){ return fract(sin(n * 12.9898 + 4.1414) * 43758.5453); }
vec4 slmQuat(vec3 ax, float a){ float h = a * 0.5; return vec4(ax * sin(h), cos(h)); }
vec4 slmQmul(vec4 a, vec4 b){ return vec4(a.w * b.xyz + b.w * a.xyz + cross(a.xyz, b.xyz), a.w * b.w - dot(a.xyz, b.xyz)); }
vec3 slmRot(vec4 q, vec3 v){ return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
vec3 slmUnrot(vec4 q, vec3 v){ return slmRot(vec4(-q.xyz, q.w), v); }
// distance pales and cools: toward sky first, toward rose far away
vec3 slmAerial(vec3 col, float dist){
  float dn = dist / max(uHaze.x, 1.0);
  float f = (1.0 - exp(-0.9 * dn * dn * sqrt(dn))) * uHaze.w;      // a thing of distance: nothing within a fifth of the haze length is veiled, by its whole length vermilion is rose
  vec3 hz = mix(uPal[4], uPal[5], smoothstep(uHaze.y, uHaze.z, dist));
  return mix(col, hz, f);
}
// the same, for what stands inside a nave (nr.x: distance dims and cools it toward the nave's own rose-grey, never
// toward sky) and for what stands low on the cliff (nr.y: it has gone pale into the rose haze of the hollow)
vec3 slmAerialIn(vec3 col, float dist, vec2 nr){
  if (nr.x < -0.001) { float lm = dot(col, vec3(0.3, 0.5, 0.2)); col = mix(mix(vec3(lm), col, 0.80) * vec3(0.80, 0.74, 0.96) * (1.0 - 0.6 * lm), uPal[5] * vec3(0.17, 0.09, 0.17), min(0.6, -0.5 * nr.x + 0.12 * lm)); }   // (ivory steps back further than vermilion: a tier in shade is one dark cool rose, not lilac)   // a tier standing behind a growing row: wood in shade, a cooler half-tone (never paler than the haze)
  if (nr.y < -0.5) return col;                                                // the upright ring is never hazed
  vec3 a = slmAerial(col, dist);
  if (nr.x > 0.001) {
    vec3 nave = uPal[5] * vec3(0.10, 0.045, 0.085);                             // the dim of the nave: a deep plum, never black
    vec3 b = mix(col * vec3(0.62, 0.60, 0.72), nave, 0.08 + 0.72 * (1.0 - exp(-dist / 90.0)));   // nothing near the eye is milky: distance takes it to the nave's own dim
    a = mix(a, slmAerial(b, dist), nr.x);                                       // (seen from the hollow the real naves pale with distance exactly as the painted ones do)
  }
  return mix(a, mix(uPal[5], vec3(1.0), 0.30), nr.y * smoothstep(24.0, 120.0, dist));   // the hollow's haze is a thing of distance
}
float slmNear(float d){ return smoothstep(uNear.x, uNear.y, d); }
float slmGuestFar(float d){ return 1.0 - smoothstep(uGuest.x, uGuest.y, d); }   // a guest too far off to read as two balls on a rod is not there: it eases in, whole
`;
// fragment stage only (uses derivatives): the window highlight and the lacquer every surface of the world is shaded by
export const SHADE_GLSL = /* glsl */`
// the one window highlight: r = reflected view ray (unit). Rounded tall pane with a faint cross-bar.
float slmWindow(vec3 r, float soft){
  float z = dot(r, uWinZ);
  vec2 p = vec2(dot(r, uWinX), dot(r, uWinY)) / max(z, 0.05);
  vec2 hs = vec2(0.34, 0.54);
  vec2 q = abs(p) - hs + 0.06;
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.06;
  float aa = clamp(fwidth(p.x) + fwidth(p.y), 0.004, 0.035) + soft;
  float pane = (1.0 - smoothstep(-aa, aa, sd)) * step(0.05, z);
  float bar = min(abs(p.y - 0.09), abs(p.x));
  pane *= 1.0 - 0.55 * (1.0 - smoothstep(0.03, 0.03 + aa, bar));
  return pane;
}
// lacquer: full colour on the lit side, a cooler bluer half-tone away from it, never black; shade = baked depth 0..1
vec3 slmLacquer(vec3 base, vec3 n, vec3 v, float shade, float gloss){
  float hl = 0.5 + 0.5 * dot(n, uSun);
  vec3 cool = base * vec3(0.40, 0.40, 0.60) + uPal[4] * 0.035;   // (FIX 7: linear values: on the screen the side away from the key is two thirds of the lit side and bluer, so any still says where the light comes from)
  vec3 col = mix(cool, base, smoothstep(0.17, 0.60, hl));
  float g = dot(col, vec3(0.3, 0.5, 0.2));
  vec3 deep = mix(vec3(g), col, 0.60) * vec3(0.37, 0.34, 0.50) + uPal[5] * 0.035;
  col = mix(col, deep, shade);
  float fr = 1.0 - max(dot(n, v), 0.0); fr *= fr; fr *= fr;
  col = mix(col, uPal[4], fr * 0.38 * (1.0 - 0.75 * shade));       // the rim of reflected sky belongs to a ball in the open
  vec3 r = reflect(-v, n);
  col = mix(col, vec3(1.0, 1.0, 0.98), slmWindow(r, 0.0) * gloss * (1.0 - 0.62 * shade));
  return col;
}
`;

// ---------------------------------------------------------------- how the medium moves (vertex stage)
// dock = (T, seed, shade | loop radius, glide index).  T <= -900: seated long ago.  T >= 9000: loose vapour on a
// closed drift loop round `site`.  8000 < T < 9000: a caged guest that turns and taps from side to side.  Otherwise the molecule docks at zip-clock T: hidden before T-14, a glide path down
// uGlide[index], an eased turn to fit over the last 1.5 s, a click, a 0.3 m sink and two shivers at 2 Hz.
// (ROUND 13) The shape of a loose molecule's closed loop, in loop radii, named once: the shader's text below is written
// from these names, and so is looseAt(), by which a build reads where the same loop goes.
const LOOP_ALONG = 2.2, LOOP_LIFT = 0.3, LOOP_LIFT_RATE = 2.0, LOOP_LIFT_PHASE = 40.0;
const LOOP_REACH = Math.max(LOOP_ALONG, 1) + LOOP_LIFT;   // the molecule's centre never leaves a ball of this many loop radii round its site
export const MOTION_GLSL = /* glsl */`
void slmMolecule(vec3 site, vec4 dock, out vec3 c, out vec4 q, out float sc){
  float seed = dock.y;
  vec3 a1 = vec3(slmHash(seed + 1.0), slmHash(seed + 2.0), slmHash(seed + 3.0)) - 0.5;
  vec3 a2 = vec3(slmHash(seed + 5.0), slmHash(seed + 6.0), slmHash(seed + 7.0)) - 0.5;
  a1 /= max(length(a1), 1e-3); a2 /= max(length(a2), 1e-3);
  float w = (0.2 + 0.3 * slmHash(seed + 4.0)) * 6.2832;
  int gi = int(clamp(dock.w, 0.0, 7.0) + 0.5);
  vec3 G = uGlide[gi];
  vec3 sd = cross(G, vec3(0.0, 1.0, 0.0)); sd /= max(length(sd), 1e-3);
  c = site; q = vec4(0.0, 0.0, 0.0, 1.0); sc = 1.0;
  if (dock.x > 9000.0) {
    float ph = uTime * (0.045 + 0.05 * slmHash(seed + 8.0)) + seed * 6.2832;
    float R = dock.z;
    c += (G * sin(ph) * ${LOOP_ALONG.toFixed(1)} + sd * cos(ph) + vec3(0.0, ${LOOP_LIFT.toFixed(1)}, 0.0) * sin(ph * ${LOOP_LIFT_RATE.toFixed(1)} + seed * ${LOOP_LIFT_PHASE.toFixed(1)})) * R;
    q = slmQmul(slmQuat(a1, w * uTime + seed * 50.0), slmQuat(a2, 0.41 * w * uTime));
  } else if (dock.x > 8000.0) {
    float ph = uTime * (0.9 + 0.5 * slmHash(seed + 8.0)) + seed;
    float tap = clamp(sin(ph) * 2.5, -1.0, 1.0); tap *= 1.5 - 0.5 * tap * tap;
    c += a1 * tap * dock.z;
    q = slmQuat(a2, uTime * 0.6 + seed * 9.0);
  } else if (dock.x > -900.0) {
    float tau = dock.x - uClock;
    if (tau > 0.0) {
      float g = ${GLIDE_V.toFixed(1)} * tau * tau / (tau + 1.2);
      float sw = smoothstep(0.25, 1.7, tau);
      vec4 FP = uFileP[gi]; vec3 FD = uFileD[gi];
      vec3 onAxis = FP.xyz + FD * dot(site - FP.xyz, FD);
      c = mix(site, onAxis, sw * FP.w);
      c += G * g + (sd * sin(tau * 0.9 + uTime * 1.3 + seed * 70.0) + vec3(0.0, 1.0, 0.0) * sin(tau * 0.7 + uTime * 1.1 + seed * 30.0)) * mix(1.6, 0.4, FP.w) * sw;
      float f = tau < 1.5 ? tau * tau / 3.0 : tau - 0.75;
      q = slmQmul(slmQuat(a1, w * f), slmQuat(a2, 0.41 * w * f));
      float shw = fract(dock.w + 0.05) > 0.2 ? 0.95 : uShow[gi];      // a back-course molecule only shows as it comes in to its place
      sc = 1.0 - smoothstep(shw * 0.6, shw, tau);
    } else {
      float k = max(1.0 + tau, 0.0);
      c -= G * (0.3 * sin(-12.566 * tau) * k * k);
    }
  }
}
// relay: the ivory ball of a marked link slides to the far end (0 -> 1) and back the next period
float slmRelay(vec3 mid, float lane){
  if (lane < 0.5) return 0.0;
  float tt = uRT - (mid.z - uRelay.x) / max(uRelay.y, 1.0) - lane * 1.7 + 400.0;
  float cyc = floor(tt / max(uRelay.z, 0.1));
  float e = smoothstep(0.0, uRelay.w, tt - cyc * uRelay.z);
  return mix(e, 1.0 - e, mod(cyc, 2.0));
}
// what a site's baked depth says (aDock.z): 0..1 a plain shade | 2..3 a site of the shafts (shade + 2): bars of
// daylight walk down the nave and lift the shade to nothing | 4..5 a site low on the cliff face (4 + how far it has
// gone into the rose haze).  Returns (shade, nave, rose).
vec3 slmDepth(vec3 p, float z){
  if (z < 1.5) return vec3(z, 0.0, 0.0);
  if (z > 11.5) return vec3(0.0, 0.0, -1.0);                       // 12: the upright ring: full pigment, and distance does not pale it
  if (z > 9.5) {                                                   // 10 + s: a site of the rampart beyond the flown ring: the bars only graze it, it stays the nave's dim
    float f2 = fract((dot(p, uBar.xyz) + uBarK.y) / max(uBar.w, 1.0));
    float b2 = smoothstep(0.0, 0.07, f2) * (1.0 - smoothstep(0.46, 0.53, f2)) * uBarK.x * 0.22;
    return vec3((z - 10.0) * (1.0 - b2), (1.0 - 0.92 * b2) * smoothstep(0.15, 0.6, z - 10.0), 0.0);
  }
  if (z > 7.5) {                                                   // 8 + k: a face site beyond the flown ring: steps a tone back outside the pool of daylight
    float k = clamp(z - 8.0, 0.0, 1.0);
    float m = uMouth.x * smoothstep(uMouth.y, uMouth.y + max(uMouth.w, 0.1), length(p.xy - vec2(0.0, uMouth.z)));
    return vec3(0.6 * m, 0.9 * m * (1.0 - k), k);
  }
  if (z > 5.5) { float k = clamp(z - 6.0, 0.0, 1.0); return vec3(0.46 + 0.14 * k, -(0.44 + 0.10 * k), 0.0); }
  if (z > 3.5) return vec3(0.0, 0.0, clamp(z - 4.0, 0.0, 1.0));
  float f = fract((dot(p, uBar.xyz) + uBarK.y) / max(uBar.w, 1.0));
  float bar = smoothstep(0.0, 0.07, f) * (1.0 - smoothstep(0.46, 0.53, f)) * uBarK.x;   // inside a bar: full pigment, the whole way down the nave (one ring lit, the next dim)
  return vec3((z - 2.0) * (1.0 - bar), (1.0 - 0.92 * bar) * smoothstep(0.15, 0.6, z - 2.0), 0.0);
}
float slmQuiver(vec3 p){ return sin(dot(p, vec3(0.05, 0.07, 0.11)) - uTime * 1.7); }
`;
// (ROUND 13) The centre of a loose molecule at phase ph of its loop: the vapour's branch of slmMolecule above, from the
// same names. (x, y, z), seed and R are its site, seed and loop radius as batch.vapour is handed them; G is the unit
// glide direction of its index (uGlide); out takes the three coordinates.
export function looseAt(x, y, z, seed, R, G, ph, out) {
  const sl = Math.max(Math.hypot(G.z, G.x), 1e-3), sx = -G.z / sl, sz = G.x / sl;
  const s = Math.sin(ph) * LOOP_ALONG, c = Math.cos(ph), lift = LOOP_LIFT * Math.sin(ph * LOOP_LIFT_RATE + seed * LOOP_LIFT_PHASE);
  out[0] = x + (G.x * s + sx * c) * R;
  out[1] = y + (G.y * s + lift) * R;
  out[2] = z + (G.z * s + sz * c) * R;
  return out;
}

// ---------------------------------------------------------------- (1) the ball: a ray-cast sphere on one quad
// instance attributes: aSite xyz (home of the molecule's oxygen) | aOff xyz (this ball's offset from it), w radius |
// aDock (T, seed, shade, glide) | aMisc (palette index, site class 0..3 or bond index 0..15 for a hydrogen,
// bond code base 4: 0 none 1 brass 2 spring 3 empty socket, kind: 0 oxygen, 1 hydrogen, 1+lane hydrogen on a relay)
const BALL_VERT = /* glsl */`
attribute vec3 aSite; attribute vec4 aOff, aDock, aMisc;
varying vec3 vC, vP; varying vec4 vQ, vA, vM; varying vec2 vUv, vNR; varying float vSc;
void main(){
  vec3 c; vec4 q; float sc;
  slmMolecule(aSite, aDock, c, q, sc);
  vec3 dp = aDock.x > 8000.0 ? vec3(0.0) : slmDepth(aSite, aDock.z);
  if (aDock.x > -900.0 && aDock.x < 8000.0) dp *= 1.0 - smoothstep(-1.2, 0.4, aDock.x - uClock);   // a molecule on its way down is in full daylight; seated, it takes its tier's shade
  vNR = dp.yz;
  if (aDock.x < 8000.0) sc *= slmNear(-(modelViewMatrix * vec4(aSite, 1.0)).z);
  else if (aDock.x < 9000.0) { float gz = -(modelViewMatrix * vec4(aSite, 1.0)).z; sc *= slmGuestFar(gz) * (aDock.x < 8450.0 ? slmNear(gz) : 1.0); }
  vec3 off = aOff.xyz; float rl = 0.0;
  if (aMisc.w > 0.5) {
    rl = slmRelay(aSite + off * 1.25, aMisc.w - 1.0);
    if (aMisc.w > 1.5) { dp *= 1.0 - 4.0 * rl * (1.0 - rl); vNR = dp.yz; }   // (FIX 7: mid-hop it is in full ivory: the relay reads as a line of bright beads running along the dim wall)
    off *= 1.0 + 0.5 * rl + 0.03 * slmQuiver(aSite + off);
  }
  vec4 mv = modelViewMatrix * vec4(c + slmRot(q, off) * sc, 1.0);
  float r = aOff.w * sc; vSc = clamp(sc, 0.0, 1.0);
  float d = max(length(mv.xyz), r * 1.05 + 1e-3);
  vec3 fw = mv.xyz / d;
  vec3 rt = cross(fw, vec3(0.0, 1.0, 0.0)); rt /= max(length(rt), 1e-3);
  vec3 up = cross(rt, fw);
  float k = r * d / sqrt(max(d * d - r * r, 1e-4));
  float px = k * projectionMatrix[1][1] / d * uPxH;
  float grow = max(1.0, 0.9 / max(px, 1e-3));
  vec3 p = mv.xyz + (rt * position.x + up * position.y) * k * grow * 1.05;
  vP = p; vC = mv.xyz; vQ = q; vUv = position.xy;
  vA = vec4(r * grow, dp.x, (aMisc.x < 0.5 && slmHash(aDock.y + 11.0) < 0.03) ? 1.0 : 0.0, rl);
  vM = vec4(aMisc.xyz, aMisc.w > 0.5 ? 1.0 : 0.0);
  gl_Position = projectionMatrix * vec4(p, 1.0);
}`;
const BALL_FRAG = /* glsl */`
uniform mat4 projectionMatrix;
varying vec3 vC, vP; varying vec4 vQ, vA, vM; varying vec2 vUv, vNR; varying float vSc;
void main(){
  vec3 rd = vP / max(length(vP), 1e-4);
  float R = max(vA.x, 1e-3);
  float b = dot(rd, vC);
  float h = b * b - dot(vC, vC) + R * R;
  float cov = clamp(h / max(fwidth(h), 1e-5) + 0.5, 0.0, 1.0);
  if (cov < 0.03) discard;
  vec3 hit = rd * (b - sqrt(max(h, 0.0)));
  vec3 nV = (hit - vC) / R; nV /= max(length(nV), 1e-3);
  vec3 n = (vec4(nV, 0.0) * viewMatrix).xyz;
  vec3 v = (vec4(-rd, 0.0) * viewMatrix).xyz;
  vec3 nL = slmUnrot(vQ, n);
  float pr = 1.0 / max(fwidth(vUv.x) + fwidth(vUv.y), 1e-4);      // radius in pixels
  float e = 0.025 + 1.2 / pr;
  vec3 base = uPal[int(vM.x + 0.5)];
  if (vA.z > 0.5) base = mix(base, vec3(0.86, 0.30, 0.05), 0.36);   // the orange batch
  vec3 base0 = base;
  float a = ${R_ROD.toFixed(2)} * vSc / R, as = ${R_COIL.toFixed(2)} * vSc / R;
  int bi = int(vM.y + 0.5);
  float code = vM.z + 0.5, sgn = vA.w > 0.5 ? -1.0 : 1.0;
  for (int k = 0; k < 4; k++) {
    float kd = floor(mod(code, 4.0)); code = floor(code / 4.0);
    vec3 D = vM.w > 0.5 ? uBond[bi] * (k == 0 ? sgn : -sgn) : uBond[min(bi, 3) * 4 + k];
    if (kd < 0.5 || (vM.w > 0.5 && k > 1)) continue;
    float cs = dot(nL, D);
    float s = cs > 0.0 ? sqrt(max(1.0 - cs * cs, 0.0)) : 2.0;
    float hole = 0.17 * vSc / R;
    float rc = kd < 1.5 ? a * 1.8 : (kd < 2.5 ? as * 1.16 : hole * 1.7);
    float ri = kd < 1.5 ? 0.0 : (kd < 2.5 ? as * 0.96 : hole);
    vec3 cc = kd < 1.5 ? uPal[2] * 1.02 : (kd < 2.5 ? uPal[3] * 0.92 : vec3(0.87, 0.74, 0.55));
    float e2 = min(e, 0.06);
    float sh = kd > 2.5 ? 1.0 : smoothstep(rc, rc * (kd < 1.5 ? 1.5 : 1.2) + e2, s);
    bool hs = vM.w > 0.5 && kd > 1.5;                                      // a spring seat on an ivory ball: no ferrule
    base *= mix(hs ? vec3(0.66, 0.62, 0.66) : vec3(0.40, 0.34, 0.40), vec3(1.0), sh);   // the small dark ring of contact
    float ring = (1.0 - smoothstep(rc - e2, rc + e2, s)) * smoothstep(ri - e2, ri + e2, s);
    base = mix(base, cc, hs ? ring * 0.9 : ring);                                            // brass collar, steel ferrule or chipped wood
    if (kd > 1.5) base = mix(vec3(0.16, 0.11, 0.10), base, smoothstep(hole - e, hole + e, s));   // the drilled socket
  }
  vec3 col = slmLacquer(base, n, v, vA.y, 0.92);
  vec3 avg = base0 * mix(vec3(0.88, 0.89, 0.94), vec3(0.64, 0.66, 0.77), vA.y) + 0.04;
  col = mix(avg, col, smoothstep(1.2, 3.5, pr));
  col = slmAerialIn(col, length(hit), vNR);
  gl_FragColor = vec4(col, cov);
  vec4 cp = projectionMatrix * vec4(hit, 1.0);
  gl_FragDepth = clamp(cp.z / max(cp.w, 1e-4) * 0.5 + 0.5, 0.0, 1.0);
}`;
export function ballMaterial(style) {
  return new THREE.ShaderMaterial({
    uniforms: style.uniforms, alphaToCoverage: true,
    vertexShader: STYLE_GLSL + MOTION_GLSL + BALL_VERT, fragmentShader: STYLE_GLSL + SHADE_GLSL + BALL_FRAG,
  });
}

// ---------------------------------------------------------------- (2) the link: brass rod or steel coil on one quad
// instance attributes: aSite xyz (donor oxygen's home) | aOff xyz (the hydrogen's offset = a third of the bond),
// w kind (0 brass rod, rigid with the donor molecule; 1 steel spring from the hydrogen to the acceptor oxygen) |
// aDock (donor's T, seed, shade, glide) | aMisc (acceptor's T, relay lane, 0, 0).
// A spring whose far end has not arrived waits as a compressed stub (the "peg") and stretches out as it seats.
const LINK_VERT = /* glsl */`
attribute vec3 aSite; attribute vec4 aOff, aDock, aMisc;
varying vec3 vU, vAx, vSd, vPv; varying vec4 vL; varying vec2 vNR;
void main(){
  vec3 c; vec4 q; float sc; vec3 A, B; float halfW, shv = 0.0;
  float vz0 = -(modelViewMatrix * vec4(aSite, 1.0)).z;
  float nf = aDock.x < 8000.0 ? slmNear(vz0) : (aDock.x < 9000.0 ? slmGuestFar(vz0) * (aDock.x < 8450.0 ? slmNear(vz0) : 1.0) : 1.0);     // a molecule near the lens (inside a nave) draws in to nothing, whole
  vec3 dp = aDock.x > 8000.0 ? vec3(0.0) : slmDepth(aSite, aDock.z);
  if (aDock.x > -900.0 && aDock.x < 8000.0) dp *= 1.0 - smoothstep(-1.2, 0.4, aDock.x - uClock);   // a molecule on its way down is in full daylight; seated, it takes its tier's shade
  vNR = dp.yz;
  float rl = slmRelay(aSite + aOff.xyz * 1.25, aMisc.y);
  float hh = 1.0 + 0.5 * rl + 0.03 * slmQuiver(aSite + aOff.xyz);
  if (aOff.w < 0.5) {
    slmMolecule(aSite, aDock, c, q, sc); sc *= nf;
    vec3 o = slmRot(q, aOff.xyz) * sc;
    if (rl > 0.5) { A = c + o * hh; B = c + o * 2.5; } else { A = c; B = c + o * hh; }
    halfW = ${R_ROD.toFixed(2)} * sc;
    if (aMisc.w > 0.5) {                                   // a waiting peg: gone into its socket before the spring stretches across
      float pk = 1.0 - smoothstep(aMisc.z - 1.05, aMisc.z - 0.5, uClock);
      B = c + o * (0.3 + 0.7 * pk); halfW *= 1.3 * step(0.02, pk); shv = 1.0;
    }
  } else {
    vec3 Hp = aSite + aOff.xyz * hh, O1 = aSite + aOff.xyz * (rl > 0.5 ? 0.0 : 2.5);
    float sA = uClock - aDock.x, sB = uClock - aMisc.x;
    float first = max(sA, sB), last = min(sA, sB);
    float show = smoothstep(0.0, 0.5, first);
    float ext = mix(sA >= sB ? 0.17 : 0.30, 1.0, smoothstep(-0.6, -0.02, last)) * show;
    if (sA >= sB) { A = Hp; B = Hp + (O1 - Hp) * ext; } else { A = O1; B = O1 + (Hp - O1) * ext; }
    float k = clamp(1.0 - last, 0.0, 1.0);
    shv = last > 0.0 ? sin(12.566 * last) * k * k : 0.0;
    shv += 0.15 * slmQuiver(aSite);
    nf = min(nf, slmNear(-(modelViewMatrix * vec4(aSite + aOff.xyz * 2.5, 1.0)).z));
    vec3 md = (A + B) * 0.5; A = md + (A - md) * nf; B = md + (B - md) * nf;
    halfW = ${R_COIL.toFixed(2)} * show * nf;
    if (distance(aSite + aOff.xyz * 1.75, uHelix.xyz) < uHelix.w - 0.02) halfW = 0.0;      // the pool draws this one as real wire
  }
  vec4 a = modelViewMatrix * vec4(A, 1.0), b = modelViewMatrix * vec4(B, 1.0);
  vec3 ax = b.xyz - a.xyz; float len = length(ax); ax /= max(len, 1e-3);
  vec3 pv = mix(a.xyz, b.xyz, position.y);
  vec3 sd = cross(ax, pv); sd /= max(length(sd), 1e-3);
  float dist = max(length(pv), 0.05);
  float pxw = halfW * projectionMatrix[1][1] / dist * uPxH;
  float grow = halfW > 1e-4 ? max(1.0, (aOff.w < 0.5 && aMisc.w > 0.5 ? 1.5 : 0.8) / max(pxw, 1e-3)) : 1.0;
  if (nf < 0.999) grow = 1.0;
  pv += sd * position.x * halfW * grow;
  vU = vec3(position.x, position.y, len); vAx = ax; vSd = sd; vPv = pv;
  vL = vec4(aOff.w, dp.x, shv, pxw);
  gl_Position = projectionMatrix * vec4(pv, 1.0);
}`;
const LINK_FRAG = /* glsl */`
varying vec3 vU, vAx, vSd, vPv; varying vec4 vL; varying vec2 vNR;
void main(){
  vec3 rd = vPv / max(length(vPv), 1e-4);
  vec3 sd = vSd / max(length(vSd), 1e-3);
  vec3 fc = cross(sd, vAx); fc /= max(length(fc), 1e-3);
  if (dot(fc, rd) > 0.0) fc = -fc;
  float x = clamp(vU.x, -1.0, 1.0), ex = max(fwidth(vU.x), 1e-4);
  vec3 v = (vec4(-rd, 0.0) * viewMatrix).xyz;
  float dist = length(vPv);
  vec3 col; float cov = 1.0;
  if (vL.x < 0.5) {
    vec3 nV = sd * x + fc * sqrt(max(1.0 - x * x, 0.0));
    vec3 n = (vec4(nV, 0.0) * viewMatrix).xyz;
    col = slmLacquer(uPal[2], n, v, vL.y, 0.55);
    vec3 hv = uSun + v; hv /= max(length(hv), 1e-3);
    float sp = max(dot(n, hv), 0.0); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
    col = mix(col, vec3(1.0, 0.97, 0.86), sp * 0.6 * (1.0 - 0.5 * vL.y));
    col = mix(uPal[2] * 0.86, col, smoothstep(0.7, 2.0, vL.w));
    if (vL.z > 0.5) col = mix(col, vec3(1.0, 0.97, 0.84), smoothstep(0.74, 0.86, vU.y) * 0.92);
  } else {
    const float N = 9.0; float wr = 0.22;
    float ph = 6.2832 * N * vU.y + vL.z * 1.6 * sin(3.1416 * vU.y);
    float sl = cos(ph) * 6.2832 * N * ${R_COIL.toFixed(2)} / max(vU.z, 0.05);
    float k = sqrt(1.0 + sl * sl);
    float u = (x - (1.0 - wr) * sin(ph)) / k;
    float front = step(0.0, cos(ph));
    float w = wr * mix(0.5, 1.22, front);
    float e = ex / k * 0.75 + 1e-4;
    float wire = 1.0 - smoothstep(w - e, w + e, abs(u));
    float pitch = vU.z / N * vL.w / ${R_COIL.toFixed(2)};          // pixels per turn
    float lod = smoothstep(2.0, 5.0, pitch);
    cov = mix(0.75 * (1.0 - smoothstep(0.75, 0.95, abs(x))), wire, lod);
    if (cov < 0.4) discard;
    float un = clamp(u / max(w, 1e-3), -1.0, 1.0);
    vec3 nV = sd * (x * 0.6 + un * 0.7) + fc * sqrt(max(1.0 - x * x, 0.0)) * (front * 2.0 - 1.0) + vAx * (un * 0.5 * sign(sl + 1e-5));
    nV /= max(length(nV), 1e-3);
    if (dot(nV, rd) > 0.0) nV = reflect(nV, fc);
    vec3 n = (vec4(nV, 0.0) * viewMatrix).xyz;
    vec3 steel = slmLacquer(uPal[3], n, v, vL.y, 0.5) * mix(0.5, 1.0, front);
    vec3 hv = uSun + v; hv /= max(length(hv), 1e-3);
    float sp = max(dot(n, hv), 0.0); sp *= sp; sp *= sp; sp *= sp;
    steel = mix(steel, vec3(1.0), sp * 0.7 * front * (1.0 - 0.5 * vL.y));
    col = mix(uPal[3] * mix(0.80, 0.66, vL.y), steel, lod);
  }
  col = slmAerialIn(col, dist, vNR);
  gl_FragColor = vec4(col, cov);
}`;
export function linkMaterial(style) {
  return new THREE.ShaderMaterial({
    uniforms: style.uniforms, alphaToCoverage: true, side: THREE.DoubleSide,
    vertexShader: STYLE_GLSL + MOTION_GLSL + LINK_VERT, fragmentShader: STYLE_GLSL + SHADE_GLSL + LINK_FRAG,
  });
}

// ---------------------------------------------------------------- (2b) real springs near the eye: a pool of helical tubes
// The nearest springs are wound wire, not a drawing of it: every frame the pool takes the springs within uHelix.w of
// the eye (the link impostors of exactly those hide themselves), so a coil seen end-on is nested round turns.
const HEL_N = 9, HEL_SEG = 12, HEL_SIDES = 5, HEL_WIRE = 0.165, HEL_RC = R_COIL - HEL_WIRE;
const HELIX_VERT = /* glsl */`
attribute vec3 aSite; attribute vec4 aOff, aDock, aMisc;
varying vec3 vN, vW; varying vec2 vS, vNR; varying float vBk;
void main(){
  vec3 dp = aDock.x > 8000.0 ? vec3(0.0) : slmDepth(aSite, aDock.z);
  if (aDock.x > -900.0 && aDock.x < 8000.0) dp *= 1.0 - smoothstep(-1.2, 0.4, aDock.x - uClock);   // a molecule on its way down is in full daylight; seated, it takes its tier's shade
  vNR = dp.yz;
  float rl = slmRelay(aSite + aOff.xyz * 1.25, aMisc.y);
  float hh = 1.0 + 0.5 * rl + 0.03 * slmQuiver(aSite + aOff.xyz);
  vec3 Hp = aSite + aOff.xyz * hh, O1 = aSite + aOff.xyz * (rl > 0.5 ? 0.0 : 2.5);
  float sA = uClock - aDock.x, sB = uClock - aMisc.x;
  float first = max(sA, sB), last = min(sA, sB);
  float show = smoothstep(0.0, 0.5, first);
  float ext = mix(sA >= sB ? 0.17 : 0.30, 1.0, smoothstep(-0.6, -0.02, last)) * show;
  vec3 A, B;
  if (sA >= sB) { A = Hp; B = Hp + (O1 - Hp) * ext; } else { A = O1; B = O1 + (Hp - O1) * ext; }
  float nfh = min(slmNear(-(modelViewMatrix * vec4(aSite, 1.0)).z), slmNear(-(modelViewMatrix * vec4(aSite + aOff.xyz * 2.5, 1.0)).z));
  vec3 md = (A + B) * 0.5; A = md + (A - md) * nfh; B = md + (B - md) * nfh;
  float k = clamp(1.0 - last, 0.0, 1.0);
  float shv = (last > 0.0 ? sin(12.566 * last) * k * k : 0.0) + 0.15 * slmQuiver(aSite);
  vec3 ax = B - A; float len = length(ax); ax /= max(len, 1e-3);
  vec3 ref = abs(ax.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 e1 = cross(ax, ref); e1 /= max(length(e1), 1e-3);
  vec3 e2 = cross(ax, e1);
  float t = position.x, phi = position.y;
  float th = ${(2 * Math.PI * HEL_N).toFixed(4)} * t + shv * 1.6 * sin(3.1416 * t);
  float Rc = ${HEL_RC.toFixed(3)} * nfh;
  vec3 rad = e1 * cos(th) + e2 * sin(th);
  vec3 tn = ax * len + (e2 * cos(th) - e1 * sin(th)) * (${(2 * Math.PI * HEL_N).toFixed(4)} * Rc);
  tn /= max(length(tn), 1e-3);
  vec3 bn = cross(tn, rad); bn /= max(length(bn), 1e-3);
  vec3 nrm = rad * cos(phi) + bn * sin(phi);
  vec3 pc = A + ax * (len * t) + rad * Rc;
  vec4 w = modelMatrix * vec4(pc, 1.0);
  float dist = max(distance(w.xyz, cameraPosition), 0.05);
  float rw = max(${HEL_WIRE.toFixed(3)}, 0.8 * dist / max(projectionMatrix[1][1] * uPxH, 1.0));
  if (len < 0.05 || show < 0.01) rw = 0.0;
  rw *= nfh;
  w.xyz += nrm * rw;
  vec3 toEye = cameraPosition - w.xyz; toEye /= max(length(toEye), 1e-3);
  vN = nrm; vW = w.xyz; vS = vec2(dp.x, cos(phi)); vBk = dot(mat3(modelMatrix) * rad, toEye);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const HELIX_FRAG = /* glsl */`
varying vec3 vN, vW; varying vec2 vS, vNR; varying float vBk;
void main(){
  vec3 n = vN / max(length(vN), 1e-3);
  vec3 v = cameraPosition - vW; float dist = length(v); v /= max(dist, 1e-3);
  vec3 col = slmLacquer(uPal[3], n, v, vS.x, 0.35);
  col *= mix(0.66, 1.0, smoothstep(-0.7, 0.3, vS.y));                 // the inside of the coil is in its own shade
  float frontT = smoothstep(-0.35, 0.25, vBk);                         // each turn passes in front (bright) and then behind (in shade)
  col *= mix(0.5, 1.0, frontT);
  vec3 hv = uSun + v; hv /= max(length(hv), 1e-3);
  float sp = max(dot(n, hv), 0.0); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  col = mix(col, vec3(1.0), sp * 0.8 * (1.0 - 0.5 * vS.x) * frontT);  // the thin highlight along the wire
  gl_FragColor = vec4(slmAerialIn(col, dist, vNR), 1.0);
}`;
export async function makeHelixPool(style, ctx, n = 160) {
  const src = style.springData || [], data = new Float32Array(src.length), count = data.length / 15;
  for (let o = 0; o < src.length; o += 16384) { const e = Math.min(src.length, o + 16384); for (let j = o; j < e; j++) data[j] = src[j]; await ctx.yield(); }
  const pos = [], idx = [], rings = HEL_N * HEL_SEG + 1;
  for (let i = 0; i < rings; i++) for (let j = 0; j < HEL_SIDES; j++) pos.push(i / (rings - 1), j / HEL_SIDES * Math.PI * 2, 0);
  for (let i = 0; i < rings - 1; i++) for (let j = 0; j < HEL_SIDES; j++) {
    const a = i * HEL_SIDES + j, b = i * HEL_SIDES + (j + 1) % HEL_SIDES, c = a + HEL_SIDES, d = b + HEL_SIDES;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const mkA = (name, size) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(n * size), size); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(name, a); return a; };
  const aS = mkA('aSite', 3), aO = mkA('aOff', 4), aD = mkA('aDock', 4), aM = mkA('aMisc', 4);
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({ uniforms: style.uniforms, side: THREE.DoubleSide,
    vertexShader: STYLE_GLSL + MOTION_GLSL + HELIX_VERT, fragmentShader: STYLE_GLSL + SHADE_GLSL + HELIX_FRAG });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'helix pool';
  // the springs sorted into 8 m bins along the course, so a frame only looks at those near the eye
  const BIN = 8, R = 64; let z0 = Infinity, z1 = -Infinity;
  const mid = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const o = i * 15;
    mid[i * 3] = data[o] + data[o + 3] * 1.75; mid[i * 3 + 1] = data[o + 1] + data[o + 4] * 1.75; const z = mid[i * 3 + 2] = data[o + 2] + data[o + 5] * 1.75;
    if (z < z0) z0 = z; if (z > z1) z1 = z;
    if ((i & 2047) === 2047) await ctx.yield();
  }
  const nb = count ? Math.floor((z1 - z0) / BIN) + 1 : 1, start = new Int32Array(nb + 1), order = new Int32Array(count);
  for (let i = 0; i < count; i++) { start[Math.floor((mid[i * 3 + 2] - z0) / BIN) + 1]++; if ((i & 8191) === 8191) await ctx.yield(); }
  for (let b = 0; b < nb; b++) start[b + 1] += start[b];
  const fill = start.slice(0, nb);
  await ctx.yield();
  for (let i = 0; i < count; i++) { order[fill[Math.floor((mid[i * 3 + 2] - z0) / BIN)]++] = i; if ((i & 8191) === 8191) await ctx.yield(); }
  await ctx.yield();
  const CAP = 6000, cand = new Int32Array(CAP), cd = new Float32Array(CAP), hist = new Int32Array(R * 2 + 1);
  let used = 0;
  return {
    mesh, count,
    // eye: the camera in lattice space; m: the elements of its world matrix; tx, ty: the tangents of half its field
    // of view. The pool goes to the springs the eye is looking at (the nearest n inside the picture and a small
    // margin round it), not to those beside, below or behind it.
    update(eye, m, tx = 1.1, ty = 0.62) {
      const M = m || [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0], kx = tx * 1.12, ky = ty * 1.12;
      let c = 0; hist.fill(0);
      const b0 = Math.max(0, Math.floor((eye.z - R - z0) / BIN)), b1 = Math.min(nb - 1, Math.floor((eye.z + R - z0) / BIN));
      for (let q = b0 <= b1 ? start[b0] : 0, qe = b0 <= b1 ? start[b1 + 1] : 0; q < qe && c < CAP; q++) {
        const i = order[q], dx = mid[i * 3] - eye.x, dy = mid[i * 3 + 1] - eye.y, dz = mid[i * 3 + 2] - eye.z, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < R * R) { const d = Math.sqrt(d2); if (d > 7) { const zc = -(dx * M[8] + dy * M[9] + dz * M[10]); if (zc < -3 || Math.abs(dx * M[0] + dy * M[1] + dz * M[2]) > zc * kx + 5 || Math.abs(dx * M[4] + dy * M[5] + dz * M[6]) > zc * ky + 5) continue; } cand[c] = i; cd[c] = d; hist[(d * 2) | 0]++; c++; }
      }
      let rsw = R;
      if (c > n) { let acc = 0; for (let b = 0; b <= R * 2; b++) { if (acc + hist[b] > n) { rsw = b * 0.5; break; } acc += hist[b]; } }
      let k = 0;
      for (let j = 0; j < c && k < n; j++) {
        if (cd[j] >= rsw) continue;
        const o = cand[j] * 15;
        aS.array[k * 3] = data[o]; aS.array[k * 3 + 1] = data[o + 1]; aS.array[k * 3 + 2] = data[o + 2];
        for (let e = 0; e < 4; e++) { aO.array[k * 4 + e] = data[o + 3 + e]; aD.array[k * 4 + e] = data[o + 7 + e]; aM.array[k * 4 + e] = data[o + 11 + e]; }
        k++;
      }
      for (let j = k; j < used; j++) { aO.array[j * 4] = 0; aO.array[j * 4 + 1] = 0; aO.array[j * 4 + 2] = 0; aD.array[j * 4] = 9999; aM.array[j * 4] = 9999; }
      used = k;
      aS.version++; aO.version++; aD.version++; aM.version++;        // re-upload the pool's four small buffers
      style.uniforms.uHelix.value.set(eye.x, eye.y, eye.z, rsw);
    },
  };
}

// ---------------------------------------------------------------- batches: everything of the model in two draw calls
export function makeBatch() {
  const bs = [], bo = [], bd = [], bm = [], ls = [], lo = [], ld = [], lm = [];
  const api = {
    balls: 0, links: 0,
    loose: [],                                 // (ROUND 13) every loose molecule this batch holds, as vapour() was handed it: x, y, z, seed, loop, glide
    // dock = [T, seed, shade, glide]; see the attribute notes above BALL_VERT and LINK_VERT
    ball(x, y, z, ox, oy, oz, r, dock, pal, idx, code, kind) {
      bs.push(x, y, z); bo.push(ox, oy, oz, r); bd.push(dock[0], dock[1], dock[2], dock[3]); bm.push(pal, idx, code, kind); api.balls++;
    },
    link(x, y, z, ox, oy, oz, kind, dock, t1, lane, pegT = 0, peg = 0) {
      ls.push(x, y, z); lo.push(ox, oy, oz, kind); ld.push(dock[0], dock[1], dock[2], dock[3]); lm.push(t1, lane, pegT, peg); api.links++;
    },
    // a loose water molecule drifting on a closed loop of radius `loop` round (x,y,z): 3 balls, 2 rods
    vapour(x, y, z, seed, loop, glide = 0) {
      const dock = [9999, seed, loop, glide], len = BOND * HF;
      api.loose.push(x, y, z, seed, loop, glide);
      api.ball(x, y, z, 0, 0, 0, R_O, dock, 0, 0, 1 + 4 + 48 + 192, 0);
      for (let k = 0; k < 2; k++) {
        const D = BONDS[k];
        api.ball(x, y, z, D.x * len, D.y * len, D.z * len, R_H, dock, 1, k, 4, 1);
        api.link(x, y, z, D.x * len, D.y * len, D.z * len, 0, dock, 9999, 0);
      }
    },
    // a guest: two Prussian-blue balls on one brass rod, turning and tapping `range` metres either way in its cage
    guest(x, y, z, seed, range = 3) {
      const dock = [8400, seed, range, 0], D = BONDS[1], h = 1.9;
      for (const sg of [1, -1]) {
        api.ball(x, y, z, D.x * h * sg, D.y * h * sg, D.z * h * sg, 1.5, dock, 6, 1, sg > 0 ? 4 : 1, 1);
        api.link(x, y, z, D.x * h * sg, D.y * h * sg, D.z * h * sg, 0, dock, 9999, 0);
      }
    },
    // makes the two meshes (one draw call each); pass ctx so the uploads are prepared in small steps
    async build(style, ctx) {
      const mk = async (pos, attrs, n, mat) => {
        const g = new THREE.InstancedBufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
        for (const [name, arr, size] of attrs) {
          const ta = new Float32Array(arr.length);                 // copied in pieces, a yield between each
          for (let o = 0; o < arr.length; o += 16384) { const e = Math.min(arr.length, o + 16384); for (let j = o; j < e; j++) ta[j] = arr[j]; if (ctx) await ctx.yield(); }
          g.setAttribute(name, new THREE.InstancedBufferAttribute(ta, size));
          if (ctx) await ctx.yield();
        }
        g.instanceCount = n;
        const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
      };
      const balls = await mk([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0],
        [['aSite', bs, 3], ['aOff', bo, 4], ['aDock', bd, 4], ['aMisc', bm, 4]], api.balls, ballMaterial(style));
      const links = await mk([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0],
        [['aSite', ls, 3], ['aOff', lo, 4], ['aDock', ld, 4], ['aMisc', lm, 4]], api.links, linkMaterial(style));
      balls.name = 'balls'; links.name = 'links';
      const sd = style.springData || (style.springData = []);
      for (let i = 0; i < api.links; i++) { if (ctx && (i & 2047) === 2047) await ctx.yield(); if (lo[i * 4 + 3] > 0.5) sd.push(ls[i * 3], ls[i * 3 + 1], ls[i * 3 + 2], lo[i * 4], lo[i * 4 + 1], lo[i * 4 + 2], lo[i * 4 + 3], ld[i * 4], ld[i * 4 + 1], ld[i * 4 + 2], ld[i * 4 + 3], lm[i * 4], lm[i * 4 + 1], lm[i * 4 + 2], lm[i * 4 + 3]); }
      return { balls, links };
    },
  };
  return api;
}

// ---------------------------------------------------------------- the ice lattice into a batch
// spec.bounds {x0,x1,y0,y1,z0,z1}; spec.site(x, y, z, cls) -> null (no ball there) or { T, glide, shade } (T omitted
// or <= -900: always there); spec.lane(a, b) -> relay lane number (0 none) for the link between two seated sites;
// spec.pegs 0..1: share of open sockets that carry a waiting stub. Coordinates are lattice space (see LATTICE).
export async function buildLattice(ctx, batch, spec) {
  const rng = spec.rng || ctx.rng, B = spec.bounds, sites = [], index = new Map();
  const key = (m, n, l, c) => (((m + 512) * 1024 + (n + 512)) * 1024 + (l + 512)) * 4 + c;
  const m0 = Math.floor((B.x0 - 2 * RING) / DX), m1 = Math.ceil((B.x1 - RING) / DX);
  const l0 = Math.floor(B.z0 / C_LAT) - 1, l1 = Math.ceil(B.z1 / C_LAT);
  let cnt = 0;
  for (let m = m0; m <= m1; m++) {
    const n0 = Math.floor((B.y0 - m * LAYER) / A_LAT), n1 = Math.ceil((B.y1 - m * LAYER) / A_LAT);
    for (let n = n0; n <= n1; n++) {
      const y = m * LAYER + n * A_LAT; if (y < B.y0 - 0.01 || y > B.y1 + 0.01) continue;
      for (let l = l0; l <= l1; l++) for (let c = 0; c < 4; c++) {
        const x = RING + m * DX + (c > 1 ? RING : 0), z = (l + ZC[c]) * C_LAT;
        if (x < B.x0 || x > B.x1 || z < B.z0 || z > B.z1) continue;
        const s = spec.site(x, y, z, c);
        if (s) { index.set(key(m, n, l, c), sites.length); sites.push({ x, y, z, c, m, n, l, T: s.T ?? -1000, glide: s.glide || 0, shade: s.shade || 0, seed: rng() * 97 }); }
        if ((++cnt & 255) === 0) await ctx.yield();
      }
    }
  }
  const N = sites.length, nbr = new Int32Array(N * 4).fill(-1), don = new Uint8Array(N * 4);
  const LM = [[0, 0], [-1, 1], [-1, 0]];
  for (let i = 0; i < N; i++) {
    const s = sites[i], c = s.c;
    for (let k = 0; k < 4; k++) {
      let j;
      if (k === 0) j = index.get(key(s.m, s.n, s.l, c ^ 1));
      else {
        const d = LM[k - 1], sg = c < 2 ? 1 : -1;
        j = index.get(key(s.m + sg * d[0], s.n + sg * d[1], s.l + (c === 0 ? -1 : c === 3 ? 1 : 0), 3 - c));
      }
      if (j !== undefined) nbr[i * 4 + k] = j;
      don[i * 4 + k] = (c % 2 === 0) ? (k < 2 ? 1 : 0) : (k < 2 ? 0 : 1);       // an ordered ice to start from
    }
    if ((i & 255) === 0) await ctx.yield();
  }
  // shuffle the protons by flipping closed directed loops, so every ball keeps exactly two but no pattern survives
  const stamp = new Int32Array(N).fill(-1), walkI = new Int32Array(64), walkK = new Int32Array(64);
  for (let w = 0; w < N * 2; w++) {
    let i = (rng() * N) | 0, len = 0;
    for (; len < 64; len++) {
      if (stamp[i] >= w * 64) {
        for (let q = stamp[i] - w * 64; q < len; q++) { const a = walkI[q], k = walkK[q]; don[a * 4 + k] = 0; don[nbr[a * 4 + k] * 4 + k] = 1; }
        break;
      }
      stamp[i] = w * 64 + len;
      const k0 = (rng() * 4) | 0; let k = -1;
      for (let t = 0; t < 4; t++) { const kk = (k0 + t) & 3; if (don[i * 4 + kk] && nbr[i * 4 + kk] >= 0) { k = kk; break; } }
      if (k < 0) break;
      walkI[len] = i; walkK[len] = k; i = nbr[i * 4 + k];
    }
    if ((w & 63) === 0) await ctx.yield();
  }
  const pegs = spec.pegs ?? 0.5, third = BOND * HF, PEG = R_O + 1.25;
  for (let i = 0; i < N; i++) {
    const s = sites[i], dock = [s.T, s.seed, s.shade, s.glide];
    let code = 0;
    for (let k = 3; k >= 0; k--) {
      const D = BONDS[s.c * 4 + k], j = nbr[i * 4 + k]; let digit;
      const far = j < 0 && !!spec.sprung && spec.sprung(s, k);   // (MEND 13s) spec.sprung(site, bond): true for an open bond of this build that another build lays its spring across. This build's end of it is then finished as a sprung join's: the ivory ball's spring seat, or this ball's steel ferrule
      if (don[i * 4 + k]) {
        digit = 1;
        const o = j >= 0 ? sites[j] : null;
        const lane = (o && spec.lane && s.T <= -900 && o.T <= -900) ? spec.lane(s, o) : 0;
        batch.ball(s.x, s.y, s.z, D.x * third, D.y * third, D.z * third, R_H, dock, 1, s.c * 4 + k, (o || far) ? 2 + 4 : 4, 1 + lane);
        batch.link(s.x, s.y, s.z, D.x * third, D.y * third, D.z * third, 0, dock, 0, lane);
        if (o) batch.link(s.x, s.y, s.z, D.x * third, D.y * third, D.z * third, 1, dock, o.T, lane);
      } else if (j >= 0) {
        digit = 2;                                        // a spring will come: until then a brass peg waits for it
        if (sites[j].T > s.T + 0.01) batch.link(s.x, s.y, s.z, D.x * (PEG + 2.2), D.y * (PEG + 2.2), D.z * (PEG + 2.2), 0, [s.T, s.seed, 0, s.glide], 0, 0, sites[j].T, 1);   // a waiting peg stays bright in its dim slot, and draws back into its socket before the spring comes across
      } else if (far) {
        digit = 2; rng();                                 // (MEND 13s) the steel ferrule of a sprung ball. The draw that chose peg or socket for this open bond is still taken, so every later draw of the stream falls as it fell; nothing reads it here: a brass peg may not lie inside a steel spring, nor a bare socket face one
      } else if (rng() < pegs) {                          // (MEND 13s) (on a bond a later build's foot comes to stand on, what this draw chose is undone by sprungEnd below: the draw stays taken in its turn, and nothing is left that reads it)
        digit = 1;                                        // an unfilled peg: the stubble on every finished surface
        batch.link(s.x, s.y, s.z, D.x * PEG, D.y * PEG, D.z * PEG, 0, dock, 0, 0);
      } else digit = 3;                                   // or only its drilled socket
      code = code * 4 + digit;
    }
    batch.ball(s.x, s.y, s.z, 0, 0, 0, R_O, dock, 0, s.c, code, 0);
    if ((i & 127) === 0) await ctx.yield();
  }
  return { sites, count: N };
}
// (MEND 13s) The other end of such a bond, where it belongs to a build already laid and made into its two meshes
// (balls, links): the floor atom of the hero under a foot of the column. (x, y, z) is the centre of the vermilion ball
// the spring ends in, c its class, k the bond. Its molecule is finished as buildLattice finishes a sprung join: where
// it holds the bond's ivory ball, that ball takes its spring seat (code 2 + 4; its rod stays); where it does not, the
// vermilion ball's digit for the bond becomes 2 (the steel ferrule) and the brass peg its build may have laid on the
// bond is taken out of the links. What that build's draw chose for the open bond (peg or bare socket) is so read by
// nothing; the draw itself was taken in its turn. For the build only, before the meshes are first drawn.
function sprungEnd(balls, links, x, y, z, c, k) {
  const arr = (mesh, name) => mesh.geometry.attributes[name].array;
  const here = (a, i) => (a[i * 3] - x) ** 2 + (a[i * 3 + 1] - y) ** 2 + (a[i * 3 + 2] - z) ** 2 < R_O * R_O;   // an instance of the molecule whose vermilion ball the point lies in
  const S = arr(balls, 'aSite'), M = arr(balls, 'aMisc'), D = BONDS[c * 4 + k];
  let ball = -1, ivory = -1;
  for (let i = 0; i < balls.geometry.instanceCount; i++) if (here(S, i)) { if (M[i * 4 + 3] < 0.5) ball = i; else if (M[i * 4 + 1] === c * 4 + k) ivory = i; }
  if (ivory >= 0) { M[ivory * 4 + 2] = 2 + 4; return; }
  if (ball < 0) return;
  const p = 4 ** k; M[ball * 4 + 2] += (2 - Math.floor(M[ball * 4 + 2] / p) % 4) * p;
  const LS = arr(links, 'aSite'), LO = arr(links, 'aOff');
  for (let j = links.geometry.instanceCount - 1; j >= 0; j--) {
    if (!here(LS, j) || LO[j * 4 + 3] > 0.5 || LO[j * 4] * D.x + LO[j * 4 + 1] * D.y + LO[j * 4 + 2] * D.z <= 0) continue;   // a brass link of this molecule out along this bond: the peg (the molecule holds no rod there)
    for (const a of Object.values(links.geometry.attributes)) if (a.isInstancedBufferAttribute) a.array.copyWithin(j * a.itemSize, (j + 1) * a.itemSize);
    links.geometry.instanceCount--;
  }
}

// ---------------------------------------------------------------- ROUND 13: one column of the arm's own honeycomb, left standing
// WHAT  Whole cells of the ice lattice standing on the terrace floor close on the right of the course: one channel
// column wide (COLUMN_M: the second right of the axis), COLUMN_CELLS cells high from the floor's top layer (its top
// balls 74.8 m over the floor), COLUMN_DEEP ring planes deep. It is made by buildLattice with a site rule and a stream
// of its own ('slm-column') into the batch it is handed; it stands from the build (no dock, no clock) in the three
// materials, and its feet are sprung to the floor atoms under them.
// WHICH PLANES  A rule of the place, read at the build. Ring planes are counted back from the exit ring's own plane
// (C_LAT / 2 each). The column takes a first plane and the next COLUMN_DEEP - 1 further from the ring, on the FIRST
// entry of COLUMN_PLANES at which the three berths below hold on this visit; where none holds it is not built and
// nothing is laid in its stead. The berths read geometry only (the lattice, the loops, the course's line, the ring's
// place) and take no draw from any stream:
//   CLEAR_LOOSE   over the whole loop of its drift (looseAt) the centre of every loose molecule stays this far off;
//   CLEAR_COURSE  no surface of the column is nearer than this to the course's line, laid out every half metre;
//   CLEAR_RING    nothing of it lies within this of any straight line from a point of the course (beyond place.sightZ
//                 and short of that part of the column) to the ring's centre.
// "The column" in all three is every part buildLattice lays at the column's sites, where the batch holds it, whatever
// the column's stream deals: each site's vermilion ball; on each bond whose ivory ball the site holds, the rod, the
// ball and the spring on to the far site or floor atom; on a foot's bond held from the floor, the spring up; on every
// other open bond a rod's length, for the peg it may carry.
// COLUMN_PLANES is the order's list in the order's order, less 6 (the plane nearest the ring: the designer keeps it
// out). Each entry is proved by numbers on the visits that take it, by the designer's reading: read at every hundredth
// of its pass, the open air in its outline has a mean over half and is at no hundredth under 40 in 100. None failed.
const COLUMN_PLANES = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const COLUMN_M = -2, COLUMN_CELLS = 4, COLUMN_DEEP = 3;
const CLEAR_LOOSE = 6, CLEAR_COURSE = 14, CLEAR_RING = 12;
const LOOP_STEPS = 256;                      // chords a loop is followed by (the loop lies within a millimetre of them)
// which end of a bond holds its ivory ball: the ordered ice buildLattice starts every build from (a site of class c,
// its bond b). Its walk turns only closed directed loops, and that order has none, so this is what every build lays.
const holds = (c, b) => (c % 2 === 0) === (b < 2);
// the least distance between the segments a-b and p-q (either may be a single point)
function segGap(ax, ay, az, bx, by, bz, px, py, pz, qx, qy, qz) {
  const ux = bx - ax, uy = by - ay, uz = bz - az, vx = qx - px, vy = qy - py, vz = qz - pz, rx = ax - px, ry = ay - py, rz = az - pz;
  const a = ux * ux + uy * uy + uz * uz, e = vx * vx + vy * vy + vz * vz, f = vx * rx + vy * ry + vz * rz, c = ux * rx + uy * ry + uz * rz;
  let s = 0, t = 0;
  if (a > 1e-12 && e > 1e-12) {
    const b = ux * vx + uy * vy + uz * vz, den = a * e - b * b;
    if (den > 1e-12) s = Math.min(1, Math.max(0, (b * f - c * e) / den));
    t = (b * s + f) / e;
    if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); }
  } else if (a > 1e-12) s = Math.min(1, Math.max(0, -c / a));
  else if (e > 1e-12) t = Math.min(1, Math.max(0, f / e));
  return Math.hypot(rx + ux * s - vx * t, ry + uy * s - vy * t, rz + uz * s - vz * t);
}
// place (lattice space): course (the course's line every half metre: x, y, z, flat), ring (the exit ring's centre),
// floorY (the floor's top layer), sightZ (see CLEAR_RING), loose (the `loose` list of every batch that holds loose
// molecules), floor (the hero's sprung(): it finishes the floor's end of a foot's bond). style is the world's (its
// uGlide gives each loose molecule's loop its direction). Returns the first plane the column took, or 0 where it was
// not built.
export async function buildColumn(ctx, batch, style, place) {
  const third = BOND * HF, cz = place.course, ring = place.ring;
  // its axis, and the lowest channel of that column whose ring stands wholly over the floor's top layer
  const cx = COLUMN_M * DX, cy = COLUMN_M * LAYER + (Math.floor((place.floorY + LAYER - COLUMN_M * LAYER + 0.1) / A_LAT) + 1) * A_LAT;
  // ITS SHADE  The source's baked shade is a depth under the top of the level a site stands on (the hero's standing
  // sites: (top - y) / (2.1 LAYER), nothing above the top). Every site here stands in open air over the floor's top
  // layer, where that gives none: full pigment. No dark of its own.
  const site = (x, y) => {
    for (let i = 0; i < COLUMN_CELLS; i++) if (Math.abs(Math.hypot(x - cx, y - cy - i * A_LAT) - RING) < 0.6) return { shade: 0 };
    return null;
  };
  let minX = ring.x;                          // every line from the course (beyond sightZ) to the ring's centre lies at this x or left of it
  for (let i = 0; i < cz.length; i += 3) if (cz[i + 2] > place.sightZ && cz[i] < minX) minX = cz[i];
  const was = [0, 0, 0], at = [0, 0, 0];
  for (const k of COLUMN_PLANES) {
    const B = { x0: cx - RING - 1, x1: cx + RING + 1, y0: place.floorY + 0.5, y1: cy + (COLUMN_CELLS - 1) * A_LAT + LAYER + 0.5,
      z0: ring.z - (k + COLUMN_DEEP - 1) * C_LAT / 2 - 3, z1: ring.z - k * C_LAT / 2 + 3 };
    // the lattice points buildLattice walks in these bounds that the rule keeps, and the column's surfaces at them
    // (see "The column" above), each as a segment and a radius: x0, y0, z0, x1, y1, z1, r
    const P = [];
    for (let m = Math.floor((B.x0 - 2 * RING) / DX); m <= Math.ceil((B.x1 - RING) / DX); m++) for (let n = Math.floor((B.y0 - m * LAYER) / A_LAT); n <= Math.ceil((B.y1 - m * LAYER) / A_LAT); n++)
      for (let l = Math.floor(B.z0 / C_LAT) - 1; l <= Math.ceil(B.z1 / C_LAT); l++) for (let c = 0; c < 4; c++) {
        const x = RING + m * DX + (c > 1 ? RING : 0), y = m * LAYER + n * A_LAT, z = (l + ZC[c]) * C_LAT;
        if (x < B.x0 || x > B.x1 || y < B.y0 - 0.01 || y > B.y1 + 0.01 || z < B.z0 || z > B.z1 || !site(x, y)) continue;
        P.push(x, y, z, x, y, z, R_O);
        for (let b = 0; b < 4; b++) {
          const D = BONDS[c * 4 + b], hx = x + D.x * third, hy = y + D.y * third, hz = z + D.z * third, fx = x + D.x * BOND, fy = y + D.y * BOND, fz = z + D.z * BOND;
          const foot = fy < place.floorY + 0.1, joined = foot || (fx >= B.x0 && fx <= B.x1 && fy >= B.y0 && fy <= B.y1 && fz >= B.z0 && fz <= B.z1 && !!site(fx, fy));
          if (holds(c, b)) {
            P.push(x, y, z, hx, hy, hz, R_ROD, hx, hy, hz, hx, hy, hz, R_H);
            if (joined) P.push(hx, hy, hz, fx, fy, fz, R_COIL);
          } else if (foot) P.push(x, y, z, fx - D.x * third, fy - D.y * third, fz - D.z * third, R_COIL);
          else if (!joined) P.push(x, y, z, hx, hy, hz, R_ROD);
        }
      }
    await ctx.yield();
    // a ball that holds all of it: what lies `need` metres or more outside that ball is clear of every part
    const by = (B.y0 + B.y1) / 2, bz = (B.z0 + B.z1) / 2, br = Math.hypot(RING + 1, B.y1 - by, B.z1 - bz) + third + R_H;
    let ok = true;
    // CLEAR_COURSE
    for (let i = 0; ok && i < cz.length; i += 3) {
      if (Math.hypot(cz[i] - cx, cz[i + 1] - by, cz[i + 2] - bz) - br >= CLEAR_COURSE) continue;
      for (let j = 0; ok && j < P.length; j += 7) {
        if (cz[i] - Math.max(P[j], P[j + 3]) - P[j + 6] >= CLEAR_COURSE) continue;         // this point of the course lies that far left of the part
        ok = segGap(P[j], P[j + 1], P[j + 2], P[j + 3], P[j + 4], P[j + 5], cz[i], cz[i + 1], cz[i + 2], cz[i], cz[i + 1], cz[i + 2]) - P[j + 6] >= CLEAR_COURSE;
      }
    }
    // CLEAR_RING
    for (let i = 0; ok && i < cz.length; i += 3) {
      if (cz[i + 2] <= place.sightZ) continue;
      for (let j = 0; ok && j < P.length; j += 7) {
        if (Math.max(P[j + 2], P[j + 5]) <= cz[i + 2]) continue;                          // this part is not ahead of this point of the course
        if (Math.max(P[j], P[j + 3]) + P[j + 6] + CLEAR_RING < minX) continue;              // too far right of every such line to matter
        ok = segGap(P[j], P[j + 1], P[j + 2], P[j + 3], P[j + 4], P[j + 5], cz[i], cz[i + 1], cz[i + 2], ring.x, ring.y, ring.z) - P[j + 6] >= CLEAR_RING;
      }
    }
    await ctx.yield();
    // CLEAR_LOOSE
    for (const L of place.loose) for (let i = 0; ok && i < L.length; i += 6) {
      const R = L[i + 4], G = style.uniforms.uGlide.value[Math.round(Math.min(7, Math.max(0, L[i + 5])))], reach = CLEAR_LOOSE + LOOP_REACH * R;
      if (Math.hypot(L[i] - cx, L[i + 1] - by, L[i + 2] - bz) - br >= reach) continue;
      // the parts its loop can come near at all (the whole loop lies in a ball of LOOP_REACH loop radii round its site)
      const N = [];
      for (let j = 0; j < P.length; j += 7) if (segGap(P[j], P[j + 1], P[j + 2], P[j + 3], P[j + 4], P[j + 5], L[i], L[i + 1], L[i + 2], L[i], L[i + 1], L[i + 2]) - P[j + 6] < reach) N.push(j);
      if (!N.length) continue;
      looseAt(L[i], L[i + 1], L[i + 2], L[i + 3], R, G, 0, was);
      for (let q = 1; ok && q <= LOOP_STEPS; q++) {
        looseAt(L[i], L[i + 1], L[i + 2], L[i + 3], R, G, q / LOOP_STEPS * 2 * Math.PI, at);
        for (const j of N) if (segGap(P[j], P[j + 1], P[j + 2], P[j + 3], P[j + 4], P[j + 5], was[0], was[1], was[2], at[0], at[1], at[2]) - P[j + 6] < CLEAR_LOOSE) ok = false;
        was[0] = at[0]; was[1] = at[1]; was[2] = at[2];
      }
      await ctx.yield();
    }
    if (!ok) continue;
    // built: the part's own lattice, a stream of its own
    const isFoot = (s, b) => s.y + BONDS[s.c * 4 + b].y * BOND <= place.floorY + 0.1;
    const lat = await buildLattice(ctx, batch, { rng: ctx.core.makeRng(ctx.core.hashSeed('slm-column:' + ctx.seed)), pegs: 0.5, bounds: B, site, sprung: isFoot });
    // ITS FEET  Each lowest site's bond down ends on a floor atom of the hero's build. Both balls of that bond are
    // finished as a sprung join's inside one lattice: the holder of its ivory ball draws that ball with its spring
    // seat and its rod; the other end carries the steel ferrule, no peg, no bare socket. The column's end is laid so
    // by its own build (sprung: isFoot); the floor's, already laid, is set so by place.floor. The steel spring across
    // is laid here, once, from the holder (a floor atom of the top layer stands from the build in full pigment: its dock).
    for (const s of lat.sites) for (let b = 1; b < 4; b++) {
      const D = BONDS[s.c * 4 + b];
      if (!isFoot(s, b)) continue;
      if (holds(s.c, b)) batch.link(s.x, s.y, s.z, D.x * third, D.y * third, D.z * third, 1, [s.T, s.seed, s.shade, s.glide], -1000, 0);
      else batch.link(s.x + D.x * BOND, s.y + D.y * BOND, s.z + D.z * BOND, -D.x * third, -D.y * third, -D.z * third, 1, [-1000, 0, 0, 0], s.T, 0);
      place.floor(s.x + D.x * BOND, s.y + D.y * BOND, s.z + D.z * BOND, 3 - s.c, b);
    }
    return k;
  }
  return 0;
}

// ---------------------------------------------------------------- the hero: the growing face (the terrace arm)
const ZIP_V = 16;                       // m of zip per second of zip clock
const RING_T = 22;                      // the zip clock at which the upright ring's sixth ball seats (the first step's row is done by 17.3)
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const style = opts.style || makeStyle(opts.palette || PALETTE);
  const U = style.uniforms;
  const group = new THREE.Group(); group.name = 'snow-lattice-model:hero';
  // ---- the plan of the arm (local space = lattice space; +Z is the course)
  const RING_L = 5, ringZ = (RING_L + 0.5) * C_LAT;            // the upright ring: z 149.3, centre (0, 16.63)
  const ringC = new THREE.Vector3(0, 2 * LAYER, ringZ);
  const ZT = ringZ + 11, ZR = ZT - 350, HW = 150;              // tip, root, half width
  const ZB = ZR + 150;                                         // the corners where the side branches leave
  const ZK = ZB + 15;                                          // where the row on the first step turns 60 degrees: the fork we watch
  const S = [-14, -84 + rng.range(-5, 5), -136 + rng.range(-5, 5)];   // the three growth steps
  const LB = [rng.range(112, 140), rng.range(112, 140)];       // branch lengths: left, right
  const DEEP = 4 + (detail > 0.7 ? 1 : 0);                     // real layers under the lowest terrace
  const WELL = 3;
  const rowV = [ZIP_V, rng.range(6.6, 7.6), rng.range(5.2, 6.2)], rowT0 = [0, -rng.range(8.6, 10), -rng.range(2, 5)];   // the upper rows run slowly: seen ahead at the burst, behind us by the fork
  const inBranch = (x, z, side) => {            // side +1: the left flank (+X is the viewer's left looking down +Z)
    const dx = (x - side * HW) * side, dz = z - ZB;
    const u = dx * 0.866 + dz * 0.5, v = -dx * 0.5 + dz * 0.866;
    return u >= -20 && Math.abs(v) <= 27 && u <= LB[side > 0 ? 0 : 1] - Math.abs(v) * 0.577;
  };
  const inArm = (x, z) => (z >= ZR && z <= ZT && Math.abs(x) <= Math.min(HW, (ZT - z) * 1.732)) || inBranch(x, z, 1) || inBranch(x, z, -1);
  // NOTE on handedness: looking down +Z, the viewer's left is +X. The brief's "x -14" is its own left, so the
  // steps are mirrored here: everything "left" in this file sits at positive x.
  const STEP = 2 * LAYER;                     // a growth step: one bilayer
  // THE SCREW (opts.rare): no parallel steps; the terrace left of the course is one ramp wound about a flaw at
  // (FX, FZ). Its edge is a hexagonal spiral (sides along the crystal's own directions, stepping out a sixth of the
  // spacing SL at every corner), so crossing it toward the flaw climbs a bilayer per turn; six kinks, one on each
  // side, circle it at one angular rate and lay a row during the pass without ever closing a layer: a stepped hill, four turns high.
  const rare = !!opts.rare, FX = 118, FZ = ZR + 125, SL = 34, SC = 3.5, SW = DX, ST0 = 1.5, STS = 22, EL = 66, KL = [0, 34, 62], XR = [FX - 16, FX - 16 - 2 * DX, FX - 16 - 3 * DX];   // (FIX 7: XR: how far from the flaw each turn's edge stands. The edges sit on the lattice's own columns, two columns and then one apart, so that each face shows its top line in front and, from low beside the hill, the three faces stack one above the other)   // (EL: the spiral is drawn out along the course, as a screw's hill is where steps run fastest one way: its sides that face the course are 140 m and more long)
  const screw = (x, z, e) => {
    const px = x - FX, pz0 = z - FZ, pz = Math.sign(pz0) * Math.max(0, Math.abs(pz0) - EL), sx = ((Math.round(Math.atan2(pz, px) / 1.0472) % 6) + 6) % 6;
    const rh = Math.max(Math.abs(px), Math.abs(px * 0.5 + pz * 0.866), Math.abs(px * 0.5 - pz * 0.866));
    const an = sx * 1.0472, along = -px * Math.sin(an) + pz * Math.cos(an);
    const rr = rh + e, rw = rr <= XR[2] ? rr * SL / XR[2] : rr <= XR[1] ? SL + (rr - XR[2]) * SL / (XR[1] - XR[2]) : rr <= XR[0] ? 2 * SL + (rr - XR[1]) * SL / (XR[0] - XR[1]) : 3 * SL + rr - XR[0];
    return { lv: Math.min(3, Math.max(0, Math.floor(SC - rw / SL + sx / 6))), sx, frac: Math.min(1, Math.max(0, 0.5 + along / Math.max(1.155 * rh, 1))) };
  };
  const lvl = (x, e, z = -1e9) => {
    const xl = -x; if (z > ZT - 65 - 0.577 * x) return 0;
    if (rare && z > -1e8) return x < -S[0] ? 0 : screw(x, z, e).lv;
    return xl > S[0] - e ? 0 : xl > S[1] - e ? 1 : xl > S[2] - e ? 2 : 3;
  };
  // the second kink: a row that leaves the first step at the corners, 60 degrees to the left. It starts UB0 metres
  // out from the first row (a gap of sky parts the two walls) and runs at VB m/s
  const UB0 = 20, UB1 = 128, VB = 18.5, TB0 = (ZK - ZR) / ZIP_V - 4.5;
  const rowB = (x, z) => {
    const dx = x - (-S[0] + DX), dz = z - ZK;
    const u = dx * 0.866 + dz * 0.5, v = -dx * 0.5 + dz * 0.866;
    return (u > UB0 && u < UB1 && v >= -2 * DX && v < DX) ? u - UB0 : -1;   // three columns thick: a band of six-rings standing on the step, its top line closed in projection
  };
  const sprigs = [];
  const nSp = Math.round(rng.range(15, 22) * detail);
  for (let i = 0; i < nSp; i++) {
    const side = i % 2 ? 1 : -1, onBranch = i >= nSp - 4;
    let x0, z0;
    if (onBranch) { const L = LB[side > 0 ? 0 : 1] * rng.range(0.55, 0.95); x0 = side * (HW + L * 0.866); z0 = ZB + L * 0.5; }
    else { z0 = rng.range(ZR + 20, ZT - 110); x0 = side * HW; if (Math.abs(z0 - ZB) < 45) z0 += 90; }
    const fwd = rng.chance(0.7) ? 1 : -1;
    sprigs.push({ x0, z0, dx: side * 0.866 * (onBranch ? -0.2 : 1), dz: onBranch ? 0.98 : 0.5 * fwd, len: rng.range(45, 95), built: rng.range(8, 30), t0: rng.range(-6, 4), v: rng.range(2.0, 3.2), g: side > 0 ? 5 : 6, hw: rng.range(7, 10) });
  }
  // and along the two brinks of the point, where the last frames look: branchlets at 60 degrees to the brink they
  // leave (straight on, or outward), each with its own slow zip working during the run-in to the ring
  for (const side of [1, -1]) for (let i = 0; i < 5; i++) {
    const z0 = ZT - 80 + i * 14.5 + (side > 0 ? 0 : 6), x0 = side * (ZT - z0) * 1.732, out = (i + (side > 0 ? 0 : 1)) % 2 === 1;
    const len = 46 + ((i * 7 + (side > 0 ? 3 : 0)) % 4) * 9;
    sprigs.push({ x0, z0, dx: out ? side * 0.866 : 0, dz: out ? 0.5 : 1, len, built: len * (0.3 + 0.07 * ((i * 3 + (side > 0 ? 1 : 0)) % 4)), t0: 12.5 + i * 1.1 + (side > 0 ? 0 : 0.6), v: 2.6 + 0.2 * (i % 3), g: side > 0 ? 5 : 6, hw: 11 + (i % 2) * 2.5, tip: true });
  }
  const sprigAt = (x, z) => {
    for (const sp of sprigs) {
      const ax = x - sp.x0, az = z - sp.z0, u = ax * sp.dx + az * sp.dz, v = Math.abs(-ax * sp.dz + az * sp.dx);
      if (u > -4 && u < sp.len && v < sp.hw * (1 - 0.5 * u / sp.len)) return { sp, u };
    }
    return null;
  };
  const flyB = new Set();
  const zEven = (z, c) => (Math.round(z / C_LAT - ZC[c]) + (c + 0.5) / 4) * C_LAT;
  const site = (x, y, z, c) => {
    // the ring
    const rx = x - ringC.x, ry = y - ringC.y;
    if (Math.abs(z - ringZ) < 3 && Math.abs(Math.hypot(rx, ry) - RING) < 0.6) return (ry > 1 && rx > 0) ? { T: RING_T, glide: 7, shade: 12 } : { shade: 12 };   // (depth code 12: the ring keeps its full pigment at any distance)
    if (inArm(x, z)) {
      const a = lvl(x, 0, z), b = lvl(x, rare && a !== 1 ? DX : 2 * DX, z), top = a * STEP;   // (a row is laid four columns wide: seen from above it is a band)   // (the screw: every turn's whole tread is laid in full pigment, the risers between turns stand back in plum, so from above the edge runs round and round)
      if (y < -(DEEP + (Math.abs(x) < 52 ? WELL : 0)) * LAYER - 0.1) return null;   // the wells under the course go deeper
      const ub = rare ? -1 : rowB(x, z);
      if (rare && y > b * STEP + 0.1) {
        if (y > top + 0.1 || Math.abs(x) >= HW) return null;
        // the band the six kinks lay, each side zipped from its corner on
        // (on the side that faces the course the three lower turns are each fed by one file of spaced molecules; every
        // other molecule only shows as it comes in to its place)
        const sc = screw(x, z, 0), g = a >= 1 && a <= 3 ? a : 3;
        // (that side is zipped toward us from its far corner: most of each turn's edge already stands as a line, its kink some 45 m ahead)
        // (the side that faces the course is laid away from us from its near corner, its three kinks abreast one above the other, each working the whole of our pass: u 0.58 to 0.75)
        // FIX 6: the side that faces the course is seen in profile from beside it, as the zip is: each turn's edge is one band of
        // fresh row two balls high and two columns deep, laid away from us along the course by its own kink (the nearest runs
        // 27 m ahead of the eye, the next two 34 and 62 m further on), the front top line of each coming down its own file
        if (sc.sx === 3 && a >= 1) {
          const xe = FX - XR[a - 1], k0 = KL[a - 1];
          // FIX 7: seen from low beside the hill the three faces are three steps of one stair: the nearest a band of fresh row two balls
          // high and four columns deep; on the two above, the kink lays the top line on a riser that already stands in shade
          if (a >= 2 && y < top - 0.1) return { shade: 6.7 };
          if (y > top - 0.1 && x < xe + 0.75 * DX) return { T: ((Math.round(z / C_LAT - ZC[c]) + (c === 2 ? 0.5 : 1)) * C_LAT - ZR - k0) / ZIP_V, glide: a };
          return { T: (z - 6 - ZR - k0) / ZIP_V, glide: a + 0.25 };
        }
        return { T: ST0 + 40 * (sc.frac - 0.82) - 0.2, glide: g + 0.25 };   // the other sides: each zipped from its corner on, most of it standing
      }
      if (y <= b * STEP + 0.1) {
        // the shelf a row is about to cover (its floor and the wall behind it) sits a little in shade: the new row is fresh
        // (its floor, and the whole riser behind it up to the top line: once the row stands in front they are inside the model)
        if (b >= 1) return { shade: 6 + Math.min(1, Math.max(0, (b * STEP - y) / (2.1 * LAYER))) };   // every tier behind a growing row stands back a tone (depth code 6)
        const notch = a !== b ? 0.86 : (!rare && x > -S[0] - 10 && z < ZT - 90 ? 0.62 : 0);   // (and the floor at the step's foot: the fresh row stands between two darks, a band from above)
        if (y < -0.1) return { shade: y > -LAYER - 0.1 ? 10.42 : 10.72 };   // under the floor's top layer every well is a dim nave going down: plum, never a pale mat
        return { shade: Math.min(0.92, Math.max(notch * (y > (b - 1) * STEP - 0.1 ? 1 : 0), (b * STEP - y) / (2.1 * LAYER))) };
      }
      if (y <= top + 0.1 && Math.abs(x) < HW) {
        if (a > 1) return { T: rowT0[a - 1] + (zEven(z, c) - ZR) / rowV[a - 1], glide: a, shade: 6.2 };   // the upper steps' slow rows stand back with their tiers: wood in shade
        if (y > top - 0.1 && x < -S[0] + DX) return { T: ((Math.round(z / C_LAT - ZC[c]) + (c === 2 ? 0.5 : 1)) * C_LAT - ZR) / ZIP_V, glide: 1 };   // the front top line flies down the file
        return { T: (z - 6 - ZR) / ZIP_V, glide: 1.25 };
      }
      if (ub >= 0 && y <= top + STEP + 0.1 && a >= 1 && a <= 2) {
        const tb = TB0 + ub / VB;            // the branch row starts a moment before the first kink passes the corner
        if (y > top + STEP - 0.1) {                                // one ball of its top line in every ten metres flies down the file, evenly spaced
          const bin = Math.floor(ub / 10);
          if (!flyB.has(bin)) { flyB.add(bin); return { T: TB0 + (bin + 0.5) * 10 / VB, glide: 4 }; }
          return { T: tb - 0.15, glide: 4.25 };
        }
        return { T: tb - 0.3, glide: 4.25 };
      }   // the branch row starts a moment before the first kink passes the corner
      return null;
    }
    const s = sprigAt(x, z);
    if (s) {
      const top = s.sp.tip ? 0 : lvl(x, 0, z) * STEP;
      if (y > top + 0.1 || y < top - LAYER - 0.1) return null;
      return s.u < s.sp.built ? { shade: 0 } : { T: s.sp.t0 + (s.u - s.sp.built) / s.sp.v + rng.range(-0.3, 0.3), glide: s.sp.g };
    }
    return null;
  };
  const lane = (a, b) => (Math.abs(a.y) < 0.1 && Math.abs(b.y) < 0.1 && a.m === b.m && a.n === b.n) ? (a.m === -2 ? 1 : a.m === -6 ? 2 : 0) : 0;
  const batch = makeBatch();
  await ctx.yield();
  const lat = await buildLattice(ctx, batch, {
    bounds: { x0: -HW - 150, x1: HW + 150, y0: -(DEEP + WELL) * LAYER, y1: 8 * LAYER, z0: ZR - 30, z1: ZT + 60 },
    site, lane, pegs: 0.55 * detail,
  });
  await ctx.yield();
  // FIX 7: the point's last branchlet. It leaves the left brink beside the ring's foot at 60 degrees, one layer up on the
  // floor's own top layer, and its zip is timed to the run-in: at the ring's moment (clock 22) its kink is 13 m out
  // from the brink, 2.5 s later 20 m, a molecule about every two seconds down glide path 5. (A piece of its own with its own
  // fixed sequence of numbers: the shared rng is not drawn from, so nothing else in any edition moves.)
  {
    let ps = 0x9e3779b9; const prng = () => { ps = (Math.imul(ps, 1664525) + 1013904223) >>> 0; return ps / 4294967296; };
    // (and its twin from the right brink, a second behind it, down glide path 6: the run-in has a dock on either side of the ring)
    for (const LS of [{ x0: 9, z0: ringZ - 0.8, dx: 0.866, dz: 0.5, len: 50, built: 12, t0: 19.1, v: 2.6, hw: 12.5, g: 5 }, { x0: -9, z0: ringZ - 0.8, dx: -0.866, dz: 0.5, len: 50, built: 10, t0: 19.9, v: 2.4, hw: 12.5, g: 6 }])
    await buildLattice(ctx, batch, { rng: prng, pegs: 0.5,
      bounds: { x0: LS.dx > 0 ? 4 : -70, x1: LS.dx > 0 ? 70 : -4, y0: -0.5, y1: LAYER + 0.5, z0: ringZ - 10, z1: ringZ + 42 },
      site(x, y, z) {
        const ax = x - LS.x0, az = z - LS.z0, u = ax * LS.dx + az * LS.dz, v = Math.abs(-ax * LS.dz + az * LS.dx);
        if (u < 0 || u > LS.len || v > LS.hw * (1 - 0.4 * u / LS.len) || inArm(x, z)) return null;
        if (y < 0.1 && sprigAt(x, z)) return null;                 // (where an older sprig lies under it, it is that sprig's next layer)
        const h = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
        return u < LS.built ? { shade: 0 } : { T: LS.t0 + (u - LS.built) / LS.v + (h - 0.5) * 0.4, glide: LS.g };
      } });
    await ctx.yield();
  }
  // ---- ROUND 12, II: branchlets in the hollow by the point, and sprigs up to the brief's forty. Lattices of their own
  // in the same batch, each with a stream of its own made from the world's seed and a name (the world's stream is not
  // drawn from, and no site is added to the hero's own rule). Live's count is its array's length and its two foot
  // branchlets. Up to forty in all: first six on the point's two brinks, between live's ten (live's rule of the point
  // moved half a pitch: 60 degrees outward and forward, 50 m long, 20 m wide at the root), then two growing straight on
  // from live's two foot branchlets, beyond the ring (40 m long, 18 m wide at the root), then so many on the two long
  // brinks as bring the count to forty. Where forty would be passed the two beyond the ring are left out first, then
  // the outermost pair on the point. None has a site inside the arm, where a live sprig lies, or inside the footprints
  // of live's two foot branchlets, and every one is one layer on the floor's level, as live's own on the point: none
  // stands higher. Each one's first quarter stands from build; the rest is laid on the zip clock as live's foot
  // branchlets are, from the clock at which the terrace's zip comes level with its root.
  {
    const own = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    const room = Math.max(0, 40 - (sprigs.length + 2));
    const beyond = room >= 8, pairs = Math.min(3, Math.floor(room / 2));
    const fillN = Math.round(Math.max(0, Math.min(8, room - 2 * pairs - (beyond ? 2 : 0))) * detail);
    const more = [], fill = [];
    for (const side of [1, -1]) for (let k = 3 - pairs; k < 3; k++) {
      const z0 = ZT - 72.75 + k * 14.5 + (side > 0 ? 0 : 6), x0 = side * (ZT - z0) * 1.732;
      more.push({ x0, z0, dx: side * 0.866, dz: 0.5, len: 50, built: 12.5, t0: (z0 - ZR) / ZIP_V, v: 2.6, hw: 10, g: side > 0 ? 5 : 6 });
    }
    if (beyond) for (const side of [1, -1]) {
      const z0 = ringZ - 0.8 + 12.5;
      more.push({ x0: side * (9 + 25 * 0.866), z0, dx: 0, dz: 1, len: 40, built: 10, t0: (z0 - ZR) / ZIP_V, v: 2.6, hw: 9, g: side > 0 ? 5 : 6 });
    }
    if (fillN > 0) {
      const srng = own('slm-sprigs');
      for (let i = 0; i < fillN; i++) {
        const side = i % 2 ? 1 : -1;
        let z0 = ZR + 40 + ((i >> 1) + srng()) * (ZT - 130 - ZR) / 4;
        if (Math.abs(z0 - ZB) < 45) z0 += 80;
        const dz = srng() < 0.7 ? 0.5 : -0.5, len = 44 + srng() * 40, hw = 7 + srng() * 3;
        fill.push({ x0: side * HW, z0, dx: side * 0.866, dz, len, built: len / 4, t0: (z0 - ZR) / ZIP_V, v: 2.6, hw, g: side > 0 ? 5 : 6 });
      }
    }
    // the footprints of live's two foot branchlets (their own numbers, read only)
    const inFoot = (x, z) => {
      for (const sg of [1, -1]) {
        const ax = x - sg * 9, az = z - (ringZ - 0.8), u = ax * sg * 0.866 + az * 0.5, v = Math.abs(-ax * 0.5 + az * sg * 0.866);
        if (u >= 0 && u <= 50 && v <= 12.5 * (1 - 0.4 * u / 50)) return true;
      }
      return false;
    };
    const lying = (list, x, z) => {
      for (const sp of list) {
        const ax = x - sp.x0, az = z - sp.z0, u = ax * sp.dx + az * sp.dz, v = Math.abs(-ax * sp.dz + az * sp.dx);
        if (u > -4 && u <= sp.len && v <= sp.hw * (1 - 0.5 * u / sp.len)) return { sp, u };
      }
      return null;
    };
    const siteOf = (list, others) => (x, y, z) => {
      if (inArm(x, z) || sprigAt(x, z) || inFoot(x, z) || (others && lying(others, x, z))) return null;
      const s = lying(list, x, z);
      if (!s) return null;
      if (y > 0.1 || y < -LAYER - 0.1) return null;
      const h = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
      return s.u < s.sp.built ? { shade: 0 } : { T: s.sp.t0 + (s.u - s.sp.built) / s.sp.v + (h - 0.5) * 0.4, glide: s.sp.g };
    };
    if (more.length) await buildLattice(ctx, batch, { rng: own('slm-point'), pegs: 0.5,
      bounds: { x0: -HW - 40, x1: HW + 40, y0: -LAYER - 0.5, y1: 0.5, z0: ZT - 90, z1: ZT + 60 }, site: siteOf(more, null) });
    await ctx.yield();
    if (fill.length) await buildLattice(ctx, batch, { rng: own('slm-sprigs-b'), pegs: 0.5,
      bounds: { x0: -HW - 110, x1: HW + 110, y0: -LAYER - 0.5, y1: 0.5, z0: ZR - 50, z1: ZT + 50 }, site: siteOf(fill, more) });
    await ctx.yield();
  }
  // ---- glide paths (unit vectors pointing back up each file of incoming molecules)
  const steep = rng.range(0.42, 0.6);                          // how steeply the first file comes down, per seed
  const GL = [[0.2, 0.1, 0.97], [-0.30, 0.82 + (steep - 0.42) * 0.4, 0.24], [0.5, 0.55, 0.67], [0.55, 0.6, 0.58], [0.8, 0.55, 0.1], [0.5, 0.62, 0.6], [-0.5, 0.62, 0.6], [0.0575, 0.0194, -0.998]];   // (the ring's last molecule comes up the course from behind us, a little left and above: it flies ahead of the eye to its place)
  GL.forEach((g, i) => U.uGlide.value[i].set(g[0], g[1], g[2]).normalize());
  // single files: each zip row's own axis (the three steps, and the branch row leaving the corner at 60 degrees)
  for (let a = 1; a <= 3; a++) { U.uFileP.value[a].set(-S[a - 1] + DX * 0.5, (a - 1) * STEP + STEP * 0.7, 0, 1); U.uFileD.value[a].set(0, 0, 1); }
  U.uFileP.value[1].set(2 * RING, STEP, 0, 1);                 // the first step's file comes down onto the top front line of its row
  if (rare) {                                                  // the screw's files come down each onto its own side of the spiral
    [[-0.45, 0.6, 0.66], [-0.34, 0.7, 0.63], [-0.2, 0.78, 0.59]].forEach((g, i) => {     // fanned: the lowest turn's file comes in over the course out of the open sky on the right, the next stands steep over the hill, the top one leans in from the left
      U.uGlide.value[i + 1].set(g[0], g[1], g[2]).normalize();
      U.uFileP.value[i + 1].set(Math.max(-S[0], FX - XR[i]) + DX * 0.5, (i + 1) * STEP, 0, 1); U.uFileD.value[i + 1].set(0, 0, 1);   // turn i + 1, the side that runs along the course
    });
  }
  U.uFileP.value[4].set(-S[0] + DX, 2 * STEP, ZK, 1); U.uFileD.value[4].set(0.866, 0, 0.5);
  [GLIDE_T, GLIDE_T, GLIDE_T, GLIDE_T, 6.4, GLIDE_T, GLIDE_T, 13].forEach((v, i) => { U.uShow.value[i] = rare && i >= 1 && i <= 3 ? [GLIDE_T, 5.6, 5][i - 1] : v; });   // the branch's file forms up only as the fork nears; the ring's last molecule comes alone
  for (const i of [0, 5, 6, 7]) U.uFileP.value[i].set(0, 0, 0, 0);
  U.uRelay.value.set(ZR, 45, 5, 0.35);
  U.uTierX.value = rare ? 1e6 : -S[0] + 2 * DX;
  // ---- vapour: loose molecules in skeins streaming in over the left brink toward the growing edges
  const nVap = Math.round(110 * detail);
  for (let i = 0; i < nVap; i++) {
    const sk = i % 3, s = rng(), spread = rng.gauss() * 9;
    const x = Math.max(134, 142 + sk * 22 + s * 40 + spread) + (rare ? 85 : 0), y = 68 + sk * 12 + s * 26 + rng.gauss() * 6, z = ZR + 20 + s * 150 + sk * 20 + rng.gauss() * 10;   // behind the fork, out of the pockets of sky the files come down
    batch.vapour(x, y, z, rng() * 97, rng.range(3, 6.5), 0);
    if ((i & 63) === 0) await ctx.yield();
  }
  // ---- guests: blue dumbbells caught in the open cages of the floor, under and beside the course
  batch.guest(-2 * DX, -2.5, ZR + 96, rng() * 97, 3);
  batch.guest(-3 * DX, -LAYER - 2.5, ZR + 96 + 3.5 * C_LAT, rng() * 97, 3);
  batch.guest(DX * (rare ? 2 : 4), (rare ? 0 : STEP) - 2.5, ZR + 60, rng() * 97, 2.5);   // in the well at the first step's top line: caged, never against sky
  await ctx.yield();
  const { balls, links } = await batch.build(style, ctx);
  group.add(balls, links);
  await ctx.yield();
  // ---- what lies under the real layers: a floor of wells in rose, and skirts falling away into the haze
  {
    const pos = [], nor = [], fade = [];
    const yT = -(DEEP + WELL) * LAYER - 5, yB = yT - (opts.skirt ?? 420);
    const v = (x, y, z, nx, ny, nz, f) => { pos.push(x, y, z); nor.push(nx, ny, nz); fade.push(f); };
    const poly = (pts, skip) => {
      for (let i = 1; i < pts.length - 1; i++) for (const q of [pts[0], pts[i], pts[i + 1]]) v(q[0], yT, q[1], 0, 1, 0, 0.3);
      for (let i = 0; i < pts.length; i++) {
        if (i === skip) continue;
        const a = pts[i], b = pts[(i + 1) % pts.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1, nx = dz / l, nz = -dx / l;
        v(a[0], yT, a[1], nx, 0, nz, 0.3); v(b[0], yT, b[1], nx, 0, nz, 0.3); v(b[0], yB, b[1], nx, 0, nz, 1);
        v(a[0], yT, a[1], nx, 0, nz, 0.3); v(b[0], yB, b[1], nx, 0, nz, 1); v(a[0], yB, a[1], nx, 0, nz, 1);
      }
    };
    const zs = ZT - HW / 1.732;
    poly([[-HW, ZR], [HW, ZR], [HW, zs], [0, ZT], [-HW, zs]], opts.rootWall ? -1 : 0);
    for (const side of [1, -1]) {
      const L = LB[side > 0 ? 0 : 1], P = (u, w) => [side * HW + side * (u * 0.866 - w * 0.5), ZB + u * 0.5 + w * 0.866];
      poly([P(-20, -27), P(L - 15.6, -27), P(L, 0), P(L - 15.6, 27), P(-20, 27)], 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('aFade', new THREE.Float32BufferAttribute(fade, 1));
    const under = new THREE.Mesh(g, backingMaterial(style)); under.frustumCulled = false; under.name = 'under';
    group.add(under);
  }
  await ctx.yield();
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    place: V3(0, -3 * LAYER, 850 - ringZ),               // where hero.object goes in the brief's world coordinates
    portalSeat: { position: ringC.clone(), facing: V3(0, 0, -1), radius: 7 },
    flyThrough: [V3(0, 25, ZR - 20), V3(0, 25, ZR + 20), V3(0, 21, ZR + 110), V3(0, 17.4, ZR + 200), V3(0, ringC.y, ringZ - 70), ringC.clone()],
    viewpoints: { burst: V3(0, 25, ZR), pace: V3(0, 20, ZR + 100), fork: V3(0, 18, ZB - 30), ring: V3(0, ringC.y, ringZ - 70) },
    rootZ: ZR, tipZ: ZT, forkZ: ZK, branchZ: ZB, halfWidth: HW, floorY: 0, bottomY: -(DEEP + WELL) * LAYER, stepHeight: STEP,
    stepX: [-S[0], -S[1], -S[2]],                          // x of the three steps (+x is the viewer's left)
    branchLength: { left: LB[0], right: LB[1] },
    zipSpeed: ZIP_V, forkClock: (ZK - ZR) / ZIP_V, ringClock: RING_T, loopSeconds: 44,
    // where the first kink is at a given zip clock, and the clock that keeps it `lead` metres ahead of a camera at z
    kink: (clock, out = new THREE.Vector3()) => rare
      ? out.set(FX - XR[0] + DX * 0.5, STEP, Math.min(Math.max(ZR + ZIP_V * clock, FZ - EL - 30), FZ + EL + 30))
      : out.set(-S[0] + DX * 0.5, STEP, Math.min(ZR + ZIP_V * clock, ZT - 80)),
    kinkB: (clock, out = new THREE.Vector3()) => { if (rare) return out.set(FX - XR[1] + DX * 0.5, 2 * STEP, Math.min(Math.max(ZR + ZIP_V * clock + KL[1], FZ - EL - 20), FZ + EL + 20)); const u = UB0 + Math.min(UB1 - UB0, Math.max(0, VB * (clock - TB0))); return out.set(-S[0] + DX + u * 0.866, 2 * STEP, ZK + u * 0.5); },
    clockForCameraZ: (z, lead = 45) => (z + lead - ZR) / ZIP_V,
    flaw: rare ? V3(FX - 6, 1.2 * STEP, FZ) : null, flawB: rare ? V3(FX + 1, 1.15 * STEP, FZ + 36) : null,   // the hill's centre; and a point between it and the ring, where the gaze goes as we pass
    relayLaneX: [-2 * RING, -RING], counts: { oxygens: lat.count, balls: batch.balls, links: batch.links },
  };
  let extClock = null;
  const size = new THREE.Vector2();
  const hero = {
    object: group, radius: 16, height: 10, center: new THREE.Vector3(0, 21, 10),
    ground: false, groundY: -(DEEP + WELL) * LAYER,
    style,
    anchors,
    loose: batch.loose,                        // (ROUND 13) the hero's own loose molecules, for a build that must stand clear of their loops
    sprung(x, y, z, c, k) { sprungEnd(balls, links, x, y, z, c, k); anchors.counts.links = links.geometry.instanceCount; },   // (MEND 13s) a later build has laid its spring to the hero's vermilion ball at (x, y, z), class c, on bond k: see sprungEnd
    setClock(s) { extClock = s; },
    paceCamera(z, lead = 45) { extClock = (z + lead - ZR) / ZIP_V; },
    setProgress(u) { extClock = u * 24; },
    update(dt, time, camera) {
      U.uTime.value = time;
      U.uClock.value = extClock !== null ? extClock : (time % 44);
      U.uRT.value = time; U.uBarK.value.y = time * 2.5;          // (a world that keys these to u sets them after this call)
      if (ctx.renderer) U.uPxH.value = ctx.renderer.getDrawingBufferSize(size).y * 0.5;
    },
    dispose() {},
  };
  return hero;
}

// ---------------------------------------------------------------- (3) backing: the lattice too deep or too far to build
// Any flat face (a liner, a far arm, the floor under the real layers) drawn as the honeycomb of shafts it stands for,
// in the plane its normal picks, filtered to the row's flat average under about 4 pixels. Needs `normal` and a
// float attribute aFade (0 = near and full, 1 = dissolved into the rose haze).
const BACK_VERT = /* glsl */`
attribute float aFade; varying vec3 vPos, vN, vV; varying float vFade;
void main(){ vPos = position; vN = normal; vFade = aFade; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = mv.xyz; gl_Position = projectionMatrix * mv; }`;
const BACK_FRAG = /* glsl */`
varying vec3 vPos, vN, vV; varying float vFade;
void main(){
  vec3 an = abs(vN);
  vec2 p = an.z >= max(an.x, an.y) ? vPos.xy : (an.y >= an.x ? vec2(vPos.x, vPos.z * 0.6124) : vec2(vPos.z * 0.6124, vPos.y));
  vec2 per = vec2(${(2 * DX).toFixed(4)}, ${A_LAT.toFixed(4)}), hp = per * 0.5;
  vec2 a = mod(p + hp, per) - hp, b = mod(p + hp - vec2(${DX.toFixed(4)}, ${LAYER.toFixed(4)}), per) - hp;
  vec2 g = abs(dot(a, a) < dot(b, b) ? a : b);
  float h = max(g.y, g.x * 0.866 + g.y * 0.5);
  float fw = max(fwidth(p.x) + fwidth(p.y), 1e-4) * 0.7;
  float wall = smoothstep(5.3 - fw, 5.3 + fw, h);
  wall = mix(wall, 0.6, smoothstep(1.6, 4.5, fw));
  vec3 cw = mix(uPal[0], uPal[1], 0.5) * vec3(0.84, 0.84, 0.92);
  vec3 ch = uPal[5] * vec3(0.66, 0.62, 0.72);
  vec3 col = mix(ch, mix(cw, uPal[5], 0.3), wall);
  col = mix(col, mix(uPal[5] * vec3(0.93, 0.92, 0.95), mix(uPal[5], vec3(1.0), 0.4), wall), clamp(vFade, 0.0, 1.0));
  if (an.y >= max(an.x, an.z)) {
    col = mix(col, uPal[5] * vec3(0.12, 0.055, 0.10), 0.84 + 0.10 * smoothstep(uTierX - 4.0, uTierX + 6.0, vPos.x));   // seen down the wells: the nave's plum
    col = mix(col, uPal[5] * 0.62, (1.0 - smoothstep(1.5, 2.6 + fw, length(g))) * 0.5 * (1.0 - smoothstep(1.6, 4.5, fw)));   // and a little rose at the bottom of each
  }
  gl_FragColor = vec4(slmAerial(col, length(vV)), 1.0);
}`;
export function backingMaterial(style) {
  return new THREE.ShaderMaterial({ uniforms: style.uniforms, side: THREE.DoubleSide, vertexShader: STYLE_GLSL + BACK_VERT, fragmentShader: STYLE_GLSL + BACK_FRAG });
}
