// The Silver Domes and the Streets of Lead: the makers of the city and its hero, the crystal theatre.
// (From the book Invisible Cities by Italo Calvino, 1923 to 1985; the place only, as the prose lets a reader imagine it.)
//
// Everything of the city is built from one small geometry builder (Geo) and shaded by one family of shaders that all
// read the same baked maps of the place: the sky as the kit's dome gives it (for the silver's mirror and for the
// light from above), a map of roof heights (for what the lead mirrors), a map of shade (the roof heights swept once
// toward the low sun: a shadow lies whole under what casts it) and a map of the lamps' light (for the colour that
// lies on the lead and on the walls). So the domes carry the sky, the streets carry the lamps and the house fronts,
// and the light has a side, from one law.
//
// The makers exported here: makeDome (five makes, any size, with finial), makeFigures (five invented makes),
// makeStall, makeTower with its golden cock, makeCityMaterial and its fellows, and buildHero (the crystal theatre).
// What moves is moved in the vertex shader on the world's clock from phases of its own: lamps swing (under 0.2 m),
// cloth stirs (under 0.25 m), people sway (under 0.1 m) or walk their own ovals, smoke rises and wraps, birds fly
// closed rounds; lit windows come and go by the clock in the fragment shader.
// THE EYE: mirrors, haze and sheen read the eye's place, as they must; a lamp's glow and a smoke dab are flat
// pictures that TURN to face the eye about their own places, each of one size in metres whatever the eye's distance.
// THE PICTURE'S GRAIN: windows, seams, plates and rows are filtered by fwidth of their own coordinates (they go to
// their mean where they are finer than the picture can hold); nothing is faded by metres from the eye.
import * as THREE from 'three';

const TAU = Math.PI * 2;
export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// material kinds (the vertex attribute aM.x); aM.y is a parameter of the kind
export const M = { stone: 0, silver: 1, bronze: 2, lead: 3, gold: 4, cloth: 5, glow: 6, leaf: 7, dark: 8, paint: 9, seat: 10 };
export const COL = {
  silver: lin('#c9d2dc'), stone: lin('#f2e6cf'), stone2: lin('#e4d2b4'), stone3: lin('#d9c6ad'), lead: lin('#6b7480'), bronze: lin('#6a4c2a'), worn: lin('#b8904a'),
  gold: lin('#ffd24a'), crystal: lin('#e8fbff'), dark: lin('#2a2430'),
  lamps: [lin('#e33b3b'), lin('#ffb52e'), lin('#3fbf6a'), lin('#3f8fe0'), lin('#a05ad9')],
};

// ------------------------------------------------------------------ the geometry builder
// Plain arrays that grow; one vertex = place, normal, colour, kind (2), uv (2). Faces are wound outward.
export class Geo {
  constructor() { this.p = []; this.n = []; this.c = []; this.m = []; this.u = []; this.i = []; this.nv = 0; }
  v(x, y, z, nx, ny, nz, col, mid = 0, par = 0, u = 0, w = 0) {
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(col[0], col[1], col[2]); this.m.push(mid, par); this.u.push(u, w);
    return this.nv++;
  }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  get tris() { return this.i.length / 3; }
  // mark() and back(mark): what was added since a mark is taken out again (a thing made in place, then found not to fit)
  mark() { return [this.p.length, this.c.length, this.m.length, this.i.length, this.nv]; }
  back(k) { this.p.length = this.n.length = k[0]; this.c.length = k[1]; this.m.length = this.u.length = k[2]; this.i.length = k[3]; this.nv = k[4]; }
  // a flat four-cornered face from four points (counter-clockwise seen from outside), its normal worked from them
  face(P, col, mid = 0, par = 0, uvs = null) {
    const L = P[P.length - 1], ax = P[1][0] - P[0][0], ay = P[1][1] - P[0][1], az = P[1][2] - P[0][2], bx = L[0] - P[0][0], by = L[1] - P[0][1], bz = L[2] - P[0][2];
    let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const k = this.nv;
    for (let j = 0; j < P.length; j++) this.v(P[j][0], P[j][1], P[j][2], nx, ny, nz, col, mid, par, uvs ? uvs[j][0] : 0, uvs ? uvs[j][1] : 0);
    if (P.length === 4) this.quad(k, k + 1, k + 2, k + 3); else this.tri(k, k + 1, k + 2);
  }
  // a box standing on y0, turned by yaw about its own axis: four walls (uv in metres: along the wall from its middle,
  // and height over y0) and a top; no bottom. o.par: the walls' parameter; o.top: the top's colour and kind
  box(cx, y0, cz, hx, h, hz, yaw, col, mid = 0, o = {}) {
    const c = Math.cos(yaw), s = Math.sin(yaw), W = (lx, lz) => [cx + lx * c + lz * s, cz - lx * s + lz * c];
    const cs = [W(-hx, -hz), W(hx, -hz), W(hx, hz), W(-hx, hz)], par = o.par ?? 0, y1 = y0 + h;
    for (let k = 0; k < 4; k++) {
      const a = cs[k], b = cs[(k + 1) % 4], len = (k % 2 === 0 ? hx : hz) * 2, v0 = o.v0 ?? 0;
      // outward: the corner order above runs clockwise seen from above, so each wall is laid b to a
      this.face([[b[0], y0, b[1]], [a[0], y0, a[1]], [a[0], y1, a[1]], [b[0], y1, b[1]]], col, mid, par, [[len / 2, v0], [-len / 2, v0], [-len / 2, v0 + h], [len / 2, v0 + h]]);
    }
    if (o.top !== false) this.face([[cs[0][0], y1, cs[0][1]], [cs[1][0], y1, cs[1][1]], [cs[2][0], y1, cs[2][1]], [cs[3][0], y1, cs[3][1]]].reverse(), o.topCol || col, o.topMid ?? mid, o.topPar ?? 0);
    if (o.bottom) this.face([[cs[0][0], y0, cs[0][1]], [cs[1][0], y0, cs[1][1]], [cs[2][0], y0, cs[2][1]], [cs[3][0], y0, cs[3][1]]], o.topCol || col, o.topMid ?? mid, 0);
  }
  // a body of revolution about a vertical axis: prof = [[r, y, k?], ...] from the bottom up (k: a colour factor);
  // normals from the profile's own slope. o.ribs, o.ribAmp: raised ribs (the radius swells along rib lines);
  // o.sx, o.sz: stretch (an oval); o.yaw; o.a0, o.a1: a part of the round (radians); o.smoothTop: false keeps creases
  lathe(cx, cy, cz, prof, segs, col, mid = 0, o = {}) {
    const ribs = o.ribs || 0, amp = o.ribAmp || 0, sx = o.sx ?? 1, sz = o.sz ?? 1, yaw = o.yaw || 0, a0 = o.a0 ?? 0, a1 = o.a1 ?? TAU, par = o.par ?? 0;
    const n = prof.length, k0 = this.nv, cy0 = Math.cos(yaw), sy0 = Math.sin(yaw);
    for (let j = 0; j < n; j++) {
      const pa = prof[Math.max(0, j - 1)], pb = prof[Math.min(n - 1, j + 1)]; let dr = pb[0] - pa[0], dy = pb[1] - pa[1]; const dl = Math.hypot(dr, dy) || 1; dr /= dl; dy /= dl;
      const kc = prof[j][2] ?? 1, cc = kc === 1 ? col : [col[0] * kc, col[1] * kc, col[2] * kc];
      for (let i = 0; i <= segs; i++) {
        const a = a0 + (a1 - a0) * i / segs, ca = Math.cos(a), sa = Math.sin(a);
        const rib = ribs ? Math.pow(Math.abs(Math.cos(a * ribs / 2)), 6) : 0, r = prof[j][0] * (1 + amp * rib);
        const lx = ca * r * sx, lz = sa * r * sz, nx0 = ca * dy, nz0 = sa * dy, ny = -dr;
        this.v(cx + lx * cy0 + lz * sy0, cy + prof[j][1], cz - lx * sy0 + lz * cy0, nx0 * cy0 + nz0 * sy0, ny, -nx0 * sy0 + nz0 * cy0, rib > 0.5 && o.ribCol ? o.ribCol : cc, mid, par, a * prof[j][0], prof[j][1]);
      }
    }
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < segs; i++) {
      const a = k0 + j * (segs + 1) + i, b = a + 1, c = a + segs + 2, d = a + segs + 1;
      if (prof[j][0] < 1e-4) this.tri(a, d, c); else if (prof[j + 1][0] < 1e-4) this.tri(a, d, b); else this.quad(a, d, c, b);
    }
  }
  // a tapered limb from A to B (radii ra, rb), 'sides' round, closed at B by a point when rb is 0
  limb(A, B, ra, rb, col, mid = 0, par = 0, sides = 5) {
    let dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2]; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
    let ux = -dz, uy = 0, uz = dx; if (Math.abs(dy) > 0.95) { ux = 1; uz = 0; } const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uz /= ul;
    const wx = dy * uz - dz * uy, wy = dz * ux - dx * uz, wz = dx * uy - dy * ux, k0 = this.nv;
    for (let e = 0; e < 2; e++) { const Q = e ? B : A, r = e ? rb : ra;
      for (let i = 0; i <= sides; i++) { const a = TAU * i / sides, ca = Math.cos(a), sa = Math.sin(a), nx = ux * ca + wx * sa, ny = uy * ca + wy * sa, nz = uz * ca + wz * sa;
        this.v(Q[0] + nx * r, Q[1] + ny * r, Q[2] + nz * r, nx, ny, nz, col, mid, par, i, e * l); } }
    for (let i = 0; i < sides; i++) { const a = k0 + i, b = a + 1, c = a + sides + 2, d = a + sides + 1; this.quad(a, b, c, d); }
  }
  // a copy of another Geo, scaled (s, sy), turned by yaw and set at (x, y, z); tint multiplies its colours
  add(g, x, y, z, yaw = 0, s = 1, sy = s, tint = null) {
    const c = Math.cos(yaw), sn = Math.sin(yaw), k0 = this.nv, P = g.p, N = g.n, C = g.c, inv = s / sy;
    for (let k = 0; k < g.nv; k++) {
      const a = k * 3, lx = P[a] * s, lz = P[a + 2] * s, nx = N[a], nz = N[a + 2]; let ny = N[a + 1] * inv; const nl = Math.hypot(nx, ny, nz) || 1;
      this.p.push(x + lx * c + lz * sn, y + P[a + 1] * sy, z - lx * sn + lz * c);
      this.n.push((nx * c + nz * sn) / nl, ny / nl, (-nx * sn + nz * c) / nl);
      if (tint) this.c.push(C[a] * tint[0], C[a + 1] * tint[1], C[a + 2] * tint[2]); else this.c.push(C[a], C[a + 1], C[a + 2]);
      this.m.push(g.m[k * 2], g.m[k * 2 + 1]); this.u.push(g.u[k * 2], g.u[k * 2 + 1]);
    }
    const I = g.i; for (let k = 0; k < I.length; k++) this.i.push(I[k] + k0);
    this.nv += g.nv;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('aM', new THREE.Float32BufferAttribute(this.m, 2)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.setIndex(this.nv > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
  // the same, handing back (breathe: an async function) after every attribute, so that a great mesh never holds the page
  async buildSlow(breathe) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); await breathe();
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); await breathe();
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); await breathe();
    g.setAttribute('aM', new THREE.Float32BufferAttribute(this.m, 2)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2)); await breathe();
    g.setIndex(this.nv > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1)); await breathe();
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}

