// THE CITY IN THE LAKE: hero set piece.
// A city that exists only as a reflection: real geometry mirrored in y under a sheet of water and
// lit by its own evening sun. Campanile (400 m deep, four legs) with a 382 m pendulum (pivot in the belfry) whose gold
// finial kisses the surface from beneath every 4 s and sends a true ring of ripples out; the grand
// canal of palazzi with two shop-bridges; the great glass dome (portal seat in its oculus); a skirt
// of houses, towers and lesser domes melting into rose haze.
//
// FRAME: local frame == the brief's world frame shifted so the campanile touch point is the origin.
//   Place hero.object at world (0, 0, 560), NO rotation, NO scale (shaders assume this). The course is
//   +Z: the camera arrives from -Z, the canal runs local z 40..300, the dome is centred at z 540.
//   Water plane is local y 0; everything of the city is at y < 0 (roofs deepest).
// SIZE: radius 230 / height 100 are viewer hints only (they keep the orbit above the water). Real extent:
//   houses to ~640 m from (0, 0, 180); deepest point -404 (campanile); nothing at all above y 0.
// OPTS: palette (7 hex, brief order), detail 0.6..1 (thins far houses and pigeons only), sceneFog (0.35),
//   water (default true: draws its own lake as two passes, an opaque no-depth-write lower-sky pass at
//   renderOrder 1 and a fresnel veil at renderOrder 4, radius opts.waterRadius 3200; pass false if the
//   world draws the lake itself and then share hero.glsl + hero.uniforms so ripples match the shiver),
//   upperSky: [horizonHex, zenithHex] for the veil, upperSun: [x,y,z] direction to the morning sun.
// SKY BELOW: glsl.lowerSky = gradient + low sun + three decks of long cloud bars (far, middle, near; lit edge uBarA,
//   shaded body uBarB) + moon; lowerSkyG = gradient and sun only (haze, window glass, gold). uniforms.uPGlow (world
//   x, y, z, amount) lights the dome's glass and ribs with the portal's teal. The campanile's ring leads the touch
//   by 0.55 s, so a ring 9 m out already stands round the finial as it kisses the surface.
// HOOKS: hero.setProgress(u, duration = 46): call every frame; eases the pendulum's phase so the finial
//   touches exactly at u 0.49 (and every 4 s around it; it keeps swinging if u stalls) and ramps lit
//   windows 30% -> 85% by u 0.9. Never called: both run on time. hero.setBarge(x, z, amount) pins the
//   state barge and its V-wake (heading +Z), e.g. 10 m left of the camera from u 0.55; default: it rows
//   a racetrack round the canal. hero.uniforms.uFlock (x, z, depth, radius) moves the pigeons.
// ANCHORS (local): touchPoint; pendulumPivot (0,-382,0); canalAxis(z) -> x of the canal centre (z 40..300),
//   bridges [z, z]; flyThrough: ordered camera line (reveal at 70 m, 7 m right of the touch point at 5 m,
//   the canal at 2.5 m, crest over the basin, dive); every point is above water and nothing of the piece
//   is above y 0, so clearance is unlimited until the dive, which passes 8 m inside the dome rim;
//   (the world flies its own route: the same seat, reached by a narrowing spiral round the bowl and a dive over its rim)
//   portalSeat {position (0,-62,540), normal (back up the dive), radius 7} in the gold oculus ring
//   (inner radius ~9.5); diveLine [from, to]; domeCenter, domeRadius; posts [[x,z],...]: lit lamp
//   standards below (stand the bare mooring posts exactly above); ferries(time) -> [[x,z,heading] x3]
//   (float the punts above); bargeAt(time) -> [x,z]; viewpoints; lowerSunDir (world-space, below horizon).
// RENDER ORDER: lake base 1, city + pendulum + vessels + pigeons + foot panes 2 (all opaque, depth-written),
//   dome glass 3 (transparent), veil 4 (transparent). Building feet are OPAQUE panes of the same water (CAP_VERT /
//   WATER_CAP_FRAG: the lake's own surface, the lower sky bent by the ripple, a little shaded, with a thin dark line
//   where wall meets water), so no building shows another through itself; only the veil is a veil.
// THE CITY'S PLAN: houses are plots of one to three wings (wing / houseCell: gabled pairs, L and U courts of open water,
//   walled gardens with hanging cypresses), cut by side canals, squares and basins; landmarks stand in piazzas of their
//   own (L.extra): the island church at the end of the 14-arch bridge (it runs 210 m from the island to a gate tower),
//   the first hanging church and its low campanile by the entry, twin towers, the great church and the clock tower
//   either side of the canal mouth. The lower sun stands well round to the side (+x), so every block shows a lit
//   face and a shaded one. Far walls draw each window as a soft pane, a share of them lit (CITY_FRAG, 'far').
// COST: ~107k triangles, 8 draw calls (6 without the lake), no lights, no textures, ~200 ms build.
// LIGHT: none needed and none used. The city is lit in-shader by the lower sun (behind-right, 7 deg
//   up in its own upside-down frame: apricot sun, violet shade) and hazed with its own rose air (half
//   strength at 900 m); scene fog is laid on top at opts.sceneFog so the city never goes blue.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const PALETTE = ['#CFE4F2', '#8FB7A5', '#2E5D73', '#F3B8A0', '#E8935E', '#5B4A7A', '#E9C24A'];
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- shared GLSL
const GLSL_NOISE = /* glsl */`
float h11(float n){ return fract(sin(n*127.1)*43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float vn2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
float fb2(vec2 p){ return vn2(p)*.55 + vn2(p*2.13+7.1)*.3 + vn2(p*4.7+3.3)*.15; }
`;
// One ripple function for water and city. p: local xz. Returns (height, dh/dx, dh/dz).
const GLSL_UNI = /* glsl */`
uniform float uTime, uSwing4;      // seconds; uSwing4 = seconds since the last touch (0..4)
uniform vec4 uBarge;               // x, z, amount, heading sign
uniform vec3 uSkyPeach, uSkyRose, uSkyViolet, uSunL;   // uSunL: lower sun dir, upright frame
uniform vec4 uRings[8];            // little rings (fish, swallows, the dive): x, z (local), age s, amplitude m
uniform vec4 uWakes[3];            // ferry wakes under the empty punts: x, z, heading rad, amount
uniform float uRain;               // sun-shower: a field of small rings, 0..1
uniform vec2 uCamL;                // the eye, in the city's own plan (rain rings fade with distance)
uniform vec3 uBarA, uBarB, uSunGlow;   // lower sky: cloud bar colours (low, high), sun glow colour
uniform vec4 uMoon;                // lower sky: thin moon direction (upright frame, unit) and strength
uniform vec4 uPGlow;               // the portal's glow: world position and amount
`;
const GLSL_RIPPLE = /* glsl */`
vec3 ripple(vec2 p){
  float r = length(p); vec2 dir = p / max(r, 1e-3);
  const float SPD = 17., SPC = 68., LAM = 7.0, WID = 6.0;
  float x = r - SPD*(uSwing4 + .55);      // the bulge the bob pushes ahead of it: a ring already round the finial as it touches
  float k = floor(x/SPC + .5);
  float xr = x - k*SPC, Rk = r - xr;
  float amp = .17 * smoothstep(1., 10., Rk) * exp(-Rk/420.) / sqrt(1. + Rk/45.);
  float ph = 6.2832*xr/LAM, g = exp(-(xr*xr)/(WID*WID));
  float h = amp*cos(ph)*g;
  float dr = amp*g*(-(6.2832/LAM)*sin(ph) - 2.*xr/(WID*WID)*cos(ph));
  vec2 s = dir*dr;
  // two swell octaves
  vec2 d1 = vec2(.83,.56), d2 = vec2(-.42,.91);
  float a1 = dot(p,d1)*.19 + uTime*.8, a2 = dot(p,d2)*.43 - uTime*1.25;
  h += .035*sin(a1) + .018*sin(a2);
  s += d1*(.035*.19*cos(a1)) + d2*(.018*.43*cos(a2));
  // V-wake of the barge that is not there
  vec2 q = p - uBarge.xy; float back = clamp(-q.y*uBarge.w, -10., 400.);
  float arm = clamp(abs(q.x) - back*.36 - .8, -30., 30.);
  float wv = uBarge.z * smoothstep(0., 4., back) * exp(-back/70.) * exp(-arm*arm/3.2);
  h += .14*wv*cos(arm*2.1);
  s.x += sign(q.x)*wv*(-.14*2.1*sin(arm*2.1) - .14*arm/1.6*cos(arm*2.1));
  for (int i = 0; i < 8; i++) {      // small rings
    vec4 rg = uRings[i];
    vec2 q1 = p - rg.xy; float r1 = length(q1);
    float x1 = r1 - 3.4*rg.z;
    float e1 = rg.w * exp(-(x1*x1)/2.6) * smoothstep(0., .7, r1);
    float p1 = x1*4.4;
    h += e1*cos(p1);
    s += q1/max(r1, 1e-3) * (e1*(-4.4*sin(p1) - (x1/1.3)*cos(p1)));
  }
  for (int i = 0; i < 3; i++) {      // ferry wakes
    vec4 wk = uWakes[i];
    vec2 q2 = p - wk.xy; float c2 = cos(wk.z), s2 = sin(wk.z);
    vec2 rt = vec2(c2, -s2);
    float bk = clamp(-dot(q2, vec2(s2, c2)), -10., 300.), lat = dot(q2, rt);
    float ar = clamp(abs(lat) - bk*.3 - .9, -30., 30.);
    float w2 = wk.w * smoothstep(0., 4., bk) * exp(-bk/42.) * exp(-ar*ar/2.4);
    h += .1*w2*cos(ar*2.4);
    s += rt * (sign(lat)*w2*(-.24*sin(ar*2.4) - .083*ar*cos(ar*2.4)));
  }
  float rainK = uRain * (1. - smoothstep(40., 150., length(p - uCamL)));
  if (rainK > 0.) {                  // a sun-shower's rings
    vec2 g = p*.26, gc = floor(g), gf = fract(g) - .5;
    float hh = fract(sin(dot(gc, vec2(127.1, 311.7)))*43758.5453), h2 = fract(hh*57.31);
    float tt = fract(uTime*.55 + hh);
    vec2 dd = gf - (vec2(h2, fract(h2*13.7)) - .5)*.44; float rr = length(dd);
    float xx = rr - tt*.42;
    float ee = rainK * exp(-xx*xx*110.) * (1. - tt) * step(.25, hh);
    h += .011*ee*cos(xx*42.);
    s += dd/max(rr, 1e-3) * (ee*(-.011*42.*.26*sin(xx*42.)));
  }
  return vec3(h, s);
}
`;
// The other sky. r: direction in the city's own upright frame (y >= 0 is its sky).
const GLSL_LOWERSKY = /* glsl */`
// the gradient and the low sun only (haze and window glass use this)
vec3 lowerSkyG(vec3 r){
  float h = clamp(r.y, 0., 1.);
  vec3 c = mix(uSkyPeach*.92, uSkyRose*.74, smoothstep(0., .17, h));
  c = mix(c, uSkyViolet*.95, smoothstep(.09, .58, h));
  c = mix(c, uSkyViolet*.62, smoothstep(.5, 1., h));
  float sd = max(dot(r, uSunL), 0.);
  float s2 = sd*sd, s8 = s2*s2*s2*s2;
  c += uSunGlow * (s8*.3 + s8*s8*s8*s8*.7);
  return c;
}
// one deck of long cloud bars on a plane: lit on the edge that faces the low sun, shaded on the other
vec4 lsDeck(vec3 r, float h, float plane, float freq, float lo, vec2 drift, vec2 sdir){
  vec2 q = r.xz / (h + plane) * freq;
  vec2 st = vec2(.4, 2.8);
  float n0 = fb2(q*st + drift);
  float n1 = fb2((q + sdir*.34)*st + drift);
  float d = smoothstep(lo, lo + .1, n0);
  float lit = clamp((n0 - n1)*8. - .3, 0., 1.);    // (inside a bar n0 > n1 on average, hence the offset)
  float thin = d*(1. - d)*4.;
  vec3 col = mix(uBarB, uBarA, lit) + uBarA*thin*.35;
  return vec4(col, d);
}
vec3 lowerSky(vec3 r){
  vec3 c = lowerSkyG(r);
  float h = clamp(r.y, 0., 1.);
  vec2 sdir = uSunL.xz / max(length(uSunL.xz), 1e-3);
  vec3 air = c;
  // far deck: thin streaks low on the horizon, half melted into the air
  vec4 k0 = lsDeck(r, h, .06, 2.6, .55, vec2(uTime*.002, 3.7), sdir);
  c = mix(c, mix(air, k0.rgb, .62), k0.a * smoothstep(.012, .05, h) * (1. - smoothstep(.22, .42, h)) * .85);
  // middle deck: the long bars
  vec4 k1 = lsDeck(r, h, .2, 1.25, .57, vec2(uTime*.0045, 0.), sdir);
  c = mix(c, mix(air, k1.rgb, .86), k1.a * smoothstep(.03, .11, h) * (1. - smoothstep(.7, .97, h)) * .92);
  // near deck: big soft bars high up (deep down under the lens), drifting faster
  vec4 k2 = lsDeck(r, h, .5, 1.5, .61, vec2(uTime*.009, 8.3), sdir);
  c = mix(c, k2.rgb*vec3(.92,.9,1.), k2.a * smoothstep(.16, .36, h) * .8);
  float dm = distance(r, uMoon.xyz);
  float crescent = (1. - smoothstep(.024, .03, dm)) * smoothstep(.022, .03, distance(r, uMoon.xyz + vec3(.011, .005, 0.)));
  c += vec3(1., .96, .84) * (crescent*1.8 + .05*exp(-dm*dm*90.)) * uMoon.w;
  return c;
}
`;

// ---------------------------------------------------------------- colour helpers
const C = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const satc = (a, k) => { const l = a[0] * .3 + a[1] * .55 + a[2] * .15; return [Math.max(0, l + (a[0] - l) * k), Math.max(0, l + (a[1] - l) * k), Math.max(0, l + (a[2] - l) * k)]; };

// material ids (aD.x)
const M = { PLAIN: 0, FACADE: 1, ROOF: 2, STONE: 3, VERDI: 4, GOLD: 5, LAMP: 6, BRONZE: 7, CLOCK: 8, DARK: 9,
  BALUS: 10, POLE: 11, CLOTH: 12, CAP: 13, FAR: 14, GLASS: 15 };

// ---------------------------------------------------------------- geometry builder (upright coords)
class Builder {
  constructor() { this.p = []; this.n = []; this.c = []; this.u = []; this.d = []; this.i = []; this.nv = 0;
    this.ox = 0; this.oy = 0; this.oz = 0; this.ca = 1; this.sa = 0; }
  frame(ox = 0, oy = 0, oz = 0, ang = 0) { this.ox = ox; this.oy = oy; this.oz = oz; this.ca = Math.cos(ang); this.sa = Math.sin(ang); return this; }
  v(x, y, z, nx, ny, nz, col, u, v, D) {
    const ca = this.ca, sa = this.sa;
    this.p.push(this.ox + x * ca + z * sa, this.oy + y, this.oz - x * sa + z * ca);
    this.n.push(nx * ca + nz * sa, ny, -nx * sa + nz * ca);
    this.c.push(col[0], col[1], col[2]); this.u.push(u, v); this.d.push(D[0], D[1], D[2] || 0, D[3] || 0);
    return this.nv++;
  }
  // a,b,c,d: [x,y,z] corners in order round the quad; uv per corner optional ([u,v] x4)
  quad(a, b, c, d, col, D, uv, col2) {
    if (D[0] === M.CAP && this.sink) { const k = this.sink; k.ox = this.ox; k.oy = this.oy; k.oz = this.oz; k.ca = this.ca; k.sa = this.sa;
      return k.quad(a, b, c, d, col, [M.CAP, D[1], Math.hypot(b[0] - a[0], b[2] - a[2]), Math.hypot(d[0] - a[0], d[2] - a[2])], [[0, 0], [1, 0], [1, 1], [0, 1]], col2); }
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const q = uv || [[0, 0], [1, 0], [1, 1], [0, 1]], c2 = col2 || col;
    const i0 = this.v(a[0], a[1], a[2], nx, ny, nz, col, q[0][0], q[0][1], D), i1 = this.v(b[0], b[1], b[2], nx, ny, nz, col, q[1][0], q[1][1], D);
    const i2 = this.v(c[0], c[1], c[2], nx, ny, nz, c2, q[2][0], q[2][1], D), i3 = this.v(d[0], d[1], d[2], nx, ny, nz, c2, q[3][0], q[3][1], D);
    this.i.push(i0, i1, i2, i0, i2, i3);
  }
  tri(a, b, c, col, D, uv) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const q = uv || [[0, 0], [1, 0], [.5, 1]];
    const i0 = this.v(a[0], a[1], a[2], nx, ny, nz, col, q[0][0], q[0][1], D), i1 = this.v(b[0], b[1], b[2], nx, ny, nz, col, q[1][0], q[1][1], D), i2 = this.v(c[0], c[1], c[2], nx, ny, nz, col, q[2][0], q[2][1], D);
    this.i.push(i0, i1, i2);
  }
  // vertical wall from (x0,z0) to (x1,z1), outward normal on the right-hand side of travel; uv in metres
  wall(x0, z0, x1, z1, y0, y1, col, D, segH = 0, u0 = 0, colTop = null, v0 = 0) {
    const len = Math.hypot(x1 - x0, z1 - z0) || 1, nx = (z1 - z0) / len, nz = -(x1 - x0) / len;
    const ns = segH > 0 ? Math.max(1, Math.ceil((y1 - y0) / segH)) : 1;
    let pa = -1, pb = -1;
    for (let s = 0; s <= ns; s++) {
      const t = s / ns, y = y0 + (y1 - y0) * t, cc = colTop ? mixc(col, colTop, t) : col;
      const a = this.v(x0, y, z0, nx, 0, nz, cc, u0, v0 + y - y0, D), b = this.v(x1, y, z1, nx, 0, nz, cc, u0 + len, v0 + y - y0, D);
      if (s > 0) this.i.push(pa, pb, b, pa, b, a);
      pa = a; pb = b;
    }
  }
  // axis-aligned box in the current frame; faces: string of x X y Y z Z (min/max sides) to emit
  box(x0, y0, z0, x1, y1, z1, col, D, faces = 'xXyYzZ', segH = 0) {
    if (faces.includes('Z')) this.wall(x1, z1, x0, z1, y0, y1, col, D, segH);
    if (faces.includes('z')) this.wall(x0, z0, x1, z0, y0, y1, col, D, segH);
    if (faces.includes('X')) this.wall(x1, z0, x1, z1, y0, y1, col, D, segH);
    if (faces.includes('x')) this.wall(x0, z1, x0, z0, y0, y1, col, D, segH);
    if (faces.includes('Y')) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], col, D, [[x0, z1], [x1, z1], [x1, z0], [x0, z0]]);
    if (faces.includes('y')) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col, D, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]);
  }
  // surface of revolution round (cx, cz). profile: [[r, y], ...] bottom to top. colFn(t 0..1) optional
  lathe(cx, cz, prof, sides, col, D, rot = 0, sx = 1, sz = 1) {
    const rows = [];
    for (let k = 0; k < prof.length; k++) {
      const a = prof[Math.max(0, k - 1)], b = prof[Math.min(prof.length - 1, k + 1)];
      let ty = b[1] - a[1], tr = b[0] - a[0]; const tl = Math.hypot(ty, tr) || 1; ty /= tl; tr /= tl; // normal = (ty, -tr)
      const cc = typeof col === 'function' ? col(k / (prof.length - 1)) : col, row = [];
      for (let s = 0; s <= sides; s++) {
        const an = rot + (s / sides) * TAU, cs = Math.cos(an), sn = Math.sin(an);
        row.push(this.v(cx + cs * prof[k][0] * sx, prof[k][1], cz + sn * prof[k][0] * sz, cs * ty, -tr, sn * ty, cc, (s / sides) * TAU * Math.max(prof[k][0], .5), prof[k][1], D));
      }
      rows.push(row);
    }
    for (let k = 0; k < rows.length - 1; k++) for (let s = 0; s < sides; s++) {
      const a = rows[k][s], b = rows[k][s + 1], c = rows[k + 1][s + 1], d = rows[k + 1][s];
      this.i.push(a, b, c, a, c, d);
    }
  }
  // hip / pyramid roof over a rectangle, ridge along the longer side; overhang o, rise h
  hipRoof(x0, z0, x1, z1, y, h, col, D, o = 0.6, soffit = null) {
    const ax = x0 - o, bx = x1 + o, az = z0 - o, bz = z1 + o, w = bx - ax, dp = bz - az;
    const inset = Math.min(w, dp) * 0.5, lx = w >= dp;
    const r0 = lx ? [ax + inset, y + h, (az + bz) / 2] : [(ax + bx) / 2, y + h, az + inset];
    const r1 = lx ? [bx - inset, y + h, (az + bz) / 2] : [(ax + bx) / 2, y + h, bz - inset];
    const sl = Math.hypot(inset, h), A = [ax, y, az], B_ = [bx, y, az], Cc = [bx, y, bz], Dd = [ax, y, bz];
    if (lx) {
      this.quad(Dd, Cc, r1, r0, col, D, [[0, 0], [w, 0], [w - inset, sl], [inset, sl]]);
      this.quad(B_, A, r0, r1, col, D, [[0, 0], [w, 0], [w - inset, sl], [inset, sl]]);
      this.tri(A, Dd, r0, col, D, [[0, 0], [dp, 0], [dp / 2, sl]]); this.tri(Cc, B_, r1, col, D, [[0, 0], [dp, 0], [dp / 2, sl]]);
    } else {
      this.quad(A, Dd, r1, r0, col, D, [[0, 0], [dp, 0], [dp - inset, sl], [inset, sl]]);
      this.quad(Cc, B_, r0, r1, col, D, [[0, 0], [dp, 0], [dp - inset, sl], [inset, sl]]);
      this.tri(B_, A, r0, col, D, [[0, 0], [w, 0], [w / 2, sl]]); this.tri(Dd, Cc, r1, col, D, [[0, 0], [w, 0], [w / 2, sl]]);
    }
    if (soffit) this.quad(A, B_, Cc, Dd, soffit, [M.STONE, 0, 0, 0]);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.setAttribute('aD', new THREE.Float32BufferAttribute(this.d, 4));
    g.setIndex(this.nv > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    return g;
  }
}

