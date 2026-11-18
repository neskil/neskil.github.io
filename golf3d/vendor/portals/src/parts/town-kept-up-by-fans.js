// The Town Kept Up by Fans: hero set piece (the keep, a 150 m bouncy castle that loses pressure and is
// pumped back) and the STYLE KIT of the whole world (sewn ripstop inflatables, flat switch on).
//
// ---------------------------------------------------------------------------------------------------
// STYLE KIT   const style = makeStyle(ctx, { palette?, sun? })      (one instance, shared by the world)
//   style.pal            linear THREE.Color: red, yellow, blue, green, white, pink, sky, tarp, web (+ the shade tones)
//   style.CLOTH          cloth indices for geometry: RED 0, YELLOW 1, BLUE 2, GREEN 3, WHITE 4, PINK 5,
//                        WHITE_ON_BLUE 6 (white whose shade takes a tenth of blue), WEB 7 (black webbing, no sheen)
//   style.uniforms       shared: uTime, uSun (WORLD space, toward the sun), uWind (xz, where the wind blows TO),
//                        uGust (xyz = front direction x, z and speed m/s; w = period s), uShadowY, uSheen,
//                        uHaze (THE AIR: rgb the tone far cloth, washes and floor go toward, w how far at most; 0 until the world sets it);
//                        style.post = the post block the world returns (flat 1, no bloom, neutral grade)
//   style.skin(o)        THE skin ShaderMaterial (unlit, three tones + sheen bar + seams + pucker + ripstop; beyond 150 m the air over them).
//                        o.bodies = N : pressure state per body from uniform arrays (the keep; see BODY ARRAYS)
//                        o.instanced  : pressure state per instance (iBody, iState attributes; see INSTANCES)
//                        o.shadow     : the same vertex code flattened onto y = uShadowY along the sun, drawn
//                                       laid on the floor as a clean pastel of the caster's cloth, once a pixel: the tinted shadow
//                        o.streamer   : ribbons that hang from a deformed root point (streamers, fringes)
//   style.ground()       tarpaulin material (#DDE6D0): stitched seams every 12 m along z, laced with eyelets, cross seams every
//                        24 m, sewn patches, lane tape down both avenues (uniform uLaneB = far avenue origin x, z and direction x, z); beyond 150 m the air, by the skin's law
//   style.web()          flat black webbing (MeshBasicMaterial; no line uses it: pegs, drums and the big fan's hoops are cloth WEB in the batch; the strap, the bunting strings and the windsock fishes' mouth hoops are cloth 7.6; the hoses the carts' yellow cloth)
//   style.quilt(batch,o) the pillow-panel surface builder every body is made with (see QUILT); quiltY(batch,o,ctx)
//                        is the same in slices with a yield between; tube / pillow / ball / airDancer are made with it
//   style.batch()        vertex batcher -> .geometry()
//   style.ribbon(batch,pts,width,cloth) a flat ribbon of constant world width; style.strap(batch,a,b,o) THE STRAP: every guy line,
//                        tether and pole (webbing style.STRAP m wide, taut from a D-ring on the body to a peg); style.hose a round hose
//   skin({ streamer: true }) materials own uStream (0..1, how far the wind holds the ribbons out) and uStreamK (fan, ripple, twist)
//   style.update(dt, time, camera)      drives uTime (call once a frame; buildHero does NOT call it when
//                        the world passes its own style in opts.style)
// Rules of the styleNote and where they live:
//   six cloths, flat colours   -> uLit[] / uShade[] tables, written straight to gl_FragColor (post.flat = 1), beyond 150 m mixed toward the air's tone first
//   bulge between seams        -> quilt(): every panel is its own grid pushed out along a pillow profile with
//                                 analytic normals, vertices are NOT shared across a seam (crease, scallop)
//   seam = the only line       -> aSeam (metres to the nearest seam) -> two stitch rows, fwidth, 1.5 px floor,
//                                 gone beyond 250 m; pucker within 30 cm, deeper as pressure falls
//   shadow on a skin = richer  -> uShade[] (red #C41F2A, yellow #F5A800 ...), chosen by a soft step on n.l
//   shadow on the ground       -> skin({shadow:true}) copy, colour of the caster (beyond 150 m the air over it)
//   one sheen bar per panel    -> one band of the pillow normal against the highlight vector
//   under-inflation, motion    -> PRESSURE in the vertex shader: p scales the section, sinks the height,
//                                 wrinkles; kink = a hinge on the spine; lean; tip droop; breathing 2 %
// ---------------------------------------------------------------------------------------------------
// HERO   const hero = await buildHero(ctx, { style?, palette?, detail?, apron?, cap? })
//   (continued at buildHero below: size, anchors, timeline, cost)
import * as THREE from 'three';
import { clamp, lerp, smoothstep, saturate } from '../kit/core.js';

export const PALETTE = ['#E5352B', '#FFC928', '#1F5FD0', '#2FA85A', '#F7F5EE', '#F0509A', '#6FA8E8'];
const CLOTH = { RED: 0, YELLOW: 1, BLUE: 2, GREEN: 3, WHITE: 4, PINK: 5, WHITE_ON_BLUE: 6, WEB: 7 };
const MAXB = 40; // bodies in the uniform arrays
const WASH = 0.86;   // how strongly a tinted shadow is laid on the tarpaulin: the print under it keeps the rest
export const PLAZA = { x: 0, z: 300, ring: 17 };   // the plaza before the keep: the centre of its pitch ring (world x, z) and the ring's radius, metres

// ---- GLSL: pressure (shared by every variant) -----------------------------------------------------
const GLSL_DEFORM = /* glsl */`
uniform float uTime; uniform vec3 uSun; uniform vec2 uWind; uniform vec4 uGust; uniform float uShadowY;
uniform float uClock; uniform float uGustT; uniform vec4 uOut;   // script clock (births), gust clock, the breath out: x = clock when every fan stops, y = seconds stopped, z = speed of the front that restarts them, w = where along the wind it starts
vec3 rotA(vec3 v, vec3 a, float ang){ float c = cos(ang), s = sin(ang); return v*c + cross(a, v)*s + a*dot(a, v)*(1.0 - c); }
// rel: rest position relative to the body's foot. H height, dir fold direction (unit xz), kh hinge height 0..1,
// sinkMin height kept at p = 0, mask which of x,z is "section" (1,1 tube; 0,1 or 1,0 wall), rs0 section scale at p = 0.
// st = (p, kink radians, lean radians, tip radians). Returns the deformed rel; nrm is turned with it.
vec3 inflate(vec3 rel, inout vec3 nrm, float H, vec2 dir, float kh, float sinkMin, vec2 mask, float rs0, vec4 st, float ph, out float soft){
  float p = st.x; soft = 1.0 - min(p, 1.0);
  float hn = clamp(rel.y / max(H, 1e-3), 0.0, 1.2);
  float breathe = 1.0 + 0.02 * sin(uTime * (1.3 + 0.7 * fract(ph * 0.37)) + ph * 6.283) * min(p, 1.0);
  float rs = mix(rs0, 1.0, min(p, 1.0)) * breathe * (1.0 + 2.0 * max(p - 1.0, 0.0));
  // under-inflation: the section goes slack toward the top first (tips sag)
  rs *= 1.0 - 0.35 * soft * hn * step(0.5, mask.x * mask.y);
  rel.xz *= mix(vec2(1.0), vec2(rs), mask);
  float sy = mix(sinkMin, 1.0, min(p, 1.0)) * (1.0 + 0.6 * max(p - 1.0, 0.0));
  rel.y *= sy; float Hs = H * sy;
  // deep wrinkles of a slumped skin: folds that travel across it as it sinks
  float wr = sin(rel.y * 0.9 + 2.5 * sin((rel.x + rel.z) * 0.21 + ph * 9.0) + ph * 40.0);
  // pushed along a direction that is the same on both sides of a seam (out from the spine), so panels never part
  vec2 rd = rel.xz * mask; vec3 wdir = mask.x + mask.y > 0.5 ? vec3(rd.x, 0.0, rd.y) / max(length(rd), 1.5) : vec3(0.0, 1.0, 0.0);
  rel += wdir * (soft * 1.1 * wr * smoothstep(0.0, 0.12, hn));
  nrm.y += soft * 0.9 * cos(rel.y * 0.9 + 2.5 * sin((rel.x + rel.z) * 0.21 + ph * 9.0) + ph * 40.0);
  vec3 ax = vec3(dir.y, 0.0, -dir.x);
  // tip droop: the last quarter hangs
  float t2 = smoothstep(0.77 * Hs, 0.91 * Hs, rel.y); float a2 = st.w * t2;
  vec3 pv2 = vec3(0.0, 0.83 * Hs, 0.0);
  rel = pv2 + rotA(rel - pv2, ax, a2); nrm = rotA(nrm, ax, a2);
  // the kink: a hinge at kh that turns everything above it and pinches the section to a quarter
  float hk = kh * Hs, w = 0.06 * Hs + 0.5;
  float t1 = smoothstep(hk - w, hk + w, rel.y); float a1 = st.y * t1;
  float e = (rel.y - hk) / w; float pinch = 1.0 - 0.75 * clamp(abs(st.y) * 1.2, 0.0, 1.0) * exp(-e * e);
  rel.xz *= mix(vec2(1.0), vec2(pinch), mask);
  vec3 pv1 = vec3(0.0, hk, 0.0);
  rel = pv1 + rotA(rel - pv1, ax, a1); nrm = rotA(nrm, ax, a1);
  // lean from the foot, a little more with height (a soft tower leans until it is pumped up)
  float a0 = st.z * (0.45 + 0.55 * hn);
  rel = rotA(rel, ax, a0); nrm = rotA(nrm, ax, a0);
  return rel;
}
// a gust front: straight lines moving downwind; 0 between fronts, rises to 1 as a front passes world xz, decays in ~1.6 s
float gustAt(vec2 xz, float t){
  float period = max(uGust.w, 1.0), speed = max(uGust.z, 1.0);
  float s = dot(xz, uGust.xy) / speed;            // seconds of delay at this place
  float tt = mod(t - s, period);
  return smoothstep(0.0, 0.25, tt) * (1.0 - smoothstep(0.5, 1.6, tt));
}
`;

