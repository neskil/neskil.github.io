// THE DRAFTED CITY
// On Prussian-blue paper a white-line city rules, extrudes and hatches itself into existence around the
// camera, which rides a trolley (later a hoist cage) that draws itself, up the Main Avenue, over the first
// bridge and round the Spire as it is drawn floor by floor, to the red ring a giant compass scribes.
//
// Everything is unlit line drawing in custom shaders (style: 'none'):
//   - one instanced ribbon-line system (static draw-on lines, lane movers, birds, dust, leaves, rain, clouds)
//   - instanced blocks: paper faces that write depth and carry floors, window ticks and hatching, plus their
//     12 edges generated in the vertex shader (and a dashed hidden-edge pass for the near ones)
//   - one paper plane whose shader draws grain, grids, folds, the street plan, the river and the parks
//   - a paper dome with the exposure band, the faint grid and the turning north point
// Every scripted thing hangs on u (the epoch); only ambient loops use time.
// Per seed (and ctx.vary): hour (day, night shift with lit window squares, dawn, golden), weather (few or many
// revision clouds, drafted rain), season (full, autumn with dashed crowns and shed dots, winter with bare
// sticks and stippled roofs), the Spire's cast (ziggurat, gothic with flying buttresses, or a round tower of
// stacked drums), trams or an
// elevated railway, birds or airships, and the rare tracing-paper sheet with a rival scheme in red.
// Cost: about 165-180k triangles, 30 draw calls, no lights, ~150-200 ms of build.
// Hero: src/parts/drafted-city.js (the Spire and the Compass) at the origin; "north" is -Z.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero } from '../parts/drafted-city.js';

const HEAVY = 0, MED = 1, FAINT = 2, SOLID = 0, DASH = 1, DASHDOT = 2;
const WHITE = 0, CONS = 1, CREAM = 2, RED = 3, DETAIL = 4, DIM = 5;
const K_STATIC = 0, K_LANE = 1, K_BIRD = 2, K_DUST = 3, K_LEAF = 4, K_RAIN = 5, K_DRIFT = 6, K_RING = 7;
const LW = [0.24, 0.13, 0.08];
const Z0 = 560;                       // entry z; the avenue runs north (towards -Z) from here
const STREET = 60, ZOFF = 20;         // street grid: x = 60 i, z = 20 + 60 j

// ---------------------------------------------------------------------------------------------- GLSL
// Shared ribbon expansion: world-space end points -> screen-facing quad never thinner than its rank's
// minimum pixel width; lines thinner than that give up brightness instead of adding up to white.
const RIBBON = /* glsl */`
  uniform vec2 uRes;
  varying float vS, vLen, vEdge, vHalf, vStyle, vTip, vAlpha, vMpp, vCrawl, vDot; varying vec3 vCol;
  float gMaxPx;     // widest this ribbon may be on screen, in pixels (set by the caller)
  float gFar;       // how far into the distance tone this vertex is (0 near .. 1 at 1.2 km), for the caller's colour
  vec4 ribbon(vec3 A, vec3 E, float fullLen, float width, float rank, float alpha, float dotty, float depthK) {
    vec4 vA = viewMatrix * vec4(A, 1.), vE = viewMatrix * vec4(E, 1.);
    float nearZ = -0.25;
    bool cull = alpha <= 0.003 || (vA.z > nearZ && vE.z > nearZ);
    if (vA.z > nearZ) vA = mix(vE, vA, (nearZ - vE.z) / max(vA.z - vE.z, 1e-4));
    else if (vE.z > nearZ) vE = mix(vA, vE, (nearZ - vA.z) / max(vE.z - vA.z, 1e-4));
    vec4 cA = projectionMatrix * vA, cE = projectionMatrix * vE;
    vec2 sA = cA.xy / max(cA.w, 1e-4) * uRes * 0.5, sE = cE.xy / max(cE.w, 1e-4) * uRes * 0.5;
    vec2 d = sE - sA; float dl = length(d); d = dl > 1e-3 ? d / dl : vec2(1., 0.);
    vec2 nrm = vec2(-d.y, d.x);
    vec4 mv = mix(vA, vE, position.x);
    vec4 c4 = mix(cA, cE, position.x);
    float w = max(c4.w, 1e-3);
    float pxPerM = uRes.y * 0.5 * projectionMatrix[1][1] / w;
    float wpx = width * pxPerM;
    float minPx = rank < 0.5 ? 2.0 : (rank < 1.5 ? 1.5 : 1.15);
    float wd = min(max(wpx, minPx), gMaxPx);
    if (dotty > 0.5) wd = min(wd, 3.2);              // motes are round dots of a few pixels, never squares
    float thin = clamp(wpx / minPx, 0., 1.);
    alpha *= rank < 0.5 ? clamp(thin * 2.4, 0.42, 1.) : (rank < 1.5 ? clamp(thin * 2.2, 0.08, 1.) : clamp(thin * 2.2, 0.04, 1.));
    float dist = -mv.z;
    // depth is line weight and tone: things that stand on the sheet thin out and go pale blue from 300 m, so the
    // near city is white line, the middle distance is lighter line and the far skyline is a pale outline
    float oldF = rank > 1.5 ? 0.75 * smoothstep(600., 2000., dist) : (rank > 0.5 ? 0.6 * smoothstep(700., 2400., dist) : 0.4 * smoothstep(600., 2000., dist));
    gFar = depthK * smoothstep(300., 1200., dist);
    float newF = (rank > 1.5 ? 0.8 : (rank > 0.5 ? 0.66 : 0.5)) * gFar;
    alpha *= 1. - max(oldF, newF);
    float hw = wd * 0.5 + 1.0;
    float cap = dotty > 0.5 ? hw : min(wd * 0.5, 2.);
    c4.xy += (nrm * position.y * hw + d * (position.x * 2. - 1.) * cap) / (uRes * 0.5) * w;
    gl_Position = cull ? vec4(2., 2., 2., 1.) : c4;
    vEdge = position.y * hw; vHalf = wd * 0.5;
    vDot = dotty > 0.5 ? (position.x * 2. - 1.) * hw : -1e4;
    vLen = fullLen; vS = position.x * fullLen;
    vAlpha = alpha; vCrawl = 0.;
    vMpp = 1. / max(pxPerM, 1e-4);
    return mv;
  }`;

const LINE_VERT = /* glsl */`
  attribute vec3 aA, aB; attribute vec4 aS, aT; attribute vec2 aX;
  uniform float uU, uTime; uniform vec3 uCol[6]; uniform vec4 uFlock[4];
  uniform vec3 uCam, uScript, uScript2; uniform vec2 uSheet;
  ${RIBBON}
  #include <fog_pars_vertex>
  void main() {
    float kind = aS.w, rank = floor(aS.y / 4. + 0.01), style = aS.y - rank * 4.;
    vec3 A = aA, B = aB; float p = 1., alpha = 1., tipOn = 0., dotty = 0.;
    if (kind < 0.5) {
      // static line ruled on between two epochs; construction lines fade once fadeAt is passed
      p = clamp((uU - aT.x) / max(aT.y - aT.x, 1e-4), 0., 1.);
      alpha *= 1. - 0.9 * smoothstep(aT.z, aT.z + 0.035, uU);
      tipOn = 1.;
      if (aT.w > 0.) {
        float ph = uTime * 1.3 + aA.x * 0.045 + aA.z * 0.06;
        vec2 sw = vec2(sin(ph) + 0.4 * sin(ph * 2.7), cos(ph * 0.8)) * aT.w * 0.03;
        A.xz += sw * A.y; B.xz += sw * B.y;
      }
      if (aX.y > 0.5) { float mx = 0.5 * (aA.x + aB.x); alpha *= step(uSheet.x, mx) * step(mx, uSheet.y); }
    } else if (kind < 1.5) {
      // rigid thing travelling a straight lane: trams, cars, barges, trains
      float s = mod(uTime * aT.y + aT.z * aT.w, aT.w);
      vec3 off = vec3(cos(aT.x), 0., sin(aT.x)) * s;
      A += off; B += off;
      alpha *= smoothstep(0., 25., s) * (1. - smoothstep(aT.w - 25., aT.w, s)) * smoothstep(aX.x, aX.x + 0.02, uU);
    } else if (kind < 2.5) {
      // tick-mark bird: one stroke of a V whose wingbeat is the V opening and closing
      int fi = int(aX.y + 0.5);
      vec4 F = uFlock[fi];
      float a = aA.z + uTime * aB.z;
      vec3 pos = F.xyz + vec3(cos(a) * aA.x, aA.y + sin(uTime * 0.7 + aA.z * 3.) * aT.y, sin(a) * aA.x) * F.w;
      // a drawn mark, so it always faces the page: the V lies in the plane of the picture
      vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), cu = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
      float th = 0.55 + 0.45 * sin(uTime * aT.x + aA.z * 5.);
      A = pos;
      B = pos + (cr * aB.x * cos(th) + cu * sin(th)) * aB.y;
      alpha *= smoothstep(aX.x, aX.x + 0.02, uU);
    } else if (kind < 3.5) {
      // chalk dust: dots drifting with the epoch, wobbling in time
      float k = uU - aT.x;
      vec3 pos = aA + aB * k + vec3(sin(uTime * 0.7 + aT.z), 0.6 * sin(uTime * 0.5 + aT.z * 1.7), cos(uTime * 0.6 + aT.z * 2.3)) * aT.w;
      A = pos; B = pos; dotty = 1.;
      alpha *= smoothstep(0., 0.008, k) * (1. - smoothstep(aT.y - 0.05, aT.y, uU)) * smoothstep(4., 14., length(pos - uCam));
    } else if (kind < 4.5) {
      // falling loop: shed leaves (dots) drifting down and sideways
      float f = fract(uTime / aT.x + aT.y);
      vec3 pos = aA + aB * f + vec3(sin(uTime * 1.1 + aT.y * 40.), 0., cos(uTime * 0.9 + aT.y * 31.)) * aT.w * f;
      A = pos; B = pos; dotty = 1.;
      alpha *= smoothstep(0., 0.1, f) * (1. - smoothstep(0.8, 1., f)) * smoothstep(aX.x, aX.x + 0.02, uU);
    } else if (kind < 5.5) {
      // drafted rain: parallel strokes wrapped in a box round the camera
      float f = fract(uTime / aT.x + aT.y);
      vec3 pos = aA + aB * f;
      pos = uCam + mod(pos - uCam + 0.5 * aT.w, aT.w) - 0.5 * aT.w;
      A = pos; B = pos + aB * (aT.z / max(length(aB), 1e-3)); dotty = aT.z < 0.01 ? 1. : 0.;
      float dc = length(pos - uCam);
      alpha *= 0.5 * smoothstep(aX.x, aX.x + 0.03, uU) * (1. - smoothstep(0.38 * aT.w, 0.5 * aT.w, dc)) * smoothstep(5., 22., dc);
    } else if (kind > 6.5) {
      // riders on a ring road about the origin: A and B are (radius, height, angle)
      float w = uTime * aT.y + aT.z;
      A = vec3(cos(aA.z + w) * aA.x, aA.y, sin(aA.z + w) * aA.x);
      B = vec3(cos(aB.z + w) * aB.x, aB.y, sin(aB.z + w) * aB.x);
      alpha *= smoothstep(aX.x, aX.x + 0.02, uU);
    } else {
      // drifting rigid outline: revision clouds (which keep redrawing their scallops) and airships
      float span = max(aX.y, 1.);
      float off = mod(uTime * aT.y + aT.z, span) - span * 0.5;
      vec3 o = aT.w > 1.5 ? uScript2 : (aT.w > 0.5 ? uScript : vec3(off, 0., 0.));
      A += o; B += o;
      if (aT.w < 0.5) alpha *= 1. - smoothstep(span * 0.42, span * 0.5, abs(off));
      if (aT.x >= 0.) {
        float c = fract(uTime * 0.05 + aT.x);
        p = clamp(c * 7., 0., 1.); alpha *= 1. - smoothstep(0.9, 1., c); tipOn = 1.;
      }
      alpha *= smoothstep(aX.x, aX.x + 0.03, uU);
    }
    A = (modelMatrix * vec4(A, 1.)).xyz; B = (modelMatrix * vec4(B, 1.)).xyz;
    if (p <= 0.) alpha = 0.;
    vec3 E = mix(A, B, p);
    // (red and cream never take the distance tone: the centre-cross must read from the far end of the avenue)
    float dk = (kind < 1.5 || kind > 6.5) ? 1. : (kind < 2.5 ? 0.5 : 0.);
    if (aS.z > 1.5 && aS.z < 3.5) dk = 0.;
    // (the line we ride passes a couple of metres under the lens: it stays a ruled line, never a white bar)
    gMaxPx = (kind < 0.5 && aT.w < -0.5) ? max(4., uRes.y * (aS.z > 2.5 ? 0.016 : 0.012)) : 14.;
    // (and its sleepers are not drawn within a few metres of the lens, where one would be a bar across the picture)
    if (kind < 0.5 && aT.w < -0.5 && aS.z > 3.5) alpha *= smoothstep(3.5, 9., distance(mix(A, E, 0.5), uCam));
    // construction lines right beside the cage sink back: they are scaffolding for the eye, not the picture
    if (kind < 0.5 && aS.z > 0.5 && aS.z < 1.5 && aS.x > 0.03) alpha *= mix(0.5, 1., smoothstep(18., 40., distance(mix(A, E, 0.5), uCam)));
    vec4 mvPosition = ribbon(A, E, length(B - A) * p, aS.x, rank, alpha, dotty, dk);
    vStyle = style;
    vCrawl = (kind < 0.5 && style > 0.5) ? 1. : 0.;     // drawn dashes creep along their line
    vTip = (p < 0.999 && tipOn > 0.5) ? 1. : 0.;
    vCol = mix(uCol[int(aS.z + 0.5)], uCol[1] * 1.5, 0.7 * gFar);
    #include <fog_vertex>
  }`;

const LINE_FRAG = /* glsl */`
  uniform float uTime;
  varying float vS, vLen, vEdge, vHalf, vStyle, vTip, vAlpha, vMpp, vCrawl, vDot; varying vec3 vCol;
  #include <fog_pars_fragment>
  void main() {
    float er = vDot > -5e3 ? length(vec2(vEdge, vDot)) : abs(vEdge);
    float a = vAlpha * (1. - smoothstep(vHalf - 0.45, vHalf + 0.75, er));
    if (vStyle > 0.5) {
      float base = vStyle > 1.5 ? 5.0 : 2.6;
      float per = base * exp2(max(-6., ceil(log2(max(vMpp * 9. / base, 1e-3)))));
      float f = fract(vS / per - vCrawl * uTime * 0.22);
      float on = vStyle > 1.5 ? max(step(f, 0.58), step(0.74, f) * step(f, 0.84)) : step(f, 0.6);
      a *= on;
    }
    if (a < 0.004) discard;
    float tip = vTip * (1. - smoothstep(0., max(3., vMpp * 5.), vLen - vS));
    gl_FragColor = vec4(vCol * (1. + 1.7 * tip), a);
    #include <fog_fragment>
  }`;

