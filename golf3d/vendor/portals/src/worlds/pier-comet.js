// The Pier Comet: the last ride of the last night of summer, from the front car of a white wooden
// coaster on a seaside pier. Up the lift over a midway of mint, pink and white bulbs, down through
// the deck to skim the swell between the pilings, round over open sea, back over two airtime hills
// and at last through the empty centre of a hubless wheel (src/parts/pier-comet.js).
//
// World axes: +Z is west (seaward), +X is south, the promenade is z = 0, the hero wheel stands at
// (0, 0, 95) and the pier runs from z = 0 to 330 with its centreline at x = -50, deck 8 m up.
// Everything is shaded by this file's own ShaderMaterials (no three.js lights): hemisphere ambient,
// one rim/key term and bulb glow; the kit provides the sky dome, the sea and the gulls.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as F from '../kit/fauna.js';
import { buildHero, Geo } from '../parts/pier-comet.js';

const PAL = ['#0E1630', '#1E6A7A', '#4A2F7A', '#FFB59A', '#7FF0CF', '#FF7EB6', '#F6FBFF'];
const HERO_Z = 95, PIER_C = -50, PIER_N = -68, PIER_S = -32, PIER_L = 330, DECK = 8, TRACK_X = -35, SEA = 0.95;
// FORCE_TIDE: false = the tide is always out (the ring must stand on its reflection in the wet sand); true = always in;
// null = in on about one visit in five. The high tide is not finished (no mirror of the ring in the lagoon), so it stays off.
const RAIL_DROP = 1.3, DUR = 40, FORCE_TIDE = false;

// ---------- paint: every solid thing that is not the hero ----------
const PAINT_VS = /* glsl */`
attribute vec3 aCol; attribute vec3 aGlow; attribute float aFx;
uniform float uTime; uniform vec2 uRes;
varying vec3 vCol, vGlow, vN, vW, vL, vS; varying float vFx;
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal;
  vL = vec3(0.0); vS = vec3(1.0);
#ifdef USE_INSTANCING
  vL = position; vS = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  #ifndef PILE
  // thin timbers far away are widened to hold a pixel and a bit, so the lattice never breaks into sparkle
  float minW = 1.3*2.0*length(cameraPosition - (modelMatrix*vec4(instanceMatrix[3].xyz, 1.0)).xyz)/(uRes.y*projectionMatrix[1][1]);
  p *= mix(clamp(vec3(minW)/max(vS, vec3(1e-3)), vec3(1.0), vec3(8.0)), vec3(1.0), step(vec3(0.7), vS));
  #endif
  p = (instanceMatrix*vec4(p, 1.0)).xyz; n = mat3(instanceMatrix)*n;
  vGlow = vec3(0.0); vFx = 0.0;
  #ifdef USE_INSTANCING_COLOR
  vCol = instanceColor;
  #else
  vCol = vec3(0.7);
  #endif
  #ifdef PILE
  // a skirt of weed below the tide mark, swinging with the swell
  float sk = 1.0 - smoothstep(1.1, 3.0, p.y);
  vec2 rad = normalize(n.xz + vec2(1e-5, 0.0));
  p.xz += rad*sk*(0.09 + 0.07*sin(uTime*2.3 + p.y*3.0 + p.x*1.7 + p.z*2.3));
  p.xz += vec2(0.10, 0.17)*sk*sk*sin(uTime*1.1 + p.x*0.31 + p.z*0.17);
  vFx = 20.0;
  #endif
#else
  vCol = aCol; vGlow = aGlow; vFx = aFx;
  float fl = step(0.001, aFx)*step(aFx, 1.5);
  p.xz += fl*vec2(sin(uTime*5.3 + p.y*2.4 + aFx*40.0), sin(uTime*4.1 + p.x*3.0 + aFx*31.0))*0.11;
  p.y += fl*sin(uTime*6.1 + p.x*2.0 + p.z*2.0)*0.05;
  float bob = step(1.9, aFx)*step(aFx, 3.1);
  p.y += bob*sin(uTime*2.2 + aFx*17.0)*0.32;
#endif
  vec4 w = modelMatrix*vec4(p, 1.0);
  vN = normalize(mat3(modelMatrix)*n + vec3(0.0, 1e-5, 0.0));
#ifdef MIRROR
  w.y = -1.3*w.y; float dep = max(0.0, -w.y);
  w.x += sin(w.y*0.42 + uTime*1.6 + w.z*0.3)*0.02*min(dep, 22.0);
  vN.y = -vN.y;
#endif
  vW = w.xyz;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const PAINT_FS = /* glsl */`
