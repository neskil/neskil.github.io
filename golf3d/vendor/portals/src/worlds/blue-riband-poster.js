// THE BLUE RIBAND: an art-deco travel poster come alive (pochoir and airbrush, five inks, no lighting).
// Everything is drawn by the hero's one unlit "inkFill" shader (src/parts/blue-riband-poster.js) or by the two
// full-surface shaders here (sky dome, sea plane) that follow the same rules: flat inks in posterised steps,
// stipple only at the step edges, re-dealt three times a second. The world returns style 'none'.
//
// COORDINATES. The liner is the fixed frame at the origin, unrotated, so world space == the hero's local space:
// x = p (metres to port), y = h, z = 155 - s (s = metres aft of the stem). The camera flies aft, toward -Z, with
// the liner on its left; the sea scrolls aft under it. SHIP(s, p, h) converts.
//
// MAP OF THIS FILE, in order
//   1. constants, WB (InkBuilder with an extra aAux attribute), small modelling helpers
//   2. MOODS: the seeded looks (inks, sky bands, sun, weather, cast) and pickMood()
//   3. sky dome shader (bands by elevation, sun or moon, wheeling ray fan, stars; below the horizon it ray-casts the
//      same sea as the plane, which is what shows where a portal's clip plane cuts the plane away)        makeSky()
//   4. sea: SEA_GLSL (scallop frieze, fwidth LOD to flat bands, stepped haze), the plane, and two camera-wrapped
//      rings of standing scallops cleared round hulls, wake and the portal's calm disc                    makeSea()
//   5. SET_MOTION: the vertex modes shared by all set dressing (nod, propellers, puffs, arcs, fans, discs)
//   6. builders: boat hulls (tug, fireboat, yacht), aircraft (flying boat, biplane), airship, clouds and bank,
//      portal frame and calm disc, fire arcs, wake, fog sheets, rain, searchlights, gulls, dolphins
//   7. build(ctx): mood -> hero -> path -> sky and sea -> set dressing -> cast -> return
//
// WHERE THINGS ARE SET
//   path           build(): makePath(hero.anchors.flyThrough) (17 points, ship coordinates, 620 m, 40 s)
//   pois           build(), in the returned object: bow medallion 0-0.2, dolphins 0.235-0.3, funnel 2 top 0.4-0.55,
//                  the aircraft 0.5-0.608 (biplanes 0.49-0.58), the stern cascade's taffrail 0.6-0.72, portal 0.7-1
//   hero placement origin, identity; opts (livery, funnels, streamers, night) come from the mood and cast seeds
//   seeded moods   moodTable() and pickMood(): hour (morning | golden | night gala) x weather (clear | fog sheets | rain)
//                  x cast (black or cream livery, 2 or 3 funnels, tugs or yachts, flying boat or biplanes), all from
//                  ctx.rng.fork('weather'); ctx.vary.hour overrides the hour, vary.density the streamers, rain and fog
//                  counts, vary.rare stages the airship and its shadow
//   exposure, bloom, grade   the `post` literal at the end of build(): flat 1 (no tone map: the five inks show as the
//                  brief's hexes), bloom 0, no vignette or grain. There is no scene fog: depth is the ink style's
//                  stepped haze (style.uniforms.uHaze / uHazeP, set in build() from the mood)
//   scripted moments (all keyed to u):
//     gulls        uniform uU on the gull material: 20 scripted birds pass the lens at u 0.075, 0.15, 0.375, 0.66
//     dolphins     uniform uU on the dolphin material: six leaps staggered as the camera comes up on each (u 0.21-0.31)
//     portholes    the hero lights them itself from the camera's position
//     whistle      uniform uWhistle on the set material (plumes at u 0.4875 and 0.525)
//     aircraft     CPU: airAt(time, u) places the group on a straight line by u; the flying boat is overhead at
//                  u 0.602, 9 m above the path (U_AIR, V_AIR, airP1), the biplanes at u 0.575
//     funnels      at the entry the hero looms them (taller, wider, stepped out to the right of the bow): see the
//                  hero's HOOKS; buildClouds keeps cream stacks out of the azimuth behind them
//   ambient loops use time: sea scroll (uScroll), ray fan (uTime in the sky), smoke, arcs, wake, clouds, nodding.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, InkBuilder, inkGeometry, INK, BRIEF_PALETTE, shipToLocal } from '../parts/blue-riband-poster.js';

const { NAVY, TEAL, CREAM, GOLD, VERM } = INK;
const PI = Math.PI, TAU = PI * 2, D2R = PI / 180, HALF = 155;
const SHIP = (s, p, h) => shipToLocal(s, p, h);

// ---------------------------------------------------------------- 1. builder with an aux attribute
// aAux = (pivot.xyz in the mesh's object space, mode + fraction). Modes are listed at SET_MOTION.
class WB extends InkBuilder {
  constructor() { super(); this.X = []; this.aux = [0, 0, 0, 0]; }
  v(s, p, h, g, a, b, w = 0) { super.v(s, p, h, g, a, b, w); this.X.push(this.aux[0], this.aux[1], this.aux[2], this.aux[3]); }
  // pivot given in the same (s, p, h) space as the vertices (after T)
  mode(k, s = 0, p = 0, h = 0, frac = 0) {
    if (this.T) { const q = this.T(s, p, h); s = q[0]; p = q[1]; h = q[2]; }
    this.aux = [p, h, HALF - s, k + clamp(frac, 0, 0.99)];
  }
}
function wbGeometry(b) {
  const geo = inkGeometry(b);
  geo.setAttribute('aAux', new THREE.BufferAttribute(new Float32Array(b.X), 4));
  return geo;
}
// place builder-local (ls aft, lp port, lh up) at ship (s0, p0, h0), turned by yaw (radians, about the vertical)
const placeT = (s0, p0, h0 = 0, yaw = 0, sc = 1) => { const c = Math.cos(yaw), n = Math.sin(yaw); return (s, p, h) => [s0 + (s * c - p * n) * sc, p0 + (s * n + p * c) * sc, h0 + h * sc]; };
// object-space builder: local origin lands on the mesh origin, bow / nose to +Z
const objT = (off = 0) => (s, p, h) => [HALF + s - off, p, h];

