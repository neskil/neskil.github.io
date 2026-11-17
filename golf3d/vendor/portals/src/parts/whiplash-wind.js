// HERO SET PIECE + STYLE KIT for "whiplash-wind" (The Wind Comes Home): THE ROUNDEL, and the lithograph it is printed in.
//
// WHAT IT IS
//   A disc 120 m across standing on its edge on the summit, facing +Z, nobody in front of it. Origin = base centre
//   (the ground under the disc), +Y up; the centre of the disc is (0, 62, 0), its front face is at z = +1.7.
//   Centre outward: the open ring (radius 7, olive rim with a row of gold chips) | gold mosaic to r 20.6 (5,600
//   instanced chips laid in arcs, each brushed and tilted differently) | grey-teal band to r 32 with 24 four-pointed
//   gold stars | sage band to r 54 with 10-14 cream lilies (gold stamens, teal stems and leaves interlaced) | olive
//   rim to r 60 with 32-40 gold studs. Five tresses come over the brow from the front, swing to the right foot of
//   the disc, rise in a sheaf, hook over and wind on clockwise, each turn laid beside the last, inward over the
//   lily band (setProgress grows the coil; the wound end tapers to a whiplash point). Two gold hairpins 70 m long
//   with rose cabochons are crossed through the coil at the upper left. ~300 tall lilies in ranks at the foot bend
//   with the bend field. An optional sage summit mound (opts.mound) carries it in the viewer.
//   radius 78, height 138 (pins and hook included). ~147k triangles at detail 1, 9 draw calls (+2 mound, +1 sky),
//   no lights, no textures, ~300 ms build in yielded steps.
//
// THE STYLE KIT:  const style = makeStyle(ctx, { palette?, exposure?, sun?, grain? })   (pass it on as opts.style)
//   style.pal        linear "ink" Colors: cream sage olive rose peach teal gold, their second tones ochre sage2 rose2
//                    teal2 cream2, and bronze / goldHot. They are pre-inverted through the engine's tone curve
//                    (toInk) so each prints as its hex AT post.exposure = 2.2 (WW_EXPOSURE). Cream is 0.75 linear,
//                    so nothing but gold (up to ~1.7) reaches the bloom threshold. Use toInk('#hex') for new inks.
//   style.ink(o)     THE flat material (unlit): flat ink + hard-edged second tone + crayon grain + olive line drawn
//                    with fwidth from a per-vertex distance-to-outline + gold. o: { bendy, inst, grainScale, lineGain,
//                    lineHold, side }. Geometry needs attributes ink(3), aux(4), normal, bnd(1): see INK below, or
//                    just build with style.batch() / ribbon() / fan() / geometry().
//   style.hull(o)    silhouette keyline for solids: inverted hull in olive, pushed in clip space by o.weight (fraction
//                    of frame width: 0.0035 near, 0.002 mid, 0.0012 far) and shifted by the constant hair uHair.
//   style.hair(o)    a tress (see HAIR below) for geometry from style.tressGeometry(points, o).
//   style.sky(o)     the dome: split-fountain blend, scroll frieze, nine gold stars. scene.add(style.sky()) once.
//   style.batch() / ribbon(b, pts, o) / fan(b, centre, ring, o) / geometry(b) / whiplash(o) / frames(pts, n)
//   style.uniforms   shared by every material: uTime, uSun, uPaper, uOlive, uTint, uBronze, uGold, uGoldHot,
//                    uPlane (hairlines go 260-620 m, colour pales 900-4000 m), uGrain, uOff, uHair, uBend, uBendDir.
//   style.update(dt, time, camera)   every frame (sets uTime; scales the misregistration to the frame).
//   style.setSun(v)  WORLD-space direction to the undrawn port-side sun. Default (-0.93, 0.26, 0.26) is right for the
//                    hero unrotated (lit from the left seen from the front). If the world turns the hero to face -Z,
//                    pass (0.93, 0.26, -0.26), i.e. port of a +Z course.
//   style.setBend(dirX, dirZ, amp, gust)   the bend field: direction the nearest tress flows; everything built with
//                    { bendy: true } and a bnd attribute (0 root .. 1 tip) takes the travelling S.
//   How each rule of the styleNote is kept: flats = style.ink, nothing lit; second tone = aux.z mask, hard threshold,
//   ink mixed 58 % toward olive (wwTone); keyline = hull (heavy, solids) + in-material line (thick outside the bend:
//   ribbon() bakes signed curvature into the line width; hair does it live with the wave); colour a hair off its
//   line = uOff / uHair (bare paper shows in the sliver); grain = object-space stipple toward paper, coarser with a
//   smaller grainScale; gold = wwGold(): bronze turned away, gold, hot pale gold where the brush direction (aux.w 1)
//   or the normal (aux.w 2) answers uSun, a comb phase walking the glint, a bright lip at its edges; distance =
//   lines under 1.3 px fade (lineHold 0) before the colour pales to paper (uPlane). No full-screen pass is needed.
//
// ADDED BY THE WORLD BUILDER (all optional, defaults leave the hero as it was):
//   style.inkWith(vertexShader, uniforms, o)   flat ink with a world-supplied vertex shader (creatures, ripples); it
//                    must write vInk vAux vWp vG vPh vDist as INK_VERT does. style.toInk(hex), style.hairInk (Color the
//                    coil and every tress default to).  ink({ comb: true, combZ, combSpacing, combGain }) draws the
//                    hill grass (combed hairline strokes) and curves the second-tone edges with noise.
//   uniforms uRing (x, z, radius, amp: the snap's bowing ring) and uPass (x, z, reach, amp: the tress tip passing)
//                    feed the bend field; instanced bendy things take iA.w as extra bend gain.
//   hair uniforms uTip (x: arc length of the free tip, y: 1 = calm and taper near it) and uTipS (nothing drawn before it).
//   buildHero opts.joinFeet: the feeders' sway and roll ease to zero at their feet so the world's plaits can join them.
//
// buildHero(ctx, opts)   opts: { style, palette (7 hex), detail (0.6-1: chips and foot lilies), mound (true),
//   hillY (x,z)=>y of the world's summit if it differs, progress (0.6), sky (false), exposure }
//   TO JUDGE IT ALONE AS THE WORLD WILL SHOW IT (the viewer runs at exposure 1, the style at 2.2):
//     node tools/shot.mjs _part --query "part=whiplash-wind&bg=dusk&wwsky=1" --pre "window.__engine.cur.post.exposure=2.2" ...
//   returns { object, radius, height, center, anchors, style, update, setProgress(u), setLetDown(v), dispose }
//   setProgress(u)   0..1 of the journey: the coil grows from 0.7 to 1.45 turns (never wall-clock).
//   setLetDown(v)    0..1 rare event: the pins slide out (v < 0.45), then the coil unwinds back to the hook.
//   update(dt, time, camera) drives style.update only when the hero made its own style.
// anchors (local space)
//   portalSeat { position (0,62,0), normal +Z, radius 7 }   the 14 m portal, level, in the open centre
//   flyThrough  12 points: one tightening corkscrew turn from 210 m out and 45 m under the axis (swinging to the
//               viewer's right first) to 70 m out, then dead straight down the axis and through. Clear by > 15 m.
//   tressFeet   5 x { position, direction, halfWidth }: where the hero's tresses start on the hill (80-140 m in
//               front, 2 m over hillY); bring the world's plaits to these and they continue onto the disc.
//   hairpinCross, viewpoints[4], hillY(x,z), discRadius, centreY, faceZ
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const WW_PALETTE = ['#F2E8CF', '#A3B18A', '#3B3F22', '#D4918C', '#F3BE94', '#5E8C8A', '#C8A24B'];

// ---------------------------------------------------------------------------------------------------------
// Ink: the post chain is  col * exposure / 0.6 -> ACES (Hill fit, with its colour matrices) -> saturation 1.05 ->
// contrast 1.04 -> sRGB, and bloom takes what is over its threshold BEFORE exposure. toInk() inverts that chain
// exactly, so a flat prints as its hex. Cream paper needs 2.04 linear at exposure 1, far over the bloom threshold,
// so the style assumes the world runs at post.exposure = WW_EXPOSURE (2.2): cream then sits at 0.93 and only gold
// (up to 2.2) is HDR. Flats are capped at 0.96.
export const WW_EXPOSURE = 2.2;
const _inM = new THREE.Matrix3().set(0.59719, 0.35458, 0.04823, 0.07600, 0.90834, 0.01566, 0.02840, 0.13383, 0.83777);
const _outM = new THREE.Matrix3().set(1.60475, -0.53108, -0.07367, -0.10208, 1.10813, -0.00605, -0.00327, -0.07276, 1.07602);
const _inInv = _inM.clone().invert(), _outInv = _outM.clone().invert();
function invFit(y) {
  y = Math.min(Math.max(y, 0), 0.97);
  const a = 1 - 0.983729 * y, b = 0.0245786 - 0.432951 * y, c = -(0.000090537 + 0.238081 * y);
  return (-b + Math.sqrt(Math.max(b * b - 4 * a * c, 0))) / (2 * a);
}
export function toInk(hex, exposure = WW_EXPOSURE, cap = 0.96) { return toInkAt(hex, exposure, cap); }
function toInkAt(hex, exposure, cap = 0.96) {
  const c = new THREE.Color(hex), v = new THREE.Vector3(c.r, c.g, c.b);
  v.addScalar(-0.5).multiplyScalar(1 / 1.04).addScalar(0.5);                    // contrast
  const l = (0.2126 * v.x + 0.7152 * v.y + 0.0722 * v.z); v.set(l + (v.x - l) / 1.05, l + (v.y - l) / 1.05, l + (v.z - l) / 1.05);
  v.applyMatrix3(_outInv); v.set(invFit(v.x), invFit(v.y), invFit(v.z)); v.applyMatrix3(_inInv);
  const k = 0.6 / exposure, f = (x) => Math.min(Math.max(x * k, 0.002), cap);
  return new THREE.Color(f(v.x), f(v.y), f(v.z));
}

// GLSL shared by every material of the style ---------------------------------------------------------------
const WW_COMMON = /* glsl */`
uniform float uTime;
uniform vec3 uSun;        // unit vector toward the undrawn port-side sun (world space): only gold answers to it
uniform vec3 uPaper;      // bare cream paper
uniform vec3 uOlive;      // keyline ink
uniform vec3 uTint;       // the transparent olive tint stone: every second tone is its ink 58 percent under this
uniform vec3 uBronze;     // gold turned away
uniform vec3 uGold;       // gold, the printed bronze-powder working
uniform vec3 uGoldHot;    // gold catching the sun (HDR, the only value over 1)
uniform vec4 uPlane;      // x,y: distance over which inner hairlines go; z,w: distance over which colour pales
uniform float uGrain;     // crayon grain strength
float wwHash(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float wwNoise(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(wwHash(i), wwHash(i + vec3(1,0,0)), f.x), mix(wwHash(i + vec3(0,1,0)), wwHash(i + vec3(1,1,0)), f.x), f.y);
  float b = mix(mix(wwHash(i + vec3(0,0,1)), wwHash(i + vec3(1,0,1)), f.x), mix(wwHash(i + vec3(0,1,1)), wwHash(i + vec3(1,1,1)), f.x), f.y);
  return mix(a, b, f.z);
}
// crayon grain: paper showing through the flat as soft stipple; scale = stipples per metre (coarser in big flats)
vec3 wwGrain(vec3 col, vec3 p, float scale, float fw){
  if (scale < 0.0) {                                                // stipple: hard little dots of bare paper, in clusters
    float sc = -scale;
    float keepS = clamp(1.0 - fw * sc * 1.2, 0.0, 1.0);
    float dots = smoothstep(0.69, 0.75, wwNoise(p * sc)) * smoothstep(0.40, 0.60, wwNoise(p * sc * 0.09 + 3.7));
    float lumS = dot(col, vec3(0.3, 0.6, 0.1)) / max(dot(uPaper, vec3(0.3, 0.6, 0.1)), 1e-3);
    return mix(col, uPaper, min(uGrain * 2.2, 1.0) * keepS * smoothstep(0.08, 0.5, lumS) * dots);
  }
  float g = wwNoise(p * scale) * 0.65 + wwNoise(p * scale * 2.7 + 7.1) * 0.35;
  float keep = clamp(1.0 - fw * scale * 0.9, 0.0, 1.0);          // fades before it can shimmer
  float lum = dot(col, vec3(0.3, 0.6, 0.1)) / max(dot(uPaper, vec3(0.3, 0.6, 0.1)), 1e-3);
  return mix(col, uPaper, uGrain * keep * smoothstep(0.08, 0.5, lum) * smoothstep(0.50, 0.78, g));
}
// the second tone: the same ink under the transparent olive tint
vec3 wwTone(vec3 ink){ return mix(ink, uTint, 0.58); }
// bronze-powder gold. g = strand / brush direction (aniso > 0.5) or surface normal (aniso < 0.5), V = to eye.
// Dark bronze turned away, hot pale gold when it catches uSun; 'phase' walks the glint from one piece to the next.
vec3 wwGold(vec3 g, vec3 V, float phase, float aniso){
  vec3 hv = uSun + V; float hl = length(hv);
  vec3 H = hl > 1e-3 ? hv / hl : vec3(0.0, 1.0, 0.0);
  float d = dot(g, H);
  float comb = 0.5 + 0.5 * sin(phase - uTime * 1.7);              // the comb drawn through: glints take turns
  float sA = 1.0 - d * d; sA = max(sA, 0.0);
  float kA = sA * sA; kA *= kA; kA *= kA; kA *= kA;               // (1-d^2)^16: tight band where g is square to H
  float dB = max(d, 0.0);
  float kB = dB * dB; kB *= kB; kB *= kB; kB *= dB * dB;          // d^10
  float k = mix(kB, kA, step(0.5, aniso));
  float w = mix(max(d, 0.0), sA * sA, step(0.5, aniso));           // broad lobe: where the metal is merely turned toward the light
  float lit = smoothstep(0.40, 0.56, w * (0.75 + 0.5 * comb));     // bronze -> gold, a printed step
  float hot = smoothstep(0.45, 0.80, k * (0.55 + 0.75 * comb));    // gold -> hot pale gold
  return mix(mix(uBronze, uGold, lit), uGoldHot, hot);
}
// distance by plane: 1 near -> 0 far for inner hairlines; colour pales toward paper
float wwInner(float dist){ return 1.0 - smoothstep(uPlane.x, uPlane.y, dist); }
vec3 wwPale(vec3 col, float dist){ return mix(col, uPaper, 0.72 * smoothstep(uPlane.z, uPlane.w, dist)); }
`;

