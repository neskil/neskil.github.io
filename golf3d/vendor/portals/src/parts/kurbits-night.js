// THE KURBITS: hero set piece of "kurbits-night" (The Night the Kurbits Grew), and the routine the whole world is painted with.
//
// WHAT IT IS  A two-handled urn (22 m) on a green of C-strokes; from it a stem of stacked blue-into-chalk S-strokes
// climbs to y 385; eight tiers (y 40..350, each turned 45 degrees from the one below, each an exact mirror about the
// stem) throw two arms, two 40 m scroll leaves and two blossoms of 50-70 strokes, every tier a different invented
// flower (gourd, rose, bell, wheel, tulip, peacock; seeded order and choices); a neck carries the crown, a ring of 24
// red-into-chalk teardrops 30 m across round a 15 m opening, tilted to the last straight. About 2,250 strokes, every
// one a separate bent strip. Nothing is lit; every pixel is a pot colour or the ground coat (write under post.flat = 1).
//
// HOW THE STYLE IS MADE (use these exports for everything else in the world)
//   POTS, POT, KIND         ground coat + six pots (brief order), pot indices, the five strokes (TEAR, C, S, LINER, DOT)
//   makeStyle(palette)      ONE per world: shared uniforms (uPots, uClock paint clock, uTime, uPx, uRankStep, uBreeze, uRetouch, uGround, uFree, uTurn)
//                           + update(dt, time, camera, renderer) + setClock(t). Pass it to buildHero as opts.style.
//   strokeMaterial(style)   the one unlit ShaderMaterial (STROKE_VERT / STROKE_FRAG, also as STYLE_GLSL): bends each
//                           strip along th(s) = c1 s + c2 s^3 + c3 sin(2 pi s), fat head / tapered tail per kind, 0.15 m dome,
//                           coats 0.25 m apart toward the viewer (parallax), double load combed by bristle noise, dry
//                           streaky tail by discard (no blending), wet for 2 s after landing (a shade deeper, chalk ridge
//                           line), painted on by uClock (start, run-out), dropped beyond rank * uRankStep metres (20 m ease),
//                           liners held at 1.5 px, optional yaw-to-camera about a pivot (iPiv.w = max yaw in radians; sheets with
//                           0.35 <= max yaw turn freely while the style's uFree uniform is 1). The blossoms of tiers 1 to 7 are
//                           drawn about their own upright axes (sheet records with turn: x): at uTurn 0 they lie in their tier's
//                           plane and nod with the bough; as the world opens uTurn to 1 they turn right round to face the viewer.
//   makeStrokeBook()        add({pos,tan,nrm,len,wid,c1,c2,c3,kind,coat,rank,a,b,seed,split,t0,dur,anim,dry,piv,face,strip})
//                           then bake(style) -> Group of <= 7 instanced meshes (strips: tear 56, dot 32, stroke 96, scroll 176, pip 20, round 80, coil 112 tris)
//   sheet(book, origin, xAxis, yAxis, base)   2D drawing surface: put({x,y,ang,...,lift,mirror,mirrorLag}); a = main pot,
//                           b = second pot, split sign = which side of the brush the main pot rides on
//   strokePoint(rec, s)     where a stroke's centre line is (to hang leaflets, dots, birds on it)
//   boardMaterial(style, {mode, plank, far})  the planed pine under the ground coat: mode 0 lake/floor (world xz),
//                           1 wall round the viewer (seam every `plank` degrees), 2 lid; seams, butt joints, knots, grain
//   SCHEDULE, TIER_Y, TIER_REACH, journeyPace(u), journeyClock(u), FLOWER_NAMES
//
// opts  palette (7 hex, brief order) | style (a makeStyle() to share) | detail 0.6..1 (thins the green only) |
//       cast 'gourd'|'rose'|'bell'|... (flower of tiers 2 and 7) | stem 'blue'|'red' | schedule {tiers, crown, lead, journey} |
//       green false (leave the green to the world) | greenRadius | backdrop true|false (bare boards for the part viewer; off in a world)
//
// RETURNS  { object, radius 64, height 428, center, anchors, update, dispose, ground:false } plus
//   setProgress(u)   paint clock from path u through the brief's pace (journeyClock); setClock(t) sets journey seconds
//                    directly (negative = before entry; tier 1 gets its last liner and dots at 0..1.6 s). If neither is
//                    ever called the clock loops by itself (part viewer). setBreeze(0..1) sets every leaf curling.
//   style, tiers, flowers, schedule, clearance(p) (metres from a hero-space point to the nearest painted sheet)
// anchors (hero space; place the hero UNROTATED at the urn, course +Z: the entry sees its -Z side)
//   portalSeat  { position (0,410,0), facing (toward the arriving camera), exitDir (0.5,0.866,0), up, radius 7 }
//   lastStraight [from, to]: the final 70 m, heading +X and 60 degrees up, through the ring centre
//   flyThrough  ordered points: lake side, past the urn to its east, left-handed 1.45 turns round the stem at
//               blossom reach + 12..16 m (y 20 -> 335), turn-in from the west, the last straight, 24 m beyond; >= 9.5 m clear
//   tiers[i]    { y, angle, normal, blossoms [2 centres], radius, reach, flower, petals [t0,t1], done }
//   viewpoints, stemTop, urn, green, newestBlossom(clock) (for the poi)
// COST  about 148k triangles, 4 draw calls (7 with the viewer's boards), one program, no textures, no lights; build ~60 ms.
// PART VIEWER ONLY  called with no opts the piece lays its own bare boards (backdrop); opts kr, kh, kx, ky, kz reframe
//           the orbit and kc lays the crown's axis level. A world passes backdrop: false and none of these.
// EXPECTS  post.flat = 1, bloom 0, no fog; boards under and behind it; hero.update() every frame with the live camera.
import * as THREE from 'three';

// ---------------------------------------------------------------- pots
// The ground coat and the six pots, in the brief's order. A stroke names its two pots by index.
export const POTS = ['#A9B9BD', '#96301F', '#D49A33', '#F1EBDB', '#1D1A18', '#1F3F68', '#4F7A3C'];
export const POT = { GROUND: 0, RED: 1, OCHRE: 2, CHALK: 3, SOOT: 4, BLUE: 5, GREEN: 6 };
export const KIND = { TEAR: 0, C: 1, S: 2, LINER: 3, DOT: 4 };
export const COAT_GAP = 0.25, DOME = 0.15;

