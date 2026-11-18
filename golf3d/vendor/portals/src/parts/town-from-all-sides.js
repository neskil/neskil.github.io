// The Town Seen from Everywhere: hero set piece + style kit (Analytic Cubism).
//
// STYLE KIT   const S = makeStyle(ctx, { palette })      (one instance per world; pass it on as opts.style)
//   S.pal        { bone, pearl, slate, sage, umber, black, terracotta }  linear THREE.Color (the seven and no others)
//   S.INK        { bone:0, pearl:1, slate:2, sage:3, umber:4, black:5, terracotta:6 }  ink index used by every facet
//   S.material   THE one material: unlit ShaderMaterial, double-sided, no fog. Draws facets, strokes, massing planes,
//                rising lozenges. Everything in the world should be a batch drawn with it.
//   S.batch(n)   -> B, a growable instance batcher. All positions are in the batch mesh's local space.
//       B.facet(O, U, V, o)   one flat plane with corner O and edge vectors U, V (a parallelogram; o.taper 0 = triangle).
//           o = { ink, hinge:{p,a,max,phase,bias}, child:{p,a,max,phase}, grad, dab, tone, sway, lod, kind, taper }
//           hinge: the plane turns about the line through p with unit direction a by an angle that depends ONLY on the
//           eye (bearing + range), times the fold F. Facets that share one hinge object move as one rigid sheet.
//           child: a second hinge applied first (a shutter on a swinging wall, an arc on a screen panel).
//           tone: the flat lock tone (use S.tone(normal)); grad: gradient direction in radians (omit = contradict the
//           previous facet); sway: radians of time wobble (washing, bell); lod 1 = shrink to nothing past S.u.uLod.x.
//           kind: S.FACET (default) | S.MASS (big massing plane, swings edge-on and vanishes inside uMass range)
//                 | S.RISE (lozenge that rises hinge.max metres and thins by shrinking: smoke)
//       B.stroke(A, Bp, o)    a black ribbon from A to Bp riding the same hinge(s): 0.18 m wide, held at >= 1.5 px,
//           overshooting each end by 8 % x F and missing its corner by o.miss metres x F (it meets exactly in the lock).
//           o.lod on a stroke: it is gone past o.lod x 450 m (0.3 = near detail only); o.off = exact miss vector.
//       B.quad(c, right, up, w, h, o), B.outline(O, U, V, edges, o)   helpers.   B.mesh() -> THREE.Mesh (1 draw call)
//   Post assumed: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } }:
//   inks are written exactly, never above 1.1 x ink (clamped), nothing glows. The ring is the one other material
//   (MeshBasicMaterial, vertex colours, same inks).
//   S.tone(n)    lock tone (1.0 lit / 0.8 half / 0.6 shade) for a closed-pose normal, light from the south-west (brief
//                space: +Z north). S.lightDir may be replaced (the hero sets it for its own local frame).
//   S.u          shared uniforms: uEye, uFold (F: 1 = cubist, 0 = locked true solid), uTime, uPx, uPal[7], uGrad
//                (dark 0.6, light 1.1, dab contrast), uMass (420, 600), uLod (450; y 0.5 = strokes go at half that range, so far planes stay planes), uDab (128 px dab canvas).
//   Added by the world builder: o.lockInk (the ink a facet takes in the lock: the sky settles to one pearl), o.sway < 0
//                (a wing beat instead of a slow wobble), kind S.SLIDE (the facet shifts hinge.max metres along hinge.a,
//                never turning: the train), S.u.uTemper (x sliders, y fans: the seeded hinge temper), S.u.uCut (dry noon:
//                facets cut on the diagonal into two flat tones),
//                stroke o.drift { v: [m/s], T: seconds } (a stroke that travels and starts again: the shower, the drips). hero.houses = the house list (for the reservoir's plan).
//                opts.lineY(stepLocal, r) -> local height of a washing line over that step (the world keeps them off its path).
//                opts.blocked(houseCentreLocal, height) -> true leaves that plot empty (the world's flight corridor).
//                opts.sight { ceil(local, r), clear(local, r), over(local) }: the world's sight cone from its climb to the ring.
//                opts.sight.len, opts.sight.at(d): the course we fly itself, hero-local, by metres of route (the washing's clear air).
//                Houses under the cone are kept low, sheets hang beside or below it, sky planes and cypresses stay out of it; houses
//                within 30 m of the flight get calmer hinges, a window pair on every wall and dressed roofs (o2.calm, o2.dress).
//                S.aside(fn): planes laid inside draw their gradient, dab and phase from a second stream, so detail can be
//                added without moving anything laid before or after. hinge.bias + 2 = a hinge that turns whatever the temper
//                (the tower's clock screen). S.u.uCap: a stroke under 0.7 m wide is never thicker than this share of the
//                frame's height near the eye (an accent, not a bar). addHouse(...) = house(...) for the world's forecourt.
//                o.quiet 0..1 (in eighths): the facet's gradient runs over a narrower range (0.6-1.1 at 0, 0.93-1.03 at 1):
//                sky shards and far ground are the picture's ground, the town keeps the full contradiction.
//   S.foldFn     (eyeWorld) => F. Default is the brief's: F = 1 - w(z) (1 - smoothstep(2, 26, |x|)), w = 1 south of
//                z -50 falling to 0 at z -15. Replace it for the "second lock" event.
//   S.update(dt, time, camera)   drives uEye (from camera.matrixWorld), uFold, uTime, uPx. Call once per frame.
//
// HERO   const hero = await buildHero(ctx, { style: S, palette, detail })
//   The stepped cone of ~900 hinged cube houses, its stair street, chimneys with lozenge smoke, washing, cypresses,
//   upright planes of sky wedged between houses, the stepped pile of massing planes that stands in from afar, and on the crown the
//   bell tower: three clock faces splayed like a folding screen (each clock four displaced arcs of chords) and the
//   south panel tipped 33 degrees carrying THE RING, the only true curve in the world, round the exit portal.
//   Local frame: origin at the centre of the hill's foot, +Y up, front (the approach side, the brief's south) = +Z.
//   In the world: hero.object.position.set(0, 18, 260); hero.object.rotation.y = Math.PI.
//   Size: radius 172, height 167.  Cost: see hero.stats (about 75k triangles, 2 draw calls, no lights, one 128 px
//   texture, about 100 ms of build in yielded steps of a few ms).  opts.detail 0.6-1 thins the strokes and smoke only.
//   anchors (local space; brief/world coordinates in brackets):
//     portalSeat { position (0,130,10) [0,148,250], normal (0,-sin33,cos33), radius 7, tilt 33 deg }   the ring
//     flyThrough  ordered points: foot of the stair street -> up it -> back onto the axis -> 70 m straight into the ring
//     stairStreet centre line of the 16 m street (no house within 8 m of it), with ground heights
//     viewpoints  { entry, lock, street, crownPass }   good eye positions;  towerTop, crown, bell
//   hero.setFold(F) forces the fold (null = follow S.foldFn); hero.update(dt, time, camera) calls S.update itself only
//   when it built its own style. Nothing here is on a clock that must meet the camera: the medium moves with the eye.
import * as THREE from 'three';

const DEF_PAL = ['#E7DDC8', '#B9BDB8', '#5F7489', '#8C9C7A', '#6A4D36', '#16130F', '#C2603A'];
const NAMES = ['bone', 'pearl', 'slate', 'sage', 'umber', 'black', 'terracotta'];

const VERT = /* glsl */`
attribute vec3 aPivot, aAxis, aO, aU, aV;
attribute vec4 aAng;   // max angle (rad) | rise height, phase, bias, kind
attribute vec4 aInk;   // ink index, gradient angle, dab angle, lock tone
attribute vec4 aFx;    // taper (stroke: width), sway, lod, miss (stroke)
attribute vec4 aP2, aA2; // child hinge: pivot + max angle, axis + phase
uniform vec3 uEye, uPal[7], uLit[7], uShade[7];
uniform vec4 uSun, uSky;   // uSun: the side the light comes from (unit) and how far the inks turn; uSky: the bearing (x, z) of the light part of the sky, its amount, the step's width
uniform float uFold, uTime, uPx, uCap;
uniform vec2 uMass, uLod, uTemper;   // uTemper: x 1 = sliders (facets shift instead of turning), y 1 = fans (twice the bearing)
varying vec2 vUv, vG, vDab;
varying vec3 vCol, vLock;
varying float vQ;      // how quiet this plane's gradient is (0 = the full dark edge to light edge, 1 = nearly flat)
varying vec3 vK;       // lock tone (2 = sky: toned by direction in the lock), stroke flag, the sky's direction against the plain light
vec3 rot(vec3 v, vec3 k, float a) { float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1. - c); }
// the hinge: a door turning about (pv, k), or, in the slider temper, the same plane shifted along its swing without turning
// (door 1: this hinge always turns, whatever the temper: the tower's folding screen must show its clocks)
vec3 swing(vec3 p, vec3 ref, vec3 pv, vec3 k, float a, float door) {
  return (uTemper.x > 0.5 && door < 0.5) ? p + cross(k, ref - pv) * a * 0.55 : pv + rot(p - pv, k, a);
}
void main() {
  vec2 q = position.xy;
  float kind = aAng.w, ph = aAng.y;
  vec3 pw = (modelMatrix * vec4(aPivot, 1.)).xyz;
  vec3 d = uEye - pw;
  float range = length(d);
  float soft = sqrt(dot(d.xz, d.xz) + 144.);          // softened bearing: near things fan fast but never whip
  float s1 = (d.x * sin(ph) + d.z * cos(ph)) / soft;
  float c1 = (d.x * cos(ph) - d.z * sin(ph)) / soft;
  s1 = mix(s1, 2. * s1 * c1, uTemper.y);
  float s = 0.7 * s1 + 0.3 * sin(range / 45. + ph * 1.7);
  // sway >= 0: a slow wobble (cloth, bell); sway < 0: a wing beat, three a second, in bouts between glides
  float sw = aFx.y >= 0. ? aFx.y * sin(uTime * 1.6 + ph * 3.1)
    : aFx.y * (0.18 + 0.82 * smoothstep(-0.35, 0.25, sin(uTime * 0.83 + ph * 2.))) * sin(uTime * 18.85 + ph * 3.1);
  // (repair 2, round 2) bias 6 marks a GATE hinge: a plane beside the path that swings away as the eye comes to it, by range
  // alone (shut beyond 64 m, wide open inside 36 m), whatever the temper
  float gat = step(5.5, aAng.z);
  float door = step(1.5, aAng.z), scr = step(3.5, aAng.z) * (1. - gat), bias = aAng.z - 2. * door - 2. * scr - 4. * gat;      // bias + 2 marks a hinge that always turns; bias + 4 the tower's screen
  float near = mix(1., smoothstep(34., 105., range), scr);      // (polish 2) the screen folds back onto the tower as the eye comes to the ring: no clock is cut by the frame's edge
  float scrIn = mix(1., smoothstep(30., 62., range), scr);      // (polish 3) and on the last metres its panels draw in behind the collar: no corner of a panel stands in front of the larger ring
  float ang = aAng.x * uFold * (bias + (1. - bias) * s) * near + sw;
  if (gat > 0.5) ang = aAng.x * uFold * (1. - smoothstep(36., 64., range));
  vec3 slide = vec3(0.);
  if (kind > 3.5) { slide = aAxis * ang; ang = 0.; }   // sliding plane (train): shifts ang metres along its axis
  float shrink = 1.;
  if (aFx.z > 0.01) {                                 // lod: 1 = gone past uLod.x, 0.4 = gone past 0.4 uLod.x ...
    float lr = range / (uLod.x * aFx.z * ((kind > 0.5 && kind < 1.5) ? (0.4 + 0.6 * uFold) * uLod.y : 1.));
    shrink = 1. - smoothstep(0.8, 1., lr);
  }
  if (kind > 1.5 && kind < 2.5) {                     // massing plane: shut far off, edge-on and gone inside uMass.x
    float open = 1. - smoothstep(uMass.x, uMass.y, range + 60. * sin(ph * 5.));
    // while it still stands it already turns a little with our range (a slow wave across the far town, from the
    // first seconds on, nil at the entry itself); a massing plane always turns, whatever the temper
    ang = aAng.x * open + 0.24 * sin(range / 36. + ph * 3.) * (1. - open) * (1. - smoothstep(640., 730., range));
    shrink = 1. - smoothstep(0.55, 1., open); door = 1.;
  }
  float ph2 = aA2.w;
  float s2 = (d.x * sin(ph2) + d.z * cos(ph2)) / soft;
  float ang2 = aP2.w * uFold * (0.55 + 0.45 * s2) * near;
  vec3 p; float isStroke = 0.;
  if (kind > 0.5 && kind < 1.5) {                     // stroke: a ribbon between two hinged points
    isStroke = 1.;
    vec3 off = aV * uFold * 0.45;                     // the hand misses its corner by a hand's width, never by a stride: a stroke stays on its edge
    vec3 A = aO + off - aU * 0.08 * uFold, B = aO + off + aU * (1. + 0.08 * uFold);
    A = aP2.xyz + rot(A - aP2.xyz, aA2.xyz, ang2); B = aP2.xyz + rot(B - aP2.xyz, aA2.xyz, ang2);
    vec3 mid = aO + 0.5 * aU;
    A = swing(A, mid, aPivot, aAxis, ang, door);   B = swing(B, mid, aPivot, aAxis, ang, door);
    vec3 Aw = (modelMatrix * vec4(A, 1.)).xyz, Bw = (modelMatrix * vec4(B, 1.)).xyz;
    float dw = 1.;
    if (aFx.w > 0.) {                                   // a drifting stroke (rain, drips): travels aA2.xyz m/s for aFx.w s, then again
      float td = fract(uTime / aFx.w + ph);
      vec3 dr = aA2.xyz * aFx.w * td; Aw += dr; Bw += dr;
      dw = smoothstep(0., 0.1, td) * (1. - smoothstep(0.85, 1., td));
    }
    vec3 m = mix(Aw, Bw, q.x);
    vec3 sd = cross(Bw - Aw, uEye - m);
    float sl = length(sd);
    sd = sl > 1e-5 ? sd / sl : vec3(0., 1., 0.);
    // a stroke is an accent: never under 1.5 px, and near the eye never a bar (under 0.7 m wide it is held to uCap of the
    // frame's height, about 4 px in 450; the clock's thick arcs are exempt)
    float rm = length(uEye - m), wf = rm * uPx;
    float w = max(aFx.x < 0.7 ? min(aFx.x, rm * uCap) : aFx.x, wf) * shrink * dw * near * scrIn;
    p = m + sd * (q.y - 0.5) * w;
    vUv = q; vDab = q;
  } else {
    float x = 0.5 + (q.x - 0.5) * mix(1., aFx.x, q.y);
    vec3 c = aO + 0.5 * (aU + aV);
    p = aO + aU * x + aV * q.y;
    if (kind > 2.5 && kind < 3.5) {                   // rising lozenge: climbs, drifts, thins by shrinking (a sliding plane, kind 4, keeps its size and only slides)
      float t = fract(uTime * 0.11 + ph);
      shrink *= (1. - t) * smoothstep(0., 0.12, t);
      p += vec3(0.25 * aAng.x * t * t, aAng.x * t, 0.);
      c += vec3(0.25 * aAng.x * t * t, aAng.x * t, 0.);
      ang = 0.6 * sin(ph * 40. + t * 3.);
    }
    p = c + (p - c) * shrink * scrIn;
    p = aP2.xyz + rot(p - aP2.xyz, aA2.xyz, ang2);
    p = swing(p, c, aPivot, aAxis, ang, door) + slide;
    p = (modelMatrix * vec4(p, 1.)).xyz;
    vUv = vec2(x, q.y);
    float da = aInk.z; vec2 m2 = vec2(x * length(aU), q.y * length(aV)) * 0.11;
    vDab = vec2(m2.x * cos(da) - m2.y * sin(da), m2.x * sin(da) + m2.y * cos(da)) + ph;
  }
  vG = vec2(cos(aInk.y), sin(aInk.y));
  vQ = floor((aInk.y + 0.04) / 6.28319) * 0.125;      // o.quiet rides on the angle as whole turns
  int ii = int(clamp(aInk.x, 0., 6.) + 0.5);
  vCol = uPal[ii];
  vLock = (aFx.w > 0.5 && isStroke < 0.5) ? uPal[int(clamp(aFx.w - 1., 0., 6.) + 0.5)] : vCol;
  // THE LIGHT (polish 3), in the manner of the style: no shading, no gradient of light. Each plane takes ONE of three
  // flat tones from the way it faces: its own ink, the ink's lit sister (warm and pale) when it faces the light, the
  // ink's deep sister when it faces away. The value is the same at every corner of the plane (instance data and
  // uniforms only). The light's side and strength are uniforms the world sweeps during the flight.
  if (isStroke < 0.5) {
    float L = 0., amt = uSun.w;
    // (repair 2: the rule that painted a shadow shape, a facet always in its deep sister, is gone with the shapes: nothing casts)
    if (aInk.w > 1.5) {                                          // sky: stepped by bearing, light behind the tower
      vec2 b = pw.xz - uEye.xz; b /= max(length(b), 1e-3);
      float ds = dot(b, uSky.xy) + 0.13 * sin(ph * 7.);
      L = ds > uSky.w ? 1. : ds > uSky.w - 0.3 ? 0. : -1.; amt = uSky.z * (L > 0.5 ? 0.6 : 1.);      // the light shards are a step paler, never a yellow wall
    } else {
      vec3 n = cross(aU, aV);
      n = rot(n, aA2.xyz, ang2);
      if (!(uTemper.x > 0.5 && door < 0.5)) n = rot(n, aAxis, ang);
      n = mat3(modelMatrix) * n; n /= max(length(n), 1e-6);
      if (dot(n, uEye - p) < 0.) n = -n;                              // the side we see
      float dl = dot(n, uSun.xyz);
      L = dl > 0.34 ? 1. : dl < -0.2 ? -1. : 0.;
    }
    amt *= uFold;
    if (L > 0.5) vCol = mix(vCol, uLit[ii], amt); else if (L < -0.5) vCol = mix(vCol, uShade[ii], amt);
  }
  float dome = 0.;
  if (aInk.w > 1.5 && aInk.w < 2.5) { vec3 dv = p - uEye; dome = dot(dv / max(length(dv), 1e-3), vec3(-0.5014, 0.6217, -0.6017)); }
  vK = vec3(aInk.w, isStroke, dome);
  vec4 clip = projectionMatrix * viewMatrix * vec4(p, 1.);
  clip.z -= isStroke * 0.0006 * clip.w;               // strokes sit on their facet without z-fighting
  gl_Position = clip;
}`;