// vertex chunk: the bend field. Everything the hair passes takes its curve: an S profile along the object's
// own height (hgt 0 at the root .. 1 at the tip), travelling with uTime, in the direction uBendDir (world xz).
const WW_BEND = /* glsl */`
uniform vec4 uBend;       // x amplitude (m at the tip), y wavelength (m), z speed (m/s), w extra gust 0..1 (world-driven)
uniform vec2 uBendDir;    // unit xz direction the nearest tress is flowing
uniform vec4 uRing;       // the snap: x,z centre, radius (m) of the ring now passing, amplitude (m at the tip)
uniform vec4 uPass;       // the hair passing: x,z of the tress tip, reach (m), amplitude (m at the tip)
vec3 wwBend(vec3 wp, vec3 root, float hgt, float seed){
  vec2 rd = root.xz - uRing.xy; float rl = length(rd);
  float rq = (rl - uRing.z) / 7.0;
  float ring = exp(-rq * rq) * uRing.w;
  vec2 pd = root.xz - uPass.xy; float pl = length(pd);
  float pq = pl / max(uPass.z, 1.0);
  float pass2 = exp(-pq * pq) * uPass.w;
  vec2 outw = rl > 1e-3 ? rd / rl : vec2(0.0);
  wp.xz += outw * ring * hgt * (0.4 + 0.6 * hgt);
  wp.y -= ring * 0.45 * hgt * hgt;
  float ph = (dot(root.xz, uBendDir) - uTime * uBend.z) * 6.2831853 / max(uBend.y, 1.0) + seed * 0.7;
  float pass = 0.5 + 0.5 * sin(ph);                                // the curve passing through
  pass = pass * pass * (3.0 - 2.0 * pass);
  float amp = uBend.x * (0.25 + 0.75 * pass + uBend.w) + pass2;
  float sShape = sin(hgt * 3.9 - 0.7 + 0.6 * sin(ph)) * hgt;       // an S, with its quick return at the tip
  vec2 side = vec2(-uBendDir.y, uBendDir.x);
  wp.xz += (uBendDir * 0.55 + side * 0.45) * amp * sShape;
  wp.y -= amp * 0.18 * hgt * hgt * pass;
  return wp;
}
`;

