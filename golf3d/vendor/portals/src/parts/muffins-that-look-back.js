// muffins-that-look-back: THE BAKERY. Baked things and what is piped on them. Every surface is a solid of triangles with
// a baked colour at each corner (no picture is used: no texture at all); one program shades them all by a FORMULA, the
// same at every metre: a morning sun (the world names its direction), the sky's light from above, the board's from below,
// and a darker bake where a thing sits under another (a number laid at each corner, its openness, never a cast shadow;
// the tins' decks carry their domes' laid shade as that number). On the cloth the things' shadows are LAID (makeBakery:
// shadeGrid, shadeMany; shadeAt gives the same sum at one place): sums of the sun's direction and each thing's shape.
//
// THE KINDS OF SURFACE (aK.x): 0 crumb and crust (matt), 1 paper and cloth, 2 enamelled tin (plain; glossy, with a
// broad highlight and a sheen), 3 a currant or a berry (glossy), 4 ROYAL ICING, 5 boiled-sugar glass (lit from within), 6 a dog's coat (with
// a nap), 8 a dog's tongue (drawn only on a dog dealt one), 9 a dog's eye (glossy; its lid comes down over it as far as
// the lash line). Crumb and coat carry a fine GRAIN: a noise of the surface's own place (of a moving part, its place in
// its own frame), no picture.
//
// ROYAL ICING IS PIPED BY PLACE. A piped line is a ribbon that carries, at each point, how far along the line it lies
// (0 at the nozzle's start, 1 at its end) and the line's own start and span in METRES OF ROUTE FLOWN (aLine: start,
// span, share). The world writes uS, the metres of route the eye has flown; of a line only the part up to
// (uS - start) / span is drawn. Nothing else in this file reads uS, and nothing reads a time: what moves is moved by
// the world (the dogs), by the place's own clock.
//
// WHAT READS THE EYE in this file, named here (section 153), and nothing else:
//   1 the gloss on a berry, a currant, an eye, a nose, a tongue, a cherry, the tin, icing and sugar glass: a highlight,
//     which by its nature lies where the direction of sight mirrors the sun; it is dimmed by the surface's openness
//     number, so that there is none in a laid shade (sugar glass, lit from within, keeps its own whole); the enamel's
//     is broad and soft, a berry's small and bright;
//   2 the haze of flour in the air: every surface goes toward the haze's colour with its distance from the eye (from
//     uFog.x to uFog.y metres, to at most uFog.z of the way); a shadow laid on the cloth pales by the same share;
//   3 the enamel's sheen: the tin goes toward the sky's colour where the direction of sight lies low along it, by
//     half as much in a laid shade as in the sun;
//   4 the grain's footprint filter: the grain goes to its own mean with the distance from the eye (from 500 to 2000 m),
//     where its speckle would be finer than a pixel and would shimmer (its finest part from 150 to 700 m);
//   5 the nap of a dog's coat: a soft lightening where the direction of sight lies low along the coat.
// No derivative, no texture. The cuts (icing not yet piped; a tongue on a dog dealt none) are made last.
import * as THREE from 'three';

export const MAT = { crumb: 0, paper: 1, tin: 2, gloss: 3, icing: 4, glass: 5, coat: 6, tongue: 8, eye: 9 };
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
// the bakes, by my own eye
export const COL = {
  golden: lin('#DDA85C'), brown: lin('#B0712F'), pale: lin('#F0CE8C'), berry: lin('#231B3B'), stain: lin('#7A4763'),
  fawn: lin('#DBA860'), fawnDark: lin('#B8813F'), cream: lin('#F4E2BC'), pink: lin('#E9A49C'), eye: lin('#1C1410'), nose: lin('#1A1311'),
  tin: lin('#1E8A8C'), tinDark: lin('#14656C'), flour: lin('#EFE8DA'), board: lin('#D9C29A'), boardDark: lin('#C2A679'),
  ginger: lin('#B06E3A'), gingerDark: lin('#7E4A26'), gingerPale: lin('#CC8F55'), glass: lin('#FFC76A'), icing: lin('#FFFDF5'),
  crust: lin('#C98B42'), crustDark: lin('#8C5425'), slash: lin('#EED6A2'), meringue: lin('#FBEFE3'), steel: lin('#9AA5B1'),
};
export const CASES = [lin('#E27A74'), lin('#93C078'), lin('#82B0DC'), lin('#B692D6'), lin('#E66BB0'), lin('#D8423C')];      // a muffin's paper case: six tints, one by the deal, none of them a bake's tan
export const DOG_CASES = [CASES[1], CASES[2], CASES[3]];      // a dog's paper case: green, blue or lilac by the same deal, never one of the pinks or the red (its case shows close under its face, to either side of its muzzle, where a pink or a red would read as a mouth)
COL.cloth = [lin('#F5F1E8'), lin('#9DBCE0'), lin('#4C7CC4')];
COL.roofPink = lin('#F0A3B6'); COL.roofChoc = lin('#5C3421'); COL.tongue = lin('#E66F84'); COL.cherry = lin('#C2202C'); COL.enamelRed = lin('#C9302B');
COL.cake = [lin('#F6C3D0'), lin('#FBF1DC'), lin('#BFE2CD')];
// a dog's coat by its dealt number t (0 pale to 1 red-tan): what multiplies its coat (the program does the same for the parts the clock moves)
export const coatTint = (t) => [1.08 - 0.18 * t, 1.05 - 0.27 * t, 0.98 - 0.34 * t];
COL.drop = [lin('#E5484D'), lin('#F2B632'), lin('#4FB36B'), lin('#3F8FE0'), lin('#E66BB0')];
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// a soft noise of two numbers (0 to 1), from a table of sines: the same on every machine
const h2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
export const noise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return (h2(xi, yi) * (1 - u) + h2(xi + 1, yi) * u) * (1 - v) + (h2(xi, yi + 1) * (1 - u) + h2(xi + 1, yi + 1) * u) * v; };

const VERT = /* glsl */`
attribute vec3 aCol; attribute vec2 aK; attribute vec3 aLine;
#ifdef INST
attribute vec4 aI;
#endif
varying vec3 vCol, vN, vW, vLine, vTint, vP; varying vec2 vK; varying float vLid, vTongue;
void main() {
  vec4 w = vec4(position, 1.); vec3 n = normal; vLid = 0.; vTint = vec3(1.); vTongue = 0.; vP = position;
#ifdef INST
  w = instanceMatrix * w; n = mat3(instanceMatrix) * n; vLid = aI.x; vTint = mix(vec3(1.08, 1.05, .98), vec3(.9, .78, .64), aI.y); vTongue = aI.z;
#endif
  w = modelMatrix * w; vN = mat3(modelMatrix) * n;
  vW = w.xyz; vCol = aCol; vK = aK; vLine = aLine;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG = /* glsl */`
