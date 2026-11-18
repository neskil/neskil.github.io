// THE ICE FINGER: hero set piece for the world "brinicle-ice-finger".
//
// What it is
//   A brinicle and the river of frost it makes, built at 8x life size. A hollow, lumpy tube of ice
//   hangs from a crater of platelets in the sea-ice ceiling: ~70 stacked growth collars with flared,
//   wavering lower lips, knuckles, side spurs and a fringe of feather crystals, the wall thin enough to
//   show cyan brine streaming down the core. It grows (setLength / setProgress): the newest collar
//   condenses at the tip as a bright frazil halo, and a shimmering ribbon of brine falls from the open
//   tip. At touchdown (setTouch) a ring of ice dust puffs outward, and then the frost river runs
//   (setFront): a branching web of white ice with a cyan leading edge (a hot line, then some twelve metres of
//   new ice still clear and lit deep cyan from within, before the crust whitens), lifted crust and upright
//   crystal blades that spring up within 4.5 m of the edge, racing downslope along -Z. Once set it still moves: facets and blade tips twinkle, glints run down it,
//   the marbling crawls, the lobes smoke; gaps and islands inside it are gravel dusted with rime, with a lit shoreline.
//
// Local space
//   Origin = the touchdown point on the sea bed (y = 0). +Y up. The ceiling is at y = height (64).
//   Front = +Z (the entry camera arrives from +Z looking toward -Z); the river runs toward -Z.
//   In the brief's world frame put hero.object at (0, -64, -128), no rotation, scale 1.
//
// Driving it (never wall-clock in a world; if no setter is ever called, update() loops a demo)
//   hero.setLength(m)      length of the finger in metres, startLength (30) .. height (64 = touching).
//   hero.setProgress(p)    same thing as 0..1 (0 = 30 m long, 1 = touchdown).
//   hero.setTouch(k)       0..1 the touchdown puff ring (0 = nothing, 1 = dissipated). ~2 s of flight.
//   hero.setFront(d)       how far the frost has run, in metres of distance from the touchdown point
//                          (0 = nothing frozen; ~25 = the pool round the foot is frozen; then the river).
//   hero.setLight(dir, color)  key light: world-space direction TOWARD the light (Vector3) and an
//                          optional linear THREE.Color; call every frame to wheel the shafts.
//   hero.tipPosition(out)  local position of the growing tip (use it for the camera poi).
//
// The frost field (so the world's bed, stars, urchins and portal rim use the same test)
//   hero.frost.arrive(x, z)    local x,z -> front distance at which that point freezes (Infinity = never)
//   hero.frost.coverage(x, z)  0..1, frozen web where > 0.5
//   hero.frost.centre(s)       x of the river's centre line at s metres downslope (z = -s)
//   hero.frost.glsl            GLSL: vec4 frostField(vec2 xz) (r = coverage, g = lag/40 m, b = crust height)
//                              and float frostArrive(vec2 xz, vec4 f); frozen when uFront > frostArrive.
//   hero.frost.uniforms        { uFrostMap, uFrostRect, uFront } shared uniform objects for your materials.
//
// anchors (local space)
//   root          (0, 64, 0) where the finger leaves the ceiling.     touchdown  (0, 0, 0).
//   starHuddle    centre of the nine-star huddle, 8 m from the touchdown point, kept just outside the pool.
//   flyThrough    ordered camera points: the entry line, 1.25 anticlockwise turns at radius 17 falling to
//                 radius 11 beside the tip, the held breath 6 m off the bed upslope, past the foot 9 m to
//                 its left, then down the river 4.8 m above the bed. >= 6 m clear of the finger; on the
//                 chase leg the frost crust and blades reach ~2.7 m, as the brief's 4.8 m route intends.
//   viewpoints    { entry, shaft, tip, touchdown, chase }: composed views (positions).
//   portalSeat    { position, normal, radius 7 }: on the river's centre line at its far end, facing upslope.
//   keyDir        the direction toward the key light the piece was composed for.
//
// opts
//   palette      brief palette [indigo, teal, jade, cyan, ice, ochre, vermilion]
//   height       ceiling height above the bed (default 64)        startLength  (default 30)
//   groundAt     (x, z) => bed height in local space (default: level shelf, then an 18 degree slope
//                from z = -42). Pass the world's own bed function so the river lies on it.
//   riverLength  metres of river (default 620)
//   river        false: no river sheet/blades (use hero.frost in your own bed shader)   (default true)
//   bed          true (the default, for the set-piece viewer): the river sheet also draws dark gravel
//                where it is not frozen. IN A WORLD PASS bed: false so only frost and brine are drawn.
//   crater       false: no ceiling crater and platelets (default true)
//   keyDir       Vector3 toward the key light (default: from the left, 35 degrees off vertical)
//
// Size: finger 64 m tall, 7.2 m across at the root, 2 m at the tip; crater 30 m across; river up to
//   ~50 m wide by riverLength. radius/center frame the finger, not the river.
// Cost: ~117k triangles, 8 draw calls (shaft 45k, feathers 8k, crater and platelets 6k, river sheet 30k,
//   blades 26k, ribbons and sprites 2k), one 88x768 data texture, no lights. Build ~300 ms here.
//   Without the river (river: false): ~60k triangles, 6 draw calls.
// Lighting: self-lit ShaderMaterials (they ignore scene lights, honour scene fog): a jade-cyan key from
//   the left crossing the finger, indigo fill. Emitters: core 2.2, frost edge 1.6, newest collar ~2.4.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#061A33', '#0E4C7A', '#2FBF9A', '#6FE6F2', '#DDF3F6', '#B58A3C', '#E8452C'];
const FW = 88, FH = 768, FIELD_HALF = 32, LAG_M = 40;
const VIEW_RADIUS = 30, VIEW_CY = 0.36;   // what the viewer orbits at; the world ignores it

const NOISE_GLSL = /* glsl */`
float bh(vec3 p){ p = fract(p*0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x + p.y + p.z)); }
float bn(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);
  return mix(mix(mix(bh(i), bh(i + vec3(1,0,0)), f.x), mix(bh(i + vec3(0,1,0)), bh(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(bh(i + vec3(0,0,1)), bh(i + vec3(1,0,1)), f.x), mix(bh(i + vec3(0,1,1)), bh(i + vec3(1,1,1)), f.x), f.y), f.z);
}
`;
// radius of the finger at height y while its tip is at uTipY (root 3.6 m, tip 1 m, swelling where the
// newest collar is still condensing)
const RADIUS_GLSL = /* glsl */`
uniform float uTipY;
uniform float uH;
float brRadius(float y){
  float L = max(uH - uTipY, 1.0);
  float d = clamp((y - uTipY)/L, 0.0001, 1.0);
  float dm = max(y - uTipY, 0.0);
  return (1.0 + 2.6*pow(d, 0.8))*(1.0 + 0.32*exp(-dm*0.8));
}
`;
const FROST_GLSL = /* glsl */`
uniform sampler2D uFrostMap;
uniform vec4 uFrostRect;   // x0, z0, 1/width, 1/length
uniform float uFront;
vec4 frostField(vec2 xz){
  vec2 uv = vec2((xz.x - uFrostRect.x)*uFrostRect.z, (uFrostRect.y - xz.y)*uFrostRect.w);
  return textureLod(uFrostMap, clamp(uv, 0.0, 1.0), 0.0);
}
float frostArrive(vec2 xz, vec4 f){ return length(xz) + f.g*${LAG_M}.0; }
`;
// additive things fade into fog instead of taking its colour
const FOGK_GLSL = /* glsl */`
float fogKeep(){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      return 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #else
    return 1.0;
  #endif
}
`;

function lin(hex) { return new THREE.Color(hex); }
function fogUniforms(u) { return THREE.UniformsUtils.merge([THREE.UniformsLib.fog, u]); }

