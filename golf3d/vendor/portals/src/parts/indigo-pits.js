// THE BLUE YARD (indigo-pits): hero set piece: "The rising length".
//
// Over the largest dye pit stand sheer-legs of three lashed palm trunks 46 m tall carrying a wooden
// drum, and up to it out of the liquor climbs one tie-dyed cloth 6 m wide and 40 m long, hauled
// without pause. At the waterline it is yellow-green and streaming with bronze foam; by 6 m it is
// emerald, by 11 m teal, by 17 m clear blue and above 26 m full indigo: the dye oxidising in the air.
// Rows of resist roundels with pale haloes and stitched resist lines ride up it (the lowest still in
// their raffia bindings), liquor runs down it in dark rivulets, drips fall from both selvedges in
// bright threads and ring the pit, wind ripples travel up it, the drum turns and winds it on, and a
// basket of stones sinks as counterweight. The pit mirrors the whole length (analytic reflection).
//
// LOCAL SPACE (metres). Origin = centre of the pit at ground level, +Y up, front = +Z (the side the
// flight arrives from; the brief's flight runs toward -Z). The cloth is the plane z = 0, x -3..+3,
// from the liquor (y = -0.5) to the drum tangent (y = 39.6); the drum axis is (y 39.6, z -1.3).
// Pit: liquor radius 7, cement lip to radius 8.6. Legs: two side trunks footed at x = +-11.2, z = +1.5
// (almost in the plane of the cloth, so that from the whole front half-circle they stand wide of it: an A
// with the length hanging in it; the counterweight basket passes just behind them) leaning in and back to
// carry the drum axle at x = +-5.3 and ending in forks at y 46.5; one back trunk footed
// behind and to the right at (7, -9.5), so that from the front-left, where the flight climbs past the face of the
// length, it stands hidden behind the cloth. Everything solid lies inside radius 12.4, and above y 6 inside radius 11.
// Place the object UNROTATED (or rotated only about Y; light directions are world space).
//
// opts
//   palette   7 hex strings in the brief's order: haze white, ochre, deep indigo, blue, sky blue,
//             vat green, lizard orange (the orange is never used by the hero).
//   look      'noon' (default) | 'evening' | 'rain' | 'night': the analytic light preset. The world
//             should rather call setLight() with its own sun so the hero matches the yard exactly.
//   pattern   0 | 1 | 2: resist layout (default per seed): 0 staggered roundels + double stitched
//             lines, 1 roundels with satellite dots + zigzag stitching, 2 big roundels + chevrons.
//   apronCutGLSL  optional GLSL defining `float yardCut(vec2 worldXZ)`: > 0.5 discards the apron there (the world's
//             other pits lie inside the apron's radius).
//   apron     true (default): an earth disc (radius 21, alpha-faded edge) with the blue stain halo,
//             worn footpaths and one animated run-off runnel. Set false if the world's ground does it.
//   props     true (default): two rocking stirring poles and a turning calabash dipper in the pit.
//   drips     number of falling drip threads (default 320, thinned by ctx.quality.detail).
//   cwSide    -1 | 1: the end of the drum axle (local x) that carries the counterweight rope and basket (default per seed).
//
// anchors (local space)
//   clothBase / clothTop    centre of the cloth at the liquor and at the drum; clothNormal (+Z)
//   center                  what to look at for the whole piece
//   gazeAt(y)               function -> Vector3 on the cloth at height y (poi at camera height)
//   flyThrough              13 points: the brief's RISE, one left-hand turn starting on the +X side,
//                           radius 17.5 closing to 13.5, y 5.5 to 30; >= 6 m clear of every trunk.
//   viewpoints              { arrive, waterline, closest, drumPass, leave } camera positions
//   legs                    [{ foot, top }] x3: trunk centre lines (for agamas; trunk radius 0.55..0.3)
//   perches                 4 points on the head beam and fork tips for the two drum crows
//   drum                    centre of the drum; basket: counterweight rest position (moves in y)
//   pitRadius 7, lipRadius 8.6, liquorY -0.5, clearRadius 12.4, wellRadius 27
//   sunDir                  the default direction TO the sun (62 deg up, ahead and 35 deg left)
//
// handle extras
//   setProgress(u, seconds = 41)  journey progress 0..1; haul = u * seconds * 2 m/s. Call every frame.
//   setHaul(metres)               or set the cloth's travel directly (e.g. base + camera height during
//                                 the rise, so one row of roundels stays level with the camera).
//                                 Until either is called the piece self-plays from time at 2 m/s.
//   setLight({ sunDir, sunColor, skyColor, groundColor, hazeColor, zenithColor, shade })
//                                 colours are THREE.Color/hex (linear HDR allowed via multiplyScalar),
//                                 shade 0..1 scales direct sun on the piece (1 = open well).
//   setWind(strength 0..2)        ripple amplitude (default 1); pulse it with the yard's gust front.
//   setTwist(radians)             the length leaves the liquor turned by this much about the vertical and
//                                 straightens by 14 m up (default 0): the foot can face one way, the drum another.
//   setGlow(k)                    strength of the sun-through-cloth glow on the side away from the sun (default 0.62)
//   uniforms.uAmbK.value          ambient gain on the trunks, drum and pit (default 1; the yard uses 2)
//   setLight also takes shadeY: [y0, y1, floor] (direct sun fades to `floor` below world height y0..y1, for a low
//                                 evening sun that only reaches the top of the length) and yardShade: { map, xf, amb }
//                                 (the world's top-down sun-transmission map, multiplied into the apron's sunlight).
//   uniforms                      the shared uniform objects (uSunDir, uSunCol, uSkyCol, uGndCol,
//                                 uHazeCol, uZenCol, uTime, uHaul, uWind, uShade ...)
//   clothGLSL                     GLSL source of dyeRamp()/resist pattern, to reuse on the world's cloth
//
// Size: radius 13, height 46.5. Cost: about 62k triangles, 5 draw calls (solids, cloth, liquor,
// apron, drips), no lights, no textures, ~150 ms build.
// The world's ground must leave the pit open: no ground inside radius 7 of the origin (the liquor
// lies at y = -0.5; the returned groundY of -0.92 is only for the stand-alone viewer's disc).
// Lighting: self-shaded ShaderMaterials (the brief's world uses no three.js lights): one sun, sky
// ambient, ochre bounce; scene fog is honoured. It wants hard white sun from ahead-left so the
// cloth is seen against the light from the arrival side and glows like stained glass, while the
// surroundings stay blue-shaded. Bloom only finds the wet glints, drips and the pit's sun glint.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEF_PAL = ['#EDE6D6', '#C99A5A', '#10173A', '#27479A', '#A9C7EA', '#B6C23A', '#F26B1D'];
const LIQ_Y = -0.5, PIT_R = 7, LIP_R = 8.6;
const CLOTH_W = 6, CLOTH_TOP = 39.6, ROLL_R = 1.3, DRUM_Z = -1.3;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- GLSL shared by every material
const GLSL_COMMON = /* glsl */`
  uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uHazeCol, uZenCol;
  uniform float uTime, uHaul, uWind, uShade0; uniform vec3 uShadeY; float uShade;
  void setShade(float y){ uShade = uShade0 * mix(uShadeY.z, 1., smoothstep(uShadeY.x, uShadeY.y, y)); }
  float h11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
  float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p + n + 17.17)); }
  float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
  float fbm2(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * vn2(p); p = p * 2.03 + 11.7; a *= .5; } return s; }
  float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    float n = i.x + i.y * 57. + i.z * 113.;
    return mix(mix(mix(h11(n), h11(n + 1.), f.x), mix(h11(n + 57.), h11(n + 58.), f.x), f.y),
               mix(mix(h11(n + 113.), h11(n + 114.), f.x), mix(h11(n + 170.), h11(n + 171.), f.x), f.y), f.z); }
  vec3 skyAt(vec3 d){ float h = clamp(d.y, 0., 1.); vec3 c = mix(uHazeCol, uZenCol, pow(h, .6));
    float s = max(dot(d, uSunDir), 0.); return c + uSunCol * (.10 * pow(s, 8.) + .25 * pow(s, 64.)); }
`;

// The dye: colour by height above the liquor, and the resist pattern in cloth coordinates.
// The length leaves the liquor turned (uTwist radians about the vertical) and straightens by 14 m up.
const GLSL_TWIST = /* glsl */`
  uniform float uTwist;
  float twistAt(float h){ return uTwist * (1. - smoothstep(3., 14., h)); }
  vec2 twistXZ(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(p.x * c + p.y * s, -p.x * s + p.y * c); }
`;
const GLSL_CLOTH = /* glsl */`
  uniform vec3 uRamp[5]; uniform vec3 uResLo, uResHi, uRaffia; uniform vec4 uPat; uniform float uSeed, uGlow;
  float gFwd = 0.;
  // h = metres above the liquor (already nudged by the caller)
  vec3 dyeRamp(float h){
    vec3 c = mix(uRamp[0], uRamp[1], smoothstep(1.2, 5., h));
    c = mix(c, uRamp[2], smoothstep(4., 8., h));
    c = mix(c, uRamp[3], smoothstep(7., 12.5, h));
    return mix(c, uRamp[4], smoothstep(16., 27., h));
  }
  float frontNudge(vec2 q){ return (vn2(q * vec2(.9, .22) + vec2(0., uTime * .05)) - .5) * 3.2 + (vn2(q * vec2(3.1, .9) + 7.) - .5) * 1.1; }
  // one roundel: returns resist amount (x), halo (y), disc mask (z), radial coord (w)
  vec4 roundel(vec2 d, float R, float id){
    float r = length(d), a = atan(d.y, d.x + 1e-5);
    float wob = 1. + .10 * sin(a * 3. + id * 40.) + .06 * sin(a * 7. + id * 91.);
    float rr = r / (R * wob);
    float pleat = vn2(vec2(a * 7. + id * 13., rr * 2.2)) * .6 + vn2(vec2(a * 19. + id * 5., rr * 5.)) * .4;
    float ring = smoothstep(.30, .46, rr) * (1. - smoothstep(.86, 1.02, rr));
    float inner = (1. - smoothstep(.05, .13, rr)) * .9;
    float rings2 = .5 + .5 * sin(rr * 30. + pleat * 4.);
    float res = ring * (.55 + .45 * pleat) * (.75 + .25 * rings2) + inner;
    float halo = (1. - smoothstep(.95, 1.5, rr)) * smoothstep(.8, 1.0, rr);
    return vec4(clamp(res, 0., 1.), halo, 1. - smoothstep(.98, 1.04, rr), rr);
  }
  // q = (x across, metres along the cloth). Returns resist 0..1; bind = raffia-bound disc mask info.
  float resist(vec2 q, float fine, out vec4 rd, out float rid){
    vec2 w = q + (vec2(vn2(q * .7 + uSeed), vn2(q * .7 + 31. + uSeed)) - .5) * .22;
    float px = uPat.y, py = uPat.z, R = uPat.w, res = 0.;
    float row = floor(w.y / py), fy = w.y - (row + .5) * py;
    float odd = mod(row, 2.);
    float xo = (uPat.x < .5 || uPat.x > 1.5) ? odd * .5 * px : 0.;
    float col = floor((w.x + xo) / px + .5), fx = w.x + xo - col * px;
    float cx = col * px - xo;
    rid = h21(vec2(col + 3., row) + uSeed);
    float Rr = R * (uPat.x > 1.5 ? mix(.55, 1., odd) : 1.) * (.9 + .2 * rid);
    float inside = step(abs(cx), 3. - Rr * 1.05);
    rd = roundel(vec2(fx, fy), Rr, rid) * inside;
    res = max(rd.x, rd.y * .35);
    if (uPat.x > .5 && uPat.x < 1.5) {          // four satellite dots
      vec2 s = abs(vec2(fx, fy)) - vec2(px * .5, py * .27); float sr = length(s) / (R * .26);
      res = max(res, (1. - smoothstep(.75, 1.05, sr)) * smoothstep(.25, .5, sr) * .9 + (1. - smoothstep(1., 1.7, sr)) * .2);
    }
    // stitched resist lines between the rows
    float ly = w.y - row * py; ly = ly > py * .5 ? ly - py : ly;
    float zz = uPat.x < .5 ? 0. : (uPat.x < 1.5 ? (abs(fract(w.x / .5) - .5) - .25) * .36 : (abs(fract(w.x / 1.5) - .5) - .25) * 1.1);
    float d1 = abs(abs(ly - zz) - .11), aaL = .018 + fine;
    float dash = smoothstep(.18, .30, abs(fract(w.x * 7. + vn2(w * 3.) * .5) - .5) + .12);
    res = max(res, (1. - smoothstep(.022, .022 + aaL, d1)) * dash * .9 * step(abs(w.x), 2.82));
    // selvedge lines and a row of pin dots
    float se = abs(abs(w.x) - 2.78);
    res = max(res, (1. - smoothstep(.02, .02 + aaL, se)) * dash * .8);
    vec2 pd = vec2(abs(w.x) - 2.55, fract(w.y / .32) * .32 - .16);
    res = max(res, (1. - smoothstep(.035, .06 + fine, length(pd))) * .8);
    return clamp(res, 0., 1.);
  }
  // shared lighting of a cloth point: N must face the viewer
  vec3 clothLight(vec3 alb, vec3 N, float thin){
    float ndl = dot(N, uSunDir);
    float front = max(ndl, 0.), back = max(-ndl, 0.);
    vec3 amb = mix(uGndCol, uSkyCol, N.y * .5 + .5) * 1.0 + uSkyCol * .25;
    // seen against the sun the cloth is stained glass: its own colour, lifted and saturated, at full strength
    // as soon as the sun is behind it at all, and stronger still looking up through it toward the sun
    vec3 tcol = pow(alb + 1e-4, vec3(.6));
    float lum = dot(tcol, vec3(.3, .5, .2)); tcol = max(mix(vec3(lum), tcol, 1.9), 0.);
    tcol *= mix(vec3(1.), vec3(.8, .93, 1.06), smoothstep(.45, .95, lum));
    vec3 c = alb * (uSunCol * uShade * (front * .8 + .05) + amb);
    float bk = 1. - smoothstep(-.13, .03, ndl);
    // (the light that comes through is taken half-way to white first, so a low red sun does not turn the blue to green)
    vec3 sunT = mix(uSunCol, vec3(dot(uSunCol, vec3(.3, .5, .2))), .55);
    // (and its strength is rolled off above 1, so a hard white sun deepens the blue instead of bleaching it to cyan)
    float sl = max(dot(sunT, vec3(.3, .5, .2)), 1e-3);
    float tl = sl * uShade * (bk * (.55 + .45 * pow(back + 1e-4, .55)) * thin * uGlow * (1. + .8 * gFwd + 1.1 * gFwd * gFwd * gFwd * gFwd));
    tl = min(tl, 1.) + .5 * (1. - 1. / (1. + max(tl - 1., 0.)));
    c += min(tcol, vec3(1.15)) * (sunT / sl) * tl;
    return c;
  }
`;

