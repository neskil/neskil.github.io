// Three Avenues Under the Floor: the way the twelve princesses go every night. From the foot of the stair that opens
// under a bed, through a rough arch, down an avenue of trees whose leaves are silver, round a bend into one whose
// leaves are gold, round another into one whose leaves are diamond, out over a black lake where twelve small boats
// are being rowed across, and up the water stair of the lit palace (hero, src/parts/three-avenues-under-the-floor.js)
// into its doorway, where the portal stands.
//
// Everything is laid out in route coordinates: s = metres along the centre line (0 at the entry), d = metres to the
// right of it. The cavern is one cross-section swept along the route (floor + vault); the three avenues are ranks of
// instanced jewel trees. There is no sky and no sun: every material is self-lit by rule (which metal hangs overhead,
// how near the palace is, the warm square of the bedroom above the stair).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeJewelKit, jewelTreePaced, jewelBoughGeometry, Leaves, GLSL_COMMON, GLSL_SPECTRA, PALACE, BURST, lin } from '../parts/three-avenues-under-the-floor.js';

const TAU = Math.PI * 2, FLOOR_Y = 2.2;
const S_BACK = -20, S_ARCH = 36, CLEAR_Y = 10.5;
const STEP = { s: 21, d: -11.2, r: 6.4 };      // the broad last step of the stair: centre of its fan and its radius, in route coordinates
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

// ---------------------------------------------------------------- the route: straight, bend, straight, bend, straight
function makeRoute(bends, sEnd) {
  const S0 = -80, n = Math.ceil(sEnd - S0) + 2, X = new Float32Array(n), Z = new Float32Array(n), Hd = new Float32Array(n), R = 22;
  const curv = (s) => { let k = 0; for (const b of bends) k += smoothstep(b.at - b.half, b.at - b.half + R, s) * (1 - smoothstep(b.at + b.half - R, b.at + b.half, s)) * b.angle / (2 * b.half - R); return k; };
  const i0 = -S0;
  for (let i = i0 - 1; i >= 0; i--) { X[i] = 0; Z[i] = Z[i + 1] + 1; }
  for (let i = i0 + 1; i < n; i++) { const h = Hd[i - 1] + curv(S0 + i - 0.5), hm = (h + Hd[i - 1]) / 2; Hd[i] = h; X[i] = X[i - 1] + Math.sin(hm); Z[i] = Z[i - 1] - Math.cos(hm); }
  const frame = (s) => {
    const f = clamp(s - S0, 0, n - 1.001), i = Math.floor(f), t = f - i, h = lerp(Hd[i], Hd[i + 1], t);
    return { x: lerp(X[i], X[i + 1], t), z: lerp(Z[i], Z[i + 1], t), h, fx: Math.sin(h), fz: -Math.cos(h), rx: Math.cos(h), rz: Math.sin(h) };
  };
  const at = (s, d = 0) => { const f = frame(s); return [f.x + f.rx * d, f.z + f.rz * d]; };
  const locate = (x, z) => {
    let best = Infinity, bi = 0;
    for (let i = 0; i < n; i += 2) { const dx = X[i] - x, dz = Z[i] - z, q = dx * dx + dz * dz; if (q < best) { best = q; bi = i; } }
    const h = Hd[bi], ds = (x - X[bi]) * Math.sin(h) - (z - Z[bi]) * Math.cos(h);
    return { s: S0 + bi + ds, d: (x - X[bi]) * Math.cos(h) + (z - Z[bi]) * Math.sin(h) };
  };
  return { frame, at, locate, S0, sEnd };
}

// ---------------------------------------------------------------- small self-lit props (stair, slippers, bed, boats, twigs)
// position, normal, colour, glow. Light: a lamp at a point of the object's own space, a key from one direction, an ambient.
class Prop {
  constructor() { this.p = []; this.n = []; this.c = []; this.e = []; this.idx = []; this.count = 0; this.col = [0.5, 0.5, 0.5]; this.em = 0; this.T = null; }
  set(col, em = 0) { this.col = col; this.em = em; return this; }
  // xf(matrix or null): everything added afterwards is placed by this Matrix4 (rotation and uniform scale only)
  xf(m) { this.T = m; return this; }
  v(q, n) {
    if (this.T) { const e = this.T.elements, x = q[0], y = q[1], z = q[2], a = n[0], b = n[1], c = n[2];
      q = [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]];
      const nx = e[0] * a + e[4] * b + e[8] * c, ny = e[1] * a + e[5] * b + e[9] * c, nz = e[2] * a + e[6] * b + e[10] * c, l = Math.hypot(nx, ny, nz) || 1; n = [nx / l, ny / l, nz / l]; }
    this.p.push(q[0], q[1], q[2]); this.n.push(n[0], n[1], n[2]); this.c.push(this.col[0], this.col[1], this.col[2]); this.e.push(this.em); return this.count++; }
  quad(A, B, C, D) {
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = D[0] - A[0], vy = D[1] - A[1], vz = D[2] - A[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; const N = [nx / l, ny / l, nz / l];
    const a = this.v(A, N), b = this.v(B, N), c = this.v(C, N), d = this.v(D, N); this.idx.push(a, b, c, a, c, d);
  }
  // box from eight corners given as a frame: centre c, half sizes, unit axes X (ax) and Z (az); Y is up
  box(c, hx, hy, hz, ax = [1, 0, 0], az = [0, 0, 1], bottom = false) {
    const P = (i, j, k) => [c[0] + ax[0] * hx * i + az[0] * hz * k, c[1] + hy * j, c[2] + ax[2] * hx * i + az[2] * hz * k];
    const a = P(-1, -1, 1), b = P(1, -1, 1), cc = P(1, 1, 1), d = P(-1, 1, 1), e = P(-1, -1, -1), f = P(1, -1, -1), g = P(1, 1, -1), h = P(-1, 1, -1);
    this.quad(a, b, cc, d); this.quad(b, f, g, cc); this.quad(f, e, h, g); this.quad(e, a, d, h); this.quad(d, cc, g, h); if (bottom) this.quad(e, f, b, a);
  }
  // square bar from A to B, half thickness r
  beam(A, B, r) {
    let tx = B[0] - A[0], ty = B[1] - A[1], tz = B[2] - A[2]; const l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
    let sx = -tz, sz = tx; const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
    const ux = -sz * ty, uy = sz * tx - sx * tz, uz = sx * ty, P = (q, i, j) => [q[0] + sx * r * i + ux * r * j, q[1] + uy * r * j, q[2] + sz * r * i + uz * r * j];
    const K = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    for (let k = 0; k < 4; k++) { const a = K[k], c = K[(k + 1) % 4]; this.quad(P(A, a[0], a[1]), P(B, a[0], a[1]), P(B, c[0], c[1]), P(A, c[0], c[1])); }
  }
  // lofted rings: rows[j] = array of [x,y,z]; closed round if wrap
  loft(rows, wrap = true, flip = false, tones = null) {
    const m = rows[0].length, base = this.count, c0 = this.col;
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < m; i++) {
      if (tones) this.col = mul3(c0, tones[j]);
      const q = rows[j][i], a = rows[j][(i + 1) % m], b = rows[j][(i + m - 1) % m], c = rows[Math.min(j + 1, rows.length - 1)][i], d = rows[Math.max(j - 1, 0)][i];
      const ux = a[0] - b[0], uy = a[1] - b[1], uz = a[2] - b[2], vx = c[0] - d[0], vy = c[1] - d[1], vz = c[2] - d[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = (Math.hypot(nx, ny, nz) || 1) * (flip ? -1 : 1);
      this.v(q, [nx / l, ny / l, nz / l]);
    }
    this.col = c0;
    for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < (wrap ? m : m - 1); i++) {
      const a = base + j * m + i, b = base + j * m + (i + 1) % m, c = base + (j + 1) * m + (i + 1) % m, d = base + (j + 1) * m + i;
      if (flip) this.idx.push(a, c, b, a, d, c); else this.idx.push(a, b, c, a, c, d);
    }
  }
  // body of revolution about the vertical through (x, z): prof [[r, y], ...] bottom to top, squash scales z
  lathe(x, z, prof, seg = 8, squash = 1, rot = 0) {
    this.loft(prof.map(([r, y]) => { const row = []; for (let i = 0; i < seg; i++) { const a = rot - i / seg * TAU; row.push([x + Math.cos(a) * r, y, z + Math.sin(a) * r * squash]); } return row; }));
  }
  toGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('aE', new THREE.Float32BufferAttribute(this.e, 1)); g.setIndex(this.idx);
    return g;
  }
}
function propMaterial(U, o = {}) {
  return new THREE.ShaderMaterial({
    side: o.side ?? THREE.FrontSide,
    uniforms: {
      uFogCol: U.uFogCol, uFogDen: U.uFogDen, uTime: U.uTime,
      uLamp: { value: new THREE.Vector4(...(o.lamp ?? [0, 0, 0, 1])) }, uLampCol: { value: new THREE.Color(o.lampColor ?? '#000000') },
      uKeyDir: { value: new THREE.Vector3(...(o.keyDir ?? [0, 1, 0])).normalize() }, uKeyCol: { value: new THREE.Color(o.keyColor ?? '#000000') },
      uAmb: { value: new THREE.Color(o.ambient ?? '#10142a') }, uMirror: { value: o.mirror ? 1 : 0 }, uLampWorld: { value: o.lampWorld ? 1 : 0 },
    },
    vertexShader: /* glsl */`
attribute float aE; varying vec3 vC, vN, vWp, vPo, vNo; varying float vE;
void main(){
  #ifdef USE_INSTANCING
    mat4 mm = modelMatrix*instanceMatrix;
  #else
    mat4 mm = modelMatrix;
  #endif
  vC = color; vE = aE; vPo = position; vNo = normal;
  vec4 wp = mm*vec4(position, 1.); vWp = wp.xyz; vN = normalize(mat3(mm)*normal);
  gl_Position = projectionMatrix*viewMatrix*wp;
}`,
    vertexColors: true,
    fragmentShader: GLSL_COMMON + /* glsl */`
uniform vec4 uLamp; uniform vec3 uLampCol, uKeyDir, uKeyCol, uAmb; uniform float uTime, uMirror, uLampWorld;
varying vec3 vC, vN, vWp, vPo, vNo; varying float vE;
void main(){
  if (uMirror > .5 && vWp.y > -.02) discard;
  vec3 v = cameraPosition - vWp; float dist = length(v);
  vec3 n = normalize(vN + vec3(1e-5)), no = normalize(vNo + vec3(1e-5));
  vec3 lv = uLamp.xyz - mix(vPo, vWp, uLampWorld); float ld = length(lv); lv /= max(ld, 1e-3);
  float lamp = (.25 + .75*clamp(dot(mix(no, n, uLampWorld), lv), 0., 1.))/(1. + ld*ld/max(uLamp.w*uLamp.w, 1e-3));
  float key = .3 + .7*clamp(dot(n, uKeyDir), 0., 1.);
  vec3 col = vC*(uAmb*(.6+.4*n.y) + uLampCol*lamp + uKeyCol*key) + vC*vE;
  if (uMirror > .5) col *= .6;
  gl_FragColor = vec4(fogged(col, dist, 1.), 1.);
}`,
  });
}

