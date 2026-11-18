// "What the Hill Is Holding" (sleeping-hill): the oak seen whole, as a radiograph, and the style kit
// the rest of the world is made from.
//
// STYLE KIT   const S = makeStyle(ctx, { palette, neutral })  (one instance per world; pass it to buildHero as opts.style;
//              neutral 0..1 pulls the shell tint from the built-in blue toward the palette's own steel, for silver or green plates)
//   S.pal        linear THREE.Colors: film, deep, steel, pale, white, gold (the brief's six, in order)
//   S.uniforms   shared, driven by S.update(dt, time, camera): uTime, uCam, uPx (pixels per metre at 1 m),
//                uPen  = penetration in metres below the snow line (1 .. 60; the WORLD sets this from u),
//                uLod  = (insides gone, one contour left, film) distances, default (60, 150, 260),
//                uExp  = plate exposure (1)
//   S.shell(o)   THE material. Unlit, depthTest/depthWrite off, both faces, screen blend (ONE, ONE_MINUS_SRC_COLOR).
//                Brightness = density * 0.15 / max(|n.v|, 0.15): nearly clear face-on, bright at the limb, so every
//                body draws its own contour and crossings add without ever burning out.
//                o: { density 0.045, tint 'blue'|'gold'|'white', inner (fades first with distance), glow (additive,
//                may exceed 1: hearts and gold only), beads (sap beads creeping along aData.y), pulse (heart),
//                breath (m), sway (m), flow (sap: a slow band of extra density climbing the wood, 0.3), lod [a,b,c], edge 0.15 (the |n.v| floor), sharp (squares the limb law).
//                Ground sheets: { density: 0.014, edge: 0.02, sharp: true } = clear from above, a bright thread edge-on }
//   S.line(o)    camera-facing ribbon material for bones, twigs, shafts, threads: never thinner than 1.5 px, dimmed
//                by the same ratio so a far twig is a faint thread and not a wire. o: { density, tint, sway, beads, flow,
//                near: [gone inside (m), whole beyond (m), greatest half-width in px or 0] } (threads never bar the lens; the oak's far
//                skeleton, one firm line per limb, exists only beyond 36-66 m). r.add(..., { alongK }) packs travelling beads closer.
//   S.points(o)  round sparks (pebbles, eggs, far seeds) as THREE.Points sized in metres, min 1.5 px. o: { tint, density, glow, pulse (a heart seen from far: beats on aData.w), lod [a,b,c] }
//   WARM LIFE    the film is cold; what is alive glows warm, and the warmth grows through the flight. Shared uniforms the WORLD
//                drives: uWarm 0..1 (default 1), uFront = metres from uOak that the warm front has reached (default 400), uOak.
//                tints 'heart' (a sleeper's heart) and 'sap' (amber; uWarmTint). Any material takes
//                warm: [toAmber 0..1, gain, front 0|1 (1 = only behind the front), sap] : with warmth the base turns amber and
//                gains brightness; sap > 0 makes its beads amber (sap 1: long soft beads that only exist once warm; points: growth).
//                shell far: [from, to, amount] dims a heap of glowing shells with distance; line farMin keeps a far twig haze.
//   S.sky()      film-black dome mesh (follow the camera with it); S.filmColor for scene.background
//   S.crystals(n, box)  falling snow crystals (instanced quads): hexagon plates and six-armed stars drawn as thin contours in the
//                fragment shader, a point only when too small for a shape. material.uniforms: uDrift, uDens, uSize (1), uNear (1 = fade inside 1 m)
//   geometry     S.batch() -> b.tube(points, radii, sides, {sway, phase, inner, alongK (packs sap beads closer)}), b.ball(center, radii, {...}),
//                b.build() -> BufferGeometry carrying position, normal, aData;   S.ribbons() -> r.add(points, width, {...}),
//                r.build();   S.bulbGeometry() -> { skin, flower } for instanced bulbs
//   Vertex attribute aData = (depth below snow line in m, metres along the limb, sway/breath weight, phase 0..1).
//   Instanced meshes add an instanced vec4 aInst = (depth, phase, 0, 0). Penetration hides depth > uPen (soft 2 m edge).
//
// HERO   const hero = await buildHero(ctx, { style, palette, detail, snow: true, bulbs: 130 })
//   The oak whole: crown to +26 m (28 m wide), the same tree mirrored and made sinuous as roots to -26 m, fourteen growth
//   rings through the bole with sap beads, heartwood shells in the limbs, gold butterfly eggs on the crown's twig tips,
//   gold-hearted bulbs under the snow, the jay's and the mice's acorn hoards, three badgers curled in their chamber,
//   five dormice in a hollow of the bole (eight hearts, each on its own 3 s beat), and the sinker root running down
//   to a closed loop of root 16 m across at -38 m: the exit portal's seat.
//   Origin = foot of the trunk ON THE SNOW LINE (y 0), +Y up, the approach comes from +Z. radius 20, height 26
//   (the loop lies 28 m out and 38 m down, outside that radius).
//   opts: style (the world's shared makeStyle instance), palette (6 hex), detail 0.6-1 (thins twigs, eggs, bulbs),
//         snow (false when the world draws its own snow sheet), bulbs (count near the tree; 0 if the world scatters all).
//   hero.setProgress(p)   p 0..1 -> penetration 1 m .. 60 m (drive from u over the seven-second climb; default is 60,
//                         the tree whole). hero.setPenetration(metres) sets it directly. Both write style.uniforms.uPen.
//   hero.update(dt, time, camera) calls style.update: call one of them every frame, not both.
//   hero.skeleton        the far drawing's line material: uniforms.uDens (0.5) and uWScale (1, widens it) may be raised while the oak is far
//                         off and hero.object is scaled up for a forced perspective (the world does both in the brook and the wood).
//   ROUND FIVE: hero.crownMat / twigMat (the crown's limb shells and twig lines), heartMat (heartwood of crown and roots), loopMat /
//                         loopHeartMat (sinker, loop and wreath), ringMat (growth rings). Every shell has uNearF = (x, y, z, w): limbs finer than
//                         radius z (w = 0) or all but the greatest (w = 1, the old law) clear away between x and y metres of the lens; and
//                         uNearA = (x, y): everything of that material clears away inside x..y metres (0, 0 = off). S.hollow(k) is an absence of
//                         matter (it darkens what was drawn before it; renderOrder 5): the dormice's hollow in the bole, their hearts drawn after.
//   hero.rootMat / hero.rootletMat   for the dive: rootMat.uniforms.uNearF (x, y metres; 0, 0 = off) clears the fine roots away round
//                         the lens and leaves the great ones whole; rootletMat.uniforms.uNearW is S.line's near: [gone inside, whole beyond, 0].
//   The loop wears a wreath (two finer roots wound round each other 3.3 m outside it); the sinker is drawn through a relaxed line.
//   anchors (local space, THREE.Vector3): portalSeat { position, normal (toward the arriving camera), radius 7, pitchDeg -50 },
//     loop { center, axis, radius 8 }, dive { start (8 m up), dir, length 60, snowEntry }, orbit { center, radius 20,
//     fromDeg 90, toDeg 200 }, flyThrough [approach x2, orbit x6, turn-in and lift x3, dive x7 ending in the loop],
//     viewpoints { whole, lookAt }, badgers, dormice, jayHoard, mouseHoard, hearts [8].
//     Clearance: 3.4 m round the dive line and the end of the turn-in (roots pass like rafters); open air elsewhere.
//     The badgers' chamber lies 24 m down the dive line, 5.4 m to its left and 2.5 m above it (8.8 m under the snow), kept clear of
//     roots along the sight line from the stoop, so it is seen beside the loop for the whole dive.
//   Cost: about 145k triangles, 37 draw calls, no lights, no textures, about 350 ms of build in steps under 35 ms.
import * as THREE from 'three';
import { makeRng, makeNoise } from '../kit/core.js';

const PALETTE = ['#05081A', '#1C3557', '#4F7FB0', '#A9C8E6', '#EEF6FF', '#F2D58A'];
const TAU = Math.PI * 2;

