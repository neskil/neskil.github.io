// BLUE SAILS ON A DRY SEA: the hero set piece. One sand ship: a crescent hull of tarnished bronze carried on two
// long runners, one raked mast, and a tall sail that is half cloth and half lit blue smoke, with pennants at the
// masthead, a rose plume hissing off each runner and a small masked crew. makeFleet() builds any number of them as
// instanced draws (hulls, sails, vapour, pennants, plumes, crew) that run north along fixed lanes as a pure
// function of the flight's progress; buildHero() is a fleet of one, under way.
//
// This file also holds what every other file of the world shares: BS_NOISE / BS_COMMON (noise, the world's three
// lights as a function, fog), makeShared() (one set of uniform objects), the mesh accumulator and the figure.
import * as THREE from 'three';

export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
export const skyDir = (el, az) => { const e = el * Math.PI / 180, a = az * Math.PI / 180; return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); };

// ---------------------------------------------------------------- shared GLSL
export const BS_NOISE = /* glsl */`
float bsH(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.x); }
float bsH1(float n){ return fract(sin(n*12.9898)*43758.5453); }
float bsN(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(bsH(i), bsH(i + vec2(1.,0.)), f.x), mix(bsH(i + vec2(0.,1.)), bsH(i + vec2(1.,1.)), f.x), f.y);
}
float bsF2(vec2 p){ return 0.62*bsN(p) + 0.38*bsN(p*2.07 + 9.1); }
float bsF3(vec2 p){ return 0.52*bsN(p) + 0.30*bsN(p*2.03 + 17.3) + 0.18*bsN(p*4.1 + 31.7); }
`;
// the light of the world as one function (hemisphere + afterglow key + moon fill) and its fog
export const BS_COMMON = /* glsl */`
uniform float uTime, uG, uRun, uTack, uPx;
uniform vec2 uWind;
uniform vec4 uFog;
uniform vec3 uKeyDir, uKeyCol, uMoonDir, uMoonCol, uSkyCol, uGndCol, uSailA, uSailB, uGold;
vec3 bsLight(vec3 N){
  vec3 L = mix(uGndCol, uSkyCol, N.y*0.5 + 0.5);
  L += uKeyCol*clamp(dot(N, uKeyDir)*0.88 + 0.12, 0.0, 1.0);
  L += uMoonCol*clamp(dot(N, uMoonDir), 0.0, 1.0);
  return L;
}
float bsFogF(float d){ float x = uFog.a*d; return 1.0 - exp(-x*x); }
vec3 bsFog(vec3 c, float d){ return mix(c, uFog.rgb, bsFogF(d)); }
`;
// where a ship is: aShip = (x and z at the start, share of our own rate, phase); aShip2 = (length of its run to its
// berth in metres (0: it lies moored), size, tint, course). uG is how far we have flown, in metres. A ship keeps its
// share of our rate until it nears its berth and slows evenly over its last metres (30 m, or two fifths of a short
// run), so each comes to rest by its own distance. course: the angle its straight course makes with north (-z),
// positive toward +x; the whole ship is turned by it.
export const BS_SHIP = /* glsl */`
vec2 bsRun(vec4 s, vec4 s2){                                   // x: metres run along its course; y: 1 under way .. 0 at rest
  float R = s2.x, B = min(30.0, 0.4*R), raw = s.z*uG;
  float t = clamp((raw - (R - B))/max(2.0*B, 1e-3), 0.0, 1.0);
  return vec2(min(raw, R - B) + B*t*(2.0 - t), (1.0 - t)*step(0.001, R));
}
vec3 bsShipAt(vec4 s, vec4 s2){ float g = bsRun(s, s2).x; return vec3(s.x + sin(s2.w)*g, 0.0, s.y - cos(s2.w)*g); }
vec3 bsTurn(vec3 p, vec4 s2){ float c = cos(s2.w), sn = sin(s2.w); return vec3(p.x*c - p.z*sn, p.y, p.x*sn + p.z*c); }
vec3 bsPut(vec3 p, vec4 s, vec4 s2){ return bsShipAt(s, s2) + bsTurn(p, s2)*s2.y; }
float bsShipRun(vec4 s, vec4 s2){ return bsRun(s, s2).y; }
float bsShipSlack(vec4 s, vec4 s2){ float r = fract(s.w*0.61803); return smoothstep(0.15 + 0.3*r, 0.65 + 0.3*r, 1.0 - bsRun(s, s2).y); }
// a point of the sail in ship space: s from the luff (mast) to the leech, h from foot to peak
vec3 bsSail(float s, float h, float slack, float ph){
  vec3 base = mix(vec3(0.0, 3.3, -1.55), vec3(0.0, 23.6, 0.95), h);
  float chord = 11.0*(1.0 - 0.86*pow(max(h, 1e-4), 1.7));
  float ang = uTack*(mix(0.85, 1.22, slack) + slack*0.2*sin(uTime*0.8 + ph));
  vec3 along = vec3(sin(ang), 0.07, cos(ang));
  vec3 fwd = vec3(uTack*cos(ang), 0.0, -uTack*sin(ang));
  float gust = 0.86 + 0.14*sin(uTime*0.7 + ph + h*2.2);
  float belly = sin(3.1416*pow(max(s, 1e-4), 0.8))*(0.35 + 0.65*sin(3.1416*clamp(h*0.9 + 0.05, 0.0, 1.0)));
  float flut = (0.10 + 0.55*slack)*s*sin(9.0*s + h*7.0 - uTime*(4.0 + 2.5*slack) + ph) + 0.5*slack*s*sin(4.0*h - uTime*2.1 + ph*2.0);
  return base + along*chord*s*(1.0 - 0.07*belly) + fwd*(2.3*belly*gust*mix(1.0, 0.18, slack) + flut) - vec3(0.0, 0.8*slack*s*s, 0.0);
}
`;
// the same rule for the world's own sums: how far a ship has run and how fast it still goes when we have flown D metres
export function shipRunAt(sh, D) {
  const R = sh.R ?? 0, B = Math.min(30, 0.4 * R), raw = (sh.f ?? 0) * D, t = Math.min(1, Math.max(0, (raw - (R - B)) / Math.max(2 * B, 1e-3)));
  return { s: Math.min(raw, R - B) + B * t * (2 - t), run: R > 0.001 ? 1 - t : 0 };
}