const CAVE_VERT = /* glsl */`
attribute vec4 aMet; attribute vec2 aSD; attribute vec3 aTo; attribute float aSh;
varying vec4 vMet; varying vec2 vSD; varying vec3 vWp, vN, vTo; varying float vSh;
void main(){ vMet = aMet; vSD = aSD; vN = normal; vTo = aTo; vSh = aSh; vec4 wp = modelMatrix*vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`;
const FLOOR_FRAG = GLSL_COMMON + GLSL_SPECTRA + /* glsl */`
uniform vec3 uSil, uGol, uDia, uWarmCol, uGlowAt, uFount; uniform float uTime, uArch;
varying vec4 vMet; varying vec2 vSD; varying vec3 vWp, vN; varying float vSh;
float leafLayer(vec2 q, out float tone){
  vec2 i = floor(q), f = fract(q); vec2 o = h22(i)*.5+.25; float a = h21(i+1.7)*6.2832; vec2 d = f-o;
  d = vec2(d.x*cos(a)+d.y*sin(a), -d.x*sin(a)+d.y*cos(a)); tone = h21(i+9.1);
  return 1.-smoothstep(.2, .3, length(d*vec2(1., 2.1)));
}
void main(){
  if (vWp.y < -.05) discard;
  vec3 v = cameraPosition - vWp; float dist = length(v);
  float mw = vMet.x+vMet.y+vMet.z, ad = abs(vSD.y);
  vec3 metal = uSil*vMet.x + uGol*vMet.y + uDia*vMet.z;
  vec3 light = metal + uWarmCol*vMet.w;
  float dap = .5 + 1.1*smoothstep(.3, .72, fbm2(vWp.xz*.085 + vec2(uTime*.04, -uTime*.027)));
  float chamber = 1.-smoothstep(uArch - 6., uArch + 12., vSD.x);
  float flagK = max(1.-smoothstep(1.9, 3.6, ad + 1.8*(vn2(vWp.xz*.3)-.5)), chamber);
  flagK = max(flagK, 1.-smoothstep(uFount.z - 6.5, uFount.z - 4.5, distance(vWp.xz, uFount.xy) + 1.4*(vn2(vWp.xz*.3)-.5)));
  vec2 fq = vec2(vSD.x*.86, vSD.y*.95); fq.y += floor(fq.x)*.5;
  float fj = min(.5-abs(fract(fq.x)-.5), .5-abs(fract(fq.y)-.5));
  vec3 flag = vec3(.085,.09,.115)*(.55+.7*h21(floor(fq)))*(.3+.7*smoothstep(.0, .09, fj))*(.75+.5*vn2(vWp.xz*3.));
  vec3 earth = mix(vec3(.012,.02,.018), vec3(.04,.055,.045), fbm2(vWp.xz*.7));
  vec3 base = mix(earth, flag, flagK*.9);
  // round every trunk: black moss between the roots, a drift of leaves against it, and a soft shade that dies away outward
  float sh = clamp(vSh + (vn2(vWp.xz*.9) - .5)*.25*step(.01, vSh), 0., 1.);
  base = mix(base, vec3(.012,.026,.02)*(.5+1.1*vn2(vWp.xz*2.7)), smoothstep(.45, .9, sh)*(1.-chamber));
  float t1, t2; float l1 = leafLayer(vWp.xz*1.7, t1), l2 = leafLayer(vWp.xz*2.9 + 7.3, t2);
  float drift = smoothstep(.3, .68, fbm2(vWp.xz*.12 + 3.));
  float mossBand = smoothstep(6.5, 8.5, ad)*(1.-smoothstep(11., 13.5, ad));
  float cover = mix(.1, 1., max(drift, .8*smoothstep(13., 20., ad)))*mix(.4, 1., smoothstep(1., 5., ad))*(1.-.8*mossBand*(1.-drift*.5))*clamp(mw, 0., 1.)*(1.-.8*chamber)*(1.-.5*smoothstep(24., 40., ad));
  cover = max(cover, .8*smoothstep(.1, .4, sh)*(1.-smoothstep(.55, .9, sh))*clamp(mw, 0., 1.));
  float leaf = max(l1*step(t1, cover), l2*step(t2, cover*.85)), tone = l1 > l2 ? t1 : t2;
  float lod = smoothstep(26., 100., dist);
  leaf = mix(leaf, cover*.42, lod); tone = mix(tone, .5, lod);
  vec3 leafCol = metal/max(mw, .05)*(.28 + .85*tone);
  float tw = .5+.5*sin(uTime*(1.2+2.*tone) + tone*80.); tw *= tw; tw *= tw*tw;
  vec3 col = base*light*mix(1.25, 2.1, chamber)*mix(dap, 1., chamber);
  col = mix(col, leafCol*(.34+.5*dap) + leafCol*tw*1.5*(1.-lod), leaf*clamp(mw*1.5, 0., 1.));
  col += spectra(vWp.xz*.55, uTime)*vMet.z*1.6*(1.-.7*lod);
  vec3 vd = v/max(dist, 1e-4), rr = reflect(-vd, normalize(vec3((h21(floor(fq)) - .5)*.07, 1., (h21(floor(fq) + 5.) - .5)*.07)));
  float sp = clamp(dot(rr, normalize(uGlowAt - vWp)), 0., 1.); sp *= sp; sp *= sp; sp *= sp;
  col += uSil*sp*sp*sp*sp*1.1*flagK*smoothstep(.0, .09, fj)*(1.-smoothstep(uArch + 30., uArch + 70., vSD.x));
  col *= 1. - .62*sh*sh;
  col *= smoothstep(-1.2, .3, vWp.y);
  gl_FragColor = vec4(fogged(col, dist, 1.), 1.);
}`;
const ROCK_FRAG = GLSL_COMMON + GLSL_SPECTRA + /* glsl */`
uniform vec3 uSil, uGol, uDia, uWarmCol, uAmb; uniform float uTime, uShore, uArch;
varying vec4 vMet; varying vec2 vSD; varying vec3 vWp, vN, vTo;
void main(){
  vec3 v = cameraPosition - vWp; float dist = length(v); v /= max(dist, 1e-4);
  vec3 metal = uSil*vMet.x + uGol*vMet.y + uDia*vMet.z;
  vec3 n = normalize(vN + vec3(1e-5)); if (dot(n, v) < 0.) n = -n;
  vec2 p1 = vSD, p2 = vec2(vSD.x*.8 - vSD.y*.6, vSD.x*.6 + vSD.y*.8) + 31.;
  float lakeF = smoothstep(uShore - 70., uShore + 40., vSD.x);
  float a = fbm2(p1*.055), b = fbm2(p2*.21 + 4.), c = fbm2(p1*1.1), e = vn2(p2*5.3);
  // the rock is bedded: each bed's lip catches what light there is, and the bed under it lies in shade
  float bed = vWp.y*.3 + a*3.4 + b*1.5 + c*.5, lip = fract(bed), ledge = smoothstep(0., .1, lip)*(1.-smoothstep(.1, .7, lip));
  vec3 rock = mix(vec3(.02,.027,.055), vec3(.1,.115,.185), a*.4 + b*.33 + c*.27)*(.7+.45*e)*(.72+.42*ledge);
  float fall = exp(-max(vWp.y - 3., 0.)*.034);
  float lam = .22 + .78*clamp(dot(n, normalize(vTo + vec3(1e-5))), 0., 1.);
  vec3 col = rock*(uAmb*(1. + 1.5*lakeF) + metal*(.1 + 1.05*fall)*lam*1.35 + uWarmCol*vMet.w*lam*(.45 + .95*ledge));
  // veins and seams of crystal: two families of long meandering lines, lit from inside, every stretch on its own slow pulse
  float wv = .016 + dist*.00011;
  float f1 = abs(vn2(vec2(p2.x*.016, p2.y*.07) + 9.)*.67 + vn2(vec2(p2.x*.035, p2.y*.15) + 4.)*.33 - .5);
  float f2 = abs(vn2(vec2(p1.x*.06, p1.y*.013) + 23.)*.67 + vn2(vec2(p1.x*.13, p1.y*.03) + 2.)*.33 - .46);
  float zone = smoothstep(.5, .7, vn2(p1*.017 + 5.)), zone2 = smoothstep(.56, .76, vn2(p1*.012 + 31.))*(1.-zone);
  float v1 = (1.-smoothstep(0., wv, f1))*zone, v2 = (1.-smoothstep(0., wv*.8, f2))*zone2*.8;
  float halo = (1.-smoothstep(0., wv*3.5, f1))*zone*.16 + (1.-smoothstep(0., wv*3., f2))*zone2*.1;
  float run = vn2(p1*.09 + 3.), tw = .55 + .45*sin(uTime*(.5 + run) + run*40. + p1.x*.05);
  float knot = smoothstep(.5, .8, vn2(p1*.55 + 11.));
  vec3 vcol = mix(mix(vec3(.3,.55,1.), vec3(.72,.5,1.), smoothstep(.35, .65, vn2(p2*.021))), vec3(.85,.97,1.), .3 + .5*knot);
  col += vcol*((v1 + v2)*(.2 + .6*knot)*tw + halo*.1)*mix(.3, 1., lakeF)*smoothstep(uArch + 4., uArch + 44., vSD.x);
  col += spectra(vWp.xz*.3 + vWp.y*.4, uTime)*vMet.z*.35*fall;
  col *= smoothstep(-2.5, .2, vWp.y);
  // the palace's light hangs in the air at its end of the cavern
  float air = 1.-exp(-dist*.004);
  gl_FragColor = vec4(fogged(col, dist, 1.) + uWarmCol*vec3(1.,.78,.86)*vMet.w*air*.035, 1.);
}`;

