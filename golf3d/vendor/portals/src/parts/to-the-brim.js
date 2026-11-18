// Hero set piece for "To the Brim": THE GLASS AND ITS LIGHT, and THE GREAT GLASS THAT FILLS.
//
// Two things live in this file.
//  (A) makeGlassKit(ctx, opts): the one wine glass of the hall, drawn in four instanced weights (near / mid / far, and
//      a three-sided 'speck' for glasses more than 17 m from the flown line; the great glass is a fifth, in (B)) with
//      ONE small set of shader laws, for the world to instance about five thousand times. A glass that
//      covers only a few pixels shows its mean (see VS_HEAD): highlights, rim line and caustic are filtered by the
//      glass's own footprint in pixels; the body keeps its true size at every distance, and the stem, a thin thing,
//      goes out by pixel width:
//        shell   additive, no depth write: rim line, a sheen that follows the eye, the nearest flame's image
//                (and, on the far wall of the bowl, the same flame again upside down and small), one long
//                highlight down the stem, a pontil ring in the foot.
//        wine    opaque: deep ruby body with a garnet edge that lights up when the flame stands behind it,
//                a dead-level surface disc with a bright meniscus line, the flame's image riding on it and
//                fine rings shivering in one slow wave that travels down the hall (-Z to +Z) by the clock.
//        caustic a small card on the cloth, pointing away from the nearest flame: a ruby shadow with a gold
//                cusp, breathing with that flame.
//        flames  cards facing the eye, tinted gold, above 1 only at the core; lean, lengthen, breathe.
//      Every glass is told its nearest flame ONCE at build, as an instanced attribute (world xyz + strength);
//      nothing reads the eye except as light does. THE HALF is the constant HALF below: it is never dealt.
//  (B) buildHero(ctx, opts): THE GREAT GLASS: the same glass (same profile, same laws, same wine) eight times the size
//      (7.04 m tall, 96 sides), standing alone on a low round plinth of three marble steps with gilt nosings, in a ring of
//      six tall gilt candle stands on the plinth's west half; above it the great cut-glass decanter (6.05 m long), tilted
//      14 degrees, carried in a gilt yoke that hangs by a chain from a gilt crane standing west of the plinth; the thread
//      of wine falling from its lip into the glass; a folded cloth and pomegranates at the hall's own scale on the steps.
//      Every law of the glass is given at this size by BIG branches of the same shaders: what is measured in the glass's
//      own proportions (the profile, the far glass's mean) holds as it is; what is measured in metres was judged again
//      (the rim line 0.05 m, the meniscus 0.03 to 0.06 m, the wine's rings 0.09 m apart, the thread's 0.12 m apart, the
//      dome 0.25 m high and slow, the caustic a pool on the plinth's top, the thread 0.15 to 0.09 m through).
//
// LOCAL SPACE  origin = the dais floor under the great glass's axis; +Y up; local axes = world axes (no turn).
//   Put hero.object at world (0, 3.0, -179). Then: the plinth's three steps (radii 4.2, 3.4, 2.6; 0.3 high each), the
//   glass's foot y 0.9, its bowl from y 3.78, its greatest radius 1.44 at y 5.53, THE HALF y 5.86, its rim y 7.94 (radius
//   1.2); the decanter's lip at (-0.35, 10.54, 0), 2.6 m over the rim; the six flames at y 4.57 (4.35 in the blue look), 3.8 m
//   from the axis, 20 to 135 degrees round from the south (+Z) by the west (-X); the crane's post at x -7.6, its arm to y 16.6.
//   Nothing of the decanter, the yoke or the crane lies east of x -0.13. The camera comes from +Z up the axis and passes
//   on the east (+X), 4.6 m from the axis and 0.9 m over the rim.
//
// OPTS { palette      brief palette: [0] linen ivory, [1] ruby, [2] flame gold, [3] near black, [4] umber,
//                     [5] gilt, [6] night blue
//        wine         'ruby' | 'gold' | 'rose' (default: dealt from ctx.rng; pass the world's own choice)
//        look         'midnight' | 'blue' | 'moon' (default 'midnight'): blue = short candle stubs, a cold blue edge
//                     from +X (east); moon = a silver edge from -X (west)
//        routeLength  479.6: metres of the route, used by setProgress(u)
//        light        true: one warm PointLight at the six flames' middle (never switched; dimmed by intensity)
//        kit          a kit already made by makeGlassKit (so the hall and the hero share materials)
//        showcase     false; true adds a short linen table of ordinary half-full glasses and low candles beside
//                     the piece, to judge the kit by }
//   Per seed: the wine (unless given), the cut of the decanter (diamond count), how many pomegranates and how they
//   lie, the folds of the cloth.
//
// RETURNS radius 8.4, height 16.7, center (-1.6, 7.6, 0), ground true, groundY 0, plus:
//   setMetres(m)    THE FILL, a pure law of the metres flown: half to 300; rising evenly to the rim at 396;
//                   396..406 the dome swells to 0.25 m; the thread's head leaves the lip at 291 and lands at 300; it breaks
//                   into three drops from 400, the last lands at 406 and is whole in the wine before the thread is
//                   switched off (406.5); afterwards the dome stands. Call it every frame with path metres (0 while seen
//                   through the previous portal). Only the dome's trembling and the rings read the clock.
//   setProgress(u)  = setMetres(u * routeLength).
//   setLight(flameStrength, fillHex, fillDir, fillStrength)  the look's light on every hero material.
//   kit             the glass kit (see makeGlassKit below: geometries, materials, makeGlasses, makeFlames).
//   great           { uRing, uCool }: the great glass's own uniforms (uCool: a cold light from the north, the world's to set).
//   bodies          [name, least clear air, [[x, y, z, radius] ...]]: what the world counts against its flown line.
//   light           the PointLight (or null); uniforms: the shared table (uTime, uFlame, uFill ...).
//   info            { triangles, drawCalls }.
//   Until setMetres is first called the glass stands at half, like every other. The fill reads the metres handed to
//   setMetres and nothing else. The glass is additive and made for the dark.
//
// ANCHORS (local space)
//   glass        (0, 0.9, 0) foot of the great glass;  rim (0, 7.94, 0);  half and bowl (0, 5.86, 0)
//   lip          (-0.35, 10.54, 0) where the thread leaves the decanter
//   flame        the six flames' middle (-2.89, 4.57, 0.65);  flames: the six
//   poi          (0, 7.94, 0) where the gaze should rest at the pass (the brim)
//   flyThrough   [(0,4.4,49) (0,5.6,25) (4.6,8.8,0) (0.6,5.2,-27) (0,4.2,-65)]: up the axis, past on the east, back to it
//   portalSeat   { position (0, 4.2, -65), normal (0,0,1) }: a portal 65 m north of the glass
//   viewpoints   closest (4.6, 8.8, 0) looking at the rim; approach (0, 5.4, 28)
//
// COST  hero about 26k triangles (the great glass with its wine 12.8k; the decanter and its wine 4.9k; the thread 1k; the
//   plinth, stands, crane, yoke and still life 7k), 9 draw calls, 1 PointLight if asked. The showcase adds 11 calls.
// LIGHTING  Self-shaded ShaderMaterials: candlelight worked from where the six flames stand plus a low warm
//   underlight and an optional cool fill; they ignore scene lights and honour scene fog (additive parts fade
//   to nothing in fog, opaque parts go to the fog colour). Wants a dark, warm scene, exposure about 1.05,
//   bloom 0.3 at threshold 1: only flame cores, the meniscus glint and the flame images exceed 1.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- the glass: one profile, metres, glass-local (foot on y = 0) ----------
export const GLASS = { height: 0.88, footR: 0.15, stemR: 0.018, bowlY: 0.36, bowlH: 0.52, wall: 0.007 };
export const HALF = 0.5;                                   // THE HALF: fraction of the bowl's height, everywhere
export const HALF_Y = GLASS.bowlY + GLASS.bowlH * HALF;    // 0.62 above the cloth
// THE GREAT GLASS: the same glass GREAT times the size (7.04 m tall), GREAT_SEG sides; its wall and the wine's inset are
// given here in the hall glass's own measure (0.032 m and 0.044 m as it stands)
export const GREAT = 8, GREAT_SEG = 96, GREAT_WALL = 0.004, GREAT_INSET = 0.0055;
const PI = Math.PI;
// radius of the bowl's outside at s = 0..1 of its height (tulip: 0.36 across at its widest, 0.30 at the rim)
export function bowlR(s) {
  if (s < 0.42) return Math.max(GLASS.stemR, 0.18 * Math.sqrt(Math.max(Math.sin(0.5 * PI * s / 0.42), 0)));
  return 0.165 + 0.015 * Math.cos(PI * (s - 0.42) / 0.58);
}
const GLSL_BOWL = /* glsl */`
float bowlR(float s){
  float a = 0.18*sqrt(max(sin(1.5707963*clamp(s,0.0,0.42)/0.42),0.0));
  float b = 0.165+0.015*cos(3.14159265*(clamp(s,0.42,1.0)-0.42)/0.58);
  return max(0.018, s<0.42 ? a : b);
}`;
// shared GLSL: hashes, the breath of a flame (slow, each for itself, never faster than 1.5 Hz, never dark)
const GLSL_COMMON = /* glsl */`
float h11(float p){ p = fract(p*0.1031); p *= p+33.33; p *= p+p; return fract(p); }
float h31(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float vnoise(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x), mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x), mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x), f.y), f.z); }
float breath(vec3 fp, float t){ float k = h31(floor(fp*7.0)+3.0);
  return 1.0 + 0.045*sin(t*(3.1+3.0*k)+k*40.0) + 0.025*sin(t*(5.3+2.6*k)+k*17.0); }
`;
// THE BREATH AS A FLAME FEELS IT (the rare visit; shared with the world's shaders). The front's place is a law of the
// metres flown (uGustM): it leaves z -262 at 150 m, is at z -40 by 156 m, at z 58 by 164 m, at z 130 by 200 m and at
// z 320 by 214 m. A flame does not feel the front's speed (it crosses the choir at some 400 m a second): gustD gives,
// for a flame at z, twice the metres still to be flown until the front reaches it (negative once it has passed), which is
// the front's own distance in metres wherever it travels 2 m of hall to a metre flown (z 58 to 130). Every lean, dip
// and recovery is a law of that measure, so each takes the same metres flown everywhere: the lean comes over 7.6 m flown
// (0.6 s and more), the dip comes and goes over 16 m each, the recovery is slower still.
export const GLSL_GUST = /* glsl */`
uniform float uGustM;
float gustD(float z){
  float a = z < -40.0 ? 150.0+(z+262.0)/37.0 : (z < 58.0 ? 156.0+(z+40.0)/12.25 : (z < 130.0 ? 164.0+(z-58.0)*0.5 : 200.0+(z-130.0)/13.5714));
  return (a-uGustM)*2.0; }
`;
const FOG_PV = '#include <common>\n#include <fog_pars_vertex>\n';
const FOG_PF = '#include <common>\n#include <fog_pars_fragment>\n';
// additive things fade to nothing in fog instead of turning into fog colour
const FOG_ADD = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    col *= exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
    col *= 1.0-smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#endif`;
const lin = (hex) => new THREE.Color(hex);
const WINES = {
  ruby: { deep: '#3a0410', body: '#8e0f22', edge: '#ff3b2e', caustic: '#c2162c' },
  gold: { deep: '#4a2e06', body: '#a07318', edge: '#eebb4e', caustic: '#d09a30' },
  rose: { deep: '#521220', body: '#a8364a', edge: '#f07a78', caustic: '#c84c60' },
};