// ---------------------------------------------------------------- the frost field
// One 88 x 768 RGBA8 map over x -32..32, z +16..-(len): r coverage, g lag (x40 m), b crust height.
async function buildFrostField(ctx, rng, len) {
  const N = ctx.noise, z0 = 16, flen = len + 20;
  const data = new Uint8Array(FW * FH * 4);
  const o1 = rng.range(0, 500), o2 = rng.range(0, 500), o3 = rng.range(0, 500);
  const meander = rng.range(3.5, 6), branchAmp = rng.range(13, 19), wBase = rng.range(4, 5.5), wVar = rng.range(6, 8.5);
  const centre = (s) => (meander * N.n2(s / 90 + o1, 3.1) + 2 * N.n2(s / 31 + o1, 9.7)) * smoothstep(8, 60, s);
  const halfW = (s) => (wBase + wVar * (0.5 + 0.5 * N.n2(s / 70 + o2, 1.7))) * (0.55 + 0.45 * smoothstep(0, 50, s));
  const branch = (s) => branchAmp * N.n2(s / 58 + o3, 5.3);
  for (let j = 0; j < FH; j++) {
    const z = z0 - (j + 0.5) / FH * flen, s = -z;
    const cx = centre(Math.max(s, 0)), hw = halfW(Math.max(s, 0)), bo = branch(Math.max(s, 0));
    const gate = smoothstep(-2, 7, s), bGate = smoothstep(4.5, 8, Math.abs(bo)) * smoothstep(25, 60, s);
    for (let i = 0; i < FW; i++) {
      const x = -FIELD_HALF + (i + 0.5) / FW * FIELD_HALF * 2;
      const wx = x + 3.2 * N.n2(x / 13 + o2, z / 13);
      const v1 = 1 - Math.abs(N.n2(wx / 8 + o1, z / 30 + 7)), v2 = 1 - Math.abs(N.n2(wx / 3.5 + 20, z / 12 + o3));
      const vein = v1 * 0.7 + v2 * 0.3;
      const island = N.n2(x / 6 + 50 + o3, z / 9);
      let raw = Math.max(1 - Math.abs(x - cx) / hw, (0.8 - Math.abs(x - cx - bo) / 3.4) * bGate);
      raw += 1.6 * (vein - 0.7) - 0.9 * smoothstep(0.5, 0.8, island);
      raw = lerp(-1, raw, gate);
      const r = Math.hypot(x, z);
      if (r < 18) {
        const a = Math.atan2(z, x);
        const vr = 1 - Math.abs(N.n2(Math.cos(a) * 2.2 + 3 + o1, Math.sin(a) * 2.2 + r / 14));
        raw = Math.max(raw, (1 - r / 6.5) + 1.5 * (vr - 0.72));
      }
      raw -= 2 * smoothstep(26, 31, Math.abs(x));
      const cov = clamp(0.5 + 1.4 * (raw - 0.1), 0, 1);
      const lag = clamp(3.5 + 8 * (1 - clamp(raw * 1.3, 0, 1)) + 5 * N.n2(x / 11 + 90, z / 34 + o2), 0, LAG_M);   // the lobes trail the leading tongue by at most ~10 m, so the whole front crosses the frame together
      const crust = clamp(0.5 + 0.6 * N.n2(x / 2.4 + 30, z / 2.4 + o1) + 0.25 * (vein - 0.6), 0, 1);
      const k = (j * FW + i) * 4;
      const edge = (i === 0 || i === FW - 1 || j === 0 || j === FH - 1) ? 0 : 1;
      data[k] = Math.round(cov * 255) * edge; data[k + 1] = Math.round(lag / LAG_M * 255); data[k + 2] = Math.round(crust * 255); data[k + 3] = 255;
    }
    if (j % 24 === 23) await ctx.yield();
  }
  const map = new THREE.DataTexture(data, FW, FH, THREE.RGBAFormat, THREE.UnsignedByteType);
  map.magFilter = THREE.LinearFilter; map.minFilter = THREE.LinearFilter; map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  map.generateMipmaps = false; map.needsUpdate = true;
  const sample = (x, z, ch) => {
    const fx = clamp((x + FIELD_HALF) / (FIELD_HALF * 2), 0, 1) * FW - 0.5, fy = clamp((z0 - z) / flen, 0, 1) * FH - 0.5;
    const i0 = clamp(Math.floor(fx), 0, FW - 1), j0 = clamp(Math.floor(fy), 0, FH - 1), i1 = Math.min(i0 + 1, FW - 1), j1 = Math.min(j0 + 1, FH - 1);
    const tx = clamp(fx - i0, 0, 1), ty = clamp(fy - j0, 0, 1);
    const a = data[(j0 * FW + i0) * 4 + ch], b = data[(j0 * FW + i1) * 4 + ch], c = data[(j1 * FW + i0) * 4 + ch], d = data[(j1 * FW + i1) * 4 + ch];
    return (lerp(lerp(a, b, tx), lerp(c, d, tx), ty)) / 255;
  };
  const coverage = (x, z) => sample(x, z, 0);
  const arrive = (x, z) => (sample(x, z, 0) > 0.5 ? Math.hypot(x, z) + sample(x, z, 1) * LAG_M : Infinity);
  const rect = new THREE.Vector4(-FIELD_HALF, z0, 1 / (FIELD_HALF * 2), 1 / flen);
  return { map, rect, sample, coverage, arrive, centre: (s) => centre(Math.max(s, 0)), z0, flen };
}

// ---------------------------------------------------------------- the finger: collars, lips, knuckles, spurs
async function buildShaftGeometry(ctx, rng, H) {
  const N = ctx.noise, SEG = 48, TAU = Math.PI * 2;
  const oa = rng.range(0, 300), os = rng.range(0, 300), wob = rng.range(0.7, 1.5);
  const flareMood = rng.range(0.1, 0.2), knuckleMood = rng.range(0.3, 0.75);
  const axisAt = (y) => { const t = clamp(y / H, 0, 1), e = 4 * t * (1 - t) * wob; return [N.n2(y / 22 + oa, 1.3) * e, N.n2(y / 22 + oa, 47.9) * e]; };
  const rref = (y) => 1 + 2.6 * Math.pow(clamp(y / H, 0.0001, 1), 0.8);
  const pos = [], rel = [], axs = [], thin = [], tone = [], idx = [];
  // collars
  const collars = [];
  { let y = H; while (y > 0.01) { let h = rng.range(0.6, 1.2); if (y - h < 0.45) h = y; collars.push({ top: y, h, flare: flareMood * rng.range(0.25, 1.0) * (rng.chance(0.22) ? 2.1 : 1), seed: rng.range(0, 100), tx: rng.range(-1, 1), tz: rng.range(-1, 1), kn: rng.chance(knuckleMood) ? rng.int(1, 3) : 0, ka: rng.range(0, TAU), kw: rng.range(0.22, 0.42), kh: rng.range(0.18, 0.42) }); y -= h; } }
  const RINGS = [[0.0, 0.84, 1.0, 0.25], [0.26, 0.97, 1.0, 0.3], [0.52, 1.08, 0.75, 0.45], [0.76, 1.14, 0.45, 0.75], [0.98, 1.13, 0.2, 1.0], [0.9, 0.9, 0.7, 0.35]];
  let ringCount = 0;
  const lipY = [];
  for (let c = 0; c < collars.length; c++) {
    const C = collars[c];
    for (let k = 0; k < RINGS.length; k++) {
      const [t, base, th, tn] = RINGS[k], lip = k === 3 ? 0.45 : k === 4 ? 1 : 0;
      const yc = C.top - t * C.h;
      for (let i = 0; i <= SEG; i++) {
        const a = (i % SEG) / SEG * TAU, ca = Math.cos(a), sa = Math.sin(a);
        const lump = 1 + 0.11 * N.n3(ca * 1.3 + os, yc * 0.22, sa * 1.3) + 0.05 * N.n3(ca * 3.1, yc * 0.6 + os, sa * 3.1);
        const wave = N.n3(ca * 2.4 + C.seed, C.seed * 0.37, sa * 2.4), wave2 = N.n3(ca * 3.6 + C.seed, 9.1, sa * 3.6);
        let r = base * lump + lip * C.flare * Math.max(0, 0.9 + 1.3 * wave + 0.25 * wave2);
        if (C.kn && k >= 1 && k <= 4) {
          for (let q = 0; q < C.kn; q++) { let da = a - (C.ka + q * 2.3); da = Math.atan2(Math.sin(da), Math.cos(da)); r += C.kh * Math.exp(-(da * da) / (C.kw * C.kw)) * (k === 2 || k === 3 ? 1 : 0.55); }
        }
        let y = yc + (C.tx * ca + C.tz * sa) * 0.1 * C.h - lip * C.h * (0.1 + 0.55 * Math.max(0, 0.5 * wave2 + wave));
        y = clamp(y, 0, H);
        const fl = smoothstep(H - 6.5, H, y); r *= 1 + 1.25 * fl * fl;
        const ax = axisAt(y), R = rref(y);
        pos.push(ax[0] + ca * r * R, y, ax[1] + sa * r * R); rel.push(ca * r, sa * r); axs.push(ax[0], ax[1]);
        thin.push(th * (1 - 0.6 * fl)); tone.push(clamp(tn + 0.25 * wave2, 0, 1));
      }
      ringCount++;
    }
    lipY.push({ y: C.top - 0.95 * C.h, flare: C.flare });
    if (c % 3 === 2) await ctx.yield();
  }
  const W = SEG + 1;
  for (let r = 0; r < ringCount - 1; r++) {
    for (let i = 0; i < SEG; i++) { const a = r * W + i, b = a + 1, c = a + W, d = c + 1; idx.push(a, b, c, b, d, c); }
    if (r % 60 === 59) await ctx.yield();
  }
  const latheVerts = ringCount * W;
  await ctx.yield();
  // side spurs: little icicles that leave the shaft at a knuckle and bend down
  const spurs = rng.int(46, 72), SS = 6, SR = 6;
  for (let s = 0; s < spurs; s++) {
    const y0 = rng.range(5, H - 5), a = rng.range(0, TAU), ca = Math.cos(a), sa = Math.sin(a);
    const ax = axisAt(y0), R0 = rref(y0), rb = rng.range(0.16, 0.34), ln = rng.range(0.9, 2.2) + 1.3 * rng() * (y0 / H), reach = rng.range(0.25, 0.85), tw = rng.range(-0.5, 0.5);
    const base = pos.length / 3;
    for (let k = 0; k <= SR; k++) {
      const u = k / SR, out = R0 * 0.9 + reach * (1 - (1 - u) * (1 - u)), dn = ln * Math.pow(u, 1.35);
      const cx = ax[0] + ca * out - sa * tw * u * u, cz = ax[1] + sa * out + ca * tw * u * u, cy = y0 - dn;
      // frame: tangent of the spur, then two perpendiculars
      const tOut = reach * 2 * (1 - u) + 0.05, tDn = ln * 1.35 * Math.pow(Math.max(u, 0.02), 0.35), tl = Math.hypot(tOut, tDn);
      const tx = ca * tOut / tl, ty = -tDn / tl, tz = sa * tOut / tl;
      const sx = -sa, sz = ca;                                   // side
      const ux = ty * sz, uy = tz * sx - tx * sz, uz = -ty * sx; // up2 = t x side
      const rr = k === SR ? 0.02 : rb * Math.pow(1 - u, 0.75) * (1 + 0.45 * N.n2(s * 3.1 + u * 5, 77.7)) + 0.03;
      for (let i = 0; i < SS; i++) {
        const b = i / SS * TAU, cb = Math.cos(b) * rr, sb = Math.sin(b) * rr;
        const px = cx + sx * cb + ux * sb, py = clamp(cy + uy * sb, 0, H), pz = cz + sz * cb + uz * sb;
        pos.push(px, py, pz); rel.push((px - ax[0]) / R0, (pz - ax[1]) / R0); axs.push(ax[0], ax[1]); thin.push(0.1 + 0.25 * u); tone.push(0.6 + 0.4 * u);
      }
    }
    for (let k = 0; k < SR; k++) for (let i = 0; i < SS; i++) { const a0 = base + k * SS + i, b0 = base + k * SS + (i + 1) % SS, c0 = a0 + SS, d0 = b0 + SS; idx.push(a0, c0, b0, b0, c0, d0); }
    if (s % 12 === 11) await ctx.yield();
  }
  await ctx.yield();
  // typed arrays, filled and handed over in short steps (the build shares its frames with the world before this one)
  const nV = pos.length / 3, P = new Float32Array(pos), IDX = new Uint32Array(idx);
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('aRel', new THREE.BufferAttribute(new Float32Array(rel), 2));
  await ctx.yield();
  g.setAttribute('aAxis', new THREE.BufferAttribute(new Float32Array(axs), 2));
  g.setAttribute('aThin', new THREE.BufferAttribute(new Float32Array(thin), 1));
  await ctx.yield();
  g.setAttribute('aTone', new THREE.BufferAttribute(new Float32Array(tone), 1));
  g.setIndex(new THREE.BufferAttribute(IDX, 1));
  await ctx.yield();
  // smooth normals, accumulated face by face (area-weighted, as computeVertexNormals does) a few thousand at a time
  const NRM = new Float32Array(nV * 3);
  for (let t = 0, nT = IDX.length; t < nT; t += 3) {
    const a = IDX[t] * 3, b = IDX[t + 1] * 3, c = IDX[t + 2] * 3;
    const e1x = P[c] - P[b], e1y = P[c + 1] - P[b + 1], e1z = P[c + 2] - P[b + 2], e2x = P[a] - P[b], e2y = P[a + 1] - P[b + 1], e2z = P[a + 2] - P[b + 2];
    const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
    NRM[a] += nx; NRM[a + 1] += ny; NRM[a + 2] += nz; NRM[b] += nx; NRM[b + 1] += ny; NRM[b + 2] += nz; NRM[c] += nx; NRM[c + 1] += ny; NRM[c + 2] += nz;
    if (t % 18000 === 17997) await ctx.yield();
  }
  await ctx.yield();
  for (let i = 0; i < nV; i++) {
    const k = i * 3, l = Math.hypot(NRM[k], NRM[k + 1], NRM[k + 2]);
    if (l > 0) { NRM[k] /= l; NRM[k + 1] /= l; NRM[k + 2] /= l; }
    if (i % 8000 === 7999) await ctx.yield();
  }
  for (let r = 0; r < ringCount; r++) {   // close the lathe seam
    const a = r * W * 3, b = a + SEG * 3;
    const x = NRM[a] + NRM[b], y = NRM[a + 1] + NRM[b + 1], z = NRM[a + 2] + NRM[b + 2], l = Math.hypot(x, y, z) || 1;
    NRM[a] = NRM[b] = x / l; NRM[a + 1] = NRM[b + 1] = y / l; NRM[a + 2] = NRM[b + 2] = z / l;
  }
  for (let i = latheVerts; i < nV; i++) { const k = i * 3; if (!(Math.hypot(NRM[k], NRM[k + 1], NRM[k + 2]) > 0.5)) { NRM[k] = 0; NRM[k + 1] = -1; NRM[k + 2] = 0; } }
  g.setAttribute('normal', new THREE.BufferAttribute(NRM, 3));
  await ctx.yield();
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, H / 2, 0), H * 0.6);
  return { geometry: g, axisAt, rref, lipY, triangles: idx.length / 3 };
}

