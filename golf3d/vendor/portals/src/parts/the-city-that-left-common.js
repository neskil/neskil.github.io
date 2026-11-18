// THE CITY THAT LEFT, shared by every part: the frame, the shape of the bedrock lens (keel) and of the hole it came
// out of (one function, so the hole is the keel's mould), the light everything of ours is shaded with, and GLSL.
//
// FRAMES
//   world        Y up, metres. Entry heading -Z, +X right. The CITY stands still in world space for the whole flight.
//   hero-local   origin at the keel's lowest point under the city centre: world = local + HERO. Street level is local
//                y = STREET (90); the rim circle has radius RIM (220).
//   land-local   x, z as in the world; y = 0 is the valley floor. The land group sits at world y = landY(u).
import * as THREE from 'three';
import { makePath } from '../kit/core.js';

export const HERO = { x: 60, y: 170, z: -520 };          // world position of the hero origin
export const RIM = 220, STREET = 90, LIP = 60;            // rim radius, then street level and the rim's underside in hero-local y
export const LAND0 = 150, LIFT = 150;                     // land level as the flight begins, and how far it sinks along the flight
export const landY = (u) => LAND0 - LIFT * Math.min(1, Math.max(0, u));
export const GLOW_AZ = -40 * Math.PI / 180;               // azimuth of the afterglow (0 = -Z, +90 = +X)
export const GLOW_DIR = [Math.sin(GLOW_AZ), -Math.cos(GLOW_AZ)];   // unit (x, z) toward the afterglow
// the street grid: the avenue runs along AVE (unit x, z) through AVE0 (hero-local), the river crosses it at AVE0
export const AVE = [Math.SQRT1_2, Math.SQRT1_2], AVE0 = [20, 3];
export const GRID_ANGLE = -Math.PI / 4, PITCH = [62, 54], STREET_W = 22;
// hero-local (x, z) -> grid (along the avenue, across it toward the south-west) and back
export const toGrid = (x, z) => { const dx = x - AVE0[0], dz = z - AVE0[1]; return [(dx + dz) * Math.SQRT1_2, (-dx + dz) * Math.SQRT1_2]; };
export const fromGrid = (a, c) => [AVE0[0] + (a - c) * Math.SQRT1_2, AVE0[1] + (a + c) * Math.SQRT1_2];

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// The lens of bedrock. under(x, z): hero-local height of the keel's underside; wallR(angle, y): radius of the cut rim
// wall. The hole in the land is the same shape 90 m lower (the street was at ground level before the lift).
export function makeKeelShape(noise) {
  const thick = (r) => { const q = clamp(r / RIM, 0, 1); return 30 + 30 * Math.pow(1 - q * q, 0.8); };
  const smoothUnder = (x, z) => STREET - thick(Math.hypot(x, z));
  // beds dip gently to the north-east; the break follows them in benches
  const bed = (x, y, z) => y + 0.11 * x - 0.07 * z;
  const rough = (x, z) => 6.5 * noise.fbm2(x * 0.011 + 3.1, z * 0.011 - 1.7, 3) + 2.6 * noise.n2(x * 0.045 + 9, z * 0.045) + 1.1 * noise.n2(x * 0.13, z * 0.13 + 5);
  const under = (x, z) => {
    const r = Math.hypot(x, z), edge = sstep(RIM - 2, RIM - 26, r);
    let y = STREET - thick(r) + rough(x, z) * (0.35 + 0.65 * edge);
    // benches: pull the surface part of the way onto the nearest bedding plane
    const b = bed(x, y, z) / 7, f = b - Math.floor(b), s = f < 0.72 ? f * 0.25 / 0.72 : 0.25 + (f - 0.72) * 0.75 / 0.28;
    y += (s - f) * 7 * 0.8 * edge;
    return Math.min(y, LIP + 6 * (1 - edge));
  };
  const wallR = (a, y) => RIM + 2.6 * noise.n2(Math.cos(a) * 9 + 20, Math.sin(a) * 9 + y * 0.07) + 1.1 * noise.n2(Math.cos(a) * 31, Math.sin(a) * 31 + y * 0.2 + 8)
    - 1.6 * sstep(STREET - 9, STREET - 2, y);                // the soil and fill at the top have fallen back a little
  return { thick, smoothUnder, under, wallR, bed };
}