// ---------- geometry: a small lathe that carries (part, v) in uv and smooth profile normals ----------
// rings: [r, y, part, v]; o.bottom / o.top: [y, part, v] close the end with a fan; o.up: every normal (0,1,0)
function revolve(rings, seg, o = {}) {
  const pos = [], nor = [], uv = [], idx = [];
  const n = rings.length;
  for (let i = 0; i < n; i++) {
    const a = rings[Math.max(0, i - 1)], b = rings[Math.min(n - 1, i + 1)];
    let tr = b[0] - a[0], ty = b[1] - a[1];
    if (n === 1) { tr = 0; ty = 1; }
    const l = Math.hypot(tr, ty) || 1; const nr = ty / l, ny = -tr / l;
    for (let j = 0; j < seg; j++) {
      const ph = (j / seg) * PI * 2, c = Math.cos(ph), s = Math.sin(ph);
      pos.push(rings[i][0] * c, rings[i][1], rings[i][0] * s);
      if (o.up) nor.push(0, 1, 0); else nor.push(nr * c, ny, nr * s);
      uv.push(rings[i][2], rings[i][3]);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < seg; j++) {
    const a = i * seg + j, b = i * seg + (j + 1) % seg, c = a + seg, d = b + seg;
    idx.push(a, c, b, b, c, d);
  }
  if (o.bottom) { const k = pos.length / 3; pos.push(0, o.bottom[0], 0); nor.push(0, o.up ? 1 : -1, 0); uv.push(o.bottom[1], o.bottom[2]);
    for (let j = 0; j < seg; j++) idx.push(k, j, (j + 1) % seg); }
  if (o.top) { const k = pos.length / 3, base = (n - 1) * seg; pos.push(0, o.top[0], 0); nor.push(0, 1, 0); uv.push(o.top[1], o.top[2]);
    for (let j = 0; j < seg; j++) idx.push(k, base + (j + 1) % seg, base + j); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
const bowlRing = (s, inset = 0) => [bowlR(s) - inset, GLASS.bowlY + GLASS.bowlH * s, 0, s];

// shell: uv.x = part (0 bowl, 1 stem, 2 foot, 3 lip), uv.y = s on the bowl, t on the stem, r/footR on the foot
function shellGeometry(weight) {
  const B = GLASS.bowlY;
  if (weight === 'far') return revolve([[0.07, 0.0, 1, 0], [0.03, B + 0.03, 1, 1], [bowlR(0.5), HALF_Y, 0, 0.5], bowlRing(1)], 4);
  if (weight === 'speck') return revolve([[0.07, 0.0, 1, 0], [0.03, B + 0.03, 1, 0], bowlRing(1)], 3);      // foot, stem and rim only: the wine carries the bowl (the rim line is the top twentieth of it, as on every weight)
  if (weight === 'mid') return revolve([[0.15, 0.006, 2, 1], [0.022, 0.05, 1, 0], [0.019, B - 0.012, 1, 1], bowlRing(0.07), bowlRing(0.5), bowlRing(1)], 5);
  if (weight === 'near') return revolve([[0.15, 0.004, 2, 1], [0.143, 0.017, 2, 0.95], [0.022, 0.05, 1, 0], [0.018, B - 0.015, 1, 1],
    bowlRing(0.05), bowlRing(0.42), bowlRing(1)], 10);
  // THE GREAT GLASS (drawn GREAT times this size by its instance's matrix): round to the eye (GREAT_SEG sides), a true rim
  // (its wall GREAT_WALL thick here), a foot with a pontil ring (it stands on the plinth: no underside), an inner wall above the wine
  const r = [[0.138, 0.0, 2, 0.92], [0.147, 0.003, 2, 0.98], [0.15, 0.009, 2, 1], [0.147, 0.015, 2, 0.98], [0.138, 0.019, 2, 0.92]];
  for (let i = 1; i <= 6; i++) { const t = i / 6, rr = 0.138 - (0.138 - 0.026) * t; // foot rising to the stem, with a pontil ring
    r.push([rr, 0.019 + 0.03 * t * t + 0.004 * Math.exp(-Math.pow((rr - 0.052) / 0.008, 2)), 2, rr / 0.15]); }
  for (let i = 0; i <= 9; i++) { const t = i / 9; // stem: a hair of entasis, a plain collar under the bowl
    const rr = 0.0185 - 0.003 * Math.sin(PI * t) + 0.012 * Math.exp(-Math.pow((t - 0.93) / 0.05, 2)) + 0.008 * Math.pow(1 - t, 6) + 0.01 * Math.pow(t, 14);
    r.push([rr, 0.052 + (B - 0.052) * t, 1, t]); }
  for (let i = 1; i <= 22; i++) { const s = Math.pow(i / 22, 1.25); r.push(bowlRing(Math.max(s, 0.012))); }
  const top = GLASS.height, w = GREAT_WALL;   // the lip: rounded over, then the inner wall down to just above the half
  r.push([0.15 - w * 0.15, top + w * 0.42, 3, 1], [0.15 - w * 0.5, top + w * 0.55, 3, 1], [0.15 - w * 0.85, top + w * 0.42, 3, 1], [0.15 - w, top, 3, 1]);
  for (let i = 1; i <= 5; i++) { const s = 1 - 0.46 * (i / 5); r.push([bowlR(s) - w * 0.85, B + GLASS.bowlH * s, 4, s]); }
  return revolve(r, GREAT_SEG);
}
// wine at THE HALF for the instanced weights: uv.x = 0 body (uv.y = s / HALF), 1 surface (uv.y = rho)
function wineGeometry(weight) {
  const w = GLASS.wall + 0.002, seg = weight === 'near' ? 10 : weight === 'mid' ? 5 : weight === 'far' ? 4 : 3;
  const y0 = GLASS.bowlY + 0.006;
  const body = (weight === 'far' || weight === 'speck')
    ? revolve([[bowlR(HALF) - w, HALF_Y, 0, 1]], seg, { bottom: [y0, 0, 0] })
    : revolve([[bowlR(0.16) - w, GLASS.bowlY + GLASS.bowlH * 0.16, 0, 0.32], [bowlR(HALF) - w, HALF_Y, 0, 1]], seg, { bottom: [y0, 0, 0] });
  const cap = revolve([[bowlR(HALF) - w, HALF_Y, 1, 1]], seg, { top: [HALF_Y, 1, 0], up: true });
  const g = mergeGeometries([body, cap]); body.dispose(); cap.dispose();
  return g;
}
// the one glass's wine: a unit grid the vertex shader shapes to the level. body: position = (cos, v, sin), uv.x 0;
// surface: position = (cos*rho, 0, sin*rho), uv = (1, rho)
function oneWineGeometry() {
  const seg = GREAT_SEG, body = [], cap = [];
  for (let i = 0; i <= 9; i++) body.push([1, Math.pow(i / 9, 0.8), 0, i / 9]);
  for (let i = 8; i >= 1; i--) { const rho = Math.sqrt(i / 8); cap.push([rho, 0, 1, rho]); }
  const a = revolve(body, seg), b = revolve(cap, seg, { top: [0, 1, 0], up: true });
  const g = mergeGeometries([a, b]); a.dispose(); b.dispose();
  return g;
}

// ---------- the laws: shaders shared by every glass ----------
// aFlame (instanced vec4): the glass's nearest flame, xyz in the SAME space as the instance matrices, w = strength.
// A FAR GLASS SHOWS ITS MEAN (the instanced weights and the great glass's shell: MEANS).
// glassPx: one pixel's size at the glass, in metres (uPix, one pixel's angle, times the distance to the glass's middle).
// vHl: how whole its highlights are: 1 where the bowl (0.36 m) is 12 pixels across or more, 0 where it is 3 or fewer;
// every highlight, glint and line is mixed toward its own mean over the bowl by it. The body itself keeps its true
// size at every distance: nothing of a glass is made larger for the eye. So a glass of a few pixels is the wine's
// deep red and a soft even sheen, with no single bright pixel.
const VS_HEAD = /* glsl */`
attribute vec4 aFlame;
uniform float uTime, uPix;
varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec4 vFl; varying vec3 vL; varying float vHl; varying float vThin;
// (GSC: how many times the hall's glass this one is drawn: 1, or 8 for the great glass, BIG. glassPx is one pixel's size
// at the glass's middle in the glass's OWN measure, so that every law below holds at either size)
#ifdef BIG
  #define GSC 8.0
#else
  #define GSC 1.0
#endif
float glassPx(){
  #ifdef USE_INSTANCING
    return length(cameraPosition-(modelMatrix*vec4(instanceMatrix[3].xyz+vec3(0.0,0.5*GSC,0.0),1.0)).xyz)*uPix/GSC;
  #else
    return 0.0;
  #endif
}
`;
const VS_TAIL = /* glsl */`
  vec3 nn = n; vHl = 1.0;
  #ifdef MEANS
    vHl = 1.0-smoothstep(0.03,0.12,glassPx());
  #endif
  #ifdef USE_INSTANCING
    p = (instanceMatrix*vec4(p,1.0)).xyz; nn = mat3(instanceMatrix)*nn;
  #endif
  vec4 wp = modelMatrix*vec4(p,1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix)*nn + vec3(0.0,1e-6,0.0));
  vFl = vec4((modelMatrix*vec4(aFlame.xyz,1.0)).xyz, aFlame.w);
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
`;
const FS_HEAD = /* glsl */`
uniform float uTime, uSurge, uFillAmt, uK;
uniform vec3 uFlameCol, uAmb, uFill, uFillDir, uWineDeep, uWineBody, uWineEdge, uGwE, uGwW;
uniform vec2 uCut;
varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec4 vFl; varying vec3 vL; varying float vHl; varying float vThin;
#ifdef BIG
// THE GREAT GLASS stands in a ring of six candles (uRing: their flames, world): ringSpec is the brightest of their six
// images along the mirrored ray R (the nearest flame's, vFl, is one of the six), ringC their light's middle
uniform vec3 uRing[6]; uniform vec3 uCool;
float ringSpec(vec3 P, vec3 R){ float m = 0.0;
  for (int i = 0; i < 6; i++) { vec3 Lv = uRing[i]-P; m = max(m, dot(R, Lv*inversesqrt(max(dot(Lv,Lv),1e-4)))); }
  return max(m, 0.0); }
vec3 ringMid(){ return (uRing[0]+uRing[1]+uRing[2]+uRing[3]+uRing[4]+uRing[5])/6.0; }
#endif
` + GLSL_COMMON + /* glsl */`
// a line that lies along a surface's top edge, from y0 up to 1 (y: the surface's own height, 0 to 1; w: a pixel's
// footprint in it): its mean over the part of the footprint that lies on the surface, never less and never more
float topLine(float y, float y0, float w){ float hi = min(1.0, y+0.5*w), lo = max(0.0, y-0.5*w); return clamp((hi-max(y0,lo))/max(hi-lo,1e-5), 0.0, 1.0); }
// what every surface needs to know of its flame
#define LIGHT \
  vec3 V = normalize(cameraPosition - vW + vec3(0.0,1e-5,0.0)); \
  vec3 Lv = vFl.xyz - vW; float d2 = dot(Lv,Lv); vec3 L = Lv*inversesqrt(max(d2,1e-4)); \
  float br = breath(vFl.xyz, uTime); float att = vFl.w*br/(1.0+d2*uK);
`;
const SHELL_VS = FOG_PV + VS_HEAD + /* glsl */`
#ifdef DEC
attribute vec3 aLocal;
#endif
void main(){ vec3 p = position; vec3 n = normal; vUv = uv; vL = position; vThin = 1.0;
  #ifdef DEC
    vL = aLocal;
  #endif
  #ifdef MEANS
    // the stem is a thin thing: it keeps its true width and goes out by pixel width (its light whole where it is 0.6 of
    // a pixel wide, nothing at 0.4); it is never made wider
    if (uv.x > 0.5 && uv.x < 1.5) vThin = smoothstep(0.4, 0.6, 2.0*length(p.xz)/max(glassPx(),1e-6));
  #endif
` + VS_TAIL + `}`;
const SHELL_FS = FOG_PF + FS_HEAD + /* glsl */`
void main(){
  LIGHT
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  float part = vUv.x;
  float cut = 0.0, cutEdge = 0.0;
  #ifdef DEC
    // cut in plain diamonds: each facet a little pyramid, so the flame breaks into a hundred sparks
    float ang = atan(vL.z, vL.x+1e-5)/6.2831853; float ax = vL.y;
    cut = smoothstep(0.07,0.12,ax)*(1.0-smoothstep(0.66,0.72,ax))*step(part,0.5);
    vec2 dg = vec2(ang*uCut.x + ax*uCut.y, ang*uCut.x - ax*uCut.y);
    vec2 df = fract(dg)-0.5; vec2 de = abs(df);
    cutEdge = cut*smoothstep(0.44,0.5,max(de.x,de.y));
    vec3 Tn = normalize(cross(N, vec3(0.31,0.9,0.29))+vec3(1e-5)); vec3 Bn = cross(N,Tn);
    vec3 Nf = normalize(N + cut*1.1*(Tn*(df.x+df.y) + Bn*(df.x-df.y)));
    float spark = pow(max(dot(reflect(-V,Nf),L),0.0),48.0);
    #ifdef BIG
      spark = pow(ringSpec(vW, reflect(-V,Nf)),48.0);                               // (the great decanter: a spark for each of the six flames)
    #endif
  #endif
  // (vHl: every highlight below goes to its own mean over the bowl as the glass comes down to a few pixels)
  float nv = abs(dot(N,V)); float fr = 1.0-nv; fr = mix(0.1, fr*fr*fr, vHl);       // (0.1: the sheen's mean over a round bowl's face)
  vec3 R = reflect(-V,N); float rl = max(dot(R,L),0.0);
  #ifdef BIG
    rl = ringSpec(vW, R);                                                         // (six flames: six images)
  #endif
  vec3 H = normalize(L+V+vec3(0.0,1e-5,0.0));
  vec3 lightC = uFlameCol*att;
  vec3 col = vec3(0.0);
  float isBowl = step(part,0.5)+step(3.5,part), isStem = step(0.5,part)*step(part,1.5), isFoot = step(1.5,part)*step(part,2.5), isLip = step(2.5,part)*step(part,3.5);
  #ifdef MEANS
    if (!gl_FrontFacing && vUv.y < 0.5) isBowl = 0.0;                             // (the far wall under THE HALF stands behind the wine: it is not seen)
  #endif
  // bowl: a sheen that follows the eye, the flame's image (front wall), and again small on the far wall
  float img = gl_FrontFacing ? pow(rl,220.0)*3.5 + pow(rl,24.0)*0.10 : pow(rl,700.0)*3.5;
  img = mix(0.03, img, vHl);
  col += isBowl*( fr*(uAmb*0.55 + lightC*0.9) + img*lightC );
  #ifdef BIG
    // the great bowl's two walls: a broader sheen toward each wall's edge against the eye, and each flame drawn out long down the glass
    // and, drawn out long down the glass, the hall's two lights: the ranks' candles to the south, warm, and the doorway
    // to the north, cold
    { float f2 = 1.0-nv; f2 = f2*sqrt(f2);
      vec3 Rv = normalize(vec3(R.x, R.y*0.25, R.z)+vec3(0.0,1e-5,0.0));
      float sS = pow(max(dot(Rv,vec3(0.0,0.0,1.0)),0.0), 40.0), sN = pow(max(dot(Rv,vec3(0.0,0.0,-1.0)),0.0), 70.0);
      col += (isBowl+0.6*isStem*vThin)*( f2*(uAmb*0.3+lightC*0.15) + uFlameCol*sS*0.45 + uCool*sN*5.0 ); }
  #endif
  // rim: a line (the top twentieth of the bowl; under a wide pixel it shows its mean: rw = a pixel's footprint
  // in the bowl's height), and two glints that wheel round it as the eye moves
  vec2 nh = N.xz/max(length(N.xz),1e-4); vec3 T = vec3(-nh.y,0.0,nh.x);
  float gl = 1.0-abs(dot(T,H)); gl = mix(inversesqrt(1.0+5917.0*dot(H.xz,H.xz)), pow(max(gl,0.0),48.0), vHl);     // (the glints' mean round the rim hangs on the half vector's level length h: 0.0130/h, and 1 where h is nothing)
  #ifdef BIG
    // (the great glass's rim line is no wider for its size: the top eightieth of the bowl, 0.05 m)
    float rw = max(fwidth(vUv.y), 0.004);
    float rim = max(isLip, isBowl*topLine(vUv.y, 0.9875, rw)*step(part,0.5));
  #else
  float rw = max(fwidth(vUv.y), 0.03);
  float rim = max(isLip, isBowl*topLine(vUv.y, 0.95, rw)*step(part,0.5));
  #endif
  float rimK = 1.0;
  #ifdef DEC
    rimK = 0.4;
  #endif
  col += rimK*rim*( uAmb*0.5 + lightC*(0.4+5.0*gl) );
  // stem: one long highlight
  vec2 hh = H.xz/max(length(H.xz),1e-4); float sl = mix(0.13, pow(max(dot(nh,hh),0.0),36.0), vHl);
  col += isStem*vThin*( lightC*(sl*3.2+0.10) + uAmb*(0.18+fr*0.6) );
  // foot: edge line, pontil ring, a flat glint
  float pq = (vUv.y-0.35)/0.035; float pont = exp(-pq*pq);
  #ifdef BIG
    col += isFoot*( (uAmb*0.7+lightC*0.9)*mix(0.0449, smoothstep(0.975,0.996,vUv.y)+0.35*pont, vHl) + lightC*mix(0.02, pow(rl,160.0)*2.5 + pow(rl,14.0)*0.12, vHl) + uAmb*0.05 );     // (the edge line's and the ring's mean over the great foot: 0.0449)
    // the choir's cold light, from the doorway behind it: an edge on whatever of the glass faces north
    col += uCool*(isBowl+isStem*vThin+isFoot*0.5+rim)*(fr*1.3+rim*0.5)*max(dot(N,vec3(0.0,0.2,-0.98))*0.6+0.4,0.0);
  #else
  col += isFoot*( (uAmb*0.7+lightC*0.9)*mix(0.1, smoothstep(0.93,0.99,vUv.y)+0.35*pont, vHl) + lightC*mix(0.02, pow(rl,160.0)*2.5, vHl) + uAmb*0.05 );
  #endif
  // the look's cool edge (blue hour from the east, moon from the west)
  col += uFill*uFillAmt*(isBowl+isStem*vThin+rim)*(fr*1.4+rim*0.6)*max(dot(N,uFillDir)*0.6+0.4,0.0);
  // the hall's two great windows (the end walls x 62 and -62 of the transepts, z -72 to 10): a cold edge on the glass that
  // faces one, falling off with the distance from it (uGwE, uGwW: their light by the look; black where there is no hall)
  { float sd = vW.x > 0.0 ? 1.0 : -1.0, dg = 62.0-abs(vW.x);
    float gw = step(-71.8,vW.z)*step(vW.z,9.8)*step(0.4,dg)*exp(-dg*0.045)*(1.0-smoothstep(27.0,34.0,dg));
    col += (vW.x > 0.0 ? uGwE : uGwW)*gw*3.0*(isBowl+isStem*vThin+rim)*(fr*1.4+rim*0.6)*max(dot(N,vec3(sd*0.94,0.34,0.0))*0.6+0.4,0.0); }
  #ifdef DEC
    col += cut*lightC*spark*4.5 + cutEdge*(uAmb*0.22+lightC*0.16)*(0.35+fr*2.0);
  #endif
  #ifdef BIG
    col *= (0.5+0.5*mix(0.5, vnoise(vW*vec3(2.2,0.7,2.2)), vHl)*0.3+0.35);
  #else
  col *= (0.5+0.5*mix(0.5, vnoise(vW*vec3(9.0,3.0,9.0)), vHl)*0.3+0.35);
  #endif
  ` + FOG_ADD + /* glsl */`
  gl_FragColor = vec4(col,1.0);
}`;
// the wine. ONE: the one glass's wine, shaped to uLevel (fraction of the bowl) and uDome (metres) in the vertex shader
const WINE_VS = FOG_PV + VS_HEAD + GLSL_BOWL + /* glsl */`
uniform float uLevel, uDome;
// (WINSET: the wine's inset from the bowl's outside; MEN_H: how far the still wine climbs the wall. In the glass's own
// measure: the great glass's wall is thinner for its size, and its wine climbs 0.016 m, not 0.064)
#ifdef BIG
  #define WINSET ` + GREAT_INSET.toFixed(4) + `
  #define MEN_H 0.002
#else
  #define WINSET 0.009
  #define MEN_H 0.008
#endif
float domeH(float rho){ float q = clamp(rho,0.0,1.0); float k = 1.0-q*q*q*q;
  #ifdef BIG
    k = 1.0-q*q*sqrt(q);                                                           // (a rounder shoulder: the great dome is seen from the side)
    float tremble = 1.0 + 0.035*sin(uTime*2.3) + 0.03*sin(uTime*3.7+q*5.0);        // (a great mass trembles slowly)
  #else
    float tremble = 1.0 + 0.07*sin(uTime*5.3) + 0.05*sin(uTime*8.1+q*6.0);
  #endif
  float below = 1.0-smoothstep(0.0,0.004,uDome);
  return uDome*sqrt(max(k,0.0))*tremble + below*MEN_H*q*q*q*q*q*q; }
void main(){ vec3 p = position; vec3 n = normal; vUv = uv; vL = position; vThin = 1.0;
  #ifdef ONE
    if (uv.x < 0.5) {
      float s = max(position.y*uLevel, 0.012); float r = bowlR(s)-WINSET;
      float dr = (bowlR(s+0.012)-bowlR(s-0.012))/(0.024*0.52);
      p = vec3(position.x*r, 0.36+0.52*s, position.z*r);
      n = normalize(vec3(position.x, -dr, position.z)); vUv.y = position.y;
    } else {
      float rho = uv.y; vec2 dir = position.xz/max(rho,1e-3);
      float rs = bowlR(uLevel)-WINSET+(WINSET-0.0005)*smoothstep(0.0,0.01,uDome);
      #ifdef BIG
        float wob = 0.004*rho*(sin(uTime*1.3)*dir.x+cos(uTime*0.9)*dir.y)*smoothstep(0.0,0.02,uDome);
      #else
        float wob = 0.006*rho*(sin(uTime*2.3)*dir.x+cos(uTime*1.7)*dir.y)*smoothstep(0.0,0.02,uDome);
      #endif
      float dH = (domeH(rho+0.02)-domeH(rho-0.02))/0.04;
      p = vec3(position.x*rs, 0.36+0.52*uLevel+domeH(rho)+wob, position.z*rs);
      n = normalize(vec3(-dH*dir.x, rs, -dH*dir.y));
    }
    vL = p;
  #endif
` + VS_TAIL + `}`;
const WINE_FS = FOG_PF + FS_HEAD + /* glsl */`
uniform float uPour, uDome, uLevel; uniform vec2 uPourAt;
// the body of the wine: deep, with a garnet edge that lights when the flame stands behind it
vec3 wineBody(vec3 N, vec3 V, vec3 L, vec3 lightC){
  float nv = abs(dot(N,V)); float edge = 1.0-nv; edge = edge*edge;
  float back = max(dot(-V,L),0.0); back *= back;
  float wrap = max(dot(N,L)*0.6+0.4,0.0);
  vec3 c = uWineDeep*(uAmb*2.2 + lightC*(0.5+1.2*wrap));
  c += uWineBody*lightC*(0.35*wrap + 0.8*back*(0.3+edge));
  c += uWineEdge*edge*(uAmb*0.5 + lightC*(0.4+1.5*back));
  return c;
}
void main(){
  LIGHT
  vec3 N = normalize(vN);
  vec3 lightC = uFlameCol*att;
  vec3 col;
  bool body = vUv.x < 0.5;
  #ifdef DEC
    if (vL.y > uLevel) discard;
    if (!gl_FrontFacing) { body = false; N = vec3(0.0,1.0,0.0); }
  #endif
  if (body) {
    float nv = abs(dot(N,V)); float edge = 1.0-nv; edge = edge*edge;
    col = wineBody(N,V,L,lightC);
    #ifdef BIG
      // LIGHT THROUGH THE GREAT GLASS'S WINE: the six candles' light comes through where the wine is thin (low in the bowl,
      // on the side that faces them) and at the bowl's edge against the eye; its core stays dark
      { vec3 Lm = ringMid()-vW; float dm = dot(Lm,Lm); Lm *= inversesqrt(max(dm,1e-4));
        float toward = dot(N,Lm)*0.5+0.5, lowK = 1.0-vUv.y;
        float thin = clamp(lowK*lowK*1.1+0.5*edge, 0.0, 1.0);                       // where the wine is thin: low in the bowl, and at its edge against the eye
        float bk = max(dot(-V,Lm),0.0); bk *= bk;                                   // the eye looks toward the candles through it
        float thr = thin*(0.2+0.8*toward*toward+0.7*bk) + 0.04*bk;
        col = col*(0.4+0.6*edge) + (uWineBody*2.0 + uWineEdge*thr*0.4)*uFlameCol*thr/(1.0+dm*uK); }
      float lw = max(fwidth(vUv.y), 0.012);                                         // (a pixel's footprint in the wine's depth)
      col += uWineEdge*topLine(vUv.y, 0.976, lw)*(uAmb*0.9+lightC*1.1);      // the meniscus line all round, no wider for the glass's size: under a wide pixel it shows its mean
    #else
    float lw = max(fwidth(vUv.y), 0.05);                                            // (a pixel's footprint in the wine's depth)
    col += uWineEdge*topLine(vUv.y, 0.93, lw)*(uAmb*0.4+lightC*0.45);         // the line, seen from the side: under a wide pixel it shows its mean
    #endif
    col += uFill*uFillAmt*edge*max(dot(N,uFillDir),0.0)*0.6;
  } else {
    float rho = vUv.y; vec2 rd = vL.xz/max(length(vL.xz),1e-4);
    #ifdef DEC
      rho = 0.3;
    #endif
    float wave = 0.55+0.45*sin(vW.z*0.045+uTime*0.9);                           // one slow wave down the hall
    float amp = 0.035*wave*(1.0+uSurge*4.0);
    vec2 pd = vL.xz-uPourAt; float pl = length(pd);                             // rings from the falling thread (the one glass)
    #ifdef BIG
      // (the great glass's rings are no coarser for its size: 0.09 m apart; the thread's 0.12 m apart, dying over 0.9 m.
      // Each is filtered by a pixel's footprint: gone where a pixel holds a whole ring)
      float rph = rho*90.0, pph = pl*420.0;
      float ring = sin(rph-uTime*2.6)*amp*smoothstep(0.0,0.2,rho)*(1.0-smoothstep(1.0,2.5,fwidth(rph)));
      float pring = uPour*0.2*sin(pph-uTime*9.0)*exp(-pl*9.0)*(1.0-smoothstep(1.0,2.5,fwidth(pph)));
    #else
    float ring = sin(rho*34.0-uTime*3.4)*amp*smoothstep(0.0,0.2,rho);
    float pring = uPour*0.16*sin(pl*150.0-uTime*11.0)*exp(-pl*7.0);
    #endif
    vec3 n = normalize(N + vec3(rd.x,0.0,rd.y)*ring + vec3(pd.x,0.0,pd.y)/max(pl,1e-3)*pring);
    vec3 R = reflect(-V,n); float rl = max(dot(R,L),0.0);
    #ifdef BIG
      rl = ringSpec(vW, R);
      #define MEN0 0.975
      #define MEN1 0.996
      #define GLN0 0.988
      #define GLN1 0.998
      #define HOLD0 0.992
    #else
      #define MEN0 0.84
      #define MEN1 0.975
      #define GLN0 0.945
      #define GLN1 0.99
      #define HOLD0 0.955
    #endif
    float fr = 1.0-max(dot(n,V),0.0); fr = fr*fr*fr*fr;
    col = uWineDeep*(uAmb*2.0+lightC*0.7) + uWineBody*lightC*0.22;
    #ifdef BIG
      col += uAmb*fr*0.22 + lightC*fr*0.04;                                       // (seen low across it, the great surface gives back the dark hall, not a pale sheet)
    #else
    col += uAmb*fr*0.8 + lightC*fr*0.12;
    #endif
    col += uFlameCol*att*mix(0.04, pow(rl,260.0)*5.5 + pow(rl,30.0)*0.25, vHl);     // the flame riding on it (its mean over the surface where the glass is a few pixels)
    float men = smoothstep(MEN0,MEN1,rho);                                        // (the great glass's meniscus is no wider for its size)
    vec2 lh = L.xz/max(length(L.xz),1e-4);
    col += uWineEdge*men*(uAmb*0.4 + lightC*(0.22+0.9*abs(dot(rd,lh))));          // the meniscus line
    col += uFlameCol*att*mix(0.05, smoothstep(GLN0,GLN1,rho)*(0.25+1.6*pow(abs(dot(rd,lh)),6.0)), vHl);
    // the dome: the wine's own body standing above the rim, the flame bent in it, a bright line where it holds
    float dk = smoothstep(0.0,0.02,uDome)*smoothstep(0.4,0.75,rho);
    float de = 1.0-max(dot(n,V),0.0); de *= de;                                    // the dome's own edge against the eye: bright garnet
    #ifdef BIG
      #define DOME_E 0.06
    #else
      #define DOME_E 0.3
    #endif
    vec3 dcol = wineBody(n,V,L,lightC) + uWineEdge*(lightC*(DOME_E+1.5*de)+uAmb*0.5*de) + uFlameCol*att*(pow(rl,180.0)*4.5 + pow(rl,48.0)*1.6 + pow(rl,12.0)*0.3)
              + (uWineEdge*lightC*1.5 + uFlameCol*att*1.1)*smoothstep(HOLD0,1.0,rho);
    col = mix(col, dcol, dk);
    col += uFill*uFillAmt*(fr+men*0.5)*0.7;
  }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
// the caustic: a card on the cloth, turned away from the flame in the vertex shader. Premultiplied: rgb is light
// laid on the cloth, alpha is the shadow the glass throws.
const CAUSTIC_VS = FOG_PV + /* glsl */`
attribute vec4 aFlame; uniform float uTime, uPix;
varying vec2 vUv; varying vec4 vFl; varying vec3 vW; varying float vR; varying float vHl;
void main(){
  vec3 c = vec3(0.0);
  #ifdef USE_INSTANCING
    c = instanceMatrix[3].xyz;
  #endif
  vec2 away = c.xz-aFlame.xz; float dl = length(away); away = dl > 1e-3 ? away/dl : vec2(1.0,0.0);
  #ifdef BIG
    // the great glass's caustic lies on the plinth's top: a card 5.4 m square about the foot, read in plan from the
    // foot's middle (vUv: metres away from the candles' middle, and across)
    vec2 q = (uv-0.5)*5.4;
    vec4 wp = modelMatrix*vec4(c.x+q.x, c.y+0.012, c.z+q.y, 1.0);
    vR = length(q); vHl = 1.0; vUv = vec2(dot(q,away), dot(q,vec2(-away.y,away.x)));
  #else
  float rise = max(aFlame.y-c.y, 0.2);
  float len = clamp(0.55+0.5*dl/rise*0.3, 0.6, 1.25);
  vec2 q = away*(uv.x*len-0.12) + vec2(-away.y,away.x)*(uv.y-0.5)*0.62;
  vec4 wp = modelMatrix*vec4(c.x+q.x, c.y+0.006, c.z+q.y, 1.0);
  vR = length(q);
  vHl = 1.0-smoothstep(0.03,0.12,length(cameraPosition-wp.xyz)*uPix);       // (the glass's own footprint: its bowl 12 pixels across, 3 pixels across)
  vUv = uv;
  #endif
  vW = wp.xyz; vFl = vec4((modelMatrix*vec4(aFlame.xyz,1.0)).xyz, aFlame.w);
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const CAUSTIC_FS = FOG_PF + /* glsl */`
uniform float uTime, uClipR, uK; uniform vec3 uFlameCol, uCaustic;
varying vec2 vUv; varying vec4 vFl; varying vec3 vW; varying float vR; varying float vHl;
` + GLSL_COMMON + /* glsl */`
void main(){
  vec3 Lv = vFl.xyz-vW; float d2 = dot(Lv,Lv);
  float br = breath(vFl.xyz, uTime); float att = vFl.w*br/(1.0+d2*uK);
  #ifdef BIG
  // THE GREAT GLASS'S CAUSTIC, in metres on the plinth's top (al: away from the candles' middle; ac: across): the foot's
  // shadow, the bowl's long shadow, the wine's light thrown through it as a ruby pool 1.95 m out, a gold cusp round it
  float al = vUv.x, ac = vUv.y;
  float env = 1.0-smoothstep(uClipR-0.1, uClipR, vR);
  float foot = 1.0-smoothstep(1.12,1.5,vR);
  float sh = exp(-(ac*ac)/1.69)*smoothstep(0.2,1.4,al)*0.6;
  float du = (al-1.95)/0.55, dv = ac/0.95; float ruby = exp(-du*du-dv*dv);
  float rr = length(vec2((al-1.55)*1.15, ac*0.8)); float cq = (rr-0.62)/0.045;
  float cusp = exp(-cq*cq)*smoothstep(1.55,1.95,al) + exp(-(ac*ac)/0.006)*smoothstep(1.7,2.0,al)*(1.0-smoothstep(2.1,2.5,al));
  cusp *= 0.85+0.15*sin(uTime*1.3+al*4.0);
  vec3 col = (uCaustic*ruby*1.5 + uFlameCol*cusp*1.2)*att*env;
  float a = clamp((sh*0.5+foot*0.4)*env*min(att*2.5,1.0), 0.0, 0.8);
  #else
  float u = vUv.x, v = (vUv.y-0.5)*2.0;
  float env = smoothstep(0.0,0.1,u)*(1.0-smoothstep(0.75,1.0,u))*(1.0-smoothstep(0.7,1.0,abs(v)));
  env *= 1.0-smoothstep(uClipR-0.04, uClipR, vR);
  float w = 0.16+0.5*u;                                                // the shadow widens away from the foot
  float sh = exp(-(v*v)/(w*w))*(1.0-smoothstep(0.35,0.95,u));
  float foot = 1.0-smoothstep(0.10,0.17,length(vec2((u-0.115)*1.6, v*0.5)));
  float du = (u-0.52)/0.2, dv = v/0.36; float ruby = exp(-du*du-dv*dv);
  float rr = length(vec2((u-0.46)*1.25, v*0.62)); float cq = (rr-0.17)/0.022;
  float cusp = exp(-cq*cq)*smoothstep(0.44,0.6,u) + exp(-(v*v)/0.0016)*smoothstep(0.52,0.62,u)*(1.0-smoothstep(0.62,0.9,u));
  cusp *= 0.85+0.15*sin(uTime*2.1+vFl.x*3.0+u*9.0);
  cusp = mix(0.019, cusp, vHl);                                        // the gold cusp, a thin line, goes to its mean where the glass is a few pixels (0.019: its mean over the card, weighed by the card's envelope)
  vec3 col = (uCaustic*ruby*1.3 + uFlameCol*cusp*1.5)*att*env;
  float a = clamp((sh*0.5+foot*0.35)*env*min(att*2.5,1.0), 0.0, 0.8);
  #endif
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float ff = exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      float ff = 1.0-smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    col *= ff; a *= ff;
  #endif
  gl_FragColor = vec4(col, a);
}`;
// flames: cards that turn to the eye about the vertical. instanceMatrix: translation = top of the wick,
// scale x = width of the flame, scale y = its height. They lean, lengthen and breathe, each for itself.
const FLAME_VS = FOG_PV + /* glsl */`
uniform float uTime, uGustAmp, uGustTail;
varying vec2 vUv; varying float vBr;
` + GLSL_COMMON + GLSL_GUST + /* glsl */`
void main(){
  vec3 c = vec3(0.0); float w = 1.0, h = 1.0;
  #ifdef USE_INSTANCING
    c = instanceMatrix[3].xyz; w = length(instanceMatrix[0].xyz); h = length(instanceMatrix[1].xyz);
  #endif
  vec4 wc = modelMatrix*vec4(c,1.0);
  float ms = length(modelMatrix[1].xyz); w *= ms; h *= ms;
  float k = h31(floor(c*7.0)+3.0);
  vBr = breath(c, uTime);
  vec3 toC = cameraPosition-wc.xyz; vec2 f = toC.xz/max(length(toC.xz),1e-3); vec3 right = vec3(f.y,0.0,-f.x);
  // the breath: a front travelling south (gustD: its measure as this flame feels it); flames gutter low in a band at
  // the front and lean on the breath's one bearing (south, 18 degrees east of it) behind it, recovering over uGustTail
  // of that measure. Never to dark.
  float y = uv.y; float dz = gustD(wc.z); float gust = uGustAmp*(dz > 0.0 ? exp(-dz*dz/60.0) : exp(dz/max(uGustTail,1.0)));
  float dg = dz+7.0; float gut = min(uGustAmp*exp(-dg*dg/260.0),1.0);
  h *= 1.0+0.11*sin(uTime*(2.2+2.0*k)+k*30.0)-0.4*gut+0.5*min(gust,1.2);     // drawn out long as it is laid over
  w *= 1.0+0.25*min(gust,1.0);
  vec2 lean = vec2(sin(uTime*(1.7+1.9*k)+k*50.0), cos(uTime*(1.3+1.6*k)+k*23.0))*0.085*h*(1.0+2.0*min(gust,1.0)) + vec2(0.309, 0.951)*3.54*gust*h;
  vBr *= 1.0-0.3*gut;
  // (the flame's card, 2.6 w wide and 1.25 h tall, keeps its true size at every distance: a far flame's light is carried
  // by its halo, which the world draws)
  vec3 p = wc.xyz + right*(uv.x-0.5)*w*2.6 + vec3(0.0,(y-0.06)*h*1.25,0.0) + vec3(lean.x,0.0,lean.y)*y*y;
  p.y -= 0.62*min(gust,1.2)*h*y*y;
  vUv = uv;
  vec4 mvPosition = viewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FLAME_FS = FOG_PF + /* glsl */`
uniform vec3 uFlameCol; uniform float uFlameGain;
varying vec2 vUv; varying float vBr;
void main(){
  float y = clamp((vUv.y-0.05)/0.8, 0.0, 1.0); float x = (vUv.x-0.5)*2.6;
  float wd = 0.52*sqrt(y)*(1.0-y*y)+0.02;                              // teardrop
  float r = abs(x)/wd;
  float body = (1.0-smoothstep(0.55,1.0,r))*step(vUv.y,0.86)*smoothstep(0.0,0.03,vUv.y-0.05);
  float core = (1.0-smoothstep(0.0,0.7,r))*smoothstep(0.08,0.3,y)*(1.0-smoothstep(0.55,0.95,y));
  vec3 outer = vec3(1.0,0.36,0.07)*0.75, hot = uFlameCol*2.6+vec3(0.35,0.3,0.2);
  vec3 col = mix(outer, hot, core)*body;
  col = mix(col, vec3(0.10,0.16,0.5)*body, (1.0-smoothstep(0.0,0.16,y))*0.8); // the blue foot of the flame
  float gx = (vUv.x-0.5)*2.0, gy = (vUv.y-0.4)*1.6; float glow = exp(-(gx*gx+gy*gy)*5.0);
  col += uFlameCol*glow*0.10;
  col *= vBr*uFlameGain;
  ` + FOG_ADD + /* glsl */`
  gl_FragColor = vec4(col,1.0);
}`;

// ---------- the kit ----------
const PALETTE = ['#F3E3BF', '#7A0F1E', '#E8A23A', '#1A120C', '#3A2416', '#C9A24A', '#16233F'];
function shaderMat(U, vs, fs, extra = {}) {
  return new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });
}
// makeGlassKit(ctx, { palette, wine }) -> {
//   uniforms    shared table. uTime (set by kit.update), uSurge (0..1: the rare event's surge of the rings),
//               uGustM / uGustAmp / uGustTail (the breath: flames gutter where its front stands, which GLSL_GUST works
//               out from the metres flown, and lean on one bearing, south and 18 degrees east of it, behind it,
//               recovering over uGustTail of its measure), uGustZ (the same front's place in z, for the world's own use),
//               uFlameCol, uAmb (warm underlight), uFill + uFillDir + uFillAmt (the look's cool edge), uFlameGain
//               uGwE, uGwW (the cold light of the hall's east and west great windows: the world sets them; black otherwise)
//               uPix (the angle of one pixel, in radians: ONE number for the whole frame, set by the world
//               each frame from the drawing buffer's height; times the distance it is one pixel's size at a thing:
//               the glasses and their caustics go to their means by it, a stem and the thread go out by it)
//               uGustM (the metres flown, for the breath's law: GLSL_GUST)
//   geometry    { near, mid, far, speck, one: { shell, wine }, caustic, flame }   near 160, mid 70, far 32, speck 18 triangles a glass
//   materials   { shell, wine, wineFar, caustic, flame }   (wineFar: the far and speck weights' wine, by the same law)
//   makeGlasses(weight, count, { caustic = true }) -> { group, shell, wine, caustic, count,
//               set(i, x, y, z, fx, fy, fz, strength = 1, turn = 0), commit() }   3 draw calls (2 without caustic);
//               (x, y, z) = where the foot stands, (fx, fy, fz) = its nearest flame; call commit() once after the sets
//   makeFlames(count) -> { mesh, set(i, x, y, z, height = 0.34, width = 0.13), commit() }   1 draw call
//   setWine(name), setLight(flameStrength, fillHex, fillDir, fillAmt), update(time), triangles }
export function makeGlassKit(ctx, opts = {}) {
  const pal = opts.palette || PALETTE;
  const flameCol = lin(pal[2]).lerp(lin('#FFE0A6'), 0.62);
  const U = {
    uTime: { value: 0 }, uK: { value: 0.10 }, uSurge: { value: 0 }, uGustZ: { value: 0 }, uGustM: { value: 0 }, uGustAmp: { value: 0 }, uGustTail: { value: 70 }, uFlameGain: { value: 1 },
    uFlameCol: { value: flameCol }, uAmb: { value: lin(pal[4]).multiplyScalar(1.2).add(new THREE.Color(0.055, 0.045, 0.032)) },
    uFill: { value: lin(pal[6]).multiplyScalar(4) }, uFillDir: { value: new THREE.Vector3(1, 0.3, 0).normalize() }, uFillAmt: { value: 0 },
    uWineDeep: { value: new THREE.Color() }, uWineBody: { value: new THREE.Color() }, uWineEdge: { value: new THREE.Color() }, uCaustic: { value: new THREE.Color() },
    uGwE: { value: new THREE.Color(0, 0, 0) }, uGwW: { value: new THREE.Color(0, 0, 0) },
    uPix: { value: 0.0013 },
  };
  const still = { uLevel: { value: HALF }, uDome: { value: 0 }, uPour: { value: 0 }, uPourAt: { value: new THREE.Vector2(-0.1, 0) } };
  const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
  const materials = {
    shell: shaderMat(U, SHELL_VS, SHELL_FS, { ...add, side: THREE.DoubleSide, defines: { MEANS: 1 } }),
    // the instanced wine is a solid at every weight: opaque, it writes depth and hides what stands behind it.
    // wine: the near and middle weights; wineFar: the far and speck weights (the same law, a material of their own)
    wine: shaderMat({ ...U, ...still }, WINE_VS, WINE_FS, { defines: { MEANS: 1 } }),
    wineFar: shaderMat({ ...U, ...still }, WINE_VS, WINE_FS, { defines: { MEANS: 1 } }),
    caustic: shaderMat({ ...U, uClipR: { value: 1000 } }, CAUSTIC_VS, CAUSTIC_FS, { transparent: true, depthWrite: false, blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    flame: shaderMat(U, FLAME_VS, FLAME_FS, add),
  };
  const geometry = { caustic: new THREE.PlaneGeometry(1, 1), flame: new THREE.PlaneGeometry(1, 1) };
  const triangles = {};
  for (const w of ['near', 'mid', 'far', 'speck', 'one']) {
    geometry[w] = { shell: shellGeometry(w), wine: w === 'one' ? oneWineGeometry() : wineGeometry(w) };
    triangles[w] = (geometry[w].shell.index.count + geometry[w].wine.index.count) / 3;
  }
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3(1, 1, 1), yAxis = new THREE.Vector3(0, 1, 0);
  function instanced(geo, mat, count, order) {
    const g = geo.clone();
    const fl = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
    g.setAttribute('aFlame', fl);
    const mesh = new THREE.InstancedMesh(g, mat, count);
    mesh.renderOrder = order;
    return mesh;
  }
  function makeGlasses(weight, count, o = {}) {
    const group = new THREE.Group();
    const wine = instanced(geometry[weight].wine, o.wineMaterial || (weight === 'far' || weight === 'speck' ? materials.wineFar : materials.wine), count, -0.5);
    const shell = instanced(geometry[weight].shell, materials.shell, count, 3);
    const caustic = o.caustic === false ? null : instanced(geometry.caustic, materials.caustic, count, 1);
    if (caustic) caustic.frustumCulled = false;
    group.add(wine, shell); if (caustic) group.add(caustic);
    const all = caustic ? [wine, shell, caustic] : [wine, shell];
    return {
      group, shell, wine, caustic, count,
      set(i, x, y, z, fx, fy, fz, strength = 1, turn = 0) {
        m4.compose(v3.set(x, y, z), q4.setFromAxisAngle(yAxis, turn), s3);
        for (const m of all) { m.setMatrixAt(i, m4); m.geometry.attributes.aFlame.setXYZW(i, fx, fy, fz, strength); }
      },
      commit() { for (const m of all) { m.instanceMatrix.needsUpdate = true; m.geometry.attributes.aFlame.needsUpdate = true; m.computeBoundingSphere(); } },
    };
  }
  function makeFlames(count) {
    const mesh = new THREE.InstancedMesh(geometry.flame, materials.flame, count);
    mesh.frustumCulled = false; mesh.renderOrder = 5;
    return {
      mesh,
      set(i, x, y, z, height = 0.34, width = 0.13) { m4.compose(v3.set(x, y, z), q4.identity(), s3.set(width, height, 1)); s3.set(1, 1, 1); mesh.setMatrixAt(i, m4); },
      commit() { mesh.instanceMatrix.needsUpdate = true; },
    };
  }
  function setWine(name) {
    const w = WINES[name] || WINES.ruby;
    U.uWineDeep.value.set(w.deep); U.uWineBody.value.set(w.body); U.uWineEdge.value.set(w.edge); U.uCaustic.value.set(w.caustic);
    kit.wine = WINES[name] ? name : 'ruby';
  }
  const fillC = new THREE.Color();
  function setLight(flameStrength = 1, fillHex = null, fillDir = null, fillAmt = 0) {
    U.uFlameGain.value = flameStrength;
    if (fillHex) U.uFill.value.copy(fillC.set(fillHex)).multiplyScalar(1);
    if (fillDir) U.uFillDir.value.copy(fillDir).normalize();
    U.uFillAmt.value = fillAmt;
  }
  const kit = { uniforms: U, geometry, materials, instanced, makeGlasses, makeFlames, setWine, setLight, triangles, wine: 'ruby', flameColor: flameCol,
    update(time) { U.uTime.value = time; } };
  setWine(opts.wine);
  return kit;
}

// ---------- the solids of the hero: one candle-lit material for gilt, silver, wax, oak, linen and fruit ----------
// attributes: color = albedo, aMat = (metal, gloss, kind: 0 plain, 2 oak herringbone, 3 linen), uv = (glow, occlusion)
const SOLID_VS = FOG_PV + /* glsl */`
attribute vec3 color; attribute vec3 aMat;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec3 vM; varying vec2 vG; varying vec3 vP;
void main(){
  vec4 wp = modelMatrix*vec4(position,1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix)*normal + vec3(0.0,1e-6,0.0)); vC = color; vM = aMat; vG = uv; vP = position;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SOLID_FS = FOG_PF + /* glsl */`
uniform float uTime, uFillAmt, uFlameI, uK;
uniform vec3 uFlamePos, uFlameCol, uAmb, uFill, uFillDir, uWineEdge;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying vec3 vM; varying vec2 vG; varying vec3 vP;
` + GLSL_COMMON + /* glsl */`
void main(){
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW + vec3(0.0,1e-5,0.0));
  vec3 Lv = uFlamePos - vW; float d2 = dot(Lv,Lv); vec3 L = Lv*inversesqrt(max(d2,1e-4));
  float br = breath(uFlamePos, uTime); float att = uFlameI*br/(1.0+d2*uK);
  vec3 alb = vC; float metal = vM.x, gloss = vM.y, kind = vM.z;
  float n1 = vnoise(vP*26.0), n2 = vnoise(vP*vec3(90.0,7.0,90.0));
  if (kind > 1.5 && kind < 2.5) {                                    // polished oak, laid herringbone
    vec2 h = vP.xz/0.26; float ci = floor(h.x); float sgn = mod(ci,2.0) < 0.5 ? 1.0 : -1.0;
    float al = (h.y + sgn*fract(h.x))/1.6; float bi = floor(al);
    float id = h31(vec3(ci, bi, 3.0));
    float ex = min(fract(h.x), 1.0-fract(h.x)), ey = min(fract(al), 1.0-fract(al))*1.6;
    float seam = smoothstep(0.0,0.035,min(ex,ey));
    float grain = vnoise(vec3(vP.x*(sgn>0.0?9.0:60.0), 1.0, vP.z*(sgn>0.0?60.0:9.0)) + id*20.0);
    alb *= (0.7+0.6*id)*(0.85+0.3*grain)*(0.45+0.55*seam);
    gloss *= seam;
  } else if (kind > 3.5) {                                           // the dais's marble: polished, veined
    float v1 = vnoise(vP*vec3(1.3,3.0,1.3)+vnoise(vP*2.7)*2.0); float vein = smoothstep(0.44,0.5,v1)*(1.0-smoothstep(0.5,0.58,v1));
    alb *= 0.92+0.1*n1-0.3*vein; gloss *= 1.0-0.4*vein;
  } else if (kind > 2.5) {                                           // linen: soft weave, creases come from the form
    alb *= 0.93+0.07*n2+0.05*(n1-0.5);
  } else {
    alb *= 0.9+0.2*n1; gloss *= 0.8+0.3*n2;                           // hammered, turned, handled
  }
  vec3 R = reflect(-V,N); float rl = max(dot(R,L),0.0);
  float nl = dot(N,L); float wrap = max(nl*0.75+0.25,0.0);
  vec3 lightC = uFlameCol*att;
  // metal: it shows the hall, a dark warm room with a band of far candles round the horizon
  float ry = (R.y-0.06)/0.2; float band = exp(-ry*ry);
  float cand = vnoise(vec3(R.x*8.0, R.y*5.0+uTime*0.12, R.z*8.0)+3.0); cand *= 0.9+0.1*sin(uTime*2.6+R.x*31.0+R.z*27.0);
  vec3 env = uAmb*(0.5+0.7*smoothstep(-0.4,0.6,R.y)) + uFlameCol*band*(0.22+1.5*smoothstep(0.55,0.85,cand));
  env += uWineEdge*0.05*(1.0-smoothstep(-0.4,0.2,R.y));
  vec3 cm = alb*(env*1.25 + lightC*(pow(rl, mix(10.0,180.0,gloss))*(1.0+5.0*gloss) + 0.35*wrap));
  vec3 cd = alb*(uAmb*(0.9+0.5*N.y) + lightC*wrap*1.05) + lightC*pow(rl,40.0)*gloss*0.35;
  vec3 col = mix(cd, cm, metal);
  float fr = 1.0-max(dot(N,V),0.0); fr = fr*fr*fr;
  float ak = clamp(dot(alb,vec3(1.6)),0.0,1.0);                                                     // a dark surface takes little of the cool edge
  col += uFill*uFillAmt*(alb*max(dot(N,uFillDir),0.0)*0.3 + fr*(0.15+0.5*metal)*ak*ak);
  col *= vG.y;
  col += alb*mix(uFlameCol, vec3(1.0,0.92,0.8), 0.6)*vG.x*br*0.9;                                   // wax lit from within, under the flame
  gl_FragColor = vec4(col,1.0);
  #include <fog_fragment>
}`;
// paint a geometry for the solid material: constant albedo (with an optional per-vertex tweak), then collect it
function paint(list, g, hex, metal, gloss, kind = 0, o = {}) {
  if (o.matrix) g.applyMatrix4(o.matrix);
  const n = g.attributes.position.count, P = g.attributes.position;
  const col = new Float32Array(n * 3), mat = new Float32Array(n * 3), uv = new Float32Array(n * 2), c = lin(hex);
  for (let i = 0; i < n; i++) {
    const k = o.shade ? o.shade(P.getX(i), P.getY(i), P.getZ(i)) : 1;
    col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
    mat[i * 3] = metal; mat[i * 3 + 1] = gloss; mat[i * 3 + 2] = kind;
    uv[i * 2] = o.glow ? o.glow(P.getX(i), P.getY(i), P.getZ(i)) : 0;
    uv[i * 2 + 1] = o.ao ? o.ao(P.getX(i), P.getY(i), P.getZ(i)) : 1;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aMat', new THREE.BufferAttribute(mat, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  list.push(g);
  return g;
}
const lathe = (profile, seg, o) => revolve(profile.map((p) => [p[0], p[1], 0, 0]), seg, o);
// flutes: push a lathe's radius in and out between two heights, then let the normals follow
function flute(g, n, depth, y0, y1, twist = 0) {
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    if (y < y0 || y > y1) continue;
    const t = (y - y0) / (y1 - y0), e = Math.sin(PI * t) ** 0.5;
    const k = 1 - depth * e * (0.5 + 0.5 * Math.cos(n * (Math.atan2(z, x) + twist * t)));
    P.setXYZ(i, x * k, y, z * k);
  }
  g.computeVertexNormals();
  return g;
}
const tube = (pts, r, seg, rad = 8, closed = false) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), closed), seg, r, rad, closed);
const T = (x, y, z, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));

