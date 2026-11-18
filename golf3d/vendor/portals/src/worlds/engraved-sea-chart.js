// THE ENGRAVED SEA: a hand-coloured copperplate sea chart sailed from a galleon's bowsprit.
// Styled world: every surface is drawn by ENGRAVE_GLSL from src/parts/engraved-sea-chart.js (vellum, sepia
// line that follows form, flat washes, gold leaf as the only emissive). No three.js lights, style 'none'.
// World space == the serpent's local space (hero at the origin, unrotated): the ship enters at z = +252
// sailing toward -Z, starboard is +X. Journey seconds T = u * 42; every staged beat is keyed to T.
//
// MAP OF THIS FILE (in order)
//   1. SEA_GLSL + makeSeaJS   four travelling swells, the calm round the exit ring and the "last great swell"
//                             (uHill); the same function in GLSL (seaHG / heroSea) and in JS (heightAt).
//   2. makePen                merged-geometry pen (tube, grid, lathe, blob) writing position/normal/aHatch/aM.
//                             aM = (wash select, wash amount, tone bias, flutter weight). Select: 0 paper,
//                             1 verdigris, 2 rose, 3 aged vellum, 4 gold leaf (emissive), 5 solid ink, 6 gilt wash.
//   3. eMat                   THE material: engraved fill or inverted-hull outline for any mesh, with optional
//                             vertex code (sea-riding decals, islands rising, drifting clouds, cloth flutter).
//   4. PLATES                 the seeded states of the plate (hand-coloured, first proof, sanguine, night).
//   5. build(ctx)
//        a. SEEDED MOODS: plate (PLATE_CYCLE[seed % 7], so neighbouring seeds differ and hand-coloured is 2 in 7;
//           ctx.vary.hour: night -> night plate, golden -> sanguine), weather (calm | fair | gale: swell height,
//           fog, rain curtains, ticks), cast (galleon | caravel | oared galley; the hero picks its own head, spouts
//           and fin wash from the seed); ctx.vary.rare -> the whale island opens an eye, spouts and sinks (X.uWhale)
//        b. path (hero.anchors.course), fog, uniforms            <- PATH, FOG are set here
//        c. HERO PLACEMENT (origin, unrotated; the path is hero.anchors.course) and its hooks
//           POIS are at the very end, in the returned object
//        d. dome, neatline, clouds (heaps of domed lobes on a flat ruled base: lobe(), cumulus()), rain banks, curtains
//        e. sea, compass roses, rhumb threads, exit ring, ripples, glyphs, curl ticks
//        f. second ship, gulls, flying fish, dolphins
//        g. coast: burin line, burin, molehill islands, sprigs, swarf, the rare whale island
//        h. bow rig (the world's own ride; the figurehead's mane of curled locks), spray, camera rain
//        i. archSurge/archLean, update(), then return: pois (second ship, UP INTO THE ARCH at 16.5-19 s, the
//           serpent's head, the portal), portal, post (EXPOSURE, BLOOM, GRADE), dispose()
//
// UNIFORMS THAT DRIVE THE SCRIPTED MOMENTS (all set in update() from u)
//   X.uT            journey seconds (flying fish launches, swarf, splash rings)
//   SEA.uHill.z     height of the last great swell under the ship (31-38 s)
//   X.uBurin        metres along the course the burin has cut (24.4-32.5 s, see burinT/burinD): coast line, the
//                   twenty molehill islands (they stand up behind it), sprigs, island waterlines; a waterline ring
//                   (burinRipple) and swarf follow its tip
//   X.uWhale        rare event: the whale island's eyelid lifts, it spouts and sinks (0..1, see isleMatO)
//   hero.setProgress / setPacing   the rise (7-13 s); the pose switches to pacing at 24.4-25 s (behind the beam),
//                   the lead coil is on the starboard bow by 25.5 s, paces us 38 m off, pulls ahead (to 30 s,
//                   `travel`) and sounds at 35-38.2 s
//   hero.setSurge   archSurge(u), archLean(u): at 15-20 s the middle arch slides up to 24 m down the course with
//                   the ship and leans 20 m over the bow, so u 0.40-0.46 looks up into its belly (THE image);
//                   X.uGloom darkens the sea under it; it is back at rest (behind us) by u 0.58
//   uRainAmt        line-rain round the lens (near the rain foot at the origin and under the arch; always on in a
//                   gale); uRainThick makes the strokes long and heavy under the arch (17-20 s)
//   rig             the bow rig follows the camera passed to update(): yaw between course and gaze, pitch from
//                   the gaze (less of it when the gaze lifts under the arch) plus the swell under the stem
//                   (heightAt), and it drops 4-9 degrees on the dive (u 0.745-0.97) so the spar stays under the ring
//   oarBanks        the galley's sweeps (a shear matrix per bank), needles (compass needles swing)
//   ship.position   the second ship (0-12 s), gullC (gull flock centre: ship, then the serpent's head)
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, ENGRAVE_GLSL, FOG_FRAG, PALETTE } from '../parts/engraved-sea-chart.js';

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;

// ------------------------------------------------------------------------------------------------
// 1. The sea, once in GLSL and once in JS. Waves: dir.x, dir.z, wavenumber, angular speed.
// ------------------------------------------------------------------------------------------------
const WAVES = [[0.342, 0.94, 0.0698, 0.55], [-0.6, 0.8, 0.17, 0.9], [0.9, -0.436, 0.31, 1.3], [0.2, -0.98, 0.53, 1.7]];
const SEA_GLSL = /* glsl */`
uniform float uSeaT; uniform vec4 uSeaA; uniform vec4 uHill; uniform vec4 uRingP;
vec3 seaHG(vec2 p){
  float calm = mix(.3, 1., smoothstep(25., 100., length(p-uRingP.xy)));
  vec3 r = vec3(0.); float a;
  a = dot(p, vec2(.342, .94))*.0698-uSeaT*.55; r += uSeaA.x*vec3(sin(a), cos(a)*.0698*vec2(.342, .94));
  a = dot(p, vec2(-.6, .8))*.17-uSeaT*.9;      r += uSeaA.y*vec3(sin(a), cos(a)*.17*vec2(-.6, .8));
  a = dot(p, vec2(.9, -.436))*.31-uSeaT*1.3;   r += uSeaA.z*vec3(sin(a), cos(a)*.31*vec2(.9, -.436));
  a = dot(p, vec2(.2, -.98))*.53-uSeaT*1.7;    r += uSeaA.w*vec3(sin(a), cos(a)*.53*vec2(.2, -.98));
  r *= calm;
  vec2 q = p-uHill.xy, hd = uRingP.zw; float s = dot(q, hd), l = dot(q, vec2(-hd.y, hd.x));
  float ks = s < 0. ? 3.14159/120. : 3.14159/53.;
  float as = min(abs(s)*ks, 3.14159), al = min(abs(l)*3.14159/130., 3.14159);
  float ps = .5+.5*cos(as), pl = .5+.5*cos(al);
  float dps = -.5*sin(as)*ks*sign(s), dpl = -.5*sin(al)*3.14159/130.*sign(l);
  r.x += uHill.z*ps*pl;
  r.yz += uHill.z*(dps*pl*hd+ps*dpl*vec2(-hd.y, hd.x));
  return r;
}
float heroSea(vec2 p){ return seaHG(p).x; }
`;
function makeSeaJS(SEA) {
  return (x, z, wavesOnly) => {
    const A = SEA.uSeaA.value, t = SEA.uSeaT.value, R = SEA.uRingP.value, Hh = SEA.uHill.value;
    const calm = lerp(0.3, 1, sstep(25, 100, Math.hypot(x - R.x, z - R.y)));
    let h = 0; const amp = [A.x, A.y, A.z, A.w];
    for (let i = 0; i < 4; i++) { const w = WAVES[i]; h += amp[i] * Math.sin((x * w[0] + z * w[1]) * w[2] - t * w[3]); }
    const qx = x - Hh.x, qz = z - Hh.y, s = qx * R.z + qz * R.w, l = -qx * R.w + qz * R.z;
    const ps = 0.5 + 0.5 * Math.cos(Math.min(Math.abs(s) * Math.PI / (s < 0 ? 120 : 53), Math.PI));
    const pl = 0.5 + 0.5 * Math.cos(Math.min(Math.abs(l) * Math.PI / 130, Math.PI));
    return wavesOnly ? h * calm : h * calm + Hh.z * ps * pl;
  };
}

// ------------------------------------------------------------------------------------------------
// 2. Geometry pen. Hatch coordinates are metres: lines are drawn along constant aHatch.x.
// ------------------------------------------------------------------------------------------------
function makePen() {
  const P = [], N = [], H = [], M = [], I = [], E = [];
  const v3 = new THREE.Vector3(), n3 = new THREE.Vector3();
  const pen = { m: [0, 0.3, 0, 0], mat: new THREE.Matrix4(), nm: new THREE.Matrix3(), extra: 0 };
  pen.xf = (m) => { if (m) pen.mat.copy(m); else pen.mat.identity(); pen.nm.getNormalMatrix(pen.mat); return pen; };
  pen.set = (sel, amt = 0.3, tone = 0, w = 0) => { pen.m = [sel, amt, tone, w]; return pen; };
  pen.v = (x, y, z, nx, ny, nz, hx, hy, w) => {
    v3.set(x, y, z).applyMatrix4(pen.mat); n3.set(nx, ny, nz).applyMatrix3(pen.nm);
    const l = n3.length(); if (l > 1e-9) n3.multiplyScalar(1 / l); else n3.set(0, 1, 0);
    P.push(v3.x, v3.y, v3.z); N.push(n3.x, n3.y, n3.z); H.push(hx, hy); M.push(pen.m[0], pen.m[1], pen.m[2], w ?? pen.m[3]); E.push(pen.extra);
    return P.length / 3 - 1;
  };
  pen.tri = (a, b, c) => { I.push(a, b, c); };
  pen.quad = (a, b, c, d) => { I.push(a, b, c, a, c, d); };
  // parametric surface f(u, v, out[3]); hs = hatch metres per unit u, v; wf(u, v) = flutter weight
  pen.grid = (nu, nv, f, hs = [1, 1], wf = null, swapH = false) => {
    const o = [0, 0, 0], a = [0, 0, 0], b = [0, 0, 0], base = P.length / 3, e = 2e-3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = i / nu, v = j / nv;
      f(u, v, o); f(u + e, v, a); f(u, v + e, b);
      const ax = a[0] - o[0], ay = a[1] - o[1], az = a[2] - o[2], bx = b[0] - o[0], by = b[1] - o[1], bz = b[2] - o[2];
      const hx = swapH ? v * hs[1] : u * hs[0], hy = swapH ? u * hs[0] : v * hs[1];
      pen.v(o[0], o[1], o[2], ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx, hx, hy, wf ? wf(u, v) : undefined);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const q = base + j * (nu + 1) + i; pen.quad(q, q + 1, q + nu + 2, q + nu + 1); }
    return pen;
  };
  // tube through points [[x,y,z],...]; rad = number or f(t); hatch lines run ALONG the tube unless rings is true
  pen.tube = (pts, rad, seg = 8, rings = false, capEnds = true) => {
    const n = pts.length, T = new THREE.Vector3(), U = new THREE.Vector3(0, 1, 0), B = new THREE.Vector3(), Nn = new THREE.Vector3();
    const base = P.length / 3; let len = 0;
    for (let i = 0; i < n; i++) {
      const p = pts[i], q0 = pts[Math.max(0, i - 1)], q1 = pts[Math.min(n - 1, i + 1)];
      T.set(q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]).normalize();
      if (i === 0) { U.set(0, 1, 0); if (Math.abs(T.y) > 0.9) U.set(1, 0, 0); }
      B.crossVectors(T, U).normalize(); Nn.crossVectors(B, T).normalize(); U.copy(Nn);
      if (i > 0) len += Math.hypot(p[0] - q0[0], p[1] - q0[1], p[2] - q0[2]);
      const r = typeof rad === 'function' ? rad(i / (n - 1)) : rad;
      for (let k = 0; k <= seg; k++) {
        const a = (k / seg) * TAU, c = Math.cos(a), s = Math.sin(a);
        const nx = B.x * c + Nn.x * s, ny = B.y * c + Nn.y * s, nz = B.z * c + Nn.z * s;
        const around = (k / seg) * TAU * Math.max(r, 0.05);
        pen.v(p[0] + nx * r, p[1] + ny * r, p[2] + nz * r, nx, ny, nz, rings ? len : around, rings ? around : len);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < seg; k++) { const q = base + i * (seg + 1) + k; pen.quad(q, q + seg + 1, q + seg + 2, q + 1); }
    if (capEnds) for (const end of [0, n - 1]) {
      const p = pts[end], q = pts[end === 0 ? 1 : n - 2];
      const c = pen.v(p[0], p[1], p[2], p[0] - q[0], p[1] - q[1], p[2] - q[2], 0, 0);
      for (let k = 0; k < seg; k++) { const r0 = base + end * (seg + 1) + k; if (end === 0) pen.tri(c, r0, r0 + 1); else pen.tri(c, r0 + 1, r0); }
    }
    return pen;
  };
  // lathe about +Y: profile [[r, y], ...] bottom to top; hatch runs down the slope (hachures) unless rings
  pen.lathe = (prof, seg = 16, rings = false, wob = null) => pen.grid(seg, prof.length - 1, (u, v, o) => {
    const x = Math.min(prof.length - 1.001, Math.max(0, v * (prof.length - 1))), i = Math.floor(x), f = x - i;
    const r = (prof[i][0] + (prof[i + 1][0] - prof[i][0]) * f) * (wob ? wob(u, v) : 1), y = prof[i][1] + (prof[i + 1][1] - prof[i][1]) * f;
    const a = -u * TAU; o[0] = Math.cos(a) * r; o[1] = y; o[2] = Math.sin(a) * r;
  }, rings ? [1, prof[prof.length - 1][1] - prof[0][1] || 1] : [TAU * Math.max(...prof.map((q) => q[0])) * 0.7, 1], null, rings);
  // lumpy ellipsoid; hatch is ruled level (world height)
  pen.blob = (cx, cy, cz, rx, ry, rz, detail, noise, amp = 0.18, flat = -2) => {
    const g = new THREE.IcosahedronGeometry(1, detail), a = g.attributes.position.array, base = P.length / 3;
    for (let i = 0; i < a.length; i += 3) {
      let x = a[i], y = a[i + 1], z = a[i + 2];
      const k = 1 + amp * (noise ? noise.n3(x * 1.7 + cx * 0.1, y * 1.7 + cy * 0.1, z * 1.7 + cz * 0.1) : 0);
      let yy = y * k; if (yy < flat) yy = flat + (yy - flat) * 0.2;
      pen.v(cx + x * k * rx, cy + yy * ry, cz + z * k * rz, x / rx, (yy < flat + 0.01 ? -3 : y) / ry, z / rz, cy + yy * ry, Math.atan2(z, x) * (rx + rz) * 0.5);
    }
    for (let i = 0; i < a.length / 3; i += 3) pen.tri(base + i, base + i + 1, base + i + 2);
    g.dispose(); return pen;
  };
  pen.count = () => I.length / 3;
  pen.build = (withExtra = false) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('aHatch', new THREE.Float32BufferAttribute(H, 2)); g.setAttribute('aM', new THREE.Float32BufferAttribute(M, 4));
    if (withExtra) g.setAttribute('aE', new THREE.Float32BufferAttribute(E, 1));
    g.setIndex(I); g.computeBoundingSphere();
    return g;
  };
  return pen;
}