const FRAG = /* glsl */`
uniform vec3 uPal[7], uGrad;
uniform float uFold, uCut;
uniform sampler2D uDab;
varying vec2 vUv, vG, vDab;
varying vec3 vCol, vK, vLock;
varying float vQ;
void main() {
  float t = clamp(dot(vUv - 0.5, vG) * 0.82 + 0.5, 0., 1.);
  float dab = texture2D(uDab, vDab).r * 2. - 1.;
  t = mix(t, step(0.5, t), uCut);                     // dry noon: each facet cut on its diagonal into two flat tones
  // a quiet plane (sky, far ground) still runs dark edge to light edge, over a narrower range: the ground of the picture
  float q = min(1., vQ * (1. + 0.3 * uCut));        // (cut into two flat tones, a quiet plane keeps them closer still)
  vec3 c = vCol * mix(mix(uGrad.x, 0.93, q), mix(uGrad.y, 1.03, q), t) * (1. + uGrad.z * dab * (1. - uCut) * (1. - 0.5 * vQ));
  // the lock: one flat tone per plane; the sky's planes settle into a dome of three broad tones, lightest toward the light
  float tone = vK.x > 1.5 ? (vK.z > -0.04 ? 1.1 : vK.z > -0.38 ? 0.9 : 0.72) : vK.x;
  c = mix(vLock * tone, c, uFold);
  if (vK.y > 0.5) c = uPal[5];
  gl_FragColor = vec4(c, 1.);
}`;

// ---- tiny array-vector helpers (everything in the kit takes [x, y, z]) ----
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const mad = (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const nrm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const UP = [0, 1, 0];
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function makeStyle(ctx, opts = {}) {
  const hex = opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PAL;
  const pal = {}, palArr = [];
  NAMES.forEach((n, i) => { pal[n] = new THREE.Color(hex[i]); palArr.push(pal[n]); });
  const INK = { bone: 0, pearl: 1, slate: 2, sage: 3, umber: 4, black: 5, terracotta: 6 };
  const rng = ctx.rng.fork ? ctx.rng.fork('cubist-style') : ctx.rng;

  // the dab canvas: short parallel brush marks, wrapped, sampled per facet at its own angle
  const N = 128, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, N, N); g.lineCap = 'round';
  for (let i = 0; i < 150; i++) {
    const x = rng() * N, y = rng() * N, l = 9 + rng() * 14, v = Math.round(128 + (rng() < 0.5 ? -1 : 1) * (40 + rng() * 87));
    g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 2.5 + rng() * 3.5;
    for (let ox = -N; ox <= N; ox += N) for (let oy = -N; oy <= N; oy += N) {
      g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + l, y + oy + l * 0.12); g.stroke();
    }
  }
  const dabTex = new THREE.CanvasTexture(cv);
  dabTex.wrapS = dabTex.wrapT = THREE.RepeatWrapping; dabTex.colorSpace = THREE.NoColorSpace;
  dabTex.generateMipmaps = true; dabTex.minFilter = THREE.LinearMipmapLinearFilter;

  const u = {
    uEye: { value: new THREE.Vector3(0, 60, 400) }, uFold: { value: 1 }, uTime: { value: 0 }, uPx: { value: 0.003 },
    uPal: { value: palArr }, uGrad: { value: new THREE.Vector3(0.6, 1.1, 0.07) },
    uMass: { value: new THREE.Vector2(420, 600) }, uLod: { value: new THREE.Vector2(450, 0.5) }, uDab: { value: dabTex },
    uTemper: { value: new THREE.Vector2(0, 0) }, uCut: { value: 0 }, uCap: { value: 0.0108 },
    // (polish 3) the light: each ink's lit sister and deep sister, the side the light comes from (w: how far the inks turn),
    // and the sky's light bearing. With w 0 the world is the even pearl morning it was.
    uLit: { value: palArr.map((c) => c.clone()) }, uShade: { value: palArr.map((c) => c.clone()) },
    uSun: { value: new THREE.Vector4(-0.94, 0.26, 0.2, 0) }, uSky: { value: new THREE.Vector4(0, 1, 0, 0.7) },
  };
  const material = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide, fog: false });

  const S = {
    pal, INK, u, material, FACET: 0, STROKE: 1, MASS: 2, RISE: 3, SLIDE: 4,
    lightDir: nrm([-0.5, 0.62, -0.6]),               // "one plain light in the south-west" (brief space, +Z north)
    tone(n) { const d = n[0] * S.lightDir[0] + n[1] * S.lightDir[1] + n[2] * S.lightDir[2]; return d > 0.4 ? 1.0 : d > -0.15 ? 0.8 : 0.6; },
    foldFn(e) { const w = 1 - sstep(-50, -15, e.z); return 1 - w * (1 - sstep(2, 26, Math.abs(e.x))); },
    forceFold: null,
    update(dt, time, camera) {
      camera.updateMatrixWorld?.();
      u.uEye.value.setFromMatrixPosition(camera.matrixWorld);
      u.uFold.value = S.forceFold != null ? S.forceFold : S.foldFn(u.uEye.value);
      u.uTime.value = time;
      let H = 720;
      if (ctx.renderer && ctx.renderer.getDrawingBufferSize) H = ctx.renderer.getDrawingBufferSize(_v2).y || 720;
      const p5 = camera.projectionMatrix ? camera.projectionMatrix.elements[5] : 1.6;
      u.uPx.value = 1.5 * 2 / (Math.max(p5, 0.1) * H);
      u.uCap.value = 0.0085 * 2 / Math.max(p5, 0.1);
    },
    batch(cap = 1024) { return makeBatch(S, cap); },
    dispose() { dabTex.dispose(); material.dispose(); },
  };
  let seed = Math.floor(rng() * 1e9) | 1;
  S._rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 8) / 16777216; };
  // a second stream for detail added later (street windows, the dressed arch): whatever is laid inside S.aside(fn)
  // draws from it, so every plane laid before keeps its own gradient, dab and phase
  let seed2 = (seed ^ 0x5bd1e995) | 1;
  const rand2 = () => { seed2 = (Math.imul(seed2, 1664525) + 1013904223) | 0; return (seed2 >>> 8) / 16777216; };
  S.aside = (fn) => { const keep = S._rand, ks = S._side; S._rand = rand2; S._side = true; try { return fn(rand2); } finally { S._rand = keep; S._side = ks; } };
  // a third stream, for the near layer and the other things added in the polish round: nothing laid from the first two moves
  let seed3 = (seed ^ 0x2545f491) | 1;
  const rand3 = () => { seed3 = (Math.imul(seed3, 1664525) + 1013904223) | 0; return (seed3 >>> 8) / 16777216; };
  S.own = (fn) => { const keep = S._rand, ks = S._side; S._rand = rand3; S._side = true; try { return fn(rand3); } finally { S._rand = keep; S._side = ks; } };
  return S;
}
const _v2 = new THREE.Vector2();