// ---------- the hero's furniture (hero-local metres: the origin is the dais floor under the great glass's axis) ----------
const P_GLASS = [0, 0.9, 0];                                         // the great glass's foot, on the plinth's top
const RIM_Y = P_GLASS[1] + GREAT * GLASS.height;                     // 7.94: its rim
const P_LIP = [-0.35, RIM_Y + 2.6, 0];                               // where the thread leaves the decanter: 2.6 m over the rim
const DS = 3.9;                                                      // the decanter: decR0's profile DS times over (6.05 m long, 2.85 m through)
const TILT = 14 * PI / 180, DEC_LEN = 1.55 * DS, LIP_R = 0.115 * DS;
const DEC_C = [P_LIP[0] + LIP_R * Math.sin(TILT), P_LIP[1] + LIP_R * Math.cos(TILT)];                // centre of the lip ring (x, y)
const DEC_M = T(DEC_C[0] - Math.cos(TILT) * DEC_LEN, DEC_C[1] + Math.sin(TILT) * DEC_LEN, 0, 0, 0, -(PI / 2 + TILT)); // decanter-local (+Y base to lip) -> hero
// a point of the decanter: yl metres along its axis from the base, `down` metres below the axis (hero x, y)
const decPoint = (yl, down = 0) => [DEC_C[0] - Math.cos(TILT) * (DEC_LEN - yl) - Math.sin(TILT) * down, DEC_C[1] + Math.sin(TILT) * (DEC_LEN - yl) - Math.cos(TILT) * down];
// the decanter's profile: outside radius at yl along its axis, in its own small measure (1.55 long); decR: as it hangs
function decR0(yl) {
  if (yl < 0.06) return 0.29 + 0.05 * Math.sqrt(yl / 0.06);
  if (yl < 0.75) return 0.34 + 0.025 * Math.sin(PI * (yl - 0.06) / 0.69);
  if (yl < 1.02) { const t = (yl - 0.75) / 0.27, e = t * t * (3 - 2 * t); return 0.34 + (0.085 - 0.34) * e; }
  if (yl < 1.46) return 0.085 - 0.012 * Math.sin(PI * (yl - 1.02) / 0.44) + 0.012 * Math.exp(-Math.pow((yl - 1.08) / 0.02, 2));
  return 0.085 + (0.115 - 0.085) * Math.pow((yl - 1.46) / (1.55 - 1.46), 1.6);
}
const decR = (yl) => DS * decR0(yl / DS);
// THE SIX CANDLE STANDS: on the plinth's lowest step, 3.8 m from the axis, on the west half only (20 to 135 degrees
// round from the south by the west: none stands so far north that its flame, laid over toward the south by the rare
// breath, could reach the bowl: the northmost one's passes about 0.5 m from it); FLAME_Y: about their flames' height (the wax's top is at 4.36; 4.14 in the blue hour)
const STAND_R = 3.8, FLAME_Y = 4.5, STAND_A = [20, 43, 66, 89, 112, 135].map((d) => d * PI / 180);
const standAt = (i) => [-STAND_R * Math.sin(STAND_A[i]), STAND_R * Math.cos(STAND_A[i])];
const PLINTH_R = [4.2, 3.4, 2.6], CRANE_X = -7.6;