// ------------------------------------------------------------------ the shaders' common part
// One set of uniforms for every material of the city (the world fills it once the place is laid and the maps are baked).
export function makeUniforms() {
  const blank = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1); blank.needsUpdate = true;
  return {
    uSky: { value: blank }, uHM: { value: blank }, uLM: { value: blank }, uSM: { value: blank }, uMap: { value: new THREE.Vector4(-512, 200, 1 / 1024, 100) },
    uSunDir: { value: new THREE.Vector3(0, 0.2, -1).normalize() }, uSunCol: { value: new THREE.Color(1, 0.7, 0.45) }, uSunH: { value: new THREE.Vector2(0, -1) }, uSunTan: { value: 0.15 },
    uAmbK: { value: 1 }, uFogCol: { value: new THREE.Color(0.6, 0.5, 0.6) }, uFogSun: { value: new THREE.Color(1, 0.7, 0.45) }, uFogDen: { value: 0.0011 },
    uAmbTint: { value: new THREE.Color(1, 1, 1) }, uTime: { value: 0 }, uLampK: { value: 3 }, uWet: { value: 0 }, uFloor: { value: new THREE.Color(0.12, 0.12, 0.15) }, uInner: { value: 1 }, uWin: { value: 1 }, uSilK: { value: 1 }, uLandK: { value: 1 },
  };
}
export const GLSL_CITY = /* glsl */`
uniform sampler2D uSky, uHM, uLM, uSM; uniform vec4 uMap; uniform vec3 uSunDir, uSunCol, uFogCol, uFogSun, uFloor; uniform vec2 uSunH;
uniform float uSunTan, uAmbK, uFogDen, uTime, uLampK, uWet, uInner, uWin, uSilK, uLandK; uniform vec3 uAmbTint;
float h11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
vec2 skyUv(vec3 d){ vec2 h = d.xz; if (dot(h, h) < 1e-8) h = vec2(0., -1.); float y = clamp(d.y, -1., 1.); return vec2(atan(h.x, -h.y) / 6.2831853 + .5, .5 + .5 * sign(y) * sqrt(abs(y))); }
vec3 skyC(vec3 d, float lod){ vec3 t = textureLod(uSky, skyUv(d), lod).rgb; return t * t * 4.; }
vec2 mapUv(vec2 xz){ return vec2((xz.x - uMap.x) * uMap.z, (uMap.y - xz.y) * uMap.z); }
float hAt(vec2 xz){ return textureLod(uHM, mapUv(xz), 0.).r * uMap.w; }
// the sun's shadow, from the map of shade (the world sweeps the roof heights toward the sun once: at every place the
// height under which the air is in shade): one read, so that a shadow lies whole under what casts it, on the sun's side
float sunLit(vec3 P, vec3 N){
  vec3 Q = P + N * 1.3;
  return 1. - smoothstep(-.5, 1.1, textureLod(uSM, mapUv(Q.xz), 0.).r - Q.y);
}
// the lamps' light where P stands (the map holds it at the ground; it thins with height)
vec3 lampAt(vec3 P, float lod){ vec3 l = textureLod(uLM, mapUv(P.xz), lod).rgb; return l * l * uLampK * exp(-max(P.y - 3.5, 0.) * .2); }
vec3 fogged(vec3 col, vec3 V, float dist){ float f = 1. - exp(-dist * uFogDen); vec2 h = V.xz; float l = max(length(h), 1e-4); float s = max(dot(h / l, uSunH), 0.); return mix(col, mix(uFogCol, uFogSun, s * s * s), f); }
float archSdf(vec2 p, float hw, float hs){ vec2 q = vec2(abs(p.x), p.y); return q.y > hs ? length(vec2(q.x, q.y - hs)) - hw : max(q.x - hw, -q.y); }
`;
const CITY_VERT = /* glsl */`
attribute vec2 aM; uniform float uTime; varying vec3 vW, vN, vC; varying vec2 vM, vU;
void main(){
  vec3 p = position; vM = aM; vC = color; vU = uv;
  float stir = (abs(aM.x - 5.) < .5 || abs(aM.x - 7.) < .5) ? aM.y : 0.;
  p += vec3(sin(uTime * 1.7 + p.x * .9 + p.z * .7), .6 * sin(uTime * 2.3 + p.x * .6 + p.y), cos(uTime * 1.3 + p.z * .8 + p.y * .5)) * stir * .22;
  vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const CITY_FRAG = GLSL_CITY + /* glsl */`
varying vec3 vW, vN, vC; varying vec2 vM, vU;
void main(){
  float id = floor(vM.x + .5), par = vM.y; vec3 alb = vC, col; vec2 fwU = fwidth(vU);
  vec3 N = normalize(vN); if (!gl_FrontFacing && abs(id - 5.) < .5) N = -N;
  vec3 E = vW - cameraPosition; float dist = length(E); vec3 V = E / max(dist, 1e-4);
  float ndl = max(dot(N, uSunDir), 0.), lit = sunLit(vW, N);
  vec3 sun = uSunCol * ndl * lit, amb = skyC(N, 4.) * uAmbK * uAmbTint, lamp = lampAt(vW, 2.) * (.55 + .45 * (1. - abs(N.y)));
  vec3 R = reflect(V, N); float up = smoothstep(-.05, .05, R.y);
  if (id < .5) {
    alb *= .9 + .2 * vn2(vW.xz * .45 + vW.y * .8);
    float glowW = 0.;
    if (par > .5 && par < 1.99) {
      // a house front, drawn from its own make (three: round-headed lights, shuttered square lights, paired narrow
      // lights; bays of 3.6, 3 or 4.2 m), an arcade below with a door deep in each arch, string courses, a cornice.
      // Where a bay is finer than the picture's grain (gr: bays to a pixel) every pattern of the front is drawn as ITS OWN
      // MEAN: its share of the bay at that height (of the whole bay where the storeys too are finer than the grain: fv)
      // times its depth, so that a far front is as dark as the mean of the same front with its arches and windows.
      float H = fract(par) * 128., u = vU.x, v = vU.y; vec2 hid = floor(vC.rg * 40.);
      float mk = h21(hid + 3.7), cw = mk < .34 ? 3.6 : (mk < .67 ? 3. : 4.2), gr = max(fwU.x / cw, fwU.y / 4.), far = 1. - smoothstep(.1, .4, gr), fv = 1. - smoothstep(.1, .4, fwU.y / 4.);
      float cu = (fract(u / cw + .5) - .5) * cw, ci = floor(u / cw + .5);
      alb *= 1. - .1 * mix(.03, 1. - smoothstep(0., .12, abs(fract((v - 5.2) / 4.) - .03) * 4.), fv);
      if (v < 5.2) {
        float hw = cw * .34, hs = 4.3 - hw, a = archSdf(vec2(cu, v), hw, hs), dv = v - hs;
        // (cA: the arch's share of its bay at this height; dM: the door's share of the arch, 28 doors in 100 lit)
        float cA = mix(.53, v < hs ? .68 : (dv < hw ? 2. * sqrt(hw * hw - dv * dv) / cw : 0.), fv), dM = mix(.31, .5 * (1. - smoothstep(2.46, 2.54, v)), fv);
        float r = mix(cA, 1. - smoothstep(-.05, .05, a), far);
        float door = 1. - smoothstep(-.04, .04, max(abs(cu) - hw * .5, v - 2.5)), dl = step(.72, h21(vec2(ci * 1.7 + hid.y, hid.x * 3. + 1.3)));
        // an unlit door is a door, not a dark hole: stone jambs and a stone head 0.13 m broad, a stone threshold, and two
        // leaves of dark wood with two sunk panels each. Where these are finer than the picture's grain (nd: by the jamb's
        // own breadth) the door is drawn as their mean (cF: the stone's share of the door; cP: the panels' share of it)
        float dh = hw * .5, fx = dh - abs(cu), nd = 1. - smoothstep(.35, 1., max(fwU.x, fwU.y) / .13);
        float cF = (.65 + (hw - .26) * .22) / (hw * 2.5), cP = .668 * (1. - .29 / dh);
        float frm = max(1. - smoothstep(.11, .15, min(fx, 2.5 - v)), 1. - smoothstep(.07, .11, v));
        float pnl = smoothstep(.2, .23, fx) * smoothstep(.06, .09, abs(cu)) * max(smoothstep(.3, .33, v) * (1. - smoothstep(1.1, 1.13, v)), smoothstep(1.3, 1.33, v) * (1. - smoothstep(2.17, 2.2, v)));
        vec3 dcol = mix(mix(vec3(.05, .04, .06), vec3(.13, .09, .07), mix(cP / (1. - cF), pnl, nd)), alb * .55, mix(cF, frm, nd));
        alb = mix(alb, alb * vec3(.36, .3, .33), r); alb = mix(alb, dcol, r * mix(dM * .72, door * (1. - dl), far)); glowW = r * mix(dM * .28, door * dl, far) * .7;
        alb *= 1. + .16 * mix(.08, 1. - smoothstep(0., .14, abs(a - .1)), far);
        lamp *= 1. + r;
      } else if (v < H - 1.6) {
        float st = floor((v - 5.2) / 4.), sv = v - 5.2 - st * 4.;
        float hA = h21(vec2(ci * 1.3 + hid.x * 3.1, st * 2.7 + hid.y * 5.7)), hB = h21(vec2(ci * 2.9 + hid.y, st * 1.3 + hid.x * 2.3));
        // the lit windows come and go on the world's clock, each on a round of its own (one to four minutes)
        // (cW, cS: the window's and the shutters' share of the bay at this height; a window is lit 42 parts in 100 of its round)
        float on = smoothstep(-.06, .06, sin(uTime * (.026 + .08 * hB) + hA * 6.2831853) - .25), a, sh = 0., cW, cS = 0.;
        if (mk < .34) { a = archSdf(vec2(cu, sv - .9), .62, 1.5); float dv = sv - 2.4; cW = mix(.171, sv < .9 ? 0. : (dv < 0. ? .344 : (dv < .62 ? 2. * sqrt(.3844 - dv * dv) / 3.6 : 0.)), fv); }
        else if (mk < .67) { a = max(abs(cu) - .55, abs(sv - 1.95) - 1.05); sh = 1. - smoothstep(-.03, .03, max(abs(abs(cu) - .86) - .27, abs(sv - 1.95) - 1.05));
          float in1 = step(.9, sv) * step(sv, 3.); cW = mix(.193, .367 * in1, fv); cS = mix(.189, .36 * in1, fv); }
        else { a = archSdf(vec2(abs(cu) - .62, sv - .9), .4, 1.6); float dv = sv - 2.5; cW = mix(.182, sv < .9 ? 0. : (dv < 0. ? .381 : (dv < .4 ? 4. * sqrt(.16 - dv * dv) / 4.2 : 0.)), fv); }
        float r0 = 1. - smoothstep(-.04, .04, a), r = mix(cW, r0, far);
        alb = mix(alb, vec3(.07, .06, .1), r); glowW = mix(cW * .42, r0 * on, far);
        alb = mix(alb, mix(vec3(.13, .27, .23), vec3(.3, .19, .12), step(.5, h21(hid + 1.1))), mix(cS, sh, far) * .9);
        alb *= 1. - .25 * mix(.08, 1. - smoothstep(.04, .14, abs(a - .16)), far);
        // a sill under every window, below its frame's line: a ledge 0.12 m high that takes the light, and its shade
        // under it, as much darker as the ledge is lighter and of the same height: its mean is the bare wall's, so it is
        // drawn to nothing where finer than the grain (by its own height)
        float sw = mk < .34 ? .95 : (mk < .67 ? 1.2 : 1.3), sx = 1. - smoothstep(-.03, .03, abs(cu) - sw);
        alb *= 1. + .16 * sx * (smoothstep(.5, .54, sv) * (1. - smoothstep(.62, .66, sv)) - smoothstep(.38, .42, sv) * (1. - smoothstep(.5, .54, sv))) * (1. - smoothstep(.35, 1., max(fwU.x, fwU.y) / .12));
      } else alb *= 1.07 - .2 * mix(.45, step(.55, fract(u / .9)), far) * step(H - 1.25, v) * step(v, H - .75);
    } else if (par > 1.99 && par < 2.5) {
      float w = vU.x, v = vU.y; float a = archSdf(vec2((fract(w / 2.4) - .5) * 2.4, v - .7), .42, 1.5);
      float sl = 1. - smoothstep(-.04, .04, a), sg2 = fwU.x / 2.4, sk = 1. - smoothstep(.1, .4, sg2), si = floor(w / 2.4), hs = h21(vec2(si * 1.9 + floor(vC.r * 40.) * 2.3, floor(vC.g * 40.) * 4.1 + 7.));
      // (a drum's lights, drawn as their own mean where finer than the grain: cD, a light's share of its bay at this height; lit 40 parts in 100)
      float dv = v - 2.2, cD = v < .7 ? 0. : (dv < 0. ? .35 : (dv < .42 ? sqrt(.1764 - dv * dv) / 1.2 : 0.));
      alb = mix(alb, vec3(.06, .05, .09), mix(cD, sl, sk));
      glowW = mix(cD * .4, sl * smoothstep(-.06, .06, sin(uTime * (.03 + .07 * hs) + hs * 40.) - .3), sk);
    } else if (par > 2.5) {
      // a gallery's balustrade: balusters 0.3 m apart between a foot rail and a hand rail, the air between them dark.
      // Drawn as its own mean where finer than the grain: the air is 58 parts in 100 of the breadth between the rails
      // (by the balusters' own spacing), and the rails' span 65 parts in 100 of the height (by that span)
      float bu = abs(fract(vU.x / .3) - .5), bnr = 1. - smoothstep(.15, .5, fwU.x / .3), bvr = 1. - smoothstep(.15, .5, fwU.y / .52);
      alb *= 1. - .62 * mix(.58, smoothstep(.17, .25, bu), bnr) * mix(.65, smoothstep(.12, .16, vU.y) * (1. - smoothstep(.64, .68, vU.y)), bvr);
    }
    col = alb * (sun + amb + lamp) + vec3(1., .62, .25) * glowW * uWin;
  } else if (id < 1.5) {
    float pan = floor(vU.y / 1.7), pu = floor(vU.x / 2.3 + pan * .5); vec2 hh = vec2(h21(vec2(pan, pu)), h21(vec2(pu, pan + 7.))) - .5;
    vec3 Np = normalize(N + vec3(hh.x, 0., hh.y) * .02); vec3 Rp = reflect(V, Np); float upp = smoothstep(-.05, .05, Rp.y);
    // (the seams between the silver's plates, drawn as their own mean, 8 parts in 100, where they are finer than the grain)
    float sgr = max(fwU.y / 1.7, fwU.x / 2.3), seam = mix(.08, max(smoothstep(.45, .5, abs(fract(vU.y / 1.7) - .5)), smoothstep(.47, .5, abs(fract(vU.x / 2.3 + pan * .5) - .5))), 1. - smoothstep(.1, .4, sgr));
    vec3 mir = mix(uFloor + lampAt(vec3(vW.x, 3., vW.z), 4.) * .5, skyC(Rp, 1.), upp);
    float glint = pow(max(dot(Rp, uSunDir), 0.), 48.) * lit;
    float ptone = .9 + .2 * h21(vec2(pu + 3., pan));
    // the sunset lies in the silver: rose and gold on the side toward the sun's bearing, the sky's blue-violet on the other
    float sside = pow(max(dot(normalize(N.xz + vec2(1e-4)), uSunH), 0.), 1.5) * (.45 + .55 * lit);
    col = alb * ptone * (mir * .74 * uSilK + sun * .6 + uSunCol * vec3(1., .78, .62) * sside * .22 + amb * .26 + lamp * .3) * (1. - .3 * seam) + uSunCol * glint * 1.1;
  } else if (id < 2.5) {
    float edge = pow(max(1. - abs(dot(N, V)), 0.), 2.5), vg = smoothstep(.35, .85, vn2(vW.xz * .55 + vW.y * .35)) * (1. - par) * (.5 - .3 * N.y) * .7;
    alb = mix(alb, vec3(.09, .2, .16), vg);
    col = alb * (sun * 1.3 + amb * 2.1 + lamp * 1.3) + vec3(.52, .31, .09) * (edge * .4 + par * .25) * (amb + sun * .6 + lamp * .5) + mix(uFloor, skyC(R, 3.), up) * vec3(.5, .34, .16) * .2;
  } else if (id < 3.5) {
    col = alb * (sun + amb + lamp) + mix(uFloor, skyC(R, 2.), up) * (.2 + .25 * uWet);
  } else if (id < 4.5) {
    col = alb * (sun * 1.2 + amb * .9 + lamp * .5 + .22) + alb * mix(uFloor, skyC(R, 1.), up) * .9 + uSunCol * pow(max(dot(R, uSunDir), 0.), 30.) * lit * .8;
  } else if (id < 5.5) {
    // cloth, by its weave (vU.y: 0 to 1 = even stripes the cloth's whole length; 2 to 3 = one plain dye, its folds' ridges
    // lighter than their hollows, and a darker hem at its foot; 4 to 5 = the stripes with the same hem: a hung cloth);
    // stripes and folds go to their mean by the picture's grain
    float wk = floor(vU.y * .5 + .0005), vv = vU.y - 2. * wk, fine = smoothstep(.25, .7, fwU.x);
    if (wk < .5 || wk > 1.5) alb = mix(alb, mix(alb, vec3(.9, .85, .74), .8), mix(step(.5, fract(vU.x)), .5, fine));
    else alb *= .88 + .12 * cos(vU.x * 6.2831853) * (1. - fine);
    if (wk > .5) alb *= 1. - .32 * smoothstep(.84, .9, vv);
    col = alb * (uSunCol * (ndl * .7 + .25) * lit + amb + lamp * 1.6);
  } else if (id < 6.5) {
    col = alb * par;
  } else if (id < 7.5) {
    alb *= .75 + .5 * vn2(vW.xz * 1.6 + vW.y * 2.3); alb = mix(alb, vec3(dot(alb, vec3(.3, .5, .2))) * vec3(1.08, 1., .7), .3);
    // leaves take the low sun round their flanks and through their rims (the afterglow behind a tree lights its edge)
    float wrap = max(dot(N, uSunDir) * .6 + .4, 0.), back = pow(max(dot(V, uSunDir), 0.), 2.) * pow(max(1. - abs(dot(N, V)), 0.), 1.5);
    col = alb * ((uSunCol * (wrap * wrap * .9 * mix(.4, 1., lit) + back * 1.6) + amb * 1.9) * uLandK + lamp);
  } else if (id < 8.5) {
    col = alb * (amb * .6 + lamp * 1.4);
  } else if (id < 9.5) {
    // the stage's painted cloth (19.2 m by 10.3 m): an evening sky, gold at its foot and dusk violet at its head, over a
    // line of far hills; thin rose bars of cloud drift on the world's clock (never a day's blue with white clouds).
    // Nothing of it is finer than the picture's grain.
    vec2 q = vU * vec2(.09, .16) + vec2(uTime * .012 + vC.r * 37., 0.); float c = vn2(q * 3.) * .6 + vn2(q * 7. + 3.) * .4, hy = vU.y / 10.3;
    vec3 pk = mix(vec3(1.05, .62, .34), vec3(.40, .28, .56), smoothstep(.05, .85, hy));
    pk = mix(pk, vec3(1.0, .58, .46), smoothstep(.5, .78, c) * (.3 + .3 * hy));
    pk = mix(pk, vec3(.16, .12, .24), 1. - smoothstep(-.03, .03, hy - .1 - .13 * vn2(vec2(vU.x * .33 + vC.r * 11., 2.5))));
    col = pk * par * uInner;
  } else {
    float gap = smoothstep(.07, .15, abs(fract(vU.x / .95) - .5)), velvet = smoothstep(.55, .85, N.y);
    col = mix(alb, vec3(.55, .06, .07), velvet * .85) * par * uInner * (.16 + .84 * gap) * (.7 + .3 * N.y);
  }
  gl_FragColor = vec4(fogged(col, V, dist), 1.);
}`;
export function makeCityMaterial(U) {
  return new THREE.ShaderMaterial({ uniforms: U, vertexShader: CITY_VERT, fragmentShader: CITY_FRAG, vertexColors: true, side: THREE.DoubleSide });
}

// ------------------------------------------------------------------ the ground: lead plates in the city and on the road, tilled land outside
// The lead is a dull mirror: it shows the sky, the dark of whatever stands across the way (found on the map of roof
// heights along the mirrored ray) and every lamp as a long soft streak (the lamp map read where the mirrored ray
// passes the heights lamps hang at). It reads the eye's place, as any mirror does; nothing else of the camera.
const GROUND_FRAG = GLSL_CITY + /* glsl */`
varying vec3 vW; uniform vec3 uLead, uWallC; uniform vec4 uChanA, uBasA, uBasB; uniform float uBasH;
float basin(float t, vec2 b){ return smoothstep(b.x - .06, b.x + .06, t) * (1. - smoothstep(b.y - .06, b.y + .06, t)); }
// the lamps' light where the mirrored ray passes the height h (s metres on), blurred by as much as the next look lies apart
vec3 streak(vec2 xz, vec2 rh, float inv, float h, float dh){
  vec3 l = textureLod(uLM, mapUv(xz + rh * min(h * inv, 170.)), clamp(log2(max(dh * inv * 1.15, 1.)), 0., 6.)).rgb; return l * l * uLampK; }