// ---------------------------------------------------------------- the light, shared by every material of ours
export function makeShared() {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z), C = (h) => new THREE.Color(h);
  const u = {
    uTime: { value: 0 },
    uSunDir: { value: V3(GLOW_DIR[0], 0.14, GLOW_DIR[1]).normalize() },   // toward the afterglow, held at 8 degrees
    uSunCol: { value: C('#F0B08A').multiplyScalar(0.5) },
    uHemiSky: { value: C('#5A6480').multiplyScalar(3.4) },
    uHemiGnd: { value: C('#2a2633').multiplyScalar(2.6) },
    uFogCol: { value: C('#2A3042') }, uFogGlow: { value: C('#8C5A6E') }, uFogDen: { value: 0.0009 },
    uGlowAz: { value: new THREE.Vector2(GLOW_DIR[0], GLOW_DIR[1]) },
    uBand: { value: C('#E99A5E').multiplyScalar(1.5) },                    // the afterglow band, as wet rock and water mirror it
    uRose: { value: C('#8C5A6E').multiplyScalar(0.7) }, uSkyHi: { value: C('#0C0F17') }, uSkyLo: { value: C('#262C3C') },
    uGold: { value: C('#FFC56B') },
    uLandY: { value: LAND0 },                                             // world height of the land (the gap is read from it)
    uWet: { value: 0 }, uSnow: { value: 0 },
  };
  return { uniforms: u };
}
// pick the shared uniforms a material needs (the objects themselves, so one write reaches every material)
export const sharedU = (S, extra = {}) => Object.assign({}, S.uniforms, extra);

export const GLSL_COMMON = /* glsl */`
uniform float uTime, uFogDen, uLandY, uWet, uSnow;
uniform vec3 uSunDir, uSunCol, uHemiSky, uHemiGnd, uFogCol, uFogGlow, uBand, uRose, uSkyHi, uSkyLo, uGold;
uniform vec2 uGlowAz;
float cH(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }
float cH3(vec3 p3){ p3 = fract(p3*.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y)*p3.z); }
float cN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(cH(i), cH(i + vec2(1., 0.)), f.x), mix(cH(i + vec2(0., 1.)), cH(i + vec2(1., 1.)), f.x), f.y); }
float cN3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(mix(cH3(i), cH3(i + vec3(1., 0., 0.)), f.x), mix(cH3(i + vec3(0., 1., 0.)), cH3(i + vec3(1., 1., 0.)), f.x), f.y),
             mix(mix(cH3(i + vec3(0., 0., 1.)), cH3(i + vec3(1., 0., 1.)), f.x), mix(cH3(i + vec3(0., 1., 1.)), cH3(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
float cF(vec2 p){ return .55*cN(p) + .29*cN(p*2.03 + 17.3) + .16*cN(p*4.1 + 31.7); }
float cF3(vec3 p){ return .57*cN3(p) + .28*cN3(p*2.07 + 11.3) + .15*cN3(p*4.3 + 23.1); }
// the sky as a mirror sees it: night blue above, slate lower, the apricot band low toward the afterglow, rose above it
vec3 ctlSky(vec3 d){
  float e = clamp(d.y, -1., 1.);
  vec2 h = d.xz / max(length(d.xz), 1e-4);
  float az = clamp(dot(h, uGlowAz)*.5 + .5, 0., 1.), lobe = az*az*az;
  vec3 c = mix(uSkyLo, uSkyHi, smoothstep(0., .6, e));
  float up = max(e, 0.);
  c += uRose*lobe*exp(-up*up/(.26*.26));
  c += uBand*lobe*lobe*exp(-up*up/(.1*.1));
  return c*smoothstep(-.12, .0, e) + uHemiGnd*.4*(1. - smoothstep(-.12, 0., e));
}
// fog of the dusk air: slate, rose toward the afterglow
vec3 ctlFog(vec3 col, vec3 toPoint){
  float d = length(toPoint), f = 1. - exp(-uFogDen*uFogDen*d*d);
  vec2 h = toPoint.xz / max(length(toPoint.xz), 1e-4);
  float az = clamp(dot(h, uGlowAz), 0., 1.);
  return mix(col, mix(uFogCol, uFogGlow, az*az*az*.8), f);
}
float ctlFogF(vec3 toPoint){ float d = length(toPoint); return 1. - exp(-uFogDen*uFogDen*d*d); }
// diffuse light on a surface of ours: the hemisphere and the afterglow key (wrapped a little)
vec3 ctlLight(vec3 n){
  vec3 hemi = mix(uHemiGnd, uHemiSky, n.y*.5 + .5);
  float k = clamp((dot(n, uSunDir) + .25)/1.25, 0., 1.);
  return hemi + uSunCol*k*k;
}
`;
export const GLSL_VARY_VERT = /* glsl */`
varying vec3 vWorld; varying vec3 vLocal;
`;