// THE PLINTH (three round steps of the dais's marble, 0.3 m each: cream treads, green-black risers, gilt nosings), the six
// tall gilt candle stands, and a still life at the hall's own scale on the steps' south-west side
async function buildPlinth(list, rng, pal, look, yld) {
  const gilt = pal[5], cream = '#cdbf9f', dark = '#1f2b25', SEG = 72;
  const ao = (x, y, z) => 1 - 0.55 * Math.exp(-Math.pow(Math.max(Math.hypot(x, z) - 1.2, 0) / 0.35, 2));     // the foot's own shade on the top
  for (let i = 0; i < 3; i++) { const R = PLINTH_R[i], y0 = 0.3 * i, y1 = y0 + 0.3;
    paint(list, lathe([[R, y0], [R, y0 + 0.22]], SEG), dark, 0, 0.75, 4);
    paint(list, lathe([[R, y0 + 0.22], [R + 0.055, y0 + 0.24], [R + 0.055, y0 + 0.285], [R - 0.05, y1]], SEG), gilt, 1, 0.8);
    if (i < 2) paint(list, lathe([[R - 0.05, y1], [PLINTH_R[i + 1], y1]], SEG, { up: true }), cream, 0, 0.8, 4, { shade: (x, y, z) => 0.82 + 0.18 * Math.min(1, (R - Math.hypot(x, z)) / 0.5) });
    else paint(list, lathe([[R - 0.05, y1], [1.7, y1], [1.25, y1]], SEG, { top: [y1, 0, 0], up: true }), cream, 0, 0.8, 4, { shade: ao });
    await yld(); }
  // the candle stands: turned gilt, 3.54 m to the pan, a thick wax candle (0.52 m; a stub of 0.3 m in the blue hour)
  const hc = look === 'blue' ? 0.3 : 0.52, cup = FLAME_Y - 0.66, top = cup + hc, h0 = cup - 0.3;      // (cup: the pan's height; h0: the stand's height over its step)
  const prof = [[0.36, 0], [0.38, 0.05], [0.3, 0.13], [0.15, 0.2], [0.1, 0.36], [0.15, 0.44], [0.08, 0.54], [0.06, 0.3 * h0], [0.075, 0.5 * h0], [0.14, 0.53 * h0], [0.075, 0.56 * h0],
    [0.055, 0.8 * h0], [0.07, h0 - 0.14], [0.25, h0 - 0.05], [0.28, h0], [0.1, h0 - 0.02]].map((q) => [q[0], q[1] + 0.3]);
  const glow = (x, y) => 0.32 * Math.exp(-Math.max(top - y, 0) / 0.16);
  for (let i = 0; i < 6; i++) { const [x, z] = standAt(i), M = T(x, 0, z, 0, i * 1.3, 0);
    paint(list, lathe(prof, 8), gilt, 1, 0.75, 0, { matrix: M, shade: (px, py) => 0.6 + 0.4 * Math.min(1, (py - 0.3) / 0.3) });
    paint(list, lathe([[0.095, cup - 0.02], [0.098, top - 0.05], [0.09, top], [0.03, top - 0.02]], 6, { top: [top - 0.02, 0, 0] }), pal[0], 0, 0.5, 0, { matrix: M, glow, shade: () => 0.95 });
    if (i % 2) await yld(); }
  // pomegranates on the lowest tread and the one above it, dusky, never brighter than the wine: between the second and
  // the third stand (54.5 degrees round, give or take 1.7), clear of both stands' feet
  const nP = rng.int(5, 7), a0 = 54.5 * PI / 180;
  for (let i = 0; i < nP; i++) {
    const hi = i % 3 === 2, a = a0 + rng.range(-0.03, 0.03), r = 0.17 + rng() * 0.03, rad = (hi ? 3.0 : 3.75) + rng.range(-0.14, 0.14), yb = hi ? 0.6 : 0.3;
    const pr = []; for (let k = 1; k <= 5; k++) { const t = k / 6; pr.push([r * Math.pow(Math.sin(PI * t), 0.8) * (1 + 0.04 * Math.cos(t * 9)), r * (1 - Math.cos(PI * t)) * 0.94]); }
    pr.push([r * 0.2, r * 1.9], [r * 0.24, r * 2.08], [r * 0.3, r * 2.14]);                                    // the crown
    const g = lathe(pr, 8, { bottom: [0, 0, 0] });
    flute(g, 5, 0.06, 0.02, r * 1.85, 0);
    const hue = lin('#5a1517').lerp(lin(rng.chance(0.4) ? '#7a341c' : '#3f0d13'), rng() * 0.7);
    paint(list, g, '#' + hue.getHexString(), 0, 0.45, 0, { matrix: T(-rad * Math.sin(a), yb + 0.015, rad * Math.cos(a), rng.range(-0.5, 0.5), rng() * 6, rng.range(-0.5, 0.5)) });
  }
  await yld();
  // a folded cloth laid on the second tread and hanging over the lowest step's riser, 31.5 degrees round from the south:
  // midway between the first and the second stand, 0.6 to 0.74 m wide, clear of both stands' feet
  const ph = rng() * 6.28, cw = 0.6 + rng() * 0.14, ca = 31.5 * PI / 180, ux = -Math.sin(ca), uz = Math.cos(ca);    // (ux, uz): outward
  for (let layer = 0; layer < 2; layer++) {
    const nu = 8, nv = 12, pos = [], idx = [], off = layer * 0.016, r0 = 2.75 + layer * 0.12, rE = PLINTH_R[1] + 0.07, drop = layer ? 0.16 : 0.26;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = (i / nu - 0.5) * cw, s = (j / nv) * (rE - r0 + drop); let r, y;
      if (s < rE - r0) { r = r0 + s; y = 0.612 + off; } else { const h = s - (rE - r0), hang = Math.min(1, h / 0.1);
        r = rE + off + 0.02 * hang + hang * (0.03 * Math.sin(u * 15 + ph) + 0.018 * Math.sin(u * 31 + ph * 2)); y = 0.612 + off - h; }
      pos.push(ux * r - uz * u, y, uz * r + ux * u);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, c = a + nu + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((nu + 1) * (nv + 1) * 2), 2));
    paint(list, g, pal[0], 0, 0.1, 3, { shade: (x, y, z) => (layer ? 0.74 : 0.66) * (0.86 + 0.14 * Math.sin((x * uz + z * ux) * 30 + ph + 1.5)) });
  }
  return { top, cup };
}

