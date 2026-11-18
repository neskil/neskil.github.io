// UPHILL TO BLACK: hero set piece "The rocket and the sky it empties" (the vehicle; the world supplies Earth and sky).
//
// WHAT     A 70 m two-stage launcher built to be seen from a camera pod 0.6 m off its own skin, and from outside.
//          Booster (nine engine bells in an octaweb, sooted skirt, frosted tank, cable raceway, feed line, roll
//          chequers), black interstage with four folded lattice grid fins, upper stage (vacuum engine bell inside the
//          interstage, roll chequers, camera plinth, thruster quads), a 13 m bulbous two-shell fairing 6.2 m across,
//          and under it the payload on a black adapter (crinkled gold-foil satellite / flat-panel stack / capsule).
//          Effects that belong to the vehicle: a camera-facing nozzle glow (the fire as it reads end-on from the
//          pod: orange brush at sea level, pale feather in vacuum; hero.makeNozzleGlow(scale) gives another on the
//          same material), the plume (three nested shader shells: 90 m white-gold lance with
//          marching shock diamonds at sea level, widening to a pale violet feather ~400 m across in vacuum), glowing
//          nozzle throats, frost that erodes off the tanks, ice flakes streaming aft along the hull, the max-Q vapour
//          cone, the staging flash, booster tumble with fin deployment and ice glitter, the dull-red vacuum bell, and
//          the fairing halves hinging open and tumbling aft.
// SIZE     Origin = centre of the nozzle exit plane, +Y = nose, +Z = the camera-pod side ("front"), fairing seam in
//          the YZ plane (halves are +X and -X). Hull radius 1.85, fairing radius 3.1, nose tip y = 70.
//          Stage break y = 47, fairing base y = 57. radius 26 (viewer hint), height 70. Plume hangs below y = 0.
// OPTS     palette   7 hex strings in the brief's order (sky blue, turquoise, hull white, sand, mangrove, space black,
//                    exhaust orange)
//          livery    'white' | 'foam' | 'steel'      (default per seed, white most often)
//          payload   'satellite' | 'panels' | 'capsule' (default per seed, satellite most often)
//          progress  initial progress (default 0)
// PER SEED livery, payload, accent stripe colour, fairing shape (ogive length, bulge), raceway angle, positions of
//          the roll chequers, frost pattern, grid-fin proportions, tumble direction, plume flicker phase.
// PROGRESS hero.setProgress(u)  u = path progress 0..1 as in the brief (seconds = u * 40). Sets everything below:
//            setThrottle(0..1)   engines (ignition 0-2 s, cut-off 22 s)
//            setPressure(0..1)   ambient pressure, 1 = sea level, 0 = vacuum: plume length, width and colour
//            setCloudGlow(0..1)  set to 1 inside a cloud deck: the plume swells and goes orange (world keys this)
//            setFrost(0..1)      frost cover on the tanks (1 at the pad, erodes to 0.12 by staging)
//            setShed(0..1)       density of ice flakes streaming aft along the hull
//            setVapour(0..1)     max-Q vapour cone at the interstage (13-15 s)
//            setStaging(0..1)    0 attached .. 1 booster ~1.5 km behind, tumbling, fins out, glitter (22.6 s on)
//            setBellGlow(0..1)   upper-stage engine bell, dull red
//            setFairing(0..1)    0 closed, 0.3 hinged open 42 degrees, then released, tumbling aft either side
//          hero.flash is the eased staging flash 0..1 (0.1 s up, 0.3 s down at 22.6 s) for the world's full-frame
//          flash. Until setProgress or a setter is called, update() runs a slow demo loop so the viewer shows life.
//          hero.parts = { booster (pivot group: pose it yourself if you want another tumble), upper, fairing:[+X,-X],
//          plume, flakes } and hero.uniforms for direct access.
// ANCHORS  (local space)
//          pod         camera position: 0.6 m off the skin on +Z, just under the fairing overhang (0, 55.9, 2.45)
//          podNormal   (0,0,1) skin normal = camera "up" for the aft view, and the axis of the 180 degree pan
//          aftView     unit direction of the aft view: -Y tilted 12 degrees away from the skin
//          forwardView (0,1,0)
//          portalSeat  { position: pod + 190 m along +Y, facing: (0,-1,0) }: the 14 m portal, dead ahead of the pod
//          flyThrough  ordered points pod -> portal seat. A straight line parallel to the axis, as the brief demands;
//                      it clears the payload by ~1.1 m (not 6 m: the camera is mounted on the vehicle) and passes
//                      through where the +Z seam of the fairing was, so it is only clear once setFairing > 0.45.
//          stageBreak, nozzles, payload (centre of the payload), fairingTip, hinges [+X, -X], towerSide (-X: put
//          the tower there; the raceway and pod are on +Z), viewpoints { aft, forward, threeQuarter, mid, skin,
//          base, far } each { position, target, up }. Mount the camera at pod with up = podNormal looking along
//          aftView: at 0.6 m off the skin the bottom third of the frame is the first ~3 m of hull (rivet lines,
//          roll chequers, frost), and everything below the interstage is foreshortened into the vanishing point.
// COST     ~50k triangles, 8 draw calls typical and 11 at most, no lights, no textures, ~200 ms build (software GL).
// LIGHT    Lit by the scene's own lights (MeshStandardMaterial with shader detail): wants one hard white key from
//          behind the lens plus a coloured hemisphere/bounce. All paint albedo <= 0.75. HDR: nozzle throats 6, plume
//          core up to ~7, flash 8. Fog supported everywhere (additive parts fade out with fog instead of tinting).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#1F7FD6', '#2FC4B8', '#F3F1EA', '#E9DDB8', '#0F3D30', '#03040A', '#FF9A2E'];
const R = 1.85, Y_BREAK = 47, Y_FAIR = 57, Y_TIP = 70, POD = [0, 55.9, 2.45];

// ---------- geometry helpers: everything ends up non-indexed with position, normal, color, aSurf ----------
// aSurf = (frost susceptibility, glow, detail: 1 = panel seams, rivets and roll chequers)
// profile points: [r, y, [r,g,b], frost, glow, detail]. Two coincident points make a crease / colour break.
function lathe(pts, segs, o = {}) {
  const phi0 = o.phi0 ?? 0, phiLen = o.phiLen ?? TAU, flip = !!o.flip, n = pts.length;
  const nr = new Float32Array(n), ny = new Float32Array(n);
  const segN = (a, b) => { const dr = pts[b][0] - pts[a][0], dy = pts[b][1] - pts[a][1], l = Math.hypot(dr, dy); return l > 1e-6 ? [dy / l, -dr / l] : null; };
  for (let i = 0; i < n; i++) {
    const a = i > 0 ? segN(i - 1, i) : null, b = i < n - 1 ? segN(i, i + 1) : null;
    let x = (a ? a[0] : 0) + (b ? b[0] : 0), y = (a ? a[1] : 0) + (b ? b[1] : 0);
    const l = Math.hypot(x, y) || 1; nr[i] = x / l; ny[i] = y / l;
  }
  const cols = segs + 1, pos = [], nor = [], col = [], surf = [], idx = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], c = p[2];
    for (let j = 0; j < cols; j++) {
      const ph = phi0 + (j / segs) * phiLen, s = Math.sin(ph), cs = Math.cos(ph), f = flip ? -1 : 1;
      pos.push(p[0] * s, p[1], p[0] * cs); nor.push(nr[i] * s * f, ny[i] * f, nr[i] * cs * f);
      col.push(c[0], c[1], c[2]); surf.push(p[3] || 0, p[4] || 0, p[5] || 0);
    }
  }
  for (let i = 0; i < n - 1; i++) {
    if (Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) < 1e-6) continue;
    for (let j = 0; j < segs; j++) {
      const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1;
      if (flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aSurf', new THREE.Float32BufferAttribute(surf, 3));
  g.setIndex(idx);
  const out = g.toNonIndexed(); g.dispose();
  if (o.flat) out.computeVertexNormals();
  return out;
}
// paint any three.js geometry with one colour / surface triple and bake a transform into it
function paint(geo, c, m, frost = 0, glow = 0, detail = 0) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  if (g !== geo) geo.dispose();
  if (g.attributes.uv) g.deleteAttribute('uv');
  if (m) g.applyMatrix4(m);
  const n = g.attributes.position.count, col = new Float32Array(n * 3), surf = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; surf[i * 3] = frost; surf[i * 3 + 1] = glow; surf[i * 3 + 2] = detail; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aSurf', new THREE.BufferAttribute(surf, 3));
  return g;
}
// chamfered box, centred, size w (x) * h (y) * d (z), bevel b on the y edges, flat shaded
function cbox(w, h, d, b, c, m, frost = 0, glow = 0, detail = 0) {
  const rt = Math.SQRT2, bb = Math.min(0.45, (b / (Math.min(w, d) * 0.5))) * rt, k = [0, 0, 0];
  const g = lathe([[0, -h / 2, k], [rt - bb, -h / 2, k], [rt, -h / 2 + b, k], [rt, h / 2 - b, k], [rt - bb, h / 2, k], [0, h / 2, k]], 4, { phi0: Math.PI / 4, flat: true });
  g.applyMatrix4(new THREE.Matrix4().makeScale(w / 2, 1, d / 2)); g.computeVertexNormals();
  return paint(g, c, m, frost, glow, detail);
}
const M4 = () => new THREE.Matrix4();
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1), _p = new THREE.Vector3();
// transform: translate(x,y,z) * rotate(euler XYZ) * scale
function TR(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  return M4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s.set(sx, sy, sz));
}
// place something on the skin: rotate about the stack axis by `ang` (0 = +Z) after a local transform
const onSkin = (ang, m) => M4().makeRotationY(ang).multiply(m);
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---------- shader pieces ----------
const GLSL_NOISE = /* glsl */`
float h31(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fb3(vec3 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * vn3(p); p = p * 2.03 + 7.1; a *= .5; } return s * 1.07; }
`;
// additive things do not take the fog colour: they fade out with it
const GLSL_FOG_FADE = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogF = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    float fogF = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  gl_FragColor.rgb *= 1. - clamp(fogF, 0., 1.);
#endif
`;

// Hull paint: MeshStandardMaterial (so the world's lights do the lighting) with procedural panel seams, rivet
// lines, roll chequers, grime streaks, eroding frost and glowing throats added in object space.
function hullMaterial(U, o = {}) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: o.roughness ?? 0.36, metalness: 0, side: o.side ?? THREE.FrontSide });
  const own = { uGlow: { value: 0 }, uGlowCol: { value: new THREE.Color().setRGB(...(o.glowCol || [6, 5, 3.2])) }, uRoll: { value: new THREE.Vector2(...(o.roll || [-10, -9])) }, uFair: { value: o.fair ? 1 : 0 }, uAccent: { value: new THREE.Color().setRGB(...(o.accent || [0.1, 0.4, 0.5])) } };
  mat.userData.u = own;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, own, { uFrost: U.uFrost, uTime: U.uTime, uFrostCol: U.uFrostCol, uSeed: U.uSeed, uDownV: U.uDownV, uSunVw: U.uSunVw });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', 'attribute vec3 aSurf;\nvarying vec3 vObj;\nvarying vec3 vSurf;\n#include <common>')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position; vSurf = aSurf;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `uniform float uFrost, uGlow, uTime, uSeed, uFair; uniform vec3 uGlowCol, uFrostCol, uAccent; uniform vec2 uRoll; uniform vec4 uDownV, uSunVw;