// ---------------------------------------------------------------- a small mesh accumulator for props (flat-shaded)
// position, normal, color (linear albedo), emit (how strongly the vertex glows window gold; negative: a dim red)
export class Acc {
  constructor() { this.P = []; this.N = []; this.C = []; this.E = []; this.m = null; }
  set(m) { this.m = m; return this; }
  _p(p) { if (!this.m) return p; const e = this.m.elements, x = p[0], y = p[1], z = p[2]; return [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]]; }
  tri(a, b, c, col, emit = 0, eb = emit, ec = emit) {
    a = this._p(a); b = this._p(b); c = this._p(c);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    this.P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    this.N.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    for (let i = 0; i < 3; i++) this.C.push(col[0], col[1], col[2]);
    this.E.push(emit, eb, ec);
    return this;
  }
  // a, b along the bottom, c, d along the top (counter-clockwise seen from outside); e0 / e1: glow at the bottom / top edge
  quad(a, b, c, d, col, e0 = 0, e1 = e0) { this.tri(a, b, c, col, e0, e0, e1); this.tri(a, c, d, col, e0, e1, e1); return this; }
  box(cx, cy, cz, sx, sy, sz, col, emit = 0, open = '') {      // open: letters of faces to leave out (x X y Y z Z)
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    if (!open.includes('Z')) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col, emit);
    if (!open.includes('z')) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], col, emit);
    if (!open.includes('X')) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], col, emit);
    if (!open.includes('x')) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col, emit);
    if (!open.includes('Y')) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], col, emit);
    if (!open.includes('y')) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col, emit);
    return this;
  }
  // a tapered tube from p0 to p1 (any direction); caps: 0 none, 1 far end, 2 both
  cyl(p0, p1, r0, r1, seg, col, emit = 0, caps = 1, colTop = col) {
    const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2], l = Math.hypot(ax, ay, az) || 1, tx = ax / l, ty = ay / l, tz = az / l;
    let ux = Math.abs(ty) > 0.9 ? 1 : 0, uy = Math.abs(ty) > 0.9 ? 0 : 1, uz = 0;
    const d = ux * tx + uy * ty + uz * tz; ux -= d * tx; uy -= d * ty; uz -= d * tz; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
    const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux;
    const ring = (p, r, k) => { const a = (k / seg) * Math.PI * 2, c = Math.cos(a) * r, s = Math.sin(a) * r; return [p[0] + ux * c + vx * s, p[1] + uy * c + vy * s, p[2] + uz * c + vz * s]; };
    for (let k = 0; k < seg; k++) {
      const a = ring(p0, r0, k), b = ring(p0, r0, k + 1), c = ring(p1, r1, k + 1), e = ring(p1, r1, k);
      this.tri(a, b, e, col, emit); this.tri(b, c, e, colTop, emit);
      if (caps >= 1) this.tri(e, c, p1, colTop, emit);
      if (caps >= 2) this.tri(b, a, p0, col, emit);
    }
    return this;
  }
  get triangles() { return this.P.length / 9; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
    g.setAttribute('emit', new THREE.Float32BufferAttribute(this.E, 1));
    g.computeBoundingSphere();
    return g;
  }
}

