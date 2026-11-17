// THE GREAT FAN: hero set piece for "plain-of-fans".
//
// One colossal suitor crouched on the plain. Sixty-one ridged ribs 120 m long spring from a bony
// collar 22 m across (the exit portal sits inside it, hub at y 30) and carry sixty deep pleats of
// veined, growth-ringed membrane: peacock teal on the front face (+Z), matte gold on the reverse.
// The body lies behind the fan (-Z) on two wide forelegs and one hind strut; the neck curls round
// under the lowest ribs to lay a 9 m wedge head on the ground in front, on the camera's right as
// it approaches (+X), with a rose eye-ring whose eye follows the camera.
//
// LOCAL SPACE  origin at the base centre under the hub, +Y up, the teal front faces +Z. The camera
//   approaches from +Z flying toward -Z (rotate the object to suit the world's course). Seen from
//   the approach, the camera's right is +X and its left (the sun side) is -X.
// SIZE         radius 128 m (fan half-width 123, hind foot near z -125), height 153 m.
// COST         105-120k triangles (by rib count), 5 draw calls, no lights, no textures. Build ~120 ms.
// LIGHTING     self-lit ShaderMaterials (scene lights are ignored; scene fog is honoured). It expects
//   the brief's light: one low warm key 25 degrees BEHIND the fan plane on the camera's left, so
//   every pleat transmits on one facet and takes grazing sun on the other. Defaults are the brief's;
//   override with opts.sunDir (hero-local, toward the sun), opts.sunColor (linear, about 2.4 peak),
//   opts.skyColor / opts.groundColor (hemisphere fill, already multiplied by intensity), or call
//   hero.setSun(dirWorld, color) / hero.setFill(sky, ground) at any time. Nothing is emissive.
//   Because the sun is behind the fan, the animal facing the approach is lit by its surroundings: a broad
//   warm glow from the sun-side sky (high on the left), the sky fill, and opts.bounceColor /
//   hero.setBounce(color), the light the lit plain throws back up (default lemon at 0.3).
//   opts.hideGain (2.9) lifts the hide so its lit side sits near mid-grey and its shade is blue-slate.
//
// OPTS   palette  7 hex strings [slate, teal, indigo, gold, lemon, white, rose] (brief order)
//        detail   0.6-1: thins only the drifting shed scales; the Fan itself never thins
//        sunDir, sunColor, skyColor, groundColor   see LIGHTING
//        glow     0.8 default: strength of the sun transmitted through the membrane (keep under ~1.1)
//        autoplay true (default): until setProgress/setUnfurl/setStripe is called the Fan runs a
//                 44 s demo loop on wall-clock time (opens, the gold stripe crosses, furls)
//
// PROGRESS HOOKS (drive from the path's u, never from time)
//   hero.setProgress(u)   brief timing: furled mast until u 0.70, opening rib by rib to fully open
//                         at u 0.84, gold stripe crossing left to right during u 0.88-0.92
//   hero.setUnfurl(x)     0 furled mast (120 m tall, 8 m wide) ... 1 fully open (overshoot built in)
//   hero.setStripe(x, w)  centre x (local metres, -200 off left ... +200 off right) and width
//                         (default 120) of the gold band: pleats whose rim lies inside it turn over
//                         about their own centre line like louvres and show the gold reverse
//   hero.uniforms         { uUnfurl, uStripe, uTime, ... } shared by every material
//   hero.shadowGLSL       GLSL: float greatFanShadow(vec3 pLocal, vec3 sunLocal, float unfurl)
//                         -> 0..1 striped shade for the ground and suitor shaders (the 500 m shadow)
//
// ANCHORS (local space)
//   portalSeat  { position (0,30,0), normal (0,0,1), radius 7 }: centre of the collar, facing the approach
//   hub         same point; the fan's pivot
//   flyThrough  ordered points of the brief's last 216 m: up the lane at y 8, rising to y 30 by 80 m
//               out, dead straight and level into the collar (>= 10 m clear of every solid until the
//               collar itself, whose inner lip is 7.2 m from the axis)
//   head, eye   the head on the ground and its lane-side eye (for a gaze poi around u 0.86-0.92)
//   mastTop     tip of the furled mast (0,153,0)
//   viewpoints  { front, frontHigh, sunSide, back }: good camera positions looking at `center`
//   footprints  XZ discs [x, z, r] the world should keep clear of suitors, grass and mist cards
//   sunDir      the default hero-local sun direction
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng } from '../kit/core.js';

const DEFAULT_PALETTE = ['#2A2F3A', '#0FA3A3', '#2B2F8F', '#F2C230', '#F7EDB0', '#FBFBF5', '#E9A7A0'];
const HUB_Y = 30, RIB_LEN = 120, R_ROOT = 10.4;

// ---------------------------------------------------------------- geometry accumulator
function makeAcc() { return { pos: [], col: [], aux: [], idx: [] }; }

// Loft a tube along a curve. o.shape(t, ang) -> [rx, ry] half-extents (side, up); ang runs -PI..PI
// with 0 at the "up" side of the frame, so the seam is underneath. o.color(t, ang, p) -> [r,g,b];
// o.aux(t, ang) -> [breath, throat, bone].
// loftA: the same, handing a frame back every few rings (o.Y = the builder's yield) so no step holds the page.
async function loftA(G, o) { return loft(G, o, true); }
function loft(G, o, asy = false) {
  if (asy) return (async () => { const it = loftGen(G, o); let r = it.next(); while (!r.done) { if (o.Y) await o.Y(); r = it.next(); } })();
  const it = loftGen(G, o); while (!it.next().done);
}
function* loftGen(G, o) {
  const curve = o.curve || new THREE.CatmullRomCurve3(o.pts, false, 'centripetal');
  const lod = o.keep ? 1 : (G.lod || 1);                                    // elders: the same animal with fewer rings and sides
  const n = lod < 1 ? Math.max(3, Math.round(o.n * lod)) : o.n, sides = lod < 1 ? Math.max(6, Math.round(o.sides * lod)) : o.sides, ref = o.ref || new THREE.Vector3(0, 1, 0);
  const base = G.pos.length / 3;
  const P = new THREE.Vector3(), T = new THREE.Vector3(), S = new THREE.Vector3(), U = new THREE.Vector3(), V = new THREE.Vector3();
  const every = Math.max(2, Math.round(260 / (sides + 1)));
  for (let i = 0; i <= n; i++) {
    if (i % every === every - 1) yield;
    const t = i / n;
    curve.getPoint(t, P); curve.getTangent(t, T);
    S.crossVectors(ref, T); if (S.lengthSq() < 1e-6) S.set(1, 0, 0); S.normalize();
    U.crossVectors(T, S).normalize();
    for (let k = 0; k <= sides; k++) {
      const ang = -Math.PI + (k / sides) * Math.PI * 2;
      const sh = o.shape(t, ang);
      const ox = Math.sin(ang) * sh[0], oy = Math.cos(ang) * sh[1];
      V.copy(P).addScaledVector(S, ox).addScaledVector(U, oy);
      if (o.warp) o.warp(V, t, ang);
      if (o.floor !== undefined && V.y < o.floor) V.y = o.floor + (V.y - o.floor) * 0.12;
      G.pos.push(V.x, V.y, V.z);
      const c = o.color(t, ang, V); G.col.push(c[0], c[1], c[2]);
      const a = o.aux ? o.aux(t, ang) : [0, 0, 0]; G.aux.push(a[0], a[1], a[2]);
    }
  }
  // winding: make the first quad face away from the curve
  const w = sides + 1, mid = Math.floor(n / 2), k0 = Math.floor(sides / 4);
  const ia = base + mid * w + k0, ib = ia + 1, ic = ia + w;
  const A = new THREE.Vector3().fromArray(G.pos, ia * 3), B = new THREE.Vector3().fromArray(G.pos, ib * 3), C = new THREE.Vector3().fromArray(G.pos, ic * 3);
  const nrm = new THREE.Vector3().crossVectors(B.clone().sub(A), C.clone().sub(A));
  curve.getPoint(mid / n, P);
  const flip = nrm.dot(A.clone().sub(P)) < 0;
  for (let i = 0; i < n; i++) for (let k = 0; k < sides; k++) {
    const a = base + i * w + k, b = a + 1, c = a + w, d = c + 1;
    if (flip) G.idx.push(a, c, b, b, c, d); else G.idx.push(a, b, c, b, d, c);
  }
}

async function accToGeometry(G, Y) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(G.pos), nor = new Float32Array(pos.length), idx = G.idx, nI = idx.length;
  for (let k = 0; k < nI; k += 3) {                       // area-weighted vertex normals (what computeVertexNormals does)
    if (Y && k % 30000 === 29997) await Y();
    const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    nor[a] += nx; nor[a + 1] += ny; nor[a + 2] += nz; nor[b] += nx; nor[b + 1] += ny; nor[b + 2] += nz; nor[c] += nx; nor[c + 1] += ny; nor[c + 2] += nz;
  }
  for (let i = 0; i < nor.length; i += 3) { const l = Math.hypot(nor[i], nor[i + 1], nor[i + 2]) || 1; nor[i] /= l; nor[i + 1] /= l; nor[i + 2] /= l; }
  if (Y) await Y();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aColor', new THREE.Float32BufferAttribute(G.col, 3));
  g.setAttribute('aAux', new THREE.Float32BufferAttribute(G.aux, 3));
  g.setIndex(G.idx);
  return g;
}

const bump = (x, c, w) => { const d = (x - c) / w; return Math.exp(-d * d); };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const scl3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

// ---------------------------------------------------------------- shared GLSL
// Fan kinematics, used by the rib and membrane vertex shaders (and mirrored in JS for anchors).
const FAN_GLSL = /* glsl */`
uniform float uUnfurl, uTime, uSpread, uNR, uFlex;
uniform vec2 uStripe;                       // centre x (m), half width (m)
const float HUB_Y = ${HUB_Y.toFixed(1)};
float easeBack(float p){ float q = p - 1.; return 1. + 1.9*q*q*q + 0.9*q*q; }
float ribOpen(float i){
  float s = i/uNR*2. - 1.;
  float p = clamp(uUnfurl*1.6 - 0.6*(1. - abs(s)), 0., 1.);
  return easeBack(p);
}
float ribAngle(float i, float rho){
  float s = i/uNR*2. - 1.;
  float e = ribOpen(i);
  float a = s*uSpread*mix(0.042, 1., e);
  float rr = rho/120.;
  a += uFlex*rr*rr*(sin(uTime*0.55 + i*0.37) + 0.5*sin(uTime*0.93 - i*0.21))*(0.25 + 0.75*clamp(e, 0., 1.));
  return a;
}
float ribZ(float i){ float s = i/uNR*2. - 1.; return s*3.4*(1. - clamp(ribOpen(i), 0., 1.)); }
float pleatFlip(float j){
  float s = (j + 0.5)/uNR*2. - 1.;
  float x = 120.*sin(s*uSpread);
  return 1. - smoothstep(uStripe.y - 9., uStripe.y + 9., abs(x - uStripe.x));
}
`;