// ---- GLSL: the skin vertex shader (variants by define: BODIES | INSTANCED, + SHADOW, + STREAMER) ----
// Attributes: position/normal (rest pose, mesh space), aUV (metres on the surface), aSeam (metres to the nearest
// seam across u, across v), aInfo (body id, cloth index, fill order 0..1, pin 0..1 = held at its rest position (a peg) / streamer length).
// BODY ARRAYS (o.bodies): uBP = foot xyz + height; uBD = fold dir x, z, hinge height 0..1, height kept at p 0;
//   uBX = section mask x, z, section scale at p 0, phase; uBS = STATE p, kink, lean, tip (radians): write uBS each frame.
// INSTANCES (o.instanced): iBody = height, hinge height, phase, kink radians at full gust; iState = time of birth in
//   seconds (<= 0: always up), softness 0..1, lean radians when soft, cloths (first + 8 * second, for geometry
//   cloth indices 0 and 1); aInfo.w = arm coordinate (metres from the shoulder, signed), 0 elsewhere; material uniform uInst = height kept at
//   p 0, section scale at p 0, 1 for a tube / 0 for a loaf. Foot of the body = origin of the instanced geometry.
const SKIN_VERT = /* glsl */`
attribute vec2 aUV; attribute vec2 aSeam; attribute vec4 aInfo; attribute vec2 aPan;
uniform vec3 uLit[8]; uniform vec3 uShade[8]; uniform float uStream; uniform vec3 uStreamK;   // uStreamK: how far the ribbons fan apart, ripple and twist (1,1,1 streamers; 0,.2,0 bunting pennants)
#ifdef BODIES
uniform vec4 uBP[${MAXB}]; uniform vec4 uBD[${MAXB}]; uniform vec4 uBX[${MAXB}]; uniform vec4 uBS[${MAXB}];
#endif
#ifdef INSTANCED
attribute vec4 iBody; attribute vec4 iState; uniform vec4 uInst;
#endif
varying vec3 vN; varying vec3 vW; varying vec2 vUV; varying vec2 vSeam; varying vec3 vLit; varying vec3 vShade; varying vec2 vSoft; varying vec2 vPan; varying float vBand;
${GLSL_DEFORM}
void main(){
  float clf = aInfo.y;
#ifdef INSTANCED
  // geometry cloth 0 = the instance's first cloth, 1 = its second: iState.w = first + 8 * second
  clf = aInfo.y < 0.5 ? mod(iState.w, 8.0) : (aInfo.y < 1.5 ? floor(iState.w / 8.0) : aInfo.y);
#endif
  int cl = int(clamp(clf, 0.0, 7.0) + 0.5);
  vLit = uLit[cl]; vShade = uShade[cl];
  // cloth 7.3: a tether or pole seen across the town, the webbing a mid tone instead of black (a hairline, not a scribble)
  if (aInfo.y > 7.2) { vLit = mix(uLit[7], uLit[4], 0.3); vShade = vLit; }
  if (aInfo.y > 7.5) { vLit = uLit[4]; vShade = vLit; }      // (small round) cloth 7.6, THE STRAP: every guy line, tether and pole is white webbing, one flat tone on both sides
  vec3 P = position; vec3 N = normal; float soft = 0.0;
#ifdef BODIES
  int id = int(clamp(aInfo.x, 0.0, ${MAXB - 1}.0) + 0.5);
  vec4 bp = uBP[id], bd = uBD[id], bx = uBX[id], st = uBS[id];
  if (aInfo.z >= 0.0) st.x = clamp((st.x - aInfo.z * 0.6) / 0.4, 0.0, 1.0) + max(st.x - 1.0, 0.0);   // panels fill in order (order < 0: no order)
  P = bp.xyz + inflate(P - bp.xyz, N, bp.w, bd.xy, bd.z, bd.w, bx.xy, bx.z, st, bx.w, soft);
#ifndef STREAMER
  P = mix(P, position, aInfo.w);          // aInfo.w = pin: a guy line's peg end stays in the ground
#endif
  vec4 wp = modelMatrix * vec4(P, 1.0);
  vec3 wn = mat3(modelMatrix) * N;
#endif
#ifdef INSTANCED
  vec3 io = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  mat3 im = mat3(modelMatrix) * mat3(instanceMatrix);
  float g = gustAt(io.xz, uGustT);
  vec3 dl = vec3(uGust.x, 0.0, uGust.y) * im;                       // downwind, in the instance's frame
  float dll = max(length(dl.xz), 1e-4); vec2 dir = dl.xz / dll;
  // iState.x: 0 always up; > 0 born once at that script clock; < 0 lives on a 46 s cycle of world time (sags, lies down, is born again)
  float cyc = mod(uTime - iState.x, 46.0);
  float age = iState.x == 0.0 ? 9.0 : (iState.x > 0.0 ? (uClock - iState.x) / 6.0 : cyc / 6.0);   // a birth lasts six seconds
  float sag = iState.x < 0.0 ? smoothstep(39.0, 45.8, cyc) : 0.0;
  float born = clamp(age, 0.0, 1.0);
  float pb = smoothstep(0.15, 0.8, born) * 1.08 - 0.08 * smoothstep(0.82, 1.0, born);
  // the breath out: every fan stops, the town sinks together, then stands back up along a front running downwind
  float od = uClock - uOut.x, oup = od - uOut.y - max(dot(io.xz, uGust.xy) - uOut.w, 0.0) / max(uOut.z, 1.0);
  float outp = smoothstep(0.0, 1.8, od) * (1.0 - smoothstep(0.0, 0.9, oup));
  float obounce = oup > 0.0 ? 0.09 * exp(-oup * 2.2) * sin(oup * 7.0) : 0.0;
  float p = pb * (1.0 - 0.45 * iState.y) * (1.0 - 0.94 * sag) * (1.0 - 0.8 * outp) + obounce * step(0.99, born);
  vec4 st = vec4(p, (iBody.w * g + 2.5 * outp * uInst.z) * step(0.99, born), iState.z * iState.y + 0.12 * g + 0.5 * sag, 0.5 * iState.y + 0.6 * g * uInst.z + 0.8 * outp * uInst.z);
  // arms (aInfo.w = metres out from the shoulder, signed by side) flail, never in step, and drop in a gust
  float arm = aInfo.w, aa = abs(arm);
  float af = uTime * (3.1 + 1.7 * fract(iBody.z * 5.3)) + iBody.z * 40.0 + sign(arm) * 1.9;
  P.y += aa * (0.5 * sin(af) - 0.6 * g - 0.9 * iState.y) + aa * aa * (0.045 * sin(af - 1.1) - 0.035) + 0.9 * sin(aa * 0.42 - af * 1.3) * smoothstep(0.0, 4.0, aa);
  P.xz += dir * (aa * 0.3 * sin(uTime * 2.3 + iBody.z * 17.0 + sign(arm)) + 0.6 * sin(aa * 0.38 - uTime * 3.7 + iBody.z * 9.0) * smoothstep(0.0, 4.0, aa));
  P = inflate(P, N, iBody.x, dir, iBody.y, uInst.x, vec2(1.0, 1.0), uInst.y, st, iBody.z, soft);
  // the puddle: before it lumps up a body lies spread on the ground in low lumps
  float pud = 1.0 - smoothstep(0.0, 0.3, born);
  P.y += pud * 0.5 * (0.5 + 0.5 * sin(P.x * 0.9 + iBody.z * 20.0) * sin(P.z * 1.1 + iBody.z * 7.0));
  // the breath out: a house that has sunk is not a plate but puddled cloth, lumps a metre and more high with air still caught
  // under them, and the normal follows the lumps (so the three tones and the sheen show them)
  float lmp = outp * step(uInst.x, 0.1) * step(0.99, born) * smoothstep(0.3, 2.2, position.y);
  if (lmp > 0.001) { float ax = P.x * 0.8 + iBody.z * 20.0, az = P.z * 0.95 + iBody.z * 7.0;
    P.y += lmp * 1.7 * (0.55 + 0.45 * sin(ax) * sin(az) + 0.22 * sin(ax * 2.3 + 1.0) * sin(az * 1.9 + 0.5));
    N += lmp * vec3(-0.85 * cos(ax) * sin(az), 0.0, -0.85 * sin(ax) * cos(az)); }
  vec4 wp = modelMatrix * instanceMatrix * vec4(P, 1.0);
  vec3 wn = im * N;
  if (uInst.w > 0.5) {
    // a windsock: the geometry is a sock along +y from its hoop; it is laid out here downwind from the instance's
    // origin (the pole's top), hanging limp between gusts, filling and swimming as a front passes
    float sl = position.y, fill = clamp(0.5 + 0.6 * g + 0.18 * sin(uTime * 0.7 + iBody.z * 30.0) - 0.9 * outp - 0.5 * iState.y, 0.04, 1.0);
    float ang = mix(1.38, 0.1, fill);
    vec3 dwn = vec3(uGust.x, 0.0, uGust.y); dwn = dwn / max(length(dwn), 1e-4);
    vec3 axs = dwn * cos(ang) - vec3(0.0, 1.0, 0.0) * sin(ang);
    vec3 sde = vec3(-dwn.z, 0.0, dwn.x); vec3 upv = cross(sde, axs);
    float hang = smoothstep(0.0, 1.6, sl), rsk = mix(1.0, mix(0.3, 1.0, fill), hang) * iBody.x;
    float wig = sin(sl * 1.3 - uTime * (5.0 + 2.0 * fract(iBody.z * 7.0)) + iBody.z * 40.0) * 0.07 * sl * (0.3 + 0.7 * fill);
    vec3 q = io + iBody.x * (axs * sl + sde * wig) + sde * (position.x * rsk) + upv * (position.z * rsk * mix(0.45, 1.0, fill));
    wp = vec4(q, 1.0); wn = sde * normal.x + upv * normal.z + axs * normal.y;
    soft = (1.0 - fill) * 0.6;
  }
#endif
#ifdef STREAMER
  // position = the root on the body (already deformed above); the ribbon is laid out here, downwind and hanging
  float L = aInfo.w, s = aUV.x, sd = aUV.y, phs = aSeam.x;
  float k = clamp(uStream * (0.75 + 0.25 * sin(uTime * 1.7 + phs * 5.0)), 0.05, 0.98);
  vec3 dw = vec3(uWind.x, 0.0, uWind.y); dw = dw / max(length(dw), 1e-4);
  vec3 run = dw * k + vec3(0.0, -1.0, 0.0) * sqrt(1.0 - k * k);
  vec3 sideH = vec3(-dw.z, 0.0, dw.x);
  vec3 upS = cross(sideH, run);
  float rp = s * 11.0 - uTime * (6.0 + 2.0 * fract(phs * 3.1)) + phs * 6.283;
  vec3 c = run * (L * s) + (upS * (sin(rp) * 0.9 * s) + sideH * (sin(rp * 0.63 + 1.7) * 0.8 * s)) * uStreamK.y + (sideH * ((fract(phs * 7.3) - 0.5) * 7.0 * s) + upS * ((fract(phs * 3.7) - 0.5) * 6.0 * s)) * uStreamK.x;
  float tw = (s * 2.2 + phs * 9.0 + uTime * 1.1) * uStreamK.z;
  vec3 wv = sideH * cos(tw) + upS * sin(tw);
  wp.xyz += c + wv * (sd * aSeam.y);
  wn = cross(run + upS * (cos(rp) * 0.6 * uStreamK.y), wv);
  vUV = vec2(L * s, sd * aSeam.y); vSeam = vec2((1.0 - abs(sd)) * aSeam.y, 9.0);
#else
  vUV = aUV; vSeam = aSeam;
#endif
  // a hose keeps a width the eye can hold: far off its section is let out so that it never thins to a broken hair
  if (aInfo.z < -1.5) { float hr = -aInfo.z - 2.0; wp.xyz += wn / max(length(wn), 1e-4) * max(0.0017 * length(cameraPosition - wp.xyz) - hr * length(wn), 0.0); }
#ifdef SHADOW
  wp.xyz -= uSun * ((wp.y - uShadowY) / max(uSun.y, 0.2)); wp.y = uShadowY;
#endif
  vN = wn; vW = wp.xyz; vSoft = vec2(soft, aInfo.y > 6.5 ? 0.0 : 1.0); vPan = aPan; vBand = abs(clf - 6.0) < 0.5 ? 1.0 : 0.0;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const SKIN_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uSun; uniform vec3 uWeb; uniform vec3 uTarp; uniform vec2 uSheen; uniform vec4 uHaze;
// THE AIR: every cloth, wash and the floor goes toward the low sky's tone by its distance (paler at the pale hours, deeper under the
// engine's night), none inside 150 m, so that the far town
// lies behind the near one in layers instead of at one strength (the same law in the tarpaulin's shader)
float airAt(float d){ return uHaze.w * smoothstep(150.0, 900.0, d); }
varying vec3 vN; varying vec3 vW; varying vec2 vUV; varying vec2 vSeam; varying vec3 vLit; varying vec3 vShade; varying vec2 vSoft; varying vec2 vPan; varying float vBand;
void main(){
#ifdef SHADOW
  // the wash of the caster's colour, LAID ON the pale cloth, not multiplied into it (multiplied into the green-grey tarpaulin red
  // went brick and peach went tan). The cloth's hue is mixed by eye (in display values) into a clean white as light as the floor,
  // just far enough to be a decided pastel: red throws rose, peach throws peach, green mint, yellow lemon; white casts a cool pale
  // wash; webbing, black or the white strap (cloth 7.6), a deeper tone of the floor. ONE WASH A PIXEL: the tarpaulin leaves 1 - WASH in the buffer's alpha where it is
  // bare; the wash is laid by that alpha (see skin(), the shadow's blend) and writes 1 there, so whatever is cast on a washed place
  // afterwards changes nothing. Each cloth throws one decided flat tone with the clean scalloped edge of its own outline, and where
  // two washes overlap the floor takes the first of them, never a third tone. (Beyond 150 m the air lies over wash and floor alike.)
  vec3 sS = pow(max(vLit, vec3(1e-4)), vec3(0.4545));
  float smx = max(sS.r, max(sS.g, sS.b)), smn = min(sS.r, min(sS.g, sS.b)), ssat = (smx - smn) / max(smx, 1e-3);
  float tmx = pow(clamp(1.08 * max(uTarp.r, max(uTarp.g, uTarp.b)), 1e-4, 1.0), 0.4545);
  vec3 tint = pow(mix(vec3(tmx), sS, clamp(0.37 / max(ssat, 0.05), 0.3, 0.95)), vec3(2.2));
  vec3 wash = mix(uTarp * vec3(0.86, 0.9, 0.96), tint, smoothstep(0.03, 0.14, ssat));
  gl_FragColor = vec4(mix(vSoft.y < 0.5 ? uTarp * vec3(0.72, 0.8, 0.7) : wash, uHaze.rgb, airAt(length(cameraPosition - vW))), 1.0);
#else
  vec3 n = vN; float n2 = dot(n, n); n = n2 > 1e-8 ? n * inversesqrt(n2) : vec3(0.0, 1.0, 0.0);
  if (!gl_FrontFacing) n = -n;
  vec3 tv = cameraPosition - vW; float dist = max(length(tv), 1e-3); vec3 v = tv / dist;
  float seam = min(vSeam.x, vSeam.y);
  float along = vSeam.x < vSeam.y ? vUV.y : vUV.x;
  float nearS = 1.0 - smoothstep(0.0, 0.3, seam);
  // three decided tones (beyond 150 m the air over all three). Shade: the same cloth made richer, one clean edge where the skin turns from the sun;
  // a soft skin wrinkles all over, a full one only drums a little
  float dsun = dot(n, uSun);
  float wrk = vSoft.x * 0.5 * sin(vUV.y * 2.3 + 2.0 * sin(vUV.x * 1.1));
  float drum = sin(vUV.x * 2.6 + vUV.y * 1.7 + uTime * 6.0) * (1.0 - nearS);
  float ndl = dsun + wrk * 0.3 + 0.012 * drum;
  float fn = clamp(fwidth(ndl), 1e-4, 0.05);
  float lit = smoothstep(-fn, fn, ndl);
  vec3 col = mix(vShade, vLit, lit);
  // one sheen bar per panel: a long bar a fifth of the way in from the seam on the side that faces the sun; it drums
  vec2 gs = vec2(dFdx(vPan.x), dFdy(vPan.x)), gd = vec2(dFdx(dsun), dFdy(dsun));
  float slope = dot(gs, gd) / max(dot(gs, gs), 1e-9);
  float s0 = 0.5 + 0.2 * clamp(slope * 5.0, -1.0, 1.0) + 0.012 * drum;
  float fb = max(fwidth(vPan.x), 1e-4);
  float bar = (1.0 - smoothstep(0.05, 0.05 + 1.5 * fb, abs(vPan.x - s0))) * smoothstep(0.1, 0.17, vPan.y) * (1.0 - smoothstep(0.83, 0.9, vPan.y));
  float sh = bar * step(0.0, vPan.x) * smoothstep(0.22, 0.34, dsun) * clamp(0.07 / fb, 0.0, 1.0) * vSoft.y * (1.0 - smoothstep(0.08, 0.4, vSoft.x));
  // white shows its swell by tint, not by tone: the side of each gore that turns from the sun takes the shade (a tenth of the
  // cloth behind it), fading out toward the gore's crown; the sheen bar stays whiter than the cloth
  float gside = slope > 0.0 ? 1.0 - vPan.x : vPan.x;
  col = mix(col, vShade * vec3(0.93, 0.95, 1.0), smoothstep(0.4, 0.95, gside) * step(0.0, vPan.x) * vBand * lit);
  col = mix(col, mix(vLit, vec3(1.0), 0.35 + 0.65 * vBand), sh);
  // pucker ticks: wrinkles a hand long either side of a seam, in the other tone; longer and denser as pressure falls
  float tickLen = 0.2 + 0.5 * vSoft.x;
  float tick = smoothstep(0.5, 0.8, sin(along * 31.0 + 1.3 * sin(along * 7.0))) * smoothstep(0.045, 0.07, seam) * (1.0 - smoothstep(tickLen * 0.6, tickLen, seam));
  col = mix(col, mix(mix(vLit, vShade, lit), vShade * vec3(0.84, 0.88, 1.0), vBand), tick * 0.75 * (1.0 - smoothstep(25.0, 70.0, dist)) * vSoft.y);
  // ripstop: a 2 cm grid at 5 percent with every fifth thread heavier (10 cm squares), gone where a cell is too small to draw
  vec2 g = vUV / 0.02; vec2 fg = fwidth(g); float cellpx = 1.0 / max(max(fg.x, fg.y), 1e-4);
  vec2 gq = abs(fract(g) - 0.5);
  col *= 1.0 - 0.05 * max(smoothstep(0.36, 0.5, gq.x), smoothstep(0.36, 0.5, gq.y)) * smoothstep(4.0, 8.0, cellpx);
  vec2 g5 = vUV / 0.1; float cell5 = cellpx * 5.0, lw = clamp(0.75 / cell5, 0.06, 0.3);
  vec2 gq5 = abs(fract(g5) - 0.5);
  col *= 1.0 - 0.085 * max(smoothstep(0.5 - lw, 0.5 - 0.4 * lw, gq5.x), smoothstep(0.5 - lw, 0.5 - 0.4 * lw, gq5.y)) * smoothstep(3.2, 6.0, cell5) * vSoft.y;
  // the seam: two rows of stitching, one either side of the join. 6 cm apart at arm's length, held apart on screen
  // further off (a seam pair), separate stitches up close, gone beyond 250 m; the join between them is the richer tone
  float fs = max(fwidth(seam), 1e-5);
  float panelPx = 1.0 / max(max(fwidth(vPan.x), fwidth(vPan.y)), 1e-4);          // a small panel on screen takes one line, not a pair
  float off = mix(0.03, clamp(1.7 * fs, 0.03, 0.32), smoothstep(16.0, 30.0, panelPx));
  float hw = max(0.008, 0.5 * fs);
  float row = 1.0 - smoothstep(hw, hw + fs, abs(seam - off));
  float fa = max(fwidth(along), 1e-5), da = clamp(fa / 0.12, 0.0, 0.2);
  float dash = 1.0 - smoothstep(0.3 - da, 0.3 + da, abs(fract(along / 0.12) - 0.5));
  dash = mix(dash, 0.8, smoothstep(0.025, 0.05, fa));
  float seamFade = (1.0 - smoothstep(170.0, 250.0, dist)) * vSoft.y * smoothstep(5.0, 13.0, panelPx);      // a panel a few pixels across is clean cloth
  col = mix(col, vShade, (1.0 - smoothstep(0.3 * off, 0.6 * off, seam)) * seamFade);
  col = mix(col, mix(vShade, uWeb, 0.72), row * dash * 0.9 * seamFade);
  gl_FragColor = vec4(mix(col, uHaze.rgb, airAt(dist)), 1.0);
#endif
}`;