// A growable batch of facets and strokes: one InstancedBufferGeometry, one draw call with S.material.
const ATTR = [['aPivot', 3], ['aAxis', 3], ['aO', 3], ['aU', 3], ['aV', 3], ['aAng', 4], ['aInk', 4], ['aFx', 4], ['aP2', 4], ['aA2', 4]];
function makeBatch(S, cap) {
  const arr = {}; for (const [n, k] of ATTR) arr[n] = new Float32Array(cap * k);
  let n = 0, flip = 0;
  const grow = () => { cap *= 2; for (const [nm, k] of ATTR) { const a = new Float32Array(cap * k); a.set(arr[nm]); arr[nm] = a; } };
  const put = (nm, k, v) => { arr[nm].set(v, n * k); };
  const B = {
    get count() { return n; }, facets: 0, strokes: 0,
    _push(O, U, V, o, kind) {
      if (n >= cap) grow();
      const h = o.hinge, c = o.child;
      put('aPivot', 3, h ? h.p : O); put('aAxis', 3, h ? h.a : UP);
      put('aO', 3, O); put('aU', 3, U); put('aV', 3, V);
      const phase = h && h.phase != null ? h.phase : S._rand() * 6.283;
      put('aAng', 4, [h ? h.max : 0, phase, h && h.bias != null ? h.bias : 0.3, kind]);
      let grad = o.grad;
      if (grad == null) { if (S._side) grad = S._rand() * 6.283; else { flip ^= 1; grad = 0.5 + flip * Math.PI + (S._rand() - 0.5) * 1.5; } }
      grad = Math.min(6.2, ((grad % 6.28319) + 6.28319) % 6.28319) + 6.28319 * Math.round(Math.min(1, Math.max(0, o.quiet ?? 0)) * 8);
      put('aInk', 4, [o.ink ?? 0, grad, o.dab ?? S._rand() * 3.1416, o.tone ?? 0.8]);
      put('aFx', 4, [kind === 1 ? (o.width ?? 0.18) : (o.taper ?? 1), o.sway ?? 0, o.lod ?? 0, kind === 1 ? (o.drift ? o.drift.T : 0) : o.lockInk == null ? 0 : o.lockInk + 1]);
      put('aP2', 4, c ? [c.p[0], c.p[1], c.p[2], c.max] : [O[0], O[1], O[2], 0]);
      put('aA2', 4, c ? [c.a[0], c.a[1], c.a[2], c.phase ?? S._rand() * 6.283] : kind === 1 && o.drift ? [o.drift.v[0], o.drift.v[1], o.drift.v[2], 0] : [0, 1, 0, 0]);
      n++;
    },
    facet(O, U, V, o = {}) { B.facets++; B._push(O, U, V, o, o.kind ?? 0); },
    // a stroke from A to Bp; o.miss (metres) is how far the hand misses the corner when unfolded
    stroke(A, Bp, o = {}) {
      B.strokes++;
      const m = o.miss ?? 0.25, U = sub(Bp, A);
      const off = o.off ? o.off : m ? mul(nrm([S._rand() - 0.5, S._rand() - 0.5, S._rand() - 0.5]), m) : [0, 0, 0];
      B._push(A, U, off, o, 1);
    },
    // a w x h plane centred on c, spanned by unit vectors right and up
    quad(c, right, up, w, h, o = {}) { B.facet(mad(mad(c, right, -w / 2), up, -h / 2), mul(right, w), mul(up, h), o); },
    outline(O, U, V, which, o = {}) {
      const P = [O, add(O, U), add(add(O, U), V), add(O, V)];
      for (const e of which) B.stroke(P[e], P[(e + 1) % 4], o);
    },
    mesh() {
      const geo = new THREE.InstancedBufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]), 3));
      geo.setIndex([0, 1, 2, 0, 2, 3]);
      for (const [nm, k] of ATTR) geo.setAttribute(nm, new THREE.InstancedBufferAttribute(arr[nm].subarray(0, n * k), k));
      geo.instanceCount = n;
      const mesh = new THREE.Mesh(geo, S.material); mesh.frustumCulled = false;
      return mesh;
    },
  };
  return B;
}

// ---- the hill: a stepped cone, foot radius 170 at y 0, 32 degrees, crown radius 20 at y 94 (local metres) ----
const R0 = 170, RTOP = 20, HILL = 94, TIERS = 13, TH = HILL / TIERS, TW = (R0 - RTOP) / TIERS;
const STREET = [[-32, 178], [-26, 145], [-14, 95], [-5, 62], [0, 30], [0, 20.5]];      // stair street centre line (x, z)
function streetDist(x, z) {
  let best = 1e9;
  for (let i = 0; i < STREET.length - 1; i++) {
    const a = STREET[i], b = STREET[i + 1], dx = b[0] - a[0], dz = b[1] - a[1];
    const t = Math.min(1, Math.max(0, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t));
  }
  return best;
}
const coneY = (r) => Math.min(HILL, Math.max(0, (R0 - r) * (HILL / (R0 - RTOP))));

// angle (atan2(x, z)) at which the stair street crosses radius rho
function streetAngle(rho) {
  let best = 0, bd = 1e9;
  for (let i = 0; i < STREET.length - 1; i++) for (let t = 0; t <= 1.0001; t += 0.02) {
    const x = STREET[i][0] + (STREET[i + 1][0] - STREET[i][0]) * t, z = STREET[i][1] + (STREET[i + 1][1] - STREET[i][1]) * t;
    const d = Math.abs(Math.hypot(x, z) - rho); if (d < bd) { bd = d; best = Math.atan2(x, z); }
  }
  return best;
}

async function buildHill(ctx, S, B, rng, toneL, arcs) {
  const I = S.INK, rngH = rng;
  // beside the stair street a tier's riser is a street wall: two lower fronts standing proud of it that will not agree
  // with it or each other, and on every bay a door ajar or a window with its pair of shutters
  const streetWall = (P, Ut, out, tone, salt, rng0) => {
    const rng = rng0 || rngH;
    const L = len(Ut), ud = mul(Ut, 1 / L), alt = [I.bone, I.pearl, I.slate, I.bone, I.umber, I.pearl];
    for (let b = 0; b < 3; b++) {
      const wB = L * 0.3, proud = b === 1 ? 0.06 : 0.6, hB = b === 1 ? TH : TH * rng.range(0.55, 0.9);
      const O = mad(mad(P, ud, L * (b / 3 + 0.02)), out, proud), kr = rng();
      if (b !== 1) {
        B.facet(O, mul(ud, wB), [0, hB, 0], { ink: alt[(salt + b) % 6], tone });
        B.facet(mad(O, UP, hB), mul(ud, wB), mul(out, -0.6), { ink: alt[(salt + b + 3) % 6], tone: 1 });            // its top, seen as well
        B.stroke(mad(O, UP, hB), mad(mad(O, UP, hB), ud, wB), { miss: 0.3, lod: 0.5 });
        B.stroke(O, mad(O, UP, hB), { miss: 0.3, lod: 0.35 });
        // a front we pass at eight metres is not one slab: a plinth in another ink, a small upper window with its
        // shutters, a lintel stroke (second stream)
        S.aside((r2) => {
          const G = mad(O, out, 0.06), pink = alt[(salt + b + 4) % 6], hp = 0.8 + 0.5 * r2();
          B.facet(G, mul(ud, wB * (0.55 + 0.4 * r2())), [0, hp, 0], { ink: pink, tone: tone * 0.9, lod: 1.2 });
          B.stroke(mad(G, UP, hp), mad(mad(G, UP, hp), ud, wB * 0.5), { miss: 0.2, lod: 0.3 });
          if (hB > 4.6) {
            const ww = 1.2, wh = 1.3, shut = [I.sage, I.slate, I.pearl, I.sage][Math.floor(r2() * 4)], ph2 = r2() * 6.283;
            const W0 = mad(mad(G, ud, wB * (kr < 0.45 ? 0.2 : 0.68) - (kr < 0.45 ? 0 : ww)), UP, hB - wh - 0.7 - 0.3 * r2());
            B.facet(mad(mad(W0, ud, -0.12), UP, -0.12), mul(ud, ww + 0.24), [0, wh + 0.24, 0], { ink: I.black, tone: 1, lod: 1, grad: 1.2 });
            const S0 = mad(W0, out, 0.05), S1 = mad(S0, ud, ww);
            B.facet(S0, mul(ud, ww / 2), [0, wh, 0], { ink: shut, tone, lod: 1, child: { p: S0, a: hingeAxis(UP, ud, out), max: 1.9, phase: ph2 } });
            B.facet(mad(S0, ud, ww / 2), mul(ud, ww / 2), [0, wh, 0], { ink: shut, tone: tone * 0.92, lod: 1, child: { p: S1, a: hingeAxis(UP, mul(ud, -1), out), max: 1.9, phase: ph2 } });
            B.stroke(mad(mad(W0, ud, -0.3), UP, wh + 0.2), mad(mad(W0, ud, ww + 0.3), UP, wh + 0.2), { lod: 0.25, miss: 0.12 });
          }
        });
      }
      const F = mad(O, out, 0.05);
      if (kr < 0.45) {                                  // a door, its leaf ajar
        const D0 = mad(F, ud, wB * 0.22);
        B.facet(D0, mul(ud, 1.5), [0, 2.6, 0], { ink: I.black, tone: 1, lod: 1, grad: 1.2 });
        B.facet(mad(D0, out, 0.05), mul(ud, 1.5), [0, 2.6, 0], { ink: rng.pick([I.umber, I.slate, I.sage, I.pearl]), tone: tone * 0.9, lod: 1,
          child: { p: D0, a: hingeAxis(UP, ud, out), max: 1.5, phase: rng() * 6.283 } });
      }
      if (kr > 0.3) {                                   // a window and its two shutters
        const ww = 1.6, wh = 2.0, shut = rng.pick([I.sage, I.sage, I.slate, I.pearl]), ph2 = rng() * 6.283;
        const W0 = mad(mad(F, ud, wB * (kr < 0.45 ? 0.66 : 0.38)), UP, Math.max(0.9, Math.min(hB - wh - 0.6, 1.6 + kr * 1.6)));
        B.facet(mad(mad(W0, ud, -0.15), UP, -0.15), mul(ud, ww + 0.3), [0, wh + 0.3, 0], { ink: I.black, tone: 1, lod: 1, grad: 1.2 });
        const S0 = mad(W0, out, 0.05), S1 = mad(S0, ud, ww);
        B.facet(S0, mul(ud, ww / 2), [0, wh, 0], { ink: shut, tone, lod: 1, child: { p: S0, a: hingeAxis(UP, ud, out), max: 1.9, phase: ph2 } });
        B.facet(mad(S0, ud, ww / 2), mul(ud, ww / 2), [0, wh, 0], { ink: shut, tone: tone * 0.92, lod: 1, child: { p: S1, a: hingeAxis(UP, mul(ud, -1), out), max: 1.9, phase: ph2 } });
        B.stroke(mad(W0, ud, -0.3), mad(W0, ud, ww + 0.3), { lod: 0.25, miss: 0.12 });
      }
    }
  };
  // a pot cypress on the terrace walk: two crossed sage diamonds, fanning
  const pot = (base, h) => {
    const yaw = rng() * 3.1416, w = h * 0.3;
    for (const e of [0, 1]) {
      const d = [Math.cos(yaw + e * 1.5708), 0, Math.sin(yaw + e * 1.5708)];
      B.facet(base, mad(mul(d, w / 2), UP, h * 0.42), mad(mul(d, -w / 2), UP, h * 0.58), { ink: I.sage, tone: e ? 0.8 : 0.6, lod: 1.2, hinge: { p: base, a: UP, max: e ? 0.9 : -0.9, phase: yaw, bias: 0 } });
    }
    B.facet(mad(base, [-0.5, 0, 0], 1), [1, 0, 0], [0, 0.8, 0], { ink: I.umber, tone: 0.8, taper: 1.4, lod: 0.6 });
  };
  for (let k = 0; k < TIERS; k++) {
    const r = R0 - k * TW, r1 = r - TW, y0 = k * TH, y1 = y0 + TH, rm = r - TW / 2;
    // the tier is an arc that leaves the stair street open: it starts and ends 8 m either side of the centre line
    const aS = streetAngle(rm), gap = Math.asin(Math.min(0.9, 8.2 / rm));
    const start = aS + gap, span = 6.2832 - 2 * gap;
    arcs.push({ start, span, r, r1, y1 });
    const n = Math.max(8, Math.round((span * r) / 15));
    for (let i = 0; i < n; i++) {
      const a = start + (i / n) * span, b = start + ((i + 1) / n) * span, am = (a + b) / 2;
      const P = [Math.sin(a) * r, y0, Math.cos(a) * r], Q = [Math.sin(b) * r, y0, Math.cos(b) * r];
      const out = [Math.sin(am), 0, Math.cos(am)], cosH = Math.cos((b - a) / 2);
      const pick = rng();
      const tink = pick < 0.5 ? I.pearl : pick < 0.8 ? I.bone : pick < 0.92 ? I.sage : I.slate;
      const Pt = [P[0], y1, P[2]], Ut = sub(Q, P);
      B.facet(Pt, Ut, mul(out, -(r - r1) * cosH), { ink: tink, taper: r1 / r, tone: 1.0 });
      const rk = rng(), rink = rk < 0.55 ? I.umber : rk < 0.8 ? I.bone : rk < 0.93 ? I.slate : I.pearl;
      // (polish 2) beside the stair street the risers are not a run of umber slabs: two in three take the light's ink (bone to it, slate from it)
      const rinkN = (i < 6 || i >= n - 6) && (i + k) % 3 ? I.bone : rink;
      B.facet(P, Ut, [0, TH, 0], { ink: sunInk(I, rinkN, out, SUN), tone: toneL(out) });
      if (rng() < 0.6) B.stroke(mad(Pt, Ut, 0.12), mad(Pt, Ut, 0.5), { lod: 0.8, miss: 0.12 });      // (a short accent on the tier's edge: the whole edge ruled in black was a bar across the frame)
      if (i < 3 || i >= n - 3) {
        // beside the street a walk is paved: three plates in other inks, each tipping on its own edge, each with a stroke
        // (where a plot was left empty for the flight, this is what shows instead of one blank slab)
        S.aside((r2) => {
          const inn = mul(out, -(r - r1) * cosH), pv = [I.bone, I.pearl, I.umber, I.slate, I.sage, I.bone, I.pearl];
          for (const [fa, fb, j] of [[0.05, 0.08, 0], [0.37, 0.5, 1], [0.68, 0.12, 2]]) {
            const O = add(mad(mad(Pt, Ut, fa + 0.03 * r2()), inn, fb), [0, 0.06 + 0.02 * j, 0]), pu = mul(Ut, 0.25 + 0.05 * r2()), pw = mul(inn, 0.36 + 0.08 * r2());
            let ink = pv[(i + k * 2 + j * 3) % 7]; if (ink === tink) ink = pv[(i + k * 2 + j * 3 + 1) % 7];
            const hinge = { p: O, a: nrm(j % 2 ? pw : pu), max: 0.1 * (j % 2 ? 1 : -1), phase: r2() * 6.283, bias: 0.2 };
            B.facet(O, pu, pw, { ink, tone: 1, hinge, lod: 1.2, taper: 0.8 + 0.3 * r2() });
            B.stroke(mad(O, pw, 1), add(mad(O, pw, 1), mul(pu, 0.7)), { hinge, lod: 0.35, miss: 0.25 });
          }
        });
        streetWall(P, Ut, out, toneL(out), i + k);
        if (i === 0 || i === n - 1) for (const f of [0.25, 0.7]) pot(mad(mad(Pt, Ut, i === 0 ? f * 0.6 : 1 - f * 0.6), out, -1.3), rng.range(3, 4.6));
      } else if (i < 6 || i >= n - 6) S.aside((r2) => {       // the next three risers back are fronts too (from the second stream)
        const R = () => r2(); R.range = (a, b) => a + (b - a) * r2(); R.pick = (arr) => arr[Math.floor(r2() * arr.length)];
        streetWall(P, Ut, out, toneL(out), i + k, R);
      });
    }
    // end caps: the retaining walls of the street, a right triangle each (base on the riser, apex at the tread's back)
    for (const e of [0, 1]) {
      const a = start + e * span, O = [Math.sin(a) * r, y0, Math.cos(a) * r], apex = [Math.sin(a) * r1, y1, Math.cos(a) * r1];
      const U = [0, TH, 0], V = sub(apex, mad(O, U, 0.5));
      const nn = e ? [Math.cos(a), 0, -Math.sin(a)] : [-Math.cos(a), 0, Math.sin(a)];
      B.facet(O, U, V, { ink: e ? I.umber : I.bone, taper: 0, tone: toneL(nn) });
      B.stroke(add(O, U), apex, { miss: 0.3, lod: 0.6 });
    }
    await ctx.yield();
  }
  // crown plate
  B.quad([0, HILL + 0.15, 0], [1, 0, 0], [0, 0, 1], 41, 41, { ink: I.bone, tone: 1.0 });
  // the stair street: broad steps, 16 m wide, climbing the cone line
  let total = 0; const segL = [];
  for (let i = 0; i < STREET.length - 1; i++) { const l = Math.hypot(STREET[i + 1][0] - STREET[i][0], STREET[i + 1][1] - STREET[i][1]); segL.push(l); total += l; }
  const stairs = [];
  const at = (s) => { let i = 0; while (i < segL.length - 1 && s > segL[i]) { s -= segL[i]; i++; } const t = s / segL[i], a = STREET[i], b = STREET[i + 1];
    return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, dir: nrm([b[0] - a[0], 0, b[1] - a[1]]) }; };
  const stepD = 3.1, ns = Math.ceil(total / stepD);
  for (let i = 0; i < ns; i++) {
    const p = at(i * stepD), q = at((i + 1) * stepD);
    const y = coneY(Math.hypot(q.x, q.z)), yp = coneY(Math.hypot(p.x, p.z));
    const side = [p.dir[2], 0, -p.dir[0]];
    const O = [p.x - side[0] * 9.6, y, p.z - side[2] * 9.6], U = mul(side, 19.2), V = [q.x - p.x, 0, q.z - p.z];
    B.facet(O, U, V, { ink: i % 2 ? I.bone : I.pearl, tone: 1.0 });
    // a riser is three planes in three inks that will not agree, and its tread line three short strokes that miss one
    // another (never one rule across the street); the two added planes and strokes come from the third stream
    const rin = [I.umber, I.bone, I.umber, I.pearl, I.slate], rz = toneL(mul(p.dir, -1)), R0p = [O[0], yp, O[2]], rise = [0, y - yp, 0];
    if (y - yp > 0.05) B.facet(R0p, mul(U, 0.37), rise, { ink: rin[i % 5], tone: rz });
    B.stroke(mad(O, U, 0.05), mad(O, U, 0.26), { miss: 0.35, lod: 0.6 });
    S.own(() => {
      const fwd = mul(p.dir, -1);
      if (y - yp > 0.05) {
        const A1 = mad(mad(R0p, U, 0.37), fwd, 0.14), A2 = mad(mad(R0p, U, 0.69), fwd, 0.05);
        B.facet(A1, mul(U, 0.33), rise, { ink: rin[(i + 1) % 5] === rin[i % 5] ? I.slate : rin[(i + 1) % 5], tone: rz, taper: 0.92,
          hinge: { p: A1, a: hingeAxis(UP, U, fwd), max: 0.1, phase: i * 1.9, bias: 0.4 } });
        B.facet(A2, mul(U, 0.31), rise, { ink: rin[(i + 3) % 5], tone: rz,
          hinge: { p: mad(A2, U, 0.31), a: hingeAxis(UP, mul(U, -1), fwd), max: 0.12, phase: i * 2.7 + 1, bias: 0.4 } });
      }
      if (i % 2) B.stroke(mad(O, U, 0.66), mad(O, U, 0.84), { off: [0, 0.06, 0], lod: 0.6 });      // (one more short stroke on every other tread, on its edge)
    });
    stairs.push([p.x, y, p.z]);
  }
  return stairs;
}