uniform vec3 uSky, uGround, uRim, uRimDir, uPalA, uPalB, uPalC;
uniform float uTime, uFlash, uGlowK, uWaveZ, uWin;
varying vec3 vCol, vGlow, vN, vW, vL, vS; varying float vFx;
#include <fog_pars_fragment>
float h21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float boxAA(vec2 f, vec2 c, vec2 hs, vec2 aw){ vec2 d = abs(f - c) - hs; return (1.0 - smoothstep(-aw.x, aw.x, d.x))*(1.0 - smoothstep(-aw.y, aw.y, d.y)); }
void main(){
  vec3 N = normalize(vN);
  vec3 amb = mix(uGround, uSky, N.y*0.5 + 0.5)*(0.9 + 0.1*dot(N, vec3(0.41, 0.0, 0.91)));
  float rim = max(dot(N, uRimDir), 0.0); rim *= rim;
  float camD = length(vW - cameraPosition);
  // the pier's bulbs light whatever stands near them, in slow mint and pink pools
  float near = exp(-max(abs(vW.x + 50.0) - 18.0, 0.0)/30.0)*smoothstep(-40.0, 10.0, vW.z)*(1.0 - smoothstep(330.0, 430.0, vW.z))*exp(-max(abs(vW.y) - 30.0, 0.0)/30.0);
  float s = 0.5 + 0.5*sin(vW.z*0.09 + vW.y*0.13 + sin(vW.x*0.11)*2.0 + uTime*0.25);
  float lit = uGlowK*step(vW.z, uWaveZ);
  vec3 glow = (mix(mix(uPalA, uPalB, s), uPalC, 0.45)*(0.03 + 0.15*near) + vGlow)*lit;
  vec3 alb = vCol;
  if (vFx > 5.5 && vFx < 7.5) {            // deck planks
    float pl = abs(fract(vW.x*1.6) - 0.5);
    alb *= (0.72 + 0.28*smoothstep(0.03, 0.09, pl))*(0.85 + 0.3*h21(vec2(floor(vW.x*1.6), floor(vW.z*0.11 + h21(vec2(floor(vW.x*1.6), 3.0))*7.0))));
    glow *= 0.55*smoothstep(-0.1, 0.4, N.y);
  }
#ifdef USE_INSTANCING
  #ifdef PILE
  float bn = h21(floor(vec2(vW.x + vW.z, vW.y)*7.0));
  float weed = 1.0 - smoothstep(1.4, 2.6, vW.y + 0.5*vn2(vec2((vW.x + vW.z)*3.0, vW.y*1.5))), barn = (1.0 - smoothstep(0.1, 0.75, abs(vW.y - 3.0)))*(1.0 - weed);
  alb *= 0.75 + 0.5*vn2(vec2((vW.x + vW.z)*9.0, vW.y*0.7));
  alb = mix(alb, vec3(0.035, 0.085, 0.05)*(0.6 + 0.8*vn2(vec2((vW.x - vW.z)*5.0, vW.y*2.0 + uTime*0.3))), weed);
  alb = mix(alb, vec3(0.5, 0.52, 0.47), barn*(0.3 + 0.7*step(0.35, bn)));
  #else
  // timber seen close: darker joints and arrises, grain along the length, weathered paint
  vec3 qd = (0.5 - abs(vL))*vS;
  float edge = qd.x + qd.y + qd.z - min(qd.x, min(qd.y, qd.z)) - max(qd.x, max(qd.y, qd.z));
  vec3 lp = vL*vS; float al, ac;
  if (vS.y >= max(vS.x, vS.z)) { al = lp.y; ac = lp.x + lp.z; } else if (vS.x >= vS.z) { al = lp.x; ac = lp.y + lp.z; } else { al = lp.z; ac = lp.x + lp.y; }
  float nk = 1.0 - smoothstep(10.0, 42.0, camD), seed = h21(floor(vW.xz*0.5));
  float grain = vn2(vec2(al*1.1 + seed*17.0, ac*42.0)), wear = vn2(vec2(al*0.35 + seed*5.0, (vW.y + ac)*1.3));
  alb *= mix(0.96, (0.62 + 0.38*smoothstep(0.0, 0.03, edge))*(0.86 + 0.16*grain)*(0.84 + 0.22*wear), nk);
  alb *= 0.9 + 0.14*smoothstep(-0.5, 0.5, vL.y)*step(max(vS.x, vS.z), vS.y);
  #endif
#endif
  vec3 col = alb*(amb*(1.0 + uFlash*3.0) + uRim*rim + glow);
  if (vFx > 7.5 && vFx < 8.5) {            // the town's seafront: sash windows, drawn where the wall is
    vec2 g = vec2(dot(vW.xz, vec2(abs(N.z), abs(N.x))), vW.y)/vec2(2.4, 3.2), c = floor(g), f = fract(g), aw = fwidth(g)*0.75 + 1e-4;
    float far = smoothstep(0.2, 0.55, max(aw.x, aw.y)), r = h21(c + 0.37), shop = step(vW.y, 3.2);
    vec2 hs = mix(vec2(0.2, 0.29), vec2(0.4, 0.33), shop);
    float win = boxAA(f, vec2(0.5, 0.5), hs, aw), frame = boxAA(f, vec2(0.5, 0.5), hs + vec2(0.045, 0.035), aw) - win;
    float bars = max(1.0 - smoothstep(0.0, 0.018 + aw.x, abs(f.x - 0.5)), (1.0 - smoothstep(0.0, 0.014 + aw.y, abs(f.y - 0.52)))*(1.0 - shop));
    float on = step(r, 0.14 + 0.36*min(uWin, 1.0) + 0.3*shop*min(uWin, 1.0));
    vec3 wc = r > 0.42 ? uPalB : (r > 0.34 ? uPalA : uPalC);
    vec3 lamp = wc*uWin*(0.75 + 0.25*sin(uTime*(0.6 + r*2.0) + r*40.0))*(0.55 + 0.45*smoothstep(0.0, 1.0, f.y))*step(vW.z, uWaveZ + 400.0);
    vec3 glass = mix(uSky*0.55 + uRim*rim*0.6, lamp, on)*(1.0 - 0.6*bars*(1.0 - far));
    float cover = mix(win, 4.0*hs.x*hs.y, far);
    col = mix(col, glass, cover);
    col = mix(col, col*1.25 + uSky*0.05, frame*(1.0 - far)*0.8);
    col *= 1.0 - 0.18*(1.0 - far)*(1.0 - smoothstep(0.0, 0.05, f.y))*(1.0 - shop);          // string course under each storey
  }
  if (vFx > 8.5 && vFx < 9.5) {            // slate roofs
    float sl = fract(vW.y*2.6 + vW.x*0.02), aws = fwidth(vW.y*2.6);
    col *= 0.86 + 0.14*mix(smoothstep(0.0, 0.2, sl), 0.5, smoothstep(0.3, 0.9, aws));
  }
  if (vFx > 3.5 && vFx < 5.5) {            // chrome: bulbs slide along it as streaks
    float a = fract(vW.x*0.9 + vW.z*0.37 + vW.y*0.5), b = fract(vW.x*0.6 - vW.z*0.53 + 0.4);
    float sa = smoothstep(0.42, 0.5, a)*(1.0 - smoothstep(0.5, 0.58, a)), sb = smoothstep(0.44, 0.5, b)*(1.0 - smoothstep(0.5, 0.56, b));
    col = alb*(amb*1.6 + uRim*(0.4 + rim)) + (uPalA*sa + uPalB*sb)*lit*1.5 + uPalC*0.25*pow(max(N.y, 0.0), 6.0);
  }
  if (vFx > 11.5 && vFx < 12.5) col *= 0.45 + 0.9*step(0.5, fract(vW.y*3.0 - uTime*5.0));   // the lift chain
#ifdef MIRROR
  col *= 0.6*exp(-max(0.0, -vW.y)*0.008);
#endif
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---------- sprites: bulbs, crowd, balloons, kites, sanderlings ----------
// iA = (colour id 0 mint 1 pink 2 white, phase, half size m, mode)
// modes: 0 bulb, 1 bulb on a swagged string, 2 crowd dot, 3 chasing bulb, 4 balloon, 5 kite, 6 sanderling, 7 smoke,
//        8 kite string (iA.z = the kite's height above the beach), 9 spray thrown across the nose (car space)
const SPRITE_VS = /* glsl */`
attribute vec3 iPos; attribute vec4 iA;
uniform float uTime, uLit, uWaveZ, uMirror, uHalo, uFogD, uFogKeep, uSprayT; uniform vec2 uRes, uSea; uniform vec3 uPal[3]; uniform vec3 uFlock;
varying vec2 vQ; varying vec3 vC; varying float vMode, vI, vH, vPh;
vec3 kiteSway(float ph, float t){ return vec3(sin(t*0.5 + ph*20.0)*3.0, sin(t*0.83 + ph*31.0)*2.2, cos(t*0.41 + ph*13.0)*2.0); }
void main(){
  float mode = iA.w, ph = iA.y, t = uTime;
  vec3 lp = iPos;
  if (mode > 5.5 && mode < 6.5) {          // sanderlings: the flock runs and turns as one
    lp.xz += uFlock.xz; lp.x += sin(t*0.9 + ph*30.0)*1.2 + sin(t*0.37 + uFlock.y)*6.0*fract(ph*7.0); lp.y += abs(sin(t*9.0 + ph*50.0))*0.05;
  }
  float I = 1.0, size = iA.z;
  if (mode > 8.5) {                        // spray: a slap of drops from the left, over the nose and gone
    float tau = uSprayT - fract(ph*7.0)*0.25, live = step(0.0, tau)*step(tau, 1.1);
    vec3 v0 = vec3(3.2 + 3.0*fract(ph*13.0), 3.4 + 2.6*fract(ph*29.0), 2.0 + 5.0*fract(ph*41.0));
    lp += v0*tau + vec3(0.0, -6.5*tau*tau, 0.0);
    I = live*(1.0 - smoothstep(0.5, 1.1, tau)); size *= 1.0 + 1.6*tau;
  }
  vec4 w = modelMatrix*vec4(lp, 1.0);
  if (mode < 0.5) I = 0.86 + 0.14*sin(t*3.0 + ph*50.0);
  else if (mode < 1.5) { w.x += sin(t*1.1 + ph*6.283 + w.z*0.05)*0.16; w.y += sin(t*1.7 + ph*9.0)*0.05; I = 0.9 + 0.1*sin(t*2.3 + ph*40.0); }
  else if (mode < 2.5) { w.x += sin(t*0.31 + ph*37.0)*2.2 + sin(t*0.13 + ph*11.0)*1.5; w.z += cos(t*0.23 + ph*23.0)*3.0; w.y += abs(sin(t*2.6 + ph*60.0))*0.16; I = 0.5; }
  else if (mode < 3.5) { float c = fract(ph - t*0.45); I = 0.25 + 1.3*smoothstep(0.7, 1.0, c) + 0.5*(1.0 - smoothstep(0.0, 0.2, c)); }
  else if (mode < 4.5) { float r = fract(t*0.021 + ph); w.y += r*120.0; w.x += r*38.0 + sin(t*0.8 + ph*20.0)*0.8; w.z -= r*26.0; I = smoothstep(0.0, 0.03, r)*(1.0 - smoothstep(0.8, 1.0, r)); }
  else if (mode < 5.5) { w.xyz += kiteSway(ph, t); }
  else if (mode > 6.5 && mode < 7.5) { w.x += t*1.2 + sin(t*0.2 + ph*9.0)*4.0; I = 0.5 + 0.5*sin(t*0.3 + ph*20.0); }
  float bulb = step(mode, 1.5) + step(2.5, mode)*step(mode, 3.5);
  I *= mix(1.0, uLit*step(w.z, uWaveZ), bulb);
  float tall = 1.0, onSea = 0.0;
  if (uMirror > 0.5) {
    w.y = -1.3*w.y; w.x += sin(w.y*0.42 + t*1.6 + w.z*0.3)*0.02*min(-w.y, 22.0); I *= 0.55;
    // seen in the sea, not the sand: lay the light on the water as a long wobbling streak
    float f = clamp((cameraPosition.y - uSea.x)/max(cameraPosition.y - w.y, 0.05), 0.0, 1.0);
    vec3 sp = cameraPosition + (w.xyz - cameraPosition)*f;
    if (sp.z > uSea.y && cameraPosition.y > uSea.x + 0.3) {
      size *= f; tall = 3.6; onSea = 1.0; I *= 0.9;
      w.xyz = sp + vec3(sin(t*2.1 + sp.z*0.9 + ph*40.0)*size*1.6, 0.45, 0.0);
    } else if (sp.z > uSea.y - 3.0 || iPos.z > uSea.y + 4.0) I = 0.0;
  }
  vec4 mv = viewMatrix*w;
  float dist = max(-mv.z, 0.01);
  float px = 2.0*dist/(uRes.y*projectionMatrix[1][1]);       // metres per pixel at this depth
  I *= mix(1.0, 0.25 + 0.75*smoothstep(10.0, 70.0, dist), onSea);   // streaks on the water are a far-off glitter, not blocks beside the car
  float minS = px*(0.75 + bulb*0.4 + step(5.5, mode)*step(mode, 6.5)*0.5);
  if (mode > 4.5 && mode < 5.5) size = min(size, px*17.0);   // a kite never fills the sky
  float s2 = max(size, minS);
  I *= mix(1.0, clamp((size*size)/(s2*s2), 0.22, 1.0), bulb);
  I *= mix(1.0, 0.4, bulb*smoothstep(5.0, 28.0, size/px));
  // in fog a lamp fades and its halo swells with distance
  float hK = uHalo + bulb*max(uHalo, 0.0)*min(dist*0.012, 2.2);
  float qf = 1.0 + bulb*(1.6 + hK);
  float fogF = exp(-uFogD*uFogD*dist*dist);
  I *= mix(fogF, 1.0, uFogKeep*bulb);
  vQ = position.xy*qf; vMode = mode; vI = I; vH = hK; vPh = ph;
  vC = iA.x < 0.5 ? uPal[0] : (iA.x < 1.5 ? uPal[1] : uPal[2]);
  if (mode > 7.5 && mode < 8.5) {          // the kite's string: a hair of light from the flyer's hand to the kite
    float k = position.y*0.5 + 0.5;
    vec3 top = iPos + kiteSway(ph, t) + vec3(0.0, -1.2, 0.0), foot = vec3(iPos.x - iA.z*0.55, 1.2, iPos.z + iA.z*0.3);
    vec3 q = mix(foot, top, k) - vec3(0.0, iA.z*0.16*sin(k*3.14159), 0.0);
    mv = viewMatrix*modelMatrix*vec4(q, 1.0);
    float d8 = max(-mv.z, 0.01);
    mv.x += position.x*0.8*2.0*d8/(uRes.y*projectionMatrix[1][1]);
    vI = 1.0 - smoothstep(60.0, 420.0, d8)*0.6;
  } else if (mode > 4.5 && mode < 5.5) mv.xy += position.xy*s2*vec2(1.0, 3.0) + vec2(0.0, -2.0*s2);     // the diamond sits at the top of a tall quad; its tail hangs below
  else mv.xy += position.xy*s2*qf*vec2(1.0, tall);
  if (dist < 0.9 || vI < 0.004) mv.z = 1e6;
  gl_Position = projectionMatrix*mv;
}`;

const SPRITE_FS = /* glsl */`
uniform float uSolid, uCore, uTime; uniform vec3 uShade;
varying vec2 vQ; varying vec3 vC; varying float vMode, vI, vH, vPh;
void main(){
  float d = length(vQ);
  if (uSolid > 0.5) {
    float a; vec3 c = vC;
    if (vMode > 7.5 && vMode < 8.5) { a = (1.0 - abs(vQ.x))*0.55; c = vec3(0.92); }
    else if (vMode > 8.5) { a = (1.0 - smoothstep(0.3, 1.0, d))*0.75; c = vec3(1.25, 1.3, 1.35); }
    else if (vMode > 4.5 && vMode < 5.5) {
      // a diamond kite: two-tone panels, a cross spar, and a ribbon tail with bows that snakes in the wind
      vec2 q = vec2(vQ.x, (vQ.y - 0.6667)*3.0);
      float dm = abs(q.x) + abs(q.y*0.8 + 0.12), kite = 1.0 - smoothstep(0.84, 0.92, dm);
      float spar = max(1.0 - smoothstep(0.03, 0.07, abs(q.x)), 1.0 - smoothstep(0.03, 0.07, abs(q.y - 0.18)));
      vec3 kc = mix(c, mix(vec3(0.95), c*0.45, step(0.5, fract(vPh*5.0))), step(0.0, q.x*(q.y - 0.18)));
      kc = mix(kc, vec3(0.2, 0.18, 0.25), spar*0.7);
      float ty = clamp((0.28 - vQ.y)/1.28, 0.0, 1.0);                       // 0 at the kite's foot, 1 at the tail's end
      float tx = sin(ty*9.0 - uTime*4.0 + vPh*30.0)*0.3*ty;
      float bow = 1.0 - smoothstep(0.03, 0.1, abs(fract(ty*4.0) - 0.5));
      float tail = (1.0 - smoothstep(0.05 + 0.16*bow, 0.1 + 0.18*bow, abs(vQ.x - tx)))*step(vQ.y, 0.3)*step(0.001, ty)*(1.0 - smoothstep(0.92, 1.0, ty));
      a = max(kite, tail); c = mix(mix(vec3(0.95), c, bow), kc, kite);
    }
    else if (vMode > 5.5) { a = 1.0 - smoothstep(0.6, 1.0, d); c = vec3(0.86, 0.86, 0.84); }
    else { a = 1.0 - smoothstep(0.9, 1.0, d); c *= 0.6 + 0.5*(1.0 - smoothstep(0.0, 1.2, length(vQ - vec2(-0.3, 0.35)))); }
    if (a < 0.02) discard;
    gl_FragColor = vec4(c*uShade, a*clamp(vI, 0.0, 1.0));
    return;
  }
  vec3 col;
  if (vMode > 1.5 && vMode < 2.5) col = vC*exp(-d*d*3.2)*0.34*vI;                       // crowd: a soft pastel dot
  else if (vMode > 6.5) col = vC*exp(-d*d*2.5)*0.05*vI;                                 // smoke
  else {
    float core = 1.0 - smoothstep(0.82, 1.0, d), halo = exp(-d*d*2.2/(1.0 + 0.8*max(vH, -0.6)))*(0.16 + 0.2*min(vH, 1.6))*(1.0 - smoothstep(1.0, 2.6 + vH, d));
    col = vC*(core*uCore + halo)*vI;
    col += vec3(1.0)*core*(1.0 - smoothstep(0.0, 0.5, d))*0.8*vI;
  }
  gl_FragColor = vec4(col, 0.0);
}`;

// ---------- fireworks: shells that hang and weep, in silver, mint and pink ----------
// Shells 0..uNA-1 loop over the mortar line behind the wheel, the next ones loop over the barge, and the last
// three are the score: fired when the car reaches a place on the track (uKeyTau = seconds since each was lit).
const FW_VS = /* glsl */`
attribute vec4 aSpark; attribute vec4 aBurst;
uniform float uTime, uPeriod, uRise, uMirror, uGain, uNA, uNL, uFogD; uniform vec2 uSea; uniform vec3 uSiteA, uSiteB, uAreaA, uAreaB, uWind; uniform vec3 uPal[3];
uniform vec3 uKeyPos[3]; uniform float uKeyTau[3];
varying vec2 vUv; varying vec3 vC; varying float vI;
vec3 h33(vec3 p){ p = fract(p*vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx)*p.zyx); }
vec3 fwPos(vec3 c, vec3 dir, float sp, float drag, float grav, float te){
  // heavy drag stops the spark early; then it only falls, and drifts on the wind
  return c + dir*sp*(1.0 - exp(-drag*te))/drag - vec3(0.0, grav*te*te*0.5/(1.0 + te*0.3), 0.0) + uWind*te*(0.5 + 0.3*te);
}
float gSea;
vec3 seaLay(vec3 m){
  float f = clamp((cameraPosition.y - uSea.x)/max(cameraPosition.y - m.y, 0.05), 0.0, 1.0);
  vec3 sp = cameraPosition + (m - cameraPosition)*f;
  if (sp.z > uSea.y && cameraPosition.y > uSea.x + 0.3) { gSea = 1.0; return sp + vec3(0.0, 0.45, 0.0); }
  return m;
}
void main(){
  vUv = uv;
  float b = aBurst.x, cyc = uTime/uPeriod + aBurst.y, k = floor(cyc), tau = fract(cyc)*uPeriod, live = 1.0; gSea = 0.0;
  vec3 h = h33(vec3(b*7.13 + 1.0, k*3.71 + 2.0, 1.7)), h2 = h33(vec3(k*1.37 + 5.0, b*5.11 + 3.0, 9.2));
  float atA = step(b, uNA - 0.5);
  vec3 centre = mix(uSiteB, uSiteA, atA) + (h - 0.5)*mix(uAreaB, uAreaA, atA);
  float type = floor(h2.x*2.999);                              // 0 silver willow, 1 mint palm, 2 pink crossette
  if (b > uNL - 0.5) {
    int ki = int(clamp(b - uNL + 0.5, 0.0, 2.0));
    tau = ki == 0 ? uKeyTau[0] : (ki == 1 ? uKeyTau[1] : uKeyTau[2]);
    centre = ki == 0 ? uKeyPos[0] : (ki == 1 ? uKeyPos[1] : uKeyPos[2]);
    type = float(ki); h = vec3(0.6, 0.5, 0.5); h2 = vec3(0.1, 0.5, 0.5);
    live = step(0.0, tau)*step(tau, uPeriod - 0.05); tau = clamp(tau, 0.0, uPeriod);
  }
  float willow = step(type, 0.5), palm = step(0.5, type)*step(type, 1.5), cross = step(1.5, type);
  vec3 posH, posT; float I, width = 0.5;
  if (tau < uRise) {
    float f = tau/uRise, fT = max(f - 0.12, 0.0);
    vec3 launch = vec3(centre.x + (h2.z - 0.5)*14.0, 1.0, centre.z + (h.z - 0.5)*10.0);
    vec3 wav = vec3(sin(f*17.0 + b), 0.0, cos(f*13.0 + b))*0.8;
    posH = mix(launch, centre, 1.0 - (1.0 - f)*(1.0 - f)) + wav*f + aSpark.xyz*aBurst.w*0.5;
    posT = mix(launch, centre, 1.0 - (1.0 - fT)*(1.0 - fT)) + wav*fT;
    I = step(aBurst.z, 0.05)*(0.25 + 0.5*f)*smoothstep(0.0, 0.1, f);
    vC = uPal[2]; width = 0.3;
  } else {
    float te = tau - uRise, life = uPeriod - uRise - 0.2, s = te/life;
    vec3 dir = aSpark.xyz;
    if (willow > 0.5) dir = normalize(dir + vec3(0.0, 0.35, 1e-3));
    if (palm > 0.5) { vec3 q = floor(dir*2.2 + 0.5); dir = normalize(mix(dir, q, 0.85) + vec3(0.0, 0.5, 1e-3)); }
    if (cross > 0.5) { vec3 q = floor(dir*1.6 + 0.5); dir = normalize(q + vec3(1e-3)) + (aSpark.xyz - 0.5)*0.9*smoothstep(0.7, 1.4, te); }
    float sp = aSpark.w*mix(0.8, 1.2, h.x)*(willow*74.0 + palm*92.0 + cross*70.0);
    float drag = willow*2.3 + palm*2.2 + cross*2.4, grav = willow*11.0 + palm*7.5 + cross*6.5;
    float trail = willow*1.5 + palm*0.9 + cross*0.5;
    posH = fwPos(centre, dir, sp, drag, grav, te); posT = fwPos(centre, dir, sp, drag, grav, max(te - trail*(0.6 + 0.6*aBurst.w), 0.0));
    float open = 1.0 - exp(-drag*te);
    float tw = mix(1.0, step(0.4, fract(aBurst.w*77.0 + floor(uTime*12.0)*0.37 + aBurst.z*13.0)), smoothstep(0.45, 0.9, s));
    I = pow(max(1.0 - s, 0.0), mix(1.3, 0.6, willow))*min(open*open*open*2.2, 1.0)*tw;
    vC = willow*mix(uPal[2], vec3(1.0, 0.96, 0.9), 0.3) + palm*uPal[0] + cross*uPal[1];
    width = 0.42 + 0.2*palm;
  }
  I *= live;
  if (uMirror > 0.5) {
    posH.y = -1.3*posH.y; posT.y = -1.3*posT.y; posH.x += sin(posH.y*0.3 + uTime*1.6)*0.5; I *= 0.5;
    gSea = 0.0; posH = seaLay(posH); posT = seaLay(posT);
  }
  vec4 vh = viewMatrix*vec4(posH, 1.0), vt = viewMatrix*vec4(posT, 1.0);
  vec2 ax = vh.xy - vt.xy; float al = length(ax); ax = al > 1e-4 ? ax/al : vec2(0.0, 1.0);
  vec4 mv = mix(vt, vh, uv.y);
  float dist = max(-mv.z, 1.0);
  if (uMirror > 0.5) I *= mix(1.0, 0.3*smoothstep(40.0, 200.0, dist), gSea);   // on the sea a shell's image is a far-off shimmer, never a blot beside the car
  width = max(width, dist*0.0016);
  mv.xy += vec2(-ax.y, ax.x)*(uv.x - 0.5)*2.0*width + ax*(uv.y - 0.5)*2.0*width;
  float fogF = exp(-uFogD*uFogD*dist*dist);
  vI = I*uGain*mix(fogF, 1.0, 0.3);
  if (vI < 0.004) mv.z = 1e6;
  gl_Position = projectionMatrix*mv;
}`;
const FW_FS = /* glsl */`
varying vec2 vUv; varying vec3 vC; varying float vI;
void main(){
  float x = abs(vUv.x - 0.5)*2.0;
  float a = (1.0 - smoothstep(0.0, 1.0, x))*smoothstep(0.0, 0.5, vUv.y)*(0.35 + 0.65*smoothstep(0.75, 1.0, vUv.y));
  gl_FragColor = vec4(vC*a*vI*1.7, 0.0);
}`;

// ---------- small CPU helpers ----------
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
function quadGeo() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 150), 5000);
  return g;
}
// a growing list of sprites; build() makes the instanced geometry
class Sprites {
  constructor() { this.p = []; this.a = []; }
  add(x, y, z, col, size, mode = 0, phase = (this.p.length * 0.6180339) % 1) { this.p.push(x, y, z); this.a.push(col, phase, size, mode); }
  get count() { return this.p.length / 3; }
  build() {
    const g = quadGeo();
    g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(this.p), 3));
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(this.a), 4));
    g.instanceCount = this.count;
    return g;
  }
}