void main(){
  vec3 E = vW - cameraPosition; float dist = length(E); vec3 V = E / max(dist, 1e-4);
  float kind = smoothstep(.35, .65, textureLod(uHM, mapUv(vW.xz), 0.).g);
  vec3 up = vec3(0., 1., 0.); float lit = sunLit(vW, up); vec3 amb = skyC(up, 5.) * uAmbK, lampD = lampAt(vec3(vW.x, 0., vW.z), 1.5);
  // the plates: 2.6 by 1.7 m, every other row set off by half a plate; seams dark and soft, each plate its own tone and
  // tilt. Where the plates are finer than the picture's grain they are drawn as their mean (grain: plates to a pixel).
  vec2 q0 = vW.xz / vec2(2.6, 1.7); float grain = max(fwidth(q0.x), fwidth(q0.y)), nearK = 1. - smoothstep(.12, .5, grain);
  vec2 q = q0; q.x += .5 * floor(q.y); vec2 pid = floor(q), f = fract(q);
  float e = min(min(f.x, 1. - f.x) * 2.6, min(f.y, 1. - f.y) * 1.7);
  float seam = (1. - smoothstep(.015, .05 + grain * 1.6, e)) * nearK, tone = .86 + .26 * mix(.5, h21(pid), nearK) + .1 * vn2(vW.xz * .11);
  // the basins of still water down the avenue's middle, paved crossings between them (uChanA: the avenue's start and its heading; uBasA, uBasB: four basins' from and to along it; uBasH: their half breadth)
  vec2 cd = vW.xz - uChanA.xy; float ct = dot(cd, uChanA.zw), cl = abs(cd.x * uChanA.w - cd.y * uChanA.z);
  float chan = uBasH > 0. ? (1. - smoothstep(uBasH - .06, uBasH + .06, cl)) * max(max(basin(ct, uBasA.xy), basin(ct, uBasA.zw)), max(basin(ct, uBasB.xy), basin(ct, uBasB.zw))) : 0.;
  seam *= 1. - chan; tone = mix(tone, .8, chan);
  vec2 tilt = (vec2(h21(pid + 3.1), h21(pid + 7.7)) - .5) * .03 * nearK;
  // after rain (the rare; a standing state): the lead darker, pools standing in the low plates, mirrors without a tilt
  float pud = max(uWet * smoothstep(.5, .64, vn2(vW.xz * .19 + 7.3)) * (1. - .8 * seam), chan);
  vec3 N = normalize(vec3(tilt.x * (1. - pud), 1., tilt.y * (1. - pud)));
  vec3 alb = uLead * tone * (1. - .5 * seam) * (1. - .05 * (1. - nearK)) * (1. - .38 * uWet) * (1. - .55 * chan);
  vec3 dif = alb * (uSunCol * max(dot(N, uSunDir), 0.) * lit + amb + lampD);
  // the dull mirror: the sky by the plate's own tilt; what stands across the way and the lamps by the flat of the street
  vec3 R = reflect(V, N); R.y = max(R.y, .015);
  vec2 rh = V.xz; float rl = max(length(rh), 1e-4); rh /= rl; float tn = max(-V.y, .015) / rl;
  float hit = smoothstep(-1., 2.5, hAt(vW.xz + rh * 2.5) - 2.5 * tn);
  hit = max(hit, smoothstep(-1., 3.5, hAt(vW.xz + rh * 7.) - 7. * tn));
  hit = max(hit, smoothstep(-2., 5., hAt(vW.xz + rh * 18.) - 18. * tn));
  hit = max(hit, smoothstep(-2., 7., hAt(vW.xz + rh * 45.) - 45. * tn));
  hit = max(hit, smoothstep(-2., 8., hAt(vW.xz + rh * 105.) - 105. * tn));
  hit *= (1. - textureLod(uHM, mapUv(vW.xz), 0.).b) * .6;
  vec3 mir = mix(skyC(normalize(R), 1.6 - uWet), uWallC, hit);
  // every lamp lies in the lead as one long soft streak toward the eye: the lamps' map is read where the mirrored ray
  // passes twelve heights (1.1 m to 15 m, each a quarter higher than the last), each read blurred by more than its
  // distance from the next, so that the streak is whole and smooth (no row of separate images)
  float inv = 1. / max(tn, .02); vec3 lr = vec3(0.); float hh = 1.1;
  for (int k = 0; k < 12; k++) { lr += streak(vW.xz, rh, inv, hh, hh * .27) * (k == 0 ? .6 : 1.) * (1. - .5 * smoothstep(8., 15., hh)); hh *= 1.27; }
  float tremble = .93 + .14 * vn2(vW.xz * .7 + uTime * vec2(.33, .26));
  // (wet lead is a clearer mirror but a darker one: it never glares; the channel's water is darker than the lead about it)
  float fres = mix(.22, .62, pow(1. - clamp(-V.y, 0., 1.), 3.)) * (1. + .3 * uWet) * (1. - .6 * seam); fres = mix(fres, .8, pud * .8);
  vec3 lead = dif * (1. - .45 * fres) + (mir * (.55 - .17 * uWet + .3 * chan) + lr * (.2 + .06 * uWet + .2 * chan) * mix(tremble, 1., pud) * (1. - .5 * hit)) * fres * (.75 + .25 * tone) * (1. - .6 * chan);
  // the land outside: fields of vines, stubble and tilled earth; they meet by green verges, never by a hard line, and
  // none of their bounds lies along the road. Rows and verges finer than the picture's grain are drawn as their mean.
  vec2 fp = (vW.xz + vec2(32., 17.)) / 64. + (vec2(vn2(vW.xz * .013), vn2(vW.xz * .013 + 7.)) - .5) * .5;
  vec2 pc = floor(fp), pf = fract(fp); float ph = h21(pc), pa = floor(h21(pc + 9.3) * 4.) * .7854 + .3, mpp = max(fwidth(vW.x), fwidth(vW.z));
  vec3 earth = ph < .5 ? vec3(.2, .235, .07) : (ph < .82 ? vec3(.5, .38, .14) : vec3(.27, .16, .085));
  earth *= (.82 + .36 * vn2(vW.xz * .16)) * (.88 + .24 * h21(pc + 2.7));
  // The rows are a field's own: they waver a little (their lines are bent by a slow noise), every ridge has its own
  // depth of furrow (half to one and a half of the field's) and its own share of a second colour (among the vines a
  // second, cooler green; on stubble and tilled earth a second tone), each ridge's two passing softly into the next's
  // across the furrow between them; the furrows have soft edges (a slow ramp from the ridge's crown to the furrow's
  // bed). By the rows' own grain all three go to their means: the ramp's 45 parts in 100, the depth's one, the second
  // colour's 3 parts in 10.
  float rc = dot(vW.xz, vec2(cos(pa), sin(pa))) / 2.4 + .7 * (vn2(vW.xz * .045 + pc * 3.1) - .5), rowK = ph < .5 ? 1. : (ph < .82 ? .35 : .8);
  float rj = floor(rc + .5), rg = smoothstep(.3, .7, fract(rc + .5)), rnear = 1. - smoothstep(.15, .5, fwidth(rc));
  float rdep = mix(.5, mix(h11(rj + ph * 91.), h11(rj + 1. + ph * 91.), rg), rnear), rton = mix(.5, mix(h11(rj * 1.7 + 5.3), h11(rj * 1.7 + 7.), rg), rnear);
  // (the two colours are set about the field's own so that 7 parts of the first and 3 of the second make it again: a far field is as it was)
  earth *= ph < .5 ? mix(vec3(1.18, 1.069, .914), vec3(.58, .84, 1.2), .6 * rton) : mix(vec3(1.086, 1.069, 1.043), vec3(.8, .84, .9), .6 * rton);
  earth *= 1. - .3 * rowK * (.5 + rdep) * mix(.45, smoothstep(.1, 1., abs(fract(rc) - .5) * 2.), rnear);
  // (the verges are drawn as their own mean, 15 parts in 100 of the land, where finer than the grain)
  float ed = min(min(pf.x, 1. - pf.x), min(pf.y, 1. - pf.y)) * 64., verge = mix(.15, 1. - smoothstep(1.2, 3.6, ed), 1. - smoothstep(2., 7., mpp));
  earth = mix(earth, vec3(.13, .17, .06) * (.85 + .3 * vn2(vW.xz * .9)), verge);
  vec3 land = earth * ((uSunCol * (uSunDir.y * .9 + .34) * mix(.35, 1., lit) + amb * 1.3) * uLandK + lampD);
  gl_FragColor = vec4(fogged(mix(lead, land, kind), V, dist), 1.);
}`;
export function makeGroundMaterial(U, o = {}) {
  return new THREE.ShaderMaterial({ uniforms: { ...U, uLead: { value: new THREE.Color().fromArray(o.lead || COL.lead) }, uWallC: { value: new THREE.Color().fromArray(o.wall || [0.2, 0.17, 0.2]) },
    uChanA: { value: new THREE.Vector4().fromArray(o.chanA || [0, 0, 0, -1]) }, uBasA: { value: new THREE.Vector4().fromArray(o.basA || [1e6, 1e6, 1e6, 1e6]) }, uBasB: { value: new THREE.Vector4().fromArray(o.basB || [1e6, 1e6, 1e6, 1e6]) }, uBasH: { value: o.basH || 0 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }', fragmentShader: GROUND_FRAG });
}

// ------------------------------------------------------------------ lamps: glass drops that swing and flicker, and their glows
// Each lamp hangs from its own point (iPos.xyz) on a cord of iPos.w metres and swings about that point in the vertex
// shader: the greatest swing is LAMP.swing radians, so a lamp's body moves at most (cord + 0.5) x sin(swing) from rest.
// (LAMP.glow: the glow disc's breadth in metres, one for every lamp)
export const LAMP = { swing: 0.12, h: 0.44, r: 0.165, glow: 1.9 };
const LAMP_SWING = /* glsl */`
attribute vec4 iPos, iCol; uniform float uTime;
vec3 lampPlace(float down, vec2 off){
  float ph = iCol.w, a = ${LAMP.swing.toFixed(3)} * sin(uTime * (1.2 + .6 * fract(ph * 7.31)) + ph * 6.2831853), d = ph * 40.;
  float L = iPos.w + down; vec2 dir = vec2(cos(d), sin(d));
  return iPos.xyz + vec3(dir.x * sin(a) * L + off.x, -cos(a) * L, dir.y * sin(a) * L + off.y);
}
float flick(){ float ph = iCol.w; return .82 + .18 * sin(uTime * (5. + 4. * fract(ph * 3.7)) + ph * 50.) * sin(uTime * 1.9 + ph * 20.); }
`;
export function makeLampMaterials(U) {
  const body = new THREE.ShaderMaterial({ uniforms: U,
    vertexShader: LAMP_SWING + /* glsl */`varying vec3 vC, vW, vN; void main(){ vec3 w = lampPlace(-position.y, position.xz); vW = w; vN = normal; vC = iCol.rgb * flick(); gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.); }`,
    fragmentShader: GLSL_CITY + /* glsl */`varying vec3 vC, vW, vN; void main(){ vec3 E = vW - cameraPosition; float dist = length(E); vec3 V = E / max(dist, 1e-4); float f = abs(dot(normalize(vN), V));
      vec3 col = vC * (.9 + 1.5 * f * f) + vec3(1., .9, .7) * f * f * f * f * .25; gl_FragColor = vec4(fogged(col, V, dist * .5), 1.); }` });
  const glow = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: LAMP_SWING + /* glsl */`uniform float uFogDen; varying vec3 vC; varying vec2 vQ; void main(){ vec3 c = lampPlace(${(LAMP.h * 0.5).toFixed(2)}, vec2(0.));
      vec3 toE = cameraPosition - c; float d = max(length(toE), 1e-3); toE /= d; vec3 rt = normalize(cross(vec3(0., 1., 0.), toE) + vec3(1e-5, 0., 0.)), upv = cross(toE, rt);
      // the glow: a disc of one size (1.9 m across) at the lamp's own place, turned to face the eye; the haze dims it
      vQ = position.xy; vC = iCol.rgb * flick() * exp(-d * uFogDen * .5);
      gl_Position = projectionMatrix * viewMatrix * vec4(c + (rt * position.x + upv * position.y) * ${LAMP.glow.toFixed(2)}, 1.); }`,
    fragmentShader: /* glsl */`varying vec3 vC; varying vec2 vQ; void main(){ float r = clamp(length(vQ) * 2., 0., 1.); float a = (1. - r) * (1. - r); gl_FragColor = vec4(vC * a * a * .7 + vC * a * .14, 1.); }` });
  return { body, glow };
}
// the lamp's own shape: a glass drop with a small cap, hanging from y = 0 down to -LAMP.h
export function lampGeometry() {
  const g = new Geo(), r = LAMP.r, h = LAMP.h, c = [1, 1, 1];
  g.lathe(0, -h, 0, [[0, 0], [r, h * 0.42], [r * 0.3, h]], 4, c);
  return g.build();
}

// ------------------------------------------------------------------ the small living things, each one instanced kind with its own law
// PEOPLE stand where they are dealt and only sway (the head moves under 0.1 m), or walk round a long narrow oval of
// their own (walkerAt below is the shader's law in JS: the world tests the whole oval against the route). BIRDS fly closed rounds on the world's
// clock: place(t) = centre + turn(yaw) x (a cos tau, h sin(2 tau + q), b sin tau), tau = w t + phase: a closed curve
// that the world tests whole against the route (birdAt below is the same law in JS). SMOKE rises from its own grill
// and wraps; its drift is bounded by its own amplitude.
export function birdAt(b, t, out) {
  const tau = b.w * t + b.ph, c = Math.cos(b.yaw), s = Math.sin(b.yaw), lx = b.a * Math.cos(tau), lz = b.b * Math.sin(tau);
  out[0] = b.x + lx * c + lz * s; out[1] = b.y + b.h * Math.sin(2 * tau + b.q); out[2] = b.z - lx * s + lz * c; return out;
}
export function makeLifeMaterials(U) {
  const people = new THREE.ShaderMaterial({ uniforms: U,
    vertexShader: /* glsl */`attribute vec4 iPos, iCol, iW; uniform float uTime; varying vec3 vC, vW, vN;
      void main(){ float ph = iCol.w * 6.2831853, mv = step(.01, iW.x), tau = iW.z * uTime + ph; vec3 p = position; float hgt = p.y;
        // a walker's place on its oval (iW: half length, half breadth, turn rate, the oval's bearing) and its heading along it
        float lc = cos(iW.w), ls = sin(iW.w); vec2 o = vec2(iW.x * cos(tau), iW.y * sin(tau)), tg = vec2(-iW.x * sin(tau), iW.y * cos(tau)) * sign(iW.z + 1e-6);
        vec2 ow = vec2(o.x * lc + o.y * ls, -o.x * ls + o.y * lc), tw = vec2(tg.x * lc + tg.y * ls, -tg.x * ls + tg.y * lc);
        float yaw = mix(iPos.w, atan(tw.x, tw.y), mv), c = cos(yaw), s = sin(yaw), stp = sin(tau * iW.x * 2.6);
        p.x += (1. - mv) * .05 * hgt * sin(uTime * (.7 + .5 * iCol.w) + ph); p.z += (1. - mv) * .035 * hgt * sin(uTime * (.5 + .4 * iCol.w) + ph * 1.7) + mv * .04 * hgt;
        p.y += mv * .025 * abs(stp); p.z += mv * .16 * stp * sign(p.x) * step(abs(p.x), .34) * step(.2, abs(p.x)) * (1. - smoothstep(.7, 1.35, hgt));
        vec3 w = iPos.xyz + vec3(ow.x, 0., ow.y) * mv + vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c); vW = w; vN = vec3(normal.x * c + normal.z * s, normal.y, -normal.x * s + normal.z * c);
        vC = mix(iCol.rgb, vec3(.5, .36, .28), step(1.47, hgt)); gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.); }`,
    fragmentShader: GLSL_CITY + /* glsl */`varying vec3 vC, vW, vN; void main(){ vec3 N = normalize(vN); vec3 E = vW - cameraPosition; float dist = length(E); vec3 V = E / max(dist, 1e-4);
      vec3 col = vC * (uSunCol * max(dot(N, uSunDir), 0.) * sunLit(vW, N) + skyC(N, 4.) * uAmbK + lampAt(vW, 2.) * 1.3); gl_FragColor = vec4(fogged(col, V, dist), 1.); }` });
  const birds = new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec4 iA, iB, iC; uniform float uTime; varying vec3 vC, vW;
      vec3 at(float tau){ float c = cos(iB.w), s = sin(iB.w), lx = iB.x * cos(tau), lz = iB.y * sin(tau); return iA.xyz + vec3(lx * c + lz * s, iB.z * sin(2. * tau + iC.z), -lx * s + lz * c); }
      void main(){ float tau = iC.x * uTime + iC.y; vec3 c = at(tau), f = at(tau + .02 * sign(iC.x)) - c; f = normalize(f + vec3(0., 0., 1e-5));
        vec3 r = normalize(cross(vec3(0., 1., 0.), f) + vec3(1e-5, 0., 0.)), u = cross(f, r); vec3 p = position * iA.w;
        float flap = sin(uTime * iC.w + iC.y * 9.) * abs(p.x) * .7; p.y += flap; p.x *= 1. - .25 * abs(flap) / max(abs(p.x), .05) * step(.01, abs(p.x));
        vec3 w = c + r * p.x + u * p.y + f * p.z; vW = w; vC = mix(vec3(.06, .06, .08), vec3(.42, .42, .48), step(iC.w, 10.)); gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.); }`,
    fragmentShader: GLSL_CITY + /* glsl */`varying vec3 vC, vW; void main(){ vec3 E = vW - cameraPosition; float dist = length(E); vec3 V = E / max(dist, 1e-4);
      vec3 col = vC * (skyC(vec3(0., 1., 0.), 4.) * 2. + uSunCol * .6); gl_FragColor = vec4(fogged(col, V, dist), 1.); }` });
  const smoke = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`attribute vec4 iA, iB; uniform float uTime; varying vec4 vC; varying vec2 vQ; varying vec3 vW;
      void main(){ float tau = fract(uTime * iB.x + iB.y), ph = iB.y * 37.;
        vec3 c = iA.xyz + vec3(iB.w * sin(tau * 5. + ph) * tau, iA.w * tau, iB.w * cos(tau * 4. + ph * 1.3) * tau);
        vec3 toE = normalize(cameraPosition - c + vec3(0., 0., 1e-4)), rt = normalize(cross(vec3(0., 1., 0.), toE) + vec3(1e-5, 0., 0.)), upv = cross(toE, rt);
        float s = iB.z * (.35 + 1.1 * tau); vQ = position.xy; vC = vec4(1., 1., 1., sin(3.14159 * tau) * .2); vW = c;
        gl_Position = projectionMatrix * viewMatrix * vec4(c + (rt * position.x + upv * position.y) * s, 1.); }`,
    fragmentShader: GLSL_CITY + /* glsl */`varying vec4 vC; varying vec2 vQ; varying vec3 vW; void main(){ float r = clamp(length(vQ) * 2., 0., 1.); float a = (1. - r * r); a = a * a * vC.a * (.55 + .45 * vn2(vQ * 3. + vW.xz));
      vec3 E = vW - cameraPosition; float dist = length(E); vec3 col = vec3(.5, .48, .52) * (skyC(vec3(0., 1., 0.), 5.) * uAmbK * 1.4 + lampAt(vec3(vW.x, 3., vW.z), 2.) * 1.2 + uSunCol * .25);
      gl_FragColor = vec4(fogged(col, E / max(dist, 1e-4), dist), a); }` });
  return { people, birds, smoke };
}
// a plain small figure 1.75 m tall: a long robe, shoulders, two arms, a head without a face (its front toward +z)
export function personGeometry() { return personGeo().build(); }
export function personGeo() {
  const g = new Geo(), c = [1, 1, 1], d = [0.82, 0.82, 0.82];
  g.lathe(0, 0, 0, [[0.27, 0], [0.24, 0.55], [0.17, 1.02], [0.23, 1.3], [0.08, 1.45]], 5, c, 0, { sz: 0.72 });
  for (const sg of [-1, 1]) g.limb([0.22 * sg, 1.33, 0], [0.27 * sg, 0.8, 0.14], 0.065, 0.045, d, 0, 0, 3);
  g.lathe(0, 1.44, 0, [[0, 0], [0.115, 0.1], [0.11, 0.2], [0, 0.31]], 5, c);
  return g;
}
// where a walker is at clock t: the same law as the shader's (wk: x, z, a, b, w, yaw, ph)
export function walkerAt(wk, t, out) {
  const tau = wk.w * t + wk.ph * TAU, ox = wk.a * Math.cos(tau), oz = wk.b * Math.sin(tau), c = Math.cos(wk.yaw), s = Math.sin(wk.yaw);
  out[0] = wk.x + ox * c + oz * s; out[1] = wk.z - ox * s + oz * c; return out;
}
// a bird 1 m across the wings (scaled by the instance): two wings and a body, the wings' span along x, the beak toward +z
export function birdGeometry() {
  const g = new Geo(), c = [1, 1, 1];
  g.face([[0, 0, 0.16], [0.5, 0, -0.1], [0.12, 0, -0.08]], c); g.face([[0, 0, 0.16], [-0.12, 0, -0.08], [-0.5, 0, -0.1]], c);
  g.face([[0, 0.02, 0.28], [0.07, 0, -0.08], [0, 0.02, -0.3]], c); g.face([[0, 0.02, 0.28], [0, 0.02, -0.3], [-0.07, 0, -0.08]], c);
  return g.build();
}
export function quadGeometry() { return new THREE.PlaneGeometry(1, 1); }