uniform vec3 uSun, uSunCol, uSkyCol, uGndCol, uFogCol, uFog, uCoat; uniform float uS;
varying vec3 vCol, vN, vW, vLine, vTint, vP; varying vec2 vK; varying float vLid, vTongue;
float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1., 0., 0.)), f.x), mix(h3(i + vec3(0., 1., 0.)), h3(i + vec3(1., 1., 0.)), f.x), f.y),
             mix(mix(h3(i + vec3(0., 0., 1.)), h3(i + vec3(1., 0., 1.)), f.x), mix(h3(i + vec3(0., 1., 1.)), h3(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }
void main() {
  float mat = floor(vK.x + .5); vec3 base = vCol, N = normalize(vN);
  bool notongue = mat == 8. && vTongue < .5; if (mat == 8.) mat = 3.;
  bool unpiped = mat == 4. && vLine.z > clamp((uS - vLine.x) / max(vLine.y, 1.), 0., 1.);      // BY PLACE: the icing's line as far as the nozzle has come
  if (mat == 9. && vLine.x > 1. - 2. * vLid) { base = uCoat; mat = 6.; }                     // a lid over an eye, from the eye's top down to the level 1 - 2 vLid of the eye's own ball (the world's clock writes vLid: 0 open, 0.65 the lash line)
  float far = length(vW - cameraPosition);
  if (mat == 6.) base *= vTint;
  if (mat == 0. || mat == 6.) { float g = mix(.5, n3(vP * .11) * .6 + n3(vP * .31) * .4, 1. - smoothstep(500., 2000., far)); g += (n3(vP * .55) - .5) * .5 * (1. - smoothstep(150., 700., far)); base *= mat == 0. ? .8 + .4 * g : .86 + .28 * g; }   // the grain (the head, 4)
  float kd = clamp((dot(N, uSun) + .14) / 1.14, 0., 1.);
  vec3 col = base * (mix(uGndCol, uSkyCol, .5 + .5 * N.y) * .47 + uSunCol * kd * 1.14) * mix(.48, 1., vK.y);
  float gloss = (mat == 3. || mat == 9.) ? 1. : mat == 4. ? .22 : mat == 5. ? .5 : 0.;
  vec3 V = normalize(cameraPosition - vW), H = normalize(V + uSun);
  float nh = max(dot(N, H), 0.);
  col += uSunCol * (mat == 2. ? pow(nh, 22.) * .3 : pow(nh, 64.) * gloss) * vK.y;     // the highlight (the head, 1): none where the surface lies under another thing or in a laid shade; on enamel a broad soft one
  if (mat == 2.) col = mix(col, uSkyCol * .92, .6 * pow(clamp(1. - dot(N, V), 0., 1.), 6.) * mix(.5, 1., vK.y));          // the enamel's sheen (the head, 3): half of it in a laid shade
  if (mat == 6.) col += base * uSkyCol * .5 * pow(clamp(1. - dot(N, V), 0., 1.), 2.5);                  // the coat's nap (the head, 5)
  if (mat == 5.) col = base * 1.2 + uSunCol * pow(max(dot(N, H), 0.), 64.) * .5;                // sugar glass, lit from within
  col = mix(col, uFogCol, uFog.z * smoothstep(uFog.x, uFog.y, far));    // the haze (the head, 2)
  if (unpiped || notongue) discard;
  gl_FragColor = vec4(col, 1.);
}`;

// a shadow laid on the cloth: a sheet a little over it that multiplies what lies under it (aS: how deep the shade is there)
const LAID_V = /* glsl */`
attribute float aS; varying float vS; varying vec3 vW;
void main() { vec4 w = vec4(position, 1.);
#ifdef INST
  w = instanceMatrix * w;
#endif
  w = modelMatrix * w; vW = w.xyz; vS = aS; gl_Position = projectionMatrix * viewMatrix * w; }`;
const LAID_F = /* glsl */`
uniform vec3 uFog, uShade; varying float vS; varying vec3 vW;
void main() { float k = vS * (1. - uFog.z * smoothstep(uFog.x, uFog.y, length(vW - cameraPosition)));      // into the haze with all else (the head, 2)
  gl_FragColor = vec4(mix(vec3(1.), uShade, k), 1.); }`;

const SKY_V = /* glsl */`varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const SKY_F = /* glsl */`
uniform vec3 uSun, uZen, uMid, uHor, uGlow; varying vec3 vD;
void main() { vec3 d = normalize(vD); float y = d.y;
  vec3 c = mix(uHor, uMid, smoothstep(0., .16, y)); c = mix(c, uZen, smoothstep(.1, .75, y));
  float s = max(dot(d, uSun), 0.); c += uGlow * (pow(s, 6.) * .25 + pow(s, 60.) * .5 + smoothstep(.9992, .9996, s) * .8);
  gl_FragColor = vec4(c, 1.); }`;

export function makeBakery(o = {}) {
  const v3 = (c) => new THREE.Vector3(c[0], c[1], c[2]), sun = new THREE.Vector3(...(o.sun || [-0.74, 0.36, -0.56])).normalize();
  const U = { uS: { value: 0 }, uSun: { value: sun }, uSunCol: { value: v3(lin('#FFE3B4')) }, uSkyCol: { value: v3(lin('#E9EEF6')) }, uGndCol: { value: v3(lin('#C9AE8C')) },
    uFogCol: { value: v3(lin('#F2DBBB')) }, uFog: { value: new THREE.Vector3(1100, 10500, 0.8) }, uCoat: { value: v3(COL.fawn) } };
  const mat = (inst) => new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, side: THREE.FrontSide, defines: inst ? { INST: 1 } : {} });
  const plain = mat(false), insts = mat(true);
  const skyMat = new THREE.ShaderMaterial({ uniforms: { uSun: { value: sun }, uZen: { value: v3(lin('#6F9BD9')) }, uMid: { value: v3(lin('#F2CDBE')) }, uHor: { value: v3(lin('#FBD9A6')) }, uGlow: { value: v3(lin('#FFE6B0')) } },
    vertexShader: SKY_V, fragmentShader: SKY_F, side: THREE.BackSide, depthWrite: false, depthTest: false });
  // a sheet of solids. add(verts, tris, cols, mat, o): verts [[x, y, z]], tris [i, j, k, ...], cols one [r, g, b] for each
  // vertex; o.inside [x, y, z]: every triangle is turned to face away from that point (a point inside the solid);
  // o.ao one number (or one for each vertex): how open to the sky (1) or tucked under (0); o.line [start, span] and
  // o.share (one for each vertex) for a piped line. Normals are smooth over the solid's own triangles.
  const sheet = () => {
    const P = [], N = [], C = [], K = [], L = [], IX = []; let n = 0, tri = 0;
    const add = (verts, tris, cols, kind, q = {}) => {
      const m = verts.length, nn = new Float64Array(m * 3), ins = q.inside;
      for (let t = 0; t < tris.length; t += 3) { let a = tris[t], b = tris[t + 1], c = tris[t + 2]; const A = verts[a], B = verts[b], Cc = verts[c];
        let x = (B[1] - A[1]) * (Cc[2] - A[2]) - (B[2] - A[2]) * (Cc[1] - A[1]), y = (B[2] - A[2]) * (Cc[0] - A[0]) - (B[0] - A[0]) * (Cc[2] - A[2]), z = (B[0] - A[0]) * (Cc[1] - A[1]) - (B[1] - A[1]) * (Cc[0] - A[0]);
        if (x * x + y * y + z * z < 1e-12) continue;
        if (ins && x * ((A[0] + B[0] + Cc[0]) / 3 - ins[0]) + y * ((A[1] + B[1] + Cc[1]) / 3 - ins[1]) + z * ((A[2] + B[2] + Cc[2]) / 3 - ins[2]) < 0) { const s = b; b = c; c = s; x = -x; y = -y; z = -z; }
        for (const i of [a, b, c]) { nn[i * 3] += x; nn[i * 3 + 1] += y; nn[i * 3 + 2] += z; } IX.push(n + a, n + b, n + c); tri++; }
      for (let i = 0; i < m; i++) { const l = Math.hypot(nn[i * 3], nn[i * 3 + 1], nn[i * 3 + 2]) || 1, c = cols[i] || cols[0];
        P.push(verts[i][0], verts[i][1], verts[i][2]); N.push(nn[i * 3] / l, nn[i * 3 + 1] / l, nn[i * 3 + 2] / l); C.push(c[0], c[1], c[2]);
        K.push(kind, q.ao == null ? 1 : typeof q.ao === 'number' ? q.ao : q.ao[i]);
        if (q.line) L.push(q.line[0], q.line[1], q.share[i]); else if (q.eye) L.push(q.eye[i], 0, 0); else L.push(0, 1, 0); }
      n += m;
    };
    const geometry = () => { const g = new THREE.BufferGeometry(), A = (arr, k) => new THREE.BufferAttribute(new Float32Array(arr), k);
      g.setAttribute('position', A(P, 3)); g.setAttribute('normal', A(N, 3)); g.setAttribute('aCol', A(C, 3)); g.setAttribute('aK', A(K, 2)); g.setAttribute('aLine', A(L, 3));
      g.setIndex(n > 65535 ? new THREE.BufferAttribute(new Uint32Array(IX), 1) : new THREE.BufferAttribute(new Uint16Array(IX), 1)); g.computeBoundingSphere(); return g; };
    return { add, geometry, tris: () => tri };
  };
  const mesh = (sh, name) => { const m = new THREE.Mesh(sh.geometry(), plain); m.name = name || 'baked'; m.frustumCulled = false; return m; };
  const many = (sh, count, name) => { const g = sh.geometry(), inst = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4); inst.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aI', inst);
    const m = new THREE.InstancedMesh(g, insts, count); m.name = name || 'many'; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); return { mesh: m, inst }; };
  const sky = (r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), skyMat); m.name = 'sky'; m.frustumCulled = false; m.renderOrder = -10; return m; };
  // ---- SHADOWS LAID ON THE CLOTH: never cast by a light; laid by sums of the sun's direction and each thing's shape.
  // kx, kz: the metres a shadow runs along x and z for each metre of height ----
  const kx = -sun.x / sun.y, kz = -sun.z / sun.y, UL = { uFog: U.uFog, uShade: { value: v3(o.shade || [0.24, 0.29, 0.45]) } };
  const laid = (inst) => new THREE.ShaderMaterial({ uniforms: UL, vertexShader: LAID_V, fragmentShader: LAID_F, side: THREE.DoubleSide, transparent: true, depthWrite: true,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, defines: inst ? { INST: 1 } : {} });
  const laidPlain = laid(false), laidInst = laid(true);
  // the shade at (px, pz) of one thing: a box { x0, x1, z0, z1, h } or a round { x, z, rx, rz, rot, h, tip } (tip: the
  // share of its radius left at its shadow's far end: 1 a drum, less a dome or a cone); soft: the edge's width in metres
  const shadeOf = (q, px, pz, soft) => { const sx = kx * q.h, sz = kz * q.h;
    if (q.rx == null) { let lo = 0, hi = 1;
      if (sx > 1e-6) { lo = Math.max(lo, (px - q.x1) / sx); hi = Math.min(hi, (px - q.x0) / sx); } else if (sx < -1e-6) { lo = Math.max(lo, (px - q.x0) / sx); hi = Math.min(hi, (px - q.x1) / sx); } else if (px < q.x0 || px > q.x1) return 0;
      if (sz > 1e-6) { lo = Math.max(lo, (pz - q.z1) / sz); hi = Math.min(hi, (pz - q.z0) / sz); } else if (sz < -1e-6) { lo = Math.max(lo, (pz - q.z0) / sz); hi = Math.min(hi, (pz - q.z1) / sz); } else if (pz < q.z0 || pz > q.z1) return 0;
      return ss(0, soft, (hi - lo) * Math.hypot(sx, sz)); }
    const c = Math.cos(q.rot || 0), s = Math.sin(q.rot || 0), lx = (c * (px - q.x) - s * (pz - q.z)) / q.rx, lz = (s * (px - q.x) + c * (pz - q.z)) / q.rz, ux = (c * sx - s * sz) / q.rx, uz = (s * sx + c * sz) / q.rz, uu = ux * ux + uz * uz;
    const t = uu > 1e-9 ? Math.min(1, Math.max(0, (lx * ux + lz * uz) / uu)) : 0, d = Math.hypot(lx - t * ux, lz - t * uz), rad = 1 + ((q.tip == null ? 1 : q.tip) - 1) * t, e = soft / Math.min(q.rx, q.rz);
    return 1 - ss(rad - e, rad + 0.4 * e, d); };
  // a mesh of cell metres over [x0, x1] by [z0, z1] at the level y: at each corner the deepest shade of the things
  // given; only the cells with shade in them are kept (and of those only where keep(x, z) says so)
  const shadeGrid = (casters, x0, x1, z0, z1, cell, y, soft, keep) => {
    const nx = Math.ceil((x1 - x0) / cell), nz = Math.ceil((z1 - z0) / cell), W = nx + 1, G = new Float32Array(W * (nz + 1));
    for (const q of casters) { const sx = kx * q.h, sz = kz * q.h, r = q.rx == null ? 0 : Math.max(q.rx, q.rz) + (q.rx == null ? 0 : soft * Math.max(q.rx, q.rz) / Math.min(q.rx, q.rz)), ax = q.rx == null ? q.x0 : q.x - r, bx = q.rx == null ? q.x1 : q.x + r, az = q.rx == null ? q.z0 : q.z - r, bz = q.rx == null ? q.z1 : q.z + r;
      const i0 = Math.max(0, Math.floor((Math.min(ax, ax + sx) - soft - x0) / cell)), i1 = Math.min(nx, Math.ceil((Math.max(bx, bx + sx) + soft - x0) / cell)), j0 = Math.max(0, Math.floor((Math.min(az, az + sz) - soft - z0) / cell)), j1 = Math.min(nz, Math.ceil((Math.max(bz, bz + sz) + soft - z0) / cell));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const v = shadeOf(q, x0 + i * cell, z0 + j * cell, soft) * (q.k == null ? 1 : q.k); if (v > G[j * W + i]) G[j * W + i] = v; } }
    const P = [], S = [], IX = [], id = new Int32Array(W * (nz + 1)).fill(-1); let n = 0, tri = 0;
    const vert = (i, j) => { const k = j * W + i; if (id[k] < 0) { id[k] = n++; P.push(x0 + i * cell, y, z0 + j * cell); S.push(G[k]); } return id[k]; };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * W + i; if (Math.max(G[k], G[k + 1], G[k + W], G[k + W + 1]) < 0.004) continue; if (keep && !keep(x0 + (i + 0.5) * cell, z0 + (j + 0.5) * cell)) continue;
      const a = vert(i, j), b = vert(i + 1, j), c = vert(i, j + 1), d = vert(i + 1, j + 1); IX.push(a, b, d, a, d, c); tri += 2; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('aS', new THREE.BufferAttribute(new Float32Array(S), 1));
    g.setIndex(n > 65535 ? new THREE.BufferAttribute(new Uint32Array(IX), 1) : new THREE.BufferAttribute(new Uint16Array(IX), 1)); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, laidPlain); m.name = 'shade'; m.frustumCulled = false; m.renderOrder = 5; return { mesh: m, tris: tri }; };
  // a flat outline [[x, y], ...] in a thing's own upright plane, count of them: the world lays each flat on the cloth
  // along the sun's direction with layFlat(y0, yi) times the thing's own matrix (y0 the cloth's level, yi the level drawn at)
  const shadeMany = (outline, count, name) => { const tr = THREE.ShapeUtils.triangulateShape(outline.map((p) => new THREE.Vector2(p[0], p[1])), []), P = [], S = [], IX = [];
    for (const p of outline) { P.push(p[0], p[1], 0); S.push(1); } for (const f of tr) IX.push(f[0], f[1], f[2]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('aS', new THREE.BufferAttribute(new Float32Array(S), 1)); g.setIndex(IX); g.computeBoundingSphere();
    const m = new THREE.InstancedMesh(g, laidInst, count); m.name = name || 'shades'; m.frustumCulled = false; m.renderOrder = 6; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); return { mesh: m, tris: tr.length }; };
  const layFlat = (y0, yi) => new THREE.Matrix4().set(1, kx, 0, -kx * y0, 0, 0, 0, yi, 0, kz, 1, -kz * y0, 0, 0, 0, 1);
  const shadeAt = (list, x, z, soft) => { let m = 0; for (const q of list) m = Math.max(m, shadeOf(q, x, z, soft)); return m; };
  return { uniforms: U, sheet, mesh, many, sky, sun, shadeGrid, shadeMany, shadeAt, layFlat, kx, kz };
}

