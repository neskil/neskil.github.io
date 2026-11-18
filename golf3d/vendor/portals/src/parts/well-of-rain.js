// THE SPIRAL FALL AND THE RING: hero set piece for "well-of-rain".
//
// What it is (local space, origin at the base centre of the well, +Y up, front = +Z):
//   - The Spiral Fall: 68 giant basin-leaves (20 m lily pads with upturned rims and a pour spout) set as the
//     treads of a helical stair at radius 30 m, 12.5 m apart in height and 30 degrees round from each other,
//     from y = 895 (5 m under the canopy rim at y = 900) down to y = 57.5. Each basin fills, dips up to 2 m
//     under the load, tips, pours a 10 m wide curtain onto the next and springs back with a shudder and a
//     crown of drops; the cycle travels down the stair as a wave. Every basin hangs on a stalk grown from
//     the nearest of six trunks.
//   - Six bark trunks (40 m thick, centres on a 60 m circle at 30 + k*60 degrees from +Z, so the +Z and -Z
//     directions are gaps). They are part of this mesh so the stair has something to hang from; pass
//     opts.trunks = false if the world builds its own (anchors.trunks gives the centres either way).
//   - The root bridge: a braided living bridge 12 m wide along the Z axis, deck at y ~ 30 (870 m down), forking
//     into the four flanking trunks at both ends, with rails, moss, hanging root-hairs.
//   - The root arch at z = -26 on the bridge: braided roots round a 7.75 m clear opening for the upright
//     14 m portal, scarlet blossoms on it; the last curtain of the Spiral Fall drops behind it.
//   - The Ring: a full-circle rainbow (primary, bright inner disc, faint reversed secondary), additive and
//     fog-exempt, depth-tested, on the camera-to-portal ray at most 46 m from the lens (so nearer basins hide it) and
//     30 m beyond the portal at the end, angular radius 24 degrees, world radius never below opts.rainbowMinRadius. Plus the white-gold pool of portal glow on
//     the wet deck (fog-exempt, so it reads from hundreds of metres above).
//
// Trunks are fluted (ribs 3.6 m deep) by trunkRadius(k, a, y), exported with its GLSL twin GL_TRUNK so a world can stand
//   growth on the bark. opts.trunkArc (degrees either side of the inward face, default 180 = whole trunk) builds only the part
//   seen from inside the well.
// opts: palette (7 hex strings, brief order: sky, pale yellow, leaf green, emerald, teal, bark, scarlet),
//       trunks (true), handed (+1 | -1, default per seed: which way the stair winds going down),
//       rainbowMinRadius (20), rainbowAngle (24 degrees), glow (1), preview ('top'|'in'|'mid'|'bottom').
//
// anchors (all local space):
//   portalSeat   { position, normal, radius }  centre of the upright 14 m portal inside the arch; faces +Z
//                (the camera arrives flying toward -Z).
//   flyThrough   ordered Vector3 list: the last turns of the descending helix 12 m from the axis, the swoop
//                out to +Z and the level run along the bridge to the portal. At least 6 m clear of everything.
//   helix        { radius: 12, pointAt(y) } the suggested camera helix inside the stair (counter-winds).
//   basinAt(i)   { position, angle } rest position of basin i (0 = top), for close passes and frogs.
//   closePass    a point 4 m off the rim of a basin in the upper storey (the "4 m from the lens" beat).
//   trunks       six { x, z, radius } trunk centres.   bridge { y, halfWidth, z0, z1 }.
//   rainbowCentre, viewpoints (named camera positions that frame the piece), topY, bottomY.
//
// Progress hook: hero.setProgress(u) with the world's path u. It fades the rainbow in over u = 0.58..0.80 (the "closes into
//   a full circle" reveal) and the portal's light (pool, bridge strip, column, halo; all fog-exempt) over u = 0.50..0.68. Never called = fully on (viewer). Finer control:
//   hero.uniforms.uRainbow.value / uGlow.value. Basin cycles are ambient and run on `time`.
//
// Strata: the trunk bark is laid in courses 13 m high (top line of course n on trunk k at y = 13 n - 3 sin(2.4 k)): each course has
//   its own earth colour and bedding lines, a ledge at its top that catches the light from the mouth (mossy in places) and an
//   undercut in shadow beneath it. hero.uniforms.uVil (y, strength, 2 sigma^2, -) adds warm lantern light to the wood round that
//   height (0 strength = off, the default); hero.uniforms.uMistK scales the slow spray banks round the bridge (1 = default).
// Lighting: self-lit ShaderMaterials (no scene lights needed, none added). One key straight down the shaft,
//   warm white, broken into drifting pools by a procedural leaf-gap cookie (matches god-ray columns that are
//   vertical); ambient graded by depth below y = 900 through hero.uniforms.uAmbA..D (0, 200, 550, 900 m).
//   Scene fog is honoured (fog chunks) on everything except rainbow and glow. Expects bloom.
// Size: radius 62 (trunk outer faces 80), height 900. Cost: ~137k triangles, 10 draw calls, ~150 ms build.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#BFE9F2', '#F6F0B8', '#6DBB4A', '#1F6B4A', '#0D3338', '#3A2A22', '#FF5A3C'];
const TOP = 900, STEP = 12.5, HR = 30, BR = 10, NB = 68, Y0 = 895, DECK = 30, PORTAL_Z = -26, PORTAL_R = 7;
const TAU = Math.PI * 2, V3 = THREE.Vector3;

// ---------------------------------------------------------------- shared GLSL
const GL_NOISE = /* glsl */`
float h13(vec3 p){ p=fract(p*0.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float vn3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h13(i),h13(i+vec3(1,0,0)),f.x),mix(h13(i+vec3(0,1,0)),h13(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h13(i+vec3(0,0,1)),h13(i+vec3(1,0,1)),f.x),mix(h13(i+vec3(0,1,1)),h13(i+vec3(1,1,1)),f.x),f.y),f.z); }
`;
const GL_LIGHT = /* glsl */`
uniform vec3 uAmbA,uAmbB,uAmbC,uAmbD,uSunCol,uCamL,uPortal,uGlowCol; uniform float uTime,uGlow,uSunGain,uHourK;
vec3 ambAt(float y){ float d=${TOP}.0-y; vec3 c=mix(uAmbA,uAmbB,smoothstep(0.0,200.0,d));
  c=mix(c,uAmbC,smoothstep(200.0,550.0,d)); return mix(c,uAmbD,smoothstep(550.0,880.0,d)); }
// leaf-gap cookie: vertical columns of sun that drift and flicker; thins out with depth
float sunAt(vec3 p){ float d=${TOP}.0-p.y; vec2 q=p.xz*0.07;
  float n=vn3(vec3(q,uTime*0.11+p.y*0.003))*0.72+vn3(vec3(q*2.9+5.0,uTime*0.37))*0.28;
  return smoothstep(0.40,0.60,n)*mix(1.0,0.5,smoothstep(0.0,880.0,d))*mix(0.7,1.0,smoothstep(0.0,170.0,d))*uSunGain; }
// white-gold spill of the portal on wet things near it
vec3 waterLight(vec3 p){ vec3 a=ambAt(p.y); return min(mix(a,vec3(dot(a,vec3(0.3,0.5,0.2))),0.6)*1.3+uSunCol*sunAt(p)*0.62,vec3(1.45)); }
// falling and broken water: white-blue, lit by the depth ambient and the sun cookie, never below a pale floor
vec3 whiteWater(vec3 p){ float l=dot(ambAt(p.y),vec3(0.3,0.5,0.2));
  return vec3(0.80,0.92,1.0)*min(l*1.15+0.24*uHourK+dot(uSunCol,vec3(0.2))*sunAt(p),1.5); }
vec3 portalSpill(vec3 p, vec3 n){ vec3 L=uPortal-p; float d2=dot(L,L); L*=inversesqrt(d2+0.01);
  return uGlowCol*uGlow*(0.35+0.65*max(dot(n,L),0.0))*40.0/(40.0+d2); }
`;
// basin cycle shared by leaves, pools, stalks, curtains and drops.
// returns x = water level 0..1, y = dip in metres, z = tip angle, w = pour strength 0..1
export const GL_CYCLE = /* glsl */`
uniform float uRate,uLag;
float cyclePhase(float idx,float seed){ return fract(uTime*uRate-idx*uLag+seed*0.07); }
vec4 basinCycle(float idx,float seed){ float ph=cyclePhase(idx,seed);
  float lvl=smoothstep(0.0,0.60,ph)*(1.0-smoothstep(0.64,0.84,ph));
  float tip=smoothstep(0.60,0.72,ph)*(1.0-smoothstep(0.78,0.92,ph));
  float q=fract(ph-0.82); float shud=exp(-q*11.0)*sin(q*46.0)*smoothstep(0.0,0.02,q);
  float dip=2.0*lvl*lvl*(3.0-2.0*lvl)*0.6+1.2*lvl-0.75*shud;
  float pour=0.30+0.70*smoothstep(0.60,0.70,ph)*(1.0-smoothstep(0.80,0.93,ph));
  return vec4(lvl,dip,tip*0.30+0.035*sin(uTime*0.8+seed*9.0)+0.06*shud,pour); }
// place a point given in basin-local space (x = downstream tangent, z = radially out) on the stair
uniform float uHand;
vec3 stairPlace(vec3 p,float ang,float y){ vec3 er=vec3(sin(ang),0.0,cos(ang)); vec3 et=uHand*vec3(cos(ang),0.0,-sin(ang));
  return er*(${HR}.0+p.z)+et*p.x+vec3(0.0,y+p.y,0.0); }
vec3 stairDir(vec3 n,float ang){ vec3 er=vec3(sin(ang),0.0,cos(ang)); vec3 et=uHand*vec3(cos(ang),0.0,-sin(ang));
  return er*n.z+et*n.x+vec3(0.0,n.y,0.0); }
vec3 tipRot(vec3 p,float t){ float c=cos(t), s=sin(t); return vec3(p.x*c+p.y*s,-p.x*s+p.y*c,p.z); }
`;
// trunk surface: radius of trunk k (0..5) at angle a (x = cos a, z = sin a from the trunk centre) and height y. Closed form (sines
// only), so the world's shaders can stand growth exactly on the bark with GL_TRUNK. Ribs 3.6 m deep, lumps of 1.3 m.
export function trunkRadius(k, a, y) {
  const w = 0.8 * Math.sin(y * 0.013 + k * 2.1) + 0.5 * Math.sin(y * 0.047 + k * 1.3 + a);
  const fl = Math.pow(Math.abs(Math.sin(a * 4.5 + w)), 0.6);
  const lump = Math.sin(y * 0.041 + k * 1.7 + 2.0 * Math.sin(a * 2.0 + k)) * 0.6 + Math.sin(y * 0.113 + a * 3.0 + k * 4.0) * 0.4;
  return 18.2 + 3.6 * fl + 1.3 * lump;
}
export const GL_TRUNK = /* glsl */`
float trunkR(float k,float a,float y){ float w=0.8*sin(y*0.013+k*2.1)+0.5*sin(y*0.047+k*1.3+a);
  float fl=pow(abs(sin(a*4.5+w)),0.6); float lump=sin(y*0.041+k*1.7+2.0*sin(a*2.0+k))*0.6+sin(y*0.113+a*3.0+k*4.0)*0.4;
  return 18.2+3.6*fl+1.3*lump; }
`;
const FOG_V = '\n#include <fog_vertex>\n', FOG_F = '\n#include <fog_fragment>\n';