// World-space lighting shared by every fragment shader: one sun, a hemisphere fill, nothing else.
const LIGHT_GLSL = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol;
vec3 hemi(vec3 N){ return mix(uGndCol, uSkyCol, N.y*0.5 + 0.5); }
float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y);
}
// antialiased periodic line: 1 on the line. x in periods, w = half width in periods.
float lineAA(float x, float w){
  float fw = fwidth(x);
  float d = abs(fract(x) - 0.5);
  float l = 1. - smoothstep(w, w + fw*1.5 + 1e-4, d);
  return l*(1. - smoothstep(0.25, 0.6, fw));
}
`;

// ---------------------------------------------------------------- ribs
// One rib: a six-sided keeled spar along +Y (rho = distance from the hub), 2 m thick at the root,
// knuckle joints every ~20 m, a spatula at the tip. Flat-shaded round the section, smooth along.
function buildRibGeometry(P, lod = false) {
  const rhos = new Set();
  if (lod) {                                                               // elders: a four-sided spar, rings only where the shape turns
    for (const r of [R_ROOT - 1.2, R_ROOT + 1.4, R_ROOT + 4, 113, 115.5, 118, 121, 123]) rhos.add(r);
    for (const k of P.knuckles) for (const d of [-2.4, 0, 2.4]) rhos.add(+(k + d).toFixed(2));
  } else {
  for (let r = R_ROOT - 1.2; r < 113; r += 5) rhos.add(+r.toFixed(2));
  for (const k of P.knuckles) for (const d of [-2.6, -1.5, -0.7, 0, 0.7, 1.5, 2.6]) rhos.add(+(k + d).toFixed(2));
  for (const d of [0.6, 1.4, 2.4, 3.6]) rhos.add(+(R_ROOT + d).toFixed(2));
  for (let r = 113; r <= 123.01; r += 1.0) rhos.add(+r.toFixed(2));
  }
  rhos.add(123.5);
  const list = [...rhos].filter((r) => r >= R_ROOT - 1.2).sort((a, b) => a - b);
  const section = (rho) => {            // -> six [x, z] points, CCW seen from +Y... order fixed below
    const t = clamp((rho - R_ROOT) / (RIB_LEN - R_ROOT), 0, 1);
    let w = lerp(1.0, 0.2, Math.pow(t, 0.72));
    let kn = bump(rho, R_ROOT + 1.4, 1.5) * 0.9;
    for (const k of P.knuckles) { kn += bump(rho, k, 1.1); w *= 1 - 0.16 * bump(rho, k - 2.3, 0.8) - 0.16 * bump(rho, k + 2.3, 0.8); }
    kn = Math.min(kn, 1);
    w *= 1 + 0.6 * kn;
    let zf = 1.5 * w, zb = 0.95 * w, ws = w;
    const s = clamp((rho - 113.5) / 10, 0, 1);            // spatula
    let sp = 0;
    if (s > 0) {
      sp = smoothstep(0, 0.25, s);
      const pad = P.spatW * Math.pow(Math.sin(Math.PI * Math.min(0.5 + s * 0.5, 0.999)), 0.6) * smoothstep(0, 0.3, s) * (s > 0.97 ? 0.35 : 1);
      ws = lerp(w, pad, sp); zf = lerp(zf, 0.16, sp); zb = lerp(zb, 0.12, sp);
    }
    if (lod) return { pts: [[0, zf], [ws, -0.06 * zb], [0, -zb], [-ws, -0.06 * zb]], w: ws, kn, sp };
    return { pts: [[0, zf], [ws, 0.3 * zf], [ws, -0.42 * zb], [0, -zb], [-ws, -0.42 * zb], [-ws, 0.3 * zf]], w: ws, kn, sp };
  };
  const secs = list.map(section);
  const pos = [], nor = [], info = [], idx = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  const NS = lod ? 4 : 6;
  for (let k = 0; k < NS; k++) {
    const k1 = (k + 1) % NS, base = pos.length / 3;
    for (let i = 0; i < list.length; i++) {
      const s = secs[i], i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, list.length - 1);
      const p0 = s.pts[k], p1 = s.pts[k1];
      const m0 = secs[i0].pts, m1 = secs[i1].pts;
      a.set(p1[0] - p0[0], 0, p1[1] - p0[1]);                                   // across the side
      b.set((m1[k][0] + m1[k1][0] - m0[k][0] - m0[k1][0]) * 0.5, list[i1] - list[i0], (m1[k][1] + m1[k1][1] - m0[k][1] - m0[k1][1]) * 0.5); // along
      n.crossVectors(a, b); c.set((p0[0] + p1[0]) * 0.5, 0, (p0[1] + p1[1]) * 0.5);
      if (n.dot(c) < 0) n.negate();
      if (n.lengthSq() < 1e-10) n.set(0, 0, 1); n.normalize();
      pos.push(p0[0], list[i], p0[1], p1[0], list[i], p1[1]);
      nor.push(n.x, n.y, n.z, n.x, n.y, n.z);
      const w = Math.max(s.w, 1e-3);
      info.push(s.kn, s.sp, p0[0] / w, s.kn, s.sp, p1[0] / w);
    }
    for (let i = 0; i < list.length - 1; i++) {
      const q = base + i * 2;
      // outward winding decided by the side's orientation: sides run CCW seen from +Y (x right, z toward viewer)
      idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3);
    }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aInfo', new THREE.Float32BufferAttribute(info, 3));
  g.setIndex(idx);
  const ribs = new Float32Array(P.nRibs); for (let i = 0; i < P.nRibs; i++) ribs[i] = i;
  g.setAttribute('aRib', new THREE.InstancedBufferAttribute(ribs, 1));
  g.instanceCount = P.nRibs;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, HUB_Y + 40, 0), 140);
  return g;
}

function buildRibMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aInfo; attribute float aRib;
      varying vec3 vN, vWPos, vInfo; varying float vRho, vRib, vNz;
      #include <fog_pars_vertex>
      ${FAN_GLSL}
      void main(){
        float rho = position.y;
        float th = ribAngle(aRib, rho);
        float c = cos(th), s = sin(th);
        vec3 p = vec3(rho*s + position.x*c, HUB_Y + rho*c - position.x*s, position.z + ribZ(aRib));
        vec3 n = vec3(normal.x*c + normal.y*s, -normal.x*s + normal.y*c, normal.z);
        vec4 wp = modelMatrix*vec4(p, 1.);
        vWPos = wp.xyz; vN = mat3(modelMatrix)*n; vInfo = aInfo; vRho = rho; vRib = aRib; vNz = normal.z;
        vec4 mvPosition = viewMatrix*wp;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSlate, uIndigo, uTeal, uGold, uLemon, uRose, uBone, uBounce;
      varying vec3 vN, vWPos, vInfo; varying float vRho, vRib, vNz;
      #include <fog_pars_fragment>
      ${LIGHT_GLSL}
      void main(){
        vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
        vec3 V = normalize(cameraPosition - vWPos);
        float rr = clamp(vRho/120., 0., 1.);
        float grain = vnoise(vec2(vRho*0.9, vInfo.z*3. + vRib*7.));
        float stria = lineAA(vInfo.z*2.5 + 0.5, 0.12);
        float rings = lineAA(vRho/1.6, 0.08);
        vec3 dark = mix(uSlate*0.55, uIndigo*0.42, 0.45 + 0.3*grain);
        dark *= 0.8 + 0.4*grain;
        dark = mix(dark, dark*0.55, stria*0.5 + rings*0.35);
        dark = mix(dark, uSlate*2.4, smoothstep(0.55, 1., vNz)*0.35);          // paler worn keel
        dark *= 2.7;
        // the packed spars round the collar: deep indigo with a slate sheen, never black
        dark = mix(dark, (uIndigo*1.5 + uSlate*5.5)*(0.7 + 0.5*grain)*(1. - 0.4*stria), 1. - smoothstep(0.16, 0.42, rr));
        vec3 bone = mix(uBone*0.56, uSlate*2.6, rr*0.8)*(0.8 + 0.3*grain);
        vec3 alb = mix(dark, bone, smoothstep(0.25, 0.8, vInfo.x));
        // spatula: rose pad with a pale lemon edge, the fan's only accent
        float edge = smoothstep(0.55, 0.95, abs(vInfo.z));
        vec3 spat = mix(uRose*vec3(0.66, 0.54, 0.54), uLemon*0.6, edge);
        alb = mix(alb, spat, smoothstep(0.35, 0.9, vInfo.y));
        float ndl = dot(N, uSunDir);
        float dif = max(ndl, 0.);
        vec3 col = alb*(uSunCol*dif + hemi(N)*0.9 + uGndCol*0.9 + uBounce*0.6);
        float fres = 1. - max(dot(N, V), 0.); col += uSkyCol*fres*fres*mix(0.10, 0.05, smoothstep(0.16, 0.5, rr));
        vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.));
        float sp = pow(max(dot(N, H), 0.), 18.)*step(0., ndl);
        col += uSunCol*sp*0.06*(0.4 + vInfo.x);
        // thin pad lets a little sun through
        col += spat*uSunCol*max(-ndl, 0.)*0.3*smoothstep(0.5, 1., vInfo.y);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- membrane
// One pleat = two facets between neighbouring ribs, folded back along a crease. position = (a, r, facet):
// a across the pleat 0..1 (rib to rib), r from the collar (0) to the scalloped rim (1).
function buildMembraneGeometry(P, NA = 4, NR = 40) {
  const pos = [], idx = [];
  for (let f = 0; f < 2; f++) {
    const base = pos.length / 3;
    for (let i = 0; i <= NR; i++) {
      const r = 1 - Math.pow(1 - i / NR, 1.25);              // a little denser toward the rim
      for (let k = 0; k <= NA; k++) pos.push(f * 0.5 + (k / NA) * 0.5, r, f);
    }
    for (let i = 0; i < NR; i++) for (let k = 0; k < NA; k++) {
      const q = base + i * (NA + 1) + k, q2 = q + NA + 1;
      idx.push(q, q + 1, q2, q + 1, q2 + 1, q2);
    }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const pl = new Float32Array(P.nRibs - 1), sd = new Float32Array(P.nRibs - 1);
  for (let i = 0; i < pl.length; i++) { pl[i] = i; sd[i] = P.pleatSeeds[i]; }
  g.setAttribute('aPleat', new THREE.InstancedBufferAttribute(pl, 1));
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sd, 1));
  g.instanceCount = P.nRibs - 1;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, HUB_Y + 40, 0), 140);
  return g;
}

function buildMembraneMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute float aPleat, aSeed;
      uniform float uDepth, uRim, uScallop, uWind;
      varying vec3 vN, vWPos; varying float vA, vR, vRho, vPleat, vSeed, vSpacing, vOpen;
      #include <fog_pars_vertex>
      ${FAN_GLSL}
      vec3 memPos(float a, float r){
        float j = aPleat;
        float sc = 4.*a*(1. - a);
        float rim = uRim - uScallop*(0.55*sc + 0.45*sqrt(max(sc, 0.)));
        float rho = mix(${R_ROOT.toFixed(1)}, rim, r);
        float A0 = ribAngle(j, rho), A1 = ribAngle(j + 1., rho);
        float am = 0.5*(A0 + A1);
        float hc = max(0.5*(A1 - A0)*rho, 0.);                 // half chord now
        float ho = uSpread/uNR*rho;                            // half chord when open
        float dO = uDepth*(0.25 + 0.75*rho/120.)*smoothstep(0., 14., rho - ${R_ROOT.toFixed(1)});
        float d = sqrt(max(ho*ho + dO*dO - hc*hc, 0.));
        float tr = 1. - abs(2.*a - 1.);
        float t = (2.*a - 1.)*hc;
        float e = clamp(0.5*(ribOpen(j) + ribOpen(j + 1.)), 0., 1.);
        float z = -d*tr;
        float sail = sin(6.2832*a); sail *= sail;
        float wind = sin(uTime*1.3 - rho*0.11 + j*0.9) + 0.6*sin(uTime*2.1 - rho*0.05 - j*1.7);
        float rr = rho/120.;
        z += sail*rr*(0.30 + 0.34*uWind*wind)*e;
        z += tr*rr*rr*0.5*uWind*sin(uTime*0.8 - j*0.35 + rho*0.03)*e;
        float f = pleatFlip(j)*e;
        float c = cos(3.14159*f), s = sin(3.14159*f);
        float t2 = t*c - z*s, z2 = t*s + z*c;
        float ang = am + t2/max(rho, 1.);
        return vec3(rho*sin(ang), HUB_Y + rho*cos(ang), z2 + mix(ribZ(j), ribZ(j + 1.), a));
      }
      void main(){
        float a = position.x, r = position.y, fc = position.z;
        vec3 p = memPos(a, r);
        float ea = 0.02, er = 0.012;
        float ac = clamp(a, fc*0.5 + ea, fc*0.5 + 0.5 - ea);
        float rc = clamp(r, er, 1. - er);
        vec3 da = memPos(ac + ea, rc) - memPos(ac - ea, rc);
        vec3 dr = memPos(ac, rc + er) - memPos(ac, rc - er);
        vec3 n = cross(da, dr);
        vec4 wp = modelMatrix*vec4(p, 1.);
        vWPos = wp.xyz; vN = mat3(modelMatrix)*n;
        vA = a; vR = r; vPleat = aPleat; vSeed = aSeed;
        float sc = 4.*a*(1. - a);
        float rim = uRim - uScallop*(0.55*sc + 0.45*sqrt(max(sc, 0.)));
        vRho = mix(${R_ROOT.toFixed(1)}, rim, r);
        vSpacing = 2.*uSpread/uNR*vRho;
        vOpen = clamp(0.5*(ribOpen(aPleat) + ribOpen(aPleat + 1.)), 0., 1.);
        vec4 mvPosition = viewMatrix*wp;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSlate, uIndigo, uTeal, uGold, uLemon, uRose, uBounce;
      uniform float uVeins, uRings, uEyeEvery, uEyeRho, uGlow;
      varying vec3 vN, vWPos; varying float vA, vR, vRho, vPleat, vSeed, vSpacing, vOpen;
      #include <fog_pars_fragment>
      ${LIGHT_GLSL}
      void main(){
        float face = gl_FrontFacing ? 1. : -1.;
        vec3 N = normalize(vN + vec3(0., 0., 1e-5))*face;
        vec3 V = normalize(cameraPosition - vWPos);
        float rr = clamp(vRho/120., 0., 1.);
        float tr = 1. - abs(2.*vA - 1.);
        // ---- veins: radial mains, finer ones toward the rim, feather barbs running out from each rib
        float wob = vnoise(vec2(vPleat*3.1 + vSeed*9., vRho*0.06)) - 0.5;
        float vMain = lineAA(vA*uVeins + 0.5 + wob*0.22, 0.045);
        float vFine = lineAA(vA*uVeins*3. + 0.5 + wob*0.5, 0.07)*smoothstep(0.3, 0.65, rr);
        float vBarb = lineAA(vRho*0.42 - tr*2.2 + wob*0.6, 0.09);
        float vein = max(vMain, max(vFine*0.6, vBarb*0.4));
        // ---- growth rings follow the scalloped rim
        float g = vR + 0.010*sin(vA*18.85 + vSeed*6.) + 0.004*wob;
        g = g*(0.55 + 0.45*g)*uRings;
        float band = 0.5 + 0.5*sin(g*6.2832 + vSeed*0.7);
        float ringL = lineAA(g + 0.25, 0.05);
        float grain = vnoise(vec2(vA*vSpacing*2.2 + vPleat*13., vRho*2.2));
        grain = mix(0.5, grain, 1. - smoothstep(0.25, 0.9, fwidth(vRho*2.2)));
        // ---- ocellus near the rim, sitting across the crease
        vec2 ep = vec2((vA - 0.5)*vSpacing/1.7, (vRho - uEyeRho)/3.0);
        float e = length(ep);
        float eyeOn = step(mod(vPleat + 0.5, max(uEyeEvery, 1.)), 1.)*step(0.5, uEyeEvery);
        float eyeM = (1. - smoothstep(0.92, 1.0, e))*eyeOn;
        vec3 alb, tcol;
        if (face > 0.) {
          // teal face: near-black indigo round the collar, indigo, then peacock teal to the rim
          vec3 cRoot = uIndigo*0.9 + uSlate*5.0;
          vec3 c = mix(cRoot, uIndigo*1.3 + uTeal*0.3 + uSlate*3.0, smoothstep(0.13, 0.33, rr));
          c = mix(c, uTeal*0.9, smoothstep(0.3, 0.78, rr));
          c = mix(c, mix(uTeal, uLemon, 0.4)*0.95, smoothstep(0.86, 1., vR)*0.55);
          c *= mix(1., 0.66, band*smoothstep(0.15, 0.45, rr));
          c *= 0.86 + 0.28*grain;
          c = mix(c, (uIndigo*0.07 + uSlate*0.05)*1.6, vein*0.62);
          c *= 1. - 0.3*ringL;
          vec3 ec = mix(uIndigo*0.12, uTeal*1.05 + uLemon*0.12, smoothstep(0.26, 0.34, e));
          ec = mix(ec, uIndigo*0.5, smoothstep(0.5, 0.56, e));
          ec = mix(ec, uGold*0.8, smoothstep(0.62, 0.68, e));
          ec = mix(ec, uRose*0.8, smoothstep(0.84, 0.88, e));
          c = mix(c, ec, eyeM);
          c = mix(c, uLemon*0.8, smoothstep(0.984, 0.994, vR));
          alb = c;
          // what the sun pushes through from behind: teal deepening inward, lemon at the thin rim
          vec3 t = mix(uTeal*1.25 + vec3(0., 0.02, 0.03), uLemon*1.05, smoothstep(0.68, 1.02, rr)*0.62);
          t = mix(uIndigo*1.3 + uTeal*0.35, t, smoothstep(0.26, 0.6, rr));
          t *= max(smoothstep(0.1, 0.34, rr), 0.3)*(1. - 0.78*vein)*mix(1., 0.6, band)*(1. - 0.35*ringL)*(0.8 + 0.4*grain);
          vec3 et = mix(uIndigo*0.15, uTeal*1.4, smoothstep(0.26, 0.34, e));
          et = mix(et, uIndigo*0.8, smoothstep(0.5, 0.56, e));
          et = mix(et, uGold*1.2, smoothstep(0.62, 0.68, e));
          et = mix(et, uRose*1.1, smoothstep(0.84, 0.88, e));
          tcol = mix(t, et, eyeM);
        } else {
          // gold reverse: matte overlapping scales
          vec2 sc = vec2(vA*vSpacing/0.85, vRho/0.85);
          float fy = fwidth(sc.y);
          sc.x += 0.5*floor(sc.y);
          vec2 f = fract(sc);
          float scale = mix(0.72 + 0.4*f.y - 0.25*abs(f.x - 0.5), 0.9, smoothstep(0.2, 0.7, fy));
          vec3 amber = uGold*vec3(0.62, 0.42, 0.5) + uRose*0.05;
          vec3 c = mix(uGold*0.1 + uIndigo*0.1, amber, smoothstep(0.1, 0.36, rr));
          c = mix(c, uGold*0.74, smoothstep(0.3, 0.7, rr));
          c = mix(c, mix(uGold, uLemon, 0.45)*0.74, smoothstep(0.78, 1., vR));
          c *= 1. - 0.3*ringL;
          c *= scale*mix(1., 0.62, band)*(0.84 + 0.32*grain);
          c = mix(c, uLemon*0.72, vein*0.28 + smoothstep(0.984, 0.994, vR)*0.6);
          c = mix(c, c*vec3(0.55, 0.45, 0.6), eyeM*(1. - smoothstep(0.3, 0.6, e))*0.6);
          alb = c;
          tcol = uGold*0.4*smoothstep(0.1, 0.5, rr)*(1. - 0.6*vein);
        }
        float ndl = dot(N, uSunDir);
        float dif = max(ndl, 0.), tra = max(-ndl, 0.);
        float fwd = max(dot(-V, uSunDir), 0.); fwd *= fwd;
        float ao = face > 0. ? 1. - 0.38*tr*vOpen : 0.62 + 0.38*tr;
        vec3 col = alb*(uSunCol*dif + (hemi(N) + uGndCol*1.5 + uBounce*0.7)*ao);
        col += tcol*uSunCol*tra*uGlow*(0.75 + 0.6*fwd*fwd);
        vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.));
        float sp = pow(max(dot(N, H), 0.), 26.)*step(0., ndl)*step(0., face);
        col += uSunCol*mix(vec3(1.), uTeal*1.5, 0.6)*sp*0.22;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- the animal
// keyframed scalar: kf(t, [[t0, v0], [t1, v1], ...]) with smooth interpolation
function kf(t, K) {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const u = (t - K[i - 1][0]) / (K[i][0] - K[i - 1][0]); return lerp(K[i - 1][1], K[i][1], u * u * (3 - 2 * u)); }
  return K[K.length - 1][1];
}
const endRound = (t, w) => Math.sqrt(Math.max(1 - Math.pow(1 - Math.min(t / w, (1 - t) / w, 1), 2), 0.0004));
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

async function buildAnimal(ctx, P, C, lod = 0) {
  const Y = async () => { if (ctx.yield) await ctx.yield(); };
  const G = makeAcc(), N = ctx.noise, sd = P.noiseSeed;
  if (lod) G.lod = lod;
  const hide = (p, shade, lichen) => {           // slate-indigo hide with blotches; pale dusting on upward faces
    const n1 = N.fbm3(p.x * 0.05 + sd, p.y * 0.07, p.z * 0.05, 3), n2 = N.n3(p.x * 0.33, p.y * 0.33 + sd, p.z * 0.33);
    let c = mix3(scl3(C.slate, 3.8), scl3(C.indigo, 0.5), clamp(0.3 + 0.45 * n1, 0, 1));
    c = scl3(c, (0.85 + 0.22 * n2) * shade);
    return mix3(c, scl3(C.bone, 0.36), clamp(lichen * (0.1 + 0.5 * n1), 0, 0.22));
  };
  const bone = (p, k) => scl3(mix3(scl3(C.bone, 0.52), scl3(C.slate, 3.2), clamp(0.3 + 0.5 * N.n3(p.x * 0.4, p.y * 0.4, p.z * 0.4 + sd), 0, 1) * 0.55), k);

  // ---- body: 98 m from chest (z +6) to rump (z -92), top at y 22 under the collar
  const bl = P.bodyLen, bw = P.bodyW;
  const bodyCurve = new THREE.CatmullRomCurve3([V3(0, 7.5, 6), V3(0, 11, -12), V3(0, 10.6, -0.42 * bl), V3(0, 8.2, -0.72 * bl), V3(0, 5.2, -bl)], false, 'centripetal');
  const RX = [[0, 7], [0.18, 17 * bw], [0.34, 15.5 * bw], [0.55, 16.5 * bw], [0.8, 9.5 * bw], [1, 3.6]];
  const RY = [[0, 6.5], [0.18, 11], [0.34, 9.6], [0.55, 10.2], [0.8, 6.6], [1, 3]];
  await loftA(G, {
    curve: bodyCurve, n: 72, sides: 44, floor: 0.25, Y,
    shape: (t, a) => {
      const er = endRound(t, 0.07), ca = Math.cos(a), sa = Math.sin(a);
      const nz = N.fbm3(ca * 1.4 + sd, sa * 1.4, t * 9, 3);
      const fold = 0.035 * Math.sin(t * 70 + 2.5 * N.n2(t * 6, a)) * Math.abs(sa);         // flank creases
      const k = er * (1 + 0.09 * nz + fold);
      const keel = 1 + 0.16 * Math.pow(Math.max(ca, 0), 9) * (0.6 + 0.4 * Math.sin(t * 46));
      return [kf(t, RX) * k * (1.08 - 0.1 * ca), kf(t, RY) * k * keel * (ca < 0 ? 0.9 : 1)];
    },
    color: (t, a, p) => {
      const ca = Math.cos(a);
      const band = 0.82 + 0.18 * Math.sin(t * 46 + 1.2 * Math.sin(a * 2));
      let c = hide(p, (0.72 + 0.28 * smoothstep(-0.7, 0.5, ca)) * band, smoothstep(0.45, 0.95, ca));
      const kn = Math.pow(Math.max(ca, 0), 14) * smoothstep(0.2, 0.6, Math.sin(t * 46));
      return mix3(c, bone(p, 0.9), kn * 0.8);
    },
    aux: (t, a) => [Math.abs(Math.sin(a)) * smoothstep(0.08, 0.3, t) * (1 - smoothstep(0.6, 0.9, t)), 0, Math.pow(Math.max(Math.cos(a), 0), 14) * 0.6],
  });

  await Y();
  // ---- pedestal and stays: the collar is bedded in the shoulders and guyed back to the spine
  loft(G, {
    pts: [V3(0, 15, -7), V3(0, 18.5, -3.5), V3(0, 20.6, -0.6), V3(0, 22.2, 0)], n: 10, sides: 16, ref: V3(0, 0, 1),
    shape: (t) => [lerp(8, 4.4, t), lerp(6.5, 2.9, t)],
    color: (t, a, p) => mix3(hide(p, 0.9, 0), bone(p, 0.85), smoothstep(0.35, 0.9, t)),
    aux: (t) => [0, 0, t],
  });
  for (const sx of [-1, 1]) {
    loft(G, {
      pts: [V3(sx * 7.9, 24.6, -0.4), V3(sx * 10.5, 22.5, -5), V3(sx * 12.5, 19.5, -11), V3(sx * 12, 15, -18)], n: 12, sides: 8,
      shape: (t) => { const r = lerp(1.5, 2.9, t * t) * (1 + 0.35 * bump(t, 0.38, 0.1)); return [r, r * 1.2]; },
      color: (t, a, p) => mix3(bone(p, 0.9), hide(p, 0.9, 0), smoothstep(0.5, 0.95, t)), aux: (t) => [0, 0, 1 - t],
    });
    loft(G, {
      pts: [V3(sx * 7.6, 35.2, -1.8), V3(sx * 5.5, 30.5, -9), V3(sx * 2.4, 25.5, -18), V3(sx * 0.8, 20.5, -27)], n: 12, sides: 6,
      shape: (t) => { const r = lerp(0.95, 1.5, t) * (1 + 0.4 * bump(t, 0.5, 0.08)); return [r, r]; },
      color: (t, a, p) => mix3(bone(p, 0.8), hide(p, 0.85, 0), smoothstep(0.6, 1, t)), aux: (t) => [0, 0, 1 - t],
    });
  }

  await Y();
  // ---- collar: a bony ring, 9.3 m mean radius, 7.3 m clear inside (the portal is 7)
  const RC = 9.3, segs = P.bosses * 3;
  const ringCurve = {
    getPoint(t, o) { const f = t * Math.PI * 2; return o.set(RC * Math.sin(f), HUB_Y + RC * Math.cos(f), 0); },
    getTangent(t, o) { const f = t * Math.PI * 2; return o.set(Math.cos(f), -Math.sin(f), 0); },
  };
  await loftA(G, {
    curve: ringCurve, n: lod ? 64 : 300, sides: lod ? 7 : 12, ref: V3(0, 0, 1), keep: true, Y,
    // section angle a: 0 front (+Z), +PI/2 outer rim, -PI/2 inner face, PI back. Vertebra-like segments
    // with crisp sutures between them, a squared bevelled section, heavier toward the bottom.
    shape: (t, a) => {
      const f = t * Math.PI * 2, low = 0.5 - 0.5 * Math.cos(f);
      const sg = 0.5 + 0.5 * Math.cos(f * segs), groove = Math.pow(sg, 10);
      const k = (1 + 0.08 * (1 - sg) - 0.17 * groove) * (1 + 0.2 * low * low);
      const sq = 1 / Math.pow(Math.pow(Math.abs(Math.sin(a)), 4) + Math.pow(Math.abs(Math.cos(a)), 4), 0.25);
      const flange = 1 + 0.13 * bump(a, 0.95, 0.3) + 0.1 * bump(a, 2.2, 0.3);
      return [1.85 * k * sq * flange, 2.5 * k * sq * flange];
    },
    color: (t, a, p) => {
      const f = t * Math.PI * 2;
      const sg = 0.5 + 0.5 * Math.cos(f * segs), groove = Math.pow(sg, 10);
      const inner = smoothstep(0.5, 1.25, -a) * (1 - smoothstep(2.3, 2.9, -a));
      const pit = bump(a, 0.25, 0.22) * Math.pow(1 - sg, 6);
      let c = bone(p, 0.92 + 0.14 * bump(a, 0.95, 0.3));
      c = mix3(c, scl3(C.slate, 1.6), clamp(0.8 * groove + 0.7 * pit, 0, 0.85));
      return mix3(c, scl3(C.indigo, 0.1), inner * 0.9);
    },
    aux: () => [0, 0, 1],
  });
  await Y();
  // a smooth dark lip inside the bone: the calm frame the portal sits in
  const lipCurve = {
    getPoint(t, o) { const f = t * Math.PI * 2; return o.set(7.72 * Math.sin(f), HUB_Y + 7.72 * Math.cos(f), 0.2); },
    getTangent(t, o) { const f = t * Math.PI * 2; return o.set(Math.cos(f), -Math.sin(f), 0); },
  };
  if (!lod) loft(G, {
    curve: lipCurve, n: 96, sides: 8, ref: V3(0, 0, 1),
    shape: () => [0.5, 1.5],
    color: (t, a, p) => scl3(mix3(C.indigo, C.slate, 0.3), 0.3 + 0.08 * N.n3(p.x, p.y, p.z)),
    aux: () => [0, 0, 1],
  });

  await Y();
  // ---- limbs
  // A limb is plainly a limb: swollen joints with a pinch either side, a row of keeled bone plates along the
  // upper side (each rising to its trailing edge, then a step down to the next), tendon cords down the flanks.
  // plateAt(t, a) -> 0..1 is shared by the shape, the colour and the bone mask so the plates light as bone.
  const limb = async (pts, R, n, sides, joints, rich = true, NP = 13) => {
    const ref = undefined;
    const plateAt = (t, a) => {
      const ca = Math.cos(a), top = Math.pow(Math.max(ca, 0), 3.2);
      const f = t * NP + 0.35, ph = f - Math.floor(f);
      let prof = smoothstep(0.02, 0.2, ph) * (1 - smoothstep(0.86, 0.98, ph)) * (0.45 + 0.55 * ph);
      prof *= smoothstep(0.03, 0.1, t) * (1 - smoothstep(0.9, 0.96, t));
      return top * prof;
    };
    const jointAt = (t) => { let k = 0; for (const j of joints) k += bump(t, j, 0.04); return Math.min(k, 1); };
    await loftA(G, {
      pts, n: G.lod || !rich ? n : n * 3, sides: G.lod || !rich ? sides : sides + 6, ref, Y,
      shape: (t, a) => {
        let r = kf(t, R); for (const j of joints) r *= 1 + 0.3 * bump(t, j, 0.04) - 0.13 * bump(t, j - 0.085, 0.035) - 0.13 * bump(t, j + 0.085, 0.035);
        r *= 1 + 0.05 * N.n3(t * 12 + sd, Math.cos(a) * 2, Math.sin(a) * 2);
        const cord = 0.045 * Math.pow(Math.abs(Math.sin(a * 3)), 3) * (1 - jointAt(t)) * (1 - smoothstep(-0.5, 0.1, Math.cos(a)));   // tendons under the plates
        const pl = plateAt(t, a);
        return [r * (1 + cord + 0.1 * pl), r * 1.12 * (1 + cord + 0.42 * pl)];
      },
      color: (t, a, p) => {
        const ca = Math.cos(a), pl = plateAt(t, a), k = jointAt(t);
        let c = hide(p, (0.62 + 0.3 * smoothstep(-0.8, 0.6, ca)) * (1 - 0.3 * smoothstep(0.02, 0.3, pl) * (1 - smoothstep(0.3, 0.6, pl))), 0);   // dark seam round each plate
        c = mix3(c, bone(p, 0.8), k * 0.75 * smoothstep(-0.2, 0.7, ca));
        return mix3(c, bone(p, 0.98), smoothstep(0.25, 0.6, pl) * 0.92);
      },
      aux: (t, a) => [0, 0, Math.max(jointAt(t), smoothstep(0.25, 0.6, plateAt(t, a)))],
    });
  };
  const toes = (foot, heading, len) => {
    for (let k = -1; k <= 1; k++) {
      const a = heading + k * 0.62, dx = Math.sin(a), dz = Math.cos(a), L = len * (k === 0 ? 1.15 : 0.92);
      loft(G, {
        pts: [V3(foot.x - dx * 1.2, foot.y + 0.9, foot.z - dz * 1.2), V3(foot.x + dx * L * 0.4, 2.3, foot.z + dz * L * 0.4), V3(foot.x + dx * L * 0.8, 1.0, foot.z + dz * L * 0.8), V3(foot.x + dx * L, 0.25, foot.z + dz * L)],
        n: 12, sides: 8, floor: 0.05,
        shape: (t) => { const r = lerp(1.35, 0.42, t) * (1 + 0.3 * bump(t, 0.42, 0.07)) * (t > 0.82 ? lerp(1, 0.12, (t - 0.82) / 0.18) : 1); return [r, r * 0.9]; },
        color: (t, a2, p) => mix3(hide(p, 0.8, 0), bone(p, 0.95), Math.max(smoothstep(0.74, 0.86, t), bump(t, 0.42, 0.06) * 0.6)),
        aux: (t) => [0, 0, smoothstep(0.74, 0.86, t)],
      });
    }
  };
  const fx = P.footX, fz = P.footZ;
  for (const sx of [-1, 1]) {
    // forelegs planted wide, elbows cocked high and passing under the lowest ribs
    await limb([V3(sx * 11, 12, -11), V3(sx * 25, 17.5, -6), V3(sx * (fx - 8), 21.5, 3), V3(sx * (fx - 1), 11, fz - 9), V3(sx * fx, 2.2, fz - 1)],
      [[0, 8.2], [0.3, 5.4], [0.55, 4.2], [0.8, 2.9], [1, 2.3]], 30, 14, [0.52, 0.8, 0.97]);
    await Y();
    toes(V3(sx * fx, 1.4, fz), sx * 0.22, 7.6);
    // a bone spur on each cocked elbow
    loft(G, {
      pts: [V3(sx * (fx - 8.5), 22.5, 2.5), V3(sx * (fx - 6.5), 25.6, 3.6), V3(sx * (fx - 3.2), 27.6, 5.4)], n: 8, sides: 7,
      shape: (t) => { const r = lerp(2.3, 0.12, Math.pow(t, 0.8)); return [r, r * 1.2]; },
      color: (t, a, p) => mix3(hide(p, 0.9, 0), bone(p, 0.95), smoothstep(0.1, 0.5, t)), aux: (t) => [0, 0, t],
    });
  }
  await Y();
  // the hind strut, braced straight back against the weight of the fan
  await limb([V3(0, 6.5, -bl + 8), V3(0, 11.5, -bl - 7), V3(0, 13.5, -bl - 15), V3(0, 6, -bl - 21), V3(0, 1.9, -bl - 24.5)],
    [[0, 6.0], [0.4, 4.0], [0.6, 3.4], [1, 2.4]], 26, 14, [0.55, 0.97], false);
  await Y();
  // dorsal plates down the spine
  for (let i = 0; i < P.plates; i++) {
    const t = lerp(0.24, 0.9, i / (P.plates - 1)), c = bodyCurve.getPoint(t), top = c.y + kf(t, RY) * 1.08, sz = (0.75 + 0.5 * Math.sin(i * 1.9 + sd)) * lerp(1.25, 0.6, i / P.plates);
    loft(G, {
      pts: [V3(0, top - 1.2, c.z + 1.2), V3(0, top + 1.8 * sz, c.z + 0.2), V3(0, top + 4.6 * sz, c.z - 2.6 * sz)], n: 7, sides: 8, ref: V3(0, 0, 1),
      shape: (u) => [lerp(0.75, 0.08, u), lerp(2.6 * sz, 0.15, Math.pow(u, 0.7))],
      color: (u, a, p) => mix3(hide(p, 0.9, 0), bone(p, 0.9), smoothstep(0.15, 0.6, u)), aux: (u) => [0, 0, u],
    });
  }
  toes(V3(0, 1.4, -bl - 25), Math.PI, 6.6);
  return G;
}

// Neck and head: the neck leaves the chest, passes under the lowest ribs and lays the wedge head on
// the ground in front of the fan on the +X side, snout turned in toward the lane.
function buildNeckHead(ctx, P, C, G) {
  const N = ctx.noise, sd = P.noiseSeed;
  const hx = P.headX, hz = P.headZ, HL = P.headLen, yaw = P.headYaw;
  const hd = V3(-Math.sin(yaw), 0, Math.cos(yaw)), side = V3(Math.cos(yaw), 0, Math.sin(yaw));
  const hide = (p, shade) => {
    const n1 = N.fbm3(p.x * 0.07 + sd, p.y * 0.09, p.z * 0.07, 3), n2 = N.n3(p.x * 0.45, p.y * 0.45 + sd, p.z * 0.45);
    return scl3(mix3(scl3(C.slate, 3.8), scl3(C.indigo, 0.5), clamp(0.3 + 0.45 * n1, 0, 1)), (0.85 + 0.22 * n2) * shade);
  };
  const boneC = scl3(C.bone, 0.5);
  const HW = [[0, 2.5], [0.22, 2.9], [0.5, 2.05], [0.82, 1.1], [1, 0.18]];
  const HH = [[0, 2.5], [0.22, 2.65], [0.5, 1.75], [0.82, 0.9], [1, 0.16]];
  const base = V3(hx, 0, hz);
  // neck
  const nb = base.clone().addScaledVector(hd, -0.6); nb.y = 2.7;
  loft(G, {
    pts: [V3(3, 9, 3), V3(13, 14.6, 12), V3(hx * 0.68, 13.8, hz * 0.56), V3(hx * 0.93, 8, hz * 0.83), nb], n: 46, sides: 18, floor: 0.2,
    shape: (t, a) => {
      const ca = Math.cos(a);
      let r = kf(t, [[0, 5.4], [0.3, 4.3], [0.7, 3.1], [1, 2.25]]);
      r *= 1 + 0.045 * N.n3(t * 14 + sd, ca * 2, Math.sin(a) * 2) + 0.03 * Math.sin(t * 90) * Math.abs(Math.sin(a));
      const keel = 1 + 0.22 * Math.pow(Math.max(ca, 0), 14) * Math.pow(0.5 + 0.5 * Math.sin(t * 62), 2);
      return [r, r * 1.08 * keel];
    },
    color: (t, a, p) => {
      const ca = Math.cos(a);
      const thr = (1 - smoothstep(-0.75, -0.1, ca)) * smoothstep(0.5, 0.64, t) * (1 - smoothstep(0.93, 1, t));
      let c = hide(p, (0.74 + 0.26 * smoothstep(-0.6, 0.6, ca)) * (0.85 + 0.15 * Math.sin(t * 90)));
      c = mix3(c, boneC, Math.pow(Math.max(ca, 0), 22) * Math.pow(0.5 + 0.5 * Math.sin(t * 62), 3) * 0.6);
      const pleatLine = 0.78 + 0.22 * Math.sin(a * 14);                       // the throat patch is pleated skin
      return mix3(c, scl3(C.rose, 0.6 * pleatLine), thr);
    },
    aux: (t, a) => {
      const ca = Math.cos(a), thr = (1 - smoothstep(-0.75, -0.1, ca)) * smoothstep(0.5, 0.64, t) * (1 - smoothstep(0.93, 1, t));
      return [0.35 * smoothstep(0.1, 0.4, t) * (1 - smoothstep(0.8, 1, t)), thr, Math.pow(Math.max(ca, 0), 10) * 0.5];
    },
  });
  // head
  const hp = [];
  for (let i = 0; i <= 6; i++) { const t = i / 6, p = base.clone().addScaledVector(hd, t * HL); p.y = kf(t, HH) * 0.96 + 0.12; hp.push(p); }
  loft(G, {
    pts: hp, n: 30, sides: 22, floor: 0.05,
    shape: (t, a) => {
      const ca = Math.cos(a), sa = Math.sin(a);
      const er = t < 0.06 ? 0.85 + 0.15 * (t / 0.06) : 1;
      let w = kf(t, HW) * (0.76 + 0.24 * (1 - ca)) * er, h = kf(t, HH) * er;
      h *= 1 + 0.2 * Math.pow(Math.max(ca, 0), 10) * bump(t, 0.2, 0.2);              // sagittal crest
      const brow = bump(t, 0.3, 0.09) * bump(Math.abs(a), 0.85, 0.3);
      w *= 1 + 0.2 * brow; h *= 1 + 0.16 * brow;
      const cheek = bump(t, 0.16, 0.12) * bump(Math.abs(a), 1.9, 0.4);
      w *= 1 + 0.12 * cheek;
      w *= 1 - 0.07 * bump(Math.abs(a), 2.15, 0.1) * smoothstep(0.25, 0.4, t);       // the mouth line
      return [w * (1 + 0.02 * N.n3(t * 9, ca * 2 + sd, sa * 2)), h];
    },
    color: (t, a, p) => {
      const ca = Math.cos(a);
      let c = hide(p, 0.72 + 0.3 * smoothstep(-0.6, 0.7, ca));
      const mouth = bump(Math.abs(a), 2.15, 0.08) * smoothstep(0.22, 0.4, t);
      c = scl3(c, 1 - 0.6 * mouth);
      c = mix3(c, boneC, Math.max(Math.pow(Math.max(ca, 0), 12) * bump(t, 0.2, 0.2), smoothstep(0.86, 1, t)) * 0.75);  // crest and beak tip
      const nostril = bump(t, 0.9, 0.02) * bump(Math.abs(a), 0.6, 0.18);
      return scl3(c, 1 - 0.75 * nostril);
    },
    aux: (t, a) => [0, 0, smoothstep(0.86, 1, t)],
  });
  // a small crest of bone spines on the back of the skull, an echo of the great ribs
  const nSp = P.crest, cb = base.clone().addScaledVector(hd, 0.13 * HL); cb.y = kf(0.13, HH) * 1.9;
  for (let k = 0; k < nSp; k++) {
    const f = (k - (nSp - 1) / 2) * (1.5 / nSp), L = (4.6 - 1.4 * Math.abs(f)) * (0.9 + 0.2 * Math.sin(k * 2.3 + sd));
    const dir = side.clone().multiplyScalar(Math.sin(f) * 0.95).addScaledVector(hd, -0.7); dir.y = Math.cos(f) * 0.85; dir.normalize();
    const b0 = cb.clone().addScaledVector(side, Math.sin(f) * 1.5); b0.y -= 0.7 + 0.5 * Math.abs(Math.sin(f));
    const b1 = b0.clone().addScaledVector(dir, L * 0.5); b1.y += 0.25;
    const b2 = b0.clone().addScaledVector(dir, L).addScaledVector(hd, -L * 0.18);
    loft(G, {
      pts: [b0, b1, b2], n: 8, sides: 6,
      shape: (t) => { const r = lerp(0.42, 0.14, t) * (1 + 0.9 * bump(t, 0.93, 0.07)); return [r * 1.5, r]; },
      color: (t) => mix3(mix3(boneC, scl3(C.slate, 3), 0.5 * (1 - t)), scl3(C.rose, 0.6), smoothstep(0.78, 0.92, t)),
      aux: (t) => [0, 0, 1],
    });
  }
  // eyes: [centre, outward normal] for the lane side (-side) and the far side
  const eyes = [];
  const et = 0.3, ec = base.clone().addScaledVector(hd, et * HL);
  for (const s of [-1, 1]) {
    const c = ec.clone().addScaledVector(side, s * kf(et, HW) * 0.9); c.y = kf(et, HH) * 1.22;
    const n = side.clone().multiplyScalar(s * 0.86).addScaledVector(hd, 0.2); n.y = 0.42; n.normalize();
    eyes.push({ c, n });
  }
  return { eyes, headDir: hd, headBase: base };
}

function buildEyeGeometry(eyes) {
  const pos = [], nor = [], kind = [], idx = [];
  const add = (g, k) => {
    const b = pos.length / 3, p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); kind.push(k[0], k[1]); }
    const ix = g.index; for (let i = 0; i < ix.count; i++) idx.push(b + ix.getX(i));
    g.dispose();
  };
  const q = new THREE.Quaternion(), m = new THREE.Matrix4(), one = V3(1, 1, 1), zAxis = V3(0, 0, 1);
  eyes.forEach((e, i) => {
    q.setFromUnitVectors(zAxis, e.n);
    const ring = new THREE.TorusGeometry(1.06, 0.27, 10, 40); ring.applyMatrix4(m.compose(e.c, q, one)); add(ring, [0, i]);
    const lid = new THREE.TorusGeometry(1.42, 0.2, 8, 40); lid.applyMatrix4(m.compose(e.c.clone().addScaledVector(e.n, -0.12), q, one)); add(lid, [2, i]);
    const ball = new THREE.SphereGeometry(1.0, 24, 16); ball.applyMatrix4(m.compose(e.c.clone().addScaledVector(e.n, -0.42), q, one)); add(ball, [1, i]);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 2));
  g.setIndex(idx);
  return g;
}

function buildEyeMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: true,
    vertexShader: /* glsl */`
      attribute vec2 aKind;
      varying vec3 vN, vWPos, vLN; varying vec2 vKind;
      #include <fog_pars_vertex>
      void main(){
        vec4 wp = modelMatrix*vec4(position, 1.);
        vWPos = wp.xyz; vN = mat3(modelMatrix)*normal; vLN = normal; vKind = aKind;
        vec4 mvPosition = viewMatrix*wp;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSlate, uIndigo, uGold, uLemon, uRose;
      uniform vec3 uLook0, uLook1; uniform float uTime;
      varying vec3 vN, vWPos, vLN; varying vec2 vKind;
      #include <fog_pars_fragment>
      ${LIGHT_GLSL}
      void main(){
        vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
        vec3 V = normalize(cameraPosition - vWPos);
        vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.));
        float ndl = dot(N, uSunDir), nh = max(dot(N, H), 0.);
        vec3 col;
        if (vKind.x < 0.5) {                      // rose eye-ring, wrinkled
          float w = 0.85 + 0.15*sin(atan(vLN.y, vLN.x + 1e-4)*22.);
          vec3 alb = uRose*vec3(0.62, 0.5, 0.5)*w;
          col = alb*(uSunCol*max(ndl, 0.) + hemi(N)) + uSunCol*pow(nh, 20.)*0.08;
        } else if (vKind.x > 1.5) {               // bony orbit
          vec3 alb = uSlate*2.2 + uIndigo*0.1;
          col = alb*(uSunCol*max(ndl, 0.) + hemi(N));
        } else {                                  // the eye: dark globe, gold iris, pupil that follows the camera
          vec3 look = vKind.y < 0.5 ? uLook0 : uLook1;
          vec3 ln = normalize(vLN + vec3(0., 1e-5, 0.));
          float c = dot(ln, look);
          float fib = 0.75 + 0.25*sin(atan(ln.y - look.y, ln.x - look.x + 1e-4)*40.);
          vec3 alb = uIndigo*0.05 + uSlate*0.04;
          alb = mix(alb, mix(uGold*0.85, uLemon*0.8, smoothstep(0.80, 0.93, c))*fib, smoothstep(0.76, 0.80, c));
          alb = mix(alb, vec3(0.004, 0.004, 0.008), smoothstep(0.925, 0.94, c));
          col = alb*(uSunCol*max(ndl, 0.) + hemi(N));
          float fr = 1. - max(dot(N, V), 0.); fr = fr*fr*fr;
          vec3 R = reflect(-V, N);
          col += hemi(R)*(0.05 + 0.5*fr);
          col += uSunCol*pow(nh, 140.)*step(0., ndl)*1.6;
        }
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

function buildBodyMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, fog: true,
    vertexShader: /* glsl */`
      attribute vec3 aColor, aAux;
      uniform float uTime, uThroat;
      varying vec3 vN, vWPos, vOP, vON, vCol, vAux, vM0, vM1, vM2;
      #include <fog_pars_vertex>
      void main(){
        float breath = 0.5 + 0.5*sin(uTime*0.42);
        float swell = aAux.x*(0.25 + 0.75*breath)*0.9 + aAux.y*(0.25 + uThroat*(1.15 + 0.3*sin(uTime*1.6)));
        vec3 p = position + normal*swell;
        vec4 wp = modelMatrix*vec4(p, 1.);
        vWPos = wp.xyz; vN = mat3(modelMatrix)*normal; vOP = position; vON = normal; vCol = aColor; vAux = aAux;
        vM0 = modelMatrix[0].xyz; vM1 = modelMatrix[1].xyz; vM2 = modelMatrix[2].xyz;
        vec4 mvPosition = viewMatrix*wp;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSlate, uIndigo, uLemon, uRose, uBounce; uniform float uThroat, uHideGain, uElder;
      varying vec3 vN, vWPos, vOP, vON, vCol, vAux, vM0, vM1, vM2;
      #include <fog_pars_fragment>
      ${LIGHT_GLSL}
      float tri(vec3 p, vec3 w, float s){ return vnoise(p.yz*s)*w.x + vnoise(p.xz*s)*w.y + vnoise(p.xy*s)*w.z; }
      float plateH(vec3 p, vec3 w){
        return 0.5*smoothstep(0.0, 0.075, abs(tri(p, w, 0.42) - 0.5)) + 0.2*smoothstep(0.0, 0.11, abs(tri(p + 31.7, w, 1.9) - 0.5));
      }
      void main(){
        vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
        vec3 V = normalize(cameraPosition - vWPos);
        vec3 w = normalize(vON + vec3(0., 1e-5, 0.)); w = w*w;
        float g1 = tri(vOP, w, 0.42), g2 = tri(vOP + 31.7, w, 1.9), g3 = tri(vOP - 12.3, w, 6.5);
        float crack = 1. - smoothstep(0.0, 0.045, abs(g1 - 0.5));       // plate boundaries
        float crack2 = 1. - smoothstep(0.0, 0.06, abs(g2 - 0.5));
        // the hide is broken into raised plates: the seams are grooves with a lit and a shaded lip, not drawn lines
        float px = length(fwidth(vOP));
        float relief = (1. - smoothstep(0.12, 0.7, px))*(1. - 0.75*vAux.z)*(1. - vAux.y);
        // heights are sampled a pixel apart along the surface (not taken from screen derivatives, which come in 2x2 blocks)
        vec3 nO = normalize(vON + vec3(0., 1e-5, 0.));
        vec3 t1 = normalize(cross(nO, abs(nO.y) < 0.9 ? vec3(0., 1., 0.) : vec3(1., 0., 0.)));
        vec3 t2 = cross(nO, t1);
        float e = max(px*0.9, 0.03);
        float h0 = plateH(vOP, w);
        vec3 gradO = ((plateH(vOP + t1*e, w) - h0)*t1 + (plateH(vOP + t2*e, w) - h0)*t2)/e;
        N = normalize(mat3(vM0, vM1, vM2)*normalize(nO - gradO*relief) + vec3(0., 1e-6, 0.));
        vec3 alb = vCol*mix(0.66 + 0.36*g2 + 0.36*g3, 0.88 + 0.08*g2 + 0.14*g3, vAux.z);
        alb *= 1. - 0.56*crack*(1. - vAux.z) - 0.3*crack2*(1. - vAux.y);
        alb *= 1. + 0.16*(smoothstep(0.03, 0.12, abs(g1 - 0.5)) - 0.5)*(1. - vAux.z);        // plate crowns worn paler than their edges
        alb = mix(alb, uRose*mix(0.62, 0.8, uElder)*(0.8 + 0.3*g3), vAux.y*uThroat*mix(0.45, 0.9, uElder));   // an elder's throat (uElder 1): the rose slot at 0.8 over nine tenths of the patch; the Great Fan's (0) is live's
        float ndl = dot(N, uSunDir);
        float dif = max(ndl, 0.);
        float wrap = clamp(ndl*0.5 + 0.5, 0., 1.);
        // hide is pale slate, not ink: lift it. The Great Fan's (uElder 0) is pulled toward grey so the shaded side stays blue-slate: live's line whole. On an elder (uElder 1) "bare" is 1 on bare hide and 0 on bone, told by the base colour the builder wrote: the share of it that lies outside the slate and indigo slots, counted in the lemon slot (the dusted hide of the back holds under 0.09 of it, every plate, knuckle, claw and crest over 0.12; the throat patch counts as hide from 0.07 of its mask). Bare hide is pulled, by the same weight, toward the slate and indigo slots in equal parts (the suitors' hide) at the same strength and lifted 0.93 of the Great Fan's; bone keeps live's grey pull and live's lift of 0.72; the rose throat is left whole, outside the pull and the lift
        float bare = uElder*max(1. - smoothstep(0.09, 0.12, abs(dot(vCol, cross(uSlate, uIndigo)))/max(abs(dot(uLemon, cross(uSlate, uIndigo))), 1e-6)), smoothstep(0., 0.07, vAux.y)); alb = mix(alb, mix(vec3(dot(alb, vec3(0.3, 0.5, 0.2)))*vec3(0.96, 1., 1.1), mix((uSlate*0.5 + uIndigo*0.5)*(dot(alb, vec3(0.3, 0.5, 0.2))/max(dot(uSlate*0.5 + uIndigo*0.5, vec3(0.3, 0.5, 0.2)), 1e-4)), alb, vAux.y), bare), 0.6*(1. - vAux.z))*mix(mix(uHideGain*mix(1., 0.93/0.72, bare), 1.7, vAux.z), 1., vAux.y*uElder);
        // the sun stands behind the fan, so the animal is lit by what surrounds it: the bright sun-side sky
        // (a broad warm source high on the left), the lit plain bouncing up from below, the sky above
        vec3 L2 = normalize(vec3(uSunDir.x, uSunDir.y + 0.62, -0.3*uSunDir.z) + vec3(0., 1e-4, 0.));
        float glow = clamp((dot(N, L2) + 0.35)/1.35, 0., 1.); glow *= glow;
        float under = clamp(0.6 - 0.6*N.y, 0., 1.);
        vec3 col = alb*(uSunCol*dif + uSunCol*0.5*glow + hemi(N)*(0.8 + 0.3*wrap) + uGndCol*1.1 + uBounce*under);
        vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.));
        float gloss = mix(0.05, 0.16, vAux.z);
        col += uSunCol*pow(max(dot(N, H), 0.), mix(14., 34., vAux.z))*step(0., ndl)*gloss;
        float fr = 1. - max(dot(N, V), 0.); fr *= fr; fr *= fr;
        col += uSkyCol*fr*0.32;                                           // sky sheen on the turned-away hide
        // rose skin glows faintly when the sun is behind it
        col += uRose*uSunCol*max(-ndl, 0.)*0.12*vAux.y;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// Shed scales: small gold flakes rising in slow columns round the Fan, tumbling in the sun (lit, matte).
function buildFlakes(rng, U, count) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 0, -0.7, 0, 1, 0, 0, 0, 0.7, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const seed = new Float32Array(count * 4), rnd = new Float32Array(count * 4);
  const cols = [];
  for (let i = 0; i < 7; i++) cols.push([rng.sign() * rng.range(26, 95), rng.range(-30, 60), rng.range(5, 10)]);
  for (let i = 0; i < count; i++) {
    const c = cols[i % cols.length], a = rng() * Math.PI * 2, r = c[2] * Math.sqrt(rng());
    seed.set([c[0] + Math.cos(a) * r, rng() * 90, c[1] + Math.sin(a) * r, rng() * 6.283], i * 4);
    rnd.set([rng.range(0.6, 1.5), rng.range(0.25, 0.6), rng.range(0.7, 2.1), rng()], i * 4);
  }
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 4));
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 45, 0), 150);
  const mat = new THREE.ShaderMaterial({
    uniforms: U, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aSeed, aRnd; uniform float uTime;
      varying vec3 vN, vWPos; varying float vFade, vTone;
      #include <fog_pars_vertex>
      void main(){
        float y = mod(aSeed.y + uTime*aRnd.x*1.4, 90.);
        float fade = smoothstep(0., 8., y)*(1. - smoothstep(70., 90., y));
        float a = uTime*aRnd.z + aSeed.w, b = uTime*aRnd.z*0.63 + aSeed.w*2.;
        vec3 ax = vec3(cos(a), 0., sin(a)), up = vec3(sin(b)*0.6*-sin(a), cos(b*0.7)*0.8 + 0.2, sin(b)*0.6*cos(a));
        vec3 c = vec3(aSeed.x + sin(uTime*0.31 + aSeed.w)*2.2 + y*0.05, y, aSeed.z + cos(uTime*0.27 + aSeed.w*1.7)*2.2);
        vec3 p = c + (ax*position.x + up*position.y)*aRnd.y*fade;
        vec3 n = cross(ax, up);
        vec4 wp = modelMatrix*vec4(p, 1.);
        vWPos = wp.xyz; vN = mat3(modelMatrix)*n; vFade = fade; vTone = aRnd.w;
        vec4 mvPosition = viewMatrix*wp;
        gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uGold, uLemon;
      varying vec3 vN, vWPos; varying float vFade, vTone;
      #include <fog_pars_fragment>
      ${LIGHT_GLSL}
      void main(){
        vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
        float ndl = dot(N, uSunDir);
        vec3 alb = mix(uGold*0.8, uLemon*0.72, vTone*0.5);
        vec3 col = alb*(uSunCol*(abs(ndl)*0.8 + 0.1) + hemi(N*sign(ndl + 1e-4)));
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}

// GLSL for the world: the Fan's striped shadow at a hero-local point (ground or suitor), 0 lit .. 1 shaded.
function makeShadowGLSL(P) {
  return /* glsl */`