// ---------------------------------------------------------------- stroke shader
// One instance = one brush stroke: a strip (position.x = s along 0..1, position.y = v across -1..1)
// bent along its own curve. Heading along the stroke: th(s) = c1*s + c2*s^3 + c3*sin(2 pi s)
// (c1 alone = C-stroke, c3 = S-stroke, c2 = a scroll that tightens toward its tail).
export const STROKE_VERT = /* glsl */`
attribute vec3 iPos;     // head of the stroke (object space; relative to iPiv.xyz when iPiv.w > 0)
attribute vec4 iPiv;     // xyz pivot; w > 0: how far (radians) the sheet may yaw to face the camera; 0: fixed sheet; -1 / -2: fixed sheet nodding about the pivot (and its mirror);
                         // w > 15: a blossom, drawn in its sheet's own frame (x, y, normal +z): w - 20 is its tier's facing, and it turns right round to the viewer as uTurn opens
                         // 8 < w < 15: a free-turning sheet of a MEDIUM that is flown through (the pollen rows): its dots thin by size at the lens (see "a medium" below)
attribute vec3 iTan;     // direction the stroke sets off in
attribute vec3 iNrm;     // normal of the sheet it is painted on
attribute vec4 iShape;   // length, full width, c1, c2
attribute vec4 iShape2;  // c3, kind (0 tear 1 C 2 S 3 liner 4 dot), coat (0 ground 1 loaded 2 liner), rank
attribute vec4 iPots;    // pot A (v=-1 side), pot B (v=+1 side), seed 0..1, load split -1..1
attribute vec4 iTime;    // start (paint clock), run-out duration, curl animation amount, dryness 0..1
uniform vec3 uPots[7];
uniform float uClock, uTime, uPx, uRankStep, uBreeze, uRetouch, uFree, uTurn;
varying vec2 vUv;
varying float vRe;       // seconds since the painter's second coat reached this stroke (-1 = none)
varying vec3 vA, vB;
varying vec4 vInfo;      // seed, kind, wetness, dryness
varying vec3 vDim;       // bristles across, load split, how near a fat stroke is (0..1: finer bristles resolve)
const float TAU = 6.2831853;
float kHead(float s, float h) { float t = clamp(s / h, 0., 1.); return sqrt(max(t * (2. - t), 0.)); }
float kWidth(float kind, float s, float cap, float wid) {
  float w;
  if (kind < 0.5) w = kHead(s, cap) * pow(max(1. - max(s - cap * 0.6, 0.) / (1. - cap * 0.6), 0.), 1.2);                         // teardrop
  else if (kind < 1.5) w = pow(abs(sin(3.14159 * pow(max(s, 0.), 0.72))), 0.8);                   // C: thin, fat, thin
  else if (kind < 2.5) w = kHead(s, cap * 0.7) * (0.3 + 0.7 * (1. - s)) * sqrt(clamp((1. - s) / 0.1, 0., 1.)); // S: fat head, long tail
  else if (kind < 3.5) {                                                                           // liner: the hand wavers; a broad brush pulled straight (a wall, a ground band) keeps its width
    float wav = 0.2 * (1. - smoothstep(1., 2.4, wid));
    w = sqrt(clamp(s / 0.03, 0., 1.)) * sqrt(clamp((1. - s) / 0.2, 0., 1.)) * (1. - wav + wav * sin(s * 11.));
  }
  else w = sqrt(max(1. - (2. * s - 1.) * (2. * s - 1.), 0.));                                     // dot
  return w;
}
void main() {
  float len = iShape.x, wid = iShape.y, kind = iShape2.y, seed = iPots.z;
  float age = uClock - iTime.x;
  float dur = max(iTime.y, 0.01);
  float p = clamp(age / dur, 0., 1.);
  p = 1. - (1. - p) * (1. - p);                              // lands fast, runs out slower
  float done = step(1., p);
  float s = position.x * p, v = position.y;
  // the curve
  float breathe = sin(uTime * (0.55 + 0.5 * seed) + seed * 40.) * (0.6 + 0.4 * uBreeze);
  float c1 = iShape.z * (1. + 0.06 * iTime.z * breathe), c2 = iShape.w * (1. + 0.22 * iTime.z * breathe), c3 = iShape2.x;
  float sway = 0.07 * iTime.z * breathe;
  // (a mirror image that must re-fan as the exact mirror of its twin carries the amount negated: its sway then turns the other way, and its curl breathes as the twin's does)
  if (iTime.z < 0.) { c1 = iShape.z * (1. - 0.06 * iTime.z * breathe); c2 = iShape.w * (1. - 0.22 * iTime.z * breathe); }
  vec2 acc = vec2(0.);
  for (int i = 0; i < 10; i++) {
    float t = (float(i) + 0.5) * 0.1 * s;
    float th = (c1 + sway) * t + c2 * t * t * t + c3 * sin(TAU * t);
    acc += vec2(cos(th), sin(th));
  }
  vec2 c = acc * (0.1 * s * len);
  float th = (c1 + sway) * s + c2 * s * s * s + c3 * sin(TAU * s);
  vec2 n2 = vec2(-sin(th), cos(th));
  // the hand: a slow wobble off the true curve, more for liner work
  float wob = (sin(s * 9. + seed * 31.) + 0.5 * sin(s * 23. + seed * 17.)) * len * (kind > 2.5 && kind < 3.5 ? 0.007 : 0.0025);
  // width: the stroke's own profile, a rounded wet front while it is still running
  float hw = 0.5 * wid * kWidth(kind, s, clamp(0.5 * wid / max(len, 0.01), 0.06, 0.45), wid);
  float front = sqrt(clamp((p - s) / 0.07 + done, 0., 1.));
  hw *= mix(front * (1. + 0.35 * exp(-(p - s) * (p - s) * 180.)), 1., done);
  // frame: a fixed sheet, or a sheet that yaws about its pivot to keep its front to the camera
  vec3 T = iTan, N = iNrm, org;
  float side;
  if (iPiv.w > 0.) {
    vec3 pw = (modelMatrix * vec4(iPiv.xyz, 1.)).xyz;
    vec2 d = cameraPosition.xz - pw.xz;
    vec2 mz = modelMatrix[2].xz;
    float yaw0 = atan(mz.x, mz.y + 1e-6);
    float near = step(dot(d, d), 1e-6);
    float yaw = mix(atan(d.x, d.y + near), yaw0, near);
    // a blossom (iPiv.w > 15) rests in its tier's own plane and nods with its bough; on the climb (uTurn 1) it turns
    // right round on its own upright axis to keep its whole face to the rider, as every house and horse here does
    float bl = step(15., iPiv.w), rest = bl * (iPiv.w - 20.);
    float dy = mod(yaw - yaw0 - rest + 3.14159265, TAU) - 3.14159265;
    // on the climb (uFree 1, set by the world while the village is out of sight) a house, horse or tree turns right round to show us its front: the village is a flat picture below
    float lim = mix(iPiv.w + 3.2 * uFree * step(0.35, iPiv.w), 3.2 * uTurn, bl);
    yaw = yaw0 + rest + clamp(dy, -lim, lim);
    float cy = cos(yaw), sy = sin(yaw);
    mat3 R = mat3(cy, 0., -sy, 0., 1., 0., sy, 0., cy);
    vec3 lp = iPos, cen = vec3(0.);
    if (bl > 0.5) {
      float y1 = yaw0 + rest, c0 = cos(y1), s0 = sin(y1), cx = iPiv.x * cos(rest) - iPiv.z * sin(rest);   // cx: how far along the bough the blossom sits (its mirror: negative)
      float wave = sin(uTime * 0.8 - iPiv.y * 0.045) + 0.4 * sin(uTime * 1.9 - iPiv.y * 0.11 + 1.3);
      float ang = (cx < 0. ? -1. : 1.) * (0.016 + 0.05 * uBreeze) * wave;
      float ca = cos(ang), sa = sin(ang);
      lp = vec3(iPos.x * ca - iPos.y * sa, iPos.x * sa + iPos.y * ca, iPos.z);
      T = vec3(T.x * ca - T.y * sa, T.x * sa + T.y * ca, T.z);
      N = vec3(N.x * ca - N.y * sa, N.x * sa + N.y * ca, N.z);
      cen = mat3(c0, 0., -s0, 0., 1., 0., s0, 0., c0) * vec3(-cx * (1. - ca), cx * sa, 0.);              // where the nodding bough has carried the blossom's centre
    }
    T = R * T; N = R * N; org = pw + cen + R * lp;
    vec3 tb = cameraPosition - org;
    side = mix(1., clamp(dot(N, tb) / max(length(tb), 1e-3) * 8., -1., 1.), bl);
  } else {
    mat3 M = mat3(modelMatrix);
    vec3 lp = iPos;
    if (iPiv.w < -0.5) {                                       // a bough: the stroke nods about its pivot, in its own sheet
      float wave = sin(uTime * 0.8 - iPiv.y * 0.045) + 0.4 * sin(uTime * 1.9 - iPiv.y * 0.11 + 1.3);
      float ang = (iPiv.w < -1.5 ? -1. : 1.) * (0.016 + 0.05 * uBreeze) * wave;
      float ca = cos(ang), sa = sin(ang);
      vec3 r = iPos - iPiv.xyz;
      lp = iPiv.xyz + r * ca + cross(N, r) * sa + N * dot(N, r) * (1. - ca);
      T = T * ca + cross(N, T) * sa;
    }
    T = normalize(M * T); N = normalize(M * N);
    org = (modelMatrix * vec4(lp, 1.)).xyz;
    vec3 tc = cameraPosition - org;
    side = clamp(dot(N, tc) / max(length(tc), 1e-3) * 8., -1., 1.);
  }
  vec3 B = cross(N, T);
  float dist = distance(cameraPosition, org);
  // distance is fewer strokes: beyond rank * step the stroke closes up to nothing over 20 m
  float keep = 1. - smoothstep(iShape2.w * uRankStep, iShape2.w * uRankStep + 20., dist);
  keep *= step(0., age);
  // liner work never thins below a pixel and a half (soot liner: two and a half, a brush's liner)
  if (kind > 2.5 && kind < 3.5) hw = max(hw, (abs(iPots.x - 4.) < 0.5 ? 1.25 : 0.75) * dist / max(uPx, 1.) * step(0.02, hw));
  vec2 q = c + n2 * (v * hw + wob);
  float lift = (seed * 0.08 + iShape2.z * ${COAT_GAP.toFixed(2)} + ${DOME.toFixed(2)} * (1. - v * v) * clamp(wid * 0.5, 0., 1.)) * side;
  vec3 world = org + keep * (T * q.x + B * q.y) + N * lift;
  // a medium (8 < iPiv.w < 15) takes the kit's near law for particles, by size and not by transparency (the paint is flat and opaque): by the true
  // distance from the lens to the dot's own drawn centre, the dot closes about that centre from 2.5 m and nothing of it is left at 0.8 m
  // (0.8 and not the kit's 0.6: at the frame's corner 0.6 m of true distance lies nearer than the near plane, which then cut a last speck of a dot)
  if (iPiv.w > 8. && iPiv.w < 15.) {
    vec3 cen = org + keep * T * (0.5 * len) + N * ((seed * 0.08 + iShape2.z * ${COAT_GAP.toFixed(2)} + ${DOME.toFixed(2)} * clamp(wid * 0.5, 0., 1.)) * side);
    float thin = smoothstep(0.8, 2.5, distance(cameraPosition, cen));
    if (thin < 1.) world = cen + thin * (world - cen);
  }
  vUv = vec2(s, v);
  vA = uPots[int(clamp(iPots.x, 0., 6.) + 0.5)]; vB = uPots[int(clamp(iPots.y, 0., 6.) + 0.5)];
  float wet = clamp(1. - (age - dur) * 0.5, 0., 1.) * step(0., age);
  vInfo = vec4(seed, kind, wet, iTime.w);
  float nbr = clamp(wid * 4., 5., 14.);
  // a fat stroke passed near: each bristle of the broad brush is then a hand wide, and finer ones resolve inside it
  vDim = vec3(nbr, iPots.w, smoothstep(0.2, 0.45, wid / nbr) * (1. - smoothstep(18., 45., dist)));
  vRe = (uRetouch > 0.5 && age > dur + 4.) ? mod(uTime - iTime.x, max(uRetouch, 1.)) : -1.;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.);
}`;

export const STROKE_FRAG = /* glsl */`
uniform vec3 uChalk;
varying vec2 vUv;
varying float vRe;
varying vec3 vA, vB;
varying vec4 vInfo;
varying vec3 vDim;
float kH(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float kN(float x) { float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(kH(i), kH(i + 1.), f); }
void main() {
  float s = vUv.x, v = vUv.y, seed = vInfo.x, kind = vInfo.y, wet = vInfo.z;
  float fv = max(fwidth(v), 1e-4);
  float nb = vDim.x;
  // bristle streaks finer than about three pixels give way to their flat average
  float streak = smoothstep(1.5, 3.5, (2. / nb) / fv);
  float bx = v * nb * 0.5 + seed * 57. + 0.4 * kN(s * 3. + seed * 9.);
  float b = kN(bx) * 0.65 + kN(bx * 2.7 + 3.) * 0.35;
  // seen near, a fat stroke shows the brush's finer hairs inside each broad streak (they give way under three pixels)
  float fine = vDim.z * smoothstep(1.5, 3.5, (2. / (nb * 3.3)) / fv);
  float bf = kN(bx * 3.3 + 17.) * 0.6 + kN(bx * 7.9 + s * 4. + 5.) * 0.4;
  b = mix(b, 0.5 * b + 0.5 * bf, fine);
  // double load: pot A on one side of the brush, pot B on the other, meeting along an uneven,
  // bristle-combed edge (each pixel is one pot or the other, never a mixture, while streaks resolve)
  float m = v - vDim.y - 0.25 * (kN(s * 4. + seed * 23.) - 0.5);
  float soft = smoothstep(-0.2, 0.2, m);
  float b2 = kN(bx * 1.9 + 11.) * 0.6 + kN(bx * 4.3 + s * 2.) * 0.4;
  float drag = smoothstep(0.66, 0.74, b2) * 0.75 * smoothstep(0.02, 0.2, s);    // a few bristles drag the other pot right across
  float hard = smoothstep(-fv, fv, m + (b - 0.5) * 0.6 + drag * vInfo.w);
  vec3 col = mix(vA, vB, mix(soft, hard, streak));
  // dry tail: the brush runs out of paint and breaks into streaks of bare board
  float b3 = kN(bx * 2.3 + 29.) * 0.55 + kN(bx * 5.1 + s * 3.) * 0.45;
  b3 = mix(b3, 0.4 * b3 + 0.6 * bf, fine);
  float dry = vInfo.w * streak * (0.97 * smoothstep(0.24 + 0.2 * fine, 0.97, s) + 0.3 * (1. - fine) * smoothstep(0.04, 0.25, s));   // (near: the fat head stays whole, the tail breaks into fine hairs)
  if (b3 < dry) discard;
  // wet for two seconds: a shade deeper, one thin broken chalk line along the ridge; the painter comes round
  // again in the same order with a second coat, so a wet glint keeps travelling through the finished work
  float tw = vRe - s * 0.45;
  wet = max(wet, step(0., tw) * (1. - smoothstep(1.5, 2.3, tw)) * step(0., vRe));
  col *= 1. - 0.15 * smoothstep(0., 0.3, wet);
  float rl = abs(v - 0.3 - 0.07 * sin(s * 5. + seed * 13.));
  float lw = max(0.05, 1.2 * fv);
  float ridge = (1. - smoothstep(lw * 0.6, lw, rl)) * step(0.3, wet) * step(kN(s * 9. + seed * 5.), 0.7)
    * step(kind, 2.5) * smoothstep(0.03, 0.12, s) * (1. - smoothstep(0.65, 0.9, s));
  col = mix(col, uChalk, ridge);
  gl_FragColor = vec4(col, 1.);
}`;
// both halves together, for a world coder who wants to read the whole routine in one place
export const STYLE_GLSL = { strokeVert: STROKE_VERT, strokeFrag: STROKE_FRAG };

// ---------------------------------------------------------------- the shared style
// makeStyle(palette) -> { uniforms, pots, update(dt, time, camera, renderer), setClock(t) }.
// One style object per world; every stroke and board material made from it shares its uniforms.
export function makeStyle(palette = POTS, o = {}) {
  const pal = POTS.map((h, i) => new THREE.Color((palette && palette[i]) || h));
  const uniforms = {
    uPots: { value: pal },
    uChalk: { value: pal[POT.CHALK] },
    uClock: { value: 0 },                       // the paint clock (journey seconds): strokes with start <= clock exist
    uTime: { value: 0 },                        // wall time, for curling leaves and other idle motion only
    uPx: { value: 900 },                        // pixels per radian, for the 1.5 px liner floor
    uRankStep: { value: o.rankStep ?? 150 },    // a stroke of rank r is dropped beyond r * rankStep metres
    uBreeze: { value: o.breeze ?? 0 },
    uRetouch: { value: o.retouch ?? 0 },       // seconds between the painter's rounds with a second coat (0 = never, the default: a dry stroke stays dry)
    uGround: { value: pal[POT.GROUND] },
    uTurn: { value: 0 },                        // 0..1: the blossoms (iPiv.w > 15) turn on their own upright axes to face the viewer (the world opens it on the climb)
    uFree: { value: 0 },                        // 0..1: sheets with a yaw limit of 0.35 or more turn freely (the world opens it on the climb)
  };
  const size = new THREE.Vector2();
  return {
    uniforms, pots: pal,
    setClock(t) { uniforms.uClock.value = t; },
    update(dt, time, camera, renderer) {
      uniforms.uTime.value = time;
      if (renderer && camera && camera.projectionMatrix) {
        renderer.getDrawingBufferSize(size);
        uniforms.uPx.value = 0.5 * size.y * camera.projectionMatrix.elements[5];
      }
    },
  };
}
export function strokeMaterial(style) {
  return new THREE.ShaderMaterial({
    uniforms: style.uniforms, vertexShader: STROKE_VERT, fragmentShader: STROKE_FRAG,
    side: THREE.DoubleSide, transparent: false, depthWrite: true, depthTest: true, fog: false, toneMapped: false,
  });
}