// Block edges: 12 per box, end points computed from the instance (footprint, base, height, birth, duration).
const EDGE_VERT = /* glsl */`
  attribute vec3 aC0, aC1; attribute vec2 aE; attribute vec4 iPos, iH, iR;
  uniform float uU, uHidden; uniform vec3 uCol[6];
  ${RIBBON}
  #include <fog_pars_vertex>
  void main() {
    float g = smoothstep(iH.z, iH.z + iH.w, uU);
    float H = iH.y * g;
    vec3 sz = vec3(iPos.z, H, iPos.w), org = vec3(iPos.x, iH.x, iPos.y);
    vec3 A = org + (aC0 - vec3(0.5, 0., 0.5)) * sz, B = org + (aC1 - vec3(0.5, 0., 0.5)) * sz;
    vec3 dir = aC1 - aC0;
    float p = 1., alpha = 1., rank = 0.;
    if (aE.x < 0.5) {
      // footprint: ruled side by side just before the walls are pulled up; corners overshoot
      float t0 = iH.z - 0.022 + aE.y * 0.005;
      p = clamp((uU - t0) / 0.005, 0., 1.);
      A -= dir * 0.5; B += dir * 0.5; rank = 1.;
    } else if (aE.x < 1.5) {
      if (g <= 0.) alpha = 0.;
      B.y += 0.5; p = g < 1. ? 0.998 : 1.; rank = 1.;
    } else {
      alpha *= smoothstep(0.02, 0.12, g);
      A -= dir * 0.5; B += dir * 0.5;
    }
    // rubbed out: a 12 percent ghost that lingers, then goes
    alpha *= (1. - 0.88 * smoothstep(iR.x, iR.x + 0.008, uU)) * (1. - smoothstep(iR.x + 0.07, iR.x + 0.14, uU));
    if (p <= 0.) alpha = 0.;
    // hidden edges are a near thing: beyond ~250 m they would stack into grey bands seen through the Spire's slab
    if (uHidden > 0.5) alpha *= 0.17 * (1. - smoothstep(170., 290., length(org + vec3(0., H * 0.5, 0.) - cameraPosition)));
    vec3 E = mix(A, B, p);
    gMaxPx = 14.;
    vec4 mvPosition = ribbon(A, E, length(B - A) * p, rank < 0.5 ? 0.24 : 0.13, rank, alpha, 0., 1.);
    vStyle = uHidden > 0.5 ? 1. : 0.;
    vTip = p < 0.999 ? 1. : 0.;
    vCol = mix(uCol[0], uCol[1] * 1.5, 0.7 * gFar);
    #include <fog_vertex>
  }`;

