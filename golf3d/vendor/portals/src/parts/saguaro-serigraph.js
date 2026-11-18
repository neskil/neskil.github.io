// HERO SET PIECE for "saguaro-serigraph" (Monsoon over the Saguaros): THE MONSOON CELL AND THE FLOOD IT SENDS.
//
// What is in here (all one flat-ink serigraph family, unlit, no lights of its own):
//   * the flash flood: one flat cocoa shape 30 m wide coming down a dry wash toward +Z, its front a triple row
//     of cream scallops that roll over (thrown to ~3.5 m), a wet tongue racing ahead on the sand, ripple bands and
//     foam flecks sliding on its back, cream spray dots, a tumbling fluted saguaro trunk with scarlet fruit,
//     snapped ocotillo fans with scarlet tips, palo verde limbs, and bank slabs that tip into it as the front passes
//     (a guard by place at the build: a fan's dealt metres across are folded back so that its whole reach stays
//     inside the wash's banks, never over the land beyond them; it reads no lens, seed or share of the flight);
//   * the dry wash it runs in (sand bed, 1.2 m cut banks with strata lines, gold apron) - opts.ground;
//   * the thunderhead "at infinity" up the wash: five stacked flat violets built as unions of slowly boiling discs,
//     each with a cream rim on its sunward (left) edge, an anvil shelf reaching overhead, a slanted rain curtain of
//     scrolling dashed stripes, and one eased cream lightning zigzag at a time (never a full-frame flash);
//   * three camera-centred rain sheets (cream dashed stripes, fwidth filtered) - setRain(0..1);
//   * a matching paper sky (the split fountain turquoise -> cream, flat sun disc, two far ridge inks, infinite
//     gold ground under the horizon with the same cloud shadow) - opts.sky.
//
// LOCAL FRAME. Origin = centre of the wash bed (y 0 = sand floor; the apron is at y +1.2) at the station where the
// flood front is abeam of the camera in the brief (u 0.69). +Z = downstream (the flood comes TOWARD +Z, "front"),
// -Z = up the wash toward the rain. The wash centre line meanders: x = hero.wash.centerX(z).
//
// SIZE. radius 8 / height 6 describe the flood FRONT (what a camera should frame; the front itself is 30 m wide). The piece itself is larger: the
// wash ground patch spans x +-120, z -210..+115; the flood ribbon reaches 260 m behind the front; the cell is a
// camera-following backdrop at opts.cellDistance (2400 m, top ~2 km up) and the sky dome has radius 3400.
//
// OPTS (all optional)
//   palette        7 hex strings [gold, terracotta, green, turquoise, violet, cocoa, scarlet] (brief order)
//   paper          hex of the unprinted sheet, default '#F2E4C4'
//   hour           'golden' (default) | 'noon' (short shadows, young tower without anvil, knee-deep flood) | 'night'
//                  (moon inks: turquoise and violet ground, cell lit from inside by its zigzag)
//   weather        'cell' (default) | 'haboob' (rolling terracotta scallop wall in front of the cell) | 'virga'
//                  (stripes stop short of the ground, the flood is a thin cocoa tongue)
//   season         'july' (default, red fruit on the trunk) | 'may' (cream blossom instead) | 'august' (green ocotillo)
//   ground         true: build the wash bed, banks and apron. Pass false in the world and carve your own terrain
//                  with hero.wash.profile(x, z) (local metres -> height above the bed) so banks and slabs line up.
//   sky            true: build the paper sky dome. Pass false if the world has its own sky.
//   rain           0..1 default amount of the near rain sheets (0.3, virga 0); setRain() changes it live
//   lightning      false: no ambient zigzags (one every 6-8 s by default); strike() still works
//   frontZ         initial front position in local metres (default 0)
//   sunDir         [x,y,z] local direction TOWARD the sun; default from hour (golden: left of up-wash, 30 deg up)
//   cellBearing    radians, direction of the thunderhead measured from -Z toward +X (default about +0.16, per seed)
//   cellDistance   metres at which the cell and curtain are drawn (default 2400; keep below camera.far * 0.6)
//   gain           multiplies every ink (default 1); meander: scale of the wash meander (default 1)
//   uPass, uSpeed  mapping used by setProgress(u): frontZ = uSpeed * (u - uPass), defaults 0.69 and 480 (12 m/s x 40 s)
//
// HOOKS (on the returned hero)
//   setProgress(u)      world path u -> flood front position (clamped). THE flood beat; never wall-clock.
//   setFrontZ(z)        same thing in local metres along the wash (front centre at z). Default 0 (front at origin).
//   setShadow(nx,nz,d,on) cloud-shadow half plane in WORLD xz: shadowed where nx*x + nz*z + d > 0 (lobed edge added
//                       in the shader, see cellShade() in SERI_GLSL). Default: a diagonal edge ~9 m downstream of the origin,
//                       shadow on the upstream side. The world's ground shader should call the same cellShade().
//   setRain(a), setSun(worldDir), strike() (force one lightning zigzag now), setAnvil(0..1) (anvil edge advance)
//   setShadowB(nx,nz,d,on) second edge: the shadow ENDS where nx*x + nz*z + d > 0 (off by default); setBolt(f,k): hold zigzag k at
//   strength f (0..1) from the world's u (f < 0 hands lightning back to the clock); uniforms: the shared uniform objects.
//   wash                { halfWidth, bankHeight, zMin, zMax, centerX(z), profile(x,z) }
//   serigraph           { glsl, inks, T1, T2 }: the shared style chunk and ink table so the world can match exactly.
//
// ANCHORS (local space, THREE.Vector3 unless noted)
//   flyThrough   ordered camera line across the bed at the brief's 25 degree slant (travelling up-wash, toward -Z):
//                over the left bank downstream, 1.6 m above the sand for ~70 m, up the right bank at z ~ +2 as the
//                front centre comes abeam at progress uPass, then along the bank top. With setProgress() driven by
//                the world's u it stays >= 8 m from the scallops; nothing solid of mine is within 6 m of it.
//   viewpoints   { headOn, bankPass, behind }: good still-camera positions; look at `center`.
//   frontCenter  where the front centre is at the default progress; cellDir: unit vector toward the thunderhead;
//   sunDir       unit vector toward the sun; washDir: unit downstream direction (+Z)
//   portalSeat   { position, facing }: an advisory seat for a 14 m portal on the right-bank apron 150 m on, facing
//                back down the fly-through (the brief seats the real portal on the granite rise, which is the world's).
//
// COST. ~57k triangles, 12 draw calls (10 with ground and sky off), no textures, no lights, build ~80 ms.
// LIGHTING. None: every material is an unlit ShaderMaterial that writes linear ink colours (<= 0.9, nothing blooms).
// Tone = two hard thresholds (T1 0.42, T2 -0.02, fwidth filtered) on one sun direction. Local pieces honour scene
// fog; the cell, curtain, lightning and sky are sky elements and ignore it. Use style 'none' and a gentle grade.
import * as THREE from 'three';

const DEF_PALETTE = ['#E3A23A', '#C4603A', '#3F7D5A', '#4FA39B', '#5A4689', '#6B4630', '#D93A2B'];
const T1 = 0.42, T2 = -0.02;
const col = (h) => new THREE.Color(h);
const mixc = (a, b, t) => a.clone().lerp(b, t);
const mulc = (a, b) => a.clone().multiply(b);

// ---------------------------------------------------------------------------------------------------------------
// Shared serigraph GLSL (fragment side). The world coder can reuse this string as is.
//   tone3(L, M, D, ndl)   three inks cut by two hard thresholds on dot(normal, sun)
//   aastep(edge, x)       fwidth-filtered step
//   cellShade(worldXZ)    1 inside the thunderhead's shadow (hard lobed edge)
//   grain(col, objPos)    faint ink mottle and paper tooth anchored in object space
// ---------------------------------------------------------------------------------------------------------------
export const SERI_GLSL = /* glsl */`
uniform vec3 uSun; uniform vec4 uShadow; uniform vec4 uShadowB; uniform vec3 uPaper; uniform vec3 uOver; uniform float uTime;
float aastep(float e, float x){ float w = max(fwidth(x), 1e-5); return clamp((x - e) / w + .5, 0., 1.); }
vec3 tone3(vec3 L, vec3 M, vec3 D, float ndl){
  float w = max(fwidth(ndl), 1e-4);
  float a = clamp((ndl - ${T1.toFixed(2)}) / w + .5, 0., 1.), b = clamp((ndl - (${T2.toFixed(2)})) / w + .5, 0., 1.);
  return mix(D, mix(M, L, a), b);
}
float cellShade(vec2 p){
  float e = dot(uShadow.xy, p) + uShadow.z;
  float a = dot(vec2(-uShadow.y, uShadow.x), p);
  e += 9. * sin(a * .043 + 1.3) + 4. * sin(a * .117 + 4.1) + 1.6 * sin(a * .31);
  float w = max(fwidth(e), 1e-4);
  float e2 = dot(uShadowB.xy, p) + uShadowB.z;                    // optional second edge: the shadow ends beyond it
  float a2 = dot(vec2(-uShadowB.y, uShadowB.x), p);
  e2 += 7. * sin(a2 * .051 + 2.1) + 3. * sin(a2 * .137 + .7) + 1.2 * sin(a2 * .37);
  float w2 = max(fwidth(e2), 1e-4);
  return clamp(e / w + .5, 0., 1.) * uShadow.w * (1. - clamp(e2 / w2 + .5, 0., 1.) * uShadowB.w);
}
float h31(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
vec3 grain(vec3 c, vec3 op){
  vec3 fw = fwidth(op);
  float fade = clamp(1. - (fw.x + fw.y + fw.z) * 4., 0., 1.);
  float g = vn3(op * 5.), s = vn3(op * 17. + 7.3);
  c *= 1. + fade * .08 * (g - .5);
  return mix(c, uPaper, fade * .11 * smoothstep(.74, .82, s));
}
`;
const WASH_GLSL = /* glsl */`
uniform vec4 uWash; uniform vec4 uWash2; uniform float uFront; uniform float uHump;
float washX(float z){ return uWash.x * sin(z * uWash.y + uWash.z) + uWash2.x * sin(z * uWash2.y + uWash2.z); }
float frontLag(float t){ return uWash2.w * t * t; }
float humpAt(float s, float t){ return uHump * smoothstep(2.6, 7., s) * (1. - smoothstep(9.5, 21., s)) * (1. - smoothstep(.5, .92, abs(t))); }
`;
const FOG_VP = '#include <common>\n#include <fog_pars_vertex>\n';
const FOG_FP = '#include <common>\n#include <fog_pars_fragment>\n';