// ---------------------------------------------------------------- stroke books
// A book collects stroke records and bakes them into at most four instanced meshes (one per strip).
const STRIPS = { tear: [14, 1.6], dot: [8, 0], stroke: [24, 1.3], scroll: [44, 1], pip: [5, 0], round: [20, 0], coil: [28, 0.75] };   // [segments, spacing power; 0 = even round a circle]; pip: a ten-sided round for dots under 1.6 m; round: forty-sided, for the great dots; coil: a liner that coils (segments crowd toward the tail, where it tightens)
function stripGeometry(segs, pw) {
  const pos = new Float32Array((segs + 1) * 3 * 3), idx = [];
  for (let j = 0; j <= segs; j++) {
    const s = pw ? Math.pow(j / segs, pw) : 0.5 - 0.5 * Math.cos(Math.PI * j / segs);
    for (let k = 0; k < 3; k++) { const o = (j * 3 + k) * 3; pos[o] = s; pos[o + 1] = k - 1; pos[o + 2] = 0; }
    if (j < segs) for (let k = 0; k < 2; k++) { const a = j * 3 + k, b = a + 3; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}
const ATTRS = [['iPos', 3], ['iPiv', 4], ['iTan', 3], ['iNrm', 3], ['iShape', 4], ['iShape2', 4], ['iPots', 4], ['iTime', 4]];
const STRIDE = 29;
export function makeStrokeBook() {
  const lists = { tear: [], dot: [], stroke: [], scroll: [], pip: [], round: [], coil: [] };
  let count = 0;
  const book = {
    get count() { return count; },
    // add({ pos:[x,y,z], tan:[..], nrm:[..], len, wid, c1, c2, c3, kind, coat, rank, a, b, seed, split, t0, dur, anim, dry, piv:[x,y,z], face })
    add(r) {
      const kind = r.kind ?? 0, turn = Math.abs(r.c1 || 0) + Math.abs(r.c2 || 0) + 2 * Math.abs(r.c3 || 0);
      const key = r.strip || (kind === 4 ? ((r.wid ?? r.len) >= 7 ? 'round' : (r.wid ?? r.len) < 1.6 ? 'pip' : 'dot') : turn > 4.2 ? (kind === 3 ? 'coil' : 'scroll') : (kind === 0 && turn < 1.6) || (kind === 3 && turn < 1.2) ? 'tear' : 'stroke');   // (a liner that hardly turns needs no more segments than a teardrop)
      const p = r.pos, t = r.tan || [0, 1, 0], n = r.nrm || [0, 0, 1], pv = r.piv || [0, 0, 0];
      lists[key].push(p[0], p[1], p[2], pv[0], pv[1], pv[2], r.face || 0, t[0], t[1], t[2], n[0], n[1], n[2],
        r.len, r.wid ?? r.len, r.c1 || 0, r.c2 || 0, r.c3 || 0, kind, r.coat ?? 1, r.rank ?? 99,
        r.a ?? 1, r.b ?? r.a ?? 1, r.seed ?? 0.5, r.split ?? 0, r.t0 ?? -1e3, r.dur ?? 0.33, r.anim || 0, r.dry ?? 0.8);
      count++;
    },
    // bake(style or material) -> THREE.Group of instanced meshes (frustum culling off: sheets yaw and curl in the shader)
    bake(styleOrMat) {
      const mat = styleOrMat.isMaterial ? styleOrMat : strokeMaterial(styleOrMat);
      const group = new THREE.Group(); let tris = 0;
      for (const key of Object.keys(lists)) {
        const L = lists[key]; const n = L.length / STRIDE; if (!n) continue;
        const [segs, pw] = STRIPS[key]; const base = stripGeometry(segs, pw);
        const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
        const data = new Float32Array(L); const ib = new THREE.InstancedInterleavedBuffer(data, STRIDE, 1);
        let off = 0; for (const [name, sz] of ATTRS) { g.setAttribute(name, new THREE.InterleavedBufferAttribute(ib, sz, off)); off += sz; }
        g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
        const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'kurbits-' + key;
        group.add(mesh); tris += n * segs * 4;
      }
      group.userData.triangles = tris; group.userData.strokes = count; group.userData.material = mat;
      return group;
    },
  };
  return book;
}

// ---------------------------------------------------------------- the boards
// The ground the strokes are painted on: planed pine under one flat coat. uMode 0 = boards laid flat (world xz,
// planks along z), 1 = a wall round the viewer (object-space direction; a seam every uPlank DEGREES of azimuth),
// 2 = a lid overhead (planks along +X). Seams, butt joints, knots and grain are fwidth-filtered lines and
// give way to the flat coat when finer than about three pixels.
export const BOARD_VERT = /* glsl */`
varying vec3 vObj; varying vec3 vWorld;
uniform float uFar;
void main() {
  vObj = position; vec4 w = modelMatrix * vec4(position, 1.); vWorld = w.xyz;
  vec4 p = projectionMatrix * viewMatrix * w;
  if (uFar > 0.5) { if (abs(p.w) < 1e-4) p.w = 1e-4; p = p.xyww; p.z = p.w * 0.99999; }
  gl_Position = p;
}`;
export const BOARD_FRAG = /* glsl */`
uniform vec3 uGround; uniform float uMode, uPlank, uKnots, uKnotSize;
varying vec3 vObj; varying vec3 vWorld;
float bH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 ab;
  if (uMode < 0.5) ab = vWorld.xz / uPlank;
  else if (uMode < 1.5) {
    float r = max(length(vObj.xz), 1e-3);
    ab = vec2(atan(vObj.x, vObj.z + 1e-5 * step(abs(vObj.x) + abs(vObj.z), 0.)) * 57.29578, vObj.y / r * 57.29578) / uPlank;
  } else ab = vec2(vObj.z, vObj.x) / max(abs(vObj.y), 1e-3) * 57.29578 / uPlank;
  vec2 fw = fwidth(ab); float fa = min(max(fw.x, 1e-5), 0.5), fb = max(fw.y, 1e-5);
  float id = floor(ab.x), f = ab.x - id;
  float fine = 1. - smoothstep(0.07, 0.28, fa);                      // planks under ~3 px: flat coat only
  // seams between planks, and a butt joint now and then along each plank
  float d = min(f, 1. - f), sw = max(0.014, 0.75 * fa);
  float seam = 1. - smoothstep(sw, sw + fa, d);
  float jb = ab.y / 26. + bH(vec2(id, 3.)); float jd = abs(fract(jb) - 0.5) * 26.;
  float jw = max(0.014, 0.75 * fb);
  seam = max(seam, (1. - smoothstep(jw, jw + fb, 13. - jd)) * step(0.5, bH(vec2(id, floor(jb)))));
  // knots: about one board in three, a warmer darker oval bleeding through, grain bending round it
  float cell = floor(ab.y / 9.), kh = bH(vec2(id, cell * 1.7 + 5.));
  float has = step(kh, 0.36 * uKnots) * step(bH(vec2(id, 9.)), 0.5);
  vec2 kc = vec2(0.5 + (bH(vec2(id, cell + 0.3)) - 0.5) * 0.4, (cell + 0.5 + (bH(vec2(cell, id)) - 0.5) * 0.6) * 9.);
  vec2 kr = vec2(0.13, 0.24) * (0.7 + 0.9 * bH(vec2(id + 2., cell))) * uKnotSize;
  vec2 kd = (vec2(f, ab.y) - kc) / kr; float k = length(kd);
  float knot = has * (1. - smoothstep(1. - 2. * fa / kr.x, 1., k));
  float halo = has * exp(-k * k * 0.12);
  float gx = f + halo * 0.16 * sign(kd.x) + 0.012 * sin(ab.y * 0.9 + id * 2.3);
  float gp = fract(gx * 9. + bH(vec2(id, 1.)) * 5.), gl = abs(gp - 0.5) * 2.;
  float gfw = min(fa * 9. * 2., 1.);
  float grain = (1. - smoothstep(0.1, 0.1 + gfw, gl)) * (1. - smoothstep(0.12, 0.3, fa * 9.)) * step(0.45, bH(vec2(id, floor(gx * 9.))));
  float ring = has * (1. - smoothstep(0.08, 0.2, abs(fract(k * 2.6) - 0.5))) * step(k, 1.);
  vec3 col = uGround;
  col = mix(col, uGround * vec3(0.93, 0.925, 0.92), grain * 0.9 * fine);
  col = mix(col, uGround * vec3(0.77, 0.67, 0.56), knot * fine);
  col = mix(col, uGround * vec3(0.56, 0.45, 0.35), knot * ring * fine);
  col = mix(col, uGround * vec3(0.6, 0.61, 0.62), seam * fine * 0.85);
  gl_FragColor = vec4(col, 1.);
}`;
// boardMaterial(style, { mode: 0|1|2, plank: metres (mode 0) or degrees (modes 1, 2), far: true = drawn at the far plane,
//   knots: how many (1 = about one board in three), knotSize: how large (1) })
export function boardMaterial(style, o = {}) {
  const mode = o.mode ?? 0;
  return new THREE.ShaderMaterial({
    uniforms: { uGround: style.uniforms.uGround, uMode: { value: mode }, uPlank: { value: o.plank ?? (mode === 0 ? 14 : 2) },
      uKnots: { value: o.knots ?? 1 }, uKnotSize: { value: o.knotSize ?? 1 }, uFar: { value: o.far ? 1 : 0 } },
    vertexShader: BOARD_VERT, fragmentShader: BOARD_FRAG, side: o.side ?? THREE.DoubleSide,
    depthWrite: !o.far, depthTest: true, fog: false, toneMapped: false,
  });
}

// ---------------------------------------------------------------- drawing on a sheet
// sheet(book, origin, xAxis, yAxis) gives a 2D drawing surface: angles are measured from xAxis toward yAxis,
// positive curl turns the same way. put(rec) takes x, y, ang (+ the book's fields); lift tilts the stroke out
// of the sheet (a bowl); mirror: true also lays the exact mirror image about the sheet's y axis.
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export function sheet(book, origin, xAxis, yAxis, base = {}) {
  const O = V3(...origin), X = V3(...xAxis).normalize(), Y = V3(...yAxis).normalize(), N = V3().crossVectors(X, Y).normalize();
  const t = V3(), n = V3(), p = V3();
  function one(r) {
    const ca = Math.cos(r.ang || 0), sa = Math.sin(r.ang || 0), lift = r.lift || 0, cl = Math.cos(lift), sl = Math.sin(lift);
    t.copy(X).multiplyScalar(ca).addScaledVector(Y, sa);
    n.copy(N).multiplyScalar(cl).addScaledVector(t, -sl);
    t.multiplyScalar(cl).addScaledVector(N, sl);
    if (r.turn) {                                               // a blossom's stroke: kept in the sheet's own frame, about the upright axis through x = turn (see iPiv in the shader)
      const cx = r.turn;
      p.copy(O).addScaledVector(X, cx);
      book.add({ ...base, ...r, pos: [(r.x || 0) - cx, r.y || 0, r.z || 0], tan: [ca * cl, sa * cl, sl], nrm: [-ca * sl, -sa * sl, cl], piv: [p.x, p.y, p.z], face: 20 + Math.atan2(N.x, N.z) });
      return;
    }
    p.copy(O).addScaledVector(X, r.x || 0).addScaledVector(Y, r.y || 0).addScaledVector(N, r.z || 0);
    book.add({ ...base, ...r, pos: [p.x, p.y, p.z], tan: [t.x, t.y, t.z], nrm: [n.x, n.y, n.z] });
  }
  return {
    O, X, Y, N,
    put(r) {
      // a = the main pot, b = the second; the sign of split says which side of the brush the main pot rides on,
      // its size how far past the middle it reaches (the main pot always covers about two thirds of the stroke)
      if ((r.b ?? r.a) !== r.a) { const sp = r.split || 0, mag = Math.min(Math.abs(sp) + 0.3, 0.8); r = sp < 0 ? { ...r, a: r.b, b: r.a, split: -mag } : { ...r, split: mag }; }
      one(r);
      if (!r.mirror) return;
      const m = { ...r, x: -(r.x || 0), ang: Math.PI - (r.ang || 0), c1: -(r.c1 || 0), c2: -(r.c2 || 0), c3: -(r.c3 || 0),
        a: r.b ?? r.a, b: r.a, split: -(r.split || 0), t0: (r.t0 ?? -1e3) + (r.mirrorLag || 0), seed: ((r.seed ?? 0.5) * 7.31 + 0.137) % 1 };
      if ((r.face ?? base.face) === -1) m.face = -2;            // a nodding bough's mirror nods the other way round
      if (r.turn) m.turn = -r.turn;
      one(m);
    },
  };
}
// where a stroke's centre line is at s (0..1), in its own sheet coordinates: [x, y, heading]
export function strokePoint(r, s, steps = 24) {
  let x = 0, y = 0; const c1 = r.c1 || 0, c2 = r.c2 || 0, c3 = r.c3 || 0, a0 = r.ang || 0;
  for (let i = 0; i < steps; i++) { const t = (i + 0.5) / steps * s, th = a0 + c1 * t + c2 * t * t * t + c3 * Math.sin(6.2831853 * t); x += Math.cos(th); y += Math.sin(th); }
  const k = s * r.len / steps;
  return [(r.x || 0) + x * k, (r.y || 0) + y * k, a0 + c1 * s + c2 * s * s * s + c3 * Math.sin(6.2831853 * s)];
}

// ---------------------------------------------------------------- flower primitives
// Records are collected per phase: g = ground coat shapes, p = petals (loaded strokes), l = liner work, d = dots.
const PI = Math.PI, TAU = PI * 2;
const { RED, OCHRE, CHALK, SOOT, BLUE, GREEN } = POT;
// a fan of strokes whose fat heads sit on a circle of radius r0 and whose tails run to the heart (or the reverse)
function fan(out, o) {
  const n = o.n, span = o.span ?? TAU, full = span > TAU - 0.01;
  for (let j = 0; j < n; j++) {
    const f = full ? j / n : (n === 1 ? 0.5 : j / (n - 1)), dl = (f - 0.5) * span + (o.phase || 0), phi = o.dir + dl;
    const sgn = Math.abs(dl) < 1e-3 ? 1 : Math.sign(dl), inward = o.inward !== false;
    const r0 = inward ? o.r0 : o.r0 - o.len, lean = (o.lean || 0) * sgn;
    out.push({
      x: o.cx + Math.cos(phi) * r0, y: o.cy + Math.sin(phi) * r0, ang: phi + (inward ? PI : 0) + lean,
      len: o.len * (1 + (o.jit || 0) * (o.rng() - 0.5)), wid: o.wid, kind: o.kind ?? KIND.TEAR,
      c1: (o.c1 || 0) * sgn, c3: (o.c3 || 0) * sgn, c2: (o.c2 || 0) * sgn,
      a: o.a, b: o.b ?? o.a, split: (o.split ?? 0) * sgn * (inward ? 1 : -1), coat: o.coat ?? 1, rank: o.rank ?? 6,
      z: (o.bowl || 0) * (inward ? o.len : 0), lift: (o.bowl || 0) * (inward ? -1 : 1), dry: o.dry ?? 0.8, anim: o.anim || 0,
      seed: o.rng(), dur: o.dur ?? 0.33, strip: o.strip,
    });
  }
}
// C-strokes laid head to tail round a circle (a rose ring)
function ring(out, o) {
  for (let j = 0; j < o.n; j++) {
    const phi = o.dir + (j / o.n) * TAU * (o.turn || 1) + (o.phase || 0), arc = o.arc;
    out.push({
      x: o.cx + Math.cos(phi) * o.r, y: o.cy + Math.sin(phi) * o.r, ang: phi + PI / 2 - (o.open || 0),
      len: o.r * arc * (1 + (o.open || 0) * 0.5), wid: o.wid, kind: o.kind ?? KIND.C, c1: arc + (o.open || 0) * 2,
      a: o.a, b: o.b ?? o.a, split: o.split ?? 0, coat: o.coat ?? 1, rank: o.rank ?? 6, dry: o.dry ?? 0.7,
      z: o.z || 0, seed: o.rng(), dur: o.dur ?? 0.33, strip: o.strip,
    });
  }
}
// a row of dots along an arc; the row runs out of paint, so the last dots are smaller
function dots(out, o) {
  const n = o.n, span = o.span ?? TAU, full = span > TAU - 0.01;
  for (let j = 0; j < n; j++) {
    const f = full ? j / n : (n === 1 ? 0.5 : j / (n - 1)), phi = o.dir + (f - 0.5) * span + (o.phase || 0);
    const fade = 1 - (o.fade ?? 0.35) * (j / Math.max(n - 1, 1)) ** 2;
    out.push({ x: o.cx + Math.cos(phi) * o.r, y: o.cy + Math.sin(phi) * o.r - o.size * fade * 0.5, ang: PI / 2, len: o.size * fade, wid: o.size * fade,
      kind: KIND.DOT, a: o.a, b: o.b ?? o.a, coat: o.coat ?? 2, rank: o.rank ?? 2.2, z: o.z || 0, seed: o.rng(), dur: 0.12, dry: 0 });
  }
}
const liner = (o) => ({ kind: KIND.LINER, coat: 2, rank: 3, wid: 0.42, a: SOOT, dry: 0.5, dur: 0.5, seed: 0.5, ...o });
// a liner tendril: springs out and coils (c2 tightens it); it keeps coiling and easing while idle
const tendril = (rng, o) => liner({ len: 14, c1: 1.2 * (o.sgn || 1), c2: 6.5 * (o.sgn || 1), anim: 1, wid: 0.38, rank: 3.5, seed: rng(), dur: 0.7, ...o });

// ---------------------------------------------------------------- the invented flowers
// Each takes (F = { g, p, l, d }, cx, cy, R, dir, rng, v) with v a few seeded choices, and lays about fifty strokes.
const FLOWERS = {
  // gourd blossom: a fan of fat teardrops over blue backing petals, green sepals, an ochre heart
  gourd(F, cx, cy, R, dir, rng, v) {
    const n = v.n || 9, span = 3.75, w = R * span / n * 0.92, pa = v.warm ? OCHRE : RED;
    fan(F.g, { cx, cy, dir, n: n + 1, span: span + span / n, r0: R * 1.0, len: R * 0.5, wid: w * 0.7, a: BLUE, b: CHALK, split: 0.15, coat: 0, rng, bowl: 0.12, rank: 5 });
    fan(F.p, { cx, cy, dir, n, span, r0: R * 0.86, len: R * 0.66, wid: w, a: pa, b: CHALK, split: 0.1, rng, bowl: 0.22, jit: 0.06, rank: 9, anim: 0.5 });
    fan(F.p, { cx, cy, dir: dir + PI, n: 2, span: 1.5, r0: R * 0.62, len: R * 0.6, wid: R * 0.2, a: GREEN, b: CHALK, split: 0.2, c1: -0.9, kind: KIND.C, inward: false, rng, rank: 7 });
    F.p.push({ x: cx, y: cy - R * 0.2, ang: PI / 2, len: R * 0.4, wid: R * 0.4, kind: KIND.DOT, a: OCHRE, b: v.warm ? RED : OCHRE, coat: 1, rank: 8, z: 0.4, seed: rng(), dur: 0.3, dry: 0 });
    ring(F.p, { cx, cy, dir, n: 5, r: R * 0.25, arc: 1.0, wid: R * 0.09, a: CHALK, b: pa, z: 0.5, rng, strip: 'tear', rank: 4 });
    fan(F.l, { cx, cy, dir, n, span, r0: R * 0.8, len: R * 0.5, wid: 0.42, kind: KIND.LINER, a: SOOT, c1: 0.5, lean: 0.12, rng, bowl: 0.22, coat: 2, rank: 3, dur: 0.4 });
    fan(F.l, { cx, cy, dir, n: 3, span: 1.3, r0: R * 0.98, len: R * 0.34, wid: 0.36, kind: KIND.LINER, a: CHALK, c1: 1.6, c2: 3.5, inward: false, rng, coat: 2, rank: 3, anim: 1 });
    dots(F.d, { cx, cy, dir, n: n, span, r: R * 0.95, size: R * 0.062, a: CHALK, rng, z: R * 0.2 });
    dots(F.d, { cx, cy, dir, n: 6, r: R * 0.1, size: R * 0.045, a: SOOT, rng, z: 0.8, fade: 0 });
  },
  // rose: three rings of C-strokes round an ochre heart
  rose(F, cx, cy, R, dir, rng, v) {
    const pa = v.warm ? RED : BLUE, pb = v.warm ? BLUE : RED;
    ring(F.g, { cx, cy, dir, n: 8, r: R * 0.9, arc: 0.74, wid: R * 0.2, a: GREEN, b: CHALK, split: -0.2, coat: 0, rng, open: -0.25, rank: 5, strip: 'tear', kind: KIND.TEAR });
    ring(F.p, { cx, cy, dir, n: 8, r: R * 0.76, arc: 0.74, wid: R * 0.3, a: pa, b: CHALK, split: -0.1, rng, phase: 0.2, rank: 9, open: 0.42 });
    ring(F.p, { cx, cy, dir, n: 6, r: R * 0.52, arc: 0.95, wid: R * 0.27, a: pb, b: CHALK, split: -0.1, rng, phase: 0.5, z: 0.5, rank: 9, open: 0.48 });
    ring(F.p, { cx, cy, dir, n: 4, r: R * 0.29, arc: 1.3, wid: R * 0.22, a: OCHRE, b: CHALK, split: -0.1, rng, z: 1.0, rank: 7, open: 0.5 });
    F.p.push({ x: cx, y: cy - R * 0.1, ang: PI / 2, len: R * 0.2, wid: R * 0.2, kind: KIND.DOT, a: OCHRE, b: CHALK, coat: 1, rank: 6, z: 1.4, seed: rng(), dur: 0.3, dry: 0 });
    ring(F.l, { cx, cy, dir, n: 8, r: R * 0.69, arc: 0.62, wid: 0.42, kind: KIND.LINER, a: SOOT, rng, phase: 0.28, coat: 2, rank: 3, z: 0.6, dur: 0.4, open: 0.42 });
    ring(F.l, { cx, cy, dir, n: 6, r: R * 0.46, arc: 0.8, wid: 0.36, kind: KIND.LINER, a: SOOT, rng, phase: 0.6, coat: 2, rank: 3, z: 1.1, dur: 0.4, open: 0.48 });
    fan(F.l, { cx, cy, dir, n: 4, span: 2.6, r0: R * 0.98, len: R * 0.36, wid: 0.36, kind: KIND.LINER, a: SOOT, c1: 1.5, c2: 4, inward: false, rng, coat: 2, rank: 3, anim: 1 });
    dots(F.d, { cx, cy, dir, n: 18, r: R * 1.02, size: R * 0.055, a: CHALK, rng, fade: 0.5 });
    dots(F.d, { cx, cy, dir, n: 5, r: R * 0.06, size: R * 0.04, a: SOOT, rng, z: 1.8, fade: 0 });
  },
  // bellflower: long S-strokes flaring from a green calyx, a lip of C-strokes, stamens on liner stalks
  bell(F, cx, cy, R, dir, rng, v) {
    const n = v.n2 || 7, bx = cx - Math.cos(dir) * R * 0.78, by = cy - Math.sin(dir) * R * 0.78, pa = v.warm ? OCHRE : RED;
    fan(F.g, { cx: bx, cy: by, dir, n: n - 1, span: 1.5, r0: R * 1.56, len: R * 1.45, wid: R * 0.34, a: BLUE, b: CHALK, split: 0.2, coat: 0, rng, rank: 5, kind: KIND.S, c3: -0.1, c1: -0.3, lean: 0.2 });
    fan(F.p, { cx: bx, cy: by, dir, n, span: 1.75, r0: R * 1.78, len: R * 1.7, wid: R * 0.46, a: pa, b: CHALK, split: 0.15, kind: KIND.S, c3: -0.16, c1: -0.45, lean: 0.3, rng, jit: 0.05, rank: 9, bowl: 0.1 });
    fan(F.p, { cx: bx, cy: by, dir: dir + PI, n: 3, span: 4.3, r0: R * 0.5, len: R * 0.48, wid: R * 0.2, a: GREEN, b: CHALK, split: 0.2, inward: false, rng, rank: 7 });
    fan(F.p, { cx: bx, cy: by, dir, n: n - 1, span: 1.5, r0: R * 1.86, len: R * 0.3, wid: R * 0.16, a: OCHRE, b: CHALK, rng, rank: 5, z: 0.5 });
    fan(F.l, { cx: bx, cy: by, dir, n: 3, span: 0.5, r0: R * 2.05, len: R * 1.5, wid: 0.4, kind: KIND.LINER, a: SOOT, c1: 0.25, inward: false, rng, coat: 2, rank: 3, dur: 0.5 });
    fan(F.l, { cx: bx, cy: by, dir, n, span: 1.75, r0: R * 1.5, len: R * 1.1, wid: 0.36, kind: KIND.LINER, a: CHALK, c1: 0.35, lean: -0.06, inward: false, rng, coat: 2, rank: 3, dur: 0.4 });
    dots(F.d, { cx: bx, cy: by, dir, n: 3, span: 0.5, r: R * 2.1, size: R * 0.09, a: OCHRE, b: RED, rng, fade: 0 });
    dots(F.d, { cx: bx, cy: by, dir, n: n + 3, span: 2.0, r: R * 1.97, size: R * 0.05, a: CHALK, rng, phase: 0 });
    dots(F.d, { cx: bx, cy: by, dir, n: 4, span: 1.0, r: R * 0.42, size: R * 0.045, a: CHALK, rng, fade: 0 });
  },
};
Object.assign(FLOWERS, {
  // wheel: a full round of chalk petals over blue ones, a red heart ringed with dots
  wheel(F, cx, cy, R, dir, rng, v) {
    const n = v.n3 || 13, w = R * TAU / n * 0.5, pa = v.warm ? OCHRE : CHALK, pb = v.warm ? CHALK : OCHRE;
    fan(F.g, { cx, cy, dir, n, r0: R * 1.0, len: R * 0.62, wid: w * 0.9, a: BLUE, b: CHALK, split: 0.3, coat: 0, rng, phase: PI / n, rank: 5, bowl: 0.1 });
    fan(F.p, { cx, cy, dir, n, r0: R * 0.9, len: R * 0.64, wid: w * 1.25, a: pa, b: pb, split: 0.1, rng, bowl: 0.2, rank: 9, jit: 0.05, anim: 0.5 });
    F.p.push({ x: cx, y: cy - R * 0.24, ang: PI / 2, len: R * 0.48, wid: R * 0.48, kind: KIND.DOT, a: RED, b: OCHRE, coat: 1, rank: 9, z: 0.5, seed: rng(), dur: 0.3, dry: 0 });
    ring(F.p, { cx, cy, dir, n: 6, r: R * 0.3, arc: 0.85, wid: R * 0.1, a: OCHRE, b: CHALK, z: 0.8, rng, strip: 'tear', rank: 4 });
    fan(F.l, { cx, cy, dir, n, r0: R * 0.82, len: R * 0.42, wid: 0.4, kind: KIND.LINER, a: SOOT, c1: 0.3, rng, bowl: 0.2, coat: 2, rank: 3, dur: 0.35 });
    ring(F.l, { cx, cy, dir, n: 3, r: R * 0.17, arc: 1.7, wid: 0.4, kind: KIND.LINER, a: SOOT, rng, coat: 2, rank: 3, z: 1.0 });
    dots(F.d, { cx, cy, dir, n, r: R * 1.04, size: R * 0.06, a: CHALK, rng, phase: PI / n, fade: 0.45 });
    dots(F.d, { cx, cy, dir, n: 8, r: R * 0.12, size: R * 0.05, a: CHALK, rng, z: 1.2, fade: 0 });
  },
  // tulip: three great teardrops in ochre and red, blue wrapping strokes, a crown of small ones, seeds in a row
  tulip(F, cx, cy, R, dir, rng, v) {
    const bx = cx - Math.cos(dir) * R * 0.85, by = cy - Math.sin(dir) * R * 0.85, pa = v.warm ? RED : OCHRE, pb = v.warm ? OCHRE : RED;
    fan(F.g, { cx: bx, cy: by, dir, n: 4, span: 2.3, r0: R * 1.5, len: R * 1.4, wid: R * 0.34, a: BLUE, b: CHALK, split: 0.2, coat: 0, rng, rank: 5, c1: -0.5, kind: KIND.C, inward: false });
    fan(F.p, { cx: bx, cy: by, dir, n: 2, span: 1.1, r0: R * 1.62, len: R * 1.5, wid: R * 0.62, a: pa, b: CHALK, split: 0.15, c1: 0.42, rng, rank: 9, bowl: 0.12 });
    fan(F.p, { cx: bx, cy: by, dir, n: 1, r0: R * 1.86, len: R * 1.75, wid: R * 0.72, a: pb, b: pa, split: 0, rng, rank: 9, z: 0.6 });
    fan(F.p, { cx: bx, cy: by, dir: dir + PI, n: 2, span: 2.4, r0: R * 0.6, len: R * 0.56, wid: R * 0.22, a: GREEN, b: CHALK, split: 0.2, c1: 0.8, inward: false, rng, rank: 7 });
    fan(F.p, { cx: bx, cy: by, dir, n: 5, span: 1.5, r0: R * 2.08, len: R * 0.36, wid: R * 0.15, a: CHALK, b: BLUE, split: 0.2, rng, rank: 5 });
    fan(F.l, { cx: bx, cy: by, dir, n: 2, span: 1.1, r0: R * 1.5, len: R * 1.2, wid: 0.42, kind: KIND.LINER, a: SOOT, c1: 0.5, lean: 0.1, rng, coat: 2, rank: 3, dur: 0.45 });
    fan(F.l, { cx: bx, cy: by, dir, n: 2, span: 0.34, r0: R * 1.7, len: R * 1.3, wid: 0.36, kind: KIND.LINER, a: CHALK, c1: -0.2, rng, coat: 2, rank: 3, z: 0.7, dur: 0.45 });
    fan(F.l, { cx: bx, cy: by, dir, n: 2, span: 2.2, r0: R * 1.7, len: R * 0.4, wid: 0.36, kind: KIND.LINER, a: SOOT, c1: 1.6, c2: 4, inward: false, rng, coat: 2, rank: 3, anim: 1 });
    for (let i = 0; i < 6; i++) F.d.push({ x: bx + Math.cos(dir) * R * (0.5 + i * 0.2), y: by + Math.sin(dir) * R * (0.5 + i * 0.2) - R * 0.035, ang: PI / 2,
      len: R * 0.07 * (1 - i * 0.07), wid: R * 0.07 * (1 - i * 0.07), kind: KIND.DOT, a: SOOT, coat: 2, rank: 2.2, z: 1.0, seed: rng(), dur: 0.12, dry: 0 });
    dots(F.d, { cx: bx, cy: by, dir, n: 5, span: 1.5, r: R * 2.14, size: R * 0.055, a: CHALK, rng });
  },
  // peacock: a wide fan of thin blue feathers, each ending in an ochre eye, over a red inner fan
  peacock(F, cx, cy, R, dir, rng, v) {
    const n = v.n4 || 11, span = 4.2, bx = cx - Math.cos(dir) * R * 0.3, by = cy - Math.sin(dir) * R * 0.3, pa = v.warm ? GREEN : BLUE;
    fan(F.p, { cx: bx, cy: by, dir, n, span, r0: R * 1.2, len: R * 1.08, wid: R * 0.25, a: pa, b: CHALK, split: 0.2, kind: KIND.S, c3: 0.07, anim: 0.6, inward: false, rng, rank: 9, bowl: 0.16, jit: 0.04 });
    fan(F.p, { cx: bx, cy: by, dir, n: n - 4, span: span * 0.62, r0: R * 0.66, len: R * 0.5, wid: R * 0.24, a: RED, b: CHALK, split: 0.1, rng, rank: 8, z: 0.5, bowl: 0.1 });
    fan(F.p, { cx: bx, cy: by, dir: dir + PI, n: 2, span: 1.3, r0: R * 0.55, len: R * 0.5, wid: R * 0.2, a: GREEN, b: CHALK, split: 0.2, c1: -0.8, kind: KIND.C, inward: false, rng, rank: 7 });
    dots(F.p, { cx: bx, cy: by, dir, n, span, r: R * 1.2, size: R * 0.2, a: OCHRE, b: RED, rng, fade: 0, coat: 1, rank: 7, z: R * 0.18 });
    dots(F.p, { cx: bx, cy: by, dir, n: 1, r: 0, size: R * 0.26, a: OCHRE, rng, coat: 1, rank: 7, z: 0.9 });
    fan(F.l, { cx: bx, cy: by, dir, n, span, r0: R * 1.06, len: R * 0.7, wid: 0.38, kind: KIND.LINER, a: SOOT, inward: false, rng, coat: 2, rank: 3, bowl: 0.16, dur: 0.4 });
    fan(F.l, { cx: bx, cy: by, dir, n: n - 4, span: span * 0.62, r0: R * 0.6, len: R * 0.36, wid: 0.36, kind: KIND.LINER, a: SOOT, c1: 0.5, lean: 0.1, rng, coat: 2, rank: 3, z: 0.6 });
    dots(F.d, { cx: bx, cy: by, dir, n, span, r: R * 1.2, size: R * 0.075, a: SOOT, rng, fade: 0, z: R * 0.2 + 0.3 });
    dots(F.d, { cx: bx, cy: by, dir, n: n - 1, span: span - span / (n - 1), r: R * 1.33, size: R * 0.05, a: CHALK, rng, z: R * 0.2 });
  },
});
export const FLOWER_NAMES = Object.keys(FLOWERS);

const FLOWER_FIT = { tulip: 0.8, bell: 0.84, peacock: 0.92 };      // these spread beyond R: draw them smaller so every blossom fills the same round

// a scroll leaf: one long loaded spine that coils at its tip, teardrop leaflets down its outer edge, a liner vein
function scrollLeaf(F, x, y, ang, L, sgn, rng, o = {}) {
  const spine = { x, y, ang, len: L, wid: L * 0.13, kind: KIND.S, c1: -0.5 * sgn, c2: -(4.3 + rng() * 1.1) * sgn, a: GREEN, b: CHALK,
    split: 0.15 * sgn, coat: 1, rank: 12, anim: 0.5, seed: rng(), dur: 0.8, dry: 0.75, strip: 'scroll' };
  F.s.push(spine);
  const n = o.leaflets ?? 6;
  for (let i = 0; i < n; i++) {
    const s = 0.07 + 0.5 * (i / (n - 1)), q = strokePoint(spine, s), k = 1 - 0.5 * i / (n - 1);
    F.s.push({ x: q[0], y: q[1], ang: q[2] + (0.75 + 0.1 * i) * sgn, len: L * 0.25 * k, wid: L * 0.085 * k, kind: KIND.TEAR, c1: -0.7 * sgn,
      a: GREEN, b: i % 2 ? OCHRE : CHALK, split: 0.25 * sgn, coat: 0, rank: 7, seed: rng(), dur: 0.33, strip: 'tear' });
    if (i % 2 === 0 && i < n - 1) F.s.push({ x: q[0], y: q[1], ang: q[2] - (0.8 + 0.1 * i) * sgn, len: L * 0.13 * k, wid: L * 0.05 * k, kind: KIND.TEAR, c1: 0.6 * sgn,
      a: GREEN, b: CHALK, split: -0.25 * sgn, coat: 0, rank: 5, seed: rng(), dur: 0.3, strip: 'tear' });
  }
  F.l.push(liner({ x, y, ang: ang - 0.05 * sgn, len: L * 0.6, c1: -0.5 * 0.6 * sgn, c2: spine.c2 * 0.216, a: SOOT, wid: 0.45, z: 0.1, seed: rng(), dur: 0.7, rank: 3.5 }));
  const tip = strokePoint(spine, 0.4);
  F.l.push(tendril(rng, { x: tip[0], y: tip[1], ang: tip[2] - 1.2 * sgn, sgn: -sgn, len: L * 0.3, a: CHALK }));
  for (let i = 0; i < 5; i++) { const q = strokePoint(spine, 0.12 + i * 0.09); const sz = 1.25 * (1 - i * 0.12);
    F.d.push({ x: q[0], y: q[1] - sz * 0.5, ang: PI / 2, len: sz, wid: sz, kind: KIND.DOT, a: CHALK, coat: 2, rank: 2.2, z: 0.2, seed: rng(), dur: 0.12, dry: 0 }); }
}
// the flower routines and their primitives, for the world's own shoots, buds and leaves (the same hand)
export const PAINT = { FLOWERS, fan, ring, dots, liner, tendril, scrollLeaf };
// a circular-arc stroke from p0 to p1 that turns by c on the way
function arcBetween(x0, y0, x1, y1, c) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy), g = Math.atan2(dy, dx), h = c / 2;
  return { x: x0, y: y0, ang: g - h, len: Math.abs(h) < 1e-3 ? d : d * h / Math.sin(h), c1: c };
}

