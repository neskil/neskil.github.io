// THE SLEDGE BETWEEN THE VOLCANOES: what polish round 1 adds on and round the plateau. Everything here is new; each
// dealt thing takes a stream the world hands it (named streams of their own, so that nothing older deals anew).
//   makePlateauCrevasses()  the crevasses where the plateau's ice bends: along the lip and over the two whalebacks
//                           (a baked depth map like the glacier's: the land's height and its shader both read it)
//   makeAshfall()           ash falling as black snow over the plateau, thinning away from the mountain
//   makeRocks()             one mesh of rock, snow and ice lumps: the far crags with their drift tails, the drifts and
//                           moraine at the white mountain's foot, the fallen cornice blocks at the lips of the wide
//                           crevasses (tumbled groups, half drifted over), and every crevasse's true trench
//   makeStars()             more stars over the dark half of the sky: a part of live's star field (they take the
//                           field's own level from the world, whatever the visit)
//   makeFarEdge()           the ice's own far edge along the horizon, uneven
// Declared once, here: (1) a DRAWING WINDOW: each flake of the falling ash has a place of its own in the world, on a
// lattice of boxes 46 x 28 x 46 m; the copy nearest the eye's place is the one drawn, and it fades out between 6 m and
// 2 m from the eye. (2) a LEAST WIDTH: a star has no size in metres; each is a point 1.4 to 2.8 pixels wide.
// (3) NO LEVEL OF DETAIL in the crevasses: every dealt crevasse that is open at all is a true trench (two walls, a
// floor, a lip; the land cut open over it) along all of its length that is wide enough to cut, wherever it lies.
// (4) A FOOTPRINT FADE: the fine detail of a trench (the beds and the fracture of its walls, and the cut itself where
// a slot is narrower than the pixel) fades into its mean as the pixel's footprint grows past it; nothing else is
// read for it.
import * as THREE from 'three';
import { smoothstep } from '../kit/core.js';
import { sharedUniforms, SBV_NOISE, SBV_LIGHT, Acc } from './sledge-between-volcanoes-common.js';