// THE CRANE AND THE YOKE, all gilt: a turned post on the dais 7.6 m west of the glass's axis, a swan-neck arm over the
// decanter with a scrolled brace under it, a chain of five links, and the yoke: two hoops round the decanter's belly
// joined by a bar along its back, an eye at the bar's middle. Nothing of it stands east of the decanter's own lip.
async function buildCrane(list, pal, yld) {
  const gilt = pal[5], grime = (x, y) => 0.6 + 0.4 * Math.min(1, y / 0.4);
  const post = [[0.55, 0], [0.58, 0.06], [0.52, 0.16], [0.34, 0.24], [0.26, 0.5], [0.3, 0.62], [0.2, 0.78], [0.17, 3.0], [0.15, 6.5], [0.21, 6.62], [0.21, 6.74], [0.14, 6.86],
    [0.13, 10.0], [0.115, 12.9], [0.2, 13.05], [0.22, 13.2], [0.12, 13.32]];
  paint(list, lathe(post, 10, { top: [13.32, 0, 0] }), gilt, 1, 0.75, 0, { matrix: T(CRANE_X, 0, 0), shade: grime });
  const sA = 1.0, sB = 3.1, mid = decPoint((sA + sB) / 2, -(decR((sA + sB) / 2) + 0.32)), eye = [mid[0], mid[1] + 0.16];      // the bar's middle, over the belly, and the eye on it
  const end = [eye[0], eye[1] + 1.55];                                                                    // the arm's end, straight over the eye
  paint(list, tube([[CRANE_X, 13.25, 0], [CRANE_X + 0.15, 14.7, 0], [CRANE_X + 1.0, 16.0, 0], [(CRANE_X + end[0]) / 2 + 0.3, 16.5, 0], [end[0] - 0.55, 16.05, 0], [end[0], end[1] + 0.12, 0]], 0.1, 16, 6), gilt, 1, 0.8);
  paint(list, tube([[CRANE_X + 0.1, 11.2, 0], [CRANE_X + 0.75, 12.6, 0], [CRANE_X + 1.15, 14.4, 0], [CRANE_X + 1.3, 15.95, 0]], 0.06, 8, 5), gilt, 1, 0.8);
  paint(list, new THREE.SphereGeometry(0.2, 8, 5), gilt, 1, 0.85, 0, { matrix: T(CRANE_X, 13.5, 0) });
  await yld();
  for (let k = 0; k < 5; k++) paint(list, new THREE.TorusGeometry(0.16, 0.035, 4, 8), gilt, 1, 0.85, 0, { matrix: T(end[0], end[1] - 0.06 - 0.295 * k, 0, 0, k % 2 ? PI / 2 : 0, 0) });
  paint(list, new THREE.TorusGeometry(0.15, 0.045, 4, 8), gilt, 1, 0.85, 0, { matrix: T(eye[0], eye[1], 0) });
  for (const s of [sA, sB]) { const g = new THREE.TorusGeometry(decR(s) + 0.075, 0.075, 5, 28); g.rotateY(PI / 2); const c = decPoint(s);
    paint(list, g, gilt, 1, 0.85, 0, { matrix: T(c[0], c[1], 0, 0, 0, -TILT) }); }
  const bA = decPoint(sA - 0.35, -(decR(sA) + 0.3)), bB = decPoint(sB + 0.35, -(decR(sA) + 0.3));
  paint(list, tube([[bA[0], bA[1], 0], [mid[0], mid[1], 0], [bB[0], bB[1], 0]], 0.07, 6, 5), gilt, 1, 0.85);
  for (const s of [sA, sB]) { const a = decPoint(s, -(decR(s) + 0.1)), b = decPoint(s, -(decR(sA) + 0.3)); paint(list, tube([[a[0], a[1], 0], [b[0], b[1], 0]], 0.06, 1, 5), gilt, 1, 0.85); }
  return { post: [CRANE_X, 13.32], armTop: 16.6, end };
}