// ---------------------------------------------------------------- merged-mesh builder
function makeBuf() { return { p: [], n: [], c: [], fx: [], bs: [], i: [] }; }
const _T = new V3(), _N = new V3(), _B = new V3();
// pts: Vector3[]; rad(t), col(t) -> [r,g,b]; fx(t) -> [sway, glow, moss, kind]; bs(t) -> [idx, seed, weight]
function addTube(B, pts, rad, sides, col, fx, bs, cap = true) {
  const n = pts.length, base = B.p.length / 3;
  _N.set(0.31, 0.2, 0.93).normalize();
  for (let i = 0; i < n; i++) {
    _T.subVectors(pts[Math.min(i + 1, n - 1)], pts[Math.max(i - 1, 0)]).normalize();
    _B.crossVectors(_T, _N); if (_B.lengthSq() < 1e-5) _B.set(_T.y, _T.z, _T.x).cross(_T); _B.normalize();
    _N.crossVectors(_B, _T).normalize();
    const t = i / (n - 1), r = rad(t), c = col(t), f = fx ? fx(t) : [0, 0, 1, 0], b = bs ? bs(t) : [0, 0, 0], P = pts[i];
    for (let k = 0; k < sides; k++) {
      const a = (k / sides) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const nx = _N.x * ca + _B.x * sa, ny = _N.y * ca + _B.y * sa, nz = _N.z * ca + _B.z * sa;
      const rr = r * (1 + 0.07 * Math.sin(k * 2.4 + i * 0.9));
      B.p.push(P.x + nx * rr, P.y + ny * rr, P.z + nz * rr); B.n.push(nx, ny, nz);
      const sh = 0.86 + 0.14 * Math.sin(k * 1.7 + i * 0.37);
      B.c.push(c[0] * sh, c[1] * sh, c[2] * sh); B.fx.push(f[0], f[1], f[2], f[3]); B.bs.push(b[0], b[1], b[2]);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) {
    const a = base + i * sides + k, b = base + i * sides + (k + 1) % sides, c = a + sides, d = b + sides;
    B.i.push(a, b, c, b, d, c);
  }
  if (cap) { // close the far end with a fan so tapered tips are not open pipes
    const ci = B.p.length / 3, P = pts[n - 1], c = col(1), f = fx ? fx(1) : [0, 0, 1, 0], b = bs ? bs(1) : [0, 0, 0];
    B.p.push(P.x + _T.x * rad(1) * 0.6, P.y + _T.y * rad(1) * 0.6, P.z + _T.z * rad(1) * 0.6); B.n.push(_T.x, _T.y, _T.z);
    B.c.push(c[0], c[1], c[2]); B.fx.push(f[0], f[1], f[2], f[3]); B.bs.push(b[0], b[1], b[2]);
    const r0 = base + (n - 1) * sides; for (let k = 0; k < sides; k++) B.i.push(r0 + k, r0 + (k + 1) % sides, ci);
  }
}
// a flat-ish petal/leaflet fan: centre c, direction d, side s (Vector3), length L, width W, cupped
function addPetal(B, c, d, s, up, L, W, col, glow, kind = 1) {
  const base = B.p.length / 3, R = 4, S = 2;
  for (let i = 0; i <= R; i++) for (let j = -S; j <= S; j++) {
    const t = i / R, w = Math.sin(Math.PI * Math.pow(t, 0.7)) * W * 0.5 * (j / S), cup = (Math.abs(j / S) ** 2) * W * 0.22 + t * t * L * 0.28;
    B.p.push(c.x + d.x * t * L + s.x * w + up.x * cup, c.y + d.y * t * L + s.y * w + up.y * cup, c.z + d.z * t * L + s.z * w + up.z * cup);
    B.n.push(up.x, up.y, up.z); const sh = 0.75 + 0.25 * t;
    B.c.push(col[0] * sh, col[1] * sh, col[2] * sh); B.fx.push(0.15 * t, glow * (0.4 + 0.6 * t), 0, kind); B.bs.push(0, 0, 0);
  }
  const W1 = 2 * S + 1;
  for (let i = 0; i < R; i++) for (let j = 0; j < 2 * S; j++) { const a = base + i * W1 + j; B.i.push(a, a + 1, a + W1, a + 1, a + W1 + 1, a + W1); }
}
function lin(hex) { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; }
function mix3(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function v3c(a, s = 1) { return new THREE.Color(a[0] * s, a[1] * s, a[2] * s); }

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('well-of-rain-hero'), noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map(lin);
  const [cSky, cPale, cLeaf, cEmerald, cTeal, cBark, cScarlet] = pal;
  const hand = opts.handed === 1 || opts.handed === -1 ? opts.handed : rng.sign();
  const withTrunks = opts.trunks !== false;
  const hueShift = rng.range(-1, 1);                 // per seed: leaves lean yellow (-1) or blue-green (+1)
  const rimRed = rng.range(0.25, 1);                 // how scarlet the leaf rims and undersides are
  const rate = 1 / rng.range(6.0, 8.5), lag = rng.range(0.07, 0.11);
  const archStrands = rng.int(4, 6), archTwist = rng.range(2.2, 3.4) * rng.sign();
  const deckY = (z) => DECK + 0.0009 * z * z;
  const portalC = new V3(0, deckY(PORTAL_Z) + 8.2, PORTAL_Z);
  const group = new THREE.Group(); group.name = 'well-of-rain-hero';

  const U = {
    uTime: { value: 0 }, uRate: { value: rate }, uLag: { value: lag }, uHand: { value: hand },
    uAmbA: { value: v3c(mix3(cPale, cLeaf, 0.4), 0.95) }, uAmbB: { value: v3c(mix3(cLeaf, cEmerald, 0.7), 1.5) },
    uAmbC: { value: v3c(cEmerald, 2.3) }, uAmbD: { value: v3c(mix3(cTeal, cEmerald, 0.25), 4.2) },
    uSunCol: { value: new THREE.Color('#FFF4C8').multiplyScalar(2.6) }, uSunGain: { value: 1 }, uHourK: { value: 1 },
    uCamL: { value: new V3(0, 500, 40) }, uPortal: { value: portalC.clone() },
    uGlowCol: { value: new THREE.Color('#FFE9B0').multiplyScalar(2.4) }, uGlow: { value: opts.glow ?? 1 },
    uRainbow: { value: 1 }, uPx: { value: 600 }, uMistK: { value: 1 }, uVil: { value: new THREE.Vector4(410, 0, 18000, 0) },   // uVil: warm lantern light on the wood (y of its middle, strength, 2*sigma^2); 0 = off
    uLeafA: { value: v3c(mix3(cLeaf, hueShift < 0 ? cPale : cEmerald, Math.abs(hueShift) * 0.35)) },
    uLeafB: { value: v3c(mix3(cEmerald, cLeaf, 0.25)) }, uPale: { value: v3c(cPale) }, uSky: { value: v3c(cSky) },
    uScarlet: { value: v3c(cScarlet) }, uBark: { value: v3c(cBark) }, uRimRed: { value: rimRed },
  };
  const fogU = () => THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
  const mkU = (extra = {}) => Object.assign(fogU(), U, extra);   // U entries stay shared by reference

  // ---- stair layout
  const basins = [];
  const trunks = []; for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; trunks.push({ x: Math.sin(a) * 60, z: Math.cos(a) * 60, radius: 20, a }); }
  for (let i = 0; i < NB; i++) {
    const ang = Math.PI - hand * (NB - i) * Math.PI / 6, y = Y0 - STEP * i;
    basins.push({ i, ang, y, seed: rng(), scale: rng.range(0.9, 1.08), hue: rng.range(-1, 1),
      pos: new V3(Math.sin(ang) * HR, y, Math.cos(ang) * HR) });
  }

  // ---- wood: trunks, stalks, bridge, arch, root-hairs, blossoms -> one merged mesh
  const B = makeBuf();
  const barkCol = (v = 0) => mix3(cBark, [0.17, 0.105, 0.065], clamp(0.3 + v, 0, 1));
  if (withTrunks) {
    // fluted, buttressed trunks. Only the arc that can be seen from inside the well is built when opts.trunkArc is given.
    const arc = clamp((opts.trunkArc ?? 180) * Math.PI / 180, 0.5, Math.PI), full = arc > Math.PI - 1e-3;
    const SIDES = full ? 56 : Math.max(12, Math.round(36 * arc / 2.0)), ROWS = 110, yA = -40, yB = 904, EA = 0.012, EY = 0.4;
    for (let k = 0; k < 6; k++) {
      const T = trunks[k], base = B.p.length / 3, aIn = Math.atan2(-Math.cos(T.a), -Math.sin(T.a));
      for (let r = 0; r <= ROWS; r++) {
        const y = lerp(yA, yB, r / ROWS);
        for (let s = 0; s <= SIDES; s++) {
          const a = aIn + (s / SIDES * 2 - 1) * arc, ca = Math.cos(a), sa = Math.sin(a);
          const rr = trunkRadius(k, a, y), ra = (trunkRadius(k, a + EA, y) - trunkRadius(k, a - EA, y)) / (2 * EA), ry = (trunkRadius(k, a, y + EY) - trunkRadius(k, a, y - EY)) / (2 * EY);
          let nx = ca * rr + sa * ra, ny = -rr * ry, nz = sa * rr - ca * ra; const nl = 1 / Math.hypot(nx, ny, nz);
          B.p.push(T.x + ca * rr, y, T.z + sa * rr); B.n.push(nx * nl, ny * nl, nz * nl);
          const fl = clamp((rr - 17.0) / 6.0, 0, 1), big = noise.n3(ca * 1.2 + k * 17.3, y * 0.011, sa * 1.2);
          const c = barkCol(0.25 * big + 0.3 * fl - 0.2), ao = 0.42 + 0.58 * smoothstep(0.05, 0.6, fl);
          B.c.push(c[0] * ao, c[1] * ao, c[2] * ao); B.fx.push(0, 0, 1, 2); B.bs.push(0, 0, 0);
        }
        if ((r & 15) === 15) await ctx.yield();
      }
      const W = SIDES + 1;
      for (let r = 0; r < ROWS; r++) for (let s = 0; s < SIDES; s++) { const a = base + r * W + s; B.i.push(a, a + W, a + 1, a + 1, a + W, a + W + 1); }
      await ctx.yield();
    }
  }
  // stalks: from the nearest trunk face up into the underside of each basin
  const tmp = new V3(), dir = new V3();
  for (const b of basins) {
    let best = trunks[0], bd = 1e9;
    for (const T of trunks) { const d = Math.hypot(T.x - b.pos.x, T.z - b.pos.z) + rng.range(0, 3); if (d < bd) { bd = d; best = T; } }
    dir.set(b.pos.x - best.x, 0, b.pos.z - best.z).normalize();
    const p0 = new V3(best.x + dir.x * 16.6, b.y - rng.range(7, 12), best.z + dir.z * 16.6);
    const p3 = new V3(b.pos.x, b.y - 1.45 * b.scale, b.pos.z), len = p0.distanceTo(p3);
    const p1 = p0.clone().addScaledVector(dir, len * 0.45).add(tmp.set(0, -rng.range(1, 4), 0));
    const p2 = p3.clone().add(tmp.set(-dir.x * 2.5, -rng.range(4.5, 7), -dir.z * 2.5));
    const curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3), pts = curve.getPoints(11);
    const r0 = rng.range(0.95, 1.25);
    addTube(B, pts, (t) => r0 * (1.35 - 0.75 * t + 0.9 * Math.pow(t, 9) + 0.5 * Math.pow(1 - t, 6)), 7,
      (t) => mix3(barkCol(0.1), mix3(cEmerald, cLeaf, 0.3), smoothstep(0.25, 0.95, t) * 0.8),
      (t) => [0, 0, 0.5 - 0.5 * t, 0], (t) => [b.i, b.seed, t * t], false);
    // a ruff of bracts where the stalk meets the leaf, and one bromeliad-like tuft on the stalk
    const up = new V3(0, 1, 0);
    for (let j = 0; j < 5; j++) {
      const a = j / 5 * TAU + b.seed * 6, d = new V3(Math.cos(a), -0.35, Math.sin(a)).normalize(), s = new V3(-Math.sin(a), 0, Math.cos(a));
      const n0 = B.p.length / 3; addPetal(B, p3.clone().add(tmp.set(0, -0.6, 0)), d, s, up, 4.6, 2.3, mix3(cEmerald, cBark, 0.25), 0, 1);
      for (let q = n0; q < B.p.length / 3; q++) { B.bs[q * 3] = b.i; B.bs[q * 3 + 1] = b.seed; B.bs[q * 3 + 2] = 1; }
    }
    if ((b.i & 1) === 1) await ctx.yield();
  }
  await ctx.yield();

  // root bridge along Z
  const NS = 9, fork = (z) => smoothstep(26, 50, Math.abs(z));
  for (let j = 0; j < NS; j++) {
    const x0 = (j - (NS - 1) / 2) * 1.45, side = j === 4 ? rng.sign() : Math.sign(x0), ph = rng.range(0, TAU), amp = rng.range(0.35, 0.7);
    const rad0 = rng.range(0.55, 0.85), pts = [];
    for (let z = -52; z <= 52.01; z += 2) {
      const f = fork(z), sgn = z < 0 && j === 4 ? -side : side;
      pts.push(new V3(x0 + amp * Math.sin(z * 0.11 + ph) * (1 - f) + sgn * f * (8.5 + (6 - Math.abs(x0)) * 0.8),
        deckY(z) + 0.3 * Math.sin(z * 0.17 + ph * 2) + f * f * (5 + j * 0.9), z));
    }
    addTube(B, pts, (t) => rad0 * (1 + 0.9 * Math.pow(Math.abs(t * 2 - 1), 3) + 0.12 * Math.sin(t * 60 + ph)), 7,
      (t) => barkCol(0.2 * Math.sin(t * 23 + ph)), () => [0, 0, 0.9, 0], null, false);
  }
  { // woven deck mat under the roots (so the bridge is not a ladder) with a ragged edge
    const base = B.p.length / 3, C = 12, R = 52;
    for (let r = 0; r <= R; r++) for (let c = 0; c <= C; c++) {
      const z = lerp(-52, 52, r / R), f = fork(z), near = Math.exp(-((z - PORTAL_Z) ** 2) / 40);
      const hw = (6.2 + 1.6 * near + 0.6 * noise.n2(z * 0.2, c)) * (1 - f * 0.55), x = (c / C * 2 - 1) * hw;
      B.p.push(x, deckY(z) - 0.15 + 0.22 * noise.n2(x * 0.5, z * 0.5) - 0.5 * (c / C * 2 - 1) ** 2, z); B.n.push(0, 1, 0);
      const cc = mix3(barkCol(-0.1), cEmerald, 0.35); B.c.push(cc[0], cc[1], cc[2]); B.fx.push(0, 0, 1.6, 0); B.bs.push(0, 0, 0);
    }
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { const a = base + r * (C + 1) + c; B.i.push(a, a + C + 1, a + 1, a + 1, a + C + 1, a + C + 2); }
  }
  await ctx.yield();
  for (const sx of [-1, 1]) { // rails with posts, broken at the arch
    for (const [za, zb] of [[-46, PORTAL_Z - 3], [PORTAL_Z + 3, 46]]) {
      const pts = [], ph = rng.range(0, TAU);
      for (let z = za; z <= zb + 0.01; z += 2) { const f = fork(z); pts.push(new V3(sx * (6.7 + f * 6 + 0.3 * Math.sin(z * 0.3 + ph)), deckY(z) + 1.7 + 0.25 * Math.sin(z * 0.23 + ph) + f * f * 7, z)); }
      addTube(B, pts, () => 0.2, 5, () => barkCol(0.1), () => [0, 0, 0.8, 0], null, true);
      for (let q = 1; q < pts.length - 1; q += 2) { const P = pts[q];
        addTube(B, [P.clone(), new V3(P.x - sx * 0.25, P.y - 1.0, P.z + 0.2), new V3(P.x - sx * 0.6, P.y - 2.1, P.z)], (t) => 0.12 + 0.08 * t, 4, () => barkCol(0), () => [0, 0, 0.6, 0], null, false); }
    }
  }
  // root-hairs hanging under the bridge: pale, beaded, swaying
  const hairCol = mix3(cPale, cBark, 0.45);
  for (let h = 0; h < 120; h++) {
    const z = rng.range(-48, 48), f = fork(z), x = rng.range(-6.5, 6.5) * (1 + f), L = rng.range(5, 17) * (rng.chance(0.15) ? 1.6 : 1);
    const y = deckY(z) - 0.5, bend = rng.range(-1.5, 1.5), pts = [];
    for (let q = 0; q <= 5; q++) { const t = q / 5; pts.push(new V3(x + bend * t * t, y - L * t, z + bend * 0.5 * t * t)); }
    const r = rng.range(0.1, 0.2);
    addTube(B, pts, (t) => r * (1.2 - 0.85 * t), 3, (t) => mix3(barkCol(0), hairCol, t), (t) => [t * t * (0.6 + L * 0.06), 0.25 * t, 0, 3], null, true);
  }
  await ctx.yield();

  // root arch round the portal: braided strands on a horseshoe, feet clasping the bridge edges
  const RA = 9.25, A130 = 130 * Math.PI / 180;
  const archPoint = (u, j, n, br0, twist, out) => {
    const s = (u * 2 - 1) * 1.2, as = clamp(s, -1, 1), sg = Math.sign(s) || 1, e = Math.max(Math.abs(s) - 1, 0) / 0.2;
    const phi = as * A130, cx = Math.sin(phi), cy = Math.cos(phi), psi = u * twist * TAU + (j / n) * TAU, br = br0 * (1 + 0.6 * e);
    return out.set(portalC.x + RA * cx + sg * (-0.9 * e + 2.3 * e * e) + cx * Math.cos(psi) * br,
      portalC.y + RA * cy - 4.8 * e + cy * Math.cos(psi) * br, portalC.z + Math.sin(psi) * br * 1.3 + (j - n / 2) * 0.5 * e * e);
  };
  for (let j = 0; j < archStrands; j++) {
    const pts = [], r0 = rng.range(0.42, 0.56);
    for (let q = 0; q <= 74; q++) pts.push(archPoint(q / 74, j, archStrands, 0.78, archTwist, new V3()));
    addTube(B, pts, (t) => r0 * (1 + 1.3 * Math.pow(Math.abs(t * 2 - 1), 7) + 0.1 * Math.sin(t * 90 + j)), 7,
      (t) => barkCol(0.2 * Math.sin(t * 31 + j * 2)), () => [0, 0, 0.55, 0], null, true);
  }
  await ctx.yield();
  for (let j = 0; j < 2; j++) { // thin vines wound the other way
    const pts = []; for (let q = 0; q <= 90; q++) pts.push(archPoint(0.04 + 0.92 * q / 90, j, 2, 1.36, -archTwist * 2.6, new V3()));
    addTube(B, pts, () => 0.15, 4, () => mix3(cEmerald, cBark, 0.4), () => [0, 0, 0.3, 0], null, true);
  }
  { // scarlet blossoms and a crest of leaves on the arch: the one warm accent beside the portal
    const ax = new V3(), e1 = new V3(), e2 = new V3(), d = new V3(), s = new V3(), c = new V3();
    const nBl = rng.int(9, 14);
    for (let q = 0; q < nBl; q++) {
      const phi = rng.range(-1, 1) * 2.0, cx = Math.sin(phi), cy = Math.cos(phi), front = rng.chance(0.75) ? 1 : -1;
      c.set(portalC.x + (RA + rng.range(0.7, 1.5)) * cx, portalC.y + (RA + rng.range(0.7, 1.5)) * cy, portalC.z + front * rng.range(0.6, 1.3));
      ax.set(cx * 0.55, cy * 0.55, front * 0.8).normalize(); e1.set(-cy, cx, 0); e2.crossVectors(ax, e1).normalize();
      const L = rng.range(0.9, 1.6), np = 6, sp = rng.range(0, TAU);
      for (let k = 0; k < np; k++) {
        const a = sp + k / np * TAU; d.copy(e1).multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a)).addScaledVector(ax, 0.35).normalize();
        s.crossVectors(ax, d).normalize(); addPetal(B, c, d, s, ax, L, L * 0.7, cScarlet, 1, 1);
      }
      addTube(B, [c.clone(), c.clone().addScaledVector(ax, 0.45)], () => 0.22, 5, () => cPale, () => [0, 1.6, 0, 1], null, true);
    }
    for (let q = 0; q < 9; q++) { // crest
      const a = (q / 8 - 0.5) * 1.5, zs = (q % 2 ? 1 : -1) * rng.range(0.2, 0.9);
      c.set(portalC.x + Math.sin(a) * (RA + 0.6), portalC.y + Math.cos(a) * (RA + 0.6), portalC.z + zs * 0.6);
      d.set(Math.sin(a) * 0.9, 0.75, zs).normalize(); s.set(Math.cos(a), -Math.sin(a) * 0.3, 0).normalize(); ax.crossVectors(s, d).normalize(); if (ax.z * zs < 0) ax.negate();
      addPetal(B, c, d, s, ax, rng.range(2.4, 4.2), 1.2, mix3(cLeaf, cEmerald, rng.range(0.1, 0.7)), 0, 1);
    }
  }
  await ctx.yield();
  const woodGeo = new THREE.BufferGeometry();
  woodGeo.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3));
  woodGeo.setAttribute('normal', new THREE.Float32BufferAttribute(B.n, 3));
  await ctx.yield();
  woodGeo.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 3));
  woodGeo.setAttribute('aFx', new THREE.Float32BufferAttribute(B.fx, 4));
  woodGeo.setAttribute('aBs', new THREE.Float32BufferAttribute(B.bs, 3));
  await ctx.yield();
  woodGeo.setIndex(B.i);
  await ctx.yield();
  const woodMat = new THREE.ShaderMaterial({
    uniforms: mkU(), fog: true, vertexColors: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      uniform float uTime; ${GL_CYCLE}
      attribute vec4 aFx; attribute vec3 aBs; varying vec3 vP,vN,vC; varying vec4 vFx;
      void main(){ vec3 p=position;
        if(aBs.z>0.0){ vec4 cy=basinCycle(aBs.x,aBs.y); p.y-=cy.y*aBs.z; }
        p.x+=aFx.x*sin(uTime*0.9+p.z*0.35+p.y*0.21)*0.9; p.z+=aFx.x*cos(uTime*0.7+p.x*0.3+p.y*0.17)*0.6;
        vP=p; vN=normal; vC=color; vFx=aFx;
        vec4 mvPosition=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      ${GL_NOISE} ${GL_LIGHT}
      uniform vec3 uLeafA,uLeafB,uPale; uniform vec4 uVil; varying vec3 vP,vN,vC; varying vec4 vFx;
      void main(){ vec3 N=normalize(vN), V=normalize(uCamL-vP); float kind=vFx.w;
        bool soft=kind>0.5&&kind<1.5; if(soft&&dot(N,V)<0.0) N=-N;
        float n1=vn3(vP*vec3(0.8,0.4,0.8)), n2=vn3(vP*vec3(3.3,1.3,3.3)+11.0);
        float fur=abs(vn3(vP*vec3(2.3,0.3,2.3)+3.0)*2.0-1.0), crev=smoothstep(0.02,0.3,fur);
        float plate=smoothstep(0.35,0.65,vn3(vP*vec3(0.5,0.9,0.5)+20.0));
        vec3 alb=vC*(0.72+0.45*n1)*(0.8+0.4*n2)*(0.5+0.5*crev)*(0.85+0.3*plate);
        bool trunk=kind>1.5&&kind<2.5; float D=${TOP}.0-vP.y, shelf=0.0, strataLip=0.0, strataUnder=0.0; vec3 Ng=N;
        if(trunk){ float lich=smoothstep(0.55,0.8,vn3(vP*vec3(0.11,0.12,0.11)+40.0)), wetk=smoothstep(0.62,0.9,vn3(vec3(vP.x*0.45,vP.y*0.12,vP.z*0.45)+7.0));
          // plate rings: the bark is laid in storeys, a dark wet seam every 11 m with a shelf of moss standing on it
          float rf=fract(vP.y*0.09+n1*0.5+1.6*vn3(vP*vec3(0.05,0.012,0.05)+9.0)), ring=smoothstep(0.40,0.5,abs(rf-0.5)); shelf=smoothstep(0.06,0.13,rf)*smoothstep(0.44,0.16,rf);
          alb=mix(alb,vec3(dot(alb,vec3(0.4,0.4,0.2))),0.1)*2.3; alb=mix(alb,uPale*0.22*(0.6+0.8*n2),lich*0.45*crev); alb*=(1.0-0.35*wetk)*(1.0-0.3*ring)*(0.8+0.3*smoothstep(0.5,1.0,rf));
          // strata: the wall is laid in courses 13 m high. Each course has its own earth colour, fine bedding lines, a ledge at its
          // top that catches the light from the mouth and an undercut in shadow beneath it, so the fall is measured as it passes
          float kt=mod(floor(atan(vP.x,vP.z+1e-4)/1.0471976)+6.0,6.0), ta=atan(vP.x-60.0*sin((kt+0.5)*1.0471976),vP.z-60.0*cos((kt+0.5)*1.0471976)+1e-4);
          float sy=(vP.y+3.0*sin(kt*2.4))/13.0+0.07*sin(ta*5.0+kt)+0.05*(n1-0.5), sf=fract(sy), sid=floor(sy);
          float hb=fract(sin(sid*12.9898+kt*78.233)*43758.5453), hb2=fract(hb*7.31+0.37);
          vec3 earth=mix(mix(vec3(1.25,0.92,0.6),vec3(0.8,0.72,0.62),hb),mix(vec3(1.35,0.74,0.44),vec3(0.62,0.8,0.6),hb2),0.5*hb2);
          alb*=mix(vec3(1.0),earth,0.75)*(0.82+0.36*hb2);
          float bed=smoothstep(0.34,0.5,abs(fract(sy*5.0+0.3*n1+0.2*hb)-0.5));
          alb*=1.0-0.3*bed*(0.4+0.6*crev);
          float lipW=0.05+0.07*vn3(vec3(ta*2.3,sid*3.7,kt*5.0)), mossK=smoothstep(0.35,0.6,vn3(vec3(ta*3.1+sid,sid*1.7,kt*3.0)));
          strataLip=smoothstep(1.0-lipW-0.05,1.0-lipW,sf); strataUnder=smoothstep(0.52,0.84,sf)*(1.0-strataLip);
          alb=mix(alb,mix(uLeafB,uLeafA,0.35+0.4*n2)*0.7,strataLip*mossK*(0.5+0.5*n1)); shelf=max(shelf,strataLip*0.6*mossK); strataLip*=0.45+0.55*mossK; }
        if(!soft){ N=normalize(N+((n2-0.5)*0.6+(crev-0.6)*0.5)*vec3(N.z,0.3,-N.x));
          float m=clamp(vFx.z,0.0,1.0)*smoothstep(0.52,0.80,N.y*0.5+0.5*n1+0.10*vFx.z)*(0.5+0.5*crev);
          m=max(m,shelf*smoothstep(0.25,0.6,n1+0.3*n2)*0.85);
          alb=mix(alb,mix(uLeafB,uLeafA,n2*0.45)*0.6,m); }
        else alb=vC*(0.75+0.5*n2);
        vec3 amb=ambAt(vP.y); float sun=sunAt(vP), al=dot(amb,vec3(0.3,0.5,0.2)); amb=mix(amb,vec3(al),0.35)*1.2;
        if(!soft) amb=mix(amb,vec3(1.14,1.0,0.84)*al*1.2,trunk?0.66:0.5);              // bark stays umber under green light
        vec3 col=alb*(amb*(0.62+0.38*N.y)+uSunCol*sun*max(N.y*0.85+(trunk?0.42:0.24),0.0));
        if(trunk){ // the key comes down the shaft: faces that look into the well are lit, the flanks toward the gaps fall into a dark crease
          vec2 inr=-normalize(vP.xz+vec2(1e-4,0.0)); float inw=max(dot(N,normalize(vec3(inr.x,0.5,inr.y))),0.0);
          float occ=mix(0.45,1.0,smoothstep(-0.35,0.55,dot(normalize(Ng.xz+vec2(1e-4,0.0)),inr)));
          col=col*occ+alb*uSunCol*uSunGain*0.3*inw*inw*mix(1.0,0.5,smoothstep(0.0,880.0,D));
          col*=1.0-0.62*strataUnder; col+=alb*(amb*0.5+uSunCol*uSunGain*0.34*mix(1.0,0.55,smoothstep(0.0,880.0,D)))*strataLip; }
        if(!soft) col+=alb*vec3(1.0,0.56,0.2)*uVil.y*exp(-max(abs(vP.y-uVil.x)-uVil.w,0.0)*max(abs(vP.y-uVil.x)-uVil.w,0.0)/uVil.z)*(0.55+0.45*max(N.y,0.0));
        float fr=pow(1.0-max(dot(N,V),0.0),3.0); vec3 sp=portalSpill(vP,N);
        col+=amb*fr*0.25+alb*sp*1.2+sp*(fr*0.45+0.06)*(trunk?0.4:1.0)+vC*vFx.y*2.0;
        if(!soft){ float tex=(0.45+0.55*crev)*(0.6+0.8*n2), deep=smoothstep(520.0,860.0,D), low=smoothstep(330.0,150.0,vP.y);
          vec3 Lp=normalize(uPortal-vP+vec3(0.0,1e-3,0.0)); float d2=dot(uPortal-vP,uPortal-vP);
          col+=(vec3(0.014,0.05,0.055)*uHourK*deep+vec3(0.006,0.013,0.014))*tex;                                 // the deep never falls to black
          col+=vec3(0.52,0.82,0.9)*0.16*uHourK*low*tex*(0.12+0.88*fr)*(0.35+0.65*max(dot(N,Lp),0.0));   // cool rim from the glow pool and the ring
          vec3 R=reflect(-V,N); float wst=smoothstep(0.55,0.85,vn3(vec3(vP.x*0.5,vP.y*0.12,vP.z*0.5)+7.0));
          col+=uGlowCol*uGlow*(0.05*max(dot(N,Lp),0.0)*tex+0.22*wst*pow(max(dot(R,Lp),0.0),6.0))*900.0/(900.0+d2); }
        gl_FragColor=vec4(col,1.0); ${FOG_F} }`,
  });
  const wood = new THREE.Mesh(woodGeo, woodMat); wood.frustumCulled = false; group.add(wood);
  await ctx.yield();

  // ---- basin leaves (instanced)
  const instA = new Float32Array(NB * 4), instV = new Float32Array(NB * 2), instP = new Float32Array(NB);
  basins.forEach((b, i) => { instA.set([b.ang, b.y, b.i, b.seed], i * 4); instV.set([b.scale, b.hue], i * 2); instP[i] = i ? basins[i - 1].seed : 0.5; });
  const addInst = (g) => { g.setAttribute('aInst', new THREE.InstancedBufferAttribute(instA, 4)); g.setAttribute('aVar', new THREE.InstancedBufferAttribute(instV, 2));
    g.setAttribute('aPrev', new THREE.InstancedBufferAttribute(instP, 1)); g.instanceCount = NB; return g; };
  const leafGeo = new THREE.InstancedBufferGeometry();
  {
    const RR = [0, 0.16, 0.34, 0.52, 0.68, 0.82, 0.91, 0.96, 0.995, 1.025], SEG = 48, P = [], I = [];
    for (let k = 0; k < RR.length; k++) for (let s = 0; s < SEG; s++) {
      const phi = s / SEG * TAU, r = RR[k], dphi = Math.atan2(Math.sin(phi), Math.cos(phi));
      const sp = Math.exp(-((dphi / 0.7) ** 2)), wall = smoothstep(0.88, 1.0, r);
      const rad = BR * r * (1 + 0.014 * Math.sin(phi * 6) * wall + 0.11 * sp * smoothstep(0.75, 1.0, r));
      let y = -1.6 * (1 - Math.min(r, 1) ** 2) + 1.15 * wall * (1 - 0.95 * sp) + 0.1 * Math.sin(phi * 6 + 1) * wall * (1 - sp);
      if (k === RR.length - 1) y -= 0.16 * (1 - sp);       // rolled lip
      y -= 0.35 * sp * smoothstep(0.8, 1.02, r);           // the spout droops
      P.push(Math.cos(phi) * rad, y, Math.sin(phi) * rad);
    }
    for (let k = 0; k < RR.length - 1; k++) for (let s = 0; s < SEG; s++) {
      const a = k * SEG + s, b = (k + 1) * SEG + s, c = k * SEG + (s + 1) % SEG, d = (k + 1) * SEG + (s + 1) % SEG;
      if (k > 0) I.push(a, c, b); I.push(c, d, b);
    }
    leafGeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); leafGeo.setIndex(I); leafGeo.computeVertexNormals(); addInst(leafGeo);
  }
  const GL_BASIN_V = /* glsl */`
      #include <fog_pars_vertex>
      uniform float uTime; ${GL_CYCLE}
      attribute vec4 aInst; attribute vec2 aVar; attribute float aPrev;
      varying vec3 vL,vP,vN; varying vec4 vI,vCy; varying float vPrev;`;
  const leafMat = new THREE.ShaderMaterial({
    uniforms: mkU(), fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`${GL_BASIN_V}
      void main(){ vec4 cy=basinCycle(aInst.z,aInst.w); vec3 p=tipRot(position*aVar.x,cy.z); p.y-=cy.y;
        vL=position; vP=stairPlace(p,aInst.x,aInst.y); vN=stairDir(tipRot(normal,cy.z),aInst.x); vI=vec4(aInst.zw,aVar); vCy=cy; vPrev=aPrev;
        vec4 mvPosition=modelViewMatrix*vec4(vP,1.0); gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      ${GL_NOISE} ${GL_LIGHT}
      uniform vec3 uLeafA,uLeafB,uPale,uScarlet,uBark; uniform float uRimRed;
      varying vec3 vL,vP,vN; varying vec4 vI,vCy;
      void main(){ vec3 N=normalize(vN), V=normalize(uCamL-vP); float under=step(dot(N,V),0.0); if(under>0.5) N=-N;
        float r=length(vL.xz)/${BR}.0, a=atan(vL.z,vL.x)/6.2832+vI.y;
        float fa=abs(fract(a*9.0)-0.5)*2.0, fb=abs(fract(a*18.0+0.25)-0.5)*2.0;
        float w=min((0.05+0.07*(1.0-r))/(r+0.04),1.0);
        float rib=1.0-smoothstep(w*0.45,w,fa); rib=max(rib,(1.0-smoothstep(w*0.5,w*1.2,fb))*smoothstep(0.45,0.6,r)*0.7);
        float web=(1.0-smoothstep(0.0,0.09,abs(fract(r*6.0+0.7*vn3(vec3(vL.xz*0.45,vI.y*7.0)))-0.5)))*0.28*smoothstep(0.1,0.3,r);
        float vein=max(rib,web);
        float n1=vn3(vP*0.55+vI.y*40.0), n2=vn3(vL*2.3+vI.y*17.0);
        vec3 base=mix(uLeafB,uLeafA,clamp(0.1+0.5*n1+0.2*vI.w,0.0,1.0))*(0.74+0.36*n2)*(0.72+0.28*r);
        float wall=smoothstep(-0.1,0.9,vL.y);
        vec3 amb=ambAt(vP.y); float sun=sunAt(vP); vec3 col;
        if(under<0.5){
          vec3 alb=mix(base,uPale*0.7,vein*0.05+0.04*r*r*r)*(1.0-0.14*rib)*(1.0-0.42*smoothstep(0.62,0.97,r))*(0.8+0.2*smoothstep(0.0,0.5,r));
          alb=mix(alb,mix(uScarlet*0.75,uPale*0.6,0.25),uRimRed*smoothstep(0.55,1.0,wall)*0.8);
          float wet=1.0-smoothstep(-1.6+vCy.x*1.9,-1.1+vCy.x*1.9,vL.y);   // damp band just above the water line
          alb*=1.0-0.25*wet;
          col=alb*(amb*(0.7+0.3*N.y)+uSunCol*sun*(0.25+0.75*max(N.y,0.0)));
          float fr=pow(1.0-max(dot(N,V),0.0),4.0);
          col+=amb*fr*0.4+uSunCol*sun*pow(vn3(vL*8.0+vI.y*9.0),15.0)*3.0*n1*(0.3+wet);                 // sky sheen and wet glints
        } else {
          vec3 alb=mix(mix(base*0.6,mix(uScarlet*0.45,uBark,0.35),uRimRed*0.7),uLeafB*0.3,vein*0.6);
          vec3 thru=mix(uLeafA,uPale,0.35)*(1.0-0.4*vein)*(0.75+0.5*n2)*(0.5+0.65*r);        // sun glowing through the blade
          col=alb*amb*(0.75-0.25*N.y)+thru*uSunCol*sun*0.42*(1.0-0.6*wall);
        }
        col+=mix(base,uPale,0.4)*portalSpill(vP,N)*1.2;
        gl_FragColor=vec4(col,1.0); ${FOG_F} }`,
  });
  const leaves = new THREE.Mesh(leafGeo, leafMat); leaves.frustumCulled = false; group.add(leaves);
  await ctx.yield();

  // ---- pools: a water disc in every basin that rises with the fill and drains on the tip
  const poolGeo = new THREE.InstancedBufferGeometry();
  {
    const RR = [0, 0.4, 0.75, 1], SEG = 28, P = [], I = [];
    for (let k = 0; k < 4; k++) for (let s = 0; s < SEG; s++) { const phi = s / SEG * TAU; P.push(Math.cos(phi) * RR[k], 0, Math.sin(phi) * RR[k]); }
    for (let k = 0; k < 3; k++) for (let s = 0; s < SEG; s++) { const a = k * SEG + s, b = (k + 1) * SEG + s, c = k * SEG + (s + 1) % SEG, d = (k + 1) * SEG + (s + 1) % SEG; if (k > 0) I.push(a, c, b); I.push(c, d, b); }
    poolGeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); poolGeo.setIndex(I); addInst(poolGeo);
  }
  const poolMat = new THREE.ShaderMaterial({
    uniforms: mkU(), fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`${GL_BASIN_V}
      void main(){ vec4 cy=basinCycle(aInst.z,aInst.w); float L=max(cy.x,0.3); float h=-1.6+L*1.85;
        float rw=${BR}.0*min(sqrt(clamp((h+1.6)/1.6,0.0,1.0)),0.88+0.055*smoothstep(-0.36,0.25,h))*0.985;
        // keep the water on the leaf where the rim drops into the spout: it slopes out over the lip instead of floating
        float rr=length(position.xz)*rw/${BR}.0, ph=atan(position.z,position.x+1e-5), sp=exp(-ph*ph*2.04);
        float leafY=-1.6*(1.0-rr*rr)+1.15*smoothstep(0.88,1.0,rr)*(1.0-0.95*sp)-0.35*sp*smoothstep(0.8,1.02,rr);
        h=min(h,leafY+0.06+0.5*(1.0-step(0.01,rr)));
        vec3 p=tipRot(vec3(position.x*rw,h,position.z*rw)*aVar.x,cy.z); p.y-=cy.y;
        vL=vec3(position.x*rw,h,position.z*rw); vP=stairPlace(p,aInst.x,aInst.y); vN=stairDir(tipRot(vec3(0.0,1.0,0.0),cy.z),aInst.x);
        vI=vec4(aInst.zw,aVar); vCy=cy; float pp=cyclePhase(aInst.z-1.0,aPrev);
        vPrev=0.30+0.70*smoothstep(0.68,0.78,pp)*(1.0-smoothstep(0.88,0.99,pp));
        vec4 mvPosition=modelViewMatrix*vec4(vP,1.0); gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      ${GL_NOISE} ${GL_LIGHT}
      uniform vec3 uLeafB,uSky,uPale; varying vec3 vL,vP,vN; varying vec4 vI,vCy; varying float vPrev;
      void main(){ vec3 V=normalize(uCamL-vP); float r=length(vL.xz);
        float rip=sin(r*2.6-uTime*5.0+vI.y*20.0)*exp(-r*0.22)*vPrev;
        float n=vn3(vec3(vL.xz*1.3,uTime*0.9+vI.y*9.0));
        vec3 N=normalize(vN+vec3(vL.x,0.0,vL.z)/(r+0.3)*rip*0.16+vec3(n-0.5,0.0,0.5-n)*0.10);
        float fr=0.26+0.74*pow(1.0-abs(dot(N,V)),3.0);
        vec3 amb=ambAt(vP.y); float sun=sunAt(vP);
        vec3 skyc=min(amb*0.8+uSky*(0.25+0.5*dot(amb,vec3(0.33)))*(0.6+0.4*smoothstep(500.0,880.0,vP.y)),vec3(1.1));
        vec3 col=mix(mix(uLeafB,vec3(0.03,0.2,0.24),0.55)*(0.3+0.45*smoothstep(-1.6,0.0,-length(vL.xz)*0.16))*(amb+uSunCol*sun*0.5),skyc,fr);
        col+=uSunCol*sun*(pow(vn3(vec3(vL.xz*6.5,uTime*1.3+vI.y*5.0)),15.0)*5.0*smoothstep(0.58,0.85,n)+0.04);                                       // sun glitter
        col*=1.0+0.3*rip;
        float foam=smoothstep(6.2,1.2,r+2.4*n)*(0.35+0.65*vPrev);                    // where the curtain from above lands
        col=mix(col,whiteWater(vP)*(0.85+0.3*n),clamp(foam+0.3*max(rip,0.0),0.0,0.95));
        col+=uPale*portalSpill(vP,N)*0.8;
        gl_FragColor=vec4(col,1.0); ${FOG_F} }`,
  });
  const pools = new THREE.Mesh(poolGeo, poolMat); pools.frustumCulled = false; group.add(pools);
  await ctx.yield();

  // ---- curtains: one falling sheet from each spout to the next basin (the last one to the bridge)
  const fallOf = (i) => (i < NB - 1 ? STEP + 0.6 : basins[i].y - deckY(-HR) - 0.4);
  const GL_LIP = /* glsl */`
    float pourOf(float ph){ return 0.30+0.70*smoothstep(0.60,0.70,ph)*(1.0-smoothstep(0.80,0.93,ph)); }
    vec3 lipAt(float phi){ float e=exp(-phi*phi*2.04); return vec3(cos(phi)*10.25*(1.0+0.11*e),1.1*(1.0-0.95*e)-0.35*e-0.1,sin(phi)*10.25*(1.0+0.11*e)); }`;
  const curtGeo = new THREE.InstancedBufferGeometry();
  {
    const CU = 8, CV = 14, P = [], I = [];
    for (let v = 0; v <= CV; v++) for (let u = 0; u <= CU; u++) P.push(u / CU * 2 - 1, v / CV, 0);
    for (let v = 0; v < CV; v++) for (let u = 0; u < CU; u++) { const a = v * (CU + 1) + u; I.push(a, a + CU + 1, a + 1, a + 1, a + CU + 1, a + CU + 2); }
    curtGeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); curtGeo.setIndex(I); addInst(curtGeo);
    curtGeo.setAttribute('aFall', new THREE.InstancedBufferAttribute(new Float32Array(NB).map((_, i) => fallOf(i)), 1));
  }
  const curtMat = new THREE.ShaderMaterial({
    uniforms: mkU(), fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      uniform float uTime; ${GL_CYCLE} ${GL_LIP}
      attribute vec4 aInst; attribute vec2 aVar; attribute float aFall;
      varying vec3 vP; varying vec2 vUv; varying float vPour,vSeed,vFall;
      void main(){ vec4 cy=basinCycle(aInst.z,aInst.w); float u=position.x, t=position.y;
        vec3 l0=lipAt(u*0.52)*aVar.x; vec3 l1=tipRot(l0,cy.z); l1.y-=cy.y;
        vec3 p=mix(l1,l0,smoothstep(0.0,0.5,t));
        float pr=pourOf(fract(cyclePhase(aInst.z,aInst.w)-0.2*t));
        p.x+=(2.3+2.0*pr)*t*sqrt(aFall/13.0)+0.5*sin(t*5.0+uTime*1.7+aInst.w*20.0)*t*t;
        p.y-=aFall*t*t+0.5*t; p.z*=1.0-0.08*t; p.z+=0.6*sin(t*4.0+uTime*1.3+aInst.w*31.0)*t*t;
        vP=stairPlace(p,aInst.x,aInst.y); vUv=vec2(u,t); vPour=pr; vSeed=aInst.w; vFall=aFall;
        vec4 mvPosition=modelViewMatrix*vec4(vP,1.0); gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      ${GL_NOISE} ${GL_LIGHT}
      uniform vec3 uSky; varying vec3 vP; varying vec2 vUv; varying float vPour,vSeed,vFall;
      void main(){ float u=vUv.x, v=vUv.y, k=vFall/13.0;
        float streak=vn3(vec3(u*6.0+vSeed*30.0,v*2.2*k-uTime*1.9,vSeed*9.0));
        float fine=vn3(vec3(u*26.0+vSeed*11.0,v*4.5*k-uTime*4.3,3.0));
        float body=streak*0.62+fine*0.38;
        float rag=vn3(vec3(v*3.0*k-uTime*1.2,vSeed*17.0,u*1.5));
        float edge=1.0-smoothstep(0.66,1.0,abs(u)/(0.9+0.1*vPour)+0.16*(rag-0.5)*v);
        float core=smoothstep(0.34,0.72,body+(1.0-v)*0.12+0.12*vPour);                 // bright threads inside the sheet
        float a=mix(0.78,0.36,v)*(0.62+0.38*core)*edge*smoothstep(0.0,0.02,v)*(1.0-smoothstep(0.93,1.0,v));
        vec3 col=whiteWater(vP)*(0.72+0.55*core+0.25*fine*vPour)+uGlowCol*uGlow*14.0/(60.0+dot(uPortal-vP,uPortal-vP));
        gl_FragColor=vec4(col,a); ${FOG_F} }`,
  });
  const curtains = new THREE.Mesh(curtGeo, curtMat); curtains.frustumCulled = false; curtains.renderOrder = 2; group.add(curtains);
  await ctx.yield();

  // ---- drops: splash where each curtain lands, and the crown thrown off the rim on the rebound
  const PER = 64, nD = NB * PER, dI = new Float32Array(nD * 4), dR = new Float32Array(nD * 4), dK = new Float32Array(nD * 3);
  for (let i = 0; i < NB; i++) for (let k = 0; k < PER; k++) {
    const q = i * PER + k, b = basins[i];
    dI.set([b.ang, b.y, b.i, b.seed], q * 4); dR.set([rng(), rng(), rng(), rng()], q * 4); dK.set([k < 34 ? 0 : 1, fallOf(i), b.scale], q * 3);
  }
  const dropGeo = new THREE.BufferGeometry();
  dropGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(nD * 3), 3));
  dropGeo.setAttribute('aInst', new THREE.BufferAttribute(dI, 4)); dropGeo.setAttribute('aRnd', new THREE.BufferAttribute(dR, 4)); dropGeo.setAttribute('aK', new THREE.BufferAttribute(dK, 3));
  const dropMat = new THREE.ShaderMaterial({
    uniforms: mkU(), fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      uniform float uTime,uPx; ${GL_CYCLE} ${GL_LIP}
      attribute vec4 aInst,aRnd; attribute vec3 aK; varying vec3 vP; varying float vA;
      void main(){ vec4 cy=basinCycle(aInst.z,aInst.w); float ph=cyclePhase(aInst.z,aInst.w); vec3 p; float sz;
        if(aK.x<0.5){ float t=fract(uTime*0.85+aRnd.z*7.0)*(0.7+0.7*aRnd.w);
          p=vec3(14.6+(aRnd.x-0.5)*3.5,-aK.y+0.4,(aRnd.y-0.5)*9.0)+vec3((aRnd.x-0.5)*7.0,3.0+6.5*aRnd.w,(aRnd.y-0.5)*8.0)*t; p.y-=4.9*t*t;
          vA=(0.35+0.65*pourOf(fract(ph-0.2)))*(1.0-t*0.6); sz=0.26+0.3*aRnd.z;
        } else { float q=fract(ph-0.82), t=q/uRate, a=aRnd.x*6.2832;
          p=vec3(cos(a)*10.3,0.9,sin(a)*10.3)*aK.z+vec3(cos(a)*(1.5+2.5*aRnd.y),5.5+5.0*aRnd.w,sin(a)*(1.5+2.5*aRnd.y))*t; p.y-=4.9*t*t+cy.y;
          vA=smoothstep(0.0,0.08,t)*(1.0-smoothstep(1.1,2.0,t)); sz=0.3+0.26*aRnd.z; }
        vP=stairPlace(p,aInst.x,aInst.y); vec4 mvPosition=modelViewMatrix*vec4(vP,1.0); gl_Position=projectionMatrix*mvPosition;
        float px=sz*uPx/max(-mvPosition.z,0.5); vA*=clamp(px/1.6,0.25,1.0); gl_PointSize=clamp(px,1.6,48.0); ${FOG_V} }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      ${GL_NOISE} ${GL_LIGHT}
      uniform vec3 uSky; varying vec3 vP; varying float vA;
      void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.12,d)*vA; if(a<0.01) discard;
        vec3 col=whiteWater(vP)*1.25+uGlowCol*uGlow*20.0/(60.0+dot(uPortal-vP,uPortal-vP));
        gl_FragColor=vec4(col,a); ${FOG_F} }`,
  });
  const drops = new THREE.Points(dropGeo, dropMat); drops.frustumCulled = false; drops.renderOrder = 3; group.add(drops);
  await ctx.yield();

  // ---- mist: a soft puff at every landing plus slow banks of spray round the bridge (what the rainbow hangs in)
  const mist = [];
  for (const b of basins) { const f = fallOf(b.i), a = b.ang, et = [hand * Math.cos(a), -hand * Math.sin(a)];
    mist.push([Math.sin(a) * HR + et[0] * 14.6, b.y - f + 1.2, Math.cos(a) * HR + et[1] * 13.8, b.i === NB - 1 ? 13 : 6.5, b.seed, b.i, b.seed, b.i === NB - 1 ? 0.5 : 0.27]); }
  for (let k = 0; k < 14; k++) { const a = rng.range(0, TAU), r = rng.range(10, 36);
    mist.push([Math.sin(a) * r, DECK + rng.range(-6, 22), Math.cos(a) * r - 6, rng.range(14, 26), rng(), -1, 0, rng.range(0.035, 0.075)]); }
  const mistGeo = new THREE.InstancedBufferGeometry();
  mistGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); mistGeo.setIndex([0, 1, 2, 0, 2, 3]);
  mistGeo.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(mist.flatMap((m) => m.slice(0, 4))), 4));
  mistGeo.setAttribute('iPar', new THREE.InstancedBufferAttribute(new Float32Array(mist.flatMap((m) => m.slice(4, 8))), 4));
  mistGeo.instanceCount = mist.length;
  const mistMat = new THREE.ShaderMaterial({
    uniforms: mkU(), fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      #include <fog_pars_vertex>
      uniform float uTime,uMistK; ${GL_CYCLE} ${GL_LIP}
      attribute vec4 iPos,iPar; varying vec3 vP; varying vec2 vUv; varying float vA,vSeed;
      void main(){ float k=iPar.y<-0.5?uMistK:pourOf(fract(cyclePhase(iPar.y,iPar.z)-0.2));
        vec3 c=iPos.xyz; if(iPar.y<-0.5){ c.x+=sin(uTime*0.11+iPar.x*40.0)*5.0; c.y+=sin(uTime*0.07+iPar.x*17.0)*3.0; }
        vP=c; vUv=position.xy; vA=iPar.w*(0.45+0.55*k); vSeed=iPar.x;
        vec4 mvPosition=modelViewMatrix*vec4(c,1.0); mvPosition.xy+=position.xy*iPos.w*(0.85+0.3*k);
        vA*=smoothstep(iPos.w*0.4,iPos.w*2.2,-mvPosition.z);
        gl_Position=projectionMatrix*mvPosition; ${FOG_V} }`,
    fragmentShader: /* glsl */`
      #include <fog_pars_fragment>
      ${GL_NOISE} ${GL_LIGHT}
      uniform vec3 uSky; varying vec3 vP; varying vec2 vUv; varying float vA,vSeed;
      void main(){ float d=length(vUv); float n=vn3(vec3(vUv*1.7+vSeed*30.0,uTime*0.35+vSeed*9.0));
        float a=smoothstep(1.0,0.15,d+0.35*(n-0.5))*(0.45+0.75*n)*vA; if(a<0.004) discard;
        vec3 col=mix(waterLight(vP)*0.8,whiteWater(vP)*0.9,vA>0.08?0.7:0.3)+uGlowCol*uGlow*7.0/(80.0+dot(uPortal-vP,uPortal-vP));
        gl_FragColor=vec4(col,a); ${FOG_F} }`,
  });
  const mistMesh = new THREE.Mesh(mistGeo, mistMat); mistMesh.frustumCulled = false; mistMesh.renderOrder = 4; group.add(mistMesh);
  await ctx.yield();

  // ---- the Ring: full-circle rainbow, additive, fog-exempt, re-centred on the portal every frame
  const rbAngle = (opts.rainbowAngle ?? 24) * Math.PI / 180, rbMin = opts.rainbowMinRadius ?? 20, RB_EXT = 1.5, RB_FAR = 46;
  const rainbowMat = new THREE.ShaderMaterial({
    uniforms: { uRainbow: U.uRainbow, uTime: U.uTime, uMoon: { value: opts.moonbow ? 1 : 0 } },
    transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      ${GL_NOISE}
      uniform float uRainbow,uTime,uMoon; varying vec2 vUv;
      vec3 spec(float t){ float h=mix(0.70,0.0,clamp(t,0.0,1.0)); vec3 c=clamp(abs(fract(h+vec3(0.0,0.6667,0.3333))*6.0-3.0)-1.0,0.0,1.0);
        c=c*c*(0.55+0.45*c); c+=vec3(0.10,0.02,0.0)*smoothstep(0.6,1.0,t); c*=1.0-0.45*smoothstep(0.25,0.0,t); return mix(c,vec3(dot(c,vec3(0.33))),0.06); }
      float band(float x){ return smoothstep(-1.3,-0.55,x)*(1.0-smoothstep(0.55,1.3,x)); }
      void main(){ float r=length(vUv)*${RB_EXT.toFixed(2)}; if(r>1.48) discard; float ang=atan(vUv.y,vUv.x);
        float x1=(r-1.0)/0.075, x2=(r-1.27)/0.08;
        vec3 col=spec(x1*0.5+0.5)*band(x1)*0.62+spec(0.5-x2*0.5)*band(x2)*0.13;
        col+=vec3(0.75,0.85,0.9)*0.028*(1.0-smoothstep(0.8,0.93,r))*smoothstep(0.0,0.8,r);     // bright inside the bow
        float sh=0.72+0.28*vn3(vec3(cos(ang)*3.0,sin(ang)*3.0,uTime*0.25))+0.10*sin(ang*3.0+uTime*0.4);  // spray is uneven
        col=mix(col,vec3(dot(col,vec3(0.4,0.45,0.35)))*vec3(0.8,0.95,1.1),uMoon*0.3);
        gl_FragColor=vec4(col*sh*uRainbow,1.0); }`,
  });
  const rainbow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), rainbowMat); rainbow.frustumCulled = false; rainbow.renderOrder = 6; group.add(rainbow);

  // ---- the portal's light, fog-exempt so the destination is marked from hundreds of metres above: a wide pool with a hot
  // core on the wet deck, a strip of wet shine along the whole bridge, a faint column standing over the arch, a halo in it
  const GLOW_V = /* glsl */`varying vec2 vUv; varying vec3 vW;
    void main(){ vUv=uv*2.0-1.0; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;
  const glowMat = (kind, uK) => new THREE.ShaderMaterial({
    uniforms: { uGlow: U.uGlow, uGlowCol: U.uGlowCol, uTime: U.uTime, uK: { value: uK }, uSeat: { value: portalC.clone() } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: kind === 'halo'
      ? /* glsl */`varying vec2 vUv; varying vec3 vW; void main(){ vUv=position.xy; vW=vec3(0.0); vec4 mv=modelViewMatrix*vec4(0.0,0.0,0.0,1.0); mv.xy+=position.xy*19.0; gl_Position=projectionMatrix*mv; }`
      : kind === 'column'
        ? /* glsl */`uniform vec3 uSeat; varying vec2 vUv; varying vec3 vW;
          void main(){ vec3 c=(modelMatrix*vec4(uSeat,1.0)).xyz; vec2 dx=cameraPosition.xz-c.xz+vec2(1e-3,0.0); vec2 rt=vec2(-dx.y,dx.x)/length(dx);
            float t=position.y*0.5+0.5; vec3 w=c+vec3(rt.x,0.0,rt.y)*(position.x*(3.0+2.5*t))+vec3(0.0,6.0+t*62.0,0.0);
            vUv=vec2(position.x,t); vW=w; gl_Position=projectionMatrix*viewMatrix*vec4(w,1.0); }`
        : GLOW_V,
    fragmentShader: /* glsl */`
      ${GL_NOISE}
      uniform float uGlow,uTime,uK; uniform vec3 uGlowCol; varying vec2 vUv; varying vec3 vW;
      void main(){ float a;
      ${kind === 'halo' ? `float d=length(vUv); float n=vn3(vec3(vUv*7.0,uTime*0.5));
        a=exp(-d*d*5.5)*(0.8+0.3*n)+0.25*exp(-d*d*40.0); a*=(1.0-smoothstep(0.8,1.0,d))*0.55;`
      : kind === 'column' ? `float x=vUv.x, t=vUv.y; a=1.0-x*x; a*=a*smoothstep(0.0,0.12,t)*(1.0-t)*(1.0-t);
        a*=0.55+0.9*vn3(vec3(x*2.0,t*5.0-uTime*0.25,uTime*0.2));`
      : `vec3 V=normalize(cameraPosition-vW); float up=mix(0.3,1.0,smoothstep(0.12,0.7,V.y));       // seen from above it is a beacon, along the deck only a sheen
        ${kind === 'strip' ? `float x=vUv.x, n=vn3(vec3(vW.x*0.9,vW.z*0.28,uTime*0.35)), g=vn3(vec3(vW.x*3.1,vW.z*1.3,uTime*0.9));
        a=exp(-x*x*3.4)*(0.22+0.78*exp(-(vW.z+26.0)*(vW.z+26.0)/1500.0))*smoothstep(-1.0,-0.8,vUv.y)*smoothstep(1.0,0.72,vUv.y)*(0.5+0.8*n+0.9*g*g*g)*up;`
        : `float d=length(vUv), n=vn3(vec3(vUv*7.0,uTime*0.5));
        a=(0.62*exp(-d*d*4.2)*(0.7+0.5*n)+2.1*exp(-d*d*38.0))*(1.0-smoothstep(0.8,1.0,d))*up;`}`}
        gl_FragColor=vec4(uGlowCol*uGlow*uK*a,1.0); }`,
  });
  const poolGlow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), glowMat('pool', 0.3));
  poolGlow.rotation.x = -Math.PI / 2; poolGlow.scale.set(18, 27, 1); poolGlow.position.set(0, deckY(PORTAL_Z) + 1.3, PORTAL_Z + 9); poolGlow.renderOrder = 5; group.add(poolGlow);
  const stripGeo = new THREE.BufferGeometry();
  { const sp = [], su = [], si = [], NSG = 18;
    for (let q = 0; q <= NSG; q++) { const z = lerp(-44, 48, q / NSG); for (const e of [-1, 1]) { sp.push(e * 5.6, deckY(z) + 1.45, z); su.push(e * 0.5 + 0.5, q / NSG); } }
    for (let q = 0; q < NSG; q++) { const k = q * 2; si.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    stripGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); stripGeo.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2)); stripGeo.setIndex(si); }
  const strip = new THREE.Mesh(stripGeo, glowMat('strip', 0.3)); strip.frustumCulled = false; strip.renderOrder = 5; group.add(strip);
  const column = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), glowMat('column', 0.085)); column.frustumCulled = false; column.renderOrder = 5; group.add(column);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), glowMat('halo', 0.15)); halo.position.copy(portalC); halo.frustumCulled = false; halo.renderOrder = 5;
  halo.visible = opts.halo !== false; group.add(halo);

  // ---- anchors
  const D2R = Math.PI / 180, HELIX_R = 15;
  const helixPoint = (y) => { const open = 1 - smoothstep(50, 110, y), r = lerp(HELIX_R, 26.9, open);
    const a = hand * (-48 * D2R - (y - 50) * (15 * D2R / 27)); return new V3(Math.sin(a) * r, y, Math.cos(a) * r); };
  const fly = [260, 215, 170, 135, 105, 82, 64, 50].map(helixPoint);
  for (const [ad, y] of [[45, 46], [90, 42.8], [135, 40.4], [180, 38.9]]) { const a = ad * D2R; fly.push(new V3(hand * (-10 - 10 * Math.cos(a)), y, 18 + 10 * Math.sin(a))); }
  fly.push(new V3(0, portalC.y + 0.1, 4), portalC.clone());
  const cp = basins[8], cpr = HR - 10.6 * cp.scale - 4;
  const anchors = {
    portalSeat: { position: portalC.clone(), normal: new V3(0, 0, 1), radius: PORTAL_R },
    flyThrough: fly,
    helix: { radius: HELIX_R, hand, pointAt: helixPoint },
    basinAt: (i) => { const b = basins[clamp(i | 0, 0, NB - 1)]; return { position: b.pos.clone(), angle: b.ang, y: b.y }; },
    basinCount: NB,
    closePass: new V3(Math.sin(cp.ang) * cpr, cp.y + 3, Math.cos(cp.ang) * cpr),
    trunks: trunks.map((t) => ({ x: t.x, z: t.z, radius: t.radius })),
    bridge: { y: DECK, halfWidth: 6.5, z0: -52, z1: 52, deckY },
    rainbowCentre: portalC.clone(),
    viewpoints: { rim: new V3(0, TOP + 8, 34), stairFromAxis: new V3(0, 640, 0), ringReveal: helixPoint(300), bridgeApproach: new V3(0, portalC.y + 0.4, 30) },
    topY: TOP, bottomY: DECK, lastCurtain: new V3(0, DECK, -HR),
  };

  // ---- runtime
  const inv = new THREE.Matrix4(), camL = new V3(), zc = new V3(), xc = new V3(), yc = new V3(), size = new THREE.Vector2(), basis = new THREE.Matrix4();
  let progress = null;
  const hero = {
    object: group, radius: 62, height: TOP, center: new V3(0, TOP / 2, 0), anchors, ground: false, groundY: 0,
    uniforms: U, parts: { wood, leaves, pools, curtains, drops, mist: mistMesh, rainbow, poolGlow, strip, column, halo },
    info: { hand, basins: NB, buildMs: 0, stairRadius: HR, seeds: basins.map((b) => b.seed), scales: basins.map((b) => b.scale) },
    setProgress(u) { progress = u; U.uRainbow.value = smoothstep(0.58, 0.8, u); U.uGlow.value = (opts.glow ?? 1) * (0.45 + 0.55 * smoothstep(0.5, 0.68, u)); },
    update(dt, time, camera) {
      U.uTime.value = time;
      group.updateMatrixWorld(); inv.copy(group.matrixWorld).invert();
      camL.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv); U.uCamL.value.copy(camL);
      ctx.renderer.getDrawingBufferSize(size); U.uPx.value = size.y * camera.projectionMatrix.elements[5] * 0.5;
      // rainbow: centre 30 m beyond the portal on the camera-to-portal ray, facing the camera
      zc.subVectors(camL, portalC); const dist = zc.length(); if (dist < 0.01) zc.set(0, 0, 1); else zc.multiplyScalar(1 / dist);
      const dr = Math.min(dist + 30, RB_FAR); rainbow.position.copy(camL).addScaledVector(zc, -dr);
      yc.set(0, 1, 0); if (Math.abs(zc.y) > 0.98) yc.set(0, 0, -1);
      xc.crossVectors(yc, zc).normalize(); yc.crossVectors(zc, xc);
      rainbow.quaternion.setFromRotationMatrix(basis.makeBasis(xc, yc, zc));
      rainbow.scale.setScalar(Math.max(dr < RB_FAR ? rbMin : 0, Math.tan(rbAngle) * dr) * RB_EXT);
    },
    dispose() {},
  };
  // viewer framing only (opts.preview = 'in700' | 'mid' | 'top' | 'ring' | 'basin12' | 'bottom'): never used by a world
  const pv = opts.preview;
  if (pv) {
    const m = /^([a-z]+)(\d+)?$/.exec(pv) || [], y = m[2] ? Number(m[2]) : 0;
    if (m[1] === 'in') Object.assign(hero, { radius: 0.01, height: 110, center: new V3(0, y || 700, 0) });
    else if (m[1] === 'mid') Object.assign(hero, { radius: 40, height: 120, center: new V3(0, y || 480, 0) });
    else if (m[1] === 'top') Object.assign(hero, { radius: 30, height: 60, center: new V3(0, y || 860, 0) });
    else if (m[1] === 'ring') Object.assign(hero, { radius: 0.01, height: y || 240, center: portalC.clone() });
    else if (m[1] === 'basin') Object.assign(hero, { radius: 5, height: 16, center: basins[y || 12].pos.clone() });
    else if (m[1] === 'bottom') Object.assign(hero, { radius: 11.7, height: 34, center: new V3(0, portalC.y + 1, PORTAL_Z + 4) });
  }
  return hero;
}