// INK: every flat in the world. Unlit. One flat ink + its hard-edged second tone + crayon grain + the olive line
// drawn from a per-vertex distance-to-outline, + gold where aux.w says so. Vertex attributes:
//   ink  vec3   the flat (linear, from style.pal)
//   aux  vec4   x = distance to the shape's outline in metres (use 99 for "no line"), y = line width in metres
//               (already thick-outside / thin-inside: ribbon() bakes that), z = second-tone mask (hard at 0.5),
//               w = 0 flat ink | 1 gold, anisotropic (normal attribute = brush direction) | 2 gold, by normal
//   normal      only read by gold
//   bnd  float  (define WW_BENDY) 0 root .. 1 tip, for the bend field;  iA vec4 (define WW_INST) per instance:
//               x = seed/phase, y = gold phase, z = ink shift toward second tone 0..1, w free
const INK_VERT = /* glsl */`
attribute vec3 ink; attribute vec4 aux;
#ifdef WW_BENDY
attribute float bnd;
#endif
#ifdef WW_INST
attribute vec4 iA;
#endif
varying vec3 vInk; varying vec4 vAux; varying vec3 vWp; varying vec3 vG; varying vec3 vPh; varying float vDist;
${WW_COMMON}
${WW_BEND}
void main(){
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
  #endif
  vec4 wp = m * vec4(position, 1.0);
  #ifdef WW_ROSETTE
  wp.xyz = mix(m[3].xyz, wp.xyz, 1.0 - smoothstep(110.0, 190.0, distance(m[3].xyz, cameraPosition)));
  #endif
  vec3 ph = vec3(0.0);
  #ifdef WW_INST
  ph = iA.xyz;
  #endif
  #ifdef WW_BENDY
  float bg = 1.0;
  #ifdef WW_INST
  bg += iA.w;                                                      // tall things take a bigger curve
  #endif
  wp.xyz += (wwBend(wp.xyz, m[3].xyz, bnd, ph.x) - wp.xyz) * bg;
  #endif
  vec3 g = mat3(m) * normal;
  float gl = length(g);
  vG = gl > 1e-5 ? g / gl : vec3(0.0, 0.0, 1.0);
  vInk = ink; vAux = aux; vWp = wp.xyz; vPh = ph;
  vec4 mv = viewMatrix * wp;
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const INK_FRAG = /* glsl */`
varying vec3 vInk; varying vec4 vAux; varying vec3 vWp; varying vec3 vG; varying vec3 vPh; varying float vDist;
${WW_COMMON}
uniform vec2 uOff;        // the hand's fault: the colour lies this many pixels off its keyline, everywhere
uniform float uGrainScale;
uniform float uLineGain;  // 1 = full keyline, 0 = none (far planes)
uniform float uLineHold;  // 0: a line thinner than a pixel fades out (inner lines) .. 1: it holds 1.3 px (silhouettes)
#ifdef WW_COMB
uniform vec4 uComb;       // hill grass: x = z the strokes are combed toward, y = spacing (m), z = gain, w = slide (m/s)
uniform vec4 uField;      // x: 0 none | 1 flower drifts (land) | 2 the darker reach (water); y: disc cell (m); z: rosette cell (m); w: amount
uniform vec3 uDriftInk;   // the flowers' ink
float wwRiverZ(float x){ return 425.0 + 26.0 * sin(x * 0.0045 + 0.6); }
// how full a place is, 0..1 (evaluated at a disc's centre, so a drift is whole discs)
float wwOcc(vec2 c, float mode){
  float rz = wwRiverZ(c.x);
  if (mode > 1.5) {                                                 // one long reach meandering down the river, a whiplash band
    float zc = rz + 21.0 * sin(c.x * 0.017 + 0.8) + 6.0 * sin(c.x * 0.041);
    float w = 11.0 + 7.0 * sin(c.x * 0.012 + 2.0);
    return 1.0 - smoothstep(w - 3.0, w + 3.0, abs(c.y - zc));
  }
  float n = wwNoise(vec3(c.x * 0.013, c.y * 0.009, 2.3));
  float n2 = wwNoise(vec3(c.x * 0.004, c.y * 0.004, 8.1));
  float beside = exp(-c.x * c.x / 9000.0);                          // densest beside the ridden tress
  float down = 1.0 - smoothstep(rz - 105.0, rz - 62.0, c.y);        // the flower down, this side of the river
  float hill = smoothstep(rz + 70.0, rz + 130.0, c.y) * (1.0 - smoothstep(60.0, 150.0, 240.0 - length(vec2(c.x, c.y - 910.0))));
  float cl = smoothstep(0.46, 0.62, n + 0.25 * (n2 - 0.5));         // flowers grow in drifts: full inside, thin between
  float occ = down * (cl * 0.92 + (1.0 - cl) * 0.34 * beside) + hill * cl * 0.85 * smoothstep(0.35, 0.6, n2);
  return clamp(occ * uField.w, 0.0, 1.0);
}
// a drawn drift: the union of jittered discs, so its edge is scalloped. Metres inside (+) or outside (-).
float wwDiscs(vec2 p, float cell, float mode){
  vec2 ci = floor(p / cell);
  float best = -cell;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 c = ci + vec2(float(i), float(j));
      float h1 = wwHash(vec3(c, 1.3)), h2 = wwHash(vec3(c, 4.7)), h3 = wwHash(vec3(c, 9.1));
      vec2 ctr = (c + 0.5 + 0.7 * (vec2(h1, h2) - 0.5)) * cell;
      float occ = wwOcc(ctr, mode);
      float r = cell * (0.50 + 0.34 * h1) * step(h3, occ);
      best = max(best, r - length(p - ctr) - cell * (1.0 - step(h3, occ)));
    }
  }
  return best;
}
#endif
void main(){
  float e = vAux.x, lw = vAux.y;
  float tzR = 0.0, heart = 0.0;
  bool cut = false;                                                  // the rosette's outside: cut away LAST (see the end of main)
  #ifdef WW_ROSETTE
  if (vAux.x < 50.0) {                                               // a four-petalled rosette drawn on one quad: aux.xy = -1..1 across it
    vec2 q = vAux.xy; float r2 = dot(q, q), rr = sqrt(r2);
    float c2 = (q.x * q.x - q.y * q.y) / max(r2, 1e-4);
    float er = 0.36 + 0.62 * sqrt(abs(c2)) - rr;
    cut = er < 0.0;
    e = er * 0.42; lw = 0.05;
    tzR = step(abs(q.y), q.x);                                       // one petal darker
    heart = max(1.0 - smoothstep(0.13, 0.17, rr), (1.0 - smoothstep(0.02, 0.05, abs(abs(q.x) - abs(q.y)))) * (1.0 - smoothstep(0.30, 0.42, rr)));
  }
  #endif
  float fe = fwidth(e) + 1e-5;
  float fp = max(fwidth(vWp.x), max(fwidth(vWp.y), fwidth(vWp.z)));
  vec3 dv = cameraPosition - vWp; float dl = length(dv);
  vec3 V = dl > 1e-4 ? dv / dl : vec3(0.0, 0.0, 1.0);
  // flat + second tone (a drawn shape with a hard edge)
  float tz = vAux.z + vPh.z + tzR;
  #ifdef WW_COMB
  tz += (wwNoise(vec3(vWp.x * 0.016, vWp.z * 0.010, 1.7)) - 0.5) * 1.9 + (wwNoise(vec3(vWp.x * 0.05, vWp.z * 0.035, 5.2)) - 0.5) * 0.5;   // the hollows' edges are drawn curves, not the mesh
  float fld = 0.0, fldLine = 0.0;
  if (uField.x > 0.5) {
    float dsc = wwDiscs(vWp.xz, uField.y, uField.x);
    float fd = fwidth(dsc) + 1e-4;
    fld = smoothstep(-fd, fd, dsc);
    float lwD = max(0.16, 0.7 * fd);
    fldLine = (1.0 - smoothstep(lwD, lwD + fd, abs(dsc))) * wwInner(vDist);
    if (uField.x > 1.5) tz = fld;                                    // the river's second tone is this one drawn reach
  }
  #endif
  float ft = fwidth(tz) + 1e-4;
  float tone = smoothstep(0.5 - ft, 0.5 + ft, tz);
  vec3 col = mix(vInk, wwTone(vInk), tone);
  #ifdef WW_COMB
  if (uField.x > 0.5 && uField.x < 1.5) {
    // inside a drift the flat is flowers: near the eye each one a rosette lying on the ground, far off one flat of their ink
    vec2 g = vWp.xz / max(uField.z, 0.1), gi = floor(g);
    float fg = max(fwidth(g.x), fwidth(g.y));
    vec2 jt = vec2(wwHash(vec3(gi, 2.1)), wwHash(vec3(gi, 6.3)));
    vec2 q = (fract(g) - 0.5 - 0.34 * (jt - 0.5)) * (3.3 + 1.6 * fract(jt.x * 7.3 + jt.y * 3.1));
    float qa = 6.2831853 * jt.x, qc = cos(qa), qs = sin(qa); q = vec2(q.x * qc - q.y * qs, q.x * qs + q.y * qc);
    float r2 = dot(q, q), rr = sqrt(r2);
    float c2 = (q.x * q.x - q.y * q.y) / max(r2, 1e-4);
    float er = 0.40 + 0.58 * sqrt(abs(c2)) - rr;
    float fr = fg * 4.0 + 1e-4;
    float ros = smoothstep(-fr, fr, er) * step(0.22, fract(jt.y * 5.7 + jt.x));
    float farK = smoothstep(0.10, 0.34, fg);                         // rosettes run together into the flat
    float cov = mix(ros, 1.0, farK) * fld;
    vec3 dcol = mix(uDriftInk, wwTone(uDriftInk), max(tone, step(abs(q.y), q.x) * (1.0 - farK)));
    float rl = (1.0 - smoothstep(0.05, 0.05 + fr, abs(er - 0.05))) * (1.0 - smoothstep(0.03, 0.12, fg));
    col = mix(col, mix(dcol, uOlive, rl), cov);
    col = mix(col, uOlive, fldLine * farK * 0.85);
  }
  #endif
  col = wwGrain(col, vWp, uGrainScale, fp);
  #ifdef WW_COMB
  {
    // hill grass is not blades: hairline contour strokes on the flat, combed toward the roundel, sliding home
    float den = max(uComb.x - vWp.z, 70.0);
    float q = (vWp.x * 420.0 / den + 7.0 * sin(vWp.z * 0.021 + vWp.x * 0.011) + 2.6 * sin(vWp.z * 0.067 - vWp.x * 0.03) + 0.9 * sin(vWp.z * 0.15 + vWp.x * 0.06)) / max(uComb.y, 0.1);
    float fq = fwidth(q) + 1e-4;
    float cell = floor(q), dq = abs(fract(q) - 0.5);
    float h1 = wwHash(vec3(cell, 3.0, 7.0));
    float al = (vWp.z + vWp.y * 0.6 + uTime * uComb.w) * 0.15 + h1 * 40.0;
    float sl = sin(al + 1.3 * sin(al * 0.37));
    float dash = smoothstep(0.05, 0.6, sl);                          // a stroke swells in its middle and ends in a point
    float wq = max(0.035 * dash, 0.6 * fq);
    float ln = (1.0 - smoothstep(wq - 0.5 * fq, wq + 0.5 * fq, dq)) * step(0.02, dash) * step(0.35, h1);
    ln *= clamp(0.16 / fq, 0.0, 1.0) * uComb.z * (1.0 - smoothstep(0.55, 0.9, fq * 4.0));
    col = mix(col, mix(col, uOlive, 0.8), ln * (1.0 - fld));
  }
  #endif
  col = wwPale(col, vDist);
  if (vAux.w > 0.5) {
    col = wwGold(vG, V, vPh.y + vWp.x * 0.11 + vWp.y * 0.07, step(vAux.w, 1.5));
    // laid slightly thick: it stands proud at its edges, a bright lip just inside the line
    float lip = (1.0 - smoothstep(lw + 1.0 * fe, lw + 2.6 * fe, e)) * step(e, 90.0);
    col += uGoldHot * 0.28 * lip;
  }
  // colour off its keyline: the fill is evaluated a hair away, bare paper shows in the sliver
  float e2 = e + dFdx(e) * uOff.x + dFdy(e) * uOff.y;
  float fill = smoothstep(0.0, fe * 0.8, e2 - lw * 0.35);
  float res = clamp(lw / (1.3 * fe), 0.0, 1.0);                    // 1 when the line is at least 1.3 px wide: distance takes it away
  res = mix(res, 1.0, uLineHold);
  col = mix(col, mix(uPaper, col, max(fill, step(90.0, e))), res);
  // the keyline: never under ~1.3 px, inner hairlines (thin ones) go first with distance
  float wpx = max(lw, 1.3 * fe);
  float line = 1.0 - smoothstep(wpx - fe * 0.6, wpx + fe * 0.6, e);
  line *= uLineGain * res;
  col = mix(col, uOlive, line * step(e, 90.0));
  col = mix(col, uOlive, heart * res);
  // The cut comes after every fwidth and dFdx above. A discard before them leaves the derivatives of the pixels beside the cut
  // undefined: the software renderer (and a strict driver) then draws each rosette's rim differently in every frame.
  #ifdef WW_ROSETTE
  if (cut) discard;                                                  // (inside the define, so only the poppies' text holds a discard, as before)
  #endif
  gl_FragColor = vec4(col, 1.0);
}`;

// HULL: the heavy silhouette keyline of a solid: the same mesh drawn back-faces-only in olive, pushed out along
// its normal in clip space by a fraction of the frame width (so the line keeps its weight in the picture, and
// thins by plane), and then shifted by the constant hair so fill and line sit slightly off.
const HULL_VERT = /* glsl */`
uniform float uHull;      // line weight as a fraction of frame width (0.0035 heavy near .. 0.0012 far)
uniform vec2 uHair;       // constant clip-space shift (0.12 percent of frame width)
uniform vec4 uPlane;
#ifdef WW_BENDY
attribute float bnd;
#endif
#ifdef WW_INST
attribute vec4 iA;
#endif
uniform float uTime;
${WW_BEND}
void main(){
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
  #endif
  vec4 wp = m * vec4(position, 1.0);
  #ifdef WW_BENDY
  float sd = 0.0;
  #ifdef WW_INST
  sd = iA.x;
  #endif
  float bg = 1.0;
  #ifdef WW_INST
  bg += iA.w;
  #endif
  wp.xyz += (wwBend(wp.xyz, m[3].xyz, bnd, sd) - wp.xyz) * bg;
  #endif
  vec4 mv = viewMatrix * wp;
  vec4 p = projectionMatrix * mv;
  vec3 nv = mat3(viewMatrix) * (mat3(m) * normal);
  vec2 n2 = nv.xy; float nl = length(n2);
  n2 = nl > 1e-5 ? n2 / nl : vec2(0.0);
  float aspect = projectionMatrix[1][1] / max(projectionMatrix[0][0], 1e-4);
  float w = uHull * mix(1.0, 0.4, smoothstep(uPlane.x, uPlane.w, length(mv.xyz)));
  p.xy += (n2 * w * 2.0 + uHair) * vec2(1.0, aspect) * p.w;
  gl_Position = p;
}`;
const HULL_FRAG = /* glsl */`
uniform vec3 uOlive;
void main(){ gl_FragColor = vec4(uOlive, 1.0); }`;

// HAIR: a tress. Geometry from style.tressGeometry(): every vertex sits ON the centre line; the shader pushes it
// out across the ribbon, so the travelling whiplash sway, the turn-over (roll about the tangent) and the growing
// coil are all vertex work on uniforms. Attributes: position = centre line, normal = ribbon face normal,
//   hT vec3 tangent (toward the roundel), hA vec4 (a across -1..1, s arc length m, signed curvature 1/m, half width m),
//   hB vec4 (sway weight 0..1, tress phase, coil arc length m (negative before the coil starts), roll weight 0..1)
// The fragment shader draws everything from the across coordinate: peach (ochre when turned over), the designed
// ochre second-tone lock, two olive contours thick on the outside of the bend, seven gold strands, olive hairlines.
const HAIR_VERT = /* glsl */`
attribute vec3 hT; attribute vec4 hA; attribute vec4 hB;
uniform float uTime;
uniform vec4 uWave;       // x sway amplitude m, y wavelength m, z wave speed m/s (toward the tip), w turn-over spacing m
uniform float uReveal;    // coil arc length wound so far (m); beyond it nothing is drawn; 1e6 = everything
uniform float uWidth;     // width multiplier
uniform vec3 uTip;        // x: arc length of the free tip (the ridden tress: nothing is drawn before it), y: 1 = the ridden tress (drawn by distance ahead of its tip), z: lift (m) of the tip curl
uniform vec4 uRide;       // the ridden tress: x half width at the tip (m), y widening per metre ahead, z sway per metre ahead (m/m), w sway cap (m)
uniform float uRideK;     // 1: this is the ridden tress and the laws above apply (0: a free tip keeps the plain taper)
uniform vec4 uFar;        // x: least half width per metre of view distance (the line never thins below this share of the frame), y..z: arc lengths over which that floor lets go
varying vec4 vA; varying vec4 vB; varying vec3 vWp; varying vec3 vT; varying vec3 vN; varying float vDist; varying float vK;
void main(){
  float tl = length(hT); vec3 T = tl > 1e-5 ? hT / tl : vec3(1.0, 0.0, 0.0);
  vec3 N = normal; vec3 B = cross(N, T); float bl = length(B); B = bl > 1e-5 ? B / bl : vec3(0.0, 1.0, 0.0);
  float s = hA.y, k = 6.2831853 / max(uWave.y, 1.0);
  float wph = (s + uWave.z * uTime) * k + hB.y * 1.3;
  float dd = max(s - uTip.x, 0.0);                                   // metres ahead of the free tip
  float calm0 = mix(1.0, smoothstep(uTip.x + 45.0, uTip.x + 150.0, s), uTip.y);   // a free tip: sway and roll calm toward it
  float calm = smoothstep(uTip.x + 30.0, uTip.x + 95.0, s);
  // the ridden tress: the whiplash grows with distance from the tip, so the S keeps its size in the picture
  float amp = hB.x * mix(uWave.x * calm0, min(dd * uRide.z, uRide.w) * smoothstep(0.0, 22.0, dd), uRideK);
  float ampN = mix(amp, min(amp, 1.6), uRideK);
  vec3 c = position + B * amp * sin(wph) + N * ampN * 0.35 * sin(wph * 0.5 + 1.0);
  vK = hA.z - amp * k * k * sin(wph);                              // drawn curvature = built bend + the wave's bend
  float rp = sin((s + uWave.z * uTime) * 6.2831853 / max(uWave.w, 1.0) + hB.y * 2.1);
  float th = 3.14159265 * mix(smoothstep(0.80, 0.97, rp) * calm0, smoothstep(0.50, 0.78, rp - 1.3 * (1.0 - calm)), uRideK) * hB.w; // the turn-over travels with the wave
  float h = hA.w * uWidth * smoothstep(0.0, 14.0, uReveal - hB.z); // the wound end tapers to a point
  h = mix(h * mix(1.0, 0.2 + 0.8 * smoothstep(uTip.x, uTip.x + 85.0, s), uTip.y), min(h, uRide.x + uRide.y * dd), uRideK);   // the ridden tress runs out to its tip under the eye: a true taper in perspective
  float vd = length((viewMatrix * modelMatrix * vec4(c, 1.0)).xyz);
  h = max(h, uFar.x * vd * (1.0 - smoothstep(uFar.y, uFar.z, s)) * step(1e-3, hA.w));   // and far off it never thins below a line's width
  float flatK = mix(1.0, 0.2, uRideK);                               // the ridden tress turns over as a ribbon is DRAWN turning: a pinch in its own plane and the underside beyond it, never a plank on edge
  vec3 p = c + (B * cos(th) + N * (sin(th) * flatK)) * hA.x * h + N * (abs(sin(th)) * h * 0.2 * uRideK);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vA = vec4(hA.x, s, hA.z, h); vB = hB; vWp = wp.xyz;
  vT = mat3(modelMatrix) * T; vN = mat3(modelMatrix) * (N * cos(th) - B * sin(th));
  vec4 mv = viewMatrix * wp; vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const HAIR_FRAG = /* glsl */`
varying vec4 vA; varying vec4 vB; varying vec3 vWp; varying vec3 vT; varying vec3 vN; varying float vDist; varying float vK;
${WW_COMMON}
uniform vec3 uHairInk;    // peach
uniform vec2 uOff; uniform float uSlide; uniform float uReveal; uniform float uStrands; uniform float uStrandN; uniform float uGrainScale; uniform float uTipS;
uniform float uCalm;      // 1: strands and hairlines run as long smooth parallels and the lock is one slow shape (the world's near tresses)
void main(){
  if (vB.z > uReveal) discard;
  if (vA.y < uTipS) discard;
  float a = vA.x, s = vA.y, h = max(vA.w, 1e-3);
  float flow = s - uSlide * uTime;                                 // the hair being reeled in: every mark slides home
  float e = (1.0 - abs(a)) * h;
  float fe = fwidth(e) + 1e-5, fa = fwidth(a) + 1e-5;
  float fp = max(fwidth(vWp.x), max(fwidth(vWp.y), fwidth(vWp.z)));
  vec3 dv = cameraPosition - vWp; float dl = length(dv);
  vec3 V = dl > 1e-4 ? dv / dl : vec3(0.0, 0.0, 1.0);
  float inner = wwInner(vDist);
  float front = gl_FrontFacing ? 1.0 : 0.0;
  // flat: peach on top, ochre (peach under the olive tint) underneath; the second tone is one long drawn lock
  float lockEdge = 0.30 + mix(0.34 * sin(flow * 0.045 + vB.y * 2.0) + 0.12 * sin(flow * 0.11 + vB.y), 0.40 * sin(flow * 0.021 + vB.y * 2.0), uCalm);
  float fl = mix(fa, 0.7 * fwidth(a - lockEdge) + 1e-5, uCalm);       // hard to the pixel at any angle
  float lock = smoothstep(-fl, fl, a - lockEdge);
  vec3 col = mix(uHairInk, wwTone(uHairInk), max(lock, 1.0 - front));
  col = wwGrain(col, vWp, uGrainScale, fp);
  col = wwPale(col, vDist);
  // strands: seven gold lines combed down the length, wandering a little, breaking into long dashes that slide
  float sp = 2.0 / (uStrandN + 1.0), hn = 0.5 * (uStrandN - 1.0);   // strand spacing in a; outermost strand index
  float x = a / sp;
  float i = clamp(floor(x + 0.5), -hn, hn);
  float wob = (0.20 * sin(flow * 0.085 + i * 1.7 + vB.y) + 0.10 * sin(flow * 0.23 + i * 4.1)) * (1.0 - uCalm);
  float dS = abs(x + wob - i) * sp * h;                            // metres from the strand
  float fS = fwidth(x) * sp * h + 1e-5;
  float wS = max(0.11 * sp * h, 0.8 * fS);
  float dash = smoothstep(-0.75, -0.55, sin(flow * 0.060 + i * 2.4 + vB.y * 3.0));
  float strand = (1.0 - smoothstep(wS - fS * 0.5, wS + fS * 0.5, dS)) * dash * uStrands;
  float room = 1.0 / (fwidth(x) + 1e-5);                           // pixels between neighbouring strands
  strand *= inner * smoothstep(1.5, 3.0, room);
  vec3 Tn = vT; float tl = length(Tn); Tn = tl > 1e-5 ? Tn / tl : vec3(1.0, 0.0, 0.0);
  vec3 g = Tn + vN * (0.55 * sin(i * 2.1 + flow * 0.021)); g /= max(length(g), 1e-4);
  vec3 gold = wwGold(g, V, i * 0.9 + s * 0.045 + vB.y, 1.0);
  col = mix(col, mix(gold, uBronze * 0.8, (1.0 - front) * 0.6), strand);
  // olive hairlines between the strands (the first thing distance removes)
  float xh = x + 0.5 + 0.16 * (1.0 - uCalm) * sin(flow * 0.07 + floor(x + 1.0) * 2.3);
  float dH = abs(fract(xh) - 0.5);
  float fH = fwidth(x) + 1e-5;
  float hair = (1.0 - smoothstep(0.5 * fH, 1.1 * fH, dH)) * step(abs(x), hn + 0.3) * inner * 0.75 * smoothstep(5.0, 9.0, room);
  hair *= smoothstep(-0.2, 0.3, sin(flow * mix(0.045, 0.019, uCalm) + floor(xh) * 1.9)) * (1.0 - 0.35 * uCalm);
  col = mix(col, uOlive, hair * (1.0 - strand));
  // colour off its keyline
  float e2 = e + dFdx(e) * uOff.x + dFdy(e) * uOff.y;
  // contours: thick on the outside of the bend, thin on the inside, and the swell runs along with the wave
  float bendK = clamp(-sign(a) * vK * 26.0, -0.62, 1.5);
  float lw = h * 0.085 * (1.0 + bendK);
  col = mix(uPaper, col, smoothstep(0.0, fe * 0.8, e2 - lw * 0.35));
  float wpx = max(lw, 1.3 * fe);
  col = mix(col, uOlive, 1.0 - smoothstep(wpx - fe * 0.6, wpx + fe * 0.6, e));
  gl_FragColor = vec4(col, 1.0);
}`;

// SKY: the one split-fountain blend (uTop overhead to bare paper at the horizon), the scroll frieze between 10 and
// 20 degrees (cream volutes with an olive hairline, each curling into the next, sliding right and unrolling) and the
// flat four-pointed gold stars above it that glint in turn. One dome, drawn at the far plane; no sun is ever drawn.
const SKY_VERT = /* glsl */`
varying vec3 vD;
void main(){
  vD = position;
  vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;
const SKY_FRAG = /* glsl */`
varying vec3 vD;
${WW_COMMON}
uniform vec3 uTop; uniform vec3 uCloud; uniform vec3 uStars[9]; uniform float uStarSize; uniform float uFrieze; uniform float uStarN;
void main(){
  float dl = length(vD); vec3 d = dl > 1e-5 ? vD / dl : vec3(0.0, 1.0, 0.0);
  float px = length(fwidth(d)) + 1e-5;                              // radians per pixel
  float el = asin(clamp(d.y, -1.0, 1.0));
  float az = (abs(d.x) + abs(d.z)) > 1e-5 ? atan(d.x, d.z) : 0.0;
  float t = clamp(d.y / 0.9, 0.0, 1.0);
  vec3 col = mix(uPaper, uTop, smoothstep(0.0, 1.0, sqrt(t)));
  col = wwGrain(col, d * 260.0, 0.5, px * 260.0);
  // the frieze
  float N = 40.0, cu = px * N / 6.2831853;
  float u = az / 6.2831853 * N - uTime * 0.018, v = (el - 0.175) / (0.175 * uFrieze);
  if (v > -0.3 && v < 1.3) {
    float cell = floor(u); vec2 q = vec2(fract(u) - 0.5, v - 0.52);
    float r = length(q), th = r > 1e-4 ? atan(q.y, q.x) : 0.0;
    float sdf = min(r - 0.46, v - 0.2);                             // volute + the bank that joins it to the next
    float unroll = 0.35 * sin(uTime * 0.13 + cell * 1.3);
    float sp = r / 0.13 - th / 6.2831853 + unroll;
    float dsp = abs(fract(sp) - 0.5) * 0.13;
    float lw = max(0.022, 0.8 * cu);
    float fill = 1.0 - smoothstep(-cu, cu, sdf);
    float line = (1.0 - smoothstep(lw - cu, lw + cu, abs(sdf))) + (1.0 - smoothstep(lw * 0.7 - cu, lw * 0.7 + cu, dsp)) * step(r, 0.44) * step(0.07, r);
    col = mix(col, uCloud, fill);
    col = mix(col, uOlive, clamp(line, 0.0, 1.0) * step(-0.05, v) * clamp(0.03 / cu, 0.0, 1.0));
  }
  // nine gold stars, flat, four-pointed, glinting in turn
  for (int i = 0; i < 9; i++) {
    vec3 s = uStars[i]; float fi = float(i);
    if (fi < uStarN && dot(d, s) > 0.99) {
      vec3 ex = normalize(cross(s, vec3(0.0, 1.0, 0.0))), ey = cross(ex, s);
      vec2 q = vec2(dot(d, ex), dot(d, ey)) / uStarSize;
      float a = sqrt(abs(q.x)) + sqrt(abs(q.y)), aa = 0.6 * px / uStarSize + 0.02;
      float g = max(sin(uTime * 0.7 - fi * 0.9), 0.0); g *= g; g *= g;
      vec3 sc = mix(uGold, uGoldHot, g);
      col = mix(col, uOlive, 1.0 - smoothstep(1.0 - aa, 1.0 + aa, a));
      col = mix(col, sc, 1.0 - smoothstep(0.84 - aa, 0.84 + aa, a));
    }
  }
  gl_FragColor = vec4(col, 1.0);
}`;

// ---------------------------------------------------------------------------------------------------------
// THE STYLE KIT
export function makeStyle(ctx, opts = {}) {
  const hex = opts.palette || WW_PALETTE, ex = opts.exposure ?? WW_EXPOSURE;
  const toInk = (h) => toInkAt(h, ex, (0.96 * WW_EXPOSURE) / ex);
  const pal = {
    cream: toInk(hex[0]), sage: toInk(hex[1]), olive: toInk(hex[2]), rose: toInk(hex[3]),
    peach: toInk(hex[4]), teal: toInk(hex[5]), gold: toInk(hex[6]),
  };
  // the tint stone: every second tone is its ink mixed 58 % toward the olive tint (in ink space this prints
  // peach -> ochre #D18F63, sage -> #77845D, rose -> #A26A5E, teal -> #4B685D, cream -> #DAC89E)
  const tint = pal.olive.clone(), tone2 = (c) => c.clone().lerp(tint, 0.58);
  pal.ochre = tone2(pal.peach); pal.sage2 = tone2(pal.sage); pal.rose2 = tone2(pal.rose);
  pal.teal2 = tone2(pal.teal); pal.cream2 = tone2(pal.cream);
  pal.bronze = toInk(opts.bronze || '#6B4E1E');
  pal.goldHot = toInkAt('#FBE6A2', ex, 99).multiplyScalar(opts.goldGain ?? 1.7);   // the one HDR value (about 1.3-1.7 at exposure 2.2)
  const sun = new THREE.Vector3().copy(opts.sun || { x: -0.93, y: 0.26, z: 0.26 }).normalize();
  const U = {                                   // shared: one object, every material of the world points at it
    uTime: { value: 0 }, uSun: { value: sun }, uPaper: { value: pal.cream }, uOlive: { value: pal.olive },
    uTint: { value: tint }, uBronze: { value: pal.bronze }, uGold: { value: pal.gold }, uGoldHot: { value: pal.goldHot },
    uPlane: { value: new THREE.Vector4(260, 620, 900, 4000) }, uGrain: { value: opts.grain ?? 0.2 },
    uOff: { value: new THREE.Vector2(1.0, -0.8) }, uHair: { value: new THREE.Vector2(0.0024, -0.0018) },
    uBend: { value: new THREE.Vector4(1.6, 180, 12, 0) }, uBendDir: { value: new THREE.Vector2(0, -1) },
    uRing: { value: new THREE.Vector4(0, 0, -1000, 0) }, uPass: { value: new THREE.Vector4(0, 0, 30, 0) },
  };
  const mats = [];
  const keep = (m) => { mats.push(m); return m; };
  const defs = (o) => { const d = {}; if (o.bendy) d.WW_BENDY = 1; if (o.inst) d.WW_INST = 1; if (o.comb) d.WW_COMB = 1; if (o.rosette) d.WW_ROSETTE = 1; return d; };
  // flat ink (+ line, + gold).  o: { bendy, inst, grainScale (stipples/m: 0.5 big flats .. 3 small), lineGain, side }
  const ink = (o = {}) => keep(new THREE.ShaderMaterial({
    vertexShader: INK_VERT, fragmentShader: INK_FRAG, defines: defs(o), side: o.side ?? THREE.DoubleSide,
    uniforms: { ...U, uGrainScale: { value: o.grainScale ?? 1.2 }, uLineGain: { value: o.lineGain ?? 1 }, uLineHold: { value: o.lineHold ?? 0 },
      uComb: { value: new THREE.Vector4(o.combZ ?? 1000, o.combSpacing ?? 3.2, o.comb ? (o.combGain ?? 1) : 0, o.combSlide ?? 6) },
      uField: { value: new THREE.Vector4(o.field ?? 0, o.fieldCell ?? 9, o.fieldRosette ?? 1.7, o.fieldAmount ?? 1) }, uDriftInk: { value: o.driftInk || pal.rose } },
    polygonOffset: !!o.offset, polygonOffsetFactor: o.offset || 0, polygonOffsetUnits: o.offset || 0,
  }));
  // flat ink with the world's own vertex shader (creatures, ripples, smoke): it must write the varyings vInk, vAux,
  // vWp, vG, vPh, vDist exactly as INK_VERT does; the drawing is the same INK_FRAG, so it is in the same hand.
  const inkWith = (vert, uniforms = {}, o = {}) => keep(new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: INK_FRAG, side: o.side ?? THREE.DoubleSide,
    uniforms: { ...U, uGrainScale: { value: o.grainScale ?? 1.2 }, uLineGain: { value: o.lineGain ?? 1 }, uLineHold: { value: o.lineHold ?? 0 }, ...uniforms },
  }));
  // silhouette keyline for solids.  o: { weight (fraction of frame width, 0.0035 near / 0.002 mid / 0.0012 far), bendy, inst }
  const hull = (o = {}) => keep(new THREE.ShaderMaterial({
    vertexShader: HULL_VERT, fragmentShader: HULL_FRAG, defines: defs(o), side: THREE.BackSide,
    uniforms: { ...U, uHull: { value: o.weight ?? 0.0035 } },
  }));
  // a tress.  o: { ink (Color, default peach), strands 0..1, width, sway m, waveLen m, waveSpeed m/s, rollLen m,
  //               slide m/s (25: the reeling-in), strandCount (7; odd; 3 on narrow tresses), grainScale }.  material.uniforms.uReveal.value = coil metres wound.
  const hair = (o = {}) => keep(new THREE.ShaderMaterial({
    vertexShader: HAIR_VERT, fragmentShader: HAIR_FRAG, side: THREE.DoubleSide,
    uniforms: { ...U, uHairInk: { value: o.ink || style.hairInk || pal.peach }, uStrands: { value: o.strands ?? 1 }, uStrandN: { value: o.strandCount ?? 7 },
      uWave: { value: new THREE.Vector4(o.sway ?? 3, o.waveLen ?? 150, o.waveSpeed ?? 12, o.rollLen ?? 420) },
      uReveal: { value: 1e6 }, uWidth: { value: o.width ?? 1 }, uSlide: { value: o.slide ?? 25 },
      uTip: { value: new THREE.Vector3(-1e6, 0, 0) }, uTipS: { value: -1e6 }, uCalm: { value: o.calm ?? 0 }, uRideK: { value: o.ride ? 1 : 0 },
      uRide: { value: new THREE.Vector4(o.tipHalf ?? 0.8, o.tipWiden ?? 0.02, o.rideSway ?? 0.07, o.rideSwayMax ?? 14) },
      uFar: { value: new THREE.Vector4(o.farFloor ?? 0, o.farS0 ?? 1e6, o.farS1 ?? 2e6, 0) },
      uGrainScale: { value: o.grainScale ?? 1.0 } },
  }));
  // the sky dome (add to the scene once; it needs no positioning: it is drawn from view directions at the far plane).
  //   o: { top (Color, default peach), cloud (Color, default cream), stars 0..9, frieze (height factor, 1), rng }
  const sky = (o = {}) => {
    const r = o.rng || ctx.rng, stars = [];
    for (let i = 0; i < 9; i++) { const az = (i / 9) * 6.283 + r.range(-0.25, 0.25), el = r.range(0.48, 1.05);
      stars.push(new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))); }
    const m = keep(new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false,
      uniforms: { ...U, uTop: { value: o.top || pal.peach }, uCloud: { value: o.cloud || pal.cream }, uStars: { value: stars },
        uStarSize: { value: o.starSize ?? 0.03 }, uFrieze: { value: o.frieze ?? 1 }, uStarN: { value: o.stars ?? 9 } } }));
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), m);
    mesh.renderOrder = -1; mesh.frustumCulled = false; mesh.name = 'ww-sky';
    return mesh;
  };
  const _s = new THREE.Vector2();
  const style = {
    pal, tint, sun, uniforms: U, ink, inkWith, hull, hair, sky, toInk, materials: mats, glsl: { common: WW_COMMON, bend: WW_BEND },
    // call every frame. camera may be the portal camera: only matrixWorld is read.
    update(dt, time, camera) {
      U.uTime.value = time;
      const r = ctx.renderer;
      if (r && r.getDrawingBufferSize) { r.getDrawingBufferSize(_s); const k = Math.max(_s.x, 400) * 0.0012; U.uOff.value.set(k, -0.8 * k); }
    },
    setSun(v) { sun.copy(v).normalize(); },                       // world-space direction TO the port-side sun
    setBend(dirX, dirZ, amp, gust = 0) {                           // the bend field: direction the nearest tress flows
      const l = Math.hypot(dirX, dirZ) || 1; U.uBendDir.value.set(dirX / l, dirZ / l);
      if (amp !== undefined) U.uBend.value.x = amp; U.uBend.value.w = gust;
    },
  };
  attachGeometry(style);
  return style;
}

// Geometry helpers of the style. Everything drawn is a RIBBON (a whiplash shape: centre line + half width that
// tapers shut at the ends, so the outline closes itself) or a FAN (a closed outline round a centre), collected
// into a batch and turned into one mesh for style.ink().
function attachGeometry(style) {
  const V = () => new THREE.Vector3();
  const t0 = V(), t1 = V(), bb = V(), nn = V(), pp = V();
  style.batch = () => ({ pos: [], nor: [], ink: [], aux: [], bnd: [], idx: [] });
  style.geometry = (b) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3));
    g.setAttribute('ink', new THREE.Float32BufferAttribute(b.ink, 3));
    g.setAttribute('aux', new THREE.Float32BufferAttribute(b.aux, 4));
    g.setAttribute('bnd', new THREE.Float32BufferAttribute(b.bnd, 1));
    g.setIndex(b.idx); g.computeBoundingSphere();
    return g;
  };
  // tangents + signed curvature (about the ribbon normal) of a polyline
  function frames(pts, normalAt) {
    const n = pts.length, T = [], B = [], N = [], K = [], S = [0];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(i - 1, 0)], c = pts[Math.min(i + 1, n - 1)];
      const t = V().subVectors(c, a); if (t.lengthSq() < 1e-12) t.set(1, 0, 0); t.normalize(); T.push(t);
      const nv = V().copy(typeof normalAt === 'function' ? normalAt(i, i / (n - 1)) : normalAt);
      const b = V().crossVectors(nv, t); if (b.lengthSq() < 1e-10) b.set(0, 1, 0); b.normalize();
      nv.crossVectors(t, b).normalize(); N.push(nv); B.push(b);
      if (i > 0) S.push(S[i - 1] + pts[i].distanceTo(pts[i - 1]));
    }
    for (let i = 0; i < n; i++) {
      const i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, n - 1), ds = Math.max(S[i1] - S[i0], 1e-4);
      K.push(t0.subVectors(T[i1], T[i0]).dot(B[i]) / ds);
    }
    return { T, B, N, K, S };
  }
  style.frames = frames;
  // ribbon(batch, pts, o): o = { half: m | (t)=>m, normal: Vector3 | (i,t)=>Vector3, ink: Color | (t,a)=>Color,
  //   tone: 0..1 | (a,t)=>0..1 (second tone where > 0.5), lw: line width m (0 = no line), gold: 0|1|2,
  //   across: quads across (2), lift: m along the normal, crown: m of bulge at the centre, bnd: (t)=>0..1, swell: 5 }
  style.ribbon = (b, pts, o = {}) => {
    const f = frames(pts, o.normal || new THREE.Vector3(0, 0, 1)), n = pts.length, ac = o.across || 2;
    const base = b.pos.length / 3, lw = o.lw ?? 0.05, sw = o.swell ?? 5;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), h = typeof o.half === 'function' ? o.half(t) : (o.half ?? 0.5);
      for (let j = 0; j <= ac; j++) {
        const a = -1 + (2 * j) / ac;
        pp.copy(pts[i]).addScaledVector(f.B[i], a * h).addScaledVector(f.N[i], (o.lift || 0) + (o.crown || 0) * (1 - a * a));
        b.pos.push(pp.x, pp.y, pp.z);
        const g = o.gold === 1 ? f.T[i] : f.N[i]; b.nor.push(g.x, g.y, g.z);
        const c = typeof o.ink === 'function' ? o.ink(t, a) : o.ink; b.ink.push(c.r, c.g, c.b);
        const bend = Math.abs(a) < 1e-3 ? 0 : Math.min(Math.max(-Math.sign(a) * f.K[i] * h * sw, -0.6), 1.3);
        const tone = typeof o.tone === 'function' ? o.tone(a, t) : (o.tone || 0);
        b.aux.push(lw > 0 ? (1 - Math.abs(a)) * h : 99, lw * (1 + bend), tone, o.gold || 0);
        b.bnd.push(o.bnd ? o.bnd(t) : 0);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < ac; j++) {
      const p = base + i * (ac + 1) + j, q = p + ac + 1;
      b.idx.push(p, q, p + 1, p + 1, q, q + 1);
    }
  };
  // fan(batch, centre, ring, o): closed outline (array of Vector3, not repeated) round a centre.
  //   o = { ink, tone: 0..1 | (k)=>0..1 per ring vertex, toneC: tone at the centre, lw, gold, normal, inset: m from
  //   outline to centre used as the line distance (default: nearest ring vertex), bnd: number }
  style.fan = (b, centre, ring, o = {}) => {
    const base = b.pos.length / 3, n = ring.length, lw = o.lw ?? 0.05, N = o.normal || nn.set(0, 0, 1);
    let inset = o.inset; if (inset === undefined) { inset = 1e9; for (const r of ring) inset = Math.min(inset, r.distanceTo(centre)); }
    const put = (p, e, tone) => {
      b.pos.push(p.x, p.y, p.z); b.nor.push(N.x, N.y, N.z); b.ink.push(o.ink.r, o.ink.g, o.ink.b);
      b.aux.push(lw > 0 ? e : 99, lw, tone, o.gold || 0); b.bnd.push(o.bnd || 0);
    };
    put(centre, inset, o.toneC ?? 0);
    for (let k = 0; k < n; k++) put(ring[k], 0, typeof o.tone === 'function' ? o.tone(k) : (o.tone || 0));
    for (let k = 0; k < n; k++) b.idx.push(base, base + 1 + k, base + 1 + ((k + 1) % n));
  };
  // whiplash(o): the curve of the world, in a plane: long and slow, with one quick return at the end.
  //   o = { origin, u, v (unit axes of the plane), len, heading (rad from u toward v), bend (total slow turn, rad),
  //         curl (rad of the quick return), curlAt (0.7), n (points) }  ->  Vector3[]
  style.whiplash = (o) => {
    const n = o.n || 24, pts = [], ds = o.len / (n - 1), ca = o.curlAt ?? 0.7;
    let x = 0, y = 0, th = o.heading || 0;
    for (let i = 0; i < n; i++) {
      pts.push(V().copy(o.origin).addScaledVector(o.u, x).addScaledVector(o.v, y));
      const t = (i + 0.5) / (n - 1), c = Math.max(0, (t - ca) / (1 - ca));
      th += ((o.bend || 0) * (0.4 + 1.2 * t * (1 - t) * 2) + (o.curl || 0) * 3 * c * c / (1 - ca)) / (n - 1);
      const sp = 1 - 0.55 * c * c;                                   // the return is tighter AND shorter
      x += Math.cos(th) * ds * sp; y += Math.sin(th) * ds * sp;
    }
    return pts;
  };
  // tressGeometry(pts, o): a tress for style.hair(). pts = centre line, tip first, roundel end last.
  //   o = { half: m | (t,s)=>m, normal: Vector3 | (i,t)=>Vector3, across: 4, phase, sway: 0..1 | (t,s)=>w,
  //         roll: 0..1 | (t,s)=>w, coilStart: arc length at which the wound part begins (Infinity: none), s0: 0 }
  style.tressGeometry = (pts, o = {}) => {
    const f = frames(pts, o.normal || new THREE.Vector3(0, 1, 0)), n = pts.length, ac = o.across || 4, m = ac + 1;
    const pos = new Float32Array(n * m * 3), nor = new Float32Array(n * m * 3), hT = new Float32Array(n * m * 3);
    const hA = new Float32Array(n * m * 4), hB = new Float32Array(n * m * 4), idx = [];
    const fn = (v, t, s, d) => (typeof v === 'function' ? v(t, s) : (v ?? d));
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), s = (o.s0 || 0) + f.S[i];
      const h = fn(o.half, t, s, 4), sw = fn(o.sway, t, s, 1), rl = fn(o.roll, t, s, 1);
      for (let j = 0; j < m; j++) {
        const q = i * m + j;
        pos.set([pts[i].x, pts[i].y, pts[i].z], q * 3); nor.set([f.N[i].x, f.N[i].y, f.N[i].z], q * 3);
        hT.set([f.T[i].x, f.T[i].y, f.T[i].z], q * 3);
        hA.set([-1 + (2 * j) / ac, s, f.K[i], h], q * 4);
        hB.set([sw, fn(o.phase, t, s, 0), s - (o.coilStart ?? 1e9), rl], q * 4);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < ac; j++) { const p = i * m + j, q = p + m; idx.push(p, q, p + 1, p + 1, q, q + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('hT', new THREE.BufferAttribute(hT, 3)); g.setAttribute('hA', new THREE.BufferAttribute(hA, 4));
    g.setAttribute('hB', new THREE.BufferAttribute(hB, 4)); g.setIndex(idx);
    return g;
  };
}

// ---------------------------------------------------------------------------------------------------------
// THE ROUNDEL
const R_OUT = 60, CY = 62, FZ = 1.7;                 // disc radius, height of its centre, z of its front face
const R_OPEN = 7, R_RIM0 = 8.6, R_MOS = 20.6, R_STAR = 32, R_LILY = 54;   // band edges, centre outward
const COIL_R0 = 53.2, COIL_W = 2.5, COIL_N = 5, COIL_PITCH = COIL_W * COIL_N;

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, TAU = Math.PI * 2;
  const detail = Math.min(1, Math.max(0.5, (opts.detail ?? ctx.quality?.detail ?? 1)));
  const style = opts.style || makeStyle(ctx, { palette: opts.palette, exposure: opts.exposure });
  const pal = style.pal, V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const root = new THREE.Group(); root.name = 'whiplash-wind-roundel';
  const NZ = V3(0, 0, 1);
  // seeded variety: how many lilies round the band, how the pins lie, which way each curl returns
  const N_LILY = rng.pick([10, 12, 12, 14]), pinTurn = rng.range(-0.12, 0.12), pinOpen = rng.range(0.42, 0.58);
  const starSpin = rng.range(0, TAU), nStud = rng.pick([32, 36, 40]);
  await ctx.yield?.();

  // ---- the disc: stepped bands, each a flat ink with a keyline at both edges that swells and thins round the circle
  const disc = style.batch(), SEG = 240;
  // one annulus (or wall) between two (r, z) rims, with a middle ring so the line distance is right
  const band = (r0, z0, r1, z1, ink, o = {}) => {
    const base = disc.pos.length / 3, lw = o.lw ?? 0.22, wid = Math.hypot(r1 - r0, z1 - z0);
    for (let k = 0; k < 3; k++) {
      const f = k / 2, r = r0 + (r1 - r0) * f, z = z0 + (z1 - z0) * f;
      for (let i = 0; i <= SEG; i++) {
        const a = (i / SEG) * TAU, sx = Math.sin(a), cx = Math.cos(a);
        disc.pos.push(r * sx, CY + r * cx, z); disc.nor.push(0, 0, o.back ? -1 : 1); disc.ink.push(ink.r, ink.g, ink.b);
        const swell = 1 + 0.55 * Math.sin(a * (o.lobes ?? 1) + (o.ph ?? 0) + k * 2.2);     // thick and thin run round the line
        const tone = o.tone ? o.tone(a, f) : 0;
        disc.aux.push(o.noLine ? 99 : (k === 1 ? wid / 2 : 0), lw * swell, tone, 0); disc.bnd.push(0);
      }
    }
    for (let k = 0; k < 2; k++) for (let i = 0; i < SEG; i++) {
      const p = base + k * (SEG + 1) + i, q = p + SEG + 1;
      if (o.back) disc.idx.push(p, p + 1, q, p + 1, q + 1, q); else disc.idx.push(p, q, p + 1, p + 1, q, q + 1);
    }
  };
  // the second tone of a band: one scalloped edge running round it (arches, cusp to cusp), drawn exactly: the mask is
  // linear across the band, so the hard edge falls on the curve itself and never on the mesh
  const scallop = (n, ph, lo, hi) => (a, f) => { const E = 0.3 + 0.46 * Math.abs(Math.sin((a * n + ph) * 0.5)); return 0.5 + (hi > lo ? f - E : E - f) * 3; };
  // front, centre outward
  band(R_OPEN, FZ + 0.9, R_RIM0, FZ + 0.9, pal.olive, { noLine: true });                       // olive rim of the opening
  band(R_RIM0, FZ + 0.9, R_RIM0 + 0.01, FZ, pal.olive, { noLine: true });
  band(R_RIM0, FZ, R_MOS, FZ, pal.olive, { noLine: true });                                    // mosaic bed (grout)
  band(R_MOS, FZ + 0.25, R_STAR, FZ + 0.25, pal.teal, { lw: 0.34, lobes: 2, ph: 1.0, tone: scallop(24, starSpin, 0.2, 0.8) });
  band(R_STAR, FZ, R_LILY, FZ, pal.sage, { lw: 0.3, lobes: 1, ph: 3.0, tone: scallop(N_LILY, 0.4, 0.8, 0.1) });
  band(R_LILY, FZ + 1.1, R_OUT, FZ + 1.1, pal.olive, { noLine: true });                        // the olive outer rim, proud
  band(R_LILY, FZ, R_LILY + 0.01, FZ + 1.1, pal.olive, { noLine: true });
  band(R_OUT, FZ + 1.1, R_OUT, -FZ - 1.1, pal.olive, { noLine: true });                        // the edge
  band(R_OPEN, FZ + 0.9, R_OPEN, -FZ - 0.9, pal.olive, { noLine: true });                      // wall of the opening
  // back: plain bands in the same hand
  band(R_OPEN, -FZ - 0.9, R_MOS, -FZ - 0.9, pal.olive, { noLine: true, back: true });
  band(R_MOS, -FZ, R_STAR + 6, -FZ, pal.sage, { lw: 0.3, back: true, tone: scallop(18, 0.0, 0.2, 0.8) });
  band(R_STAR + 6, -FZ, R_LILY, -FZ, pal.teal, { lw: 0.3, back: true, lobes: 2, tone: scallop(N_LILY * 2, 1.0, 0.8, 0.2) });
  band(R_LILY, -FZ - 1.1, R_OUT, -FZ - 1.1, pal.olive, { noLine: true, back: true });
  await ctx.yield?.();

  // ---- ornaments laid on the disc: one batch (stars, studs, lilies, stems), all ribbons and fans
  const orn = style.batch();
  const onFace = (ang, r, z = 0) => V3(r * Math.sin(ang), CY + r * Math.cos(ang), FZ + z);   // ang clockwise from the top, seen from the front
  // gold studs on the olive rim, each brushed along the rim so they catch the sun one after another
  for (let i = 0; i < nStud; i++) {
    const a = (i / nStud) * TAU, c = onFace(a, 57, 1.45), ring = [];
    for (let k = 0; k < 10; k++) { const b = (k / 10) * TAU; ring.push(onFace(a, 57, 1.2).add(V3(Math.cos(b) * 1.15, Math.sin(b) * 1.15, 0))); }
    style.fan(orn, c, ring, { ink: pal.gold, gold: 1, lw: 0.2, normal: V3(Math.cos(a + i * 0.9), -Math.sin(a + i * 0.9), 0.25).normalize() });
  }
  // twenty-four four-pointed gold stars on the grey-teal band
  for (let i = 0; i < 24; i++) {
    const a = starSpin + (i / 24) * TAU, big = i % 2 === 0 ? 1 : 0.62, c = onFace(a, (R_MOS + R_STAR) / 2 + (i % 2 ? 2.1 : -0.6), 0.5), ring = [];
    for (let k = 0; k < 16; k++) {
      const b = (k / 16) * TAU + a * -1, q = (k % 4) / 4;             // each quadrant: tip, then a concave sweep to the waist
      const rad = big * (k % 4 === 0 ? 3.5 : 1.05 + 2.4 * (1 - Math.sin(q * Math.PI)) ** 2);
      ring.push(V3(c.x + Math.cos(b) * rad, c.y + Math.sin(b) * rad, c.z));
    }
    style.fan(orn, c, ring, { ink: pal.gold, gold: 1, lw: 0.17, inset: 1.0 * big, normal: V3(Math.cos(i * 2.4), Math.sin(i * 2.4), 0.3).normalize() });
  }
  await ctx.yield?.();

  // ---- the lily band: N stylised cream lilies on sage, heads toward the centre, stems rising out from under the
  //      rim (the coil will cover them turn by turn) and interlaced with their neighbours' leaves
  const almond = (W, p = 0.75) => (t) => W * Math.pow(Math.max(Math.sin(Math.PI * Math.pow(t, p)), 0), 0.8);
  const halfTone = (side) => (a) => (a * side > 0.12 ? 1 : 0);        // the second tone: one half of the shape, hard edge
  for (let i = 0; i < N_LILY; i++) {
    const a0 = ((i + 0.5) / N_LILY) * TAU, flip = i % 2 ? -1 : 1;
    const O = onFace(a0, 44.5, 0), u = V3(-Math.sin(a0), -Math.cos(a0), 0), v = V3(Math.cos(a0), -Math.sin(a0), 0).multiplyScalar(flip);
    const lean = rng.range(-0.1, 0.1);
    // stem: polar S from the rim to the flower base, and a bud stem crossing the other way
    const stem = [], bud = [];
    for (let k = 0; k <= 18; k++) {
      const f = k / 18, r = 53.9 - f * 9.4, x = flip * (5.2 * Math.sin(f * Math.PI * 1.5 + 0.2) * (1 - f) * (1 - f) - 0.0);
      stem.push(onFace(a0 + x / r, r, 0.10));
      const r2 = 53.9 - f * 6.6, x2 = flip * (-3.0 - 6.4 * Math.sin(f * Math.PI * 0.9) - 2.2 * f * f);
      bud.push(onFace(a0 + x2 / r2, r2, 0.06));
    }
    style.ribbon(orn, bud, { half: (t) => 0.3 + 0.14 * (1 - t), ink: pal.teal, lw: 0.11, normal: NZ });
    style.ribbon(orn, stem, { half: (t) => 0.44 + 0.2 * t, ink: pal.teal, lw: 0.14, normal: NZ, tone: halfTone(flip) });
    // leaves: long whiplash blades thrown out sideways from low on the stem, passing under the next lily's stem
    for (const sd of [1, -1]) {
      const from = stem[sd > 0 ? 3 : 6];
      const leaf = style.whiplash({ origin: V3(from.x, from.y, FZ + 0.03), u, v, len: sd > 0 ? 13.5 : 10.5, n: 18,
        heading: sd * 1.25, bend: -sd * 1.05, curl: sd * 2.4, curlAt: 0.66 });
      style.ribbon(orn, leaf, { half: almond(sd > 0 ? 1.0 : 0.85, 0.6), ink: pal.teal, lw: 0.13, normal: NZ, tone: halfTone(sd) });
    }
    // bud: a closed almond in cream at the end of the bud stem
    const bEnd = bud[18], bPrev = bud[16];
    const bu = V3().subVectors(bEnd, bPrev).normalize(), bv = V3().crossVectors(NZ, bu);
    style.ribbon(orn, style.whiplash({ origin: V3(bEnd.x, bEnd.y, FZ + 0.14), u: bu, v: bv, len: 4.6, n: 12, bend: flip * 0.5 }),
      { half: almond(0.85, 0.9), ink: pal.cream, lw: 0.15, normal: NZ, tone: halfTone(-flip) });
    // the flower: five visible tepals, outer pair strongly recurved, then the mid pair, then the long centre one
    const petal = (len, W, heading, bend, curl, z, side) => style.ribbon(orn,
      style.whiplash({ origin: V3(O.x, O.y, FZ + z), u, v, len, n: 16, heading: heading + lean, bend, curl, curlAt: 0.62 }),
      { half: almond(W, 0.7), ink: pal.cream, lw: 0.17, normal: NZ, tone: halfTone(side) });
    petal(8.6, 1.05, 1.02, 0.35, 3.0, 0.14, 1); petal(8.6, 1.05, -1.02, -0.35, -3.0, 0.14, -1);
    petal(9.6, 1.3, 0.46, -0.1, 1.9, 0.18, 1); petal(9.6, 1.3, -0.46, 0.1, -1.9, 0.18, -1);
    petal(10.2, 1.4, 0.0, 0.12 * flip, 0.0, 0.22, flip);
    // calyx: a small sage-olive cup over the join
    style.ribbon(orn, [V3(O.x, O.y, FZ + 0.26).addScaledVector(u, -1.5), V3(O.x, O.y, FZ + 0.26).addScaledVector(u, 0.3),
      V3(O.x, O.y, FZ + 0.26).addScaledVector(u, 2.1)], { half: (t) => 0.95 * Math.sin(Math.PI * (0.12 + 0.88 * t)) ** 0.7, ink: pal.teal, tone: 1, lw: 0.15, normal: NZ });
    // gold stamens: three filaments past the petals, each ending in an anther
    for (let k = -1; k <= 1; k++) {
      const fil = style.whiplash({ origin: V3(O.x, O.y, FZ + 0.3).addScaledVector(u, 1.5), u, v, len: 9.2 + (k === 0 ? 1.2 : 0), n: 10,
        heading: lean + k * 0.2, bend: k * 0.25, curl: k * 0.9 + 0.3 * flip });
      style.ribbon(orn, fil, { half: () => 0.15, ink: pal.gold, gold: 1, lw: 0, normal: NZ });
      const e = fil[9], ring = [];
      for (let q = 0; q < 8; q++) ring.push(V3(e.x + Math.cos(q * TAU / 8) * 0.5, e.y + Math.sin(q * TAU / 8) * 0.5, e.z));
      style.fan(orn, e, ring, { ink: pal.gold, gold: 1, lw: 0.1, normal: V3(Math.cos(i + k), Math.sin(i + k), 0.2).normalize() });
    }
    if (i % 4 === 3) await ctx.yield?.();
  }
  const mInk = style.ink({ grainScale: 0.9, lineHold: 1 });
  const discMesh = new THREE.Mesh(style.geometry(disc), mInk); discMesh.name = 'disc';
  const ornMesh = new THREE.Mesh(style.geometry(orn), style.ink({ grainScale: 2.2, lineHold: 0.3 })); ornMesh.name = 'ornament';
  root.add(discMesh, ornMesh);
  await ctx.yield?.();

  // ---- the gold mosaic: square chips laid in arcs, each brushed and tilted a little differently, so the bright
  //      band of the port-side sun walks round them as the eye moves, and the comb phase walks it in arcs meanwhile
  {
    const crng = rng.fork ? rng.fork('chips') : rng, pitch = 0.43 / Math.sqrt(detail), rows = [];
    for (let r = R_RIM0 + 0.42; r < R_MOS - 0.3; r += pitch) rows.push([r, Math.floor((TAU * r) / pitch), pitch * 0.86, 0.07]);
    rows.push([(R_OPEN + R_RIM0) / 2, 64, 0.62, 0.98]);               // the row round the opening, on the olive rim
    let count = 0; for (const r of rows) count += r[1];
    const cb = style.batch(), c0 = V3(0, 0, 0);
    style.fan(cb, c0, [V3(-0.5, -0.5, 0), V3(0.5, -0.5, 0), V3(0.5, 0.5, 0), V3(-0.5, 0.5, 0)],
      { ink: pal.gold, gold: 1, lw: 0.075, inset: 0.5, normal: V3(1, 0, 0) });
    const cg = style.geometry(cb), mat = new Float32Array(count * 16), iA = new Float32Array(count * 4);
    let q = 0;
    for (const [r, n, size, z] of rows) {
      const off = crng() * TAU;
      for (let i = 0; i < n; i++, q++) {
        const ang = off + (i / n) * TAU, sx = Math.sin(ang), cx = Math.cos(ang);
        const j = (crng() - 0.5) * 1.3, ta = (crng() - 0.5) * 0.5, tb = (crng() - 0.5) * 0.5, s = size * (0.86 + 0.2 * crng());
        const cj = Math.cos(j), sj = Math.sin(j);
        let X = [cx * cj + sx * sj, -sx * cj + cx * sj, 0], Z = [ta, tb, 1];
        const zl = Math.hypot(Z[0], Z[1], Z[2]); Z = [Z[0] / zl, Z[1] / zl, Z[2] / zl];
        const d = X[0] * Z[0] + X[1] * Z[1]; X = [X[0] - Z[0] * d, X[1] - Z[1] * d, -Z[2] * d];
        const xl = Math.hypot(X[0], X[1], X[2]); X = [X[0] / xl, X[1] / xl, X[2] / xl];
        const Y = [Z[1] * X[2] - Z[2] * X[1], Z[2] * X[0] - Z[0] * X[2], Z[0] * X[1] - Z[1] * X[0]];
        mat.set([X[0] * s, X[1] * s, X[2] * s, 0, Y[0] * s, Y[1] * s, Y[2] * s, 0, Z[0], Z[1], Z[2], 0, r * sx, CY + r * cx, FZ + z, 1], q * 16);
        iA.set([crng() * 6.28, r * 1.5 + 2.4 * Math.sin(ang * 9), 0, 0], q * 4);
        if (q % 900 === 899) await ctx.yield?.();
      }
    }
    const chips = new THREE.InstancedMesh(cg, style.ink({ inst: true, grainScale: 3 }), count);
    chips.instanceMatrix.array.set(mat); chips.instanceMatrix.needsUpdate = true;
    cg.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4));
    chips.frustumCulled = false; chips.name = 'mosaic'; root.add(chips);
  }
  await ctx.yield?.();

  // ---- the hill under it (optional) and the height of that hill, which the tress feet ride over
  const hillY = (x, z) => { const d = Math.hypot(x, z * 0.92), f = Math.min(d / 190, 1); return -52 * f * f * (3 - 2 * f) - 1.2; };

  // ---- the coil and its feeders: five tresses come over the brow, swing round the right foot of the disc in one
  //      volute and wind on clockwise, each turn laid beside the last, inward over the lily band
  const coilGeos = [], feet = [], stag = [0, 52, 20, 74, 36];
  for (let k = 0; k < COIL_N; k++) {
    const rAt = (phi) => COIL_R0 + COIL_W * k - (COIL_PITCH * phi) / TAU;
    // the foot: over the brow from the front, round to the right of the disc, up in a sheaf, and over in a hook
    // (centre HOOK, radius 18 m for the outermost tress) that lays it onto the rim heading down and left: the S.
    const gx = -74 + (k / (COIL_N - 1)) * 128 + rng.range(-8, 8), gz = 96 + rng.range(-10, 12) + 8 * Math.sin(k * 2.1);
    const phi0 = -0.9, phiMax = ((COIL_R0 + COIL_W * k - 35.5) / COIL_PITCH) * TAU, HR = 18 - COIL_W * k;
    const hook = (deg) => { const a = (deg * Math.PI) / 180, lift = Math.max(0, (25 - deg) / 75);
      return V3(57 + HR * Math.cos(a), 16.6 + HR * Math.sin(a), FZ + 0.55 + 13 * lift * lift); };
    const gy = (x, z, h) => (opts.hillY || hillY)(x, z) + h;
    const ctl = [
      V3(gx * 1.25 - 6, gy(gx * 1.25 - 6, gz + 38, 2.2), gz + 38), V3(gx, gy(gx, gz, 2.4), gz),
      V3(gx * 0.4 + 40, gy(gx * 0.4 + 40, 66, 3 + k * 0.7), 66 - k * 2.5),
      V3(68 + HR * 1.15, gy(68 + HR * 1.15, 42, 5 + k), 42 - k * 1.6),
      V3(62 + HR * 1.12, gy(62 + HR * 1.12, 24, 12 + k * 1.5), 24 - k),
    ];
    for (let dg = -50; dg <= 125; dg += 25) ctl.push(hook(dg));
    ctl.push(hook(141.5));
    const curve = new THREE.CatmullRomCurve3(ctl, false, 'centripetal'), nF = 120, pts = [];
    for (let i = 0; i < nF; i++) pts.push(curve.getPoint(i / nF));
    const nC = Math.ceil(((phiMax - phi0) * 46) / 1.25);
    let sStart = 0; for (let i = 1; i < nF; i++) sStart += pts[i].distanceTo(pts[i - 1]);
    for (let i = 0; i <= nC; i++) {
      const phi = phi0 + ((phiMax - phi0) * i) / nC, r = rAt(phi);
      pts.push(V3(-r * Math.sin(phi), CY - r * Math.cos(phi), FZ + 0.55));
    }
    sStart += pts[nF].distanceTo(pts[nF - 1]) + 0.9 * rAt(-0.45);     // arc length where the wound part begins (phi = 0)
    coilGeos.push(style.tressGeometry(pts, {
      phase: k * 1.7 + rng.range(0, 6), coilStart: sStart - stag[k],
      normal: (i) => { const b = Math.min(Math.max((i / nF - 0.26) / 0.2, 0), 1), e = b * b * (3 - 2 * b); return V3(0, 1 - e, e + 1e-3).normalize(); },
      half: (t, s) => { const b = Math.min(Math.max((sStart - s - 100) / 110, 0), 1); return COIL_W / 2 + 1.7 * b * b * (3 - 2 * b); },
      sway: (t, s) => { const b = Math.min(Math.max((sStart - s - 135) / 70, 0), 1), c = opts.joinFeet ? Math.min(Math.max(s / 55, 0), 1) : 1; return b * b * (3 - 2 * b) * c * c * (3 - 2 * c); },
      roll: (t, s) => (sStart - s > 150 && (!opts.joinFeet || s > 70) ? 1 : 0),
    }));
    feet.push({ position: ctl[0].clone(), direction: V3().subVectors(ctl[1], ctl[0]).normalize(), halfWidth: COIL_W / 2 + 1.7 });
    await ctx.yield?.();
  }
  const mHair = style.hair({ sway: 2.4, waveLen: 130, rollLen: 520, strandCount: 3 });
  const coil = new THREE.Mesh(mergeGeometries(coilGeos), mHair); coil.frustumCulled = false; coil.name = 'coil';
  for (const g of coilGeos) g.dispose();
  root.add(coil);
  await ctx.yield?.();

  // ---- the two gold hairpins, 70 m, crossed at the upper left and thrust through the coil: each a two-pronged pin
  //      with a crimp in its prongs and a looped head holding a rose enamel cabochon. Real metal: gold by normal.
  const pins = [], pinX = V3(-33, CY + 36, 0), tang = Math.atan2(0.676, 0.737) + pinTurn;
  const mPin = style.ink({ grainScale: 2 }), mPinHull = style.hull({ weight: 0.0028 });
  for (let p = 0; p < 2; p++) {
    const ang = tang + (p === 0 ? -pinOpen : pinOpen), sgn = p === 0 ? -1 : 1;     // pin 0 enters from the left, pin 1 from the top
    const d = V3(Math.cos(ang) * -sgn, Math.sin(ang) * -sgn, 0), l = V3(-d.y, d.x, 0);
    const head = pinX.clone().addScaledVector(d, -42);
    const b = style.batch(), path = [], rad = [];
    const P = (x, y, r) => {
      const dive = Math.min(Math.max((x - 57) / 13, 0), 1), liftH = Math.min(Math.max((18 - x) / 18, 0), 1);
      const z = FZ + 1.35 + p * 1.3 - 1.5 * dive * dive + 1.3 * liftH * liftH;
      path.push(V3(head.x + d.x * x + l.x * y, head.y + d.y * x + l.y * y, z)); rad.push(r);
    };
    const prong = (x) => 1.3 - 1.1 * Math.max(0, (x - 8) / 62) ** 1.2 + 0.42 * Math.sin((x - 22) * 0.62) * Math.min(Math.max((x - 22) / 6, 0), 1) * Math.min(Math.max((46 - x) / 6, 0), 1);
    const taper = (x) => 0.62 * Math.min(1, 0.1 + ((70 - x) / 11)) ** 0.8;
    for (let i = 0; i <= 34; i++) { const x = 70 - (62 * i) / 34; P(x, prong(x), taper(x)); }
    for (let i = 1; i < 20; i++) { const a = 0.34 + ((TAU - 0.68) * i) / 20; P(3.6 + Math.cos(a) * 4.6, Math.sin(a) * 4.6 * 0.92, 0.72); }
    for (let i = 0; i <= 34; i++) { const x = 8 + (62 * i) / 34; P(x, -prong(x), taper(x)); }
    const n = path.length, SIDES = 8, T = V3(), S = V3(), U2 = V3(), q = V3();
    for (let i = 0; i < n; i++) {
      T.subVectors(path[Math.min(i + 1, n - 1)], path[Math.max(i - 1, 0)]).normalize();
      S.crossVectors(NZ, T); if (S.lengthSq() < 1e-8) S.set(1, 0, 0); S.normalize(); U2.crossVectors(T, S);
      for (let k = 0; k < SIDES; k++) {
        const a = (k / SIDES) * TAU; q.copy(S).multiplyScalar(Math.cos(a)).addScaledVector(U2, Math.sin(a));
        b.pos.push(path[i].x + q.x * rad[i], path[i].y + q.y * rad[i], path[i].z + q.z * rad[i]);
        b.nor.push(q.x, q.y, q.z); b.ink.push(pal.gold.r, pal.gold.g, pal.gold.b); b.aux.push(99, 0.1, 0, 2); b.bnd.push(0);
        if (i < n - 1) { const v0 = i * SIDES + k, v1 = i * SIDES + ((k + 1) % SIDES); b.idx.push(v0, v1, v0 + SIDES, v1, v1 + SIDES, v0 + SIDES); }
      }
    }
    // the cabochon in the loop of the head: rose enamel with its darker crescent and a gold star
    const cc = V3(head.x + d.x * 3.6, head.y + d.y * 3.6, path[40].z + 0.2), ring = [];
    for (let k = 0; k < 20; k++) { const a = (k / 20) * TAU; ring.push(V3(cc.x + Math.cos(a) * 3.3, cc.y + Math.sin(a) * 3.1, cc.z)); }
    style.fan(b, cc, ring, { ink: pal.rose, lw: 0.2, inset: 3.1, tone: (k) => (Math.cos((k / 20) * TAU - 2.4) > 0.1 ? 1.4 : -0.4), toneC: 0.15 });
    const g = style.geometry(b), pin = new THREE.Group();
    const body = new THREE.Mesh(g, mPin), line = new THREE.Mesh(g, mPinHull);
    pin.add(line, body); pin.userData.dir = d.clone(); pin.name = 'hairpin' + p; root.add(pin); pins.push(pin);
    await ctx.yield?.();
  }

  // ---- lilies at the foot: tall cream lilies with gold stamens, in ranks that thicken toward the disc; every one
  //      takes the S of the bend field as the curve passes (style.setBend) and eases back
  const lilyH = 5.4;
  {
    const lb = style.batch(), UP = V3(0, 1, 0), bndAt = (y) => Math.min(Math.max(y / lilyH, 0), 1);
    const stemPts = []; for (let i = 0; i <= 3; i++) stemPts.push(V3(0.2 * Math.sin(i * 1.2), (i / 3) * 4.1, 0));
    for (const nrm of [V3(0, 0, 1), V3(1, 0, 0)]) style.ribbon(lb, stemPts, { half: (t) => 0.11 - 0.03 * t, ink: pal.teal, lw: 0.035, normal: nrm, bnd: (t) => bndAt(t * 4.1) });
    for (let j = 0; j < 2; j++) {                                       // leaves: blades thrown out and curling back
      const a = j * 2.9 + 0.4, v = V3(Math.cos(a), 0, Math.sin(a)), y0 = 0.6 + j * 1.2;
      const pts = style.whiplash({ origin: V3(0, y0, 0), u: UP, v, len: 2.6 - j * 0.3, n: 6, heading: 0.55, bend: 0.5, curl: 1.5 });
      style.ribbon(lb, pts, { half: almond(0.2, 0.6), ink: pal.teal, lw: 0.04, tone: halfTone(1), swell: 2,
        normal: V3().copy(UP).multiplyScalar(0.62).addScaledVector(v, -0.78), bnd: (t) => bndAt(y0 + t * 1.2) });
    }
    for (let j = 0; j < 6; j++) {                                       // six tepals: a trumpet whose lips curl back
      const a = (j / 6) * TAU, v = V3(Math.cos(a), 0, Math.sin(a));
      const pts = style.whiplash({ origin: V3(0, 4.0, 0), u: UP, v, len: 2.05, n: 6, heading: 0.26, bend: 0.25, curl: 1.9, curlAt: 0.5 });
      style.ribbon(lb, pts, { half: almond(0.42, 0.7), ink: pal.cream, lw: 0.055, tone: halfTone(j % 2 ? 1 : -1), swell: 2,
        normal: V3().copy(UP).multiplyScalar(0.62).addScaledVector(v, -0.78), bnd: () => 1 });
    }
    for (let j = 0; j < 3; j++) {                                       // gold stamens standing out of the mouth
      const a = j * 2.1 + 0.5, v = V3(Math.cos(a), 0, Math.sin(a));
      const pts = style.whiplash({ origin: V3(0, 4.3, 0), u: UP, v, len: 1.75, n: 4, heading: 0.16, bend: 0.2 });
      style.ribbon(lb, pts, { half: (t) => 0.05 + 0.1 * t * t, ink: pal.gold, gold: 1, lw: 0, normal: V3(-v.z, 0, v.x), bnd: () => 1 });
    }
    const lg = style.geometry(lb);
    // placement: seeded ranks (arcs facing the approach), rejected under the feeders and under the disc
    const lrng = rng.fork ? rng.fork('lilies') : rng, want = Math.round(300 * detail), keepOut = [];
    const cpos = coil.geometry.getAttribute('position'), cB = coil.geometry.getAttribute('hB');
    for (let i = 0; i < cpos.count; i += 15) if (cB.getZ(i) < 0) keepOut.push(cpos.getX(i), cpos.getZ(i));
    const lm = new Float32Array(want * 16), lA = new Float32Array(want * 4), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
    let n = 0;
    for (let tries = 0; tries < want * 12 && n < want; tries++) {
      const rank = Math.floor(lrng() * 9), rr = 12 + rank * 6.5 + lrng.range(-1.2, 1.2), a = lrng.range(-1.35, 1.35) + (lrng() < 0.22 ? Math.PI : 0);
      const x = Math.sin(a) * rr * 1.25, z = Math.cos(a) * rr + 2;
      if (lrng() < rank / 12) continue;                                  // thinner ranks further out
      if (Math.abs(z) < 7 && Math.abs(x) < 30) continue;
      let ok = true; for (let k = 0; k < keepOut.length; k += 2) if ((keepOut[k] - x) ** 2 + (keepOut[k + 1] - z) ** 2 < 30) { ok = false; break; }
      if (!ok) continue;
      const s = lrng.range(1.1, 1.75) * (1 + 0.3 * Math.max(0, 1 - rr / 30));
      M.compose(V3(x, (opts.hillY || hillY)(x, z) - 0.1, z), Q.setFromEuler(E.set(lrng.range(-0.1, 0.1), lrng() * TAU, lrng.range(-0.1, 0.1))), V3(s, s, s));
      M.toArray(lm, n * 16); lA.set([lrng() * 6.28, lrng() * 6.28, 0, 0], n * 4); n++;
      if (tries % 400 === 399) await ctx.yield?.();
    }
    const lilies = new THREE.InstancedMesh(lg, style.ink({ inst: true, bendy: true, grainScale: 3 }), n);
    lilies.instanceMatrix.array.set(lm.subarray(0, n * 16)); lilies.instanceMatrix.needsUpdate = true;
    lg.setAttribute('iA', new THREE.InstancedBufferAttribute(lA.subarray(0, n * 4), 4));
    lilies.frustumCulled = false; lilies.name = 'lilies'; root.add(lilies);
  }
  await ctx.yield?.();

  // ---- the summit itself (opts.mound !== false): a sage mound with drawn olive-sage hollows and a crest keyline.
  //      A world that builds its own hill passes mound: false and keeps its summit on or under hillY within 190 m.
  if (opts.mound !== false) {
    const mb = style.batch(), RINGS = 26, SEGS = 80, nz = ctx.noise;
    for (let i = 0; i <= RINGS; i++) for (let j = 0; j <= SEGS; j++) {
      const f = i / RINGS, r = 196 * f * (0.55 + 0.45 * f), a = (j / SEGS) * TAU, x = Math.sin(a) * r, z = Math.cos(a) * r;
      const lump = nz ? nz.fbm2(x * 0.011 + 3.1, z * 0.011 - 1.7, 3) : Math.sin(x * 0.05) * Math.sin(z * 0.04);
      mb.pos.push(x, hillY(x, z) + lump * 3.2 * f - 0.4, z); mb.nor.push(Math.sin(a) * 0.5 * f, 1, Math.cos(a) * 0.5 * f);
      mb.ink.push(pal.sage.r, pal.sage.g, pal.sage.b);
      const hollow = (nz ? nz.fbm2(x * 0.017 - 9.2, z * 0.009 + 4.4, 2) : Math.sin(x * 0.07 + z * 0.03)) * 1.6 + 0.32 + 0.25 * Math.sin(a * 3 + r * 0.03);
      mb.aux.push(99, 0.1, hollow, 0); mb.bnd.push(0);
      if (i < RINGS && j < SEGS) { const p = i * (SEGS + 1) + j, q = p + SEGS + 1; mb.idx.push(p, q, p + 1, p + 1, q, q + 1); }
    }
    const mg = style.geometry(mb), mound = new THREE.Mesh(mg, style.ink({ grainScale: 0.45 }));
    const crest = new THREE.Mesh(mg, style.hull({ weight: 0.003 }));
    mound.name = 'mound'; crest.name = 'mound-keyline'; root.add(crest, mound);
  }
  await ctx.yield?.();

  // ---- progress hooks and anchors
  const smooth = (x) => { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); };
  // viewer aids (tools/shot.mjs _part --query "part=whiplash-wind&wwsky=1&wwp=0.9&wwdown=0"): no effect in a world
  const qv = () => undefined;                                                      // (the viewer's query aids were removed: the gate forbids reading location)
  let progress = opts.progress ?? qv('wwp') ?? 0.6, letDown = opts.letDown ?? qv('wwdown') ?? 0;
  const applyCoil = () => {
    const wound = 215 + 215 * smooth(progress);                        // metres of each tress laid on the disc
    mHair.uniforms.uReveal.value = Math.max(wound * (1 - smooth((letDown - 0.25) / 0.75)), -80);
    for (const p of pins) p.position.copy(p.userData.dir).multiplyScalar(-95 * smooth(letDown * 2.2));
  };
  applyCoil();
  const fly = [];
  for (let i = 0; i <= 8; i++) {                                        // one turn of a tightening corkscrew, 210 m -> 70 m out
    const t = i / 8, th = -Math.PI / 2 + TAU * t, rho = 45 * Math.pow(1 - t, 0.85);
    fly.push(V3(Math.cos(th) * rho, CY + Math.sin(th) * rho, 210 - 140 * t));
  }
  fly.push(V3(0, CY, 35), V3(0, CY, 0), V3(0, CY, -30));
  const ownStyle = !opts.style;
  if (opts.sky ?? qv('wwsky')) root.add(style.sky());                               // viewer aid only: the world adds its own style.sky()
  return {
    object: root, radius: 78, height: 2 * R_OUT + 18, center: V3(0, CY, 0), ground: false, groundY: 0,
    style,
    anchors: {
      portalSeat: { position: V3(0, CY, 0), normal: V3(0, 0, 1), radius: R_OPEN },
      flyThrough: fly,
      tressFeet: feet,
      hairpinCross: pinX.clone().setZ(FZ + 2),
      viewpoints: [V3(0, CY - 20, 240), V3(95, CY + 8, 120), V3(-60, CY + 30, 95), V3(0, CY, 70)],
      hillY, discRadius: R_OUT, centreY: CY, faceZ: FZ,
    },
    setProgress(u) { progress = u; applyCoil(); },
    setLetDown(v) { letDown = Math.min(Math.max(v, 0), 1); applyCoil(); },
    update(dt, time, camera) { if (ownStyle) style.update(dt, time, camera); },
    dispose() {},
  };
}