// small growable geometry buffer: named float attributes plus an index
class Buf {
  constructor(spec) { this.spec = spec; this.a = {}; for (const k in spec) this.a[k] = []; this.idx = []; this.n = 0; }
  v(o) { for (const k in this.spec) { const s = o[k]; for (let i = 0; i < this.spec[k]; i++) this.a[k].push(s[i] ?? 0); } return this.n++; }
  tri(a, b, c) { this.idx.push(a, b, c); }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  geo() {
    const g = new THREE.BufferGeometry();
    for (const k in this.spec) g.setAttribute(k, new THREE.BufferAttribute(new Float32Array(this.a[k]), this.spec[k]));
    g.setIndex(this.n > 65535 ? new THREE.BufferAttribute(new Uint32Array(this.idx), 1) : new THREE.BufferAttribute(new Uint16Array(this.idx), 1));
    return g;
  }
  get tris() { return this.idx.length / 3; }
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('monsoon-flood') : ctx.rng;
  const R = (a, b) => rng.range(a, b);
  const hour = opts.hour === 'noon' || opts.hour === 'night' ? opts.hour : 'golden';
  const weather = opts.weather === 'haboob' || opts.weather === 'virga' ? opts.weather : 'cell';
  const season = opts.season === 'may' || opts.season === 'august' ? opts.season : 'july';
  const gain = opts.gain ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).map(col);
  const PAPER = col(opts.paper || '#F2E4C4');
  let [GOLD, TERRA, GREEN, TURQ, VIOLET, COCOA, SCARLET] = pal;
  const WHITE = new THREE.Color(1, 1, 1);
  const OVER = mixc(WHITE, VIOLET, 0.74);                 // violet overprint (multiply)
  // ink table (per hour). Everything that follows picks from here.
  const ink = {
    paper: PAPER, gold: GOLD, terra: TERRA, green: GREEN, turq: TURQ, violet: VIOLET, cocoa: COCOA, scarlet: SCARLET,
    groundL: GOLD.clone(), groundM: TERRA.clone(), groundSh: mixc(VIOLET, PAPER, 0.27),
    sand: mixc(PAPER, GOLD, 0.34), sandSh: mixc(mixc(VIOLET, PAPER, 0.48), GOLD, 0.06),
    skyTop: TURQ.clone(), skyBot: PAPER.clone(), sun: mixc(PAPER, WHITE, 0.25),
    flood: COCOA.clone(), floodDark: mulc(COCOA, mixc(WHITE, VIOLET, 0.6)), floodPale: mixc(COCOA, PAPER, 0.5),
    cream: PAPER.clone(), creamMid: mixc(PAPER, COCOA, 0.3), over: OVER,
  };
  if (hour === 'noon') { ink.groundL = mixc(GOLD, PAPER, 0.3); ink.sand = mixc(PAPER, GOLD, 0.2); ink.skyTop = mixc(TURQ, PAPER, 0.15); }
  if (hour === 'night') {
    ink.groundL = mixc(mixc(TURQ, VIOLET, 0.45), PAPER, 0.12); ink.groundM = mixc(VIOLET, TURQ, 0.2); ink.groundSh = mixc(VIOLET, COCOA, 0.25);
    ink.sand = mixc(mixc(TURQ, VIOLET, 0.25), PAPER, 0.27); ink.sandSh = mixc(VIOLET, TURQ, 0.35);
    ink.skyTop = mulc(VIOLET, mixc(WHITE, VIOLET, 0.5)); ink.skyBot = mixc(TURQ, VIOLET, 0.25); ink.sun = PAPER.clone();
    ink.flood = mulc(COCOA, mixc(WHITE, VIOLET, 0.45)); ink.floodDark = mulc(COCOA, VIOLET).multiplyScalar(1.6); ink.floodPale = mixc(COCOA, TURQ, 0.4);
  }
  for (const k in ink) if (k !== 'over') ink[k] = ink[k].clone().multiplyScalar(gain);

  // ---- sizes -------------------------------------------------------------------------------------------------
  const thin = weather === 'virga', knee = hour === 'noon';
  const HW = 15, BANK = 1.2;                                 // wash half width and bank height (the dry wash never changes)
  const FW = thin ? 4.6 : HW - 0.35;                         // flood half width
  const DEPTH = thin ? 0.32 : knee ? 0.5 : 1.0;              // flood depth behind the nose
  const LOBE = thin ? 0.38 : knee ? 0.5 : 1;                 // scallop scale
  const ZMIN = -210, ZMAX = 115, RIB_LEN = 260;
  const mScale = opts.meander ?? 1;
  const wA1 = R(3.5, 6) * mScale, wK1 = (Math.PI * 2) / R(170, 230), wP1 = R(0, 6.28);
  const wA2 = R(0.8, 1.8) * mScale, wK2 = (Math.PI * 2) / R(58, 84), wP2 = R(0, 6.28);
  const LAG = thin ? 2.5 : R(5.5, 7);                      // how far the front trails at the banks (m)
  const c0 = wA1 * Math.sin(wP1) + wA2 * Math.sin(wP2);     // so that centerX(0) == 0
  const centerX = (z) => wA1 * Math.sin(z * wK1 + wP1) + wA2 * Math.sin(z * wK2 + wP2) - c0;
  // a second stream for the wall and the plume, so that adding them leaves every other seeded choice as it was
  const q01 = (() => { let a = (Math.floor(wP1 * 1e7) ^ 0x9e3779b9) >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
  const Q = (a, b) => a + (b - a) * q01();
  const nz = ctx.noise;
  const bankJ = (z, side) => 0.9 * nz.n2(z * 0.045, side * 7.3) + 0.38 * nz.n2(z * 0.21, side * 3.1 + 9);
  const xLeft = (z) => centerX(z) - HW - bankJ(z, -1), xRight = (z) => centerX(z) + HW + bankJ(z, 1);
  const cut = (m) => { // height above bed at distance m inside the bank line
    if (m <= 0) return BANK;
    const a = Math.max(0, 1 - m / 0.5), b = Math.max(0, 1 - m / 2.0);
    return (BANK - 0.2) * Math.pow(a, 0.7) + 0.2 * b * b;
  };
  const profile = (x, z) => cut(Math.min(x - xLeft(z), xRight(z) - x));

  // ---- shared uniforms ---------------------------------------------------------------------------------------
  const sunLocal = new THREE.Vector3();
  if (opts.sunDir) sunLocal.fromArray(opts.sunDir).normalize();
  else if (hour === 'noon') sunLocal.set(-0.26, 0.93, -0.26).normalize();
  else if (hour === 'night') sunLocal.set(-0.55, 0.62, -0.56).normalize();
  else sunLocal.set(-0.612, 0.5, -0.612).normalize();
  const U = {
    uTime: { value: 0 }, uSun: { value: sunLocal.clone() }, uShadow: { value: new THREE.Vector4(0, -1, 30, 1) },
    uShadowB: { value: new THREE.Vector4(0, -1, 0, 0) }, uPaper: { value: ink.paper }, uOver: { value: ink.over }, uFront: { value: 0 },
    uWash: { value: new THREE.Vector4(wA1, wK1, wP1, c0) }, uWash2: { value: new THREE.Vector4(wA2, wK2, wP2, LAG) },
    uHump: { value: thin ? 0 : knee ? 1.1 : 2.6 }, uCamL: { value: new THREE.Vector3() }, uCamY: { value: 0 }, uFlash: { value: 0 }, uBolt: { value: 0 }, uRain: { value: opts.rain ?? (opts.weather === 'virga' ? 0 : 0.3) }, uAnvil: { value: 0.5 },
  };
  const shared = (extra = {}, fog = true) => {
    const u = fog ? THREE.UniformsUtils.clone(THREE.UniformsLib.fog) : {};
    for (const k in U) u[k] = U[k];
    for (const k in extra) u[k] = { value: extra[k] };
    return u;
  };
  const mat = (vs, fs, extra, o = {}) => new THREE.ShaderMaterial({
    uniforms: shared(extra, o.fog !== false), vertexShader: vs, fragmentShader: fs, fog: o.fog !== false,
    side: o.side ?? THREE.FrontSide, transparent: !!o.transparent, depthWrite: o.depthWrite ?? !o.transparent, depthTest: o.depthTest ?? true,
  });
  const root = new THREE.Group(); root.name = 'monsoon-flood';
  const disposables = [];
  let tris = 0;
  const add = (geo, material, order) => {
    const m = new THREE.Mesh(geo, material); m.frustumCulled = false; if (order !== undefined) m.renderOrder = order;
    root.add(m); disposables.push(geo, material); tris += geo.index ? geo.index.count / 3 : 0; return m;
  };
  const WASHX_FIX = WASH_GLSL.replace('uWash2.x * sin(z * uWash2.y + uWash2.z)', 'uWash2.x * sin(z * uWash2.y + uWash2.z) - uWash.w');

  // ---- the dry wash: sand bed, cut banks, apron ---------------------------------------------------------------
  if (opts.ground !== false) {
    const b = new Buf({ position: 3, aAc: 2 });
    const offs = [-105, -60, -32, -16, -7, -2.5, -0.7, 0, 0.14, 0.3, 0.5, 0.9, 1.4, 2.1, 4, 8];
    const rows = Math.round((ZMAX - ZMIN) / 2.5), cols = offs.length * 2 + 1;
    for (let j = 0; j <= rows; j++) {
      const z = ZMIN + ((ZMAX - ZMIN) * j) / rows, xl = xLeft(z), xr = xRight(z), xs = [];
      for (const o of offs) xs.push(xl + o);
      xs.push((xl + xr) / 2);
      for (let i = offs.length - 1; i >= 0; i--) xs.push(xr - offs[i]);
      for (const x of xs) {
        const dl = x - xl, dr = xr - x, m = Math.min(dl, dr);
        const far = Math.max(0, -m - 6);
        b.v({ position: [x, cut(m) + (m < 0 ? 0.10 * nz.n2(x * 0.05, z * 0.05) * Math.min(1, far / 20) : 0), z], aAc: [dl, dr] });
      }
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols - 1; i++) { const a = j * cols + i; b.quad(a, a + cols, a + cols + 1, a + 1); }
    const sunXZ = Math.hypot(sunLocal.x, sunLocal.z) || 1e-3;
    const bar = Math.min(6, (BANK * Math.abs(sunLocal.x)) / Math.max(sunLocal.y, 0.15));
    add(b.geo(), mat(FOG_VP + /* glsl */`
      attribute vec2 aAc; varying vec3 vL; varying vec3 vW; varying vec2 vAc; varying vec3 vNb;
      void main(){
        vL = position; vAc = aAc;
        vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz;
        vNb = normalize(mat3(modelMatrix) * vec3(aAc.x < aAc.y ? 1. : -1., .3, 0.));
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`, FOG_FP + SERI_GLSL + /* glsl */`
      uniform vec3 uGL, uGM, uGSh, uSand, uSandSh, uCocoa; uniform float uBankH, uBar, uBarSide;
      varying vec3 vL; varying vec3 vW; varying vec2 vAc; varying vec3 vNb;
      void main(){
        float sh = cellShade(vW.xz);
        float y = vL.y; vec2 q = vL.xz;
        float top = aastep(uBankH - .07, y), bed = 1. - aastep(.07, y);
        float edge = max(abs(q.x) / 120., abs(q.y + 47.) / 162.);
        float keep = 1. - smoothstep(.55, .92, edge);
        // apron: gold with flat terracotta blots and pebbles
        float n = vn3(vec3(q * .15, 1.7)) + .5 * vn3(vec3(q * .41, 5.));
        float blot = aastep(1.04, n) * keep;
        float pf = clamp(1. - fwidth(q.x * 1.3) * 2.2, 0., 1.);
        float peb = aastep(.80, vn3(vec3(q * 1.3, 9.))) * pf * keep * (1. - aastep(1.10, n));
        vec3 gL = mix(uGL, uGSh, sh), gM = mix(uGM, mix(uGSh, uGSh * uOver, .6), sh);
        vec3 apron = mix(gL, gM, max(blot, peb * step(.93, n)));
        // bed: pale sand with flow streaks and the left bank's violet shadow bar
        float m = min(vAc.x, vAc.y);
        float r = vn3(vec3(m * .55, q.y * .06, 3.)) + .35 * vn3(vec3(m * 1.7, q.y * .2, 8.));
        float streak = aastep(.80, r) * (1. - aastep(.90, r)) + aastep(1.14, r);
        vec3 sand = mix(uSand, uSandSh, sh);
        vec3 bedc = mix(sand, gL, clamp(streak, 0., 1.) * (.5 - .32 * sh));
        float bd = uBarSide > 0. ? vAc.x : vAc.y;
        float barM = aastep(0.3, bd) * (1. - aastep(uBar + .3 * sin(q.y * .8) + .15 * sin(q.y * 2.3), bd)) * (1. - sh);
        bedc *= mix(vec3(1.), uOver, barM);
        // cut bank: lit terracotta or terracotta overprinted violet, with cocoa strata lines
        float ndl = dot(normalize(vNb), uSun);
        vec3 bank = tone3(mix(uGM, uGL, .28), uGM, uGM * uOver, ndl);
        bank = mix(bank, uGM * mix(vec3(1.), uOver, .75), sh);
        float yy = y / uBankH + .05 * sin(q.y * .7) + .03 * sin(q.y * 2.9);
        float strata = aastep(.34, yy) * (1. - aastep(.41, yy)) + aastep(.70, yy) * (1. - aastep(.75, yy));
        bank = mix(bank, uCocoa, strata * .85);
        vec3 c = mix(mix(bank, apron, top), bedc, bed);
        c = grain(c, vL);
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`, { uGL: ink.groundL, uGM: ink.groundM, uGSh: ink.groundSh, uSand: ink.sand, uSandSh: ink.sandSh, uCocoa: ink.cocoa,
      uBankH: BANK, uBar: bar * (0.7 + 0.3 * Math.abs(sunLocal.x) / sunXZ), uBarSide: sunLocal.x < 0 ? 1 : -1 }));
  }
  await ctx.yield();

  // ---- the flood: one flat cocoa ribbon in front-relative coordinates ------------------------------------------
  // position = (t across -1..1, 0, s metres behind the front line; s < 0 is the wet tongue running ahead)
  const RIBW = thin ? FW : HW + 1.6;                         // the body runs under the bank lip so there is never a gap
  {
    const b = new Buf({ position: 3 });
    const ss = [-5, -3.6, -2.5, -1.6, -0.9, -0.35, 0, 0.3, 0.7, 1.2, 1.8, 2.6, 3.6, 5, 7, 9.5];
    while (ss[ss.length - 1] < RIB_LEN) ss.push(ss[ss.length - 1] * 1.16 + 1.5);
    const nT = 56;
    for (const s of ss) for (let i = 0; i <= nT; i++) b.v({ position: [-1 + (2 * i) / nT, 0, s] });
    for (let j = 0; j < ss.length - 1; j++) for (let i = 0; i < nT; i++) { const a = j * (nT + 1) + i; b.quad(a, a + 1, a + nT + 2, a + nT + 1); }
    add(b.geo(), mat(FOG_VP + WASHX_FIX + /* glsl */`
      uniform float uTime, uFW, uDepth, uZmin; varying vec3 vF; varying vec3 vW; varying float vTong;
      void main(){
        float t = position.x, s = position.z;
        float wob = .6 * sin(t * 9. + uTime * 2.3) + .4 * sin(t * 21. - uTime * 3.1);
        float ss = s < 0. ? s * (.75 + .3 * wob) * (1. - .5 * t * t) : s;
        float z = max(uFront - frontLag(t) - ss, uZmin);
        float d = uDepth * smoothstep(0., 2.4, s);
        float swell = .07 * sin(s * .8 + uTime * 3.6 + t * 6.) * smoothstep(2., 8., s) * (1. - smoothstep(60., 110., s));
        vec3 p = vec3(washX(z) + t * uFW, max(.035, d + humpAt(s, t) + swell * uDepth), z);
        vF = vec3(t * uFW, s, d); vTong = s < -.01 ? 1. : 0.;
        vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`, FOG_FP + SERI_GLSL + /* glsl */`
      uniform vec3 uFlood, uDark, uPale, uCream; uniform float uFlow, uFW, uEdge;
      varying vec3 vF; varying vec3 vW; varying float vTong;
      void main(){
        float sh = cellShade(vW.xz);
        float xm = vF.x, s = vF.y, a = s + uTime * uFlow;
        // ripple bands sliding toward the front, and flat cream foam flecks, densest just behind the scallops
        float wv = sin(a * 1.05 + 2.3 * sin(xm * .33 + a * .11) + 3. * vn3(vec3(xm * .12, a * .05, 4.)));
        float fa = clamp(1. - fwidth(a) * .9, 0., 1.);
        float band = aastep(.84, wv) * fa;
        float lite = aastep(.90, -wv) * fa;
        float fl = vn3(vec3(xm * .7, a * .30, 2.)) + .4 * vn3(vec3(xm * 2.1, a * .9, 6.));
        float near = 1. - smoothstep(1., 16., s);
        float fleck = aastep(1.13 - .30 * near, fl) * clamp(1. - fwidth(a) * .5, 0., 1.);
        float edge = aastep(uFW - 1.3 + .55 * sin(a * 1.7) + .3 * sin(a * 4.3), abs(xm)) * uEdge;
        vec3 c = mix(uFlood, uDark, band);
        c = mix(c, mix(uFlood, uPale, .55), lite);
        c = mix(c, uCream, max(fleck, edge));
        c *= mix(vec3(1.), uOver, .22 * sh);
        vec3 tongue = mix(uPale, uPale * mix(vec3(1.), uOver, .6), sh);
        c = mix(c, tongue, aastep(.5, vTong));
        c = grain(c, vec3(xm, 0., a));
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`, { uFlood: ink.flood, uDark: ink.floodDark, uPale: ink.floodPale, uCream: ink.cream, uFW: RIBW, uDepth: DEPTH,
      uZmin: ZMIN + 4, uFlow: 3.2, uEdge: thin ? 1 : 0 }));
  }

  // ---- THE WATER UNDER AND BEHIND THE FRONT (round 15, third pass) ---------------------------------------------
  // 'one flat cocoa shape 30 m wide comes down the dry bed', 'ripple bands sliding on its back', 'fills the channel
  // behind the last buck'. Live's ribbon above and live's heap stay as they are, line for line; this is a second
  // print laid over the ribbon's own surface (its geometry and its vertex shader are the ribbon's, so the two
  // coincide) in two places only, and clear everywhere else:
  //  (a) THE FLOOD'S RUNNING EDGE, the wet tongue ahead of the nose (live prints it one flat pale ink): the flood's
  //      own cocoa, ripple bands sliding on it toward its edge, and along its leading edge a cream line of foam cut
  //      into scallops;
  //  (b) THE BODY BEHIND THE HEAP, from where live's heap ends (humpAt is back to nothing 21 m behind the nose) to the
  //      ribbon's tail: the same cocoa bank to bank, the same bands sliding toward the front. Not on the thin day,
  //      whose tongue of water is narrow and has no heap. The cream line where the body rubs each bank follows below.
  // THE BANDS are regular, flat and filtered (no noise in them): a ripple is a pale band (live's pale ripple ink)
  // with its dark lee (the flood's dark) behind it; two ripples to live's own ripple length (2 pi / 1.05 m), a
  // greater (pale 0.12, dark 0.18 of the length: live's dark band is 0.18 of it) and a lesser half as broad half a
  // length on; they swing across the flow as live's bands do (live's own swing: 2.3 radians, 0.366 of a length, by
  // .33 across and .11 along) and slide at live's own speed (uFlow). On the tongue, which is a thin sheet, the
  // ripples are a third as long. On the body the bands grow from nothing to their breadth over the first ripple
  // length, so that they do not begin with a cut edge: a band prints at the share of the filter's width (the
  // phase's step from pixel to pixel) that lies on it, measured from the band's middle round the turn of the phase
  // (strip): a ramp one filter wide at each edge of a broad band, breadth over width in the middle of a narrow one,
  // nothing for a band of no breadth, and no cut where the phase turns over (the bands are faded out, at a step of
  // half a turn, before a band and its filter reach half a turn from its middle). THE FOAM: along the tongue's
  // leading edge (the ribbon's first
  // row, 5 m of the ribbon's own measure ahead of the nose) a cream line 0.15 broad with half-round scallops on its
  // inner side, at the spacing live's first row of scallops is laid out to (0.72 * 1.22 m times the day's scale; live
  // then fits a whole number of them across and shifts each a little by draw, so the two rows agree in number, not
  // scallop for scallop), half as deep as broad; each runs out to its full depth and draws back to a fifth of it
  // once for every ripple length that reaches the edge (a greater and a lesser ripple; the ripples' speed over
  // their length), out of step with its neighbours. The edge itself
  // advances and wobbles as live moves it. The cocoa takes the cell's shade and the paper's grain exactly as live's
  // body does (the same two lines), so the two prints join in one ink. Nothing here is dealt: no stream is drawn.
  const HEAP_END = 21, RIPPLE_LEN = (2 * Math.PI) / 1.05, FOAM_PITCH = 0.72 * 1.22 * LOBE;
  {
    const ribbon = root.children[root.children.length - 1];
    const water = add(ribbon.geometry, mat(ribbon.material.vertexShader, FOG_FP + SERI_GLSL + /* glsl */`
      uniform vec3 uFlood, uDark, uPale, uCream; uniform float uFlow, uHeapEnd, uBody, uLen, uPitch;
      varying vec3 vF; varying vec3 vW; varying float vTong;
      float strip(float f, float lo, float hi, float w){ float d = fract(f - .5 * (lo + hi) + .5) - .5, h = .5 * (hi - lo); return clamp((min(d + .5 * w, h) - max(d - .5 * w, -h)) / w, 0., 1.); }
      void main(){
        float sh = cellShade(vW.xz);
        float xm = vF.x, s = vF.y, a = s + uTime * uFlow;
        float tg = aastep(.5, vTong), body = uBody * clamp((s - uHeapEnd) / max(fwidth(s), 1e-5) + .5, 0., 1.);
        float al = max(tg, body);
        bool cut = al < .01;                               // the cut is decided here and made after the last filter width below: none is defined once a pixel is discarded
        float k = a / mix(uLen, uLen / 3., tg) + .366 * sin(xm * .33 + a * .11), wK = max(fwidth(k), 1e-5), f = fract(k);
        float grow = mix(smoothstep(uHeapEnd, uHeapEnd + uLen, s), 1., tg), fade = clamp(1.5 - wK * 3., 0., 1.);
        float pale = max(strip(f, .05, .05 + .12 * grow, wK), strip(f, .55, .55 + .06 * grow, wK));
        float dark = max(strip(f, .05 + .12 * grow, .05 + .30 * grow, wK), strip(f, .55 + .06 * grow, .55 + .15 * grow, wK));
        vec3 c = mix(uFlood, mix(uFlood, uPale, .55), pale * fade);
        c = mix(c, uDark, dark * fade);
        float col = xm / uPitch, su = fract(col) * 2. - 1., scal = sqrt(max(0., 1. - su * su));
        float dF = .5 * uPitch * (.6 + .4 * sin(uTime * 6.2832 * uFlow * 3. / uLen + floor(col) * 2.4)), eF = s + 5.;
        c = mix(c, uCream, (1. - clamp((eF - .15 - dF * scal) / (max(fwidth(eF), 1e-5) + dF * fwidth(scal)) + .5, 0., 1.)) * tg);
        c *= mix(vec3(1.), uOver, .22 * sh);
        c = grain(c, vec3(xm, 0., a));
        if (cut) discard;
        gl_FragColor = vec4(c, al);
        #include <fog_fragment>
      }`, { uFlood: ink.flood, uDark: ink.floodDark, uPale: ink.floodPale, uCream: ink.cream, uFW: RIBW, uDepth: DEPTH,
      uZmin: ZMIN + 4, uFlow: 3.2, uHeapEnd: HEAP_END, uBody: thin ? 0 : 1, uLen: RIPPLE_LEN, uPitch: FOAM_PITCH }, { transparent: true }), -1);
    // it prints before every other clear thing (the rain, the plume) and a hair nearer than the ribbon it lies on
    water.name = 'flood-water'; water.material.polygonOffset = true; water.material.polygonOffsetFactor = -1; water.material.polygonOffsetUnits = -1;
  }
  // (b, the banks) 'fills the channel': A CREAM LINE WHERE THE BODY RUBS EACH BANK. A strip lies on the water along
  // each bank's own line (the bed strip's stations, every 2.5 m), from inside the bank out over the water; on it a
  // cream line begins where the water meets the cut (found on the bank's own profile) and is a quarter of the bank's
  // height broad, its inner edge swelling and thinning by half of that in a regular wave a quarter of a ripple
  // length long that slides down the bank at the ripples' speed. It shows only behind live's heap (as the body
  // does), by the front's own place at the bank: it advances with the flood. Not on the thin day.
  if (!thin) {
    const b = new Buf({ position: 3, aE: 2 });
    const yW = DEPTH + 0.09, LINE = BANK / 4;
    let m0 = 0, m1 = 2;
    for (let i = 0; i < 20; i++) { const m = 0.5 * (m0 + m1); if (cut(m) > yW) m0 = m; else m1 = m; }
    for (const side of [-1, 1]) {
      const base = b.n; let rows = 0;
      for (let z = ZMIN + 5; z <= ZMAX; z += 2.5, rows++) {
        const xb = side < 0 ? xLeft(z) : xRight(z);
        for (const m of [-0.3, m1 + 2 * LINE]) b.v({ position: [xb - side * m, yW, z], aE: [m, side] });
      }
      for (let j = 0; j < rows - 1; j++) { const k = base + j * 2; b.quad(k, k + 1, k + 3, k + 2); }
    }
    const rub = add(b.geo(), mat(FOG_VP + WASHX_FIX + /* glsl */`
      attribute vec2 aE; uniform float uBankT; varying vec3 vE; varying vec3 vW;
      void main(){
        vE = vec3(aE.x, position.z, uFront - frontLag(uBankT) - position.z);
        vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`, FOG_FP + SERI_GLSL + /* glsl */`
      uniform vec3 uCream; uniform float uFlow, uM0, uLine, uWave, uHeapEnd; varying vec3 vE; varying vec3 vW;
      void main(){
        float w = uM0 + uLine * (1. + .5 * sin((vE.y - uTime * uFlow) * 6.2832 / uWave));
        float al = (1. - aastep(w, vE.x)) * aastep(uHeapEnd, vE.z);
        bool cut = al < .02;                               // decided here, made after the cell's shade has taken its filter widths
        gl_FragColor = vec4(uCream * mix(vec3(1.), uOver, .22 * cellShade(vW.xz)), al);
        if (cut) discard;
        #include <fog_fragment>
      }`, { uCream: ink.cream, uFlow: 3.2, uM0: m1, uLine: LINE, uWave: RIPPLE_LEN / 4, uHeapEnd: HEAP_END, uBankT: HW / RIBW }, { transparent: true, side: THREE.DoubleSide }), -1);
    rub.name = 'flood-rub';
  }

  // ---- the scallops: cream lens-domes that swell, roll forward over the nose and thin away --------------------
  const LOBW = thin ? FW - 0.5 : HW - 1.0;
  {
    const b = new Buf({ position: 3, aL: 4, aM: 4 });
    const rings = [0, 0.42, 0.76, 1], SEG = 12, DZ = 0.34;
    const lobe = (t, sRow, size, phase, rate, hgt, kind, rnd) => {
      const aL = [t, sRow, size, phase], aM = [rate, hgt, kind, rnd ?? rng()];
      for (let f = 0; f < 2; f++) {
        const base = b.n, sg = f ? -1 : 1;
        for (let r = 0; r < rings.length; r++) for (let i = 0; i <= SEG; i++) {
          const al = (Math.PI * i) / SEG, ro = rings[r];
          b.v({ position: [ro * Math.cos(al), ro * Math.sin(al), sg * DZ * Math.sqrt(Math.max(0, 1 - ro * ro))], aL, aM });
        }
        for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < SEG; i++) {
          const a = base + r * (SEG + 1) + i, c = a + SEG + 1;
          if (f) b.quad(a, a + 1, c + 1, c); else b.quad(a, c, c + 1, a + 1);
        }
      }
    };
    const rowS = [0.1, 1.45, 3.0, 4.7], rowSize = [0.72, 1.12, 1.45, 1.85], rowH = [1.0, 1.22, 1.42, 1.3];
    const wave = R(1.2, 2.4) * rng.sign();
    for (let k = 0; k < 4; k++) {
      const sp = rowSize[k] * LOBE * (k === 3 ? 1.05 : 1.22), n = Math.max(3, Math.round((2 * LOBW) / sp));
      for (let i = 0; i < n; i++) {
        const t = -1 + (2 * (i + 0.5 + R(-0.22, 0.22) + (k % 2) * 0.5)) / n;
        if (Math.abs(t) > 1) continue;
        lobe(t, rowS[k] * LOBE + R(-0.2, 0.2), rowSize[k] * LOBE * R(0.82, 1.18), t * wave + rng() * 0.45 + k * 0.31, k === 3 ? R(0.26, 0.38) : R(0.36, 0.56), rowH[k] * R(0.9, 1.12), k === 3 ? 2 : 0);
      }
    }
    if (!thin) for (let k = 0; k < 2; k++) {                // the wall: big cocoa rollers, tallest in mid-channel
      const size = [2.3, 2.8][k] * LOBE, n = Math.max(3, Math.round((2 * LOBW) / (size * 1.02)));
      for (let i = 0; i < n; i++) {
        const t = -1 + (2 * (i + 0.5 + Q(-0.2, 0.2) + k * 0.5)) / n;
        if (Math.abs(t) > 0.97) continue;
        lobe(t, [6.4, 9.0][k] * LOBE + Q(-0.3, 0.3), size * Q(0.88, 1.12) * (1 - 0.3 * t * t), t * wave + q01() * 0.5 + k * 0.4, Q(0.2, 0.3), [1.3, 1.4][k] * Q(0.94, 1.08), 3, q01());
      }
    }
    const nBoil = thin ? 8 : 26 + rng.int(0, 8);            // standing boils behind the front
    for (let i = 0; i < nBoil; i++) lobe(R(-0.9, 0.9), R(5, 46) * (thin ? 0.6 : 1), R(0.45, 0.95) * LOBE, rng(), R(0.22, 0.4), R(0.55, 0.85), 1);
    const nRub = thin ? 0 : 18;                               // where the flood rubs the banks
    for (let i = 0; i < nRub; i++) lobe((i % 2 ? 1 : -1) * R(0.97, 1.02), R(1, 70), R(0.4, 0.75), rng(), R(0.3, 0.5), R(0.7, 1), 1);
    add(b.geo(), mat(FOG_VP + WASHX_FIX + /* glsl */`
      attribute vec4 aL; attribute vec4 aM; uniform float uTime, uLW, uLR, uDepth;
      varying vec3 vP; varying vec3 vN; varying vec3 vW; varying float vKind;
      void main(){
        vKind = aM.z;
        float kind = aM.z, ph = fract(uTime * aM.x + aL.w);
        float sw = sqrt(max(sin(ph * 3.14159), 0.));
        float e = ph * ph * (3. - 2. * ph);
        bool roller = kind < .5 || kind > 1.5;
        float ang = kind < .5 ? mix(-.7, 1.4, e) : kind > 1.5 ? mix(-.5, .95, e) : mix(-.35, .5, e);
        float sc = aL.z * (kind > 2.5 ? .42 + .58 * sw : .28 + .72 * sw);
        vec3 q = position * vec3(sc, sc * aM.y, sc);
        vec3 n = normalize(vec3(position.x, position.y / max(aM.y, .2), position.z / .1156 + sign(position.z) * 1e-3));
        float ca = cos(ang), sa = sin(ang);
        q = vec3(q.x, q.y * ca - q.z * sa, q.z * ca + q.y * sa);
        n = vec3(n.x, n.y * ca - n.z * sa, n.z * ca + n.y * sa);
        float adv = roller ? mix(-.55, .95, ph) * aL.z : 0.;
        float z = uFront - frontLag(aL.x * uLR) - aL.y + adv;
        float base = uDepth * smoothstep(0., 2.4, aL.y + .9) + humpAt(aL.y - adv, aL.x * uLR) - .16 * aL.z;
        vec3 p = vec3(washX(z) + aL.x * uLW + q.x, base + q.y, z + q.z);
        vP = position; vN = normalize(mat3(modelMatrix) * n);
        vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`, FOG_FP + SERI_GLSL + /* glsl */`
      uniform vec3 uCream, uMid, uFlood, uDark; varying vec3 vP; varying vec3 vN; varying vec3 vW; varying float vKind;
      void main(){
        float r = length(vP.xy), ndl = dot(normalize(vN + vec3(0., 1e-4, 0.)), uSun);
        float line = aastep(.585, r) * (1. - aastep(.665, r)) + aastep(.25, r) * (1. - aastep(.315, r));
        vec3 c = tone3(uCream, uMid, uFlood, ndl + .18);
        c = mix(c, uFlood, line);
        c = mix(c, uCream, aastep(.80, r));                // unprinted cream rim: the keyline of every scallop
        c = mix(c, uFlood, aastep(.885, r) * (1. - aastep(.93, r)));
        vec3 k = tone3(mix(uFlood, uMid, .22), uFlood, uDark, ndl + .1);   // the cocoa crest behind the cream rows
        k = mix(k, uMid, line * .8);
        k = mix(k, uCream, aastep(.905, r));
        c = mix(c, k, step(1.5, vKind));
        vec3 k3 = mix(tone3(uFlood, uFlood, uDark, ndl + .1), uCream, aastep(.93, r));   // the wall: solid cocoa, one cream rim
        c = mix(c, k3, step(2.5, vKind));
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`, { uCream: ink.cream, uMid: ink.creamMid, uFlood: ink.flood, uDark: ink.floodDark, uLW: LOBW, uLR: LOBW / RIBW, uDepth: DEPTH }, { side: THREE.DoubleSide }));
  }

  // ---- spray: flat cream dots thrown off the front in ballistic arcs (camera-facing hexagons) -----------------
  {
    const b = new Buf({ position: 3, aL: 4, aM: 4 });
    const nS = Math.round((thin ? 40 : 170) * (ctx.quality?.detail ?? 1));
    for (let i = 0; i < nS; i++) {
      const aL = [R(-1, 1), R(-0.3, 3.2) * LOBE, R(0.09, 0.26) * (0.6 + 0.4 * LOBE), rng()];
      const aM = [R(3.2, 7.4) * Math.sqrt(LOBE), R(0.5, 4.5), R(-1.2, 1.2), R(0.75, 1.25)];
      const base = b.n;
      b.v({ position: [0, 0, 0], aL, aM });
      for (let k = 0; k < 9; k++) b.v({ position: [Math.cos(k * 0.6981), Math.sin(k * 0.6981), 0], aL, aM });
      for (let k = 0; k < 9; k++) b.tri(base, base + 1 + k, base + 1 + ((k + 1) % 9));
    }
    add(b.geo(), mat(FOG_VP + WASHX_FIX + /* glsl */`
      attribute vec4 aL; attribute vec4 aM; uniform float uTime, uLW, uLR, uDepth;
      void main(){
        float T = 2. * aM.x / 9.8;
        float ph = fract(uTime * aM.w / max(T, .2) + aL.w), tau = ph * T;
        float z = uFront - frontLag(aL.x * uLR) - aL.y + aM.y * tau;
        vec3 c = vec3(washX(z) + aL.x * uLW + aM.z * tau, uDepth + .5 + aM.x * tau - 4.9 * tau * tau, z);
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.);
        float sz = aL.z * (1. - .55 * ph) * (1. + max(-mvPosition.z - 30., 0.) * .012);
        mvPosition.xy += position.xy * sz;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`, FOG_FP + /* glsl */`
      uniform vec3 uCream;
      void main(){ gl_FragColor = vec4(uCream, 1.);
        #include <fog_fragment>
      }`, { uCream: ink.cream, uLW: LOBW, uLR: LOBW / RIBW, uDepth: DEPTH }, { side: THREE.DoubleSide }));
  }

  // ---- the plume: big cream scallop puffs thrown up off the wall, swelling, trailing back and thinning away ------
  // camera-facing cards; the shape (a union of discs), its shade crescent and its cocoa line are cut in the shader
  {
    const b = new Buf({ position: 3, aL: 4, aM: 4 });
    const nP = thin ? 7 : knee ? 16 : 30;
    for (let i = 0; i < nP; i++) {
      const t = thin ? Q(-0.8, 0.8) : ((i + 0.5) / nP * 2 - 1) * 0.92 + Q(-0.05, 0.05), mid = 1 - 0.5 * t * t;
      const aL = [t, Q(0.5, 5.5) * LOBE, Q(1.5, 2.5) * (0.45 + 0.55 * LOBE) * (0.75 + 0.25 * mid), q01()];
      const aM = [Q(0.26, 0.42), (i % 3 === 0 ? Q(4.8, 6.4) : Q(2.2, 4.4)) * mid * (0.3 + 0.7 * LOBE), q01(), Q(2.5, 6)];
      const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map((c) => b.v({ position: [c[0], c[1], 0], aL, aM }));
      b.quad(q[0], q[1], q[2], q[3]);
    }
    add(b.geo(), mat(FOG_VP + WASHX_FIX + /* glsl */`
      attribute vec4 aL; attribute vec4 aM; uniform float uTime, uLW, uLR, uDepth; uniform vec3 uSun;
      varying vec2 vQ; varying vec2 vS; varying vec3 vK; varying vec3 vW;
      void main(){
        float ph = fract(uTime * aM.x + aL.w);
        float e = 1. - (1. - ph) * (1. - ph);
        float z = uFront - frontLag(aL.x * uLR) - aL.y - aM.w * ph;
        vec3 c = vec3(washX(z) + aL.x * uLW, uDepth * 3.4 + aM.y * e, z);
        float sz = aL.z * (.42 + .78 * sqrt(ph));
        float flip = aM.z > .5 ? 1. : -1.;
        vec4 w = modelMatrix * vec4(c, 1.); vW = w.xyz;
        vec4 mvPosition = viewMatrix * w;
        mvPosition.xy += position.xy * sz;
        vQ = position.xy * vec2(flip, 1.); vK = vec3(ph, aM.z, 0.);
        vec3 sv = mat3(viewMatrix) * uSun;
        vS = normalize(vec2(sv.x * flip, sv.y) + vec2(1e-4, 0.));
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`, FOG_FP + SERI_GLSL + /* glsl */`
      uniform vec3 uCream, uMid, uFlood;
      varying vec2 vQ; varying vec2 vS; varying vec3 vK; varying vec3 vW;
      float puffShape(vec2 q, float k){
        float d = length(q - vec2(-.42, -.16)) - .40;
        d = min(d, length(q - vec2(.40, -.22 + .1 * k)) - .42);
        d = min(d, length(q - vec2(-.06, .26)) - .50);
        d = min(d, length(q - vec2(.34, .34 - .12 * k)) - .30);
        d = min(d, length(q - vec2(.0, -.36)) - .44);
        return d;
      }
      void main(){
        float ph = vK.x, thinning = smoothstep(.5, 1., ph) * .46;
        float d = puffShape(vQ, vK.y) + thinning;
        float al = 1. - aastep(0., d);
        bool cut = al < .02;                                       // decided here, made after the last filtered edge below
        float sh = cellShade(vW.xz);
        float dS = puffShape(vQ + vS * .22, vK.y) + thinning;      // the side away from the sun
        vec3 c = mix(uCream, mix(uMid, uMid * uOver, .35 * sh), aastep(0., dS));
        float line = aastep(-.135, d) * (1. - aastep(-.06, d));
        if (cut) discard;
        c = mix(c, uFlood, line * .9);
        gl_FragColor = vec4(c, al);
        #include <fog_fragment>
      }`, { uCream: ink.cream, uMid: ink.creamMid, uFlood: ink.flood, uLW: LOBW, uLR: LOBW / RIBW, uDepth: DEPTH }, { transparent: true, side: THREE.DoubleSide }), 3);
  }
  await ctx.yield();

  // ---- debris riding the front: tumbling saguaro trunk, snapped ocotillo, palo verde limbs ---------------------
  // Every piece is modelled about its own pivot (long axis = local X) and posed rigidly in the vertex shader.
  {
    const b = new Buf({ position: 3, normal: 3, aPc: 4, aRot: 4, aInk: 4 });
    const V = THREE.Vector3;
    // tube along a polyline with radius per point; ribs > 0 flutes it. cap: 0 none, 1 dome, 2 flat ragged cut
    const tube = (pts, rad, seg, ribs, inkId, pc, rot, cap0 = 1, cap1 = 1, flute = 0.07) => {
      const n = pts.length, ring = [];
      let up = new V(0, 1, 0.13).normalize();
      for (let i = 0; i < n; i++) {
        const tg = new V().subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
        const side = new V().crossVectors(tg, up); if (side.lengthSq() < 1e-6) side.set(0, 0, 1); side.normalize();
        up = new V().crossVectors(side, tg).normalize();
        ring.push(b.n);
        for (let k = 0; k <= seg; k++) {
          const th = (k / seg) * Math.PI * 2, r = rad[i] * (ribs ? 1 + flute * Math.cos(ribs * th) : 1);
          const nx = side.x * Math.cos(th) + up.x * Math.sin(th), ny = side.y * Math.cos(th) + up.y * Math.sin(th), nzz = side.z * Math.cos(th) + up.z * Math.sin(th);
          const rag = (cap0 === 2 && i === 0) ? (k % 2 ? -0.22 : 0.12) * (0.6 + rng()) : 0;
          b.v({ position: [pts[i].x + nx * r + tg.x * rag, pts[i].y + ny * r + tg.y * rag, pts[i].z + nzz * r + tg.z * rag], normal: [nx, ny, nzz],
            aPc: pc, aRot: rot, aInk: [ribs ? (k / seg) * ribs : 0, i / (n - 1), inkId, ribs ? 1 : 0] });
        }
      }
      for (let i = 0; i < n - 1; i++) for (let k = 0; k < seg; k++) { const a = ring[i] + k, c = ring[i + 1] + k; b.quad(a, c, c + 1, a + 1); }
      const capAt = (i, mode, dir) => {
        if (!mode) return;
        const tg = new V().subVectors(pts[i], pts[i === 0 ? 1 : i - 1]).normalize();
        const tip = new V().copy(pts[i]).addScaledVector(tg, mode === 1 ? rad[i] * 0.75 : -0.05);
        const c = b.v({ position: [tip.x, tip.y, tip.z], normal: [tg.x, tg.y, tg.z], aPc: pc, aRot: rot, aInk: [0, i ? 1 : 0, mode === 2 ? 3 : inkId, 0] });
        for (let k = 0; k < seg; k++) { if (dir > 0) b.tri(ring[i] + k, c, ring[i] + k + 1); else b.tri(ring[i] + k + 1, c, ring[i] + k); }
      };
      capAt(0, cap0, -1); capAt(n - 1, cap1, 1);
    };
    const blob = (c, r, inkId, pc, rot) => { // small faceted ball (fruit, blossom)
      const base = b.n, d = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
      for (const k of d) b.v({ position: [c.x + k[0] * r, c.y + k[1] * r, c.z + k[2] * r], normal: k, aPc: pc, aRot: rot, aInk: [0, 0, inkId, 0] });
      for (const f of [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]]) b.tri(base + f[0], base + f[1], base + f[2]);
    };
    const trunk = (len, r, sBack, xAc, arms) => {
      const pc = [sBack, xAc, rng(), 0.05], rot = [R(0.45, 0.8) * rng.sign(), 0, R(-0.45, 0.45), 0.14];
      const n = 12, pts = [], rad = [];
      for (let i = 0; i <= n; i++) { const u = i / n; pts.push(new V((u - 0.5) * len, 0, 0)); rad.push(r * (0.9 + 0.14 * Math.sin(u * 3.0)) * (i === n ? 0.82 : 1)); }
      tube(pts, rad, 26, 13, 0, pc, rot, 2, 1);
      const fruitInk = season === 'may' ? 3 : 2;
      for (let k = 0; k < 7; k++) { const a = k * 0.9 + rng(); blob(new V(len / 2 + r * 0.45, Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62), 0.11, fruitInk, pc, rot); }
      for (let m = 0; m < arms; m++) {
        const a = R(0, 6.28), ax = R(-0.15, 0.2) * len, ar = r * 0.68, out = R(0.75, 1.05), up = R(1.3, 2.3);
        const dy = Math.cos(a), dz = Math.sin(a), ap = [], arad = [];
        for (let i = 0; i <= 8; i++) {
          const u = i / 8, bend = Math.min(1, u * 2.2), e = Math.sin((bend * Math.PI) / 2), f = 1 - Math.cos((bend * Math.PI) / 2);
          const rr = out * e, xx = ax + out * 0.55 * f + Math.max(0, u - 0.45) * up * 1.8;
          ap.push(new V(xx, dy * rr, dz * rr)); arad.push(ar * (i === 0 ? 1.1 : 1));
        }
        tube(ap, arad, 20, 10, 0, pc, rot, 0, 1);
        const tip = ap[8]; for (let k = 0; k < 4; k++) { const q = k * 1.57 + rng(); blob(new V(tip.x + ar * 0.5, tip.y + Math.cos(q) * ar * 0.6, tip.z + Math.sin(q) * ar * 0.6), 0.09, fruitInk, pc, rot); }
      }
    };
    const ocotillo = (sBack, xAc) => {
      const pc = [sBack, xAc, rng(), 0.55 * LOBE + 0.1], rot = [R(0.2, 0.5), R(0.45, 0.85) * rng.sign(), R(0, 6.28), 0.3];
      const nW = rng.int(8, 11), tipInk = rng.chance(0.75) ? 2 : 1, stick = season === 'august' ? 4 : 1;
      for (let w = 0; w < nW; w++) {
        const a = R(0, 6.28), sp = R(0.08, 0.42), L = R(3.2, 5.0), dir = new V(1, Math.cos(a) * sp, Math.sin(a) * sp).normalize();
        const pts = [], rad = [], kx = R(-0.25, 0.25), kz = R(-0.25, 0.25), snap = rng.chance(0.3) ? R(0.5, 0.8) : 2;
        for (let i = 0; i <= 5; i++) {
          const u = i / 5, p = new V().copy(dir).multiplyScalar(L * u - L * 0.3);
          p.y += kx * Math.sin(u * 3.1) * 0.5 + (u > snap ? (u - snap) * -1.6 : 0); p.z += kz * Math.sin(u * 2.4) * 0.5; pts.push(p); rad.push(0.075 - 0.035 * u);
        }
        tube(pts, rad, 4, 0, stick, pc, rot, 1, 0);
        tube([pts[5].clone(), pts[5].clone().addScaledVector(dir, 0.42)], [0.085, 0.05], 4, 0, tipInk, pc, rot, 0, 1);
      }
    };
    const limb = (sBack, xAc) => {
      const pc = [sBack, xAc, rng(), 0.1], rot = [R(0.3, 0.6) * rng.sign(), 0, R(0, 6.28), 0.2];
      const L = R(2.4, 3.6), fk = R(0.35, 0.55);
      tube([new V(-L / 2, 0, 0), new V(0, 0.12, 0.05), new V(L / 2, 0.05, -0.1)], [0.12, 0.1, 0.05], 6, 0, 4, pc, rot);
      tube([new V((fk - 0.5) * L, 0.05, 0), new V((fk - 0.2) * L, 0.5, 0.45), new V((fk + 0.1) * L, 0.75, 1.0)], [0.085, 0.065, 0.035], 6, 0, 4, pc, rot, 0, 1);
      tube([new V((fk - 0.3) * L, 0.02, 0), new V((fk - 0.1) * L, -0.3, -0.5), new V((fk + 0.15) * L, -0.35, -0.95)], [0.07, 0.05, 0.03], 6, 0, 4, pc, rot, 0, 1);
    };
    const sgn = rng.sign();
    if (!thin) {
      trunk(R(5.2, 6.6), R(0.3, 0.36), R(5.5, 8), sgn * R(1.5, 5.5), rng.int(1, 2));
      trunk(R(2.0, 2.8), 0.24, R(15, 24), -sgn * R(3, 9), 0);
      limb(R(9, 14), -sgn * R(6, 11)); limb(R(22, 34), sgn * R(2, 10));
    } else limb(R(4, 7), R(-2, 2));
    const nOc = thin ? 1 : rng.int(3, 4);
    // A fan stays inside the wash, never over the land beyond its banks: its dealt metres across are folded back at
    // XF = HW - 6.0. The bank's lip wanders inward by at most 1.28 m (bankJ) and a fan reaches at most 4.34 m from
    // its pivot (a wand of 0.7 * 5.0 + 0.42 m, the snap's drop, the kinks, the cap), 4.70 m where the meander skews
    // it (the pivot rides washX at its own z). The draws are taken as before, so nothing else of the deal moves.
    // (The fourth fan could be dealt up to 22 m out.) On the thin day a fan is dealt within 2 m of the middle and
    // lies on the wash's own bed beside the tongue, as before: the fold is idle there.
    const XF = HW - 6.0, foldX = (x) => (Math.abs(x) > XF ? Math.sign(x) * (2 * XF - Math.abs(x)) : x);
    for (let i = 0; i < nOc; i++) ocotillo(R(0.8, 4.2) * LOBE + i * 0.4, foldX(thin ? R(-2, 2) : (-sgn * R(2, 12) + i * sgn * R(5, 8))));
    const geo = b.geo();
    const vs = FOG_VP + WASHX_FIX + /* glsl */`
      attribute vec4 aPc; attribute vec4 aRot; attribute vec4 aInk; uniform float uTime, uDepth, uHull, uLR, uRW;
      varying vec3 vN; varying vec3 vO; varying vec4 vInk; varying vec3 vW;
      vec3 rx(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, p.y * c - p.z * s, p.z * c + p.y * s); }
      vec3 ry(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x * c + p.z * s, p.y, p.z * c - p.x * s); }
      vec3 rz(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x * c - p.y * s, p.y * c + p.x * s, p.z); }
      void main(){
        float ph = aPc.z * 6.2832;
        float aR = uTime * aRot.x + ph, aT = aRot.y != 0. ? uTime * aRot.y + ph : .16 * sin(uTime * .9 + ph), aY = aRot.z + .3 * sin(uTime * .37 + ph * 3.);
        vec3 p = position, n = normal;
        vec3 po = p;
        p = ry(rz(rx(p, aR), aT), aY); n = ry(rz(rx(n, aR), aT), aY);
        float z = uFront - frontLag(aPc.y / uRW) - aPc.x + .5 * sin(uTime * .5 + ph);
        vec3 c = vec3(washX(z) + aPc.y, uDepth * smoothstep(0., 2.4, aPc.x) + humpAt(aPc.x, aPc.y / uRW) + aPc.w + aRot.w * sin(uTime * 1.7 + ph * 2.), z);
        vec4 w = modelMatrix * vec4(c + p, 1.);
        float dist = length(w.xyz - cameraPosition);
        w.xyz += normalize(mat3(modelMatrix) * n) * uHull * (.035 + dist * .0026);
        vN = normalize(mat3(modelMatrix) * n); vO = po; vInk = aInk; vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`;
    const ex = { uDepth: DEPTH, uLR: 1, uRW: RIBW, uHull: 0 };
    add(geo, mat(vs, FOG_FP + SERI_GLSL + /* glsl */`
      uniform vec3 uGreen, uGreenL, uStick, uStickL, uScar, uCream, uCocoa, uLimb;
      varying vec3 vN; varying vec3 vO; varying vec4 vInk; varying vec3 vW;
      void main(){
        float ndl = dot(normalize(vN), uSun), id = vInk.z;
        vec3 c;
        // every filtered step is taken here, before the inks part: across a trunk's ragged end id runs from 0 to 3 inside one
        // triangle, and a filter width taken in a branch that only some pixels of a block take is not defined
        float g = cos(vInk.x * 6.2832);
        float groove = (1. - aastep(-.45, g)) * vInk.w;
        vec3 green = tone3(uGreenL, uGreen, uGreen * uOver, ndl - .5 * groove), stick = tone3(uStickL, uStick, uStick * uOver, ndl);
        float rings = aastep(.5, sin(length(vO.yz) * 38.));
        vec3 limb = tone3(uLimb, uGreen, uGreen * uOver, ndl);
        if (id < .5) c = green;
        else if (id < 1.5) c = stick;
        else if (id < 2.5) c = uScar;
        else if (id < 3.5) c = mix(uCream, uCocoa, rings * .8);
        else c = limb;
        c = grain(c, vO);
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`, { ...ex, uGreen: ink.green, uGreenL: mixc(ink.green, ink.paper, 0.48), uStick: ink.floodDark, uStickL: mixc(ink.violet, ink.paper, 0.5),
      uScar: ink.scarlet, uCream: ink.cream, uCocoa: ink.cocoa, uLimb: mixc(ink.green, ink.gold, 0.45) }));
    // cream keyline: inverted hull, at least ~1.5 px wide at any distance
    const hull = add(geo, mat(vs, FOG_FP + /* glsl */`
      uniform vec3 uCream;
      void main(){ gl_FragColor = vec4(uCream, 1.);
        #include <fog_fragment>
      }`, { ...ex, uHull: 1, uCream: ink.cream }, { side: THREE.BackSide }));
    hull.renderOrder = 0; tris += 0;
  }
  await ctx.yield();

  // ---- bank slabs that tip into the flood as the front reaches their station -----------------------------------
  if (!thin) {
    const b = new Buf({ position: 3, normal: 3, aS: 4 });
    let z = ZMIN + 30, side = rng.sign();
    while (z < ZMAX - 12) {
      const len = R(1.6, 3.4), th = R(0.55, 0.95), h = BANK + 0.03, s = side;
      const hx = s < 0 ? xLeft(z) : xRight(z), aS = [hx, z, -s, R(0.8, 1.25)];
      const u0 = -th * 0.7, u1 = th * 0.3, w0 = -len / 2, w1 = len / 2, sk = R(-0.25, 0.25);
      const P = [[u0, 0, w0], [u1, 0, w0 + 0.1], [u1 - 0.08, h, w0 + 0.15 + sk * 0.3], [u0, h, w0], [u0, 0, w1], [u1, 0, w1 - 0.1], [u1 - 0.1, h, w1 - 0.2 + sk], [u0, h, w1]];
      const face = (i0, i1, i2, i3, n) => { const q = [i0, i1, i2, i3].map((i) => b.v({ position: P[i], normal: n, aS })); if (s < 0) b.quad(q[0], q[1], q[2], q[3]); else b.quad(q[3], q[2], q[1], q[0]); };
      face(1, 5, 6, 2, [1, 0.1, 0]); face(3, 2, 6, 7, [0, 1, 0]); face(0, 1, 2, 3, [0, 0, -1]); face(5, 4, 7, 6, [0, 0, 1]); face(4, 0, 3, 7, [-1, 0, 0]);
      z += R(7, 13); side = rng.chance(0.7) ? -side : side;
    }
    add(b.geo(), mat(FOG_VP + WASHX_FIX + /* glsl */`
      attribute vec4 aS; varying vec3 vN; varying vec3 vL; varying vec3 vW; varying float vTop;
      void main(){
        float k = clamp((uFront - frontLag(1.) - aS.y + 3.) / (8. * aS.w), 0., 1.); k = k * k * (3. - 2. * k);
        float a = k * 1.5, ca = cos(a), sa = sin(a), uh = .3;
        vec2 q = vec2(position.x - uh, position.y), nq = normal.xy;
        q = vec2(q.x * ca + q.y * sa, q.y * ca - q.x * sa); nq = vec2(nq.x * ca + nq.y * sa, nq.y * ca - nq.x * sa);
        vec3 p = vec3(aS.x + aS.z * (q.x + uh + k * .5), q.y - k * k * 1.3, aS.y + position.z);
        vN = normalize(mat3(modelMatrix) * vec3(aS.z * nq.x, nq.y, normal.z)); vL = position; vTop = normal.y;
        vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`, FOG_FP + SERI_GLSL + /* glsl */`
      uniform vec3 uGL, uGM, uGSh, uCocoa; uniform float uBankH;
      varying vec3 vN; varying vec3 vL; varying vec3 vW; varying float vTop;
      void main(){
        float sh = cellShade(vW.xz);
        vec3 bank = tone3(mix(uGM, uGL, .28), uGM, uGM * uOver, dot(normalize(vN), uSun));
        bank = mix(bank, uGM * mix(vec3(1.), uOver, .75), sh);
        float yy = vL.y / uBankH + .04 * sin(vL.z * 2.9);
        float strata = aastep(.34, yy) * (1. - aastep(.41, yy)) + aastep(.70, yy) * (1. - aastep(.75, yy));
        bank = mix(bank, uCocoa, strata * .85);
        vec3 c = mix(bank, mix(uGL, uGSh, sh), step(.5, vTop));
        c = grain(c, vL + vW * 0.);
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`, { uGL: ink.groundL, uGM: ink.groundM, uGSh: ink.groundSh, uCocoa: ink.cocoa, uBankH: BANK }, { side: THREE.DoubleSide }));
  }

  // ---- the thunderhead: five stacked flat violets, unions of slowly boiling discs, cream rim on the sunward edge --
  // position = (a, y, 0) in the cell plane (metres at cellDistance); aC = (centre a, centre y, phase, layer);
  // aH = (f toward the camera for the overhead anvil shelf, depth offset in metres toward the camera)
  const DC = opts.cellDistance ?? 2400, deg = Math.PI / 180;
  const bearing = opts.cellBearing ?? R(0.10, 0.22);
  const cellDirL = new THREE.Vector3(Math.sin(bearing), 0, -Math.cos(bearing));
  const young = hour === 'noon';
  const TA = (d) => DC * Math.tan(d * deg);
  {
    const b = new Buf({ position: 3, aC: 4, aH: 2, color: 3 });
    const SEGS = 22;
    const disc = (a, y, r, layer, depth, c, ph = rng()) => {
      const aC = [a, y, ph, layer], aH = [0, depth], color = [c.r, c.g, c.b], base = b.v({ position: [a, y, 0], aC, aH, color });
      for (let k = 0; k < SEGS; k++) b.v({ position: [a + Math.cos((k / SEGS) * 6.2832) * r, y + Math.sin((k / SEGS) * 6.2832) * r, 0], aC, aH, color });
      for (let k = 0; k < SEGS; k++) b.tri(base, base + 1 + k, base + 1 + ((k + 1) % SEGS));
    };
    const rect = (a0, a1, y0, y1, layer, depth, c) => {
      const color = [c.r, c.g, c.b], aH = [0, depth], m = [(a0 + a1) / 2, y0, -1, layer];
      const q = [[a0, y0], [a1, y0], [a1, y1], [a0, y1]].map((p) => b.v({ position: [p[0], p[1], 0], aC: m, aH, color }));
      b.quad(q[0], q[1], q[2], q[3]);
    };
    const skyMix = hour === 'night' ? ink.skyBot : ink.paper;
    const layerInk = (k) => mixc(ink.violet, hour === 'night' ? skyMix : mixc(skyMix, col('#D6CEF2').multiplyScalar(gain), 0.7), k);
    const rimInk = hour === 'night' ? mixc(ink.violet, ink.paper, 0.45) : ink.cream;
    const rimD = TA(0.42);
    // one lumpy layer: turrets = [azDeg, topElevDeg, halfWidthDeg]; body ink c; drawn with a rim copy behind it
    const layer = (L, turrets, baseEl, c, depth, rimK = 1) => {
      for (const [az, top, hw] of turrets) {
        const a = TA(az), w = TA(hw), y0 = TA(baseEl), y1 = TA(top);
        const items = [];
        let y = y0 + w * 0.3;
        while (y < y1) {
          const u = (y - y0) / Math.max(1, y1 - y0), tp = 1 - 0.45 * u * u;
          const n = u > 0.82 ? 1 : 2;
          for (let i = 0; i < n; i++) items.push([a + (n === 1 ? R(-0.2, 0.2) : (i ? 1 : -1) * R(0.35, 0.62)) * w * tp, Math.min(y, y1 - w * 0.4 * tp) + R(-0.1, 0.1) * w, w * tp * R(0.5, 0.72)]);
          y += w * R(0.42, 0.6);
        }
        for (const it of items) { disc(it[0] - rimD * rimK, it[1] + rimD * 0.62 * rimK, it[2], L, depth - 12, rimInk); disc(it[0], it[1], it[2], L, depth, c); }
        rect(a - w * 0.82, a + w * 0.82, y0, y1 - w * 0.55, L, depth, c);
      }
    };
    const jit = (v, j) => v + R(-j, j);
    const mirror = rng.sign();                                // which shoulder is the tall one, per seed
    if (!young) { // L0: the anvil slab with mammatus scallops under it and the shelf reaching overhead
      const c0 = layerInk(0.47), aw = TA(40), yb = TA(26.5), yt = TA(36);
      rect(-aw, aw, yb, yt, 0, -40, c0);
      for (let a = -aw; a <= aw; a += TA(R(3.2, 5.2))) { const r = TA(R(1.6, 2.9)); disc(a - rimD, yb + r * 0.2 + rimD * 0.6, r, 0, -52, rimInk); disc(a, yb + r * 0.2, r, 0, -40, c0); }
      for (let a = -aw; a <= aw; a += TA(R(4, 7))) disc(a, yt, TA(R(2.5, 4.5)), 0, -40, c0);
      for (const sg of [-1, 1]) for (let y = yb; y <= yt; y += TA(2.4)) disc(sg * aw, y, TA(R(1.8, 3)), 0, -40, c0);
      const cs = layerInk(0.41), ys = yb + 6, base = b.n, NS = 16;   // horizontal shelf (underside), scalloped leading edge
      for (let i = 0; i <= NS; i++) { const a = -aw + (2 * aw * i) / NS; for (const f of [0, 1]) b.v({ position: [a, ys, 0], aC: [a, ys, -1, 0], aH: [f, -40], color: [cs.r, cs.g, cs.b] }); }
      for (let i = 0; i < NS; i++) { const k = base + i * 2; b.quad(k, k + 2, k + 3, k + 1); }
      for (let i = 0; i <= 20; i++) { // edge discs lying flat: built in (a, depth) by hand
        const a = -aw + (2 * aw * i) / 20, r = TA(R(2.6, 4.2)), ph = rng(), cb = b.v({ position: [a, ys, 0], aC: [a, ys, ph, 0], aH: [1, -40], color: [cs.r, cs.g, cs.b] });
        for (let k = 0; k < 14; k++) b.v({ position: [a + Math.cos((k / 14) * 6.2832) * r, ys, 0], aC: [a, ys, ph, 0], aH: [1, -40 + Math.sin((k / 14) * 6.2832) * r], color: [cs.r, cs.g, cs.b] });
        for (let k = 0; k < 14; k++) b.tri(cb, cb + 1 + ((k + 1) % 14), cb + 1 + k);
      }
      for (const sg of [-1, 1]) for (let i = 0; i < 9; i++) { // and along both sides of the shelf
        const fc = (i + 0.5) / 9, r = TA(R(3, 4.6)), ph = rng(), a = sg * aw, cb = b.v({ position: [a, ys, 0], aC: [a, ys, ph, 0], aH: [fc, -40], color: [cs.r, cs.g, cs.b] });
        for (let k = 0; k < 14; k++) b.v({ position: [a + Math.cos((k / 14) * 6.2832) * r, ys, 0], aC: [a, ys, ph, 0], aH: [fc, -40 + Math.sin((k / 14) * 6.2832) * r], color: [cs.r, cs.g, cs.b] });
        for (let k = 0; k < 14; k++) b.tri(cb, cb + 1 + ((k + 1) % 14), cb + 1 + k);
      }
    }
    const s = young ? 0.72 : 1;
    layer(1, [[jit(1, 2), 28 * s, 7.5], [jit(-9 * mirror, 2), 22.5 * s, 5], [jit(10 * mirror, 2), 25.5 * s, 5.5]], 7.6, layerInk(0.36), 0);
    layer(2, [[jit(-15 * mirror, 2), 19 * s, 5.2], [jit(17 * mirror, 2), 21.5 * s, 4.6], [jit(4, 2), 17.5 * s, 6]], 7.6, layerInk(0.24), 40);
    layer(3, [[jit(-21, 2), 14 * s, 4.4], [jit(-8, 2), 16.2 * s, 4.2], [jit(9, 2), 14.8 * s, 4.6], [jit(22, 2), 13.2 * s, 4]], 7.6, layerInk(0.12), 80);
    { // L4: the dark flat base with a low scalloped shelf cloud
      const c4 = layerInk(0.04), yb = TA(7.4);
      rect(TA(-25), TA(25), yb, TA(9.4), 4, 120, c4);
      for (let a = TA(-25); a <= TA(25); a += TA(R(2.4, 4.2))) { const r = TA(R(2.0, 3.8)), y = TA(R(8.4, 9.4)) * (1 - 0.0 * a); disc(a - rimD * 0.8, y + rimD * 0.5, r, 4, 108, rimInk); disc(a, y, r, 4, 120, c4); }
      for (const sg of [-1, 1]) disc(sg * TA(25), TA(8.6), TA(1.8), 4, 120, c4);
    }
    if (weather === 'haboob') { // a rolling terracotta scallop wall in front of the cell
      const dusk = hour === 'night' ? 0.5 : 0, hb = (c) => mixc(c, ink.violet, dusk);
      const rows = [[9.5, hb(mixc(ink.terra, ink.paper, 0.38)), 420], [6.8, hb(ink.terra), 560], [4.0, hb(mixc(ink.terra, ink.cocoa, 0.42)), 700]];
      rows.forEach(([el, c, depth], i) => {
        rect(TA(-44), TA(44), TA(-1.2), TA(el - 1), 5 + i, depth, c);
        for (let a = TA(-44); a <= TA(44); a += TA(R(2.4, 3.8))) { const r = TA(R(1.9, 3.1)), y = TA(el - 1) + R(-0.2, 0.5) * r; disc(a - rimD * 1.2, y + rimD * 0.8, r, 5 + i, depth - 12, rimInk); disc(a, y, r, 5 + i, depth, c); }
      });
    }
    add(b.geo(), mat(/* glsl */`
      attribute vec4 aC; attribute vec2 aH; attribute vec3 color;
      uniform vec3 uCamL, uDir, uFlashInk; uniform float uTime, uDC, uAnvil, uFlash, uLit, uBaseY;
      varying vec3 vC;
      void main(){
        float L = aC.w;
        vec2 p = position.xy;
        float boil = aC.z >= 0. ? 1. + (L > 4.5 ? .10 : .05) * sin(uTime * (L > 4.5 ? .9 : .32) + aC.z * 6.2832) : 1.;
        p = aC.xy + (p - aC.xy) * boil;
        if (L > .5 && L < 4.5) p.y = max(p.y, uBaseY);
        p.x += (L > 4.5 ? 60. : 26.) * sin(uTime * .045 + L * 1.9) + (L > 4.5 ? uTime * 14. * (L - 5.5) : 0.);
        float depth = uDC * (1. - aH.x * (.55 + .5 * uAnvil)) - aH.y;
        vec3 right = vec3(-uDir.z, 0., uDir.x);
        vec3 pos = vec3(uCamL.x, 0., uCamL.z) + uDir * depth + right * p.x + vec3(0., p.y, 0.);
        vC = color + (uFlashInk - color) * uFlash * uLit * (L > .5 && L < 3.5 ? .55 : .12);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
      }`, /* glsl */`
      varying vec3 vC;
      void main(){ gl_FragColor = vec4(vC, 1.); }`, { uDir: cellDirL, uDC: DC, uBaseY: TA(7.4), uFlashInk: ink.paper, uLit: hour === 'night' ? 1 : 0.3 }, { fog: false, side: THREE.DoubleSide }), -0.5);
  }
  await ctx.yield();

  // ---- the rain curtain under the base (two far stripe quads) and the lightning zigzag ------------------------
  const CELL_VS = /* glsl */`
    uniform vec3 uCamL, uDir; uniform float uDC;
    vec3 cellPos(vec2 p, float toward){ vec3 right = vec3(-uDir.z, 0., uDir.x); return vec3(uCamL.x, 0., uCamL.z) + uDir * (uDC - toward) + right * p.x + vec3(0., p.y, 0.); }`;
  {
    const b = new Buf({ position: 3, aK: 4, aE: 2 });
    const quadC = (a0, a1, y0, y1, depth, K, inkMix) => {
      const q = [[a0, y0, -1], [a1, y0, 1], [a1, y1, 1], [a0, y1, -1]].map((p) => b.v({ position: [p[0], p[1], depth], aK: K, aE: [p[2], inkMix] }));
      b.quad(q[0], q[1], q[2], q[3]);
    };
    const lean = R(0.34, 0.5), yb = TA(7.5);
    quadC(TA(-26), TA(19), TA(-0.8), yb, 140, [lean, 0.85, 0.5, TA(1.25)], 0.52);
    quadC(TA(-19), TA(13), TA(-0.8), yb, 155, [lean * 1.12, 1.3, 0.95, TA(0.95)], 0.2);
    add(b.geo(), mat(CELL_VS + /* glsl */`
      attribute vec4 aK; attribute vec2 aE; varying vec2 vA; varying vec4 vK; varying vec2 vE;
      void main(){ vA = position.xy; vK = aK; vE = aE; gl_Position = projectionMatrix * modelViewMatrix * vec4(cellPos(position.xy, position.z), 1.); }`, /* glsl */`
      uniform vec3 uInkA, uInkB; uniform float uTime, uStop;
      varying vec2 vA; varying vec4 vK; varying vec2 vE;
      void main(){
        float c = (vA.x + vA.y * vK.x) / vK.w;
        float id = floor(c), f = abs(fract(c) - .5) * 2.;
        float w = fwidth(c) * 2.;
        float line = 1. - smoothstep(.36 - w, .36 + w, f);
        float h1 = fract(sin(id * 12.9898) * 43758.5453), h2 = fract(h1 * 17.31);
        float l = vA.y / (vK.w * 4.2) + uTime * vK.y + h1 * 9.;
        float lw = min(fwidth(vA.y) / (vK.w * 4.2) * 2., .3);
        float g = abs(fract(l) - .5) * 2.;
        float dash = smoothstep(.26 - lw, .26 + lw, g);
        float on = step(h2, vK.z * (1.2 - vE.x * vE.x * 1.1)) * step(uStop * (.45 + h2), vA.y);
        float a = line * dash * on;
        gl_FragColor = vec4(mix(uInkA, uInkB, vE.y), a);
      }`, { uDir: cellDirL, uDC: DC, uInkA: mixc(ink.violet, ink.cocoa, 0.15), uInkB: hour === 'night' ? ink.skyBot : ink.paper, uStop: weather === 'virga' ? TA(3.2) : -1e6 },
      { fog: false, transparent: true, side: THREE.DoubleSide }), 1);
  }
  const NB = 4;
  {
    const b = new Buf({ position: 3, aO: 3 });
    for (let k = 0; k < NB; k++) {
      const zig = (a, y, y1, w, segs, drift) => {
        let pa = a, py = y;
        for (let i = 0; i < segs; i++) {
          const ny = y + ((y1 - y) * (i + 1)) / segs, na = a + drift * (i + 1) + (i % 2 ? 1 : -1) * R(0.5, 1.5) * TA(0.75) * (i === segs - 1 ? 0.3 : 1);
          const dx = na - pa, dy = ny - py, len = Math.hypot(dx, dy) || 1, ox = (-dy / len) * w, oy = (dx / len) * w, ex = (dx / len) * w * 0.6, ey = (dy / len) * w * 0.6;
          const ww = 1 - (0.5 * i) / segs;
          for (const [dep, wm] of [[196, 2.0], [210, 1]]) {
            const q = [[pa - ex * wm, py - ey * wm, 1], [na + ex * wm, ny + ey * wm, 1], [na + ex * wm, ny + ey * wm, -1], [pa - ex * wm, py - ey * wm, -1]].map((p) => b.v({ position: [p[0], p[1], dep], aO: [ox * p[2] * ww * wm, oy * p[2] * ww * wm, k] }));
            b.quad(q[0], q[1], q[2], q[3]);
          }
          pa = na; py = ny;
        }
        return [pa, py];
      };
      const a0 = TA(R(-13, 9)), y0 = TA(R(12.5, 15)), mid = zig(a0, y0, TA(4.2), TA(0.36), 6, TA(R(-0.4, 0.4)));
      zig(mid[0], mid[1], TA(-0.3), TA(0.27), 4, TA(R(-0.6, 0.6)));
      zig(mid[0], mid[1], TA(R(1.2, 2.2)), TA(0.17), 3, TA(R(0.7, 1.3)) * rng.sign());
    }
    add(b.geo(), mat(CELL_VS + /* glsl */`
      attribute vec3 aO; uniform float uFlash, uBolt; varying float vOut;
      void main(){
        vOut = step(position.z, 203.);
        float on = abs(aO.z - uBolt) < .5 ? uFlash : 0.;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(cellPos(position.xy + aO.xy * (.35 + .65 * on) * step(.001, on), position.z), 1.);
      }`, /* glsl */`
      uniform vec3 uInk, uInk2; varying float vOut;
      void main(){ gl_FragColor = vec4(mix(uInk, uInk2, step(.5, vOut)), 1.); }`, { uDir: cellDirL, uDC: DC, uInk: ink.cream, uInk2: mixc(ink.violet, ink.cocoa, 0.25) }, { fog: false, side: THREE.DoubleSide }), 2);
  }

  // ---- near rain: three camera-centred sheets of cream dashed stripes ------------------------------------------
  let rainMesh = null;
  {
    const b = new Buf({ position: 3, aK: 4 });
    [[9, 2.3, 0.066], [22, 1.7, 0.052], [50, 1.2, 0.042]].forEach(([rad, rate, pitch], si) => {
      const N = 28, base = b.n;
      for (let i = 0; i <= N; i++) { const th = (i / N) * Math.PI * 2; for (const yy of [-1.1, 1.3]) b.v({ position: [Math.sin(th) * rad, yy * rad, Math.cos(th) * rad], aK: [th * rad, rate, pitch * rad, si] }); }
      for (let i = 0; i < N; i++) { const k = base + i * 2; b.quad(k, k + 2, k + 3, k + 1); }
    });
    rainMesh = add(b.geo(), mat(/* glsl */`
      attribute vec4 aK; uniform vec3 uCamL; uniform float uCamY; varying vec2 vA; varying vec3 vK;
      void main(){ vec3 p = position + vec3(uCamL.x, uCamY, uCamL.z); vA = vec2(aK.x, p.y); vK = aK.yzw;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`, /* glsl */`
      uniform vec3 uInk; uniform float uTime, uRain;
      varying vec2 vA; varying vec3 vK;
      void main(){
        float c = (vA.x + vA.y * .36) / vK.y;
        float id = floor(c), f = abs(fract(c) - .5) * 2.;
        float w = fwidth(c) * 2.;
        float line = 1. - smoothstep(.085 - w, .085 + w, f);
        float h1 = fract(sin(id * 12.9898 + vK.z * 3.7) * 43758.5453), h2 = fract(h1 * 17.31);
        float per = vK.y * 6.;
        float l = vA.y / per + uTime * vK.x + h1 * 9.;
        float lw = min(fwidth(vA.y) / per * 2., .3);
        float dash = smoothstep(.55 - lw, .55 + lw, abs(fract(l) - .5) * 2.);
        float a = line * dash * step(h2, uRain * (.55 + .2 * vK.z)) * step(.001, uRain) * .92;
        gl_FragColor = vec4(uInk, a);
      }`, { uInk: ink.cream }, { fog: false, transparent: true, side: THREE.DoubleSide }), 6);
  }
  await ctx.yield();

  // ---- the paper sky: split fountain, flat sun disc, two far ridge inks, infinite ground with the cloud shadow ---
  let dome = null;
  if (opts.sky !== false) {
    const geo = new THREE.SphereGeometry(3400, 40, 20);
    const rp = [R(0, 1), R(0, 1), R(0, 1), R(0, 1), R(0, 1), R(0, 1)];
    dome = add(geo, mat(/* glsl */`
      varying vec3 vD;
      void main(){ vD = mat3(modelMatrix) * position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`, SERI_GLSL + /* glsl */`
      uniform vec3 uTop, uBot, uSunInk, uGL, uGSh, uR1, uR2; uniform float uGroundY; uniform vec3 uRp, uRq;
      varying vec3 vD;
      float tri(float x){ return abs(fract(x) - .5) * 2.; }
      void main(){
        vec3 d = normalize(vD + vec3(0., 1e-6, 0.));
        float hl = max(length(d.xz), 1e-4), el = d.y / hl;
        vec2 n = d.xz / hl;
        vec3 c = mix(uBot, uTop, smoothstep(.0, .62, el));               // the only gradient in the world
        c = mix(c, uSunInk, aastep(.99915, dot(d, uSun)));
        float r2 = .020 + .034 * (.5 * tri(n.x * 2.3 + uRp.x) + .32 * tri(n.y * 4.1 + uRp.y) + .18 * tri((n.x + n.y) * 7.7 + uRp.z));
        float r1 = .007 + .030 * (.55 * tri(n.y * 1.7 + uRq.x) + .3 * tri(n.x * 3.3 + uRq.y) + .15 * tri((n.x - n.y) * 6.1 + uRq.z));
        c = mix(c, uR2, 1. - aastep(r2, el));
        c = mix(c, uR1, 1. - aastep(r1, el));
        float t = (cameraPosition.y - uGroundY) / max(-d.y, 1e-4);
        vec2 gp = cameraPosition.xz + d.xz * min(t, 60000.);
        float sh = cellShade(gp);
        c = mix(c, mix(uGL, uGSh, sh), 1. - aastep(0., el));
        gl_FragColor = vec4(c, 1.);
      }`, { uTop: ink.skyTop, uBot: ink.skyBot, uSunInk: ink.sun, uGL: ink.groundL, uGSh: ink.groundSh,
      uR1: mixc(mixc(ink.violet, ink.terra, 0.3), ink.skyBot, 0.42), uR2: mixc(mixc(ink.violet, ink.turq, 0.25), ink.skyBot, 0.64),
      uGroundY: BANK, uRp: new THREE.Vector3(rp[0], rp[1], rp[2]), uRq: new THREE.Vector3(rp[3], rp[4], rp[5]) },
      { fog: false, side: THREE.BackSide, depthWrite: false }), -0.9);
  }

  // ---- hooks, animation, anchors --------------------------------------------------------------------------------
  const uPass = opts.uPass ?? 0.69, uSpeed = opts.uSpeed ?? 480;
  let sunSet = false, shadowSet = false, manualStrike = -1, lastTime = 0, strikeBolt = 0, boltF = -1, boltK = 0;
  const _v = new THREE.Vector3(), _p = new THREE.Vector3(), _q = new THREE.Quaternion();
  const env = (t) => (t <= 0 ? 0 : t < 0.1 ? (t / 0.1) * (t / 0.1) * (3 - (2 * t) / 0.1) : t < 0.35 ? 1 : t < 0.75 ? 1 - ((t - 0.35) / 0.4) ** 2 : 0);
  const PERIOD = R(6.2, 8.0), autoStrike = opts.lightning !== false;
  const hash1 = (k) => { const s = Math.sin(k * 127.1 + wP1 * 11.7) * 43758.5453; return s - Math.floor(s); };
  const hero = {
    object: root, radius: 8, height: 6, center: new THREE.Vector3(0, 2.0, 0), ground: false, groundY: 0,
    wash: { halfWidth: HW, bankHeight: BANK, zMin: ZMIN, zMax: ZMAX, centerX, profile, bankDist: (x, z) => Math.min(x - xLeft(z), xRight(z) - x), cut },
    serigraph: { glsl: SERI_GLSL, inks: ink, T1, T2 },
    uniforms: U,                                             // shared uniform objects (uTime, uSun, uShadow, uShadowB, uPaper, uOver) for the world's own inks
    stats: { triangles: Math.round(tris), drawCalls: root.children.length },
    setFrontZ(z) { U.uFront.value = Math.max(ZMIN + 12, Math.min(ZMAX - 6, z)); },
    setProgress(u) { hero.setFrontZ(uSpeed * (u - uPass)); },
    setRain(a) { U.uRain.value = Math.max(0, Math.min(1, a)); },
    setAnvil(a) { U.uAnvil.value = Math.max(0, Math.min(1, a)); },
    setSun(dir) { U.uSun.value.copy(dir).normalize(); sunSet = true; },
    setShadow(nx, nzz, d, on = 1) { const l = Math.hypot(nx, nzz) || 1; U.uShadow.value.set(nx / l, nzz / l, d / l, on); shadowSet = true; },
    strike() { manualStrike = lastTime; strikeBolt = (strikeBolt + 1) % NB; },
    setShadowB(nx, nzz, d, on = 1) { const l = Math.hypot(nx, nzz) || 1; U.uShadowB.value.set(nx / l, nzz / l, d / l, on); },
    setBolt(f, k = 0) { boltF = f; boltK = ((k % NB) + NB) % NB; },   // f >= 0: a zigzag held by the world (keyed to u); f < 0: back to the clock
    update(dt, time, camera) {
      lastTime = time; U.uTime.value = time;
      root.updateWorldMatrix(true, false);
      if (camera) { _v.setFromMatrixPosition(camera.matrixWorld); root.worldToLocal(_v); U.uCamL.value.copy(_v); U.uCamY.value = _v.y; if (dome) dome.position.copy(_v); }
      if (!sunSet) { root.getWorldQuaternion(_q); U.uSun.value.copy(sunLocal).applyQuaternion(_q).normalize(); }
      if (!shadowSet) { // default: everything upstream of local z = +30 lies under the cell
        root.getWorldQuaternion(_q); _v.set(-0.5, 0, -0.866).applyQuaternion(_q); _p.set(0, 0, 9); root.localToWorld(_p);
        const l = Math.hypot(_v.x, _v.z) || 1; U.uShadow.value.set(_v.x / l, _v.z / l, -(_v.x * _p.x + _v.z * _p.z) / l, 1);
      }
      // one eased zigzag at a time, at least 2.5 s apart, never a full-frame flash
      let f = 0, bolt = 0;
      if (autoStrike) { const k = Math.floor(time / PERIOD), t0 = k * PERIOD + 0.6 + hash1(k) * (PERIOD - 4.2); f = env(time - t0); bolt = Math.floor(hash1(k + 0.5) * NB) % NB; }
      if (manualStrike >= 0) { const fm = env(time - manualStrike + 1e-3); if (fm > f) { f = fm; bolt = strikeBolt; } if (time - manualStrike > 0.8) manualStrike = -1; }
      if (boltF > f) { f = Math.min(1, boltF); bolt = boltK; }
      U.uFlash.value = f; U.uBolt.value = bolt;
    },
    dispose() { for (const d of disposables) d.dispose(); },
  };
  hero.setFrontZ(opts.frontZ ?? 0);
  const P = (off, y, z) => new THREE.Vector3(centerX(z) + off, y, z);
  hero.anchors = {
    flyThrough: [P(-30, BANK + 1.6, 96), P(-17.5, BANK + 1.6, 69), P(-12, 1.6, 57), P(-1, 1.6, 36), P(10, 1.6, 15), P(17.5, BANK + 1.6, 2), P(27, BANK + 1.6, -20)],
    viewpoints: { headOn: P(-4, 2.6, 46), bankPass: P(25, BANK + 1.8, 8), behind: P(-22, BANK + 3.5, -34) },
    frontCenter: new THREE.Vector3(0, DEPTH + 1.2 * LOBE, U.uFront.value),
    cellDir: cellDirL.clone(), sunDir: sunLocal.clone(), washDir: new THREE.Vector3(0, 0, 1),
    portalSeat: { position: P(64, BANK + 5, -150), facing: new THREE.Vector3(-0.3, 0, 0.954).normalize() },
  };
  hero.update(0, 0, null);
  return hero;
}