// axis (+a or -a) about which a positive angle carries the free vector `free` toward the outward normal n
const hingeAxis = (a, free, n) => { const c = cross(a, free); return c[0] * n[0] + c[1] * n[1] + c[2] * n[2] >= 0 ? a : mul(a, -1); };

// ---- one cube house: four walls swinging like doors on their corners, a gable roof lifting like two lids,
//      windows whose shutters are a child hinge on the swinging wall, strokes riding the same hinges ----
// (exported as addHouse: the world stands a few of the same houses on the forecourt, in its own frame)
export function addHouse(S, B, rng, toneL, c, o, t, w, d, h, o2) { return house(S, B, rng, toneL, c, o, t, w, d, h, o2); }
// (polish 2) THE LIGHT IS STATED IN INK, as the Cubists stated it: nothing is lit and nothing casts, but a wall turned to
// the morning (the low light from the side, SUN in the hero's frame) is painted in bone, a wall turned from it in slate or
// umber, and the walls between keep their quarter's colour. Every plane still runs dark edge to light edge against its
// neighbour. So the hill is a volume: a warm side with terracotta lids, a blue side, and the terminator down the middle.
const SUN = [0.95, 0, -0.3];      // from the side and a little from behind the hill: seen down the axis the terminator runs through the middle of the town
const sunInk = (I, ink, n, sun) => {
  const f = n[0] * sun[0] + n[2] * sun[2];
  if (f > 0.45) return ink === I.slate || ink === I.umber || ink === I.sage ? I.bone : ink;
  if (f < -0.45) return ink === I.bone ? I.slate : ink === I.pearl ? I.umber : ink === I.sage ? I.slate : ink;
  return ink;
};
function house(S, B, rng, toneL, c, o, t, w, d, h, o2) {
  const I = S.INK, sun = o2.sun || SUN;
  const FL = mad(mad(c, o, d / 2), t, -w / 2), FR = mad(mad(c, o, d / 2), t, w / 2);
  const BR = mad(mad(c, o, -d / 2), t, w / 2), BL = mad(mad(c, o, -d / 2), t, -w / 2);
  const walls = [[FL, FR, o], [FR, BR, t], [BR, BL, mul(o, -1)], [BL, FL, mul(t, -1)]];
  const up = [0, h, 0], rh = o2.rh;
  const shutInk = rng.pick([I.sage, I.sage, I.slate, I.umber, I.pearl]);
  for (let i = 0; i < 4; i++) {
    const [P0, P1, n] = walls[i], U = sub(P1, P0), L = len(U), ud = mul(U, 1 / L);
    const ink = sunInk(I, rng() < 0.25 ? rng.pick([I.bone, I.pearl, I.slate, I.umber]) : o2.ink, n, sun);
    const atEnd = rng() < 0.5;
    // a wall that faces the stair street may only open a little: the corridor stays clear
    const facing = o2.toStreet && (n[0] * o2.toStreet[0] + n[2] * o2.toStreet[2]) > 0.25;
    let max = facing ? rng.range(0.2, 0.4) : rng.range(0.35, 1.3);
    if (o2.calm && !facing) max = 0.3 + (max - 0.35) * 0.3;
    if (o2.above) max = Math.min(max, 0.22);                        // under the climb a house stays shut enough to be a house from above        // beside the flight a house stays a house: its walls open a hand, not a door
    const hinge = { p: atEnd ? P1 : P0, a: hingeAxis(UP, atEnd ? mul(U, -1) : U, n), max, phase: rng() * 6.283, bias: 0.3 };
    const tone = toneL(n);
    B.facet(P0, U, up, { ink, tone, hinge });
    if (i % 2 === 1) B.facet(mad(P0, UP, h), U, [0, rh, 0], { ink, tone, hinge, taper: 0 });       // gable triangle
    // windows: front wall always, the others sometimes
    // (a house lowered under the sight line keeps the draws of the house it was: its upper row is laid as nil planes)
    const rows0 = (o2.h0 ?? h) > 10 ? 2 : 1, rows = h > 10 ? 2 : 1, nw = i === 0 ? (L > 7 ? 2 : 1 + (rng() < 0.5)) : (rng() < 0.45 ? 1 : 0);
    let f1 = 0.5;
    for (let rr = 0; rr < rows0; rr++) for (let k = 0; k < nw; k++) {
      const nil = rr >= rows, f = nw === 1 ? rng.range(0.35, 0.65) : 0.27 + 0.46 * k, ww = nil ? 0 : 1.3, wh = nil ? 0 : 1.7; f1 = f;
      const wy = (rows === 2 ? h * (0.28 + 0.4 * rr) : h * 0.5) - wh / 2 + rng.range(-0.3, 0.3);
      const W0 = mad(mad(mad(P0, ud, f * L - ww / 2), UP, wy), n, 0.05);
      B.facet(mad(mad(W0, ud, -0.15), UP, -0.15), mul(ud, nil ? 0 : ww + 0.3), [0, nil ? 0 : wh + 0.3, 0], { ink: I.black, tone: 1, hinge, lod: 1, grad: 1.2 });
      const S0 = mad(W0, n, 0.05), S1 = mad(S0, ud, ww);
      const ph2 = rng() * 6.283;
      B.facet(S0, mul(ud, ww / 2), [0, wh, 0], { ink: shutInk, tone, hinge, lod: 1, child: { p: S0, a: hingeAxis(UP, ud, n), max: 1.9, phase: ph2 } });
      B.facet(mad(S0, ud, ww / 2), mul(ud, ww / 2), [0, wh, 0], { ink: shutInk, tone: tone * 0.92, hinge, lod: 1, child: { p: S1, a: hingeAxis(UP, mul(ud, -1), n), max: 1.9, phase: ph2 } });
      if (o2.strokes && k === 0) B.stroke(mad(W0, ud, nil ? 0 : -0.3), mad(W0, ud, nil || o2.above ? (nil ? 0 : -0.3) : ww + 0.3), { hinge, lod: 0.25, miss: 0.12 });
    }
    // beside the stair street and under the climb no wall is left blank: every one gets its pair of shuttered windows
    if (o2.dress && nw < 2 && h >= 3.4) S.aside((r2) => {
      const fs = nw === 1 ? [f1 < 0.5 ? 0.79 : 0.21] : L > 5.2 ? [0.27, 0.73] : [0.5], ww = 1.5, wh = Math.min(2.0, h * 0.5);
      for (let rr = 0; rr < rows; rr++) for (const f of fs) {
        const wy = (rows === 2 ? h * (0.28 + 0.4 * rr) : h * 0.5) - wh / 2 + (r2() - 0.5) * 0.6;
        const W0 = mad(mad(mad(P0, ud, f * L - ww / 2), UP, wy), n, 0.05), S0 = mad(W0, n, 0.05), S1 = mad(S0, ud, ww), ph2 = r2() * 6.283;
        B.facet(mad(mad(W0, ud, -0.15), UP, -0.15), mul(ud, ww + 0.3), [0, wh + 0.3, 0], { ink: I.black, tone: 1, hinge, lod: 1, grad: 1.2 });
        B.facet(S0, mul(ud, ww / 2), [0, wh, 0], { ink: shutInk, tone, hinge, lod: 1, child: { p: S0, a: hingeAxis(UP, ud, n), max: 1.9, phase: ph2 } });
        B.facet(mad(S0, ud, ww / 2), mul(ud, ww / 2), [0, wh, 0], { ink: shutInk, tone: tone * 0.92, hinge, lod: 1, child: { p: S1, a: hingeAxis(UP, mul(ud, -1), n), max: 1.9, phase: ph2 } });
        B.stroke(mad(W0, ud, -0.3), mad(W0, ud, o2.above ? -0.3 : ww + 0.3), { hinge, lod: 0.25, miss: 0.12 });
      }
    });
    if (i === 0) {                                    // the door, a plain dark plane with its own leaf ajar
      const f = rng() < 0.5 ? 0.14 : 0.72, D0 = mad(mad(P0, ud, f * L), n, 0.05), dink = rng.pick([I.umber, I.slate, I.umber, I.black]);
      B.facet(D0, mul(ud, 1.3), [0, 2.3, 0], { ink: I.black, tone: 1, hinge, lod: 1, grad: 1.2 });
      B.facet(mad(D0, n, 0.05), mul(ud, 1.3), [0, 2.3, 0], { ink: dink, tone: tone * 0.9, hinge, lod: 1, child: { p: D0, a: hingeAxis(UP, ud, n), max: 1.5, phase: rng() * 6.283 } });
    }
    if (o2.strokes && (i === 0 || rng() < 0.4 * o2.strokes)) {
      // (seen from above on the climb, o2.above: no wall strokes at all, only the roof's edges below; the draws are kept)
      const hs = o2.above ? 0 : h, PT = mad(P0, UP, h);
      B.stroke(P0, mad(P0, UP, hs), { hinge, lod: i === 0 ? 0.75 : 0.4 }); B.stroke(PT, o2.above ? PT : mad(P1, UP, h), { hinge, lod: 0.4 });
      if (i === 0) B.stroke(P1, mad(P1, UP, hs), { hinge, lod: 0.3 });
    }
  }
  // roof: two lids hinged at the eaves (or at the ridge), meeting on the ridge when the fold closes
  const ov = 0.45, rink = o2.roofInk;
  for (const sgn of [1, -1]) {
    const os = mul(o, sgn);
    const E0 = mad(mad(mad(c, os, d / 2 + ov), t, -w / 2 - ov), UP, h - ov * (rh / (d / 2)));
    const U = mul(t, w + 2 * ov), V = mad(mul(os, -(d / 2 + ov)), UP, rh + ov * (rh / (d / 2)));
    const n = nrm(mad(mul(os, rh), UP, d / 2));
    const atRidge = rng() < 0.35;
    const hinge = { p: atRidge ? add(E0, V) : E0, a: hingeAxis(t, atRidge ? mul(V, -1) : V, n), max: rng.range(0.3, 1.0) * (o2.above ? 0.3 : o2.calm ? 0.5 : 1), phase: rng() * 6.283, bias: 0.4 };
    B.facet(E0, U, V, { ink: rink, tone: toneL(n), hinge });
    if (o2.strokes) { B.stroke(E0, add(E0, U), { hinge, lod: sgn === 1 ? 0.55 : 0.3 }); if (sgn === 1) B.stroke(add(E0, V), add(add(E0, V), U), { hinge, lod: 1 }); }
    // beside the flight a lid is never one blank plane: a patch of other tiles, a skylight with its leaf lifted, a stroke
    if (o2.dress) S.aside((r2) => {
      const alt = rink === I.terracotta ? I.umber : rink === I.slate ? I.pearl : rink === I.pearl ? I.slate : I.bone, lift = mul(n, 0.07), tn = toneL(n);
      B.facet(add(mad(mad(E0, U, 0.05 + 0.1 * r2()), V, 0.12), lift), mul(U, 0.34 + 0.12 * r2()), mul(V, 0.5 + 0.22 * r2()), { ink: alt, tone: tn, hinge, lod: 1 });
      const K0 = add(mad(mad(E0, U, 0.6 + 0.12 * r2()), V, 0.3), lift), ku = mul(U, 1.3 / len(U)), kv = mul(V, Math.min(0.5, 1.5 / len(V)));
      B.facet(K0, ku, kv, { ink: I.black, tone: 1, hinge, lod: 1, grad: 1.2 });
      B.facet(add(K0, lift), ku, kv, { ink: shutInk, tone: tn, hinge, lod: 1, child: { p: add(K0, kv), a: hingeAxis(nrm(U), mul(kv, -1), n), max: 1.3, phase: r2() * 6.283 } });
      B.stroke(mad(mad(E0, U, 0.08), V, 0.66), mad(mad(E0, U, o2.above ? 0.08 : 0.5), V, 0.66), { hinge, lod: 0.3, miss: 0.2 });
    });
  }
  return { top: mad(c, UP, h + rh) };
}