// One material for every prop of ours: vertex colour, the shared light, a gold glow where `emit` says so, the dusk fog.
export function makePropMaterial(S, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: sharedU(S, { uFlick: { value: o.flicker ?? 0 }, uGain: { value: o.gain ?? 1 } }),
    side: o.side ?? THREE.FrontSide,
    vertexShader: /* glsl */`
      attribute vec3 color; attribute float emit;
      varying vec3 vWorld, vN, vCol; varying float vEmit;
      void main(){
        vec4 p = vec4(position, 1.); vec3 n = normal;
        #ifdef USE_INSTANCING
          p = instanceMatrix*p; n = mat3(instanceMatrix)*n;
        #endif
        vec4 wp = modelMatrix*p; vWorld = wp.xyz; vN = mat3(modelMatrix)*n; vCol = color; vEmit = emit;
        gl_Position = projectionMatrix*viewMatrix*wp;
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      uniform float uFlick, uGain;
      varying vec3 vWorld, vN, vCol; varying float vEmit;
      void main(){
        vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
        if (!gl_FrontFacing) n = -n;
        vec3 col = vCol*ctlLight(n)*uGain;
        float fl = 1. + uFlick*(.5*sin(uTime*9.1 + vWorld.x*.7) + .5*sin(uTime*13.7 + vWorld.z*.9))*.12;
        float e = max(vEmit, 0.), er = max(-vEmit, 0.);
        col += uGold*e*fl + vec3(1., .13, .06)*er;
        gl_FragColor = vec4(ctlFog(col, vWorld - cameraPosition), 1.);
      }`,
  });
}

// ---------------------------------------------------------------- the route (world coordinates)
// entry 24 m over the dry riverbed; down with the sinking land to the hole's edge (A); a chord under the keel to the
// west lip (B); a climbing right-hand turn round the cut rim; in over the rim at roof height (Q); the avenue; the crown
export const PATH_PTS = [
  [0, 174, 0], [0, 173, -40], [-10, 162, -110], [-30, 147, -220], [-50, 150, -329], [-88, 175, -440], [-160, 205, -520],
  [-182, 214, -553], [-187, 230, -589], [-178, 252, -624], [-156, 272, -654], [-126, 287, -672], [-96, 296, -679], [-61, 300, -658], [-26, 302, -623],
  [16, 308, -580], [52, 326, -545], [94, 350, -503], [133, 370, -464], [179, 378, -418],
];
// The rock of the keel is as the visit's noise made it, and under it the road takes its height from the rock. Its plan
// is that of the two typed legs from the hole's edge by mid-keel to the west lip (points 4, 5, 6 above: their typed
// heights are not used), with a point at every third of a leg. Every one of those points that lies under the keel
// (within the rim's radius in plan) flies KEEL_UNDER metres under the lowest rock within 12 m of it in plan: the same
// margin at every point and on every visit. The one that does not (the typed point at the hole's edge, just
// outside the rim) is no point of the road any more: the road climbs in one line from the approach's last point to
// its first point under the keel. `lower` (metres, 0 unless the world's build() finds less than its 14 m of rock
// overhead somewhere between the points) takes the whole row down.
export const KEEL_UNDER = 20;
export const routePoints = (shape, lower = 0) => {
  const lowest = (x, z) => {                                 // hero-local: the lowest rock within 12 m in plan
    let y = 1e9;
    for (let dx = -12; dx <= 12; dx += 4) for (let dz = -12; dz <= 12; dz += 4) if (dx * dx + dz * dz <= 144 && Math.hypot(x + dx, z + dz) <= RIM - 3) y = Math.min(y, shape.under(x + dx, z + dz));
    return y;
  };
  const out = [];
  PATH_PTS.forEach((p, i) => {
    if (i < 4 || i > 6) { out.push(p); return; }
    const q = PATH_PTS[Math.min(i + 1, 6)];
    for (let k = 0; k < (i < 6 ? 3 : 1); k++) {
      const x = p[0] + (q[0] - p[0]) * k / 3, z = p[2] + (q[2] - p[2]) * k / 3;
      if (Math.hypot(x - HERO.x, z - HERO.z) <= RIM) out.push([x, HERO.y + lowest(x - HERO.x, z - HERO.z) - KEEL_UNDER - lower, z]);
    }
  });
  return out;
};
export const PATH_ABOVE_RIM = 8;                          // index of the first point that is above street level
export const TOWER = { x: 128, z: 110, crown: 118 };      // hero-local centre of the crown tower, and the height of the portal above the street

