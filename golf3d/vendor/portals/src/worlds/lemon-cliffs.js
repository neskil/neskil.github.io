// THE LEMON CLIFFS: a pastel town stacked up a sea cliff at siesta, flown by a paper plane.
//
// Flat gouache travel poster: every surface is one of two flat tones (sunlit, or shifted to violet)
// split by a hard edge from ONE 4096 px sun depth map of the static town baked at build (the hero
// keeps its own finer map). Sky and haze are quantised into flat bands; a halftone dot screen sits
// in the shade tones. style: 'none'.
//
// Layout (world = hero-local lifted 28 m; sea toward +Z): the majolica dome hero on a town shelf at
// y 28, a near-vertical wall-town to the west (the plane is thrown from a vaulted alley in its
// buttress at y 150), the cliff behind, a gentler east slope with the switchback road and the
// funicular, the lemon stair running on down to the quay, a clear turquoise harbour and a
// breakwater that sweeps in from the west point to the whitewashed arch holding the portal.
//
// Flight (50 s): alley -> burst into the glare -> long left-hand descending helix over the cove ->
// tangent pass 5.5 m off the dome tiles as pigeons burst -> a second, tighter turn out over the
// harbour and back round past the road and funicular -> dive over the landing and down the lower
// lemon stair under the pergola -> level glide over boats hovering on their shadows -> breakwater,
// gulls lifting in sequence -> the arch.
//
// Looks by seed / ctx.vary.hour: noon siesta, early morning (long violet shadows, boats heading
// out), blue evening (windows lit, bulb strings, afterglow), scirocco (peach dust sky), spring
// (wisteria, fresher sea). Cast: ferry or regatta, delivery van or wedding car with ribbons.
// Rare (ctx.vary.rare): the bells swing and every bird in town wheels through the helix.
//
// The town is not one box repeated: cottages to five-storey fronts and wide palazzi, a third under hipped
// terracotta roofs (a second instanced mesh), some with a set-back top storey and roof terrace, a few chapel
// cupolas; washing strung house to house across the lanes; and the terrace walls themselves are painted as rows
// of house fronts with shutters, washing and bougainvillea, their ledges as lemon groves and olive plots.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath } from '../kit/core.js';
import { buildHero, depthProgramsReady } from '../parts/lemon-cliffs.js';

const PALETTE = ['#2F7FD1', '#FFF4DC', '#F4B860', '#E8846B', '#2BB5B0', '#3E3A5C', '#F5D21F'];
const H0 = 28;                                   // hero base / town shelf level

// ---------------------------------------------------------------- shaders
const GLSL_COMMON = /* glsl */`
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y); }
uniform vec2 uRes;
float halftone(float pitch){            // 1 inside a dot; screen anchored, 45 degree screen
  vec2 q = gl_FragCoord.xy * (450.0 / max(uRes.y, 1.0)) / pitch;
  q = vec2(q.x + q.y, q.x - q.y) * 0.7071;
  vec2 g = fract(q) - 0.5; return dot(g, g);
}`;

const P_VERT = /* glsl */`
uniform mat4 uShadowMat; uniform float uTime; uniform vec3 uSun;
varying vec3 vWp; varying vec3 vN; varying vec3 vCol; varying vec3 vSh;
#ifdef INST
attribute vec3 aCol; attribute vec4 aRnd;
#endif
#ifdef HOUSE
varying vec3 vO; varying vec3 vNo; varying vec4 vSz;
#endif
#ifdef FLATN
attribute vec4 aT; varying vec4 vT;
#endif
void main(){
  vec3 p = position; vec3 n = normal;
  #ifdef FLATN
    vT = aT;
  #endif
  #ifdef INST
    float rnd = aRnd.x;
    #ifdef HOUSE
      vO = position * aRnd.yzw; vNo = normal; vSz = aRnd;
    #endif
    #ifdef ROOFT
      n = n / (aRnd.yzw * aRnd.yzw);                      // the instance is scaled unevenly: keep the slopes' true facing
    #endif
    #ifdef LEAF
      float w = sin(uTime * (1.6 + rnd * 1.7) + rnd * 40.0);
      p.y += w * 0.10 * length(position.xz); p.x += w * 0.05 * position.y;
    #endif
    #ifdef CLOTH
      float cfar = 1.0 + 1.6 * smoothstep(70.0, 240.0, distance(cameraPosition, (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz));   // far washing flaps wider, so the town still stirs from across the cove
      p.z += sin(uTime * (3.0 + rnd * 2.5) + position.y * 4.0 + position.x * 2.5 + rnd * 30.0) * 0.3 * (-position.y) * cfar;
      p.x += (sin(uTime * 1.3 + rnd * 17.0) * 0.10 + sin(uTime * 2.3 + position.y * 3.0 + rnd * 9.0) * 0.12) * (-position.y) * cfar;
      p.y += (0.5 + 0.5 * sin(uTime * (1.1 + rnd) + rnd * 20.0 + position.x * 2.0)) * 0.22 * position.y * position.y;   // the hem lifts in gusts
    #endif
    #ifdef LEMON
      p.x += sin(uTime * (0.9 + rnd) + rnd * 30.0) * 0.07 * (0.3 - position.y);
      p *= 1.0 + 0.6 * smoothstep(45.0, 110.0, distance(cameraPosition, (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz));   // the yellow accent carries from the helix
    #endif
    #ifdef BLOB
      p.x += sin(uTime * 1.3 + rnd * 20.0) * 0.05 * (position.y + 1.0);
      p.z += cos(uTime * 1.1 + rnd * 11.0) * 0.03 * (position.y + 1.0);
    #endif
    #ifdef MOVER
      float mf = fract(rnd + uTime * aRnd.z / aRnd.y);
      p *= smoothstep(0.0, 0.05, mf) * (1.0 - smoothstep(0.95, 1.0, mf));
      p.z += (mf - 0.5) * aRnd.y;
    #endif
    vec4 ip = instanceMatrix * vec4(p, 1.0);
    #ifdef BOAT
      ip.y += sin(uTime * 1.1 + rnd * 30.0) * 0.24 + position.x * sin(uTime * 0.9 + rnd * 17.0) * 0.13 + position.z * sin(uTime * 0.7 + rnd * 9.0) * 0.03;
    #endif
    #ifdef PETAL
      float fall = mod(uTime * (0.7 + rnd * 0.8) + rnd * 40.0, aRnd.y);
      ip.y -= fall; ip.z += fall * aRnd.z;
      ip.x += sin(uTime * 1.2 + rnd * 30.0 + fall) * 0.5;
    #endif
    p = ip.xyz; n = normalize(mat3(instanceMatrix) * n); vCol = aCol;
    #ifdef USE_COLOR
      if (color.r + color.g + color.b < 2.9) vCol = color;
    #endif
  #else
    #ifdef USE_COLOR
      vCol = color;
    #else
      vCol = vec3(1.0);
    #endif
  #endif
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec3 wn = normalize(mat3(modelMatrix) * n);
  #if defined(LEAF) || defined(CLOTH) || defined(PETAL)
    if (dot(wn, uSun) < 0.0) wn = -wn;
  #endif
  vN = wn; vWp = wp.xyz;
  vSh = (uShadowMat * vec4(wp.xyz + wn * NOFF, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const P_FRAG = /* glsl */`