varying vec3 vObj; varying vec3 vSurf;
${GLSL_NOISE}
#include <common>`)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
float hFrost = 0., seamAll = 0.;
{
  float rr = length(vObj.xz);
  float ang = atan(vObj.x, vObj.z + step(rr, 1e-4) * 1e-3);
  float aaY = fwidth(vObj.y);
  if (vSurf.z > 0.5) {
    float py = vObj.y / 1.9, row = floor(py), fy = fract(py);
    float dR = min(fy, 1. - fy) * 1.9;
    float ring = (1. - smoothstep(0.007, 0.009 + aaY * 1.2, dR)) * clamp(0.03 / (0.03 + aaY), 0., 1.);
    float pa = ang / 6.2832 * 8. + mod(row, 2.) * .5, fa = fract(pa);
    float cell = 0.7854 * max(rr, 0.01);
    float aaA = min(fwidth(pa), 0.2) * cell;
    float vert = (1. - smoothstep(0.005, 0.007 + aaA * 1.2, min(fa, 1. - fa) * cell)) * clamp(0.03 / (0.03 + aaA), 0., 1.);
    float arc = ang * rr;
    float rd = length(vec2(abs(dR - 0.06), (abs(fract(arc / 0.11) - .5)) * 0.11));
    float riv = (1. - smoothstep(0.011, 0.016, rd)) * (1. - smoothstep(0.008, 0.035, aaY));
    float dV = min(fa, 1. - fa) * cell;
    float rd2 = length(vec2(abs(dV - 0.06), (abs(fract(vObj.y / 0.11) - .5)) * 0.11));
    riv = max(riv, (1. - smoothstep(0.011, 0.016, rd2)) * (1. - smoothstep(0.008, 0.035, aaY)));
    float ps = ang / 6.2832 * 64., fs = fract(ps), aaS = min(fwidth(ps), 0.5);
    float str = (1. - smoothstep(0.02, 0.035 + aaS, min(fs, 1. - fs))) * clamp(0.1 / (0.1 + aaS), 0., 1.);
    float hid = h31(vec3(row, floor(pa), 11. + uSeed)), sten = 0.;
    if (hid > 0.45) {
      vec2 sq = (vec2(fa, fy) - vec2(0.2 + 0.3 * fract(hid * 7.), 0.25 + 0.4 * fract(hid * 13.))) * vec2(cell, 1.9) / vec2(0.46, 0.17);
      if (sq.x > 0. && sq.x < 1. && sq.y > 0. && sq.y < 1.)
        sten = step(0.3, fract(sq.y * 3.)) * step(0.34, h31(vec3(floor(sq.x * 16.), floor(sq.y * 3.), floor(hid * 50.)))) * (1. - smoothstep(0.002, 0.012, aaY));
    }
    float tint = (h31(vec3(row, floor(pa), 3. + uSeed)) - .5) * 0.08;
    float streak = vn3(vec3(vObj.x * 7., vObj.y * 0.16 + uSeed, vObj.z * 7.));
    float seamv = max(ring, vert);
    seamAll = seamv;
    float lum = dot(diffuseColor.rgb, vec3(.3333));
    if (lum < 0.08) {
      diffuseColor.rgb += 0.045 * seamv + 0.03 * riv + 0.012 * str + 0.02 * (streak - .5);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42), sten * 0.8);
    } else {
      diffuseColor.rgb *= (1. + tint) * (0.9 + 0.12 * streak);
      diffuseColor.rgb *= 1. - 0.55 * seamv - 0.45 * riv - 0.07 * str;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07), sten * 0.8);
    }
    if (vObj.y > uRoll.x && vObj.y < uRoll.y) {
      float q = step(0., sin(ang * 2. + 0.6));
      float hlf = step((uRoll.x + uRoll.y) * .5, vObj.y);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.025) + 0.03 * seamv, abs(q - hlf) * 0.97);
    }
  }
  // THE FAIRING'S OWN SURFACE (what fills the lens through the pan): a dark separation band with bolt heads at the base,
  // ring seams with double rivet rows, a band of chevrons and an accent line round the flare, the split rail up each seam
  // with its latches, sixteen gores, quartered roll marks under the nose. Paint only: no lettering.
  if (uFair > .5 && vSurf.z > .9 && vObj.y > 57.01) {
    float y = vObj.y, arc = ang * rr, eY = aaY + 1e-5, eA = fwidth(arc) + 1e-5;
    float fine = 1. - smoothstep(.006, .03, eY);
    vec3 dk = vec3(.035, .037, .042), base = diffuseColor.rgb;
    // gores: every 1/16 turn, a seam and a rivet row either side
    float gq = abs(fract(ang / 6.2832 * 16. + .5) - .5) * .3927 * rr;
    float gs = (1. - smoothstep(.006, .006 + eA * 1.2, gq)) * clamp(.03 / (.03 + eA), 0., 1.);
    float gr = (1. - smoothstep(.011, .017, length(vec2(gq - .055, (abs(fract(y / .09) - .5)) * .09)))) * fine;
    // ring seams of the flare and the barrel
    float dq = min(min(abs(y - 57.62), abs(y - 58.42)), min(abs(y - 59.12), abs(y - 59.75)));
    float rs = (1. - smoothstep(.007, .007 + eY * 1.2, dq)) * clamp(.03 / (.03 + eY), 0., 1.);
    float rv = (1. - smoothstep(.011, .017, length(vec2(abs(dq - .05), (abs(fract(arc / .09) - .5)) * .09)))) * fine;
    float gp = h31(vec3(floor(ang / 6.2832 * 16. + .5), floor((y - 57.) / .8), 5. + uSeed));
    base *= (.93 + .12 * gp) * (1. - .5 * max(gs, rs) - .42 * max(gr, rv));
    // chevrons round the flare, between two pinstripes
    float cv = (y - 57.74) / .56;
    if (cv > 0. && cv < 1.) {
      float cx = arc / .62 + abs(cv - .5) * .95, tri = abs(fract(cx) - .5) * 2., ce = fwidth(cx) * 2. + 1e-4;
      base = mix(base, dk + .03 * gp, smoothstep(.5 - ce, .5 + ce, tri) * .95 * clamp(.5 / (.5 + ce), 0., 1.));
    }
    float pin = max(1. - smoothstep(.012, .012 + eY, abs(y - 57.7)), 1. - smoothstep(.012, .012 + eY, abs(y - 58.34)));
    base = mix(base, dk, pin * .9);
    base = mix(base, uAccent, (1. - smoothstep(.06, .06 + eY, abs(y - 58.62))) * .95);
    // separation band: dark, with bright bolt heads and index ticks
    float sb = 1. - smoothstep(57.4, 57.4 + eY * 1.5 + .004, y);
    float bolt = (1. - smoothstep(.022, .03, length(vec2(y - 57.24, (abs(fract(arc / .16) - .5)) * .16)))) * fine;
    float tick = step(abs(fract(ang / 6.2832 * 32.) - .5), .06) * step(57.31, y) * step(y, 57.39) * fine;
    base = mix(base, dk * 1.6 + vec3(.5, .5, .52) * bolt + vec3(.45) * tick, sb);
    // the split rail up each seam: a dark strip with latches
    float sq = min(abs(arc), (3.14159 - abs(ang)) * rr);
    float rail = 1. - smoothstep(.075, .075 + eA * 1.5, sq);
    float latch = step(abs(fract(y / .62) - .5), .13) * step(.02, sq) * (1. - smoothstep(.05, .055 + eA, sq));
    base = mix(base, dk * 2.2 + vec3(.36, .37, .4) * latch * fine + vec3(.2) * (1. - smoothstep(.004, .004 + eA, sq)), rail * .96);
    // quartered roll marks under the nose
    if (y > 66.3 && y < 67.7) base = mix(base, dk, abs(step(0., sin(ang * 4. + .4)) - step(67., y)) * .95);
    diffuseColor.rgb = base;
  }
  // the collar of the upper stage under the fairing (the skin ahead of the lens once the view has turned forward): index
  // marks round the stack, an accent line, the dark separation ring with its bolt heads
  if (uFair < .5 && vSurf.z > .9 && vObj.y > 55.97 && vObj.y < 57.001 && rr > 1.8) {
    float y = vObj.y, arc = ang * rr, eY = aaY + 1e-5, eA = fwidth(arc) + 1e-5, fine = 1. - smoothstep(.006, .03, eY);
    vec3 dk = vec3(.035, .037, .042), base = diffuseColor.rgb;
    float tk = abs(fract(ang / 6.2832 * 48. + .5) - .5) * .1309 * rr;
    float y0 = mix(56.34, 56.14, step(abs(fract(ang / 6.2832 * 12. + .5) - .5), .12));
    float mark = (1. - smoothstep(.02, .02 + eA * 1.5, tk)) * smoothstep(y0 - eY, y0 + eY, y) * (1. - smoothstep(56.5 - eY, 56.5 + eY, y)) * clamp(.06 / (.06 + eA), 0., 1.);
    base = mix(base, dk, mark * .92);
    base = mix(base, uAccent, (1. - smoothstep(.035, .035 + eY, abs(y - 56.66))) * .95);
    float sb = smoothstep(56.84 - eY, 56.84 + eY, y);
    float bolt = (1. - smoothstep(.02, .028, length(vec2(y - 56.92, (abs(fract(arc / .16) - .5)) * .16)))) * fine;
    base = mix(base, dk * 1.6 + vec3(.5, .5, .52) * bolt, sb);
    diffuseColor.rgb = base;
  }
  // the side turned from the true sun falls into shade: the terminator slides round the hull as the stack leans and rolls
  diffuseColor.rgb *= 1. - uSunVw.w * .5 * (1. - smoothstep(-.3, .4, dot(normalize(vNormal + vec3(0., 0., 1e-6)), uSunVw.xyz)));
  float cover = uFrost * vSurf.x;
  if (cover > 0.001) {
    float n = fb3(vec3(vObj.x * 1.5, vObj.y * 0.42, vObj.z * 1.5) + uSeed);
    n += 0.1 * (vn3(vObj * vec3(9., 2.5, 9.)) - .5);
    float th = 1.0 - cover * 0.6;
    float am = smoothstep(th, th + 0.05, n);
    float grain = vn3(vObj * 46.), crack = 1. - smoothstep(0., 0.03, abs(vn3(vObj * vec3(5.5, 3., 5.5) + 3. + uSeed) - .5));
    float rimF = am * (1. - am) * 4.;
    vec3 fc = uFrostCol * (0.84 + 0.16 * grain) * (1. - 0.3 * crack) * (1. - 0.35 * rimF) * (1. - 0.22 * seamAll);
    diffuseColor.rgb = mix(diffuseColor.rgb, fc, am * 0.95);
    hFrost = am;
  }
}`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.96, hFrost);')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += uGlowCol * (vSurf.y * uGlow) * (0.86 + 0.14 * sin(uTime * 37. + vObj.x * 9. + vObj.z * 7.));
{ // above the weather: earthlight, blue, on whatever faces the Earth; the true sun as a hard edge and a glint that slides as the stack turns
  vec3 vdr = normalize(vViewPosition + vec3(0., 0., 1e-6));
  float fres = 1. - clamp(dot(normal, vdr), 0., 1.), ne = clamp(dot(normal, uDownV.xyz), 0., 1.);
  totalEmissiveRadiance += diffuseColor.rgb * vec3(.2, .42, 1.) * (ne * sqrt(ne) * (.5 + .9 * fres)) * uDownV.w;
  float ns = dot(normal, uSunVw.xyz), nh = clamp(dot(normal, normalize(uSunVw.xyz + vdr + vec3(0., 0., 1e-5))), 0., 1.);
  float nh2 = nh * nh, nh8 = nh2 * nh2 * nh2 * nh2, f2 = fres * fres;
  totalEmissiveRadiance += vec3(1., .93, .8) * (f2 * f2 * f2 * smoothstep(-.15, .45, ns) * .5 + nh8 * nh8 * nh8 * step(0., ns) * (.2 + .8 * diffuseColor.g) * .3) * uSunVw.w * (1. - .6 * hFrost);
}`);
  };
  return mat;
}