// the four looks: blue hour (default), deep night, golden afternoon, sea-fret night
const LOOKS = {
  blue: {
    sky: { preset: 'blueHour', zenith: '#3a2668', mid: '#1b5f70', horizon: '#2a2a5e', ground: '#0b1226', horizonPow: 3.2, midPow: 1.3,
      scatterColor: '#FFB59A', scatter: 1.35, scatterPow: 2.6, scatterHigh: 0, scatterFall: 11, sunElevation: -6, sunAzimuth: 180, sunIntensity: 0, sunGlow: 0,
      stars: 0.55, milkyWay: 0, bodies: [], clouds: false, clouds2: { coverage: 0.34, stretch: 1, scale: 0.8, lit: '#ff9dbd', shade: '#3b2a6a', opacity: 0.8 } },
    fog: 0.0006, fogMix: 0.25, exposure: 1.12, bulbs: 1, halo: 0, fwGain: 1, win: 1.0,
    bloom: { strength: 0.62, radius: 0.32, threshold: 0.92 }, grade: { saturation: 1.1, contrast: 1.05, tint: '#f4f6ff', shadowTint: '#0E1630', vignette: 0.34, grain: 0.02 },
    sky3: [0.12, 0.14, 0.2], ground3: [0.035, 0.04, 0.07], rim3: [0.5, 0.3, 0.22], rimDir: [0, 0.18, 0.98], glowK: 0.5, reflMin: 0.6, fogKeep: 0.35,
    deep: '#0a1836', scatterW: '#1E6A7A', title: 'The Pier Comet',
  },
  night: {
    sky: { preset: 'night', zenith: '#040818', mid: '#0a1838', horizon: '#14285a', ground: '#040812', sunAzimuth: 180,
      stars: 1, milkyWay: 0.28, milkyAngle: 200, bodies: [{ elevation: 52, azimuth: 96, size: 1.1, phase: 0.97, intensity: 1.2, glow: 0.3, glowColor: '#cfe0ff' }], key: 0,
      clouds: false, clouds2: false },
    fog: 0.0005, fogMix: 0, exposure: 1.2, bulbs: 1.1, halo: 0.1, fwGain: 1.15, win: 1.1,
    bloom: { strength: 0.7, radius: 0.34, threshold: 0.9 }, grade: { saturation: 1.12, contrast: 1.07, tint: '#f0f4ff', shadowTint: '#0a1030', vignette: 0.38, grain: 0.022 },
    sky3: [0.085, 0.1, 0.16], ground3: [0.024, 0.03, 0.06], rim3: [0.34, 0.4, 0.55], rimDir: [0.75, 0.62, 0.2], glowK: 0.56, reflMin: 0.62, fogKeep: 0.35,
    zen3: [0.03, 0.045, 0.13], hor3: [0.07, 0.13, 0.3], peach3: [0.25, 0.3, 0.45],
    deep: '#06102a', scatterW: '#16506a', title: 'The Pier Comet, Midnight',
  },
  golden: {
    sky: { preset: 'goldenHour', sunElevation: 8.5, sunAzimuth: 196, clouds: { coverage: 0.3 }, clouds2: { coverage: 0.4, stretch: 1 } },
    fog: 0.00055, fogMix: 0.5, exposure: 0.98, bulbs: 0.16, halo: -0.6, fwGain: 0, win: 0.25,
    bloom: { strength: 0.3, radius: 0.5, threshold: 0.95 }, grade: { saturation: 1.08, contrast: 1.05, tint: '#fff4e6', shadowTint: '#1a1838', vignette: 0.3, grain: 0.02 },
    sky3: [0.3, 0.38, 0.55], ground3: [0.3, 0.22, 0.17], rim3: [1.5, 0.9, 0.48], rimDir: [0.27, 0.16, 0.95], glowK: 0.06, reflMin: 0.24, fogKeep: 0.35,
    zen3: [0.55, 0.85, 1.6], hor3: [2.4, 1.7, 1.2], peach3: [2.6, 1.3, 0.6], sand3: [0.46, 0.33, 0.22], sandDry3: [0.78, 0.62, 0.44],
    deep: '#0d3a5c', scatterW: '#3aa7a0', title: 'The Pier Comet, Last Afternoon',
  },
  fret: {
    sky: { preset: 'blueHour', zenith: '#232b4c', mid: '#2f3d5c', horizon: '#34435f', ground: '#2c3955', horizonPow: 1.6, midPow: 0.8, groundFalloff: 2, scatterColor: '#8f8fa6', scatter: 0.2, scatterPow: 2, scatterFall: 4,
      sunElevation: -8, sunAzimuth: 180, sunIntensity: 0, sunGlow: 0, stars: 0, milkyWay: 0, bodies: [], clouds: { coverage: 0.5, softness: 0.6, lit: '#3d4a6c', shade: '#27304e', opacity: 0.6 }, clouds2: false },
    fog: 0.0042, fogMix: 0, exposure: 1.15, bulbs: 1.0, halo: 0.9, fwGain: 1.5, win: 1.3,
    bloom: { strength: 0.7, radius: 0.55, threshold: 0.88 }, grade: { saturation: 1.05, contrast: 1.0, tint: '#eef4ff', shadowTint: '#141c38', vignette: 0.4, grain: 0.03 },
    sky3: [0.17, 0.19, 0.25], ground3: [0.06, 0.075, 0.115], rim3: [0.08, 0.07, 0.09], rimDir: [0, 0.18, 0.98], glowK: 0.7, reflMin: 0.6, fogKeep: 0.03,
    zen3: [0.1, 0.13, 0.24], hor3: [0.16, 0.22, 0.33], peach3: [0.3, 0.25, 0.3],
    deep: '#0c1a34', scatterW: '#2a5a6a', title: 'The Pier Comet in the Sea Fret',
  },
};

function trackPoints(fly) {
  const P = [], X = TRACK_X;
  for (const [z, y] of [[150, 18], [160, 18], [169, 18], [176, 18.3], [181, 19.6], [188, 25.2], [195, 31.1], [202, 37], [208, 41.6], [212.5, 44.5], [216, 45.8], [219.5, 45.6], [223, 43.4],
    [227, 39.2], [232, 33.3], [238, 26.1], [244, 19], [249.5, 12.6], [254, 8], [258, 5.2], [262, 4.1], [268, 3.7], [280, 3.6], [296, 3.6], [312, 3.6], [326, 3.7], [338, 4]]) P.push([X, y, z]);
  for (let a = 0; a <= 180; a += 15) { const r = a * Math.PI / 180; P.push([X + 38 - 38 * Math.cos(r), 4.2 + 1.6 * Math.sin(r), 345 + 38 * Math.sin(r)]); }
  const XR = X + 76;
  for (const [z, y] of [[334, 6.3], [326, 11.8], [318, 16.4], [310, 13.4], [301, 7.4], [292, 5.2], [284, 8.6], [275, 14.4], [266, 17], [257, 13.6], [248, 8.2], [240, 5.9]]) P.push([XR, y, z]);
  for (const [z, y] of [[232, 7.6], [224, 12], [216, 17.5], [208, 23.5], [200, 29.5], [192, 35.2], [185, 39.8], [179, 43.6], [174, 46.2], [169.5, 47.6], [165.5, 47.5], [161.5, 46.35]]) {
    const s = Math.min(1, (240 - z) / 78.5), k = s * s * (3 - 2 * s); P.push([XR * (1 - k), y, z]);
  }
  for (const f of fly) P.push([f[0], f[1], f[2] + HERO_Z]);
  return P;
}