const FOG_V_PARS = '#include <common>\n#include <fog_pars_vertex>\n';
const FOG_F_PARS = '#include <common>\n#include <fog_pars_fragment>\n';

// ---------------------------------------------------------------- geometry accumulator
// One merged mesh for every solid: position, normal, colour, uv (u around, v metres along),
// aAnim (kind, phase, material id) and aPiv (pivot for animated kinds).
class Acc {
  constructor() { this.P = []; this.N = []; this.C = []; this.U = []; this.A = []; this.V = []; this.I = []; this.n = 0; }
  vert(x, y, z, nx, ny, nz, r, g, b, u, v, kind, phase, mat, px, py, pz) {
    this.P.push(x, y, z); this.N.push(nx, ny, nz); this.C.push(r, g, b); this.U.push(u, v);
    this.A.push(kind, phase, mat); this.V.push(px, py, pz); return this.n++;
  }
  // append a three.js geometry through a matrix. o: { color(THREE.Color) | colorFn(x,y,z,out), mat, kind, phase, piv, uvScale }
  add(geo, m, o = {}) {
    const g = geo.index ? geo : geo, pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv;
    const nm = new THREE.Matrix3().getNormalMatrix(m), v = new THREE.Vector3(), n = new THREE.Vector3(), c = new THREE.Color();
    const base = this.n, piv = o.piv || [0, 0, 0], us = o.uvScale || [1, 1];
    for (let i = 0; i < pa.count; i++) {
      v.fromBufferAttribute(pa, i).applyMatrix4(m); n.fromBufferAttribute(na, i).applyMatrix3(nm).normalize();
      if (o.colorFn) o.colorFn(v.x, v.y, v.z, c, i); else c.copy(o.color);
      this.vert(v.x, v.y, v.z, n.x, n.y, n.z, c.r, c.g, c.b, ua ? ua.getX(i) * us[0] : 0, ua ? ua.getY(i) * us[1] : 0,
        o.kind || 0, o.phase || 0, o.mat || 0, piv[0], piv[1], piv[2]);
    }
    if (g.index) { const ix = g.index.array; for (let i = 0; i < ix.length; i++) this.I.push(base + ix[i]); }
    else for (let i = 0; i < pa.count; i++) this.I.push(base + i);
    geo.dispose();
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2));
    g.setAttribute('aAnim', new THREE.Float32BufferAttribute(this.A, 3));
    g.setAttribute('aPiv', new THREE.Float32BufferAttribute(this.V, 3));
    g.setIndex(this.I);
    return g;
  }
  // the same geometry, handing the page back between attributes (for the big merges)
  async buildAsync(ctx) {
    const g = new THREE.BufferGeometry();
    for (const [name, array, size] of [['position', this.P, 3], ['normal', this.N, 3], ['color', this.C, 3], ['uv', this.U, 2], ['aAnim', this.A, 3], ['aPiv', this.V, 3]]) {
      g.setAttribute(name, new THREE.Float32BufferAttribute(array, size));
      await ctx.yield?.();
    }
    g.setIndex(this.I);
    return g;
  }
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
function frameOf(dir) {
  const d = dir.clone().normalize();
  const u = Math.abs(d.y) < 0.95 ? new THREE.Vector3(0, 1, 0).cross(d).normalize() : new THREE.Vector3(1, 0, 0).cross(d).normalize();
  const w = d.clone().cross(u).normalize();
  return { d, u, w };
}

// A lofted tube from A to B. radiusFn(t, v metres) -> radius; bow = sideways sag in metres.
// colorFn(t, ang, out). uv = (around 0..1, metres along).
function addTube(acc, A, B, o) {
  const len = A.distanceTo(B), rings = o.rings || Math.max(2, Math.ceil(len / (o.step || 0.5))), rad = o.radial || 10;
  const { d, u, w } = frameOf(_a.copy(B).sub(A));
  const bow = o.bow || 0, bowDir = o.bowDir || u, col = new THREE.Color();
  const base = acc.n, piv = o.piv || [0, 0, 0];
  for (let i = 0; i <= rings; i++) {
    const t = i / rings, v = t * len, r = o.radiusFn(t, v);
    _b.copy(A).addScaledVector(d, v).addScaledVector(bowDir, Math.sin(t * Math.PI) * bow);
    for (let j = 0; j <= rad; j++) {
      const a = (j / rad) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const rr = r * (o.lump ? 1 + o.lump * Math.sin(a * 3 + v * 0.7 + (o.phase0 || 0)) : 1);
      const nx = u.x * ca + w.x * sa, ny = u.y * ca + w.y * sa, nz = u.z * ca + w.z * sa;
      o.colorFn(t, a, col, _b.y + ny * rr);
      acc.vert(_b.x + nx * rr, _b.y + ny * rr, _b.z + nz * rr, nx, ny, nz, col.r, col.g, col.b, j / rad, (o.v0 || 0) + v,
        o.kind || 0, o.phase || 0, o.mat || 0, piv[0], piv[1], piv[2]);
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < rad; j++) {
    const p = base + i * (rad + 1) + j, q = p + rad + 1;
    acc.I.push(p, p + 1, q, p + 1, q + 1, q);
  }
  if (o.cap) { // rounded end caps: a small cone fan at each end
    for (const end of [0, 1]) {
      const t = end, v = t * len, r = o.radiusFn(t, v) * 0.35;
      _b.copy(A).addScaledVector(d, v + (end ? 1 : -1) * o.radiusFn(t, v) * 0.35);
      o.colorFn(t, 0, col, _b.y); col.multiplyScalar(0.8);
      const ci = acc.vert(_b.x, _b.y, _b.z, d.x * (end ? 1 : -1), d.y * (end ? 1 : -1), d.z * (end ? 1 : -1), col.r, col.g, col.b, 0.5, (o.v0 || 0) + v,
        o.kind || 0, o.phase || 0, o.mat || 0, piv[0], piv[1], piv[2]);
      const ring = base + (end ? rings : 0) * (rad + 1);
      for (let j = 0; j < rad; j++) { if (end) acc.I.push(ring + j, ring + j + 1, ci); else acc.I.push(ring + j + 1, ring + j, ci); }
      void r;
    }
  }
}

// A tube along a polyline (ropes). pts: Vector3[]; constant radius.
function addRope(acc, pts, radius, o = {}) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const len = curve.getLength(), segs = o.segs || Math.max(2, Math.ceil(len / (o.step || 0.6))), rad = o.radial || 6;
  const fr = curve.computeFrenetFrames(segs, false), base = acc.n, col = o.color, piv = o.piv || [0, 0, 0], p = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    curve.getPointAt(i / segs, p); const N = fr.normals[i], Bn = fr.binormals[i], sh = o.shadeFn ? o.shadeFn(i / segs) : 1;
    for (let j = 0; j <= rad; j++) {
      const a = (j / rad) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const nx = N.x * ca + Bn.x * sa, ny = N.y * ca + Bn.y * sa, nz = N.z * ca + Bn.z * sa;
      acc.vert(p.x + nx * radius, p.y + ny * radius, p.z + nz * radius, nx, ny, nz, col.r * sh, col.g * sh, col.b * sh, j / rad, (i / segs) * len,
        o.kind || 0, o.phase || 0, 1, piv[0], piv[1], piv[2]);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < rad; j++) {
    const a = base + i * (rad + 1) + j, b = a + rad + 1;
    acc.I.push(a, a + 1, b, a + 1, b + 1, b);
  }
}

// A rope lashing: coils wound round a trunk at point P along axis dir.
function addLashing(acc, P, dir, radius, length, coils, color, rng, o = {}) {
  const half = length / 2, A = P.clone().addScaledVector(dir, -half), B = P.clone().addScaledVector(dir, half);
  const jit = rng.range(0.85, 1.05), ph = rng.range(0, 6);
  addTube(acc, A, B, {
    rings: coils * 4, radial: 12, mat: 1, kind: o.kind || 0, piv: o.piv, phase: o.phase, v0: rng.range(0, 9),
    radiusFn: (t) => { const c = t * coils, f = c - Math.floor(c); return radius + 0.5 * (o.thick || 0.11) * (0.35 + Math.sin(f * Math.PI)) + 0.012 * Math.sin(c * 2.3 + ph); },
    colorFn: (t, a, out) => { const c = t * coils, f = c - Math.floor(c); const s = (0.55 + 0.45 * Math.sin(f * Math.PI)) * jit * (0.9 + 0.1 * Math.sin(Math.floor(c) * 12.9 + ph)); out.copy(color).multiplyScalar(s); },
  });
}

// A lumpy stone.
function addStone(acc, x, y, z, sx, sy, sz, color, rng, o = {}) {
  const g = new THREE.IcosahedronGeometry(1, 1), pa = g.attributes.position, k = rng.range(0, 100);
  for (let i = 0; i < pa.count; i++) {
    const px = pa.getX(i), py = pa.getY(i), pz = pa.getZ(i);
    const s = 1 + 0.22 * Math.sin(px * 3.1 + k) * Math.sin(py * 2.7 + k * 1.3) + 0.12 * Math.sin(pz * 5.3 + k * 0.7);
    pa.setXYZ(i, px * s, Math.max(py * s, -0.55), pz * s);
  }
  g.computeVertexNormals();
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rng.range(-0.3, 0.3), rng.range(0, TAU), rng.range(-0.3, 0.3))), new THREE.Vector3(sx, sy, sz));
  const sh = rng.range(0.75, 1.1);
  acc.add(g, m, { colorFn: (vx, vy, vz, c) => { c.copy(color).multiplyScalar(sh * (0.7 + 0.3 * smoothstep(y - sy * 0.5, y + sy * 0.6, vy))); }, mat: 4, kind: o.kind || 0, piv: o.piv, phase: o.phase });
}