// ---------------------------------------------------------------- the painter's timetable (journey seconds)
export const TIER_Y = [40, 80, 125, 170, 215, 260, 305, 350];
export const TIER_REACH = [58, 58, 56, 53, 50, 46, 42, 38];      // how far each tier's blossoms reach from the stem
// per tier: [petals start, petals end, liner and dots end (, blossoms start, if later than the tier's own start)]; the crown: [first petal, last petal]
export const SCHEDULE = { tiers: [[-12, -3, 1.6], [2, 9, 11], [10, 17, 19], [18.5, 24.5, 27.2], [23, 28.3, 30.2], [26.3, 31.4, 33.2], [29.5, 34.5, 36.2], [32.5, 37.1, 38.7]],
  crown: [33.7, 41.55], lead: 3.2, journey: 42 };
const STEM_TOP = 385, CROWN_Y = 410, CROWN_AXIS = [0.5, 0.8660254, 0];
export function stemTime(sch, y) {                                      // when the stem's tip reaches height y
  const T = sch.tiers; let y0 = 0, t0 = T[0][0] - sch.lead - 6;
  for (let i = 0; i < TIER_Y.length; i++) { const t1 = T[i][0] - sch.lead; if (y <= TIER_Y[i]) return t0 + (t1 - t0) * (y - y0) / (TIER_Y[i] - y0); y0 = TIER_Y[i]; t0 = t1; }
  return t0 + (sch.crown[0] - 1.6 - t0) * Math.min((y - y0) / (STEM_TOP - y0), 1.2);
}
// lay a list of records between two times, one after another, each with its mirror image half a step later
function layOut(S, list, ta, tb, extra) {
  const n = list.length; if (!n) return;
  const step = (tb - ta) / n;
  for (let i = 0; i < n; i++) S.put({ ...list[i], ...extra, t0: ta + i * step, mirror: true, mirrorLag: step * 0.5 });
}