// ------------------------------------------------------------------ the silver dome: five makes, any size, with a finial
// a smooth curve through a few [r, y] points, resampled to n rings (Catmull-Rom)
function resample(pts, n) {
  const out = [], m = pts.length - 1;
  for (let k = 0; k <= n; k++) {
    const t = k / n * m, i = Math.min(m - 1, Math.floor(t)), f = t - i, p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(m, i + 2)];
    const cr = (a, b, c, d) => 0.5 * (2 * b + (c - a) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (3 * b - 3 * c + d - a) * f * f * f);
    out.push([Math.max(0, cr(p0[0], p1[0], p2[0], p3[0])), cr(p0[1], p1[1], p2[1], p3[1]), 0.93 + 0.12 * k / n]);
  }
  out[n][0] = pts[m][0]; return out;
}
export const DOME_MAKES = ['onion', 'shallow', 'ribbed', 'stepped', 'five'];
const SHELLS = {
  onion: [[0.84, 0], [0.97, 0.22], [1, 0.48], [0.93, 0.78], [0.72, 1.08], [0.44, 1.36], [0.2, 1.58], [0.06, 1.76], [0, 1.92]],
  shallow: [[1, 0], [0.97, 0.14], [0.87, 0.3], [0.68, 0.45], [0.4, 0.56], [0.14, 0.61], [0, 0.62]],
  ribbed: [[1, 0], [0.99, 0.2], [0.93, 0.45], [0.8, 0.7], [0.58, 0.92], [0.3, 1.07], [0.1, 1.14], [0, 1.17]],
  stepped: [[1, 0], [1, 0.16], [0.96, 0.26], [0.74, 0.3], [0.74, 0.46], [0.69, 0.56], [0.47, 0.6], [0.47, 0.76], [0.4, 0.9], [0.22, 1.04], [0, 1.12]],
};
// the finial: plain spikes, balls and invented shapes (never a sign of any faith)
function finial(g, x, y, z, f, kind, col) {
  const P = kind === 0 ? [[0.16, 0], [0.5, 0.45], [0.16, 0.9], [0.3, 1.25], [0.08, 1.6], [0.05, 2.6], [0, 3.2]]
    : kind === 1 ? [[0.2, 0], [0.55, 0.5], [0.2, 1], [0.1, 1.3], [0.42, 1.75], [0.1, 2.2], [0.24, 2.5], [0, 2.95]]
      : [[0.14, 0], [0.34, 0.3], [0.12, 0.7], [0.62, 1.3], [0.12, 1.9], [0.05, 2.3], [0, 3]];
  g.lathe(x, y, z, P.map((p) => [p[0] * f, p[1] * f]), f > 1.2 ? 7 : 5, col, M.gold);
  return [y + P[P.length - 1][1] * f, 0.62 * f];
}
// makeDome(g, o): o = { x, z, y0 (where its drum stands), R, make, rng, tint }. Returns what the world needs to test and
// to bake it: { x, z, R, y0, top (the finial's tip), shellTop, prof: [[r, y], ...] the outline from the outside in, kids }
export function makeDome(g, o) {
  const { x, z, y0, R, make, rng } = o, tint = o.tint || [1, 1, 1], silver = [COL.silver[0] * tint[0], COL.silver[1] * tint[1], COL.silver[2] * tint[2]];
  const stone = o.stone || COL.stone2, fk = rng.int(0, 2), gold = mixc(COL.gold, COL.worn, rng.range(0, 0.6));
  if (make === 'five') {
    // a square podium, one dome in the middle and four small ones at the corners
    const hp = R * 0.22, kids = [], inner = rng.pick(['onion', 'ribbed', 'onion']), yaw = o.yaw || 0, c = Math.cos(yaw), s = Math.sin(yaw);
    g.box(x, y0, z, R * 0.98, hp, R * 0.98, yaw, stone, M.stone, { par: 0 });
    kids.push(makeDome(g, { ...o, y0: y0 + hp, R: R * 0.58, make: inner }));
    for (const [ax, az] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const lx = ax * R * 0.68, lz = az * R * 0.68; kids.push(makeDome(g, { ...o, x: x + lx * c + lz * s, z: z - lx * s + lz * c, y0: y0 + hp, R: R * 0.27, make: 'onion' })); }
    return { x, z, R, y0, top: kids[0].top, shellTop: kids[0].shellTop, prof: [[R * 1.39, y0], [R * 1.39, y0 + hp]], kids, make, box: [R * 0.98, yaw] };
  }
  const drumH = R * (make === 'shallow' ? rng.range(0.22, 0.34) : rng.range(0.34, 0.6)), rb = R * (make === 'onion' ? 0.84 : 1), yS = y0 + drumH;
  // o.fine: a dome the route passes near is turned of twice as many faces, so that no facet shows
  const fine = !!o.fine, ribs = make === 'ribbed' ? (R > 12 ? 16 : R > 6 ? 12 : 8) : 0, segs = ribs ? ribs * (fine ? 8 : 4) : Math.max(14, Math.min(fine ? 72 : 56, Math.round(R * (fine ? 4 : 2.4) / 2) * 2));
  // the drum (pale stone, slotted) with a cornice, then the shell
  g.lathe(x, y0, z, R > 9 ? [[rb * 1.04, 0], [rb * 1.04, drumH * 0.12], [rb, drumH * 0.14], [rb, drumH * 0.9], [rb * 1.07, drumH * 0.93], [rb * 1.07, drumH]] : [[rb * 1.04, 0], [rb, drumH * 0.14], [rb, drumH * 0.9], [rb * 1.07, drumH]], Math.max(10, segs / 2), stone, M.stone, { par: R > 4 ? 2 : 0 });
  const sh = resample(SHELLS[make].map((p) => [p[0] * R, p[1] * R]), make === 'stepped' ? (R > 9 ? 20 : 14) : fine ? 24 : R > 10 ? 16 : R > 5 ? 9 : 7);
  g.lathe(x, yS, z, sh, segs, silver, M.silver, { ribs, ribAmp: 0.045, ribCol: mulc(silver, 1.12) });
  let top = yS + sh[sh.length - 1][1];
  // the outline the world tests and bakes: the drum, the shell, then the lantern (a shallow dome's) and the finial to its tip
  const prof = [[rb * 1.07, y0], [rb * 1.07, yS]]; for (const p of sh) prof.push([p[0], yS + p[1]]);
  if (make === 'shallow') {
    // a small lantern on the saucer
    const rl = R * 0.13, yl = top - R * 0.03; g.lathe(x, yl, z, [[rl, 0], [rl, rl * 1.6], [rl * 1.15, rl * 1.7]], 10, stone, M.stone);
    g.lathe(x, yl + rl * 1.7, z, resample(SHELLS.onion.map((p) => [p[0] * rl * 1.1, p[1] * rl * 1.1]), 7), 10, silver, M.silver); top += rl * 1.7 + rl * 2.0;
    prof.push([rl * 1.2, yl], [rl * 1.2, top - rl * 0.6], [0, top]);
  }
  const shellTop = top, fn = finial(g, x, top - R * 0.02, z, Math.max(0.5, R * 0.13), fk, gold); top = fn[0];
  prof.push([fn[1], shellTop - R * 0.02], [fn[1], top - fn[1]], [0, top]);
  return { x, z, R, y0, top, shellTop, prof, kids: null, make, yS, finR: fn[1] };
}

