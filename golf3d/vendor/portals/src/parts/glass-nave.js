// HERO SET PIECE for "glass-nave": THE ROSE WINDOW and its cone of coloured light.
//
// What it is
//   The east end of the nave: a masonry gable wall (26 m wide, 53 m to the apex, 1.6 m thick) pierced by
//   an 18 m rose (centre 30 m up, twelve tracery petals round a 10 m eye) over a gallery of lancets, the
//   raised choir floor in front of it with steps and altar, and the rose's projection: a ray-marched
//   slanting cone of coloured haze that lands as a disc of the same pattern on the floor.
//   Origin = base centre of the wall's inner face. +Y up. The inner (nave) face looks toward +Z, so the
//   nave runs from z = 0 (east wall) to +Z (west door); the camera arrives travelling toward -Z.
//   The sun is behind the wall (-Z side), high and to the camera's right (+X); light travels -X, -Y, +Z.
//
// opts
//   palette      [stone light, stone mid, stone dark, shadow, blue, ruby, gold] hex strings (brief default)
//   sunElevation degrees above horizon (30)        sunAzimuth  degrees right of the axis (9, +-3 per seed).
//                (The brief's 25 deg would throw the whole disc into the left aisle; 9 keeps it on the choir
//                floor and the left pillars. Pass 25 if your room wants it.)
//   dais         true: build the raised choir floor (19.5 x 49.5 m, 2 m high) + steps + altar. false: wall only.
//   daisLength   49.5      daisHeight 2      naveWidth 19.5
//   intensity    1  overall strength of glass glow and projected light
//   materials    { stone, carved, gilt, floor }: optional lit base materials (e.g. the interior kit's rig materials, vertex
//                colours on) used instead of plain MeshStandardMaterials, so the piece is lit like the room around it.
//                The piece chains its own masonry and rose-light patch onto them. floor = the room's own floor material.
//   daisColor    vertex colour of the choir floor (default: light stone)
//   roseElevation degrees: elevation of the light through the ROSE only (default: sunElevation). A world whose camera flies
//                level at the rose's height passes a low value (about 10), so the cone runs nearly level down the vessel, the
//                camera flies inside it, and the disc lands along the left-hand wall. The lancets keep sunElevation.
//   coneLength   metres the cone reaches from the wall (68)      clipX  half width beyond which the haze is not drawn (none)
//
// anchors (hero-local space)
//   portalSeat   { position (0,30,0.9), normal (0,0,1), radius 5 }: the circular exit portal sits in the eye
//                of the rose, facing +Z. Everything of the eye is behind z = 0.6, so a 5 m disc covers it.
//   roseCenter   Vector3 (0,30,0)        roseRadius 9      eyeRadius 5
//   flyThrough   ordered points from the west toward the eye, level at y = 30 for the last 60 m (>= 6 m clear
//                of everything but the eye ring itself, which the portal fills).
//   coneAxis     { origin, dir, length }: axis of the light cone; coneEntry: where the axis crosses y = 20.
//   discCenter   where the cone axis lands on the choir floor.
//   altar        position of the altar top centre (candles and lilies are here).
//   viewpoints   a few good camera positions looking at roseCenter.
//
// Extra API on the returned object
//   setProgress(u)        u = 0..1 of the world's journey. Drives the "sun coming out" swell of the cone and
//                         the slow slide of the light (never wall-clock). Call every frame from update(u).
//   applyRoseLight(mat)   patch any MeshStandardMaterial/MeshPhysicalMaterial of the WORLD (pillars, stalls,
//                         floor) so it receives the projected rose pattern too. Call before first render.
//   setConeGain(g)        0..1 strength of the ray-marched cone only. The cone is not depth-tested, so the world fades it
//                         out while the camera is in a side aisle (it would draw over the arcade).
//   setConeReach(z)       metres from the wall at which the ray-marched cone has faded out (default: its full 68 m). The world keeps it
//                         short while the camera is far down the nave, so the fan of rays does not hide the window itself.
//   setGlassGain(g)       brightness of the glass itself (1). Blue and ruby panes sit near 0.4-0.6 linear, only gold blooms.
//   setAisleGlow({ x, bay, z, strength, color })   warm candle glow on patched surfaces beyond |x| (hero-local), strongest every
//                         `bay` metres from hero-local z; 0 strength (default) = off. For the outer aisle walls of the world.
//   setSurfaceLight(k, graze)  strength of the projected pattern on patched surfaces (1), and how much of it a surface the
//                         light only grazes still takes (0 = physical cosine, 1 = nearly flat): for walls parallel to the beam.
//   setLens(k)            0..1 strength of the lens wash: a camera-following additive quad showing the colours of the pattern
//                         at the camera's own place in the cone (0 outside it), strongest toward the frame edges. Peak about 0.25 linear.
//   setOccluder(min, max) one hero-local box (arrays of 3) that stops the ray-marched cone, for a solid thing of the world inside it.
//   coneOffset(camera)    metres from the camera to the cone's axis, measured in the wall plane (<= 9 means inside the light).
//   uniforms              the shared uniform block (uInt, uSunL, ...), if you need to tune live.
//
// Size and cost: radius 26 (the cone and its floor disc reach z = 68), height 53 (finial 56). About 38k triangles,
// 8 draw calls (wall, carving, floor, gilt, glass, cone, flames, dust), one warm PointLight at the altar
// (opts.light = false removes it), about 150 ms build.   opts.apron = false drops the strip of nave floor west of
// the choir steps that is only there so the disc has somewhere to land when the piece is viewed alone.
// Lighting it expects: a DARK interior (hemisphere/ambient low, cool grey-violet). The glass and the cone are
// self-lit (emissive 2..6, they bloom); the stone uses MeshStandardMaterial so the world's lights shade it.
// No lights of its own. Fog: all materials honour scene fog.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const DEFAULT_PALETTE = ['#c4b9a3', '#8f8572', '#4e4a46', '#1e1a22', '#2f5fd0', '#d02f4a', '#ffcf5a'];
const ROSE_Y = 30, ROSE_R = 9;