// Block faces: paper that hides what is behind it and carries floors, window ticks and the hatching.
const FILL_VERT = /* glsl */`
  attribute vec4 iPos, iH, iR; uniform float uU;
  varying vec3 vW, vN; varying vec4 vI;
  #include <fog_pars_vertex>
  void main() {
    float g = smoothstep(iH.z, iH.z + iH.w, uU) * (1. - smoothstep(iR.x, iR.x + 0.012, uU));
    float H = iH.y * g;
    vec3 p = vec3(iPos.x + position.x * (iPos.z - 0.5), iH.x + position.y * H, iPos.y + position.z * (iPos.w - 0.5));
    if (H < 0.03) p = vec3(iPos.x, -6., iPos.y);
    vW = p; vN = normal; vI = vec4(iH.x + H, iH.z + iH.w, iR.y, iH.x);
    vec4 mvPosition = viewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;

const HASH = /* glsl */`
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
  float hatch(float q, float fw) {
    float base = 1.3, lv = log2(max(9. * fw / base, 1.)), l0 = floor(lv), fr = lv - l0;
    float s0 = base * exp2(l0), s1 = s0 * 2.;
    float d0 = abs(fract(q / s0 + 0.5) - 0.5) * s0, d1 = abs(fract(q / s1 + 0.5) - 0.5) * s1;
    float w = fw * 0.75;
    float h0 = 1. - smoothstep(w * 0.5, w * 1.5, d0), h1 = 1. - smoothstep(w * 0.5, w * 1.5, d1);
    return mix(h0, h1, smoothstep(0.35, 1., fr));
  }`;

const FILL_FRAG = /* glsl */`
  uniform vec3 uP0, uP1, uP2, uInk, uCons, uCream; uniform float uU, uNight, uSnow; uniform vec2 uSheet;
  varying vec3 vW, vN; varying vec4 vI;
  #include <fog_pars_fragment>
  ${HASH}
  void main() {
    vec3 n = normalize(vN);
    vec2 nq = floor(n.xz + 0.5);          // exact face normal for hashing (an interpolated 0.9999 turns into pixel noise)
    bool cap = n.y > 0.5;
    float t = abs(n.x) > 0.5 ? vW.z : vW.x;
    vec2 fc = cap ? vW.xz : vec2(t, vW.y);
    float q1 = (fc.x + fc.y) * 0.7071;
    float fw = max(fwidth(q1), 1e-4), fy = max(fwidth(vW.y), 1e-4), ft = max(fwidth(t), 1e-4);
    float mott = 0.5 + 0.25 * sin(fc.x * 0.021 + 1.3) * sin(fc.y * 0.017 + vW.z * 0.01) + 0.25 * sin(fc.x * 0.11 + fc.y * 0.07);
    float shaded = cap ? 0. : max(step(0.5, n.x), step(0.5, -n.z));
    // a wash, as a draughtsman lays one: faces to the light are pale, faces turned away are the dark of the sheet,
    // and everything goes paler with distance, so far blocks are silhouettes against the darker ground
    float dC = length(vW - cameraPosition);
    bool tall = vI.w > 25.;                 // third generation: its roof is a step lighter, so the skyline's top edge reads
    vec3 lit = mix(uP1, uP2, 0.52) + 0.07 * uCons * (1. - smoothstep(150., 300., dC));
    vec3 paper = cap ? mix(uP1, uP2, tall ? 0.62 : 0.35) : mix(lit, uP0, shaded);
    paper *= 0.92 + 0.14 * mott + 0.05 * (hash(floor(fc * 3.) + nq * 7.) - 0.5);
    paper = mix(paper, uP2 * (cap && tall ? 1.14 : 1.), 0.6 * smoothstep(250., 1200., dC));
    vec3 col = paper;
    if (cap) {
      if (uSnow > 0.5) {
        // winter: stippled snow on the roofs
        vec2 c = vW.xz / 1.1, id = floor(c);
        vec2 o = vec2(hash(id), hash(id + 17.3)) * 0.6 + 0.2;
        float d = length(fract(c) - o) * 1.1, fx = max(fwidth(vW.x) + fwidth(vW.z), 1e-4);
        float dot1 = (1. - smoothstep(0.2, 0.2 + fx, d)) * step(0.12, hash(id + 3.1));
        col = mix(col, uInk * 0.85, mix(dot1, 0.16, smoothstep(0.5, 1.6, fx)) * 0.8);
      }
    } else {
      float below = step(vW.y, vI.x - 0.4);
      // floor lines showing through as dashes, window ticks when near
      float fl = abs(fract((vW.y - vI.w) / 3.8 + 0.5) - 0.5) * 3.8;
      float floorLine = (1. - smoothstep(fy * 0.5, fy * 1.5, fl)) * step(fract(t / 2.6), 0.6) * (1. - smoothstep(0.5, 1.6, fy));
      vec2 wc = vec2(t / 3.2, (vW.y - vI.w) / 3.8);
      float wx = abs(fract(wc.x) - 0.5) * 3.2, wy = fract(wc.y);
      float tick = (1. - smoothstep(ft * 0.5, ft * 1.5, wx)) * step(0.28, wy) * step(wy, 0.78) * (1. - smoothstep(0.12, 0.4, ft));
      float ink = max(floorLine * 0.22, tick * 0.34) * below;
      // hatching falls down the shaded faces once the walls are up
      float front = vI.x - (uU - vI.y) * 2600. + 5. * sin(q1 * 0.83) * sin(q1 * 0.29 + 2.);
      col = mix(col, uInk * 0.6, ink);
      // (the hatching is construction blue, lighter than the outline: the heavy white edge always wins)
      // near the camera it is ruled firmly in pale ink; beyond 350 m it sinks to a tone
      float nearH = 1. - smoothstep(180., 350., dC);
      col = mix(col, mix(uCons * 0.8, uInk * 0.75, nearH), shaded * hatch(q1, fw) * smoothstep(0., 2.5, vW.y - front) * mix(0.42, 0.7, nearH) * step(vI.y, uU));
      if (uNight > 0.5) {
        vec2 id = floor(wc), wf = abs(fract(wc) - 0.5);
        float wfw = max(fwidth(wc.x), fwidth(wc.y));
        float sq = (1. - smoothstep(0.22 - wfw, 0.22 + wfw, wf.x)) * (1. - smoothstep(0.26 - wfw, 0.26 + wfw, wf.y));
        float wk = smoothstep(0.14, 0.5, wfw);     // unresolved squares take their mean lighting, not pixel noise
        // near to, a lit window is drawn, not filled: a ruled outline, a mullion cross and a thin wash inside
        float inner = (1. - smoothstep(0.18 - wfw, 0.18 + wfw, wf.x)) * (1. - smoothstep(0.215 - wfw, 0.215 + wfw, wf.y));
        float mull = max(1. - smoothstep(wfw * 0.5, wfw * 1.6 + 0.012, wf.x), 1. - smoothstep(wfw * 0.5, wfw * 1.6 + 0.012, wf.y));
        float drawn = sq * max(max(1. - inner, mull * 0.75), 0.3);
        sq = mix(drawn, sq, smoothstep(0.035, 0.08, wfw));
        sq = mix(sq, 0.11, wk);
        float r = hash(id + nq * 3. + floor(vI.z * 61. + 0.5));
        float on = mix(step(0.42, r), 0.58, wk) * smoothstep(0., 0.01, uU - vI.y - 0.02 - 0.06 * mix(fract(r * 7.3), 0.5, wk)) * below;
        vec3 wcol = mix(uCream, uCons * 1.15, mix(smoothstep(0.3, 0.7, fract(r * 5.3)), 0.5, wk));
        col = mix(col, wcol * mix(0.75 + 0.4 * fract(r * 13.7), 0.95, wk), sq * on * 0.8);
      }
    }
    // rare: under the sheet of tracing paper everything is a little paler, with a pale line where its edges cross
    float zS = step(abs(vW.z + 40.), 620.), fxS = max(fwidth(vW.x), 1e-4);
    float inS = step(uSheet.x, vW.x) * step(vW.x, uSheet.y) * zS;
    float edgeS = max(1. - smoothstep(1., 1. + fxS * 1.5, abs(vW.x - uSheet.x)), 1. - smoothstep(1., 1. + fxS * 1.5, abs(vW.x - uSheet.y))) * zS;
    col = mix(col, uCons, 0.16 * inS);
    col = mix(col, uInk * 0.85, 0.6 * edgeS);
    gl_FragColor = vec4(col, 1.);
    #include <fog_fragment>
  }`;

// The sheet: grain, exposure mottling, grids, folds, the street plan revealed by the epoch, the river's
// seven wavy lines, stippled parks, the eraser band and (rare) the tracing-paper overlay.
const NR = 22;
const GROUND_FRAG = /* glsl */`
  uniform vec3 uP0, uP1, uP2, uInk, uCons, uRed; uniform float uU, uTime, uRivK, uRub, uSnow, uPL, uThrough;
  uniform vec2 uRiv[${NR}]; uniform vec4 uPark[2]; uniform vec4 uClear[4]; uniform vec2 uSheet; uniform vec4 uRubBox;
  varying vec3 vP;
  #include <fog_pars_fragment>
  ${HASH}
  float grid(vec2 p, float s, vec2 fw) { vec2 d = abs(fract(p / s + 0.5) - 0.5) * s; vec2 l = 1. - smoothstep(fw * 0.4, fw * 1.4, d); return max(l.x, l.y); }
  void river(vec2 p, out float sd, out float s) {
    float best = 1e9, acc = 0.; sd = 1e4; s = 0.;
    for (int i = 0; i < ${NR - 1}; i++) {
      vec2 a = uRiv[i], ab = uRiv[i + 1] - a; float L2 = max(dot(ab, ab), 1e-3), L = sqrt(L2);
      float t = clamp(dot(p - a, ab) / L2, 0., 1.);
      vec2 dv = p - a - ab * t; float dd = dot(dv, dv);
      if (dd < best) { best = dd; s = acc + t * L; sd = sqrt(dd) * (ab.x * dv.y - ab.y * dv.x < 0. ? -1. : 1.); }
      acc += L;
    }
  }
  float fold(float c) { return exp(-c * c * 0.08) - 0.6 * exp(-(c - 2.5) * (c - 2.5) * 0.05); }
  void main() {
    vec2 p = vP.xz; float r = length(p);
    vec2 fw = max(fwidth(p), vec2(1e-4)); float f = max(fw.x, fw.y);
    float mott = vnoise(p * 0.004) * 0.6 + vnoise(p * 0.013 + 7.) * 0.3 + vnoise(p * 0.06) * 0.1;
    // (near the camera the paper is paper: stronger exposure mottling, a finer blotch and a firmer grid)
    float dG = length(vP - cameraPosition), nearG = 1. - smoothstep(120., 320., dG);
    float blotch = vnoise(p * 0.031 + 3.) * 0.6 + vnoise(p * 0.09 + 11.) * 0.4;
    vec3 col = mix(uP0, uP1, clamp(0.375 + (mott - 0.5) * 0.55 * (1. + nearG) + (blotch - 0.5) * 0.3 * nearG, 0., 1.));
    col *= 0.94 + 0.12 * vnoise(p * 1.7) * (1. - smoothstep(0.3, 1.5, f));
    float minor = grid(p, 10., fw * 0.7) * (1. - smoothstep(0.4, 1.6, f)) * (0.1 + 0.05 * nearG);
    float major = grid(p, 50., fw * 0.7) * (1. - smoothstep(3., 12., f)) * 0.17 * (1. + nearG);
    col = mix(col, uCons * 0.5, max(minor, major));
    // old folds every 800 m: a pale ridge with a darker valley beside it
    vec2 fc = mod(p + vec2(318., 345.), 800.) - 400.;
    col *= 1. + 0.5 * (fold(fc.x) + fold(fc.y)) * (1. - smoothstep(1.5, 7., f));
    // and one crease straight across the avenue, a little askew, 60 m ahead of where we come in: a pale ridge
    // with its highlight edge and the darker valley beside it
    float cz = p.y - ${Z0 - 62}. - p.x * 0.07, cf = 1. - smoothstep(2., 9., fw.y);
    col *= 1. + (0.9 * fold(cz * 0.8) * cf);
    col = mix(col, uP2 * 1.25, 0.5 * exp(-cz * cz * 0.9) * cf);

    // ---- the river
    float sd, s; river(p, sd, s);
    float hw = 30. + 15. * smoothstep(60., 260., abs(p.x));
    float tR = 0.02 + s * uRivK, rOn = smoothstep(tR, tR + 0.012, uU);
    float fs = clamp(min(fwidth(sd) + 1e-3, f * 1.5), 1e-3, 40.);
    float inR = 1. - smoothstep(hw - fs, hw + fs, abs(sd));
    col = mix(col, uP2, 0.2 * inR * rOn);
    float sp = hw / 3.6;
    float wv = sd + sin(s * 0.045 - uTime * 0.9) * 2.4 + sin(s * 0.019 + uTime * 0.35) * 1.6;
    float dl = abs(fract(wv / sp + 0.5) - 0.5) * sp;
    float dash = 0.55 + 0.45 * step(fract(s / 46. - uTime * 0.16 + floor(wv / sp + 0.5) * 0.37), 0.72);
    float wl = (1. - smoothstep(fs * 0.5, fs * 1.5, dl)) * step(abs(sd), hw - sp * 0.4) * dash;
    wl = mix(wl, 0.14, smoothstep(1.2, 5., fs)) * inR;
    float bank = 1. - smoothstep(fs * 0.7, fs * 1.9, abs(abs(sd) - hw));
    float tipR = 1. + 1.2 * (1. - smoothstep(0., 0.012, uU - tR)) * (1. - smoothstep(1., 4., fs));
    col = mix(col, uInk * 0.95 * tipR, clamp(max(wl * 0.8, bank * 0.95) * rOn * (1. - 0.6 * smoothstep(3., 14., fs)), 0., 1.));

    // ---- the street plan: kerbs outline the blocks, racing out from the avenue as the epoch passes
    float cityR = 950. + 70. * sin(p.x * 0.004 + 1.) * cos(p.y * 0.0033) + 40. * sin((p.x + p.y) * 0.007);
    float m = (1. - smoothstep(cityR - 20., cityR, r)) * step(hw + 7., abs(sd)) * step(133., r);
    for (int i = 0; i < 2; i++) m *= step(uPark[i].z + 2., length(p - uPark[i].xy));
    for (int i = 0; i < 4; i++) m *= step(uClear[i].z, length(p - uClear[i].xy));
    vec2 c = p - vec2(0., ${ZOFF}.);
    vec2 dxy = abs(fract(c / ${STREET}. + 0.5) - 0.5) * ${STREET}.;
    float wxs = abs(p.x) < 30. ? 12. : (abs(abs(p.x) - 300.) < 30. || abs(abs(p.x) - 600.) < 30. ? 9. : 6.);
    float wzs = abs(abs(c.y - 300.) - 300.) < 30. || abs(c.y + 300.) < 30. ? 9. : 6.;
    float dg = min(abs(p.x - p.y), abs(p.x + p.y)) * 0.7071;
    float q = min(min(dxy.x - wxs, dxy.y - wzs), dg - 8.);
    float sA = (${Z0}. - p.y) / uPL;
    float tS = min((sA < 0.0867 ? sA - 8. / uPL : 0.08 + (sA - 0.0867) * 0.25) + abs(p.x) / 6000., 0.33 + r / 3000.);
    // (the streets nearest the entry are the first thing ruled: the avenue's kerbs run on ahead of us and the first
    // two cross streets shoot out to left and right at u 0.005 and 0.02)
    float ez = ${Z0}. - p.y;
    float tE = (ez < 60. ? max(ez, 0.) * (0.005 / 60.) : 0.005 + (ez - 60.) * 0.00025) + abs(p.x) / 9000. + 9. * step(150., ez) - 0.06 * uThrough;
    tS = min(tS, tE);
    float sOn = smoothstep(tS, tS + 0.004, uU);
    float tipS = 1. + 1.6 * (1. - smoothstep(0., 0.01, uU - tS)) * (1. - smoothstep(0.5, 3., f));
    // each family of kerbs is antialiased and faded by its own screen-space derivative, so the lines that run
    // away from us stay crisp to the horizon while the ones across the view thin out before they can shimmer
    float qx = dxy.x - wxs, qz = dxy.y - wzs, fdg = max(fwidth(dg), 1e-4);
    float kx = (1. - smoothstep(fw.x * 0.6, fw.x * 1.6, abs(qx))) * step(-0.5, qz) * step(8., dg) * (1. - 0.8 * smoothstep(1.5, 7., fw.x));
    float kz = (1. - smoothstep(fw.y * 0.6, fw.y * 1.6, abs(qz))) * step(-0.5, qx) * step(8., dg) * (1. - 0.8 * smoothstep(1.5, 7., fw.y));
    float kd = (1. - smoothstep(fdg * 0.6, fdg * 1.6, abs(dg - 8.))) * step(0., min(qx, qz)) * (1. - 0.8 * smoothstep(1.5, 7., fdg));
    float kerb = max(max(kx, kz), kd);
    float walk = (1. - smoothstep(f * 0.5, f * 1.4, abs(q - 2.5))) * (1. - smoothstep(0.25, 0.9, f)) * 0.35;
    float lane = (1. - smoothstep(f * 0.5, f * 1.4, min(dxy.x, dxy.y))) * step(fract((p.x + p.y) / 9.), 0.5) * (1. - smoothstep(0.3, 1.0, f)) * 0.3 * step(q, -1.);
    float st = max(max(kerb * 0.75, walk), lane);
    // the sheet is planned before it is drawn: every lot's building line is there from the start as a faint
    // dashed construction line, and sinks back once the kerbs are ruled over it
    float px = (1. - smoothstep(fw.x * 0.6, fw.x * 1.6, abs(qx - 4.))) * step(3.5, qz) * (1. - 0.85 * smoothstep(1.2, 6., fw.x));
    float pz = (1. - smoothstep(fw.y * 0.6, fw.y * 1.6, abs(qz - 4.))) * step(3.5, qx) * (1. - 0.85 * smoothstep(1.2, 6., fw.y));
    float plan = max(px * step(fract(p.y / 7.), 0.6), pz * step(fract(p.x / 7.), 0.6)) * step(13., dg);
    col = mix(col, uCons * 0.8, plan * 0.42 * m * (1. - 0.65 * sOn) * (1. - smoothstep(500., 900., dG)));
    col = mix(col, uInk * 0.9 * tipS, clamp(st * m * sOn, 0., 1.));

    // ---- parks: stippled dot fields
    for (int i = 0; i < 2; i++) {
      float pr = length(p - uPark[i].xy), pin = 1. - smoothstep(uPark[i].z - 6., uPark[i].z - 1., pr);
      vec2 pc = p / 3.6, id = floor(pc);
      vec2 o = vec2(hash(id), hash(id + 9.7)) * 0.6 + 0.2;
      float d = length(fract(pc) - o) * 3.6;
      float dt = (1. - smoothstep(0.32, 0.32 + f, d));
      dt = mix(dt, 0.07, smoothstep(0.5, 2., f));
      col = mix(col, uInk * 0.85, dt * 0.7 * pin * step(abs(sd), 1e5) * step(hw + 3., abs(sd)) * smoothstep(uPark[i].w, uPark[i].w + 0.08, uU - 0.0004 * pr));
    }
    // ---- the eraser: a soft pale band sweeps the district, leaving a smudge
    vec2 rb = step(uRubBox.xz, p) * step(p, uRubBox.yw);
    float inBox = rb.x * rb.y;
    float bx = p.y - uRub;
    col = mix(col, uP2 * 1.5, 0.55 * exp(-bx * bx / 260.) * inBox * step(uRubBox.z - 30., uRub) * step(uRub, uRubBox.w + 30.));
    col = mix(col, uP2, 0.14 * inBox * step(uRub, p.y) * vnoise(p * 0.09));
    // ---- rare: the sheet of tracing paper
    float inS = step(uSheet.x, p.x) * step(p.x, uSheet.y) * step(abs(p.y + 40.), 620.);
    float eW = max(f, 1.);
    float edgeS = max(1. - smoothstep(eW, eW * 2.2, abs(p.x - uSheet.x)), 1. - smoothstep(eW, eW * 2.2, abs(p.x - uSheet.y))) * step(abs(p.y + 40.), 620.);
    edgeS = max(edgeS, (1. - smoothstep(eW, eW * 2.2, abs(abs(p.y + 40.) - 620.))) * step(uSheet.x, p.x) * step(p.x, uSheet.y));
    col = mix(col, vec3(0.42, 0.55, 0.66), 0.45 * inS);
    col = mix(col, uInk * 0.85, 0.6 * edgeS);
    if (uSnow > 0.5) col = mix(col, uP2, 0.08);
    // the sheet pales towards its far edges, as blueprints do where the exposure was uneven
    col = mix(col, uP2, 0.6 * smoothstep(120., 1900., length(vP - cameraPosition)));
    gl_FragColor = vec4(col, 1.);
    #include <fog_fragment>
  }`;

const SKY_FRAG = /* glsl */`
  uniform vec3 uP0, uP1, uP2, uInk, uCons, uWarm, uNorth, uN1, uN2; uniform float uTime, uBand, uWarmK, uNightK;
  varying vec3 vDir;
  ${HASH}
  void main() {
    vec3 d = normalize(vDir); float e = d.y;
    // more paper: darkest overhead, an unevenly exposed pale band above the horizon
    vec2 mp = d.xz / (1. + abs(d.y));
    float mott = vnoise(mp * 3.) * 0.55 + vnoise(mp * 9. + 3.) * 0.3 + vnoise(mp * 31.) * 0.15;
    float band = exp(-max(e, 0.) * uBand * (0.8 + 0.5 * mott));
    // (overhead the sheet is lifted a little off its darkest and mottled more strongly: the finale looks straight up)
    vec3 col = mix(mix(uP0, uP1, mix(0.2, 0.75, uNightK)), uP2, band);
    col = mix(col, uWarm, uWarmK * band * band * (0.6 + 0.4 * mott));
    float amp = mix(0.2, mix(0.36, 0.5, uNightK), smoothstep(0.3, 0.6, e));
    float blot = vnoise(mp * 1.3 + 11.) * 0.6 + vnoise(mp * 4.7 + 5.) * 0.4;
    col *= 1. - 0.5 * amp + amp * mix(mott, blot, 0.5 * smoothstep(0.3, 0.6, e));
    col *= 0.97 + 0.06 * hash(floor(mp * 900.));
    // the grid runs faintly up the sheet and fades out by 30 degrees
    float hl = max(length(d.xz), 1e-3);
    float az = atan(d.x, -d.z + (abs(d.x) + abs(d.z) < 1e-5 ? 1e-5 : 0.)) * 1146.;
    float el = e / hl * 1146.;
    float fa = max(fwidth(el), 1e-3), fb = clamp(fwidth(az), 1e-3, 30.);
    float gl1 = 1. - smoothstep(fa * 0.5, fa * 1.5, abs(fract(el / 50. + 0.5) - 0.5) * 50.);
    float gl2 = 1. - smoothstep(fb * 0.5, fb * 1.5, abs(fract(az / 50. + 0.5) - 0.5) * 50.);
    col = mix(col, uCons * 0.6, max(gl1, gl2) * 0.075 * (1. - smoothstep(0.2, 0.5, e)) * step(0., e) * (1. - smoothstep(4., 14., fa)));
    // overhead there is only more paper, lying flat: a faint ruled grid on a plane (straight lines, never a pole),
    // an old fold crease across it, and the mottling
    vec2 zc = d.xz / max(e, 0.25) * 7. + vec2(0.37, 0.21);
    vec2 zf = max(fwidth(zc), vec2(1e-4)), zd = abs(fract(zc + 0.5) - 0.5);
    float zg = max(1. - smoothstep(zf.x * 0.5, zf.x * 1.5, zd.x), 1. - smoothstep(zf.y * 0.5, zf.y * 1.5, zd.y));
    vec2 zd5 = abs(fract(zc / 5. + 0.5) - 0.5) * 5.;
    float zg5 = max(1. - smoothstep(zf.x * 0.7, zf.x * 2., zd5.x), 1. - smoothstep(zf.y * 0.7, zf.y * 2., zd5.y));
    float over = smoothstep(0.5, 0.74, e);
    col = mix(col, uCons * 0.6, max(zg * 0.045, zg5 * 0.1) * over * (1. - smoothstep(0.2, 0.5, max(zf.x, zf.y))));
    float cz = (zc.x * 0.8 + zc.y * 0.6 - 3.7) * 7.;
    col *= 1. + 0.22 * over * (exp(-cz * cz * 0.08) - 0.6 * exp(-(cz - 2.5) * (cz - 2.5) * 0.05));
    // the north point: a drawn circle with a centre cross and one arrow, turning very slowly
    float nd = dot(d, uNorth);
    if (nd > 0.9) {
      vec2 uv = vec2(dot(d, uN1), dot(d, uN2)) / 0.1045;
      float a = uTime * 0.04, ca = cos(a), sa = sin(a);
      uv = vec2(ca * uv.x - sa * uv.y, sa * uv.x + ca * uv.y);
      float fu = max(fwidth(uv.x) + fwidth(uv.y), 1e-4) * 0.8, rr = length(uv);
      float ln = 1. - smoothstep(fu, fu * 2.2, abs(rr - 1.));
      ln = max(ln, (1. - smoothstep(fu * 0.6, fu * 1.6, abs(rr - 0.9))) * 0.5);
      ln = max(ln, (1. - smoothstep(fu, fu * 2.2, min(abs(uv.x), abs(uv.y)))) * step(rr, 0.28));
      ln = max(ln, (1. - smoothstep(fu, fu * 2.2, abs(uv.x))) * step(0., uv.y) * step(uv.y, 1.45));
      float ah = abs(abs(uv.x) - (1.45 - uv.y) * 0.45);
      ln = max(ln, (1. - smoothstep(fu, fu * 2.2, ah)) * step(1.05, uv.y) * step(uv.y, 1.45));
      col = mix(col, uInk * 1.25, ln * 0.85);
    }
    gl_FragColor = vec4(col, 1.);
  }`;

// ---------------------------------------------------------------------------------------------- helpers
// The engine's filmic tone map deepens and shifts dark blues, so paper colours are pre-distorted: this returns
// the linear colour that comes out of the pipeline (exposure 1) as the given hex.
function paperColour(hexStr) {
  const fit = (v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081);
  const aces = (c) => {
    const a = fit(0.59719 * c[0] + 0.35458 * c[1] + 0.04823 * c[2]), b = fit(0.076 * c[0] + 0.90834 * c[1] + 0.01566 * c[2]), d = fit(0.0284 * c[0] + 0.13383 * c[1] + 0.83777 * c[2]);
    return [1.60475 * a - 0.53108 * b - 0.07367 * d, -0.10208 * a + 1.10813 * b - 0.00605 * d, -0.00327 * a - 0.07276 * b + 1.07602 * d];
  };
  const t = new THREE.Color(hexStr), tl = [t.r, t.g, t.b], c = tl.slice();
  for (let it = 0; it < 500; it++) { const o = aces(c.map((x) => x / 0.6)); for (let i = 0; i < 3; i++) c[i] = Math.max(1e-5, c[i] + 0.3 * (tl[i] - o[i])); }
  return new THREE.Color().setRGB(c[0], c[1], c[2]);
}
function lineSet() {
  const d = [];
  const S = {
    d, rank: MED, style: SOLID, col: WHITE, kind: K_STATIC, ws: 1,
    set(o) { Object.assign(S, o); return S; },
    raw(ax, ay, az, bx, by, bz, t0, t1, t2, t3, x0 = 0, x1 = 0) {
      d.push(ax, ay, az, bx, by, bz, LW[S.rank] * S.ws, S.style + 4 * S.rank, S.col, S.kind, t0, t1, t2, t3, x0, x1);
    },
    seg(ax, ay, az, bx, by, bz, b0 = -1, b1 = -0.5, fade = 9, sway = 0, x1 = 0) { S.raw(ax, ay, az, bx, by, bz, b0, b1, fade, sway, 0, x1); },
    poly(pts, b0 = -1, b1 = -0.5, fade = 9, sway = 0, x1 = 0) {
      const n = pts.length - 1;
      for (let i = 0; i < n; i++) {
        const a = pts[i], b = pts[i + 1];
        S.raw(a[0], a[1], a[2], b[0], b[1], b[2], lerp(b0, b1, i / n), lerp(b0, b1, (i + 1) / n), fade, sway, 0, x1);
      }
    },
    // circle of radius r about c in the plane of unit vectors e1, e2
    circle(c, e1, e2, r, n, b0 = -1, b1 = -0.5, fade = 9, sway = 0, a0 = 0, a1 = Math.PI * 2) {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const a = lerp(a0, a1, i / n), ca = Math.cos(a) * r, sa = Math.sin(a) * r;
        pts.push([c[0] + e1[0] * ca + e2[0] * sa, c[1] + e1[1] * ca + e2[1] * sa, c[2] + e1[2] * ca + e2[2] * sa]);
      }
      S.poly(pts, b0, b1, fade, sway);
    },
    get count() { return d.length / 16; },
  };
  return S;
}

function lineGeometry(list) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const ib = new THREE.InstancedInterleavedBuffer(new Float32Array(list), 16);
  g.setAttribute('aA', new THREE.InterleavedBufferAttribute(ib, 3, 0));
  g.setAttribute('aB', new THREE.InterleavedBufferAttribute(ib, 3, 3));
  g.setAttribute('aS', new THREE.InterleavedBufferAttribute(ib, 4, 6));
  g.setAttribute('aT', new THREE.InterleavedBufferAttribute(ib, 4, 10));
  g.setAttribute('aX', new THREE.InterleavedBufferAttribute(ib, 2, 14));
  g.instanceCount = list.length / 16;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 300, 0), 6000);
  return g;
}

const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

function lineMesh(list, U, order = 3) {
  const m = new THREE.ShaderMaterial({
    vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, fog: true, transparent: true, depthWrite: false,
    uniforms: { ...fogU(), uU: U.uU, uTime: U.uTime, uRes: U.uRes, uCol: U.uCol, uFlock: U.uFlock, uCam: U.uCam, uScript: U.uScript, uScript2: U.uScript2, uSheet: U.uSheet },
  });
  const mesh = new THREE.Mesh(lineGeometry(list), m);
  mesh.frustumCulled = false; mesh.renderOrder = order;
  return mesh;
}

// river centre-line: a smooth curve from the east, round the south and west of the plaza, out to the north-west
function riverCourse() {
  const ctl = [[2300, 440], [1300, 372], [620, 300], [270, 212], [0, 178], [-160, 132], [-218, 10], [-232, -150], [-400, -420], [-800, -860], [-1500, -1640]];
  const curve = new THREE.CatmullRomCurve3(ctl.map((p) => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal');
  // denser samples round the bend at the plaza, where the curve matters
  const ts = [];
  for (let i = 0; i < NR; i++) { const k = i / (NR - 1); ts.push(k); }
  const pts = ts.map((k) => { const t = 0.5 + 0.5 * Math.sign(k - 0.5) * Math.pow(Math.abs(2 * k - 1), 1.6); const v = curve.getPoint(t); return [v.x, v.z]; });
  let total = 0; const acc = [0];
  for (let i = 0; i < NR - 1; i++) { total += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); acc.push(total); }
  const halfWidth = (x) => 30 + 15 * smoothstep(60, 260, Math.abs(x));
  // nearest point: { d (unsigned), s (metres from the east end), tx, tz (unit tangent) }
  const near = (x, z) => {
    let best = 1e18, s = 0, tx = 1, tz = 0;
    for (let i = 0; i < NR - 1; i++) {
      const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0] - ax, bz = pts[i + 1][1] - az, L2 = bx * bx + bz * bz;
      const t = clamp(((x - ax) * bx + (z - az) * bz) / L2, 0, 1), dx = x - ax - bx * t, dz = z - az - bz * t, dd = dx * dx + dz * dz;
      if (dd < best) { best = dd; const L = Math.sqrt(L2); s = acc[i] + t * L; tx = bx / L; tz = bz / L; }
    }
    return { d: Math.sqrt(best), s, tx, tz };
  };
  const at = (s) => {
    s = clamp(s, 0, total - 0.01);
    let i = 0; while (i < NR - 2 && acc[i + 1] < s) i++;
    const k = (s - acc[i]) / (acc[i + 1] - acc[i]), L = acc[i + 1] - acc[i];
    return { x: lerp(pts[i][0], pts[i + 1][0], k), z: lerp(pts[i][1], pts[i + 1][1], k), tx: (pts[i + 1][0] - pts[i][0]) / L, tz: (pts[i + 1][1] - pts[i][1]) / L };
  };
  return { pts, total, near, at, halfWidth };
}

const cityRadius = (x, z) => 950 + 70 * Math.sin(x * 0.004 + 1) * Math.cos(z * 0.0033) + 40 * Math.sin((x + z) * 0.007);

// ---------------------------------------------------------------------------------------------- world
export default {
  id: 'drafted-city',
  name: 'The Drafted City',
  category: 'city',
  weirdness: 0.6,
  media: ['rail', 'cable'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();

    // ---- which sheet is on the board today
    const vr = rng.fork ? rng.fork('sheet') : rng;
    const hour = vary.hour && vary.hour !== 'any' ? vary.hour : vr.pick(['day', 'day', 'day', 'night', 'night', 'dawn', 'golden']);
    const weather = vr.pick(['few', 'many', 'many', 'rain']);
    const season = vr.pick(['full', 'full', 'autumn', 'winter']);
    const spire = vr.pick(['ziggurat', 'gothic', 'drums', 'ziggurat']);
    const transit = vr.pick(['tram', 'tram', 'el']);
    const airCast = vr.pick(['birds', 'birds', 'airships']);
    const rare = !!vary.rare;
    const night = hour === 'night', low = hour === 'dawn' || hour === 'golden';

    const hex = ['#0B2A4A', '#12406E', '#1E5A94', '#F3F7FB', '#9FC2E0', '#F1E6C8', '#E63A2E'];
    if (night) { hex[0] = '#0A2038'; hex[1] = '#0D2C4C'; hex[2] = '#154270'; }
    else if (hour === 'dawn') { hex[0] = '#0C2D50'; hex[2] = '#2767A4'; }
    else if (hour === 'golden') { hex[0] = '#0D2B4B'; hex[1] = '#144370'; hex[2] = '#255F98'; }
    const pal = hex.map((h) => new THREE.Color(h));
    for (let i = 0; i < 3; i++) { pal[i] = paperColour(hex[i]); hex[i] = '#' + pal[i].getHexString(); }
    const fogCol = pal[2].clone();
    scene.background = fogCol.clone();
    scene.fog = new THREE.FogExp2(fogCol, weather === 'rain' ? 0.00072 : 0.00055);

    // ---- the hero: the Spire and the Compass at the origin
    const hero = await buildHero(ctx, { palette: hex, sheet: false, progress: 0, hoistLine: false, cast: spire, night });
    scene.add(hero.object);
    const fly = hero.anchors.flyThrough;
    await ctx.yield();

    // ---- the one continuous line we ride: avenue, bridge hump, plaza, hoist spiral, straight to the ring
    const pts = [[0, 10, Z0], [0, 10, 500], [0, 10, 430], [0, 10, 360], [0, 10, 290], [0, 10.6, 240], [0, 13.6, 178], [0, 11.6, 138],
      [9, 12.6, 116], [28, 17, 88], [49, 23, 62]];
    for (const p of fly) pts.push([p.x, p.y, p.z]);
    const path = makePath(pts);
    const NS = 600, pathPts = [];
    for (let i = 0; i <= NS; i++) pathPts.push(path.pointAt(i / NS));
    const pathY = (u) => { const k = clamp(u, 0, 1) * NS, i = Math.min(NS - 1, Math.floor(k)); return lerp(pathPts[i].y, pathPts[i + 1].y, k - i); };
    let uH = 0.46; { let best = 1e9; for (let i = 0; i <= NS; i++) { const d = pathPts[i].distanceTo(fly[0]); if (d < best) { best = d; uH = i / NS; } } }
    const PL = path.length;
    const uAtZ = (z) => clamp((Z0 - z) / PL, 0, 1);                       // on the avenue the path is straight
    // the tip of the line we ride: 8 m ahead of us for the first seconds, then it runs on ahead
    const sched = (s) => (s < 0.0867 ? s - 8 / PL : 0.08 + (s - 0.0867) * 0.25);
    // when the street plan reaches a point: it shoots out sideways from the tip (must match the ground shader)
    const streetReveal = (x, z) => Math.min(sched((Z0 - z) / PL) + Math.abs(x) / 6000, 0.33 + Math.hypot(x, z) / 3000);
    // the hero's own clock (the brief's seconds / 40) against the real path: the hoist is caught at uH, the lead
    // goes once round the ring over u 0.80-0.90 while we look up at it, and the compass lifts away from u 0.955
    const U_RING = 0.8;
    const heroU = (u) => (u < uH ? (u * 0.44) / uH : u < U_RING ? 0.44 + ((u - uH) * 0.385) / (U_RING - uH) : u < 0.9 ? 0.825 + (u - U_RING) * 0.75 : u);
    const worldU = (h) => uH + ((h - 0.44) * (U_RING - uH)) / 0.385;       // inverse, for hero times during the climb
        // the draw-front keeps 14 m under the cage through the climb. As the gaze comes up (u 0.70-0.76) it overtakes
    // us and leads by 36 m, the tower rising ahead of the cage but never across the line of sight to the ring; then
    // (u 0.825-0.875, the ring clear of the upper tiers) it closes the crown, so the finials are ruled while the
    // lead is still going round
    // (through the one image, u 0.50-0.65, it is 17 m under us: we look down past the gate at the slab in hand and
    // the hatched faces falling away below it. Over u 0.635-0.765 it overtakes the cage and comes to lead it by
    // 32 m, at a pace the gaze can follow up (see gazeAt): the tower's rising top stays in the picture all the way
    // from the look down to the look up at the ring, and the drawn tower stays clear of the sight line to the ring)
    const frontGap = (u) => 14 + 3 * smoothstep(0.46, 0.52, u) * (1 - smoothstep(0.62, 0.67, u));
    const drawFront = (u) => lerp(Math.max(-5, pathY(u) - frontGap(u)) + 46 * smoothstep(0.635, 0.765, u), 582, smoothstep(0.825, 0.875, u));

    // ---- shared uniforms
    const U = {
      uU: { value: 0 }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(800, 450) },
      uCol: { value: [pal[3].clone().multiplyScalar(1.6), pal[4].clone().multiplyScalar(0.5), pal[5].clone().multiplyScalar(1.4),
        pal[6].clone().multiplyScalar(2.0), pal[3].clone().lerp(pal[4], 0.35).multiplyScalar(0.95), pal[3].clone().lerp(pal[4], 0.5).multiplyScalar(0.6)] },
      uFlock: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, -500, 0, 1)) },
      uCam: { value: new THREE.Vector3() }, uScript: { value: new THREE.Vector3() }, uScript2: { value: new THREE.Vector3(0, -900, 0) }, uSheet: { value: new THREE.Vector2(1e5, 1e5) },
      uHidden: { value: 0 }, uP0: { value: pal[0] }, uP1: { value: pal[1] }, uP2: { value: pal[2] }, uInk: { value: pal[3] },
      uNight: { value: night ? 1 : 0 }, uSnow: { value: season === 'winter' ? 1 : 0 },
    };

    // ---- the plan: river, parks, clearings
    const river = riverCourse();
    const scribed = hero.anchors.scribed;                                  // the red circle the compass leaves: a park
    const parks = [
      { x: scribed.center.x, z: scribed.center.z, r: scribed.radius - 3, t: 0.2 },
      { x: -430 + rng.range(-40, 40), z: 150 + rng.range(-50, 50), r: rng.range(85, 120), t: 0.36 },
    ];
    const stand = hero.anchors.compassStand;
    // clearings where the compass sets its points (its last stance, and one 180 m step back along its walk)
    const clears = [[stand.x, stand.z, 34], [stand.x + 0.35 * 180, stand.z + 0.937 * 180, 30], [386, 440, 26], [0, 0, 0]];
    const hwX = (x) => (Math.abs(x) < 30 ? 12 : (Math.abs(Math.abs(x) - 300) < 30 || Math.abs(Math.abs(x) - 600) < 30 ? 9 : 6));
    const hwZ = (z) => { const c = z - ZOFF; return Math.abs(Math.abs(c - 300) - 300) < 30 || Math.abs(c + 300) < 30 ? 9 : 6; };
    // may something stand here? (margin m round the point)
    const buildable = (x, z, m) => {
      const r = Math.hypot(x, z);
      if (r > cityRadius(x, z) - 25 - m || r < 138 + m) return false;
      const rv = river.near(x, z); if (rv.d < river.halfWidth(x) + 8 + m) return false;
      for (const p of parks) if (Math.hypot(x - p.x, z - p.z) < p.r + 4 + m) return false;
      for (const c of clears) if (c[2] > 0 && Math.hypot(x - c[0], z - c[1]) < c[2] + m) return false;
      if (Math.min(Math.abs(x - z), Math.abs(x + z)) * 0.7071 < 9 + m) return false;
      return true;
    };

    // ---- the sheet
    const RUB = { x0: -176, x1: -12, z0: 226, z1: 326, u0: 0.185, u1: 0.21 };   // the district that is rubbed out
    const groundU = {
      ...fogU(), uP0: U.uP0, uP1: U.uP1, uP2: U.uP2, uInk: U.uInk, uCons: { value: pal[4] }, uRed: { value: pal[6] },
      uU: U.uU, uTime: U.uTime, uRivK: { value: 0.17 / 2300 }, uPL: { value: PL }, uRub: { value: 1e4 }, uSnow: U.uSnow, uThrough: { value: 0 },
      uRiv: { value: river.pts.map((p) => new THREE.Vector2(p[0], p[1])) },
      uPark: { value: parks.map((p) => new THREE.Vector4(p.x, p.z, p.r, p.t)) },
      uClear: { value: clears.map((c) => new THREE.Vector4(c[0], c[1], c[2], 0)) },
      uSheet: U.uSheet, uRubBox: { value: new THREE.Vector4(RUB.x0 - 6, RUB.x1 + 2, RUB.z0 - 6, RUB.z1 + 6) },
    };
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(11000, 11000).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      fog: true, uniforms: groundU, polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 8,
      vertexShader: /* glsl */`varying vec3 vP;
        #include <fog_pars_vertex>
        void main() { vP = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: GROUND_FRAG,
    }));
    ground.position.y = -0.25; ground.frustumCulled = false; ground.renderOrder = 0;
    scene.add(ground);

    // ---- more paper overhead
    const northDir = new THREE.Vector3(-0.72, low ? 0.2 : 0.56, -0.42).normalize();
    const n1 = new THREE.Vector3(0, 1, 0).cross(northDir).normalize(), n2 = northDir.clone().cross(n1).normalize();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(4600, 32, 20), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
      uniforms: {
        uP0: U.uP0, uP1: U.uP1, uP2: { value: fogCol }, uNightK: { value: night ? 1 : 0 }, uInk: U.uInk, uCons: { value: pal[4] }, uWarm: { value: pal[5].clone().multiplyScalar(0.5) },
        uNorth: { value: northDir }, uN1: { value: n1 }, uN2: { value: n2 }, uTime: U.uTime,
        uBand: { value: low ? 2.3 : night ? 6.5 : 4.6 }, uWarmK: { value: hour === 'golden' ? 0.3 : hour === 'dawn' ? 0.1 : 0 },
      },
      vertexShader: /* glsl */`varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: SKY_FRAG,
    }));
    sky.frustumCulled = false; sky.renderOrder = -1;
    scene.add(sky);
    await ctx.yield();

    // ---- the blocks: every lot is one to three stacked boxes (three generations) with birth epochs
    const near = [], far = [], roofs = [];
    const addBox = (isNear, cx, cz, sx, sz, y0, h, e, dur, death) => { (isNear ? near : far).push(cx, cz, sx, sz, y0, h, e, dur, death, rng()); };
    const rubT = (z) => lerp(RUB.u0, RUB.u1, clamp((RUB.z1 - z) / (RUB.z1 - RUB.z0), 0, 1));   // the eraser runs north, ahead of us
    const NG = 17;
    for (let i = -NG; i < NG; i++) { if ((i & 3) === 0) await ctx.yield(); for (let j = -NG - 1; j < NG; j++) {
      const X0 = STREET * i, X1 = X0 + STREET, Za = ZOFF + STREET * j, Zb = Za + STREET;
      const avenue = (i === -1 || i === 0) && Za > 200;
      const xa = X0 + hwX(X0) + (i === 0 && avenue ? 4 : 3), xb = X1 - hwX(X1) - (i === -1 && avenue ? 4 : 3);
      const za = Za + hwZ(Za) + 3, zb = Zb - hwZ(Zb) - 3;
      const ccx = (xa + xb) / 2, ccz = (za + zb) / 2;
      if (Math.hypot(ccx, ccz) > 1060) continue;
      const mouthRow = j === 3 && (i === -1 || i === 0);
      const split0 = avenue ? [2, 2] : rng.pick([[1, 1], [2, 1], [1, 2], [2, 2], [2, 2], [3, 2]]), split = mouthRow ? [2, 2] : split0;
      const far2 = Math.hypot(ccx, ccz) > 620;
      const nx = far2 && detail < 1 ? 1 : split[0], nz = far2 && detail < 1 ? 1 : split[1];
      const lw = (xb - xa) / nx, ld = (zb - za) / nz;
      for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) {
        const sx = (lw - 1.6) * rng.range(0.84, 1), sz = (ld - 1.6) * rng.range(0.84, 1);
        const lx = xa + (a + 0.5) * lw, lz = za + (b + 0.5) * ld, dist = Math.hypot(lx, lz);
        if (!buildable(lx, lz, Math.max(sx, sz) * 0.62)) continue;
        // (the two lots at the avenue's mouth always stand, tall: they frame the Spire as we come out on the bridge)
        const mouth = mouthRow && Math.abs(lx) < 30;
        if (!avenue && rng() > 0.86 * density && !mouth) continue;
        const inRub = lx > RUB.x0 && lx < RUB.x1 && lz > RUB.z0 && lz < RUB.z1;
        const zone = Math.abs(lx) < 200 && lz > 130;
        let e1, e2, e3, d1, d2, d3;
        if (zone) {
          // three generations, all up while the lot is still 100-150 m ahead of us: the avenue is a canyon when we enter it
          e1 = Math.max(0.08, uAtZ(lz) - 0.19) + Math.abs(lx) * 0.00025 + rng() * 0.012;
          d1 = 0.022; d2 = 0.026; d3 = 0.03;
          e2 = e1 + 0.03 + rng() * 0.01; e3 = e2 + 0.03 + rng() * 0.01;
          // (the rows on the avenue and the ones behind them go up hard on the heels of the ruled line, one generation
          // overtaking the last: the canyon stands by u 0.17 and we ride most of the avenue inside it)
          if (Math.abs(lx) < 125) { const q2 = e2 - e1 - 0.03, q3 = e3 - e2 - 0.03; d1 = 0.014; d2 = 0.018; d3 = 0.022; e2 = e1 + 0.01 + q2 * 0.5; e3 = e2 + 0.012 + q3 * 0.5; }
        } else {
          // (the lots within 450 m of the plaza hurry: their towers ring it by the time we cross it)
          const fast = 1 - smoothstep(380, 520, dist);
          e1 = lerp(0.12, 0.1, fast) + lerp(0.0004, 0.0003, fast) * dist + rng() * lerp(0.04, 0.03, fast);
          d1 = 0.03; d2 = lerp(0.05, 0.035, fast); d3 = lerp(0.06, 0.04, fast);
          e2 = e1 + lerp(0.05, 0.032, fast) + rng() * lerp(0.05, 0.03, fast); e3 = e2 + lerp(0.06, 0.036, fast) + rng() * lerp(0.06, 0.035, fast);
        }
        const sR = streetReveal(lx, lz), tS = sR + (zone && Math.abs(lx) < 64 ? 0.01 : zone && Math.abs(lx) < 125 ? 0.014 : 0.02);
        if (e1 < tS) { const k = tS - e1; e1 += k; e2 += k; e3 += k; }
        const death = inRub ? rubT(lz) : 9;
        if (inRub) { e1 = sR + 0.01 + rng() * 0.004; d1 = d2 = d3 = 0.014; e2 = e1 + 0.016; e3 = e2 + 0.016; }   // finished before the eraser comes
        const isNear = Math.abs(lx) < 125 && lz > 120;
        const h1 = rng.range(8, 15), h2 = rng.range(30, 60);
        const h3 = Math.max(avenue ? rng.range(88, 135) : lerp(90, 220, clamp(1 - (dist - 150) / 380, 0, 1) * rng.range(0.45, 1)), mouth ? 104 : 0);
        const g2 = rng() < (avenue ? 0.92 : clamp(1.05 - dist / 900, 0.06, 0.9)) || mouth;
        const g3 = g2 && (rng() < (avenue ? (lz < 430 ? 0.76 : 0.6) : clamp(1.12 - dist / 470, 0, 0.82)) || mouth);
        addBox(isNear, lx, lz, sx, sz, 0, h1, e1, d1, death);
        let top = h1, tsx = sx, tsz = sz;
        if (g2) { tsx = sx * rng.range(0.76, 0.93); tsz = sz * rng.range(0.76, 0.93); addBox(isNear, lx, lz, tsx, tsz, h1, h2 - h1, e2, d2, death); top = h2; }
        if (g3) { tsx *= rng.range(0.62, 0.86); tsz *= rng.range(0.62, 0.86); addBox(isNear, lx, lz, tsx, tsz, h2, h3 - h2, e3, d3, death); top = h3; }
        if (inRub) {
          // redrawn twice as tall before we have passed
          const eN = death + 0.008 + rng() * 0.004, ht = Math.min(top * 2, 250), hp = ht * rng.range(0.3, 0.5);
          addBox(true, lx, lz, sx, sz, 0, hp, eN, 0.012, 9);
          tsx = sx * rng.range(0.7, 0.85); tsz = sz * rng.range(0.7, 0.85);
          addBox(true, lx, lz, tsx, tsz, hp, ht - hp, eN + 0.01, 0.016, 9);
          top = ht;
        }
        if (dist < 520 && roofs.length < 400) roofs.push([lx, top, lz, tsx, tsz, inRub ? death + 0.07 : (g3 ? e3 + d3 : g2 ? e2 + d2 : e1 + d1)]);
      }
    } }
    await ctx.yield();
    const nNear = near.length / 10, nBox = nNear + far.length / 10;
    const iPos = new Float32Array(nBox * 4), iH = new Float32Array(nBox * 4), iR = new Float32Array(nBox * 4);
    for (let k = 0; k < nBox; k++) {
      const src = k < nNear ? near : far, o = (k < nNear ? k : k - nNear) * 10;
      iPos.set([src[o], src[o + 1], src[o + 2], src[o + 3]], k * 4);
      iH.set([src[o + 4], src[o + 5], src[o + 6], src[o + 7]], k * 4);
      iR.set([src[o + 8], src[o + 9], 0, 0], k * 4);
    }
    const aPos = new THREE.InstancedBufferAttribute(iPos, 4), aH = new THREE.InstancedBufferAttribute(iH, 4), aR = new THREE.InstancedBufferAttribute(iR, 4);
    const instanced = (g, count) => { g.setAttribute('iPos', aPos); g.setAttribute('iH', aH); g.setAttribute('iR', aR); g.instanceCount = count; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 3000); return g; };
    {
      // faces: four walls and a roof on a unit box
      const P = [], N = [], I = [];
      const quad = (a, b, c, d, n) => { const k = P.length / 3; P.push(...a, ...b, ...c, ...d); for (let q = 0; q < 4; q++) N.push(...n); I.push(k, k + 1, k + 2, k, k + 2, k + 3); };
      quad([-0.5, 0, 0.5], [0.5, 0, 0.5], [0.5, 1, 0.5], [-0.5, 1, 0.5], [0, 0, 1]);
      quad([0.5, 0, 0.5], [0.5, 0, -0.5], [0.5, 1, -0.5], [0.5, 1, 0.5], [1, 0, 0]);
      quad([0.5, 0, -0.5], [-0.5, 0, -0.5], [-0.5, 1, -0.5], [0.5, 1, -0.5], [0, 0, -1]);
      quad([-0.5, 0, -0.5], [-0.5, 0, 0.5], [-0.5, 1, 0.5], [-0.5, 1, -0.5], [-1, 0, 0]);
      quad([-0.5, 1, 0.5], [0.5, 1, 0.5], [0.5, 1, -0.5], [-0.5, 1, -0.5], [0, 1, 0]);
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setIndex(I);
      const fills = new THREE.Mesh(instanced(g, nBox), new THREE.ShaderMaterial({
        fog: true, vertexShader: FILL_VERT, fragmentShader: FILL_FRAG, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 4,
        uniforms: { ...fogU(), uU: U.uU, uP0: U.uP0, uP1: U.uP1, uP2: U.uP2, uInk: U.uInk, uNight: U.uNight, uSnow: U.uSnow },
      }));
      fills.frustumCulled = false; fills.renderOrder = 1; scene.add(fills);
      fills.material.uniforms.uSheet = U.uSheet; fills.material.uniforms.uCons = { value: pal[4] }; fills.material.uniforms.uCream = { value: pal[5] };
    }
    const edgeGeo = () => {
      const P = [], C0 = [], C1 = [], E = [], I = [];
      const edge = (a, b, type, idx) => { const k = P.length / 3; P.push(0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0); for (let q = 0; q < 4; q++) { C0.push(...a); C1.push(...b); E.push(type, idx); } I.push(k, k + 1, k + 2, k, k + 2, k + 3); };
      const c = [[0, 0], [1, 0], [1, 1], [0, 1]];
      for (let q = 0; q < 4; q++) { const a = c[q], b = c[(q + 1) % 4]; edge([a[0], 0, a[1]], [b[0], 0, b[1]], 0, q); edge([a[0], 0, a[1]], [a[0], 1, a[1]], 1, q); edge([a[0], 1, a[1]], [b[0], 1, b[1]], 2, q); }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aC0', new THREE.Float32BufferAttribute(C0, 3));
      g.setAttribute('aC1', new THREE.Float32BufferAttribute(C1, 3)); g.setAttribute('aE', new THREE.Float32BufferAttribute(E, 2)); g.setIndex(I);
      return g;
    };
    const edgeMat = (hidden) => new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false, vertexShader: EDGE_VERT, fragmentShader: LINE_FRAG,
      depthFunc: hidden ? THREE.GreaterDepth : THREE.LessEqualDepth,
      uniforms: { ...fogU(), uU: U.uU, uTime: U.uTime, uRes: U.uRes, uCol: U.uCol, uHidden: { value: hidden ? 1 : 0 } },
    });
    const edges = new THREE.Mesh(instanced(edgeGeo(), nBox), edgeMat(false)); edges.frustumCulled = false; edges.renderOrder = 3;
    const hiddenEdges = new THREE.Mesh(instanced(edgeGeo(), nNear), edgeMat(true)); hiddenEdges.frustumCulled = false; hiddenEdges.renderOrder = 2;
    scene.add(hiddenEdges, edges);
    await ctx.yield();

    // ---- everything that is a line
    const L = lineSet();
    const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];
    const av = (z) => Math.max(0.082 + uAtZ(z) * 0.1, sched(uAtZ(z)) + 0.008);   // when avenue furniture is ruled on

    // the line we ride: one heavy rail under the cage with sleepers, then the hoist's red centre-line and ties
    {
      const n = Math.ceil(PL / 4), up = new THREE.Vector3(0, 1, 0), t = new THREE.Vector3(), nn = new THREE.Vector3(), sd = new THREE.Vector3();
      let prev = null, prevC = null;
      const tiers = hero.anchors.tiers, halfAt = (y) => { let h = tiers[0].half; for (const q of tiers) if (y >= q.y0) h = q.half; return h; };
      for (let i = 0; i <= n; i++) {
        const s = i / n, p = path.pointAt(s); path.tangentAt(s, t);
        nn.copy(up).addScaledVector(t, -t.y).normalize(); sd.crossVectors(t, nn).normalize();
        // (over the last 90 m the line falls away to pass under the ring's rim, so nothing is ruled across the opening)
        const rd = 2.1 + 6.9 * clamp((s * PL - (PL - 90)) / 90, 0, 1);
        const r = [p.x - nn.x * rd, p.y - nn.y * rd, p.z - nn.z * rd], c = [p.x + nn.x * 2.7, p.y + nn.y * 2.7, p.z + nn.z * 2.7];
        if (prev) {
          L.set({ kind: K_STATIC, rank: HEAVY, col: WHITE, style: SOLID, ws: 0.45 });
          L.seg(prev[0], prev[1], prev[2], r[0], r[1], r[2], sched((i - 1) / n), sched(s), 9, -1);
          if (s > uH - 0.06 && s < 0.875) {
            L.set({ rank: MED, col: RED, style: DASHDOT, ws: 0.6 });
            const k0 = lerp(0.3, 0.46, clamp(((i - 1) / n - uH + 0.06) / (1 - uH), 0, 1)), k1 = lerp(0.3, 0.46, clamp((s - uH + 0.06) / (1 - uH), 0, 1));
            L.seg(prevC[0], prevC[1], prevC[2], c[0], c[1], c[2], k0, k1 + 1e-4, 9, -1);
          }
        }
        if (i % 2 === 0) {
          L.set({ rank: MED, col: DETAIL, style: SOLID, ws: 0.5 });
          const w = s < uH ? 0.85 : 0.6;
          L.seg(r[0] - sd.x * w, r[1] - sd.y * w, r[2] - sd.z * w, r[0] + sd.x * w, r[1] + sd.y * w, r[2] + sd.z * w, sched(s) + 0.004, sched(s) + 0.008, 9, -1);
        }
        if (s > uH + 0.01 && s < 0.86 && i % 8 === 0) {
          // a tie back to the tower: a construction line that fades once we have passed it
          const rr = Math.hypot(p.x, p.z), ix = p.x / rr, iz = p.z / rr, h = halfAt(p.y - 2) / (hero.anchors.round ? 1 : Math.max(Math.abs(ix), Math.abs(iz)));
          L.set({ rank: FAINT, col: CONS, style: DASH, ws: 1 });
          L.seg(r[0], r[1], r[2], ix * h, r[1], iz * h, sched(s) + 0.01, sched(s) + 0.03, s + 0.05);
        }
        prev = r; prevC = c;
      }
    }

    // tree symbols: a circle on a stick (crossed circles near the avenue), dashed in autumn, bare in winter
    const leaves = [];
    const tree = (x, z, h, b0, nearT, ax) => {
      const r = h * rng.range(0.2, 0.26), st = h - 2 * r;
      L.set({ kind: K_STATIC, rank: nearT ? MED : FAINT, col: WHITE, style: SOLID, ws: 1 });
      L.seg(x, 0, z, x, st + (season === 'winter' ? r : 0), z, b0, b0 + 0.006, 9, 1);
      if (season === 'winter') {
        for (const sg of [-1, 1]) { const e = ax ? [0, sg] : [sg, 0]; L.seg(x, st * 0.7, z, x + e[0] * r * 0.9, st + r * 0.8, z + e[1] * r * 0.9, b0 + 0.006, b0 + 0.01, 9, 1); }
        return;
      }
      L.set({ rank: FAINT, col: nearT ? WHITE : DETAIL, style: season === 'autumn' ? DASH : SOLID });
      const n = nearT ? 14 : 6;
      L.circle([x, st + r, z], ax ? Z : X, Y, r, n, b0 + 0.006, b0 + 0.02, 9, 1, -Math.PI / 2, Math.PI * 1.5);
      if (nearT) L.circle([x, st + r, z], ax ? X : Z, Y, r, n, b0 + 0.01, b0 + 0.024, 9, 1, -Math.PI / 2, Math.PI * 1.5);
      if (season === 'autumn' && nearT && leaves.length < 420) leaves.push([x, st + r, z, b0 + 0.03]);
    };
    const openGround = (x, z, m) => {
      const r = Math.hypot(x, z);
      if (r > cityRadius(x, z) - 30 || r < 136 + m) return false;
      if (river.near(x, z).d < river.halfWidth(x) + 5 + m) return false;
      for (const p of parks) if (Math.hypot(x - p.x, z - p.z) < p.r + m) return false;
      return true;
    };

    // the Main Avenue: tram rails, the red centre-line, lamp ticks, trees in file, dimension arrows
    {
      for (let z = Z0; z > 222; z -= 26) {
        const z1 = Math.max(z - 26, 218);
        L.set({ kind: K_STATIC, rank: MED, col: DETAIL, style: SOLID, ws: 1 });
        for (const x of [-5.8, -4.4, 4.4, 5.8]) L.seg(x, 0.12, z, x, 0.12, z1, av(z), av(z1) + 1e-3);
        L.set({ rank: FAINT, col: RED, style: DASHDOT, ws: 1.3 }); L.seg(0, 0.14, z, 0, 0.14, z1, av(z) + 0.004, av(z1) + 0.005);
      }
      let k = 0;
      for (let z = Z0 - 14; z > 226; z -= 13) {
        const b = av(z) + 0.008; k++;
        for (const sx of [-1, 1]) {
          if (k % 2) {
            const x = sx * 12.9;
            L.set({ kind: K_STATIC, rank: MED, col: WHITE, style: SOLID, ws: 1 });
            L.seg(x, 0, z, x, 6.2, z, b, b + 0.005); L.seg(x, 6.2, z, x - sx * 1.5, 6.6, z, b + 0.005, b + 0.007);
            L.set({ rank: FAINT }); L.seg(x - sx * 1.5, 6.6, z, x - sx * 1.5, 6.0, z, b + 0.007, b + 0.008);
          } else tree(sx * 13.7, z, rng.range(8, 11.5), b + 0.004, true, false);
        }
      }
      // dimension arrows: a witness line each end, the dimension between with slanted ticks; they fade as we pass
      for (let z = Z0 - 40; z > 240; z -= rng.range(34, 60)) {
        const sx = rng.chance(0.5) ? 1 : -1, x = sx * 14.6, h = rng.range(8, 14), b = Math.max(0.09, uAtZ(z) - 0.1), len = rng.range(14, 24);
        L.set({ kind: K_STATIC, rank: FAINT, col: CONS, style: SOLID, ws: 1.2 });
        L.seg(x, h + 2.4, z, x, h + 2.4, z - len, b, b + 0.012, b + 0.09);
        for (const zz of [z, z - len]) { L.seg(x, 0.2, zz, x, h + 3.6, zz, b - 0.006, b, b + 0.09); L.seg(x, h + 1.6, zz + 0.8, x, h + 3.2, zz - 0.8, b + 0.012, b + 0.014, b + 0.09); }
      }
    }
    await ctx.yield();

    // street trees in file along the boulevards, the diagonals and the cross streets by the avenue
    {
      const thin = density * (detail < 1 ? 0.6 : 1);
      const row = (x0, z0, dx, dz, len, off, nearT) => {
        const nx = -dz, nz = dx;
        for (let s = 0; s < len; s += nearT ? 20 : 23) for (const sg of [-1, 1]) {
          const x = x0 + dx * s + nx * off * sg, z = z0 + dz * s + nz * off * sg;
          if (rng() > thin || !openGround(x, z, 3) || Math.abs(x) < 15) continue;
          if (path.nearestXZ(x, z).dist < 14 && z < 140) continue;
          tree(x, z, rng.range(7, nearT ? 11 : 13), streetReveal(x, z) + 0.03 + rng() * 0.012, nearT, Math.abs(dx) > 0.5);
        }
      };
      for (const z of [500, 440, 380, 320, 260]) row(-250, z, 1, 0, 500, 7.4, true);
      for (const x of [-600, -300, 300, 600]) row(x, -900, 0, 1, 1800, 10.4, false);
      for (const z of [ZOFF, ZOFF - 300, ZOFF + 600]) row(-900, z, 1, 0, 1800, 10.4, false);
      row(-640, -640, 0.7071, 0.7071, 1810, 9.6, false); row(-640, 640, 0.7071, -0.7071, 1810, 9.6, false);
      // parks: plan symbols, a circle and a loose scribble flat on the paper
      for (const p of parks) {
        const n = Math.round((p.r * p.r) / 520 * thin);
        for (let i = 0; i < n; i++) {
          const a = rng() * Math.PI * 2, d = Math.sqrt(rng()) * (p.r - 9), x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
          if (river.near(x, z).d < river.halfWidth(x) + 9) continue;
          const r = rng.range(3, 6.5), b = p.t + 0.05 + d * 0.0004 + rng() * 0.03;
          L.set({ kind: K_STATIC, rank: MED, col: DETAIL, style: season === 'autumn' ? DASH : SOLID, ws: 1.4 });
          L.circle([x, 0.3, z], X, Z, r, 9, b, b + 0.02, 9, 0, a, a + Math.PI * 2);
          if (season !== 'winter') {
            const sc = []; for (let q = 0; q < 5; q++) { const aa = rng() * 6.283, dd = rng() * r * 0.75; sc.push([x + Math.cos(aa) * dd, 0.3, z + Math.sin(aa) * dd]); }
            L.set({ rank: FAINT, style: SOLID }); L.poly(sc, b + 0.02, b + 0.03);
          } else { L.set({ rank: FAINT, style: SOLID }); L.seg(x - r * 0.5, 0.3, z, x + r * 0.5, 0.3, z, b + 0.02, b + 0.025); L.seg(x, 0.3, z - r * 0.5, x, 0.3, z + r * 0.5, b + 0.02, b + 0.025); }
        }
      }
      // reeds: rows of upright ticks along both banks, leaning as the wavy lines pass
      L.set({ kind: K_STATIC, rank: FAINT, col: DETAIL, style: SOLID, ws: 1 });
      for (let s = 1500; s < river.total - 1400; s += 3.6 / thin) {
        const q = river.at(s);
        if (Math.hypot(q.x, q.z) > 640 || Math.abs(q.x) < 16) continue;
        const hwv = river.halfWidth(q.x) + rng.range(0.5, 3), sg = rng.chance(0.5) ? 1 : -1, x = q.x - q.tz * hwv * sg, z = q.z + q.tx * hwv * sg;
        const b = 0.02 + s * (0.17 / 2300) + 0.02 + rng() * 0.01;
        L.seg(x, 0, z, x + rng.range(-0.3, 0.3), rng.range(1.6, 3.4), z, b, b + 0.004, 9, 7);
      }
      // masts on the roofs of the tall ones
      for (const r of roofs) {
        if (rng() > 0.55) continue;
        const h = rng.range(4, 13), x = r[0] + rng.range(-0.3, 0.3) * r[3], z = r[2] + rng.range(-0.3, 0.3) * r[4];
        L.set({ rank: FAINT, col: DETAIL }); L.seg(x, r[1], z, x, r[1] + h, z, r[5], r[5] + 0.01);
        if (h > 8) L.seg(x - 1.2, r[1] + h * 0.7, z, x + 1.2, r[1] + h * 0.7, z, r[5] + 0.01, r[5] + 0.012);
      }
    }
    await ctx.yield();

    // bridges: a construction arc sweeps out the span, then the heavy lines follow
    const bridge = (cx, cz, dx, dz, len, width, rise, b0) => {
      const nx = -dz, nz = dx, N = 14, hw = width / 2;
      for (const sg of [-1, 1]) {
        const ox = cx + nx * hw * sg, oz = cz + nz * hw * sg, deck = [], rail = [];
        for (let i = 0; i <= N; i++) { const k = i / N, s = (k - 0.5) * len, y = 0.3 + rise * 4 * k * (1 - k); deck.push([ox + dx * s, y, oz + dz * s]); rail.push([ox + dx * s, y + 1.2, oz + dz * s]); }
        L.set({ kind: K_STATIC, rank: FAINT, col: CONS, style: DASHDOT, ws: 1.3 });
        L.circle([ox, 0.3, oz], [dx, 0, dz], Y, len * 0.5, 18, b0 - 0.03, b0 + 0.01, b0 + 0.09, 0, Math.PI, 0);
        L.set({ rank: HEAVY, col: WHITE, style: SOLID, ws: 1 }); L.poly(deck, b0 + 0.01, b0 + 0.065);
        L.set({ rank: MED, col: DETAIL }); L.poly(rail, b0 + 0.02, b0 + 0.075);
        L.set({ rank: FAINT });
        for (let i = 1; i < N; i++) { const b = b0 + 0.012 + 0.055 * i / N; L.seg(deck[i][0], 0.1, deck[i][2], deck[i][0], deck[i][1], deck[i][2], b, b + 0.006); }
        // cutwaters at the piers
        L.set({ rank: MED });
        for (const k of [0.25, 0.5, 0.75]) { const s = (k - 0.5) * len, px = ox + dx * s, pz = oz + dz * s, b = b0 + 0.02 + 0.05 * k; L.seg(px - dx * 2, 0.15, pz - dz * 2, px + nx * 5 * sg, 0.15, pz + nz * 5 * sg, b, b + 0.005); L.seg(px + dx * 2, 0.15, pz + dz * 2, px + nx * 5 * sg, 0.15, pz + nz * 5 * sg, b, b + 0.005); }
      }
      L.set({ rank: FAINT, col: DETAIL });
      for (const k of [0.25, 0.5, 0.75]) { const s = (k - 0.5) * len, y = 0.3 + rise * 4 * k * (1 - k), b = b0 + 0.02 + 0.05 * k; L.seg(cx + dx * s - nx * hw, y, cz + dz * s - nz * hw, cx + dx * s + nx * hw, y, cz + dz * s + nz * hw, b, b + 0.01); }
    };
    await ctx.yield();
    bridge(0, 178, 0, -1, 88, 24, 4.2, uAtZ(222) - 0.035);
    // (the two nearest the plaza vault the river as we cross it and start the climb; the far ones follow during it)
    [[-219, -40], [420, 256], [900, 330], [-545, -580]].forEach((c, i) => {
      const q = river.at(river.near(c[0], c[1]).s);
      bridge(q.x, q.z, -q.tz, q.tx, 2 * river.halfWidth(q.x) + rng.range(34, 66), 14, rng.range(5, 8), [0.3, 0.37, 0.53, 0.64][i] + rng() * 0.02);
    });

    // ---- things that travel: trams, an elevated railway, cars, barges (rigid dashes on straight lanes)
    {
      // a rigid polyline (local: +x along the lane, z across) riding a lane from (x0, z0) at angle ang
      const rider = (x0, z0, y, ang, laneLen, speed, phase, birth, segs) => {
        const c = Math.cos(ang), s = Math.sin(ang);
        for (const g of segs) L.raw(x0 + g[0] * c - g[1] * s, y, z0 + g[0] * s + g[1] * c, x0 + g[2] * c - g[3] * s, y, z0 + g[2] * s + g[3] * c, ang, speed, phase, laneLen, birth, 0);
      };
      const TRAM = [[0, 0, 9, 0], [10.5, 0, 19.5, 0], [21, 0, 30, 0], [31.5, 0, 40.5, 0]];
      const TRAIN = [0, 1, 2, 3, 4, 5].map((k) => [k * 16, 0, k * 16 + 14, 0]);
      const CAR = [[0, 0, 4.2, 0]];
      const BARGE = [[0, 0, 4, 2.6], [4, 2.6, 13, 2.6], [13, 2.6, 17, 0], [17, 0, 13, -2.6], [13, -2.6, 4, -2.6], [4, -2.6, 0, 0], [17, 0, -8, 8.5], [17, 0, -8, -8.5], [4, -2.6, 4, 2.6]];
      const HP = Math.PI / 2;
      // trams on the avenue: one runs alongside and falls behind
      L.set({ kind: K_LANE, rank: HEAVY, col: WHITE, style: SOLID, ws: 1.5 });
      for (let k = 0; k < 2; k++) {
        rider(-5.1, Z0 + 20, 0.5, -HP, Z0 + 20 - 226, 14, k * 0.5 + rng() * 0.2, 0.11, TRAM);
        rider(5.1, 226, 0.5, HP, Z0 + 20 - 226, 14, k * 0.5 + rng() * 0.2, 0.12, TRAM);
      }
      // street runs: maximal stretches of a street line that are really roadway
      const runs = (alongX, coord, from, to) => {
        const out = []; let start = null;
        for (let s = from; s <= to + 1; s += 30) {
          const x = alongX ? s : coord, z = alongX ? coord : s;
          const ok = s <= to && openGround(x, z, 8) && !clears.some((c) => Math.hypot(x - c[0], z - c[1]) < c[2] + 6);
          if (ok && start === null) start = s;
          if (!ok && start !== null) { if (s - 30 - start >= 150) out.push([start, s - 30]); start = null; }
        }
        return out;
      };
      const lanes = [];
      for (let i = -9; i <= 9; i++) if (i !== 0) for (const r of runs(false, STREET * i, -620, 620)) lanes.push([false, STREET * i, r[0], r[1]]);
      for (let j = -10; j <= 9; j++) for (const r of runs(true, ZOFF + STREET * j, -620, 620)) lanes.push([true, ZOFF + STREET * j, r[0], r[1]]);
      const place = (ln, dirSign, off, y, speed, phase, birth, segs) => {
        const len = ln[3] - ln[2], s0 = dirSign > 0 ? ln[2] : ln[3];
        if (ln[0]) rider(s0, ln[1] + off * dirSign, y, dirSign > 0 ? 0 : Math.PI, len, speed, phase, birth, segs);
        else rider(ln[1] - off * dirSign, s0, y, dirSign > 0 ? HP : -HP, len, speed, phase, birth, segs);
      };
      for (const ln of lanes) {
        const len = ln[3] - ln[2], mid = (ln[2] + ln[3]) / 2, birth = streetReveal(ln[0] ? mid : ln[1], ln[0] ? ln[1] : mid) + 0.05;
        const n = Math.round((len / 75) * density * detail);
        L.set({ kind: K_LANE, rank: MED, col: DETAIL, style: SOLID, ws: 1.6 });
        for (let k = 0; k < n; k++) place(ln, rng.chance(0.5) ? 1 : -1, 1.9, 0.35, rng.range(7, 13), rng(), birth, CAR);
        if (transit === 'tram' && ln[0] && len > 400 && rng.chance(0.6)) {
          L.set({ rank: HEAVY, col: WHITE, ws: 1.5 });
          place(ln, 1, 0.9, 0.5, 14, rng(), birth + 0.02, TRAM); place(ln, -1, 0.9, 0.5, 14, rng(), birth + 0.02, TRAM);
        }
      }
      if (transit === 'el') {
        // the elevated railway: trestle bents and two rails crossing over the avenue, trains of dashes on top
        const zE = 320, yE = 24;
        for (let x = -700; x < 700; x += 20) {
          const b = streetReveal(x, zE) + 0.04, b1 = streetReveal(x + (x < 0 ? 0 : 20), zE) + 0.045;
          L.set({ kind: K_STATIC, rank: HEAVY, col: WHITE, style: SOLID, ws: 1 });
          for (const dz of [-1.3, 1.3]) L.seg(x, yE, zE + dz, x + 20, yE, zE + dz, Math.min(b, b1), Math.max(b, b1) + 0.004);
          L.set({ rank: FAINT, col: DETAIL }); L.seg(x, yE - 2, zE - 1.3, x + 20, yE - 2, zE - 1.3, b + 0.005, b + 0.012);
          L.seg(x, yE, zE - 1.3, x + 10, yE - 2, zE - 1.3, b + 0.008, b + 0.012); L.seg(x + 10, yE - 2, zE - 1.3, x + 20, yE, zE - 1.3, b + 0.008, b + 0.012);
          if (Math.abs(x) < 15 || !openGround(x, zE, 4)) continue;
          L.set({ rank: MED, col: WHITE });
          for (const dz of [-1, 1]) L.seg(x, 0, zE + dz * 4.6, x, yE, zE + dz * 1.6, b - 0.01, b);
          L.set({ rank: FAINT, col: DETAIL }); L.seg(x, yE * 0.45, zE - 3.25, x, yE * 0.8, zE + 2.2, b, b + 0.004); L.seg(x, yE * 0.45, zE + 3.25, x, yE * 0.8, zE - 2.2, b, b + 0.004);
        }
        L.set({ kind: K_LANE, rank: HEAVY, col: WHITE, style: SOLID, ws: 1.8 });
        for (let k = 0; k < 3; k++) { rider(-700, zE - 1.3, yE + 0.9, 0, 1400, 19, k / 3 + rng() * 0.1, 0.16, TRAIN); rider(700, zE + 1.3, yE + 0.9, Math.PI, 1400, 19, k / 3 + rng() * 0.1, 0.16, TRAIN); }
      }
      // the ring road round Compass Plaza: two trams of four dashes and a file of cars, circling
      {
        const ringRider = (r, y, a0, len, speed, birth) => L.raw(r, y, a0, r, y, a0 + len / r, 0, speed / r, 0, 0, birth, 0);
        L.set({ kind: K_RING, rank: HEAVY, col: WHITE, style: SOLID, ws: 1.5 });
        for (let k = 0; k < 2; k++) for (let q = 0; q < 4; q++) ringRider(126.5, 0.5, k * Math.PI + 0.4 + q * 10.5 / 126.5, 9, 14, 0.27);
        L.set({ rank: MED, col: DETAIL, ws: 1.6 });
        for (let k = 0; k < 22; k++) { const inner = k % 2 === 0; ringRider(inner ? 124.4 : 128.6, 0.35, (k / 22) * Math.PI * 2 + rng() * 0.2, 4.2, (inner ? -1 : 1) * rng.range(8, 12), 0.25 + rng() * 0.04); }
        L.set({ kind: K_LANE });
      }
      // barges: lozenges pushing V wakes down the river's straighter reaches
      const reach = (ax, az, bx, bz) => { const a = river.at(river.near(ax, az).s), b = river.at(river.near(bx, bz).s); return [a.x, a.z, Math.atan2(b.z - a.z, b.x - a.x), Math.hypot(b.x - a.x, b.z - a.z)]; };
      L.set({ kind: K_LANE, rank: MED, col: WHITE, style: SOLID, ws: 1.5 });
      for (const rc of [reach(1250, 368, 640, 302), reach(600, 296, 300, 220), reach(-224, 0, -232, -150), reach(-420, -440, -790, -850)]) {
        const n = Math.max(1, Math.round(rc[3] / 170));
        for (let k = 0; k < n; k++) rider(rc[0], rc[1], 0.25, rc[2], rc[3], rng.range(4.5, 6.5), (k + rng() * 0.5) / n, 0.2 + rng() * 0.05, BARGE);
      }
    }
    await ctx.yield();

    const uCloud = 0.7, CLOUD_DRIFT = 350, cloudBase = new THREE.Vector3();     // the scripted clouds (see below)
    const uCloud2 = uH - 0.05, cloudBase2 = new THREE.Vector3();
    // ---- the air: tick-mark birds (or three one-line airships), revision clouds, chalk dust, weather
    const towerFlocks = airCast === 'birds' ? 3 : 1;
    {
      L.set({ kind: K_BIRD, rank: MED, col: WHITE, style: SOLID, ws: 0.9 });
      const bird = (fl, R, hOff, birth) => {
        const ph = rng() * 6.283, span = fl === 3 ? rng.range(0.8, 1.3) : rng.range(2.0, 3.2), sp = (fl === 3 ? 0.03 : rng.range(0.13, 0.3)) * (fl % 2 ? -1 : 1), flap = rng.range(6.5, 10);
        for (const side of [-1, 1]) L.raw(R, hOff, ph, side, span, sp, flap, 1.8, 0, 0, birth, fl);
      };
      const per = Math.round((airCast === 'birds' ? 100 : 70) * (detail < 1 ? 0.7 : 1));
      for (let fl = 0; fl < towerFlocks; fl++) for (let i = 0; i < per; i++) bird(fl, rng.range(105, 180) + rng.gauss() * 8, rng.gauss() * 10, fl === 0 ? -1 : 0.3 + rng() * 0.06);
      L.set({ ws: 0.55 });
      for (let i = 0; i < 60; i++) bird(3, Math.sqrt(rng()) * 17, rng.gauss() * 3.2, 0.4);
      if (airCast === 'airships') {
        for (let k = 0; k < 3; k++) {
          const z = [-250, 260, -520][k] + rng.range(-40, 40), y = [200, 330, 440][k] + rng.range(-20, 20), a = 52, b = 11.5, ph = rng() * 3200, sp = rng.range(7, 10), env = [];
          for (let i = 0; i <= 18; i++) { const t = (i / 18) * Math.PI * 2; env.push([Math.cos(t) * a * (1 - 0.12 * Math.cos(t)), y + Math.sin(t) * b, z]); }
          L.set({ kind: K_DRIFT, rank: HEAVY, col: WHITE, style: SOLID, ws: 2.2 });
          const add = (p, q) => L.raw(p[0], p[1], p[2], q[0], q[1], q[2], -1, sp, ph, 0, 0.05, 3200);
          for (let i = 0; i < 18; i++) add(env[i], env[i + 1]);
          L.set({ rank: MED });
          add([-9, y - b - 0.5, z], [-7, y - b - 4, z]); add([-7, y - b - 4, z], [7, y - b - 4, z]); add([7, y - b - 4, z], [9, y - b - 0.5, z]);
          add([-a * 0.82, y + b * 0.5, z], [-a * 1.18, y + b * 1.3, z]); add([-a * 1.18, y + b * 1.3, z], [-a * 1.1, y, z]);
          add([-a * 0.82, y - b * 0.5, z], [-a * 1.18, y - b * 1.3, z]); add([-a * 1.18, y - b * 1.3, z], [-a * 1.1, y, z]);
          L.set({ rank: FAINT, style: DASH }); add([-a * 0.95, y, z], [a * 1.1, y, z]);
        }
      }
      // revision clouds: scalloped outlines that keep redrawing their scallops
      const cloud = (cx, cy, cz, len, scripted, tilt, span = 5200, birth = -1) => {
        const A = len / 2, B = len * rng.range(0.16, 0.26), ct = Math.cos(tilt), stl = Math.sin(tilt), cph = rng();
        const per = Math.PI * (3 * (A + B) - Math.sqrt((3 * A + B) * (A + 3 * B))), n = Math.max(7, Math.round(per / rng.range(26, 36)));
        // (a drifting cloud never passes over the red centre-cross as seen from the avenue: it is seated clear above
        // or below the sight line from the entry to the cross, 250 m up on the tower's axis)
        if (!scripted && span > 1000) { const ys = 10 + (240 * (Z0 - cz)) / Z0, m = 72 + B * Math.abs(stl); if (Math.abs(cy - ys) < m) cy = ys + (cy >= ys ? m : -m); }
        const at = (t, bulge) => { const ex = Math.cos(t) * (A + bulge), ez = Math.sin(t) * (B + bulge); return [cx + ex, cy + ez * stl, cz + ez * ct]; };
        const ph = rng() * 5000, sp = rng.range(5, 7);
        L.set({ kind: K_DRIFT, rank: HEAVY, col: WHITE, style: SOLID, ws: 2.2 });
        for (let k = 0; k < n; k++) {
          const t0 = (k / n) * Math.PI * 2, t1 = ((k + 1) / n) * Math.PI * 2, bl = (per / n) * rng.range(0.32, 0.5), cyc = (cph + k / n) % 1;
          let prev = at(t0, 0);
          for (let q = 1; q <= 7; q++) {
            const f = q / 7, pnt = at(lerp(t0, t1, f), Math.sin(f * Math.PI) * bl);
            L.raw(prev[0], prev[1], prev[2], pnt[0], pnt[1], pnt[2], (cyc - (q - 1) * 0.014 + 1) % 1, scripted ? 0 : sp, ph, scripted ? (scripted === 2 ? 2 : 1) : 0, birth, span);
            prev = pnt;
          }
        }
      };
      const nCloud = weather === 'few' ? 5 : weather === 'many' ? 12 : 9;
      for (let i = 0; i < nCloud; i++) { let z = rng.range(-1500, 900); if (Math.abs(z) < 170) z = 170 * Math.sign(z || 1) + z; cloud(0, rng.range(250, 500), z, rng.range(150, 400), false, rng.range(0.35, 0.8)); }
      // (three high ones for the look up at the end: lying flat, so they are seen whole from below, and kept off the
      // line of sight through the ring)
      for (let i = 0; i < 3; i++) cloud(0, rng.range(640, 760), [-150, 250, 480][i] + rng.range(-40, 40), rng.range(160, 260), false, 0.3 + 0.75 * (rng.range(0.9, 1.3) - 0.9));
      // two that keep to the air over the entry, and two that keep near the ring's axis for the look up at the finale
      // (short drift loops, faded at their ends)
      // (the entry pair keep to either side of the ghost Spire: short loops that never cross the axis)
      cloud(-200, rng.range(118, 146), 300, rng.range(120, 150), false, rng.range(1.0, 1.25), 220);
      cloud(250, rng.range(185, 225), 120, rng.range(150, 200), false, rng.range(0.9, 1.2), 250);
      {
        const C = hero.anchors.portalSeat.position, n = hero.anchors.portalSeat.normal;
        // placed by where they sit in the look up the hoist: metres beyond the ring, to the right of it, above it
        const rt = new THREE.Vector3(n.z, 0, -n.x).normalize().negate(), upv = new THREE.Vector3().crossVectors(rt, n).normalize();
        const at = (d, r, v) => new THREE.Vector3().copy(C).addScaledVector(n, d).addScaledVector(rt, r).addScaledVector(upv, v);
        const c1 = at(120, -125, 5), c2 = at(175, 130, 70), c3 = at(100, 75, -75);
        cloud(c1.x, c1.y, c1.z, rng.range(130, 170), false, rng.range(0.25, 0.5), 250);
        cloud(c2.x, c2.y, c2.z, rng.range(170, 220), false, rng.range(0.3, 0.6), 290);
        cloud(c3.x, c3.y, c3.z, rng.range(110, 150), false, rng.range(0.3, 0.5), 230);
      }
      // the scripted ones ride uScript together (they appear as the climb begins): one that stands at eye level beyond
      // the tower's corner as the gaze starts up (u 0.70), and two below the ring, either side of the line to it,
      // for the look up (u 0.74-0.80); each is placed by where it is at its moment
      {
        const p = path.pointAt(uCloud), t = path.tangentAt(uCloud), th = Math.hypot(t.x, t.z) || 1, r = Math.hypot(p.x, p.z) || 1;
        cloudBase.set(p.x + (t.x / th) * 105 - (p.x / r) * 68, p.y + 14, p.z + (t.z / th) * 105 - (p.z / r) * 68);
        const C = hero.anchors.portalSeat.position, dx = (0.76 - uCloud) * CLOUD_DRIFT;
        cloud(0, 0, 0, rng.range(108, 124), true, 0.7, 5200, 0.5);
        cloud(C.x + 3 - cloudBase.x - dx, C.y - 78 - cloudBase.y, C.z + 58 - cloudBase.z, rng.range(130, 150), true, rng.range(0.4, 0.55), 5200, 0.5);
        cloud(C.x + 73 - cloudBase.x - dx, C.y - 58 - cloudBase.y, C.z - 17 - cloudBase.z, rng.range(135, 160), true, rng.range(0.4, 0.55), 5200, 0.5);
      }
      // and one over the plaza as the climb begins: high on the left, clear of the compass leg (size and seat by seed)
      {
        const p = path.pointAt(uCloud2), t = path.tangentAt(uCloud2), th = Math.hypot(t.x, t.z) || 1;
        cloudBase2.set(p.x + (t.x / th) * 170 - 240 + rng.range(-30, 30), p.y + 122 + rng.range(-8, 16), p.z + (t.z / th) * 170);
        cloud(0, 0, 0, rng.range(112, 146), 2, rng.range(0.75, 0.95));
      }
      // the tower's axis on the blank sheet: a red dash-dot centre-line with a datum cross in a ghost circle, the
      // one red mark of the entry frame; it sinks to a ghost once the streets are ruled
      L.set({ kind: K_STATIC, rank: MED, col: RED, style: DASHDOT, ws: 1.6 }); L.seg(0, 0, 0, 0, 430, 0, -1, -0.5, 0.11);
      L.set({ rank: HEAVY, style: SOLID, ws: 1.3 }); L.seg(-11, 250, 0, 11, 250, 0, -1, -0.5, 0.11); L.seg(0, 239, 0, 0, 261, 0, -1, -0.5, 0.11);
      L.set({ rank: MED, col: CONS, style: DASH, ws: 2 }); L.circle([0, 250, 0], X, Y, 17, 32, -1, -0.5, 0.11);
      // chalk dust drifting off the rubbed-out district
      L.set({ kind: K_DUST, rank: MED, col: DETAIL, style: SOLID, ws: 3.4 });
      for (let i = 0; i < Math.round(460 * detail); i++) {
        const z = rng.range(RUB.z0, RUB.z1), u0 = rubT(z) + rng() * 0.012;
        L.raw(rng.range(RUB.x0, RUB.x1 + 6), rng.range(1, 90), z, rng.range(60, 380), rng.range(30, 200), rng.range(-160, 160), u0, u0 + rng.range(0.1, 0.2), rng() * 6.283, rng.range(0.6, 2), 0, 0);
      }
      if (season === 'autumn') {
        L.set({ kind: K_LEAF, rank: MED, col: DETAIL, style: SOLID, ws: 1.8 });
        for (const lf of leaves) for (let q = 0; q < 2; q++) L.raw(lf[0] + rng.range(-2, 2), lf[1] + rng.range(-1, 2), lf[2] + rng.range(-2, 2), rng.range(-5, 5), -lf[1], rng.range(-5, 5), rng.range(4, 9), rng(), 0, rng.range(0.8, 2.2), lf[3], 0);
      }
      // paper dust: motes drifting everywhere round the camera
      L.set({ kind: K_RAIN, rank: MED, col: DIM, style: SOLID, ws: 1.35 });
      for (let i = 0; i < Math.round(500 * detail); i++) L.raw(rng.range(0, 90), rng.range(0, 90), rng.range(0, 90), rng.range(20, 60), rng.range(-30, 8), rng.range(-40, 40), rng.range(7, 13), rng(), 0, 90, -1, 0);
      if (weather === 'rain') {
        // drafted rain: short parallel strokes at 60 degrees
        L.set({ kind: K_RAIN, rank: FAINT, col: DETAIL, style: SOLID, ws: 1.5 });
        const box = 300;
        for (let i = 0; i < Math.round(900 * detail); i++) L.raw(rng.range(0, box), rng.range(0, box), rng.range(0, box), box * 0.5, -box * 0.866, 0, rng.range(3.4, 4.6), rng(), rng.range(6, 11), box, -1, 0);
      }
      if (rare) {
        // the rival scheme on the tracing paper: red outlines for the whole eastern district
        const R = lineSet();
        R.set({ kind: K_STATIC, rank: MED, col: RED, style: SOLID, ws: 1.6 });
        for (let i = 0; i < 40; i++) {
          const x = rng.range(170, 780), z = rng.range(-600, 500), sx = rng.range(22, 60) / 2, sz = rng.range(22, 60) / 2, h = rng.range(60, 280) * (1 - Math.abs(z + 50) / 900);
          if (Math.hypot(x, z) < 190) continue;
          const b = 0.6 + rng() * 0.09, c = [[-sx, -sz], [sx, -sz], [sx, sz], [-sx, sz]];
          for (let q = 0; q < 4; q++) {
            const p = c[q], n = c[(q + 1) % 4];
            R.seg(x + p[0], 0.4, z + p[1], x + n[0], 0.4, z + n[1], b + q * 0.004, b + q * 0.004 + 0.004, 9, 0, 1);
            R.seg(x + p[0], 0.4, z + p[1], x + p[0], h, z + p[1], b + 0.016, b + 0.04, 9, 0, 1);
            R.seg(x + p[0], h, z + p[1], x + n[0], h, z + n[1], b + 0.04, b + 0.046, 9, 0, 1);
          }
        }
        // (drawn at draughtsman's red 1.2, and behind whatever stands in front of it: it never crosses the Spire)
        const rivalCol = U.uCol.value.map((c, i) => (i === RED ? pal[6].clone().multiplyScalar(1.2) : c));
        const rival = lineMesh(R.d, { ...U, uCol: { value: rivalCol } }, 5); scene.add(rival);
      }
    }
    const lines = lineMesh(L.d, U, 3);
    scene.add(lines);
    await ctx.yield();

    // ---- our vehicle: a trolley, later a hoist cage, that draws itself round the camera between 4 and 9 s
    const cage = new THREE.Group(); cage.name = 'cage';
    const wheelPivot = new THREE.Group(), wheel = new THREE.Group(), sheave = new THREE.Group();
    {
      const C = lineSet(), hv = 0.062, md = 0.075, ft = 0.085, zf = -1.75, SHX = -1.52;
      const box4 = (pts, b0, b1) => C.poly([...pts, pts[0]], b0, b1);
      // floor frame, then the corner posts. At this depth the picture is 4.2 m by 2.36 m (16:9): the frame keeps to
      // its outer few percent, in the dim line weight, so the cage is felt at the edges and never fences the drawing in
      // (the posts stand just outside a 16:9 picture; the top frame and posts are medium cream, an instrument's
      // line, so the gate rail, the sheave and the red brake lever are what says "vehicle")
      const PX = 2.29, TY = 1.12, GY = -1.03;
      C.set({ kind: K_STATIC, rank: MED, col: DIM, style: SOLID, ws: md });
      box4([[-1.93, -1.55, -0.4], [-1.93, -1.55, -2.5], [1.93, -1.55, -2.5], [1.93, -1.55, -0.4]], 0.1, 0.125);
      C.set({ rank: MED, col: CREAM, ws: 0.07 });
      for (const sx of [-1, 1]) { C.seg(sx * PX, -1.55, zf, sx * PX, TY, zf, 0.13, 0.155); C.seg(sx * PX, -1.55, -0.4, sx * PX, TY, -0.4, 0.14, 0.16); }
      // top frame, with the hanger of the sheave by the left post
      C.seg(-PX - 0.06, TY, zf, PX + 0.06, TY, zf, 0.16, 0.18);
      C.set({ rank: MED, ws: md });
      for (const sx of [-1, 1]) { C.seg(sx * PX, TY, zf, sx * PX, TY, -0.4, 0.17, 0.185); C.seg(SHX + sx * 0.12, TY, -1.8, SHX + sx * 0.04, TY - 0.14, -1.8, 0.185, 0.19); }
      // the lattice gate across the very bottom of the frame
      C.set({ rank: HEAVY, col: DETAIL, ws: hv * 0.8 }); C.seg(-PX, GY, zf, PX, GY, zf, 0.195, 0.207);
      // (half a lattice: one zigzag of faint construction-blue diagonals under the one heavy rail)
      C.set({ rank: FAINT, col: CONS, ws: ft });
      for (let i = 0; i < 10; i++) { const w = (2 * PX) / 10, x = -PX + i * w, bb = 0.205 + i * 0.001; if (i % 2) C.seg(x, GY, zf, x + w, -1.55, zf, bb, bb + 0.004); else C.seg(x + w, GY, zf, x, -1.55, zf, bb + 0.002, bb + 0.006); }
      // short braces in the corners, and the one red brake lever
      C.set({ rank: FAINT, col: CREAM, ws: md });
      for (const sx of [-1, 1]) { C.seg(sx * PX, TY - 0.25, zf, sx * (PX - 0.25), TY, zf, 0.215, 0.22); C.seg(sx * PX, GY + 0.25, zf, sx * (PX - 0.25), GY, zf, 0.217, 0.222); }
      C.set({ rank: HEAVY, col: RED, ws: hv * 1.3 }); C.seg(1.24, -1.5, -1.6, 1.5, -0.6, -1.72, 0.222, 0.228);
      C.set({ rank: MED, ws: md }); C.seg(1.43, -0.6, -1.72, 1.6, -0.56, -1.72, 0.228, 0.23);
      C.set({ col: DETAIL });
      // (same shader, its own colour table: the cage's cream is drawn at 0.9, quieter than the compass)
      const cageCol = U.uCol.value.map((c, i) => (i === CREAM ? pal[5].clone().multiplyScalar(0.9) : c));
      const cageMesh = lineMesh(C.d, { ...U, uCol: { value: cageCol } }, 6); cage.add(cageMesh);
      // the wheel that runs on the ruled line (it folds away when the hoist takes over)
      const Wl = lineSet();
      Wl.set({ kind: K_STATIC, rank: HEAVY, col: DETAIL, style: SOLID, ws: hv }); Wl.circle([0, 0, 0], [0, 1, 0], [0, 0, 1], 0.38, 14, 0.112, 0.128);
      Wl.set({ rank: MED, ws: md }); Wl.circle([0, 0, 0], [0, 1, 0], [0, 0, 1], 0.09, 6, 0.126, 0.13);
      Wl.set({ rank: FAINT, ws: ft }); for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; Wl.seg(0, Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0, Math.cos(a) * 0.38, Math.sin(a) * 0.38, 0.128, 0.132); }
      wheel.add(lineMesh(Wl.d, U, 6)); wheelPivot.position.set(0, -1.72, -2.9); wheelPivot.add(wheel);
      const Fk = lineSet();
      Fk.set({ kind: K_STATIC, rank: MED, col: DETAIL, style: SOLID, ws: md });
      for (const sx of [-1, 1]) Fk.seg(sx * 0.12, 0, 0, sx * 0.3, 0.2, 0.42, 0.124, 0.13);
      wheelPivot.add(lineMesh(Fk.d, U, 6));
      // the turning sheave under the top frame
      const Sh = lineSet();
      Sh.set({ kind: K_STATIC, rank: HEAVY, col: DIM, style: SOLID, ws: hv * 0.8 }); Sh.circle([0, 0, 0], X, Y, 0.125, 12, 0.186, 0.196);
      Sh.set({ rank: MED, ws: md }); Sh.circle([0, 0, 0], X, Y, 0.085, 8, 0.19, 0.198);
      Sh.set({ rank: FAINT, ws: ft }); for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI; Sh.seg(-Math.cos(a) * 0.085, -Math.sin(a) * 0.085, 0, Math.cos(a) * 0.085, Math.sin(a) * 0.085, 0, 0.196, 0.2); }
      sheave.add(lineMesh(Sh.d, U, 6)); sheave.position.set(SHX, 0.98, -1.8);
      cage.add(wheelPivot, sheave);
    }
    scene.add(cage);
    await ctx.yield();

    // ---- the eraser: a soft pale band standing across the district while it is rubbed out
    const eraser = new THREE.Mesh(new THREE.PlaneGeometry(RUB.x1 - RUB.x0 + 30, 170), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      uniforms: { uC: { value: pal[2].clone().lerp(pal[3], 0.35) }, uK: { value: 0 }, uTime: U.uTime },
      vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`uniform vec3 uC; uniform float uK, uTime; varying vec2 vUv;
        void main() {
          float e = smoothstep(0., 0.2, vUv.x) * smoothstep(1., 0.8, vUv.x) * smoothstep(1., 0.35, vUv.y) * smoothstep(0., 0.04, vUv.y);
          float st = 0.7 + 0.3 * sin(vUv.x * 90. + sin(vUv.y * 7. + uTime * 2.) * 2.);
          gl_FragColor = vec4(uC, 0.3 * e * st * uK);
        }`,
    }));
    eraser.position.set((RUB.x0 + RUB.x1) / 2 - 6, 85, RUB.z1); eraser.renderOrder = 4; eraser.frustumCulled = false;
    scene.add(eraser);

    // ---- scripted positions
    const uCross = worldU(0.575);                 // the flock crosses the cage (23 s in the brief)
    const _p = new THREE.Vector3(), _t = new THREE.Vector3(), size = new THREE.Vector2(), gaze = new THREE.Vector3();
    const camPos = new THREE.Vector3(), camQuat = new THREE.Quaternion();
    const ringAt = hero.anchors.portalSeat.position.clone(), ringN = hero.anchors.portalSeat.normal.clone();
    let thru = 0, ghostK = 1;
    // Where the climb looks. The hoist climbs at 55 degrees, so it takes a point well under the cage (0.95 of our
    // distance from the axis) to tip the picture 23 degrees down the tower's face, and one 22 m on along our way
    // to look along the face at the corner ahead, with the city beyond it. From u 0.655 the draw-front overtakes
    // us and the gaze goes up with it: level at 0.69, on the tower's rising top (0.70-0.76), then on to the red
    // centre-cross, a little under it until 0.80 so the tower's top and the clouds fill the lower picture; it
    // stays on the ring while the lead goes round it (u 0.80-0.90)
    const gazeAt = (time, u) => {
      const k = clamp(u, 0, 1) * NS, i = Math.min(NS - 1, Math.floor(k)), a = pathPts[i], b = pathPts[i + 1], f = k - i;
      const x = lerp(a.x, b.x, f), z = lerp(a.z, b.z, f), tx = b.x - a.x, tz = b.z - a.z;
      const sh = (22 * (1 - smoothstep(0.69, 0.75, u))) / (Math.hypot(tx, tz) || 1);
      return gaze.set(tx * sh, lerp(a.y, b.y, f) - 0.95 * Math.hypot(x, z), tz * sh)
        .lerp(ringAt, 0.29 * smoothstep(0.65, 0.765, u) + 0.56 * smoothstep(0.755, 0.8, u) + 0.15 * smoothstep(0.8, 0.85, u));
    };

    const title = night ? 'The Drafted City: Night Shift' : weather === 'rain' ? 'The Drafted City in Rain' : season === 'winter' ? 'The Drafted City in Winter' : 'The Drafted City';
    return {
      scene, path, duration: 40, title,
      ride: 'none', style: 'none',
      variant: { hour, weather, season, spire, transit, airCast, rare },
      camera: { fov: 68, near: 0.3, far: 5200, lookAhead: 25, sway: 0.2, bank: 0.5 },
      pois: [
        { at: [0, 250, 0], from: 0, to: 0.17, weight: 0.3 },                                   // the ghost Spire and its red cross
        { at: [0, 40, 0], from: 0.3, to: uH + 0.02, weight: 0.55 },                             // out over the bridge: the plaza
        // down and inward past the gate at the draw-front through the climb, then up the rising tower to the ring
        { at: gazeAt, from: uH - 0.03, to: 1.0, weight: 0.7, fade: 0.07 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#E63A2E', glow: 0.42, revealDistance: 200, tilt: true },
      post: {
        exposure: 1,
        bloom: { strength: 0.14, radius: 0.15, threshold: 1.05 },
        grade: { saturation: 1.0, contrast: 1.02, tint: '#ffffff', shadowTint: '#000000', vignette: 0.3, grain: 0.035, aberration: 0 },
      },
      update(dt, time, camera, u) {
        U.uU.value = u; U.uTime.value = time;
        if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); if (size.x > 0) U.uRes.value.copy(size); }
        // (the camera behind a portal has its world matrix set directly: read that, never position alone)
        camPos.setFromMatrixPosition(camera.matrixWorld); camQuat.setFromRotationMatrix(camera.matrixWorld);
        sky.position.copy(camPos);
        U.uCam.value.copy(camPos);
        const F = drawFront(u);
        hero.setDrawFront(F); hero.setProgress(heroU(u)); hero.update(dt, time, camera);
        // seen through the previous portal the sheet already carries line work: the streets by the entry are ruled
        // (and stay ruled once we are in), and the idea of the Spire is drawn half as bright again
        if (ctx.through) thru = 1;
        groundU.uThrough.value = thru;
        ghostK += ((ctx.through ? 1.5 : 1) - ghostK) * Math.min(1, dt * 1.5); hero.setGhost(ghostK);
        // the eraser band
        const rubZ = lerp(RUB.z1 + 24, RUB.z0 - 24, (u - RUB.u0 + 0.006) / (RUB.u1 - RUB.u0 + 0.012));
        groundU.uRub.value = u < RUB.u0 - 0.006 ? 1e4 : u > RUB.u1 + 0.006 ? -1e4 : rubZ;
        eraser.position.z = rubZ; eraser.material.uniforms.uK.value = u < RUB.u0 - 0.006 || u > RUB.u1 + 0.006 ? 0 : Math.sin(Math.PI * clamp((u - RUB.u0 + 0.006) / (RUB.u1 - RUB.u0 + 0.012), 0, 1));
        // flocks ride just above the draw-front; one crosses the cage
        // flocks ride just above the draw-front. The first one meets us over the avenue and leads us in; at the end
        // two of them leave the tower and wheel round the ring
        const kIn = 1 - smoothstep(0.05, 0.3, u), kRing = smoothstep(0.66, 0.82, u), kLow = smoothstep(0.47, 0.55, u);
        for (let i = 0; i < 3; i++) {
          // (through the look down they wheel at eye level round the slab in hand, in the upper band of the picture)
          const fv = U.uFlock.value[i], yT = Math.max(F, 14) + lerp(26, 9, kLow) + lerp(15, 10, kLow) * i;
          // (the middle flock joins them more loosely, wheeling wide beyond the ring)
          const kr = kRing * (i === 0 ? 1 : i === 1 ? 0.7 : 0.8), back = i === 1 ? -40 : 14;
          fv.set(lerp(0, ringAt.x - ringN.x * back, kr), lerp(yT, ringAt.y - ringN.y * back - i * 9, kr), lerp(0, ringAt.z - ringN.z * back, kr), lerp(1, i === 0 ? 0.36 : i === 1 ? 0.7 : 0.52, kr));
          if (i === 0 && kIn > 0) { fv.x = lerp(fv.x, -95, kIn); fv.z = lerp(fv.z, Z0 - 215 - u * 900, kIn); fv.y = lerp(fv.y, 62, kIn); fv.w = lerp(fv.w, 0.55, kIn); }
        }
        path.pointAt(u, _p); const r = Math.hypot(_p.x, _p.z) || 1, ix = -_p.x / r, iz = -_p.z / r, k = u - uCross;
        U.uFlock.value[3].set(_p.x + ix * 15 + iz * k * 1500, _p.y - 7 - k * 260, _p.z + iz * 15 - ix * k * 1500, 1);
        U.uScript.value.set(cloudBase.x + (u - uCloud) * CLOUD_DRIFT, cloudBase.y, cloudBase.z);
        U.uScript2.value.set(cloudBase2.x + (u - uCloud2) * 1100, cloudBase2.y, cloudBase2.z);
        if (rare) {
          const x0 = lerp(1700, 150, smoothstep(0.5, 0.6, u)) + 1700 * smoothstep(0.86, 0.96, u);
          U.uSheet.value.set(x0, x0 + 760);
        }
        // the cage rides with the camera; its wheel spins on the line and folds when the hoist takes over
        cage.position.copy(camPos); cage.quaternion.copy(camQuat);
        const fold = smoothstep(uH - 0.07, uH - 0.02, u);
        wheel.rotation.x = -time * 11 * (1 - fold);
        wheelPivot.position.y = -1.72 - fold * 1.4; wheelPivot.rotation.x = fold * 1.2;
        sheave.rotation.z = time * (u > uH - 0.02 ? 5.5 : 1.2);
      },
      dispose() { hero.dispose && hero.dispose(); },
    };
  },
};