// ---------- the vehicle's parts ----------
async function buildBooster(rng, C, V, pause) {
  const parts = [], { tank, soot, black: blk, metal: mtl } = C;
  const P = [[0, 1.95, mtl], [1.5, 1.95, mtl], [1.99, 2.05, mtl], [2.03, 2.3, soot, 0, 0, 1], [2.03, 3.3, soot, 0, 0, 1], [R, 4.1, mixc(soot, tank, 0.3), 0.2, 0, 1]];
  for (let y = 5; y < 40.9; y += 0.9) {
    const k = 0.3 + 0.7 * smoothstep(4, 11, y), fr = y < 21 ? 0.62 : 1;
    const bulge = Math.abs(y - 21.2) < 0.46 || Math.abs(y - 40.1) < 0.46 ? 0.035 : 0;
    P.push([R + bulge, y, mixc(soot, tank, k), fr, 0, 1]);
  }
  P.push([R, 41, tank, 1, 0, 1], [R, 41, blk, 0, 0, 1], [R + 0.035, 41.06, blk, 0, 0, 1], [R + 0.035, 41.3, blk, 0, 0, 1], [R, 41.36, blk, 0, 0, 1]);
  const strp = mul(C.white, 0.9);
  for (let y = 42; y < 46.8; y += 0.8) {
    P.push([R, y, blk, 0, 0, 1]);
    if (Math.abs(y - 44.4) < 0.1) P.push([R, 44.6, blk, 0, 0, 1], [R, 44.6, strp, 0, 0, 1], [R, 44.72, strp, 0, 0, 1], [R, 44.72, blk, 0, 0, 1], [R, 44.82, blk, 0, 0, 1], [R, 44.82, strp, 0, 0, 1], [R, 44.86, strp, 0, 0, 1], [R, 44.86, blk, 0, 0, 1]);
  }
  const inner = mul(mtl, 0.55);
  P.push([R, 46.9, blk, 0, 0, 1], [R - 0.03, 47, blk], [R - 0.12, 47, mtl], [R - 0.12, 46.9, inner], [R - 0.12, 43, inner], [1.2, 43.25, inner], [0, 43.5, inner]);
  parts.push(lathe(P, 64)); await pause();
  // nine engine bells: eight on a ring and one in the middle; throats glow with the throttle
  const nzOut = mul(mtl, 0.8), nzIn = [0.05, 0.045, 0.04];
  const bell = mergeGeometries([
    lathe([[0.47, 0, nzOut], [0.475, 0.04, nzOut], [0.44, 0.36, nzOut], [0.36, 0.8, nzOut], [0.25, 1.25, nzOut], [0.17, 1.58, nzOut], [0.2, 1.74, mtl], [0.3, 1.8, mtl], [0.3, 2.0, mtl]], 20),
    lathe([[0, 1.56, nzIn, 0, 1], [0.12, 1.58, nzIn, 0, 1], [0.21, 1.2, nzIn, 0, 0.8], [0.32, 0.76, nzIn, 0, 0.55], [0.4, 0.34, nzIn, 0, 0.36], [0.445, 0.02, nzIn, 0, 0.24], [0.47, 0, nzOut, 0, 0.1]], 20),
  ]);
  for (let i = 0; i < 9; i++) {
    const a = (i / 8) * TAU + TAU / 16, g = bell.clone();
    g.applyMatrix4(i < 8 ? TR(Math.sin(a) * 1.36, 0, Math.cos(a) * 1.36) : TR(0, -0.05, 0)); parts.push(g);
  }
  bell.dispose(); await pause();
  // hold-down lugs, leg fairings with black tips, raceway with clamps, feed line, thruster pods, vents
  for (let i = 0; i < 4; i++) {
    const a = i * TAU / 4 + TAU / 8;
    parts.push(cbox(0.55, 0.8, 0.3, 0.08, mtl, onSkin(a, TR(0, 2.75, 2.1))));
    const a2 = i * TAU / 4;
    parts.push(cbox(0.62, 6.4, 0.3, 0.14, mixc(soot, tank, 0.75), onSkin(a2, TR(0, 6.6, R + 0.08, -0.012)), 0.4));
    parts.push(cbox(0.66, 1.1, 0.34, 0.14, blk, onSkin(a2, TR(0, 3.6, R + 0.11, -0.012))));
    parts.push(cbox(0.34, 0.5, 0.2, 0.06, mtl, onSkin(a2, TR(0, 10.0, R + 0.03))));
  }
  await pause();
  const ra = V.raceway;
  parts.push(cbox(0.32, 37.0, 0.13, 0.04, mul(tank, 0.94), onSkin(ra, TR(0, 22.5, R + 0.04)), 0.45));
  parts.push(cbox(0.32, 5.5, 0.13, 0.04, blk, onSkin(ra, TR(0, 43.9, R + 0.04))));
  for (let y = 5; y < 46; y += 2.35) parts.push(cbox(0.42, 0.13, 0.18, 0.03, y > 41 ? mul(mtl, 0.5) : mul(mtl, 2.2), onSkin(ra, TR(0, y, R + 0.05))));
  await pause();
  const pipe = [0.5, 0.51, 0.53];
  parts.push(paint(new THREE.CylinderGeometry(0.075, 0.075, 35, 10, 12), pipe, onSkin(ra + 2.6, TR(0, 22.5, R + 0.085)), 1));
  for (let y = 6; y < 40; y += 4.2) parts.push(cbox(0.3, 0.16, 0.2, 0.03, mul(mtl, 2), onSkin(ra + 2.6, TR(0, y, R + 0.06))));
  for (const a of [Math.PI / 2, -Math.PI / 2]) {
    parts.push(cbox(0.7, 0.62, 0.3, 0.1, mul(mtl, 0.7), onSkin(a, TR(0, 46.1, R + 0.1))));
    for (const dx of [-0.2, 0.2]) parts.push(paint(new THREE.CylinderGeometry(0.05, 0.1, 0.16, 10, 1, true), mul(mtl, 2.4), onSkin(a, TR(dx, 46.1, R + 0.3, Math.PI / 2))));
  }
  for (let i = 0; i < 6; i++) parts.push(cbox(0.3, 0.12, 0.05, 0.02, mul(mtl, 0.6), onSkin(ra + 0.7 + i * 0.9 + rng.range(-0.2, 0.2), TR(0, rng.pick([41.9, 42.6, 45.4]), R + 0.01))));
  await pause();
  const g = mergeGeometries(parts); parts.forEach((x) => x.dispose());
  return g;
}

// one lattice grid fin; hinge at the origin, panel hanging down -Y, thickness along Z
function buildFin(V) {
  const W = V.finW, H = V.finH, T = 0.17, cy = -H / 2 - 0.28, c = [0.43, 0.44, 0.46], parts = [];
  for (const sx of [-1, 1]) parts.push(cbox(0.1, H + 0.1, T, 0.03, c, TR(sx * W / 2, cy, 0)));
  for (const sy of [-1, 1]) parts.push(cbox(W + 0.1, 0.1, T, 0.03, c, TR(0, cy + sy * H / 2, 0)));
  const dark = mul(c, 0.8);
  for (const sg of [-1, 1]) {
    for (let k = -(W + H) / 2 + 0.17; k < (W + H) / 2; k += 0.34) {
      const s0 = Math.max(-(W / 2 + k) * Math.SQRT2, -H / Math.SQRT2), s1 = Math.min((W / 2 - k) * Math.SQRT2, H / Math.SQRT2);
      if (s1 - s0 < 0.12) continue;
      const m = (s0 + s1) / 2;
      parts.push(paint(new THREE.BoxGeometry(0.035, s1 - s0, T * 0.82), dark, TR(k + m / Math.SQRT2, cy + sg * m / Math.SQRT2, 0, 0, 0, -sg * Math.PI / 4)));
    }
  }
  parts.push(cbox(0.56, 0.34, 0.24, 0.06, mul(c, 0.7), TR(0, -0.06, -0.02)), cbox(0.2, 0.3, 0.14, 0.04, c, TR(0, -0.3, 0)));
  const g = mergeGeometries(parts); parts.forEach((x) => x.dispose());
  return g;
}

function buildUpper(rng, C, V) {
  const parts = [], { white, black: blk, metal: mtl } = C, nb = [0.085, 0.075, 0.075];
  // vacuum engine bell, hidden in the interstage until staging; glows hottest at the throat
  parts.push(lathe([[1.22, 43.55, nb, 0, 0.16], [1.235, 43.6, nb, 0, 0.16], [1.1, 44.25, nb, 0, 0.22], [0.85, 45.1, nb, 0, 0.36], [0.55, 45.9, nb, 0, 0.6], [0.3, 46.5, nb, 0, 0.85], [0.22, 46.75, nb, 0, 0.5], [0.4, 46.95, mtl], [0.4, 47.02, mtl]], 48));
  parts.push(lathe([[0, 46.6, nb, 0, 1], [0.16, 46.64, nb, 0, 1], [0.27, 46.4, nb, 0, 0.9], [0.52, 45.85, nb, 0, 0.66], [0.82, 45.1, nb, 0, 0.42], [1.07, 44.25, nb, 0, 0.27], [1.2, 43.56, nb, 0, 0.2], [1.22, 43.55, nb, 0, 0.16]], 48));
  for (let i = 0; i < 6; i++) parts.push(paint(new THREE.CylinderGeometry(0.035, 0.035, 0.75, 6), mul(mtl, 1.6), onSkin(i * TAU / 6, TR(0, 46.72, 0.72, 0.95))));
  const P = [[0.4, 47.02, mtl], [1.4, 47.02, mtl], [1.74, 47.04, mtl], [R, 47.14, blk, 0, 0, 1], [R, 48.1, blk, 0, 0, 1], [R, 48.1, white, 0, 0, 1]];
  for (let y = 48.6; y < 56.9; y += 0.52) P.push([R, y, white, y > 50.2 && y < 56.6 ? 1 : 0.2, 0, 1]);
  P.push([R, Y_FAIR, white, 0, 0, 1], [R, Y_FAIR, blk], [1.62, 57.02, blk], [1.2, 57.9, blk], [1.05, 58.15, blk], [0.9, 58.2, blk], [0, 58.2, blk]);
  parts.push(lathe(P, 96));
  // camera plinth (the lens itself floats at anchors.pod), raceway, thruster quads, antenna blades
  parts.push(cbox(0.46, 0.3, 0.24, 0.05, mul(mtl, 0.8), onSkin(0, TR(0, 55.9, R + 0.1))));
  parts.push(cbox(0.2, 0.2, 0.1, 0.03, mul(mtl, 2), onSkin(0, TR(0, 55.9, R + 0.24))));
  const ra = V.raceway2;
  parts.push(cbox(0.26, 8.6, 0.11, 0.035, mul(white, 0.95), onSkin(ra, TR(0, 52.55, R + 0.035)), 0.4));
  for (let y = 48.7; y < 56.8; y += 1.9) parts.push(cbox(0.34, 0.11, 0.15, 0.03, mul(mtl, 2.2), onSkin(ra, TR(0, y, R + 0.04))));
  for (const a of [Math.PI / 2 + 0.3, -Math.PI / 2 + 0.3]) {
    parts.push(cbox(0.52, 0.52, 0.22, 0.08, mul(mtl, 0.8), onSkin(a, TR(0, 48.9, R + 0.07))));
    for (const [dx, dy, rz] of [[-0.3, 0, Math.PI / 2], [0.3, 0, -Math.PI / 2], [0, -0.3, Math.PI]]) parts.push(paint(new THREE.CylinderGeometry(0.04, 0.085, 0.14, 10, 1, true), mul(mtl, 2.6), onSkin(a, TR(dx, 48.9 + dy, R + 0.16, 0, 0, rz))));
  }
  for (const a of [2.2, -2.5]) parts.push(cbox(0.05, 0.55, 0.3, 0.02, white, onSkin(a, TR(0, 54.2, R + 0.12, 0.25))));
  parts.push(lathe([[R, 51.0, mul(white, 0.9)], [R + 0.03, 51.03, mul(white, 0.9)], [R + 0.03, 51.13, mul(white, 0.9)], [R, 51.16, mul(white, 0.9)]], 96));
  parts.push(cbox(0.3, 0.3, 0.03, 0.012, mul(mtl, 0.9), onSkin(-V.raceway2 * 0.75, TR(0, 54.35, R + 0.012))));
  parts.push(cbox(0.2, 0.34, 0.035, 0.012, mul(mtl, 2.6), onSkin(-V.raceway2 * 0.55, TR(0, 53.2, R + 0.014))));
  parts.push(cbox(0.42, 0.26, 0.025, 0.01, mul(white, 0.8), onSkin(V.raceway2 * 0.3, TR(0, 52.6, R + 0.01)), 0.3));
  for (let i = 0; i < 4; i++) parts.push(paint(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 6), mul(mtl, 1.5), onSkin(V.raceway2 * 0.3, TR((i & 1 ? 1 : -1) * 0.17, 52.6 + (i & 2 ? 1 : -1) * 0.09, R + 0.03, Math.PI / 2))));
  return parts;
}