const SHELL_VS = /* glsl */`
attribute vec4 aData; attribute float aGain;
#ifdef USE_INSTANCING
attribute vec4 aInst;
#endif
uniform float uTime, uPen, uSway, uBreath, uPulse, uWarm, uFront;
uniform vec3 uCam, uThin, uOak; uniform vec4 uWarmP, uNearF; uniform vec2 uNearA;
varying vec3 vN, vV; varying float vDist, vPen, vAlong, vPhase, vBeat, vY, vWarm;
void main(){
  vec3 p = position, n = normal;
  float depth = aData.x, phase = aData.w;
#ifdef USE_INSTANCING
  depth += aInst.x; phase += aInst.y;
#endif
  float t = fract(uTime / 3.0 + phase) * 3.0;
  vBeat = uPulse * smoothstep(0.0, 0.4, t) * (1.0 - smoothstep(0.4, 1.2, t));
  p *= 1.0 + 0.15 * vBeat;
  p += n * uBreath * aData.z * (0.5 + 0.5 * sin(uTime * 1.3 + phase * 6.283));
  vec4 w = vec4(p, 1.0);
#ifdef USE_INSTANCING
  w = instanceMatrix * w; n = mat3(instanceMatrix) * n;
#endif
  w = modelMatrix * w; n = mat3(modelMatrix) * n;
  float sw = aData.z * uSway * (1.0 + 2.0 * (1.0 - smoothstep(4.0, 18.0, distance(w.xyz, uCam))));
  w.x += sw * sin(uTime * 0.9 + phase * 6.283 + w.y * 0.4);
  w.z += sw * cos(uTime * 0.7 + phase * 5.0 + w.y * 0.3);
  vN = n; vV = uCam - w.xyz; vDist = length(vV); vY = w.y;
  vPen = 1.0 - smoothstep(uPen - 2.0, uPen, depth);
  vPen *= 1.0 + 0.8 * smoothstep(uPen - 5.0, uPen - 2.0, depth) * step(0.01, depth) * (1.0 - smoothstep(50.0, 58.0, uPen));
  vPen *= 1.0 + aGain;
  float lr = 0.1 * (1.0 + aGain) * (1.0 + aGain);          // the oak's limbs carry their radius in aGain: fine ones leave with distance
  float far = uThin.z * smoothstep(uThin.x, uThin.y, vDist), thick = smoothstep(0.12, 0.42, lr);
  vPen *= (1.0 - far * (1.0 - thick)) * (1.0 + 2.2 * far * thick);      // ...and the trunk and main limbs are left as one firm contour
  float fineK = mix(1.0 - smoothstep(uNearF.z, uNearF.z + 0.14, lr), 1.0 - thick * thick * thick, uNearF.w);      // which limbs count as fine: below a radius (z), or (w = 1) all but the greatest
  vPen *= mix(1.0, smoothstep(uNearF.x, max(uNearF.y, uNearF.x + 0.01), vDist), fineK * step(0.001, uNearF.y));      // uNearF (world-driven, 0 = off): fine limbs clear away round the lens, the great ones stay whole
  vPen *= mix(1.0, smoothstep(uNearA.x, max(uNearA.y, uNearA.x + 0.01), vDist), step(0.001, uNearA.y));      // uNearA (world-driven, 0 = off): no limb at all against the lens
  vAlong = aData.y; vPhase = phase;
  vWarm = uWarm * mix(1.0, 1.0 - smoothstep(uFront - 16.0, uFront, distance(w.xyz, uOak)), uWarmP.z);      // warmth: everywhere, or behind the front spreading from the oak
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const SHELL_FS = /* glsl */`
uniform vec3 uTint, uLod, uWarmTint, uFar; uniform vec4 uWarmP; uniform float uDens, uInner, uBeads, uExp, uTime, uGlow, uEdge, uSharp, uFlow;
varying vec3 vN, vV; varying float vDist, vPen, vAlong, vPhase, vBeat, vY, vWarm;
void main(){
  vec3 n = vN / max(length(vN), 1e-4), v = vV / max(vDist, 1e-4);
  float ndv = min(abs(dot(n, v)), 1.0);
  float limb = 0.15 / max(ndv, uEdge);
  limb = mix(limb, limb * limb, uSharp);
  float c = 1.0 - ndv, k = smoothstep(uLod.x, uLod.y, vDist);
  float b = uDens * mix(limb, 6.7 * c * c * c, k * (1.0 - uSharp));
  b *= mix(1.0, 1.0 - smoothstep(uLod.x * 0.5, uLod.x * 1.4, vDist), uInner);
  b *= 1.0 - smoothstep(uLod.y, uLod.z, vDist);
  b *= 1.0 - uFar.z * smoothstep(uFar.x, uFar.y, vDist);          // a heap of glowing shells is dimmed from afar, so that it never adds up to a white tile
  float bead = fract(vAlong * 0.22 - uTime * 0.06 + vPhase);
  // sap (uWarmP.w): beads grow longer, show across the whole limb and turn amber as the warmth reaches them
  float lo = mix(0.93, 0.78, uWarmP.w), hi = mix(0.97, 0.9, uWarmP.w);                 // a soft swell, not a band
  float bd = uBeads * smoothstep(lo, hi, bead) * (1.0 - smoothstep(hi, 1.0, bead)) * (1.0 - k) * mix(1.0 - smoothstep(0.12, 0.4, ndv), vWarm * (0.25 + 0.75 * c), uWarmP.w);
  float m = (1.0 + uFlow * sin(vY * 0.55 - uTime * 0.9 + vPhase * 1.5)) * (1.0 + 0.6 * vBeat) * vPen * uExp;
  vec3 col = (mix(uTint, uWarmTint, uWarmP.x * vWarm) * b * (1.0 + uWarmP.y * vWarm) + mix(uTint, uWarmTint, step(0.001, uWarmP.w) * vWarm) * bd) * m;
  col = mix(min(col, vec3(1.0)), col * 1.6, uGlow);
  gl_FragColor = vec4(col, 0.0);
}`;

const HOLLOW_FS = /* glsl */`
uniform float uDens;
varying vec3 vN, vV; varying float vDist, vPen;
void main(){
  vec3 n = vN / max(length(vN), 1e-4), v = vV / max(vDist, 1e-4);
  float ndv = min(abs(dot(n, v)), 1.0);
  gl_FragColor = vec4(vec3(uDens * ndv * ndv * clamp(vPen, 0.0, 1.0)), 0.0);
}`;

const LINE_VS = /* glsl */`
attribute vec4 aData; attribute vec3 aTan; attribute vec2 aSide;
uniform float uTime, uPen, uSway, uPx, uWarm, uFront, uFarMin, uWScale; uniform vec3 uCam, uOak, uNearW; uniform vec4 uWarmP;
varying float vDist, vPen, vAcross, vAlong, vPhase, vThin, vY, vWarm;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  float sw = aData.z * uSway * (1.0 + 2.0 * (1.0 - smoothstep(4.0, 18.0, distance(w.xyz, uCam))));
  w.x += sw * sin(uTime * 0.9 + aData.w * 6.283 + w.y * 0.4);
  w.z += sw * cos(uTime * 0.7 + aData.w * 5.0 + w.y * 0.3);
  vWarm = uWarm * mix(1.0, 1.0 - smoothstep(uFront - 16.0, uFront, distance(w.xyz, uOak)), uWarmP.z);
  vec3 tw = mat3(modelMatrix) * aTan, v = uCam - w.xyz;
  vDist = length(v);
  vec3 s = cross(tw, v); s = s / max(length(s), 1e-4);
  float want = aSide.y * uWScale, least = 0.75 * vDist / max(uPx, 1.0);      // uWScale: the world widens a far drawing with its forced perspective (1)
  float hw = max(want, least);
  hw = min(hw, max(least, mix(1e6, uNearW.z * vDist / max(uPx, 1.0), step(0.001, uNearW.z))));      // uNearW.z: greatest half-width in pixels (0 = none)
  vThin = clamp(want / max(hw, 1e-5), 0.03, 1.0);
  vThin = max(vThin, uFarMin * smoothstep(45.0, 80.0, vDist));          // a far crown keeps a haze of twigs
  w.xyz += s * aSide.x * hw;
  vAcross = aSide.x; vAlong = aData.y; vPhase = aData.w; vY = w.y;
  vPen = 1.0 - smoothstep(uPen - 2.0, uPen, aData.x);
  vPen *= 1.0 + 0.8 * smoothstep(uPen - 5.0, uPen - 2.0, aData.x) * step(0.01, aData.x) * (1.0 - smoothstep(50.0, 58.0, uPen));
  vPen *= smoothstep(uNearW.x, uNearW.y, vDist);          // nothing of this kind inside uNearW.x metres; whole beyond uNearW.y
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const LINE_FS = /* glsl */`
uniform vec3 uTint, uLod, uWarmTint; uniform vec4 uWarmP; uniform float uDens, uBeads, uExp, uTime, uGlow, uFlow;
varying float vDist, vPen, vAcross, vAlong, vPhase, vThin, vY, vWarm;
void main(){
  float b = uDens * (1.0 - vAcross * vAcross) * vThin;
  b *= 1.0 - smoothstep(uLod.x * 0.6, uLod.y * 0.9, vDist);
  float bead = fract(vAlong * 0.12 - uTime * 0.05 + vPhase);
  float lo = mix(0.93, 0.78, uWarmP.w), hi = mix(0.97, 0.9, uWarmP.w);
  float bd = uBeads * smoothstep(lo, hi, bead) * (1.0 - smoothstep(hi, 1.0, bead)) * mix(1.0, vWarm * vThin * vThin, uWarmP.w);      // sap beads on a far twig thin away with it (they were loose dashes)
  float m = (1.0 + uFlow * sin(vY * 0.55 - uTime * 0.9 + vPhase * 1.5)) * vPen * uExp;
  vec3 col = (mix(uTint, uWarmTint, uWarmP.x * vWarm) * b * (1.0 + uWarmP.y * vWarm) + mix(uTint, uWarmTint, step(0.001, max(uWarmP.w, uWarmP.x)) * vWarm) * bd) * m;
  col = mix(min(col, vec3(1.0)), col * 1.6, uGlow);
  gl_FragColor = vec4(col, 0.0);
}`;

const POINT_VS = /* glsl */`
attribute vec4 aData;                      // depth, diameter (m), twinkle weight, phase
uniform float uTime, uPen, uPx, uPulse, uWarm, uFront; uniform vec3 uCam, uLod, uOak; uniform vec2 uMin; uniform vec4 uWarmP;
varying float vB, vWarm;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  float d = distance(w.xyz, uCam);
  vWarm = uWarm * mix(1.0, 1.0 - smoothstep(uFront - 16.0, uFront, distance(w.xyz, uOak)), uWarmP.z);
  float grow = 1.0 + uWarmP.w * vWarm;                    // warm lights swell as the warmth reaches them
  float want = aData.y * grow * uPx / max(d, 0.05), px = clamp(want, uMin.x * grow * max(1.0, uPx / 390.0), 14.0 * grow * max(1.0, uPx / 390.0));
  float thin = clamp(want / px, uMin.y, 1.0);
  vB = thin * thin * (1.0 - smoothstep(uLod.y, uLod.z, d)) * (1.0 - smoothstep(uPen - 2.0, uPen, aData.x));
  float t = fract(uTime / 3.0 + aData.w) * 3.0, beat = smoothstep(0.0, 0.4, t) * (1.0 - smoothstep(0.4, 1.2, t));
  vB *= mix(1.0 + aData.z * 0.35 * sin(uTime * 1.7 + aData.w * 6.283), 0.5 + 0.9 * beat, uPulse);
  gl_PointSize = px * (1.0 + 0.2 * beat * uPulse);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const POINT_FS = /* glsl */`