// ---- shapes, each laid into a sheet in the caller's own frame: T(x, y, z) gives the place of a local point ----
export const frame = (ox, oy, oz, rot = 0, scale = 1) => { const c = Math.cos(rot), s = Math.sin(rot); return (x, y, z) => [ox + scale * (c * x + s * z), oy + scale * y, oz + scale * (-s * x + c * z)]; };
const TAU = Math.PI * 2;

// a solid of revolution about the frame's upright: prof [[r, y], ...] from foot to head, n sides; q.r(a, k) multiplies
// the radius at angle a of ring k (pleats, lumps); q.col(a, k, r, y) the bake at a corner; q.ao(a, k) its openness
export function lathe(sh, T, prof, n, kind, q = {}) {
  const V = [], Cc = [], AO = [], I = [], m = prof.length;
  for (let k = 0; k < m; k++) for (let i = 0; i <= n; i++) { const a = (i % n) / n * TAU, r = prof[k][0] * (q.r ? q.r(a, k) : 1), y = prof[k][1] + (q.y ? q.y(a, k) : 0);
    V.push(T(r * Math.cos(a), y, r * Math.sin(a))); Cc.push(q.col ? q.col(a, k, r, y) : q.c); AO.push(q.ao ? q.ao(a, k) : 1); }
  for (let k = 0; k < m - 1; k++) for (let i = 0; i < n; i++) { const a = k * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1; I.push(a, b, d, a, d, c); }
  const mid = prof[Math.floor(m / 2)][1], lo = prof[0][1], hi = prof[m - 1][1];
  sh.add(V, I, Cc, kind, { inside: q.inside || T(0, q.insideY != null ? q.insideY : (lo + hi) / 2 * 0.5 + mid * 0.5, 0), ao: AO });
}
// an ellipsoid about c with radii rr, nu sides by nv bands; q.col(d) the bake by the direction d from its middle (unit, in its own frame)
export function ball(sh, T, c, rr, nu, nv, kind, q = {}) {
  const V = [], Cc = [], I = [], E = [], AO = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const a = (i % nu) / nu * TAU + Math.PI, e = -Math.PI / 2 + (j / nv) * Math.PI, d = [Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)];
    V.push(T(c[0] + rr[0] * d[0], c[1] + rr[1] * d[1], c[2] + rr[2] * d[2])); Cc.push(q.col ? q.col(d) : q.c); E.push(d[1]); AO.push(q.ao ? q.ao(d) : 1); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c2 = a + nu + 1, d = c2 + 1; I.push(a, b, d, a, d, c2); }
  sh.add(V, I, Cc, kind, { inside: T(c[0], c[1], c[2]), ao: AO, eye: q.eye ? E : undefined });
}
// a slab: a box of w, h, d on its base at the frame's origin, flat faces; cols [sides, top]
export function slab(sh, T, w, h, d, cols, kind = MAT.crumb, ao = 1) {
  const x = w / 2, z = d / 2, F = [[[-x, 0, z], [x, 0, z], [x, h, z], [-x, h, z]], [[x, 0, z], [x, 0, -z], [x, h, -z], [x, h, z]], [[x, 0, -z], [-x, 0, -z], [-x, h, -z], [x, h, -z]], [[-x, 0, -z], [-x, 0, z], [-x, h, z], [-x, h, -z]], [[-x, h, z], [x, h, z], [x, h, -z], [-x, h, -z]]];
  const ins = T(0, h / 2, 0);
  F.forEach((f, k) => { const c = k === 4 ? cols[1] : (k % 2 ? mix(cols[0], [0, 0, 0], 0.12) : cols[0]); sh.add(f.map((p) => T(p[0], p[1], p[2])), [0, 1, 2, 0, 2, 3], [c, c, c, c], kind, { inside: ins, ao }); });
}
// A PIPED LINE of royal icing along pts [[x, y, z], ...] (already in place), standing off the surface along up(i): a
// ridge w wide and h high; line [start, span] in metres of route flown; its share runs with its own length
export function pipe(sh, pts, up, w, h, line, col = COL.icing, kind = MAT.icing) {
  const m = pts.length, V = [], Cc = [], S = [], I = []; let len = 0; const cum = [0];
  for (let i = 1; i < m; i++) { len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]); cum.push(len); }
  for (let i = 0; i < m; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(m - 1, i + 1)], u = up(i), tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2];
    let sx = ty * u[2] - tz * u[1], sy = tz * u[0] - tx * u[2], sz = tx * u[1] - ty * u[0]; const sl = Math.hypot(sx, sy, sz) || 1; sx *= w / 2 / sl; sy *= w / 2 / sl; sz *= w / 2 / sl;
    const p = pts[i], s = cum[i] / (len || 1);
    V.push([p[0] - sx, p[1] - sy, p[2] - sz], [p[0] + u[0] * h, p[1] + u[1] * h, p[2] + u[2] * h], [p[0] + sx, p[1] + sy, p[2] + sz]); Cc.push(col, col, col); S.push(s, s, s); }
  for (let i = 0; i < m - 1; i++) { const a = i * 3; I.push(a, a + 3, a + 4, a, a + 4, a + 1, a + 1, a + 4, a + 5, a + 1, a + 5, a + 2); }
  // each triangle turned to face along up: the point inside lies far under the line
  const mid = pts[Math.floor(m / 2)], u0 = up(Math.floor(m / 2));
  sh.add(V, I, Cc, kind, line ? { inside: [mid[0] - u0[0] * 1e4, mid[1] - u0[1] * 1e4, mid[2] - u0[2] * 1e4], line, share: S } : { inside: [mid[0] - u0[0] * 1e4, mid[1] - u0[1] * 1e4, mid[2] - u0[2] * 1e4] });
}