// ---- batcher: collects quilted panels, ribbons and streamers into one BufferGeometry ----------------
function makeBatch() {
  let cap = 16384, n = 0, icap = 65536, ni = 0;
  let pos = new Float32Array(cap * 3), nrm = new Float32Array(cap * 3), uv = new Float32Array(cap * 2), seam = new Float32Array(cap * 2), info = new Float32Array(cap * 4), pan = new Float32Array(cap * 2);
  let idx = new Uint32Array(icap);
  const grow = (a, len) => { const b = new a.constructor(len); b.set(a); return b; };
  return {
    get count() { return n; }, get tris() { return ni / 3; },
    vert(x, y, z, nx, ny, nz, u, v, s0, s1, body, cloth, order, w, ps = -1, pt = 0.5) {
      if (n >= cap) { cap *= 2; pos = grow(pos, cap * 3); nrm = grow(nrm, cap * 3); uv = grow(uv, cap * 2); seam = grow(seam, cap * 2); info = grow(info, cap * 4); pan = grow(pan, cap * 2); }
      pan[n * 2] = ps; pan[n * 2 + 1] = pt;
      pos[n * 3] = x; pos[n * 3 + 1] = y; pos[n * 3 + 2] = z; nrm[n * 3] = nx; nrm[n * 3 + 1] = ny; nrm[n * 3 + 2] = nz;
      uv[n * 2] = u; uv[n * 2 + 1] = v; seam[n * 2] = s0; seam[n * 2 + 1] = s1;
      info[n * 4] = body; info[n * 4 + 1] = cloth; info[n * 4 + 2] = order; info[n * 4 + 3] = w;
      return n++;
    },
    pinRange(a, b, f) { for (let i = a; i < b; i++) info[i * 4 + 3] = f(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); },
    tri(a, b, c) { if (ni + 3 > icap) { icap *= 2; idx = grow(idx, icap); } idx[ni++] = a; idx[ni++] = b; idx[ni++] = c; },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos.slice(0, n * 3), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(nrm.slice(0, n * 3), 3));
      g.setAttribute('aUV', new THREE.BufferAttribute(uv.slice(0, n * 2), 2));
      g.setAttribute('aSeam', new THREE.BufferAttribute(seam.slice(0, n * 2), 2));
      g.setAttribute('aInfo', new THREE.BufferAttribute(info.slice(0, n * 4), 4));
      g.setAttribute('aPan', new THREE.BufferAttribute(pan.slice(0, n * 2), 2));
      g.setIndex(new THREE.BufferAttribute(idx.slice(0, ni), 1));
      return g;
    },
  };
}

// ---- QUILT: the one way a body is made ---------------------------------------------------------------
// quilt(batch, { P(u, v, out), nu, nv, su = 4, sv = 4, uEdges?, vEdges?, bulge = 0.5, body = 0, cloth = 0 | (iu, iv) => n,
//                order = 0 | (iu, iv) => 0..1, tuft = true, flip = false, phase = 0 })
// P writes the base surface point for u, v in 0..1. The surface is cut into nu x nv panels (uEdges / vEdges give uneven
// cuts); each panel is its own (su x sv) grid pushed out along its normal by bulge * sin(pi s) * tuft(t), with the
// normal tilted by the slope of that profile, so the silhouette scallops and the shading creases at every seam.
// tuft false: no pillow and no seam across v (long gores). The outward side is cross(dP/dv, dP/du); flip turns it.
const _a = [0, 0, 0], _b = [0, 0, 0], _c = [0, 0, 0], _d = [0, 0, 0], _e = [0, 0, 0];
function quilt(B, o) {
  const nu = o.nu, nv = o.nv, su = o.su ?? 4, sv = o.sv ?? 4, tuft = o.tuft !== false, flip = !!o.flip;
  const ue = o.uEdges, ve = o.vEdges, P = o.P, eps = 1e-3, tk = o.tuftK ?? 1;      // tuftK < 1: the pinch at a cross seam is shallower (a stitched ring on a straight tube)
  const row = new Int32Array((su + 1) * (sv + 1));
  let lnx = 0, lny = 1, lnz = 0;
  const c0 = o.cols ? o.cols[0] : 0, c1 = o.cols ? o.cols[1] : nu;      // cols: a slice of panel columns (see quiltY)
  for (let iu = c0; iu < c1; iu++) for (let iv = 0; iv < nv; iv++) {
    const u0 = ue ? ue[iu] : iu / nu, u1 = ue ? ue[iu + 1] : (iu + 1) / nu, v0 = ve ? ve[iv] : iv / nv, v1 = ve ? ve[iv + 1] : (iv + 1) / nv;
    const cloth = typeof o.cloth === 'function' ? o.cloth(iu, iv) : (o.cloth ?? 0);
    const order = typeof o.order === 'function' ? o.order(iu, iv) : (o.order ?? -1), oAt = o.orderAt;
    const bulge = typeof o.bulge === 'function' ? o.bulge(iu, iv) : (o.bulge ?? 0.5);
    for (let j = 0; j <= sv; j++) for (let i = 0; i <= su; i++) {
      const s = i / su, t = j / sv, u = u0 + (u1 - u0) * s, v = v0 + (v1 - v0) * t;
      P(u, v, _a); P(Math.min(1, u + eps), v, _b); P(Math.max(0, u - eps), v, _c); P(u, Math.min(1, v + eps), _d); P(u, Math.max(0, v - eps), _e);
      const du = Math.min(1, u + eps) - Math.max(0, u - eps), dv = Math.min(1, v + eps) - Math.max(0, v - eps);
      let tux = (_b[0] - _c[0]) / du, tuy = (_b[1] - _c[1]) / du, tuz = (_b[2] - _c[2]) / du;
      let tvx = (_d[0] - _e[0]) / dv, tvy = (_d[1] - _e[1]) / dv, tvz = (_d[2] - _e[2]) / dv;
      const lu = Math.hypot(tux, tuy, tuz), lv = Math.hypot(tvx, tvy, tvz);
      let nx = tvy * tuz - tvz * tuy, ny = tvz * tux - tvx * tuz, nz = tvx * tuy - tvy * tux;
      if (flip) { nx = -nx; ny = -ny; nz = -nz; }
      const ln = Math.hypot(nx, ny, nz);
      if (ln > 1e-6 * (lu * lv + 1e-9) && ln > 1e-9) { nx /= ln; ny /= ln; nz /= ln; lnx = nx; lny = ny; lnz = nz; } else { nx = lnx; ny = lny; nz = lnz; }
      const wu = Math.max(lu * (u1 - u0), 1e-3), wv = Math.max(lv * (v1 - v0), 1e-3);     // panel size in metres here
      const bu = Math.sin(Math.PI * s), q = 2 * t - 1, bv = tuft ? 1 - tk * q * q * q * q : 1;
      const b = bulge * bu * bv;
      const dbu = bulge * Math.PI * Math.cos(Math.PI * s) * bv / wu, dbv = tuft ? bulge * bu * tk * (-8 * q * q * q) / wv : 0;
      let mx = nx, my = ny, mz = nz;
      if (lu > 1e-9) { mx -= (tux / lu) * dbu; my -= (tuy / lu) * dbu; mz -= (tuz / lu) * dbu; }
      if (lv > 1e-9) { mx -= (tvx / lv) * dbv; my -= (tvy / lv) * dbv; mz -= (tvz / lv) * dbv; }
      const lm = Math.hypot(mx, my, mz) || 1;
      row[j * (su + 1) + i] = B.vert(_a[0] + nx * b, _a[1] + ny * b, _a[2] + nz * b, mx / lm, my / lm, mz / lm,
        u * lu, v * lv, su > 1 ? Math.min(s, 1 - s) * wu : 9, tuft && sv > 1 ? Math.min(t, 1 - t) * wv : 9, o.body ?? 0, cloth, oAt ? oAt(u, v) : order, o.pin ?? 0,
        o.sheen === false ? -1 : s, tuft ? t : (v - (o.bar0 ?? 0)) / Math.max((o.bar1 ?? 1) - (o.bar0 ?? 0), 1e-3));
    }
    for (let j = 0; j < sv; j++) for (let i = 0; i < su; i++) {
      const a = row[j * (su + 1) + i], b2 = row[(j + 1) * (su + 1) + i], c = row[j * (su + 1) + i + 1], d = row[(j + 1) * (su + 1) + i + 1];
      if (flip) { B.tri(a, c, b2); B.tri(c, d, b2); } else { B.tri(a, b2, c); B.tri(c, b2, d); }
    }
  }
}

// quiltY: the same, a few panel columns at a time with a yield between (no build step over 50 ms)
async function quiltY(B, o, ctx, n = 4) { for (let a = 0; a < o.nu; a += n) { quilt(B, { ...o, cols: [a, Math.min(o.nu, a + n)] }); await ctx.yield(); } }

// ribbon(batch, pts [[x,y,z],...], width, cloth = WEB, body = 0, pins = [0..1 per point]): a flat strip that faces up/sideways (two crossed
// blades so it never vanishes edge-on). For strings, pegs, hems and the strap's own strips (guy lines, tethers and poles go by strap(), hoses by hose()). Keep width >= 1.5 px at its distance.
function ribbon(B, pts, width, cloth = CLOTH.WEB, body = 0, pins = null) {
  const h = width * 0.5;
  for (let blade = 0; blade < 2; blade++) {
    let prev = -1, prev2 = -1, run = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let sx = -tz, sy = 0, sz = tx; const sl = Math.hypot(sx, sz); if (sl < 1e-4) { sx = 1; sz = 0; } else { sx /= sl; sz /= sl; }
      const ux = sy * tz - sz * ty, uy = sz * tx - sx * tz, uz = sx * ty - sy * tx;      // second blade direction
      const wx = blade ? ux : sx, wy = blade ? uy : sy, wz = blade ? uz : sz, nx = blade ? sx : ux, ny = blade ? sy : uy, nz = blade ? sz : uz;
      if (i > 0) run += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]);
      const v0 = B.vert(p[0] - wx * h, p[1] - wy * h, p[2] - wz * h, nx, ny, nz, 0, run, 9, 9, body, cloth, -1, pins ? pins[i] : 0);
      const v1 = B.vert(p[0] + wx * h, p[1] + wy * h, p[2] + wz * h, nx, ny, nz, width, run, 9, 9, body, cloth, -1, pins ? pins[i] : 0);
      if (prev >= 0) { B.tri(prev, v0, prev2); B.tri(prev2, v0, v1); B.tri(prev, prev2, v0); B.tri(prev2, v1, v0); }
      prev = v0; prev2 = v1;
    }
  }
}