// ------------------------------------------------------------------ the bronze figures: five invented makes
// Each is a template about 1.2 units tall on its own small plinth, its front toward +z; the world scales it (2.4 to
// 7 m) and turns it to a bearing of its own. Each is human in outline, with no face, two arms and a human head; none
// has a beast's head, more than two arms, or the pose, crown, emblem or attribute of any faith's god or of a known
// work: a robed one with a staff, a winged one, a crowned one (five plain rays of uneven length, empty hands), a bearer with a
// great jar on the shoulder, and one that holds a great plain hoop overhead.
function ball(g, x, y, z, r, col, mid, par, segs = 6) { g.lathe(x, y - r, z, segs < 5 ? [[0, 0], [r, r], [0, r * 2]] : [[0, 0], [r * 0.7, r * 0.3], [r, r], [r * 0.7, r * 1.7], [0, r * 2]], segs, col, mid, { par }); }
export const FIGURE_MAKES = ['robed', 'winged', 'crowned', 'jarBearer', 'hoopBearer'];
// makeFigures(lite): the five makes; lite turns each of fewer faces (the same outline), for the figures that stand far
// from the route (the world chooses by the place each stands in, once, at the build)
export function makeFigures(lite = false) {
  const B = COL.bronze, Bd = mulc(B, 0.8), Bl = mixc(B, COL.worn, 0.35), out = [], BS = lite ? 4 : 6;
  const limb = (g, A, Bp, ra, rb, col, par = 0, sides = 5) => g.limb(A, Bp, ra, rb, col, M.bronze, par, lite ? 3 : sides);
  const body = (g, w = 1) => {
    g.box(0, 0, 0, 0.21, 0.1, 0.21, 0, Bd, M.bronze);
    g.lathe(0, 0, 0, lite ? [[0.19 * w, 0.1], [0.12 * w, 0.55], [0.165 * w, 0.76], [0.05, 0.9]] : [[0.19 * w, 0.1], [0.17 * w, 0.3], [0.12 * w, 0.55], [0.13 * w, 0.68], [0.165 * w, 0.76], [0.14 * w, 0.82], [0.055, 0.86], [0.05, 0.9]], lite ? 6 : 9, B, M.bronze, { sz: 0.78 });
  };
  const head = (g, y = 0.9) => g.lathe(0, y, 0, lite ? [[0, 0], [0.075, 0.09], [0, 0.18]] : [[0, 0], [0.06, 0.03], [0.075, 0.09], [0.06, 0.15], [0, 0.18]], lite ? 5 : 7, Bl, M.bronze, { par: 0.5 });
  { const g = new Geo(); body(g);
    g.lathe(0, 0, 0, [[0.1, 0.84], [0.115, 0.95], [0.075, 1.06], [0, 1.15]], lite ? 5 : 8, Bl, M.bronze, { par: 0.4 });
    limb(g, [0.25, 0.1, 0.06], [0.25, 1.26, 0.06], 0.014, 0.012, Bd); ball(g, 0.25, 1.3, 0.06, 0.055, Bl, M.bronze, 1, BS);
    limb(g, [0.13, 0.74, 0], [0.25, 0.63, 0.06], 0.035, 0.025, B); out.push(g); }
  { const g = new Geo(); body(g); head(g);
    for (const sg of [-1, 1]) {
      // each wing a fan of seven feathers from the shoulder, the upper ones long, with air between their tips
      const root = [0.07 * sg, 0.74, -0.08], arm = [0.3 * sg, 1.0, -0.12];
      for (let k = 0; k < 7; k++) { const a = 1.25 - k * 0.33, len = 0.62 - 0.035 * k * k * 0.5, tip = [root[0] + sg * Math.cos(a) * len * 1.1, root[1] + Math.sin(a) * len, -0.1 - 0.012 * k], a2 = a - 0.2, base = [root[0] + sg * Math.cos(a2) * len * 0.5, root[1] + Math.sin(a2) * len * 0.45, -0.09];
        if (sg > 0) g.face([root, base, tip], Bl, M.bronze, 0.3 + 0.08 * k); else g.face([root, tip, base], Bl, M.bronze, 0.3 + 0.08 * k); }
      limb(g, root, arm, 0.035, 0.02, B, 0.5, 4);
    }
    out.push(g); }
  { const g = new Geo(); body(g, 1.06); head(g);
    // (the crown: five plain rays of uneven length)
    [0.3, 0.19, 0.26, 0.16, 0.23].forEach((L, k) => { const a = TAU * k / 5 + 0.3, c = Math.cos(a), s = Math.sin(a); limb(g, [c * 0.06, 1.05, s * 0.06], [c * (0.06 + L * 0.5), 1.05 + L * 0.87, s * (0.06 + L * 0.5)], 0.02, 0, Bl, 1, 4); });
    g.lathe(0, 0, 0, [[0.05, 0.855], [0.27, 0.9], [0.05, 0.925]], lite ? 7 : 10, Bl, M.bronze, { par: 0.6 });
    // (two plain arms held a little out and down, holding nothing)
    for (const sg of [-1, 1]) limb(g, [0.14 * sg, 0.76, 0], [0.3 * sg, 0.5, 0.06], 0.034, 0.022, B, 0.3); out.push(g); }
  { const g = new Geo(); body(g); head(g);
    // the bearer: a great plain jar on one shoulder, one arm raised to steady it, the other lowered
    g.lathe(0.19, 0.84, 0, lite ? [[0.03, 0], [0.115, 0.13], [0.05, 0.3]] : [[0.03, 0], [0.09, 0.05], [0.115, 0.14], [0.085, 0.24], [0.045, 0.28], [0.065, 0.32]], lite ? 5 : 7, Bl, M.bronze, { par: 0.6 });
    limb(g, [0.13, 0.74, 0], [0.33, 0.84, 0.03], 0.032, 0.022, B, 0.3); limb(g, [0.33, 0.84, 0.03], [0.29, 1.02, 0.02], 0.022, 0.016, B, 0.3);
    limb(g, [-0.13, 0.74, 0], [-0.2, 0.42, 0.05], 0.032, 0.02, B, 0.3);
    out.push(g); }
  { const g = new Geo(); body(g, 1.04); head(g);
    // the hoop bearer: a tall robed figure that holds a great plain hoop overhead with both arms (the hoop clear of the
    // head). The hoop stands ACROSS the shoulders' line, a quarter turn about the figure's upright axis from the plane of
    // its arms (a rule of the make, every such figure alike): seen square on to the arms it is one upright bar, seen
    // from the side a ring over the head with the arms in one line; the two hands meet under its lowest point.
    const HN = lite ? 8 : 12, hr = 0.13, hy = 1.215;
    for (let k = 0; k < HN; k++) { const a0 = TAU * k / HN, a1 = TAU * (k + 1) / HN; limb(g, [0, hy + Math.sin(a0) * hr, Math.cos(a0) * hr], [0, hy + Math.sin(a1) * hr, Math.cos(a1) * hr], 0.015, 0.015, Bl, 1, 4); }
    for (const sg of [-1, 1]) { limb(g, [0.13 * sg, 0.74, 0], [0.21 * sg, 0.97, 0], 0.032, 0.022, B, 0.3); limb(g, [0.21 * sg, 0.97, 0], [0.025 * sg, hy - hr - 0.005, 0], 0.022, 0.016, B, 0.3); }
    out.push(g); }
  return out;
}