// the +X fairing half (the -X one is the same geometry turned half a turn)
function buildFairingHalf(C, V) {
  const { white, black: blk } = C, RF = 3.1, yC = V.fairCyl, pw = V.fairPow, out = [], inn = [], liner = [0.2, 0.2, 0.185];
  const prof = [[R + 0.015, Y_FAIR], [R + 0.03, 57.25]];
  for (let i = 1; i <= 7; i++) { const t = i / 7; prof.push([lerp(R + 0.03, RF, smoothstep(0, 1, t)), lerp(57.25, 59.1, t)]); }
  const sy0 = V.stripeY, cylY = [sy0, sy0 + 0.5, sy0 + 0.72, sy0 + 0.9];
  for (let y = 59.75; y < yC - 0.3; y += 0.65) cylY.push(y);
  cylY.sort((a, b) => a - b).forEach((y) => prof.push([RF, y]));
  for (let i = 0; i <= 12; i++) { const t = Math.sin((i / 12) * Math.PI / 2); prof.push([RF * Math.pow(Math.max(0, 1 - Math.pow(t, pw)), 1 / pw) + (i === 12 ? 0 : 0.001), lerp(yC, Y_TIP, t)]); }
  const sy = V.stripeY;
  const tipC = mul(white, 0.55);
  const colAt = (y) => (y > sy && y < sy + 0.5 ? C.accent : y > sy + 0.72 && y < sy + 0.9 ? blk : y > 68.9 ? tipC : white);
  const segC = (i) => colAt((prof[i][1] + prof[Math.min(prof.length - 1, i + 1)][1]) / 2);
  for (let i = 0; i < prof.length; i++) {
    const [r, y] = prof[i], fr = y < 59.2 ? 0.5 : 0, cPrev = segC(Math.max(0, i - 1)), cNext = segC(i);
    out.push([r, y, cPrev, fr, 0, 1]);
    if (cNext !== cPrev) out.push([r, y, cNext, fr, 0, 1]);
    inn.push([Math.max(0, r - 0.075), y - (i > prof.length - 4 ? 0.07 : 0), liner, 0, 0, 0.75]);   // 0.75: seams and rivets, but none of the outer paint
  }
  const parts = [lathe(out, 40, { phiLen: Math.PI }), lathe(inn, 40, { phiLen: Math.PI, flip: true })];
  // seam faces and base rim so the shell has thickness when it tumbles past
  const pos = [], rim = mul(white, 0.6);
  for (let i = 0; i < prof.length - 1; i++) {
    for (const sg of [1, -1]) {
      const a = [0, prof[i][1], sg * prof[i][0]], b = [0, prof[i + 1][1], sg * prof[i + 1][0]];
      const c = [0, prof[i][1], sg * Math.max(0, prof[i][0] - 0.075)], d = [0, prof[i + 1][1], sg * Math.max(0, prof[i + 1][0] - 0.075)];
      pos.push(...a, ...b, ...c, ...b, ...d, ...c, ...a, ...c, ...b, ...b, ...c, ...d);
    }
  }
  const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const en = new Float32Array(pos.length); for (let i = 0; i < en.length; i += 3) en[i] = -1;
  eg.setAttribute('normal', new THREE.BufferAttribute(en, 3)); parts.push(paint(eg, rim, null, 0, 0.6));
  parts.push(paint(new THREE.RingGeometry(R - 0.06, R + 0.015, 40, 1, 0, Math.PI), rim, TR(0, Y_FAIR, 0, Math.PI / 2, Math.PI / 2), 0, 1));
  // inner stiffening ribs along the liner
  for (let i = 1; i < 6; i++) parts.push(cbox(0.1, yC - 59.4, 0.09, 0.03, mul(liner, 1.5), onSkin(i * Math.PI / 6, TR(0, (yC + 59.4) / 2, RF - 0.13))));
  const g = mergeGeometries(parts); parts.forEach((x) => x.dispose());
  return g;
}

// payload: returns { hull: [geometries for the upper-stage mesh], foil: geometry for the rippling gold-foil mesh }
function buildPayload(rng, noise, C, V) {
  const hull = [], { white, black: blk, metal: mtl } = C, cell = [0.012, 0.022, 0.085];
  const crinkle = (g, amp) => {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      p.setXYZ(i, x + noise.n3(x * 5.3 + 9, y * 5.3, z * 5.3) * amp, y + noise.n3(x * 5.3, y * 5.3 + 17, z * 5.3) * amp, z + noise.n3(x * 5.3, y * 5.3, z * 5.3 + 31) * amp);
    }
    const o = g.toNonIndexed(); g.dispose(); o.deleteAttribute('uv'); o.computeVertexNormals(); return o;
  };
  const foilParts = [];
  if (V.payload === 'panels') {
    for (let i = 0; i < 15; i++) hull.push(cbox(2.05, 0.1, 1.5, 0.03, i % 5 === 4 ? mul(mtl, 2) : cell, TR(0, 58.42 + i * 0.185, 0, 0, i % 2 ? 0.02 : -0.02)));
    for (const sx of [-1, 1]) hull.push(cbox(0.1, 3.0, 0.1, 0.02, mul(mtl, 1.6), TR(sx * 0.8, 59.8, 0.82)), cbox(0.1, 3.0, 0.1, 0.02, mul(mtl, 1.6), TR(sx * 0.8, 59.8, -0.82)));
    foilParts.push(crinkle(new THREE.BoxGeometry(0.7, 0.9, 0.7, 4, 5, 4).translate(0, 61.75, 0), 0.03));
    foilParts.push(crinkle(new THREE.BoxGeometry(2.1, 0.12, 1.56, 9, 1, 7).translate(0, 61.27, 0), 0.02));
  } else if (V.payload === 'capsule') {
    const shield = [0.035, 0.03, 0.03], cw = mul(white, 0.95);
    hull.push(lathe([[0, 58.75, shield], [1.2, 58.82, shield], [1.44, 59.0, shield], [1.47, 59.12, shield], [1.47, 59.12, cw], [1.44, 59.3, cw], [0.95, 60.7, cw], [0.62, 61.55, cw], [0.62, 61.55, mul(mtl, 1.5)], [0.5, 61.9, mul(mtl, 1.5)], [0, 61.95, mul(mtl, 1.5)]], 40));
    for (const a of [0.35, -0.35, 2.4]) hull.push(cbox(0.3, 0.26, 0.05, 0.04, [0.015, 0.03, 0.05], onSkin(a, TR(0, 60.15, 1.13, -0.34))));
    for (let i = 0; i < 4; i++) hull.push(cbox(0.24, 0.3, 0.14, 0.04, mtl, onSkin(i * TAU / 4 + 0.8, TR(0, 59.35, 1.4, -0.2))));
    foilParts.push(crinkle(new THREE.CylinderGeometry(1.25, 1.1, 0.55, 28, 3, true).translate(0, 58.47, 0), 0.035));
  } else {
    foilParts.push(crinkle(new THREE.BoxGeometry(1.5, 2.7, 1.5, 10, 18, 10).translate(0, 59.65, 0), 0.035));
    foilParts.push(crinkle(new THREE.CylinderGeometry(0.42, 0.42, 0.5, 14, 2).translate(0, 61.2, -0.2), 0.03));
    for (const sx of [-1, 1]) {
      for (let k = 0; k < 3; k++) hull.push(cbox(0.045, 2.35, 1.34, 0.015, k === 2 ? cell : mul(cell, 0.7), TR(sx * (0.86 + k * 0.07), 59.65, 0)));
      hull.push(cbox(0.2, 0.2, 0.3, 0.04, mul(mtl, 2), TR(sx * 0.8, 60.3, 0)), cbox(0.2, 0.2, 0.3, 0.04, mul(mtl, 2), TR(sx * 0.8, 59.0, 0)));
    }
    // dish with feed, low-gain boom, star trackers, thrusters
    const dw = mul(white, 0.95), dm = TR(0.1, 61.55, 0.2, 0.38, 0.5);
    hull.push(paint(lathe([[0, 0, dw], [0.25, 0.02, dw], [0.5, 0.09, dw], [0.72, 0.2, dw], [0.75, 0.22, dw], [0.72, 0.17, mul(dw, 0.6)], [0.5, 0.05, mul(dw, 0.6)], [0, -0.04, mul(dw, 0.6)]], 28), dw, null));
    hull[hull.length - 1].applyMatrix4(dm);
    for (let i = 0; i < 3; i++) hull.push(paint(new THREE.CylinderGeometry(0.014, 0.014, 0.72, 5), mtl, dm.clone().multiply(TR(Math.sin(i * TAU / 3) * 0.3, 0.38, Math.cos(i * TAU / 3) * 0.3, 0, i * TAU / 3, 0).multiply(M4().makeRotationX(-0.42)))));
    hull.push(paint(new THREE.CylinderGeometry(0.07, 0.05, 0.14, 10), mtl, dm.clone().multiply(TR(0, 0.7, 0))));
    hull.push(paint(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 6), mul(mtl, 2), TR(-0.55, 61.6, -0.5, 0.2, 0, 0.3)), paint(new THREE.SphereGeometry(0.07, 8, 6), white, TR(-0.75, 62.2, -0.37)));
    for (const [x, z] of [[0.5, 0.78], [-0.45, 0.78]]) hull.push(paint(new THREE.CylinderGeometry(0.09, 0.11, 0.3, 10), blk, TR(x, 60.5, z, Math.PI / 2 - 0.5)));
    for (let i = 0; i < 4; i++) hull.push(paint(new THREE.CylinderGeometry(0.03, 0.07, 0.14, 8, 1, true), mul(mtl, 2.2), TR((i & 1 ? 1 : -1) * 0.66, 58.36, (i & 2 ? 1 : -1) * 0.66, Math.PI)));
  }
  const foil = mergeGeometries(foilParts); foilParts.forEach((x) => x.dispose());
  return { hull, foil };
}