// ---------------------------------------------------------------- the solid material (wood, rope, cement, stone)
function makeSolidMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: true, vertexColors: true,
    vertexShader: FOG_V_PARS + GLSL_COMMON + /* glsl */`
      attribute vec3 aAnim, aPiv;
      uniform float uDrumAng, uBasketDy, uRopeLen;
      varying vec3 vN, vW, vL, vCol; varying vec2 vUv; varying float vMat;
      vec2 rot(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(p.x * c - p.y * s, p.x * s + p.y * c); }
      void main(){
        vec3 p = position, n = normal; float k = aAnim.x;
        if (k > .5 && k < 1.5) { p -= aPiv; p.yz = rot(p.yz, uDrumAng); n.yz = rot(n.yz, uDrumAng); p += aPiv; }
        else if (k < 2.5 && k > 1.5) { p.y += uBasketDy; p.xz += vec2(sin(uTime * .8), cos(uTime * .63)) * .05; }
        else if (k < 3.5 && k > 2.5) { p.y = aPiv.y + (p.y - aPiv.y) * uRopeLen; }
        else if (k < 4.5 && k > 3.5) { p -= aPiv; float a1 = .055 * sin(uTime * .9 + aAnim.y), a2 = .04 * sin(uTime * .67 + aAnim.y * 1.7);
          p.xy = rot(p.xy, a1); n.xy = rot(n.xy, a1); p.yz = rot(p.yz, a2); n.yz = rot(n.yz, a2); p += aPiv; }
        else if (k > 4.5) { p -= aPiv; float a = uTime * .22 + aAnim.y; p.xz = rot(p.xz, a); n.xz = rot(n.xz, a);
          p.xy = rot(p.xy, .05 * sin(uTime * 1.3 + aAnim.y)); p += aPiv; p.y += .035 * sin(uTime * 1.1 + aAnim.y);
          p.xz += vec2(cos(uTime * .09 + aAnim.y), sin(uTime * .09 + aAnim.y)) * .5; }
        vL = p; vUv = uv; vMat = aAnim.z; vCol = color;
        vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * n);
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F_PARS + GLSL_COMMON + /* glsl */`
      uniform float uAmbK;
      varying vec3 vN, vW, vL, vCol; varying vec2 vUv; varying float vMat;
      void main(){
        setShade(vW.y);
        vec3 N = normalize(vN + vec3(1e-5, 0., 0.)); vec3 alb = vCol; float m = vMat, bump = 0., gloss = 0.;
        float fw = fwidth(vUv.y) + 1e-4;
        if (m < .5) {                       // palm trunk: leaf-scar rings, fibre, mottling
          float j = vn2(vec2(vUv.x * 5., floor(vUv.y / .9))) * .35;
          float ring = fract(vUv.y / .9 + j + .08 * sin(vUv.x * 6.2832));
          float scar = smoothstep(.0, .10 + fw, ring) * (1. - smoothstep(.82, .98, ring));
          float fib = vn2(vec2(vUv.x * 46., vUv.y * 1.3)) * .6 + vn2(vec2(vUv.x * 110., vUv.y * 3.)) * .4;
          float mot = fbm2(vec2(vUv.x * 4., vUv.y * .6));
          alb *= mix(.52, 1., scar) * (.74 + .42 * fib) * (.8 + .4 * mot);
          alb = mix(alb, alb * vec3(1.12, 1.02, .82), smoothstep(.5, .8, mot) * .5);
          bump = (scar - .5) * .5 + (fib - .5) * .3;
        } else if (m < 1.5) {               // rope: laid strands
          float tw = sin((vUv.x * 3. + vUv.y * 9.) * 6.2832);
          float fib = vn2(vec2(vUv.x * 60., vUv.y * 30.));
          float tf = 1. - smoothstep(.12, .45, fw * 9.); tw *= tf;
          alb *= (.62 + .38 * smoothstep(-.6, .7, tw)) * (.8 + .35 * fib * tf); bump = tw * .4;
        } else if (m < 2.5) {               // cement lip: speckle, cracks, wear
          float sp = vn3(vL * 9.) * .5 + vn3(vL * 31.) * .5;
          float cr = abs(fbm2(vL.xz * 1.1 + 3.) - .5);
          float cfw = fwidth(cr) + 1e-4; float crack = (1. - smoothstep(.6, 1.5, cr / cfw)) * (1. - smoothstep(.01, .05, cfw));
          float wear = fbm2(vL.xz * .45 + 9.);
          alb *= (.78 + .34 * sp) * (1. - .3 * crack);
          alb = mix(alb, alb * vec3(1.1, 1.06, .98) + .03, smoothstep(.45, .7, wear) * .5);
          bump = (sp - .5) * .5 - crack * .3;
        } else if (m < 3.5) {               // basket weave
          vec2 g = vec2(vUv.x * 28., vUv.y * 9.); float o = mod(floor(g.x) + floor(g.y), 2.);
          vec2 f = fract(g); float st = o > .5 ? sin(f.x * 3.1416) : sin(f.y * 3.1416); st = mix(.64, st, 1. - smoothstep(.15, .5, fw * 9.));
          alb *= (.5 + .6 * st) * (.85 + .3 * vn2(g * .7)); bump = st * .5;
        } else if (m < 4.5) {               // stone
          float sp = vn3(vL * 7.) * .6 + vn3(vL * 23.) * .4; alb *= .75 + .45 * sp; bump = (sp - .5) * .4;
        } else if (m < 5.5) {               // drum staves: grain along the axis (uv.y), seams round it
          float seam = abs(fract(vUv.x * 14.) - .5); float sm = smoothstep(.0, .06, seam);
          float st = h11(floor(vUv.x * 14.) + 3.);
          float gr = vn2(vec2(vUv.x * 90., vUv.y * 1.6 + st * 9.)) * .6 + vn2(vec2(vUv.x * 30., vUv.y * .5)) * .4;
          alb *= mix(.4, 1., sm) * (.72 + .5 * gr) * (.82 + .3 * st); bump = (gr - .5) * .3 + (sm - 1.) * .6;
        } else {                            // wound cloth on the drum: glazed indigo with faint bands
          float bands = vn2(vec2(vUv.y * 3., vUv.x * 2.)) * .5 + .5 * sin(vUv.x * 30. + vUv.y * 2.);
          float wv = sin(vUv.y * 90.) * sin(vUv.x * 400.);
          alb *= .8 + .25 * bands + .06 * wv; gloss = .35;
        }
        N = normalize(N + (dFdx(bump) * cross(N, vec3(0., 1., 0.)) + vec3(0., 1., 0.) * dFdy(bump)) * 2.5 + vec3(0., 1e-5, 0.));
        vec3 V = normalize(cameraPosition - vW + vec3(1e-5));
        float ndl = dot(N, uSunDir);
        float dif = smoothstep(-.12, .5, ndl) * max(ndl * .85 + .15, 0.);
        vec3 amb = mix(uGndCol, uSkyCol, N.y * .5 + .5) * uAmbK + uGndCol * uSunCol * (.5 - .5 * N.y) * .5;
        vec3 c = alb * (uSunCol * uShade * dif + amb);
        float fr = clamp(1. - dot(N, V), 0., 1.), rim = fr * fr * fr;
        c += alb * uSkyCol * rim * .35;
        // a rim of light down the sunward edge, strongest looking toward the sun
        c += (alb * 1.4 + .02) * uSunCol * uShade * fr * fr * (.2 + .8 * smoothstep(-.25, .45, ndl)) * (.4 + .6 * smoothstep(-.2, .7, dot(-V, uSunDir)));
        vec3 H = normalize(uSunDir + V + vec3(1e-5));
        c += uSunCol * uShade * pow(max(dot(N, H), 0.), 40.) * gloss * step(0., ndl);
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- the rising length
const CLOTH_NX = 28, CLOTH_NY = 230, CLOTH_WRAP = 30;       // columns, flat rows, rows wound over the drum
function buildClothGeometry() {
  const P = [], N = [], S = [], I = [];
  const y0 = LIQ_Y - 0.2, flatLen = CLOTH_TOP - y0, rows = CLOTH_NY + CLOTH_WRAP;
  for (let j = 0; j <= rows; j++) {
    let y, z, ny, nz, s, flat;
    if (j <= CLOTH_NY) { const t = j / CLOTH_NY; y = y0 + flatLen * t; z = 0; ny = 0; nz = 1; s = flatLen * t - 0.2; flat = 1; }
    else { const a = ((j - CLOTH_NY) / CLOTH_WRAP) * Math.PI * 1.55; y = CLOTH_TOP + ROLL_R * Math.sin(a); z = DRUM_Z + ROLL_R * Math.cos(a); ny = Math.sin(a); nz = Math.cos(a); s = flatLen - 0.2 + a * ROLL_R; flat = 0; }
    for (let i = 0; i <= CLOTH_NX; i++) {
      const x = (i / CLOTH_NX - 0.5) * CLOTH_W;
      P.push(x, y, z); N.push(0, ny, nz); S.push(x, s, flat);
    }
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < CLOTH_NX; i++) {
    const a = j * (CLOTH_NX + 1) + i, b = a + CLOTH_NX + 1;
    I.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 3));
  g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 24);
  return g;
}

function makeClothMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: true, side: THREE.DoubleSide,
    vertexShader: FOG_V_PARS + GLSL_COMMON + GLSL_TWIST + /* glsl */`
      attribute vec3 aS;
      varying vec3 vN, vW; varying vec3 vS; varying float vSlope;
      void main(){
        vec3 p = position, n = normal; float x = aS.x, h = max(position.y - (${LIQ_Y.toFixed(2)}), 0.);
        float e = sin(clamp(h / 40.1, 0., 1.) * 3.14159) * aS.z;
        float env = pow(e + 1e-4, .7) * uWind;
        float t = uTime;
        float a1 = .16 * h - 1.9 * t + .25 * x, a2 = .47 * h - 3.1 * t - .7 * x + 1.3, a3 = 1.25 * h - 5.2 * t + 1.6 * x, a4 = .05 * h - .45 * t;
        float z = env * (.62 * sin(a1) + .2 * sin(a2) + .07 * sin(a3) + .5 * sin(a4));
        float dzh = env * (.62 * .16 * cos(a1) + .2 * .47 * cos(a2) + .07 * 1.25 * cos(a3));
        float dzx = env * (.62 * .25 * cos(a1) - .2 * .7 * cos(a2) + .07 * 1.6 * cos(a3));
        // tension folds: vertical pleats gathered toward the drum and into the liquor
        float gather = (.35 + .65 * smoothstep(24., 40., h) + .5 * (1. - smoothstep(0., 5., h))) * aS.z;
        float f1 = x * 4.4 + 1.5 * sin(h * .21 + 1.) + .4 * sin(t * .8 + h * .3), f2 = x * 9.7 - h * .13;
        z += gather * (.075 * sin(f1) + .03 * sin(f2));
        dzx += gather * (.075 * 4.4 * cos(f1) + .03 * 9.7 * cos(f2));
        p.z += z; p.x *= 1. - .035 * e - .02 * smoothstep(30., 40., h) * aS.z;
        if (aS.z > .5) { n = normalize(vec3(-dzx, -dzh, 1.)); float tw = twistAt(h); p.xz = twistXZ(p.xz, tw); n.xz = twistXZ(n.xz, tw); }
        vSlope = dzh; vS = vec3(x, aS.y, h);
        vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * n);
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F_PARS + GLSL_COMMON + GLSL_CLOTH + /* glsl */`
      uniform vec3 uFoam;
      varying vec3 vN, vW; varying vec3 vS; varying float vSlope;
      void main(){
        setShade(vW.y);
        float x = vS.x, h = vS.z; vec2 q = vec2(x, vS.y - uHaul);
        float fine = fwidth(q.y) * 1.2;
        vec3 N = normalize(vN + vec3(0., 0., 1e-5)); if (!gl_FrontFacing) N = -N;
        vec3 V = normalize(cameraPosition - vW + vec3(1e-5));
        // fine cloth folds (do not travel with the pattern: they belong to the hanging)
        float fn = vn2(vec2(x * 3.3, h * .5 - uTime * .25)) - .5;
        N = normalize(N + vec3(dFdx(fn), 0., 0.) * 6. + vec3(1e-5));
        // the dye and its uneven front
        float hn = max(h + frontNudge(vec2(x, h)) * smoothstep(.5, 4., h), 0.);
        vec3 dyed = dyeRamp(hn);
        float mott = fbm2(q * vec2(1.4, 1.1) + uSeed);
        dyed *= .78 + .44 * mott;
        vec4 rd; float rid;
        float res = resist(q, fine, rd, rid);
        vec3 pale = mix(uResLo, uResHi, smoothstep(1.5, 19., hn));
        pale = mix(pale, dyed, .16 + .12 * mott);
        vec3 alb = mix(dyed, pale, res * .94);
        float thin = mix(.85, 1.05, res) * mix(1., .62, smoothstep(13., 30., hn));
        // raffia still bound round the lowest roundels
        float thr = 2.4 + 2.6 * rid;
        float bound = rd.z * (1. - smoothstep(thr - .7, thr, h));
        float wind = .5 + .5 * sin(rd.w * 34. + vn2(q * 9.) * 3.);
        float knot = 1. - smoothstep(.0, .22, rd.w);
        vec3 raf = uRaffia * (.5 + .55 * wind) * (1.15 - .5 * rd.w) + uRaffia * knot * .25;
        alb = mix(alb, raf, bound * .92); thin *= 1. - .75 * bound;
        // weave, faded with distance
        float wf = fwidth(q.x) * 190.;
        float weave = sin(q.x * 190.) * sin(q.y * 190.);
        float slub = vn2(vec2(q.x * 3., q.y * 60.)) * .5 + vn2(vec2(q.x * 60., q.y * 3.)) * .5;
        alb *= 1. + .10 * weave * (1. - smoothstep(.6, 2.2, wf)) + .16 * (slub - .5);
        // liquor sheeting down: dark rivulets that slide downward, wet low down
        float wet = 1. - smoothstep(1., 15., h);
        float rvA = 1. - smoothstep(8., 30., h);
        float rpath = x * 3.2 + .4 * sin(h * .5 + x * 2.) + vn2(vec2(x * 2., h * .35)) * .9 + .1 * sin(h * 2.3 + x * 9.);
        float rw = max(.1, fwidth(rpath) * 1.3), rl = abs(fract(rpath) - .5), rid2 = floor(rpath);
        float run = smoothstep(.4, .6, vn2(vec2(rid2 * 7.3, h * .16 + uTime * .55 + rid2 * 3.1)));      // each thread runs in lengths that slide down
        float riv = (1. - smoothstep(rw * .5, rw, rl)) * run * min(1., .24 / rw) * rvA * (1. - res * .5);
        float bead = (1. - smoothstep(rw * .7, rw * 1.3, rl)) * run * smoothstep(.75, .95, fract(h * .16 + uTime * .55 + rid2 * 3.1 + vn2(vec2(rid2, 3.)))) * rvA;
        riv = clamp(riv + bead * .4, 0., 1.);
        alb *= 1. - .7 * riv; thin *= 1. - .6 * riv; alb *= mix(1., .8, wet);
        // bronze foam torn up the first metre
        float fo = vn2(vec2(x * 4., (h - uHaul) * 1.6)) * .7 + vn2(vec2(x * 13., (h - uHaul) * 5.)) * .3;
        float foam = smoothstep(.1, .5, fo - h * .42 + .28) * (1. - smoothstep(1.4, 2.4, h));
        float bub = vn2(vec2(x * 40., (h - uHaul) * 40.));
        alb = mix(alb, uFoam * (.7 + .6 * bub), foam * .85); thin *= 1. - .4 * foam;
        // doubled selvedges and fold shadow
        float edge = smoothstep(2.84, 2.93, abs(x));
        alb *= 1. - .35 * edge; thin *= 1. - .45 * edge;
        float foldSh = 1. - .5 * clamp(abs(vSlope) * 1.6, 0., .6);
        float fwd = max(dot(-V, uSunDir), 0.); gFwd = fwd * fwd * fwd;
        vec3 c = clothLight(alb, N, thin) * foldSh;
        // wet glints: sun on the film and along the rivulets
        vec3 H = normalize(uSunDir + V + vec3(1e-5));
        float nh = max(dot(N, H), 0.);
        float spark = step(.82, vn2(vec2(x * 55., h * 55. + uTime * 3.)));
        c += uSunCol * uShade * (pow(nh, 90.) * (1.5 * wet + 3. * riv) + pow(nh, 14.) * (.10 * wet + .5 * riv * spark)) * step(0., dot(N, uSunDir));
        float back = max(-dot(N, uSunDir), 0.);
        c += uSunCol * uShade * riv * spark * back * vec3(.5, .9, .5) * 1.2 * wet;
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- the pit's liquor: a blue-black mirror
function makeLiquorMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: true,
    vertexShader: FOG_V_PARS + /* glsl */`
      varying vec3 vW, vL;
      void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F_PARS + GLSL_COMMON + GLSL_CLOTH + GLSL_TWIST + /* glsl */`
      uniform vec3 uFoam, uLiquor; uniform mat4 uInvModel, uModel;
      varying vec3 vW, vL;
      float ringAt(vec2 p, vec2 c, float age){ float d = length(p - c), r = age * 1.5;
        return sin((d - r) * 16.) * exp(-abs(d - r) * 3.5) * (1. - age) * smoothstep(0., .08, age); }
      float hgtAt(vec2 p){
        float hgt = 0.;
        float wake = exp(-abs(p.y) * .7) * (1. - smoothstep(2.6, 3.8, abs(p.x)));
        hgt += wake * .5 * sin(abs(p.y) * 9. - uTime * 5. + vn2(p * 2.) * 3.);
        for (int i = 0; i < 9; i++) {
          float fi = float(i), per = 1.6 + h11(fi + 2.) * 1.4, tt = uTime / per + h11(fi * 7.3);
          float cyc = floor(tt), age = fract(tt);
          vec2 hh = h22(vec2(fi + 1., cyc + uSeed));
          vec2 c = vec2((i < 6 ? (mod(fi, 2.) < .5 ? -3. : 3.) + (hh.x - .5) * .5 : (hh.x - .5) * 5.6), (hh.y - .5) * (i < 6 ? .9 : .5));
          hgt += ringAt(p, c, age) * .6;
        }
        return hgt + (fbm2(p * .9 + vec2(uTime * .07, -uTime * .05)) - .5) * .5;
      }
      void main(){
        setShade(vW.y);
        vec2 p = twistXZ(vL.xz, -uTwist); float r = length(p);      // the cloth's own frame where it leaves the liquor
        vec3 V = normalize(cameraPosition - vW + vec3(1e-5));
        // ripples: wake where the cloth leaves, drip rings under both selvedges, slow swell
        float wake = exp(-abs(p.y) * .7) * (1. - smoothstep(2.6, 3.8, abs(p.x)));
        float h0 = hgtAt(p), hx = hgtAt(p + vec2(.06, 0.)), hz = hgtAt(p + vec2(0., .06));
        vec3 Nl = normalize(vec3(-(hx - h0) / .06 * .07, 1., -(hz - h0) / .06 * .07));
        Nl.xz = twistXZ(Nl.xz, uTwist);
        vec3 N = normalize(mat3(uModel) * Nl);
        vec3 R = reflect(-V, N); R.y = abs(R.y) + 1e-3;
        float fres = .08 + .92 * pow(clamp(1. - dot(N, V), 0., 1.), 4.);
        // what the mirror holds: haze sky, the sun, and the whole length standing in it
        vec3 refl = skyAt(normalize(R)); float clothM = 0.;
        float sg = max(dot(normalize(R), uSunDir), 0.);
        refl += uSunCol * uShade * (pow(sg, 900.) * 14. + pow(sg, 120.) * .6);
        vec3 Rl = normalize(mat3(uInvModel) * R); Rl.xz = twistXZ(Rl.xz, -uTwist);
        float tz = -p.y / (abs(Rl.z) > 1e-4 ? Rl.z : 1e-4);
        if (tz > 0.) {
          vec3 hit = vec3(p.x, vL.y, p.y) + Rl * tz; float hh = hit.y - (${LIQ_Y.toFixed(2)});
          float m = (1. - smoothstep(2.9, 3.02, abs(hit.x))) * step(0., hh) * (1. - smoothstep(39.6, 41., hh));
          if (m > 0.) {
            vec2 q = vec2(hit.x, hh - uHaul); vec4 rd; float rid;
            float res = resist(q, .03, rd, rid);
            float hn = max(hh + frontNudge(vec2(hit.x, hh)) * smoothstep(.5, 4., hh), 0.);
            vec3 dyed = dyeRamp(hn) * (.78 + .44 * fbm2(q * vec2(1.4, 1.1) + uSeed));
            vec3 alb = mix(dyed, mix(uResLo, uResHi, smoothstep(1.5, 19., hn)), res * .9);
            vec3 cn = vec3(0., 0., Rl.z > 0. ? -1. : 1.); cn.xz = twistXZ(cn.xz, uTwist);
            vec3 cc = clothLight(alb, normalize(mat3(uModel) * cn), mix(.85, 1.2, res) * mix(1., .62, smoothstep(13., 30., hn)));
            refl = mix(refl, cc, m); clothM = m;
          }
        }
        // the liquor itself and its raft of bronze foam turning round a clear dark centre
        float ang = atan(p.y, p.x + 1e-5) + uTime * .06 + r * .12;
        vec2 fp = vec2(cos(ang), sin(ang)) * r;
        float fo = fbm2(fp * .55 + uSeed) + .35 * vn2(fp * 2.3);
        float raft = smoothstep(.80, .90, fo + .17 * smoothstep(2.6, 4.6, r) - .2 * smoothstep(5.6, 6.9, r) + .22 * wake * step(abs(p.x), 3.2) + .1 * (vn2(fp * 6.) - .5));
        raft *= smoothstep(1.2, 2.6, r + abs(p.y) * .8 + wake * 2.);
        float edgeFoam = smoothstep(6.55, 6.95, r + (vn2(p * 3.) - .5) * .5);
        raft = max(raft, edgeFoam * .7 * smoothstep(.3, .6, vn2(fp * 1.7 + 4.)));
        float bub = vn2(fp * 14.) * .6 + vn2(fp * 37.) * .4;
        float ndl = max(dot(N, uSunDir), 0.);
        vec3 amb = uSkyCol * 1.1;
        vec3 foamC = uFoam * (.3 + 1.1 * bub * bub) * (uSunCol * uShade * ndl * .8 + amb);
        foamC += uSunCol * uShade * step(.86, bub) * .35 * vec3(1., .8, .5);
        vec3 deep = uLiquor * (uSunCol * uShade * .25 + amb);
        vec3 c = mix(deep, refl, clamp(fres + mix(.10, .5, clothM), 0., 1.));
        // the vat's copper skin drifting between the foam
        float skin = smoothstep(.5, .72, fbm2(fp * .7 + uSeed * 3. + 5.) + .12 * (vn2(fp * 5.) - .5)) * smoothstep(.8, 2.2, r) * (1. - raft) * (1. - wake);
        float ir = clamp(1. - dot(N, V), 0., 1.);
        vec3 film = mix(vec3(1.0, .47, .2), vec3(.62, .3, .78), ir * ir) * (.8 + .4 * vn2(fp * 9. + 3.));
        c = mix(c, film * (refl * 1.15 + amb * .22 + uSunCol * uShade * (.06 + .5 * pow(sg, 24.))), skin * .7 * (1. - clothM * .6));
        c = mix(c, foamC + refl * .06, raft * .9);
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- stained earth round the pit
function makeApronMaterial(U, cutGLSL) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: FOG_V_PARS + /* glsl */`
      varying vec3 vL; varying vec2 vWxz;
      void main(){ vL = position; vWxz = (modelMatrix * vec4(position, 1.)).xz; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: FOG_F_PARS + GLSL_COMMON + GLSL_CLOTH + /* glsl */`
      uniform vec3 uEarth, uStain, uSunLocal, uLegA[4], uLegB[4]; uniform vec4 uRunnel; uniform float uWet;
      uniform sampler2D uYardShade; uniform vec4 uYardXf; uniform float uYardOn; uniform vec3 uYardPos, uYardAmb;
      ` + (cutGLSL || 'float yardCut(vec2 p){ return 0.; }') + /* glsl */`
      varying vec3 vL; varying vec2 vWxz;
      float segShadow(vec2 p, vec3 A, vec3 B, float rad){
        float ly = max(uSunLocal.y, .05);
        vec2 a = A.xz - uSunLocal.xz * (A.y / ly), b = B.xz - uSunLocal.xz * (B.y / ly);
        vec2 ab = b - a; float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-4), 0., 1.);
        float d = length(p - a - ab * t), hgt = mix(A.y, B.y, t), pen = .12 + hgt * .028;
        return (1. - smoothstep(rad - pen, rad + pen, d)) * (1. - .45 * smoothstep(8., 46., hgt));
      }
      void main(){
        setShade(0.);
        vec2 p = vL.xz; float r = length(p), ang = atan(p.y, p.x + 1e-5);
        // what needs the neighbouring pixels (the crack's width, the yard map's level) is taken before the cut: past a discard it is not defined
        float crv = abs(fbm2(p * .8 + 20.) - .5), crw = fwidth(crv) + 1e-4;
        vec2 yuv = (vWxz - uYardXf.xy) * uYardXf.zw; vec3 yardT = vec3(1.);
        if (uYardOn > .5) yardT = texture2D(uYardShade, yuv).rgb;
        if (yardCut(vWxz) > .5) discard;
        // packed ochre earth: mottling, pebbles, hairline cracks, pale worn footpaths
        float mo = fbm2(p * .35 + 4.), fi = vn2(p * 6.) * .6 + vn2(p * 19.) * .4;
        float peb = smoothstep(.78, .9, vn2(p * 11. + 50.));
        float cr = (1. - smoothstep(.6, 1.6, crv / crw)) * (1. - smoothstep(.01, .06, crw));
        vec3 alb = uEarth * (.72 + .4 * mo) * (.82 + .32 * fi);
        float path = (1. - smoothstep(.9, 2.4, abs(r - 11.2 + 1.3 * sin(ang * 2. + uSeed)))) * .8;
        path = max(path, (1. - smoothstep(1., 2.6, abs(p.x + 1.5 * sin(p.y * .12 + uSeed)))) * smoothstep(9., 13., p.y) * .8);
        alb = mix(alb, uEarth * 1.28 * (.9 + .12 * fi), path * (.5 + .4 * mo));
        alb *= 1. - .35 * cr * (1. - path); alb = mix(alb, alb * .55 + .04, peb * .7);
        // the blue halo: soaked at the lip, splashed and tracked further out
        float halo = exp(-max(r - ${LIP_R.toFixed(1)}, 0.) / 3.0) * (.5 + .8 * mo);
        float splash = .6 * smoothstep(.6, .95, vn2(p * 1.6 + 9.) * .7 + .3 * vn2(p * 4.7 + 2.) + .25 * exp(-max(r - 9., 0.) / 5.)) * (1. - smoothstep(12., 19., r));
        float drag = (1. - smoothstep(.5, 1.6, abs(p.x) - .8)) * smoothstep(8., 9., abs(p.y)) * (1. - smoothstep(10., 17., abs(p.y))) * .5 * step(0., -p.y);
        float st = clamp(halo + splash * .7 + drag, 0., 1.);
        alb = mix(alb, uStain * (.6 + .5 * fi), st * .72);
        // run-off runnel: thin blue water trickling away from the lip
        vec2 rd = vec2(cos(uRunnel.x), sin(uRunnel.x)); float al = dot(p, rd), ac = dot(p, vec2(-rd.y, rd.x));
        ac += .9 * sin(al * .42 + uRunnel.y) + .25 * sin(al * 1.3 + uRunnel.y * 2.);
        float rw = .16 + .1 * vn2(vec2(al * .8, 3.)) + .5 * (1. - smoothstep(8., 10., al));
        float run = (1. - smoothstep(rw, rw + .1, abs(ac))) * step(7.5, al);
        float bank = (1. - smoothstep(rw, rw + .9, abs(ac))) * step(7.5, al);
        alb = mix(alb, alb * .55 + uStain * .25, bank * .7);
        float flow = vn2(vec2(al * 3. - uTime * 1.6, ac * 9.)) * .6 + vn2(vec2(al * 9. - uTime * 3.4, ac * 20.)) * .4;
        // wet look (after rain): darker, puddled
        float pud = smoothstep(.55, .7, fbm2(p * .22 + 77.)) * uWet;
        alb *= 1. - .45 * uWet;
        // light: hard sun with the cloth's stained-glass shadow, trunk and drum shadows, contact shade
        float ly = max(uSunLocal.y, .05);
        vec3 sunT = vec3(1.);
        float tz = -p.y / (abs(uSunLocal.z) > 1e-4 ? uSunLocal.z : 1e-4);
        if (tz > 0.) {
          float hy = ly * tz - (${LIQ_Y.toFixed(2)}), hx = p.x + uSunLocal.x * tz;
          float pen = .05 + hy * .012;
          float m = (1. - smoothstep(3. - pen, 3. + pen, abs(hx))) * smoothstep(-.2, .3, hy) * (1. - smoothstep(40.3, 41.3, hy));
          if (m > 0.) {
            vec2 q = vec2(hx, hy - uHaul); vec4 rr; float rid;
            float res = resist(q, .02 + hy * .01, rr, rid);
            float hn = max(hy + frontNudge(vec2(hx, hy)) * smoothstep(.5, 4., hy), 0.);
            vec3 dyed = dyeRamp(hn);
            vec3 tc = pow(mix(dyed, mix(uResLo, uResHi, smoothstep(1.5, 19., hn)), res * .9) + 1e-4, vec3(.72));
            sunT = mix(sunT, tc * mix(.55, .32, smoothstep(13., 30., hn)) * mix(1., 1.5, res), m);
          }
        }
        float sh = 0.;
        for (int i = 0; i < 4; i++) sh = max(sh, segShadow(p, uLegA[i], uLegB[i], i < 3 ? .5 : 1.25));
        sunT *= 1. - .88 * sh;
        float contact = 1. - .5 * exp(-max(r - ${LIP_R.toFixed(1)}, 0.) * 1.6);
        for (int i = 0; i < 3; i++) contact *= 1. - .7 * exp(-length(p - uLegA[i].xz) * .9);
        vec3 ambK = vec3(1.);
        if (uYardOn > .5) {
          sunT *= yardT;
          float op = smoothstep(.1, .7, dot(textureLod(uYardShade, yuv, 4.).rgb, vec3(.3, .5, .2)));
          ambK = mix(uYardAmb, vec3(1.), op);
        }
        vec3 c = alb * (uSunCol * uShade * ly * sunT + (uSkyCol * contact + uGndCol * .2) * ambK);
        // water in the runnel and puddles mirrors the haze
        vec3 skyR = skyAt(normalize(vec3(.2 * (flow - .5), 1., .2 * (flow - .5)))) * .55 + uStain * .25;
        c = mix(c, skyR * (.8 + .5 * flow) + uSunCol * uShade * step(.93, flow) * 1.5 * sunT, run * .9);
        c = mix(c, skyAt(vec3(0., 1., 0.)) * .5 * (sunT * .5 + .5), pud * .8);
        float a = 1. - smoothstep(16., 25.5, r + (mo - .5) * 2.);
        gl_FragColor = vec4(c, a);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- drips: bright threads falling to the pit
function buildDrips(count, rng, U) {
  const D = [], E = [], I = [], P = [];
  for (let i = 0; i < count; i++) {
    const kind = rng();
    let x, y, z;
    if (kind < 0.72) { x = rng.sign() * rng.range(2.82, 2.98); y = 0.8 + 17 * Math.pow(rng(), 1.7); z = rng.range(-0.35, 0.35); }
    else if (kind < 0.9) { x = rng.range(-2.9, 2.9); y = 0.5 + 3.5 * rng(); z = rng.range(-0.25, 0.25); }
    else { x = rng.sign() * rng.range(2.8, 2.98); y = rng.range(17, 30); z = rng.range(-0.4, 0.4); }
    const fall = Math.sqrt(2 * (y - LIQ_Y) / 9.8), period = fall + rng.range(0.15, 1.4), ph = rng();
    const b = i * 4;
    for (let k = 0; k < 4; k++) { D.push(x, y, z, ph); E.push(k % 2 ? 1 : -1, k < 2 ? 0 : 1, 1 / period, rng()); P.push(x, y, z); }
    I.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 4));
  g.setAttribute('aE', new THREE.Float32BufferAttribute(E, 4));
  g.setIndex(I);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 14, 0), 20);
  const m = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: GLSL_COMMON + GLSL_TWIST + /* glsl */`
      attribute vec4 aD, aE; uniform vec2 uPx;
      varying vec2 vQ; varying float vA, vY0;
      void main(){
        float tt = uTime * aE.z + aD.w, age = fract(tt), per = 1. / aE.z;
        float tf = age * per, drop = 4.9 * tf * tf, y = aD.y - drop;
        float vel = 9.8 * tf, len = clamp(vel * .05, .14, 1.1);
        float alive = step(${LIQ_Y.toFixed(2)}, y) ;
        // a bead swells at the hem before it lets go
        float hang = 1. - smoothstep(0., .12, tf);
        vec3 c = vec3(aD.x + sin(tt * 3. + aD.w * 40.) * .03, y + aE.y * len, aD.z + sin(aD.y * .16 - uTime * 1.9) * .3 * uWind * hang);
        c.xz = twistXZ(c.xz, twistAt(aD.y + .5));
        vec4 mv = modelViewMatrix * vec4(c, 1.);
        float w = max(.028 + .03 * hang, -mv.z * uPx.y * .85);
        mv.x += aE.x * w * alive;
        vQ = vec2(aE.x, aE.y); vA = alive * (.55 + .45 * aE.w) * min(1., (.028 + .03 * hang) / w * 2.2); vY0 = aD.y;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      uniform vec3 uDripLo, uDripHi;
      varying vec2 vQ; varying float vA, vY0;
      void main(){
        setShade(vY0);
        float a = (1. - vQ.x * vQ.x) * (.35 + .65 * (1. - vQ.y) * (1. - vQ.y)) * smoothstep(0., .08, 1. - vQ.y);
        vec3 col = mix(uDripLo, uDripHi, smoothstep(2., 14., vY0));
        gl_FragColor = vec4(col * (uSunCol * uShade * .9 + uSkyCol * .6) * a * vA, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 3;
  return mesh;
}

// ---------------------------------------------------------------- light presets (the world should call setLight)
const LOOKS = {
  noon: { sun: [-0.269, 0.883, -0.385], sunCol: ['#fff3dc', 2.5], sky: ['#8fa6d6', 0.42], gnd: ['#c99a5a', 0.20], haze: ['#ede6d6', 0.95], zen: ['#a9bcd8', 0.8], wet: 0 },
  evening: { sun: [0.62, 0.3, -0.72], sunCol: ['#ffcf96', 2.3], sky: ['#9a86c8', 0.36], gnd: ['#b0764a', 0.16], haze: ['#f0c8a8', 0.8], zen: ['#8f86c4', 0.6], wet: 0 },
  rain: { sun: [-0.3, 0.84, -0.45], sunCol: ['#ffffff', 2.7], sky: ['#3f6fd0', 0.5], gnd: ['#7a6248', 0.14], haze: ['#9cc0ee', 0.85], zen: ['#2a5fc8', 0.8], wet: 1 },
  night: { sun: [-0.35, 0.8, -0.48], sunCol: ['#b8c8ff', 0.5], sky: ['#2a3a78', 0.22], gnd: ['#1a2040', 0.1], haze: ['#27325e', 0.5], zen: ['#0c1230', 0.5], wet: 0 },
};
const hsl = (h, s, l) => new THREE.Color().setHSL(((h % 1) + 1) % 1, s, l);

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('indigo-hero') : ctx.rng;
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 6 ? opts.palette : DEF_PAL).map((h) => new THREE.Color(h));
  const [cHaze, cOchre, cDeep, cBlue, cSky, cGreen] = pal;
  const look = LOOKS[opts.look] || LOOKS.noon;
  const lc = (p) => new THREE.Color(p[0]).multiplyScalar(p[1]);

  // the dye ramp: vat green -> emerald -> teal -> clear blue -> full indigo (hue walks from green to blue)
  const hg = {}, hb = {}; cGreen.getHSL(hg); cBlue.getHSL(hb);
  const hueShift = rng.range(-0.012, 0.012);
  const ramp = [
    cGreen.clone().lerp(hsl(hg.h + 0.012, 0.9, 0.42), 0.5),
    hsl(lerp(hg.h, hb.h, 0.47) + hueShift, 0.92, 0.235),
    hsl(lerp(hg.h, hb.h, 0.72) + hueShift, 0.92, 0.225),
    hsl(hb.h - 0.015, 0.80, 0.34),
    cBlue.clone().lerp(cDeep, 0.74),
  ];
  const pattern = opts.pattern ?? rng.int(0, 2);
  const PAT = [[0, 1.45, 1.9, 0.5], [1, 1.5, 2.25, 0.5], [2, 1.95, 2.35, 0.64]][pattern];
  const cwRand = rng.sign(), cwSide = opts.cwSide ?? cwRand;      // which end of the axle carries the counterweight

  const U = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]);
  Object.assign(U, {
    uSunDir: { value: new THREE.Vector3(...look.sun).normalize() }, uSunLocal: { value: new THREE.Vector3(...look.sun).normalize() },
    uSunCol: { value: lc(look.sunCol) }, uSkyCol: { value: lc(look.sky) }, uGndCol: { value: lc(look.gnd) },
    uHazeCol: { value: lc(look.haze) }, uZenCol: { value: lc(look.zen) },
    uTime: { value: 0 }, uHaul: { value: 0 }, uWind: { value: 1 }, uTwist: { value: 0 }, uGlow: { value: 0.62 }, uAmbK: { value: 1 }, uShade0: { value: 1 }, uShadeY: { value: new THREE.Vector3(-100, -99, 1) },
    uYardShade: { value: null }, uYardXf: { value: new THREE.Vector4(0, 0, 1, 1) }, uYardOn: { value: 0 }, uYardPos: { value: new THREE.Vector3() }, uYardAmb: { value: new THREE.Vector3(1, 1, 1) }, uWet: { value: look.wet },
    uRamp: { value: ramp }, uSeed: { value: rng.range(0, 50) }, uPat: { value: new THREE.Vector4(...PAT) },
    uResLo: { value: cHaze.clone().lerp(cGreen, 0.22).multiplyScalar(0.92) }, uResHi: { value: cHaze.clone().lerp(cSky, 0.55).multiplyScalar(0.9) },
    uRaffia: { value: cOchre.clone().lerp(cHaze, 0.35) },
    uFoam: { value: new THREE.Color('#7c6a4c').lerp(cOchre, 0.18).multiplyScalar(0.72) }, uLiquor: { value: cDeep.clone().multiplyScalar(0.22) },
    uEarth: { value: cOchre.clone().lerp(cHaze, 0.12).multiplyScalar(0.37) }, uStain: { value: cBlue.clone().lerp(cDeep, 0.1).multiplyScalar(0.95) },
    uDripLo: { value: cGreen.clone().lerp(cHaze, 0.45).multiplyScalar(0.8) }, uDripHi: { value: cSky.clone().lerp(cHaze, 0.4).multiplyScalar(0.7) },
    uDrumAng: { value: 0 }, uBasketDy: { value: 0 }, uRopeLen: { value: 1 },
    uInvModel: { value: new THREE.Matrix4() }, uModel: { value: new THREE.Matrix4() }, uPx: { value: new THREE.Vector2(0.001, 0.001) },
    uRunnel: { value: new THREE.Vector4(rng.range(-0.5, 0.5) + (cwSide > 0 ? 2.6 : 0.5), rng.range(0, 6), 0, 0) },
    uLegA: { value: [] }, uLegB: { value: [] },
  });

  const object = new THREE.Group(); object.name = 'indigo-pits-hero';
  const acc = new Acc();
  const col = new THREE.Color();

  // ---- colours
  const cTrunk = new THREE.Color('#a8987a').lerp(cOchre, 0.18), cTrunkDark = new THREE.Color('#5d5140');
  const cRope = new THREE.Color('#b59c6c').lerp(cOchre, 0.2), cTar = new THREE.Color('#33281d');
  const cCement = new THREE.Color('#b8b1a0').lerp(cHaze, 0.2).multiplyScalar(0.5), cStone = new THREE.Color('#8d8270');
  const uEarthTint = cOchre.clone().lerp(cHaze, 0.12).multiplyScalar(0.5);
  const cDrum = new THREE.Color('#84684a'), cStainV = cBlue.clone().lerp(cDeep, 0.5);

  // ---- the pit: worn cement lip, stained throat
  {
    const prof = [[6.96, -0.9], [6.98, -0.3], [7.0, -0.04], [7.05, 0.07], [7.2, 0.14], [7.62, 0.15], [8.05, 0.13], [8.36, 0.07], [8.6, 0.0], [8.8, -0.08]].reverse().map((p) => new THREE.Vector2(p[0], p[1]));
    const g = new THREE.LatheGeometry(prof, 144), pa = g.attributes.position, na = g.attributes.normal;
    const chips = []; for (let i = 0; i < 9; i++) chips.push([rng.range(0, TAU), rng.range(0.08, 0.2), rng.range(0.03, 0.09)]);
    const joints = 7 + rng.int(0, 3), j0 = rng.range(0, 1);
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), r = Math.hypot(x, z), a = Math.atan2(z, x);
      let dr = 0.05 * ctx.noise.n2(Math.cos(a) * 3.1, Math.sin(a) * 3.1) + 0.02 * ctx.noise.n2(Math.cos(a) * 11, Math.sin(a) * 11 + 5);
      let dy = y > -0.02 ? 0.025 * ctx.noise.n2(x * 0.9, z * 0.9) : 0;
      for (const c of chips) { let da = Math.abs(a - c[0] + Math.PI); da = Math.abs(((da % TAU) + TAU) % TAU - Math.PI); if (da < c[1] && y > 0) dy -= c[2] * (1 - da / c[1]) * (r < 7.5 ? 1 : 0.3); }
      const k = (r + dr * (y > -0.1 ? 1 : 0.3)) / r;
      pa.setXYZ(i, x * k, y + dy, z * k);
    }
    g.computeVertexNormals();
    // LatheGeometry duplicates the seam: copy the first column's normals to the last
    for (let j = 0; j < prof.length; j++) { const a = j, b = 144 * prof.length + j; na.setXYZ(b, na.getX(a), na.getY(a), na.getZ(a)); }
    await ctx.yield?.();
    acc.add(g, new THREE.Matrix4(), {
      mat: 2, colorFn: (x, y, z, c) => {
        const r = Math.hypot(x, z), a = Math.atan2(z, x);
        c.copy(cCement);
        const jf = Math.abs((((a / TAU + 1 + j0) * joints) % 1) - 0.5); if (jf < 0.012 * joints / 7 && y > 0) c.multiplyScalar(0.55);
        const n = ctx.noise.n2(Math.cos(a) * 7, Math.sin(a) * 7) * 0.5 + 0.5, streak = ctx.noise.n2(a * 23, 1.7) * 0.5 + 0.5;
        // indigo soaked in from the liquor side, dribbles over the top toward the outer edge
        let st = smoothstep(7.9, 7.05, r) * (0.55 + 0.45 * n) + smoothstep(0.55, 0.9, streak) * smoothstep(8.6, 7.4, r) * 0.6;
        st += (1 - smoothstep(0.0, 1.2, Math.abs(Math.abs(x) - 3.2))) * 0.25 * (Math.abs(z) < 7.6 ? 1 : 0);
        if (y < -0.03) st = 1;
        c.lerp(cStainV, clamp(st, 0, 1) * 0.86);
        if (y < -0.03) c.multiplyScalar(lerp(0.25, 0.7, smoothstep(-0.9, -0.03, y)) * (0.8 + 0.2 * Math.sin(y * 60)));
        if (r > 8.4) c.lerp(uEarthTint, 0.5);
      },
    });
  }
  await ctx.yield?.();

  // ---- the sheer-legs: three palm trunks
  const footJ = () => rng.range(-0.12, 0.12);
  const bearR = new THREE.Vector3(5.3, CLOTH_TOP, DRUM_Z), bearL = new THREE.Vector3(-5.3, CLOTH_TOP, DRUM_Z);
  const footR = new THREE.Vector3(11.15 + footJ(), -0.4, 1.5 + footJ() * 0.5), footL = new THREE.Vector3(-11.15 + footJ(), -0.4, 1.5 + footJ() * 0.5);
  const footB = new THREE.Vector3(7.0 + footJ() * 2, -0.4, -9.5 + footJ());
  const through = (foot, p, yTop) => foot.clone().add(p.clone().sub(foot).multiplyScalar((yTop - foot.y) / (p.y - foot.y)));
  const legs = [
    { foot: footR, top: through(footR, bearR, 45.2), name: 'right' },
    { foot: footL, top: through(footL, bearL, 45.0), name: 'left' },
    { foot: footB, top: through(footB, new THREE.Vector3(0, 44.6, -2.32), 45.5), name: 'back' },
  ];
  const legPoint = (leg, y) => leg.foot.clone().lerp(leg.top, (y - leg.foot.y) / (leg.top.y - leg.foot.y));
  const legRad = (leg, y) => lerp(0.56, 0.3, clamp((y - leg.foot.y) / (leg.top.y - leg.foot.y), 0, 1));
  const trunkColor = (seedK, y0, y1) => (t, a, out, y) => {
    const band = Math.sin(Math.floor((t * 52 + seedK) * 1.0) * 12.9898 + seedK) * 0.5 + 0.5;
    out.copy(cTrunkDark).lerp(cTrunk, 0.55 + 0.45 * smoothstep(1, 30, y)).multiplyScalar(0.82 + 0.3 * band);
    const sun = 0.9 + 0.1 * Math.sin(a + 2.0); out.multiplyScalar(sun);
    if (y < 3.2) out.lerp(cStainV, (1 - smoothstep(0.2, 3.2, y)) * (0.35 + 0.3 * Math.sin(a * 3 + seedK)));
    if (y < 0.5) out.multiplyScalar(0.6);
  };
  for (let li = 0; li < 3; li++) {
    const leg = legs[li], sk = rng.range(0, 50), ph = rng.range(0, 6);
    const dirLeg = leg.top.clone().sub(leg.foot).normalize();
    addTube(acc, leg.foot, leg.top, {
      step: 0.3, radial: 14, mat: 0, bow: rng.range(0.12, 0.3), bowDir: new THREE.Vector3(rng.range(-1, 1), 0, rng.range(-1, 1)).normalize(),
      lump: 0.035, phase0: ph, v0: rng.range(0, 30),
      radiusFn: (t, v) => { const f = (v / 0.9) % 1; return lerp(0.56, 0.3, t) * (1 + 0.055 * (f < 0.85 ? f / 0.85 - 0.5 : (1 - f) / 0.15 - 0.5)) * (1 + 0.25 * Math.exp(-v * 0.7)); },
      colorFn: trunkColor(sk),
    });
    await ctx.yield?.();
    // forked top: two horns
    const fr = frameOf(dirLeg), fa = rng.range(0, Math.PI);
    for (const s of [-1, 1]) {
      const side = fr.u.clone().multiplyScalar(Math.cos(fa) * s).addScaledVector(fr.w, Math.sin(fa) * s);
      const tip = leg.top.clone().addScaledVector(dirLeg, rng.range(1.1, 1.5)).addScaledVector(side, rng.range(0.45, 0.7));
      addTube(acc, leg.top.clone().addScaledVector(dirLeg, -0.35), tip, {
        rings: 5, radial: 8, mat: 0, cap: true, bow: 0.08, bowDir: side, v0: rng.range(0, 9),
        radiusFn: (t) => lerp(0.24, 0.11, t), colorFn: (t, a, out) => out.copy(cTrunk).multiplyScalar(0.8 + 0.25 * t),
      });
    }
    // splice bands and the foot: wedged with stones
    for (const y of [rng.range(13, 16), rng.range(28, 31)]) addLashing(acc, legPoint(leg, y), dirLeg, legRad(leg, y) + 0.03, rng.range(1.5, 2.2), 9, cRope, rng);
    const ns = 6 + rng.int(0, 2);
    for (let i = 0; i < ns; i++) {
      const a = (i / ns) * TAU + rng.range(-0.3, 0.3), d = rng.range(0.85, 1.25), s = rng.range(0.32, 0.6);
      addStone(acc, leg.foot.x + Math.cos(a) * d - dirLeg.x * 0.4, 0.05 + s * 0.2, leg.foot.z + Math.sin(a) * d - dirLeg.z * 0.4, s * rng.range(0.9, 1.3), s * 0.75, s, cStone, rng);
    }
    await ctx.yield?.();
  }
  U.uLegA.value = [legs[0].foot.clone().setY(0), legs[1].foot.clone().setY(0), legs[2].foot.clone().setY(0), new THREE.Vector3(-3.6, CLOTH_TOP, DRUM_Z)];
  U.uLegB.value = [legs[0].top.clone(), legs[1].top.clone(), legs[2].top.clone(), new THREE.Vector3(3.6, CLOTH_TOP, DRUM_Z)];
  await ctx.yield?.();

  // ---- head beam, braces, climbing pegs, lashings
  const beamY = 44.2, beamZ = -1.98;
  addTube(acc, new THREE.Vector3(-5.9, beamY - 0.05, beamZ), new THREE.Vector3(5.9, beamY + 0.08, beamZ), {
    step: 0.4, radial: 10, mat: 0, cap: true, bow: 0.1, bowDir: new THREE.Vector3(0, 1, 0), v0: 3,
    radiusFn: (t) => 0.27 - 0.05 * Math.abs(t - 0.5), colorFn: (t, a, out) => out.copy(cTrunk).multiplyScalar(0.78 + 0.2 * Math.sin(t * 40) * Math.sin(t * 7)),
  });
  const xAxis = new THREE.Vector3(1, 0, 0);
  for (let li = 0; li < 3; li++) {
    const leg = legs[li], P = legPoint(leg, beamY), dirLeg = leg.top.clone().sub(leg.foot).normalize();
    addLashing(acc, P, dirLeg, legRad(leg, beamY) + 0.03, 1.5, 10, cRope, rng);
    addLashing(acc, new THREE.Vector3(P.x + (li === 2 ? 0 : Math.sign(P.x) * 0.1), beamY, beamZ), xAxis, 0.28, 1.3, 9, cRope, rng);
    // frapping turns that tie leg and beam together, and a loose rope tail swinging down
    addRope(acc, [P.clone().add(new THREE.Vector3(0.25, 0.5, 0)), new THREE.Vector3(P.x + 0.3, beamY - 0.35, (P.z + beamZ) / 2), P.clone().add(new THREE.Vector3(-0.25, 0.5, 0)), new THREE.Vector3(P.x - 0.3, beamY + 0.4, (P.z + beamZ) / 2), P.clone().add(new THREE.Vector3(0.25, 0.5, 0))], 0.07, { color: cRope, segs: 20, radial: 5 });
    const tl = rng.range(1.6, 3.2);
    addRope(acc, [P.clone().add(new THREE.Vector3(0.3, -0.6, 0.3)), P.clone().add(new THREE.Vector3(0.42, -0.6 - tl * 0.5, 0.42)), P.clone().add(new THREE.Vector3(0.4, -0.6 - tl, 0.5))], 0.06, { color: cRope, segs: 8, radial: 5, shadeFn: (t) => 1 - 0.3 * t });
  }
  await ctx.yield?.();
  // braces from the back trunk to each side trunk, high under the drum
  for (const li of [0, 1]) {
    const A = legPoint(legs[2], 33.5 + li), B = legPoint(legs[li], 36 - li * 0.6);
    const d = B.clone().sub(A).normalize();
    addTube(acc, A.clone().addScaledVector(d, -0.7), B.clone().addScaledVector(d, 0.8), {
      step: 0.4, radial: 9, mat: 0, cap: true, bow: 0.08, bowDir: new THREE.Vector3(0, 1, 0), v0: 11 * li,
      radiusFn: (t) => lerp(0.21, 0.16, t), colorFn: (t, a, out) => out.copy(cTrunk).multiplyScalar(0.72 + 0.12 * Math.sin(t * 31)),
    });
    addLashing(acc, A, d, 0.24, 0.9, 7, cRope, rng); addLashing(acc, B, d, 0.2, 0.9, 7, cRope, rng);
    addLashing(acc, legPoint(legs[2], 33.5 + li), legs[2].top.clone().sub(legs[2].foot).normalize(), legRad(legs[2], 34) + 0.03, 1.0, 7, cRope, rng);
    addLashing(acc, B, legs[li].top.clone().sub(legs[li].foot).normalize(), legRad(legs[li], 36) + 0.03, 1.0, 7, cRope, rng);
  }
  await ctx.yield?.();
  // climbing pegs driven through the back trunk
  for (let y = 2.6, k = 0; y < 43; y += 1.55, k++) {
    const P = legPoint(legs[2], y), ang = (k % 2 ? 0.5 : -0.5) + rng.range(-0.15, 0.15), r = legRad(legs[2], y);
    const d = new THREE.Vector3(Math.cos(ang), rng.range(-0.05, 0.1), Math.sin(ang) * 0.4).normalize();
    addTube(acc, P.clone().addScaledVector(d, -(r + 0.55)), P.clone().addScaledVector(d, r + 0.55), {
      rings: 2, radial: 6, mat: 0, cap: true, v0: k, radiusFn: () => 0.075, colorFn: (t, a, out) => out.copy(cTrunkDark).lerp(cTrunk, 0.3 + 0.5 * Math.abs(t - 0.5)),
    });
  }
  await ctx.yield?.();

  // ---- the drum (kind 1: turns about its axle with the haul)
  const DP = [0, CLOTH_TOP, DRUM_Z], drumC = new THREE.Vector3(...DP);
  const rotZ = new THREE.Matrix4().makeRotationZ(-Math.PI / 2);         // lathe axis Y -> X
  const atDrum = (x) => new THREE.Matrix4().makeTranslation(x, CLOTH_TOP, DRUM_Z).multiply(rotZ);
  const cwX = cwSide * 6.75;
  addTube(acc, new THREE.Vector3(-6.3 + (cwSide < 0 ? -1.1 : 0), CLOTH_TOP, DRUM_Z), new THREE.Vector3(6.3 + (cwSide > 0 ? 1.1 : 0), CLOTH_TOP, DRUM_Z), {
    rings: 16, radial: 8, mat: 5, kind: 1, piv: DP, cap: true, radiusFn: () => 0.24, colorFn: (t, a, out) => out.copy(cDrum).multiplyScalar(0.7 + 0.25 * Math.sin(a * 4)),
  });
  addTube(acc, new THREE.Vector3(-3.42, CLOTH_TOP, DRUM_Z), new THREE.Vector3(3.42, CLOTH_TOP, DRUM_Z), {
    rings: 6, radial: 20, mat: 5, kind: 1, piv: DP, radiusFn: () => 0.98, colorFn: (t, a, out) => out.copy(cDrum),
  });
  // the wound cloth: a glazed indigo roll, banded where the selvedges stack
  addTube(acc, new THREE.Vector3(-3.03, CLOTH_TOP, DRUM_Z), new THREE.Vector3(3.03, CLOTH_TOP, DRUM_Z), {
    rings: 24, radial: 28, mat: 6, kind: 1, piv: DP,
    radiusFn: (t) => ROLL_R - 0.035 - 0.03 * Math.pow(Math.abs(t - 0.5) * 2, 6), colorFn: (t, a, out) => { out.copy(ramp[4]).multiplyScalar(0.8 + 0.25 * Math.sin(a * 2 + t * 9) + (Math.abs(t - 0.5) > 0.47 ? 0.5 : 0)); },
  });
  for (const sx of [-1, 1]) {
    const ring = new THREE.RingGeometry(0.96, ROLL_R - 0.04, 28, 3);
    acc.add(ring, new THREE.Matrix4().makeTranslation(sx * 3.03, CLOTH_TOP, DRUM_Z).multiply(new THREE.Matrix4().makeRotationY(sx * Math.PI / 2)), {
      mat: 6, kind: 1, piv: DP, colorFn: (x, y, z, c) => { const r = Math.hypot(y - CLOTH_TOP, z - DRUM_Z); c.copy(ramp[4]).lerp(cSky, 0.25 + 0.2 * Math.sin(r * 90)).multiplyScalar(0.7); },
    });
    // flange: a bevelled wooden disc with handspikes
    const fp = [[0.26, -0.13], [1.5, -0.13], [1.72, -0.08], [1.78, 0], [1.72, 0.08], [1.5, 0.13], [0.26, 0.13]].map((p) => new THREE.Vector2(p[0], p[1]));
    acc.add(new THREE.LatheGeometry(fp, 24), atDrum(sx * 3.5), {
      mat: 5, kind: 1, piv: DP, uvScale: [1, 0.5],
      colorFn: (x, y, z, c) => { const r = Math.hypot(y - CLOTH_TOP, z - DRUM_Z), a = Math.atan2(z - DRUM_Z, y - CLOTH_TOP); c.copy(cDrum).multiplyScalar((0.75 + 0.25 * Math.sin(Math.floor((a / TAU + 0.5) * 8) * 3.3)) * (r > 1.6 ? 0.7 : 1) * (r < 0.5 ? 0.6 : 1)); },
    });
    const spikes = 6, a0 = rng.range(0, 1);
    for (let i = 0; i < spikes; i++) {
      const a = ((i + a0) / spikes) * TAU, dy = Math.cos(a), dz = Math.sin(a);
      addTube(acc, new THREE.Vector3(sx * 3.5, CLOTH_TOP + dy * 0.3, DRUM_Z + dz * 0.3), new THREE.Vector3(sx * 3.5, CLOTH_TOP + dy * 2.55, DRUM_Z + dz * 2.55), {
        rings: 3, radial: 6, mat: 0, kind: 1, piv: DP, cap: true, v0: i, radiusFn: (t) => lerp(0.1, 0.07, t), colorFn: (t, aa, out) => out.copy(cTrunk).multiplyScalar(0.6 + 0.4 * t),
      });
    }
  }
  await ctx.yield?.();
  // winding barrel for the counterweight rope, with its coils
  addTube(acc, new THREE.Vector3(cwX - 0.5, CLOTH_TOP, DRUM_Z), new THREE.Vector3(cwX + 0.5, CLOTH_TOP, DRUM_Z), {
    rings: 2, radial: 14, mat: 5, kind: 1, piv: DP, cap: true, radiusFn: () => 0.78, colorFn: (t, a, out) => out.copy(cDrum).multiplyScalar(0.8),
  });
  addLashing(acc, new THREE.Vector3(cwX, CLOTH_TOP, DRUM_Z), xAxis, 0.8, 0.8, 7, cTar.clone().lerp(cRope, 0.35), rng, { kind: 1, piv: DP, thick: 0.13 });
  // bearings: a crutch of two pegs and a rope cradle on each side trunk (static)
  for (const li of [0, 1]) {
    const P = legPoint(legs[li], CLOTH_TOP), dirLeg = legs[li].top.clone().sub(legs[li].foot).normalize(), r = legRad(legs[li], CLOTH_TOP);
    for (const dz of [-0.4, 0.4]) addTube(acc, new THREE.Vector3(P.x, CLOTH_TOP - 0.75, DRUM_Z + dz), new THREE.Vector3(P.x + (li ? 0.2 : -0.2), CLOTH_TOP + 0.6, DRUM_Z + dz * 1.15), {
      rings: 2, radial: 7, mat: 0, cap: true, radiusFn: () => 0.12, colorFn: (t, a, out) => out.copy(cTrunkDark).lerp(cTrunk, t),
    });
    addLashing(acc, P.clone().addScaledVector(dirLeg, -0.75), dirLeg, r + 0.03, 1.3, 10, cRope, rng);
    addLashing(acc, P.clone().addScaledVector(dirLeg, 0.9), dirLeg, r + 0.03, 0.7, 6, cRope, rng);
  }
  await ctx.yield?.();

  // ---- counterweight: a basket of stones on a tarred rope (kinds 2 and 3)
  const ropeTopY = CLOTH_TOP, ropeZ = DRUM_Z - 0.8 - 0.07, knotRest = 33.2;
  addRope(acc, [new THREE.Vector3(cwX, ropeTopY, ropeZ), new THREE.Vector3(cwX, ropeTopY - 0.5, ropeZ), new THREE.Vector3(cwX, ropeTopY - 1, ropeZ)], 0.085, { color: cTar.clone().lerp(cRope, 0.3), segs: 2, radial: 6, kind: 3, piv: [cwX, ropeTopY, ropeZ] });
  {
    const bp = [[0.02, 0], [0.62, 0.03], [0.86, 0.4], [0.95, 0.95], [0.9, 1.35], [0.97, 1.42], [0.97, 1.5], [0.84, 1.5], [0.8, 1.3]].map((p) => new THREE.Vector2(p[0], p[1]));
    const baseY = knotRest - 3.1, cBask = new THREE.Color('#a98a52').lerp(cOchre, 0.3);
    acc.add(new THREE.LatheGeometry(bp, 20), new THREE.Matrix4().makeTranslation(cwX, baseY, ropeZ).multiply(new THREE.Matrix4().makeScale(0.9, 1, 0.9)), {
      mat: 3, kind: 2, uvScale: [1, 1], colorFn: (x, y, z, c) => { c.copy(cBask).multiplyScalar(0.65 + 0.35 * smoothstep(baseY, baseY + 1.5, y)); if (y > baseY + 1.38) c.multiplyScalar(0.7); },
    });
    for (let i = 0; i < 7; i++) { const a = rng.range(0, TAU), d = i === 0 ? 0 : rng.range(0.25, 0.55); addStone(acc, cwX + Math.cos(a) * d, baseY + 1.45 + (i === 0 ? 0.25 : rng.range(-0.05, 0.12)), ropeZ + Math.sin(a) * d, 0.36, 0.3, 0.36, cStone, rng, { kind: 2 }); }
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.4; addRope(acc, [new THREE.Vector3(cwX + Math.cos(a) * 0.95, baseY + 1.46, ropeZ + Math.sin(a) * 0.95), new THREE.Vector3(cwX + Math.cos(a) * 0.4, baseY + 2.4, ropeZ + Math.sin(a) * 0.4), new THREE.Vector3(cwX, knotRest, ropeZ)], 0.06, { color: cTar.clone().lerp(cRope, 0.3), segs: 5, radial: 5, kind: 2 }); }
    addStone(acc, cwX, knotRest, ropeZ, 0.16, 0.2, 0.16, cTar.clone().lerp(cRope, 0.4), rng, { kind: 2 });
  }
  await ctx.yield?.();

  // ---- people implied: stirring poles left rocking in the pit, a calabash dipper turning on the liquor
  if (opts.props !== false) {
    const sides = rng.shuffle([0.9, 2.3, 3.9, 5.4]);
    for (let i = 0; i < 2; i++) {
      const a = sides[i] + rng.range(-0.25, 0.25), ca = Math.cos(a), sa = Math.sin(a), ph = rng.range(0, 6);
      const B = new THREE.Vector3(ca * 5.5, -2.4, sa * 5.5), Lp = new THREE.Vector3(ca * 7.04, 0.1, sa * 7.04);
      const d = Lp.clone().sub(B).normalize(), T = B.clone().addScaledVector(d, rng.range(8.2, 9.6)), piv = [Lp.x, Lp.y, Lp.z];
      addTube(acc, B, T, {
        step: 0.6, radial: 7, mat: 0, kind: 4, phase: ph, piv, cap: true, bow: 0.12, bowDir: new THREE.Vector3(-sa, 0, ca), v0: i * 5,
        radiusFn: (t) => lerp(0.17, 0.12, t), colorFn: (t, aa, out, y) => { out.copy(cTrunk).multiplyScalar(0.85); out.lerp(cStainV, 1 - smoothstep(0.2, 2.6, y)); },
      });
      const hx = new THREE.Vector3(-sa, 0, ca);
      addTube(acc, T.clone().addScaledVector(hx, -0.55), T.clone().addScaledVector(hx, 0.55), { rings: 2, radial: 6, mat: 0, kind: 4, phase: ph, piv, cap: true, radiusFn: () => 0.075, colorFn: (t, aa, out) => out.copy(cTrunk).multiplyScalar(0.75) });
      addLashing(acc, T.clone().addScaledVector(d, -0.12), d, 0.1, 0.3, 4, cRope, rng, { kind: 4, piv, phase: ph, thick: 0.06 });
    }
    const b = sides[2] + rng.range(-0.2, 0.2), cx = Math.cos(b) * 4.4, cz = Math.sin(b) * 4.4, cGourd = cOchre.clone().lerp(cHaze, 0.35).multiplyScalar(0.85);
    const cp = [[0.02, -0.5], [0.36, -0.42], [0.56, -0.16], [0.62, 0.06], [0.57, 0.08], [0.51, -0.13], [0.31, -0.35], [0.02, -0.41]].map((p) => new THREE.Vector2(p[0], p[1]));
    const piv = [cx, LIQ_Y + 0.22, cz];
    acc.add(new THREE.LatheGeometry(cp, 18), new THREE.Matrix4().makeTranslation(cx, LIQ_Y + 0.22, cz), {
      mat: 4, kind: 5, phase: rng.range(0, 6), piv, colorFn: (x, y, z, c) => { const r = Math.hypot(x - cx, z - cz); c.copy(cGourd); if (r < 0.53 && y > LIQ_Y - 0.2) c.lerp(cStainV, 0.75); c.multiplyScalar(0.8 + 0.2 * Math.sin(Math.atan2(z - cz, x - cx) * 9)); },
    });
    addTube(acc, new THREE.Vector3(cx + 0.55, LIQ_Y + 0.25, cz), new THREE.Vector3(cx + 1.25, LIQ_Y + 0.5, cz + 0.1), { rings: 3, radial: 6, mat: 4, kind: 5, piv, cap: true, bow: 0.06, bowDir: new THREE.Vector3(0, 1, 0), radiusFn: (t) => lerp(0.12, 0.07, t), colorFn: (t, aa, out) => out.copy(cGourd) });
  }
  await ctx.yield?.();

  // ---- meshes
  const solidMat = makeSolidMaterial(U);
  const solid = new THREE.Mesh(await acc.buildAsync(ctx), solidMat); solid.name = 'solids';
  solid.geometry.computeBoundingSphere(); solid.geometry.boundingSphere.radius += 26;      // the basket travels
  object.add(solid);
  await ctx.yield?.();

  const cloth = new THREE.Mesh(buildClothGeometry(), makeClothMaterial(U)); cloth.name = 'rising-length';
  object.add(cloth);
  await ctx.yield?.();

  const liqGeo = new THREE.CircleGeometry(PIT_R + 0.04, 72); liqGeo.rotateX(-Math.PI / 2); liqGeo.translate(0, LIQ_Y, 0);
  const liquor = new THREE.Mesh(liqGeo, makeLiquorMaterial(U)); liquor.name = 'liquor';
  object.add(liquor);

  let apron = null;
  if (opts.apron !== false) {
    const g = new THREE.RingGeometry(LIP_R - 0.1, 26, 72, 1); g.rotateX(-Math.PI / 2); g.translate(0, 0.02, 0);
    apron = new THREE.Mesh(g, makeApronMaterial(U, opts.apronCutGLSL)); apron.name = 'apron'; apron.renderOrder = 1;
    object.add(apron);
  }
  const nDrips = Math.max(60, Math.round((opts.drips ?? 320) * detail));
  const drips = buildDrips(nDrips, rng.fork ? rng.fork('drips') : rng, U); drips.name = 'drips';
  object.add(drips);
  await ctx.yield?.();

  // ---- anchors
  const fly = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, th = lerp(-0.7, TAU, t), r = lerp(17.5, 13.5, smoothstep(0, 1, t)), y = lerp(5.5, 30, smoothstep(0.05, 1, t));
    fly.push(new THREE.Vector3(r * Math.cos(th), y, -r * Math.sin(th)));
  }
  const anchors = {
    clothBase: new THREE.Vector3(0, LIQ_Y, 0), clothTop: new THREE.Vector3(0, CLOTH_TOP, 0), clothNormal: new THREE.Vector3(0, 0, 1), clothWidth: CLOTH_W,
    center: new THREE.Vector3(0, 20, 0),
    gazeAt: (y) => new THREE.Vector3(0, clamp(y, 1, 38), 0),
    flyThrough: fly,
    viewpoints: {
      arrive: new THREE.Vector3(0, 5.5, 60), waterline: new THREE.Vector3(15, 5.5, 14), closest: new THREE.Vector3(2, 23.5, 13.6),
      drumPass: new THREE.Vector3(12, 29, 7), leave: new THREE.Vector3(13.5, 30, 0),
    },
    legs: legs.map((l) => ({ foot: l.foot.clone().setY(0), top: l.top.clone(), name: l.name })),
    perches: [new THREE.Vector3(-2.2, beamY + 0.3, beamZ), new THREE.Vector3(2.9, beamY + 0.3, beamZ), legs[0].top.clone().add(new THREE.Vector3(0, 1.3, 0)), legs[2].top.clone().add(new THREE.Vector3(0, 1.3, 0))],
    drum: drumC.clone(), basket: new THREE.Vector3(cwX, knotRest - 3.1, ropeZ),
    pitRadius: PIT_R, lipRadius: LIP_R, liquorY: LIQ_Y, clearRadius: 12.4, wellRadius: 27,
    sunDir: new THREE.Vector3(...LOOKS.noon.sun).normalize(), exitDir: new THREE.Vector3(0, 0, -1),
  };

  // ---- animation
  let manualHaul = null, wind = 1;
  const size = new THREE.Vector2(), inv = new THREE.Matrix4(), tmpM3 = new THREE.Matrix3();
  const setCol = (u, v, k = 1) => { if (v === undefined) return; if (v.isColor) u.value.copy(v); else u.value.set(v); if (k !== 1) u.value.multiplyScalar(k); };
  const handle = {
    object, radius: 13, height: 46.5, center: anchors.center.clone(), anchors, ground: true, groundY: -0.92,
    uniforms: U, clothGLSL: GLSL_CLOTH, commonGLSL: GLSL_COMMON, pattern, counterweightSide: cwSide,
    parts: { solid, cloth, liquor, apron, drips },
    setProgress(u, seconds = 41) { manualHaul = clamp(u, 0, 1) * seconds * 2; },
    setHaul(m) { manualHaul = m; },
    setWind(w) { wind = clamp(w, 0, 2); },
    setTwist(a) { U.uTwist.value = a; },
    setGlow(g) { U.uGlow.value = g; },
    setLight(o = {}) {
      if (o.sunDir) U.uSunDir.value.copy(o.sunDir).normalize();
      setCol(U.uSunCol, o.sunColor); setCol(U.uSkyCol, o.skyColor); setCol(U.uGndCol, o.groundColor);
      setCol(U.uHazeCol, o.hazeColor); setCol(U.uZenCol, o.zenithColor);
      if (o.shade !== undefined) U.uShade0.value = o.shade;
      if (o.shadeY) U.uShadeY.value.set(o.shadeY[0], o.shadeY[1], o.shadeY[2] ?? 0);
      if (o.yardShade) { U.uYardShade.value = o.yardShade.map; U.uYardXf.value.copy(o.yardShade.xf); U.uYardOn.value = 1; if (o.yardShade.amb) U.uYardAmb.value.copy(o.yardShade.amb); }
      if (o.wet !== undefined) U.uWet.value = o.wet;
    },
    update(dt, time, camera) {
      U.uTime.value = time % 3600;
      const haul = manualHaul !== null ? manualHaul : time * 2;
      U.uHaul.value = haul % 600;
      U.uDrumAng.value = -((haul / ROLL_R) % TAU);
      const drop = (haul * 0.26) % 23;
      U.uBasketDy.value = -drop; U.uRopeLen.value = (ropeTopY - knotRest) + drop;
      U.uWind.value = wind;
      U.uYardPos.value.setFromMatrixPosition(object.matrixWorld);
      U.uModel.value.copy(object.matrixWorld); inv.copy(object.matrixWorld).invert(); U.uInvModel.value.copy(inv);
      U.uSunLocal.value.copy(U.uSunDir.value).applyMatrix3(tmpM3.setFromMatrix4(inv)).normalize();
      if (camera && ctx.renderer) {
        ctx.renderer.getDrawingBufferSize(size);
        const f = camera.isPerspectiveCamera ? Math.tan((camera.fov * Math.PI) / 360) : 0.5;
        U.uPx.value.set(2 * f / Math.max(size.x, 1), 2 * f / Math.max(size.y, 1));
      }
    },
    dispose() {},
  };
  handle.update(0, 0, null);
  return handle;
}

// geometry helpers shared with the world file (src/worlds/indigo-pits.js)
export { Acc, addTube, addRope, addLashing, addStone, frameOf, GLSL_COMMON };