const SHAFT_VERT = /* glsl */`
attribute vec2 aRel; attribute vec2 aAxis; attribute float aThin; attribute float aTone;
varying vec3 vN; varying vec3 vW; varying vec3 vP; varying float vD; varying float vThin; varying float vTone;
#include <fog_pars_vertex>
${RADIUS_GLSL}
void main(){
  float R = brRadius(position.y);
  vec3 p = vec3(aAxis.x + aRel.x*R, position.y, aAxis.y + aRel.y*R);
  vD = position.y - uTipY; vP = position; vThin = aThin; vTone = aTone;
  vec4 w = modelMatrix*vec4(p, 1.0); vW = w.xyz;
  vN = mat3(modelMatrix)*normal;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SHAFT_FRAG = /* glsl */`
uniform vec3 uKeyDir; uniform vec3 uKeyCol; uniform vec3 uFillCol; uniform vec3 uIce; uniform vec3 uShade; uniform vec3 uCore;
uniform float uTime; uniform float uCoreI;
varying vec3 vN; varying vec3 vW; varying vec3 vP; varying float vD; varying float vThin; varying float vTone;
#include <fog_pars_fragment>
${NOISE_GLSL}
void main(){
  float rag = bn(vec3(vP.x*1.9, 3.7, vP.z*1.9))*0.9 + bn(vec3(vP.x*5.0, 1.3, vP.z*5.0))*0.5;
  if (vD < rag - 0.05) discard;
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
  vec3 q = vP*4.3; float c1 = bn(q), c2 = bn(q + vec3(7.3, 1.1, 3.7)), c3 = bn(q*2.6 + 11.0), n1 = bn(vP*vec3(1.3, 0.8, 1.3));
  N = normalize(N + 0.42*vec3(c1 - 0.5, (c3 - 0.5)*0.7, c2 - 0.5));
  float ndv = clamp(abs(dot(N, V)), 0.0, 1.0), fres = (1.0 - ndv)*(1.0 - ndv);
  float ndl = dot(N, uKeyDir), wrap = clamp(ndl*0.68 + 0.32, 0.0, 1.0); wrap *= wrap;
  float frost = clamp(vTone*0.8 + n1*0.55 + c3*0.25 - 0.42, 0.0, 1.0);
  vec3 alb = mix(uShade*0.4, uIce*0.7, frost);
  vec3 col = alb*(uKeyCol*wrap*1.25 + uFillCol*0.9);
  // brine streaming down inside the hollow core, seen through the thin wall
  float st = bn(vec3(vP.x*0.9, vP.y*0.26 + uTime*1.5, vP.z*0.9)), st2 = bn(vec3(vP.x*2.7, vP.y*0.9 + uTime*2.6, vP.z*2.7));
  float core = vThin*ndv*ndv*sqrt(ndv)*(0.14 + 0.86*smoothstep(0.38, 0.72, st))*(0.55 + 0.75*st2)*(1.0 - 0.7*frost);
  col = col*(1.0 - 0.5*core) + mix(uCore, uShade, 0.35)*uCoreI*core*0.95;
  // rim light from the key side, cyan-white; a little ice sparkle
  col += mix(uIce, uCore, 0.45)*fres*(0.07 + 0.8*clamp(ndl + 0.3, 0.0, 1.0));
  vec3 Hh = normalize(uKeyDir + V);
  col += uIce*pow(clamp(dot(N, Hh), 0.0, 1.0), 40.0)*step(0.55, c3)*1.4*clamp(ndl*3.0, 0.0, 1.0);
  // the newest collar still condensing
  float fresh = exp(-max(vD, 0.0)*0.75);
  col += uCore*2.3*fresh*(0.55 + 0.45*st2);
  if (!gl_FrontFacing) col = uCore*(0.35 + 1.5*st)*(0.6 + 1.2*fresh) + alb*uFillCol;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- feather crystals on the lips and wall
function buildFeathers(rng, shaft, H, count) {
  const g = new THREE.InstancedBufferGeometry();
  const P = [0, 0, 0, 0.085, 0.3, 0.02, 0, 1, 0, -0.085, 0.3, 0.02, 0, 0.05, 0, 0.02, 0.28, 0.07, 0, 0.8, 0, 0.02, 0.28, -0.07];
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  g.computeVertexNormals();
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    let y, relR, tilt, size;
    if (rng() < 0.74) { const L = shaft.lipY[Math.floor(rng() * shaft.lipY.length)]; y = L.y + rng.range(-0.08, 0.14); relR = 1.08 + L.flare * rng.range(0.5, 1.0); tilt = rng.range(0.7, 1.45); size = rng.range(0.3, 0.8); }
    else { y = rng.range(1, H - 2); relR = rng.range(0.92, 1.02); tilt = rng.range(0.0, 0.9); size = rng.range(0.22, 0.6); }
    y = clamp(y, 0.3, H - 0.5);
    const fl = smoothstep(H - 6.5, H, y); relR *= 1 + 0.7 * fl * fl;
    const ax = shaft.axisAt(y);
    iA.set([y, rng.range(0, Math.PI * 2), relR, size * (1 + 0.5 * (y / H))], i * 4);
    iB.set([ax[0], ax[1], tilt, rng()], i * 4);
  }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4));
  g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, H / 2, 0), H * 0.6);
  return g;
}
const FEATHER_VERT = /* glsl */`
attribute vec4 iA; attribute vec4 iB; uniform vec3 uKeyDir;
varying vec3 vN; varying vec3 vW; varying float vTipK; varying float vD; varying float vSeed; varying float vSide;
#include <fog_pars_vertex>
${RADIUS_GLSL}
void main(){
  float y = iA.x, R = brRadius(y), d = y - uTipY;
  float grow = smoothstep(0.5, 3.6, d);
  vec3 o = vec3(cos(iA.y), 0.0, sin(iA.y)), sd = vec3(-o.z, 0.0, o.x);
  vec3 dir = o*cos(iB.z) - vec3(0.0, 1.0, 0.0)*sin(iB.z);
  vec3 th = cross(sd, dir);
  float ro = iB.w*6.2832, cr = cos(ro), sr = sin(ro);
  vec3 s2 = sd*cr + th*sr, t2 = th*cr - sd*sr;
  vec3 base = vec3(iB.x + o.x*R*iA.z, y, iB.y + o.z*R*iA.z);
  vec3 p = base + (s2*position.x + dir*position.y + t2*position.z)*iA.w*grow;
  vec3 n = s2*normal.x + dir*normal.y + t2*normal.z;
  vTipK = position.y; vD = d; vSeed = iB.w;
  vSide = clamp(dot(normalize(mat3(modelMatrix)*o), uKeyDir)*0.6 + 0.5, 0.0, 1.0);
  vec4 w = modelMatrix*vec4(p, 1.0); vW = w.xyz; vN = mat3(modelMatrix)*n;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FEATHER_FRAG = /* glsl */`