// ---------- effects ----------
// Plume: three nested shells (0 core, 1 mid, 2 outer) shaped in the vertex shader from pressure and throttle.
function buildPlume(U, pal) {
  const NT = 44, NS = 40, aP = [], idx = [];
  for (let l = 0; l < 3; l++) {
    const base = aP.length / 3;
    for (let i = 0; i <= NT; i++) for (let j = 0; j <= NS; j++) aP.push(Math.pow(i / NT, 1.35), (j / NS) * TAU, l);
    for (let i = 0; i < NT; i++) for (let j = 0; j < NS; j++) { const a = base + i * (NS + 1) + j, b = a + 1, c = a + NS + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(aP.length), 3));
  g.setAttribute('aP', new THREE.Float32BufferAttribute(aP, 3)); g.setIndex(idx);
  const fire = new THREE.Color(pal[6]);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uFire: { value: fire } }]),
    vertexShader: /* glsl */`
      uniform float uTime, uPress, uThrottle, uCloud, uSeed;
      attribute vec3 aP;
      varying vec3 vP; varying float vFace, vAxial, vLen, vEx;
      float gAx;
      #include <fog_pars_vertex>
      vec3 shape(float t, float ph, float ly, float ex, float len) {
        float r0 = mix(1.05, 1.9, ly * .5);
        float lance = r0 * (1. + (.35 + ly * .42) * sin(t * 3.1416)) * pow(max(1. - t, 1e-4), .5);
        float feather = r0 + (70. + 105. * ly) * (.3 * t + .7 * pow(max(t, 1e-5), 1.7));
        float r = mix(lance, feather, ex) * (1. + uCloud * (.5 + .9 * t) * ly);
        float phase = t * len / 5.6 * 3.1416 - uTime * 2.4;
        r *= 1. - (1. - gAx) * (1. - ex) * step(ly, .5) * .28 * (.5 + .5 * cos(2. * phase));
        r *= 1. + (1. - .9 * gAx) * (.05 + .05 * ly) * sin(uTime * 29. + t * 11. + ph * 3. + uSeed) * (.25 + t);
        vec2 off = vec2(sin(uTime * 6.3 + t * 8. + uSeed), cos(uTime * 4.9 + t * 6.3)) * t * t * (1.2 + 9. * ex);
        return vec3(r * sin(ph) + off.x, -.25 - len * t, r * cos(ph) + off.y);
      }
      void main() {
        float t = aP.x, ph = aP.y, ly = aP.z;
        float ex = pow(clamp(1. - uPress, 0., 1.), 1.5);
        float len = mix(94., 620., ex) * mix(.6, 1., ly * .5) * (.12 + .88 * uThrottle);
        vec3 axv = normalize(normalMatrix * vec3(0., 1., 0.));
        vec3 ov = (modelViewMatrix * vec4(0., -.5 * len, 0., 1.)).xyz;
        gAx = smoothstep(.5, .95, abs(dot(axv, normalize(-ov + vec3(0., 0., 1e-5)))));
        vec3 p = shape(t, ph, ly, ex, len);
        float dt = t < .5 ? .012 : -.012;
        vec3 n = normalize(cross(shape(t, ph + .06, ly, ex, len) - p, (shape(t + dt, ph, ly, ex, len) - p) / dt) + vec3(1e-6, 0., 0.));
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        vec3 vd = normalize(-mvPosition.xyz + vec3(0., 0., 1e-5));
        vFace = abs(dot(normalize(normalMatrix * n), vd));
        vAxial = abs(dot(axv, vd));
        vP = aP; vLen = len; vEx = ex;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uThrottle, uCloud, uSeed; uniform vec3 uFire;
      varying vec3 vP; varying float vFace, vAxial, vLen, vEx;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main() {
        float t = vP.x, ph = vP.y, ly = vP.z;
        float k = 1.6 + ly;
        vec3 q = vec3(cos(ph) * k, sin(ph) * k, t * vLen * mix(.2, .035, vEx) - uTime * mix(9., 2.2, vEx) + uSeed);
        float n = vn3(q) * .65 + vn3(q * 2.3 + 5.) * .35;
        float rays = vn3(vec3(cos(ph) * 5., sin(ph) * 5., t * 3. - uTime * .35 + uSeed)) * .6 + vn3(vec3(cos(ph) * 13., sin(ph) * 13., t * 5. - uTime * .5)) * .4;
        n = mix(n, rays * (.45 + .9 * n), vEx * .75);
        float axw = smoothstep(.5, .95, vAxial);
        // seen end-on the shells are discs: radial streaks that crawl outwards instead of rings
        float sa = ph + .5 * sin(t * 2.3 + uSeed + ly);
        float str = vn3(vec3(cos(sa) * 3.2, sin(sa) * 3.2, t * 1.5 - uTime * 1.6 + uSeed + ly * 3.)) * .55 + vn3(vec3(cos(sa) * 8.5, sin(sa) * 8.5, t * 3.2 - uTime * 2.9 + ly)) * .45;
        n = mix(n, .12 + 1.05 * str, axw);
        float edge = mix(smoothstep(0., .5, vFace), .3 + .3 * smoothstep(0., .3, vFace), axw);
        float head = smoothstep(0., .012, t), tail = pow(max(1. - t, 0.), mix(1.1, mix(2.4, 1.45, vEx), ly * .5));
        vec3 gold = vec3(1., .84, .56), hot = mix(uFire, vec3(1., .78, .45), .2);
        vec3 sea = ly < .5 ? mix(gold * 1.5, hot * .8, smoothstep(0., .7, t))
                 : ly < 1.5 ? mix(hot * .45, uFire * .3, smoothstep(0., .8, t))
                 : mix(uFire * .22, uFire * vec3(.9, .5, .35) * .12, smoothstep(0., .9, t));
        vec3 vac = vec3(.6, .58, .86) * (ly < .5 ? .8 : ly < 1.5 ? .3 : .15) * mix(1.6, .6, smoothstep(0., .5, t));
        // the fire stays orange through the weather and only pales to violet in thin air
        vec3 col = mix(sea * (1. + .55 * axw * smoothstep(.05, .5, vEx)), vac, smoothstep(.62, .97, vEx));
        float phase = t * vLen / 5.6 * 3.1416 - uTime * 2.4;
        float dia = pow(max(0., sin(phase)), 5.) * step(ly, 1.5) * (ly < .5 ? 1. : .3) * (1. - vEx) * (1. - smoothstep(.1, .8, t)) * (1. - axw);
        col += gold * 3.6 * dia;
        col = mix(col, uFire * (.5 + ly * .2), uCloud * .6 * min(ly, 1.));
        float a = edge * head * tail * (.3 + 1.15 * n) * smoothstep(0., .08, uThrottle);
        gl_FragColor = vec4(col * a, 1.);
        ${GLSL_FOG_FADE}
      }`,
  });
  Object.assign(mat.uniforms, { uTime: U.uTime, uPress: U.uPress, uThrottle: U.uThrottle, uCloud: U.uCloud, uSeed: U.uSeed });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 4;
  return m;
}

// The fire seen end-on: a camera-facing glow at the nozzle plane. From the pod the lance itself hides behind the
// hull, so this is what carries the fire: a white-gold heart, an orange brush that swells into a wide pale feather
// as the air thins. Shared material; any scale on the mesh scales the glow (the world gives one to each side booster).
function buildNozzleGlow(U, pal) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, premultipliedAlpha: true, fog: false,       // premultiplied: the orange keeps its colour over bright sand and cloud
    uniforms: { uFire: { value: new THREE.Color(pal[6]) }, uTime: U.uTime, uPress: U.uPress, uThrottle: U.uThrottle, uCloud: U.uCloud, uSeed: U.uSeed, uGlowAmt: U.uGlowAmt },
    vertexShader: /* glsl */`
      uniform float uPress, uThrottle, uCloud; varying vec2 vQ; varying float vEx;
      void main() {
        vEx = pow(clamp(1. - uPress, 0., 1.), 1.5);
        float rad = mix(10.5, 19., vEx) * (.5 + .5 * uThrottle) * (1. + .45 * uCloud) * length(modelMatrix[1].xyz);
        vec4 mv = modelViewMatrix * vec4(0., 0., 0., 1.);
        mv.xy += position.xy * rad * 2.6;
        vQ = position.xy * 2.6;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uThrottle, uCloud, uSeed, uGlowAmt; uniform vec3 uFire; varying vec2 vQ; varying float vEx;
      ${GLSL_NOISE}
      void main() {
        float d = length(vQ);
        float ang = atan(vQ.y, vQ.x + step(abs(vQ.x) + abs(vQ.y), 1e-5) * 1e-4);
        float fl = .82 + .18 * sin(uTime * 37. + uSeed) * sin(uTime * 23.1 + 1.);
        float rays = vn3(vec3(cos(ang) * 3.5, sin(ang) * 3.5, uTime * 3.1 - d * 2. + uSeed)) * .6 + vn3(vec3(cos(ang) * 10., sin(ang) * 10., uTime * 5.3 - d * 4.)) * .4;
        float core = exp(-d * d * 9.);
        float brush = exp(-d * d * mix(1.15, 1.7, vEx)) * (.5 + 1.1 * rays * smoothstep(.1, .7, d));
        float halo = exp(-d * 1.9) * .32;
        vec3 warm = vec3(3.4, 2.3, 1.) * core + uFire * 2. * brush + uFire * .6 * halo;
        vec3 cold = vec3(1.3, 1.3, 1.8) * core + vec3(.6, .58, .9) * (.5 * brush + .12 * halo);
        float kc = smoothstep(.72, .98, vEx);
        vec3 col = mix(warm, cold, kc);
        float cover = mix(clamp(1.25 * brush + core + .3 * halo, 0., 1.), .2 * clamp(brush, 0., 1.), kc);
        col = mix(col, uFire * 3.2 * (brush + halo + core), uCloud * .55);
        float a = fl * smoothstep(0., .08, uThrottle) * (1. - smoothstep(2.1, 2.6, d)) * uGlowAmt;
        gl_FragColor = vec4(col * a, cover * min(a, 1.));
      }`,
  });
  const make = (scale = 1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); m.scale.setScalar(scale); m.position.set(0, -1.2, 0); m.frustumCulled = false; m.renderOrder = 5; return m; };
  return { make, mat };
}

// max-Q vapour cone: a flickering condensation skirt hanging off the interstage shoulder
function buildVapour(U) {
  const pts = [], k = [1, 1, 1];
  for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([lerp(R + 0.5, 6.4, Math.pow(t, 0.75)), lerp(47.6, 38.5, t), k]); }
  const g = lathe(pts, 48); g.deleteAttribute('aSurf'); g.deleteAttribute('color');
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
    vertexShader: /* glsl */`
      varying vec3 vO; varying float vFace;
      #include <fog_pars_vertex>
      void main() { vO = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        vFace = abs(dot(normalize(normalMatrix * normal), normalize(-mvPosition.xyz + vec3(0., 0., 1e-5))));
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uVapour; varying vec3 vO; varying float vFace;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main() {
        float t = clamp((47.6 - vO.y) / 9.1, 0., 1.);
        float n = fb3(vec3(vO.x * 1.3, vO.y * .22 + uTime * 9., vO.z * 1.3));
        float fl = .65 + .35 * sin(uTime * 23.) * sin(uTime * 7.1 + 1.);
        float a = uVapour * fl * smoothstep(0., .3, t) * (1. - smoothstep(.4, 1., t)) * smoothstep(.35, .7, n) * smoothstep(0., .4, vFace);
        gl_FragColor = vec4(vec3(.85, .88, .92), clamp(a, 0., 1.) * .5);
        #include <fog_fragment>
      }`,
  });
  Object.assign(mat.uniforms, { uTime: U.uTime, uVapour: U.uVapour });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 3; m.visible = false;
  return m;
}

// staging flash (one camera-facing soft disc at the stage break) and ice glitter (points) in one pair of draws
function buildFlash(U) {
  const g = new THREE.PlaneGeometry(2, 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uFlash: U.uFlash },
    vertexShader: /* glsl */`uniform float uFlash; varying vec2 vUv;
      void main() { vUv = position.xy; vec4 mv = modelViewMatrix * vec4(0., 0., 0., 1.); mv.xy += position.xy * (14. + 30. * uFlash); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`uniform float uFlash; varying vec2 vUv;
      void main() { float d = length(vUv); float a = exp(-d * d * 7.) + .25 * exp(-d * 2.2) * (1. - smoothstep(.7, 1., d));
        gl_FragColor = vec4(vec3(.96, .98, 1.) * 8. * uFlash * a, 1.); }`,
  });
  const m = new THREE.Mesh(g, mat); m.position.set(0, Y_BREAK - 2, 0); m.frustumCulled = false; m.renderOrder = 6; m.visible = false;
  return m;
}
function buildGlitter(rng, U, count) {
  const pos = new Float32Array(count * 3), seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const a = rng() * TAU, cy = rng.range(-1, 1), sr = Math.sqrt(1 - cy * cy), sp = Math.pow(rng(), 0.6);
    pos.set([Math.cos(a) * sr * sp, cy * sp, Math.sin(a) * sr * sp], i * 3); seed.set([rng(), rng(), rng(), rng()], i * 4);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: U.uTime, uStage: U.uStage, uPx: U.uPx, uDrift: U.uDrift },
    vertexShader: /* glsl */`
      uniform float uTime, uStage, uPx; uniform vec3 uDrift; attribute vec4 aSeed; varying float vA;
      void main() {
        float s = uStage, grow = 1. - exp(-s * 9.);
        vec3 p = position * (2.5 + 46. * grow + 240. * s) * (.35 + aSeed.x) + vec3(0., 44., 0.) + uDrift * (.15 + .8 * aSeed.y);
        p += vec3(sin(uTime * .7 + aSeed.z * 40.), cos(uTime * .6 + aSeed.w * 40.), sin(uTime * .5 + aSeed.x * 40.)) * .6;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        float tw = pow(.5 + .5 * sin(uTime * (3. + 9. * aSeed.w) + aSeed.z * 60.), 6.);
        vA = (.12 + 2.4 * tw) * smoothstep(0., .02, s) * (1. - smoothstep(.75, 1., s));
        gl_PointSize = clamp(uPx * (.05 + .1 * aSeed.y) / max(-mv.z, .5), 1.6, uPx * .03);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`varying float vA;
      void main() { vec2 c = gl_PointCoord - .5; float d = dot(c, c) * 4.; float a = (1. - smoothstep(.0, 1., d)); gl_FragColor = vec4(vec3(.85, .93, 1.) * 3. * vA * a * a, 1.); }`,
  });
  const m = new THREE.Points(g, mat); m.frustumCulled = false; m.renderOrder = 5; m.visible = false;
  return m;
}