// ---------------------------------------------------------------- shared GLSL: the rose pattern
const GLSL_ROSE = /* glsl */`
uniform vec3 uBlue, uRuby, uGold;
uniform vec4 uVar;            // x: eye fold count, y: rotation, z: seed offset, w: alternate scheme
uniform float uRoseT;         // seconds: panes glint and dim one by one as the sun moves behind them
const float R_PI = 3.14159265;
vec2 rHash(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
vec3 rVoro(vec2 x){
  vec2 n = floor(x), f = fract(x), mg = vec2(0.), mr = vec2(0.); float md = 8.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 g = vec2(float(i), float(j)); vec2 r = g + rHash(n + g) - f; float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; } }
  md = 8.;
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 g = mg + vec2(float(i), float(j)); vec2 r = g + rHash(n + g) - f;
    if (dot(mr - r, mr - r) > 1e-5) md = min(md, dot(0.5 * (mr + r), normalize(r - mr))); }
  vec2 h = rHash(n + mg + 17.3);
  return vec3(md, h);
}
float rSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0., 1.)); }
// p: metres from the rose centre in the wall plane (x toward +X, y up). detail 1 = leaded panes, 0 = smooth.
// soft: edge softness of the stone mask in metres. Returns linear colour, 0 where stone blocks the light.
vec3 roseGlass(vec2 p, float detail, float soft){
  float r = length(p);
  if (r > 9.05 + soft) return vec3(0.);
  float ang = atan(p.y, p.x) + uVar.y;
  float s = R_PI / 6.;
  float sec = floor((ang + s * .5) / s);
  float a = abs(mod(ang + s * .5, s) - s * .5);
  vec2 q = r * vec2(cos(a), sin(a));
  const vec2 e = vec2(0.9659258, 0.2588190);
  float d = 9.0 - r;
  d = min(d, abs(r - 5.15) - .2);
  d = min(d, rSeg(q, 5.15 * e, 6.6 * e) - .13);
  float dArch = length(q - vec2(6.375, -.729)) - 2.437;
  d = min(d, (q.x > 6.375 ? abs(dArch) : length(q - 6.6 * e)) - .12);
  float dOc = length(q - 8.2 * e) - .6;
  d = min(d, abs(dOc) - .08);
  float dMed = length(q - vec2(7.3, 0.)) - .72;
  d = min(d, abs(dMed) - .07);
  float sE = 2. * R_PI / uVar.x;
  float aE = abs(mod(ang + sE * .5, sE) - sE * .5);
  vec2 qe = r * vec2(cos(sE * .5 - aE), sin(sE * .5 - aE));
  d = min(d, rSeg(qe, vec2(1.3, 0.), vec2(4.2, 0.)) - .07);
  d = min(d, abs(r - 1.3) - .09);
  d = min(d, abs(r - 4.2) - .1);
  float alt = mod(sec + uVar.w, 2.);
  vec3 c;
  if (r < 1.3) c = mix(uRuby, uGold, smoothstep(.45, .6, r));
  else if (r < 4.2) { c = mod(floor(ang / sE + .5), 2.) < .5 ? uBlue : mix(uBlue, uRuby, .8); if (r < 1.9) c = uRuby; if (abs(r - 3.0) < .28 && aE < sE * .2) c = uGold; }
  else if (r < 5.15) c = mix(uGold, uRuby, step(.6, fract(ang * 36. / (2. * R_PI))) * .75);
  else if (q.x < 6.375 || dArch < 0.) {
    c = uBlue;
    if (dMed < 0.) c = alt < .5 ? uRuby : uGold;
    else if (dArch > -.32 && q.x > 6.375) c = mix(uRuby, uBlue, .15);
    else if (r < 5.75) c = uRuby;
  } else c = dOc < 0. ? uGold : (alt < .5 ? uRuby : mix(uRuby, uBlue, .35));
  if (detail > 0.) {
    vec3 v = rVoro(p * 2.4 + uVar.z);
    vec3 cd = c * (.45 + .9 * v.y);
    cd *= 1. + .34 * sin(uRoseT * (.55 + 1.5 * v.z) + v.y * 37.) + .16 * sin(uRoseT * .37 - r * .9);
    cd = mix(cd, cd.gbr * .6 + cd * .5, step(.9, v.z) * .35);
    cd = mix(cd, uGold, step(.965, v.z) * .8);
    cd *= smoothstep(.015, .05, v.x);
    c = mix(c * (.82 + .14 * sin(uRoseT * .37 - r * .9 + sec * 1.7)), cd, detail);
  }
  return c * smoothstep(0., max(soft, .02), d);
}
vec3 lancetGlass(vec2 p, float hw, float seed){
  // p.x in [-hw,hw], p.y from the sill upward
  float bx = hw - abs(p.x);
  float cell = 2.6; float k = floor(p.y / cell); vec2 m = vec2(p.x, mod(p.y, cell) - cell * .5);
  float dm = length(m) - hw * .72;
  float alt = mod(k + seed, 2.);
  vec3 c = alt < .5 ? uBlue : mix(uRuby, uBlue, .12);
  if (dm < 0.) c = alt < .5 ? uRuby : uBlue;
  if (abs(dm) < .09) c = uGold;
  if (length(m) < hw * .28) c = uGold;
  if (bx < .22) c = mod(floor(p.y / .45), 2.) < .5 ? uRuby : uGold;
  vec3 v = rVoro(p * 2.8 + seed * 13.7);
  c *= .5 + .95 * v.y;
  c *= 1. + .3 * sin(uRoseT * (.5 + 1.4 * v.z) + v.y * 31. + seed);
  c = mix(c, c.gbr * .6 + c * .5, step(.86, v.z) * .5);
  c *= smoothstep(.015, .05, v.x);
  c *= smoothstep(.0, .04, abs(bx - .22) ) * smoothstep(0., .05, abs(abs(dm) - .09));
  // horizontal saddle bars
  c *= smoothstep(.0, .03, abs(mod(p.y, 1.3) - .65) - .02);
  return c;
}
`;

// light arriving at a hero-local point from the rose (pattern sheared along the sun direction)
const GLSL_ROSE_LIGHT = /* glsl */`
uniform vec4 uSunS;           // xy: shear (Lx/Lz, Ly/Lz), z: intensity, w: cone length (z)
uniform vec4 uLan;            // lancets: count, spacing, half width, sill height
uniform float uLanSpring;
uniform vec2 uLanS;           // shear of the lancets' light (the true sun; the rose may use a lower one)
float gRoseSoft = 0.;
vec3 lancetLightAt(vec3 p){
  vec2 q = p.xy - uLanS * p.z;
  if (q.y < uLan.w || q.y > uLanSpring + 1.1 + uLan.z * 1.8) return vec3(0.);
  float h = (uLan.x - 1.) * .5;
  float i = clamp(floor(q.x / uLan.y + h + .5), 0., uLan.x - 1.);
  float cx = (i - h) * uLan.y, lx = q.x - cx;
  if (abs(lx) > uLan.z) return vec3(0.);
  float spring = uLanSpring + (1. - abs(i - h) / h) * 1.1, R = 2. * uLan.z, e = abs(lx) + uLan.z;
  if (q.y > spring + sqrt(max(R * R - e * e, 0.))) return vec3(0.);
  return lancetGlass(vec2(lx, q.y), uLan.z, floor(cx * .37 + 9.)) * uSunS.z * .8 * (1. - smoothstep(30., 44., p.z));
}
vec3 roseLightAt(vec3 p, float detail){
  if (p.z < .3 || p.z > uSunS.w) return vec3(0.);
  vec2 q = p.xy - uSunS.xy * p.z - vec2(0., ${ROSE_Y}.);
  float fade = 1. - smoothstep(uSunS.w * .72, uSunS.w, p.z);
  vec3 l = roseGlass(q, detail, .03 + p.z * .012 + gRoseSoft) * fade * uSunS.z;
  if (detail > .5 && p.z > 1.5) l += lancetLightAt(p);
  return l;
}
`;

// ---------------------------------------------------------------- geometry helpers
// merge a list of { g, col, amp } into one flat-shaded, vertex-coloured geometry (one pass, one noise call per vertex)
// (asks for a hand-back before each piece of the list and before the normals: await it)
async function bake(ctx, list, noise, scale = 0.35) {
  let total = 0;
  for (const it of list) total += it.g.index ? it.g.index.count : it.g.attributes.position.count;
  const P = new Float32Array(total * 3), C = new Float32Array(total * 3);
  let o = 0;
  for (const { g, col, amp } of list) {
    await ctx.yield?.();
    const pos = g.attributes.position.array, idx = g.index ? g.index.array : null, n = idx ? idx.length : pos.length / 3;
    for (let i = 0; i < n; i++, o += 3) {
      const v = (idx ? idx[i] : i) * 3, x = pos[v], y = pos[v + 1], z = pos[v + 2];
      const k = 1 + amp * 1.3 * noise.n3(x * scale, y * scale, z * scale);
      P[o] = x; P[o + 1] = y; P[o + 2] = z; C[o] = col.r * k; C[o + 1] = col.g * k; C[o + 2] = col.b * k;
    }
    g.dispose();
  }
  await ctx.yield?.();
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(P, 3));
  out.setAttribute('color', new THREE.BufferAttribute(C, 3));
  out.computeVertexNormals();
  return out;
}

