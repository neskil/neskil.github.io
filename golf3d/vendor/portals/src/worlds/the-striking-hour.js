// THE STRIKING HOUR
// At mouse scale inside a great tower clock, lit by its four opal-glass dials. For 26 seconds the
// world advances one tick at a time; then the strike train lets go, the fly spins up into a drum of
// blur and the camera is thrown round it and up the hammer wire into the mouth of the bell.
//
// Layout (metres, X east, Y up, Z south): room 140 x 140 x 150, dials on the four walls centred at
// y 75; the flatbed (hero, src/parts/the-striking-hour.js) in the middle with the strike train in
// its centre bay, the going train in the north bay (z -20..-6), the chime train in the south bay
// (z 8..20); pendulum off the north side; leading-off rods to a bevel cluster at (0, 75, -8);
// belfry above y 150 through a 30 m hatch.
//
// Looks by seed (ctx.vary.hour honoured): MORNING clear and cold, sun bloom behind the east dial and
// a hard sun shaft from the open pane | OVERCAST four equal white dials, snowflake shadows sifting
// down the glass, snow blowing in at the pane | LATE one rose bloom low on the west dial, the other
// three blue | NIGHT blue-silver dials, the moon's disc behind the south glass, stars in the pane.
// HOUR 3 to 12: the hour hand's shadow and how many blows follow. LIVERY green, slate or black
// (hero). CAST pigeons | jackdaws throughout | a single barn owl that glides the room at the warning.
// RARE (ctx.vary.rare): the chime train lets go too: its wheels roll, a rank of eight red-nosed
// levers ripples like piano hammers and the four quarter bells swing their hammers in turn.
//
// The world builds its own vehicle (the oiler's cradle, placed at the camera every frame) and
// returns ride 'none'. Its style is in the grade and the motion, so style 'none'.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, M, along, cbox, lathe, rodProfile, gearPlate, Batch } from '../parts/the-striking-hour.js';

const TAU = Math.PI * 2, RX = Math.PI / 2;
const ss = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const frac = (x) => x - Math.floor(x);
// one tick: 0 -> 1 over 0.3 s with a 5 percent overshoot and return (the recoil)
const tick = (f) => (f < 0.3 ? ss(f / 0.3) * 1.05 : 1 + 0.05 * Math.exp(-(f - 0.3) * 13) * Math.cos((f - 0.3) * 21));
const beat = (t) => Math.floor(t) + tick(frac(t));
// the kick felt by anything hanging: 0 at rest, a bump at the lurch, then a damped swing
const kick = (f) => (f < 0.3 ? Math.sin(Math.PI * f / 0.3) : -0.55 * Math.exp(-(f - 0.3) * 6) * Math.sin((f - 0.3) * 15));

const GLSL_HASH = /* glsl */`
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float h31(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }`;

// ---- a dial seen from inside: opal glow, frame and hand shadows, bird shadows, sun or moon behind ----
const DIAL_VS = /* glsl */`varying vec2 vQ; void main(){ vQ = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const DIAL_FS = /* glsl */`
uniform vec3 uCol; uniform vec3 uShade; uniform vec3 uSunCol; uniform vec2 uHands; uniform float uTime;
uniform float uNear; uniform float uFig; uniform vec4 uSun; uniform vec4 uMoon; uniform vec4 uPane; uniform vec3 uBirds[4]; uniform float uSnow;
uniform vec2 uBirdF[4]; uniform float uDaw; uniform vec4 uWalk[2];
varying vec2 vQ;
${GLSL_HASH}
// a bird standing outside on the iron frame, as its shadow in the opal: body, head, beak, tail and two legs. p is in the bird's own
// space (x the way it faces, y up, the body two units long); the result is a distance in those units, negative inside.
float cap(vec2 p, vec2 a, vec2 b, float r){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)) - r; }
float birdD(vec2 p, float bob, float daw){
  vec2 b = vec2(0.94 * p.x + 0.34 * p.y, -0.34 * p.x + 0.94 * p.y);                 // the body leans breast-up
  float body = (length(b / vec2(1.0, mix(0.62, 0.5, daw))) - 1.0) * 0.55;
  vec2 hd = vec2(0.76 + 0.12 * bob, mix(0.9, 0.82, daw));
  float head = length(p - hd) - mix(0.3, 0.27, daw);
  float neck = cap(p, vec2(0.42, 0.3), hd, mix(0.25, 0.2, daw));
  float beak = cap(p, hd + vec2(0.26, -0.02), hd + vec2(mix(0.5, 0.64, daw), -0.09), 0.06);
  float tail = cap(p, vec2(-0.75, -0.2), vec2(mix(-1.75, -2.0, daw), -0.62), mix(0.2, 0.16, daw));
  float legs = max(min(abs(p.x + 0.12 - 0.1 * bob), abs(p.x - 0.22 + 0.1 * bob)) - 0.05, abs(p.y + 0.8) - 0.26);
  return min(min(min(body, head), min(beak, tail)), min(legs, neck)); }
float handSeg(vec2 q, float ang, float len, float w, float blur){
  vec2 d = vec2(sin(ang), cos(ang)); float t = clamp(dot(q, d), -len * 0.2, len);
  float dist = length(q - d * t); float ww = w * (1.0 - 0.45 * clamp(t / len, 0.0, 1.0));
  return 1.0 - smoothstep(ww - blur, ww + blur, dist); }
void main(){
  vec2 q = vQ; float r = length(q);
  float px = length(fwidth(q));
  if (uPane.w > 0.5 && abs(q.x - uPane.x) < uPane.z && abs(q.y - uPane.y) < uPane.z) discard;
  float blur = 0.45 + px;
  float m = max(handSeg(q, uHands.x, 52.0, 2.2, blur), handSeg(q, uHands.y, 36.0, 3.2, blur));
  m = max(m, 1.0 - smoothstep(3.6 - blur, 3.6 + blur, r));
  float rings = (1.0 - smoothstep(0.6, 0.6 + blur, abs(r - 51.0))) + (1.0 - smoothstep(0.5, 0.5 + blur, abs(r - 38.0)));
  float ang = atan(q.x, q.y + 1e-5);
  float cell = abs(fract(ang * 12.0 / 6.2831853 + 0.5) - 0.5) * 6.2831853 / 12.0 * max(r, 1.0);
  float spokes = (1.0 - smoothstep(0.35, 0.35 + blur, cell)) * step(6.0, r);
  // each dial has its own figure. uFig: 0 east (the sun and the open pane), 1 west (a third, inner ring), 2 south (the quarter
  // batons twice as long), 3 north (the motion work behind the hub throws its shadow on the glass)
  float fW = step(0.5, uFig) * step(uFig, 1.5), fS = step(1.5, uFig) * step(uFig, 2.5), fN = step(2.5, uFig);
  float cellQ = abs(fract(ang * 4.0 / 6.2831853 + 0.5) - 0.5) * 6.2831853 / 4.0 * max(r, 1.0);
  float batons = (1.0 - smoothstep(1.5, 1.5 + blur, cell)) * smoothstep(40.7, 41.3, r) * (1.0 - smoothstep(49.7, 50.3, r));
  batons = max(batons, fS * (1.0 - smoothstep(1.7, 1.7 + blur, cellQ)) * smoothstep(31.7, 32.3, r) * (1.0 - smoothstep(49.7, 50.3, r)));
  float cell60 = abs(fract(ang * 60.0 / 6.2831853 + 0.5) - 0.5) * 6.2831853 / 60.0 * max(r, 1.0);
  float ticks = (1.0 - smoothstep(0.14, 0.14 + blur, cell60)) * smoothstep(46.2, 46.8, r) * (1.0 - smoothstep(49.3, 49.9, r)) * clamp(0.5 / px, 0.0, 1.0);
  rings += fW * (1.0 - smoothstep(0.45, 0.45 + blur, abs(r - 24.0)));
  float frame = clamp(rings + spokes, 0.0, 1.0);
  // daylight in the opal: brighter toward the top, and slow cloud passing behind it
  float cloud = vn2(q * 0.02 + vec2(uTime * 0.01, 3.0)) * 0.65 + vn2(q * 0.055 + vec2(uTime * 0.017, 9.0)) * 0.35;
  vec3 col = uCol * (1.0 + 0.10 * q.y / 55.0) * (0.9 + 0.1 * cloud) * (0.97 + 0.06 * vn2(q * 1.7 + 9.0)) * (1.0 - 0.6 * r * r / 3025.0);
  float gearSh = 0.0;
  if (fN > 0.5) {                                       // two wheels of the motion work, stepping with the hands
    vec2 g1 = q - vec2(-5.0, -4.0), g2 = q - vec2(7.3, 4.6); float rot = uHands.x * 40.0;
    float d1 = length(g1), d2 = length(g2);
    float e1 = 9.0 + 0.55 * sin(24.0 * (atan(g1.y, g1.x + 1e-5) + rot)), e2 = 6.0 + 0.55 * sin(16.0 * (atan(g2.y, g2.x + 1e-5) - rot * 1.5 + 0.2));
    float w1 = (1.0 - smoothstep(e1 - 0.7, e1 + 0.7, d1)) * (0.45 + 0.55 * smoothstep(5.2, 7.2, d1) + 0.55 * (1.0 - smoothstep(1.6, 2.6, d1)));
    float w2 = (1.0 - smoothstep(e2 - 0.7, e2 + 0.7, d2)) * (0.45 + 0.55 * smoothstep(3.0, 4.6, d2) + 0.55 * (1.0 - smoothstep(1.0, 1.8, d2)));
    gearSh = clamp(max(w1, w2), 0.0, 1.0);
  }
  // uNear: 0 with the eye at the glass, 1 from across the room. From afar the opal goes over the bloom threshold and the dial is a
  // moon; close up it stays a luminous white with form and does not flood the picture.
  col *= mix(1.0, 1.15, uNear);
  { vec2 pg = q / 2.75 + 0.5; vec2 pid = floor(pg), pf = fract(pg); float ppx = px / 2.75;
    float edge = min(min(pf.x, 1.0 - pf.x), min(pf.y, 1.0 - pf.y));
    float came = (1.0 - smoothstep(0.012, 0.05 + ppx, edge)) * clamp(0.045 / ppx, 0.0, 1.0);   // a bar thinner than the eye can part goes into the milk          // the glazing bar outside: a dark soft line in the opal
    float seen = clamp(0.05 / ppx - 0.4, 0.0, 1.0);                  // the lattice dissolves before it can alias
    // milk glass is cast, not rolled: slow swirls in it and a finer tooth; every pane was poured on its own day, and a few have
    // been replaced since: newer ones a bluer, brighter white, the oldest gone a little green and grey
    float hp = h21(pid), hq = h21(pid + 17.3);
    vec3 tone = vec3(0.94 + 0.12 * hp) * mix(vec3(1.0), vec3(0.97, 1.02, 1.09), step(0.91, hq)) * mix(vec3(1.0), vec3(0.8, 0.9, 0.86), step(hq, 0.07));
    tone *= 0.93 + 0.14 * (0.6 * vn2(q * 0.33 + 4.0) + 0.4 * vn2(q * 0.9 + 13.0));
    // dust lies along the bottom bar of every pane and in its corners, and old runs of dirt and rain stand down the glass
    float dust = (1.0 - smoothstep(0.0, 0.45, pf.y)) * (0.5 + 0.5 * vn2(q * 0.8 + 3.0))
      + 0.7 * (1.0 - smoothstep(0.0, 0.26, min(pf.x, 1.0 - pf.x))) * (1.0 - smoothstep(0.0, 0.32, min(pf.y, 1.0 - pf.y)));
    float run = vn2(vec2(q.x * 2.3 + 11.0, q.y * 0.09)) * 0.65 + vn2(vec2(q.x * 5.1, q.y * 0.21 + 5.0)) * 0.35;
    float streak = smoothstep(0.55, 0.8, run) * smoothstep(0.3, 0.7, vn2(q * vec2(0.09, 0.035) + 21.0)) * clamp(0.1 / px, 0.0, 1.0);
    col *= mix(vec3(1.0), tone * (1.0 - 0.24 * came) * (1.0 - 0.17 * clamp(dust, 0.0, 1.0)), seen) * (1.0 - 0.2 * streak); }
  // the sun behind the glass: a broad lift that stays under the bloom threshold, and a small hot core that goes over it. (The
  // bloom passes whole pixels, so a broad area above the threshold floods the frame when the cradle rides close to the dial.)
  vec2 ds = q - uSun.xy; float sd = dot(ds, ds) / (2.0 * uSun.z * uSun.z);
  col += uSunCol * uSun.w * mix(0.4, 1.0, uNear) * (0.5 * exp(-sd) + 2.2 * exp(-sd * 20.0));
  float md = length(q - uMoon.xy);
  col += uSunCol * uMoon.w * ((1.0 - smoothstep(uMoon.z - 1.2, uMoon.z + 1.2, md)) * (0.8 + 0.2 * vn2(q * 0.5)) + 0.3 * exp(-md * md / 300.0));
  float bs = 0.0;
  for (int i = 0; i < 4; i++) {
    // it stands on the frame's ring whichever side of the dial it is on: above the bar over the top, inside it round the bottom
    vec2 c = uBirds[i].xy; float lc = max(length(c), 1.0); c -= (c / lc) * 1.4 * (1.0 - c.y / lc);
    float sz = max(uBirds[i].z, 0.01) * mix(0.95, 0.72, uDaw);
    vec2 p = (q - c) / sz; p.x /= uBirdF[i].x;
    float soft = 0.09 + px / sz;                                    // the opal diffuses it: a soft shape, never a cut-out
    bs = max(bs, (1.0 - smoothstep(-soft, soft, birdD(p, uBirdF[i].y, uDaw))) * smoothstep(0.0, 0.6, uBirds[i].z)); }
  // two more keep to the level spokes, the only bars of the frame a bird can walk along: one each side of the hub, pacing out and back
  for (int i = 0; i < 2; i++) { float sz = 2.5 * mix(0.95, 0.72, uDaw);
    vec2 p = (q - vec2(uWalk[i].x, 0.3 + 1.04 * sz)) / sz; p.x /= uWalk[i].y;
    float soft = 0.09 + px / sz;
    bs = max(bs, (1.0 - smoothstep(-soft, soft, birdD(p, uWalk[i].z, uDaw))) * uWalk[i].w); }
  float sn = 0.0;
  if (uSnow > 0.001) {
    for (int k = 0; k < 3; k++) { float fk = float(k); float sc = 0.34 + 0.2 * fk;
      vec2 g = q * sc + vec2(sin(q.y * 0.11 + uTime * (0.5 + 0.2 * fk) + fk * 2.1) * (0.55 + 0.2 * fk) + uTime * 0.12 * (fk - 1.0), uTime * (2.3 + 0.9 * fk) + fk * 7.3);
      vec2 id = floor(g), f = fract(g) - 0.5; f.y *= 0.4; float hh = h21(id + fk * 19.0); float h2 = h21(id + 11.3 + fk);
      vec2 off = vec2(h21(id + 3.1) * 0.6 - 0.3, 0.0);
      float rad = 0.03 + 0.045 * h2; float soft = rad * (1.4 + 2.2 * fract(hh * 7.0));
      sn = max(sn, step(0.72 - 0.1 * min(uSnow - 1.0, 1.0), hh) * (0.55 + 0.45 * h2) * (1.0 - smoothstep(rad, rad + soft, length(f - off)))); }
    sn *= 0.25 + 0.75 * uNear;   // the flakes' shadows dissolve when the eye is at the glass
  }
  float sh = (1.0 - 0.88 * frame) * (1.0 - 0.9 * batons) * (1.0 - 0.6 * ticks) * (1.0 - 0.42 * gearSh) * (1.0 - 0.94 * m) * (1.0 - 0.9 * bs) * (1.0 - min(0.2, 0.1 * uSnow * sn));
  gl_FragColor = vec4(mix(uShade, col, sh), 1.0);
}`;

// ---- belfry louvres: stone slats with flat cold bars of daylight between them ----
const LOUVRE_FS = /* glsl */`
uniform vec3 uSky; uniform vec3 uStone; uniform float uTime; varying vec2 vQ;
${GLSL_HASH}
void main(){
  float px = length(fwidth(vQ));
  float bay = abs(fract(vQ.x / 22.0) - 0.5) * 22.0;               // stone mullions between openings
  float open = smoothstep(1.6, 1.6 + px + 0.1, bay) * smoothstep(0.0, 0.6, vQ.y) * (1.0 - smoothstep(49.2, 49.8, vQ.y));
  // each slat is a stone blade: dark underneath, a lit top edge; the sky shows in the gap above it, brightest low in the gap
  float t = fract(vQ.y / 2.6), e = px / 2.6 + 0.012;
  float slat = smoothstep(0.30 - e, 0.30 + e, t) * (1.0 - smoothstep(0.66 - e, 0.66 + e, t));
  float gc = fract(t - 0.66) / 0.64;
  float glow = smoothstep(0.0, 0.3, gc) * (1.0 - 0.6 * smoothstep(0.35, 1.0, gc));
  float topLit = smoothstep(0.55, 0.66, t) * slat;
  float haze = 0.8 + 0.2 * vn2(vQ * 0.05 + vec2(uTime * 0.02, 0.0));
  float vy = clamp(vQ.y / 50.0, 0.0, 1.0);
  vec3 slatC = uStone * mix(0.3, 1.0, smoothstep(0.30, 0.6, t)) * (0.85 + 0.3 * vn2(vec2(vQ.x * 0.7, floor(vQ.y / 2.6) * 7.0))) + uSky * (0.08 + 0.5 * topLit);
  vec3 mull = uStone * (0.75 + 0.25 * vn2(vQ * 0.6)) + uSky * 0.2;
  vec3 sky = uSky * haze * (0.7 + 0.3 * vy) * glow;
  vec3 col = mix(mull, mix(sky, slatC, slat), open);
  gl_FragColor = vec4(col, 1.0);
}`;

// ---- the sun shaft: one additive prism with drifting dust in it ----
const SHAFT_VS = /* glsl */`varying vec3 vL; varying vec3 vN; varying vec3 vV;
void main(){ vL = position; vec4 wp = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = cameraPosition - wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp; }`;
const SHAFT_FS = /* glsl */`
uniform vec3 uCol; uniform vec3 uAxis; uniform float uTime; uniform float uLen; uniform float uEnd; uniform float uSoft; varying vec3 vL; varying vec3 vN; varying vec3 vV;
${GLSL_HASH}
void main(){
  float a = abs(dot(normalize(vN + vec3(1e-5)), normalize(vV + vec3(1e-5))));
  float t = clamp(vL.z / uLen, 0.0, 1.0);
  float n = vn3(vL * 0.22 + vec3(uTime * 0.05, -uTime * 0.11, uTime * 0.16));
  float motes = vn3(vL * 1.9 + vec3(-uTime * 0.21, -uTime * 0.33, uTime * 0.4)); motes = motes * motes; motes = motes * motes * motes;
  float I = ((uSoft > 0.0 ? 0.45 + 0.75 * n : 0.3 + 0.95 * n) + (uSoft > 0.0 ? 0.5 : 1.6) * motes) * mix(1.0, uEnd, t) * smoothstep(0.0, 0.5, a) * smoothstep(0.0, 0.015, t);
  if (uSoft > 0.0) I *= (1.0 - smoothstep(0.35, 1.0, min(abs(vL.x), abs(vL.y)) / uSoft)) * (1.0 - t) * smoothstep(10.0, 46.0, length(vV)) * (gl_FrontFacing ? 1.0 : 0.3)
    * (0.82 + 0.18 * sin(vL.z * 1.15 + 0.4 * vL.x));   // from inside the column its walls fade out
  else { float ax = abs(dot(normalize(vV + vec3(1e-5)), uAxis)); ax *= ax; I *= smoothstep(5.0, 26.0, length(vV)) * (1.0 - 0.85 * ax * ax)
      * (1.0 - 0.8 * smoothstep(0.4, 1.0, min(abs(vL.x), abs(vL.y)) / 2.9)); }   // nor does the sun shaft fog the lens when the cradle rides up it, or flood the frame seen end-on
  gl_FragColor = vec4(uCol * I, 1.0);
}`;

// ---- the sky in the open pane ----
// The opening is a hole in the dial, so what shows in it is painted by the direction of sight, not by the place on the quad: the
// sky stands still at infinity as the cradle passes, and the casement's bars slide across it. Blue above a pale horizon, one layer
// of cloud in perspective, the sun where the shaft comes from, falling snow or stars by the look. It is the open air seen past a
// lit milk glass: the opal gathers the light of the whole sky and glows with it, so the patch of sky in the opening is always a
// clear step darker than the glass beside it, and bluer (its colours are set under the glass's own, where the pane is made). Low
// in it stands the far town, by direction like the rest: a line of roofs at the level of the eye, and behind them, paler in the
// haze, a far ridge with a church tower or a spire here and there. (The opening is 51 to 57 m up the wall and the movement's
// crowns reach 42 m: from down on the machine the sight through it rises four degrees or more and finds only sky and, at most,
// the top of a spire; the town shows low in the opening to an eye that has come up level with it.)
const PANE_VS = /* glsl */`varying vec3 vW; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const PANE_FS = /* glsl */`
uniform vec3 uTop; uniform vec3 uBot; uniform float uStars; uniform float uTime; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSnow;
uniform vec3 uCloud; uniform vec3 uCloudSh; uniform vec2 uCover; uniform vec3 uLand; uniform float uTownAz; uniform float uGlare; varying vec3 vW;
${GLSL_HASH}
float fbm(vec2 p){ return vn2(p) * 0.5 + vn2(p * 2.03 + 7.1) * 0.27 + vn2(p * 4.1 + 3.3) * 0.15 + vn2(p * 8.3 + 1.7) * 0.08; }
// the far town's outline against the sky, as the height of sight it reaches at each bearing: 360 houses round the horizon, each
// with its own pitch of roof, some with a chimney stack (x: the outline, y: the house's own tone); and behind them a far ridge,
// with a tower (square-topped) or a spire in some of its 26 bays
vec2 townNear(float az){ float x = az * 57.2958, i = mod(floor(x), 360.0), f = fract(x);
  float h = h21(vec2(i, 3.0)), g = h21(vec2(i, 11.0));
  float roof = 1.0 - (0.15 + 0.5 * g) * abs(2.0 * f - 1.0);
  float stack = step(0.6, g) * (1.0 - step(0.08, abs(f - 0.2 - 0.6 * h)));
  return vec2(0.006 + 0.034 * (0.35 + 0.65 * h) * roof + 0.009 * stack, 0.78 + 0.5 * h21(vec2(i, 23.0))); }
float townFar(float az){ float x = az * 4.13803, i = mod(floor(x), 26.0), f = fract(x);
  float h = h21(vec2(i, 5.0)), g = h21(vec2(i, 17.0)), k = h21(vec2(i, 29.0));
  float d = abs(f - 0.3 - 0.4 * g) / 4.13803, w = 0.006 + 0.005 * k;                 // radians from the tower's own axis, and its half-width
  float top = k < 0.55 ? (0.06 + 0.03 * h) + (0.035 + 0.03 * g) * max(0.0, 1.0 - d / (0.8 * w)) : (0.07 + 0.04 * h) + 0.008 * step(0.6 * w, d);
  return max(0.022 + 0.035 * vn2(vec2(az * 7.0, 2.0)), step(0.35, h21(vec2(i, 41.0))) * (1.0 - step(w, d)) * top); }
void main(){
  vec3 d = normalize(vW - cameraPosition);
  float el = d.y, az = atan(d.z, d.x + 1e-5);
  vec3 col = mix(uBot, uTop, smoothstep(-0.3, 0.45, el));        // a winter sky is blue from low over the roofs: it pales only in the last degrees above the horizon
  col *= min(1.0, 0.76 / max(max(col.r, col.g), max(col.b, 1e-3)));                    // the blue stays well under the white of the glass round it, or it is no colour at all
  // cloud: a layer far overhead, so it crowds together toward the horizon and drifts slowly north
  vec2 cp = vec2(d.z, d.x) / max(el + 0.16, 0.08) * 5.0 + vec2(-uTime * 0.02, uTime * 0.006);
  float n = fbm(cp), n2 = fbm(cp + 0.22 * normalize(uSunDir.zx + vec2(1e-4)));
  float cov = smoothstep(uCover.x, uCover.y, n) * smoothstep(-0.05, 0.12, el);
  float lit = clamp(0.5 + 3.0 * (n - n2), 0.0, 1.0);
  col = mix(col, mix(uCloudSh, uCloud, lit), cov * (0.72 + 0.28 * smoothstep(uCover.y, uCover.y + 0.2, n)));
  col = mix(col, uBot, 0.5 * (1.0 - smoothstep(-0.02, 0.1, el)));                     // haze toward the horizon
  // the far town, low in the opening
  float aa = fwidth(el) + 1e-4, azT = az + uTownAz;
  vec2 tn = townNear(azT);
  float landF = 1.0 - smoothstep(-aa, aa, el - townFar(azT)), landN = 1.0 - smoothstep(-aa, aa, el - tn.x);
  col = mix(mix(col, mix(uBot, uLand, 0.5), landF), uLand * tn.y, landN);
  cov = max(cov, max(landF, landN));                                                 // nothing of the sky shows through it
  // stars, behind the cloud
  { vec2 g = vec2(az, el) * 46.0; vec2 id = floor(g); vec2 f = fract(g) - 0.5; float hh = h21(id);
    col += uStars * (1.0 - cov) * step(0.74, hh) * (1.0 - smoothstep(0.03, 0.13, length(f - (vec2(h21(id + 1.3), h21(id + 4.1)) - 0.5) * 0.6)))
      * (0.6 + 1.6 * fract(hh * 13.0)) * (0.8 + 0.2 * sin(uTime * 2.3 + hh * 40.0)); }
  // snow falling past the opening
  if (uSnow > 0.001) { float sn = 0.0;
    for (int k = 0; k < 2; k++) { float fk = float(k); vec2 g = vec2(az * (26.0 + 14.0 * fk) + 0.6 * sin(el * 9.0 + uTime * (0.6 + 0.3 * fk)), el * (26.0 + 14.0 * fk) + uTime * (1.6 + 0.7 * fk) + 5.0 * fk);
      vec2 id = floor(g), f = fract(g) - 0.5; float hh = h21(id + 31.0 * fk);
      sn = max(sn, step(0.45, hh) * (1.0 - smoothstep(0.05, 0.16 + 0.1 * fract(hh * 9.0), length(f - (vec2(h21(id + 2.7), h21(id + 6.3)) - 0.5) * 0.5)))); }
    col = mix(col, uCloud * 1.6, 0.6 * sn); }                                        // pale against a sky that is darker than they are
  col *= min(1.0, 0.97 / max(max(col.r, col.g), max(col.b, 1e-3)));                   // the sky stays under the white point, so its colour survives
  // the sun itself, seen only from inside the shaft looking back up it; round it a wide glare
  float sd = dot(d, uSunDir);
  col += uSunCol * (uGlare * exp((sd - 1.0) * 26.0) + 6.0 * smoothstep(0.9993, 0.9998, sd)) * (1.0 - 0.8 * cov);
  gl_FragColor = vec4(col, 1.0);
}`;