// ---- THE TIN'S WARES. A cup's frame has its origin at the cup's middle on the tin's deck, +z its back (away from the
// side we come from): what faces the dawn faces -z. RIM is the paper case's rim above the deck, DOME the rise above it.
export const RIM = 45, DOME = 150, TOPR = 172;
const PROF = [[150, -8], [166, 6], [TOPR, 26], [169, 48], [156, 72], [134, 98], [104, 122], [66, 139], [30, 148], [0, DOME]];
const FM = 4;
// the three dark dots, as directions from the dome's middle (8 m over the rim) in the cup's frame: az to the left of
// straight ahead (-z), el above the level. A DOG'S OWN: where its two eyes and its nose lie when it is tucked in (the
// head's sums below); A MUFFIN'S: three berries pressed in at the same places, a little astray by the deal.
export const DOTS = [[-0.42, 0.50], [0.42, 0.50], [0, 0.12]];
// a smooth curve through a profile's points, m steps to each span (never a radius under nothing)
const fine = (prof, m) => { const n = prof.length, out = [], P = (i) => prof[Math.max(0, Math.min(n - 1, i))];
  for (let k = 0; k < n - 1; k++) for (let s = 0; s < m; s++) { const t = s / m, a = P(k - 1), b = P(k), c = P(k + 1), d = P(k + 2), f = (i) => 0.5 * (2 * b[i] + (c[i] - a[i]) * t + (2 * a[i] - 5 * b[i] + 4 * c[i] - d[i]) * t * t + (3 * b[i] - a[i] - 3 * c[i] + d[i]) * t * t * t);
    out.push([Math.max(0, f(0)), f(1)]); }
  out.push(prof[n - 1].slice()); return out; };
const dotDir = (az, el) => [Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az)];
// the dome's surface along a direction from its middle (0, 8, 0): by the profile
const domeAt = (d) => { const el = Math.asin(d[1]); let best = PROF[0], be = 9;
  for (let k = 0; k < PROF.length - 1; k++) for (let s = 0; s <= 8; s++) { const t = s / 8, r = PROF[k][0] + (PROF[k + 1][0] - PROF[k][0]) * t, y = PROF[k][1] + (PROF[k + 1][1] - PROF[k][1]) * t, e = Math.abs(Math.atan2(y - 8, r) - el); if (e < be) { be = e; best = [r, y]; } }
  const h = Math.hypot(d[0], d[2]) || 1; return [best[0] * d[0] / h, best[1], best[0] * d[2] / h]; };