// one tier: knot, two arms, two scroll leaves, two blossoms, tendrils and dot rows; an exact mirror about the stem
function buildTier(book, i, flower, rng, sch, vary) {
  const y = TIER_Y[i], k = TIER_REACH[i] / 60, R = 25 * k * (FLOWER_FIT[flower] || 1), al = (i - 1) * PI / 4, fl = i >= 3 && i % 2 ? -1 : 1;
  const S = sheet(book, [0, y, 0], [-Math.cos(al) * fl, 0, Math.sin(al) * fl], [0, 1, 0], { piv: [0, y, 0], face: -1 });
  const [p0, p1, l1, q0 = p0] = sch.tiers[i], s0 = p0 - sch.lead;   // q0 (optional fourth entry): the blossoms' own start, when they wait for the viewer
  const dir = 0.72 + rng.range(-0.12, 0.2), xb = TIER_REACH[i] - R * 1.02, yb = 17 * k + rng.range(0, 5);
  const F = { g: [], p: [], l: [], d: [], s: [] };
  FLOWERS[flower](F, xb, yb, R, dir, rng, vary);
  // the blossoms of the tiers we climb past turn on their own upright axes (through x = xb) to keep their faces to the
  // rider; the top tier's stand as they are laid, either side of the last straight
  if (i < 7) for (const k of ['g', 'p', 'l', 'd', 's']) for (const r of F[k]) r.turn = xb;
  // knot on the stem
  S.put({ x: 0, y: -4.5 * k, ang: PI / 2, len: 9 * k, wid: 9 * k, kind: KIND.DOT, a: OCHRE, b: RED, coat: 1, rank: 20, t0: s0, dur: 0.3, seed: rng(), dry: 0 });
  S.put({ x: 0.6, y: -5 * k, ...arcBetween(0.6, -5 * k, 0.6, 5 * k, -2.2), wid: 2.6 * k, kind: KIND.C, a: CHALK, b: OCHRE, coat: 2, rank: 8, t0: s0 + 0.25, seed: rng(), mirror: true, mirrorLag: 0.15 });
  S.put({ x: 0, y: 3 * k, ang: PI / 2, len: 13 * k, wid: 4.6 * k, kind: KIND.TEAR, a: RED, b: CHALK, split: 0.1, coat: 2, rank: 9, t0: s0 + 0.6, seed: rng(), strip: 'tear' });
  // arm: scoops out from the knot and up into the flower's base
  const ex = xb - Math.cos(dir) * R * 0.72, ey = yb - Math.sin(dir) * R * 0.72;
  const arm = { ...arcBetween(1.5, -1, ex, ey, 1.0 + rng.range(0, 0.35)), wid: 4.6 * k, kind: KIND.S, a: BLUE, b: CHALK, split: -0.15, coat: 0, rank: 99, seed: rng(), dur: 0.9, dry: 0.6 };
  S.put({ ...arm, t0: s0 + 0.5, mirror: true, mirrorLag: 0.45 });
  const A = { s: [], l: [], d: [] };
  for (let j = 0; j < 3; j++) { const q = strokePoint(arm, 0.3 + j * 0.22);
    A.s.push({ x: q[0], y: q[1], ang: q[2] + 0.9, len: (9 - j * 1.6) * k, wid: (3.2 - j * 0.5) * k, kind: KIND.TEAR, c1: -0.6, a: GREEN, b: CHALK, split: 0.25, coat: 0, rank: 6, seed: rng(), strip: 'tear' });
    if (j < 2) A.s.push({ x: q[0], y: q[1], ang: q[2] - 1.0, len: (6.5 - j) * k, wid: 2.3 * k, kind: KIND.TEAR, c1: 0.6, a: OCHRE, b: CHALK, split: -0.25, coat: 0, rank: 5, seed: rng(), strip: 'tear' }); }
  A.l.push(liner({ ...arcBetween(2.5, -2.2, ex, ey - 1.2 * k, arm.c1 * 0.96), wid: 0.5, z: 0.1, seed: rng(), dur: 0.8, rank: 4 }));
  const q1 = strokePoint(arm, 0.5), q2 = strokePoint(arm, 0.16);
  A.l.push(tendril(rng, { x: q1[0], y: q1[1], ang: q1[2] + 1.3, sgn: -1, len: 17 * k, a: CHALK }));
  A.l.push(tendril(rng, { x: q2[0], y: q2[1], ang: q2[2] + 1.9, sgn: 1, len: 13 * k, a: SOOT }));
  A.l.push(tendril(rng, { x: 1.5, y: -6 * k, ang: -1.2, sgn: -1, len: 12 * k, a: SOOT, c2: 5 }));
  for (let j = 0; j < 8; j++) { const q = strokePoint(arm, 0.1 + j * 0.1), sz = 1.5 * k * (1 - j * 0.07);
    A.d.push({ x: q[0], y: q[1] - sz * 0.5, ang: PI / 2, len: sz, wid: sz, kind: KIND.DOT, a: CHALK, coat: 2, rank: 2.4, z: 0.2, seed: rng(), dur: 0.12, dry: 0 }); }
  // scroll leaf, 40 m, below the arm; alternate tiers coil it under or up
  const up = (i + (vary.leafFlip ? 1 : 0)) % 2 === 0;
  scrollLeaf(F, 1.2, -3 * k, up ? -0.8 : -0.35, 40 * k * rng.range(0.94, 1.06), up ? -1 : 1, rng);
  layOut(S, [...F.s, ...A.s], s0 + 1.1, p0 - 0.1);
  layOut(S, [...F.g, ...F.p], q0, p1);
  layOut(S, [...A.l, ...F.l], p1, l1 - 0.9);
  const nd = A.d.length + F.d.length;
  layOut(S, [...A.d, ...F.d], Math.max(p1 + 0.3, l1 - nd / 8), l1);     // four a second, each side
  // a sprig half way to the next tier, set square to this one, so every side of the stem carries something broadside
  const Q = sheet(book, [0, y + 23 * k, 0], [S.N.x, 0, S.N.z], [0, 1, 0], { piv: [0, y + 23 * k, 0], face: -1 }), tq = stemTime(sch, y + 23 * k) + 0.5, G = [];
  G.push({ x: 1, y: 0, ang: 0.5, len: 17 * k, wid: 5 * k, kind: KIND.TEAR, c1: -1.1, a: GREEN, b: CHALK, split: 0.2, coat: 0, rank: 8, seed: rng(), strip: 'stroke', anim: 0.6 });
  G.push({ x: 1, y: 1.5, ang: 1.15, len: 11 * k, wid: 3.4 * k, kind: KIND.TEAR, c1: -0.7, a: GREEN, b: OCHRE, split: 0.2, coat: 0, rank: 6, seed: rng(), strip: 'tear' });
  G.push({ x: 1.2, y: -1, ang: -0.3, len: 9 * k, wid: 3 * k, kind: KIND.TEAR, c1: 0.9, a: RED, b: CHALK, split: -0.15, coat: 1, rank: 7, seed: rng(), strip: 'tear' });
  G.push(tendril(rng, { x: 1.5, y: 2, ang: 0.9, sgn: 1, len: 13 * k, a: CHALK, coat: 1 }));
  for (let j = 0; j < 4; j++) G.push({ x: (4 + j * 2.4) * k, y: (-3.4 - j * 0.9) * k, ang: PI / 2, len: 1.3 * k * (1 - j * 0.12), wid: 1.3 * k * (1 - j * 0.12), kind: KIND.DOT, a: CHALK, coat: 2, rank: 2.4, seed: rng(), dur: 0.12, dry: 0 });
  layOut(Q, G, tq, tq + 2.2);
  // (for a world that adds to a blossom: where it sits on its tier's sheet and which way it points, kept with the timetable)
  (sch.facts || (sch.facts = []))[i] = { at: [xb, yb], dir, R, sheetX: [S.X.x, S.X.y, S.X.z], turns: i < 7, vary };
  // where it is, for the world coder: blossom centres and radius in hero space
  const cen = (sx) => S.O.clone().addScaledVector(S.X, sx * xb).addScaledVector(S.Y, yb);
  return { y, angle: al, normal: S.N.clone(), blossoms: [cen(1), cen(-1)], radius: R * 1.08, reach: TIER_REACH[i], flower, petals: [q0, p1], done: l1 };
}