// ------------------------------------------------------------------------------------------------
// 3. The material. U = the hero's shared style uniforms, X = this world's shared uniforms.
//    o.vBody may set wp (vec4 world position), wn (world normal) and hh (hatch) from p, n.
//    o.fBody may change tone, edge, washAmt, sel, alpha, h, w.
// ------------------------------------------------------------------------------------------------
function eMat(U, X, o = {}) {
  const outline = !!o.outline;
  const uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...X, uPxW: { value: o.px ?? 2.2 }, ...(o.uniforms || {}) };
  const vBody = o.vBody || 'wp = modelMatrix*vec4(p, 1.); wn = normalize(mat3(modelMatrix)*n);';
  const vertexShader = /* glsl */`
    attribute vec2 aHatch; attribute vec4 aM;
    uniform float uTime, uResY, uPxW, uT; uniform vec3 uKey;
    varying vec3 vWP, vWN; varying vec2 vH; varying vec4 vM;
    #include <fog_pars_vertex>
    ${SEA_GLSL}
    ${o.vHead || ''}
    void main(){
      vec3 p = position, n = normal; vec4 wp; vec3 wn; vec2 hh = aHatch;
      ${vBody}
      ${outline ? `float dpt = max(-(viewMatrix*wp).z, .1);
      wp.xyz += wn*min(dpt*2./(projectionMatrix[1][1]*uResY)*uPxW*(1.+.7*clamp(-dot(wn, uKey), 0., 1.)), ${o.maxW || '.5'});` : ''}
      vWP = wp.xyz; vWN = wn; vH = hh; vM = aM;
      vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
      #include <fog_vertex>
    }`;
  const fragmentShader = outline ? /* glsl */`
    uniform vec3 uPaper, uInk, uInkFar;
    ${FOG_FRAG}
    void main(){
      float f = eFog();
      vec3 ink = mix(uInk, uInkFar, smoothstep(0., .5, f));
      gl_FragColor = vec4(mix(ink, eFogCol(), smoothstep(.3, 1., f)), 1.);
    }` : /* glsl */`
    ${ENGRAVE_GLSL}
    ${FOG_FRAG}
    uniform float uT;
    varying vec3 vWP, vWN; varying vec2 vH; varying vec4 vM;
    ${o.fHead || ''}
    void main(){
      vec2 h = vH; float w = fwidth(h.x);
      vec3 N = normalize(vWN+vec3(0., 1e-5, 0.)); if(!gl_FrontFacing) N = -N;
      float sel = vM.x, washAmt = vM.y, edge = 0., alpha = 1.;
      float tone = clamp(.86*smoothstep(.7, -.9, dot(N, uKey))+.12*smoothstep(.1, -.9, N.y)+vM.z, 0., 1.);
      float fog = eFog();
      ${o.fBody || ''}
      vec3 wash = sel < .5 ? uPaper : sel < 1.5 ? uWashA : sel < 2.5 ? uWashB : sel < 3.5 ? uAged : uGold;
      float gold = step(3.5, sel)*step(sel, 4.5);
      float cov = max(eInk(clamp(tone, 0., 1.), h, w), edge);
      cov = mix(cov, 1., step(4.5, sel)*step(sel, 5.5)*.94);
      vec3 col = eCompose(cov*(1.-.7*gold), wash, washAmt*(.8+.5*tone), fog, eFogCol(), eGrain(vWP-cameraPosition));
      float spark = .5+.5*smoothstep(.45, .8, eN2(vWP.xz*1.7+vWP.y*2.3+uTime*.9));
      col = mix(col, uGold*(.95+1.55*spark), gold*(1.-fog)*(1.-.8*cov));
      gl_FragColor = vec4(col, alpha);
    }`;
  const m = new THREE.ShaderMaterial({ fog: true, uniforms, vertexShader, fragmentShader, side: outline ? THREE.BackSide : (o.side ?? THREE.FrontSide) });
  if (o.decal) { m.blending = THREE.CustomBlending; m.blendSrc = THREE.SrcAlphaFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; m.depthTest = false; m.depthWrite = false; }
  if (o.transparent) { m.transparent = true; m.depthWrite = false; }
  return m;
}

// ------------------------------------------------------------------------------------------------
// 4. The states of the plate: [vellum, aged vellum, far ink, ink, wash A, wash B, gold leaf]
// ------------------------------------------------------------------------------------------------
const PLATE_CYCLE = ['proof', 'hand', 'sanguine', 'hand', 'sanguine', 'proof', 'night'];
const PLATES = {
  hand: { name: 'The Engraved Sea', pal: PALETTE, night: 0 },
  proof: { name: 'The Engraved Sea: First Proof', pal: ['#EFE7D2', '#D9CDAE', '#8E8676', '#1F1812', '#D6CBAE', '#CFC0A2', '#E2A93A'], night: 0 },
  sanguine: { name: 'The Engraved Sea: Sanguine', pal: ['#E8D3AC', '#D3B78C', '#B97F66', '#6E2418', '#DDAE86', '#C8687A', '#E2A93A'], night: 0 },
  night: { name: 'The Engraved Sea: Night Plate', pal: ['#1C2740', '#2B3760', '#6F7890', '#B9AF93', '#8FCDBE', '#E59AAE', '#E2A93A'], night: 1 },
};

// Ruled rain seen from afar: a slanted wall of falling strokes (the entry curtain, the bank behind the exit).
function curtainMat(U, X, o) {
  return new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...X, uDense: { value: o.dense }, uTint: { value: o.tint }, uNearFade: { value: o.nearFade } },
    vertexShader: /* glsl */`
      varying vec3 vWP; varying vec2 vUv;
      #include <fog_pars_vertex>
      void main(){ vec4 wp = modelMatrix*vec4(position, 1.); vWP = wp.xyz; vUv = uv;
        vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${ENGRAVE_GLSL}
      ${FOG_FRAG}
      uniform float uDense, uTint, uNearFade;
      varying vec3 vWP; varying vec2 vUv;
      void main(){
        float v = (vUv.x+vUv.y*.16)*uDense, w = fwidth(v);
        float edge = smoothstep(0., .22, vUv.x)*smoothstep(1., .78, vUv.x);
        float body = edge*smoothstep(1.02, .8, vUv.y)*(.75+.25*eN2(vec2(vUv.x*9., uTime*.15)));
        float tone = clamp(body*(.5+.4*eN2(vec2(vUv.x*5.+uTime*.05, vUv.y*2.))), 0., 1.);
        float cov = eLines(v, vUv.y*90.+uTime*8., w, tone);
        float foot = smoothstep(.0, .05, vUv.y);
        float f = eFog();
        float near = smoothstep(uNearFade*.35, uNearFade, distance(vWP, cameraPosition));
        vec3 ink = mix(uInk*1.5, uInkFar, smoothstep(0., .5, f));
        float tint = uTint*body*foot;
        float a = max(cov*foot, tint)*(1.-smoothstep(.55, 1., f))*near;
        vec3 col = mix(mix(uAged*.8, uWashA*.6, .5), ink, clamp(cov*foot/max(max(cov*foot, tint), 1e-3), 0., 1.));
        gl_FragColor = vec4(col, a);
      }`,
  });
}