// ---------------------------------------------------------------- the plateau's crevasses
// Depth in metres on a 0.5 m grid over the lip's whole width and the ground round the way out.
export const CV2 = { x0: -420, z0: -960, w: 840, d: 360, cell: 0.5 };
const TRENCH_MIN = 0.6;      // the least half-width a trench is cut at (narrower, a crevasse's pinched end is a crack: a dip in the land)
// o: rng, noise, portal [x, z], dir [x, z] (the way out and the heading of the whalebacks' long axis),
//    keep (x, z) => metres to spare beyond the keep-clear of what must stay whole (0 or less: no crevasse here)
// -> { at (the land's dip), depthAt (how deep a crevasse is here, cut or dipped), texture, list, trenches, blocks, box }
export async function makePlateauCrevasses(ctx, o) {
  const { rng, noise } = o, NX = Math.round(CV2.w / CV2.cell), NZ = Math.round(CV2.d / CV2.cell), depth = new Float32Array(NX * NZ), list = [];
  await ctx.yield();
  // (i) where the ice starts down over the lip: rows that follow the lip's own bow (its measure d = -z + 0.00075 x^2),
  // from 43 m behind the cornice's crest (clear of the cornice) to about 190 m behind it, over the lip's whole width:
  // close-set for the first 60 m, where the ice bends most, then further and further apart; slots of unlike length
  // and width in each row, bowed toward the fall; about one in five is wide enough to look down into. The ground for
  // 60 m round the way out is left to the whalebacks' own (ii).
  let d = 760 + rng.range(0, 5);
  while (d < 905) {
    let x = -410 + rng.range(0, 40);
    while (x < 400) { const len = rng.range(28, 105), gap = rng.range(8, 40), xc = x + len / 2, wide = rng.chance(0.2);
      list.push({ xc, zc: -(d + rng.range(-2, 2) - 0.00075 * xc * xc), half: len / 2, bow: rng.range(1.5, 6) * (len / 80), w: wide ? rng.range(3.2, 5.2) : rng.range(1.2, 2.4), dep: wide ? rng.range(16, 26) : rng.range(7, 15),
        rot: Math.atan(0.0015 * xc) + rng.range(-0.06, 0.06), key: rng.range(0, 100), wide, lip: true });
      x += len + gap; }
    d += rng.range(9, 16) * (1 + 1.3 * smoothstep(805, 905, d));
  }
  // (ii) where the ice bends over the two whalebacks either side of the way out: four to six short slots across
  // each crest
  const P = o.portal, D = o.dir;
  for (const sc of [-24, 24]) { const n = 4 + Math.floor(rng.range(0, 2.99));
    for (let i = 0; i < n; i++) { const al = rng.range(-26, 24), ac = sc + rng.range(-2, 2);
      list.push({ xc: P[0] + al * D[0] - ac * D[1], zc: P[1] + al * D[1] + ac * D[0], half: rng.range(8, 13), bow: rng.range(0.3, 1.2), w: rng.range(1.1, 2.3), dep: rng.range(7, 12),
        rot: Math.atan2(D[0], -D[1]) + rng.range(-0.25, 0.25), key: rng.range(0, 100), wide: false }); } }
  // cornice blocks fallen on the lips of the wide ones: three to five on each, dealt here after every slot
  const blocks = [];
  for (const c of list) { if (!c.wide) continue; const n = 3 + Math.floor(rng.range(0, 2.99));
    for (let i = 0; i < n; i++) blocks.push({ c, q: rng.range(-0.75, 0.75), side: rng.sign ? rng.sign() : (rng() < 0.5 ? -1 : 1), off: rng.range(0.6, 2.2), s: rng.range(0.5, 1.5), yaw: rng.range(0, 3.14), tip: rng.range(-0.4, 0.4) }); }
  await ctx.yield();
  // the keep-clear: along each slot, how much of it may open (17 places); a slot pinches out where it nears what must stay whole
  for (const c of list) { const cr = Math.cos(c.rot), sr = Math.sin(c.rot); c.keep = new Float32Array(17); c.open = 0;
    for (let i = 0; i < 17; i++) { const lx = (i / 8 - 1) * c.half; const kx = c.xc + lx * cr, kz = c.zc + lx * sr; c.keep[i] = smoothstep(0, 6, c.lip ? Math.min(o.keep(kx, kz), Math.hypot(kx - P[0], kz - P[1]) - 60) : o.keep(kx, kz)); c.open = Math.max(c.open, c.keep[i]); } }
  await ctx.yield();
  // (second part, B6; third part, C2) every dealt crevasse gets a true trench (a mesh of two walls, a floor and a lip,
  // built with the rocks; the land is not dipped there but cut open). No crevasse is dealt for it and nothing is read
  // for it: only where a slot is narrower than TRENCH_MIN (its pinched ends) is it a dip in the land, a crack.
  const dip = new Float32Array(NX * NZ), hole = new Uint8Array(NX * NZ);      // dip: what the land's mesh is lowered by; hole: where the land is cut open
  let work = 0;
  for (const c of list) {
    if (c.open <= 0) continue;
    const cr = Math.cos(c.rot), sr = Math.sin(c.rot), ext = c.half + 2, i0 = Math.max(0, Math.floor((c.xc - ext - CV2.x0) / CV2.cell)), i1 = Math.min(NX - 1, Math.ceil((c.xc + ext - CV2.x0) / CV2.cell));
    const zext = c.bow + c.w + c.half * Math.abs(sr) + 4, j0 = Math.max(0, Math.floor((c.zc - zext - CV2.z0) / CV2.cell)), j1 = Math.min(NZ - 1, Math.ceil((c.zc + zext - CV2.z0) / CV2.cell));
    for (let j = j0; j <= j1; j++) { if (((j - j0) & 31) === 31) await ctx.yield();
    for (let i = i0; i <= i1; i++) {
      const dx = CV2.x0 + i * CV2.cell - c.xc, dz = CV2.z0 + j * CV2.cell - c.zc, lx = dx * cr + dz * sr, lz = -dx * sr + dz * cr, q = lx / c.half;
      if (q <= -1 || q >= 1) continue;
      if (Math.abs(lz - c.bow * (1 - q * q)) > c.w * 1.25 + 3.1) continue;      // (too far from the slot's line for any wander or width it can have: nothing to bake)
      const kf = (q + 1) * 8, ki = Math.min(15, Math.floor(kf)), kk = c.keep[ki] + (c.keep[ki + 1] - c.keep[ki]) * (kf - ki); if (kk <= 0) continue;
      const mid = c.bow * (1 - q * q) + 1.6 * noise.n2(lx / 17 + c.key, c.key * 0.7) + 0.5 * noise.n2(lx / 4.5, c.key);
      const hw = c.w * Math.pow(1 - q * q, 0.6) * (0.75 + 0.5 * noise.n2(lx / 23 - c.key, 3.3)) * kk;
      const dd = Math.abs(lz - mid); if (dd > hw + 0.9) continue;
      const prof = 1 - smoothstep(hw * 0.45, hw + 0.9, dd), v = c.dep * prof * Math.min(1, hw / 1.5), k = j * NX + i;
      if (v > depth[k]) depth[k] = v;
      const mx0 = c.xc + lx * cr - mid * sr, mz0 = c.zc + lx * sr + mid * cr;      // (cut only well inside the map's box, where the trench's mesh is built too)
      if (hw >= TRENCH_MIN && mx0 > CV2.x0 + 8 && mx0 < CV2.x0 + CV2.w - 8 && mz0 > CV2.z0 + 8 && mz0 < CV2.z0 + CV2.d - 8) { const hm = 255 * (1 - smoothstep(hw, hw + 0.5, dd)); if (hm > hole[k]) hole[k] = hm; if (hm >= 128) c.cut = 1; } else if (v > dip[k]) dip[k] = v;
    } }
    if ((work += (i1 - i0) * (j1 - j0)) > 6000) { work = 0; await ctx.yield(); }
  }
  const at = (x, z) => {
    const fx = (x - CV2.x0) / CV2.cell, fz = (z - CV2.z0) / CV2.cell; if (!(fx >= 0 && fz >= 0 && fx < NX - 1 && fz < NZ - 1)) return 0;
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * NX + i;
    return (dip[k] * (1 - u) + dip[k + 1] * u) * (1 - v) + (dip[k + NX] * (1 - u) + dip[k + NX + 1] * u) * v;
  };
  const deep = (x, z) => { const i = Math.round((x - CV2.x0) / CV2.cell), j = Math.round((z - CV2.z0) / CV2.cell); return i >= 0 && j >= 0 && i < NX && j < NZ ? depth[j * NX + i] : 0; };
  await ctx.yield();
  // the same field as a texture for the land's shader (depth / 16 m in one byte: deeper than that is one blue-black), filled a part at a time
  // (second part: a second byte says where the land is cut open for a true trench; third part: the map has its own
  // smaller copies, so that a slot narrower than the pixel's footprint closes into its mean, a blue line on the snow)
  const data = new Uint8Array(NX * NZ * 2);
  for (let k0 = 0; k0 < NX * NZ; k0 += 120000) { const k1 = Math.min(NX * NZ, k0 + 120000); for (let k = k0; k < k1; k++) { data[k * 2] = Math.min(255, Math.round(depth[k] / 16 * 255)); data[k * 2 + 1] = hole[k]; } await ctx.yield(); }
  const tex = new THREE.DataTexture(data, NX, NZ, THREE.RGFormat, THREE.UnsignedByteType); tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 8; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  // where each cornice block lies: beside its slot's edge, on the side dealt
  // (fifth part, P6: every block dealt is handed on, in the order dealt; one that the place leaves out (its slot is
  //  closed, or it would lie on what must stay whole or over a crevasse) is marked `out`, so that whoever deals more
  //  for each block deals for it too and the later blocks' share of that stream does not shift)
  const placed = [];
  for (const b of blocks) { const c = b.c, cr = Math.cos(c.rot), sr = Math.sin(c.rot), lx = b.q * c.half, lz = c.bow * (1 - b.q * b.q) + b.side * (c.w + b.off);
    const x = c.xc + lx * cr - lz * sr, z = c.zc + lx * sr + lz * cr; placed.push({ x, z, s: b.s, yaw: b.yaw, tip: b.tip, out: c.open <= 0 || o.keep(x, z) <= 0 || deep(x, z) > 0.3 }); }
  return { at, depthAt: deep, texture: tex, list, trenches: list.filter((c) => c.open > 0), blocks: placed, box: new THREE.Vector4(CV2.x0, CV2.z0, 1 / CV2.w, 1 / CV2.d) };
}