// ---------- the decanter (cut-glass shell + the wine left in its belly) and the thread ----------
function decanterShellGeometry() {
  const rings = [[0.0, 0.035, 0, 0], [0.16, 0.022, 0, 0], [0.25, 0.004, 0, 0], [0.285, 0.0, 0, 0]];
  for (let i = 0; i <= 20; i++) { const yl = 0.004 + (1.46 - 0.004) * (i / 20); rings.push([decR0(yl), yl, 0, 0.9 * yl / 1.55]); }
  rings.push([0.098, 1.5, 0, 0.9], [0.115 - 0.004, 1.55 - 0.012, 3, 1], [0.115, 1.55, 3, 1], [0.115 - 0.012, 1.55 + 0.004, 3, 1], [0.078, 1.55 - 0.03, 3, 1], [0.07, 1.4, 0, 0.9]);
  const g = revolve(rings, 64);
  g.setAttribute('aLocal', new THREE.BufferAttribute(g.attributes.position.array.slice(), 3));          // (the cut's law reads the decanter's own small measure)
  g.scale(DS, DS, DS); g.applyMatrix4(DEC_M);
  return g;
}
function decanterWineGeometry() {
  const rings = [];
  for (let i = 0; i <= 14; i++) { const yl = 0.03 + (1.02 - 0.03) * (i / 14); rings.push([Math.max(decR0(yl) - 0.012, 0.02), yl, 0, 0.5]); }
  const body = revolve(rings, 32, { bottom: [0.045, 0, 0.5], top: [1.03, 0, 0.5] });
  body.scale(DS, DS, DS); body.applyMatrix4(DEC_M);
  // the run of wine down the floor of the neck to the lip
  const a = decPoint(0.9 * DS, 0.2 * DS), m = decPoint(1.03 * DS, decR(1.03 * DS) - 0.1), e = decPoint(DEC_LEN - 0.04, LIP_R - 0.08);
  const run = tube([[a[0], a[1], 0], [m[0], m[1], 0], [(m[0] + e[0]) / 2, (m[1] + e[1]) / 2, 0], [e[0], e[1], 0], [P_LIP[0] + 0.02, P_LIP[1] + 0.04, 0]], 0.075, 10, 6);
  const P = run.attributes.uv; for (let i = 0; i < P.count; i++) P.setXY(i, 0, 0.5);
  const g = mergeGeometries([body, run]); body.dispose(); run.dispose();
  return g;
}
// thread: a unit tube (cos, t, sin), t = 0 at the lip, 1 at the wine. Everything about it is uniforms.
function threadGeometry() {
  const rings = []; for (let i = 0; i <= 48; i++) rings.push([1, i / 48, 0, i / 48]);
  return revolve(rings, 10);
}
const THREAD_VS = FOG_PV + /* glsl */`
uniform float uTime, uSurfY, uHead, uBreak, uDrop, uOn, uPix;
uniform vec3 uLip;
varying vec3 vW; varying vec3 vN; varying float vT; varying float vA;
void main(){
  float t = position.y; vT = t;
  float len = max(uLip.y-uSurfY, 0.01);
  // THE GREAT DECANTER'S STREAM, at its true size: 0.15 m through at the lip, drawn down to 0.09 m, spreading a little
  // where it lands; it twists slowly and sways 0.035 m either way
  float r = 0.075*mix(1.0, 0.6, smoothstep(0.0,0.3,t)) + 0.03*smoothstep(0.93,1.0,t);
  r *= 1.0+0.18*sin(t*11.0-uTime*4.5)*smoothstep(0.05,0.3,t);            // it twists a little
  // the drops: drop k leaves the lip when uDrop is k and falls for two of uDrop's units, gathering speed (three drops)
  float pv = 2.0*sqrt(max(t,0.0)); float ph = uDrop-pv; float k = floor(ph+0.5); float d = ph-k;
  float bead = exp(-d*d/0.0016)*step(-0.5,k)*step(k,2.5);
  r = r*(1.0-uBreak) + 0.07*bead*uBreak;
  r *= step(t, uHead)*uOn;
  vec2 off = 0.035*vec2(sin(t*5.0+uTime*2.1), cos(t*4.0-uTime*1.7))*smoothstep(0.0,0.4,t);
  vec3 c = vec3(uLip.x+off.x, uLip.y-t*len, uLip.z+off.y);
  vec4 wc = modelMatrix*vec4(c,1.0);
  float dist = length(cameraPosition-wc.xyz);
  float ms = max(length(modelMatrix[1].xyz), 1e-4);
  // drawn at its true width at every distance. It may only go out by pixel width: whole where it is 0.6 of a pixel
  // wide, nothing at 0.4 (uPix: one pixel's angle, one number for the whole frame)
  vA = smoothstep(0.4, 0.6, 2.0*r*ms/max(dist*uPix, 1e-7));
  float sq = 1.0+0.25*sin(t*9.0-uTime*3.2);
  vec3 p = c + vec3(position.x*r*sq, 0.0, position.z*r/sq);
  vec4 wp = modelMatrix*vec4(p,1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix)*vec3(position.x,0.15,position.z));
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const THREAD_FS = FOG_PF + /* glsl */`
uniform float uTime, uFlameI, uK;
uniform vec3 uFlamePos, uFlameCol, uAmb, uWineDeep, uWineBody, uWineEdge;
varying vec3 vW; varying vec3 vN; varying float vT; varying float vA;
` + GLSL_COMMON + /* glsl */`
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition-vW+vec3(0.0,1e-5,0.0));
  vec3 Lv = uFlamePos-vW; float d2 = dot(Lv,Lv); vec3 L = Lv*inversesqrt(max(d2,1e-4));
  float att = uFlameI*breath(uFlamePos,uTime)/(1.0+d2*uK);
  vec3 lightC = uFlameCol*att;
  float edge = 1.0-abs(dot(N,V)); edge *= edge;
  float back = max(dot(-V,L),0.0); back *= back;
  vec2 nh = N.xz/max(length(N.xz),1e-4); vec3 H = normalize(L+V+vec3(0.0,1e-5,0.0)); vec2 hh = H.xz/max(length(H.xz),1e-4);
  float sl = pow(max(dot(nh,hh),0.0),14.0);
  float run = 0.7+0.5*sin(vT*30.0-uTime*8.0);
  vec3 col = uWineDeep*(uAmb*2.0+lightC*0.6) + uWineBody*lightC*(0.55+0.9*back);
  col += uWineEdge*(edge*(uAmb*0.6+lightC*(0.7+2.2*back)) + lightC*0.25);
  col += uFlameCol*att*sl*run*3.4;                                       // it catches the candle beyond it
  gl_FragColor = vec4(col, clamp(vA, 0.0, 1.0));
  #include <fog_fragment>
}`;
// one thin thread of smoke standing over one of the stands' flames
const SMOKE_VS = FOG_PV + /* glsl */`
uniform float uTime; uniform vec3 uBase;
varying vec2 vUv;
void main(){
  float y = uv.y; vUv = uv;
  vec3 c = uBase + vec3(0.0, y*1.9, 0.0);
  c.x += (sin(y*3.1-uTime*0.7)*0.07 + sin(y*7.3-uTime*1.3)*0.03*y)*y;
  c.z += (cos(y*2.6-uTime*0.6)*0.06 + sin(y*6.1-uTime*1.1)*0.03*y)*y;
  vec4 wc = modelMatrix*vec4(c,1.0);
  vec3 toC = cameraPosition-wc.xyz; vec2 f = toC.xz/max(length(toC.xz),1e-3);
  float ms = length(modelMatrix[1].xyz);
  wc.xyz += vec3(f.y,0.0,-f.x)*(uv.x-0.5)*(0.035+0.16*y)*ms;
  vec4 mvPosition = viewMatrix*wc; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SMOKE_FS = FOG_PF + /* glsl */`
uniform float uTime; uniform vec3 uFlameCol;
varying vec2 vUv;
void main(){
  float x = abs(vUv.x-0.5)*2.0, y = vUv.y;
  float a = (1.0-x)*(1.0-x)*smoothstep(0.0,0.08,y)*(1.0-y)*(1.0-y);
  a *= 0.75+0.25*sin(y*21.0-uTime*2.3);
  vec3 col = (vec3(0.30,0.27,0.25)+uFlameCol*0.25*(1.0-y))*a*0.16;
  ` + FOG_ADD + /* glsl */`
  gl_FragColor = vec4(col,1.0);
}`;

// THE FILL: a pure law of the metres flown.
export function fillLaw(m) {
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lin01 = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));
  // the rings the falling wine sends out: they begin where the thread's head lands (300 m, whole by 302 m), ease to 0.7 as
  // it breaks into drops (400 to 403 m), swell to 1.3 as the last drop lands (404.5 to 407 m) and die away after it:
  // no step anywhere
  const ringsPour = lin01(300, 302, m) * (1 - 0.3 * ss(400, 403, m)), ringsLast = 1.3 * Math.exp(-Math.max(m - 407, 0) / 3.5);
  const h = lin01(291, 300, m);
  return {
    level: HALF + (1 - HALF) * lin01(300, 396, m),          // fraction of the bowl's height
    dome: 0.25 * ss(396, 406, m),                          // metres above the rim at the middle
    head: h * h,                                           // the first wine leaves the lip at 291 m and falls, gathering speed, to the surface: it lands at 300 m
    on: m < 406.5 ? 1 : 0,                                // (the last drop's middle meets the wine at 406 m and all of it is under by 406.2 m: from then the thread draws nothing)
    breakup: ss(400, 401.5, m),
    drop: (m - 400) / 1.5,                                 // three drops leave the lip at 400, 401.5 and 403 m, each 3 m of flight in the air; the last lands at 406
    pour: ringsPour + (ringsLast - ringsPour) * ss(404.5, 407, m),
    decanter: P_LIP[1] + 0.75 - 0.55 * lin01(300, 406, m), // level of the wine left in the decanter's belly (hero-local y)
  };
}