// the stem: stacked S-strokes, blue into chalk, 9 m thick at the urn and 3 m at the top; these sheets
// yaw to face the viewer (iPiv.w), like every house and horse in this world
function buildStem(book, rng, sch, stemPots) {
  const S = sheet(book, [0, 0, 0], [1, 0, 0], [0, 1, 0], { face: 7, piv: [0, 0, 0] });
  let j = 0;
  for (let y = 17; y < STEM_TOP - 6; j++) {
    const w = 9 - 6 * (y / STEM_TOP), len = Math.min(w * 2.1 + 5, STEM_TOP - y + 1), sg = j % 2 ? 1 : -1, t0 = stemTime(sch, y + len * 0.5);
    S.put({ x: sg * w * 0.1, y, ang: PI / 2 + sg * 0.07, len, wid: w, kind: KIND.S, c3: -sg * 0.16, a: stemPots[0], b: stemPots[1], split: sg * 0.12, coat: 0, rank: 99, t0, dur: 0.5, seed: rng(), dry: 0.55 });
    if (j % 2 === 0) S.put(liner({ x: -sg * w * 0.3, y: y + 1, ang: PI / 2 - sg * 0.05, len: len * 0.8, c3: sg * 0.2, a: SOOT, wid: 0.5, coat: 1, rank: 4, t0: t0 + 0.6, seed: rng(), dur: 0.5 }));
    else for (let d = 0; d < 3; d++) S.put({ x: -sg * w * 0.26, y: y + 2 + d * 2.6, ang: PI / 2, len: 1.3 - d * 0.2, wid: 1.3 - d * 0.2, kind: KIND.DOT, a: CHALK, coat: 1, rank: 2.4, t0: t0 + 0.7 + d * 0.25, dur: 0.12, seed: rng(), dry: 0 });
    y += len * 0.62;
  }
}