// ice flakes and frost sheets streaming aft in a sleeve around the hull (instanced tumbling quads)
function buildFlakes(rng, U, count) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const seed = new Float32Array(count * 4), seed2 = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) { seed.set([rng(), rng(), rng(), rng()], i * 4); seed2.set([rng(), rng(), rng(), i / count], i * 4); }
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.setAttribute('aSeed2', new THREE.InstancedBufferAttribute(seed2, 4));
  g.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTint: { value: new THREE.Color(0.95, 0.98, 1.0) } }]),
    vertexShader: /* glsl */`
      uniform float uTime, uFall, uShed, uStreak; attribute vec4 aSeed, aSeed2; varying float vA, vSd, vGl; varying vec2 vQ;
      #include <fog_pars_vertex>
      void main() {
        float y = mod(aSeed.y * 62. - uFall * (.55 + .9 * aSeed.w), 62.);
        float age = 1. - y / 62.;
        float ang = aSeed.x * 6.2832 + age * (aSeed2.x - .5) * 1.4;
        float rad = 1.93 + aSeed.z * aSeed.z * 2.6 + age * (.4 + 2.2 * aSeed2.y);
        vec3 c = vec3(sin(ang) * rad, y - 1., cos(ang) * rad);
        float tw = uTime * (2. + 7. * aSeed2.z) + aSeed.w * 30.;
        float sz = mix(.018, .075, aSeed2.x * aSeed2.x) * (aSeed2.y > .9 ? 2.6 : 1.);
        // never bigger than about a thirtieth of the frame, however close it passes the lens
        float sc = max(length(modelMatrix[1].xyz), 1e-4);
        float dist = max(-(modelViewMatrix * vec4(c, 1.)).z / sc, .05);
        sz = min(sz, .034 * dist);
        vec3 ax = normalize(vec3(sin(aSeed.x * 40.), cos(aSeed.z * 40.), sin(aSeed.w * 40.)) + vec3(0., 0., 1e-3));
        vec3 u1 = normalize(cross(ax, vec3(.31, .9, .29))), u2 = cross(ax, u1);
        vec3 e1 = u1 * cos(tw) + u2 * sin(tw), e2 = cross(ax, e1) * (.55 + .45 * aSeed2.z);
        // drawn out along the slipstream
        vec3 p = c + (e1 * position.x + e2 * position.y) * sz + vec3(0., position.y * min(uStreak * (.55 + .9 * aSeed.w), min(9. * sz + .25, 2.5 * sz + .014 * dist)), 0.);
        vQ = position.xy; vSd = aSeed.x * 7. + aSeed2.z * 3.;
        float fl = abs(sin(tw * 1.7));
        vGl = fl * fl * fl * fl * fl * fl;
        vA = step(aSeed2.w, uShed) * smoothstep(0., .04, age) * (1. - smoothstep(.85, 1., age)) * (.5 + .5 * fl);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uTint; varying float vA, vSd, vGl; varying vec2 vQ;
      #include <fog_pars_fragment>
      void main() {
        float r = length(vQ);
        float a0 = atan(vQ.y, vQ.x + step(abs(vQ.x) + abs(vQ.y), 1e-5) * 1e-4);
        float re = .66 + .2 * sin(a0 * 3. + vSd * 40.) + .12 * sin(a0 * 7. + vSd * 90.);
        float a = vA * (1. - smoothstep(re * .25, re, r));
        if (a < .01) discard;
        gl_FragColor = vec4(uTint * (.62 + .4 * vA + 1.3 * vGl), a * .9);
        #include <fog_fragment>
      }`,
  });
  Object.assign(mat.uniforms, { uTime: U.uTime, uFall: U.uFall, uShed: U.uShed, uStreak: U.uStreak });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 2;
  return m;
}