export default {
  id: 'pier-comet',
  name: 'The Pier Comet',
  category: 'city',
  weirdness: 0.2,
  media: ['rail', 'air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, density = vary.density ?? 1;
    const scene = new THREE.Scene();
    // ----- which visit is this? -----
    const hour = vary.hour || 'any', r0 = rng();
    let lookId = hour === 'night' ? (r0 < 0.3 ? 'fret' : 'night') : (hour === 'golden' || hour === 'day') ? 'golden' : hour === 'dawn' ? 'blue'
      : r0 < 0.4 ? 'blue' : r0 < 0.64 ? 'night' : r0 < 0.84 ? 'golden' : 'fret';
    const L = LOOKS[lookId], golden = lookId === 'golden', rare = !!vary.rare && !golden;
    const livery = rng.int(0, 2), swingTower = rng.chance(0.55), steamerOn = rng.chance(0.7), tideOut = rng.range(226, 250);
    // about one visit in five the tide is right in: the last climb rises out of a lagoon and breakers run through the pilings
    const highTide = FORCE_TIDE ?? ((tideOut * 37.7) % 1 < 0.2), tide = highTide ? 132 + (tideOut - 226) * 0.4 : tideOut;
    const C = { navy: lin(PAL[0]), teal: lin(PAL[1]), violet: lin(PAL[2]), peach: lin(PAL[3]), mint: lin(PAL[4]), pink: lin(PAL[5]), white: lin(PAL[6]) };
    const lampCol = [C.mint, C.pink, C.white];
    const WHITE = mul(C.white, 0.74);

    // ----- hero first: its anchors place the end of the path -----
    const hero = await buildHero(ctx, { palette: PAL, reflection: true, sand: true, sandRadius: 1500, track: true, mirrorRadius: 250, mirrorDepth: 240 });
    hero.object.position.set(0, 0, HERO_Z); scene.add(hero.object);
    const HA = hero.anchors;
    await ctx.yield();

    const path = makePath(trackPoints(HA.flyThrough), { samples: 640 });
    const PL = path.length, joinD = PL - 62;
    await ctx.yield();
    // banked track frames, one per metre
    const NF = Math.ceil(PL) + 1, bankT = new Float32Array(NF);
    { const a = V(), b = V(), raw = new Float32Array(NF);
      for (let i = 0; i < NF; i++) {
        path.tangentAtDist(Math.max(0, i - 3), a); path.tangentAtDist(Math.min(PL, i + 3), b);
        const k = (a.z * b.x - a.x * b.z) / 6;             // signed horizontal curvature, + = turning left (toward +X when heading +Z)
        raw[i] = Math.max(-1.05, Math.min(1.05, k * 40));
      }
      for (let i = 0; i < NF; i++) { let s = 0, n = 0; for (let j = -7; j <= 7; j++) { const q = i + j; if (q >= 0 && q < NF) { s += raw[q]; n++; } } bankT[i] = s / n * Math.min(1, (PL - i) / 30); }
    }
    const _t = V(), _r = V(), _u = V(), _p = V(), UP = V(0, 1, 0);
    await ctx.yield();
    const frameAt = (d, P, T, R, U) => {
      path.posAtDist(d, P); path.tangentAtDist(d, T);
      R.crossVectors(T, UP).normalize(); U.crossVectors(R, T).normalize();
      const i = Math.max(0, Math.min(NF - 1.001, d)), i0 = Math.floor(i), bk = bankT[i0] + (bankT[Math.min(NF - 1, i0 + 1)] - bankT[i0]) * (i - i0);
      const c = Math.cos(bk), s = -Math.sin(bk) /* + bank = left turn: up leans left (-R) */, ux = U.x * c + R.x * s, uy = U.y * c + R.y * s, uz = U.z * c + R.z * s;
      R.set(R.x * c - U.x * s, R.y * c - U.y * s, R.z * c - U.z * s); U.set(ux, uy, uz);
    };
    const uAt = (x, z) => path.nearestXZ(x, z).u;
    const U_LIFT = uAt(TRACK_X, 190), U_CREST = uAt(TRACK_X, 217), U_SLOT = uAt(TRACK_X, 254), U_OUT = uAt(TRACK_X, 332), U_APEX = uAt(TRACK_X + 38, 383), U_RET = uAt(TRACK_X + 76, 300), U_CLIMB = uAt(TRACK_X + 60, 216);

    // ----- sky, fog, sea -----
    const sky = makeSky({ rng, bake: true, renderer: ctx.renderer, ...L.sky });
    scene.add(sky.object);
    await ctx.yield();
    const fogCol = sky.fogColor.clone().lerp(sky.colorAt(V(0.3, 0.04, -1).normalize()), 1 - L.fogMix);
    scene.fog = new THREE.FogExp2(fogCol, L.fog);
    const sea = Water.makeOcean({ rng, light: Water.waterLight(sky, { fogColor: fogCol }), preset: 'breeze', height: 0.72, wavelength: 58, foam: 0.2, level: SEA, radius: 3600,
      deep: L.deep, scatter: L.scatterW, depthAt: (x, z) => (z < tide ? -8 : 0.3 + (z - tide) * 0.06), depthRect: [-2600, -640, 2600, tide + 384], depthRes: 128, shoalDepth: 5, shoalWidth: 26 });
    scene.add(sea.object);
    await ctx.yield();

    // ----- shared uniforms and materials -----
    const HU = hero.uniforms;
    HU.uSky.value.setRGB(...L.sky3); HU.uGround.value.setRGB(...L.ground3); HU.uRim.value.setRGB(...L.rim3); HU.uRimDir.value.set(...L.rimDir).normalize();
    HU.uGlowK.value = Math.max(0.35, L.glowK * 1.1);
    if (L.zen3) { HU.uZenith.value.setRGB(...L.zen3); HU.uHorizon.value.setRGB(...L.hor3); HU.uPeach.value.setRGB(...L.peach3); }
    if (golden) HU.uRimDir.value.copy(sky.sunDirection);
    if (L.sand3) hero.object.traverse((o) => { if (o.material?.uniforms?.uSand) o.material.uniforms.uSand.value.setRGB(...L.sand3); });
    if (L.sandDry3) HU.uSandDry.value.setRGB(...L.sandDry3);
    if (lookId === 'blue') { HU.uZenith.value.multiplyScalar(0.7); HU.uHorizon.value.multiplyScalar(0.7); }
    HU.uSea.value.set(SEA, tide + 2); HU.uShore.value.set(20, tide); HU.uReflMin.value = L.reflMin; HU.uLamp.value = golden ? 0.5 : 1;
    const col3 = (c) => new THREE.Color(c[0], c[1], c[2]);
    const resU = { value: new THREE.Vector2(800, 450) };
    const PU = {
      uRes: resU, uTime: { value: 0 }, uFlash: { value: 0 }, uGlowK: { value: L.glowK ?? 1 }, uWaveZ: { value: 1e6 }, uWin: { value: L.win },
      uSky: HU.uSky, uGround: HU.uGround, uRim: HU.uRim, uRimDir: HU.uRimDir,
      uPalA: { value: col3(C.mint) }, uPalB: { value: col3(C.pink) }, uPalC: { value: col3(C.white) },
    };
    const paintMat = (mirror, side = THREE.FrontSide) => new THREE.ShaderMaterial({
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...PU }, defines: mirror ? { MIRROR: 1 } : {},
      vertexShader: PAINT_VS, fragmentShader: PAINT_FS, fog: true, side: mirror ? THREE.DoubleSide : side });
    const paint = paintMat(false), paint2 = paintMat(false, THREE.DoubleSide), paintMirror = paintMat(true);
    const pileMat = paintMat(false), pileMirror = paintMat(true); pileMat.defines.PILE = 1; pileMirror.defines.PILE = 1;
    const SU = {
      uTime: PU.uTime, uLit: { value: L.bulbs }, uWaveZ: PU.uWaveZ, uHalo: { value: L.halo }, uFogD: { value: L.fog }, uRes: resU,
      uSea: HU.uSea, uFogKeep: { value: L.fogKeep }, uSprayT: { value: -1 },
      uPal: { value: lampCol.map(col3) }, uFlock: { value: V() }, uCore: { value: golden ? 2.2 : 5.2 }, uShade: { value: golden ? col3([1.1, 0.85, 0.7]) : col3([0.3, 0.34, 0.5]) },
    };
    const spriteMat = (solid, mirror) => new THREE.ShaderMaterial({
      uniforms: { ...SU, uSolid: { value: solid ? 1 : 0 }, uMirror: { value: mirror ? 1 : 0 } }, vertexShader: SPRITE_VS, fragmentShader: SPRITE_FS,
      transparent: true, depthWrite: false, blending: solid ? THREE.NormalBlending : THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: solid ? THREE.SrcAlphaFactor : THREE.OneFactor, blendDst: solid ? THREE.OneMinusSrcAlphaFactor : THREE.OneFactor });
    const glowMat = spriteMat(false, false), glowMirrorMat = spriteMat(false, true), solidMat = spriteMat(true, false);
    const spriteMesh = (geo, mat, order) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; return m; };

    // ----- instanced boxes: lattice, sleepers, pilings, posts (near the wheel first: those are mirrored) -----
    const nearM = [], nearC = [], farM = [], farC = [];
    const _mx = new THREE.Matrix4(), _X = V(), _Y = V(), _Z = V();
    const pushBox = (cx, cy, cz, col) => {
      _mx.elements[12] = cx; _mx.elements[13] = cy; _mx.elements[14] = cz;
      const near = cz < tide + 4 && Math.hypot(cx, cz - HERO_Z) < 238;
      const M = near ? nearM : farM, Cc = near ? nearC : farC;
      for (let i = 0; i < 16; i++) M.push(_mx.elements[i]);
      Cc.push(col[0], col[1], col[2]);
    };
    const boxBasis = (c, X, Y, Z, sx, sy, sz, col) => {
      _mx.set(X.x * sx, Y.x * sy, Z.x * sz, 0, X.y * sx, Y.y * sy, Z.y * sz, 0, X.z * sx, Y.z * sy, Z.z * sz, 0, 0, 0, 0, 1);
      pushBox(c.x, c.y, c.z, col);
    };
    const strut = (ax, ay, az, bx, by, bz, w, col, h = w) => {
      _Y.set(bx - ax, by - ay, bz - az); const len = _Y.length(); if (len < 1e-3) return; _Y.multiplyScalar(1 / len);
      if (Math.abs(_Y.z) > 0.92) _X.set(1, 0, 0); else _X.set(0, 0, 1);
      _Z.crossVectors(_X, _Y).normalize(); _X.crossVectors(_Y, _Z);
      _mx.set(_X.x * w, _Y.x * len, _Z.x * h, 0, _X.y * w, _Y.y * len, _Z.y * h, 0, _X.z * w, _Y.z * len, _Z.z * h, 0, 0, 0, 0, 1);
      pushBox((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, col);
    };
    const strutV = (a, b, w, col, h) => strut(a.x, a.y, a.z, b.x, b.y, b.z, w, col, h);
    const bulbs = new Sprites(), solids = new Sprites();
    let ci = 0; const nextCol = () => (ci++) % 3;
    const TIMBER = [0.105, 0.085, 0.075];
    const onDeck = (x, z) => x > PIER_N && x < PIER_S && z > 0 && z < PIER_L;
    const groundAt = (x, z, y) => (onDeck(x, z) && y > DECK + 0.6) ? DECK : (z > tide - 12 ? -2.2 : 0);

    // the coaster: bents, ledgers, diagonals, handrails, sleepers
    const gT = new Geo();                      // rails, chain, cars' static bits
    const P = V(), T = V(), R = V(), U = V(), S = V(), Pc = V(), a = V(), b = V();
    const shadowBases = [];
    {
      const railL = [], railR = [];
      for (let d = -40; d <= joinD + 0.01; d += 1.5) {
        frameAt(d, P, T, R, U); Pc.copy(P).addScaledVector(U, -RAIL_DROP);
        railL.push([Pc.x - R.x * 0.55, Pc.y - R.y * 0.55, Pc.z - R.z * 0.55]); railR.push([Pc.x + R.x * 0.55, Pc.y + R.y * 0.55, Pc.z + R.z * 0.55]);
        a.copy(Pc).addScaledVector(U, -0.16); boxBasis(a, R, U, T, 1.7, 0.12, 0.26, WHITE);
      }
      gT.col = mul(C.white, 0.9); gT.glow = [0.05, 0.06, 0.07];
      gT.tube(railL, 0.075, 4, { up: [0, 1, 0] }); gT.tube(railR, 0.075, 4, { up: [0, 1, 0] });
      await ctx.yield();
      // the lift chain in its trough
      frameAt(path.length * U_LIFT - 14, P, T, R, U); a.copy(P).addScaledVector(U, -RAIL_DROP - 0.02);
      frameAt(path.length * U_CREST - 6, P, T, R, U); b.copy(P).addScaledVector(U, -RAIL_DROP - 0.02);
      gT.col = [0.5, 0.52, 0.56]; gT.glow = [0, 0, 0]; gT.fx = 12; gT.beam([a.x, a.y, a.z], [b.x, b.y, b.z], 0.2, 0.08, { ref: [1, 0, 0] }); gT.fx = 0;

      const dLift = PL * U_LIFT - 16, dSlot = PL * U_SLOT, dOut = PL * U_OUT, dClimb = PL * U_CLIMB - 20;
      let prev = null, d = -38, k = 0;
      while (d < joinD - 1) {
        const thin = d > dClimb, sp = thin ? 6.5 : 4.5;
        frameAt(d, P, T, R, U); Pc.copy(P).addScaledVector(U, -RAIL_DROP);
        S.crossVectors(T, UP).normalize();
        const railY = Pc.y - 0.3, g = groundAt(Pc.x, Pc.z, railY), H = railY - g;
        const under = onDeck(Pc.x, Pc.z) && railY < DECK;
        let cur = null;
        if (H > 0.9) {
          const half = 1.75, bat = Math.min(2.2, H * 0.07), nL = Math.max(0, Math.floor((H - 1.5) / 6));
          cur = { n: nL, pts: [], d };
          for (let lv = 0; lv <= nL + 1; lv++) {
            const y = lv <= nL ? railY - lv * 6 : g, f = (railY - y) / H, o = half + bat * f;
            cur.pts.push([V(Pc.x - S.x * o, y, Pc.z - S.z * o), V(Pc.x + S.x * o, y, Pc.z + S.z * o)]);
          }
          const top = cur.pts[0], bot = cur.pts[nL + 1];
          strutV(top[0], bot[0], thin ? 0.17 : 0.2, WHITE); strutV(top[1], bot[1], thin ? 0.17 : 0.2, WHITE);
          for (let lv = 0; lv <= nL; lv++) {
            strutV(cur.pts[lv][0], cur.pts[lv][1], lv === 0 ? 0.13 : 0.15, WHITE);
            if (lv < nL || H - nL * 6 > 3) strutV(cur.pts[lv][(lv + k) % 2], cur.pts[lv + 1][(lv + k + 1) % 2], 0.11, WHITE);
          }
          if (prev && d - prev.d < 7) {
            const m = Math.min(prev.n, cur.n);
            for (let lv = 0; lv <= m; lv++) for (let sd = 0; sd < 2; sd++) {
              if (lv > 0) strutV(prev.pts[lv][sd], cur.pts[lv][sd], 0.13, WHITE);
              if (!thin && lv < m && (lv + k + sd) % 2 === 0) strutV(prev.pts[lv][sd], cur.pts[lv + 1][sd], 0.1, WHITE);
            }
            if (!thin && m >= 1 && H > 9 && !golden) for (let lv = 1; lv <= m; lv++) bulbs.add(cur.pts[lv][k % 2].x, cur.pts[lv][k % 2].y, cur.pts[lv][k % 2].z, nextCol(), 0.13, 0);
          }
          if (g === 0 && H > 6) shadowBases.push([Pc.x, Pc.z, H]);
        }
        // handrail and its bulbs (not under the deck)
        // (none over the crest, so the rails end in air, and none on the last climb, where the ring must stand clear)
        const dCr = d - PL * U_CREST, bare = (dCr > -5 && dCr < 15) || d > PL * (U_CLIMB + 0.012);
        if (!under && !bare && d < joinD - 4) {
          for (const sd of [-1, 1]) {
            a.copy(Pc).addScaledVector(R, sd * 2.0).addScaledVector(U, -0.25); b.copy(a).addScaledVector(U, 1.1);
            strutV(a, b, 0.06, WHITE);
            if (prev && prev.rail) { strutV(prev.rail[sd < 0 ? 0 : 1], b, 0.05, WHITE); S.copy(prev.rail[sd < 0 ? 0 : 1]).addScaledVector(U, -0.5); Pc.copy(b).addScaledVector(U, -0.5); strutV(S, Pc, 0.035, WHITE); Pc.copy(P).addScaledVector(U, -RAIL_DROP); S.crossVectors(T, UP).normalize(); }
            (cur || (cur = { n: -1, pts: [], d })).rail = cur.rail || []; cur.rail[sd < 0 ? 0 : 1] = b.clone();
            if (d > 6) bulbs.add(b.x, b.y + 0.12, b.z, (k + (sd > 0 ? 1 : 0)) % 3, 0.085, 3, ((d / 46) % 1 + 1) % 1);
          }
        } else if (!under && d < joinD - 4 && d > 6) {
          for (const sd of [-1, 1]) { a.copy(Pc).addScaledVector(R, sd * 1.0).addScaledVector(U, -0.1); bulbs.add(a.x, a.y, a.z, (k + (sd > 0 ? 1 : 0)) % 3, 0.075, 3, ((d / 46) % 1 + 1) % 1); }
        }
        // portal frames over the lift (every other bent) and the drop: lattice at arm's length
        if (d > dLift && d < dSlot - 9 && (dCr < -22 || dCr > 13) && (d > PL * U_CREST || k % 2 === 0)) {
          a.copy(Pc).addScaledVector(S, -2.15); b.copy(Pc).addScaledVector(S, 2.15);
          const yt = P.y + 3.4;
          strut(a.x, a.y, a.z, a.x, yt, a.z, 0.12, WHITE); strut(b.x, b.y, b.z, b.x, yt, b.z, 0.12, WHITE); strut(a.x, yt, a.z, b.x, yt, b.z, 0.12, WHITE);
          strut(a.x, yt, a.z, a.x + S.x * 0.9, yt - 1, a.z + S.z * 0.9, 0.08, WHITE); strut(b.x, yt, b.z, b.x - S.x * 0.9, yt - 1, b.z - S.z * 0.9, 0.08, WHITE);
        }
        prev = cur; d += sp; k++;
        if ((k & 15) === 0) await ctx.yield();
        void dOut;
      }
    }
    await ctx.yield();

    // the pier: deck with the slot the first drop dives through, pilings, cross-beams, fascia
    const gM = new Geo();                      // everything static that is not a box
    const boxAA = (g, x0, y0, z0, x1, y1, z1) => {
      g.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]); g.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
      g.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]); g.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
      g.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]); g.quad([x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]);
    };
    const SLOT0 = 243, SLOT1 = 263, pileNear = [], pileFar = [];
    gM.col = golden ? [0.42, 0.37, 0.33] : [0.3, 0.29, 0.33]; gM.fx = 6;
    boxAA(gM, PIER_N, DECK - 0.6, 0, TRACK_X - 3.6, DECK, PIER_L); boxAA(gM, TRACK_X - 3.6, DECK - 0.6, 0, PIER_S, DECK, SLOT0); boxAA(gM, TRACK_X - 3.6, DECK - 0.6, SLOT1, PIER_S, DECK, PIER_L);
    gM.fx = 0;
    for (const x of [PIER_N - 0.1, PIER_S + 0.1]) strut(x, DECK - 0.3, 0, x, DECK - 0.3, PIER_L, 0.3, WHITE, 0.9);
    strut(PIER_N, DECK - 0.3, PIER_L + 0.1, PIER_S, DECK - 0.3, PIER_L + 0.1, 0.3, WHITE, 0.9);
    for (let z = 3, j = 0; z < PIER_L; z += 5.5, j++) {
      for (let x = PIER_N; x <= PIER_S + 0.01; x += 6) {
        if (path.distanceTo(x, 4, z) < 2.8 || path.distanceTo(x, 7, z) < 2.8) continue;
        { const y0 = z > tide - 12 ? -2.4 : 0, near = z < tide + 4 && Math.hypot(x, z - HERO_Z) < 238; (near ? pileNear : pileFar).push(x + ((j * 7 + x) % 3 - 1) * 0.06, y0, z, DECK - 0.6 - y0, 0.9 + 0.2 * (((x * 13 + j * 29) % 7 + 7) % 7) / 7); }
        if (j % 2 === 0 && x < PIER_S - 1 && Math.abs(x + 3 - TRACK_X) > 1 && z > 30) strut(x, 1.4, z, x + 6, DECK - 1.2, z, 0.22, TIMBER);
      }
      if (path.distanceTo(TRACK_X, 7.1, z) > 3.3) strut(PIER_N, DECK - 0.95, z, PIER_S, DECK - 0.95, z, 0.4, TIMBER, 0.7);
      else { strut(PIER_N, DECK - 0.95, z, TRACK_X - 3.6, DECK - 0.95, z, 0.4, TIMBER, 0.7); }
      if ((j & 7) === 7) await ctx.yield();
    }
    await ctx.yield();

    // ----- geometry helpers for the midway -----
    const quadO = (g, A, B, Cq, D, o, fa, fb, fc, fd) => {
      const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = D[0] - A[0], vy = D[1] - A[1], vz = D[2] - A[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      if (nx * (A[0] - o[0]) + ny * (A[1] - o[1]) + nz * (A[2] - o[2]) >= 0) g.quad(A, B, Cq, D, fa, fb, fc, fd); else g.quad(D, Cq, B, A, fd, fc, fb, fa);
    };
    // surface of revolution about a vertical axis; rows = [y, radius, fx?]; colFn(i, j) sets the paint
    const lathe = (g, cx, cz, rows, n, colFn, rot = 0) => {
      for (let j = 0; j < rows.length - 1; j++) {
        const [y0, r0, f0 = 0] = rows[j], [y1, r1, f1 = 0] = rows[j + 1], o = [cx, (y0 + y1) / 2 - (r0 > r1 ? 0.3 : 0), cz];
        for (let i = 0; i < n; i++) {
          const a0 = rot + i / n * Math.PI * 2, a1 = rot + (i + 1) / n * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
          if (colFn) g.col = colFn(i, j);
          quadO(g, [cx + c0 * r0, y0, cz + s0 * r0], [cx + c1 * r0, y0, cz + s1 * r0], [cx + c1 * r1, y1, cz + s1 * r1], [cx + c0 * r1, y1, cz + s0 * r1], o, f0 || 0, f0 || 0, f1 || 0, f1 || 0);
        }
      }
    };
    const stripes = (A, B) => (i) => (i % 2 ? A : B);
    const mintP = mul(C.mint, 0.82), pinkP = mul(C.pink, 0.85), whiteP = mul(C.white, 0.78);
    const ringBulbs = (S_, cx, y, cz, r, n, size, mode = 0, col = -1) => { for (let i = 0; i < n; i++) { const an = i / n * Math.PI * 2; S_.add(cx + Math.cos(an) * r, y, cz + Math.sin(an) * r, col < 0 ? i % 3 : col, size, mode, i / n); } };
    const mkMesh = (g, mat) => { const m = new THREE.Mesh(g.build(), mat); m.frustumCulled = false; return m; };
    const lit = golden ? 0.15 : 1;

    // tents and stalls
    const HELTER_X = -51.5, taken = [[-55, 196, 10], [HELTER_X, 166, 6.5], [-56, 228, 8.5]];
    const tr = rng.fork('tents'), nTents = Math.round(40 * Math.min(1.15, density));
    for (let i = 0, tries = 0; i < nTents && tries < 600; tries++) {
      const x = tr.range(-64.5, -43.5), z = tr.range(10, 322), s = tr.range(0.8, 1.35);
      if (taken.some((q) => Math.hypot(x - q[0], z - q[1]) < q[2] + 3 * s)) continue;
      if (z > SLOT0 - 6 && z < SLOT1 + 6 && x > -45) continue;
      taken.push([x, z, 3 * s]); i++;
      const tint = i % 2 ? mintP : pinkP, n = tr.chance(0.3) ? 4 : 8, rot = tr.range(0, 1.5);
      gM.glow = mul(tint, 0.1 * lit);
      lathe(gM, x, z, [[DECK, 2.2 * s], [DECK + 2.3 * s, 2.2 * s]], n, stripes(tint, whiteP), rot);
      gM.glow = mul(tint, 0.2 * lit);
      lathe(gM, x, z, [[DECK + 2.15 * s, 3.0 * s, 0.3 + 0.6 * tr()], [DECK + 2.6 * s, 2.3 * s], [DECK + 4.5 * s, 0]], n, stripes(whiteP, tint), rot);
      gM.col = tint; gM.glow = [0, 0, 0];
      quadO(gM, [x, DECK + 4.5 * s, z], [x, DECK + 5.6 * s, z], [x + 1.2, DECK + 5.4 * s, z + 0.2], [x + 1.2, DECK + 5.1 * s, z + 0.2], [x, 0, z - 9], 0, 0, 0.8, 0.8);
      ringBulbs(bulbs, x, DECK + 2.2 * s, z, 3.05 * s, n, 0.12, 0, i % 3);
      bulbs.add(x, DECK + 4.7 * s, z, 2, 0.16, 0);
    }
    await ctx.yield();
    // helter-skelter: a candy cone wound with a thin lipped slide and a spiral of bulbs that runs upward
    {
      const [hx, hz] = [HELTER_X, 166], rows = [];
      for (let j = 0; j <= 8; j++) rows.push([DECK + j * 1.85, 3.2 - j * 0.2]);
      gM.glow = mul(C.pink, 0.08 * lit);
      lathe(gM, hx, hz, rows, 32, (i, j) => ((i + j * 4) % 8 < 4 ? whiteP : pinkP));
      gM.glow = mul(C.mint, 0.12 * lit);
      lathe(gM, hx, hz, [[DECK + 14.8, 2.5, 0.4], [DECK + 15.3, 1.9], [DECK + 18, 0]], 32, (i) => (i % 4 < 2 ? mintP : whiteP));
      lathe(gM, hx, hz, [[DECK + 14.8, 1.7], [DECK + 15.7, 1.7]], 32, () => mul(C.white, 0.5));
      const NS = 150, turns = 20;
      for (let i = 0; i < NS; i++) {
        const f0 = i / NS, f1 = (i + 1) / NS, a0 = f0 * turns, a1 = f1 * turns, y0 = DECK + 13.6 * (1 - f0) + 0.6, y1 = DECK + 13.6 * (1 - f1) + 0.6, r0 = 1.85 + f0 * 1.5, r1 = 1.85 + f1 * 1.5;
        const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), wS = 1.05, o = [hx, y0 - 30, hz];
        gM.col = mul(C.mint, 0.62); gM.glow = mul(C.mint, 0.05 * lit);
        quadO(gM, [hx + c0 * r0, y0, hz + s0 * r0], [hx + c0 * (r0 + wS), y0 + 0.08, hz + s0 * (r0 + wS)], [hx + c1 * (r1 + wS), y1 + 0.08, hz + s1 * (r1 + wS)], [hx + c1 * r1, y1, hz + s1 * r1], o);
        quadO(gM, [hx + c0 * r0, y0 - 0.08, hz + s0 * r0], [hx + c0 * (r0 + wS), y0, hz + s0 * (r0 + wS)], [hx + c1 * (r1 + wS), y1, hz + s1 * (r1 + wS)], [hx + c1 * r1, y1 - 0.08, hz + s1 * r1], [hx, y0 + 30, hz]);
        gM.col = whiteP;                                               // the lip
        quadO(gM, [hx + c0 * (r0 + wS), y0 - 0.02, hz + s0 * (r0 + wS)], [hx + c0 * (r0 + wS + 0.05), y0 + 0.42, hz + s0 * (r0 + wS + 0.05)], [hx + c1 * (r1 + wS + 0.05), y1 + 0.42, hz + s1 * (r1 + wS + 0.05)], [hx + c1 * (r1 + wS), y1 - 0.02, hz + s1 * (r1 + wS)], [hx, y0, hz]);
        quadO(gM, [hx + c0 * (r0 + wS), y0 - 0.02, hz + s0 * (r0 + wS)], [hx + c0 * (r0 + wS + 0.05), y0 + 0.42, hz + s0 * (r0 + wS + 0.05)], [hx + c1 * (r1 + wS + 0.05), y1 + 0.42, hz + s1 * (r1 + wS + 0.05)], [hx + c1 * (r1 + wS), y1 - 0.02, hz + s1 * (r1 + wS)], [hx + c0 * 30, y0, hz + s0 * 30]);
        if (i % 2 === 0) bulbs.add(hx + c0 * (r0 + wS + 0.1), y0 + 0.6, hz + s0 * (r0 + wS + 0.1), (i / 2) % 3 === 2 ? 2 : ((i / 2) % 3), 0.13, 3, f0 * 3 % 1);
      }
      bulbs.add(hx, DECK + 18.3, hz, 2, 0.25, 0);
    }
    await ctx.yield();
    // carousel (turns as one group; the horses rise and fall in the shader)
    const carousel = new THREE.Group(); carousel.position.set(-55, DECK, 196); scene.add(carousel);
    const carBulbs = new Sprites();
    {
      const g = new Geo(); g.glow = mul(C.pink, 0.16 * lit);
      lathe(g, 0, 0, [[0, 7], [0.45, 7], [0.45, 0]], 24, stripes(whiteP, mintP));
      lathe(g, 0, 0, [[0.45, 1.5], [4.4, 1.5]], 12, stripes(pinkP, whiteP));
      g.glow = mul(C.pink, 0.26 * lit);
      lathe(g, 0, 0, [[3.9, 7.7, 0.5], [4.4, 7.0], [5.4, 3.2], [7.2, 0]], 24, stripes(pinkP, whiteP));
      lathe(g, 0, 0, [[4.4, 7.0], [4.3, 1.5]], 24, () => mul(C.white, 0.5));
      for (let i = 0; i < 16; i++) {
        const an = i / 16 * Math.PI * 2, r = i % 2 ? 5.7 : 4.2, x = Math.cos(an) * r, z = Math.sin(an) * r;
        g.col = whiteP; g.fx = 0; g.beam([x, 0.45, z], [x, 4.35, z], 0.09, 0.09);
        g.col = [whiteP, mintP, pinkP][i % 3]; g.fx = 2 + (i * 0.37) % 1;
        const tx = -Math.sin(an), tz = Math.cos(an);
        g.beam([x - tx * 0.75, 1.9, z - tz * 0.75], [x + tx * 0.75, 1.9, z + tz * 0.75], 0.42, 0.62, { caps: true, ref: [0, 1, 0] });
        g.beam([x + tx * 0.6, 2.1, z + tz * 0.6], [x + tx * 1.0, 2.75, z + tz * 1.0], 0.26, 0.3, { caps: true, ref: [0, 1, 0] });
      }
      g.fx = 0; carousel.add(mkMesh(g, paint2));
      ringBulbs(carBulbs, 0, 4.0, 0, 7.75, 36, 0.13, 3); ringBulbs(carBulbs, 0, 4.5, 0, 1.6, 12, 0.12, 0); ringBulbs(carBulbs, 0, 5.5, 0, 3.2, 12, 0.11, 0, 2);
      carBulbs.add(0, 7.5, 0, 2, 0.24, 0);
      carousel.add(spriteMesh(carBulbs.build(), glowMat, 5));
      // six tubs of hydrangeas round it (they stay put)
      for (let i = 0; i < 6; i++) {
        const an = i / 6 * Math.PI * 2 + 0.3, x = -55 + Math.cos(an) * 9.2, z = 196 + Math.sin(an) * 9.2;
        gM.glow = [0, 0, 0]; lathe(gM, x, z, [[DECK, 0.5], [DECK + 0.7, 0.7]], 6, () => whiteP);
        gM.glow = mul(i % 2 ? C.pink : C.white, 0.05); lathe(gM, x, z, [[DECK + 0.7, 0.95, 0.5], [DECK + 1.3, 0.85, 0.7], [DECK + 1.7, 0]], 7, (q, j) => mul(i % 2 ? C.pink : C.white, 0.5 + 0.2 * ((q + j) % 2)));
      }
    }
    await ctx.yield();
    // chair-swing tower, or (other visits) a small lit observation tower with a cabin that climbs
    const spinner = new THREE.Group(); spinner.position.set(-56, DECK, 228); scene.add(spinner);
    const spinBulbs = new Sprites();
    gM.glow = mul(C.mint, 0.1 * lit);
    lathe(gM, -56, 228, [[DECK, 1.6], [DECK + 1.2, 0.9], [DECK + (swingTower ? 19 : 27), 0.7]], 10, (i, j) => (j === 2 && i % 2 ? mintP : whiteP));
    for (let j = 0; j < (swingTower ? 9 : 13); j++) bulbs.add(-56 + 0.95, DECK + 2 + j * 2, 228, j % 3, 0.13, 3, j / 9);
    {
      const g = new Geo(); g.glow = mul(C.mint, 0.22 * lit);
      if (swingTower) {
        lathe(g, 0, 0, [[18.6, 5.0, 0.4], [19.2, 5.2], [20.4, 4.2], [22, 0]], 16, stripes(mintP, whiteP));
        lathe(g, 0, 0, [[19.2, 5.2], [18.9, 0.8]], 16, () => mul(C.white, 0.5));
        for (let i = 0; i < 32; i++) {
          const an = i / 32 * Math.PI * 2, c = Math.cos(an), s = Math.sin(an), fl = 0.74 + 0.1 * Math.sin(i * 2.4), Lc = 8.5, r1 = 4.7 + Math.sin(fl) * Lc, y1 = 18.9 - Math.cos(fl) * Lc;
          g.col = mul(C.white, 0.6); g.glow = [0.03, 0.04, 0.04]; g.beam([c * 4.7, 18.9, s * 4.7], [c * r1, y1, s * r1], 0.07, 0.07);
          g.col = [mintP, pinkP, whiteP][i % 3]; g.glow = mul(g.col, 0.25 * lit); g.beam([c * r1, y1 - 0.2, s * r1], [c * (r1 + 0.1), y1 - 0.9, s * (r1 + 0.1)], 0.6, 0.6, { caps: true });
          if (i % 2 === 0) spinBulbs.add(c * r1, y1 - 1.0, s * r1, i % 3, 0.1, 0);
        }
        ringBulbs(spinBulbs, 0, 19.2, 0, 5.3, 32, 0.13, 3); spinBulbs.add(0, 22.3, 0, 2, 0.24, 0);
      } else {
        g.glow = mul(C.white, 0.5 * lit);
        lathe(g, 0, 0, [[-1.3, 2.2], [-1.0, 3.3], [1.0, 3.3], [1.4, 2.0], [1.5, 0.8]], 16, (i, j) => (j === 1 ? (i % 2 ? mul(C.mint, 0.9) : mul(C.white, 0.9)) : whiteP));
        ringBulbs(spinBulbs, 0, 1.1, 0, 3.4, 24, 0.13, 3); ringBulbs(spinBulbs, 0, -1.1, 0, 3.4, 24, 0.12, 0);
        bulbs.add(-56, DECK + 27.6, 228, 1, 0.3, 0);
      }
      spinner.add(mkMesh(g, paint2)); spinner.add(spriteMesh(spinBulbs.build(), glowMat, 5));
    }
    await ctx.yield();

    // ----- station (behind the entry), lamp standards, swagged strings, deck-edge bulbs, crowd -----
    for (let z = 100, i = 0; z < 126; z += 1.3, i++) {
      gM.col = i % 2 ? mul(C.mint, 0.6) : whiteP; gM.glow = mul(C.mint, 0.03 * lit);
      gM.quad([TRACK_X - 4.4, 22.3, z], [TRACK_X - 4.4, 22.3, z + 1.3], [TRACK_X - 0.5, 23.5, z + 1.3], [TRACK_X - 0.5, 23.5, z]); gM.quad([TRACK_X - 0.5, 23.5, z], [TRACK_X - 0.5, 23.5, z + 1.3], [TRACK_X + 3.4, 22.3, z + 1.3], [TRACK_X + 3.4, 22.3, z]);
      for (const x of [TRACK_X - 4.4, TRACK_X + 3.4]) gM.quad([x, 22.3, z], [x, 22.3, z + 1.3], [x, 21.85, z + 0.65], [x, 21.85, z + 0.65], 0, 0, 0.6, 0.6);
    }
    gM.col = whiteP; boxAA(gM, TRACK_X - 4.4, 16.25, 100, TRACK_X - 2.3, 16.4, 126);
    for (let z = 100.2; z < 126.5; z += 6.4) for (const x of [TRACK_X - 4.3, TRACK_X + 3.3]) strut(x, 16.4, z, x, 22.3, z, 0.12, WHITE);
    for (let x = TRACK_X - 4.2; x <= TRACK_X + 3.3; x += 1.25) bulbs.add(x, 21.9, 126.2, nextCol(), 0.13, 0);
    const swag = (ax, ay, az, bx, by, bz, n, sag) => { for (let i = 1; i < n; i++) { const f = i / n; bulbs.add(ax + (bx - ax) * f, ay + (by - ay) * f - sag * 4 * f * (1 - f), az + (bz - az) * f, nextCol(), 0.115, 1, f); } };
    for (let i = 0; i < 15; i++) {
      const z = 14 + i * 21.6;
      for (const x of [-65.7, -42.7]) { strut(x, DECK, z, x, DECK + 7.5, z, 0.2, WHITE); bulbs.add(x, DECK + 7.8, z, 2, 0.2, 0); if (i < 14) swag(x, DECK + 7.4, z, x, DECK + 7.4, z + 21.6, 10, 1.3); }
      if (!taken.slice(0, 3).some((q) => Math.abs(z - q[1]) < 7)) swag(-65.7, DECK + 7.4, z, -42.7, DECK + 7.4, z, 12, 1.5);
    }
    for (const x of [PIER_N - 0.2, PIER_S + 0.2]) {
      strut(x, DECK + 1.1, 0, x, DECK + 1.1, x > -40 ? SLOT0 - 2 : PIER_L, 0.09, WHITE);
      for (let z = 2; z < PIER_L; z += 2.2) {
        if (path.distanceTo(x, DECK + 1.2, z) > 4.5) bulbs.add(x, DECK + 1.25, z, nextCol(), 0.12, 0);
        if (path.distanceTo(x, DECK - 0.8, z) > 4.5) bulbs.add(x + (x > -40 ? 0.15 : -0.15), DECK - 0.85, z + 1.1, nextCol(), 0.12, 0);
      }
    }
    for (let x = PIER_N; x <= PIER_S; x += 2.2) bulbs.add(x, DECK + 1.25, PIER_L + 0.2, nextCol(), 0.13, 0);
    {
      const cr = rng.fork('crowd'), n = Math.round(3000 * density * detail);
      for (let i = 0; i < n; i++) {
        const x = cr.range(-66.3, -41.2), z = 5 + 321 * Math.pow(cr(), 0.85);
        if ((z > SLOT0 - 4 && z < SLOT1 + 4 && x > -44) || Math.hypot(x + 55, z - 196) < 8) continue;
        bulbs.add(x, DECK + 1.0, z, cr.int(0, 2), 0.42, 2, cr());
      }
    }
    await ctx.yield();
    // ----- the town along the promenade, dunes and marram, the headland and its lighthouse -----
    {
      const tb = rng.fork('town'), tone = golden ? 0.78 : 0.55, GW = 2.4, ST = 3.2;
      // terraced seafront: painted fronts in faded mint, pink, white and powder blue under slate roofs
      const fronts = [[0.6, 0.78, 0.7], [0.82, 0.6, 0.66], [0.8, 0.8, 0.78], [0.62, 0.7, 0.8], [0.84, 0.72, 0.74], [0.7, 0.82, 0.78]];
      const roofC = golden ? [0.3, 0.29, 0.33] : [0.075, 0.08, 0.11], brick = golden ? [0.36, 0.27, 0.25] : [0.09, 0.075, 0.085], trim = mul(C.white, golden ? 0.7 : 0.42);
      const tri = (A, B, Cc) => gM.quad(A, B, Cc, Cc);
      for (let xi = -260, hn = 0; xi < 260; hn++) {
        const nb = tb.int(3, 6), w = nb * GW, x0 = xi * GW, x1 = x0 + w, xm = (x0 + x1) / 2, st = tb.chance(0.14) ? 5 : tb.int(3, 4), H = st * ST;
        const zf = -25 - tb.int(0, 2) * 1.1, dep = 12, zb = zf - dep, zr = zf - dep / 2, gableFront = nb <= 4 && tb.chance(0.38);
        const colW = mul(tb.pick(fronts), tone * tb.range(0.86, 1)), lamp = lampCol[tb.int(0, 2)], yr = gableFront ? H + w * 0.42 : H + 2.7;
        gM.fx = 8; gM.col = colW; gM.glow = mul(lamp, 0.34 * lit);
        gM.quad([x0, 0, zf], [x1, 0, zf], [x1, ST, zf], [x0, ST, zf]);
        gM.glow = mul(lamp, 0.035 * lit);
        gM.quad([x0, ST, zf], [x1, ST, zf], [x1, H, zf], [x0, H, zf]);
        gM.quad([x0, 0, zb], [x0, 0, zf], [x0, H, zf], [x0, H, zb]); gM.quad([x1, 0, zf], [x1, 0, zb], [x1, H, zb], [x1, H, zf]);
        // bay windows climbing the front
        const bays = tb.chance(0.6) ? (nb >= 5 ? [1, nb - 2] : [tb.int(0, nb - 1)]) : [];
        for (const c of bays) {
          const bx = x0 + c * GW + 0.22, bt = (st - 1) * ST;
          gM.fx = 8; gM.col = mul(colW, 1.08); boxAA(gM, bx, 0, zf, bx + GW - 0.44, bt, zf + 0.85);
          gM.fx = 9; gM.col = roofC; gM.quad([bx - 0.1, bt, zf + 0.95], [bx + GW - 0.34, bt, zf + 0.95], [bx + GW - 0.34, bt + 0.8, zf], [bx - 0.1, bt + 0.8, zf]);
        }
        // cornice, roof, gables, chimneys
        gM.fx = 0; gM.col = trim; gM.glow = [0, 0, 0]; boxAA(gM, x0 - 0.12, H - 0.3, zf, x1 + 0.12, H, zf + 0.32);
        if (gableFront) {
          gM.col = colW; gM.glow = mul(lamp, 0.02 * lit); tri([x0, H, zf], [x1, H, zf], [xm, yr, zf]);
          gM.col = trim; gM.glow = [0, 0, 0]; gM.quad([x0 - 0.2, H - 0.1, zf + 0.3], [xm, yr + 0.12, zf + 0.3], [xm, yr - 0.3, zf + 0.3], [x0 + 0.25, H - 0.1, zf + 0.3]); gM.quad([xm, yr + 0.12, zf + 0.3], [x1 + 0.2, H - 0.1, zf + 0.3], [x1 - 0.25, H - 0.1, zf + 0.3], [xm, yr - 0.3, zf + 0.3]);
          gM.fx = 9; gM.col = roofC;
          gM.quad([x0, H, zb], [x0, H, zf + 0.3], [xm, yr, zf + 0.3], [xm, yr, zb]); gM.quad([x1, H, zf + 0.3], [x1, H, zb], [xm, yr, zb], [xm, yr, zf + 0.3]);
        } else {
          gM.fx = 9; gM.col = roofC;
          gM.quad([x0, H, zf + 0.3], [x1, H, zf + 0.3], [x1, yr, zr], [x0, yr, zr]); gM.quad([x1, H, zb], [x0, H, zb], [x0, yr, zr], [x1, yr, zr]);
          gM.fx = 0; gM.col = colW; tri([x0, H, zb], [x0, H, zf], [x0, yr, zr]); tri([x1, H, zf], [x1, H, zb], [x1, yr, zr]);
          if (nb >= 4 && tb.chance(0.5)) {                                 // a dormer or two in the slates
            for (const dx of nb >= 5 ? [-w * 0.24, w * 0.24] : [0]) {
              const a0 = xm + dx - 0.9, a1 = xm + dx + 0.9, zd = zf - 1.2;
              gM.fx = 0; gM.col = colW; gM.glow = mul(lamp, 0.3 * lit); gM.quad([a0, H + 0.4, zd], [a1, H + 0.4, zd], [a1, H + 1.7, zd], [a0, H + 1.7, zd]);
              gM.glow = [0, 0, 0]; gM.fx = 9; gM.col = roofC; gM.quad([a0 - 0.15, H + 1.7, zd + 0.15], [a1 + 0.15, H + 1.7, zd + 0.15], [a1 + 0.15, H + 2.2, zr + 1.2], [a0 - 0.15, H + 2.2, zr + 1.2]);
            }
          }
        }
        gM.fx = 0; gM.col = brick; gM.glow = [0, 0, 0];
        for (const cx of nb >= 5 ? [x0 + 0.5, x1 - 1.4] : [hn % 2 ? x0 + 0.5 : x1 - 1.4]) {
          const cz = gableFront ? zf - 4 : zr, cy = gableFront ? H + (0.5 - Math.abs(cx + 0.45 - xm) / w) * 2 * (yr - H) : yr;
          boxAA(gM, cx, cy - 1.2, cz - 0.45, cx + 0.9, cy + 1.5, cz + 0.45);
          gM.col = mul(brick, 1.5); boxAA(gM, cx + 0.12, cy + 1.5, cz - 0.16, cx + 0.42, cy + 2.0, cz + 0.16); boxAA(gM, cx + 0.5, cy + 1.5, cz - 0.16, cx + 0.8, cy + 1.95, cz + 0.16); gM.col = brick;
        }
        // a striped awning over some of the shop fronts, lifting in the breeze
        if (tb.chance(0.42)) {
          const tint = hn % 2 ? mintP : pinkP;
          for (let xs = x0 + 0.3, q = 0; xs < x1 - 0.6; xs += 0.6, q++) {
            gM.col = mul(q % 2 ? tint : whiteP, golden ? 1 : 0.75); gM.glow = mul(lamp, 0.22 * lit);
            gM.quad([xs, 2.25, zf + 1.75], [xs + 0.6, 2.25, zf + 1.75], [xs + 0.6, 3.05, zf + 0.06], [xs, 3.05, zf + 0.06], 0.3 + 0.5 * tb(), 0.5, 0, 0);
          }
        }
        xi += nb + (tb.chance(0.1) ? 1 : 0);
        if ((hn & 15) === 15) await ctx.yield();
      }
      await ctx.yield();
      // sea wall, promenade and its lamp standards with the bulb string swagged between them
      gM.fx = 0; gM.glow = [0, 0, 0]; gM.col = golden ? [0.5, 0.48, 0.46] : [0.2, 0.2, 0.26];
      boxAA(gM, -640, 0, -22, PIER_N, 3.1, -18.5); boxAA(gM, PIER_S, 0, -22, 640, 3.1, -18.5);
      gM.col = golden ? [0.42, 0.37, 0.33] : [0.3, 0.29, 0.33]; gM.fx = 6; boxAA(gM, PIER_N, DECK - 0.6, -24, PIER_S, DECK, 0); gM.fx = 0;
      for (let x = -616; x < 620; x += 6.5) if (x < PIER_N - 2 || x > PIER_S + 2) bulbs.add(x, 6.2 + 0.7 * Math.cos(x * 0.24), -18.6, nextCol(), 0.14, 1, (x * 0.13) % 1 + 1);
      for (let k = -23; k <= 23; k++) { const x = k * Math.PI * 2 / 0.24; if (x < PIER_N - 2 || x > PIER_S + 2) { strut(x, 3.1, -18.9, x, 7.15, -18.9, 0.14, WHITE); bulbs.add(x, 7.4, -18.9, 2, 0.22, 0); } }
      // a low hill behind the roofs, with a scatter of houses and their lights
      {
        const hillC = golden ? [0.21, 0.25, 0.17] : [0.04, 0.05, 0.075], HX0 = -1560, HX1 = 1020, HS = 60;
        const hh = (x) => Math.max(9, 36 + 26 * ctx.noise.n2(x * 0.0016, 9.3) + 9 * ctx.noise.n2(x * 0.006, 2.2)) * Math.min(1, (x - HX0) / 300, (HX1 - x) / 300);
        const rowsH = [[-50, 0.12], [-150, 0.5], [-300, 0.86], [-460, 1]];
        const hy = (x, z) => { for (let j = 0; j < 3; j++) if (z >= rowsH[j + 1][0]) { const f = (rowsH[j][0] - z) / (rowsH[j][0] - rowsH[j + 1][0]); return hh(x) * (rowsH[j][1] + (rowsH[j + 1][1] - rowsH[j][1]) * f); } return hh(x); };
        for (let x = HX0; x < HX1; x += HS) {
          const h0 = hh(x), h1 = hh(x + HS);
          for (let j = 0; j < 3; j++) {
            const [za, ka] = rowsH[j], [zc, kc] = rowsH[j + 1];
            gM.col = mul(hillC, 1 - 0.14 * j + 0.1 * ctx.noise.n2(x * 0.01, j * 3.3)); gM.glow = [0, 0, 0]; gM.fx = 0;
            gM.quad([x, h0 * ka, za], [x + HS, h1 * ka, za], [x + HS, h1 * kc, zc], [x, h0 * kc, zc]);
          }
        }
        for (let i = 0; i < 46; i++) {
          const x = tb.range(-1150, 760), z = tb.range(-380, -95), y = hy(x, z) - 0.4, hw = tb.range(3.6, 6), colW = mul(tb.pick(fronts), tone * 0.9);
          gM.fx = 8; gM.col = colW; gM.glow = mul(lampCol[i % 3], 0.05 * lit); gM.quad([x - hw, y, z], [x + hw, y, z], [x + hw, y + 6.4, z], [x - hw, y + 6.4, z]);
          gM.fx = 9; gM.col = roofC; gM.glow = [0, 0, 0]; gM.quad([x - hw - 0.3, y + 6.4, z + 0.3], [x + hw + 0.3, y + 6.4, z + 0.3], [x + hw + 0.3, y + 9, z - 4], [x - hw - 0.3, y + 9, z - 4]);
          bulbs.add(x + tb.range(-hw, hw) * 0.6, y + 2.2, z + 0.4, i % 3, 0.42, 0);
        }
        for (let i = 0; i < 70; i++) { const x = tb.range(-1250, 820), z = tb.range(-430, -70); bulbs.add(x, hy(x, z) + 1.5, z, tb.chance(0.6) ? 2 : i % 2, tb.range(0.25, 0.4), 0); }
      }
      gM.fx = 0; gM.glow = [0, 0, 0];
      await ctx.yield();
      const sandC = golden ? [0.62, 0.52, 0.4] : [0.36, 0.33, 0.3], grassC = golden ? [0.36, 0.4, 0.2] : [0.2, 0.27, 0.17];
      const dh = (x) => 1.5 + 1.0 * ctx.noise.n2(x * 0.02, 3.1) + 0.4 * ctx.noise.n2(x * 0.09, 7.7);
      for (let x = -640; x < 640; x += 8) {
        if (((x + 640) & 127) === 0) await ctx.yield();
        if (x + 8 > PIER_N - 1 && x < PIER_S + 1) continue;
        const h0 = dh(x), h1 = dh(x + 8);
        gM.col = sandC; gM.glow = [0, 0, 0];
        gM.quad([x, 0, -1.5], [x + 8, 0, -1.5], [x + 8, h1, -9], [x, h0, -9]); gM.quad([x, h0, -9], [x + 8, h1, -9], [x + 8, h1 * 0.8, -18.5], [x, h0 * 0.8, -18.5]);
        const nt = Math.round(8 * density);
        for (let i = 0; i < nt; i++) {
          const tx = x + tb() * 8, tz = tb.range(-16, -3), f = Math.min(1, (-1.5 - tz) / 7.5), ty = (h0 + (h1 - h0) * (tx - x) / 8) * (tz > -9 ? f : 1 - 0.2 * (-9 - tz) / 9.5) - 0.05, hh = tb.range(0.7, 1.3), ln = tb.range(-0.3, 0.5);
          gM.col = mul(grassC, tb.range(0.7, 1.2)); const fx = 0.2 + 0.7 * tb();
          for (const o of [-0.22, 0, 0.22]) { gM.v(tx + o - 0.07, ty, tz, 0, 0.6, 0.8, 0); gM.v(tx + o + 0.07, ty, tz, 0, 0.6, 0.8, 0); gM.v(tx + o * 2.4 + ln, ty + hh * (1 - Math.abs(o)), tz + 0.1, 0, 0.6, 0.8, fx); }
        }
      }
      gM.col = golden ? [0.2, 0.22, 0.2] : [0.05, 0.06, 0.09]; lathe(gM, 1500, -300, [[0, 430], [24, 260], [42, 110], [50, 0]], 18);
      gM.col = whiteP; gM.glow = mul(C.white, 0.05); lathe(gM, 1500, -300, [[48, 5.5], [74, 3.6], [75, 5], [78, 5], [82, 0]], 8);
      bulbs.add(1500, 76.5, -300, 2, 2.4, 0);
    }
    const beam = new THREE.Group(); beam.position.set(1500, 76.5, -300); scene.add(beam);
    {
      const bg = new THREE.BufferGeometry(), k = golden ? 0.05 : 0.5;
      bg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 900, -40, 60, 900, 40, -60, 0, 0, 0, -900, 40, 60, -900, -40, -60], 3));
      bg.setAttribute('color', new THREE.Float32BufferAttribute([k, k, k * 1.1, 0, 0, 0, 0, 0, 0, k, k, k * 1.1, 0, 0, 0, 0, 0, 0], 3));
      const bm = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      bm.frustumCulled = false; bm.renderOrder = 4; beam.add(bm);
    }
    await ctx.yield();
    // ----- a paddle steamer hung with bulbs crossing the bay, and the fireworks barge -----
    const steamer = new THREE.Group(); const steamDir = rng.sign(), steamOff = rng.range(0, 900), steamZ = rng.range(470, 560);
    if (steamerOn) {
      const g = new Geo(), sb = new Sprites();
      g.col = whiteP; g.glow = mul(C.white, 0.06); boxAA(g, -22, 0, -4.4, 22, 3.6, 4.4); lathe(g, 24, 0, [[0, 3], [3.6, 4.4]], 3, null, Math.PI);
      g.glow = mul(C.white, 0.55 * lit); boxAA(g, -16, 3.6, -3.5, 13, 6.4, 3.5);
      g.glow = mul(C.white, 0.06); boxAA(g, -17, 6.4, -3.8, 14, 6.7, 3.8); boxAA(g, -5, 0.3, 4.4, 5, 5.6, 6); boxAA(g, -5, 0.3, -6, 5, 5.6, -4.4);
      g.glow = mul(C.pink, 0.2); lathe(g, -3, 0, [[6.7, 1.3], [13, 1.2]], 8, stripes(pinkP, whiteP));
      steamer.add(mkMesh(g, paint2));
      const sw = (ax, ay, bx, by, n) => { for (let i = 0; i <= n; i++) { const f = i / n; sb.add(ax + (bx - ax) * f, ay + (by - ay) * f - 5 * f * (1 - f), 0, i % 3, 0.2, 1, f); } };
      sw(25, 5, -3, 14.5, 14); sw(-3, 14.5, -22, 5, 12);
      for (let x = -21; x <= 21; x += 2.4) for (const z of [-4.5, 4.5]) sb.add(x, 4.1, z, (Math.round(x / 2.4) + 9) % 3, 0.18, 0);
      steamer.add(spriteMesh(sb.build(), glowMat, 5)); scene.add(steamer);
    }
    {
      // the fireworks barge: a low black hull with a raked bow, a wheelhouse, a rack of mortars and a string of lamps
      const hullC = golden ? [0.16, 0.15, 0.17] : [0.07, 0.07, 0.09];
      gM.fx = 0; gM.col = hullC; gM.glow = [0, 0, 0]; boxAA(gM, -62, 0.2, 425, -40, 2.3, 435);
      for (const [xa, xt] of [[-40, -34.5], [-62, -65.5]]) {
        quadO(gM, [xa, 0.2, 425], [xa, 2.3, 425], [xt, 2.6, 430], [xt, 1.0, 430], [-51, 1, 440]); quadO(gM, [xa, 0.2, 435], [xa, 2.3, 435], [xt, 2.6, 430], [xt, 1.0, 430], [-51, 1, 420]);
        quadO(gM, [xa, 2.3, 425], [xa, 2.3, 435], [xt, 2.6, 430], [xt, 2.6, 430], [-51, -20, 430]);
      }
      gM.col = mul(C.white, golden ? 0.6 : 0.3); boxAA(gM, -62.2, 2.3, 424.8, -39.8, 2.5, 425.1); boxAA(gM, -62.2, 2.3, 434.9, -39.8, 2.5, 435.2);
      gM.col = whiteP; gM.glow = mul(C.white, 0.3 * lit); boxAA(gM, -60.5, 2.3, 427.6, -56.8, 4.7, 432.4);
      gM.col = mul(C.mint, 0.5); gM.glow = [0, 0, 0]; boxAA(gM, -60.9, 4.7, 427.2, -56.4, 4.95, 432.8);
      for (let i = 0; i < 9; i++) { const x = -54 + i * 1.5, ln = (i % 3 - 1) * 0.22; strut(x, 2.3, 430, x + ln, 4.0 + (i % 2) * 0.25, 430 + 0.2, 0.34, [0.12, 0.12, 0.15]); }
      strut(-54.6, 3.1, 430.5, -41.4, 3.1, 430.5, 0.1, [0.3, 0.3, 0.34]); strut(-37.5, 2.5, 430, -37.5, 7.4, 430, 0.1, WHITE); strut(-63.4, 2.5, 430, -63.4, 6.2, 430, 0.1, WHITE);
      bulbs.add(-37.5, 7.6, 430, 2, 0.2, 0); bulbs.add(-63.4, 6.4, 430, 1, 0.18, 0);
      for (let i = 1; i < 12; i++) { const f = i / 12; bulbs.add(-37.5 - 25.9 * f, 7.4 - 1.2 * f - 4.2 * f * (1 - f), 430, i % 3, 0.15, 1, f); }
    }

    await ctx.yield();
    // ----- balloons escaping, kites (golden afternoon), sanderlings at the tide's edge, firework smoke -----
    {
      const br = rng.fork('air');
      for (let c = 0; c < 7; c++) {
        const bx = br.range(-62, -46), bz = br.range(150, 250), ph = br(), n = c < 3 ? 9 : 2;
        for (let i = 0; i < n; i++) solids.add(bx + br.range(-0.9, 0.9), DECK + 2 + br.range(0, 1.6), bz + br.range(-0.9, 0.9), i % 2, br.range(0.26, 0.34), 4, ph + i * 0.0015);
      }
      if (golden) {
        for (let i = 0, t = 0; i < Math.round(100 * density) && t < 900; t++) {
          const x = br.range(-300, 330), z = br.range(15, tide - 10), y = br.range(16, 78);
          if (path.distanceTo(x, y, z) < 16 || Math.hypot(x, z - HERO_Z) < 40 || onDeck(x, z)) continue;
          { let hit = false; for (let q = 1; q < 8 && !hit; q++) { const f = q / 8; hit = path.distanceTo(x - y * 0.55 * (1 - f), 1.2 + (y - 1.2) * f - y * 0.16 * Math.sin(f * Math.PI), z + y * 0.3 * (1 - f)) < 13; } if (hit) continue; }   // nor may its string cross the track
          const kp = br(); solids.add(x, y, z, br.int(0, 2), br.range(1.0, 1.9), 5, kp); solids.add(x, y, z, 2, y, 8, kp); i++;
        }
      } else for (let i = 0; i < 16; i++) bulbs.add(br.range(-90, 60), br.range(40, 95), br.range(-140, -20), 2, br.range(9, 17), 7, br());
      for (let i = 0; i < 200; i++) solids.add(TRACK_X + 76 + br.gauss() * 13, 0.14, tide - 7 + br.gauss() * 1.6, 2, 0.1, 6, br());
    }
    await ctx.yield();

    // ----- fireworks: the finale behind the wheel (site A) and the barge off the pier end (site B) -----
    const NA = 7, NB = 4, NK = 3, FWP = 5.6, FWR = 1.0, fwPh = [];
    let fwA = null, fwB = null;
    if (L.fwGain > 0) {
      const SPK = Math.round(300 * (0.5 + 0.5 * detail)), n = (NA + NB + NK) * SPK, fr = rng.fork('fw');
      const sp = new Float32Array(n * 4), bu = new Float32Array(n * 4);
      for (let bI = 0; bI < NA + NB + NK; bI++) {
        const ph = ((bI < NA ? bI / NA : (bI - NA + 0.5) / NB) + fr() * 0.06) % 1; if (bI < NA + NB) fwPh.push(ph);
        for (let i = 0; i < SPK; i++) {
          const q = (bI * SPK + i) * 4, y = fr() * 2 - 1, an = fr() * 6.283, rr = Math.sqrt(1 - y * y);
          sp[q] = Math.cos(an) * rr; sp[q + 1] = y; sp[q + 2] = Math.sin(an) * rr; sp[q + 3] = 0.72 + 0.28 * Math.pow(fr(), 0.3);
          bu[q] = bI; bu[q + 1] = ph; bu[q + 2] = fr(); bu[q + 3] = fr();
        }
      }
      const fwGeo = quadGeo();
      fwGeo.setAttribute('aSpark', new THREE.InstancedBufferAttribute(sp, 4)); fwGeo.setAttribute('aBurst', new THREE.InstancedBufferAttribute(bu, 4)); fwGeo.instanceCount = n;
      const FU = { uTime: PU.uTime, uPeriod: { value: FWP }, uRise: { value: FWR }, uGain: { value: L.fwGain }, uNA: { value: NA }, uNL: { value: NA + NB }, uSea: HU.uSea, uFogD: { value: L.fog },
        uKeyPos: { value: [V(-52, 96, 442), V(74, 100, -40), V(-52, 128, -95)] }, uKeyTau: { value: [-1, -1, -1] },
        uSiteA: { value: V(0, 66, HERO_Z - 150) }, uAreaA: { value: V(130, 30, 50) }, uSiteB: { value: V(-50, 78, 432) }, uAreaB: { value: V(80, 26, 50) },
        uWind: { value: V(-2.6, 0, -1.2) }, uPal: SU.uPal };
      const fwMat = (mirror) => new THREE.ShaderMaterial({ uniforms: { ...FU, uMirror: { value: mirror ? 1 : 0 } }, vertexShader: FW_VS, fragmentShader: FW_FS, transparent: true, depthWrite: false,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, side: THREE.DoubleSide });
      fwA = spriteMesh(fwGeo, fwMat(false), 6); fwB = spriteMesh(fwGeo, fwMat(true), 1.5); fwA.userData.FU = FU;
      scene.add(fwA, fwB);
    }

    await ctx.yield();
    // ----- breakers unrolling along the bar, light blades under the deck, the lattice's long shadows -----
    {
      const g = new THREE.PlaneGeometry(3200, 30, 1, 1); g.rotateX(-Math.PI / 2); g.translate(0, 0.11, tide - 13);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: PU.uTime, uTide: { value: tide }, uCol: { value: golden ? col3([0.95, 0.85, 0.75]) : col3([0.3, 0.38, 0.5]) }, uFlash: PU.uFlash },
        vertexShader: 'varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
        fragmentShader: /* glsl */`
uniform float uTime, uTide, uFlash; uniform vec3 uCol; varying vec3 vW;
#include <fog_pars_fragment>
float hh(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(hh(i), hh(i + vec2(1, 0)), f.x), mix(hh(i + vec2(0, 1)), hh(i + vec2(1, 1)), f.x), f.y); }
void main(){
  float zz = uTide - vW.z, a = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i), ph = fract(uTime*0.055 + fi/3.0 + 0.13*sin(vW.x*0.004 + fi));
    float pos = ph*22.0 + sin(vW.x*0.045 + fi*2.1)*1.6 + sin(vW.x*0.011 + fi)*3.0;
    float w = 0.5 + 1.6*ph, d = zz - pos;
    a += (1.0 - smoothstep(0.0, w, abs(d)))*(1.0 - ph)*(1.0 - ph)*(0.45 + 0.55*vn(vec2(vW.x*0.35, zz*0.9 + fi*7.0)));
    a += (1.0 - smoothstep(-4.0, 0.0, d))*smoothstep(-9.0, -4.0, d)*0.07*(1.0 - ph);
  }
  a *= 1.0 - smoothstep(12.0, 15.0, abs(zz - 13.0));
  gl_FragColor = vec4(uCol*(1.0 + uFlash*3.0), clamp(a, 0.0, 0.9));
  #include <fog_fragment>
}`, transparent: true, depthWrite: false, fog: true }));
      m.renderOrder = 3; m.frustumCulled = false; scene.add(m);

      const pos = [], colr = [];
      for (let z = 270, i = 0; z < PIER_L - 3; z += 9.6, i++) {
        const c = mul(i % 2 ? C.pink : C.mint, 0.065 * (golden ? 0.5 : 1)), z1 = z + 1.5;
        pos.push(PIER_N, DECK - 0.7, z, PIER_S, DECK - 0.7, z, PIER_S, 2.5, z1, PIER_N, DECK - 0.7, z, PIER_S, 2.5, z1, PIER_N, 2.5, z1);   // they die out above the wave tops
        colr.push(...c, ...c, 0, 0, 0, ...c, 0, 0, 0, 0, 0, 0);
      }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
      const blades = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      blades.renderOrder = 4; blades.frustumCulled = false; scene.add(blades);

      if (golden && shadowBases.length) {
        const sd = sky.sunDirection, hl = Math.hypot(sd.x, sd.z) || 1, dx = -sd.x / hl, dz = -sd.z / hl, kk = Math.min(7, hl / Math.max(0.05, sd.y)), sp = [];
        for (const [x, z, H] of shadowBases) for (const o of [-1.9, 1.9]) {
          const len = Math.min(170, H * kk), x0 = x + o * dz, z0 = z - o * dx, w = 0.45;
          sp.push(x0 - dz * w, 0.09, z0 + dx * w, x0 + dz * w, 0.09, z0 - dx * w, x0 + dx * len + dz * w, 0.09, z0 + dz * len - dx * w,
            x0 - dz * w, 0.09, z0 + dx * w, x0 + dx * len + dz * w, 0.09, z0 + dz * len - dx * w, x0 + dx * len - dz * w, 0.09, z0 + dz * len + dx * w);
        }
        const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
        const sm = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: 0x1a1430, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide }));
        sm.renderOrder = 3; sm.frustumCulled = false; scene.add(sm);
      }
    }

    await ctx.yield();
    // ----- the trains: ours (the camera sits in its front seat) and the pink one that runs ahead -----
    const buildCar = (body, c1, c2, riders) => {
      const g = new Geo(); g.col = body; g.glow = mul(body, 0.07);
      g.beam([0, -1.0, -0.85], [0, -1.2, -2.9], 1.4, 0.7, { taper: 0.5, caps: true, ref: [0, 1, 0] });
      g.beam([0, -1.28, -0.85], [0, -1.28, 1.75], 1.4, 0.75, { caps: true, ref: [0, 1, 0] });
      for (const sx of [-0.72, 0.72]) g.beam([sx, -0.75, -0.85], [sx, -0.75, 1.75], 0.09, 0.5, { caps: true, ref: [0, 1, 0] });
      // seat back and tail panel only on the train we watch: ours must stay open behind the eye, which arrives through it
      if (riders) { g.beam([0, -0.45, 0.62], [0, -0.45, 0.8], 1.3, 1.2, { caps: true, ref: [0, 1, 0] }); g.beam([0, -0.6, 1.66], [0, -0.6, 1.8], 1.4, 0.9, { caps: true, ref: [0, 1, 0] }); }
      const top = (z) => -0.65 - 0.38 * ((-0.85 - z) / 2.05) + 0.012, hw = (z) => 0.7 * (1 - 0.5 * (-0.85 - z) / 2.05);
      const strip = (z0, z1, x00, x01, x10, x11, col) => { g.col = col; g.glow = mul(col, 0.16); g.quad([x00, top(z0), z0], [x01, top(z0), z0], [x11, top(z1), z1], [x10, top(z1), z1]); };
      strip(-2.25, -2.75, -0.3, 0.3, -0.12, 0.12, c1); strip(-1.9, -2.25, -0.14, 0.14, -0.3, 0.3, c1);          // the comet's head
      strip(-1.0, -1.9, -hw(-1.0) * 0.9, -hw(-1.0) * 0.35, -0.14, 0.14, c2); strip(-1.0, -1.6, hw(-1.0) * 0.5, hw(-1.0) * 0.85, 0.02, 0.1, c2);   // its tail
      g.col = [0.62, 0.65, 0.7]; g.glow = [0, 0, 0]; g.fx = 4;
      g.tube([[-0.68, -0.6, -0.86], [-0.4, -0.5, -0.97], [0, -0.48, -1.0], [0.4, -0.5, -0.97], [0.68, -0.6, -0.86]], 0.04, 6, { up: [0, 1, 0] });
      for (const sx of [-0.42, 0.42]) g.tube([[sx, -0.74, -1.2], [sx, -0.6, -1.27], [sx, -0.6, -1.45], [sx, -0.78, -1.52]], 0.022, 5, { up: [1, 0, 0] });
      g.tube([[0.5, -0.98, -2.3], [0.5, -0.76, -2.3]], 0.015, 4, { up: [1, 0, 0] });
      g.fx = 0;
      if (riders) { g.col = [0.2, 0.18, 0.25]; g.glow = mul(C.pink, 0.05); for (const sx of [-0.33, 0.33]) g.beam([sx, -0.6, 0.25], [sx, 0.12, 0.3], 0.4, 0.34, { caps: true }); }
      return g;
    };
    const bodyCol = [mul(C.white, 0.8), mul(C.white, 0.8), mul(C.white, 0.8)][livery];
    const cometA = [C.mint, C.pink, C.mint][livery], cometB = [C.pink, C.mint, C.white][livery];
    const carRig = new THREE.Group(); carRig.matrixAutoUpdate = false; scene.add(carRig);
    carRig.add(mkMesh(buildCar(livery === 1 ? mul(C.pink, 0.8) : livery === 0 ? mul(C.white, 0.8) : mul(C.mint, 0.8), cometA, cometB, false), paint2));
    void bodyCol;
    const pinwheel = new THREE.Group(); pinwheel.position.set(0.5, -0.74, -2.28); carRig.add(pinwheel);
    {
      const g = new Geo();
      for (let i = 0; i < 6; i++) {
        const a0 = i / 6 * Math.PI * 2, a1 = a0 + 0.75, r = 0.2;
        g.col = i % 2 ? C.pink : C.mint; g.glow = mul(g.col, 0.3);
        g.v(0, 0, 0, 0, 0, 1); g.v(Math.cos(a0) * r, Math.sin(a0) * r, 0.02, 0, 0, 1); g.v(Math.cos(a1) * r * 0.62, Math.sin(a1) * r * 0.62, 0.05, 0, 0, 1);
      }
      pinwheel.add(mkMesh(g, paint2));
    }
    {
      // a wave top slaps spray across the nose under the pier (drops live in the car's space; uSprayT fires them)
      const sp = new Sprites(), sr = rng.fork('spray');
      for (let i = 0; i < 70; i++) sp.add(-2.6 + sr.range(-0.7, 0.7), -1.5 + sr.range(-0.4, 0.5), -4.6 + sr.range(-1.6, 1.6), 2, 0.016 + 0.05 * sr() * sr(), 9, sr());
      carRig.add(spriteMesh(sp.build(), solidMat, 6));
    }
    const pinkCars = [];
    {
      const geo = buildCar(mul(C.pink, 0.85), C.white, C.mint, true).build();
      for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(geo, paint2); m.matrixAutoUpdate = false; m.frustumCulled = false; scene.add(m); pinkCars.push(m); }
      const tb = new Sprites(); tb.add(-0.5, -0.7, 1.85, 1, 0.12, 0); tb.add(0.5, -0.7, 1.85, 1, 0.12, 0); tb.add(0, -0.3, -2.9, 2, 0.1, 0);
      pinkCars[2].add(spriteMesh(tb.build(), glowMat, 5));
    }
    const setFrame = (obj, d) => {
      frameAt(d, _p, _t, _r, _u); _t.negate();
      obj.matrix.makeBasis(_r, _u, _t).setPosition(_p); obj.matrixWorldNeedsUpdate = true;
    };
    await ctx.yield();

    // ----- assemble: boxes, static paint, sprites, and their mirrors under the wet sand -----
    {
      const boxGeo = new THREE.BoxGeometry(1, 1, 1), nNear = nearC.length / 3, nAll = nNear + farC.length / 3;
      const mats = new Float32Array(nAll * 16), cols = new Float32Array(nAll * 3);
      mats.set(nearM, 0); mats.set(farM, nNear * 16); cols.set(nearC, 0); cols.set(farC, nNear * 3);
      const mk = (count, mat) => {
        const m = new THREE.InstancedMesh(boxGeo, mat, count);
        m.instanceMatrix.array.set(mats.subarray(0, count * 16)); m.instanceMatrix.needsUpdate = true;
        m.instanceColor = new THREE.InstancedBufferAttribute(cols.slice(0, count * 3), 3);
        m.frustumCulled = false; scene.add(m); return m;
      };
      mk(nAll, paint); if (nNear > 0) mk(nNear, paintMirror);
      await ctx.yield();
      {
        const pd = pileNear.concat(pileFar), nPN = pileNear.length / 5, nP = pd.length / 5;
        const pg = new THREE.CylinderGeometry(0.2, 0.27, 1, 8, 4, true); pg.translate(0, 0.5, 0);
        const pm = new Float32Array(nP * 16), pc = new Float32Array(nP * 3);
        for (let i = 0; i < nP; i++) {
          const r = pd[i * 5 + 4]; _mx.makeScale(r, pd[i * 5 + 3], r).setPosition(pd[i * 5], pd[i * 5 + 1], pd[i * 5 + 2]); _mx.toArray(pm, i * 16);
          const k = 0.85 + 0.3 * ((i * 0.618) % 1); pc[i * 3] = TIMBER[0] * k; pc[i * 3 + 1] = TIMBER[1] * k; pc[i * 3 + 2] = TIMBER[2] * k;
        }
        const mkP = (count, mat) => {
          const m = new THREE.InstancedMesh(pg, mat, count);
          m.instanceMatrix.array.set(pm.subarray(0, count * 16)); m.instanceMatrix.needsUpdate = true;
          m.instanceColor = new THREE.InstancedBufferAttribute(pc.slice(0, count * 3), 3);
          m.frustumCulled = false; scene.add(m);
        };
        if (nP > 0) mkP(nP, pileMat); if (nPN > 0) mkP(nPN, pileMirror);
      }
      await ctx.yield();
      const track = mkMesh(gT, paint2); scene.add(track);
      await ctx.yield();
      const gmGeo = gM.build();
      await ctx.yield();
      const stat = new THREE.Mesh(gmGeo, paint2); stat.frustumCulled = false; scene.add(stat);
      const statMirror = new THREE.Mesh(gmGeo, paintMirror); statMirror.frustumCulled = false; scene.add(statMirror);

      // bulbs near the wheel come first so the mirrored draw can stop after them
      const n = bulbs.count, order = [], far = [];
      for (let i = 0; i < n; i++) { const x = bulbs.p[i * 3], z = bulbs.p[i * 3 + 2]; (z < tide + 4 && Math.hypot(x, z - HERO_Z) < 240 && bulbs.a[i * 4 + 3] < 6.5 ? order : far).push(i); }
      const nNearB = order.length; for (const i of far) order.push(i);
      await ctx.yield();
      const sorted = new Sprites();
      for (const i of order) { sorted.p.push(bulbs.p[i * 3], bulbs.p[i * 3 + 1], bulbs.p[i * 3 + 2]); sorted.a.push(bulbs.a[i * 4], bulbs.a[i * 4 + 1], bulbs.a[i * 4 + 2], bulbs.a[i * 4 + 3]); }
      await ctx.yield();
      const bg = sorted.build(); scene.add(spriteMesh(bg, glowMat, 5));
      await ctx.yield();
      const bg2 = quadGeo(); bg2.setAttribute('iPos', bg.getAttribute('iPos')); bg2.setAttribute('iA', bg.getAttribute('iA')); bg2.instanceCount = nNearB;
      scene.add(spriteMesh(bg2, glowMirrorMat, 1.4));
      scene.add(spriteMesh(solids.build(), solidMat, 4.5));
    }
    await ctx.yield();

    // ----- gulls over the pier, pigeons bursting from under the deck -----
    const birdLight = golden ? 'sunset' : { sunDir: [0.1, 0.35, 0.93], sunColor: PAL[3], sunIntensity: 0.5, sky: lookId === 'night' ? '#5a70b8' : '#6a8fc0', skyIntensity: 1.5, ground: '#d8a8e0', groundIntensity: 1.2 };
    const birds = [];
    await ctx.yield();
    birds.push(F.makeFlock({ rng: rng.fork('gulls'), species: 'gulls', count: Math.round(60 * density * (0.6 + 0.4 * detail)), center: [-52, 64, 205], radius: 78, light: birdLight }));
    await ctx.yield();
    birds.push(F.makeFlock({ rng: rng.fork('gulls2'), species: 'gulls', count: Math.round(14 * density), center: [30, 40, 330], radius: 60, light: birdLight }));
    await ctx.yield();
    birds.push(F.makeFlock({ rng: rng.fork('pigeons'), species: 'crows', count: 12, size: 0.75, body: '#8a90a2', wingC: '#6d7386', light: birdLight,
      // (the clear air round the line, 14 Oct: this crossing dealt a pigeon 1.7 m from the flown line, and a crossing is keyed to the camera, so
      // the pass came on every visit. The crossing stays where it was laid; the kit holds off the birds that come too near.)
      cross: { path, u: (U_SLOT + U_OUT) * 0.5, lead: 30, span: 90, angle: 22, side: 1, height: 0.6, duration: DUR }, keepClear: { path, dist: 2, each: true } }));
    for (const b of birds) scene.add(b.object);
    await ctx.yield();

    await sky.prewarm(ctx.renderer, null, scene);
    await ctx.yield();

    // ----- the flight -----
    const ring = V(0, 32, HERO_Z), size = new THREE.Vector2();
    const U0 = U_CREST - 0.012;
    const speedAt = (u) => {                    // the notional coaster speed (the pinwheel and the rattle follow it)
      if (u < U_LIFT - 0.04) return 12; if (u < U_CREST - 0.01) return 4.5; if (u < U_CREST + 0.012) return 5;
      path.pointAt(u, _p); return Math.min(28, Math.sqrt(30 + 19.6 * Math.max(0, 47 - _p.y)));
    };
    // pace: the chain crawls, the crest creeps, the drop and the run under the pier fly, the last climb hangs
    const sstep = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    const pace = (u) => 1 - 0.5 * sstep(U_LIFT - 0.03, U_LIFT + 0.004, u) + 1.0 * sstep(U_CREST + 0.014, U_SLOT - 0.012, u) - 0.2 * sstep(U_OUT, U_APEX, u)
      - 0.68 * sstep(U_CLIMB - 0.03, U_CLIMB + 0.075, u) + 0.38 * sstep(U_CLIMB + 0.085, 0.915, u);
    const NTT = 256, tTab = new Float32Array(NTT + 1);
    for (let i = 1; i <= NTT; i++) tTab[i] = tTab[i - 1] + 1 / pace((i - 0.5) / NTT);
    for (let i = 1; i <= NTT; i++) tTab[i] *= DUR / tTab[NTT];
    const timeAt = (u) => { const x = Math.min(1, Math.max(0, u)) * NTT, i = Math.min(NTT - 1, Math.floor(x)); return tTab[i] + (tTab[i + 1] - tTab[i]) * (x - i); };
    const uAtTime = (t) => {
      if (t >= DUR) return 1 + (t - DUR) / DUR;
      let lo = 0, hi = NTT; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tTab[m] <= t) lo = m; else hi = m; }
      return (lo + (t - tTab[lo]) / Math.max(1e-6, tTab[lo + 1] - tTab[lo])) / NTT;
    };
    // moments keyed to places on the track: three scored shells (the crest, the two airtime hills) and the spray under the pier
    const marks = [U_CREST - 0.075, uAt(TRACK_X + 76, 318) - 0.05, uAt(TRACK_X + 76, 266) - 0.05, (U_SLOT + U_OUT) * 0.5 - 0.012], markTime = marks.map(timeAt), since = [-1, -1, -1, -1];
    const ringAim = V(0, 20, HERO_Z), _cp = V(), _cq = new THREE.Quaternion(), _cs = V();
    let spin = 0, flash = 0; const _qa = new THREE.Quaternion(), _one = V(1, 1, 1);
    return {
      scene, path, duration: DUR, pace, title: rare ? 'The Pier Comet: Blackout' : L.title,
      ride: 'none', style: 'none',
      camera: { fov: 64, near: 0.3, far: 4300, lookAhead: 11, sway: 0.5, bank: 1 },
      pois: [
        { at: [-57, 13, 206], from: U_LIFT - 0.045, to: U_CREST - 0.006, weight: 0.5 },
        { at: [-80, 6, 300], from: U_CREST - 0.035, to: U_CREST + 0.03, weight: 0.7, fade: 0.4 },      // the crest: the far midway and the pier end, low right
        { at: [-30, 22, 150], from: U_APEX - 0.1, to: U_RET + 0.03, weight: 0.85 },                     // the reveal: pier and wheel together
        // over the airtime hills and up the last climb the gaze rests under the ring, so that ring and reflection are framed as one figure
        { at: (time, u) => ringAim.set(0, 8 + 24 * sstep(0.82, 0.915, u), HERO_Z), from: U_RET + 0.02, to: 0.94, weight: 0.78, fade: 0.2 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#b9fff0', glow: 1.1, revealDistance: 340, tilt: true },
      post: { exposure: L.exposure, bloom: L.bloom, grade: L.grade },
      update(dt, time, camera, u) {
        PU.uTime.value = time;
        ctx.renderer.getDrawingBufferSize(size); SU.uRes.value.copy(size);
        // seconds of the ride since the car passed each mark (-1 before it): a function of place alone, so it cannot go stale
        for (let i = 0; i < marks.length; i++) since[i] = u < marks[i] ? -1 : timeAt(u) - markTime[i];
        SU.uSprayT.value = since[3];
        // fireworks lift the ambient a little (eased: each burst rises in 0.1 s and decays in 0.4 s)
        let fl = 0;
        if (fwA) {
          for (let i = 0; i < fwPh.length; i++) { const tau = ((time / FWP + fwPh[i]) % 1) * FWP - FWR; if (tau > 0) fl += Math.min(1, tau / 0.1) * Math.exp(-tau / 0.4) * (i < NA ? 1 : 0.5); }
          const kt = fwA.userData.FU.uKeyTau.value;
          for (let i = 0; i < NK; i++) { kt[i] = since[i]; const tau = since[i] - FWR; if (tau > 0) fl += Math.min(1, tau / 0.1) * Math.exp(-tau / 0.4) * 0.8; }
          fwA.userData.FU.uGain.value = L.fwGain * (0.8 + 0.2 * Math.min(1, Math.max(0, (u - 0.8) / 0.1)));
        }
        flash = Math.min(0.25, fl * 0.16);
        PU.uFlash.value = flash; hero.setFlash(flash); hero.setProgress(u);
        // rare: the blackout at the crest, then the lights come back in a wave down the pier
        if (rare) {
          const k = (u - U0) / 0.07;
          PU.uWaveZ.value = k < 0 ? 1e6 : k < 1 ? -1e6 : k < 1.7 ? (k - 1) / 0.7 * 440 - 20 : 1e6;
        }
        sky.update(dt, time, camera); sea.update(dt, time, camera); hero.update(dt, time, camera);
        for (const b of birds) b.update(dt, time, camera, u);
        // our car rides the rails under the camera; the pink train runs the same track 10.5 s ahead
        const d = u * PL, v = speedAt(u);
        setFrame(carRig, d);
        camera.matrixWorld.decompose(_cp, _cq, _cs);          // the camera behind a portal has only its world matrix set
        const seat = _cp.distanceTo(_p);
        if (seat < 2) {                                        // we are in the seat: the car follows the gaze, as a ride does
          _qa.setFromRotationMatrix(carRig.matrix).slerp(_cq, 0.8);
          carRig.matrix.compose(_cp, _qa, _one);
        }
        // seen from outside (through the previous world's portal) the car waits below the rails and rises as the viewer arrives
        const stow = Math.min(1, Math.max(0, (seat - 1) / 9));
        carRig.visible = seat < 10; carRig.matrix.elements[13] -= stow * stow * (3 - 2 * stow) * 3;
        carRig.matrix.elements[13] += Math.sin(time * 41) * 0.0022 * v / 10 + Math.sin(time * 17.3) * 0.002;
        spin += dt * v * 1.1; pinwheel.rotation.z = -spin;
        const dp = PL * uAtTime(timeAt(u) + 4.7);              // the pink train keeps its lead in seconds, not metres
        for (let i = 0; i < 3; i++) { const dd = dp - i * 3.5; pinkCars[i].visible = dd < PL - 1.5; if (pinkCars[i].visible) setFrame(pinkCars[i], dd); }
        // rides, lighthouse, steamer, sanderlings
        carousel.rotation.y = time * 0.5;
        if (swingTower) { spinner.rotation.y = -time * 0.85; spinner.rotation.x = 0.05 * Math.sin(time * 0.6); spinner.rotation.z = 0.05 * Math.cos(time * 0.6); }
        else { spinner.position.y = DECK + 14 + 10.5 * Math.sin(time * 0.22); spinner.rotation.y = time * 0.3; }
        beam.rotation.y = time * Math.PI * 2 / 10;
        if (steamerOn) {
          const sx = -110 + steamDir * 5.5 * (timeAt(u) - timeAt(U_CREST));   // she crosses the view from the crest
          steamer.position.set(sx, SEA - 0.4 + 0.25 * Math.sin(time * 0.7), steamZ); steamer.rotation.set(0.012 * Math.sin(time * 0.6), steamDir > 0 ? 0 : Math.PI, 0.02 * Math.sin(time * 0.45));
        }
        SU.uFlock.value.set(24 * Math.sin(time * 0.19), time * 0.5, 1.6 * Math.sin(time * 0.53));
      },
      dispose() { sky.dispose(); hero.dispose(); },
    };
  },
};