function tubeW(m, pts, radii, n, a, b, o = {}) {
  const g0 = o.g0 ?? 0.15, gr = o.gr ?? 0.6, a0 = o.a0 ?? 0, rings = [], B = o.B || [0, 1, 0];
  for (let i = 0; i < pts.length; i++) {
    const q = pts[Math.min(i + 1, pts.length - 1)], r = pts[Math.max(i - 1, 0)];
    let tx = q[0] - r[0], ty = q[1] - r[1], tz = q[2] - r[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    let nx = ty * B[2] - tz * B[1], ny = tz * B[0] - tx * B[2], nz = tx * B[1] - ty * B[0]; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
    const R = typeof radii === 'number' ? radii : radii[i], ring = [];
    for (let j = 0; j < n; j++) {
      const an = (j / n) * TAU, c = Math.cos(an) * R, s = Math.sin(an) * R * (o.flat ?? 1);
      ring.push([pts[i][0] + nx * c + bx * s, pts[i][1] + ny * c + by * s, pts[i][2] + nz * c + bz * s, g0 + gr * (0.5 + 0.5 * Math.cos(an - a0)) + (o.gl ?? 0) * (i / Math.max(1, pts.length - 1))]);
    }
    rings.push(ring);
  }
  m.loft(rings, a, b);
  if (o.cap) { const L = pts.length - 1; m.fan([pts[L][0], pts[L][1], pts[L][2], o.capG ?? g0], rings[L], o.capA ?? a, o.capB ?? b); }
  if (o.cap0) m.fan([pts[0][0], pts[0][1], pts[0][2], o.capG ?? g0], rings[0], o.capA ?? a, o.capB ?? b);
  return rings;
}
// upright lozenge window on a wall running along unit tangent t (in s, p)
function lozW(m, c, t, w, hh, a, b, g0 = 0.02, g1 = 0.5, glow = 0) {
  const P = (u, v) => [c[0] + t[0] * u, c[1] + t[1] * u, c[2] + v, lerp(g0, g1, v / hh + 0.5)];
  const p0 = P(-w / 2, 0), p1 = P(-w / 4, hh / 2), p2 = P(w / 4, hh / 2), p3 = P(w / 2, 0), p4 = P(w / 4, -hh / 2), p5 = P(-w / 4, -hh / 2);
  m.tri(p0, p1, p2, a, b, glow); m.tri(p0, p2, p3, a, b, glow); m.tri(p0, p3, p4, a, b, glow); m.tri(p0, p4, p5, a, b, glow);
}
// a standing scallop fan: centre c = [s, p, h], width along (ts, tp), height H; rim cream foam
function scallopW(m, c, ts, tp, W, H, a, b, lean = 0, segs = 8, foam = CREAM) {
  const rim = [], rim2 = [];
  for (let j = 0; j <= segs; j++) {
    const an = (j / segs) * PI, x = Math.cos(an) * W * 0.5, y = Math.sin(an) * H;
    rim.push([c[0] + ts * x * 0.84 - tp * lean * y, c[1] + tp * x * 0.84 + ts * lean * y, c[2] + y * 0.84, 0.95]);
    rim2.push([c[0] + ts * x - tp * lean * y * 1.15, c[1] + tp * x + ts * lean * y * 1.15, c[2] + y, 0.9]);
  }
  m.fan([c[0], c[1], c[2], 0.35], rim, a, b, false);
  m.strip(rim, rim2, foam, foam);
}

// ---------------------------------------------------------------- 2. moods
const hexLin = (h) => new THREE.Color(h);
const mixC = (a, b, t) => a.clone().lerp(b, t);
// each mood: inks (five hex), bands (five colours from the horizon up), sun elevation, fan strength
function moodTable() {
  const P = BRIEF_PALETTE.map(hexLin), [n, t, c, g, v] = P;
  const nightInk = ['#1B3463', '#237A8C', '#E4DDC2', '#E6C06C', '#D9401F'].map(hexLin);
  return {
    morning: { name: 'Morning Arrival', inks: BRIEF_PALETTE, night: false, sunEl: 14,
      bands: [c, g, mixC(g, t, 0.5), t, mixC(t, n, 0.5)], sun: c, haze: g, line: null, fan: 1, foam: CREAM },
    golden: { name: 'Golden Hour', inks: BRIEF_PALETTE, night: false, sunEl: 6,
      bands: [g, mixC(g, v, 0.25), mixC(g, t, 0.25), mixC(g, t, 0.75), mixC(t, n, 0.25)], sun: c, haze: mixC(g, v, 0.12), line: v, fan: 1, foam: GOLD },
    night: { name: 'Night Gala', inks: ['#1B3463', '#237A8C', '#E4DDC2', '#E6C06C', '#D9401F'], night: true, sunEl: 24,
      bands: ['#1F6E82', '#17506E', '#123C5E', '#0F2D4E', '#0C2342'].map(hexLin),
      sun: nightInk[2], haze: hexLin('#17506E'), line: null, fan: 0.35, foam: CREAM },
  };
}
function pickMood(ctx) {
  const r = ctx.rng.fork ? ctx.rng.fork('weather') : ctx.rng, vary = ctx.vary || {}, T = moodTable();
  const roll = r(), wroll = r(), hour = vary.hour || 'any';
  let key = roll < 0.5 ? 'morning' : roll < 0.78 ? 'golden' : 'night';
  if (hour === 'day' || hour === 'dawn') key = 'morning'; else if (hour === 'golden') key = 'golden'; else if (hour === 'night') key = 'night';
  let weather = wroll < 0.5 ? 'clear' : wroll < 0.78 ? 'fog' : 'rain';
  if (key === 'night' && weather === 'rain') weather = 'clear';
  const cast = { livery: r() < 0.2 && key !== 'night' ? 'cream' : 'black', funnels: r() < 0.82 ? 3 : 2, yachts: r() < 0.3, biplanes: r() < 0.3 };
  return { key, weather, cast, ...T[key] };
}

// ---------------------------------------------------------------- 3. sky dome
const DITHER = /* glsl */`
float inkDither(vec2 p){ return fract(52.9829189*fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float dealt(float t){ float tile = floor(t*3.0); vec2 q = floor(gl_FragCoord.xy*0.5) + vec2(mod(tile*17.0, 64.0), mod(tile*29.0, 64.0)); return inkDither(q); }
`;
function makeSky(mood, sunDir, R, seaU) {
  const bandsL = mood.bands.map((b, i) => (i === 0 ? mixC(b, mood.bands[1], mood.night ? -0.25 : 0.4) : mixC(b, mood.bands[i - 1], 0.42)));
  const uniforms = {
    uBand: { value: mood.bands }, uBandL: { value: bandsL }, uSun: { value: sunDir.clone() }, uSunCol: { value: mood.sun.clone() },
    uCamW: { value: new THREE.Vector3(0, 2, 0) }, uInk: seaU.uInk, uFoam: seaU.uFoam, uSeaHaze: seaU.uSeaHaze, uHzP: seaU.uHzP, uScroll: seaU.uScroll, uSlideS: seaU.uSlideS,
    uTime: { value: 0 }, uFan: { value: mood.fan }, uNight: { value: mood.night ? 1 : 0 },
    uLine: { value: (mood.line || mood.bands[0]).clone() }, uLineOn: { value: mood.line ? 1 : 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; vec4 mv = modelViewMatrix*vec4(position, 1.0); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: /* glsl */`
uniform vec3 uBand[5]; uniform vec3 uBandL[5]; uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uCamW; uniform vec3 uLine;
uniform float uTime, uFan, uNight, uLineOn;
varying vec3 vDir;
${DITHER}
${SEA_GLSL}
vec3 bandAt(float k){ if (k < 0.5) return uBand[0]; if (k < 1.5) return uBand[1]; if (k < 2.5) return uBand[2]; if (k < 3.5) return uBand[3]; return uBand[4]; }
vec3 bandLAt(float k){ if (k < 0.5) return uBandL[0]; if (k < 1.5) return uBandL[1]; if (k < 2.5) return uBandL[2]; if (k < 3.5) return uBandL[3]; return uBandL[4]; }
float hash2(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
void main(){
  vec3 d = vDir/max(length(vDir), 1e-4);
  float e = degrees(asin(clamp(d.y, -1.0, 1.0)));
  float n = dealt(uTime);
  float ed = e + (n - 0.5)*0.75;                       // stipple only in a narrow belt at each band edge
  float k = step(4.0, ed) + step(10.0, ed) + step(20.0, ed) + step(45.0, ed);
  vec3 col = bandAt(k);
  // the ray fan: 24 wedges about the sun, alternate wedges a step lighter, wheeling
  vec3 U = cross(uSun, vec3(0.0, 1.0, 0.0)); U /= max(length(U), 1e-4); vec3 V = cross(U, uSun);
  float ax = dot(d, U), ay = dot(d, V);
  float a = atan(ay, ax + (abs(ax) + abs(ay) < 1e-5 ? 1e-4 : 0.0));
  float x = a*(12.0/6.2831853) + uTime*0.05;
  float tw = abs(fract(x) - 0.5), w = clamp(fwidth(x), 0.0005, 0.03);
  float wedge = smoothstep(-w, w, 0.25 - tw);
  float cs = dot(d, uSun);
  float reach = cs > 0.62 ? 1.0 : (cs > -0.1 ? 0.7 : 0.4);
  col = mix(col, bandLAt(k), wedge*reach*uFan);
  // sun (or ringed moon): a flat disc with two stepped rings
  float ang = degrees(acos(clamp(cs, -1.0, 1.0)));
  float aw = 0.12;
  col = mix(col, mix(col, uSunCol, 0.3), 1.0 - smoothstep(6.4 - aw, 6.4 + aw, ang));
  col = mix(col, mix(col, uSunCol, 0.45), 1.0 - smoothstep(4.3 - aw, 4.3 + aw, ang));
  col = mix(col, uSunCol*(uNight > 0.5 ? 0.92 : 0.95), 1.0 - smoothstep(2.5 - aw, 2.5 + aw, ang));
  if (uNight > 0.5) {
    col = mix(col, bandAt(k), smoothstep(1.7 - aw, 1.7 + aw, ang)*(1.0 - smoothstep(2.05 - aw, 2.05 + aw, ang))*0.6);
    // four-point stars on a direction grid
    vec2 sp = d.xz/(abs(d.y) + 0.35)*9.0; vec2 ci = floor(sp), cf = fract(sp) - 0.5;
    float h = hash2(ci);
    if (h > 0.72 && e > 6.0) {
      vec2 o = (vec2(hash2(ci + 7.1), hash2(ci + 3.7)) - 0.5)*0.5; vec2 q = abs(cf - o);
      float sz = 0.2 + 0.25*hash2(ci + 1.3), tw2 = 0.75 + 0.25*sin(uTime*(1.0 + 3.0*h) + h*40.0);
      float star = 1.0 - smoothstep(0.0, sz*tw2, sqrt(q.x*q.y)*7.0 + (q.x + q.y)*1.3);
      col = mix(col, uSunCol*0.9, clamp(star*1.6, 0.0, 1.0));
    }
  }
  // the horizon: one thin drawn line (golden mood), and below it the sea's farthest flat band
  col = mix(col, uLine, uLineOn*step(0.0, e)*(1.0 - smoothstep(0.32, 0.42, e)));
  // the same sea as the plane, ray-cast: it stands in wherever the plane is cut away (the view through a portal)
  float tt = (max(uCamW.y, 0.2) + 0.06)/max(-d.y, 0.0008);
  vec2 sw = uCamW.xz + d.xz*tt;
  vec3 seaC = seaColor(sw, tt, min(length(fwidth(sw)), 1e4), min(fwidth(tt), 1e4), n);
  col = mix(seaC, col, smoothstep(-0.06, 0.02, e));
  gl_FragColor = vec4(col, 1.0);
}`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 24), mat);
  mesh.frustumCulled = false; mesh.renderOrder = -10;
  return { mesh, uniforms };
}

// ---------------------------------------------------------------- 4. the sea
// A plane that draws the scallop frieze (fine lattice 6 x 5 m, then an 18 x 15 m lattice, then flat bands, each
// faded by the pixel footprint) and two camera-wrapped rings of standing scallops on the same lattices.
const SEA_GLSL = /* glsl */`
uniform vec3 uInk[5]; uniform vec3 uFoam; uniform vec3 uSeaHaze; uniform vec3 uHzP;
uniform float uScroll, uSlideS;
vec3 tone(float k){ return mix(uInk[0], uInk[1], k); }
float scaleD(vec2 p, float j, float W, float D, float R){
  float par = mod(j, 2.0), off = par*0.5*W + (par*2.0 - 1.0)*uSlideS*(W/6.0);
  float xi = floor((p.x - off)/W + 0.5);
  return length(p - vec2(xi*W + off, j*D))/R;
}
vec3 scaleInk(float d, float wd){
  vec3 col = mix(tone(0.5), tone(0.75), smoothstep(0.34 - wd, 0.34 + wd, d));
  col = mix(col, tone(1.0), smoothstep(0.62 - wd, 0.62 + wd, d));
  float hw = max(0.05, 0.8*wd);
  col = mix(col, uFoam, smoothstep(0.93 - hw - wd, 0.93 - hw + wd, d));
  return mix(col, tone(0.5), smoothstep(0.93 + hw - wd, 0.93 + hw + wd, d));
}
// fish-scale frieze: each scale lies behind its lattice point (toward -z); the nearer rank overlaps the farther
vec3 scalePat(vec2 p, float W, float D, float R, float fp){
  float j = ceil(p.y/D), wd = clamp(fp/R, 0.002, 0.5);
  float d0 = scaleD(p, j, W, D, R), d1 = scaleD(p, j + 1.0, W, D, R);
  float hw = max(0.05, 0.8*wd);
  return mix(scaleInk(d0, wd), scaleInk(d1, wd), 1.0 - smoothstep(0.93 + hw - wd, 0.93 + hw + wd, d1));
}
// w = world xz on the sea, dist = distance for the stepped haze, fp = pixel footprint in metres, fd = fwidth(dist), n = dealt stipple
vec3 seaColor(vec2 w, float dist, float fp, float fd, float n){
  vec2 p = vec2(w.x, w.y + uScroll);
  // flat bands with long wind streaks one step lighter
  float sx = p.y*0.011 + 0.4*sin(w.x*0.005 + 1.3);
  float streak = step(0.7, fract(sx))*(1.0 - smoothstep(8.0, 30.0, fp));
  vec3 col = mix(tone(0.75), tone(1.0), streak);
  float f2 = 1.0 - smoothstep(2.4, 9.0, fp), f1 = 1.0 - smoothstep(0.7, 2.2, fp);
  if (f2 > 0.001) col = mix(col, scalePat(p, 18.0, 15.0, 15.6, fp), f2);
  if (f1 > 0.001) col = mix(col, scalePat(p, 6.0, 5.0, 5.2, fp), f1);
  float hz = clamp(floor((dist + (n - 0.5)*6.0*fd)/uHzP.x), 0.0, uHzP.y);
  return mix(col, uSeaHaze, hz*uHzP.z);
}`;
const SEA_FRAG = /* glsl */`
uniform float uTime;
varying vec2 vW; varying float vDist;
${DITHER}
${SEA_GLSL}
void main(){
  gl_FragColor = vec4(seaColor(vW, vDist, length(fwidth(vW)), fwidth(vDist), dealt(uTime)), 1.0);
}`;
const SCALLOP_HEAD = /* glsl */`
attribute vec3 aCell; uniform vec3 uCamP; uniform float uScroll, uSlideS, uFoamI, uCorr;
uniform vec4 uLat; uniform vec4 uRng; uniform vec2 uSize; uniform vec4 uClr[8];
`;
const SCALLOP_MOTION = /* glsl */`
  float W = uLat.x, D = uLat.y;
  float zr = aCell.y*D - uScroll;
  float zw = uCamP.z + mod(zr - uCamP.z + uLat.w*0.5, uLat.w) - uLat.w*0.5;
  float j = floor((zw + uScroll)/D + 0.5), par = mod(j, 2.0);
  float off = par*0.5*W + (par*2.0 - 1.0)*uSlideS*(W/6.0);
  float xw = uCamP.x + mod(aCell.x*W + off - uCamP.x + uLat.z*0.5, uLat.z) - uLat.z*0.5;
  float dist = length(vec2(xw, zw) - uCamP.xz);
  float sc = smoothstep(uRng.x, uRng.y, dist)*(1.0 - smoothstep(uRng.z, uRng.w, dist));
  float ss = 155.0 - zw;
  float hw = 19.5*smoothstep(-14.0, 70.0, ss)*(1.0 - smoothstep(262.0, 322.0, ss)) + 5.0 + 9.0*smoothstep(-6.0, 30.0, ss)*(1.0 - smoothstep(45.0, 80.0, ss));
  float wk = smoothstep(312.0, 326.0, ss);                 // the wake's lane astern is kept clear too
  hw = mix(hw, 8.0 + 0.2125*(ss - 311.0), wk);
  float inS = smoothstep(-24.0, -14.0, ss)*(1.0 - smoothstep(386.0, 396.0, ss));
  sc *= mix(1.0, smoothstep(hw, hw + 3.0 + W*0.5, abs(xw)), inS);
  for (int i = 0; i < 8; i++) sc *= smoothstep(uClr[i].z, uClr[i].z + 3.0 + W*0.5, length(vec2(xw, zw) - uClr[i].xy));
  float ph = zw*0.42 + uTime*2.1 + aCell.z*0.7;
  float rise = 0.75 + 0.25*sin(ph), tip = 0.5 + 0.3*sin(ph - 1.2);
  float low = mix(uCorr, 1.0, smoothstep(3.0, 9.0, abs(xw - uCamP.x)));
  float H = uSize.y*rise*sc*low;
  pos = vec3(xw + position.x*uSize.x*(0.4 + 0.6*sc), position.y*H - 0.05, zw - position.y*H*tip);
  g += 0.08*par - position.x*0.2;
  if (ia > 1.5) { ia = uFoamI; ib = uFoamI; }
  glow = 0.0;`;
function scallopGeo(segs, cols, ranks, rng) {
  const P = [], K = [];
  const v = (x, y, g, a, b) => { P.push(x, y, 0); K.push(g, a, b, 0); };
  const rim = [];
  for (let i = 0; i <= segs; i++) { const an = (i / segs) * PI; rim.push([Math.cos(an) * 0.5, Math.sin(an)]); }
  for (let i = 0; i < segs; i++) {
    const a = rim[i], b = rim[i + 1], k = 0.84;
    v(0, 0, 0.42, NAVY, TEAL); v(a[0] * k, a[1] * k, 0.98, NAVY, TEAL); v(b[0] * k, b[1] * k, 0.98, NAVY, TEAL);
    v(a[0] * k, a[1] * k, 0.9, CREAM, CREAM); v(a[0], a[1], 0.9, CREAM, CREAM); v(b[0], b[1], 0.9, CREAM, CREAM);
    v(a[0] * k, a[1] * k, 0.9, CREAM, CREAM); v(b[0], b[1], 0.9, CREAM, CREAM); v(b[0] * k, b[1] * k, 0.9, CREAM, CREAM);
  }
  const n = cols * ranks, C = new Float32Array(n * 3);
  for (let r = 0, i = 0; r < ranks; r++) for (let c = 0; c < cols; c++, i++) { C[i * 3] = c; C[i * 3 + 1] = r; C[i * 3 + 2] = rng() * 9; }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  geo.setAttribute('aInk', new THREE.BufferAttribute(new Float32Array(K), 4));
  geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(C, 3));
  geo.instanceCount = n;
  return geo;
}
function makeSea(style, mood, rng, clears, opts) {
  const inks = style.inks, group = new THREE.Group();
  const seaHaze = mood.night ? mixC(inks[TEAL], mood.bands[0], 0.5) : mixC(inks[TEAL], inks[CREAM], 0.45);
  const shared = { uScroll: { value: 0 }, uSlideS: { value: 0 }, uCamP: { value: new THREE.Vector3() } };
  // plane: rings of growing radius so nearby triangles stay small
  const radii = [0, 6, 20, 60, 160, 420, 1100, 2600, opts.R], SEG = 48, P = [];
  for (let i = 0; i + 1 < radii.length; i++) for (let k = 0; k < SEG; k++) {
    const a0 = (k / SEG) * TAU, a1 = ((k + 1) / SEG) * TAU, r0 = radii[i], r1 = radii[i + 1];
    const A = [Math.cos(a0) * r0, 0, Math.sin(a0) * r0], B = [Math.cos(a1) * r0, 0, Math.sin(a1) * r0], C = [Math.cos(a1) * r1, 0, Math.sin(a1) * r1], Dd = [Math.cos(a0) * r1, 0, Math.sin(a0) * r1];
    if (i > 0) P.push(...A, ...C, ...B); P.push(...A, ...Dd, ...C);
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  const planeMat = new THREE.ShaderMaterial({
    uniforms: { uInk: style.uniforms.uInk, uTime: style.uniforms.uTime, uFoam: { value: inks[mood.foam].clone() }, uSeaHaze: { value: seaHaze },
      uHzP: { value: new THREE.Vector3(500, 3, 0.22) }, uScroll: shared.uScroll, uSlideS: shared.uSlideS },
    fog: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec2 vW; varying float vDist;
void main(){ vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xz; vec4 mv = viewMatrix*w; vDist = -mv.z; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: SEA_FRAG,
  });
  const plane = new THREE.Mesh(pg, planeMat); plane.frustumCulled = false; plane.position.y = -0.06; plane.renderOrder = -5;
  group.add(plane);
  const clr = []; for (let i = 0; i < 8; i++) clr.push(clears[i] ? new THREE.Vector4(clears[i][0], clears[i][1], clears[i][2], 0) : new THREE.Vector4(0, 1e6, 1, 0));
  const ring = (segs, cols, ranks, W, D, size, rngv) => {
    const mat = style.material({
      head: SCALLOP_HEAD, motion: SCALLOP_MOTION, slide: 0.03,
      uniforms: { ...shared, uLat: { value: new THREE.Vector4(W, D, cols * W, ranks * D) }, uRng: { value: new THREE.Vector4(...rngv) }, uSize: { value: new THREE.Vector2(size[0], size[1]) },
        uClr: { value: clr }, uFoamI: { value: mood.foam }, uCorr: { value: opts.corr ?? 1 }, uHaze: { value: seaHaze }, uHazeP: { value: new THREE.Vector3(500, 3, 0.22) } },
    });
    const mesh = new THREE.Mesh(scallopGeo(segs, cols, ranks, rng), mat); mesh.frustumCulled = false;
    group.add(mesh); return mesh;
  };
  const hk = opts.height ?? 1;
  ring(12, 40, 48, 6, 5, [6.6, 1.2 * hk], [-2, -1, 98, 118]);
  const fr = opts.detail < 0.9 ? 44 : 60;
  ring(6, 54, fr, 18, 15, [19, 3.0 * hk], [96, 116, 270, fr * 7.5 - 8]);     // a long fade-out: the standing scallops dwindle into the plane's own lattice
  const far = mixC(mixC(inks[NAVY], inks[TEAL], 0.75), seaHaze, 0.66);
  return {
    group, far, seaHaze, uniforms: planeMat.uniforms,
    update(time, camP) {
      shared.uScroll.value = (time * 5.5) % 30;
      shared.uSlideS.value = Math.sin(time * 0.7);
      shared.uCamP.value.copy(camP);
      plane.position.x = camP.x; plane.position.z = camP.z;
    },
  };
}

// ---------------------------------------------------------------- 5. motion shared by all set dressing
// aAux.w = mode + fraction (a per-part phase), aAux.xyz = pivot in object space.
//   0 static   1 smoke puff rising from the pivot   2 propeller turning about the pivot (z axis)
//   3 water arc: the fill pulses along the ribbon   4 burst fan growing from the pivot   5 foam scallop bobbing
//   6 whistle plume, scaled by uWhistle   7 pennant fluttering away from the pivot   8 reflection bar shuffling
const SET_HEAD = /* glsl */`attribute vec4 aAux; uniform float uWhistle;\n`;
const SET_MOTION = /* glsl */`
  { float md = floor(aAux.w + 0.001), fr = fract(aAux.w); vec3 pv = aAux.xyz, rel = position - aAux.xyz;
    if (md > 7.5) { pos.x += 0.9*(step(0.5, fract(uTime*0.8 + fr*7.0)) - 0.5); }
    else if (md > 6.5) { float dd = length(rel.xz); pos.x += sin(dd*1.6 - uTime*7.0 + fr*20.0)*0.14*dd; pos.y += sin(dd*1.1 - uTime*5.0 + fr*9.0)*0.07*dd; }
    else if (md > 5.5) { float p = uWhistle; pos = pv + rel*p*vec3(1.0, 0.7 + 0.6*p, 1.0) + vec3(0.0, 3.0*p*p, -2.5*p*p); g += 0.25*step(0.6, p); }
    else if (md > 4.5) { pos.y = pv.y + rel.y*(0.72 + 0.42*sin(uTime*3.2 + fr*40.0 + position.z*0.8)); }
    else if (md > 3.5) { float p = fract(uTime/1.7 + fr*7.0); float e = smoothstep(0.0, 0.2, p)*(1.0 - smoothstep(0.6, 1.0, p));
      pos = pv + rel*vec3(e, e*(0.55 + 0.8*p), e); g += 0.25*step(0.5, p); }
    else if (md > 2.5) { g = 0.1 + 0.42*step(0.5, fract(aInk.x*5.0 - uTime*1.3 + fr)); }
    else if (md > 1.5) { float an = uTime*13.0 + fr*6.2831853, c = cos(an), s = sin(an); pos = pv + vec3(rel.x*c - rel.y*s, rel.x*s + rel.y*c, rel.z); }
    else if (md > 0.5) { float p = fract(uTime*0.2 + fr); float e = (0.3 + 1.5*p)*(1.0 - smoothstep(0.8, 1.0, p))*smoothstep(0.0, 0.06, p);
      pos = pv + rel*e + vec3(0.0, 4.0*p + 5.0*p*p, -11.0*p); g += 0.22*step(0.5, fract(p*3.0)); }
    glow = 0.0; }`;

// ---------------------------------------------------------------- 6a. boats (builder-local: ls aft of the stem, lp to port, lh up)
const sm = (a, b, x) => smoothstep(a, b, x);
function boatHull(m, o) {
  const { L, B, hBow, hMid, hStern } = o, NS = 18;
  const hb = (t) => {
    const f = Math.pow(Math.sin(Math.min(1, t / 0.42) * PI / 2), 0.75), a = t > 0.76 ? Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.76) / 0.245, 2.4))) : 1;
    return Math.max(0.06, B * 0.5 * f * (0.3 + 0.7 * a));
  };
  const sh = (t) => (t < 0.5 ? lerp(hBow, hMid, sm(0, 0.5, t)) : lerp(hMid, hStern, sm(0.5, 1, t)));
  const wf = [0.7, 0.9, 0.96, 1.0, 1.03];
  const P = (t, k, sd, g) => {
    const H = sh(t), h = k === 0 ? -0.6 : k === 1 ? 0.5 : 0.5 + (H - 0.5) * (k - 1) / 3;
    return [t * L - 0.42 * Math.max(0, h) * Math.pow(1 - t, 3) + 0.25 * Math.max(0, h) * Math.pow(t, 5), sd * hb(t) * wf[k], h, g];
  };
  for (const sd of [1, -1]) for (let i = 0; i < NS; i++) {
    const t0 = i / NS, t1 = (i + 1) / NS;
    for (let k = 0; k < 4; k++) {
      const boot = k === 0, g = boot ? 0.1 + (sd < 0 ? 0.12 : 0) : (o.hullG ?? 0.04) + 0.16 * k + (k % 2 ? 0.1 : 0) + (sd < 0 ? 0.05 : 0) + 0.1 * t0;
      m.quad(P(t0, k, sd, g), P(t1, k, sd, g), P(t1, k + 1, sd, g + 0.06), P(t0, k + 1, sd, g + 0.06), boot ? o.bootA : o.hullA, boot ? o.bootB : o.hullB);
    }
    // capping rail
    const c0 = P(t0, 4, sd, 0.9), c1 = P(t1, 4, sd, 0.9);
    m.quad(c0, c1, [c1[0], c1[1], c1[2] + 0.4, 0.98], [c0[0], c0[1], c0[2] + 0.4, 0.98], GOLD, CREAM);
    // deck
    if (sd > 0) m.quad(P(t0, 4, 1, 0.5 + 0.3 * t0), P(t1, 4, 1, 0.5 + 0.3 * t1), P(t1, 4, -1, 0.62 + 0.3 * t1), P(t0, 4, -1, 0.62 + 0.3 * t0), o.deckA ?? GOLD, o.deckB ?? CREAM);
  }
  for (let k = 0; k < 4; k++) m.quad(P(1, k, 1, 0.3), P(1, k, -1, 0.3), P(1, k + 1, -1, 0.4), P(1, k + 1, 1, 0.4), k ? o.hullA : o.bootA, k ? o.hullB : o.bootB);
  if (o.water !== false) {
    // contact band, a line of bobbing foam scallops, and the bow moustache
    for (const sd of [1, -1]) {
      const A = [], Bq = [];
      for (let i = 0; i <= NS; i++) { const t = i / NS; A.push([t * L, sd * (hb(t) * 0.9 - 0.2), 0.14, 0.3]); Bq.push([t * L, sd * (hb(t) * 0.9 + 1.9), 0.14, 0.3]); }
      m.strip(A, Bq, TEAL, NAVY);
      for (let s = 1; s < L; s += 2.0) {
        const t = s / L, w = hb(t) * 0.9 + 0.35;
        m.mode(5, s, sd * w, 0, (s * 0.137) % 1); scallopW(m, [s, sd * w, -0.05], 1, sd * (hb(Math.min(1, t + 0.04)) - hb(Math.max(0, t - 0.04))) * 0.9 / (0.08 * L), 2.1, 0.95, TEAL, CREAM, 0, 6, o.foam ?? CREAM);
      }
      for (let k = 0; k < 4; k++) {
        const s = 0.5 + k * 1.6, w = hb(s / L) * 0.9 + 0.8 + k * 0.7;
        m.mode(4, s, sd * w, 0, 0.13 * k + (sd > 0 ? 0 : 0.5)); scallopW(m, [s, sd * w, 0], 0.55, sd * 0.83, 3.4 - k * 0.3, 2.3 - k * 0.3, TEAL, CREAM, sd * 0.25, 8, o.foam ?? CREAM);
      }
    }
    m.mode(0);
  }
  return { hb, sh };
}
// crossed scallop-rim discs: a drawn puff readable from every side
function puffW(m, c, R, a, b) {
  for (const [ts, tp] of [[1, 0], [0, 1]]) {
    const rim = [];
    for (let j = 0; j < 20; j++) { const an = (j / 20) * TAU, r = R * (0.8 + 0.2 * Math.abs(Math.sin(an * 2.5))); rim.push([c[0] + ts * Math.cos(an) * r, c[1] + tp * Math.cos(an) * r, c[2] + Math.sin(an) * r, 0.5 + 0.45 * Math.sin(an)]); }
    m.fan([c[0], c[1], c[2], 0.5], rim, a, b);
  }
}
function buildTug(m, kind) {
  const fire = kind === 'fire', L = fire ? 32 : 28;
  const H = boatHull(m, fire
    ? { L, B: 8.6, hBow: 3.6, hMid: 2.3, hStern: 2.5, hullA: VERM, hullB: GOLD, hullG: 0.0, bootA: NAVY, bootB: TEAL }
    : { L, B: 8.4, hBow: 3.7, hMid: 2.2, hStern: 2.5, hullA: NAVY, hullB: TEAL, hullG: 0.04, bootA: VERM, bootB: GOLD });
  const dk = 2.3;
  // bow fender and side fenders
  for (const sd of [1, -1]) {
    const pts = []; for (let i = 0; i <= 6; i++) { const t = 0.005 + (i / 6) * 0.2; pts.push([t * L - 0.9 * (1 - t * 5) * 0.6, sd * (H.hb(t) + 0.3), H.sh(t) - 0.5]); }
    tubeW(m, pts, 0.5, 7, GOLD, CREAM, { g0: 0.25, gr: 0.6, gl: 0.0, cap: true, cap0: true });
    for (let k = 0; k < 5; k++) {
      const t = 0.3 + k * 0.12, ring = [];
      for (let j = 0; j < 9; j++) { const an = (j / 9) * TAU; ring.push([t * L + Math.cos(an) * 0.62, sd * (H.hb(t) * 1.01 + 0.16), 1.5 + Math.sin(an) * 0.62, 0.85]); }
      m.fan([t * L, sd * (H.hb(t) * 1.01 + 0.3), 1.5, 0.1], ring, fire ? NAVY : GOLD, fire ? TEAL : CREAM);
    }
  }
  // deckhouse with lozenge windows, rounded wheelhouse with an overhanging roof
  m.box(8, 19, -2.5, 2.5, dk, dk + 2.6, GOLD, CREAM, 0.3, 0.8);
  for (const sd of [1, -1]) for (let s = 9.4; s < 18.5; s += 1.9) lozW(m, [s, sd * 2.56, dk + 1.5], [1, 0], 1.2, 0.9, NAVY, TEAL);
  const out = []; for (let i = 0; i <= 10; i++) { const an = PI / 2 + (i / 10) * PI; out.push([9.6 + Math.cos(an) * 2.3 * 0.9, Math.sin(an) * 2.3]); }
  out.push([12.6, -2.3], [12.6, 2.3]);
  const wl = (h, g, k = 1) => out.map(([s, p]) => [9.6 + (s - 9.6) * k + (k - 1) * 1.2, p * k, h, g + 0.18 * (p / 2.3)]);
  m.loft([wl(dk + 2.6, 0.45), wl(dk + 5.0, 0.85)], GOLD, CREAM);
  m.loft([wl(dk + 5.0, 0.3, 1.14), wl(dk + 5.35, 0.75, 1.14)], GOLD, CREAM);
  m.fan([10.6, 0, dk + 5.6, 0.95], wl(dk + 5.35, 0.7, 1.14), GOLD, CREAM);
  for (let i = 0; i < 10; i++) { const a = out[i], b = out[i + 1], cs = (a[0] + b[0]) / 2, cp = (a[1] + b[1]) / 2, l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; lozW(m, [cs - 0.06 * (b[1] - a[1]) / l, cp + 0.06 * (b[0] - a[0]) / l, dk + 4.0], [(b[0] - a[0]) / l, (b[1] - a[1]) / l], 0.62, 0.95, NAVY, TEAL); }
  // stack: cream foot, the vermilion band, navy cap
  const sx = (h) => 15.4 + (h - dk) * 0.1, st = (h0, h1, r, a, b, o = {}) => tubeW(m, [[sx(h0), 0, h0], [sx(h1), 0, h1]], r, 14, a, b, { g0: 0.08, gr: 0.6, a0: 2.3, ...o });
  st(dk + 2.6, 7.4, 1.2, GOLD, CREAM, { g0: 0.4, gr: 0.55 }); st(7.4, 9.3, 1.24, fire ? GOLD : VERM, fire ? CREAM : GOLD, { g0: 0.05, gr: 0.4 }); st(9.3, 11, 1.2, NAVY, TEAL, { cap: true, capG: 0.02 });
  st(9.25, 9.45, 1.34, GOLD, CREAM, { g0: 0.5, gr: 0.5 });
  for (let k = 0; k < 4; k++) { m.mode(1, sx(11), 0, 11.2, k / 4); puffW(m, [sx(11), 0, 11.2], 1.5, GOLD, CREAM); }
  m.mode(0);
  // mast and pennant, tow post and arch
  tubeW(m, [[10.6, 0, dk + 5.5], [10.8, 0, 13.4]], [0.2, 0.12], 6, GOLD, CREAM, { g0: 0.3, gr: 0.6, cap: true });
  m.mode(7, 10.8, 0, 13.0, 0.3); m.tri([10.8, 0, 13.3, 0.1], [10.8, 0, 12.5, 0.1], [13.4, 0, 12.9, 0.6], VERM, GOLD); m.mode(0);
  if (!fire) {
    tubeW(m, [[22, 0, dk], [22, 0, dk + 1.9]], [0.42, 0.36], 8, GOLD, CREAM, { g0: 0.3, gr: 0.6, cap: true });
    tubeW(m, [[22, -0.9, dk + 1.4], [22, 0.9, dk + 1.4]], 0.2, 6, GOLD, CREAM, { B: [1, 0, 0], cap: true, cap0: true });
    const arch = []; for (let i = 0; i <= 8; i++) { const an = (i / 8) * PI; arch.push([20, Math.cos(an) * 3.1, dk + Math.sin(an) * 2.1]); }
    tubeW(m, arch, 0.2, 6, GOLD, CREAM, { B: [1, 0, 0], g0: 0.3, gr: 0.6 });
    m.box(24.5, 26.5, -1.2, 1.2, dk, dk + 0.8, TEAL, CREAM, 0.1, 0.4);
  } else {
    // lattice monitor tower with three nozzles
    const leg = (sd, sp, h) => [22 + sp * lerp(1.7, 0.75, (h - dk) / 9.5), sd * lerp(1.7, 0.75, (h - dk) / 9.5), h];
    for (const sd of [1, -1]) for (const sp of [1, -1]) {
      tubeW(m, [leg(sd, sp, dk), leg(sd, sp, dk + 9.5)], 0.2, 5, GOLD, CREAM, { g0: 0.3, gr: 0.6 });
      for (let k = 0; k < 4; k++) {
        const h0 = dk + k * 2.375, h1 = h0 + 2.375;
        tubeW(m, [leg(sd, sp, h0), leg(k % 2 ? sd : -sd, k % 2 ? -sp : sp, h1)], 0.14, 4, GOLD, CREAM, { g0: 0.4, gr: 0.5, B: [0.3, 0.3, 0.9] });
      }
    }
    m.box(20.9, 23.1, -1.1, 1.1, dk + 9.5, dk + 9.9, GOLD, CREAM, 0.3, 0.8);
    m.loft([[1.25, 0], [1.25, 0.9]].map(([r, dh]) => { const q = []; for (let j = 0; j < 10; j++) { const an = (j / 10) * TAU; q.push([22 + r * Math.cos(an), r * Math.sin(an), dk + 9.9 + dh, 0.9]); } return q; }), GOLD, CREAM);
    for (const [s0, h0] of [[22, dk + 10.2], [6.5, dk + 3.0], [28, dk + 0.4]]) {
      tubeW(m, [[s0, 0, h0 - 0.4], [s0, 0, h0 + 0.5], [s0 - 0.4, 0, h0 + 1.6], [s0 - 0.9, 0, h0 + 2.6]], [0.5, 0.42, 0.3, 0.2], 7, VERM, GOLD, { g0: 0.1, gr: 0.5, cap: true, capA: NAVY, capB: TEAL });
    }
    m.box(25, 29.5, -1.6, 1.6, dk, dk + 1.1, GOLD, CREAM, 0.3, 0.7);
  }
  return { L };
}
function buildYacht(m) {
  const L = 24;
  boatHull(m, { L, B: 5.6, hBow: 2.6, hMid: 1.6, hStern: 1.9, hullA: GOLD, hullB: CREAM, hullG: 0.42, bootA: VERM, bootB: GOLD });
  m.box(9, 15.5, -1.5, 1.5, 1.7, 2.7, GOLD, CREAM, 0.3, 0.75);
  for (const sd of [1, -1]) for (let s = 10; s < 15; s += 1.6) lozW(m, [s, sd * 1.56, 2.25], [1, 0], 1.0, 0.5, NAVY, TEAL);
  tubeW(m, [[8.6, 0, 1.7], [8.9, 0, 30]], [0.26, 0.13], 6, GOLD, CREAM, { g0: 0.3, gr: 0.6, cap: true });
  tubeW(m, [[8.8, 0, 3.4], [21, 0.9, 3.9]], 0.17, 5, GOLD, CREAM, { B: [0, 0, 1] });
  // mainsail and jib in stepped horizontal panels, bellied to starboard
  const sail = (foot0, foot1, head, n, belly) => {
    for (let i = 0; i < n; i++) {
      const v0 = i / n, v1 = (i + 1) / n, row = (v) => { const a = [lerp(foot0[0], head[0], v), lerp(foot0[1], head[1], v), lerp(foot0[2], head[2], v)], b = [lerp(foot1[0], head[0], v), lerp(foot1[1], head[1], v), lerp(foot1[2], head[2], v)]; const q = [];
        for (let k = 0; k <= 4; k++) { const u = k / 4; q.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) - belly * Math.sin(u * PI) * (1 - v) , lerp(a[2], b[2], u), 0.96 - 0.8 * v0 - 0.12 * u]); } return q; };
      m.strip(row(v0), row(v1), GOLD, CREAM);
    }
  };
  sail([9.2, 0, 3.9], [20.6, 0.9, 4.3], [9.1, 0, 29.4], 9, 1.5);
  sail([0.4, 0, 2.9], [8.2, 0.6, 3.6], [8.6, 0, 25], 7, 1.2);
  m.mode(7, 8.9, 0, 30, 0.6); m.tri([8.9, 0, 30.2, 0.1], [8.9, 0, 29.3, 0.1], [11.8, 0, 29.8, 0.6], VERM, GOLD); m.mode(0);
  return { L };
}