uniform sampler2D uShadowMap; uniform float uUseShadow, uShTexel, uShBias, uGain, uNight, uTime, uCloudK, uWob, uFoot;
uniform vec3 uSun, uViolet, uTone, uHaze, uHazeP, uAwn, uBoug, uTc[7];
varying vec3 vWp; varying vec3 vN; varying vec3 vCol; varying vec3 vSh;
#ifdef HOUSE
varying vec3 vO; varying vec3 vNo; varying vec4 vSz;
#endif
#ifdef FLATN
varying vec4 vT;
#endif
${GLSL_COMMON}
float shadowLit(vec3 sh){
  if (uUseShadow < 0.5) return 1.0;
  if (sh.x < 0.0 || sh.x > 1.0 || sh.y < 0.0 || sh.y > 1.0 || sh.z > 1.0) return 1.0;
  float z = sh.z - uShBias, T = uShTexel;
  vec2 st = sh.xy / T - 0.5, ti = floor(st), tf = st - ti, b = (ti + 0.5) * T;
  float s00 = step(z, texture2D(uShadowMap, b).r), s10 = step(z, texture2D(uShadowMap, b + vec2(T, 0.0)).r);
  float s01 = step(z, texture2D(uShadowMap, b + vec2(0.0, T)).r), s11 = step(z, texture2D(uShadowMap, b + vec2(T, T)).r);
  return smoothstep(0.38, 0.62, mix(mix(s00, s10, tf.x), mix(s01, s11, tf.x), tf.y));
}
float cloudLit(vec2 xz){                 // a few round, scalloped puffs of shade drifting over the town; they thin out over the dome terrace
  vec2 q = xz + uTime * vec2(9.0, 3.5);
  float n = 0.8 * vnoise(q * 0.006) + 0.2 * vnoise(q * 0.03);
  n -= 0.35 * (1.0 - smoothstep(60.0, 130.0, length(xz - vec2(0.0, 10.0))));
  return 1.0 - step(1.0 - uCloudK * 1.5, n) * step(0.001, uCloudK);
}
// a plot of cut-out trees seen from the air: a flat canopy dab, its hard shadow beside it, fruit
vec3 grove(vec3 base, vec2 p, float cell, vec3 leaf, vec3 fruit, float k){
  vec2 g = p / cell, id = floor(g), f = fract(g) - 0.5 + (vec2(hash21(id), hash21(id + 7.3)) - 0.5) * 0.22;
  vec2 so = clamp(-uSun.xz / max(uSun.y, 0.3) * 1.5 / cell, -0.3, 0.3);
  float can = step(dot(f, f), 0.085), sh = step(dot(f - so, f - so), 0.085);
  vec2 fa = abs(f) - vec2(0.13, 0.11);
  float fr = step(dot(fa, fa), 0.0032) * step(0.3, hash21(id + 3.1));
  base = mix(base, base * vec3(0.55, 0.52, 0.8), sh * k);
  base = mix(base, leaf, can * k);
  return mix(base, fruit, fr * can * k);
}
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 col = vCol; vec3 emis = vec3(0.0);
  float dist = distance(cameraPosition, vWp);
  #ifdef FLATN
    float top = step(0.80, N.y), y = vWp.y;
    float n1 = vnoise(vWp.xz * 0.045 + y * 0.05), n2 = vnoise(vWp.xz * 0.11 + 7.0);
    vec3 rock = mix(uTc[0], uTc[1], step(0.5, n1));
    vec3 terr = mix(uTc[2], uTc[3], step(0.56, n2));
    vec3 plat = mix(uTc[4], uTc[5], step(0.5, n2));
    vec3 tcol = mix(terr, plat, step(196.0, y));
    tcol = mix(tcol, uTc[2], step(y, 5.0));
    col = mix(rock, tcol, top);
    float gk = 1.0 - smoothstep(230.0, 340.0, dist);
    vec3 dkLeaf = vec3(0.03, 0.15, 0.05), lemC = vec3(0.91, 0.64, 0.02);
    if (top > 0.5 && n2 > 0.56 && y > 5.0 && y < 196.0) col = grove(col, vWp.xz, 3.7, dkLeaf, lemC, gk);          // the green plots are lemon groves
    else if (top > 0.5 && y >= 196.0 && n2 > 0.5) col = grove(col, vWp.xz, 5.2, uTc[5] * 0.62, uTc[5] * 0.62, gk);   // olives on the plateau
    // the terraces: drawn from the analytic terrace coordinate, so walls, lanes and the two-tone edge never follow the triangles
    float tm = step(0.5, vT.y) * step(0.17, vT.x);
    if (tm > 0.5) {
      float tq = vT.x, tfl = floor(tq), tfr = fract(tq), th = hash21(vec2(tfl, 3.7));
      vec2 wn = normalize(vT.zw + vec2(0.0, 1e-4)), wt = vec2(-wn.y, wn.x);
      float s = dot(vWp.xz, wt) + th * 60.0;
      float as = fwidth(s) + 1e-3, af = fwidth(tq) + 1e-4, thr = mix(0.62, 0.28, step(0.5, vT.z));
      if (tfr > thr) {                                            // the retaining wall
        float hg = (tfr - thr) / (1.0 - thr) * 12.0;                     // metres up the wall (in plan the wall is a narrow band)
        vec3 w0 = mix(uTc[0], uTc[1], step(0.5, th)) * mix(0.84, 0.95, step(0.5, fract(th * 7.3)));
        // the wall is a row of fronts: each stretch has its own wash, and some are house fronts with shutters, built into the cliff
        float sgw = 19.0 + 14.0 * fract(th * 9.1), sgc = (s + th * 37.0) / sgw, sgf = fract(sgc), sh2 = hash21(vec2(floor(sgc), tfl * 3.1 + 5.0));
        vec3 wallC = sh2 < 0.36 ? w0 : sh2 < 0.52 ? uTc[1] * vec3(1.03, 0.84, 0.82) : sh2 < 0.68 ? uTc[0] * vec3(1.0, 0.88, 0.66) : sh2 < 0.8 ? w0 * 1.1 : w0 * 0.93;
        float front = step(0.36, sh2) * step(sh2, 0.8) * step(0.5 / sgw, sgf) * step(sgf, 1.0 - 0.5 / sgw);
        float cell = floor(s / 6.5), ax = (fract(s / 6.5) - 0.5) * 6.5, hc = hash21(vec2(cell, tfl + 11.0));
        float arch = step(abs(ax), 2.0) * step(hg, 3.6 + sqrt(max(4.0 - ax * ax, 0.0))) * step(0.7, hc) * step(0.3, fract(th * 3.1 + floor(s / 52.0) * 0.37)) * step(0.8, hg) * (1.0 - front);
        col = mix(wallC, wallC * vec3(0.60, 0.56, 0.74), arch * step(dist, 520.0));
        float wcu = sgf * sgw / 3.1, wfx = fract(wcu), wr = fract((hg - 1.2) / 3.5), wst = floor((hg - 1.2) / 3.5);
        float wh = hash21(vec2(floor(wcu) + wst * 5.0, floor(sgc) + tfl * 9.0));
        float fwin = front * step(abs(wfx - 0.5), 0.2) * step(0.2, wr) * step(wr, 0.72) * step(1.2, hg) * step(hg, 10.2) * step(0.2, wh) * (1.0 - smoothstep(300.0, 460.0, dist));
        col = mix(col, mix(vec3(0.16, 0.42, 0.33), vec3(0.17, 0.36, 0.55), step(0.75, fract(sh2 * 13.7))), fwin);
        float wlit = fwin * step(0.45, fract(wh * 7.3)) * uNight;                           // evening: the fronts light up too
        col = mix(col, vec3(0.95, 0.72, 0.36), wlit); emis += wlit * vec3(3.4, 2.1, 0.8);
        col = mix(col, vec3(0.80, 0.13, 0.10), front * step(abs(wfx - 0.5), 0.2) * step(0.12, wr) * step(wr, 0.2) * step(0.6, wh) * step(1.2, hg) * step(hg, 10.2) * step(dist, 260.0));   // geraniums on the sill
        // washing on a line between the storeys, lifting in the breeze
        float lh = hg - 4.1, lu = sgf * sgw + sin(uTime * (1.4 + sh2) + floor(sgc) * 3.0 + hg * 1.5) * 0.38 * (1.0 - lh);
        float lhs = hash21(vec2(floor(lu / 0.95), floor(sgc) + tfl * 5.0));
        float wash = front * step(0.45, fract(sh2 * 23.0)) * step(0.0, lh) * step(lh, 1.0) * step(0.5 - 0.45 * fract(lhs * 7.0) + 0.13 * sin(uTime * 2.3 + lhs * 40.0), lh) * step(0.12, fract(lu / 0.95)) * step(0.35, lhs) * step(dist, 380.0);
        col = mix(col, lhs > 0.8 ? vec3(0.85, 0.45, 0.40) : lhs > 0.62 ? vec3(0.45, 0.60, 0.85) : vec3(0.95, 0.93, 0.86), wash);
        // bougainvillea and vines pouring over the coping
        float fl = 2.2 + 5.5 * vnoise(vec2(s * 0.8, tfl * 3.3));
        float fall = step(hc, 0.2) * step(abs(ax), 3.1) * step(12.0 - fl * sqrt(max(1.0 - ax * ax / 9.61, 0.0)) - 0.9 * vnoise(vec2(s * 2.1, tfl * 1.3)), hg) * step(dist, 700.0);   // a rounded, scalloped drape
        vec3 fc = mix(uBoug, vec3(0.05, 0.22, 0.08), step(hc, 0.06));
        col = mix(col, mix(fc, fc * vec3(0.78, 0.62, 0.86), step(0.5, vnoise(vec2(s * 1.7, hg * 1.3 + tfl)))), fall);
        col = mix(col, uTc[2] * 1.06, step(10.9, hg));             // the coping
        float sd = mod(s + tfl * 23.0, 58.0) - 6.0 - hg * 1.5;     // a stair zig-zagging from ledge to ledge
        float stair = step(abs(sd), 1.5) * step(th, 0.8);
        col = mix(col, mix(uTc[2] * 1.08, uTc[2] * 0.82, step(0.5, fract(hg * 1.6)) * step(dist, 260.0)), stair);
        N = normalize(vec3(wn.x, 0.22, wn.y));
      } else {                                                     // the ledge: a paved lane by the parapet, garden plots behind
        float lane = 1.0 - smoothstep(0.13 - af, 0.13 + af, tfr);
        float pw = 7.0 + 9.0 * fract(th * 5.7), gn = vnoise(vec2(s * 0.07, tfl * 5.1)) * 1.6, plot = floor(s / pw + gn);
        float hp = hash21(vec2(plot, tfl * 1.7));
        vec3 earth = mix(uTc[0], uTc[2], 0.5);
        vec3 gard = hp < 0.22 ? mix(uTc[3], earth, 0.3) : hp < 0.46 ? mix(uTc[5], earth, 0.35) : hp < 0.66 ? mix(uTc[3], earth, 0.7) : earth;
        gard = mix(gard, uTc[3] * 0.8, step(0.6, vnoise(vWp.xz * 0.5 + 3.0)) * step(0.66, hp) * step(hp, 0.86) * step(dist, 300.0));   // a few trees dabbed on the bare plots
        float rows = step(0.5, fract(s * 0.42 + plot * 0.3)) * step(0.6, hp) * step(dist, 240.0);
        gard = mix(gard, gard * 0.86, rows);
        if (hp < 0.22) gard = grove(gard, vWp.xz, 3.5, dkLeaf, lemC, gk);                    // a lemon grove
        else if (hp < 0.46) gard = grove(gard, vWp.xz, 4.4, uTc[5] * 0.62, uTc[5] * 0.62, gk);   // olives
        float edge = 1.0 - smoothstep(0.44 - as * 0.12, 0.44 + as * 0.12, abs(fract(s / pw + gn) - 0.5));
        gard = mix(uTc[2], gard, edge);
        col = mix(gard, uTc[2] * 1.03, max(max(lane, smoothstep(0.56 - af, 0.56 + af, tfr)), step(0.5, vT.z)));
        col = mix(col, uTc[2] * 0.8, (1.0 - smoothstep(0.025 - af, 0.025 + af, tfr)));   // parapet line
        N = vec3(0.0, 1.0, 0.0);
      }
    }
    col = mix(col, uTc[6], step(y, 0.6));
  #endif
  #ifdef PROPS
    if (abs(vWp.y - 3.27) < 0.04 && abs(vWp.z - 150.3) < 2.4 && abs(vWp.x) < 26.0 && dist < 90.0) {   // wet footprints drying on the quay
      float fxp = vWp.x * 1.25 + 0.5, id = floor(fxp), sd = mod(id, 2.0) * 2.0 - 1.0;
      vec2 f = vec2(fract(fxp) - 0.5, (vWp.z - 150.3 - sd * 0.16 - sin(id * 0.21) * 1.3) * 1.25);
      float foot = step(dot(f * vec2(4.2, 2.3), f * vec2(4.2, 2.3)), 0.25) + step(length((f - vec2(0.0, 0.3)) * vec2(4.6, 5.0)), 0.5);
      col = mix(col, col * vec3(0.62, 0.66, 0.74), min(foot, 1.0) * uFoot * step(fract(id * 0.137 + 0.2), 0.55 + 0.45 * uFoot));
    }
  #endif
  #ifdef HOUSE
    float det = 1.0 - smoothstep(260.0, 420.0, dist), hsh = vSz.x;
    #ifdef ROOFT
      col = mix(col, col * vec3(0.86, 0.82, 0.86), step(0.5, fract(vO.y * 1.9 + hsh * 3.0)) * det);   // rows of pantiles
    #else
    if (abs(vNo.y) > 0.5) {
      vec2 e = vSz.yw * 0.5 - abs(vO.xz);
      float rim = 1.0 - step(0.4, min(e.x, e.y)), rk = fract(hsh * 7.31);
      vec3 roof = mix(col * 0.93, mix(col, vec3(0.74, 0.43, 0.30), 0.7), step(0.55, rk));
      // roof terraces: pavers, a striped mat left out, the dark hatch of the stair
      vec2 pq = vO.xz / 1.4; float chk = mod(floor(pq.x) + floor(pq.y), 2.0);
      roof = mix(roof, roof * 0.9, chk * step(rk, 0.8) * (1.0 - smoothstep(120.0, 240.0, dist)));
      vec2 mq = vO.xz - (vec2(fract(hsh * 3.3), fract(hsh * 5.9)) - 0.5) * vSz.yw * 0.45;
      float mat = step(abs(mq.x), 1.3) * step(abs(mq.y), 0.8) * step(fract(hsh * 17.9), 0.45) * det;
      roof = mix(roof, mix(vec3(0.96, 0.93, 0.84), mix(uAwn, vec3(0.17, 0.36, 0.55), step(0.5, fract(hsh * 29.3))), step(0.5, fract(mq.x * 1.9))), mat);
      vec2 hq = vO.xz + (vec2(fract(hsh * 4.7), fract(hsh * 8.3)) - 0.5) * vSz.yw * 0.5;
      roof = mix(roof, vec3(0.16, 0.15, 0.26), step(abs(hq.x), 0.55) * step(abs(hq.y), 0.8) * step(0.5, fract(hsh * 37.1)) * det * (1.0 - mat));
      col = mix(roof, col, rim);
      vec2 gq = vO.xz * 0.7 + hsh * 40.0, gf = fract(gq) - 0.5; float gh = hash21(floor(gq));   // something glass left out in the sun
      emis += step(0.94, gh) * step(dot(gf, gf), 0.05) * step(0.55, sin(uTime * (2.0 + gh * 3.0) + gh * 60.0)) * (1.0 - uNight) * det * (1.0 - rim) * vec3(4.5, 4.4, 4.0);
    } else {
      float sx = step(0.5, abs(vNo.x));
      float W = mix(vSz.y, vSz.w, sx), u = mix(vO.x, vO.z, sx) + W * 0.5;
      float yT = vSz.z - vO.y;
      float nb = max(1.0, floor(W / mix(2.4, 3.5, fract(hsh * 5.3)))), cw = W / nb, cu = u / cw, cv = (yT - 0.7) / 3.3;
      float fx = fract(cu), fy = fract(cv), st = floor(cv);
      float ok = step(0.7, yT) * step(st, 3.5) * step(0.75, vSz.z - 0.7 - (st + 0.85) * 3.3) * det;
      float h2 = hash21(vec2(floor(cu) + st * 7.3 + sx * 3.0, hsh * 91.7));
      float ax = fwidth(cu) + 1e-4, ay = fwidth(cv) + 1e-4;
      float wx = 1.0 - smoothstep(0.21 - ax, 0.21 + ax, abs(fx - 0.5));
      float wy = smoothstep(0.22 - ay, 0.22 + ay, fy) * (1.0 - smoothstep(0.72 - ay, 0.72 + ay, fy));
      // the top floor of some houses has round-headed windows
      float wrad = 0.21 * cw, ady = (0.22 + wrad / 3.3 - fy) * 3.3, adx = (fx - 0.5) * cw;
      float rnd = mix(1.0, step(adx * adx + ady * ady, wrad * wrad), step(0.0, ady) * step(0.6, fract(hsh * 3.7)) * step(st, 0.5));
      float win = wx * wy * ok * step(0.14, h2) * rnd;
      vec3 shut = mix(vec3(0.16, 0.42, 0.33), vec3(0.17, 0.36, 0.55), step(0.78, fract(hsh * 13.7)));
      // evening: most windows lit; some lamps go on and off as people move from room to room, a few televisions flicker blue
      float tw = fract(h2 * 31.7), ph = uTime * (0.10 + 0.12 * fract(h2 * 53.1)) + h2 * 17.0;
      float open = step(0.5, uNight) * mix(step(0.45, fract(h2 * 7.3)), step(0.5, fract(ph)), step(0.7, tw));
      float tv = step(tw, 0.1), tfl = 0.5 + 0.5 * step(0.5, fract(sin(floor(uTime * 5.0 + h2 * 40.0) * 12.9898 + h2 * 7.0) * 43758.5));
      col = mix(col, mix(col, vec3(1.0, 0.95, 0.85), 0.55), step(yT, 0.42) * det);            // a pale cornice
      col = mix(col, mix(shut, vec3(0.95, 0.72, 0.36), open), win);
      emis += open * win * mix(vec3(3.4, 2.1, 0.8), vec3(1.0, 1.6, 3.0) * tfl, tv);
      float split = (1.0 - smoothstep(0.012, 0.012 + ax, abs(fx - 0.5))) * win * (1.0 - open);
      col = mix(col, shut * 0.6, split);
      float sill = wx * smoothstep(0.72, 0.72 + ay, fy) * (1.0 - smoothstep(0.80, 0.80 + ay, fy)) * ok * step(0.5, h2);
      col = mix(col, mix(vec3(0.80, 0.13, 0.10), vec3(0.20, 0.45, 0.22), step(0.5, fract(fx * 5.0 + h2 * 9.0))), sill);
      float aw = step(0.9, h2) * ok * step(0.05, fy) * step(fy, 0.2) * step(abs(fx - 0.5), 0.33);
      col = mix(col, mix(vec3(1.0, 0.95, 0.85), uAwn, step(0.5, fract(fx * 9.0))), aw);
      // a balcony along the second floor: slab, rail and bars
      float bal = step(0.5, fract(hsh * 11.1)) * step(abs(st - 1.0), 0.5) * ok * step(abs(fx - 0.5), mix(0.36, 0.5, step(0.75, fract(hsh * 19.3))));
      float bars = step(0.62, fract(fx * cw * 3.2)) * (1.0 - smoothstep(90.0, 170.0, dist));
      col = mix(col, vec3(0.12, 0.14, 0.22), bal * step(0.50, fy) * step(fy, 0.76) * max(step(fy, 0.54), bars));
      col = mix(col, vec3(0.95, 0.90, 0.80), bal * step(0.76, fy) * step(fy, 0.84));
      // the street front: a door, and on some a striped shop awning
      float frontF = step(0.5, vNo.z), du = u - W * (0.5 + (fract(hsh * 9.7) - 0.5) * 0.3);
      float door = frontF * step(abs(du), 0.62) * step(1.4, vO.y) * step(vO.y, 3.4 + sqrt(max(0.3844 - du * du, 0.0))) * det;
      col = mix(col, shut * 0.5, door);
      float shop = frontF * step(fract(hsh * 23.3), 0.22) * step(abs(u - W * 0.5), W * 0.4) * step(3.9, vO.y) * step(vO.y, 4.8) * det;
      col = mix(col, mix(vec3(1.0, 0.95, 0.85), uAwn, step(0.5, fract(u * 0.8))), shop);
    }
    #endif
  #endif
  vec3 shc = vSh; shc.xy += vec2(sin(uTime * 1.7 + vWp.x * 0.9 + vWp.y), cos(uTime * 1.3 + vWp.z * 0.9)) * uWob;   // heat shimmer on every shadow edge
  float lit = step(LIT_EDGE, dot(N, uSun)) * shadowLit(shc);
  lit *= cloudLit(vWp.xz);
  vec3 shade = mix(col * vec3(0.40, 0.38, 0.72), uViolet, 0.28);
  #ifdef CLOTH
    shade = mix(shade, col * vec3(0.86, 0.84, 0.98), 0.36);                 // cloth lets the light through
  #endif
  shade *= 1.0 - 0.09 * step(halftone(3.0), 0.09);
  vec3 c = mix(shade, col * uGain, lit) * uTone + emis;
  float hz = floor(clamp((dist - uHazeP.x) / (uHazeP.y - uHazeP.x), 0.0, 1.0) * 3.0 + 0.5) / 3.0 * uHazeP.z;
  gl_FragColor = vec4(mix(c, uHaze, hz), 1.0);
}`;

// flat-colour things: far headlands, ferry wake, glow
const F_VERT = /* glsl */`
varying vec3 vWp; varying vec2 vUv2;
void main(){ vUv2 = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const HEAD_FRAG = /* glsl */`
uniform vec3 uCol, uHaze; uniform float uK;
varying vec3 vWp; varying vec2 vUv2;
void main(){ gl_FragColor = vec4(mix(uCol, uHaze, uK), 1.0); }`;
const WAKE_FRAG = /* glsl */`
uniform float uAng, uR; uniform vec3 uCol; uniform vec2 uCenter;
varying vec3 vWp; varying vec2 vUv2;
void main(){
  float a = atan(vWp.z - uCenter.y, vWp.x - uCenter.x), r = length(vWp.xz - uCenter);
  float back = uAng - a; back = mod(back + 3.14159, 6.28318) - 3.14159;
  if (back < 0.0 || back > 0.75) discard;
  float sp = back * uR * 0.10 + 4.0, d = abs(r - uR);
  float arm = step(abs(d - sp), 3.0 + back * 12.0) + step(d, sp * 0.45) * step(0.5, fract(back * 40.0 - d * 0.02));
  if (arm < 0.5) discard;
  gl_FragColor = vec4(uCol, 1.0);
}`;

const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_Position.z = gl_Position.w * 0.9999; }`;
const SKY_FRAG = /* glsl */`
uniform vec3 uZen, uMid, uLow, uHazeC, uSun, uSunCol, uCloud, uCloudSh, uSea; uniform float uTime, uGain, uStars, uCloudAz, uClouds;
varying vec3 vDir;
${GLSL_COMMON}
float puff(vec2 q, vec2 c, float r){ return step(length((q - c) * vec2(1.0, 1.25)), r); }
void main(){
  vec3 d = normalize(vDir); float e = d.y;
  vec2 hq = gl_FragCoord.xy * (450.0 / max(uRes.y, 1.0)) / 5.0; hq = vec2(hq.x + hq.y, hq.x - hq.y) * 0.7071;   // a fine screen, sized from the frame
  vec2 hg = fract(hq) - 0.5; float ht = dot(hg, hg) * 2.0;
  vec3 c = uLow;
  float b1 = smoothstep(0.142, 0.168, e), b2 = smoothstep(0.347, 0.373, e);   // the joins are 1.5 degrees tall; the bands themselves are flat paint
  c = mix(c, uMid, mix(b1, step(ht, b1), 0.33));
  c = mix(c, uZen, mix(b2, step(ht, b2), 0.33));
  c = mix(c, uHazeC, step(e, 0.035));
  if (uStars > 0.0 && e > 0.2) { vec2 sq = d.xz / (0.35 + e) * 110.0, sg = floor(sq), sf = fract(sq) - 0.5; c += step(0.99, hash21(sg)) * step(dot(sf, sf), 0.03 + 0.05 * hash21(sg + 3.0)) * uStars * vec3(1.6, 1.7, 2.0) * (0.6 + 0.4 * sin(uTime * (2.0 + 3.0 * hash21(sg + 7.0)) + hash21(sg + 5.0) * 40.0)); }
  // flat-bottomed puffs standing over the far headland, drifting at walking pace
  float az = atan(d.x, d.z + 1e-5);
  for (int i = 0; i < 3; i++) {
    float fi = float(i); if (fi >= uClouds) break;
    vec2 q = vec2(mod(az - uCloudAz - fi * 1.9 - uTime * 0.0012 + 3.14159, 6.28318) - 3.14159, e - 0.115 - fi * 0.035);
    float s = 1.0 - fi * 0.22;
    float m = max(max(puff(q, vec2(0.0, 0.012) * s, 0.034 * s), puff(q, vec2(0.04, 0.006) * s, 0.026 * s)), max(puff(q, vec2(-0.045, 0.004) * s, 0.024 * s), puff(q, vec2(0.015, 0.03) * s, 0.022 * s)));
    m *= step(0.0, q.y);
    c = mix(c, mix(uCloudSh, uCloud, step(0.012 * s, q.y)), m);
  }
  float sd = dot(d, uSun);
  c = mix(c, uSunCol, step(0.9992, sd));
  c = mix(c, uSea, step(e, -0.002));
  gl_FragColor = vec4(c * uGain, 1.0);
}`;

const SEA_BOATS = 29;                            // hulls that cast a shadow on the sand: 24 at anchor in the cove, up to five berths along the mole
const SEA_FRAG = /* glsl */`
uniform vec4 uBoats[${SEA_BOATS}]; uniform vec3 uSun, uSand, uRock, uShallow, uDeep, uDeep2, uHaze, uHazeP, uTone, uOcto; uniform float uTime, uGlint, uGain;
varying vec3 vWp; varying vec2 vUv2;
${GLSL_COMMON}
float dash(vec2 q, vec2 dir){ return step(abs(dot(q, dir)), 0.42) * step(abs(dot(q, vec2(-dir.y, dir.x))), 0.09); }
float fish(vec2 p){
  vec2 c = floor(p / 9.0); float h = hash21(c); if (h < 0.4) return 0.0;
  float t = uTime * (0.25 + h * 0.3) + h * 40.0;
  vec2 o = vec2(sin(t) * 2.8, cos(t * 0.8) * 2.0), dir = normalize(vec2(cos(t) * 2.8, -sin(t * 0.8) * 1.6) + vec2(1e-3, 0.0));
  vec2 q = p - (c + 0.5) * 9.0 - o, sd = vec2(-dir.y, dir.x);
  return max(dash(q, dir), max(dash(q - dir * 0.7 - sd * 0.5, dir), dash(q + dir * 0.9 + sd * 0.45, dir)));
}
float glit(vec2 p, float sc, float th){ vec2 q = p * sc, gc = floor(q), f = fract(q) - 0.5;
  float tw = hash21(gc + floor(uTime * 3.0 + hash21(gc) * 3.0) * 7.1); return step(th, tw) * step(abs(f.x) + abs(f.y), 0.34); }