// the urn: two-handled, ochre and blue, 22 m tall, drawn in elevation; it keeps its front to the viewer
function buildUrn(book, rng) {
  const S = sheet(book, [0, 0, 0], [1, 0, 0], [0, 1, 0], { face: 7, piv: [0, 0, 0], rank: 99 });
  const M = (r) => S.put({ seed: rng(), mirror: true, ...r }), C = (r) => S.put({ seed: rng(), ...r });
  C({ x: 0, y: 17.6, ang: -PI / 2, len: 15, wid: 12.5, kind: KIND.TEAR, a: OCHRE, b: OCHRE, coat: 0, dry: 0.15, strip: 'stroke' });           // belly ground
  C({ ...arcBetween(-6.4, 1.1, 6.4, 1.1, 0.5), wid: 2.6, kind: KIND.C, a: BLUE, b: CHALK, split: 0.1, coat: 1 });                              // foot
  M({ ...arcBetween(5.2, 1.6, 1.9, 4.6, -1.3), wid: 1.9, kind: KIND.C, a: OCHRE, b: CHALK, split: 0.2, coat: 1 });
  M({ ...arcBetween(2.0, 3.8, 3.3, 17.4, 2.35), wid: 6.2, kind: KIND.C, a: OCHRE, b: CHALK, split: 0.25, coat: 1, dry: 0.5 });                  // belly sides
  C({ x: -8.2, y: 11.4, ang: 0, len: 16.4, wid: 2.5, kind: KIND.S, c3: 0.07, a: BLUE, b: CHALK, split: 0.15, coat: 1, dry: 0.7 });              // belly band
  C({ ...arcBetween(-3.9, 18.3, 3.9, 18.3, -0.5), wid: 2.3, kind: KIND.C, a: BLUE, b: CHALK, split: -0.1, coat: 1 });                           // neck
  C({ ...arcBetween(-5.9, 21, 5.9, 21, 0.45), wid: 2.4, kind: KIND.C, a: OCHRE, b: CHALK, split: 0.2, coat: 2 });                              // lip
  M({ ...arcBetween(4.0, 19.8, 8.0, 9.6, -2.5), wid: 2.0, kind: KIND.S, c2: 0, a: BLUE, b: CHALK, split: -0.2, coat: 1 });                       // handles
  M({ x: 8.0, y: 9.6, ang: -2.3, len: 6, wid: 1.3, kind: KIND.TEAR, c1: -2.6, c2: -2.5, a: BLUE, b: CHALK, coat: 1, strip: 'stroke' });
  const F = { p: [], l: [], d: [] };                                                                                                           // the flourish on its flank
  fan(F.p, { cx: 0, cy: 3.6, dir: PI / 2, n: 3, span: 1.3, r0: 6.6, len: 6, wid: 2.3, a: RED, b: CHALK, split: 0.15, rng, coat: 2 });
  fan(F.p, { cx: 0, cy: 12.6, dir: PI / 2, n: 3, span: 1.5, r0: 4.6, len: 4.2, wid: 1.7, a: RED, b: CHALK, split: 0.15, rng, coat: 2 });
  for (const r of F.p) C(r);
  M(liner({ ...arcBetween(4.2, 3.4, 5.4, 17.6, 2.3), wid: 0.34, coat: 2 }));
  M(liner({ x: 1.2, y: 4.2, ang: 0.3, len: 5, c1: 1.5, c2: 4.5, wid: 0.3, coat: 2, a: SOOT, anim: 0.6 }));
  M(liner({ x: 8.6, y: 15, ang: 0.6, len: 7, c1: 1.2, c2: 5, wid: 0.3, coat: 2, a: CHALK, anim: 1 }));
  for (let j = 0; j < 11; j++) C({ x: -7 + j * 1.4, y: 11.15 + 0.07 * 16.4 / TAU * (1 - Math.cos(TAU * (j * 1.4 + 1.2) / 16.4)) * 0.6, ang: PI / 2, len: 0.75, wid: 0.75, kind: KIND.DOT, a: CHALK, coat: 2, rank: 2.4, dry: 0 });
  for (let j = 0; j < 7; j++) C({ x: -4.2 + j * 1.4, y: 20.9 + 0.3 * Math.sin(j / 6 * PI), ang: PI / 2, len: 0.6, wid: 0.6, kind: KIND.DOT, a: SOOT, coat: 2, rank: 2.4, z: 0.3, dry: 0 });
  M({ x: 2.2, y: 21.6, ang: 0.9, len: 9, wid: 2.6, kind: KIND.TEAR, c1: -1.1, a: GREEN, b: CHALK, split: 0.25, coat: 0, strip: 'stroke' });   // sprigs at the mouth
  M({ x: 1.2, y: 21.8, ang: 1.3, len: 6, wid: 1.9, kind: KIND.TEAR, c1: -0.5, a: GREEN, b: OCHRE, split: 0.25, coat: 0 });
}

// the crown: twenty-four red-into-chalk teardrops 30 m across round a 15 m opening, tilted to the last straight,
// laid in mirrored pairs (the top four pairs first, then from the foot upward); and the neck that carries it off the stem
function buildCrown(book, rng, sch) {
  const ax = V3(...CROWN_AXIS), U = V3(0, 0, 1), W = V3().crossVectors(U, ax).normalize();   // W = up the ring
  const S = sheet(book, [0, CROWN_Y, 0], [U.x, U.y, U.z], [W.x, W.y, W.z]);
  const [c0, c1] = sch.crown, N = 24, F = { g: [], p: [], l: [], d: [], e: [] };
  const o = { cx: 0, cy: 0, dir: PI / 2, n: N, rng, phase: PI / N };
  fan(F.g, { ...o, phase: 0, r0: 17.4, len: 6.2, wid: 2.6, a: GREEN, b: CHALK, split: 0.25, coat: 0, rank: 6, bowl: 0.12 });
  fan(F.p, { ...o, r0: 15.6, len: 8.1, wid: 4.9, a: RED, b: CHALK, split: 0.12, bowl: 0.24, rank: 99 });
  fan(F.l, { ...o, r0: 14.6, len: 5.4, wid: 0.4, kind: KIND.LINER, a: SOOT, c1: 0.35, lean: 0.1, bowl: 0.24, coat: 2, rank: 4, dur: 0.3 });
  dots(F.d, { ...o, phase: 0, r: 16.6, size: 1.1, a: CHALK, fade: 0, z: 2.2, rank: 3 });
  dots(F.e, { ...o, r: 8.4, size: 1.5, a: OCHRE, fade: 0, z: 0.4, rank: 4 });
  // the whole sepal ring and its dot row go down first, as soon as the neck has arrived, so the portal never sits in
  // bare board; then the petals: the first twelve quickly, the rest more slowly, the last two pairs as we arrive
  const span = c1 - c0, knots = sch.crownKnots || [[0, 0], [11, 0.22], [19, 0.62], [N - 1, 1]];
  const when = (ord) => { let k = 1; while (k < knots.length - 1 && ord > knots[k][0]) k++; const [o0, f0] = knots[k - 1], [o1, f1] = knots[k]; return c0 + span * (f0 + (f1 - f0) * (ord - o0) / (o1 - o0)); };
  for (let j = 0; j < N; j++) {
    // pairs are counted from the foot of the ring; the first four pairs go on at its top (the near side for a viewer
    // coming up from the west, so the ring is red at first sight), then the rest from the foot upward, so that the
    // last pairs land on its upper sides, at about ten and two o'clock
    const dl = Math.abs(((j + 0.5) / N - 0.5) * TAU), pair = Math.round((PI - dl) / (TAU / N) - 0.5);
    const ord = (pair >= 8 ? 11 - pair : 4 + pair) * 2 + (j < N / 2 ? 0 : 1), t = when(ord);
    S.put({ ...F.g[j], t0: c0 - 0.6 + ord * 0.04 }); S.put({ ...F.p[j], t0: t }); S.put({ ...F.l[j], t0: t + 0.22 });
    S.put({ ...F.d[j], t0: c0 - 0.3 + ord * 0.05 }); S.put({ ...F.e[j], t0: t + 0.36 });
  }
  // neck: off the stem's tip, round under the ring to its foot, with two sepals; a fixed sheet in the plane of the last straight
  const foot = V3(0, CROWN_Y, 0).addScaledVector(W, -16.5), X = sheet(book, [0, 0, 0], [1, 0, 0], [0, 1, 0]);
  const tn = stemTime(sch, STEM_TOP) + 0.3;
  X.put({ ...arcBetween(0, STEM_TOP - 5, foot.x, foot.y, -0.95), wid: 3.6, kind: KIND.S, a: BLUE, b: CHALK, split: -0.15, coat: 0, rank: 99, t0: tn, dur: 0.6, seed: rng() });
  X.put(liner({ ...arcBetween(0.8, STEM_TOP - 4, foot.x + 0.6, foot.y - 0.8, -0.9), wid: 0.45, coat: 1, t0: tn + 0.7, seed: rng() }));
  for (const sg of [1, -1]) X.put({ x: foot.x - 1, y: foot.y - 2, ang: 1.05 + sg * 1.25, len: 11, wid: 3, kind: KIND.TEAR, c1: -sg * 0.9, a: GREEN, b: CHALK, split: sg * 0.25, coat: 1, rank: 9, t0: tn + 1 + 0.2 * sg, seed: rng(), strip: 'stroke' });
  X.put({ x: foot.x - 1.2, y: foot.y - 3.4, ang: PI / 2, len: 3.4, wid: 3.4, kind: KIND.DOT, a: OCHRE, b: RED, coat: 2, rank: 9, t0: tn + 1.4, seed: rng(), dry: 0 });
  // company for the ring: as soon as the sepals are down, liner tendrils spring outward between the petals in mirrored
  // pairs from the foot of the ring upward (chalk and soot by turns, each with an ochre bud at its root), and dot rows
  // are tapped out between them, four a second, running out of paint; the painted work reaches 27 m from the centre
  for (let k = 0; k < 12; k++) {
    const phi = PI / 2 + ((k + 0.5) / 12 - 0.5) * TAU, sg = Math.cos(phi) >= 0 ? 1 : -1, pr = Math.min(k, 11 - k), long = pr % 2 === 0;
    const t = c0 + 0.3 + pr * 0.32 + (k < 6 ? 0 : 0.16), cx = Math.cos(phi), cy = Math.sin(phi), sd = 0.13 + pr * 0.137;
    S.put(tendril(rng, { x: cx * 17.6, y: cy * 17.6, ang: phi - 0.3 * sg, sgn: sg, len: long ? 16 : 11.5, c1: (long ? 0.9 : 1.2) * sg, c2: (long ? 5 : 6.5) * sg, a: pr % 2 ? SOOT : CHALK, wid: 0.42, rank: 5, t0: t, seed: sd }));
    S.put({ x: cx * 18.2, y: cy * 18.2, ang: phi + 0.75 * sg, len: long ? 5.2 : 4.2, wid: long ? 1.9 : 1.6, kind: KIND.TEAR, c1: -0.7 * sg, a: OCHRE, b: CHALK, split: 0.2 * sg, coat: 1, rank: 6, t0: t + 0.35, seed: sd, strip: 'tear' });
    if (k === 0) continue;
    const ph2 = PI / 2 + (k / 12 - 0.5) * TAU, p2 = Math.min(k, 12 - k), t2 = c0 + 1.2 + p2 * 0.4 + (k < 6 ? 0 : 0.2);
    for (let j = 0; j < 5; j++) { const r = 19.4 + j * 1.85, sz = 1.35 - j * 0.17;
      S.put({ x: Math.cos(ph2) * r, y: Math.sin(ph2) * r - sz * 0.5, ang: PI / 2, len: sz, wid: sz, kind: KIND.DOT, a: p2 % 2 ? CHALK : OCHRE, coat: 2, rank: 3, t0: t2 + j * 0.25, dur: 0.12, seed: 0.2 + j * 0.13, dry: 0 }); }
  }
  return { W };
}