// a paper case: 48 pleats, flaring from the cup to its rim; the tint by the deal. Its wall is round and smooth: the pleats are its baked light and dark alone (its 96 sides are by turns a crest, light, and a fold, dark, on every cup alike), so that its rim is one smooth line (a plain circle, unless the case is pressed out as said next) and no pleat's point stands out of it under a dog's chin.
// hold(a, y), where given (the world gives it for a dog's case): the least radius the wall may have at the bearing a (in the case's own frame) and the height y over the deck; where what lies in the case reaches further than the case's own make, the paper is pressed out to that radius, at each of its four rings
export function paperCase(sh, T, tint, seed, hold = null) {
  const n = 96, fold = (a) => Math.abs(((a / TAU * 48) % 1) * 2 - 1), prof = [[138, -4], [150, 14], [160, 30], [167, RIM]];
  lathe(sh, T, prof, n, MAT.paper, { r: hold ? (a, k) => Math.max(1, hold(a, prof[k][1]) / prof[k][0]) : null, col: (a, k) => mix(mix(tint, [0, 0, 0], 0.3), mix(tint, [1, 1, 1], 0.22), fold(a)), ao: (a, k) => 0.55 + 0.45 * k / 3, insideY: 20 });
}
// A MUFFIN: a risen top over its case, lumpy, browner where it rose highest, cracked pale; three berries pressed in
export function muffin(sh, T, seed, rng) {
  // the crust's lumps and cracks, by the place on the dome seen from above (so that nothing gathers into a star at the crown)
  const FP = fine(PROF, FM), top = PROF.length - 1, at = (a, k) => { const r = FP[Math.max(0, Math.min(FP.length - 1, Math.round(k * FM)))][0]; return [r * Math.cos(a) / 60 + seed * 31, r * Math.sin(a) / 60 + seed * 17]; };
  const crag = (a, k) => { const p = at(a, k), n = noise(p[0] * 1.25, p[1] * 1.25); return 1 - Math.abs(2 * n - 1); };      // 1 along a crack of the crust, 0 between
  const lump = (a, k) => { const p = at(a, k); return 1 + (0.1 * (noise(p[0] * 0.55 + 5, p[1] * 0.55 + k * 0.3) - 0.5) + 0.04 * (noise(p[0] * 1.7, p[1] * 1.7 + 9) - 0.5) - 0.05 * ss(0.8, 1, crag(a, k)) * ss(2.5, 4, k)) * ss(0.3, 1.5, k); }, rot = (rng() - 0.5) * 0.3;
  const dots = DOTS.map(([az, el]) => { const c = Math.cos(rot), s = Math.sin(rot), a2 = az * c - (el - 0.37) * s + (rng() - 0.5) * 0.12, e2 = 0.37 + az * s + (el - 0.37) * c + (rng() - 0.5) * 0.1; return domeAt(dotDir(a2, e2)); });
  const crack = (a, y) => { const w = 0.5 + 0.5 * Math.sin(a * 3 + seed * 20 + 0.02 * y) ; return ss(0.93, 1, w) * ss(70, 120, y); };
  lathe(sh, (x, y, z) => T(x, y + RIM, z), FP, 128, MAT.crumb, { r: (a, k) => lump(a, k / FM) * (1 + 0.012 * (noise(a * 19 + seed * 3, k * 0.7) - 0.5) * ss(1, 2.5, k / FM)), y: (a, k) => 5 * (noise(a * 3.1 + seed * 5, k / FM * 1.3) - 0.5) * ss(0.6, 1.6, k / FM) * (1 - ss(top - 1, top, k / FM)), insideY: 40,
    col: (a, k, r, y) => { const p = [r * Math.cos(a), y, r * Math.sin(a)]; let c = mix(COL.pale, COL.golden, ss(10, 50, y)); c = mix(c, COL.brown, ss(50, 150, y) * (0.4 + 0.6 * noise(a * 2 + seed * 7, y * 0.03))); { const q = at(a, k / FM); c = mix(c, COL.crustDark, 0.4 * ss(0.6, 0.85, noise(q[0] * 2.6 + 3, q[1] * 2.6)) * ss(40, 90, y)); }
      c = mix(c, COL.pale, Math.max(crack(a, y) * 0.85, 0.8 * ss(0.8, 1, crag(a, k / FM)) * ss(2.5, 4, k / FM)));
      for (const d of dots) { const dd = Math.hypot(p[0] - d[0], p[1] - d[1], p[2] - d[2]); c = mix(c, COL.stain, 0.75 * (1 - ss(20, 44, dd))); } return c; },
    ao: (a, k) => Math.min(1, 0.35 + 0.325 * k / FM) });
  for (const d of dots) { const o = 0.94; ball(sh, (x, y, z) => T(x, y + RIM, z), [d[0] * o, (d[1] - 8) * o + 8, d[2] * o], [24, 22, 24], 20, 12, MAT.gloss, { c: COL.berry }); }
}
// A DOG'S HEAD, in its own frame: its middle at the origin, +z out of its face, +y to the crown. The skull an apple
// dome; a short cream muzzle set low; a dark nose; two dark round eyes set wide; cream over the brows and the cheeks.
export const HEAD = { r: [166, 150, 150], eye: [60, 26, 126], eyeR: 26, nose: [0, -44, 188], ear: [84, 112, -18], tuck: -0.35, look: 0.12, rise: 105, mid: 8, earLen: 150 };
export function dogHead(sh) {
  const T = frame(0, 0, 0);
  ball(sh, T, [0, 0, 0], HEAD.r, 64, 36, MAT.coat, { col: (d) => { let c = mix(COL.fawn, COL.fawnDark, ss(0.2, 0.9, d[1]) * 0.55 + ss(0.1, -0.8, d[2]) * 0.35);
    const face = ss(0.45, 0.9, d[2]), ax = Math.abs(d[0]); c = mix(c, COL.cream, face * ss(0.25, -0.35, d[1]) * 0.9);
    c = mix(c, COL.cream, face * ss(0.3, 0.4, d[1]) * (1 - ss(0.5, 0.62, d[1])) * ss(0.2, 0.3, ax) * (1 - ss(0.5, 0.62, ax)) * 0.85);      // brows
    c = mix(c, COL.cream, ss(0.2, 0.6, d[2]) * ss(0.13, 0.05, ax) * ss(-0.1, 0.25, d[1]) * (1 - ss(0.75, 0.97, d[1])) * 0.22);             // a faint blaze up the forehead
    c = mix(c, COL.fawnDark, 0.35 * ss(0.55, 0.8, ax) * ss(0.2, 0.7, d[2]) * ss(-0.5, 0, d[1])); return c; },
    ao: (d) => 0.6 + 0.4 * ss(-0.9, -0.2, d[1]) });
  ball(sh, T, [0, -50, 116], [62, 48, 78], 32, 18, MAT.coat, { col: (d) => mix(COL.cream, COL.fawn, ss(0.3, 0.9, d[1]) * 0.5) });
  ball(sh, T, HEAD.nose, [26, 20, 17], 20, 12, MAT.gloss, { c: COL.nose });
  for (const sg of [-1, 1]) ball(sh, T, [sg * HEAD.eye[0], HEAD.eye[1], HEAD.eye[2]], [HEAD.eyeR, HEAD.eyeR, HEAD.eyeR * 0.8], 24, 16, MAT.eye, { c: COL.eye, eye: true });
  ball(sh, T, [0, -88, 180], [15, 25, 6.5], 14, 8, MAT.tongue, { c: COL.tongue });                 // a tongue: drawn only on a dog dealt one
  // its mouth: a dark line on the muzzle under the nose, down and out to either side
  { const mc = [0, -50, 116], mr = [62, 48, 78], pts = [], ups = []; for (let i = 0; i <= 24; i++) { const s = i / 12 - 1, az = s * 0.78, el = -0.33 - 0.2 * Math.sin(Math.PI * Math.abs(s)), d = [Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)];
      const n = [d[0] / mr[0], d[1] / mr[1], d[2] / mr[2]], nl = Math.hypot(n[0], n[1], n[2]); pts.push([mc[0] + mr[0] * d[0] * 1.005, mc[1] + mr[1] * d[1] * 1.005, mc[2] + mr[2] * d[2] * 1.005]); ups.push([n[0] / nl, n[1] / nl, n[2] / nl]); }
    pipe(sh, pts, (i) => ups[i], 5.5, 1.6, null, COL.nose, MAT.crumb); }
  return sh;
}
// A DOG'S EAR, in its own frame: its root at the origin, standing along +y, its hollow (pink) toward +z; a leaf HEAD.earLen (150 m)
// long, widest a third of the way up, round at the tip; two skins 5 m apart
export function dogEar(sh) {
  const n = 9, V = [[], []], Cc = [[], []], I = [];
  for (let k = 0; k <= n; k++) { const t = k / n, w = 112 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.16 + 0.84 * Math.pow(t, 0.75)) * 0.985), 0.8) * (0.62 + 0.38 * ss(0, 0.3, t)) * (1 - 0.25 * t), y = HEAD.earLen * t, cup = 26 * Math.sin(Math.PI * t);
    for (let s = 0; s < 2; s++) for (const [x, zc, edge] of [[-w / 2, 0, 1], [0, -cup, 0], [w / 2, 0, 1]]) { V[s].push([x, y, zc + (s ? -4 : 4) * (1 - edge)]); Cc[s].push(s ? COL.fawn : mix(COL.pink, COL.fawn, edge * 0.8 + (1 - edge) * ss(0.75, 1, t))); } }
  for (let k = 0; k < n; k++) { const a = k * 3; I.push(a, a + 1, a + 4, a, a + 4, a + 3, a + 1, a + 2, a + 5, a + 1, a + 5, a + 4); }
  sh.add(V[0], I, Cc[0], MAT.coat, { inside: [0, 75, -400], ao: 0.92 }); sh.add(V[1], I, Cc[1], MAT.coat, { inside: [0, 75, 400] });
  return sh;
}
// A DOG'S TAIL, in its own frame: its root at the origin, rising along +y and curling over toward +z (toward the dog's
// head); 104 m along its curl, tapering, a cream tip. Its triangles are wound here, each band away from its own middle
// (no one point lies inside a curl)
export function dogTail(sh) {
  const n = 10, m = 8, R = 55, V = [], Cc = [], I = [], mid = [];
  for (let k = 0; k <= n; k++) { const t = k / n, f = 1.9 * t, c = [0, R * Math.sin(f), R * (1 - Math.cos(f))], r = 15 - 9.5 * t, ty = Math.cos(f), tz = Math.sin(f); mid.push(c);
    for (let i = 0; i <= m; i++) { const a = (i % m) / m * TAU, cx = Math.cos(a), cn = Math.sin(a); V.push([r * cx, c[1] - r * cn * tz, c[2] + r * cn * ty]); Cc.push(mix(COL.fawn, COL.cream, ss(0.55, 0.95, t))); } }
  const tip = [0, R * Math.sin(1.9) + 7 * Math.cos(1.9), R * (1 - Math.cos(1.9)) + 7 * Math.sin(1.9)]; V.push(tip); Cc.push(COL.cream);
  const tri = (a, b, c, o) => { const A = V[a], B = V[b], C = V[c], x = (B[1] - A[1]) * (C[2] - A[2]) - (B[2] - A[2]) * (C[1] - A[1]), y = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]), z = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
    if (x * ((A[0] + B[0] + C[0]) / 3 - o[0]) + y * ((A[1] + B[1] + C[1]) / 3 - o[1]) + z * ((A[2] + B[2] + C[2]) / 3 - o[2]) < 0) I.push(a, c, b); else I.push(a, b, c); };
  for (let k = 0; k < n; k++) { const o = [0, (mid[k][1] + mid[k + 1][1]) / 2, (mid[k][2] + mid[k + 1][2]) / 2]; for (let i = 0; i < m; i++) { const a = k * (m + 1) + i, b = a + 1, c = a + m + 1, d = c + 1; tri(a, b, d, o); tri(a, d, c, o); } }
  for (let i = 0; i < m; i++) tri(n * (m + 1) + i, n * (m + 1) + i + 1, V.length - 1, mid[n]);
  sh.add(V, I, Cc, MAT.coat, { ao: 0.95 });
  return sh;
}
// A DOG'S NECK AND CHEST, in the cup's frame turned to the dog's own heading (+z out of its chest): a column from the
// case to under the head, 150 m at its full height (the world stretches it with the head's rise), cream down its front
export function dogNeck(sh) {
  lathe(sh, frame(0, 0, 0), [[150, 0], [140, 36], [126, 84], [120, 150]], 36, MAT.coat, { col: (a) => mix(COL.fawn, COL.cream, ss(0.3, 0.95, Math.sin(a)) * 0.85), ao: (a, k) => 0.55 + 0.15 * k, insideY: 60 });
  return sh;
}
// a gingerbread house: a slab under two roof slabs, its window a pane of sugar glass, icing along its eaves BY PLACE
export function house(sh, T, w, h, d, line, rng, k = 1, dim = null) {
  const g = mix(COL.ginger, COL.gingerPale, 0.35 + 0.65 * rng()), rk = rng(), rf = rk < 0.4 ? mix(COL.gingerDark, COL.ginger, rng() * 0.5) : rk < 0.66 ? mix(COL.icing, COL.flour, 0.4) : rk < 0.85 ? COL.roofPink : COL.roofChoc, ins = T(0, h * 0.6, 0);
  { const gw = dim ? [g[0] * dim[0], g[1] * dim[1], g[2] * dim[2]] : g; slab(sh, T, w, h, d, [gw, gw]); }
  const x = w / 2 + 1.5, z = d / 2 + 1.5, r = h + w * 0.55;
  for (const sg of [-1, 1]) { const q = [T(sg * x, h - 1, z), T(sg * x, h - 1, -z), T(0, r, -z), T(0, r, z)]; sh.add(q, [0, 1, 2, 0, 2, 3], [rf, rf, rf, rf], MAT.crumb, { inside: ins }); }
  for (const sg of [-1, 1]) { const q = [T(-x + 1.5, h, sg * (z - 1.5)), T(x - 1.5, h, sg * (z - 1.5)), T(0, r, sg * (z - 1.5))]; sh.add(q, [0, 1, 2], [g, g, g], MAT.crumb, { inside: ins }); }
  for (const sg of [-1, 1]) { const q = [T(-w * 0.2, h * 0.3, sg * (d / 2 + 0.4)), T(w * 0.2, h * 0.3, sg * (d / 2 + 0.4)), T(w * 0.2, h * 0.72, sg * (d / 2 + 0.4)), T(-w * 0.2, h * 0.72, sg * (d / 2 + 0.4))]; sh.add(q, [0, 1, 2, 0, 2, 3], [COL.glass, COL.glass, COL.glass, COL.glass], MAT.glass, { inside: ins }); }
  if (line) for (const sg of [-1, 1]) { const pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push(T(sg * (x + 0.2), h - 1 + 0.8 * Math.abs(Math.sin(t * Math.PI * 3)), -z + 2 * z * t)); } pipe(sh, pts, () => { const a = T(0, 0, 0), b = T(sg * 0.8, 0.6, 0); return [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; }, 3.6 * k, 1.7 * k, line); }
  if (line) { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(T(0, r + 0.2 + 0.9 * Math.abs(Math.sin(t * Math.PI * 4)), -z + 2 * z * t)); } const a = T(0, 0, 0), b = T(0, 1, 0), u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; pipe(sh, pts, () => u, 4.2 * k, 2 * k, line); }
}
// a gumdrop as a tree: a drop of boiled sugar on the ground
export function gumdrop(sh, T, r, h, c) {
  lathe(sh, T, [[r * 0.92, 0], [r, h * 0.18], [r * 0.9, h * 0.5], [r * 0.6, h * 0.82], [r * 0.25, h * 0.97], [0, h]], 14, MAT.glass, { col: (a, k) => mix(mix(c, [0, 0, 0], 0.25), mix(c, [1, 1, 1], 0.25), k / 5), insideY: h * 0.4 });
}
// a prism: a convex outline pts [[x, y], ...] in the frame's x-y plane, from z0 (its back) to z1 (its face); cf the
// colour of its face, cs of its back and edge
export function prism(sh, T, pts, z0, z1, cf, cs, kind = MAT.crumb) {
  const n = pts.length, cx = pts.reduce((t, q) => t + q[0], 0) / n, cy = pts.reduce((t, q) => t + q[1], 0) / n, ins = T(cx, cy, (z0 + z1) / 2);
  const F = [T(cx, cy, z1)], K = [T(cx, cy, z0)], I = [], E = [], EI = [];
  for (let i = 0; i < n; i++) { F.push(T(pts[i][0], pts[i][1], z1)); K.push(T(pts[i][0], pts[i][1], z0)); I.push(0, 1 + i, 1 + (i + 1) % n); }
  sh.add(F, I, F.map(() => cf), kind, { inside: ins }); sh.add(K, I, K.map(() => cs), kind, { inside: ins });
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; E.push(T(pts[i][0], pts[i][1], z0), T(pts[j][0], pts[j][1], z0), T(pts[j][0], pts[j][1], z1), T(pts[i][0], pts[i][1], z1)); EI.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3); }
  sh.add(E, EI, E.map(() => cs), kind, { inside: ins });
}
const caps = (a, b, r, n = 6) => { const g = Math.atan2(b[1] - a[1], b[0] - a[0]), P = [];
  for (let i = 0; i <= n; i++) { const t = g - Math.PI / 2 + Math.PI * i / n; P.push([b[0] + r * Math.cos(t), b[1] + r * Math.sin(t)]); }
  for (let i = 0; i <= n; i++) { const t = g + Math.PI / 2 + Math.PI * i / n; P.push([a[0] + r * Math.cos(t), a[1] + r * Math.sin(t)]); } return P; };