// cold-gas thrusters: after staging the quads on the upper stage hold the attitude with short puffs of gas (instanced
// camera-facing quads; uRcs 0..1 switches them, each jet fires in its own bursts)
function buildRcs(U) {
  const O = [], D = [], S = [], N = 7, v = new THREE.Vector3(), d = new THREE.Vector3();
  let jet = 0;
  for (const a of [Math.PI / 2 + 0.3, -Math.PI / 2 + 0.3]) for (const [dx, dy, dir] of [[-0.3, 0, [-1, 0, 0.25]], [0.3, 0, [1, 0, 0.25]], [0, -0.3, [0, -1, 0.3]]]) {
    v.set(dx * 1.25, 48.9 + dy * 1.25, R + 0.2).applyMatrix4(M4().makeRotationY(a)); d.set(dir[0], dir[1], dir[2]).normalize().applyMatrix4(M4().makeRotationY(a));
    for (let i = 0; i < N; i++) { O.push(v.x, v.y, v.z); D.push(d.x, d.y, d.z); S.push(i / N, (jet * 0.377 + 0.13) % 1); }
    jet++;
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aO', new THREE.InstancedBufferAttribute(new Float32Array(O), 3)); g.setAttribute('aDir', new THREE.InstancedBufferAttribute(new Float32Array(D), 3));
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(S), 2)); g.instanceCount = S.length / 2;
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uTime: U.uTime, uRcs: U.uRcs },
    vertexShader: /* glsl */`attribute vec3 aO, aDir; attribute vec2 aSeed; uniform float uTime, uRcs; varying vec2 vQ; varying float vA;
      void main(){
        float age = fract(uTime * 2.1 + aSeed.x), born = uTime - age / 2.1;
        float on = step(fract(born / 2.7 + aSeed.y), .24);             // a burst of about 0.65 s every 2.7 s, each jet in its own time
        vec3 c = aO + aDir * (.06 + 3.4 * age * (1. - .35 * age));
        vec4 mv = modelViewMatrix * vec4(c, 1.);
        mv.xy += position.xy * (.05 + .62 * age) * length(modelMatrix[1].xyz);
        vQ = position.xy; vA = uRcs * on * (1. - age) * (1. - age) * smoothstep(0., .06, age);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`varying vec2 vQ; varying float vA;
      void main(){ float a = exp(-dot(vQ, vQ) * 3.2) * (1. - smoothstep(.8, 1., length(vQ))) * vA; if (a < .003) discard; gl_FragColor = vec4(vec3(.8, .9, 1.) * 1.5 * a, 1.); }`,
  }));
  m.frustumCulled = false; m.renderOrder = 5;
  return m;
}

// gold foil: faceted geometry, normals that ripple in time, and a little fake reflected light so it reads as metal
function foilMaterial(U, gold) {
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setRGB(...gold), roughness: 0.3, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', 'uniform float uTime;\nvarying vec3 vObj;\n#include <common>').replace('#include <begin_vertex>', `#include <begin_vertex>
vObj = position;
transformed += .016 * vec3(sin(position.y * 9. + uTime * 2.3), sin(position.z * 8. + uTime * 1.9 + 1.), sin(position.x * 10. + uTime * 2.1 + 2.));`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `uniform float uTime; varying vec3 vObj;\n${GLSL_NOISE}\n#include <common>`)
      .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
{ vec3 q = vObj * 13.; float w = uTime * 1.1;
  vec3 dn = vec3(vn3(q + vec3(w, 0., 0.)), vn3(q + vec3(7., w, 3.)), vn3(q + vec3(13., 5., w))) - .5;
  normal = normalize(normal + dn * .7); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ vec3 vdir = normalize(vViewPosition);
  vec3 rd = reflect(-vdir, normal);
  float env = vn3(rd * 2.4 + 4.) * .7 + vn3(rd * 6. + 9.) * .3;
  float fr = 1. - abs(dot(normal, vdir));
  diffuseColor.rgb *= mix(.22, 1.3, smoothstep(.25, .75, env));
  totalEmissiveRadiance += vec3(1., .74, .3) * (pow(env, 5.) * 1.1 + .1 * fr * fr); }`);
  };
  return mat;
}

// altitude (km) by flight time (s), from the brief
const ALT = [[0, 0], [2, 0], [5, 0.08], [8, 0.9], [9, 1.2], [12.5, 6], [15, 11], [18, 30], [22, 80], [40, 150]];
function altitudeAt(t) {
  for (let i = 1; i < ALT.length; i++) if (t <= ALT[i][0]) return lerp(ALT[i - 1][1], ALT[i][1], (t - ALT[i - 1][0]) / (ALT[i][0] - ALT[i - 1][0]));
  return ALT[ALT.length - 1][1];
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).slice();
  const detail = ctx.quality?.detail ?? 1;

  // ----- per-seed variation -----
  const side = rng.sign();
  const V = {
    livery: opts.livery || (rng.chance(0.6) ? 'white' : rng.chance(0.5) ? 'steel' : 'foam'),
    payload: opts.payload || (rng.chance(0.55) ? 'satellite' : rng.chance(0.55) ? 'panels' : 'capsule'),
    raceway: side * rng.range(0.34, 0.52), raceway2: -side * rng.range(0.3, 0.44),
    finW: rng.range(1.35, 1.6), finH: rng.range(1.7, 2.05),
    fairCyl: rng.range(62.6, 64.6), fairPow: rng.range(1.9, 2.5), stripeY: rng.range(60.0, 61.8),
    rollB: rng.range(33.5, 36.5), rollU: rng.range(52.75, 53.05), tumble: rng.sign(), seed: rng.range(0, 40),
  };
  const white = lin(pal[2], 0.68), black = [0.028, 0.03, 0.036], metal = [0.11, 0.115, 0.125];
  const steel = [0.44, 0.46, 0.49], foam = mixc(lin(pal[6], 0.62), [0.3, 0.12, 0.04], 0.45);
  const tank = V.livery === 'steel' ? steel : V.livery === 'foam' ? foam : white;
  const accent = lin(rng.pick([pal[1], pal[0], pal[1]]), 0.8);
  const C = { white: V.livery === 'steel' ? steel : white, tank, black, metal, soot: mixc(tank, [0.05, 0.045, 0.04], 0.78), accent };
  const CF = { ...C, white }; // the fairing stays painted white in every livery

  const U = {
    uTime: { value: 0 }, uSeed: { value: V.seed }, uFrost: { value: 1 }, uFrostCol: { value: new THREE.Color(0.84, 0.91, 1.0) },
    uPress: { value: 1 }, uThrottle: { value: 0 }, uCloud: { value: 0 }, uVapour: { value: 0 }, uFlash: { value: 0 },
    uStage: { value: 0 }, uPx: { value: 900 }, uDrift: { value: new THREE.Vector3() }, uFall: { value: 0 }, uShed: { value: 0 }, uStreak: { value: 0 }, uGlowAmt: { value: 1 },
    uDownV: { value: new THREE.Vector4(0, -1, 0, 0) }, uSunVw: { value: new THREE.Vector4(0, 1, 0, 0) }, uRcs: { value: 0 },
  };

  const object = new THREE.Group(); object.name = 'uphill-to-black-hero';
  // ----- booster -----
  const boosterPivot = new THREE.Group(); boosterPivot.position.set(0, 20, 0);
  const boosterIn = new THREE.Group(); boosterIn.position.set(0, -20, 0); boosterPivot.add(boosterIn); object.add(boosterPivot);
  const boosterMat = hullMaterial(U, { roll: [V.rollB, V.rollB + 3.6], glowCol: [6.5, 5.2, 3.2], roughness: V.livery === 'foam' ? 0.85 : 0.36 });
  const pause = async () => { await ctx.yield?.(); };
  const boosterGeo = await buildBooster(rng, C, V, pause); await pause();
  boosterIn.add(new THREE.Mesh(boosterGeo, boosterMat));
  const fins = new THREE.InstancedMesh(buildFin(V), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0 }), 4);
  fins.frustumCulled = false; boosterIn.add(fins);
  const plume = buildPlume(U, pal); boosterIn.add(plume);
  const nozGlow = buildNozzleGlow(U, pal), glowMesh = nozGlow.make(1); boosterIn.add(glowMesh);
  const vapour = buildVapour(U); boosterIn.add(vapour);
  await ctx.yield?.();

  // ----- upper stage and payload -----
  const upper = new THREE.Group(); object.add(upper);
  const upperMat = hullMaterial(U, { roll: [V.rollU, V.rollU + 1.7], glowCol: [1.5, 0.2, 0.045], accent });
  const upParts = buildUpper(rng, C, V); await ctx.yield?.();
  const pay = buildPayload(rng, noise, C, V); await ctx.yield?.();
  const upGeo = mergeGeometries([...upParts, ...pay.hull]); upParts.forEach((g) => g.dispose()); pay.hull.forEach((g) => g.dispose());
  upper.add(new THREE.Mesh(upGeo, upperMat));
  const foil = new THREE.Mesh(pay.foil, foilMaterial(U, [0.8, 0.46, 0.07])); upper.add(foil);
  await ctx.yield?.();

  // ----- fairing: two half shells on base hinges -----
  const fairGeo = buildFairingHalf(CF, V); await ctx.yield?.();
  const fairMat = hullMaterial(U, { glowCol: [1.5, 1.6, 1.9], fair: true, accent });
  const fairing = [0, 1].map((i) => {
    const wrap = new THREE.Group(); wrap.rotation.y = i * Math.PI;
    const pivot = new THREE.Group(); pivot.position.set(R, Y_FAIR, 0);
    const mesh = new THREE.Mesh(fairGeo, fairMat); mesh.position.set(-R, -Y_FAIR, 0); mesh.frustumCulled = false;
    pivot.add(mesh); wrap.add(pivot); object.add(wrap);
    return pivot;
  });
  // ----- effects that live in the vehicle's frame -----
  await ctx.yield?.();
  const flashMesh = buildFlash(U), glitter = buildGlitter(rng, U, Math.round(400 * detail)), flakes = buildFlakes(rng, U, Math.round(560 * detail));
  const rcs = buildRcs(U); upper.add(rcs);
  object.add(flashMesh, glitter, flakes);
  await ctx.yield?.();

  // ----- state and setters -----
  const state = { progress: opts.progress ?? 0, throttle: 0, pressure: 1, cloud: 0, frost: 1, shed: 0, vapour: 0, staging: 0, bell: 0, fairing: 0, fallSpeed: 10, altitude: 0 };
  let driven = false;
  const _m = new THREE.Matrix4();
  const setFins = (dep) => { for (let i = 0; i < 4; i++) { fins.setMatrixAt(i, _m.copy(onSkin(i * TAU / 4 + TAU / 8, TR(0, 45.8, R + 0.125, -dep * Math.PI / 2)))); } fins.instanceMatrix.needsUpdate = true; };
  setFins(0);
  const hero = {
    object, radius: 26, height: Y_TIP, center: new THREE.Vector3(0, 34, 0), ground: false, groundY: 0,
    state, uniforms: U, variant: V, flash: 0,
    parts: { booster: boosterPivot, upper, fairing, plume, flakes, glitter, foil, glow: glowMesh },
    makeNozzleGlow: (scale) => nozGlow.make(scale),   // another glow on the same material, for a side booster
    setThrottle(v) { driven = true; state.throttle = U.uThrottle.value = clamp(v, 0, 1); boosterMat.userData.u.uGlow.value = state.throttle; plume.visible = glowMesh.visible = state.throttle > 0.002 && boosterPivot.visible; },
    setPressure(v) { driven = true; state.pressure = U.uPress.value = clamp(v, 0, 1); },
    setAltitude(km) { state.altitude = km; hero.setPressure(Math.exp(-km / 7.2)); },
    setCloudGlow(v) { driven = true; state.cloud = U.uCloud.value = clamp(v, 0, 1); },
    setFrost(v) { driven = true; state.frost = U.uFrost.value = clamp(v, 0, 1); },
    setShed(v, fallSpeed) { driven = true; state.shed = U.uShed.value = clamp(v, 0, 1); if (fallSpeed != null) state.fallSpeed = fallSpeed; flakes.visible = state.shed > 0.004; },
    setVapour(v) { driven = true; state.vapour = U.uVapour.value = clamp(v, 0, 1); vapour.visible = v > 0.004 && boosterPivot.visible; },
    setBellGlow(v) { driven = true; state.bell = upperMat.userData.u.uGlow.value = clamp(v, 0, 1); },
    setFlash(v) { hero.flash = U.uFlash.value = clamp(v, 0, 1); flashMesh.visible = v > 0.004; },
    // 0 attached .. 1 gone: slides straight out of the interstage sleeve, then drifts to +Z (up in the aft view) and tumbles
    setStaging(s) {
      driven = true; s = state.staging = clamp(s, 0, 1); U.uStage.value = s;
      const d = 22 * s + 1500 * Math.pow(s, 1.6), k = smoothstep(5, 70, d);
      boosterPivot.position.set(V.tumble * 0.14 * d * k, 20 - d, 0.44 * d * k);
      const ang = Math.pow(Math.max(0, s - 0.012), 1.15) * 15;
      boosterPivot.rotation.set(-ang, 0.5 * ang * 0.13 * V.tumble, V.tumble * ang * 0.21);
      U.uDrift.value.set(boosterPivot.position.x, boosterPivot.position.y - 20, boosterPivot.position.z);
      setFins(smoothstep(0.035, 0.2, s));
      boosterPivot.visible = s < 0.999; glitter.visible = s > 0 && s < 0.999;
      if (!boosterPivot.visible) { plume.visible = false; glowMesh.visible = false; vapour.visible = false; }
    },
    // 0 closed .. 0.3 hinged open .. 1 released and gone aft, one half to each side of the pod
    setFairing(f) {
      driven = true; f = state.fairing = clamp(f, 0, 1);
      const open = smoothstep(0, 0.3, f), g = clamp((f - 0.3) / 0.7, 0, 1);
      for (let i = 0; i < 2; i++) {
        const p = fairing[i], sg = i ? -1 : 1;
        p.position.set(R + 0.9 * open * open + 5.2 * Math.pow(g, 0.8), Y_FAIR + 0.5 * open - 150 * g * g, sg * 1.2 * g);
        p.rotation.set(sg * 1.1 * g, sg * 0.5 * g, -(0.74 * open + 3.4 * g * (i ? 0.8 : 1)));
        p.visible = f < 0.999;
      }
    },
    setProgress(u) {
      u = state.progress = clamp(u, 0, 1); const t = u * 40;
      hero.setThrottle(smoothstep(0.15, 2, t) * (1 - smoothstep(21.85, 22.2, t)));
      hero.setAltitude(altitudeAt(t));
      const g = (c, w) => Math.exp(-((t - c) / w) * ((t - c) / w));
      hero.setCloudGlow(Math.min(1, g(9.1, 0.5) + g(12.6, 0.5) + g(15.1, 0.45)));
      hero.setFrost(1 - 0.22 * smoothstep(0.2, 3, t) - 0.66 * smoothstep(4, 21, t));
      const powered = t < 22.2;
      hero.setShed(powered ? (0.25 + 0.75 * smoothstep(0.3, 1.6, t)) * lerp(1, 0.55, smoothstep(3, 10, t)) : 0.12 + 0.4 * (1 - smoothstep(22.6, 29, t)),
        powered ? 9 + 55 * smoothstep(2, 15, t) : 0.7);
      hero.setVapour(smoothstep(12.9, 13.3, t) * (1 - smoothstep(14.6, 15.1, t)));
      const ts = t - 22.6;
      hero.setFlash(ts < 0 ? 0 : ts < 0.1 ? smoothstep(0, 0.1, ts) : 1 - smoothstep(0.1, 0.4, ts));
      hero.setStaging(ts / 7);
      hero.setBellGlow(smoothstep(22.7, 23.6, t) * (0.85 + 0.15 * Math.sin(t * 3)));
      hero.setFairing((t - 27.2) / 4.2);
      U.uRcs.value = smoothstep(23.0, 23.6, t);
    },
  };

  // ----- anchors (local space) -----
  const pod = new THREE.Vector3(...POD), aft = new THREE.Vector3(0, -Math.cos(12 * Math.PI / 180), Math.sin(12 * Math.PI / 180));
  const seat = pod.clone().add(new THREE.Vector3(0, 190, 0));
  hero.anchors = {
    pod, podNormal: new THREE.Vector3(0, 0, 1), aftView: aft, forwardView: new THREE.Vector3(0, 1, 0),
    portalSeat: { position: seat, facing: new THREE.Vector3(0, -1, 0) },
    flyThrough: [pod.clone(), pod.clone().setY(62), pod.clone().setY(Y_TIP + 6), pod.clone().setY(120), seat.clone()],
    stageBreak: new THREE.Vector3(0, Y_BREAK, 0), nozzles: new THREE.Vector3(0, 0, 0), payload: new THREE.Vector3(0, 59.9, 0),
    fairingTip: new THREE.Vector3(0, Y_TIP, 0), hinges: [new THREE.Vector3(R, Y_FAIR, 0), new THREE.Vector3(-R, Y_FAIR, 0)],
    towerSide: new THREE.Vector3(-1, 0, 0),
    viewpoints: {
      aft: { position: pod.clone(), target: pod.clone().addScaledVector(aft, 20), up: new THREE.Vector3(0, 0, 1) },
      forward: { position: pod.clone(), target: pod.clone().setY(80), up: new THREE.Vector3(0, 0, 1) },
      threeQuarter: { position: new THREE.Vector3(12, 60, 15), target: new THREE.Vector3(0, 58.5, 0), up: new THREE.Vector3(0, 1, 0) },
      mid: { position: new THREE.Vector3(7.5, 49, 9.5), target: new THREE.Vector3(0, 45, 0), up: new THREE.Vector3(0, 1, 0) },
      base: { position: new THREE.Vector3(9, -6, 12), target: new THREE.Vector3(0, 2.5, 0), up: new THREE.Vector3(0, 1, 0) },
      skin: { position: new THREE.Vector3(1.5, 53.6, 7.2), target: new THREE.Vector3(0, 53.2, 0), up: new THREE.Vector3(0, 1, 0) },
      far: { position: new THREE.Vector3(150, 10, 330), target: new THREE.Vector3(0, -90, 0), up: new THREE.Vector3(0, 1, 0) },
    },
  };

  const _size = new THREE.Vector2(); let fallAcc = 0;
  hero.setRimGlint = (v) => { fairMat.userData.u.uGlow.value = v; };
  // light from outside the vehicle, in VIEW space: towards the Earth's centre (earthlight, strength kd) and towards the sun (strength ks)
  hero.setSpaceLight = (downV, kd, sunV, ks) => { U.uDownV.value.set(downV.x, downV.y, downV.z, kd); U.uSunVw.value.set(sunV.x, sunV.y, sunV.z, ks); };
  hero.setProgress(state.progress); driven = false;
  hero.update = (dt, time, camera) => {
    U.uTime.value = time;
    if (!driven) { hero.setProgress((0.06 + time * 0.02) % 0.82); driven = false; }
    // flakes fall on the world clock plus whatever the flight adds, so they stream even when the flight is held still
    const base = state.fallSpeed > 5 ? 9 : 0.7;
    fallAcc = (fallAcc + (state.fallSpeed - base) * Math.min(dt, 0.1)) % 6200;
    U.uFall.value = (time * base + fallAcc) % 6200; U.uStreak.value = state.fallSpeed * 0.009;
    if (ctx.renderer) U.uPx.value = ctx.renderer.getDrawingBufferSize(_size).y;
  };
  hero.dispose = () => {};
  return hero;
}

// ---------- what the orbital leg arrives at: a station with solar wings, and a halo of ice round the portal ----------
// buildOrbit(ctx) -> { station (Group, local: X along the truss, Z along the modules, about 110 m across), SU (its uniforms:
// uSunL, uEarthL, uCamL in the station's local space, uSunCol, uShine), ice (Points round the origin in the XY plane, radius
// r0..r1; IU.uAmt 0..1, IU.uPx), dispose }. One draw each, no lights, no textures.
function stationGeometry(rng) {
  const parts = [];
  const add = (g, kind, m, su = 1, sv = 1) => {
    if (m) g.applyMatrix4(m);
    const n = g.attributes.position.count, k = new Float32Array(n).fill(kind), uv = g.attributes.uv;
    for (let i = 0; i < n; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
    g.setAttribute('aK', new THREE.BufferAttribute(k, 1)); parts.push(g.index ? g.toNonIndexed() : g);
  };
  const cyl = (r, len, kind, m, su, sv, r2 = r) => add(new THREE.CylinderGeometry(r2, r, len, 20, 1, false).rotateX(Math.PI / 2), kind, m, su, sv);
  // truss with its rail carts, antenna booms and a dish
  add(new THREE.BoxGeometry(104, 1.9, 1.9), 2, null, 52, 1);
  for (const x of [-52, -38, -24, 24, 38, 52]) add(new THREE.BoxGeometry(1.2, 3.4, 3.4), 0, TR(x, 0, 0), 1, 1);
  add(new THREE.BoxGeometry(5, 2.6, 4), 4, TR(-9, 2.2, 0), 2, 1); add(new THREE.BoxGeometry(4, 2.2, 3.4), 0, TR(11, 2.0, 0), 2, 1);
  add(new THREE.CylinderGeometry(0.12, 0.12, 9, 6), 2, TR(16, 5.4, 0)); add(new THREE.SphereGeometry(1.5, 12, 6, 0, TAU, 0, 1.1), 0, TR(16, 9.2, 0, Math.PI), 2, 2);
  add(new THREE.CylinderGeometry(0.1, 0.1, 7, 6), 2, TR(-19, -4.4, 0));
  // pressurised modules in a row along Z, nodes, two lateral labs, a cupola, docked craft at both ends
  let z = -27;
  for (const len of [9.5, 11, 8, 12, 9]) {
    cyl(2.25, len, 0, TR(0, -3.3, z + len / 2), 10, Math.round(len / 2)); cyl(2.4, 0.5, 2, TR(0, -3.3, z + len + 0.25), 4, 1);
    z += len + 0.5;
  }
  cyl(2.0, 10, 0, TR(-7.6, -3.3, 6, 0, Math.PI / 2), 10, 4); cyl(2.0, 9, 0, TR(7.2, -3.3, 6, 0, Math.PI / 2), 10, 4);
  cyl(1.9, 7, 4, TR(0, -8.4, -6, Math.PI / 2), 8, 3); cyl(1.5, 1.4, 5, TR(0, -6.4, 15, Math.PI / 2), 6, 1, 0.9);
  cyl(1.7, 6.4, 0, TR(0, -3.3, -30.6), 8, 3, 0.7); cyl(1.8, 7.2, 4, TR(0, -3.3, 27.4), 8, 3, 1.0);
  for (const s of [-1, 1]) { add(new THREE.BoxGeometry(7.5, 0.08, 2.4), 1, TR(s * 5.6, -3.3, -31), 6, 2); add(new THREE.BoxGeometry(7.5, 0.08, 2.4), 1, TR(s * 5.6, -3.3, 28), 6, 2); }
  // eight solar wings on four masts, turned a little to the sun; radiators hanging from the truss
  for (const x of [-46, -31, 31, 46]) for (const s of [-1, 1]) {
    const tilt = 0.5 + 0.12 * Math.sin(x), M = new THREE.Matrix4().makeRotationZ(tilt).setPosition(x, 0, 0);
    add(new THREE.CylinderGeometry(0.16, 0.16, 37, 6).rotateX(Math.PI / 2), 2, M.clone().multiply(TR(0, 0, s * 21.5)));
    for (const w of [-1, 1]) add(new THREE.BoxGeometry(5.3, 0.06, 34), 1, M.clone().multiply(TR(w * 2.95, 0, s * 22)), 4, 26);
    add(new THREE.BoxGeometry(11.4, 0.3, 0.5), 2, M.clone().multiply(TR(0, 0, s * 4.7)));
  }
  for (const x of [-15, 15]) for (let j = 0; j < 3; j++) add(new THREE.BoxGeometry(3.3, 13, 0.1), 3, TR(x + (j - 1) * 3.6, -8.4, 0.9, 0, 0.25 * (j - 1)), 1, 8);
  const g = mergeGeometries(parts); parts.forEach((p) => p.dispose());
  return g;
}

export async function buildOrbit(ctx, opts = {}) {
  const rng = opts.rng || ctx.rng.fork('orbit'), detail = ctx.quality?.detail ?? 1;
  const SU = { uTime: opts.uTime || { value: 0 }, uSunL: { value: new THREE.Vector3(0, 1, 0) }, uEarthL: { value: new THREE.Vector3(0, -1, 0) }, uCamL: { value: new THREE.Vector3() },
    uSunCol: { value: new THREE.Color(1, 0.86, 0.66) }, uShine: { value: new THREE.Color(0.34, 0.5, 0.85) } };
  const sGeo = stationGeometry(rng); await ctx.yield?.();
  const station = new THREE.Mesh(sGeo, new THREE.ShaderMaterial({
    uniforms: SU, fog: false,
    vertexShader: /* glsl */`attribute float aK; varying vec3 vN, vP; varying vec2 vUv; varying float vK;
      void main(){ vN = normal; vP = position; vUv = uv; vK = aK; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`uniform vec3 uSunL, uEarthL, uCamL, uSunCol, uShine; uniform float uTime; varying vec3 vN, vP; varying vec2 vUv; varying float vK;
      float h21(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
      void main(){
        vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), V = normalize(uCamL - vP + vec3(0., 0., 1e-5));
        if (dot(N, V) < 0.) N = -N;
        vec2 f = fract(vUv), cell = floor(vUv); float ln = min(min(f.x, 1. - f.x), min(f.y, 1. - f.y)), hc = h21(cell + floor(vK) * 7.);
        vec3 base = vec3(.6, .6, .58) * (.82 + .26 * hc); float spec = .25, gloss = 30., trans = 0., em = 0.;
        if (vK > .5 && vK < 1.5) {            // solar cells: deep blue faces ruled in silver, amber where the sun shines through
          base = mix(vec3(.012, .03, .11), vec3(.05, .09, .2), hc) * step(.07, ln) + vec3(.3, .3, .32) * (1. - step(.07, ln)); spec = 1.6; gloss = 90.; trans = 1.;
        } else if (vK > 1.5 && vK < 2.5) {    // truss: open lattice drawn as crossed members on dark
          float d1 = abs(f.x - f.y), d2 = abs(f.x + f.y - 1.); base = mix(vec3(.05, .05, .06), vec3(.42, .43, .46), 1. - smoothstep(.06, .16, min(min(d1, d2), ln * 1.6)));
        } else if (vK > 2.5 && vK < 3.5) { base = vec3(.72, .73, .74) * (.9 + .1 * step(.1, ln)); spec = .5; }
        else if (vK > 3.5 && vK < 4.5) { base = vec3(.62, .4, .09) * (.6 + .7 * hc); spec = 1.2; gloss = 16.; }
        else if (vK > 4.5) { base = vec3(.02, .03, .05); spec = 2.; gloss = 120.; }
        else {                                  // hull panels with seams, handrails and a few lit ports
          base *= .7 + .3 * step(.05, ln);
          em = step(.93, hc) * (1. - smoothstep(.1, .22, length(f - .5))) * (.7 + .3 * sin(uTime * 1.7 + hc * 40.));
        }
        float nl = dot(N, uSunL), ne = dot(N, uEarthL) * .5 + .5;
        vec3 col = base * (uSunCol * max(nl, 0.) * 2.4 + uShine * (.25 + ne * ne * 1.6) + vec3(.012, .014, .02));
        col += trans * vec3(.9, .42, .08) * uSunCol * max(-nl, 0.) * .5 * (.5 + .5 * step(.07, ln));
        float sp = max(dot(reflect(-V, N), uSunL), 0.); col += uSunCol * spec * pow(sp, gloss) * step(0., nl) * 1.4;
        float se = max(dot(reflect(-V, N), uEarthL), 0.); col += uShine * spec * .5 * se * se * se;
        col += vec3(1., .8, .5) * em * 2.2;
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  station.frustumCulled = false; station.matrixAutoUpdate = false;
  // navigation beacons: three slow breathing points (no strobe)
  const bGeo = new THREE.BufferGeometry(); bGeo.setAttribute('position', new THREE.Float32BufferAttribute([-52.6, 0, 0, 52.6, 0, 0, 0, -3.3, -34, 16, 10.6, 0], 3));
  bGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute([0.1, 0.6, 0.35, 0.8], 1));
  const BU = { uTime: SU.uTime, uPx: opts.uPx || { value: 900 } };
  const beacons = new THREE.Points(bGeo, new THREE.ShaderMaterial({
    uniforms: BU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: /* glsl */`attribute float aSeed; uniform float uTime, uPx; varying vec3 vC;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); float s = .5 + .5 * sin(uTime * 1.6 + aSeed * 6.2832);
        vC = mix(vec3(1., .12, .08), vec3(.2, 1., .3), step(.5, aSeed)) * (.35 + 2.2 * s * s);
        gl_PointSize = clamp(uPx * 1.6 / max(-mv.z, 1.), 2., uPx * .03); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`varying vec3 vC; void main(){ vec2 c = gl_PointCoord - .5; float a = 1. - smoothstep(0., 1., dot(c, c) * 4.); gl_FragColor = vec4(vC * a * a, 1.); }`,
  }));
  beacons.frustumCulled = false; station.add(beacons);
  await ctx.yield?.();
  return { station, SU, ...buildIceHalo(rng, opts, detail) };
}