// hose(batch, pts, radius, cloth = WEB, body = 0, sides = 4, pins): a ROUND tube along a smooth curve through pts (Catmull-Rom,
// sub steps between points): hoses and mains lie in lazy curves with no kink and never show a flat blade edge-on.
function hose(B, pts, r, cloth = CLOTH.WEB, body = 0, sides = 4, sub = 1, pins = null) {
  const n = pts.length, P = (i) => pts[Math.max(0, Math.min(n - 1, i))], q = [];
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < sub; k++) {
    const t = k / sub, a = P(i - 1), b = P(i), c = P(i + 1), d = P(i + 2), o = [0, 0, 0, 0];
    for (let j = 0; j < 3; j++) o[j] = 0.5 * (2 * b[j] + (c[j] - a[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t * t + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * t * t * t);
    o[3] = pins ? pins[i] + (pins[i + 1] - pins[i]) * t : 0; q.push(o);
  }
  q.push([pts[n - 1][0], pts[n - 1][1], pts[n - 1][2], pins ? pins[n - 1] : 0]);
  let prev = null, run = 0;
  for (let i = 0; i < q.length; i++) {
    const p = q[i], a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    let sx = -tz, sz = tx; const sl = Math.hypot(sx, sz); if (sl < 1e-4) { sx = 1; sz = 0; } else { sx /= sl; sz /= sl; }
    const ux = -sz * ty, uy = sz * tx - sx * tz, uz = sx * ty;
    if (i > 0) run += Math.hypot(p[0] - q[i - 1][0], p[1] - q[i - 1][1], p[2] - q[i - 1][2]);
    const ring = [];
    for (let k = 0; k < sides; k++) {
      const ang = (k + 0.5) / sides * Math.PI * 2, c = Math.cos(ang), s = Math.sin(ang), nx = sx * c + ux * s, ny = uy * s, nz = sz * c + uz * s;
      ring.push(B.vert(p[0] + nx * r, p[1] + ny * r, p[2] + nz * r, nx, ny, nz, k / sides, run, 9, 9, body, cloth, -2 - r, p[3]));      // order <= -2: a hose of radius -order - 2 (the vertex shader keeps it 1.5 px wide far off)
    }
    if (prev) for (let k = 0; k < sides; k++) { const k1 = (k + 1) % sides; B.tri(prev[k], ring[k], prev[k1]); B.tri(prev[k1], ring[k], ring[k1]); }
    prev = ring;
  }
}

// THE STRAP: one rule for every guy line, tether and pole of the town. strap(batch, a, b, o) is a flat strap of WHITE webbing (cloth STRAP_CLOTH: it was black, and strangers read it as scratches) STRAP
// metres wide (a real width in the world, never one held to a pixel), taut in one straight run from a D-ring on its body (a) to a
// peg in the tarpaulin (b). o.w: another real width (a body a hundred metres long hangs on a broader strap); o.body; o.pins [at a, at b]
// (1 = held at its rest place: the peg end of a wall's guy, so that a sinking wall slackens it); o.ring false: no D-ring (a pole's
// top carries its fish or its string); o.peg false: no peg (the far end is on a body too).
export const STRAP = 0.26;
export const STRAP_CLOTH = 7.6;      // (small round) the strap's own ink (since the seventh also the bunting strings' and the windsock fishes' mouth hoops'), above WEB so that it keeps the webbing's flat drawing (no sheen, no seam): the vertex shader gives cloth 7.6 the town's white (the white cloth's lit tone on both sides); the 2 cm ripstop is not gated and shows on it from very near; the strap's shadow stays webbing's deep tone
function strap(B, a, b, o = {}) {
  const w = o.w ?? STRAP, body = o.body ?? 0, pa = o.pins ? o.pins[0] : 0, pb = o.pins ? o.pins[1] : 0;
  ribbon(B, [a, b], w, STRAP_CLOTH, body, [pa, pb]);
  let dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
  let hx = dx, hz = dz; const hl = Math.hypot(hx, hz); if (hl < 1e-3) { hx = 1; hz = 0; } else { hx /= hl; hz /= hl; }
  if (o.ring !== false) {          // the D-ring: a loop of webbing standing in the strap's own upright plane where it leaves the body
    const r = 1.3 * w, nx = -dy * hx, ny = hl < 1e-3 ? 0 : hl, nz = -dy * hz, c = [a[0] + dx * r, a[1] + dy * r, a[2] + dz * r], pts = [], pins = [];
    const mx = hl < 1e-3 ? 1 : nx, mz = hl < 1e-3 ? 0 : nz;
    for (let i = 0; i <= 4; i++) { const t = (i / 4) * Math.PI * 2, co = Math.cos(t) * r, si = Math.sin(t) * r; pts.push([c[0] - dx * co + mx * si, c[1] - dy * co + ny * si, c[2] - dz * co + mz * si]); pins.push(pa); }
    ribbon(B, pts, 0.45 * w, STRAP_CLOTH, body, pins);
  }
  if (o.peg !== false) ribbon(B, [[b[0] - hx * 0.4 * w, b[1] - 0.1, b[2] - hz * 0.4 * w], [b[0] + hx * 1.2 * w, b[1] + 3 * w, b[2] + hz * 1.2 * w]], 1.6 * w, STRAP_CLOTH, body, [pb, pb]);      // the peg: a short fat stake leaning away from the pull
}

// ---- makeStyle ---------------------------------------------------------------------------------------
const SHADE_OF = { '#E5352B': '#C41F2A', '#FFC928': '#F5A800', '#1F5FD0': '#1848C4', '#2FA85A': '#1F9650', '#F0509A': '#E0338A' };
function richer(c) { const h = {}; c.getHSL(h, THREE.SRGBColorSpace); return new THREE.Color().setHSL(h.h, Math.min(1, h.s * 1.15 + 0.03), h.l * 0.88, THREE.SRGBColorSpace); }

export function makeStyle(ctx, opts = {}) {
  const hex = (opts.palette && opts.palette.length >= 7 ? opts.palette : PALETTE).map((h) => String(h).toUpperCase());
  const C = (h) => new THREE.Color(h);
  const names = ['red', 'yellow', 'blue', 'green', 'white', 'pink'];
  const pal = { sky: C(hex[6]), tarp: C('#DDE6D0'), web: C('#1B1B1F') };
  const lit = [], shade = [];
  names.forEach((nm, i) => { pal[nm] = C(hex[i]); lit.push(pal[nm]); shade.push(SHADE_OF[hex[i]] ? C(SHADE_OF[hex[i]]) : richer(pal[nm])); });
  // white is lit by what stands behind it: a tenth of red by default, a tenth of blue for the tower's band
  shade[4] = pal.white.clone().lerp(pal.red, 0.1);
  for (let i = 0; i < 6; i++) if (i !== 4 && hex[i] === hex[4]) shade[i] = shade[4];      // a colourway that puts white in another slot (regatta): never cream
  lit.push(pal.white); shade.push(pal.white.clone().lerp(pal.blue, 0.12));        // 6 WHITE_ON_BLUE
  lit.push(pal.web); shade.push(pal.web);                                         // 7 WEB
  names.forEach((nm, i) => { pal[nm + 'Shade'] = shade[i]; });
  const sun = (opts.sun ? new THREE.Vector3().copy(opts.sun) : new THREE.Vector3(0.441, 0.883, 0.161)).normalize();
  const uniforms = {
    uTime: { value: 0 }, uSun: { value: sun }, uWind: { value: new THREE.Vector2(-0.2, 0.98) },
    uGust: { value: new THREE.Vector4(-0.2, 0.98, 60, 9) }, uShadowY: { value: 0.05 }, uStream: { value: 0.9 },
    uStreamK: { value: new THREE.Vector3(1, 1, 1) }, uClock: { value: 0 }, uGustT: { value: 0 }, uOut: { value: new THREE.Vector4(1e6, 4, 180, 480) },
    uLaneB: { value: new THREE.Vector4(0, 1e6, 0, 1) }, uLit: { value: lit }, uShade: { value: shade }, uWeb: { value: pal.web }, uTarp: { value: pal.tarp }, uSheen: { value: new THREE.Vector2(0.9, 0.945) },
    uHaze: { value: new THREE.Vector4(1, 1, 1, 0) },      // THE AIR: rgb the tone far things go toward (the world gives it the sky cloth's low strip), w how far at most (0: no air)
  };
  const mats = [];
  function skin(o = {}) {
    const defines = {};
    if (o.instanced) defines.INSTANCED = 1; else defines.BODIES = 1;
    if (o.shadow) defines.SHADOW = 1;
    if (o.streamer) defines.STREAMER = 1;
    const u = { ...uniforms };
    if (o.streamer) { u.uStream = { value: 0.9 }; u.uStreamK = { value: new THREE.Vector3(1, 1, 1) }; }            // per material: how far the wind holds the ribbons out, 0..1
    if (o.instanced) u.uInst = { value: new THREE.Vector4(o.sinkMin ?? 0.03, o.rs0 ?? 1.4, o.tube ? 1 : 0, o.sock ? 1 : 0) };
    else {
      const mk = (x, y, z, w) => Array.from({ length: MAXB }, () => new THREE.Vector4(x, y, z, w));
      u.uBP = { value: mk(0, 0, 0, 1) }; u.uBD = { value: mk(0, 1, 0.5, 1) }; u.uBX = { value: mk(1, 1, 1, 0) }; u.uBS = { value: mk(1, 0, 0, 0) };
      if (o.share) { u.uBP = o.share.uniforms.uBP; u.uBD = o.share.uniforms.uBD; u.uBX = o.share.uniforms.uBX; u.uBS = o.share.uniforms.uBS; }
    }
    const m = new THREE.ShaderMaterial({ uniforms: u, defines, vertexShader: SKIN_VERT, fragmentShader: SKIN_FRAG, side: o.streamer ? THREE.DoubleSide : THREE.FrontSide });
    if (o.shadow) {
      // the tinted shadow: a clean pastel of the caster's cloth laid on the tarpaulin (see SKIN_FRAG)
      // (colour: wash * (1 - floor alpha) + floor * floor alpha; alpha: 1. Bare tarpaulin carries alpha 1 - WASH, everything else 1.)
      m.transparent = true; m.depthWrite = false; m.side = THREE.DoubleSide;
      m.blending = THREE.CustomBlending; m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.OneMinusDstAlphaFactor; m.blendDst = THREE.DstAlphaFactor;
      m.blendSrcAlpha = THREE.OneFactor; m.blendDstAlpha = THREE.ZeroFactor;
      m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -8;
    }
    mats.push(m); return m;
  }
  function ground() {
    // the tarpaulin: one pale sheet. Seams every 12 m along z and every 24 m across (two stitch rows and pucker ticks),
    // a few sewn-on patches with their own hems, and the wind: a gust front crosses it as a bandW of bright ripples.
    return new THREE.ShaderMaterial({
      uniforms: { uTarp: uniforms.uTarp, uWeb: uniforms.uWeb, uTime: uniforms.uTime, uGust: uniforms.uGust, uGustT: uniforms.uGustT, uLit: uniforms.uLit, uLaneB: uniforms.uLaneB, uHaze: uniforms.uHaze },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: /* glsl */`uniform vec3 uTarp; uniform vec3 uWeb; uniform float uTime; uniform vec4 uGust; uniform float uGustT; uniform vec3 uLit[8]; uniform vec4 uLaneB; uniform vec4 uHaze; varying vec3 vW;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float stitch(float d, float f){ float hw = max(0.009, 0.3 * f); return 1.0 - smoothstep(hw, hw + f, abs(d - 0.03)); }
        // a printed tint: the cloth c mixed by eye (in display values) into the white cloth wS, just far enough to be a decided pastel
        vec3 pastel(vec3 c, vec3 wS, float target){ vec3 q = pow(max(c, vec3(1e-4)), vec3(0.4545)); float mx = max(q.r, max(q.g, q.b)), mn = min(q.r, min(q.g, q.b));
          float k = clamp(target / max((mx - mn) / max(mx, 1e-3), 0.05), 0.3, 0.92); return pow(mix(wS, q, k), vec3(2.2)); }
        void main(){
          float dist = length(cameraPosition - vW); vec3 lightC = mix(uTarp, vec3(1.0), 0.42);
          float nearF = 1.0 - smoothstep(170.0, 250.0, dist), closeF = 1.0 - smoothstep(35.0, 90.0, dist);
          // panel seams: every 12 m along the course, a cross seam every 24 m (it passes under the lens about once a second)
          float sxs = (fract(vW.x / 12.0) - 0.5) * 12.0, sx = abs(sxs), sz = abs(fract((vW.z - 9.0) / 24.0 + 0.5) - 0.5) * 24.0;
          float fx = max(fwidth(vW.x), 1e-5), fz = max(fwidth(vW.z), 1e-5);
          float crossF = 1.0 - smoothstep(90.0, 190.0, dist);
          float lineM = max(stitch(sx, fx) * nearF, stitch(sz, fz) * nearF * crossF);
          // the long seams are laced as well as stitched: an eyelet every 75 cm either side and a cord zigzagging between them
          float laceF = 1.0 - smoothstep(7.0, 19.0, dist), lz = vW.z / 1.5, tri = abs(fract(lz) - 0.5) * 2.0, fl = max(fx, 0.4 * fz);
          float cord = (1.0 - smoothstep(0.011 + 0.4 * fl, 0.011 + 1.4 * fl, abs(sxs - (tri - 0.5) * 0.44) * 0.86)) * step(sx, 0.23);
          float ez = (fract(lz + (sxs > 0.0 ? 0.5 : 0.0)) - 0.5) * 1.5, er = length(vec2(sx - 0.22, ez));
          float eyelet = 1.0 - smoothstep(0.0, 1.2 * fl, abs(er - 0.05) - 0.02);
          // lane marks: tape sewn down the middle of both avenues and along their edges (continuous, never dashed across the travel)
          float rowx = 13.0 + 25.0 * smoothstep(140.0, 330.0, vW.z), inA = step(-60.0, vW.z) * (1.0 - smoothstep(371.0, 376.0, vW.z));
          vec2 rb = vW.xz - uLaneB.xy; float tb = dot(rb, uLaneB.zw), sb = rb.x * uLaneB.w - rb.y * uLaneB.z, inB = smoothstep(10.0, 14.0, tb) * (1.0 - smoothstep(194.0, 199.0, tb));
          float fpm = max(fx, fz), farM = 1.0 - smoothstep(260.0, 420.0, dist);
          float dMid = min(abs(vW.x) + (1.0 - inA) * 9.0, abs(sb) + (1.0 - inB) * 9.0), dEdge = min(abs(abs(vW.x) - (rowx - 5.6)) + (1.0 - inA) * 9.0, abs(abs(sb) - 8.4) + (1.0 - inB) * 9.0);
          float tapeMid = (1.0 - smoothstep(0.2 - fpm, 0.2 + fpm, dMid)) * farM, tapeEdge = (1.0 - smoothstep(0.26 - fpm, 0.26 + fpm, dEdge)) * farM;
          float tapeHem = max(stitch(0.2 - dMid + 0.03, fpm), stitch(0.26 - dEdge + 0.03, fpm)) * nearF * (1.0 - smoothstep(30.0, 70.0, dist));
          float sd = min(sx, sz), along = sx < sz ? vW.z : vW.x;
          float tick = smoothstep(0.5, 0.8, sin(along * 8.0 + 1.3 * sin(along * 1.9))) * smoothstep(0.07, 0.1, sd) * (1.0 - smoothstep(0.28, 0.5, sd)) * closeF;
          // sewn-on patches: a lighter square with its own hem
          vec2 cs = vec2(31.0, 43.0), cell = floor(vW.xz / cs); float hh = h21(cell);
          vec2 pc = (cell + 0.3 + 0.4 * vec2(h21(cell + 3.1), h21(cell + 7.7))) * cs, hs = vec2(0.5 + 0.9 * h21(cell + 1.3), 0.5 + 0.8 * h21(cell + 5.9));
          vec2 pd = abs(vW.xz - pc) - hs; float pdist = max(pd.x, pd.y), fp = max(fx, fz);
          float isP = step(hh, 0.22) * (1.0 - smoothstep(150.0, 260.0, dist));
          // two patches sewn into the lane where the flight comes in, each in a cloth colour
          vec2 e1 = abs(vW.xz - vec2(-3.3, 13.5)) - vec2(1.15, 0.85), e2 = abs(vW.xz - vec2(3.9, 30.5)) - vec2(0.9, 1.25);
          float d1 = max(e1.x, e1.y), d2 = max(e2.x, e2.y);
          if (min(d1, d2) < 0.5) { pdist = min(d1, d2); isP = 1.0; hh = 0.0; }
          float ptch = isP * (1.0 - smoothstep(-fp, fp, pdist));
          float hem = isP * stitch(-pdist - 0.06, fp) * nearF;
          // the wind on a taut sheet: ripples a hand deep ride each gust front
          vec2 wd = uGust.xy / max(length(uGust.xy), 1e-4); float aw = dot(vW.xz, wd), cw = dot(vW.xz, vec2(-wd.y, wd.x));
          float tt = mod(uGustT - aw / max(uGust.z, 1.0), max(uGust.w, 1.0));
          float g = smoothstep(0.0, 0.2, tt) * (1.0 - smoothstep(0.3, 1.5, tt));
          float rip = sin(aw * 1.1 - uTime * 5.0 + 2.2 * sin(cw * 0.21 + aw * 0.07) + 1.5 * sin(cw * 0.047));
          float bandW = smoothstep(0.55, 0.9, rip) * g * (1.0 - smoothstep(120.0, 420.0, dist));
          float calmW = smoothstep(0.93, 0.99, sin(aw * 0.33 - uTime * 0.8 + 3.0 * sin(cw * 0.05))) * closeF * 0.6;
          vec3 deep = uTarp * vec3(0.9, 0.93, 0.9);
          // a patch is a square of one of the cloths (the wrong colour), or of new pale tarpaulin
          float pk = h21(cell + 9.4); int pi = pk < 0.2 ? 0 : (pk < 0.4 ? 1 : (pk < 0.6 ? 3 : (pk < 0.8 ? 5 : 4)));
          vec3 pcol = hh < 0.09 ? uLit[pi] : lightC;
          if (d1 < 0.5) pcol = uLit[5]; else if (d2 < 0.5) pcol = uLit[3];
          // PRINT (the fairground's floor plan, painted on the sheet): a runner down each avenue with lane lines and one chevron every
          // 32 m, door paths and cross-street paths, alleys of the far quarter, pitch rings and two targets on the plaza. Everything
          // long runs along the travel; nothing alternates across it.
          float prF = 1.0 - smoothstep(520.0, 900.0, dist), a1 = fpm;
          float runA = (1.0 - smoothstep(6.4 - a1, 6.4 + a1, abs(vW.x))) * inA, runB = (1.0 - smoothstep(7.0 - a1, 7.0 + a1, abs(sb))) * inB;
          float laneA = (1.0 - smoothstep(0.13 - a1, 0.13 + a1, min(abs(abs(vW.x) - 3.2), abs(abs(vW.x) - 6.4)))) * inA;
          float laneB = (1.0 - smoothstep(0.13 - a1, 0.13 + a1, min(abs(abs(sb) - 3.5), abs(abs(sb) - 7.0)))) * inB;
          vec2 cvA = vec2(abs(vW.x) - 4.8, (fract(vW.z / 32.0) - 0.5) * 32.0), cvB = vec2(abs(sb) - 5.25, (fract(tb / 32.0 + 0.3) - 0.5) * 32.0);
          float chevA = (1.0 - smoothstep(0.3 - a1, 0.3 + a1, abs(cvA.y + 0.9 * abs(cvA.x)) * 0.74)) * step(abs(cvA.x), 1.15) * inA * step(40.0, vW.z);
          float chevB = (1.0 - smoothstep(0.3 - a1, 0.3 + a1, abs(cvB.y + 0.9 * abs(cvB.x)) * 0.74)) * step(abs(cvB.x), 1.3) * inB;
          // where the flight comes in: two rows of chevrons, one in each of the four lanes, 8 and 36 m in (the second beyond the lane numbers: whole in the first still, not cut by its bottom edge)
          float lxE = abs(abs(abs(vW.x) - 3.2) - 1.6), zE = min(abs(vW.z - 8.0 + 0.9 * lxE), abs(vW.z - 36.0 + 0.9 * lxE));
          float chevE = (1.0 - smoothstep(0.42 - a1, 0.42 + a1, zE * 0.74)) * step(lxE, 1.15) * step(abs(vW.x), 6.4) * inA;
          // door paths (a house every 14 m) and the cross streets every 72 m, outside the lane's edge tape
          float outA = smoothstep(rowx - 5.3, rowx - 4.9, abs(vW.x)) * inA;
          float doorA = (1.0 - smoothstep(0.75 - a1, 0.75 + a1, abs(fract((vW.z - 13.0) / 14.0 + 0.5) - 0.5) * 14.0)) * outA * (1.0 - step(rowx + 8.0, abs(vW.x))) * (1.0 - smoothstep(200.0, 215.0, vW.z));
          float strD = abs(fract((vW.z - 66.0) / 72.0 + 0.5) - 0.5) * 72.0;
          float strA = (1.0 - smoothstep(3.0 - a1, 3.0 + a1, strD)) * smoothstep(rowx - 5.3, rowx - 4.9, abs(vW.x)) * step(-10.0, vW.z) * (1.0 - step(380.0, vW.z)) * (1.0 - smoothstep(150.0, 170.0, abs(vW.x)));
          float strL = (1.0 - smoothstep(0.12 - a1, 0.12 + a1, abs(strD - 3.0))) * step(0.5, strA + 0.5 * step(strD, 3.3)) * smoothstep(rowx - 5.3, rowx - 4.9, abs(vW.x)) * step(-10.0, vW.z) * (1.0 - step(380.0, vW.z)) * (1.0 - smoothstep(150.0, 170.0, abs(vW.x)));
          // the far quarter: a path down every cross alley and along the two back lanes of each side
          float alD = abs(mod(tb - 63.5 + 40.5, 81.0) - 40.5), inQ = step(10.0, tb) * (1.0 - step(300.0, tb)) * step(abs(sb), 128.0) * step(8.6, abs(sb));
          float lnD = min(abs(abs(sb) - 55.25), abs(abs(sb) - 92.25));
          float pathQ = max(1.0 - smoothstep(3.0 - a1, 3.0 + a1, alD), 1.0 - smoothstep(2.4 - a1, 2.4 + a1, lnD)) * inQ;
          float pathQL = (1.0 - smoothstep(0.14 - a1, 0.14 + a1, min(alD, lnD))) * inQ;
          // the plaza before the keep: a centre circle and a box (pitch lines), and a target of five rings either side
          vec2 pz = vW.xz - vec2(${PLAZA.x.toFixed(1)}, ${PLAZA.z.toFixed(1)}); float rc = length(pz);
          float inP = step(205.0, vW.z) * (1.0 - step(388.0, vW.z));
          float ringP = (1.0 - smoothstep(0.2 - a1, 0.2 + a1, abs(rc - ${PLAZA.ring.toFixed(1)}))) * inP;
          vec2 bx = abs(pz) - vec2(27.0, 62.0); float boxP = (1.0 - smoothstep(0.2 - a1, 0.2 + a1, abs(max(bx.x, bx.y)))) * inP * step(6.4, abs(vW.x));
          float rt = length(vec2(abs(vW.x) - 23.0, vW.z - 326.0)), tgt = (1.0 - smoothstep(7.5 - a1, 7.5 + a1, rt)) * inP;
          int ti = rt < 1.5 ? 0 : (rt < 3.0 ? 4 : (rt < 4.5 ? 1 : (rt < 6.0 ? 4 : 5)));
          vec3 col = mix(uTarp, lightC, max(bandW, calmW) * 0.8);
          vec3 whiteP = mix(uTarp, vec3(1.0), 0.85);
          // the near runner: four lanes, each a clean pale tint of one cloth (lemon, rose, mint, white), long bands along the travel;
          // the far runner one clean lemon. Tints are mixed from the white cloth, never from the tarpaulin (that made putty).
          vec3 wS = pow(max(uLit[4], vec3(1e-4)), vec3(0.4545));
          vec3 laneC = vW.x > 3.2 ? pastel(uLit[1], wS, 0.38) : (vW.x > 0.0 ? pastel(uLit[5], wS, 0.38) : (vW.x > -3.2 ? pastel(uLit[3], wS, 0.38) : uLit[4]));
          col = mix(col, laneC, runA * prF);
          col = mix(col, pastel(uLit[1], wS, 0.3), runB * prF);
          col = mix(col, mix(uTarp, uLit[1], 0.34), max(doorA, strA) * prF);
          col = mix(col, mix(uTarp, uLit[3], 0.34), pathQ * prF);
          col = mix(col, uLit[ti], tgt * prF);
          col = mix(col, whiteP, max(max(max(laneA, laneB), max(max(chevA, chevE), chevB)), max(max(ringP, boxP), max(strL, pathQL))) * prF * farM);
          col = mix(col, mix(uTarp, vec3(1.0), 0.8), tapeEdge);
          col = mix(col, uLit[1], tapeMid);
          col = mix(col, pcol, ptch);
          col = mix(col, deep, tick * 0.8);
          col = mix(col, mix(uTarp, uWeb, 0.34), max(max(lineM, hem), tapeHem));
          col = mix(col, mix(uTarp, uWeb, 0.42), max(cord * 0.8, eyelet) * laceF * (1.0 - ptch));
          col = mix(col, uHaze.rgb, uHaze.w * smoothstep(150.0, 900.0, dist));      // THE AIR (the skin's law)
          gl_FragColor = vec4(col, ${(1 - WASH).toFixed(2)}); }`,      // alpha: how much of the bare floor a wash leaves (see the shadow's blend)
    });
  }
  const web = () => new THREE.MeshBasicMaterial({ color: pal.web, toneMapped: false });
  return {
    pal, CLOTH, uniforms, skin, ground, web, quilt, quiltY, ribbon, hose, strap, STRAP, tube, pillow, ball, airDancer, armTube, batch: makeBatch, MAXB,
    // post the world should return, and the flat sky colour (scene.background = style.pal.sky)
    post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
    // the world may set uClock (script seconds: births, the breath out) and uGustT (gust clock) itself after this call
    update(dt, time, camera) { uniforms.uTime.value = time; uniforms.uClock.value = time; uniforms.uGustT.value = time; },
  };
}

// ---- the keep's bodies -------------------------------------------------------------------------------
// Local frame: front (the gate, the avenue side) toward +Z. Keep 150 m wide (x), 120 m deep (z).
const K = { W: 75, D: 60, T: 14, WALLH: 45, TURH: 62, TURR: 10, CAPH: 18, TOWX: 30, TOWZ: 8, TOWR: 8, TOWH: 100, TOWCAP: 20, GATEW: 10, GATEH: 16, COURT: 14, MARK: 15 /* the yard's centre mark: radius of its ring of pillows */ };
const BODY = { STATIC: 0, FRONT: 1, LINTEL: 2, BACK: 3, LEFT: 4, RIGHT: 5, TUR: 6 /* 6..9: front +x, front -x, back +x, back -x */, TOWER: 10, COURT: 11, SOFTB: 12, SLEEVE: 13, N: 14 };

// a wall: a fat loaf swept from (x0,z0) to (x1,z1); its outer side is cross(up, direction). Quilted 6 m panels,
// a rounded crest, both ends closed, pillow battlements on alternate panels (bat: cloth index, or -1 for none).
async function wallLoaf(B, o, sub, ctx) {
  const { x0, z0, x1, z1, H, body } = o, T = o.T ?? K.T, y0 = o.y0 ?? 0;
  const len = Math.hypot(x1 - x0, z1 - z0), ax = (x1 - x0) / len, az = (z1 - z0) / len, ox = az, oz = -ax;
  const r = T / 2, f = H - r, arc = Math.PI * r, tot = 2 * f + arc, nf = Math.max(1, Math.round(f / 12.5));
  const ve = []; for (let i = 0; i <= nf; i++) ve.push((f * i / nf) / tot);
  ve.push((f + arc / 2) / tot); for (let i = 0; i <= nf; i++) ve.push((f + arc + f * i / nf) / tot);
  const sect = (v, out) => {            // v 0..1 -> (d across, y)
    const s = v * tot;
    if (s < f) { out[0] = r * (1.1 - 0.1 * s / f); out[1] = s; }
    else if (s < f + arc) { const a = (s - f) / r; out[0] = r * Math.cos(a); out[1] = f + r * Math.sin(a); }
    else { const y = f - (s - f - arc); out[0] = -r * (1.1 - 0.1 * y / f); out[1] = y; }
  };
  const tmp = [0, 0], nu = Math.max(1, Math.round(len / 6));
  const order = o.order ?? (() => -1);
  await quiltY(B, { nu, nv: ve.length - 1, vEdges: ve, su: sub, sv: sub, bulge: o.bulge ?? 0.75, body, cloth: o.cloth ?? CLOTH.RED,
    order: (iu) => order((iu + 0.5) / nu), orderAt: (u) => order(u),
    P: (u, v, out) => { sect(v, tmp); const cx = x0 + (x1 - x0) * u, cz = z0 + (z1 - z0) * u; out[0] = cx + ox * tmp[0]; out[1] = y0 + tmp[1]; out[2] = cz + oz * tmp[0]; } }, ctx);
  for (let e = 0; e < 2; e++) {          // end caps: the section filled from its spine
    if (o.caps && !o.caps[e]) continue;
    const cx = e ? x1 : x0, cz = e ? z1 : z0;
    quilt(B, { nu: 1, nv: ve.length - 1, vEdges: ve, su: 2, sv: sub, bulge: 0.9, tuft: true, body, cloth: o.cloth ?? CLOTH.RED, flip: e === 1, order: order(e),
      P: (u, v, out) => { sect(v, tmp); out[0] = cx + ox * tmp[0] * u; out[1] = y0 + tmp[1] * (0.5 + 0.5 * u) + (1 - u) * f * 0.25; out[2] = cz + oz * tmp[0] * u; } });
  }
  if ((o.bat ?? -1) >= 0) for (let i = 0; i < nu; i++) {
    if ((i + (o.batOdd ? 1 : 0)) % 2) continue;
    const u = (i + 0.5) / nu;
    if (o.skipBat && o.skipBat(i, nu)) continue;
    pillow(B, { x: x0 + (x1 - x0) * u, y: y0 + H - 2.2, z: z0 + (z1 - z0) * u, ax, az, hw: 2.75, hd: 4.9, h: 7.6, body, cloth: o.bat, order: order(u), sub });
  }
}

// a pillow battlement: a cushion with seams down its four corners, wide axis across the wall
function pillow(B, o) {
  const { x, y, z, ax, az, hw, hd, h } = o, ox = az, oz = -ax;
  quilt(B, { nu: 4, nv: 1, su: o.sub, sv: o.sub + 2, tuft: false, bulge: o.bulge ?? 0.5, body: o.body, cloth: o.cloth, order: o.order ?? -1,
    P: (u, v, out) => {
      const a = Math.PI * 2 * u + Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
      const k = Math.pow(Math.max(0, Math.sin(Math.PI * (0.13 + 0.87 * v))), 0.5);                  // a cushion: fat in the middle, closed on top
      const e = 0.8, sc = Math.sign(c) * Math.pow(Math.abs(c), e) * 1.12, ss = Math.sign(s) * Math.pow(Math.abs(s), e) * 1.12;
      const la = sc * hw * k, lo = ss * hd * k;       // along the wall, across it
      out[0] = x + ax * la + ox * lo; out[1] = y + h * v; out[2] = z + az * la + oz * lo;
    } });
}

// a tube of gores on a vertical axis with a radius profile rad(y) (metres), rings of seams at the given heights
function tube(B, o) { quilt(B, tubeOpts(o)); }
function tubeOpts(o) {
  const { x, z, ys, rad } = o, y0 = ys[0], y1 = ys[ys.length - 1];
  return { nu: o.gores ?? 12, nv: ys.length - 1, vEdges: ys.map((y) => (y - y0) / (y1 - y0)), su: o.sub ?? 4, sv: o.sv ?? o.sub ?? 4,
    bulge: o.bulge ?? 0.6, tuft: o.tuft, tuftK: o.tuftK, body: o.body, cloth: o.cloth, order: o.order ?? -1, flip: o.flip,
    P: (u, v, out) => { const y = y0 + (y1 - y0) * v, r = rad(y), a = Math.PI * 2 * u + (o.twist ?? 0); out[0] = x + r * Math.cos(a); out[1] = y; out[2] = z + r * Math.sin(a); } };
}

// turret: blue shaft with a fat collar, pink cone cap with an overhang (closed underneath), a yellow ball on the tip
function turret(B, x, z, body, sub) {
  const H = K.TURH, R = K.TURR;
  const shaft = (y) => R * (1.06 - 0.06 * y / H) + 1.6 * Math.exp(-((y - (H - 4)) * (y - (H - 4))) / 14);
  tube(B, { x, z, ys: [0, 11, 22, 33, 44, 54, H - 8, H], rad: shaft, body, cloth: CLOTH.BLUE, sub, bulge: 0.7 });
  const capR = (y) => { const t = (y - H) / K.CAPH; return Math.max(0.25, (R + 3) * (1 - t) * (1 + 0.18 * Math.sin(Math.PI * t))); };
  tube(B, { x, z, ys: [H, H + K.CAPH * 0.5, H + K.CAPH * 0.98], rad: capR, body, cloth: CLOTH.PINK, sub, bulge: 0.5, tuft: false });
  // the cap's underside: an annulus looking down
  quilt(B, { nu: 12, nv: 1, su: sub, sv: 1, bulge: 0.3, tuft: false, body, cloth: CLOTH.PINK,
    P: (u, v, out) => { const a = Math.PI * 2 * u, r = R * 0.7 + (R + 3 - R * 0.7) * v; out[0] = x + r * Math.cos(a); out[1] = H + 0.02; out[2] = z + r * Math.sin(a); } });
  ball(B, x, H + K.CAPH + 0.6, z, 1.7, body, CLOTH.YELLOW, sub);
}
function ball(B, x, y, z, r, body, cloth, sub) {
  quilt(B, { nu: 6, nv: 1, su: Math.max(2, sub - 1), sv: 6, bulge: 0.12 * r, tuft: false, body, cloth,
    P: (u, v, out) => { const a = Math.PI * 2 * u, b = Math.PI * (0.03 + 0.94 * v), s = Math.sin(b); out[0] = x + r * s * Math.cos(a); out[1] = y - r * Math.cos(b); out[2] = z + r * s * Math.sin(a); } });
}

// everything of the keep that is skin, into one batch. sub = quads across a panel (4 for the picture, 2 for the shadow).
// V = per-seed choices. Returns nothing; bodies are described by keepBodies().
async function buildKeep(B, V, sub, ctx, lines) {
  const { W, D, T, WALLH: H } = K, zc = D - T / 2, xc = W - T / 2, G = K.GATEW;
  const bat = CLOTH.YELLOW;
  // front wall in two halves either side of the gate; panels fill from the gate outward
  await wallLoaf(B, { x0: xc, z0: zc, x1: G, z1: zc, H, body: BODY.FRONT, bat, order: (u) => u, caps: [0, 1] }, sub, ctx);
  await wallLoaf(B, { x0: -G, z0: zc, x1: -xc, z1: zc, H, body: BODY.FRONT, bat, order: (u) => 1 - u, caps: [1, 0], batOdd: 1 }, sub, ctx);
  { // a square patch in the wrong colour, sewn on a front panel (its own seam all round)
    const nu = Math.round((xc - G) / 6), pw = (xc - G) / nu, i = V.patchPanel % nu, px = V.patchSide * (xc - pw * (i + 0.5)), py = 19, zf = zc + (T / 2) * (1.1 - 0.1 * py / (H - T / 2)) + 0.75 + 0.1;
    quilt(B, { nu: 1, nv: 1, su: sub, sv: sub, bulge: 0.22, body: BODY.FRONT, cloth: V.patchCloth, order: 1 - (i + 0.5) / nu,
      P: (u, v, out) => { const a = (u - 0.5) * 2, b = (v - 0.5) * 2; out[0] = px - a * 2.1; out[1] = py + b * 2.1; out[2] = zf - 0.6 * (a * a + b * b * 0.3); } });
  }
  await ctx.yield();
  // the lintel: a closed pillow beam over the gate (its body is a curtain: it droops shut as the wall sinks)
  const yc = (K.GATEH + H) / 2, hh = (H - K.GATEH) / 2;
  quilt(B, { nu: 3, nv: 8, su: sub, sv: sub, bulge: 0.7, body: BODY.LINTEL, cloth: (iu, iv) => (iv === 1 || iv === 2) && iu === 1 ? V.crest : CLOTH.RED, order: 1,
    P: (u, v, out) => { const a = Math.PI * 2 * v - Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
      out[0] = G + 0.5 - (2 * G + 1) * u; out[1] = yc + hh * Math.sign(s) * Math.pow(Math.abs(s), 0.6); out[2] = zc + (T / 2) * 1.04 * Math.sign(c) * Math.pow(Math.abs(c), 0.6); } });
  pillow(B, { x: 0, y: H - 2.2, z: zc, ax: -1, az: 0, hw: 3.4, hd: 4.8, h: 10.5, body: BODY.LINTEL, cloth: V.crest, order: 1, sub });
  await wallLoaf(B, { x0: -xc, z0: -zc, x1: xc, z1: -zc, H, body: BODY.BACK, bat, order: (u) => Math.abs(u - 0.5) * 1.6, caps: [0, 0],
    skipBat: (i, nu) => i === V.softPanel(nu) }, sub, ctx);
  await ctx.yield();
  await wallLoaf(B, { x0: -xc, z0: zc - T / 2, x1: -xc, z1: -zc + T / 2, H, body: BODY.LEFT, bat, order: (u) => u, caps: [0, 0] }, sub, ctx);
  await wallLoaf(B, { x0: xc, z0: -zc + T / 2, x1: xc, z1: zc - T / 2, H, body: BODY.RIGHT, bat, order: (u) => 1 - u, caps: [0, 0] }, sub, ctx);
  await ctx.yield();
  // the one battlement that is still soft at the reveal: its own body, standing on the back wall's crest
  { const nu = Math.round((2 * xc) / 6), u = (V.softPanel(nu) + 0.5) / nu; V.softX = -xc + 2 * xc * u;
    pillow(B, { x: V.softX, y: H - 2.2, z: -zc, ax: 1, az: 0, hw: 2.75, hd: 4.9, h: 7.6, body: BODY.SOFTB, cloth: bat, sub }); }
  // four turrets
  const tc = [[xc, zc], [-xc, zc], [xc, -zc], [-xc, -zc]];
  for (let i = 0; i < 4; i++) { turret(B, tc[i][0], tc[i][1], BODY.TUR + i, sub); await ctx.yield(); }
  // the Tall Tower: royal blue, one white band, a pink cap (cone, onion or crown by seed)
  const TH = K.TOWH, TR = K.TOWR, CH = K.TOWCAP;
  const ys = []; for (let y = 0; y <= TH + 0.01; y += TH / 10) ys.push(y);
  await quiltY(B, tubeOpts({ x: K.TOWX, z: K.TOWZ, ys, rad: (y) => TR * (1.05 - 0.07 * y / TH) + 1.3 * Math.exp(-((y - TH + 3) * (y - TH + 3)) / 10), gores: 10, sub: sub + 2,
    body: BODY.TOWER, bulge: (iu, iv) => (iv === V.band ? 1.0 : 0.65), cloth: (iu, iv) => (iv === V.band ? CLOTH.WHITE_ON_BLUE : CLOTH.BLUE), twist: V.twist }), ctx, 2);
  const capR = V.cap === 'onion'
    ? (y) => { const t = (y - TH) / CH; return Math.max(0.3, TR * 1.5 * Math.pow(Math.sin(Math.PI * (0.16 + 0.84 * t)), 0.8) * (1 - 0.3 * t)); }
    : V.cap === 'crown'
      ? (y) => { const t = (y - TH) / CH; return Math.max(0.3, t < 0.4 ? TR * (1.15 + 0.75 * t / 0.4) : TR * 1.2 * (1 - (t - 0.4) / 0.6)); }
      : (y) => { const t = (y - TH) / CH; return Math.max(0.3, (TR + 3) * (1 - t) * (1 + 0.2 * Math.sin(Math.PI * t))); };
  tube(B, { x: K.TOWX, z: K.TOWZ, ys: [TH, TH + CH * 0.2, TH + CH * 0.4, TH + CH * 0.7, TH + CH * 0.985], rad: capR, gores: 10, sub: sub + 2, sv: 4, body: BODY.TOWER, cloth: CLOTH.PINK, bulge: 0.45, tuft: false, twist: V.twist });
  quilt(B, { nu: 10, nv: 1, su: sub, sv: 1, bulge: 0.25, tuft: false, body: BODY.TOWER, cloth: CLOTH.PINK,
    P: (u, v, out) => { const a = Math.PI * 2 * u + V.twist, r = TR * 0.6 + (capR(TH) - TR * 0.6) * v; out[0] = K.TOWX + r * Math.cos(a); out[1] = TH + 0.02; out[2] = K.TOWZ + r * Math.sin(a); } });
  ball(B, K.TOWX, TH + CH + 0.8, K.TOWZ, 2.0, BODY.TOWER, CLOTH.YELLOW, sub);
  await ctx.yield();
  { // the craft at arm's length, on the side the flight passes (local -x, toward the gate): a square patch in the wrong
    // colour with its own zigzag hem, and webbing loops with D-rings and a hanging tail
    const surf = (ang, y) => { const uu = (((ang - V.twist) / (Math.PI * 2)) % 1 + 1) % 1, sg = (uu * 10) % 1, q = 2 * ((y / (TH / 10)) % 1) - 1;
      return TR * (1.05 - 0.07 * y / TH) + (Math.floor(y / (TH / 10)) === V.band ? 1.0 : 0.65) * Math.sin(Math.PI * sg) * (1 - q * q * q * q); };
    const sp = (ang, y, dr) => { const r = surf(ang, y) + dr; return [K.TOWX + r * Math.cos(ang), y, K.TOWZ + r * Math.sin(ang)]; };
    const patch = (a0, y0, half, cloth) => {
      const da = half / (TR + 0.6);
      quilt(B, { nu: 1, nv: 1, su: sub, sv: sub, bulge: 0.1, body: BODY.TOWER, cloth,
        P: (u, v, out) => { const p = sp(a0 + (u - 0.5) * 2 * da, y0 + (v - 0.5) * 2 * half, 0.07); out[0] = p[0]; out[1] = p[1]; out[2] = p[2]; } });
      if (!lines) return;
      const pts = [], n = 37, h = half + 0.07;
      for (let side = 0; side < 4; side++) for (let i = 0; i < n; i++) {
        const f = (i / n) * 2 - 1, zz = (i % 2 ? 0.055 : -0.055);
        const px = side === 0 ? f : side === 1 ? 1 + zz / h : side === 2 ? -f : -1 - zz / h, py = side === 0 ? -1 - zz / h : side === 1 ? f : side === 2 ? 1 + zz / h : -f;
        pts.push(sp(a0 + px * h / (TR + 0.6), y0 + py * h, 0.12));
      }
      pts.push(pts[0]); ribbon(B, pts, 0.04, CLOTH.WEB, BODY.TOWER);
    };
    patch(2.5, 56.3, 1.25, V.towerPatch ?? CLOTH.YELLOW);
    patch(3.45, 66.5, 0.95, CLOTH.WHITE);
    if (lines) for (const [a0, y0] of [[2.78, 62.6], [2.3, 51.5], [3.1, 53.5], [3.25, 71.5], [2.05, 67]]) {
      const strap = []; for (let i = 0; i <= 6; i++) strap.push(sp(a0, y0 + 0.8 - i * 0.27, 0.06));
      ribbon(B, strap, 0.24, CLOTH.WEB, BODY.TOWER);
      const loop = []; for (let i = 0; i <= 6; i++) { const b = Math.PI * i / 6; loop.push(sp(a0, y0 + 0.2 * Math.cos(b), 0.06 + 0.2 * Math.sin(b))); }
      ribbon(B, loop, 0.2, CLOTH.WEB, BODY.TOWER);
      const ring = []; for (let i = 0; i <= 10; i++) { const b = Math.PI * 2 * i / 10; ring.push(sp(a0, y0 - 0.24 + 0.24 * Math.cos(b), 0.3 + 0.2 * Math.sin(b))); }
      ribbon(B, ring, 0.08, CLOTH.WEB, BODY.TOWER);
      ribbon(B, [sp(a0, y0 - 0.46, 0.3), sp(a0 + 0.012, y0 - 1.0, 0.16), sp(a0 + 0.02, y0 - 1.7, 0.1), sp(a0 + 0.016, y0 - 2.5, 0.08)], 0.16, CLOTH.WEB, BODY.TOWER);
    }
    if (lines) {
      // what is sewn on the skin where the flight passes, at reading size: a row of small arched windows along the foot of the white band
      // (each a pillow panel with its own hem), a roped belt in two cloths along the band's two edges, and the tower's number
      // printed on the white in strokes of blue cloth
      for (let a0 = 1.66; a0 < 4.9; a0 += 0.26) {
        if (Math.abs(a0 - 2.3) < 0.14 || Math.abs(a0 - 3.1) < 0.15) continue;          // the webbing loops hang there
        const da = 0.75 / (TR + 0.6);
        quilt(B, { nu: 1, nv: 2, vEdges: [0, 0.6, 1], su: 2, sv: 2, bulge: 0.1, body: BODY.TOWER, cloth: (iu, iv) => (iv ? CLOTH.YELLOW : CLOTH.PINK),
          P: (u, v, out) => { const k = v > 0.6 ? Math.sqrt(Math.max(0, 1 - ((v - 0.6) / 0.4) * ((v - 0.6) / 0.4))) : 1, p = sp(a0 + (u - 0.5) * 2 * da * (0.3 + 0.7 * k), 51.2 + 2.7 * v, 0.09); out[0] = p[0]; out[1] = p[1]; out[2] = p[2]; } });
      }
      for (const yb of [50, 60]) quilt(B, { nu: 20, nv: 1, su: 2, sv: 3, bulge: 0, tuft: false, body: BODY.TOWER, cloth: (iu) => (iu % 2 ? CLOTH.PINK : CLOTH.YELLOW),
        P: (u, v, out) => { const ang = Math.PI * 2 * u + V.twist, r = TR * (1.05 - 0.07 * yb / TH) + 0.12 + 0.5 * Math.sin(Math.PI * v); out[0] = K.TOWX + r * Math.cos(ang); out[1] = yb - 0.75 + 1.5 * v; out[2] = K.TOWZ + r * Math.sin(ang); } });
      const DIG = { 4: [[0.78, 0], [0.78, 2], [0, 0.7], [1, 0.7]], 7: [[0, 2], [1, 2], [0.38, 0]], 1: [[0.5, 0], [0.5, 2], [0.12, 1.55]], 2: [[0, 1.6], [0.25, 2], [0.75, 2], [1, 1.6], [1, 1.25], [0, 0], [1, 0]] };
      const num = V.number ?? '47', sc = 1.5, a1 = 2.9 + 0.5 * (num.length * 1.45 - 0.45) * sc / (TR + 0.6);
      for (let d = 0; d < num.length; d++) {
        const st = DIG[num[d]] || DIG[7], hw = 0.2;          // each stroke is a fat sewn tube of cloth: its own seam all round and one sheen bar          // each stroke is a strip of cloth lying on the skin's bulge, hemmed like any panel
        for (let i = 0; i < st.length - 1; i++) {
          const x0 = st[i][0], y0 = st[i][1], x1 = st[i + 1][0], y1 = st[i + 1][1], l = Math.hypot(x1 - x0, y1 - y0) || 1, dx = (x1 - x0) / l, dy = (y1 - y0) / l;
          quilt(B, { nu: 1, nv: 1, su: 4, sv: Math.max(2, Math.round(l * 2.5)), tuft: false, bulge: 0.24, body: BODY.TOWER, cloth: CLOTH.BLUE,
            P: (u, v, out) => { const w = (u - 0.5) * 2 * hw, q = -hw + (l + 2 * hw) * v, x = x0 + dx * q - dy * w, y = y0 + dy * q + dx * w, p = sp(a1 - (d * 1.45 + x) * sc / (TR + 0.6), 54.7 + y * sc, 0.1);
              out[0] = p[0]; out[1] = p[1]; out[2] = p[2]; } });
        }
      }
    }
  }
  // the courtyard: a yellow quilted floor at y 14
  const cs = Math.max(2, sub - 1);
  await quiltY(B, { nu: 20, nv: 16, su: cs, sv: cs, bulge: 0.8, body: BODY.COURT, cloth: CLOTH.YELLOW,
    P: (u, v, out) => { out[0] = -(xc - 3) + 2 * (xc - 3) * u; out[1] = K.COURT; out[2] = -(zc - 3) + 2 * (zc - 3) * v; } }, ctx);
  // the yard's centre mark, sewn on the floor's own body (it sinks and comes back with the floor): a ring of white pillows round a red boss
  if (lines) {
    const M = K.MARK, yM = K.COURT + 0.75;
    quilt(B, { nu: 12, nv: 1, su: 3, sv: 3, bulge: 1.0, body: BODY.COURT, cloth: CLOTH.WHITE, flip: true,
      P: (u, v, out) => { const a = Math.PI * 2 * u, r = M * (0.72 + 0.28 * v); out[0] = r * Math.cos(a); out[1] = yM; out[2] = r * Math.sin(a); } });
    quilt(B, { nu: 6, nv: 1, su: 3, sv: 3, bulge: 1.4, body: BODY.COURT, cloth: CLOTH.RED, flip: true,
      P: (u, v, out) => { const a = Math.PI * 2 * u, r = M * (0.03 + 0.42 * v); out[0] = r * Math.cos(a); out[1] = yM + 0.1; out[2] = r * Math.sin(a); } });
  }
  await ctx.yield();
  // the big fan at the gate: a black drum the size of a house on its side, and a fat red sleeve into the wall's foot
  const fx = V.fanX, fy = 5.6, fr = 5.2, fz0 = D + 10, fz1 = D + 17;
  quilt(B, { nu: 12, nv: 1, su: 2, sv: 1, bulge: 0, tuft: false, body: BODY.STATIC, cloth: CLOTH.WEB,
    P: (u, v, out) => { const a = Math.PI * 2 * u; out[0] = fx + fr * Math.cos(a); out[1] = fy + fr * Math.sin(a); out[2] = fz1 - (fz1 - fz0) * v; } });
  quilt(B, { nu: 12, nv: 1, su: 2, sv: 1, bulge: 0, tuft: false, body: BODY.STATIC, cloth: CLOTH.WEB,
    P: (u, v, out) => { const a = Math.PI * 2 * u; out[0] = fx + fr * v * Math.cos(a); out[1] = fy + fr * v * Math.sin(a); out[2] = fz1 - 1.2; } });
  quilt(B, { nu: 8, nv: 2, su: sub, sv: sub, bulge: 0.5, body: BODY.SLEEVE, cloth: CLOTH.RED,
    P: (u, v, out) => { const a = Math.PI * 2 * u, r = fr * 0.86 + 1.4 * v; out[0] = fx + r * Math.cos(a); out[1] = Math.max(0.1, fy + r * Math.sin(a) + 0.8 * v); out[2] = fz0 + 0.3 - (fz0 + 0.3 - (D - 2)) * v; } });
  if (lines) {
    // the fan's cloth rim: a fat pillow ring in the battlements' cloth sewn round the drum's mouth, and a second one where the sleeve
    // leaves the drum; guard hoops of webbing across the mouth (two rings and four spokes, before the rotor); and the sleeve's own
    // cuff: a fat collar in the same cloth where the sleeve goes into the wall's foot (it swells and slackens with the sleeve)
    for (const [zr, R0, r0] of [[fz1 - 0.2, fr + 0.5, 1.25], [fz0 + 0.4, fr + 0.3, 0.9]]) quilt(B, { nu: 12, nv: 3, su: 2, sv: 2, bulge: 0.3, tuft: false, body: BODY.STATIC, cloth: bat, flip: true,
      P: (u, v, out) => { const a = Math.PI * 2 * u, b = Math.PI * 2 * v, r = R0 + r0 * Math.cos(b); out[0] = fx + r * Math.cos(a); out[1] = Math.max(0.12, fy + r * Math.sin(a)); out[2] = zr + r0 * Math.sin(b); } });
    for (const rh of [fr * 0.36, fr * 0.7]) { const pts = []; for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI * 2; pts.push([fx + rh * Math.cos(a), fy + rh * Math.sin(a), fz1 + 0.35]); } hose(B, pts, 0.16, CLOTH.WEB, BODY.STATIC, 4); }
    for (let i = 0; i < 4; i++) { const a = (i + 0.5) / 4 * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); hose(B, [[fx + 0.5 * c, fy + 0.5 * sn, fz1 + 0.35], [fx + fr * c, fy + fr * sn, fz1 + 0.35]], 0.16, CLOTH.WEB, BODY.STATIC, 4); }
    quilt(B, { nu: 8, nv: 3, su: 2, sv: 2, bulge: 0.35, tuft: false, body: BODY.SLEEVE, cloth: bat, flip: true,
      P: (u, v, out) => { const a = Math.PI * 2 * u, b = Math.PI * 2 * v, r = fr * 0.86 + 1.5 + 1.1 * Math.cos(b); out[0] = fx + r * Math.cos(a); out[1] = Math.max(0.12, fy + 0.6 + r * Math.sin(a)); out[2] = D + 1.2 + 1.1 * Math.sin(b); } });
    // guy lines: webbing from the walls' outer faces to pegs; the peg end is pinned (aInfo.w = 1), so a sinking wall slackens them
    const guy = (x, y, z, ox, oz, body) => strap(B, [x, y, z], [x + ox * 17, 0.15, z + oz * 17], { body, pins: [0, 1] });
    for (let x = -xc + 15; x <= xc - 15; x += 18) { if (Math.abs(x) > G + 6 && Math.abs(x - fx) > 9) guy(x, 33, zc + T / 2 + 0.6, 0, 1, BODY.FRONT); guy(x, 33, -zc - T / 2 - 0.6, 0, -1, BODY.BACK); }
    for (let z = -zc + 17; z <= zc - 17; z += 18) { guy(-xc - T / 2 - 0.6, 33, z, -1, 0, BODY.LEFT); guy(xc + T / 2 + 0.6, 33, z, 1, 0, BODY.RIGHT); }
    ribbon(B, [[fx - 4, 0.3, fz0 + 1], [fx - 4, 0.3, fz1 - 1]], 1.2, CLOTH.WEB, BODY.STATIC); ribbon(B, [[fx + 4, 0.3, fz0 + 1], [fx + 4, 0.3, fz1 - 1]], 1.2, CLOTH.WEB, BODY.STATIC);
  }
}

