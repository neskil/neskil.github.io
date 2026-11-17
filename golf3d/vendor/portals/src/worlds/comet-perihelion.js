// Perihelion. Slung under a solar sail we cross the night side of a comet as it rounds the sun,
// watch the crust wake into a hundred geysers at sunrise (the hero set piece, src/parts), and are
// blown off the surface and down the length of its two tails to a ring in a braid of the ion tail.
//
// World space is the hero's local space: the camera enters at (0,14,325) flying -Z, the sun rises
// 15 degrees left of that heading, the cliff is on the right at z = -235. Everything that must
// coincide with the camera is keyed to SCRIPT TIME s (the brief's 40 s), s = sOfU(u), because the
// flight speed changes sevenfold along the path (pace).
//
// Seeded looks (ctx.rng): the SUN (a nine-degree crowned sun / a sungrazer's 20-degree sun with
// arcing prominences, violent jets and a blinding dust tail / a small hard 2-degree sun with thin
// jets and a dominant ion tail), the NUCLEUS (two lobes / a single potato with a pit beyond the
// terrace / rust-brown with ice), the TAILS (blue + cream / plus an amber sodium thread / a
// teal coma with a paler fan) and the SAIL (mirror foil / gold foil / six-bladed heliogyro).
// ctx.vary.hour is read as timing (night: the line arrives late, day: early), density sets the
// vents, plumes and dust, and the rare event frees a house-sized fragment that flies out with us.
// Polish (6 Oct): the tail leg is four pictures, not one: a pass along the nearest ion ray, now a five-strand rope with knots; a
// look back at the nucleus, its backlit jets and the sun; boulders the jets threw off, tumbling past; then the braid itself, a
// horn of wound rays 1.3 km long narrowing onto the ring, with a whirlpool disc in the plane of the opening. The dust sheets are a
// far layer (none is skimmed). The nucleus carries craters, ledges, cracks and boulder fields in its material and its night side
// is lit blue by the coma. The rig frames less: the sling bar on the bottom edge, the shrouds on the side edges, the hem at the top.
// Script time keeps the old seconds up to the top of the climb; the leg has 15 s instead of 9 (duration 46).
// Polish 2 (6 Oct): deep space has a backdrop (the galaxy's band behind the tails, and the coma as a halo of gas round the body, drawn
// by the dome behind the rock). The tail's axis now stands 900 m to starboard of the top of the climb and 650 m above it: rolling out
// of the turn we look back up-sun over the pit, are blown out along a diagonal through a flock of thrown boulders, and from the axis
// the WHOLE nucleus hangs in frame below us with its jets, its coma and both tails; then the fragments, the horn (now with a skin
// of glowing gas) and the ring. The rig rides outside a 16:9 frame (it shows on taller screens and as the kite shadow on the dust):
// three outside reviewers read its bar and shrouds along the edges as a stray overlay. Duration 48.
// Polish 3 (8 Oct): the body is sampled finely enough for the shape it is given where the flight passes close to it (the potato
// at 360 by 230, the twin's body lobe at 316 by 202 and its neck lobe at 154 by 96; they were 150 by 96, 132 by 84 and 64 by 40:
// faces about 35 by 55 m, drawn out to over 100 m down the slopes of a pit rim whose ridge is about 120 m across, so from the
// climb the rim stood as a few flat faces and the limb's light flooded the top one as a flat sheet). And the face turned from
// the sun holds frost, in the coma's blue fill only: in the hollows the design names (here the bowls of the material's craters,
// on gentle ground) and, an addition of this round, on the tread above some of the ledges, coming and going along each; none
// where the sun lies. It has no fade of its own by distance: it goes as far as the material draws its craters and ledges, and
// its breakup goes to its mean with the material's own fades.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep, makeNoise } from '../kit/core.js';
import { buildHero } from '../parts/comet-perihelion.js';

const PALETTE = ['#020308', '#17130F', '#8FA6C4', '#FFE9B0', '#FFF8E6', '#EAD9B0', '#3FA8FF'];
const DEG = Math.PI / 180;