// the green: short C-strokes laid in rings round the urn, flat on the boards
function buildGreen(book, rng, detail, radius = 60) {
  const S = sheet(book, [0, 0, 0], [1, 0, 0], [0, 0, -1]);
  // under the short strokes the round is laid in with a broad brush: rings of long green pulls, head to tail, their dry
  // tails letting the boards through, so that from the street and from the climb the green is one green round
  for (let r = 16.5, k = 0; r < radius - 2; r += 10.2, k++) {
    const n = Math.max(4, Math.round(TAU * r / 21)), arc = TAU / n * 1.12;
    for (let j = 0; j < n; j++) { const phi = (j + 0.37 * k) / n * TAU;
      S.put({ x: Math.cos(phi) * r, y: Math.sin(phi) * r, ang: phi + PI / 2, len: r * arc, wid: 11.6, kind: KIND.S, c1: arc, a: GREEN, b: GREEN, coat: 0, z: 0.05, rank: 99,
        seed: (0.137 + 0.618 * (j + 3 * k)) % 1, dry: 0.5, anim: 0.2, strip: 'stroke' }); }
  }
  for (let r = 13, k = 0; r < radius; r += 5.2, k++) {
    const n = Math.round(TAU * r / 7.4 * detail), ph = rng() * TAU;
    for (let j = 0; j < n; j++) {
      const phi = ph + (j / n) * TAU + rng.range(-0.03, 0.03), rr = r + rng.range(-0.8, 0.8);
      S.put({ x: Math.cos(phi) * rr, y: Math.sin(phi) * rr, ang: phi + PI / 2 - 0.45, len: 6.4 * rng.range(0.85, 1.15), wid: 2.5, kind: KIND.C, c1: 0.9,
        a: GREEN, b: rng() < 0.22 ? OCHRE : rng() < 0.4 ? CHALK : GREEN, split: 0.3, coat: 1, rank: 2.2 + (k % 3) * 0.9, seed: rng(), dry: 0.9, anim: 0.4, strip: 'dot' });
    }
    if (k % 3 === 1) for (let j = 0; j < n; j += 2) { const phi = ph + ((j + 0.5) / n) * TAU;
      S.put({ x: Math.cos(phi) * (r + 2.6), y: Math.sin(phi) * (r + 2.6) - 0.45, ang: PI / 2, len: 0.9, wid: 0.9, kind: KIND.DOT, a: CHALK, coat: 1, rank: 1.6, seed: rng(), dry: 0 }); }
  }
}

// ---------------------------------------------------------------- the route round it (hero space)
// The brief's pace: 0.65 on the lake, 0.8 in the street, 1.25 on the spiral, 0.9 for the last tenth.
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const journeyPace = (u) => 0.65 + 0.15 * sm(0.14, 0.2, u) + 0.45 * sm(0.3, 0.36, u) - 0.35 * sm(0.87, 0.93, u);
const CLOCK_OF_U = (() => { const n = 128, a = [0]; for (let i = 0; i < n; i++) a.push(a[i] + 1 / journeyPace((i + 0.5) / n)); return a.map((v) => v / a[n]); })();
export function journeyClock(u, journey = SCHEDULE.journey) {     // u (0..1 along the path) -> seconds on the paint clock
  const x = Math.min(1, Math.max(0, u)) * 128, i = Math.min(127, Math.floor(x));
  return journey * (CLOCK_OF_U[i] + (CLOCK_OF_U[i + 1] - CLOCK_OF_U[i]) * (x - i));
}
function reachAt(y) { let i = 0; while (i < 7 && y > TIER_Y[i + 1]) i++; const j = Math.min(i + 1, 7), f = Math.min(1, Math.max(0, (y - TIER_Y[i]) / Math.max(TIER_Y[j] - TIER_Y[i], 1))); return TIER_REACH[i] + (TIER_REACH[j] - TIER_REACH[i]) * f; }
// the climb: past the urn 60 m... (here reach + 15) to its east, left-handed round the stem 1.45 times, a short
// turn-in from the west, then 70 m dead straight along CROWN_AXIS through the ring
function flyLine() {
  const pts = [], Y0 = 20, Y1 = 335, PH = 2.895 * PI, n = 36;
  pts.push([78, 14, -150], [76, 16, -70]);
  for (let i = 0; i <= n; i++) { const f = i / n, y = Y0 + (Y1 - Y0) * (f * f * 0.12 + f * 0.88), r = reachAt(y) + 12 + 4 * (1 - f), ph = PH * f; pts.push([Math.cos(ph) * r, y, Math.sin(ph) * r]); }
  const hx = -35 - 18, hz = 18; pts.pop(); pts.push([hx, Y1, hz + 2]);
  for (const a of [PI * 1.17, PI * 1.33]) pts.push([-35 + Math.cos(a) * 18, 335 + (349.4 - 335) * (a - PI) / (PI / 2), 18 + Math.sin(a) * 18]);
  for (const d of [-70, -46, -23, 0, 24]) pts.push([CROWN_AXIS[0] * d, CROWN_Y + CROWN_AXIS[1] * d, 0]);
  return pts;
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('kurbits') : ctx.rng;
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const style = opts.style || makeStyle(opts.palette || POTS, { rankStep: opts.rankStep });
  const sch = { ...SCHEDULE, ...(opts.schedule || {}) };
  const preview = opts.backdrop ?? (Object.keys(opts).length === 0);      // the part viewer passes no opts at all; a world passes backdrop: false
  // seeded cast: which invented flower each tier carries (never the same twice running), and their small choices
  const cast = FLOWERS[opts.cast] ? opts.cast : 'gourd';
  const pool = rng.shuffle(FLOWER_NAMES.filter((f) => f !== cast));
  const flowers = []; let pi = 0;
  for (let i = 0; i < 8; i++) flowers.push(i === 1 || i === 6 ? cast : pool[pi++ % pool.length]);
  const stemPots = opts.stem === 'red' ? [RED, CHALK] : [BLUE, CHALK];
  const object = new THREE.Group(); object.name = 'kurbits';
  const book = makeStrokeBook();
  buildUrn(book, rng);
  await ctx.yield();
  if (opts.green !== false) buildGreen(book, rng, detail, opts.greenRadius ?? 60);
  await ctx.yield();
  buildStem(book, rng, sch, stemPots);
  await ctx.yield();
  const tiers = [], warms = [];
  for (let i = 0; i < 8; i++) {
    const vary = { warm: rng.chance(0.45), n: rng.int(8, 10), n2: rng.int(6, 8), n3: rng.int(11, 15), n4: rng.int(10, 13), leafFlip: opts.leafFlip };
    const twin = flowers.indexOf(flowers[i]);                  // a flower that comes round again comes in its other colours
    if (twin < i) vary.warm = !warms[twin];
    warms.push(vary.warm);
    tiers.push(buildTier(book, i, flowers[i], rng, sch, vary));
    await ctx.yield();
  }
  const crown = buildCrown(book, rng, sch);
  await ctx.yield();
  const strokes = book.bake(style);
  object.add(strokes);
  await ctx.yield();
  // the bare boards, for looking at the piece alone (the world lays its own lake, wall and lid with boardMaterial)
  let wall = null;
  if (preview) {
    const floor = new THREE.Mesh(new THREE.CircleGeometry(1600, 48), boardMaterial(style, { mode: 0, plank: 14 }));
    floor.rotation.x = -PI / 2; floor.position.y = -0.3; object.add(floor);
    wall = new THREE.Group();
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1500, 1500, 2600, 90, 1, true), boardMaterial(style, { mode: 1, plank: 2, side: THREE.BackSide }));
    cyl.position.y = 500;
    const lid = new THREE.Mesh(new THREE.CircleGeometry(1500, 48), boardMaterial(style, { mode: 2, plank: 2 }));
    lid.rotation.x = PI / 2; lid.position.y = 1790;
    wall.add(cyl, lid); object.add(wall);
  }

  const ax = V3(...CROWN_AXIS), seat = V3(0, CROWN_Y, 0), fly = flyLine().map((p) => V3(...p));
  const discs = tiers.flatMap((t, i) => t.blossoms.map((c) => ({ c, n: t.normal, r: t.radius, turns: i < 7 })));
  const d3 = V3();
  // distance from a point (hero space) to the nearest painted sheet: blossoms, stem, urn, crown petals
  function clearance(p) {
    let best = Math.hypot(p.x, p.z) - (p.y < 24 ? 13 : 5) + Math.max(0, p.y - STEM_TOP);
    for (const d of discs) { d3.copy(p).sub(d.c);
      if (d.turns) { best = Math.min(best, d3.length() - d.r); continue; }      // a blossom that turns to the viewer: its whole round
      const h = d3.dot(d.n), rad = Math.sqrt(Math.max(d3.lengthSq() - h * h, 0)); best = Math.min(best, Math.hypot(h, Math.max(rad - d.r, 0))); }
    d3.copy(p).sub(seat); const h = d3.dot(ax), rad = Math.sqrt(Math.max(d3.lengthSq() - h * h, 0));
    return Math.min(best, Math.hypot(h, rad < 7.5 ? 7.5 - rad : Math.max(rad - 18, 0)));
  }
  let clockSet = false;
  if (preview && opts.kc) object.rotation.z = -PI / 3;                  // part viewer: lay the crown's axis level
  const dbg = (k) => (preview && Number(opts[k])) || 0;                  // part-viewer framing only (opts.kr, kh, kx, ky, kz)
  const hero = {
    object, radius: dbg('kr') || 64, height: dbg('kh') || 428, center: V3(dbg('kx'), dbg('ky') || 205, dbg('kz')), ground: false, groundY: 0,
    style, flowers, tiers, schedule: sch, triangles: strokes.userData.triangles, strokes: strokes.userData.strokes,
    anchors: {
      portalSeat: { position: seat.clone(), facing: ax.clone().negate(), exitDir: ax.clone(), radius: 7, up: crown.W.clone() },
      lastStraight: [seat.clone().addScaledVector(ax, -70), seat.clone()],
      flyThrough: fly,
      tiers, stemTop: V3(0, STEM_TOP, 0), urn: { height: 22, halfWidth: 13 }, green: { radius: opts.greenRadius ?? 60 },
      viewpoints: { entry: V3(0, 4, -330), lake: V3(0, 5, -200), street: V3(0, 18, -90), urnPass: V3(74, 20, 0), rim: V3(-66, 176, 12), crownApproach: seat.clone().addScaledVector(ax, -60) },
      newestBlossom(clock) { let k = 0; for (let i = 0; i < 8; i++) if (clock >= tiers[i].petals[0]) k = i; return tiers[k].blossoms[0]; },
    },
    clearance,
    setClock(t) { clockSet = true; style.setClock(t); },
    setProgress(u) { clockSet = true; style.setClock(journeyClock(u, sch.journey)); },
    setBreeze(b) { style.uniforms.uBreeze.value = b; },
    update(dt, time, camera) {
      style.update(dt, time, camera, ctx.renderer);
      // never told the hour: run the whole painting as a loop (the part viewer)
      if (!clockSet) style.uniforms.uClock.value = ((time * 2.4) % 52) - 4;
      if (wall && camera) { const e = camera.matrixWorld.elements; wall.position.set(e[12] - object.position.x, 0, e[14] - object.position.z); }
    },
    dispose() {},
  };
  return hero;
}