// static description of each body for the uniform arrays: [foot x,y,z, H], [dir x,z, hinge, sinkMin], [mask x,z, rs0, phase]
function keepBodies(V) {
  const { W, D, T, WALLH: H } = K, zc = D - T / 2, xc = W - T / 2, s = 20 / 45, b = [];
  const set = (id, bp, bd, bx) => { b[id] = { bp, bd, bx }; };
  set(BODY.STATIC, [0, 0, 0, 1], [0, 1, 0.5, 1], [0, 0, 1, 0]);
  set(BODY.FRONT, [0, 0, zc, H + 6], [0, 1, 0.5, s], [0, 1, 1.22, 0.13]);
  set(BODY.LINTEL, [0, -27.5, zc, 78.5], [0, 1, 0.5, 0.655], [0, 1, 1.15, 0.31]);   // curtain map: y 45 -> 20, y 16 -> 1
  set(BODY.BACK, [0, 0, -zc, H + 6], [0, -1, 0.5, s], [0, 1, 1.22, 0.47]);
  set(BODY.LEFT, [-xc, 0, 0, H + 6], [-1, 0, 0.5, s], [1, 0, 1.22, 0.59]);
  set(BODY.RIGHT, [xc, 0, 0, H + 6], [1, 0, 0.5, s], [1, 0, 1.22, 0.71]);
  const tc = [[xc, zc], [-xc, zc], [xc, -zc], [-xc, -zc]];
  for (let i = 0; i < 4; i++) { const l = Math.hypot(tc[i][0] * 1.3, tc[i][1]); set(BODY.TUR + i, [tc[i][0], 0, tc[i][1], K.TURH + K.CAPH], [tc[i][0] * 1.3 / l, tc[i][1] / l, 0.45, 0.88], [1, 1, 0.5, 0.2 + i * 0.17]); }
  const fl = Math.hypot(V.foldX, 1);
  set(BODY.TOWER, [K.TOWX, 0, K.TOWZ, K.TOWH + K.TOWCAP], [V.foldX / fl, 1 / fl, 0.33, 0.95], [1, 1, 0.55, 0.83]);
  set(BODY.COURT, [0, 0, 0, K.COURT], [0, 1, 0.5, 0.4], [0, 0, 1, 0.37]);
  set(BODY.SOFTB, [V.softX, H - 2.2, -zc, 8.2], [V.softDir, 0, 0.5, 0.55], [1, 1, 0.75, 0.91]);
  set(BODY.SLEEVE, [V.fanX, 5.6, D + 4, 8], [0, 1, 0.5, 0.45], [1, 0, 0.45, 0.66]);
  return b;
}