async function buildHouses(ctx, S, B, rng, toneL, arcs, detail, blocked, sight, moveN = 0) {
  const I = S.INK, list = [], slots = [];
  let count = 0;
  // (repair 3) opts.moved: that many houses of the lowest tier on the hill's far side (the side the flight never sees) are
  // not stood there: the world stands them on the street beyond the arch instead, so the town has as many houses as it
  // had. Each is still laid here as nil planes (the same draws, the same count of planes), so nothing else on the hill moves.
  const NIL3 = [0, 0, 0], NILB = { facet: (O, U, V, o) => B.facet(O, NIL3, NIL3, o), stroke: (A, Bp, o) => B.stroke(A, A, o) };
  let nGone = 0;
  const q1 = rng() * 6.283, q2 = rng() * 6.283, tallRate = rng.range(0.08, 0.2), stackRate = rng.range(0.2, 0.36);   // per-seed quarters and skyline
  // the rows: the thirteen tiers, then a row on the forecourt at the hill's foot (the lower town seen through the arches)
  // and a second, lower row down the ramp either side of the cypress avenue, which stands in the arches from the lock
  const rampY = (am, rc) => 2 + 16 * sstep(10, 90, 260 - rc * Math.cos(am)) - 18 - 0.3;      // the world's forecourt ramp, in this frame
  const rows = arcs.slice(0, TIERS).concat([{ start: -1.0, span: 2.0, r1: R0 + 3.5, y1: -0.5 }, { start: -0.5, span: 1.0, r1: R0 + 32, y1: -8, yOf: rampY }]);
  for (let k = 0; k < rows.length; k++) {
    const A = rows[k], tall = k >= TIERS - 3 && k < TIERS;
    let a = A.start + 1.2 / A.r1;
    const end = A.start + A.span - 1.2 / A.r1;
    while (true) {
      const w = rng.range(6, 8), d = Math.min(rng.range(6, 8), TW - 2.5);
      let h = tall ? rng.range(10.5, 15) : rng() < tallRate ? rng.range(9, 13) : rng.range(6, 8);
      const rc = A.r1 + d / 2 + 0.5 + rng() * 1.2, da = w / rc;
      if (a + da > end) break;
      const am = a + da / 2 + 0, tw = rng.range(-0.16, 0.16);
      const o = [Math.sin(am + tw), 0, Math.cos(am + tw)], t = [Math.cos(am + tw), 0, -Math.sin(am + tw)];
      const c = [Math.sin(am) * rc, A.yOf ? A.yOf(am, rc) : A.y1, Math.cos(am) * rc];
      const sd = streetDist(c[0], c[2]);
      // the tower-houses packed round the top: beside the last straight they stand twice as tall, so there are roofs
      // in the lower frame all the way into the ring
      if (k >= TIERS - 2 && k < TIERS && Math.abs(c[0]) > 16 && c[2] > -34) h *= 1.75 + 0.55 * Math.sin(am * 7);
      let toStreet = null;
      if (sd < 26) { const e = 0.5; toStreet = nrm([streetDist(c[0] - e, c[2]) - streetDist(c[0] + e, c[2]), 0, streetDist(c[0], c[2] - e) - streetDist(c[0], c[2] + e)]); }
      if (sd < 16 && !tall) h = Math.min(h, 8);
      // quarters: the town's colour is massed by bearing (a slate quarter, a bone quarter, an umber one)
      const dv = 0.6 * Math.sin(2 * am + q1) + 0.6 * Math.sin(3 * am + q2 + k * 0.35), wi = rng();
      void dv;
      // (polish 2) the quarters follow the light: the side of the hill turned to it is the bone quarter, one lid in three
      // terracotta; the side turned from it the slate quarter under slate and umber lids; between them the mixed town
      const sf = Math.sin(am) * SUN[0] + Math.cos(am) * SUN[2], ri = rng();
      const ink = sf > 0.25 ? (wi < 0.66 ? I.bone : wi < 0.8 ? I.pearl : wi < 0.93 ? I.umber : I.slate)
        : sf < -0.25 ? (wi < 0.62 ? I.slate : wi < 0.86 ? I.umber : I.pearl)
        : wi < 0.42 ? I.bone : wi < 0.6 ? I.pearl : wi < 0.82 ? I.slate : I.umber;
      const roofInk = count % 9 === 4 ? I.terracotta
        : sf > 0.25 ? (ri < 0.32 ? I.terracotta : ri < 0.74 ? I.umber : ri < 0.86 ? I.slate : I.bone)
        : sf < -0.25 ? (ri < 0.03 ? I.terracotta : ri < 0.62 ? I.slate : ri < 0.92 ? I.umber : I.pearl)
        : ri < 0.14 ? I.terracotta : ri < 0.55 ? I.slate : ri < 0.9 ? I.umber : I.bone;
      const strokes = detail >= 1 || count % 5 < 3 ? 1 : 0;
      if ((blocked && blocked(c, h + 2.5)) || (k === TIERS && sd < 10) || (k > TIERS && Math.abs(c[0]) < 24)) { a += da + 0.8 / rc; continue; }      // the world's flight corridor: this plot stays empty
      // under the sight line from the climb to the ring a house is kept low, so the tower stands clear above the street;
      // beside the flight (within 30 m) its hinges are calmer and every wall is dressed with windows
      const cap = sight ? sight.ceil(c, 6.5) - c[1] : 1e9, ov = sight ? sight.over(c) : null, h0 = h;
      if (cap < h + 4) h = Math.max(4.2, cap - 4);
      const calm = !!ov && ov.dist < 30 && ov.y - c[1] < 48, dress = calm && (sd < 26 || ov.dist < 24);
      const above = !!ov && ov.dist < 42 && ov.y > 31;      // the houses the climb passes over (from the top of the stair street to the ring)
      // a terracotta roof is pitched steep and tipped to the eye, so the accent shows from below as well as from above
      // (polish 2) a lid the climb passes close over is never a blank umber slab: terracotta or slate, and dressed
      const roofInk1 = above && roofInk === I.umber ? (count % 2 ? I.terracotta : I.slate) : roofInk;
      const gone = k === 0 && nGone < moveN && Math.cos(am) < -0.82, Bh = gone ? NILB : B;
      if (gone) nGone++;
      const hs = house(S, Bh, rng, toneL, c, o, t, w, d, h, { ink, roofInk: roofInk1, toStreet, strokes, calm, dress, above, h0, rh: rng.range(0.9, 1.9) * (roofInk === I.terracotta ? 2.3 : 1) });
      let top = hs.top;
      if (sd >= 16 && rng() < stackRate) {            // a smaller cube stacked on the roof: the pile of cubes
        const w2 = w * rng.range(0.5, 0.7), d2 = d * rng.range(0.55, 0.75), h2 = Math.min(rng.range(3, 4.6), Math.max(2.2, cap - h - 3));
        const c2 = mad(mad(mad(c, UP, h), t, rng.range(-1, 1) * (w - w2) / 2), o, -(d - d2) / 2 * rng());
        top = house(S, Bh, rng, toneL, c2, o, t, w2, d2, h2, { ink: rng() < 0.6 ? ink : I.bone, roofInk: rng() < 0.12 ? I.terracotta : roofInk, toStreet, strokes, calm, dress, above, rh: rng.range(0.7, 1.3) }).top;
      }
      list.push({ c, o, t, w, d, h, top, tier: k, sd, moved: gone });
      count++;
      const gapM = rng() < 0.12 ? rng.range(4, 7) : rng.range(0.3, 1.6);
      if (gapM > 4 && k <= TIERS) slots.push({ a: a + da + gapM / 2 / rc, r: rc, y: A.y1, tier: k });
      a += da + gapM / rc;
      if (count % 60 === 0) await ctx.yield();
    }
  }
  return { list, slots, moved: nGone };
}