// A GINGERBREAD MAN, standing: 100 high in its own frame (sc is the scale of the caller's frame), 20 thick (a fifth of his height), its face
// toward +z; eyes, a smile and cuffs of royal icing BY PLACE (line), three sugar buttons of the colours cols
export function cookieMan(sh, T, sc, line, rng, cols) {
  const g = mix(COL.ginger, COL.gingerPale, 0.3 + 0.7 * rng()), e = mix(g, COL.gingerDark, 0.3), Z = 10, disc = [];
  for (let i = 0; i < 20; i++) disc.push([17 * Math.cos(i / 20 * TAU), 82 + 17 * Math.sin(i / 20 * TAU)]);
  prism(sh, T, disc, -Z, Z, g, e);
  prism(sh, T, [[-18, 28], [18, 28], [22, 50], [18, 68], [-18, 68], [-22, 50]], -Z, Z, g, e);
  for (const sg of [-1, 1]) { prism(sh, T, caps([sg * 16, 60], [sg * 44, 54], 9), -Z, Z, g, e); prism(sh, T, caps([sg * 9, 32], [sg * 17, 9], 10), -Z, Z, g, e); }
  const o = T(0, 0, 0), zz = T(0, 0, 1), u = [(zz[0] - o[0]) / sc, (zz[1] - o[1]) / sc, (zz[2] - o[2]) / sc], up = () => u, P = (x, y) => T(x, y, Z + 0.3), w = 3.2 * sc, h = 1.5 * sc;
  for (const sg of [-1, 1]) pipe(sh, [P(sg * 6.5 - 1.7, 86), P(sg * 6.5, 86.4), P(sg * 6.5 + 1.7, 86)], up, w * 1.15, h, line);
  { const pts = []; for (let i = 0; i <= 8; i++) { const a = Math.PI * (1.2 + 0.6 * i / 8); pts.push(P(9.5 * Math.cos(a), 84 + 9.5 * Math.sin(a))); } pipe(sh, pts, up, w * 0.8, h, line); }
  for (const sg of [-1, 1]) { pipe(sh, [P(sg * 35.5, 63.5), P(sg * 38, 59.5), P(sg * 36, 55.5), P(sg * 38.5, 51.5), P(sg * 36.5, 48)], up, w * 0.8, h, line);
    pipe(sh, [P(sg * 6, 17), P(sg * 10, 14.5), P(sg * 14, 17.5), P(sg * 18, 15), P(sg * 22, 17.5), P(sg * 25, 15.5)], up, w * 0.8, h, line); }
  for (let k = 0; k < 3; k++) ball(sh, T, [0, 60 - 11 * k, Z + 1], [3.8, 3.8, 2.6], 10, 5, MAT.glass, { c: cols[Math.floor(rng() * cols.length) % cols.length] });
}
// his outline in his own upright plane (for the shadow the world lays of him)
export const MAN_OUTLINE = (() => { const R = [[0, 27], [7.6, 5.7], [12, 0.3], [17, -1], [22, 0.3], [25.7, 4], [26.4, 12.3], [18.4, 35.3], [21, 42], [22, 49.5], [42.1, 45.2], [47, 45.5], [51.5, 49.5], [53, 54.5], [50.5, 60], [45.9, 62.8], [18, 68.7], [9.75, 68.1], [14.7, 73.5], [17, 82], [14.7, 90.5], [8.5, 96.7], [0, 99]];
  return R.concat(R.slice(1, -1).reverse().map((p) => [-p[0], p[1]])); })();