// ---------- the hero ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('to-the-brim-hero') : ctx.rng, pal = opts.palette || PALETTE;
  const look = opts.look || 'midnight';
  const dealt = rng.pick(['ruby', 'ruby', 'gold', 'rose']);
  const kit = opts.kit || makeGlassKit(ctx, { palette: pal, wine: opts.wine || dealt });
  const U = kit.uniforms;
  const object = new THREE.Group(); object.name = 'to-the-brim-hero';
  await ctx.yield();

  // solids: the plinth, the six candle stands, the still life, the crane and the yoke
  const list = [];
  const st = await buildPlinth(list, rng, pal, look, ctx.yield);
  await ctx.yield();
  const crane = await buildCrane(list, pal, ctx.yield);
  await ctx.yield();
  const wicks = STAND_A.map((a, i) => { const [x, z] = standAt(i); return [x + 0.01, st.top + 0.05, z + 0.004]; });
  for (const w of wicks) paint(list, tube([[w[0] - 0.01, st.top - 0.03, w[2] - 0.004], [w[0] - 0.006, st.top + 0.02, w[2] - 0.004], w], 0.011, 2, 3), '#1a120c', 0, 0.2);
  const flamesLocal = wicks.map((w) => new THREE.Vector3(w[0], w[1] + 0.16, w[2]));
  const flameLocal = flamesLocal.reduce((a, f) => a.addScaledVector(f, 1 / 6), new THREE.Vector3());      // the six flames' middle: what the solids, the thread and the caustic are lit from
  const HU = { uFlamePos: { value: flameLocal.clone() }, uFlameI: { value: 3.2 } };
  await ctx.yield();
  const solidGeo = mergeGeometries(list); for (const g of list) g.dispose();
  const solids = new THREE.Mesh(solidGeo, shaderMat({ ...U, ...HU }, SOLID_VS, SOLID_FS, { side: THREE.DoubleSide }));
  object.add(solids);
  await ctx.yield();

  // THE GREAT GLASS: the same glass, the same laws, GREAT times the size by its instance's matrix; its wine is shaped by THE FILL
  const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
  const RU = { uRing: { value: flamesLocal.map((f) => f.clone()) }, uCool: { value: new THREE.Color(0, 0, 0) } };      // (uRing: the six flames, world: set in update; uCool: the choir's cold light, the world's to set)
  const FU = { uLevel: { value: HALF }, uDome: { value: 0 }, uPour: { value: 0 }, uPourAt: { value: new THREE.Vector2((P_LIP[0] - P_GLASS[0]) / GREAT, (P_LIP[2] - P_GLASS[2]) / GREAT) } };
  const shellOneMat = shaderMat({ ...U, ...RU }, SHELL_VS, SHELL_FS, { ...add, side: THREE.DoubleSide, defines: { BIG: 1, MEANS: 1 } });
  const wineOneMat = shaderMat({ ...U, ...FU, ...RU }, WINE_VS, WINE_FS, { defines: { ONE: 1, BIG: 1 } });
  const causticOneMat = shaderMat({ ...U, uClipR: { value: PLINTH_R[2] - 0.06 } }, CAUSTIC_VS, CAUSTIC_FS, { transparent: true, depthWrite: false, blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, defines: { BIG: 1 } });
  const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), key = flamesLocal[1];                     // (key: the south-west flame, the one every law names as the glass's nearest)
  const single = (geo, mat, order, at, sc = 1, fl = key, strength = 3.0) => {
    const m = kit.instanced(geo, mat, 1, order);
    m.setMatrixAt(0, at ? m4.compose(new THREE.Vector3(at[0], at[1], at[2]), q0, new THREE.Vector3(sc, sc, sc)) : m4.identity());
    m.geometry.attributes.aFlame.setXYZW(0, fl.x, fl.y, fl.z, strength);
    m.frustumCulled = false; object.add(m); return m;
  };
  const oneWine = single(kit.geometry.one.wine, wineOneMat, 0, P_GLASS, GREAT);
  const oneShell = single(kit.geometry.one.shell, shellOneMat, 3, P_GLASS, GREAT);
  const oneCaustic = single(kit.geometry.caustic, causticOneMat, 1, P_GLASS, 1, flameLocal, 3.0);
  await ctx.yield();

  // the decanter in its yoke
  const nCut = rng.pick([26, 32, 38]);
  const DU = { uLevel: { value: P_LIP[1] + 0.75 }, uDome: { value: 0 }, uPour: { value: 0 }, uPourAt: { value: new THREE.Vector2() } };
  const decShellMat = shaderMat({ ...U, ...RU, uCut: { value: new THREE.Vector2(nCut, nCut / 2.2) } }, SHELL_VS, SHELL_FS, { ...add, side: THREE.DoubleSide, defines: { DEC: 1, BIG: 1 } });
  const decWineMat = shaderMat({ ...U, ...DU }, WINE_VS, WINE_FS, { side: THREE.DoubleSide, defines: { DEC: 1 } });
  const decShellGeo = decanterShellGeometry(), decWineGeo = decanterWineGeometry();
  await ctx.yield();
  const decWine = single(decWineGeo, decWineMat, 0, null, 1, flamesLocal[2], 6.0), decShell = single(decShellGeo, decShellMat, 3, null, 1, flamesLocal[2], 6.0);
  decShellGeo.dispose(); decWineGeo.dispose();          // single() works on clones
  await ctx.yield();

  // the thread
  const TU = { uSurfY: { value: P_GLASS[1] + GREAT * HALF_Y }, uHead: { value: 0 }, uBreak: { value: 0 }, uDrop: { value: 0 }, uOn: { value: 0 }, uLip: { value: new THREE.Vector3(P_LIP[0], P_LIP[1], P_LIP[2]) } };
  const thread = new THREE.Mesh(threadGeometry(), shaderMat({ ...U, ...HU, ...TU }, THREAD_VS, THREAD_FS, { transparent: true, depthWrite: false }));
  thread.frustumCulled = false; thread.renderOrder = 2; object.add(thread);

  // the six flames, a thread of smoke over one of them, and (if asked) one warm light at their middle
  const flames = kit.makeFlames(6);
  wicks.forEach((w, i) => flames.set(i, w[0], w[1], w[2], look === 'blue' ? 0.42 : 0.5, 0.17)); flames.commit();
  object.add(flames.mesh);
  const smoke = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 2, 28), shaderMat({ ...U, uBase: { value: new THREE.Vector3(wicks[4][0], wicks[4][1] + 0.5, wicks[4][2]) } }, SMOKE_VS, SMOKE_FS, add));
  smoke.frustumCulled = false; smoke.renderOrder = 6; object.add(smoke);
  let light = null;
  if (opts.light !== false) { light = new THREE.PointLight(kit.flameColor, 14, 24, 2); light.position.copy(flameLocal); object.add(light); }
  if (!opts.kit && look === 'blue') kit.setLight(1, '#3f6fd0', new THREE.Vector3(1, 0.35, 0), 0.7);
  else if (!opts.kit && look === 'moon') kit.setLight(1, '#aebfe0', new THREE.Vector3(-1, 0.5, 0), 0.7);
  await ctx.yield();

  const showcase = opts.showcase ? buildShowcase(ctx, kit, pal, object) : null;
  await ctx.yield();

  // THE FILL
  const routeLength = opts.routeLength || 479.6;
  function applyFill(m) {
    const f = fillLaw(m);
    FU.uLevel.value = f.level; FU.uDome.value = f.dome / GREAT; FU.uPour.value = f.pour;          // (the dome in the glass's own measure)
    TU.uSurfY.value = P_GLASS[1] + GREAT * (GLASS.bowlY + GLASS.bowlH * f.level) + f.dome * 0.9;
    TU.uHead.value = f.head; TU.uBreak.value = f.breakup; TU.uDrop.value = f.drop; TU.uOn.value = (f.on && f.head > 0) ? 1 : 0;
    DU.uLevel.value = f.decanter;
  }
  const setMetres = (m) => { applyFill(m); };
  applyFill(0);                                              // until setMetres is called the glass stands at half

  const tris = (m) => (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3;
  const info = { triangles: Math.round(tris(solids) + tris(oneWine) + tris(oneShell) + 2 + tris(decWine) + tris(decShell) + tris(thread) + 12 + tris(smoke)), drawCalls: 9 };
  const wp = new THREE.Vector3();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  // CLEAR AIR: what the world counts against the flown line, class by class: [x, y, z, radius], hero-local
  const ringOf = (r, y, n = 24, pad = 0) => { const o = []; for (let i = 0; i < n; i++) o.push([r * Math.cos(i * 2 * PI / n), y, r * Math.sin(i * 2 * PI / n), pad]); return o; };
  const glassPts = []; for (let i = 0; i <= 12; i++) glassPts.push(...ringOf(GREAT * bowlR(i / 12), P_GLASS[1] + GREAT * (GLASS.bowlY + GLASS.bowlH * i / 12)));
  glassPts.push(...ringOf(GREAT * GLASS.footR, P_GLASS[1]), [0, P_GLASS[1] + 1.5, 0, 0.15], [0, RIM_Y + 0.3, 0, 0.6], [P_LIP[0], RIM_Y + 1.3, 0, 0.1]);   // (the dome, the thread)
  const decPts = []; for (let i = 0; i <= 16; i++) { const yl = DEC_LEN * i / 16, c = decPoint(yl), R = decR(yl); for (let k = 0; k < 8; k++) { const a = k * PI / 4; decPts.push([c[0] + Math.sin(TILT) * R * Math.cos(a), c[1] + Math.cos(TILT) * R * Math.cos(a), R * Math.sin(a), 0.03]); } }
  const cranePts = []; for (let y = 0; y <= 13.5; y += 0.75) cranePts.push([CRANE_X, y, 0, 0.58]);
  for (let i = 0; i <= 10; i++) cranePts.push([CRANE_X + (crane.end[0] - CRANE_X) * i / 10, crane.armTop, 0, 0.2], [CRANE_X + (crane.end[0] - CRANE_X) * i / 10, crane.end[1] - 1.7, 0, 0.3]);
  const standPts = []; for (let i = 0; i < 6; i++) { const [x, z] = standAt(i); for (let y = 0.3; y <= FLAME_Y + 0.6; y += 0.6) standPts.push([x, y, z, 0.38]); standPts.push([x, FLAME_Y + 0.75, z, 0.1]); }
  const plinthPts = [...ringOf(PLINTH_R[0] + 0.06, 0.3, 36), ...ringOf(PLINTH_R[1] + 0.06, 0.6, 36), ...ringOf(PLINTH_R[2] + 0.06, 0.9, 36)];
  return {
    object, kit, light, info, uniforms: U, look, wine: kit.wine, great: RU,
    radius: 8.4, height: 16.7, center: V(-1.6, 7.6, 0),
    ground: true, groundY: 0,
    anchors: {
      glass: V(P_GLASS[0], P_GLASS[1], P_GLASS[2]), rim: V(0, RIM_Y, 0), half: V(0, P_GLASS[1] + GREAT * HALF_Y, 0), bowl: V(0, P_GLASS[1] + GREAT * (GLASS.bowlY + 0.5 * GLASS.bowlH), 0),
      lip: V(P_LIP[0], P_LIP[1], P_LIP[2]), flame: flameLocal.clone(), flames: flamesLocal.map((f) => f.clone()), poi: V(0, RIM_Y, 0),
      flyThrough: [V(0, 4.4, 49), V(0, 5.6, 25), V(4.6, 8.8, 0), V(0.6, 5.2, -27), V(0, 4.2, -65)],
      portalSeat: { position: V(0, 4.2, -65), normal: V(0, 0, 1), radius: 5.5 },
      viewpoints: { closest: { position: V(4.6, 8.8, 0), lookAt: V(0, RIM_Y, 0) }, approach: { position: V(0, 5.4, 28), lookAt: V(0, P_GLASS[1] + GREAT * HALF_Y, 0) } },
    },
    bodies: [['the great glass (bowl, rim, foot, stem, dome, thread)', 2.6, glassPts], ['the great decanter', 3.0, decPts], ['the crane and the yoke', 3.0, cranePts],
      ['a candle stand of the great glass (to its flame\'s tip)', 2.0, standPts], ['the great glass\'s plinth', 2.0, plinthPts]],
    setMetres, setProgress: (u) => setMetres(u * routeLength), fillLaw,
    setLight: (flameStrength, fillHex, fillDir, fillAmt) => { kit.setLight(flameStrength, fillHex, fillDir, fillAmt); HU.uFlameI.value = 3.2 * flameStrength; if (light) light.intensity = 14 * flameStrength; },
    update(dt, time, camera) {
      kit.update(time);
      object.updateWorldMatrix(true, false);
      wp.set(flameLocal.x + 0.035 * Math.sin(time * 1.7), flameLocal.y + 0.02 * Math.sin(time * 2.3), flameLocal.z + 0.035 * Math.cos(time * 1.3));
      HU.uFlamePos.value.copy(wp.applyMatrix4(object.matrixWorld));
      for (let i = 0; i < 6; i++) RU.uRing.value[i].copy(flamesLocal[i]).applyMatrix4(object.matrixWorld);
      if (showcase) showcase.update(time);
    },
    dispose() { for (const w of ['near', 'mid', 'far', 'speck', 'one']) { kit.geometry[w].shell.dispose(); kit.geometry[w].wine.dispose(); } kit.geometry.caustic.dispose(); },
  };
}