// ---- the bell tower: shaft, a clock stage whose three free faces are one folding screen (W | chain E + N),
//      the tipped south collar round the ring, an open belfry with the swinging bell, a cap of four lids ----
const TILT = 33 * Math.PI / 180, RING_C = [0, 130, 10], RING_R = 9.5;      // (polish 3: a larger exit; the collar and the bands grow with it)
const RING_N = [0, -Math.sin(TILT), Math.cos(TILT)], RING_UP = [0, Math.cos(TILT), Math.sin(TILT)];
function buildTower(S, B, rng, toneL) {
  const I = S.INK, y0 = HILL, yA = 118, yB = 142, yC = 150, yD = 161, hw = 10;
  const C = [[-hw, hw], [hw, hw], [hw, -hw], [-hw, -hw]];                     // SW, SE, NE, NW seen from the front (+Z)
  const N4 = [[0, 0, 1], [1, 0, 0], [0, 0, -1], [-1, 0, 0]];
  const inks = [I.bone, I.pearl, I.bone, I.slate];
  // shaft: each face two half-walls hinged on the corners, a dark core behind the seams
  for (let i = 0; i < 4; i++) {
    const a = C[i], b = C[(i + 1) % 4], n = N4[i];
    const P0 = [a[0], y0, a[1]], P1 = [b[0], y0, b[1]], U = sub(P1, P0), M = mad(P0, U, 0.5), up = [0, yA - y0, 0];
    const h0 = { p: P0, a: hingeAxis(UP, U, n), max: 0.32, phase: rng() * 6.283, bias: 0.45 };
    const h1 = { p: P1, a: hingeAxis(UP, mul(U, -1), n), max: 0.32, phase: rng() * 6.283, bias: 0.45 };
    const pair = [[I.pearl, I.bone], [I.bone, I.bone], [I.umber, I.slate], [I.slate, I.slate]][i];      // (polish 2: bone to the light, slate from it)
    B.facet(P0, mul(U, 0.5), up, { ink: pair[0], lockInk: I.umber, tone: toneL(n), hinge: h0 });       // in the lock: one plain umber campanile
    B.facet(M, mul(U, 0.5), up, { ink: pair[1], lockInk: I.umber, tone: toneL(n), hinge: h1 });
    B.stroke(P0, add(P0, up), { hinge: h0, width: 0.3, miss: 0.5 });
    B.stroke(mad(P0, UP, 12), mad(mad(P0, UP, 12), U, 0.5), { hinge: h0, miss: 0.4, lod: 0.8 });
    B.stroke(add(M, up), add(P1, up), { hinge: h1, width: 0.26, miss: 0.5, lod: 0.8 });
    const ud = nrm(U);
    for (const [f, y, hg] of [[0.25, 8, h0], [0.75, 15, h1]]) {                 // slit windows
      B.facet(mad(mad(mad(P0, U, f), UP, y), n, 0.06), mul(ud, 1.4), [0, 3.4, 0], { ink: I.black, tone: 1, hinge: hg, grad: 1.2 });
    }
    // core: full under the shaft; in the clock stage it stands back so the tipped collar can tuck in front of it
    const q = 0.82, c0 = [a[0] * q, y0, a[1] * q], c1 = [b[0] * q, y0, b[1] * q];
    B.facet(c0, sub(c1, c0), [0, yA - y0, 0], { ink: I.umber, tone: toneL(n) * 0.75 });
    const zf = (z) => (z > 0 ? 1.5 : z * q), d0 = [a[0] * q, yA, zf(a[1])], d1 = [b[0] * q, yA, zf(b[1])];
    B.facet(d0, sub(d1, d0), [0, yC - yA, 0], { ink: i === 0 ? I.pearl : i === 2 ? I.umber : I.slate, lockInk: I.umber, tone: toneL(n) * (i === 0 ? 1 : 0.75) });
  }
  // clock stage: three screen panels with their clocks
  const clock = (O, U, V, n, o) => {
    const ctr = mad(mad(O, U, 0.5), V, 0.5), ud = nrm(U), vd = nrm(V), R = 8.4, f0 = mad(ctr, n, 0.08);
    const P = (a, r) => mad(mad(f0, ud, Math.cos(a) * r), vd, Math.sin(a) * r);
    B.facet(P(Math.PI, R * 1.12), sub(P(-Math.PI / 2, R * 1.12), P(Math.PI, R * 1.12)), sub(P(Math.PI / 2, R * 1.12), P(Math.PI, R * 1.12)), { ...o, ink: I.bone });
    const a0 = rng() * 1.5;
    for (let k = 0; k < 4; k++) {                    // four arcs of five chords, each arc displaced until the lock
      const da = 1.5 + rng.range(0.8, 2.3) * 0.8, aa = a0 + k * 1.5708 + rng.range(-0.6, 0.6) + 0.78 + (k % 2 ? 0 : 3.1416);   // every other arc pushed inward
      const off = mad(mad([0, 0, 0], ud, Math.cos(aa) * da), vd, Math.sin(aa) * da);
      for (let j = 0; j < 5; j++) B.stroke(P(a0 + (k + j / 5) * 1.5708, R), P(a0 + (k + (j + 1) / 5) * 1.5708, R), { ...o, width: 1.25, off });
    }
    const ha = rng() * 6.283, hb = ha + rng.range(1.2, 4.2);
    B.stroke(f0, P(ha, R * 0.7), { ...o, width: 0.8, miss: 0.9, lod: 3 }); B.stroke(f0, P(hb, R * 0.45), { ...o, width: 1.0, miss: 0.9, lod: 3 });
  };
  const panel = (i, hinge, child) => {
    const a = C[i], b = C[(i + 1) % 4], n = N4[i], O = [a[0], yA, a[1]], U = [b[0] - a[0], 0, b[1] - a[1]], V = [0, yB - yA, 0];
    const o = { hinge, child, tone: toneL(n) };
    B.facet(O, mul(U, 0.5), V, { ...o, ink: i === 2 ? I.pearl : I.bone }); B.facet(mad(O, U, 0.5), mul(U, 0.5), V, { ...o, ink: i === 2 ? I.bone : I.pearl });   // bone clock panels
    B.outline(O, U, V, [0, 1, 2, 3], { ...o, width: 0.3, miss: 0.5, lod: 0.85 });
    clock(O, U, V, n, o);
  };
  const SE = [hw, yA, hw], SW = [-hw, yA, hw], NE = [hw, yA, -hw];
  const hE = { p: SE, a: hingeAxis(UP, [0, 0, -1], [1, 0, 0]), max: 1.22, phase: 1.5708, bias: 4.7 };
  const hW = { p: SW, a: hingeAxis(UP, [0, 0, -1], [-1, 0, 0]), max: 1.22, phase: -1.5708, bias: 4.7 };
  panel(1, hE, null);
  panel(2, hE, { p: NE, a: hingeAxis(UP, [-1, 0, 0], [0, 0, -1]), max: 1.75, phase: 2.4 });
  panel(3, hW, null);
  // the south collar: eight trapezoid petals round the ring, tipped with the path, lifting a little on their inner edges
  const right = [1, 0, 0], ri = 10.7, ro = 15.4, t8 = Math.tan(Math.PI / 8);
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4, rad = mad(mul(right, Math.cos(a)), RING_UP, Math.sin(a)), tan = mad(mul(right, -Math.sin(a)), RING_UP, Math.cos(a));
    const Oi = mad(mad(RING_C, rad, ri), tan, -ri * t8), Ui = mul(tan, 2 * ri * t8);
    // facet's U is the wide outer edge, so build from the outside in
    const Oo = mad(mad(RING_C, rad, ro), tan, -ro * t8), Uo = mul(tan, 2 * ro * t8);
    const hinge = { p: Oi, a: hingeAxis(nrm(Ui), rad, RING_N), max: 0.4, phase: rng() * 6.283, bias: 0.35 };
    B.facet(Oo, Uo, mul(rad, ri - ro), { ink: [I.bone, I.pearl, I.slate, I.bone, I.pearl, I.bone, I.slate, I.pearl][k], taper: ri / ro, tone: toneL(RING_N), hinge });
    B.stroke(Oo, add(Oo, Uo), { hinge, width: 0.3, miss: 0.5 });
    if (k % 2) B.stroke(Oi, Oo, { hinge, width: 0.24, miss: 0.4, lod: 0.8 });
  }
  // belfry: floor, corner posts, roof plate, and the bell (profile and mouth at once), swinging
  B.quad([0, yB, 0], [1, 0, 0], [0, 0, 1], 21, 21, { ink: I.umber, tone: 0.8 });
  B.quad([0, yC, 0], [1, 0, 0], [0, 0, 1], 22, 22, { ink: I.bone, tone: 1 });
  for (let i = 0; i < 4; i++) {
    const a = C[i], b = C[(i + 1) % 4], n = N4[i], P0 = [a[0], yB, a[1]], U = [b[0] - a[0], 0, b[1] - a[1]], up = [0, yC - yB, 0];
    B.facet(P0, mul(U, 0.2), up, { ink: inks[(i + 1) % 4], tone: toneL(n) }); B.facet(mad(P0, U, 0.8), mul(U, 0.2), up, { ink: inks[i], tone: toneL(n) });
    B.stroke(P0, add(P0, up), { width: 0.26, lod: 0.8 }); B.stroke(add(P0, up), add(add(P0, up), U), { width: 0.3, miss: 0.5 });
    // cap: four triangular lids
    const E = [a[0] * 1.08, yC, a[1] * 1.08], Ue = mul(U, 1.08), apex = [0, yD, 0], V = sub(apex, mad(E, Ue, 0.5));
    const nn = nrm(mad(mul(n, yD - yC), UP, hw));
    const hinge = { p: E, a: hingeAxis(nrm(Ue), V, nn), max: 0.55, phase: rng() * 6.283, bias: 0.45 };
    B.facet(E, Ue, V, { ink: i % 2 ? I.slate : I.pearl, taper: 0, tone: toneL(nn), hinge });
    B.stroke(add(E, Ue), apex, { hinge, width: 0.26, miss: 0.6 });
  }
  // finial and a pennant lozenge in the west air
  const fh = { p: [0, yD, 0], a: UP, max: 0.5, phase: 0.4, bias: 0 };
  B.stroke([0, yD - 0.5, 0], [0, yD + 6, 0], { width: 0.3, miss: 0.3 });
  B.facet([0, yD + 4.6, 0], [2.4, 0.7, 0], [2.4, -0.7, 0], { ink: I.slate, tone: 0.8, hinge: fh, sway: 0.5 });
  const bellTop = [0, yC - 0.6, 3.5], bh = { p: bellTop, a: [0, 0, 1], max: 0, phase: 1.0 };
  for (const zz of [3.5, -3.5]) {
    const top = [0, yC - 0.6, zz], hb = { p: top, a: [0, 0, 1], max: 0, phase: zz };
    B.facet([-3, yC - 6.6, zz], [6, 0, 0], [0, 5.8, 0], { ink: I.terracotta, taper: 0.4, tone: 1, hinge: hb, sway: 0.42, grad: 0.3 });
    B.facet([-3, yC - 6.6, zz + 0.05], [3, -1.2, 0], [3, 1.2, 0], { ink: I.black, tone: 1, hinge: hb, sway: 0.42 });   // the mouth, a lozenge
    B.stroke([0, yC - 6.9, zz + 0.1], [0, yC - 7.9, zz + 0.1], { hinge: hb, sway: 0.6, width: 0.3, miss: 0 });              // the clapper
  }
  return { top: [0, yD, 0], bell: bellTop, bh };
}

// THE RING: the only true curve. A 96-segment annulus in plain flat ink: terracotta inner band, bone, one black line.
function buildRing(S) {
  const seg = 96, bands = [[RING_R, 11.0, S.pal.terracotta], [11.0, 11.45, S.pal.bone], [11.45, 11.78, S.pal.black], [11.78, 12.8, S.pal.bone]];
  const pos = [], col = [], idx = [];
  for (const [r0, r1, c] of bands) {
    const base = pos.length / 3;
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * 6.2832, ca = Math.cos(a), sa = Math.sin(a);
      for (const r of [r0, r1]) { pos.push(ca * r, RING_UP[1] * sa * r, RING_UP[2] * sa * r); col.push(c.r, c.g, c.b); }
      if (i < seg) { const k = base + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false, toneMapped: false }));
  mesh.position.set(RING_C[0] + RING_N[0] * 0.12, RING_C[1] + RING_N[1] * 0.12, RING_C[2] + RING_N[2] * 0.12);
  return mesh;
}