// ---------------------------------------------------------------- 6b. aircraft and airship (builder-local: ls aft of the nose)
function wingW(m, ls0, chordR, chordT, span, h, thick, a, b, o = {}) {
  const st = [-1, -0.74, -0.42, -0.13, 0.13, 0.42, 0.74, 1];
  const rings = st.map((u) => {
    const au = Math.abs(u), c = lerp(chordR, chordT, au), le = ls0 + (chordR - c) * (o.sweep ?? 0.35), y = h + (o.dih ?? 0.05) * au * span, th = thick * lerp(1, 0.45, au), k = u < 0 ? 0.08 : 0;
    return [[le, u * span, y, 0.5 + k], [le + c * 0.3, u * span, y + th * 0.6, 0.04 + k], [le + c, u * span, y + th * 0.1, 0.55 + k], [le + c * 0.3, u * span, y - th * 0.4, 0.86 + k]];
  });
  m.loft(rings.slice(1, -1), a, b); m.loft(rings.slice(0, 2), o.tipA ?? VERM, o.tipB ?? GOLD); m.loft(rings.slice(-2), o.tipA ?? VERM, o.tipB ?? GOLD);
  for (const r of [rings[0], rings[rings.length - 1]]) m.quad(r[0], r[1], r[2], r[3], o.tipA ?? VERM, o.tipB ?? GOLD);
}
function propW(m, ls, p, h, R, frac) {
  m.mode(2, ls, p, h, frac);
  const rim = []; for (let j = 0; j <= 18; j++) { const an = (j / 18) * TAU; rim.push([ls, p + Math.cos(an) * R, h + Math.sin(an) * R]); }
  for (let j = 0; j < 18; j++) { const dark = Math.floor(j / 3) % 2 === 0, g = dark ? 0.78 : 0.2; m.tri([ls, p, h, g], [...rim[j], g], [...rim[j + 1], g], CREAM, TEAL); }
  m.mode(0);
  tubeW(m, [[ls - 0.7, p, h], [ls - 0.1, p, h], [ls + 0.2, p, h]], [0.05, 0.3, 0.34], 6, GOLD, CREAM, { g0: 0.3, gr: 0.6 });
}
function buildFlyingBoat(m) {
  const S = [[0, 0.15, 0.7, 1.1], [1.2, 0.95, -0.2, 1.7], [3, 1.5, -0.8, 2.25], [6, 1.7, -1.0, 2.35], [10, 1.6, -0.9, 2.25], [10.05, 1.5, -0.35, 2.25], [14, 1.1, 0.2, 2.15], [18, 0.62, 0.9, 2.25], [21.5, 0.14, 1.65, 2.35]];
  const rings = S.map(([s, w, k, c]) => { const mid = k + (c - k) * 0.32; return [[s, 0, k, 0.95], [s, w, mid, 0.82], [s, w * 0.98, mid + (c - mid) * 0.5, 0.5], [s, w * 0.6, c - 0.12, 0.2], [s, 0, c, 0.04], [s, -w * 0.6, c - 0.12, 0.28], [s, -w * 0.98, mid + (c - mid) * 0.5, 0.62], [s, -w, mid, 0.9]]; });
  m.loft(rings, CREAM, TEAL);
  // cheat line, cockpit and cabin windows
  for (const sd of [1, -1]) {
    m.quad([2.2, sd * 1.42, 0.55, 0.1], [17, sd * 0.75, 1.5, 0.1], [17, sd * 0.75, 1.72, 0.3], [2.2, sd * 1.42, 0.8, 0.3], VERM, GOLD);
    for (let s = 4.2; s < 13; s += 1.5) lozW(m, [s, sd * (1.62 - 0.035 * Math.max(0, s - 9) * 2), 1.25], [1, 0], 0.95, 0.55, NAVY, TEAL);
    lozW(m, [2.3, sd * 0.85, 1.95], [0.9, sd * 0.42], 1.3, 0.6, NAVY, TEAL);
  }
  // pylon, wing, engines, floats
  m.box(6.6, 10, -0.6, 0.6, 2.1, 4.3, CREAM, TEAL, 0.5, 0.2);
  wingW(m, 5.6, 5.2, 2.8, 15, 4.4, 0.75, CREAM, TEAL);
  [-9.6, -4.4, 4.4, 9.6].forEach((p, i) => {
    const h = 4.95 + 0.05 * Math.abs(p) * 0.6, le = 5.6 + (5.2 - lerp(5.2, 2.8, Math.abs(p) / 15)) * 0.35;
    tubeW(m, [[le - 1.5, p, h], [le - 0.9, p, h], [le + 1.4, p, h], [le + 2.6, p, h - 0.1]], [0.5, 0.72, 0.66, 0.2], 9, CREAM, TEAL, { g0: 0.1, gr: 0.85, a0: -1.57, B: [0, 1, 0] });
    propW(m, le - 1.75, p, h, 2.05, i * 0.23);
  });
  for (const sd of [1, -1]) {
    tubeW(m, [[6.2, sd * 11.2, 0.5], [7, sd * 11.2, 0.3], [9, sd * 11.2, 0.35], [10.4, sd * 11.2, 0.8]], [0.1, 0.5, 0.46, 0.08], 7, CREAM, TEAL, { g0: 0.2, gr: 0.6, a0: PI });
    for (const s of [7.1, 9.0]) tubeW(m, [[s, sd * 11.2, 0.6], [s + 0.2, sd * 11.2, 4.7]], 0.13, 4, CREAM, TEAL, { g0: 0.2, gr: 0.4 });
  }
  // fin, rudder flash and tailplane
  m.quad([16.4, 0, 2.2, 0.3], [21.4, 0, 2.3, 0.4], [21.9, 0, 6.3, 0.05], [19.6, 0, 6.3, 0.05], CREAM, TEAL);
  m.quad([20.3, 0.03, 2.9, 0.1], [21.5, 0.03, 2.9, 0.1], [21.9, 0.03, 6.2, 0.4], [20.9, 0.03, 6.2, 0.4], VERM, GOLD);
  m.quad([20.3, -0.03, 2.9, 0.1], [21.5, -0.03, 2.9, 0.1], [21.9, -0.03, 6.2, 0.4], [20.9, -0.03, 6.2, 0.4], VERM, GOLD);
  wingW(m, 18.6, 2.6, 1.5, 4.8, 3.9, 0.3, CREAM, TEAL, { dih: 0.02 });
}
function buildBiplane(m) {
  tubeW(m, [[0, 0, 0], [0.3, 0, 0], [2.4, 0, 0.1], [5, 0, 0.2], [8.2, 0, 0.5]], [0.3, 0.62, 0.66, 0.5, 0.1], 9, VERM, GOLD, { g0: 0.05, gr: 0.5, a0: 2.3 });
  wingW(m, 1.2, 1.7, 1.6, 5.2, 1.5, 0.22, GOLD, CREAM, { tipA: GOLD, tipB: CREAM, dih: 0.02, sweep: 0 });
  wingW(m, 1.6, 1.6, 1.5, 4.8, -0.4, 0.22, GOLD, CREAM, { tipA: GOLD, tipB: CREAM, dih: 0.03, sweep: 0 });
  for (const sd of [1, -1]) for (const p of [1.2, 3.6]) for (const s of [1.6, 2.7]) tubeW(m, [[s + 0.2, sd * p, -0.35], [s, sd * p, 1.5]], 0.07, 4, GOLD, CREAM, { g0: 0.4, gr: 0.4 });
  m.quad([6.6, 0, 0.5, 0.2], [8.3, 0, 0.5, 0.3], [8.4, 0, 2.0, 0.6], [7.5, 0, 2.0, 0.6], GOLD, CREAM);
  wingW(m, 7.0, 1.2, 0.8, 1.7, 0.55, 0.12, GOLD, CREAM, { tipA: GOLD, tipB: CREAM, dih: 0, sweep: 0.2 });
  for (const sd of [1, -1]) { tubeW(m, [[1.6, sd * 0.4, -0.5], [1.3, sd * 0.9, -1.5]], 0.07, 4, GOLD, CREAM); const ring = []; for (let j = 0; j < 10; j++) { const an = (j / 10) * TAU; ring.push([1.3 + Math.cos(an) * 0.42, sd * 0.95, -1.5 + Math.sin(an) * 0.42, 0.2]); } m.fan([1.3, sd * 0.95, -1.5, 0.6], ring, NAVY, TEAL); }
  propW(m, -0.15, 0, 0, 1.15, 0.1);
}
function buildAirship(m) {
  const NS = 26, NA = 16, Lh = 245, rings = [];
  for (let i = 0; i <= NS; i++) {
    const t = i / NS, r = 21 * Math.pow(Math.max(0, Math.sin(PI * Math.pow(t, 0.82))), 0.6) + 0.2, ring = [];
    for (let j = 0; j < NA; j++) { const an = (j / NA) * TAU; ring.push([t * Lh, Math.cos(an) * r, Math.sin(an) * r, 0.34 - 0.3 * Math.sin(an + 0.5) + (i % 2 ? 0.1 : 0)]); }
    rings.push(ring);
  }
  m.loft(rings, CREAM, TEAL);
  for (let k = 0; k < 4; k++) { const an = k * PI / 2 + PI / 4, c = Math.cos(an), s = Math.sin(an); m.quad([196, c * 14, s * 14, 0.1], [240, c * 4, s * 4, 0.2], [243, c * 26, s * 26, 0.45], [222, c * 28, s * 28, 0.45], VERM, GOLD); }
  m.box(70, 100, -3, 3, -26, -20, NAVY, TEAL, 0.3, 0.7);
  for (const s of [120, 150]) for (const sd of [1, -1]) tubeW(m, [[s, sd * 14, -17], [s + 7, sd * 14, -17]], [2.2, 1.2], 6, GOLD, CREAM, { cap: true, cap0: true });
}