// ------------------------------------------------------------------ the food stall: a counter, posts, a striped awning, heaps, and its lamps' hang points
// makeStall(g, o): o = { x, z, yaw (its front faces local +z), w, rng, cloth (colour), lamps: 'cluster' | 'string', grill }
// Returns { lamps: [[x, y, z, cord], ...] (hang points), grill: [x, y, z] | null, r (its reach from its own middle), top }
export function makeStall(g, o) {
  const { x, z, yaw, w, rng } = o, c = Math.cos(yaw), s = Math.sin(yaw), W = (lx, y, lz) => [x + lx * c + lz * s, y, z - lx * s + lz * c];
  const wood = mulc(lin('#6a4a30'), rng.range(0.7, 1.1)), d = 1.1, hb = rng.range(3.0, 3.4), hf = hb - rng.range(0.55, 0.8), ov = 0.7;
  g.box(x, 0, z, w / 2, 0.95, d * 0.8, yaw, wood, M.stone, { topCol: mulc(wood, 1.3) });
  for (const [lx, lz, h] of [[-w / 2, -d, hb], [w / 2, -d, hb], [-w / 2, d, hf + 0.1], [w / 2, d, hf + 0.1]]) { const q = W(lx, 0, lz); g.box(q[0], 0, q[2], 0.06, h, 0.06, yaw, wood, M.stone, { top: false }); }
  // the awning (cloth: many narrow even stripes by uv.x, nine and more, each running the cloth's whole length; the stir
  // grows toward its front edge) and its hanging valance, 0.7 m clear of the front posts
  const A = W(-w / 2 - 0.25, hb, -d - 0.1), B = W(w / 2 + 0.25, hb, -d - 0.1), C = W(w / 2 + 0.25, hf, d + ov), D = W(-w / 2 - 0.25, hf, d + ov), k = g.nv, nrm = [0, 1, 0];
  const cloth = o.cloth, un = Math.max(9, Math.round((w + 0.5) / 0.36));
  g.v(A[0], A[1], A[2], 0, 1, 0, cloth, M.cloth, 0, 0, 0); g.v(B[0], B[1], B[2], 0, 1, 0, cloth, M.cloth, 0, un, 0); g.v(C[0], C[1], C[2], 0, 1, 0, cloth, M.cloth, 0.6, un, 1); g.v(D[0], D[1], D[2], 0, 1, 0, cloth, M.cloth, 0.6, 0, 1); g.quad(k, k + 3, k + 2, k + 1);
  const C2 = W(w / 2 + 0.25, hf - 0.34, d + ov), D2 = W(-w / 2 - 0.25, hf - 0.34, d + ov), k2 = g.nv, fz = [s, 0, c];
  g.v(D[0], D[1], D[2], fz[0], 0, fz[2], cloth, M.cloth, 0.5, 0, 0); g.v(C[0], C[1], C[2], fz[0], 0, fz[2], cloth, M.cloth, 0.5, un, 0); g.v(C2[0], C2[1], C2[2], fz[0], 0, fz[2], cloth, M.cloth, 1, un, 1); g.v(D2[0], D2[1], D2[2], fz[0], 0, fz[2], cloth, M.cloth, 1, 0, 1); g.quad(k2, k2 + 3, k2 + 2, k2 + 1);
  // heaps of fruit and bread on the counter
  const HEAP = [lin('#e8872a'), lin('#c7362c'), lin('#7fa53a'), lin('#d9b071'), lin('#e2c341'), lin('#8a3c6a')], nh = Math.max(2, Math.round(w / 0.95));
  for (let i = 0; i < nh; i++) { const q = W(-w / 2 + (i + 0.5) * w / nh, 0.95, rng.range(-0.2, 0.3)), r = rng.range(0.3, 0.44), hh = r * rng.range(0.7, 1.2), col = mulc(rng.pick(HEAP), rng.range(0.75, 1.05));
    g.lathe(q[0], q[1], q[2], [[r, 0], [r * 0.8, hh * 0.5], [r * 0.4, hh * 0.9], [0, hh]], 6, col, M.stone); }
  const lamps = [];
  // (its lamps hang UNDER the awning, behind its front edge: a string 0.3 m inside the edge, a cluster 0.25 to 0.85 m inside)
  if (o.lamps === 'string') { const n = Math.max(5, Math.round(w / 0.55)); for (let i = 0; i < n; i++) { const q = W(-w / 2 - 0.1 + (w + 0.2) * (i + 0.5) / n, hf - 0.36, d + ov - 0.3); lamps.push([q[0], q[1], q[2], rng.range(0.12, 0.45)]); } }
  else { const sd = rng.chance(0.5) ? 1 : -1, n = rng.int(5, 8); for (let i = 0; i < n; i++) { const a = TAU * i / n, q = W(sd * (w / 2 - 0.1) + Math.cos(a) * 0.34, hf - 0.3, d + ov - 0.55 + Math.sin(a) * 0.3); lamps.push([q[0], q[1], q[2], 0.15 + 0.42 * rng()]); } }
  let grill = null;
  if (o.grill) { const q = W((rng.chance(0.5) ? 1 : -1) * (w / 2 + 0.75), 0, 0.2); g.box(q[0], 0, q[2], 0.4, 0.8, 0.3, yaw, COL.dark, M.dark, { topCol: [1, 0.36, 0.08], topMid: M.glow, topPar: 2.2 }); grill = [q[0], 0.95, q[2]]; }
  return { lamps, grill, r: Math.hypot(w / 2 + 1.2, d + ov + 0.6), top: hb };
}