// ---- dust sifting off the beams at each blow (sprites born at beam positions, not a ring) ----
const BURST_VS = /* glsl */`
attribute vec2 aS; uniform float uSince; uniform float uBufH; varying float vA;
void main(){
  float t = uSince - aS.x * 0.6; float live = step(0.0, t); t = max(t, 0.0);
  vec3 p = position;
  p.y -= (0.8 + 1.6 * aS.y) * t + 0.35 * t * t;
  p.x += sin(t * 1.3 + aS.x * 40.0) * 0.35 * t; p.z += cos(t * 1.1 + aS.y * 31.0) * 0.35 * t;
  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
  float sz = 0.2 + 0.3 * aS.y + 0.2 * t;
  float pxs = sz * projectionMatrix[1][1] * uBufH * 0.5 / max(-mv.z, 0.5);
  vA = live * smoothstep(0.0, 0.2, t) * exp(-t * 0.55) * clamp(pxs / 1.5, 0.0, 1.0) * smoothstep(3.0, 10.0, -mv.z) * (1.0 - smoothstep(7.0, 9.0, uSince));
  gl_PointSize = clamp(pxs, 1.5, uBufH * 0.011);
}`;
const BURST_FS = /* glsl */`uniform vec3 uCol; varying float vA;
void main(){ vec2 q = gl_PointCoord - 0.5; float d = 1.0 - smoothstep(0.08, 0.5, length(q)); gl_FragColor = vec4(uCol * d * vA, 1.0); }`;