export default {
  id: 'three-avenues-under-the-floor',
  name: 'Three Avenues Under the Floor',
  category: 'books',
  placeKind: 'interior',
  book: "Grimms' Fairy Tales",
  author: 'Jacob Grimm, 1785 to 1863, and Wilhelm Grimm, 1786 to 1859',
  media: ['air'],
  weirdness: 0.5,
  async build(ctx) {
    const { rng, noise } = ctx, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const scene = new THREE.Scene();

    // ------------------------------------------------------------ what this visit is like
    const rv = rng.fork('vary');
    // every seeded stream of the world is taken here, in one fixed list, before anything else is drawn or any loop runs (a fork
    // draws once from its parent, so the order is part of the deal)
    const R = {
      chamber: rng.fork('chamber'), trees: rng.fork('trees'), leaves: rng.fork('leaves'), glints: rng.fork('glints'), hero: rng.fork('hero'), spikes: rng.fork('spikes'),
      drips: rng.fork('drips'), boats: rng.fork('boats'), dust: ['#dfe6ff', '#ffd870', '#ffffff'].map((c) => rng.fork('dust' + c)), moths: rng.fork('moths'),
      features: rng.fork('features'), banks: rng.fork('banks'), vault: rng.fork('vault'), piles: rng.fork('piles'), arch: rng.fork('arch'),
      rows: rng.fork('rows'), litter: rng.fork('litter'), teeth: rng.fork('teeth'), afloat: rng.fork('afloat'),
      rays: rng.fork('rays'), tree: [0, 1, 2].map((i) => rng.fork('tree' + i)), lod: [0, 1].map((i) => rng.fork('lod' + i)), bough: rng.fork('bough'),
    };
    const dens = clamp(vary.density ?? 1, 0.7, 1.3), mood = clamp(vary.mood ?? rv(), 0, 1), rare = !!vary.rare;
    const turn1 = rv.pick([-1, 1]) * rv.range(0.6, 0.86), turn2 = (rv.chance(0.65) ? -Math.sign(turn1) : Math.sign(turn1)) * rv.range(0.55, 0.8);
    const L_SIL = rv.range(196, 216), L_GOLD = rv.range(190, 212), L_DIA = rv.range(165, 182), L_LAKE = 190, PK = 1.2;
    const S_TREES = S_ARCH + 9, B1 = S_TREES + L_SIL, B2 = B1 + L_GOLD, S_SHORE = B2 + L_DIA, S_DOOR = S_SHORE + L_LAKE, S_END = S_DOOR + 175;
    // the palace's own measures along the route (it is PK times its plan size): where its water stair begins, where the landing
    // at the head of the stair begins, and where the boats stop short of the stair
    const zs = (z) => S_DOOR + PALACE.doorZ - PK * z, S_FOOT = zs(PALACE.stairFootZ), S_LAND = zs(PALACE.landZ), S_STOP = S_FOOT - 18;
    const BEND = 45, route = makeRoute([{ at: B1, half: BEND, angle: turn1 }, { at: B2, half: BEND, angle: turn2 }], S_END + 20);      // each bend takes BEND metres before and after its middle
    await ctx.yield();
    const arrived = rv.int(1, 5), treeScale = rv.range(0.94, 1.08), spacing = rv.range(13.5, 15.5);
    // one thing in each avenue that the others lack. Silver: a fountain in a round clearing, the rows stepping back round it.
    // Gold: a long pool with a stone rim on the axis of the avenue, midway between the avenue's two bends.
    // Diamond: a great bough that has come down across the walk.
    const ft = R.features;
    const fountain = { s: S_TREES + L_SIL * ft.range(0.5, 0.6), side: ft.pick([-1, 1]), R: 16.5 };
    const pool = { s: B1 + L_GOLD / 2, d: 0, r: ft.range(5.2, 6), len: ft.range(12, 14.5) }, pools = [pool];
    const bough = { s: B2 + L_DIA * ft.range(0.42, 0.5), side: ft.pick([-1, 1]), len: ft.range(16, 18), from: 6.5, across: 9 };
    // The way through the avenues is one rule of s. It sways between the rows on two slow waves; where silver turns to gold it
    // climbs once toward the leaves and sinks again; it swings wide round the fountain, comes down the middle low over the pool,
    // and leans away from the fallen bough and lifts over its branches. Margins round it, in metres, the same along its whole
    // length: no trunk within WAY_CLEAR; no leaf that the build puts in the air or on the fallen bough within LEAF_CLEAR (a leaf
    // in the air strays up to LEAF_DRIFT sideways from where it starts, so it starts that much farther off); and the way never
    // climbs above WAY_TOP, 55 hundredths of the height at which the leaves begin (the lowest limbs of the first row hang at
    // about seven tenths of it, the lowest leaf tips at eight tenths). The same LEAF_CLEAR holds for the moths' rounds.
    const wv = rv.range(0, TAU), bell = (x) => Math.exp(-x * x), S_A0 = S_ARCH + 26, S_A1 = S_SHORE - 10, WAY_CLEAR = 6.4, LEAF_CLEAR = 3, LEAF_DRIFT = 2.75, WAY_TOP = FLOOR_Y + 0.55 * CLEAR_Y;
    const wayD = (s) => {
      const ends = smoothstep(S_A0, S_A0 + 50, s) * (1 - smoothstep(S_A1 - 50, S_A1, s));
      const kF = bell((s - fountain.s) / 26), kP = bell((s - pool.s) / (pool.len + 16)), kB = bell((s - bough.s - bough.len * 0.4) / 24), kR = bell((s - B1) / 48);
      let d = (3.0 * Math.sin(s * 0.0155 + wv) + 1.3 * Math.sin(s * 0.037 + wv * 1.7)) * (1 - kP) * (1 - 0.8 * kR);
      d = lerp(d, fountain.side * 9.9, kF); d = lerp(d, -bough.side * 4.6, kB);
      return d * ends;
    };
    const wayY = (s) => {
      const kF = bell((s - fountain.s) / 30), kP = bell((s - pool.s) / (pool.len + 12)), kB = bell((s - bough.s - bough.len * 0.4) / 20), kR = bell((s - B1) / 46);
      return Math.min(FLOOR_Y + 4.7 + 0.7 * Math.sin(s * 0.017 + wv * 2) * (1 - kR) + (WAY_TOP - FLOOR_Y - 4.7) * kR - 1.0 * kF - 1.1 * kP + 1.5 * kB, WAY_TOP);
    };
    // how far a place (s, d) lies from the way, measured to the way at every second metre of the route, to 12 m before and beyond
    const wayDist = (s, d) => { let near = Infinity; for (let ss = s - 12; ss <= s + 12; ss += 2) near = Math.min(near, Math.hypot(ss - s, wayD(ss) - d)); return near; };
    const kit = makeJewelKit(ctx, { fog: '#070a18', fogDensity: 0.0021, farA: 204, farB: 258 });
    const U = kit.U, M = kit.METALS;
    await ctx.yield();
    scene.background = new THREE.Color('#03040a');
    scene.fog = new THREE.FogExp2('#070a18', 0.0021);

    // ------------------------------------------------------------ the cavern: one cross-section swept along the route
    const hallK = (s) => smoothstep(S_ARCH + 1, S_ARCH + 24, s);
    // the lake is a bay: its round head lies across the end of the diamond avenue, and its banks run on, either side, to the palace.
    // lakeHalf(s) = half the width of the water at s; lakeIn(s, d) = metres inside the water's edge (negative on land)
    const lakeX = (s) => s - S_SHORE + 6, lakeWide = (X) => 70 * smoothstep(8, 120, X) + 0.09 * Math.max(X, 0);
    const lakeHalf = (s) => { const X = lakeX(s), e = lakeWide(X); return X <= 0 ? 0 : X < 27 ? Math.sqrt(Math.max((27 + e) * (27 + e) - (X - 27) * (X - 27), 0)) : 27 + e; };
    const lakeIn = (s, d) => { const X = lakeX(s), e = lakeWide(X); if (X < 27) return 27 + e - Math.hypot(X - 27, d); const sl = lakeWide(X + 1) - e; return (27 + e - Math.abs(d)) / Math.sqrt(1 + sl * sl); };
    const wallW = (s) => {
      if (s <= S_ARCH) return s < -4 ? Math.sqrt(Math.max(256 - (s + 4) * (s + 4), 0.5)) : lerp(16, 13, smoothstep(-4, S_ARCH - 4, s));
      let w = lerp(13, 56 + 9 * noise.n2(s * 0.011, 3.3), hallK(s));
      w = Math.max(w, Math.min(lakeHalf(s) + 30 + 44 * smoothstep(-40, 60, lakeX(s)), 196));
      return lerp(w, 12, smoothstep(S_DOOR + 75, S_DOOR + 170, s));
    };
    const vaultH = (s) => {
      let h = lerp(34, 23, smoothstep(6, S_ARCH - 2, s));
      h = lerp(h, 58 + 9 * noise.n2(s * 0.013, 8.1), smoothstep(S_ARCH + 1, S_ARCH + 30, s));
      h = lerp(h, 132, smoothstep(S_SHORE - 14, S_SHORE + 80, s));
      return lerp(h, 30, smoothstep(S_DOOR + 80, S_DOOR + 170, s));
    };
    const ground = (s, d) => {
      const W = wallW(s), ad = Math.abs(d), hk = hallK(s), big = smoothstep(70, 130, W);
      let y = FLOOR_Y + hk * (0.5 * noise.n2(s * 0.03, d * 0.03) * smoothstep(3, 9, ad) + 0.8 * noise.n2(s * 0.011 + 7, d * 0.014) * smoothstep(2, 14, ad));
      for (const q of pools) if (Math.abs(s - q.s) < q.len + 6) y = lerp(y, FLOOR_Y - 0.75, 1 - smoothstep(q.r - 0.6, q.r + 1.8, Math.hypot((s - q.s) * q.r / q.len, d - q.d)));
      if (Math.abs(s - fountain.s) < 24) y = lerp(FLOOR_Y, y, smoothstep(11, 23, Math.hypot(s - fountain.s, d)));
      if (s > S_SHORE - 12) y = lerp(y, -6, smoothstep(-4.5, 3.5, lakeIn(s, d)));
      const rise = smoothstep(W - lerp(22, 44, big), W, ad);
      return y + hk * rise * rise * lerp(13, 28, big);
    };
    const lampList2 = [], lampCols = ['#ffc070', '#ffd9a0', '#ff8fa3'].map((h) => mul3(lin(h), 1.5));
    const archAt = [0, FLOOR_Y + 7 + 0.12 + 8.4 - 0.25 - 2.9, -S_ARCH + 3.5];      // the lantern that hangs before the arch's keystone
    // the landing's top step, the place just off its bottom step where a boat puts out, and the middle of the bay's round head
    const quayS = S_SHORE - 9.2, S_PUT = quayS + 7.5, S_HEAD = S_SHORE + 21, quayLamps = [-1, 1].map((sg) => { const p = route.at(quayS, sg * 8.4); return [p[0], FLOOR_Y + 5.2, p[1]]; });
    const palaceAt = route.at(S_DOOR + 10, 0), trap = { s: 5, d: 8.6, y: FLOOR_Y + 29.5 }, trapAt = route.at(trap.s, trap.d);
    const metalAt = (s) => {
      const wS = lerp(0.6, 1, smoothstep(8, S_ARCH + 12, s)) * (1 - smoothstep(B1 - 24, B1 + 24, s));
      const wG = smoothstep(B1 - 24, B1 + 24, s) * (1 - smoothstep(B2 - 24, B2 + 24, s));
      const wD = smoothstep(B2 - 24, B2 + 24, s) * (1 - 0.6 * smoothstep(S_SHORE + 10, S_SHORE + 150, s));
      return [wS, wG, wD];
    };
    const warmAt = (s, x, y, z) => {
      let w = 0;
      if (s < S_ARCH + 12) { const q = (x - trapAt[0]) ** 2 + (y - trap.y) ** 2 + (z - trapAt[1]) ** 2; w += 1.8 / (1 + q / 330); }
      if (s < S_ARCH + 30) w += 0.9 / (1 + ((x - archAt[0]) ** 2 + (y - archAt[1]) ** 2 + (z - archAt[2]) ** 2) / 70);
      if (s > S_SHORE - 90) {
        const q = (x - palaceAt[0]) ** 2 + (y - 36) ** 2 + (z - palaceAt[1]) ** 2; w += smoothstep(S_SHORE - 90, S_SHORE + 10, s) * 1.7 / (1 + q / 15000);
        if (s < S_SHORE + 30) for (const L of quayLamps) w += 1.5 / (1 + ((x - L[0]) ** 2 + (y - L[1]) ** 2 + (z - L[2]) ** 2) / 30);
      }
      return w;
    };
    const ringsAll = [];
    for (let s = S_BACK; s < S_END; s += s < S_DOOR + 46 ? 2.5 : 10) ringsAll.push(s);
    ringsAll.push(S_END);
    const caveMesh = async (ND, pointAt, frag, extra, rings = ringsAll) => {
      const nR = rings.length, P = new Float32Array(nR * (ND + 1) * 3), A = new Float32Array(nR * (ND + 1) * 4), SD = new Float32Array(nR * (ND + 1) * 2), TO = new Float32Array(nR * (ND + 1) * 3);
      const SH = new Float32Array(nR * (ND + 1));
      for (let i = 0; i < nR; i++) for (let j = 0; j <= ND; j++) {
        if (j === 0) await ctx.yield();
        const s = rings[i], q = pointAt(s, j / ND), k = i * (ND + 1) + j, m = metalAt(s);
        P[k * 3] = q[0]; P[k * 3 + 1] = q[1]; P[k * 3 + 2] = q[2];
        A[k * 4] = m[0]; A[k * 4 + 1] = m[1]; A[k * 4 + 2] = m[2]; A[k * 4 + 3] = warmAt(s, q[0], q[1], q[2]);
        SD[k * 2] = s; SD[k * 2 + 1] = q[3];
        const ax = route.at(s, 0), lk = smoothstep(S_SHORE - 40, S_SHORE + 60, s), ch = 1 - smoothstep(S_ARCH - 6, S_ARCH + 10, s);
        let tx = lerp(lerp(ax[0], palaceAt[0], lk), trapAt[0], ch) - q[0], ty = lerp(lerp(FLOOR_Y + 15, 34, lk), trap.y, ch) - q[1], tz = lerp(lerp(ax[1], palaceAt[1], lk), trapAt[1], ch) - q[2];
        const tl = Math.hypot(tx, ty, tz) || 1; TO[k * 3] = tx / tl; TO[k * 3 + 1] = ty / tl; TO[k * 3 + 2] = tz / tl;
      }
      // faces and normals, filled by hand a few rings at a time (each face's cross product summed on its three corners)
      const IX = new Uint32Array((nR - 1) * ND * 6), N = new Float32Array(nR * (ND + 1) * 3);
      const face = (a, b, c, o) => {
        IX[o] = a; IX[o + 1] = b; IX[o + 2] = c;
        const ax = P[a * 3] - P[b * 3], ay = P[a * 3 + 1] - P[b * 3 + 1], az = P[a * 3 + 2] - P[b * 3 + 2], cx = P[c * 3] - P[b * 3], cy = P[c * 3 + 1] - P[b * 3 + 1], cz = P[c * 3 + 2] - P[b * 3 + 2];
        const nx = cy * az - cz * ay, ny = cz * ax - cx * az, nz = cx * ay - cy * ax;
        N[a * 3] += nx; N[a * 3 + 1] += ny; N[a * 3 + 2] += nz; N[b * 3] += nx; N[b * 3 + 1] += ny; N[b * 3 + 2] += nz; N[c * 3] += nx; N[c * 3 + 1] += ny; N[c * 3 + 2] += nz;
      };
      for (let i = 0, o = 0; i < nR - 1; i++) {
        if (i % 4 === 3) await ctx.yield();
        for (let j = 0; j < ND; j++, o += 6) { const a = i * (ND + 1) + j, b = a + 1, c = a + ND + 2, d = a + ND + 1; face(a, b, c, o); face(a, c, d, o + 3); }
      }
      await ctx.yield();
      for (let k = 0; k < N.length; k += 3) { const l = Math.hypot(N[k], N[k + 1], N[k + 2]) || 1; N[k] /= l; N[k + 1] /= l; N[k + 2] /= l; }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('aMet', new THREE.BufferAttribute(A, 4)); g.setAttribute('aSD', new THREE.BufferAttribute(SD, 2)); g.setAttribute('aTo', new THREE.BufferAttribute(TO, 3)); g.setAttribute('aSh', new THREE.BufferAttribute(SH, 1));
      g.setIndex(new THREE.BufferAttribute(IX, 1));
      await ctx.yield();
      const mat = new THREE.ShaderMaterial({ side: THREE.DoubleSide, vertexShader: CAVE_VERT, fragmentShader: frag,
        uniforms: { uTime: U.uTime, uFogCol: U.uFogCol, uFogDen: U.uFogDen, uSil: { value: M.silver.leaf }, uGol: { value: M.gold.leaf }, uDia: { value: M.diamond.leaf }, uWarmCol: { value: new THREE.Color('#ffb46a') }, ...extra } });
      const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; return mesh;
    };
    // across the lake the floor is only its banks: the rows of vertices start just inside the water's edge, so the shore line is smooth
    const floorPoint = (s, t) => { const W = wallW(s), tt = t * 2 - 1, d0 = clamp(lakeHalf(s) - 5, 0, W - 2), d = (tt < 0 ? -1 : 1) * lerp(d0, W, Math.pow(Math.abs(tt), 1.3)), p = route.at(s, d); return [p[0], ground(s, d), p[1], d]; };
    const rockPoint = (s, t) => {
      const W = wallW(s), H = vaultH(s), chamber = 1 - hallK(s), e = 2 / lerp(2.5, 3.4, chamber), a = t * Math.PI, c = Math.cos(a), sn = Math.sin(a), se = Math.pow(sn, e);
      const amp = lerp(lerp(3.2, 0.7, chamber), 13, smoothstep(S_SHORE - 40, S_SHORE + 80, s)), n1 = noise.n3(s * 0.035, c * 2.2, sn * 2.2 + 5), n2 = noise.n3(s * 0.11 + 9, c * 5, sn * 5);
      const d = W * Math.sign(c) * Math.pow(Math.abs(c), e) * (1 + smoothstep(0, 0.2, sn) * (amp / Math.max(W, 12)) * (n1 + 0.35 * n2));
      const gE = ground(s, c > 0 ? W : -W), y = gE * (1 - se) + (FLOOR_Y + H) * se + se * amp * 0.8 * (n1 * 0.6 - n2 * 0.5);
      const p = route.at(s, d); return [p[0], y, p[1], (t - 0.5) * Math.PI * Math.sqrt((W * W + H * H) / 2)];
    };
    const glowAt = route.at(S_TREES + spacing * 0.5, 0), fountAt = route.at(fountain.s, 0);      // the silver that shines on the flags hangs over the first pair of trees
    await ctx.yield();
    const floor = await caveMesh(48, floorPoint, FLOOR_FRAG, { uArch: { value: S_ARCH }, uGlowAt: { value: new THREE.Vector3(glowAt[0], FLOOR_Y + CLEAR_Y + 2.5, glowAt[1]) }, uFount: { value: new THREE.Vector3(fountAt[0], fountAt[1], fountain.R) } });
    await ctx.yield();
    const rock = await caveMesh(40, rockPoint, ROCK_FRAG, { uAmb: { value: new THREE.Color('#1b244a') }, uShore: { value: S_SHORE }, uArch: { value: S_ARCH } });
    scene.add(floor, rock);
    await ctx.yield();

    // ------------------------------------------------------------ the foot of the stair
    // The chamber lies on the first straight of the route: world x = d, world z = -s.
    const warm = lin('#ffb060'), silverL = [M.silver.leaf.r, M.silver.leaf.g, M.silver.leaf.b];
    const chamberMat = propMaterial(U, { lamp: [trapAt[0], trap.y - 2, trapAt[1], 17], lampColor: new THREE.Color('#ffcf9a').multiplyScalar(2.4), keyDir: [0, 0.35, -1], keyColor: M.silver.leaf.clone().multiplyScalar(0.5), ambient: '#181e36' });
    const cr = R.chamber;
    {
      const b = new Prop(), stone = [0.5, 0.5, 0.55];
      // the line of the stair, from its foot by the arch, back along the left wall, round behind us and up to the hatch
      const line = [];
      for (let i = 0; i <= 12; i++) line.push([lerp(23, -4, i / 12), lerp(-9.7, -12.6, i / 12)]);
      for (let i = 1; i <= 16; i++) { const be = i / 16 * Math.PI; line.push([-4 - 12.6 * Math.sin(be), -12.6 * Math.cos(be)]); }
      for (let i = 1; i <= 4; i++) line.push([lerp(-4, 4, i / 4), lerp(12.6, 10.4, i / 4)]);
      const cum = [0]; for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
      const at = (L) => { let i = 1; while (i < line.length - 1 && cum[i] < L) i++; const t = clamp((L - cum[i - 1]) / (cum[i] - cum[i - 1]), 0, 1), a = line[i - 1], c = line[i]; return [lerp(a[0], c[0], t), lerp(a[1], c[1], t), c[0] - a[0], c[1] - a[1]]; };
      const run = 1.28, rise = 0.385, nSteps = Math.floor(cum[cum.length - 1] / run);
      let prevPost = null;
      for (let k = 0; k < nSteps; k++) {
        const q = at((k + 0.5) * run), tl = Math.hypot(q[2], q[3]) || 1, ts = q[2] / tl, td = q[3] / tl, y = FLOOR_Y + (k + 1) * rise;
        const az = [td, 0, -ts], ax = [ts, 0, td], hy = k < 3 ? (y - FLOOR_Y + 0.4) / 2 : 0.26;
        b.set(mul3(stone, 0.8 + 0.3 * cr()), 0); b.box([q[1], y - hy, -q[0]], 1.95, hy, run * 0.5 + 0.07, ax, az, true);
        // balustrade on the open side: a post on every step, a rail from post to post
        const c1 = [q[1] + ax[0] * 1.78, -q[0] + ax[2] * 1.78], c2 = [q[1] - ax[0] * 1.78, -q[0] - ax[2] * 1.78], c = Math.hypot(c1[0], c1[1] + 6) < Math.hypot(c2[0], c2[1] + 6) ? c1 : c2;
        b.set(mul3(stone, 0.62), 0); b.box([c[0], y + 0.6, c[1]], 0.09, 0.6, 0.09);
        const topP = [c[0], y + 1.25, c[1]];
        if (prevPost) { b.set(mul3(stone, 0.9), 0); b.beam(prevPost, topP, 0.12); }
        prevPost = topP;
        if (k % 8 === 7) await ctx.yield();
      }
      // the broad last step, fanned toward the way out, and the twelve pairs of slippers set down along its edge
      const fc = [STEP.s, STEP.d], fr = STEP.r, fan = [], fy = FLOOR_Y + rise;
      for (let i = 0; i <= 18; i++) { const a = lerp(-0.45, 1.95, i / 18); fan.push([fc[1] + Math.sin(a) * fr, -(fc[0] + Math.cos(a) * fr)]); }
      b.set(mul3(stone, 1.05), 0);
      for (let i = 0; i < 18; i++) {
        const p = fan[i], q = fan[i + 1], c = [fc[1], -fc[0]];
        b.quad([c[0], fy, c[1]], [q[0], fy, q[1]], [p[0], fy, p[1]], [lerp(c[0], p[0], 0.002), fy, lerp(c[1], p[1], 0.002)]);
        b.quad([q[0], FLOOR_Y - 0.3, q[1]], [p[0], FLOOR_Y - 0.3, p[1]], [p[0], fy, p[1]], [q[0], fy, q[1]]);
      }
      const satin = ['#f0a2b6', '#f4ead8', '#ecc874', '#b4cbf2', '#d9b6ee', '#f7c9a8'].map(lin), T = new THREE.Matrix4(), E = new THREE.Euler(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1);
      const slipper = (x, y, z, yaw, col, roll) => {
        E.set(0, yaw, roll, 'YXZ'); T.compose(V.set(x, y, z), Q.setFromEuler(E), S1.set(1.25, 1.25, 1.25)); b.xf(T);
        b.set([0.2, 0.15, 0.11], 0); b.box([0, 0.012, 0], 0.085, 0.012, 0.23);
        b.set(col, 0.22); b.lathe(0, 0.11, [[0.092, 0.02], [0.088, 0.05], [0.062, 0.078], [0.004, 0.088]], 8, 1.3);
        b.lathe(0, -0.15, [[0.07, 0.02], [0.078, 0.07], [0.07, 0.1]], 8, 1.0);
        b.set(mul3(col, 0.7), 0.1); b.box([0, 0.03, -0.02], 0.08, 0.02, 0.1);
        b.set([1, 0.9, 0.75], 0.5); b.lathe(0, 0.13, [[0.001, 0.085], [0.026, 0.1], [0.001, 0.118]], 6, 1);
        b.xf(null);
      };
      for (let i = 0; i < 12; i++) {
        const a = lerp(-0.25, 1.8, (i + 0.5) / 12), r = fr - 0.55, col = satin[(i * 5 + cr.int(0, 2)) % satin.length], ex = Math.sin(a), ez = -Math.cos(a), yaw = Math.atan2(ex, ez);
        for (const sg of [-1, 1]) {
          const tip = cr.chance(0.14), px = fc[1] + ex * r + ez * sg * -0.14, pz = -fc[0] + ez * r + ex * sg * 0.14;
          slipper(px + cr.range(-0.04, 0.04), fy + (tip ? 0.09 : 0), pz + cr.range(-0.04, 0.04), yaw + cr.range(-0.22, 0.22), col, tip ? 1.45 : 0);
        }
        if (i % 3 === 2) await ctx.yield();
      }
      await ctx.yield();
      // the hatch: joists, the square of bedroom light, and the underside of the bed that has sunk into it
      const hx = trapAt[0], hz = trapAt[1], hy0 = trap.y;
      b.set([0.2, 0.13, 0.08], 0);
      for (const sg of [-1, 1]) { b.box([hx + sg * 3.6, hy0 + 0.1, hz], 0.3, 0.45, 4.6, undefined, undefined, true); b.box([hx, hy0 + 0.1, hz + sg * 4.3], 3.9, 0.45, 0.3, undefined, undefined, true); }
      b.set([1, 0.78, 0.5], 5.5); b.quad([hx - 3.4, hy0 + 1.6, hz - 4.1], [hx + 3.4, hy0 + 1.6, hz - 4.1], [hx + 3.4, hy0 + 1.6, hz + 4.1], [hx - 3.4, hy0 + 1.6, hz + 4.1]);
      b.set([0.16, 0.1, 0.06], 0);
      for (let i = 0; i < 7; i++) b.box([hx - 2.1 + i * 0.7, hy0 + 0.75, hz], 0.24, 0.05, 2.9, undefined, undefined, true);
      for (const sg of [-1, 1]) { b.box([hx + sg * 2.45, hy0 + 0.72, hz], 0.12, 0.2, 3.0, undefined, undefined, true); b.box([hx, hy0 + 0.72, hz + sg * 3.0], 2.5, 0.2, 0.12, undefined, undefined, true); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box([hx + sx * 2.4, hy0 + 0.2, hz + sz * 2.95], 0.16, 0.5, 0.16, undefined, undefined, true);
      await ctx.yield();
      const stair = new THREE.Mesh(b.toGeometry(), chamberMat); scene.add(stair);
    }
    await ctx.yield();
    // the way out of the chamber: an arch of dressed stone built into the rock's mouth, its wall coursed to either side and
    // above, a lantern hung on a bracket before the keystone
    {
      const ar = R.arch, b = new Prop(), stone = [0.4, 0.4, 0.44], Rin = 8.4, Rout = 10.5, yC = FLOOR_Y + 7, zF = -S_ARCH, Rm = (Rin + Rout) / 2;
      const T = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1);
      for (const sg of [-1, 1]) {
        b.set(mul3(stone, 0.22), 0); b.box([sg * (Rin + 1.05), FLOOR_Y + 3.2, zF], 0.98, 3.7, 1.2);
        for (let k = 0; k < 6; k++) {
          const xm = Rin + 1.05 + (k % 2 ? 0.36 : -0.36), y = FLOOR_Y + 0.2 + k * 1.2;
          for (const [x0, x1] of [[Rin - 0.03, xm - 0.035], [xm + 0.035, Rin + 2.13]]) { b.set(mul3(stone, ar.range(0.78, 1.1)), 0); b.box([sg * (x0 + x1) / 2, y, zF], (x1 - x0) / 2, 0.555, 1.3 + ar.range(-0.04, 0.07)); }
        }
        b.set(mul3(stone, 1.15), 0); b.box([sg * (Rin + 1.0), yC - 0.1, zF], 1.3, 0.22, 1.55);
      }
      await ctx.yield();
      const nV = 15;
      for (let i = 0; i < nV; i++) {
        const a = (i + 0.5) / nV * Math.PI, key = i === (nV - 1) / 2;
        T.compose(V.set(Math.cos(a) * Rm, yC + 0.12 + Math.sin(a) * Rm, zF), Q.setFromEuler(E.set(0, 0, a - Math.PI / 2)), S1); b.xf(T);
        b.set(mul3(stone, 0.22), 0); b.box([0, 0, 0], Rm * Math.PI / nV / 2 * 1.03, (Rout - Rin) / 2 - 0.1, 1.12, undefined, undefined, true);
        b.set(mul3(stone, key ? 1.2 : ar.range(0.82, 1.1)), 0); b.box([0, key ? 0.12 : 0, 0], Rm * Math.PI / nV / 2 * 0.94, (Rout - Rin) / 2 + (key ? 0.3 : ar.range(0, 0.06)), 1.25 + (key ? 0.2 : ar.range(-0.04, 0.06)), undefined, undefined, true);
        b.xf(null);
      }
      for (let k = 0; k < 19; k++) for (let j = -7; j <= 7; j++) {
        const x = (j + (k % 2 ? 0.5 : 0)) * 2.4, y = FLOOR_Y + 0.2 + k * 1.2, tone = ar.range(0.5, 0.72), proud = ar.range(-0.07, 0.07);
        if (Math.hypot(x, Math.max(y - yC, 0)) < Rout - 0.3 || (y < yC + 0.5 && Math.abs(x) < Rin + 3.2)) continue;
        b.set(mul3(stone, tone), 0); b.box([x, y, zF + 0.15 + proud], 1.17, 0.57, 0.5);
      }
      await ctx.yield();
      // bracket, chain and lantern
      const yK = yC + 0.12 + Rin - 0.25, zL = archAt[2], yL = archAt[1];
      b.set([0.1, 0.09, 0.09], 0); b.beam([0, yK, zF + 1.2], [0, yK, zL + 0.15], 0.09); b.box([0, (yK + yL + 0.75) / 2, zL], 0.035, (yK - yL - 0.75) / 2, 0.035);
      b.set([1, 0.8, 0.52], 3.6); b.box([0, yL, zL], 0.3, 0.42, 0.3, undefined, undefined, true);
      b.set([0.1, 0.08, 0.06], 0); b.lathe(0, zL, [[0.5, yL + 0.42], [0.05, yL + 0.95]], 6); b.box([0, yL - 0.47, zL], 0.34, 0.05, 0.34, undefined, undefined, true);
      lampList2.push({ p: [0, yL, zL], c: lampCols[0], size: 2.3, ph: ar(), kind: 0 });
      scene.add(new THREE.Mesh(b.toGeometry(), propMaterial(U, { lamp: [0, yL, zL, 13], lampWorld: true, lampColor: new THREE.Color('#ffdcb0').multiplyScalar(1.5), keyDir: [0, 0.35, -1], keyColor: M.silver.leaf.clone().multiplyScalar(0.5), ambient: '#222a48' })));
    }
    await ctx.yield();
    const hatchRays = fx.makeGodRays({ rng: R.rays, position: [trapAt[0], trap.y - 0.5, trapAt[1]], direction: [-19, -29, -15], radius: 2.6, count: 7, length: 40, width: [0.7, 3.2], color: '#ffc88a', intensity: 0.26, time: U.uTime, fogAmount: 0.3 });
    scene.add(hatchRays.object);
    await ctx.yield();

    // ------------------------------------------------------------ the three avenues
    const AV = [{ metal: 'silver', a: S_TREES, b: B1 }, { metal: 'gold', a: B1, b: B2 }, { metal: 'diamond', a: B2, b: S_SHORE - 5 }];
    const tr = R.trees, leafK = lerp(0.86, 1.14, (dens - 0.7) / 0.6);
    const variants = [], lods = [];
    for (let i = 0; i < 3; i++) { variants.push(await jewelTreePaced(R.tree[i], { height: tr.range(27, 31), spread: tr.range(10, 11.6), leaves: Math.round(1100 * leafK * detail), leafLen: 0.6, clearY: CLEAR_Y, trunk: tr.range(1.05, 1.3) }, ctx.yield)); await ctx.yield(); }
    for (let i = 0; i < 2; i++) { lods.push(await jewelTreePaced(R.lod[i], { height: tr.range(24, 28), spread: tr.range(9, 10.4), leaves: Math.round(360 * leafK * detail), leafLen: 1.1, clearY: 9, sides: 5, detail: 0 }, ctx.yield)); await ctx.yield(); }
    const leafMat = {}, woodMat = {}, mossMat = {}, trees = [], treeMeshes = [], NC = 6, NBANK = 3;
    for (const m of ['silver', 'gold', 'diamond']) {
      leafMat[m] = kit.leafMaterial(m, {}); woodMat[m] = kit.woodMaterial(m, { canopy: 12, lift: m === 'diamond' ? 0.8 : 1 });
      mossMat[m] = propMaterial(U, { keyDir: [0, 1, 0], keyColor: M[m].leaf.clone().multiplyScalar(1.1), ambient: '#0a1014' });
    }
    const addTree = (list, s, d, sc, lod, ci, rot, v, mir) => {
      if (lakeIn(s, d) > -3 || Math.abs(d) > wallW(s) - 6) return;
      // the rows step back round the fountain: a tree that would stand in the clearing stands on its edge
      const fs = s - fountain.s, fd = Math.hypot(fs, d);
      if (fd < fountain.R) { const k = (fountain.R + 0.6) / Math.max(fd, 0.5); s = fountain.s + fs * k; d *= k; }
      // no trunk stands in the lane we fly: a trunk nearer to the way than WAY_CLEAR steps sideways, away from it, until it is clear
      const off = d >= wayD(s) ? 1 : -1;
      for (let n = 0; n < 8; n++) { const near = wayDist(s, d); if (near >= WAY_CLEAR) break; d += off * (WAY_CLEAR - near + 0.05); }
      const p = route.at(s, d); list.push({ x: p[0], y: ground(s, d) - 0.35, z: p[1], s, d, sc, lod, ci, rot, v, mir });
    };
    // the rows are dealt from a stream of their own: every tree draws its place, size and turn whether it comes to stand or not
    const rw = R.rows, placeTree = (list, s, d, sc, lod, ci) => addTree(list, s, d, sc, lod, ci, rw.range(0, TAU), rw.int(0, 9), false);
    const treeFlip = new THREE.Group(); treeFlip.scale.y = -1; scene.add(treeFlip);
    for (let ai = 0; ai < 3; ai++) {
      const A = AV[ai], list = [], n = Math.floor((A.b - A.a) / spacing);
      for (let k = 0; k < n; k++) {
        const s = A.a + (k + 0.5) * (A.b - A.a) / n, ci = Math.min(NC - 1, Math.floor(k / n * NC));
        for (const sg of [-1, 1]) {
          placeTree(list, s + rw.range(-0.8, 0.8), sg * (9.7 + rw.range(-0.5, 0.9)), treeScale * rw.range(0.92, 1.08), 0, ci);
          placeTree(list, s + spacing * 0.5 + rw.range(-2, 2), sg * (23.5 + rw.range(-2.5, 3)), rw.range(0.85, 1.15), 1, ci);
          if (k % 2 === 0) placeTree(list, s + rw.range(-4, 4), sg * (37 + rw.range(-3, 7)), rw.range(0.8, 1.25), 1, ci);
        }
        if (k % 5 === 4) await ctx.yield();
      }
      if (ai === 2) {      // the diamond trees go on along both banks of the bay, all the way to the palace; the row at the water's edge stands doubled in it
        const bk = R.banks; let k = 0;
        for (let s = S_SHORE + 8; s < S_DOOR + 44; s += 12.5, k++) for (const sg of [-1, 1]) {
          const h = lakeHalf(s), ch = NC + Math.min(NBANK - 1, Math.floor((s - S_SHORE) / 80));
          addTree(list, s + bk.range(-2, 2), sg * (h + 8 + bk.range(-1.5, 2)), bk.range(0.9, 1.15), s < S_SHORE + 60 ? 0 : 1, ch, bk.range(0, TAU), 0, true);
          addTree(list, s + 6 + bk.range(-2, 2), sg * (h + 22 + bk.range(-3, 3)), bk.range(0.9, 1.2), 1, ch, bk.range(0, TAU), 0, false);
        }
      }
      await ctx.yield();
      const dummy = new THREE.Object3D();
      for (let ci = 0; ci < NC + NBANK; ci++) for (let lod = 0; lod < 2; lod++) {
        const sel = list.filter((t) => t.ci === ci && t.lod === lod), v = (ci + ai) % (lod ? 2 : 3); if (!sel.length) continue;
        const G = (lod ? lods : variants)[v], lm = new THREE.InstancedMesh(G.leaves, leafMat[A.metal], sel.length), wm = new THREE.InstancedMesh(G.wood, woodMat[A.metal], sel.length);
        const mir = sel.filter((t) => t.mir), lm2 = mir.length ? new THREE.InstancedMesh(G.leaves, leafMat[A.metal], mir.length) : null, wm2 = mir.length ? new THREE.InstancedMesh(G.wood, woodMat[A.metal], mir.length) : null;
        let j = 0;
        sel.forEach((t, i) => {
          dummy.position.set(t.x, t.y, t.z); dummy.rotation.set(0, t.rot, 0); dummy.scale.setScalar(t.sc); dummy.updateMatrix();
          lm.setMatrixAt(i, dummy.matrix); wm.setMatrixAt(i, dummy.matrix);
          if (t.mir) { lm2.setMatrixAt(j, dummy.matrix); wm2.setMatrixAt(j, dummy.matrix); j++; }
        });
        lm.computeBoundingSphere(); wm.computeBoundingSphere(); lm.boundingSphere.radius += 3; wm.boundingSphere.radius += 1;
        const bank = ci >= NC, sa = bank ? S_SHORE - 10 + (ci - NC) * 80 : lerp(A.a, A.b, ci / NC), sb = bank ? sa + 100 : lerp(A.a, A.b, (ci + 1) / NC);
        scene.add(lm, wm); treeMeshes.push({ m: lm, sa, sb }, { m: wm, sa, sb });
        if (lm2) {      // mirrored: shown from a little before the shore (the avenue hides the water until then)
          lm2.frustumCulled = wm2.frustumCulled = false; treeFlip.add(lm2, wm2);
          treeMeshes.push({ m: lm2, sa: Math.max(sa, S_SHORE + 186), sb }, { m: wm2, sa: Math.max(sa, S_SHORE + 186), sb });
        }
        await ctx.yield();
      }
      A.trees = list; trees.push(...list);
      await ctx.yield();
    }
    // every trunk stands in a soft shade on the floor (black moss between its roots, a drift of leaves against it): one number
    // per floor vertex, from the nearest trunks
    {
      const cell = 12, grid = new Map(), fp = floor.geometry.attributes.position, fs = floor.geometry.attributes.aSh;
      for (const t of trees) { const k = Math.floor(t.x / cell) + ',' + Math.floor(t.z / cell); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(t); }
      for (let i = 0; i < fp.count; i++) {
        if (i % 300 === 299) await ctx.yield();
        const x = fp.getX(i), z = fp.getZ(i), cx = Math.floor(x / cell), cz = Math.floor(z / cell); let sh = 0;
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
          const g = grid.get((cx + a) + ',' + (cz + b)); if (!g) continue;
          for (const t of g) { const r = Math.hypot(t.x - x, t.z - z), w = t.lod ? 0.75 : 1; sh = Math.max(sh, w * (1 - smoothstep(1.2 * t.sc, 7.5 * t.sc, r))); }
        }
        fs.setX(i, sh);
      }
      fs.needsUpdate = true;
    }
    await ctx.yield();

    // ------------------------------------------------------------ leaves on the ground, leaves in the air, the twig that cracks
    const lr = R.leaves, lt = R.litter, unit = () => { let x = lr.gauss(), y = lr.gauss(), z = lr.gauss(); const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
    const falling = [], bursts = [];
    const inBasin = (s, d) => Math.hypot((s - pool.s) * pool.r / pool.len, d - pool.d) < pool.r + 1 || Math.hypot(s - fountain.s, d) < 4.8;
    for (const A of AV) {
      const Lt = new Leaves(), nl = Math.round(2800 * dens * detail);
      for (let i = 0; i < nl; i++) {
        if (i % 50 === 49) await ctx.yield();
        const s = lt.range(A.a - 18, A.b + 18), d = lt.pick([-1, 1]) * (0.7 + 13.5 * Math.pow(lt(), 0.8)), a = lt.range(0, TAU);
        const p = route.at(s, d), ny = [lt.range(-0.3, 0.3), 1, lt.range(-0.3, 0.3)], nl2 = Math.hypot(ny[0], 1, ny[2]), len = lt.range(0.45, 0.9), ph = lt();
        if (s < S_ARCH + 3 || lakeIn(s, d) > -2 || inBasin(s, d)) continue;      // no litter in the chamber, on the lake, the pool or the fountain's water
        Lt.add([p[0], ground(s, d) + 0.08, p[1]], [Math.cos(a), 0.04, Math.sin(a)], [ny[0] / nl2, 1 / nl2, ny[2] / nl2], len, ph);
      }
      await ctx.yield();
      const litter = new THREE.Mesh(Lt.toGeometry(), kit.leafMaterial(A.metal, { tremble: 0.05, gain: 0.8, width: 0.46 })); litter.geometry.computeBoundingSphere(); scene.add(litter);
      const Lf = new Leaves(), nf = Math.round(860 * dens * detail);
      await ctx.yield();
      for (let i = 0; i < nf; i++) {
        if (i % 120 === 119) await ctx.yield();
        const s = lr.range(A.a - 6, A.b + 6), d = lr.range(-16, 16), p = route.at(s, d), ax = unit(), o = unit(), nr = [ax[1] * o[2] - ax[2] * o[1], ax[2] * o[0] - ax[0] * o[2], ax[0] * o[1] - ax[1] * o[0]], l = Math.hypot(nr[0], nr[1], nr[2]) || 1;
        const y = FLOOR_Y + lr.range(17, 25), len = lr.range(0.5, 0.9), ph = lr();
        // leaves fall under the trees, not out over the water, and none comes down within LEAF_CLEAR of the way
        if (s < S_SHORE - 14 && wayDist(s, d) >= LEAF_CLEAR + LEAF_DRIFT) Lf.add([p[0], y, p[1]], ax, [nr[0] / l, nr[1] / l, nr[2] / l], len, ph);
      }
      await ctx.yield();
      const fall = new THREE.Mesh(Lf.toGeometry(), kit.fallingMaterial(A.metal, { fall: 24, floor: FLOOR_Y + 0.12, gain: A.metal === 'gold' ? 1.0 : 1.1, width: 0.46 })); fall.frustumCulled = false; scene.add(fall); falling.push(fall);
      // one twig cracks off a third of the way along each avenue, in the crown of the first row on one side, and its leaves ring
      // down round the foot of that row and over the edge of the walk; none of them starts within LEAF_CLEAR (and its own
      // drift) of the way
      const sC = A.a + (A.b - A.a) / 3, side = lr.pick([-1, 1]), cp = route.at(sC, side * 9.7), cy = FLOOR_Y + 14.5, Lb = new Leaves(), nb = Math.round(560 * detail);
      for (let i = 0; i < nb; i++) {
        if (i % 120 === 119) await ctx.yield();
        const ax = unit(), o = unit(), nr = [ax[1] * o[2] - ax[2] * o[1], ax[2] * o[0] - ax[0] * o[2], ax[0] * o[1] - ax[1] * o[0]], l = Math.hypot(nr[0], nr[1], nr[2]) || 1;
        const q = [cp[0] + lr.gauss() * 1.6, cy + lr.gauss() * 1.1, cp[1] + lr.gauss() * 1.6], len = lr.range(0.45, 0.8), ph = lr(), at = route.locate(q[0], q[2]);
        if (wayDist(at.s, at.d) >= LEAF_CLEAR + LEAF_DRIFT) Lb.add(q, ax, [nr[0] / l, nr[1] / l, nr[2] / l], len, ph);
      }
      const bm = kit.burstMaterial(A.metal, { floor: FLOOR_Y + 0.1, gain: A.metal === 'gold' ? 0.9 : 1.0, width: 0.46 }), burst = new THREE.Mesh(Lb.toGeometry(), bm); burst.frustumCulled = false; scene.add(burst);
      const tb = new Prop(); tb.set([0.09, 0.07, 0.07], 0); tb.box([0, 0, 0], 0.07, 0.07, 1.5, undefined, undefined, true); tb.box([0.35, 0, 0.5], 0.05, 0.05, 0.7, [0.86, 0, 0.5], [-0.5, 0, 0.86], true); tb.box([-0.3, 0, -0.4], 0.045, 0.045, 0.6, [0.8, 0, -0.6], [0.6, 0, 0.8], true);
      const twig = new THREE.Mesh(tb.toGeometry(), mossMat[A.metal]); twig.position.set(cp[0], cy, cp[1]); scene.add(twig);
      bursts.push({ sC, mat: bm, twig, y0: cy, u0: 0, spin: lr.range(1.5, 2.6) });
      await ctx.yield();
    }

    // ------------------------------------------------------------ still water lit from below: the gold pool, the fountain's basins
    const stillWater = (metal, half, gain = 1) => new THREE.ShaderMaterial({
      uniforms: { uTime: U.uTime, uFogCol: U.uFogCol, uFogDen: U.uFogDen, uCol: { value: M[metal].leaf.clone().multiplyScalar(gain) }, uShade: { value: M[metal].shade.clone().multiplyScalar(gain) }, uHalf: { value: new THREE.Vector2(half[0], half[1]) } },
      vertexShader: 'varying vec3 vWp; varying vec2 vQ; void main(){ vQ = position.xz; vec4 wp = modelMatrix*vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }',
      fragmentShader: GLSL_COMMON + /* glsl */`
uniform vec3 uCol, uShade; uniform float uTime; uniform vec2 uHalf; varying vec3 vWp; varying vec2 vQ;
void main(){
  vec3 v = cameraPosition - vWp; float dist = length(v); v /= max(dist, 1e-4);
  float r = length(vQ); vec2 m = vQ*uHalf;
  // rings where a leaf or a drop falls in: one place in every five metres, each on its own period
  vec2 ci = floor(m/5.), cf = m/5. - ci - .5 - (h22(ci) - .5)*.5; float hh = h21(ci + 4.1), ph = fract(uTime/(3. + 3.*hh) + hh), rr = length(cf)*5.;
  float ring = (1.-smoothstep(0., .22, abs(rr - ph*3.2)))*(1.-ph)*(1.-ph);
  // the canopy lies in the water: a glitter of leaves that slides as we move and breaks where the rings pass
  vec2 q = m*1.4 + v.xz*5./max(v.y, .25) + ring*.6;
  q += .12*vec2(vn2(m*1.3 + uTime*.3), vn2(m*1.3 - uTime*.25 + 5.));
  vec2 gi = floor(q), gf = fract(q) - .5 - (h22(gi) - .5)*.5; float gh = h21(gi + 2.7);
  float tw = .5 + .5*sin(uTime*(1. + 2.*gh) + gh*50.); tw *= tw;
  float glit = (1.-smoothstep(0., .2, length(gf*vec2(1., 2.2))))*step(.35, gh)*(.3 + 1.7*tw);
  float mass = smoothstep(.3, .75, vn2(q*.22 + 3.) + .25*vn2(q*.8));
  // leaves afloat, turning slowly
  vec2 lq = m*1.15 + .05*vec2(sin(uTime*.2), cos(uTime*.17)); vec2 li = floor(lq), lf = fract(lq) - .5 - (h22(li + 9.) - .5)*.5; float lh = h21(li + 6.3), la = lh*6.2832 + uTime*.1*(lh - .5);
  lf = vec2(lf.x*cos(la) + lf.y*sin(la), -lf.x*sin(la) + lf.y*cos(la));
  float leaf = (1.-smoothstep(.13, .17, abs(lf.x)*2. + abs(lf.y)))*step(.55, lh);
  float fres = 1.-clamp(v.y, 0., 1.); fres *= fres;
  float depth = 1.-smoothstep(.3, 1., r);
  vec3 col = uShade*(.07 + .22*depth) + uCol*(.05 + .17*fres)*(.55 + .45*mass) + uCol*glit*(.4 + .6*mass) + uCol*ring*.3;
  col = mix(col, uCol*(.45 + .75*lh), leaf);
  col *= 1.-.75*smoothstep(.9, 1., r);
  gl_FragColor = vec4(fogged(col, dist, 1.), 1.);
}`,
    });
    const disc = (mat, s, d, y, half) => {
      const f = route.frame(s), p = route.at(s, d), m = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), mat);
      m.position.set(p[0], y, p[1]); m.rotation.y = Math.PI / 2 - f.h; m.scale.set(half[0], 1, half[1]); scene.add(m); return m;
    };
    // the gold pool: a kerb of dressed stones, each a little out of true, and the water inside it
    {
      const b = new Prop(), n = 44, f = route.frame(pool.s), c = route.at(pool.s, 0), L = pool.len + 0.45, Wd = pool.r + 0.45;
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU, ca = Math.cos(a), sa = Math.sin(a), al = L * ca, ac = Wd * sa, tl = Math.hypot(L * sa, Wd * ca), ta = -L * sa / tl, tc = Wd * ca / tl;
        const x = c[0] + f.fx * al + f.rx * ac, z = c[1] + f.fz * al + f.rz * ac, tx = f.fx * ta + f.rx * tc, tz = f.fz * ta + f.rz * tc;
        b.set(mul3([0.33, 0.3, 0.26], ft.range(0.6, 1.15)), 0.02);
        b.box([x, FLOOR_Y - 0.2 + ft.range(-0.05, 0.08), z], tl * Math.PI / n * 0.9, 0.62 + ft.range(-0.06, 0.02), 0.42 + ft.range(-0.04, 0.06), [tx, 0, tz], [-tz, 0, tx]);
      }
      scene.add(new THREE.Mesh(b.toGeometry(), propMaterial(U, { keyDir: [0, 1, 0], keyColor: M.gold.leaf.clone().multiplyScalar(0.6), ambient: '#201707' })));
      disc(stillWater('gold', [pool.len + 0.2, pool.r + 0.2]), pool.s, 0, FLOOR_Y - 0.3, [pool.len + 0.2, pool.r + 0.2]);
    }
    await ctx.yield();
    // the silver fountain in its clearing: a broad basin, a stem, an upper bowl that spills in sheets, a jet
    const fountainAt = route.at(fountain.s, 0);
    {
      const b = new Prop(), stone = [0.3, 0.32, 0.4];
      b.set(stone, 0.02); b.lathe(0, 0, [[4.15, -0.4], [4.25, 0.55], [4.05, 1.0], [3.55, 1.0], [3.5, 0.6]], 28);
      b.set(mul3(stone, 0.9), 0.02); b.lathe(0, 0, [[1.1, 0.3], [0.75, 1.2], [0.45, 2.2], [0.6, 2.9], [1.9, 3.3], [2.08, 3.55], [1.86, 3.6], [0.5, 3.42]], 20);
      b.set(mul3(stone, 1.1), 0.05); b.lathe(0, 0, [[0.36, 3.4], [0.24, 4.2], [0.5, 4.6], [0.3, 5.0], [0.03, 5.5]], 12);
      const fm = new THREE.Mesh(b.toGeometry(), propMaterial(U, { lamp: [0, 1.6, 0, 5.5], lampColor: M.silver.leaf.clone().multiplyScalar(0.8), keyDir: [0, 1, 0], keyColor: M.silver.leaf.clone().multiplyScalar(0.6), ambient: '#1c2444' }));
      fm.position.set(fountainAt[0], FLOOR_Y, fountainAt[1]); scene.add(fm);
      disc(stillWater('silver', [3.56, 3.56], 1.15), fountain.s, 0, FLOOR_Y + 0.8, [3.56, 3.56]);
      disc(stillWater('silver', [1.9, 1.9], 1.3), fountain.s, 0, FLOOR_Y + 3.5, [1.9, 1.9]);
      // falling water: sheets from the upper bowl's lip, and the jet above the finial
      const fallMat = (lobes, speed) => new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uTime: U.uTime, uCol: { value: M.silver.leaf }, uLobes: { value: lobes }, uSpeed: { value: speed } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
        fragmentShader: GLSL_COMMON + /* glsl */`
uniform float uTime, uLobes, uSpeed; uniform vec3 uCol; varying vec2 vUv;
void main(){
  float sheet = mix(1., smoothstep(-.2, .5, sin(vUv.x*6.2832*uLobes)), step(.5, uLobes));
  float st = vn2(vec2(vUv.x*70., vUv.y*3. + uTime*uSpeed)), st2 = vn2(vec2(vUv.x*26., vUv.y*1.4 + uTime*uSpeed*.7));
  float a = sheet*(.2 + .8*st*st2)*smoothstep(0., .1, vUv.y)*(1.-smoothstep(.88, 1., vUv.y));
  gl_FragColor = vec4(uCol*a*.38, 1.);
}`,
      });
      const sheets = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.75, 2.75, 36, 4, true), fallMat(7, 2.4)); sheets.position.set(fountainAt[0], FLOOR_Y + 0.8 + 1.375, fountainAt[1]); sheets.renderOrder = 4; scene.add(sheets);
      const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.07, 2.4, 10, 3, true), fallMat(0, -3.2)); jet.position.set(fountainAt[0], FLOOR_Y + 5.4 + 1.2, fountainAt[1]); jet.renderOrder = 4; scene.add(jet);
    }
    await ctx.yield();
    // the fallen diamond bough: torn end by the row it fell from, its crown across the walk, every leaf still on it
    const boughAt = route.at(bough.s, bough.side * bough.from);
    {
      const f = route.frame(bough.s), ds = Math.sqrt(Math.max(bough.len * bough.len - bough.across * bough.across, 1)), dx = f.fx * ds - f.rx * bough.side * bough.across, dz = f.fz * ds - f.rz * bough.side * bough.across, rot = Math.atan2(-dz, dx);
      // a leaf of the bough that would hang within LEAF_CLEAR of the way (height counted) is not on it
      const cr0 = Math.cos(rot), sr0 = Math.sin(rot);
      const keep = (x, y, z) => { const at = route.locate(boughAt[0] + x * cr0 + z * sr0, boughAt[1] - x * sr0 + z * cr0); return Math.hypot(wayDist(at.s, at.d), wayY(at.s) - (FLOOR_Y - 0.12 + y)) >= LEAF_CLEAR; };
      const G = jewelBoughGeometry(R.bough, { length: bough.len, radius: 1.05, leaves: Math.round(800 * leafK * detail), keep });
      for (const m of [new THREE.Mesh(G.wood, kit.woodMaterial('diamond', { canopy: 1.6, lift: 2.2 })), new THREE.Mesh(G.leaves, leafMat.diamond)]) { m.position.set(boughAt[0], FLOOR_Y - 0.12, boughAt[1]); m.rotation.y = rot; m.geometry.computeBoundingSphere(); scene.add(m); }
    }
    await ctx.yield();

    // ------------------------------------------------------------ mineral glints in the vault and the walls
    const gr = R.glints, glintList = [];
    for (let i = 0, n = Math.round(5200 * detail); i < n; i++) {
      if (i % 100 === 99) await ctx.yield();
      const s = gr.range(S_ARCH + 16, S_END - 40), t = gr.range(0.05, 0.95), seam = Math.abs(noise.n2(s * 0.016, t * 5.5)), knot = noise.n2(s * 0.05 + 40, t * 17);
      if (seam > 0.07 && knot < 0.62) continue;
      const q = rockPoint(s, t), m = metalAt(s), far = smoothstep(S_SHORE - 30, S_SHORE + 80, s), k = gr.range(0.45, 1.2);
      const c = [0.55 * k + 0.5 * m[1] * k, 0.65 * k + 0.25 * m[1] * k, 1.0 * k - 0.45 * m[1] * k];
      glintList.push({ p: [q[0], q[1], q[2]], c, size: gr.range(0.3, 0.7) * (1 + 1.2 * far), ph: gr(), kind: 2 });
      if (s > S_SHORE && q[1] > 3 && q[1] < 60) glintList.push({ p: [q[0], -q[1], q[2]], c: mul3(c, 0.6), size: gr.range(0.3, 0.6) * (1 + 1.2 * far), ph: gr(), kind: 2, mirror: 1 });
    }
    await ctx.yield();

    // ------------------------------------------------------------ the palace across the water (hero) and the black lake
    const hero = await buildHero(ctx, { kit, water: false, festive: 0.35 + 0.65 * mood, rng: R.hero });
    {
      const f = route.frame(S_DOOR + PALACE.doorZ), p = route.at(S_DOOR + PALACE.doorZ, 0);
      hero.object.position.set(p[0], 0, p[1]); hero.object.rotation.y = Math.atan2(-f.fx, -f.fz); hero.object.scale.setScalar(PK); hero.object.updateMatrixWorld(true); scene.add(hero.object);
    }
    const portalAt = hero.object.localToWorld(hero.anchors.portal.clone()), gazeAt = hero.object.localToWorld(hero.anchors.gaze.clone());
    await ctx.yield();
    // ------------------------------------------------------------ dripstone: spikes behind the rows, the vault's teeth over the water
    const spikeGeo = (() => {
      const b = new Prop(), rows = [], prof = [[1, 0], [0.62, 0.28], [0.28, 0.64], [0.03, 1]];
      for (const [r, y] of prof) { const row = []; for (let i = 0; i < 6; i++) { const a = -i / 6 * TAU, k = 1 + 0.2 * Math.sin(a * 2 + y * 5); row.push([Math.cos(a) * r * k, y, Math.sin(a) * r * k]); } rows.push(row); }
      b.set([0.2, 0.2, 0.26], 0); b.loft(rows, true, false, [0.45, 0.7, 1.0, 1.3]); return b.toGeometry();      // dark at the root, pale at the tip, which is what catches the light
    })();
    const sr = R.spikes, tt = R.teeth, _sp = new THREE.Object3D(); let hangMesh = null;
    const spikes = (list, mat, parent, rr) => {
      const im = new THREE.InstancedMesh(spikeGeo, mat, list.length);
      list.forEach((q, i) => { _sp.position.set(q.x, q.y, q.z); _sp.rotation.set(q.down ? Math.PI : rr.range(-0.08, 0.08), rr.range(0, TAU), rr.range(-0.08, 0.08)); _sp.scale.set(q.r, q.h, q.r); _sp.updateMatrix(); im.setMatrixAt(i, _sp.matrix); });
      im.computeBoundingSphere(); parent.add(im); return im;
    };
    for (const A of AV) {
      const list = [];
      for (let i = 0; i < 44; i++) {
        const s = tt.range(A.a, A.b), sg = tt.pick([-1, 1]), W = wallW(s), d = sg * tt.range(27, Math.max(29, W - 7)), p = route.at(s, d);
        const big = tt.chance(0.3), q = { x: p[0], y: ground(s, d) - 0.6, z: p[1], r: big ? tt.range(1.8, 3.2) : tt.range(0.7, 1.6), h: big ? tt.range(9, 17) : tt.range(3, 8) };
        if (lakeIn(s, d) < -4 && Math.abs(d) < wallW(s) - 3) list.push(q);
      }
      spikes(list, propMaterial(U, { keyDir: [0, 1, 0], keyColor: M[A.metal].leaf.clone().multiplyScalar(0.42), ambient: '#0e1228' }), scene, tt);
      await ctx.yield();
    }
    {
      const lakeMat = (mirror) => propMaterial(U, { lamp: [gazeAt.x, 34, gazeAt.z, 200], lampWorld: true, lampColor: hero.palette.win.clone().multiplyScalar(2.6), keyDir: [0, -1, 0], keyColor: M.diamond.leaf.clone().multiplyScalar(0.12), ambient: '#1c264e', mirror });
      const hang = [], _hl = new THREE.Vector3();
      // a stalactite never reaches down into the palace's roofs
      const hangOne = (q, r, h) => {
        _hl.set(q[0], 0, q[2]); hero.object.worldToLocal(_hl);
        if (Math.abs(_hl.x) < 92 && _hl.z > -42 && _hl.z < 16) h = Math.min(h, q[1] - PALACE.height * PK - 6);
        if (h > 5) hang.push({ x: q[0], y: q[1] + 2, z: q[2], r: Math.min(r, h * 0.2), h, down: true });
      };
      for (let i = 0; i < 90; i++) {
        const s = sr.range(S_SHORE - 30, S_DOOR + 90), t = sr.range(0.16, 0.84), q = rockPoint(s, t), big = sr.chance(0.25);
        hangOne(q, big ? sr.range(4, 8) : sr.range(1.5, 3.6), big ? sr.range(26, 46) : sr.range(8, 22));
        if (i % 30 === 29) await ctx.yield();
      }
      // and they hang in ranks across the vault, one rank behind another to the far wall, each catching the palace's light from below
      const vr = R.vault;
      for (let s = S_SHORE + 6; s < S_DOOR + 120; s += vr.range(20, 30)) {
        for (let t = 0.07 + vr.range(0, 0.04); t < 0.93; t += vr.range(0.028, 0.05)) {
          const q = rockPoint(s + vr.range(-3, 3), t), big = vr.chance(0.3), h = (big ? vr.range(22, 40) : vr.range(9, 20)) * (0.5 + 0.5 * Math.sin(Math.PI * t));
          hangOne(q, h * vr.range(0.11, 0.17), h);
        }
        await ctx.yield();
      }
      hangMesh = spikes(hang, lakeMat(false), scene, vr);
      await ctx.yield();
      // fallen leaves of all three metals ride the black water and catch the palace light
      const af = R.afloat;
      for (let i = 0, n = Math.round(460 * dens); i < n; i++) {
        if (i % 120 === 119) await ctx.yield();
        const s = af.range(S_SHORE + 2, S_DOOR - 6), d = (af() + af() + af() - 1.5) * 130, w = af(), k = af.range(0.5, 1.1), size = af.range(0.22, 0.5), ph = af();
        if (ground(s, d) > -1) continue;
        const p = route.at(s, d), c = w < 0.6 ? [0.86, 0.95, 1] : w < 0.85 ? [1, 0.72, 0.26] : [0.7, 0.78, 1];
        glintList.push({ p: [p[0], 0.06, p[1]], c: mul3(c, k), size, ph, kind: 2 });
      }
    }
    await ctx.yield();
    const glints = kit.makeSparks(glintList, { gain: 1.1, fogK: 0.5, renderOrder: 5 }); scene.add(glints.mesh);
    await ctx.yield();
    const fEnd = route.frame(S_DOOR), lakeGeo = new THREE.BufferGeometry();
    {
      const c = [route.at(S_SHORE - 40, -290), route.at(S_SHORE - 40, 290), route.at(S_END, 290), route.at(S_END, -290)], P = [];
      for (const q of c) P.push(q[0], 0, q[1]);
      lakeGeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); lakeGeo.setIndex([0, 1, 2, 0, 2, 3]);
    }
    const lake = new THREE.Mesh(lakeGeo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uTime: U.uTime, uFogCol: U.uFogCol, uFogDen: U.uFogDen, uPalace: { value: new THREE.Vector3(gazeAt.x, 30, gazeAt.z) }, uWarmCol: { value: hero.palette.win }, uDeep: { value: new THREE.Color('#0a1024') } },
      vertexShader: 'varying vec3 vWp; void main(){ vec4 wp = modelMatrix*vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }',
      fragmentShader: GLSL_COMMON + /* glsl */`
uniform vec3 uPalace, uWarmCol, uDeep; uniform float uTime; varying vec3 vWp;
void main(){
  vec3 v = cameraPosition - vWp; float dist = length(v); v /= max(dist, 1e-4);
  vec2 q = vWp.xz;
  // black glass with a gentle ripple: long low swells and cat's-paws. The mirrored world shows whole in the still water and
  // breaks into dashes where it is ruffled
  float n1 = fbm2(q*.06 + vec2(uTime*.03, 0.)), n2 = vn2(q*.5 + vec2(-uTime*.12, uTime*.08)), n3 = vn2(q*1.7 + vec2(uTime*.2, 9. - uTime*.15));
  vec3 n = normalize(vec3((n1-.5)*.09 + (n2-.5)*.05, 1., (n3-.5)*.05 + (n2-.5)*.04));
  float fres = 1.-clamp(dot(n, v), 0., 1.); fres = fres*fres; fres *= fres;
  float ruffle = smoothstep(.5, .78, n2*.6 + n3*.4 + (n1 - .5)*.5);
  vec3 r = reflect(-v, n);
  vec2 toP = uPalace.xz - vWp.xz; float dp = length(toP); vec2 dP = toP/max(dp, 1e-3);
  // the palace's light lies on the water as a road of broken gold
  float road = clamp(dot(normalize(r.xz + vec2(1e-5)), dP), 0., 1.); road *= road; road *= road; road *= road;
  float glit = smoothstep(.55, .9, vn2(vec2(dot(q, vec2(-dP.y, dP.x))*.35, dot(q, dP)*1.6 + uTime*.3)))*(.4 + .6*n3);
  float sheen = road*smoothstep(-.02, .08, r.y)*(1.-smoothstep(.1, .55, r.y))/(1. + dp*dp/60000.);
  // and the veins of the vault lie in it as long wavering threads of blue
  vec2 cp = (q + r.xz*(110./max(r.y, .08)))*.012;
  float vein = (1.-smoothstep(0., .07, abs(fbm2(vec2(cp.x*1.3, cp.y*9.) + 9.) - .5)))*smoothstep(.35, .6, vn2(cp*1.4 + 5.));
  vec3 col = uDeep*(.16 + .9*fres + .3*ruffle) + vec3(.04,.06,.13)*ruffle*fres + vec3(.3,.5,1.)*vein*.09*(1.-.6*ruffle) + uWarmCol*sheen*(.1 + 1.3*glit)*.6;
  float a = clamp(.34 + .3*fres + .3*ruffle + sheen*.25, 0., .93);
  gl_FragColor = vec4(fogged(col, dist, .7)*a, a);
}`,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    }));
    lake.renderOrder = 2; lake.frustumCulled = false; scene.add(lake);
    await ctx.yield();

    // ------------------------------------------------------------ the landing where the boats put out, and the lantern piles of their lane
    const pr = R.piles;
    {
      // four courses of steps down into the water at the head of the bay, and a lamp standard at either end of the top step
      const b = new Prop(), stone = [0.2, 0.2, 0.215], f = route.frame(quayS), ax = [f.rx, 0, f.rz], az = [f.fx, 0, f.fz];
      for (let k = 0; k < 4; k++) for (let j = -3; j <= 3; j++) { const c = route.at(quayS + 0.6 + k * 1.05, (j + (k % 2 ? 0.25 : -0.25)) * 2.1); b.set(mul3(stone, pr.range(0.55, 1.1)), 0); b.box([c[0], FLOOR_Y - 1.6 - k * 0.72 + pr.range(-0.03, 0.03), c[1]], 1.0, 1.8, 0.5, ax, az); }
      for (const L of quayLamps) {
        b.set(mul3(stone, 0.8), 0); b.lathe(L[0], L[2], [[0.75, FLOOR_Y - 0.6], [0.7, FLOOR_Y + 0.5], [0.45, FLOOR_Y + 0.7], [0.2, FLOOR_Y + 0.9], [0.13, L[1] - 0.6], [0.3, L[1] - 0.45]], 8);
        b.set([1, 0.8, 0.52], 1.5); b.box([L[0], L[1], L[2]], 0.3, 0.42, 0.3, ax, az, true);
        b.set([0.1, 0.08, 0.06], 0); b.lathe(L[0], L[2], [[0.5, L[1] + 0.42], [0.04, L[1] + 0.95]], 6);
        lampList2.push({ p: [L[0], L[1], L[2]], c: lampCols[0], size: 1.5, ph: pr(), kind: 0 }, { p: [L[0], -L[1], L[2]], c: lampCols[0], size: 1.2, ph: pr(), kind: 0, mirror: 1 });
      }
      const qc = route.at(quayS, 0);
      scene.add(new THREE.Mesh(b.toGeometry(), propMaterial(U, { lamp: [qc[0], FLOOR_Y + 4.5, qc[1], 9], lampWorld: true, lampColor: new THREE.Color('#ffc890').multiplyScalar(1.1), keyDir: [0, 1, 0], keyColor: M.diamond.leaf.clone().multiplyScalar(0.3), ambient: '#1a2242' })));
    }
    await ctx.yield();
    {
      // piles: old timber standing in the water, a lantern on each, its light and its own image under it
      const b = new Prop();
      b.set([0.2, 0.14, 0.09], 0); b.lathe(0, 0, [[0.36, -3], [0.33, 1.2], [0.28, 3.5], [0.34, 3.62], [0.34, 3.9], [0.1, 3.98]], 7);
      b.set([0.1, 0.08, 0.07], 0); b.box([0, 4.12, 0], 0.045, 0.16, 0.045);
      b.set([1, 0.8, 0.52], 3.4); b.box([0, 4.58, 0], 0.2, 0.3, 0.2, undefined, undefined, true);
      b.set([0.1, 0.08, 0.06], 0); b.lathe(0, 0, [[0.34, 4.88], [0.03, 5.25]], 6);
      const geo = b.toGeometry(), list = [], _p = new THREE.Object3D(), _v = new THREE.Vector3();
      for (let s = S_SHORE + 22; s < S_FOOT - 8; s += 21) for (const sg of [-1, 1]) {
        const ss = s + pr.range(-2.5, 2.5), d = sg * (27 + pr.range(-1.5, 2.5)), sc = pr.range(0.85, 1.2), lean = [pr.range(-0.06, 0.06), pr.range(0, TAU), pr.range(-0.06, 0.06)], c = pr.pick(lampCols), ph = pr();
        if (lakeIn(ss, d) < 4) continue;
        list.push({ p: route.at(ss, d), sc, lean, c, ph });
      }
      const props = { lamp: [0, 4.58, 0, 2.6], lampColor: new THREE.Color('#ffc070').multiplyScalar(3.6), keyDir: [fEnd.fx, 0.3, fEnd.fz], keyColor: hero.palette.win.clone().multiplyScalar(0.4), ambient: '#1a2244' };
      const im = new THREE.InstancedMesh(geo, propMaterial(U, props), Math.max(list.length, 1)), im2 = new THREE.InstancedMesh(geo, propMaterial(U, { ...props, mirror: true }), Math.max(list.length, 1));
      list.forEach((q, i) => {
        _p.position.set(q.p[0], 0, q.p[1]); _p.rotation.set(q.lean[0], q.lean[1], q.lean[2]); _p.scale.setScalar(q.sc); _p.updateMatrix(); im.setMatrixAt(i, _p.matrix);
        _v.set(0, 4.58, 0).applyMatrix4(_p.matrix);
        lampList2.push({ p: [_v.x, _v.y, _v.z], c: q.c, size: 1.5, ph: q.ph, kind: 0 }, { p: [_v.x, -_v.y, _v.z], c: q.c, size: 1.2, ph: q.ph, kind: 0, mirror: 1 });
      });
      im.count = im2.count = list.length; im2.instanceMatrix = im.instanceMatrix; im.frustumCulled = im2.frustumCulled = false;
      const flip = new THREE.Group(); flip.scale.y = -1; flip.add(im2); scene.add(im, flip);
    }
    const lakeLamps = kit.makeSparks(lampList2, { gain: 1.2, renderOrder: 6 }); scene.add(lakeLamps.mesh);
    await ctx.yield();

    // drips from the vault: a streak coming down (two upright ribbons crossed), then rings opening on the black glass (each on its own period)
    const dr = R.drips, nDrip = 18, dripGeo = new THREE.InstancedBufferGeometry(), dI = new Float32Array(nDrip * 4), dJ = new Float32Array(nDrip * 2);
    dripGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, -1, 1, 0, 1, 1, 0, 1, 2, 0, -1, 2, 0, 0, 1, -1, 0, 1, 1, 0, 2, 1, 0, 2, -1], 3)); dripGeo.setIndex([0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11]);
    for (let i = 0; i < nDrip; i++) {
      const p = route.at(dr.range(S_SHORE + 14, S_FOOT - 10), dr.pick([-1, 1]) * dr.range(5, 46));
      dI.set([p[0], p[1], dr.range(3.2, 7), dr()], i * 4); dJ.set([dr.range(3.5, 6.5), dr.range(26, 44)], i * 2);
    }
    dripGeo.setAttribute('iA', new THREE.InstancedBufferAttribute(dI, 4)); dripGeo.setAttribute('iB', new THREE.InstancedBufferAttribute(dJ, 2)); dripGeo.instanceCount = nDrip;
    const drips = new THREE.Mesh(dripGeo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uTime: U.uTime },
      vertexShader: /* glsl */`
attribute vec4 iA; attribute vec2 iB; uniform float uTime; varying vec3 vP; varying float vT;
void main(){
  float t = fract(uTime/max(iA.z, .5) + iA.w); vT = t; vec3 p;
  if (position.y < .5) { p = vec3(iA.x + position.x*iB.x, .05, iA.y + position.z*iB.x); vP = vec3(position.xz, 0.); }
  else {
    float fall = clamp((t - .88)/.12, 0., 1.), y = iB.y*(1.-fall*fall);
    p = vec3(iA.x + position.x*.07, y + (position.y - 1.5)*1.5, iA.y + position.z*.07); vP = vec3(position.x + position.z, position.y - 1.5, 1.);
  }
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
}`,
      fragmentShader: /* glsl */`
varying vec3 vP; varying float vT;
void main(){
  vec3 col;
  if (vP.z < .5) {
    float r = length(vP.xy), tt = clamp(vT/.6, 0., 1.), rad = sqrt(tt)*.92;
    float ring = (1.-smoothstep(.0, .05, abs(r - rad))) + .5*(1.-smoothstep(.0, .04, abs(r - rad*.6)));
    col = vec3(.5, .62, .9)*ring*(1.-tt)*(1.-tt)*step(vT, .6)*.55;
  } else col = vec3(.7, .8, 1.)*(1.-abs(vP.x))*(1.-smoothstep(.2, .5, abs(vP.y)))*step(.88, vT)*.6;
  gl_FragColor = vec4(col, 1.);
}`,
    }));
    drips.frustumCulled = false; drips.renderOrder = 3; scene.add(drips);
    await ctx.yield();

    // ------------------------------------------------------------ twelve boats, each rowed across
    const br = R.boats, DUR = 48;
    const boatGeo = (() => {
      const b = new Prop(), wood = [0.2, 0.125, 0.07], rows = [], rowsIn = [];
      for (let i = 0; i <= 10; i++) {
        const uu = i / 10 * 2 - 1, w = 0.92 * Math.pow(Math.max(1 - Math.pow(Math.abs(uu), 2.4), 0.0004), 0.55), sheer = 0.5 + 0.42 * uu * uu, keel = -0.24 * (1 - uu * uu * uu * uu), row = [], rin = [];
        for (let j = 0; j <= 6; j++) { const a = (j / 6 * 2 - 1) * Math.PI / 2, x = Math.sin(a) * w, y = lerp(keel, sheer, Math.pow(Math.abs(Math.sin(a)), 1.6)); row.push([x, y, uu * 2.7]); rin.push([x * 0.9, Math.max(y, keel + 0.1) + (j === 0 || j === 6 ? 0 : 0.03), uu * 2.62]); }
        rows.push(row); rowsIn.push(rin);
      }
      b.set(wood, 0); b.loft(rows, false, true); b.set(mul3(wood, 1.5), 0); b.loft(rowsIn, false, false);
      b.set(mul3(wood, 1.8), 0); b.box([0, 0.36, -0.5], 0.8, 0.03, 0.14); b.box([0, 0.36, 1.1], 0.7, 0.03, 0.14); b.box([0, 0.4, -1.75], 0.55, 0.03, 0.2);
      // the rower, cloaked and hooded, and the one who is being rowed
      const cloak = (x, z, h, col, lean) => {
        b.set(col, 0); b.lathe(x, z, [[0.4, 0.3], [0.36, 0.3 + h * 0.45], [0.23, 0.3 + h * 0.8], [0.16, 0.3 + h * 0.9]], 8, 0.85);
        b.set(mul3(col, 0.8), 0); b.lathe(x, z + lean, [[0.15, 0.3 + h * 0.86], [0.2, 0.3 + h * 0.98], [0.17, 0.3 + h * 1.1], [0.02, 0.3 + h * 1.17]], 8, 1.05);
      };
      cloak(0, -0.5, 1.05, [0.07, 0.085, 0.2], 0.08); cloak(0, -1.75, 0.92, [0.5, 0.42, 0.55], 0.04);
      // prow lantern on a crook
      b.set([0.12, 0.09, 0.06], 0); b.box([0, 1.05, 2.5], 0.035, 0.75, 0.035); b.box([0, 1.82, 2.68], 0.03, 0.03, 0.2);
      b.set([1, 0.82, 0.52], 3.2); b.box([0, 1.55, 2.86], 0.13, 0.19, 0.13, undefined, undefined, true);
      b.set([0.1, 0.08, 0.06], 0); b.lathe(0, 2.86, [[0.19, 1.74], [0.02, 1.86]], 6);
      return b.toGeometry();
    })();
    await ctx.yield();
    const oarGeo = (() => { const b = new Prop(); b.set([0.3, 0.2, 0.12], 0); b.box([1.15, 0, 0], 1.5, 0.03, 0.03, undefined, undefined, true); b.set([0.36, 0.25, 0.15], 0); b.box([2.55, 0, 0], 0.42, 0.016, 0.11, undefined, undefined, true); return b.toGeometry(); })();
    const boatProps = { lamp: [0, 1.55, 2.86, 1.7], lampColor: new THREE.Color('#ffc070').multiplyScalar(4.2), keyDir: [fEnd.fx, 0.3, fEnd.fz], keyColor: hero.palette.win.clone().multiplyScalar(0.5), ambient: '#1a2448' };
    const NB = 12, boatMat = propMaterial(U, { ...boatProps, side: THREE.DoubleSide }), boatMatM = propMaterial(U, { ...boatProps, side: THREE.DoubleSide, mirror: true });
    const boatMesh = new THREE.InstancedMesh(boatGeo, boatMat, NB), oarMesh = new THREE.InstancedMesh(oarGeo, boatMat, NB * 2);
    const boatMir = new THREE.InstancedMesh(boatGeo, boatMatM, NB); boatMir.instanceMatrix = boatMesh.instanceMatrix;
    const mirRoot = new THREE.Group(); mirRoot.scale.y = -1; mirRoot.add(boatMir);
    for (const m of [boatMesh, oarMesh, boatMir]) m.frustumCulled = false;
    scene.add(boatMesh, oarMesh, mirRoot);
    await ctx.yield();
    // The boats leave the landing one after another, a few seconds apart (the gap is the boats' own draw), and each is rowed
    // across at its own speed to its place in the queue at the foot of the water stair; the last one puts out as we come to
    // the landing. lag = how many seconds before the last boat this one put out; t0 (set once the flight is known) = the
    // second of the flight at which it puts out. The ones that have arrived lie moored by the stair.
    const boats = [], gap = br.range(4.4, 5.6);
    for (let i = 0; i < NB; i++) {
      const moored = i < arrived, k = i - arrived, nRow = NB - arrived, side = i % 2 ? 1 : -1;
      boats.push(moored
        ? { moored, s: S_FOOT - 4 + br.range(-1.5, 1.5) - Math.floor(i / 2) * 4.5, d: side * (PK * 12.4 + 1.6 + Math.floor(i / 2) * 2.6), yaw: side * br.range(0.9, 1.3), ph: br.range(0, TAU), v: 0 }
        : { moored, lag: (nRow - 1 - k) * gap + br.range(0, 0.4) * gap, t0: 0, d: side * br.range(7.5, 19) * (0.7 + 0.5 * k / nRow), yaw: br.range(-0.08, 0.08), ph: br.range(0, TAU), v: br.range(1.25, 1.9), rate: br.range(1.5, 1.9) });
    }
    const lampList = [];
    for (let i = 0; i < NB; i++) { lampList.push({ p: [0, 0, 0], c: mul3(lin('#ffc070'), 1.5), size: 1.25, ph: br(), kind: 0 }); lampList.push({ p: [0, 0, 0], c: mul3(lin('#ffc070'), 1.5), size: 1.0, ph: br(), kind: 0, mirror: 1 }); }
    const boatLamps = kit.makeSparks(lampList, { gain: 1.2, renderOrder: 6 }); boatLamps.attribute.setUsage(THREE.DynamicDrawUsage); scene.add(boatLamps.mesh);
    // wakes: a quad behind each boat, drawn on the water
    const wakeGeo = new THREE.BufferGeometry(); wakeGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 0, 1, -1, 0, 1], 3)); wakeGeo.setIndex([0, 2, 1, 0, 3, 2]);
    const wakeMesh = new THREE.InstancedMesh(wakeGeo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uTime: U.uTime, uCol: { value: new THREE.Color('#ffc890') } },
      vertexShader: 'varying vec2 vQ; void main(){ vQ = position.xz; gl_Position = projectionMatrix*viewMatrix*modelMatrix*instanceMatrix*vec4(position, 1.); }',
      fragmentShader: /* glsl */`
uniform float uTime; uniform vec3 uCol; varying vec2 vQ;
void main(){
  float y = vQ.y, ax = abs(vQ.x), arm = abs(ax - y*.85);
  float w = (1.-smoothstep(.0, .05 + y*.07, arm))*(1.-y)*(1.-y);
  float rip = .5+.5*sin(y*46. - uTime*4. + ax*9.);
  float inner = (1.-smoothstep(.0, y*.8 + .02, ax))*(1.-y)*rip*.5;
  vec3 col = mix(vec3(.45,.55,.85), uCol, 1.-y)*(w*.7 + inner*.28)*smoothstep(0., .04, y);
  gl_FragColor = vec4(col, 1.);
}`,
    }), NB);
    wakeMesh.frustumCulled = false; wakeMesh.renderOrder = 3; scene.add(wakeMesh);
    const _d = new THREE.Object3D(), _o = new THREE.Object3D(), _v3 = new THREE.Vector3(), _m4 = new THREE.Matrix4(), _zero = new THREE.Matrix4().makeScale(0, 0, 0);
    const placeBoats = (clock, time) => {
      for (let i = 0; i < NB; i++) {
        const bt = boats[i], sMax = S_STOP - (i - arrived) * 2.2, away = clock - bt.t0;
        const s = bt.moored ? bt.s : Math.min(S_PUT + bt.v * Math.max(away, 0), sMax), rowing = !bt.moored && away > 0 && s < sMax - 0.01;
        // off the steps the boats lie close together, and they fan out to their lanes over the first forty metres
        const ft1 = bt.moored ? 1 : clamp((s - S_PUT) / 40, 0, 1), d = bt.d * lerp(0.3, 1, ft1 * ft1 * (3 - 2 * ft1)), slope = bt.moored ? 0 : bt.d * 0.7 * 6 * ft1 * (1 - ft1) / 40;
        const f = route.frame(s), x = f.x + f.rx * d, z = f.z + f.rz * d, stroke = time * bt.rate + bt.ph;
        const surge = rowing ? 0.12 * Math.sin(stroke - 0.9) : 0;
        _d.position.set(x + f.fx * surge, 0.02 + 0.035 * Math.sin(time * 1.1 + bt.ph), z + f.fz * surge);
        _d.rotation.set(0.02 * Math.sin(time * 0.9 + bt.ph) + (rowing ? 0.018 * Math.sin(stroke) : 0), Math.atan2(f.fx + slope * f.rx, f.fz + slope * f.rz) + bt.yaw + 0.03 * Math.sin(time * 0.3 + bt.ph), 0.03 * Math.sin(time * 0.7 + bt.ph * 2), 'YXZ');
        _d.updateMatrix(); boatMesh.setMatrixAt(i, _d.matrix);
        for (let k = 0; k < 2; k++) {
          const sg = k ? 1 : -1, sweep = rowing ? Math.sin(stroke) * 0.55 : 0.4, dip = rowing ? 0.17 + 0.15 * Math.cos(stroke) : 0.04;
          _o.position.set(sg * 0.84, 0.56, -0.2); _o.rotation.set(0, (sg > 0 ? 0 : Math.PI) + sg * sweep, -dip, 'YXZ'); _o.updateMatrix();
          _m4.multiplyMatrices(_d.matrix, _o.matrix); oarMesh.setMatrixAt(i * 2 + k, _m4);
        }
        _v3.set(0, 1.55 + 0.02 * Math.sin(time * 2.1 + bt.ph), 2.86).applyMatrix4(_d.matrix);
        boatLamps.positions.set([_v3.x, _v3.y, _v3.z], i * 6); boatLamps.positions.set([_v3.x, -_v3.y, _v3.z], i * 6 + 3);
        if (rowing) { _o.position.set(0, 0.05, -2.5); _o.rotation.set(0, Math.PI, 0); _o.scale.set(3.6, 1, 11); _o.updateMatrix(); _m4.multiplyMatrices(_d.matrix, _o.matrix); _o.scale.set(1, 1, 1); wakeMesh.setMatrixAt(i, _m4); }
        else wakeMesh.setMatrixAt(i, _zero);
      }
      boatMesh.instanceMatrix.needsUpdate = true; oarMesh.instanceMatrix.needsUpdate = true; wakeMesh.instanceMatrix.needsUpdate = true; boatLamps.attribute.needsUpdate = true;
    };
    placeBoats(0, 0);
    await ctx.yield();

    // ------------------------------------------------------------ dust of the three metals in the air
    const dustOf = (cols, n, i) => fx.makeParticles({ rng: R.dust[i], preset: 'dust', time: U.uTime, count: Math.round(n * dens * detail), colors: cols, box: [38, 22, 38], size: [0.035, 0.1], intensity: 1.5 });
    const dust = [dustOf(['#dfe6ff', '#aebcf0', '#ffffff'], 1700, 0), dustOf(['#ffd870', '#ffb840', '#fff0b0'], 1700, 1), dustOf(['#ffffff', '#bfe8ff', '#ffd0f0'], 1500, 2)];
    for (const q of dust) scene.add(q.object);
    await ctx.yield();

    // ------------------------------------------------------------ white moths crossing under the trees
    {
      const mr = R.moths, nMoth = Math.round(80 * detail), mP = [], mA = [], mB = [];
      // each moth goes round and round a place of its own under the trees; the box its round fills (its reach to every side, 1.45 m
      // up and down) keeps LEAF_CLEAR from the way, so a moth never crosses the lane we fly
      for (let i = 0, got = 0; i < nMoth * 5 && got < nMoth; i++) {
        const s = mr.range(S_A0, S_A1), d = mr.range(-14, 14), y = FLOOR_Y + mr.range(3.5, 9.5), par = [mr.range(0, TAU), mr.range(1.6, 4.2), mr.range(0.5, 1.1), mr()];
        if (Math.hypot(Math.max(wayDist(s, d) - par[1] * 1.42, 0), Math.max(Math.abs(y - wayY(s)) - 1.45, 0)) < LEAF_CLEAR) continue;
        const p = route.at(s, d), c = [p[0], y, p[1]]; got++;
        for (const side of [-1, 1]) for (const k of [[0, 0.13], [0, -0.1], [side * 0.42, 0.03]]) { mP.push(c[0], c[1], c[2]); mA.push(par[0], par[1], par[2], par[3]); mB.push(k[0], k[1], side); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(mP, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(mA, 4)); g.setAttribute('aB', new THREE.Float32BufferAttribute(mB, 3));
      const moths = new THREE.Mesh(g, new THREE.ShaderMaterial({
        side: THREE.DoubleSide, uniforms: { uTime: U.uTime, uFogCol: U.uFogCol, uFogDen: U.uFogDen },
        vertexShader: /* glsl */`
attribute vec4 aA; attribute vec3 aB; uniform float uTime; varying float vL; varying vec3 vWp;
vec3 orbit(float t){ return vec3(sin(t*aA.z + aA.x)*aA.y, sin(t*aA.z*1.7 + aA.x*2.)*1.3 + sin(t*5. + aA.x)*.15, cos(t*aA.z*.8 + aA.x*1.3)*aA.y); }
void main(){
  vec3 c = position + orbit(uTime), c2 = position + orbit(uTime + .05);
  vec3 f = normalize(c2 - c + vec3(1e-5)), r = normalize(cross(f, vec3(0., 1., 0.)) + vec3(1e-5)), up = cross(r, f);
  float flap = sin(uTime*(16. + 6.*aA.w) + aA.x*9.);
  vec3 wing = r*(aB.x*cos(flap)) + up*(abs(aB.x)*sin(flap)) + f*aB.y;
  vec3 p = c + wing*1.05;
  vL = .55 + .45*abs(flap); vWp = p;
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.);
}`,
        fragmentShader: GLSL_COMMON + 'varying float vL; varying vec3 vWp; void main(){ gl_FragColor = vec4(fogged(vec3(.82, .9, 1.)*.9*vL, distance(vWp, cameraPosition), .6), 1.); }',
      }));
      moths.frustumCulled = false; scene.add(moths);
    }

    await ctx.yield();

    // ------------------------------------------------------------ the flight
    const Pt = (s, d, y) => { const p = route.at(s, d); return [p[0], y, p[1]]; };
    const pts = [Pt(9, 0, FLOOR_Y + 4.3), Pt(18, 0.3, FLOOR_Y + 3.7), Pt(27, 0.3, FLOOR_Y + 3.5), Pt(S_ARCH, 0, FLOOR_Y + 4.2)];
    { const n = Math.round((S_A1 - S_A0) / 17); for (let i = 0; i <= n; i++) { const s = lerp(S_A0, S_A1, i / n); pts.push(Pt(s, wayD(s), wayY(s))); } }
    // over the lake: low above the black glass, an even series of keys from the landing to the foot of the water stair, rising
    // over the last boats to the height of the doorway's middle above the stair's foot
    const yFoot = PK * PALACE.portalH / 2, lakeY = (s) => lerp(lerp(wayY(S_A1), 2.8, smoothstep(S_A1, S_SHORE + 60, s)), yFoot, smoothstep(S_STOP - 30, S_FOOT, s));
    { const n = Math.max(2, Math.round((S_FOOT - S_A1) / 30)); for (let i = 1; i < n; i++) { const s = lerp(S_A1, S_FOOT, i / n); pts.push(Pt(s, 0, lakeY(s))); } }
    // up the water stair on one straight line: from above its foot, over the middle of the flight and the edge of the landing, to the middle of the doorway
    pts.push(Pt(S_FOOT, 0, yFoot));
    for (const z of [(PALACE.stairFootZ + PALACE.landZ) / 2, PALACE.landZ]) pts.push(Pt(zs(z), 0, lerp(yFoot, portalAt.y, (PALACE.stairFootZ - z) / (PALACE.stairFootZ - hero.anchors.portal.z))));
    pts.push([portalAt.x, portalAt.y, portalAt.z]);
    await ctx.yield();
    const path = makePath(pts);
    await ctx.yield();
    const uOf = (s) => path.nearestXZ(...route.at(s, 0)).u;
    // the twig cracks early enough for its leaves to be coming down across the walk as we reach it: the lead is the time they
    // take to fall from the twig to the floor (the shower's own delay, drag and falling speed), in seconds of the flight
    for (const b of bursts) b.u0 = uOf(b.sC) - ((b.y0 - FLOOR_Y) / ((BURST.fall[0] + BURST.fall[1]) / 2) + 1 / BURST.drag + BURST.delay / 2) / DUR;
    const uPair = uOf(S_TREES + spacing * 0.5), uFoot = uOf(S_FOOT), uLand = uOf(S_LAND), uSlow0 = uOf(quayS), uSlow1 = uOf(S_HEAD);
    const ringO = route.at(B2, 0), fD = route.frame(S_SHORE - 30);
    U.uRingO.value.set(ringO[0], 0, ringO[1]); U.uRingD.value.set(fD.fx, 0, fD.fz);
    // the last boat puts out as we come to the landing's top step; the others put out before it, each by its own lag
    { const tLand = uOf(quayS) * DUR; for (const bt of boats) if (!bt.moored) bt.t0 = tLand - bt.lag; }
    placeBoats(0, 0);
    await ctx.yield();
    // where the gaze is drawn: the slippers while they still lie ahead; each avenue's own thing from where it first shows between
    // the trunks (some eighty metres off for the tall white fountain, sixty for the low pool and the fallen bough) until we are
    // upon it; the palace from where the diamond avenue has straightened after its bend, and stands at the far end of it, to the
    // foot of the water stair
    const slipAt = Pt(STEP.s + 2, STEP.d + STEP.r - 0.6, FLOOR_Y + 0.5), fTop = Pt(fountain.s, 0, FLOOR_Y + 3), poolAt = Pt(pool.s, 0, FLOOR_Y - 0.3), boughMid = Pt(bough.s + bough.len * 0.35, bough.side * (bough.from - bough.across * 0.4), FLOOR_Y + 1.5);
    const fogA = new THREE.Color('#070a18'), fogB = new THREE.Color('#0a1232');
    const _cu = new THREE.Vector3();

    return {
      scene, path, duration: DUR,
      // slow at the foot of the bedroom stair and at full pace by the first pair of trees; slower from the landing's top step, and
      // down to the lake's pace by the middle of the bay's round head; a little quicker from the foot of the water stair to its landing
      pace: (u) => 0.74 + 0.3 * smoothstep(0, uPair, u) - 0.1 * smoothstep(uSlow0, uSlow1, u) + 0.06 * smoothstep(uFoot, uLand, u),
      camera: { fov: 62, near: 0.3, far: 1700, lookAhead: 26, sway: 1, bank: 1.2 },
      pois: [
        { at: slipAt, from: 0, to: uOf(STEP.s - 2), weight: 0.3 },
        { at: fTop, from: uOf(fountain.s - 80), to: uOf(fountain.s - 8), weight: 0.4 },
        { at: poolAt, from: uOf(pool.s - pool.len - 60), to: uOf(pool.s), weight: 0.4 },
        { at: boughMid, from: uOf(bough.s - 60), to: uOf(bough.s + 2), weight: 0.35 },
        { at: gazeAt, from: uOf(B2 + BEND), to: uFoot, weight: 0.3 },
      ],
      portal: { shape: 'arch', width: PALACE.portalW * PK, height: PALACE.portalH * PK, color: '#ffd9a0', glow: 1.2, revealDistance: L_LAKE + 30 },
      post: {
        exposure: 1.02, bloom: { strength: 0.44, radius: 0.7, threshold: 0.9 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#ffffff', shadowTint: '#060a1e', vignette: 0.24, grain: 0.025, aberration: 0 },
      },
      update(dt, time, camera, u) {
        kit.update(time, camera, ctx.renderer);
        // everything that goes by where we are goes by the place flown: the route's metre under the path's own point at u (the camera is not read for it)
        path.pointAt(u, _cu); const sU = route.locate(_cu.x, _cu.z).s, mw = metalAt(sU);
        U.uFogCol.value.lerpColors(fogA, fogB, smoothstep(S_SHORE - 60, S_SHORE + 40, sU));      // the air of the lake's cavern is a deeper blue
        for (let i = 0; i < 3; i++) { dust[i].setOpacity(clamp(mw[i] * 1.2, 0, 1)); dust[i].update(dt, time, camera); }
        for (const t of treeMeshes) t.m.visible = t.sb > sU - 40 && t.sa < sU + 256;
        hangMesh.visible = sU > S_SHORE - 256;
        for (const b of bursts) {
          const tau = (u - b.u0) * DUR; b.mat.uniforms.uBurst.value = tau > 0 ? tau : -1;
          const tt = Math.max(tau, 0), glide = (1 - Math.exp(-tt * 1.1)) / 1.1, y = Math.max(b.y0 - 9 * (tt - glide), FLOOR_Y + 0.12), down = y <= FLOOR_Y + 0.13;
          b.twig.position.y = y; b.twig.rotation.set(down ? 0 : tt * b.spin, tt * 0.4, down ? 0 : tt * b.spin * 0.7); b.twig.scale.setScalar(tau > 0 ? 1 : 0.001);
        }
        // the wave of spectra that runs the diamond avenue ahead of us (the whole avenue ringing at once on a rare visit): it comes
        // up through the bend where gold gives way to diamond and dies between the last falling leaves and the middle of the bay's head
        U.uRing.value.x = (sU - B2) * 1.7 + 30; U.uRing.value.y = (rare ? 0.8 : 0.3) * smoothstep(B2 - 24, B2 + 24, sU) * (1 - smoothstep(S_SHORE - 14, S_HEAD, sU)); U.uRing.value.z = rare ? 34 : 18;
        placeBoats(u * DUR, time);
        hatchRays.update(dt, time, camera); hero.update(dt, time, camera);
      },
      dispose() { hero.dispose(); },
    };
  },
};