// ---- clear air for the washing: the least distance between two straight pieces and from a point to a flat triangle, and
//      our course as chords (sight.at, sight.len: the course itself, hero-local, by metres of route) ----
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
function segSeg(p1, q1, p2, q2) {
  const d1 = sub(q1, p1), d2 = sub(q2, p2), r = sub(p1, p2), a = dot3(d1, d1), e = dot3(d2, d2), f = dot3(d2, r);
  let s = 0, t = 0;
  if (a > 1e-12 || e > 1e-12) {
    if (a <= 1e-12) t = clamp01(f / e);
    else {
      const c = dot3(d1, r);
      if (e <= 1e-12) s = clamp01(-c / a);
      else {
        const b = dot3(d1, d2), den = a * e - b * b;
        s = den > 1e-12 ? clamp01((b * f - c * e) / den) : 0;
        t = (b * s + f) / e;
        if (t < 0) { t = 0; s = clamp01(-c / a); } else if (t > 1) { t = 1; s = clamp01((b - c) / a); }
      }
    }
  }
  return len(sub(mad(p1, d1, s), mad(p2, d2, t)));
}
function pointTri(p, a, b, c) {
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a), d1 = dot3(ab, ap), d2 = dot3(ac, ap);
  if (d1 <= 0 && d2 <= 0) return len(ap);
  const bp = sub(p, b), d3 = dot3(ab, bp), d4 = dot3(ac, bp);
  if (d3 >= 0 && d4 <= d3) return len(bp);
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return len(sub(p, mad(a, ab, d1 / (d1 - d3))));
  const cp = sub(p, c), d5 = dot3(ab, cp), d6 = dot3(ac, cp);
  if (d6 >= 0 && d5 <= d6) return len(cp);
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return len(sub(p, mad(a, ac, d2 / (d2 - d6))));
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) return len(sub(p, mad(b, sub(c, b), (d4 - d3) / (d4 - d3 + d5 - d6))));
  const k = 1 / (va + vb + vc);
  return len(sub(p, add(a, add(mul(ab, vb * k), mul(ac, vc * k)))));
}
// The course is walked once in strides of WALK metres of route and laid as chords of STEP metres of route, only in the strides a
// figure can reach; of those a chord is passed over only when it could not come nearer than the best so far. By route a point
// of a stride lies within half a stride of its nearer end and a point of a chord within a chord of its first end; a metre of
// route is a metre of space to within about one part in a hundred (the world's path reads a table of arc lengths), and the two tests allow
// twice those lengths, so nothing that could count is passed over and the measure is the same as against every chord of the
// whole course. A chord's sag against the curve is under a millimetre on this course (its tightest bend has a radius of about
// 9 m; a chord of this length sags 2 mm only on a bend tighter than 4 m).
// Returns fn(fig, far): the least distance from fig (two corners: a straight piece; three: a flat triangle) to the course, or far
// when it is not under far. (A triangle the course runs through reads as at most half a chord, not as nothing: under any far asked here.)
function courseAir(sight) {
  const STEP = 0.25, WALK = 4, n = Math.ceil(sight.len / WALK), ends = [], laid = [];
  for (let i = 0; i <= n; i++) ends.push(sight.at(Math.min(i * WALK, sight.len)));
  const chords = (i) => {
    if (!laid[i]) {
      const c = laid[i] = [], d1 = Math.min((i + 1) * WALK, sight.len);
      for (let d = i * WALK; d < d1 - 1e-9; d += STEP) c.push(sight.at(d), sight.at(Math.min(d + STEP, d1)));
    }
    return laid[i];
  };
  return (fig, far) => {
    const m = fig.length, c = [0, 0, 0];
    for (const q of fig) { c[0] += q[0] / m; c[1] += q[1] / m; c[2] += q[2] / m; }
    let R = 0, best = far;
    for (const q of fig) R = Math.max(R, len(sub(q, c)));
    const sq = (e) => { const x = e[0] - c[0], y = e[1] - c[1], z = e[2] - c[2]; return x * x + y * y + z * z; };
    let d0 = sq(ends[0]);
    for (let i = 0; i < n; i++) {
      // a stride is passed over only when none of its points can be nearer the figure than the best so far (every point of the
      // figure lies within R of c), and so is a chord (see above for WALK and 2 * STEP)
      const d1 = sq(ends[i + 1]), reach = R + best + WALK, off = Math.min(d0, d1) > reach * reach;
      d0 = d1;
      if (off) continue;
      const ch = chords(i);
      for (let j = 0; j < ch.length; j += 2) {
        const a = ch[j], b = ch[j + 1], lim = R + best + 2 * STEP;
        if (sq(a) > lim * lim) continue;
        if (m === 2) best = Math.min(best, segSeg(a, b, fig[0], fig[1]));
        else best = Math.min(best, segSeg(a, b, fig[0], fig[1]), segSeg(a, b, fig[1], fig[2]), segSeg(a, b, fig[2], fig[0]), pointTri(a, fig[0], fig[1], fig[2]), pointTri(b, fig[0], fig[1], fig[2]));
      }
    }
    return best;
  };
}