// angles of a polar mesh's sectors: `base` density everywhere plus bumps [centre angle, half width, gain], so there are
// more sectors where the camera comes close
export function sectorAngles(n, base, bumps) {
  const TAU = Math.PI * 2, M = 2048, cum = new Float32Array(M + 1);
  const bump = (a, c, w) => { let d = Math.abs(a - c) % TAU; if (d > Math.PI) d = TAU - d; return 1 - sstep(w * 0.6, w, d); };
  let prev = 0;
  for (let i = 0; i <= M; i++) {
    const a = (i / M) * TAU; let d = base;
    for (const b of bumps) d += b[2] * bump(a, b[0], b[1]);
    if (i > 0) cum[i] = cum[i - 1] + (d + prev) * 0.5;
    prev = d;
  }
  const out = new Float32Array(n + 1); let j = 0;
  for (let k = 0; k <= n; k++) {
    const target = cum[M] * k / n; while (j < M - 1 && cum[j + 1] < target) j++;
    out[k] = ((j + (target - cum[j]) / Math.max(1e-9, cum[j + 1] - cum[j])) / M) * TAU;
  }
  out[n] = TAU;
  return out;
}

export const GLSL_ROCK = /* glsl */`
// bedded rock: grey beds that dip gently, thin dark shale, black coal seams, pale fresh breaks, a crisp line under every
// bed and two sets of upright joints. p: metres, in the frame the beds were laid in (the keel's own, and the hole's
// shifted by the lift, so the two halves match). dist: metres from the eye (lines widen and fade with it instead of
// shimmering). flatK: 1 on faces that lie along the beds (the belly, the hole's floor): there the same beds show as
// broad bands, the joints and the blocks' own tones all but gone. Out: wetK, facet (a small tilt for the block the point is in),
// bedF (how far up its bed the point is, 0..1: the lowest part of a slab is its broken edge).
vec3 ctlRock(vec3 p, float dist, float flatK, out float wetK, out vec3 facet, out float bedF){
  float fk = 0., soft = clamp(flatK, 0., 1.);
  // the joints wander (bent by the rock's own grain over tens of metres), so the blocks are never a regular grid
  float u1 = (p.x*.83 + p.z*.56)/6.3 + .22*cN3(p*.04) + 2.6*cN3(p*.011 + 3.), u2 = (-p.x*.42 + p.z*.9)/9.1 + .18*cN3(p*.031 + 9.) + 2.2*cN3(p*.013 + 17.);
  float blockOff = (cH(vec2(floor(u1 + .5), floor(u2 + .5))) - .5)*1.3*fk;
  float s = p.y + .11*p.x - .07*p.z + 2.6*cN3(p*.025) + .35*cN3(p*.17)*(1. - fk) + blockOff;
  float b = s/7., id = floor(b), f = fract(b), h = cH(vec2(id, 7.3)), h2 = cH(vec2(id, 91.7));
  float nsub = floor(mix(2., 5.99, h2)), fs = f*nsub, sub = floor(fs)*(1. - fk), fm = fract(fs), hs = cH(vec2(id*3.1 + sub, 4.4));
  vec3 col = mix(vec3(.07, .066, .064), vec3(.17, .158, .145), h*.55 + hs*.45);
  col = mix(col, vec3(.118, .11, .102), soft*.4);
  float lam = cN(vec2(s*2.3, 3.7 + id));
  col *= .86 + .28*lam*(1. - fk);
  float seam = step(h2, .16)*smoothstep(.74, .8, f)*(1. - smoothstep(.93, .98, f))*(1. - fk);
  col = mix(col, vec3(.012, .011, .012), seam);
  float shale = step(.6, h2)*smoothstep(.0, .05, f)*(1. - smoothstep(.12, .2, f))*(1. - fk);
  col = mix(col, col*.5, shale);
  float fresh = smoothstep(.5, .75, cF3(p*.045 + 11.));
  col = mix(col, vec3(.23, .21, .19)*(.85 + .3*lam), fresh*.45*(1. - seam));
  float w = .011 + dist*.0004, kw = clamp(.02/w, 0., 1.);
  float ln = 1. - smoothstep(0., w, min(f, 1. - f)), ln2 = (1. - smoothstep(0., w*nsub*.7, min(fm, 1. - fm)))*(1. - fk);
  col *= 1. - (.62*ln + .3*ln2)*kw*(1. - .45*soft);
  float j1 = u1 + (h*9. + sub*3.7)*(1. - fk), j2 = u2 + (h2*5. + sub*1.3)*(1. - fk);
  float c1 = floor(j1), wj = .007 + dist*.0003, open1 = step(.3, cH(vec2(c1, id + sub)));
  float jl = min(abs(fract(j1) - .5)*open1 + (1. - open1), abs(fract(j2) - .5)*1.4);
  float joint = (1. - smoothstep(0., wj, jl))*clamp(.014/wj, 0., 1.);
  col *= 1. - .55*joint*(1. - .8*soft);
  float c1b = floor(j1 + .5), c2b = floor(j2 + .5);
  facet = vec3(cH(vec2(c1b, id + sub*.37)), cH(vec2(c2b + 3., id + sub*.61)), cH(vec2(c1b + c2b*7., id + 5.))) - .5;
  facet *= 1. - .75*soft;
  col *= mix(.88 + .3*cH(vec2(c1b*3. + c2b, id + sub)), 1.03, soft*.85);
  col *= .9 + .2*cN3(p*.9);
  // close to, a broken bed is not smooth: pits and ribs a metre or two across, easing out with distance
  float nearK = 1. - smoothstep(30., 140., dist);
  float g0 = cF3(p*.6 + 5.), gx = cF3(p*.6 + vec3(.2, 0., 0.) + 5.), gz = cF3(p*.6 + vec3(0., 0., .2) + 5.);
  col *= 1. + (g0 - .5)*.8*nearK;
  facet += vec3(gx - g0, 0., gz - g0)*6.*nearK;
  wetK = smoothstep(.42, .7, cF3(p*vec3(.06, .02, .06) + 31.)) + .5*seam + .3*joint;
  bedF = f;
  return col;
}
`;