float greatFanShadow(vec3 p, vec3 sunL, float unfurl){
  float lz = abs(sunL.z) < 1e-3 ? -1e-3 : sunL.z;
  float t = -p.z/lz;
  vec2 q = p.xy + sunL.xy*t - vec2(0., ${HUB_Y.toFixed(1)});
  float rho = length(q);
  float ang = atan(q.x, q.y + 1e-4);
  float halfA = ${P.spread.toFixed(4)}*mix(0.042, 1., clamp(unfurl, 0., 1.));
  float inside = step(0., t)*step(9., rho)*(1. - smoothstep(${(P.rim - 6).toFixed(1)}, ${P.rim.toFixed(1)}, rho))*(1. - smoothstep(halfA, halfA + 0.01, abs(ang)));
  float a = fract((ang/max(halfA, 1e-3)*0.5 + 0.5)*${(P.nRibs - 1).toFixed(1)});
  return inside*mix(0.42, 0.85, smoothstep(0.42, 0.58, a));
}`;
}

// ---------------------------------------------------------------- buildHero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('great-fan') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const arr = (c) => [c.r, c.g, c.b];
  const C = { slate: arr(pal[0]), teal: arr(pal[1]), indigo: arr(pal[2]), gold: arr(pal[3]), lemon: arr(pal[4]), white: arr(pal[5]), rose: arr(pal[6]) };
  C.bone = mix3(C.lemon, C.white, 0.5);

  // ---- per-seed character
  const nRibs = rng.pick([57, 61, 61, 65]);
  const kSp = rng.range(18.5, 22);
  const P = {
    nRibs, spread: THREE.MathUtils.degToRad(rng.range(82, 87)), depth: rng.range(2.3, 3.0),
    rim: 117, scallop: rng.range(4.2, 7), veins: rng.pick([3, 4, 4, 5]), rings: rng.range(9, 14),
    eyeEvery: rng.pick([1, 1, 2, 3]), eyeRho: rng.range(93, 100),
    knuckles: [1, 2, 3, 4, 5].map((k) => R_ROOT + k * kSp).filter((r) => r < 110), spatW: rng.range(1.35, 1.8),
    bodyLen: rng.range(86, 95), bodyW: rng.range(0.93, 1.07), footX: rng.range(44, 50), footZ: rng.range(27, 33),
    headX: rng.range(38, 42), headZ: rng.range(43, 48), headLen: rng.range(9.6, 10.6), headYaw: rng.range(0.25, 0.45),
    bosses: rng.pick([9, 11, 13]), plates: rng.int(8, 12), crest: rng.pick([5, 7]), flex: rng.range(0.004, 0.0075), wind: rng.range(0.8, 1.25),
    noiseSeed: rng.range(0, 50), pleatSeeds: [],
  };
  for (let i = 0; i < nRibs - 1; i++) P.pleatSeeds.push(rng());

  // ---- uniforms shared by every material
  const sunLocal = new THREE.Vector3(-0.890, 0.191, -0.415);
  if (opts.sunDir) sunLocal.copy(opts.sunDir);
  sunLocal.normalize();
  const col = (v, d) => (v ? new THREE.Color(v) : d);
  const U = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uUnfurl: { value: 1 }, uTime: { value: 0 }, uSpread: { value: P.spread }, uNR: { value: nRibs - 1 }, uFlex: { value: P.flex },
    uStripe: { value: new THREE.Vector2(-1e4, 60) }, uDepth: { value: P.depth }, uRim: { value: P.rim }, uScallop: { value: P.scallop },
    uWind: { value: P.wind }, uVeins: { value: P.veins }, uRings: { value: P.rings }, uEyeEvery: { value: P.eyeEvery }, uEyeRho: { value: P.eyeRho },
    uGlow: { value: opts.glow ?? 0.8 }, uThroat: { value: 1 }, uHideGain: { value: opts.hideGain ?? 2.9 }, uElder: { value: 0 },
    uBounce: { value: col(opts.bounceColor, pal[4].clone().multiplyScalar(0.3)) },
    uSunDir: { value: sunLocal.clone() },
    uSunCol: { value: col(opts.sunColor, new THREE.Color(2.0, 1.74, 1.24)) },
    uSkyCol: { value: col(opts.skyColor, pal[4].clone().multiplyScalar(0.55)) },
    uGndCol: { value: col(opts.groundColor, new THREE.Color('#3A4763').multiplyScalar(0.9)) },
    uSlate: { value: pal[0] }, uTeal: { value: pal[1] }, uIndigo: { value: pal[2] }, uGold: { value: pal[3] },
    uLemon: { value: pal[4] }, uRose: { value: pal[6] }, uBone: { value: pal[4].clone().lerp(pal[5], 0.5) },
    uLook0: { value: new THREE.Vector3(0, 0, 1) }, uLook1: { value: new THREE.Vector3(0, 0, 1) },
  }]);

  const object = new THREE.Group(); object.name = 'great-fan';

  // ---- the fan
  const ribs = new THREE.Mesh(buildRibGeometry(P), buildRibMaterial(U)); ribs.frustumCulled = false; object.add(ribs);
  await ctx.yield?.();
  const membrane = new THREE.Mesh(buildMembraneGeometry(P), buildMembraneMaterial(U)); membrane.frustumCulled = false; object.add(membrane);
  await ctx.yield?.();

  // ---- the animal
  const G = await buildAnimal(ctx, P, C);
  await ctx.yield?.();
  const head = buildNeckHead(ctx, P, C, G);
  await ctx.yield?.();
  const bodyGeo = await accToGeometry(G, async () => { await ctx.yield?.(); });
  await ctx.yield?.();
  const body = new THREE.Mesh(bodyGeo, buildBodyMaterial(U)); object.add(body);
  await ctx.yield?.();
  const eyes = new THREE.Mesh(buildEyeGeometry(head.eyes), buildEyeMaterial(U)); object.add(eyes);
  const flakes = buildFlakes(rng, U, Math.round(320 * detail)); object.add(flakes);
  // every material shares one uniforms object so one write moves them all
  for (const m of [ribs, membrane, body, eyes, flakes]) m.material.uniforms = U;

  // ---- state
  let driven = opts.autoplay === false, unfurl = driven ? 0 : 1, stripeX = -1e4, stripeW = 120, throat = 1;
  let sunWorldOverride = null;
  const tmpQ = new THREE.Quaternion(), camL = new THREE.Vector3(), d = new THREE.Vector3(), perp = new THREE.Vector3();
  const looks = [U.uLook0.value, U.uLook1.value];
  head.eyes.forEach((e, i) => looks[i].copy(e.n));
  const CONE = Math.cos(THREE.MathUtils.degToRad(52)), SINC = Math.sqrt(1 - CONE * CONE);
  // The throat and the two looks are eases carried from call to call by the clock's own step: at a step of 0 nothing eases.
  // update() puts each ON its target instead of easing it until the clock has first stepped for it (the build's calls and
  // the first call after them), and when the place has jumped: unfurl, or the lens's place in the animal's space, further
  // from where the last call had it (unfurlWas, camWas) than a flight carries it in one step.
  let stepped = false, looked = false, unfurlWas = unfurl;
  const camWas = new THREE.Vector3();

  const hero = {
    object, radius: 128, height: 153, center: new THREE.Vector3(0, 62, 0), ground: true, groundY: 0,
    uniforms: U, params: P, shadowGLSL: makeShadowGLSL(P),
    anchors: {
      portalSeat: { position: new THREE.Vector3(0, HUB_Y, 0), normal: new THREE.Vector3(0, 0, 1), radius: 7 },
      hub: new THREE.Vector3(0, HUB_Y, 0),
      flyThrough: [[0, 8, 216], [0, 8.5, 170], [0, 14, 128], [0, 26, 92], [0, 30, 80], [0, 30, 40], [0, 30, 0]].map((p) => new THREE.Vector3(...p)),
      head: new THREE.Vector3(P.headX, 2.2, P.headZ + 3),
      eye: head.eyes[0].c.clone(),
      mastTop: new THREE.Vector3(0, 153, 0),
      viewpoints: {
        front: new THREE.Vector3(0, 8, 216), frontHigh: new THREE.Vector3(-60, 70, 260),
        sunSide: new THREE.Vector3(-190, 40, 150), back: new THREE.Vector3(120, 50, -230),
      },
      footprints: [[0, -P.bodyLen * 0.45, 62], [P.footX, P.footZ + 2, 14], [-P.footX, P.footZ + 2, 14], [0, -P.bodyLen - 26, 13], [P.headX * 0.7, P.headZ * 0.65, 22], [P.headX - 1, P.headZ + 5, 9]],
      sunDir: sunLocal.clone(),
    },
    setUnfurl(x) { driven = true; unfurl = clamp(x, 0, 1); },
    setStripe(x, w = 120) { driven = true; stripeX = x; stripeW = w; },
    setProgress(u) {
      driven = true;
      unfurl = clamp((u - 0.70) / 0.14, 0, 1);
      stripeX = u > 0.868 && u < 0.932 ? lerp(-200, 200, (u - 0.87) / 0.06) : -1e4; stripeW = 120;
    },
    setSun(dirWorld, color) { sunWorldOverride = (sunWorldOverride || new THREE.Vector3()).copy(dirWorld).normalize(); if (color) U.uSunCol.value.copy(color); },
    setBounce(c) { if (c) U.uBounce.value.copy(c); },
    setFill(sky, ground) { if (sky) U.uSkyCol.value.copy(sky); if (ground) U.uGndCol.value.copy(ground); },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (!driven) {                                    // demo loop on the clock until the world takes over
        const ph = ((time % 44) + 44) % 44;
        unfurl = ph < 4 ? 0 : ph < 12 ? (ph - 4) / 8 : ph < 36 ? 1 : ph < 42 ? 1 - (ph - 36) / 6 : 0;
        stripeX = ph > 19 && ph < 27 ? lerp(-200, 200, (ph - 19.5) / 7) : -1e4;
      }
      U.uUnfurl.value = unfurl;
      U.uStripe.value.set(stripeX, stripeW * 0.5);
      const k = 1 - Math.exp(-Math.min(dt, 0.1) * 2.5), throatTo = smoothstep(0.3, 1, unfurl);
      // a jump of place: unfurl over 0.2 from the last call's (a flight hurried to the portal at the fastest Pace, 12.5 times the world's own, moves it 0.1 in a step of 0.05 s)
      if (!stepped || Math.abs(unfurl - unfurlWas) > 0.2) throat = throatTo;
      else if (dt > 0) throat += (throatTo - throat) * k;
      unfurlWas = unfurl; if (dt > 0) stepped = true;
      U.uThroat.value = throat;
      object.updateWorldMatrix(true, false);
      if (sunWorldOverride) U.uSunDir.value.copy(sunWorldOverride);
      else U.uSunDir.value.copy(sunLocal).applyQuaternion(object.getWorldQuaternion(tmpQ)).normalize();
      if (camera) {                                     // both eyes follow the camera, inside a 52 degree cone
        camL.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(camL);
        const ke = 1 - Math.exp(-Math.min(dt, 0.1) * 4);
        // a jump of place: the lens over 140 from the last call's (the world's own measure for its ground eye; a flight hurried to the portal at the fastest Pace, 12.5 times the world's own, moves it 18.5 in a step of 0.05 s)
        const land = !looked || camL.distanceToSquared(camWas) > 140 * 140;
        camWas.copy(camL); if (dt > 0) looked = true;
        head.eyes.forEach((e, i) => {
          d.copy(camL).sub(e.c); if (d.lengthSq() < 1e-6) d.copy(e.n); d.normalize();
          const c = d.dot(e.n);
          if (c < CONE) {
            perp.copy(d).addScaledVector(e.n, -c);
            if (perp.lengthSq() < 1e-8) perp.set(0, 1, 0).addScaledVector(e.n, -e.n.y);
            perp.normalize(); d.copy(e.n).multiplyScalar(CONE).addScaledVector(perp, SINC);
          }
          if (land) looks[i].copy(d).normalize();
          else if (dt > 0) looks[i].lerp(d, ke).normalize();
        });
      }
    },
    dispose() {},
  };
  hero.update(0, 0, null);
  return hero;
}

// ---------------------------------------------------------------- the elders
// An elder is the Great Fan's own kind at a third to under half its size: the same keeled ribs, pleats, veins,
// growth rings, ocelli and gold reverse (the hero's materials, so no new shader program), on a lighter mesh
// (about 8k triangles, 3 draw calls). The world stands a few of them in the ranks along the flight.
//   const e = await buildElder(ctx, hero, { seed, scale });   e.object (Group; set position / rotation.y), e.height
//   e.setUnfurl(x), e.setStripe(xLocal, widthLocal)  as the hero's; e.params.spread / nRibs for a shadow term.
// Colours, sun, fill and fog are the hero's own uniform objects, so hero.setSun / setFill reach the elders too.
export async function buildElder(ctx, hero, opts = {}) {
  const rng = makeRng(((ctx.seed | 0) * 7919 + 4099 * ((opts.seed | 0) + 1)) >>> 0);
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const arr = (c) => [c.r, c.g, c.b];
  const C = { slate: arr(pal[0]), teal: arr(pal[1]), indigo: arr(pal[2]), gold: arr(pal[3]), lemon: arr(pal[4]), white: arr(pal[5]), rose: arr(pal[6]) };
  C.bone = mix3(C.lemon, C.white, 0.5);
  const nRibs = rng.pick([23, 25, 25, 27]);
  const P = {
    nRibs, spread: THREE.MathUtils.degToRad(rng.range(79, 85)), depth: rng.range(3.6, 4.6),
    rim: 117, scallop: rng.range(9, 13), veins: rng.pick([5, 6, 7]), rings: rng.range(9, 13),
    eyeEvery: rng.pick([1, 1, 2]), eyeRho: rng.range(88, 95),
    knuckles: [1, 2].map((k) => R_ROOT + k * rng.range(33, 37)), spatW: rng.range(2.8, 3.6),
    bodyLen: rng.range(68, 78), bodyW: rng.range(0.95, 1.1), footX: rng.range(40, 46), footZ: rng.range(26, 31),
    headX: rng.range(36, 40), headZ: rng.range(40, 45), headLen: rng.range(13, 15), headYaw: rng.range(0.25, 0.45),
    bosses: 5, plates: rng.int(5, 7), crest: 5, flex: rng.range(0.006, 0.01), wind: rng.range(0.9, 1.35),
    noiseSeed: rng.range(0, 50), pleatSeeds: [],
  };
  for (let i = 0; i < nRibs - 1; i++) P.pleatSeeds.push(rng());
  const HU = hero.uniforms;
  const U = Object.assign({}, HU, {
    uUnfurl: { value: 1 }, uSpread: { value: P.spread }, uNR: { value: nRibs - 1 }, uFlex: { value: P.flex },
    uStripe: { value: new THREE.Vector2(-1e4, 60) }, uDepth: { value: P.depth }, uRim: { value: P.rim }, uScallop: { value: P.scallop },
    uWind: { value: P.wind }, uVeins: { value: P.veins }, uRings: { value: P.rings }, uEyeEvery: { value: P.eyeEvery }, uEyeRho: { value: P.eyeRho },
    uThroat: { value: 1 }, uHideGain: { value: (HU.uHideGain?.value ?? 2.9) * 0.72 }, uElder: { value: 1 },   // an elder: live's lift, 0.72 of the Great Fan's, on its bone; on its bare hide the body shader raises it to 0.93 of the Great Fan's (uElder 1), M8's lift, not set again for the equal parts: under each hour's key the bare hide then returns the luma live's grey hide returned to within about a point (a little under it in the teal livery, a little over it under the evening's key in the crimson), with less green and red and over twice the blue in the teal livery
  });
  const object = new THREE.Group(); object.name = 'elder';
  const ribs = new THREE.Mesh(buildRibGeometry(P, true), buildRibMaterial(U)); object.add(ribs);
  const membrane = new THREE.Mesh(buildMembraneGeometry(P, 2, 9), buildMembraneMaterial(U)); object.add(membrane);
  await ctx.yield?.();
  const G = await buildAnimal(ctx, P, C, opts.lod ?? 0.34);
  await ctx.yield?.();
  buildNeckHead(ctx, P, C, G);
  await ctx.yield?.();
  const body = new THREE.Mesh(await accToGeometry(G), buildBodyMaterial(U)); object.add(body);
  for (const m of [ribs, membrane, body]) m.material.uniforms = U;
  const s = opts.scale ?? 0.4;
  object.scale.setScalar(s);
  return {
    object, uniforms: U, params: P, scale: s, height: 153 * s, hubY: HUB_Y * s, clear: 58 * s,
    setUnfurl(x) { U.uUnfurl.value = clamp(x, 0, 1); },
    setStripe(x, w = 120) { U.uStripe.value.set(x, w * 0.5); },
  };
}