// ---------------------------------------------------------------- 6c. clouds and the bank astern (world space; fills follow height, rims turn)
const CLOUD_HEAD = /* glsl */`attribute vec4 aAux; uniform float uSpin;\n`;
const CLOUD_MOTION = /* glsl */`
  { vec3 rel = position - aAux.xyz; float R = max(abs(aAux.w), 1.0);
    vec3 ax = vec3(aAux.x, 0.0, aAux.z); ax /= max(length(ax), 1.0);
    float an = sign(aAux.w)*uTime*0.0175*uSpin, c = cos(an), s = sin(an);
    vec3 r2 = rel*c + cross(ax, rel)*s;
    pos = aAux.xyz + r2; g = aInk.x + glow*r2.y/R; glow = 0.0; }`;
function cloudDisc(m, C, R, lobes, g0, gs, a, b, spin) {
  const l = Math.hypot(C[0], C[2]) || 1, tx = -C[2] / l, tz = C[0] / l, N = lobes * 6, rim = [];
  for (let j = 0; j <= N; j++) { const an = (j / N) * TAU, r = R * (0.84 + 0.16 * Math.abs(Math.sin(an * lobes * 0.5))); rim.push([C[0] + tx * Math.cos(an) * r, C[1] + Math.sin(an) * r, C[2] + tz * Math.cos(an) * r]); }
  const put = (q) => { m.P.push(q[0], q[1], q[2]); m.K.push(g0, a, b, gs); m.X.push(C[0], C[1], C[2], spin * R); };
  for (let j = 0; j < N; j++) { put(C); put(rim[j]); put(rim[j + 1]); }
}
function buildClouds(m, mood, rng, sunAz, detail) {
  const stacks = Math.round(14 * (detail < 0.9 ? 0.75 : 1)), night = mood.night;
  for (let i = 0; i < stacks; i++) {
    let az = (i / stacks) * TAU + rng.range(-0.12, 0.12);
    if (Math.abs(Math.atan2(Math.sin(az - sunAz), Math.cos(az - sunAz))) < 0.2) az += 0.42;
    // from the entry the funnels stand just left of dead astern (az PI + 0.01 .. 0.1): no cream stack behind the vermilion
    const dF = Math.atan2(Math.sin(az - PI - 0.05), Math.cos(az - PI - 0.05)); if (Math.abs(dF) < 0.32) az += (dF < 0 ? -1 : 1) * (0.32 - Math.abs(dF));
    const astern = Math.abs(Math.atan2(Math.sin(az - PI), Math.cos(az - PI))) < 0.5;
    const d = rng.range(1700, 3600), elev = (astern ? rng.range(15, 21) : rng.range(8, 19)) * D2R, n = rng.int(3, 5), R0 = rng.range(150, 260) * (d / 2400);
    const base = [Math.sin(az) * d, Math.tan(elev) * d, Math.cos(az) * d], tx = Math.cos(az), tz = -Math.sin(az);
    for (let k = 0; k < n; k++) {
      const off = (k - (n - 1) / 2) * R0 * 0.95 + rng.range(-20, 20), R = R0 * (1 - 0.22 * Math.abs(k - (n - 1) / 2)) * rng.range(0.85, 1.1), dd = d + k * 20;
      cloudDisc(m, [base[0] * dd / d + tx * off, base[1] + R * 0.25 + (k % 2) * R0 * 0.3, base[2] * dd / d + tz * off], R, 9, night ? 0.5 : 0.56, night ? 0.3 : 0.36, night ? NAVY : GOLD, night ? TEAL : CREAM, k % 2 ? 1 : -1);
    }
  }
  // the bank on the horizon astern, which backs the portal: two ranks of big discs, the nearer one a step darker
  for (const [d, n, g0, R0, yk] of [[4300, 13, 0.3, 430, 0.3], [3900, 12, 0.1, 330, 0.06]]) for (let k = 0; k < n; k++) {
    const az = PI + (k - (n - 1) / 2) * (1.9 / n) + rng.range(-0.02, 0.02), R = R0 * rng.range(0.8, 1.2);
    cloudDisc(m, [Math.sin(az) * d, R * yk, Math.cos(az) * d], R, 11, g0, 0.14, night ? NAVY : TEAL, night ? TEAL : CREAM, k % 2 ? 1 : -1);
  }
}