// ---------------------------------------------------------------- the city shader
const CITY_VERT = /* glsl */`
attribute vec3 color; attribute vec4 aD;
uniform float uShiver;
varying vec3 vN, vCol, vWp; varying vec2 vUv; varying vec4 vD; varying float vH;
#include <fog_pars_vertex>
${GLSL_UNI}
${GLSL_RIPPLE}
#ifdef MOVER
attribute vec4 aMove;             // per vertex: mover id, 0, 0, 0
uniform vec4 uMovers[13];          // x, z, heading (rad), bob
#endif
#ifdef FLOCK
attribute vec4 aMove;             // sheet u, sheet v (m), phase, wing-tip flag
uniform vec4 uFlock;              // centre x, z, height, radius
#endif
#ifdef PENDULUM
uniform vec3 uPend;               // swing angle (rad), dip (m), pivot height (m)
#endif
void main(){
  vec3 p = position; vec3 nrm = normal;
  if (aD.x > 11.5 && aD.x < 12.5) {          // cloth: uv.x metres from its fixing, aD.z amplitude
    float w = uv.x * aD.z;
    float a = uTime*2.6 + aD.y*37. - uv.x*1.4 + uv.y*.8;
    p += nrm * sin(a)*w*.16; p.y += cos(a*.7)*w*.05;
  }
#ifdef MOVER
  vec4 mv = uMovers[int(aMove.x + .5)];
  float cs = cos(mv.z), sn = sin(mv.z);
  p = vec3(p.x*cs + p.z*sn + mv.x, p.y + mv.w, -p.x*sn + p.z*cs + mv.y);
  nrm = vec3(nrm.x*cs + nrm.z*sn, nrm.y, -nrm.x*sn + nrm.z*cs);
#endif
#ifdef FLOCK
  { float ft = uTime*.42 - aMove.y*.035 + sin(aMove.z*6.)*.02;
    vec2 el = vec2(uFlock.w*.42, uFlock.w);
    vec2 c = uFlock.xy + vec2(sin(ft), cos(ft))*el;
    vec2 tg = vec2(cos(ft)*el.x, -sin(ft)*el.y); tg /= max(length(tg), 1e-3);
    vec2 sd2 = vec2(tg.y, -tg.x);
    float bank = sin(ft*2. + .6)*.2;
    float fsc = 1. - smoothstep(60., 105., distance(cameraPosition, (modelMatrix*vec4(c.x, -uFlock.z, c.y, 1.)).xyz));
    p *= fsc;
    vec3 q = vec3(p.x + aMove.x, p.y, p.z);
    q.y += fsc * aMove.w * sin(uTime*13. + aMove.z*40.)*.3 + q.x*bank + fract(aMove.z*7.31)*4.5 - .4;
    p = vec3(c.x + sd2.x*q.x + tg.x*q.z, uFlock.z + .5*sin(ft*1.3 + aMove.x*.08) + q.y, c.y + sd2.y*q.x + tg.y*q.z);   // the vertical play of the sheet: over its centre a bird reaches at most .5 (roll) + .3 (the beat of a wing tip) + .2*13.86 (the bank across the dealt 12 m and a half span of 1.86) + .4 (the highest level) = 3.972 m, so at the 5 m the world asks no bird is nearer the surface than 1 m; the levels hang 4.5 m below that top
    float na = aMove.z*40. + ft*2.; nrm = normalize(vec3(sin(na)*.8, .35 + .5*cos(na*.7 + aMove.x), cos(na)*.8)); }
#endif
#ifdef PENDULUM
  { float cs = cos(uPend.x), sn = sin(uPend.x); vec2 r = vec2(p.x, p.y - uPend.z);
    p.x = r.x*cs - r.y*sn; p.y = uPend.z + r.x*sn + r.y*cs + uPend.y;
    nrm = vec3(nrm.x*cs - nrm.y*sn, nrm.x*sn + nrm.y*cs, nrm.z);
    if (aD.w > .5) {                           // the rod stays at least ~2 px wide
      float dc = distance(cameraPosition, (modelMatrix*vec4(p.x, -p.y, p.z, 1.)).xyz);
      p += vec3(normal.x*cs, normal.x*sn, normal.z) * dc * .0015; } }
#endif
  vec4 wp = modelMatrix * vec4(p.x, -p.y, p.z, 1.);
  vec3 org = modelMatrix[3].xyz;
  float camY = cameraPosition.y - org.y;
  float dep = max(org.y - wp.y, 0.);
  float tt = camY / max(camY + dep, 1e-3);
  vec2 X = cameraPosition.xz + (wp.xz - cameraPosition.xz)*tt - org.xz;
  vec3 rp = ripple(X);
  float sd = dep / (1. + dep/400.);
  wp.xz += rp.yz * (1. + sd*.1) * uShiver * smoothstep(.2, 3., camY);
  vWp = wp.xyz; vN = nrm; vCol = color; vUv = uv; vD = aD; vH = p.y;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const CITY_FRAG = /* glsl */`