// ---------- the showcase (opts.showcase): a short linen table of ordinary glasses, to judge the kit by ----------
function buildShowcase(ctx, kit, pal, object) {
  const list = [], X = -2.2, Z0 = 4.3, Z1 = 12.7, silver = '#cfcac0';
  const box = new THREE.BoxGeometry(3.0, 2.4, Z1 - Z0, 10, 6, 28); box.translate(X, 1.8, (Z0 + Z1) / 2);
  { const P = box.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); if (y > 2.99) continue;
      const d = (3.0 - y) / 2.4, s = (x - X) * 2.1 + z * 3.3, f = 0.05 + 0.10 * d;
      P.setXYZ(i, x + Math.sign(x - X) * (Math.abs(x - X) > 1.49 ? f * (1 + 0.6 * Math.sin(z * 4.1)) : 0), y, z + (z < Z0 + 0.01 ? -1 : z > Z1 - 0.01 ? 1 : 0) * f * (1 + 0.6 * Math.sin(s))); }
    box.computeVertexNormals(); }
  paint(list, box, pal[0], 0, 0.1, 3, { shade: (x, y) => 0.72 * (0.45 + 0.55 * Math.min(1, (y - 0.6) / 2.0)) });
  const runner = new THREE.PlaneGeometry(0.5, Z1 - Z0 - 0.3, 1, 1); runner.rotateX(-PI / 2); runner.translate(X, 3.004, (Z0 + Z1) / 2);
  paint(list, runner, pal[5], 0, 0.3, 3, { shade: () => 0.8 });
  const cz = [5.3, 8.5, 11.7], fy = 3.0 + 1.0;
  for (const z of cz) {
    paint(list, lathe([[0.17, 0], [0.18, 0.02], [0.16, 0.05], [0.07, 0.09], [0.04, 0.2], [0.06, 0.26], [0.04, 0.32], [0.05, 0.4], [0.12, 0.44], [0.13, 0.47], [0.075, 0.48], [0.07, 0.52]], 16), silver, 1, 0.85, 0, { matrix: T(X, 3.0, z) });
    paint(list, lathe([[0.062, 0.47], [0.064, 0.8], [0.062, 0.93], [0.064, 0.955], [0.04, 0.945]], 12, { top: [0.94, 0, 0] }), pal[0], 0, 0.5, 0, { matrix: T(X, 3.0, z), shade: () => 0.8, glow: (x, y) => 0.5 * Math.exp(-Math.max(3.95 - y, 0) / 0.15) });
  }
  const HU = { uFlamePos: { value: new THREE.Vector3() }, uFlameI: { value: 1.6 } };
  const geo = mergeGeometries(list); for (const g of list) g.dispose();
  const mesh = new THREE.Mesh(geo, shaderMat({ ...kit.uniforms, ...HU }, SOLID_VS, SOLID_FS, { side: THREE.DoubleSide }));
  object.add(mesh);
  const flames = kit.makeFlames(cz.length); cz.forEach((z, i) => flames.set(i, X, fy, z, 0.32, 0.12)); flames.commit(); object.add(flames.mesh);
  const near = kit.makeGlasses('near', 5), mid = kit.makeGlasses('mid', 3), far = kit.makeGlasses('far', 2);
  const nearest = (z) => cz.reduce((a, c) => (Math.abs(c - z) < Math.abs(a - z) ? c : a), cz[0]);
  for (let i = 0; i < 5; i++) {
    const z = 4.9 + 1.6 * i, f = nearest(z);
    near.set(i, X + 0.9, 3.0, z, X, fy + 0.15, f, 1);
    if (i < 3) mid.set(i, X - 0.9, 3.0, z, X, fy + 0.15, f, 1); else far.set(i - 3, X - 0.9, 3.0, z, X, fy + 0.15, f, 1);
  }
  for (const g of [near, mid, far]) { g.commit(); object.add(g.group); }
  const fl = new THREE.Vector3(X, fy + 0.15, cz[1]), wp = new THREE.Vector3();
  return { update() { HU.uFlamePos.value.copy(wp.copy(fl).applyMatrix4(object.matrixWorld)); } };
}