// one set of uniform objects for every material of the world
export function makeShared(o = {}) {
  const col = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
  return {
    uTime: { value: 0 }, uG: { value: 0 }, uRun: { value: 1 }, uTack: { value: o.tack ?? 1 }, uPx: { value: 0.0027 },
    uWind: { value: new THREE.Vector2((o.tack ?? 1) * 0.6, -0.8).normalize() },
    uFog: { value: new THREE.Vector4(0.1, 0.1, 0.3, o.fog ?? 0.001) },
    uKeyDir: { value: skyDir(9, -60) }, uKeyCol: { value: col('#E0A8C0', 1.3) },
    uMoonDir: { value: skyDir(30, 8) }, uMoonCol: { value: col('#BFD0FF', 0.6) },
    uSkyCol: { value: col('#5868C0', 0.62) }, uGndCol: { value: col('#8A6470', 0.45) },
    uSailA: { value: col(o.sailDeep ?? '#1C3CB0', 0.9) }, uSailB: { value: col(o.sail ?? '#3F7FE6', 1.4) },
    uGold: { value: col('#FFC46A', 1) },
  };
}

// ---------------------------------------------------------------- mesh accumulator (position, colour, glow)
export function makeAcc() { return { p: [], c: [], g: [], i: [], n: 0 }; }
export function vtx(A, x, y, z, col, glow = 0) { A.p.push(x, y, z); A.c.push(col[0], col[1], col[2]); A.g.push(glow); return A.n++; }
export function quad(A, a, b, c, d) { A.i.push(a, b, c, a, c, d); }
// rings: arrays of [x,y,z,col,glow?] of equal length; neighbouring rings are joined
export function loft(A, rings, closed = false, flip = false) {
  const m = rings[0].length, base = A.n;
  for (const r of rings) for (const v of r) vtx(A, v[0], v[1], v[2], v[3], v[4] || 0);
  const lim = closed ? m : m - 1;
  for (let j = 0; j < rings.length - 1; j++) for (let k = 0; k < lim; k++) {
    const a = base + j * m + k, b = base + j * m + (k + 1) % m, c = base + (j + 1) * m + (k + 1) % m, d = base + (j + 1) * m + k;
    if (flip) quad(A, a, d, c, b); else quad(A, a, b, c, d);
  }
}
const _t = new THREE.Vector3(), _s = new THREE.Vector3(), _u = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
// a tube along pts ([x,y,z]) with a radius per point (or one number); sx squashes it sideways
export function tube(A, pts, rad, sides, col, glow = 0, flatY = 1) {
  const rings = [];
  for (let j = 0; j < pts.length; j++) {
    const p0 = pts[Math.max(0, j - 1)], p1 = pts[Math.min(pts.length - 1, j + 1)];
    _t.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]).normalize();
    _u.set(0, 1, 0); if (Math.abs(_t.y) > 0.92) _u.set(1, 0, 0);
    _s.crossVectors(_t, _u).normalize(); _u.crossVectors(_s, _t).normalize();
    const r = typeof rad === 'number' ? rad : rad[j], ring = [], cj = typeof col[0] === 'number' ? col : col[j];
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * Math.PI * 2, cx = Math.cos(a) * r, cy = Math.sin(a) * r * flatY;
      ring.push([pts[j][0] + _s.x * cx + _u.x * cy, pts[j][1] + _s.y * cx + _u.y * cy, pts[j][2] + _s.z * cx + _u.z * cy, cj, glow]);
    }
    rings.push(ring);
  }
  loft(A, rings, true);
}
export function box(A, cx, cy, cz, sx, sy, sz, col, glow = 0) {
  const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
  const f = (pa, pb, pc, pd) => quad(A, vtx(A, ...pa, col, glow), vtx(A, ...pb, col, glow), vtx(A, ...pc, col, glow), vtx(A, ...pd, col, glow));
  f([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]); f([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
  f([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]); f([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
  f([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]); f([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
}
// a ball (lat-long), for lamps and finials
export function ball(A, cx, cy, cz, r, col, glow = 0, seg = 6, sy = 1) {
  const rings = [];
  for (let j = 0; j <= seg; j++) {
    const v = j / seg * Math.PI, ring = [];
    for (let k = 0; k < seg + 2; k++) { const a = k / (seg + 2) * Math.PI * 2; ring.push([cx + Math.sin(v) * Math.cos(a) * r, cy + Math.cos(v) * r * sy, cz + Math.sin(v) * Math.sin(a) * r, col, glow]); }
    rings.push(ring);
  }
  loft(A, rings, true, true);
}
export function finish(A, flat = false) {
  let g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(A.p, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(A.c, 3));
  g.setAttribute('aGlow', new THREE.Float32BufferAttribute(A.g, 1));
  g.setIndex(A.i);
  if (flat) g = g.toNonIndexed();
  g.computeVertexNormals();
  g.userData.triangles = A.i.length / 3;
  return g;
}

// ---------------------------------------------------------------- the ship's hull, runners, mast and tiller
const HL = 8;                                                     // half length
const sheerY = (s) => { const a = Math.abs(s); return 2.35 + 3.2 * Math.pow(a, 2.8) + (s < 0 ? 1.3 * Math.pow(a, 9) : 0.5 * Math.pow(a, 9)); };
const keelY = (s) => { const a = Math.abs(s); return 1.2 + 2.9 * Math.pow(a, 2.6) + (s < 0 ? 1.2 * Math.pow(a, 9) : 0.4 * Math.pow(a, 9)); };
const beamAt = (s) => 1.7 * Math.pow(Math.max(1 - Math.pow(Math.abs(s), 2.4), 0), 0.55) + 0.03;
export const deckY = (z) => sheerY(z / HL) - 0.32;

export function shipGeometry(detail = 1) {
  const A = makeAcc(), hi = detail > 1;
  const NS = hi ? 44 : 22, M = hi ? 16 : 8;
  const bronze = lin('#8C6B3E'), verd = lin('#3f6f5c'), bone = lin('#cfc6b4'), dark = lin('#3a3026'), pale = lin('#b89a6a'), gold = lin('#FFC46A');
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  // the crescent hull: a U section swept up to a horn at each end
  const rings = [];
  for (let j = 0; j <= NS; j++) {
    const s = j / NS * 2 - 1, z = s * HL * (1 + 0.04 * Math.abs(s)), b = beamAt(s), ys = sheerY(s), yk = keelY(s), ring = [];
    for (let k = 0; k <= M; k++) {
      const a = -Math.PI / 2 + Math.PI * k / M, ca = Math.cos(a);
      const hollow = 0.5 + 0.5 * Math.sin(j * 1.7 + k * 2.3) * Math.sin(j * 0.6 + 1.0);
      let col = mix(bronze, verd, Math.min(1, 0.15 + 0.75 * Math.pow(ca, 1.5) * hollow));
      col = mix(col, pale, 0.5 * Math.pow(1 - ca, 6));                                  // a rubbed rim along the gunwale
      ring.push([b * Math.sin(a), ys - (ys - yk) * Math.pow(ca, 0.7), z, col]);
    }
    rings.push(ring);
  }
  loft(A, rings, false, true);
  // deck of pale bone-white planks
  const deck = [];
  for (let j = 0; j <= NS; j++) {
    const s = j / NS * 2 - 1; if (Math.abs(s) > 0.86) continue;
    const z = s * HL * (1 + 0.04 * Math.abs(s)), b = Math.max(beamAt(s) - 0.1, 0.02), y = sheerY(s) - 0.32, cc = mix(bone, pale, 0.25 * (j % 2));
    deck.push([[-b, y, z, cc], [0, y + 0.05, z, mix(cc, bone, 0.5)], [b, y, z, cc]]);
  }
  loft(A, deck, false, false);
  // two long blades 6 m apart that lie along the sand, turned up at the nose like skis and run on 3 m astern of the
  // hull; the hull rides low (keel 1.2 m off the sand) on two sprung planks, one forward and one aft, as an ice yacht
  // does: each is ONE flat arc from blade to blade that passes under the keel, its tips swept 1.4 m aft. No strut
  // stands, none has a knee, none rises above the keel.
  for (const sx of [-1, 1]) {
    const pts = [], cols = [], n = hi ? 30 : 16;
    for (let i = 0; i <= n; i++) {
      const t = i / n, z = -10.6 + 22.4 * t, up = Math.max(0, 1 - t * 4.2);
      pts.push([sx * (3.0 - 0.25 * up * up), 0.26 + 2.6 * up * up * up + 0.25 * Math.pow(Math.max(0, (t - 0.9) * 10), 2), z + 1.2 * up * up]);
      cols.push(mix(dark, bronze, 0.35 + 0.3 * up));
    }
    tube(A, pts, 0.13, hi ? 6 : 4, cols, 0, 2.0);
  }
  for (const z of [-3.2, 3.0]) {
    const top = keelY(z / HL) - 0.03, arc = [], nq = hi ? 16 : 10;
    for (let j = 0; j <= nq; j++) { const q = j / nq * 2 - 1; arc.push([2.97 * q, 0.42 + (top - 0.42) * (1 - q * q), z + 1.4 * q * q]); }
    tube(A, arc, 0.3, hi ? 6 : 4, mix(bronze, dark, 0.3), 0, 0.3);
  }
  // the steering blade trails astern: a long stem from the keel abaft the after plank down to a short skate that
  // lies on the sand 3 m astern of the hull (nothing stands under the stern); and the long tiller
  tube(A, [[0, keelY(0.56) + 0.05, 4.5], [0, 0.8, 8.2], [0, 0.22, 10.2], [0, 0.16, 11.8]], [0.12, 0.11, 0.09, 0.07], 4, dark, 0, 2.2);
  tube(A, [[0, deckY(6.0) + 1.35, 6.3], [0.1, deckY(5.0) + 1.1, 5.0], [0.25, deckY(4.2) + 1.0, 4.1]], 0.06, 4, pale);
  // the mast, raked aft, and a small gold lamp on the bow horn
  const mp = [], mr = [], mc = [], mn = hi ? 10 : 5;
  for (let i = 0; i <= mn; i++) { const t = i / mn; mp.push([0, deckY(-2) + (26.2 - deckY(-2)) * t, -2 + 3.3 * t]); mr.push(0.21 - 0.14 * t); mc.push(mix(dark, bronze, 0.2 + 0.5 * t)); }
  tube(A, mp, mr, hi ? 8 : 5, mc);
  ball(A, 0, sheerY(-1) + 0.28, -HL * 1.04, 0.24, gold, 3.2, hi ? 6 : 3);
  return finish(A);
}

// ---------------------------------------------------------------- lit material shared by hulls, props and stone trim
const LIT_FS = /* glsl */`
${BS_COMMON}
uniform float uSheen, uBounce;
varying vec3 vCol, vN, vW; varying float vGlow, vSailLit;
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)); if (!gl_FrontFacing) N = -N;
  vec3 Vv = cameraPosition - vW; float d = length(Vv); vec3 V = Vv/max(d, 1e-3);
  vec3 c = vCol*bsLight(N);
  float sp = clamp(dot(reflect(-V, N), uKeyDir), 0.0, 1.0); sp *= sp; sp *= sp; sp *= sp;
  c += uKeyCol*vCol*sp*uSheen;
  c += vCol*(uKeyCol*0.5 + uSkyCol*0.3)*uBounce*clamp(0.55 - 0.45*N.y, 0.0, 1.0);          // light thrown back up by the pale sand
  c += vCol*uSailB*vSailLit*clamp(N.y*0.6 + 0.4, 0.0, 1.0);
  c += vCol*max(vGlow, 0.0);
  gl_FragColor = vec4(bsFog(max(c, 0.0), d), 1.0);
}`;
// mode 'ship': instanced by aShip / aShip2; mode 'plain': an ordinary mesh or an InstancedMesh
export function litMaterial(SH, o = {}) {
  const ship = o.mode === 'ship';
  return new THREE.ShaderMaterial({
    uniforms: { ...SH, uSheen: { value: o.sheen ?? 0 }, uSailLit: { value: o.sailLit ?? 0 }, uBounce: { value: o.bounce ?? 0 } }, side: o.side ?? THREE.DoubleSide,
    vertexShader: /* glsl */`
${BS_COMMON}
${BS_SHIP}
uniform float uSailLit;
attribute vec3 color; attribute float aGlow;
${ship ? 'attribute vec4 aShip, aShip2;' : ''}
varying vec3 vCol, vN, vW; varying float vGlow, vSailLit;
void main(){
  vec3 lp = position, n = normal;
  ${ship ? /* glsl */`
  float run = bsShipRun(aShip, aShip2);
  float tr = run*aShip.z;                                       // the hull trembles with its speed
  lp.y += tr*(0.035*sin(uTime*19.0 + aShip.w*7.0 + position.z*0.6) + 0.05*sin(uTime*3.1 + aShip.w));
  lp.x += tr*0.02*sin(uTime*23.0 + aShip.w*3.0) + 0.012*position.y*sin(uTime*1.3 + aShip.w);
  vec4 wp = vec4(bsPut(lp, aShip, aShip2), 1.0); n = bsTurn(n, aShip2);
  vSailLit = uSailLit*smoothstep(0.5, 3.5, position.y)*(0.8 + 0.2*sin(uTime*0.7 + aShip.w));
  vCol = color*(0.9 + 0.2*aShip2.z);` : /* glsl */`
  #ifdef USE_INSTANCING
  lp = (instanceMatrix*vec4(lp, 1.0)).xyz; n = mat3(instanceMatrix)*n;
  #endif
  vec4 wp = modelMatrix*vec4(lp, 1.0); n = mat3(modelMatrix)*n;
  vSailLit = uSailLit; vCol = color;`}
  vN = n; vW = wp.xyz; vGlow = aGlow;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`,
    fragmentShader: LIT_FS,
  });
}

// ---------------------------------------------------------------- the figure: a slim shape in a pale wrap with a gold mask
export function figureGeometry() {
  const A = makeAcc(), wrap = lin('#d9d2c8'), wrap2 = lin('#b9a9b4'), skin = lin('#7a5a50'), gold = lin('#FFC46A');
  tube(A, [[0, 0, 0], [0, 0.95, 0], [0, 1.17, 0], [0, 1.25, 0]], [0.27, 0.17, 0.2, 0.07], 5, [wrap2, wrap, wrap, wrap]);
  tube(A, [[0, 1.24, 0], [0, 1.33, 0], [0, 1.45, 0], [0, 1.52, 0]], [0.05, 0.1, 0.095, 0.03], 4, skin);
  // the mask: an oval of worked gold that lies round the face, 0.17 m wide (the head is 0.2) and 0.19 m high, so its
  // cheek shows from the side; it is lit as gold is and glows only weakly (0.55: the shader knows the mask by it)
  const m0 = A.n, mg = [];
  for (const v of [-1, -0.4, 0.4, 1]) { const w = Math.sqrt(1 - v * v), row = []; for (const h of [-1, -1 / 3, 1 / 3, 1]) { const a = h * w * 1.0; row.push(vtx(A, 0.104 * Math.sin(a), 1.385 + 0.095 * v, 0.104 * Math.cos(a), gold, 0.55)); } mg.push(row); }
  for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) quad(A, mg[j][k], mg[j][k + 1], mg[j + 1][k + 1], mg[j + 1][k]);
  const a0 = A.n;
  tube(A, [[0.2, 1.15, 0], [0.27, 0.72, 0.06]], [0.06, 0.04], 3, wrap);
  const a1 = A.n;
  tube(A, [[-0.2, 1.15, 0], [-0.25, 0.74, 0.08]], [0.06, 0.04], 3, wrap);
  const g = finish(A), arm = new Float32Array(A.n);
  for (let i = a0; i < a1; i++) arm[i] = 1;
  g.setAttribute('aArm', new THREE.BufferAttribute(arm, 1));
  // the mask's normals stand out from the face and look up a little, so the afterglow, the moons and the lamps catch it
  const nn = g.attributes.normal, pp = g.attributes.position; for (let i = m0; i < a0; i++) nn.setXYZ(i, pp.getX(i) * 9, 0.3, pp.getZ(i) * 9);
  return g;
}
// list: [{ x, y, z, heading, dx, dz, len, phase, f, R, fwd, arm, scale, th }] (f, R, fwd, th: aboard a ship that runs R metres on course th)
export function makeFigures(SH, list, geo = figureGeometry()) {
  const n = list.length, P = new Float32Array(n * 4), M = new Float32Array(n * 4), S = new Float32Array(n * 4), C = new Float32Array(n * 2);
  list.forEach((q, i) => {
    P.set([q.x, q.y, q.z, q.heading ?? 0], i * 4); M.set([q.dx ?? 0, q.dz ?? 0, q.len ?? 0, q.phase ?? i * 1.7], i * 4);
    S.set([q.f ?? 0, q.fwd ?? 0, q.arm ?? 0, q.scale ?? 1], i * 4); C.set([q.th ?? 0, q.R ?? 0], i * 2);
  });
  const g = instanced(geo, n, [['iPos', P, 4], ['iMove', M, 4], ['iShip', S, 4], ['iAim', C, 2]]);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...SH, uSheen: { value: 0.0 }, uBounce: { value: 0.0 } },
    vertexShader: /* glsl */`
${BS_COMMON}
${BS_SHIP}
attribute vec3 color; attribute float aGlow, aArm; attribute vec2 iAim; attribute vec4 iPos, iMove, iShip;
varying vec3 vCol, vN, vW; varying float vGlow, vSailLit;
void main(){
  float ph = iMove.w, len = iMove.z;
  vec2 rn = bsRun(vec4(0.0, 0.0, iShip.x, 0.0), vec4(iAim.y, 0.0, 0.0, 0.0));
  vec3 go = vec3(sin(iAim.x), 0.0, -cos(iAim.x))*(rn.x + iShip.y*(1.0 - rn.y));            // how far the ship under it has run; hands go forward as she slows
  vec3 p = position, n = normal;
  float raise = iShip.z*smoothstep(0.1, 0.9, sin(uTime*0.4 + ph*3.0));
  if (aArm > 0.5) { vec2 r = p.xy - vec2(0.2, 1.15); float a = raise*2.3, ca = cos(a), sa = sin(a); p.xy = vec2(0.2, 1.15) + vec2(r.x*ca - r.y*sa, r.x*sa + r.y*ca); }
  // the gold mask keeps its own size at every distance (it used to swell with distance into a plate wider than the head)
  float mk = 1.0;
  p.x += 0.035*sin(uTime*0.9 + ph)*p.y; p.z += 0.03*sin(uTime*0.6 + ph*1.3)*p.y;
  float cyc = uTime*0.45/max(len, 1.0) + ph*0.37, fr = fract(cyc), tri = abs(fr*2.0 - 1.0);
  float turn = smoothstep(0.46, 0.54, fr)*(1.0 - smoothstep(0.95, 1.0, fr));
  float hd = iPos.w + step(0.01, len)*3.1416*turn + 0.45*sin(uTime*0.27 + ph*2.0)*(1.0 - step(0.01, len)*0.7);
  float ch = cos(hd), sh = sin(hd);
  p = vec3(p.x*ch + p.z*sh, p.y, -p.x*sh + p.z*ch); n = vec3(n.x*ch + n.z*sh, n.y, -n.x*sh + n.z*ch);
  p.y += step(0.01, len)*0.02*abs(sin(uTime*2.7 + ph));
  vec3 w = iPos.xyz + p*iShip.w + vec3(iMove.x, 0.0, iMove.y)*(1.0 - tri)*len;
  w += go;
  vN = n; vW = w; vCol = color; vGlow = aGlow*(0.75 + 0.25*sin(uTime*1.1 + ph*5.0))*min(1.0, 1.4/mk + 0.3); vSailLit = step(0.001, iShip.x)*0.5;
  gl_Position = projectionMatrix*viewMatrix*vec4(w, 1.0);
}`,
    fragmentShader: LIT_FS,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return mesh;
}

export function instanced(base, count, attrs) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (const [name, arr, size] of attrs) g.setAttribute(name, new THREE.InstancedBufferAttribute(arr, size));
  g.instanceCount = count;
  return g;
}

// ---------------------------------------------------------------- the sail: cloth that is half lit smoke
function sailMaterial(SH) {
  return new THREE.ShaderMaterial({
    uniforms: SH, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
${BS_COMMON}
${BS_SHIP}
attribute vec4 aShip, aShip2;
varying vec2 vUv; varying vec4 vS; varying vec3 vW;
void main(){
  float slack = bsShipSlack(aShip, aShip2);
  vec3 wp = bsPut(bsSail(uv.x, uv.y, slack, aShip.w), aShip, aShip2);
  vW = wp; vUv = uv; vS = vec4(slack, aShip.w, aShip2.z, bsShipRun(aShip, aShip2));
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
${BS_NOISE}
varying vec2 vUv; varying vec4 vS; varying vec3 vW;
void main(){
  float s = clamp(vUv.x, 0.0, 1.0), h = clamp(vUv.y, 0.0, 1.0), slack = clamp(vS.x, 0.0, 1.0), ph = vS.y, t = uTime;
  float chord = 1.0 - 0.86*pow(max(h, 1e-4), 1.7);
  vec2 q = vec2(s*chord*3.4 + ph*7.0, h*6.5);
  // smoke that rises through the sail: two warped layers, the fine one faster
  vec2 wq = vec2(bsN(q*0.7 + vec2(0.0, -t*0.10)), bsN(q*0.7 + 5.3 + vec2(t*0.05, -t*0.08))) - 0.5;
  float n1 = bsF3(q + 1.7*wq + vec2(t*0.04, -t*0.24));
  float n2 = bsF2(q*2.2 - 1.3*wq + vec2(-t*0.07, -t*0.55) + 3.7);
  // the cloth is densest along the mast and the middle and frays into smoke at the leech, the peak and the foot
  float core = (1.0 - 0.55*pow(max(s, 1e-4), 1.6))*(1.0 - 0.4*h*h);
  float edge = (1.0 - smoothstep(0.6, 1.0, s))*smoothstep(0.0, 0.06, h)*(1.0 - smoothstep(0.84, 1.0, h))*smoothstep(0.0, 0.015, s);
  float fray = mix(0.24, 0.92, smoothstep(0.45, 1.0, s)) + 0.35*slack + 0.5*smoothstep(0.75, 1.0, h) + 0.4*(1.0 - smoothstep(0.0, 0.12, h));
  float a = clamp((core*1.25 - fray*(1.0 - n1))*1.6, 0.0, 1.0);
  a *= 0.62 + 0.38*smoothstep(0.25, 0.7, n1 + 0.5*core);                                 // thin places where the sky shows through
  a = max(a, 0.5*edge*smoothstep(0.42, 0.75, n1)*(0.4 + 0.6*core));
  a *= mix(1.0, edge, 0.85);
  // the light inside: brightest by the mast, with paler currents climbing
  float cur = smoothstep(0.38, 0.82, n2)*(0.35 + 0.65*core);
  vec3 col = mix(uSailA, uSailB, clamp(core*0.8 + 0.3*n1 - 0.1, 0.0, 1.0));
  col = mix(col, uSailB*vec3(1.2, 1.18, 1.0) + vec3(0.05, 0.12, 0.16), 0.5*cur);
  col *= 0.5 + 0.85*n1*n1 + 0.1*sin(t*0.9 + ph*3.0 + h*3.0);
  col += uKeyCol*vec3(0.5, 0.25, 0.4)*0.22*(1.0 - core);                                 // the afterglow in the thin smoke of the edge
  col *= 0.86 + 0.28*clamp(vS.z, 0.0, 1.0);
  float d = length(cameraPosition - vW);
  a *= smoothstep(1.2, 5.0, d);
  col = mix(col, uFog.rgb, 0.7*bsFogF(d));
  gl_FragColor = vec4(col*a, a*0.94);
}`,
  });
}
// vapour trailing off the leech: soft sprites, 20 a sail
function vapourMaterial(SH) {
  return new THREE.ShaderMaterial({
    uniforms: SH, transparent: true, premultipliedAlpha: true, depthWrite: false,
    vertexShader: /* glsl */`
${BS_COMMON}
${BS_SHIP}
attribute vec4 aShip, aShip2, aSeed;
varying vec2 vQ; varying float vA;
void main(){
  float slack = bsShipSlack(aShip, aShip2), run = bsShipRun(aShip, aShip2);
  float age = fract(uTime*(0.16 + 0.1*aSeed.z) + aSeed.y);
  vec3 o = bsSail(0.78 + 0.2*aSeed.z, aSeed.x, slack, aShip.w);
  o += (vec3(uWind.x, 0.0, uWind.y)*(1.5 + 3.0*slack) + vec3(0.0, 0.0, 7.0*run*aShip.z))*age + vec3(0.0, 1.6*age + 0.5*sin(age*5.0 + aSeed.w*6.0), 0.0);
  vec3 wp = bsPut(o, aShip, aShip2);
  float size = (1.4 + 4.2*age)*(0.7 + 0.6*aSeed.w);
  vec4 mv = viewMatrix*vec4(wp, 1.0); mv.xy += position.xy*size;
  vQ = position.xy; float k = 1.0 - age;
  vA = 0.34*k*k*smoothstep(0.0, 0.12, age)*smoothstep(1.5, 6.0, -mv.z)*(1.0 - bsFogF(-mv.z));
  gl_Position = projectionMatrix*mv;
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
varying vec2 vQ; varying float vA;
void main(){
  float r2 = dot(vQ, vQ), g = clamp(1.0 - r2, 0.0, 1.0); g *= g;
  float a = max(vA, 0.0)*g;
  gl_FragColor = vec4(mix(uSailA, uSailB, 0.55)*a, a*0.5);
}`,
  });
}
// pennants: ribbons 8 m long that stream aft under way and hang to leeward at rest
function pennantMaterial(SH) {
  return new THREE.ShaderMaterial({
    uniforms: SH, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
${BS_COMMON}
${BS_SHIP}
attribute vec4 aShip, aShip2, aAt;        // aAt: attach point in ship space, length
varying vec3 vC; varying float vD;
void main(){
  float run = bsShipRun(aShip, aShip2), s = position.x, ph = aShip.w*3.0 + aAt.y;
  vec3 dir = normalize(mix(vec3(uWind.x*0.85, -0.5, uWind.y*0.85 + 0.2), vec3(uTack*0.28, 0.06, 1.0), run*aShip.z + 0.1));
  vec3 side = normalize(cross(dir, vec3(0.0, 1.0, 0.0)));
  float w1 = sin(s*9.0 - uTime*(3.0 + 6.0*run) + ph), w2 = sin(s*17.0 - uTime*(5.0 + 8.0*run) + ph*1.7);
  vec3 o = aAt.xyz + dir*s*aAt.w + side*(0.55*w1 + 0.2*w2)*s + vec3(0.0, 0.3*w2*s - 0.9*s*s*(1.0 - run*aShip.z), 0.0);
  vec3 wp = bsPut(o, aShip, aShip2);
  vec3 V = cameraPosition - wp; float d = length(V);
  vec3 wd = normalize(cross(dir + side*0.5*cos(s*9.0 - uTime*4.0 + ph), V/max(d, 1e-3)) + vec3(0.0, 1e-4, 0.0));
  float wdt = max(0.22*(1.0 - 0.6*s), 0.9*uPx*d);
  wp += wd*position.y*wdt;
  float lit = 0.6 + 0.4*sin(s*9.0 - uTime*(3.0 + 6.0*run) + ph + 1.3);
  vC = mix(vec3(0.75, 0.52, 0.56), vec3(0.85, 0.74, 0.62), fract(aAt.y*0.37))*lit*(uKeyCol*0.9 + uSkyCol*0.7) + uSailB*0.12;
  vC *= min(1.0, 0.22*(1.0 - 0.6*s)/wdt);
  vD = d;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
varying vec3 vC; varying float vD;
void main(){ gl_FragColor = vec4(bsFog(max(vC, 0.0), max(vD, 0.0)), 1.0); }`,
  });
}
// the standing rig: stays and shrouds from the mast to the horns and the gunwales, a boom along the sail's
// foot and its sheet to the stern. Straight ribbons that never grow thinner than a pixel (they fade instead).
function rigMaterial(SH) {
  return new THREE.ShaderMaterial({
    uniforms: SH, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
${BS_COMMON}
${BS_SHIP}
attribute vec4 aShip, aShip2, aA, aB;      // aA: from (ship space), kind (0 fixed, 1 boom, 2 sheet); aB: to, half width
varying vec4 vC;
void main(){
  float slack = bsShipSlack(aShip, aShip2);
  vec3 a = aA.xyz, b = aB.xyz;
  if (aA.w > 1.5) a = bsSail(0.95, 0.0, slack, aShip.w);
  else if (aA.w > 0.5) { a = bsSail(0.0, 0.0, slack, aShip.w); b = bsSail(1.0, 0.0, slack, aShip.w); }
  vec3 wp = bsPut(mix(a, b, position.x), aShip, aShip2);
  vec3 V = cameraPosition - wp; float d = length(V);
  vec3 sd = normalize(cross(bsTurn(b - a, aShip2), V) + vec3(0.0, 1e-4, 0.0));
  float w = max(aB.w, 0.8*uPx*d);
  wp += sd*position.y*w;
  vec3 c = vec3(0.30, 0.22, 0.15)*(uKeyCol*0.8 + uSkyCol*0.9 + uMoonCol*0.4) + uSailB*0.06;
  float al = min(1.0, aB.w/w)*(1.0 - 0.7*bsFogF(d));
  vC = vec4(mix(c, uFog.rgb, bsFogF(d))*al, al);
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`,
    fragmentShader: /* glsl */`
varying vec4 vC;
void main(){ gl_FragColor = max(vC, 0.0); }`,
  });
}
// banners on standing masts ashore: the pennant's ribbon again, hanging to leeward and stirring.
// list: [{ x, y, z, len, phase }] (y: where the ribbon is made fast)
export function makeBanners(SH, list) {
  const n = list.length, NR = 14, rp = [], ri = [];
  for (let i = 0; i <= NR; i++) rp.push(i / NR, -1, 0, i / NR, 1, 0);
  for (let i = 0; i < NR; i++) { const a = i * 2; ri.push(a, a + 2, a + 3, a, a + 3, a + 1); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setIndex(ri);
  const S1 = new Float32Array(n * 4), S2 = new Float32Array(n * 4), AT = new Float32Array(n * 4);
  list.forEach((b, i) => { S1.set([b.x, b.z, 0, b.phase ?? i * 1.3], i * 4); S2.set([1, 1, 0.5, 0], i * 4); AT.set([0, b.y, 0, b.len ?? 8], i * 4); });
  const m = new THREE.Mesh(instanced(rg, n, [['aShip', S1, 4], ['aShip2', S2, 4], ['aAt', AT, 4]]), pennantMaterial(SH)); m.frustumCulled = false;
  return m;
}
// the rose plume each runner hisses up, 25 m long at full speed
function plumeMaterial(SH) {
  return new THREE.ShaderMaterial({
    uniforms: { ...SH, uSand: { value: new THREE.Color('#EBD9BE') } }, transparent: true, premultipliedAlpha: true, depthWrite: false,
    vertexShader: /* glsl */`
${BS_COMMON}
${BS_SHIP}
attribute vec4 aShip, aShip2, aSeed;      // aSeed: runner side, phase, two randoms
varying vec2 vQ; varying float vA, vK;
void main(){
  float run = bsShipRun(aShip, aShip2)*aShip.z;
  float age = fract(uTime*0.42 + aSeed.y);
  vec3 o = vec3(aSeed.x*3.0, 0.25, 4.5 + 4.0*aSeed.z);
  o += vec3(uWind.x*4.0*age*age + (aSeed.w - 0.5)*3.2*age + 0.5*sin(uTime*1.7 + aSeed.y*31.0)*age, (0.8 + 5.0*aSeed.z*aSeed.w)*age*sqrt(age), age*(7.0 + 34.0*run));
  vec3 wp = bsPut(o, aShip, aShip2);
  float size = (0.9 + 5.6*age)*(0.6 + 0.9*aSeed.w);
  vec4 mv = viewMatrix*vec4(wp, 1.0); mv.xy += position.xy*size*vec2(1.5, 0.8);
  vQ = position.xy; float k = 1.0 - age;
  vA = 0.42*k*sqrt(k)*smoothstep(0.0, 0.07, age)*smoothstep(0.02, 0.5, run)*smoothstep(1.0, 5.0, -mv.z)*(1.0 - bsFogF(-mv.z));
  vK = age;
  gl_Position = projectionMatrix*mv;
}`,
    fragmentShader: /* glsl */`
${BS_COMMON}
uniform vec3 uSand;
varying vec2 vQ; varying float vA, vK;
void main(){
  float r2 = dot(vQ, vQ), g = clamp(1.0 - r2, 0.0, 1.0); g *= g;
  vec3 c = uSand*(uSkyCol*0.4 + uMoonCol*0.25 + uKeyCol*vec3(1.0, 1.15, 0.6)*(0.6 + 0.3*clamp(vQ.y, -1.0, 1.0))) + uSailB*0.10*clamp(1.0 - vK, 0.0, 1.0);
  float a = max(vA, 0.0)*g;
  gl_FragColor = vec4(c*a, a);
}`,
  });
}

// ---------------------------------------------------------------- the fleet
// ships: [{ x, z0, f, R, th, moored, size, tint, phase, lead }]. A ship starts at (x, z0) and runs R metres on a
// straight course th (radians east of north) at the share f of our own rate, slowing over its last metres (bsRun;
// the world sets SH.uG, the metres we have flown); everything else here runs on the clock. lead: the ship we
// follow, with a full crew.
export function makeFleet(ctx, SH, ships, o = {}) {
  const n = ships.length, group = new THREE.Group();
  const per = (k, fn) => { const a = new Float32Array(n * k * 4); for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) a.set(fn(ships[i], i, j), (i * k + j) * 4); return a; };
  const S1 = (k) => per(k, (s) => [s.x, s.z0, s.f, s.phase]), S2 = (k) => per(k, (s) => [s.R ?? 0, s.size ?? 1, s.tint ?? 0.5, s.th ?? 0]);
  const add = (geo, mat, order) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; if (order !== undefined) m.renderOrder = order; group.add(m); return m; };
  // hulls
  add(instanced(shipGeometry(o.detail ?? 1), n, [['aShip', S1(1), 4], ['aShip2', S2(1), 4]]), litMaterial(SH, { mode: 'ship', sheen: 1.2, sailLit: 0.7, bounce: 0.6 }));
  // sails: a grid of 10 by 30 quads each, drawn far to near (sorted in update)
  const NS = 10, NH = 30, sp = [], su = [], si = [];
  for (let j = 0; j <= NH; j++) for (let i = 0; i <= NS; i++) { sp.push(0, 0, 0); su.push(i / NS, j / NH); }
  for (let j = 0; j < NH; j++) for (let i = 0; i < NS; i++) { const a = j * (NS + 1) + i; si.push(a, a + 1, a + NS + 2, a, a + NS + 2, a + NS + 1); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2)); sg.setIndex(si);
  const sailA = S1(1), sailB = S2(1), sailGeo = instanced(sg, n, [['aShip', sailA, 4], ['aShip2', sailB, 4]]);
  add(sailGeo, sailMaterial(SH), 6);
  // vapour off each leech and the plumes off the runners: soft sprites
  const qg = new THREE.BufferGeometry(); qg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); qg.setIndex([0, 1, 2, 0, 2, 3]);
  const NV = 20, NP = 28;
  // (every ship's sprites are dealt from a stream of its own, salted by the ship's number, so a ship added later
  // re-deals nobody and no draw is taken from the world's stream)
  const sprites = o.sprites || ((i) => ctx.core.makeRng(ctx.core.hashSeed(ctx.seed + ':sand-ship:' + i))), own = ships.map((s, i) => sprites(i));
  const vs = new Float32Array(n * NV * 4); for (let i = 0; i < n * NV; i++) { const r = own[Math.floor(i / NV)]; vs.set([0.08 + 0.9 * r(), r(), r(), r()], i * 4); }
  add(instanced(qg, n * NV, [['aShip', S1(NV), 4], ['aShip2', S2(NV), 4], ['aSeed', vs, 4]]), vapourMaterial(SH), 7);
  const ps = new Float32Array(n * NP * 4); for (let i = 0; i < n * NP; i++) { const r = own[Math.floor(i / NP)]; ps.set([i % 2 ? 1 : -1, ((i % NP) + r() * 0.6) / NP, r(), r()], i * 4); }
  add(instanced(qg, n * NP, [['aShip', S1(NP), 4], ['aShip2', S2(NP), 4], ['aSeed', ps, 4]]), plumeMaterial(SH), 5);
  // pennants: three ribbons at the masthead and the sail peak
  const NR = 14, rp = [], ri = [];
  for (let i = 0; i <= NR; i++) rp.push(i / NR, -1, 0, i / NR, 1, 0);
  for (let i = 0; i < NR; i++) { const a = i * 2; ri.push(a, a + 2, a + 3, a, a + 3, a + 1); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setIndex(ri);
  const AT = [[0, 26.1, 1.28, 8], [0, 24.9, 1.12, 6.5], [0, 23.7, 0.97, 7.2]];
  add(instanced(rg, n * 3, [['aShip', S1(3), 4], ['aShip2', S2(3), 4], ['aAt', per(3, (s, i, j) => AT[j]), 4]]), pennantMaterial(SH));
  // the standing rig, boom and sheet
  const RIG = [[0, 26.0, 1.27, 0, 0, sheerY(-1) + 0.1, -8.25, 0.028], [0, 26.0, 1.27, 0, 0, sheerY(1) - 0.1, 8.25, 0.028],
    [0, 19.0, 0.4, 0, 1.7, 2.35, 0.2, 0.024], [0, 19.0, 0.4, 0, -1.7, 2.35, 0.2, 0.024], [0, 3.3, -1.55, 1, 0, 3.3, 8, 0.075], [0, 3.3, 6, 2, 0.1, deckY(5.6) + 0.25, 5.6, 0.022]];
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 0, 1, 0, 1, 1, 0, 1, -1, 0], 3)); lg.setIndex([0, 2, 1, 0, 3, 2]);
  const NRG = RIG.length;
  add(instanced(lg, n * NRG, [['aShip', S1(NRG), 4], ['aShip2', S2(NRG), 4], ['aA', per(NRG, (s, i, j) => RIG[j].slice(0, 4)), 4], ['aB', per(NRG, (s, i, j) => RIG[j].slice(4)), 4]]), rigMaterial(SH), 5);
  // crews: one at each tiller, one or two at the mast, who go forward to the bows as the ship comes to rest; the
  // ship we follow carries five: helmsman, a hand at the sheet, two at the mast, a lookout in the bows
  const crew = [], tk = SH.uTack.value;
  ships.forEach((s, i) => {
    const k = s.size ?? 1, th = s.th ?? 0, c = Math.cos(th), sn = Math.sin(th);
    const at = (lx, lz, o) => crew.push({ x: s.x + (lx * c - lz * sn) * k, y: deckY(lz) * k, z: s.z0 + (lx * sn + lz * c) * k, f: s.f, R: s.R ?? 0, th, scale: k * (s.lead ? 1.12 : 1), ...o, heading: o.heading - th });
    // a helmsman stands half turned to windward, looking aft over that shoulder at the weather and the ships
    // astern (how far round: by the ship's own phase)
    at(0.5, 5.4, { heading: -tk * (0.7 + 0.4 * ((s.phase * 0.37) % 1)), phase: s.phase * 3 + 1, arm: 0 });
    const hands = 1 + (i % 2);
    for (let j = 0; j < hands; j++) at(j ? -0.75 : 0.8, -0.4 - j * 1.4, { heading: Math.PI + (j ? 0.5 : -0.4), fwd: s.moored ? 0 : 3.6 - j, arm: (i + j) % 3 === 0 ? 1 : 0, phase: s.phase * 5 + j * 2.3 });
    if (s.lead) {
      at(-0.75 * tk, 3.5, { heading: tk * 0.9, arm: 1, phase: s.phase * 2 + 0.7 });                     // at the sheet, facing the sail
      at(0.0, -5.4, { heading: Math.PI - 0.2 * tk, arm: 0, phase: s.phase * 4 + 2.9 });                 // in the bows
      if (hands < 2) at(-0.75, -1.8, { heading: Math.PI + 0.5, fwd: 2.6, arm: 1, phase: s.phase * 5 + 2.3 });
    }
  });
  group.add(makeFigures(SH, crew));
  // far to near: the sails are smoke, so they are drawn in order of distance
  const order = ships.map((s, i) => i), dist = new Float32Array(n), cp = new THREE.Vector3(); let key = '';
  function update(dt, time, camera) {
    cp.setFromMatrixPosition(camera.matrixWorld);
    const G = SH.uG.value;
    for (let i = 0; i < n; i++) { const s = ships[i], th = s.th ?? 0, g = shipRunAt(s, G).s, dx = s.x + Math.sin(th) * g - cp.x, dz = s.z0 - Math.cos(th) * g - cp.z; dist[i] = dx * dx + dz * dz; }
    order.sort((a, b) => dist[b] - dist[a]);
    const k2 = order.join(',');
    if (k2 !== key) {
      key = k2;
      for (let j = 0; j < n; j++) { const s = ships[order[j]]; sailA.set([s.x, s.z0, s.f, s.phase], j * 4); sailB.set([s.R ?? 0, s.size ?? 1, s.tint ?? 0.5, s.th ?? 0], j * 4); }
      sailGeo.attributes.aShip.needsUpdate = true; sailGeo.attributes.aShip2.needsUpdate = true;
    }
  }
  return { object: group, update, ships, count: n, crew: crew.length, shipAt: (i, out) => { const s = ships[i], th = s.th ?? 0, g = shipRunAt(s, SH.uG.value).s; return out.set(s.x + Math.sin(th) * g, 0, s.z0 - Math.cos(th) * g); } };
}

// ---------------------------------------------------------------- the hero alone: one ship under way
export async function buildHero(ctx, opts = {}) {
  const own = !opts.shared, SH = opts.shared || makeShared({ tack: opts.tack ?? 1 });
  if (own) SH.uFog.value.set(0.25, 0.2, 0.35, 0.0006);
  await ctx.yield();
  const fleet = makeFleet(ctx, SH, [{ x: 0, z0: 0, f: 0.84, R: 1e6, th: 0, moored: 0, size: 1, tint: 0.6, phase: 1.3, lead: true }], { detail: 2 });
  await ctx.yield();
  const size = new THREE.Vector2();
  return {
    object: fleet.object, radius: 15, height: 27, center: new THREE.Vector3(SH.uTack.value * 3, 11, 1), shared: SH, fleet,
    anchors: { tiller: new THREE.Vector3(0.5, deckY(5.4), 5.4), masthead: new THREE.Vector3(0, 26.2, 1.3) },
    update(dt, time, camera) {
      if (own) {
        SH.uTime.value = time;
        if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); SH.uPx.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 0.1) * Math.max(size.y, 1)); }
      }
      fleet.update(dt, time, camera);
    },
    dispose() {},
    ground: true, groundY: 0,
  };
}