export default {
  id: 'engraved-sea-chart',
  name: 'The Engraved Sea',
  category: 'ocean',
  weirdness: 0.45,
  media: ['water'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const detail = ctx.quality?.detail ?? 1;
    const density = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    const scene = new THREE.Scene();
    const disposables = [];

    // ---- 5a. seeded moods -------------------------------------------------------------------
    let plateId = rng.pick(['hand', 'sanguine', 'proof', 'hand', 'sanguine', 'hand', 'night', 'proof']);
    const weather = rng.pick(['fair', 'gale', 'calm', 'fair']);
    const shipKind = rng.pick(['galleon', 'caravel', 'galleon', 'galley']);
    // the plate follows a fixed cycle of seven so that neighbouring seeds never share one and hand-coloured is 2 in 7
    // (the draw above is kept so every later random draw is unchanged)
    if (Number.isFinite(Number(ctx.seed))) plateId = PLATE_CYCLE[Math.abs(Math.floor(Number(ctx.seed))) % 7];
    if (vary.hour === 'night') plateId = 'night';
    else if (vary.hour === 'golden') plateId = 'sanguine';
    else if (vary.hour === 'day' && plateId === 'night') plateId = 'hand';
    else if (vary.hour === 'dawn' && plateId === 'night') plateId = 'proof';
    const plate = PLATES[plateId], pal = plate.pal;
    const rare = !!vary.rare;
    const seaAmp = weather === 'calm' ? 0.44 : weather === 'gale' ? 1.42 : 1;
    const KEY = [-0.82, 0.5, 0.28];

    // ---- 5b. path, fog, shared uniforms -----------------------------------------------------
    const SEA = {
      uSeaT: { value: 0 }, uSeaA: { value: new THREE.Vector4(2.5, 0.55, 0.28, 0.14).multiplyScalar(seaAmp) },
      uHill: { value: new THREE.Vector4(0, 0, 0, 0) }, uRingP: { value: new THREE.Vector4(0, 0, 0.6428, -0.766) },
    };
    const heightAt = makeSeaJS(SEA);
    const hero = await buildHero(ctx, { palette: pal, keyDir: KEY, stage: false, seaGLSL: SEA_GLSL, seaUniforms: SEA });
    await ctx.yield();
    const course = hero.anchors.course, U = hero.style.uniforms;
    const DS = [0, 40, 80, 120, 160, 200, 240, 280, 300, 315, 330, 345, 360, 376.8, 395, 420, 440, 460, 480, 500, 512, 521, 532, 546, 560, 574, 588];
    const path = makePath(DS.map((d) => { const p = course(d); if (d === 521) p.y = 21.7; return p; }));
    const DUR = 42, LEN = path.length;
    const ringPos = course(588), hillC = course(522);
    SEA.uRingP.value.x = ringPos.x; SEA.uRingP.value.y = ringPos.z; SEA.uHill.value.x = hillC.x; SEA.uHill.value.y = hillC.z;
    const DIR2 = new THREE.Vector3(0.6428, 0, -0.766), LEFT2 = new THREE.Vector3(-0.766, 0, -0.6428);   // last straight and its port side
    const fogCol = new THREE.Color(pal[0]).multiplyScalar(0.94);
    scene.fog = new THREE.Fog(fogCol, weather === 'gale' ? 50 : weather === 'calm' ? 130 : 90, weather === 'gale' ? 820 : weather === 'calm' ? 1800 : 1350);
    const X = {
      ...SEA, uResY: { value: 900 }, uT: { value: 0 }, uBurin: { value: 0 }, uWhale: { value: 0 },
      uCam: { value: new THREE.Vector3() }, uNight: { value: plate.night },
      uGloom: { value: new THREE.Vector4(0, 0, 80, 0) },                       // x, z, radius, amount: the dark sea under the arch
    };
    const add = (geo, mat, order = 0, cull = false) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = cull; m.renderOrder = order; scene.add(m); return m; };
    const matFill = eMat(U, X, { side: THREE.DoubleSide,
      vBody: `float fl = aM.w; p += n*fl*(sin(uTime*2.3+aHatch.x*.9+aHatch.y*.5)*.6+sin(uTime*5.1+aHatch.y*1.7)*.25);
        wp = modelMatrix*vec4(p, 1.); wn = normalize(mat3(modelMatrix)*n);` });
    const matLine = eMat(U, X, { outline: true,
      vBody: `float fl = aM.w; p += n*fl*(sin(uTime*2.3+aHatch.x*.9+aHatch.y*.5)*.6+sin(uTime*5.1+aHatch.y*1.7)*.25);
        wp = modelMatrix*vec4(p, 1.); wn = normalize(mat3(modelMatrix)*n);` });

    // ---- 5c. the hero: the serpent stands at the origin, world space == its local space -----
    scene.add(hero.object);
    hero.setProgress(0);

    // ---- 5d. sky: vellum dome, neatline, clouds, rain -----------------------------------------
    const dome = add(new THREE.SphereGeometry(2400, 40, 24), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, depthTest: false,
      uniforms: { ...U, uNight: X.uNight, uCrease: { value: new THREE.Vector3(0.42, 0.55, -0.72).normalize() }, uMoon: { value: new THREE.Vector3(-0.5, 0.4, -0.77).normalize() } },
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
      fragmentShader: /* glsl */`
        ${ENGRAVE_GLSL}
        uniform float uNight; uniform vec3 uCrease, uMoon;
        varying vec3 vD;
        void main(){
          vec3 d = normalize(vD);
          float el = asin(clamp(d.y, -1., 1.));
          float v = el*el*sign(el)*240.+el*40., w = fwidth(v);
          vec2 q = d.xz/(1.+abs(d.y))*16.; vec2 wq = fwidth(q); float fq = max(wq.x, wq.y)+1e-5;
          float md = distance(d, uMoon), fm = fwidth(md)+1e-5;
          float tone = smoothstep(.07, 1.1, el)*.34;
          float cov = eLines(v, atan(d.z, d.x+1e-5)*200., w, tone)*.75;
          float fox = smoothstep(.7, .8, eN3(d*13.))*.12+smoothstep(.78, .84, eN3(d*41.+7.))*.1;
          float cr = dot(d, uCrease);
          float fold = (1.-smoothstep(0., .01, abs(cr)))*.14+smoothstep(0., .03, cr)*(1.-smoothstep(.03, .5, cr))*.09;
          vec3 col = eCompose(cov, uAged, .1+fox+fold+.25*smoothstep(.4, -.1, el), 0., uPaper, eGrain(d));
          if(uNight > .5){
            vec2 c = floor(q); float hs = eHash2(c);
            vec2 f = q-c-.5-(vec2(eHash2(c+3.1), eHash2(c+7.7))-.5)*.55;
            float sz = .05+.07*hs;
            float lm = min(min(abs(f.x), abs(f.y)), min(abs(f.x+f.y), abs(f.x-f.y))*.707);
            float star = (1.-smoothstep(fq*.7, fq*1.7, lm))*(1.-smoothstep(sz, sz+fq, length(f)))*step(.66, hs)*smoothstep(.03, .14, d.y);
            star *= .65+.35*sin(uTime*2.+hs*40.);
            float disc = 1.-smoothstep(.085-fm, .085+fm, md);
            float cut = 1.-smoothstep(.085-fm, .085+fm, distance(d, normalize(uMoon+vec3(.05, .025, 0.))));
            float rule = smoothstep(.2, .32, abs(fract(dot(d, vec3(.25, 1., 0.))*80.)-.5));
            float rim = 1.-smoothstep(fm*1.2, fm*2.4, abs(md-.085));
            float cres = disc*(1.-cut)*(.55+.45*rule);
            col = mix(col, uInk*1.5, max(max(star, cres), rim*.5*(1.-cut)));
          }
          gl_FragColor = vec4(col, 1.);
        }` }), -1);
    const neat = add(new THREE.CylinderGeometry(1800, 1800, 40, 200, 1, true), new THREE.ShaderMaterial({
      side: THREE.BackSide, uniforms: { ...U },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
      fragmentShader: /* glsl */`
        uniform vec3 uPaper, uInk, uInkFar;
        varying vec2 vUv;
        void main(){
          float deg = vUv.x*360., wd = fwidth(deg)+1e-5, y = vUv.y;
          float blk = smoothstep(.25-wd*.25, .25+wd*.25, abs(fract(deg*.25)-.5));
          float tick = 1.-smoothstep(.1, .1+wd, abs(fract(deg)-.5));
          float cov = y < .1 ? 1. : y < .52 ? blk : y < .6 ? 1. : y < .9 ? tick : 1.;
          vec3 ink = mix(uInk*1.5, uInkFar, .5);
          gl_FragColor = vec4(mix(mix(uPaper*.9, ink, cov), uPaper*.94, .3), 1.);
        }` }), -0.9);
    neat.position.set(60, 19, -20);
    await ctx.yield();

    // clouds: nine drifting cumulus with ruled undersides, the dark rain cloud ahead, the bank behind the exit
    // Each is a heap of domed lobes standing on one flat base: bare paper above, scalloped outline, and an underside
    // ruled with straight parallel lines (aHatch.y = metres across the line of sight from the middle of the chart).
    const cloudVB = `wp = modelMatrix*vec4(p, 1.); wn = normalize(mat3(modelMatrix)*n);
      wp.xyz += wn*(1.2*sin(uTime*.35+aM.w*3.+p.x*.03+p.y*.05)); wp.x += uTime*aM.w*.9; hh.x = wp.y*.42;`;
    const matCloud = eMat(U, X, { vBody: cloudVB,
      fBody: `float under = step(N.y, -.5); float hu = vH.y*.3, wu = fwidth(hu);
        h = mix(h, vec2(hu, (vWP.x-uTime*vM.w*.9)*.7+vWP.z*.7), under); w = mix(w, wu, under);
        float lee = smoothstep(.4, -.8, dot(N, uKey));
        tone = clamp(mix(.04+.5*smoothstep(.25, -.6, N.y)+.3*lee, .4+.08*lee, under)+vM.z, 0., 1.); washAmt = vM.y*(1.-smoothstep(.2, .7, fog));` });
    const matCloudLine = eMat(U, X, { outline: true, vBody: cloudVB, px: 2.0, maxW: '3.' });
    // (written straight into typed arrays of a known size, a lobe at a time, so no build step is long)
    const crng = rng.fork('clouds'), icoTris = (det) => 8 * (det * 2) * (det * 2), ico = {};
    const unitSphere = (n) => {                 // an octahedron, each face split n x n and pushed out to the unit sphere (xyz per corner)
      const out = new Float32Array(8 * n * n * 9); let o = 0;
      for (let f = 0; f < 8; f++) {
        const sx = f & 1 ? 1 : -1, sy = f & 2 ? 1 : -1, sz = f & 4 ? 1 : -1, flip = sx * sy * sz < 0;
        const put = (i, j) => { const x = sx * i, y = sy * j, z = sz * (n - i - j), l = Math.hypot(x, y, z) || 1; out[o++] = x / l; out[o++] = y / l; out[o++] = z / l; };
        for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) {
          put(i, j); if (flip) { put(i, j + 1); put(i + 1, j); } else { put(i + 1, j); put(i, j + 1); }
          if (j < n - i - 1) { put(i + 1, j); if (flip) { put(i, j + 1); put(i + 1, j + 1); } else { put(i + 1, j + 1); put(i, j + 1); } }
        }
      }
      return out;
    };
    for (const det of [3, 4, 5]) { ico[det] = unitSphere(det * 2); await ctx.yield(); }
    const cTris = (3 + (weather === 'gale' ? 2 : 0)) * (4 * icoTris(5) + 7 * icoTris(3)) + 9 * (3 * icoTris(4) + 7 * icoTris(3));
    const cP = new Float32Array(cTris * 9), cN = new Float32Array(cTris * 9), cH = new Float32Array(cTris * 6), cM = new Float32Array(cTris * 12);
    let cv = 0; const cm = [0, 0, 0, 0];
    await ctx.yield();
    const lobe = (x, yb, z, rx, ry, rz, det, rdx, rdz, half = 0) => {             // half 1 | 2: only that half of the lobe's triangles
      const a = ico[det], FL = -0.3, mid = Math.floor(a.length / 18) * 9;
      for (let i = half === 2 ? mid : 0; i < (half === 1 ? mid : a.length) && cv * 3 < cP.length; i += 3, cv++) {
        const ux = a[i], uy = a[i + 1], uz = a[i + 2];
        const kk = 1 + 0.07 * noise.n3(ux * 2.1 + x * 0.05, uy * 2.1 + yb * 0.05, uz * 2.1 + z * 0.05);
        let yy = uy * kk; const fl = yy < FL; if (fl) yy = FL + (yy - FL) * 0.1;
        const px = x + ux * kk * rx, pz = z + uz * kk * rz, nx = ux / rx, ny = (fl ? -4 : uy) / ry, nz = uz / rz, nl = Math.hypot(nx, ny, nz) || 1;
        cP[cv * 3] = px; cP[cv * 3 + 1] = yb + (yy - FL) * ry; cP[cv * 3 + 2] = pz;
        cN[cv * 3] = nx / nl; cN[cv * 3 + 1] = ny / nl; cN[cv * 3 + 2] = nz / nl;
        cH[cv * 2 + 1] = px * rdx + pz * rdz; cM[cv * 4] = cm[0]; cM[cv * 4 + 1] = cm[1]; cM[cv * 4 + 2] = cm[2]; cM[cv * 4 + 3] = cm[3];
      }
    };
    const cumulus = async (cx, cy, cz, s, dark, drift) => {
      cm[0] = dark ? 1 : 3; cm[1] = dark ? 0.5 : 0.25; cm[2] = dark ? 0.1 : 0; cm[3] = drift;
      let rdx = cx - 10, rdz = cz + 40; const rl = Math.hypot(rdx, rdz);
      if (rl < 120) { rdx = 0; rdz = -1; } else { rdx /= rl; rdz /= rl; }
      const yb = cy - 0.06 * s, nb = dark ? 4 : 3, dome = dark ? 0.66 : 0.78, tops = [];
      for (let i = 0; i < nb; i++) {                                               // the big billows
        const t = nb === 1 ? 0 : (i / (nb - 1)) * 2 - 1, r = s * 0.4 * crng.range(0.85, 1.12) * (1 - 0.28 * t * t);
        const x = cx + t * s * 0.7, z = cz + crng.range(-0.12, 0.12) * s;
        lobe(x, yb, z, r * 1.2, r * dome, r, dark ? 5 : 4, rdx, rdz, 1); await ctx.yield();
        lobe(x, yb, z, r * 1.2, r * dome, r, dark ? 5 : 4, rdx, rdz, 2); tops.push([x, z, r]);
        await ctx.yield();
      }
      for (let i = 0; i < 5; i++) {                                                // scroll curls along the skirt
        const t = ((i + crng.range(0.2, 0.8)) / 5) * 2 - 1, r = s * crng.range(0.2, 0.27);
        lobe(cx + t * s * 1.02, yb, cz + (i % 2 ? 1 : -1) * crng.range(0.2, 0.36) * s, r * 1.15, r * dome * 1.05, r, 3, rdx, rdz);
        if (i === 2) await ctx.yield();
      }
      await ctx.yield();
      for (let i = 0; i < 2; i++) {                                                // puffs heaped on the crown
        const b = tops[(i + (dark ? 1 : 0)) % tops.length], r = b[2] * crng.range(0.52, 0.66);
        lobe(b[0] + crng.range(-0.3, 0.3) * b[2], yb + b[2] * dome * 0.62, b[1] + crng.range(-0.2, 0.2) * b[2], r * 1.1, r * 0.82, r, 3, rdx, rdz);
      }
      await ctx.yield();
    };
    await cumulus(0, 112, -34, 96, true, 0.15);                                   // the rain cloud dead ahead at entry
    const bankC = ringPos.clone().addScaledVector(DIR2, 360);
    await cumulus(bankC.x - 90, 150, bankC.z - 60, 150, true, 0.1); await cumulus(bankC.x + 110, 172, bankC.z + 90, 170, true, 0.1);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + crng.range(-0.2, 0.2), r = crng.range(380, 1050);
      await cumulus(60 + Math.cos(a) * r, crng.range(150, 300), -40 + Math.sin(a) * r, crng.range(70, 150), false, crng.range(0.6, 1.6));
    }
    const curtains = [];
    const addCurtain = (cx, cz, yaw, wid, hgt, o) => {
      const g = new THREE.PlaneGeometry(wid, hgt, 1, 1); g.translate(0, hgt / 2, 0);
      const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, (hgt - pa.getY(i)) * (o.slant ?? 0.24));
      const m = add(g, curtainMat(U, X, o), 2); m.position.set(cx, -1, cz); m.rotation.y = yaw; curtains.push(m); return m;
    };
    if (weather !== 'calm') addCurtain(0, -30, 0, 130, 106, { dense: 46, tint: 0.2, nearFade: 110 });
    addCurtain(bankC.x, bankC.z, Math.atan2(-DIR2.x, -DIR2.z), 760, 190, { dense: 150, tint: 0.5, nearFade: 60, slant: 0.2 });
    if (weather === 'gale') {
      await cumulus(-330, 120, -170, 110, true, 0.12); await cumulus(300, 126, 60, 120, true, 0.12);
      addCurtain(-330, -170, 0.5, 150, 112, { dense: 52, tint: 0.24, nearFade: 110 }); addCurtain(300, 60, -0.7, 160, 118, { dense: 56, tint: 0.24, nearFade: 110 });
    }
    await ctx.yield();
    const gCloud = new THREE.BufferGeometry();
    gCloud.setAttribute('position', new THREE.BufferAttribute(cP, 3)); gCloud.setAttribute('normal', new THREE.BufferAttribute(cN, 3));
    gCloud.setAttribute('aHatch', new THREE.BufferAttribute(cH, 2)); gCloud.setAttribute('aM', new THREE.BufferAttribute(cM, 4));
    gCloud.setDrawRange(0, cv); gCloud.boundingSphere = new THREE.Sphere(new THREE.Vector3(60, 150, -40), 2400);
    await ctx.yield();
    add(gCloud, matCloud, 0); add(gCloud, matCloudLine, 0);
    await ctx.yield();

    // ---- 5e. the sea: a camera-following radial grid; every hatch line is a phase line of the swell ----
    const capU = []; for (let i = 0; i < 17; i++) capU.push(new THREE.Vector4(0, -60, 0, 4));
    {
      const NR = 120, NA = 160, pos = [], idx = [];
      for (let i = 0; i <= NR; i++) { const r = 2.5 * Math.pow(1900 / 2.5, i / NR); for (let j = 0; j <= NA; j++) { const a = (j / NA) * TAU; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); } }
      for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const q = i * (NA + 1) + j; idx.push(q, q + 1, q + NA + 2, q, q + NA + 2, q + NA + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4000);
      add(g, new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...X, uCaps: { value: capU }, uGale: { value: weather === 'gale' ? 1 : weather === 'calm' ? -1 : 0 } },
        vertexShader: /* glsl */`
          uniform vec3 uCam;
          varying vec3 vWP;
          #include <fog_pars_vertex>
          ${SEA_GLSL}
          void main(){
            vec3 wp = vec3(position.x+uCam.x, 0., position.z+uCam.z);
            wp.y = heroSea(wp.xz);
            vWP = wp;
            vec4 mvPosition = viewMatrix*vec4(wp, 1.); gl_Position = projectionMatrix*mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          ${ENGRAVE_GLSL}
          ${FOG_FRAG}
          ${SEA_GLSL}
          uniform vec4 uCaps[17], uGloom; uniform float uGale, uNight;
          varying vec3 vWP;
          float capShadow(vec3 p, vec3 L, vec3 a, vec3 b, float r){
            vec3 ab = b-a, ao = p-a; float abL = dot(ab, L);
            float A = dot(ab, ab)-abL*abL;
            float t = clamp((dot(ao, ab)-dot(ao, L)*abL)/max(A, 1e-3), 0., 1.);
            vec3 c = a+ab*t-p; float s = dot(c, L);
            vec3 d = c-L*max(s, 0.);
            return (1.-smoothstep(r*.8, r*1.9, length(d)))*step(0., s);
          }
          void main(){
            vec2 p = vWP.xz;
            vec3 hg = seaHG(p);
            float sw = dot(p, vec2(.342, .94));
            float v = sw-uSeaT*7.88+3.*sin(dot(p, vec2(.9, -.3))*.045+uSeaT*.25)+1.6*eN2(p*.03)+hg.x*.7;
            float w = fwidth(v);
            float sh = 0.;
            for(int i = 0; i < 16; i++) sh = max(sh, capShadow(vWP, uKey, uCaps[i].xyz, uCaps[i+1].xyz, .5*(uCaps[i].w+uCaps[i+1].w)));
            float lee = hg.y*uKey.x+hg.z*uKey.z;
            float cs = smoothstep(.56, .7, eN2((p-vec2(uTime*2.6, uTime*.7))*.0085));
            float gloom = uGloom.w*(1.-smoothstep(uGloom.z*.3, uGloom.z, distance(p, uGloom.xy)));
            float tone = (.25+clamp(lee*1.9, -.16, .5)-.035*hg.x+.15*cs+.08*uGale)*(1.-.22*uNight)+.5*sh+gloom;
            tone = clamp(tone, .03, .95);
            float cov = eInk(tone, vec2(v, dot(p, vec2(.94, -.342))), w);
            vec3 col = eCompose(cov, uWashA, .1+.3*tone+.22*sh+.07*cs, eFog(), eFogCol(), eGrain(vWP-cameraPosition));
            gl_FragColor = vec4(col, 1.);
          }` }), -0.5);
    }
    await ctx.yield();

    // compass roses: 32-point stars lying on the swell (decals drawn straight after the sea)
    const matDecal = eMat(U, X, { decal: true, side: THREE.DoubleSide,
      vBody: 'wp = modelMatrix*vec4(p, 1.); wp.y += heroSea(wp.xz)+.12; wn = vec3(0., 1., 0.);',
      fBody: 'tone = clamp(vM.z, 0., 1.); alpha = 1.-smoothstep(.5, .95, fog);' });
    const roseGeo = (R) => {
      const pen = makePen();
      const ann = (r0, r1, sel, amt, tone, seg = 72) => {
        pen.set(sel, amt, tone);
        pen.grid(seg, 1, (u, v, o) => { const a = u * TAU, r = r0 + (r1 - r0) * v; o[0] = Math.cos(a) * r; o[1] = 0; o[2] = -Math.sin(a) * r; }, [TAU * r1, r1 - r0]);
      };
      ann(R * 1.0, R * 1.09, 3, 0.5, 0.42); ann(R * 1.09, R * 1.115, 5, 0, 0); ann(R * 0.985, R * 1.0, 5, 0, 0);
      const kite = (a, len, rb, da, selR, amtR, toneL) => {
        const ca = Math.cos(a), sa = Math.sin(a), ns = len > R * 0.7 ? 7 : 4, ts = rb / len;
        for (const side of [-1, 1]) {
          if (side < 0) pen.set(0, 0, toneL); else pen.set(selR, amtR, selR === 0 ? 0.04 : 0.1);
          const sx = Math.cos(a + side * da) * rb, sz = Math.sin(a + side * da) * rb, tx = ca * len, tz = sa * len;
          let prevA = -1, prevB = -1;
          for (let j = 0; j <= ns; j++) {
            const t = j / ns, ax = tx * t, az = tz * t;
            let bx, bz; if (t <= ts) { bx = sx * (t / ts); bz = sz * (t / ts); } else { const f = (t - ts) / (1 - ts); bx = sx + (tx - sx) * f; bz = sz + (tz - sz) * f; }
            const ia = pen.v(ax, 0, az, 0, 1, 0, 0, t * len), ib = pen.v(bx, 0, bz, 0, 1, 0, side * Math.hypot(bx - ax, bz - az), t * len);
            if (j > 0) { if (side > 0) pen.quad(prevA, prevB, ib, ia); else pen.quad(prevA, ia, ib, prevB); }
            prevA = ia; prevB = ib;
          }
        }
      };
      for (let i = 0; i < 32; i++) if (i % 2 === 1) kite((i / 32) * TAU, R * 0.44, R * 0.2, TAU / 64, 1, 0.6, 0.5);
      for (let i = 0; i < 32; i += 2) if (i % 4 === 2) kite((i / 32) * TAU, R * 0.62, R * 0.2, TAU / 40, 2, 0.7, 0.66);
      ann(R * 0.5, R * 0.56, 4, 0.5, 0); ann(R * 0.56, R * 0.575, 5, 0, 0); ann(R * 0.485, R * 0.5, 5, 0, 0);
      for (let i = 0; i < 32; i += 4) if (i % 8 === 4) kite((i / 32) * TAU, R * 0.8, R * 0.17, TAU / 20, 4, 0.5, 0.8);
      for (let i = 0; i < 32; i += 8) kite((i / 32) * TAU, R * 0.98, R * 0.17, TAU / 16, 0, 0, 0.86);
      ann(0, R * 0.075, 4, 0.5, 0, 24); ann(R * 0.075, R * 0.09, 5, 0, 0, 24);
      return pen.build();
    };
    const needleGeo = (() => { const pen = makePen(); pen.set(4, 0.5, 0);
      pen.grid(1, 6, (u, v, o) => { const t = v * 2 - 1, wdt = 0.035 * (1 - Math.abs(t)) + 0.004; o[0] = t; o[1] = 0; o[2] = (u - 0.5) * 2 * wdt; }, [0.07, 2]); return pen.build(); })();
    const roseAt = [{ p: course(70), R: 40, a0: Math.PI / 2 }, { p: ringPos.clone(), R: 35, a0: Math.atan2(-DIR2.z, DIR2.x) }, { p: new THREE.Vector3(560, 0, -260), R: 48, a0: 0.5 }];
    const needles = [];
    for (const r of roseAt) {
      const m = add(roseGeo(r.R), matDecal, -0.3); m.position.set(r.p.x, 0, r.p.z); m.rotation.y = r.a0;
      const nd = add(needleGeo, matDecal, -0.29); nd.position.set(r.p.x, 0.1, r.p.z); nd.scale.setScalar(r.R * 0.92); nd.userData.a0 = r.a0 + 0.3; needles.push(nd);
      await ctx.yield();
    }
    await ctx.yield();

    // rhumb threads: sixteen taut threads from each rose, ribbons never thinner than ~1.6 px
    const threadY = 3 + 1.3 * seaAmp;
    {
      const pos = [], dir = [], side = [], idx = [];
      for (const r of roseAt) for (let k = 0; k < 16; k++) {
        const a = -r.a0 + (k / 16) * TAU, dx = Math.cos(a), dz = Math.sin(a), r0 = r === roseAt[1] ? 12 : r.R * 0.09, NS = 34;
        const base = pos.length / 3;
        for (let i = 0; i <= NS; i++) {
          const d = r0 + (1500 - r0) * Math.pow(i / NS, 2.2);
          for (const e of [-1, 1]) { pos.push(r.p.x + dx * d, threadY, r.p.z + dz * d); dir.push(dx, dz, d); side.push(e); }
        }
        for (let i = 0; i < NS; i++) { const q = base + i * 2; idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aDir', new THREE.Float32BufferAttribute(dir, 3)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1));
      g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4000);
      add(g, new THREE.ShaderMaterial({
        fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...X },
        vertexShader: /* glsl */`
          uniform float uTime, uResY; uniform vec3 uCam; uniform vec4 uRingP;
          attribute vec3 aDir; attribute float aSide;
          varying float vSide, vA;
          #include <fog_pars_vertex>
          void main(){
            vec3 wp = position;
            wp.y += .07*sin(uTime*13.+aDir.z*.21)*smoothstep(0., 30., aDir.z)+.25*sin(uTime*.9+aDir.z*.013);
            vec4 mvPosition = viewMatrix*vec4(wp, 1.);
            vec3 vt = normalize((viewMatrix*vec4(aDir.x, 0., aDir.y, 0.)).xyz+vec3(1e-5, 0., 0.));
            vec2 sd = normalize(vec2(-vt.y, vt.x)+vec2(1e-5, 0.));
            float depth = max(-mvPosition.z, .1);
            float pxw = depth*2./(projectionMatrix[1][1]*uResY);
            float nearRose = 1.-smoothstep(260., 420., distance(wp.xz, uRingP.xy));      // the fan converging on the exit rose
            float hw = max(.05+.05*nearRose, mix(1.05, 2.2, nearRose)*pxw);
            mvPosition.xy += sd*aSide*hw;
            vSide = aSide;
            vA = mix(min(1., .05/hw*1.6+.6), 1., nearRose)*smoothstep(11., 19., length(wp.xz-uCam.xz));
            gl_Position = projectionMatrix*mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uPaper, uInk, uInkFar;
          varying float vSide, vA;
          ${FOG_FRAG}
          void main(){
            float f = eFog();
            float a = vA*(1.-smoothstep(.45, 1., abs(vSide)))*(1.-smoothstep(.35, .9, f));
            gl_FragColor = vec4(mix(uInk, uInkFar, smoothstep(.1, .7, f)), a);
          }` }), 1);
    }

    // the exit ring: a moulded gold-leaf torus standing in the exit rose, its lower rim awash
    const ringGroup = new THREE.Group(); scene.add(ringGroup);
    {
      const pen = makePen(); pen.set(4, 0.5, 0.05);
      pen.grid(72, 14, (u, v, o) => {
        const a = u * TAU, b = v * TAU, bead = 1 + 0.1 * Math.cos(a * 36) * (0.5 + 0.5 * Math.cos(b));
        const r = 0.95 * (1 + 0.16 * Math.cos(b * 3)) * bead, R = 8.45 + Math.cos(b) * r;
        o[0] = Math.cos(a) * R; o[1] = Math.sin(a) * R; o[2] = Math.sin(b) * r;
      }, [TAU * 8.45, TAU * 0.95], null, true);
      for (let k = 0; k < 4; k++) { const a = k * TAU / 4 + TAU / 8; pen.blob(Math.cos(a) * 9.5, Math.sin(a) * 9.5, 0, 0.9, 0.9, 0.7, 1, null, 0); }
      const g = pen.build();
      const m1 = new THREE.Mesh(g, matFill), m2 = new THREE.Mesh(g, matLine); m1.frustumCulled = m2.frustumCulled = false;
      ringGroup.add(m1, m2);
      ringGroup.position.copy(path.end);
      ringGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), path.endTangent.clone().negate().normalize());
    }
    await ctx.yield();

    // sounding numerals and anchors: stroke-drawn atlas (no fonts), 4 x 2 cells, bobbing flat on the water
    const atlas = (() => {
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256;
      const c = cv.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, 512, 256);
      c.strokeStyle = '#fff'; c.lineWidth = 9; c.lineCap = 'round'; c.lineJoin = 'round';
      const D = {
        1: [[[0.38, 0.28], [0.55, 0.12], [0.55, 0.9]]],
        2: [[[0.27, 0.3], [0.33, 0.15], [0.52, 0.1], [0.7, 0.2], [0.7, 0.4], [0.27, 0.9], [0.76, 0.9]]],
        3: [[[0.27, 0.14], [0.7, 0.14], [0.46, 0.45], [0.7, 0.6], [0.66, 0.84], [0.42, 0.92], [0.24, 0.8]]],
        4: [[[0.62, 0.9], [0.62, 0.1], [0.22, 0.65], [0.8, 0.65]]],
        7: [[[0.24, 0.12], [0.76, 0.12], [0.42, 0.9]], [[0.42, 0.5], [0.68, 0.5]]],
        9: [[[0.7, 0.3], [0.6, 0.13], [0.4, 0.12], [0.29, 0.3], [0.38, 0.48], [0.58, 0.48], [0.7, 0.3], [0.68, 0.7], [0.48, 0.92], [0.3, 0.84]]],
        A: [[[0.5, 0.24], [0.5, 0.88]], [[0.3, 0.36], [0.7, 0.36]], [[0.18, 0.58], [0.24, 0.76], [0.5, 0.9], [0.76, 0.76], [0.82, 0.58]], [[0.1, 0.66], [0.18, 0.58], [0.28, 0.64]], [[0.72, 0.64], [0.82, 0.58], [0.9, 0.66]],
          [[0.5, 0.24], [0.43, 0.17], [0.5, 0.1], [0.57, 0.17], [0.5, 0.24]]],
      };
      const cells = ['7', '12', '4', '23', '9', '31', 'A', 'A'];
      cells.forEach((s, ci) => {
        const ox = (ci % 4) * 128, oy = Math.floor(ci / 4) * 128, n = s.length;
        for (let k = 0; k < n; k++) for (const st of D[s[k]]) {
          c.beginPath();
          st.forEach((q, i) => { const x = ox + 14 + (n === 1 ? 20 + q[0] * 60 : k * 50 + q[0] * 50), y = oy + 18 + q[1] * 92; if (i) c.lineTo(x, y); else c.moveTo(x, y); });
          c.stroke();
        }
      });
      const t = new THREE.CanvasTexture(cv); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4; return t;
    })();
    {
      const n = Math.round(300 * detail * density), iG = [], iH = [], grng = rng.fork('glyphs');
      for (let i = 0; i < n; i++) {
        const d = grng.range(10, 640), p = course(Math.min(d, 588)), sd = grng.chance(0.5) ? 1 : -1, off = sd * grng.range(7, 150) * (grng.chance(0.6) ? 0.4 : 1);
        const tg = path.tangentAt(Math.min(1, d / 588));
        iG.push(p.x - tg.z * off, p.z + tg.x * off, grng.range(2.6, 5.5), grng.range(-0.5, 0.5) + Math.atan2(tg.x, -tg.z)); iH.push(Math.min(7, Math.floor(grng() * 8)), grng.range(0, 6.28));
      }
      const g = new THREE.InstancedBufferGeometry(); g.instanceCount = n;
      g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5], 3)); g.setIndex([0, 2, 1, 0, 3, 2]);
      g.setAttribute('iG', new THREE.InstancedBufferAttribute(new Float32Array(iG), 4)); g.setAttribute('iH', new THREE.InstancedBufferAttribute(new Float32Array(iH), 2));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4000);
      const m = new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false,
        blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...X, uAtlas: { value: atlas } },
        vertexShader: /* glsl */`
          uniform float uTime; attribute vec4 iG; attribute vec2 iH;
          varying vec2 vUv;
          #include <fog_pars_vertex>
          ${SEA_GLSL}
          void main(){
            float r = iG.w+.14*sin(uTime*.6+iH.y), c = cos(r), s = sin(r);
            vec2 o = vec2(position.x*c-position.z*s, position.x*s+position.z*c)*iG.z;
            vec3 hg = seaHG(iG.xy);
            vec3 wp = vec3(iG.x+o.x, hg.x+dot(hg.yz, o)+.14, iG.y+o.y);
            vUv = (vec2(position.x+.5, .5-position.z)+vec2(mod(iH.x, 4.), floor(iH.x/4.)))*vec2(.25, .5);
            vec4 mvPosition = viewMatrix*vec4(wp, 1.); gl_Position = projectionMatrix*mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uPaper, uInk, uInkFar; uniform sampler2D uAtlas;
          varying vec2 vUv;
          ${FOG_FRAG}
          void main(){
            float f = eFog();
            float a = smoothstep(.3, .62, texture2D(uAtlas, vUv).r)*(1.-smoothstep(.3, .8, f))*.9;
            gl_FragColor = vec4(mix(uInk, uInkFar, smoothstep(0., .5, f)), a);
          }` });
      add(g, m, -0.28);
    }
    await ctx.yield();

    // curl ticks: little scrolls that form on the crests and unroll (camera-wrapped field of billboards)
    {
      const n = Math.round(3600 * detail * (0.55 + 0.45 * seaAmp)), iT = new Float32Array(n * 4), trng = rng.fork('ticks');
      for (let i = 0; i < n; i++) { iT[i * 4] = trng.range(0, 320); iT[i * 4 + 1] = trng.range(0, 320); iT[i * 4 + 2] = trng(); iT[i * 4 + 3] = trng.range(0.45, 0.95) * (weather === 'gale' ? 1.3 : 1); }
      const g = new THREE.InstancedBufferGeometry(); g.instanceCount = n;
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 2, 0, -1, 2, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('iT', new THREE.InstancedBufferAttribute(iT, 4)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4000);
      add(g, new THREE.ShaderMaterial({
        fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...X },
        vertexShader: /* glsl */`
          uniform vec3 uCam; attribute vec4 iT;
          varying vec2 vQ; varying float vRoll, vFl;
          #include <fog_pars_vertex>
          ${SEA_GLSL}
          void main(){
            vec2 c = uCam.xz+mod(iT.xy-uCam.xz, 320.)-160.;
            float a = dot(c, vec2(.342, .94))*.0698-uSeaT*.55+(iT.z-.5)*1.1;
            float crest = smoothstep(.5, .93, sin(a));
            float dist = length(c-uCam.xz);
            float s = iT.w*crest*(1.-smoothstep(70., 120., dist))*smoothstep(9., 17., dist);
            vec3 right = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0])+vec3(1e-5, 0., 0.));
            float fl = iT.z > .5 ? 1. : -1.;
            vec3 wp = vec3(c.x, heroSea(c)-.12*s, c.y)+right*position.x*s+vec3(0., position.y*s, 0.);
            vQ = vec2(position.x*fl, position.y-1.); vRoll = cos(a); vFl = step(1e-3, s);
            vec4 mvPosition = viewMatrix*vec4(wp, 1.); gl_Position = projectionMatrix*mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uPaper, uInk, uInkFar;
          varying vec2 vQ; varying float vRoll, vFl;
          ${FOG_FRAG}
          void main(){
            float wq = fwidth(vQ.y)+1e-4, hw = max(.06, .9*wq);
            vec2 q = vQ;
            vec2 q1 = q-vec2(.05, -.1); float r1 = length(q1), ang = atan(q1.y, q1.x+1e-5);
            float open = .25+.5*vRoll;                                          // the scroll unrolls past the crest
            float m1 = smoothstep(-.9, -.5, ang)*(1.-smoothstep(2.1+open, 2.5+open, ang));
            float d = abs(r1-.6)+(1.-m1)*4.;
            d = min(d, abs(q.y+.86+.1*q.x)+smoothstep(.75, .98, abs(q.x))*4.);
            float f = eFog();
            float a = (1.-smoothstep(hw, hw+wq*1.3, d))*(1.-smoothstep(.3, .55, wq))*(1.-smoothstep(.3, .85, f))*vFl*.9;
            gl_FragColor = vec4(mix(uInk, uInkFar, smoothstep(0., .5, f)), a);
          }` }), 1.5);
    }
    await ctx.yield();

    // ---- 5f. the second ship (galleon or caravel by seed): origin at the waterline, bow toward -Z ----
    const ship = new THREE.Group(); scene.add(ship);
    const oarBanks = [];
    {
      const caravel = shipKind !== 'galleon', galley = shipKind === 'galley', L = galley ? 37 : caravel ? 31 : 40, pen = makePen();
      const beam = (u) => (caravel ? 3.9 : 4.7) * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.9 + 0.07)), 0.55);
      const top = (u) => (galley ? 2.6 : caravel ? 3.4 : 4.3) + (galley ? 3.2 : caravel ? 4.2 : 6.2) * Math.pow(Math.max(0, 1 - u * 1.6), 1.6) + 2.4 * Math.pow(u, 4);
      const hf = (u, v, o) => { const ph = (v - 0.5) * Math.PI, b = beam(u), t = top(u), c = Math.pow(Math.max(0, Math.cos(ph)), 1.15);
        o[0] = b * Math.sign(ph) * Math.pow(Math.abs(Math.sin(ph)), 0.62) * (1 - 0.1 * (1 - c)); o[1] = t - (t + 2.6) * c; o[2] = (0.5 - u) * L; };
      pen.set(3, 0.6, 0.2); pen.grid(26, 12, hf, [L, 15], null, true);
      pen.set(3, 0.4, 0.08); pen.grid(18, 2, (u, v, o) => { o[0] = (v * 2 - 1) * beam(u) * 0.93; o[1] = top(u) - 0.5; o[2] = (0.5 - u) * L; }, [L, 6]);
      pen.set(3, 0.6, 0.3); pen.grid(4, 4, (u, v, o) => { const b = beam(0) * (0.55 + 0.45 * v); o[0] = (u * 2 - 1) * b; o[1] = -2 + (top(0) + 2) * v; o[2] = L / 2 + 0.3 * Math.sin(Math.PI * u); }, [3, 6]);
      const o3 = [0, 0, 0];
      pen.set(5, 0, 0);                                                       // gunports and the wale
      for (let k = 0; k < (caravel ? 5 : 8); k++) for (const sd of [0.2, 0.8]) {
        const u = 0.2 + k * (caravel ? 0.12 : 0.085); hf(u, sd, o3); const x = o3[0] + Math.sign(o3[0]) * 0.08, y = o3[1], z = o3[2], sg = Math.sign(o3[0]);
        const a = pen.v(x, y - 0.4, z - 0.45, sg, 0.2, 0, 0, 0), b = pen.v(x, y - 0.4, z + 0.45, sg, 0.2, 0, 0, 0), c = pen.v(x + sg * 0.05, y + 0.4, z + 0.45, sg, 0.2, 0, 0, 0), d = pen.v(x + sg * 0.05, y + 0.4, z - 0.45, sg, 0.2, 0, 0, 0);
        pen.quad(a, b, c, d);
      }
      const masts = galley ? [[0.52, 24]] : caravel ? [[0.62, 25], [0.3, 20]] : [[0.5, 38], [0.76, 31], [0.22, 26]];
      masts.forEach(([u, h], mi) => {
        const z = (0.5 - u) * L, y0 = top(u) - 0.5;
        pen.set(3, 0.5, 0.25); pen.tube([[0, y0, z], [0, y0 + h * 0.5, z], [0, y0 + h, z]], (t) => 0.42 - 0.24 * t, 7);
        const lateen = caravel || mi === 2;
        if (lateen) {
          const cl = Math.cos(1.05), sl = Math.sin(1.05), sw = (q) => { const dx = q[0], dz = q[2] - z; q[0] = dx * cl + dz * sl; q[2] = z - dx * sl + dz * cl; return q; };
          pen.set(3, 0.5, 0.25); pen.tube([sw([-0.4, y0 + h * 0.34, z - h * 0.34]), sw([0.2, y0 + h * 0.7, z + 0.2]), sw([0.5, y0 + h * 1.02, z + h * 0.33])], 0.16, 5);
          pen.set(3, 0.55, 0.24); pen.grid(8, 7, (a, b, o) => { const w = 1 - b;
            o[0] = -0.4 + 0.9 * a - (2.2 + h * 0.05) * Math.sin(Math.PI * a) * Math.sin(Math.PI * b * 0.8 + 0.3) * w; o[1] = y0 + h * (0.34 + 0.68 * a) - b * h * (0.24 + 0.38 * a); o[2] = z - h * 0.34 + h * 0.67 * a * (1 - 0.25 * b) + 0.6 * b; sw(o); },
          [h * 0.5, h * 0.35], (a, b) => 0.3 * Math.sin(Math.PI * a) * b);
        } else {
          const tiers = [[0.3, 0.62, 7.5, 6.2], [0.66, 0.86, 5.6, 4.4], [0.89, 0.99, 3.8, 3.0]].slice(0, mi === 0 ? 3 : 2);
          for (const [a0, a1, wb, wt] of tiers) {
            const yb = y0 + h * a0, yt = y0 + h * a1, sc = h / 38;
            pen.set(3, 0.5, 0.25); pen.tube([[-wt * sc - 0.4, yt, z - 0.5], [wt * sc + 0.4, yt, z - 0.5]], 0.15, 5);
            pen.set(3, 0.55, 0.24); pen.grid(8, 6, (a, b, o) => { const wdt = (wb + (wt - wb) * b) * sc;
              o[0] = (a * 2 - 1) * wdt; o[1] = yb + (yt - yb) * b + 0.5 * Math.pow(Math.abs(a * 2 - 1), 2) * (1 - b); o[2] = z - 0.6 - (1.8 + 1.6 * sc) * Math.sin(Math.PI * a) * Math.sin(Math.PI * (0.15 + 0.85 * b)) ; },
            [wb * sc * 2, yt - yb], (a, b) => 0.22 * Math.sin(Math.PI * a) * Math.sin(Math.PI * b));
          }
        }
        pen.set(0, 0, 0.42);                                                  // shrouds as hatched sheets
        for (const sd of [-1, 1]) pen.grid(1, 3, (a, b, o) => { const bm = beam(u) * 0.95; o[0] = sd * bm * (1 - b * 0.96); o[1] = y0 + h * 0.66 * b; o[2] = z + (a - 0.5) * 3.4 * (1 - b) + 1.2 * (1 - b); }, [3.4, h * 0.66]);
        pen.set(2, 0.85, 0.1);                                                // pennant
        pen.grid(7, 1, (a, b, o) => { o[0] = 0.5 * Math.sin(a * 5); o[1] = y0 + h + 0.4 - b * (1.3 - a * 1.1) - 0.5 * a; o[2] = z - a * (6 + h * 0.08); }, [7, 1.3], (a) => 0.45 * a);
      });
      pen.set(3, 0.5, 0.25); pen.tube([[0, top(0.93) - 0.2, -L * 0.42], [0, top(1) + 3.4, -L * 0.5 - 7.5]], (t) => 0.3 - 0.14 * t, 6);
      pen.set(4, 0.5, 0);
      for (const lx of [-1.5, 0, 1.5]) pen.blob(lx, top(0) + 1.3 + (lx === 0 ? 0.7 : 0), L / 2 + 0.5, 0.42, 0.6, 0.42, 1, null, 0);
      const g = pen.build();
      const m1 = new THREE.Mesh(g, matFill), m2 = new THREE.Mesh(g, matLine); m1.frustumCulled = m2.frustumCulled = false; ship.add(m1, m2);
      if (galley) for (const sd of [-1, 1]) {                                 // the oared galley: a bank of ten sweeps a side, rowed in update()
        const op = makePen();
        for (let k = 0; k < 10; k++) {
          const u = 0.24 + k * 0.058, z = (0.5 - u) * L, x0 = sd * beam(u) * 0.97, y0 = top(u) - 0.75, x1 = sd * (beam(u) + 7.4);
          op.set(3, 0.5, 0.3); op.tube([[x0 - sd * 1.2, y0 + 0.5, z - 0.1], [x0, y0, z], [x1, -0.4, z + 0.5]], 0.12, 5);
          op.set(0, 0, 0.16); op.grid(2, 1, (a, b, o) => { o[0] = x1 - sd * 0.5 + sd * a * 1.9; o[1] = -0.4 - a * 0.35 + (b - 0.5) * 0.12; o[2] = z + 0.5 + (b - 0.5) * 0.7; }, [1.9, 0.7]);
        }
        const og = op.build(), grp = new THREE.Group(); grp.matrixAutoUpdate = false; grp.userData.sd = sd;
        const o1 = new THREE.Mesh(og, matFill), o2 = new THREE.Mesh(og, matLine); o1.frustumCulled = o2.frustumCulled = false; grp.add(o1, o2); ship.add(grp); oarBanks.push(grp);
      }
    }
    await ctx.yield();

    // gulls: paired strokes wheeling round a moving centre (the ship's wake, then the serpent's head)
    const gullC = new THREE.Vector3(-42, 22, 170);
    {
      const n = 30, pos = [], aW = [], ia = new Float32Array(n * 4), grng = rng.fork('gulls'), NSG = 4;
      for (const wing of [-1, 1]) for (let i = 0; i <= NSG; i++) for (const e of [-1, 1]) { pos.push(0, 0, 0); aW.push(i / NSG, wing, e); }
      const idx = []; for (let wI = 0; wI < 2; wI++) for (let i = 0; i < NSG; i++) { const q = wI * (NSG + 1) * 2 + i * 2; idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
      for (let i = 0; i < n; i++) { ia[i * 4] = grng(); ia[i * 4 + 1] = grng.range(7, 30); ia[i * 4 + 2] = grng.range(-7, 12); ia[i * 4 + 3] = grng.range(7, 12) * (grng.chance(0.5) ? 1 : -1); }
      const g = new THREE.InstancedBufferGeometry(); g.instanceCount = n;
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(aW, 3)); g.setIndex(idx);
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(ia, 4)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4000);
      add(g, new THREE.ShaderMaterial({
        fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...X, uGullC: { value: gullC } },
        vertexShader: /* glsl */`
          uniform float uTime, uResY; uniform vec3 uGullC;
          attribute vec3 aW; attribute vec4 iA;
          varying vec2 vQ;
          #include <fog_pars_vertex>
          vec3 wingPt(float t){
            float ang = iA.x*6.283+uTime*iA.w/iA.y;
            vec3 rad = vec3(cos(ang), 0., sin(ang));
            vec3 c = uGullC+rad*iA.y*vec3(1., 0., .75)+vec3(0., iA.z+1.5*sin(uTime*.6+iA.x*20.), 0.);
            float flap = sin(uTime*(5.5+iA.x*2.)+iA.x*30.);
            float glide = smoothstep(-.2, .6, sin(uTime*.5+iA.x*11.));
            float lift = mix(flap, .25, glide)*t*.75-t*t*.5*(.4+.4*flap*(1.-glide))+.22*sin(t*3.14159);
            return c+rad*aW.y*t*1.25+vec3(0., lift, 0.);
          }
          void main(){
            vec4 p0 = viewMatrix*vec4(wingPt(aW.x), 1.), p1 = viewMatrix*vec4(wingPt(aW.x+.1), 1.);
            vec2 dir = p1.xy-p0.xy; dir = dir/max(length(dir), 1e-5);
            float depth = max(-p0.z, .1), pxw = depth*2./(projectionMatrix[1][1]*uResY);
            float hw = max(.085*(1.-.6*aW.x), .8*pxw);
            vec4 mvPosition = p0; mvPosition.xy += vec2(-dir.y, dir.x)*aW.z*hw;
            vQ = vec2(aW.z, min(1., .085/hw+.35));
            gl_Position = projectionMatrix*mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uPaper, uInk, uInkFar;
          varying vec2 vQ;
          ${FOG_FRAG}
          void main(){
            float f = eFog();
            gl_FragColor = vec4(mix(uInk, uInkFar, smoothstep(0., .5, f)), vQ.y*(1.-smoothstep(.4, 1., abs(vQ.x)))*(1.-smoothstep(.4, .95, f)));
          }` }), 3);
    }

    // flying fish: two shoals of 40 on ballistic arcs across the bow (3-6 s and 29.5-31.5 s), keyed to uT
    const ripples = [];                                      // [x, z, r0, ext, strength, born, dotted, riseD]
    {
      const pen = makePen(); pen.set(1, 0.8, 0.45);
      pen.grid(4, 2, (u, v, o) => { const w = Math.sin(Math.PI * Math.min(1, u * 1.1)) * 0.13 + 0.01; o[0] = 0; o[1] = (v - 0.5) * 2 * w + (u < 0.12 ? (v - 0.5) * 0.35 * (1 - u / 0.12) : 0); o[2] = (0.5 - u) * 1.0; }, [1, 0.3]);
      pen.set(2, 0.7, 0.16);
      for (const sd of [-1, 1]) pen.grid(2, 1, (u, v, o) => { o[0] = sd * u * 0.95; o[1] = 0.03 + u * 0.2; o[2] = -0.25 + v * 0.3 * (1 - u * 0.8) + u * 0.6; }, [0.9, 0.4], (u) => 0.12 * u);
      const base = pen.build(), n = 80, iS = new Float32Array(n * 4), iV = new Float32Array(n * 4), frng = rng.fork('fish');
      const tg = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        const second = i >= 40, t0 = second ? frng.range(29.3, 31.6) : frng.range(2.6, 6.2), d0 = t0 * 14, sd = frng.chance(0.5) ? 1 : -1;
        const p = course(d0); path.tangentAt(Math.min(1, d0 / 588), tg); tg.y = 0; tg.normalize();
        const ahead = frng.range(11, 19), lat = sd * frng.range(8.5, 11), vl = -sd * frng.range(6.2, 8.2), vy = frng.range(11.5, 13.2);
        const sx = p.x + tg.x * ahead - tg.z * lat, sz = p.z + tg.z * ahead + tg.x * lat;
        iS[i * 4] = sx; iS[i * 4 + 1] = -0.4; iS[i * 4 + 2] = sz; iS[i * 4 + 3] = t0;
        const vx = tg.x * 14.5 - tg.z * vl, vz = tg.z * 14.5 + tg.x * vl;
        iV[i * 4] = vx; iV[i * 4 + 1] = vy; iV[i * 4 + 2] = vz; iV[i * 4 + 3] = frng();
        const fl = 2 * vy / 9.5;
        if (i % 2 === 0) ripples.push([sx, sz, 0.3, 3.2, 1, t0, 1, 0], [sx + vx * fl, sz + vz * fl, 0.3, 3.6, 1, t0 + fl, 1, 0]);
      }
      const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.instanceCount = n;
      for (const k of ['position', 'normal', 'aHatch', 'aM']) g.setAttribute(k, base.attributes[k]);
      g.setAttribute('iS', new THREE.InstancedBufferAttribute(iS, 4)); g.setAttribute('iV', new THREE.InstancedBufferAttribute(iV, 4));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4000);
      const fishV = { side: THREE.DoubleSide, vHead: 'attribute vec4 iS, iV;',
        vBody: `float age = uT-iS.w, dur = 2.*iV.y/9.5, on = step(0., age)*step(age, dur);
          vec3 vel = vec3(iV.x, iV.y-9.5*age, iV.z);
          vec3 fw = normalize(vel), rt = normalize(cross(fw, vec3(0., 1., 0.))+vec3(1e-5, 0., 0.)), up = cross(rt, fw);
          p.y += aM.w*sin(uTime*38.+iV.w*30.)*.9; p *= 1.55*on;
          vec3 c = iS.xyz+vec3(iV.x*age, iV.y*age-4.75*age*age, iV.z*age);
          wp = vec4(c+rt*p.x+up*p.y-fw*p.z, 1.); wn = normalize(rt*n.x+up*n.y-fw*n.z);` };
      add(g, eMat(U, X, fishV), 0); add(g, eMat(U, X, { ...fishV, outline: true, px: 1.6, maxW: '.06' }), 0);
    }

    // three heraldic dolphins, curled like chart dolphins, riding the bow wave to port from 26 s
    const dolphins = [];
    {
      const pen = makePen(), sp = [];
      for (let i = 0; i <= 14; i++) { const t = i / 14, a = -0.9 + t * 2.3; sp.push([0, Math.sin(a) * 0.9 - 0.25 * t * t, -1.5 + t * 3.0 - 0.5 * (1 - Math.cos(a)) + 0.6]); }
      pen.set(1, 0.75, 0.08); pen.tube(sp, (t) => 0.06 + 0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + t * 0.9)), 0.7) * (0.55 + 0.45 * (1 - t)), 10, true);
      pen.set(2, 0.8, 0.1);
      pen.grid(3, 2, (u, v, o) => { o[0] = (v - 0.5) * 0.08; o[1] = 0.42 + u * 0.8; o[2] = 0.35 + v * 0.9 - u * (0.15 + 0.6 * v) + 0.3 * u; }, [0.8, 0.9]);
      for (const sd of [-1, 1]) pen.grid(3, 1, (u, v, o) => { o[0] = sd * u * 0.9; o[1] = 0.62 - 0.25 * u * u; o[2] = 1.6 + u * 0.55 + v * 0.5 * (1 - u * 0.6); }, [0.9, 0.5]);
      pen.set(0, 0, 0.2);
      pen.tube([[0, -0.66, -1.1], [0, -0.98, -1.8]], (t) => 0.2 - 0.12 * t, 6, true);
      const g = pen.build();
      for (let i = 0; i < 3; i++) { const grp = new THREE.Group(); const m1 = new THREE.Mesh(g, matFill), m2 = new THREE.Mesh(g, matLine); m1.frustumCulled = m2.frustumCulled = false; grp.add(m1, m2); grp.visible = true; grp.scale.setScalar(0.001); scene.add(grp); dolphins.push(grp); }
    }
    await ctx.yield();

    // ---- 5g. the coast being cut: burin line, burin, molehill islands, sprigs, swarf, the rare whale ----
    const S0 = course(376.8);
    const coastLat = (d) => 37 + 3.5 * Math.sin(d * 0.21) + 2 * Math.sin(d * 0.53 + 1);
    const coastPt = (d, out) => out.copy(S0).addScaledVector(DIR2, d - 376.8).addScaledVector(LEFT2, coastLat(d)).setY(0);
    const burinT = (T) => T + 0.6 * (1 - sstep(24.4, 28, T));               // the burin's own clock: it starts at 24.4 s
    const burinD = (T) => lerp(396, 656, 1 - Math.pow(1 - Math.min(1, Math.max(0, (burinT(T) - 25) / 7.5)), 1.6));
    // aE = the burin distance at which the piece stands up, plus 1000 x a code: 0 island, 1 whale, 3 its eyelid, 5 its spout.
    // The rare whale (X.uWhale 0..1): the lid lifts off the gold eye (0.02-0.15), it spouts (0.12-0.8), it sinks (0.3-1).
    const uWhaleBlow = { value: new THREE.Vector3(0, -40, 0) };
    const isleMatO = { uniforms: { uWhaleBlow }, vHead: 'attribute float aE; uniform float uBurin, uWhale; uniform vec3 uWhaleBlow;',
      vBody: `float code = floor(aE*.001+.01), key = aE-code*1000., k = clamp((uBurin-key)/30., 0., 1.);
        float rise = k*k*(3.-2.*k)+.12*sin(k*9.42)*(1.-k);
        if(code > 2.5 && code < 3.5) p.y = mix(p.y, 4.4, smoothstep(.02, .15, uWhale));
        if(code > 4.5){ float sp = smoothstep(.12, .3, uWhale)*(1.-smoothstep(.55, .8, uWhale));
          p = uWhaleBlow+(p-uWhaleBlow)*sp*(.88+.12*sin(uTime*6.+p.y*.7)); }
        p.y = -5.+(p.y+5.)*rise-step(.5, code)*smoothstep(.3, 1., uWhale)*30.;
        wp = modelMatrix*vec4(p, 1.); wn = normalize(mat3(modelMatrix)*n*vec3(1., max(rise, .05), 1.));` };
    const sprigs = [];
    {
      const pen = makePen(), irng = rng.fork('isles'), M4 = new THREE.Matrix4();
      const prof = [[1.0, -5], [0.99, 0], [0.9, 0.13], [0.72, 0.4], [0.5, 0.68], [0.28, 0.88], [0.11, 0.98], [0.002, 1]];
      for (let i = 0; i < 20; i++) {
        const d = 404 + i * 12.4 + irng.range(-2, 2), lat = 52 + irng.range(0, 10) + (i % 3 === 1 ? irng.range(8, 20) : 0);
        const H = irng.range(14, 22) + 7 * sstep(470, 530, d) * (1 - sstep(560, 600, d)), R = irng.range(10.5, 14.5) + 2.5 * sstep(520, 600, d), c = S0.clone().addScaledVector(DIR2, d - 376.8).addScaledVector(LEFT2, lat);
        const whale = rare && i === 14, so = irng.range(0, 50);
        pen.extra = d - 6 + (whale ? 1000 : 0);
        pen.xf(M4.makeTranslation(c.x, 0, c.z));
        if (whale) {
          pen.set(1, 0.6, 0.12); pen.blob(0, 1, 0, 24, 9, 11, 2, noise, 0.08);
          pen.set(4, 0.5, 0); pen.blob(14, 2.4, 8.6, 2.3, 1.7, 0.8, 2, null, 0);
          pen.set(5, 0, 0); pen.blob(14.3, 2.4, 9.3, 0.7, 1.4, 0.4, 1, null, 0);
          pen.extra = d - 6 + 3000; pen.set(1, 0.6, 0.34); pen.blob(14, 2.4, 8.8, 2.55, 1.95, 1.05, 2, null, 0);       // the eyelid
          pen.extra = d - 6 + 5000; pen.set(0, 0, 0.3);                                                              // the spout: two plumes of five jets
          for (let j = 0; j < 10; j++) {
            const az = (j % 5) * 0.42 - 0.84 + (j < 5 ? 0 : Math.PI), sp = 0.5 + 0.5 * ((j * 7) % 5) / 4, pts = [];
            for (let q = 0; q <= 8; q++) { const t = q / 8, rr = sp * (2 * t + 10 * t * t), hh = 20 * (1 - (1.55 * t - 1) * (1.55 * t - 1)); pts.push([6 + Math.cos(az) * rr, 9.4 + hh, Math.sin(az) * rr * 0.8]); }
            pen.tube(pts, (t) => 0.05 + 0.07 * Math.sin(Math.PI * Math.min(1, t * 1.15)), 4, false);
          }
          uWhaleBlow.value.set(c.x + 6, 9.4, c.z);
          pen.extra = d - 6 + 1000;
          pen.set(1, 0.7, 0.3); pen.tube([[-21, 2, 0], [-27, 6, 0], [-31, 12.5, 0]], (t) => 3.4 - 2.4 * t, 8, true);
          for (const sd of [-1, 1]) pen.grid(5, 3, (u, v, o) => { o[0] = -31 - 3 * u * u + 3.5 * v * (1 - u * 0.5); o[1] = 12.5 + 2.2 * Math.sin(u * 2.2) - v * 1.2 * u; o[2] = sd * u * 8.5; }, [8, 4]);
          pen.set(3, 0.6, 0.2); pen.grid(8, 5, (u, v, o) => { const b = 1.6 * Math.sin(Math.PI * u); o[0] = -6 + (u - 0.5) * 7; o[1] = 10.2 + 1.6 * v - 1.4 * (1 - Math.pow(Math.abs(v * 2 - 1), 2)) * 0 - b * 0; o[2] = (v - 0.5) * 2 * b; }, [7, 3]);
          pen.tube([[-6, 10, 0], [-6, 19, 0]], 0.16, 5);
          ripples.push([c.x, c.z, 20, 26, 1, -1, 0, d - 6]);
        } else {
          pen.set(1, 0.6, 0.2);
          pen.lathe(prof.map(([r, y]) => [r * R, y < 0 ? y : y * H]), 22, false, (u, v) => 1 + (0.26 * noise.n2(Math.cos(u * TAU) * 1.3 + so, Math.sin(u * TAU) * 1.3 + v * 1.5) + 0.1 * noise.n2(Math.cos(u * TAU) * 4 + so, Math.sin(u * TAU) * 4 + v * 5)) * Math.min(1, v * 3));
          const hb = irng.range(0, TAU); pen.set(1, 0.6, 0.28); pen.blob(Math.cos(hb) * R * 0.62, H * 0.2, Math.sin(hb) * R * 0.62, R * 0.5, H * 0.34, R * 0.5, 2, noise, 0.25);
          ripples.push([c.x, c.z, R * 0.97, 15, 0.9, -1, 0, d - 6]);
        }
        await ctx.yield();
        const nt = Math.round(22 * detail * density);
        for (let k = 0; k < nt; k++) {
          const a = irng.range(0, TAU), rf = whale ? irng.range(0, 0.6) : irng.range(0.08, 0.86);
          let y = whale ? 9.6 * Math.sqrt(Math.max(0, 1 - rf * rf)) : H;
          if (!whale) for (let q = 2; q < prof.length; q++) if (rf <= prof[q - 1][0] && rf >= prof[q][0]) { const f = (prof[q - 1][0] - rf) / (prof[q - 1][0] - prof[q][0]); y = lerp(prof[q - 1][1], prof[q][1], f) * H; }
          sprigs.push(c.x + Math.cos(a) * rf * (whale ? 20 : R), y - 0.4, c.z + Math.sin(a) * rf * (whale ? 9 : R), d - 6 + (whale ? 1000 : 0), irng.range(2.4, 3.8), irng.range(0, TAU));
        }
      }
      pen.xf(null);
      await ctx.yield();
      const g = pen.build(true);
      await ctx.yield();
      add(g, eMat(U, X, isleMatO), 0); add(g, eMat(U, X, { ...isleMatO, outline: true, px: 2.3, maxW: '.6' }), 0);
    }
    await ctx.yield();
    {
      // sprig trees: three leaning, shivering strokes each, standing up with their island
      const n = sprigs.length / 6, pos = [], aK = [], idx = [], NSS = 3;
      for (let k = 0; k < 3; k++) { const base = pos.length / 3; for (let i = 0; i <= NSS; i++) for (const e of [-1, 1]) { pos.push(0, 0, 0); aK.push(k - 1, i / NSS, e); }
        for (let i = 0; i < NSS; i++) { const q = base + i * 2; idx.push(q, q + 1, q + 3, q, q + 3, q + 2); } }
      const iP = new Float32Array(n * 4), iQ = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) { iP.set(sprigs.slice(i * 6, i * 6 + 4), i * 4); iQ[i * 2] = sprigs[i * 6 + 4]; iQ[i * 2 + 1] = sprigs[i * 6 + 5]; }
      const g = new THREE.InstancedBufferGeometry(); g.instanceCount = n;
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(aK, 3)); g.setIndex(idx);
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(iQ, 2)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4000);
      add(g, new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...X },
        vertexShader: /* glsl */`
          uniform float uTime, uResY, uBurin, uWhale;
          attribute vec3 aK; attribute vec4 iP; attribute vec2 iQ;
          #include <fog_pars_vertex>
          void main(){
            float key = mod(iP.w, 1000.), k = clamp((uBurin-key)/30., 0., 1.), rise = k*k*(3.-2.*k)+.12*sin(k*9.42)*(1.-k);
            float grow = smoothstep(.7, 1., k);
            vec3 base = vec3(iP.x, -5.+(iP.y+5.)*rise-step(1000., iP.w)*smoothstep(.3, 1., uWhale)*30., iP.z);
            vec3 right = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0])+vec3(1e-5, 0., 0.));
            float t = aK.y, h = iQ.x*grow;
            float lean = aK.x*.42+.16+.12*sin(uTime*3.1+iQ.y+aK.x)+.07*sin(uTime*7.3+iQ.y*3.);
            vec3 wp = base+vec3(0., t*h*(1.-.12*abs(aK.x)), 0.)+right*(lean*t*t*h*.7+aK.x*t*h*.12);
            vec4 mvPosition = viewMatrix*vec4(wp, 1.);
            float pxw = max(-mvPosition.z, .1)*2./(projectionMatrix[1][1]*uResY);
            mvPosition.x += aK.z*max(.11*(1.-.75*t), .75*pxw)*step(.01, grow);
            gl_Position = projectionMatrix*mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uPaper, uInk, uInkFar;
          ${FOG_FRAG}
          void main(){ float f = eFog(); vec3 ink = mix(uInk, uInkFar, smoothstep(0., .5, f)); gl_FragColor = vec4(mix(ink, eFogCol(), smoothstep(.3, 1., f)), 1.); }` }), 0);
    }
    const burin = new THREE.Group(); scene.add(burin);
    {
      const pen = makePen();
      pen.set(0, 0, 0.3); pen.tube([[0, -0.6, -0.4], [0, 0.5, 1.0], [0, 4.4, 6.2]], (t) => 0.1 + 0.42 * Math.min(1, t * 2.4), 4, false);
      pen.set(3, 0.75, 0.15); pen.xf(new THREE.Matrix4().makeTranslation(0, 4.4, 6.2).multiply(new THREE.Matrix4().makeRotationX(0.93)));
      pen.lathe([[0.02, -0.2], [0.5, 0], [0.62, 0.5], [0.8, 1.3], [1.35, 2.0], [1.5, 2.6], [1.1, 3.1], [0.02, 3.25]], 14, true);
      pen.xf(null);
      const g = pen.build(); const m1 = new THREE.Mesh(g, matFill), m2 = new THREE.Mesh(g, matLine); m1.frustumCulled = m2.frustumCulled = false; burin.add(m1, m2);
      burin.scale.setScalar(0.001); burin.rotation.y = Math.atan2(-DIR2.x, -DIR2.z);
      // the cut line itself: fresh ink behind the burin, drying to sepia
      const pos = [], aD = [], idx = [], v = new THREE.Vector3(), v2 = new THREE.Vector3();
      for (let d = 396, i = 0; d <= 656; d += 1.5, i++) {
        coastPt(d, v); coastPt(d + 0.5, v2); v2.sub(v).normalize();
        for (const e of [-1, 1]) { pos.push(v.x, 0, v.z); aD.push(d, e, -v2.z, v2.x); }
        if (d + 1.5 <= 656) { const q = i * 2; idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
      }
      const gl = new THREE.BufferGeometry(); gl.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gl.setAttribute('aD', new THREE.Float32BufferAttribute(aD, 4)); gl.setIndex(idx);
      gl.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4000);
      add(gl, new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false,
        blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...X },
        vertexShader: /* glsl */`
          uniform float uResY, uBurin; attribute vec4 aD;
          varying vec2 vQ;
          #include <fog_pars_vertex>
          ${SEA_GLSL}
          void main(){
            vec3 wp = position; 
            vec4 mv0 = viewMatrix*vec4(wp.x, 0., wp.z, 1.);
            float pxw = max(-mv0.z, .1)*2./(projectionMatrix[1][1]*uResY);
            wp.xz += aD.zw*aD.y*max(.34, 1.5*pxw);
            wp.y = heroSea(wp.xz)+.16;
            vQ = vec2(aD.y, uBurin-aD.x);
            vec4 mvPosition = viewMatrix*vec4(wp, 1.); gl_Position = projectionMatrix*mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uPaper, uInk, uInkFar;
          varying vec2 vQ;
          ${FOG_FRAG}
          void main(){
            float f = eFog();
            vec3 ink = mix(uInk*.25, uInk*1.4, smoothstep(0., 40., vQ.y));
            float a = smoothstep(0., .6, vQ.y)*(1.-smoothstep(.55, 1., abs(vQ.x)))*(1.-smoothstep(.45, .95, f));
            gl_FragColor = vec4(mix(ink, uInkFar, smoothstep(0., .6, f)), a);
          }` }), -0.27);
    }
    {
      // swarf: curls of copper thrown from the burin on ballistic paths
      const pen = makePen(); pen.set(6, 0.9, 0.1);
      pen.grid(26, 1, (u, v, o) => { const a = u * TAU * 2.6, r = 0.75 * (0.5 + 0.5 * u); o[0] = Math.cos(a) * r; o[1] = Math.sin(a) * r; o[2] = (u - 0.5) * 4.4 + (v - 0.5) * 0.75; }, [9, 0.75]);
      const base = pen.build(), n = 52, iS = new Float32Array(n * 4), iV = new Float32Array(n * 4), srng = rng.fork('swarf'), v = new THREE.Vector3();
      for (let i = 0; i < n; i++) {                                           // the last twelve are the first curls off the tip (24.5-26.2 s)
        const T0 = i < 40 ? 25.3 + (i / 40) * 7 + srng.range(0, 0.15) : 24.5 + (i - 40) * 0.14 + srng.range(0, 0.1); coastPt(burinD(T0), v);
        iS[i * 4] = v.x; iS[i * 4 + 1] = 1.5; iS[i * 4 + 2] = v.z; iS[i * 4 + 3] = T0;
        const out = srng.range(-5, 9), fw = srng.range(6, 15);
        iV[i * 4] = DIR2.x * fw - LEFT2.x * out; iV[i * 4 + 1] = srng.range(9, 15); iV[i * 4 + 2] = DIR2.z * fw - LEFT2.z * out; iV[i * 4 + 3] = srng.range(2, 7) * (srng.chance(0.5) ? 1 : -1);
      }
      const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.instanceCount = n;
      for (const k of ['position', 'normal', 'aHatch', 'aM']) g.setAttribute(k, base.attributes[k]);
      g.setAttribute('iS', new THREE.InstancedBufferAttribute(iS, 4)); g.setAttribute('iV', new THREE.InstancedBufferAttribute(iV, 4)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4000);
      const sw = { side: THREE.DoubleSide, vHead: 'attribute vec4 iS, iV;',
        vBody: `float age = uT-iS.w, on = step(0., age)*(1.-smoothstep(2.6, 3.4, age))*smoothstep(0., .25, age);
          float a = age*iV.w, c = cos(a), s = sin(a);
          p = vec3(p.x*c-p.z*s, p.y, p.x*s+p.z*c)*on; n = vec3(n.x*c-n.z*s, n.y, n.x*s+n.z*c);
          vec3 ctr = iS.xyz+vec3(iV.x*age, iV.y*age-4.9*age*age, iV.z*age); ctr.y = max(ctr.y, .3);
          wp = vec4(ctr+p, 1.); wn = normalize(n);` };
      add(g, eMat(U, X, sw), 0); add(g, eMat(U, X, { ...sw, outline: true, px: 1.8, maxW: '.12' }), 0);
    }
    await ctx.yield();

    // waterlines: spreading rings round every island, the ring's feet, the second ship, and dotted splash rings
    ripples.push([ringPos.x + LEFT2.x * 6, ringPos.z + LEFT2.z * 6, 1.3, 11, 1, -1, 0, 0], [ringPos.x - LEFT2.x * 6, ringPos.z - LEFT2.z * 6, 1.3, 11, 1, -1, 0, 0]);
    const shipRipple = ripples.length; ripples.push([-42, 150, 7, 16, 0.9, -1, 0, 0]);
    const burinRipple = ripples.length; ripples.push([0, 0, 0, 0.001, 1, -1, 0, 0]);
    let rippleA;
    await ctx.yield();
    {
      const n = ripples.length, pos = [], idx = [], nr = 5, na = 30, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
      for (let i = 0; i <= nr; i++) for (let j = 0; j <= na; j++) pos.push(i / nr, (j / na) * TAU, 0);
      for (let i = 0; i < nr; i++) for (let j = 0; j < na; j++) { const a = i * (na + 1) + j; idx.push(a, a + na + 1, a + na + 2, a, a + na + 2, a + 1); }
      ripples.forEach((r, i) => { iA.set(r.slice(0, 4), i * 4); iB.set(r.slice(4, 8), i * 4); });
      const g = new THREE.InstancedBufferGeometry(); g.instanceCount = n;
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      rippleA = new THREE.InstancedBufferAttribute(iA, 4); rippleA.setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('iA', rippleA); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4000);
      add(g, new THREE.ShaderMaterial({
        fog: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false,
        blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...X },
        vertexShader: /* glsl */`
          uniform float uT, uBurin; attribute vec4 iA, iB;
          varying vec3 vR; varying vec3 vK;
          #include <fog_pars_vertex>
          ${SEA_GLSL}
          void main(){
            float age = uT-iB.y;
            float life = iB.y < 0. ? 1. : step(0., age)*clamp(1.-age/2.6, 0., 1.);
            float grow = iB.y < 0. ? 1. : clamp(age/1.8, .05, 1.);
            float rs = iB.w > 0. ? smoothstep(iB.w, iB.w+30., uBurin) : 1.;
            float d = position.x*iA.w*grow, r = iA.z*rs+d;
            vec3 wp = vec3(iA.x+cos(position.y)*r, 0., iA.y+sin(position.y)*r);
            wp.y = heroSea(wp.xz)+.14;
            vR = vec3(d, position.y, r); vK = vec3(iA.w*grow, iB.z, iB.x*life*rs);
            vec4 mvPosition = viewMatrix*vec4(wp, 1.); gl_Position = projectionMatrix*mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          ${ENGRAVE_GLSL}
          ${FOG_FRAG}
          varying vec3 vR; varying vec3 vK;
          void main(){
            float d = vR.x, lifeR = clamp(1.-d/max(vK.x, .01), 0., 1.);
            float ph = d/1.9-uTime*.33*(1.-vK.y), wph = fwidth(d)/1.9+1e-4;
            float arc = vR.y*vR.z;
            float brk = smoothstep(.75-lifeR*.85, 1.05-lifeR*.85, eN1(arc*.16+floor(ph+.5)*7.3));
            brk *= mix(1., step(.45, fract(arc*.8)), vK.y);
            float hw = wph*(.9+1.7*lifeR*lifeR)*brk;
            float lines = (1.-smoothstep(hw-wph*.7, hw+wph*.7, abs(fract(ph+.5)-.5)))*step(1e-5, hw)*(.45+.55*lifeR);
            lines *= 1.-smoothstep(.22, .45, wph);
            float dark = (1.-smoothstep(0., 1.8, d))*.4*(1.-vK.y);
            float f = eFog();
            float a = max(lines, dark)*vK.z*(1.-smoothstep(.45, 1., f));
            vec3 ink = mix(uInk, uInkFar, smoothstep(0., .5, f));
            gl_FragColor = vec4(mix(ink, uWashA*.6, dark*(1.-lines)), a);
          }` }), -0.26);
    }

    // ---- 5h. the bow rig: this world's own ride, placed at the camera every frame --------------
    await ctx.yield();
    const rig = new THREE.Group(); scene.add(rig);
    const sparAt = (z) => -3.95 + 1.8 * ((-z - 0.5) / 13.9);                 // height of the bowsprit's axis at ride-space z
    {
      const pen = makePen();
      const sp = []; for (let i = 0; i <= 7; i++) { const z = -0.5 - (i / 7) * 13.9; sp.push([0, sparAt(z), z]); }
      pen.set(3, 0.7, 0.24); pen.tube(sp, (t) => 0.31 - 0.14 * t, 10);
      pen.set(0, 0, 0.55);
      for (let k = 0; k < 9; k++) { const z = -4.6 - k * 1.08, r = 0.33 - 0.14 * ((-z - 0.5) / 13.9); pen.tube([[0, sparAt(z + 0.12), z + 0.12], [0, sparAt(z - 0.12), z - 0.12]], r + 0.035, 10, true, false); }
      pen.set(3, 0.5, 0.42);                                                  // gammoning lashings
      for (let k = 0; k < 5; k++) { const z = -5.2 - k * 0.16; for (const sd of [-1, 1]) pen.tube([[sd * 0.2, sparAt(z) + 0.24, z], [sd * 0.36, sparAt(z) - 0.5, z - 0.1], [sd * 0.2, sparAt(z) - 1.5, z - 0.5]], 0.055, 4, false, false); }
      const yz = -9.6, yy = sparAt(yz) - 0.46;
      pen.set(3, 0.6, 0.3); pen.tube([[-4.4, yy + 0.1, yz], [-2, yy, yz], [2, yy, yz], [4.4, yy + 0.1, yz]], (t) => 0.085 + 0.06 * Math.sin(Math.PI * t), 6);
      for (let c = 0; c < 6; c++) {                                            // the spritsail, six cloths, bellied forward
        pen.set(0, 0, c % 2 ? 0.2 : 0.11);
        pen.grid(3, 8, (a, b, o) => { const u = (c + a) / 6, s = Math.sin(Math.PI * u), f = Math.sin(Math.PI * (0.08 + 0.84 * b));
          o[0] = (u * 2 - 1) * 4.15 * (1 - 0.17 * b); o[1] = yy - 0.1 - b * (3.5 - 0.7 * s * b) + 0.2 * (1 - b) * Math.pow(Math.abs(u * 2 - 1), 2); o[2] = yz - 0.1 - 1.35 * s * f - 0.25 * b; },
        [8.3 / 6, 3.4], (a, b) => 0.085 * Math.sin(Math.PI * (c + a) / 6) * b);
      }
      pen.set(5, 0, 0);                                                        // reef points
      for (let k = 0; k < 12; k++) { const u = (k + 0.5) / 12, x = (u * 2 - 1) * 4.0, z = yz - 0.16 - 1.35 * Math.sin(Math.PI * u) * Math.sin(Math.PI * 0.36); pen.tube([[x, yy - 1.05, z - 0.05], [x + 0.04, yy - 1.42, z - 0.1]], 0.035, 4, false, false); }
      // The lion figurehead seen from behind: a small carved skull under the spar, two ear tufts, and a mane of sixteen
      // S-curled locks in two tiers fanning back toward us. Each lock is a tapering tube ringed with hatch and only
      // washed with gilt (wash 6 at 0.64), so it reads as engraved gilded carving; nothing rises above the spar's axis.
      {
        const HY = -4.34, HZ = -7.86;
        pen.set(6, 0.62, 0.34); pen.blob(0, HY, HZ - 0.1, 0.5, 0.52, 0.58, 3, noise, 0.1);
        for (const sd of [-1, 1]) pen.tube([[sd * 0.3, HY + 0.36, HZ - 0.28], [sd * 0.4, HY + 0.6, HZ - 0.24], [sd * 0.47, HY + 0.78, HZ - 0.14]], (t) => 0.15 - 0.11 * t, 6, true);
        const lock = (phi, sd, len, zoff, r0, k) => {
          const pts = [], cp = Math.cos(phi), sp = Math.sin(phi), ph = k * 2.399;
          for (let i = 0; i <= 10; i++) {
            const t = i / 10, c = Math.max(0, (t - 0.7) / 0.3) * 4.4, cr = 0.11 + 0.03 * Math.sin(ph * 3);
            let rho = 0.36 + len * (0.86 * t - 0.3 * t * t), z = HZ + zoff + len * 0.95 * Math.pow(t, 0.85);
            const tau = 0.2 * len * Math.sin(t * 5.4 + ph) * Math.min(1, t * 2.5);          // the S of the lock
            rho += cr * (1 - Math.cos(c)); z -= cr * Math.sin(c) * 1.2;                        // the curled tip
            pts.push([sd * (sp * rho + cp * tau), HY + cp * rho - sp * tau * 0.8 - 0.3 * len * t * t, z]);
          }
          pen.set(6, 0.64, 0.24 + 0.1 * (k % 3 === 0 ? 1 : 0) + (zoff < 0.1 ? 0.08 : 0));
          pen.tube(pts, (t) => r0 * (1 - 0.78 * Math.pow(t, 1.3)) + 0.012, 7, true);
        };
        let k = 0;
        for (const sd of [-1, 1]) {
          for (const [deg, len] of [[46, 1.3], [72, 1.45], [100, 1.5], [130, 1.35], [162, 1.2]]) lock(deg * Math.PI / 180, sd, len, -0.02, 0.22, k++);   // outer tier
          for (const [deg, len] of [[30, 0.92], [59, 1.05], [88, 1.0]]) lock(deg * Math.PI / 180, sd, len, 0.3, 0.19, k++);                               // inner tier, lying over it
        }
      }
      for (const sd of [-1, 1]) {                                              // beakhead rails, timbers and gratings
        const rail = (dy) => { const pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([sd * (2.5 - 2.0 * Math.pow(t, 1.4)), -3.2 + dy - 1.0 * t + 0.5 * Math.sin(Math.PI * t) * 0.4, -1.2 - 7.2 * t]); } return pts; };
        pen.set(3, 0.7, 0.32); pen.tube(rail(0), 0.12, 6); pen.tube(rail(-0.75), 0.1, 6);
        const top = rail(0), bot = rail(-0.75);
        pen.set(3, 0.6, 0.45); for (let i = 1; i < 6; i++) pen.tube([top[i], bot[i]], 0.07, 4, false, false);
      }
      pen.set(3, 0.6, 0.4);
      pen.grid(6, 10, (a, b, o) => { const w = 2.3 - 1.85 * Math.pow(b, 1.4); o[0] = (a * 2 - 1) * w; o[1] = -4.15 - 0.85 * b; o[2] = -1.2 - 7.0 * b; }, [4, 7]);
      pen.set(2, 0.9, 0.1);                                                    // rose pennant at the tip
      pen.grid(9, 1, (a, b, o) => { o[0] = 0.12 + a * 2.7; o[1] = sparAt(-14.4) + 0.12 - b * 0.55 * (1 - a * 0.85) - 0.3 * a * a; o[2] = -14.35 - a * 0.9; }, [2.7, 0.55], (a) => 0.3 * a);
      const g = pen.build(); const m1 = new THREE.Mesh(g, matFill), m2 = new THREE.Mesh(g, eMat(U, X, { outline: true, px: 2.0, maxW: '.05',
        vBody: `float fl = aM.w; p += n*fl*(sin(uTime*2.3+aHatch.x*.9+aHatch.y*.5)*.6+sin(uTime*5.1+aHatch.y*1.7)*.25);
        wp = modelMatrix*vec4(p, 1.); wn = normalize(mat3(modelMatrix)*n);` }));
      m1.frustumCulled = m2.frustumCulled = false; rig.add(m1, m2);
    }
    await ctx.yield();
    {
      // spray strokes thrown off the cutwater (ride space)
      const n = 80, pos = [], aS = [], idx = [], prng = rng.fork('spray');
      for (let i = 0; i < n; i++) { const sd = i % 2 ? 1 : -1, ph = prng(), vl = prng.range(1.5, 5.5), vy = prng.range(7.5, 10.8), r4 = prng();
        for (let k = 0; k < 4; k++) { pos.push(sd, vl, vy); aS.push((k & 1) * 2 - 1, k >> 1, ph, r4); } const o = i * 4; idx.push(o, o + 1, o + 3, o, o + 3, o + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 4)); g.setIndex(idx);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
        fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...U, ...X },
        vertexShader: /* glsl */`
          uniform float uTime, uResY; attribute vec4 aS;
          varying vec2 vQ; varying float vA;
          vec3 arc(float a){ return vec3(position.x*(.9+position.y*a), -7.6+position.z*a-4.9*a*a, -6.6-2.5*a+5.5*a*a+aS.w*1.5); }
          void main(){
            float cyc = fract(uTime*(.55+.25*aS.w)+aS.z), age = cyc*1.9;
            vec4 p0 = modelViewMatrix*vec4(arc(age), 1.), p1 = modelViewMatrix*vec4(arc(max(age-.085, 0.)), 1.);
            vec4 mvPosition = mix(p0, p1, aS.y);
            vec2 dir = p1.xy-p0.xy; dir = dir/max(length(dir), 1e-4);
            float pxw = max(-mvPosition.z, .1)*2./(projectionMatrix[1][1]*uResY), hw = max(.028, .75*pxw);
            mvPosition.xy += vec2(-dir.y, dir.x)*aS.x*hw;
            vQ = aS.xy; vA = smoothstep(0., .2, age)*(1.-smoothstep(1.3, 1.9, age))*min(1., .028/hw+.5);
            gl_Position = projectionMatrix*mvPosition;
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uInk; varying vec2 vQ; varying float vA;
          void main(){ float tp = sin(3.14159*clamp(vQ.y, 0., 1.)); gl_FragColor = vec4(uInk, vA*(1.-smoothstep(tp*.9-.3, tp*.9+.05, abs(vQ.x)))*.85); }` }));
      m.frustumCulled = false; m.renderOrder = 4; rig.add(m);
    }
    await ctx.yield();

    // line-rain round the lens: a camera-wrapped volume of ruled strokes (the curtain at 17-19 s, the gale)
    const uRainAmt = { value: 0 }, uRainThick = { value: 0 }, uGust = { value: new THREE.Vector2(0.16, 0.08) };
    {
      const n = Math.round(760 * detail), pos = [], aQ = [], idx = [], rr = rng.fork('rain');
      for (let i = 0; i < n; i++) { const x = rr(), y = rr(), z = rr(), l = rr.range(1.8, 3.6);
        for (let k = 0; k < 4; k++) { pos.push(x, y, z); aQ.push((k & 1) * 2 - 1, k >> 1, l, i / n); } const o = i * 4; idx.push(o, o + 1, o + 3, o, o + 3, o + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(aQ, 4)); g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4000);
      add(g, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...U, ...X, uRainAmt, uRainThick, uGust },
        vertexShader: /* glsl */`
          uniform float uTime, uResY, uRainAmt, uRainThick; uniform vec3 uCam; uniform vec2 uGust; attribute vec4 aQ;
          varying vec2 vQ; varying float vA;
          void main(){
            vec3 box = vec3(56., 44., 56.);
            vec3 p = position*box; float sp = 30.*(.8+.4*fract(position.x*7.3));
            p.y -= uTime*sp; p.xz += uGust*uTime*sp;
            vec3 top = uCam+mod(p-uCam, box)-box*.5;
            float sl = aQ.z*(1.+.6*uRainThick);                                  // under the arch the strokes are longer and heavier
            vec3 bot = top+vec3(uGust.x*sl, -sl, uGust.y*sl);
            vec4 vt = viewMatrix*vec4(top, 1.), vb = viewMatrix*vec4(bot, 1.);
            vec4 mvPosition = mix(vt, vb, aQ.y);
            vec2 dir = vb.xy-vt.xy; dir = dir/max(length(dir), 1e-4);
            float depth = max(-mvPosition.z, .1), pxw = depth*2./(projectionMatrix[1][1]*uResY);
            float hmin = mix(.02, .042, uRainThick), hw = min(max(hmin, mix(.8, 1.25, uRainThick)*pxw), mix(2.2, 2.7, uRainThick)*pxw);
            mvPosition.xy += vec2(-dir.y, dir.x)*aQ.x*hw;
            float dist = distance(top, uCam);
            vQ = aQ.xy; vA = step(aQ.w, uRainAmt)*smoothstep(.9, 2.4, dist)*(1.-smoothstep(20., 27., dist))*step(.2, bot.y)*min(1., hmin/hw*2.4+.15)*mix(1., 1.25, uRainThick);
            gl_Position = projectionMatrix*mvPosition;
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uInk; varying vec2 vQ; varying float vA;
          void main(){ float tp = pow(max(sin(3.14159*clamp(vQ.y, 0., 1.)), 0.), .6); gl_FragColor = vec4(uInk*1.2, vA*(1.-smoothstep(tp*.9-.35, tp*.9+.05, abs(vQ.x)))*.8); }` }), 3.5);
    }
    await ctx.yield();

    // ---- 5i. update and return ----------------------------------------------------------------
    const camP = new THREE.Vector3(), cq = new THREE.Quaternion(), cs = new THREE.Vector3(), fwd = new THREE.Vector3(), tg = new THREE.Vector3();
    const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), eul = new THREE.Euler(0, 0, 0, 'YXZ'), size = new THREE.Vector2();
    const archSurge = (u) => 24 * sstep(0.362, 0.485, u) * (1 - sstep(0.52, 0.58, u));     // metres the middle arch's feet slide down the course
    const archLean = (u) => 20 * sstep(0.362, 0.44, u) * (1 - sstep(0.52, 0.58, u));        // and how far its crown leans ahead of them
    const archPoi = new THREE.Vector3();
    const headRest = hero.anchors.head.clone(), pacO = S0.clone().addScaledVector(LEFT2, -38).setY(0), shipPos = new THREE.Vector3(-42, 0, 150);
    for (const d of dolphins) d.rotation.order = 'YXZ';
    ship.rotation.order = 'YXZ';
    const shipAt = (T, out) => {
      const z = 150 - 8.5 * Math.min(T, 7) - 3 * Math.max(0, T - 7) - 6 * (1 - Math.exp(-Math.max(0, T - 7) / 2.5));
      return out.set(-42 - 34 * sstep(6, 14, T), 0, z);
    };
    function update(dt, time, camera, u) {
      const T = u * DUR, dShip = u * LEN;
      camera.matrixWorld.decompose(camP, cq, cs);
      fwd.set(0, 0, -1).applyQuaternion(cq);
      if (ctx.renderer) X.uResY.value = ctx.renderer.getDrawingBufferSize(size).y;
      X.uCam.value.copy(camP); X.uT.value = T; SEA.uSeaT.value = time;
      SEA.uHill.value.z = 12.5 * sstep(440, 526, dShip);                       // the last great swell lifts sea and ship
      dome.position.copy(camP);

      // the serpent: the rise (7-13 s), then the pacing coils to starboard (27-35 s) and the sounding (35-38 s)
      hero.setProgress(hero.progressFromU(u));
      // 15-20 s: the middle arch travels with the ship and leans over the bow, so we sail under it for three seconds
      const surge = archSurge(u), lean = archLean(u);
      hero.setSurge(surge, lean);
      X.uGloom.value.set(0, -8 - surge - lean * 0.5, 95, 0.46 * sstep(0.362, 0.41, u) * (1 - sstep(0.5, 0.56, u)));
      // the pacing coils: the pose switches behind the beam (24.4-25 s), the lead coil is on the starboard bow by
      // 25.5 s, paces us, then pulls ahead; from 28.5 s the timing is the old one
      const travel = dShip - 376.8 + lerp(-20, 170, sstep(25.6, 30, T)) + 85 * sstep(24.2, 25.1, T) * (1 - sstep(25.6, 28.5, T));
      hero.setPacing(sstep(24.4, 25, T), travel, sstep(35, 38.2, T), pacO, DIR2);
      hero.update(dt, time, camera);
      const caps = hero.capsules; for (let i = 0; i < 17; i++) capU[i].set(caps[i * 4], caps[i * 4 + 1], caps[i * 4 + 2], caps[i * 4 + 3]);

      // rain round the lens: the curtain at the rain foot, more in a gale
      const nearFoot = weather === 'calm' ? 0 : 1 - sstep(30, 85, Math.hypot(camP.x, camP.z + 8));
      const nearArch = (1 - sstep(38, 80, Math.hypot(camP.x, camP.z + 8 + surge + lean * 0.5))) * sstep(0.3, 0.37, u) * (1 - sstep(0.5, 0.55, u));
      const easing = sstep(0.46, 0.5, u);                                      // it thins as the gaze drops onto the head
      uRainAmt.value = Math.max(weather === 'gale' ? 0.55 : 0, nearFoot * 0.9, nearArch * (1 - 0.4 * easing));
      uRainThick.value = nearArch * (1 - 0.75 * easing);
      uGust.value.set(0.16 + 0.07 * Math.sin(time * 0.7), 0.08 + 0.05 * Math.sin(time * 0.43 + 1));

      // the second ship: on the port bow at entry, heeling away to port as the sea bulges
      shipAt(T, shipPos); shipAt(T + 0.5, v1);
      const sy = heightAt(shipPos.x, shipPos.z);
      ship.position.set(shipPos.x, sy * 0.55 - 0.2, shipPos.z);
      ship.rotation.set((heightAt(shipPos.x, shipPos.z - 12) - heightAt(shipPos.x, shipPos.z + 12)) * 0.012, Math.atan2(-(v1.x - shipPos.x), -(v1.z - shipPos.z)), -0.13 - 0.05 * Math.sin(time * 0.7) + 0.16 * sstep(6, 9, T) * (1 - sstep(12, 16, T)));
      rippleA.setXYZW(shipRipple, shipPos.x, shipPos.z + 2, 7, 16); rippleA.needsUpdate = true;
      for (let i = 0; i < oarBanks.length; i++) {                              // the stroke: a shear about the thole pins (sweep, then lift)
        const b = oarBanks[i], sd = b.userData.sd, th = time * 1.7, sw = 0.34 * Math.sin(th), lf = 0.085 + 0.085 * Math.cos(th);
        b.matrix.set(1, 0, 0, 0, lf * sd, 1, 0, -lf * 3.6, sw * sd, 0, 1, -sw * 3.6, 0, 0, 0, 1); b.matrixWorldNeedsUpdate = true;
      }

      // gulls: the ship's wake, then the serpent's head and spouts, then over the pacing coils
      if (T < 24.6) v1.set(shipPos.x, 24, shipPos.z + 20).lerp(v2.set(headRest.x - 4, headRest.y + 20, headRest.z + 6), sstep(10.5, 15, T));
      else v1.copy(pacO).addScaledVector(DIR2, travel - 30).setY(30);
      gullC.lerp(v1, T < 0.01 || dt <= 0 ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 1.4));

      // dolphins on the bow wave, low to port, from 26 s; they peel away before the dive
      path.tangentAt(u, tg); const pitchPath = Math.asin(Math.max(-1, Math.min(1, tg.y)));
      const tl = Math.hypot(tg.x, tg.z) || 1, tx = tg.x / tl, tz = tg.z / tl;
      const ds = sstep(26, 27.3, T) * (1 - sstep(36.6, 38, T));
      for (let i = 0; i < 3; i++) {
        const d = dolphins[i], ah = 15 + i * 4.6, sd = 9.5 + i * 2.3 + 7 * sstep(36, 38, T), ph = time * 1.3 + i * 2.2;
        const x = camP.x + tx * ah + tz * sd, z = camP.z + tz * ah - tx * sd;
        d.position.set(x, heightAt(x, z) + 2.5 * Math.sin(ph) - 1.1, z);
        d.rotation.set(Math.cos(ph) * 0.8, Math.atan2(-tx, -tz), 0); d.scale.setScalar(Math.max(0.001, 1.35 * ds));
      }

      // the burin cuts the coast (27.3-34.6 s); islands, sprigs and ripples follow X.uBurin
      const bd = burinD(T); X.uBurin.value = burinT(T) < 25 ? 0 : bd;
      coastPt(bd, v1); burin.position.set(v1.x, heightAt(v1.x, v1.z) + 0.2, v1.z);
      const bs = sstep(24.2, 24.7, T) * (1 - sstep(32.5, 33.3, T));
      burin.rotation.x = 0.05 * Math.sin(time * 23); burin.scale.setScalar(Math.max(0.001, 2.6 * bs));
      rippleA.setXYZW(burinRipple, v1.x, v1.z, 1.1 * bs, 0.001 + 10 * bs);             // waterlines round the cutting tip
      X.uWhale.value = rare ? sstep(35.3, 39.5, T) : 0;
      for (let i = 0; i < needles.length; i++) { const nd = needles[i]; nd.rotation.y = nd.userData.a0 + 0.1 * Math.sin(time * 0.8 + i * 2) + 0.03 * Math.sin(time * 2.9 + i); }

      // the bow rig: yaw between course and gaze, pitch from the course and the swell under the stem
      const yawPath = Math.atan2(-tx, -tz), yawCam = Math.atan2(-fwd.x, -fwd.z);
      let dy = yawCam - yawPath; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      const yaw = yawPath + dy * 0.55, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      const hStem = heightAt(camP.x + fx * 11, camP.z + fz * 11, true), hStern = heightAt(camP.x - fx * 15, camP.z - fz * 15, true), hMid = heightAt(camP.x, camP.z, true);
      const hullPitch = Math.max(-0.045, Math.min(0.045, (hStem - hStern) / 26 * 0.5));
      const gp = Math.asin(Math.max(-1, Math.min(1, fwd.y)));
      // the rig follows the gaze, but less so when the gaze lifts far above the bow (under the arch), and the bow
      // drops as the ship dives for the ring so that the spar's tip stays under its lower rim
      const rigPitch = (gp > 0.1 ? 0.1 + (gp - 0.1) * 0.62 : gp) * 0.95 - 0.07 * sstep(0.745, 0.84, u) - 0.09 * sstep(0.9, 0.97, u);
      eul.set(rigPitch + hullPitch, yaw, -dy * 0.12 + 0.012 * Math.sin(time * 0.6));
      rig.quaternion.setFromEuler(eul);
      rig.position.copy(camP); rig.position.y += Math.max(-1, Math.min(1, hMid * 0.3)) - 0.15;
    }
    update(0, 0, { matrixWorld: new THREE.Matrix4().makeTranslation(path.start.x, path.start.y, path.start.z) }, 0);

    return {
      scene, path, duration: DUR, title: plate.name,
      camera: { fov: 62, near: 0.3, far: 5000, sway: 0.3, bank: 0.4 },
      pois: [
        { at: () => v2.copy(shipPos).setY(16), from: 0.02, to: 0.16, weight: 0.2 },
        // THE image (16.5-19 s): up into the belly of the leaning arch, a little to starboard, then down onto the head
        { at: (time, u) => archPoi.set(7, 30, -9 - archSurge(u) - archLean(u) * 0.75), from: 0.362, to: 0.468, weight: 0.64 },
        { at: headRest.clone().setY(13), from: 0.43, to: 0.575, weight: 0.6, fade: 0.2793 },
        { at: path.end.clone(), from: 0.66, to: 1, weight: 0.8 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#F0C24E', glow: 0.8, tilt: true, revealDistance: 260 },
      // EXPOSURE, BLOOM, GRADE: paper is written at 0.9 x vellum so it never clips; only gold leaf passes the threshold
      post: { exposure: 1, bloom: { strength: 0.35, radius: 0.55, threshold: 1.1 },
        grade: { saturation: 1, contrast: 1.03, tint: '#ffffff', shadowTint: '#000000', vignette: 0.3, grain: 0.018, aberration: 0 } },
      ride: 'none', style: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