uniform vec3 uTint, uWarmTint; uniform vec4 uWarmP; uniform float uDens, uExp, uGlow;
varying float vB, vWarm;
void main(){
  vec2 q = gl_PointCoord * 2.0 - 1.0; float r2 = dot(q, q);
  float b = uDens * vB * uExp * (1.0 - smoothstep(0.7, 1.0, r2)) * (0.55 + 0.45 * r2) * (1.0 + uWarmP.y * vWarm);
  vec3 col = mix(uTint, uWarmTint, uWarmP.x * vWarm) * b;
  gl_FragColor = vec4(mix(min(col, vec3(1.0)), min(col * 1.25, uTint * 1.3 + 0.2), uGlow), 0.0);
}`;

// Snow crystals: one instanced quad each. aInst = (x, y, z in the box, seed); the box wraps round the camera.
const CRYSTAL_VS = /* glsl */`
attribute vec4 aInst;
uniform float uTime, uPx, uSize, uNear; uniform vec3 uCam, uBox, uDrift;
varying vec2 vUv; varying float vB, vKind, vPt;
void main(){
  float s = aInst.w;
  vec3 c = aInst.xyz + uDrift * uTime + vec3(sin(uTime * 0.31 + s * 40.0), 0.0, cos(uTime * 0.27 + s * 23.0)) * 0.25;
  c = uCam + mod(c - uCam + 0.5 * uBox, uBox) - 0.5 * uBox;
  vec3 v = c - uCam; float d = max(length(v), 0.05);
  float size = mix(0.04, 0.10, fract(s * 7.31)) * 0.5 * uSize;
  float least = 1.0 * d / max(uPx, 1.0), hs = max(size, least);
  float th = uTime * mix(0.25, 0.7, fract(s * 3.17)) + s * 6.283;
  vec3 ax = vec3(0.35 * sin(s * 12.0), 0.94, 0.35 * cos(s * 9.0));
  ax = ax / max(length(ax), 1e-4);
  vec3 b1 = cross(ax, vec3(1.0, 0.0, 0.0)); b1 = b1 / max(length(b1), 1e-4);
  vec3 b2 = cross(ax, b1);
  vec3 e = b1 * cos(th) + b2 * sin(th);
  vec3 vd = v / d;
  // far crystals are points: face them to the eye; near ones turn freely and thin to a line
  float farK = smoothstep(0.5, 1.0, least / max(size, 1e-4));
  vec3 r0 = cross(vd, vec3(0.0, 1.0, 0.0)); r0 = r0 / max(length(r0), 1e-4);
  vec3 ex = mix(e, r0, farK), ey = mix(ax, cross(r0, vd), farK);
  vec3 w = c + (ex * position.x + ey * position.y) * hs * 2.0;
  vUv = position.xy * 2.0; vKind = step(0.5, fract(s * 5.7)); vPt = 2.0 * hs * uPx / d;      // pixels across
  vB = clamp(size / hs, 0.0, 1.0); vB *= vB * (1.0 - smoothstep(0.35 * uBox.z, 0.5 * uBox.z, d));
  vB *= mix(1.0, smoothstep(0.5, 1.1, d), uNear);           // the lens layer: nothing swells against the glass
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`;
const CRYSTAL_FS = /* glsl */`
uniform vec3 uTint; uniform float uDens, uExp;
varying vec2 vUv; varying float vB, vKind, vPt;
void main(){
  // a crystal is a contour: a hexagon ring with a smaller one inside, or six arms round a small hexagon. The line width
  // comes from each field's own screen derivative, so a plate turning edge-on thins to a line instead of filling.
  vec2 q = abs(vUv);
  float hex = max(q.x * 0.866 + q.y * 0.5, q.y), w = max(fwidth(hex), 1e-4) * 1.3;
  float plate = (1.0 - smoothstep(0.0, w, abs(hex - 0.78))) + 0.5 * (1.0 - smoothstep(0.0, w, abs(hex - 0.4)));
  float a1 = abs(vUv.y), a2 = abs(vUv.x * 0.866 + vUv.y * 0.5), a3 = abs(vUv.x * 0.866 - vUv.y * 0.5);
  float da = min(q.x, min(abs(vUv.x * 0.5 + vUv.y * 0.866), abs(vUv.x * 0.5 - vUv.y * 0.866))), wa = max(fwidth(da), 1e-4) * 1.3;
  float star = (1.0 - smoothstep(0.0, wa, da)) * step(max(a1, max(a2, a3)), 0.9) + 0.5 * (1.0 - smoothstep(0.0, w, abs(hex - 0.45)));
  float fill = mix(min(mix(plate, star, vKind), 1.0), 1.0, 1.0 - smoothstep(4.0, 9.0, vPt)) * step(hex, 0.95);     // a point only once it is too small for a shape
  gl_FragColor = vec4(min(uTint * uDens * vB * uExp * fill, vec3(1.0)), 0.0);
}`;

export function makeStyle(ctx, opts = {}) {
  const hex = opts.palette && opts.palette.length >= 6 ? opts.palette : PALETTE;
  const C = hex.map((h) => new THREE.Color(h));
  const pal = { film: C[0], deep: C[1], steel: C[2], pale: C[3], white: C[4], gold: C[5] };
  const norm = (c) => { const m = Math.max(c.r, c.g, c.b, 1e-4); return new THREE.Vector3(c.r / m, c.g / m, c.b / m); };
  const tints = {
    blue: norm(pal.steel).lerp(new THREE.Vector3(0.25, 0.5, 1.0), 0.5 * (1 - (opts.neutral ?? 0))),   // the stack runs steel blue, then white
    white: norm(pal.white).multiplyScalar(0.95),
    gold: norm(pal.gold),
  };
  // warm life in the cold film: a sleeper's heart, and sap, are the plate's gold pushed toward amber (round warm oak: a deeper amber,
  // little blue in it, so that where warm shells pile up the light stays amber for longer; a deep pile still ends at the film's white)
  tints.heart = new THREE.Vector3(1.0, 0.40 * tints.gold.y, 0.12 * tints.gold.z);
  tints.sap = new THREE.Vector3(1.0, 0.60 * tints.gold.y, 0.10 * tints.gold.z);
  const U = {
    uTime: { value: 0 }, uPen: { value: 60 }, uCam: { value: new THREE.Vector3(0, 2, 40) }, uPx: { value: 600 },
    uLod: { value: new THREE.Vector3(60, 150, 260) }, uExp: { value: 1 },
    // warmth (the world drives these from u): uWarm 0..1 everywhere, uFront = metres from uOak that the warm front has reached
    uWarm: { value: 1 }, uFront: { value: 400 }, uOak: { value: new THREE.Vector3(0, 0, 0) }, uWarmTint: { value: tints.sap },
  };
  // o.warm = [toAmber 0..1, gain, front 0|1 (1 = only behind the front), sap 0|1 (points: growth)]
  const warmOf = (o) => ({ value: new THREE.Vector4(...(o.warm || [0, 0, 0, 0])) });
  const mats = [];
  const blend = (glow) => ({
    side: THREE.DoubleSide, depthTest: false, depthWrite: false, transparent: true, fog: false, toneMapped: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor,
    blendDst: glow ? THREE.OneFactor : THREE.OneMinusSrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
  });
  const tintOf = (o) => ({ value: (o.tint && o.tint.isVector3) ? o.tint : tints[o.tint || 'blue'] });
  const keep = (m) => { mats.push(m); return m; };
  function shell(o = {}) {
    return keep(new THREE.ShaderMaterial({
      vertexShader: SHELL_VS, fragmentShader: SHELL_FS, ...blend(o.glow),
      uniforms: { ...U, uTint: tintOf(o), uWarmP: warmOf(o), uDens: { value: o.density ?? 0.045 }, uInner: { value: o.inner ? 1 : 0 },
        uBeads: { value: o.beads ?? 0 }, uGlow: { value: o.glow ? 1 : 0 }, uPulse: { value: o.pulse ? 1 : 0 },
        uBreath: { value: o.breath ?? 0 }, uSway: { value: o.sway ?? 0 }, uEdge: { value: o.edge ?? 0.15 }, uSharp: { value: o.sharp ? 1 : 0 }, uFlow: { value: o.flow ?? 0 },
        uThin: { value: new THREE.Vector3(o.thin ? o.thin[0] : 50, o.thin ? o.thin[1] : 95, o.thin ? 1 : 0) }, uFar: { value: new THREE.Vector3(...(o.far || [50, 100, 0])) }, uNearF: { value: new THREE.Vector4(0, 0, 0.1, 1) }, uNearA: { value: new THREE.Vector2(0, 0) },
        ...(o.lod ? { uLod: { value: new THREE.Vector3(...o.lod) } } : {}) },
    }));
  }
  // a hollow in the wood: less matter, so the film is darker there (the dormice's hollow in the bole); draw it after the wood
  function hollow(k = 0.6) {
    return keep(new THREE.ShaderMaterial({
      vertexShader: SHELL_VS, fragmentShader: HOLLOW_FS, side: THREE.DoubleSide, depthTest: false, depthWrite: false, transparent: true, fog: false, toneMapped: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.OneMinusSrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: { ...U, uDens: { value: k }, uWarmP: warmOf({}), uPulse: { value: 0 }, uBreath: { value: 0 }, uSway: { value: 0 }, uThin: { value: new THREE.Vector3(50, 95, 0) }, uNearF: { value: new THREE.Vector4(0, 0, 0.1, 1) }, uNearA: { value: new THREE.Vector2(0, 0) } },
    }));
  }
  function line(o = {}) {
    return keep(new THREE.ShaderMaterial({
      vertexShader: LINE_VS, fragmentShader: LINE_FS, ...blend(o.glow),
      uniforms: { ...U, uTint: tintOf(o), uWarmP: warmOf(o), uDens: { value: o.density ?? 0.3 }, uBeads: { value: o.beads ?? 0 },
        uGlow: { value: o.glow ? 1 : 0 }, uSway: { value: o.sway ?? 0 }, uFlow: { value: o.flow ?? 0 }, uFarMin: { value: o.farMin ?? 0 }, uWScale: { value: 1 },
        uNearW: { value: new THREE.Vector3(...(o.near || [-2, -1, 0])) },      // near: [gone inside, whole beyond (m), greatest half-width (px, 0 = none)]
        ...(o.lod ? { uLod: { value: new THREE.Vector3(...o.lod) } } : {}) },
    }));
  }
  function points(o = {}) {
    return keep(new THREE.ShaderMaterial({
      vertexShader: POINT_VS, fragmentShader: POINT_FS, ...blend(o.glow),
      uniforms: { ...U, uTint: tintOf(o), uWarmP: warmOf(o), uDens: { value: o.density ?? 0.6 }, uGlow: { value: o.glow ? 1 : 0 }, uPulse: { value: o.pulse ? 1 : 0 },
        uMin: { value: new THREE.Vector2(o.min ? o.min[0] : 2.2, o.min ? o.min[1] : 0.45) },      // least size in pixels (at 450 lines) and the dimming floor of a far point
        ...(o.lod ? { uLod: { value: new THREE.Vector3(...o.lod) } } : {}) },
    }));
  }

  // ---- geometry: everything is tubes (a ball is a short tube whose radii follow a circle) ----
  function batch() {
    const P = [], N = [], D = [], G = [], I = [];
    const b = {
      get tris() { return I.length / 3; },
      // pts: [{x,y,z}], radii: number | number[], o: { sway: number|number[], phase, depth: number|fn(p), flat, up:{x,y,z}, along,
      //   gain: number|number[] = extra thickness, brightness x (1 + gain) }
      tube(pts, radii, sides, o = {}) {
        const n = pts.length; if (n < 2) return b;
        const base = P.length / 3, flat = o.flat ?? 1, phase = o.phase ?? 0;
        const R = (i) => (typeof radii === 'number' ? radii : radii[i]);
        let ux = 0, uy = 0, uz = 0, along = o.along ?? 0;
        if (o.up) { ux = o.up.x; uy = o.up.y; uz = o.up.z; }
        for (let i = 0; i < n; i++) {
          const a = pts[Math.max(i - 1, 0)], c = pts[Math.min(i + 1, n - 1)], p = pts[i];
          let tx = c.x - a.x, ty = c.y - a.y, tz = c.z - a.z; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
          if (i === 0 && !o.up) { if (Math.abs(ty) < 0.9) { ux = 0; uy = 1; uz = 0; } else { ux = 1; uy = 0; uz = 0; } }
          let k = ux * tx + uy * ty + uz * tz; ux -= tx * k; uy -= ty * k; uz -= tz * k;
          let ul = Math.hypot(ux, uy, uz);
          if (ul < 1e-5) {
            if (Math.abs(ty) < 0.9) { ux = 0; uy = 1; uz = 0; } else { ux = 1; uy = 0; uz = 0; }
            k = ux * tx + uy * ty + uz * tz; ux -= tx * k; uy -= ty * k; uz -= tz * k; ul = Math.hypot(ux, uy, uz) || 1;
          }
          ux /= ul; uy /= ul; uz /= ul;
          const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux;
          const r = R(i), slope = (R(Math.min(i + 1, n - 1)) - R(Math.max(i - 1, 0))) / tl;
          if (i > 0) along += Math.hypot(p.x - a.x, p.y - a.y, p.z - a.z) * (o.alongK ?? 1);      // alongK > 1 packs the sap beads closer
          const depth = typeof o.depth === 'function' ? o.depth(p) : (o.depth ?? Math.max(0, -p.y));
          const sway = o.sway === undefined ? 0 : (typeof o.sway === 'number' ? o.sway : o.sway[i]);
          const gain = o.gain === undefined ? 0 : (typeof o.gain === 'number' ? o.gain : o.gain[i]);
          for (let j = 0; j < sides; j++) {
            const an = (j / sides) * TAU, cs = Math.cos(an), sn = Math.sin(an);
            P.push(p.x + (ux * cs + vx * sn * flat) * r, p.y + (uy * cs + vy * sn * flat) * r, p.z + (uz * cs + vz * sn * flat) * r);
            let nx = ux * cs * flat + vx * sn - tx * slope, ny = uy * cs * flat + vy * sn - ty * slope, nz = uz * cs * flat + vz * sn - tz * slope;
            const nl = Math.hypot(nx, ny, nz) || 1; N.push(nx / nl, ny / nl, nz / nl);
            D.push(depth, along, sway, phase); G.push(gain);
          }
          if (i < n - 1) for (let j = 0; j < sides; j++) {
            const q = base + i * sides + j, q2 = base + i * sides + (j + 1) % sides;
            I.push(q, q + sides, q2, q2, q + sides, q2 + sides);
          }
        }
        return b;
      },
      // ellipsoid shell: centre c, radius r across, o.len half-length along o.axis (default r, +Y), o.rings, o.sides
      ball(c, r, o = {}) {
        const ax = o.axis || { x: 0, y: 1, z: 0 }, len = o.len ?? r, rings = o.rings ?? 6, sides = o.sides ?? 8, pts = [], rr = [];
        for (let i = 0; i <= rings; i++) {
          const f = Math.PI * (0.04 + 0.92 * i / rings), h = -Math.cos(f) * len;
          pts.push({ x: c.x + ax.x * h, y: c.y + ax.y * h, z: c.z + ax.z * h }); rr.push(Math.sin(f) * r);
        }
        return b.tube(pts, rr, sides, o);
      },
      build() {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
        g.setAttribute('aData', new THREE.Float32BufferAttribute(D, 4));
        g.setAttribute('aGain', new THREE.Float32BufferAttribute(G, 1));
        g.setIndex(P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
        g.computeBoundingSphere();
        return g;
      },
    };
    return b;
  }
  // camera-facing ribbons for S.line(): r.add(points, width in metres (number | number[]), { sway, phase, depth })
  function ribbons() {
    const P = [], T = [], Sd = [], D = [], I = [];
    const r = {
      get tris() { return I.length / 3; },
      add(pts, width, o = {}) {
        const n = pts.length; if (n < 2) return r;
        const base = P.length / 3, phase = o.phase ?? 0; let along = o.along ?? 0;
        for (let i = 0; i < n; i++) {
          const a = pts[Math.max(i - 1, 0)], c = pts[Math.min(i + 1, n - 1)], p = pts[i];
          let tx = c.x - a.x, ty = c.y - a.y, tz = c.z - a.z; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
          if (i > 0) along += Math.hypot(p.x - a.x, p.y - a.y, p.z - a.z) * (o.alongK ?? 1);
          const hw = 0.5 * (typeof width === 'number' ? width : width[i]);
          const depth = typeof o.depth === 'function' ? o.depth(p) : (o.depth ?? Math.max(0, -p.y));
          const sway = o.sway === undefined ? 0 : (typeof o.sway === 'number' ? o.sway : o.sway[i]);
          for (let s = -1; s <= 1; s += 2) { P.push(p.x, p.y, p.z); T.push(tx, ty, tz); Sd.push(s, hw); D.push(depth, along, sway, phase); }
          if (i < n - 1) { const q = base + i * 2; I.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
        }
        return r;
      },
      build() {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
        g.setAttribute('aTan', new THREE.Float32BufferAttribute(T, 3));
        g.setAttribute('aSide', new THREE.Float32BufferAttribute(Sd, 2));
        g.setAttribute('aData', new THREE.Float32BufferAttribute(D, 4));
        g.setIndex(P.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
        g.computeBoundingSphere();
        return g;
      },
    };
    return r;
  }
  // points for S.points(): rows of [x, y, z, depth, diameter m, twinkle 0..1, phase]
  function pointCloud(rows) {
    const P = new Float32Array(rows.length * 3), D = new Float32Array(rows.length * 4);
    for (let i = 0; i < rows.length; i++) { const r = rows[i], a = i * 3, b = i * 4; P[a] = r[0]; P[a + 1] = r[1]; P[a + 2] = r[2]; D[b] = r[3]; D[b + 1] = r[4]; D[b + 2] = r[5] ?? 0; D[b + 3] = r[6] ?? 0; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aData', new THREE.BufferAttribute(D, 4));
    g.computeBoundingSphere();
    return g;
  }
  // A bulb 1 unit tall, base at the origin, point up (instance it at 0.2-0.3 m): skin + two nested scales as one
  // blue shell geometry, and the folded flower at its heart as a separate gold one.
  function bulbGeometry() {
    const skin = batch(), flower = batch();
    const drop = (b, y0, h, w, rings, sides, twist) => {
      const pts = [], rr = [];
      for (let i = 0; i <= rings; i++) {
        const t = i / rings, s = Math.sin(Math.PI * Math.pow(0.03 + 0.94 * t, 0.62));
        pts.push({ x: twist * Math.sin(t * 3.0) * 0.04, y: y0 + t * h, z: twist * Math.cos(t * 2.0) * 0.03 }); rr.push(w * s);
      }
      b.tube(pts, rr, sides, { depth: 0 });
    };
    drop(skin, 0, 1, 0.40, 5, 6, 0); drop(skin, 0.06, 0.8, 0.29, 3, 5, 1); drop(skin, 0.1, 0.62, 0.19, 2, 4, -1);
    drop(flower, 0.2, 0.42, 0.10, 3, 4, 1);
    return { skin: skin.build(), flower: flower.build() };
  }
  // film: the sky is unexposed film. A plain dome that follows the camera (S.update moves it).
  let dome = null;
  function sky(radius = 900) {
    dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 8),
      new THREE.MeshBasicMaterial({ color: pal.film, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }));
    dome.renderOrder = -10; dome.frustumCulled = false;
    return dome;
  }
  // n crystals in a box [x, y, z] metres that wraps round the camera; they sink at 0.5 m/s and turn on their own axes.
  function crystals(n = 3000, box = [120, 60, 120], rng = ctx.rng) {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const a = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) a.set([rng() * box[0], rng() * box[1], rng() * box[2], rng()], i * 4);
    g.setAttribute('aInst', new THREE.InstancedBufferAttribute(a, 4));
    g.instanceCount = n;
    const m = keep(new THREE.ShaderMaterial({
      vertexShader: CRYSTAL_VS, fragmentShader: CRYSTAL_FS, ...blend(false),
      uniforms: { ...U, uTint: { value: tints.blue }, uDens: { value: 0.5 }, uBox: { value: new THREE.Vector3(...box) },
        uDrift: { value: new THREE.Vector3(0, -0.5, 0) }, uSize: { value: 1 }, uNear: { value: 0 } },
    }));
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
    return mesh;
  }
  const _size = new THREE.Vector2();
  function update(dt, time, camera) {
    U.uTime.value = time;
    if (camera) {
      camera.getWorldPosition(U.uCam.value);
      if (dome) dome.position.copy(U.uCam.value);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(_size); U.uPx.value = 0.5 * Math.max(64, _size.y) * camera.projectionMatrix.elements[5]; }
    }
  }
  return { pal, tints, filmColor: pal.film, uniforms: U, shell, hollow, line, points, sky, crystals, batch, ribbons, pointCloud, bulbGeometry, update, materials: mats };
}

// ---------------------------------------------------------------------------------------------------------------
// The branching generator. It is run twice from the same seeds: once as the crown and once, mirrored through the
// snow line and warped a little (cfg.map), as the roots, so both fork in the same rhythm.
// cfg: { map(p) -> real-space point, clear(realPoint) -> { m: metres outside the flight corridor, ax, ay, az: away },
//        sy: +1 crown / -1 roots, env: { cy, rx, ry }, minR, tubeR }
function growOak(cfg) {
  const tubes = [], twigs = [], tips = [], env = cfg.env;
  let count = 0;
  const stack = [], grow = (...a) => { stack.push(a); };
  async function run(tick) { let i = 0; while (stack.length) { step(...stack.pop()); if (++i % 2 === 0) await tick(); } }
  function step(seed, p, dir, r, gen) {
    const R = makeRng(seed >>> 0);
    const len = 9 * Math.pow(r, 0.55) * R.range(0.75, 1.25) * (gen === 0 ? 1.4 : gen === 1 ? 1.15 : 1);
    const n = r > 0.2 ? 6 : r > 0.05 ? 5 : r > 0.02 ? 4 : 3;
    const seg = len / n, kink = r > 0.2 ? 0.19 : r > 0.04 ? 0.22 : 0.11, up = r < 0.1 ? 0.06 : 0.012;
    const pts = [cfg.map(p)], radii = [r], raw = [p], dirs = [dir];
    let q = p, d = dir, alive = true;
    for (let i = 1; i <= n; i++) {
      let dx = d.x + R.gauss() * kink, dy = d.y + R.gauss() * kink * 0.7 + up, dz = d.z + R.gauss() * kink;
      const h = Math.hypot(q.x, q.z);
      if (h < 3 && h > 1e-3) { dx += (q.x / h) * 0.18; dz += (q.z / h) * 0.18; }
      if (q.y < 3.2) dy += 0.12;                                   // keep clear of the snow line
      const ex = q.x / env.rx, ey = ((q.y - env.cy) / env.ry) * (q.y < env.cy ? 0.5 : 1), ez = q.z / env.rx, e = ex * ex + ey * ey + ez * ez;
      if (e > 0.8) {
        const gx = ex / env.rx, gy = ey / env.ry, gz = ez / env.rx, g = Math.hypot(gx, gy, gz) || 1, k = (e - 0.8) * 1.3;
        dx -= (gx / g) * k; dy -= (gy / g) * k; dz -= (gz / g) * k;
      }
      if (e > 1.0) { alive = false; break; }
      const c0 = cfg.clear(pts[pts.length - 1]);
      if (c0.m < 2.5) { const k = (2.5 - c0.m) * 0.35; dx += c0.ax * k; dy += c0.ay * cfg.sy * k; dz += c0.az * k; }
      const dl = Math.hypot(dx, dy, dz) || 1; d = { x: dx / dl, y: dy / dl, z: dz / dl };
      const nq = { x: q.x + d.x * seg, y: q.y + d.y * seg, z: q.z + d.z * seg }, m = cfg.map(nq);
      if (cfg.clear(m).m < (r > cfg.tubeR ? 0 : -1.2)) { alive = false; break; }
      q = nq; pts.push(m); raw.push(q); dirs.push(d); radii.push(r * (1 - (r > 0.3 ? 0.32 : 0.22) * i / n));
    }
    if (pts.length < 2) return;
    count++;
    const phase = R(), np = pts.length - 1;
    const sway = pts.map((_, i) => Math.min(1, Math.max(0, (0.09 - r) / 0.09)) * (0.3 + 0.7 * i / np));
    if (r >= cfg.tubeR) tubes.push({ pts, radii, sides: r > 0.3 ? 9 : r > 0.1 ? 6 : 4, sway, phase, r });
    else twigs.push({ pts, w: radii.map((x) => Math.max(0.012, x * 2)), sway, phase });
    const rEnd = r * 0.78;
    const child = (s, from, d0, ang, az, cr) => {
      let ax = d0.z, ay = 0, az2 = -d0.x; let al = Math.hypot(ax, az2);
      if (al < 1e-3) { ax = 1; az2 = 0; al = 1; }
      ax /= al; az2 /= al;
      const bx = d0.y * az2 - d0.z * ay, by = d0.z * ax - d0.x * az2, bz = d0.x * ay - d0.y * ax;
      const ca = Math.cos(ang), sa = Math.sin(ang), cz = Math.cos(az), sz = Math.sin(az);
      grow(s, from, { x: d0.x * ca + (ax * cz + bx * sz) * sa, y: d0.y * ca + (ay * cz + by * sz) * sa, z: d0.z * ca + (az2 * cz + bz * sz) * sa }, cr, gen + 1);
    };
    // draw every child's numbers before recursing, so pruning one limb never changes its siblings
    const q1 = R.range(0.5, 0.72), a1 = R.range(0.22, 0.45), a2 = R.range(0.55, 0.95), az = R() * TAU, third = R.chance(0.12);
    const s1 = R() * 4294967296, s2 = R() * 4294967296, s3 = R() * 4294967296, a3 = R.range(0.5, 1.0);
    const lat = [];
    for (let i = 1; i < np; i++) if (R.chance(r > 0.05 ? 0.42 : 0.13)) lat.push([i, R() * 4294967296, R.range(0.7, 1.25), R() * TAU, r > 0.3 ? R.range(0.26, 0.4) : R.range(0.36, 0.5)]);
    if (alive && rEnd > cfg.minR) {
      child(s1, q, d, a1, az, rEnd * Math.sqrt(q1));
      child(s2, q, d, a2, az + Math.PI, rEnd * Math.sqrt(1 - q1));
      if (third) child(s3, q, d, a3, az + Math.PI * 0.5, rEnd * 0.42);
    } else tips.push({ p: pts[np], phase });
    for (const L of lat) if (r * L[4] > cfg.minR) child(L[1], raw[L[0]], dirs[L[0]], L[2], L[3], r * L[4]);
  }
  return { grow, run, tubes, twigs, tips, get count() { return count; } };
}

// Catmull-Rom midpoints: doubles a path so limbs bend instead of kinking
function smoothPath(pts, vals) {
  const n = pts.length, P = [], Vs = vals.map(() => []);
  for (let i = 0; i < n; i++) {
    P.push(pts[i]); vals.forEach((v, k) => Vs[k].push(v[i]));
    if (i === n - 1) break;
    const a = pts[Math.max(i - 1, 0)], b = pts[i], c = pts[i + 1], e = pts[Math.min(i + 2, n - 1)];
    P.push({ x: (-a.x + 9 * b.x + 9 * c.x - e.x) / 16, y: (-a.y + 9 * b.y + 9 * c.y - e.y) / 16, z: (-a.z + 9 * b.z + 9 * c.z - e.z) / 16 });
    vals.forEach((v, k) => Vs[k].push((v[i] + v[i + 1]) / 2));
  }
  return [P, ...Vs];
}

// distance from p to the segment a-b, with the direction away from it
function segClear(p, a, b, rad) {
  const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z, l2 = abx * abx + aby * aby + abz * abz;
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby + (p.z - a.z) * abz) / l2; t = Math.min(1, Math.max(0, t));
  const x = p.x - (a.x + abx * t), y = p.y - (a.y + aby * t), z = p.z - (a.z + abz * t), d = Math.hypot(x, y, z) || 1e-3;
  return { m: d - rad, ax: x / d, ay: y / d, az: z / d };
}

// ---------------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const S = opts.style || makeStyle(ctx, { palette: opts.palette });
  const rng = ctx.rng, detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const tick = async () => { if (ctx.yield) await ctx.yield(); };
  const group = new THREE.Group(); group.name = 'sleeping-hill-oak';
  const V = (x, y, z) => ({ x, y, z });
  const add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; group.add(m); return m; };
  const addPts = (geo, mat) => { const m = new THREE.Points(geo, mat); m.frustumCulled = false; group.add(m); return m; };

  // ---- the dive line: fixed for every seed, so the world can lay its path on it -------------------------------
  // The flight this is built for: come in from +Z along x = +20 (the oak 20 m to the left), orbit LEFT round the trunk
  // at 20 m through 110 degrees, turn in and lift on a 9 m arc through 100 degrees to S0 (8 m up), then dive 60 m dead
  // straight at 50 degrees below level: the snow line is crossed 8 m from the trunk, the bole passes 7 m off on the
  // LEFT 5 m down, and the line ends in the centre of the root loop.
  const dA = 300.5 * Math.PI / 180, d = { x: Math.cos(dA), z: -Math.sin(dA) };
  const lf = { x: d.z, z: -d.x }, rt = { x: -d.z, z: d.x }, cs50 = Math.cos(50 * Math.PI / 180), sn50 = Math.sin(50 * Math.PI / 180);
  const S0 = V(rt.x * 7 - 10.8 * d.x, 8, rt.z * 7 - 10.8 * d.z);
  const D = V(d.x * cs50, -sn50, d.z * cs50), W = V(-d.x * sn50, -cs50, -d.z * sn50);      // dive direction, and "below" it
  const diveAt = (s, r = 0, below = 0) => V(S0.x + D.x * s + rt.x * r + W.x * below, S0.y + D.y * s + W.y * below, S0.z + D.z * s + rt.z * r + W.z * below);
  const Lc = diveAt(60), corA = diveAt(-4), corB = diveAt(58);
  const uu = (deg) => { const a = deg * Math.PI / 180; return { x: Math.sin(a), z: Math.cos(a) }; };
  const turnAt = (g) => { const c = uu(200), e = uu(200 + g), k = g / 100.5; return V(11 * c.x + 9 * e.x, 1.2 + 6.8 * k * k * (3 - 2 * k), 11 * c.z + 9 * e.z); };
  const corC = turnAt(55);
  const chamber = diveAt(24, -5.4, -2.5), sightA = diveAt(3), chTop = V(chamber.x, chamber.y + 0.05, chamber.z);     // the badgers: 5.4 m left of the line, 8.8 m down
  const clear = (p) => {                                          // the flight corridor, the badgers' chamber and the sight line to it from the stoop
    let a = segClear(p, corA, corB, 3.4); const b = segClear(p, corC, S0, 3.0), c = segClear(p, sightA, chamber, 1.2), e = segClear(p, chamber, chTop, 2.9);
    if (b.m < a.m) a = b; if (c.m < a.m) a = c; if (e.m < a.m) a = e;
    return a;
  };

  // ---- per-seed character ----
  const treeSeed = Math.floor(rng() * 4294967296), nz = makeNoise(Math.floor(rng() * 1e9));
  const nLimbs = rng.int(7, 9), az0 = rng() * TAU, lean = { x: rng.range(-0.5, 0.5), z: rng.range(-0.5, 0.5) };
  const env = { cy: 14.2, rx: 14 * rng.range(0.95, 1.03), ry: 12.3 };
  const limbJ = []; for (let i = 0; i < 10; i++) limbJ.push([rng.range(-0.35, 0.35), rng.range(-0.4, 0.4), rng.range(0.9, 1.12), rng.range(-0.12, 0.12)]);
  const trunkY = [0, 0.5, 1.2, 2.2, 3.2, 4.2, 5.0, 5.6], trunkR = [1.24, 1.17, 1.1, 1.03, 1.0, 0.98, 0.9, 0.7];
  const trunkAt = (y) => V(lean.x * (y / 5.6) * (y / 5.6), y, lean.z * (y / 5.6) * (y / 5.6));
  const rootMap = (p) => {                                         // mirror through the snow line, then make it sinuous
    const a = Math.min(1, Math.hypot(p.x, p.z) / 6 + Math.max(0, p.y - 5.6) / 8);
    return V(p.x + a * (1.1 * nz.n3(p.x * 0.16, p.y * 0.16, p.z * 0.16) + 0.4 * nz.n3(p.x * 0.55 + 9, p.y * 0.55, p.z * 0.55)),
      -p.y + a * 0.6 * nz.n3(p.x * 0.2 + 31, p.y * 0.2, p.z * 0.2),
      p.z + a * (1.1 * nz.n3(p.x * 0.16 + 57, p.y * 0.16, p.z * 0.16) + 0.4 * nz.n3(p.x * 0.55, p.y * 0.55 + 17, p.z * 0.55)));
  };
  const minR = 0.021 / detail;
  const halves = [];
  for (let half = 0; half < 2; half++) {
    const oak = growOak({ map: half ? rootMap : (p) => p, clear, sy: half ? -1 : 1, env, minR, tubeR: 0.058 });
    const map = half ? rootMap : (p) => p;
    oak.tubes.push({ pts: trunkY.map((y) => map(trunkAt(y))), radii: trunkR, sides: 18, sway: trunkY.map(() => 0), phase: 0, r: 1.1 });
    const SR = makeRng(treeSeed);
    for (let i = 0; i <= nLimbs; i++) {
      const s = SR() * 4294967296, J = limbJ[i], t = i / (nLimbs - 1);
      if (i === nLimbs) { oak.grow(s, trunkAt(5.2), V(lean.x * 0.3 + J[3] * 2, 1, lean.z * 0.3 - J[0]), 0.56, 1); break; }   // the leader
      const y = 2.7 + 2.5 * t + J[1] * 0.5, az = az0 + i * 2.4 + J[0], el = 0.3 + 0.85 * Math.pow(t, 1.2) + J[3] * 1.5;
      const o = trunkAt(y), r = (0.6 - 0.14 * t) * J[2];
      oak.grow(s, V(o.x + Math.cos(az) * 0.4, y, o.z + Math.sin(az) * 0.4), V(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)), r, 0);
    }
    await oak.run(tick);
    halves.push(oak);
  }
  await tick();

  // ---- wood: outer shells, heartwood shells inside the big limbs, twig and rootlet ribbons ----
  // (round warm oak) THE OAK TAKES THE WARM LIGHT: behind the warm front that spreads from its foot the oak's own wood (the outer shells of bole, limbs and
  // roots, the far drawing of them, and the world's arch root, which is drawn with the roots' material) turns from the film's tone toward amber, so the tree is
  // the second light of the picture; twigs, rootlets and eggs keep the film's tone, and so do the sinker, the loop's ring, its strand and the wreath (mLoop)
  const mCrown = S.shell({ density: 0.065, sway: 0.05, flow: 0.3, thin: [45, 105], warm: [0.7, 0.5, 1, 0] }), mRoot = S.shell({ density: 0.065, sway: 0.08, flow: 0.3, thin: [45, 105], warm: [0.7, 0.5, 1, 0] });
  // sap: as the warmth comes, the heartwood turns amber and slow amber beads climb the bole and run out along limbs, roots and twigs
  const mHeart = S.shell({ density: 0.02, inner: true, beads: 0.8, warm: [0.9, 2.6, 1, 1] }), mHeartL = S.shell({ density: 0.035, inner: true, beads: 0.8, warm: [0.9, 3.4, 1, 1] });      // (the sinker's and the loop's heartwood has its own copy: nothing of the ring clears away in the dive)
  const mTwig = S.line({ density: 0.26, sway: 0.05, flow: 0.35, lod: [130, 160, 260], farMin: 0.07, beads: 0.5, warm: [0, 0, 1, 1] }), mRootlet = S.line({ density: 0.21, sway: 0.08, flow: 0.35, lod: [130, 160, 260], farMin: 0.07, beads: 0.65, warm: [0, 0, 1, 1] });
  // Distance removes insides, then leaves one contour: beyond about 40 m each limb of the tree is also one firm line (trunk and main
  // limbs the brightest, finer ones fainter with their width), so that from the foot of the climb the oak is a drawing with limbs
  // the eye can follow, and the roots are seen lengthening as the film sees deeper. Up close it is not there at all.
  const mSkel = S.line({ tint: 'white', density: 0.5, near: [36, 66, 0], lod: [330, 380, 420], warm: [0.7, 0.3, 1, 0] });      // (lod: whole to 198 m, so the oak is a firm drawing from the brook's first frame: white, and amber where the warm front has reached it)
  mHeart.uniforms.uSharp.value = 0.6; mHeart.uniforms.uDens.value = 0.03; mHeartL.uniforms.uSharp.value = 0.6; mHeartL.uniforms.uDens.value = 0.05;
  const heartB = S.batch(), tips = [];
  for (let half = 0; half < 2; half++) {
    const oak = halves[half]; let b = S.batch(), rb = S.ribbons(); const sk = S.ribbons();      // flushed in pieces so that no single build() call is a long step
    for (let i = 0; i < oak.tubes.length; i++) {
      const t = oak.tubes[i];
      if (t.r > 0.14) [t.pts, t.radii, t.sway] = smoothPath(t.pts, [t.radii, t.sway]);
      if (half && t.r > 0.36 && t.r < 1) [t.pts, t.radii, t.sway] = smoothPath(t.pts, [t.radii, t.sway]);      // the great limbs bend as grown wood: no corner is left to see when one passes the lens
      b.tube(t.pts, t.radii, t.sides, { sway: t.sway, phase: t.phase, gain: Math.min(2.4, Math.sqrt(t.r / 0.1) - 1) });
      if (t.r > 0.085) sk.add(t.pts, t.radii.map((x) => x * (t.r > 1 ? 1.1 : 1.7)), { sway: t.sway, phase: t.phase });
      if (t.r > 0.19 && t.r < 1) heartB.tube(t.pts, t.radii.map((x) => x * 0.4), 5, { phase: t.phase, gain: Math.min(2.4, Math.sqrt(t.r / 0.1) - 1) });      // the heartwood: a rounded thread, never a flat strip
      if (i % 2 === 1) await tick();
      if (b.tris > 13000) { add(b.build(), half ? mRoot : mCrown); b = S.batch(); await tick(); }
    }
    for (let i = 0; i < oak.twigs.length; i++) {
      const t = oak.twigs[i];
      rb.add(t.pts, t.w, { sway: t.sway, phase: t.phase });
      if (i % 10 === 9) await tick();
      if (rb.tris > 9000) { add(rb.build(), half ? mRootlet : mTwig); rb = S.ribbons(); await tick(); }
    }
    if (b.tris) add(b.build(), half ? mRoot : mCrown);
    await tick();
    add(sk.build(), mSkel);
    await tick();
    if (rb.tris) add(rb.build(), half ? mRootlet : mTwig);
    await tick();
    if (!half) for (const t of oak.tips) tips.push(t);
  }
  add(heartB.build(), mHeart);
  await tick();

  // ---- fourteen growth rings: nested tubes right through the bole, crown side and root side, with sap beads ----
  let mRing;
  {
    const axis = [], rad = [];
    for (let i = trunkY.length - 1; i > 0; i--) { axis.push(rootMap(trunkAt(trunkY[i]))); rad.push(trunkR[i]); }
    for (let i = 0; i < trunkY.length; i++) { axis.push(trunkAt(trunkY[i])); rad.push(trunkR[i]); }
    const ap = axis, ar = rad, b = S.batch();
    for (let k = 1; k <= 14; k++) {
      const f = Math.pow(k / 15, 0.85), ph = rng();
      b.tube(ap, ar.map((r, i) => r * f * (1 + 0.03 * Math.sin(i * 0.46 + k * 1.7))), 16, { phase: ph, depth: (p) => Math.max(0, -p.y - 1), gain: k % 3 === 2 ? 2.1 : -0.4 });
    }
    mRing = S.shell({ density: 0.021, inner: true, beads: 0.6, lod: [70, 150, 260], warm: [0.7, 1.0, 1, 0.01] });
    add(b.build(), mRing);
    await tick();
  }

  // ---- the sinker root and the loop it has grown into ----
  let mLoop;
  const loopR = 8;
  const loopAt = (f, out = 0, along = 0) => {
    const c = Math.cos(f), s = Math.sin(f), R = loopR + out;
    return V(Lc.x + (rt.x * c + W.x * s) * R + D.x * along, Lc.y + W.y * s * R + D.y * along, Lc.z + (rt.z * c + W.z * s) * R + D.z * along);
  };
  {
    const b = S.batch(), hb = S.batch(), rb = S.ribbons();
    let ctl = [trunkAt(0), V(0.1, -5, 0.2), V(-1.6, -9.6, 1.6), diveAt(26, 0.6, 5.5),      // (one sweep from the bole to the ring: no S-bend under the bole)
      diveAt(34, 3.3, 3.0), diveAt(42, 4.4, 1.2), diveAt(51, 5.6, 0.2), diveAt(57, 7.2, 0), diveAt(60, loopR, 0)];
    let rr = [0.5, 0.5, 0.46, 0.38, 0.33, 0.33, 0.36, 0.42, 0.5];
    [ctl, rr] = smoothPath(ctl, [rr]); [ctl, rr] = smoothPath(ctl, [rr]);
    rr = rr.map((r, i) => r * (1 + 0.22 * nz.n2(i * 0.45, 3.3)));
    ctl = ctl.map((p, i) => { const a = Math.min(1, i / 8) * Math.min(1, (ctl.length - 1 - i) / 6) * 0.3; return V(p.x + a * nz.n2(i * 0.3, 11), p.y + a * 0.5 * nz.n2(i * 0.3, 23), p.z + a * nz.n2(i * 0.3, 37)); });
    // (the tube is drawn through a relaxed copy of that line: it sweeps into the ring as grown wood, with no corner)
    let sc = ctl.map((p) => V(p.x, p.y, p.z)), sr = rr;
    for (let it = 0; it < 3; it++) sc = sc.map((p, i) => { if (i === 0 || i === sc.length - 1) return p; const a = sc[i - 1], c = sc[i + 1]; return V((a.x + 2 * p.x + c.x) / 4, (a.y + 2 * p.y + c.y) / 4, (a.z + 2 * p.z + c.z) / 4); });
    [sc, sr] = smoothPath(sc, [sr]);
    b.tube(sc, sr, 8, { gain: 0.9, phase: 0.3 }); hb.tube(sc, sr.map((r) => r * 0.38), 8, {});      // the sinker's heartwood: one rounded thread a third of its width
    // rootlets off the sinker: short, drooping, swaying
    for (let i = 10; i < ctl.length - 3; i += 2) {
      const p = ctl[i], a = rng() * TAU, L = rng.range(1.2, 3.2), pts = [], w = [], sw = [];
      for (let j = 0; j <= 4; j++) { const t = j / 4; pts.push(V(p.x + Math.cos(a) * L * t, p.y - L * (0.25 * t + 0.5 * t * t), p.z + Math.sin(a) * L * t)); w.push(0.05 * (1 - 0.8 * t)); sw.push(t); }
      if (clear(pts[4]).m > -0.4) rb.add(pts, w, { sway: sw, phase: rng() });
    }
    // the loop: a closed ring of root 16 m across, a second strand wound round it, a fringe of hair roots outside
    const ring = [], ringR = [], strand = [], N = 64;
    for (let i = 0; i <= N; i++) {
      const f = (i / N) * TAU;
      ring.push(loopAt(f, 0.15 * nz.n2(Math.cos(f) * 1.5, Math.sin(f) * 1.5)));
      ringR.push(0.5 * (1 + 0.16 * nz.n2(Math.cos(f) * 2 + 7, Math.sin(f) * 2)));
    }
    for (let i = 0; i <= N * 2; i++) { const f = (i / (N * 2)) * TAU; strand.push(loopAt(f, 0.62 * Math.cos(f * 7), 0.62 * Math.sin(f * 7))); }
    b.tube(ring, ringR, 8, { gain: 1.5 }); hb.tube(ring, ringR.map((r) => r * 0.72), 6, {}); hb.tube(ring, ringR.map((r) => r * 0.45), 6, {}); hb.tube(ring, ringR.map((r) => r * 0.2), 4, {});
    b.tube(strand, 0.13, 4, { gain: 0.3 });
    // a wreath outside it: two finer roots wound round each other three metres out, each with its warm core, so that from the
    // top of the dive the loop is a third of the frame and not a coin
    for (let k = 0; k < 2; k++) {
      const wp = [], wr = [], M = 72;
      for (let i = 0; i <= M; i++) { const f = (i / M) * TAU, ph = f * 5 + k * Math.PI; wp.push(loopAt(f, 3.3 + 0.75 * Math.cos(ph) + 0.3 * nz.n2(Math.cos(f) * 2 + 3 * k, Math.sin(f) * 2), 0.75 * Math.sin(ph))); wr.push(0.3 * (1 + 0.25 * nz.n2(Math.cos(f) * 3 + 9, Math.sin(f) * 3 + 5 * k))); }
      b.tube(wp, wr, 5, { gain: 1.3, phase: 0.2 + 0.4 * k }); hb.tube(wp, wr.map((r) => r * 0.5), 4, {});
    }
    for (let i = 0; i < 90; i++) {
      const f = rng() * TAU, L = rng.range(0.8, 2.6), tw = rng.range(-1.5, 1.5), pts = [], w = [], sw = [];
      for (let j = 0; j <= 4; j++) { const t = j / 4; pts.push(loopAt(f + 0.03 * tw * t * t, 0.5 + L * t, tw * t * t)); w.push(0.04 * (1 - 0.8 * t)); sw.push(t); }
      rb.add(pts, w, { sway: sw, phase: rng() });
    }
    mLoop = S.shell({ density: 0.06 }); add(b.build(), mLoop); add(hb.build(), mHeartL); add(rb.build(), mRootlet);
    await tick();
  }

  // ---- the snow line: one thin skin, clear from above and a bright thread edge-on (opts.snow === false to omit) ----
  if (opts.snow !== false) {
    const b = S.batch(), rings = 14, sides = 40, Rs = [];
    for (let i = 0; i <= rings; i++) Rs.push(1.3 + 44 * Math.pow(i / rings, 1.4));
    const P = [], N = [], Dd = [], G = [], I = [];
    for (let i = 0; i <= rings; i++) for (let j = 0; j < sides; j++) {
      const a = (j / sides) * TAU, x = Math.cos(a) * Rs[i], z = Math.sin(a) * Rs[i], y = 0.12 * nz.n2(x * 0.07, z * 0.07) * Math.min(1, Rs[i] / 8);
      P.push(x, y, z); N.push(0, 1, 0); Dd.push(0, Rs[i], 0, 0); G.push(-Math.pow(i / rings, 2));
      if (i < rings) { const q = i * sides + j, q2 = i * sides + (j + 1) % sides; I.push(q, q + sides, q2, q2, q + sides, q2 + sides); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('aData', new THREE.Float32BufferAttribute(Dd, 4)); g.setAttribute('aGain', new THREE.Float32BufferAttribute(G, 1)); g.setIndex(I);
    add(g, S.shell({ density: 0.014, edge: 0.02, sharp: true }));
  }

  // ---- gold, for seeds, eggs and folded flowers only ----
  const mGoldPts = S.points({ tint: 'gold', density: 1.0, glow: true, lod: [60, 70, 150], min: [1.3, 0.2], warm: [0, 0, 0, 0.3] });   // eggs: gone before the crown is
  {
    // butterfly eggs: one at the base of a winter bud, on a few hundred of the crown's twig tips
    const rows = [], want = Math.round(520 * detail), step = Math.max(1, Math.floor(tips.length / want));
    for (let i = 0; i < tips.length; i += step) { const t = tips[i]; rows.push([t.p.x, t.p.y, t.p.z, 0, 0.1, 0.5, t.phase]); }
    // the crown carries gold: every winter bud the line above steps over has its egg too, half as large again (0.15 m against 0.10 m), in the same cloud (no dice)
    for (let i = 0; i < tips.length; i++) { if (i % step === 0) continue; const t = tips[i]; rows.push([t.p.x, t.p.y, t.p.z, 0, 0.15, 0.5, t.phase]); }
    addPts(S.pointCloud(rows), mGoldPts);
  }
  await tick();
  const nBulb = Math.round((opts.bulbs ?? 130) * detail);
  if (nBulb > 0) {
    // bulbs just under the snow, spreading away on every side: skin and scales in blue, the folded flower in gold
    const bg = S.bulbGeometry(), inst = new Float32Array(nBulb * 4), rows = [], M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    const skin = new THREE.InstancedMesh(bg.skin, S.shell({ density: 0.045, inner: true, lod: [26, 150, 260] }), nBulb), flower = new THREE.InstancedMesh(bg.flower, S.shell({ tint: 'gold', density: 0.22, glow: true }), nBulb);
    for (let i = 0; i < nBulb; i++) {
      let p, tries = 0;
      do { const a = rng() * TAU, r = 2.6 + 33 * Math.pow(rng(), 0.8); p = V(Math.cos(a) * r, -rng.range(1.25, 2.0), Math.sin(a) * r); } while (clear(p).m < -2.3 && ++tries < 8);
      const sc = rng.range(0.2, 0.3);
      e.set(rng.range(-0.35, 0.35), rng() * TAU, rng.range(-0.35, 0.35)); q.setFromEuler(e);
      M.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(sc, sc, sc));
      skin.setMatrixAt(i, M); flower.setMatrixAt(i, M);
      inst.set([-p.y - 0.4, rng(), 0, 0], i * 4);
      rows.push([p.x, p.y + sc * 0.42, p.z, -p.y - 0.4, 0.12, 0.4, rng()]);
    }
    for (const m of [skin, flower]) { m.geometry.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 4)); m.frustumCulled = false; group.add(m); }
    addPts(S.pointCloud(rows), mGoldPts);
    await tick();
  }
  // two acorn hoards, forty gold acorns each: the jay's near the surface, the mice's among the roots in a small chamber
  const jayAt = diveAt(12.6, 1.9, 0.9), mouseAt = diveAt(29.5, -2.4, 1.4);
  {
    const ab = S.batch();
    ab.ball(V(0, 0, 0), 0.5, { len: 0.8, rings: 4, sides: 6, depth: 0 }); ab.ball(V(0, 0.52, 0), 0.56, { len: 0.34, rings: 3, sides: 6, depth: 0 });
    const n = 80, inst = new Float32Array(n * 4), M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    const acorns = new THREE.InstancedMesh(ab.build(), S.shell({ tint: 'gold', density: 0.2, glow: true, far: [5, 11, 0.9] }), n);      // seen edge-on from the swing, 12 m off, forty glowing acorns add up to a white tile: they dim with distance
    for (let i = 0; i < n; i++) {
      const c = i < 40 ? jayAt : mouseAt, j = i % 40, a = j * 2.4 + rng() * 0.5, r = 0.085 * Math.sqrt(j + 0.5) * (i < 40 ? 1 : 0.8);
      const p = V(c.x + Math.cos(a) * r, c.y + (i < 40 ? rng.range(-0.08, 0.08) : 0.22 * (1 - j / 40) * rng.range(0.5, 1.5)), c.z + Math.sin(a) * r);
      e.set(rng() * TAU, rng() * TAU, rng() * TAU); q.setFromEuler(e);
      const sc = rng.range(0.085, 0.11);
      M.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(sc, sc, sc)); acorns.setMatrixAt(i, M);
      inst.set([-p.y, rng(), 0, 0], i * 4);
    }
    acorns.geometry.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 4)); acorns.frustumCulled = false; group.add(acorns);
  }

  await tick();
  // ---- the sleepers: three badgers in a chamber between two roots, five dormice in a hollow of the bole ----
  const bodyB = S.batch(), boneB = S.batch(), boneR = S.ribbons(), hearts = [];
  const lerpProf = (prof, a) => { let i = 0; while (i < prof.length - 2 && prof[i + 1][0] < a) i++; const p = prof[i], q = prof[i + 1]; return p[1] + (q[1] - p[1]) * Math.min(1, Math.max(0, (a - p[0]) / (q[0] - p[0]))); };
  const PROF = [[0, 0.09], [0.25, 0.25], [0.6, 0.33], [0.95, 0.29], [1.4, 0.45], [2.0, 0.52], [2.7, 0.56], [3.4, 0.52], [4.0, 0.36], [4.4, 0.16], [4.8, 0.09], [5.2, 0.04]];
  // one animal curled nose to tail, lying in a ring of radius s about c; simple = a dormouse (fewer bones)
  function curled(c, s, yaw, tilt, simple) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), depth = -c.y, ph = rng();
    const at = (a, out = 0, up = 0) => {
      const rho = s * (1 - 0.13 * a / 5.2) + out * s, x = Math.cos(a) * rho, z = Math.sin(a) * rho;
      return V(c.x + x * cy - z * sy, c.y + up * s + tilt * x, c.z + x * sy + z * cy);
    };
    const nb = simple ? 12 : 20, body = [], br = [], bw = [];
    for (let i = 0; i <= nb; i++) { const a = 5.2 * i / nb; body.push(at(a)); br.push(lerpProf(PROF, a) * s); bw.push(Math.exp(-(a - 2.1) * (a - 2.1) / 0.9)); }
    bodyB.tube(body, br, simple ? 6 : 9, { depth, sway: bw, phase: ph, up: V(0, 1, 0) });
    if (!simple) bodyB.ball(at(2.0, -0.04), 0.3 * s, { len: 0.42 * s, axis: V(-Math.sin(2.0 + yaw), 0, Math.cos(2.0 + yaw)), depth, sway: 1, phase: ph, rings: 5, sides: 6 });   // lungs
    // skull and snout, spine along the back as a beaded tube, tail
    boneB.tube([at(0.5, 0.05), at(0.3, 0.03), at(0.08, 0)], [0.17 * s, 0.2 * s, 0.07 * s], 6, { depth, gain: 0.4 });
    boneB.tube([at(0.3, 0.02), at(0.12, 0), at(-0.08, -0.03)], [0.09 * s, 0.1 * s, 0.045 * s], 5, { depth });
    const nv = simple ? 14 : 26, sp = [], sr = [];
    for (let i = 0; i <= nv; i++) { const a = 0.6 + 3.8 * i / nv; sp.push(at(a, lerpProf(PROF, a) * 0.55)); sr.push(s * (i % 2 ? 0.05 : 0.028)); }
    boneB.tube(sp, sr, 4, { depth });
    boneR.add([at(4.4, 0.1), at(4.7, 0.04), at(5.0, 0.01), at(5.25, 0)], 0.035 * s, { depth, phase: ph });
    // ribs: hoops hung from the spine, open at the belly
    const nr = simple ? 5 : 9;
    for (let k = 0; k < nr; k++) {
      const a = 1.15 + 1.4 * k / (nr - 1), rr = lerpProf(PROF, a) * 0.8, pts = [];
      for (let j = -4; j <= 4; j++) { const f = j * 0.62; pts.push(at(a + 0.05 * Math.abs(j), Math.cos(f) * rr, Math.sin(f) * rr)); }
      boneR.add(pts, 0.03 * s, { depth, sway: 1, phase: ph });
    }
    // folded legs: hind leg tucked under, foreleg reaching over the nose
    boneR.add([at(3.7, 0.2), at(3.55, -0.2), at(3.2, -0.42), at(3.45, -0.5)], 0.045 * s, { depth, phase: ph });
    boneR.add([at(1.25, 0.18), at(1.3, -0.25), at(0.85, -0.42), at(0.3, -0.2, 0.12)], 0.045 * s, { depth, phase: ph });
    hearts.push({ p: at(1.7, -0.05), r: (simple ? 0.2 : 0.12) * s, depth, phase: rng() });      // a badger's heart is a warm point no larger than its skull
  }
  const chY = chamber.y, chD = -chamber.y;
  {
    bodyB.ball(chamber, 2.3, { len: 1.1, rings: 8, sides: 14, depth: chD, gain: 0.0 });
    // the sett tunnel: in from the hillside and on toward the next chamber
    const tun = [], a0 = Math.atan2(chamber.z, chamber.x) + rng.range(-0.5, 0.5);        // out, away from the bole
    for (let i = 0; i <= 12; i++) { const t = i / 12, a = a0 + 1.2 * t; tun.push(V(chamber.x + Math.cos(a) * (2.0 + 11 * t), chY + 5.2 * t * t + 0.3 * Math.sin(t * 9), chamber.z + Math.sin(a) * (2.0 + 11 * t))); }
    bodyB.tube(tun, 0.3, 7, {});
    const yaw0 = rng() * TAU;
    for (let i = 0; i < 3; i++) {
      const a = yaw0 + i * TAU / 3;
      curled(V(chamber.x + Math.cos(a) * 1.14, chY - 0.45, chamber.z + Math.sin(a) * 1.14), rng.range(0.44, 0.5) * 1.42, a + rng.range(1.2, 2.4), rng.range(-0.15, 0.15), false);
    }
    for (let i = 0; i < 46; i++) {                                     // the bed of dry bracken: fine crossed lines
      const a = rng() * TAU, r = 1.8 * Math.sqrt(rng()), b2 = rng() * TAU, L = rng.range(0.16, 0.44), x = chamber.x + Math.cos(a) * r, z = chamber.z + Math.sin(a) * r, y = chY - 0.92 + 0.12 * rng();
      boneR.add([V(x - Math.cos(b2) * L, y, z - Math.sin(b2) * L), V(x, y + 0.04, z), V(x + Math.cos(b2) * L, y, z + Math.sin(b2) * L)], 0.007, { depth: chD });
    }
    const hollow = V(rt.x * 1.25, -2.4, rt.z * 1.25);
    bodyB.ball(hollow, 0.82, { len: 0.56, rings: 6, sides: 10, depth: 2.4 });
    for (let i = 0; i < 5; i++) {
      const a = i * 1.257 + rng() * 0.4, r = i === 0 ? 0 : 0.47;
      curled(V(hollow.x + Math.cos(a) * r, -2.6 + (i % 2) * 0.2, hollow.z + Math.sin(a) * r), 0.18, rng() * TAU, rng.range(-0.3, 0.3), true);
    }
    // the hollow itself is an absence of wood: the bole is darker there, and the five hearts show in it from the swing
    add(S.batch().ball(hollow, 1.25, { len: 0.85, rings: 7, sides: 12, depth: 2.4 }).build(), S.hollow(0.82)).renderOrder = 5;
    add(bodyB.build(), S.shell({ density: 0.065, breath: 0.02 })).renderOrder = 6;
    add(boneB.build(), S.shell({ tint: 'white', density: 0.34 })).renderOrder = 6;
    add(boneR.build(), S.line({ tint: 'white', density: 0.9, sway: 0.003 })).renderOrder = 6;
    const hg = S.batch().ball(V(0, 0, 0), 1, { rings: 5, sides: 8, depth: 0 }).build(), inst = new Float32Array(hearts.length * 4), M = new THREE.Matrix4();
    const hm = new THREE.InstancedMesh(hg, S.shell({ tint: 'heart', density: 0.42, glow: true, pulse: true }), hearts.length);
    hearts.forEach((h, i) => { M.makeScale(h.r, h.r, h.r).setPosition(h.p.x, h.p.y, h.p.z); hm.setMatrixAt(i, M); inst.set([h.depth, h.phase, 0, 0], i * 4); });
    hg.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 4)); hm.frustumCulled = false; hm.renderOrder = 6; group.add(hm);
    // (the dormice's five have a least size of their own: they are read in the bole's hollow from the whole swing)
    addPts(S.pointCloud(hearts.filter((h) => h.r < 0.05).map((h) => [h.p.x, h.p.y, h.p.z, h.depth, 0.3, 0, h.phase])), S.points({ tint: 'heart', density: 1.2, glow: true, pulse: true, min: [5, 1], warm: [0, 0.3, 0, 0.3] })).renderOrder = 6;
    addPts(S.pointCloud(hearts.filter((h) => h.r >= 0.05).map((h) => [h.p.x, h.p.y, h.p.z, h.depth, Math.max(0.15, h.r * 2.6), 0, h.phase])), S.points({ tint: 'heart', density: 1.0, glow: true, pulse: true, min: [3.4, 0.8], warm: [0, 0.3, 0, 0.3] })).renderOrder = 6;
    await tick();
  }

  let pen = 60;
  const v3 = (p) => new THREE.Vector3(p.x, p.y, p.z);
  const fly = [V(20, 2, 80), V(20, 1.6, 40)];
  for (let a = 90; a <= 200; a += 22) fly.push(V(uu(a).x * 20, 1.2, uu(a).z * 20));
  for (const g of [25, 50, 75]) fly.push(turnAt(g));
  for (let s2 = 0; s2 <= 60; s2 += 10) fly.push(diveAt(s2));
  for (let i = 0; i < fly.length; i++) fly[i] = v3(fly[i]);
  const center = new THREE.Vector3(0, -2, 0);
  return {
    object: group, radius: 20, height: 26, center, ground: false, groundY: 0, style: S,
    rootMat: mRoot, rootletMat: mRootlet,      // the dive: the world sets rootMat.uniforms.uNearF (x, y metres) and rootletMat.uniforms.uNearW so the root mass never fogs the lens
    crownMat: mCrown, twigMat: mTwig, heartMat: mHeart, loopHeartMat: mHeartL, loopMat: mLoop, ringMat: mRing,      // round five: the same controls for the crown (uNearF, uNearW, uDens) on the close pass; the heartwood's and the growth rings' materials
    skeleton: mSkel,      // the far drawing's material: the world may raise uniforms.uDens (0.5) and uWScale (1) while the oak is far off
    anchors: {
      // all local space. The loop is a ring of root of radius 8 whose axis is the dive direction.
      portalSeat: { position: v3(Lc), normal: v3(D).negate(), radius: 7, pitchDeg: -50 },      // normal faces the arriving camera
      loop: { center: v3(Lc), axis: v3(D), radius: 8 },
      dive: { start: v3(S0), dir: v3(D), length: 60, snowEntry: v3(diveAt(8 / sn50)) },           // dead straight, 3.4 m kept clear of roots
      orbit: { center: new THREE.Vector3(0, 1.2, 0), radius: 20, fromDeg: 90, toDeg: 200 },      // point = (sin a, 0, cos a) * 20, a rising = turning left
      flyThrough: fly,                                                                            // approach, orbit, turn-in and lift, dive, loop
      viewpoints: { whole: new THREE.Vector3(Math.sin(2.4) * 20, 0.4, Math.cos(2.4) * 20), lookAt: new THREE.Vector3(0, 0, 0) },
      badgers: v3(chamber), dormice: new THREE.Vector3(rt.x * 1.25, -2.4, rt.z * 1.25), jayHoard: v3(jayAt), mouseHoard: v3(mouseAt),
      hearts: hearts.map((h) => v3(h.p)),
    },
    setProgress(p) { pen = 1 + 59 * Math.min(1, Math.max(0, p)); S.uniforms.uPen.value = pen; },   // 0 = 1 m (bare snow) .. 1 = 60 m (the tree whole)
    setPenetration(m) { pen = m; S.uniforms.uPen.value = m; },
    update(dt, time, camera) { S.update(dt, time, camera); },
    dispose() {},
  };
}