// ---------------------------------------------------------------- 6d. the portal frame on its calm disc, and the fire arcs (ship coordinates)
function buildPortalSet(m, foam) {
  const S0 = 438, H0 = 8, N = 72;
  const lit = (an) => 0.5 + 0.5 * Math.cos(an - 2.2);
  const ringAt = (r, s, gf) => { const q = []; for (let j = 0; j < N; j++) { const an = (j / N) * TAU; q.push([s, Math.cos(an) * r, H0 + Math.sin(an) * r, gf(an)]); } return q; };
  const band = (r0, r1, sf, sb, a, b, g0, gr) => {
    const gf = (an) => g0 + gr * lit(an);
    m.loft([ringAt(r0, sb, () => 0.35), ringAt(r0, sf, () => 0.35)], TEAL, CREAM);
    m.loft([ringAt(r0, sf, gf), ringAt(r1, sf, gf)], a, b);
    m.loft([ringAt(r1, sf, (an) => gf(an) - 0.25), ringAt(r1, sb, (an) => gf(an) - 0.25)], a, b);
    m.loft([ringAt(r1, sb, gf), ringAt(r0, sb, gf)], a, b);
  };
  band(7.3, 8.5, 437.0, 438.6, GOLD, CREAM, 0.72, 0.27);
  band(8.5, 9.9, 437.5, 438.6, GOLD, CREAM, 0.05, 0.34);
  band(9.9, 11.3, 438.0, 438.6, GOLD, CREAM, 0.7, 0.29);
  // sunburst crest over the ring, stepped piers with fan-palm motifs
  for (let k = 0; k < 9; k++) {
    const an = PI / 2 + (k - 4) * 0.17, len = k % 2 ? 3.2 : 5.0, w = 0.07;
    const pt = (r, a, g) => [438.3, Math.cos(a) * r, H0 + Math.sin(a) * r, g];
    m.tri(pt(11.1, an - w, 0.2), pt(11.1, an + w, 0.2), pt(11.3 + len, an, 0.95), GOLD, CREAM);
  }
  for (const sd of [1, -1]) {
    [[10.6, 13.6, 7.2, 436.7], [13.6, 16.0, 4.6, 437.0], [16.0, 18.2, 2.4, 437.3]].forEach(([p0, p1, h, sf], i) => {
      m.box(sf, 876 - sf + 0.6, sd * p0, sd * p1, -0.6, h, GOLD, CREAM, 0.42 + (sd < 0 ? 0.25 : 0) - i * 0.04, 0.95);
      m.box(sf - 0.2, 876 - sf + 0.8, sd * (p0 - 0.15), sd * (p1 + 0.15), h, h + 0.45, GOLD, CREAM, 0.1, 0.3);
      const cp = sd * (p0 + p1) / 2, L = h * 0.62;
      for (let k = 0; k < 7; k++) { const a = PI / 2 + (k - 3) * 0.3, q = (r, da, g) => [sf - 0.06, cp + Math.cos(a + da) * r * 0.5, 0.9 + Math.sin(a + da) * r, g]; m.quad(q(0.2, 0, 0.3), q(L * 0.6, -0.11, 0.45), q(L, 0, 0.7), q(L * 0.6, 0.11, 0.45), TEAL, CREAM); }
    });
  }
  // calm disc in stepped rings, a skirt of foam scallops, zigzag reflections of the ring
  const disc = (r0, r1, g, h) => { const A = [], B = []; for (let j = 0; j <= 48; j++) { const an = (j / 48) * TAU; A.push([S0 + Math.cos(an) * r0, Math.sin(an) * r0, h, g]); B.push([S0 + Math.cos(an) * r1, Math.sin(an) * r1, h, g]); } m.strip(A, B, NAVY, TEAL); };
  // a stepped pool: six rings in alternate half-steps, none darker than a quarter-step off navy
  [[0, 9, 0.5], [9, 17, 0.3], [17, 24, 0.5], [24, 31, 0.7], [31, 38.5, 0.5], [38.5, 46, 0.7]].forEach(([r0, r1, g]) => disc(r0, r1, g, 0.12));
  for (let j = 0; j < 46; j++) { const an = (j / 46) * TAU, c = Math.cos(an), s = Math.sin(an); m.mode(5, S0 + c * 46, s * 46, 0, j * 0.31 % 1); scallopW(m, [S0 + c * 46, s * 46, 0], -s, c, 6.2, 1.1, TEAL, CREAM, 0.3, 6, foam); }
  for (let p = -19; p <= 19; p += 2.4) for (const sf of [436.0, 439.9]) { if (Math.abs(p) < 6.6 && sf > 437) continue; m.mode(5, sf, p, 0, (p * 0.37 + 5) % 1); scallopW(m, [sf, p, 0], 0, 1, 2.5, Math.abs(p) < 7 ? 0.7 : 1.1, TEAL, CREAM, 0, 6, foam); }
  // zigzag reflections: of the ring down the centre, of the two arcs out to either side
  [[431.5, 0, 9, 0.2], [427, 0, 7, 0.45], [421.5, 0, 5, 0.7], [416.5, 0, 3.6, 0.8], [412, 0, 2.4, 0.85],
    [433, 15, 4, 0.3], [433, -15, 4, 0.3], [428.5, 17.5, 3.2, 0.5], [428.5, -17.5, 3.2, 0.5], [424, 20, 2.4, 0.7], [424, -20, 2.4, 0.7]].forEach(([s, pc, hwid, g], bi) => {
    const A = [], B = []; for (let p = -hwid, i = 0; p <= hwid + 0.01; p += 1.6, i++) { const z = s + (i % 2 ? 0.8 : -0.8); A.push([z - 0.42, pc + p, 0.2, g]); B.push([z + 0.42, pc + p, 0.2, g]); }
    m.mode(8, s, pc, 0, (bi * 0.31) % 1); m.strip(A, B, CREAM, TEAL);
  });
  m.mode(0);
}
function buildArcs(m, nozzles, foam) {
  nozzles.forEach(([s0, p0, h0, sd], ni) => {
    const p1 = -sd * (20 + ni % 3 * 5), s1 = s0 + 6 + (ni % 3) * 5, A = 46 - (ni % 3) * 4, NS = 30, U = [], L = [];
    const at = (t) => [lerp(s0, s1, t), lerp(p0, p1, t), h0 * (1 - t) + 4 * A * t * (1 - t)];
    for (let i = 0; i <= NS; i++) {
      const t = i / NS, c = at(t), a = at(Math.max(0, t - 0.01)), b = at(Math.min(1, t + 0.01));
      let tp = b[1] - a[1], th = b[2] - a[2]; const tl = Math.hypot(tp, th) || 1; tp /= tl; th /= tl;
      const w = 0.45 + 0.75 * t;
      U.push([c[0], c[1] - th * w, c[2] + tp * w, t]); L.push([c[0], c[1] + th * w, c[2] - tp * w, t]);
    }
    m.mode(3, 0, 0, 0, ni * 0.17); m.strip(U, L, CREAM, TEAL);
    // droplet fringe under the falling half
    for (let i = 14; i < NS; i += 2) { const c = at(i / NS); m.tri([c[0], c[1] - 0.8, c[2] - 0.5, i / NS], [c[0], c[1] + 0.8, c[2] - 0.5, i / NS], [c[0], c[1], c[2] - 2.6 - (i % 4) * 0.5, i / NS + 0.1], CREAM, TEAL); }
    const e = at(1);
    for (let k = 0; k < 3; k++) { m.mode(4, e[0], e[1] + (k - 1) * 2.5, 0, ni * 0.19 + k * 0.33); scallopW(m, [e[0], e[1] + (k - 1) * 2.5, 0], 0, 1, 8 - k, 5.5 - k, TEAL, CREAM, 0, 8, foam); }
  });
  m.mode(0);
}

