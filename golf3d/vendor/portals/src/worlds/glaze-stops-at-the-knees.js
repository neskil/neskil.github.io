// The Glaze Stops at the Knees. After Tang three-colour tomb figures, China, about 680 to 760.
// A floor of bare fired clay; a tomb horse 190 m tall, a loaded bellowing camel and twelve ponies stand on their slabs,
// their amber, green and straw lead glaze still running down toward a ragged line at the knees that it never crosses.
// Everything is shaded with the hero's style routines (src/parts/glaze-stops-at-the-knees.js): glass above the line,
// dead-matt clay below, rose sheared shadows, paling into straw dust. No lights, no textures, no fog, no full-screen pass.
// The floor carries only figures on slabs: beside the brief's horse, camel and pony pairs the rest of the retinue stands in ranks
// (files of ponies and horses down the avenue, ranks by the way in, ranks of great horses far out in the dust), fallen glass
// round every slab, and every figure's long rose shadow. No vessels, no kiln stacks.
// The camel's vent is lit from inside: its light warms belly, legs, slab and the floor before it (style.uVent), and a veil of lit
// straw dust stands behind the camel from the avenue, so its head is thrown back on a straw sky. Glass on the floor flashes under the sun.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import {
  buildHero, makeGlazeStyle, GLAZE_GLSL, GLAZE_PALETTE, loftPart, loftDisplace, bakeFlow, partGeometry,
  glazeFigureMaterial, glazeShadowMaterial, traceDown, runsGeometry, glazeRunMaterial, beadsMesh, slabGeometry, buildHorseParts,
} from '../parts/glaze-stops-at-the-knees.js';
import { markLegs, markAttr } from '../parts/glaze-stops-at-the-knees.js';   // the knife's arrises and the line's tongues on a figure's legs

const DX = 0.4983, DZ = 0.867;                       // d: the horse's long axis (rump end), world
const AV0 = [-115, 380];                             // the avenue starts here (beside the horse's hanging head) and runs along a = (-DZ, 0, DX)
const A = (s, y = 0, side = 0) => [AV0[0] - DZ * s + DX * side, y, AV0[1] + DX * s + DZ * side];
const HORSE_O = [41, 0, 471], HORSE_ROT = Math.atan2(-DX, -DZ);   // head toward us (-d), chest at (0, 400)
// the camel stands across the avenue's end, broadside: the whole avenue sees it in profile, sunlit flank toward us, two humps and
// the load apart, head thrown back on the sky, and the avenue's line runs straight in under the middle of its belly, where the
// vent is: its pared rim faces down the avenue (camel-local +X is the avenue's own direction, so we come in from its -X side)
const CAMEL_S = 965, CAMEL_PHI = Math.PI / 2, CAMEL_F = [DZ * Math.cos(CAMEL_PHI) - DX * Math.sin(CAMEL_PHI), -DX * Math.cos(CAMEL_PHI) - DZ * Math.sin(CAMEL_PHI)];
const CAMEL_ROT = Math.atan2(CAMEL_F[0], CAMEL_F[1]);
const CAMEL_AT = (x, y, z) => { const c = A(CAMEL_S); return [c[0] + CAMEL_F[1] * x + CAMEL_F[0] * z, y, c[2] - CAMEL_F[0] * x + CAMEL_F[1] * z]; };   // camel-local -> world
const gauss = (x, w) => Math.exp(-(x * x) / (w * w));
const capR = (s, a, b) => { const x = Math.min(s / a, (1 - s) / b); return x >= 1 ? 1 : Math.sqrt(Math.max(0, 1 - (1 - x) * (1 - x))); };
const bez = (a, b, c, d, t) => { const u = 1 - t; return [0, 1, 2].map((k) => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k]); };
const angd = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