// ---------------------------------------------------------------- clearance from the route
// The camera's route sampled in even steps of metres (3 m). Everything that hangs, falls, stands or flies near the
// route is tested against these samples in build(), on the visit's own layout, and the answer decides whether the
// thing goes there, is moved, or is left out. Three frames: world, hero-local (the town stands still) and land-local
// (the land is lower the further along the route the eye is, so each sample meets the land where it is by then).
export function makeRouteProbe(step = 3, pts = PATH_PTS) {
  const route = makePath(pts), n = Math.ceil(route.length / step), W = new Float32Array((n + 1) * 3), L = new Float32Array(n + 1), q = new THREE.Vector3();
  for (let i = 0; i <= n; i++) { route.posAtDist(route.length * i / n, q); W[i * 3] = q.x; W[i * 3 + 1] = q.y; W[i * 3 + 2] = q.z; L[i] = landY(i / n); }
  // the samples sorted into 24 m squares of the plan, so that a test looks only at the samples that could matter
  const C = 24, cells = new Map();
  for (let i = 0; i <= n; i++) { const k = Math.floor(W[i * 3] / C) + ',' + Math.floor(W[i * 3 + 2] / C); let c = cells.get(k); if (!c) cells.set(k, c = []); c.push(i); }
  const free = (x, y, z, land, m) => {
    const m2 = m * m, x0 = Math.floor((x - m) / C), x1 = Math.floor((x + m) / C), z0 = Math.floor((z - m) / C), z1 = Math.floor((z + m) / C);
    for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
      const c = cells.get(cx + ',' + cz); if (!c) continue;
      for (const i of c) { const dx = W[i * 3] - x, dy = W[i * 3 + 1] - y - (land ? L[i] : 0), dz = W[i * 3 + 2] - z; if (dx * dx + dy * dy + dz * dz < m2) return false; }
    }
    return true;
  };
  const probe = {
    route, samples: n + 1, step: route.length / n,
    world: (p, m) => free(p[0], p[1], p[2], false, m),
    hero: (p, m) => free(p[0] + HERO.x, p[1] + HERO.y, p[2] + HERO.z, false, m),
    land: (p, m) => free(p[0], p[1], p[2], true, m),
    // a straight run from a to b, tested every 5 m at most (frame: 'world', 'hero' or 'land')
    line: (frame, a, b, m) => {
      const k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 5));
      for (let i = 0; i <= k; i++) { const t = i / k; if (!probe[frame]([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], m)) return false; }
      return true;
    },
    // a fall as the fall shader bends it: from its lip outward at a steady speed and down as the square of the way
    // (hero-local or land-local); tested every 5 m of drop at most, down to the share of it that can be seen
    fall: (frame, top, dir, out, len, m, seen = 0.9) => {
      const k = Math.max(2, Math.ceil(len * seen / 5));
      for (let i = 0; i <= k; i++) { const t = Math.sqrt(i / k) * seen; if (!probe[frame]([top[0] + dir[0] * out * t, top[1] - len * t * t, top[2] + dir[1] * out * t], m)) return false; }
      return true;
    },
  };
  return probe;
}