// ---------------------------------------------------------------- 6e. wake, fog sheets, rain, searchlights
function makeWake(style, foam) {
  const P = [], K = [];
  for (const sd of [1, -1]) for (const [x, e, z] of [[0, 1, 0], [sd, 1, -1], [sd, -1, -1], [0, 1, 0], [sd, -1, -1], [0, -1, 0]]) { P.push(x, e, z); K.push(0, foam, TEAL, 0); }
  const ROWS = 18, COLS = 4, n = ROWS * COLS, W = new Float32Array(n * 3);
  for (let r = 0, i = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++, i++) { W[i * 3] = r; W[i * 3 + 1] = c; W[i * 3 + 2] = (r * 7 + c * 13) % 10 / 10; }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  geo.setAttribute('aInk', new THREE.BufferAttribute(new Float32Array(K), 4));
  geo.setAttribute('aWk', new THREE.InstancedBufferAttribute(W, 3)); geo.instanceCount = n;
  const mesh = new THREE.Mesh(geo, style.material({
    head: 'attribute vec3 aWk;\n', slide: 0,
    motion: /* glsl */`
      float age = fract(aWk.x/18.0 + uTime*0.06), par = mod(aWk.x, 2.0);
      float wkw = 5.0 + 17.0*age, sz = wkw*0.2;
      float lat = ((aWk.y - 1.75) + par*0.5)/2.0*wkw;
      float thin = smoothstep(0.0, 0.08, age)*(1.0 - smoothstep(0.7, 1.0, age));
      pos = vec3(lat + position.x*sz, 0.24, 155.0 - (311.0 + age*80.0) + position.z*sz*1.1 + position.y*0.15*sz*thin);
      g = 0.05 + 0.42*age + 0.2*step(0.5, fract(aWk.z + uTime*0.4)); glow = 0.0;`,
  }));
  mesh.frustumCulled = false;
  return mesh;
}
// flat cream sheets with scalloped edges and a low camber, lying at h 3-12 clear of the camera's corridor (the scattered
// ones keep 34 m from the path, the seven staged across the approach 30 m)
function buildFogSheets(m, rng, path, count, A = GOLD, B = CREAM) {
  // one sheet: centre (x, z), half extents ex (athwart) and ez (fore and aft), base height h
  const sheet = (x, z, ex, ez, h, T = 1.9) => {
    const N = 28, rim = [], top = [], long = Math.max(ex, ez);
    for (let j = 0; j < N; j++) {
      const an = (j / N) * TAU, sc = 0.78 + 0.22 * Math.abs(Math.sin(an * 3.5)), ca = Math.cos(an), sa = Math.sin(an);
      const px = sa * ex * sc * (ex === long ? 0.75 + 0.25 * Math.abs(sa) : 1), pz = ca * ez * sc * (ez === long ? 0.75 + 0.25 * Math.abs(ca) : 1);
      rim.push([155 - (z + pz), x + px, h, 0.35]); top.push([155 - (z + pz * 0.72), x + px * 0.72, h + T * 0.79, 0.75]);
    }
    m.loft([rim, top], A, B); m.fan([155 - z, x, h + T, 0.98], top, A, B); m.fan([155 - z, x, h, 0.2], rim, A, B);
  };
  // the approach: seven stepped sheets (a broad one with a smaller one on its back) lying ACROSS the view between the
  // entry and the bow (ship s, p, length athwart, breadth, height), two of them through the tugs, so the tugs stand
  // half-sunk and the bow rises out of the fog
  for (const [s, p, len, wid, h] of [[-122, -72, 84, 18, 1.4], [-80, 82, 74, 22, 1.6], [-40, -66, 82, 22, 1.8], [-14, -60, 64, 16, 3.0], [-11, 78, 70, 16, 2.6], [-136, 104, 62, 14, 3.4], [-62, -128, 92, 18, 4.4]]) {
    let ok = true; for (let k = -2; k <= 2 && ok; k++) if (path.nearestXZ(p + k * len * 0.25, 155 - s).dist < 30) ok = false;
    if (!ok) continue;
    sheet(p, 155 - s, len * 0.5, wid * 0.5, h, 4.4); sheet(p + Math.sign(p) * len * 0.1, 155 - s, len * 0.3, wid * 0.36, h + 4.4, 3.4);
  }
  let made = 0;
  for (let tries = 0; tries < count * 8 && made < count; tries++) {
    const x = rng.range(-320, 320), z = rng.range(-420, 520), len = rng.range(60, 170), wid = rng.range(16, 34), h = rng.range(3.5, 11);
    if (Math.abs(x) < 60 && z > -330 && z < 215) continue;                 // never on the liner or the portal
    let ok = true; for (let k = -1; k <= 1 && ok; k++) if (path.nearestXZ(x, z + k * len * 0.45).dist < wid * 0.5 + 34) ok = false;
    if (!ok) continue;
    made++;
    sheet(x, z, wid * 0.5, len * 0.5, h);
  }
}
function makeRain(style, rng, count) {
  const P = [], K = [];
  for (const [u, v] of [[0, -1], [1, -1], [1, 1], [0, -1], [1, 1], [0, 1]]) { P.push(u, v, 0); K.push(0.9, CREAM, CREAM, 0); }
  const R = new Float32Array(count * 4); for (let i = 0; i < count; i++) { R[i * 4] = rng(); R[i * 4 + 1] = rng(); R[i * 4 + 2] = rng(); R[i * 4 + 3] = rng.range(1.6, 3.4); }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  geo.setAttribute('aInk', new THREE.BufferAttribute(new Float32Array(K), 4));
  geo.setAttribute('aR', new THREE.InstancedBufferAttribute(R, 4)); geo.instanceCount = count;
  const uCam = { value: new THREE.Vector3() };
  const mesh = new THREE.Mesh(geo, style.material({
    head: 'attribute vec4 aR; uniform vec3 uCam; uniform float uPx;\n', slide: 0, uniforms: { uCam },
    motion: /* glsl */`
      vec3 box = vec3(110.0, 60.0, 110.0), fall = normalize(vec3(0.42, -1.0, 0.18));
      vec3 p0 = aR.xyz*box + fall*uTime*26.0;
      vec3 c0 = uCam + mod(p0 - uCam + box*0.5, box) - box*0.5 + fall*position.x*aR.w;
      vec3 toCam = uCam - c0; float dist = length(toCam);
      vec3 nn = cross(fall, toCam); nn /= max(length(nn), 1e-4);
      pos = c0 + nn*position.y*max(0.03, 0.75*uPx*dist)*smoothstep(1.5, 5.0, dist); glow = 0.0;`,
  }));
  mesh.frustumCulled = false;
  return { mesh, uCam };
}
function makeSearchlights(style, origin) {
  const m = new WB();
  for (let k = 0; k < 3; k++) {
    m.aux = [origin.x, origin.y, origin.z, k / 3];
    const put = (x, y, z, g) => { m.P.push(origin.x + x, origin.y + y, origin.z + z); m.K.push(g, TEAL, CREAM, 0); m.X.push(...m.aux); };
    for (const [ax, ay] of [[1, 0], [0, 1]]) { put(0, 0, 0, 0.1); put(-ax * 34, -ay * 34, 620, 0.3); put(ax * 34, ay * 34, 620, 0.3); }
  }
  const mesh = new THREE.Mesh(wbGeometry(m), style.material({
    head: 'attribute vec4 aAux;\n', slide: 0, uniforms: { uHazeP: { value: new THREE.Vector3(0, 0, 0) } },
    motion: /* glsl */`
      { vec3 rel = position - aAux.xyz; float k = aAux.w*3.0;
        float yaw = 0.5 + k*1.9 + 0.7*sin(uTime*0.23 + k*2.1), el = 0.34 + 0.16*sin(uTime*0.31 + k*1.3);
        float ce = cos(el), se = sin(el); rel = vec3(rel.x, rel.y*ce + rel.z*se, rel.z*ce - rel.y*se);
        float cy = cos(yaw), sy = sin(yaw); pos = aAux.xyz + vec3(rel.x*cy + rel.z*sy, rel.y, rel.z*cy - rel.x*sy); glow = 0.0; }`,
  }));
  mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- 6f. gulls and dolphins (instanced, animated in the vertex shader)
function makeGulls(style, list) {
  const P = [], K = [];
  const tri = (a, b, c, g, ia, ib) => { for (const q of [a, b, c]) { P.push(q[0], q[1], q[2]); K.push(g, ia, ib, 0); } };
  tri([0, 0, 0.3], [0.09, 0, 0], [-0.09, 0, 0], 0.98, GOLD, CREAM); tri([0.09, 0, 0], [0, 0, -0.34], [-0.09, 0, 0], 0.92, GOLD, CREAM);
  tri([0, 0.02, 0.3], [0.04, 0.02, 0.4], [-0.04, 0.02, 0.4], 0.2, GOLD, CREAM); tri([0.07, 0, -0.2], [0, 0, -0.46], [-0.07, 0, -0.2], 0.7, GOLD, CREAM);
  for (const sd of [1, -1]) {
    const a = [sd * 0.06, 0, 0.13], b = [sd * 0.06, 0, -0.1], c = [sd * 0.35, 0, 0.2], d = [sd * 0.35, 0, -0.02], e = [sd * 0.6, 0, 0.1], f = [sd * 0.58, 0, -0.08], t = [sd * 0.7, 0, -0.1];
    tri(a, c, d, 0.62, GOLD, CREAM); tri(a, d, b, 0.62, GOLD, CREAM); tri(c, e, f, 0.95, GOLD, CREAM); tri(c, f, d, 0.95, GOLD, CREAM); tri(e, t, f, 0.05, NAVY, TEAL);
  }
  const n = list.length, A = new Float32Array(n * 4), B = new Float32Array(n * 4), C = new Float32Array(n * 2);
  list.forEach((q, i) => { A.set(q.a, i * 4); B.set(q.b, i * 4); C.set(q.c, i * 2); });
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  geo.setAttribute('aInk', new THREE.BufferAttribute(new Float32Array(K), 4));
  geo.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); geo.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4)); geo.setAttribute('aC', new THREE.InstancedBufferAttribute(C, 2));
  geo.instanceCount = n;
  const uU = { value: 0 }, uCam = { value: new THREE.Vector3() };
  const mesh = new THREE.Mesh(geo, style.material({
    head: 'attribute vec4 aA; attribute vec4 aB; attribute vec2 aC; uniform float uU; uniform vec3 uCam;\n', slide: 0, uniforms: { uU, uCam },
    motion: /* glsl */`
      vec3 ctr, fwd; float sz = aC.y, ph;
      if (aC.x < 0.5) {            // wheeling on an ellipse
        float an = aB.x + uTime*aB.y; ph = aB.x*5.0;
        ctr = aA.xyz + vec3(cos(an)*aA.w*aB.w, aB.z*sin(uTime*0.6 + ph), sin(an)*aA.w);
        fwd = vec3(-sin(an)*aB.w, 0.0, cos(an))*sign(aB.y);
      } else {                     // scripted: at aA.xyz when the camera is at u = aA.w
        float du = uU - aA.w; ph = aB.w;
        ctr = aA.xyz + aB.xyz*du + vec3(0.25*sin(uTime*1.3 + ph), 0.22*sin(uTime*1.9 + ph*2.0), 0.0);
        fwd = aB.xyz; sz *= 1.0 - smoothstep(0.1, 0.14, abs(du));
      }
      fwd /= max(length(fwd), 1e-4);
      vec3 rgt = cross(fwd, vec3(0.0, 1.0, 0.0)); rgt /= max(length(rgt), 1e-4); vec3 up = cross(rgt, fwd);
      float fl = uTime*(6.0 + 2.0*fract(ph)) + ph, ax = abs(position.x);
      float glide = smoothstep(-0.2, 0.5, sin(uTime*0.5 + ph*1.7));
      float lift = (min(ax, 0.35)/0.35*sin(fl)*0.17 + max(ax - 0.35, 0.0)/0.35*sin(fl - 0.9)*0.26)*glide + ax*0.14;
      sz *= smoothstep(0.7, 2.0, length(ctr - uCam));
      pos = ctr + (rgt*position.x + up*(position.y + lift) + fwd*position.z)*sz; glow = 0.0;`,
  }));
  mesh.frustumCulled = false;
  return { mesh, uU, uCam };
}
function makeDolphins(style, list, foam) {
  const m = new WB(); m.T = (s, p, h) => [HALF - s, p, h];      // builder (z forward, x, y) -> position (x, y, z)
  const prof = [[-1.3, 0.02, 0.05], [-1.05, 0.1, 0.06], [-0.7, 0.2, 0.03], [-0.2, 0.3, 0], [0.3, 0.31, 0.02], [0.75, 0.24, 0.06], [1.0, 0.15, 0.1], [1.3, 0.04, 0.12]];
  const bend = (z) => -0.28 * z * z;
  const rings = prof.map(([z, r, dy]) => { const q = []; for (let j = 0; j < 8; j++) { const an = (j / 8) * TAU; q.push([z, Math.cos(an) * r * 0.85, bend(z) + dy + Math.sin(an) * r, 0.42 - 0.4 * Math.sin(an)]); } return q; });
  m.loft(rings, TEAL, CREAM);
  m.tri([-0.15, 0, bend(-0.15) + 0.28, 0.02], [0.3, 0, bend(0.3) + 0.3, 0.02], [-0.25, 0, bend(-0.2) + 0.72, 0.2], NAVY, TEAL);
  for (const sd of [1, -1]) {
    m.tri([-1.2, 0, bend(-1.2) + 0.05, 0.05], [-1.62, sd * 0.42, bend(-1.5) + 0.02, 0.2], [-1.36, 0, bend(-1.36) + 0.05, 0.1], NAVY, TEAL);
    m.tri([0.5, sd * 0.22, bend(0.5) - 0.12, 0.1], [0.2, sd * 0.24, bend(0.2) - 0.14, 0.1], [0.12, sd * 0.62, bend(0.2) - 0.42, 0.3], NAVY, TEAL);
  }
  m.T = null;
  // two splash fans per dolphin, marked by glow = 1 (take-off) and 2 (landing)
  const splash = (k) => { const b0 = m.P.length / 3; const mm = { fan: (c, rim) => { for (let j = 0; j + 1 < rim.length; j++) for (const q of [c, rim[j], rim[j + 1]]) { m.P.push(q[0], q[1], q[2]); m.K.push(q[3], TEAL, CREAM, k); m.X.push(0, 0, 0, 0); } }, strip: (A, B) => { for (let j = 0; j + 1 < A.length; j++) for (const q of [A[j], A[j + 1], B[j + 1], A[j], B[j + 1], B[j]]) { m.P.push(q[0], q[1], q[2]); m.K.push(0.9, foam, foam, k); m.X.push(0, 0, 0, 0); } } };
    const rim = [], rim2 = []; for (let j = 0; j <= 8; j++) { const an = (j / 8) * PI; rim.push([Math.cos(an) * 1.0, Math.sin(an) * 1.2, 0, 0.9]); rim2.push([Math.cos(an) * 1.25, Math.sin(an) * 1.5, 0, 0.9]); }
    mm.fan([0, 0, 0, 0.35], rim); mm.strip(rim, rim2); return b0; };
  splash(1); splash(2);
  const geo0 = wbGeometry(m), n = list.length, D = new Float32Array(n * 4);
  list.forEach((q, i) => D.set(q, i * 4));
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', geo0.getAttribute('position')); geo.setAttribute('aInk', geo0.getAttribute('aInk'));
  geo.setAttribute('aD', new THREE.InstancedBufferAttribute(D, 4)); geo.instanceCount = n;
  const uU = { value: 0 };
  const mesh = new THREE.Mesh(geo, style.material({
    head: 'attribute vec4 aD; uniform float uU;\n', slide: 0.03, uniforms: { uU },
    motion: /* glsl */`
      float t = (uU - aD.z)/0.036, on = step(0.0, t)*step(t, 1.0); t = clamp(t, 0.0, 1.0);
      float sc = aD.w;
      if (glow > 0.5) {            // splash fans at take-off and landing
        float tc = glow > 1.5 ? 0.9 : 0.1, e = on*(1.0 - smoothstep(0.0, 0.16, abs(t - tc)));
        pos = vec3(aD.x + position.x*sc*e, position.y*sc*e - 0.05, aD.y + (tc - 0.5)*5.6*sc*0.8);
      } else {
        float y = -1.0 + 4.4*4.0*t*(1.0 - t)*0.9, z = (t - 0.5)*5.6;
        float pitch = atan(4.4*3.6*(1.0 - 2.0*t), 5.6);
        float c = cos(pitch), s = sin(pitch);
        vec3 q = vec3(position.x, position.y*c + position.z*s, position.z*c - position.y*s);
        pos = vec3(aD.x, y*sc*0.75, aD.y + z*sc*0.8) + q*sc*on; pos.y = mix(-4.0, pos.y, on);
      }
      glow = 0.0;`,
  }));
  mesh.frustumCulled = false;
  return { mesh, uU };
}