// ------------------------------------------------------------------ the tower and the golden cock
// makeTower(g, o): o = { x, z, yaw, rng }. A square tower of pale stone: a plinth, a windowed shaft, an open belfry
// with a bronze bell, a silver cap, a gold ball. Returns { perch (where the cock stands), half (its half breadth), top, levels }
export const TOWER = { half: 5.6, shaft: 36, belfry: 9, slab: 7 };
export function makeTower(g, o) {
  const { x, z, yaw, rng } = o, st = o.stone || COL.stone, h = TOWER.half, c = Math.cos(yaw), s = Math.sin(yaw), W = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  g.box(x, 0, z, h + 1.4, 3, h + 1.4, yaw, mulc(st, 0.9), M.stone);
  g.box(x, 0, z, h, TOWER.shaft, h, yaw, st, M.stone, { par: 1 + TOWER.shaft / 128 });
  g.box(x, TOWER.shaft, z, h + 1, 1.5, h + 1, yaw, mulc(st, 1.05), M.stone);
  const yb = TOWER.shaft + 1.5, yt = yb + TOWER.belfry;
  for (const [ax, az] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const q = W(ax * (h - 0.7), az * (h - 0.7)); g.box(q[0], yb, q[1], 1.15, TOWER.belfry, 1.15, yaw, st, M.stone, { top: false }); }
  g.box(x, yb, z, 2.2, TOWER.belfry, 2.2, yaw, COL.dark, M.dark, { top: false });
  g.lathe(x, yb + 2.2, z, [[3.0, 0], [2.9, 0.5], [2.2, 2.4], [1.5, 3.6], [0.6, 4.3], [0.3, 5.6]], 12, mixc(COL.bronze, COL.worn, 0.4), M.bronze, { par: 0.4 });
  g.box(x, yt, z, TOWER.slab, 1.5, TOWER.slab, yaw, mulc(st, 1.05), M.stone);
  const yc = yt + 1.5, R = 5.0, silver = mulc(COL.silver, rng.range(0.96, 1.04));
  g.lathe(x, yc, z, [[R * 0.9, 0], [R * 0.9, 2.4], [R * 0.97, 2.6]], 20, st, M.stone, { par: 2 });
  const sh = resample(SHELLS.onion.map((p) => [p[0] * R, p[1] * R]), 14); g.lathe(x, yc + 2.6, z, sh, 28, silver, M.silver);
  const yTop = yc + 2.6 + sh[sh.length - 1][1]; ball(g, x, yTop + 0.5, z, 0.95, COL.gold, M.gold, 0, 8);
  const prof = [[TOWER.slab * 1.42, 0], [TOWER.slab * 1.42, yc], [R, yc], [R, yc + 2.6]]; for (const p of sh) prof.push([p[0], yc + 2.6 + p[1]]);
  return { x, z, perch: [x, yTop + 1.4, z], half: TOWER.slab, top: yTop + 1.4, yBelfry: yb, ySlab: yc, prof };
}
// the golden cock, 7 m tall: it stands on the tower's ball, turns with the wind and crows on a round of its own.
// update(time): yaw = the wind's bearing + a slow hunting; crow(t) in 0..1 lifts the wings and throws the head back.
export function makeCock(mat, o = {}) {
  const G = COL.gold, Gd = mulc(G, 0.75), Gr = lin('#ff7a2e'), group = new THREE.Group(), mesh = (g) => { const m = new THREE.Mesh(g.build(), mat); m.frustumCulled = false; return m; };
  { const g = new Geo();
    for (const sg of [-1, 1]) { g.limb([0.5 * sg, 0, 0], [0.5 * sg, 1.7, 0.1], 0.13, 0.17, Gd, M.gold, 0, 6); g.limb([0.5 * sg, 0.05, 0], [0.5 * sg, 0.05, 0.75], 0.1, 0.03, Gd, M.gold, 0, 4); }
    g.lathe(0, 1.45, 0, [[0, 0], [0.95, 0.4], [1.35, 1.35], [0.95, 2.3], [0, 2.75]], 12, G, M.gold, { sz: 1.6 });
    // the tail: six long feathers that rise and arch back
    for (let k = 0; k < 6; k++) { const a = (k - 2.5) * 0.14, hgt = 2.6 + 1.5 * Math.sin((k + 0.5) / 6 * Math.PI), A = [a * 1.2, 3.4, -1.8], B = [a * 3.2, 3.4 + hgt * 0.75, -2.9], C = [a * 4.6, 3.4 + hgt * 0.62, -4.4 - 0.2 * k];
      g.limb(A, B, 0.2, 0.15, k % 2 ? G : Gd, M.gold, 0, 5); g.limb(B, C, 0.15, 0.02, k % 2 ? G : Gd, M.gold, 0, 5); }
    group.add(mesh(g)); }
  const neck = new THREE.Group(); neck.position.set(0, 3.5, 1.5);
  { const g = new Geo();
    g.limb([0, -0.3, -0.2], [0, 2.0, 0.5], 0.75, 0.42, G, M.gold, 0, 8); ball(g, 0, 2.3, 0.65, 0.52, G, M.gold, 0, 8);
    g.limb([0, 2.3, 1.0], [0, 2.18, 1.8], 0.2, 0, Gd, M.gold, 0, 5);
    for (let k = 0; k < 4; k++) g.limb([0, 2.68, 0.95 - 0.27 * k], [0, 3.3 - 0.04 * k, 1.0 - 0.36 * k], 0.17, 0, Gr, M.gold, 0, 4);
    g.limb([0, 1.98, 1.02], [0, 1.45, 1.1], 0.14, 0.06, Gr, M.gold, 0, 4);
    neck.add(mesh(g)); }
  group.add(neck);
  const wings = [];
  for (const sg of [-1, 1]) {
    const w = new THREE.Group(); w.position.set(1.25 * sg, 3.55, 0.35);
    const g = new Geo(), P0 = [0, 0, 0.7], P1 = [0.12 * sg, -0.25, -2.5], P2 = [0.1 * sg, -1.45, -1.3], P3 = [0, -0.9, 0.3];
    if (sg > 0) g.face([P0, P3, P2, P1], G, M.gold); else g.face([P0, P1, P2, P3], G, M.gold);
    g.limb(P0, P1, 0.16, 0.05, Gd, M.gold, 0, 4); g.limb(P3, P2, 0.1, 0.04, Gd, M.gold, 0, 4);
    w.add(mesh(g)); group.add(w); wings.push(w);
  }
  const wind = o.wind ?? 0, T = o.period ?? 19, ph = o.phase ?? 0, hunt = o.hunt ?? 0.35, hw = o.huntW ?? 0.23, hp = o.huntPh ?? 0;
  return { group, period: T,
    update(time) {
      group.rotation.y = wind + hunt * Math.sin(time * hw + hp) + 0.12 * Math.sin(time * hw * 2.7 + hp * 3);
      // the crow: a round of T seconds; it lasts 3.2 s (a rise of 0.6 s, held, a fall of 0.9 s) and comes again and again
      const x = ((time + ph * T) % T + T) % T, k = Math.min(1, Math.max(0, x / 0.6)) * Math.min(1, Math.max(0, (3.2 - x) / 0.9)), e = k * k * (3 - 2 * k);
      neck.rotation.x = -0.6 * e - 0.05 * Math.sin(time * 0.9 + hp); wings[0].rotation.z = -(0.12 + 0.95 * e); wings[1].rotation.z = 0.12 + 0.95 * e;
    } };
}

// ------------------------------------------------------------------ the sky as the materials read it
// bakeSky(colorAt, floor): the clear sky's colour for every direction (colorAt(dir, out) as the kit's dome gives it),
// kept in a small texture: across = the bearing (0.5 = toward -Z), up = 0.5 + 0.5 sign(y) sqrt(|y|) (fine near the
// horizon, where the evening's band lies); the half below the horizon holds 'floor', the tone the city sends up.
export async function bakeSky(colorAt, floor, breathe) {
  const W = 128, H = 64, data = new Uint8Array(W * H * 4), d = new THREE.Vector3(), c = new THREE.Color();
  const enc = (v) => Math.round(Math.sqrt(Math.min(4, Math.max(0, v)) / 4) * 255);
  for (let j = 0; j < H; j++) {
    const s = 2 * (j + 0.5) / H - 1, y = Math.sign(s) * s * s, ce = Math.sqrt(Math.max(0, 1 - y * y));
    for (let i = 0; i < W; i++) {
      const az = ((i + 0.5) / W - 0.5) * TAU, k = (j * W + i) * 4;
      if (y >= 0) { d.set(Math.sin(az) * ce, y, -Math.cos(az) * ce); colorAt(d, c); } else { d.set(Math.sin(az), 0.02, -Math.cos(az)).normalize(); colorAt(d, c); const f = Math.min(1, -y * 14); c.r += (floor[0] - c.r) * f; c.g += (floor[1] - c.g) * f; c.b += (floor[2] - c.b) * f; }
      data[k] = enc(c.r); data[k + 1] = enc(c.g); data[k + 2] = enc(c.b); data[k + 3] = 255;
    }
    if (breathe && j % 8 === 7) await breathe();
  }
  const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat); t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