uniform vec3 uKeyDir; uniform vec3 uKeyCol; uniform vec3 uFillCol; uniform vec3 uIce; uniform vec3 uShade; uniform vec3 uCore;
varying vec3 vN; varying vec3 vW; varying float vTipK; varying float vD; varying float vSeed; varying float vSide;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
  float ndl = dot(N, uKeyDir), lit = 0.3 + 0.7*abs(ndl);
  float side = vSide;
  vec3 alb = mix(uShade*0.55, uIce*0.7, 0.45 + 0.4*vTipK + 0.15*vSeed);
  vec3 col = alb*(uKeyCol*lit*(0.25 + 1.2*side) + uFillCol*1.15);
  vec3 Hh = normalize(uKeyDir + V);
  col += uIce*pow(clamp(abs(dot(N, Hh)), 0.0, 1.0), 26.0)*1.3*side;
  col += uCore*(0.06*(1.0 - vTipK) + 1.6*exp(-max(vD, 0.0)*0.7));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- the crater of platelets in the ceiling
function craterDrop(N, r, a, o) {
  const ca = Math.cos(a), sa = Math.sin(a);
  const rim = Math.exp(-Math.pow((r - 8.2) / 2.7, 2)) * (2.6 + 1.3 * N.n2(ca * 1.6 + o, sa * 1.6));
  const lumps = 0.55 * (0.5 + 0.5 * N.n2(ca * r * 0.45 + o, sa * r * 0.45)) + 0.25 * N.n2(ca * r * 1.3, sa * r * 1.3 + o);
  return Math.max(0, (rim + lumps) * (1 - smoothstep(12, 17.5, r)));
}
function buildCraterGeometry(ctx, rng, H) {
  const N = ctx.noise, SEG = 56, RINGS = 18, o = rng.range(0, 200);
  const pos = [], par = [], idx = [];
  for (let k = 0; k <= RINGS; k++) {
    const r = 3.6 + Math.pow(k / RINGS, 1.15) * 14.4;
    for (let i = 0; i <= SEG; i++) {
      const a = (i % SEG) / SEG * Math.PI * 2, d = craterDrop(N, r, a, o);
      pos.push(Math.cos(a) * r, H - d - (k === 0 ? 1.2 : 0) + 0.02, Math.sin(a) * r);
      par.push(0.5 + 0.5 * N.n2(Math.cos(a) * r * 0.16 + o, Math.sin(a) * r * 0.16), 0.5 + 0.5 * N.n2(Math.cos(a) * r * 0.33 + 60, Math.sin(a) * r * 0.33 + o), d / 3.5, 1 - smoothstep(12.5, 17.5, r));
    }
  }
  const W = SEG + 1;
  for (let k = 0; k < RINGS; k++) for (let i = 0; i < SEG; i++) { const a = k * W + i, b = a + 1, c = a + W, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aPar', new THREE.Float32BufferAttribute(par, 4));
  g.setIndex(idx); g.computeVertexNormals();
  return { geometry: g, drop: (r, a) => craterDrop(N, r, a, o) };
}
const CRATER_VERT = /* glsl */`
attribute vec4 aPar; varying vec4 vPar; varying vec3 vP; varying vec3 vN; varying vec3 vW;
#include <fog_pars_vertex>
void main(){
  vPar = aPar; vP = position; vN = mat3(modelMatrix)*normal;
  vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const CRATER_FRAG = /* glsl */`
uniform vec3 uTeal; uniform vec3 uJade; uniform vec3 uOchre; uniform vec3 uCore; uniform vec3 uKeyDir; uniform float uTime; uniform float uCeil;
varying vec4 vPar; varying vec3 vP; varying vec3 vN; varying vec3 vW;
#include <fog_pars_fragment>
${NOISE_GLSL}
void main(){
  float n = bn(vP*vec3(0.9, 1.4, 0.9)), f = bn(vP*3.1 + 5.0), pl = bn(vP*7.0);
  // transmitted daylight: bright where the ice is thin (little drop), dim under the hanging rim
  float thinIce = clamp(1.0 - vPar.z*0.75, 0.0, 1.0);
  float side = clamp(dot(normalize(vec3(vP.x, 0.0, vP.z) + vec3(1e-4, 0.0, 0.0)), uKeyDir)*0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(uTeal*0.55, uJade*0.8, clamp(vPar.x*0.9 + n*0.5 - 0.25, 0.0, 1.0)*thinIce);
  col *= uCeil*(0.45 + 0.75*thinIce)*(0.6 + 0.8*side)*(0.75 + 0.5*f);
  col = mix(col, uOchre*(0.22 + 0.2*f), smoothstep(0.55, 0.8, vPar.y + n*0.25)*0.6);
  col += uCore*0.16*smoothstep(0.72, 0.95, pl)*(0.5 + 0.5*side);
  vec3 N = normalize(vN + vec3(0.0, -1e-5, 0.0));
  col += uCore*0.10*clamp(dot(N, uKeyDir) + 0.2, 0.0, 1.0);
  gl_FragColor = vec4(col, vPar.w);
  #include <fog_fragment>
}`;
function buildPlatelets(rng, crater, H, count) {
  const g = new THREE.InstancedBufferGeometry();
  const P = [];
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; P.push(Math.cos(a), Math.sin(a), 0); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 5, 3, 4, 5]);
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const r = 3.8 + 12.5 * Math.pow(rng(), 0.85), a = rng.range(0, Math.PI * 2), d = crater.drop(r, a);
    iA.set([Math.cos(a) * r, H - d - rng.range(0.0, 0.5) * (0.4 + d), Math.sin(a) * r, rng.range(0.22, 0.6) * (0.7 + 0.35 * Math.min(d, 2.5))], i * 4);
    iB.set([rng.range(0, Math.PI * 2), rng.range(1.15, 2.0), rng(), rng()], i * 4);
  }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4));
  g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.instanceCount = count;
  return g;
}
const PLATE_VERT = /* glsl */`
attribute vec4 iA; attribute vec4 iB; uniform float uTime;
varying vec3 vN; varying vec3 vW; varying float vSeed; varying vec2 vL;
#include <fog_pars_vertex>
void main(){
  float yaw = iB.x, pit = iB.y + 0.05*sin(uTime*0.6 + iB.z*40.0);
  vec3 n = vec3(sin(pit)*cos(yaw), cos(pit), sin(pit)*sin(yaw));
  vec3 t = normalize(vec3(-sin(yaw), 0.0, cos(yaw)));
  vec3 b = cross(n, t);
  vec3 p = iA.xyz + (t*position.x*(0.7 + 0.6*iB.w) + b*position.y*(1.0 + 0.9*iB.z))*iA.w;
  vSeed = iB.z; vL = position.xy;
  vec4 w = modelMatrix*vec4(p, 1.0); vW = w.xyz; vN = mat3(modelMatrix)*n;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const PLATE_FRAG = /* glsl */`
uniform vec3 uTeal; uniform vec3 uJade; uniform vec3 uCore; uniform vec3 uIce; uniform vec3 uKeyDir; uniform float uCeil;
varying vec3 vN; varying vec3 vW; varying float vSeed; varying vec2 vL;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
  vec3 Hh = normalize(uKeyDir + V);
  float gl = pow(clamp(abs(dot(N, Hh)), 0.0, 1.0), 18.0);
  float edge = smoothstep(0.55, 0.95, length(vL));
  float band = 0.82 + 0.18*sin(vL.y*13.0 + vL.x*4.0 + vSeed*40.0);
  vec3 col = mix(uTeal*1.1, uJade*0.62, 0.3 + 0.45*vSeed*vSeed)*uCeil*(0.7 + 0.3*abs(dot(N, uKeyDir)))*band*(1.0 - 0.25*(1.0 - edge)*vSeed);
  col += mix(uCore, uJade, 0.4)*(0.10*edge + 0.6*gl);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- brine ribbon and the finger's aura (axis billboards)
function buildRibbonGeometry() {
  const pos = [], idx = [];
  const grid = (cols, rows, kind) => {
    const base = pos.length / 3;
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) pos.push(i / cols * 2 - 1, j / rows, kind);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = base + j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  };
  grid(6, 40, 0); grid(2, 16, 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}
const RIBBON_VERT = /* glsl */`
uniform vec3 uTip; uniform float uFall; uniform float uTime; uniform float uSplash;
varying vec2 vUv; varying float vKind; varying float vHw;
#include <fog_pars_vertex>
${RADIUS_GLSL}
void main(){
  float kind = position.z, v = position.y; vec3 c; float hw;
  if (kind < 0.5) {
    c = vec3(uTip.x + sin(v*4.0 - uTime*1.1)*0.45*v + sin(v*9.0 + uTime*1.7)*0.14*v, uTip.y + 0.6 - v*uFall, uTip.z + cos(v*3.3 - uTime*0.9)*0.4*v);
    hw = 0.95 + 1.25*v + uSplash*v*v*v*v*0.8;
  } else {
    float y = mix(uTip.y - 3.0, uH, v);
    c = vec3(uTip.x*(1.0 - v), y, uTip.z*(1.0 - v));
    hw = brRadius(max(y, uTip.y))*2.4 + 1.8;
  }
  vec4 cw = modelMatrix*vec4(c, 1.0);
  vec3 tc = cameraPosition - cw.xyz;
  vec3 right = normalize(vec3(tc.z, 0.0, -tc.x) + vec3(1e-4, 0.0, 0.0));
  cw.xyz += right*hw*position.x;
  vUv = vec2(position.x, v); vKind = kind; vHw = hw;
  vec4 mvPosition = viewMatrix*cw;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const RIBBON_FRAG = /* glsl */`
uniform vec3 uCore; uniform vec3 uIce; uniform float uTime; uniform float uFall; uniform float uSplash; uniform float uBrine;
varying vec2 vUv; varying float vKind; varying float vHw;
#include <fog_pars_fragment>
${NOISE_GLSL}
${FOGK_GLSL}
void main(){
  float u = vUv.x, v = vUv.y; vec3 rgb; float al;
  if (vKind < 0.5) {
    float a = abs(u)*vHw/(0.75 + 0.55*v*vHw*0.5);
    float coreMask = 1.0 - smoothstep(0.5, 1.0, a);
    float yy = v*uFall, xx = u*vHw;
    float warp = bn(vec3(xx*0.7, yy*0.25 - uTime*0.9, 1.0));
    float s = bn(vec3(xx*2.6 + warp*1.9, yy*0.45 - uTime*2.4, uTime*0.25));
    float s2 = bn(vec3(xx*6.0 - warp*1.5, yy*0.9 - uTime*4.0, 4.0));
    float schl = smoothstep(0.5, 0.8, s)*0.75 + smoothstep(0.55, 0.85, s2)*0.5;
    float dark = smoothstep(0.52, 0.2, s);
    rgb = (uCore*0.85*schl + mix(uIce, uCore, 0.5)*0.09)*coreMask; al = (0.06 + 0.26*dark)*coreMask;
    float edgeMask = smoothstep(0.45, 1.0, a)*(1.0 - smoothstep(0.7, 1.0, abs(u)));
    float sp = bn(vec3(xx*2.2 + warp, yy*0.9 - uTime*0.9, uTime*0.4)); sp = sp*sp;
    rgb += uIce*0.2*sp*edgeMask + uIce*0.02*edgeMask;
    float fade = smoothstep(0.0, 0.05, v)*mix(1.0 - smoothstep(0.65, 1.0, v), 1.0 - smoothstep(0.9, 1.0, v), uSplash)*uBrine;
    rgb *= fade; al *= fade;
  } else {
    float g = 1.0 - abs(u); g = g*g*sqrt(g);
    g *= smoothstep(0.0, 0.14, v)*(1.0 - smoothstep(0.8, 1.0, v));
    rgb = uCore*0.05*g*(0.8 + 0.4*bn(vec3(u*2.0, v*22.0 + uTime*0.6, 0.0))); al = 0.0;
  }
  float fk = fogKeep();
  gl_FragColor = vec4(rgb*fk, al*fk);
}`;

// ---------------------------------------------------------------- sprites: frazil halo, touchdown dust ring, frost-edge puffs
const SPRITE_VERT = /* glsl */`
attribute vec4 iA; attribute vec4 iB;
uniform vec3 uTip; uniform float uTime; uniform float uTouch; uniform float uFront; uniform float uSplash;
varying vec2 vUv; varying float vKind; varying float vBright;
#include <fog_pars_vertex>
${RADIUS_GLSL}
void main(){
  float kind = iB.x, size = iB.y, bright = 0.0; vec3 c;
  if (kind < 0.5) {
    float dirn = iA.z > 0.5 ? 1.0 : -1.0;
    float ang = iA.x*6.2832 + uTime*(0.5 + iA.y)*dirn;
    float rad = brRadius(uTip.y)*(0.85 + 1.2*iA.y) + 0.3*sin(uTime*2.0 + iA.w*30.0);
    c = uTip + vec3(cos(ang)*rad, (iA.z - 0.3)*2.8 - fract(uTime*0.25*(0.5 + iA.w) + iA.x)*1.3 + 0.6, sin(ang)*rad);
    size *= 0.6 + 0.4*sin(uTime*5.0 + iA.w*50.0);
    bright = 1.7*(1.0 - 0.85*uSplash);
  } else if (kind < 1.5) {
    float k = uTouch, e = 1.0 - (1.0 - k)*(1.0 - k), ang = iA.x*6.2832 + iA.w*0.6*e;
    float rad = 1.2 + e*(8.0 + 7.0*iA.y);
    c = vec3(cos(ang)*rad, 0.35 + e*(0.25 + 2.1*iA.z*iA.z*iA.z), sin(ang)*rad);
    size *= 0.45 + 1.0*e;
    bright = 0.15*smoothstep(0.0, 0.08, k)*(1.0 - k)*sqrt(max(1.0 - k, 0.0));
  } else {
    float k = uFront - iB.z;
    float vis = smoothstep(-3.0, 0.5, k)*exp(-max(k, 0.0)/8.0);
    // behind the front the lobes go on smoking: a wisp of ice dust rises and thins, again and again
    float cyc = fract(uTime*0.12 + iA.w*7.0), late = smoothstep(10.0, 30.0, k), kk = min(max(k, 0.0), 40.0);
    c = iA.xyz + vec3(sin(iA.w*40.0)*1.6*cyc*late, mix(0.7 + kk*0.11, 0.9 + cyc*5.0, late), 0.0);
    size *= mix(0.6 + 0.05*kk, 0.8 + 1.4*cyc, late);
    bright = 0.20*vis + 0.10*late*sin(cyc*3.1416);
  }
  if (bright < 0.003) size = 0.0;
  vUv = position.xy; vKind = kind; vBright = bright;
  vec4 mvPosition = viewMatrix*modelMatrix*vec4(c, 1.0);
  mvPosition.xy += position.xy*size;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SPRITE_FRAG = /* glsl */`
uniform vec3 uCore; uniform vec3 uIce; uniform vec3 uShade;
varying vec2 vUv; varying float vKind; varying float vBright;
#include <fog_pars_fragment>
${FOGK_GLSL}
void main(){
  float d = length(vUv), a = clamp(1.0 - d, 0.0, 1.0); a *= a;
  if (vKind < 0.5) a = a*a + 0.15*a;
  vec3 c = vKind < 0.5 ? mix(uIce, uCore, 0.45) : (vKind < 1.5 ? mix(uIce, uCore, 0.25) : mix(uCore, uShade, 0.5));
  gl_FragColor = vec4(c*a*vBright*fogKeep(), 0.0);
}`;

// ---------------------------------------------------------------- the frost river: lifted sheet + crystal blades
async function buildRiverGeometry(ctx, field, groundAt, len) {
  const NC = 40, NR = 380, HALF = 26, zTop = 14, zEnd = -(len + 4);
  const pos = new Float32Array((NC + 1) * (NR + 1) * 3), nor = new Float32Array((NC + 1) * (NR + 1) * 3), edge = new Float32Array((NC + 1) * (NR + 1));
  let k = 0;
  for (let j = 0; j <= NR; j++) {
    const z = lerp(zTop, zEnd, j / NR), cx = field.centre(-z) * 0.8;
    for (let i = 0; i <= NC; i++, k++) {
      const t = i / NC * 2 - 1, x = cx + t * HALF, y = groundAt(x, z);
      const gx = (groundAt(x + 0.5, z) - y) * 2, gz = (groundAt(x, z + 0.5) - y) * 2, l = Math.hypot(gx, 1, gz);
      pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
      nor[k * 3] = -gx / l; nor[k * 3 + 1] = 1 / l; nor[k * 3 + 2] = -gz / l;
      edge[k] = (1 - smoothstep(0.82, 1, Math.abs(t))) * smoothstep(0, 0.02, j / NR) * (1 - smoothstep(0.985, 1, j / NR));
    }
    if (j % 60 === 59) await ctx.yield();
  }
  const idx = new Uint32Array(NC * NR * 6); let q = 0;
  for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) { const a = j * (NC + 1) + i, b = a + 1, c = a + NC + 1, d = c + 1; idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aEdge', new THREE.BufferAttribute(edge, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}
const RIVER_VERT = /* glsl */`
attribute float aEdge;
varying vec2 vXZ; varying vec3 vW; varying vec3 vN; varying float vEdge;
#include <fog_pars_vertex>
${FROST_GLSL}
void main(){
  vec4 f = frostField(position.xz);
  float k = uFront - frostArrive(position.xz, f);
  float frozen = smoothstep(0.42, 0.6, f.r)*smoothstep(0.0, 5.0, k);
  vec3 p = position + normal*(0.07 + frozen*(0.22 + 0.95*f.b*f.r));
  vXZ = position.xz; vEdge = aEdge; vN = mat3(modelMatrix)*normal;
  vec4 w = modelMatrix*vec4(p, 1.0); vW = w.xyz;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const RIVER_FRAG = /* glsl */`
uniform vec3 uKeyDir; uniform vec3 uKeyCol; uniform vec3 uFillCol; uniform vec3 uIce; uniform vec3 uShade; uniform vec3 uCore; uniform vec3 uJade;
uniform float uTime; uniform float uBed; uniform float uEdgeI;
varying vec2 vXZ; varying vec3 vW; varying vec3 vN; varying float vEdge;
#include <fog_pars_fragment>
${NOISE_GLSL}
${FROST_GLSL}
float crustH(vec4 f){ return smoothstep(0.42, 0.6, f.r)*(0.22 + 0.95*f.b*f.r); }
void main(){
  vec2 xz = vXZ;
  vec4 f = frostField(xz);
  float e1 = bn(vec3(xz*1.6, 0.0)), e2 = bn(vec3(xz*5.3, 3.0)), e3 = bn(vec3(xz*13.0, 7.0));
  float cov = f.r + (e1 - 0.5)*0.17 + (e2 - 0.5)*0.09;
  float k = uFront - frostArrive(xz, f) + (e1 - 0.5)*3.0 + (e2 - 0.5)*1.2;
  float inWeb = smoothstep(0.47, 0.54, cov);
  float frozen = inWeb*smoothstep(0.0, 2.2, k);
  float rim = inWeb*smoothstep(-0.9, 0.0, k)*exp(-max(k, 0.0)*0.6);
  // new ice is thin and clear and lit from within: for some twelve metres behind the edge it is deep cyan, whitening into
  // crust as it thickens. It is made by taking light out of the ice (red first), not by adding glow: anything brighter
  // tone-maps to the same pale as the crust. Only the edge itself is a hot line.
  float band = inWeb*smoothstep(-0.9, 0.4, k)*exp(-max(k, 0.0)*0.10), fresh = inWeb*exp(-max(k, 0.0)*0.08);
  // relief from the crust height stored in the field, plus crystal facets
  float hx = crustH(frostField(xz + vec2(0.8, 0.0))) - crustH(frostField(xz - vec2(0.8, 0.0)));
  float hz = crustH(frostField(xz + vec2(0.0, 0.8))) - crustH(frostField(xz - vec2(0.0, 0.8)));
  vec2 cell = floor(xz*1.9 + vec2(e1, e2)*1.3);
  float fa = bh(vec3(cell, 1.0)), fb = bh(vec3(cell, 5.0));
  vec3 N = normalize(vN + vec3(-hx*1.1 + (fa - 0.5)*0.5 + (e3 - 0.5)*0.3, 0.0, -hz*1.1 + (fb - 0.5)*0.5 + (e2 - 0.5)*0.3) + vec3(0.0, 1e-4, 0.0));
  vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
  float ndl = clamp(dot(N, uKeyDir), 0.0, 1.0);
  float nearK = 1.0 - smoothstep(35.0, 150.0, length(cameraPosition - vW));
  float dn = bn(vec3(xz*vec2(0.9, 0.5) + vec2(e1*1.5, 0.0), 11.0 + uTime*0.07)), den = 1.0 - smoothstep(0.0, 0.035, abs(dn - 0.5));
  float dn2 = bn(vec3(xz*vec2(2.6, 1.5) + vec2(0.0, e1*2.0), 17.0)); den = max(den, (1.0 - smoothstep(0.0, 0.03, abs(dn2 - 0.5)))*0.85*nearK);
  vec3 alb = mix(uShade*0.42, uIce*(0.42 + 0.3*mix(0.5, fa, nearK)), clamp(0.35 + f.b*0.7 + (e3 - 0.5)*0.4*nearK - den*0.4, 0.0, 1.0));
  vec3 frost = alb*(uKeyCol*ndl*1.15 + uFillCol*1.25);
  vec3 Hh = normalize(uKeyDir + V);
  // the river shimmers after it has set: facets twinkle, glints run down it, the marbling crawls (dn above)
  float tw = 0.5 + 0.5*sin(uTime*(1.4 + 3.2*fa) + fb*70.0);
  frost += uIce*pow(clamp(dot(N, Hh), 0.0, 1.0), 34.0)*step(0.6, fb)*(0.45 + 1.1*tw)*nearK;
  frost += uIce*step(0.9, fa)*tw*tw*tw*0.16*nearK;
  float run = bn(vec3(xz*vec2(0.55, 0.16) + vec2(e1*1.5, uTime*1.1), uTime*0.23)); run *= run; run *= run;
  frost += uCore*run*0.20;
  frost += mix(uCore, uShade, 0.3)*(0.16*exp(-max(k, 0.0)/22.0) + 0.04);
  // the bed in front of the ice: black gravel (viewer only) and brine fanning out ahead of the front
  float pool = smoothstep(0.45, 0.8, bn(vec3(xz*0.045, uTime*0.04)));
  vec3 bed = vec3(0.010, 0.014, 0.020)*(0.5 + 1.0*e2 + 0.6*e3) + uJade*0.03*pool*(0.4 + e1);
  bed *= 0.75 + 0.5*sin(xz.y*1.9 + e1*5.0 + xz.x*0.4)*0.5;
  float ahead = smoothstep(-13.0, -0.5, k)*(1.0 - smoothstep(-0.5, 0.5, k))*smoothstep(0.3, 0.5, cov);
  float sh = bn(vec3(xz*vec2(1.7, 0.4) + vec2(e1*2.0, uTime*2.6), uTime*0.7)); sh *= sh;
  float sh2 = bn(vec3(xz*vec2(4.6, 1.1) - vec2(e1*3.0, uTime*4.2), uTime*1.1));
  vec3 wet = mix(uCore, uShade, 0.6)*(0.16 + 0.60*sh + 0.40*sh*smoothstep(0.45, 0.8, sh2));
  vec3 col = mix(bed*uBed, wet, ahead);
  // gaps and islands inside the river are gravel dusted with rime, with a cyan shoreline: never a black hole
  float near4 = max(max(frostField(xz + vec2(3.0, 0.0)).r, frostField(xz - vec2(3.0, 0.0)).r), max(frostField(xz + vec2(0.0, 3.5)).r, frostField(xz - vec2(0.0, 3.5)).r));
  float dustK = smoothstep(0.0, 6.0, k)*(1.0 - inWeb)*smoothstep(0.30, 0.62, max(near4, cov*1.3));
  float dust = dustK*(0.34 + 0.5*smoothstep(0.35, 0.75, e2*0.6 + e3*0.5));
  float shore = dustK*smoothstep(0.28, 0.47, cov);
  vec3 rime = uIce*(0.30 + 0.12*e3)*(uKeyCol*ndl*0.9 + uFillCol*1.3) + mix(uCore, uShade, 0.4)*0.34*shore;
  col = mix(col, rime, clamp(dust*5.0, 0.0, 1.0));
  rim *= 0.84 + 0.28*sin(uTime*2.6 + e1*9.0 + xz.y*0.3);
  col = mix(col, frost*mix(vec3(1.0), vec3(0.02, 0.24, 0.52), fresh), frozen) + uCore*uEdgeI*0.42*rim + uShade*uEdgeI*0.10*band*(0.8 + 0.2*sin(uTime*3.3 + e2*12.0 + xz.x*0.7));
  float al = max(uBed, max(max(frozen, max(dust, shore*0.7)), max(rim, ahead*0.7)))*vEdge;
  gl_FragColor = vec4(col, al);
  #include <fog_fragment>
}`;
async function buildBlades(ctx, rng, field, groundAt, len, count) {
  const g = new THREE.InstancedBufferGeometry();
  const P = [], K = [];
  for (let b = 0; b < 4; b++) {
    const ab = rng.range(0, Math.PI), ox = b === 0 ? 0 : rng.range(-0.45, 0.45), oz = b === 0 ? 0 : rng.range(-0.45, 0.45), hb = b === 0 ? 1 : rng.range(0.45, 0.85);
    const w = 0.13 * hb + 0.03, lx = rng.range(-0.22, 0.22) * hb, lz = rng.range(-0.22, 0.22) * hb, ca = Math.cos(ab), sa = Math.sin(ab);
    P.push(ox - ca * w, 0, oz - sa * w, ox + ca * w, 0, oz + sa * w, ox + lx, hb, oz + lz); K.push(0, 0, 1);
    P.push(ox + sa * w * 0.6, 0, oz - ca * w * 0.6, ox - sa * w * 0.6, 0, oz + ca * w * 0.6, ox + lx, hb, oz + lz); K.push(0, 0, 1);
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 1));
  g.computeVertexNormals();
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    let x = 0, z = 0, ok = false;
    const draws = [rng(), rng(), rng(), rng(), rng(), rng(), rng(), rng()];   // fixed draw count per instance
    for (let t = 0; t < 4 && !ok; t++) {
      const a = draws[t * 2], b = draws[t * 2 + 1];
      if (i % 16 === 0) { const r = 2.6 + 7 * a, an = b * Math.PI * 2; x = Math.cos(an) * r; z = Math.sin(an) * r; }
      else { const s = 4 + Math.pow(a, 1.12) * (len - 6); z = -s; x = field.centre(s) + (b + draws[(t * 2 + 3) % 8] + draws[(t * 2 + 5) % 8] - 1.5) * 13; }
      ok = field.coverage(x, z) > 0.64 && Math.hypot(x, z) > 2.4;
    }
    const sc = ok ? 0.5 + 1.0 * draws[7] * draws[7] + 0.35 * field.sample(x, z, 2) : 0;
    const lift = 0.07 + (0.22 + 0.95 * field.sample(x, z, 2) * field.sample(x, z, 0)) * 0.75;
    iA.set([x, groundAt(x, z) + lift, z, sc], i * 4);
    iB.set([draws[6] * Math.PI * 2, Math.hypot(x, z) + field.sample(x, z, 1) * LAG_M, draws[5], 0], i * 4);
    if (i % 400 === 399) await ctx.yield();
  }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4));
  g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.instanceCount = count;
  return g;
}
const BLADE_VERT = /* glsl */`
attribute vec4 iA; attribute vec4 iB; attribute float aK; uniform float uFront;
varying vec3 vN; varying vec3 vW; varying float vK; varying float vBehind; varying float vSeed;
#include <fog_pars_vertex>
void main(){
  float k = uFront - iB.y, g = clamp(k/4.5, 0.0, 1.0);
  float grow = g*g*(3.0 - 2.0*g)*(1.0 + 0.6*sin(g*3.1416)*(1.0 - g));
  float cy = cos(iB.x), sy = sin(iB.x), wd = min(grow*3.0, 1.0)*iA.w;
  vec3 q = vec3(position.x*wd, position.y*iA.w*grow, position.z*wd);
  vec3 p = iA.xyz + vec3(q.x*cy - q.z*sy, q.y, q.x*sy + q.z*cy);
  vec3 n = vec3(normal.x*cy - normal.z*sy, normal.y, normal.x*sy + normal.z*cy);
  vK = aK; vBehind = k; vSeed = iB.z;
  vec4 w = modelMatrix*vec4(p, 1.0); vW = w.xyz; vN = mat3(modelMatrix)*n;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BLADE_FRAG = /* glsl */`
uniform vec3 uKeyDir; uniform vec3 uKeyCol; uniform vec3 uFillCol; uniform vec3 uIce; uniform vec3 uShade; uniform vec3 uCore; uniform float uTime;
varying vec3 vN; varying vec3 vW; varying float vK; varying float vBehind; varying float vSeed;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-4, 0.0));
  float ndl = abs(dot(N, uKeyDir));
  vec3 alb = mix(uShade*0.5, uIce*0.7, 0.3 + 0.55*vK + 0.15*vSeed);
  vec3 col = alb*(uKeyCol*(0.3 + 0.75*ndl) + uFillCol*1.2)*(0.6 + 0.4*vK);
  vec3 Hh = normalize(uKeyDir + V);
  // each blade twinkles on its own clock, and its tip flares now and then
  float tw = 0.5 + 0.5*sin(uTime*(1.6 + 3.5*vSeed) + vSeed*140.0), fl = tw*tw; fl *= fl;
  col += uIce*pow(clamp(abs(dot(N, Hh)), 0.0, 1.0), 22.0)*(0.5 + 0.9*tw);
  col += uCore*vK*(0.10 + 0.30*fl*vK + 1.25*exp(-max(vBehind, 0.0)/10.0));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('brinicle-ice-finger');
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 6 ? opts.palette : DEFAULT_PALETTE).map(lin);
  const H = opts.height ?? 64, L0 = opts.startLength ?? 30, len = opts.riverLength ?? 620;
  const knee = 42, slope = Math.tan(18 * Math.PI / 180);
  const groundAt = opts.groundAt || ((x, z) => { const s = -z - knee; return s <= -8 ? 0 : -slope * (s < 8 ? (s + 8) * (s + 8) / 32 : s); });
  const keyDir = (opts.keyDir ? opts.keyDir.clone() : new THREE.Vector3(-0.56, 0.8, 0.2)).normalize();
  const group = new THREE.Group(); group.name = 'brinicle-ice-finger';

  // shared uniform objects
  const U = {
    uTime: { value: 0 }, uTipY: { value: H - L0 }, uH: { value: H }, uTip: { value: new THREE.Vector3(0, H - L0, 0) },
    uFall: { value: 15 }, uSplash: { value: 0 }, uBrine: { value: 1 }, uTouch: { value: 0 }, uFront: { value: 0 },
    uKeyDir: { value: keyDir.clone() },
    uKeyCol: { value: pal[2].clone().lerp(pal[3], 0.55).lerp(pal[4], 0.35).multiplyScalar(1.25) },
    uFillCol: { value: pal[1].clone().multiplyScalar(1.3).add(pal[0]) },
    uIce: { value: pal[4].clone() }, uShade: { value: lin('#2AA6C8') }, uCore: { value: pal[3].clone() },
    uTeal: { value: pal[1].clone() }, uJade: { value: pal[2].clone() }, uOchre: { value: pal[5].clone() },
    uCoreI: { value: opts.coreIntensity ?? 2.2 }, uEdgeI: { value: opts.edgeIntensity ?? 1.6 }, uCeil: { value: opts.ceilingGlow ?? 1 },
    uBed: { value: opts.bed === false ? 0 : 1 }, uFrostMap: { value: null }, uFrostRect: { value: new THREE.Vector4() },
  };
  const uni = (...names) => { const u = THREE.UniformsUtils.clone(THREE.UniformsLib.fog); for (const n of names) u[n] = U[n]; return u; };
  const ADD = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor };
  const add = (mesh, order = 0) => { mesh.frustumCulled = false; mesh.renderOrder = order; mesh.matrixAutoUpdate = false; group.add(mesh); return mesh; };

  // 1 the frost field (the river's map; also used by the sprites and blades)
  const field = await buildFrostField(ctx, rng, len);
  U.uFrostMap.value = field.map; U.uFrostRect.value.copy(field.rect);
  await ctx.yield();

  // 2 the finger
  const shaft = await buildShaftGeometry(ctx, rng, H);
  add(new THREE.Mesh(shaft.geometry, new THREE.ShaderMaterial({
    uniforms: uni('uTime', 'uTipY', 'uH', 'uKeyDir', 'uKeyCol', 'uFillCol', 'uIce', 'uShade', 'uCore', 'uCoreI'),
    vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, fog: true, side: THREE.DoubleSide })));
  await ctx.yield();
  const featherCount = Math.round(1900 * detail);
  await ctx.yield();
  add(new THREE.Mesh(buildFeathers(rng, shaft, H, featherCount), new THREE.ShaderMaterial({
    uniforms: uni('uTipY', 'uH', 'uKeyDir', 'uKeyCol', 'uFillCol', 'uIce', 'uShade', 'uCore'),
    vertexShader: FEATHER_VERT, fragmentShader: FEATHER_FRAG, fog: true, side: THREE.DoubleSide })));
  await ctx.yield();

  // 3 the crater of platelets it hangs from
  const plateCount = Math.round(1100 * detail);
  const craterRng = rng.fork('crater');
  if (opts.crater !== false) {
    const crater = buildCraterGeometry(ctx, craterRng, H);
    add(new THREE.Mesh(crater.geometry, new THREE.ShaderMaterial({
      uniforms: uni('uTime', 'uTeal', 'uJade', 'uOchre', 'uCore', 'uKeyDir', 'uCeil'),
      vertexShader: CRATER_VERT, fragmentShader: CRATER_FRAG, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false })), -2);
    await ctx.yield();
    add(new THREE.Mesh(buildPlatelets(craterRng, crater, H, plateCount), new THREE.ShaderMaterial({
      uniforms: uni('uTime', 'uTeal', 'uJade', 'uCore', 'uIce', 'uKeyDir', 'uCeil'),
      vertexShader: PLATE_VERT, fragmentShader: PLATE_FRAG, fog: true, side: THREE.DoubleSide })));
    await ctx.yield();
  }

  // 4 the river
  const riverRng = rng.fork('river');
  const bladeCount = Math.round(3200 * detail);
  if (opts.river !== false) {
    const rg = await buildRiverGeometry(ctx, field, groundAt, len);
    const river = add(new THREE.Mesh(rg, new THREE.ShaderMaterial({
      uniforms: uni('uTime', 'uFront', 'uFrostMap', 'uFrostRect', 'uKeyDir', 'uKeyCol', 'uFillCol', 'uIce', 'uShade', 'uCore', 'uJade', 'uBed', 'uEdgeI'),
      vertexShader: RIVER_VERT, fragmentShader: RIVER_FRAG, fog: true, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })), -1);
    river.material.uniforms.uFrostMap = U.uFrostMap;
    await ctx.yield();
    const bladeGeo = await buildBlades(ctx, riverRng, field, groundAt, len, bladeCount);
    await ctx.yield();
    add(new THREE.Mesh(bladeGeo, new THREE.ShaderMaterial({
      uniforms: uni('uTime', 'uFront', 'uKeyDir', 'uKeyCol', 'uFillCol', 'uIce', 'uShade', 'uCore'),
      vertexShader: BLADE_VERT, fragmentShader: BLADE_FRAG, fog: true, side: THREE.DoubleSide })));
    await ctx.yield();
  }

  // 5 brine ribbon + aura, 6 sprites
  add(new THREE.Mesh(buildRibbonGeometry(), new THREE.ShaderMaterial({
    uniforms: uni('uTime', 'uTipY', 'uH', 'uTip', 'uFall', 'uSplash', 'uBrine', 'uCore', 'uIce'),
    vertexShader: RIBBON_VERT, fragmentShader: RIBBON_FRAG, fog: true, side: THREE.DoubleSide, ...ADD })), 3);
  {
    const spRng = rng.fork('sprites');
    const nHalo = Math.round(200 * detail), nRing = Math.round(130 * detail), nPuff = Math.round(170 * detail), n = nHalo + nRing + nPuff;
    const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const a = spRng(), b = spRng(), c = spRng(), d = spRng(), e = spRng();
      if (i < nHalo) { iA.set([a, b, c, d], i * 4); iB.set([0, 0.14 + 0.36 * e * e, 0, 0], i * 4); }
      else if (i < nHalo + nRing) { iA.set([a, b, c, d * 2 - 1], i * 4); iB.set([1, 0.7 + 1.3 * e, 0, 0], i * 4); }
      else {
        // ride the vein crests: take the better-covered of two candidates
        const s = 6 + a * (len - 10);
        const x1 = field.centre(s) + (b - 0.5) * 16, x2 = field.centre(s) + (c - 0.5) * 16, x = field.coverage(x1, -s) > field.coverage(x2, -s) ? x1 : x2;
        const ok = field.coverage(x, -s) > 0.55;
        iA.set([x, groundAt(x, -s), -s, d], i * 4); iB.set([2, ok ? 2.2 + 2.6 * e : 0, Math.hypot(x, s) + field.sample(x, -s, 1) * LAG_M, 0], i * 4);
      }
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4));
    g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
    g.instanceCount = n;
    add(new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: uni('uTime', 'uTipY', 'uH', 'uTip', 'uTouch', 'uFront', 'uSplash', 'uCore', 'uIce', 'uShade'),
      vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG, fog: true, ...ADD })), 4);
  }
  await ctx.yield();

  // ---- state and setters
  let driven = false, length = L0, touch = 0, front = 0;
  const tipYOf = (l) => H - l - 1.4 * smoothstep(H - 6, H, l);
  const apply = () => {
    const ty = tipYOf(length), ax = shaft.axisAt(Math.max(ty, 0));
    U.uTipY.value = ty; U.uTip.value.set(ax[0], ty, ax[1]);
    U.uFall.value = clamp(ty + 0.5, 0.5, 15);
    U.uSplash.value = 1 - smoothstep(4, 15, ty);
    U.uBrine.value = smoothstep(0.1, 1.6, ty);
    U.uTouch.value = touch; U.uFront.value = front;
  };
  apply();

  // ---- anchors
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const fly = [V3(0, H - 16, 128), V3(0, H - 16, 64), V3(7, H - 16, 30)];
  for (let i = 0; i <= 10; i++) { const p = i / 10, a = p * Math.PI * 2.5; fly.push(V3(Math.cos(a) * 17, lerp(H - 16, H - 46, p), -Math.sin(a) * 17)); }
  for (let i = 1; i <= 4; i++) { const p = i / 4, a = Math.PI * (2.5 + p), r = lerp(17, 11, p); fly.push(V3(Math.cos(a) * r, lerp(H - 46, 6, p), -Math.sin(a) * r)); }
  fly.push(V3(-7, 5.6, 6), V3(-9, 5.2, -2), V3(-6, groundAt(-6, -30) + 4.8, -30));
  for (let s = 70; s <= len - 20; s += 50) { const x = field.centre(s) * 0.7; fly.push(V3(x, groundAt(x, -s) + 4.8, -s)); }
  let hudA = -0.6, best = 1e9;
  for (let i = 0; i < 12; i++) { const a = -0.15 - i * 0.1; let c = 0; for (let q = -1; q <= 1; q++) c += field.coverage(Math.cos(a + q * 0.12) * 8, Math.sin(a + q * 0.12) * 8); if (c < best) { best = c; hudA = a; } }
  const sSeat = len - 18, xs = field.centre(sSeat);
  const anchors = {
    root: V3(0, H, 0), touchdown: V3(0, 0, 0),
    starHuddle: V3(Math.cos(hudA) * 8, groundAt(Math.cos(hudA) * 8, Math.sin(hudA) * 8), Math.sin(hudA) * 8),
    flyThrough: fly,
    viewpoints: { entry: V3(0, H - 16, 128), shaft: V3(17, H - 30, 0), tip: V3(0, 14, -13), touchdown: V3(0, 6, 11), chase: V3(field.centre(120) * 0.7, groundAt(0, -120) + 4.8, -120) },
    portalSeat: { position: V3(xs, groundAt(xs, -sSeat) + 3, -sSeat), normal: V3(0, groundAt(xs, -sSeat + 1) - groundAt(xs, -sSeat - 1), 2).normalize(), radius: 7 },
    keyDir: keyDir.clone(),
  };

  return {
    object: group, radius: VIEW_RADIUS, height: H, center: new THREE.Vector3(0, H * VIEW_CY, 0), anchors,
    ground: false, groundY: 0,
    frost: { map: field.map, rect: field.rect, glsl: FROST_GLSL, uniforms: { uFrostMap: U.uFrostMap, uFrostRect: U.uFrostRect, uFront: U.uFront }, arrive: field.arrive, coverage: field.coverage, centre: field.centre, lagMetres: LAG_M },
    uniforms: U, groundAt, startLength: L0,
    setLength(m) { driven = true; length = clamp(m, 1, H); },
    setProgress(p) { driven = true; length = lerp(L0, H, clamp(p, 0, 1)); },
    setTouch(k) { driven = true; touch = clamp(k, 0, 1); },
    setFront(d) { driven = true; front = Math.max(0, d); },
    setLight(dir, color) { U.uKeyDir.value.copy(dir).normalize(); if (color) U.uKeyCol.value.copy(color); },
    tipPosition(out = new THREE.Vector3()) { const ty = Math.max(tipYOf(length), 0), ax = shaft.axisAt(ty); return out.set(ax[0], ty, ax[1]); },
    update(dt, time) {
      U.uTime.value = time;
      if (!driven) {   // viewer demo: grow 16 s, touch down, run the river, hold, repeat
        const t = time % 44;
        length = lerp(L0, H, smoothstep(0, 16, t) * 0.4 + clamp(t / 16, 0, 1) * 0.6);
        touch = clamp((t - 16) / 2.2, 0, 1);
        front = t < 16 ? 0 : Math.min(len + 60, 9 * (t - 16) + 1.6 * (t - 16) * (t - 16));
      }
      apply();
    },
    dispose() {},
  };
}