// ---- the keep's timeline: a pure function of path time t (seconds). Writes S[id] = [p, kink, lean, tip]. ----
const ss = smoothstep;
function spring(w, damp, freq) { return w <= 0 ? 1 : Math.exp(-damp * w) * Math.cos(freq * w); }
// (no array or closure is made per call: update() runs this every frame)
const TL_WILT = [12.8, 13.7, 14.6, 15.5], TL_POP = [23.5, 24.2, 27.0, 28.0];
const tlPut = (S, i, a, b, c, d) => { const r = S[i] || (S[i] = [0, 0, 0, 0]); r[0] = a; r[1] = b; r[2] = c; r[3] = d; };
const tlWall = (t, down0, down1, up0, up1) => 1 - ss(down0, down1, t) * (1 - ss(up0, up1, t));
const tlOver = (t, t0) => 0.05 * (t > t0 ? Math.exp(-(t - t0) * 2.2) * Math.sin((t - t0) * 7) : 0);
function keepTimeline(t, S, V, out = {}) {
  out.fan = 1; out.stream = 0.9; out.softY = 1;
  // the big fan stalls when the gust arrives and catches again when the carts couple at 18 s
  out.fan = 1 - ss(12.2, 13.6, t) + ss(18.0, 19.6, t) * (1 + 0.35 * (1 - ss(19.6, 22, t)));
  const pF = 1 - ss(13.0, 18.0, t) + (t > 18.6 ? clamp((t - 18.6) / 4.4, 0, 1) : 0);          // the front wall is full at 23.0 exactly
  tlPut(S, BODY.STATIC, 1, 0, 0, 0);
  tlPut(S, BODY.FRONT, Math.min(pF, 1) + Math.max(0, tlOver(t, 23.0)), 0, 0, 0);
  tlPut(S, BODY.LINTEL, S[BODY.FRONT][0], 0, 0, 0);
  tlPut(S, BODY.LEFT, tlWall(t, 13.4, 18.2, 21.0, 25.0), 0, 0, 0);
  tlPut(S, BODY.RIGHT, tlWall(t, 13.6, 18.4, 21.4, 25.4), 0, 0, 0);
  tlPut(S, BODY.BACK, tlWall(t, 13.9, 18.6, 24.0, 27.4), 0, 0, 0);
  tlPut(S, BODY.COURT, tlWall(t, 13.5, 18.0, 20.0, 24.0), 0, 0, 0);
  tlPut(S, BODY.SLEEVE, clamp(out.fan, 0.12, 1.08), 0, 0, 0);
  // turrets wilt outward one after another, and pop upright: front left (+x here), front right, then the back pair
  for (let i = 0; i < 4; i++) {
    const d = ss(TL_WILT[i], TL_WILT[i] + 2.4, t), w = t - TL_POP[i];
    const up = w > 0 ? 1 - spring(w, 3.2, 7.0) : 0;                  // 0 -> 1 with an overshoot and two wobbles
    const a = d * (1 - up);
    tlPut(S, BODY.TUR + i, 1 - 0.55 * clamp(a, 0, 1) + (w > 0 ? 0.06 * Math.exp(-w * 2) * Math.sin(w * 6) : 0), 0.6 * a, V.wilt[i] * a, 1.0 * clamp(a, 0, 1));
  }
  // the Tall Tower: kinks at 12 s, folds over the front wall, is lifted by the swelling wall, whips up at 24.3-25 s
  const fold = ss(12.0, 14.8, t), lift = ss(19.0, 23.0, t), w = t - 23.45;
  let kink = V.fold * fold * (1 - 0.36 * lift) + 0.05 * fold * Math.sin(t * 1.3) * (1 - lift);
  let tip = 1.15 * ss(12.6, 15.2, t) * (1 + 0.15 * lift), pT = 1 - 0.5 * ss(12.3, 15.0, t), lean = 0.05 * fold;
  if (w > 0) { const k = spring(w, 2.3, 4.6); kink *= k; tip *= Math.max(0, 1 - w / 0.5); lean *= k; pT = pT + (1 - pT) * ss(0, 0.6, w) + 0.06 * Math.exp(-w * 2) * Math.sin(w * 6); }
  tlPut(S, BODY.TOWER, pT, kink, lean, tip);
  out.stream = 0.9 - 0.6 * fold * (w > 0 ? Math.max(0, 1 - w / 0.8) : 1);
  // the soft battlement rides the back wall's crest and never quite fills
  const pBv = clamp((S[BODY.BACK][0] - V.softOrder * 0.6) / 0.4, 0, 1);
  out.softY = lerp(20 / 45, 1, pBv);
  tlPut(S, BODY.SOFTB, 0.5 + 0.1 * Math.sin(t * 0.9) - 0.3 * (1 - pBv), 0, 0.5 + 0.12 * Math.sin(t * 0.7), 0.5);
  return out;
}