// ---------------------------------------------------------------- the visit's streams
// Every stream of the generator this world draws from, in one fixed list: one for each kind of thing. The world
// takes them all as the first thing build() does, before any loop runs. Each is a named stream of its own, made
// from the visit's seed and the kind's name: it draws nothing from any parent, so a loop whose count of draws
// depends on the route or the land (a test that leaves things out) can never move another kind's draws, and a
// kind added to the list later moves none of the others.
export const FORKS = [
  'visit', 'clock',
  // the town on top (parts/-town.js)
  'city', 'tower', 'mill', 'lots', 'tram0', 'tram1', 'tramStart', 'townTrees', 'townTreeGeo', 'townScatter', 'roofThings',
  // the keel's roots, what hangs from it, what falls from it, what rises from the roofs (parts/the-city-that-left.js)
  'subwayLines', 'bellyMouths', 'lining', 'caissons', 'piles', 'stubs', 'trains', 'rimPiers',
  'ladders', 'stubPipes', 'pipes', 'cables', 'treeRoots',
  'riverFall', 'mains', 'drips',
  'smoke', 'steam', 'flags', 'towerFlags',
  // the land it leaves (parts/-landprops.js)
  'poplars', 'hedgeOaks', 'willows', 'orchardRows', 'poplarGeo', 'oakGeo', 'willowGeo', 'orchardGeo', 'landScatter',
  'pylonCables', 'cutWires', 'holeLining', 'galleries', 'sagging', 'landFall',
  // the sky (parts/-sky.js)
  'sky', 'skyCities',
  // what lives and moves (parts/-life.js)
  'rimPeople', 'roofPeople', 'belvedere', 'kerbs', 'fencePeople', 'roadPeople',
  'stones', 'geese', 'swifts', 'swifts1', 'swifts2', 'roofFlock', 'crownFlock', 'paceFlock', 'crows', 'cows', 'dust', 'motes',
];
export function makeForks(ctx) { const F = {}; for (const k of FORKS) F[k] = ctx.core.makeRng(ctx.core.hashSeed(k + ':' + ctx.seed)); return F; }