// ------------------------------------------------------------------ THE HERO: the crystal theatre
// A round hall of glass facets on bronze ribs, 26 m in radius and 34 m to the crown of its glass roof, on five lead
// steps all round; a ring of bronze figures on its cornice; lit from within: tiers of gilt seats, two gilt balconies,
// a stage hung all round with red curtains in heavy folds and gilt hems, a painted evening sky behind whose clouds
// drift, and a great chandelier that turns slowly. Its front (the stage's far side) faces +z. opts: { U, mat (the city's uniforms and material; made here when the hall is viewed alone), figures, rng }
export const THEATRE = { R: 26, steps: 7.5, wallTop: 19.6, cornice: 21.2, top: 34, bays: 24 };
const GLASS_FRAG = GLSL_CITY + /* glsl */`
varying vec3 vW, vN, vC;
void main(){
  vec3 N = normalize(vN); vec3 E = vW - cameraPosition; float dist = length(E); vec3 V = E / max(dist, 1e-4);
  float f = 1. - abs(dot(N, V)); float fres = f * f * f; vec3 R = reflect(V, N);
  vec3 refl = mix(uFloor, skyC(R, .5), smoothstep(-.05, .05, R.y));
  float sp = h21(floor(vW.xz * .7) + floor(vW.y * .7)); float tw = .75 + .25 * sin(uTime * (1.5 + 3. * sp) + sp * 40.);
  float spk = smoothstep(.72, 1., sp);
  vec3 col = refl * (.25 + .75 * fres) * vC + vC * vec3(1., .82, .55) * uInner * (.1 + .9 * spk * tw) + pow(max(dot(R, uSunDir), 0.), 24.) * uSunCol * .8;
  gl_FragColor = vec4(fogged(col, V, dist), clamp(.05 + .75 * fres + .3 * spk, 0., 1.));
}`;
export async function buildHero(ctx, opts = {}) {
  const rng = opts.rng || ctx.rng.fork('theatre'), own = !opts.U, U = opts.U || makeUniforms(), blank = own ? U.uSky.value : null;
  if (own) {
    const hz = new THREE.Color('#ff9a5a'), zn = new THREE.Color('#6d6fb5');
    U.uSky.value = await bakeSky((d, c) => c.copy(hz).lerp(zn, Math.min(1, Math.pow(Math.max(d.y, 0), 0.45))).multiplyScalar(d.z < 0 ? 1 + 0.5 * Math.max(0, -d.z) * (1 - d.y) : 1), [0.12, 0.12, 0.15], () => ctx.yield());
  }
  const mat = opts.mat || makeCityMaterial(U), figs = opts.figures || makeFigures();
  const T = THEATRE, R = T.R, N = T.bays, object = new THREE.Group(), g = new Geo(), bronze = COL.bronze, Bl = mixc(COL.bronze, COL.worn, 0.3);
  // the lead steps all round (five risers of 0.3 m, each tread 1.1 m), the bronze base, the ring ribs and the cornice
  for (let k = 0; k < 5; k++) { const r = R + T.steps - k * 1.1, lc = mulc(COL.lead, 1.5 + 0.1 * (k % 2)); g.lathe(0, 0, 0, [[r, k * 0.3], [r, k * 0.3 + 0.3]], 64, mulc(COL.lead, 0.62), M.lead); g.lathe(0, 0, 0, [[r, k * 0.3 + 0.3], [k < 4 ? r - 1.1 : R - 1, k * 0.3 + 0.3]], 64, lc, M.lead); }
  g.lathe(0, 0, 0, [[R + 0.75, 1.5], [R + 0.75, 1.72], [R + 0.5, 1.8]], 48, Bl, M.bronze, { par: 0.5 });
  g.lathe(0, 0, 0, [[R + 0.5, 1.8], [R + 0.5, 3.0]], 48, COL.stone, M.stone, { par: 2 });
  g.lathe(0, 0, 0, [[R + 0.5, 3.0], [R + 0.7, 3.12], [R + 0.7, 3.28], [R + 0.1, 3.4]], 48, Bl, M.bronze, { par: 0.5 });
  const rowH = (T.wallTop - 3.4) / 4;
  for (let k = 1; k < 4; k++) { const y = 3.4 + k * rowH; g.lathe(0, 0, 0, [[R + 0.15, y - 0.22], [R + 0.5, y], [R + 0.15, y + 0.22]], 48, bronze, M.bronze, { par: 0.5 }); }
  g.lathe(0, 0, 0, [[R + 0.2, T.wallTop - 0.3], [R + 1.4, T.wallTop + 0.4], [R + 1.4, T.wallTop + 1.0], [R + 0.3, T.cornice]], 48, Bl, M.bronze, { par: 0.5 });
  const roof = [[R, T.cornice], [R * 0.865, 26], [R * 0.635, 30], [R * 0.35, 32.8], [0, T.top]];
  const tints = []; let ringLast = -1, ringFirst = -1;
  for (let k = 0; k < N; k++) {
    const a = TAU * k / N, c = Math.cos(a), s = Math.sin(a);
    g.limb([c * (R + 0.2), 3.2, s * (R + 0.2)], [c * (R + 0.2), T.wallTop, s * (R + 0.2)], 0.42, 0.36, bronze, M.bronze, 0.3, 4);
    if (k % 2 === 0) for (let j = 0; j < roof.length - 1; j++) g.limb([c * (roof[j][0] + 0.15), roof[j][1], s * (roof[j][0] + 0.15)], [c * (roof[j + 1][0] + 0.15), roof[j + 1][1] + 0.1, s * (roof[j + 1][0] + 0.15)], 0.3, 0.26, bronze, M.bronze, 0.4, 4);
    // the ring of figures on the cornice: one over every rib, each on a bearing of its own
    // (no two neighbours of one make: a figure dealt its neighbour's make takes the next make, round the ring)
    let fm = rng.int(0, figs.length - 1); while (fm === ringLast || (k === N - 1 && fm === ringFirst)) fm = (fm + 1) % figs.length; ringLast = fm; if (k === 0) ringFirst = fm;
    const am = a + TAU / N / 2; g.add(figs[fm], Math.cos(am) * (R + 0.75), T.wallTop + 1.0, Math.sin(am) * (R + 0.75), rng.range(0, TAU), rng.range(2.7, 3.3));
    tints.push(rng.chance(0.42) ? mixc(COL.crystal, rng.pick(COL.lamps), rng.range(0.45, 0.8)) : mulc(COL.crystal, rng.range(0.85, 1)));
  }
  // (the world's solids for the hall reach 39 m: over its finial's tip)
  finial(g, 0, T.top - 0.3, 0, 1.5, 1, COL.gold);
  await ctx.yield();
  // the glass: each bay of the wall is four facets, each facet a low four-sided point; the roof the same, to the crown
  const gp = [], gn = [], gc = [];
  const tri = (A, B, C, col) => { const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
    if (nx * A[0] + nz * A[2] + ny * (A[1] - 8) < 0) { nx = -nx; ny = -ny; nz = -nz; }
    for (const P of [A, B, C]) { gp.push(P[0], P[1], P[2]); gn.push(nx / l, ny / l, nz / l); gc.push(col[0], col[1], col[2]); } };
  const facet = (P00, P10, P11, P01, push, col) => { const C = [0, 1, 2].map((i) => (P00[i] + P10[i] + P11[i] + P01[i]) / 4), l = Math.hypot(C[0], C[2]) || 1; C[0] += C[0] / l * push; C[2] += C[2] / l * push; C[1] += push * 0.3;
    tri(P00, P10, C, col); tri(P10, P11, C, col); tri(P11, P01, C, col); tri(P01, P00, C, col); };
  const ringPt = (r, y, k) => { const a = TAU * k / N; return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  for (let k = 0; k < N; k++) {
    for (let j = 0; j < 4; j++) { const y0 = 3.4 + j * rowH, y1 = y0 + rowH, col = rng.chance(0.3) ? tints[k] : rng.chance(0.25) ? mixc(COL.crystal, rng.pick(COL.lamps), 0.5) : mulc(COL.crystal, rng.range(0.8, 1)); facet(ringPt(R, y0, k), ringPt(R, y0, k + 1), ringPt(R, y1, k + 1), ringPt(R, y1, k), 0.75, col); }
    for (let j = 0; j < roof.length - 2; j++) facet(ringPt(roof[j][0], roof[j][1], k), ringPt(roof[j][0], roof[j][1], k + 1), ringPt(roof[j + 1][0], roof[j + 1][1], k + 1), ringPt(roof[j + 1][0], roof[j + 1][1], k), 0.5, rng.chance(0.3) ? tints[k] : mulc(COL.crystal, rng.range(0.8, 1)));
    const j = roof.length - 2; tri(ringPt(roof[j][0], roof[j][1], k), ringPt(roof[j][0], roof[j][1], k + 1), [0, T.top, 0], mulc(COL.crystal, rng.range(0.85, 1)));
  }
  const glassGeo = new THREE.BufferGeometry(); glassGeo.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); glassGeo.setAttribute('normal', new THREE.Float32BufferAttribute(gn, 3)); glassGeo.setAttribute('color', new THREE.Float32BufferAttribute(gc, 3));
  const glassMat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, vertexColors: true, side: THREE.DoubleSide,
    vertexShader: 'varying vec3 vW, vN, vC; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vC = color; gl_Position = projectionMatrix * viewMatrix * w; }', fragmentShader: GLASS_FRAG });
  const glass = new THREE.Mesh(glassGeo, glassMat); glass.renderOrder = 3; glass.name = 'theatre-glass';
  await ctx.yield();
  // the small figures of the boxes: the people's own shape, lit as the hall's inside is (they give their own dim light)
  const person = personGeo(); for (let k = 0; k < person.m.length; k += 2) { person.m[k] = M.glow; person.m[k + 1] = 0.9; }
  return finishHero(ctx, { object, g, glass, mat, U, own, rng, tints, person });
}
// the hall's inside (all of it gives its own light), the chandelier, and what the world needs back
async function finishHero(ctx, h) {
  const { object, g, glass, mat, U, own, rng, tints } = h, T = THEATRE, R = T.R, gilt = [1.0, 0.7, 0.22], red = [0.42, 0.06, 0.05];
  const a0 = -40 * Math.PI / 180, a1 = 220 * Math.PI / 180;
  g.lathe(0, 0, 0, [[R - 0.4, 1.56], [0, 1.56]], 40, [0.3, 0.1, 0.07], M.glow, { par: 0.55 });
  // eight raked rows of gilt seats round the pit, open toward the stage (local -z)
  for (let k = 0; k < 8; k++) {
    const r = 8 + 2.1 * k, y = 1.6 + 0.75 * k;
    g.lathe(0, 0, 0, [[r - 0.55, y, 0.3], [r - 0.5, y + 0.55, 1], [r - 0.2, y + 1.1, 1.15], [r + 0.12, y + 1.1, 1.15], [r + 0.3, y + 0.5, 0.75], [r + 0.9, y + 0.48, 0.3], [r + 1.55, y + 0.75, 0.3]], 44, gilt, M.seat, { par: 1.05, a0, a1 });
  }
  // two gilt balconies under the glass, on slim gilt posts
  for (const yb of [9.4, 14.2]) {
    g.lathe(0, 0, 0, [[R - 0.6, yb, 0.5], [R - 2.6, yb, 0.5], [R - 2.7, yb + 0.25, 1.1]], 44, gilt, M.glow, { par: 0.8, a0, a1 });
    g.lathe(0, 0, 0, [[R - 2.7, yb + 0.25, 1.1], [R - 2.7, yb + 1.15, 1.2]], 44, gilt, M.seat, { par: 1.15, a0, a1 });
    g.lathe(0, 0, 0, [[R - 2.8, yb + 1.15, 1.3], [R - 2.8, yb + 1.32, 1.3], [R - 2.5, yb + 1.32, 1.3]], 44, gilt, M.glow, { par: 1.25, a0, a1 });
    // a few small figures in the boxes, their backs to the glass, each turned a little its own way (they only stand)
    for (let k = 0, n = rng.int(5, 8); k < n; k++) { const a = a0 + (a1 - a0) * rng.range(0.04, 0.96), rr = R - 1.6, tone = rng.range(0.28, 0.5), cl = mixc([tone, tone * 0.8, tone * 0.7], rng.pick(COL.lamps), 0.25);
      g.add(h.person, Math.cos(a) * rr, yb, Math.sin(a) * rr, Math.atan2(-Math.cos(a), -Math.sin(a)) + rng.range(-0.5, 0.5), 1, 1, cl); }
    for (let k = 0; k < 13; k++) { const a = a0 + (a1 - a0) * k / 12; g.limb([Math.cos(a) * (R - 2.5), yb - 4.6, Math.sin(a) * (R - 2.5)], [Math.cos(a) * (R - 2.5), yb, Math.sin(a) * (R - 2.5)], 0.16, 0.14, gilt, M.glow, 0.8, 5); }
  }
  // the stage: boards, a gilt frame, and the painted evening sky behind (its clouds drift in the shader); all its
  // hangings are red curtains in heavy folds with a gilt hem: the house curtain drawn back to the two sides behind
  // the frame's columns, a short pleated one under the frame's beam, the wings at either hand, and the curtain that
  // closes the stage behind the painted sky (so that the stage seen from behind, through the glass, is a curtain too).
  // curtain: a strip hung along a way on the floor (from A to B, each [x, z]) from y1 down to y0, one fold to every
  // 'per' metres and 0.3 m deep; the folds' ridges give the hall's light back, their hollows lie in their own shade
  // (the hall's inside gives its own light: the shade is in the strip's own brightness); its lowest 0.42 m is the hem.
  const curtain = (A, B, y0, y1, per = 1.25, hem = 0.42) => {
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(2, Math.round(L / per)) * 2, tx = (B[0] - A[0]) / L, tz = (B[1] - A[1]) / L, k0 = g.nv;
    for (let i = 0; i <= n; i++) { const d = i % 2 ? 0.3 : 0, x = A[0] + tx * L * i / n - tz * d, z = A[1] + tz * L * i / n + tx * d, pr = i % 2 ? 0.34 : 1.08;
      g.v(x, y1, z, -tz, 0, tx, red, M.glow, pr * 0.82); g.v(x, y0 + hem, z, -tz, 0, tx, red, M.glow, pr); g.v(x, y0 + hem, z, -tz, 0, tx, gilt, M.glow, pr * 0.95 + 0.1); g.v(x, y0, z, -tz, 0, tx, gilt, M.glow, pr * 0.8 + 0.1); }
    for (let i = 0; i < n; i++) { const a = k0 + i * 4, b = a + 4; g.quad(a, a + 1, b + 1, b); g.quad(a + 2, a + 3, b + 3, b + 2); }
  };
  g.box(0, 1.56, -17.5, 9.6, 1.3, 5.5, 0, [0.5, 0.3, 0.14], M.glow, { par: 0.7, topPar: 0.9, topCol: [0.62, 0.4, 0.2] });
  g.face([[-9.6, 2.9, -22.6], [9.6, 2.9, -22.6], [9.6, 13.2, -22.6], [-9.6, 13.2, -22.6]], [rng(), 1, 1], M.paint, 0.9, [[0, 0], [19.2, 0], [19.2, 10.3], [0, 10.3]]);
  curtain([9.8, -23.1], [-9.8, -23.1], 1.58, 13.4, 1.6);
  curtain([-9.4, -12.95], [9.4, -12.95], 11.9, 13.5, 1.6, 0.3);
  for (const sg of [-1, 1]) {
    g.limb([sg * 10.2, 1.56, -12.2], [sg * 10.2, 13.6, -12.2], 0.62, 0.52, gilt, M.glow, 1.15, 8);
    curtain([sg * 10.2, -12.7], [sg * 13.4, -16.5], 1.58, 13.2, 1.25);
    curtain([sg * 13.4, -16.5], [sg * 9.8, -23.1], 1.58, 13.2, 1.5);
    curtain([sg * 9.5, -13.5], [sg * 5.3, -13.5], 2.86, 12.2, 1.05);
  }
  g.box(0, 13.5, -12.2, 11.2, 1.4, 0.7, 0, gilt, M.glow, { par: 1.15, topPar: 1.15, bottom: true });
  const shell = new THREE.Mesh(await g.buildSlow(() => ctx.yield()), mat); shell.name = 'theatre'; object.add(shell);
  await ctx.yield();
  // the chandelier: three rings of drops under a hub, hung from the crown; it turns slowly on the world's clock
  const cg = new Geo(), white = [1, 0.86, 0.6];
  cg.limb([0, 0, 0], [0, 9, 0], 0.09, 0.09, [0.9, 0.7, 0.3], M.glow, 0.9, 5);
  for (const [r, y, n] of [[4.6, 0.6, 18], [3.1, -1.1, 14], [1.6, -2.6, 10]]) {
    cg.lathe(0, y, 0, [[r - 0.14, 0], [r, 0.14], [r + 0.14, 0], [r, -0.14], [r - 0.14, 0]], 28, [1, 0.74, 0.3], M.glow, { par: 1.2 });
    for (let i = 0; i < n; i++) { const a = TAU * i / n, c = Math.cos(a), s = Math.sin(a); cg.limb([c * r, y + 0.5, s * r], [c * r, y - 1.0, s * r], 0.2, 0.02, white, M.glow, 3.2, 4); if (i % 2 === 0) cg.limb([c * r, y, s * r], [c * r * 0.2, y + 2.2, s * r * 0.2], 0.05, 0.05, [1, 0.74, 0.3], M.glow, 1.0, 4); }
  }
  ball(cg, 0, -4.2, 0, 0.9, white, M.glow, 3.0, 8);
  const chand = new THREE.Mesh(cg.build(), mat); chand.position.set(0, 23.5, -1); chand.name = 'chandelier'; object.add(chand);
  object.add(glass);
  const spin = { w: rng.range(0.1, 0.16) * (rng.chance(0.5) ? 1 : -1), ph: rng.range(0, TAU) };
  return {
    object, radius: R + T.steps, height: T.top + 4.5, center: new THREE.Vector3(0, 13, 0), tints,
    anchors: { stage: new THREE.Vector3(0, 7, -17), crown: new THREE.Vector3(0, T.top, 0), hall: new THREE.Vector3(0, 10, 0) },
    update(dt, time) { chand.rotation.y = spin.ph + spin.w * time; if (own) U.uTime.value = time; },
    // (the hall viewed alone made its own uniforms: it frees the stand-in and its own baked sky; within the city the world frees them)
    dispose() { if (own) { blank.dispose(); U.uSky.value?.dispose?.(); } }, ground: true, groundY: 0,
  };
}