// an air-dancer's arm: a fat soft tube 9 m long from the shoulder (y 16.5), round in section, long scalloped gores,
// a closed round tip. aInfo.w = metres out from the shoulder, signed by side: the vertex shader throws it in one curve.
function armTube(B, sd, o = {}) {
  const R = o.r ?? 0.74, L = 8.3, n0 = B.count, gores = o.gores ?? 5, su = o.su ?? 3;
  quilt(B, { nu: gores, nv: 1, su, sv: o.sv ?? 8, bulge: o.bulge ?? 0.13, tuft: false, cloth: 0, bar1: 1.15,
    P: (u, v, out) => { const a = Math.PI * 2 * u, r = R * (1 - 0.28 * v); out[0] = sd * (0.8 + L * v); out[1] = 16.5 + 1.2 * v + r * Math.cos(a) * sd; out[2] = r * Math.sin(a); } });
  quilt(B, { nu: gores, nv: 1, su, sv: o.tip ?? 3, bulge: (o.bulge ?? 0.13) * 0.5, tuft: false, cloth: 0, sheen: false,
    P: (u, v, out) => { const a = Math.PI * 2 * u, b = v * Math.PI * 0.5, r = R * 0.72 * Math.cos(b * 0.98); out[0] = sd * (0.8 + L + 0.75 * Math.sin(b)); out[1] = 17.7 + r * Math.cos(a) * sd; out[2] = r * Math.sin(a); } });
  B.pinRange(n0, B.count, (x) => sd * Math.max(0, Math.abs(x) - 0.8));
}