// ---------------------------------------------------------------- ash falling over the plateau
// Flakes of ash, each with a place of its own in the world on a lattice of boxes; the copy of each nearest the eye's
// place is the one drawn (a drawing window, as the kit's own snow has). How many fall at a place is a rule of the
// place: on the plateau only (behind the lip), thinning with distance from the crater. Dark, small, slow.
const ASH_VS = /* glsl */`
attribute vec4 aSeed;      // xyz: the flake's place in its box (0..1); w: its rank (0..1: the lower, the further from the mountain it still falls)
uniform float uTime; uniform vec3 uBox, uVel; uniform vec4 uCr;      // uCr: crater x, z (world), mirror sign, -
varying vec2 vUv; varying float vA;
void main(){
  vec3 base = aSeed.xyz*uBox + uVel*uTime + vec3(.5*sin(uTime*.7 + aSeed.x*40.), 0., .5*cos(uTime*.5 + aSeed.z*40.));
  vec3 w = cameraPosition + mod(base - cameraPosition + .5*uBox, uBox) - .5*uBox;
  float lx = w.x*uCr.z, dUp = -w.z + .00075*lx*lx*smoothstep(-430., -620., w.z);
  float amt = smoothstep(700., 745., dUp)*(1. - smoothstep(1350., 2700., length(w.xz - uCr.xy)));
  vec3 toEye = cameraPosition - w; float dist = length(toEye); toEye /= max(dist, 1e-3);
  vec3 r = normalize(cross(vec3(0., 1., 0.), toEye) + vec3(1e-4, 0., 0.)), u = cross(toEye, r);
  float s = .009 + .015*fract(aSeed.w*17.3);
  vUv = position.xy*2.; w += (r*position.x + u*position.y)*s*2.;
  vA = step(aSeed.w, amt)*smoothstep(2., 6., dist);      // (one near fade in plain metres)
  gl_Position = vA > 0. ? projectionMatrix*viewMatrix*vec4(w, 1.) : vec4(2., 2., 2., 1.);
}`;
const ASH_FS = /* glsl */`
precision highp float;
varying vec2 vUv; varying float vA;
void main(){ float r2 = dot(vUv, vUv); if (r2 > 1.) discard; float a = vA*.8*(1. - r2*r2); gl_FragColor = vec4(vec3(.035, .032, .036)*a, a); }`;
// o: rng, count, crater [x, z] in the world's own (mirrored) metres, mx, wind [x, z] (world)
export function makeAshfall(S, o) {
  const n = o.count, seed = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) seed[i] = o.rng();
  const g = new THREE.InstancedBufferGeometry(), base = new THREE.PlaneGeometry(1, 1); g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.instanceCount = n;
  const uniforms = { uTime: S.uTime, uBox: { value: new THREE.Vector3(46, 28, 46) }, uVel: { value: new THREE.Vector3(o.wind[0] * 2.2, -1.1, o.wind[1] * 2.2 + 0.4) }, uCr: { value: new THREE.Vector4(o.crater[0], o.crater[1], o.mx, 0) } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms, vertexShader: ASH_VS, fragmentShader: ASH_FS, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor }));
  mesh.frustumCulled = false; mesh.renderOrder = 7; mesh.name = 'plateau-ashfall';
  return { object: mesh, uniforms, triangles: n * 2 };
}