// sweep a chamfered moulding along a 2D polyline lying in the wall plane; z0 = back, z1 = front face
function sweep(pts, closed, w, z0, z1, bev = 0.06) {
  const n = pts.length, prof = [[-w, z0], [-w, z1 - bev], [-w + bev, z1], [w - bev, z1], [w, z1 - bev], [w, z0]];
  const pos = [], idx = [], m = prof.length;
  for (let i = 0; i < n; i++) {
    const a = pts[closed ? (i - 1 + n) % n : Math.max(i - 1, 0)], b = pts[closed ? (i + 1) % n : Math.min(i + 1, n - 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    for (const [o, z] of prof) pos.push(pts[i][0] - ty * o, pts[i][1] + tx * o, z);
  }
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const i0 = i * m, i1 = ((i + 1) % n) * m;
    for (let j = 0; j < m; j++) { const j1 = (j + 1) % m; idx.push(i0 + j, i1 + j, i1 + j1, i0 + j, i1 + j1, i0 + j1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}
const arcPts = (cx, cy, r, a0, a1, n) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; };
const circlePts = (cx, cy, r, n) => arcPts(cx, cy, r, 0, Math.PI * 2 * (1 - 1 / n), n - 1);
function box(w, h, d, x, y, z, rz = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rz) g.rotateZ(rz);
  g.translate(x, y, z);
  return g;
}
// outline of a lancet (pointed arch) as [x,y] points, counter-clockwise
function lancetPts(cx, hw, y0, ySpring, n = 10) {
  const R = hw * 2.0, o = [[cx - hw, y0], [cx + hw, y0]];
  const aTop = Math.acos((R - hw) / R);
  for (let i = 0; i <= n; i++) { const a = aTop * (i / n); o.push([cx + hw - R + Math.cos(a) * R, ySpring + Math.sin(a) * R]); }
  for (let i = n - 1; i >= 0; i--) { const a = aTop * (i / n); o.push([cx - hw + R - Math.cos(a) * R, ySpring + Math.sin(a) * R]); }
  return o;
}

// patch a lit three.js material: masonry / chequer detail (mode 1 / 2, 0 = none) + the projected rose light
function patchMaterial(mat, U, mode) {
  if (mat.userData.rosePatched) return mat;
  mat.userData.rosePatched = true;
  // chain a material that already has its own shader patch (the interior kit's lit materials)
  const own = (k) => (Object.prototype.hasOwnProperty.call(mat, k) ? mat[k] : null);
  const prev = own('onBeforeCompile'), prevKey = own('customProgramCacheKey');
  mat.onBeforeCompile = (sh, renderer) => {
    if (prev) prev.call(mat, sh, renderer);
    for (const k of ['uBlue', 'uRuby', 'uGold', 'uVar', 'uRoseT', 'uSunS', 'uLan', 'uLanSpring', 'uRoseInv', 'uSunLW', 'uFloorTint', 'uAisle', 'uAisleC', 'uLanS', 'uRoseK']) sh.uniforms[k] = U[k];
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 uRoseInv; varying vec3 vRoseP; varying vec3 vRoseN;')
      .replace('#include <project_vertex>', `#include <project_vertex>
        { vec4 rwp = vec4(transformed, 1.);
        #ifdef USE_INSTANCING
          rwp = instanceMatrix * rwp;
        #endif
          vRoseP = (uRoseInv * modelMatrix * rwp).xyz; vRoseN = normalize(mat3(uRoseInv) * mat3(modelMatrix) * objectNormal); }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vRoseP; varying vec3 vRoseN; uniform vec3 uSunLW; uniform vec3 uFloorTint; uniform vec4 uAisle; uniform vec3 uAisleC; uniform vec2 uRoseK;
        ${GLSL_ROSE}
        ${GLSL_ROSE_LIGHT}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        ${mode === 1 ? `{
          vec3 P = vRoseP; float row = floor(P.y / .62); float u = (P.x + P.z * .7) / 1.35 + mod(row, 2.) * .5 + rHash(vec2(row, 3.)).x * .3;
          vec2 f = vec2(fract(u), fract(P.y / .62)); vec2 h = rHash(vec2(floor(u), row));
          float mortar = smoothstep(.0, .035, f.x) * smoothstep(1., .965, f.x) * smoothstep(.0, .06, f.y) * smoothstep(1., .94, f.y);
          diffuseColor.rgb *= (.82 + .3 * h.x) * mix(.6, 1., mortar);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(.8, .82, 1.05), h.y * .5);
        }` : ''}
        ${mode === 2 ? `{
          vec2 t = vRoseP.xz / 1.625; vec2 f = fract(t); float ch = mod(floor(t.x) + floor(t.y), 2.);
          vec2 h = rHash(floor(t));
          float vein = sin(t.x * 9. + sin(t.y * 7. + h.x * 6.) * 2.5 + h.y * 20.);
          vec3 tile = mix(uFloorTint * .16, vec3(1.), ch) * (.85 + .2 * h.x) * (1. - .12 * smoothstep(.6, 1., vein));
          float joint = smoothstep(.0, .012, f.x) * smoothstep(1., .988, f.x) * smoothstep(.0, .012, f.y) * smoothstep(1., .988, f.y);
          if (abs(vNormalY) > .7) diffuseColor.rgb *= tile * mix(.5, 1., joint);
        }` : ''}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec3 Lv = normalize((viewMatrix * vec4(uSunLW, 0.)).xyz);
          float nd0 = dot(normal, -Lv), ndl = max(nd0, 0.);
          ndl = mix(ndl, smoothstep(-.04, .22, nd0) * (.42 + .58 * ndl), uRoseK.y);      // grazed walls still take the pattern
          totalEmissiveRadiance += mix(diffuseColor.rgb, vec3(.55), .45) * roseLightAt(vRoseP, 1.) * ndl * 2.6 * uRoseK.x;
          // candle glow low on the outer aisle walls (the stands along them, one per bay), see setAisleGlow
          if (uAisle.w > 0.) {
            float az = cos(6.2831853 * (vRoseP.z - uAisle.z) / uAisle.y) * .5 + .5, ay = vRoseP.y - 4.5;
            totalEmissiveRadiance += diffuseColor.rgb * uAisleC * (uAisle.w * smoothstep(uAisle.x - 1.2, uAisle.x - .2, abs(vRoseP.x)) * (.3 + .7 * az * az) * exp(-ay * ay * (ay > 0. ? .012 : .05))
              * (.92 + .08 * sin(uRoseT * 6.3 + vRoseP.z * .4)));
          }
          // coloured spill of the glass on the stone around it (reveals, tracery flanks, wall face)
          vec2 rq = vRoseP.xy - vec2(0., ${ROSE_Y}.); float rr = length(rq);
          if (vRoseP.z < 3. && rr < 22.) {
            float flank = 1. - abs(vRoseN.z);
            vec3 near = roseGlass(rq + vRoseN.xy * .28, 0., .25);
            vec3 spillC = uBlue * .55 + uRuby * .5 + uGold * .28;
            float halo = exp(-max(rr - 9., 0.) * .28) * smoothstep(-1.4, .1, vRoseP.z) * (.35 + .65 * max(vRoseN.z, 0.));
            totalEmissiveRadiance += diffuseColor.rgb * (near * flank * 1.6 * step(vRoseP.z, 0.) * step(-.72, vRoseP.z) + spillC * halo * .34) * uSunS.z;
          } }`);
    if (mode === 2) {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vNormalY;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvNormalY = normal.y;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vNormalY;');
    }
  };
  mat.customProgramCacheKey = () => (prevKey ? prevKey.call(mat) + '|' : '') + 'glass-nave-' + mode;
  return mat;
}

// ---------------------------------------------------------------- glass + volume shaders
const GLASS_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec3 aInfo;           // x: kind (0 rose, 1 lancet), y: per-window seed, z: half width (lancet)
varying vec2 vP; varying vec3 vInfo; varying vec3 vView; varying vec3 vWN;
void main(){
  vP = position.xy; vInfo = aInfo;
  vec4 wp = modelMatrix * vec4(position, 1.);
  vView = wp.xyz - cameraPosition;
  vWN = normalize(mat3(modelMatrix) * vec3(0., 0., 1.));
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const GLASS_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_ROSE}
uniform vec3 uSunLW; uniform float uTime; uniform vec4 uSunS; uniform float uGlassGain;
varying vec2 vP; varying vec3 vInfo; varying vec3 vView; varying vec3 vWN;
void main(){
  float far = smoothstep(60., 150., length(vView));
  vec3 c = vInfo.x < .5 ? roseGlass(vP - vec2(0., ${ROSE_Y}.), 1. - .8 * far, .02 + .1 * far) : lancetGlass(vP - vec2(vInfo.y, 0.), vInfo.z, floor(vInfo.y * .37 + 9.));
  vec3 vd = normalize(vView);
  // the sun behind the glass: brighter where the eye lines up with it, and a slow breathing of the light
  float toSun = max(dot(vd, -uSunLW), 0.);
  float hot = 1. + .3 * pow(toSun, 10.);
  float breathe = .9 + .1 * sin(uTime * .23 + vP.x * .12 + vP.y * .07);
  float facing = dot(vd, vWN);              // > 0 when seen from outside (behind the wall)
  float gz = (.6 + .4 * uSunS.z) * uGlassGain;
  float goldK = smoothstep(.3, .55, min(c.r, c.g) / max(max(c.r, c.g), max(c.b, 1e-4)));      // gold panes are the only ones that bloom
  vec3 col = c * (.42 + .3 * dot(c, vec3(.3, .5, .2))) * (1. + 1.6 * goldK) * hot * breathe * gz;
  col += vec3(.0, .08, .5) * c.b * .12 * gz;
  // keep the glass deep after tone mapping; from far away push saturation (not brightness) so the wheel reads from the door
  col = max(mix(vec3(dot(col, vec3(.3, .5, .2))), col, 1.5 + 1.1 * far), 0.);
  col.g += .1 * col.b * (1. - goldK);                       // toward azure: pure blue turns violet under the tone map
  col *= 1. + .5 * far;
  if (facing > 0.) col = c * .05 + vec3(.012, .014, .02);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

const VOL_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
uniform mat4 uRoseInv;
varying vec3 vP; varying vec3 vCam;
void main(){
  vP = position;
  vCam = (uRoseInv * vec4(cameraPosition, 1.)).xyz;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const VOL_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
${GLSL_ROSE}
${GLSL_ROSE_LIGHT}
uniform float uTime; uniform vec3 uSunL; uniform vec3 uDais;   // uDais: half width, height, length
uniform float uVolGain, uVolReach, uClipX; uniform vec3 uOccMin, uOccMax;
varying vec3 vP; varying vec3 vCam;
float vHash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float vNoise(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(vHash(i), vHash(i + vec3(1,0,0)), f.x), mix(vHash(i + vec3(0,1,0)), vHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(vHash(i + vec3(0,0,1)), vHash(i + vec3(1,0,1)), f.x), mix(vHash(i + vec3(0,1,1)), vHash(i + vec3(1,1,1)), f.x), f.y), f.z); }
void main(){
  vec3 ro = vCam; vec3 rd = vP - vCam; float tmax = length(rd); rd /= tmax;
  if (ro.z < 0.) {                       // camera behind the wall: the wall hides whatever the ray meets beyond it
    if (rd.z <= 1e-4) discard;
    vec3 w = ro + rd * (-ro.z / rd.z);
    if (abs(w.x) < 13.2 && w.y < 40. + (13.2 - abs(w.x))) discard;
  }
  vec3 S = vec3(uSunS.xy, 0.);
  vec3 so = ro - S * ro.z - vec3(0., ${ROSE_Y}., 0.), sd = rd - S * rd.z;
  float a = dot(sd.xy, sd.xy), b = dot(so.xy, sd.xy), c = dot(so.xy, so.xy) - 9.3 * 9.3;
  float h = b * b - a * c; if (h < 0. || a < 1e-6) discard;
  h = sqrt(h); float t0 = (-b - h) / a, t1 = (-b + h) / a;
  if (abs(rd.z) > 1e-4) { float z0 = (.4 - ro.z) / rd.z, z1 = (uSunS.w - ro.z) / rd.z; t0 = max(t0, min(z0, z1)); t1 = min(t1, max(z0, z1)); }
  if (rd.y < -1e-4) t1 = min(t1, (0. - ro.y) / rd.y);
  t0 = max(t0, 0.); t1 = min(t1, tmax);
  {                                      // one solid box of the world (setOccluder) stops the ray: the cone is not depth-tested
    vec3 rs = vec3(rd.x < 0. ? -1. : 1., rd.y < 0. ? -1. : 1., rd.z < 0. ? -1. : 1.) / max(abs(rd), vec3(1e-5));
    vec3 ta = (uOccMin - ro) * rs, tb = (uOccMax - ro) * rs, tmn = min(ta, tb), tmx = max(ta, tb);
    float tn = max(max(tmn.x, tmn.y), tmn.z), tf = min(min(tmx.x, tmx.y), tmx.z);
    if (tf > max(tn, 0.)) t1 = min(t1, max(tn, 0.));
  }
  if (t1 <= t0) discard;
  const int N = 24;
  float dt = (t1 - t0) / float(N);
  float j = fract(sin(dot(gl_FragCoord.xy + fract(uTime * .7) * 61., vec2(12.9898, 78.233))) * 43758.5453);
  j = mix(j, fract(sin(dot(gl_FragCoord.yx + fract(uTime * .7 + .37) * 47., vec2(39.346, 11.135))) * 24634.6345), .5);
  gRoseSoft = dt * .22;
  vec3 acc = vec3(0.);
  for (int i = 0; i < N; i++) {
    vec3 p = ro + rd * (t0 + (float(i) + j) * dt);
    float fl = (abs(p.x) < uDais.x && p.z < uDais.z) ? uDais.y : 0.;
    if (p.y < fl || abs(p.x) > uClipX) continue;
    vec3 l = roseLightAt(p, 0.) * (1. - smoothstep(uVolReach * .5, uVolReach, p.z));
    float n = vNoise(p * .16 + vec3(uTime * .035, -uTime * .02, uTime * .015));
    n = .45 + 1.1 * n * n + .5 * vNoise(p * .55 + vec3(-uTime * .06, uTime * .05, 0.));
    acc += l * n;
  }
  float phase = .55 + 2.6 * pow(max(dot(rd, -uSunL), 0.), 5.);
  vec3 col = acc * dt * .05 * phase * uVolGain;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      col *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth * .5);
    #else
      col *= 1. - .7 * smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  gl_FragColor = vec4(col, 1.);
}`;

// ---------------------------------------------------------------- build
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('glass-nave-hero') : ctx.rng;
  const noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [stoneLt, stoneMd, stoneDk, shadowC, blueC, rubyC, goldC] = pal;
  const withDais = opts.dais !== false, withApron = opts.apron !== false;
  const daisH = withDais ? (opts.daisHeight ?? 2) : 0, daisL = opts.daisLength ?? 49.5, naveW = opts.naveWidth ?? 19.5;
  const gain = opts.intensity ?? 1;

  // per-seed variety
  const eyeN = rng.pick([6, 8, 12]);
  const rot = rng.pick([0, Math.PI / 12]);
  const nLancet = rng.pick([5, 5, 7]);
  const elevSun = THREE.MathUtils.degToRad(opts.sunElevation ?? 30);
  const elev = THREE.MathUtils.degToRad(opts.roseElevation ?? opts.sunElevation ?? 30);
  const azim = THREE.MathUtils.degToRad(opts.sunAzimuth ?? (9 + rng.range(-3, 3)));
  const hueJit = rng.range(-0.025, 0.025);
  const blue = blueC.clone().offsetHSL(hueJit, 0, 0), ruby = rubyC.clone().offsetHSL(hueJit * 0.6, 0, 0), gold = goldC.clone();

  const sunL = new THREE.Vector3(-Math.sin(azim) * Math.cos(elev), -Math.sin(elev), Math.cos(azim) * Math.cos(elev)).normalize();
  const coneZ = opts.coneLength ?? 68;
  const U = {
    uBlue: { value: blue }, uRuby: { value: ruby }, uGold: { value: gold },
    uVar: { value: new THREE.Vector4(eyeN, rot, rng.range(0, 50), rng.int(0, 1)) },
    uSunS: { value: new THREE.Vector4(sunL.x / sunL.z, sunL.y / sunL.z, gain, coneZ) },
    uSunL: { value: sunL.clone() }, uSunLW: { value: sunL.clone() },
    uRoseInv: { value: new THREE.Matrix4() }, uTime: { value: 0 }, uRoseT: { value: 0 },
    uFloorTint: { value: shadowC.clone().lerp(blueC, 0.12) },
    uDais: { value: new THREE.Vector3(naveW / 2, daisH, withDais ? daisL : 0) },
    uLan: { value: new THREE.Vector4(5, 3.9, 1.25, 8.2) }, uLanSpring: { value: 15.2 }, uVolGain: { value: 1 }, uVolReach: { value: coneZ }, uGlassGain: { value: 1 },
    uAisle: { value: new THREE.Vector4(1e6, 16.5, 0, 0) }, uAisleC: { value: new THREE.Color('#ffb878') },
    uLanS: { value: new THREE.Vector2(-Math.tan(azim), -Math.tan(elevSun) / Math.cos(azim)) }, uRoseK: { value: new THREE.Vector2(1, 0) },
    uClipX: { value: opts.clipX ?? 1e6 }, uOccMin: { value: new THREE.Vector3(1e5, 1e5, 1e5) }, uOccMax: { value: new THREE.Vector3(1e5 + 1, 1e5 + 1, 1e5 + 1) }, uCamL: { value: new THREE.Vector3(0, 0, 1e4) }, uLens: { value: 0 },
  };

  const root = new THREE.Group(); root.name = 'glass-nave-hero';
  const stone = [];                       // geometries for the masonry draw
  const carved = [];                      // tracery and mouldings (smooth stone, no block pattern)
  const add = (list, g, col, amp = 0.1) => list.push({ g, col, amp });
  const wallCol = stoneMd.clone().lerp(stoneDk, 0.25), trimCol = stoneLt.clone().lerp(stoneMd, 0.35);

  // ---- the wall with its openings
  const HW = 13, EAVE = 40, APEX = 53, TH = 1.6;
  const shape = new THREE.Shape([[-HW, 0], [HW, 0], [HW, EAVE], [0, APEX], [-HW, EAVE]].map((p) => new THREE.Vector2(p[0], p[1])));
  const holeR = ROSE_R + 0.45;
  shape.holes.push(new THREE.Path(circlePts(0, ROSE_Y, holeR, 96).reverse().map((p) => new THREE.Vector2(p[0], p[1]))));
  const lSpan = nLancet === 5 ? 3.9 : 2.95, lHW = nLancet === 5 ? 1.25 : 0.95, lSill = 8.2, lSpring = 15.2;
  const lancets = [];
  U.uLan.value.set(nLancet, lSpan, lHW, lSill); U.uLanSpring.value = lSpring;
  for (let i = 0; i < nLancet; i++) {
    const cx = (i - (nLancet - 1) / 2) * lSpan, mid = 1 - Math.abs(i - (nLancet - 1) / 2) / ((nLancet - 1) / 2);
    const spring = lSpring + mid * 1.1;
    const pts = lancetPts(cx, lHW, lSill, spring);
    lancets.push({ cx, spring, pts, top: spring + Math.sqrt(4 * lHW * lHW - lHW * lHW) });
    shape.holes.push(new THREE.Path(pts.slice().reverse().map((p) => new THREE.Vector2(p[0], p[1]))));
  }
  const wallGeo = new THREE.ExtrudeGeometry(shape, { depth: TH, bevelEnabled: false, curveSegments: 4 });
  wallGeo.translate(0, 0, -TH);
  add(stone, wallGeo, wallCol, 0.2);
  await ctx.yield?.();

  // ---- tracery of the rose (built in the unrotated frame, then turned by -rot)
  const tr = [];
  const Z0 = -1.15, Z1 = -0.22;
  const rotPt = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  tr.push(sweep(circlePts(0, 0, 5.15, 96), true, 0.24, Z0, Z1 + 0.1, 0.09));
  tr.push(sweep(circlePts(0, 0, 9.24, 128), true, 0.26, Z0, Z1 + 0.1, 0.1));
  const thA = Math.atan2(0.729, 2.325);
  for (let k = 0; k < 12; k++) {
    await ctx.yield?.();
    const phi = k * Math.PI / 6, sp = phi + Math.PI / 12;
    const e = [Math.cos(sp), Math.sin(sp)];
    tr.push(sweep([[e[0] * 5.3, e[1] * 5.3], [e[0] * 6.6, e[1] * 6.6]], false, 0.14, Z0, Z1, 0.07));
    tr.push(box(0.34, 0.5, 1.0, e[0] * 6.62, e[1] * 6.62, (Z0 + Z1) / 2 + 0.03, sp));   // capital
    tr.push(box(0.2, 0.42, 0.98, e[0] * 5.5, e[1] * 5.5, (Z0 + Z1) / 2 + 0.02, sp));    // base
    for (const sgn of [1, -1]) {
      const arc = arcPts(6.375, -0.729, 2.437, thA, Math.PI / 2, 12).map((p) => rotPt([p[0], p[1] * sgn], phi));
      tr.push(sweep(arc, false, 0.125, Z0, Z1, 0.06));
    }
    tr.push(sweep(circlePts(7.3, 0, 0.72, 20).map((p) => rotPt(p, phi)), true, 0.075, Z0 + 0.2, Z1 - 0.08, 0.035));
    tr.push(sweep(circlePts(8.2 * Math.cos(Math.PI / 12), 8.2 * Math.sin(Math.PI / 12), 0.6, 18).map((p) => rotPt(p, phi)), true, 0.085, Z0 + 0.1, Z1 - 0.04, 0.04));
  }
  tr.push(sweep(circlePts(0, 0, 1.3, 40), true, 0.1, Z0 + 0.2, Z1 - 0.05, 0.05));
  tr.push(sweep(circlePts(0, 0, 4.2, 72), true, 0.11, Z0 + 0.2, Z1 - 0.05, 0.05));
  for (let k = 0; k < eyeN; k++) {
    const a = (k + 0.5) * Math.PI * 2 / eyeN, e = [Math.cos(a), Math.sin(a)];
    tr.push(sweep([[e[0] * 1.35, e[1] * 1.35], [e[0] * 4.15, e[1] * 4.15]], false, 0.075, Z0 + 0.2, Z1 - 0.08, 0.035));
  }
  for (const g of tr) { g.rotateZ(-rot); g.translate(0, ROSE_Y, 0); add(carved, g, trimCol, 0.1); }
  // mouldings round the rose on the wall face
  for (const [r, w, z1] of [[holeR + 0.22, 0.3, 0.38], [holeR + 0.78, 0.13, 0.2], [holeR - 0.02, 0.1, 0.12]]) {
    const g = sweep(circlePts(0, ROSE_Y, r, 128), true, w, -0.3, z1, w * 0.4); add(carved, g, trimCol, 0.1);
  }
  // lancet mouldings + sill + string courses
  for (const l of lancets) {
    add(carved, sweep(l.pts, true, 0.13, -0.5, 0.2, 0.06), trimCol, 0.1);
    add(carved, box(lHW * 2 + 0.7, 0.3, 0.6, l.cx, lSill - 0.2, 0.1), trimCol, 0.1);
  }
  for (const y of [6.6, 19.6, EAVE]) add(carved, box(HW * 2, 0.34, 0.5, 0, y, 0.12), trimCol, 0.1);
  await ctx.yield?.();

  // ---- wall arch, piers, spandrel roundels, blind arcade, exterior buttresses and pinnacles
  const cyl = (rt, rb, h, seg, x, y, z) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1); g.translate(x, y, z); return g; };
  {
    const SPR = 36, AX = 10.9, AR = 13.2, aTop = Math.acos((AR - AX) / AR);
    const archPts = (dr) => {
      const o = [], n = 22;
      for (let i = 0; i <= n; i++) { const a = aTop * i / n; o.push([AX - AR + Math.cos(a) * (AR + dr), SPR + Math.sin(a) * (AR + dr)]); }
      for (let i = n - 1; i >= 0; i--) { const a = aTop * i / n; o.push([-(AX - AR) - Math.cos(a) * (AR + dr), SPR + Math.sin(a) * (AR + dr)]); }
      return o;
    };
    add(carved, sweep(archPts(0), false, 0.38, 0, 0.78, 0.14), trimCol, 0.1);
    add(carved, sweep(archPts(-0.62), false, 0.2, 0, 0.44, 0.08), trimCol, 0.1);
    add(carved, sweep(archPts(0.62), false, 0.15, 0, 0.3, 0.06), trimCol, 0.1);
    for (const sx of [-1, 1]) {
      const x = sx * (AX + 0.25);
      add(stone, box(2.0, SPR, 1.1, x, SPR / 2, 0.55), wallCol, 0.2);
      for (const [ox, oz, r] of [[-0.78, 1.12, 0.22], [0, 1.36, 0.3], [0.78, 1.12, 0.22]]) {
        add(carved, cyl(r, r, SPR - 1.6, 10, x + ox, (SPR - 1.6) / 2 + 0.8, oz), trimCol, 0.1);
        add(carved, cyl(r * 1.15, r * 1.75, 0.9, 10, x + ox, 0.45, oz), trimCol, 0.1);
        add(carved, cyl(r * 1.9, r * 1.05, 0.95, 10, x + ox, SPR - 0.62, oz), trimCol, 0.1);
        for (const yy of [12.4, 19.6, 27.5]) add(carved, cyl(r * 1.35, r * 1.35, 0.22, 10, x + ox, yy, oz), trimCol, 0.1);
      }
      add(carved, box(2.5, 0.3, 2.0, x, SPR - 0.02, 0.9), trimCol, 0.1);
      // spandrel roundel with a quatrefoil
      const rx = sx * 7.4, ry = 41.3;
      add(carved, sweep(circlePts(rx, ry, 1.28, 36), true, 0.17, 0, 0.3, 0.07), trimCol, 0.1);
      for (let k = 0; k < 4; k++) add(carved, sweep(circlePts(rx + Math.cos(k * Math.PI / 2 + Math.PI / 4) * 0.52, ry + Math.sin(k * Math.PI / 2 + Math.PI / 4) * 0.52, 0.46, 16), true, 0.07, 0, 0.17, 0.03), trimCol, 0.1);
      // exterior: stepped buttress and pinnacle
      const bxx = sx * 11.9;
      add(stone, box(2.5, 25, 3.4, bxx, 12.5, -TH - 1.7), wallCol, 0.2);
      add(stone, box(2.3, 9, 2.4, bxx, 29.5, -TH - 1.2), wallCol, 0.2);
      add(stone, box(2.0, 6.5, 1.5, bxx, 37.2, -TH - 0.75), wallCol, 0.2);
      add(stone, box(1.7, 3.6, 1.7, bxx, 41.8, -TH / 2), wallCol, 0.2);
      const pin = new THREE.ConeGeometry(1.25, 7.5, 4, 1); pin.rotateY(Math.PI / 4); pin.translate(bxx, 47.3, -TH / 2); add(carved, pin, trimCol, 0.12);
      add(carved, box(2.0, 0.3, 2.0, bxx, 43.6, -TH / 2), trimCol, 0.1);
    }
    // gable roundel, coping and finial
    add(carved, sweep(circlePts(0, 45.6, 1.5, 36), true, 0.16, -0.1, 0.26, 0.07), trimCol, 0.1);
    for (let k = 0; k < 3; k++) add(carved, sweep(circlePts(Math.cos(k * 2.094 + 1.571) * 0.6, 45.6 + Math.sin(k * 2.094 + 1.571) * 0.6, 0.55, 18), true, 0.07, 0, 0.16, 0.03), trimCol, 0.1);
    add(carved, sweep([[-HW - 0.2, EAVE - 0.2], [0, APEX + 0.25], [HW + 0.2, EAVE - 0.2]], false, 0.32, -TH - 0.2, 0.22, 0.1), trimCol, 0.1);
    add(carved, box(0.34, 3.4, 0.34, 0, APEX + 1.7, -TH / 2), trimCol, 0.1);
    add(carved, box(1.7, 0.34, 0.34, 0, APEX + 2.3, -TH / 2), trimCol, 0.1);
    // blind arcade along the foot of the wall (the reredos covers the middle)
    const aY = daisH + 0.4;
    for (let i = -5; i <= 5; i++) {
      const cx = i * 1.9; if (Math.abs(cx) < 4.2) continue;
      add(carved, sweep(lancetPts(cx, 0.72, aY, aY + 2.7, 6), true, 0.09, 0, 0.17, 0.04), trimCol, 0.1);
    }
  }
  await ctx.yield?.();

  // ---- glass (one draw): rose quad + lancet quads, set back in the wall
  const gl = [];
  const quad = (x0, y0, x1, y1, z, info) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([x0, y0, z, x1, y0, z, x1, y1, z, x0, y0, z, x1, y1, z, x0, y1, z], 3));
    g.setAttribute('aInfo', new THREE.Float32BufferAttribute(new Array(6).fill(info).flat(), 3));
    return g;
  };
  gl.push(quad(-holeR, ROSE_Y - holeR, holeR, ROSE_Y + holeR, -0.72, [0, 0, 0]));
  for (const l of lancets) gl.push(quad(l.cx - lHW, lSill, l.cx + lHW, l.top + 0.1, -0.8, [1, l.cx, lHW]));
  const glassMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG,
    fog: true, side: THREE.DoubleSide,
  });
  Object.assign(glassMat.uniforms, U);
  const glass = new THREE.Mesh(mergeGeometries(gl), glassMat); glass.name = 'rose-glass';
  root.add(glass);

  // ---- choir floor (dais), steps, apron
  const floor = [];
  if (withDais) {
    { const g = new THREE.BoxGeometry(naveW, daisH, daisL, 4, 1, 10); g.translate(0, daisH / 2, daisL / 2); add(floor, g, opts.daisColor ? new THREE.Color(opts.daisColor) : stoneLt, 0.05); }
    const nSt = Math.max(2, Math.round(daisH / 0.4));
    for (let i = 0; i < nSt; i++) { const h = daisH - (daisH / nSt) * (i + 1); if (h > 0.01) add(floor, box(naveW, h, 0.7, 0, h / 2, daisL + 0.35 + i * 0.7), stoneLt, 0.05); }
  }
  if (withApron) {
    const z0 = withDais ? daisL : 0, z1 = coneZ + 12, g = new THREE.PlaneGeometry(naveW + 14, z1 - z0);
    g.rotateX(-Math.PI / 2); g.translate(0, 0.03, (z0 + z1) / 2); add(floor, g, stoneLt, 0.05);
  }

  // ---- altar, reredos, candles, lilies
  const gilt = [], flames = [];           // flames: [x, y, z, size]
  const aBase = daisH + 0.75, altarTop = aBase + 1.34;
  const goldAlb = goldC.clone().multiplyScalar(0.62), waxCol = new THREE.Color(0.7, 0.62, 0.46), clothCol = new THREE.Color(0.72, 0.7, 0.66);
  const candle = (x, y, z, h, r = 0.05) => { add(carved, cyl(r * 0.85, r, h, 6, x, y + h / 2, z), waxCol, 0.04); flames.push([x, y + h + 0.11, z, 0.2 + r * 1.6]); };
  {
    for (let i = 0; i < 3; i++) { const d = 6.2 - i * 0.95; add(carved, box(9.4 - i * 1.3, 0.25, d, 0, daisH + 0.125 + i * 0.25, d / 2), trimCol, 0.08); }
    add(carved, box(4.5, 1.14, 1.5, 0, aBase + 0.57, 2.6), stoneMd, 0.1);
    add(carved, box(4.9, 0.16, 1.86, 0, aBase + 1.22, 2.6), trimCol, 0.06);
    add(carved, box(5.0, 0.05, 1.94, 0, aBase + 1.32, 2.6), clothCol, 0.03);
    add(carved, box(5.0, 0.5, 0.04, 0, aBase + 1.08, 3.58), clothCol, 0.03);
    add(gilt, box(3.9, 0.74, 0.05, 0, aBase + 0.5, 3.37), goldAlb, 0.1);
    for (let k = -2; k <= 2; k++) add(gilt, sweep(circlePts(k * 0.76, aBase + 0.5, 0.26, 14), true, 0.035, 3.36, 3.44, 0.015), goldAlb, 0.1);
    // reredos: three gilded gabled panels
    for (const i of [-1, 0, 1]) {
      const w = i === 0 ? 2.5 : 2.0, h = i === 0 ? 5.6 : 4.3, cx = i * 2.32, y0 = aBase + 0.2;
      add(carved, box(w, h, 0.5, cx, y0 + h / 2, 0.45), stoneDk.clone().lerp(shadowC, 0.3), 0.1);
      add(carved, box(w - 0.5, h - 2.0, 0.06, cx, y0 + 0.4 + (h - 2.0) / 2, 0.71), (i === 0 ? rubyC : blueC).clone().multiplyScalar(0.45), 0.25);
      add(gilt, sweep(lancetPts(cx, w / 2 - 0.2, y0 + 0.35, y0 + h - 1.75, 7), true, 0.085, 0.7, 0.84, 0.035), goldAlb, 0.1);
      add(gilt, sweep(circlePts(cx, y0 + h * 0.52, w * 0.2, 16), true, 0.05, 0.72, 0.8, 0.02), goldAlb, 0.1);
      const sp = new THREE.ConeGeometry(w * 0.36, 2.3, 4, 1); sp.rotateY(Math.PI / 4); sp.scale(1, 1, 0.35); sp.translate(cx, y0 + h + 1.1, 0.45); add(gilt, sp, goldAlb, 0.1);
      add(gilt, box(w + 0.16, 0.14, 0.62, cx, y0 + h, 0.45), goldAlb, 0.1);
    }
    add(gilt, box(7.4, 0.2, 0.7, 0, aBase + 0.2, 0.45), goldAlb, 0.1);
    await ctx.yield?.();
    // six altar candles, two seven-branch stands, prickets along the choir edges
    for (const k of [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]) {
      const x = k * 0.82, h = 0.75 + (2.5 - Math.abs(k)) * 0.13;
      add(gilt, cyl(0.045, 0.13, 0.4, 6, x, altarTop + 0.2, 2.15), goldAlb, 0.1); candle(x, altarTop + 0.4, 2.15, h, 0.045);
    }
    for (const sx of [-1, 1]) {
      const x = sx * 5.6, z = 3.6, y0 = daisH;
      add(gilt, cyl(0.07, 0.1, 2.2, 6, x, y0 + 1.1, z), goldAlb, 0.1); add(gilt, cyl(0.12, 0.42, 0.3, 8, x, y0 + 0.15, z), goldAlb, 0.1);
      const arm = []; for (let j = 0; j <= 12; j++) { const a = Math.PI * (j / 12); arm.push([x - Math.cos(a) * 1.1, y0 + 2.2 - Math.sin(a) * 0.55]); }
      add(gilt, sweep(arm, false, 0.035, z - 0.035, z + 0.035, 0.012), goldAlb, 0.1);
      for (let j = -3; j <= 3; j++) { const cx = x + j * 0.366, cy = y0 + 2.2 - Math.sqrt(Math.max(0, 1 - (j / 3) ** 2)) * 0.55 * (j === 0 ? 0 : 1) * 0 ; candle(cx, cy, z, 0.42 + rng.range(-0.08, 0.08), 0.035); }
    }
    if (withDais) for (const sx of [-1, 1]) for (let z = 8; z < daisL - 2; z += 5.5) {
      await ctx.yield?.();
      const x = sx * (naveW / 2 - 1.0);
      add(gilt, cyl(0.04, 0.06, 1.5, 5, x, daisH + 0.75, z), goldAlb, 0.1); add(gilt, cyl(0.07, 0.3, 0.2, 6, x, daisH + 0.1, z), goldAlb, 0.1);
      add(gilt, box(0.05, 0.05, 0.9, x, daisH + 1.5, z), goldAlb, 0.1);
      for (const dz of [-0.42, 0, 0.42]) candle(x, daisH + 1.52, z + dz, 0.3 + rng.range(0, 0.25), 0.035);
    }
    // lilies in two tall vases
    const leafCol = new THREE.Color(0.1, 0.2, 0.07), petalCol = new THREE.Color(0.8, 0.78, 0.7);
    for (const sx of [-1, 1]) {
      const vx = sx * 3.55, vz = 4.7, vy = daisH + 0.5;
      const prof = [[0.02, 0], [0.3, 0.02], [0.36, 0.3], [0.2, 0.75], [0.16, 0.95], [0.26, 1.1]].map((p) => new THREE.Vector2(p[0], p[1]));
      const vase = new THREE.LatheGeometry(prof, 10); vase.translate(vx, vy, vz); add(gilt, vase, goldAlb, 0.1);
      const tri = [], st = [];
      for (let i = 0; i < 11; i++) {
        const a = rng.range(0, Math.PI * 2), lean = rng.range(0.1, 0.55), len = rng.range(1.0, 2.0);
        const tip = new THREE.Vector3(vx + Math.cos(a) * lean * len, vy + 1.1 + len * Math.cos(lean), vz + Math.sin(a) * lean * len);
        const b0 = new THREE.Vector3(vx, vy + 1.0, vz);
        st.push(b0.x - 0.02, b0.y, b0.z, b0.x + 0.02, b0.y, b0.z, tip.x, tip.y, tip.z, b0.x, b0.y, b0.z - 0.02, b0.x, b0.y, b0.z + 0.02, tip.x, tip.y, tip.z);
        const ax = tip.clone().sub(b0).normalize(), s1 = new THREE.Vector3(1, 0, 0).cross(ax).normalize(), s2 = ax.clone().cross(s1);
        for (let k = 0; k < 6; k++) {
          const pa = k * Math.PI / 3 + i, rad = s1.clone().multiplyScalar(Math.cos(pa)).addScaledVector(s2, Math.sin(pa));
          const side = ax.clone().cross(rad).multiplyScalar(0.085);
          const mid = tip.clone().addScaledVector(ax, 0.22).addScaledVector(rad, 0.1), end = tip.clone().addScaledVector(ax, 0.34).addScaledVector(rad, 0.3);
          for (const sgn of [1, -1]) {
            const m = mid.clone().addScaledVector(side, sgn);
            tri.push(tip.x, tip.y, tip.z, m.x, m.y, m.z, mid.x, mid.y, mid.z, mid.x, mid.y, mid.z, m.x, m.y, m.z, end.x, end.y, end.z);
          }
        }
      }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(tri, 3)); add(carved, pg, petalCol, 0.05);
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(st, 3)); add(carved, sg, leafCol, 0.1);
    }
  }
  const baseMat = (k, make) => (opts.materials && opts.materials[k]) || make();
  const giltMat = patchMaterial(baseMat('gilt', () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.35, side: THREE.DoubleSide,
    emissive: goldC.clone().multiplyScalar(0.05) })), U, 0);
  const giltMesh = new THREE.Mesh(await bake(ctx, gilt, noise), giltMat); giltMesh.name = 'gilt'; root.add(giltMesh);
  let altarLight = null;
  if (opts.light !== false) {
    altarLight = new THREE.PointLight(new THREE.Color('#ffb060'), 260, 34, 2); altarLight.position.set(0, altarTop + 2.2, 5.2); root.add(altarLight);
  }
  await ctx.yield?.();

  // ---- candle flames + dust motes in the cone: camera-facing instanced quads (2 draws)
  const spriteGeo = (n, fill) => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    const a = new Float32Array(n * 4), b = new Float32Array(n);
    for (let i = 0; i < n; i++) fill(i, a, b);
    g.setAttribute('aPos', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(b, 1));
    g.instanceCount = n; return g;
  };
  const flameMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 aPos; attribute float aSeed; uniform float uTime; varying vec2 vUv; varying float vF;
      void main(){
        vUv = position.xy;
        float fl = sin(uTime * 9. + aSeed * 40.) * .5 + sin(uTime * 14.3 + aSeed * 71.) * .3;
        vF = .85 + .15 * fl;
        vec4 mvPosition = modelViewMatrix * vec4(aPos.xyz, 1.);
        vec2 o = position.xy * aPos.w * vec2(1.6, 2.2) + vec2(0., aPos.w * 1.1);
        o.x += (position.y + 1.) * aPos.w * .16 * sin(uTime * 5. + aSeed * 30.);
        mvPosition.xy += o;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      varying vec2 vUv; varying float vF;
      void main(){
        vec2 p = vUv; p.y = p.y * 1.0 + .45;
        float tear = length(vec2(p.x * (2.6 + 2.2 * smoothstep(-.6, .8, p.y)), p.y * 1.25));
        float core = smoothstep(.62, .2, tear);
        float halo = exp(-dot(vUv, vUv) * 4.5) * .22;
        vec3 col = (vec3(1., .62, .2) * 5.5 * core + vec3(1., .9, .6) * 3. * smoothstep(.3, .0, tear) + vec3(1., .5, .16) * halo) * vF;
        gl_FragColor = vec4(col, 1.);
        #ifdef USE_FOG
          gl_FragColor.rgb *= 1. - .6 * smoothstep(0., 1., 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth));
        #endif
      }`,
  });
  Object.assign(flameMat.uniforms, { uTime: U.uTime });
  const flameMesh = new THREE.Mesh(spriteGeo(flames.length, (i, a, b) => { a.set(flames[i], i * 4); b[i] = rng(); }), flameMat);
  flameMesh.name = 'candle-flames'; flameMesh.frustumCulled = false; flameMesh.renderOrder = 7; root.add(flameMesh);

  const N_DUST = 900;
  const dustMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      ${GLSL_ROSE}
      attribute vec4 aPos; attribute float aSeed; uniform float uTime; uniform vec4 uSunS; uniform vec3 uDais;
      varying vec2 vUv; varying vec3 vCol;
      void main(){
        vUv = position.xy;
        float t = uTime * (.25 + aSeed * .5);
        float z = mod(aPos.z + t * .35, uSunS.w * .9) + .6;
        vec2 q = aPos.xy + vec2(sin(t * .31 + aSeed * 50.), cos(t * .27 + aSeed * 31.)) * .9;
        vec3 p = vec3(q + uSunS.xy * z + vec2(0., ${ROSE_Y}.), z);
        p.y += sin(t * .5 + aSeed * 90.) * .5;
        vec2 qq = p.xy - uSunS.xy * p.z - vec2(0., ${ROSE_Y}.);
        float fl = (abs(p.x) < uDais.x && p.z < uDais.z) ? uDais.y : 0.;
        float tw = .35 + .65 * pow(.5 + .5 * sin(uTime * (1.5 + aSeed * 3.) + aSeed * 200.), 3.);
        vCol = roseGlass(qq, 0., .3) * tw * uSunS.z * (1. - smoothstep(uSunS.w * .6, uSunS.w * .9, z)) * step(fl + .1, p.y);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        mvPosition.xy += position.xy * aPos.w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      varying vec2 vUv; varying vec3 vCol;
      void main(){
        float d = dot(vUv, vUv); if (d > 1.) discard;
        gl_FragColor = vec4((vCol * 2.2 + dot(vCol, vec3(.5))) * exp(-d * 3.5) * 1.6, 1.);
      }`,
  });
  Object.assign(dustMat.uniforms, U);
  const dustMesh = new THREE.Mesh(spriteGeo(N_DUST, (i, a, b) => {
    const r = Math.sqrt(rng()) * 8.8, an = rng() * Math.PI * 2;
    a[i * 4] = Math.cos(an) * r; a[i * 4 + 1] = Math.sin(an) * r; a[i * 4 + 2] = rng() * coneZ; a[i * 4 + 3] = 0.035 + rng() * rng() * 0.09; b[i] = rng();
  }), dustMat);
  dustMesh.name = 'cone-dust'; dustMesh.frustumCulled = false; dustMesh.renderOrder = 7; root.add(dustMesh);

  // ---- materials + meshes
  const stoneMat = patchMaterial(baseMat('stone', () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, side: THREE.DoubleSide })), U, 1);
  const carvedMat = patchMaterial(baseMat('carved', () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0, side: THREE.DoubleSide })), U, 0);
  const floorMat = opts.materials && opts.materials.floor ? patchMaterial(opts.materials.floor, U, 0) : patchMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0 }), U, 2);
  const wallMesh = new THREE.Mesh(await bake(ctx, stone, noise), stoneMat); wallMesh.name = 'east-wall'; root.add(wallMesh);
  const carvedMesh = new THREE.Mesh(await bake(ctx, carved, noise), carvedMat); carvedMesh.name = 'tracery'; root.add(carvedMesh);
  if (floor.length) { const m = new THREE.Mesh(await bake(ctx, floor, noise), floorMat); m.name = 'choir-floor'; root.add(m); }
  await ctx.yield?.();

  // ---- the cone of coloured light (ray-marched inside a box, additive)
  const xFar = U.uSunS.value.x * coneZ;
  const vg = new THREE.BoxGeometry(1, 1, 1);
  const bx0 = Math.min(-10, xFar - 10), bx1 = Math.max(10, xFar + 10);
  vg.scale(bx1 - bx0, 41, coneZ); vg.translate((bx0 + bx1) / 2, 20.5, coneZ / 2 + 0.3);
  const volMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), vertexShader: VOL_VERT, fragmentShader: VOL_FRAG,
    fog: true, side: THREE.BackSide, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  });
  Object.assign(volMat.uniforms, U);
  const vol = new THREE.Mesh(vg, volMat); vol.name = 'rose-cone'; vol.frustumCulled = false; vol.renderOrder = 6; root.add(vol);

  // ---- the lens wash: the colours of the pattern at the camera's own place in the cone, laid over the frame (additive, one quad)
  const lensGeo = new THREE.BufferGeometry();
  lensGeo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  const lensMat = new THREE.ShaderMaterial({
    uniforms: {}, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: /* glsl */`
      varying vec2 vS;
      void main(){ vS = position.xy; gl_Position = vec4(position.xy, 0., 1.); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uBlue, uRuby, uGold; uniform vec4 uVar;
      uniform vec4 uSunS; uniform vec3 uCamL; uniform float uLens, uTime;
      varying vec2 vS;
      void main(){
        // where the camera stands in the pattern, plus a few metres of it spread across the lens, so it slides as the camera moves
        vec2 q = uCamL.xy - uSunS.xy * uCamL.z - vec2(0., ${ROSE_Y}.);
        q += vS * vec2(3.6, 2.2) + .5 * vec2(sin(uTime * .37 + vS.y * 2.), cos(uTime * .31 + vS.x * 1.6));
        q += vec2(1.3e-4, .7e-4);
        // a smooth reading of the rose (petals blue and ruby by turns, the gold ring, the eye): the leaded pattern itself
        // would cross the lens as hard-edged patches
        float r = length(q), a = atan(q.y, q.x) + uVar.y;
        vec3 c = mix(uBlue, uRuby, smoothstep(.25, .75, .5 + .5 * sin(a * 12.)));
        c = mix(mix(uRuby, uBlue, smoothstep(.3, .7, .5 + .5 * sin(a * uVar.x + r * .8))), c, smoothstep(3.6, 5.6, r));
        float g = r - 5.; c = mix(c, uGold, .85 * exp(-g * g * .45));
        c = mix(c, uGold, .5 * exp(-r * r * .25));
        c *= 1. - smoothstep(7.5, 11., r);
        float rim = .1 + .9 * smoothstep(.3, 1.15, length(vS * vec2(1., .82)));       // keep the middle of the frame clear
        float zf = smoothstep(4., 16., uCamL.z) * (1. - smoothstep(uSunS.w * .7, uSunS.w, uCamL.z));
        gl_FragColor = vec4(c * (.22 * uLens * rim * zf * uSunS.z), 1.);
      }`,
  });
  Object.assign(lensMat.uniforms, U);
  const lens = new THREE.Mesh(lensGeo, lensMat); lens.name = 'rose-lens'; lens.frustumCulled = false; lens.renderOrder = 9; root.add(lens);

  // ---- anchors
  const axisAt = (y) => { const t = (ROSE_Y - y) / -sunL.y; return new THREE.Vector3(sunL.x * t, y, sunL.z * t); };
  const anchors = {
    portalSeat: { position: new THREE.Vector3(0, ROSE_Y, 0.9), normal: new THREE.Vector3(0, 0, 1), radius: 5 },
    roseCenter: new THREE.Vector3(0, ROSE_Y, 0), roseRadius: ROSE_R, eyeRadius: 5,
    flyThrough: [[0, 6, 125], [0, 13, 100], [0, 23, 78], [0, 30, 60], [0, 30, 30], [0, 30, 0.9]].map((p) => new THREE.Vector3(...p)),
    coneAxis: { origin: new THREE.Vector3(0, ROSE_Y, 0), dir: sunL.clone(), length: coneZ / sunL.z },
    coneEntry: axisAt(20), discCenter: axisAt(daisH),
    altar: new THREE.Vector3(0, altarTop, 2.6),
    viewpoints: [new THREE.Vector3(0, 6, 120), new THREE.Vector3(6, 12, 62), new THREE.Vector3(-3, 22, 26), new THREE.Vector3(0, 30, 40)],
  };

  // ---- animation state
  let progress = -1;
  const inv = new THREE.Matrix4(), camL = new THREE.Vector3();
  const hero = {
    object: root, radius: 26, height: APEX, center: new THREE.Vector3(0, 23, 6), anchors,
    ground: true, groundY: 0, uniforms: U,
    setProgress(u) { progress = u; },
    setConeGain(g) { U.uVolGain.value = g; },
    setConeReach(z) { U.uVolReach.value = Math.min(coneZ, Math.max(8, z)); },
    setGlassGain(g) { U.uGlassGain.value = g; },
    setAisleGlow(o = {}) { U.uAisle.value.set(o.x ?? 1e6, o.bay ?? 16.5, o.z ?? 0, o.strength ?? 0); if (o.color) U.uAisleC.value.set(o.color); },
    setSurfaceLight(k, graze = 0) { U.uRoseK.value.set(k, graze); },
    setLens(k) { U.uLens.value = k; },
    setOccluder(min, max) { U.uOccMin.value.set(min[0], min[1], min[2]); U.uOccMax.value.set(max[0], max[1], max[2]); },
    coneOffset(camera) {
      camL.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv);
      return Math.hypot(camL.x - U.uSunS.value.x * camL.z, camL.y - U.uSunS.value.y * camL.z - ROSE_Y);
    },
    applyRoseLight(mat) { return patchMaterial(mat, U, 0); },
    update(dt, time, camera) {
      U.uTime.value = time; U.uRoseT.value = time;
      root.updateWorldMatrix(true, false);
      inv.copy(root.matrixWorld).invert(); U.uRoseInv.value.copy(inv);
      // progress: the sun comes out as the camera climbs, and the light slides a little
      const u = progress < 0 ? 0.7 : progress;
      const swell = 0.62 + 0.38 * THREE.MathUtils.smoothstep(u, 0.3, 0.62);
      const az = azim + (u - 0.6) * 0.07;
      sunL.set(-Math.sin(az) * Math.cos(elev), -Math.sin(elev), Math.cos(az) * Math.cos(elev)).normalize();
      U.uSunL.value.copy(sunL); U.uSunLW.value.copy(sunL).transformDirection(root.matrixWorld);
      if (altarLight) altarLight.intensity = 260 * (0.9 + 0.06 * Math.sin(time * 7.3) + 0.04 * Math.sin(time * 12.1));
      U.uSunS.value.set(sunL.x / sunL.z, sunL.y / sunL.z, gain * swell * (0.96 + 0.04 * Math.sin(time * 0.31)), coneZ);
      if (camera) U.uCamL.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv);
    },
    dispose() {},
  };
  hero.update(0, 0);
  return hero;
}