// an air-dancer for skin({ instanced: true, tube: true, sinkMin: 0.25, rs0: 0.5 }): tube 25 m x 2.2 m on a black drum,
// two 9 m arms, a fringe at the open top. Cloth index 0 everywhere = the instance's first cloth. Foot at the origin.
function airDancer(B, sub = 4) {
  quilt(B, { nu: 8, nv: 1, su: 1, sv: 1, bulge: 0, tuft: false, cloth: CLOTH.WEB, P: (u, v, out) => { const a = Math.PI * 2 * u; out[0] = 1.7 * Math.cos(a); out[1] = 1.6 * v; out[2] = 1.7 * Math.sin(a); } });
  const ys = [1.2, 5, 9, 13, 17, 21, 25];
  tube(B, { x: 0, z: 0, ys, rad: (y) => 1.1 * (1 + 0.25 * Math.exp(-(y - 1.2) * 0.8)), gores: 4, sub, sv: 3, bulge: 0.2, tuftK: 0.05, cloth: 0 });      // one straight tube: the ring is a stitched double row, its pinch a finger deep
  for (const sd of [-1, 1]) armTube(B, sd, { gores: 5, su: 2, sv: 7, tip: 2 });
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); ribbon(B, [[c * 1.05, 24.8, s * 1.05], [c * 1.5, 26.4, s * 1.5], [c * 2.3, 27.6, s * 2.3]], 0.5, 0, 0); }
}

// ---------------------------------------------------------------------------------------------------
// buildHero(ctx, opts) -> the keep. opts: style (the world's makeStyle instance; without it the piece makes its
//   own, with a tarpaulin apron, shadow sun and a looping timeline, for the set-piece viewer), palette (7 hex),
//   detail 0.6..1 (thins panel subdivision, never the bodies), cap 'cone' | 'onion' | 'crown' (default by seed),
//   apron (ground patch; default only without opts.style), dancers (the gate's pair of air-dancers; default only
//   without opts.style), duration (seconds of path for setProgress, default 41).
// SIZE  150 m wide (x -75..75), 120 m deep (z -60..60), walls 45 m, turrets 80 m, Tall Tower 120 m at (20, 8).
//   radius 100, height 121. FRONT (gate, big fan, avenue) is +Z: the world turns the piece by PI about Y so that the
//   gate faces the entry; then local +x is the camera's LEFT (the tower's side).
// TIME  hero.setProgress(u) (u of the world's path, 0..1 -> t = u * duration s) or hero.setTime(t). Timeline in path
//   seconds: whole until 12; tower kinks 12-14.8 and folds over the front wall; fan stalls 12.2-13.6; turrets wilt
//   12.8-18; walls sink 13-18.6 (45 -> 20 m), gate droops shut; fan restarts 18; front wall swells from its ends to
//   the gate, crest and lintel full at 23.0 exactly; front turrets pop 23.5 (+x), 24.2 (-x); tower whips up from
//   23.45, upright at 23.8, overshoot at 24.05, still by 25 (it stands for the whole close pass); side walls 25, back wall 27.4, back turrets 27, 28. One battlement on
//   the back wall stays soft. Until setProgress/setTime is called the piece loops the timeline on world time.
// ANCHORS (local): gate, fan, crest (front crest centre, y 45), towerTop, towerAxis, towerFold (unit xz the tower
//   folds toward), flyThrough (camera line front -> back, >= 7 m clear at full pressure; sagging only moves cloth
//   away; the folded tower lies over the front wall between x 22 and 45), hoseSeats (six points at the front wall's
//   foot for the fan carts), fishSeats (eight on the back wall's crest for windsock poles), courtyard (the yard's centre, where its
//   centre mark is sewn; courtMark = the mark's width in metres), softBattlement,
//   viewpoints.entry / .reveal, sunLocal (the style's sun as the piece used it; world space with opts.style).
// COST  about 78k triangles at detail 1 (skin 58.6k + shadow copy 19.2k + streamers, blades), 4 draw calls with
//   the world's style (skin, shadow, streamers, blades), 6 standalone; 3 shader programs; no lights, no textures.
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, own = !opts.style, detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  // standalone the piece is not turned, so the course runs toward -Z: sun 70 degrees left of that, wind toward -Z
  const style = opts.style ?? makeStyle(ctx, { palette: opts.palette, sun: new THREE.Vector3(-0.441, 0.883, -0.161) });
  if (own) { style.uniforms.uWind.value.set(0.2, -0.98); style.uniforms.uGust.value.set(0.2, -0.98, 60, 9); }
  const V = {
    cap: opts.cap ?? rng.pick(['cone', 'cone', 'onion', 'crown']), band: (rng.int(5, 7), 5), twist: rng.range(0, 6.28),
    crest: rng.pick([CLOTH.YELLOW, CLOTH.PINK, CLOTH.YELLOW]), fanX: rng.sign() * rng.range(23, 29),
    foldX: rng.range(0.28, 0.5), fold: rng.range(1.84, 1.9), wilt: [0, 1, 2, 3].map(() => rng.range(0.42, 0.6)),
    softR: rng.range(0.12, 0.88), softDir: rng.sign(), softX: 0, softOrder: 0,
    patchPanel: rng.int(2, 6), patchSide: rng.sign(), patchCloth: rng.pick([CLOTH.GREEN, CLOTH.WHITE, CLOTH.GREEN, CLOTH.YELLOW]),
  };
  V.softPanel = (nu) => 2 * Math.round((V.softR * (nu - 1)) / 2);
  { const nu = Math.round((2 * (K.W - K.T / 2)) / 6); V.softOrder = Math.abs((V.softPanel(nu) + 0.5) / nu - 0.5) * 1.6; }
  V.towerPatch = style.pal.yellow.equals(style.pal.white) ? CLOTH.PINK : CLOTH.YELLOW;      // the wrong colour must not be the band's own
  const object = new THREE.Group(); object.name = 'keep';
  const sub = detail >= 0.95 ? 4 : 3;
  const B = style.batch(); await buildKeep(B, V, sub, ctx, true); await ctx.yield();
  const geo = B.geometry(); await ctx.yield();
  const B2 = style.batch(); await buildKeep(B2, V, 2, ctx, false); await ctx.yield();
  const geoS = B2.geometry(); await ctx.yield();
  const skin = style.skin({ bodies: BODY.N });
  const bodies = keepBodies(V), U = skin.uniforms;
  for (let i = 0; i < BODY.N; i++) { const b = bodies[i]; U.uBP.value[i].fromArray(b.bp); U.uBD.value[i].fromArray(b.bd); U.uBX.value[i].fromArray(b.bx); }
  const mesh = new THREE.Mesh(geo, skin); mesh.frustumCulled = false; object.add(mesh);
  const shadow = new THREE.Mesh(geoS, style.skin({ shadow: true, share: skin })); shadow.frustumCulled = false; shadow.renderOrder = 2; object.add(shadow);
  // twelve yellow streamers 15 m long from the Tall Tower's tip
  const SB = style.batch(), tipY = K.TOWH + K.TOWCAP + 2.2;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, ph = rng(), L = 15 * rng.range(0.9, 1.1), rx = K.TOWX + 0.7 * Math.cos(a), rz = K.TOWZ + 0.7 * Math.sin(a);
    let p0 = -1, p1 = -1;
    for (let j = 0; j <= 14; j++) {
      const s = j / 14, v0 = SB.vert(rx, tipY, rz, 0, 1, 0, s, -1, ph, 0.6, BODY.TOWER, CLOTH.YELLOW, -1, L), v1 = SB.vert(rx, tipY, rz, 0, 1, 0, s, 1, ph, 0.6, BODY.TOWER, CLOTH.YELLOW, -1, L);
      if (j) { SB.tri(p0, v0, p1); SB.tri(p1, v0, v1); } p0 = v0; p1 = v1;
    }
  }
  const streamers = new THREE.Mesh(SB.geometry(), style.skin({ streamer: true, share: skin })); streamers.frustumCulled = false; object.add(streamers);
  await ctx.yield();
  // fan blades: a soft five-bladed white rotor in the drum's mouth, under 0.8 turns a second
  const bl = []; const bi = [];
  // (five slender swept blades round a small hub: read at any distance as a fan, never as dots on a ball)
  for (let i = 0; i <= 120; i++) { const a = (i / 120) * Math.PI * 2, c5 = Math.abs(Math.cos(2.5 * a)), r = 4.7 * (0.17 + 0.83 * Math.pow(c5, 2.4)), aa = a + 0.55 * r / 4.7; bl.push(r * Math.cos(aa), r * Math.sin(aa), 0); }
  bl.push(0, 0, 0); for (let i = 0; i < 120; i++) bi.push(121, i, i + 1);
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bl, 3)); bg.setIndex(bi);
  const blades = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: style.pal.white, side: THREE.DoubleSide, toneMapped: false }));
  blades.position.set(V.fanX, 5.6, K.D + 17 - 0.9); object.add(blades);
  if (opts.apron ?? own) {
    const ap = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), style.ground()); ap.rotation.x = -Math.PI / 2; ap.renderOrder = -0.5; object.add(ap);
  }
  let dancers = null;
  if (opts.dancers ?? own) {
    const DB = style.batch(); airDancer(DB, sub); const dg = DB.geometry();
    const dm = style.skin({ instanced: true, tube: true, sinkMin: 0.25, rs0: 0.5 });
    dancers = new THREE.InstancedMesh(dg, dm, 2); dancers.frustumCulled = false;
    const iB = new Float32Array(8), iS = new Float32Array(8), m4 = new THREE.Matrix4();
    for (let i = 0; i < 2; i++) {
      const sd = i ? -1 : 1; m4.makeRotationY(rng.range(-0.3, 0.3)).setPosition(sd * 13, 0, K.D + 34); dancers.setMatrixAt(i, m4);
      iB.set([27.6, rng.range(0.4, 0.55), rng(), 2.3], i * 4); iS.set([0, 0, 0.3, i ? CLOTH.PINK : CLOTH.YELLOW], i * 4);
    }
    dg.setAttribute('iBody', new THREE.InstancedBufferAttribute(iB, 4)); dg.setAttribute('iState', new THREE.InstancedBufferAttribute(iS, 4));
    object.add(dancers);
  }
  await ctx.yield();

  const v3 = (x, y, z) => new THREE.Vector3(x, y, z), zc = K.D - K.T / 2, xc = K.W - K.T / 2;
  const fl = Math.hypot(V.foldX, 1);
  const anchors = {
    gate: v3(0, 0, K.D), fan: v3(V.fanX, 5.6, K.D + 13.5), crest: v3(0, K.WALLH, zc), courtyard: v3(0, K.COURT, 0), courtMark: 2 * K.MARK /* the centre mark's width, metres */,
    towerAxis: v3(K.TOWX, 0, K.TOWZ), towerTop: v3(K.TOWX, K.TOWH + K.TOWCAP, K.TOWZ), towerFold: v3(V.foldX / fl, 0, 1 / fl),
    softBattlement: v3(V.softX, K.WALLH + 4, -zc),
    flyThrough: [v3(0, 12, 190), v3(0, 14, 130), v3(0, 34, 86), v3(0, 52, zc), v3(1, 62, 22), v3(2, 74, -14), v3(2, 86, -zc), v3(0, 84, -100)],
    hoseSeats: [-50, -34, -18, 18, 34, 50].map((x) => v3(x, 0, K.D + 2)),
    fishSeats: [-42, -30, -18, -6, 6, 18, 30, 42].map((x) => v3(x, K.WALLH + 5, -zc)),
    viewpoints: { entry: v3(0, 2.5, 460), reveal: v3(2, 86, -zc) },
    sunLocal: style.uniforms.uSun.value.clone(),
  };

  const S = [], tlOut = {}; let manual = null, fanAngle = 0;
  const duration = opts.duration ?? 41;
  const softFootY = bodies[BODY.SOFTB].bp[1];
  function apply(t) {
    const o = keepTimeline(t, S, V, tlOut);
    for (let i = 0; i < BODY.N; i++) U.uBS.value[i].fromArray(S[i]);
    U.uBP.value[BODY.SOFTB].y = softFootY * o.softY;
    streamers.material.uniforms.uStream.value = o.stream;
    return o;
  }
  apply(0);
  return {
    object, radius: 100, height: 121, center: v3(0, 50, 0), anchors, style, ground: false, groundY: 0,
    setProgress(u) { manual = clamp(u, 0, 1) * duration; }, setTime(t) { manual = t; },
    timeline: (t) => keepTimeline(t, [], V),
    update(dt, time, camera) {
      if (own) style.update(dt, time, camera);
      const t = manual ?? (time % 34) + 2;   // standalone loop: the timeline from its own beginning, round and round
      const o = apply(t);
      fanAngle += Math.min(dt, 0.1) * o.fan * 3.6;                   // 0.57 turns a second at full speed (five blades: under three passes a second)
      blades.rotation.z = fanAngle;
    },
    dispose() {},
  };
}
