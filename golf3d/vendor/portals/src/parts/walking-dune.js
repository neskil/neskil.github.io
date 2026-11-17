// The Walking Dune: hero set piece + the voxel STYLE KIT of the world "walking-dune".
//
// HERO  buildHero(ctx, opts) -> { object, radius, height, center, anchors, update, dispose, ground:false,
//                                 style, terrain, cubes, mantle, sheet, banner, heaps, setProgress(u), state }
//   The whole dune as living ground (480 x 640 m; crest ~78 m, standing at z = anchors.crestZ ~ -24 so the slip foot
//   is at z 93; a concave stepped back in 16 m strata; horns to x = +-130, z = +210), the
//   crest banner, the sand-mantled dome (30 m wide, 26 m tall, at x +24, z 136), twelve buried palms at the slip
//   foot, the chequered paving swept bare, the channel (x 3 to 6, flush, turquoise with glint squares) and the star pool (z 252). The wall, ring, arches, houses,
//   yacht, clouds and creatures are the world's, built with the same kit.
//   The lee side is an amphitheatre: the face of repose measured from the nearest of the knife edge (a table, amph),
//   laid in courses 4 m high (8 m on the far window) that alternate MAT.COURSE (ochre tread, pale-gold riser; violet over
//   deep violet in shadow) and MAT.LEE (deep ochre tread, ochre riser; pale violet over violet in shadow), so a shadowed
//   stair still counts its steps; only the two 16 m strips the course rides down keep straight stairs.
//   The crescent is 260 m across (HX 130), so both horns stand in the frame from the crest. `slide` is the avalanche
//   (whole 1.5 m blocks on a 2 m lattice of the near window, in two wings set by style.uniforms.uAvW, painted in MAT.AVA:
//   dark ochre in the sun, pale violet in shadow, each with a violet bar as broad as itself) and a second batch of 2 m blocks does
//   the same on the 2 m window, three times the size (opts.slide, opts.slide2 = counts); state.cl = [x0,x1,z0,z1] is a
//   cloud's shadow on the back. anchors.crestAt(x, out) takes a Vector3 to fill.
//   opts: palette (brief's 7 hex) | style (the shared makeStyle instance; then call style.update yourself, first)
//         | detail 0.6..1 (thins loose sand and banner) | cells [[W,L] x3] window sizes in cells, multiples of 4
//         (default [[48,64],[84,112],[56,80]] ~150k triangles; the brief's [[128,160],[128,160],[64,88]] ~290k)
//         | loose [n,n,n] hopping cubes per window | follow 'focus' (default: an outside viewer) or 'course'
//         (THE JOURNEY: windows lead the eye along +Z; set it) | sky (add style.makeSky(); default only standalone)
//         | exposure (post.exposure the world uses, default 2.6: every ink then stays under 0.85, nothing blooms).
//         | solidAt(x, z) -> top (m) of anything the world has standing on the hollow floor: it casts cell shadows
//         | farOrigin [x, z] of the 8 m window.  makeStyle also takes opts.hex: a whole colourway by ink name
//         (plus skyLow, skyUnder); makeCubes and makeThrown take { eye: { value: Vector3 } } for a batch that lives
//         in its own moving frame (the yacht), so its faces are chosen from that frame's eye.
//   setProgress(u): u = 0..1 of the 41 s journey; keys the dome's courses (third going at the crest, tenth at 32 s),
//         the palms' digging-out, the floor sweep, the channel and the pool's three layers. Until it is called the
//         piece loops the whole giving-back on the clock. Call it every frame from the world's update (u from the path).
//   anchors (local): portalSeat {position (0,9.4,290), normal -Z, radius 7}; flyThrough [16 points: plain, S-bend
//         to port up the back, crest (+4.5 m), slip face, hollow, pool, ring], >= 2.9 m over the sand, palms and
//         dome >= 7 m off it; crestEye (the reveal); dome {center, top, radius, height}; pool; channel; palms[12];
//         hornTips[2]; slipFoot; toe; crestHeight; wallZ; heightAt(x,z); crestAt(x); toBriefZ = 430.
//   cost: 12 draw calls (3 ground windows, 3 loose, dome, mantle, sheet, palm heaps, banner, sky), ~146k triangles
//         with all three windows on (121k from outside), build ~65 ms, no step over 50 ms (tools/buildsteps);
//         per sand tick the CPU refills the 0.5 m and 2 m windows (~13k height samples + shadow sweep, ~3 ms).
//
// STYLE LAW (brief.styleNote) and how this file keeps it
//   - Every pixel is one of fourteen flat colours. All materials here are unlit ShaderMaterials whose fragment
//     colour is ONE texel of style.table (a 8x16 half-float texture: row = material id, column = face tone
//     0 top, 1 sun side (+X,-Z faces), 2 shade side (-X,+Z faces and undersides), 3..5 the same three in cast
//     shadow = the violet twins). The texels are pre-compensated through the inverse of the engine's ACES curve,
//     so with post { exposure 1, bloom 0, saturation 1, contrast 1, vignette 0, grain 0 } the screen shows the hex.
//   - No lights, fog, textures, outlines, blending, gradients. Tone is a choice of column, never a multiplier.
//   - A cast shadow is a CELL flag (ground: scanned on the CPU along the 3:1 sun line each sand tick; cubes: a
//     per-instance flag you set with ground.inShadow()). It moves by whole cells.
//   - Distance is size: the ground is three nested windows of instanced columns (0.5 m, 2 m, 8 m cells) that
//     snap to their own grid; coarse cells are honest merges. Loose sand cubes hop on each window at 3 m/s.
//   - The medium moves on a six-per-second TICK (style.uniforms.uTick): hop 0.1 s, rest 0.07 s; tumbles turn a
//     quarter and land square; treads re-step by whole cubes; nothing slides.
//
// Local frame: +Z is the course and the wind, +X right, y = 0 the hollow floor / plain. Local z = brief z - 430
// (the slip foot is at z 93, the crest centre at anchors.crestZ). HANDEDNESS: three.js is right-handed, so looking down the course (+Z)
// the viewer's RIGHT is -X: brief x (right-positive) = -local x. Port = +X. The dome is at x = +24 (port), the sun
// is behind the port quarter = horizontal direction (+3,-1), 17.5 deg up; shadows fall toward -X (three cells per
// cube of height) and +Z (one cell). "Sun side" faces are +X and -Z; "shade side" faces are -X and +Z.
import * as THREE from 'three';

// ---------------------------------------------------------------- palette
const HEX = {
  sandSun: '#F7DFA0', sandTop: '#E7BC72', sandSlip: '#D0964A', sandShade: '#A86C3A', sandDeep: '#7A4A2C',
  turquoise: '#1FB8B0', lapis: '#1E3F9A', whitewash: '#F4EEDC', palm: '#2E7D4F',
  skyBlue: '#6FA9D8', skyPale: '#BFD9E6', violetPale: '#B9A6D6', violet: '#7E62A8', violetDeep: '#3D2B66',
};
// brief.palette order: [sandTop, sandShade, turquoise, lapis, whitewash, violet, skyBlue]
const BRIEF_ORDER = ['sandTop', 'sandShade', 'turquoise', 'lapis', 'whitewash', 'violet', 'skyBlue'];

// Material ids = rows of the tone table. [top, sun side, shade side, shadow top, shadow sun side, shadow shade side]
export const MAT = { SAND: 0, SLIP: 1, WHITE: 2, TURQ: 3, LAPIS: 4, PALM: 5, BRICK: 6, HARDPAN: 7, DUST: 8, TRUNK: 9, WATER: 10, PAVE: 11, SKYB: 12, TROUGH: 13, TURQ2: 14, BRICK2: 15, BIRD: 16, COURSE: 17, AVA: 18, LEE: 19, RPALE: 20, RDEEP: 21, SHADE: 22, CLOUD: 23 };
const ROWS = [
  ['sandTop', 'sandSun', 'sandShade', 'violet', 'violetDeep', 'violetDeep'],          // 0 sand
  ['sandSlip', 'sandSun', 'sandShade', 'violet', 'violetDeep', 'violetDeep'],         // 1 slip face, ripple trough, the mason's "wrong ochre"
  ['whitewash', 'whitewash', 'violetPale', 'violetPale', 'violetPale', 'violet'],     // 2 whitewash: in cast shadow pale violet, its shade side one twin deeper
  ['turquoise', 'turquoise', 'lapis', 'lapis', 'lapis', 'violetDeep'],           // 3 turquoise shades to lapis; in cast shadow its steps keep two tones
  ['lapis', 'lapis', 'violetDeep', 'violetDeep', 'violetDeep', 'violetDeep'],         // 4 lapis
  ['palm', 'palm', 'violetDeep', 'violetDeep', 'violetDeep', 'violetDeep'],           // 5 palm green
  ['sandSlip', 'sandShade', 'sandDeep', 'violet', 'violet', 'violetDeep'],            // 6 mud brick: in cast shadow its two sides still differ
  ['sandDeep', 'sandShade', 'sandDeep', 'violetDeep', 'violetDeep', 'violetDeep'],    // 7 far hardpan
  ['sandSun', 'sandSun', 'sandTop', 'violetPale', 'violet', 'violet'],                // 8 crest dust (banner, thrown sand)
  ['sandSlip', 'sandShade', 'sandDeep', 'violet', 'violetDeep', 'violetDeep'],        // 9 dark ochre (trunks, camels): three tones by side, the top the lightest
  ['turquoise', 'turquoise', 'turquoise', 'lapis', 'lapis', 'lapis'],                 // 10 water
  ['whitewash', 'whitewash', 'violetPale', 'violetPale', 'violetDeep', 'violetDeep'], // 11 paving (pale squares; dark squares use SLIP)
  ['skyBlue', 'skyPale', 'skyLow', 'skyUnder', 'skyMid', 'skyMist'],                  // 12 the sky's five steps: blue, [4] its half-step to pale, pale, [5] the half-step to the horizon's whitewash, whitewash (+ [3] below the horizon)
  ['sandSlip', 'sandSlip', 'sandShade', 'violet', 'violet', 'violet'],                // 13 trough course: the darker ochre laid at a riser's foot (dune strata)
  ['turquoise', 'turquoise', 'lapis', 'lapis', 'lapis', 'violet'],                    // 14 every other dome course: the same turquoise in sun, one twin lighter in shadow, so the shaded flank keeps its courses
  ['sandTop', 'sandSlip', 'sandShade', 'violet', 'violet', 'violetDeep'],              // 15 the lighter brick course (gatehouse)
  ['whitewash', 'whitewash', 'whitewash', 'violetPale', 'violetPale', 'violetPale'],   // 16 a white bird: white from every side, so from below it is not taken for a cloud
  ['sandTop', 'sandSun', 'sandShade', 'violet', 'violetDeep', 'violetDeep'],            // 17 every other course of the lee face: ochre tread, pale gold riser; in shadow a violet tread over a deep violet riser (the trough course between is pale violet over violet), so a shadowed stair still counts its steps
  ['sandShade', 'sandDeep', 'sandDeep', 'violetPale', 'violetPale', 'violet'],            // 18 loosened sand (the avalanche): dark ochre on the pale stairs in the sun, pale violet on the violet stairs in shadow
  ['sandSlip', 'sandTop', 'sandShade', 'violetPale', 'violet', 'violet'],               // 19 the lee face's other course: deep ochre tread, ochre riser; in shadow a pale violet tread over a violet riser
  ['skyPale', 'skyPale', 'skyPale', 'violetPale', 'violetPale', 'violetPale'],          // 20 whitewash as the pool shows it back (a reflection is the thing's water twin, laid in whole cells)
  ['violetDeep', 'violetDeep', 'violetDeep', 'violetDeep', 'violetDeep', 'violetDeep'], // 21 lapis as the pool shows it back
  ['violet', 'violet', 'violet', 'violet', 'violet', 'violet'],                         // 22 a drawn shadow shape lying on sand or paving (a flat slab: the long shadow of a block in the low sun)
  ['whitewash', 'whitewash', 'violetPale', 'violetPale', 'violetPale', 'violet'],       // 23 a block cloud: whitewash top and sun side, pale violet shade side and underside
];