// ---- dust hanging in the daylight under the hatch: it sinks slowly, and the louvre bars of light show in it ----
const COLDUST_VS = /* glsl */`
attribute vec3 aS; uniform float uTime; uniform float uBufH; uniform float uSince; varying float vA;
void main(){
  vec3 p = position; float span = 104.0;
  p.y = 150.0 - mod(150.0 - p.y + uTime * (0.5 + 0.9 * aS.x), span);
  p.x += 0.9 * sin(uTime * 0.31 + aS.y * 40.0 + p.y * 0.21); p.z += 0.9 * cos(uTime * 0.27 + aS.z * 31.0 + p.y * 0.17);
  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
  float sz = 0.1 + 0.26 * aS.z * aS.z;
  float pxs = sz * projectionMatrix[1][1] * uBufH * 0.5 / max(-mv.z, 0.5);
  float h = clamp((p.y - 46.0) / span, 0.0, 1.0);                                  // the light thins out toward the bed
  float bars = 0.3 + 0.7 * smoothstep(-0.35, 0.35, sin((p.y + 0.4 * p.x) * 1.15));
  float shook = 1.0 + 1.4 * exp(-max(uSince, 0.0) * 0.5) * step(0.0, uSince) * step(0.55, aS.y);   // each blow shakes more of it loose
  vA = h * h * (0.25 + 0.75 * h) * bars * shook * (0.5 + 0.5 * sin(uTime * (1.0 + 2.0 * aS.y) + aS.x * 50.0)) * clamp(pxs / 1.4, 0.0, 1.0)
    * smoothstep(2.5, 9.0, -mv.z) * smoothstep(0.0, 6.0, 150.0 - p.y) * smoothstep(0.0, 8.0, p.y - 46.0);
  gl_PointSize = clamp(pxs, 1.4, uBufH * 0.012);
}`;
// ---- cobweb sheets between the idle chime wheels; they shiver when the fly runs ----
const WEB_VS = /* glsl */`uniform float uTime; uniform float uShiver; varying vec2 vQ;
void main(){ vQ = uv * 2.0 - 1.0; vec3 p = position;
  float w = (1.0 - dot(vQ, vQ) * 0.5);
  p += normal * w * (0.12 * sin(uTime * 0.9 + position.x) + uShiver * (0.5 * sin(uTime * 13.0 + position.y * 2.0) + 0.3 * sin(uTime * 21.0 + position.x * 3.0)));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;
const WEB_FS = /* glsl */`uniform vec3 uCol; varying vec2 vQ;
void main(){
  vec2 q = vQ + vec2(0.18, -0.12); float r = length(q); float px = length(fwidth(vQ)) + 1e-4;
  float a = atan(q.y, q.x + 1e-5);
  float rad = abs(fract(a * 11.0 / 6.2831853) - 0.5) * 6.2831853 / 11.0 * max(r, 0.05);
  float sag = r + 0.035 * cos(a * 11.0);
  float rg = abs(fract(sag * 5.0) - 0.5) / 5.0;
  float line = max((1.0 - smoothstep(0.0, px * 1.4, rad)) * clamp(0.03 / px, 0.0, 1.0), (1.0 - smoothstep(0.0, px * 1.4, rg)) * step(0.12, r) * clamp(0.012 / px - 0.25, 0.0, 1.0));   // far off the threads thin out instead of filling the sheet
  float edge = (1.0 - smoothstep(0.75, 1.0, abs(vQ.x))) * (1.0 - smoothstep(0.75, 1.0, abs(vQ.y)));
  float al = (0.3 * line + 0.02) * edge;
  gl_FragColor = vec4(uCol * al, al);
}`;
// ---- what comes in at the open pane: dust standing in the sun shaft, or snow carried in on the draught ----
const DRIFT_VS = /* glsl */`
attribute vec4 aS; uniform float uTime; uniform float uBufH; uniform vec3 uO; uniform vec3 uD; uniform vec3 uU; uniform vec3 uV; uniform vec4 uP; uniform vec2 uK; varying float vA;
void main(){
  float s = fract(aS.x + uTime * uP.z / uP.x), t = s * uP.x;                       // uP: length, half-width, speed along it, how far it sinks
  float wide = uP.y * (1.0 + uK.y * s);                                            // snow fans out as the draught dies; dust stays in the beam
  vec3 p = uO + uD * t + uU * ((aS.y * 2.0 - 1.0) * wide) + uV * ((aS.z * 2.0 - 1.0) * wide);
  p.y -= uP.w * s * s;
  p += (0.3 + 0.9 * uK.y * s) * vec3(sin(uTime * 0.31 + aS.w * 40.0 + t * 0.2), sin(uTime * 0.23 + aS.w * 17.0), cos(uTime * 0.27 + aS.w * 31.0 + t * 0.17));
  vec4 mv = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
  float sz = uK.x * (0.5 + aS.w);
  float pxs = sz * projectionMatrix[1][1] * uBufH * 0.5 / max(-mv.z, 0.5);
  vA = smoothstep(0.0, 0.03, s) * (1.0 - smoothstep(0.5, 1.0, s)) * (0.45 + 0.55 * sin(uTime * (1.0 + 2.0 * aS.w) + aS.x * 50.0)) * clamp(pxs / 1.4, 0.0, 1.0) * smoothstep(2.5, 9.0, -mv.z);
  gl_PointSize = clamp(pxs, 1.4, uBufH * 0.012);
}`;
const UVQ_VS = /* glsl */`uniform vec2 uSize; varying vec2 vQ; void main(){ vQ = uv * uSize; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const QUAD_VS = /* glsl */`varying vec2 vQ; void main(){ vQ = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// glass: the opal's own brightness. It sits just under the bloom threshold (1.0) so that a dial filling the frame stays a
// luminous white with form and does not flood the picture; only the sun's bloom behind it, the glints and the hatch go over.
// glint: how much brighter than that the dials are in their mirror image in polished metal. The room is kept about two stops
// under the glass, so everything against a dial is a silhouette.
const LOOKS = {
  morning: { glass: 0.93, glint: 3.2, dials: [['#F4F2EE', 1.0], ['#BCD2F2', 1.06], ['#DCE4EC', 1.0], ['#CFD9E4', 1.0]], amb: ['#9DB0C2', 0.058], sunDial: 0, sun: [-9, -27, 18, 0.6], sunCol: '#FFEFD2',
    shaft: ['#FFEBC8', 1.3, 0.7], paneTop: '#7FB2EA', paneBot: '#CFE4F6', paneGain: 2.0, stars: 0, snow: 0, fog: ['#526074', 0.0068], exposure: 1.0, louvre: ['#CBDAEA', 1.05],
    tint: '#F1F6FB', portal: '#D6E8FF' },
  overcast: { glass: 0.9, glint: 2.7, dials: [['#E6EAEE', 1.04], ['#E2E7EC', 1.0], ['#E4E8EC', 1.02], ['#E0E5EA', 0.98]], amb: ['#A9B5C0', 0.06], sunDial: 0, sun: [0, 0, 60, 0.0], sunCol: '#FFFFFF',
    shaft: ['#E8EEF4', 0.5, 0.16], paneTop: '#D9DEE3', paneBot: '#EEF1F3', paneGain: 1.7, stars: 0, snow: 2.0, fog: ['#5C6670', 0.0082], exposure: 0.98, louvre: ['#D6DDE4', 1.0],
    tint: '#F4F6F8', portal: '#E6EEF6' },
  late: { glass: 0.95, glint: 2.9, dials: [['#8FA8D2', 0.6], ['#F3CCC8', 1.0], ['#A3B8DA', 0.7], ['#97AED4', 0.64]], amb: ['#8E9EC0', 0.045], sunDial: 1, sun: [8, -30, 24, 0.4], sunCol: '#FF9C8E',
    shaft: ['#9DB6E0', 0.0, 0.0], paneTop: '#3B5FA8', paneBot: '#8FA8D8', paneGain: 0.9, stars: 0, snow: 0, fog: ['#4A5778', 0.0072], exposure: 1.36, louvre: ['#C9B8D2', 0.95],
    tint: '#F6F2F8', portal: '#FFD6D0' },
  night: { glass: 1.1, glint: 2.8, dials: [['#93A8D2', 0.34], ['#93A8D2', 0.34], ['#A9BCE2', 0.5], ['#8CA2CE', 0.3]], amb: ['#7088B4', 0.045], sunDial: 2, sun: [0, 0, 60, 0.0], sunCol: '#E6F0FF',
    moon: [-15, 19, 6.5, 1.3], shaft: ['#8FB0FF', 0.0, 0.0], paneTop: '#081226', paneBot: '#152A52', paneGain: 1.0, stars: 2.2, snow: 0, fog: ['#27364F', 0.0066], exposure: 1.85,
    louvre: ['#4E6CA6', 0.55], tint: '#EAF0FF', portal: '#BFD4FF' },
};

export default {
  id: 'the-striking-hour',
  name: 'The Striking Hour',
  category: 'interior',
  media: ['interior', 'tiny', 'cable'],
  weirdness: 0.6,
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const vr = rng.fork('variant'), detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    const scene = new THREE.Scene();
    const disposables = [];

    // ---------------------------------------------------------------- variations
    let lookId = vr.pick(['morning', 'morning', 'morning', 'overcast', 'overcast', 'late', 'late', 'night']);
    if (vary.hour === 'dawn') lookId = 'morning';
    else if (vary.hour === 'day') lookId = vr.chance(0.55) ? 'morning' : 'overcast';
    else if (vary.hour === 'golden') lookId = 'late';
    else if (vary.hour === 'night') lookId = 'night';
    const LK = LOOKS[lookId];
    const hour = vr.int(3, 12);                                  // the hour that strikes
    const cast = vr.pick(['pigeons', 'pigeons', 'pigeons', 'jackdaws', 'owl']);
    const rare = !!vary.rare;
    const DUR = 40, RELEASE = 26, WARNING = 24, interval = Math.min(2.5, 12.3 / hour);

    // ---------------------------------------------------------------- the hero: the strike
    const hero = await buildHero(ctx, { blows: hour, timeline: { duration: DUR, warning: WARNING, release: RELEASE, interval }, progress: 0 });
    scene.add(hero.object);
    await ctx.yield();
    const A = hero.anchors, HU = hero.uniforms;
    const dialCols = LK.dials.map(([h, k]) => new THREE.Color(h).multiplyScalar(k));
    for (let i = 0; i < 4; i++) HU.uDialCol.value[i].copy(dialCols[i]);
    if (lookId === 'late') { const c = HU.uDialCol.value[1], l = 0.3 * c.r + 0.55 * c.g + 0.15 * c.b; c.lerp(new THREE.Color(l, l, l * 1.04), 0.5); }   // rose glass, but the brass stays cold
    HU.uAmb.value.set(LK.amb[0]).multiplyScalar(LK.amb[1]); HU.uGlint.value = LK.glint;
    HU.uLouvre.value.set(LK.louvre[0]).multiplyScalar(LK.louvre[1] * 0.9);
    const SHAFT_O = HU.uShaftO.value.clone(), SHAFT_D = HU.uShaftD.value.clone();
    HU.uShaftCol.value.set(LK.shaft[0]).multiplyScalar(LK.shaft[1]);
    { const night = lookId === 'night', dU = hero.drumUniforms;   // the drum of blur must read against a white dial by day and not glow at night
      dU.uPale.value.set(night ? '#8fa0c0' : '#7d8c9d').multiplyScalar(night ? 0.3 : 0.58); dU.uDense.value = night ? 1.0 : 1.0; dU.uRed.value.multiplyScalar(night ? 0.55 : 1);
      dU.uSteel.value.multiplyScalar(night ? 0.35 : lookId === 'late' ? 0.6 : 1);
      dU.uSheen.value.copy(dialCols[0]).add(dialCols[1]).add(dialCols[2]).add(dialCols[3]).multiplyScalar(night ? 0.34 : lookId === 'late' ? 0.3 : 0.27); }
    HU.uHatchCol.value.set(LK.louvre[0]).multiplyScalar(LK.louvre[1] * 4.5);
    if (hero.dustUniforms) hero.dustUniforms.uCol.value.multiplyScalar(lookId === 'night' ? 0.4 : lookId === 'late' ? 0.75 : 1);
    HU.uPortalCol.value.set(LK.portal).multiplyScalar(lookId === 'night' ? 0.9 : 1.4);
    HU.uFillCol.value.set(LK.amb[0]).lerp(new THREE.Color(LK.louvre[0]), 0.5).multiplyScalar(lookId === 'night' ? 0.32 : 0.6);
    scene.fog = new THREE.FogExp2(new THREE.Color(LK.fog[0]), LK.fog[1]);
    scene.background = new THREE.Color(LK.fog[0]).multiplyScalar(0.25);
    const mat = hero.makeMaterial();                             // the dial-lit material for everything solid here
    const matRig = hero.makeMaterial({}, { uFill: { value: 0.1 } });   // the cradle: the same shader with a floor of fill light, so it is never a black cut-out
    const K = hero.colors, cBrass = K.brass, cSteel = K.steel, cRed = K.red, livery = hero.livery;
    const C = (col, metal, rough, mul = 1) => { const c = new THREE.Color(col).multiplyScalar(mul); c.metal = metal; c.rough = rough; return c; };
    const paint = C(livery, 0, 0.42, hero.liveryMul), brass = C(cBrass, 1, 0.22), brassPol = C(cBrass, 1, 0.12, 1.08), brassDull = C(cBrass, 1, 0.34, 0.8);
    const brassHi = C(cBrass, 1, 0.12, 1.3);
    const steel = C(cSteel, 1, 0.26), steelPol = C(cSteel, 1, 0.1, 1.25), steelDark = C(cSteel, 1, 0.5, 0.6), red = C(cRed, 0, 0.4);
    // the room is two stops under the glass: dark ashlar, darker oak, so the dials are the light and the machine is a silhouette
    const oak = C('#8a8172', 0, 0.9, 0.28), oakDk = C('#a39a8a', 0, 0.9, 0.3), iron = C(K.black, 0, 0.6, 1.6), stone = C('#8b9198', 0, 0.95, 0.42), stoneDk = C('#6a7078', 0, 0.95, 0.42);
    const blackIron = C(K.black, 0, 0.34, 0.9);                    // anything standing against a dial: true black with a thin cold rim glint
    const bronze = C('#8a8566', 1, 0.4), boards = [C('#6a655c', 0, 0.9, 0.6), C('#766f64', 0, 0.9, 0.6), C('#5f5a52', 0, 0.9, 0.6)];
    const add = (b, geo, m, c) => b.add(geo, m, c, c.metal, c.rough, 0);
    const gRod = (r, len, segs = 10, ch = 0.06) => lathe(rodProfile(r, len, ch), segs);
    const finish = (b, name, parent = scene) => { const m = b.mesh(mat, name); parent.add(m); return m; };
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    // ---------------------------------------------------------------- the route
    // ticks: over the crowns of the going train, a half-circle before the east dial, back toward the fly;
    // strike: the hero's line (orbit, west run, climbing turn, up the wire, into the bell)
    const GT = [{ x: -36, R: 15, z: -15.5 }, { x: -13, R: 17, z: -11.5 }, { x: 11, R: 19, z: -15.5 }, { x: 35, R: 20, z: -11.5 }];
    const ft = A.flyThrough.slice(2);
    const pts = [[-60, 40.5, -12.3], [-48, 40.5, -12.5], [-36, 40.2, -13.0], [-25.5, 37.6, -13.5], [-13, 41.8, -13.5], [-1.5, 39.5, -13.5],
      [11, 43.8, -13.5], [23, 41.8, -13.4], [35, 45.0, -13.0], [46.5, 46.3, -10.5], [53.5, 47, -4.5], [56, 47.3, 3.5], [54.5, 47.2, 11], [49, 47, 16], [41, 46.8, 18.6],
      ...ft];
    await ctx.yield();
    const path = makePath(pts);
    await ctx.yield();
    const L = path.length, SEAT = A.portalSeat.position;
    // distance along the path of the point nearest p: a coarse pass, then a fine one round the best sample
    const distOf = (p, from = 0) => { let best = 1e9, bd = 0; const q = new THREE.Vector3(), st = L / 400;
      for (let i = 0; i <= 400; i++) { const d = i * st; if (d < from) continue; const e = path.posAtDist(d, q).distanceToSquared(p); if (e < best) { best = e; bd = d; } }
      const c = bd;
      for (let i = -20; i <= 20; i++) { const d = Math.min(L, Math.max(from, c + (i / 20) * st)); const e = path.posAtDist(d, q).distanceToSquared(p); if (e < best) { best = e; bd = d; } }
      return bd; };
    const sA = distOf(A.orbit[0]); await ctx.yield();
    const sB = distOf(A.orbit[8], sA + 60); await ctx.yield();
    const sC = distOf(V(-42, 45, 18.5), sB), sD = distOf(A.wireLine.from, sC);
    await ctx.yield();
    // story time (the brief's seconds) as a function of distance: 26 s of ticks, 14 s of strike
    const knots = [[0, 6.5], [sA - 8, 6.5], [sA + 6, 8.5], [sB, 31], [sC, 35], [sD, 29], [sD + 45, 36], [L, 27]];
    const vAt = (s) => { for (let i = 1; i < knots.length; i++) if (s <= knots[i][0]) { const a = knots[i - 1], b = knots[i]; return a[1] + (b[1] - a[1]) * Math.min(1, Math.max(0, (s - a[0]) / (b[0] - a[0]))); } return knots[knots.length - 1][1]; };
    const NS = 600, Ttab = new Float32Array(NS + 1);
    { let iA = Math.round((sA / L) * NS);
      for (let i = 1; i <= NS; i++) Ttab[i] = Ttab[i - 1] + (L / NS) / vAt(((i - 0.5) / NS) * L);
      const tA = Ttab[iA], tL = Ttab[NS];
      for (let i = 0; i <= NS; i++) Ttab[i] = i <= iA ? Ttab[i] * (RELEASE / tA) : RELEASE + (Ttab[i] - tA) * ((DUR - RELEASE) / (tL - tA)); }
    const storyT = (u) => { const x = Math.min(1, Math.max(0, u)) * NS, i = Math.min(NS - 1, Math.floor(x)); return Ttab[i] + (Ttab[i + 1] - Ttab[i]) * (x - i); };
    const pace = (u) => { const x = Math.min(0.999, Math.max(0, u)) * NS, i = Math.floor(x), j = Math.min(NS, i + 3), i0 = Math.max(0, j - 6); return ((j - i0) * (L / NS) / Math.max(1e-3, Ttab[j] - Ttab[i0])) / (L / DUR); };
    await ctx.yield();
    const uOfT = (T) => { let lo = 0, hi = NS; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (Ttab[m] < T) lo = m; else hi = m; } return lo / NS; };
    const T_LEAVES_ORBIT = storyT(sB / L);                       // the story second at which the cradle leaves the orbit round the fly

    // ---------------------------------------------------------------- the room: floor, walls, ceiling, belfry
    let RB = new Batch();
    const PIT = { x0: -52, x1: -20, z0: -31.5, z1: -21, y: -18 }, PEND_Z = -26;
    for (let k = 0; k < 40; k++) {
      const z0 = -70 + k * 3.5, c = boards[(k * 7 + (k >> 2)) % 3], zc = z0 + 1.75;
      if (z0 >= PIT.z0 - 0.01 && z0 < PIT.z1 - 0.01) {
        add(RB, cbox(PIT.x0 + 70, 1, 3.44, 0.06), M((PIT.x0 - 70) / 2, -0.5, zc), c);
        add(RB, cbox(70 - PIT.x1, 1, 3.44, 0.06), M((PIT.x1 + 70) / 2, -0.5, zc), c);
      } else add(RB, cbox(140, 1, 3.44, 0.06), M(0, -0.5, zc), c);
    }
    { const px = (PIT.x0 + PIT.x1) / 2, pz = (PIT.z0 + PIT.z1) / 2, pw = PIT.x1 - PIT.x0, pd = PIT.z1 - PIT.z0, ph = -PIT.y;
      add(RB, cbox(pw + 2, 1, pd + 2, 0.05), M(px, PIT.y - 0.5, pz), stoneDk);
      for (const s of [-1, 1]) { add(RB, cbox(pw + 2, ph, 1, 0.05), M(px, PIT.y / 2 - 0.5, pz + s * (pd / 2 + 0.5)), stoneDk); add(RB, cbox(1, ph, pd, 0.05), M(px + s * (pw / 2 + 0.5), PIT.y / 2 - 0.5, pz), stoneDk); }
      for (const s of [-1, 1]) add(RB, cbox(pw + 1.2, 0.5, 0.6, 0.08), M(px, 0.25, pz + s * (pd / 2 + 0.3)), iron); }
    await ctx.yield();
    const wallM = [M(70.9, 119, 0, 0, RX), M(-70.9, 119, 0, 0, RX), M(0, 119, 70.9), M(0, 119, -70.9)];
    const ringM = [M(70.25, 75, 0, 0, 0, RX), M(-70.25, 75, 0, 0, 0, -RX), M(0, 75, 70.25, -RX), M(0, 75, -70.25, RX)];
    const ring = lathe([[55.0, 0], [57.8, 0], [57.8, 1.1], [56.6, 1.5], [55.0, 1.1], [55.0, 0]], 48);
    const dialBoss = lathe([[0, 0], [2.8, 0], [2.8, 0.5], [2.0, 1.3], [0.9, 1.7], [0, 1.7]], 16);
    // iron bracing just inside the glass, on the lines of the frame outside: silhouette and parallax
    const ironRing = (r) => lathe([[r - 0.36, 1.45], [r + 0.36, 1.45], [r + 0.36, 2.05], [r - 0.36, 2.05], [r - 0.36, 1.45]], 48);
    const spokeBar = cbox(49, 0.6, 0.62, 0.1);
    for (let i = 0; i < 4; i++) {
      add(RB, cbox(143, 242, 1.2, 0.05), wallM[i], stone);
      add(RB, ring, ringM[i], iron); add(RB, dialBoss, ringM[i], iron);
      const zo = i === 0 || i === 2 ? -1 : 1;
      for (const y of [13, 137]) add(RB, cbox(140, 1.6, 1.4, 0.2), wallM[i].clone().multiply(M(0, y - 119, zo * 1.2)), stoneDk);
      for (const sx of [-1, 1]) { add(RB, cbox(11.5, 1.5, 1.3, 0.2), wallM[i].clone().multiply(M(sx * 63.6, 75 - 119, zo * 1.15)), stoneDk);
        for (const dx of [-3, 3]) add(RB, cbox(1.5, 2.6, 1.7, 0.3), wallM[i].clone().multiply(M(sx * 63.6 + dx, 73.2 - 119, zo * 1.2)), stone); }
      for (let x = -60; x <= 60.1; x += 10) add(RB, cbox(1.7, 3.0, 2.0, 0.35), wallM[i].clone().multiply(M(x, 135 - 119, zo * 1.4)), stone);
      add(RB, ironRing(51), ringM[i], iron); add(RB, ironRing(38), ringM[i], iron); if (i === 1) add(RB, ironRing(24), ringM[i], iron);
      for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; add(RB, spokeBar, ringM[i].clone().multiply(M(Math.cos(a) * 30.5, 1.75, Math.sin(a) * 30.5, 0, -a, 0)), iron); }
      await ctx.yield();
    }
    await ctx.yield();
    // maintenance gallery under the north and west dials, a ladder up to it and a tall ladder up each wall
    for (const [wi, sgn] of [[3, 1], [1, 1]]) {
      const W = wallM[wi], at = (x, y, z, rx = 0, ry = 0, rz = 0) => W.clone().multiply(M(x, y - 119, sgn * z, rx, ry, rz));
      for (let k = 0; k < 3; k++) add(RB, cbox(126, 0.35, 1.05, 0.05), at(0, 15.0, 1.3 + k * 1.1), boards[(k + wi) % 3]);
      for (let x = -60; x <= 60.1; x += 8) {
        add(RB, cbox(0.45, 0.55, 3.6, 0.08), at(x, 14.6, 2.3), iron);
        add(RB, cbox(0.3, 0.3, 3.6, 0.05), at(x, 13.2, 2.1, sgn * 0.75), iron);
        add(RB, gRod(0.16, 3.4, 6), at(x, 15.1, 3.95), iron);
      }
      for (const y of [18.5, 16.9]) add(RB, gRod(y > 18 ? 0.2 : 0.13, 126, 6), at(-63, y, 3.95, 0, 0, -RX), y > 18 ? brassDull : iron);
      for (const dx of [-0.9, 0.9]) { add(RB, cbox(0.28, 15.6, 0.28, 0.05), at(52 + dx, 7.6, 4.6), iron); add(RB, cbox(0.3, 119, 0.3, 0.05), at(-63.5 + dx, 77.5, 2.3), iron); }
      for (let y = 1.2; y < 15; y += 1.5) add(RB, gRod(0.12, 1.8, 5), at(51.1, y, 4.6, 0, 0, -RX), iron);
      for (let y = 19.5; y < 136; y += 2.2) add(RB, gRod(0.13, 1.8, 5), at(-64.4, y, 2.3, 0, 0, -RX), iron);
      for (let y = 30; y < 136; y += 15) add(RB, cbox(2.6, 0.3, 1.9, 0.05), at(-63.5, y, 1.4), iron);
      await ctx.yield();
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(RB, cbox(5, 150, 5, 0.3), M(sx * 68, 75, sz * 68), stoneDk);
    await ctx.yield();
    finish(RB, 'roomWalls'); RB = new Batch();
    await ctx.yield();
    // ceiling with the hatch, joists, belfry frame
    const HX = A.hatch.center.x, HZ = A.hatch.center.z, HH = A.hatch.size / 2;
    add(RB, cbox(HX - HH + 70, 2, 140, 0.05), M((HX - HH - 70) / 2, 149, 0), oakDk);
    add(RB, cbox(70 - HX - HH, 2, 140, 0.05), M((HX + HH + 70) / 2, 149, 0), oakDk);
    add(RB, cbox(2 * HH, 2, HZ - HH + 70, 0.05), M(HX, 149, (HZ - HH - 70) / 2), oakDk);
    add(RB, cbox(2 * HH, 2, 70 - HZ - HH, 0.05), M(HX, 149, (HZ + HH + 70) / 2), oakDk);
    { const trim = C('#8a8172', 0, 0.9, 0.2);
      for (const s of [-1, 1]) { add(RB, cbox(2 * HH + 4, 7.4, 2, 0.6), M(HX, 146.6, HZ + s * (HH + 1)), trim); add(RB, cbox(2, 7.4, 2 * HH, 0.6), M(HX + s * (HH + 1), 146.6, HZ), trim); } }
    for (let z = -63; z <= 63.1; z += 14) {                      // cross-noggins between the joists
      if (Math.abs(z - HZ) < HH + 1) { add(RB, cbox(HX - HH + 69, 3.2, 1.2, 0.12), M((HX - HH - 71) / 2, 146.6, z), oakDk); add(RB, cbox(69 - HX - HH, 3.2, 1.2, 0.12), M((HX + HH + 71) / 2, 146.6, z), oakDk); }
      else add(RB, cbox(140, 3.2, 1.2, 0.12), M(0, 146.6, z), oakDk);
    }
    for (let x = -66; x <= 66.1; x += 12) {
      if (Math.abs(x - HX) < HH + 1) { add(RB, cbox(1.6, 6, HZ - HH + 69, 0.15), M(x, 145.2, (HZ - HH - 71) / 2), oak); add(RB, cbox(1.6, 6, 69 - HZ - HH, 0.15), M(x, 145.2, (HZ + HH + 71) / 2), oak); }
      else add(RB, cbox(1.6, 6, 140, 0.15), M(x, 145.2, 0), oak);
    }
    await ctx.yield();
    add(RB, cbox(142, 2, 142, 0.05), M(0, 239, 0), oakDk);
    for (const z of [-42, -14, 14, 42]) add(RB, cbox(140, 3, 2.2, 0.2), M(0, 236.5, z), oak);
    const BX = A.bell.center.x, BZ = A.bell.center.z, FR = 24;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      add(RB, cbox(2.6, 78, 2.6, 0.2), M(BX + sx * FR, 189, BZ + sz * FR), oak);
      add(RB, cbox(2.0, 2.0, 18, 0.15), M(BX + sx * 18, 227, BZ + sz * 18, 0, -sx * sz * Math.PI / 4), oak);        // corner brace the quarter bell hangs from
      add(RB, cbox(1.6, 1.6, 20, 0.15), M(BX + sx * FR, 216, BZ + sz * (FR - 6.5), sz * 0.72), oak);
    }
    for (const s of [-1, 1]) { add(RB, cbox(2 * FR + 3, 2.6, 2.6, 0.2), M(BX, 227, BZ + s * FR), oak); add(RB, cbox(2.6, 2.6, 2 * FR + 3, 0.2), M(BX + s * FR, 227, BZ), oak); }
    add(RB, cbox(2 * FR, 2.4, 2.4, 0.2), M(BX, 225.2, BZ), oak); add(RB, cbox(2.4, 2.4, 2 * FR, 0.2), M(BX, 225.2, BZ), oak);
    await ctx.yield();
    // four quarter bells (their hammers are separate so the rare chime can swing them)
    const qbOut = lathe([[4.0, 0], [3.75, 0.5], [2.95, 1.6], [2.45, 3.2], [2.25, 4.2], [1.6, 4.9], [0, 5.1]], 20, true);
    const qbIn = lathe([[0, 4.7], [1.4, 4.5], [1.95, 4.0], [2.15, 3.2], [2.65, 1.6], [3.45, 0.5], [3.8, 0], [4.0, 0]], 20, true);
    const QB = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = BX + sx * 18, z = BZ + sz * 18, y = 198;
      add(RB, qbOut, M(x, y, z), bronze); add(RB, qbIn, M(x, y, z), C('#4a4838', 1, 0.6));
      add(RB, gRod(0.35, 226 - y - 5, 8), M(x, y + 5, z), steelDark);
      add(RB, cbox(1.2, 1.2, 9, 0.1), M(x + sx * 4.6, y + 1.2, z + sz * 4.6, 0, -sx * sz * Math.PI / 4), oak);
      QB.push({ x, y, z, sx, sz });
    }
    // the open inspection pane: an iron frame leaf swung inward on its top hinge
    { const leaf = M(66.98, 55.97, -22, 0, 0, -1.2217);
      add(RB, cbox(0.12, 5.7, 5.7, 0.03), leaf, C('#cfd6dc', 0, 0.5));
      for (const s of [-1, 1]) { add(RB, cbox(0.3, 6, 0.3, 0.05), leaf.clone().multiply(M(0, 0, s * 2.85)), iron); add(RB, cbox(0.3, 0.3, 6, 0.05), leaf.clone().multiply(M(0, s * 2.85, 0)), iron); }
      add(RB, gRod(0.12, 1, 6, 0.01), along(V(69.6, 51.3, -19.3), V(64.4, 54.9, -19.3)), steelDark); }
    await ctx.yield();
    // plank gantries hung under the joists on both sides of the climb, a ladder up to the hatch: depth between the wire and the ceiling
    { const hcap = lathe([[0, -0.1], [0.3, -0.1], [0.36, 0], [0.36, 0.3], [0.24, 0.5], [0.14, 0.5]], 8), hcol = lathe([[0.14, 0], [0.3, 0.06], [0.3, 0.5], [0.14, 0.56]], 8);
      const hang = (x, y, z) => { add(RB, gRod(0.14, 142.4 - y, 6), M(x, y, z), blackIron); add(RB, hcap, M(x, y, z), brassHi); add(RB, hcol, M(x, y + 5.2, z), brassHi); };
      const GY = 130.5, GZ = 21.4;                                  // south gantry, east-west
      for (let k = 0; k < 3; k++) add(RB, cbox(96, 0.3, 1.0, 0.05), M(4, GY, GZ + (k - 1) * 1.08), boards[k]);
      for (let x = -42; x <= 50.1; x += 12) { add(RB, cbox(0.4, 0.5, 4.4, 0.08), M(x, GY - 0.4, GZ), blackIron); for (const s of [-1, 1]) hang(x, GY - 0.4, GZ + s * 2.0);
        for (const s of [-1, 1]) add(RB, gRod(0.1, 3.0, 5), M(x, GY, GZ + s * 1.9), blackIron); }
      for (const s of [-1, 1]) for (const y of [GY + 2.9, GY + 1.5]) add(RB, gRod(0.11, 96, 5), M(-44, y, GZ + s * 1.9, 0, 0, -RX), blackIron);
      await ctx.yield();
      const NX = -17, NY = 124;                                     // north gantry, north-south, lower
      for (let k = 0; k < 3; k++) add(RB, cbox(1.0, 0.3, 46, 0.05), M(NX + (k - 1) * 1.08, NY, -45), boards[2 - k]);
      for (let z = -66; z <= -29.9; z += 12) { add(RB, cbox(4.4, 0.5, 0.4, 0.08), M(NX, NY - 0.4, z), blackIron); for (const s of [-1, 1]) hang(NX + s * 2.0, NY - 0.4, z);
        for (const s of [-1, 1]) add(RB, gRod(0.1, 3.0, 5), M(NX + s * 1.9, NY, z), blackIron); }
      for (const s of [-1, 1]) for (const y of [NY + 2.9, NY + 1.5]) add(RB, gRod(0.11, 46, 5), M(NX + s * 1.9, y, -68, RX), blackIron);
      await ctx.yield();
      { const GZ2 = -7.5;                                           // a third walk north of the climb, east-west, stopping short of the hatch
        for (let k = 0; k < 3; k++) add(RB, cbox(40.5, 0.3, 1.0, 0.05), M(-23.75, GY, GZ2 + (k - 1) * 1.08), boards[(k + 1) % 3]);
        for (let x = -42; x <= -5.9; x += 12) { add(RB, cbox(0.4, 0.5, 4.4, 0.08), M(x, GY - 0.4, GZ2), blackIron); for (const s of [-1, 1]) hang(x, GY - 0.4, GZ2 + s * 2.0);
          for (const s of [-1, 1]) add(RB, gRod(0.1, 3.0, 5), M(x, GY, GZ2 + s * 1.9), blackIron); }
        for (const s of [-1, 1]) for (const y of [GY + 2.9, GY + 1.5]) add(RB, gRod(0.11, 40.5, 5), M(-44, y, GZ2 + s * 1.9, 0, 0, -RX), y > GY + 2 ? brassDull : blackIron);
        add(RB, lathe([[0, 0], [0.9, 0], [1.0, 0.2], [1.0, 1.5], [0.9, 1.6], [0, 1.6]], 12), M(-30, GY + 0.15, GZ2 - 0.2), brassDull);          // an oil drum left on the planks
        await ctx.yield(); }
      const LX = HX + HH + 3.2;                                     // ladder from the south gantry up through the joists
      for (const dz of [-0.8, 0.8]) add(RB, cbox(0.24, 150 - GY, 0.24, 0.05), M(LX, (150 + GY) / 2, GZ + dz), blackIron);
      for (let y = GY + 1.2; y < 149; y += 1.5) add(RB, gRod(0.1, 1.6, 5), M(LX, y, GZ - 0.8, RX), blackIron);
      // a coil of rope and a bucket left on the planks
      add(RB, lathe([[0.5, 0], [1.3, 0], [1.4, 0.25], [1.3, 0.5], [0.5, 0.5]], 14), M(-6, GY + 0.15, GZ), C('#8a8474', 0, 0.86, 0.7));
      add(RB, lathe([[0, 0], [0.7, 0], [0.9, 1.4], [0.8, 1.4], [0.62, 0.1], [0, 0.1]], 12), M(22, GY + 0.15, GZ + 0.3), blackIron); }
    await ctx.yield();
    finish(RB, 'room');
    await ctx.yield();
    // Everything this round adds to the room that does not move goes into one batch of its own (one mesh, one draw call), and its
    // chance comes from a stream of its own, so nothing older is dealt differently.
    const R4 = new Batch(), r4 = ctx.core.makeRng(ctx.core.hashSeed('the-striking-hour:r4-room:' + ctx.seed));
    // the open pane is a casement: an iron frame fixed in the dial round the opening, the leaf's own glazing bars, two hinges on
    // the head and a latch on the leaf's free edge
    { const leaf = M(66.98, 55.97, -22, 0, 0, -1.2217), ironLt = C(K.black, 0, 0.5, 2.6);
      add(R4, cbox(0.56, 0.4, 6.8, 0.08), M(69.74, 57.2, -22), iron); add(R4, cbox(0.8, 0.4, 7.0, 0.08), M(69.62, 50.8, -22), iron);
      for (const sgn of [-1, 1]) add(R4, cbox(0.56, 6.0, 0.4, 0.08), M(69.74, 54, -22 + sgn * 3.2), iron);
      add(R4, cbox(0.2, 5.4, 0.16, 0.04), leaf, ironLt); add(R4, cbox(0.2, 0.16, 5.4, 0.04), leaf, ironLt);
      for (const sgn of [-1, 1]) { add(R4, gRod(0.26, 0.9, 8, 0.05), M(69.62, 57.0, -22 + sgn * 1.9 - 0.45, RX), steelDark); add(R4, cbox(0.1, 0.5, 0.7, 0.03), leaf.clone().multiply(M(0.1, 2.5, sgn * 1.9)), steelDark); }
      add(R4, cbox(0.5, 0.12, 0.12, 0.03), leaf.clone().multiply(M(0.32, -2.5, 0)), steelPol); add(R4, lathe([[0, -0.16], [0.13, -0.1], [0.16, 0], [0.13, 0.1], [0, 0.16]], 8, true), leaf.clone().multiply(M(0.62, -2.5, 0)), brassPol);
      add(R4, gRod(0.12, 1, 6, 0.01), along(V(69.6, 51.3, -24.7), V(64.4, 54.9, -24.7)), steelDark); }   // the second stay
    // where the birds sit, the iron is whitened: splashes on the tops of the bed's two outer girders and on the gantry's planks under
    // its rail (the roosts are along those), a run down the flange under some, and a few shed feathers beside them. All cold white.
    { const lime = [C('#d3d9de', 0, 0.85), C('#b9c1c8', 0, 0.85), C('#e3e7ea', 0, 0.8)], plume = C('#b9c0c8', 0, 0.9);
      const splash = (x, y, z, r) => add(R4, lathe([[r, 0], [r * 0.8, 0.03], [0, 0.04]], 7), M(x, y, z, 0, r4.range(0, TAU), 0, 1, 1, r4.range(0.6, 1)), r4.pick(lime));
      for (let k = 0; k < 34; k++) {
        const onPlanks = k % 3 === 2, x = r4.range(-50, 50), z0 = onPlanks ? 26.4 : r4.pick([-20, 20]), y = onPlanks ? 19.38 : 20.0, z = z0 + r4.range(-0.9, 0.9) * (onPlanks ? 0.6 : 1);
        const r = r4.range(0.28, 0.62);
        splash(x, y, z, r);
        for (let j = r4.int(0, 2); j > 0; j--) splash(x + r4.range(-1.1, 1.1), y, z0 + r4.range(-1.0, 1.0) * (onPlanks ? 0.6 : 1), r * r4.range(0.3, 0.6));
        if (!onPlanks && r4.chance(0.4)) { const sgn = r4.chance(0.5) ? 1 : -1; add(R4, cbox(r4.range(0.1, 0.2), r4.range(0.25, 0.55), 0.03, 0.01), M(x + r4.range(-0.4, 0.4), 19.72, z0 + sgn * 1.315), lime[0]); }
        if (k % 6 === 0) add(R4, cbox(1.5, 0.04, 0.34, 0.01), M(x + r4.range(-2, 2), y + 0.03, z0 + r4.range(-0.8, 0.8) * (onPlanks ? 0.6 : 1), 0, r4.range(0, TAU), r4.range(-0.06, 0.06)), plume);
      } }
    await ctx.yield();
    // the oiler's things left on the gantry planks at the east end, by its ladder: a tin oil can with a long spout, and his rag
    { const tin = C('#aab3bb', 1, 0.34), cloth = C('#4f5a66', 0, 0.9), gx = 51.5 - r4.range(7, 13), gz = 25.2, gy = 19.38, yaw = r4.range(0, TAU);
      const at = (x, y, z, rx = 0, ry = 0, rz = 0) => M(gx, gy, gz, 0, yaw, 0).multiply(M(x, y, z, rx, ry, rz));
      add(R4, lathe([[0, 0], [0.8, 0], [0.86, 0.1], [0.86, 1.0], [0.34, 1.75], [0.2, 2.1], [0, 2.1]], 12), at(0, 0, 0), tin);
      add(R4, gRod(0.07, 1, 6, 0.01), at(0, 0, 0).multiply(along(V(0.15, 1.95, 0), V(2.3, 2.9, 0))), tin);
      add(R4, lathe([[0.5, -0.06], [0.58, 0], [0.5, 0.06], [0.42, 0], [0.5, -0.06]], 10, false, Math.PI), at(-0.8, 0.95, 0, RX, 0, RX), tin);                     // its handle
      add(R4, cbox(1.9, 0.1, 1.4, 0.04), at(1.2, 0.05, -1.9, 0, 0.5, 0), cloth); add(R4, cbox(1.1, 0.12, 1.2, 0.05), at(1.5, 0.15, -1.7, 0, 0.9, 0.05), cloth); }
    await ctx.yield();

    // ---------------------------------------------------------------- the four dials (east, west, south, north)
    const DIRS = [V(1, 0, 0), V(-1, 0, 0), V(0, 0, 1), V(0, 0, -1)], RIGHTS = [V(0, 0, 1), V(0, 0, -1), V(-1, 0, 0), V(1, 0, 0)];
    const dialGeo = new THREE.CircleGeometry(55, 96), dials = [], UP = V(0, 1, 0);
    const uTime = { value: 0 };
    for (let i = 0; i < 4; i++) {
      const isSun = i === LK.sunDial, moon = lookId === 'night' && i === 2;
      const U = { uCol: { value: dialCols[i].clone().multiplyScalar(LK.glass ?? 1.5) }, uShade: { value: dialCols[i].clone().multiplyScalar(0.08).lerp(new THREE.Color('#10151b'), 0.3) }, uSunCol: { value: new THREE.Color(LK.sunCol) },
        uHands: { value: HU.uHands.value[i] }, uTime, uNear: { value: 1 }, uFig: { value: i }, uSun: { value: new THREE.Vector4(LK.sun[0], LK.sun[1], LK.sun[2], isSun ? LK.sun[3] : 0) },
        uMoon: { value: moon ? new THREE.Vector4(...LK.moon) : new THREE.Vector4(0, 0, 5, 0) }, uPane: { value: new THREE.Vector4(-22, -21, 3, i === 0 ? 1 : 0) },
        uBirds: { value: [0, 1, 2, 3].map(() => new THREE.Vector3(0, 0, 0)) }, uSnow: { value: LK.snow } };
      const m = new THREE.Mesh(dialGeo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: DIAL_VS, fragmentShader: DIAL_FS }));
      m.matrixAutoUpdate = false; m.matrix.makeBasis(RIGHTS[i], UP, DIRS[i].clone().negate()).setPosition(DIRS[i].clone().multiplyScalar(70).setY(75)); m.matrixWorldNeedsUpdate = true;
      m.frustumCulled = false; scene.add(m); dials.push({ mesh: m, U });
    }
    // the birds outside are birds, not blots: which way each one faces and where it is in its stride (set every frame), and the cast
    for (const d of dials) { d.U.uBirdF = { value: [0, 1, 2, 3].map(() => new THREE.Vector2(1, 0)) }; d.U.uDaw = { value: cast === 'jackdaws' ? 1 : 0 };
      d.U.uWalk = { value: [0, 1].map(() => new THREE.Vector4(0, 1, 0, 0)) }; }
    // the walkers on the level spokes: each has its own beat and reach, from a stream of its own
    const walkRng = ctx.core.makeRng(ctx.core.hashSeed('the-striking-hour:r4-walkers:' + ctx.seed));
    const walkSeed = dials.map(() => [-1, 1].map((side) => ({ side, ph: walkRng.range(0, TAU), rate: walkRng.range(0.035, 0.06), mid: walkRng.range(19, 25), reach: walkRng.range(7, 11), rest: walkRng.range(0, TAU) })));
    { const pTop = new THREE.Color(LK.paneTop).multiplyScalar(LK.paneGain), pBot = new THREE.Color(LK.paneBot).multiplyScalar(LK.paneGain), day = lookId === 'morning' || lookId === 'overcast';
      // the open air seen past a lit milk glass, in every look: the sky's own colours are kept, but bluer than the glass beside the
      // opening and a clear step under it. That glass is the east dial's own light at the pane's place, as DIAL_FS makes it there.
      const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b, pq = dials[0].U.uPane.value, sun = dials[0].U.uSun.value;
      const glass = dialCols[0].clone().multiplyScalar((LK.glass ?? 1.5) * (1 + 0.1 * pq.y / 55) * (1 - 0.6 * (pq.x * pq.x + pq.y * pq.y) / 3025))
        .add(new THREE.Color(LK.sunCol).multiplyScalar(sun.w * 0.5 * Math.exp(-((pq.x - sun.x) ** 2 + (pq.y - sun.y) ** 2) / (2 * sun.z * sun.z))));
      const gL = lum(glass), blue = new THREE.Color('#4F8FE0'), bL = lum(blue);       // toward this blue, at its own brightness, until it is bluer than the glass by the step
      const bluer = (c) => { const L = lum(c), B = c.b / L, t = Math.min(1, Math.max(0, (1.4 * glass.b / gL - B) / Math.max(1e-6, blue.b / bL - B))); c.lerp(blue.clone().multiplyScalar(L / bL), t); };
      bluer(pTop); bluer(pBot);
      // the sky's cloud by the look: broken cumulus on a clear morning, a closed lid under overcast, thin bars late, moonlit rags at night
      const cloud = LK.snow ? pBot.clone() : lookId === 'night' ? pBot.clone().multiplyScalar(1.7) : pBot.clone().lerp(day ? new THREE.Color(1, 1, 1) : new THREE.Color(LK.sunCol), day ? 0.6 : 0.4).multiplyScalar(day ? 1.2 : 1.1);   // late, the east's clouds face the low sun and take its rose
      const cloudSh = LK.snow ? pTop.clone().multiplyScalar(0.5) : lookId === 'night' ? pTop.clone().multiplyScalar(0.55) : pBot.clone().lerp(pTop, 0.5).multiplyScalar(day ? 0.62 : 0.7);
      const under = Math.min(1, 0.55 * gL / Math.max(lum(pTop), lum(pBot), lum(cloud)));   // the brightest thing in that sky is a little over half the glass
      pTop.multiplyScalar(under); pBot.multiplyScalar(under); cloud.multiplyScalar(under); cloudSh.multiplyScalar(under);   // (the glare round the sun is held under with it; the sun's own disc is not)
      // the far town stands the same all day; which way round it lies comes from a stream of its own
      const land = pBot.clone().lerp(pTop, 0.3).multiplyScalar(0.3), townAz = ctx.core.makeRng(ctx.core.hashSeed('the-striking-hour:r5-town:' + ctx.seed)).range(0, TAU);
      const sky = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 6.6), new THREE.ShaderMaterial({ vertexShader: PANE_VS, fragmentShader: PANE_FS,
        uniforms: { uTop: { value: pTop }, uBot: { value: pBot }, uStars: { value: LK.stars }, uTime, uSunDir: { value: SHAFT_D.clone().negate() },
          uSunCol: { value: new THREE.Color(LK.shaft[0]).multiplyScalar(LK.shaft[2] * 1.4) }, uSnow: { value: LK.snow }, uCloud: { value: cloud }, uCloudSh: { value: cloudSh },
          uCover: { value: LK.snow ? new THREE.Vector2(0.08, 0.3) : new THREE.Vector2(0.5, 0.72) }, uLand: { value: land }, uTownAz: { value: townAz }, uGlare: { value: 0.35 * under } } }));
      sky.matrixAutoUpdate = false; sky.matrix.makeBasis(RIGHTS[0], UP, V(-1, 0, 0)).setPosition(70.12, 54, -22); sky.matrixWorldNeedsUpdate = true; scene.add(sky); }
    // belfry louvres on four sides: one mesh
    { const gs = [];
      for (let i = 0; i < 4; i++) { const g = new THREE.PlaneGeometry(132, 50); g.applyMatrix4(new THREE.Matrix4().makeBasis(RIGHTS[i], UP, DIRS[i].clone().negate()).setPosition(DIRS[i].clone().multiplyScalar(70.2).setY(190))); gs.push(g); }
      const g = mergeGeometries(gs, false); for (const x of gs) x.dispose();
      const lv = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: UVQ_VS, fragmentShader: LOUVRE_FS,
        uniforms: { uSize: { value: new THREE.Vector2(132, 50) }, uSky: { value: new THREE.Color(LK.louvre[0]).multiplyScalar(LK.louvre[1]) }, uStone: { value: new THREE.Color('#3c434b').multiplyScalar(lookId === 'night' ? 0.4 : 1) }, uTime } }));
      lv.frustumCulled = false; scene.add(lv); }
    await ctx.yield();
    // the sun shaft from the open pane
    const shaftLen = SHAFT_O.y / -SHAFT_D.y;
    const shaftU = { uCol: { value: new THREE.Color(LK.shaft[0]).multiplyScalar(LK.shaft[2]) }, uTime, uLen: { value: shaftLen }, uEnd: { value: 0.28 }, uSoft: { value: 0 }, uAxis: { value: SHAFT_D.clone() } };
    { const g = new THREE.BoxGeometry(5.8, 5.8, shaftLen, 1, 1, 1); g.translate(0, 0, shaftLen / 2);
      const sU = new THREE.Vector3().crossVectors(SHAFT_D, UP).normalize(), sV = new THREE.Vector3().crossVectors(sU, SHAFT_D);
      const sh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: shaftU, vertexShader: SHAFT_VS, fragmentShader: SHAFT_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      sh.matrixAutoUpdate = false; sh.matrix.makeBasis(sV, sU, SHAFT_D).setPosition(SHAFT_O); sh.matrixWorldNeedsUpdate = true; sh.renderOrder = 3; sh.frustumCulled = false;
      sh.visible = LK.shaft[2] > 0;
      scene.add(sh); }
    // what the open pane lets in besides light: on a clear morning the dust that stands bright in the sun shaft, under overcast
    // the snow carried in on the draught. Its own stream; it drifts on the world's clock like everything that is not the machine.
    let driftU = null;
    if (LK.shaft[2] > 0.3 || LK.snow) {
      const dr = ctx.core.makeRng(ctx.core.hashSeed('the-striking-hour:r4-drift:' + ctx.seed)), snowIn = !!LK.snow, N = Math.round((snowIn ? 420 : 760) * detail), a = new Float32Array(N * 4);
      for (let i = 0; i < N * 4; i++) a[i] = dr();
      const D = snowIn ? V(-3.6, -2.4, 0.7).normalize() : SHAFT_D.clone(), sU = new THREE.Vector3().crossVectors(D, UP).normalize(), sV = new THREE.Vector3().crossVectors(sU, D);
      driftU = { uTime, uBufH: { value: 450 }, uO: { value: V(70, 54, -22) }, uD: { value: D }, uU: { value: sU }, uV: { value: sV },
        uP: { value: snowIn ? new THREE.Vector4(48, 2.6, 4.4, 7) : new THREE.Vector4(shaftLen, 2.75, 0.16, 0) }, uK: { value: snowIn ? new THREE.Vector2(0.26, 1.3) : new THREE.Vector2(0.11, 0) },
        uCol: { value: snowIn ? new THREE.Color('#e9eef4').multiplyScalar(0.5) : new THREE.Color(LK.shaft[0]).multiplyScalar(0.55 * LK.shaft[2]) } };
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3)); g.setAttribute('aS', new THREE.BufferAttribute(a, 4));
      const pm = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: driftU, vertexShader: DRIFT_VS, fragmentShader: BURST_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      pm.name = 'r4Drift'; pm.frustumCulled = false; pm.renderOrder = 4; scene.add(pm); }
    // daylight falling through the hatch: the same prism shader in the louvre colour, fading out below
    { const hl = 126, g = new THREE.BoxGeometry(2 * HH - 1.5, 2 * HH - 1.5, hl, 1, 1, 1); g.translate(0, 0, hl / 2);
      const hm = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(LK.louvre[0]).multiplyScalar(LK.louvre[1] * (lookId === 'night' ? 0.75 : 1.9)) }, uTime, uLen: { value: hl }, uEnd: { value: 0 }, uSoft: { value: HH - 0.75 }, uAxis: { value: V(0, -1, 0) } },
        vertexShader: SHAFT_VS, fragmentShader: SHAFT_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      hm.matrixAutoUpdate = false; hm.matrix.makeBasis(V(1, 0, 0), V(0, 0, 1), V(0, -1, 0)).setPosition(HX, 150, HZ); hm.matrixWorldNeedsUpdate = true; hm.renderOrder = 3; hm.frustumCulled = false;
      scene.add(hm); }
    const colU = { uTime, uBufH: { value: 450 }, uSince: { value: -1 }, uCol: { value: new THREE.Color(LK.louvre[0]).multiplyScalar(LK.louvre[1] * (lookId === 'night' ? 0.4 : 0.9)) } };
    { const cr = vr.fork('columnDust'), N = Math.round(2600 * detail), p = new Float32Array(N * 3), a = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { p[i * 3] = HX + cr.range(-1, 1) * (HH - 1); p[i * 3 + 1] = 46 + 104 * Math.sqrt(cr()); p[i * 3 + 2] = HZ + cr.range(-1, 1) * (HH - 1); a[i * 3] = cr(); a[i * 3 + 1] = cr(); a[i * 3 + 2] = cr(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aS', new THREE.BufferAttribute(a, 3));
      const pm = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: colU, vertexShader: COLDUST_VS, fragmentShader: BURST_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      pm.frustumCulled = false; pm.renderOrder = 4; scene.add(pm); }
    await ctx.yield();

    // ---------------------------------------------------------------- the going train (north bay), ticking
    const S = new Batch();                                       // everything static on and around the bed
    const ubox = cbox(1, 1, 1, 0.03); ubox.translate(0, 0.5, 0);
    const beam = (b, a, c, w, d, col) => add(b, ubox, along(a, c, w, d), col);
    const capL = lathe([[0, -1.0], [1.25, -1.0], [1.37, -0.85], [1.37, 0.85], [1.25, 1.0], [0, 1.0]], 24);
    // the side walls of an extruded plate are flat facets: average their normals at shared corners so a pinion leaf is a rounded
    // crown with a soft valley, not a stack of flat blocks. Caps and bevels keep their own normals.
    function smoothFlanks(g) {
      const P = g.attributes.position, N = g.attributes.normal, acc = new Map(), n = P.count;
      const key = (i) => Math.round(P.getX(i) * 500) + ',' + Math.round(P.getY(i) * 500) + ',' + Math.round(P.getZ(i) * 500);
      for (let i = 0; i < n; i++) { if (Math.abs(N.getZ(i)) > 0.2) continue; const k = key(i); let a = acc.get(k); if (!a) acc.set(k, a = [0, 0]); a[0] += N.getX(i); a[1] += N.getY(i); }
      for (let i = 0; i < n; i++) { if (Math.abs(N.getZ(i)) > 0.2) continue; const a = acc.get(key(i)), l = Math.hypot(a[0], a[1]); if (l > 1e-4) N.setXYZ(i, a[0] / l, a[1] / l, 0); }
      return g;
    }
    function bearing(x, z, y = 22) {
      add(S, cbox(3.6, 0.7, 2.2, 0.12), M(x, y - 1.65, z), paint); add(S, cbox(2.2, 1.2, 1.9, 0.2), M(x, y - 0.8, z), paint);
      add(S, capL, M(x, y, z, RX), paint);
    }
    async function wheel(o) {
      const B = new Batch(), t = o.thick || 1.1, rRoot = o.R - o.depth, r2 = rRoot - o.rimW;
      const plateCol = (x, y, zz, out) => { const r = Math.hypot(x, y), tip = ss((r - (rRoot - 0.2)) / Math.max(o.depth, 0.5));
        const root = r > rRoot - 0.3 ? 1 - tip : 0;
        out.copy(cBrass).multiplyScalar(0.92 + 0.22 * tip - 0.42 * root); out.metal = 1; out.rough = 0.3 - 0.17 * tip + 0.25 * root; };
      B.add(gearPlate({ R: o.R, teeth: o.teeth, depth: o.depth, thick: t, spokes: o.spokes, hubR: o.hubR, rimW: o.rimW, spokeW: o.spokeW || 1.3 }), M(0, 0, o.z), plateCol);
      await ctx.yield();
      const rib = lathe([[rRoot - 0.25, t / 2 - 0.02], [rRoot - 0.45, t / 2 + 0.2], [r2 + 0.5, t / 2 + 0.2], [r2 + 0.2, t / 2 - 0.02]], 56);
      add(B, rib, M(0, 0, o.z, RX), brassPol); add(B, rib, M(0, 0, o.z, -RX), brassPol);
      const h = o.hubR;
      add(B, lathe([[0, -1.5], [1.2, -1.5], [1.45, -1.25], [1.45, -0.95], [h * 0.7, -0.85], [h * 0.93, -0.58], [h * 0.93, 0.58], [h * 0.7, 0.85], [1.45, 0.95], [1.45, 1.25], [1.2, 1.5], [0, 1.5]], 32), M(0, 0, o.z, RX), brass);
      add(B, gRod(0.62, o.z1 - o.z0 + 2.9, 10, 0.12), M(0, 0, o.z0 - 1.45, RX), steel);
      if (o.pinion) { const pR = o.pinion.R, pd = Math.min(1.5, pR * 0.42), pz = o.pinion.z;
        // a pinion passes at arm's length: rounded, bevelled leaves, polished where they work and dark with oil at the root, shrouds at both ends
        B.add(smoothFlanks(gearPlate({ R: pR, teeth: o.pinion.leaves, depth: pd, thick: 2.6, spokes: 0, hubR: 0, rimW: 0, bevel: Math.min(0.34, pR * 0.045), leaf: true })), M(0, 0, pz), (x, y, zz, out) => {
          const r = Math.hypot(x, y), a = Math.atan2(y, x), tip = ss((r - (pR - pd)) / pd), wearN = 0.5 + 0.5 * Math.sin(a * 3 + zz * 2.3) * Math.sin(zz * 5.1 + a * 7), streak = ss(1 - Math.abs(zz - 0.35 * Math.sin(a * 2)) / 0.5);
          out.copy(cSteel).multiplyScalar((0.35 + 1.05 * tip) * (0.9 + 0.2 * wearN) * (1 - 0.3 * streak * (1 - tip))); out.metal = 1; out.rough = Math.max(0.07, 0.5 - 0.42 * tip + 0.1 * wearN - 0.2 * streak); });
        await ctx.yield();
        const shroud = lathe([[0.6, 0], [pR - pd * 0.45, 0], [pR - pd * 0.45, 0.22], [pR - pd * 0.45 - 0.25, 0.4], [1.6, 0.4], [1.45, 0.62], [0.6, 0.62]], 28);
        for (const sgn of [-1, 1]) add(B, shroud, M(0, 0, pz + sgn * 1.3, sgn * RX), steel);
        for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; for (const sgn of [-1, 1]) add(B, lathe([[0, 0], [0.2, 0], [0.24, 0.06], [0.2, 0.16], [0, 0.18]], 6), M(Math.cos(a) * (pR - pd) * 0.6, Math.sin(a) * (pR - pd) * 0.6, pz + sgn * 1.7, sgn * RX), brassDull); } }
      if (o.barrel) { const [b0, b1, br] = o.barrel, bl = b1 - b0, prof = [[0, 0], [br + 0.9, 0], [br + 0.9, 0.35], [br, 0.5]], nc = Math.floor((bl - 1.0) / 0.4);
        for (let i = 0; i < nc; i++) { const y = 0.5 + i * 0.4; prof.push([br, y + 0.04], [br + 0.2, y + 0.2], [br, y + 0.36]); }
        prof.push([br, bl - 0.5], [br + 0.9, bl - 0.35], [br + 0.9, bl], [0, bl]);
        B.add(lathe(prof, 40), M(0, 0, b0, RX), (x, y, z, out) => { const rope = y > 0.45 && y < bl - 0.45 && Math.hypot(x, z) > br - 0.05;
          if (rope) { out.set('#7d7a6c'); out.metal = 0; out.rough = 0.86; } else { out.copy(cBrass).multiplyScalar(1.05); out.metal = 1; out.rough = 0.16; } }); }
      await ctx.yield();
      const m = B.mesh(mat, o.name); m.position.set(o.x, 22, 0); scene.add(m);
      bearing(o.x, o.z0); bearing(o.x, o.z1);
      await ctx.yield();
      return m;
    }
    const going = [];
    going.push(await wheel({ name: 'escape', x: GT[0].x, R: 15, z: GT[0].z, teeth: 30, depth: 3.0, spokes: 5, hubR: 2.6, rimW: 1.3, spokeW: 1.1, z0: -20, z1: -6, pinion: { z: -11.5, R: 6, leaves: 12 } }));
    going.push(await wheel({ name: 'third', x: GT[1].x, R: 17, z: GT[1].z, teeth: 80, depth: 1.2, spokes: 6, hubR: 3, rimW: 2.0, z0: -20, z1: -6, pinion: { z: -15.5, R: 5, leaves: 10 } }));
    await ctx.yield();
    going.push(await wheel({ name: 'centre', x: GT[2].x, R: 19, z: GT[2].z, teeth: 88, depth: 1.25, spokes: 6, hubR: 3.2, rimW: 2.2, z0: -20, z1: -6, pinion: { z: -11.5, R: 4, leaves: 8 } }));
    await ctx.yield();
    going.push(await wheel({ name: 'goingGreat', x: GT[3].x, R: 20, z: GT[3].z, teeth: 96, depth: 1.3, spokes: 6, hubR: 3.6, rimW: 2.4, z0: -20, z1: -6, barrel: [-19.2, -13.6, 4.6] }));
    const goingStep = [TAU / 30, -TAU / 160, TAU / 264, -TAU / 480];
    await ctx.yield();
    // anchor and pendulum on one arbor at y 46 above the escape wheel
    const AX = GT[0].x, AY = 46, D2R = Math.PI / 180;
    const anchor = (() => {
      const B = new Batch(), sh = new THREE.Shape(), P = (R, a) => new THREE.Vector2(R * Math.sin(a * D2R), -24 + R * Math.cos(a * D2R)), pp = [];
      for (let a = -46; a <= 46.01; a += 4) pp.push(P(18.6, a));
      pp.push(P(14.1, 46), P(16.2, 40.5));
      for (let a = 38; a >= -38.01; a -= 4) pp.push(P(16.2, a));
      pp.push(P(16.2, -40.5), P(14.1, -46));
      sh.setFromPoints(pp);
      // the arc is a forged bridge, not a slab: eight windows are cut through it between webs, so the room is seen past it from
      // the crown of the escape wheel, 2.5 m off its face
      for (let k = 0; k < 8; k++) { const a0 = -35.5 + k * 9, h = [];
        for (let i = 0; i <= 3; i++) h.push(P(18.2, a0 + i * 7 / 3));
        for (let i = 3; i >= 0; i--) h.push(P(16.6, a0 + i * 7 / 3));
        sh.holes.push(new THREE.Path(h)); }
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.7, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelOffset: -0.1, bevelSegments: 1, steps: 1, curveSegments: 1 });
      g.translate(0, 0, GT[0].z - 0.35);
      // the whole plate is draw-filed: a soft pale grey-blue in the dials' light (one finish, faces and window walls alike)
      B.add(g, null, (x, y, z, out) => { out.copy(cSteel).multiplyScalar(1.8); out.metal = 0.55; out.rough = 0.45; });
      add(B, cbox(1.9, 7.6, 0.9, 0.12), M(0, -2.9, GT[0].z), steel);
      add(B, lathe([[0, -1], [1.7, -1], [1.9, -0.8], [1.9, 0.8], [1.7, 1], [0, 1]], 16), M(0, 0, GT[0].z, RX), steel);
      add(B, gRod(0.55, PEND_Z * -1 - 3, 10, 0.1), M(0, 0, PEND_Z - 1, RX), steelDark);
      const m = B.mesh(mat, 'anchor'); m.position.set(AX, AY, 0); scene.add(m); return m;
    })();
    await ctx.yield();
    const PEND_L = 54;
    const pendulum = (() => {
      const B = new Batch();
      add(B, cbox(0.7, PEND_L + 5, 0.45, 0.08), M(0, -(PEND_L + 5) / 2 + 0.5, 0), C('#77705f', 0, 0.7));
      add(B, cbox(2.0, 1.6, 1.2, 0.15), M(0, 0, 0), steel);
      add(B, lathe([[0, -1.35], [3.2, -1.1], [5.2, -0.55], [6, 0], [5.2, 0.55], [3.2, 1.1], [0, 1.35]], 28, true), M(0, -PEND_L, 0, RX), C('#4d5258', 1, 0.45));
      add(B, lathe([[0, 0], [1.1, 0], [1.1, 0.7], [0, 0.7]], 6), M(0, -PEND_L - 7.2, 0), brassDull);
      const m = B.mesh(mat, 'pendulum'); m.position.set(AX, AY, PEND_Z); scene.add(m); return m;
    })();
    await ctx.yield();
    for (const z of [-20, -6]) {      // A-frame standards carrying the anchor arbor
      for (const s of [-1, 1]) beam(S, V(AX + s * 4.6, 20.2, z), V(AX + s * 0.5, AY + 0.4, z), 0.66, 1.1, blackIron);
      add(S, cbox(11.5, 0.6, 2.4, 0.1), M(AX, 20.3, z), paint); add(S, cbox(5.0, 0.5, 0.9, 0.1), M(AX, 33, z), blackIron);
      add(S, capL, M(AX, AY, z, RX, 0, 0, 0.8), blackIron);
    }
    // going weight on its line off the barrel
    const goingWeight = (() => {
      const B = new Batch();
      add(B, lathe([[0, 0], [1.9, 0], [2.1, 0.3], [2.1, 5.6], [1.6, 6.2], [0.5, 6.4], [0, 6.4]], 14), M(0, -6.4, 0), C('#3b4046', 1, 0.6));
      add(B, gRod(0.25, 14.5, 6), M(0, 0, 0), C('#8a8474', 0, 0.9));
      const m = B.mesh(mat, 'goingWeight'); m.position.set(GT[3].x + 4.6, 9, -16.4); scene.add(m); return m;
    })();
    await ctx.yield();

    await ctx.yield();
    // ---------------------------------------------------------------- leading-off work: rod up to the bevel cluster, four rods to the dials
    const CL = V(0, 75, -8);
    const bevel = gearPlate({ R: 2.5, teeth: 18, depth: 0.7, thick: 0.9, spokes: 4, hubR: 0.9, rimW: 0.5, spokeW: 0.5, bevel: 0.08 });
    const leadRod = (len, withBevelAt) => {
      const B = new Batch();
      add(B, gRod(0.36, len, 8), null, steel);
      add(B, bevel, M(0, withBevelAt, 0, RX), brassHi);
      for (let y = 9; y < len - 4; y += 13) { add(B, cbox(1.9, 0.55, 0.55, 0.08), M(0, y, 0), brassHi); add(B, lathe([[0.36, 0], [0.62, 0.08], [0.62, 0.5], [0.36, 0.58]], 10), M(0, y + 0.45, 0), brassHi); add(B, lathe([[0.36, 0], [0.7, 0], [0.7, 1.4], [0.36, 1.4]], 8), M(0, y - 0.7, 0), steelDark); }
      return B.mesh(mat, 'leadRod');
    };
    const rods = [];
    { const v = leadRod(CL.y - 23 - 2.2, CL.y - 23 - 2.6); v.position.set(CL.x, 23, CL.z); scene.add(v); rods.push({ m: v, q: new THREE.Quaternion(), k: 1 });
      for (let i = 0; i < 4; i++) {
        const end = DIRS[i].clone().multiplyScalar(68.6).setY(75), d = end.clone().sub(CL), len = d.length();
        const m = leadRod(len - 0.6, 2.6); m.position.copy(CL).addScaledVector(d.normalize(), 0.6); scene.add(m);
        rods.push({ m, q: new THREE.Quaternion().setFromUnitVectors(UP, d), k: i % 2 ? -1 : 1 });
        await ctx.yield();
      }
      add(S, cbox(3.2, 3.0, 3.2, 0.25), M(CL.x, 21.5, CL.z), paint);
      add(S, cbox(1.5, 1.5, 1.5, 0.2), M(CL.x, CL.y, CL.z), paint);
      add(S, gRod(0.26, 146.5 - 77.4, 8), M(CL.x, 77.4, CL.z - 15), blackIron);
      beam(S, V(CL.x, 77.9, CL.z - 15.3), V(CL.x, 76.3, CL.z - 0.4), 0.5, 0.5, paint); }

    await ctx.yield();
    // ---------------------------------------------------------------- the chime train (south bay), idle unless the rare event runs it
    const CH = [{ x: -32, R: 10, z: 12.5, teeth: 56 }, { x: -16.5, R: 7.5, z: 16, teeth: 44 }, { x: -2, R: 8.5, z: 12.5, teeth: 48 }, { x: 11, R: 5, z: 16, teeth: 30 }];
    const chime = [];
    for (let i = 0; i < CH.length; i++) { const c = CH[i];
      chime.push(await wheel({ name: 'chime' + i, x: c.x, R: c.R, z: c.z, teeth: c.teeth, depth: 1.0, spokes: i === 3 ? 4 : 5, hubR: 2, rimW: 1.2, spokeW: 0.9, thick: 0.9, z0: 8, z1: 20,
        pinion: { z: c.z > 14 ? 12.5 : 16, R: 2.2, leaves: 8 } }));
      await ctx.yield(); }
    const chimeRate = [0.25, -0.5, 0.9, -2.2];
    const BAR_X = 21, PIV_X = 33, PIV_Y = 26.4;
    const chimeBarrel = (() => {
      const B = new Batch();
      add(B, lathe([[0, 0], [3.4, 0], [3.4, 0.4], [3, 0.5], [3, 8.5], [3.4, 8.6], [3.4, 9], [0, 9]], 24), M(0, 0, 9.5, RX), brassDull);
      add(B, gRod(0.6, 14.9, 8), M(0, 0, 6.55, RX), steel);
      for (let k = 0; k < 8; k++) for (let j = 0; j < 4; j++) { const a = ((k * 3) % 8) / 8 * TAU / 4 + j * TAU / 4; add(B, cbox(0.9, 0.35, 0.35, 0.05), M(Math.cos(a) * 3.3, Math.sin(a) * 3.3, 10.4 + k * 1.03, 0, 0, a), steelPol); }
      const m = B.mesh(mat, 'chimeBarrel'); m.position.set(BAR_X, 22, 0); scene.add(m); bearing(BAR_X, 8); bearing(BAR_X, 20); return m;
    })();
    await ctx.yield();
    const chimeLevers = [];
    for (let k = 0; k < 8; k++) {
      const B = new Batch();
      add(B, cbox(13.6, 0.55, 0.42, 0.08), M(-3.3, 0, 0), steel);
      add(B, cbox(1.8, 0.8, 0.5, 0.1), M(-9.6, -0.1, 0), red);
      add(B, lathe([[0, -0.3], [0.7, -0.3], [0.7, 0.3], [0, 0.3]], 10), M(0, 0, 0, RX), brassDull);
      const m = B.mesh(mat, 'chimeLever'); m.position.set(PIV_X, PIV_Y, 10.4 + k * 1.03); m.rotation.z = -0.04; scene.add(m); chimeLevers.push(m);
    }
    add(S, gRod(0.4, 10.4, 8), M(PIV_X, PIV_Y, 9.2, RX), steelDark);
    for (const z of [8.6, 19.4]) { beam(S, V(PIV_X, 20.1, z), V(PIV_X, PIV_Y + 0.6, z), 1.2, 0.8, paint); add(S, cbox(3.4, 0.5, 2, 0.1), M(PIV_X, 20.25, z), paint); }
    await ctx.yield();

    // ---------------------------------------------------------------- hints of people: gantry, ladder; roosting birds; cobwebs
    for (const z of [24.3, 25.5, 26.7]) add(S, cbox(102, 0.35, 1.08, 0.05), M(0, 19.2, z), boards[(z * 10 | 0) % 3]);
    for (let x = -50; x <= 50.1; x += 10) {
      add(S, cbox(0.5, 0.6, 7.6, 0.08), M(x, 18.75, 23.8), iron);
      add(S, gRod(0.17, 3.6, 6), M(x, 19.3, 27.1), iron);
      beam(S, V(x, 16.4, 21.4), V(x, 18.5, 26.6), 0.35, 0.35, iron);
    }
    for (const y of [22.8, 21.1]) add(S, gRod(y > 22 ? 0.2 : 0.13, 102, 6), M(-51, y, 27.1, 0, 0, -RX), y > 22 ? brassDull : iron);
    for (const dx of [-0.85, 0.85]) beam(S, V(51.5 + dx, 0, 28.6), V(51.5 + dx, 21.2, 26.2), 0.3, 0.3, iron);
    for (let k = 1; k < 20; k++) { const t = k / 20; add(S, gRod(0.13, 1.7, 5), M(50.65, t * 21.2, 28.6 - t * 2.4, 0, 0, -RX), iron); }
    await ctx.yield();
    // feathers and straw in one corner of the bed
    { const fr = rng.fork('straw');
      for (let k = 0; k < 46; k++) { const x = 49 + fr.range(-3.5, 3.5), z = -3 + fr.range(-6, 6), feather = k % 4 === 0;
        add(S, cbox(feather ? 2.2 : fr.range(1.5, 3.2), 0.05, feather ? 0.5 : 0.07, 0.01), M(x, 20.06 + 0.03 * (k % 5), z, 0, fr.range(0, TAU), fr.range(-0.08, 0.08)), feather ? C('#b9c0c8', 0, 0.9) : C('#8f8358', 0, 0.9)); } }
    finish(S, 'static');
    await ctx.yield();
    // hanging from the joists: the unlit oil lamp beside the climb and a winding tackle; both sway a little
    const hang = (name, x, y, z, fill) => { const B = new Batch(); fill(B); const m = B.mesh(mat, name); m.position.set(x, y, z); scene.add(m); return m; };
    const rope = C('#8a8474', 0, 0.86);
    const lamp = hang('lamp', -18, 142.6, HZ - 19, (B) => {
      for (const s of [-1, 1]) { add(B, gRod(0.1, 1, 6, 0.005), along(V(0, 0, 0), V(s * 1.3, -9.2, 0)), iron); add(B, gRod(0.08, 1, 6, 0.005), along(V(s * 1.3, -9.2, 0), V(s * 2.25, -17.2, 0)), iron); }
      add(B, lathe([[0, -0.6], [0.45, -0.6], [0.45, 0], [0, 0]], 8), null, iron);
      add(B, lathe([[3.7, -10.9], [3.8, -10.7], [0.6, -9.0], [0.4, -8.6], [0, -8.6]], 24), null, paint);
      add(B, lathe([[0, -9.05], [0.6, -9.2], [3.7, -10.9]], 24), null, C('#c9d0d6', 0, 0.5));     // enamelled underside of the shade
      add(B, lathe([[0.95, -15.0], [1.35, -13.6], [1.0, -11.4], [0.7, -9.6]], 16, true), null, C('#aeb9c4', 1, 0.08));
      add(B, lathe([[0, -15.6], [1.1, -15.6], [1.1, -15.0], [0, -15.0]], 14), null, brassDull);
      add(B, lathe([[0, -18.4], [1.7, -18.4], [2.3, -17.6], [2.3, -16.8], [1.2, -15.6], [0, -15.6]], 24, true), null, brassPol);
    });
    const tackleFill = (D, col) => (B) => {
      const sheave = lathe([[0, -0.3], [1.9, -0.3], [1.6, 0], [1.9, 0.3], [0, 0.3]], 24);
      for (const y of [-2.8, -D - 2.8]) { add(B, sheave, M(0, y, 0, RX), col); for (const s of [-1, 1]) add(B, cbox(2.0, 5.2, 0.16, 0.05), M(0, y, s * 0.5), iron); add(B, gRod(0.2, 1.3, 6), M(0, y, -0.65, RX), brassHi); }
      add(B, gRod(0.16, 2.8, 6), M(0, -2.8, 0), iron);
      for (const s of [-1, 1]) add(B, gRod(0.2, D, 6, 0.01), M(s * 1.8, -D - 2.8, 0), rope);
      add(B, lathe([[1.3, -0.25], [1.65, 0], [1.3, 0.25], [0.95, 0], [1.3, -0.25]], 14, false, Math.PI * 1.5), M(0, -D - 6.7, 0, RX), steelDark);   // the hook
      add(B, gRod(0.2, 2.0, 6), M(0, -D - 5.4, 0), steelDark);
      add(B, lathe([[0, -1.6], [1.5, -1.6], [1.7, -1.3], [1.7, 0.9], [1.2, 1.5], [0, 1.6]], 12), M(0, -D - 9.4, 0), C('#3b4046', 1, 0.6));        // a counterweight on the hook
    };
    // two more beside the climb, hanging in the hatch's light: (x, z) on joists, 6 m and 21 m north of the wire's line, clear of the sight line to the bell
    const tackle2 = hang('tackle2', -30, 142.6, -2, tackleFill(46, brassHi));
    await ctx.yield();
    const tackle3 = hang('tackle3', 6, 142.6, -17, tackleFill(27, brassHi));
    await ctx.yield();
    const tackle = hang('tackle', -18, 142.6, 30, (B) => {
      const sheave = lathe([[0, -0.25], [1.3, -0.25], [1.1, 0], [1.3, 0.25], [0, 0.25]], 24);
      for (const y of [-2.4, -108.4]) { add(B, sheave, M(0, y, 0, RX), brassDull); for (const s of [-1, 1]) add(B, cbox(1.5, 3.8, 0.14, 0.05), M(0, y, s * 0.42), iron); add(B, gRod(0.16, 1.1, 6), M(0, y, -0.55, RX), steelDark); }
      add(B, gRod(0.14, 2.4, 6), M(0, -2.4, 0), iron);
      for (const s of [-1, 1]) add(B, gRod(0.2, 106, 6, 0.01), M(s * 1.25, -108.4, 0), rope);
      add(B, lathe([[1.0, -0.2], [1.3, 0], [1.0, 0.2], [0.75, 0], [1.0, -0.2]], 14, false, Math.PI * 1.5), M(0, -111.4, 0, RX), steelDark);   // the hook
      add(B, gRod(0.16, 1.4, 6), M(0, -110.4, 0), steelDark);
    });
    await ctx.yield();

    const jack = cast === 'jackdaws';
    const matRoost = hero.makeMaterial();                         // its own uFade: the roost lifts and dissolves under the burst flock's wings
    const roost = (() => {
      const B = new Batch(), pr = rng.fork('roost');
      const body = lathe([[0, -2.3], [0.5, -2.0], [1.0, -1.0], [1.15, 0.2], [0.95, 1.3], [0.5, 2.0], [0, 2.2]], 9, true);
      const head = lathe([[0, -0.62], [0.45, -0.42], [0.62, 0], [0.45, 0.42], [0, 0.62]], 8, true);
      const cB = jack ? C('#23252c', 0, 0.6) : C('#7f8a96', 0, 0.7), cH = jack ? C('#3a3d46', 0, 0.6) : C('#4b5e5c', 0.3, 0.45), cT = jack ? C('#17181d', 0, 0.6) : C('#3b424b', 0, 0.7);
      const spots = [];
      for (let k = 0; k < 6; k++) spots.push([pr.range(-44, 46), 20, 20 + pr.range(-0.4, 0.4)], [pr.range(-48, 48), 23.0, 27.1]);
      spots.push([54, 20, pr.range(-12, -5)], [54, 20, pr.range(8, 15)], [-54, 20, pr.range(-3, 3)], [pr.range(30, 44), 20, 8], [pr.range(-40, -30), 20, -20.3], [20, 20, -20.2]);
      const n = Math.max(4, Math.round((cast === 'owl' ? 5 : 11) * density));
      for (let k = 0; k < Math.min(n, spots.length); k++) {
        const [x, y, z] = spots[k], sc = (jack ? 0.72 : 1) * pr.range(0.85, 1.1), yaw = pr.range(0, TAU);
        const base = M(x, y + 1.25 * sc, z, 0, yaw, 0, sc);
        add(B, body, base.clone().multiply(M(0, 0, 0, 0, 0, -1.05)), cB);
        add(B, head, base.clone().multiply(M(1.75, 1.45, 0)), cH);
        add(B, cbox(0.5, 0.16, 0.2, 0.03), base.clone().multiply(M(2.45, 1.4, 0)), C('#2a2622', 0, 0.5));
        add(B, cbox(2.4, 0.18, 1.3, 0.05), base.clone().multiply(M(-2.5, -0.7, 0, 0, 0, 0.5)), cT);
      }
      const m = B.mesh(matRoost, 'roost'); scene.add(m); return m;
    })();
    const webU = { uTime, uShiver: { value: 0 }, uCol: { value: dialCols[2].clone().lerp(dialCols[0], 0.5).multiplyScalar(0.55) } };
    { const gs = [], W = [[-24, 31.5, 14.2, 10, 0, 0.2], [-9.5, 30, 14.3, 9, 0.1, -0.15], [4.5, 28.5, 14.2, 7.5, -0.1, 0.1], [15.5, 26, 13, 7, 0.5, 0.3], [-40.5, 27, 13.5, 8, 0.3, -0.2],
        [HX - 13.2, 146.5, HZ - 13.2, 8, 0.78, 0.1], [HX + 13.2, 146.2, HZ - 13.2, 7, -0.78, 0], [HX + 22, 145.4, HZ + 4, 8.5, 0, 0.1], [HX - 25.5, 145.4, HZ - 9, 8.5, 0.1, -0.1], [HX - 13, 146.4, HZ + 13.4, 7.5, -0.78, 0.05],
        // sheets slung between the gantry hangers and the joists beside the climb
        [-12, 136.6, 19.4, 11.5, 0, 0.12], [12, 136.8, 19.4, 11, 0, -0.1], [36, 136.6, 19.4, 11.5, 0, 0.06], [-36, 136.4, 23.4, 10.5, 0, -0.08], [-15, 130.2, -36, 11.5, 1.571, 0.1], [-19, 130, -54, 10.5, 1.571, -0.1],
        [HX + 4, 141.5, HZ - 17.5, 9, 0.2, -0.25]];
      for (const [x, y, z, sc, ry, rz] of W) { const g = new THREE.PlaneGeometry(1, 1, 6, 6); g.applyMatrix4(M(x, y, z, 0, ry, rz, sc)); gs.push(g); }
      const g = mergeGeometries(gs, false); for (const x of gs) x.dispose();
      const web = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: webU, vertexShader: WEB_VS, fragmentShader: WEB_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, premultipliedAlpha: true,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor }));
      web.renderOrder = 2; web.frustumCulled = false; scene.add(web); }
    // dust that sifts off the beams at each blow
    const burstU = { uSince: { value: -1 }, uBufH: { value: 450 }, uCol: { value: new THREE.Color(LK.amb[0]).lerp(new THREE.Color('#ffffff'), 0.4).multiplyScalar(lookId === 'night' ? 0.16 : 0.36) } };
    { const br = rng.fork('burst'), N = Math.round(2400 * detail), p = new Float32Array(N * 3), a = new Float32Array(N * 2);
      for (let i = 0; i < N; i++) { const k = i % 10 < 3 ? 4 : i % 4; let x, y, z;
        if (k === 4) { x = br.pick([-18, -6, 30, 42, 6, 18]) + br.range(-0.8, 0.8); y = 142.5; z = HZ + br.range(-34, 34); if (Math.abs(x - HX) < HH && Math.abs(z - HZ) < HH + 1) z = HZ + (HH + 1 + br.range(0, 14)) * (z > HZ ? 1 : -1); }
        else if (k === 0) { x = br.range(-55, 55); y = br.range(16, 20); z = br.pick([-20, -6, 8, 20]) + br.range(-1.3, 1.3); }
        else if (k === 1) { x = -66 + 12 * br.int(0, 11) + br.range(-0.8, 0.8); y = 145; z = br.range(-68, 68); if (Math.abs(x - HX) < HH && Math.abs(z - HZ) < HH) z = HZ + (HH + br.range(0, 3)) * (br.chance(0.5) ? 1 : -1); }
        else if (k === 2) { const s = br.chance(0.5) ? 1 : -1; if (br.chance(0.5)) { x = BX + s * FR; z = BZ + br.range(-FR, FR); } else { z = BZ + s * FR; x = BX + br.range(-FR, FR); } y = 225; }
        else { const s = br.chance(0.5) ? 1 : -1; if (br.chance(0.5)) { x = HX + s * (HH + 1); z = HZ + br.range(-HH, HH); } else { z = HZ + s * (HH + 1); x = HX + br.range(-HH, HH); } y = 146.5; }
        p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; a[i * 2] = br(); a[i * 2 + 1] = br(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aS', new THREE.BufferAttribute(a, 2));
      const pm = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: burstU, vertexShader: BURST_VS, fragmentShader: BURST_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      pm.frustumCulled = false; pm.renderOrder = 4; scene.add(pm); }
    await ctx.yield();
    // quarter-bell hammers (they only swing in the rare chime)
    const qHammers = QB.map((b) => {
      const B = new Batch();
      add(B, cbox(5.2, 0.5, 0.5, 0.08), M(2.3, 0, 0), steel); add(B, cbox(1.3, 1.5, 1.3, 0.2), M(4.9, -0.2, 0), iron); add(B, cbox(1.34, 0.4, 1.34, 0.05), M(4.9, 0.1, 0), red);
      add(B, lathe([[0, -0.5], [0.5, -0.5], [0.5, 0.5], [0, 0.5]], 8), M(0, 0, 0, RX), steelDark);
      const m = B.mesh(mat, 'quarterHammer'), g = new THREE.Group();
      g.position.set(b.x + b.sx * 6.6, b.y + 1.4, b.z + b.sz * 6.6); g.rotation.y = Math.atan2(b.sz, -b.sx); g.add(m); m.rotation.z = 0.32; scene.add(g);
      return m;
    });
    await ctx.yield();

    // ---------------------------------------------------------------- the oiler's cradle, built round the eye (ride space: -Z ahead, +Y up)
    const rig = new THREE.Group(); rig.matrixAutoUpdate = false; rig.visible = false; scene.add(rig);
    const RIG_Y = -0.14, CLIP_PARK = 0.5, RIG_LIFT = 0.04, RIG_TILT = 0.03;                        // the rail sits low in the frame; the clip waits outside its right edge
    let clipRig = null;
    const drop = (() => {
      const B = new Batch(), oil = C('#7a6a3a', 1, 0.12), panCol = C(cBrass, 1, 0.3, 0.42);
      add(B, gRod(0.05, 2.5, 10, 0.02), M(-1.25, -0.78, -1.55, 0, 0, -RX), brassPol);                     // rolled rail across the lower frame
      for (const s of [-1, 1]) { beam(B, V(s * 1.25, -0.78, -1.55), V(s * 1.32, -0.82, -0.2), 0.09, 0.09, brassPol); add(B, lathe([[0, -0.07], [0.07, -0.04], [0.07, 0.04], [0, 0.07]], 8), M(s * 1.25, -0.78, -1.55), brassPol); }
      add(B, cbox(2.5, 0.03, 1.5, 0.01), M(0, -1.08, -0.85), panCol); add(B, cbox(2.5, 0.3, 0.03, 0.01), M(0, -0.94, -1.58), panCol);
      for (const x of [-0.6, 0, 0.6]) add(B, lathe([[0, 0], [0.035, 0], [0.035, 0.03], [0, 0.045]], 6), M(x, -0.86, -1.565, RX), steelDark);
      // oil can lashed at lower left, long spout forward
      add(B, lathe([[0, 0], [0.17, 0], [0.18, 0.03], [0.18, 0.2], [0.06, 0.34], [0.04, 0.4], [0, 0.4]], 12), M(-1.36, -1.02, -1.5), brass);
      beam(B, V(-1.36, -0.63, -1.5), V(-1.08, -0.5, -1.92), 0.03, 0.03, brassPol);
      beam(B, V(-1.08, -0.5, -1.92), V(-1.06, -0.54, -1.95), 0.026, 0.026, brassPol);
      add(B, lathe([[0.185, 0], [0.2, 0], [0.2, 0.05], [0.185, 0.05]], 12), M(-1.36, -0.9, -1.5), C('#6b5a44', 0, 0.9));
      // steel bracket rising outside the right edge of the frame to a sprung clip in its top corner
      // (it is its own mesh: it waits outside the frame and swings in when it takes a rim, and to grip the hammer wire)
      const K = new Batch();
      beam(K, V(1.34, -0.84, -1.0), V(1.9, 0.72, -1.8), 0.04, 0.03, steel);
      beam(K, V(1.9, 0.72, -1.8), V(1.52, 0.93, -1.82), 0.035, 0.03, steel);
      for (const s of [-1, 1]) { add(K, cbox(0.02, 0.2, 0.2, 0.006), M(1.75 + s * 0.255, 0.96, -1.82), steelPol);
        for (const z of [-1.99, -1.65]) add(K, lathe([[0, -0.07], [0.04, -0.07], [0.05, -0.055], [0.05, 0.055], [0.04, 0.07], [0, 0.07]], 12), M(1.75 + s * 0.26, 0.96, z), brassPol); }
      for (let k = 0; k < 9; k++) { const t = 0.12 + 0.76 * k / 8;                                   // the coil spring along the arm
        add(K, lathe([[0.026, -0.006], [0.042, -0.006], [0.042, 0.006], [0.026, 0.006], [0.026, -0.006]], 8), M(1.9 - 0.38 * t, 0.72 + 0.21 * t, -1.8 - 0.02 * t, 0, 0, 1.07 + 0.25 * (k % 2 ? 1 : -1) * 0.3), steelPol); }
      add(K, lathe([[0, 0], [0.016, 0], [0.016, 0.2], [0, 0.2]], 6), M(1.5, 0.86, -1.74, 0, 0, RX * 0.7), red);                 // thumb lever
      clipRig = K.mesh(matRig, 'cradleClip'); clipRig.position.x = CLIP_PARK; rig.add(clipRig);
      const cradle = B.mesh(matRig, 'cradle'); cradle.position.y = RIG_Y; rig.add(cradle);
      const D = new Batch(); add(D, lathe([[0, -0.03], [0.022, -0.016], [0.026, 0.004], [0.012, 0.03], [0, 0.045]], 8, true), null, oil);
      const d = D.mesh(matRig, 'oilDrop'); rig.add(d); return d;
    })();
    const DROP0 = V(-1.06, -0.56 + RIG_Y, -1.95);
    await ctx.yield();

    // ---------------------------------------------------------------- the living things
    const hx = (c) => '#' + c.getHexString();
    const keyCol = dialCols[LK.sunDial].clone(); { const m = Math.max(keyCol.r, keyCol.g, keyCol.b, 1); keyCol.multiplyScalar(1 / m); }
    const kL = lookId === 'night' ? 0.34 : lookId === 'late' ? 0.8 : 1;
    const faunaLight = { sunDir: DIRS[LK.sunDial].clone().setY(0.25).normalize().toArray(), sunColor: hx(keyCol), sunIntensity: 1.1 * kL, sky: hx(new THREE.Color(LK.amb[0])), skyIntensity: 0.95 * kL,
      ground: '#48525e', groundIntensity: 0.55 * kL };
    const fauna = F.makeFauna(scene, { light: faunaLight, rng: rng.fork('fauna') });
    const fr = rng.fork('birds');
    const PIGEON = { species: 'gulls', size: 6, flap: 3.4, glide: 0.3, body: '#8892a0', belly: '#a7b0bb', wingC: '#6d7989', trail: '#59636f', tip: '#2b3038', head: '#586a70', beak: '#c9b3a0' };
    const DAW = { species: 'crows', size: 5.2, body: '#25262e', belly: '#32343e', wingC: '#22232b', head: '#4a4d58', beak: '#18181c' };
    const BIRD = jack ? DAW : PIGEON;
    const loopY = fr.range(86, 104);
    fauna.add(F.makeFlock({ rng: fr, ...BIRD, count: Math.max(2, Math.round((jack ? 6 : 3) * density)), speed: 13, spread: [10, 7, 34], wander: [3, 2, 3, 0.25],
      route: [[44, loopY, -40], [-36, loopY + 12, -46], [-48, loopY - 6, 30], [28, loopY + 6, 44]], closed: true, start: fr() }));
    // (the clear air round the line, 14 Oct: this pair's scatter dealt a gull 0.83 m from the flown line, and a crossing is keyed to the camera,
    // so that pass came on every visit. The crossing stays where it was laid; the kit holds off a bird that comes too near.)
    fauna.add(F.makeFlock({ rng: fr, ...BIRD, count: 2, speed: 14, spread: [8, 4, 16], cross: { path, u: uOfT(fr.range(7, 11)), lead: 48, angle: 70, side: -1, height: 9, span: 170, duration: DUR }, keepClear: { path, dist: 2, each: true } }));
    await ctx.yield();
    const T1 = hero.timeline.blowTimes[0];
    fauna.add(F.makeFlock({ rng: fr, ...BIRD, count: Math.max(3, Math.round(6 * density)), speed: 17, spread: [16, 8, 22], flap: 4.2, glide: 0.05,
      cross: { path, u: uOfT(T1 + 1.5), lead: 46, angle: 55, side: 1, height: -8, rise: 34, span: 160, duration: DUR } }));
    await ctx.yield();
    if (!jack) fauna.add(F.makeFlock({ rng: fr, ...PIGEON, count: 1, speed: 11, route: [[82, 55, -22.5], [68, 54.5, -22], [44, 62, -12], [6, 84, 14], [-36, 78, 34], [-60, 70, 44]], closed: false, start: fr() }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: fr.fork('westArc'), ...BIRD, count: 2, speed: 15, spread: [9, 4, 14], cross: { path, u: uOfT(33), lead: 40, angle: 75, side: 1, height: -4, span: 150, duration: DUR } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: fr, ...DAW, size: 4.6, count: Math.max(8, Math.round(20 * density)), speed: 14, spread: [26, 12, 40], center: [BX, 190, BZ], radius: 42, height: 0 }));
    // the climb flock crosses the hatch's column of daylight as the cradle takes the wire: the foot of the wire, plus a few metres
    // drawn from the flock's own fork so that no one place on the wire is theirs on every visit; the kit's own lead
    { const cr = fr.fork('climb'), sTakesWire = sD + cr.range(0, 12);
      fauna.add(F.makeFlock({ rng: cr, ...BIRD, count: Math.max(3, Math.round(5 * density)), speed: 19, spread: [9, 6, 12], flap: 4.4, glide: 0.05,
        cross: { path, u: sTakesWire / L, angle: 100, side: -1, height: 2, rise: 18, span: 140, duration: DUR } })); }
    await ctx.yield();
    if (cast === 'owl') fauna.add(F.makeFlock({ rng: fr, species: 'gulls', size: 9.5, count: 1, speed: 12, flap: 1.3, glide: 0.92, amp: 0.4, body: '#d9cdb4', belly: '#f3efe6', wingC: '#c2b08a', trail: '#a8946c', tip: '#8a7650', head: '#f4f0e8', beak: '#b9a890',
      cross: { path, u: uOfT(WARNING + 0.8), lead: 44, angle: 150, side: 1, height: 7, span: 150, duration: DUR } }));
    await ctx.yield();
    const motes = fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', count: Math.round(2600 * density * detail), box: [72, 46, 72], size: [0.04, 0.14], colors: ['#c9d4df', '#9fb1c4', '#b6c6d8'],
      intensity: lookId === 'night' ? 0.1 : 0.2, opacity: 0.5 });
    scene.add(motes.object);
    await ctx.yield();
    let snow = null;
    if (LK.snow) { snow = fx.makeParticles({ rng: rng.fork('snow'), preset: 'snow', follow: false, center: [8, 42, -14], box: [128, 44, 44], count: Math.round(4200 * detail), velocity: [-3.6, -2.4, 0.7], size: [0.14, 0.4] }); scene.add(snow.object); }
    await ctx.yield();

    // ---------------------------------------------------------------- this round's own static things, as one mesh
    await ctx.yield();
    finish(R4, 'r4Room');
    await ctx.yield();

    // ---------------------------------------------------------------- per-frame
    const birdSeed = dials.map(() => [0, 1, 2, 3].map(() => [fr.range(0, TAU), fr.pick([51, 51, 38]), fr.range(0.03, 0.09) * (fr.chance(0.5) ? 1 : -1), fr.range(0, 40), fr.range(2.0, 3.0)]));
    const birdsOnGlass = lookId === 'night' ? 1 : Math.min(4, Math.max(2, Math.round(3 * density)));
    const hourAng = (hour / 12) * TAU, qSpin = new THREE.Quaternion(), localM = new THREE.Matrix4(), _e = new THREE.Euler(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _sz = new THREE.Vector2();
    const lerp = (a, b, t) => a + (b - a) * t;

    function update(dt, time, camera, u) {
      // one beat for everything stepped. The wheels tick on wall time (they must tick while the world is only seen through a
      // portal); story time T is snapped to that beat by a whole number of seconds, so the hand shadows, the weight, the oil
      // drop and the cradle all step on the same instant as the wheels at any flight speed.
      const T = storyT(u), clock = time, f = frac(clock), b = beat(clock);
      const Tq = Math.min(RELEASE, Math.max(0, Math.floor(clock) + Math.round(T - clock)) + tick(f));
      uTime.value = time;
      { const e = camera.matrixWorld.elements;                   // each dial is a moon from across the room and a calm white wall close up
        for (let i = 0; i < 4; i++) dials[i].U.uNear.value = ss((70 - (DIRS[i].x * e[12] + DIRS[i].z * e[14]) - 18) / 52); }
      // the strike, keyed to where the camera is
      hero.setStrikeTime(T - RELEASE);
      const minute = -(TAU / 60) * (1 - Tq / RELEASE) + 0.0032 * kick(f) * (T < RELEASE ? 1 : 0.4);
      for (let i = 0; i < 4; i++) hero.setHands(i, minute, hourAng - (TAU / 720) * (1 - Tq / RELEASE));
      hero.update(dt, time, camera);
      // the going train: every wheel steps and recoils together, once a second, for ever
      for (let i = 0; i < 4; i++) going[i].rotation.z = goingStep[i] * b;
      const sw = Math.sin(Math.PI * clock);
      anchor.rotation.z = 0.047 * Math.sign(sw) * Math.pow(Math.abs(sw), 0.35);
      pendulum.rotation.z = (6 / PEND_L) * sw;
      for (const r of rods) { qSpin.setFromAxisAngle(UP, r.k * (TAU / 48) * b); r.m.quaternion.copy(r.q).multiply(qSpin); }
      goingWeight.position.y = 9.3 - 0.02 * b;
      { const sb = hero.state.sinceBlow, jolt = sb > 0 && sb < 20 ? 0.012 * Math.exp(-sb * 0.6) * Math.sin(sb * 4.4) : 0;
        lamp.rotation.z = 0.014 * Math.sin(time * 0.71) + 0.006 * Math.sin(time * 1.93) + jolt; lamp.rotation.x = 0.01 * Math.sin(time * 0.57 + 1.2);
        tackle.rotation.x = 0.005 * Math.sin(time * 0.43 + 0.6) + 0.3 * jolt; tackle.rotation.z = 0.004 * Math.sin(time * 0.37);
        tackle2.rotation.x = 0.012 * Math.sin(time * 0.53 + 2.1) + 0.5 * jolt; tackle2.rotation.z = 0.009 * Math.sin(time * 0.41 + 0.4);
        tackle3.rotation.x = 0.016 * Math.sin(time * 0.61 + 0.9) - 0.6 * jolt; tackle3.rotation.z = 0.012 * Math.sin(time * 0.47 + 1.7); }
      // the rare chime: wheels roll, eight levers ripple, four quarter hammers in turn
      if (rare) {
        const ts = T - RELEASE, run = ts > 0 ? ts - 0.25 * (1 - Math.exp(-ts / 0.25)) : 0, on = ts > 0 ? 1 : 0;
        for (let i = 0; i < 4; i++) chime[i].rotation.z = chimeRate[i] * run;
        chimeBarrel.rotation.z = -0.7 * run;
        for (let k = 0; k < 8; k++) { const p = frac(run * 0.85 - ((k * 3) % 8) / 8); chimeLevers[k].rotation.z = -0.04 - on * (p < 0.78 ? 0.16 * ss(p / 0.78) : 0.16 * (1 - (p - 0.78) / 0.22) - 0.03 * Math.sin((p - 0.78) / 0.22 * Math.PI)); }
        for (let k = 0; k < 4; k++) { const p = frac(run * 0.42 - k / 4);
          qHammers[k].rotation.z = on ? (p < 0.8 ? 0.32 + 0.3 * ss(p / 0.8) : p < 0.87 ? lerp(0.62, 0.03, (p - 0.8) / 0.07) : lerp(0.03, 0.32, ss((p - 0.87) / 0.13))) : 0.32; }
      }
      // shadows of birds outside, walking the glass; one rides the east minute hand
      for (let i = 0; i < 4; i++) {
        const ub = dials[i].U.uBirds.value;
        for (let j = 0; j < 4; j++) {
          const s = birdSeed[i][j], cyc = time * 0.045 + s[3], on = j < birdsOnGlass ? ss(Math.sin(cyc * TAU) * 3 + 1.6) : 0;
          if (i === 0 && j === 0) { ub[j].set(33 * Math.sin(minute) + 1.7, 33 * Math.cos(minute) + 0.4 * Math.sin(time * 0.7), 2.6); continue; }
          const a = s[0] + s[2] * (time * 0.35 + 2 * Math.sin(time * 0.21 + s[3])), r = s[1] + 1.4;
          ub[j].set(Math.sin(a) * r, Math.cos(a) * r + (1 - on) * 9, s[4] * on);
        }
      }
      // each of those shadows is a bird: it faces the way it walks (it turns end-on as it turns round) and bobs its head once a stride
      for (let i = 0; i < 4; i++) {
        const uf = dials[i].U.uBirdF.value;
        for (let j = 0; j < 4; j++) {
          const s = birdSeed[i][j];
          if (i === 0 && j === 0) { uf[j].set(1, Math.sin(time * 0.9)); continue; }
          const a = s[0] + s[2] * (time * 0.35 + 2 * Math.sin(time * 0.21 + s[3])), w = 4 * Math.cos(a) * s[2] / Math.abs(s[2]) * (0.35 + 0.42 * Math.cos(time * 0.21 + s[3])) / 0.35;
          uf[j].set(w >= 0 ? Math.min(1, Math.max(0.3, w)) : Math.max(-1, Math.min(-0.3, w)), Math.sin(a * (s[1] + 1.4) * 1.6));
        }
        // the walkers pace their spoke out and back, with a stand at each end (at night they only stand)
        const uw = dials[i].U.uWalk.value;
        for (let j = 0; j < 2; j++) {
          const k = walkSeed[i][j], th = lookId === 'night' ? k.ph : time * k.rate * TAU + k.ph, c = Math.cos(th), x = k.side * (k.mid + k.reach * Math.sin(th) * (1.5 - 0.5 * Math.sin(th) * Math.sin(th)));
          const w = lookId === 'night' ? k.side : 5 * k.side * c;
          uw[j].set(x, w >= 0 ? Math.min(1, Math.max(0.3, w)) : Math.max(-1, Math.min(-0.3, w)), Math.sin(x * 1.6), 1);
        }
      }
      webU.uShiver.value = 0.3 * hero.state.blur;
      burstU.uSince.value = hero.state.sinceBlow; colU.uSince.value = hero.state.sinceBlow;
      if (ctx.renderer) colU.uBufH.value = burstU.uBufH.value = ctx.renderer.getDrawingBufferSize(_sz).y;
      if (driftU) driftU.uBufH.value = colU.uBufH.value;
      { const rt = Math.min(1, Math.max(0, (T - T1) / 0.4)); roost.visible = rt < 1; roost.position.y = 5 * rt * rt; matRoost.uniforms.uFade.value = 1 - ss(rt); }
      // the cradle round the eye: it lurches and swings on every tick, and runs smooth in the strike
      const live = u > 0, kT = 1 - ss((T - RELEASE) / 1.2), kk = kick(f), intro = 1 - ss(u / 0.012);
      rig.visible = live;
      if (live) {
        const shake = (1 - kT) * 0.004;
        // in the strike the cradle is flung: it leans out of the orbit and hangs lower, and on the climb it drops under the eye
        const orb = ss((T - RELEASE) / 1.5) * (1 - ss((T - 34.5) / 1.2)), climb = ss((T - 34.6) / 1.4);
        _p.set(shake * Math.sin(time * 31) + 0.05 * orb, -1.3 * intro + RIG_LIFT + 0.018 * kk * kT + shake * Math.sin(time * 43) - 0.08 * orb - 0.07 * climb, 0.2 * kk * kT);
        _e.set(RIG_TILT + 0.012 * kk * kT, 0, 0.02 * kick(frac(clock - 0.07 + 1)) * kT + (1 - kT) * 0.01 * Math.sin(time * 2.3) - 0.14 * orb + 0.03 * climb * Math.sin(time * 1.7));
        // the clip swings in to take a rim at the two transfers, and for good as the cradle leaves the orbit, to grip the hammer wire
        const grip = Math.max(ss((T - 4.7) / 0.5) * (1 - ss((T - 6.1) / 0.6)), ss((T - 9.7) / 0.5) * (1 - ss((T - 11.1) / 0.6)), ss((T - T_LEAVES_ORBIT) / 0.9));
        clipRig.position.set(CLIP_PARK * (1 - grip), 0.1 * (1 - grip) - 0.06 * grip * climb - 0.09, 0);
        localM.compose(_p, _q.setFromEuler(_e), _s);
        rig.matrix.copy(camera.matrixWorld).multiply(localM); rig.matrixWorldNeedsUpdate = true;
        const fall = f < 0.5 && kT > 0.3;
        drop.visible = fall || f > 0.7;
        if (fall) { drop.position.set(DROP0.x, DROP0.y - 4.6 * f * f, DROP0.z); drop.scale.set(1, 1 + 2.5 * f, 1); }
        else { drop.position.copy(DROP0); drop.scale.setScalar(Math.max(0.05, (f - 0.7) / 0.3)); }
      }
      fauna.update(dt, time, camera, u);
      motes.update(dt, time, camera);
      if (snow) snow.update(dt, time, camera);
    }

    const poiDrum = V(26.5, 57, 1), uMidOrbit = (sA + sB) / 2 / L;   // over the second half of the orbit the gaze lifts into the hatch's column of light
    // a look held between two places on the route: the pull is full from the first place to the second and eases in and out over
    // GAZE_EASE metres of flight on either side. (The kit's poi fade is a share of the window, not a length, so the length is 30 m.)
    const GAZE_EASE = 30;
    const gazeOver = (s0, s1) => ({ from: (s0 - GAZE_EASE) / L, to: (s1 + GAZE_EASE) / L, fade: GAZE_EASE / (s1 - s0 + 2 * GAZE_EASE) });
    const pois = [
      { at: [70, 96, 6], from: uOfT(13.5), to: uOfT(20.2), weight: 0.5 },          // the east dial fills the frame
      { at: [26, 52, 1], from: uOfT(20), to: (sA - 4) / L, weight: 0.8, fade: 0.2 },            // the still fly: two red-tipped doors
      // the drum of blur, upright, in the column of light from the hatch. (The hatch itself is 80 degrees overhead from anywhere on
      // the orbit, so it cannot share the frame with the drum: its light does instead, and the gaze lifts to it as the orbit ends.)
      { at: (time, u) => poiDrum.set(26.5, 49 + 5 * ss((u - uMidOrbit) / Math.max(1e-3, sB / L - uMidOrbit)), 1), from: (sA - 12) / L, to: (sB + 8) / L, weight: 0.84, fade: 0.14 },
      // the west run, from the end of the orbit to the start of the turn: pin wheel turning, levers dipping, the wire hauled
      { at: [-44, 31, 6], ...gazeOver(sB, sC), weight: 0.6 },
      // the turn is a reveal, from its start to the foot of the wire: the gaze comes up off the levers into the hatch, the bell and
      // the portal in it
      { at: [SEAT.x, SEAT.y, SEAT.z], ...gazeOver(sC, sD), weight: 0.85 },
    ];
    const shared = [ubox, capL, ring, dialBoss, qbOut, qbIn, bevel];

    return {
      scene, path, duration: DUR, pace,
      ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, far: 900, lookAhead: 16, sway: 0.8, bank: 0.25 },
      pois,
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: LK.portal, glow: 1, revealDistance: 260, tilt: true },
      post: { exposure: LK.exposure, bloom: { strength: 0.34, radius: 0.7, threshold: 1.0 },
        // contrast stays at 1: the grade applies it in linear light round 0.5, which crushes the dark steel and iron of this room
        // toward whichever channel is strongest and turns every shadow navy. The contrast here is in the light itself.
        grade: { saturation: 1.02, contrast: 1.0, tint: LK.tint, shadowTint: '#05080d', vignette: 0.36, grain: 0.03, aberration: 0 } },
      update,
      dispose() { for (const g of shared) g.dispose(); for (const d of disposables) d.dispose?.(); hero.dispose?.(); },
    };
  },
};