// ------------------------------------------------------------------ shared GLSL
const GLSL_NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float h31(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm3(vec2 p){ return vn(p) * .5 + vn(p * 2.03 + 7.1) * .27 + vn(p * 4.1 + 3.3) * .15 + vn(p * 8.3 + 1.7) * .08; }
`;
// The sky as a function of direction: used by the dome and by the foil's mirror.
const GLSL_SKY = /* glsl */`
uniform vec3 uSunDir, uAnti, uTailR, uTailU, uSunC, uIonC, uDustC, uSodC, uComaC;
uniform float uSunR, uCorR, uTime, uCorona, uIonI, uDustI, uSod, uComa, uDiscI, uProm, uNightK, uCrown, uSoft;
vec3 tails(vec3 d){
  float x = dot(d, uTailR), y = dot(d, uTailU), c = clamp(dot(d, uAnti), -1., 1.);
  float sr = sqrt(max(1. - c * c, 1e-6));                       // sine of the angle from the antisolar point
  float phi = atan(y, abs(x) < 1e-5 ? 1e-5 : x);                 // 0 right, pi/2 up, pi left (flying down-tail)
  float along = log(max((1. + c) / sr, 1e-3));                   // grows toward the vanishing point
  float reach = smoothstep(-0.55, 0.35, c);
  // ion fan: ruled rays on the upper left, kinks running down them
  float ph = phi < -1.6 ? phi + 6.2832 : phi;                    // unwrapped: the fan (0.25..3.72) never meets the atan seam
  float a = (ph - 0.25) / 0.115, id = floor(a), f = fract(a) - 0.5 + (h21(vec2(id, 3.)) - 0.5) * 0.5;
  // No ruled border: near the vanishing point any angular ramp collapses into a line, so the fan has no edge at all.
  // Its density thins over a third of a turn at each end, ray by ray, leaving stragglers that grow fewer, fainter and shorter.
  float lin = smoothstep(0., 18., a) * smoothstep(30.2, 22.2, a);
  float inFan = lin * smoothstep(0., 0.25, lin - 0.78 * h21(vec2(id, 13.)));
  float lenK = (0.22 + 0.78 * h21(vec2(id, 5.))) * mix(0.3, 1., lin);   // every ray ends at its own distance, the outer ones soonest: a feathered outline
  float tip = smoothstep(lenK * 1.35, lenK * 0.4, 1. - c);
  float w = (0.05 + 0.1 * h21(vec2(id, 7.))) * (1. + 5. * uSoft) / max(sr, 0.12);
  float ray = exp(-f * f / (w * w)) * (0.35 + 0.65 * h21(vec2(id, 11.))) / (1. + 2. * uSoft);
  float kink = 0.45 + 0.9 * vn(vec2(along * 5. - uTime * 0.9 + id * 13.7, id));
  vec3 col = uIonC * uIonI * ray * kink * inFan * reach * tip * (0.5 + 0.8 * smoothstep(0.9, 0.2, sr));
  col += uIonC * uIonI * 0.05 * lin * lin * reach * smoothstep(1.0, 0.15, 1. - c);   // the fan's own veil
  // dust tail: broad, cream, curving off to the lower right, combed into striae
  float pc = -0.55 - 0.5 * sr;
  float band = exp(-pow((phi - pc) / (0.55 + 0.35 * sr), 2.));
  float stri = vn(vec2(phi * 9. + along * 3.2, along * 1.3 - uTime * 0.02));
  stri = mix(0.35 + 1.1 * stri * stri + 0.5 * vn(vec2(phi * 31. + along * 9., 2.)), 0.8, uSoft * 0.8);
  col += uDustC * uDustI * band * stri * reach * (0.3 + 0.7 * smoothstep(1., 0.25, sr));
  // sodium thread between them
  float fs = (phi - 0.62) * max(sr, 0.12);
  col += uSodC * uSod * 0.6 * exp(-fs * fs / 0.00004) * reach * (0.6 + 0.6 * vn(vec2(along * 7. - uTime * 0.6, 5.)));
  return col;
}
vec3 sunSky(vec3 d){
  float c = clamp(dot(d, uSunDir), -1., 1.);
  float rho = acos(c);
  vec3 e1 = normalize(cross(uSunDir, vec3(0., 1., 0.)) + vec3(1e-5, 0., 0.)), e2 = cross(e1, uSunDir);
  vec2 q = vec2(dot(d, e1), dot(d, e2));
  vec2 qd = q / max(length(q), 1e-4);
  float r = rho / uSunR;
  // corona: a pearl crown with long wavering streamers
  float rc = max(rho, max(uSunR, uCorR * 0.75)) / uCorR;
  float st = vn(qd * 2.3 + vec2(uTime * 0.07, 3.) + 0.22 * sin(uTime * 0.45 + qd.yx * 5.));
  float fine = vn(qd * 9. + vec2(7., uTime * 0.16)) * 0.6 + vn(qd * 23. - vec2(uTime * 0.13, 1.)) * 0.4;
  float cor = pow(rc, -(3.1 - 2.0 * st * st)) * (0.22 + 1.3 * st * st) * (0.55 + 0.9 * fine) + 0.12 * pow(rc, -6.);
  vec3 pearl = mix(vec3(0.82, 0.88, 1.0), uSunC, 0.45);
  vec3 col = pearl * uCorona * cor * step(0., c) * (0.45 + 0.55 * smoothstep(1., 1.9, r));   // dimmer at the limb, so the disc keeps its edge
  // the crown that stands over the horizon before dawn: cool pearl (a dim warm white reads as olive), long streamers
  float st2 = vn(qd * 5.1 + vec2(1.7, uTime * 0.05));
  col += mix(vec3(0.74, 0.84, 1.0), uSunC, 0.22) * uCrown * (exp(-rho * rho / 0.2) * (0.26 + 1.25 * st * st + 0.5 * fine) + exp(-rho * rho / 0.5) * 0.5 * st2 * st2 * st2 * (0.4 + fine));
  // prominences: loops standing on the limb
  vec2 qn = q / sin(uSunR);
  for (int i = 0; i < 4; i++) {
    float fi = float(i), an = 0.9 + fi * 2.4 + 0.3 * sin(fi * 5.);
    float rad = (0.16 + 0.07 * fi) * (0.6 + uProm);
    vec2 cp = vec2(cos(an), sin(an)) * (1.0 + rad * 0.25);
    vec2 dp = qn - cp; float dl = length(dp);
    float ang = atan(dp.y, abs(dp.x) < 1e-5 ? 1e-5 : dp.x);
    float flow = 0.5 + 0.5 * sin(ang * 3. - uTime * (0.5 + 0.2 * fi) + fi * 2.);
    float th = 0.025 + 0.03 * flow;
    float ring = exp(-pow((dl - rad) / th, 2.)) * (0.12 + 0.88 * flow * flow) * smoothstep(-0.5, 0.4, sin(ang * 1.5 + fi * 1.9 + uTime * 0.07)) * step(fi, 1.5 + uProm * 2.);
    col += vec3(1.0, 0.72, 0.5) * uDiscI * 0.35 * ring * step(1., r) * step(0., c);
  }
  // the disc: hard edged, limb darkened, granulated
  float edge = 1. - smoothstep(1. - 0.0012 / uSunR, 1., r);
  float mu = sqrt(max(1. - r * r, 0.));
  float gran = 0.92 + 0.16 * vn(qn * 14. + uTime * 0.03);
  col = mix(col, uSunC * vec3(1., 0.92 + 0.08 * mu, 0.7 + 0.3 * mu) * uDiscI * (0.55 + 0.45 * mu) * gran, edge * step(0., c));
  return col;
}
`;
const DOME_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix * vec4(mat3(modelViewMatrix) * position, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;
const DOME_FRAG = /* glsl */`
precision highp float;
varying vec3 vDir;
uniform float uStars, uTailSky, uHaze, uBand, uNucR, uComaG;
uniform vec3 uBandN, uBandX, uNucDir;
${GLSL_NOISE}
${GLSL_SKY}
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1., 0., 0.)), f.x), mix(h31(i + vec3(0., 1., 0.)), h31(i + vec3(1., 1., 0.)), f.x), f.y),
             mix(mix(h31(i + vec3(0., 0., 1.)), h31(i + vec3(1., 0., 1.)), f.x), mix(h31(i + vec3(0., 1., 1.)), h31(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
float starLayer(vec3 d, float sc, float thr){
  vec3 p = d * sc, i = floor(p), f = fract(p) - 0.5;
  float h = h31(i);
  vec3 j = (vec3(h31(i + 11.3), h31(i + 27.1), h31(i + 5.7)) - 0.5) * 0.5;
  float dd = length(f - j);
  float m = step(thr, h) * (h - thr) / (1. - thr);
  return (0.25 + 0.75 * m * m) * step(thr, h) * (1. - smoothstep(0.07, 0.2, dd));
}
void main(){
  vec3 d = normalize(vDir);
  vec3 col = vec3(0.0012, 0.0017, 0.0036);
  float s1 = starLayer(d, 70., 0.915), s2 = starLayer(d.zxy, 150., 0.94);
  float tint = h31(floor(d * 70.) + 3.);
  col += (s1 * 1.5 + s2 * 0.55) * mix(vec3(0.75, 0.85, 1.15), vec3(1.15, 1.0, 0.8), tint) * uStars * uNightK;
  // (polish 2) deep space is not flat black: the galaxy's band crosses the sky behind the tails, warm at its core, violet-blue
  // at its skirts, with dark lanes and a few rose knots; the stars crowd toward it
  vec3 gq = d * 3.2;
  float g1 = vn3(gq + 11.) * 0.55 + vn3(gq * 2.3 + 5.) * 0.3 + vn3(gq * 5.1 + 2.) * 0.15;
  float g2 = vn3(gq * 7. + 3.) * 0.6 + vn3(gq * 15. + 9.) * 0.4;
  float glat = dot(d, uBandN) + (g1 - 0.5) * 0.24;
  float gb = exp(-glat * glat / 0.03), gsk = exp(-glat * glat / 0.22);
  float gcore = exp(-(1. - dot(d, uBandX)) * 1.6);
  float glane = smoothstep(0.4, 0.62, vn3(gq * 1.7 + vec3(4., 9., 1.)) * 0.6 + g2 * 0.4) * exp(-glat * glat / 0.014);
  vec3 gcol = mix(vec3(0.34, 0.42, 1.0), vec3(1.0, 0.74, 0.5), gb * (0.3 + 0.7 * gcore));
  float gI = (0.02 * gsk + 0.1 * gb * (0.35 + 2.6 * g1 * g2)) * (0.4 + 0.6 * gcore) * (1. - 0.82 * glane);
  col += (gcol * gI + vec3(1.0, 0.28, 0.42) * 0.07 * smoothstep(0.7, 0.9, vn3(gq * 2.9 + 21.)) * gb) * uBand;
  col += s2 * (0.6 + 2.4 * gb) * gsk * vec3(0.95, 0.95, 1.1) * uBand * 0.8;
  col += tails(d) * uTailSky;
  col += sunSky(d);
  // (polish 2) the coma: a halo of gas round the nucleus, blue-white at the limb, combed down-sun into streamers. The rock is
  // drawn over it, so the body stands against light, not against black.
  float nc = clamp(dot(d, uNucDir), -1., 1.), na = acos(nc), nout = max(na - uNucR, 0.);
  vec3 nperp = d - uNucDir * nc; float nl = max(length(nperp), 1e-4);
  vec3 aperp = uAnti - uNucDir * dot(uAnti, uNucDir);
  float ndown = dot(nperp / nl, aperp);                              // +: the side of the halo that streams down-sun
  float nw = 0.2 + 0.42 * max(ndown, 0.) + 0.05 * max(-ndown, 0.);
  float nfan = vn3(nperp / nl * 4.5 + vec3(0., uTime * 0.07, 3.)) * 0.6 + vn3(nperp / nl * 13. + vec3(uTime * 0.12, 0., 7.)) * 0.4;
  float nflow = vn3(nperp / nl * 6. + vec3(nout * 7. - uTime * 0.8, 5., nout * 3.));                 // gas streaming outward, visibly
  float nglow = exp(-nout / nw) * (0.4 + 1.25 * nfan * nfan) * (0.45 + 1.1 * nflow) + 0.5 * exp(-nout / 0.07) + 0.3 * exp(-nout / 1.1) * (0.5 + 1.0 * nflow * nfan + 0.5 * nflow);
  col += mix(uIonC, vec3(0.7, 0.86, 1.0), 0.5 * exp(-nout / 0.12)) * uComaG * nglow;
  // (polish) the coma: the sun is seen through the comet's own gas and dust, a wide cool haze round it with slow streamers
  float cs = clamp(dot(d, uSunDir), -1., 1.), rh = acos(cs);
  vec3 hz1 = normalize(cross(uSunDir, vec3(0., 1., 0.)) + vec3(1e-5, 0., 0.)), hz2 = cross(hz1, uSunDir);
  float ha = atan(dot(d, hz2), abs(dot(d, hz1)) < 1e-5 ? 1e-5 : dot(d, hz1));
  float hs = vn(vec2(ha * 2.2 + 7., rh * 1.5 - uTime * 0.03)) * 0.6 + vn(vec2(ha * 6.5, rh * 4. - uTime * 0.06)) * 0.4;
  col += mix(uIonC, vec3(0.62, 0.78, 1.0), 0.55) * uHaze * (0.06 * exp(-rh * rh / 0.35) + 0.06 * exp(-rh * rh / 2.4)) * (0.45 + 1.1 * hs * hs);
  // coma glow: only on the teal variant, hugging the nucleus below
  col += uComaC * uComa * (0.004 + 0.022 * exp(-abs(d.y + 0.12) * 5.));
  gl_FragColor = vec4(col, 1.);
}`;

// Rock: lobes, lander, the rare fragment. Lit by the hero's terminator model (same uniforms).
const ROCK_VERT = /* glsl */`
attribute vec3 color;
varying vec3 vP, vN, vC, vQ;
uniform float uLocal;
void main(){
  #ifdef USE_INSTANCING
    vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.);
    vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  #else
    vec4 w = modelMatrix * vec4(position, 1.);
    vN = normalize(mat3(modelMatrix) * normal);
  #endif
  vP = w.xyz; vC = color;
  vQ = mix(w.xyz, position * uLocal, step(0.001, uLocal));       // texture space: the world for the nucleus, their own for things that tumble
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const ROCK_FRAG = /* glsl */`
precision highp float;
varying vec3 vP, vN, vC, vQ;
uniform float uLineQ, uRc, uElevMax, uSunI, uIce, uTex, uBump, uTime, uComa, uNightK, uRim, uThread, uOct, uFill;
uniform vec2 uAway; uniform vec4 uThB;      // thread: distance from, to; height from, to
uniform vec3 uSunCol, uIonCol, uCrust, uFrostCol, uComaC;
uniform vec4 uBeacon;                       // xyz position, w intensity (0 for the lobes)
${GLSL_NOISE}
// (polish) real marks at the size the camera sees: one bowl with a raised rim per cell, three sizes of them
float crat(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float h = h21(i + 7.3);
  vec2 c = 0.5 + (vec2(h21(i + 1.7), h21(i + 9.2)) - 0.5) * 0.36;
  float r = 0.1 + 0.16 * h21(i + 4.4);
  float d = length(f - c) / r, dm = d - 1.;
  return step(0.6, h) * r * (-0.7 * max(1. - d * d, 0.) + 0.3 * exp(-dm * dm / 0.045));
}
float relief(vec2 q, float w1, float w2, float w3){
  return 190. * crat(q / 190.) * w1 + 62. * crat(q / 62. + 5.3) * w2 + 21. * crat(q / 21. + 11.7) * w3;
}
void main(){
  vec3 Ng = normalize(vN);
  vec3 Vv = cameraPosition - vP; float dist = length(Vv);
  vec2 q0 = vQ.xz + vQ.y * vec2(0.63, 0.41);
  vec2 p = q0 * uTex;
  float n0 = fbm3(p), nx = fbm3(p + vec2(0.31, 0.)), nz = fbm3(p + vec2(0., 0.31));
  float big = fbm3(p * 0.13 + 4.);
  vec3 g = uBump * vec3(n0 - nx, 0., n0 - nz);
  float tone = 0.6 + 0.8 * n0, detailShade = 1., detailTone = 1., frostLaid = 0.;
  if (uOct > 0.5) {
    // the lobes: two finer octaves, and the terrace's own soot patches, so the crown terrace is part of the body
    vec2 p1 = q0 * 0.05 + 3.1, p2 = q0 * 0.21 + 7.7;
    float n1 = fbm3(p1), n2 = fbm3(p2);
    float f1 = 1. - smoothstep(2500., 6000., dist), f2 = 1. - smoothstep(700., 2400., dist);
    g = g * 0.3 + 0.55 * f1 * vec3(n1 - fbm3(p1 + vec2(0.31, 0.)), 0., n1 - fbm3(p1 + vec2(0., 0.31)))
                + 0.3 * f2 * vec3(n2 - fbm3(p2 + vec2(0.31, 0.)), 0., n2 - fbm3(p2 + vec2(0., 0.31)));
    // close to: a third octave, so the slopes we climb past are not bare
    float f3 = 1. - smoothstep(180., 600., dist);
    vec2 p3 = q0 * 0.9 + 1.3; float n3 = fbm3(p3);
    g += 0.4 * f3 * vec3(n3 - fbm3(p3 + vec2(0.31, 0.)), 0., n3 - fbm3(p3 + vec2(0., 0.31)));
    // craters: crisp rims that take the low sun on one side and throw the other into shadow
    float w1 = 1. - smoothstep(2600., 5200., dist), w2 = 1. - smoothstep(700., 1500., dist), w3 = 1. - smoothstep(220., 480., dist);
    float cmask = smoothstep(0.38, 0.62, fbm3(q0 * 0.0035 + 13.)); w2 *= 0.25 + 0.75 * cmask; w3 *= cmask;   // craters come in fields, with plains between
    float ee = clamp(dist * 0.004, 0.6, 9.);
    float r0 = relief(q0, w1, w2, w3);
    vec3 gc = vec3(r0 - relief(q0 + vec2(ee, 0.), w1, w2, w3), 0., r0 - relief(q0 + vec2(0., ee), w1, w2, w3)) / ee;
    g += gc * 1.5;
    // layered terraces on every slope: a ledge every thirty-odd metres, its riser turned outward
    float steepG = smoothstep(0.1, 0.45, 1. - Ng.y) * (1. - smoothstep(1800., 4200., dist));
    float sy = vQ.y * 0.03 + big * 1.6 + 0.2 * n1, sf = fract(sy);
    float riser = smoothstep(0., 0.06, sf) * (1. - smoothstep(0.1, 0.24, sf));
    g += normalize(vec3(Ng.x, 0., Ng.z) + vec3(1e-4, 0., 0.)) * riser * steepG * 0.9; g.y -= riser * steepG * 0.5;
    float layerTone = mix(1., 0.72 + 0.56 * h21(vec2(floor(sy), 3.7)), steepG) * (1. - 0.4 * steepG * (1. - smoothstep(0., 0.05, sf)));
    // cracks, and boulder fields with their shadows thrown down-sun
    float ck = abs(fbm3(q0 * 0.021 + 5.) - 0.5), ckw = 0.006 + dist * 0.000012;
    float crack = (1. - smoothstep(ckw * 0.4, ckw, ck)) * (1. - smoothstep(900., 2200., dist));
    vec2 bp = q0 / 13., bi = floor(bp), bf = fract(bp) - 0.5 - (vec2(h21(bi + 2.1), h21(bi + 6.6)) - 0.5) * 0.5;
    float bh = h21(bi + 9.9), br = 0.07 + 0.1 * h21(bi + 3.3), bon = step(0.62, bh) * smoothstep(0.5, 0.62, fbm3(q0 * 0.006 + 2.)) * (1. - smoothstep(350., 800., dist));
    float bould = bon * (1. - smoothstep(br * 0.7, br, length(bf)));
    vec2 bs = bf - uAway * br * 2.2;
    float bshad = bon * (1. - smoothstep(br * 0.8, br * 2.6, length(bs * vec2(1., 1.) + uAway * dot(bs, uAway) * -0.55)));
    float soot = smoothstep(0.42, 0.62, fbm3(vQ.xz * 0.035 + 17.));
    // (polish 3) the face turned from the sun holds frost: in the hollows the design names (here the bowls of its craters, on gentle
    // ground by the slope alone) and, an addition, on the tread above some ledges; far off each breakup factor goes to its mean
    float bowl = -(crat(q0 / 190.) * w1 + crat(q0 / 62. + 5.3) * w2 + crat(q0 / 21. + 11.7) * w3);
    float tread = steepG * smoothstep(0.2, 0.28, sf) * (1. - smoothstep(0.3, 0.62, sf)) * smoothstep(0.25, 0.7, h21(vec2(floor(sy), 9.1))) * mix(0.63, smoothstep(0.34, 0.56, n1), f2);
    frostLaid = clamp(smoothstep(0.012, 0.06, bowl) * mix(0.9, 0.35 + 1.1 * n3, f3) * (1. - 0.85 * smoothstep(0.1, 0.45, 1. - Ng.y)) + 0.75 * tread * mix(0.85, 0.4 + 0.9 * n2, f2), 0., 1.);
    detailShade = (1. - 0.75 * bshad * (1. - bould)) * (1. - 0.6 * crack);
    detailTone = layerTone * (1. + 0.9 * bould) * (1. - 0.45 * crack);
    tone = (0.74 + 0.3 * n0) * mix(1., 0.62 + 0.75 * n1, f1) * mix(1., 0.7 + 0.6 * n2, f2) * mix(1., 0.7 + 0.6 * n3, f3) * mix(1., mix(0.36, 0.64, smoothstep(220., 800., dist)), soot);
  }
  vec3 N = normalize(Ng + g);
  float te = clamp((uLineQ - dot(vP.xz, uAway)) / uRc, -0.4, uElevMax);
  vec3 L = normalize(vec3(-uAway.x, max(te, 0.04), -uAway.y));
  float tq = te + 0.035 * uOct;                                  // the body lights where the terrace's flats do, 77 m ahead of the nominal line
  float lit = smoothstep(-0.014, 0.014, tq) * smoothstep(-0.02, 0.08, dot(Ng, L));
  float strata = 0.82 + 0.3 * vn(vec2(vQ.y * 0.045 + big * 2.2, 3.7));
  vec3 alb = uCrust * vC * tone * strata * detailTone;
  float farK = smoothstep(220., 800., dist) * uOct;             // from the air: burnt toast, not orange (the terrace does the same)
  alb = mix(alb, vec3(dot(alb, vec3(0.3, 0.5, 0.2))) * vec3(1.08, 0.96, 0.84), 0.3 * farK) * (1. - 0.18 * farK);
  float ice = uIce * smoothstep(0.62, 0.7, fbm3(p * 0.21 + 9.) + 0.12 * n0);
  alb = mix(alb, vec3(0.42, 0.45, 0.5), ice * 0.8);
  vec3 col = alb * uSunCol * uSunI * max(dot(N, L), 0.) * lit * detailShade;
  // the ruled line: the crust burns for a second where the light has just arrived
  float since = max(tq, 0.) * uRc / 30.;
  col += alb * uSunCol * uSunI * 0.9 * exp(-since / 1.5) * smoothstep(-0.0065, 0.0065, tq) * smoothstep(-0.25, 0.2, dot(Ng, L)) * (0.35 + 0.65 * max(N.y, 0.));
  col += alb * uSunCol * uSunI * 0.016 * smoothstep(0., 0.08, te) * (0.4 + 0.6 * max(N.y, 0.));
  col += alb * (uIonCol * 0.05 * max(N.y, 0.) + vec3(0.004, 0.005, 0.007)) * uNightK;
  col += mix(uIonCol, uFrostCol, 0.5) * 0.024 * max(N.y, 0.) * max(N.y, 0.) * (0.5 + n0) * uNightK;   // a breath of blue from the tail on upward faces
  col += alb * uComaC * uComa * 0.12;
  // (polish) the side turned from the sun is not black: the coma and the tails light it blue from down-sun and above, so its
  // craters and ledges read; frost patches hold more of it
  vec3 Lf = normalize(vec3(uAway.x, 0.75, uAway.y));
  float fillF = max(dot(N, Lf) * 0.8 + 0.2, 0.);
  float frostP = smoothstep(0.45, 0.7, fbm3(q0 * 0.004 + 31.) * 0.6 + 0.4 * n0);
  col += mix(uIonCol, uFrostCol, 0.55) * (0.5 + 0.5 * uNightK) * (1. - 0.85 * lit) * (0.14 + 1.0 * fillF * fillF) * (0.095 + 0.17 * frostP + 0.340 * frostLaid * (1. - lit)) * (0.6 + 0.8 * tone) * detailTone * step(0.5, uOct + uFill);
  col += alb * uIonCol * uFill * (0.35 + 0.65 * max(dot(N, vec3(uAway.x, 0.3, uAway.y)), 0.));   // tumbling fragments: the tail's blue on the side turned from the sun
  vec3 V = Vv / max(dist, 1e-3);
  float ndv = max(dot(Ng, V), 0.);
  float rim = pow(1. - ndv, 14.) * smoothstep(0.2, 0.75, dot(-V, L)) * smoothstep(-0.014, 0.014, te) * smoothstep(-0.14, 0.02, dot(Ng, L));
  col += uSunCol * rim * uRim;                                   // the backlit limb burns
  // before dawn: one white-gold thread along the summit of the far lobes, which already stand in the sun
  float th = pow(1. - ndv, 7.) * smoothstep(0.1, 0.45, Ng.y) * smoothstep(uThB.x, uThB.y, dist) * smoothstep(uThB.z, uThB.w, vP.y) * smoothstep(-0.05, 0.25, dot(-V.xz, -uAway)) * smoothstep(-0.12, 0.1, dot(Ng.xz, -uAway));
  col += mix(uSunCol, vec3(1.), 0.35) * uThread * th * (0.3 + 1.4 * n0);
  vec3 tb = uBeacon.xyz - vP; float db = dot(tb, tb);
  col += vC * vec3(0.8, 0.9, 1.0) * uBeacon.w * max(dot(Ng, tb / sqrt(max(db, 1e-4))), 0.15) / (1. + db * 0.12);
  gl_FragColor = vec4(col, 1.);
}`;

// Far plumes on the lobes: two crossed cards per vent, limb-bright with a dark core.
const PLUME_VERT = /* glsl */`
attribute vec3 iBase, iUp; attribute vec4 iPar;      // height, base width, ignite s (<0: burning), seed
uniform float uS, uLineQ, uRc; uniform vec2 uAway;
varying vec2 vUv; varying float vSeed, vLit, vGrow, vAx; varying vec3 vW;
void main(){
  float grow = iPar.z < 0. ? 1. : smoothstep(iPar.z, iPar.z + 3.5, uS);
  float v = uv.y, h = iPar.x * (0.15 + 0.85 * grow);
  vec3 side = normalize(cross(iUp, vec3(0.3, 0.2, 1.)));
  if (position.z > 0.5) side = cross(iUp, side);
  float wd = iPar.y * 1.8 * (0.35 + 1.6 * v * v + 0.8 * v);
  vec3 w = iBase + iUp * (v * h) + side * (position.x * wd) + vec3(uAway.x, 0., uAway.y) * (v * v * h * 0.3);
  float te = (uLineQ - dot(iBase.xz, uAway)) / uRc + v * h * 0.0006;
  vLit = smoothstep(-0.02, 0.03, te) * grow;
  vUv = uv; vSeed = iPar.w; vGrow = grow; vW = w;
  vAx = abs(dot(normalize(w - cameraPosition + vec3(0., 1e-4, 0.)), iUp));     // seen along its axis a card is a bar: let it go
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`;
const PLUME_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv; varying float vSeed, vLit, vGrow, vAx; varying vec3 vW;
uniform float uTime, uPlumeI; uniform vec3 uGrain, uSunDir;
${GLSL_NOISE}
void main(){
  float x = abs(vUv.x * 2. - 1.), v = vUv.y;
  float prof = (1. - smoothstep(0.25, 1., x)) * (0.35 + 0.65 * smoothstep(0., 0.6, x)) * (1. - x * x);
  float n = vn(vec2(vUv.x * 7. + vSeed * 31., v * 9. - uTime * 0.45)) * 0.6 + vn(vec2(vUv.x * 19. + vSeed, v * 26. - uTime * 0.9)) * 0.4;
  float fade = pow(max(1. - v, 0.), 1.4) * smoothstep(0., 0.12, v) * smoothstep(0., 0.3, vGrow * 1.25 - v * 0.25);
  vec3 vd = normalize(vW - cameraPosition);
  float fwd = pow(max(dot(vd, uSunDir), 0.), 3.);
  float down = smoothstep(0.12, 0.6, -vd.y);                    // seen from above the forward scatter is lost: white fire against the black
  float a = prof * (0.35 + 1.1 * n * n) * fade * vLit * uPlumeI * (0.45 + 1.6 * fwd + 1.5 * down) * (1. - smoothstep(0.86, 0.985, vAx));
  gl_FragColor = vec4(mix(vec3(0.96, 0.97, 1.0), uGrain, smoothstep(0.02, 0.3, a)) * a, 1.);
}`;

// The sail's kite-shaped shadow, tested analytically by everything in the dust tail.
const GLSL_SHADOW = /* glsl */`
uniform vec3 uSailP, uShD, uShR, uShU; uniform float uShOn, uShT;
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0., 1.)); }
float sailShadow(vec3 P){
  vec3 r = P - uSailP; float al = dot(r, uShD);
  vec2 q = vec2(dot(r, uShR), dot(r, uShU));                     // q.y grows ahead of us on the dust
  float rp = min(1., max(al, 0.) * 0.02);
  q.x += (0.3 * sin(q.y * 0.9 + uShT * 2.3) + 0.15 * sin(q.y * 2.3 - uShT * 3.4)) * rp;     // it shimmers over the striae
  q.y += 0.2 * sin(q.x * 0.45 + uShT * 1.7) * rp;
  float pen = 0.35 + max(al, 0.) * 0.003;
  float ky = q.y > 0. ? q.y / 21. : -q.y / 7.7;                 // stretched ahead so that, foreshortened on the dust, it is a kite again
  float dk = (abs(q.x) / 13. + ky - 1.) * 7.;
  float ins = 1. - smoothstep(-pen, pen, dk);
  // the harness under the kite: two shrouds down to the sling bar, the bar, and the tether trailing below it
  vec2 qa = vec2(abs(q.x), q.y);
  float hd = min(min(sdSeg(qa, vec2(13., 0.), vec2(2.6, -11.5)), sdSeg(qa, vec2(0., -11.5), vec2(2.6, -11.5)) * 0.6), sdSeg(qa, vec2(0., -11.5), vec2(0., -19.)));
  float lw = 0.28 + max(al, 0.) * 0.0022;
  float har = (1. - smoothstep(lw * 0.5, lw * 1.5, hd)) * 0.75;
  return 1. - uShOn * step(6., al) * max(ins * 0.92, har) * smoothstep(2600., 1200., al);
}`;
// Ion rays: camera-facing ribbons with kink packets running down-tail; two wind into the braid.
const ION_VERT = /* glsl */`
attribute vec3 aP0, aP1; attribute vec4 aPar; attribute float aBraid; attribute vec2 aRope;     // aPar: t, side, width, seed; aRope: strand phase, rope radius
uniform vec3 uLegO, uAnti, uTailR, uTailU; uniform float uTime, uLegLen;
varying float vX, vA, vSeed, vFade, vBr, vRope;
vec3 centre(float t){
  vec3 c = mix(aP0, aP1, t);
  float a = dot(c - uLegO, uAnti), ph = a - uTime * 400., sd = aPar.w;
  float k1 = sin(ph * 0.011 + sd * 40.) * pow(0.5 + 0.5 * sin(ph * 0.0021 + sd * 17.), 6.);
  float k2 = sin(ph * 0.019 + sd * 9.) * pow(0.5 + 0.5 * sin(ph * 0.0013 + sd * 5.), 8.);
  float br = abs(aBraid);
  c += (uTailR * k1 + uTailU * k2) * (aPar.z * 1.15 + aRope.y * 1.7) * (1. - br);
  // the rope: strands of one ray wound round each other, pinched into knots that run down-tail
  float ra = a * 0.062 + aRope.x - uTime * 0.8;
  float pin = 0.5 + 0.5 * sin(ph * 0.019 + sd * 23.);
  c += (uTailR * cos(ra) + uTailU * sin(ra)) * aRope.y * (0.22 + 0.95 * pin * pin);
  float w = smoothstep(uLegLen - 1500., uLegLen - 500., a) * br;
  float ang = a * 0.019 + uTime * 0.5 + (aBraid > 0. ? 0. : 3.14159);
  float rad = mix(17., 11.5, smoothstep(uLegLen - 700., uLegLen, a)) + 1.3 * sin(a * 0.006 + uTime * 0.5);
  return mix(c, uLegO + uAnti * a + (uTailR * cos(ang) + uTailU * sin(ang)) * rad, w);
}
void main(){
  float t = aPar.x;
  vec3 c0 = centre(t), c1 = centre(t + 0.003);
  vec3 dir = normalize(c1 - c0 + vec3(1e-5)), vd = c0 - cameraPosition;
  float dist = length(vd);
  vec3 side = normalize(cross(dir, vd / max(dist, 1e-3)) + vec3(0., 1e-5, 0.));
  float wd = max(aPar.z, dist * 0.0012);
  float graze = length(cross(dir, vd / max(dist, 1e-3)));
  vec3 p = c0 + side * aPar.y * wd;
  vX = aPar.y; vA = dot(c0 - uLegO, uAnti); vSeed = aPar.w; vBr = abs(aBraid); vRope = step(0.01, aRope.y);
  vFade = smoothstep(0., 0.05, t) * smoothstep(1., 0.7, t) * smoothstep(5., 22., dist) * min(1., aPar.z / wd * 1.5) * (0.06 + 0.94 * smoothstep(0.02, 0.45, graze));
  float fe = mix(750., 1700., fract(aPar.w * 7.31));              // each ray melts away at its own distance, well before the rays pile up over the vanishing point
  vFade *= mix(smoothstep(40., 260., dist), 1., vRope);          // (polish) a wide ray close to is a white wall: only the rope comes near
  vFade *= mix(smoothstep(fe, fe * 0.35, dist), smoothstep(2100., 900., dist) * smoothstep(uLegLen + 260., uLegLen + 60., vA) * smoothstep(uLegLen - 1900., uLegLen - 1300., vA), vBr);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const ION_FRAG = /* glsl */`
precision highp float;
varying float vX, vA, vSeed, vFade, vBr, vRope;
uniform float uTime, uIonG; uniform vec3 uIonC;
${GLSL_NOISE}
void main(){
  float x = vX * vX;
  float core = exp(-x * 18.) * 1.5 + exp(-x * 3.5) * 0.45 * (1. - x);
  float knots = 0.45 + 1.0 * vn(vec2(vA * 0.0045 - uTime * 1.6 + vSeed * 50., vSeed * 9.));
  float fine = 0.75 + 0.5 * vn(vec2(vA * 0.03 - uTime * 9., vSeed * 3.));
  vec3 col = mix(uIonC, vec3(0.75, 0.9, 1.0), exp(-x * 30.) * 0.55) * core * knots * fine * uIonG * (1. + 2.4 * vBr + 0.9 * vRope * knots);
  gl_FragColor = vec4(col * vFade, 1.);
}`;
// The braid: ion rays wound into a funnel that narrows down-tail onto the ring. Seen from the side it is a horn of
// light, from inside a whirlpool. aArm: phase angle, radius factor, metres before the ring where the arm begins (< 0: a rim strand).
const VORTEX_VERT = /* glsl */`
attribute vec4 aPar; attribute vec3 aArm;
uniform vec3 uLegO, uAnti, uTailR, uTailU; uniform float uTime, uLegLen;
varying float vX, vA, vSeed, vFade, vHot;
vec3 centre(float t){
  float rim = step(aArm.z, 0.);
  float x = max(aArm.z, 0.) * (1. - t) * (1. - 0.6 * t);            // metres before the ring; denser sampling near it
  float fl = smoothstep(520., 1000., x);
  float R = (14.5 + 0.125 * x + 115. * fl * fl) * aArm.y;
  float ang = aArm.x + 3.3 * log(R / (14.5 * aArm.y)) + 1.5 * exp(-x / 30.) + uTime * 0.22;
  R += 1.6 * sin(x * 0.045 - uTime * 2.2 + aArm.x * 3.) * min(1., x / 60.);
  // rim strands: three circles round the opening, breathing
  float ar = aArm.x + t * 6.2832 * 1.02 + uTime * 0.55 * aArm.y;
  float Rr = 13.6 * aArm.y + 0.55 * sin(ar * 5. + uTime * 1.7);
  x = mix(x, 0.6 * sin(ar * 3. + aArm.x), rim); R = mix(R, Rr, rim); ang = mix(ang, ar, rim);
  return uLegO + uAnti * (uLegLen - x) + (uTailR * cos(ang) + uTailU * sin(ang)) * R;
}
void main(){
  float t = aPar.x;
  vec3 c0 = centre(t), c1 = centre(t + 0.004);
  vec3 dir = normalize(c1 - c0 + vec3(1e-5)), vd = c0 - cameraPosition;
  float dist = length(vd);
  vec3 side = normalize(cross(dir, vd / max(dist, 1e-3)) + vec3(0., 1e-5, 0.));
  float along = dot(c0 - uLegO, uAnti), x = uLegLen - along;
  float w0 = aPar.z * (0.45 + min(x, 700.) / 380.);
  float wd = max(w0, dist * 0.0016);
  vec3 p = c0 + side * aPar.y * wd;
  float rim = step(aArm.z, 0.);
  vX = aPar.y; vA = along + rim * t * 400.; vSeed = aPar.w;
  vHot = max(rim, 1. - smoothstep(0., 260., x));
  vFade = mix(smoothstep(0., 0.1, t), 1., rim) * smoothstep(5., 26., dist) * min(1., w0 / wd * 1.6) * smoothstep(3400., 1900., dist);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const VORTEX_FRAG = /* glsl */`
precision highp float;
varying float vX, vA, vSeed, vFade, vHot;
uniform float uTime, uVorG; uniform vec3 uIonC, uWarm;
${GLSL_NOISE}
void main(){
  float x = vX * vX;
  float core = exp(-x * 16.) * 1.4 + exp(-x * 3.2) * 0.5 * (1. - x);
  float knots = 0.3 + 1.25 * vn(vec2(vA * 0.012 - uTime * 1.3 + vSeed * 50., vSeed * 9.));
  float fine = 0.7 + 0.6 * vn(vec2(vA * 0.07 - uTime * 6., vSeed * 3.));
  vec3 base = mix(uIonC, uWarm, step(0.78, fract(vSeed * 13.7)) * 0.8);
  vec3 col = mix(base, vec3(0.8, 0.92, 1.0), exp(-x * 26.) * 0.6 + 0.3 * vHot) * core * knots * knots * fine * uVorG * (1. + 1.6 * vHot);
  gl_FragColor = vec4(col * vFade, 1.);
}`;
// (polish 2) the braid's body: a skin of glowing gas on the horn the rays are wound round, streaked along the same spiral, bright
// where it is seen edge-on, so the horn is a trumpet of light with a wall and not only lines.
const HORN_VERT = /* glsl */`
uniform vec3 uLegO, uAnti, uTailR, uTailU; uniform float uTime, uLegLen;
varying vec3 vW, vN; varying vec2 vH;                       // vH: metres before the ring, angle round the axis
void main(){
  float x = 1050. * uv.y * uv.y, th = uv.x * 6.2832;
  float fl = smoothstep(520., 1000., x);
  float R = 13.4 + 0.122 * x + 112. * fl * fl + 1.2 * sin(x * 0.045 - uTime * 2.2 + th * 3.);
  vec3 rad = uTailR * cos(th) + uTailU * sin(th);
  vW = uLegO + uAnti * (uLegLen - x) + rad * R;
  vN = normalize(rad + uAnti * (0.122 + 0.3 * fl));
  vH = vec2(x, th);
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`;
const HORN_FRAG = /* glsl */`
precision highp float;
varying vec3 vW, vN; varying vec2 vH;
uniform float uTime, uHornG; uniform vec3 uIonC, uWarm;
${GLSL_NOISE}
void main(){
  float x = vH.x, R = 13.4 + 0.122 * x;
  float sa = vH.y - 3.3 * log(R / 13.4) - 1.5 * exp(-x / 30.) - uTime * 0.22;      // constant along an arm of the braid
  vec2 c = vec2(cos(sa), sin(sa));
  float lx = log(1. + x / 40.);
  float st = vn(c * 2.6 + vec2(lx * 1.3 - uTime * 0.25, 4.)) * 0.55 + vn(c * 7.5 + vec2(9., lx * 3.5 - uTime * 0.5)) * 0.3 + vn(c * 19. + vec2(lx * 8. - uTime * 0.9, 2.)) * 0.15;
  vec3 V = vW - cameraPosition; float dist = length(V); V /= max(dist, 1e-3);
  float edge = 1. / (abs(dot(normalize(vN), V)) + 0.22);                           // the wall thickens toward its silhouette
  float hot = exp(-x / 170.);
  float body = (0.06 + 1.5 * st * st * st) * edge * (0.35 + 1.6 * hot);
  float fade = smoothstep(1050., 620., x) * smoothstep(0., 22., x) * smoothstep(8., 60., dist) * smoothstep(3600., 2200., dist);
  vec3 col = mix(mix(uIonC, vec3(0.5, 0.42, 1.0), 0.35 * (1. - hot)), vec3(0.85, 0.94, 1.0), 0.6 * hot) + uWarm * 0.3 * st * hot;
  gl_FragColor = vec4(col * body * fade * uHornG, 1.);
}`;
// The ring's own whirlpool: a disc in the plane of the opening, log-spiral arms winding in to a bright rim, a hole for the portal.
const WHIRL_VERT = /* glsl */`
varying vec2 vQ; varying float vDist;
void main(){
  vQ = position.xy;
  vec4 w = modelMatrix * vec4(position, 1.);
  vDist = length(w.xyz - cameraPosition);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const WHIRL_FRAG = /* glsl */`
precision highp float;
varying vec2 vQ; varying float vDist;
uniform float uTime, uWhirlG, uHole, uRad; uniform vec3 uIonC, uWarm;
${GLSL_NOISE}
void main(){
  float r = length(vQ);
  float th = atan(vQ.y, abs(vQ.x) < 1e-4 ? 1e-4 : vQ.x);
  float lr = log(max(r, 1.) / uHole);
  float sp = th * 5. + lr * 7.5 + uTime * 0.9;
  float arms = 0.5 + 0.5 * sin(sp); arms *= arms;
  float sp2 = th * 13. - lr * 17. - uTime * 1.6;
  float fil = 0.5 + 0.5 * sin(sp2 + 3. * sin(sp * 0.5)); fil = fil * fil * fil;
  vec2 pn = vec2(cos(th), sin(th)) * 3.;
  float n = vn(pn + vec2(lr * 6. + uTime * 0.7, 3.)) * 0.6 + vn(pn * 3.1 + vec2(lr * 15. + uTime * 1.3, 9.)) * 0.4;
  float fall = pow(uHole / max(r, uHole), 0.85);
  float rimw = (r - uHole * 1.12) / (uHole * 0.11);
  float rim = exp(-rimw * rimw) * (0.75 + 0.5 * n);
  float edge = (1. - smoothstep(uRad * 0.55, uRad, r)) * smoothstep(uHole * 0.98, uHole * 1.08, r);
  float body = (0.1 + 1.0 * arms * (0.35 + n) + 0.55 * fil * n) * fall * 1.5;
  vec3 col = mix(uIonC, vec3(0.82, 0.93, 1.0), clamp(fall * 0.9 + rim, 0., 1.)) * (body + rim * 2.6);
  col += uWarm * 0.35 * fil * arms * fall;
  gl_FragColor = vec4(col * edge * uWhirlG * smoothstep(3., 30., vDist), 1.);
}`;
// Dust tail: curved sheets combed into striae, with the sail's shadow running over them.
const DUST_VERT = /* glsl */`
attribute vec3 aSheet;                                   // metres along, across -1..1, sheet index
uniform float uTime; uniform vec3 uTailU;
varying vec3 vS, vW;
void main(){
  vec3 p = position + uTailU * (sin(aSheet.x * 0.0035 + uTime * 0.25 + aSheet.y * 2. + aSheet.z) * 7. + sin(aSheet.x * 0.011 - uTime * 0.4) * 2.);
  vS = aSheet; vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const DUST_FRAG = /* glsl */`
precision highp float;
varying vec3 vS, vW;
uniform float uTime, uDustG, uA0, uA1; uniform vec3 uDustC, uAnti;
${GLSL_NOISE}
${GLSL_SHADOW}
void main(){
  float a = vS.x, x = vS.y, k = vS.z;
  float edge = pow(max(1. - x * x, 0.), 1.6);
  float s1 = vn(vec2(a * 0.0042 + x * 2.0 - uTime * 0.02, x * 2.6 + k * 7.3));
  float comb = vn(vec2(a * 0.017 + x * 13. + k * 3., x * 1.9 - uTime * 0.035 * (1.5 + x)));
  float fine = vn(vec2(a * 0.06 + x * 47., k * 5. + uTime * 0.02));
  float hair = vn(vec2(x * 170. + a * 0.004 + k * 11., a * 0.016 - uTime * 0.25));       // hair-fine striae, read from close above
  float body = (0.3 + 1.15 * s1 * s1) * (0.4 + 1.1 * comb * comb) * (0.7 + 0.6 * fine) * (0.72 + 0.6 * hair);
  float fa = smoothstep(uA0, uA0 + 500., a) * smoothstep(uA1, uA1 - 1800., a);
  float near = smoothstep(5., 42., length(vW - cameraPosition));
  float k0 = 1. - step(0.5, k);                                   // the sheet we skim: brighter, creamier, visibly combed
  body *= mix(1., (0.6 + 1.2 * hair * hair) * 1.25, k0);
  vec3 dc = mix(uDustC, vec3(1., 0.95, 0.84), 0.45 * k0);
  body *= 1. - 0.8 * smoothstep(0.25, 0.8, dot(normalize(vW - cameraPosition + vec3(0., 1e-4, 0.)), -uAnti));   // (polish) looking back up-sun the sheets thin out, so the nucleus and its jets are not veiled
  gl_FragColor = vec4(dc * uDustG * body * edge * fa * near * mix(1., sailShadow(vW), k0), 1.);   // only the sheet we skim takes the shadow: one kite, not four
}`;
const MOTE_VERT = /* glsl */`
attribute vec4 aLeg;                                     // along, left, up, seed (leg frame, metres)
uniform vec3 uLegO, uAnti, uTailR, uTailU; uniform float uTime, uA0, uA1; uniform vec2 uRes;
varying float vAl; varying vec3 vW;
void main(){
  float span = uA1 - uA0, a = uA0 + mod(aLeg.x + uTime * (10. + 25. * aLeg.w), span);
  vec3 w = uLegO + uAnti * a - uTailR * aLeg.y + uTailU * (aLeg.z + 6. * sin(uTime * 0.2 + aLeg.w * 40.));
  vec4 mv = viewMatrix * vec4(w, 1.);
  gl_Position = projectionMatrix * mv;
  float sz = (2. + 7. * fract(aLeg.w * 7.13)) * projectionMatrix[1][1] * uRes.y * 0.5 / max(-mv.z, 1.);
  vAl = smoothstep(0., 150., a - uA0) * smoothstep(0., 150., uA1 - a) * smoothstep(12., 60., -mv.z) * min(1., sz / 2.) * (0.4 + 0.6 * fract(aLeg.w * 3.7));
  vW = w;
  gl_PointSize = clamp(sz, 2., 56.);
}`;
const MOTE_FRAG = /* glsl */`
precision highp float;
varying float vAl; varying vec3 vW;
uniform vec3 uDustC; uniform float uMoteG;
${GLSL_SHADOW}
void main(){
  vec2 q = gl_PointCoord * 2. - 1.; float r = dot(q, q);
  float a = (1. - smoothstep(0., 1., r)); a *= a;
  gl_FragColor = vec4(uDustC * uMoteG * a * vAl * sailShadow(vW), 1.);
}`;
// Near grains: bright dashes in a box that wraps round the camera, stretched along their
// velocity relative to us.
const GRAIN_VERT = /* glsl */`
attribute vec3 aSeed; attribute vec3 aCorner;            // corner: along 0..1, side -1..1, rnd
uniform vec3 uCam, uBox, uRel, uDrift; uniform float uAmt;
varying float vA; varying vec2 vQ;
void main(){
  vec3 c = mod(aSeed * uBox + uDrift - uCam, uBox) - 0.5 * uBox;
  vec3 e = abs(c) / (0.5 * uBox);
  float fade = (1. - smoothstep(0.75, 1., max(e.x, max(e.y, e.z))));
  float sp = length(uRel), dist = length(c);
  vec3 dir = uRel / max(sp, 1e-3);
  float len = clamp(sp * 0.018, 0.2, 3.5) * (0.5 + aCorner.z);
  vec3 side = normalize(cross(dir, c / max(dist, 1e-3)) + vec3(1e-5, 0., 0.));
  float wd = max(0.02, dist * 0.0011);
  vec3 p = uCam + c + dir * len * (aCorner.x - 0.5) + side * aCorner.y * wd;
  vA = fade * step(aCorner.z, uAmt) * smoothstep(1.2, 3., dist) * min(1., 0.02 / wd * 2.);
  vQ = aCorner.xy;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const GRAIN_FRAG = /* glsl */`
precision highp float;
varying float vA; varying vec2 vQ;
uniform vec3 uGrain; uniform float uGrainI;
void main(){
  float a = (1. - vQ.y * vQ.y) * smoothstep(0., 0.15, vQ.x) * (0.35 + 0.65 * vQ.x);
  gl_FragColor = vec4(uGrain * uGrainI * a * vA, 1.);
}`;
// The rig: spars, hub, shrouds, sling bar and reel in rig space (the eye at the origin, -Z ahead).
const RIG_VERT = /* glsl */`
attribute vec3 color; attribute vec3 aRig;               // shroud sag, sling weight, spar-tip weight
uniform float uSlack, uSway, uFlex, uTime;
varying vec3 vN, vC, vR;
void main(){
  vec3 p = position;
  p.y += aRig.z * uFlex;
  p.x += aRig.y * uSway; p.y += aRig.y * abs(uSway) * 0.12;
  p += vec3(sign(p.x) * 0.3, -0.55, 0.15) * aRig.x * uSlack * (1. + 0.25 * sin(uTime * 1.3 + p.y * 0.8));
  vN = normal; vC = color; vR = p;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
const RIG_FRAG = /* glsl */`
precision highp float;
varying vec3 vN, vC, vR;
uniform vec3 uSunRig, uSunC, uIonC; uniform float uDay, uNightK, uIonRim;
void main(){
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 key = mix(uSunC, vec3(1.), 0.5);                                       // metal: a neutral key, not a khaki one
  float ndl = max(dot(N, uSunRig), 0.);
  vec3 col = vC * key * uDay * (1.5 * ndl + 0.2 * max(-N.y, 0.) + 0.05);
  vec3 R = reflect(-uSunRig, N);
  float sp = max(R.z, 0.), sp2 = sp * sp, sp8 = sp2 * sp2 * sp2 * sp2;
  col += key * uDay * (sp8 * sp8 * sp8 * sp8 * sp8 * 2.2 + sp8 * 0.12) * (0.4 + 4. * vC.g);   // a tight glint running along every tube
  col += uIonC * uIonRim * (0.05 + 1.2 * vC.b) * pow(max(-N.x * 0.85 + N.y * 0.35, 0.), 2.);   // the ion tail on the port side
  col += (uIonC * 0.02 * max(N.y, 0.) + vec3(0.014, 0.018, 0.03) * (0.6 + 0.4 * N.z)) * uNightK;
  col += uSunC * 0.035 * max(dot(N, uSunRig) + 0.3, 0.) * (1. - uDay);        // the corona on the rig
  // pale carbon: the spars carry a rim of light on both edges, so the frame of the sail reads against the foil
  float rimE = 1. - abs(dot(N, normalize(-vR + vec3(0., 0., 1e-4))));
  col += vC.b * rimE * rimE * (key * (0.07 + 0.85 * uDay) + uIonC * uIonRim * 0.6);
  col += vC.b * vec3(0.05, 0.06, 0.085) * uNightK;
  gl_FragColor = vec4(col, 1.);
}`;
const GLSL_FOILDISP = /* glsl */`
float disp(vec2 q){
  if (uGyro > 0.5) { float r = length(q); return sin(r * 0.35 - uTime * 1.4) * 0.012 * r - r * r * 0.0035 * uWr + sin(r * 1.3 + uTime * 2.3) * 0.05 * uWr; }
  float m = smoothstep(0., 1.2, abs(abs(q.x) - abs(q.y)) / 12.);          // four gores billowing between the spars, no crease at the spars
  float slack = sin(q.x * 0.9 + uTime * 0.7 + sin(q.y * 0.6 - uTime * 0.4) * 1.3) * 0.5
              + sin(q.y * 1.3 - uTime * 0.55 + q.x * 0.4) * 0.35 + sin((q.x + q.y) * 2.1 + uTime * 0.9) * 0.15;
  float trail = smoothstep(7., 12., q.y) * sin(q.x * 1.7 + uTime * 5.) * 0.1;
  return m * (uWr * (0.42 * slack - 0.4 * m) + (1. - uWr) * 0.4 * m) + trail + dot(q, q) / 288. * uFlex;
}`;
const FOIL_VERT = /* glsl */`
uniform float uWr, uTime, uFlex, uSpin, uGyro;
varying vec3 vN; varying vec2 vUv, vQ;
${GLSL_FOILDISP}
void main(){
  vec2 q = position.xz;
  float cs = cos(uSpin), sn = sin(uSpin);
  q = vec2(cs * q.x - sn * q.y, sn * q.x + cs * q.y);
  float d0 = disp(q), e = 0.3;
  vN = normalize(vec3(-(disp(q + vec2(e, 0.)) - d0) / e, 1., -(disp(q + vec2(0., e)) - d0) / e));
  vUv = q / 24. + 0.5; vQ = q;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(q.x, d0, q.y, 1.);
}`;
const FOIL_FRAG = /* glsl */`
precision highp float;
varying vec3 vN; varying vec2 vUv, vQ;
uniform vec3 uFoilTint, uSunRig; uniform float uDay, uWr, uHi, uFoilTail, uGyro, uGround, uScroll, uIonRim, uScal;
uniform float uFlex;
${GLSL_NOISE}
${GLSL_SKY}
${GLSL_FOILDISP}
void main(){
  // a sail, not a slab: each edge is a catenary hem drawn in between two spar tips
  vec2 aq = abs(vQ); float mx = max(aq.x, aq.y), mn = min(aq.x, aq.y);
  float ed = 12. - uScal * (1. - mn * mn / 144.) - mx;          // metres inside the hem
  if (ed < 0. && uGyro < 0.5) discard;
  float px = 0.7 * length(fwidth(vQ));                           // metres per pixel on the foil
  // wrinkles per pixel, so reflections bend smoothly instead of breaking into facets
  float d0 = disp(vQ), e = 0.12;
  vec3 N = normalize(vec3(-(disp(vQ + vec2(e, 0.)) - d0) / e, 1., -(disp(vQ + vec2(0., e)) - d0) / e));
  // the mirror: the tails behind us, their vanishing point just under the leading hem, so the ion rays cross the foil as
  // separate straight blue strokes when it is taut and swim when it is slack; the cream tail shows at the starboard end
  float wk = mix(0.07, 0.3, clamp(uWr, 0., 1.));
  vec3 d = normalize(uAnti * 0.8 + uTailR * ((vUv.x - 0.44) * 1.9 + N.x * wk) + uTailU * ((vUv.y + 0.1) * 2.8 - (vUv.x - 0.5) * 0.9 + N.z * wk));
  vec3 mir = mix(vec3(1.), uFoilTint, 0.3);                     // a mirror keeps the colour of what it shows
  vec3 col = tails(d) * uFoilTail * mir;
  col += mir * vec3(0.016, 0.024, 0.044) * (0.25 + 2. * abs(N.x) + 2. * abs(N.z)) * uNightK;       // starlight on the creases
  // the crust below, mirrored: only a breath of toast, and a bright streak wherever a fountain stands
  float gs = vn(vec2(vUv.x * 6. + N.x * 4., vUv.y * 5. - uScroll));
  float jet = vn(vec2(vUv.x * 22. + N.x * 9., vUv.y * 2.5 - uScroll * 1.6)); jet *= jet; jet *= jet * jet;
  col += mir * uGround * (uSunC * vec3(0.008, 0.006, 0.004) * (0.25 + 1.5 * gs * gs) + vec3(1., 0.97, 0.9) * 0.4 * jet);
  // gore seams radiating from the hub: sixteen, four of them over the spars
  float ang = atan(vQ.x, abs(vQ.y) < 1e-4 ? 1e-4 : vQ.y);
  float sd = abs(fract(ang * 2.5465 + 0.5) - 0.5) * 0.3927 * length(vQ);
  float sw = max(px, 0.03);
  float seam = (1. - smoothstep(sw * 0.6, sw * 1.8, sd)) * (1. - uGyro) * min(1., 0.05 / sw);
  vec3 key = mix(uSunC, vec3(1.), 0.55) * uFoilTint;
  col *= 1. - 0.55 * seam;
  col += seam * (key * uDay * 0.035 + vec3(0.006, 0.008, 0.013) * uNightK);
  // lit: a taut sheet with one blazing glint sliding along it, drawn out into a streak (never a round lamp)
  vec2 hp = vec2(0.5 + 0.3 * sin(uHi * 0.9), 0.082 + 0.02 * cos(uHi * 1.3));
  vec2 dq = vUv - hp + N.xz * 0.25;
  float hi = exp(-dq.x * dq.x / 0.0016 - dq.y * dq.y / 0.00003) * 2.2 + exp(-dot(dq, dq) / 0.00011) * 4.;
  float sheen = 0.002 + 0.012 * pow(max(1. - abs(N.y), 0.), 0.5);
  col += key * uDay * sheen + mix(uFoilTint, vec3(1.), 0.7) * uDay * hi;
  // the hem cord: a pale line that catches whatever light there is
  float hw = max(0.11, px * 1.6);
  float hem = (1. - smoothstep(hw * 0.5, hw, ed)) * (1. - uGyro);
  vec3 hemC = vec3(0.1, 0.13, 0.2) * uNightK + key * uDay * 0.5 + uIonC * uIonRim * 0.45;
  col = mix(col, hemC, hem);
  gl_FragColor = vec4(col, 1.);
}`;
const GLOW_VERT = /* glsl */`
attribute vec4 aGlow;                                    // xyz centre, w size in metres
uniform vec2 uRes; uniform float uMinPx;
varying float vK;
void main(){
  vec4 mv = viewMatrix * vec4(aGlow.xyz, 1.);
  gl_Position = projectionMatrix * mv;
  float sz = aGlow.w * projectionMatrix[1][1] * uRes.y * 0.5 / max(-mv.z, 1.);
  vK = min(1., sz / uMinPx); vK = mix(1., vK * vK, step(sz, uMinPx));
  gl_PointSize = clamp(sz, uMinPx, 120.);
}`;
const GLOW_FRAG = /* glsl */`
precision highp float;
varying float vK; uniform vec3 uCol; uniform float uPulse;
void main(){
  vec2 q = gl_PointCoord * 2. - 1.; float r = length(q);
  float a = exp(-r * r * 22.) * 3. + pow(max(1. - r, 0.), 3.) * 0.5;
  gl_FragColor = vec4(uCol * a * uPulse * max(vK, 0.35), 1.);
}`;

// ------------------------------------------------------------------ small builders
function colored(g, r, gg, b) {
  const n = g.attributes.position.count, c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { c[i * 3] = r; c[i * 3 + 1] = gg; c[i * 3 + 2] = b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
function rigAttr(g, fn) {
  const p = g.attributes.position, a = new Float32Array(p.count * 3), o = [0, 0, 0];
  for (let i = 0; i < p.count; i++) { fn(p.getX(i), p.getY(i), p.getZ(i), o); a[i * 3] = o[0]; a[i * 3 + 1] = o[1]; a[i * 3 + 2] = o[2]; }
  g.setAttribute('aRig', new THREE.BufferAttribute(a, 3));
  return g;
}
// a tapered strut from a to b (rig space)
function strut(a, b, r0, r1, sides, col) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r1, r0, len, sides, 6, true);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
  g.translate(A.x, A.y, A.z);
  return colored(g.toNonIndexed(), col[0], col[1], col[2]);
}

export default {
  id: 'comet-perihelion',
  name: 'Perihelion',
  category: 'sky',
  media: ['space'],
  weirdness: 0.3,
  async build(ctx) {
    const { rng } = ctx;
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const detail = ctx.quality?.detail ?? 1;
    const density = clamp(vary.density ?? 1, 0.7, 1.3), dens01 = (density - 0.7) / 0.6;
    const vr = rng.fork('perihelion-looks');
    const sunKind = ['crown', 'grazer', 'small'][Math.floor(vr() * 3)];
    const nucleus = ['twin', 'potato', 'rust'][Math.floor(vr() * 3)];
    const tailKind = ['duo', 'sodium', 'coma'][Math.floor(vr() * 3)];
    const sailKind = ['mirror', 'mirror', 'gold', 'gyro'][Math.floor(vr() * 4)];
    const hourArrive = { night: 11.2, day: 6.4, dawn: 8.0, golden: 9.4 }[vary.hour];
    const arriveTime = hourArrive ?? vr.pick([7.5, 8.5, 8.5, 9.5]);
    const noise = makeNoise(vr.int(1, 1e9));
    const DUR = 48;   // (polish) script seconds per metre flown are what they were up to the top of the climb; the way out to the tail and down it has 19 s
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const pal = PALETTE.map((h) => new THREE.Color(h));

    // ------------------------------------------------------------ the path (hero space = world space)
    const AZ = 15 * DEG, EL = 5 * DEG;
    const anti = new THREE.Vector3(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL));   // down-sun, climbing 5 degrees
    const tailR = new THREE.Vector3().crossVectors(anti, new THREE.Vector3(0, 1, 0)).normalize();              // right when flying down-tail
    const tailU = new THREE.Vector3().crossVectors(tailR, anti).normalize();
    const pts = [[0, 14, 325], [0, 14, 150], [0, 14, -25], [0, 21, -110], [0, 37, -200], [0, 52, -280], [0, 60, -325]];
    const RT = 330, TURN = 195 * DEG;
    for (let k = 1; k <= 13; k++) {
      const t = k / 13, th = t * TURN, y = 60 + 580 * (0.15 * t + 0.85 * t * t * (3 - 2 * t));
      pts.push([-RT + RT * Math.cos(th), y, -325 - RT * Math.sin(th)]);
    }
    // (polish 2) the tail's axis (rope, braid, ring) stands 900 m to starboard of the top of the climb and 650 m above it: thrown
    // clear, we are blown out and up to it on a long diagonal, and from there the whole nucleus hangs in frame below us
    const turnEnd = new THREE.Vector3(...pts[pts.length - 1]), EX = 900, EY = 650;
    const legO = turnEnd.clone().addScaledVector(tailR, EX).addScaledVector(tailU, EY);
    const LEG = 2200;
    const outK = (a) => 1 - smoothstep(40, 760, a);
    // a shallow S down the tail: left toward the nearest ion ray, then right over the dust, the last 400 m dead straight
    // three beats: out to port alongside the nearest ion ray, then over to starboard and down onto the dust sheet, then the ring
    const plateau = (a, a0, a1, a2, a3) => smoothstep(a0, a1, a) * (1 - smoothstep(a2, a3, a));
    // (polish) four pictures down the tail: out to port alongside the rope of the nearest ion ray; a look back at the nucleus and
    // the sun from there; further out to port and up through the tumbling fragments, the horn of the braid opening ahead; then
    // a swing in through its wall and down its axis to the ring. The last 220 m are dead straight.
    const legLat = (a) => -EX * outK(a) - 42 * smoothstep(780, 980, a) - 78 * smoothstep(1150, 1500, a) + 120 * smoothstep(1560, 1900, a);
    const legDip = (a) => -EY * outK(a) + 26 * plateau(a, 1150, 1500, 1560, 1880);
    for (const a of [100, 200, 300, 400, 500, 600, 700, 800, 900, 1050, 1200, 1350, 1500, 1640, 1725, 1810, 1895, 1980, 2090, LEG]) pts.push(legO.clone().addScaledVector(anti, a).addScaledVector(tailR, legLat(a)).addScaledVector(tailU, legDip(a)));
    await ctx.yield();
    const path = makePath(pts, { samples: 640 });
    await ctx.yield();
    const L = path.length;
    // the leg begins where the climbing turn ends: dLeg metres flown. aLeg(u): metres down the tail's axis (negative before the leg)
    const tA = new THREE.Vector3();
    let uT = 0.4; { let best = 1e9; for (let i = 600; i <= 1400; i++) { const dd = path.pointAt(i / 2000, tA).distanceTo(turnEnd); if (dd < best) { best = dd; uT = i / 2000; } } }
    const dLeg = uT * L;
    const aLeg = (u) => (u <= uT ? u * L - dLeg : path.pointAt(Math.min(u, 1), tA).sub(legO).dot(anti));
    const uOfA = (a) => { let lo = uT, hi = 1; for (let k = 0; k < 20; k++) { const m = (lo + hi) / 2; if (aLeg(m) < a) lo = m; else hi = m; } return (lo + hi) / 2; };
    const S = smoothstep;
    const speedAt = (d) => 40 + 8 * S(330, 600, d) + 82 * S(600, dLeg, d) + 10 * S(dLeg - 200, dLeg + 500, d) + 60 * plateau(d - dLeg, 100, 400, 800, 1100) - 40 * plateau(d - dLeg, 1050, 1250, 1500, 1750) + 34 * S(dLeg + 1600, dLeg + 1900, d) - 74 * S(L - 800, L - 150, d);   // (polish) the tail leg is no longer a link to hurry through: it lingers on the look back and eases into the ring
    const pace = (u) => speedAt(clamp(u, 0, 1) * L) / 86;
    // script time as a function of u: the same sampling the engine does, integrated
    const NT = 512, tab = new Float32Array(NT + 1);
    {
      const pe = new Float32Array(65); for (let i = 0; i <= 64; i++) pe[i] = clamp(pace(i / 64), 0.35, 2.5);
      const pv = (u) => { const x = u * 64, i = Math.min(63, Math.floor(x)); return pe[i] + (pe[i + 1] - pe[i]) * (x - i); };
      for (let i = 1; i <= NT; i++) tab[i] = tab[i - 1] + (1 / NT) / pv((i - 0.5) / NT);
      for (let i = 1; i <= NT; i++) tab[i] *= DUR / tab[NT];
    }
    const sOfU = (u) => { const x = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(x)); return tab[i] + (tab[i + 1] - tab[i]) * (x - i); };
    const uOfS = (s) => { let lo = 0, hi = 1; for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (sOfU(m) < s) lo = m; else hi = m; } return (lo + hi) / 2; };
    const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
    const arriveZ = path.pointAt(uOfS(arriveTime), tmp).z;
    let uCliff = 0.1; for (let u = 0; u < 0.3; u += 0.002) if (path.pointAt(u, tmp).z < -195) { uCliff = u; break; }
    const cliffTime = Math.max(sOfU(uCliff) - 0.6, arriveTime + 1.2);

    await ctx.yield();
    // ------------------------------------------------------------ the hero: the waking terrace
    const vigor = sunKind === 'grazer' ? 1.32 : sunKind === 'small' ? 0.78 : 1.0;
    const hero = await buildHero(ctx, {
      palette: PALETTE, duration: DUR, arriveTime, arriveZ, lineSpeed: 30, cliffTime, vigor,
      vents: Math.round(lerp(22, 28, dens01)), farVents: Math.round(lerp(26, 60, dens01)),
      crust: nucleus === 'rust' ? 'rust' : 'charcoal', detail,
    });
    scene.add(hero.object);
    const HU = hero.uniforms, A = hero.anchors;
    const sunI0 = sunKind === 'grazer' ? 6.0 : sunKind === 'small' ? 4.4 : 5.2;
    const away2 = HU.uAway.value;
    const qOf = (x, z) => x * away2.x + z * away2.y;
    const lineTime = (x, z) => hero.lineTime(x, z);
    await ctx.yield();

    // ------------------------------------------------------------ shared uniforms
    const ionCol = pal[6].clone(), dustCol = pal[5].clone().multiply(new THREE.Color(1.03, 0.93, 0.9)), comaCol = new THREE.Color('#3fe0b0');
    if (tailKind === 'coma') ionCol.lerp(new THREE.Color('#bfe6ff'), 0.55);
    const sunR = (sunKind === 'grazer' ? 10 : sunKind === 'small' ? 1.6 : 4.5) * DEG;
    const G = {
      uTime: { value: 0 }, uS: { value: 0 }, uSunDir: { value: new THREE.Vector3(0, 0, -1) },
      uAnti: { value: anti }, uTailR: { value: tailR }, uTailU: { value: tailU },
      uSunC: { value: pal[3].clone() }, uIonC: { value: ionCol }, uDustC: { value: dustCol },
      uSodC: { value: new THREE.Color('#ffb040') }, uComaC: { value: comaCol },
      uSunR: { value: sunR }, uCorR: { value: Math.max(sunR * 0.8, 4.2 * DEG) },
      uCorona: { value: sunKind === 'grazer' ? 1.25 : sunKind === 'small' ? 0.8 : 1.0 },
      uDiscI: { value: sunKind === 'small' ? 7 : sunKind === 'grazer' ? 1.75 : 2.7 }, uProm: { value: sunKind === 'grazer' ? 1 : sunKind === 'small' ? 0 : 0.35 },
      uIonI: { value: (sunKind === 'small' ? 1.7 : 1) * (tailKind === 'coma' ? 0.7 : 1) }, uDustI: { value: sunKind === 'grazer' ? 0.5 : sunKind === 'small' ? 0.14 : 0.24 },
      uSod: { value: tailKind === 'sodium' ? 1.3 : 0 }, uComa: { value: tailKind === 'coma' ? 1 : 0 },
      uNightK: { value: 1 }, uCrown: { value: 0.3 }, uDay: { value: 0 }, uRes: { value: new THREE.Vector2(800, 450) },
      uLegO: { value: legO }, uLegLen: { value: LEG },
      uSailP: { value: new THREE.Vector3() }, uShOn: { value: 0 },
      uShD: { value: anti.clone().addScaledVector(tailU, -0.32).addScaledVector(tailR, 0.1).normalize() }, uShR: { value: new THREE.Vector3() }, uShU: { value: new THREE.Vector3() }, uShT: { value: 0 },
      uGrain: { value: pal[4].clone() },
    };
    G.uShR.value.crossVectors(G.uShD.value, new THREE.Vector3(0, 1, 0)).normalize();
    G.uShU.value.crossVectors(G.uShR.value, G.uShD.value).normalize();
    const pick = (...names) => { const o = {}; for (const n of names) o[n] = G[n] || HU[n]; return o; };
    const SKYU = ['uSunDir', 'uAnti', 'uTailR', 'uTailU', 'uSunC', 'uIonC', 'uDustC', 'uSodC', 'uComaC', 'uSunR', 'uCorR', 'uTime', 'uCorona', 'uIonI', 'uDustI', 'uSod', 'uComa', 'uDiscI', 'uProm', 'uNightK', 'uCrown'];
    const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide };

    // ------------------------------------------------------------ sky dome
    // the galaxy's band: its core 25 degrees to port of the tail's vanishing point and a little above it, the band running
    // down across the starboard bow, so it stands behind the ring on the last leg and behind the body on the climb
    const bandX = anti.clone().addScaledVector(tailR, -0.47).addScaledVector(tailU, 0.21).normalize();
    const bandN = new THREE.Vector3().crossVectors(bandX, tailU.clone().multiplyScalar(0.75).addScaledVector(tailR, -0.65)).normalize();
    const domeMat = new THREE.ShaderMaterial({
      vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthWrite: false,
      uniforms: { ...pick(...SKYU), uStars: { value: 0.75 }, uTailSky: { value: 0.28 }, uSoft: { value: 0 }, uHaze: { value: 1 },
        uBand: { value: 1.5 }, uBandN: { value: bandN }, uBandX: { value: bandX }, uNucDir: { value: new THREE.Vector3(0, -1, 0) }, uNucR: { value: 1 }, uComaG: { value: 0.1 } },
    });
    const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), domeMat);
    dome.renderOrder = -1; dome.frustumCulled = false; scene.add(dome);

    // ------------------------------------------------------------ the nucleus: lobes under and beyond the terrace
    const rockU = (tex, bump, beacon) => ({
      ...pick('uLineQ', 'uRc', 'uElevMax', 'uSunI', 'uIce', 'uAway', 'uSunCol', 'uIonCol', 'uCrust', 'uFrostCol', 'uTime', 'uComa', 'uComaC', 'uNightK'),
      uTex: { value: tex }, uBump: { value: bump }, uRim: { value: tex < 0.1 ? 0.4 : 0 }, uThread: { value: 0 }, uOct: { value: tex < 0.1 ? 1 : 0 }, uLocal: { value: 0 }, uFill: { value: 0 }, uThB: { value: nucleus === 'potato' ? new THREE.Vector4(650, 950, -5, 30) : new THREE.Vector4(1250, 1750, 50, 220) }, uBeacon: { value: beacon || new THREE.Vector4(0, 0, 0, 0) },
    });
    const potato = nucleus === 'potato';
    const nucC = new THREE.Vector3(0, -380, potato ? -330 : 125), NUC_R = 780;
    // (polish 3) sw, sh: the lobes the flight passes close to (the potato; the twin's body and neck) are sampled 2.4 times finer
    // each way than they were, so the pit's rim and the neck stand round; the far head lobe is as it was
    const lobeDefs = potato
      ? [{ c: [0, -690, -330], r: [820, 660, 1680], sw: 360, sh: 230, amp: 0.05, f: 1.6 }]
      : [{ c: [0, -690, 125], r: [760, 660, 1250], sw: 316, sh: 202, amp: 0.05, f: 1.6 },
         { c: [-170, -360, -1190], r: [600, 470, 460], sw: 154, sh: 96, amp: 0.09, f: 2.1 },
         { c: [720, 150, -1800], r: [760, 740, 800], sw: 96, sh: 60, amp: 0.085, f: 2.4 }];
    const surf = (L0, nx, ny, nz, out) => {
      const n1 = noise.fbm3(nx * L0.f + 3.1, ny * L0.f, nz * L0.f + 7.7, 4), n2 = noise.n3(nx * L0.f * 0.45, ny * L0.f * 0.45 + 5, nz * L0.f * 0.45);
      const k = 1 + L0.amp * (n1 + 0.8 * n2);
      let x = L0.c[0] + nx * L0.r[0] * k, y = L0.c[1] + ny * L0.r[1] * k, z = L0.c[2] + nz * L0.r[2] * k;
      if (L0 === lobeDefs[0]) {
        const r = Math.hypot(x / 300, z / 500);
        if (r < 1.3 && ny > 0) {
          // the body rises to meet the terrace's rim (3 m under it, 30 m under its middle), so the crown is part of the lobe
          const cx = clamp(x, -300, 300), cz = clamp(z, -500, 500), rc = Math.hypot(cx / 300, cz / 500);
          const tgt = hero.heightAt(cx, cz) + Math.max(0, rc - 1) * 260 - lerp(30, 3, S(0.84, 0.99, r));
          y = lerp(lerp(Math.min(y, tgt), tgt, S(0.84, 0.95, r)), y, S(1.0, 1.3, r));
        }
        if (potato && ny > 0) { const d = Math.hypot(x + 60, z + 800); y += -150 * (1 - S(70, 175, d)) + 95 * Math.exp(-(((d - 200) / 60) ** 2)); }
      }
      out[0] = x; out[1] = y; out[2] = z; out[3] = n1;
      return out;
    };
    const o4 = [0, 0, 0, 0];
    // (polish 3) the lobes are laid straight into one geometry's arrays in steps that yield, so the finer body never holds the
    // page: a sphere of sw by sh quads turned a quarter about x and then about z, the surface, the faces, the normals. Every
    // number is the one SphereGeometry, rotateX, rotateZ, computeVertexNormals and mergeGeometries gave, in their order.
    const lobeN = lobeDefs.reduce((s, L0) => s + (L0.sw + 1) * (L0.sh + 1), 0), lobeI = lobeDefs.reduce((s, L0) => s + 6 * L0.sw * (L0.sh - 1), 0);
    const lpos = new Float32Array(lobeN * 3), lnor = new Float32Array(lobeN * 3), lcol = new Float32Array(lobeN * 3), lidx = new Uint32Array(lobeI);
    const turnX = new THREE.Matrix4().makeRotationX(Math.PI / 2), turnZ = new THREE.Matrix4().makeRotationZ(Math.PI / 2), TAU = Math.PI * 2;
    const lv = new THREE.Vector3(), fA = new THREE.Vector3(), fB = new THREE.Vector3(), fC = new THREE.Vector3(), cb = new THREE.Vector3(), ab = new THREE.Vector3();
    let v0 = 0, i0 = 0;
    for (const L0 of lobeDefs) {
      const sw = L0.sw, sh = L0.sh, row = sw + 1, n = row * (sh + 1), nI = 6 * sw * (sh - 1);
      for (let i = 0; i < n; i++) {
        const u = (i % row) / sw, v = Math.floor(i / row) / sh, k = (v0 + i) * 3;
        lpos[k] = -Math.cos(u * TAU) * Math.sin(v * Math.PI); lpos[k + 1] = Math.cos(v * Math.PI); lpos[k + 2] = Math.sin(u * TAU) * Math.sin(v * Math.PI);
        lv.set(lpos[k], lpos[k + 1], lpos[k + 2]).applyMatrix4(turnX); lpos[k] = lv.x; lpos[k + 1] = lv.y; lpos[k + 2] = lv.z;
        lv.set(lpos[k], lpos[k + 1], lpos[k + 2]).applyMatrix4(turnZ); lpos[k] = lv.x; lpos[k + 1] = lv.y; lpos[k + 2] = lv.z;
        surf(L0, lpos[k], lpos[k + 1], lpos[k + 2], o4);
        lpos[k] = o4[0]; lpos[k + 1] = o4[1]; lpos[k + 2] = o4[2];
        const c = 0.85 + 0.35 * o4[3]; lcol[k] = c; lcol[k + 1] = c; lcol[k + 2] = c;
        if (i % 400 === 399) await ctx.yield();
      }
      await ctx.yield();
      // the faces, two to a quad, one only on the rows that touch a pole
      for (let iy = 0, j = i0; iy < sh; iy++) {
        for (let ix = 0; ix < sw; ix++) {
          const b = v0 + iy * row + ix, a = b + 1, c = b + row, d = c + 1;
          if (iy !== 0) { lidx[j++] = a; lidx[j++] = b; lidx[j++] = d; }
          if (iy !== sh - 1) { lidx[j++] = b; lidx[j++] = c; lidx[j++] = d; }
        }
        if (iy % 24 === 23) await ctx.yield();
      }
      await ctx.yield();
      // the normals: each face's cross product summed into its three corners, then every sum made one long
      for (let j = i0; j < i0 + nI; j += 3) {
        const a = lidx[j] * 3, b = lidx[j + 1] * 3, c = lidx[j + 2] * 3;
        fA.set(lpos[a], lpos[a + 1], lpos[a + 2]); fB.set(lpos[b], lpos[b + 1], lpos[b + 2]); fC.set(lpos[c], lpos[c + 1], lpos[c + 2]);
        cb.subVectors(fC, fB); ab.subVectors(fA, fB); cb.cross(ab);
        lnor[a] += cb.x; lnor[a + 1] += cb.y; lnor[a + 2] += cb.z;
        lnor[b] += cb.x; lnor[b + 1] += cb.y; lnor[b + 2] += cb.z;
        lnor[c] += cb.x; lnor[c + 1] += cb.y; lnor[c + 2] += cb.z;
        if ((j - i0) % 6000 === 5997) await ctx.yield();
      }
      await ctx.yield();
      for (let i = 0; i < n; i++) {
        const k = (v0 + i) * 3;
        lv.set(lnor[k], lnor[k + 1], lnor[k + 2]).normalize(); lnor[k] = lv.x; lnor[k + 1] = lv.y; lnor[k + 2] = lv.z;
        if (i % 4000 === 3999) await ctx.yield();
      }
      v0 += n; i0 += nI;
      await ctx.yield();
    }
    const lobeGeo = new THREE.BufferGeometry();
    lobeGeo.setIndex(new THREE.BufferAttribute(lidx, 1));
    lobeGeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3)); lobeGeo.setAttribute('normal', new THREE.BufferAttribute(lnor, 3)); lobeGeo.setAttribute('color', new THREE.BufferAttribute(lcol, 3));
    await ctx.yield();
    const lobes = new THREE.Mesh(lobeGeo, new THREE.ShaderMaterial({ vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, uniforms: rockU(0.012, 2.2) }));
    lobes.frustumCulled = false; scene.add(lobes);
    await ctx.yield();

    // far plumes on the lobes: burning on the day side beyond the horizon, igniting behind the line on the night plain
    const plumes = [];
    const addPlume = (L0, nx, ny, nz, h, w, burning) => {
      const l = Math.hypot(nx, ny, nz); surf(L0, nx / l, ny / l, nz / l, o4);
      const up = new THREE.Vector3(nx / (l * L0.r[0]), ny / (l * L0.r[1]) + 2.6 / L0.r[1], nz / (l * L0.r[2])).normalize();
      plumes.push({ p: [o4[0], o4[1] - 6, o4[2]], up, h, w, t0: burning ? -1 : lineTime(o4[0], o4[2]) + vr.range(0.5, 1.6), seed: vr() });
    };
    const nPl = Math.round(lerp(9, 16, dens01));
    if (potato) {
      for (let i = 0; i < nPl; i++) { const a = vr.range(0, 6.283), d = vr.range(70, 190); const x = -60 + Math.cos(a) * d, z = -800 + Math.sin(a) * d; addPlume(lobeDefs[0], x / 820, 0.97, (z + 330) / 1680, vr.range(260, 620) * vigor, vr.range(9, 16), true); }
      for (let i = 0; i < nPl; i++) addPlume(lobeDefs[0], vr.range(-0.55, 0.55), 0.8, vr.range(-0.75, -0.42), vr.range(200, 520) * vigor, vr.range(10, 18), true);
    } else {
      for (let i = 0; i < nPl + 6; i++) addPlume(lobeDefs[1], vr.range(-0.8, 0.6), vr.range(0.55, 1), vr.range(-0.7, 0.25), vr.range(220, 620) * vigor, vr.range(9, 17), true);
      for (let i = 0; i < nPl; i++) addPlume(lobeDefs[2], vr.range(-1, -0.2), vr.range(-0.1, 0.9), vr.range(-0.8, 0.5), vr.range(300, 700) * vigor, vr.range(12, 22), true);
    }
    for (let i = 0; i < nPl + 6; i++) {
      const x = vr.range(-0.6, 0.6), z = vr.range(0.33, 0.8);
      addPlume(lobeDefs[0], x, 0.85, potato ? z + 0.12 : z, vr.range(150, 420) * vigor, vr.range(7, 13), false);
    }
    // a hedge on the flanks either side of the terrace: seen from the climb, it rises in the wake of the line
    for (let i = 0; i < 14; i++) {
      const sx = i & 1 ? 1 : -1, x = sx * vr.range(0.44, 0.74), z = vr.range(-0.3, 0.42);
      addPlume(lobeDefs[0], x, Math.sqrt(Math.max(0.05, 1 - x * x - z * z)), potato ? z + 0.2 : z, vr.range(170, 420) * vigor, vr.range(8, 14), false);
    }
    const plumeI = { value: 0.3 * vigor };
    {
      const base = mergeGeometries([new THREE.PlaneGeometry(1, 1, 1, 10), new THREE.PlaneGeometry(1, 1, 1, 10).translate(0, 0, 1)]);
      const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('uv', base.attributes.uv);
      const n = plumes.length, iB = new Float32Array(n * 3), iU = new Float32Array(n * 3), iP = new Float32Array(n * 4);
      plumes.forEach((q, i) => { iB.set(q.p, i * 3); iU.set([q.up.x, q.up.y, q.up.z], i * 3); iP.set([q.h, q.w, q.t0, q.seed], i * 4); });
      g.setAttribute('iBase', new THREE.InstancedBufferAttribute(iB, 3)); g.setAttribute('iUp', new THREE.InstancedBufferAttribute(iU, 3)); g.setAttribute('iPar', new THREE.InstancedBufferAttribute(iP, 4));
      g.instanceCount = n;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: PLUME_VERT, fragmentShader: PLUME_FRAG, ...additive,
        uniforms: { ...pick('uS', 'uLineQ', 'uRc', 'uAway', 'uTime', 'uGrain', 'uSunDir'), uPlumeI: plumeI } }));
      m.name = 'far-plumes'; m.frustumCulled = false; m.renderOrder = 2; scene.add(m);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the tails (leg frame: along anti, left = -tailR, up = tailU)
    const legPt = (a, l, h, out = new THREE.Vector3()) => out.copy(legO).addScaledVector(anti, a).addScaledVector(tailR, -l).addScaledVector(tailU, h);
    const tr = rng.fork('perihelion-tails');
    const ionG = { value: 1 }, dustG = { value: 1 }, moteG = { value: 0 };
    const ionBase = (sunKind === 'small' ? 1.5 : 1) * (tailKind === 'coma' ? 0.75 : 1);
    const dustBase = (sunKind === 'grazer' ? 0.34 : sunKind === 'small' ? 0.15 : 0.2);
    {
      // ion rays
      const rays = [], NR = 15;
      for (let i = 0; i < NR; i++) {
        const f = i / (NR - 1), l1 = 27 + 480 * Math.pow(f, 1.35) + (i ? tr.range(-10, 10) : 0), h1 = i === 0 ? 6 : tr.range(-40, 270);
        const a0 = tr.range(250, 520), l0 = l1 + tr.range(50, 230), h0 = h1 - tr.range(140, 480);
        rays.push({ a0, l0: l0 + EX * 0.8, h0: h0 - EY * 0.8, l1, h1, w: i < 3 ? tr.range(2.5, 4) : tr.range(5, 13), braid: 0, seg: 150, seed: tr() });
      }
      Object.assign(rays[0], { a0: 240, l0: 72, h0: -12, l1: 61, h1: 5, w: 6, seg: 260 });      // the near ray: runs alongside, 15 m off the port spar tip while we hold out to port
      if (tailKind === 'sodium') rays.push({ a0: 300, l0: 150 + EX * 0.8, h0: -250 - EY * 0.8, l1: -70, h1: 50, w: 1.3, braid: 0, seg: 150, seed: tr(), sod: true });
      tr(); tr();
      // (polish) the near ray is a rope: five strands wound round each other 28 m off our port side, kinked and knotted
      const ropeSeed = rays[0].seed;
      Object.assign(rays[0], { w: 1.5, rope: [0, 5.2], end: 3000, seg: 560 });
      for (let k = 1; k < 5; k++) rays.push({ ...rays[0], w: k & 1 ? 0.9 : 1.3, rope: [k * 1.2566, k & 1 ? 6.4 : 4.4], seed: ropeSeed });
      const build = (list) => {
        let nv = 0, ni = 0; for (const r of list) { nv += (r.seg + 1) * 2; ni += r.seg * 6; }
        const P = new Float32Array(nv * 3), P0 = new Float32Array(nv * 3), P1 = new Float32Array(nv * 3), Par = new Float32Array(nv * 4), Br = new Float32Array(nv), Rp = new Float32Array(nv * 2), idx = new Uint32Array(ni);
        let v = 0, k = 0; const a = new THREE.Vector3(), b = new THREE.Vector3();
        for (const r of list) {
          legPt(r.a0, r.l0, r.h0, a); const e = ((r.end || 6300) - r.a0) / (LEG - r.a0);
          legPt(r.a0 + (LEG - r.a0) * e, r.l0 + (r.l1 - r.l0) * e, r.h0 + (r.h1 - r.h0) * e, b);
          for (let j = 0; j <= r.seg; j++) for (let sd = -1; sd <= 1; sd += 2) {
            P.set([a.x, a.y, a.z], v * 3); P0.set([a.x, a.y, a.z], v * 3); P1.set([b.x, b.y, b.z], v * 3);
            Par.set([j / r.seg, sd, r.w, r.seed], v * 4); Br[v] = r.braid; if (r.rope) Rp.set(r.rope, v * 2); v++;
          }
          const base = v - (r.seg + 1) * 2;
          for (let j = 0; j < r.seg; j++) { const o = base + j * 2; idx.set([o, o + 1, o + 2, o + 1, o + 3, o + 2], k); k += 6; }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aP0', new THREE.BufferAttribute(P0, 3)); g.setAttribute('aP1', new THREE.BufferAttribute(P1, 3));
        g.setAttribute('aPar', new THREE.BufferAttribute(Par, 4)); g.setAttribute('aBraid', new THREE.BufferAttribute(Br, 1)); g.setAttribute('aRope', new THREE.BufferAttribute(Rp, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
        return g;
      };
      const mk = (list, colU) => {
        const m = new THREE.Mesh(build(list), new THREE.ShaderMaterial({ vertexShader: ION_VERT, fragmentShader: ION_FRAG, ...additive,
          uniforms: { ...pick('uLegO', 'uAnti', 'uTailR', 'uTailU', 'uTime', 'uLegLen'), uIonC: colU, uIonG: ionG } }));
        m.frustumCulled = false; m.renderOrder = 3; scene.add(m);
      };
      await ctx.yield();
      mk(rays.filter((r) => !r.sod), G.uIonC);
      if (tailKind === 'sodium') mk(rays.filter((r) => r.sod), G.uSodC);
    }
    await ctx.yield();
    // ------------------------------------------------------------ (polish) the braid: a horn of wound rays narrowing onto the ring
    const vorG = { value: 0 }, whirlG = { value: 0 }, hornG = { value: 0 };
    {
      const arms = [], vq = rng.fork('perihelion-braid');
      const NARM = Math.round(30 * Math.max(0.7, detail));
      for (let i = 0; i < NARM; i++) {
        const inner = i % 5 === 4;
        arms.push({ ph: i * 2.39996 + vq.range(-0.2, 0.2), rf: inner ? vq.range(0.45, 0.75) : vq.range(0.88, 1.22), x0: inner ? vq.range(380, 700) : vq.range(820, 1350), w: inner ? vq.range(0.9, 1.5) : vq.range(1.3, 3.2), seg: 150, seed: vq() });
      }
      for (let k = 0; k < 3; k++) arms.push({ ph: k * 2.1, rf: 1 + k * 0.09, x0: -1, w: 0.75 - k * 0.15, seg: 96, seed: vq() });
      let nv = 0, ni = 0; for (const r of arms) { nv += (r.seg + 1) * 2; ni += r.seg * 6; }
      const P = new Float32Array(nv * 3), Par = new Float32Array(nv * 4), Arm = new Float32Array(nv * 3), idx = new Uint32Array(ni);
      let v = 0, k = 0;
      for (const r of arms) {
        const base = v;
        for (let j = 0; j <= r.seg; j++) for (let sd = -1; sd <= 1; sd += 2) { Par.set([j / r.seg, sd, r.w, r.seed], v * 4); Arm.set([r.ph, r.rf, r.x0], v * 3); v++; }
        for (let j = 0; j < r.seg; j++) { const o = base + j * 2; idx.set([o, o + 1, o + 2, o + 1, o + 3, o + 2], k); k += 6; }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aPar', new THREE.BufferAttribute(Par, 4)); g.setAttribute('aArm', new THREE.BufferAttribute(Arm, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: VORTEX_VERT, fragmentShader: VORTEX_FRAG, ...additive,
        uniforms: { ...pick('uLegO', 'uAnti', 'uTailR', 'uTailU', 'uTime', 'uLegLen', 'uIonC'), uVorG: vorG, uWarm: { value: new THREE.Color(1.0, 0.86, 0.62) } } }));
      m.frustumCulled = false; m.renderOrder = 3; scene.add(m);
      const hm = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 72, 56), new THREE.ShaderMaterial({ vertexShader: HORN_VERT, fragmentShader: HORN_FRAG, ...additive,
        uniforms: { ...pick('uLegO', 'uAnti', 'uTailR', 'uTailU', 'uTime', 'uLegLen', 'uIonC'), uHornG: hornG, uWarm: { value: new THREE.Color(1.0, 0.86, 0.62) } } }));
      hm.geometry.translate(0.5, 0.5, 0); hm.geometry.attributes.uv.needsUpdate = true;
      hm.name = 'horn-skin'; hm.frustumCulled = false; hm.renderOrder = 2; scene.add(hm);
      // the whirlpool disc in the plane of the opening
      const wm = new THREE.Mesh(new THREE.RingGeometry(9.0, 190, 96, 1), new THREE.ShaderMaterial({ vertexShader: WHIRL_VERT, fragmentShader: WHIRL_FRAG, ...additive,
        uniforms: { ...pick('uTime', 'uIonC'), uWhirlG: whirlG, uHole: { value: 9.4 }, uRad: { value: 190 }, uWarm: { value: new THREE.Color(1.0, 0.86, 0.62) } } }));
      wm.position.copy(legO).addScaledVector(anti, LEG + 0.5); wm.lookAt(legO); wm.frustumCulled = false; wm.renderOrder = 3; scene.add(wm);
    }
    await ctx.yield();
    const A0 = 200, A1 = 6500;
    {
      // dust sheets
      const NA = 80, NW = 12, geos = [], tilt = [0.05, 0.12, -0.3, 0.26];
      const p = new THREE.Vector3(), ax = new THREE.Vector3();
      for (let j = 0; j < 4; j++) {
        const nv = (NA + 1) * (NW + 1), P = new Float32Array(nv * 3), Sh = new Float32Array(nv * 3), idx = [];
        const ph = tr.range(0, 6.283);
        for (let i = 0; i <= NA; i++) {
          const a = lerp(A0, A1, Math.pow(i / NA, 1.25)), sm = S(A0, 1600, a), far = Math.max(0, a - 2000);
          const lc = lerp(400, j ? -(175 + 75 * j) : -150, sm) - far * 0.13 * (1 + 0.3 * j) + 30 * Math.sin(a * 0.0016 + ph);
          // sheet 0 rises to 55 m under the leg at a = 1300-1700 (we dip to 33 m over it), then falls away so the ring stands clear
          const hc = j ? lerp(-430, -(48 + 46 * j), S(A0, 1100, a)) - far * 0.02 * j : lerp(-430, -125, S(A0, 1320, a)) - 40 * S(1500, 2400, a);
          const W = 110 + 0.12 * (a - A0), back = 1 - S(A0, 1400, a);     // (polish 2) the sheets still lift off the crown, and sweep up to the tail's axis
          ax.copy(tailR).multiplyScalar(-Math.cos(tilt[j])).addScaledVector(tailU, Math.sin(tilt[j]));
          for (let k = 0; k <= NW; k++) {
            const w = (k / NW) * 2 - 1, o = i * (NW + 1) + k;
            legPt(a, lc + EX * back, hc - EY * back, p).addScaledVector(ax, w * W);
            P.set([p.x, p.y, p.z], o * 3); Sh.set([a, w, j], o * 3);
            if (i < NA && k < NW) idx.push(o, o + 1, o + NW + 1, o + 1, o + NW + 2, o + NW + 1);
          }
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aSheet', new THREE.BufferAttribute(Sh, 3)); g.setIndex(idx);
        geos.push(g);
      }
      const m = new THREE.Mesh(mergeGeometries(geos), new THREE.ShaderMaterial({ vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, ...additive,
        uniforms: { ...pick('uTime', 'uTailU', 'uAnti', 'uDustC', 'uSailP', 'uShD', 'uShR', 'uShU', 'uShOn', 'uShT'), uDustG: dustG, uA0: { value: A0 }, uA1: { value: A1 } } }));
      geos.forEach((g) => g.dispose());
      m.frustumCulled = false; m.renderOrder = 2; scene.add(m);
      await ctx.yield();
      // motes: soft sprites through the corridor for parallax
      const NM = Math.round(4200 * detail * density), La = new Float32Array(NM * 4), Pm = new Float32Array(NM * 3);
      for (let i = 0; i < NM; i++) {
        let l = tr.range(-430, 240), h = tr.range(-320, 110); if (tr.chance(0.5)) { l = tr.range(-260, 40); h = tr.range(-170, 20); }
        const r = Math.hypot(l, h); if (r < 16) { l *= 16 / Math.max(r, 0.1); h *= 16 / Math.max(r, 0.1); }
        La.set([tr.range(0, 3600), l, h, tr()], i * 4);
      }
      const gm = new THREE.BufferGeometry(); gm.setAttribute('position', new THREE.BufferAttribute(Pm, 3)); gm.setAttribute('aLeg', new THREE.BufferAttribute(La, 4));
      const motes = new THREE.Points(gm, new THREE.ShaderMaterial({ vertexShader: MOTE_VERT, fragmentShader: MOTE_FRAG, ...additive,
        uniforms: { ...pick('uLegO', 'uAnti', 'uTailR', 'uTailU', 'uTime', 'uRes', 'uDustC', 'uSailP', 'uShD', 'uShR', 'uShU', 'uShOn', 'uShT'), uMoteG: moteG, uA0: { value: -350 }, uA1: { value: 3250 } } }));
      motes.name = 'motes'; motes.frustumCulled = false; motes.renderOrder = 3; scene.add(motes);
    }
    await ctx.yield();
    // near grains
    const grainU = { uCam: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(64, 44, 64) }, uRel: { value: new THREE.Vector3(0, 1, 0) }, uDrift: { value: new THREE.Vector3() }, uAmt: { value: 0 }, uGrain: G.uGrain, uGrainI: { value: 1.7 } };
    {
      const NG = Math.round(3000 * detail), Sd = new Float32Array(NG * 12), Co = new Float32Array(NG * 12), P = new Float32Array(NG * 12), idx = new Uint32Array(NG * 6);
      for (let i = 0; i < NG; i++) {
        const sx = tr(), sy = tr(), sz = tr(), rn = tr();
        for (let c = 0; c < 4; c++) { Sd.set([sx, sy, sz], i * 12 + c * 3); Co.set([c >> 1, (c & 1) * 2 - 1, rn], i * 12 + c * 3); }
        idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 1, i * 4 + 3, i * 4 + 2], i * 6);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(Sd, 3)); g.setAttribute('aCorner', new THREE.BufferAttribute(Co, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: GRAIN_VERT, fragmentShader: GRAIN_FRAG, ...additive, uniforms: grainU }));
      m.name = 'near-grains'; m.frustumCulled = false; m.renderOrder = 4; scene.add(m);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the sail rig (rig space = the camera's space)
    const rig = new THREE.Group(); rig.matrixAutoUpdate = false; rig.frustumCulled = false; scene.add(rig);
    const HUB = [0, 7.7, 2], TILT = 4 * DEG;   // high: only the leading hem and the two forward spar tips are in the picture
    const corner = (sx, sz) => [HUB[0] + sx * 12, HUB[1] - sz * 12 * Math.sin(TILT), HUB[2] + sz * 12 * Math.cos(TILT)];
    const rigU = { uSlack: { value: 1 }, uSway: { value: 0 }, uFlex: { value: 0 }, uTime: G.uTime, uSunRig: { value: new THREE.Vector3(0, 0, -1) }, uSunC: G.uSunC, uIonC: G.uIonC, uDay: G.uDay, uNightK: G.uNightK, uIonRim: { value: 0 } };
    {
      const carbon = [0.3, 0.31, 0.36], silver = [0.1, 0.105, 0.115], line = [0.2, 0.2, 0.22], parts = [];
      const barY = -2.75, barZ = -2.65, barX = 7.2;   // the sling bar rides the bottom edge, its shrouds the side edges: the comet has the picture
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const c = corner(sx, sz);
        // the spar hangs just under the foil, so it is seen against it; a pale boss at its tip takes the shroud
        const tipW = (x, y, z, o) => { const d = Math.hypot(x - HUB[0], z - HUB[2]) / 17; o[0] = 0; o[1] = 0; o[2] = d * d; };
        parts.push(rigAttr(strut([HUB[0], HUB[1] - 0.2, HUB[2]], [c[0], c[1] - 0.13, c[2]], 0.15, 0.075, 6, carbon), tipW));
        parts.push(rigAttr(colored(new THREE.SphereGeometry(0.17, 8, 6).translate(c[0], c[1] - 0.13, c[2]).toNonIndexed(), 0.34, 0.35, 0.4), tipW));
        const e = [sx * barX, barY, barZ];
        parts.push(rigAttr(strut(e, c, 0.01, 0.03, 5, line), (x, y, z, o) => { const t = clamp((y - barY) / (c[1] - barY), 0, 1); o[0] = Math.sin(Math.PI * t); o[1] = (1 - t) * (1 - t); o[2] = t * t; }));
      }
      await ctx.yield();
      const one = (x, y, z, o) => { o[0] = 0; o[1] = 1; o[2] = 0; };
      const dark = [0.035, 0.037, 0.042], bright = [0.2, 0.205, 0.215];
      const disc = (x, r, w, col, n = 16) => rigAttr(colored(new THREE.CylinderGeometry(r, r, w, n).rotateZ(Math.PI / 2).translate(x, barY, barZ).toNonIndexed(), ...col), one);
      parts.push(rigAttr(strut([-barX - 0.15, barY, barZ], [barX + 0.15, barY, barZ], 0.034, 0.034, 10, silver), one));
      // clamp collars, each a dark band between two bright lips
      for (const x of [-5.6, -2.9, 2.9, 5.6]) { parts.push(disc(x, 0.046, 0.08, dark)); parts.push(disc(x - 0.05, 0.052, 0.016, bright)); parts.push(disc(x + 0.05, 0.052, 0.016, bright)); }
      // end caps, and a shackle where each forward shroud meets the bar
      for (const sx of [-1, 1]) {
        parts.push(rigAttr(colored(new THREE.SphereGeometry(0.05, 10, 8).translate(sx * (barX + 0.15), barY, barZ).toNonIndexed(), ...bright), one));
        parts.push(disc(sx * barX, 0.055, 0.05, dark));
        parts.push(rigAttr(colored(new THREE.TorusGeometry(0.05, 0.012, 6, 14).translate(sx * barX, barY + 0.08, barZ).toNonIndexed(), ...bright), one));
      }
      await ctx.yield();
      // the tether reel: a ribbed drum between two flanges, wound line, a guide arm and the tether dropping out of frame
      parts.push(disc(0, 0.06, 0.3, dark, 18));
      for (let k = 0; k < 7; k++) parts.push(disc(-0.105 + k * 0.035, 0.074, 0.016, k & 1 ? silver : bright, 18));
      for (const sx of [-1, 1]) { parts.push(disc(sx * 0.16, 0.1, 0.02, silver, 20)); parts.push(disc(sx * 0.175, 0.04, 0.02, bright, 10)); }
      parts.push(rigAttr(colored(new THREE.BoxGeometry(0.04, 0.04, 0.24).translate(0, barY - 0.08, barZ - 0.1).toNonIndexed(), ...dark), one));
      parts.push(rigAttr(strut([0, barY - 0.08, barZ - 0.22], [0, barY - 3.2, barZ - 0.5], 0.012, 0.012, 5, line), one));
      parts.push(rigAttr(colored(new THREE.SphereGeometry(0.4, 10, 8).translate(...HUB).toNonIndexed(), ...carbon), (x, y, z, o) => { o[0] = o[1] = o[2] = 0; }));
      for (const g of parts) g.deleteAttribute('uv');
      await ctx.yield();
      const m = new THREE.Mesh(mergeGeometries(parts), new THREE.ShaderMaterial({ vertexShader: RIG_VERT, fragmentShader: RIG_FRAG, uniforms: rigU, side: THREE.DoubleSide }));
      parts.forEach((g) => g.dispose());
      m.frustumCulled = false; m.renderOrder = 6; rig.add(m);
    }
    await ctx.yield();
    const gyro = sailKind === 'gyro';
    const foilU = { ...pick(...SKYU), uSoft: { value: 0.1 }, uGround: { value: 0 }, uScroll: { value: 0 }, uWr: { value: 1 }, uFlex: rigU.uFlex, uSpin: { value: 0 }, uGyro: { value: gyro ? 1 : 0 }, uSunRig: rigU.uSunRig, uDay: G.uDay, uHi: { value: 0 },
      uIonRim: rigU.uIonRim, uScal: { value: gyro ? 0 : 0.95 },
      uFoilTail: { value: 0.55 }, uFoilTint: { value: sailKind === 'gold' ? new THREE.Color(1.0, 0.72, 0.3) : new THREE.Color(0.92, 0.95, 1.0) } };
    {
      let g;
      if (gyro) { const bl = []; for (let k = 0; k < 6; k++) bl.push(new THREE.PlaneGeometry(1.9, 24, 2, 24).rotateX(-Math.PI / 2).translate(0, 0, -15).rotateY(k * Math.PI / 3)); g = mergeGeometries(bl); bl.forEach((b) => b.dispose()); }
      else g = new THREE.PlaneGeometry(24, 24, 24, 24).rotateX(-Math.PI / 2);
      const foil = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: FOIL_VERT, fragmentShader: FOIL_FRAG, uniforms: foilU, side: THREE.DoubleSide }));
      foil.position.set(HUB[0], HUB[1] + (gyro ? 5.6 : 0.02), HUB[2] + (gyro ? 3 : 0)); foil.rotation.x = TILT; foil.frustumCulled = false; foil.renderOrder = 5; rig.add(foil);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the dead lander and its beacon
    const seat = A.landerSeat.position, beaconP = new THREE.Vector3(seat[0] - 0.6, seat[1] + 3.3, seat[2] + 0.4);
    const beaconU = new THREE.Vector4(beaconP.x, beaconP.y, beaconP.z, 0);
    {
      const gold = [0.85, 0.6, 0.22], silver = [0.55, 0.57, 0.6], parts = [];
      parts.push(colored(new THREE.CylinderGeometry(0.9, 1.0, 0.9, 8).translate(0, 1.15, 0).toNonIndexed(), ...gold));
      parts.push(colored(new THREE.CylinderGeometry(0.5, 0.78, 0.45, 8).translate(0, 1.82, 0).toNonIndexed(), ...silver));
      parts.push(colored(new THREE.ConeGeometry(0.6, 0.32, 12, 1, true).rotateX(Math.PI).translate(0.2, 2.45, 0).toNonIndexed(), 0.7, 0.72, 0.75));
      parts.push(colored(new THREE.BoxGeometry(1.9, 0.05, 0.85).translate(1.75, 1.5, 0).toNonIndexed(), 0.08, 0.12, 0.35));
      for (let k = 0; k < 3; k++) {
        const a = k * 2.094 + 0.5, c = Math.cos(a), s = Math.sin(a);
        parts.push(strut([c * 0.8, 0.95, s * 0.8], [c * 2.1, 0.05, s * 2.1], 0.06, 0.05, 5, silver));
        parts.push(strut([c * 0.8, 0.75, s * 0.8], [c * 1.5, 0.5, s * 1.5], 0.04, 0.04, 4, silver));
        parts.push(colored(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 10).translate(c * 2.1, 0.03, s * 2.1).toNonIndexed(), ...silver));
      }
      for (const g of parts) g.deleteAttribute('uv');
      const lu = rockU(1.5, 0.25, beaconU); lu.uCrust = { value: new THREE.Color(0.3, 0.3, 0.3) }; lu.uIce = { value: 0 };
      const lander = new THREE.Mesh(mergeGeometries(parts), new THREE.ShaderMaterial({ vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, uniforms: lu, side: THREE.DoubleSide }));
      parts.forEach((g) => g.dispose());
      lander.scale.setScalar(1.5); lander.position.set(seat[0] + 1.5, seat[1] + 1.5, seat[2]); lander.rotation.set(0.25, 0.6, 1.72);
      scene.add(lander);
    }
    await ctx.yield();
    const glowMat = (col, minPx) => new THREE.ShaderMaterial({ vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, ...additive, depthTest: true,
      uniforms: { uRes: G.uRes, uMinPx: { value: minPx }, uCol: { value: col }, uPulse: { value: 0 } } });
    const beaconMat = glowMat(new THREE.Color(0.75, 0.88, 1.0).multiplyScalar(2.6), 8);
    {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
      g.setAttribute('aGlow', new THREE.BufferAttribute(new Float32Array([beaconP.x, beaconP.y, beaconP.z, 4.4]), 4));
      const b = new THREE.Points(g, beaconMat); b.name = 'beacon'; b.frustumCulled = false; b.renderOrder = 7; scene.add(b);
    }
    const spill = new THREE.Mesh(new THREE.CircleGeometry(15, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ vertexColors: true, ...additive }));
    {
      const n = spill.geometry.attributes.position.count, c = new Float32Array(n * 3); c.set([0.13, 0.165, 0.22], 0);
      spill.geometry.setAttribute('color', new THREE.BufferAttribute(c, 3));
      spill.position.set(seat[0], seat[1] + 0.9, seat[2]); scene.add(spill);
    }

    // ------------------------------------------------------------ rare event: a fragment of the cliff flies out with us
    const rare = !!vary.rare;
    const frag = new THREE.Group(); frag.visible = false; scene.add(frag);
    const fragTailU = [{ value: 0 }, { value: 0 }], fragOff = { value: new THREE.Vector3() };
    if (rare) {
      const g0 = new THREE.IcosahedronGeometry(1, 12); g0.deleteAttribute('uv'); g0.deleteAttribute('normal');
      await ctx.yield();
      const g = mergeVertices(g0); g0.dispose();
      await ctx.yield();
      const p = g.attributes.position, col = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const k = 3.1 * (1 + 0.28 * noise.fbm3(x * 1.3 + 9, y * 1.3, z * 1.3, 3) + 0.07 * noise.n3(x * 5, y * 5, z * 5));
        p.setXYZ(i, x * k * 1.25, y * k * 0.85, z * k);
        const c = 0.8 + 0.4 * noise.n3(x * 3, y * 3 + 4, z * 3); col[i * 3] = c; col[i * 3 + 1] = c; col[i * 3 + 2] = c;
        if (i % 400 === 399) await ctx.yield();
      }
      await ctx.yield();
      g.computeVertexNormals();
      await ctx.yield(); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const fu = rockU(0.35, 1.6); fu.uLineQ = { value: 1e7 }; fu.uLocal = { value: 1 }; fu.uFill = { value: 0.5 };
      const rock = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, uniforms: fu }));
      rock.name = 'rock'; rock.frustumCulled = false; frag.add(rock);
      const base = mergeGeometries([new THREE.PlaneGeometry(1, 1, 1, 10), new THREE.PlaneGeometry(1, 1, 1, 10).translate(0, 0, 1)]);
      const vsh = PLUME_VERT.replace('uniform float uS,', 'uniform vec3 uOff; uniform float uS,').replace('vec3 w = iBase', 'vec3 w = uOff + iBase');
      const dirs = [anti, anti.clone().addScaledVector(tailR, 0.22).addScaledVector(tailU, -0.16).normalize()], cols = [G.uIonC, G.uDustC], dims = [[210, 5], [130, 15]];
      for (let k = 0; k < 2; k++) {
        const ig = new THREE.InstancedBufferGeometry(); ig.index = base.index; ig.setAttribute('position', base.attributes.position); ig.setAttribute('uv', base.attributes.uv);
        ig.setAttribute('iBase', new THREE.InstancedBufferAttribute(new Float32Array(3), 3));
        ig.setAttribute('iUp', new THREE.InstancedBufferAttribute(new Float32Array([dirs[k].x, dirs[k].y, dirs[k].z]), 3));
        ig.setAttribute('iPar', new THREE.InstancedBufferAttribute(new Float32Array([dims[k][0], dims[k][1], -1, 0.3 + k * 0.4]), 4)); ig.instanceCount = 1;
        const m = new THREE.Mesh(ig, new THREE.ShaderMaterial({ vertexShader: vsh, fragmentShader: PLUME_FRAG, ...additive,
          uniforms: { ...pick('uS', 'uRc', 'uAway', 'uTime', 'uSunDir'), uLineQ: { value: 1e7 }, uGrain: cols[k], uPlumeI: fragTailU[k], uOff: fragOff } }));
        m.frustumCulled = false; m.renderOrder = 3; frag.add(m); m.matrixAutoUpdate = false;
      }
    }
    const fragStart = new THREE.Vector3(A.cliff.top[0] + 8, A.cliff.top[1] - 6, A.cliff.top[2] + 20);
    const fragPos = new THREE.Vector3(), fragR = new THREE.Vector3();
    const placeFrag = (s, u, time) => {
      const k = S(cliffTime + 0.8, cliffTime + 6.5, s), d = u * L;
      // it pulls ahead on the last kilometre and is through the ring three seconds before us, so the doorway stands open
      const lead = lerp(58, 150, S(L - 1500, L - 1000, d)) + 330 * S(L - 1050, L - 520, d);
      frag.visible = rare && s > cliffTime + 0.6 && d + lead < L - 6;
      if (!frag.visible) return;
      const fin = S(L - 560, L - 60, d + lead);
      path.posAtDist(d + lead, fragPos); path.tangentAtDist(d + lead, tmp);
      fragR.crossVectors(tmp, tmp2.set(0, 1, 0)).normalize();
      fragPos.addScaledVector(fragR, 36 * (1 - fin)).y += -7 * (1 - fin);
      fragPos.lerpVectors(fragStart, fragPos, k);
      const rock = frag.children[0];
      rock.position.copy(fragPos); rock.rotation.set(time * 0.23, time * 0.31, time * 0.17);
      fragOff.value.copy(fragPos);
      const grow = S(cliffTime + 4, cliffTime + 11, s);
      fragTailU[0].value = 1.3 * grow; fragTailU[1].value = 0.5 * grow;
    };
    // ------------------------------------------------------------ (polish) fragments: boulders the jets have thrown off, tumbling down-tail
    // They ride the tail at 72% of our speed, so we overhaul them slowly: at a = A_DEB the big one hangs off the port bow.
    const A_DEB = 1324, DEB_K = 0.72, debris = [];
    const camLeg = (a) => [-legLat(a), legDip(a)];                 // the camera in the leg frame: metres to port, metres up
    {
      const dq = rng.fork('perihelion-fragments');
      const tryAdd = (off, l, h, r) => {
        const aPass = A_DEB + off / (1 - DEB_K), c = camLeg(Math.min(aPass, LEG));
        if (aPass < LEG + 200 && Math.hypot(l - c[0], h - c[1]) < r + 11) return false;      // never across the lens
        debris.push({ st: A_DEB, k: DEB_K, off, l, h, r, ax: new THREE.Vector3(dq.range(-1, 1), dq.range(-1, 1), dq.range(-1, 1)).normalize(), w: dq.range(0.12, 0.5) / Math.sqrt(r) * (dq.chance(0.5) ? 1 : -1) * 2, ph: dq.range(0, 6.283), dl: dq.range(-1.5, 1.5), dh: dq.range(-1.5, 1.5) });
        return true;
      };
      tryAdd(60, 119, 5, 8.5); tryAdd(125, 90, 46, 4.5); tryAdd(250, 205, -22, 13); tryAdd(34, 52, -6, 2.4);
      tryAdd(175, 150, 52, 3.2); tryAdd(330, 40, -48, 6.5); tryAdd(98, 156, -30, 3.4); tryAdd(430, 118, 34, 9.5); tryAdd(560, 20, 60, 7);
      const nChip = Math.round(34 * detail);
      for (let i = 0, tries = 0; i < nChip && tries < 400; tries++) if (tryAdd(dq.range(15, 520), 84 + dq.range(-110, 130), 13 + dq.range(-60, 60), dq.range(0.35, 1.5))) i++;
      // (polish 2) a second flock on the way out to the tail's axis: boulders the jets have thrown this high. They ride down-sun
      // abreast of us while we cross their line, so they whip past 25 to 90 m off and hang against the nucleus when we look back.
      const add2 = (a1, perp, da, r) => debris.push({ st: 0, k: 1, off: da, l: -legLat(a1) + 0.585 * perp, h: legDip(a1) + 0.81 * perp, r,
        ax: new THREE.Vector3(dq.range(-1, 1), dq.range(-1, 1), dq.range(-1, 1)).normalize(), w: dq.range(0.12, 0.5) / Math.sqrt(r) * (dq.chance(0.5) ? 1 : -1) * 2, ph: dq.range(0, 6.283), dl: dq.range(-1.5, 1.5), dh: dq.range(-1.5, 1.5) });
      add2(285, 34, -22, 14); add2(316, -80, -50, 8); add2(262, -55, -40, 7); add2(238, 80, 10, 16); add2(302, -30, -12, 3.5); add2(312, 24, -30, 2.2); add2(222, -98, -60, 9); add2(330, 50, -8, 4);
      const nChip2 = Math.round(16 * detail);
      for (let i = 0; i < nChip2; i++) add2(dq.range(190, 335), (dq.chance(0.5) ? 1 : -1) * dq.range(18, 115), dq.range(-70, 20), dq.range(0.4, 1.7));
    }
    await ctx.yield();
    const debMesh = (() => {
      const g0 = new THREE.IcosahedronGeometry(1, 6); g0.deleteAttribute('uv'); g0.deleteAttribute('normal');
      const g = mergeVertices(g0); g0.dispose();                    // welded, so the normals are smooth: a boulder, not a paper model
      const p = g.attributes.position, col = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const k = 1 + 0.3 * noise.fbm3(x * 1.2 + 31, y * 1.2, z * 1.2 + 5, 3) + 0.06 * noise.n3(x * 5, y * 5 + 2, z * 5);
        x *= k * 1.2; y *= k * 0.8; z *= k;
        const f1 = x * 0.62 + y * 0.5 + z * 0.6; if (f1 > 0.7) { const o = f1 - 0.7; x -= 0.62 * o; y -= 0.5 * o; z -= 0.6 * o; }      // two chiselled flats: a broken face
        const f2 = -x * 0.8 + y * 0.3 - z * 0.52; if (f2 > 0.62) { const o = f2 - 0.62; x += 0.8 * o; y -= 0.3 * o; z += 0.52 * o; }
        p.setXYZ(i, x, y, z);
        const c = 0.9 + 0.5 * noise.n3(x * 2.2, y * 2.2 + 4, z * 2.2); col[i * 3] = c; col[i * 3 + 1] = c; col[i * 3 + 2] = c;
      }
      g.computeVertexNormals(); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const du = rockU(0.8, 2.0); du.uLineQ = { value: 1e7 }; du.uLocal = { value: 9 }; du.uFill = { value: 0.55 }; du.uIce = { value: 0.1 };
      const m = new THREE.InstancedMesh(g, new THREE.ShaderMaterial({ vertexShader: ROCK_VERT, fragmentShader: ROCK_FRAG, uniforms: du }), debris.length);
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; scene.add(m);
      return m;
    })();
    const debM = new THREE.Matrix4(), debQ = new THREE.Quaternion(), debP = new THREE.Vector3(), debS = new THREE.Vector3();
    const placeDebris = (aCam, time) => {
      const show = S(-150, 150, aCam);
      for (let i = 0; i < debris.length; i++) {
        const b = debris[i], a = b.st + b.off + (aCam - b.st) * b.k;
        legPt(a, b.l + b.dl * Math.sin(time * 0.21 + b.ph), b.h + b.dh * Math.sin(time * 0.17 + b.ph * 2), debP);
        debQ.setFromAxisAngle(b.ax, b.ph + time * b.w);
        debM.compose(debP, debQ, debS.setScalar(b.r * show + 1e-4));
        debMesh.setMatrixAt(i, debM);
      }
      debMesh.instanceMatrix.needsUpdate = true;
    };
    await ctx.yield();

    // ------------------------------------------------------------ gaze
    const gazeFar = potato ? [-60, 180, -800] : [640, 760, -1700];
    // The climb: the gaze leads the left turn, sweeping round the inside of it and down, and settles beyond the
    // geyser field (a fixed target would sit behind us when the climb begins and whip the camera through the nadir),
    // so the field lies below, the line of light crosses the night plain behind it and the tails stand over the horizon.
    // Rolling out onto the tail leg it moves on to the night side dropping away under us. Keyed to distance flown.
    const gzP = new THREE.Vector3(), gzT = new THREE.Vector3(), gzV = new THREE.Vector3();
    const DOWN = new THREE.Vector3(-170, -20, -230), FIELD = new THREE.Vector3(-10, -10, 60), NIGHT = new THREE.Vector3(-170, -20, 350);   // NIGHT: the near half of the terrace, clear of the fountains, where the line is crossing as we roll out
    // (polish 2) rolling out of the turn the gaze swings back up-sun: the fountains stand between us and the sun, every one backlit
    const gzS = new THREE.Vector3();
    const sunBack = (u) => path.pointAt(u, gzS).addScaledVector(anti, -600).addScaledVector(tailU, -265).addScaledVector(tailR, -255);
    const gazeClimb = (time, u) => {
      const d = u * L, k = S(815, 1020, d);
      path.pointAt(u, gzP); path.tangentAt(u, gzT);
      const yaw = Math.atan2(-gzT.x, -gzT.z) + 2.3 * k, dep = lerp(0.1, 0.4, k);
      gzV.set(-Math.sin(yaw) * Math.cos(dep), -Math.sin(dep), -Math.cos(yaw) * Math.cos(dep)).multiplyScalar(650).add(gzP);
      // (polish) half way up the gaze drops for a moment onto the crown below us, so one still looks straight down on the
      // lit rock, its craters and ledges and the fountains coming up at the lens
      return gzV.lerp(FIELD, S(970, 1118, d)).lerp(DOWN, plateau(d, 1060, 1160, 1270, 1420)).lerp(NIGHT, 0.6 * S(1500, 1800, d)).lerp(sunBack(u), S(1720, 1930, d));
    };
    // The tail leg, three pictures: hard to port along the near ion ray; down to starboard over the striae and our
    // own kite shadow; then the ring, dead ahead, in its braid.
    const gzL = new THREE.Vector3(), gzF = new THREE.Vector3(), aBeat = (a) => (a < 0 ? (dLeg + a) / L : uOfA(a));
    // (polish 2) the gaze on the way out to the tail's axis: first the down-sun end of the body, where the line of light is still
    // crossing the night plain; then up the length of it to the sunward end and its tall jets; then, from the axis, the whole
    // nucleus hanging below us; and forward again through the fragments until the ring takes it.
    const T_NIGHT = new THREE.Vector3(-170, -20, 350), T_TERM = new THREE.Vector3(-40, -120, 820), T_SUNEND = new THREE.Vector3(-60, -160, potato ? -800 : -700), T_BODY = new THREE.Vector3(60, -500, potato ? -360 : -220);
    const gzM = new THREE.Vector3();
    const gazeLeg = (time, u) => {
      const a = aLeg(u);
      path.pointAt(u, gzF);
      gzF.addScaledVector(anti, 600).addScaledVector(tailR, -110).addScaledVector(tailU, -20);
      return gzL.copy(sunBack(u)).lerp(T_SUNEND, S(190, 320, a)).lerp(T_BODY, S(400, 720, a)).lerp(gzF, S(900, 1200, a));
    };
    const ringP = legO.clone().addScaledVector(anti, LEG - 60);
    const pois = [
      { at: gazeFar, from: 0.0, to: uOfS(Math.min(7, arriveTime - 1.5)), weight: 0.4 },
      { at: A.cliff.poi, from: uOfS(cliffTime - 1.6), to: uOfS(cliffTime + 2.4), weight: 0.5 },
      { at: potato ? [-60, -120, -800] : [-120, 40, -1150], from: 560 / L, to: 1010 / L, weight: 0.6, fade: 0.3 },   // blown upward: the pit (or the neck) and its jets against the sun
      { at: gazeClimb, from: 805 / L, to: aBeat(120), weight: 0.85, fade: 0.1 },
      { at: gazeLeg, from: aBeat(-40), to: aBeat(1400), weight: 0.9, fade: 0.06 },
      { at: ringP, from: aBeat(1380), to: aBeat(2010), weight: 0.6, fade: 0.3 },
    ];

    // ------------------------------------------------------------ per-frame
    const camPos = new THREE.Vector3(), camQ = new THREE.Quaternion(), camS = new THREE.Vector3(), qi = new THREE.Quaternion();
    const sunDir = new THREE.Vector3(), tan = new THREE.Vector3(), grainV = new THREE.Vector3(), size = new THREE.Vector2();
    const SADDLE = (potato ? 2.2 : 4.2) * DEG, corona0 = G.uCorona.value;
    const crown0 = sunKind === 'grazer' ? 1.35 : sunKind === 'small' ? 0.7 : 1.0;
    const update = (dt, time, camera, u) => {
      const s = sOfU(u || 0), x = s - arriveTime, aNow = aLeg(u || 0);
      hero.setScriptTime(s);
      hero.update(dt, time, camera);
      camera.getWorldPosition(camPos); camera.matrixWorld.decompose(camPos, camQ, camS);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); G.uRes.value.copy(size); }
      G.uTime.value = time; G.uS.value = s;
      const day = S(-0.3, 0.5, x);
      rig.visible = !ctx.through;                                   // carried with the camera: the portal's near plane would slice it
      lobes.material.uniforms.uRim.value = lerp(1.2, 0.4, day); lobes.material.uniforms.uThread.value = 2.6 * (1 - S(-1.5, 2.5, x));
      plumeI.value = 0.3 * vigor * lerp(1.9, 1, day) * (1 + 1.7 * S(11, 14, s) * (1 - S(17, 20.5, s)));   // (polish) blown up off the cliff we look into the sun: the jets beyond stand backlit off the limb               // before dawn the far jets are the only things standing in the sun
      foilU.uGround.value = day * (1 - S(20, 27, s)); foilU.uScroll.value = ((u || 0) * L * 0.035) % 512;
      foilU.uFoilTail.value = lerp(0.55, 0.8, day) + 0.5 * S(24, 29, s); rigU.uIonRim.value = S(24, 29.5, s);
      G.uShT.value = time;
      G.uDay.value = day; G.uNightK.value = lerp(1, 0.4, day); G.uCorona.value = corona0 * lerp(1.5, 0.3, day); G.uCrown.value = crown0 * lerp(1.0, 0.01, day);
      HU.uSunI.value = sunI0 * (1 + 1.3 * Math.exp(-Math.max(x, 0) / 0.7) * S(-0.3, 0.2, x));      // the sunrise burns, then settles
      // the sun as seen from here; its upper limb clears the saddle as the line reaches us
      hero.sunDirAt(camPos, sunDir);
      const te = sunDir.y / Math.max(Math.hypot(sunDir.x, sunDir.z), 1e-4);
      // it comes up fast: hidden under the saddle until the line is on us, the whole disc clear of it 1.6 s later
      const el = Math.atan(te) + lerp(SADDLE - sunR, SADDLE + sunR + 0.6 * DEG, S(-0.4, 1.6, x)) * (1 - S(0.04, 0.24, te));
      G.uSunDir.value.set(-away2.x * Math.cos(el), Math.sin(el), -away2.y * Math.cos(el));
      // the rig rides the camera that draws us
      rig.matrix.copy(camera.matrixWorld); rig.matrixWorldNeedsUpdate = true;
      qi.copy(camQ).invert(); rigU.uSunRig.value.copy(G.uSunDir.value).applyQuaternion(qi);
      const wr = x < 0 ? 1 : 1 - 0.95 * (1 - Math.exp(-6 * x) * Math.cos(8 * x));
      foilU.uWr.value = wr; rigU.uSlack.value = clamp(wr, 0, 1);
      rigU.uFlex.value = lerp(0.32, -0.3, clamp(wr, -0.2, 1)) + 0.035 * Math.sin(time * 2.1) + 0.5 * Math.exp(-Math.max(x, 0) * 2.2) * S(-0.05, 0.15, x);
      rigU.uSway.value = 0.5 * S(17, 20, s) * (1 - S(25.5, 29, s)) + 0.05 * Math.sin(time * 0.8) * (0.4 + 0.6 * wr);
      foilU.uSpin.value = time * 0.22; foilU.uHi.value = s * 0.5 + time * 0.06;
      // the tails unfurl once we are thrown clear
      ionG.value = ionBase * (0.24 + 0.26 * S(19, 27, s));
      dustG.value = dustBase * S(arriveTime + 2, arriveTime + 8, s) * (0.45 + 0.55 * S(18, 26, s)) * (1 - 0.45 * S(1150, 1650, aNow));
      moteG.value = 0.35 * dustBase * S(arriveTime + 3, arriveTime + 9, s);
      G.uShOn.value = S(25, 28.5, s); G.uSailP.value.copy(camPos);
      // grains: fountain spray in the avenue, tail grains whipping past on the last leg
      path.tangentAt(u || 0, tan);
      const tail = s > 22.5;
      if (tail) grainV.copy(anti).multiplyScalar(70); else grainV.set(away2.x * 14, 38, away2.y * 14);
      grainU.uAmt.value = tail ? (0.2 + 0.12 * S(1000, 1500, aNow)) * S(24.5, 28.5, s) : 0.22 * S(0.4, 2.2, x) * (1 - S(17.5, 21, s));
      grainU.uDrift.value.copy(grainV).multiplyScalar(time % 600);
      grainU.uRel.value.copy(grainV).addScaledVector(tan, -speedAt((u || 0) * L));
      grainU.uCam.value.copy(camPos);
      // beacon: one blink every two seconds, eased
      const ph = (time * 0.5) % 1, pulse = S(0, 0.05, ph) * (1 - S(0.05, 0.2, ph));
      beaconMat.uniforms.uPulse.value = 0.3 + pulse; beaconU.w = 0.4 + 2.4 * pulse; spill.material.color.setScalar(0.3 + pulse);
      placeFrag(s, u || 0, time);
      placeDebris(aNow, time);
      // the coma's halo stands round the body wherever we are
      const nd = domeMat.uniforms.uNucDir.value.copy(nucC).sub(camPos), nDist = Math.max(nd.length(), 1); nd.multiplyScalar(1 / nDist);
      domeMat.uniforms.uNucR.value = Math.atan(NUC_R / nDist);
      domeMat.uniforms.uComaG.value = (tailKind === 'coma' ? 0.13 : 0.105) * (1 + 0.7 * S(19, 27, s));
      domeMat.uniforms.uTailSky.value = 0.28 * (1 - 0.88 * S(1000, 1500, aNow));   // the painted fan stands back for the real horn
      whirlG.value = ionBase * 1.1 * S(200, 1200, aNow);
      hornG.value = ionBase * 0.09 * S(-300, 500, aNow);
      vorG.value = ionBase * 0.34 * S(-300, 500, aNow) * (1 + 0.08 * Math.sin(time * 0.9));
    };
    update(0, 0, { getWorldPosition: (v) => v.set(0, 14, 325), matrixWorld: new THREE.Matrix4().makeTranslation(0, 14, 325) }, 0);

    return {
      scene, path, duration: DUR, pace,
      ride: 'none',
      camera: { fov: 72, near: 0.5, far: 12000, lookAhead: 50, sway: 0.25, bank: 7 },
      pois,
      portal: { shape: 'circle', radius: 9, tilt: true, color: '#BFE4FF', glow: 1, revealDistance: 2300 },
      post: {
        exposure: sunKind === 'grazer' ? 0.92 : 1.0,
        bloom: { strength: 0.32, radius: 0.55, threshold: 1.0 },
        grade: { saturation: 1.04, contrast: 1.06, tint: '#ffffff', shadowTint: '#000000', vignette: 0.3, grain: 0.02, aberration: 0 },
      },
      update,
      dispose() { hero.dispose(); },
    };
  },
};