// ---- the life on the hill: chimneys with rising lozenge smoke, washing over the stair street, cypresses,
//      upright planes of sky wedged between houses, and the 14 massing planes that stand in from afar ----
function buildExtras(S, B, rng, toneL, town, stairs, detail, lineY, sight) {
  const I = S.INK, { list, slots } = town;
  // chimneys + smoke
  const nCh = Math.min(40, list.length);
  // (repair 2) 'forty chimneys with lozenge smoke': still forty, drawn as before, but six of them stand on roofs of the
  // stair street's own rows (9 to 17 m from its centre line, beside the flight and never under it), so smoke rises
  // beside us on the climb
  const rowH = list.filter((h) => { const sd = streetDist(h.c[0], h.c[2]); return sd > 9 && sd < 17 && h.c[2] > 70 && h.c[2] < 176 && (!sight || sight.over(h.c).dist > 7.5); }).sort((a, b) => b.c[2] - a.c[2]);
  for (let i = 0; i < nCh; i++) {
    let h = list[Math.floor(rng() * list.length)];
    if (i % 7 === 3 && rowH.length >= 6) h = rowH[Math.floor(((i - 3) / 7 + 0.5) * rowH.length / 6)];
    if (h.moved) { let q = list.indexOf(h); while (list[q].moved) q = (q + 1) % list.length; h = list[q]; }      // (repair 3) a chimney stands on a roof that is there: the next house along
    const p = mad(h.top, h.t, rng.range(-1.5, 1.5));
    B.facet(mad(mad(p, h.t, -0.6), UP, -0.6), mul(h.t, 1.2), [0, 2.6, 0], { ink: rng() < 0.5 ? I.umber : I.bone, tone: toneL(h.o) });
    B.facet(mad(mad(p, h.t, 0.6), UP, -0.6), mul(h.o, -1.0), [0, 2.6, 0], { ink: I.umber, tone: toneL(h.t) });
    const ns = Math.round(5 * detail), ph = rng();
    for (let k = 0; k < ns; k++) {
      const c = mad(p, UP, 2.4), a = [1.1, 0.55, 0], b = [-1.1, 0.55, 0];
      B.facet(mad(c, UP, -0.55), a, b, { ink: k % 3 === 2 ? I.bone : I.pearl, tone: 1, kind: S.RISE, hinge: { p: c, a: UP, max: rng.range(12, 18), phase: ph + k / ns } });
    }
  }
  // washing: ribbon lines across the street, each sheet two triangles folding on the diagonal in a light west air.
  // A line the eye flies under keeps its outer sheets overhead; every sheet that would hang across the sight line
  // from the climb to the ring is hung on a second, low line over the steps instead, so the washing frames the
  // tower and never covers it. (Same draws as before; a sheet with no room is nil, and so is one that would not keep its clear air, below.)
  // THE WASHING KEEPS CLEAR AIR BY ITS PLACE. Every string and every cloth, as it is about to be hung, is measured as a
  // whole against our WHOLE course (sight.at): a stroke of string at its full drawn length (the stroke's pose draws it past
  // each end by 0.08 of its length) with half its laid width and its hand's miss round it (from afar the style draws a stroke
  // broader than laid, but only square to the line from the lens to it, so no nearer the lens); a cloth through its whole
  // swing (the hinge's full turn either way with the sway's on top, turned as in the turning tempers and shifted as in the
  // sliding one), so that no bearing, no moment of the clock and no temper can bring it nearer (while the fold is not over 1,
  // as the world keeps it, and the hill stands where the world's sight.at takes it to stand). One that would not keep AIR
  // between its skin and our line is not hung: a nil stroke or the nil planes, which take the same draws, so nothing laid
  // after it moves; a raised pair of cloths hangs with its piece of string or not at all; a sheet of a long line and that
  // line's strokes are each judged for itself. No lens, no seed and no place of a picture is asked. (Without a course from
  // the world nothing is measured and everything hangs as dealt.)
  const AIR = 2.0;          // metres of clear air between a thing's skin and our line: the site's one figure for a body beside the lens
  const SAG = 0.002;        // metres: more than a chord of the course can sag against its curve (see courseAir)
  const TURN = 0.1;         // radians at most from one measured pose of a swing to the next
  const air = sight && sight.at ? courseAir(sight) : null;
  const lineAir = (a, b, half, miss) => {       // a stroke from a to b, half its laid width, its laid miss (the pose shifts it by 0.45 of that)
    if (!air) return true;
    const u = sub(b, a), need = AIR + half + 0.45 * miss + SAG;
    return air([mad(a, u, -0.08), mad(a, u, 1.08)], need) >= need;
  };
  const turn = (v, k, an) => { const c = Math.cos(an), s = Math.sin(an); return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot3(k, v) * (1 - c))); };
  const clothAir = (O, U, V, hg, sway) => {     // a triangle of cloth laid as B.facet(O, U, V, { taper: 0, hinge: hg, sway })
    if (!air) return true;
    const P = [O, add(O, U), add(mad(O, U, 0.5), V)];
    const A = hg ? Math.abs(hg.max) + Math.abs(sway || 0) : 0;
    if (A === 0) return air(P, AIR + SAG) >= AIR + SAG;
    const k = hg.a, c = mad(mad(O, U, 0.5), V, 0.5), sl = mul(cross(k, sub(c, hg.p)), 0.55);      // (0.55: the slider's share of a swing, as in the pose)
    let arm = len(sl); for (const q of P) arm = Math.max(arm, len(cross(k, sub(q, hg.p))));
    if (air(P, AIR + SAG + arm * A) >= AIR + SAG + arm * A) return true;        // it cannot swing in to our line at all
    const need = AIR + SAG + arm * TURN / 2, ns = Math.ceil(2 * A / TURN);
    for (let i = 0; i <= ns; i++) {
      const an = -A + 2 * A * i / ns;
      if (air(P.map((q) => add(hg.p, turn(sub(q, hg.p), k, an))), need) < need) return false;
      if (air(P.map((q) => mad(q, sl, an)), need) < need) return false;
    }
    return true;
  };
  const nl = 15, NIL = [0, 0, 0];
  for (let l = 0; l < nl; l++) {
    const i = Math.min(stairs.length - 2, 3 + Math.floor((l + rng() * 0.6) * (stairs.length - 8) / nl));
    const p = stairs[i], q = stairs[i + 1], dir = nrm([q[0] - p[0], 0, q[2] - p[2]]), side = [dir[2], 0, -dir[0]];
    const yr = rng.range(11.5, 14), jA = rng.range(-0.8, 0.8), jB = rng.range(-0.8, 0.8);
    const ov = sight ? sight.over(p) : null;
    const hiY = !sight ? (lineY ? lineY(p, yr) : p[1] + yr) : null;      // (polish 2: no line is hung over the eye; at the frame's top its sheets were loose shards and its string a rule across the sky)
    let loY = Math.min(p[1] + 7.0 + (yr - 11.5) * 0.6, ov && ov.dist < 14 ? ov.y - 4.4 : 1e9);
    // (repair 2) 'sixty sheets of washing on ribbon lines over the stair street': where the eye flies close over the steps
    // and a low line has no room under it, the line is hung at the eaves all the same, but only its sheets that stand
    // clear of the sight cone to the ring (the ones beside the flight), each on its own short stroke of line (never one
    // thread across the frame). The same draws as before: a nil sheet becomes a pair of cloths on its piece of string (and is nil again if that would not keep its clear air).
    const upY = sight ? p[1] + 7.2 + (yr - 11.5) * 0.6 : null;
    const at = (f, y) => [p[0] + side[0] * 22 * (f - 0.5), y, p[2] + side[2] * 22 * (f - 0.5)];
    const sh = [];
    for (let k = 0; k < 6; k++) {
      const f = 0.1 + 0.16 * k + rng.range(-0.03, 0.03), w = rng.range(2.6, 3.4), h = rng.range(3.0, 4.2);
      const ink = rng.pick([I.bone, I.bone, I.pearl, I.slate, I.sage, I.bone, I.sage, I.pearl]), ph = rng() * 6.283;
      const high = hiY != null && (!sight || (sight.clear(at(f, hiY - h * 0.5), 2.6) && sight.clear(at(f, hiY - h), 1.6)));
      if (!high && sight) loY = Math.min(loY, sight.ceil(at(f, 0), 2.2) - 0.3);
      const up = !high && upY != null && p[1] <= 40 && sight.clear(at(f, upY - h * 0.5), 2.6) && sight.clear(at(f, upY - h), 1.6);
      sh.push({ f, w, h, ink, ph, high, up, k });
    }
    const lowOk = loY - p[1] > 3.2, gone = p[1] > 40;       // (gone: this line's strings are nil strokes, its low sheets nil planes)
    let first = true;
    // (repair 2) 'A line is a short straight black stroke': a washing line is laid as strokes of 3 to 4 m, each begun a
    // hand above or below where the last one stopped (it was one thread up to 21 m long). The first piece is laid as the
    // whole line was (the same draws); the further pieces draw nothing.
    const still = { p, a: UP, max: 0, phase: 0, bias: 0 };
    const ends = (f0, f1, y, j) => [at(f0, y + jA + (jB - jA) * f0 + (j % 2 ? 0.14 : -0.1)), at(f1, y + jA + (jB - jA) * f1 + (j % 2 ? 0.08 : -0.04))];
    const pieceAir = (e) => lineAir(e[0], e[1], 0.045, 0.0708);       // (half of the piece's width 0.09; the length of its off, below)
    const piece = (f0, f1, y, j, e = ends(f0, f1, y, j)) => B.stroke(e[0], pieceAir(e) ? e[1] : e[0],
      { off: [0.04, j % 2 ? -0.05 : 0.05, 0.03], width: 0.09, lod: 0.5, grad: 1, dab: 1, hinge: still });
    const string = (f0, f1, y) => {
      const np = gone ? 1 : Math.max(1, Math.round((f1 - f0) * 22 / 3.6)), df = (f1 - f0) / np;
      const A = at(f0, y + jA + (jB - jA) * f0), Bp = gone ? A : at(f0 + df * 0.94, y + jA + (jB - jA) * (f0 + df * 0.94)), o = { miss: 0.06, width: 0.09, lod: 0.5 };
      const Bq = gone || lineAir(A, Bp, 0.045, 0.06) ? Bp : A;      // (half of its width; its miss)
      if (first) { first = false; B.stroke(A, Bq, o); } else S.aside(() => B.stroke(A, Bq, o));
      for (let j = 1; j < np; j++) piece(f0 + df * (j + 0.05), f0 + df * (j + 0.96), y, j);
    };
    const hs = sh.filter((x) => x.high), ls = lowOk ? sh.filter((x) => !x.high) : [];
    if (hs.length === 6) string(0, 1, hiY);
    else {
      const L = hs.filter((x) => x.f < 0.5), R = hs.filter((x) => x.f >= 0.5);
      if (L.length) string(0, L[L.length - 1].f + 0.09, hiY);
      if (R.length) string(R[0].f - 0.09, 1, hiY);
    }
    if (ls.length) string(ls.length > 3 ? 0.02 : ls[0].f - 0.12, ls.length > 3 ? 0.98 : ls[ls.length - 1].f + 0.12, loY);
    if (first) B.stroke(p, p, { miss: 0.15, width: 0.1, lod: 0.5 });
    for (const x of sh) {
      const Y = x.high ? hiY : loY, h = gone ? 0 : x.high ? x.h : Math.min(x.h, loY - p[1] - 0.7); if (gone) x.w = 0;
      const up = x.up && !ls.length && !gone;
      const nil = () => { B.facet(p, NIL, NIL, { ink: x.ink, taper: 0, tone: 1 }); B.facet(p, NIL, NIL, { ink: x.ink, taper: 0, tone: 0.8, sway: 0.55, hinge: { p, a: UP, max: 0.5, phase: x.ph, bias: 0 } }); };
      if (!x.high && !ls.length && !up) { nil(); continue; }
      if (up) {
        // beside the flight the washing is small things on a short line: two cloths to a stroke, not one sheet across a front
        const e = ends(x.f - 0.085, x.f + 0.085, upY, x.k);
        const w2 = x.w * 0.5, h2 = x.h * 0.6, f2 = x.f + 0.043, ink2 = [I.pearl, I.bone, I.slate, I.bone, I.sage, I.pearl][(x.k + l) % 6];
        const TL = mad(at(x.f - 0.043, upY + jA + (jB - jA) * x.f), side, -w2 / 2), TR = mad(TL, side, w2), BL = mad(TL, UP, -h2), BR = mad(TR, UP, -h2);
        const h3 = h2 * 0.8, TL2 = mad(at(f2, upY + jA + (jB - jA) * f2), side, -w2 / 2), TR2 = mad(TL2, side, w2 * 0.9), BL2 = mad(TL2, UP, -h3), BR2 = mad(TR2, UP, -h3);
        const hg = { p: TR, a: nrm(sub(BL, TR)), max: 0.5, phase: x.ph, bias: 0 }, hg2 = { p: TR2, a: nrm(sub(BL2, TR2)), max: 0.5, phase: x.ph + 1.3, bias: 0 };
        const F = [[TL, sub(TR, TL), sub(BL, mad(TL, sub(TR, TL), 0.5))], [TR, sub(BR, TR), sub(BL, mad(TR, sub(BR, TR), 0.5))],
          [TL2, sub(TR2, TL2), sub(BL2, mad(TL2, sub(TR2, TL2), 0.5))], [TR2, sub(BR2, TR2), sub(BL2, mad(TR2, sub(BR2, TR2), 0.5))]];
        // (clear air) the pair hangs with its piece of string or not at all
        if (!(pieceAir(e) && clothAir(...F[0], null, 0) && clothAir(...F[1], hg, 0.55) && clothAir(...F[2], null, 0) && clothAir(...F[3], hg2, 0.55))) { nil(); continue; }
        piece(x.f - 0.085, x.f + 0.085, upY, x.k, e);
        B.facet(...F[0], { ink: x.ink, taper: 0, tone: 1 });
        B.facet(...F[1], { ink: x.ink, taper: 0, tone: 0.8, sway: 0.55, hinge: hg });
        B.facet(...F[2], { ink: ink2, taper: 0, tone: 1, grad: x.ph, dab: 1, hinge: still });
        B.facet(...F[3], { ink: ink2, taper: 0, tone: 0.8, sway: 0.55, grad: x.ph + 2, dab: 2, hinge: hg2 });
        continue;
      }
      const TL = mad(at(x.f, Y + jA + (jB - jA) * x.f), side, -x.w / 2), TR = mad(TL, side, x.w), BL = mad(TL, UP, -h), BR = mad(TR, UP, -h);
      const hg = { p: TR, a: nrm(sub(BL, TR)), max: 0.5, phase: x.ph, bias: 0 };
      const F0 = [TL, sub(TR, TL), sub(BL, mad(TL, sub(TR, TL), 0.5))], F1 = [TR, sub(BR, TR), sub(BL, mad(TR, sub(BR, TR), 0.5))];
      if (!gone && !(clothAir(...F0, null, 0) && clothAir(...F1, hg, 0.55))) { nil(); continue; }      // (clear air) a sheet hangs whole or not at all
      B.facet(...F0, { ink: x.ink, taper: 0, tone: 1 });
      B.facet(...F1, { ink: x.ink, taper: 0, tone: 0.8, sway: 0.55, hinge: hg });
    }
  }
  // sky planes between the houses, and cypresses (two crossed diamonds)
  let nSky = 0, nCy = 0;
  for (const s of slots) {
    const x = Math.sin(s.a) * s.r, z = Math.cos(s.a) * s.r, base = [x, s.y, z];
    if (nSky < 30 && Math.abs(x) > 28 && rng() < 0.6) {
      const yaw = rng() * 3.1416, dir = [Math.cos(yaw), 0, Math.sin(yaw)], w = rng.range(7, 15); let h = rng.range(20, 40) * (0.55 + 0.45 * s.r / R0);
      const O = mad(base, dir, -w / 2);
      if (sight) { const top = sight.ceil(base, w * 0.5 + 3) - s.y; if (top < h) h = top > 9 ? top : 0; }      // never across the sight line to the ring
      B.facet(O, mul(dir, w), [rng.range(-3, 3), h, rng.range(-3, 3)], { ink: rng.pick([I.pearl, I.pearl, I.bone, I.bone]), tone: 1, quiet: 0.62, taper: rng.range(0.55, 1),
        hinge: { p: O, a: UP, max: 0.6, phase: rng() * 6.283, bias: 0 } });
      nSky++;
    } else if (nCy < 40) {
      const h = Math.min(rng.range(8, 13), sight ? Math.max(3, sight.ceil(base, 2) - s.y) : 99), w = rng.range(2.2, 3.2), yaw = rng() * 3.1416;
      for (const e of [0, 1]) {
        const d = [Math.cos(yaw + e * 1.5708), 0, Math.sin(yaw + e * 1.5708)];
        B.facet(base, mad(mul(d, w / 2), UP, h * 0.42), mad(mul(d, -w / 2), UP, h * 0.58), { ink: I.sage, tone: e ? 0.8 : 0.6, hinge: { p: base, a: UP, max: e ? 0.9 : -0.9, phase: yaw, bias: 0 } });
      }
      B.stroke(base, mad(base, UP, h * 0.3), { width: 0.2, miss: 0.2, lod: 0.5 });
      nCy++;
    }
  }
  // massing: from far off the town is a PILE of big plain planes, not a cone: three stepped rings of upright planes
  // (seven, six, five) that will not agree on which way they face, some with a lid tipped up to be seen, and two
  // standing behind the tower's shoulders. Inside uMass range they turn edge-on like louvres and are gone.
  // The ones that face the entry (bearing 0.3 rad in this frame) have their inks set by hand: bone against slate,
  // three lids in terracotta.
  const T = I.terracotta, a0 = 0.3;
  const levels = [
    { n: 7, r: 190, y0: -2, H: 58, wf: 0.86, half: 0, inks: [I.bone, I.slate, I.umber, I.pearl, I.bone, I.slate, I.pearl], inks2: [I.slate, I.bone, I.pearl, I.slate, I.umber, I.bone, I.slate], lids: { 0: I.umber, 1: T, 4: T, 6: T } },
    { n: 6, r: 102, y0: 40, H: 44, wf: 0.88, half: 0.5, inks: [I.slate, I.pearl, I.bone, I.slate, I.umber, I.bone], lids: { 0: T, 3: T, 5: I.slate } },
    { n: 5, r: 42, y0: 70, H: 40, wf: 0.95, half: 0, inks: [I.bone, I.pearl, I.slate, I.bone, I.slate], lids: { 0: I.umber, 2: T, 4: T } },
  ];
  const massPlane = (O, U, V, ink, taper, n, sg) => B.facet(O, U, V, { ink, taper, tone: toneL(n), kind: S.MASS,
    hinge: { p: mad(mad(O, U, 0.5), V, 0.5), a: nrm(V), max: 1.45 * sg, phase: rng() * 6.283 } });
  for (const L of levels) {
    for (let i = 0; i < L.n; i++) {
      const a = a0 + ((i + L.half) / L.n) * 6.2832, sg = i % 2 ? 1 : -1, yaw = a + sg * 0.27;
      const o = [Math.sin(a), 0, Math.cos(a)], f = [Math.sin(yaw), 0, Math.cos(yaw)], t = [Math.cos(yaw), 0, -Math.sin(yaw)];
      const W = 2 * L.r * Math.tan(Math.PI / L.n) * L.wf, H = L.H * (i % 3 === 1 ? 1.12 : i % 3 === 2 ? 0.9 : 1), tp = i % 2 ? 0.8 : 1;
      const O = mad(mad(mul(o, L.r), UP, L.y0), t, -W / 2), V = mad([0, H, 0], f, -H * 0.1);
      // the lowest ring is cut in two: a tall half and a lower one standing 9 m nearer in the other ink
      const wT = L.inks2 ? 0.52 : 1, tpT = L.inks2 ? 1 : tp;
      massPlane(O, mul(t, W * wT), V, L.inks[i], tpT, f, sg);
      if (L.inks2) massPlane(mad(mad(O, t, W * 0.5), f, 9), mul(t, W * 0.5), mul(V, i % 2 ? 0.62 : 0.8), L.inks2[i], i % 2 ? 0.85 : 1, f, -sg);
      const lid = L.lids[i];
      if (lid != null) {                                // the lid: tipped steeply back from the top edge, so it shows from below
        const O2 = mad(add(O, V), t, W * wT * ((1 - tpT) / 2 + tpT * 0.08)), V2 = mad([0, H * 0.42, 0], f, -H * 0.5);
        massPlane(O2, mul(t, W * wT * tpT * 0.84), V2, lid, 0.7, nrm(mad(mul(f, 0.64), UP, 0.77)), -sg);
      }
    }
  }
  for (const [x0, w, h, ink, sg] of [[-27, 16, 52, I.pearl, 1], [11, 15, 38, I.bone, -1]]) {
    massPlane([x0, HILL + 2, -3], [w, 0, 0], [0, h, 0], ink, 0.85, [0, 0, 1], sg);
  }
}

export async function buildHero(ctx, opts = {}) {
  const own = !opts.style;
  const S = opts.style || makeStyle(ctx, opts);
  const rng = ctx.rng, detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  // the hero stands turned half round in the world (front = south), so its lock tones use the light turned with it
  const toneL = (n) => S.tone([-n[0], n[1], -n[2]]);
  const object = new THREE.Group(); object.name = 'town-from-all-sides';
  const B = S.batch(32768), arcs = [];
  await ctx.yield();
  const stairs = await buildHill(ctx, S, B, rng, toneL, arcs);
  await ctx.yield();
  const town = await buildHouses(ctx, S, B, rng, toneL, arcs, detail, opts.blocked, opts.sight, opts.moved | 0);
  await ctx.yield();
  const tower = buildTower(S, B, rng, toneL);
  await ctx.yield();
  buildExtras(S, B, rng, toneL, town, stairs, detail, opts.lineY, opts.sight);
  await ctx.yield();
  const mesh = B.mesh(); mesh.name = 'town-facets';
  const ring = buildRing(S); ring.name = 'the-ring';
  object.add(mesh, ring);
  await ctx.yield();

  // standalone (no shared style): the lock axis is the hero's own front axis, 275 to 310 m and more out from its centre
  const inv = new THREE.Matrix4(), le = new THREE.Vector3();
  if (own) S.foldFn = (e) => {
    le.copy(e).applyMatrix4(inv.copy(object.matrixWorld).invert());
    const w = 1 - sstep(-50, -15, 260 - le.z);
    return 1 - w * (1 - sstep(2, 26, Math.abs(le.x)));
  };
  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const anchors = {
    portalSeat: { position: V3(RING_C), normal: V3(RING_N), up: V3(RING_UP), radius: RING_R, tilt: TILT },
    flyThrough: [[0, -5, 240], [-26, 20, 145], [-14, 62, 95], [0, 92, 69], RING_C].map(V3),
    stairStreet: stairs.map(V3),
    viewpoints: { entry: V3([215, 26, 700]), lock: V3([0, -8, 327]), street: V3([-24, 26, 136]), crownPass: V3([-6, 80, 80]) },
    towerTop: V3(tower.top), crown: V3([0, HILL, 0]), bell: V3(tower.bell),
  };
  return {
    object, radius: 172, height: 167, center: new THREE.Vector3(0, 78, 0), anchors, style: S, houses: town.list, moved: town.moved,
    stats: { instances: B.count, facets: B.facets, strokes: B.strokes, triangles: B.count * 2 + 96 * 8, houses: town.list.length, drawCalls: 2 },
    setFold(F) { S.forceFold = F; },
    update(dt, time, camera) { if (own) S.update(dt, time, camera); },
    dispose() { if (own) S.dispose(); },
    ground: false, groundY: 0,
  };
}