// ---------------------------------------------------------------- rock, snow and ice lumps (one mesh)
// aPart 0: rock (cold slate, bedded, snow on its ledges); 1: snow; 2: ice; 3: a trench's wall and floor (aK 0 at the
// lip, 1 at the floor). Lit by the world's lights; the eruption's belly reaches the snow only, faintly; far ones take
// the dusk's haze.
const ROCK_VS = /* glsl */`
attribute vec3 color; attribute float aPart, aK;
varying vec3 vW, vN, vC; varying float vPart, vK;
void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); vC = color; vPart = aPart; vK = aK; gl_Position = projectionMatrix*viewMatrix*w; }`;
const ROCK_FS = /* glsl */`
precision highp float;
varying vec3 vW, vN, vC; varying float vPart, vK;
uniform vec3 uHazeCol; uniform float uHaze;
${SBV_NOISE}
${SBV_LIGHT}
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  float fine = sF2(vW.xz/11. + vW.y/9.), bed = sN2(vec2(vW.y/6. + 2.*sN2(vW.xz/70.), dot(vW.xz, vec2(.6, .8))/120.));
  vec3 alb = vC*(.8 + .4*fine); float snowK = vPart > .5 && vPart < 1.5 ? 1. : 0.;
  if (vPart < .5) { alb *= .6 + .9*bed;                                               // beds of darker and lighter rock
    snowK = smoothstep(.42, .7, n.y + .4*(fine - .5)); alb = mix(alb, vec3(.62, .68, .76), snowK); }  // snow on every ledge
  else if (vPart > 1.5 && vPart < 2.5) alb = mix(alb, vec3(.62, .68, .76), smoothstep(.3, .7, n.y + .3*(fine - .5)));
  // (second part, B1) rock is cold: the fire's red reaches the snow that lies on it, faintly, never the rock
  vec3 c = alb*(sbvLight(vW, n) + .4*snowK*sbvBelly(vW, n));
  // (second part, B6) a trench's faces: blue ice at the lip going down to blue-black; vK is 0 at the lip, 1 at the floor.
  // (third part, C2) its beds are of uneven thickness, waver and break (the wall's own height, warped by slow noise in
  // all three directions: no ruling); steep fracture lines cross them; snow lies on every ledge; and all of this fine
  // detail fades into its mean as the pixel's footprint on the wall grows past it (declared in the header).
  if (vPart > 2.5) {
    float t = vW.y + 1.3*sN3(vec3(vW.xz/9., vW.y*.33)) + .4*sN3(vec3(vW.xz/2.6, vW.y*1.2));
    float bedsK = 1. - smoothstep(.35, 1., fwidth(t)*1.5), fr = sN3(vec3(vW.xz*1.1, vW.y*.22) + 3.7), frK = 1. - smoothstep(.02, .07, fwidth(fr));
    float beds = mix(.5, sN3(vec3(vW.xz/2.6, t*1.5)), bedsK), dirt = smoothstep(.7, .82, sN3(vec3(vW.xz/15., t*.5 + 7.)))*bedsK;
    float crack = (1. - smoothstep(.012, .045, abs(fr - .5)))*frK;
    vec3 ice = mix(vec3(.09, .25, .42), vec3(.005, .013, .035), smoothstep(0., .65, vK))*(.76 + .48*beds)*(1. - .4*dirt)*(1. - .5*crack);      // (fourth part, E3b: beds that break every few metres along the wall, quieter: no stripes on a short trench)
    c = ice*(sbvSky(n)*.6 + sbvSky(vec3(0., 1., 0.))*.3*(1. - vK)) + vec3(.004, .022, .036)*(1. - vK)*(1. - vK);
    float ledge = smoothstep(.4, .75, n.y + .25*(fine - .5) + .5*(sN2(vW.xz*.9 + 3.) - .5))*(1. - smoothstep(.55, .9, vK));      // (fourth part: snow in patches along a ledge, not one pale band)
    c = mix(c, vec3(.62, .68, .76)*sbvSky(vec3(0., 1., 0.))*(1. - .7*vK), ledge); }
  float dist = length(vW - cameraPosition);
  c = mix(c, uHazeCol, uHaze*(1. - exp(-dist/2600.)));
  gl_FragColor = vec4(sbvFog(c, dist, .5), 1.);
}`;
// a crag: a jagged cone of flat faces. A: the accumulator; (x, y, z) its foot; R its foot's radius; H its height
function addCrag(A, noise, x, y, z, R, H, key) {
  const SEG = 11, RING = 5, P = (i, j) => { const an = (i % SEG) / SEG * Math.PI * 2, t = j / RING, ca = Math.cos(an), sa = Math.sin(an);
    const r = R * Math.pow(t, 0.75) * (1 + 0.38 * noise.n2(ca * 1.7 + key, sa * 1.7 + t * 2.3)), h = H * Math.pow(1 - t, 1.25) * (1 + 0.35 * noise.n2(ca * 2.9 - key, sa * 2.9 + key)) - (t > 0.99 ? 6 : 0);
    return new THREE.Vector3(x + ca * r * 1.25, y + h, z + sa * r * 0.85); };
  for (let j = 0; j < RING; j++) for (let i = 0; i < SEG; i++) { const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1); if (j > 0) A.tri(a, c, b); A.tri(a, d, c); }
}
// (second part, B6) one crevasse as a true trench: the same outline the baked map has (its middle line and half-width
// at stations 1.6 m apart), two walls leaning in to a narrow floor, a broken lip of hard snow standing 2 to 12 cm proud
// of the land and running under it outside the cut. ground (x, z) => the land's height (not dipped here).
// (third part, C2) no wall is one flat face: part of the way down, each wall breaks back in a ledge up to 0.9 m wide
// that comes and goes along the slot (snow lies on it), and the wall below leans in from the ledge's foot.
function addTrench(A, noise, c, ground) {
  const cr = Math.cos(c.rot), sr = Math.sin(c.rot), N = Math.max(4, Math.ceil(c.half * 2 / 1.6)), rows = [];
  for (let i = 0; i <= N; i++) { const q = Math.max(-0.999, Math.min(0.999, -1 + 2 * i / N)), lx = q * c.half;
    const kf = (q + 1) * 8, ki = Math.min(15, Math.floor(kf)), kk = c.keep[ki] + (c.keep[ki + 1] - c.keep[ki]) * (kf - ki);
    const mid = c.bow * (1 - q * q) + 1.6 * noise.n2(lx / 17 + c.key, c.key * 0.7) + 0.5 * noise.n2(lx / 4.5, c.key);
    const hw0 = c.w * Math.pow(1 - q * q, 0.6) * (0.75 + 0.5 * noise.n2(lx / 23 - c.key, 3.3)) * kk, cx0 = c.xc + lx * cr - mid * sr, cz0 = c.zc + lx * sr + mid * cr;
    // (cut only where the baked map reaches: a slot that runs out of the map's box ends there)
    const open = hw0 >= TRENCH_MIN && cx0 > CV2.x0 + 8 && cx0 < CV2.x0 + CV2.w - 8 && cz0 > CV2.z0 + 8 && cz0 < CV2.z0 + CV2.d - 8, hw = open ? hw0 : 0;
    const D = open ? Math.max(2.5, Math.min(16, c.dep * Math.min(1, hw / 1.5))) : 0.9, e = open ? hw + 0.25 : 0.12, row = { open };
    for (const s of [-1, 1]) { const at = (lz) => [c.xc + lx * cr - lz * sr, c.zc + lx * sr + lz * cr], V = (pt, y) => new THREE.Vector3(pt[0], y, pt[1]);
      const pt = at(mid + s * e), g = ground(pt[0], pt[1]), po = at(mid + s * (e + 0.8));
      // (fourth part, E3b: the ledge is there over about two fifths of a wall's length, in pieces a few metres long, and
      //  its depth wanders between 0.15 and 0.45 of the wall's, so it is never one level band along a short trench)
      const shelf = open ? Math.min(0.9, 0.5 * hw, Math.max(0, noise.n2(lx / 5 + s * 3.7 + c.key, c.key * 1.3 + s) - 0.12) * 2.2) : 0;
      const kl = 0.15 + 0.3 * (0.5 + 0.5 * noise.n2(lx / 6 - c.key, s * 5.1)), xa = hw * 0.93 + 0.1 * noise.n2(lx / 3.1 + s, c.key * 2.1), xb = Math.max(hw * 0.4, xa - shelf);
      row[s] = { top: V(pt, g + 0.02 + 0.1 * (0.5 + 0.5 * noise.n2(lx / 2.3 + s * 7, c.key))), out: V(po, ground(po[0], po[1]) - 0.9),
        la: V(at(mid + s * xa), g - D * kl), lb: V(at(mid + s * xb), g - D * kl - 0.15 * (xa - xb)), bot: V(at(mid + s * hw * 0.3), g - D), kl, sh: xa - xb }; }
    rows.push(row);
  }
  const U = undefined;
  for (let i = 0; i < N; i++) { const a = rows[i], b = rows[i + 1]; if (!a.open && !b.open) continue;
    for (const s of [-1, 1]) { const p = a[s], q = b[s];
      A.id(3).color('#3a78a8');
      A.tri(p.top, q.top, q.la, U, U, U, 0, 0, q.kl); A.tri(p.top, q.la, p.la, U, U, U, 0, q.kl, p.kl);                           // the wall above the ledge
      if (p.sh > 0.04 || q.sh > 0.04) { A.tri(p.la, q.la, q.lb, U, U, U, p.kl, q.kl, q.kl); A.tri(p.la, q.lb, p.lb, U, U, U, p.kl, q.kl, p.kl); }      // the ledge
      A.tri(p.lb, q.lb, q.bot, U, U, U, p.kl, q.kl, 1); A.tri(p.lb, q.bot, p.bot, U, U, U, p.kl, 1, 1);                         // the wall below it
      A.id(1).color('#b4c3d8'); A.tri(p.top, q.top, q.out, U, U, U, 0, 0, 0); A.tri(p.top, q.out, p.out, U, U, U, 0, 0, 0); }     // the lip
    A.id(3).color('#0a1830'); A.tri(a[-1].bot, b[-1].bot, b[1].bot, U, U, U, 1, 1, 1); A.tri(a[-1].bot, b[1].bot, a[1].bot, U, U, U, 1, 1, 1);    // the floor
  }
}
// (third part, C2) a fallen lump of cornice: a six-faced block with every corner pushed its own way, so that no face
// is square or flat; rot: how it lies (Euler x, y, z)
function addLump(A, J, x, y, z, sx, sy, sz, rot) {      // J: the 24 dealt measures of its eight corners
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2], 'YXZ')), C = [];
  for (let i = 0; i < 8; i++) C.push(new THREE.Vector3((i & 1 ? 1 : -1) * sx * J[i * 3], (i & 2 ? 1 : -1) * sy * J[i * 3 + 1], (i & 4 ? 1 : -1) * sz * J[i * 3 + 2]).applyQuaternion(q).add(new THREE.Vector3(x, y, z)));
  for (const [a, b, c, d] of [[0, 1, 3, 2], [5, 4, 6, 7], [4, 0, 2, 6], [1, 5, 7, 3], [2, 3, 7, 6], [4, 5, 1, 0]]) { A.tri(C[a], C[c], C[b]); A.tri(C[a], C[d], C[c]); }
}
// o: noise, crags [{ x, z, y, R, H, key }], wind [x, z], foot [{ x, z, y, yaw, len, wid, h, rock }], blocks [{ x, z, s, yaw, tip, out }]
//    (where a cornice block fell, as the crevasses dealt it), blockRng (a stream of its own for the lumps of each fall),
//    over (x, z) => how deep a crevasse is there, trenches (every open crevasse) and ground (x, z) => y for them
export async function makeRocks(ctx, S, o) {
  const A = new Acc(), W = o.wind;
  for (const c of o.crags) {
    A.id(0).color('#1d222d'); addCrag(A, o.noise, c.x, c.y - 4, c.z, c.R, c.H, c.key);
    // its drift tail: a long low ramp of snow in its lee, and a bank on its weather side
    A.id(1).color('#9fb0c8');
    A.ball(c.x + W[0] * c.R * 2.6, c.y - 2, c.z + W[1] * c.R * 2.6, c.R * 2.9, c.H * 0.2, c.R * 0.62, 10, 5, 0);
    A.ball(c.x - W[0] * c.R * 0.8, c.y - 2, c.z - W[1] * c.R * 0.8, c.R * 0.7, c.H * 0.16, c.R * 0.9, 9, 5, 0);
    await ctx.yield();
  }
  // drifts (snow) and moraine (rock) where the far ground meets the white mountain
  let k = 0;
  for (const f of o.foot) {
    A.m = new THREE.Matrix4().compose(new THREE.Vector3(f.x, f.y, f.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, f.yaw, 0)), new THREE.Vector3(1, 1, 1));
    if (f.rock) A.id(0).color('#34303a'); else A.id(1).color('#a3b3cb');
    A.ball(0, 0, 0, f.len, f.h, f.wid, 9, 5, 0);
    if (++k % 12 === 0) await ctx.yield();
  }
  A.m = null;
  // cornice blocks on the lips of the wide crevasses: tilted lumps of hard snow and ice
  // (third part, C2) where each block fell it lies broken: a tumbled group of three to five lumps of unlike size (the
  // largest where the block was dealt, lying as it was dealt; the others a quarter to seven tenths of it, within
  // 0.8 to 2.2 of its size round it, each lying its own way), every lump drifted in to half its height, with snow on
  // what of it is turned up; none stands alone, none is square. The lumps are dealt from a stream of their own.
  { const br = o.blockRng; let nb = 0;
    for (const b of o.blocks) { const n = 3 + Math.floor(br.range(0, 2.99));
      for (let i = 0; i < n; i++) { const s = b.s * (i === 0 ? 1 : br.range(0.25, 0.7)), d = i === 0 ? 0 : b.s * br.range(0.8, 2.2), an = br.range(0, 6.283), rot = [br.range(-0.6, 0.6), br.range(0, 6.283), br.range(-0.6, 0.6)], J = [];
        for (let k = 0; k < 24; k++) J.push(br.range(0.5, 1.1));      // (fourth part, F4: every lump takes all its draws; the test of the place comes after)
        if (b.out) continue;      // (fifth part, P6: a block the place leaves out has taken its lumps' draws and makes nothing)
        const x = b.x + Math.cos(an) * d, z = b.z + Math.sin(an) * d; if (i > 0 && o.over(x, z) > 0.05) continue;      // (a lump that would lie over a crevasse fell into it)
        const y = o.ground(x, z);
        A.id(2).color('#8fa8c8'); addLump(A, J, x, y + 0.03 * s, z, 0.85 * s, 0.5 * s, 0.6 * s, i === 0 ? [b.tip, b.yaw, b.tip * 0.6] : rot); }
      if (++nb % 8 === 0) await ctx.yield(); } }
  await ctx.yield();
  // (second part, B6; third part, C2) the true trench of every open crevasse
  let nt = 0; for (const c of (o.trenches || [])) { addTrench(A, o.noise, c, o.ground); if (++nt % 2 === 0) await ctx.yield(); }
  await ctx.yield();
  const uniforms = { ...sharedUniforms(S), uHaze: { value: 0.45 }, uHazeCol: { value: new THREE.Color(o.hazeColor ?? '#22355E') } };
  const mesh = new THREE.Mesh(A.geometry(), new THREE.ShaderMaterial({ uniforms, vertexShader: ROCK_VS, fragmentShader: ROCK_FS, side: THREE.DoubleSide })); mesh.name = 'plateau-rocks'; mesh.frustumCulled = false;
  return { object: mesh, uniforms, triangles: A.triangles };
}