// ---------------------------------------------------------------- 7. the world
export default {
  id: 'blue-riband-poster',
  name: 'The Blue Riband',
  category: 'ocean',
  weirdness: 0.25,
  media: ['air', 'water'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const mood = pickMood(ctx), cast = mood.cast, rain = mood.weather === 'rain', fog = mood.weather === 'fog';
    const scene = new THREE.Scene(); scene.background = mood.bands[2].clone();

    // ---- hero: the liner at the origin, world space == ship-local space
    const hero = await buildHero(ctx, { palette: mood.inks, livery: cast.livery, funnels: cast.funnels, streamers: Math.round(300 * density), night: mood.night });
    scene.add(hero.object);
    const style = hero.style, A = hero.anchors;
    style.uniforms.uHaze.value.copy(mood.haze); style.uniforms.uHazeP.value.set(520, 3, 0.22);
    await ctx.yield();

    // ---- path (ship coordinates from the hero) and the painted sun
    const path = makePath(A.flyThrough);
    const el = mood.sunEl * D2R, sunDir = new THREE.Vector3(-Math.sin(40 * D2R) * Math.cos(el), Math.sin(el), -Math.cos(40 * D2R) * Math.cos(el));
    const sTab = []; for (let i = 0; i <= 300; i++) sTab.push(HALF - path.pointAt(i / 300, new THREE.Vector3()).z);
    const uOfS = (s) => { let best = 0, bd = 1e9; for (let i = 0; i <= 300; i++) { const d = Math.abs(sTab[i] - s); if (d < bd) { bd = d; best = i / 300; } } return best; };
    await ctx.yield();

    // ---- sky and sea
    const tugSeats = [[-80, 50], [-40, -45], [300, -45]], fireSeats = [[455, 50], [455, -50]];
    const clears = [[0, HALF - 438, 45], ...tugSeats.map(([s, p]) => [p, HALF - s, 11]), ...fireSeats.map(([s, p]) => [p, HALF - s, 13])];
    const sea = makeSea(style, mood, rng, clears, { R: 5000, detail, height: rain ? 1.5 : 1, corr: rain ? 0.62 : 1 });
    scene.add(sea.group);
    const sky = makeSky(mood, sunDir, 5400, sea.uniforms); scene.add(sky.mesh);
    await ctx.yield();

    // ---- set dressing in one mesh: portal frame and disc, fireboats and their arcs, whistle plumes, fog sheets
    const uWhistle = { value: 0 };
    const setMat = () => style.material({ head: SET_HEAD, motion: SET_MOTION, uniforms: { uWhistle }, slide: 0.04, phase: rng.range(0, TAU) });
    const set = new WB();
    buildPortalSet(set, mood.foam);
    await ctx.yield();
    const nozzles = [];
    for (const [s0, p0] of fireSeats) {
      set.T = placeT(s0 - 16, p0, 0); buildTug(set, 'fire'); set.T = null;
      await ctx.yield();
      const sd = Math.sign(p0);
      nozzles.push([s0 - 16 + 21.1, p0, 15.1, sd], [s0 - 16 + 5.6, p0, 7.9, sd], [s0 - 16 + 27.1, p0, 5.3, sd]);
    }
    buildArcs(set, nozzles, mood.foam);
    const wh = A.whistle; set.mode(6, HALF - wh.z, 0, wh.y + 0.4, 0);
    for (const dp of [-0.75, 0.75]) puffW(set, [HALF - wh.z - 2.6, dp * 2.2, wh.y + 2.4], 2.4, GOLD, CREAM);
    set.mode(0);
    await ctx.yield();
    if (fog) buildFogSheets(set, rng, path, Math.round(30 * density), mood.night ? TEAL : GOLD, CREAM);
    await ctx.yield();
    const setMesh = new THREE.Mesh(wbGeometry(set), setMat()); setMesh.frustumCulled = false; scene.add(setMesh);
    await ctx.yield();

    // ---- escorts: three tugs (or a trio of yachts), nodding on the CPU
    const tb = new WB(); tb.T = objT(cast.yachts ? 12 : 14); if (cast.yachts) buildYacht(tb); else buildTug(tb, 'tug'); tb.T = null;
    const tugGeo = wbGeometry(tb), tugMat = setMat(), tugs = tugSeats.map(([s, p], i) => {
      const mesh = new THREE.Mesh(tugGeo, tugMat); mesh.position.copy(SHIP(s, p, 0)); mesh.frustumCulled = false; mesh.userData.ph = i * 2.1; scene.add(mesh); return mesh;
    });

    await ctx.yield();
    // ---- clouds and the bank astern
    const cb = new WB(); buildClouds(cb, mood, rng, Math.atan2(sunDir.x, sunDir.z), detail);
    const clouds = new THREE.Mesh(wbGeometry(cb), style.material({ head: CLOUD_HEAD, motion: CLOUD_MOTION, slide: 0.03, uniforms: { uSpin: { value: 2 }, uHazeP: { value: new THREE.Vector3(0, 0, 0) } } }));
    clouds.frustumCulled = false; scene.add(clouds);
    await ctx.yield();

    // ---- wake, weather
    scene.add(makeWake(style, CREAM));
    await ctx.yield();
    const rainFx = rain ? makeRain(style, rng, Math.round(460 * detail * density)) : null; if (rainFx) scene.add(rainFx.mesh);
    if (mood.night) scene.add(makeSearchlights(style, A.bridge.clone().add(new THREE.Vector3(0, 5, 0))));

    await ctx.yield();
    // ---- aircraft: the flying boat (or three biplanes in echelon); overhead when the camera is at u 0.575
    const U_AIR = cast.biplanes ? 0.575 : 0.602, V_AIR = cast.biplanes ? 1200 : 1100;
    const airDir = new THREE.Vector3(0.05, 0, 1).normalize(), airP1 = path.pointAt(U_AIR).add(new THREE.Vector3(-7, cast.biplanes ? 10 : 9, 0));
    const ab = new WB(); ab.T = objT(cast.biplanes ? 3 : 10); if (cast.biplanes) buildBiplane(ab); else buildFlyingBoat(ab); ab.T = null;
    const airGeo = wbGeometry(ab), airMat = setMat(), air = new THREE.Group(), airPos = new THREE.Vector3();
    (cast.biplanes ? [[0, 0, 0], [-8, 1.5, -9], [8, 3, -18]] : [[0, 0, 0]]).forEach((o) => { const mesh = new THREE.Mesh(airGeo, airMat); mesh.position.set(o[0], o[1], o[2]); mesh.frustumCulled = false; if (cast.biplanes) mesh.scale.setScalar(1.25); air.add(mesh); });
    air.rotation.y = Math.atan2(airDir.x, airDir.z); scene.add(air);
    const airAt = (time, u, out) => out.copy(airP1).addScaledVector(airDir, V_AIR * (u - U_AIR)).setY(airP1.y + 14 * clamp(U_AIR - u, -0.2, 1) * 4 + 0.6 * Math.sin(time * 0.9));

    // ---- rare: the airship hanging in the ray fan, and its lozenge shadow sliding over the sea
    let airship = null, shadow = null;
    if (rare) {
      const sb = new WB(); sb.T = objT(122); buildAirship(sb); sb.T = null;
      airship = new THREE.Mesh(wbGeometry(sb), style.material({ slide: 0.05, uniforms: { uHazeP: { value: new THREE.Vector3(0, 0, 0) } } }));
      airship.position.set(-354, 325, -729); airship.scale.setScalar(1.3); airship.frustumCulled = false; scene.add(airship);
      const lb = new WB(); lb.T = objT(0); lb.quad([-150, 0, 0, 0.55], [0, 26, 0, 0.55], [150, 0, 0, 0.55], [0, -26, 0, 0.55], NAVY, TEAL); lb.T = null;
      shadow = new THREE.Mesh(wbGeometry(lb), style.material({ slide: 0, uniforms: { uHazeP: { value: new THREE.Vector3(0, 0, 0) } } }));
      shadow.position.set(-200, 0.3, -560); shadow.frustumCulled = false; scene.add(shadow);
    }
    await ctx.yield();

    // ---- gulls: a wheel over the bow waves, a string along the funnels, and twenty scripted close passes
    const gl = [], nWheel = Math.round(120 * detail), nFun = Math.round(60 * detail);
    for (let i = 0; i < nWheel; i++) {
      const r = rng.range(14, 46), sp = rng.range(0.14, 0.3) * rng.sign();
      gl.push({ a: [rng.range(-30, 44), rng.range(9, 34), 162 + r + rng.range(0, 38), r], b: [rng.range(0, TAU), sp, rng.range(0.6, 2.2), rng.range(0.6, 1)], c: [0, 2.0] });
    }
    for (let i = 0; i < nFun; i++) {
      const r = rng.range(95, 110);
      gl.push({ a: [rng.range(-3, 3), rng.range(70, 84), -45 + rng.range(-4, 4), r], b: [rng.range(0, TAU), rng.range(0.07, 0.12) * rng.sign(), rng.range(0.6, 2), rng.range(0.2, 0.32)], c: [0, 2.2] });
    }
    const up = new THREE.Vector3(0, 1, 0), tg = new THREE.Vector3(), rt = new THREE.Vector3(), p0 = new THREE.Vector3();
    [0.075, 0.15, 0.375, 0.66].forEach((uk, gi) => {
      const lat = [-2.4, 1.7, 2.7, -1.8, 3.4], ver = [0.7, 1.1, 0.1, -0.2, 1.5], along = [1, 4, 7, 10, 14];
      for (let k = 0; k < 5; k++) {
        const uu = uk + along[k] / path.length; path.pointAt(uu, p0); path.tangentAt(uu, tg); rt.crossVectors(tg, up).normalize();
        const sgn = gi % 2 ? -1 : 1; p0.addScaledVector(rt, lat[k] * sgn).y += ver[k] + (p0.y < 4 ? 0.5 : 0);
        const v = tg.clone().multiplyScalar(9 * 40).addScaledVector(rt, rng.range(-0.6, 0.6) * 40);
        gl.push({ a: [p0.x, p0.y, p0.z, uk], b: [v.x, v.y, v.z, rng.range(0, TAU)], c: [1, 1.0] });
      }
    });
    const gulls = makeGulls(style, gl); scene.add(gulls.mesh);
    await ctx.yield();

    // ---- dolphins in the port bow wave, leaping as the camera comes up on each
    const dl = [14, 19, 24.5, 30, 35.5, 41].map((s, i) => { const q = path.pointAt(uOfS(s - 4)); return [q.x + 9.2 + (i % 2) * 1.3, HALF - s, uOfS(s - 24), 1.25]; });
    const dolphins = makeDolphins(style, dl, mood.foam); scene.add(dolphins.mesh);
    await ctx.yield();

    const camP = new THREE.Vector3(), portalAt = A.portalSeat.position.clone(), fun2 = (A.funnelTops[1] || A.funnelTops[0]).clone(), pulse = (u, c) => smoothstep(c - 0.008, c + 0.004, u) * (1 - smoothstep(c + 0.012, c + 0.03, u));
    return {
      scene, path, duration: 40, ride: 'none', style: 'none',
      title: 'The Blue Riband: ' + mood.name,
      camera: { fov: 62, near: 0.4, far: 6000, sway: 0.5, bank: 0.5 },
      pois: [
        { at: A.bowMedallion.clone(), from: 0, to: 0.2, weight: 0.5 },
        { at: new THREE.Vector3(23, 2, HALF - 34), from: 0.235, to: 0.3, weight: 0.3 },
        { at: fun2, from: 0.4, to: 0.55, weight: 0.5 },
        { at: (time, u) => airAt(time, u, airPos), from: cast.biplanes ? 0.49 : 0.5, to: cast.biplanes ? 0.58 : 0.608, weight: cast.biplanes ? 0.45 : 0.5, fade: 0.25 },
        { at: SHIP(305, 2, 20), from: 0.6, to: 0.72, weight: 0.42 },
        { at: portalAt, from: 0.7, to: 1, weight: 0.5 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#F3E7C9', glow: 0.8, revealDistance: 260 },
      // flat: no tone map, so the five inks reach the screen as the brief's hexes; no bloom (a lit lamp is a lighter ink)
      post: { flat: 1, exposure: 1, bloom: { strength: 0, radius: 0.4, threshold: 1.0 },
        grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0, aberration: 0 } },
      update(dt, time, camera, u = 0) {
        camP.setFromMatrixPosition(camera.matrixWorld);       // the camera behind a portal has only its world matrix set
        hero.update(dt, time, camera);
        sky.mesh.position.copy(camP); sky.uniforms.uTime.value = time; sky.uniforms.uCamW.value.copy(camP);
        sea.update(time, camP);
        gulls.uU.value = u; gulls.uCam.value.copy(camP); dolphins.uU.value = u;
        uWhistle.value = Math.max(pulse(u, 0.4875), pulse(u, 0.525));
        for (const t of tugs) {
          const ph = t.userData.ph;
          t.rotation.x = 0.035 * Math.sin(time * 0.9 + ph); t.position.y = 0.22 * Math.sin(time * 1.1 + ph * 1.7);
          t.rotation.z = cast.yachts ? -0.13 + 0.04 * Math.sin(time * 0.7 + ph) : 0.02 * Math.sin(time * 0.6 + ph);
        }
        airAt(time, u, air.position); air.rotation.z = 0.05 * Math.sin(time * 0.8);
        if (rainFx) rainFx.uCam.value.copy(camP);
        if (airship) { airship.rotation.y = 1.15 + time * 0.012; shadow.position.x = -200 + 40 * Math.sin(time * 0.05); shadow.rotation.y = airship.rotation.y; }
      },
      dispose() {},
    };
  },
};