void main(){
  vec3 V = normalize(vWp - cameraPosition);
  float dist = distance(cameraPosition, vWp);
  float deepK = smoothstep(290.0, 420.0, vWp.z + max(vWp.x, 0.0) * 0.5);
  float rs = min(length(V.xz) / 1.33, 0.74);
  vec2 par = V.xz / 1.33 / sqrt(1.0 - rs * rs);
  vec2 fp = vWp.xz + par * 6.0;
  float rk = vnoise(fp * 0.16 + 3.0) + 0.22 * vnoise(fp * 0.7 + 11.0);              // rocks: small dark clusters, seagrass round them
  vec3 fl = mix(uSand, uRock, step(0.9, rk));
  fl = mix(fl, uRock * vec3(0.62, 0.86, 0.74), step(0.8, rk) * step(rk, 0.94) * step(0.66, vnoise(fp * vec2(3.2, 0.7) + 5.0)) * (1.0 - smoothstep(90.0, 200.0, dist)));
  fl = mix(fl, uSand * 1.07, step(0.72, vnoise(fp * vec2(0.6, 0.14) + 9.0)) * step(rk, 0.7));
  vec2 so = -uSun.xz / max(uSun.y, 0.8) * 7.5; float shK = smoothstep(0.15, 0.45, uSun.y);
  float sh = 0.0;
  for (int i = 0; i < ${SEA_BOATS}; i++) {
    vec4 b = uBoats[i]; vec2 q = fp - (b.xy + so); float cs = cos(b.z), sn = sin(b.z);
    q = vec2(cs * q.x - sn * q.y, sn * q.x + cs * q.y) / (vec2(1.25, 3.3) * max(b.w, 0.01));
    float hw = 1.0 - q.y * q.y * mix(0.25, 1.0, step(0.0, q.y));                    // a hull: pointed bow, square stern
    sh = max(sh, step(abs(q.x), hw) * step(-0.8, q.y) * step(q.y, 1.0));
  }
  float fishK = 1.0 - smoothstep(70.0, 180.0, dist);                                 // from the helix the fish would only be specks
  sh = max(sh, fish(fp - so * 0.3) * 0.8 * fishK);
  fl = mix(fl, vec3(0.62, 0.30, 0.25), step(length((fp - uOcto.xy) * vec2(1.0, 1.4)), 1.0 + 0.25 * sin(uTime * 2.0)));
  vec3 w = mix(fl, uShallow, 0.40 + 0.38 * (1.0 - abs(V.y)) * smoothstep(8.0, 130.0, dist));   // close in the water is glass-clear
  w = mix(w, w * vec3(0.40, 0.43, 0.70), sh * (0.3 + 0.7 * shK) * (1.0 - 0.5 * smoothstep(60.0, 220.0, dist)));   // boat and fish shadows on the sand, hard-edged
  w = mix(w, vec3(0.10, 0.17, 0.27), fish(vWp.xz + par * 2.5) * fishK);
  float sw = sin(vWp.z * 0.07 + vWp.x * 0.025 + uTime * 0.5 + vnoise(vWp.xz * 0.02) * 5.0);
  w = mix(w, mix(uDeep, uDeep2, step(0.45, sw) * (1.0 - smoothstep(900.0, 1500.0, dist))), deepK);
  w = mix(w, w * 1.07, step(0.8, sin(vWp.z * 0.21 - vWp.x * 0.06 + uTime * 0.8 + vnoise(vWp.xz * 0.05) * 4.0)) * (1.0 - deepK) * (1.0 - smoothstep(150.0, 300.0, dist)));
  vec3 R = reflect(V, vec3(0.0, 1.0, 0.0)); float sa = pow(max(dot(R, uSun), 0.0), 3.0);
  float gth = 1.0 - 0.006 - 0.05 * sa;
  float g = glit(vWp.xz, 3.0, gth) * (1.0 - smoothstep(25.0, 70.0, dist)) + glit(vWp.xz, 0.9, gth) * smoothstep(20.0, 60.0, dist) * (1.0 - smoothstep(140.0, 460.0, dist));
  vec3 c = w * uTone * uGain + g * uGlint * vec3(1.0, 0.98, 0.9);
  float hz = floor(clamp((dist - uHazeP.x) / (uHazeP.y - uHazeP.x), 0.0, 1.0) * 3.0 + 0.5) / 3.0 * uHazeP.z;
  gl_FragColor = vec4(mix(c, uHaze, hz), 1.0);
}`;

// kind 0: swifts looping round a centre; 1: the party flying formation with the plane; 2: gulls
// standing on the breakwater until the camera comes (or uAll)
const BIRD_VERT = /* glsl */`
attribute vec4 aA; attribute vec4 aB; attribute vec4 aCol;
uniform float uTime, uCamZ, uAll, uComp; uniform vec3 uLead, uLeadF;
varying vec3 vCol;
void main(){
  float kind = aA.w, rnd = aB.w, sc = aCol.w;
  vec3 p = position; vec3 pos; vec3 fwd; float flap;
  if (kind < 0.5) {
    float a = uTime * aB.z + aB.y;
    float r = aB.x * (1.0 + 0.25 * sin(a * 2.0 + rnd * 9.0));
    pos = aA.xyz + vec3(cos(a) * r, sin(a * 3.0 + rnd * 20.0) * 3.5 + sin(a * 0.7 + rnd * 5.0) * 4.0, sin(a) * r);
    fwd = normalize(vec3(-sin(a), 0.25 * cos(a * 3.0 + rnd * 20.0), cos(a)) * sign(aB.z));
    flap = sin(uTime * 22.0 + rnd * 60.0) * step(0.35, fract(uTime * 0.45 + rnd * 7.0));
  } else if (kind < 1.5) {
    vec3 F = normalize(uLeadF + vec3(0.0, 0.0, 1e-4)); vec3 Rr = normalize(cross(F, vec3(0.0, 1.0, 0.0)));
    float peel = smoothstep(0.55, 0.95, sin(uTime * 0.23 + rnd * 6.28));
    pos = uLead + Rr * (aA.x * (1.0 + peel * 2.5) + sin(uTime * 0.9 + rnd * 20.0) * 0.8)
        + vec3(0.0, 1.0, 0.0) * (aA.y + peel * 6.0 * (rnd - 0.3) + sin(uTime * 1.3 + rnd * 9.0) * 0.7 + (1.0 - uComp) * 18.0)
        + F * (aA.z + sin(uTime * 0.6 + rnd * 5.0) * 2.5);
    fwd = normalize(F + Rr * cos(uTime * 0.9 + rnd * 20.0) * 0.1 + vec3(0.0, 0.1 * cos(uTime * 1.3 + rnd * 9.0), 0.0));
    flap = sin(uTime * 22.0 + rnd * 60.0) * step(0.35, fract(uTime * 0.45 + rnd * 7.0));
    sc *= uComp;
  } else {
    float e = max(clamp((uCamZ - aA.z + 36.0) / 30.0, 0.0, 1.0), uAll);
    float k = 1.0 - (1.0 - e) * (1.0 - e);
    float a = aB.y + uTime * 0.5 * aB.z * step(0.001, e);
    pos = aA.xyz + vec3(aB.x * k * sign(aB.z) * (0.7 + 0.3 * sin(a)), k * (5.0 + rnd * 9.0) + sin(a * 1.3) * 1.2 * k, k * (10.0 + rnd * 14.0) + cos(a) * 4.0 * k);
    fwd = normalize(vec3(sign(aB.z) * (0.5 + 0.5 * k), 0.5 * (1.0 - k) + 0.05, 0.8));
    if (e < 0.001) { fwd = vec3(cos(aB.y * 7.0), 0.0, sin(aB.y * 7.0)); p.x *= 0.22; p.y = abs(p.x) * 0.3 + max(p.y, 0.0) + 0.12; }
    flap = sin(uTime * 9.0 + rnd * 60.0) * step(0.001, e);
  }
  p.y += abs(p.x) * flap * 0.75; p.x *= 1.0 - 0.3 * abs(flap);
  vec3 rt = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)) + vec3(1e-5, 0.0, 0.0)); vec3 up = cross(rt, fwd);
  pos += (rt * p.x + up * p.y + fwd * p.z) * sc;
  vCol = aCol.rgb;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
}`;
const BIRD_FRAG = /* glsl */`
uniform vec3 uTone; varying vec3 vCol;
void main(){ gl_FragColor = vec4(vCol * uTone, 1.0); }`;

// ---------------------------------------------------------------- looks
const LOOKS = {
  noon: { cloudK: 0.10, el: 78, az: 0.55, zen: '#2F7FD1', mid: '#5FA4DF', low: '#9CCBEA', haze: '#DCEBF2', hazeP: [320, 2600, 0.8], tone: [1, 1, 1], gain: 1.06, violet: '#3E3A5C',
    shallow: '#2BB5B0', deep: '#2468B4', deep2: '#2F7FD1', sand: '#DDCB98', sunCol: [3.2, 3.1, 2.8], cloud: '#FFFDF4', cloudSh: '#B9C6E6', clouds: 2, night: 0, exposure: 1.0, glint: 4.5 },
  morning: { cloudK: 0.13, el: 23, az: 1.15, zen: '#4F97D8', mid: '#9CC6E4', low: '#F7DEC4', haze: '#F1E3DA', hazeP: [260, 2200, 0.85], tone: [1.07, 0.97, 0.84], gain: 1.08, violet: '#46386A',
    shallow: '#3FB7B4', deep: '#2E6FAE', deep2: '#4A8CC6', sand: '#E6D6B0', sunCol: [3.4, 3.0, 2.2], cloud: '#FFF2E0', cloudSh: '#C7B6D8', clouds: 2, night: 0, exposure: 1.0, glint: 4.0 },
  evening: { cloudK: 0, el: 13, az: -1.25, zen: '#17245C', mid: '#3B4F9E', low: '#E8846B', haze: '#8E7FB0', hazeP: [240, 2000, 0.8], tone: [0.50, 0.56, 0.92], gain: 0.92, violet: '#2A2750',
    shallow: '#2C7F9E', deep: '#1B3270', deep2: '#2A4690', sand: '#B9B4B8', sunCol: [0.9, 0.5, 0.4], cloud: '#F2A58C', cloudSh: '#6A5C98', clouds: 2, night: 1, exposure: 1.05, glint: 1.2 },
  scirocco: { cloudK: 0.10, el: 56, az: 0.9, zen: '#E9A877', mid: '#F2C394', low: '#F7DDB8', haze: '#EFD2A8', hazeP: [150, 1300, 0.92], tone: [1.05, 0.93, 0.78], gain: 1.04, violet: '#5A3F5E',
    shallow: '#3FAE9C', deep: '#3B7C9C', deep2: '#59A0AE', sand: '#E8D4A6', sunCol: [3.0, 2.6, 1.9], cloud: '#FBE6C8', cloudSh: '#D9B090', clouds: 0, night: 0, exposure: 0.98, glint: 3.2 },
  spring: { cloudK: 0.14, el: 62, az: 0.35, zen: '#3A8FE0', mid: '#79B8EC', low: '#BFE0F2', haze: '#E2F0F2', hazeP: [340, 2800, 0.75], tone: [1, 1.01, 0.99], gain: 1.05, violet: '#3E3A66',
    shallow: '#35C6B4', deep: '#2274C0', deep2: '#3690D8', sand: '#EDE2B8', sunCol: [3.2, 3.1, 2.8], cloud: '#FFFFFA', cloudSh: '#B4C8EA', clouds: 3, night: 0, exposure: 1.0, glint: 4.5 },
};

const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function M(x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
}
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const DEG = Math.PI / 180;

export default {
  id: 'lemon-cliffs',
  name: 'The Lemon Cliffs',
  category: 'city',
  weirdness: 0.05,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, vr = rng.fork('lc-look'), noise = ctx.noise;
    const detail = ctx.quality?.detail ?? 1, density = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    const hour = vary.hour || 'any';
    let lookId = vr.pick(['noon', 'noon', 'noon', 'morning', 'evening', 'scirocco', 'spring', 'spring']);
    if (hour === 'dawn') lookId = 'morning'; else if (hour === 'night') lookId = 'evening';
    else if (hour === 'golden') lookId = vr.chance(0.6) ? 'scirocco' : 'evening'; else if (hour === 'day') lookId = vr.pick(['noon', 'noon', 'spring']);
    const L = LOOKS[lookId], rare = !!vary.rare, night = L.night;
    const regatta = vr.chance(0.4), wedding = vr.chance(0.35);
    const C = (h) => new THREE.Color(h);
    const pal = PALETTE.map(C), [cobalt, creamRaw, ochre, coral, teal, violet, lemon] = pal;
    const mixc = (a, b, t, k = 1) => a.clone().lerp(b, t).multiplyScalar(k);
    const cream = creamRaw.clone().multiplyScalar(0.86), stone = mixc(creamRaw, ochre, 0.38, 0.78), paving = mixc(creamRaw, ochre, 0.16, 0.8);
    const terracotta = mixc(coral, ochre, 0.15, 0.72), pink = mixc(coral, creamRaw, 0.45, 0.85), dark = mixc(violet, cobalt, 0.2, 0.75);
    const leafA = C('#2C6A37'), leafB = C('#1B4A2E'), pineC = C('#3F8050'), olive = C('#8FA98A'), cypress = C('#1F4A33');
    const bougA = lookId === 'spring' ? C('#9B7FD6') : mixc(coral, C('#E23E8A'), 0.6), bougB = lookId === 'spring' ? C('#B9A2E8') : mixc(coral, C('#E23E8A'), 0.3);

    const az = L.az + vr.range(-0.2, 0.2), el = (L.el + vr.range(-3, 3)) * DEG;
    const sun = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();

    const scene = new THREE.Scene();
    const hazeCol = C(L.haze);
    scene.background = hazeCol.clone();
    scene.fog = new THREE.Fog(hazeCol.clone(), 500, 6000);

    // ---------- the hero (its own fine shadow map, sun shared)
    const hero = await buildHero(ctx, { palette: PALETTE, sunDir: sun.clone() });
    hero.object.position.set(0, H0, 0); hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    const A = hero.anchors, side = A.side, DX = A.domeCenter.x;
    hero.uniforms.uGain.value = L.gain; hero.uniforms.uViolet.value.set(L.violet);
    if (hero.uniforms.uTone) hero.uniforms.uTone.value.set(L.tone[0], L.tone[1], L.tone[2]);
    if (hero.uniforms.uCloudK) hero.uniforms.uCloudK.value = L.cloudK;
    await ctx.yield();

    // ---------- the path
    const XL = -108, YL = 150, HC = 104;                                  // launch line, helix centre z
    const pts = [[XL, YL, 44], [XL, YL, 64], [XL, YL, 84], [XL, YL, 104]];
    const yJoin = H0 + A.domePass[0].y;
    for (let t = 112; t <= 312; t += 20) {
      const s = sstep(200, 315, t), cx = lerp(-3, DX, s), r = lerp(105, 90, s), th = t * DEG;
      const y = yJoin + 0.0865 * 90 * (330.7 - t) * DEG + 44.5 * (1 - sstep(90, 255, t));
      pts.push([cx - r * Math.sin(th), y, HC - r * Math.cos(th)]);
    }
    for (const p of A.domePass) pts.push([p.x, p.y + H0, p.z]);
    const yC0 = H0 + A.domePass[7].y, EC = [45, 85], ER = 45;
    const rKnots = [[29, 90], [90, 53], [180, 72], [270, 60], [360, ER]];
    const rAt = (t) => { for (let i = 0; i < 4; i++) if (t <= rKnots[i + 1][0]) return lerp(rKnots[i][1], rKnots[i + 1][1], sstep(rKnots[i][0], rKnots[i + 1][0], t)); return ER; };
    for (let t = 52; t <= 360; t += 22) {
      const s = sstep(29, 270, t), cx = lerp(DX, EC[0], s), cz = lerp(HC, EC[1], s), r = rAt(t), th = t * DEG;
      pts.push([cx - r * Math.sin(th), lerp(yC0, 50, sstep(29, 360, t)), cz - r * Math.cos(th)]);
    }
    pts.push([EC[0] - ER * Math.cos(60 * DEG), 44.5, EC[1] - ER * Math.sin(60 * DEG)], [EC[0] - ER * Math.cos(30 * DEG), 38.6, EC[1] - ER * Math.sin(30 * DEG)]);
    const S0 = 96, S1 = 142, QY = 3;                                       // lower stair: z S0..S1, y H0..QY
    const treadY = (z) => H0 - Math.min(1, Math.max(0, (z - S0) / (S1 - S0))) * (H0 - QY);
    pts.push([0, 34.2, 80], [0, 32.0, 92]);
    for (const z of [102, 113, 124, 135]) pts.push([0, treadY(z) + 2.9, z]);
    const ZA = 396;                                                        // the arch
    pts.push([0, 7.2, 147], [0, 7.4, 166], [0, 7.6, 200], [0, 7.6, 240], [0, 7.8, 280], [0, 8.4, 320], [0, 9, 352], [0, 9, 376], [0, 9, ZA]);
    const path = makePath(pts);
    const uOf = (x, z) => path.nearestXZ(x, z).u;
    const uExit = uOf(XL, 104), uDome = uOf(A.domePass[4].x, A.domePass[4].z), uStair = uOf(0, 100), uQuay = uOf(0, 150), uBoats = uOf(0, 252), uBreak = uOf(0, 330);
    // carve limit under the camera line (sampled once into a coarse list)
    const cs = []; for (let i = 0; i <= 260; i++) { const p = path.pointAt(i / 260); cs.push(p.x, p.y, p.z); }
    const pathClear = (x, y, z) => { let b = 1e9; for (let i = 0; i < cs.length; i += 3) { const dx = cs[i] - x, dy = cs[i + 1] - y, dz = cs[i + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
    // the flight line itself at an even 1 m step from end to end: what hangs or drifts beside it is measured against this list
    const fl = [], flHit = { i: 0 };
    for (let d = 0, q = new THREE.Vector3(); d < path.length + 1; d += 1) { path.posAtDist(Math.min(d, path.length), q); fl.push(q.x, q.y, q.z); }
    const flightNear = (x, y, z) => { let b = 1e9; for (let i = 0; i < fl.length; i += 3) { const dx = fl[i] - x, dy = fl[i + 1] - y, dz = fl[i + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < b) { b = d; flHit.i = i; } } return Math.sqrt(b); };
    // the hero's bunting and washing: no flag hangs within FLAG_CLEAR metres of the flight line (the 6 m the hero promises its
    // fly-through), measured from the middle of the flag with half its span allowed for. One that would is taken down, and the
    // hero's shadow is baked again without it
    const FLAG_CLEAR = 6;
    {
      const hc = hero.object.getObjectByName('cloth'), m = new THREE.Matrix4(); let down = 0;
      if (hc) for (let i = 0; i < hc.count; i++) {
        hc.getMatrixAt(i, m); const e = m.elements, half = 0.5 * Math.hypot(e[0], e[1], e[2], e[4], e[5], e[6]);   // hero-local: the hero stands unturned at (0, H0, 0)
        if (flightNear(e[12] - e[4] * 0.5, H0 + e[13] - e[5] * 0.5, e[14] - e[6] * 0.5) < FLAG_CLEAR + half) { hc.setMatrixAt(i, m.makeScale(0, 0, 0)); down++; }
      }
      if (down) { hc.instanceMatrix.needsUpdate = true; hero.setSun(sun); }
    }

    // ---------- the land
    const FA = [60, 30, -34], FB = [211, 200, -170];                       // funicular line
    const fLen = Math.hypot(FB[0] - FA[0], FB[2] - FA[2]);
    const segDist = (x, z, ax, az2, bx, bz) => { const dx = bx - ax, dz = bz - az2, t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az2) * dz) / (dx * dx + dz * dz))); return [Math.hypot(x - ax - dx * t, z - az2 - dz * t), t]; };
    const road = []; for (let k = 0; k <= 7; k++) { const x = 137 + k * 25; road.push([x, H0 + (x - 125) * 0.85 + 0.4, k % 2 ? 112 : 30]); }
    road.unshift([112, H0 + 0.4, 112]);
    const wSeed = rng.range(0, 100);
    const TER = 12, LT = { q: 0, mask: 0, nx: 0, nz: 1 };                // terrace step; what landH last found (terrace coordinate, mask, wall facing)
    const landH = (x, z) => {
      const f = z > S1 ? QY : z > S0 ? treadY(z) : H0;
      const n = Math.max(0, -30 - z) * 1.25;
      const xw = -70 - 130 * sstep(108, 128, z);
      const w = Math.max(0, xw - x) * 3.2, e = Math.max(0, x - 125) * 0.85;
      let up = Math.max(n, w, e);
      if (n >= w && n >= e) { LT.nx = 0; LT.nz = 1; } else if (w >= e) { LT.nx = 1; LT.nz = 0; } else { LT.nx = -1; LT.nz = 0; }
      const cap = 205 - f + noise.n2(x * 0.006 + wSeed, z * 0.006) * 6;
      LT.mask = up > 2 && up < cap ? 1 : 0; LT.q = Math.min(up, cap) / TER;
      up = Math.min(up, cap);
      if (up > 2) { const q = up / TER, fl = Math.floor(q); up = (fl + sstep(LT.nx > 0 ? 0.28 : 0.62, 1, q - fl)) * TER; }   // the west wall is nearly all wall, with narrow ledges
      let h = f + up + (up > 2 ? noise.n2(x * 0.03, z * 0.03 + wSeed) * 0.5 : 0);
      // funicular cutting and the road bench
      const [fd, ft] = segDist(x, z, FA[0], FA[2], FB[0], FB[2]);
      if (fd < 10) { h = lerp(lerp(FA[1], FB[1], ft) - 0.9, h, sstep(4, 10, fd)); LT.mask = 0; }
      for (let k = 0; k < road.length - 1; k++) {
        const a = road[k], b = road[k + 1], [rd, rt] = segDist(x, z, a[0], a[2], b[0], b[2]);
        if (rd < 9) { h = lerp(lerp(a[1], b[1], rt) - 0.5, h, sstep(3.5, 9, rd)); LT.mask = 0; }
      }
      // the cove and the open sea
      const cx = (x - 8) / 165, zz = z - 235;
      const rho = zz < 0 ? Math.hypot(cx, zz / 85) : Math.abs(cx) / (1 + zz / 260);
      const zEnd = (x < 0 ? 292 : 262) + noise.n2(x * 0.01, wSeed) * 14;
      const seaK = Math.max(1 - sstep(0.93, 1.06, rho), sstep(zEnd - 22, zEnd + 12, z), sstep(380, 430, Math.abs(x)));
      if (seaK > 0.01) LT.mask = 0;
      h = lerp(h, -7, seaK);
      return h;
    };
    // coarse map of where the camera line passes, so most ground samples skip the nearest-point search
    const NG = 20, ngx = 46, ngz = 38, nearGrid = new Uint8Array(ngx * ngz);
    for (let i = 0; i < cs.length; i += 3) for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
      const gi = Math.floor((cs[i] + 460) / NG) + a, gj = Math.floor((cs[i + 2] + 300) / NG) + b;
      if (gi >= 0 && gi < ngx && gj >= 0 && gj < ngz) nearGrid[gj * ngx + gi] = 1;
    }
    const groundH = (x, z) => {                                            // landH kept under the camera line
      let h = landH(x, z);
      if (Math.abs(x - XL) < 16 && z > 22 && z < 112) h = Math.min(h, z > 93 ? YL - 10.5 : YL - 4.2);   // the alley block stands on its own floor
      const gi = Math.floor((x + 460) / NG), gj = Math.floor((z + 300) / NG);
      if (!(gi >= 0 && gi < ngx && gj >= 0 && gj < ngz && nearGrid[gj * ngx + gi])) return h;
      const nr = path.nearestXZ(x, z);
      if (nr.dist < 16) { const lim = nr.y - (nr.u > uExit + 0.01 && nr.u < uStair - 0.06 ? 8.5 : 3.3); if (h > lim) { h = lerp(lim, h, sstep(7, 16, nr.dist)); LT.mask = 0; } }
      if (Math.abs(x) < 7 && z > S0 - 3 && z < S1 + 3) h -= 1.6;
      return h;
    };
    await ctx.yield();

    // ---------- shared uniforms and the poster material family
    const SH_SIZE = (ctx.quality?.mobile || ctx.quality?.level === 'low') ? 2048 : 4096, SH_E = 345;
    const U = {
      uShadowMap: { value: null }, uUseShadow: { value: 0 }, uShTexel: { value: 1 / SH_SIZE }, uShBias: { value: 0.0006 }, uShadowMat: { value: new THREE.Matrix4() },
      uGain: { value: L.gain }, uNight: { value: night }, uCloudK: { value: L.cloudK }, uWob: { value: (night ? 0.04 : 0.17) / (2 * SH_E) }, uTime: { value: 0 }, uSun: { value: sun }, uViolet: { value: C(L.violet) },
      uTone: { value: new THREE.Vector3(L.tone[0], L.tone[1], L.tone[2]) }, uHaze: { value: hazeCol.clone() }, uHazeP: { value: new THREE.Vector3(L.hazeP[0], L.hazeP[1], L.hazeP[2]) },
      uRes: { value: new THREE.Vector2(800, 450) }, uFoot: { value: 1 }, uBoug: { value: bougA.clone() }, uAwn: { value: vr.chance(0.5) ? coral.clone() : mixc(teal, creamRaw, 0.2) },
      uTc: { value: [mixc(creamRaw, ochre, 0.3, 0.8), mixc(creamRaw, coral, 0.34, 0.74), paving.clone(), lookId === 'scirocco' ? C('#96A068') : C('#74A060'), C('#B9B27A'), olive.clone(), C(L.sand)] },
    };
    const mats = [];
    const pm = (defines = {}, extra = {}) => {
      const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader: P_VERT, fragmentShader: P_FRAG, defines: { LIT_EDGE: '0.06', NOFF: '0.35', ...defines }, ...extra });
      mats.push(m); return m;
    };

    // terrain: one heightfield, faceted by screen-space derivatives
    {
      const X0 = -430, X1 = 430, Z0 = -280, Z1 = 430, CELL = 3.3;
      const nx = Math.round((X1 - X0) / CELL), nz = Math.round((Z1 - Z0) / CELL);
      const pos = new Float32Array((nx + 1) * (nz + 1) * 3), ter = new Float32Array((nx + 1) * (nz + 1) * 4);
      let k = 0, kt = 0;
      for (let j = 0; j <= nz; j++) {
        const z = Z0 + (Z1 - Z0) * j / nz;
        for (let i = 0; i <= nx; i++) {
          const x = X0 + (X1 - X0) * i / nx; pos[k++] = x; pos[k++] = groundH(x, z); pos[k++] = z;
          ter[kt++] = LT.q; ter[kt++] = LT.mask; ter[kt++] = LT.nx; ter[kt++] = LT.nz;
          if ((i & 63) === 63) await ctx.yield();
        }
        await ctx.yield();
      }
      await ctx.yield();
      const idx = new Uint32Array(nx * nz * 6); k = 0;
      for (let j = 0; j < nz; j++) {
        for (let i = 0; i < nx; i++) {
          const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
          if (pos[a * 3 + 1] < -6.5 && pos[d * 3 + 1] < -6.5 && pos[b * 3 + 1] < -6.5 && pos[c * 3 + 1] < -6.5) continue;
          idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
        }
        if ((j & 31) === 31) await ctx.yield();
      }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.BufferAttribute(ter, 4)); g.setIndex(new THREE.BufferAttribute(idx.subarray(0, k), 1));
      // normals by central differences on the grid, in slices (computeVertexNormals and computeBoundingSphere were one long step each)
      const nrm = new Float32Array((nx + 1) * (nz + 1) * 3), sx2 = 2 * (X1 - X0) / nx, sz2 = 2 * (Z1 - Z0) / nz, W1 = nx + 1;
      for (let j = 0; j <= nz; j++) {
        const jm = Math.max(0, j - 1), jp = Math.min(nz, j + 1);
        for (let i = 0; i <= nx; i++) {
          const im = Math.max(0, i - 1), ip = Math.min(nx, i + 1);
          const ax = -(pos[(j * W1 + ip) * 3 + 1] - pos[(j * W1 + im) * 3 + 1]) / sx2 * (2 / (ip - im)), cz = -(pos[(jp * W1 + i) * 3 + 1] - pos[(jm * W1 + i) * 3 + 1]) / sz2 * (2 / (jp - jm));
          const il = 1 / Math.hypot(ax, 1, cz), o = (j * W1 + i) * 3;
          nrm[o] = ax * il; nrm[o + 1] = il; nrm[o + 2] = cz * il;
        }
        if ((j & 15) === 15) await ctx.yield();
      }
      g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3((X0 + X1) / 2, 110, (Z0 + Z1) / 2), Math.hypot(X1 - X0, 260, Z1 - Z0) / 2);
      await ctx.yield();
      const terrain = new THREE.Mesh(g, pm({ FLATN: '', NOFF: '0.5' })); terrain.name = 'cliff';
      scene.add(terrain);
    }
    await ctx.yield();

    // ---------- static props, merged into one vertex-coloured mesh
    const parts = [];
    function put(g, col, m, flatShade = false) {
      let n = g.index ? g.toNonIndexed() : g;
      if (m) n.applyMatrix4(m);
      if (flatShade) n.computeVertexNormals();
      for (const k of Object.keys(n.attributes)) if (k !== 'position' && k !== 'normal') n.deleteAttribute(k);
      const cnt = n.attributes.position.count, c = new Float32Array(cnt * 3);
      for (let i = 0; i < cnt; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
      n.setAttribute('color', new THREE.BufferAttribute(c, 3));
      parts.push(n);
    }
    const box = (w, h, d, col, x, y, z, ry = 0, rx = 0, rz = 0) => put(new THREE.BoxGeometry(w, h, d), col, M(x, y, z, ry, 1, 1, 1, rx, rz));
    const cyl = (rt, rb, h, seg, col, x, y, z, fl = false, ry = 0) => put(new THREE.CylinderGeometry(rt, rb, h, seg, 1), col, M(x, y, z, ry), fl);
    const clothInst = [], leafInst = [], lemonInst = [], blobInst = [], roofInst = [];
    const addCloth = (x, y, z, ry, w, h, col) => clothInst.push({ m: M(x, y, z, ry, w, h, 1), c: col });
    const addLeaf = (x, y, z, s, col) => leafInst.push({ m: M(x, y, z, rng() * 6.28, s, s, s, rng.range(-0.4, 0.4), rng.range(-0.4, 0.4)), c: col });
    const addBlob = (x, y, z, sx, sy, sz, col) => blobInst.push({ m: M(x, y, z, rng() * 6.28, sx, sy, sz), c: col });
    const cat = (x, y, z, ry, col, asleep = false) => {
      const c = Math.cos(ry), s = Math.sin(ry);
      box(0.24, asleep ? 0.2 : 0.3, 0.55, col, x, y + (asleep ? 0.1 : 0.15), z, ry);
      if (!asleep) { box(0.2, 0.42, 0.2, col, x + s * 0.2, y + 0.3, z + c * 0.2, ry); }
      box(0.22, 0.2, 0.2, col, x + s * 0.3, y + (asleep ? 0.14 : 0.6), z + c * 0.3, ry);
      for (const e of [-1, 1]) put(new THREE.ConeGeometry(0.05, 0.12, 3), col, M(x + s * 0.3 + c * e * 0.07, y + (asleep ? 0.3 : 0.76), z + c * 0.3 - s * e * 0.07));
      addCloth(x - s * 0.3, y + 0.5, z - c * 0.3, ry + 1.57, 0.07, 0.42, col);          // the tail, flicking
    };

    // the alley: a sunlit court, then a vaulted passage in violet shade crossed by bars of sun from gaps in the
    // vault, stepping down at the far end to a parapet so the slot of light holds sky, haze line and sea
    const fanAt = new THREE.Vector3(XL - 8.3, YL - 3.1 + 4.4, 61);
    {
      const fy = YL - 3.1, blockA = vr.pick([pink, mixc(coral, ochre, 0.5, 0.86)]), blockB = mixc(creamRaw, teal, 0.3, 0.86);
      const PZ0 = 70, PZ1 = 106, PZC = (PZ0 + PZ1) / 2, PL = PZ1 - PZ0;
      const floorC = mixc(creamRaw, ochre, 0.42, 1.0), bandC = mixc(ochre, coral, 0.35, 0.8), ceilC = mixc(blockA, violet, 0.35, 0.8);
      const shutC = mixc(teal, cobalt, 0.25, 0.8), shutD = mixc(teal, violet, 0.3, 0.6);
      box(30, 1.2, 68, floorC, XL, fy - 0.6, 62);                                         // court and passage floor, z 28..96
      for (let z = 31; z < 96; z += 3.5) box(z < PZ0 ? 17 : 8.3, 0.06, 0.45, bandC, XL, fy + 0.02, z);
      for (const sx of [-1, 1]) box(0.5, 0.06, 66, bandC, XL + sx * 1.6, fy + 0.02, 62);
      for (let i = 0; i < 5; i++) box(8.4, 1.2, 2.04, i % 2 ? paving : floorC, XL, fy - 0.6 - (i + 1) * 0.9, 97 + i * 2);   // steps down to the parapet
      box(8.4, 0.5, 0.5, cream, XL, fy - 4.25, 106.4);
      for (const sx of [-1, 1]) {
        box(4, 34, 42, sx > 0 ? blockA : blockB, XL + sx * 10.5, fy - 6, 49);            // court walls
        box(9, 40, PL, sx > 0 ? blockB : blockA, XL + sx * 8.7, fy - 6, PZC);                // passage blocks
        box(0.3, 1.1, 42, sx > 0 ? mixc(blockA, violet, 0.2, 0.8) : stone, XL + sx * 8.4, fy + 0.55, 49);   // a painted dado
        for (let k = 0; k < 5; k++) {
          if (sx < 0 && k === 4) continue;
          const wy = fy + 5 + (k % 2) * 4.6, wz = 33 + k * 7.2;
          put(new THREE.PlaneGeometry(1.5, 2.4), shutC, M(XL + sx * 8.45, wy, wz, -sx * Math.PI / 2));
          box(0.12, 0.12, 1.9, cream, XL + sx * 8.42, wy - 1.3, wz);
        }
        for (let k = 0; k < 4; k++) put(new THREE.PlaneGeometry(1.2, 1.7), shutD, M(XL + sx * 4.12, fy + 6.3, 73 + k * 8.5 + (sx > 0 ? 4 : 0), -sx * Math.PI / 2));
      }
      box(26, 34, 3, blockB, XL, fy - 6, 27);                                            // back of the court
      await ctx.yield();
      // the vault: thin slabs with three open gaps, a bridging room at each end
      for (const [z0, z1] of [[PZ0, 75.5], [80, 85], [89.5, 94.5], [99, PZ1]]) box(8.4, 1.0, z1 - z0, ceilC, XL, fy + 10.4, (z0 + z1) / 2);
      box(8.4, 3.1, 1.6, blockA, XL, fy + 12.45, PZ0 + 0.8); box(8.4, 3.1, 1.6, blockB, XL, fy + 12.45, PZ1 - 0.8);
      for (const z of [PZ0 + 0.35, 75.3, 80.2, 84.8, 89.7, 94.3, 99.2, PZ1 - 0.4]) put(new THREE.TorusGeometry(4.25, 0.32, 5, 14, Math.PI), cream, M(XL, fy + 5.7, z));
      // the half-open shutter with the fan turning behind it
      put(new THREE.PlaneGeometry(1.7, 2.3), dark, M(fanAt.x - 0.13, fanAt.y, fanAt.z, Math.PI / 2));
      box(0.08, 2.3, 0.85, shutC, fanAt.x + 0.3, fanAt.y, fanAt.z - 0.9, 0.9); box(0.08, 2.3, 0.85, shutC, fanAt.x + 0.02, fanAt.y, fanAt.z + 1.25, 0);
      box(0.12, 0.12, 2.0, cream, fanAt.x + 0.04, fanAt.y - 1.25, fanAt.z);
      const wash = [creamRaw, mixc(coral, creamRaw, 0.5), mixc(cobalt, creamRaw, 0.55), mixc(teal, creamRaw, 0.5), creamRaw, lemon.clone().lerp(creamRaw, 0.55)];
      for (const [lz, ly, half] of [[39, 8.4, 8.2], [50, 7.6, 8.2], [57.2, 8.6, 8.2], [66, 8.2, 8.2], [77, 8.0, 4.0], [86, 8.7, 4.0], [95, 8.1, 4.0], [103.2, 7.4, 4.0]]) {
        box(half * 2, 0.06, 0.06, dark, XL, fy + ly, lz);
        for (let i = 0; i < Math.round(half * 1.3); i++) { const big = rng() < 0.45; addCloth(XL - half + 0.9 + i * 1.5 + rng() * 0.3, fy + ly, lz, 0, big ? 1.5 : 0.8, big ? 1.7 : 1.0, rng.pick(wash)); }
      }
      // a doorway with a bead curtain, three steps, the cat that watches
      const dz = 84;
      put(new THREE.PlaneGeometry(1.9, 3.2), dark, M(XL + 4.12, fy + 1.6, dz, -Math.PI / 2));
      box(0.14, 3.5, 0.18, cream, XL + 4.12, fy + 1.75, dz - 1.05); box(0.14, 3.5, 0.18, cream, XL + 4.12, fy + 1.75, dz + 1.05); box(0.14, 0.2, 2.3, cream, XL + 4.12, fy + 3.4, dz);
      const beads = [coral, teal, lemon.clone().multiplyScalar(0.9), cobalt, creamRaw];
      for (let i = 0; i < 13; i++) addCloth(XL + 4.02, fy + 3.2, dz - 0.87 + i * 0.145, Math.PI / 2, 0.12, 2.6, beads[i % 5]);
      for (let i = 0; i < 3; i++) box(1.5 - i * 0.4, 0.3, 2.4, stone, XL - 3.5 + i * 0.1 - (1.5 - i * 0.4) / 2 + 0.75, fy + 0.15 + i * 0.3, 76.5);
      cat(XL - 3.6, fy + 0.9, 76.5, 0.9, dark);
      put(new THREE.PlaneGeometry(1.6, 2.8), shutD, M(XL - 4.12, fy + 1.4, 92, Math.PI / 2));
      await ctx.yield();
      // pots of geraniums: a turned pot, cut-out leaves and red heads
      const potProf = [[0.001, 0], [0.3, 0], [0.42, 0.62], [0.48, 0.66], [0.48, 0.78], [0.36, 0.78]].map((p) => new THREE.Vector2(p[0], p[1]));
      const red = C('#D2362E'), red2 = C('#E8584A');
      const pot = (x, y, z, s = 1) => {
        put(new THREE.LatheGeometry(potProf, 9), terracotta, M(x, y, z, 0, s, s, s), true);
        for (let i = 0; i < 7; i++) { const a = rng() * 6.28, r = rng() * 0.3 * s; addLeaf(x + Math.cos(a) * r, y + (0.85 + rng() * 0.25) * s, z + Math.sin(a) * r, 0.95 * s, i % 2 ? leafA : leafB); }
        for (let i = 0; i < 6; i++) { const a = rng() * 6.28, r = rng() * 0.42 * s; addLeaf(x + Math.cos(a) * r, y + (1.2 + rng() * 0.35) * s, z + Math.sin(a) * r, 0.6 * s, i % 3 ? red : red2); }
      };
      for (const [gx, gz, s] of [[-7.6, 34, 1.2], [7.6, 41, 1.2], [-7.6, 48, 1.2], [7.5, 63, 1.2], [-7.4, 66.5, 1.1], [-3.55, 72, 1], [3.55, 79.5, 1], [-3.55, 87, 1], [3.55, 93.5, 1]]) pot(XL + gx, fy, gz, s);
      for (let k = 0; k < 3; k++) pot(XL + 8.2, fy + 3.72 + (k % 2) * 4.6, 33 + k * 7.2, 0.5);     // one on a sill, too
      await ctx.yield();
      // a lemon tree in a tub in the court, bougainvillea pouring down the sunny wall
      cyl(0.75, 0.6, 0.9, 10, mixc(cobalt, creamRaw, 0.35, 0.85), XL + 6.2, fy + 0.45, 54); box(0.22, 2.2, 0.22, mixc(coral, violet, 0.35, 0.5), XL + 6.2, fy + 1.9, 54);
      addBlob(XL + 6.2, fy + 3.7, 54, 1.7, 1.35, 1.7, leafA); addBlob(XL + 5.6, fy + 4.3, 54.6, 1.1, 0.9, 1.1, leafB);
      for (let k = 0; k < 12; k++) { const a = rng() * 6.28, r = rng.range(0.9, 1.6); lemonInst.push([XL + 6.2 + Math.cos(a) * r, fy + 3.0 + rng() * 1.6, 54 + Math.sin(a) * r, 1]); }
      {                                                                                   // the world's signature at the door: a heavier branch of fruit, and a lemon-striped awning over the fan's window
        const ar = ctx.core.makeRng(ctx.seed + ':lc-alley');
        addBlob(XL + 5.3, fy + 4.6, 53.2, 1.5, 1.0, 1.5, leafB); addBlob(XL + 4.4, fy + 4.2, 52.4, 1.0, 0.7, 1.0, leafA);
        for (let k = 0; k < 22; k++) { const a = ar() * 6.28, r = 0.5 + ar() * 1.5; lemonInst.push([XL + 5.5 + Math.cos(a) * r, fy + 3.3 + ar() * 1.3, 53.3 + Math.sin(a) * r, 1]); }
        // the block from outside (the helix looks back at it): shutters on its outer faces, cornices, tiled roofs
        const extWin = (x0, z0, ux, uz, len, yTop, rows, ry) => {
          const n = Math.floor(len / 3.4);
          for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) { if (ar() < 0.14) continue; const t = (i + 0.5) / n * len; put(new THREE.PlaneGeometry(1.25, 1.9), r % 2 ? shutD : shutC, M(x0 + ux * t, yTop - 2.7 - r * 3.7, z0 + uz * t, ry)); }
        };
        for (const sx of [-1, 1]) {
          extWin(XL + sx * 13.26, PZ0, 0, 1, PL, fy + 14, 5, sx * Math.PI / 2); extWin(XL + sx * 12.56, 28, 0, 1, 42, fy + 11, 4, sx * Math.PI / 2);
          extWin(XL + sx * 8.7 - 4.5, PZ1 + 0.06, 1, 0, 9, fy + 14, 5, 0);
          box(9.5, 0.45, PL + 0.5, cream, XL + sx * 8.7, fy + 14.1, PZC); box(4.5, 0.4, 42.4, cream, XL + sx * 10.5, fy + 11.2, 49);
          roofInst.push({ m: M(XL + sx * 8.7, fy + 14.3, PZC, Math.PI / 2, PL + 0.2, 2.6, 9.2), c: sx > 0 ? terracotta : mixc(coral, ochre, 0.4, 0.8), r: [0.3 + sx * 0.1, PL + 0.2, 2.6, 9.2] });
        }
        await ctx.yield();
        for (let k = 0; k < 7; k++) box(2.6, 0.07, 0.46, k % 2 ? creamRaw : lemon.clone().multiplyScalar(0.95), fanAt.x + 0.85, fanAt.y + 2.0, fanAt.z - 1.38 + k * 0.46, 0, 0, -0.95);
      }
      for (let i = 0; i < 70; i++) { const dn = rng() * rng() * 9; addLeaf(XL - 8.3 + rng() * 0.35, fy + 11.2 - dn, rng.range(40, 54) + dn * 0.25, rng.range(1.5, 2.2), rng() < 0.25 ? bougB : bougA); }
    }

    await ctx.yield();

    // the lower lemon stair, its pergola frame, the landing
    const STW = 8, NS = 54, RISE = (H0 - QY) / NS, RUN = (S1 - S0) / NS, SLOPE = Math.atan2(H0 - QY, S1 - S0);
    {
      const sh = new THREE.Shape(); sh.moveTo(S0 - 1, QY - 3); sh.lineTo(S1 + 2, QY - 3); sh.lineTo(S1 + 2, QY - 0.2); sh.lineTo(S0 - 1, H0 - 0.25); sh.lineTo(S0 - 1, QY - 3);
      put(new THREE.ExtrudeGeometry(sh, { depth: 9.6, bevelEnabled: false }), stone, M(4.8, 0, 0, -Math.PI / 2), true);
      const riserCols = [mixc(cobalt, creamRaw, 0.25, 0.8), cream, mixc(teal, creamRaw, 0.2, 0.82), cream, lemon.clone().multiplyScalar(0.9), cream];
      for (let i = 0; i < NS; i++) {
        const yTop = H0 - (i + 1) * RISE, z0 = S0 + i * RUN;
        box(STW, RISE + 0.2, RUN + 0.04, i % 18 === 17 ? stone : paving, 0, yTop - (RISE + 0.2) / 2, z0 + RUN / 2);
        put(new THREE.PlaneGeometry(STW, RISE * 0.8), i % 3 === 0 ? riserCols[(i / 3) % 6 | 0] : cream, M(0, yTop - RISE * 0.5, z0 + RUN + 0.03, 0));
      }
      const NB = 10, BL = (S1 - S0) / NB;
      for (let k = 0; k < NB; k++) {
        const zc = S0 + (k + 0.5) * BL, top = treadY(S0 + k * BL) + 1.0, beamY = treadY(zc) + 5.9;
        for (const sx of [-1, 1]) {
          const x = sx * (STW / 2 + 0.4);
          box(0.76, 6.5, BL + 0.02, k % 2 ? cream : mixc(creamRaw, ochre, 0.2, 0.86), x, top - 3.25, zc); box(1.0, 0.18, BL + 0.12, stone, x, top + 0.05, zc);
          cyl(0.19, 0.26, beamY - top - 0.2, 8, cream, x, (beamY + top) / 2, zc);
          box(0.62, 0.22, 0.62, cream, x, beamY - 0.2, zc);
        }
        box(STW + 2.6, 0.26, 0.3, mixc(creamRaw, ochre, 0.3, 0.8), 0, beamY, zc);
      }
      const pl = Math.hypot(S1 - S0, H0 - QY) + 1.5;
      for (const px of [-4.6, -2.3, 0, 2.3, 4.6]) box(0.16, 0.18, pl, mixc(creamRaw, ochre, 0.4, 0.74), px, treadY((S0 + S1) / 2) + 6.12, (S0 + S1) / 2, 0, SLOPE);
      // landing between the two flights
      box(15, 0.4, 35, paving, 0, H0 - 0.1, 78.5);
      box(0.5, 1.1, 30, cream, -7.4, H0 + 0.6, 79);
      for (let i = 0; i < 6; i++) { cyl(0.34, 0.24, 0.55, 8, terracotta, -7.4, H0 + 1.4, 66 + i * 5.2); put(new THREE.IcosahedronGeometry(0.5, 0), i % 2 ? C('#C8322E') : leafA, M(-7.4, H0 + 1.95, 66 + i * 5.2), true); }
      // the scooter leaning on its stand, a cat on the wall
      const sc = mixc(teal, creamRaw, 0.35, 0.9);
      box(0.3, 0.5, 1.3, sc, -5.6, H0 + 0.75, 88, 0.3, 0, 0.12); box(0.34, 0.12, 0.6, dark, -5.63, H0 + 1.05, 87.8, 0.3, 0, 0.12); box(0.5, 0.06, 0.06, dark, -5.5, H0 + 1.35, 88.55, 0.3);
      for (const dzz of [-0.5, 0.5]) put(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 10), dark, M(-5.6 + dzz * 0.3, H0 + 0.36, 88 + dzz, 0.3, 1, 1, 1, 0, Math.PI / 2));
      cat(-7.4, H0 + 1.15, 74, 0.2, mixc(ochre, coral, 0.4, 0.7));
      cat(4.9, treadY(S0 + 9.2) + 1.1, S0 + 9, 2.8, cream, true);
    }

    await ctx.yield();

    // quay, breakwater and the whitewashed arch
    const BWY = 2.2, moored = [];
    {
      box(150, 5, 5, stone, 0, QY - 2.45, 150.5); box(150, 0.3, 5.4, cream, 0, QY + 0.12, 150.5);
      for (let i = -6; i <= 6; i++) if (i) cyl(0.22, 0.28, 0.6, 8, dark, i * 11, QY + 0.55, 152);
      // a rowing boat with shipped oars, hauled out
      const rb = mixc(cobalt, creamRaw, 0.2, 0.85);
      box(1.3, 0.5, 3.6, rb, 14, QY + 0.5, 146.5, 0.4); box(1.0, 0.1, 3.2, creamRaw.clone().multiplyScalar(0.85), 14, QY + 0.72, 146.5, 0.4);
      for (const o of [-0.25, 0.25]) box(0.08, 0.06, 3.0, ochre, 14 + o, QY + 0.82, 146.5, 0.4 + o * 0.3);
      // breakwater: arm from the west point, a quarter turn, the straight run to the arch
      box(118, 6, 6, stone, -99, BWY - 3, 290); box(118, 0.25, 4.4, cream, -99, BWY + 0.1, 290);
      for (let i = 0; i < 9; i++) {
        const a0 = (i / 9) * Math.PI / 2, a1 = ((i + 1) / 9) * Math.PI / 2, am = (a0 + a1) / 2;
        box(6, 6, 7.4, stone, -40 + Math.sin(am) * 40, BWY - 3, 330 - Math.cos(am) * 40, Math.PI / 2 - am);
        box(4.4, 0.25, 7.2, cream, -40 + Math.sin(am) * 40, BWY + 0.1, 330 - Math.cos(am) * 40, Math.PI / 2 - am);
      }
      box(6, 6, ZA - 330, stone, 0, BWY - 3, (330 + ZA) / 2); box(4.4, 0.25, ZA - 330, cream, 0, BWY + 0.1, (330 + ZA) / 2);
      for (let i = 0; i < 70; i++) {                                                      // armour blocks along the seaward side
        const t = rng(), onRun = t > 0.5, z = onRun ? lerp(332, ZA - 10, rng()) : 293.6 + rng() * 1.5, x = onRun ? rng.sign() * (3.6 + rng() * 1.2) : lerp(-150, -45, rng()), s = rng.range(1.2, 2.4);
        box(s, s, s, mixc(stone, i % 3 ? creamRaw : violet, 0.25, 0.92), x, 0.2 + rng() * 0.5, z, rng() * 3, rng(), rng());
      }
      put(new THREE.CylinderGeometry(16, 17, 6, 28), stone, M(0, BWY - 3, ZA - 2)); put(new THREE.CylinderGeometry(15.1, 15.1, 0.3, 28), cream, M(0, BWY + 0.1, ZA - 2));
      // the gateway: a thick whitewashed arch 21 m high. The noon sun stands out to sea behind it, so its face leans
      // back (a battered wall) to catch the light; the reveal stays in violet shade round the portal
      const white = creamRaw.clone().multiplyScalar(0.97), BK = Math.min(0.7, Math.max(0.3, sun.y > 0.6 ? sun.z / sun.y + 0.14 : 0.3)), AT = 20, AW = 12.5;
      const batter = (g, all) => { const q = g.attributes.position; for (let i = 0; i < q.count; i++) if (all || q.getZ(i) < 0.01) q.setZ(i, q.getZ(i) - BK * (AT - q.getY(i))); return g; };
      const archShape = (ro, yo, ri, yi) => {
        const rs = new THREE.Shape(); rs.moveTo(-ro, 0); rs.lineTo(ro, 0); rs.lineTo(ro, yo); rs.absarc(0, yo, ro, 0, Math.PI, false); rs.lineTo(-ro, 0);
        const rh = new THREE.Path(); rh.moveTo(-ri, 0); rh.lineTo(-ri, yi); rh.absarc(0, yi, ri, Math.PI, 0, true); rh.lineTo(ri, 0); rh.lineTo(-ri, 0); rs.holes.push(rh);
        return rs;
      };
      put(batter(new THREE.ExtrudeGeometry(archShape(AW, AT - AW, 7.6, 6.8), { depth: 3.4, bevelEnabled: false, curveSegments: 20 })), white, M(0, BWY, ZA + 0.9), true);
      await ctx.yield();
      const ring = (ro, ri, col, dp) => {
        const g = new THREE.ExtrudeGeometry(archShape(ro, 6.8, ri, 6.8), { depth: dp, bevelEnabled: false, curveSegments: 20 }); g.translate(0, 0, -dp - 0.03);
        put(batter(g, true), col, M(0, BWY, ZA + 0.9), true);
      };
      ring(10.6, 9.5, mixc(cobalt, violet, 0.1, 0.95), 0.14); ring(9.1, 8.5, lemon.clone().multiplyScalar(0.95), 0.14);   // the tile band: cobalt and lemon
      for (const sx of [-1, 1]) {                                                         // plinths, and a stepped shoulder each side
        box(5.6, 1.2, 4.0, stone, sx * 10.1, BWY + 0.6, ZA + 0.9 - BK * AT + 1.2);
        box(3.2, 4.2, 3.4, white, sx * 13.6, BWY + 2.1, ZA + 2.6); box(3.6, 0.3, 3.8, mixc(cobalt, violet, 0.1, 0.95), sx * 13.6, BWY + 4.3, ZA + 2.6);
      }
      await ctx.yield();
      // the mole's furniture: a parapet on the weather side, bollards, lamps, nets, pots, buoys
      const pr = ctx.core.makeRng(ctx.seed + ':lc-pier'), netC = [coral, mixc(teal, creamRaw, 0.1, 0.9), mixc(ochre, coral, 0.3, 0.9)];
      for (let z = 334; z < ZA - 22; z += 11) { box(0.55, 0.95, 8.6, cream, -2.72, BWY + 0.6, z + 4.3); box(0.75, 0.14, 8.8, white, -2.72, BWY + 1.12, z + 4.3); }
      for (let z = 336; z < ZA - 16; z += 6) box(4.42, 0.27, 0.3, mixc(stone, violet, 0.12, 0.96), 0, BWY + 0.1, z);
      for (let z = 338; z < ZA - 18; z += 9) { cyl(0.2, 0.27, 0.55, 8, dark, 2.45, BWY + 0.5, z); cyl(0.3, 0.3, 0.1, 8, dark, 2.45, BWY + 0.8, z); }
      const RUN0 = 330, bays = Math.max(1, Math.round((ZA - RUN0) / 28));                   // lamps: the straight run from the turn to the arch in equal bays of about 28 m, a lamp in the middle of each
      for (let i = 0; i < bays; i++) {
        const z = RUN0 + (i + 0.5) * (ZA - RUN0) / bays;
        cyl(0.07, 0.1, 3.5, 6, dark, 2.5, BWY + 1.95, z); box(0.9, 0.07, 0.07, dark, 2.1, BWY + 3.7, z); box(0.34, 0.42, 0.34, creamRaw, 1.7, BWY + 3.45, z); box(0.44, 0.08, 0.44, dark, 1.7, BWY + 3.7, z);
      }
      for (let i = 0; i < 9; i++) {
        const z = 337 + i * 5.6 + pr() * 2, x = (i % 3 === 1 ? 1.5 : -1.55) + pr() * 0.4, k = i % 3;
        if (k === 0) {                                                                    // a coil of net with its floats
          const c = netC[(pr() * 3) | 0];
          put(new THREE.TorusGeometry(0.62, 0.2, 5, 10), c, M(x, BWY + 0.42, z, 0, 1, 1, 1, Math.PI / 2), true); put(new THREE.TorusGeometry(0.42, 0.17, 5, 9), c, M(x + 0.1, BWY + 0.72, z, 0, 1, 1, 1, Math.PI / 2), true);
          for (let j = 0; j < 3; j++) put(new THREE.IcosahedronGeometry(0.17, 0), j % 2 ? creamRaw : C('#D2362E'), M(x + 0.8 + j * 0.3, BWY + 0.4, z + pr() * 0.6));
        } else if (k === 1) {                                                             // lobster pots, stacked
          for (let j = 0; j < 3; j++) { const px = x + (j === 2 ? 0.25 : j * 0.95 - 0.2), py = BWY + 0.52 + (j === 2 ? 0.56 : 0); box(0.85, 0.5, 0.6, mixc(ochre, coral, 0.2, 0.8), px, py, z, 0.2 * j); box(0.87, 0.1, 0.62, dark, px, py, z, 0.2 * j); }
        } else { cyl(0.36, 0.3, 0.7, 8, mixc(cobalt, creamRaw, 0.2, 0.85), x, BWY + 0.6, z); put(new THREE.IcosahedronGeometry(0.3, 0), C('#D2362E'), M(x + 0.6, BWY + 0.55, z + 0.3), true); }
      }
      // boats tied up on the lee side: a berth at every bollard of the straight run, each taken on an even seeded chance; seven
      // draws a berth whether it is taken or not (taken, colour, how far off the stone, size, bow to the arch or to the town, a little yaw, its bob)
      for (let z = 338; z < ZA - 18; z += 9) {
        const take = pr() < 0.5, k = pr(), off = pr(), sz = pr(), bow = pr(), yaw = pr(), bob = pr();
        if (take) moored.push({ x: 5.0 + off * 0.4, z, a: (bow < 0.5 ? 0 : Math.PI) + (yaw - 0.5) * 0.16, s: 0.7 + sz * 0.1, k, r: [bob, 0, 0, 0] });
      }
    }
    await ctx.yield();

    // funicular track and stations, the switchback road
    const fPitch = Math.atan2(FB[1] - FA[1], fLen), fRy = Math.atan2(FB[0] - FA[0], FB[2] - FA[2]), fL3 = Math.hypot(fLen, FB[1] - FA[1]);
    const fAt = (t, lat = 0, out = new THREE.Vector3()) => out.set(lerp(FA[0], FB[0], t) + Math.cos(fRy) * lat, lerp(FA[1], FB[1], t), lerp(FA[2], FB[2], t) - Math.sin(fRy) * lat);
    {
      const m = fAt(0.5);
      box(6.4, 0.8, fL3 + 6, stone, m.x, m.y - 0.5, m.z, fRy, -fPitch);
      for (const lat of [-2.0, -0.9, 0.9, 2.0]) { const q = fAt(0.5, lat); box(0.2, 0.25, fL3, dark, q.x, q.y + 0.02, q.z, fRy, -fPitch); }
      for (let i = 0; i < 66; i++) { const q = fAt((i + 0.5) / 66); box(5.6, 0.16, 0.6, mixc(creamRaw, ochre, 0.5, 0.6), q.x, q.y - 0.06, q.z, fRy, -fPitch); }
      for (const [t, col] of [[-0.035, pink], [1.035, cream]]) { const q = fAt(t); box(11, 8, 9, col, q.x, q.y + 2.5, q.z, fRy); box(11.6, 0.5, 9.6, terracotta, q.x, q.y + 6.7, q.z, fRy); }
      const roadCol = mixc(creamRaw, violet, 0.22, 0.8);
      for (let k = 0; k < road.length - 1; k++) {
        const a = road[k], b = road[k + 1], lh = Math.hypot(b[0] - a[0], b[2] - a[2]);
        box(5.6, 0.5, Math.hypot(lh, b[1] - a[1]) + 2, roadCol, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.2, (a[2] + b[2]) / 2, Math.atan2(b[0] - a[0], b[2] - a[2]), -Math.atan2(b[1] - a[1], lh));
        cyl(4.6, 4.6, 0.5, 14, roadCol, b[0], b[1] - 0.2, b[2]);
        for (let i = 1; i < 6; i++) { const t = i / 6; box(0.5, 0.7, 0.5, cream, lerp(a[0], b[0], t) - 3.0, lerp(a[1], b[1], t) + 0.3, lerp(a[2], b[2], t)); }
      }
    }

    // ---------- the houses: instanced boxes; the fragment shader draws shutters, sills and awnings
    const houses = [], hGrid = new Map(), upper = [];
    {
      const wallCols = [cream, cream, mixc(creamRaw, ochre, 0.3, 0.84), mixc(creamRaw, ochre, 0.6, 0.82), pink, pink, mixc(coral, ochre, 0.35, 0.8), terracotta, creamRaw.clone().multiplyScalar(0.94), mixc(creamRaw, teal, 0.18, 0.86)];
      const hr = rng.fork('houses'), GRID = 10.4;
      const near = (x, z, a, b) => segDist(x, z, a[0], a[2], b[0], b[2])[0];
      // a 12 m grid of the houses placed so far, so a candidate is only tested against its neighbours
      const hNear = (x, z, test) => {
        const gi = Math.floor((x + 600) / 12), gj = Math.floor((z + 600) / 12);
        for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const l = hGrid.get((gi + a) * 4096 + gj + b); if (l) for (let k = 0; k < l.length; k++) if (test(l[k])) return true; }
        return false;
      };
      // one candidate: returns true when it fell on the steep west wall, where the caller tries the ledges above as well
      const place = (x, z) => {
        let h = groundH(x, z);
        let w = hr.range(6.5, 10.5), d = hr.range(6.5, 9.5); const keep = hr(), jit = hr.range(-1, 1), qt = hr.int(0, 3); let rise = hr.range(5.2, 10.5) + (hr.chance(0.12) ? 4 : 0); const col = hr.pick(wallCols), r = hr();
        // not one box repeated: low cottages to five-storey fronts, and wide, low palazzi among them
        const pal = (r * 17.31) % 1 < 0.15;
        rise = 4 + 9.5 * Math.pow(Math.min(1, (rise - 5.2) / 7), 1.25);
        if (pal) { w = 13.5 + ((r * 91.7) % 1) * 4.5; d = Math.max(d, 8); rise = Math.min(rise, 5.5 + ((r * 53.3) % 1) * 3); }
        let ledge = false, lry = 0;
        const wall = LT.mask > 0 && LT.nx > 0 && h < 190;
        if (LT.mask > 0 && h < 190) {                                                     // snap onto its terrace: front on the lane, back against (or into) the wall
          const gq = (LT.nx > 0 ? 3.2 : LT.nx === 0 ? 1.25 : 0.85) / TER, sh = (LT.q - (Math.floor(LT.q) + 0.1 + d * 0.5 * gq)) / gq;
          lry = Math.atan2(LT.nx, LT.nz); x += LT.nx * sh; z += LT.nz * sh; h = groundH(x, z); ledge = LT.mask > 0;
        }
        if (h < 2.6) return wall;
        if (keep > (h > 196 ? 0.12 : 1.0) * (0.75 + 0.25 * Math.min(density, 1.1)) * (0.8 + 0.3 * noise.n2(x * 0.012 + 40, z * 0.012))) return wall;
        if (Math.abs(x) < 40 && z > -34 && z < 62) return wall;                           // the hero's terrace
        if (Math.abs(x) < 15 && z >= 62 && z < 156) return wall;                          // landing, stair, quay head
        if (Math.abs(x - XL) < 21 && z > 20 && z < 114) return wall;                      // the alley block
        if (near(x, z, FA, FB) < 12) return wall;
        for (let k = 0; k < road.length - 1; k++) if (near(x, z, road[k], road[k + 1]) < 10) return wall;
        if (ledge ? hNear(x, z, (o) => (wall ? Math.abs(o.x - x) < 1.6 && Math.abs(o.z - z) < Math.max(9.6, (o.w + w) * 0.5 + 0.8) : Math.abs(o.x - x) + Math.abs(o.z - z) < Math.max(8.5, (o.w + w) * 0.5 + 0.6)))
          : pal && hNear(x, z, (o) => Math.abs(o.x - x) + Math.abs(o.z - z) < (o.w + w) * 0.5 + 1)) return wall;
        let ry;
        if (ledge) ry = lry + jit * 0.05;
        else {
          const e = 3, gxs = groundH(x + e, z) - groundH(x - e, z), gzs = groundH(x, z + e) - groundH(x, z - e), gl = Math.hypot(gxs, gzs);
          ry = gl > 1.2 ? Math.atan2(-gxs, -gzs) + jit * 0.12 : qt * Math.PI / 2 + jit * 0.2;
        }
        const dx = Math.sin(ry), dz = Math.cos(ry);
        const low = Math.min(h, groundH(x + dx * d * 0.5, z + dz * d * 0.5), groundH(x + dx * d * 0.5 + dz * w * 0.4, z + dz * d * 0.5 - dx * w * 0.4), groundH(x + dx * d * 0.5 - dz * w * 0.4, z + dz * d * 0.5 + dx * w * 0.4));
        if (low < 1.5) return wall;
        const base = low - 1.5, top0 = (wall && ledge ? low + 1.5 : h) + rise;
        const hgt = Math.min(top0 - base, 2.2 * Math.max(w, d)), top = base + hgt;         // never a slab: the tall ones stay set into the cliff
        if (!(wall && ledge) && top < h + 3.2) return wall;
        if (pathClear(x, top - 2, z) < 13 + Math.max(w, d) * 0.6) return wall;
        const hs = { x, z, ry, w, d, top, base: top - hgt, hgt, col, r, wall: wall && ledge, pal, gy: h };
        houses.push(hs);
        const key = Math.floor((x + 600) / 12) * 4096 + Math.floor((z + 600) / 12), l = hGrid.get(key);
        if (l) l.push(hs); else hGrid.set(key, [hs]);
        return wall;
      };
      for (let gz = -262; gz < 300; gz += GRID) {
        for (let gx = -410; gx < 410; gx += GRID) {
          const x = gx + hr.range(1.5, GRID - 1.5), z = gz + hr.range(1.5, GRID - 1.5);
          if (place(x, z)) { place(x - 3.75, z + hr.range(-3, 3)); place(x - 7.5, z + hr.range(-3, 3)); }
          await ctx.yield();
        }
        await ctx.yield();
      }
      // second volumes, drawn from a stream of their own so the town plan stays as it was: hipped terracotta roofs,
      // a set-back top storey with a roof terrace in front of it, a few chapel cupolas
      const xr = ctx.core.makeRng(ctx.seed + ':lc-roofs');
      const tileCols = [terracotta, mixc(coral, ochre, 0.3, 0.78), mixc(terracotta, violet, 0.12, 0.95), mixc(coral, ochre, 0.5, 0.8)];
      const cupCols = [mixc(cobalt, creamRaw, 0.08, 0.9), terracotta, creamRaw.clone().multiplyScalar(0.95), mixc(teal, creamRaw, 0.15, 0.85)];
      let hi = 0, cups = 0;
      for (const hs of houses) {
        if (hi++ % 200 === 199) await ctx.yield();
        hs.pd = pathClear(hs.x, hs.top, hs.z);
        const k = xr(), k2 = xr(), k3 = xr(), c = Math.cos(hs.ry), s = Math.sin(hs.ry);
        if (k < (hs.pal ? 0.6 : 0.3)) {
          const rh = 0.9 + 0.2 * Math.min(hs.w, hs.d) * (0.7 + 0.6 * k2);
          if (pathClear(hs.x, hs.top + rh, hs.z) > 12) { hs.roof = 1; roofInst.push({ m: M(hs.x, hs.top, hs.z, hs.ry, hs.w + 0.8, rh, hs.d + 0.8), c: tileCols[(k3 * 4) | 0], r: [hs.r, hs.w + 0.8, rh, hs.d + 0.8] }); }
        } else if (k < 0.5 && !hs.pal && hs.w > 7.2 && pathClear(hs.x, hs.top + 4.3, hs.z) > 14) {
          const sw = hs.w * (0.5 + 0.3 * k2), sd = hs.d * 0.55, lat = (hs.w - sw) * 0.5 * (k3 < 0.33 ? -1 : k3 < 0.66 ? 0 : 1), bk = -(hs.d - sd) * 0.5;
          hs.deck = 1;
          upper.push({ x: hs.x + c * lat + s * bk, z: hs.z - s * lat + c * bk, ry: hs.ry, w: sw, d: sd, base: hs.top, hgt: 4.3, col: k2 < 0.5 ? hs.col : wallCols[(k3 * wallCols.length) | 0], r: k2 });
        } else if (k > 0.972 && !hs.wall && cups < 40 && hs.pd > 20 && hs.pd < 330) {
          const cr = Math.min(hs.w, hs.d) * 0.36; cups++; hs.roof = 1;
          cyl(cr, cr, 1.0, 10, hs.col, hs.x, hs.top + 0.5, hs.z, true);
          put(new THREE.SphereGeometry(cr, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), cupCols[(k2 * 4) | 0], M(hs.x, hs.top + 1.0, hs.z), true);
          cyl(0.25, 0.25, 0.9, 5, creamRaw, hs.x, hs.top + 1.2 + cr, hs.z);
        }
      }
      await ctx.yield();
      // roof life: parasols, water tanks, laundry, vines (nothing but the vines on the far roofs)
      const rr = rng.fork('roofs');
      hi = 0;
      for (const hs of houses) {
        if (hi++ % 20 === 19) await ctx.yield();
        const q = hs.wall ? 1 : rr();
        if (q < 0.52 && (hs.roof || hs.pd > 300)) continue;
        const c = Math.cos(hs.ry), s = Math.sin(hs.ry), fo = hs.deck ? hs.d * 0.27 : 0, px = hs.x + s * fo, pz = hs.z + c * fo;
        if (q < 0.2) { cyl(0.06, 0.06, 2.3, 5, dark, px, hs.top + 1.15, pz); cyl(0.1, 2.3, 0.75, 8, rr.pick([coral, creamRaw, teal, mixc(cobalt, creamRaw, 0.3)]), px, hs.top + 2.4, pz, true); }
        else if (q < 0.3) { if (!hs.deck) cyl(0.9, 0.9, 1.5, 9, mixc(cobalt, creamRaw, 0.6, 0.85), hs.x + 1.2, hs.top + 0.75, hs.z - 1); }
        else if (q < 0.52) {                                                             // a laundry line across the roof
          const hw = hs.w * 0.38, off = hs.deck ? fo : rr.range(-1.5, 1.5);
          for (const e of [-1, 1]) box(0.09, 2.0, 0.09, dark, hs.x + c * hw * e + s * off, hs.top + 1.0, hs.z - s * hw * e + c * off);
          box(hw * 2, 0.07, 0.07, dark, hs.x + s * off, hs.top + 1.95, hs.z + c * off, hs.ry);
          const n = 3 + (rr() * 3 | 0), wash = [creamRaw.clone().multiplyScalar(0.95), creamRaw.clone().multiplyScalar(0.95), mixc(coral, creamRaw, 0.5), mixc(cobalt, creamRaw, 0.55), mixc(teal, creamRaw, 0.5), mixc(ochre, creamRaw, 0.3)];
          for (let i = 0; i < n; i++) {
            const t = ((i + 0.5) / n * 2 - 1) * hw * 0.85, big = rr() < 0.4;
            addCloth(hs.x + c * t + s * off, hs.top + 1.92, hs.z - s * t + c * off, hs.ry, big ? 1.6 : 0.85, big ? 1.5 : 0.9, rr.pick(wash));
          }
        } else if (q < 0.62) {                                                           // vine or bougainvillea pouring over the edge
          const col = rr() < 0.6 ? bougA : leafA, n = 16;
          for (let i = 0; i < n; i++) {
            const t = rr.range(-0.45, 0.45) * hs.w, dn = rr() * rr() * 5.5;
            leafInst.push({ m: M(hs.x + s * (hs.d * 0.5 + 0.2) + c * t, hs.top + 0.3 - dn, hs.z + c * (hs.d * 0.5 + 0.2) - s * t, rr() * 6.28, 1.9, 1.9, 1.9, rr.range(-0.4, 0.4), rr.range(-0.4, 0.4)), c: rr() < 0.25 ? bougB : col });
          }
        } else if (q < 0.70) addBlob(hs.x + hs.w * 0.6, hs.top - 1, hs.z + 1, 1.3, 5.2, 1.3, cypress);
      }
      await ctx.yield();
      // washing strung across the lanes, house to house, where the plane flies low over the roofs
      {
        const wash = [creamRaw.clone().multiplyScalar(0.95), creamRaw.clone().multiplyScalar(0.95), mixc(coral, creamRaw, 0.5), mixc(cobalt, creamRaw, 0.55), mixc(teal, creamRaw, 0.45), lemon.clone().lerp(creamRaw, 0.6), C('#D2362E')];
        let lines = 0;
        for (let i = 0; i < houses.length && lines < 70; i++) {
          const a = houses[i];
          if ((i & 15) === 15) await ctx.yield();
          if (a.wall || a.pd > 150 || a.strung) continue;
          hNear(a.x, a.z, (b) => {
            if (b === a || b.wall || b.strung || a.strung) return false;
            const dx = b.x - a.x, dz = b.z - a.z, dist = Math.hypot(dx, dz), ha = Math.min(a.w, a.d) * 0.5, hb = Math.min(b.w, b.d) * 0.5, gap = dist - ha - hb;
            if (gap < 3.2 || gap > 9.5) return false;
            const y = Math.min(a.top, b.top) - 1.1, t = (ha + gap * 0.5) / dist, mx = a.x + dx * t, mz = a.z + dz * t;
            if (y < Math.max(a.gy, b.gy) + 4.2 || y < groundH(mx, mz) + 4.5 || pathClear(mx, y, mz) < 9) return false;
            if (hNear(mx, mz, (o) => o !== a && o !== b && Math.abs(o.x - mx) + Math.abs(o.z - mz) < Math.max(o.w, o.d) * 0.75 + 1 && o.top > y - 2)) return false;
            const ry = Math.atan2(-dz, dx), ux = dx / dist, uz = dz / dist, n = Math.max(2, Math.round(gap / 1.45));
            box(gap + 0.6, 0.08, 0.08, dark, mx, y + 0.04, mz, ry);
            for (let j = 0; j < n; j++) {
              const o = ((j + 0.5) / n - 0.5) * gap * 0.92, big = xr() < 0.45;
              addCloth(mx + ux * o, y, mz + uz * o, ry, big ? 1.5 : 0.85, big ? 1.7 : 1.0, wash[(xr() * wash.length) | 0]);
            }
            a.strung = b.strung = 1; lines++;
            return true;
          });
        }
      }
      const car = houses.find((hs) => Math.abs(hs.x - 30) < 40 && hs.z > 100 && hs.z < 140) || houses[0];
      if (car) { const cx = car.x, cz = car.z + car.d * 0.5 + 3.5, cy = groundH(cx, cz); box(3.4, 0.7, 1.5, mixc(coral, creamRaw, 0.1, 0.85), cx, cy + 0.7, cz); box(1.9, 0.55, 1.4, creamRaw, cx - 0.2, cy + 1.3, cz); cat(cx - 0.2, cy + 1.58, cz, 1.57, mixc(ochre, creamRaw, 0.3, 0.8), true); }
    }
    await ctx.yield();

    // ---------- vegetation: pergola vine and lemons, bougainvillea, pines, olives
    {
      const off = rng() * 50;
      for (let i = 0; i < Math.round(2600 * (0.7 + 0.3 * detail)); i++) {                 // canopy with gaps for sun dapple
        const x = rng.range(-5.4, 5.4), z = rng.range(S0 + 6.5, S1 + 1.5);
        if (noise.n2(x * 0.22 + off, z * 0.22) + noise.n2(x * 0.9, z * 0.9 + off) * 0.35 < -0.1 && Math.abs(x) < 4.9) continue;
        const y = treadY(z) + 6.3 + rng.range(-0.1, 0.45);
        addLeaf(x, y, z, rng.range(0.9, 1.6), rng() < 0.5 ? leafA : leafB);
        if (lemonInst.length < 820 && rng() < 0.5) {
          const topSide = rng() < 0.25 || Math.abs(x) > 4.3;
          lemonInst.push([x + rng.range(-0.3, 0.3), y + (topSide ? rng.range(0.35, 0.6) : -rng.range(0.25, 0.5)), z + rng.range(-0.3, 0.3), topSide ? 1 : 0]);
        }
      }
      for (let i = 0; i < 420; i++) {                                                    // fringes and bougainvillea down the stair sides
        const sx = rng.sign(), z = rng.range(S0, S1), dr = rng() * rng() * 3.2;
        addLeaf(sx * rng.range(4.6, 5.5), treadY(z) + 6.1 - dr, z, rng.range(0.8, 1.3), rng() < 0.6 ? leafA : leafB);
        if (i % 2) addLeaf(sx * (STW / 2 + 0.95 + rng() * 0.4), treadY(z) + rng.range(-2.5, 1.2), z, rng.range(1.3, 2.0), rng() < 0.2 ? leafB : sx > 0 ? bougA : bougB);
      }
      for (let i = 0; i < 90; i++) addLeaf(-7.5 - rng() * 0.4, H0 + rng.range(-0.2, 1.3), rng.range(62, 95), rng.range(1.2, 1.9), rng() < 0.3 ? leafA : bougA);
      await ctx.yield();
      const vg = rng.fork('veg');
      for (let i = 0, n = 0; i < 900 && n < 70; i++) {                                   // umbrella pines along the cliff top
        const x = vg.range(-400, 400), z = vg.range(-260, 250), h = groundH(x, z);
        if (h < 196 || pathClear(x, h + 8, z) < 22) continue;
        const ph = vg.range(7, 12); n++;
        box(0.5, ph, 0.5, mixc(coral, violet, 0.35, 0.5), x, h + ph / 2 - 0.5, z);
        for (let b = 0; b < 4; b++) { const a = b * 1.57 + vg(), r = b ? vg.range(1.8, 3) : 0, s = b ? vg.range(2.4, 3.2) : 4.2; addBlob(x + Math.cos(a) * r, h + ph + vg.range(-0.3, 0.4), z + Math.sin(a) * r, s, s * 0.34, s, b % 2 ? pineC : mixc(pineC, leafB, 0.5)); }
      }
      for (let i = 0, n = 0; i < 2500 && n < 260 * density; i++) {                       // olive dabs on the high terraces, cypress in town
        const x = vg.range(-400, 400), z = vg.range(-260, 290), h = groundH(x, z);
        if (h < 4 || pathClear(x, h + 3, z) < 14 || (Math.abs(x) < 40 && z > -34 && z < 100) || Math.abs(x - XL) < 20) continue;
        if (groundH(x + 2, z + 2) - h > 2.5 || h - groundH(x - 2, z - 2) > 2.5) continue;
        n++;
        if (h > 150) { const s = vg.range(1.6, 2.6); addBlob(x, h + s * 0.6, z, s, s * 0.75, s, vg() < 0.7 ? olive : mixc(olive, leafA, 0.5)); }
        else if (vg() < 0.5) { const s = vg.range(0.9, 1.4); addBlob(x, h + s * 2.6, z, s, s * 3.6, s, cypress); }
        else { const s = vg.range(1.5, 2.4); addBlob(x, h + s * 0.7, z, s, s * 0.8, s, vg() < 0.5 ? leafA : pineC); }
      }
      await ctx.yield();
      // the retaining walls: bougainvillea and vine pouring down them, cypress at their feet, prickly pear on the parapets
      const pear = C('#7FA872');
      for (let i = 0, nb = 0, nc = 0, np = 0; i < 2600; i++) {
        const x = vg.range(-330, 400), z = vg.range(-250, 130), k = vg(), h = groundH(x, z);
        if (LT.mask < 1 || LT.nx > 0 || h > 188 || h < 30) continue;
        const fr = LT.q - Math.floor(LT.q), nxx = LT.nx, nzz = LT.nz;
        if (pathClear(x, h + 4, z) < 15) continue;
        if (fr > 0.64 && fr < 0.98 && nb < 46 * density && k < 0.5) {
          nb++; const col = k < 0.32 ? bougA : leafA, run = (nxx === 0 ? 3.6 : 5.4);
          for (let j = 0; j < 11; j++) {
            const t = vg.range(-3.2, 3.2), u = vg.range(-0.5, 0.5) * run, px = x - nzz * t + nxx * u, pz = z + nxx * t + nzz * u;
            addLeaf(px + nxx * 0.3, groundH(px, pz) + 0.35, pz + nzz * 0.3, vg.range(1.9, 2.7), vg() < 0.25 ? bougB : col);
          }
        } else if (fr > 0.46 && fr < 0.6 && nc < 60 * density) { nc++; const sc = vg.range(0.9, 1.3); addBlob(x, h + sc * 2.5, z, sc, sc * 3.5, sc, cypress); }
        else if (fr < 0.1 && np < 44) { np++; for (let j = 0; j < 2; j++) addBlob(x + vg.range(-0.7, 0.7), h + 0.7 + j * 0.5, z + vg.range(-0.7, 0.7), 0.7, 0.95, 0.2, j ? mixc(pear, leafA, 0.3) : pear); }
      }
      await ctx.yield();
      const trunk = mixc(coral, violet, 0.35, 0.5);
      for (let gx = -41.6; gx <= 42; gx += 5.2) for (let gz = 63; gz <= 140; gz += 5.2) {   // the lemon gardens either side of the stair
        const x = gx + vg.range(-0.8, 0.8), z = gz + vg.range(-0.8, 0.8);
        if (Math.abs(x) < 9.6) continue;
        const h = groundH(x, z);
        if (h < 2.8 || pathClear(x, h + 3, z) < 8.5 || houses.some((hs) => Math.abs(hs.x - x) < hs.w * 0.5 + 3 && Math.abs(hs.z - z) < hs.d * 0.5 + 3)) continue;
        const sz = vg.range(1.3, 1.8);
        addBlob(x, h + sz * 1.0, z, sz, sz * 0.85, sz, vg() < 0.5 ? leafA : leafB); box(0.25, 1.4, 0.25, trunk, x, h + 0.5, z);
        for (let k = 0; k < 4; k++) { const a = vg() * 6.28, r = sz * vg.range(0.3, 0.8); lemonInst.push([x + Math.cos(a) * r, h + sz * 1.0 + sz * 0.85 * Math.sqrt(Math.max(0.05, 1 - (r / sz) * (r / sz))) + 0.1, z + Math.sin(a) * r, 1]); }
      }
    }
    await ctx.yield();

    // ---------- build the meshes
    const pmV = pm({ PROPS: '' }, { vertexColors: true });
    const staticMesh = new THREE.Mesh(mergeGeometries(parts, false), pmV); staticMesh.name = 'town-props';
    await ctx.yield();
    for (const g of parts) g.dispose();
    parts.length = 0;
    scene.add(staticMesh);
    function inst(geo, list, defines, extra = {}) {
      const n = list.length, mesh = new THREE.InstancedMesh(geo, pm({ INST: '', ...defines }, extra), Math.max(n, 1));
      const cc = new Float32Array(Math.max(n, 1) * 3), rr = new Float32Array(Math.max(n, 1) * 4);
      list.forEach((it, i) => {
        mesh.setMatrixAt(i, it.m); const v = it.flatCol ? 1 : 0.9 + rng() * 0.18;
        cc[i * 3] = it.c.r * v; cc[i * 3 + 1] = it.c.g * v; cc[i * 3 + 2] = it.c.b * v;
        const r = it.r || [rng(), 0, 0, 0]; rr[i * 4] = r[0]; rr[i * 4 + 1] = r[1]; rr[i * 4 + 2] = r[2]; rr[i * 4 + 3] = r[3];
      });
      mesh.count = n;
      geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(cc, 3)); geo.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rr, 4));
      mesh.frustumCulled = false; scene.add(mesh); return mesh;
    }
    {
      const hg = new THREE.BoxGeometry(1, 1, 1); hg.translate(0, 0.5, 0); hg.deleteAttribute('uv');
      inst(hg, houses.concat(upper).map((h) => ({ m: M(h.x, h.base, h.z, h.ry, h.w, h.hgt, h.d), c: h.col, r: [h.r, h.w, h.hgt, h.d] })), { HOUSE: '' }).name = 'houses';
      // hipped roof: four slopes up to a short ridge
      const rg = new THREE.BufferGeometry();
      rg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0.5, 0.5, 0, 0.5, 0.22, 1, 0, -0.5, 0, 0.5, 0.22, 1, 0, -0.22, 1, 0, 0.5, 0, -0.5, -0.5, 0, -0.5, -0.22, 1, 0, 0.5, 0, -0.5, -0.22, 1, 0, 0.22, 1, 0,
        0.5, 0, 0.5, 0.5, 0, -0.5, 0.22, 1, 0, -0.5, 0, -0.5, -0.5, 0, 0.5, -0.22, 1, 0], 3));
      rg.computeVertexNormals();
      inst(rg, roofInst, { HOUSE: '', ROOFT: '' }).name = 'roofs';
      await ctx.yield();
      const bg = new THREE.IcosahedronGeometry(1, 1); bg.deleteAttribute('uv'); bg.computeVertexNormals();
      inst(bg, blobInst, { BLOB: '', LIT_EDGE: '0.12' }).name = 'trees';
      // cut-out leaf cluster (the hero's recipe)
      const lp = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + rng() * 0.6, droop = rng.range(-0.5, 0.25), Ln = rng.range(0.5, 0.75), W = Ln * 0.34;
        const dir = new THREE.Vector3(Math.cos(a), droop, Math.sin(a)).normalize(), sd = new THREE.Vector3(-Math.sin(a), rng.range(-0.3, 0.3), Math.cos(a)).normalize();
        const o = dir.clone().multiplyScalar(0.08), mid = dir.clone().multiplyScalar(Ln * 0.45), tip = dir.clone().multiplyScalar(Ln);
        const l = mid.clone().addScaledVector(sd, W), r = mid.clone().addScaledVector(sd, -W);
        lp.push(o.x, o.y, o.z, l.x, l.y, l.z, tip.x, tip.y, tip.z, o.x, o.y, o.z, tip.x, tip.y, tip.z, r.x, r.y, r.z);
      }
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.computeVertexNormals();
      inst(lg, leafInst, { LEAF: '', LIT_EDGE: '0.3', NOFF: '0.4' }, { side: THREE.DoubleSide }).name = 'leaves';
      // petals drifting down both flights of the stair and through the alley. None may drift across the plane's face: the whole
      // fall of a petal (taken every half metre of its drop, its half-metre sway allowed for) stays PETAL_CLEAR metres off the
      // flight line, the line taken at its even 1 m step from end to end. A petal dealt nearer is set off sideways, straight away
      // from the line, to between the clearance and 1.2 m beyond it (how far: a hash of its own seeded number, so no draw is
      // added and nothing after it is re-dealt); one that still cannot be kept clear stays in the list at no size
      const pet = [], PETAL_CLEAR = 2.5;
      const fallNear = (x, y, z, drop, drift, o) => {                                     // how near the whole fall comes to the flight line; there, its height over the line and how far to which side of it
        o.d = 1e9;
        for (let f = 0; f < drop + 0.5; f += 0.5) { const g = Math.min(f, drop), d = flightNear(x, y - g, z + g * drift); if (d < o.d) { o.d = d; o.i = flHit.i; o.g = g; } }
        const i = o.i, j = Math.max(0, i - 3), k = Math.min(fl.length - 3, i + 3), tl = Math.hypot(fl[k] - fl[j], fl[k + 2] - fl[j + 2]) || 1;
        o.nx = (fl[k + 2] - fl[j + 2]) / tl; o.nz = -(fl[k] - fl[j]) / tl;                // level and square to the line
        o.y = y - o.g - fl[i + 1]; o.side = (x - fl[i]) * o.nx + (z + o.g * drift - fl[i + 2]) * o.nz;
        return o.d;
      };
      const petal = (x, y, z, ry, s, rx, rz, col, r0, drop, drift) => {
        const need = PETAL_CLEAR + 0.5, o = {}; let d = fallNear(x, y, z, drop, drift, o);
        for (let k = 0; k < 4 && d < need; k++) {
          const out = (Math.sqrt(Math.max(0, need * need - o.y * o.y)) - Math.abs(o.side) + (k ? 0.1 : ((r0 * 61.7) % 1) * 1.2)) * (o.side < 0 ? -1 : 1);
          x += o.nx * out; z += o.nz * out; d = fallNear(x, y, z, drop, drift, o);
        }
        if (d < need) s = 0;
        pet.push({ m: M(x, y, z, ry, s, s, s, rx, rz), c: col, r: [r0, drop, drift, 0] });
      };
      for (let i = 0; i < Math.round(190 * detail); i++) {
        const upper = rng() < 0.4, z = upper ? rng.range(31, 60) : rng.range(S0, S1), ty = upper ? H0 + 16 - (z - 30) * 16 / 30 : treadY(z);
        petal(rng.range(-4.6, 4.6), ty + 6.0, z, rng() * 6.28, 0.42, rng() * 3, rng() * 3, rng() < 0.7 ? bougB : creamRaw, rng(), 5.6, 0.45);
        if ((i & 31) === 31) await ctx.yield();
      }
      for (let i = 0; i < 150; i++) {
        const z = rng.range(34, 104), sz = rng.range(0.2, 0.34);
        petal(XL + rng.range(-1, 1) * (z < 70 ? 7.8 : 3.7), YL + 5.5, z, rng() * 6.28, sz, rng() * 3, rng() * 3, rng() < 0.45 ? bougB : rng() < 0.5 ? creamRaw : bougA, rng(), 8.4, 0.25);
        if ((i & 31) === 31) await ctx.yield();
      }
      inst(lg.clone(), pet, { PETAL: '', LIT_EDGE: '0.0', NOFF: '0.3' }, { side: THREE.DoubleSide }).name = 'petals';
      const prof = [[0.001, -0.37], [0.105, -0.27], [0.14, -0.18], [0.09, -0.06], [0.001, 0]];
      const gg = new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p[0], p[1])), 4); gg.deleteAttribute('uv');
      const lemA = lemon.clone().multiplyScalar(0.95), lemB = mixc(lemon, ochre, 0.35, 0.95);
      inst(gg, lemonInst.map(([x, y, z, tp]) => { const s = rng.range(0.85, 1.25) * (tp ? 1.25 : 1), tl = tp ? 1.2 : 0.2; return { m: M(x, y, z, rng() * 6.28, s, s, s, rng.range(-tl, tl), rng.range(-tl, tl)), c: rng() < 0.8 ? lemA : lemB, flatCol: 1 }; }), { LEMON: '', LIT_EDGE: '0.1', NOFF: '0.2' }).name = 'lemons';
    }
    await ctx.yield();

    // ---------- bake the town's sun shadow: one depth map, reused every frame
    let shadowRT = null;
    {
      const r = ctx.renderer;
      if (r) {
        shadowRT = new THREE.WebGLRenderTarget(SH_SIZE, SH_SIZE, { depthBuffer: true, generateMipmaps: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
        shadowRT.depthTexture = new THREE.DepthTexture(SH_SIZE, SH_SIZE);
        shadowRT.depthTexture.minFilter = shadowRT.depthTexture.magFilter = THREE.NearestFilter;
        const shCam = new THREE.OrthographicCamera(-SH_E, SH_E, SH_E, -SH_E, 250, 1400), ctr = new THREE.Vector3(-10, 60, 110);
        shCam.position.copy(ctr).addScaledVector(sun, 800);
        shCam.up.set(0, Math.abs(sun.y) > 0.9 ? 0 : 1, Math.abs(sun.y) > 0.9 ? -1 : 0);
        shCam.lookAt(ctr); shCam.updateMatrixWorld(true); shCam.updateProjectionMatrix();
        scene.updateMatrixWorld(true);
        // one group per step, all through the hero's depth-only material (one small program), a frame handed back between groups
        const hb = hero.object.getObjectByName('birds'), bg = scene.background, list = scene.children.filter((o) => o.name !== 'petals'), all = scene.children.slice();
        const vis = all.map((o) => o.visible), hbv = hb ? hb.visible : false;
        if (hb) hb.visible = false;
        scene.background = null; scene.overrideMaterial = hero.depthMaterial || new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide });
        try {
          // the bake's programs (this scene has fog: not the hero's two) are made and waited for before the first strip
          await depthProgramsReady(r, shadowRT, scene, shCam, scene.overrideMaterial, ctx.frame || ctx.yield); await ctx.yield();
          for (let i = 0; i < list.length; i++) {
            for (const o of all) o.visible = o === list[i];
            // each group in six scissor strips, so no single draw fills the whole map in one step
            for (let k = 0; k < 6; k++) {
              const prevRT = r.getRenderTarget(), prevAuto = r.autoClear, y0 = Math.round(SH_SIZE * k / 6), y1 = Math.round(SH_SIZE * (k + 1) / 6);
              try {
                r.autoClear = false;
                if (i === 0 && k === 0) { shadowRT.scissorTest = false; r.setRenderTarget(shadowRT); r.clear(); }
                shadowRT.scissor.set(0, y0, SH_SIZE, y1 - y0); shadowRT.scissorTest = true;
                r.setRenderTarget(shadowRT); r.render(scene, shCam);
              } finally { shadowRT.scissorTest = false; shadowRT.scissor.set(0, 0, SH_SIZE, SH_SIZE); r.setRenderTarget(prevRT); r.autoClear = prevAuto; }
              await ctx.yield();
            }
          }
        } finally {
          if (!hero.depthMaterial) scene.overrideMaterial.dispose();
          scene.overrideMaterial = null; scene.background = bg; all.forEach((o, k) => { o.visible = vis[k]; }); if (hb) hb.visible = hbv;
        }
        U.uShadowMat.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(shCam.projectionMatrix).multiply(shCam.matrixWorldInverse);
        U.uShadowMap.value = shadowRT.depthTexture; U.uUseShadow.value = 1;
      }
    }
    await ctx.yield();

    // cloth is added after the bake (it moves): laundry, bead curtain, tails
    {
      const cg = new THREE.PlaneGeometry(1, 1, 3, 3); cg.translate(0, -0.5, 0); cg.deleteAttribute('uv');
      inst(cg, clothInst, { CLOTH: '', LIT_EDGE: '0.05', NOFF: '0.3' }, { side: THREE.DoubleSide }).name = 'laundry';
    }

    // ---------- sky, far headlands, sea
    const seaFar = C(L.deep).multiply(new THREE.Color(L.tone[0], L.tone[1], L.tone[2])).lerp(hazeCol, L.hazeP[2]);
    const skyU = {
      uZen: { value: C(L.zen) }, uMid: { value: C(L.mid) }, uLow: { value: C(L.low) }, uHazeC: { value: hazeCol.clone().lerp(C('#ffffff'), night ? 0 : 0.35) }, uSun: { value: sun },
      uSunCol: { value: new THREE.Vector3(...L.sunCol) }, uCloud: { value: C(L.cloud) }, uCloudSh: { value: C(L.cloudSh) }, uSea: { value: seaFar }, uTime: U.uTime, uGain: { value: 1 },
      uStars: { value: night ? 1 : 0 }, uCloudAz: { value: vr.range(-0.5, 0.5) }, uClouds: { value: L.clouds }, uRes: U.uRes,
    };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3800, 32, 16), new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false }));
    sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    {
      const mk = (dist, ang, w, hgt, k, flip) => {
        const s = new THREE.Shape(), n = 9, hs = []; let x = -w / 2;
        s.moveTo(x, -20);
        for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, e = Math.sin(Math.PI * Math.pow(flip ? 1 - t : t, 0.75)); hs.push(Math.max(0.08, e * (0.75 + vr() * 0.35)) * hgt); }
        for (let i = 0; i < n; i++) { s.lineTo(x + w / n * 0.34, hs[i]); x += w / n; s.lineTo(x, hs[i]); }   // ledges joined by slopes, not blocks
        s.lineTo(x + w / n * 0.3, -20); s.lineTo(-w / 2, -20);
        const m = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.ShaderMaterial({ uniforms: { uCol: { value: mixc(cobalt, C(L.deep), 0.4).multiply(new THREE.Color(L.tone[0], L.tone[1], L.tone[2])) }, uHaze: { value: hazeCol }, uK: { value: k } }, vertexShader: F_VERT, fragmentShader: HEAD_FRAG, side: THREE.DoubleSide }));
        m.position.set(Math.sin(ang) * dist, 0, Math.cos(ang) * dist); m.rotation.y = ang + Math.PI; scene.add(m);
      };
      mk(1900, -0.95 + vr.range(-0.1, 0.1), 2300, 250, Math.min(0.9, L.hazeP[2] * 0.42), false);
      mk(1560, -0.07, 520, 78, Math.min(0.9, L.hazeP[2] * 0.3), true);                     // an islet on the alley's axis: what the slot of light holds
      mk(3600, 0.85 + vr.range(-0.1, 0.1), 4600, 420, Math.min(0.95, L.hazeP[2] * 0.8), true);
    }
    const boats = [], boatU = [];
    {
      const br = rng.fork('boats'), prim = [C('#D8362E'), mixc(cobalt, creamRaw, 0.05), C('#E9B429'), C('#2E9A5E'), creamRaw.clone().multiplyScalar(0.96), mixc(teal, creamRaw, 0.1), C('#D8362E'), mixc(cobalt, creamRaw, 0.05)];
      const wind = br.range(-0.6, 0.6);
      for (let i = 0, guard = 0; i < 24 && guard < 800; guard++) {
        const held = i < 6, nearAxis = i < 14;                                           // six moored right beside the glide, hull and shadow both in frame
        const x = held ? (i % 2 ? 1 : -1) * br.range(7.6, 11) : nearAxis ? br.sign() * br.range(12, 36) : br.range(-120, 125), z = held ? 182 + i * 13 + br.range(-3, 3) : br.range(162, 278);
        if (Math.abs(x) < 5.4 || (x < 12 && z > 268) || landH(x, z) > -5.5) continue;
        if (!held && boats.some((b) => Math.hypot(b.x - x, b.z - z) < 12)) continue;
        const a = (held ? br.range(-0.35, 0.35) : wind + br.range(-0.5, 0.5)) + (br.chance(0.5) ? Math.PI : 0), s = held ? br.range(1.05, 1.35) : br.range(1.25, 1.9);
        boats.push({ x, z, a, s, c: prim[i % prim.length] }); i++;
      }
      for (const b of moored) b.c = prim[(b.k * prim.length) | 0];                        // the mole's berths: a colour from the same palette, on the pier's own draw
      for (let i = 0; i < SEA_BOATS; i++) { const b = i < 24 ? boats[i] : moored[i - 24]; boatU.push(b ? new THREE.Vector4(b.x, b.z, b.a, b.s) : new THREE.Vector4(0, -9999, 0, 0.01)); }
    }
    const seaU = {
      uBoats: { value: boatU }, uSun: { value: sun }, uSand: { value: C(L.sand) }, uRock: { value: mixc(C(L.sand), C('#3D6E7A'), 0.3) }, uShallow: { value: C(L.shallow) }, uDeep: { value: C(L.deep) }, uDeep2: { value: C(L.deep2) },
      uHaze: U.uHaze, uHazeP: U.uHazeP, uTone: U.uTone, uOcto: { value: new THREE.Vector3(30, 200, 0) }, uTime: U.uTime, uGlint: { value: L.glint }, uGain: U.uGain, uRes: U.uRes,
    };
    {
      const sg = new THREE.PlaneGeometry(14000, 14000); sg.rotateX(-Math.PI / 2);
      const sea = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: seaU, vertexShader: F_VERT, fragmentShader: SEA_FRAG })); sea.name = 'sea'; sea.frustumCulled = false; scene.add(sea);
    }
    await ctx.yield();

    // ---------- boats at anchor (their shadows are drawn on the sand by the sea shader), things that sail
    const grab = () => { const g = mergeGeometries(parts, false); for (const p of parts) p.dispose(); parts.length = 0; return g; };
    const WHITE = new THREE.Color(1, 1, 1);
    {
      const hs = new THREE.Shape(); hs.moveTo(-1.1, -2.6); hs.lineTo(1.1, -2.6); hs.quadraticCurveTo(1.3, 0.6, 0, 3.3); hs.quadraticCurveTo(-1.3, 0.6, -1.1, -2.6);
      const mkHull = () => {
        const hg = new THREE.ExtrudeGeometry(hs, { depth: 0.95, bevelEnabled: false, curveSegments: 6, steps: 2 }); hg.rotateX(Math.PI / 2); hg.translate(0, 0.6, 0);
        const hp = hg.attributes.position;                                                // sheer: bow and stern lift, the keel tucks in
        for (let k = 0; k < hp.count; k++) { const y = hp.getY(k), z = hp.getZ(k), t = z / 3.3; hp.setY(k, y + t * t * (z > 0 ? 0.62 : 0.3)); if (y < 0.2) { hp.setX(k, hp.getX(k) * (y < -0.2 ? 0.5 : 0.84)); hp.setZ(k, z * (y < -0.2 ? 0.84 : 0.95)); } }
        put(hg, WHITE, null, true);
      };
      mkHull();
      const wood = new THREE.Color(0.86, 0.8, 0.66), brown = new THREE.Color(0.5, 0.36, 0.25), wh = new THREE.Color(0.93, 0.91, 0.84), glass = new THREE.Color(0.16, 0.24, 0.36);
      box(1.7, 0.06, 4.2, wood, 0, 0.66, -0.2); box(1.9, 0.1, 0.3, brown, 0, 0.74, 0.7); box(1.3, 0.1, 0.3, brown, 0, 0.92, 2.0);
      box(1.15, 0.95, 1.2, wh, 0, 1.15, -1.5); box(1.19, 0.3, 1.24, glass, 0, 1.3, -1.5); box(1.4, 0.08, 1.5, WHITE, 0, 1.66, -1.5);      // wheelhouse, window band, roof in the boat's colour
      for (const [px, pz] of [[-0.78, -0.6], [0.78, -0.6], [-0.78, 1.1], [0.78, 1.1]]) box(0.06, 1.0, 0.06, brown, px, 1.2, pz);
      for (let k = 0; k < 5; k++) box(0.34, 0.06, 1.9, k % 2 ? wh : new THREE.Color(0.86, 0.36, 0.26), -0.68 + k * 0.34, 1.72 + (k === 2 ? 0.03 : 0), 0.25);   // striped awning
      cyl(0.045, 0.06, 1.7, 5, brown, 0, 1.9, 2.3);
      { const pn = new THREE.BufferGeometry(); pn.setAttribute('position', new THREE.Float32BufferAttribute([0, 2.75, 2.3, 0, 2.4, 2.3, 0, 2.58, 1.6, 0, 2.4, 2.3, 0, 2.75, 2.3, 0, 2.58, 1.6], 3)); pn.computeVertexNormals(); put(pn, new THREE.Color(0.9, 0.3, 0.22)); }
      const bgeo = grab();
      inst(bgeo, boats.concat(moored).map((b) => ({ m: M(b.x, 0, b.z, b.a, b.s, b.s, b.s), c: b.c, flatCol: 1, r: b.r })), { BOAT: '' }, { vertexColors: true }).name = 'boats';
      const movers = [];
      if (regatta) {
        mkHull();
        const sail = new THREE.BufferGeometry(); sail.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.7, -1.4, 0, 0.7, 2.0, 0, 7.5, -1.0, 0, 0.7, 2.0, 0, 0.7, -1.4, 0, 7.5, -1.0, 0, 0.9, 2.2, 0, 0.9, 3.4, 0, 5.2, 2.2, 0, 0.9, 3.4, 0, 0.9, 2.2, 0, 5.2, 2.2], 3)); sail.computeVertexNormals();
        put(sail, new THREE.Color(0.96, 0.95, 0.9));
        const hd = vr.range(1.2, 1.9) * vr.sign();
        for (let i = 0; i < 16; i++) movers.push({ m: M(vr.range(-500, 500), 0, vr.range(560, 900), hd + vr.range(-0.08, 0.08), 2.2, 2.2, 2.2), c: creamRaw, flatCol: 1, r: [vr(), 640, vr.range(1.2, 1.7), 0] });
        inst(grab(), movers, { BOAT: '', MOVER: '' }, { vertexColors: true }).name = 'regatta';
      }
      if (lookId === 'morning') {                                                         // the fishing boats heading out
        const out = [];
        for (let i = 0; i < 8; i++) out.push({ m: M(vr.range(60, 150), 0, 640, vr.range(-0.1, 0.35), 1.5, 1.5, 1.5), c: boats[i % boats.length]?.c || coral, flatCol: 1, r: [i / 8 + vr() * 0.08, 500, vr.range(2.6, 3.6), 0] });
        inst(bgeo.clone(), out, { BOAT: '', MOVER: '' }, { vertexColors: true }).name = 'fishing-fleet';
      }
    }
    // the ferry and its curved wake
    let ferry = null, wakeU = null; const FC = [150, 2360], FR = 1650;     // it passes 300 m beyond the arch
    if (!regatta) {
      const fw = creamRaw.clone().multiplyScalar(0.97);
      box(9, 3.4, 38, fw, 0, 1.2, 0); box(9.1, 0.7, 38.1, mixc(cobalt, creamRaw, 0.1, 0.8), 0, 0.5, 0); box(7.4, 2.4, 26, fw, 0, 4.1, -2); box(6, 2.2, 7, fw, 0, 6.4, 5);
      box(7.5, 0.5, 26.2, mixc(cobalt, violet, 0.3, 0.6), 0, 4.3, -2); cyl(1.2, 1.4, 3.4, 10, coral, 0, 7.2, -6);
      ferry = new THREE.Mesh(grab(), pmV); ferry.name = 'ferry'; ferry.scale.setScalar(2.1); ferry.frustumCulled = false; scene.add(ferry);
      const wp = [], wi = [], a0 = -Math.PI / 2 - 1.3, N = 90;
      for (let i = 0; i <= N; i++) { const a = a0 + (i / N) * 1.9; for (const r of [FR - 150, FR + 150]) wp.push(FC[0] + Math.cos(a) * r, 0.1, FC[1] + Math.sin(a) * r); if (i < N) { const k = i * 2; wi.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setIndex(wi);
      wakeU = { uAng: { value: 0 }, uR: { value: FR }, uCenter: { value: new THREE.Vector2(FC[0], FC[1]) }, uCol: { value: mixc(creamRaw, C(L.deep), L.hazeP[2] * 0.35).multiply(new THREE.Color(L.tone[0], L.tone[1], L.tone[2])) } };
      const wake = new THREE.Mesh(wg, new THREE.ShaderMaterial({ uniforms: wakeU, vertexShader: F_VERT, fragmentShader: WAKE_FRAG, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 }));
      wake.frustumCulled = false; wake.renderOrder = 1; scene.add(wake);
    }

    // ---------- birds: swifts with the plane, over the harbour and the town; gulls on the breakwater
    const birdU = { uTime: U.uTime, uCamZ: { value: -1e4 }, uAll: { value: rare ? 1 : 0 }, uComp: { value: 0 }, uLead: { value: new THREE.Vector3() }, uLeadF: { value: new THREE.Vector3(0, 0, 1) }, uTone: U.uTone };
    {
      const bg = new THREE.InstancedBufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute([
        0, 0, 0.28, 0.85, 0, -0.22, 0.05, 0, -0.12, 0, 0, 0.28, -0.05, 0, -0.12, -0.85, 0, -0.22,
        0, 0, 0.5, 0.1, 0, -0.1, -0.1, 0, -0.1, 0.1, 0, -0.1, 0, 0, -0.55, -0.1, 0, -0.1,
        0, 0.02, 0.42, 0, 0.2, 0.05, 0, 0.02, -0.4], 3));
      const a = [], b = [], c = [], br = rng.fork('birds'), sw = mixc(violet, cobalt, 0.1, 0.55), gullC = creamRaw.clone().multiplyScalar(0.98);
      const nComp = Math.round(46 * density * detail);
      for (let i = 0; i < nComp; i++) { a.push(br.sign() * br.range(5, 14), br.range(-3, 5), br.range(0, 30), 1); b.push(0, br() * 6.28, 1, br()); c.push(sw.r, sw.g, sw.b, 0.75); }
      for (let i = 0; i < Math.round(70 * detail); i++) { a.push(br.range(-25, 25), 11.5, 215 + br.range(-20, 20), 0); b.push(br.range(18, 85), br() * 6.28, br.range(0.25, 0.5) * (br() < 0.8 ? 1 : -1), br()); c.push(sw.r, sw.g, sw.b, 0.85); }
      for (let i = 0; i < Math.round(70 * detail); i++) { a.push(DX + br.range(-10, 10), br.range(70, 120), HC + br.range(-10, 10), 0); b.push(br.range(28, 80), br() * 6.28, br.range(0.2, 0.42) * (br() < 0.8 ? 1 : -1), br()); c.push(sw.r, sw.g, sw.b, 1); }
      for (let i = 0; i < 26; i++) { a.push(XL + br.range(-3, 3), YL + br.range(0, 6), 128 + br.range(-4, 4), 0); b.push(br.range(7, 20), br() * 6.28, br.range(0.5, 0.9) * (br() < 0.8 ? 1 : -1), br()); c.push(sw.r, sw.g, sw.b, 0.9); }
      const flock = (r, px, py, pz) => { for (let i = 0; i < Math.round(45 * detail); i++) {
        a.push(px + r.range(-6, 6), py + r.range(-4, 8), pz + r.range(-6, 6), 0); b.push(r.range(10, 46), r() * 6.28, r.range(0.35, 0.7) * (r() < 0.8 ? 1 : -1), r()); c.push(sw.r, sw.g, sw.b, 1.1);
      } };
      for (const [px, py, pz] of [[60, 46, 95], [-52, 70, 30], [10, 82, -62], [112, 74, 40]]) flock(br, px, py, pz);
      // the gulls standing on the mole close the 'birds' stream, so they are dealt the same whatever else flies
      for (let i = 0; i < 28; i++) { const z = lerp(336, ZA - 8, (i + br()) / 28); a.push(br.sign() * 1.9, BWY + 0.22, z, 2); b.push(br.range(8, 22), br() * 6.28, br.sign() * br.range(0.8, 1.3), br()); c.push(gullC.r, gullC.g, gullC.b, 2); }
      // more swifts over the east slope and the west wall town, and the rare wheel, from a stream of their own
      const fk = ctx.core.makeRng(ctx.seed + ':lc-flocks');
      for (const [px, py, pz] of [[-140, 105, 70], [150, 92, 60]]) flock(fk, px, py, pz);
      if (rare) for (let i = 0; i < 450; i++) {                                          // they wheel round the town and the dome, not over the water
        const gl = fk() < 0.25; a.push(DX + fk.range(-12, 12), fk.range(66, 140), 60 + fk.range(-12, 12), 0);
        b.push(fk.range(22, 92), fk() * 6.28, fk.range(0.16, 0.4) * (fk() < 0.85 ? 1 : -1), fk()); const k = gl ? gullC : fk() < 0.3 ? mixc(creamRaw, violet, 0.3, 0.8) : sw; c.push(k.r, k.g, k.b, gl ? 2 : 1.1);
      }
      bg.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(a), 4)); bg.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(b), 4)); bg.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(c), 4));
      bg.instanceCount = a.length / 4;
      const birds = new THREE.Mesh(bg, new THREE.ShaderMaterial({ uniforms: birdU, vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, side: THREE.DoubleSide })); birds.frustumCulled = false; birds.name = 'swifts-gulls'; scene.add(birds);
    }

    // ---------- funicular cars, the van (or wedding car), dust, the falling lemon, bulbs, bells
    const cars = [];
    for (let k = 0; k < 2; k++) {
      for (let i = -1; i <= 1; i++) { const y = 1.55 + i * 2.5, z = i * 3.0; box(2.3, 2.4, 3.0, mixc(cobalt, creamRaw, 0.05, 0.9), 0, y, z); box(2.36, 0.8, 2.3, mixc(creamRaw, cobalt, 0.3, 0.9), 0, y + 0.35, z); box(2.5, 0.2, 3.2, cream, 0, y + 1.3, z); }
      const m = new THREE.Mesh(grab(), pmV); m.rotation.y = fRy; m.frustumCulled = false; scene.add(m); cars.push(m);
    }
    for (let b = 0; b < 3; b++) box(0.2, 0.8, 0.03, cream, Math.sin(b * 2.094) * 0.45, Math.cos(b * 2.094) * 0.45, 0, 0, 0, -b * 2.094);
    cyl(0.12, 0.12, 0.08, 8, dark, 0, 0, 0);
    const fan = new THREE.Mesh(grab(), pmV); fan.position.set(fanAt.x - 0.06, fanAt.y + 0.2, fanAt.z); fan.name = 'fan'; scene.add(fan);
    const radio = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.5, 0.25), fog: false }));
    radio.position.set(fanAt.x + 0.12, fanAt.y - 1.1, fanAt.z + 0.6); scene.add(radio);
    const thB = 280 * DEG, uCross = uOf(lerp(-3, DX, 0.7) - 95 * Math.sin(thB), HC - 95 * Math.cos(thB));
    const carPhase = Math.PI / 2 - Math.PI * 2 * (1.5 * uCross + 0.004 * uCross * 50);
    let roadLen = 0; const roadD = [0];
    for (let k = 0; k < road.length - 1; k++) { roadLen += Math.hypot(road[k + 1][0] - road[k][0], road[k + 1][1] - road[k][1], road[k + 1][2] - road[k][2]); roadD.push(roadLen); }
    const vanAt = (t, out) => {
      const cyc = (t * 8.5 / roadLen) % 2, up = cyc < 1, d = (up ? cyc : 2 - cyc) * roadLen; let k = 0;
      while (k < road.length - 2 && roadD[k + 1] < d) k++;
      const f = (d - roadD[k]) / (roadD[k + 1] - roadD[k]), a = road[k], b = road[k + 1];
      out.set(lerp(a[0], b[0], f), lerp(a[1], b[1], f) + 0.1, lerp(a[2], b[2], f));
      out.ry = Math.atan2(b[0] - a[0], b[2] - a[2]) + (up ? 0 : Math.PI); out.corner = Math.max(0, 1 - Math.min(f, 1 - f) * (roadD[k + 1] - roadD[k]) / 14);
      return out;
    };
    {
      const vc = wedding ? creamRaw.clone().multiplyScalar(0.97) : vr.pick([mixc(teal, creamRaw, 0.25), coral, mixc(cobalt, creamRaw, 0.3)]);
      box(1.5, 1.2, 1.9, vc, 0, 1.15, -0.5); box(1.3, 1.0, 1.0, vc, 0, 1.0, 1.0); box(1.2, 0.5, 0.06, dark, 0, 1.25, 1.52); box(1.56, 0.12, 2.0, cream, 0, 1.8, -0.5);
      for (const [wx, wz] of [[-0.7, -0.9], [0.7, -0.9], [0, 1.2]]) put(new THREE.CylinderGeometry(0.32, 0.32, 0.18, 10), dark, M(wx, 0.32, wz, 0, 1, 1, 1, 0, Math.PI / 2));
      if (wedding) for (let i = 0; i < 5; i++) box(0.09, 0.02, 2.6 + i * 0.3, i % 2 ? creamRaw : coral, (i - 2) * 0.3, 1.5 - i * 0.03, -2.8 - i * 0.15, (i - 2) * 0.08, 0.12);
    }
    const van = new THREE.Mesh(grab(), pmV); van.scale.setScalar(1.5); van.frustumCulled = false; scene.add(van);
    const dustGeo = new THREE.IcosahedronGeometry(1, 1); dustGeo.deleteAttribute('uv'); dustGeo.computeVertexNormals();
    const dust = inst(dustGeo, new Array(6).fill(0).map(() => ({ m: new THREE.Matrix4(), c: mixc(creamRaw, ochre, 0.35, 0.9), flatCol: 1 })), { BLOB: '', LIT_EDGE: '0.2' });
    put(new THREE.LatheGeometry([[0.001, -0.37], [0.105, -0.27], [0.14, -0.18], [0.11, -0.085], [0.001, 0]].map((p) => new THREE.Vector2(p[0], p[1])), 6), lemon.clone().multiplyScalar(0.95), M(0, 0.18, 0));
    const dropLemon = new THREE.Mesh(grab(), pmV); dropLemon.scale.setScalar(1.5); scene.add(dropLemon);
    const bells = [];
    if (rare) for (const sz of [-1, 1]) {
      put(new THREE.LatheGeometry([[1.25, -2.6], [1.0, -2.4], [0.72, -1.6], [0.55, -0.8], [0.1, -0.6], [0.1, 0]].map((p) => new THREE.Vector2(p[0], p[1])), 12), mixc(ochre, lemon, 0.3, 0.95));
      const m = new THREE.Mesh(grab(), pmV); m.position.set(A.campanileTop.x, H0 + A.campanileTop.y - 14.6, A.campanileTop.z + sz * 3.9); scene.add(m); bells.push(m);
    }
    if (night) {
      const bp = [], cat3 = (ax, ay, az2, bx, by, bz, n, sag) => { for (let i = 0; i <= n; i++) { const t = i / n; bp.push([lerp(ax, bx, t), lerp(ay, by, t) - sag * 4 * t * (1 - t), lerp(az2, bz, t)]); } };
      const tx = A.campanileTop.x, tz = A.campanileTop.z, PZ = H0 + 16;
      for (const [x, z] of [[-28, 29], [-9, 29], [9, 29], [28, 29], [-side * 20, 12]]) cat3(tx - side * 3.4, PZ + 13, tz + 2, x, PZ + 4.2, z, 16, 2.2);
      cat3(-72, QY + 4.2, 151, 72, QY + 4.2, 151, 40, 0); for (let k = 0; k < 6; k++) cat3(-70 + k * 24, QY + 4.2, 151, -46 + k * 24, QY + 4.2, 151, 0, 0);
      for (let k = 0; k < 10; k++) { const zc = S0 + (k + 0.5) * (S1 - S0) / 10; cat3(-4.6, treadY(zc) + 5.6, zc, 4.6, treadY(zc) + 5.6, zc, 6, 0.3); }
      for (let z = 300; z < ZA; z += 8) for (const x of [-2.6, 2.6]) bp.push([x, BWY + 1.6, z]);
      const bm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.17, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 4, 1.6), fog: false }), bp.length);
      bp.forEach((p, i) => bm.setMatrixAt(i, M(p[0], p[1], p[2]))); bm.frustumCulled = false; scene.add(bm);
    }
    await ctx.yield();

    // ---------- flight direction, post, per-frame life
    const duration = 50, len = path.length;
    const domeW = A.domeCenter.clone().add(hero.object.position);
    const uC270 = uOf(EC[0] + 60, EC[1]);
    // the pass of the tiles, one rule in metres along the path (the path's own length turns metres into u). The gaze holds the
    // dome until the plane is one dome radius (12 m) past its closest point to the tiles, then swings to the cove over the next
    // HAND metres, rests there COVE metres and lets go over HAND again. It comes onto the dome over the same HAND metres.
    // The piazza, the tower and the pigeons are watched from the moment the pigeons leave the paving until that swing is
    // done (72 m past the closest point), the look coming and going over the first and last 30 % of that stretch
    const HAND = 60, COVE = 30, uBurst = uDome - 0.035, uSeen = uDome - 0.17;
    const uHold = uDome + A.domeRadius / len, uSwung = uHold + HAND / len;
    const pois = [
      { at: [40, 0, 165], from: uExit + 0.002, to: uExit + 0.14, weight: 0.62 },
      { at: domeW, from: uSeen, to: uSwung, fade: (uSwung - uHold) / (uSwung - uSeen), weight: 0.7 },
      { at: [A.piazza.x, H0 + A.piazza.y - 6, A.piazza.z], from: uBurst, to: uSwung, fade: 0.3, weight: 0.3 },
      { at: [-70, 10, 190], from: uHold, to: uSwung + (COVE + HAND) / len, fade: HAND / (2 * HAND + COVE), weight: 0.5 },
      { at: (time, u) => path.posAtDist(Math.min(u, uBoats) * len + 34, boatLook).setY(-7), from: uQuay - 0.012, to: uBoats, weight: 0.5 },
      { at: [domeW.x, domeW.y - 6, domeW.z], from: uC270 - 0.02, to: uC270 + 0.09, weight: 0.5 },
    ];
    const boatLook = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), tmpV = new THREE.Vector3(), m4 = new THREE.Matrix4(), size = new THREE.Vector2();
    const baseGain = L.gain;
    // the ferry keeps the world clock: a steady 0.0065 rad/s round its circle (about 10.7 m/s), from a seeded place on the first
    // part of its run, which leaves it a flight's worth of sea ahead before it takes the run from the start again
    const FERRY_W = 0.0065, ferryPhase = ctx.core.makeRng(ctx.seed + ':lc-ferry').range(0, 0.9 - FERRY_W * duration);
    return {
      scene, path, duration,
      title: lookId === 'evening' ? 'The Lemon Cliffs, Blue Hour' : lookId === 'morning' ? 'The Lemon Cliffs, Early' : lookId === 'scirocco' ? 'The Lemon Cliffs, Scirocco' : 'The Lemon Cliffs',
      ride: 'paper-plane', style: 'none',
      camera: { fov: 64, near: 0.3, far: 6000, lookAhead: 24, sway: 0.8, bank: 1.3 },
      pois,
      portal: { shape: 'circle', radius: 7, color: night ? '#FFD9A0' : '#BDF2E6', glow: 1.4, revealDistance: 460 },
      post: {
        exposure: L.exposure,
        bloom: { strength: night ? 0.5 : 0.32, radius: 0.5, threshold: night ? 0.9 : 1.0 },
        grade: { saturation: 1.14, contrast: 1.05, tint: '#ffffff', shadowTint: '#0a0818', vignette: 0.18, grain: 0.035, aberration: 0 },
      },
      update(dt, time, camera, u) {
        U.uTime.value = time; if (hero.uniforms.uCloudT) hero.uniforms.uCloudT.value = time;
        ctx.renderer?.getDrawingBufferSize(size); if (size.y > 0) U.uRes.value.copy(size);
        sky.position.setFromMatrixPosition(camera.matrixWorld);
        // the white flare as the plane bursts out of the alley, then the exposure settles
        const fl = sstep(uExit - 0.008, uExit + 0.003, u) * (1 - sstep(uExit + 0.006, uExit + 0.04, u));
        U.uGain.value = baseGain * (1 + 1.5 * fl); hero.uniforms.uGain.value = baseGain * (1 + 1.5 * fl); skyU.uGain.value = 1 + 0.9 * fl;
        hero.update(dt, time, camera);
        hero.setProgress(rare ? Math.max(0.35, Math.min(1, (u - (uDome - 0.2)) / 0.2)) : (u - uBurst) / 0.06);
        // the swift party flying formation with the plane
        path.posAtDist(u * len + 13, tmp); path.tangentAtDist(u * len + 13, tmp2);
        birdU.uLead.value.copy(tmp); birdU.uLeadF.value.copy(tmp2);
        birdU.uComp.value = sstep(uExit + 0.004, uExit + 0.04, u) * (1 - sstep(uStair - 0.075, uStair - 0.035, u)) + sstep(uQuay, uQuay + 0.03, u);
        birdU.uCamZ.value = u > uStair ? path.pointAt(u, tmp).z : -1e4;
        // funicular: the two cars pass mid-slope as the plane comes round
        const s = 0.5 - 0.5 * Math.cos(Math.PI * 2 * (1.5 * u + 0.004 * time) + carPhase);
        fAt(0.03 + 0.94 * s, -1.45, cars[0].position); fAt(0.03 + 0.94 * (1 - s), 1.45, cars[1].position);
        // the van buzzing up the hairpins, dust at each corner
        vanAt(time, tmpV); van.position.copy(tmpV); van.rotation.y = tmpV.ry;
        for (let i = 0; i < 6; i++) {
          vanAt(time - 0.25 - i * 0.3, tmpV); const sc = (0.5 + i * 0.32) * (0.35 + 1.4 * tmpV.corner);
          dust.setMatrixAt(i, m4.makeScale(sc, sc * 0.7, sc).setPosition(tmpV.x, tmpV.y + 0.4 + i * 0.25, tmpV.z));
        }
        dust.instanceMatrix.needsUpdate = true;
        if (ferry) {
          const a = -Math.PI / 2 - 0.45 + ((time * FERRY_W + ferryPhase) % 0.9);          // it meets the plane when it meets it
          ferry.position.set(FC[0] + Math.cos(a) * FR, Math.sin(time * 0.6) * 0.15, FC[1] + Math.sin(a) * FR); ferry.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a));
          wakeU.uAng.value = a - 0.012;
        }
        seaU.uOcto.value.set(30 + Math.sin(time * 0.05) * 35, 215 + Math.cos(time * 0.07) * 25, 0);
        // one lemon drops from the pergola and bounces down the steps as the plane arrives
        const tl = u > uStair - 0.03 && u < uQuay ? (u - uStair + 0.03) * duration : time % 7;
        const z0 = S0 + 9, tb = Math.max(0, tl - 0.8), lz = Math.min(S1 + 3, z0 + tb * 6.5);
        const ly = tl < 0.8 ? treadY(z0) + 5.6 - (5.4 * tl * tl) / 0.64 : treadY(lz) + 0.15 + Math.abs(Math.sin(tb * 6.5)) * 1.0 * Math.exp(-tb * 0.3);
        dropLemon.position.set(1.6 + Math.sin(tb * 1.3) * 0.8, ly, lz); dropLemon.rotation.set(tb * 7, 0, tb * 3);
        fan.rotation.set(0, Math.PI / 2, time * 5.5); radio.scale.setScalar(0.6 + 0.4 * Math.sin(time * 3.1));
        U.uFoot.value = 1 - 0.85 * sstep(uQuay - 0.05, uQuay + 0.03, u);
        for (let i = 0; i < bells.length; i++) bells[i].rotation.x = Math.sin(time * 2.3 + i * 1.4) * 0.75;
      },
      dispose() {
        hero.dispose?.();
        if (shadowRT) { shadowRT.depthTexture?.dispose(); shadowRT.dispose(); shadowRT = null; }
      },
    };
  },
};