// ---------------------------------------------------------------- more stars over the dark half of the sky
// Points on the sky's own sphere (drawn by direction alone, so they never slide against the sky). Each has a
// direction, a least width in pixels (a star has no size in metres: declared in the header) and a brightness of its
// own; uLevel is the level of live's own star field, handed in by the world each frame: these are part of that field.
const STAR_VS = /* glsl */`
attribute vec3 aDir; attribute vec2 aMag;      // x: brightness, y: where its twinkle starts
uniform float uTime, uLevel; varying float vB;
void main(){
  vB = aMag.x*uLevel*(.75 + .25*sin(uTime*(1.3 + 2.*fract(aMag.y*7.)) + aMag.y*40.));
  vec4 p = projectionMatrix*vec4(mat3(viewMatrix)*aDir*5200., 1.);
  gl_Position = p; gl_PointSize = 1.4 + 1.4*aMag.x;
}`;
const STAR_FS = /* glsl */`
precision highp float;
varying float vB;
void main(){ vec2 d = gl_PointCoord - .5; float a = 1. - smoothstep(.1, .5, length(d)); gl_FragColor = vec4(vec3(.8, .88, 1.)*vB*a, 1.); }`;
// o: rng, count, away [x, z] (the afterglow's bearing as a unit vector on the ground: stars keep to the half of the sky away from it, and high over it)
export function makeStars(S, o) {
  const n = o.count, dir = new Float32Array(n * 3), mag = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { let x, y, z, tries = 0;
    do { const a = o.rng.range(0, Math.PI * 2), h = o.rng.range(0.03, 1); y = h; const r = Math.sqrt(1 - h * h); x = Math.cos(a) * r; z = Math.sin(a) * r; tries++; }
    while (tries < 8 && (x * o.away[0] + z * o.away[1]) > 0.25 * Math.sqrt(1 - y * y) && y < 0.55);
    dir[i * 3] = x; dir[i * 3 + 1] = y; dir[i * 3 + 2] = z; mag[i * 2] = Math.pow(o.rng(), 2.2); mag[i * 2 + 1] = o.rng(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('aDir', new THREE.BufferAttribute(dir, 3)); g.setAttribute('aMag', new THREE.BufferAttribute(mag, 2));
  const uniforms = { uTime: S.uTime, uLevel: { value: 0 } };
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms, vertexShader: STAR_VS, fragmentShader: STAR_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.frustumCulled = false; pts.renderOrder = -1; pts.name = 'night-stars';
  return { object: pts, uniforms };
}

// ---------------------------------------------------------------- the ice's far edge
// A low uneven band along the horizon, 4,700 m out all round the plateau: far scarps and swells of the ice cap, darker
// than the sky's foot behind them. o: noise, centre [x, z], y (the plateau's height), hor (16 colours of the sky's horizon)
const EDGE_VS = /* glsl */`
varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const EDGE_FS = /* glsl */`
precision highp float;
varying vec3 vW; uniform vec3 uHor[16]; uniform vec3 uCentre;
void main(){
  vec2 d = normalize(vW.xz - uCentre.xz + vec2(1e-4, 0.)); float a = atan(d.x, -d.y)/6.2831853*16.; a = mod(a + 16., 16.);
  int i0 = int(floor(a)); int i1 = i0 + 1; if (i1 > 15) i1 = 0; if (i0 > 15) i0 = 15;
  vec3 hor = mix(uHor[i0], uHor[i1], fract(a));
  gl_FragColor = vec4(hor*mix(.5, .8, smoothstep(0., 150., vW.y - uCentre.y)), 1.);
}`;
export function makeFarEdge(o) {
  const N = 180, R = 4700, pos = [], idx = [];
  for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    const h = 26 + 95 * Math.pow(Math.max(0, o.noise.n2(ca * 3.3 + 5, sa * 3.3 - 2)), 1.2) + 36 * Math.max(0, o.noise.n2(ca * 11 + 1, sa * 11)) + 14 * o.noise.n2(ca * 31, sa * 31 + 7);
    pos.push(o.centre[0] + ca * R, o.y - 30, o.centre[1] + sa * R, o.centre[0] + ca * R, o.y + Math.max(4, h), o.centre[1] + sa * R); }
  for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uHor: { value: o.hor }, uCentre: { value: new THREE.Vector3(o.centre[0], o.y, o.centre[1]) } }, vertexShader: EDGE_VS, fragmentShader: EDGE_FS, side: THREE.DoubleSide }));
  mesh.name = 'far-edge'; mesh.frustumCulled = false;
  return { object: mesh, triangles: N * 2 };
}