uniform float uLit, uSceneFog;
uniform vec3 uSunCol, uAmbSky, uAmbShade, uCapCol, uWinCol;
varying vec3 vN, vCol, vWp; varying vec2 vUv; varying vec4 vD; varying float vH;
#include <fog_pars_fragment>
${GLSL_UNI}
${GLSL_NOISE}
${GLSL_LOWERSKY}
float winSdf(vec2 q, float ww, float wh, float arch){
  float dRect = max(q.x - ww, max(-q.y, q.y - wh - (1.-arch)*ww*.5));
  float dArc = length(vec2(q.x, q.y - wh)) - ww;
  return (q.y > wh && arch > .5) ? dArc : dRect;
}
void main(){
  float mat = vD.x, seed = vD.y;
  vec3 N = vN / max(length(vN), 1e-4);
  vec3 Vr = vWp - cameraPosition; float dist = length(Vr); Vr /= max(dist, 1e-3);
  vec3 V = vec3(Vr.x, -Vr.y, Vr.z);                 // view ray in the city's own upright frame
  float inside = 0.;                                // back faces: we are looking into a building through its foot
  if (dot(N, V) > ((mat < 3.5 || (mat > 8.5 && mat < 9.5)) ? 0. : .22)) { N = -N; inside = 1.; }
#ifdef FLOCK
  inside = 0.;                                      // a bird has no inside: both sides of a wing take the light
#endif
  vec2 uv = vUv;
  vec3 alb = vCol, emis = vec3(0.); float alpha = 1.;
#ifdef FLOCK
  emis = vCol*.2*uLit;                             // pale birds stay pale in the blue hour
#endif
  float pxm = max(fwidth(vUv.x), fwidth(vUv.y));               // metres of wall under one pixel
  float spec = 0., lod = max(smoothstep(260., 800., dist), smoothstep(.16, .46, pxm));
  float fine = 1. - smoothstep(.07, .3, pxm);                  // surface grain only where a pixel can hold it: no speckle
  float nz1 = mix(.5, fb2(uv*.8 + seed*17.), fine);
  if (mat < .5) {
    alb *= .84 + .3*nz1;
    if (vD.z > 0.) {                                 // ashlar courses
      float ch = vD.z, rw = floor(uv.y/ch), bx = uv.x/(ch*2.3) + .5*mod(rw, 2.);
      vec2 bq = vec2(fract(bx), fract(uv.y/ch));
      float mort = smoothstep(0., .035, bq.x)*(1. - smoothstep(.965, 1., bq.x))*smoothstep(0., .08, bq.y)*(1. - smoothstep(.92, 1., bq.y));
      alb *= mix(1., (.6 + .4*mort) * (.86 + .28*h21(vec2(rw, floor(bx)) + seed)), (1. - lod) * smoothstep(1., 3., ch/max(pxm, 1e-4)));
    }
  } else if (mat < 1.5) {                            // ---- plaster facade with windows
    float bw = max(vD.z, 1.), fh = max(vD.w, 1.);
    vec2 g = vec2(uv.x/bw, uv.y/fh), cell = floor(g), f = fract(g);
    vec2 q = vec2((f.x - .5)*bw, f.y*fh);
    float rnd = h21(cell + seed*91.7);
    float litB = clamp(uLit*(.4 + .85*h11(seed*1.37 + .11)), 0., 1.);   // some houses nearly dark, some lit from top to bottom
    float on0 = smoothstep(rnd, rnd + .015, litB + .3*inside);
    vec3 warm0 = mix(uWinCol, uWinCol*vec3(1.,.72,.45), h21(cell + 7.)*.7);
    alb *= .82 + .32*nz1;
    // patched plaster over brick
    float pt = smoothstep(.64, .7, fb2(uv*.21 + seed*5.3)) * (1. - lod) * fine;
    float row = floor(uv.y/.28);
    float mort = smoothstep(.03, .09, fract(uv.x/.62 + .5*mod(row, 2.))) * smoothstep(.06, .2, fract(uv.y/.28));
    alb = mix(alb, mix(vec3(.5,.44,.4), vec3(.46,.2,.13)*(.75 + .5*h21(vec2(row, floor(uv.x/.62 + .5*mod(row,2.))))), mort), pt*.9);
    // water stain towards the waterline
    float st = (1. - smoothstep(.5, 7., vH + fb2(vec2(uv.x*.6, seed))*4.));
    alb = mix(alb, alb*vec3(.5,.58,.52), st*.65);
    // string course
    float sc = step(q.y, .26) * (1. - lod);
    alb = mix(alb, vec3(.78,.7,.6)*(.75 + .25*step(.07, q.y)), sc);
    // window
    float ww = min(1.05, bw*.23)*(.7 + .42*h11(seed*2.71 + .53)), wh = fh*(.4 + .2*h11(seed*4.3 + .2)), wy = fh*.24;
    float arch = step(.3, h11(seed*3.1 + cell.y*.37));
    vec2 wq = vec2(abs(q.x), q.y - wy);
    float dW = winSdf(wq, ww, wh, arch);
    // stone surround, keystone, sill and its shadow
    float fr = (1. - smoothstep(.15, .2, dW)) * step(0., dW) * step(-.02, wq.y);
    alb = mix(alb, vec3(.8,.72,.63)*(.86 + .14*nz1), fr);
    float sill = step(abs(q.x), ww + .3) * step(wy - .2, q.y) * step(q.y, wy);
    alb = mix(alb, vec3(.84,.77,.68), sill);
    alb *= 1. - .3*step(abs(q.x), ww + .3)*step(wy - .5, q.y)*step(q.y, wy - .2);
    // shutters, half open
    float hasSh = step(.3, h11(seed*5.7));
    float sw = .5*(.45 + .55*h21(cell + 3.3));
    float sh = hasSh * step(ww + .16, abs(q.x)) * step(abs(q.x), ww + .16 + sw) * step(wy, q.y) * step(q.y, wy + wh + arch*ww*.3);
    float sk = h11(seed*7.3);
    vec3 shCol = sk < .4 ? vec3(.08,.2,.15) : (sk < .7 ? vec3(.12,.19,.3) : vec3(.27,.13,.08));
    alb = mix(alb, shCol*(.7 + .45*step(.5, fract(q.y*6.))), sh);
    // the opening: reveal, glass, light
    if (dW < 0.) {
      vec3 T = vec3(N.z, 0., -N.x); T /= max(length(T), 1e-3);
      vec2 off = vec2(dot(V, T), V.y) / max(-dot(V, N), .2) * .3;
      vec2 q2 = q + off;
      float d2 = winSdf(vec2(abs(q2.x), q2.y - wy), ww, wh, arch);
      if (d2 > 0.) { alb = vec3(.62,.54,.48)*(off.y > 0. ? .5 : .85); }
      else {
        float on = smoothstep(rnd, rnd + .015, litB + .3*inside);
        vec2 pq = vec2(q2.x, q2.y - wy);
        float bars = (step(abs(pq.x), max(.04, pxm*.7)) + step(abs(fract(pq.y/.62) - .5), max(.056, pxm*1.1))) * (1. - smoothstep(.09, .2, pxm));   // glazing bars never thinner than a pixel: no stipple
        float cur = .55 + .45*vn2(vec2(pq.x*2.5 + rnd*9., pq.y*.9 + rnd*5.));
        vec3 glass = lowerSkyG(normalize(vec3(-V.x, abs(V.y) + .15, -V.z)))*.3 + vec3(.02,.02,.04);
        vec3 warm = mix(uWinCol, uWinCol*vec3(1.,.72,.45), h21(cell + 7.)*.7);
        alb = mix(glass, vec3(.12,.07,.05), min(bars, 1.)*.8);
        emis = warm * 2.5 * cur * on * (1. - .75*min(bars, 1.));
        alb *= 1. - .8*on;
      }
    }
    // window boxes
    float wb = step(.62, h21(cell + 9.1)) * step(abs(q.x), ww + .1) * step(wy, q.y) * step(q.y, wy + .3) * (1. - lod);
    alb = mix(alb, mix(vec3(.12,.3,.12), vec3(.8,.14,.2), step(.55, vn2(uv*9.))), wb);
    // far: each window a soft dark pane, a share of them lit, so that a wall a quarter of a mile off still shows its rows of
    // windows; where a bay is smaller than two pixels it melts to the average and nothing shimmers
    float aa = pxm*.7 + .02;
    float wm = (1. - smoothstep(ww - aa, ww + aa, abs(q.x))) * smoothstep(wy - aa, wy + aa, q.y) * (1. - smoothstep(wy + wh - aa, wy + wh + aa, q.y));
    float keep = smoothstep(1.3, 3.2, min(bw, fh)/max(pxm, 1e-4));
    float cov = (2.*ww/bw) * (wh/fh);
    vec3 wallFar = vCol*(.74 + .1*h21(vec2(cell.y, seed)));
    vec3 albFar = mix(wallFar, vec3(.06,.06,.1), mix(cov, wm, keep)*.85);
    float onF = smoothstep(rnd, rnd + .015, litB*.8 + .3*inside);
    vec3 emisFar = warm0 * 2.1 * mix(litB*.8*cov, onF*wm, keep);
    alb = mix(alb, albFar, lod);
    emis = mix(emis, emisFar, lod);
  } else if (mat < 2.5) {                            // ---- pantile roof
    float rw = uv.y/.42, cl = uv.x/.3;
    float tile = h21(vec2(floor(cl), floor(rw)));
    alb *= mix(.81, (.62 + .38*fract(rw)) * (.8 + .2*sin(cl*6.2832)) * (.8 + .4*tile), fine);
    alb = mix(alb, alb*vec3(.55,.5,.45), smoothstep(.55, .8, fb2(uv*.3 + seed))*.6);
    alb = mix(alb, vCol*.8, lod) * .8;
  } else if (mat < 3.5) {                            // ---- stone trim (dentils when aD.z > 0)
    alb *= .85 + .25*nz1;
    if (vD.z > 0.) alb *= 1. - .42*step(.5, fract(uv.x/vD.z))*step(uv.y, vD.w)*(1. - lod);
  } else if (mat < 4.5) {                            // ---- verdigris
    alb *= .74 + .5*fb2(vec2(uv.x*.5, uv.y*.1) + seed);
    float rim = 1. - abs(dot(N, V)); rim *= rim*rim;
    emis = uSunCol * rim * .1;
  } else if (mat < 5.5) {                            // ---- gold
    vec3 R = reflect(V, N);
    vec3 env = lowerSkyG(normalize(vec3(R.x, abs(R.y) + .02, R.z))) * (R.y < 0. ? .5 : 1.);
    float g1 = max(dot(R, uSunL), 0.); g1 *= g1; g1 *= g1; g1 *= g1;
    float rim = 1. - abs(dot(N, V));
    float band = .85 + .15*sin(vH*9.);                 // turned work: fine lathe rings
    vec3 tint = mix(vCol, vec3(1., .8, .46), .45);
    emis = tint * (env*1.5*band + uSunCol*(2.2*g1) + .22*rim*rim*rim);
    { vec3 dg = vWp - uPGlow.xyz; emis += vec3(.16, .8, .66) * uPGlow.w * 1.1 / (1. + dot(dg, dg)/36.); }
    alb *= .28;
  } else if (mat < 6.5) {                            // ---- lamp
    emis = vCol * vD.z; alb = vec3(0.);
  } else if (mat < 7.5) {                            // ---- bronze
    alb *= .7 + .6*nz1;
    vec3 R = reflect(V, N); float g1 = max(dot(R, uSunL), 0.); g1 *= g1; g1 *= g1;
    float rim = 1. - abs(dot(N, V));
    vec3 env = lowerSkyG(normalize(vec3(R.x, abs(R.y) + .02, R.z)));
    emis = env*vec3(1., .78, .5)*(.2 + .3*rim) + uSunCol*(.55*g1 + .1*rim*rim*rim);
    { vec3 dg = vWp - uPGlow.xyz; emis += vec3(.16, .8, .66) * uPGlow.w * 1.5 / (1. + dot(dg, dg)/150.); }
  } else if (mat < 8.5) {                            // ---- clock without numerals
    float R = max(vD.z, 1.), r = length(uv)/R;
    alb = mix(vec3(.82,.76,.62), vec3(.5,.42,.3), smoothstep(.0, 1., r)*.4);
    float ring = (1. - smoothstep(.0, .03, abs(r - .9))) + (1. - smoothstep(.0, .015, abs(r - .62)));
    alb = mix(alb, vec3(.75,.52,.14), min(ring, 1.));
    float a1 = -uTime*6.2832/40. + seed, a2 = a1/12. + 1.3;
    vec2 d1 = vec2(sin(a1), cos(a1)), d2 = vec2(sin(a2), cos(a2));
    vec2 p = uv/R;
    float l1 = length(p - d1*clamp(dot(p, d1), -.12, .8)) - .035*(1.2 - clamp(dot(p,d1),0.,.8));
    float l2 = length(p - d2*clamp(dot(p, d2), -.1, .5)) - .05;
    float hand = step(min(l1, l2), 0.) + step(r, .07);
    alb = mix(alb, vec3(.07,.05,.06), min(hand, 1.));
    emis = vec3(.75,.52,.14)*min(ring,1.)*.5*(1. - min(hand, 1.));
    alb *= step(r, 1.) + .6*step(1., r);
  } else if (mat < 9.5) {                            // ---- arcade back wall: dark, some lit doors
    float bw = max(vD.z, 1.);
    float cx = floor(uv.x/bw), fx = (fract(uv.x/bw) - .5)*bw;
    float dD = winSdf(vec2(abs(fx), uv.y - .2), bw*.24, 2.5, 1.);
    float rnd = h21(vec2(cx, seed*31.));
    alb *= .8 + .3*nz1;
    float pool = exp(-(fx*fx)/(bw*bw*.11) - (uv.y - 2.9)*(uv.y - 2.9)/5.);
    alb *= .55 + .25*step(.5, fract(uv.y*2.6 + .5*floor(uv.x*1.3)))*smoothstep(3., 12., 1./max(pxm, 1e-4));
    emis = vCol*vec3(1.,.7,.42)*(.035 + (.1 + .5*uLit)*pool)*(.7 + .3*vn2(uv*.7 + seed));
    if (dD < 0.) { float on = smoothstep(rnd, rnd + .02, uLit*1.1);
      alb = vec3(.2,.13,.09)*(.75 + .25*step(.5, fract(fx*2.2))); emis = uWinCol*vec3(1.,.7,.42)*1.7*on*(.5 + .5*vn2(uv*vec2(2.,1.) + rnd*7.)); }
    else alb = mix(alb, vec3(.6,.52,.45), (1. - smoothstep(.12, .16, dD)));
  } else if (mat < 10.5) {                           // ---- balustrade
    float hh = max(vD.z, .5);
    float solid = step(hh - .13, uv.y) + step(uv.y, .1);
    float bx = abs(fract(uv.x/.3) - .5), wv = .2 + .13*sin(uv.y/hh*9.4 + 1.);
    if (solid < .5 && bx > wv && pxm < .085) discard;      // from far off the balusters close to a screen: no dotted rows
    alb *= 1. - .22*smoothstep(.06, .085, pxm)*(1. - solid);
    alb *= .9 + .2*nz1;
  } else if (mat < 11.5) {                           // ---- striped mooring pole
    alb = mix(vec3(.82,.78,.72), vCol, step(.5, fract(uv.y*.55 + uv.x*.6)));
  } else if (mat < 12.5) {                           // ---- cloth
    if (vD.w > .5) alb *= .72 + .28*step(.5, fract(uv.y*vD.w));
  } else if (mat < 13.5) {                           // ---- foot cap: a darker pane of the same water
    alb = vec3(0.);
    float gz = 1. - clamp(abs(V.y), 0., 1.);          // 0 looking straight down, 1 at a grazing angle
    emis = lowerSky(normalize(vec3(V.x, abs(V.y) + .05, V.z)))*vec3(.7,.8,.95)*.9 + uCapCol*.06;
    alpha = max(mix(.34, .82, gz*gz), .8*step(.5, vD.y));   // aD.y 1: a solid pier's foot, nothing to see inside
  } else if (mat < 15.5) {                           // ---- dome glass: rose panes and fine glazing bars
    vec2 guv = uv*vec2(.5, .33334);                            // 48 panes round, one row to each hoop
    vec2 gq = abs(fract(guv) - .5);
    float lw = clamp(.008 + pxm*.5, .008, .05);                  // thin glazing bars, never under a pixel and a half
    float line = smoothstep(.5 - lw*1.6, .5 - lw*.6, max(gq.x, gq.y*.985));
    float rim = 1. - abs(dot(N, V)); rim *= rim;
    vec3 R = reflect(V, N); R.y = abs(R.y);
    float pane = h21(floor(guv) + seed);
    alb = mix(vec3(.5,.3,.32)*(.94 + .12*pane), vCol*1.5 + vec3(.1,.07,.03), line);
    emis = lowerSky(normalize(R + vec3(0., .05, 0.))) * (.1 + .45*rim) * (1. - line);
    float gl = smoothstep(.72, 1., sin(uv.x*.9 + uv.y*.55 - uTime*1.1 + pane*2.)) * smoothstep(.35, .8, pane);
    float sg = max(dot(R, uSunL), 0.); sg *= sg; sg *= sg; sg *= sg;
    emis += uSunCol * (gl*.55 + sg*.9) * (1. - line);
    alpha = mix(.1 + .3*rim + .3*gl + .3*sg, .95, line);
    alb = mix(alb, mix(vec3(.012,.016,.05), alb*.7, line), inside);
    emis *= 1. - .8*inside;
    alpha = mix(alpha, mix(.8 + .14*rim, .96, line), inside);
    { vec3 dg = vWp - uPGlow.xyz; float fg = uPGlow.w / (1. + dot(dg, dg)/mix(520., 140., inside)); emis += vec3(.16, .8, .66) * fg * (1.1 + 1.5*inside); alpha = min(alpha + fg*.3, .96); }
  }
  float nl = dot(N, uSunL);
  float sun = clamp(nl*1.2 + .03, 0., 1.) * (1. - inside);
  vec3 amb = (mix(uAmbShade, uAmbSky, N.y*.5 + .5) + vec3(.2,.11,.07)*max(-N.y, 0.)) * (1. - .62*inside) + vec3(.07,.04,.025)*inside*uLit;
  emis *= 1. - .5*inside;
  vec3 R2 = reflect(V, N); float sp = max(dot(R2, uSunL), 0.); sp *= sp; sp *= sp; sp *= sp;
  vec3 col = alb*(uSunCol*sun + amb) + uSunCol*sp*spec + emis;
  vec3 hz = lowerSkyG(normalize(vec3(V.x, abs(V.y) + .03, V.z)));
  float ha = 1. - exp(-(dist*.0006 + max(vH, 0.)*.0003));
  col = mix(col, hz*.9, ha * (mat > 5.5 && mat < 6.5 ? .5 : 1.));
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float ff = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
    float ff = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  col = mix(col, fogColor, ff*uSceneFog);
#endif
  gl_FragColor = vec4(col, alpha);
}`;

// ---------------------------------------------------------------- architectural helpers
// wall panel at local z, facing +z, from x0..x1, flat underside at y0 except for round arches cut up into it
function archPanel(b, x0, x1, y0, y1, z, arches, col, D, depth, sofCol, sofD, seg = 10) {
  const pts = [[x0, y0]];
  for (const a of arches) {
    pts.push([a.cx - a.R, y0]);
    for (let i = 1; i < seg; i++) { const t = Math.PI * i / seg; pts.push([a.cx - a.R * Math.cos(t), y0 + a.R * Math.sin(t)]); }
    pts.push([a.cx + a.R, y0]);
  }
  pts.push([x1, y0]);
  for (let i = 0; i < pts.length - 1; i++) {
    const A = pts[i], Bq = pts[i + 1]; if (Bq[0] - A[0] < 1e-4) continue;
    b.quad([A[0], A[1], z], [Bq[0], Bq[1], z], [Bq[0], y1, z], [A[0], y1, z], col, D, [[A[0], A[1]], [Bq[0], Bq[1]], [Bq[0], y1], [A[0], y1]]);
    if (depth > 0) b.quad([A[0], A[1], z - depth], [Bq[0], Bq[1], z - depth], [Bq[0], Bq[1], z], [A[0], A[1], z], sofCol || col, sofD || D, [[A[0], 0], [Bq[0], 0], [Bq[0], depth], [A[0], depth]]);
  }
}
// raised archivolt band round an arch
function archivolt(b, cx, y0, R, w, z, col, D, seg = 10) {
  for (let i = 0; i < seg; i++) {
    const t0 = Math.PI * i / seg, t1 = Math.PI * (i + 1) / seg, R2 = R + w;
    const a = [cx - R * Math.cos(t0), y0 + R * Math.sin(t0), z], bq = [cx - R * Math.cos(t1), y0 + R * Math.sin(t1), z];
    const c = [cx - R2 * Math.cos(t1), y0 + R2 * Math.sin(t1), z], d = [cx - R2 * Math.cos(t0), y0 + R2 * Math.sin(t0), z];
    b.quad(a, bq, c, d, i % 2 ? col : mulc(col, .86), D, [[i, 0], [i + 1, 0], [i + 1, w], [i, w]]);
  }
}
// classical column with base, entasis and capital + abacus
function column(b, cx, cz, y0, h, r, col, sides = 6) {
  const D = [M.STONE, cx * .13 + cz * .07, 0, 0];
  b.lathe(cx, cz, [[r * 1.5, y0], [r * 1.5, y0 + r * .5], [r * 1.05, y0 + r * .9], [r, y0 + h * .35], [r * .84, y0 + h - r * 1.6], [r * 1.25, y0 + h - r * .9], [r * 1.55, y0 + h - r * .5]], sides, col, D, .3);
  b.box(cx - r * 1.7, y0 + h - r * .5, cz - r * 1.7, cx + r * 1.7, y0 + h, cz + r * 1.7, mulc(col, 1.05), D, 'xXyzZ');
}
// stepped cornice ring round a rectangle, with dentils
function cornice(b, x0, z0, x1, z1, y, h, out, col, steps = 2, dent = .5) {
  for (let s = 0; s < steps; s++) {
    const o = out * (s + 1) / steps, ya = y + h * s / steps, yb = y + h * (s + 1) / steps;
    b.box(x0 - o, ya, z0 - o, x1 + o, yb, z1 + o, s % 2 ? mulc(col, .92) : col, [M.STONE, s * .37 + x0 * .01, s === 0 ? dent : 0, h / steps * .6], 'xXzZy' + (s === steps - 1 ? 'Y' : ''));
  }
}

// ---------------------------------------------------------------- campanile (upright, base centre at origin)
const CAMP = { W: 15, legTop: 44, shaftTop: 346, belfry0: 352, belfry1: 384, top: 404, pivot: 382 };
function buildCampanile(b, K, rng) {
  const W = CAMP.W, brick = K.brick, stone = K.stone, sd = rng() * 10;
  b.frame(0, 0, 0, 0);
  const pier = 5.4, R = (2 * W - 2 * pier) / 2, spring = 25;
  // four legs: rusticated base, shaft of the pier, impost
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x0 = sx < 0 ? -W : W - pier, z0 = sz < 0 ? -W : W - pier;
    b.box(x0 - .5, 0, z0 - .5, x0 + pier + .5, 3.2, z0 + pier + .5, mixc(brick, stone, .5), [M.STONE, sd, 0, 0], 'xXzZY');
    for (let k = 0; k < 5; k++) {   // banded rustication
      const ya = 3.2 + k * 4.2, yb = ya + 4.2, o = k % 2 ? 0 : .22;
      b.box(x0 - o, ya, z0 - o, x0 + pier + o, yb, z0 + pier + o, k % 2 ? mixc(brick, stone, .12) : mixc(brick, stone, .34), [M.PLAIN, sd + k, .3, 0], 'xXzZ' + (o ? 'yY' : ''));
    }
    b.box(x0 - .6, 24.2, z0 - .6, x0 + pier + .6, 25.4, z0 + pier + .6, stone, [M.STONE, sd, .6, .5], 'xXzZyY');
    b.box(x0, 25.4, z0, x0 + pier, CAMP.legTop, z0 + pier, mixc(brick, stone, .2), [M.PLAIN, sd, .3, 0], 'xXzZ', 5);
    b.quad([x0, .03, z0], [x0 + pier, .03, z0], [x0 + pier, .03, z0 + pier], [x0, .03, z0 + pier], K.cap, [M.CAP, 1, 0, 0]);
  }
  // four great arches between the legs, with archivolts and keystones; the shaft above is hollow
  for (let s = 0; s < 4; s++) {
    b.frame(0, 0, 0, s * Math.PI / 2);
    archPanel(b, -W + pier, W - pier, 25.4, CAMP.legTop, W - .4, [{ cx: 0, R: R - .01 }], mixc(brick, stone, .2), [M.PLAIN, sd + s, .9, 0], 2.6, mulc(stone, .8), [M.STONE, sd, 0, 0], 12);
    archivolt(b, 0, 25.4, R, 1.5, W - .15, stone, [M.STONE, sd, 0, 0], 12);
    b.box(-1.1, 25.4 + R - .3, W - .4, 1.1, 25.4 + R + 2.6, W + .2, stone, [M.STONE, sd, 0, 0], 'xXZyY');
    // shaft face: brick with slit windows; corner pilasters with quoins; string courses
    const y0 = CAMP.legTop, y1 = CAMP.shaftTop - 30, Wt = W - .5;
    b.wall(W - 3.2, W, -W + 3.2, W, y0, y1, brick, [M.FACADE, sd + s * 3.1, (2 * W - 6.4) / 3, 21], 4, 0, mixc(brick, K.rose, .35));
    for (const e of [-1, 1]) {
      const xa = e < 0 ? -W - .3 : W - 3.2, xb = e < 0 ? -W + 3.2 : W + .3;
      b.wall(xb, W + .3, xa, W + .3, y0, CAMP.shaftTop, mixc(brick, stone, .3), [M.PLAIN, sd, .8, 0], 4);
      b.wall(e < 0 ? xb : xa, W + .3, e < 0 ? xb : xa, W, y0, CAMP.shaftTop, mulc(brick, .8), [M.PLAIN, sd, 0, 0], 8);
    }
    for (let k = 0; k * 9.2 + y0 + 3 < CAMP.shaftTop; k++) {   // long quoin blocks, alternate courses
      const ya = y0 + 2 + k * 9.2;
      b.box(W - 4.4, ya, W + .3, W + .62, ya + 4.4, W + .62, stone, [M.STONE, sd + k, 0, 0], 'xXZyY');
      b.box(-W - .62, ya + 4.6, W + .3, -W + 4.4, ya + 9, W + .62, stone, [M.STONE, sd + k + .5, 0, 0], 'xXZyY');
    }
    for (let k = 1; k <= 4; k++) { const yb = y0 + (y1 - y0) * k / 4.0 - 1; b.box(-W + 3.2, yb, W, W - 3.2, yb + 1.3, W + .5, stone, [M.STONE, sd, .8, .6], 'ZyY'); }
    b.box(-W - .4, y0 - 1.2, W, W + .4, y0 + .8, W + .9, stone, [M.STONE, sd, .9, .8], 'ZyYxX');
    // clock stage: stone panel, the clock itself, a small pediment over it
    b.wall(W - 3.2, W + .1, -W + 3.2, W + .1, y1, CAMP.shaftTop, mixc(stone, brick, .25), [M.PLAIN, sd, 0, 0], 5);
    const cy = y1 + 15, CR = 9.2;
    b.quad([-CR - 1, cy - CR - 1, W + .45], [CR + 1, cy - CR - 1, W + .45], [CR + 1, cy + CR + 1, W + .45], [-CR - 1, cy + CR + 1, W + .45], stone, [M.CLOCK, s * 1.7 + sd, CR, 0],
      [[-CR - 1, -CR - 1], [CR + 1, -CR - 1], [CR + 1, CR + 1], [-CR - 1, CR + 1]]);
    b.box(-CR - 1.6, cy - CR - 1.6, W + .1, CR + 1.6, cy - CR - 1, W + .9, stone, [M.STONE, sd, .7, .4], 'ZyYxX');
    b.box(-CR - 1.6, cy + CR + 1, W + .1, CR + 1.6, cy + CR + 1.7, W + .9, stone, [M.STONE, sd, .7, .4], 'ZyYxX');
    // belfry: three open arches a side on slim columns between corner piers
    const by0 = CAMP.belfry0, bs = by0 + 20, bw = (2 * Wt - 7) / 3, br = bw / 2 - .7;
    archPanel(b, -Wt + 3.5, Wt - 3.5, bs, CAMP.belfry1, Wt, [{ cx: -bw, R: br }, { cx: 0, R: br }, { cx: bw, R: br }], mixc(stone, brick, .15), [M.PLAIN, sd, 0, 0], 2, mulc(stone, .78), null, 8);
    for (const a of [-bw, 0, bw]) archivolt(b, a, bs, br, .55, Wt + .12, stone, [M.STONE, sd, 0, 0], 8);
    for (const cx of [-bw / 2, bw / 2]) column(b, cx, Wt - 1, by0 + 2.2, bs - by0 - 2.2, .95, stone, 8);
    b.box(-Wt, by0, Wt - 2, Wt, by0 + 2.2, Wt + .2, stone, [M.BALUS, sd, 2.2, 0], 'Z');      // parapet balustrade
    b.box(Wt - 3.5, by0, Wt - 3.5, Wt, CAMP.belfry1, Wt, mixc(stone, brick, .15), [M.PLAIN, sd, 0, 0], 'xXzZ', 8);
  }
  b.frame(0, 0, 0, 0);
  const Wt = W - .5;
  cornice(b, -W - .3, -W - .3, W + .3, W + .3, CAMP.shaftTop, 6, 2.4, stone, 3, 1.1);
  b.box(-Wt - 1, CAMP.shaftTop + 6, -Wt - 1, Wt + 1, CAMP.belfry0, Wt + 1, stone, [M.STONE, sd, 0, 0], 'y');
  cornice(b, -Wt, -Wt, Wt, Wt, CAMP.belfry1, 3.2, 1.8, stone, 2, .9);
  // pendulum beam and yoke in the belfry
  b.box(-Wt, CAMP.pivot - 1.2, -1.3, Wt, CAMP.pivot + 1.2, 1.3, K.bronze, [M.BRONZE, sd, 0, 0]);
  b.box(-1.2, CAMP.pivot - 1.2, -Wt, 1.2, CAMP.pivot + 1.2, Wt, K.bronze, [M.BRONZE, sd, 0, 0]);
  // attic block and spire
  const ay = CAMP.belfry1 + 3.2, aw = W - 3.5;
  b.box(-aw, ay, -aw, aw, ay + 7, aw, mixc(brick, K.rose, .2), [M.FACADE, sd + 9, aw * 2 / 3, 7], 'xXzZy');
  cornice(b, -aw, -aw, aw, aw, ay + 7, 1.6, 1, stone, 2, .7);
  const sy = ay + 8.6, sh = CAMP.top - sy - 2.5, so = aw + .6;
  for (let s = 0; s < 4; s++) {
    b.frame(0, 0, 0, s * Math.PI / 2);
    const sl = Math.hypot(so, sh);
    for (let k = 0; k < 4; k++) {    // gently bell-cast (concave) spire in four lifts
      const t0 = k / 4, t1 = (k + 1) / 4, r0 = so * (1 - t0) * (1 - .12 * Math.sin(t0 * Math.PI)), r1 = so * (1 - t1) * (1 - .12 * Math.sin(t1 * Math.PI));
      b.quad([-r0, sy + sh * t0, r0], [r0, sy + sh * t0, r0], [r1, sy + sh * t1, r1], [-r1, sy + sh * t1, r1], K.verdi, [M.VERDI, sd + s, 0, 0], [[-r0, sl * t0], [r0, sl * t0], [r1, sl * t1], [-r1, sl * t1]]);
    }
  }
  b.frame(0, 0, 0, 0);
  b.lathe(0, 0, [[.25, sy + sh - .6], [.9, sy + sh + .5], [1.3, sy + sh + 1.4], [.9, sy + sh + 2.2], [.2, sy + sh + 2.9]], 8, K.gold, [M.GOLD, 0, 0, 0]);
}

// the pendulum, modelled hanging at rest with the finial tip at y 0 (rotated in its vertex shader)
function buildPendulum(b, K) {
  b.frame(0, 0, 0, 0);
  const D = [M.GOLD, 0, 0, 0], N = 64, y0 = 15.5, y1 = CAMP.pivot;
  const prof = []; for (let i = 0; i <= N; i++) prof.push([.42, y0 + (y1 - y0) * i / N]);
  b.lathe(0, 0, prof, 6, mixc(K.bronze, K.gold, .45), [M.BRONZE, 0, 0, 1]);
  for (let k = 1; k <= 8; k++) { const y = y0 + (y1 - y0) * k / 9; b.lathe(0, 0, [[.5, y - 1], [1.05, y - .4], [1.05, y + .4], [.5, y + 1]], 8, K.gold, D); }
  // finial: ball, collars and spike, 3 m wide and 6 m tall, tip down at y 0
  b.lathe(0, 0, [[.02, 0], [.22, .7], [.5, 1.5], [1.1, 1.95], [1.5, 2.7], [1.38, 3.3], [.8, 3.9], [.5, 4.3], [.95, 4.7], [1.0, 5.0], [.55, 5.4], [.8, 6.0]], 12, K.gold, D);
  // bob: a great lens of bronze with a gold rim and bosses
  const lens = []; for (let i = 0; i <= 10; i++) { const t = Math.PI * i / 10; lens.push([Math.max(.02, 5.2 * Math.sin(t)), 11 - 5.2 * Math.cos(t)]); }
  b.lathe(0, 0, lens, 20, (t) => mixc(K.bronze, K.gold, .25 + .5 * Math.abs(Math.cos(t * Math.PI * 3))), [M.BRONZE, 1, 0, 0], 0, 1, .3);
  const rim = []; for (let i = 0; i <= 6; i++) { const t = Math.PI * i / 6; rim.push([Math.max(.02, 5.6 * Math.sin(t)), 11 - 5.6 * Math.cos(t)]); }
  b.lathe(0, 0, rim, 20, K.gold, D, 0, 1, .09);
  for (const s of [-1, 1]) {
    const boss = []; for (let i = 0; i <= 5; i++) { const t = Math.PI * i / 5; boss.push([Math.max(.02, 2.1 * Math.sin(t)), 11 - 2.1 * Math.cos(t)]); }
    b.lathe(0, s * 1.2, boss, 12, K.gold, D, 0, 1, .32);
  }
}

// ---------------------------------------------------------------- the lake (optional; two of the three passes)
const WATER_VERT = /* glsl */`
varying vec3 vWp; varying vec2 vLp;
#include <fog_pars_vertex>
void main(){
  vLp = position.xz;
  vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WATER_COMMON = /* glsl */`
varying vec3 vWp; varying vec2 vLp;
#include <fog_pars_fragment>
${GLSL_UNI}
${GLSL_NOISE}
${GLSL_RIPPLE}
${GLSL_LOWERSKY}
uniform float uSceneFog;
float sceneFog(){
#ifdef USE_FOG
  #ifdef FOG_EXP2
    return 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
    return smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  return 0.;
#endif
}
vec3 fogCol(){
#ifdef USE_FOG
  return fogColor;
#else
  return vec3(0.);
#endif
}`;
// pass 1: opaque, no depth write: the other sky, seen along the view ray bent by the ripple normal
const WATER_BASE_FRAG = /* glsl */`
${WATER_COMMON}
void main(){
  vec3 Vr = vWp - cameraPosition; float dist = length(Vr); Vr /= max(dist, 1e-3);
  vec3 rp = ripple(vLp);
  float k = 2.2 / (1. + dist*.006);
  vec3 n = normalize(vec3(-rp.y*k, 1., -rp.z*k));
  vec3 R = reflect(Vr, n); R.y = abs(R.y) + .003;
  vec3 col = lowerSky(normalize(R));
  col = mix(col, fogCol(), sceneFog()*uSceneFog);
  gl_FragColor = vec4(col, 1.);
}`;
// pass 3: the veil: fresnel strip of the true sky, cat's-paws, sun glitter, ring crests
const WATER_VEIL_FRAG = /* glsl */`
${WATER_COMMON}
uniform vec3 uUpHor, uUpZen, uSunU, uSunUCol, uUpBand; uniform vec2 uPaws;
void main(){
  vec3 Vr = vWp - cameraPosition; float dist = length(Vr); Vr /= max(dist, 1e-3);
  vec3 rp = ripple(vLp);
  float k = 1. / (1. + dist*.004);
  // cat's-paws: drifting patches of fine ripple
  float cp = smoothstep(.5 - uPaws.y, .72 - uPaws.y, fb2(vLp*.0045 + vec2(uTime*.011, uTime*.006)*(1. + 3.*uPaws.y))) * uPaws.x;
  cp *= .35 + .65*smoothstep(.35, .7, vn2(vLp*.021 - vec2(uTime*.03, 0.)));
  vec2 mq = vLp*vec2(.9, 2.3) + uTime*vec2(.7, 1.1);
  float nearK = 1. / (1. + dist*.012);
  vec2 mic = vec2(vn2(mq) - .5, vn2(mq + 17.3) - .5) * cp * nearK;
  vec3 n = normalize(vec3(-rp.y*k + mic.x*.22, 1., -rp.z*k + mic.y*.22));
  float sinG = clamp(dot(-Vr, n), 0., 1.);
  float deg = asin(sinG)*57.296;
  float w = min(.78, .78*exp(-(deg - 1.)/1.35));
  w = max(w, min(cp*.35, .4)*mix(1., .6 + .8*vn2(mq*.6), nearK) * (.2 + .8*(1. - smoothstep(3., 16., deg))) * (1. - smoothstep(6., 60., deg)));
  // a cat's-paw from close by: long silver streaks of fine ripple lying across the course
  float sk = smoothstep(.58, .76, fb2(vLp*vec2(.015, .07) + vec2(uTime*.02, uTime*.013)));
  float fine = .5 + .5*vn2(vLp*vec2(1.3, 3.3) + uTime*vec2(.6, .9));
  sk *= 1. - smoothstep(14., 48., cameraPosition.y - (vWp.y));                 // streaks belong to the low passes; from the air they are scratches
  w = max(w, sk*fine*.14*min(uPaws.x, 1.2) * (1. - smoothstep(110., 380., dist)) * (.3 + .7*(1. - smoothstep(8., 28., deg))));
  w += smoothstep(.07, .24, length(rp.yz)) * .1;                              // the crest of a ring or a wake catches the morning: boats below have their water line
  vec2 vh = Vr.xz / max(length(Vr.xz), 1e-3);
  float fac = dot(rp.yz, vh) * (.4 + .6*(1. - smoothstep(8., 70., deg)));   // slopes leaning away catch the morning sky, slopes facing us go clear and a little dark
  w += clamp(fac*3., 0., .26);
  float dark = clamp(-fac*2.2, 0., .22);
  w = clamp(w, 0., .94);
  float bowl = (1. - smoothstep(50., 63., length(vLp - vec2(0., 540.)))) * smoothstep(7., 22., deg);
  w *= 1. - .75*bowl;
  vec3 Ru = reflect(Vr, n); Ru.y = abs(Ru.y);
  vec3 sky = mix(uUpHor, uUpZen, smoothstep(0., .55, Ru.y));
  sky = mix(uUpBand, sky, smoothstep(.02, .15, Ru.y + .05*vn2(vec2(atan(Ru.x, Ru.z + 1e-4)*9., 3.))));
  float sg = max(dot(normalize(Ru), uSunU), 0.); sg *= sg; sg *= sg; sg *= sg; sg *= sg; sg *= sg; sg *= sg;   // ^64
  float spk = smoothstep(.66, .98, vn2(mq*3.1 + 5. + uTime*vec2(.9, -.6)) * vn2(mq.yx*2.3 + 9. - uTime*vec2(.5, .7)) * 1.7) * (cp + .15);   // two crossed octaves: glints, not square flakes
  float sg4 = sg*sg*sg*sg;
  vec3 col = sky*w + uSunUCol * (sg4*spk*.4) + mix(uUpHor, vec3(.8, .84, .9), .5) * (sk*fine*.04*(1. - smoothstep(110., 380., dist)));
  float ff = sceneFog()*uSceneFog;
  col = mix(col, fogCol(), ff*.0);
  gl_FragColor = vec4(col, min(w + dark, .96));
}`;

// the feet of the buildings: opaque panes of the same water, a little darker and bluer when looked down on (the building's
// shadow thrown up onto the surface), the very same water at grazing angles; a dark line where wall meets surface
const CAP_VERT = /* glsl */`
attribute vec4 aD;
varying vec3 vWp; varying vec2 vLp; varying vec2 vUv; varying vec4 vD;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position.x, -position.y, position.z, 1.); vWp = wp.xyz; vLp = wp.xz - modelMatrix[3].xz;
  vUv = uv; vD = aD;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WATER_CAP_FRAG = /* glsl */`
${WATER_COMMON}
uniform vec3 uCapTint; uniform float uCapK;
varying vec2 vUv; varying vec4 vD;
void main(){
  vec3 Vr = vWp - cameraPosition; float dist = length(Vr); Vr /= max(dist, 1e-3);
  vec3 rp = ripple(vLp);
  float k = 2.2 / (1. + dist*.006);
  vec3 n = normalize(vec3(-rp.y*k, 1., -rp.z*k));
  vec3 R = reflect(Vr, n); R.y = abs(R.y) + .003;
  vec3 col = lowerSky(normalize(R));
  float gz = 1. - clamp(abs(Vr.y), 0., 1.);                    // 0 looking straight down, 1 at a grazing angle
  float same = max(max(smoothstep(.74, .95, gz), .78*step(1.5, vD.y)), .94);   // the feet are the lake's own water, a little shaded
  vec2 e2 = min(vUv, 1. - vUv) * vD.zw;                        // metres from the pane's edge
  float edge = min(e2.x, e2.y);
  float rim = 1. - smoothstep(.0, .22 + dist*.0012, edge);
  float lum = dot(col, vec3(.3, .55, .15));
  vec3 deep = mix(vec3(lum), col, .8) * uCapTint * uCapK * (1. - .45*smoothstep(.18, .7, lum));   // under a bright sky the shadow is deeper
  deep *= .82 + .18*smoothstep(0., 4., edge);                  // darkest against the walls
  col = mix(deep, col, same);
  col *= 1. - .16*rim*(1. - .35*same);
  col = mix(col, fogCol(), sceneFog()*uSceneFog);
  gl_FragColor = vec4(col, 1.);
}`;

function cityMaterial(U, defines = {}, extra = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: CITY_VERT, fragmentShader: CITY_FRAG, fog: true, side: THREE.DoubleSide, defines, ...extra,
  });
}

// ---------------------------------------------------------------- build
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : PALETTE;
  const P = pal.map(C);
  // per-seed variety: livery, canal bend, lower sun azimuth, skyline
  const livery = rng.pick([0, 0, 1, 2]);
  const bend = rng.sign() * rng.range(10, 13) * .42;
  const sunAz = rng.range(-0.16, 0.2);
  const sunL = new THREE.Vector3(Math.sin(1.12 + sunAz), 0.125, -Math.cos(1.12 + sunAz)).normalize();   // behind us, to the right, 7 deg up
  const coral = mulc(mixc(P[3], P[4], 0.45), 0.8), cream = mulc(mixc(C('#F2E2C4'), P[3], 0.18), 0.8), ochre = mulc(mixc(P[6], P[4], 0.4), 0.78);
  const K = {
    rose: mulc(P[3], 0.8), gold: mulc(P[6], 1.0), cap: mulc(P[2], 0.6), verdi: mulc(mixc(P[1], C('#5FA890'), 0.4), 0.8),
    stone: mulc(C('#E6D8BF'), 0.84), bronze: C('#4A3524'), brick: mulc(mixc(C('#B9705A'), P[4], 0.25), 0.82),
    roof: mulc(mixc(C('#B5522C'), P[4], 0.3), 0.85), plasters: [coral, cream, ochre, mulc(P[3], 0.78), mulc(mixc(cream, P[4], 0.3), 0.9)],
    dark: C('#3A2A36'), white: C('#E8E2D6'), red: C('#B3261E'), teal: P[2], livery,
  };
  if (livery === 1) {             // white marble, blue-tiled domes
    K.plasters = [mulc(C('#EFE7DA'), 0.84), mulc(C('#E9D9C6'), 0.82), cream, mulc(mixc(C('#EFE7DA'), P[3], 0.35), 0.82), mulc(C('#DCCFC0'), 0.85)];
    K.verdi = mulc(mixc(C('#3F6FA8'), P[2], 0.25), 0.85); K.brick = mulc(C('#E3D3BD'), 0.82);
  } else if (livery === 2) {      // brick and slate, copper spires
    K.plasters = [K.brick, mulc(C('#A8604C'), 0.85), coral, ochre, mulc(C('#C98F70'), 0.85)];
    K.roof = mulc(mixc(C('#5A5868'), P[5], 0.35), 0.9); K.verdi = mulc(mixc(C('#C0764A'), P[4], 0.3), 0.8);
  }
  K.plasters = K.plasters.map((c) => satc(c, 1.3)); K.brick = satc(K.brick, 1.2); K.roof = satc(K.roof, 1.2);
  const U = {
    uTime: { value: 0 }, uSwing4: { value: 0 }, uBarge: { value: new THREE.Vector4(0, -9999, 0, 1) },
    uSkyPeach: { value: new THREE.Color(pal[4]) }, uSkyRose: { value: new THREE.Color(pal[3]) }, uSkyViolet: { value: new THREE.Color(pal[5]) },
    uSunL: { value: sunL }, uShiver: { value: 1 }, uLit: { value: 0.3 }, uSceneFog: { value: opts.sceneFog ?? 0.35 },
    uSunCol: { value: new THREE.Vector3(1.38, 0.74, 0.42) }, uAmbSky: { value: new THREE.Vector3(0.3, 0.2, 0.28) }, uAmbShade: { value: new THREE.Vector3(0.14, 0.11, 0.3) },
    uCapCol: { value: new THREE.Vector3(...K.cap) }, uWinCol: { value: new THREE.Color('#FBE9D0') },
    uPend: { value: new THREE.Vector3(0, 0, CAMP.pivot) },
    uMovers: { value: Array.from({ length: 13 }, () => new THREE.Vector4(0, -9999, 0, 0)) },
    uRings: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, -9999, 0, 0)) },
    uWakes: { value: Array.from({ length: 3 }, () => new THREE.Vector4(0, -9999, 0, 0)) },
    uRain: { value: 0 }, uCamL: { value: new THREE.Vector2() }, uBarA: { value: new THREE.Vector3(1.05, 0.5, 0.42) }, uBarB: { value: new THREE.Vector3(0.5, 0.3, 0.52) },
    uSunGlow: { value: new THREE.Vector3(1, 0.5, 0.2) }, uMoon: { value: new THREE.Vector4(0.26, 0.42, 0.87, 0) },
    uPaws: { value: new THREE.Vector2(1, 0) }, uPGlow: { value: new THREE.Vector4(0, -62, 1100, 0) }, uUpBand: { value: new THREE.Color('#7f9fb8') },
    uFlock: { value: new THREE.Vector4(0, 150, 0, 0) },
    uCapTint: { value: new THREE.Vector3(0.66, 0.76, 0.95) }, uCapK: { value: 0.6 },
  };
  const object = new THREE.Group(); object.name = 'city-in-the-lake';
  const add = (mesh, order) => { mesh.frustumCulled = false; mesh.renderOrder = order; mesh.matrixAutoUpdate = true; object.add(mesh); return mesh; };

  // --- layout shared by everything
  const L = makeLayout(rng.fork('layout'), bend);

  // --- static city: one merged mesh
  const b = new Builder(), caps = new Builder(); b.sink = caps;
  buildCampanile(b, K, rng.fork('camp'));
  await ctx.yield();
  const canal = await buildCanal(b, K, rng.fork('canal'), L, detail, () => ctx.yield());
  await ctx.yield();
  buildBridges(b, K, rng.fork('bridges'), L);
  await ctx.yield();
  await buildDome(b, K, rng.fork('dome'), L, () => ctx.yield());
  await ctx.yield();
  await buildFill(b, K, rng.fork('fill'), L, detail, ctx.noise, () => ctx.yield());
  await ctx.yield();
  const cityMat = cityMaterial(U);
  const cityGeo = new THREE.BufferGeometry();      // attribute by attribute, a loading step each
  for (const [name, arr, size] of [['position', b.p, 3], ['normal', b.n, 3], ['color', b.c, 3], ['uv', b.u, 2], ['aD', b.d, 4]]) { cityGeo.setAttribute(name, new THREE.Float32BufferAttribute(arr, size)); await ctx.yield(); }
  cityGeo.setIndex(b.nv > 65535 ? new THREE.Uint32BufferAttribute(b.i, 1) : new THREE.Uint16BufferAttribute(b.i, 1));
  const city = add(new THREE.Mesh(cityGeo, cityMat), 2);
  await ctx.yield();
  const capMesh = add(new THREE.Mesh(caps.geometry(), new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: CAP_VERT, fragmentShader: WATER_CAP_FRAG, fog: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 3 })), 2);
  await ctx.yield();

  // --- pendulum
  const bp = new Builder(); buildPendulum(bp, K);
  add(new THREE.Mesh(bp.geometry(), cityMaterial(U, { PENDULUM: 1 })), 2);
  await ctx.yield();

  // --- things that travel, wheel and hang
  const life = buildLife(K, rng.fork('life'), L, detail, U, cityMaterial, canal, !!opts.airship);
  for (const m of life.meshes) add(m, m.userData.order ?? 2);
  await ctx.yield();

  // --- the lake itself (optional)
  let base = null, veil = null;
  if (opts.water !== false) {
    const R = opts.waterRadius ?? 3200;
    const g = new THREE.CircleGeometry(R, 96); g.rotateX(-Math.PI / 2);
    const up = opts.upperSky || [pal[0], '#6FA8D8'];
    const su = opts.upperSun ? new THREE.Vector3(...opts.upperSun).normalize() : new THREE.Vector3(-0.947, 0.276, 0.167).normalize();
    const wu = { ...U, uUpHor: { value: new THREE.Color(up[0]) }, uUpZen: { value: new THREE.Color(up[1]) }, uSunU: { value: su }, uSunUCol: { value: new THREE.Vector3(4, 3.7, 3.1) } };
    base = add(new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...wu },
      vertexShader: WATER_VERT, fragmentShader: WATER_BASE_FRAG, fog: true, depthWrite: false })), 1);
    veil = add(new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...wu },
      vertexShader: WATER_VERT, fragmentShader: WATER_VEIL_FRAG, fog: true, depthWrite: false, transparent: true, premultipliedAlpha: true })), 4);
  }

  // --- motion state
  const TH0 = 14 / CAMP.pivot, DIP = 3.4; let TOUCH_U = opts.touchU ?? 0.49; const LIT = opts.lit || [0.3, 0.85];
  let prog = -1, progDur = 46, ts = 0, lastTime = null, bargeManual = null; const bargeM = [0, 0, 1, 0];
  const wrap = (x, m) => ((x % m) + m) % m;
  function setProgress(u, duration = 46, touchU) { prog = clamp(u, 0, 1); progDur = duration; if (touchU != null) TOUCH_U = touchU; }
  function setBarge(x, z, amount = 1, heading = 0) { bargeM[0] = x; bargeM[1] = z; bargeM[2] = amount; bargeM[3] = heading; bargeManual = bargeM; }
  function setAirship(x, z, heading, height) { U.uMovers.value[12].set(x, z, heading, height); }
  function update(dt, time, camera) {
    const d = Math.min(Math.max(dt || 0, 0), 0.1);
    if (lastTime === null) ts = prog >= 0 ? (prog - TOUCH_U) * progDur : time;
    lastTime = time;
    let rate = 1;
    if (prog >= 0) {            // ease the swing's phase onto the journey so the touch lands at u 0.49
      const e = wrap((prog - TOUCH_U) * progDur - ts + 2, 4) - 2;
      rate = clamp(1 + e * 1.5, 0.25, 2.2);
      U.uLit.value = lerp(LIT[0], LIT[1], clamp(prog / 0.9, 0, 1));
    } else U.uLit.value = 0.3 + 0.55 * smoothstep(0, 50, time % 70) * (1 - smoothstep(64, 70, time % 70));
    ts += d * rate;
    const ph = Math.PI * ts / 4, s = Math.sin(ph);
    U.uTime.value = time; U.uSwing4.value = wrap(ts, 4);
    if (camera) { const e = camera.matrixWorld.elements; U.uCamL.value.set(e[12] - object.position.x, e[14] - object.position.z); }
    U.uPend.value.set(TH0 * s, DIP * s * s, CAMP.pivot);
    life.update(d, time, ts, bargeManual, camera);
  }
  await ctx.yield();
  update(0, 0, null);

  const dive0 = new THREE.Vector3(0, 62, L.domeZ - 104), dive1 = new THREE.Vector3(0, -62, L.domeZ);
  const fly = [[0, 70, -330], [30, 70, -200], [20, 30, -80], [7, 5, 0]];
  for (let z = 40; z <= 300; z += 32.5) fly.push([L.axis(z), 2.5, z]);
  fly.push([0, 30, 345], [0, 72, 405], [0, 62, L.domeZ - 104], [0, -62, L.domeZ]);
  const anchors = {
    touchPoint: new THREE.Vector3(0, 0, 0), pendulumPivot: new THREE.Vector3(0, -CAMP.pivot, 0),
    canalAxis: (z) => L.axis(z), canalStart: 40, canalEnd: 300, bridges: L.bridgeZ.slice(),
    // open water with nothing hanging under it within m metres (for rings and wakes, which must not lie across a wall)
    clear: (x, z, m = 6) => L.open(x, z, -m) && !(L.extra || []).some((e) => Math.hypot(x - e[0], z - e[1]) < e[2] + m),
    flyThrough: fly.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    portalSeat: { position: dive1.clone(), normal: dive0.clone().sub(dive1).normalize(), radius: 7 },
    diveLine: [dive0, dive1], domeCenter: new THREE.Vector3(0, 0, L.domeZ), domeRadius: L.domeR,
    posts: canal.posts, ferries: (time) => life.ferries(time), bargeAt: (time) => life.bargeAt(time),
    viewpoints: { reveal: new THREE.Vector3(0, 70, -330), finialPass: new THREE.Vector3(7, 5, -14), canal: new THREE.Vector3(L.axis(170), 2.5, 170), domeCrest: new THREE.Vector3(0, 72, 405) },
    lowerSunDir: new THREE.Vector3(sunL.x, -sunL.y, sunL.z),
  };
  return {
    object, radius: 230, height: 100, center: new THREE.Vector3(0, 24, 90), anchors,
    update, dispose() {}, ground: false, groundY: 0,
    setProgress, setBarge, setAirship, uniforms: U, glsl: { uniforms: GLSL_UNI, noise: GLSL_NOISE, ripple: GLSL_RIPPLE, lowerSky: GLSL_LOWERSKY },
    meshes: { city, base, veil }, livery,
  };
}

// ---------------------------------------------------------------- layout
function makeLayout(rng, bend) {
  const z0 = 40, z1 = 300;
  const axis = (z) => { const t = clamp((z - z0) / (z1 - z0), 0, 1); return bend * Math.sin(t * TAU) * smoothstep(0, 0.12, t) * (1 - smoothstep(0.88, 1, t)); };
  const slope = (z) => (axis(z + 1) - axis(z - 1)) / 2;
  const L = { z0, z1, axis, slope, half: 20, bridgeZ: [172, 234], domeZ: 540, domeR: 60, basinZ: 420, basinR: 120, bend,
    isle: [-330 - rng.range(0, 10), -211 - rng.range(-3, 4), 46], cityR: 640 };
  // two outlying islands near the entry, so towers hang in the first water the traveller sees
  L.isles = [L.isle, [62 + rng.range(0, 10), -352 + rng.range(-8, 8), 36], [-80 + 0 * rng.range(0, 12), -394 + 0 * rng.range(-6, 8), 30], [L.isle[0] + 46 - 6 + 210 + 18, L.isle[1], 27]];   // [3]: where the long bridge lands
  L.lagoonL = (z) => -(170 + 1.6 * (-z - 40)); L.lagoonR = (z) => 78 + 0.3 * (-z - 40);
  // is (x, z) open water? (canal, basin, dome, piazza, lagoon mouth); returns clearance margin test
  L.open = (x, z, m = 0) => {
    if (z > z0 - 6 && z < z1 + 4 && Math.abs(x - axis(z)) < 20 + m) return true;
    if (Math.hypot(x, z - L.basinZ) < L.basinR + m) return true;
    if (Math.hypot(x, z - L.domeZ) < L.domeR + 10 + m) return true;
    if (Math.hypot(x, z) < 46 + m) return true;
    if (z < -40 + m && x > L.lagoonL(z) - m && x < L.lagoonR(z) + m) { for (const il of L.isles) if (Math.hypot(x - il[0], z - il[1]) <= il[2] - m) return false; return true; }
    return false;
  };
  return L;
}

// ---------------------------------------------------------------- the grand canal: palazzi
function lantern(b, x, y, z, K, s = 1, inten = 4) {
  b.lathe(x, z, [[.02, y - .5 * s], [.26 * s, y - .28 * s], [.3 * s, y + .22 * s], [.05 * s, y + .5 * s]], 4, mulc([1, .78, .5], 1), [M.LAMP, 0, inten, 0], .78);
}
function chimney(b, x, y, z, h, col) {
  b.lathe(x, z, [[.38, y], [.36, y + h * .62], [.85, y + h * .9], [.85, y + h], [.5, y + h + .12]], 6, col, [M.PLAIN, x * .3, 0, 0], .2);
}
function palazzo(b, K, rng, w, bays, front) {
  const sd = rng() * 50, bw = w / bays, col = rng.pick(K.plasters), col2 = mixc(col, K.rose, rng.range(0, .3));
  const dpt = rng.range(12, 17), arcade = rng.chance(0.68), g0 = arcade ? rng.range(5.2, 6) : rng.range(4.6, 5.2);
  const nf = rng.int(2, 4), fh = rng.range(3.7, 4.5) * (nf === 2 ? 1.25 : 1), top = g0 + nf * fh + 1.0;
  const hw = w / 2, stone = mulc(K.stone, rng.range(.9, 1.02)), D = [M.FACADE, sd, bw, fh];
  if (arcade) {
    const R = bw / 2 - .5, spring = g0 - 1.1 - R, arcs = [];
    for (let i = 0; i < bays; i++) arcs.push({ cx: -hw + bw * (i + .5), R });
    archPanel(b, -hw, hw, spring, g0, 0, arcs, mixc(col, stone, .5), [M.PLAIN, sd, 0, 0], .7, mulc(stone, .7), [M.STONE, sd, 0, 0], 8);
    for (let i = 0; i <= bays; i++) {
      const cx = -hw + bw * i, e = i === 0 || i === bays;
      if (e) b.box(cx - (i ? .55 : 0), 0, -.7, cx + (i ? 0 : .55), spring, 0, mixc(col, stone, .5), [M.PLAIN, sd, 0, 0], 'xXZ');
      else column(b, cx, -.35, 0, spring, .3, stone, 6);
    }
    b.wall(hw, -3.2, -hw, -3.2, 0, g0, mulc(col, .55), [M.DARK, sd, bw, 0]);                    // back wall with doors
    b.quad([-hw, g0 - .25, -3.2], [hw, g0 - .25, -3.2], [hw, g0 - .25, -.7], [-hw, g0 - .25, -.7], mulc(col2, .6), [M.PLAIN, sd, 0, 0], [[-hw, 0], [hw, 0], [hw, 2.5], [-hw, 2.5]]);
    for (const e of [-1, 1]) b.wall(e * hw, e < 0 ? -3.2 : 0, e * hw, e < 0 ? 0 : -3.2, 0, g0, mixc(col, stone, .3), [M.PLAIN, sd, 0, 0]);
    if (front && rng.chance(.55)) {   // striped awning over one bay
      const i = rng.int(0, bays - 1), cx = -hw + bw * (i + .5), ac = rng.pick([K.red, K.teal, mulc(K.gold, .8), K.verdi]);
      b.quad([cx - R, g0 - 1.3, .05], [cx + R, g0 - 1.3, .05], [cx + R, g0 - 2.3, 2.1], [cx - R, g0 - 2.3, 2.1], ac, [M.CLOTH, sd, .35, 2.2], [[0, 0], [0, 2 * R], [2.2, 2 * R], [2.2, 0]]);
    }
  } else {
    b.wall(hw, 0, -hw, 0, 0, g0, mulc(mixc(col, stone, .3), 1.35), [M.DARK, sd, w / bays, 0]);
    b.box(-hw - .08, 0, 0, hw + .08, .45, .2, mixc(col, stone, .6), [M.STONE, sd, 0, 0], 'ZyY'); b.box(-hw - .08, g0 - .9, 0, hw + .08, g0 - .3, .2, mixc(col, stone, .6), [M.STONE, sd, .5, .3], 'ZyY');
  }
  // body: canal front with windows; sides and back plainer
  b.wall(hw, 0, -hw, 0, g0, top, col, D, 0, 0, col2);
  b.wall(-hw, 0, -hw, -dpt, arcade ? g0 : 0, top, mulc(col, .92), D, 0, 0, col2, arcade ? 0 : -g0);
  b.wall(hw, -dpt, hw, 0, arcade ? g0 : 0, top, mulc(col, .92), D, 0, 0, col2, arcade ? 0 : -g0);
  b.wall(-hw, -dpt, hw, -dpt, 0, top, mulc(col, .88), D, 0, 0, null, -g0);
  if (arcade) for (const e of [-1, 1]) b.wall(e * hw, e < 0 ? -dpt : -3.2, e * hw, e < 0 ? -3.2 : -dpt, 0, g0, mulc(col, .9), [M.PLAIN, sd, 0, 0]);
  b.quad([-hw, .03, arcade ? -3.2 : 0], [hw, .03, arcade ? -3.2 : 0], [hw, .03, -dpt], [-hw, .03, -dpt], K.cap, [M.CAP, 2, 0, 0]);
  b.box(-hw - .1, g0 - .28, 0, hw + .1, g0 + .22, .4, stone, [M.STONE, sd, .42, .25], 'ZyYxX');              // string cornice over the arcade
  // balconies: a long one on the piano nobile, small ones above
  const nb = Math.min(bays, rng.int(1, 3)), b0 = Math.floor((bays - nb) / 2);
  const balc = (xa, xb, y, out) => {
    b.box(xa, y - .22, 0, xb, y, out, stone, [M.STONE, sd, 0, 0], 'xXZyY');
    for (const xx of [xa + .25, xb - .25]) b.box(xx - .12, y - .85, 0, xx + .12, y - .22, out * .7, mulc(stone, .85), [M.STONE, sd, 0, 0], 'xXZy');
    const BD = [M.BALUS, sd, 1.05, 0];
    b.wall(xb, out - .06, xa, out - .06, y, y + 1.05, stone, BD); b.wall(xa, out - .06, xa, 0, y, y + 1.05, stone, BD); b.wall(xb, 0, xb, out - .06, y, y + 1.05, stone, BD);
  };
  balc(-hw + bw * b0 + .35, -hw + bw * (b0 + nb) - .35, g0 + fh * .24, 1.15);
  for (let f = 1; f < nf; f++) for (let i = 0; i < bays; i++) if (rng.chance(.22)) balc(-hw + bw * i + .55, -hw + bw * (i + 1) - .55, g0 + fh * (f + .24), .8);
  // crowning cornice, roof or terrace, chimneys
  cornice(b, -hw, -dpt, hw, 0, top, .9, .7, stone, 2, .38);
  const ry = top + .9;
  if (rng.chance(.24)) {
    b.quad([-hw, ry, 0], [hw, ry, 0], [hw, ry, -dpt], [-hw, ry, -dpt], mulc(K.roof, .8), [M.ROOF, sd, 0, 0], [[0, 0], [w, 0], [w, dpt], [0, dpt]]);
    const BD = [M.BALUS, sd, 1, 0];
    b.wall(hw, 0, -hw, 0, ry, ry + 1, stone, BD); b.wall(-hw, 0, -hw, -dpt * .5, ry, ry + 1, stone, BD); b.wall(hw, -dpt * .5, hw, 0, ry, ry + 1, stone, BD);
    // altana with laundry
    const ax = rng.range(-hw + 2, hw - 5), az = -dpt * .55;
    for (const [px, pz] of [[ax, az], [ax + 3.6, az], [ax, az - 3], [ax + 3.6, az - 3]]) b.box(px - .08, ry, pz - .08, px + .08, ry + 2.7, pz + .08, K.dark, [M.PLAIN, sd, 0, 0], 'xXzZ');
    b.box(ax - .3, ry + 2.7, az - 3.3, ax + 3.9, ry + 2.82, az + .3, K.dark, [M.PLAIN, sd, 0, 0]);
    for (let k = 0; k < 4; k++) { const lx = -hw + 1.5 + k * 1.5 + rng() * .4, lw = rng.range(.7, 1.2), lh = rng.range(.9, 1.6);
      b.quad([lx, ry + 2.3, -1.6], [lx + lw, ry + 2.3, -1.6], [lx + lw, ry + 2.3 - lh, -1.6], [lx, ry + 2.3 - lh, -1.6], rng.pick([K.white, K.white, mulc(K.rose, 1.1), mulc(K.teal, 1.6)]), [M.CLOTH, sd + k, .45, 0], [[0, 0], [0, lw], [lh, lw], [lh, 0]]); }
  } else b.hipRoof(-hw, -dpt, hw, 0, ry, rng.range(2.6, 4.2), K.roof, [M.ROOF, sd, 0, 0], .5);
  const nc = rng.int(1, 3);
  for (let k = 0; k < nc; k++) chimney(b, rng.range(-hw + 1, hw - 1), ry + .6, -rng.range(1.2, 3) - (k % 2) * (dpt - 5), rng.range(2.6, 3.8), mixc(col, K.brick, .5));
  return { dpt, top: ry, g0 };
}

async function buildCanal(b, K, rng, L, detail, pause) {
  const posts = [];
  for (const side of [-1, 1]) {
    if (pause && side > 0) await pause();
    let z = L.z0 + rng.range(0, 2), nb = 0;
    while (z < L.z1 - 9) {
      if (pause && ++nb % 2 === 0) await pause();
      let bays = rng.int(3, 5), w = bays * rng.range(3.0, 3.4);
      if (z + w > L.z1) { bays = 3; w = Math.max(8, L.z1 - z); }
      const zc = z + w / 2, sl = L.slope(zc), nl = Math.hypot(1, sl);
      const nx = -side / nl, nz = side * sl / nl;           // facing the canal
      const ox = L.axis(zc) + side * L.half, ang = Math.atan2(nx, nz);
      const nearBridge = L.bridgeZ.some((bz) => Math.abs(zc - bz) < w / 2 + 5);
      b.frame(ox, 0, zc, ang);
      palazzo(b, K, rng, w - .15, bays, true);
      // striped mooring poles, gold-capped, in front
      const np = rng.int(1, 3);
      for (let k = 0; k < np && !nearBridge; k++) {
        const px = rng.range(-w / 2 + .6, w / 2 - .6), pz = rng.range(3.4, 5.2), ph = rng.range(3.4, 5), pc = rng.pick([K.red, K.teal, mulc(K.gold, .8), K.dark]);
        b.lathe(px, pz, [[.17, 0], [.16, ph], [.24, ph + .05], [.24, ph + .3], [.02, ph + .75]], 6, (t) => t > .3 ? K.gold : pc, [M.POLE, px, 0, 0], .1);
        b.quad([px - .3, .03, pz - .3], [px + .3, .03, pz - .3], [px + .3, .03, pz + .3], [px - .3, .03, pz + .3], K.cap, [M.CAP, 0, 0, 0]);
      }
      // a lit lamp standard at the corner of each palazzo (a bare mooring post stands over each one above)
      const lx = -w / 2 + .2, lz = 5.8;
      b.lathe(lx, lz, [[.16, 0], [.09, .5], [.07, 3.3], [.2, 3.45], [.05, 3.55]], 5, K.dark, [M.PLAIN, 0, 0, 0]);
      lantern(b, lx, 4.0, lz, K, 1.15, 5);
      const ca = Math.cos(ang), sa = Math.sin(ang);
      posts.push([ox + lx * ca + lz * sa, zc - lx * sa + lz * ca]);
      // wall lamps on brackets
      for (const lxx of [-w / 4, w / 4]) { b.box(lxx - .04, 4.2, 0, lxx + .04, 4.28, .7, K.dark, [M.PLAIN, 0, 0, 0], 'xXyY'); lantern(b, lxx, 3.85, .7, K, .7, 4); }
      z += w + (rng.chance(.16) ? rng.range(2.5, 4) : 0);
    }
  }
  b.frame(0, 0, 0, 0);
  return { posts };
}

// ---------------------------------------------------------------- shop-bridges
function buildBridges(b, K, rng, L) {
  for (const bz of L.bridgeZ) {
    const sd = rng() * 30, stone = mulc(K.stone, rng.range(.9, 1)), sl = L.slope(bz);
    b.frame(L.axis(bz), 0, bz, Math.atan(sl) * -1);
    const HW = 6.4, SP = 15.6, EX = L.half + 1.5, NS = 16;
    const yu = (x) => Math.abs(x) >= SP ? 0 : 7.4 * Math.sqrt(Math.max(0, 1 - (x / SP) * (x / SP)));   // underside (elliptic arch)
    const yd = (x) => 9.9 - 4.3 * Math.pow(Math.abs(x) / EX, 1.25);                                    // deck
    for (let i = 0; i < NS * 2; i++) {
      const xa = -EX + (2 * EX) * i / (NS * 2), xb = -EX + (2 * EX) * (i + 1) / (NS * 2);
      for (const sz of [-1, 1]) {
        const z = sz * HW, A = [xa, yu(xa), z], Bq = [xb, yu(xb), z], Cq = [xb, yd(xb), z], Dq = [xa, yd(xa), z];
        const uvq = [[xa, A[1]], [xb, Bq[1]], [xb, Cq[1]], [xa, Dq[1]]];
        if (sz > 0) b.quad(A, Bq, Cq, Dq, stone, [M.PLAIN, sd, .7, 0], uvq); else b.quad(Bq, A, Dq, Cq, stone, [M.PLAIN, sd, .7, 0], [uvq[1], uvq[0], uvq[3], uvq[2]]);
      }
      if (Math.abs(xa) < SP || Math.abs(xb) < SP) b.quad([xa, yu(xa), -HW], [xb, yu(xb), -HW], [xb, yu(xb), HW], [xa, yu(xa), HW], mulc(mixc(stone, K.brick, .5), .95), [M.PLAIN, sd, .8, 0], [[xa * 1.15, 0], [xb * 1.15, 0], [xb * 1.15, 12.8], [xa * 1.15, 12.8]]);
      b.quad([xa, yd(xa), HW], [xb, yd(xb), HW], [xb, yd(xb), -HW], [xa, yd(xa), -HW], mulc(stone, .8), [M.STONE, sd, 0, 0]);
    }
    for (const sz of [-1, 1]) {      // archivolt, keystone mask, abutment caps
      b.frame(L.axis(bz), 0, bz, -Math.atan(sl) + (sz < 0 ? Math.PI : 0));
      for (let i = 0; i < 14; i++) {
        const xa = -SP + 2 * SP * i / 14, xb = -SP + 2 * SP * (i + 1) / 14, o = 1.25;
        const k = (x) => 1 + o / Math.max(4, Math.hypot(x, yu(x) * 2));
        b.quad([xa, yu(xa), HW + .2], [xb, yu(xb), HW + .2], [xb * k(xb), yu(xb) + o * .9, HW + .2], [xa * k(xa), yu(xa) + o * .9, HW + .2], i % 2 ? K.stone : mulc(K.stone, .85), [M.STONE, sd + i, 0, 0]);
      }
      b.box(-1, 7.2, HW, 1, 9.6, HW + .5, K.stone, [M.STONE, sd, 0, 0], 'xXZyY');
      // two rows of shops climbing the ramps, a taller pavilion over the crown
      for (let i = -5; i < 5; i++) {
        if (i === -1 || i === 0) continue;
        const x0 = i * 3.5, x1 = x0 + 3.5, yb = Math.min(yd(x0), yd(x1)), ht = 3.6, col = rng.pick(K.plasters);
        b.box(x0 + .05, yb, 2.6, x1 - .05, yb + ht, HW + .25, col, [M.FACADE, sd + i, 3.4, ht], 'xXzZ');
        b.quad([x0 - .1, yb + ht, HW + .7], [x1 + .1, yb + ht, HW + .7], [x1 + .1, yb + ht + 1.3, 2.4], [x0 - .1, yb + ht + 1.3, 2.4], K.roof, [M.ROOF, sd + i, 0, 0], [[0, 0], [3.7, 0], [3.7, 4.5], [0, 4.5]]);
        if (i % 2) lantern(b, x0, yb + 2.6, HW + .65, K, .8, 4.5);
      }
      const py = yd(3.5) - .2;
      archPanel(b, -3.5, 3.5, py + 3.2, py + 7.6, HW + .45, [{ cx: 0, R: 2.3 }], rng.pick(K.plasters), [M.PLAIN, sd, 0, 0], .8, mulc(K.stone, .7), null, 8);
      for (const e of [-1, 1]) b.box(e < 0 ? -3.5 : 2.3, py, HW - .35, e < 0 ? -2.3 : 3.5, py + 3.2, HW + .45, K.stone, [M.STONE, sd, 0, 0], 'xXZ');
      b.wall(e3(3.5), HW + .45, e3(3.5), -HW - .45, py, py + 7.6, K.plasters[1], [M.FACADE, sd + 7, 4.3, 7.6]);
      b.box(-3.7, py + 7.6, HW + .2, 3.7, py + 8.2, HW + .8, K.stone, [M.STONE, sd, .4, .3], 'ZyYxX');
      b.box(-EX, 0, HW, -SP - .4, .03, HW, K.cap, [M.CAP, 0, 0, 0], '');
    }
    b.frame(L.axis(bz), 0, bz, -Math.atan(sl));
    const py = yd(3.5) - .2;
    b.hipRoof(-3.6, -HW - .5, 3.6, HW + .5, py + 8.2, 2.6, K.roof, [M.ROOF, sd, 0, 0], .4);
    b.lathe(0, 0, [[.1, py + 10.6], [.5, py + 11.2], [.5, py + 11.7], [.05, py + 12.6]], 6, K.gold, [M.GOLD, 0, 0, 0]);
    for (const e of [-1, 1]) b.quad([e * EX, .03, -HW], [e * SP, .03, -HW], [e * SP, .03, HW], [e * EX, .03, HW], K.cap, [M.CAP, 2, 0, 0]);
    for (const lx of [-9, -3, 3, 9]) for (const lz of [-3.2, 3.2]) lantern(b, lx, yu(lx) - .75, lz, K, .95, 5);          // lamps hung under the vault
  }
  b.frame(0, 0, 0, 0);
}
const e3 = (x) => x;

// ---------------------------------------------------------------- the great glass dome (ribs here, panes in buildLife)
const DOME_OCULUS = 10.5;
function domePt(R, H, ph, th, dr = 0) {   // ph: 0 at the rim .. pi/2 at the crown; th round the axis
  const r = (R + dr) * Math.cos(ph), y = (H + dr) * Math.sin(ph);
  return [r * Math.cos(th), y, r * Math.sin(th)];
}
async function buildDome(b, K, rng, L, pause) {
  const R = L.domeR, H = 62, phMax = Math.acos(DOME_OCULUS / R), NR = 24, NS = 14, sd = rng() * 9;
  b.frame(0, 0, L.domeZ, 0);
  const br = K.bronze, brL = mixc(K.bronze, K.gold, .3);
  for (let i = 0; i < NR; i++) {             // 24 ribs: tapering box-section fins
    if (pause && i % 4 === 3) await pause();
    const th = (i / NR) * TAU, tx = -Math.sin(th), tz = Math.cos(th);
    for (let s = 0; s < NS; s++) {
      const p0 = phMax * s / NS, p1 = phMax * (s + 1) / NS, w0 = lerp(.6, .15, s / NS), w1 = lerp(.6, .15, (s + 1) / NS);
      const o0 = domePt(R, H, p0, th, lerp(.7, .3, s / NS)), o1 = domePt(R, H, p1, th, lerp(.7, .3, (s + 1) / NS)), i0 = domePt(R, H, p0, th, lerp(-1.5, -.45, s / NS)), i1 = domePt(R, H, p1, th, lerp(-1.5, -.45, (s + 1) / NS));
      const off = (p, w, sgn) => [p[0] + tx * w * sgn, p[1], p[2] + tz * w * sgn];
      const D = [M.BRONZE, sd + i, 0, 0], DG = [M.GOLD, 0, 0, 0], gilt = mixc(K.bronze, K.gold, .62);
      b.quad(off(o0, w0, 1), off(o1, w1, 1), off(i1, w1, 1), off(i0, w0, 1), brL, D);
      b.quad(off(o1, w1, -1), off(o0, w0, -1), off(i0, w0, -1), off(i1, w1, -1), mulc(brL, .8), D);
      b.quad(off(o0, w0, -1), off(o1, w1, -1), off(o1, w1, 1), off(o0, w0, 1), gilt, DG);
      b.quad(off(i0, w0, 1), off(i1, w1, 1), off(i1, w1, -1), off(i0, w0, -1), gilt, DG);
    }
    // a gold boss where each rib meets the oculus ring, a plinth block at its foot
    const top = domePt(R, H, phMax, th, -.4);
    b.lathe(top[0], top[2], [[.05, top[1] - .9], [.7, top[1] - .3], [.7, top[1] + .3], [.05, top[1] + .9]], 5, K.gold, [M.GOLD, 0, 0, 0]);
    const ft = domePt(R, H, 0, th, 0), c = Math.cos(th), sn = Math.sin(th);
    b.frame(ft[0], 0, L.domeZ + ft[2], Math.PI / 2 - th);
    b.lathe(0, -.3, [[1.75, 0], [1.6, 1.1], [1.15, 1.6], [.95, 3.6], [1.2, 4.0], [.6, 4.6]], 6, (t) => t > .7 ? K.gold : mixc(K.bronze, K.gold, .2), [M.BRONZE, sd, 0, 0], .52);
    b.quad([-1.3, .03, -1.6], [1.3, .03, -1.6], [1.3, .03, 1.0], [-1.3, .03, 1.0], K.cap, [M.CAP, 0, 0, 0]);
    b.frame(0, 0, L.domeZ, 0);
  }
  // parallels: seven bronze hoops, the oculus a double gold ring
  if (pause) await pause();
  const hoops = [0.045, 0.2, 0.36, 0.52, 0.68, 0.84, 1].map((t) => t * phMax);
  hoops.forEach((ph, k) => {
    const last = k === hoops.length - 1, N = last ? 36 : 72, hw = last ? .9 : .42, col = last ? K.gold : brL, D = [last ? M.GOLD : M.BRONZE, sd + k, 0, 0];
    for (let s = 0; s < N; s++) {
      const t0 = (s / N) * TAU, t1 = ((s + 1) / N) * TAU, d = hw * 1.4 / H;
      const a0 = domePt(R, H, ph - d, t0, .55), a1 = domePt(R, H, ph - d, t1, .55), b0 = domePt(R, H, ph + d, t0, .55), b1 = domePt(R, H, ph + d, t1, .55);
      const c0 = domePt(R, H, ph - d, t0, -1.1), c1 = domePt(R, H, ph - d, t1, -1.1), d0 = domePt(R, H, ph + d, t0, -1.1), d1 = domePt(R, H, ph + d, t1, -1.1);
      b.quad(a0, a1, b1, b0, col, D); b.quad(c1, c0, d0, d1, col, D); b.quad(c0, c1, a1, a0, last ? col : br, D); if (last) b.quad(b0, b1, d1, d0, col, D);
    }
  });
  b.frame(0, 0, 0, 0);
}
function buildDomeGlass(K, L) {
  const g = new Builder(), R = L.domeR, H = 62, phMax = Math.acos(DOME_OCULUS / R), NT = 96, NP = 14;
  g.frame(0, 0, L.domeZ, 0);
  const rows = [];
  for (let k = 0; k <= NP; k++) {
    const ph = phMax * (0.045 + 0.955 * k / NP), row = [];
    for (let s = 0; s <= NT; s++) { const th = (s / NT) * TAU, p = domePt(R, H, ph, th, 0);
      row.push(g.v(p[0], p[1], p[2], Math.cos(ph) * Math.cos(th), Math.sin(ph), Math.cos(ph) * Math.sin(th), K.bronze, (s / NT) * 96, k * 3, [M.GLASS, 3.3, 0, 0])); }
    rows.push(row);
  }
  for (let k = 0; k < NP; k++) for (let s = 0; s < NT; s++) g.i.push(rows[k][s], rows[k][s + 1], rows[k + 1][s + 1], rows[k][s], rows[k + 1][s + 1], rows[k + 1][s]);
  return g.geometry();
}

// ---------------------------------------------------------------- the rest of the city: houses, towers, domes, the long bridge
function pennant(b, x, y, z, len, col, sd) {
  b.box(x - .06, y, z - .06, x + .06, y + len * .9 + 1.2, z + .06, [.1, .08, .08], [M.PLAIN, 0, 0, 0], 'xXzZ');
  b.tri([x, y + len * .9 + 1.1, z], [x, y + len * .9 + 1.1 - len * .42, z], [x + len, y + len * .9 + 1.1 - len * .2, z + .01], col, [M.CLOTH, sd, 1.3 / Math.max(1, len * .3), 0], [[0, 0], [0, 1], [len, .5]]);
}
function tower(b, K, rng, x, z, h, w, ang) {
  const sd = rng() * 60, col0 = rng.pick(K.plasters), hw = w / 2, stone = K.stone, fr = (v) => v - Math.floor(v);
  // no two towers alike: stone, plaster or brick; two to four windows to a face; tall or low storeys; two to four string courses; squat or steep cap
  const kind = fr(sd * .19), col = kind < .3 ? mixc(col0, stone, .55 + .3 * fr(sd * .53)) : kind < .62 ? col0 : mixc(col0, K.brick, .45 + .4 * fr(sd * .53));
  const nw = 2 + Math.floor(3 * fr(sd * .37)), fhT = 4.4 + 3.4 * fr(sd * .73), nb = 2 + Math.floor(3 * fr(sd * .61)), rf = .6 + 1.0 * fr(sd * .91);
  b.frame(x, 0, z, ang);
  const taper = hw * rng.range(.84, .94), bel = h * rng.range(.76, .84), N = Math.max(2, Math.ceil(bel / 9));
  for (let s = 0; s < 4; s++) {             // gently battered shaft, a vertex every 9 m so it can shiver
    b.frame(x, 0, z, ang + s * Math.PI / 2);
    for (let k = 0; k < N; k++) {
      const t0 = k / N, t1 = (k + 1) / N, a = lerp(hw, taper, t0), c = lerp(hw, taper, t1), y0 = bel * t0, y1 = bel * t1;
      b.quad([-a, y0, a], [a, y0, a], [c, y1, c], [-c, y1, c], mixc(col, K.rose, t0 * .3), [M.FACADE, sd, w / nw, fhT], [[0, y0], [w, y0], [w, y1], [0, y1]]);
    }
    for (let q = 1; q <= nb; q++) { const tk = q / (nb + 1), a = lerp(hw, taper, tk); b.box(-a - .3, bel * tk, a, a + .3, bel * tk + .9, a + .45, stone, [M.STONE, sd, .5, .5], 'ZyY'); }
    const bw = taper + .5;
    b.wall(bw, bw, -bw, bw, bel + .9, h * .93, mixc(col, stone, .5), [M.DARK, sd + s, bw * .95, 0]);
    b.box(-bw - .3, bel, bw, bw + .3, bel + .9, bw + .45, stone, [M.STONE, sd, .45, .5], 'ZyY');
    b.box(-bw - .3, h * .93, bw, bw + .3, h * .93 + .8, bw + .45, stone, [M.STONE, sd, .45, .5], 'ZyY');
  }
  b.frame(x, 0, z, ang);
  b.quad([-hw, .03, -hw], [hw, .03, -hw], [hw, .03, hw], [-hw, .03, hw], K.cap, [M.CAP, 0, 0, 0]);
  const ty = h * .93 + .8, tw = taper + .8, style = rng.int(0, 2);
  if (style === 0) b.hipRoof(-tw, -tw, tw, tw, ty, (h * .09 + w * .7) * rf, K.roof, [M.ROOF, sd, 0, 0], 0);
  else if (style === 1) b.lathe(0, 0, [[tw * .95, ty], [tw * 1.15, ty + w * .25], [tw * .95, ty + w * .6], [tw * .45, ty + w * .95], [.12, ty + w * 1.5]], 8, K.verdi, [M.VERDI, sd, 0, 0], .39);
  else { b.lathe(0, 0, [[tw * .8, ty], [tw * .8, ty + w * .5], [tw * .9, ty + w * .55], [.1, ty + w * 1.9]], 8, (t) => t < .5 ? mixc(col, stone, .4) : K.verdi, [M.VERDI, sd, 0, 0], .39); }
  const tip = ty + (style === 0 ? (h * .09 + w * .7) * rf : style === 1 ? w * 1.5 : w * 1.9);
  b.lathe(0, 0, [[.05, tip - .3], [.55, tip + .3], [.55, tip + .8], [.05, tip + 1.5]], 5, K.gold, [M.GOLD, 0, 0, 0]);
  if (rng.chance(.7)) pennant(b, 0, tip + 1.2, 0, rng.range(3, 5.5), rng.pick([K.red, mulc(K.gold, .8), K.white, K.teal]), sd);
}
function church(b, K, rng, x, z, r, ang) {
  const sd = rng() * 40, col = rng.pick(K.plasters), stone = K.stone, dh = r * rng.range(1.0, 1.5);
  b.frame(x, 0, z, ang);
  b.box(-r * 1.1, 0, -r * 2.4, r * 1.1, dh * .9, r * 1.2, col, [M.FACADE, sd, 4.2, dh * .45], 'xXzZ');           // nave
  b.hipRoof(-r * 1.1, -r * 2.4, r * 1.1, r * 1.2, dh * .9, r * .5, K.roof, [M.ROOF, sd, 0, 0], .6);
  b.quad([-r * 1.1, .03, -r * 2.4], [r * 1.1, .03, -r * 2.4], [r * 1.1, .03, r * 1.2], [-r * 1.1, .03, r * 1.2], K.cap, [M.CAP, 0, 0, 0]);
  for (const e of [-1, 1]) wing(b, K, e < 0 ? -r * 1.95 : r * 1.1, -r * .6, e < 0 ? -r * 1.1 : r * 1.95, r * .6, dh * .74, col, sd + 3 + e, 4.2, dh * .37, 1, K.roof, r * .42, .5);   // transepts
  const y0 = dh * .9 + r * .2, prof = [[r * .96, y0], [r * .96, y0 + r * .1]];                                    // drum, dome, lantern
  b.lathe(0, 0, [[r, dh * .7], [r, y0 - .6], [r * 1.08, y0 - .5], [r * 1.08, y0]], 16, mixc(col, stone, .6), [M.DARK, sd, TAU * r / 8, 0], 0);
  for (let i = 1; i <= 7; i++) { const t = (i / 7) * Math.PI * .5; prof.push([r * .96 * Math.cos(t) + (i === 7 ? r * .14 : 0), y0 + r * .1 + r * 1.08 * Math.sin(t)]); }
  b.lathe(0, 0, prof, 16, K.verdi, [M.VERDI, sd, 0, 0], 0);
  const ly = y0 + r * 1.18;
  b.lathe(0, 0, [[r * .15, ly - r * .05], [r * .15, ly + r * .28], [r * .22, ly + r * .3], [.05, ly + r * .55]], 8, (t) => t < .6 ? stone : K.verdi, [M.STONE, sd, 0, 0]);
  b.lathe(0, 0, [[.05, ly + r * .5], [r * .07, ly + r * .58], [.05, ly + r * .7]], 5, K.gold, [M.GOLD, 0, 0, 0]);
  return ly + r * .7;
}
// one wing of a house: four plastered walls with their own window rhythm, a foot that is the lake's surface, and a roof
// kind 0 hipped, 1 gabled (ridge along the longer side; the gable walls run up to it), 2 a flat terrace behind a parapet
function wing(b, K, x0, z0, x1, z1, h, col, sd, bay, fh, kind, roofCol, rise, eave = .8) {
  const c2 = mixc(col, K.rose, .22), D = [M.FACADE, sd, bay, fh], RD = [M.ROOF, sd, 0, 0];
  b.wall(x1, z1, x0, z1, 0, h, col, D, 0, 0, c2, -fh * .1); b.wall(x0, z0, x1, z0, 0, h, col, D, 0, 0, c2, -fh * .1);
  b.wall(x1, z0, x1, z1, 0, h, col, D, 0, 0, c2, -fh * .1); b.wall(x0, z1, x0, z0, 0, h, col, D, 0, 0, c2, -fh * .1);
  b.quad([x0, .03, z0], [x1, .03, z0], [x1, .03, z1], [x0, .03, z1], K.cap, [M.CAP, 0, 0, 0]);
  const w = x1 - x0, d = z1 - z0;
  if (kind === 2) {
    b.quad([x0, h, z1], [x1, h, z1], [x1, h, z0], [x0, h, z0], mulc(roofCol, .8), RD, [[0, 0], [w, 0], [w, d], [0, d]]);
    b.box(x0, h, z0, x1, h + 1.1, z1, mixc(col, K.stone, .5), [M.STONE, sd, 0, 0], 'xXzZ');
    return h + 1.1;
  }
  if (kind === 0) { b.hipRoof(x0, z0, x1, z1, h, rise, roofCol, RD, eave); return h + rise; }
  const o = eave, G = [M.PLAIN, sd, 0, 0], gc = mulc(c2, .96);
  if (w >= d) {                                        // ridge along x
    const zc = (z0 + z1) / 2, sl = Math.hypot(d / 2 + o, rise), r0 = [x0 - o, h + rise, zc], r1 = [x1 + o, h + rise, zc];
    b.quad([x0 - o, h, z1 + o], [x1 + o, h, z1 + o], r1, r0, roofCol, RD, [[0, 0], [w, 0], [w, sl], [0, sl]]);
    b.quad([x1 + o, h, z0 - o], [x0 - o, h, z0 - o], r0, r1, roofCol, RD, [[0, 0], [w, 0], [w, sl], [0, sl]]);
    b.tri([x0, h, z0], [x0, h, z1], [x0, h + rise * .96, zc], gc, G); b.tri([x1, h, z1], [x1, h, z0], [x1, h + rise * .96, zc], gc, G);
  } else {                                             // ridge along z
    const xc = (x0 + x1) / 2, sl = Math.hypot(w / 2 + o, rise), r0 = [xc, h + rise, z0 - o], r1 = [xc, h + rise, z1 + o];
    b.quad([x0 - o, h, z0 - o], [x0 - o, h, z1 + o], r1, r0, roofCol, RD, [[0, 0], [d, 0], [d, sl], [0, sl]]);
    b.quad([x1 + o, h, z1 + o], [x1 + o, h, z0 - o], r0, r1, roofCol, RD, [[0, 0], [d, 0], [d, sl], [0, sl]]);
    b.tri([x1, h, z0], [x0, h, z0], [xc, h + rise * .96, z0], gc, G); b.tri([x0, h, z1], [x1, h, z1], [xc, h + rise * .96, z1], gc, G);
  }
  return h + rise;
}
// a clipped cypress of the hanging gardens
function cypress(b, x, z, h, r, sd) {
  const g = [.05 + .03 * (sd % 1), .15, .09];
  b.lathe(x, z, [[r * .35, 0], [r, h * .22], [r * .85, h * .62], [.06, h]], 5, (t) => mulc(g, .8 + .5 * t), [M.PLAIN, sd, 0, 0], sd);
}
// one plot of the city: a handful of house forms, so that no two neighbours are alike. Returns the main wing (for what is added to it)
function houseCell(b, K, x0, z0, x1, z1, h, R, bn) {
  const [r1, r2, r3, r4, r5, r6] = R, fr = (v) => v - Math.floor(v);
  const t = fr(r3 * 13.7 + r6 * 5.3), f = .38 + .24 * fr(r1 * 9.7 + r4 * 3.1), g = fr(r2 * 7.9 + r5 * 4.3), W = x1 - x0, Dp = z1 - z0;
  const pc = (k) => K.plasters[Math.floor(fr(r2 * 3.7 + k * .37 + r5) * K.plasters.length) % K.plasters.length];
  const rc = (k) => mulc(K.roof, .8 + .34 * fr(r6 * 3.3 + k * .41)), sd = r1 * 80;
  const bay = (k) => 3.1 + 2.3 * fr(r4 * 5.1 + k * .63), fh = (k) => 3.3 + 1.5 * fr(r3 * 4.3 + k * .29);
  const W2 = (k, a0, c0, a1, c1, hh, kind) => wing(b, K, a0, c0, a1, c1, hh, pc(k), sd + k * 7.3, bay(k), fh(k), kind, rc(k), Math.min(a1 - a0, c1 - c0) * (.34 + .3 * fr(g + k * .37)));
  let main;
  if (t < .2) { main = [x0, z0, x1, z1, h]; W2(0, x0, z0, x1, z1, h, g < .8 ? 0 : 2); }
  else if (t < .42) {                                  // a pair of gabled houses side by side, ridges running back
    const xm = x0 + W * f, h2 = h * (.58 + .5 * g);
    W2(0, x0, z0, xm, z1, h, 1); W2(1, xm, z0 + Dp * .12 * g, x1, z1 - Dp * .2 * (1 - g), h2, g < .5 ? 1 : 0); main = [x0, z0, xm, z1, h];
  } else if (t < .6) {                                 // the same, one behind the other
    const zm = z0 + Dp * f, h2 = h * (.58 + .5 * g);
    W2(0, x0, z0, x1, zm, h, 1); W2(1, x0 + W * .15 * g, zm, x1 - W * .18 * (1 - g), z1, h2, g < .5 ? 1 : 0); main = [x0, z0, x1, zm, h];
  } else if (t < .8) {                                 // an L round a court of open water
    const wa = W * (.36 + .16 * g), db = Dp * (.36 + .16 * (1 - g)), flipX = r1 > .5, flipZ = r4 > .5;
    const ax0 = flipX ? x1 - wa : x0, ax1 = flipX ? x1 : x0 + wa, bx0 = flipX ? x0 : x0 + wa, bx1 = flipX ? x1 - wa : x1;
    W2(0, ax0, z0, ax1, z1, h, 1); W2(1, bx0, flipZ ? z1 - db : z0, bx1, flipZ ? z1 : z0 + db, h * (.6 + .35 * g), 1); main = [ax0, z0, ax1, z1, h];
    if (r6 > .5) cypress(b, (bx0 + bx1) / 2, flipZ ? z0 + (Dp - db) * .45 : z1 - (Dp - db) * .45, 8 + 5 * g, 1.3, sd);
  } else if (t < .92) {                                // three wings round a court, open to one side
    const wa = W * .3, db = Dp * .34, open = r4 > .5;
    W2(0, x0, z0, x0 + wa, z1, h, 1); W2(1, x1 - wa, z0, x1, z1, h * (.75 + .3 * g), 1);
    W2(2, x0 + wa, open ? z1 - db : z0, x1 - wa, open ? z1 : z0 + db, h * (.55 + .3 * g), 0); main = [x0, z0, x0 + wa, z1, h];
  } else {                                             // a walled garden: one small house, cypresses hanging from the lawn
    const hx = x0 + W * (.42 + .16 * g), hz = z0 + Dp * (.5 + .14 * g);
    W2(0, x0, z0, hx, hz, h * .8, 1); main = [x0, z0, hx, hz, h * .8];
    for (let k = 0; k < 4; k++) cypress(b, hx + (x1 - hx) * (.25 + .5 * fr(g * 3.1 + k * .37)), z0 + Dp * (.12 + .25 * k), 7 + 6 * fr(g + k * .61), 1.2 + .5 * fr(k * .7 + g), sd + k);
    cypress(b, x0 + (hx - x0) * .5, hz + (z1 - hz) * .55, 10 + 4 * g, 1.5, sd + 9);
  }
  return main;
}
async function buildFill(b, K, rng, L, detail, noise, pause) {
  const CELL = 25, cx0 = 0, cz0 = 180, n = Math.ceil(L.cityR / CELL);
  const specials = new Map(), key = (i, j) => i * 4096 + j;
  // churches with domes (eleven of them: the glass dome is the twelfth) and towers, kept off the water
  const place = (count, minR, maxR, tag, tries = 60) => {
    for (let c = 0, t = 0; c < count && t < count * tries; t++) {
      const a = rng() * TAU, rr = Math.sqrt(rng()) * (maxR - minR) + minR, x = cx0 + Math.cos(a) * rr, z = cz0 + Math.sin(a) * rr;
      const i = Math.round(x / CELL), j = Math.round(z / CELL);
      if (L.open(x, z, 22) || specials.has(key(i, j))) continue;
      let ok = true; for (const [k2, v] of specials) if (v.tag === tag && Math.hypot(v.x - x, v.z - z) < (tag === 'c' ? 150 : 42)) { ok = false; break; }
      if (!ok) continue;
      specials.set(key(i, j), { tag, x: i * CELL, z: j * CELL }); c++;
    }
  };
  place(10, 90, 560, 'c'); place(Math.round(rng.range(62, 78)), 60, 610, 't');
  // the landmarks a traveller could draw a map by, each in a piazza of open water of its own (L.extra keeps the houses off)
  const ex = (x, z, r) => (L.extra || (L.extra = [])).push([x, z, r]);
  ex(L.isle[0], L.isle[1] - 8, 34); ex(L.isle[0] + 30, L.isle[1] + 18, 14);
  church(b, K, rng, L.isle[0], L.isle[1], 17, rng.range(-.3, .3));                                    // the island at the end of the long bridge
  tower(b, K, rng, L.isle[0] + 30, L.isle[1] + 18, rng.range(84, 100), 10, 0);
  { const [ix, iz] = L.isles[1]; ex(ix + 6, iz - 4, 16); ex(ix - 16, iz + 14, 14);                      // twin towers right of the entry
    tower(b, K, rng, ix + 6, iz - 4, rng.range(96, 112), 11, rng.range(-.2, .2)); tower(b, K, rng, ix - 16, iz + 14, rng.range(58, 72), 8.5, rng.range(-.2, .2)); }
  { const [ix, iz] = L.isles[2]; ex(ix, iz - 6, 25); ex(ix + 26, iz + 10, 13);                          // the first hanging church, its low campanile
    church(b, K, rng, ix, iz, 12, rng.range(-.25, .25)); tower(b, K, rng, ix + 26, iz + 10, rng.range(50, 57), 8.5, 0); }
  { const [ix, iz] = L.isles[3]; ex(ix + 4, iz + 2, 14); tower(b, K, rng, ix + 4, iz + 2, rng.range(64, 76), 10, 0); }            // the gate tower where the long bridge lands
  ex(-104, 22, 40); church(b, K, rng, -104, 22, 19, Math.PI / 2);                                       // the great church beside the canal mouth
  ex(96, -10, 18); tower(b, K, rng, 96, -10, rng.range(150, 172), 13, rng.range(-.1, .1));              // the clock tower across from it
  ex(132, 44, 27); church(b, K, rng, 132, 44, 12.5, -Math.PI / 2);
  ex(-72, -64, 14); tower(b, K, rng, -72, -64, rng.range(72, 84), 9.5, 0);
  ex(70, 84, 13); tower(b, K, rng, 70, 84, rng.range(88, 104), 9, 0);
  if (pause) await pause();
  for (const v of specials.values()) {
    if (pause) await pause();
    if (v.tag === 'c') { const r = rng.range(10.5, 16.5); church(b, K, rng, v.x, v.z, r, rng.pick([0, Math.PI / 2, Math.PI, -Math.PI / 2])); }
    else { const big = rng.chance(.16), h = big ? rng.range(150, 220) : rng.range(58, 125); tower(b, K, rng, v.x, v.z, h, big ? rng.range(11.5, 14) : rng.range(7.5, 11), rng.range(-.2, .2)); }
  }
  // houses in contiguous blocks of 3 x 2 with narrow calli, streets between blocks, cut by meandering side canals and small squares
  const m3 = (i) => ((i % 3) + 3) % 3, m2 = (j) => ((j % 2) + 2) % 2;
  // every tower and dome hangs in a piazza of open water of its own (an irregular one), so it is seen to its full depth
  const hsh = (a, c) => { const v = Math.sin(a * 127.1 + c * 311.7) * 43758.5453; return v - Math.floor(v); };
  const piazza = new Set();
  for (const k of specials.keys()) { const i = Math.floor(k / 4096 + .5), j = k - i * 4096;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) if ((di || dj) && hsh(i + di * 1.7, j + dj * 2.3) < (di && dj ? .62 : .86)) piazza.add(key(i + di, j + dj)); }
  if (pause) await pause();
  for (let i = -n; i <= n; i++) { if (pause) await pause(); for (let j = -n; j <= n; j++) {
    const gx = cx0 + i * CELL, gz = cz0 + j * CELL, rr = Math.hypot(gx - cx0, gz - cz0);
    const edge = L.cityR * (0.84 + 0.16 * noise.n2(gx * .004 + 9, gz * .004));
    const r1 = rng(), r2 = rng(), r3 = rng(), r4 = rng(), r5 = rng(), r6 = rng();
    const onIsle = L.isles.some((il, k) => k > 0 && Math.hypot(gx - il[0], gz - il[1]) < il[2]);
    const sk = key(Math.round(gx / CELL), Math.round(gz / CELL));          // the towers' own grid (absolute, not centred on the city)
    if ((rr > edge && !onIsle) || specials.has(sk) || (piazza.has(sk) && !onIsle)) continue;
    if (Math.abs(noise.n2(gx * .0045 + 3.1, gz * .0045 - 7.7)) < .12) continue;                         // side canal
    if (Math.abs(noise.n2(gx * .0023 - 11.3, gz * .0023 + 5.9)) < .05) continue;                       // a wider, slower one
    const bi = Math.floor(i / 3), bj = Math.floor(j / 2), bn = noise.n2(bi * .9 + 40, bj * .9 - 13);
    if (bn > .4) continue;                                                                               // a square
    if (noise.n2(gx * .0075 + 71.3, gz * .0075 + 23.9) > .46) continue;                                  // a basin of open water
    const xl = gx - CELL / 2 + (m3(i) === 0 ? 3.2 : .15 + r1 * .5), xr = gx + CELL / 2 - (m3(i) === 2 ? 3.2 : .15 + r2 * .5);
    const zl = gz - CELL / 2 + (m2(j) === 0 ? 3.2 : .15 + r3 * .5), zr = gz + CELL / 2 - (m2(j) === 1 ? 3.2 : .15 + r4 * .5);
    const x = (xl + xr) / 2, z = (zl + zr) / 2, w = xr - xl, d = zr - zl, hw = w / 2, hd = d / 2;
    if (L.open(x, z, Math.max(w, d) * .6)) continue;
    if (L.extra && L.extra.some((e) => Math.hypot(x - e[0], z - e[1]) < e[2])) continue;
    const near = Math.hypot(x - clamp(x, -30, 30), z - clamp(z, -60, 560));          // distance from the camera's corridor
    if (near > 260 && r5 > detail * (1.2 - near / 900)) continue;
    // no two neighbours alike: form (houseCell), depth, colour, bay rhythm, roof, and for some of them something that hangs deeper
    const fr = (v) => v - Math.floor(v), q1 = fr(r1 * 7.31 + r5 * 3.77), q2 = fr(r2 * 5.13 + r6 * 9.1), q3 = fr(r3 * 11.7 + r1 * 2.9), q4 = fr(r4 * 3.3 + r2 * 6.1);
    const hh = (9 + 5 * bn + 13 * Math.pow(r5, 1.6) + 5 * Math.max(0, 1 - rr / 380)) * (r6 > .92 ? 1.4 : 1), sd = r1 * 80, col = K.plasters[(r2 * K.plasters.length) | 0];
    b.frame(x, 0, z, 0);
    const [x0, z0, x1, z1, h] = houseCell(b, K, -hw, -hd, hw, hd, hh, [r1, r2, r3, r4, r5, r6], bn);
    const mw = Math.min(x1 - x0, z1 - z0) / 2, roofCol = mulc(K.roof, .86 + r6 * .28), RD = [M.ROOF, sd, 0, 0], rise = mw * .5, ry = h;
    if (near < 150) { chimney(b, x0 + (x1 - x0) * (.2 + r5 * .6), ry + rise * .3, z0 + (z1 - z0) * (.25 + r3 * .5), 2.6 + r6 + rise * .5, mixc(col, K.brick, .5));
      if (r4 > .8) pennant(b, (x0 + x1) * .5, ry + rise + 1, (z0 + z1) * .5, 2.6, r5 > .5 ? K.red : mulc(K.gold, .8), sd); }
    const want = near < 420 ? .4 : .2;
    if (q3 < want) {                                   // what hangs deeper than the eaves and shows past the foot
      const kind = (q4 * 3) | 0, ex = q1 < .5 ? x0 : x1, ez = q2 < .78 ? z0 : z1, sgx = q1 < .5 ? -1 : 1, sgz = q2 < .78 ? -1 : 1;   // mostly on the side the flight sees
      if (kind === 0) {                                // a corner turret with a candle-snuffer roof
        const tr = 2.1 + q2 * 1.1, ty0 = Math.max(3, h - 9), ty1 = h + 4 + q1 * 9, cxm = ex + sgx * tr * .45, czm = ez + sgz * tr * .45;
        b.lathe(cxm, czm, [[tr, ty0], [tr, ty1], [tr * 1.25, ty1 + .3]], 7, mixc(col, K.stone, .35), [M.FACADE, sd + 3, tr * .9, 4.2], .2);
        b.lathe(cxm, czm, [[tr * 1.3, ty1 + .3], [tr * .6, ty1 + tr * 1.6], [.08, ty1 + tr * 4.2]], 7, q4 * 3 % 1 < .5 ? K.verdi : roofCol, q4 * 3 % 1 < .5 ? [M.VERDI, sd, 0, 0] : RD, .2);
        b.lathe(cxm, czm, [[.05, ty1 + tr * 4.1], [.4, ty1 + tr * 4.5], [.05, ty1 + tr * 5.1]], 4, K.gold, [M.GOLD, 0, 0, 0]);
      } else if (kind === 1) {                         // a belvedere tower on the edge, deeper than the roof by a few storeys
        const tw = 2.6 + q2 * 1.2, th = h + rise + 5 + q1 * 15, cxm = ex - sgx * tw * .6, czm = ez - sgz * tw * .6, DD = [M.FACADE, sd + 5, tw, 4.4];
        b.box(cxm - tw, h * .5, czm - tw, cxm + tw, th, czm + tw, mixc(col, K.rose, .25), DD, 'xXzZ');
        b.box(cxm - tw - .4, th, czm - tw - .4, cxm + tw + .4, th + .7, czm + tw + .4, K.stone, [M.STONE, sd, .5, .4], 'xXzZy');
        b.hipRoof(cxm - tw, czm - tw, cxm + tw, czm + tw, th + .7, tw * (1.3 + q4), q1 < .4 ? K.verdi : roofCol, q1 < .4 ? [M.VERDI, sd, 0, 0] : RD, .6);
      } else {                                         // a little dome on a drum, riding the ridge
        const dr = Math.min(mw * .55, 3.6 + q2 * 2.4), cxm = (x0 + x1) / 2 + sgx * mw * .3, czm = (z0 + z1) / 2 + sgz * mw * .3, dy = ry + rise * .35;
        b.lathe(cxm, czm, [[dr, dy], [dr, dy + dr * .9], [dr * 1.12, dy + dr], [dr * 1.05, dy + dr * 1.5], [dr * .7, dy + dr * 2.05], [dr * .2, dy + dr * 2.35], [.06, dy + dr * 3.1]], 8,
          (t) => t < .3 ? mixc(col, K.stone, .5) : K.verdi, [M.VERDI, sd, 0, 0], .3);
      }
    }
  } }
  // the fourteen-arch bridge out to the island, with lamp standards
  const zb = L.isle[1], xa = L.isle[0] + L.isle[2] - 6, xb = xa + 210, len = xb - xa, NA = 14, sp = len / NA, st = mulc(K.stone, .95);
  b.frame(xa, 0, zb, 0);
  for (const sz of [-1, 1]) {
    b.frame(sz > 0 ? xa : xb, 0, zb, sz > 0 ? 0 : Math.PI);
    const arcs = []; for (let k = 0; k < NA; k++) arcs.push({ cx: sp * (k + .5), R: sp / 2 - 1.3 });
    archPanel(b, 0, len, 1.2, sp / 2 + 2.6, 4, arcs, st, [M.PLAIN, 3, .8, 0], sz > 0 ? 8 : 0, mulc(mixc(st, K.brick, .4), .85), [M.PLAIN, 3, .9, 0], 6);
    for (let k = 0; k <= NA; k++) { b.box(sp * k - 1.3, 0, 3.6, sp * k + 1.3, 1.2, 4.6, st, [M.STONE, k, 0, 0], 'xXZ'); b.box(sp * k - 1, 1.2, 4, sp * k + 1, sp / 2 + 3.9, 4.5, mulc(st, 1.04), [M.STONE, k, 0, 0], 'xXZY'); }
    b.box(0, sp / 2 + 2.6, 4, len, sp / 2 + 3.1, 4.4, st, [M.STONE, 1, .6, .3], 'ZyY');
    b.wall(len, 4.1, 0, 4.1, sp / 2 + 3.1, sp / 2 + 4.2, st, [M.BALUS, 2, 1.1, 0]);
    for (let k = 0; k <= NA; k++) { const lx = sp * k; b.lathe(lx, 4.2, [[.12, sp / 2 + 3.9], [.07, sp / 2 + 7]], 4, K.dark, [M.PLAIN, 0, 0, 0]); lantern(b, lx, sp / 2 + 7.5, 4.2, K, 1.3, 5); }
  }
  b.frame(xa, 0, zb, 0);
  b.quad([0, sp / 2 + 3.1, -4], [len, sp / 2 + 3.1, -4], [len, sp / 2 + 3.1, 4], [0, sp / 2 + 3.1, 4], mulc(st, .7), [M.STONE, 0, 0, 0]);
  for (let k = 0; k <= NA; k++) b.quad([sp * k - 1.3, .03, -4.6], [sp * k + 1.3, .03, -4.6], [sp * k + 1.3, .03, 4.6], [sp * k - 1.3, .03, 4.6], K.cap, [M.CAP, 0, 0, 0]);
  b.frame(0, 0, 0, 0);
  L.longBridge = { x0: xa, x1: xb, z: zb, y: sp / 2 + 3.1 };
}

// ---------------------------------------------------------------- life: vessels, tram, procession, pigeons, dome glass
function hull(b, len, beam, h, col, trim, D, sheer = .5, N = 8, strake = false) {
  const sec = (t) => { const a = Math.abs(t); return [beam / 2 * Math.pow(Math.max(0, 1 - Math.pow(a, 2.4)), .55) + .04, h * (1 + sheer * t * t * (t > 0 ? 1.4 : .8))]; };
  for (let i = 0; i < N; i++) {
    const t0 = -1 + 2 * i / N, t1 = -1 + 2 * (i + 1) / N, z0 = t0 * len / 2, z1 = t1 * len / 2, [w0, y0] = sec(t0), [w1, y1] = sec(t1);
    for (const s of [-1, 1]) {
      const A = [s * w0 * .7, 0, z0], Bq = [s * w1 * .7, 0, z1], Cq = [s * w1, y1, z1], Dq = [s * w0, y0, z0];
      if (s > 0) b.quad(Bq, A, Dq, Cq, col, D, [[z1, 0], [z0, 0], [z0, y0], [z1, y1]], trim); else b.quad(A, Bq, Cq, Dq, col, D, [[z0, 0], [z1, 0], [z1, y1], [z0, y0]], trim);
    }
    b.quad([-w0, y0 - .15, z0], [w0, y0 - .15, z0], [w1, y1 - .15, z1], [-w1, y1 - .15, z1], mulc(trim, .5), D);
    if (strake) for (const s of [-1, 1]) for (const [f0, f1] of [[.8, .98], [.36, .45]]) {      // gilded strakes along the side
      const P = (w, y, z, f) => [s * (w * (.7 + .3 * f) + .035), y * f, z];
      const A = P(w0, y0, z0, f0), Bq = P(w1, y1, z1, f0), Cq = P(w1, y1, z1, f1), Dq = P(w0, y0, z0, f1);
      if (s > 0) b.quad(Bq, A, Dq, Cq, trim, [M.GOLD, 0, 0, 0]); else b.quad(A, Bq, Cq, Dq, trim, [M.GOLD, 0, 0, 0]);
    }
    const kc = mulc(mixc(col, [.16, .1, .1], .72), .8);
    for (const s of [-1, 1]) b.quad([0, .02, z0], [0, .02, z1], [s * w1 * .7, .02, z1], [s * w0 * .7, .02, z0], mulc(kc, .2), [M.PLAIN, 2, .22, 0], [[0, z0], [0, z1], [w1, z1], [w0, z0]], mulc(kc, .3));
  }
}
function buildLife(K, rng, L, detail, U, cityMaterial, canal, airship) {
  const meshes = [];
  // ---- movers: one merged mesh, each vertex carries its mover id
  const b = new Builder(), ids = [];
  const mark = (id, fn) => { const n0 = b.nv; b.frame(0, 0, 0, 0); fn(); for (let k = n0; k < b.nv; k++) ids.push(id, 0, 0, 0); };
  const gold = K.gold, PL = [M.PLAIN, 1, 0, 0];
  mark(0, () => {     // the state barge, 30 m: gilded hull, colonnaded canopy, curled prow, lanterns, pennants
    hull(b, 30, 5.4, 1.5, mulc(K.red, .62), gold, PL, .9, 10, true);
    for (let k = -3; k <= 3; k++) for (const s of [-1, 1]) column(b, s * 1.9, k * 2.1 - 2, 1.4, 3.1, .13, gold, 5);
    b.box(-2.3, 4.5, -8.8, 2.3, 4.8, 4.8, gold, [M.GOLD, 0, 0, 0], 'xXzZy');
    b.hipRoof(-2.3, -8.8, 2.3, 4.8, 4.8, 1.3, K.red, [M.CLOTH, 2, 0, 1.5], .25);
    for (const s of [-1, 1]) b.quad([s * 2.3, 4.5, -8.8], [s * 2.3, 4.5, 4.8], [s * 2.3, 3.8, 4.8], [s * 2.3, 3.8, -8.8], K.red, [M.CLOTH, 3, .5, 1.2], [[0, 0], [0, 13.6], [.7, 13.6], [.7, 0]]);
    b.lathe(0, 14.6, [[.28, 2.6], [.2, 4.6], [.45, 5.2], [.6, 5.9], [.35, 6.5], [.05, 7.1]], 6, gold, [M.GOLD, 0, 0, 0]);
    b.box(-1.6, 1.8, -14.2, 1.6, 3.6, -10.4, K.red, PL, 'xXzZ'); b.box(-1.8, 3.6, -14.4, 1.8, 3.85, -10.2, gold, [M.GOLD, 0, 0, 0]);
    for (const z of [-12, -6, 0, 6, 12]) for (const s of [-1, 1]) lantern(b, s * 2.5, 3.2, z, K, .75, 5);
    pennant(b, 0, 3.85, -12.3, 4.2, K.red, 1); pennant(b, 0, 2.6, 13.2, 3, mulc(gold, .8), 2);
    for (let k = -4; k <= 4; k++) for (const s of [-1, 1]) b.quad([s * 2.5, 1.5, k * 2.4 - .08], [s * 2.5, 1.5, k * 2.4 + .08], [s * 6.2, .15, k * 2.4 + .7], [s * 6.2, .15, k * 2.4 + .5], gold, PL);   // oars
  });
  const ferry = () => {   // white two-deck ferry, 24 m, lit saloon
    hull(b, 24, 5.6, 1.4, K.white, mulc(K.teal, 1.2), PL, .35, 8);
    b.box(-2.3, 1.3, -8.5, 2.3, 3.9, 6.5, K.white, [M.FACADE, 5, 1.9, 2.6], 'xXzZ');
    b.box(-2.7, 3.9, -9, 2.7, 4.1, 7.2, mulc(K.white, .9), PL);
    b.box(-1.9, 4.1, -7, 1.9, 6.3, 3.5, K.white, [M.FACADE, 8, 1.75, 2.2], 'xXzZ');
    b.box(-2.3, 6.3, -7.6, 2.3, 6.5, 4.2, mulc(K.white, .9), PL);
    b.wall(2.7, 7.2, 2.7, -9, 4.1, 5, K.white, [M.BALUS, 1, .9, 0]); b.wall(-2.7, -9, -2.7, 7.2, 4.1, 5, K.white, [M.BALUS, 1, .9, 0]);
    b.lathe(0, -3.5, [[.75, 6.5], [.7, 8.4], [.8, 8.5], [.8, 9.0], [.6, 9.05]], 8, (t) => t > .45 ? K.red : mulc(K.white, .9), PL);
    lantern(b, 0, 2.9, 10.6, K, .9, 5); lantern(b, 0, 7.2, 4, K, .7, 4); pennant(b, 0, 2.2, -11, 2.4, K.red, 4);
  };
  mark(1, ferry); mark(2, ferry); mark(3, ferry);
  mark(4, () => {     // the red tram, two cars
    for (const z0 of [-7.2, .4]) {
      b.box(-1.2, .45, z0, 1.2, 3.25, z0 + 6.8, K.red, [M.FACADE, 3, 1.36, 2.8], 'xXzZy');
      b.box(-1.28, 3.25, z0 - .1, 1.28, 3.42, z0 + 6.9, K.white, PL); b.box(-.9, 3.42, z0 + .5, .9, 3.6, z0 + 6.3, mulc(K.white, .85), PL, 'xXzZY');
      b.box(-1.24, 1.42, z0 - .02, 1.24, 1.56, z0 + 6.82, mulc(gold, .8), PL, 'xXzZ');
      for (const zz of [z0 + 1.2, z0 + 5.6]) b.box(-.9, 0, zz - .5, .9, .45, zz + .5, K.dark, PL, 'xXzZ');
    }
    b.box(-.04, 3.6, 2.5, .04, 5.0, 2.58, K.dark, PL, 'xXzZ'); b.box(-.7, 5.0, 2.3, .7, 5.06, 2.8, K.dark, PL);
    lantern(b, 0, 2.3, 7.35, K, .8, 6); lantern(b, 0, 2.3, -7.35, K, .5, 3);
  });
  const NP = 30, PSP = 6.5;
  mark(5, () => {     // a procession of lamps for the long bridge
    for (let k = 0; k < NP; k++) { const z = (k % 2 ? .9 : -.9) + rng.range(-.3, .3), x = k * PSP + rng.range(-.8, .8);
      b.box(x - .22, 0, z - .16, x + .22, 1.5, z + .16, K.dark, PL, 'xXzZ'); b.lathe(x, z, [[.02, 1.45], [.16, 1.62], [.02, 1.8]], 4, mulc(K.dark, 1.5), PL);
      b.box(x + .2, 1.2, z - .02, x + .26, 2.5, z + .02, K.dark, PL, 'xXzZ'); lantern(b, x + .23, 2.75, z, K, .6, 5); }
  });
  const gondola = () => { hull(b, 11, 1.5, .55, [.03, .03, .04], mulc(gold, .6), PL, 2.2, 8); b.box(-.5, .5, -1.4, .5, 1.5, .6, K.dark, PL, 'xXzZY');
    b.box(-.2, .6, -4.3, .2, 2.3, -3.95, K.dark, PL, 'xXzZ'); b.lathe(0, -4.1, [[.02, 2.25], [.17, 2.42], [.02, 2.6]], 4, mulc(K.white, .6), PL); lantern(b, 0, 1.25, 4.6, K, .55, 5); };
  mark(6, gondola); mark(7, gondola);
  mark(8, ferry); mark(9, ferry); mark(10, ferry); mark(11, ferry);     // four more, in a slow line across the lagoon
  if (airship) mark(12, () => {   // the rare one: an airship of the lower city, 120 m, lit gondola (y 0 = its keel)
    const NS = 18, NG = 12, len = 120, R = 11.5, cy = 15.5;
    const env = mulc(K.white, .92), stripe = mulc(K.red, .9), ring = (t) => R * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(t, .82))), .62);
    for (let i = 0; i < NS; i++) {
      const t0 = i / NS, t1 = (i + 1) / NS, z0 = (t0 - .5) * len, z1 = (t1 - .5) * len, r0 = ring(t0), r1 = ring(t1);
      for (let g = 0; g < NG; g++) {
        const a0 = g / NG * TAU, a1 = (g + 1) / NG * TAU, col = (g % 3 === 0) ? stripe : env, D = [M.PLAIN, g, 0, 0];
        const A = [Math.cos(a0) * r0, cy + Math.sin(a0) * r0, z0], Bq = [Math.cos(a1) * r0, cy + Math.sin(a1) * r0, z0];
        const Cq = [Math.cos(a1) * r1, cy + Math.sin(a1) * r1, z1], Dq = [Math.cos(a0) * r1, cy + Math.sin(a0) * r1, z1];
        if (r0 < .05) b.tri(A, Cq, Dq, col, D); else if (r1 < .05) b.tri(A, Bq, Cq, col, D); else b.quad(A, Bq, Cq, Dq, col, D, [[0, z0], [1, z0], [1, z1], [0, z1]]);
      }
      if (i > 1 && i < NS - 1 && i % 3 === 0) for (let g = 0; g < NG; g++) {      // gilded girdles
        const a0 = g / NG * TAU, a1 = (g + 1) / NG * TAU, rr = ring(t0) + .12;
        b.quad([Math.cos(a0) * rr, cy + Math.sin(a0) * rr, z0 - .4], [Math.cos(a1) * rr, cy + Math.sin(a1) * rr, z0 - .4], [Math.cos(a1) * rr, cy + Math.sin(a1) * rr, z0 + .4], [Math.cos(a0) * rr, cy + Math.sin(a0) * rr, z0 + .4], gold, [M.GOLD, 0, 0, 0]);
      }
    }
    for (const [fx, fy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {                 // four tail fins
      const zf = -len / 2 + 6, A = [fx * 3, cy + fy * 3, zf + 20], Bq = [fx * 15, cy + fy * 15, zf + 6], Cq = [fx * 15, cy + fy * 15, zf - 4], Dq = [fx * 2, cy + fy * 2, zf];
      b.quad(A, Bq, Cq, Dq, stripe, PL); b.quad(Dq, Cq, Bq, A, stripe, PL);
    }
    b.box(-2.6, 0, -10, 2.6, 3.6, 16, K.white, [M.FACADE, 11, 2.0, 3.4], 'xXzZ');   // the gondola: one long lit saloon
    b.box(-2.9, -.3, -10.6, 2.9, 0, 16.6, gold, [M.GOLD, 0, 0, 0]); b.box(-2.8, 3.6, -10.4, 2.8, 4.1, 16.4, mulc(K.white, .85), PL, 'xXzZ');
    for (const z of [-9, -3, 3, 9, 15]) for (const sx of [-1, 1]) { lantern(b, sx * 3.1, 1.2, z, K, .9, 6); b.box(sx * 2.2 - .08, 3.6, z - .08, sx * 2.2 + .08, cy - R * .78, z + .08, K.dark, PL, 'xXzZ'); }
    for (const sx of [-1, 1]) { b.box(sx * 9 - 1.2, 5.2, -22, sx * 9 + 1.2, 7.6, -15, K.dark, PL); lantern(b, sx * 9, 4.6, -18.5, K, .8, 5); }   // engine cars
    lantern(b, 0, 1.2, 18, K, 1.6, 7); pennant(b, 0, cy, -len / 2 - 1, 7, K.red, 6); pennant(b, 0, 4.2, 16.4, 3.4, mulc(gold, .8), 7);
  });
  const gm = b.geometry(); gm.setAttribute('aMove', new THREE.Float32BufferAttribute(ids, 4));
  meshes.push(new THREE.Mesh(gm, cityMaterial(U, { MOVER: 1 })));

  // ---- pigeons: one wheeling sheet 20 m across
  const nb = Math.round(72 * detail), fb = new Builder(), fm = [];   // few and large: a bird must show its two wings, or the flock is only flecks
  for (let i = 0; i < nb; i++) {
    const a = rng() * TAU, rr = Math.sqrt(rng()) * 12, su = Math.cos(a) * rr, sv = Math.sin(a) * rr * 1.5, ph = rng(), s = rng.range(.85, 1.2) * 2.5;
    const c = mulc(rng.pick([K.white, K.white, [.72, .72, .78], [.8, .76, .78], [.5, .5, .58]]), 1.3), D = [M.PLAIN, ph, 0, 0];
    const f = fb.v(0, 0, .17 * s, 0, 1, 0, c, 0, 0, D), k = fb.v(0, 0, -.15 * s, 0, 1, 0, mulc(c, .7), 0, 0, D);   // long narrow wings: a dove, not a dart
    const l = fb.v(-.62 * s, 0, -.12 * s, 0, 1, 0, mulc(c, .22), 0, 0, D), r = fb.v(.62 * s, 0, -.12 * s, 0, 1, 0, mulc(c, .22), 0, 0, D);   // dark wing tips
    fb.i.push(f, k, l, f, r, k);
    fm.push(su, sv, ph, 0, su, sv, ph, 0, su, sv, ph, 1, su, sv, ph, 1);
  }
  const gf = fb.geometry(); gf.setAttribute('aMove', new THREE.Float32BufferAttribute(fm, 4));
  meshes.push(new THREE.Mesh(gf, cityMaterial(U, { FLOCK: 1 })));
  U.uFlock.value.set(L.axis(185), 185, 10, 34);

  // ---- dome glass
  const glass = new THREE.Mesh(buildDomeGlass(K, L), cityMaterial(U, {}, { transparent: true, depthWrite: false }));
  glass.userData.order = 3; meshes.push(glass);

  // ---- routes
  const along = (zz, off) => { const z = clamp(zz, L.z0, L.z1); return [L.axis(z) + off, zz, Math.atan(L.slope(z))]; };
  // the barge rows a racetrack: up the canal on the left, round in the basin, back down on the right
  const ZA = L.z0 + 6, ZB = L.z1 - 6, LS = ZB - ZA, TR = 9, PER = 2 * LS + TAU * TR;
  const track = (d) => {
    d = ((d % PER) + PER) % PER;
    if (d < LS) return [L.axis(ZA + d) - TR, ZA + d];
    if (d < LS + Math.PI * TR) { const f = (d - LS) / TR; return [L.axis(ZB) - TR * Math.cos(f), ZB + TR * Math.sin(f)]; }
    if (d < 2 * LS + Math.PI * TR) { const z = ZB - (d - LS - Math.PI * TR); return [L.axis(z) + TR, z]; }
    const f = (d - 2 * LS - Math.PI * TR) / TR; return [L.axis(ZA) + TR * Math.cos(f), ZA - TR * Math.sin(f)];
  };
  const bargeAt = (time) => track(time * 7 + 60);
  const fOut = Array.from({ length: 7 }, () => [0, 0, 0, 0]), fSet = (k, a, b2, c, d) => { const o = fOut[k]; o[0] = a; o[1] = b2; o[2] = c; o[3] = d; };
  const ferries = (time) => {                         // returns one reused table: read it before the next call
    // each keeps to a lane the camera's line never crosses near the surface (the empty punts above must not sit in its way)
    const sg = L.bend >= 0 ? 1 : -1, a1 = time * .034 + .6, z1 = 230 + Math.sin(a1) * 44, o1 = -sg * 9 + 2.4 * Math.cos(a1);
    { const a0 = time * .024 + 4.2; fSet(0, Math.cos(a0) * 104, L.basinZ + 24 + Math.sin(a0) * 22, Math.atan2(-Math.sin(a0) * 104, Math.cos(a0) * 22), .6); }   // (the canal is kept for the barge: a ferry there stood across the street)
    const a2 = time * .028 + 2.6; fSet(1, Math.cos(a2) * 78, L.basinZ + 24 + Math.sin(a2) * 13, Math.atan2(-Math.sin(a2) * 78, Math.cos(a2) * 13), .7);   // (both ply the far half of the basin: the near half is the line's, where it rises)
    const a3 = time * .03 + 2; fSet(2, 58 + Math.sin(a3) * 36, -150 + Math.cos(a3) * 12, Math.atan2(Math.cos(a3) * 36, -Math.sin(a3) * 12), Math.abs(Math.cos(a3)) * .7);
    const tl = time % 180;
    for (let k = 0; k < 4; k++) fSet(3 + k, [-170, -134, -104, -58][k] + .8 * tl, -292 + [6, -8, 10, -9][k], Math.PI / 2, .25);   // across the lagoon, under the high view of the whole city
    return fOut;
  };
  const mv = U.uMovers.value;
  function update(dt, time, ts, bargeManual) {
    let bx, bz, bh = 0, amt = 1;
    if (bargeManual) { bx = bargeManual[0]; bz = bargeManual[1]; amt = bargeManual[2]; bh = bargeManual[3] || 0; }
    else { const d = time * 7 + 60, a = track(d - .6), c = track(d + .6); [bx, bz] = track(d); bh = Math.atan2(c[0] - a[0], c[1] - a[1]); const cs = Math.cos(bh); amt = cs * cs * cs * cs; }
    const fw = Math.cos(bh) >= 0 ? 1 : -1;
    mv[0].set(bx, bz, bh, Math.sin(time * .9) * .05);
    U.uBarge.value.set(bx, bz + 13 * fw, amt, fw);
    const fs = ferries(time);
    for (let k = 0; k < 7; k++) mv[k < 3 ? 1 + k : 5 + k].set(fs[k][0], fs[k][1], fs[k][2], Math.sin(time * .7 + k * 2) * .06);
    for (let k = 0; k < 3; k++) U.uWakes.value[k].set(fs[k][0] + Math.sin(fs[k][2]) * 11, fs[k][1] + Math.cos(fs[k][2]) * 11, fs[k][2], fs[k][3]);
    const tr = along(170 + Math.sin(time * .085) * 112, -L.half + 1.9);
    mv[4].set(tr[0], tr[1], tr[2], 0);
    const lb = L.longBridge;
    if (lb) mv[5].set(lb.x0 + 4 + ((time * 1.1) % PSP), lb.z, 0, lb.y);
    const g1 = time * .05, g2 = time * .045 + 2.4;
    mv[6].set(Math.sin(g1) * 60, L.basinZ + 24 + Math.cos(g1 * 1.3) * 16, Math.atan2(Math.cos(g1) * 60, -Math.sin(g1 * 1.3) * 20.8), Math.sin(time * 1.3) * .04);
    mv[7].set(L.isle[0] + 95 + Math.cos(g2) * 30, L.isle[1] + 20 + Math.sin(g2) * 55, Math.atan2(-Math.sin(g2) * 30, Math.cos(g2) * 55), Math.sin(time * 1.1) * .04);
  }
  return { meshes, update, ferries, bargeAt };
}
