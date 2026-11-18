// Hero set piece for "Back to Us Above the Fog" (after Caspar David Friedrich): THE WINDOW.
// The west wall of a ruined abbey in untrodden snow: 34 m wide, 40 m high, 2.4 m thick, a head broken in slanted and sheer cuts, one tall
// empty lancet (9 x 30 m, sill 6.5, springing 27, apex 36.5) with three roll mouldings, shaft rings and a stump of tracery in
// its head (a sub-arch springer on one side and a short stub of the ring: the rest of the head is empty), a door under it, no other
// window, buttresses with snow on every set-off; behind it eight pier stumps and
// the choir arch 60 m on; eleven leaning grave crosses and an open grave before it; clawed oaks over its shoulders; six cowled
// monks carrying a coffin to the door; 24 ravens that wheel the tallest oak and leave through the window; level mist sliding
// through graves, door and nave.
//
// FRAME. Origin at the foot of the wall under the lancet, y 0 = snow, +Y up. By the contract the approach (west) face looks
// to +Z and the nave runs to -Z. Pass opts.courseZ = true to get it already turned for a course that runs +Z (approach face
// to -Z, nave to +Z, port = +x): then place it unrotated at world (0, 4, 400). Anchors are returned in whichever frame you chose.
// SIZE radius 30 (wall) / everything within 95 m of the origin, height 42. COST about 46-51k triangles, 10 draw calls, no lights,
// no textures, build about 120 ms in steps under 25 ms (it yields between pieces). It expects a sky behind the lancet (the lit
// gap) and the world's own snow beyond its patch.
//
// opts: palette (7 hex, brief order: umber, fir green, violet slate, far blue, pearl, straw, rose), detail 0.6..1 (thins twigs
//   and mist), courseZ (see FRAME), standalone (default true: sets the shared STYLE fog for the piece seen alone; a world passes
//   false and sets STYLE itself), oaks (0..4, default 3; a world that plants its own sixteen with buildOak passes 0, or keeps
//   these and adds thirteen), ground (false = no snow patch), groundRadius (170), snow (false = late autumn, no snow term),
//   leaves (russet leaf amount, 1), ravens (count, 24).
// returns { object, radius, height, center, anchors, style, setProgress(u), setRavens(g), update, dispose }.
//   setProgress(u 0..1): the monks walk their 15 m to the door and (unless setRavens is used) the ravens leave in threes.
//   setRavens(g 0..1): the ravens alone: 0 wheeling, by about 0.5 the first are through the lancet, 1 all gone down the nave.
//   update(dt, time, camera): clock for mist drift, wing beats, monks' steps; reads the drawing-buffer height for ribbons.
// anchors (local Vector3s): lancet (centre of the opening), sill, apex, door, flyThrough (8 points: 2.5 m to port of centre
//   through the window so the port jamb passes at 2 m, then easing to the axis, through the choir arch; boughs are pruned
//   8 m round this line), viewpoints { reveal, overGraves, inWindow, nave }, choirArch, piers[] (tops), graves[], openGrave,
//   ravenOak (crown of the tallest oak, 12 m to port), oaks[] (tops), owlPerch (the broken end of the tracery stump, for the rare owl),
//   monksStart, exitDirection (unit vector down the axis; the exit portal is the world's, 600 m on: portalSeat is null).
//
// THE STYLE (exports; shade the whole world with these so nothing looks pasted in). Flat pipeline: the world returns
// post { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } }; colours are written
// as linear values of the palette hexes, no inverse tone map. Nothing is lit. Every surface is:
//   local dark (uCol) with a drawn second value a few percent off (uCol2: joints, lichen, furrows, feather lines, from
//   object-space line functions that fade out between 35 and 62 m and never thinner than 1.5 px; the drawing goes down to the
//   local dark and never below umber, nothing is multiplied darker), snow in pearl with violet
//   hollows wherever the facet's true normal looks up (from screen derivatives: geometry needs no normals), then ONE tone step
//   per object by the distance of its centre (full dark within 60 m, the first step complete at 100 m, one more each 40 m,
//   toward the fog colour of its height), then closed-form fog along the true eye ray (thin haze + the level slab as a box + ground mist exponential in
//   height), its density sliding in level patches along uDrift so the glaze visibly moves over whatever it lies on.
//   All pigment mixes are made in gamma-2 space (fzMix) so steps are even on umber and on pearl.
// PALETTE, mixHex(a, b, t)   pigments; display-space mix of two hexes (use it for russet, ochre, any "mixture between these").
// STYLE                       shared uniform objects (uTime, uSlab, uHaze, uFogHi, uFogLo, uSplit, uTone, uDetail, uDrift, uSnow...).
//                             Module-wide on purpose: set slab heights / fog colours once per frame from u and everything follows.
// setPalette(pal), tickStyle(time, renderer)   fill the pigments; advance the clock and pixel size (the hero's update calls it).
// STYLE_GLSL, STYLE_FRAG_GLSL  the chunks: fzToneStep, fzFogCol, fzTau, fzFog, fzMix, fzNoise (and fzLine for fragments). Use
//                             them in the deck, sky and sea shaders so the fog colour at the lens matches.
// fzMaterial({ mode, col, col2, snow, grain, lift, centers, side })   the one solid material: mode 'plain' | 'ashlar' | 'rock' |
//                             'bark' | 'lines' | 'snow' | 'fir' | 'plank' (a hull's level strakes). Geometry needs position and aVS (vec2: value shift -1..1, forced snow
//                             0..1); merged things also aC (their own centre) with centers: true. Works with InstancedMesh.
//                             'ashlar' courses by the stone's own rule (courses 0.45 to 1.1 m, blocks 0.9 to 3 m, through stones,
//                             spalled corners, a few dropped blocks). 'rock' is one dark mass with beds and joints drawn into it,
//                             no value by a facet's facing. 'fir' reads aVS.y as minus the bough coordinate (0 at the stem,
//                             -1 at the tips) and takes col2 as the core's umber: whorls with a toothed hanging edge.
// FzGeo                       small builder that writes position/aVS/aC (quad, tri, rings, hexa, box, .mat, .center, build()).
// fzRibbonMaterial({ col, centers }), ribbonGeometry(segs)   twigs, cross, stick, masts, rigging: 1.5 px width floor, fading
//                             to the fog tone as they thin.
// fzMistMaterial({ z0, z1, nearFade, speed, ground }), mistGeometry(list)   level drifting ground-mist quads: a bell of
//                             vapour both ways, fading to nothing at the lens and over whatever solid it would meet.
// mistGround(box, fn, yield)  the ground map a mist field fades against (floor, a travelling floor, a lintel), see there.
// buildOak(G, R, rng, o)      one clawed oak into an FzGeo (bark) and a ribbon list (twigs); o.keepOut(p) prunes boughs.
// monkFigure(G, rng, x, z, h), ravenGeometry(), ravenFlock(rng, n, { home, gate, away })   backs only; the flock's uGo uniform
//                             is its progress.
import * as THREE from 'three';
import { makeNoise, clamp, lerp, smoothstep } from '../kit/core.js';

// ---------------------------------------------------------------- pigments
export const PALETTE = ['#241D18', '#25322C', '#6E6A85', '#8FA3B8', '#DCDDD6', '#EFE0A0', '#E3B4A6'];
const lin = (hex) => new THREE.Color(hex);          // flat pipeline: linear value of the hex is what reaches the screen
const mixc = (a, b, t) => a.clone().lerp(b, t);
// mix two hex pigments as the eye sees them (in display values); returns a hex string
export const mixHex = (a, b, t) => { const A = new THREE.Color(a).convertLinearToSRGB(), B = new THREE.Color(b).convertLinearToSRGB(); return '#' + new THREE.Color().setRGB(lerp(A.r, B.r, t), lerp(A.g, B.g, t), lerp(A.b, B.b, t), THREE.SRGBColorSpace).getHexString(); };

// ---------------------------------------------------------------- shared uniforms (one object for the whole world)
// The world coder sets these once (and may move slab / colours with u); every material made by the factories below
// holds references to the same objects, so one write restyles everything.
export const STYLE = {
  uTime: { value: 0 },
  uSlab: { value: new THREE.Vector4(64, 80, 0.16, 0) },        // world y of slab bottom, top, density per metre, (spare)
  uHaze: { value: new THREE.Vector4(0.00035, 0.012, 4, 5) },   // thin haze per metre, ground-mist density, ground y, scale height
  uFogHi: { value: lin('#DCDDD6') },                           // fog colour above uSplit (pearl)
  uFogLo: { value: lin('#6E6A85') },                           // fog colour below uSplit (violet slate)
  uSplit: { value: 72 },
  uTone: { value: new THREE.Vector4(60, 40, 0.3, 6) },         // dark radius m, step length m, tone per step, max steps
  uDetail: { value: new THREE.Vector2(35, 62) },               // drawn detail fades between these distances
  uSnowCol: { value: lin('#DCDDD6') },
  uSnowLo: { value: lin('#6E6A85') },
  uSnow: { value: 1 },                                         // 0 = late autumn, no snow anywhere
  uDrift: { value: new THREE.Vector3(0, 6, 0.55) },                // mist drift: world x, z in m/s (toward the light), and how patchy 0..1
  uDeckHol: { value: lin('#B4B7C6') },                         // the fog sea's hollows (the world sets both from its hour)
  uDeckFar: { value: lin('#BEC6CC') },                         // and its far tone
  uViewH: { value: 720 },                                      // drawing-buffer height in pixels (ribbon width floor)
};
export function setPalette(pal = PALETTE) {
  STYLE.uFogHi.value.set(pal[4]); STYLE.uFogLo.value.set(pal[2]);
  STYLE.uSnowCol.value.set(pal[4]); STYLE.uSnowLo.value.copy(mixc(lin(pal[4]), lin(pal[2]), 0.55));
}
// call once a frame (the hero's update() does it): clock for drift, pixel height for ribbons
export function tickStyle(time, renderer) {
  STYLE.uTime.value = time;
  if (renderer) { const s = renderer.getDrawingBufferSize(_sz); STYLE.uViewH.value = Math.max(64, s.y); }
}
const _sz = new THREE.Vector2();

// ---------------------------------------------------------------- GLSL: the whole look
const UMBER_GLSL = (() => { const c = lin(PALETTE[0]); return [c.r, c.g, c.b].map((v) => v.toFixed(5)).join(', '); })();
export const STYLE_GLSL = /* glsl */`
uniform float uTime; uniform vec4 uSlab; uniform vec4 uHaze; uniform vec3 uFogHi; uniform vec3 uFogLo; uniform float uSplit;
uniform vec3 uDeckHol; uniform vec3 uDeckFar;
uniform vec3 uDrift; uniform vec4 uTone; uniform vec2 uDetail; uniform vec3 uSnowCol; uniform vec3 uSnowLo; uniform float uSnow;
const vec3 FZ_UMBER = vec3(${UMBER_GLSL});   // the darkest pigment: nothing is darker, nothing is mixed with black
float fzHash(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float fzNoise(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(mix(fzHash(i), fzHash(i+vec3(1,0,0)), f.x), mix(fzHash(i+vec3(0,1,0)), fzHash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(fzHash(i+vec3(0,0,1)), fzHash(i+vec3(1,0,1)), f.x), mix(fzHash(i+vec3(0,1,1)), fzHash(i+vec3(1,1,1)), f.x), f.y), f.z); }
// every mix of two pigments is made in gamma-2 space, so a 6 percent step looks like 6 percent on a dark umber as on pearl
vec3 fzMix(vec3 a, vec3 b, float t){ vec3 m = mix(sqrt(max(a, 0.)), sqrt(max(b, 0.)), clamp(t, 0., 1.)); return m * m; }
// tone step of an object whose origin is d metres from the lens: full dark within the dark radius (60 m), the first paler step
// complete one step length on (100 m), each 40 m beyond one step more; a step comes on over the second half of its 40 m
float fzToneStep(float d){ float s = clamp(max(d - uTone.x, 0.) / max(uTone.y, 1.) , 0., uTone.w);
  float st = floor(s) + smoothstep(0.5, 1., fract(s)); return 1. - exp(-st * uTone.z); }
// fog colour for a ray between heights: pearl above the split, violet below
vec3 fzFogCol(float y){ return mix(uFogLo, uFogHi, smoothstep(uSplit - 6., uSplit + 6., y)); }
// optical depth along the true eye ray: thin haze + level slab (box) + ground mist (exponential in height), closed form
float fzTau(vec3 eye, vec3 p){
  float L = distance(eye, p);
  float lo = min(eye.y, p.y), hi = max(eye.y, p.y); float h = max(hi - lo, 0.01); hi = lo + h;
  float ov = max(0., min(hi, uSlab.y) - max(lo, uSlab.x));
  float tau = uHaze.x * L + uSlab.z * L * ov / h;
  float H = max(uHaze.w, 0.1); float ya = max(lo - uHaze.z, -H) / H; float t = h / H;
  float fac = t < 1e-3 ? 1. : (1. - exp(-t)) / t;
  tau += uHaze.y * L * exp(-ya) * fac;
  return tau; }
// the glaze moves: level patches of ground mist and slab slide along uDrift over whatever they lie on
float fzDrift(vec3 p){ vec2 q = p.xz - uDrift.xy * uTime; return 1. + uDrift.z * (fzNoise(vec3(q.x * 0.045, p.y * 0.3, q.y * 0.03)) * 2. - 1.); }
// the fog's colour is that of the fog nearest the eye on this ray: the slab's own height where the ray crosses the slab
// inside the slab the fog is not one tone: level veils, paler and darker, stream past the eye toward the light
vec3 fzVeil(vec3 fogc, vec3 eye, vec3 dir, float L){
  float inside = smoothstep(uSlab.x - 3., uSlab.x + 3., eye.y) * (1. - smoothstep(uSlab.y - 1.5, uSlab.y + 1.5, eye.y));
  if (inside < 0.003) return fogc;
  vec3 s = eye + dir * min(L, 15.); vec2 q = s.xz - uDrift.xy * uTime * 1.5;
  vec3 s2 = eye + dir * min(L, 38.); vec2 q2 = s2.xz - uDrift.xy * uTime * 1.5;
  float n = fzNoise(vec3(q.x * 0.06, s.y * 0.4, q.y * 0.055)), n2 = fzNoise(vec3(q2.x * 0.03 + 7., s2.y * 0.22, q2.y * 0.03));
  vec3 c = fzMix(fogc, uFogHi, smoothstep(0.48, 0.7, n) * 0.5 * inside);
  return fzMix(c, fzMix(uFogLo, FZ_UMBER, 0.1), smoothstep(0.5, 0.74, n2) * 0.55 * inside); }
vec3 fzFog(vec3 col, vec3 eye, vec3 p){ float f = 1. - exp(-fzTau(eye, p) * fzDrift(p));
  float ov = min(max(eye.y, p.y), uSlab.y) - max(min(eye.y, p.y), uSlab.x);
  float yc = mix(mix(eye.y, p.y, 0.6), clamp(eye.y, uSlab.x, uSlab.y), smoothstep(0., 1.5, ov));
  vec3 dv = p - eye; float L = length(dv);
  return fzMix(col, fzVeil(fzFogCol(yc), eye, dv / max(L, 1e-4), L), f); }
// the fog sea's surface (the deck and every foot that melts into it share these): long level swells, nearer the lens billows
float fzDeckH(vec2 q){ return fzNoise(vec3(q.x * 0.011, 3., q.y * 0.03)) * 0.6 + fzNoise(vec3(q.x * 0.03, 7., q.y * 0.075)) * 0.4; }
float fzDeckB(vec2 q){ return fzNoise(vec3(q.x * 0.045, 21., q.y * 0.13)) * 0.6 + fzNoise(vec3(q.x * 0.11, 17., q.y * 0.33)) * 0.4; }
float fzDeckY(vec2 xz, float dl){ vec2 q = xz - uDrift.xy * uTime; float k = smoothstep(4., 48., dl);
  return uSlab.y + (fzDeckH(q) - 0.38) * 7. * k * (1. - smoothstep(2500., 9000., dl)) + (fzDeckB(q) - 0.5) * 3. * k * (1. - smoothstep(90., 260., dl)); }
vec3 fzDeckCol(vec3 w, vec3 eye){
  float d = distance(eye, w); vec2 q = w.xz - uDrift.xy * uTime;
  float fine = fzNoise(vec3(q.x * 0.05, 1., q.y * 0.16)) * (1. - smoothstep(150., 500., d));
  float h0 = fzDeckH(q), rise = (fzDeckH(q + vec2(0., 5.)) - h0) * 7.;       // a swell's near side faces away from the light beyond the horizon
  float hol = max(smoothstep(0.6, 0.22, h0 + (fine - 0.5) * 0.25) * 0.75, smoothstep(0.02, 0.5, rise + (fine - 0.5) * 0.2));
  float nk = 1. - smoothstep(90., 260., d);
  if (nk > 0.) { float b = fzDeckB(q), br = fzDeckB(q + vec2(0., 2.5)) - b;   // nearer the lens: billows of 10 to 25 m, pearl on top, violet on the near side and in the troughs
    hol = mix(hol, clamp((1. - smoothstep(0.36, 0.6, b)) * 0.6 + smoothstep(0., 0.1, br) * 0.55, 0., 1.), nk * 0.85); }
  hol *= 1. - 0.6 * smoothstep(250., 1500., d);
  vec3 c = fzMix(uFogHi, uDeckHol, hol * smoothstep(3., 22., d));
  c = fzMix(c, uDeckFar, smoothstep(300., 6000., d));
  // from above, the vapour's own surface is what is seen: the mist lying on it does not veil it (it would paint it out blank)
  return mix(fzFog(c, eye, w), c, 0.85 * smoothstep(uSlab.y + 0.5, uSlab.y + 5., eye.y)); }
`;