// ---- the sky: no blue. Slip round the sun, straw to 30 degrees, pale clay pink at the zenith, a dust line at the horizon ----
const SKY_VERT = /* glsl */`varying vec3 vD;
void main(){ vD = position; vec4 p = projectionMatrix*viewMatrix*vec4(position + cameraPosition, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const SKY_FRAG = /* glsl */`varying vec3 vD; uniform float uSunSize, uSunVis;
${GLAZE_GLSL}
void main(){
  // a STILL sky in the kiln's own lights, with a light in it: white slip in a wide soft glow round a soft sun disc, straw
  // cream to 30 degrees, a definite clay rose at the zenith and on the side away from the sun; a bright dust line where
  // floor and sky meet, straw under the sun and rosier opposite. No streaks, no clouds: the only weather is the dust below.
  vec3 d = normalize(vD + vec3(0., 1e-5, 0.)); gzVd = d;
  float el = asin(clamp(d.y, -1., 1.));
  vec2 sx = normalize(uSun.xz + vec2(1e-5, 0.)); float l = length(d.xz);
  float s = l > 1e-4 ? .5 + .5*dot(d.xz/l, sx) : .5;
  float away = 1. - smoothstep(.3, .9, s);
  float a = mix(smoothstep(.16, .95, el), smoothstep(.04, .7, el), away);   // away from the sun the rose comes down almost to the dust line
  vec3 col = mix(mix(uStraw, mix(uHazeRose, uStraw, .35), away), uSkyZen, clamp(a, 0., 1.));
  float sd = acos(clamp(dot(d, normalize(uSun)), -1., 1.));
  col = mix(col, uStraw, uSunVis*.75*exp(-sd*sd/(.62*.62)));
  col = mix(col, uSlip, uSunVis*(.7*exp(-sd*sd/(.3*.3)) + .3*exp(-sd*sd/(.13*.13))));
  float yc = max(cameraPosition.y, 0.);
  float f = 1. - exp(-(.012*exp(-yc/40.) + .022)/max(d.y, .012));
  col = mix(col, gzHaze(d), clamp(f, 0., 1.));
  if (d.y < 0.) col = gzHaze(d);
  float disc = uSunVis*(1. - smoothstep(uSunSize*.7, uSunSize*1.3, sd)), halo = uSunVis*exp(-sd*sd/(.1*.1));
  gl_FragColor = vec4(gzToScene(col) + uSunCol*(disc*2.4 + halo*.45), 1.);
}`;

// ---- the floor: one plane of bare fired clay. Speckle, wipe marks, spur scars, drifting dust; never glossy ----
const FLOOR_VERT = /* glsl */`varying vec3 vP;
void main(){ vec4 w = modelMatrix*vec4(position, 1.); vP = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const FLOOR_FRAG = /* glsl */`varying vec3 vP; uniform float uTime, uFloorLit; uniform vec3 uFloorTint;
${GLAZE_GLSL}
float gzCrk(vec2 p, float sc){
  vec2 cg = p/sc + .35*vec2(gzN2(p/(sc*2.2)), gzN2(p/(sc*2.2) + 5.)); vec2 ci = floor(cg), cf = fract(cg); float f1 = 9., f2 = 9.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j));
    vec2 o2 = vec2(gzH2(ci + g + 1.7), gzH2(ci + g + 17.3)); float dd = length(g + o2 - cf);
    if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) { f2 = dd; } }
  return (f2 - f1)*sc*.5;
}
void main(){
  vec2 p = vP.xz; gzVd = vP - cameraPosition; float dist = length(gzVd);
  float fw = fwidth(p.x) + fwidth(p.y);
  float mott = gzN2(p/61.)*.6 + gzN2(p/17. + 9.)*.4;
  // wipe marks: long shallow strokes of the board the slab of the world was beaten on
  vec2 q = vec2(dot(p, vec2(.94, .34)), dot(p, vec2(-.34, .94)));
  float wipe = gzN2(vec2(q.x/38., q.y/1.6)); wipe = mix(wipe, .5, smoothstep(.5, 2.2, fw));
  float wipe2 = gzN2(vec2(q.x/90. + 3., q.y/7.)); wipe2 = mix(wipe2, .5, smoothstep(2., 9., fw));
  // speckle: iron specks and pale grog
  float s1 = gzH2(floor(p*2.2)), s2 = gzN2(p*.9 + 31.);
  float speck = step(.965, s1)*(1. - smoothstep(.12, .4, fw)), grog = smoothstep(.74, .8, s2)*(1. - smoothstep(.4, 1.3, fw));
  // spur scars: three small pale rings where a kiln prop stood, one in a few cells
  vec2 c = floor(p/23.), f = fract(p/23.)*23.; float has = step(.72, gzH2(c + 5.));
  vec2 o = vec2(6. + 11.*gzH2(c), 6. + 11.*gzH2(c + 3.3)); float ring = 0.;
  { vec2 r0 = f - o; float a0 = gzH2(c + 8.)*6.283;
    vec2 e1 = vec2(cos(a0), sin(a0))*1.5, e2 = vec2(cos(a0 + 2.094), sin(a0 + 2.094))*1.5, e3 = vec2(cos(a0 + 4.189), sin(a0 + 4.189))*1.5;
    float w = max(fw*1.2, .09);
    ring = max(max(1. - smoothstep(0., w, abs(length(r0 - e1) - .42)), 1. - smoothstep(0., w, abs(length(r0 - e2) - .42))), 1. - smoothstep(0., w, abs(length(r0 - e3) - .42)));
    ring *= has*(1. - smoothstep(.6, 2.5, fw)); }
  // the floor is laid of base plates, kiln shelves the size of fields: a pared joint between them, each fired a little differently
  vec2 pg = vec2(q.x/168., q.y/104.); pg.x += .5*mod(floor(pg.y), 2.); vec2 pc = floor(pg), pf = fract(pg);
  float pe = min(min(pf.x, 1. - pf.x)*168., min(pf.y, 1. - pf.y)*104.) + 1.6*(gzN2(p/9.) - .5);
  float jw = max(.7, fw*1.3), joint = (1. - smoothstep(jw*.5, jw, pe))*min(1., 1.6/jw);
  float lipE = (1. - smoothstep(0., 9., pe))*(1. - smoothstep(3., 26., fw));
  // each plate's pared edge stands a hand proud: lit on the side toward the sun, a rose line on the other
  vec2 qs = q + normalize(vec2(dot(uSun.xz, vec2(.94, .34)), dot(uSun.xz, vec2(-.34, .94))) + 1e-5)*max(1.1, fw*1.6);
  vec2 pg2 = vec2(qs.x/168., qs.y/104.); pg2.x += .5*mod(floor(pg2.y), 2.); vec2 pf2 = fract(pg2);
  float pe2 = min(min(pf2.x, 1. - pf2.x)*168., min(pf2.y, 1. - pf2.y)*104.) + 1.6*(gzN2(p/9.) - .5);
  float joint2 = (1. - smoothstep(jw*.5, jw, pe2))*min(1., 1.6/jw)*(1. - joint);
  float ph = gzH2(pc + 2.7), ph2 = gzH2(pc + 11.3);
  vec3 alb = uClay*(.97 + .09*(mott - .5) + .02*(wipe - .5) + .025*(wipe2 - .5) + .3*(ph - .5) + .03*lipE);
  alb = mix(alb, alb*vec3(.975, .9, .87), ph2*.9);
  float cloud = gzN2(p/420. + 3.3)*.6 + gzN2(p/150. + 17.)*.4;                        // firing clouds: toasted where the flame licked
  alb *= mix(vec3(.84, .74, .72), vec3(1.06, 1.04, 1.), smoothstep(.25, .75, cloud));
  alb = mix(alb, uClay*vec3(.5, .36, .36), joint*.9);
  alb = mix(alb, mix(uClay, uSlip, .7), joint2*.55);
  alb += vec3(.03, .0, -.012)*(mott - .5);
  alb = mix(alb, uClay*vec3(.72, .6, .56), speck*.8);
  alb = mix(alb, uSlip, grog*.13 + ring*.5);
  // firing cracks: where the great floor shrank in the kiln. A fine net some 20 m across near the eye, a wide one 70 m across that
  // still reads from the air; each never thinner than a pixel and a half, fading to the flat tint beyond (no derivatives in the loop)
  { float ce = gzCrk(p, 21.), cw = max(.3, fw*1.3);
    float crack = (1. - smoothstep(cw*.5, cw, ce))*min(1., .45/cw)*(1. - smoothstep(1.2, 4.5, fw));
    float lip = (1. - smoothstep(0., 2.6, ce))*(1. - smoothstep(.8, 4., fw));
    float ce2 = gzCrk(p + 37., 72.), cw2 = max(.8, fw*1.25);
    float crack2 = (1. - smoothstep(cw2*.5, cw2, ce2))*min(1., 1.5/cw2)*(1. - smoothstep(7., 22., fw));
    float lip2 = (1. - smoothstep(0., 7., ce2))*(1. - smoothstep(4., 20., fw));
    alb *= 1. + .05*lip + .045*lip2; alb = mix(alb, uClay*vec3(.5, .34, .34), max(crack*.88, crack2*.78)); }
  // dust drifting low over the floor: broad soft veils, never streaks
  float d1 = gzN2(p/74. + vec2(-uTime*.2, uTime*.07)), d2 = gzN2(p/31. + vec2(-uTime*.36, 3. + uTime*.05));
  float dr = smoothstep(.43, .58, d1*.62 + d2*.38)*(1. - smoothstep(8., 46., fw));
  alb = mix(alb, uClay*1.38, dr*.42);
  // a level floor takes the low sun at a graze: a mid-tone, far below the sunlit legs that stand on it
  vec3 col = alb*gzLight(vec3(0., 1., 0.), 1.)*uFloorLit*uFloorTint;
  gl_FragColor = vec4(gzOut(col, dist, 0.), 1.);
}`;

// ---- spatter: fallen drops of glass on the floor (instanced discs, domed in the shader) ----
const SPAT_VERT = /* glsl */`attribute vec4 iPos; attribute float iCol; varying vec3 vP, vL; varying float vCol;
float h1(float n){ return fract(sin(n*127.1 + 3.7)*43758.5453); }
void main(){ float a = atan(position.z, position.x + 1e-6), r = length(position.xz);
  float k = floor(a*.796 + .5); float wob = .72 + .5*h1(k + iPos.w*91.) ;
  vec2 st = vec2(1. + .9*h1(iPos.w*7.), 1.); float ca = cos(iPos.w*40.), sa = sin(iPos.w*40.);
  vec2 l = position.xz*wob*st; l = vec2(ca*l.x - sa*l.y, sa*l.x + ca*l.y);
  vL = vec3(l.x, r, l.y); vCol = iCol;
  vec4 w = vec4(iPos.x + l.x*iPos.z, .05 + (1. - r)*iPos.z*.16, iPos.y + l.y*iPos.z, 1.);
  vP = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const SPAT_FRAG = /* glsl */`varying vec3 vP, vL; varying float vCol;
${GLAZE_GLSL}
void main(){ vec3 toCam = cameraPosition - vP; float dist = length(toCam); gzVd = -toCam; vec3 V = toCam/max(dist, 1e-3);
  vec3 N = normalize(vec3(vL.x*1.1, 1.05 - vL.y*.6, vL.z*1.1));
  vec3 col = vCol < .5 ? mix(uAmber, uPool, .25 + .5*(1. - vL.y)) : (vCol < 1.5 ? mix(uGreen, uGreen*.55, .6*(1. - vL.y)) : mix(uStraw, uAmber, .3));
  col = mix(col, uSlip, smoothstep(.8, 1., vL.y)*.35);
  vec3 g = gzGlass(col, N, V, 1.);
  float rf = max(dot(reflect(-V, vec3(0., 1., 0.)), uSun), 0.); float rf2 = rf*rf, rf8 = rf2*rf2*rf2*rf2;
  gzSpec += (rf8*rf8*rf8*rf8*rf8*1.05 + rf8*.14)*(1. - .8*smoothstep(.3, 1., vL.y));   // a level skin of glass: under the sun the whole drop flashes
  gl_FragColor = vec4(gzOut(g, dist, 0.), 1.); }`;

// ---- dust: pale motes hanging in the lowest 40 m, wrapped round the camera ----
const DUST_VERT = /* glsl */`attribute vec4 iSeed; uniform float uTime, uPx; uniform vec3 uCam, uSun; varying vec2 vUv; varying float vA, vK;
void main(){ vec3 box = vec3(260., 46., 260.);
  vec3 p = iSeed.xyz*box + vec3(uTime*(3. + 2.5*iSeed.w), sin(uTime*.21 + iSeed.w*40.)*1.5, uTime*1.2*(.5 + iSeed.w));
  p = mod(p - uCam + box*.5, box) - box*.5; vec3 w = uCam + p; w.y = mod(iSeed.y*46. + sin(uTime*.17 + iSeed.w*30.)*2., 46.) + .6;
  vec4 mv = viewMatrix*vec4(w, 1.); float d = max(-mv.z, .1);
  float sz = max(.2 + .36*iSeed.w, 2.*d*uPx);
  mv.xy += position.xy*sz; vUv = position.xy;
  float edge = 1. - smoothstep(95., 128., length(p.xz));
  vA = edge*smoothstep(8., 34., d)*sqrt(min(1., (.2 + .36*iSeed.w)/sz))*(.6 + .4*sin(uTime*.9 + iSeed.w*77.));
  vK = step(.5, fract(iSeed.w*7.31));
  float gl = max(dot((w - uCam)/max(length(w - uCam), .1), normalize(uSun)), 0.); gl *= gl; vA *= .6 + 3.2*gl*gl;   // motes light up toward the sun
  gl_Position = projectionMatrix*mv; }`;
const DUST_FRAG = /* glsl */`varying vec2 vUv; varying float vA, vK;
${GLAZE_GLSL}
void main(){ float r = dot(vUv, vUv); float a = (1. - smoothstep(.25, 1., r))*vA*.06;
  gl_FragColor = vec4(gzToScene(mix(uSlip, uClay*vec3(.9, .84, .84), vK)), a); }`;

// ---- the far ranks: the rest of the retinue, rank upon rank on their slabs, paling into the dust (one merged mesh) ----
const FAR_VERT = /* glsl */`attribute vec4 aLoc; varying vec3 vP, vN; varying vec4 vLoc;
void main(){ vLoc = aLoc; vN = normal; vec4 w = modelMatrix*vec4(position, 1.); vP = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const FAR_FRAG = /* glsl */`varying vec3 vP, vN; varying vec4 vLoc;
${GLAZE_GLSL}
void main(){ vec3 toCam = cameraPosition - vP; float dist = length(toCam); gzVd = -toCam; vec3 V = toCam/max(dist, 1e-3); vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  float sd = vLoc.w, h = vLoc.y, lane = vLoc.x*.9 + vLoc.z*.55;
  float line = 38. + 7.*(gzN1(lane*.22 + sd*9.) - .5);
  float gl = smoothstep(line - .8, line + .8, h);
  float st = gzN2(vec2(lane/3.6 + sd*17., h/52.));
  vec3 g = mix(uAmber, uPool, smoothstep(.5, .2, st)*.6);
  g = mix(g, uStraw, smoothstep(.66, .8, st)*.85);
  float drip = 104. - 56.*smoothstep(.42, .8, gzN1(vLoc.z*.31 + vLoc.x*.2 + sd*5.));
  float grn = smoothstep(-50., -42., vLoc.z)*(1. - smoothstep(20., 28., vLoc.z))*smoothstep(drip - 3., drip + 3., h)*(1. - smoothstep(150., 156., h));
  g = mix(g, uGreen, grn*.92);
  vec3 col = mix(gzMatt(uClay*.97, N, 1.), gzGlass(g, N, V, 1.), gl); gzSpec *= gl;
  gl_FragColor = vec4(gzOut(col, dist, vP.y), 1.); }`;

// ---- pass spatter: the counting and laying of drops under the route (see build), as functions of their own ----
const PASS_CELL = 40, passCell = (gx, gz) => (gx + 4096) * 8192 + gz + 4096;
function passPut(grid, x, z) { const k = passCell(Math.floor(x / PASS_CELL), Math.floor(z / PASS_CELL)); let c = grid.get(k); if (!c) grid.set(k, c = []); c.push(x, z); }
// the triangles of a figure's slab top (part 2, above 5 m), in the figure's own frame; the slab is the last piece merged into the mould
function slabTop(hg) {
  const P = hg.attributes.position.array, Sf = hg.attributes.aSurf.array, I = hg.index.array, top = [];
  for (let i = I.length - 3; i >= 0; i -= 3) { const a = I[i], b = I[i + 1], c = I[i + 2];
    if (Sf[a * 4 + 3] !== 2 || Sf[b * 4 + 3] !== 2 || Sf[c * 4 + 3] !== 2) break;
    if (P[a * 3 + 1] > 5 && P[b * 3 + 1] > 5 && P[c * 3 + 1] > 5) top.push(P[a * 3], P[a * 3 + 1], P[a * 3 + 2], P[b * 3], P[b * 3 + 1], P[b * 3 + 2], P[c * 3], P[c * 3 + 1], P[c * 3 + 2]); }
  const cells = new Map();   // the triangles under each 12 m square
  for (let i = 0; i < top.length; i += 9) for (let gx = Math.floor(Math.min(top[i], top[i + 3], top[i + 6]) / 12); gx <= Math.floor(Math.max(top[i], top[i + 3], top[i + 6]) / 12); gx++)
    for (let gz = Math.floor(Math.min(top[i + 2], top[i + 5], top[i + 8]) / 12); gz <= Math.floor(Math.max(top[i + 2], top[i + 5], top[i + 8]) / 12); gz++) { const k = passCell(gx, gz); let c = cells.get(k); if (!c) cells.set(k, c = []); c.push(i); }
  return { top, cells };
}
function slabTopY(T, x, z) {
  let y = -1; const top = T.top, list = T.cells.get(passCell(Math.floor(x / 12), Math.floor(z / 12))) || [];
  for (const i of list) { const ax = top[i], az = top[i + 2], bx = top[i + 3] - ax, bz = top[i + 5] - az, cx = top[i + 6] - ax, cz = top[i + 8] - az, den = bx * cz - bz * cx; if (Math.abs(den) < 1e-9) continue;
    const u = ((x - ax) * cz - (z - az) * cx) / den, w = (bx * (z - az) - bz * (x - ax)) / den; if (u >= 0 && w >= 0 && u + w <= 1) y = Math.max(y, top[i + 1] + u * (top[i + 4] - top[i + 1]) + w * (top[i + 7] - top[i + 1])); }
  return y;
}
// one stretch of the route: low = [metres along, x, z] of its places below 120 m, every 2.5 m. Counts the drops within 40 m of them and
// lays what is wanting, each at a place drawn along the stretch and up to 40 m to either side of the route's line on the floor
function passStretch(S, low) {
  const pr = S.pr, nL = low.length / 3, need = Math.round(S.want * Math.min(1, (nL - 1) * 2.5 / 50)), E = S.HI; let have = 0;
  const km = Math.floor(nL / 2) * 3; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, far = 0;
  for (let k = 0; k < low.length; k += 3) { x0 = Math.min(x0, low[k + 1]); x1 = Math.max(x1, low[k + 1]); z0 = Math.min(z0, low[k + 2]); z1 = Math.max(z1, low[k + 2]); far = Math.max(far, Math.hypot(low[k + 1] - low[km + 1], low[k + 2] - low[km + 2])); }
  far = (far + 40) * (far + 40);
  for (let gx = Math.floor((x0 - 40) / PASS_CELL); gx <= Math.floor((x1 + 40) / PASS_CELL); gx++) for (let gz = Math.floor((z0 - 40) / PASS_CELL); gz <= Math.floor((z1 + 40) / PASS_CELL); gz++) { const c = S.grid.get(passCell(gx, gz)); if (!c) continue;
    for (let i = 0; i < c.length; i += 2) { const mx = c[i] - low[km + 1], mz = c[i + 1] - low[km + 2], md = mx * mx + mz * mz; if (md <= 1600) { have++; continue; } if (md > far) continue;   // by the stretch's middle first: most drops are plainly in or plainly out
      for (let k = 0; k < low.length; k += 3) { const dx = c[i] - low[k + 1], dz = c[i + 1] - low[k + 2]; if (dx * dx + dz * dz <= 1600) { have++; break; } } } }
  for (let m = have, tries = 0; m < need && tries < 6 * need; tries++) {
    const k = pr.int(0, nL - 1) * 3, ka = Math.max(0, k - 3), kb = Math.min(low.length - 3, k + 3), tx = low[kb + 1] - low[ka + 1], tz = low[kb + 2] - low[ka + 2], tl = Math.hypot(tx, tz) || 1;   // the route's line on the floor here
    const al = pr.range(-1.25, 1.25), sd = pr.range(-40, 40), x = low[k + 1] + (tx * al - tz * sd) / tl, z = low[k + 2] + (tz * al + tx * sd) / tl, big = S.laid % 12 === 11;
    const r = big ? pr.range(2.6, 6.5) : 0.25 + 2.1 * Math.pow(pr(), 2), sdd = pr(), col = pr() < 0.6 ? 0 : (pr() < 0.75 ? 1 : 2);
    let hit = false; for (const b of S.small) if (Math.abs(b.c * (x - b.cx) - b.s * (z - b.cz)) < b.hw + r && Math.abs(b.s * (x - b.cx) + b.c * (z - b.cz)) < b.hd + r) { hit = true; break; }
    if (hit) continue;
    const hx = E[0] * x + E[8] * z + E[12], hz = E[2] * x + E[10] * z + E[14];   // in the great horse's own frame
    if (Math.abs(hx) < 42 + r + 2 && Math.abs(hz) < 115 + r + 2) {   // on the great slab: on its top, clear of its edge and of the hooves
      if (Math.abs(hx) > 36 - 0.5 * r || Math.abs(hz) > 108 - 0.5 * r || Math.hypot(Math.abs(hx) - 18.5, hz - 60) < 12 + r || Math.hypot(Math.abs(hx) - 18.5, hz + 68) < 12 + r) continue;
      const y = slabTopY(S.top, hx, hz); if (y < 0) continue; S.onSlab.push(x, z, r, sdd, col, y + 0.04);
    } else S.onFloor.push(x, z, r, sdd, col, 0);
    passPut(S.grid, x, z); m++; S.laid++;
  }
}

// ---- kiln furniture left on the floor: three-armed spurs of bare clay, and their rose shadows (one program, two meshes) ----
const SPUR_VERT = /* glsl */`attribute vec4 iPos; uniform float uSh; uniform vec3 uSun; varying vec3 vP, vN; varying float vH;
void main(){ float c = cos(iPos.w), s = sin(iPos.w); vec3 p = position*iPos.z; p.xz = vec2(c*p.x + s*p.z, -s*p.x + c*p.z);
  vec3 n = normal; n.xz = vec2(c*n.x + s*n.z, -s*n.x + c*n.z); vN = n; vH = position.y;
  vec3 w = vec3(iPos.x + p.x, p.y, iPos.y + p.z);
  if (uSh > .5) { w.xz -= uSun.xz/max(uSun.y, .05)*w.y; w.y = .06; }
  vP = w; gl_Position = projectionMatrix*viewMatrix*vec4(w, 1.); }`;
const SPUR_FRAG = /* glsl */`uniform float uSh; varying vec3 vP, vN; varying float vH;
${GLAZE_GLSL}
void main(){ gzVd = vP - cameraPosition; float dist = length(gzVd); vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  float sp = gzN2(vP.xz*1.7 + vP.y*2.3);
  vec3 col = uSh > .5 ? uClay*uShadeTint : gzMatt(uClay*(.93 + .1*sp)*mix(vec3(1.), vec3(1.03, .95, .9), smoothstep(.5, .9, vH)), N, .6 + .4*smoothstep(0., .3, vH));
  gl_FragColor = vec4(gzOut(col, dist, vP.y), 1.); }`;

// ---- the retinue in ranks: like moulded animals on their slabs, rank behind rank over the whole floor (instanced: one light
// mould, per-figure place, turn, size and seed), glazed above the knee line and bare below it by the far ranks' own shader;
// heads toss in turn along each rank; and their sheared rose shadows (the same vertex shader, uSh 1) ----
const RANK_VERT = /* glsl */`attribute vec4 iPos, iDat; attribute float aNeck; uniform float uSh, uTime; uniform vec3 uSun;
varying vec3 vP, vN; varying vec4 vLoc; varying float vKiln;
vec3 rkX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z); }
vec3 rkY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }
void main(){ vec3 p = position, n = normal; vLoc = vec4(p, iDat.x); vKiln = iDat.w;
  // the toss runs down the rank: iDat.y is the figure's place in it
  float t = uTime*iDat.z + iDat.y, k = max(sin(t*.41), 0.); float k2 = k*k, k4 = k2*k2; float sh = k4*k4*k2;
  float ax = (.035*sin(t*.5) + .02*sin(t*1.3) - .2*sh)*aNeck, ay = (.07*sin(t*.6 + 1.7) + .13*sh*sin(t*6.))*aNeck*aNeck;
  vec3 pv = vec3(0., 126., 60.);
  p = rkY(rkX(p - pv, ax), ay) + pv; n = rkY(rkX(n, ax), ay);
  p = rkY(p, iPos.z)*iPos.w; n = rkY(n, iPos.z);
  vec3 w = vec3(iPos.x + p.x, p.y, iPos.y + p.z);
  if (uSh > .5) { w.xz -= uSun.xz/max(uSun.y, .05)*w.y; w.y = .05; }
  vN = n; vP = w; gl_Position = projectionMatrix*viewMatrix*vec4(w, 1.); }`;
const RANK_SH_FRAG = /* glsl */`varying vec3 vP;
${GLAZE_GLSL}
void main(){ gzVd = vP - cameraPosition;
  vec3 c = uClay*uShadeTint*(.95 + .1*(gzN2(vP.xz/61.)*.6 + gzN2(vP.xz/17. + 9.)*.4));
  gl_FragColor = vec4(gzOut(c, length(gzVd), 0.), 1.); }`;
// the ranks' glaze: the far ranks' pour, with the firing each figure came from (amber, straw-cream, or run over with green)
// and the slab's thumb marks and trimmed edge
const RANK_FRAG = /* glsl */`varying vec3 vP, vN; varying vec4 vLoc; varying float vKiln;
${GLAZE_GLSL}
void main(){ vec3 toCam = cameraPosition - vP; float dist = length(toCam); gzVd = -toCam; vec3 V = toCam/max(dist, 1e-3); vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) N = -N;
  float sd = vLoc.w, h = vLoc.y, lane = vLoc.x*.9 + vLoc.z*.55;
  float cream = step(.5, vKiln)*(1. - step(1.5, vKiln)), gk = step(1.5, vKiln);
  float line = 38. + 7.*(gzN1(lane*.22 + sd*9.) - .5) - 5.*smoothstep(.55, .9, gzN1(lane*.6 + sd*3.));
  float gl = smoothstep(line - .8, line + .8, h);
  float st = gzN2(vec2(lane/3.6 + sd*17., h/52.));
  vec3 g = mix(uAmber, uPool, smoothstep(.5, .2, st)*.6);
  g = mix(g, uStraw, smoothstep(.66, .8, st)*.85);
  g = mix(g, mix(uStraw, uAmber, smoothstep(.5, .22, st)*.85), cream*.9);
  float drip = 104. - 56.*smoothstep(.42, .8, gzN1(vLoc.z*.31 + vLoc.x*.2 + sd*5.));
  float grn = smoothstep(-50., -42., vLoc.z)*(1. - smoothstep(20., 28., vLoc.z))*smoothstep(drip - 3., drip + 3., h)*(1. - smoothstep(150., 156., h));
  grn = max(grn, gk*smoothstep(.46, .6, gzN2(vec2(lane/11. + sd*3., h/75.)))*smoothstep(line + 6., line + 30., h));
  grn = max(grn, .9*smoothstep(.72, .8, gzN2(vec2(lane/5. + sd*29., h/64.)))*smoothstep(118., 150., h));   // green over the crest and the head
  g = mix(g, uGreen, grn*.92);
  vec3 clay = uClay*.97;
  float slab = 1. - smoothstep(7.3, 7.7, h);
  clay *= 1. - slab*(.1*smoothstep(.6, .78, gzN2(vLoc.xz*.33 + sd)) + .12*smoothstep(6.3, 7.3, h)*step(.5, 1. - N.y));   // thumb marks; the trimmed edge
  clay *= 1. - .1*(1. - slab)*smoothstep(.55, .8, gzN2(vec2(lane*.5, h*.35 + sd)));                                       // knife facets on the bare legs
  vec3 col = mix(gzMatt(clay, N, 1.), gzGlass(g, N, V, 1.), gl); gzSpec *= gl;
  gl_FragColor = vec4(gzOut(col, dist, vP.y), 1.); }`;
// a light mould from the far-rank lofts: every part's ring grid thinned to [segments along, sides round] (null = left off)
function rankMould(parts, plan, slab) {
  const pos = [], nor = [], neck = [], idx = [];
  parts.forEach((pt, k) => {
    const pl = plan[k]; if (!pl) return;
    const nA = Math.min(pl[0], pt.nS), nR = Math.min(pl[1], pt.nT), base = pos.length / 3;
    for (let i = 0; i <= nA; i++) { const ii = Math.round(i * pt.nS / nA);
      for (let j = 0; j < nR; j++) { const jj = Math.round(j * pt.nT / nR) % pt.nT, o = (ii * pt.W + jj) * 3;
        pos.push(pt.P[o], pt.P[o + 1], pt.P[o + 2]); nor.push(pt.N[o], pt.N[o + 1], pt.N[o + 2]); neck.push(pt.bend[o]); } }
    for (let i = 0; i < nA; i++) for (let j = 0; j < nR; j++) { const a = base + i * nR + j, b = base + i * nR + (j + 1) % nR, c = a + nR, d = b + nR; idx.push(a, b, c, b, d, c); }
  });
  if (slab) {   // the slab: a box with its top a little narrower than its foot (trimmed edges), 12 triangles
    const [w, h, d] = slab, base = pos.length / 3, q = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (const y of [0, 1]) for (const c of q) { pos.push(c[0] * w / 2 * (y ? 0.94 : 1), y * h, c[1] * d / 2 * (y ? 0.97 : 1)); nor.push(c[0] * 0.6, y ? 0.5 : 0.1, c[1] * 0.6); neck.push(0); }
    for (let j = 0; j < 4; j++) { const a = base + j, b = base + (j + 1) % 4; idx.push(a, a + 4, b, b, a + 4, b + 4); }
    for (const c of q) { pos.push(c[0] * w / 2 * 0.94, h, c[1] * d / 2 * 0.97); nor.push(0, 1, 0); neck.push(0); }
    idx.push(base + 8, base + 11, base + 9, base + 9, base + 11, base + 10);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aNeck', new THREE.Float32BufferAttribute(neck, 1)); g.setIndex(idx);
  return g;
}


// ---- the light in the camel's belly: the vent is lit from inside, straw to slip, seen from before and below it ----
const GLOW_VERT = /* glsl */`uniform vec3 uC, uOutDir; uniform float uR; varying vec2 vUv; varying float vF;
void main(){ vUv = position.xy; vec3 tc = cameraPosition - uC; float d = length(tc);
  vF = smoothstep(-.05, .5, dot(tc/max(d, 1e-3), uOutDir))*smoothstep(14., 60., d);
  vec4 mv = viewMatrix*vec4(uC, 1.); mv.xy += position.xy*uR*max(1., d/300.); gl_Position = projectionMatrix*mv; }`;
const GLOW_FRAG = /* glsl */`varying vec2 vUv; varying float vF; uniform float uTime, uGlow;
${GLAZE_GLSL}
void main(){ float r2 = dot(vUv, vUv), ang = atan(vUv.y, vUv.x + 1e-6);
  float ray = .62 + .38*gzN1(ang*5. + uTime*.9)*gzN1(ang*13. - uTime*.6 + 4.) + .12*sin(uTime*1.7);
  float a = (exp(-r2*26.)*1.1 + exp(-r2*5.5)*.62*ray + exp(-r2*1.8)*.34)*(1. - smoothstep(.7, 1., r2))*vF*uGlow;
  vec3 c = mix(mix(uAmber, uPool, .15), mix(uAmber, uStraw, .55), exp(-r2*4.)); c = mix(c, uSlip, exp(-r2*22.)*.85);
  gl_FragColor = vec4(gzToScene(c), clamp(a*1.15, 0., 1.)); }`;

// ---- the kiln's light in the dust beyond the camel: from the avenue its head is thrown back on a straw sky (a soft veil of lit
// dust standing behind it; whatever stands before it is drawn against it) ----
const HALO_VERT = /* glsl */`uniform vec3 uC; uniform float uR; varying vec2 vUv; varying float vF;
void main(){ vUv = position.xy; float d = length(cameraPosition - uC); vF = smoothstep(150., 400., d);
  vec4 mv = viewMatrix*vec4(uC, 1.); mv.xy += position.xy*uR; gl_Position = projectionMatrix*mv; }`;
const HALO_FRAG = /* glsl */`varying vec2 vUv; varying float vF; uniform float uTime, uGlow;
${GLAZE_GLSL}
void main(){ float r2 = dot(vUv, vUv), ang = atan(vUv.y, vUv.x + 1e-6);
  float br = .94 + .06*sin(uTime*.7 + ang*3.);
  float a = (exp(-r2*3.)*.92 + exp(-r2*11.)*.3)*br*(1. - smoothstep(.55, 1., r2))*vF*uGlow;
  vec3 c = mix(uHazeSun, uSlip, exp(-r2*7.)*.8);
  gl_FragColor = vec4(gzToScene(c), clamp(a, 0., 1.)); }`;

// collar of the camel's vent: a pared clay rim showing the wall's thickness, revolved round the exit axis (always bare: part 2)
function ventCollar(c, dir, rIn, rOut, tA, tB, tC, rng) {
  const n = 40, prof = [[rIn, tC], [rIn, tA + 0.5], [rIn + 0.35, tA], [rOut - 0.5, tA], [rOut, tA + 0.7], [rOut * 1.02, tB]];
  const D = new THREE.Vector3().fromArray(dir).normalize(), U = new THREE.Vector3(0, 0, 1), V = new THREE.Vector3().crossVectors(D, U).normalize();
  const W = n + 1, cnt = prof.length * W, P = new Float32Array(cnt * 3), S = new Float32Array(cnt * 4), F = new Float32Array(cnt * 4), B = new Float32Array(cnt * 3), idx = [];
  const fac = Array.from({ length: n }, () => rng.range(0.97, 1.035));
  for (let i = 0; i < prof.length; i++) for (let j = 0; j <= n; j++) {
    const a = (j % n) / n * Math.PI * 2, r = prof[i][0] * (i >= 2 ? fac[j % n] : 1), t = prof[i][1] + (i >= 2 && i <= 4 ? 0.35 * Math.sin(a * 3 + 1) : 0), o = (i * W + j) * 3;
    P[o] = c[0] + D.x * t + (U.x * Math.cos(a) + V.x * Math.sin(a)) * r; P[o + 1] = c[1] + D.y * t + (U.y * Math.cos(a) + V.y * Math.sin(a)) * r; P[o + 2] = c[2] + D.z * t + (U.z * Math.cos(a) + V.z * Math.sin(a)) * r;
    S[(i * W + j) * 4 + 2] = i < 2 ? 0.55 : 1; S[(i * W + j) * 4 + 3] = 2; F[(i * W + j) * 4 + 1] = a * 30;
  }
  for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < n; j++) { const a = i * W + j, b = a + 1, e = a + W, f = e + 1; idx.push(a, e, b, b, e, f); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aFlow', new THREE.BufferAttribute(F, 4));
  g.setAttribute('aSurf', new THREE.BufferAttribute(S, 4)); g.setAttribute('aBend', new THREE.BufferAttribute(B, 3)); g.setAttribute('aLw', new THREE.BufferAttribute(new Float32Array(cnt), 1));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---- the camel mould (object space: slab base centre at the origin, head toward +Z). Loaded Bactrian, head thrown back ----
const CAMEL = { knee: 30, slab: [80, 6, 190], pivot: [0, 100, 66], packPivot: [0, 108, -3], legX: 19, foreZ: 58, hindZ: -62, rumpZ: -78, chestZ: 72,
  ventC: [0, 69, 0], ventDir: [0.7071, 0.7071, 0], ventMouth: -19, ventPortal: -14 };
async function camelParts(rng, q, Y, bake) {
  const BK = bake ? bakeFlow : (p) => p;
  const NS = (x) => Math.max(8, Math.round(x * q)), NT = (x) => Math.max(8, Math.round(x * (0.5 + 0.5 * q) / 2) * 2);
  const parts = [], load = [];
  const zOf = (s) => lerp(CAMEL.rumpZ, CAMEL.chestZ, s), H1 = 0.31, H2 = 0.64;
  const hump = (s, th) => (gauss(s - H1, 0.085) + gauss(s - H2, 0.085)) * gauss(angd(th, Math.PI / 2), 0.62);
  const inCloth = (s, th) => smoothstep(0.375, 0.39, s) * (1 - smoothstep(0.56, 0.575, s)) * (1 - smoothstep(1.2, 1.26, Math.abs(angd(th, Math.PI / 2)) + 0.04 * Math.sin(s * 110)));
  const body = loftPart({
    nS: NS(112), nT: NT(64), up: [0, 1, 0], seam: 0.6, carry: 46, laneOff: 0,
    at: (s) => {
      const c = capR(s, 0.2, 0.2), top = 110 - 3 * gauss(s - 0.48, 0.2), bot = 66 + 9 * (1 - smoothstep(0.05, 0.45, s)) + 6 * smoothstep(0.7, 1, s);
      const ry = (top - bot) / 2 * (0.25 + 0.75 * c), cy = (top + bot) / 2 + 3 * (1 - c);
      return { p: [0, cy, zOf(s)], rx: (31 + 3 * gauss(s - 0.5, 0.25)) * c, ry };
    },
    shape: (s, th) => 1 + 0.06 * Math.sin(th) + 0.07 * (gauss(s - 0.14, 0.1) + gauss(s - 0.86, 0.09)) * Math.pow(Math.abs(Math.cos(th)), 1.5),
    disp: (s, th) => 33 * hump(s, th) + 1.3 * inCloth(s, th) * (1 - Math.min(1, 2 * hump(s, th))),
    part: 0, green: (s, th) => inCloth(s, th), cream: (s, th) => smoothstep(0.55, 0.8, hump(s, th)),
    ridge: (s, th) => 3 * inCloth(s, th) * (1 - inCloth(s, th)) + 0.25 * smoothstep(0.5, 0.9, hump(s, th)) * Math.abs(Math.sin(th * 14 + s * 60)),
    hollow: (s, th, x, y, z) => 0.5 * gauss(y - 80, 12) * (gauss(z - CAMEL.foreZ, 15) + gauss(z - CAMEL.hindZ, 16)) * smoothstep(8, 14, Math.abs(x)) + 0.5 * gauss(s - 0.475, 0.06) * gauss(angd(th, Math.PI / 2), 0.6)
      + 0.75 * gauss(Math.hypot(x, z - 10), 30) * smoothstep(88, 74, y),
    bend: (x, y, z, s) => [0, 0, smoothstep(0.3, 0.6, s) * (1 - smoothstep(0.9, 1, s)) * smoothstep(112, 80, y)],
  }, true);
  await Y(); for (let a = 0; a <= body.nS; a += 4) { loftDisplace(body, a, a + 4, a + 4 > body.nS); await Y(); }
  for (let a = 0; a < body.n; a += 150) { BK(body, 1, a, a + 150); await Y(); }
  for (let a = 0; a <= body.nS; a += 5) { BK(body, 2, a, a + 5); await Y(); }
  for (let i = 0; i < body.n; i++) { const s = ((i / body.W) | 0) / body.nS, th = ((i % body.W) % body.nT) / body.nT * Math.PI * 2; if (inCloth(s, th) > 0.5) body.surf[i * 4 + 3] = 1; if (i % 1500 === 1499) await Y(); }
  parts.push(body); await Y();
  // neck: down and forward from the chest, then up and thrown back
  const nk = [[0, 97, 60], [0, 66, 122], [0, 152, 136], [0, 149, 99]];
  const neckAt = (s) => { const c = capR(s, 0.01, 0.1); return { p: bez(nk[0], nk[1], nk[2], nk[3], s), rx: lerp(21, 8.5, Math.pow(s, 0.8)) * (0.6 + 0.4 * c), ry: lerp(27, 10, Math.pow(s, 0.7)) * (0.6 + 0.4 * c) }; };
  const neck = loftPart({ nS: NS(60), nT: NT(40), up: [1, 0, 0], seam: 0.6, at: neckAt, laneOff: 300, carry: 60,
    disp: (s, th) => 2.2 * gauss(s - 0.42, 0.25) * Math.max(0, Math.cos(th)) * (0.6 + 0.4 * Math.sin(s * 70)),   // the throat's shaggy fringe
    cream: (s, th) => 0.4 * gauss(s - 0.42, 0.25) * smoothstep(0.3, 0.8, Math.cos(th)),
    bend: (x, y, z, s) => [smoothstep(0.12, 1, s), 0, 0] });
  await Y(); BK(neck); parts.push(neck); await Y();
  // head: thrown back, muzzle to the sky. Skull behind, a separate lower jaw in front that the bellow shears open (ear channel)
  const hp0 = [0, 146, 97], hp1 = [0, 181, 110], hl = Math.hypot(35, 13), ht = [0, 35 / hl, 13 / hl], hb = [0, 13 / hl, -35 / hl];
  const skull = loftPart({ nS: NS(34), nT: NT(28), up: [1, 0, 0], seam: 0.5, laneOff: 500, part: 3, carry: 50,
    at: (s) => { const c = capR(s, 0.2, 0.12), o = 2.6 - 1.2 * s; return { p: [0, lerp(hp0[1], hp1[1], s) + hb[1] * o, lerp(hp0[2], hp1[2], s) + hb[2] * o], rx: (7.8 - 2.6 * smoothstep(0.25, 0.8, s) + 0.8 * gauss(s - 0.92, 0.08)) * c, ry: (6.2 - 2.4 * smoothstep(0.3, 0.85, s)) * c }; },
    disp: (s, th) => { const eye = (sd) => 1.3 * gauss((s - 0.3) * 37, 2.4) * gauss(angd(th, Math.PI + sd * 1.2) * 7, 1.4); return eye(1) + eye(-1) + 1.2 * (1 - smoothstep(0.08, 0.3, s)) * gauss(angd(th, Math.PI), 0.9); },
    cream: (s, th) => (1 - smoothstep(0.1, 0.34, s)) * smoothstep(0, 0.6, -Math.cos(th)), bend: () => [1, 0, 0] });
  BK(skull); parts.push(skull); await Y();
  const jaw = loftPart({ nS: NS(26), nT: 12, up: [1, 0, 0], seam: 0.3, laneOff: 560, part: 3, carry: 50,
    at: (s) => { const c = capR(s, 0.1, 0.12), o = -3.4 - 0.4 * s, t = lerp(0.1, 0.93, s); return { p: [0, lerp(hp0[1], hp1[1], t) + hb[1] * o, lerp(hp0[2], hp1[2], t) + hb[2] * o], rx: 2.3 * c, ry: (5.2 - 1.8 * s) * c }; },
    bend: (x, y, z, s) => [1, smoothstep(0, 1, s), 0] });
  BK(jaw); parts.push(jaw); await Y();
  for (const sd of [-1, 1]) { const e0 = [sd * 5.5, 146, 91], e1 = [sd * 9, 150, 82];
    const ear = loftPart({ nS: 8, nT: 8, up: [0, 1, 0], laneOff: 600 + sd * 20, part: 3, at: (s) => ({ p: [lerp(e0[0], e1[0], s), lerp(e0[1], e1[1], s), lerp(e0[2], e1[2], s)], rx: 2.6 * Math.sin(Math.PI * Math.min(1, s + 0.15)) + 0.05, ry: 1.3 * (1 - s) + 0.05 }), bend: () => [1, 0, 0] });
    BK(ear); parts.push(ear); await Y(); }
  const mkLeg = (x, z, hind, id) => {
    const fac = Array.from({ length: 12 }, () => rng.range(0.93, 1.05));
    const leg = loftPart({ nS: NS(44), nT: 12, up: [0, 0, 1], curvK: 0.35, laneOff: 700 + id * 90, down0: 24 + id * 3, carry: 60,
      at: (s) => { const y = lerp(100, 6, s), k = hind ? 50 : 45;
        const r = 6.6 + 8 * Math.pow(smoothstep(56, 102, y), 2) + 2.6 * gauss(y - k, 5) + 2.0 * (1 - smoothstep(6, 12, y)) - 0.8 * gauss(y - 16, 3);
        const zz = z + (hind ? -6 * gauss(y - 54, 15) + 4 * smoothstep(60, 100, y) : 1.5 * gauss(y - k, 7)) + 1.6 * (1 - smoothstep(6, 12, y));
        const cx = Math.min(1, s / 0.07), cl = 0.25 + 0.75 * Math.sqrt(1 - (1 - cx) * (1 - cx)); return { p: [x * (1 - 0.25 * smoothstep(62, 100, y)), y, zz], rx: r * cl, ry: r * cl * (1.1 + 0.4 * smoothstep(62, 100, y)) }; },
      shape: (s, th) => fac[Math.round(th / (Math.PI * 2) * 12) % 12] * (1 + 0.035 * Math.sin(s * 23 + th * 3)),
      hollow: (s, th, px, py) => 0.35 * gauss(py - 16, 2.2) + 0.5 * smoothstep(80, 96, py) });
    BK(leg); return leg;
  };
  const legs = [mkLeg(-CAMEL.legX, CAMEL.foreZ, 0, 0)]; await Y(); legs.push(mkLeg(CAMEL.legX, CAMEL.foreZ, 0, 1)); await Y();
  legs.push(mkLeg(-CAMEL.legX, CAMEL.hindZ, 1, 2)); await Y(); legs.push(mkLeg(CAMEL.legX, CAMEL.hindZ, 1, 3)); await Y();
  parts.push(...legs);
  const tail = loftPart({ nS: NS(18), nT: 8, up: [1, 0, 0], laneOff: 1200, at: (s) => ({ p: [0, lerp(106, 80, s), -77 - 9 * Math.sin(s * 2.2)], rx: (4 - 2.2 * s) * capR(s, 0.05, 0.1) + 0.05, ry: (3.6 - 2 * s) * capR(s, 0.05, 0.1) + 0.05 }) });
  BK(tail); parts.push(tail); await Y();
  // the load (its own mesh: it rocks): a pack board between the humps, bolts of silk either side, one pilgrim flask
  const board = loftPart({ nS: NS(26), nT: 16, up: [0, 1, 0], laneOff: 1400, seam: 0, carry: 30,
    at: (s) => { const c = capR(s, 0.08, 0.08), x = lerp(-33, 33, s); return { p: [x, 113 - 0.012 * x * x, -3], rx: 15 * (0.5 + 0.5 * c), ry: 3.2 * c }; },
    green: () => 0, cream: () => 0, ridge: (s, th) => 0.6 * Math.pow(Math.abs(Math.cos(th)), 8), bend: () => [1, 0, 0] });
  BK(board); load.push(board); await Y();
  let id = 0;
  for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {
    const bx = sd * [33.5, 37, 34][k], by = [111, 103, 95][k], kind = (k + (sd > 0 ? 1 : 0)) % 3, z0 = -33 + 3 * k, z1 = 27 - 2 * k;
    const bolt = loftPart({ nS: NS(30), nT: 12, up: [0, 1, 0], laneOff: 1500 + 40 * id++, carry: 40,
      at: (s) => { const c = capR(s, 0.04, 0.04); return { p: [bx, by, lerp(z0, z1, s)], rx: 4.4 * (0.55 + 0.45 * c), ry: 4.4 * (0.55 + 0.45 * c) }; },
      disp: (s, th) => 0.45 * Math.sin(th * 2 + s * 30) + 0.5 * (gauss(s - 0.2, 0.02) + gauss(s - 0.8, 0.02)),
      green: () => (kind === 1 ? 1 : 0), cream: () => (kind === 2 ? 1 : 0), ridge: (s, th) => 0.5 * Math.max(0, Math.sin(th * 2 + s * 30)) + gauss(s - 0.2, 0.02) + gauss(s - 0.8, 0.02), bend: () => [1, 0, 0] });
    BK(bolt); load.push(bolt); await Y();
  }
  await Y();
  const flask = loftPart({ nS: NS(22), nT: 16, up: [0, 0, 1], laneOff: 1800, seam: 0.4, carry: 30,
    at: (s) => { const r = s < 0.2 ? 1.6 + 1.2 * gauss(s - 0.02, 0.04) : 1.6 + 8.4 * Math.sin(Math.PI * Math.pow((s - 0.2) / 0.8, 0.8)); return { p: [38.5, lerp(92, 68, s), 34], rx: 0.5 * r * capR(s, 0.02, 0.05) + 0.05, ry: r * capR(s, 0.02, 0.05) + 0.05 }; },
    green: () => 0.7, cream: () => 0, bend: () => [1, 0, 0] });
  BK(flask); load.push(flask);
  return { parts, load, body, neck, skull, jaw, legs, neckAt, hp0, hp1 };
}

async function buildCamel(ctx, style, rng, kiln) {
  const Y = () => ctx.yield(), detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1);
  const lowRng = rng.fork('camel-low'), seed = rng.range(1, 90), TAU = Math.PI * 2;
  const C = await camelParts(rng, 1, Y, true);
  markLegs(C.legs, CAMEL.knee);   // the camel's legs are pared and its line comes down in tongues as the horses' do (places on the mould; no draw of the seed)
  await Y();
  const geos = [];
  for (const p of C.parts) {
    const g = partGeometry(p, true);
    if (p === C.body) { // cut the vent: drop the belly triangles inside the collar
      const P = p.P, src = g.index.array, keep = [], c = CAMEL.ventC, d = CAMEL.ventDir;
      const inHole = (v) => { const x = P[v * 3] - c[0], y = P[v * 3 + 1] - c[1], z = P[v * 3 + 2] - c[2], t = x * d[0] + y * d[1] + z * d[2]; return P[v * 3 + 1] < 86 && Math.hypot(x - d[0] * t, y - d[1] * t, z - d[2] * t) < 9.4; };
      for (let i = 0; i < src.length; i += 3) if (!(inHole(src[i]) && inHole(src[i + 1]) && inHole(src[i + 2]))) keep.push(src[i], src[i + 1], src[i + 2]);
      g.setIndex(keep);
    }
    geos.push(g); await Y();
  }
  geos.push(ventCollar(CAMEL.ventC, CAMEL.ventDir, 7.8, 16.8, CAMEL.ventMouth, 8, 5, rng));
  geos.push(slabGeometry(CAMEL.slab[0], CAMEL.slab[1], CAMEL.slab[2], rng, 3));
  await Y();
  const geo = mergeGeometries(geos, false); geos.forEach((g) => g.dispose());
  markAttr(geo, C.parts);
  await Y();
  const lg = C.load.map((p) => partGeometry(p, true)), loadGeo = mergeGeometries(lg, false); lg.forEach((g) => g.dispose());
  markAttr(loadGeo, []);
  await Y();
  const L = await camelParts(lowRng, 0.3, Y, false);
  await Y();
  const sg = L.parts.map((p) => partGeometry(p, false)); await Y();
  for (const p of L.load) { const g = partGeometry(p, false); g.attributes.aBend.array.fill(0); sg.push(g); }
  sg.push(slabGeometry(CAMEL.slab[0], CAMEL.slab[1], CAMEL.slab[2], lowRng, 3));
  const shadowGeo = mergeGeometries(sg, false); sg.forEach((g) => g.dispose());
  for (const k of ['aFlow', 'aSurf', 'aLw', 'normal']) shadowGeo.deleteAttribute(k);
  await Y();
  // leading runs and beads
  const runs = [], beads = [];
  const addRun = (part, fi, fj, step, n, minY, w, bendOf) => {
    const pts = traceDown(part, fi, fj, step, n, minY, rng.range(0.06, 0.22), rng() * 9); if (pts.length < 4) return;
    const o = (clamp(Math.round(fi), 0, part.nS) * part.W + ((Math.round(fj) % part.nT) + part.nT) % part.nT) * 4;
    const h = rng(), col = part.flow[o + 2] > 0.8 ? 1 : (rng() < 0.15 ? 2 : 0), e = pts[pts.length - 1], early = pts.length - 1 === n && part === C.body;
    if (bendOf) for (const q of pts) q.bend = bendOf(q.p);
    runs.push({ pts, w, col, h, seed: rng() });
    beads.push({ p: [e.p[0] + e.n[0] * 0.25, e.p[1] + 0.35, e.p[2] + e.n[2] * 0.25], size: w * rng.range(2.2, 4.2) * (early ? 0.45 : 1), h, col, bend: e.bend, seed: rng() });
  };
  for (const leg of C.legs) { await Y(); for (let k = 0; k < 7; k++) addRun(leg, (100 - rng.range(50, 76)) / 94 * leg.nS, rng() * leg.nT, 1.8, 31, CAMEL.knee - (rng() < 0.3 ? rng.range(3, 9) : rng.range(-2, 4)), rng.range(0.55, 1.3)); }
  await Y();
  const nBody = Math.round(42 * detail);
  for (let k = 0; k < nBody; k++) { if (k % 8 === 7) await Y(); addRun(C.body, rng.range(0.05, 0.95) * C.body.nS, (Math.PI / 2 + rng.sign() * rng.range(1.0, 2.0)) / TAU * C.body.nT, 2.6, rng.int(14, 31), 0, rng.range(0.8, 2.0)); }
  await Y();
  for (let k = 0; k < 10; k++) addRun(C.neck, rng.range(0.1, 0.85) * C.neck.nS, (rng.sign() * rng.range(0.7, 1.5) + Math.PI / 2) / TAU * C.neck.nT, 2.2, 31, 0, rng.range(0.7, 1.4), (p) => [smoothstep(0.12, 1, clamp((p[2] - 60) / 70, 0, 1)) * 0.6, 0, 0]);
  // the vent's crown of beads, and a row along the keel of the belly
  const D = new THREE.Vector3().fromArray(CAMEL.ventDir), U = new THREE.Vector3(0, 0, 1), V = new THREE.Vector3().crossVectors(D, U).normalize();
  const nCrown = 18;
  for (let k = 0; k < nCrown; k++) {
    const a = (k + rng.range(-0.25, 0.25)) / nCrown * TAU, r = 17.2, t = CAMEL.ventMouth + 1;
    beads.push({ p: [CAMEL.ventC[0] + D.x * t + (U.x * Math.cos(a) + V.x * Math.sin(a)) * r, CAMEL.ventC[1] + D.y * t + (U.y * Math.cos(a) + V.y * Math.sin(a)) * r, CAMEL.ventC[2] + D.z * t + (U.z * Math.cos(a) + V.z * Math.sin(a)) * r],
      size: (k % 2 ? rng.range(9, 13) : rng.range(5.5, 8)) * (Math.sin(a) > 0.25 ? 0.7 : 1), h: -1, col: k % 3 === 1 ? 1 : 0, seed: rng() });
  }
  const b = C.body;
  for (let k = 0; k < 18; k++) {
    const i = clamp(Math.round(rng.range(0.16, 0.86) * b.nS), 0, b.nS), j = Math.round((0.75 + rng.range(-0.03, 0.03)) * b.nT) % b.nT, o = (i * b.W + j) * 3;
    if (Math.hypot(b.P[o], b.P[o + 2] - 6) < 22) continue;
    beads.push({ p: [b.P[o], b.P[o + 1] + 0.4, b.P[o + 2]], size: rng.range(1.8, 4.6), h: -1, col: b.flow[(i * b.W + j) * 4 + 2] > 0.3 ? 1 : 0, seed: rng() });
  }
  beads.push({ p: [0, C.hp0[1] - 3, C.hp0[2] + 9], size: 4, h: -1, col: 0, bend: [1, 0, 0], seed: 0.3 });
  await Y();
  const runGeo = runsGeometry(runs);
  await Y();
  const pivot = new THREE.Vector3().fromArray(CAMEL.pivot);
  const mat = glazeFigureMaterial(style, { seed, knee: CAMEL.knee, kiln, cobalt: false, pivot, scale: 1, front0: 104, frontVar: 50, legs: [CAMEL.legX, CAMEL.foreZ, CAMEL.hindZ, 8.5] });
  const loadMat = glazeFigureMaterial(style, { seed: seed + 7.3, knee: CAMEL.knee, kiln: kiln === 'cream' ? 'amber' : kiln, cobalt: false, pivot: new THREE.Vector3().fromArray(CAMEL.packPivot), scale: 1, front0: 400 });
  const poseU = { pose: mat.uniforms.uPose, pivot: mat.uniforms.uPivot };
  const group = new THREE.Group(); group.name = 'glaze-camel';
  const fig = new THREE.Mesh(geo, mat), ld = new THREE.Mesh(loadGeo, loadMat), sh = new THREE.Mesh(shadowGeo, glazeShadowMaterial(style, poseU));
  const rn = new THREE.Mesh(runGeo, glazeRunMaterial(style, poseU)), bd = beadsMesh(style, beads, poseU);
  sh.renderOrder = -0.5; for (const x of [fig, ld, sh, rn, bd]) { x.frustumCulled = false; group.add(x); }
  return { group, pose: mat.uniforms.uPose.value, loadPose: loadMat.uniforms.uPose.value, material: mat };
}

export default {
  id: 'glaze-stops-at-the-knees',
  name: 'The Glaze Stops at the Knees',
  category: 'artists',
  placeKind: 'bizarre',
  after: 'Tang three-colour tomb figures, China, about 680 to 760',
  weirdness: 0.6,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, Y = () => ctx.yield();
    const detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), density = clamp(ctx.vary?.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    const style = makeGlazeStyle(GLAZE_PALETTE);
    const EXPOSURE = 1; style.uGain.value = 0.6 / EXPOSURE;

    // ---- the seed picks the firing and the hour, once ----
    const kr = rng(), kiln = kr < 0.6 ? 'amber' : kr < 0.8 ? 'streaked' : 'cream';
    const hr = rng(), hint = ctx.vary?.hour || 'any';
    const hour = hint === 'day' ? 'haze' : hint === 'night' ? 'dusk' : (hint === 'golden' || hint === 'dawn') ? (hr < 0.5 ? 'afternoon' : 'last') : (hr < 0.6 ? 'afternoon' : 'last');
    const sunEl = { afternoon: 14, last: 5.5, haze: 35, dusk: 50 }[hour] * Math.PI / 180;
    style.uSun.value.set(Math.cos(sunEl) * 0.951, Math.sin(sunEl), Math.cos(sunEl) * 0.31).normalize();
    const clay = style.uClay.value, straw = style.uStraw.value;
    // the same clay, three values: the level floor takes the sun at a graze (a mid-tone), an upright face turned to it is the
    // brightest matt thing in the frame, its shade side is lit rose from the floor; cast shadows are a deeper rose, never grey
    let sunVis = 1, floorLit = 1; const skyDeep = new THREE.Vector3(1, 1, 1), floorTint = new THREE.Vector3(1.06, 1.0, 0.98);
    const RGB = (u, r, g, b) => u.value.setRGB(r, g, b), HEX = (u, h) => u.value.set(h);
    style.uDustL.value = 0.0003; style.uDustK.value = 0; style.uDustCol.value.copy(straw).lerp(clay, 0.3);
    if (hour === 'last') {          // sun 5.5 degrees: the floor darker still, kilometre shadows, everything rosier
      RGB(style.uSunK, 1.15, 1.13, 1.05); RGB(style.uFloorCol, 0.7, 0.51, 0.51); RGB(style.uSkyCol, 0.47, 0.345, 0.38); RGB(style.uShadeTint, 0.215, 0.124, 0.165);
      HEX(style.uHazeSun, '#F3DDB8'); HEX(style.uHazeRose, '#D9AE99'); HEX(style.uSkyZen, '#AE7C76'); style.uHazeD.value = 1400; RGB(style.uSunCol, 1.0, 0.86, 0.7); floorTint.set(0.84, 0.69, 0.64);
    } else if (hour === 'haze') {   // sun 35 degrees in high haze: short soft shadows, a pale bright floor
      RGB(style.uSunK, 1.06, 1.1, 1.12); RGB(style.uFloorCol, 0.8, 0.7, 0.7); RGB(style.uSkyCol, 0.7, 0.62, 0.62); RGB(style.uShadeTint, 0.62, 0.52, 0.56);
      HEX(style.uHazeSun, '#F7F0DC'); HEX(style.uHazeRose, '#EEDCCB'); HEX(style.uSkyZen, '#E6CDBC'); style.uHazeD.value = 800; floorTint.set(1.0, 0.99, 0.98);
    } else if (hour === 'dusk') {   // a shadowless pale dusk, never dark
      RGB(style.uSunK, 0.96, 0.9, 0.9); RGB(style.uFloorCol, 0.82, 0.72, 0.71); RGB(style.uSkyCol, 0.8, 0.71, 0.72); RGB(style.uShadeTint, 0.78, 0.69, 0.71);
      HEX(style.uHazeSun, '#EFDFD0'); HEX(style.uHazeRose, '#E6CDC2'); HEX(style.uSkyZen, '#D2B2AA'); style.uHazeD.value = 900; sunVis = 0; RGB(style.uSunCol, 0.5, 0.45, 0.42); floorTint.set(1.0, 0.99, 0.99);
    } else {                        // late afternoon, sun 14 degrees
      RGB(style.uSunK, 1.13, 1.226, 1.28); RGB(style.uFloorCol, 0.71, 0.54, 0.55); RGB(style.uSkyCol, 0.47, 0.365, 0.4); RGB(style.uShadeTint, 0.215, 0.128, 0.17);
      HEX(style.uHazeSun, '#F4E4C2'); HEX(style.uHazeRose, '#DDB59F'); HEX(style.uSkyZen, '#AF7C73'); style.uHazeD.value = 1400; floorTint.set(0.75, 0.61, 0.55);
    }

    // ---- the horse (hero) ----
    const hero = await buildHero(ctx, { style, kiln, detail });
    hero.object.position.fromArray(HORSE_O); hero.object.rotation.y = HORSE_ROT; hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    const HW = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(hero.object.matrixWorld);
    await Y();

    // ---- twelve ponies from pony moulds (the horse's mould at a fifth of the size, coarser, on a deeper slab) ----
    const PS = 0.19, N_MOULD = 3, kilns = ['amber', 'cream', 'streaked'];
    const moulds = [];
    for (let m = 0; m < N_MOULD; m++) { moulds.push(await buildHero(ctx, { style, kiln, q: 0.22, runs: 0.17, lite: true, scale: PS, slab: [70, 7.5, 150], cobalt: false, detail: 0.6 })); await Y(); }
    const rare = !!ctx.vary?.rare;
    const spots = [], AV_S = [56, 335, 190, 606], AV_OFF = [0, 0, 0, 0], STAG = [0, 0, 26, 0], PSTAG = [58, 84, 0, 0];   // the starboard pony of a pair stands a little further on: one near and large, its fellow beyond   // { pos [x,z], face [fx,fz], tag }
    for (const sd of [-1, 1]) spots.push({ pos: sd < 0 ? [67.4, 400.4] : [15, 139], face: sd < 0 ? [-0.3, -0.954] : [-0.62, 0.785], tag: 'entry', sd });   // one by the entry, one by the great horse's slab for measure   // far enough in that each stands whole inside the entry portal's opening
    for (let k = 0; k < 4; k++) for (const sd of [1, -1]) {       // sd +1 = port, -1 = starboard (looking up the avenue)
      if (k === 3 && sd === -1) { spots.push({ pos: [-158, 182], face: [-0.45, -0.89], tag: 'entry', sd }); continue; }   // the last pair's other pony stands out before the great horse, where the way swings wide across its front
      // the pairs flank the path: after the third pair it veers to port, so the fourth stands clear of the camel, then it crosses the camel's front at 150 m and turns in
      const swing = k === 1 && sd === -1, first = k === 0 && sd === -1, p = A(AV_S[k] + (k === 3 ? 4 : 0) + (first ? -10 : 0) + (sd < 0 ? STAG[k] : PSTAG[k]), 0, AV_OFF[k] + sd * (swing ? 20.5 : first ? 20.5 : k === 0 ? 19 : k === 3 ? 21 : 17.5)), turn = swing ? 0.2 : first ? 0.66 : 0.3;
      const fx = DZ * Math.cos(turn) - sd * DX * Math.sin(turn), fz = -DX * Math.cos(turn) - sd * DZ * Math.sin(turn);
      spots.push({ pos: [p[0], p[2]], face: [fx, fz], tag: swing ? 'swing' : 'avenue', k, sd, s: AV_S[k] });   // the last avenue pony stands alone beside the way, the camel beyond
    }
    for (const sd of [1, -1]) { const p = CAMEL_AT(150, 0, sd * 24); spots.push({ pos: [p[0], p[2]], face: [DZ, -DX], tag: 'last', sd }); }   // beyond the camel, seen small under its belly
    const cobalt = new THREE.Color(GLAZE_PALETTE[5]);
    const ponies = [];
    for (let i = 0; i < spots.length; i++) {
      if (spots[i].tag === 'last') continue;   // never nearer than 250 m: they stand in the far-rank mesh, at pony size
      const sp = spots[i], mould = moulds[i % N_MOULD], blue = rare && sp.tag === 'avenue' && sp.k === 3 && sp.sd === 1;
      const odd = rng() < 0.2, pk = blue ? 'amber' : (odd ? kilns[rng.int(0, 2)] : kiln);
      const inst = mould.instance({ seed: rng.range(1, 90), kiln: pk, scale: PS * rng.range(0.94, 1.06), cobalt: false,
        tint: blue ? { uAmber: { value: cobalt.clone() }, uPool: { value: cobalt.clone().multiplyScalar(0.55) } } : undefined });
      if (blue) inst.material.uniforms.uKiln.value.x = 0.05;
      inst.object.position.set(sp.pos[0], 0, sp.pos[1]); inst.object.rotation.y = Math.atan2(sp.face[0], sp.face[1]);
      scene.add(inst.object);
      ponies.push({ ...sp, pose: inst.pose, ph: rng() * 6.283, rate: rng.range(0.7, 1.2), uAt: 0 });
      await Y();
    }
    await Y();

    // ---- the camel at the avenue's end ----
    const camel = await buildCamel(ctx, style, rng.fork('camel'), kiln);
    { const c = A(CAMEL_S); camel.group.position.set(c[0], 0, c[2]); camel.group.rotation.y = CAMEL_ROT; camel.group.updateMatrixWorld(true); }
    scene.add(camel.group);
    const CW = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(camel.group.matrixWorld);
    await Y();

    // ---- the far ranks ----
    let rankParts = null; const rankSh = [], rankFigs = [];   // rankSh: x, z, turn, scale of every figure whose shadow is the light shadow mould; rankFigs: every standing figure's place and reach
    {
      const fr = rng.fork('far-ranks');
      const FL = await buildHorseParts(fr, 0.05, Y, null, false); await Y(); rankParts = FL.parts;
      const fg = FL.parts.map((p) => partGeometry(p, false));
      const strip = (g) => { for (const k of ['aFlow', 'aSurf', 'aLw', 'aBend', 'uv']) if (g.attributes[k]) g.deleteAttribute(k); return g; };
      const slabG = new THREE.BoxGeometry(84, 6, 230).translate(0, 3, 0);
      const base = mergeGeometries([...fg.filter((g, k) => k !== 3 && k !== 4).map(strip), strip(slabG)], false);   // ears left off; the shadows are instances of the light shadow mould (body, neck, head and legs)
      fg.forEach((g) => g.dispose()); slabG.dispose(); await Y();
      const ranks = [   // centre [x, z], along [x, z], facing [x, z], count, spacing, scale
        { c: [120, 1290], al: [1, 0], fc: [-0.12, -1], n: 3, sp: 420, sc: 1.12 },
        { c: A(1360), al: [DX, 0, DZ], fc: [DZ, 0, -DX], n: 2, sp: 720, sc: 1.12 },   // either side of the camel's outline, never behind it
        { c: [HORSE_O[0] - DX * 1150, HORSE_O[2] - DZ * 1150], al: [DZ, -DX], fc: [DX, DZ], n: 3, sp: 340, sc: 1.1 },
        { c: [HORSE_O[0] + DZ * 560 + DX * 40, HORSE_O[2] - DX * 560 + DZ * 40], al: [DX, DZ], fc: [-DZ, DX], n: 3, sp: 250, sc: 0.95 },   // out on the sunlit side, against the sun as we come out from under the belly
        // and a rank against the sun itself, beyond the rump: as we come out between the hind legs the low sun stands between two of them
        { c: [HW(-276, 0, -595).x, HW(-276, 0, -595).z], al: [-0.74 * DZ + 0.67 * DX, 0.74 * DX + 0.67 * DZ], fc: [-0.95 * DZ - 0.3 * DX, 0.95 * DX - 0.3 * DZ], n: 3, sp: 260, sc: 1.05 },
      ];
      const figs = [], M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), T = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
      for (const r of ranks) {
        const cx = r.c[0], cz = r.c.length === 3 ? r.c[2] : r.c[1], ax = r.al[0], az = r.al.length === 3 ? r.al[2] : r.al[1], fx = r.fc[0], fz = r.fc.length === 3 ? r.fc[2] : r.fc[1];
        for (let i = 0; i < r.n; i++) {
          const t = (i - (r.n - 1) / 2) * r.sp + fr.range(-30, 30), back = fr.range(-60, 60), sc = r.sc * fr.range(0.9, 1.08), sd = fr.range(1, 90);
          const g = base.clone(), n = g.attributes.position.count, loc = new Float32Array(n * 4), P = g.attributes.position.array;
          for (let k = 0; k < n; k++) { loc[k * 4] = P[k * 3]; loc[k * 4 + 1] = P[k * 3 + 1]; loc[k * 4 + 2] = P[k * 3 + 2]; loc[k * 4 + 3] = sd; }
          g.setAttribute('aLoc', new THREE.BufferAttribute(loc, 4));
          const ry = Math.atan2(fx, fz) + fr.range(-0.12, 0.12); Q.setFromAxisAngle(UP, ry); S.setScalar(sc); T.set(cx + ax * t - fx * back, 0, cz + az * t - fz * back);
          M.compose(T, Q, S); g.applyMatrix4(M); figs.push(g);
          rankSh.push(T.x, T.z, ry, sc); rankFigs.push([T.x, T.z, 125 * sc]);
          await Y();
        }
      }
      for (const sp of spots) if (sp.tag === 'last') {
        const sd = fr.range(1, 90), g = base.clone(), n = g.attributes.position.count, loc = new Float32Array(n * 4), P = g.attributes.position.array;
        for (let k = 0; k < n; k++) { loc[k * 4] = P[k * 3]; loc[k * 4 + 1] = P[k * 3 + 1]; loc[k * 4 + 2] = P[k * 3 + 2]; loc[k * 4 + 3] = sd; }
        g.setAttribute('aLoc', new THREE.BufferAttribute(loc, 4));
        Q.setFromAxisAngle(UP, Math.atan2(sp.face[0], sp.face[1])); S.setScalar(PS); T.set(sp.pos[0], 0, sp.pos[1]); M.compose(T, Q, S); g.applyMatrix4(M); figs.push(g);
        rankSh.push(T.x, T.z, Math.atan2(sp.face[0], sp.face[1]), PS);
      }
      await Y(); const farA = mergeGeometries(figs.slice(0, 7), false); await Y(); const farB = mergeGeometries(figs.slice(7, 14), false); await Y(); const farC = mergeGeometries(figs.slice(14), false); await Y();
      const farGeo = mergeGeometries([farA, farB, farC], false); farA.dispose(); farB.dispose(); farC.dispose(); await Y();
      figs.forEach((g) => g.dispose()); base.dispose();
      await Y();
      const far = new THREE.Mesh(farGeo, new THREE.ShaderMaterial({ uniforms: { ...style }, vertexShader: FAR_VERT, fragmentShader: FAR_FRAG }));
      far.frustumCulled = false; far.name = 'glaze-far-ranks'; scene.add(far);
    }
    await Y();

    // ---- floor, sky ----
    const FAR = 7000;
    const floorMat = new THREE.ShaderMaterial({ uniforms: { ...style, uFloorLit: { value: floorLit }, uFloorTint: { value: floorTint } }, vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(6400, 64).rotateX(-Math.PI / 2), floorMat);
    floor.position.set(-263.7, 0, 517.3);   // off the entry: a fan's centre vertex exactly beside the level entry camera has w = 0 and the whole fan can drop out
    floor.renderOrder = -1; floor.frustumCulled = false; scene.add(floor);
    const skyMat = new THREE.ShaderMaterial({ uniforms: { ...style, uSunSize: { value: 0.066 }, uSunVis: { value: sunVis }, uSkyDeep: { value: skyDeep } }, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false });
    const sky = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 4), skyMat); sky.renderOrder = -2; sky.frustumCulled = false; scene.add(sky);
    // shadows lie on the floor: drawn straight after it without a depth test, so they never fight it at a distance
    scene.traverse((o) => { if (o.isMesh && o.renderOrder === -0.5) { o.material.depthTest = false; o.material.polygonOffset = false; } });
    await Y();

    // ---- the retinue in ranks: like animals on their slabs, rank behind rank; no hoof leaves its slab ----
    // Two light moulds thinned from the far-rank lofts (A: ponies and horses the way passes; B: the ranks far out), instanced:
    // iPos = x, z, turn, scale ; iDat = seed, place in the rank (the toss runs down it), rate, 0. Shadows: two lighter moulds.
    const rankNear = [];   // [x, z, turn, scale] of the figures the way passes: drops of glass lie round their slabs
    {
      const rr = rng.fork('ranks'), SLAB = [70, 7.5, 150];
      const geoA = rankMould(rankParts, [[8, 10], [8, 6], [8, 8], [2, 4], [2, 4], [4, 5], [4, 5], [4, 5], [4, 5]], SLAB);
      const geoB = rankMould(rankParts, [[7, 7], [4, 6], [5, 5], null, null, [3, 4], [3, 4], [3, 4], [3, 4]], SLAB);
      const geoS = rankMould(rankParts, [[8, 4], [4, 4], [4, 4], null, null, [2, 3], [2, 3], [2, 3], [2, 3]], null);
      const geoT = rankMould(rankParts, [[4, 3], [2, 3], [2, 3], null, null, [1, 3], [1, 3], [1, 3], [1, 3]], null);
      await Y();
      const keep = [[HORSE_O[0], HORSE_O[2], 128], [A(CAMEL_S)[0], A(CAMEL_S)[2], 112], ...spots.map((s) => [s.pos[0], s.pos[1], 17]), ...rankFigs];
      const inst = { A: { p: [], d: [] }, B: { p: [], d: [] } };
      // a rank: centre c, along al, facing fc (all of a rank face one way), n figures sp apart, scale sc, mould lod
      const rank = (c, al, fc, n, sp, sc, lod, o = {}) => {
        const al2 = Math.hypot(al[0], al[1]), ax = al[0] / al2, az = al[1] / al2, ry = Math.atan2(fc[0], fc[1]), rate = rr.range(0.8, 1.25), ph0 = rr.range(0, 20);
        for (let i = 0; i < n; i++) {
          const t = (i - (n - 1) / 2) * sp + (o.ds ? o.ds(i) : 0), x = c[0] + ax * t, z = c[1] + az * t, s = sc * rr.range(0.97, 1.04), turn = ry + rr.range(-0.04, 0.04), seed = rr.range(1, 90), reach = 84 * s;
          if (o.skip && o.skip(i)) continue;
          if (keep.some((k) => Math.hypot(k[0] - x, k[1] - z) < k[2] + reach + 6)) continue;
          keep.push([x, z, reach]);
          inst[lod].p.push(x, z, turn, s); const kr2 = rr(); inst[lod].d.push(seed, ph0 + i * 0.85, rate, lod === 'B' ? (kr2 < 0.8 ? 0 : 1) : (kr2 < 0.55 ? 0 : kr2 < 0.82 ? 1 : 2));
          if (lod === 'A') rankNear.push([x, z, turn, s]);
        }
      };
      const dA = [DZ, -DX], back = [-DZ, DX];   // down the avenue toward the eye that comes up it; and up it
      // the avenue: a file of ponies either side outside the pairs, and a file of horses twice their height behind them
      for (const sd of [1, -1]) {
        { const a0 = A(24 + 58 * 7, 0, sd * 46); rank([a0[0], a0[2]], back, dA, 15, 58, PS, 'A', { skip: (i) => i === 0 || (sd > 0 && i === 6), ds: (i) => (sd > 0 && i === 14 ? 30 : 0) }); }
        { const a0 = A(150 * 2.5 + (sd < 0 ? 75 : 0), 0, sd * 118); rank([a0[0], a0[2]], back, dA, 6, 150, 0.34, 'A', { skip: (i) => sd < 0 && i === 0 }); }
        { const a0 = A(150 + 300 * 1.5, 0, sd * 330); rank([a0[0], a0[2]], back, dA, 4, 300, 0.58, 'B'); }
      }
      await Y();
      // by the way in: ponies to either hand of the entry, and horses on the sunlit side of the great slab, turned as it is
      rank([-92, 96], back, [0.5, -0.87], 3, 52, PS, 'A');
      rank([212, 122], [0.75, 0.66], [-0.6, -0.8], 3, 55, PS, 'A');
      { const p = HW(-310, 0, -40); rank([p.x, p.z], [DX, DZ], [-DX, -DZ], 3, 100, 0.34, 'A'); }
      // a file of ponies leading out from behind the hind legs toward the rank against the sun, turned as that rank is: near, middle, far
      { const p = HW(-119, 0, -288), q = HW(-119 - 0.68, 0, -288 - 0.73); rank([p.x, p.z], [q.x - p.x, q.z - p.z], [-0.95 * DZ - 0.3 * DX, 0.95 * DX - 0.3 * DZ], 4, 62, PS, 'A'); }
      // far out round the whole floor: ranks of great horses facing in toward the tomb horse, paled by the dust
      const cl = [[-430, 1520, 3, 0.56], [640, 1480, 3, 0.5], [-190, 2150, 3, 0.62], [1380, 760, 3, 0.52], [1300, 60, 3, 0.48], [520, -900, 3, 0.5], [-560, -880, 3, 0.55], [-1820, 180, 3, 0.56], [-2050, 960, 3, 0.6],
        [...A(1750, 0, 330)], [...A(1880, 0, -360)], [...A(2250, 0, 60)], [...A(1250, 0, -760)], [...A(1150, 0, 820)]].map((c) => (c.length === 3 ? [c[0], c[2], 3, 0.55] : c));
      for (const c of cl) { const fx = -150 - c[0], fz = 480 - c[1], l = Math.hypot(fx, fz); rank([c[0], c[1]], [-fz, fx], [fx / l, fz / l], c[2], 330 * c[3], c[3], 'B'); }
      await Y();
      for (let i = 0; i < inst.A.p.length; i += 4) rankFigs.push([inst.A.p[i], inst.A.p[i + 1], 84 * inst.A.p[i + 3]]);
      const shT = rankSh.slice(), dT = new Array(rankSh.length).fill(0);
      for (let i = 0; i < inst.B.p.length; i++) { shT.push(inst.B.p[i]); dT.push(inst.B.d[i]); }
      const set = (g, p, d) => { g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(p), 4)); g.setAttribute('iDat', new THREE.InstancedBufferAttribute(new Float32Array(d), 4)); g.instanceCount = p.length / 4; return g; };
      set(geoA, inst.A.p, inst.A.d); set(geoB, inst.B.p, inst.B.d); set(geoS, inst.A.p, inst.A.d); set(geoT, shT, dT);
      const figMat = new THREE.ShaderMaterial({ uniforms: { ...style, uSh: { value: 0 } }, vertexShader: RANK_VERT, fragmentShader: RANK_FRAG, side: THREE.DoubleSide });
      const shMat = new THREE.ShaderMaterial({ uniforms: { ...style, uSh: { value: 1 } }, vertexShader: RANK_VERT, fragmentShader: RANK_SH_FRAG, side: THREE.DoubleSide, depthTest: false });
      for (const [g, m, ro, nm] of [[geoS, shMat, -0.5, 'glaze-rank-shadows'], [geoT, shMat, -0.5, 'glaze-far-shadows'], [geoA, figMat, 0, 'glaze-ranks'], [geoB, figMat, 0, 'glaze-ranks-far']]) {
        const mesh = new THREE.Mesh(g, m); mesh.renderOrder = ro; mesh.frustumCulled = false; mesh.name = nm; scene.add(mesh);
      }
    }
    await Y();

    // ---- spatter: fallen drops, thick round every slab, gone 60 m out ----
    const spat = [];
    const ringOf = (cx, cz, rot, hw, hd, reach, n, big) => {
      const c = Math.cos(rot), s = Math.sin(rot);
      for (let i = 0; i < n; i++) {
        const e = reach * Math.pow(rng(), 1.7) + 0.5, t = rng() * 2 * (hw + hd); let x, z;
        if (t < 2 * hw) { x = t - hw; z = (rng() < 0.5 ? -1 : 1) * (hd + e); } else { z = t - 2 * hw - hd; x = (rng() < 0.5 ? -1 : 1) * (hw + e); }
        if (rng() < 0.3) { x += Math.sign(x) * e * 0.5; z += Math.sign(z) * e * 0.5; }
        const r = (0.12 + 1.4 * Math.pow(rng(), 2.2)) * big * (1 - 0.5 * e / reach);
        spat.push(cx + c * x + s * z, cz - s * x + c * z, r, rng(), rng() < 0.62 ? 0 : (rng() < 0.75 ? 1 : 2));
      }
    };
    const nSp = (n) => Math.round(n * detail * density);
    ringOf(HORSE_O[0], HORSE_O[2], HORSE_ROT, 42, 115, 60, nSp(640), 1.5);
    { const c = A(CAMEL_S); ringOf(c[0], c[2], CAMEL_ROT, 40, 95, 60, nSp(480), 1.4); }
    for (const sp of spots) ringOf(sp.pos[0], sp.pos[1], Math.atan2(sp.face[0], sp.face[1]), 7, 15, 26, nSp(sp.tag === 'entry' ? 110 : 64), 1);
    ringOf(HORSE_O[0], HORSE_O[2], HORSE_ROT, 42, 115, 16, nSp(46), 6.5);                       // pooled runs at the foot of the great slabs
    { const c = A(CAMEL_S); ringOf(c[0], c[2], CAMEL_ROT, 40, 95, 16, nSp(36), 6); }
    for (const sp of spots) ringOf(sp.pos[0], sp.pos[1], Math.atan2(sp.face[0], sp.face[1]), 7, 15, 5, 5, 3.2);
    for (const f of rankNear) { const k = f[3] / PS; ringOf(f[0], f[1], f[2], 7 * k, 15 * k, 22 * k, nSp(12), k); ringOf(f[0], f[1], f[2], 7 * k, 15 * k, 5 * k, 3, 3 * k); }   // and round every slab of the ranks
    for (let i = 0; i < nSp(160); i++) spat.push(rng.range(-16, 16), rng.range(4, 150), 0.15 + 1.1 * Math.pow(rng(), 2), rng(), rng() < 0.6 ? 0 : 1);
    {  // drops and pooled runs under the way in: across the horse's front, and up its axis to the slab
      const sr2 = rng.fork('way-spatter'), drop = (x, z, big) => spat.push(x, z, big ? sr2.range(2.6, 6.5) : 0.25 + 2.1 * Math.pow(sr2(), 2), sr2(), sr2() < 0.6 ? 0 : (sr2() < 0.75 ? 1 : 2));
      for (let i = 0; i < nSp(210); i++) drop(sr2.range(-215, -20), sr2.range(88, 215), i % 14 === 0);
      for (let i = 0; i < nSp(200); i++) { const z = sr2.range(118, 300), x = sr2.range(-34, 34) * (1 + (z - 118) / 260), hx = 41 - 0.867 * x - 0.4983 * z, hz = 471 + 0.4983 * x - 0.867 * z; drop(hx, hz, i % 12 === 0); }
      for (let i = 0; i < nSp(200); i++) { const p = A(sr2.range(40, 560), 0, sr2.range(-13, 13)); drop(p[0], p[2], i % 16 === 0); }
      for (let i = 0; i < nSp(220); i++) { const p = A(sr2.range(560, CAMEL_S - 46), 0, sr2.range(-16, 16)); drop(p[0], p[2], i % 12 === 0); }   // on to the camel's slab
      for (let i = 0; i < nSp(340); i++) { const t = sr2.range(20, 400), o = sr2.range(-70, 70) * (0.35 + t / 300), p = HW(-12 - 0.67 * t + 0.74 * o, 0, -118 - 0.74 * t - 0.67 * o); drop(p.x, p.z, i % 9 === 0); }   // out behind the hind legs, toward the sun
    }
    {
      const n = spat.length / 5, g = new THREE.InstancedBufferGeometry(), pos = [0, 0, 0], idx = [], K = 6;
      for (let j = 0; j < K; j++) { const a = j / K * Math.PI * 2; pos.push(Math.cos(a), 0, Math.sin(a)); idx.push(0, 1 + (j + 1) % K, 1 + j); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const ip = new Float32Array(n * 4), ic = new Float32Array(n);
      for (let i = 0; i < n; i++) { ip[i * 4] = spat[i * 5]; ip[i * 4 + 1] = spat[i * 5 + 1]; ip[i * 4 + 2] = spat[i * 5 + 2]; ip[i * 4 + 3] = spat[i * 5 + 3]; ic[i] = spat[i * 5 + 4]; }
      g.setAttribute('iPos', new THREE.InstancedBufferAttribute(ip, 4)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(ic, 1)); g.instanceCount = n;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...style }, vertexShader: SPAT_VERT, fragmentShader: SPAT_FRAG, depthTest: false }));
      m.renderOrder = -0.4; m.frustumCulled = false; scene.add(m);
    }
    await Y();

    // ---- kiln furniture: spurs left where they fell, by the slabs and along the way ----
    {
      const sr = rng.fork('spurs'), parts = [];
      for (let k = 0; k < 3; k++) {
        const a = k / 3 * Math.PI * 2;
        const arm = new THREE.ConeGeometry(0.2, 1.05, 4, 1, false).rotateZ(-Math.PI / 2).translate(0.5, 0.17, 0).rotateY(a);
        const spike = new THREE.ConeGeometry(0.15, 0.62, 4, 1, true).translate(0.92, 0.5, 0).rotateY(a);
        parts.push(arm, spike);
      }
      const sg = mergeGeometries(parts, false); parts.forEach((g) => g.dispose()); sg.deleteAttribute('uv');
      const list = [];
      const near = (cx, cz, rot, hw, hd, n, s0, s1) => { const c = Math.cos(rot), sn = Math.sin(rot);
        for (let i = 0; i < n; i++) { const e = 4 + 46 * Math.pow(sr(), 1.5), t = sr() * 2 * (hw + hd); let x, z;
          if (t < 2 * hw) { x = t - hw; z = (sr() < 0.5 ? -1 : 1) * (hd + e); } else { z = t - 2 * hw - hd; x = (sr() < 0.5 ? -1 : 1) * (hw + e); }
          list.push(cx + c * x + sn * z, cz - sn * x + c * z, sr.range(s0, s1), sr() * 6.283); } };
      const nS = (n) => Math.round(n * (0.5 + 0.5 * detail));
      near(HORSE_O[0], HORSE_O[2], HORSE_ROT, 42, 115, nS(26), 3, 8.5);
      { const c = A(CAMEL_S); near(c[0], c[2], CAMEL_ROT, 40, 95, nS(20), 3, 8); }
      for (const sp of spots) near(sp.pos[0], sp.pos[1], Math.atan2(sp.face[0], sp.face[1]), 7, 15, sp.tag === 'entry' ? 5 : 3, 1.6, 4);
      for (let i = 0; i < nS(14); i++) { const sd = sr.sign(); list.push(sd * sr.range(17, 44), sr.range(60, 250), sr.range(1.8, 5), sr() * 6.283); }      // beside the way in
      for (let i = 0; i < nS(8); i++) { const p = A(sr.range(0, 900), 0, sr.sign() * sr.range(29, 34)); list.push(p[0], p[2], sr.range(2, 6), sr() * 6.283); }   // outside the avenue
      const n = list.length / 4, g = new THREE.InstancedBufferGeometry(); g.index = sg.index; g.setAttribute('position', sg.attributes.position); g.setAttribute('normal', sg.attributes.normal);
      g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(list), 4)); g.instanceCount = n;
      const mk = (sh) => new THREE.ShaderMaterial({ uniforms: { ...style, uSh: { value: sh } }, vertexShader: SPUR_VERT, fragmentShader: SPUR_FRAG, side: THREE.DoubleSide, depthTest: !sh });
      const sp2 = []; for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2;
        sp2.push(new THREE.ConeGeometry(0.2, 1.05, 3, 1, true).rotateZ(-Math.PI / 2).translate(0.5, 0.17, 0).rotateY(a), new THREE.ConeGeometry(0.15, 0.62, 3, 1, true).translate(0.92, 0.5, 0).rotateY(a)); }
      const sgS = mergeGeometries(sp2, false); sp2.forEach((x) => x.dispose()); sgS.deleteAttribute('uv');
      const gS = new THREE.InstancedBufferGeometry(); gS.index = sgS.index; gS.setAttribute('position', sgS.attributes.position); gS.setAttribute('normal', sgS.attributes.normal);
      gS.setAttribute('iPos', g.attributes.iPos); gS.instanceCount = n;
      const shd = new THREE.Mesh(gS, mk(1)); shd.renderOrder = -0.45; shd.frustumCulled = false; scene.add(shd);
      const spr = new THREE.Mesh(g, mk(0)); spr.frustumCulled = false; scene.add(spr);
    }
    await Y();

    // ---- the light in the vent ----
    const glowU = { ...style, uC: { value: CW(-26, 43, 0) }, uOutDir: { value: new THREE.Vector3(-0.7071, -0.7071, 0).transformDirection(camel.group.matrixWorld) }, uR: { value: 50 }, uGlow: { value: 1 } };
    style.uVent.value.set(CW(-22, 38, 0).x, 38, CW(-22, 38, 0).z, 0.8); style.uVentR.value = 100;   // and what it lights: belly, legs, slab, the floor before it
    {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: glowU, vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false }));
      m.renderOrder = 4; m.frustumCulled = false; scene.add(m);
    }
    const haloU = { ...style, uC: { value: CW(230, 84, 0) }, uR: { value: 340 }, uGlow: { value: 0 } };
    {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: haloU, vertexShader: HALO_VERT, fragmentShader: HALO_FRAG, transparent: true, depthWrite: false }));
      m.renderOrder = 3; m.frustumCulled = false; m.name = 'glaze-kiln-light'; scene.add(m);
    }
    await Y();

    // ---- dust motes ----
    const dustU = { ...style, uCam: { value: new THREE.Vector3() }, uPx: { value: 0.002 } };
    {
      const n = Math.round(2100 * detail), g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const sd = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) sd[i] = rng();
      g.setAttribute('iSeed', new THREE.InstancedBufferAttribute(sd, 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: dustU, vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false }));
      m.renderOrder = 5; m.frustumCulled = false; scene.add(m);
    }
    await Y();

    // ---- the flight ----
    const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
    // The brief's journey, leg by leg (horse-local HW: +Z toward the head, +X toward the avenue and the camel, the sun on the
    // -X flank and the rump; camel-local CW: +Z toward its head):
    // in between the entry ponies and round onto the horse's axis; under the hanging muzzle and between the forelegs at y 30, the
    // glaze line 8 m over the lens, the chest bead above; under the belly and out between the hind legs, on toward the low sun
    // where a rank of the retinue stands against it; a climbing teardrop round to the left on the sunlit side, the whole horse in
    // profile in full sun; in over the croup from behind, along the saddle and the cut mane on the shade side, the horse's shadow
    // across the head of the avenue below; past the ears and round before the hanging head, down the face racing the green
    // pour; out under the chin into the avenue, low, between the pairs; the camel at its end; between its legs and up into the vent.
    const pts = [
      // in between the entry ponies' ground, then wide across the horse's front (the eye held on it, the sun behind it), and round onto its axis
      V3([0, 16, 0]), V3([0, 16, 34]), V3([0, 16, 68]), V3([60, 17, 104]), V3([112, 18.5, 152]), V3([108, 20, 214]),
      // a slow low arc right across its front, under the hanging head, the eye held on it: the horse whole and towering over us, front
      // three-quarter and then head-on, the pony by its slab for measure; out to the shade side and back round onto its axis
      HW(-150, 15, 250), HW(-88, 12, 264), HW(-16, 12, 256), HW(58, 12, 244), HW(116, 12.5, 200), HW(93, 13, 153), HW(30, 12.5, 170),
      // down its axis, LOW before the slab: the hooves on the slab below, the two bare legs as pillars, the line across them
      HW(-26, 12, 156), HW(-12, 12.5, 122), HW(0, 17.5, 88), HW(0, 23, 60), HW(0, 30, 26), HW(0, 34, -8), HW(0, 32, -40), HW(0, 30, -68),
      // out between the hind legs and on, low, toward the sun: the far rank of the retinue stands against it, their shadows and the
      // glass drops' lying toward us across the floor
      HW(-6, 26, -100), HW(-34, 21, -138), HW(-76, 18, -170),
      // the teardrop, climbing round to the left on the sunlit side: the whole horse in profile in full sun, its shadow raking away
      // beyond it; then in over the croup from the sunlit side and across to the shade side behind the saddle: the knotted cloth and
      // the cut mane a near landscape of glaze to starboard, the horse's long shadow lying across the head of the avenue below to port
      HW(-134, 30, -194), HW(-186, 58, -162), HW(-204, 96, -110), HW(-178, 136, -68), HW(-116, 174, -82), HW(-64, 200, -126), HW(-22, 204, -170),
      HW(10, 201, -152), HW(18, 199, -110), HW(30, 194, -30), HW(45, 184, 60),
      // along the shade side of the neck, past the ears, and round before the hanging head in one falling turn, the green pour racing
      // us down the face; in under the chin
      HW(66, 174, 128), HW(74, 167, 168), HW(54, 150, 208), HW(10, 128, 214), HW(-22, 100, 196), HW(-24, 76, 166),
      HW(4, 60, 158), HW(40, 44, 172), HW(86, 28, 170),
      // the avenue, low, between the pairs
      V3(A(28, 18, 0)), V3(A(96, 13, 0)), V3(A(164, 12.5, 0)), V3(A(232, 12, 0)), V3(A(300, 13, 0)), V3(A(368, 14, 0)), V3(A(436, 18, 0)), V3(A(504, 18, 0)), V3(A(572, 12.5, 0)), V3(A(640, 12.5, 0)),
      V3(A(708, 15, 0)), V3(A(776, 17, 0)), V3(A(846, 16, 0)),
      // in under the camel's flank, between its fore and hind legs, and the last 52 m dead straight, 45 degrees up, into the vent
      CW(-84, 14, 0), CW(-64, 19.5, 0), CW(-46.67, 22.33, 0), CW(-9.9, 59.1, 0),
    ];
    await Y();
    const path = makePath(pts);
    await Y();
    // ---- pass spatter: fallen drops under the whole route. Wherever the route flies lower than 120 m, every 50 m of it has at least
    // 60 drops (at full detail) within 40 m either side of its line on the floor: the thinnest of the stretches that were thick
    // already. A stretch with fewer is made up to that by the way-spatter's own rule of size and colour (one in twelve a pooled run),
    // on a stream of its own, after every draw above. Drops lie where they fell, on the floor, or on the great slab under the horse
    // ("drops fall on the slab"); none on a small slab, none under a hoof. ----
    {
      const rect = (cx, cz, rot, hw, hd) => ({ cx, cz, c: Math.cos(rot), s: Math.sin(rot), hw, hd });
      const S = { pr: ctx.core.makeRng(ctx.core.hashSeed('glaze-stops-at-the-knees: pass spatter:' + ctx.seed)), want: Math.round(60 * detail), grid: new Map(), laid: 0, onFloor: [], onSlab: [],
        small: [rect(A(CAMEL_S)[0], A(CAMEL_S)[2], CAMEL_ROT, 40, 95), ...spots.map((sp) => rect(sp.pos[0], sp.pos[1], Math.atan2(sp.face[0], sp.face[1]), 7, 15)), ...rankNear.map((f) => rect(f[0], f[1], f[2], 35 * f[3], 75 * f[3]))],
        HI: hero.object.matrixWorld.clone().invert().elements, top: null };
      for (let i = 0; i < spat.length; i += 5) passPut(S.grid, spat[i], spat[i + 1]);
      { let hg = null; hero.object.traverse((o) => { if (o.isMesh && o.material === hero.material) hg = o.geometry; }); S.top = slabTop(hg); }   // the top of the great slab, as it was warped
      await Y();
      const q = new THREE.Vector3();
      for (let d0 = 0, n = 0; d0 < path.length; d0 += 50, n++) {
        if (n % 6 === 5) await Y();
        const low = []; for (let d = d0; d <= Math.min(path.length, d0 + 50); d += 2.5) { path.posAtDist(d, q); if (q.y < 120) low.push(d, q.x, q.z); }
        if (low.length >= 6) passStretch(S, low);
      }
      await Y();
      const fan = [0, 0, 0], idx = [], K = 6; for (let j = 0; j < K; j++) { const a = j / K * Math.PI * 2; fan.push(Math.cos(a), 0, Math.sin(a)); idx.push(0, 1 + (j + 1) % K, 1 + j); }
      for (const [list, slab] of [[S.onFloor, false], [S.onSlab, true]]) {
        const n = list.length / 6, g = new THREE.InstancedBufferGeometry(), ip = new Float32Array(n * 4), ic = new Float32Array(n), ih = new Float32Array(n);
        g.setAttribute('position', new THREE.Float32BufferAttribute(fan, 3)); g.setIndex(idx);
        for (let i = 0; i < n; i++) { ip.set(list.slice(i * 6, i * 6 + 4), i * 4); ic[i] = list[i * 6 + 4]; ih[i] = list[i * 6 + 5]; }
        g.setAttribute('iPos', new THREE.InstancedBufferAttribute(ip, 4)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(ic, 1)); g.setAttribute('iH', new THREE.InstancedBufferAttribute(ih, 1)); g.instanceCount = n;
        const vs = SPAT_VERT.replace('attribute vec4 iPos;', 'attribute vec4 iPos; attribute float iH;').replace('vec4 w = vec4(iPos.x + l.x*iPos.z, .05 +', 'vec4 w = vec4(iPos.x + l.x*iPos.z, iH + .05 +');
        const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...style }, vertexShader: vs, fragmentShader: SPAT_FRAG, depthTest: slab, polygonOffset: slab, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
        m.renderOrder = slab ? 0 : -0.4; m.frustumCulled = false; m.name = slab ? 'glaze-pass-spatter-slab' : 'glaze-pass-spatter'; scene.add(m);
      }
    }
    await Y();
    const uNear = (p, a, b) => { let best = 1e18, bu = a; const q = new THREE.Vector3(); for (let i = 0; i <= 360; i++) { const u = a + (b - a) * i / 360; const d = path.pointAt(u, q).distanceToSquared(p); if (d < best) { best = d; bu = u; } } return bu; };
    const uFore = uNear(HW(0, 30, 60), 0.05, 0.4); await Y();
    const uHind = uNear(HW(0, 30, -68), 0.1, 0.5); await Y();
    const uSun = uNear(HW(-76, 18, -170), 0.1, 0.6); await Y();
    const uTear = uNear(HW(-204, 96, -110), 0.1, 0.6); await Y();
    const uFlank = uNear(HW(-178, 136, -68), 0.15, 0.6); await Y();
    const uCroup = uNear(HW(-64, 200, -126), 0.2, 0.7); await Y();
    const uSaddle = uNear(HW(14, 200, -132), 0.3, 0.7); await Y();
    const uMane = uNear(HW(45, 184, 60), 0.3, 0.7); await Y();
    const uPoll = uNear(HW(66, 174, 128), 0.3, 0.8); await Y();
    const uFront = uNear(HW(74, 167, 168), 0.4, 0.8); await Y();
    const uFace = uNear(HW(-22, 100, 196), 0.4, 0.8); await Y();
    const uMuzzle = uNear(HW(4, 60, 158), 0.4, 0.8); await Y();
    const uPull = uNear(HW(40, 44, 172), 0.4, 0.9); await Y();
    const uBend = uNear(V3(A(708, 19.5, 0)), 0.6, 1); await Y();
    for (const p of ponies) { p.uAt = p.tag === 'entry' ? 0.02 : uNear(V3([p.pos[0], 18, p.pos[1]]), 0.5, 1); await Y(); }
    await Y(); const swingP = ponies.find((p) => p.tag === 'swing'), uSwing = uNear(V3([swingP.pos[0] + swingP.face[0] * 24, 18, swingP.pos[1] + swingP.face[1] * 24]), 0.5, 1);
    await Y(); const uCamel = uNear(CW(-64, 19.5, 0), 0.8, 1); await Y();
    const uAxis = uNear(CW(-200, 16, 0), 0.8, 1); await Y();
    const g1 = (u, c, w) => Math.exp(-((u - c) * (u - c)) / (w * w));
    // linger before the forelegs, hurry the turn, linger at the saddle, hurry the pull-out, linger by the pony that swings its head out
    const pace = (u) => 1 - 0.45 * g1(u, uFore - 0.03, 0.035) + 0.35 * g1(u, uTear, 0.04) - 0.15 * g1(u, uSun, 0.03) - 0.2 * g1(u, uSaddle, 0.04) + 0.3 * g1(u, uFace, 0.03) + 0.2 * g1(u, uPull + 0.01, 0.03) - 0.2 * g1(u, uSwing, 0.03);
    const tgt = new THREE.Vector3();
    // the eye: one keyed target that moves with u (the engine turns the gaze from the heading toward it by the poi's weight)
    const eyeKeys = [
      [uFore - 0.05, HW(0, 50, 50)], [uFore - 0.008, HW(0, 66, 30)], [uFore + 0.012, HW(0, 52, -68)], [uHind - 0.012, HW(0, 46, -160)], [uHind + 0.012, HW(-200, 60, -330)], [uSun, HW(-390, 74, -500)], [uSun + 0.016, HW(-330, 70, -470)],
      [uTear - 0.03, HW(-40, 90, -130)], [uTear, HW(0, 96, -6)], [uFlank, HW(0, 88, 0)], [uCroup, HW(40, 130, 30)], [uSaddle - 0.012, HW(76, 102, 142)], [uSaddle + 0.006, HW(76, 102, 142)], [uMane, HW(8, 168, 112)], [uPoll, HW(0, 156, 122)],
      [uFront, HW(0, 150, 122)], [uFront + 0.012, HW(0, 132, 122)], [uFace, HW(0, 120, 124)], [uMuzzle - 0.012, HW(0, 98, 128)], [uMuzzle + 0.012, HW(140, 30, 160)], [uPull + 0.02, CW(0, 84, 8)],
    ];
    const pois = [
      { at: HW(0, 90, 62), from: 0.0, to: uFore - 0.03, weight: 0.95, fade: 0.15 },                      // the approach: the horse whole on its slab
      { at: (time, u) => { const keys = eyeKeys; let i = 0; while (i < keys.length - 2 && u > keys[i + 1][0]) i++;
        const k0 = keys[i], k1 = keys[i + 1]; return tgt.copy(k0[1]).lerp(k1[1], smoothstep(k0[0], k1[0], u)); },
        from: uFore - 0.06, to: uPull + 0.03, weight: 0.93, fade: 0.08 },
      { at: V3(A(AV_S[0] + 44, 21, 12)), from: uPull - 0.01, to: uPull + 0.05, weight: 0.5, fade: 0.35 },                 // onto the first pony of the street as we come out from under the chin
      { at: CW(0, 92, 16), from: uPull - 0.01, to: uAxis + 0.01, weight: 0.6, fade: 0.2 },
      { at: V3([swingP.pos[0] + swingP.face[0] * 20 + swingP.face[1] * 8.7, 19, swingP.pos[1] + swingP.face[1] * 20 - swingP.face[0] * 8.7]), from: uSwing - 0.05, to: uSwing + 0.03, weight: 0.62, fade: 0.3 },                                      // the camel at the avenue's end
      { at: CW(-4, 74, 12), from: uAxis - 0.05, to: 0.99, weight: 0.85, fade: 0.25 },                           // in along its axis: the forelegs, the line, the vent
    ];
    const uBeats = { uFore, uHind, uSun, uTear, uFlank, uCroup, uFront, uSaddle, uMane, uPoll, uFace, uMuzzle, uPull, uSwing, uBend, uAxis, uCamel, length: path.length, camelS: CAMEL_S, camelPhi: CAMEL_PHI };

    const camPos = new THREE.Vector3(), size = new THREE.Vector2(), heroPose = hero.material.uniforms.uPose.value;
    const bump = (x) => { const t = clamp(1 - Math.abs(x), 0, 1); return t * t * (3 - 2 * t); };
    return {
      scene, path, duration: 56, pace,
      camera: { fov: 70, near: 0.4, far: FAR, lookAhead: 24, sway: 0.4, bank: 0.12 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#C9812A', veil: '#C9812A', glow: 0.1, tilt: true, revealDistance: 640, blendDistance: 50 },
      post: { exposure: EXPOSURE, bloom: { strength: 0, radius: 0.5, threshold: 8 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0.2, grain: 0.012, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none', beats: uBeats,   // beats: where the moments fell on this path (read by the crew's shot scripts only)
      update(dt, time, camera, u) {
        hero.setProgress(u); hero.update(dt, time);
        style.uVent.value.w = 0.72 * (0.9 + 0.1 * Math.sin(time * 1.3));
        haloU.uGlow.value = smoothstep(uPull - 0.05, uPull + 0.015, u);   // the kiln's light stands in the dust once we turn into the avenue
        style.uPour.value = clamp((u - (uFace - 0.075)) / (uMuzzle + 0.02 - (uFace - 0.075)), 0, 1);   // the pour's front runs ahead of the dive and waits at the muzzle
        heroPose.x += 0.05 * Math.sin(time * 0.55); heroPose.y += 0.05 * Math.sin(time * 0.41 + 1);   // the horse shifts its tucked head
        camPos.setFromMatrixPosition(camera.matrixWorld);
        dustU.uCam.value.copy(camPos);
        ctx.renderer.getDrawingBufferSize(size);
        dustU.uPx.value = 2 * Math.tan((camera.fov || 62) * Math.PI / 360) / Math.max(size.y, 1);
        for (const p of ponies) {
          const amb = 0.03 * Math.sin(time * 0.5 * p.rate + p.ph) + 0.02 * Math.sin(time * 1.3 * p.rate + p.ph * 2);
          const shake = Math.pow(Math.max(0, Math.sin(time * 0.37 * p.rate + p.ph)), 10);
          const big = p.tag === 'entry' ? 2.2 : 1;
          let toss = amb - 0.1 * big * shake - (big - 1) * 0.06 * Math.sin(time * 0.9 * p.rate + p.ph), swing = 0.06 * big * Math.sin(time * 0.6 * p.rate + p.ph * 1.7) + 0.12 * shake * Math.sin(time * 7 * p.rate);
          if (p.tag !== 'entry') { const w = bump((u - (p.uAt - 0.05)) / 0.03); toss -= 0.34 * w; swing += 0.1 * w * Math.sin(time * 5.5 + p.ph); }
          if (p.tag === 'swing') { const w = smoothstep(uSwing - 0.07, uSwing - 0.02, u) * (1 - smoothstep(uSwing + 0.012, uSwing + 0.04, u)); swing = swing * (1 - w) + 0.78 * w; toss = toss * (1 - w) + 0.05 * w; }
          p.pose.set(toss, swing, 0.5 + 0.5 * Math.sin(time * 0.9 * p.rate + p.ph), Math.pow(Math.max(0, Math.sin(time * 0.7 * p.rate + p.ph * 3)), 24));
        }
        const B = smoothstep(uCamel - 0.17, uCamel - 0.13, u) * (1 - smoothstep(uCamel - 0.035, uCamel - 0.005, u)), B0 = 0.25 * smoothstep(uPull, uPull + 0.08, u);
        camel.pose.set(-0.02 * Math.sin(time * 0.4) - 0.05 * B0 - 0.13 * B, 0.03 * Math.sin(time * 0.27), 0.5 + 0.5 * Math.sin(time * 0.8), -(0.2 + 0.15 * Math.sin(time * 0.7)) - 2.3 * B * (0.85 + 0.15 * Math.sin(time * 4.5)));
        camel.loadPose.set(0.012 * Math.sin(time * 1.1) + 0.05 * B * Math.sin(time * 3.1), 0.008 * Math.sin(time * 0.8), 0, 0);
      },
      dispose() {
        for (const m of moulds) m.object.traverse((o) => { if (o.isMesh) { if (o.material) o.material.dispose(); if (o.geometry) o.geometry.dispose(); } });
      },
    };
  },
};