// A TIERED CAKE on a stand, in the caller's frame (its foot at the origin; sc is the scale of that frame): three iced
// tiers, a garland of piped icing round each BY PLACE (line), a ring of sugar drops at each tier's foot, a cherry
export function cake(sh, T, line, cols, sc = 1) {
  const o = T(0, 0, 0), up = (a) => { const q = T(Math.cos(a), 0, Math.sin(a)); return [(q[0] - o[0]) / sc, (q[1] - o[1]) / sc, (q[2] - o[2]) / sc]; };
  lathe(sh, T, [[150, 0], [110, 20], [560, 30], [612, 42], [560, 50], [0, 50]], 72, MAT.tin, { c: COL.flour, insideY: 30 });
  const tiers = [[520, 50, 250], [380, 300, 230], [250, 530, 210]];
  tiers.forEach(([r, y0, h], k) => {
    lathe(sh, T, [[r, y0], [r, y0 + h - 34], [r - 10, y0 + h - 10], [r - 36, y0 + h], [0, y0 + h]], 72, MAT.icing, { c: COL.cake[k], ao: (a, j) => j === 0 ? 0.7 : 1, insideY: y0 + h / 2 });
    const pts = [], ups = [], n = 288, sw = 12 + 4 * (2 - k); for (let i = 0; i <= n; i++) { const a = i / n * TAU; pts.push(T((r + 1) * Math.cos(a), y0 + h - 38 - 46 * Math.abs(Math.sin(a * sw / 2)), (r + 1) * Math.sin(a))); ups.push(up(a)); }
    for (let j = 0; j < 8; j++) { const i0 = j * n / 8; pipe(sh, pts.slice(i0, i0 + n / 8 + 1), (i) => ups[i0 + i], 16 * sc, 10 * sc, [line[0] + line[1] * j / 8, line[1] / 8], k === 1 ? COL.roofPink : COL.icing); }
    const m = 28 - 6 * k; for (let i = 0; i < m; i++) { const a = (i + 0.5) / m * TAU; ball(sh, T, [(r + 14) * Math.cos(a), y0 + 16, (r + 14) * Math.sin(a)], [19, 19, 19], 8, 5, MAT.glass, { c: cols[(i + k) % cols.length] }); }
    // icing run down from the tier's top in drips (the drips' lengths by the angle), and a ring of rosettes on the top's edge
    const cap = k === 1 ? COL.roofPink : COL.icing, dr = (a) => 30 + 52 * Math.pow(0.5 + 0.5 * Math.sin(a * (9 + 2 * k) + k), 2) + 26 * Math.pow(0.5 + 0.5 * Math.sin(a * 23 + 2 * k), 4);
    lathe(sh, T, [[r + 5, y0 + h], [r + 6, y0 + h - 6], [r - 8, y0 + h + 5], [0, y0 + h + 5]], 144, MAT.icing, { c: cap, y: (a, j) => j === 0 ? -dr(a) : 0, insideY: y0 + h - 20 });
    const nr = 30 - 7 * k; for (let i = 0; i < nr; i++) { const a = (i + 0.25) / nr * TAU; ball(sh, T, [(r - 30) * Math.cos(a), y0 + h + 16, (r - 30) * Math.sin(a)], [22, 17, 22], 8, 5, MAT.icing, { c: k === 1 ? COL.icing : COL.roofPink }); } });
  ball(sh, T, [0, 740 + 52, 0], [62, 58, 62], 20, 12, MAT.gloss, { c: COL.cherry });
}
// a loaf as a hill: half an ellipsoid on the board, slashed pale across its crown, floured on top
export function loaf(sh, T, rx, ry, rz, seed) {
  const V = [], Cc = [], I = [], nu = 64, nv = 14;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const a = (i % nu) / nu * TAU, e = (j / nv) * Math.PI / 2, d = [Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)], bump = 1 + 0.05 * (noise(a * 3 + seed * 9, j * 0.8 + seed) - 0.5);
    const p = [rx * d[0] * bump, ry * d[1] * bump, rz * d[2] * bump];
    const sl = ss(0.8, 0.97, Math.abs(Math.sin((p[2] + p[0] * 0.45) / (rz * 0.34) * Math.PI + seed * 6))) * ss(0.4, 0.7, d[1]), dn = 1 - 0.06 * sl; V.push(T(p[0] * dn, p[1] * dn, p[2] * dn));
    let c = mix(COL.crustDark, COL.crust, ss(0.05, 0.6, d[1]) * (0.6 + 0.4 * noise(a * 2 + seed, j * 0.7))); c = mix(c, COL.slash, sl * 0.9); c = mix(c, COL.flour, ss(0.7, 1, d[1]) * (1 - sl) * 0.55); Cc.push(c); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; I.push(a, b, d, a, d, c); }
  sh.add(V, I, Cc, MAT.crumb, { inside: T(0, 0, 0) });
}
// a tube along pts [[x, y, z], ...] in the frame, of radius rad(i) at point i, n sides: each band laid as a solid of its own
export function tube(sh, T, pts, rad, n, kind, col) {
  const m = pts.length, R = [];
  for (let i = 0; i < m; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(m - 1, i + 1)], t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], tl = Math.hypot(t[0], t[1], t[2]) || 1; t[0] /= tl; t[1] /= tl; t[2] /= tl;
    let e1 = Math.abs(t[2]) < 0.9 ? [t[1], -t[0], 0] : [0, t[2], -t[1]]; const l1 = Math.hypot(e1[0], e1[1], e1[2]); e1 = [e1[0] / l1, e1[1] / l1, e1[2] / l1];
    const e2 = [t[1] * e1[2] - t[2] * e1[1], t[2] * e1[0] - t[0] * e1[2], t[0] * e1[1] - t[1] * e1[0]], r = rad(i), ring = [];
    for (let k = 0; k <= n; k++) { const an = (k % n) / n * TAU, c = Math.cos(an) * r, s = Math.sin(an) * r; ring.push([pts[i][0] + c * e1[0] + s * e2[0], pts[i][1] + c * e1[1] + s * e2[1], pts[i][2] + c * e1[2] + s * e2[2]]); }
    R.push(ring); }
  for (let i = 0; i < m - 1; i++) { const V = [], I = []; for (const q of R[i].concat(R[i + 1])) V.push(T(q[0], q[1], q[2]));
    for (let k = 0; k < n; k++) { const a = k, b = k + 1, c = n + 1 + k, d = c + 1; I.push(a, b, d, a, d, c); }
    sh.add(V, I, V.map(() => col), kind, { inside: T((pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2, (pts[i][2] + pts[i + 1][2]) / 2) }); }
}
// THINGS OF THE BREAKFAST TABLE, far off; each in the caller's frame, its foot at the origin (the frame's scale sizes it).
// an enamel teapot, 1050 high: its spout toward +x, its handle toward -x; c its enamel, c2 its band, knob and handle
export function teapot(sh, T, c, c2) {
  lathe(sh, T, fine([[300, 0], [430, 25], [610, 190], [680, 420], [610, 650], [430, 790], [300, 830]], 3), 40, MAT.tin, { col: (a, k, r, y) => (y > 380 && y < 470 ? c2 : c), insideY: 400 });
  lathe(sh, T, [[310, 826], [322, 850], [210, 900], [70, 930], [58, 965]], 28, MAT.tin, { c, insideY: 850 });
  ball(sh, T, [0, 1002, 0], [92, 48, 92], 16, 8, MAT.tin, { c: c2 });      // its knob
  const sp = []; for (let i = 0; i <= 8; i++) { const s = i / 8; sp.push([560 + 430 * s + 60 * Math.sin(Math.PI * s), 250 + 520 * s * s, 0]); }
  tube(sh, T, sp, (i) => 125 - 68 * i / 8, 14, MAT.tin, c);
  const hd = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.42 + 1.16 * i / 10); hd.push([-600 + 250 * Math.cos(a), 430 + 250 * Math.sin(a), 0]); }
  tube(sh, T, hd, () => 42, 10, MAT.tin, c2);
}
// a cup on its saucer, 524 high, 1200 across the saucer: its handle toward +x; c its glaze, c2 its rims and handle, tea the tea in it
export function teacup(sh, T, c, c2, tea) {
  lathe(sh, T, [[0, 0], [330, 0], [430, 26], [585, 62], [600, 78]], 40, MAT.tin, { col: (a, k) => (k >= 3 ? c2 : c), insideY: 1e5 });      // its underside (turned from a point far over it)
  lathe(sh, T, [[600, 78], [585, 80], [420, 52], [0, 44]], 40, MAT.tin, { col: (a, k) => (k <= 1 ? c2 : c), insideY: -1e5 });                 // its dish (from a point far under it)
  lathe(sh, T, [[190, 44], [240, 66], [370, 240], [432, 460], [446, 520], [436, 524], [0, 516]], 40, MAT.tin, { col: (a, k) => (k === 6 ? tea : k >= 4 ? c2 : c), insideY: 250 });
  const hd = []; for (let i = 0; i <= 8; i++) { const a = Math.PI * (-0.42 + 0.84 * i / 8); hd.push([400 + 150 * Math.cos(a), 300 + 150 * Math.sin(a), 0]); }
  tube(sh, T, hd, () => 30, 10, MAT.tin, c2);
}
// a jar of jam, 720 high, a checked cloth tied over its mouth
export function jamJar(sh, T, jam, cloth) {
  lathe(sh, T, [[290, 0], [330, 30], [330, 170], [331, 172], [331, 390], [330, 392], [330, 500], [300, 580], [270, 620]], 32, MAT.glass, { col: (a, k) => (k === 3 || k === 4 ? COL.cream : mix(jam, [0, 0, 0], 0.25 - 0.03 * k)), insideY: 300 });
  lathe(sh, T, [[352, 560], [300, 628], [296, 700], [280, 716], [0, 720]], 48, MAT.paper, { r: (a, k) => (k === 0 ? 1 + 0.06 * Math.sin(a * 16) : 1), col: (a, k) => cloth[(Math.floor(a / TAU * 24 + 0.001) + k) % 2 ? 0 : 2], insideY: 640 });
}
// a stack of n plates, 1270 across; c the glaze, c2 the band round each rim
export function plates(sh, T, n, c, c2) {
  for (let i = 0; i < n; i++) { const y = 46 * i;
    lathe(sh, T, [[0, y], [330, y], [470, y + 30], [620, y + 66], [636, y + 80]], 44, MAT.tin, { col: (a, k) => (k >= 3 ? c2 : c), insideY: 1e5 });      // its underside
    lathe(sh, T, [[636, y + 80], [620, y + 84], [450, y + 52], [0, y + 44]], 44, MAT.tin, { col: (a, k) => (k <= 1 ? c2 : c), insideY: -1e5 }); }         // its dish
}
// a meringue kiss as a cloud: three piped drops side by side, each with its peak
export function kiss(sh, T, r, seed) {
  for (let k = 0; k < 3; k++) { const s = k === 1 ? 1 : 0.68 + 0.14 * ((seed * (k + 3) * 7.13) % 1), x = (k - 1) * r * 1.15, tint = mix(COL.meringue, lin('#F6D2C4'), 0.25 + 0.3 * ((seed * (k + 1) * 3.7) % 1));
    lathe(sh, (px, py, pz) => T(x + px * s, py * s, pz * s * 0.8), [[0, -0.42 * r], [0.7 * r, -0.34 * r], [r, -0.05 * r], [0.92 * r, 0.3 * r], [0.6 * r, 0.62 * r], [0.26 * r, 0.9 * r], [0.07 * r, 1.12 * r], [0, 1.2 * r]], 14, MAT.crumb, { col: (a, kk) => mix(mix(tint, lin('#D9B7A6'), 0.5), tint, Math.min(1, kk / 3)), insideY: 0.2 * r }); }
}