// fragment-only part of the look (uses derivatives)
export const STYLE_FRAG_GLSL = /* glsl */`
// antialiased drawn line at coordinate x (period 1), w = half width in periods; fades to its average when finer than ~3 px
float fzLine(float x, float w){ float fw = max(fwidth(x), 1e-5); float d = abs(fract(x - 0.5) - 0.5);
  float l = 1. - smoothstep(max(w, fw * 0.75) - fw * 0.75, max(w, fw * 0.75) + fw * 0.75, d);
  return mix(l, 2. * w, smoothstep(0.25, 0.6, fw)) * (1. - smoothstep(0.6, 1.2, fw)); }
`;

const SOLID_VERT = /* glsl */`
${STYLE_GLSL}
attribute vec2 aVS;            // x: local value shift (-1 darker core .. +1 paler), y: forced snow 0..1
uniform vec2 uSway;            // hung cloth stirs: amplitude m, rate
varying vec3 vW; varying vec3 vO; varying vec2 vVS; varying float vTone;
#ifdef FZ_CENTER
attribute vec3 aC;             // merged geometry: object-space centre of the thing this vertex belongs to (same on all its vertices)
#endif
void main(){
  vec4 o = vec4(position, 1.);
  #ifdef USE_INSTANCING
    o = instanceMatrix * o; vec3 oc = (modelMatrix * instanceMatrix * vec4(0., 0., 0., 1.)).xyz;
  #else
    vec3 oc = modelMatrix[3].xyz;
  #endif
  #ifdef FZ_CENTER
    oc = (modelMatrix * vec4(aC, 1.)).xyz;
  #endif
  vO = position; vVS = aVS;
  o.z += uSway.x * sin(uTime * uSway.y + position.x * 0.31 + position.y * 0.23) * (0.6 + 0.4 * sin(uTime * uSway.y * 0.37 + position.y * 0.6));
  vec4 w = modelMatrix * o; vW = w.xyz;
  vTone = fzToneStep(distance(cameraPosition, oc));
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const SOLID_FRAG = /* glsl */`
${STYLE_GLSL}
${STYLE_FRAG_GLSL}
// ashlar: the bed under course k (courses of 0.775 m, more or less 0.325) and the perpend before block k of a course (blocks of 1.95 m, more or less 1.05)
float fzBed(float k){ return k * 0.775 + 0.174 * sin(k * 2.4 + 1.3); }
float fzPerp(float k, float ph){ return k * 1.95 + 0.56 * sin(k * 2.4 + ph); }
uniform vec3 uCol; uniform vec3 uCol2; uniform float uMode; uniform float uSnowAmt; uniform float uGrain; uniform float uLift; uniform float uBody; uniform vec3 uLeaf;
varying vec3 vW; varying vec3 vO; varying vec2 vVS; varying float vTone;
void main(){
  vec3 cw = cross(dFdx(vW), dFdy(vW)); vec3 n = cw / max(length(cw), 1e-12);
  vec3 co = cross(dFdx(vO), dFdy(vO)); vec3 no = co / max(length(co), 1e-12);
  float dist = distance(cameraPosition, vW);
  float df = 1. - smoothstep(uDetail.x, uDetail.y, dist);
  vec3 col = uCol; float v = 0.;                         // v: drawn second value, -1 darker .. +1 paler
  float bt = clamp(-vVS.y, 0., 1.), fwT = fwidth(vVS.y);   // the fir's bough coordinate and its pixel size (derivatives are taken outside the branches)
  if (uMode < 0.5) {                                     // 0 plain: a faint drawn grain only
    v = (fzNoise(vO * uGrain) - 0.5) * 0.2;
  } else if (uMode < 1.5) {                              // 1 ashlar: courses, staggered joints, block values, lichen, weather streaks
    vec3 ao = abs(no); vec2 q = ao.z > 0.55 ? vO.xy : (ao.x > 0.55 ? vO.zy : vO.xz * 1.0);
    float top = step(0.55, ao.y) * (1. - step(0.55, ao.z)) * (1. - step(0.55, ao.x));
    // ashlar by the stone's own rule: no two courses alike (0.45 to 1.1 m), blocks 0.9 to 3 m, no joint over another in a pattern
    float fwq = max(max(fwidth(q.x), fwidth(q.y)), 1e-5);
    float row = floor(q.y / 0.775); if (q.y < fzBed(row)) row -= 1.; else if (q.y >= fzBed(row + 1.)) row += 1.;
    float by0 = fzBed(row), by1 = fzBed(row + 1.), dyb = min(q.y - by0, by1 - q.y);
    float rph = fzHash(vec3(row, 3.3, 7.1)) * 6.283, qx = q.x + fzHash(vec3(row, 5.9, 2.3)) * 1.95;
    float bk = floor(qx / 1.95); if (qx < fzPerp(bk, rph)) bk -= 1.; else if (qx >= fzPerp(bk + 1., rph)) bk += 1.;
    float bx0 = fzPerp(bk, rph), bx1 = fzPerp(bk + 1., rph), dxb = min(qx - bx0, bx1 - qx);
    float blk = fzHash(vec3(bk, row, 1.7)), odd = fzHash(vec3(bk, row, 5.3));
    if (odd < 0.1 && bx1 - bx0 > 1.6) dxb = min(dxb, abs(qx - bx0 - 0.45));          // a through stone: its end shows as a face 0.45 m wide
    float jf = 1. - smoothstep(12., 23., dist);                                                                      // joints are found only on looking
    float near = 1. - smoothstep(4., 18., dist);
    // weathered joints: thin, and they come and go along the course (worn flush here, open there), never a ruled grid
    float worn = 0.3 + 0.7 * smoothstep(0.3, 0.62, fzNoise(vec3(q.x * 0.55, q.y * 0.9, 31.)));
    float jw = max(mix(0.009, 0.005, near), fwq * 0.75), ja = fwq * 0.75;                 // thin dark joints: 1 cm, never under a pixel and a half
    float jl = max(1. - smoothstep(jw - ja, jw + ja, dyb), 1. - smoothstep(jw - ja, jw + ja, dxb)) * (1. - smoothstep(0.02, 0.05, fwq)) * (1. - top) * jf * worn;
    float spall = step(0.84, fzHash(vec3(bk, row, 9.1))) * (1. - smoothstep(0.1, 0.16, (bx1 - qx) + (by1 - q.y) * 1.3 + (fzNoise(vO * 9.) - 0.5) * 0.08));   // a spalled corner
    float gone = step(0.994, odd);                                                             // a dropped block: a dark socket, a few in a face
    float streak = fzNoise(vec3(q.x * 1.7, q.y * 0.13, 4.)) - 0.5;
    float lichen = smoothstep(0.4, 0.72, fzNoise(vO * 0.33 + 9.) * 0.7 + fzNoise(vO * 1.9) * 0.3);                  // soft blots
    float damp = smoothstep(0.45, 0.8, fzNoise(vO * vec3(0.21, 0.09, 0.21) + 21.));                                 // long dark weathering
    float fis = fzLine(q.x * 0.13 + fzNoise(vec3(q.y * 0.35, q.x * 0.1, 7.)) * 0.5, 0.004) * step(0.56, fzNoise(vec3(q.x * 0.13, q.y * 0.07, 3.)));   // a few fissures
    // at arm's length the drawing shows: soft lichen in a second close umber, and knocked arrises along the courses
    float pit = smoothstep(0.5, 0.8, fzNoise(vO * 1.7 + 4.) * 0.65 + fzNoise(vO * 5.3 + 2.) * 0.35) * near;
    float arris = smoothstep(0.5, 0.75, fzNoise(vO * vec3(1.1, 3.1, 1.1) + 12.)) * (1. - smoothstep(0.02, 0.05, dyb)) * near;
    v = (blk - 0.5) * mix(0.02, 0.07, jf) + streak * 0.06 + lichen * 0.1 - damp * 0.12 - fis * 0.45 - jl * mix(0.22, 0.3, near) - pit * 0.06 - arris * 0.22 - (spall * 0.4 + gone * 0.5) * (1. - top) * jf + (abs(no.x) * 0.6 + no.y * 0.12) * 0.07 - 0.02;   // one dark mass; the rolls turn in close values
    // K5: THE WALL'S JOINTS AT THE SECOND VALUE (the designer's fourth word, 5). The same joints (their places, their wear, a
    // centimetre wide and never under a pixel and a half), drawn from the body down to the local dark, which is as far as the two
    // close values part, and kept until the stone's own drawing fades out (35 to 62 m) instead of 12 to 23 m; they go to their
    // average only where a course is finer than about four pixels
    v -= max(max(1. - smoothstep(jw - ja, jw + ja, dyb), 1. - smoothstep(jw - ja, jw + ja, dxb)) * (1. - smoothstep(0.12, 0.25, fwq)) * (1. - top) * worn * 0.5 - jl * mix(0.22, 0.3, near), 0.);
  } else if (uMode < 2.5) {                              // 2 rock: fissures across facets
    float f = fzLine(vO.y * 0.38 + fzNoise(vO * vec3(0.12, 0.3, 0.12)) * 1.6, 0.018) * 0.8 * smoothstep(0.3, 0.55, fzNoise(vO * 0.23 + 7.))   // bedding, nearly level, broken: drawn lines of a hand's breadth
      + fzLine((vO.x * 0.8 + vO.z * 0.6) * 0.23 + fzNoise(vO * 0.17 + 5.) * 0.9, 0.012) * 0.7 * step(0.45, fzNoise(vO * vec3(0.3, 0.08, 0.3) + 2.));   // joints, steep
    float nr = 1. - smoothstep(8., 32., dist);                                 // at a few metres the beds are drawn finer
    f += fzLine(vO.y * 1.1 + fzNoise(vO * vec3(0.3, 0.8, 0.3) + 4.) * 1.3, 0.035) * 0.6 * nr * smoothstep(0.35, 0.6, fzNoise(vO * 0.6 + 11.));
    v = (fzNoise(vO * 0.8) - 0.5) * 0.16 - f * 0.9 + (fzNoise(vO * vec3(0.5, 2.2, 0.5)) - 0.5) * 0.3 * nr   // one mass (its body value is uBody), the drawn beds and joints cut into it; no value by a facet's facing
      + (fzHash(floor(vec3(vO.x * 0.31 + vO.y * 0.12, vO.y * 0.36 + fzNoise(vO * 0.2) * 0.8, vO.z * 0.31 - vO.y * 0.07))) - 0.5) * 0.26;   // close-valued plates of 3 m
  } else if (uMode < 3.5) {                              // 3 bark: long drawn furrows up the limb
    float f = fzLine(fzNoise(vec3(vO.x * 5., vO.y * 0.22, vO.z * 5.)) * 5., 0.07);
    v = -abs(fzNoise(vO * 1.3) - 0.5) * 0.5 - f * 0.55;
    // K5: THE OAKS' BARK AT THE SECOND VALUE (the designer's fourth word, 5). The fine furrows above are a few millimetres wide
    // and are gone a few metres from the eye; the boles stand 5 to 40 m from the route. So the old oak's deep furrows as well:
    // about 6 cm wide and 30 cm apart, running up the limb, drawn from the body down to the local dark; they fade out with the
    // rest of the drawing (35 to 62 m) and go to their average where finer than about four pixels
    v -= fzLine(fzNoise(vec3(vO.x * 0.75, vO.y * 0.05, vO.z * 0.75)) * 3., 0.1) * 0.6;
  } else if (uMode < 4.5) {                              // 4 cloth / feather / plank: parallel drawn lines along object y
    float f = fzLine(vO.x * uGrain + fzNoise(vO * 2.) * 0.22, 0.06);
    v = -f * 1.1 + (fzNoise(vO * 3.) - 0.5) * 0.12;
  } else if (uMode > 7.5) {                              // 8 canvas
    // K1: fore-and-aft canvas (jibs, spanker), which hangs in the keel's plane: the cloths' seams run up it a cloth's width
    // apart along the keel (object z), as the square sails' run across (object x) in the 'lines' mode; the same line, the same value
    float f = fzLine(vO.z * uGrain + fzNoise(vO * 2.) * 0.22, 0.06);
    v = -f * 1.1 + (fzNoise(vO * 3.) - 0.5) * 0.12;
  } else if (uMode > 6.5) {                              // 7 plank: a hull's strakes, level, with butts and a value to each plank; decks are laid fore and aft
    float dk = step(0.7, abs(no.y)), sc = mix(vO.y, vO.x, dk) / 0.3, row = floor(sc), bz = vO.z / 3.4 + fzHash(vec3(row, 1.3, 7.7));
    v = -fzLine(sc, 0.07) * 0.9 - fzLine(bz, 0.008) * 0.7 + (fzHash(vec3(row, floor(bz), 3.1)) - 0.5) * 0.5 + (fzNoise(vO * vec3(9., 9., 0.7)) - 0.5) * 0.2;
  } else if (uMode > 5.5) {                              // 6 fir: whorl on whorl of drooping boughs, drawn from the skirt's own coordinate
    // bt runs from the stem (0) to the bough tips (1). Fir green going umber at the core (uCol2 is the core's umber here), needle
    // sprays ribbed down each bough, and the hanging edge cut in teeth: 26 sprays round a whorl, staggered whorl to whorl.
    // No facet is paler than another: nothing is lit.
    float a = (abs(vO.x) + abs(vO.z)) < 1e-6 ? 0. : atan(vO.z, vO.x);
    float sp = a * 4.138 + vO.y * 31.;
    float saw = abs(fract(sp) - 0.5) * 2.;
    float tooth = (0.36 * saw + 0.12 * fzNoise(vec3(a * 7., vO.y * 43., 3.))) * (1. - smoothstep(0.12, 0.34, fwT));   // teeth finer than the pixel close up
    if (bt > 1. - tooth) discard;
    col = fzMix(uCol, uCol2, 1. - smoothstep(0.08, 0.62, bt));
    v = -fzLine(sp, 0.2) * 0.55 * smoothstep(0.2, 0.55, bt) + (fzNoise(vO * 37.) - 0.5) * 0.24 - 0.35 * smoothstep(0.7, 1., bt);
  }
  // two close values and no third: the body stands uBody of the way from the local dark to its second value, the drawing goes
  // down from there to the local dark and no further (and toward umber where the local dark is a paler pigment); no multiply
  v = v * df + (vVS.x > 0. ? vVS.x * uLift : vVS.x * 1.2) + uBody;
  col = fzMix(fzMix(col, uCol2, clamp(v, 0., 1.)), FZ_UMBER, 0.6 * clamp(-v, 0., 1.));
  if (uMode > 2.5 && uMode < 3.5 && vVS.x > 0.9) col = uLeaf;                 // a russet leaf hanging on
  // snow: pearl where the facet looks up, violet in its hollows; the only pale edge a solid may have
  float sn = smoothstep(0.42, 0.62, n.y + (fzNoise(vW * 1.7) - 0.5) * 0.3 * df) * uSnowAmt;
  sn = max(sn, vVS.y) * uSnow * clamp(1. + min(vVS.y, 0.), 0., 1.);
  if (uMode > 2.5 && uMode < 3.5) sn = smoothstep(0.5, 0.92, vVS.y) * (0.7 + 0.3 * fzNoise(vW * 2.3)) * uSnowAmt * uSnow;
  if (uMode > 6.5 && uMode < 7.5) sn *= 1. - smoothstep(60., 100., dist);   // K1: the snow on a brig's yards is drawn near; past the first tone step the yard is one pale line with the rest of her (a cap of 8 cm is under a pixel there)
  float hol = smoothstep(0.3, 0.85, fzNoise(vW * vec3(0.11, 0.4, 0.11) + 3.)) * 0.4 + (1. - clamp(n.y, 0., 1.)) * 0.5; float gm = 0.;
  if (uMode > 4.5 && uMode < 5.5) { sn = uSnow; hol = clamp(hol * 0.8 - vVS.x * 0.9, 0., 1.);
    // untrodden snow lies in wind drifts: long broken crests across the course, each with a violet lee, drawn where the eye is near
    float dr = fzLine(vW.z * 0.27 + fzNoise(vec3(vW.x * 0.07, 3., vW.z * 0.06)) * 2.6, 0.13) * smoothstep(0.32, 0.6, fzNoise(vec3(vW.x * 0.045, 7., vW.z * 0.1))) * df;
    hol = clamp(hol + dr * 0.5, 0., 1.);                                // 5 ground: snow, or (no snow) drawn heath
    float tuft = mix(0.3, smoothstep(0.52, 0.74, fzNoise(vW * vec3(3.1, 1., 0.8)) * 0.6 + fzNoise(vW * vec3(7.3, 1., 1.9) + 5.) * 0.4), df * (1. - smoothstep(10., 30., dist)))
      + smoothstep(0.35, 0.7, fzNoise(vW * vec3(0.21, 0.5, 0.21))) * 0.5;                                              // short tufts, and broad heath patches
    col = fzMix(uCol, uCol2, clamp(tuft * 0.5 + vVS.x * 0.2 + 0.05, 0., 1.));
    // late autumn: pale mist lies level on the dark heath in drifting sheets, thicker with distance
    vec2 lq = vW.xz - uDrift.xy * uTime;
    float thr = mix(0.6, 0.06, smoothstep(10., 62., dist));
    float lie = smoothstep(thr, thr + 0.2, fzNoise(vec3(lq * vec2(0.02, 0.045), 1.5)) * 0.7 + fzNoise(vec3(lq * vec2(0.06, 0.16), 4.5)) * 0.3);
    col = fzMix(col, fzMix(uSnowLo, uSnowCol, 0.55), (1. - uSnow) * lie * 0.94);
    gm = smoothstep(0.47, 0.7, fzNoise(vec3(lq * vec2(0.02, 0.05), 6.5)) * 0.65 + fzNoise(vec3(lq * vec2(0.055, 0.15), 2.5)) * 0.35) * smoothstep(8., 30., dist) * uSnow; }
  col = mix(col, fzMix(uSnowCol, uSnowLo, clamp(hol, 0., 1.)), sn);
  col = fzMix(col, uSnowLo, gm * 0.5);                                       // over the snow the level mist slides as violet veils
  col = fzMix(col, fzFogCol(vW.y), vTone);
  // the foot melts into mist: seen from above the fog, a solid dissolves over its last metres above the fog's level top
  col = fzFog(col, cameraPosition, vW);
  float above = smoothstep(uSlab.y - 2., uSlab.y + 3., cameraPosition.y);
  if (above > 0.001 && vW.y < uSlab.y + 16.) {            // it takes the fog sea's own colour there, so no edge shows where it goes under
    float dy = fzDeckY(vW.xz, length(vW.xz - cameraPosition.xz));
    float mh = 3. + 3.5 * fzNoise(vec3((vW.xz - uDrift.xy * uTime) * 0.06, 2.));
    float melt = (1. - smoothstep(0., mh, vW.y - dy)) * above;
    if (melt > 0.) { vec3 rd = vW - cameraPosition; float rt = clamp((cameraPosition.y - dy) / max(cameraPosition.y - vW.y, 1e-3), 1., 40.);   // the fog sea seen on this same eye ray beyond the solid: no column of one tone up a sheer face
      col = mix(col, fzDeckCol(vec3(cameraPosition.x + rd.x * rt, dy, cameraPosition.z + rd.z * rt), cameraPosition), melt * (2. - melt)); } }
  gl_FragColor = vec4(col, 1.);
}`;

// The one solid material. mode: 'plain' | 'ashlar' | 'rock' | 'bark' | 'lines' | 'snow'. col = local dark, col2 = its close second
// value (default: col a little toward pearl). snow: 0..1 how readily up-facing facets take snow. grain: line/grain frequency per metre.
// centers: true if the geometry carries aC (per-vertex object centre) for the tone step of merged things.
// body: how far the undrawn surface stands from col toward col2 (the drawing goes down from it to col); leaf: the bark mode's hanging leaves.
const MODES = { plain: 0, ashlar: 1, rock: 2, bark: 3, lines: 4, snow: 5, fir: 6, plank: 7, canvas: 8 };   // canvas: K1
const CLOSE = mixHex(PALETTE[0], PALETTE[2], 0.2);          // umber's close second value: 6 percent off, toward violet slate
export function fzMaterial({ mode = 'plain', col = PALETTE[0], col2 = null, snow = 1, grain = 1.5, lift = 0.12, body = null, leaf = null, centers = false, side = THREE.FrontSide } = {}) {
  const c = lin(col), c2 = lin(col2 || (col === PALETTE[0] ? CLOSE : mixHex(col, PALETTE[4], 0.5)));
  return new THREE.ShaderMaterial({
    uniforms: { ...STYLE, uCol: { value: c }, uCol2: { value: c2 }, uMode: { value: MODES[mode] ?? 0 }, uSnowAmt: { value: snow }, uGrain: { value: grain }, uLift: { value: lift }, uSway: { value: new THREE.Vector2(0, 0.7) },
      uBody: { value: body ?? (mode === 'fir' || mode === 'snow' ? 0 : 0.4) }, uLeaf: { value: lin(leaf || col2 || CLOSE) } },
    defines: centers ? { FZ_CENTER: 1 } : {}, vertexShader: SOLID_VERT, fragmentShader: SOLID_FRAG, side,
  });
}

// Ribbons: twigs, cross arms, sticks, rigging. Geometry from ribbonGeometry(); never thinner than 1.5 px, and as the true width
// falls under that the colour goes to the fog/sky tone behind it instead of shimmering.
const RIB_VERT = /* glsl */`
${STYLE_GLSL}
uniform float uViewH; attribute vec3 aDir; attribute vec2 aSW; varying vec3 vW;
#ifdef FZ_CENTER
attribute vec3 aC;
#endif
 varying float vTone; varying float vCover;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz;
  vec4 c0 = projectionMatrix * viewMatrix * w; vec4 c1 = projectionMatrix * viewMatrix * (w + vec4(mat3(modelMatrix) * aDir, 0.));
  float asp = projectionMatrix[1][1] / max(projectionMatrix[0][0], 1e-4);
  vec2 s0 = c0.xy / max(abs(c0.w), 1e-4), s1 = c1.xy / max(abs(c1.w), 1e-4);
  vec2 d = (s1 - s0) * vec2(asp, 1.); float dl = length(d); d = dl > 1e-6 ? d / dl : vec2(1., 0.);
  float px = aSW.y * uViewH * projectionMatrix[1][1] / (2. * max(abs(c0.w), 1e-3));
  vCover = clamp(px / 1.5, 0., 1.); float hw = max(px, 1.5) / uViewH;
  c0.xy += vec2(-d.y / asp, d.x) * aSW.x * hw * c0.w;
  vec3 oc = modelMatrix[3].xyz;
  #ifdef FZ_CENTER
    oc = (modelMatrix * vec4(aC, 1.)).xyz;
  #endif
  vTone = fzToneStep(distance(cameraPosition, oc));
  gl_Position = c0;
}`;
const RIB_FRAG = /* glsl */`
${STYLE_GLSL}
uniform vec3 uCol; varying vec3 vW; varying float vTone; varying float vCover;
void main(){ vec3 f = fzFogCol(vW.y); vec3 col = fzMix(uCol, f, vTone); col = fzFog(col, cameraPosition, vW);
  vec3 bg = fzFog(f, cameraPosition, vW);                 // what a thinning ribbon goes to: the fog tone of its height as seen through the fog on this ray
  gl_FragColor = vec4(fzMix(bg, col, 0.3 + 0.7 * vCover), 1.); }`;
export function fzRibbonMaterial({ col = PALETTE[0], centers = false } = {}) {
  return new THREE.ShaderMaterial({ defines: centers ? { FZ_CENTER: 1 } : {}, uniforms: { ...STYLE, uCol: { value: lin(col) } }, vertexShader: RIB_VERT, fragmentShader: RIB_FRAG, side: THREE.DoubleSide });
}
// segs.cen (optional, 3 per segment): object centre for the tone step, with fzRibbonMaterial({ centers: true })
// segs: flat array [x0,y0,z0, x1,y1,z1, width] * n  ->  BufferGeometry for fzRibbonMaterial
export function ribbonGeometry(segs) {
  const n = segs.length / 7, pos = new Float32Array(n * 12), dir = new Float32Array(n * 12), sw = new Float32Array(n * 8), idx = new Uint32Array(n * 6);
  for (let i = 0; i < n; i++) {
    const o = i * 7, dx = segs[o + 3] - segs[o], dy = segs[o + 4] - segs[o + 1], dz = segs[o + 5] - segs[o + 2];
    for (let k = 0; k < 4; k++) {
      const e = k >> 1, v = i * 4 + k;
      pos[v * 3] = segs[o + e * 3]; pos[v * 3 + 1] = segs[o + e * 3 + 1]; pos[v * 3 + 2] = segs[o + e * 3 + 2];
      dir[v * 3] = dx; dir[v * 3 + 1] = dy; dir[v * 3 + 2] = dz; sw[v * 2] = (k & 1) ? 1 : -1; sw[v * 2 + 1] = segs[o + 6];
    }
    idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3], i * 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  g.setAttribute('aSW', new THREE.BufferAttribute(sw, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  if (segs.cen) { const c = new Float32Array(n * 12); for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { c[(i * 4 + k) * 3] = segs.cen[i * 3] ?? 0; c[(i * 4 + k) * 3 + 1] = segs.cen[i * 3 + 1] ?? 0; c[(i * 4 + k) * 3 + 2] = segs.cen[i * 3 + 2] ?? 0; } g.setAttribute('aC', new THREE.BufferAttribute(c, 3)); }
  return g;
}

// Level drifting mist: instanced soft quads that turn about the vertical only, slide along +Z of their mesh (toward the light),
// wrap inside uBox and take the fog colour of their height. The medium, moving. Geometry from mistGeometry().
const MIST_VERT = /* glsl */`
${STYLE_GLSL}
uniform vec4 uBox;   // z0, z1 (wrap range in mesh space), near fade m, speed scale
attribute vec4 aP; attribute vec4 aS;   // aP: x, y, z, seed   aS: width, height, speed m/s, opacity
varying vec2 vUv; varying float vA; varying vec3 vW; varying vec3 vL; varying float vSeed;
void main(){
  float span = max(uBox.y - uBox.x, 1.); float z = uBox.x + mod(aP.z - uBox.x + uTime * aS.z * uBox.w, span);
  float ends = smoothstep(0., 0.12, (z - uBox.x) / span) * (1. - smoothstep(0.88, 1., (z - uBox.x) / span));
  vec3 c = (modelMatrix * vec4(aP.x, aP.y + sin(uTime * 0.7 + aP.w * 40.) * 0.25, z, 1.)).xyz;
  vec3 tc = cameraPosition - c; vec2 f = tc.xz; float fl = length(f); f = fl > 1e-4 ? f / fl : vec2(0., 1.);
  vec3 right = vec3(f.y, 0., -f.x);
  vec3 w = c + right * position.x * aS.x + vec3(0., position.y * aS.y, 0.);
  vUv = position.xy * 2.; vW = w; vSeed = aP.w; vL = (inverse(modelMatrix) * vec4(w, 1.)).xyz;   // vL: the same place in the mesh's own frame (the ground map's)
  vA = aS.w * ends * smoothstep(uBox.z, uBox.z * 3.5, length(tc));
  // it lies level: seen from steeply above a sheet is not a dash but nothing; and the slab between it and the eye hides it
  float tl = max(length(tc), 1e-3); vA *= 1. - smoothstep(0.5, 0.85, abs(tc.y) / tl);
  float lo = min(cameraPosition.y, c.y), hi = max(cameraPosition.y, c.y), ov = max(0., min(hi, uSlab.y) - max(lo, uSlab.x));
  vA *= exp(-uSlab.z * tl * ov / max(hi - lo, 0.01));
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`;
const MIST_FRAG = /* glsl */`
${STYLE_GLSL}
uniform vec4 uTint; uniform vec4 uBox; uniform sampler2D uGround; uniform vec4 uGBox; uniform vec4 uGH;
varying vec2 vUv; varying float vA; varying vec3 vW; varying vec3 vL; varying float vSeed;
void main(){
  // a bell both ways: no flat core with a rim, so a far sheet is a breath and never a bar
  float ax = 1. - smoothstep(0.05, 1., abs(vUv.x)), ay = 1. - smoothstep(0., 1., abs(vUv.y)); float a = ax * ax * ay * ay;
  // a sheet fades to nothing where it meets a solid: over the ground map's height under it (red: what stands still; green: what
  // travels, read in its own frame), under a lintel (blue), and at the lens itself (each part of a wide sheet by its own distance)
  vec2 guv = (vL.xz - uGBox.xy) * uGBox.zw; vec4 gt = texture2D(uGround, guv); float gmv = texture2D(uGround, guv - vec2(0., uGH.z * uGBox.w)).g;
  float gy = uGH.x + uGH.y * max(gt.r, gmv);
  a *= smoothstep(gy + 0.1, gy + 0.1 + uGH.w, vL.y);
  if (gt.b < 0.995) { float cy = uGH.x + uGH.y * gt.b; a *= 1. - smoothstep(cy - uGH.w, cy, vL.y); }
  a *= smoothstep(uBox.z * 0.6, uBox.z * 3., distance(vW, cameraPosition));
  a *= 0.55 + 0.45 * fzNoise(vec3(vW.x * 0.25, vW.y * 0.9 + vSeed * 9., vW.z * 0.25 - uTime * 0.15));
  gl_FragColor = vec4(fzMix(fzFogCol(vW.y), uTint.rgb, uTint.a), clamp(a * vA, 0., 1.));
}`;
// tint (hex) and tintAmt 0..1: mist that catches a little of another pigment (the gap's light on sea mist); default none
// ground: a map from mistGround() of what the sheets must fade against (default: none); its uGH.z is the travel of the map's green channel
export function fzMistMaterial({ z0 = -40, z1 = 40, nearFade = 4, speed = 1, tint = PALETTE[4], tintAmt = 0, ground = null } = {}) {
  const tc = lin(tint), g = ground || NO_GROUND;
  return new THREE.ShaderMaterial({ uniforms: { ...STYLE, uBox: { value: new THREE.Vector4(z0, z1, nearFade, speed) }, uTint: { value: new THREE.Vector4(tc.r, tc.g, tc.b, tintAmt) },
    uGround: { value: g.tex }, uGBox: { value: new THREE.Vector4(g.x0, g.z0, 1 / (g.x1 - g.x0), 1 / (g.z1 - g.z0)) }, uGH: { value: new THREE.Vector4(g.h0, g.hs, 0, g.soft) } },
    vertexShader: MIST_VERT, fragmentShader: MIST_FRAG, transparent: true, depthWrite: false });
}
// The ground map of a mist field: nx by nz cells over x0..x1, z0..z1 in the mist mesh's own frame. fn(x, z, f) fills
// f = [floor, moving floor, lintel] in metres (lintel: the height a sheet must stay under, or null; f comes in as [h0, h0, null]);
// heights are kept as h0 + hs * byte / 255.
// soft: the metres over which a sheet fades above a floor or under a lintel. Built in steps (pass ctx.yield).
const groundTex = (data, nx, nz) => { const t = new THREE.DataTexture(data, nx, nz, THREE.RGBAFormat, THREE.UnsignedByteType); t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t; };
const NO_GROUND = { tex: groundTex(new Uint8Array([0, 0, 255, 255]), 1, 1), x0: 0, z0: 0, x1: 1, z1: 1, h0: -1e4, hs: 0, soft: 1 };
export async function mistGround({ x0, x1, z0, z1, nx, nz, h0, hs, soft = 1.2 }, fn, yieldFn = null) {
  const data = new Uint8Array(nx * nz * 4), q = (h) => clamp(Math.round((h - h0) / hs * 255), 0, 254), f = [h0, h0, null];
  for (let j = 0; j < nz; j++) { const z = lerp(z0, z1, (j + 0.5) / nz);
    for (let i = 0; i < nx; i++) { const o = (j * nx + i) * 4; f[0] = h0; f[1] = h0; f[2] = null; fn(lerp(x0, x1, (i + 0.5) / nx), z, f); data[o] = q(f[0]); data[o + 1] = q(f[1]); data[o + 2] = f[2] == null ? 255 : q(f[2]); data[o + 3] = 255; }
    if (yieldFn && j % 12 === 11) await yieldFn(); }
  return { tex: groundTex(data, nx, nz), x0, z0, x1, z1, h0, hs, soft };
}
// list: [{x,y,z,w,h,speed,opacity,seed}]
export function mistGeometry(list) {
  const g = new THREE.InstancedBufferGeometry(); const q = new THREE.PlaneGeometry(1, 1);
  g.index = q.index; g.setAttribute('position', q.getAttribute('position'));
  const P = new Float32Array(list.length * 4), S = new Float32Array(list.length * 4);
  list.forEach((m, i) => { P.set([m.x, m.y, m.z, m.seed ?? (i * 0.618) % 1], i * 4); S.set([m.w, m.h, m.speed ?? 2, m.opacity ?? 0.5], i * 4); });
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(P, 4)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(S, 4));
  g.instanceCount = list.length; return g;
}

// ---------------------------------------------------------------- geometry builder (positions + aVS + aC, quads and tubes)
export class FzGeo {
  constructor() { this.p = []; this.vs = []; this.c = []; this.i = []; this.n = 0; this.center = [0, 0, 0]; this.v = 0; this.s = 0; this.mat = null; }
  vert(x, y, z, v = this.v, s = this.s) {
    if (this.mat) { const e = this.mat.elements, X = x, Y = y, Z = z; x = e[0] * X + e[4] * Y + e[8] * Z + e[12]; y = e[1] * X + e[5] * Y + e[9] * Z + e[13]; z = e[2] * X + e[6] * Y + e[10] * Z + e[14]; }
    this.p.push(x, y, z); this.vs.push(v, s); this.c.push(this.center[0], this.center[1], this.center[2]); return this.n++; }
  quad(a, b, c, d, v = this.v, s = this.s) {   // corners in order round the quad, each [x,y,z]
    const k = this.vert(a[0], a[1], a[2], v, s); this.vert(b[0], b[1], b[2], v, s); this.vert(c[0], c[1], c[2], v, s); this.vert(d[0], d[1], d[2], v, s);
    this.i.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  tri(a, b, c, v = this.v, s = this.s) { const k = this.vert(a[0], a[1], a[2], v, s); this.vert(b[0], b[1], b[2], v, s); this.vert(c[0], c[1], c[2], v, s); this.i.push(k, k + 1, k + 2); }
  // skin between successive rings (arrays of [x,y,z,(v),(s)] of equal length); closed = wrap round the ring
  rings(rs, closed = true) {
    const m = rs[0].length, base = this.n;
    for (const r of rs) for (const q of r) this.vert(q[0], q[1], q[2], q[3] ?? this.v, q[4] ?? this.s);
    for (let a = 0; a + 1 < rs.length; a++) for (let b = 0; b < (closed ? m : m - 1); b++) {
      const k0 = base + a * m + b, k1 = base + a * m + (b + 1) % m, k2 = k0 + m, k3 = k1 + m; this.i.push(k0, k1, k3, k0, k3, k2);
    }
  }
  // six-sided block from 8 corners: bottom ring b[0..3], top ring t[0..3] (same order); top takes value s
  hexa(b, t, v = this.v, sTop = this.s) {
    for (let k = 0; k < 4; k++) this.quad(b[k], b[(k + 1) % 4], t[(k + 1) % 4], t[k], v, 0);
    this.quad(t[0], t[1], t[2], t[3], v, sTop); this.quad(b[3], b[2], b[1], b[0], v, 0);
  }
  box(x0, x1, y0, y1, z0, z1, v = this.v, sTop = this.s) {
    this.hexa([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], v, sTop);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('aVS', new THREE.Float32BufferAttribute(this.vs, 2));
    g.setAttribute('aC', new THREE.Float32BufferAttribute(this.c, 3)); g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    g.computeBoundingSphere(); return g;
  }
  get tris() { return this.i.length / 3; }
}

// pointed-arch opening: half width hw, sill y0, springing ys, arc centres at (+-cx, ys). Signed distance (approx), outside > 0.
const archD = (x, y, A) => { const ax = Math.abs(x); return y < A.ys ? Math.max(ax - A.hw, A.y0 - y) : Math.hypot(ax + A.cx, y - A.ys) - (A.hw + A.cx); };
const archApex = (A, d = 0) => A.ys + Math.sqrt(Math.max((A.hw + A.cx + d) ** 2 - A.cx * A.cx, 0));
// point k of n along the outline offset outward by d: up the port... (-x) jamb, over the head, down the other jamb
function archPt(A, t, d, nArc) {
  const r = A.hw + A.cx + d, am = Math.acos(clamp(A.cx / r, -1, 1));
  if (t <= 0) return [-(A.hw + d), A.y0]; if (t >= 2 + 2 * nArc) return [A.hw + d, A.y0];
  if (t <= nArc + 1) { const a = am * (t - 1) / nArc; return t < 1 ? [-(A.hw + d), lerp(A.y0, A.ys, t)] : [A.cx - r * Math.cos(a), A.ys + r * Math.sin(a)]; }
  const q = archPt(A, 2 + 2 * nArc - t, d, nArc); return [-q[0], q[1]];
}
// sweep a (d, z, value) profile round an arch outline; zc = z of the wall's mid plane
function sweepArch(G, A, prof, nArc, zc = 0) {
  const rs = [];
  for (let t = 0; t <= 2 + 2 * nArc; t++) rs.push(prof.map((q) => { const p = archPt(A, t, q[0], nArc); return [p[0] + (A.x || 0), p[1], zc + q[1], q[2] ?? 0, q[3] ?? 0]; }));
  G.rings(rs, false);
}
// moulded jamb profile for a wall of half thickness zf: outer hood band, then `rolls` roll mouldings splaying in to a centre fillet; both faces
function jambProfile(zf, band, splay, rolls, fillet = 0.22, proud = 0.12) {
  const half = [[band, zf, 0], [band, zf + proud, 0.15], [splay + 0.12, zf + proud, 0.25], [splay, zf, -0.5]];
  const ax = splay, az = zf, bx = 0, bz = fillet, L = Math.hypot(ax - bx, az - bz), nx = -(az - bz) / L, nz = (ax - bx) / L;
  for (let k = 0; k < rolls; k++) {
    const px = lerp(ax, bx, k / rolls), pz = lerp(az, bz, k / rolls), qx = lerp(ax, bx, (k + 1) / rolls), qz = lerp(az, bz, (k + 1) / rolls), r = L / rolls / 2;
    for (let j = 1; j <= 5; j++) { const th = Math.PI * j / 6, f = (1 - Math.cos(th)) / 2, b = Math.sin(th) * r * 0.9; half.push([lerp(px, qx, f) + nx * b, lerp(pz, qz, f) + nz * b, [-0.3, 1, 2.5, 1, -0.3][j - 1]]); }   // K5: each roll's crest at the full second value (2.5 times the stone's lift of 0.2 over its body of 0.5), its flanks half way (they were 0.85 and 0.3: a crest a quarter of the way)
    half.push([qx, qz, -1]);
  }
  return half.concat(half.slice().reverse().map((q) => [q[0], -q[1], q[2]]));
}

// a flat bar of tracery following a path in the wall plane: pts [[x,y],...], width w in plane, depth dz through the wall, chamfered arrises
function traceryBar(G, pts, w, dz, zc = 0) {
  const rs = [];
  for (let k = 0; k < pts.length; k++) {
    const a = pts[Math.max(k - 1, 0)], b = pts[Math.min(k + 1, pts.length - 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L, p = pts[k], t = (p[2] ?? 1) * w * 0.5, c = t * 0.45;
    const sec = [[t, dz - c, 1], [t - c, dz, 2.5], [-t + c, dz, 2.5], [-t, dz - c, 1], [-t, -dz + c, -0.3], [-t + c, -dz, 2.5], [t - c, -dz, 2.5], [t, -dz + c, -0.3]];   // K5: the bar's two faces at the full second value, its chamfers half way, its sides dark as they were (the faces were 0.35 and 0.2, the chamfers 0.1)
    rs.push(sec.map((q) => [p[0] + nx * q[0], p[1] + ny * q[0], zc + q[1], q[2], 0]));
  }
  G.rings(rs, true);
  for (const e of [rs[0], rs[rs.length - 1]]) { G.quad(e[0], e[1], e[2], e[3], -0.6, 0); G.quad(e[0], e[3], e[4], e[7], -0.6, 0); G.quad(e[4], e[5], e[6], e[7], -0.6, 0); }   // broken ends
}

// The west wall: ashlar slab with a ruined head (slanted and sheer breaks of differing size, a leaning fragment), the great lancet (the wall's one window), a door under it,
// moulded surrounds, buttresses with snow-catching set-offs, plinth, string course, sill and the tracery stump.
const WALL = { W: 34, zf: 1.2, main: { hw: 4.5, y0: 6.5, ys: 27, cx: 7.78 }, door: { hw: 1.6, y0: 0, ys: 2.3, cx: 1.2 } };
async function buildWall(G, rng, noise, ctx) {
  const { W, zf, main, door } = WALL, cw = 0.45, ch = 0.6, BL = 1.8, NI = 76, NJ = 74, X0 = -NI * cw / 2;   // ashlar: 0.6 m courses, blocks 1.8 m long, half-lapped
  const sh = [0, 1].map(() => ({ h0: rng.range(28.5, 33), slope: rng.range(0.5, 1.3), bite: rng.range(0.6, 2.2), seed: rng.range(0, 50) }));
  const lean = rng.range(-1.5, 1.5), peak = rng.range(40.6, 42.2);
  const breach = { x: rng.sign() * rng.range(11, 16), y: rng.range(24, 31), r: rng.range(2.5, 4.5) };
  // the ruined head: one broken profile of slanted cuts and sheer breaks of differing size (never a regular staircase). Breakpoints
  // lie on column edges 0.45 to 4 m apart; between them the head runs straight on the slant; at some it drops or rises sheer.
  const hsh = (k, q) => { const v = Math.sin(k * 127.1 + q * 311.7 + sh[0].seed * 0.37) * 43758.5453; return v - Math.floor(v); };
  const hood = (ax) => (ax < main.hw + 1.95 ? main.ys + Math.sqrt(Math.max((main.hw + main.cx + 1.95) ** 2 - (ax + main.cx) ** 2, 0)) + 0.8 : 0);
  const env = (x) => {
    const ax = Math.abs(x), s = sh[x < 0 ? 0 : 1], centre = (q) => peak + 0.9 - 0.42 * Math.abs(q - lean);
    let h = ax < 7.4 ? centre(x) : Math.max(s.h0 - (ax - 8.6) * s.slope, centre(Math.sign(x) * 7.4) - (ax - 7.4) * 3.4);
    if (ax > 15.4) h = Math.min(h, 27 - (ax - 15.4) * 7.5);                                       // the corners are broken down on the slant
    return h;
  };
  const floorAt = (x) => { const ax = Math.abs(x); return Math.max(hood(ax), Math.abs(ax - 12.5) < 2.7 ? 22.6 : ax > 15.4 ? 12.5 : 17.5); };
  const bpI = [0], bpL = [], bpR = [];                                                            // breakpoints: column index, height on its left and right
  for (let k = 0; bpI[k] < NI; k++) { const r = hsh(k, 1.3); bpI.push(Math.min(NI, bpI[k] + (r < 0.5 ? 1 + Math.floor(r * 6) : 4 + Math.floor((r - 0.5) * 11)))); }
  for (let k = 0; k < bpI.length; k++) {
    const x = X0 + bpI[k] * cw, ax = Math.abs(x), amp = ax < 7.4 ? 1.1 : 1.9;
    let h = env(x) + (hsh(k, 2.7) - 0.5) * 2 * amp - (hsh(k, 4.1) < 0.16 ? 2 + 3.5 * hsh(k, 5.9) : 0);
    const t = (x - (breach.x - breach.r)) / (2 * breach.r); if (t > 0 && t < 1) h = Math.min(h, breach.y - 3.5 + 5 * t);   // the breach: a deep cut, sheer on one side, slanting up the other
    const jump = hsh(k, 7.3) < 0.42 ? (hsh(k, 8.9) - 0.5) * 5.5 : 0;
    bpL.push(Math.max(h, floorAt(x))); bpR.push(Math.max(h + jump, floorAt(x)));
  }
  const hL = new Float32Array(NI), hR = new Float32Array(NI);
  for (let k = 0; k + 1 < bpI.length; k++) for (let i = bpI[k]; i < bpI[k + 1]; i++) {
    const n = bpI[k + 1] - bpI[k]; hL[i] = lerp(bpR[k], bpL[k + 1], (i - bpI[k]) / n); hR[i] = lerp(bpR[k], bpL[k + 1], (i + 1 - bpI[k]) / n);
    const xa = X0 + i * cw; hL[i] = Math.max(hL[i], hood(Math.abs(xa))); hR[i] = Math.max(hR[i], hood(Math.abs(xa + cw)));
  }
  const topY = (x) => { const i = clamp(Math.floor((x - X0) / cw), 0, NI - 1); return Math.min(hL[i], hR[i]); };
  const keep = new Uint8Array(NI * NJ);
  for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) {
    const x = X0 + (i + 0.5) * cw, y = (j + 0.5) * ch;
    let k = (j + 1) * ch <= Math.min(hL[i], hR[i]) ? 1 : 0;
    if (archD(x, y, main) < 1.4 || archD(x, y, door) < 0.6) k = 0;
    if (y < 1) k = Math.abs(x) > 2.2 ? 1 : 0;
    keep[j * NI + i] = k;
  }
  const K = (i, j) => (i < 0 || j < 0 || i >= NI || j >= NJ ? 0 : keep[j * NI + i]);
  for (let j = 0; j < NJ; j++) {
    const y0 = j * ch, y1 = y0 + ch;
    for (let i = 0; i < NI; i++) {
      if (!K(i, j)) continue;
      let e = i; while (K(e + 1, j)) e++;
      const x0 = X0 + i * cw, x1 = X0 + (e + 1) * cw;
      G.quad([x0, y0, zf], [x1, y0, zf], [x1, y1, zf], [x0, y1, zf]); G.quad([x1, y0, -zf], [x0, y0, -zf], [x0, y1, -zf], [x1, y1, -zf]);
      for (let c = i; c <= e; c++) {
        const a = X0 + c * cw, b = a + cw;
        if (!K(c, j + 1) && (j + 2) * ch <= Math.min(hL[c], hR[c])) G.quad([a, y1, zf], [b, y1, zf], [b, y1, -zf], [a, y1, -zf], -0.25, 0);   // K5: snow on every ledge: a ledge of the broken head takes the snow its upper side takes (it was held to a dusting: -0.8)
        if (!K(c, j - 1) && j > 0) G.quad([a, y0, -zf], [b, y0, -zf], [b, y0, zf], [a, y0, zf], -0.7, 0);
      }
      G.quad([x0, y0, -zf], [x0, y0, zf], [x0, y1, zf], [x0, y1, -zf], -0.45, 0); G.quad([x1, y0, zf], [x1, y0, -zf], [x1, y1, -zf], [x1, y1, zf], -0.45, 0);
      i = e;
    }
    if (j % 20 === 19) await ctx.yield();
  }
  // the head itself: each column is closed on the slant of the profile, with sheer faces where the profile breaks
  for (let i = 0; i <= NI; i++) {
    const xa = X0 + i * cw, xb = xa + cw, jt = i < NI ? Math.floor(Math.min(hL[i], hR[i]) / ch + 1e-6) - 1 : -1, has = i < NI && jt >= 0 && K(i, jt);
    if (has) { const yb = (jt + 1) * ch, a = hL[i], b = hR[i];
      G.quad([xa, yb, zf], [xb, yb, zf], [xb, b, zf], [xa, a, zf]); G.quad([xb, yb, -zf], [xa, yb, -zf], [xa, a, -zf], [xb, b, -zf]);
      G.quad([xa, a, zf], [xb, b, zf], [xb, b, -zf], [xa, a, -zf], -0.25, 0); }
    const pj = i > 0 ? Math.floor(Math.min(hL[i - 1], hR[i - 1]) / ch + 1e-6) - 1 : -1, pHas = i > 0 && pj >= 0 && K(i - 1, pj);
    const ya = pHas ? hR[i - 1] : (has ? (jt + 1) * ch - 0 : 0), yc = has ? hL[i] : (pHas ? (pj + 1) * ch : 0);
    if ((has || pHas) && Math.abs(ya - yc) > 0.02) { const lo = Math.min(ya, yc, has ? (jt + 1) * ch : 1e9, pHas ? (pj + 1) * ch : 1e9), hi = Math.max(ya, yc); G.quad([xa, lo, -zf], [xa, lo, zf], [xa, hi, zf], [xa, hi, -zf], -0.45, 0); }
  }
  // a leaning fragment left standing on the shoulder away from the breach
  { const m = -Math.sign(breach.x) || 1, fx = m * (10.6 + hsh(3, 9.1) * 1.6), fy = topY(fx) - 0.6, fh = 4.2 + hsh(5, 9.7) * 2.2, w = 0.7 + hsh(7, 3.3) * 0.5;
    G.mat = new THREE.Matrix4().makeRotationZ(-m * (0.1 + hsh(9, 2.1) * 0.07)).setPosition(fx, fy, 0);
    G.hexa([[-w, 0, -zf * 0.92], [w, 0, -zf * 0.92], [w, 0, zf * 0.92], [-w, 0, zf * 0.92]], [[-w * 0.85, fh * (m > 0 ? 0.72 : 1), -zf * 0.9], [w * 0.7, fh * (m > 0 ? 1 : 0.72), -zf * 0.9], [w * 0.7, fh * (m > 0 ? 1 : 0.72), zf * 0.9], [-w * 0.85, fh * (m > 0 ? 0.72 : 1), zf * 0.9]], 0, 0);
    G.mat = null; }
  // moulded surrounds
  sweepArch(G, main, jambProfile(zf, 1.95, 1.2, 3), 14);
  sweepArch(G, door, jambProfile(zf, 1.25, 0.34, 1, 0.5, 0.08), 6);
  // shaft rings and imposts on the jambs: moulded bands that follow the rolls round, a thin pale line on the upper side of each
  { const prof = jambProfile(zf, 1.95, 1.2, 3), n = prof.length, core = prof.slice(3, n - 3);
    for (const m of [-1, 1]) for (const [y, h, out] of [[13.2, 0.3, 0.1], [20.4, 0.3, 0.1], [main.ys - 0.55, 0.55, 0.17]]) {
      const yy = y + rng.range(-0.3, 0.3); rng.range(-0.3, 0.3);
      const lvl = (dy, o, v, sn) => core.map((q) => { const k = Math.hypot(q[0] - 0.3, q[1]) || 1; return [m * (main.hw + q[0] - o * 0.75 + o * 0.25 * (q[0] - 0.3) / k), yy + dy, q[1] + o * 1.1 * q[1] / k, v, sn]; });
      G.rings([lvl(0, 0, -0.6, 0), lvl(h * 0.3, out, 0.25, 0), lvl(h * 0.75, out, 0.5, 0), lvl(h * 0.76, out, 0.9, 1), lvl(h, out * 0.2, 0.9, 1)], false);
    } }
  // sill: weathered slope either face, snow lies on it
  const sx = main.hw + 1.95, sy = main.y0;
  for (const s of [1, -1]) G.hexa([[-sx, 5.25, 0], [sx, 5.25, 0], [sx, 5.25, s * (zf + 0.42)], [-sx, 5.25, s * (zf + 0.42)]],
    [[-sx, sy + 0.05, 0], [sx, sy + 0.05, 0], [sx, sy - 0.5, s * (zf + 0.42)], [-sx, sy - 0.5, s * (zf + 0.42)]], 0.1, 0);   // K5: snow on the sill: its weathered slope takes the snow its upper side takes (it was held off: -0.93)
  for (const s of [1, -1]) G.box(-sx, sx, sy - 0.52, sy - 0.4, Math.min(s * (zf + 0.2), s * (zf + 0.46)), Math.max(s * (zf + 0.2), s * (zf + 0.46)), 0.1, 1);
  // plinth with chamfer and string course, both faces
  for (const s of [1, -1]) for (const m of [1, -1]) {
    const a = m * 2.95, b = m * (W / 2 + 0.15), z0 = s * zf, z1 = s * (zf + 0.34);
    G.box(Math.min(a, b), Math.max(a, b), 0, 1.0, Math.min(z0, z1), Math.max(z0, z1), -0.15, 0);
    G.hexa([[a, 1.0, z0], [b, 1.0, z0], [b, 1.0, z1], [a, 1.0, z1]], [[a, 1.45, z0], [b, 1.45, z0], [b, 1.42, s * (zf + 0.05)], [a, 1.42, s * (zf + 0.05)]], 0.2, 0);   // K5: snow on the plinth's ledge as on every ledge (it was held to two fifths: -0.6)
    const c = m * (sx - 0.1), z2 = s * (zf + 0.26);
    G.hexa([[c, 5.3, z0], [b, 5.3, z0], [b, 5.38, z2], [c, 5.38, z2]], [[c, 5.72, z0], [b, 5.72, z0], [b, 5.6, z2], [c, 5.6, z2]], 0.25, 0);
  }
  // buttresses: three stages with sloped set-offs; the pair by the lancet tall, the corner pair short
  const butt = (x, w, stages, s) => {
    let y = 0;
    for (const [h, proj] of stages) {
      const z0 = s * zf, z1 = s * (zf + proj), a = x - w / 2, b = x + w / 2, top = y + h, rise = proj * 3.2;   // steep weathered set-offs: snow holds only on the thin ledge at their head
      G.hexa([[a, y, z0], [b, y, z0], [b, y, z1], [a, y, z1]], [[a, top + rise, z0], [b, top + rise, z0], [b, top, z1], [a, top, z1]], 0.05, 0);
      G.hexa([[a - 0.1, top - 0.28, z0], [b + 0.1, top - 0.28, z0], [b + 0.1, top - 0.28, z1 + s * 0.12], [a - 0.1, top - 0.28, z1 + s * 0.12]],
        [[a - 0.1, top + rise, z0], [b + 0.1, top + rise, z0], [b + 0.1, top, z1 + s * 0.12], [a - 0.1, top, z1 + s * 0.12]], 0.3, 0);   // drip mould
      G.box(a - 0.12, b + 0.12, top + rise - 0.02, top + rise + 0.1, Math.min(z0, z0 + s * 0.26), Math.max(z0, z0 + s * 0.26), 0.3, 0);   // the ledge: a thin pearl line
      y = top - 0.01;
    }
  };
  for (const m of [-1, 1]) {
    const hgt = sh[m < 0 ? 0 : 1].h0 - 1.5;
    butt(m * 8.7, 1.9, [[11, 2.5], [hgt * 0.36, 1.7], [hgt * 0.64 - 11, 0.95]], 1); butt(m * 8.7, 1.9, [[9, 1.3], [hgt * 0.5, 0.7]], -1);
    butt(m * 16.1, 1.7, [[7.5, 1.9], [6.5, 1.0]], 1); butt(m * 16.1, 1.7, [[8, 1.0]], -1);
  }
  // the tracery stump in the head: on one side only, the sub-arch's springer off the jamb with its capital, carrying a short
  // stub of the oculus ring broken back to a ragged end, one cusp left on it; the rest of the head is empty
  const oc = { x: 0, y: main.ys + 5.0, r: 2.15 }, brk = rng.sign(), reach = rng.range(0.7, 1.0), pts = [];
  for (let k = 0; k <= 10; k++) { const a = k / 10; pts.push([brk * (main.hw + 0.05 - 5.4 * (1 - Math.cos(a))), main.ys - 1.5 + 5.4 * Math.sin(a) + 1.5 * a]); }
  traceryBar(G, pts, 0.4, 0.3);
  traceryBar(G, [[brk * (main.hw + 0.1), main.ys - 1.9], [brk * (main.hw - 0.35), main.ys - 1.5]], 0.7, 0.42);   // capital
  const e = pts[10], a0 = Math.atan2(e[1] - oc.y, Math.abs(e[0])), ringAt = (a, r = oc.r) => [oc.x + brk * Math.cos(a) * r, oc.y + Math.sin(a) * r];
  const ring = []; for (let k = 0; k <= 8; k++) ring.push(ringAt(lerp(a0, a0 + reach, k / 8)));
  traceryBar(G, ring, 0.5, 0.32);
  { const a = a0 + reach * 0.45, d = 0.24; traceryBar(G, [ringAt(a - d), [...ringAt(a, oc.r - 0.62), 0.6], ringAt(a + d)], 0.3, 0.2); }   // the one cusp, into the eye
  const perch = ring[8];
  return { sh, peak, lean, perch, topY };
}


// generic ashlar slab from a keep(x, y) test on whole blocks: faces at zc +- zf, broken edges closed through the thickness
function slabCells(G, x0, W, H, zc, zf, keepFn, topFn = null) {
  const cw = 0.45, ch = 0.6, BL = 1.8, NI = Math.round(W / cw), NJ = Math.round(H / ch), keep = new Uint8Array(NI * NJ);
  for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) { const x = x0 + (i + 0.5) * cw, y = (j + 0.5) * ch, off = 0.5 * (j & 1); keep[j * NI + i] = (topFn ? (j + 1) * ch <= Math.min(topFn(i, 0), topFn(i, 1)) : true) && keepFn(topFn ? x : (Math.floor(x / BL + off) + 0.5 - off) * BL, y, x) ? 1 : 0; }
  const K = (i, j) => (i < 0 || j < 0 || i >= NI || j >= NJ ? 0 : keep[j * NI + i]), a = zc + zf, b = zc - zf;
  for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) {
    if (!K(i, j)) continue;
    const xa = x0 + i * cw, xb = xa + cw, ya = j * ch, yb = ya + ch;
    G.quad([xa, ya, a], [xb, ya, a], [xb, yb, a], [xa, yb, a]); G.quad([xb, ya, b], [xa, ya, b], [xa, yb, b], [xb, yb, b]);
    if (!K(i, j + 1)) G.quad([xa, yb, a], [xb, yb, a], [xb, yb, b], [xa, yb, b], -0.25, 0);
    if (!K(i, j - 1) && j > 0) G.quad([xa, ya, b], [xb, ya, b], [xb, ya, a], [xa, ya, a], -0.7, 0);
    if (!K(i - 1, j)) G.quad([xa, ya, b], [xa, ya, a], [xa, yb, a], [xa, yb, b], -0.45, 0);
    if (!K(i + 1, j)) G.quad([xb, ya, a], [xb, ya, b], [xb, yb, b], [xb, yb, a], -0.45, 0);
  }
  if (topFn) for (let i = 0; i <= NI; i++) {
    const xa = x0 + i * cw, xb = xa + cw, tj = (q) => Math.floor(Math.min(topFn(q, 0), topFn(q, 1)) / ch + 1e-6) - 1;
    const jt = i < NI ? tj(i) : -1, has = jt >= 0 && K(i, jt), pj = i > 0 ? tj(i - 1) : -1, pHas = pj >= 0 && K(i - 1, pj);
    if (has) { const yb = (jt + 1) * ch, l = topFn(i, 0), r = topFn(i, 1);
      G.quad([xa, yb, a], [xb, yb, a], [xb, r, a], [xa, l, a]); G.quad([xb, yb, b], [xa, yb, b], [xa, l, b], [xb, r, b]); G.quad([xa, l, a], [xb, r, a], [xb, r, b], [xa, l, b], -0.25, 0); }
    if (has || pHas) { const lo = Math.min(has ? (jt + 1) * ch : 1e9, pHas ? (pj + 1) * ch : 1e9), hi = Math.max(has ? topFn(i, 0) : 0, pHas ? topFn(i - 1, 1) : 0); if (hi - lo > 0.02) G.quad([xa, lo, b], [xa, lo, a], [xa, hi, a], [xa, hi, b], -0.45, 0); }
  }
}

// a clustered pier stump: moulded base, lobed shaft, a top broken on the slant with snow on it; tall ones keep a rib springer
function pierStump(G, rng, x, z, h, R = 1.25) {
  const N = 16, sec = (r, y, v, s = 0, lob = 0.22, tilt = 0) => { const ring = [];
    for (let k = 0; k < N; k++) { const a = k / N * Math.PI * 2, rr = r * (1 + lob * Math.cos(a * 4)); ring.push([x + Math.cos(a) * rr, y + tilt * Math.cos(a - tl) * r, z + Math.sin(a) * rr, v + (k % 4 === 2 ? -0.5 : 0), s]); } return ring; };
  const tl = rng.range(0, 6.28), slant = rng.range(0.25, 0.9);
  G.rings([sec(R * 1.55, 0, -0.1, 0, 0.05), sec(R * 1.55, 0.7, -0.1, 0, 0.05), sec(R * 1.4, 0.95, 0.3, 0.9, 0.08), sec(R * 1.18, 1.25, -0.4, 0, 0.15), sec(R * 1.22, 1.5, 0.3, 0.6),
    sec(R, 1.8, 0), sec(R, h * 0.55, 0.05), sec(R, h - slant, 0, 0, 0.22, slant), sec(R * 0.55, h + 0.15, 0.1, 1, 0.1, slant * 0.6), sec(0.01, h + 0.3, 0.1, 1, 0, 0)], true);
  if (h > 8.5) {                                         // springer: the first metres of a rib leaning toward the nave
    const dir = x > 0 ? -1 : 1, pts = []; for (let k = 0; k <= 6; k++) { const a = k / 6 * 0.75; pts.push([x + dir * (R * 0.6 + 3.2 * (1 - Math.cos(a))), h - 1.2 + 3.2 * Math.sin(a), 1 - k * 0.07]); }
    traceryBar(G, pts, 0.75, 0.45, z);
  }
}

// the choir arch: two piers and a moulded pointed arch with a ragged crown of masonry, standing alone at the end of the nave
const CHOIR = { hw: 6.5, y0: 0, ys: 12, cx: 4.5 };
function buildChoirArch(G, rng, noise, zc) {
  const A = CHOIR, zf = 0.95, top = archApex(A), sd = rng.range(0, 40), low = rng.sign();
  const hs = (k) => { const v = Math.sin(k * 91.7 + sd * 3.1) * 43758.5453; return v - Math.floor(v); };
  slabCells(G, -11.7, 23.4, 30, zc, zf, (bx, y, x) => {
    const d = archD(x, y, A); if (d < 1.0) return false;
    const ax = Math.abs(bx), lim = A.hw + 3.6 + (y > A.ys ? 0.4 : 0) + noise.n2(y * 0.3, sd) * 0.5; if (ax > lim) return false;
    return true; }, (i, e) => {                                              // the crown: slanted breaks of differing size
    const x = -11.7 + (i + e) * 0.45, ax = Math.abs(x), id = Math.floor(i / 3 + hs(Math.floor(i / 7)) * 1.5);
    return Math.max(top + 2.6 - ax * (x * low > 0 ? 0.95 : 0.45) + noise.n2(x * 0.5, sd + 5) * 1.4 + (hs(id + 40) - 0.5) * 2.6 - (hs(id + 80) < 0.18 ? 2.5 : 0), ax < A.hw + 1.6 ? A.ys + Math.sqrt(Math.max((A.hw + A.cx + 1.6) ** 2 - (ax + A.cx) ** 2, 0)) + 0.7 : 9); });
  sweepArch(G, A, jambProfile(zf, 1.6, 0.7, 2, 0.2, 0.1), 12, zc);
  for (const m of [-1, 1]) for (const s of [1, -1]) {     // pier bases and a set-off
    const a = m * (A.hw + 0.2), b = m * (A.hw + 4.0), z0 = zc + s * zf, z1 = zc + s * (zf + 0.4);
    G.box(Math.min(a, b), Math.max(a, b), 0, 1.1, Math.min(z0, z1), Math.max(z0, z1), -0.15, 0);
    G.hexa([[a, 11.4, z0], [b, 11.4, z0], [b, 11.5, z0 + s * 0.3], [a, 11.5, z0 + s * 0.3]], [[a, 11.9, z0], [b, 11.9, z0], [b, 11.75, z0 + s * 0.3], [a, 11.75, z0 + s * 0.3]], 0.25, 0);
  }
}

// a leaning wooden grave cross with a little gabled roof, as he drew them; origin at its foot
function graveCross(G, rng, x, y, z) {
  const h = rng.range(1.7, 2.9), w = h * rng.range(0.42, 0.55), t = 0.11, roof = rng.chance(0.6);
  G.mat = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rng.range(-0.22, 0.22), rng.range(-0.5, 0.5), rng.range(-0.3, 0.3))).setPosition(x, y - 0.3, z);
  G.hexa([[-t, 0, -t * 0.7], [t, 0, -t * 0.7], [t, 0, t * 0.7], [-t, 0, t * 0.7]], [[-t * 0.8, h, -t * 0.6], [t * 0.8, h, -t * 0.6], [t * 0.8, h, t * 0.6], [-t * 0.8, h, t * 0.6]], 0, 0.9);
  G.box(-w, w, h * 0.68, h * 0.68 + t * 1.8, -t * 0.6, t * 0.6, 0.1, 1);
  if (roof) for (const m of [-1, 1]) G.hexa([[0, h + 0.02, -t * 1.6], [m * (w + 0.12), h * 0.68 + 0.02, -t * 1.6], [m * (w + 0.12), h * 0.68 + 0.02, t * 1.6], [0, h + 0.02, t * 1.6]],
    [[0, h + 0.16, -t * 1.6], [m * (w + 0.2), h * 0.68 + 0.1, -t * 1.6], [m * (w + 0.2), h * 0.68 + 0.1, t * 1.6], [0, h + 0.16, t * 1.6]], -0.2, 1);
  G.mat = null;
}


// ---------------------------------------------------------------- the clawed bare oak
// buildOak(G, R, rng, o): wood goes into the FzGeo G (use fzMaterial({ mode: 'bark', centers: true })), twigs into the flat array R
// (ribbonGeometry(R) + fzRibbonMaterial). o: { x, y, z, h (30..38), lean, twigs (0.6..1), leaves (0..1) }. Boughs kink at elbows,
// fork, and end in hooked claws; snow is the shader's (every upper side); a few russet leaves hang on (aVS.x = 1 -> col2).
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _q = new THREE.Quaternion();
function perpTo(d, rng) { _a.set(rng() - 0.5, rng() - 0.5, rng() - 0.5).cross(d); if (_a.lengthSq() < 1e-6) _a.set(1, 0, 0).cross(d); return _a.normalize(); }
function kinked(d, ang, rng) { return d.clone().applyQuaternion(_q.setFromAxisAngle(perpTo(d, rng), ang)).normalize(); }
function limbTube(G, pts, rad, sides) {
  const rs = [];
  for (let k = 0; k < pts.length; k++) {
    const t = _b.subVectors(pts[Math.min(k + 1, pts.length - 1)], pts[Math.max(k - 1, 0)]).normalize();
    const u = _a.set(0.31, 0.2, 0.93).cross(t).normalize().clone(), w = _c.crossVectors(t, u).clone(), ring = [];
    for (let j = 0; j < sides; j++) { const a = j / sides * Math.PI * 2 + k * 0.4, ca = Math.cos(a) * rad[k], sa = Math.sin(a) * rad[k];
      const upy = (u.y * ca + w.y * sa) / Math.max(rad[k], 1e-4);
      ring.push([pts[k].x + u.x * ca + w.x * sa, pts[k].y + u.y * ca + w.y * sa, pts[k].z + u.z * ca + w.z * sa, (j & 1) ? -0.25 : 0, clamp(upy, 0, 1) * smoothstep(0.045, 0.15, rad[k])]); }   // the thinnest boughs carry none
    rs.push(ring);
  }
  G.rings(rs, true);
}
function oakLimb(G, R, rng, p0, dir, len, r, depth, o) {
  const trunk = depth === 0, nseg = trunk ? 4 : 3 + (rng() < 0.45 ? 1 : 0), pts = [p0.clone()], rad = [r], dirs = [dir.clone()];
  let d = dir.clone(), p = p0.clone();
  for (let s = 1; s <= nseg; s++) {
    d = kinked(d, trunk ? rng.range(0.08, 0.28) : depth === 1 ? rng.range(0.3, 0.7) : rng.range(0.45, 0.95), rng);
    if (!trunk) { d.y += s < nseg ? (depth === 1 ? 0.45 : 0.25) : (depth >= 2 ? -0.4 : 0.1); const out = Math.hypot(p.x - o.x, p.z - o.z) || 1; d.x += (p.x - o.x) / out * 0.18; d.z += (p.z - o.z) / out * 0.18; d.normalize(); }
    p = p.clone().addScaledVector(d, len / nseg * rng.range(0.7, 1.3));
    if (o.keepOut && o.keepOut(p)) { if (s === 1) return; break; }      // a bough that would cross the flight line is a broken stub
    pts.push(p); dirs.push(d.clone()); rad.push(r * lerp(1, trunk ? 0.72 : 0.42, s / nseg) * (s < nseg && !trunk ? rng.range(0.95, 1.2) : 1));
  }
  if (trunk) { pts.unshift(p0.clone().addScaledVector(dir, -1.2)); rad.unshift(r * 1.75); pts.splice(1, 0, p0.clone().addScaledVector(dir, 0.9)); rad.splice(1, 0, r * 1.25); rad[2] = r * 1.02; }
  limbTube(G, pts, rad, depth < 2 ? 7 : 5);
  const base = trunk ? 3 : 1, last = pts.length - 1;
  if (depth < 3) {
    for (let k = base; k <= last; k++) {
      const n = k === last ? 2 : (trunk ? (rng() < 0.6 ? 2 : 1) : (rng() < 0.8 ? 1 : 0));
      for (let c = 0; c < n; c++) {
        const cd = kinked(dirs[Math.min(k - (trunk ? 2 : 0), dirs.length - 1)], k === last ? rng.range(0.35, 0.7) : rng.range(0.8, 1.35), rng); if (depth < 1) cd.y = Math.abs(cd.y) * 0.5 + 0.75; else if (depth < 2) cd.y = Math.abs(cd.y) * 0.6 + 0.2; cd.normalize();
        oakLimb(G, R, rng, pts[k], cd, len * (trunk ? rng.range(0.85, 1.2) : rng.range(0.55, 0.7)), rad[k] * (k === last ? 0.85 : rng.range(0.5, 0.68)), depth + 1, o);
      }
    }
    if (depth < 2) return;
  }
  for (let k = 1; k <= last; k++) {                         // claws: hooked twigs off every joint of the outer limbs
    const n = Math.round((k === last ? 3 : 2) * o.twigs * rng.range(0.6, 1.4));
    for (let c = 0; c < n; c++) {
      let td = kinked(dirs[Math.min(k, dirs.length - 1)], rng.range(0.4, 1.2), rng), q = pts[k].clone(), w = Math.min(rad[k] * 0.9, 0.11); const tl = rng.range(1.2, 2.8) * (depth === 3 ? 1 : 1.3);
      for (let s = 0; s < 3; s++) { const e = q.clone().addScaledVector(td, tl / 3); R.push(q.x, q.y, q.z, e.x, e.y, e.z, w * 2); q = e; w *= 0.62; td = kinked(td, rng.range(0.3, 0.8), rng); td.y -= 0.28; td.normalize(); }
      if (rng() < 0.07 * o.leaves) { const s = rng.range(0.22, 0.4), a = rng.range(0, 3.14), cx = Math.cos(a) * s * 0.5, cz = Math.sin(a) * s * 0.5;
        G.quad([q.x, q.y, q.z], [q.x + cx, q.y - s * 0.6, q.z + cz], [q.x, q.y - s * 1.3, q.z], [q.x - cx, q.y - s * 0.6, q.z - cz], 1, 0); }
    }
  }
}
export function buildOak(G, R, rng, o = {}) {
  const O = { x: 0, y: 0, z: 0, h: 34, lean: 0.12, twigs: 1, leaves: 1, ...o };
  G.center = [O.x, O.y, O.z];
  const a = rng.range(0, 6.28), dir = new THREE.Vector3(Math.cos(a) * O.lean, 1, Math.sin(a) * O.lean).normalize();
  const n0 = R.length / 7; oakLimb(G, R, rng, new THREE.Vector3(O.x, O.y, O.z), dir, O.h * 0.42, O.h * 0.036, 0, O);
  if (!R.cen) R.cen = []; for (let i = n0; i < R.length / 7; i++) R.cen.push(O.x, O.y, O.z);
  G.center = [0, 0, 0];
}


// ---------------------------------------------------------------- figures: backs only, stiff and small
// a cowled monk seen from behind; origin at the feet, walking toward -Z (away from a viewer who stands at +Z)
export function monkFigure(G, rng, x, z, h = 1.75) {
  const k = h / 1.75, st = rng.range(-0.05, 0.05), N = 9;
  const sec = (y, rx, rz, dz, v) => { const r = []; for (let j = 0; j < N; j++) { const a = j / N * Math.PI * 2; r.push([x + Math.cos(a) * rx * k + st * y, y * k, z + (Math.sin(a) * rz + dz) * k, v + (j % 3 === 0 ? -0.5 : 0), 0]); } return r; };
  G.rings([sec(0, 0.36, 0.3, 0.05, -0.2), sec(0.45, 0.31, 0.26, 0.03, 0), sec(1.05, 0.25, 0.2, 0, 0.1), sec(1.36, 0.29, 0.19, -0.02, 0.15), sec(1.47, 0.2, 0.17, -0.04, -0.3),
    sec(1.58, 0.17, 0.19, -0.03, 0.1), sec(1.72, 0.13, 0.17, 0.02, 0.2), sec(1.8, 0.02, 0.03, 0.12, 0.2)], true);
}
function coffin(G, x, z, y, k = 1) {
  const w = 0.36 * k, l = 1.05 * k;
  G.hexa([[x - w * 0.8, y, z - l], [x + w * 0.8, y, z - l], [x + w, y, z + l * 0.4], [x - w, y, z + l * 0.4]].concat([]), [[x - w * 0.8, y + 0.4, z - l], [x + w * 0.8, y + 0.4, z - l], [x + w, y + 0.4, z + l * 0.4], [x - w, y + 0.4, z + l * 0.4]], 0.25, 0);
  G.hexa([[x - w, y, z + l * 0.4], [x + w, y, z + l * 0.4], [x + w * 0.6, y, z + l], [x - w * 0.6, y, z + l]], [[x - w, y + 0.4, z + l * 0.4], [x + w, y + 0.4, z + l * 0.4], [x + w * 0.6, y + 0.4, z + l], [x - w * 0.6, y + 0.4, z + l]], 0.25, 0);
  G.hexa([[x - w, y + 0.4, z - l], [x + w, y + 0.4, z - l], [x + w, y + 0.4, z + l], [x - w, y + 0.4, z + l]], [[x - 0.05, y + 0.56, z - l * 0.9], [x + 0.05, y + 0.56, z - l * 0.9], [x + 0.05, y + 0.56, z + l * 0.9], [x - 0.05, y + 0.56, z + l * 0.9]], 0.5, 0);
}

// ---------------------------------------------------------------- ravens
// One raven, nose to +Z, span 1.25 m. aVS.x carries the drawn value; aWing = signed distance out along the wing (0 on the body).
export function ravenGeometry() {
  const G = new FzGeo(), wing = [];
  const body = (z, r, y) => [[0, y + r, z], [r * 0.9, y, z], [0, y - r * 0.8, z], [-r * 0.9, y, z]];
  G.rings([body(-0.2, 0.02, 0), body(-0.1, 0.07, 0), body(0.1, 0.09, 0), body(0.24, 0.06, 0.02), body(0.31, 0.055, 0.03), body(0.36, 0.03, 0.02), body(0.47, 0.004, 0)], true);
  while (wing.length < G.n) wing.push(0);
  G.quad([-0.09, 0, -0.16], [0.09, 0, -0.16], [0.13, 0, -0.42], [-0.13, 0, -0.42], -0.3, 0); G.tri([-0.13, 0, -0.42], [0.13, 0, -0.42], [0, 0, -0.47], -0.3, 0);   // wedge tail
  while (wing.length < G.n) wing.push(0);
  for (const m of [-1, 1]) {
    const P = (x, z) => [m * x, 0.02, z], add = (pts, v) => { pts.length === 4 ? G.quad(pts[0], pts[1], pts[2], pts[3], v, 0) : G.tri(pts[0], pts[1], pts[2], v, 0); for (const q of pts) wing.push(q[0]); };
    add([P(0.04, 0.18), P(0.27, 0.25), P(0.27, -0.12), P(0.04, -0.16)], 0.1); add([P(0.27, 0.25), P(0.45, 0.21), P(0.47, -0.1), P(0.27, -0.12)], -0.1);
    for (let f = 0; f < 5; f++) { const a = -0.15 + f * 0.33, ca = Math.cos(a), sa = Math.sin(a), bx = 0.45, bz = 0.17 - f * 0.06, L = 0.24 - f * 0.02;      // fingered primaries
      add([P(bx, bz + 0.035), P(bx + ca * L, bz - sa * L), P(bx, bz - 0.045)], f & 1 ? 0.15 : -0.2); }
  }
  const g = G.build(); g.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 1)); return g;
}
// Instanced flock. They wheel about uHome on the clock; uGo (0..1, set from u) sends them off in threes: each leaves in turn,
// crosses uGate (the lancet) and goes out along uAway. aR per instance: phase, wheel radius, height offset, order 0..1.
const RAVEN_VERT = /* glsl */`
${STYLE_GLSL}
uniform vec3 uHome; uniform vec3 uGate; uniform vec3 uAway; uniform float uGo;
attribute vec2 aVS; attribute float aWing; attribute vec4 aR;
varying vec3 vW; varying vec3 vO; varying vec2 vVS; varying float vTone;
vec3 ravenAt(float lead){
  float ang = aR.x * 6.283 + (uTime + lead) * (7. / max(aR.y, 2.)) * (fract(aR.x * 7.) > 0.5 ? 1. : -1.);
  vec3 wheel = uHome + vec3(cos(ang) * aR.y, aR.z + sin(ang * 2. + aR.x * 9.) * 1.2, sin(ang) * aR.y * 0.8);
  float t = clamp((uGo - aR.w * 0.62) / 0.38 + lead * 0.06, 0., 1.);
  vec3 off = vec3(sin(aR.x * 40.), cos(aR.x * 23.), 0.) * vec3(1.6, 2.4, 0.);
  vec3 a = mix(wheel, uGate + off, smoothstep(0., 0.45, t));
  return mix(a, uAway + off * 3., smoothstep(0.4, 1., t)); }
void main(){
  vec3 c = ravenAt(0.), ahead = ravenAt(0.25); vec3 f = ahead - c; float fl = length(f); vec3 ad = uAway - uGate; f = fl > 1e-3 ? f / fl : ad / max(length(ad), 1e-4);
  vec3 r = cross(vec3(0., 1., 0.), f); float rl = length(r); r = rl > 1e-4 ? r / rl : vec3(1., 0., 0.); vec3 up = cross(f, r);
  float beat = sin(uTime * (7. + aR.x * 3.) + aR.x * 50.); float glide = smoothstep(-0.2, 0.6, sin(uTime * 0.5 + aR.x * 30.)) * (1. - step(0.02, uGo - aR.w * 0.62));
  float w = abs(aWing); vec3 p = position; p.y += w * (beat * mix(0.75, 0.12, glide) + 0.12) + w * w * beat * 0.5; p.x *= 1. - 0.18 * abs(beat) * (1. - glide);
  p *= 1.25;
  vec3 wp = (modelMatrix * vec4(c, 1.)).xyz + mat3(modelMatrix) * (r * p.x + up * p.y + f * p.z);
  vW = wp; vO = position * 6.; vVS = aVS; vTone = fzToneStep(distance(cameraPosition, wp));
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`;
export function ravenFlock(rng, count, { home, gate, away, col = PALETTE[0] }) {
  const g = new THREE.InstancedBufferGeometry().copy(ravenGeometry()), R = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) R.set([rng(), rng.range(5, 13), rng.range(-3, 4), (Math.floor(i / 3) + rng() * 0.3) / Math.max(1, Math.ceil(count / 3))], i * 4);
  g.setAttribute('aR', new THREE.InstancedBufferAttribute(R, 4)); g.instanceCount = count;
  const m = new THREE.ShaderMaterial({ uniforms: { ...STYLE, uCol: { value: lin(col) }, uCol2: { value: lin(mixHex(col, PALETTE[2], 0.2)) }, uMode: { value: 4 }, uSnowAmt: { value: 0 }, uGrain: { value: 1.2 }, uLift: { value: 0.12 }, uBody: { value: 0.4 }, uLeaf: { value: lin(col) },
    uHome: { value: home.clone() }, uGate: { value: gate.clone() }, uAway: { value: away.clone() }, uGo: { value: 0 } }, vertexShader: RAVEN_VERT, fragmentShader: SOLID_FRAG, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; return mesh;
}

// One bird carried by its own matrix (the raven that beats beside the eye, the owl). Geometry as ravenGeometry (aVS, aWing).
// uniforms.uPhase = wing-beat phase (set it from the clock), uniforms.uFold 0..1 = wings shut and hung down the back (perched).
const SOLO_VERT = /* glsl */`
${STYLE_GLSL}
uniform float uPhase; uniform float uFold; uniform float uAmp;
attribute vec2 aVS; attribute float aWing;
varying vec3 vW; varying vec3 vO; varying vec2 vVS; varying float vTone;
void main(){
  float beat = sin(uPhase), w = abs(aWing); vec3 p = position;
  p.y += (w * (beat * uAmp + 0.12) + w * w * beat * 0.5) * (1. - uFold) - w * 0.25 * uFold;
  p.x *= mix(1. - 0.18 * abs(beat), 0.3, uFold);
  vec4 wp = modelMatrix * vec4(p, 1.);
  vW = wp.xyz; vO = position * 6.; vVS = aVS; vTone = fzToneStep(distance(cameraPosition, modelMatrix[3].xyz));
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
export function soloBird(geo, { col = PALETTE[0], col2 = null, grain = 1.2 } = {}) {
  const m = new THREE.ShaderMaterial({ uniforms: { ...STYLE, uCol: { value: lin(col) }, uCol2: { value: lin(col2 || mixHex(col, PALETTE[2], 0.2)) }, uMode: { value: 4 }, uSnowAmt: { value: 0 }, uGrain: { value: grain }, uLift: { value: 0.12 }, uBody: { value: 0.4 }, uLeaf: { value: lin(col) },
    uPhase: { value: 0 }, uFold: { value: 0 }, uAmp: { value: 0.75 } }, vertexShader: SOLO_VERT, fragmentShader: SOLID_FRAG, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; return mesh;
}

// ==== ASSEMBLY
export async function buildHero(ctx, opts = {}) {
  const pal = opts.palette || PALETTE, detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1), rng = ctx.rng;
  const noise = makeNoise(Math.floor(rng() * 1e9)), flip = !!opts.courseZ, nOaks = opts.oaks ?? 3, groundR = opts.ground === false ? 0 : (opts.groundRadius ?? 170);
  setPalette(pal);
  if (opts.standalone !== false) {            // the hero alone (set-piece viewer): the dusk under the slab, wall foot in ground mist
    STYLE.uSlab.value.set(60, 76, 0.16, 0); STYLE.uSplit.value = 68; STYLE.uHaze.value.set(0.0005, 0.008, 0, 5);
  }
  if (opts.standalone !== false && !flip) STYLE.uDrift.value.set(0, -6, 0.55);
  if (opts.snow === false) STYLE.uSnow.value = 0;
  const root = new THREE.Group(), inner = new THREE.Group(); root.add(inner); if (flip) inner.rotation.y = Math.PI;
  const add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; inner.add(m); return m; };

  // stone: wall, pier stumps, choir arch (one mesh, one tone centre each)
  const G = new FzGeo();
  const wall = await buildWall(G, rng, noise, ctx);
  await ctx.yield();
  const piers = [];
  for (let k = 0; k < 8; k++) {
    const x = (k & 1 ? 1 : -1) * 7.2, z = -10 - (k >> 1) * 12, h = k === 2 || k === 5 ? rng.range(9, 12.5) : rng.range(2.6, 7.5);
    G.center = [x, 0, z]; pierStump(G, rng, x, z, h); piers.push([x, h, z]);
  }
  await ctx.yield();
  G.center = [0, 0, -60]; buildChoirArch(G, rng, noise, -60); G.center = [0, 0, 0];
  await ctx.yield();
  add(G.build(), fzMaterial({ mode: 'ashlar', col: pal[0], col2: mixHex(pal[0], pal[2], 0.24), snow: 1, lift: 0.2, body: 0.5, centers: true, side: THREE.DoubleSide })).name = 'stone';

  // untrodden snow: drifts against the wall and the stumps, hollows in violet
  const hS = (x, z) => 0.05 + (noise.n2(x * 0.045, z * 0.045) * 0.5 + 0.5) * 0.55 + noise.n2(x * 0.17, z * 0.17) * 0.12
    + (Math.abs(x) < 18.5 && Math.abs(x) > 2 ? 0.9 * Math.exp(-Math.max(Math.abs(z) - 1.3, 0) / 2.2) : 0) + (Math.abs(Math.abs(x) - 7.2) < 3 && z < -6 && z > -50 ? 0.35 * Math.exp(-Math.abs(Math.abs(x) - 7.2)) : 0);
  if (groundR > 0) {
    const S = new FzGeo(), NR = 30, NS = 72, rs = [];
    for (let k = 0; k <= NR; k++) { const r = 0.2 + groundR * Math.pow(k / NR, 1.9), ring = [];
      for (let j = 0; j < NS; j++) { const a = j / NS * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r - 12, h = hS(x, z); ring.push([x, h, z, clamp((h - 0.45) * 1.6, -1, 1), 0]); } rs.push(ring); }
    S.rings(rs, true); add(S.build(), fzMaterial({ mode: 'snow', col: pal[4], col2: pal[2] }));
  }
  await ctx.yield();

  // wood: grave crosses, the open grave's spoil and boards
  const Wd = new FzGeo(), graves = [];
  for (let k = 0; k < 11; k++) {
    let x = (k & 1 ? 1 : -1) * rng.range(4.5, 21); const z = rng.range(13, 50);
    const off = (x - 5.7) * 0.927 - (z - 19) * 0.375; if (Math.abs(off) < 2 && z < 36) x += (off < 0 ? -1 : 1) * (2.4 - Math.abs(off));    // none stands in the monks' way
    Wd.center = [x, 0, z]; graveCross(Wd, rng, x, hS(x, z), z); graves.push([x, z]);
  }
  const gv = { x: 11.6 + rng.range(-1, 1), z: 22 + rng.range(-3, 5) }, gy = hS(gv.x, gv.z) + 0.03; Wd.center = [gv.x, 0, gv.z];
  Wd.quad([gv.x - 0.6, gy, gv.z - 1.2], [gv.x + 0.6, gy, gv.z - 1.2], [gv.x + 0.6, gy, gv.z + 1.2], [gv.x - 0.6, gy, gv.z + 1.2], -1, 0);       // the pit: a drawn dark
  for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28, r = 0.9 + rng() * 0.5, cx = gv.x + 1.7, cz = gv.z + 0.2;                                 // spoil heap, snow-dusted
    Wd.tri([cx, gy + 0.75, cz], [cx + Math.cos(a) * r, gy - 0.1, cz + Math.sin(a) * r * 1.4], [cx + Math.cos(a + 0.9) * r, gy - 0.1, cz + Math.sin(a + 0.9) * r * 1.4], k & 1 ? -0.3 : 0.2, k % 3 ? 0 : 0.6); }
  Wd.center = [0, 0, 0];
  add(Wd.build(), fzMaterial({ mode: 'lines', col: pal[0], grain: 9, snow: 1, centers: true, side: THREE.DoubleSide })).name = 'graves';

  // oaks: claws over the wall's shoulder; nothing crosses the flight line or the window
  const keepOut = (p) => (p.z > -4 && Math.abs(p.x + 2.5) < 8.5 && p.y > 5) || (p.z <= -4 && Math.abs(p.x) < 9.5) || (Math.abs(p.z) < 2.6 && Math.abs(p.x) < 18.5 && p.y < 43);
  const oakAt = [[-12.5, 10, 37], [16, 9, 33], [19.5, -15, 32], [-22, -13, 31]].slice(0, nOaks).map(([x, z, h]) => [x + rng.range(-1.2, 1.2), z + rng.range(-1.2, 1.2), h + rng.range(-1, 1)]);
  const Bk = new FzGeo(), Tw = [];
  for (const [x, z, h] of oakAt) { buildOak(Bk, Tw, rng, { x, y: hS(x, z) - 0.2, z, h, lean: rng.range(0.05, 0.2), twigs: detail, leaves: opts.leaves ?? 1, keepOut }); await ctx.yield(); }
  if (nOaks > 0) {
    add(Bk.build(), fzMaterial({ mode: 'bark', col: pal[0], leaf: mixHex(mixHex(pal[0], pal[5], 0.55), pal[6], 0.3), body: 0.6, snow: 1, centers: true, side: THREE.DoubleSide })).name = 'oakWood';
    add(ribbonGeometry(Tw), fzRibbonMaterial({ col: pal[0], centers: true })).name = 'oakTwigs';
  }
  await ctx.yield();

  // monks with the coffin, in two meshes that step in antiphase; they stand in the snow at progress 0 and reach the door at 1
  const habit = fzMaterial({ mode: 'lines', col: pal[0], grain: 7, snow: 0.25, side: THREE.DoubleSide });
  const MA = new FzGeo(), MB = new FzGeo(), MSP = 2.2, MK = 2.05 / 1.75;
  // in the file's own frame the lead stands at the origin and the rest follow behind him (+z), a little out of line
  [[MB, 0, 2.1], [MA, 0.12, 2.0], [MB, -0.1, 2.0], [MB, 0.22, 2.05], [MA, -0.2, 1.95], [MB, 0.1, 2.1]].forEach(([g, dx, h], i) => monkFigure(g, rng, dx, i * MSP, h));
  coffin(MA, 0.01, 1.5 * MSP, 1.3 * MK, MK);
  const monksA = add(MA.build(), habit), monksB = add(MB.build(), habit), monkX = rng.range(-0.3, 0.9);
  // lead's start; heading 22 degrees off the axis toward the door. The file starts 6 m back along its own line from (5.5, 19):
  // the eye goes over 9.4 m above the cowls and 2.5 m to port of the axis, so for no monk to be nearer it than 12 m the lead
  // must still be 7.6 m to starboard of the route when the eye draws level with him, and by then he has walked 5.6 m
  const MONK = { x: 5.5 + monkX * 0.5 + 6 * Math.sin(0.384), z: 19 + 6 * Math.cos(0.384), th: 0.384, len: 17.5 };
  monksA.rotation.y = MONK.th; monksB.rotation.y = MONK.th; monksA.name = monksB.name = 'monks';

  // ravens about the tallest oak, then through the window
  const tall = oakAt[0] || [-12, 9, 37];
  const ravens = ravenFlock(rng, opts.ravens ?? 24, { home: new THREE.Vector3(tall[0], tall[2] - 5, tall[1]), gate: new THREE.Vector3(-1, 20, 0), away: new THREE.Vector3(0, 9, -120), col: pal[0] });
  inner.add(ravens);

  // level mist sliding through the graves, the door and the nave, seaward
  const mist = []; const nM = Math.round(70 * detail);
  for (let k = 0; k < nM; k++) mist.push({ x: rng.range(-30, 30), y: rng.range(0.5, 3.4), z: rng.range(-90, 60), w: rng.range(11, 26), h: rng.range(1.4, 3.6), speed: -rng.range(2.8, 5.2), opacity: rng.range(0.4, 0.72), seed: rng() });
  // what a sheet meets here, in this frame: the snow (taken level), the wall but for its openings (the lancet over its sill, the door under its head),
  // buttresses, pier stumps, the choir arch's piers, the oaks' boles. Floor and lintel in metres over the snow's zero.
  const solidAt = (x, z, f) => { const ax = Math.abs(x); f[0] = 0.7; f[2] = null;                  // 0.7: the height the snow's drifts reach away from the wall
    if (ax > 25) return;
    if (z > -3 && z < 4.2) { if (Math.abs(z) < 1.9 && ax < 17.6) { if (ax < WALL.door.hw) f[2] = WALL.door.ys; else f[0] = ax < WALL.main.hw ? WALL.main.y0 + 0.3 : 99; }
      if ((Math.abs(ax - 8.7) < 1.3) || (Math.abs(ax - 16.1) < 1.2 && z > -2.7 && z < 3.6)) f[0] = 99; }
    else if (z < -7 && z > -49 && Math.abs(ax - 7.2) < 2.2) { for (const [px, ph, pz] of piers) if (Math.hypot(x - px, z - pz) < 2.2) f[0] = Math.max(f[0], ph + 0.4); }
    else if (Math.abs(z + 60) < 1.7 && ax > CHOIR.hw - 0.4 && ax < 11.9) f[0] = 99;
    for (const [ox, oz] of oakAt) if (Math.abs(x - ox) < 2.4 && Math.hypot(x - ox, z - oz) < 2.4) f[0] = 99; };
  const mistMap = await mistGround({ x0: -44, x1: 44, z0: -96, z1: 66, nx: 48, nz: 88, h0: -1, hs: 14, soft: 1.3 }, solidAt, ctx.yield);
  const mistMesh = add(mistGeometry(mist), fzMistMaterial({ z0: -90, z1: 60, nearFade: 3, ground: mistMap })); mistMesh.renderOrder = 5;

  // anchors: given in course coordinates (px = metres to port, y above the snow, cz = metres along the course past the wall plane)
  const C = (px, y, cz) => (flip ? new THREE.Vector3(px, y, cz) : new THREE.Vector3(-px, y, -cz));
  const anchors = {
    lancet: C(0, 21, 0), sill: C(0, WALL.main.y0, 0), apex: C(0, archApex(WALL.main), 0), door: C(0, 0, -1.6),
    flyThrough: [C(2.5, 42, -70), C(2.5, 28, -32), C(2.5, 21, -11), C(2.5, 19.5, 0), C(2.2, 18, 14), C(1.2, 15.5, 36), C(0, 13, 60), C(0, 10, 90)],
    viewpoints: { reveal: C(0, 42, -70), overGraves: C(2.5, 26, -26), inWindow: C(2.5, 19.5, 0), nave: C(1.2, 15.5, 36) },
    choirArch: C(0, 11, 60), piers: piers.map(([x, h, z]) => C(-x, h, -z)), graves: graves.map(([x, z]) => C(-x, 0, -z)), openGrave: C(-gv.x, 0, -gv.z),
    ravenOak: C(-tall[0], tall[2], -tall[1]), oaks: oakAt.map(([x, z, h]) => C(-x, h, -z)), owlPerch: C(-wall.perch[0], wall.perch[1] + 0.45, 0),
    monksStart: C(-MONK.x, 0, -MONK.z), exitDirection: flip ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 0, -1), portalSeat: null,
  };
  let prog = 0;
  const hero = {
    object: root, radius: 30, height: 42, center: new THREE.Vector3(0, 19, 0), anchors, style: STYLE,
    setProgress(u) { prog = clamp(u, 0, 1); ravens.material.uniforms.uGo.value = prog; },
    setRavens(g) { ravens.material.uniforms.uGo.value = clamp(g, 0, 1); },
    update(dt, time, camera) {
      tickStyle(time, ctx.renderer);
      const d = MONK.len * prog, ph = d * 4.2, x = MONK.x - Math.sin(MONK.th) * d, z = MONK.z - Math.cos(MONK.th) * d, y = hS(x, z) - 0.12;   // steps are tied to the ground covered
      monksA.position.set(x, y + Math.abs(Math.sin(ph)) * 0.04, z); monksB.position.set(x, y + Math.abs(Math.cos(ph)) * 0.04, z);
      monksA.rotation.z = Math.sin(ph) * 0.012; monksB.rotation.z = -Math.sin(ph) * 0.012;
    },
    dispose() {}, ground: false, groundY: 0,
    // what a mist sheet meets at px metres to port and cz metres along the course past the wall plane (as the anchors are given):
    // fills f[0] with the floor and f[2] with the lintel (or null), in metres over the snow's zero
    solidAt: (px, cz, f) => solidAt(-px, -cz, f),
  };
  hero.update(0, 0, null);
  return hero;
}