// ice shed by the stage, gathered in a slow wheel round the exit: points in the XY plane about the origin
function buildIceHalo(rng, opts, detail) {
  const r0 = opts.iceR0 ?? 9.6, r1 = opts.iceR1 ?? 26, n = Math.round(1500 * detail);
  const pos = new Float32Array(n * 3), seed = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const k = Math.pow(rng(), 2.2), r = r0 + (r1 - r0) * k;
    pos.set([r, rng() * TAU, (rng() - 0.5) * (3 + 16 * k)], i * 3); seed.set([rng(), rng(), rng(), rng()], i * 4);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const IU = { uTime: opts.uTime || { value: 0 }, uPx: opts.uPx || { value: 900 }, uAmt: { value: 0 }, uTint: { value: new THREE.Color(1, 0.9, 0.78) } };
  const ice = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: IU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: /* glsl */`attribute vec4 aSeed; uniform float uTime, uPx, uAmt; varying float vA, vBig; varying vec3 vC;
      void main(){
        float ang = position.y + uTime * (.05 + .07 * aSeed.x) * (1. - .5 * step(.5, aSeed.w)), r = position.x * (1. + .03 * sin(uTime * .4 + aSeed.y * 30.));
        vec3 p = vec3(cos(ang) * r, sin(ang) * r, position.z + sin(uTime * .3 + aSeed.z * 20.) * .8);
        vec4 mv = modelViewMatrix * vec4(p, 1.); float dist = max(-mv.z, .3);
        float s = sin(uTime * (1.2 + 5. * aSeed.w) + aSeed.z * 60.) * .5 + .5, tw = s * s * s * s;
        vBig = step(.9, aSeed.y);
        vA = uAmt * (.3 + 2.8 * tw + vBig * 1.2) * smoothstep(1.2, 4., dist) * clamp(uPx * .09 / dist, .22, 1.);
        vC = mix(vec3(.8, .9, 1.), vec3(1., .86, .66), aSeed.x * aSeed.x);
        gl_PointSize = clamp(uPx * (.1 + .16 * aSeed.z + .5 * vBig) / dist, 1.8 + 1.4 * vBig, uPx * .035);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`varying float vA, vBig; varying vec3 vC;
      void main(){ vec2 c = (gl_PointCoord - .5) * 2.; float d = dot(c, c), a = 1. - smoothstep(0., 1., d);
        float ray = (1. - smoothstep(0., .12, abs(c.x))) * (1. - abs(c.y)) + (1. - smoothstep(0., .12, abs(c.y))) * (1. - abs(c.x));
        gl_FragColor = vec4(vC * vA * (a * a * a * 2.4 + vBig * ray * a * .9), 1.); }`,
  }));
  ice.frustumCulled = false; ice.renderOrder = 6;
  return { ice, IU };
}