// Inverse of the engine's tone map (src/core/post.js: col*exposure/0.6 -> ACES fit), per colour, at build.
const M_IN = new THREE.Matrix3().set(0.59719, 0.35458, 0.04823, 0.07600, 0.90834, 0.01566, 0.02840, 0.13383, 0.83777);
const M_OUT = new THREE.Matrix3().set(1.60475, -0.53108, -0.07367, -0.10208, 1.10813, -0.00605, -0.00327, -0.07276, 1.07602);
const M_IN_I = M_IN.clone().invert(), M_OUT_I = M_OUT.clone().invert();
function fitInv(v) {            // solve (x*(x+.0245786)-.000090537)/(x*(.983729x+.432951)+.238081) = v for x >= 0
  v = Math.min(Math.max(v, 0), 0.985);
  const a = 1 - 0.983729 * v, b = 0.0245786 - 0.432951 * v, c = -0.000090537 - 0.238081 * v;
  return (-b + Math.sqrt(Math.max(b * b - 4 * a * c, 0))) / (2 * a);
}
function fitFwd(x) { return (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.432951) + 0.238081); }
/** hex (what the screen must show) -> linear scene colour to write, for post.exposure = exposure. */
export function inkFor(hex, exposure = 1) {
  const t = new THREE.Color(hex);                         // target, display-linear
  const tv = new THREE.Vector3(t.r, t.g, t.b);
  const v = tv.clone().applyMatrix3(M_OUT_I);
  const x = new THREE.Vector3(fitInv(v.x), fitInv(v.y), fitInv(v.z)).applyMatrix3(M_IN_I);
  x.max(new THREE.Vector3(0, 0, 0)).multiplyScalar(0.6 / exposure);
  return new THREE.Color().setRGB(x.x, x.y, x.z, THREE.LinearSRGBColorSpace);
}

// Shared GLSL: tone lookup and a cell hash (integer, no sin).
const GLSL_COMMON = /* glsl */`
  uniform highp sampler2D uTab;
  vec3 wdTone(int mat, int face, bool sh){ return texelFetch(uTab, ivec2(face + (sh ? 3 : 0), mat), 0).rgb; }
  float wdHash(ivec2 c){ uint n = uint(c.x) * 73856093u ^ uint(c.y) * 19349663u; n ^= n >> 13; n *= 1274126177u; n ^= n >> 16;
    return float(n & 0xffffu) / 65535.; }
`;
const FRAG_FLAT = /* glsl */`flat varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.); }`;
const SUN_X = 3, TICK_HZ = 6;   // the sun's 3:1 grid line; sand ticks per second

// ---------------------------------------------------------------- the style kit
/**
 * makeStyle(ctx, opts) -> the one shared style instance of the world.
 *   opts.palette   brief palette (7 hex: sandTop, sandShade, turquoise, lapis, whitewash, violet, skyBlue)
 *   opts.exposure  the post.exposure the world will use (default 1); inks are compensated for it
 * returns {
 *   hex, pal            the fourteen colours: hex strings, and compensated linear THREE.Color (pal.sandTop ...)
 *   MAT                 material ids (rows of the tone table): SAND SLIP WHITE TURQ LAPIS PALM BRICK HARDPAN DUST TRUNK WATER PAVE
 *   table, uniforms     { uTab, uTick, uEye }: shared by every material; driven by update()
 *   sun                 { x:3, z:-1, rise: 1/3 }  toward the sun; one cube of height = three cells of shadow toward -X, one toward +Z
 *   makeCubes(n)        instanced axis-aligned boxes (whole cubes merged into boxes; no edges exist, so it is the same picture)
 *   makeGround(o)       the three nested column windows over a height function (see there)
 *   makeLoose(o)        hopping / tumbling sand cubes riding one ground window
 *   makeThrown(n, o)    cell-stepped ballistic cubes (banners, sheets, plumes, chimney cubes)
 *   addPalm(batch, x,y,z, h, phase, shadow)   a date palm in 26 boxes, frond tips nodding one cube
 *   makeSky()           the three ruled bands and the square sun, as one far-plane mesh (below the horizon: slip ochre)
 *   update(dt, time, camera)   call every frame BEFORE anything else; sets uTick = time*6 and the eye
 *   root                set to the Object3D all style meshes live under (default: world space)
 * }
 */
export function makeStyle(ctx, opts = {}) {
  const hex = { ...HEX };
  (opts.palette || []).forEach((h, i) => { if (BRIEF_ORDER[i] && h) hex[BRIEF_ORDER[i]] = h; });
  Object.assign(hex, opts.hex || {});               // a whole colourway (the world's seeded looks): any of the 14 names, plus skyLow / skyUnder
  if (!hex.skyLow) hex.skyLow = hex.whitewash; if (!hex.skyUnder) hex.skyUnder = hex.sandSlip;
  const mixHex = (a, b) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), 0.5).getHexString();     // the sky pales in narrower steps: two half-steps between its three inks
  if (!hex.skyMid) hex.skyMid = mixHex(hex.skyBlue, hex.skyPale); if (!hex.skyMist) hex.skyMist = mixHex(hex.skyPale, hex.skyLow);
  const pal = {}; for (const k in hex) pal[k] = inkFor(hex[k], opts.exposure || 2.6);
  const TW = 8, TH = 32, tab = new Uint16Array(TW * TH * 4);
  ROWS.forEach((row, r) => row.forEach((name, c) => {
    const o = (r * TW + c) * 4, k = pal[name];
    tab[o] = THREE.DataUtils.toHalfFloat(k.r); tab[o + 1] = THREE.DataUtils.toHalfFloat(k.g);
    tab[o + 2] = THREE.DataUtils.toHalfFloat(k.b); tab[o + 3] = THREE.DataUtils.toHalfFloat(1);
  }));
  const table = new THREE.DataTexture(tab, TW, TH, THREE.RGBAFormat, THREE.HalfFloatType);
  table.minFilter = table.magFilter = THREE.NearestFilter; table.generateMipmaps = false; table.needsUpdate = true;
  const uniforms = { uTab: { value: table }, uTick: { value: 0 }, uEye: { value: new THREE.Vector3(0, 50, -400) } };
  const style = { hex, pal, MAT, table, uniforms, sun: { x: SUN_X, z: -1, rise: 1 / SUN_X }, root: null, tick: 0, time: 0 };
  const hooks = [];             // per-frame work of grounds etc.

  // nSlots quads; position = (u, v, slot). slot 0 = the Y face toward the eye, 1 = Z face, 2 = X face, 3 = underside.
  const faceGeo = (nSlots) => {
    const p = [], ix = [];
    for (let s = 0; s < nSlots; s++) { p.push(0, 0, s, 1, 0, s, 1, 1, s, 0, 1, s); ix.push(s * 4, s * 4 + 1, s * 4 + 2, s * 4, s * 4 + 2, s * 4 + 3); }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    return g;
  };
  const mkMat = (vertexShader, extra = {}) => new THREE.ShaderMaterial({
    uniforms: { ...uniforms, ...extra }, vertexShader: GLSL_COMMON + vertexShader, fragmentShader: FRAG_FLAT,
    side: THREE.DoubleSide, fog: false, toneMapped: false });
  const mkMesh = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.matrixAutoUpdate = true; return m; };
  const flawed = (mat, x, y, z) => {      // one cube in forty is laid in the neighbouring ochre
    if (mat > 1 && mat !== MAT.BRICK) return mat;   // (trough courses and the rest are laid true)
    let n = (Math.imul(Math.round(x * 2), 73856093) ^ Math.imul(Math.round(y * 2), 83492791) ^ Math.imul(Math.round(z * 2), 19349663)) >>> 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
    if ((n >>> 8) % 40 !== 0) return mat;
    return mat === MAT.SAND ? MAT.SLIP : mat === MAT.SLIP ? MAT.SAND : MAT.TRUNK;
  };

  // ---- boxes of cubes. add(x,y,z, sx,sy,sz, mat, shadow, pose) : (x,y,z) = min corner in metres, on the grid.
  //      pose = [dx,dy,dz, periodTicks, phase01]: the box sits at +d for half of every period (two cube poses:
  //      wings, cloths, nodding palms, the sail's belly). setShadow(i, 0|1), commit() after edits.
  //      makeCubes(n, { clock }) + pose [0,0,0,-(key+1)]: the box is gone once clock.value > key (sand dug away on cue).
  const CUBE_VS = /* glsl */`
    attribute vec3 aPos, aSize; attribute vec2 aMat; attribute vec4 aPose;
    uniform vec3 uEye; uniform float uTick, uGone; flat varying vec3 vCol;
    void main(){
      vec3 o = aPos; float lod = floor(aMat.y * .5 + .01); bool shd = aMat.y - 2. * lod > .5;
      if (aPose.w > .5) { float P = floor(aPose.w); if (fract(floor(uTick) / P + fract(aPose.w)) < .5) o += aPose.xyz; }
      vec3 c = o + .5 * aSize, p; int slot = int(position.z + .5), face;
      if (slot == 0) { bool up = uEye.y > c.y; p = o + vec3(position.x, up ? 1. : 0., position.y) * aSize; face = up ? 0 : 2; }
      else if (slot == 1) { bool s = uEye.z < c.z; p = o + vec3(position.x, position.y, s ? 0. : 1.) * aSize; face = s ? 1 : 2; }
      else { bool s = uEye.x < c.x; p = o + vec3(s ? 0. : 1., position.y, position.x) * aSize; face = s ? 2 : 1; }
      vCol = wdTone(int(aMat.x + .5), face, shd);
      bool far = length(c.xz - uEye.xz) > 72.;     // the first merge line: furniture is whole cubes inside it, 2 m blocks beyond
      gl_Position = ((aPose.w < -.5 && uGone > -aPose.w - 1.) || (lod > .5 && (far == (lod < 1.5)))) ? vec4(2., 2., 2., 1.) : projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.);
    }`;
  const cubeMat = mkMat(CUBE_VS, { uGone: { value: -1e9 } });
  style.makeCubes = (capacity, o = {}) => {
    const geo = faceGeo(3);
    const aPos = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
    const aSize = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3), 3);
    const aMat = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 2), 2);
    const aPose = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 4), 4);
    geo.setAttribute('aPos', aPos); geo.setAttribute('aSize', aSize); geo.setAttribute('aMat', aMat); geo.setAttribute('aPose', aPose);
    geo.instanceCount = 0;
    const b = { mesh: mkMesh(geo, (o.clock || o.eye) ? mkMat(CUBE_VS, { uGone: o.clock || { value: -1e9 }, ...(o.eye ? { uEye: o.eye } : {}) }) : cubeMat), count: 0, capacity,
      add(x, y, z, sx, sy, sz, mat, shadow = 0, pose = null, lod = 0) {
        const i = b.count; if (i >= capacity) return -1;
        aPos.setXYZ(i, x, y, z); aSize.setXYZ(i, sx, sy, sz); aMat.setXY(i, flawed(mat, x, y, z), (shadow ? 1 : 0) + 2 * lod);
        if (pose) aPose.setXYZW(i, pose[0], pose[1], pose[2], pose[3] < 0 ? pose[3] : Math.max(2, Math.round(pose[3])) + Math.min(0.99, pose[4] || 0));
        b.count = i + 1; return i;
      },
      setShadow(i, s) { aMat.setY(i, Math.floor(aMat.getY(i) / 2) * 2 + (s ? 1 : 0)); },
      position(i, out) { return out.set(aPos.getX(i) + aSize.getX(i) / 2, aPos.getY(i) + aSize.getY(i), aPos.getZ(i) + aSize.getZ(i) / 2); },
      commit() { geo.instanceCount = b.count; aPos.needsUpdate = aSize.needsUpdate = aMat.needsUpdate = aPose.needsUpdate = true; } };
    return b;
  };

  // ---- the ground: nested windows of instanced columns (top + the Z riser and the X riser that face the eye).
  // makeGround({ sample, cells:[W,L], farOrigin:[x,z], follow:'focus'|'course', focus:Vector3 })
  //   sample(x, z, cs, tick, out): write out.h (surface height, m), out.m (MAT id), out.o (top of anything solid
  //   standing there that should cast a shadow, or 0), out.s (1 forces the cell into shadow: far ripple stripes).
  //   Heights are floored to the cell (rounded on the two coarse windows = the honest merge), -16..111 m.
  //   Windows: [0] 0.5 m around the eye, [1] 2 m, [2] 8 m fixed at farOrigin. 'course' = windows lead the eye
  //   along +Z (the journey); 'focus' = the 2 m window sits on `focus` (a far, orbiting viewer).
  //   returns { group, wins, heightAt(x,z), ceilingAt(x,z), inShadow(x,y,z), refresh() }
  const GROUND_VS = /* glsl */`
    uniform sampler2D uH; uniform vec4 uWin, uHole; uniform vec3 uEye; uniform vec2 uLS; flat varying vec3 vCol;
    bool inHole(vec2 c){ return c.x > uHole.x && c.x < uHole.z && c.y > uHole.y && c.y < uHole.w; }
    void main(){
      int W = int(uWin.w + .5), L = int(uLS.x + .5); int cj = gl_InstanceID / W; int ci = gl_InstanceID - cj * W;
      ivec2 t = ivec2(ci + 1, cj + 1); vec4 d = texelFetch(uH, t, 0);
      float cs = uWin.z, h = d.r * 127.5 - 16.;
      vec2 c0 = uWin.xy + vec2(float(ci), float(cj)) * cs, cc = c0 + .5 * cs;
      int slot = int(position.z + .5), face = 0; vec3 p; bool skirt = false;
      if (slot == 0) p = vec3(c0.x + position.x * cs, h, c0.y + position.y * cs);
      else {
        bool zs = slot == 1; bool neg = zs ? uEye.z < cc.y : uEye.x < cc.x;
        ivec2 st = zs ? ivec2(0, neg ? -1 : 1) : ivec2(neg ? -1 : 1, 0);
        float hn = texelFetch(uH, t + st, 0).r * 127.5 - 16.;
        bool edge = zs ? (cj + st.y < 0 || cj + st.y >= L) : (ci + st.x < 0 || ci + st.x >= W);
        if (edge || inHole(cc + vec2(st) * cs)) { hn -= uLS.y; skirt = true; }
        float y = mix(min(hn, h), h, position.y);
        p = zs ? vec3(c0.x + position.x * cs, y, c0.y + (neg ? 0. : cs)) : vec3(c0.x + (neg ? 0. : cs), y, c0.y + position.x * cs);
        face = (zs ? neg : !neg) ? 1 : 2;
      }
      int mat = int(d.g * 255. + .5);
      if (mat < 2 && wdHash(ivec2(floor(cc / cs + .01))) < .025) mat = 1 - mat;
      vCol = wdTone(mat, face, d.b > .5 && !(skirt && h < .75 && mat < 2));   // the skirt hung under a window's edge on the plain is never a ripple's violet: a camera standing under the sand (the eye of the world before) sees pale gold there, not a bruise
      gl_Position = inHole(cc) ? vec4(2., 2., 2., 1.) : projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.);
    }`;
  style.makeGround = (o) => {
    const C = o.cells || [[48, 64], [88, 120], [56, 80]], sample = o.sample, out = { h: 0, m: 0, o: 0, s: 0, f: 0 };
    const group = new THREE.Group();
    const mkWin = (cs, skirt, W, L) => {
      const TWd = W + 2, TLd = L + 2;
      const data = new Uint8Array(TWd * TLd * 4);
      const tex = new THREE.DataTexture(data, TWd, TLd, THREE.RGBAFormat, THREE.UnsignedByteType);
      tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
      const geo = faceGeo(3); geo.instanceCount = W * L;
      const u = { uH: { value: tex }, uWin: { value: new THREE.Vector4(0, 0, cs, W) }, uHole: { value: new THREE.Vector4() }, uLS: { value: new THREE.Vector2(L, skirt) } };
      const mesh = mkMesh(geo, mkMat(GROUND_VS, u)); group.add(mesh);
      return { cs, W, L, TWd, TLd, ox: 1e9, oz: 1e9, data, tex, mesh, u, H: new Float32Array(TWd * TLd), O: new Float32Array(TWd * TLd), S: new Float32Array(TWd * TLd), tick: -1 };
    };
    const wins = [mkWin(0.5, 2, C[0][0], C[0][1]), mkWin(2, 8, C[1][0], C[1][1]), mkWin(8, 8, C[2][0], C[2][1])], far = wins[2];
    const ceilingAt = (x, z) => {
      const i = Math.floor(x / 8) - far.ox + 1, j = Math.floor(z / 8) - far.oz + 1;
      return (i < 0 || j < 0 || i >= far.TWd || j >= far.TLd) ? -1e9 : far.S[j * far.TWd + i];
    };
    // fill one window: heights, materials, then the shadow sweep along the 3:1 sun line, from the sun side (+X) to -X.
    // (fillRows + fillSweep are the two halves of one fill; build() runs them in bands with a pause between (fillBands), so no step of the build holds the page)
    const fillRows = (w, tick, j0, j1) => {
      const cs = w.cs, { H, O, data, TWd } = w, fine = cs < 1;
      for (let j = j0; j < j1; j++) {
        const z = (w.oz + j - 0.5) * cs;
        for (let i = 0; i < TWd; i++) {
          const k = j * TWd + i; out.o = 0; out.s = 0; out.f = 0;
          sample((w.ox + i - 0.5) * cs, z, cs, tick, out);
          const h = (fine ? Math.floor(out.h / cs + 1e-4) : Math.round(out.h / cs)) * cs;
          H[k] = h; O[k] = out.o > 0 ? Math.max(h, out.o) : h;      // a sunk cell (pool, channel) casts nothing
          data[k * 4] = Math.max(0, Math.min(255, Math.round(h * 2) + 32)); data[k * 4 + 1] = out.m; data[k * 4 + 2] = out.s ? 255 : 0; data[k * 4 + 3] = out.f ? 255 : 0;
        }
      }
    };
    const fillSweep = (w, i1, i0) => {
      const cs = w.cs, { H, O, S, data, TWd, TLd } = w, fine = cs < 1, seedBias = fine ? 1.5 : 2.5, drop = cs / SUN_X;
      for (let i = i1; i >= i0; i--) {               // from the sun side (+X) across to -X
        const stepZ = (((w.ox + i) % SUN_X) + SUN_X) % SUN_X === 0 ? 1 : 0;
        for (let j = 0; j < TLd; j++) {
          const k = j * TWd + i, js = j - stepZ; let s;
          if (i === TWd - 1 || js < 0) s = w === far ? -1e9 : ceilingAt((w.ox + i - 0.5) * cs, (w.oz + j - 0.5) * cs) - seedBias;
          else { const q = js * TWd + i + 1; s = Math.max(O[q], S[q]) - drop; }
          S[k] = s; if (s > H[k] - 0.1 * cs) data[k * 4 + 2] = 255;
        }
      }
    };
    const fill = (w, tick) => { fillRows(w, tick, 0, w.TLd); fillSweep(w, w.TWd - 1, 0); w.tex.needsUpdate = true; w.tick = tick; };
    const fillBands = async (w, tick, pause) => {
      for (let j = 0; j < w.TLd; j += 16) { fillRows(w, tick, j, Math.min(w.TLd, j + 16)); await pause(); }
      for (let i = w.TWd - 1; i >= 0; i -= 48) { fillSweep(w, i, Math.max(0, i - 47)); await pause(); }
      w.tex.needsUpdate = true; w.tick = tick;
    };
    const place = (w, cx, cz) => {            // snap the window (multiples of 4 cells) around a centre; true if moved
      const ox = Math.round((cx / w.cs - w.W / 2) / 4) * 4, oz = Math.round((cz / w.cs - w.L / 2) / 4) * 4;
      if (ox === w.ox && oz === w.oz) return false;
      w.ox = ox; w.oz = oz; w.u.uWin.value.set(ox * w.cs, oz * w.cs, w.cs, w.W); return true;
    };
    const _r4 = new THREE.Vector4();
    const rect = (w, v) => v.set(w.ox * w.cs, w.oz * w.cs, (w.ox + w.W) * w.cs, (w.oz + w.L) * w.cs);
    const g = { group, wins, ceilingAt, follow: o.follow || 'focus', focus: o.focus || new THREE.Vector3(),
      heightAt(x, z) { out.o = 0; out.f = 0; sample(x, z, 0.5, style.tick, out); return Math.floor(out.h * 2 + 1e-4) / 2; },
      inShadow(x, y, z) { return ceilingAt(x, z) > y + 0.5; },
      refresh() { for (const w of wins) w.tick = -1; } };
    far.ox = Math.round((o.farOrigin ? o.farOrigin[0] : -far.W * 4) / 8); far.oz = Math.round((o.farOrigin ? o.farOrigin[1] : -far.L * 4) / 8);
    far.u.uWin.value.set(far.ox * 8, far.oz * 8, 8, far.W);
    g.step = (tick, eye, fwd) => {            // called by style.update; eye, fwd in root space
      const [near, mid] = wins, course = g.follow === 'course';
      const fr = rect(far, _r4);
      const inside = eye.x > fr.x && eye.x < fr.z && eye.z > fr.y && eye.z < fr.w, above = eye.y - g.heightAt(eye.x, eye.z);
      const nearOn = course || (inside && above < 25);
      const lead = mid.L - 40;
      const mv1 = course ? place(mid, eye.x, eye.z + mid.L - 32) : (inside && above < 110) ? place(mid, eye.x + fwd.x * lead, eye.z + fwd.z * lead) : place(mid, g.focus.x, g.focus.z);
      const mv0 = course ? place(near, eye.x, eye.z + near.L * 0.25 - 8) : place(near, eye.x + fwd.x * near.L * 0.18, eye.z + fwd.z * near.L * 0.18);
      near.mesh.visible = nearOn; if (near.loose) near.loose.visible = nearOn; if (near.slide) near.slide.visible = nearOn;
      rect(mid, far.u.uHole.value);
      if (nearOn) rect(near, mid.u.uHole.value); else mid.u.uHole.value.set(0, 0, 0, 0);
      const t16 = Math.floor(tick / 16) * 16;
      if (far.tick !== t16) fill(far, t16);
      const needNear = nearOn && (mv0 || near.tick !== tick);
      if (needNear) fill(near, tick);
      if (mv1 || (mid.tick !== tick && !(needNear && mid.tick === tick - 1))) fill(mid, tick);   // a tick's two refills fall on two frames
    };
    g.fill = fill; g.fillBands = fillBands; g.place = place;
    hooks.push((tick, eye, fwd) => g.step(tick, eye, fwd));
    return g;
  };

  // ---- loose sand: cubes that ride one ground window. Each sits on a sand cell, hops one cell downwind (+Z) per
  // hop period (arc, then rest), climbs one cube where the tread rises, and tumbles a quarter turn where it drops.
  // makeLoose({ win, count, rng, rank, minH }) -> Mesh. Speed is 3 m/s on every window (period = cell / 0.5 ticks).
  // The cubes stand in ranks (rows across the wind every `rank` cells) so the sand is seen to march, not to swarm.
  const CUBE_CORNER = /* glsl */`
    vec3 wdCorner(int slot, vec3 pos, vec3 eye, vec3 c, out int face){
      if (slot == 0) { face = 0; return vec3(pos.x - .5, .5, pos.y - .5); }
      if (slot == 3) { face = 2; return vec3(pos.x - .5, -.5, pos.y - .5); }
      if (slot == 1) { bool s = eye.z < c.z; face = s ? 1 : 2; return vec3(pos.x - .5, pos.y - .5, s ? -.5 : .5); }
      if (slot == 4) { bool s = eye.z < c.z; face = s ? 2 : 1; return vec3(pos.x - .5, pos.y - .5, s ? .5 : -.5); }   // the far Z face: shows only mid-turn
      if (slot == 5) { bool s = eye.x < c.x; face = s ? 1 : 2; return vec3(s ? .5 : -.5, pos.y - .5, pos.x - .5); }   // the far X face
      bool s = eye.x < c.x; face = s ? 2 : 1; return vec3(s ? -.5 : .5, pos.y - .5, pos.x - .5);
    }`;
  // Nothing is ever drawn rotated: a tumble is one cell down and forward at once, landing square. Each cube also
  // repaints the tread to starboard of it in the sand's violet twin, three cells long (the 3:1 sun), as far as the
  // tread runs level: slot 3 of the batch. An avalanche batch (avalanche: true) shows only on the slip face (the
  // ground's alpha flag), in two wings either side of the eye's line whose front runs ahead of the prow; ordinary
  // batches thin out on the slip face and leave the lane ahead of the stem still. style.uniforms.uAvW = (wing width m, V slope).
  const LOOSE_VS = CUBE_CORNER + /* glsl */`
    attribute vec4 aSeed; uniform sampler2D uH; uniform vec4 uWin, uHole; uniform vec2 uLS, uHop, uAv, uAvW; uniform vec4 uClear, uAvP; uniform float uMinH; uniform vec3 uEye; uniform float uTick;
    flat varying vec3 vCol;
    float wdH(ivec2 t){ return texelFetch(uH, t, 0).r * 127.5 - 16.; }
    void main(){
      float cs = uWin.z, tt = uTick / uHop.x + aSeed.z * 9., n = floor(tt), s = clamp(fract(tt) / uHop.y, 0., 1.);
      bool av1 = uAv.x > .5 && cs < 1.;                                 // the near avalanche: whole one-metre cubes on their own one-metre lattice, so no two run together
      vec2 org = floor(uWin.xy / cs + .5), lc = mod(vec2(av1 ? floor(aSeed.x * .25) * 4. : aSeed.x, aSeed.y + n) - org, vec2(uWin.w, uLS.x));
      ivec2 t = ivec2(lc + .5) + 1;
      vec4 d0 = texelFetch(uH, t, 0), d1 = texelFetch(uH, t + ivec2(0, 1), 0);
      float h0 = d0.r * 127.5 - 16., h1 = d1.r * 127.5 - 16.;
      if (h1 > h0 + 2.5 * cs) s = 0.;                                   // a wall ahead: wait
      bool fall = h1 < h0 - .01;
      vec3 c = vec3((org.x + lc.x + .5) * cs, mix(h0, h1, s) + .5 * cs, (org.y + lc.y + .5 + s) * cs);
      if (!fall) c.y += 4. * s * (1. - s) * (cs < 1. ? 1.1 : .8) * cs;                     // the hop arc (a whole cube clear of the tread on the half-metre window)
      int m0 = int(d0.g * 255. + .5), m1 = int(d1.g * 255. + .5), slot = int(position.z + .5);
      bool hide = (m0 > 1 && m0 != 13 && m0 != 17 && m0 != 19 && m0 != 22) || (m1 > 1 && m1 != 13 && m1 != 17 && m1 != 19 && m1 != 22) || h0 < uMinH || (c.x > uHole.x && c.x < uHole.z && c.z > uHole.y && c.z < uHole.w);
      if (uAv.x < .5 && c.x > uClear.x && c.x < uClear.z && c.z > uClear.y && c.z < uClear.w) hide = true;   // a still patch the world keeps clear of ranks (where the pacer stands)
      // (fix 8) The avalanche is the yacht's wake: a V on the slip face with its point at the yacht (uAvP.xy, set by the world), opening up
      // the slope behind it at uAvW.y metres of half-width a metre, with a still lane uAvP.z either side of the course it came down.
      float adx = abs(c.x - uAvP.x), dzA = uAvP.y - c.z;
      bool slip = d0.a > .5, wing = uAvW.x > .5 && dzA > 1. && adx > uAvP.z && adx < uAvP.z + uAvW.y * dzA;
      if (uAv.x > .5) { if (!slip || !wing || fract(aSeed.w * 7.13) > .9) hide = true; }
      else if (slip && (uEye.y > h0 + 3. || aSeed.w < .5)) hide = true;   // seen from above a cube on these stairs is a sliver behind the riser: shown only from below
      bool sh = (s > .5 ? d1.b : d0.b) > .5;
      vec3 p;
      if (slot == 3) {                                                  // the shadow bar on the tread, to starboard (-X)
        bool nx = s > .5; ivec2 tb = t + ivec2(0, nx ? 1 : 0); float hb = nx ? h1 : h0, len = 0.;
        if (abs(wdH(ivec2(max(tb.x - 1, 0), tb.y)) - hb) < .01) { len = 1.;
          if (abs(wdH(ivec2(max(tb.x - 2, 0), tb.y)) - hb) < .01) { len = 2.;
            if (abs(wdH(ivec2(max(tb.x - 3, 0), tb.y)) - hb) < .01) len = 3.; } }
        if (sh || len < .5 || float(tb.x) - len < .5) hide = true;
        float bg = av1 ? 3. : 1.;                                       // under a loosened block the bar is as broad as the block and starts at its starboard face
        p = vec3((org.x + lc.x + .5 - .5 * bg - position.x * len * bg) * cs, hb + .04 * cs, (org.y + lc.y + .5 - .5 * bg + (nx ? 1. : 0.) + position.y * bg) * cs);
        vCol = wdTone(0, 0, true);
      } else {
        float big = av1 ? 3. : 1.; c.y += .5 * cs * (big - 1.);     // loosened sand comes down in whole blocks a metre and a half through
        int face; vec3 q = wdCorner(slot, position, uEye, c, face); p = c + q * cs * big;
        vCol = wdTone(uAv.x > .5 ? 18 : (aSeed.w < uAv.y ? 9 : 8), face, sh);   // (fix 6) every loose cube is a tone apart from the stairs: deep ochre or crest dust, never its own tread's ink
      }
      gl_Position = hide ? vec4(2., 2., 2., 1.) : projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.);
    }`;
  uniforms.uAvW = { value: new THREE.Vector2(0, 1) }; uniforms.uAvP = { value: new THREE.Vector4(0, -1e4, 2.5, 0) }; uniforms.uClear = { value: new THREE.Vector4(0, 0, 0, 0) };
  style.makeLoose = ({ win, count, rng, move, minH, rank = 4, avalanche = false }) => {
    const geo = faceGeo(avalanche ? 4 : 3), W = win.u.uWin.value.w, L = win.u.uLS.value.x;   // (fix 8: an ordinary rank has no bar of its own: on a climbing stair a bar on the tread is seen edge on, a sliver. The rank's stripe is laid in the ground, a whole row of cells)
    if (!avalanche) {                               // (fix 8) a rank is an unbroken line: a cube on every second cell from one side of the window to the other, alternate ranks staggered a cell; rows every `rank` cells. On the half-metre window alternate ranks hop half a tick apart, so one of every two is in the air.
      const rows = Math.floor(L / rank), cols = Math.floor(W / 2), slots = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) slots.push(r * cols + c);
      if (count < slots.length) for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)), t = slots[i]; slots[i] = slots[j]; slots[j] = t; }
      count = Math.min(count, slots.length);
      var a = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) { const row = Math.floor(slots[i] / cols), x = (slots[i] % cols) * 2 + (row % 2);
        a[i * 4] = x; a[i * 4 + 1] = row * rank; a[i * 4 + 2] = win.cs < 1 ? ((row % 2) ? 0.8 : 0.3) / 9 : (((row * 0.618) % 1) * 0.9 + 0.03) / 9; a[i * 4 + 3] = rng(); }
    } else {
    // (fix 8) loosened sand stands in full rows along the terraces: on the half-metre window a 1.5 m block on every place of its 2 m
    // lattice, on the 2 m window a block on every second cell (alternate rows staggered), rows every `rank` cells; a tenth stand empty
    const near = win.cs < 1, step = near ? 4 : 2, rows = Math.floor(L / rank), cols = Math.floor(W / step), slots = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) slots.push(r * cols + c);
    if (count < slots.length) for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)), t = slots[i]; slots[i] = slots[j]; slots[j] = t; }
    count = Math.min(count, slots.length);
    var a = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) { const row = Math.floor(slots[i] / cols), x = (slots[i] % cols) * step + (near ? 0 : row % 2);
      a[i * 4] = x; a[i * 4 + 1] = row * rank; a[i * 4 + 2] = (((row * 0.618) % 1) * 0.9 + 0.03) / 9; a[i * 4 + 3] = rng(); }   // (a row's phase is under one hop: the rows keep their spacing)
    }
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(a, 4)); geo.instanceCount = count;
    const per = (avalanche && win.cs > 1) ? 2 : win.cs / 0.5;      // (loosened blocks on the 2 m window come down a course every third of a second)
    return mkMesh(geo, mkMat(LOOSE_VS, { ...win.u, uHop: { value: new THREE.Vector2(per, move ?? 0.6 / Math.sqrt(per)) }, uMinH: { value: minH ?? -99 },
      uAv: { value: new THREE.Vector2(avalanche ? 1 : 0, avalanche ? 2 : 0.72) } }));   // loosened sand is all crest dust: its top never matches the tread it stands on
  };

  // ---- thrown cubes: cell-stepped ballistic flight (the crest banner, the sheets leaving the dome, skid plumes,
  // chimney cubes). makeThrown(capacity, { clock, dome }) -> { mesh, add(), commit(), clock }.
  //   add(x,y,z, size, mat, vx,vy,vz, start, life, loop, grav, shadow): (x,y,z) min corner at rest; v in cells per
  //   tick; before `start` the cube rests in place (a mantle), after start+life it is gone; loop=1 repeats forever, loop=2 hides it until start,
  //   loop=3 repeats forever and never turns (blocks carried on the wind square to the grid: the crest banner).
  //   No cube is ever drawn rotated (a quarter turn of a flat cube is the same cube): four faces each, top, underside and the two sides toward the eye.
  //   clock: a { value } in ticks (default the sand tick; pass your own to key a release to camera progress).
  //   dome: Vector4(cx, cz, R, yDrumTop) + domeH: cubes ride down a stepped dome instead of passing through it.
  const THROWN_VS = CUBE_CORNER + /* glsl */`
    attribute vec4 aP0, aV, aT; attribute vec2 aMat; uniform vec3 uEye; uniform float uClock, uStop; uniform vec4 uDome; uniform vec3 uDome2;
    flat varying vec3 vCol;
    void main(){
      float cs = aP0.w, n = uClock - aT.x;
      bool loops = (aT.z > .5 && aT.z < 1.5) || aT.z > 2.5, rk = aT.z > 3.5;   // loop 4: a rank crossing a level floor: a hop and a rest each tick, and its bar
      if (loops) n = mod(uClock + aT.x, max(aT.y, 1.));
      bool rest = n < 0., gone = n > aT.y || (rest && aT.z > 1.5) || (loops && uClock - n > uStop);
      float ni = floor(max(n, 0.)), f = clamp(fract(max(n, 0.)) / .6, 0., 1.), e = rest ? 0. : ni + f;
      float eh = uDome.z > 0. ? min(e, aT.w + 3.) : e;   // off a dome's cornice a cube goes three ticks out, then straight down: a curtain
      vec3 c = aP0.xyz + .5 * cs + vec3(aV.x * eh, aV.y * e - .5 * aV.w * e * e, aV.z * eh) * cs;
      if (rk) c.y += 4. * f * (1. - f) * .8 * cs;
      if (uDome.z > 0.) {                       // ride the stepped dome to its edge (aT.w = ticks to the edge), then fall
        float r = length(c.xz - uDome.xy) / uDome.z;
        if (rest || e <= aT.w) {                // on the sand still lying on the courses below: the mantle stands a cube proud and fills each step's corner
          float ri = max(r * uDome.z - 1.5, 0.) / uDome.z;
          float own = ceil(uDome2.x * pow(max(1. - r * r, 1e-5), uDome2.z));
          if (e > 1.) own = max(own + 1., ceil(uDome2.x * pow(max(1. - ri * ri, 1e-5), uDome2.z)));
          c.y = uDome.w + own + .5 * cs; }
        else { float k = e - aT.w; c.y = uDome.w + .5 * cs - .5 * aV.w * k * k * cs; if (c.y < uDome2.y) gone = true; }
      }
      int slot = int(position.z + .5), face; vec3 q = wdCorner(slot, position, uEye, c, face), p = c + q * cs;
      vCol = wdTone(int(aMat.x + .5), face, aMat.y > .5);
      if (rk && slot == 3) {                    // the bar: the three cells to starboard (-X) of where it stands or lands, repainted in the sand's twin
        if (aMat.y > .5) gone = true;
        vec2 b = aP0.xz + vec2(aV.x, aV.z) * (ni + (f > .5 ? 1. : 0.)) * cs;
        p = vec3(b.x - position.x * 3. * cs, aP0.y + .03, b.y + position.y * cs); vCol = wdTone(0, 0, true);
      }
      gl_Position = gone ? vec4(2., 2., 2., 1.) : projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.);
    }`;
  style.makeThrown = (capacity, o = {}) => {
    const geo = faceGeo(4), mk = (n) => new THREE.InstancedBufferAttribute(new Float32Array(capacity * n), n);
    const aP0 = mk(4), aV = mk(4), aT = mk(4), aMat = mk(2);
    geo.setAttribute('aP0', aP0); geo.setAttribute('aV', aV); geo.setAttribute('aT', aT); geo.setAttribute('aMat', aMat); geo.instanceCount = 0;
    const clock = o.clock || uniforms.uTick, stop = { value: 1e9 };
    const mesh = mkMesh(geo, mkMat(THROWN_VS, { uClock: clock, uStop: stop, uDome: { value: o.dome || new THREE.Vector4() }, uDome2: { value: new THREE.Vector3(o.domeH || 0, o.floorY || 0, o.domeCut || 0.5) }, ...(o.eye ? { uEye: o.eye } : {}) }));
    const t = { mesh, clock, stop, count: 0,
      add(x, y, z, size, mat, vx, vy, vz, start = 0, life = 20, loop = 0, grav = 0.25, shadow = 0, edge = 0) {
        const i = t.count; if (i >= capacity) return -1;
        aP0.setXYZW(i, x, y, z, size); aV.setXYZW(i, vx, vy, vz, grav); aT.setXYZW(i, start, life, loop, edge); aMat.setXY(i, mat, shadow ? 1 : 0);
        t.count = i + 1; return i; },
      commit() { geo.instanceCount = t.count; aP0.needsUpdate = aV.needsUpdate = aT.needsUpdate = aMat.needsUpdate = true; } };
    return t;
  };

  // ---- a date palm in cubes: a trunk two cubes thick (1 m) and a crown of six stepped fronds whose tips nod one cube.
  // addPalm(batch, x, y, z, h = 8, phase = 0, shadow = 0): 26 boxes into a makeCubes batch; (x,y,z) = foot, min corner.
  style.addPalm = (b, x, y, z, h = 8, phase = 0, shadow = 0, merge = false) => {
    const L = merge ? 1 : 0;
    b.add(x, y, z, 1, h, 1, MAT.TRUNK, shadow, null, L); b.add(x, y + h, z, 1, 1, 1, MAT.PALM, shadow, null, L);
    [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]].forEach(([dx, dz], f) => {
      const nod = [0, -1, 0, 10 + (f % 3) * 4, (phase + f * 0.17) % 1];
      b.add(x + dx, y + h, z + dz, 1, 1, 1, MAT.PALM, shadow, null, L); b.add(x + 2 * dx, y + h, z + 2 * dz, 1, 1, 1, MAT.PALM, shadow, null, L);
      b.add(x + 3 * dx, y + h - 1, z + 3 * dz, 1, 1, 1, MAT.PALM, shadow, nod, L); b.add(x + 4 * dx, y + h - 2, z + 4 * dz, 1, 1, 1, MAT.PALM, shadow, nod, L);
    });
    if (merge) { b.add(x - 0.5, y, z - 0.5, 2, h - 1, 2, MAT.TRUNK, shadow, null, 2); b.add(x - 2.5, y + h - 1, z - 2.5, 6, 2, 6, MAT.PALM, shadow, null, 2); }
  };


  // ---- the sky: three ruled bands (sky blue above 22 deg, pale blue 6-22, whitewash to the horizon and below)
  // and the sun, a whitewash square inside a pale ochre square, 17.5 deg up on the (+3,-1) line. One far-plane box.
  style.makeSky = () => {
    const sd = new THREE.Vector3(SUN_X, 0, -1).normalize().multiplyScalar(Math.cos(17.5 * Math.PI / 180)); sd.y = Math.sin(17.5 * Math.PI / 180);
    const m = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.ShaderMaterial({
      uniforms: { ...uniforms, uSun: { value: sd } }, side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
      vertexShader: /* glsl */`varying vec3 vDir; varying vec2 vFh; void main(){ vDir = position;
        vec2 fh = -vec2(viewMatrix[0][2], viewMatrix[2][2]); float fl = length(fh); vFh = fl > 1e-3 ? fh / fl : vec2(0., 1.); vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.);
        if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: GLSL_COMMON + /* glsl */`varying vec3 vDir; varying vec2 vFh; uniform vec3 uSun;
        void main(){ vec3 d = vDir / max(length(vDir), 1e-4); float tanEl = d.y / max(dot(d.xz, vFh), 1e-4);
          // (fix 6) three ruled bands and no more: sky blue above 22 degrees, pale blue from 6 to 22, the whitewash band along the horizon (fourteen inks on screen, not sixteen)
          vec3 col = tanEl < 0. ? wdTone(12, 0, true) : tanEl > .4040 ? wdTone(12, 0, false) : tanEl > .1051 ? wdTone(12, 1, false) : wdTone(12, 2, false);
          vec3 rt = vec3(-uSun.z, 0., uSun.x) / max(length(uSun.xz), 1e-4), up = cross(rt, uSun); float k = dot(d, uSun);
          if (k > .5) { float m = max(abs(dot(d, rt)), abs(dot(d, up))) / k; if (m < .034) col = wdTone(2, 0, false); else if (m < .066) col = wdTone(8, 0, false); }
          gl_FragColor = vec4(col, 1.); }` }));
    m.renderOrder = -0.5; m.frustumCulled = false;
    return m;
  };

  const _eye = new THREE.Vector3(), _fwd = new THREE.Vector3();
  style.update = (dt, time, camera) => {
    style.time = time; const tick = time * TICK_HZ; style.tick = Math.floor(tick); uniforms.uTick.value = tick;
    camera.getWorldPosition(_eye); camera.getWorldDirection(_fwd);
    if (style.root) { style.root.updateWorldMatrix(true, false); style.root.worldToLocal(_eye); }
    uniforms.uEye.value.copy(_eye);
    _fwd.y = 0; if (_fwd.lengthSq() < 1e-6) _fwd.set(0, 0, 1); _fwd.normalize();
    for (const h of hooks) h(style.tick, _eye, _fwd);
  };
  style.eye = _eye;
  return style;
}

// ---------------------------------------------------------------- the hero: the dune and what it gives back
const BRIEF_PALETTE = ['#E7BC72', '#A86C3A', '#1FB8B0', '#1E3F9A', '#F4EEDC', '#7E62A8', '#6FA9D8'];
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, n2 = ctx.noise.n2;
  const detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const style = opts.style || makeStyle(ctx, { palette: opts.palette || BRIEF_PALETTE, exposure: opts.exposure });
  const root = new THREE.Group(); root.name = 'walking-dune'; if (!style.root) style.root = root;

  // per-seed character: crest height, how far the crest bows, unequal horns, a scalloped knife edge, the wind, the dome's cut
  const H0 = rng.range(74, 82), HX = 130, HZ = 210, bow = rng.range(2.3, 2.8);
  const aL = rng.range(0.9, 1.06), aR = rng.range(0.9, 1.06), scal = rng.range(0.02, 0.06), scalPh = rng.range(0, 6.28), scalK = rng.range(0.03, 0.06);
  const gust = rng.range(0.8, 1.3), domeCut = rng.range(0.42, 0.58), nOff = rng.range(0, 100);
  const SLIP = 2 / 3, WALL_Z = 290;
  // The crest stands back from the origin so the slip foot stays at z 93 whatever the height; the windward back is a
  // concave sweep (a wave about to break): BACK_L metres of run per metre of crest, steepening as (1-s)^BACK_P to the knife edge.
  const ZC = 93 - H0 / SLIP, BACK_L = 2.7, BACK_P = 1.45, TAN_W = 1 / BACK_L;
  const dome = { x: 24, z: 136, R: 15, drum: 10, H: 16 }, pool = { x: 0, z: 252 }, chanX = 4.5;
  // what the dune has given back so far (driven by setProgress, or looping on the clock when nobody drives it)
  const P = { shed: 0, bare: 0.25, pool: 0, chan: 0, driven: false, cl: null, ez: 0, eh: 1e3, ex: 0, rf: null, sweep: null, ranks: opts.ranks !== false };   // (ez, eh: the eye's z and height over the floor, set by the world for the paving's merge)
  const solidAt = opts.solidAt || null, maskAt = opts.maskAt || null;
  const DOME_CAST = opts.domeCast || 1e9;

  const domeTop = (x, z) => {                       // top of the stepped dome over (x,z), 0 outside the drum
    const dx = x - dome.x, dz = z - dome.z, r2 = (dx * dx + dz * dz) / (dome.R * dome.R);
    return r2 < 1 ? dome.drum + Math.ceil(dome.H * Math.pow(1 - r2, domeCut)) : 0;
  };
  const crest = (x, o) => {                         // crest line: o.z = where it lies, o.h = how tall it stands
    const ax = Math.abs(x), a = ax / HX;
    // a broad crown; the starboard shoulder (x < 0) stays tall, the port horn (toward the sun) falls away sooner so the city keeps its sun
    // (the port shoulder keeps the crown's breadth as far as a third of the way out, so from the plain the mountain is broad on both sides; beyond, it falls away as before)
    const wp = Math.pow(Math.max(1 - a * a, 0), 1.5), ks = Math.min(1, Math.max(0, (a - 0.3) / 0.32)), w = x < 0 ? 1 - a * a * a : wp + (1 - a * a * a - wp) * (1 - ks * ks * (3 - 2 * ks));
    o.h = a < 1 ? (5 + (H0 - 5) * w) * (1 + scal * Math.sin(x * scalK + scalPh) * (1 - a)) : 5 * (1 - (ax - HX) / 25);
    o.z = ZC + (HZ * (x < 0 ? aL : aR) - ZC) * Math.pow(a, bow); return o;
  };
  const _c = { h: 0, z: 0 }, _q = { h: 0, z: 0 }, _ca = { h: 0, z: 0 };
  // crest() reads x alone, and a fill of a window asks it again for every row of every column: the last answer is kept
  // per column (256 columns for each of the three cell sizes; the key is x itself, so a kept answer is the very one
  // crest would give) and _c is written on every call as before.
  const CREST_K = new Float64Array(768).fill(NaN), CREST_H = new Float64Array(768), CREST_Z = new Float64Array(768);
  const crestCol = (x, cs) => {
    const k = (cs < 1 ? 0 : cs < 4 ? 256 : 512) + (Math.floor(x / cs) & 255);
    if (CREST_K[k] === x) { _c.h = CREST_H[k]; _c.z = CREST_Z[k]; return; }
    crest(x, _c); CREST_K[k] = x; CREST_H[k] = _c.h; CREST_Z[k] = _c.z;
  };
  // Three more answers that sample() works out for every cell of every refill read nothing that changes while the world
  // runs. Each is kept under the very numbers it was worked out from and given back only when those numbers are the
  // same again, so a kept answer is the one the sum would give; anything else is worked out as before.
  //   ST_: how high the dune stands in a cell before the treads' noise, and whether the cell is slip face or horn
  //        terrace: these read x, z and whether the cell size is over 4 (256 x 256 cells for each of the three sizes);
  //   TN_: the treads' noise, which reads its two arguments alone (the same pair comes back a row on: a tick later
  //        in the 0.5 m window, four ticks later in the 2 m one);
  //   RN_: the noise of the hollow floor's sand line, which reads z alone (256 rows for each cell size).
  // (12.8 million bytes of tables in all, made here once for each build and let go with the world)
  const ST_X = new Float64Array(196608).fill(NaN), ST_Z = new Float64Array(196608), ST_H = new Float64Array(196608), ST_F = new Uint8Array(196608);
  const TN_A = new Float64Array(327680).fill(NaN), TN_B = new Float64Array(327680), TN_V = new Float64Array(327680);
  const RN_K = new Float64Array(768).fill(NaN), RN_V = new Float64Array(768);
  // The slip face is laid in strips sixteen metres wide: within a strip its stairs run dead
  // straight across, and where the crescent curls the strips stand apart as walls, so the hollow is a stepped
  // amphitheatre of whole terraces and never a diagonal of saw teeth.
  const STRIP = 16, XT = 16, qH = new Float32Array(128).fill(NaN), qZ = new Float32Array(128);
  const crestQ = (x) => {
    const i = Math.floor(x / STRIP) + 64; if (i < 0 || i > 127) return crest(x, _q);
    if (qH[i] !== qH[i]) { crest((i - 64 + 0.5) * STRIP, _q); qH[i] = _q.h; qZ[i] = _q.z; }
    _q.h = qH[i]; _q.z = qZ[i]; return _q;
  };
  await ctx.yield();
  // the lee face of the horns, once: for every 2 m cell, the highest cone of repose standing on the knife edge
  const AX0 = -(HX + 30), AZ0 = ZC - 26, AW = Math.ceil((HX + 30)), AL = Math.ceil((250 - AZ0) / 2), amph = new Float32Array(AW * AL);
  { const nk = Math.ceil((2 * HX + 50) / 2), kx = new Float32Array(nk), kz = new Float32Array(nk), kh = new Float32Array(nk);
    for (let k = 0; k < nk; k++) { kx[k] = -HX - 25 + k * 2 + 1; crest(kx[k], _c); kz[k] = _c.z; kh[k] = _c.h; }
    for (let j = 0; j < AL; j++) {
      const z = AZ0 + j * 2 + 1;
      for (let i = 0; i < AW; i++) {
        const x = AX0 + i * 2 + 1; if (Math.abs(x) < XT - 2) continue;
        let best = 0; const k0 = Math.max(0, i - 62), k1 = Math.min(nk, i + 62);          // (a cone 120 m off is under the floor already)
        for (let k = k0; k < k1; k++) { const dx = x - kx[k], dz = z - kz[k], v = kh[k] - SLIP * Math.sqrt(dx * dx + dz * dz); if (v > best) best = v; }
        amph[j * AW + i] = best;
      }
      if (j < 24 || j % 6 === 5) await ctx.yield();   // (a row at a time at first: the loop runs slowly until the engine has compiled it)
    } }
  const amphAt = (x, z) => { const i = Math.floor((x - AX0) / 2), j = Math.floor((z - AZ0) / 2); return (i < 0 || j < 0 || i >= AW || j >= AL) ? 0 : amph[j * AW + i]; };
  // ---- the pool's face, cell by cell (water cells only). Under the gate the water shows the world back in whole cells:
  // the ray from the eye is mirrored at the cell and followed to the gatehouse face and the palms (P.rf, set by the
  // world). ONE RULE FOR THE WATER'S FACE: the water is turquoise; it shows back the ring alone (lapis rim, pale-blue
  // chequer and opening) and the palms' crowns as lapis shade; no ochre and no green lies in it. Rows slip a cell sideways
  // and every fifth row is left plain, travelling, so the picture is broken as a reflection is. On it: lily pads (lapis, a whitewash
  // flower that bobs a cube), a line of whitewash stepping stones across the middle, square rings widening a cell at
  // a time, and the glint squares.
  const hsh = (a, b) => { let n = (Math.imul(a, 73856093) ^ Math.imul(b, 19349663)) >>> 0; n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0; return (n ^ (n >>> 16)) >>> 0; };
  const RINGS = [[-8, 243, 0], [9.5, 257, 5], [-6, 263, 9], [7, 245.5, 12]];
  const poolFace = (x, z, cs, tick, out) => {
    const yw = out.h, i2 = Math.floor(x / 2), j2 = Math.floor(z / 2);
    if (Math.abs(x) > 9 && Math.abs(z - pool.z - 9) < 1 && (((i2 % 2) + 2) % 2) === 0) { out.h = yw + 0.5; out.m = MAT.WHITE; return; }   // stepping stones, 2 m square, in to either side of the far points (the middle is the gate's picture)
    if (Math.abs(x) > 7 && Math.abs(z - pool.z - 9) > 2 && hsh(i2, j2) % 11 === 0) {                                                   // a lily pad
      if (cs > 1) { out.m = MAT.LAPIS; return; }
      const lx = x - i2 * 2, lz = z - j2 * 2;
      if (lx < 1.5 && lz < 1.5) { out.m = MAT.LAPIS; if (lx >= 0.5 && lx < 1 && lz >= 0.5 && lz < 1) { out.m = MAT.WHITE; out.h = yw + ((Math.floor(tick / 4) + i2 + j2) & 1 ? 0.5 : 0); } return; }
    }
    const ci = Math.floor(x / cs), cj = Math.floor(z / cs), t3 = Math.floor(tick / 3);
    if (cs < 1) for (let q = 0; q < RINGS.length; q++) { const rx = RINGS[q][0], rz = RINGS[q][1], rp = RINGS[q][2];             // square rings, a cell wider every other tick
      const r = (Math.floor(tick / 2) + rp) % 16, dq = Math.max(Math.abs(Math.floor((x - rx) * 2)), Math.abs(Math.floor((z - rz) * 2)));
      if (r > 0 && r < 11 && dq === r) { out.m = MAT.RPALE; return; }
    }
    const rf = P.rf;
    // (fix 7: the picture in the water is laid in whole 2 m cells (1 m for the gate's own column, |x| < 12), a row slipping
    // one such cell; palms show as their crowns only: larger shapes in fewer inks, so the pool reads as a mirror, not a patchwork)
    const qc = cs < 1 ? (Math.abs(x) < 12 ? 1 : 2) : cs, qi = Math.floor(x / qc), qj = Math.floor(z / qc);
    if (rf && !(cs < 1 && (qj + t3) % 7 === 0)) {
      const cx = (qi + 0.5 + (cs < 1 && qc < 2 ? (hsh(qj, t3) % 3) - 1 : 0)) * qc, cz = (qj + 0.5) * qc, dx = cx - P.ex, dz = cz - P.ez, hE = P.eh - yw;
      if (dz > 1 && hE > 0.5) {
        let m = -1, sBest = 1e9;
        for (let k = 0; k < rf.palms.length; k++) {
          const pm = rf.palms[k], sp = (pm[1] - cz) / dz; if (sp <= 0 || sp >= sBest) continue;
          const X = cx + dx * sp - pm[0], Y = yw + hE * sp;
          if (Y < pm[2] + 1.5 && Math.abs(X) < 2.3 && Y > pm[2] - 0.5) { sBest = sp; m = MAT.LAPIS; }   // (the crown's heart only: the water stays turquoise between the crowns)
        }
        if (m < 0) {
          const sg = (rf.z - cz) / dz, X = cx + dx * sg, Y = yw + hE * sg, aX = Math.abs(X);
          if (sg > 0) {
            const r = Math.hypot(X, Y - rf.y);   // the ring alone: its lapis inner rim, its chequer in the water's own ink and pale blue, its opening pale blue; no brick lies in the water
            if (r < rf.r2) m = r < rf.r0 ? MAT.RPALE : r < rf.r1 ? MAT.LAPIS : (((Math.floor(X / 2) + Math.floor(Y / 2)) & 1) ? MAT.RPALE : MAT.WATER);
          }
        }
        if (m >= 0) { out.m = m; return; }
      }
    }
    if (hsh(Math.floor(x) * 7919 + t3, Math.floor(z)) % 37 === 0) out.m = MAT.WHITE;                                                                    // light on the water (whole metres): whitewash squares changing place twice a second
  };
  const sample = (x, z, cs, tick, out) => {
    const ax = Math.abs(x); crestCol(x, cs); const d = z - _c.z;
    let h = 0, slip = d >= 0, horn = 0;
    const sk = (cs < 1 ? 0 : cs > 4 ? 131072 : 65536) + ((Math.floor(z / cs) & 255) << 8) + (Math.floor(x / cs) & 255);
    if (ST_X[sk] === x && ST_Z[sk] === z) { h = ST_H[sk]; slip = (ST_F[sk] & 1) === 1; horn = ST_F[sk] >> 1; }
    else if (ax >= XT && d >= 0) {
      // The lee side, beyond the two strips the course rides down, is the true face of repose (amph: two down for three
      // from the nearest of the knife edge, so it curls round the hollow), laid in whole courses: 4 m, and 8 m on the
      // far window. From the crest the hollow is an amphitheatre of level terraces, never a row of gables.
      horn = cs > 4 ? 8 : 4; h = Math.floor((cs > 4 ? amphAt(x, z) : amphAt(Math.floor(x / 6) * 6 + 3, Math.floor(z / 6) * 6 + 3)) / horn + 1e-4) * horn;   // (fix 6: inside the second merge line the terraces are laid in 6 m square blocks, so where the crescent curls an edge is long straight runs and square corners, not a row of teeth)
    } else if (_c.h > 0) {
      let hb = _c.h; if (d < 0) { const sb = 1 + d / (_c.h * BACK_L); hb = sb > 0 ? _c.h * Math.pow(sb, BACK_P) : 0; }   // the back, flat beyond its knife edge
      h = hb;
      if (ax < XT) { crestQ(x); const hs = _q.h > 0 ? _q.h - (z - _q.z) * SLIP : (d >= 0 ? _c.h - d * SLIP : 1e9); if (hs < hb) { h = hs; slip = true; } }
      else if (ax >= 48 && z > ZC - 24) { horn = cs > 4 ? 8 : 4; h = Math.floor(h / horn + 1e-4) * horn; }   // the horns' windward sides in the same courses
    }
    if (ST_X[sk] !== x || ST_Z[sk] !== z) { ST_X[sk] = x; ST_Z[sk] = z; ST_H[sk] = h; ST_F[sk] = (slip ? 1 : 0) | (horn << 1); }
    if (solidAt && d < 0) { out.o = solidAt(x, z, cs); if (maskAt && cs < 4 && maskAt(x, z)) out.s = 1; }   // what the world stands on the plain and the back throws its long shadow too
    const cl = P.cl;                                // a square cloud's shadow on the back and the plain (the world steps it downwind)
    if (cl && d < 0 && x >= cl[0] && x < cl[1] && z >= cl[2] && z < cl[3]) out.s = 1;
    if (h > 0.25) {                                 // the dune itself: windward back in sand, slip face in the deeper ochre
      if (horn) { out.h = h; out.f = slip ? 1 : 0; out.m = slip ? ((Math.round(h / horn) & 1) ? MAT.COURSE : MAT.LEE) : ((h % 16) >= 8 ? MAT.TROUGH : MAT.SAND); return; }
      if (slip) {                                 // the slip face: flagged for the avalanche; broad courses of the paler ochre every 16 m of height
        // It comes down in terraces four metres high and six deep, the same on every window, so from the crest it is
        // a giant's staircase of flat treads and square walls (a slope of single cubes seen from above is all corners).
        const hq = h >= 4 ? Math.floor(h / 4) * 4 : cs < 1 ? (h >= 1 ? Math.floor(h) : Math.floor(h * 2) / 2) : h;
        // Courses alternate: pale-fronted sand whose shadow twin is the deep violet all over, and the deeper ochre whose twin
        // is the middle violet, so the stairs can be counted from above in the sun and in the crest's shadow alike.
        const Q = cs > 4 ? 8 : 4; out.h = hq; out.f = 1; out.m = hq < 4 ? MAT.SAND : (Math.round(hq / Q) & 1) ? MAT.COURSE : MAT.LEE; return;
      }
      // The back is a staircase laid in strata. Every 16 m of height carries a 6 m course of the darker trough ochre
      // (8 m on the far window), so from the plain the mountain reads as broad pale steps with dark feet; near the eye
      // each metre of rise is one step: a dark half-metre course with a ledge, a pale half-metre riser, then the tread.
      if (cs < 4) {                                // treads re-step as the ranks pass
        const zt = z - tick * 0.5, na = x * 0.021 + nOff, nb = zt * 0.05, nk = cs < 1 ? ((Math.floor(zt * 2) & 255) << 8) + (Math.floor(x / cs) & 255) : 65536 + ((Math.floor(zt * 2) & 1023) << 8) + (Math.floor(x / cs) & 255);
        if (TN_A[nk] !== na || TN_B[nk] !== nb) { TN_V[nk] = n2(na, nb); TN_A[nk] = na; TN_B[nk] = nb; }
        h += 0.35 * TN_V[nk] * Math.min(1, h * 0.5);
      }
      if (cs < 1) {
        const f = Math.floor(h), dark = (h % 16) >= 10;
        if (h - f < 0.3 && f >= 1) { out.h = f - 0.5; out.m = MAT.TROUGH; } else { out.h = f < 1 ? Math.floor(h * 2) / 2 : f; out.m = dark ? MAT.SLIP : MAT.SAND; }
        // (fix 8) every rank of loose cubes stands on its stripe: the whole row of cells where it lands this tick is repainted in the sand's twin
        // (tread and riser alike: the cubes stand a cell apart and each throws three cells of shadow, so the row is all shadow), moving a cell a tick with the rank
        if (P.ranks && out.h >= 0.5 && !(P.clear && x > P.clear[0] && x < P.clear[2] && z > P.clear[1] && z < P.clear[3])) { const q = (((Math.floor(z * 2 + 1e-4) - tick - 1) % 16) + 16) % 16; if (q === 0 || q === 15 || q === 9 || q === 8) out.m = MAT.SHADE; }   // (ranks stand every eight cells; alternate ranks are half a tick ahead, so their row is one cell on. The row the rank lands on and the one it has just left: a stripe a metre deep every four metres)
        return;
      }
      const hr = Math.round(h / cs) * cs;
      out.h = h; out.m = (cs < 4 ? (hr % 16) >= 10 : (hr % 16) === 8) ? MAT.TROUGH : MAT.SAND; return;
    }
    out.h = 0; out.m = MAT.SAND;
    if (!(d > 0 && ax < HX && z < WALL_Z)) {         // the plain: ripples lying across the course
      // (fix 6: a ripple's stripe is drawn only where it is still some pixels deep from the eye's height; further out the plain is one ochre, never a ladder of hairlines)
      const dd = (x - P.ex) * (x - P.ex) + (z - P.ez) * (z - P.ez), eh = Math.max(P.eh, 1);
      if (cs < 1) { const r = (((Math.floor(z * 2) - Math.floor(tick / 12)) % 6) + 6) % 6; if (r < 2) out.h = 0.5; else if (r > 3) out.m = MAT.SLIP; }
      else if (cs < 4) { if (dd < 260 * eh) { const r = ((Math.floor(z / 2) % 3) + 3) % 3; if (r === 0) out.s = 1; else if (r === 2) out.m = MAT.SLIP; } }
      else if (dd < 1000 * eh && (Math.floor(z / 8) & 1)) out.m = MAT.SLIP;
      return;
    }
    // the hollow floor
    const px = x - pool.x, pz = z - pool.z, pr2 = px * px + pz * pz;
    if (pr2 < 21 * 21) {                             // the star pool: eight stepped points, chequer rim, water rising by layers
      const c4 = Math.abs(Math.cos(4 * Math.atan2(pz, px))), rs = 10.5 + 7.5 * c4 * Math.sqrt(c4), pr = Math.sqrt(pr2);
      if (pr < rs) {
        const lvl = Math.floor(P.pool * 3.01) * 0.5;
        if (lvl > 0) { out.h = -1.5 + lvl; out.m = MAT.WATER; if (cs < 4) poolFace(x, z, cs, tick, out); }
        else { out.h = -1.5; out.m = MAT.PAVE; }
        return;
      }
      if (pr < rs + 2) { out.h = 0.5; out.m = ((Math.floor(x / 2) + Math.floor(z / 2)) & 1) ? MAT.LAPIS : MAT.WHITE; return; }
    }
    if (cs < 4 && Math.abs(x - chanX) < (cs < 1 ? 1.5 : 2.1) && z > dome.z + 6 && z < pool.z - 8) {   // (beyond the first merge line it is two 2 m cells wide and carries no glints: from the crest it is a band of whole cells, not a line with specks)   // the channel, three metres wide (never a line), filling cell by cell
      out.h = 0;                                                                    // flush with the paving: a sunk bed showed its far wall as a dark line from the side
      out.m = z < dome.z + 6 + P.chan * (pool.z - dome.z - 14) ? MAT.WATER : MAT.LAPIS;
      if (out.m === MAT.WATER && cs < 1) { const g = (Math.imul(Math.floor(x / cs) * 7919 + Math.floor(tick / 3), 2654435761) ^ Math.imul(Math.floor(z / cs), 40503)) >>> 0; if (g % (cs < 1 ? 29 : 11) === 0) out.m = MAT.WHITE; }   // light on running water: whitewash squares changing place twice a second
      return;
    }
    const dt = domeTop(x, z);
    if (dt > 0) { out.o = Math.min(dt, DOME_CAST); out.m = MAT.PAVE; return; }   // (fix 7: opts.domeCast = the height the dome casts from: its shade on the paving is one stepped shape at its foot, not the whole street)
    if (solidAt) out.o = solidAt(x, z, cs);          // the world's buildings: tops that cast shadow on the floor
    const zr = Math.floor(z / 4) * 4 - P.ez, q = cs < 1 ? (zr > 8 + 8 * P.eh ? 4 : 2) : cs < 4 ? 4 : 8, run = cs < 4 && zr > 16 + 12 * P.eh;           // (squares merge with the cells, so none is ever a speck) sand still lying on the paving, swept off toward the horns a row at a time
    const rk = (cs < 1 ? 0 : cs < 4 ? 256 : 512) + (Math.floor(z / cs) & 255);
    if (RN_K[rk] !== z) { RN_V[rk] = n2(z * 0.03, 3.7 + nOff); RN_K[rk] = z; }
    if (ax > Math.floor(P.bare * 170 + 9 * RN_V[rk]) + 6) { out.h = 0.5; return; }
    // (fix 6) The sand's third rule: on the hollow floor it goes sideways to the nearer horn. P.sweep = { x: the course's
    // line, z0, z1 } (set by the world, which owns the ranks of loose cubes): a rank stands every twelve cells out from
    // the course and steps a cell a tick; before each rank a veil of sand cubes still lies on the squares, thinning to
    // nothing just behind the next rank, so the floor is seen being swept bare a row at a time.
    const sw = P.sweep;
    if (sw && cs < 1 && !(out.o > 0) && z > sw.z0 && z < sw.z1) {
      const a = Math.floor(Math.abs(x - sw.x(z)) * 2);
      if (a >= 5) { const p = (((a - 4 - tick) % 12) + 12) % 12; if (p > 0 && p < 8 && hsh(Math.floor(x * 2) * 31 + 7, Math.floor(z * 2)) % 100 < 46 - p * 6) { out.m = MAT.SAND; return; } }   // (flush: a sand cell lying on the square; the cubes are the rank's)
    }
    // (fix 8) From the air the far squares merge again: a square's depth on screen goes as its size times the eye's height over the
    // distance squared, so beyond the lines where a 4 m (then an 8 m) square would be under some four pixels deep the paving is laid in
    // 8 m (then 16 m) squares; the lines lie on the 16 m grid and draw in as we come down (none below 12 m: the low eye has its own rule above).
    const zq = Math.floor(z / 16) * 16 + 8 - P.ez, fa = Math.min(1, Math.max(0, (P.eh - 12) / 18)), dq = zq > 0 ? fa * zq * zq / (75 * Math.max(P.eh, 1)) : 0, Q = dq > 8 ? 16 : dq > 4 ? Math.max(q, 8) : q;
    out.m = ((Math.floor(x / Q) + (run ? 0 : Math.floor(z / Q))) & 1) ? MAT.PAVE : MAT.BRICK;
  };

  // ---- ground, loose sand
  const cells = opts.cells || [[48, 64], [84, 112], [56, 80]];
  const focus = new THREE.Vector3(8, 0, 108);
  const ground = style.makeGround({ sample, cells, farOrigin: opts.farOrigin || [-cells[2][0] * 4, -cells[2][1] * 4 - 16], follow: opts.follow || 'focus', focus });
  root.add(ground.group);
  const [wNear, wMid, wFar] = ground.wins;
  ground.place(wMid, focus.x, focus.z); ground.place(wNear, 0, -400);
  await ctx.yield();
  const pause = () => ctx.yield();
  await ground.fillBands(wFar, 0, pause); await ground.fillBands(wMid, 0, pause); await ground.fillBands(wNear, 0, pause);
  const lr = rng.fork('loose'), nl = opts.loose || [700, 1400, 250];
  ground.wins.forEach((w, i) => { const m = style.makeLoose({ win: w, count: i === 0 ? nl[i] : Math.round(nl[i] * detail), rng: lr, rank: i === 0 ? 8 : 4, minH: i === 2 ? 12 : i === 1 ? 1 : -99 }); root.add(m); w.loose = m; });
  const slide = style.makeLoose({ win: wNear, count: Math.round((opts.slide ?? 900) * detail), rng: lr, rank: 8, avalanche: true }); root.add(slide);
  wNear.slide = slide;
  const slide2 = style.makeLoose({ win: wMid, count: Math.round((opts.slide2 ?? 420) * detail), rng: lr, rank: 4, avalanche: true }); root.add(slide2);
  await ctx.yield();

  // ---- the dome: a stepped turquoise shell on a whitewash drum with a lapis band, still wearing the dune.
  // Every dome cell carries one sand cube (the mantle); a course's cubes let go together and pour down the steps.
  const sunStep = [0.9487, 0.3153, -0.3162];
  const domeShade = (x, y, z) => { for (let s = 1.5; s < 40; s += 1) if (domeTop(x + sunStep[0] * s, z + sunStep[2] * s) > y + sunStep[1] * s) return 1; return 0; };
  const cubes = style.makeCubes(1960), shedClock = { value: 0 };
  const mantle = style.makeCubes(2600, { clock: shedClock });
  const sheet = style.makeThrown(780, { clock: shedClock, dome: new THREE.Vector4(dome.x, dome.z, dome.R, dome.drum), domeH: dome.H, domeCut, floorY: 0 });
  const TPC = 7.2;                                   // ticks per course: one course every 1.2 s
  for (let j = -dome.R; j < dome.R; j++) for (let i = -dome.R; i < dome.R; i++) {
    const x = dome.x + i, z = dome.z + j, cx = x + 0.5, cz = z + 0.5, top = domeTop(cx, cz);
    if (top <= 0) continue;
    const rim = !(domeTop(cx - 1, cz) && domeTop(cx + 1, cz) && domeTop(cx, cz - 1) && domeTop(cx, cz + 1));
    if (rim) { cubes.add(x, 0, z, 1, 6, 1, MAT.WHITE); cubes.add(x, 6, z, 1, 2, 1, MAT.LAPIS); cubes.add(x, 8, z, 1, 2, 1, MAT.WHITE); }
    const sh = domeShade(cx, top + 0.05, cz), low = Math.min(domeTop(cx - 1, cz), domeTop(cx + 1, cz), domeTop(cx, cz - 1), domeTop(cx, cz + 1));
    const y0 = Math.max(dome.drum, Math.min(low, top - 1));
    cubes.add(x, y0, z, 1, top - y0, 1, (top & 1) ? MAT.TURQ2 : MAT.TURQ, sh);
    // The sheet that pours off when this cell's course lets go: every cell's cube, in the ink of loosened sand (dark
    // ochre in the sun, pale violet in shadow: it stands off the striped mantle and the whitewash drum), a cell per tick
    // down the steps, over the cornice and out onto the paving, where it bursts (see `spill`).
    const k = dome.H - (top - dome.drum), alongX = Math.abs(cx - dome.x) >= Math.abs(cz - dome.z);
    const sx = alongX ? Math.sign(cx - dome.x) : 0, sz = alongX ? 0 : Math.sign(cz - dome.z);
    const lat = alongX ? cz - dome.z : cx - dome.x, along = alongX ? Math.abs(cx - dome.x) : Math.abs(cz - dome.z);
    const edge = (Math.sqrt(Math.max(dome.R * dome.R - lat * lat, 0)) - along) / 0.5 + 1;
    sheet.add(x, top, z, 1, MAT.AVA, sx * 0.5, 0, sz * 0.5, k * TPC + ((i * 7 + j * 13) & 7) * 0.8, edge + 15, 2, 0.1, sh, edge);
  }
  // the burst: where a course lands, loose cubes lie on the paving round the drum's foot for a few courses' time, then
  // the eddy has swept them away (they stand, then are gone: no slide)
  const spill = style.makeThrown(400, { clock: shedClock, faces: 4 });
  for (let j = -dome.R - 6; j < dome.R + 6; j++) for (let i = -dome.R - 6; i < dome.R + 6; i++) {
    const cx = dome.x + i + 0.5, cz = dome.z + j + 0.5, r = Math.hypot(cx - dome.x, cz - dome.z);
    if (r < dome.R + 1.6 || r > dome.R + 5.5 || ((i * 31 + j * 17) & 7) > (r < dome.R + 3.2 ? 1 : 0)) continue;
    const big = ((i + j) & 3) === 0 && r < dome.R + 3;
    for (let k = 4 + ((i * 5 + j * 3) & 3); k < 17; k += 4)
      spill.add(dome.x + i, 0, dome.z + j, 1, MAT.AVA, 0, 0, 0, k * TPC + 20 + (r - dome.R) * 1.5, 3.4 * TPC, 2, 0, domeShade(cx, big ? 2.6 : 1.6, cz));
  }
  spill.commit(); root.add(spill.mesh);
  await ctx.yield();
  // the mantle: the dome dilated by one cube of sand, one cube per cell and course; a course is gone at k * TPC
  for (let j = -dome.R - 1; j <= dome.R; j++) for (let i = -dome.R - 1; i <= dome.R; i++) {
    const x = dome.x + i, z = dome.z + j, cx = x + 0.5, cz = z + 0.5, t0 = domeTop(cx, cz);
    const tn = Math.max(domeTop(cx - 1, cz), domeTop(cx + 1, cz), domeTop(cx, cz - 1), domeTop(cx, cz + 1));
    if (t0 <= 0 && tn <= 0) continue;
    if (t0 <= 0) {                                   // just outside the drum: plinth, cornice, and the doors
      const door = (Math.abs(cz - dome.z) < 1.6 && cx < dome.x) || (Math.abs(cx - dome.x) < 1.6 && cz < dome.z);
      cubes.add(x, 0, z, 1, door ? 5 : 1, 1, door ? MAT.LAPIS : MAT.WHITE); cubes.add(x, dome.drum - 1, z, 1, 1, 1, MAT.WHITE);
    }
    const y0 = t0 > 0 ? t0 : dome.drum, y1 = Math.max(t0 > 0 ? t0 + 1 : 0, tn);
    for (let y = y0; y < y1; y++) {
      const k = Math.max(0, dome.drum + dome.H - y);
      mantle.add(x, y, z, 1, 1, 1, (y & 1) ? MAT.TROUGH : MAT.SAND, domeShade(cx, y + 1.05, cz), [0, 0, 0, -(k * TPC + 1)]);
    }
  }
  { const fx = dome.x - 0.5, fz = dome.z - 0.5, ft = dome.drum + dome.H + 1;      // the finial, clear of the mantle
    cubes.add(fx, ft, fz, 1, 3, 1, MAT.WHITE); cubes.add(fx - 1, ft + 1, fz, 3, 1, 1, MAT.WHITE); cubes.add(fx, ft + 3, fz, 1, 1, 1, MAT.TURQ); }
  mantle.commit(); sheet.commit(); root.add(cubes.mesh, mantle.mesh, sheet.mesh);
  await ctx.yield();

  // ---- twelve palms at the foot of the slip face, buried to the crown; their heaps are dug away a layer at a time
  const digClock = { value: 0 }, heaps = style.makeCubes(100, { clock: digClock }), palms = [];
  // BY PLACE: no part of a crown stands nearer the course's LINE x = courseX(z) than PALM_CLEAR metres in plan (so no nearer to that
  // line in space either, however a frond nods): a palm that would is dealt whole metres further out on its own side of the course
  // until it stands clear. The lens flies a spline through stations 10 m apart on that line and stands up to 0.35 m off it between
  // them; a reader's count over every place the deal can give finds the fronds 2.52 m from the lens itself at the least.
  // opts.courseX(z) is the course's x in the hollow, given by the world. PALM_PLAN = the plan of addPalm's boxes about the foot
  // [x0, z0, width, depth]: the trunk and crown cube, the four cubes of each of the six fronds, the far crown's slab (the far
  // trunk's box lies inside it): the two must change together. The heap over a palm is NOT in the plan: its two lowest layers reach
  // a metre further, under the lens (counted: 2.16 m from the lens at the least). Nothing here reads the lens, and every draw of
  // the rng stays where it was. (Only the first palm of the starboard row can ever need it.)
  const PALM_CLEAR = 2.5, PALM_PLAN = [[0, 0, 1, 1], [-2.5, -2.5, 6, 6]];
  [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]].forEach(([dx, dz]) => { for (let s = 1; s <= 4; s++) PALM_PLAN.push([s * dx, s * dz, 1, 1]); });
  const palmGap = (x, z, cx) => { let g = 1e9;
    for (let q = z - 8; q <= z + 9; q += 0.125) { const px = cx(q);
      for (let i = 0; i < PALM_PLAN.length; i++) { const r = PALM_PLAN[i], ax = Math.max(x + r[0] - px, 0, px - (x + r[0] + r[2])), az = Math.max(z + r[1] - q, 0, q - (z + r[1] + r[3])), d = Math.hypot(ax, az); if (d < g) g = d; } }
    return g; };
  for (let k = 0; k < 12; k++) {
    let x = Math.round((k < 6 ? 11 + 11 * k : -(16 + 11 * (k - 6))) + rng.range(-2, 2));   // (fix 8: the starboard row stands 5 m further out: the course bows to starboard here, and the first crown was cut by the frame's edge beside the lens) if (Math.abs(x) >= XT) crest(x + 0.5, _c); else { crestQ(x + 0.5); _c.h = _q.h; _c.z = _q.z; }   // crowns pass 7 m either side of the course
    const z = Math.round(_c.z + _c.h / SLIP + 5 + rng.range(0, 3)), h = rng.int(7, 9), late = rng.range(0, 2.5);
    if (opts.courseX) { const out = x + 0.5 < opts.courseX(z + 0.5) ? -1 : 1; for (let n = 0; n < 12 && palmGap(x, z, opts.courseX) < PALM_CLEAR; n++) x += out; }
    style.addPalm(cubes, x, 0, z, h, rng(), ground.inShadow(x, h, z) ? 1 : 0, true); palms.push(new THREE.Vector3(x + 0.5, h, z + 0.5));
    for (let y = 0; y < h; y++) { const hw = 1 + Math.ceil((h - 1 - y) / 2); heaps.add(x - hw, y, z - hw, 2 * hw + 1, 1, 2 * hw + 1, MAT.SAND, 0, [0, 0, 0, -(h - 1 - y + late + 1)]); }
  }
  cubes.commit(); heaps.commit(); root.add(heaps.mesh);

  // ---- the banner: blocks of crest dust torn off the knife edge. They are carried up and downwind square to the
  // grid (no turning), a cell per tick, leaning to starboard as they climb, so from the plain the crown flies a tall
  // streamer of separate cubes and from the back it stands across the sky bands. Where the course crosses the edge
  // (|x| < 14) nothing is launched, and everything launched near it climbs clear of the eye's line to the city.
  const nBan = Math.round(440 * detail), banner = style.makeThrown(nBan, { faces: 4 }), bannerBig = style.makeThrown(nBan, { faces: 4 });
  // (fix 8) The crown's banner is one streamer: three blocks in five are torn off a short reach of the starboard shoulder
  // (x -16 to -36) and carried to starboard, rising a little and sagging at the end, so from the plain and from the back it is a
  // long tail of separate blocks off one end of the knife edge and the edge itself stands clean against the sky bands. The
  // rest fly from the horns as before. (bannerBig is kept empty: the world still holds its stop.)
  for (let i = 0; i < nBan; i++) {
    const mid = i % 5 === 0, skip = i % 5 < 3 && !mid;
    let x = mid ? rng.range(-36, -16) : rng.range(-172, 172) * (HX - 18) / 172; const size = rng.chance(mid ? 0.5 : 0.3) ? 4 : 2;
    if (!mid && Math.abs(x) < 70) x = (x < 0 ? -1 : 1) * (70 + Math.abs(x) * 0.6);
    crest(x, _c);
    const life = rng.range(16, 34) * gust * (size === 4 ? 0.75 : 1);
    const vx = mid ? -rng.range(0.55, 0.8) * (4 / size) : -rng.range(0.1, 0.3) * (2 / size), vy = mid ? rng.range(0.2, 0.36) * (4 / size) : rng.range(0.3, 0.7) * (size === 4 ? 0.7 : 1);
    const vz = mid ? rng.range(0.08, 0.2) * (4 / size) : rng.range(0.35, 0.6) * gust * (2 / size);
    const by = _c.h - rng.range(0, mid ? 6 : 3), bz = _c.z - rng.range(0, 6), b0 = rng() * life;
    if (!skip) banner.add(Math.floor(x / size) * size, Math.floor(by / size) * size, Math.floor(bz / size) * size, size, MAT.DUST,
      vx, vy, vz, b0, life, 3, mid ? 0.012 * (4 / size) : 0.006);
  }
  bannerBig.commit(); root.add(bannerBig.mesh);
  banner.commit(); root.add(banner.mesh);

  // ---- progress: what the camera's arrival should coincide with. u = 0..1 along the brief's 41 s journey.
  const sat = (v) => Math.min(1, Math.max(0, v));
  const setState = (t) => {                          // t in journey seconds
    P.shed = Math.min(17, Math.max(0, 3 + (t - 24) / 1.2));   // the third course is going at the crest (24 s), the tenth at 32 s
    P.bare = 0.25 + 0.75 * sat((t - 18) / 20); P.chan = sat((t - 20) / 11); P.pool = sat((t - 29) / 10);
    shedClock.value = P.shed * TPC; digClock.value = Math.max(0, (t - 22) / 1.2);
  };
  const setProgress = (u) => { P.driven = true; setState(u * 41); };
  setState(0);

  // ---- anchors (local space; brief z = local z + 430)
  const hAt = (x, z) => ground.heightAt(x, z);
  const TOE = ZC - H0 * BACK_L, line = [[0, TOE - 60], [0, TOE - 20], [0, TOE], [6, ZC + (TOE - ZC) * 0.72], [12, ZC + (TOE - ZC) * 0.5], [6, ZC + (TOE - ZC) * 0.25], [0, ZC - 22], [0, ZC], [0, ZC + 14], [0, 48], [0, 82], [0, 100], [0, 136], [0, 194], [0, 252], [0, WALL_Z]];
  const flyThrough = line.map(([x, z]) => new THREE.Vector3(x, Math.max(hAt(x, z), hAt(x, z + 3), hAt(x, z - 3)) + (z === ZC || z === ZC + 14 ? 4.5 : 2.9), z));
  const tipL = crest(-HX, { h: 0, z: 0 }).z, tipR = crest(HX, { h: 0, z: 0 }).z;
  const anchors = {
    toBriefZ: 430,
    portalSeat: { position: new THREE.Vector3(0, 9.4, WALL_Z), normal: new THREE.Vector3(0, 0, -1), radius: 7 },   // centre of the 22 m ring in the wall
    flyThrough,                                               // the yacht's line: plain, S-bend up the back, over the crest, slip face, hollow, ring
    crestEye: new THREE.Vector3(0, H0 + 4.5, ZC),              // the reveal: look from here toward `dome.top`
    dome: { center: new THREE.Vector3(dome.x, 0, dome.z), top: new THREE.Vector3(dome.x, dome.drum + dome.H, dome.z), radius: dome.R, height: dome.drum + dome.H + 4 },
    pool: { center: new THREE.Vector3(pool.x, 0, pool.z), radius: 18 },
    channel: { x: chanX, z0: dome.z + 6, z1: pool.z - 8 },
    palms,                                                    // crowns of the twelve buried palms (tops of trunks)
    hornTips: [new THREE.Vector3(-HX, 5, tipL), new THREE.Vector3(HX, 5, tipR)],
    slipFoot: new THREE.Vector3(0, 0, ZC + H0 / SLIP), toe: new THREE.Vector3(0, 0, TOE), crestZ: ZC, crestHeight: H0, wallZ: WALL_Z,
    heightAt: hAt, crestAt: (x, out = new THREE.Vector3()) => { crest(x, _ca); return out.set(x, _ca.h, _ca.z); },   // pass `out` to avoid garbage
  };

  const own = !opts.style;
  const view = { radius: 100, height: 60, center: new THREE.Vector3(0, 62, 90) };
  if (opts.sky ?? own) root.add(style.makeSky());     // standalone (the part viewer): show the style's own sky
  return {
    object: root, radius: view.radius, height: view.height, center: view.center, anchors, ground: false, groundY: 0,
    style, terrain: ground, cubes, mantle, sheet, banner, bannerBig, heaps, slide, setProgress, state: P,
    update(dt, time, camera) {
      if (!P.driven) setState(20 + (time % 26));    // nobody is driving: loop the whole giving-back on the clock
      if (own) style.update(dt, time, camera);       // a shared style is updated once by the world, before this
    },
    dispose() { for (const w of ground.wins) w.tex.dispose(); if (own) style.table.dispose(); },
  };
}
