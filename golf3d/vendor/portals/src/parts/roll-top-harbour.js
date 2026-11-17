// THE ROLL-TOP SEA: hero set piece of "roll-top-harbour", and the marquetry style the whole world is cut from.
//
// WHAT IT IS  A sea that is a tambour (the slatted shutter of a roll-top desk): staves of harewood and sycamore lying
//   across the course, running 560 m flat from the quay, then up a 260 m curve between two rosewood runners 1.1 km
//   apart, vertical at 260 m and curling overhead to a lip 440 m up with a turned handle rail and two scroll roundels.
//   A swell rides through it, cut as the style cuts roundness: graded strips stave by stave (the far face of each
//   crest a step darker, the foot of its near face a step paler) and one firm-edged band of full sheen on every
//   crest, ending in butt joints (the crests run through the sheet at a slant, so every stave bends along its length
//   and the rows are never straight); near the eye, inlaid zigzag wave bands of sycamore with a walnut edge and the
//   ships' grooves as routed slots (sea.uGrooveEnd[i] stops one); with range the same cut at four times the size, so every fourth swell climbs the
//   wall as a broad ring of light. The sheet is drawn out at 5 m/s and up its runners, turning walnut-dark where it
//   rolls over under the lip; four 190 m caravels (215 m over all, 170 m to the masthead) are carried up the curve stern first in the outer thirds of the
//   wall (hinging up out of the sheet like inlays, folding flat at the lip), each with a ship-shaped shadow let in
//   beside her keel (hull wedge and sail blocks, cut in rows of staves, a darker step of the sea's own harewood, sand-scorched darker at its edges: round 8). Also: the exit ring (a chequered boxwood mazzocchio, 7.5 m opening) on
//   its round bastion.
// FRAME  buildHero() default: origin at the base centre, front (the concave side the city sees) toward +Z; the quay
//   edge is at local z +410, the wall face at z -410. With opts.frame = 'course' the object IS the course frame:
//   origin at the quay edge at sea level, +Z seaward, +X to port (world z = 260 + local z in the brief). All
//   anchors are given in the object's local space in either case; hero.inner is always the course-frame group.
// SIZE  about 1150 m wide, 820 m deep, 440 m high (true half-extent 700 m; `radius` 400 is the orbit framing). COST  about 80k triangles, 6 draw calls, build
//   about 160 ms with no step over 25 ms; one 256x256 texture; no lights. Unlit, no fog (give the scene none).
// OPTS  palette (7 hex: holly, sycamore, oak, pear, walnut, harewood, ebony), detail 0.6-1 (thins the real near
//   staves), style (a createStyle() result to share; otherwise the hero makes one and returns it as hero.style),
//   frame 'course', ring false (leave the ring and bastion out), ringZ (course z of the ring, default 285),
//   exposure (post.exposure of the world, default 1).
// ANCHORS  portalSeat {position, facing, radius 7}: centre of the ring, 12 m up, facing back to the quay;
//   flyThrough: the brief's line from the quay edge down to 3 m over the staves and up to the ring (the swell tops
//   out 0.6 m above sea level, so the clearance is the brief's 2.4 m there and >= 6 m elsewhere); quayEdge
//   {position, seaward, port}; viewpoints {lowOnStaves, lookUpFrom, frontFar}; poiCurve, poiLip (gaze targets);
//   wallFoot, wallFace; runnerPort, runnerStarboard; grooves (six points at the quay on the routed lines of constant
//   x that caravels run in); sun (the fixed sun direction).
// LIVE  hero.update(dt, time, camera) every frame (reads camera.matrixWorld). hero.makeCaravel() a 30 m caravel mesh
//   (+X bow, waterline y 0) on the shared geometry; hero.seaHeight(x, z, time) course-frame lift of the sheet;
//   hero.setSeaShadow(x, z, height, halfLen, slot 3-11) the inlaid ship-shaped shadow of a ship; hero.setSwell(h) 0.2 calm, 0.9,
//   1.8 a blow; hero.curveShips live states; hero.sea the tambour uniforms (uGroove, uShadow, uPale, uPhase).
//   Nothing is timed to arrival: setProgress(u) exists for the contract only.
// EXPECTS  a quay lip covering local course z < 0 (the sheet starts 6 m under it), the sky board behind, the world's
//   post with saturation 1, contrast 1, bloom off or nearly, and style.uniforms.uCeil.value = 0.95 once bloom is
//   off (the default 0.78 keeps the plain viewer's bloom from fogging the piece).
//
// THE STYLE (exports)
//   createStyle(ctx, {palette, exposure, grainScale, kerf, ceil}) -> { uniforms, woods, tone, pieceMaterial(),
//     builder(), sceneColor(i, k) }: shared uniforms uGrain (grain sheet), uWood[10] (display-linear species
//     colours, index = SPECIES), uSun (WORLD-space unit vector to the sun; the hero sets it from its own placement
//     when it owns the style), uTime, uGrainScale, uKerf (glue-line half width, m), uKerfFar (m, joints dissolve),
//     uCeil. pieceMaterial(): the one unlit ShaderMaterial for everything built with PieceBuilder (instancing works).
//   PieceBuilder: quad / strip / block / applyMatrix / build(). Each piece = species, grain angle, random, half
//     size; attributes aT (grain dir), aUv (metres in the piece), aBox, aGr, aSr (species, rnd, scorch, move).
//   STYLE_GLSL: woodColor(species, grainCoord, rnd, out fid), sheenTerm(T, B, V, wobble), sheenGain(s) = mix(.6,
//     1.7, s), kerfMask(d, px, w, fade), glue(): use these in any custom shader (sky board, birds, shavings).
//   toneGLSL(exposure) / toSceneJS(color): the exact-colour inverse (display-linear -> scene value).
//   SPECIES, SEA (the tambour's measures), seaCurveJS, swellJS (JS twins of the shader curve and swell),
//   buildCaravel(pb, rng).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------- the nine woods (+ boxwood for the ring)
export const SPECIES = { holly: 0, sycamore: 1, oak: 2, pear: 3, walnut: 4, rosewood: 5, harewood: 6, bogoak: 7, ebony: 8, boxwood: 9 };
const BRIEF_PALETTE = ['#F1E8D3', '#E0CFA6', '#C89A56', '#B9774A', '#6E4628', '#8C9685', '#1C1410'];
const EXTRA = { rosewood: '#5A2A22', bogoak: '#33291F', boxwood: '#DDBB62' };

// the tambour's own measures, in the COURSE frame (origin: quay edge, sea level; +Z seaward; +X is port/left)
export const SEA = { flat: 560, R: 260, lipAngle: 2.335, halfWidth: 550, stave: 0.35, draw: 5, swellH: 0.9, swellL: 36, swellC: 9, phase0: 2.37 };
SEA.len = SEA.flat + SEA.R * SEA.lipAngle;          // arc length quay -> lip (about 1307 m)
const SUN_COURSE = new THREE.Vector3(Math.sin(55 * Math.PI / 180) * Math.cos(38 * Math.PI / 180), Math.sin(38 * Math.PI / 180), Math.cos(55 * Math.PI / 180) * Math.cos(38 * Math.PI / 180));

// ---------------------------------------------------------------- exact colour: display-linear -> scene value
// engine: scene * exposure / 0.6 -> ACES (Hill fit) -> grade -> sRGB. This inverts the first two exactly
// (post saturation and contrast must be 1). JS twin: toSceneJS(color).
const M_IN = [0.59719, 0.076, 0.0284, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777];
const M_OUT = [1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602];
const m3inv = (e) => new THREE.Matrix3().fromArray(e).invert();
const glm3 = (m) => 'mat3(' + m.elements.map((v) => v.toFixed(6)).join(',') + ')';
export function toneGLSL(exposure = 1) {
  return /* glsl */`
  uniform float uCeil;
  // the palest woods under full sheen keep their colour: the largest channel is eased toward the ceiling (never a
  // per-channel clip, which turned holly to white paper), and the grain streaks are laid back on top of the shoulder
  vec3 toScene(vec3 D){
    float gk = clamp(1. + gGrainK, .5, 1.5), top = .955*uCeil, knee = .76*top;
    D = max(D, 0.)/gk;
    float m = max(D.r, max(D.g, D.b));
    if (m > knee) D *= (knee + (.95*top - knee)*(1. - exp(-(m - knee)/(.95*top - knee))))/m;
    D *= gk; m = max(D.r, max(D.g, D.b));
    D *= min(1., top/max(m, 1e-4));
    vec3 y = clamp(${glm3(m3inv(M_OUT))}*clamp(D, 0., uCeil), 0.0004, 0.97);
    vec3 A = 0.983729*y - 1., B = 0.432951*y - 0.0245786, C = 0.238081*y + 0.000090537;
    vec3 v = (-B - sqrt(max(B*B - 4.*A*C, 0.)))/(2.*A);
    return max(${glm3(m3inv(M_IN))}*v, 0.)*${(0.6 / exposure).toFixed(5)};
  }`;
}
export function toSceneJS(col, exposure = 1) {
  const D = new THREE.Vector3(Math.min(col.r, 0.95), Math.min(col.g, 0.95), Math.min(col.b, 0.95)).applyMatrix3(m3inv(M_OUT));
  const v = ['x', 'y', 'z'].map((k) => {
    const y = Math.min(0.97, Math.max(0.0004, D[k])), A = 0.983729 * y - 1, B = 0.432951 * y - 0.0245786, C = 0.238081 * y + 0.000090537;
    return (-B - Math.sqrt(Math.max(B * B - 4 * A * C, 0))) / (2 * A);
  });
  const o = new THREE.Vector3(v[0], v[1], v[2]).applyMatrix3(m3inv(M_IN)).multiplyScalar(0.6 / exposure);
  return new THREE.Color(Math.max(o.x, 0), Math.max(o.y, 0), Math.max(o.z, 0));
}

// ---------------------------------------------------------------- the grain sheet (one 256x256 RGBA8, tileable)
// R straight grain streaks (u = along the grain, already 1:1; the shader stretches 12:1), G pores and flecks,
// B fiddleback / cup figure (slow, across the grain), A burr eyes (for the cloud cut-outs and burr panels)
async function makeGrainTexture(ctx, rng) {
  const N = 256, data = new Uint8Array(N * N * 4), seed = Math.floor(rng() * 1e6);
  const h2 = (i, j, k) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k + seed, 2147483647)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const vn = (x, y, px, py, k) => {            // periodic value noise
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = h2(((xi % px) + px) % px, ((yi % py) + py) % py, k), b = h2((((xi + 1) % px) + px) % px, ((yi % py) + py) % py, k);
    const c = h2(((xi % px) + px) % px, (((yi + 1) % py) + py) % py, k), d = h2((((xi + 1) % px) + px) % px, (((yi + 1) % py) + py) % py, k);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
  const eyes = []; for (let i = 0; i < 9; i++) eyes.push([rng() * N, rng() * N, 6 + rng() * 10]);
  for (let y = 0; y < N; y++) {
    if (y % 8 === 0) await ctx.yield();
    for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N, o = (y * N + x) * 4;
      const wv = v * N + 5 * (vn(u * 4, v * 6, 4, 6, 1) - 0.5);                    // streaks wander a little along the grain
      let g = 0.5 * vn(u * 2, wv / 21.33, 2, 12, 2) + 0.3 * vn(u * 3, wv / 8, 3, 32, 3) + 0.2 * vn(u * 4, wv / 3.2, 4, 80, 4);
      const ring = Math.abs(((wv / 32 + 0.6 * vn(u * 2, v * 4, 2, 4, 5)) % 1 + 1) % 1 - 0.5) * 2;   // growth-ring bands
      g = (0.6 * g + 0.4 * ring * ring - 0.42) * 2.3 + 0.5;
      const pore = h2(Math.floor(x / 9), y, 6) > 0.86 && h2(Math.floor(x / 9), y, 7) > u * 0 + 0.3 ? 1 : 0;
      const fid = 0.5 + 0.5 * Math.sin(u * Math.PI * 2 * 3 + 2.2 * Math.sin(v * Math.PI * 2) + 3 * vn(u * 3, v * 3, 3, 3, 8));
      let eye = 0;
      for (const e of eyes) {
        let dx = Math.abs(x - e[0]), dy = Math.abs(y - e[1]); dx = Math.min(dx, N - dx); dy = Math.min(dy, N - dy);
        const d = Math.hypot(dx, dy) / e[2]; if (d < 1.6) eye = Math.max(eye, d < 0.35 ? 1 : 0.5 + 0.5 * Math.cos(d * 9) * (1 - d / 1.6));
      }
      data[o] = Math.round(255 * Math.min(1, Math.max(0, g))); data[o + 1] = pore * 255; data[o + 2] = Math.round(255 * fid); data[o + 3] = Math.round(255 * eye);
    }
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = 4; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------- the style, as GLSL
// Everything is composed in DISPLAY-linear colour (so a hex lands on the hex) and leaves through toScene().
// Needs the uniforms of createStyle(): uGrain, uWood[10], uSun (world), uTime, uGrainScale.
export const STYLE_GLSL = /* glsl */`
  uniform sampler2D uGrain; uniform vec3 uWood[10]; uniform vec3 uSun; uniform float uTime; uniform float uGrainScale;
  float gGrainK = 0.;      // the grain streak of the last woodColor(), for toScene's shoulder
  vec3 woodBase(float sp){ return uWood[int(clamp(sp + .5, 0., 9.))]; }
  // g: metres in the piece plane, x ALONG the grain. rnd 0..1 per piece. fid returns the fiddleback figure (0..1)
  vec3 woodColor(float sp, vec2 g, float rnd, out float fid){
    vec2 q = vec2(g.x/12., g.y)*uGrainScale + vec2(rnd*7.31, rnd*3.17);
    vec4 t = texture2D(uGrain, q), t2 = texture2D(uGrain, q*.131 + vec2(.37, rnd));
    fid = t2.b;
    float dark = smoothstep(3.5, 5.5, sp)*(1. - step(5.5, sp)*step(sp, 6.5));      // walnut, rosewood, bog oak, ebony
    float k = (t.r - .5)*mix(.46, .6, dark) + (t2.r - .5)*.24 - t.g*.15;
    vec3 c = woodBase(sp)*(1. + k); gGrainK = k;
    float h = fract(rnd*7.7) - .5;
    c *= 1. + (rnd - .5)*.16; c.r *= 1. + h*.07; c.b *= 1. - h*.10;
    return c;
  }
  // chatoyance: 0..1; T grain direction, B across the grain in the piece plane, V to the eye (all world, unit)
  float sheenTerm(vec3 T, vec3 B, vec3 V, float wob){
    vec3 Tw = T + B*wob; Tw /= max(length(Tw), 1e-4);
    vec3 H = uSun + V; H /= max(length(H), 1e-4);
    float th = dot(Tw, H), s = clamp(1. - th*th, 0., 1.); s = s*s*s;
    return s*s;
  }
  float sheenGain(float s){ return mix(.6, 1.7, s); }
  // glue line: d = metres to the piece edge, px = metres per pixel there (fwidth), w = half width in metres.
  // Never thinner than 1.5 px; fade = 1 near, 0 where the joint must dissolve (callers pass their own rule)
  float kerfMask(float d, float px, float w, float fade){
    px = max(px, 1e-6); float hw = max(w, .75*px);
    return (1. - smoothstep(hw - .5*px, hw + .5*px, d))*fade*min(1., w/max(.75*px, 1e-5) + .45);
  }
  vec3 glue(){ return uWood[8]*.8; }
`;

const PIECE_VERT = /* glsl */`
  attribute vec3 aT; attribute vec2 aUv; attribute vec2 aBox; attribute vec2 aGr; attribute vec4 aSr;
  uniform float uTime;
  varying vec3 vW; varying vec3 vT; varying vec3 vN; varying vec2 vUv; varying vec2 vBox; varying vec2 vGr; varying vec4 vSr;
  void main(){
    vec4 lp = vec4(position, 1.); vec3 lt = aT, ln = normal;
    #ifdef USE_INSTANCING
      lp = instanceMatrix*lp; lt = mat3(instanceMatrix)*lt; ln = mat3(instanceMatrix)*ln;
    #endif
    // aSr.w: pieces that breathe (sails, lifted corners): bow along the normal, pinned at the piece's u edges
    float pin = 1. - min(1., abs(aUv.x)/max(aBox.x, 1e-3)); 
    lp.xyz += ln*aSr.w*pin*(.75 + .25*sin(uTime*1.1 + aSr.y*40.) + .08*sin(uTime*3.7 + aUv.y*.9));
    vec4 wp = modelMatrix*lp; vW = wp.xyz;
    vT = mat3(modelMatrix)*lt; vN = mat3(modelMatrix)*ln;
    vUv = aUv; vBox = aBox; vGr = aGr; vSr = aSr;
    gl_Position = projectionMatrix*viewMatrix*wp;
  }`;
const pieceFrag = (tone) => /* glsl */`
  ${STYLE_GLSL}
  ${tone}
  uniform float uKerf; uniform float uKerfFar;
  varying vec3 vW; varying vec3 vT; varying vec3 vN; varying vec2 vUv; varying vec2 vBox; varying vec2 vGr; varying vec4 vSr;
  void main(){
    vec3 T = vT/max(length(vT), 1e-4), N = vN/max(length(vN), 1e-4);
    vec3 B = cross(N, T); B /= max(length(B), 1e-4);
    vec3 Vv = cameraPosition - vW; float dist = length(Vv); Vv /= max(dist, 1e-4);
    vec2 g = vec2(vUv.x*vGr.x + vUv.y*vGr.y, vUv.y*vGr.x - vUv.x*vGr.y);
    float fid; vec3 c = woodColor(vSr.x, g, vSr.y, fid);
    float cup = (vUv.y*vGr.x - vUv.x*vGr.y)/max(max(vBox.x, vBox.y), 1e-3);      // big panels are a little cupped
    float s = sheenTerm(T, B, Vv, (fid - .5)*.5 + cup*.22);
    c *= sheenGain(s);
    vec2 e = vBox - abs(vUv); float d = min(e.x, e.y);
    float px = max(fwidth(vUv.x), fwidth(vUv.y));
    c *= 1. - vSr.z*.5*(1. - smoothstep(0., .22*min(vBox.x, vBox.y) + .02, d));       // sand-scorched fringe of inlaid shadows
    float gap = 1. + 1.6*step(.967, fract(vSr.y*31.7));                              // one joint in thirty stands open
    float small = min(vBox.x, vBox.y)/max(px, 1e-5);                                 // piece half-size in pixels
    float fade = (1. - smoothstep(uKerfFar*.7, uKerfFar, dist))*smoothstep(1.5, 3., small);
    c = mix(c, glue(), kerfMask(d, px, uKerf*gap, fade));
    gl_FragColor = vec4(toScene(c), 1.);
  }`;

// One style object per world build: shared uniforms + material factories. Give the same object to buildHero
// (opts.style) and to everything else in the world.
export async function createStyle(ctx, opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : BRIEF_PALETTE).map((h) => new THREE.Color(h));
  const rng = ctx.rng.fork('marquetry-style');
  const drift = rng.range(-0.035, 0.035);                 // each seed's cabinet is a touch warmer or cooler
  const woods = [pal[0], pal[1], pal[2], pal[3], pal[4], new THREE.Color(EXTRA.rosewood), pal[5], new THREE.Color(EXTRA.bogoak), pal[6], new THREE.Color(EXTRA.boxwood)]
    .map((c, i) => (i === 0 || i === 8 ? c.clone() : c.clone().offsetHSL(drift * 0.3, 0, drift * 0.4)));
  const exposure = opts.exposure ?? 1, tone = toneGLSL(exposure);
  const uniforms = {
    uGrain: { value: await makeGrainTexture(ctx, rng) }, uWood: { value: woods }, uSun: { value: SUN_COURSE.clone() },
    uTime: { value: 0 }, uGrainScale: { value: opts.grainScale ?? 0.4 }, uKerf: { value: opts.kerf ?? 0.012 }, uKerfFar: { value: 250 }, uCeil: { value: opts.ceil ?? 0.78 },
  };
  const style = {
    uniforms, woods, tone, exposure, SPECIES,
    // unlit marquetry material for geometry made by PieceBuilder (or any geometry with aT,aUv,aBox,aGr,aSr)
    pieceMaterial(o = {}) {
      return new THREE.ShaderMaterial({ uniforms, vertexShader: PIECE_VERT, fragmentShader: pieceFrag(tone), side: o.side ?? THREE.DoubleSide, fog: false, toneMapped: false });
    },
    // scene-linear THREE.Color that the post chain shows as wood i at sheen gain k (for flat helpers, portal tint)
    sceneColor(i, k = 1) { return toSceneJS(woods[i].clone().multiplyScalar(k), exposure); },
    builder() { return new PieceBuilder(); },
  };
  return style;
}

// ---------------------------------------------------------------- PieceBuilder: marquetry as merged flat pieces
// Every piece is a quad (or a strip of quads) that carries species, grain direction, a random and its own
// half-size, so the shader can draw its kerf from the distance to its edge. o = { sp, ang (grain angle from the
// u edge, radians), rnd, scorch (1 = inlaid shadow, burnt fringe), move (metres of bow along the normal) }.
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _n = new THREE.Vector3();
export class PieceBuilder {
  constructor() { this.P = []; this.N = []; this.T = []; this.U = []; this.B = []; this.G = []; this.S = []; this.I = []; this.nv = 0; this.seq = 0.137; }
  _rnd() { this.seq = (this.seq * 97.13 + 0.618034) % 1; return this.seq; }
  _v(p, n, t, u, v, hw, hh, cg, sg, o, rnd) {
    this.P.push(p.x, p.y, p.z); this.N.push(n.x, n.y, n.z); this.T.push(t.x, t.y, t.z); this.U.push(u, v); this.B.push(hw, hh);
    this.G.push(cg, sg); this.S.push(o.sp ?? 1, rnd, o.scorch ?? 0, o.move ?? 0); return this.nv++;
  }
  // a -> b is the u edge, a -> d the v edge
  quad(a, b, c, d, o = {}) {
    const ue = _a.subVectors(b, a), ve = _b.subVectors(d, a), lu = ue.length(), lv = ve.length();
    if (lu < 1e-6 || lv < 1e-6) return this;
    ue.multiplyScalar(1 / lu); _n.crossVectors(ue, ve); if (_n.lengthSq() < 1e-12) return this; _n.normalize();
    const vh = _c.crossVectors(_n, ue), ang = o.ang ?? 0, cg = Math.cos(ang), sg = Math.sin(ang);
    const t = new THREE.Vector3().copy(ue).multiplyScalar(cg).addScaledVector(vh, sg), n = _n.clone();
    const uv = o.uv || [-lu / 2, -lv / 2, lu / 2, lv / 2], box = o.box || [lu / 2, lv / 2], rnd = o.rnd ?? this._rnd();
    const i0 = this._v(a, n, t, uv[0], uv[1], box[0], box[1], cg, sg, o, rnd), i1 = this._v(b, n, t, uv[2], uv[1], box[0], box[1], cg, sg, o, rnd);
    const i2 = this._v(c, n, t, uv[2], uv[3], box[0], box[1], cg, sg, o, rnd), i3 = this._v(d, n, t, uv[0], uv[3], box[0], box[1], cg, sg, o, rnd);
    this.I.push(i0, i1, i2, i0, i2, i3); return this;
  }
  // one bent piece: rails A[i], B[i] (A -> next A is the grain/u direction, A -> B the v edge)
  strip(A, B, o = {}) {
    let len = 0; const L = [0];
    for (let i = 1; i < A.length; i++) { len += 0.5 * (A[i].distanceTo(A[i - 1]) + B[i].distanceTo(B[i - 1])); L.push(len); }
    let w = 0; for (let i = 0; i < A.length; i++) w += A[i].distanceTo(B[i]); w /= A.length;
    const rnd = o.rnd ?? this._rnd(), oo = { ...o, rnd, box: [len / 2, w / 2] };
    const from = this.nv;
    for (let i = 0; i + 1 < A.length; i++) { oo.uv = [L[i] - len / 2, -w / 2, L[i + 1] - len / 2, w / 2]; this.quad(A[i], A[i + 1], B[i + 1], B[i], oo); }
    if (o.move) {                        // a breathing piece bows along ONE direction, so its quads never part
      let nx = 0, ny = 0, nz = 0; for (let i = from; i < this.nv; i++) { nx += this.N[i * 3]; ny += this.N[i * 3 + 1]; nz += this.N[i * 3 + 2]; }
      const l = Math.hypot(nx, ny, nz) || 1; for (let i = from; i < this.nv; i++) { this.N[i * 3] = nx / l; this.N[i * 3 + 1] = ny / l; this.N[i * 3 + 2] = nz / l; }
    }
    return this;
  }
  // a cuboid of six pieces, centre at the origin of m (Matrix4), grain along each face's longer edge;
  // o.sides / o.top / o.ends override the species per face group; o.alt turns the grain a quarter
  block(m, sx, sy, sz, o = {}) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2, V = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(m);
    const f = (a, b, c, d, sp) => { const long = a.distanceTo(b) >= a.distanceTo(d); const oo = { ...o, sp: sp ?? o.sp, rnd: undefined, ang: (o.alt ? Math.PI / 2 : 0) + (o.ang ?? 0) };
      return long ? this.quad(a, b, c, d, oo) : this.quad(b, c, d, a, oo); };
    f(V(-hx, hy, hz), V(hx, hy, hz), V(hx, hy, -hz), V(-hx, hy, -hz), o.top);
    f(V(-hx, -hy, -hz), V(hx, -hy, -hz), V(hx, -hy, hz), V(-hx, -hy, hz), o.bottom ?? o.top);
    f(V(-hx, -hy, hz), V(hx, -hy, hz), V(hx, hy, hz), V(-hx, hy, hz), o.sides);
    f(V(hx, -hy, -hz), V(-hx, -hy, -hz), V(-hx, hy, -hz), V(hx, hy, -hz), o.sides);
    f(V(hx, -hy, hz), V(hx, -hy, -hz), V(hx, hy, -hz), V(hx, hy, hz), o.ends ?? o.sides);
    f(V(-hx, -hy, -hz), V(-hx, -hy, hz), V(-hx, hy, hz), V(-hx, hy, -hz), o.ends ?? o.sides);
    return this;
  }
  mark() { return this.nv; }
  // move everything added since `from` (a mark) by a Matrix4
  applyMatrix(m, from = 0) {
    const nm = new THREE.Matrix3().getNormalMatrix(m), v = new THREE.Vector3();
    for (let i = from; i < this.nv; i++) {
      v.fromArray(this.P, i * 3).applyMatrix4(m).toArray(this.P, i * 3);
      v.fromArray(this.N, i * 3).applyMatrix3(nm).normalize().toArray(this.N, i * 3);
      v.fromArray(this.T, i * 3).transformDirection(m).toArray(this.T, i * 3);
    }
    return this;
  }
  get triangles() { return this.I.length / 3; }
  build() {
    const g = new THREE.BufferGeometry(), f = (arr, n) => new THREE.Float32BufferAttribute(arr, n);
    g.setAttribute('position', f(this.P, 3)); g.setAttribute('normal', f(this.N, 3)); g.setAttribute('aT', f(this.T, 3));
    g.setAttribute('aUv', f(this.U, 2)); g.setAttribute('aBox', f(this.B, 2)); g.setAttribute('aGr', f(this.G, 2)); g.setAttribute('aSr', f(this.S, 4));
    g.setIndex(this.nv > 65535 ? new THREE.Uint32BufferAttribute(this.I, 1) : new THREE.Uint16BufferAttribute(this.I, 1));
    g.computeBoundingSphere(); return g;
  }
}

// ---------------------------------------------------------------- the tambour: curve + swell, shared by JS and GLSL
// arc length s (m from the quay) -> course-frame z, y and the tangent angle th (0 flat, pi/2 vertical)
export function seaCurveJS(s, out = {}) {
  const th = Math.min(SEA.lipAngle + 0.25, Math.max(0, (s - SEA.flat) / SEA.R));
  out.z = Math.min(s, SEA.flat) + SEA.R * Math.sin(th); out.y = SEA.R * (1 - Math.cos(th)); out.th = th; return out;
}
export function swellJS(s, x, time, out = {}) {
  const K = Math.PI * 2 / SEA.swellL, bend = 1.1 * Math.sin(x * 0.0105 + s * 0.0031) + 0.6 * Math.sin(x * 0.027 - 1.3) + 1.4 * Math.sin(x * 0.05 + 0.6) + 0.7 * Math.sin(x * 0.093 - s * 0.011 + 2.1);
  const ph = K * (s - SEA.swellC * time) + bend + SEA.phase0, amp = SEA.swellH * 0.5 * (0.75 + 0.25 * Math.sin(x * 0.006 + s * 0.012)) * (0.3 + 0.7 * Math.min(1, Math.max(0, (s + 5) / 40)));
  out.h = amp * Math.sin(ph) + 0.1 * Math.sin(ph * 2.7 + x * 0.05 + 1.7); out.slope = amp * K * Math.cos(ph) + 0.27 * K * Math.cos(ph * 2.7 + x * 0.05 + 1.7); out.ph = ph; return out;
}
const f4 = (v) => v.toFixed(5);
const SEA_GLSL = /* glsl */`
  uniform float uDrawn; uniform float uSeaT; uniform float uSwell;
  const float FLAT = ${f4(SEA.flat)}, RAD = ${f4(SEA.R)}, LIP = ${f4(SEA.lipAngle)}, KW = ${f4(Math.PI * 2 / SEA.swellL)}, W0 = ${f4(SEA.stave)};
  float hash11(float p){ p = fract(p*.1031); p *= p + 33.33; p *= p + p; return fract(p); }
  float seaTheta(float s){ return clamp((s - FLAT)/RAD, 0., LIP + .25); }
  // course-frame position on the sheet at arc length s, lifted h along the sheet normal
  vec3 seaPos(float s, float x, float h){
    float th = seaTheta(s), c = cos(th), sn = sin(th);
    return vec3(x, RAD*(1. - c) + h*c, min(s, FLAT) + RAD*sn - h*sn);
  }
  float swellPhase(float s, float x){ return KW*(s - ${f4(SEA.swellC)}*uSeaT) + 1.1*sin(x*.0105 + s*.0031) + .6*sin(x*.027 - 1.3) + 1.4*sin(x*.05 + .6) + .7*sin(x*.093 - s*.011 + 2.1) + ${f4(SEA.phase0)}; }
  // x = lift, y = slope along s
  vec2 swell(float s, float x){
    float ph = swellPhase(s, x);
    float amp = uSwell*.5*(.75 + .25*sin(x*.006 + s*.012))*(.3 + .7*clamp((s + 5.)/40., 0., 1.));
    return vec2(amp*sin(ph) + .1*sin(ph*2.7 + x*.05 + 1.7), amp*KW*cos(ph) + .27*KW*cos(ph*2.7 + x*.05 + 1.7));
  }`;

const SEA_VERT = /* glsl */`
  ${SEA_GLSL}
  uniform vec3 uSun; uniform vec4 uWin;     // near window: s0, s1, x centre, x half length
  #ifdef NEAR
    attribute float aIdx; attribute vec2 aC; uniform float uWinK; uniform float uNearR;
  #endif
  varying float vS; varying float vX; varying vec3 vPc; varying vec3 vCamC; varying vec3 vSunC;
  void main(){
    #ifdef NEAR
      float id = aIdx + uWinK, sc = (id + .5)*W0 + uDrawn, x = position.x + uWin.z;
      vec2 sw = swell(sc, x);
      vec3 cc = (cameraPosition - modelMatrix[3].xyz)*mat3(modelMatrix);
      // each stave rocks on its canvas. Real staves exist only inside uNearR of the eye (where one is 3 px or
      // more: beyond it the scored sheet takes over, or sub-pixel tilted faces would boil at the grazing angle),
      // and their own tilt, lift and bevel ease out toward that edge so the two meet without a step
      float nearF = 1. - smoothstep(.3*uNearR, .75*uNearR, length(vec2(x - cc.x, sc - cc.z)));
      float r1 = hash11(id), rho = sw.y*(1. + .7*nearF) + (r1 - .5)*.22*nearF;
      float s = sc + aC.x*cos(rho);
      vec3 pc = seaPos(s, x, sw.x + aC.x*sin(rho) + (aC.y*.8 + .15 + (hash11(id + 7.7) - .5)*.045)*nearF - .03*(1. - nearF));     // real staves ride 15 cm proud of their canvas (in a blow a rocked edge dips 6 cm and the canvas, a coarser grid, stands as much off the true sheet: at 5 cm it came through the joints as rows of pale dots)
      vS = sc + aC.x*.996;
    #else
      float s = position.z, x = position.x;
      vec2 sw = swell(s, x);
      vec3 pc = seaPos(s, x, sw.x - .03);
      vS = s;
    #endif
    vX = x; vPc = pc;
    mat3 R = mat3(modelMatrix);
    vCamC = (cameraPosition - modelMatrix[3].xyz)*R;       // world -> course frame (rigid placement assumed)
    vSunC = uSun*R;
    gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(pc, 1.);
  }`;

// THE CUT OF THE SHEET. One wood (harewood, one stave in eight a sycamore accent), one kerf, and a sheen that is
// coherent across the sheet: per-stave differences (tilt, tint, accent, butt joints, fine grain) exist only where a
// stave is wide enough on screen to carry them and fade to the mean with range, so no row is ever unrelated to its
// neighbours. Staves widen with range by doubling (never under about 4.5 px, parents aligned on their children);
// beyond the last level the sheet is its flat average carrying only the broad bands, the grooves and the shadows.
const seaFrag = (tone) => /* glsl */`
  ${STYLE_GLSL}
  ${tone}
  ${SEA_GLSL}
  uniform vec4 uWin; uniform float uPhase; uniform float uGroove[6]; uniform float uGrooveEnd[6]; uniform vec4 uShadow[12]; uniform float uShSide; uniform float uPale; uniform float uNearR; uniform float uRel;
  varying float vS; varying float vX; varying vec3 vPc; varying vec3 vCamC; varying vec3 vSunC;
  // a real stave's joint is cut wide enough to lie on its top face as well as its bevel, so it never hides behind a
  // rocked neighbour; toward the edge of the real staves it narrows to the scored sheet's (set in main)
  float gKmin = .019;
  // one cut into staves of width w (level lvl). Returns x tint, y kerf, z bevel light, w sycamore share;
  // sp = the arc length at which this stave takes its place in the swell (its own centre while it is a real stave,
  // the pixel's once staves are wide), rock = how far real neighbours differ in tilt
  vec4 staveCut(float w, float lvl, float fs, float fsA, float fx, float rock, out float sp){
    float q = (vS - uDrawn)/w, id = floor(q), f = q - id, e = f*w, sc = (id + .5)*w + uDrawn;
    // a wide stave takes its wood from its first real stave (leaf), so as two staves merge with range one of them
    // never changes and the other fades into it: no unrelated stripes between levels
    float leaf = id*exp2(lvl), rnd = hash11(leaf*1.13 + 5.7), wpx = w/fs, wpxA = w/fsA;
    // uRel: metres the sheet slides under the eye per frame. A stave that passes in under three frames cannot show
    // its own tint, accent or tilt without strobing, so those ease to the mean; kerf, bevel and swell tone stay
    float vary = 1. - smoothstep(.12, .38, uRel/w);
    float tint = 1. + ((rnd - .5)*.13/(1. + .5*lvl) + (hash11(id) - .5)*rock)*vary;
    tint *= 1. + (hash11(floor(leaf*.25)*2.39 + 1.7) - .5)*.2*smoothstep(5., 10., 4.*W0/fs)*(1. - smoothstep(.12, .38, uRel/(4.*W0)));
    float acc = mix(.1, step(.875, hash11(leaf*1.7 + 3.1)), vary)*mix(1., .3, clamp(lvl/2., 0., 1.));
    float k0 = max(gKmin, .6*fs), bw = max(.05, 1.6*fs);
    // a joint is drawn where its stave, lying calm, is wide enough on screen to own one (wpxA): the swell passing
    // through never switches a joint on and off along its length (that broke the joints into rows of dashes); on a
    // face turned from the eye the line only weakens, and with range it thins and is gone
    float kerf = (1. - smoothstep(k0 - .5*fs, k0 + .5*fs, min(e, w - e)))*mix(.9, .52, clamp(lvl/5., 0., 1.))*smoothstep(3.2, 5.5, wpxA)*mix(.3, 1., smoothstep(1.4, 4.5, wpx));
    // the bevel's pale line: one continuous line, never under 1.5 px
    float bev = smoothstep(k0, k0 + .5*fs, e)*(1. - smoothstep(k0 + bw, k0 + bw + .5*fs, e))*smoothstep(5., 9., wpxA)*smoothstep(2.5, 5., wpx);
    // butt joints of the staves themselves: staggered stave to stave, none within 4.5 m of the course
    float Lj = 70. + 60.*hash11(leaf + 9.1), jf = fract((vX + rnd*977.)/Lj), dj = min(jf, 1. - jf)*Lj;
    kerf = max(kerf, kerfMask(dj, fx, .013, smoothstep(6., 12., wpxA)*step(lvl, 1.5)*vary*step(4.5, abs(vX))));
    sp = mix(vS, sc, clamp(1.5 - .5*lvl, 0., 1.));
    return vec4(tint, kerf, bev, acc);
  }
  // THE SWELL AS THE STYLE DOES ROUNDNESS: graded strips. u runs 0..1 through one swell, away from the eye, from
  // the upper near face of a crest: a firm band of full sheen up to just over the crest (u < .22: the part of a swell the
  // eye sees widest), the far face behind it one step darker (.22-.44), the sheet at rest, then the foot of the next
  // near face one step paler (.74-1). x = tone, y = band.
  // fu = u per pixel (firm edges, 1 px)
  vec2 swellTone(float u, float fu){
    float e1 = smoothstep(.22 - fu, .22 + fu, u), e2 = smoothstep(.44 - fu, .44 + fu, u), e3 = smoothstep(.74 - fu, .74 + fu, u);
    float band = (1. - e1)*smoothstep(0., 2.*fu, u)*(1. - smoothstep(1. - 2.*fu, 1., u));
    return vec2(.64 + .2*e2 + .13*e3, band);
  }
  // ONE CUT, WHOSE PIECES CHANGE SIZE WITH RANGE (never two cuts cross-faded: that gave every ring a ghost).
  // ph = swells (cycles), fu = cycles per pixel, m 0..1: 0 near, every swell carries its band (.22 of a swell), the
  // darker far face behind it and the paler foot of the next near face; as m goes to .5 the bands of three swells in
  // four narrow to nothing; from .5 to 1 the fourth (the sets) widens to .88 of a swell with its dark face as wide
  // again and a long pale foot before the next. Every edge is a hard cut at every m. x = tone, y = band.
  float cutE(float e, float x, float fu){ return clamp((x - e)/max(fu, 1e-5) + .5, 0., 1.); }
  vec2 swellCut(float ph, float fu, float m){
    float U = mod(ph, 4.), j = floor(U), f = U - j, a = clamp(2.*m, 0., 1.), b = clamp(2.*m - 1., 0., 1.);
    // the set (swell 0 of four): band, then its dark face (running on into swell 1 once that has lost its own)
    float bE = mix(.22, .88, b), dE = mix(.44, 1.76, b);
    float band = (1. - cutE(bE, U, fu))*cutE(0., U, fu);
    float dark = cutE(bE, U, fu)*(1. - cutE(dE, U, fu));
    // the other three: band and dark face narrowing to nothing
    float w1 = .22*(1. - a), on = step(.5, j)*step(.004, w1);
    band = max(band, on*cutE(0., f, fu)*(1. - cutE(w1, f, fu)));
    dark = max(dark, on*cutE(w1, f, fu)*(1. - cutE(2.*w1, f, fu)));
    // the paler foot of the next near face: three shrink away, the one before the set grows long
    float foot = step(j, 2.5)*step(a, .98)*cutE(.74 + .26*a, f, fu);
    foot = max(foot, cutE(mix(3.74, 2.96, b), U, fu));
    band = max(band, max(cutE(4., U, fu), step(j, 2.5)*step(.004, w1)*cutE(1., f, fu)));      // the half pixel before each band's near edge
    return vec2(mix(mix(.84, .97, foot*(1. - band)), .64, dark), band);
  }
  // inlaid shadow of a ship: a hull wedge and three sail blocks of darker harewood beside her keel, on the side away from
  // the sun, cut in rows of staves. S = keel x, s of her middle, height of the shadow, half length (sign: bow toward +s)
  float shipShadow(out float edge){
    float sh = 0.; edge = 1.;
    for (int i = 0; i < 12; i++){
      vec4 S = uShadow[i]; float hl = max(abs(S.w), 1.), q = W0*exp2(floor(log2(hl/(13.*W0)) + .5));
      float sq = (floor((vS - uDrawn)/q) + .5)*q + uDrawn, hr = .5*q/hl;
      float u = (sq - S.y)/hl*(S.w < 0. ? -1. : 1.), hgt = max(S.z, 1e-3), v = (S.x - vX)*uShSide/hgt;
      // the silhouette of the ship herself, laid over on the staves: hull with its sterncastle and rising bow, three
      // masts (each one row of staves), main and fore sails bellied toward the bow, the lateen on its slanting yard
      float hTop = (.17 + .06*step(u, -.52) - .05*step(.74, u))*clamp((1. - u)/.1, 0., 1.);
      float hull = step(abs(u), 1.)*step(v, hTop);
      float t1 = clamp((v - .25)/.73, 0., 1.), s1 = step(.25, v)*step(v, .98)*step(-.15 + .05*t1, u)*step(u, .34 - .05*t1 + .06*sin(3.1416*t1));
      float t2 = clamp((v - .25)/.47, 0., 1.), s2 = step(.25, v)*step(v, .72)*step(.47 + .04*t2, u)*step(u, .82 - .04*t2 + .05*sin(3.1416*t2));
      float t3 = (u + .93)/.5, s3 = step(0., t3)*step(t3, 1.)*step(.23, v)*step(v, .27 + .33*t3);
      float mast = max(step(v, 1.)*step(abs(u - .1), hr), max(step(v, .76)*step(abs(u - .65), hr), step(v, .62)*step(abs(u + .64), hr)));
      float inside = step(-.04, v)*max(max(hull, s1), max(max(s2, s3), mast));
      float d = mix(.07, min(v + .04, hTop - v), hull)*hgt, row = (.5 - abs(fract((vS - uDrawn)/q) - .5))*q;
      if (inside > .5 && S.z > .5){ sh = 1.; edge = min(edge, min(d, row + .25*q)/(.1*hgt + .4)); }
    }
    return sh;
  }
  void main(){
    float fs = max(fwidth(vS), 1e-5), fx = max(fwidth(vX), 1e-5);
    vec3 Vv = vCamC - vPc; float D = max(length(Vv), 1e-4); vec3 V = Vv/D;
    float front = gl_FrontFacing ? 1. : 0.;
    // the cut is chosen from the footprint a pixel would have on the sheet lying calm (eye, range and the sheet's own
    // curve only), so a swell passing through never changes which staves are drawn and no joint breaks into dashes
    float th = seaTheta(vS), cth = cos(th), sth = sin(th);
    float pa = max(max(length(dFdx(V)), length(dFdy(V))), 1e-6), iso = D*pa;
    float cN = max(abs(V.y*cth - V.z*sth), .012), vs = V.y*sth + V.z*cth, vt = max(length(vec2(vs, V.x)), 1e-4);
    float an = length(vec2(vs/(vt*cN), V.x/vt)), fsA = max(iso*an, 1e-6), graze = smoothstep(4., 11., an);
    float L = max(0., log2(max(5.5*fsA/W0, 1.)));
    float l0 = mix(6., min(floor(L), 7.), front), t = smoothstep(.35, 1., L - l0)*front, flatK = smoothstep(7.9, 8.6, L)*front;
    float dEye = length(vec2(vX - vCamC.x, vS - vCamC.z));
    #ifdef NEAR
      gKmin = mix(.046, .019, smoothstep(.45, .9, dEye/max(uNearR, 1.)));
    #endif
    float rock = .45*smoothstep(3., 7., W0/fs)*front, p0, p1, fsE = fs;
    #ifdef NEAR
      // on a real stave the screen derivative of vS jumps wherever a pixel straddles the crease between its bevel and
      // its top face, which broke the pale bevel line into a row of dots: there the line widths are taken from the
      // footprint on the calm sheet, held within a factor of the true one
      fsE = clamp(fs, .6*fsA, 1.8*fsA);
    #endif
    vec4 c0 = staveCut(W0*exp2(l0), l0, fsE, fsA, fx, rock, p0), c1 = staveCut(W0*exp2(l0 + 1.), l0 + 1., fsE, fsA, fx, 0., p1);
    vec4 cut = mix(mix(c0, c1, t), vec4(1., 0., 0., .075), flatK);
    float sp = mix(mix(p0, p1, t), vS, flatK);
    // the swell: graded strips and a firm band of sheen on every crest while a swell is wide enough on screen to
    // carry them; beyond that every fourth swell (the sets) is one broad pale piece and the rest lie at the mean
    // (the regime is taken from the swell as it really stands on screen: the near face of a crest in a blow is many
    // pixels tall where the calm sheet would give it one, and that is where its band lies)
    float lam = ${f4(SEA.swellL)}/fsA, fph = max(fwidth(swellPhase(vS, vX)*.15915494), 1e-5);
    float perPx = clamp(.5*(l0 + t) - .25, 0., 1.), fu = clamp(fph*perPx, .0015, .2);
    // m: how far the cut has gone, from a band on every swell to the sets alone. Taken from the swell's size on the calm sheet
    // (smooth, no pixel of it depends on the crest's own bends) and from the place: the curve and the wall always
    // carry the sets, at any range, so the wall close to is the wall of the reveal, only larger
    float mCut = max(1. - smoothstep(3., 8., .22*lam), smoothstep(FLAT - 150., FLAT - 40., vS));
    float farK = smoothstep(1.2, 3., .88*lam);
    // while staves are real pieces the strips end in butt joints (a crest line crossing the staves at a slant is cut
    // in clear steps): long slats, 11.2 m, the joints staggered from one pair of staves to the next and never within
    // 3 m of the course; with range the cut follows the crest itself
    float rowJ = floor((vS - uDrawn)/(2.*W0)), cx = (vX + (hash11(rowJ*1.37 + 2.9) - .5)*4.8)/11.2 + .5, ci = floor(cx), qK = 1. - perPx;
    float xq = mix(vX, vX + (ci + .5 - cx)*11.2, qK);
    vec2 sw = mix(vec2(.84, 0.), swellCut(swellPhase(sp, xq)*.15915494 - .06, fu, mCut), farK);
    float tone = sw.x, band = sw.y*front;
    // grain: fine streaks of each stave near, only the slow figure of the sheet far
    float sl = vS - uDrawn, grK = 1. - smoothstep(.3, 1.3, L), id0 = floor(sl/W0);
    vec2 gq = vec2(vX/12., sl)*uGrainScale;
    vec4 g1 = texture2D(uGrain, gq + hash11(id0)*vec2(7.31, 3.17)*grK), g2 = texture2D(uGrain, gq*.131 + vec2(.37, .11));
    float k = ((g1.r - .5)*.46 - g1.g*.15)*grK + (g2.r - .5)*.14;
    float edge, sh = shipShadow(edge)*front;
    // under the roll the sheet has turned over toward us: three graded steps down to walnut, and little sheen
    float uth = seaTheta(sp), un1 = step(1.8, uth)*front, un2 = step(1.93, uth)*front, un3 = step(2.06, uth)*front;
    vec3 hare = woodBase(6.), base = mix(hare, woodBase(1.), .6*cut.w*(1. - band));
    base *= 1. + (.09*step(.42, uth) + .09*step(.92, uth) - .11*step(1.42, uth))*front;
    base = mix(base, hare*.7, un1); base = mix(base, mix(hare*.7, woodBase(4.), .55), un2); base = mix(base, woodBase(4.)*1.05, un3);
    // inlaid wave bands: of every twenty-four pairs of staves ten carry a stepped zigzag of sycamore two pairs thick with
    // a walnut edge behind it (the cabinetmaker's sign for water), each piece ending in butt joints; only where a pair
    // of staves is about 3 px or more, beyond that the band is the sheet's own tone
    // (a frieze: of every thirty-two pairs of staves, a straight sycamore string with a walnut line outside it, the
    // zigzag in long stepped slats, and the same string again; fifteen pairs of plain sea between two friezes)
    float zr = floor(sl/(2.*W0)), zj = mod(zr, 32.);
    // (now all straight banding, every slat whole from end to end: outer strings at pairs 30 and 12 with a walnut line
    // outside each, and between them a band of two sycamore pairs, a walnut line, two sycamore pairs, walnut lined)
    float zK = (1. - smoothstep(1.8, 2.6, L))*front*(1. - sh)*(1. - un1);
    float zStrP = (step(29.5, zj)*step(zj, 30.5) + step(11.5, zj)*step(zj, 12.5) + step(2.5, zj)*step(zj, 4.5) + step(5.5, zj)*step(zj, 7.5))*zK;
    float zStrD = (step(28.5, zj)*step(zj, 29.5) + step(12.5, zj)*step(zj, 13.5) + step(1.5, zj)*step(zj, 2.5) + step(4.5, zj)*step(zj, 5.5) + step(7.5, zj)*step(zj, 8.5))*zK;
    base = mix(base, woodBase(1.)*1.04, zStrP); base = mix(base, mix(hare*.6, woodBase(4.), .45), zStrD);
    base = mix(base, woodBase(1.), max(uPale, 1. - front));                       // the canvas side: plain pale boards
    // round 8: a ship's shadow on the sea is a darker step of the sea's own harewood, the same hard-edged piece: the wood let in is 0.8
    // of the stave's at its fringe to 0.67 inside, and the next line's gain (live's) scorches it darker toward its edges, so on screen it
    // is about 0.6 of the lit sea beside it, darkest at its fringe (it was walnut and bog oak, near black, which strangers read as black slabs
    // and a rendering fault; two typed numbers tuned on the whole sea for no still, after a plain look four of four preferred).
    // Where the sheet has turned over under the roll its staves are hare*.7 (un1): the shadow steps down from that wood too,
    // so it is nowhere paler than its ground
    base = mix(base, mix(hare*.8, hare*.62, .7*smoothstep(0., 1., edge))*(1. - .3*un1), sh);
    float gain = mix(.864, mix(tone, mix(1.42, 2.05, smoothstep(1.2, 3.6, L)), band*(1. - .55*un1)), front);
    gain = mix(gain, .84*(1. - .42*(1. - smoothstep(0., 1., edge))), sh);        // sand-scorched toward its edges
    vec3 c = base*(1. + k)*cut.x*gain;
    c *= 1. + mix(.75, .4, band)*cut.z*(1. - sh);
    // a joint seen face on is a glue line; at a grazing angle it is only the shade between two staves
    c = mix(c, mix(glue(), base*gain*.52, graze), cut.y*(1. - .85*graze*smoothstep(.6, 2.4, L)));
    // the grooves the caravels run in: a routed slot, two kerf-thin edges and a dark floor through which the stave
    // joints still run; far off (under 3 px) one line of its average tint, never under 1.5 px
    float gF = 0., gE = 0., ghw = min(.17, 2.6*fx), gke = max(.022, .6*fx), gWide = smoothstep(2.5, 4.5, 2.*ghw/fx), ghf = max(ghw, .75*fx);
    for (int i = 0; i < 6; i++){
      float d = abs(vX - uGroove[i]), on = step(vS, min(uGrooveEnd[i], FLAT + RAD*LIP - 6.));
      gF = max(gF, on*(1. - smoothstep(ghf - .5*fx, ghf + .5*fx, d)));
      gE = max(gE, on*(1. - smoothstep(gke - .5*fx, gke + .5*fx, abs(d - ghw))));
    }
    c = mix(c, mix(c*.62, uWood[7], .22), gF*front*mix(.85, 1., gWide));
    c = mix(c, glue(), gE*gWide*front*.85);
    #ifdef NEAR
      if (dEye > uNearR) discard;
    #else
      // under the real staves the sheet is their canvas: dark harewood in whatever crack opens between two rocking staves
      // (only well inside the window: toward its edge, where the real staves settle onto the sheet, the canvas is the
      // sheet's own picture, so no dark crack or dash can show where the two meet)
      if (vS > uWin.x && vS < uWin.y && abs(vX - uWin.z) < uWin.w) c = mix(c, hare*.4, 1. - smoothstep(.35*uNearR, .62*uNearR, dEye));
    #endif
    gl_FragColor = vec4(toScene(c), 1.);
  }`;

function buildSeaMeshes(style, detail, rng) {
  const U = {
    ...style.uniforms, uDrawn: { value: 0 }, uSeaT: { value: 0 }, uSwell: { value: SEA.swellH }, uWin: { value: new THREE.Vector4(0, 1, 0, 1) },
    uWinK: { value: 0 }, uPhase: { value: rng.range(0, Math.PI) }, uGroove: { value: [-310, -190, -75, 60, 170, 330].map((x) => x + Math.round(rng.range(-22, 22))) },
    uGrooveEnd: { value: [1e6, 1e6, 1e6, 1e6, 1e6, 1e6] }, uShadow: { value: Array.from({ length: 12 }, () => new THREE.Vector4(0, -9999, 0, 1)) }, uShSide: { value: 1 }, uPale: { value: 0 }, uNearR: { value: 12 }, uRel: { value: 0 },
  };
  const mk = (near) => new THREE.ShaderMaterial({ uniforms: U, vertexShader: SEA_VERT, fragmentShader: seaFrag(style.tone), defines: near ? { NEAR: 1 } : {}, side: near ? THREE.FrontSide : THREE.DoubleSide, fog: false, toneMapped: false });
  // far sheet: quay -> lip, a plain grid in (x, s); the shader scores it into staves
  const rows = []; for (let s = -6; s < SEA.flat; s += 3) rows.push(s); for (let s = SEA.flat; s < SEA.len; s += 4.5) rows.push(s); rows.push(SEA.len);
  const NX = 144, pos = new Float32Array(rows.length * (NX + 1) * 3), idx = [];
  for (let j = 0; j < rows.length; j++) for (let i = 0; i <= NX; i++) { const o = (j * (NX + 1) + i) * 3; pos[o] = -SEA.halfWidth + (2 * SEA.halfWidth * i) / NX; pos[o + 1] = 0; pos[o + 2] = rows[j]; }
  for (let j = 0; j + 1 < rows.length; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); fg.setIndex(idx);
  const far = new THREE.Mesh(fg, mk(false)); far.frustumCulled = false;
  far.material.polygonOffset = true; far.material.polygonOffsetFactor = 3; far.material.polygonOffsetUnits = 3;     // the canvas lies just under the real staves
  // near staves: real bevelled geometry in a window that follows the camera
  const N = 140, M = Math.round(34 * detail / 2) * 2, LEN = 51, w = SEA.stave, prof = [[-w / 2, -0.045], [-w / 2 + 0.028, 0], [w / 2 - 0.028, 0], [w / 2, -0.045]];
  const np = new Float32Array(N * (M + 1) * 4 * 3), ni = new Float32Array(N * (M + 1) * 4), nc = new Float32Array(N * (M + 1) * 4 * 2), nidx = [];
  let v = 0;
  for (let i = 0; i < N; i++) for (let m = 0; m <= M; m++) for (let p = 0; p < 4; p++, v++) {
    np[v * 3] = -LEN / 2 + (LEN * m) / M; ni[v] = i; nc[v * 2] = prof[p][0]; nc[v * 2 + 1] = prof[p][1];
    if (m < M && p < 3) { const a = v, b = v + 4, c = v + 1, d = v + 5; nidx.push(a, c, b, b, c, d); }
  }
  const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.BufferAttribute(np, 3)); ng.setAttribute('aIdx', new THREE.BufferAttribute(ni, 1));
  ng.setAttribute('aC', new THREE.BufferAttribute(nc, 2)); ng.setIndex(nidx);
  const near = new THREE.Mesh(ng, mk(true)); near.frustumCulled = false;
  const WRAP = w * 16384;
  return {
    far, near, uniforms: U, dir: 1,          // dir -1: the tambour runs the other way (the rare event)
    // camC: camera in the course frame
    update(time, camC, dt = 0) {
      // how fast the sheet slides under the eye, in metres per 1/60 s (eased; a change of camera is not a speed)
      if (dt > 1e-4 && this._z !== undefined) { const v = Math.min(40, Math.abs((camC.z - this._z) / dt - SEA.draw * this.dir)) / 60; U.uRel.value += (v - U.uRel.value) * Math.min(1, dt * 3); }
      this._z = camC.z;
      const drawn = (((SEA.draw * time * this.dir) % WRAP) + WRAP) % WRAP; U.uDrawn.value = drawn; U.uSeaT.value = time * this.dir;
      const s0 = Math.min(SEA.flat - N * w - 4, Math.max(-3, camC.z - 23.5)), k = Math.floor((s0 - drawn) / w), seg = 18;      // (the window is 49 m by 51 m: real staves are drawn only inside uNearR <= 21 m of the eye)
      const xc = Math.max(-SEA.halfWidth + LEN / 2, Math.min(SEA.halfWidth - LEN / 2, Math.round(camC.x / seg) * seg)) + 0.5 * LEN / M;      // vertex rows at +-0.75, +-2.25 ...: none on the course
      U.uWinK.value = k; U.uWin.value.set(k * w + drawn, (k + N) * w + drawn, xc, LEN / 2);
      U.uNearR.value = Math.min(21, Math.max(8, Math.sqrt(44 * Math.max(1.5, camC.y))));      // a real stave is 3 px or more inside this
    },
  };
}

// ---------------------------------------------------------------- joinery: runners, scroll ends, lip and handle rail
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// point on the sheet (course frame) at arc length s, offset h along the sheet normal
function sheetPt(s, x, h) { const th = Math.min(SEA.lipAngle + 0.25, Math.max(0, (s - SEA.flat) / SEA.R)), c = Math.cos(th), sn = Math.sin(th); return V3(x, SEA.R * (1 - c) + h * c, Math.min(s, SEA.flat) + SEA.R * sn - h * sn); }
// "a round thing is a row of graded strips": species by how a face stands to the sun
function gradeSpecies(n, sun, warm = 0) {
  const d = n.dot(sun);
  return d > 0.62 ? 0 : d > 0.3 ? (warm ? 2 : 1) : d > 0.02 ? (warm ? 3 : 2) : d > -0.3 ? 4 : d > -0.65 ? 5 : 7;
}
async function buildJoinery(ctx, pb, rng, sun) {
  const S = SPECIES, HW = SEA.halfWidth, PIECE = 36, SUB = 4;
  // --- the two runners the sheet slides in: rosewood, a holly string let into the top, walnut below
  for (const side of [1, -1]) {
    const x0 = side * (HW - 1.5), x1 = side * (HW + 26), xs = [x0, x0 + side * 7, x0 + side * 8.4, x1], PR = 12;
    let alt = 0;
    for (let sa = -12; sa < SEA.len + 8; sa += PIECE, alt++) {
      const sb = Math.min(sa + PIECE, SEA.len + 8), rail = (x, h) => { const a = []; for (let i = 0; i <= SUB; i++) a.push(sheetPt(sa + ((sb - sa) * i) / SUB, x, h)); return a; };
      const flip = side > 0, st = (A, B, o) => (flip ? pb.strip(A, B, o) : pb.strip(B, A, o));
      st(rail(xs[0], PR), rail(xs[1], PR), { sp: S.rosewood, ang: alt % 2 ? 0.0 : 0.5 });
      st(rail(xs[1], PR), rail(xs[2], PR), { sp: S.holly });
      st(rail(xs[2], PR), rail(xs[3], PR), { sp: alt % 2 ? S.rosewood : S.walnut, ang: alt % 2 ? 0.5 : 0.0 });
      st(rail(xs[0], 3.4), rail(xs[0], PR), { sp: S.rosewood, ang: alt % 2 ? 1.57 : 0 });          // inner cheek above the sea
      st(rail(xs[0], 2.2), rail(xs[0], 3.4), { sp: S.ebony });                                        // ebony string
      st(rail(xs[0], -14), rail(xs[0], 2.2), { sp: S.bogoak, scorch: 1 });                           // the groove the sheet runs in
      st(rail(xs[3], PR), rail(xs[3], -2), { sp: alt % 2 ? S.walnut : S.rosewood });
      st(rail(xs[3], -2), rail(xs[3], -14), { sp: S.bogoak });
      st(rail(xs[3], -14), rail(xs[0], -14), { sp: S.walnut, ang: 1.57 });
    }
    await ctx.yield();
    // --- scroll end: a turned roundel where the lip meets the runner, rings of graded wedges
    const c0 = sheetPt(SEA.len + 6, 0, -3), RO = 46, NW = 24, xin = side * (HW - 4), xout = side * (HW + 32);
    const ringR = [0, 10, 13, 29, 33, RO], ringSp = [S.holly, S.ebony, -1, S.holly, S.rosewood];
    for (const xf of [xin, xout]) for (let r = 0; r < 5; r++) for (let k = 0; k < NW; k++) {
      const a0 = (k / NW) * Math.PI * 2, a1 = ((k + 1) / NW) * Math.PI * 2, P = (rr, a) => V3(xf, c0.y + rr * Math.cos(a), c0.z + rr * Math.sin(a));
      const sp = ringSp[r] >= 0 ? ringSp[r] : (k % 2 ? S.pear : S.walnut);
      const q = [P(ringR[r], a0), P(ringR[r], a1), P(ringR[r + 1], a1), P(ringR[r + 1], a0)];
      if (r === 0) pb.quad(q[3], q[2], q[1], q[0], { sp, ang: 1.57 }); else pb.quad(q[0], q[1], q[2], q[3], { sp, ang: r === 2 ? 1.57 : 0 });
    }
    for (let k = 0; k < NW; k++) {                                                                     // the rim, graded round
      const a0 = (k / NW) * Math.PI * 2, a1 = ((k + 1) / NW) * Math.PI * 2, am = (a0 + a1) / 2, n = V3(0, Math.cos(am), Math.sin(am));
      const P = (x, a) => V3(x, c0.y + RO * Math.cos(a), c0.z + RO * Math.sin(a));
      pb.quad(P(xin, a0), P(xout, a0), P(xout, a1), P(xin, a1), { sp: gradeSpecies(n, sun, 1), ang: k % 2 ? 0 : 1.57 });
    }
  }
  await ctx.yield();
  // --- the lip: a batten across the end of the sheet, and the turned handle rail standing off it on posts
  const sl = SEA.len, lipN = 40, e = sheetPt(sl, 0, 0), eT = sheetPt(sl + 1, 0, 0).sub(e).normalize(), eN = sheetPt(sl, 0, 1).sub(e).normalize();
  const lipSec = [[-1, -6], [-1, 6], [5, 9], [12, 6], [12, -6]];      // (along s, along normal)
  for (let i = 0; i < lipN; i++) {
    const xa = -HW + (2 * HW * i) / lipN, xb = -HW + (2 * HW * (i + 1)) / lipN;
    for (let k = 0; k < lipSec.length; k++) {
      const p = lipSec[k], q = lipSec[(k + 1) % lipSec.length], P = (x, u) => V3(x, e.y, e.z).addScaledVector(eT, u[0]).addScaledVector(eN, u[1]);
      const n = V3().crossVectors(V3(1, 0, 0), P(0, q).sub(P(0, p))).normalize();
      pb.quad(P(xa, p), P(xb, p), P(xb, q), P(xa, q), { sp: k === 4 ? S.bogoak : (i + k) % 2 ? S.rosewood : gradeSpecies(n, sun, 1) === 0 ? S.pear : S.walnut, ang: (i + k) % 2 ? 0 : 0.35 });
    }
  }
  // handle rail: lathe profile along x, NF facets, each facet a graded strip
  const railC = V3(0, e.y, e.z).addScaledVector(eT, 5).addScaledVector(eN, 29), NF = 12, BAY = (2 * HW) / 10;
  const prof = [[0, 7.2], [4, 7.2], [5.5, 4.8], [8, 6.4], [10.5, 4.4], [20, 4.9], [BAY / 2 - 8, 5.8], [BAY / 2 - 4.5, 7.4], [BAY / 2, 7.9]];
  const stations = []; for (let b = 0; b < 10; b++) { const xb = -HW + b * BAY; for (const p of prof) stations.push([xb + p[0], p[1]]); for (let k = prof.length - 2; k >= 1; k--) stations.push([xb + BAY - prof[k][0], prof[k][1]]); } stations.push([HW, 7.2]);
  const ring = (st, k) => { const a = (k / NF) * Math.PI * 2; return V3(st[0], railC.y, railC.z).addScaledVector(eT, st[1] * Math.cos(a)).addScaledVector(eN, st[1] * Math.sin(a)); };
  for (let k = 0; k < NF; k++) {
    const am = ((k + 0.5) / NF) * Math.PI * 2, n = V3().addScaledVector(eT, Math.cos(am)).addScaledVector(eN, Math.sin(am)), sp = gradeSpecies(n, sun, 1);
    for (let i = 0; i + 1 < stations.length; i += 4) { const A = [], B = []; for (let j = i; j <= Math.min(i + 4, stations.length - 1); j++) { A.push(ring(stations[j], k)); B.push(ring(stations[j], k + 1)); } pb.strip(A, B, { sp }); }
    if (k % 4 === 3) await ctx.yield();
  }
  for (let b = 0; b <= 10; b++) for (let k = 0; k < 8; k++) {                                          // posts
    const x = -HW + b * BAY + (b === 0 ? 2 : b === 10 ? -2 : 0), a0 = (k / 8) * Math.PI * 2, a1 = ((k + 1) / 8) * Math.PI * 2, am = (a0 + a1) / 2;
    const n = V3(Math.cos(am), 0, 0).addScaledVector(eT, Math.sin(am)), sp = gradeSpecies(n, sun, 0);
    const P = (a, hgt, r) => V3(x + r * Math.cos(a), e.y, e.z).addScaledVector(eT, 5 + r * Math.sin(a)).addScaledVector(eN, hgt);
    const hs = [8, 11.5, 14.5, 17.5, 23.5], rs = [5.6, 3.2, 4.6, 3.0, 4.2], A = hs.map((h, j) => P(a0, h, rs[j])), B = hs.map((h, j) => P(a1, h, rs[j]));
    pb.strip(A, B, { sp });
  }
  return { lip: e, lipT: eT, lipN: eN, railC };
}

// ---------------------------------------------------------------- the caravel (ship frame: +X bow, +Y up, waterline y = 0)
// Cut off at the waterline like an inlay standing on the board: the sea is opaque wood. 30 m long at scale 1.
export function buildCaravel(pb, rng) {
  const S = SPECIES, NS = 14, NK = 7, L = 30;
  const beam = (t) => 4.5 * Math.min(1, 0.62 + 2.1 * t) * Math.pow(Math.max(0, 1 - Math.pow(t, 2.6)), 0.8) + 0.12;
  const sheer = (t) => 3.1 + 3.4 * (1 - t) * (1 - t) * (1 - t) + 1.9 * t * t * t;
  const hp = (t, v, side) => V3(-L / 2 + L * t + 2.8 * v * t * t - 1.3 * v * (1 - t) * (1 - t), sheer(t) * v, side * beam(t) * (0.7 + 0.3 * Math.pow(v, 0.6)));
  const lit = [S.walnut, S.walnut, S.pear, S.walnut, S.pear, S.ebony, S.oak], shade = [S.bogoak, S.bogoak, S.walnut, S.rosewood, S.walnut, S.ebony, S.pear];
  for (const side of [1, -1]) for (let j = 0; j < NK; j++) {
    const off = (j * 3) % 5; let i0 = 0;                                   // planks butt at staggered stations
    while (i0 < NS) {
      const i1 = Math.min(NS, i0 === 0 ? 3 + off : i0 + 5), A = [], B = [];
      for (let i = i0; i <= i1; i++) { A.push(hp(i / NS, j / NK, side)); B.push(hp(i / NS, (j + 1) / NK, side)); }
      side > 0 ? pb.strip(A, B, { sp: lit[j], ang: 0.03 * (j % 3 - 1) }) : pb.strip(B, A, { sp: shade[j], ang: 0.03 * (j % 3 - 1) });
      i0 = i1;
    }
  }
  for (let j = 0; j < NK; j++) pb.quad(hp(0, j / NK, -1), hp(0, j / NK, 1), hp(0, (j + 1) / NK, 1), hp(0, (j + 1) / NK, -1), { sp: j === 4 ? S.holly : j % 2 ? S.pear : S.walnut });   // transom
  for (let i = 0; i < NS; i++) {                                            // deck: oak planks, a holly king plank
    const d = (t, side, f) => { const p = hp(t, 0.88, side); p.z *= f; return p; };
    for (const [f0, f1, sp] of [[-1, -0.18, S.oak], [-0.18, 0.18, S.holly], [0.18, 1, S.oak]]) pb.quad(d(i / NS, 1, f0), d((i + 1) / NS, 1, f0), d((i + 1) / NS, 1, f1), d(i / NS, 1, f1), { sp, ang: i % 2 ? 0 : 0.06 });
  }
  // sterncastle and a low forecastle: panelled boxes with alternating grain
  const box = (x, y, z, sx, sy, sz, o) => pb.block(new THREE.Matrix4().makeTranslation(x, y, z), sx, sy, sz, o);
  box(-11.2, sheer(0.12) + 1.2, 0, 6.4, 2.6, 6.6, { sp: S.pear, top: S.oak, ends: S.walnut, sides: S.pear });
  box(-11.2, sheer(0.12) + 2.7, 0, 7.0, 0.4, 7.2, { sp: S.ebony, top: S.oak, sides: S.ebony });
  for (const z of [-3.32, 3.32]) for (const x of [-12.8, -11.2, -9.6]) box(x, sheer(0.12) + 1.3, z, 0.9, 1.1, 0.06, { sp: S.holly, sides: S.holly });      // windows as holly inlays
  box(11.6, sheer(0.9) + 0.5, 0, 4.4, 1.0, 3.6, { sp: S.walnut, top: S.oak, sides: S.rosewood });
  box(-15.5, 2.0, 0, 1.3, 4.0, 0.3, { sp: S.walnut, sides: S.walnut, ends: S.ebony });                     // rudder
  // masts and yards: four-sided, tapered, one face light and one dark
  const spar = (a, b, r0, r1, spL, spD) => {
    const ax = V3().subVectors(b, a).normalize(), u = V3().crossVectors(ax, Math.abs(ax.z) > 0.9 ? V3(0, 1, 0) : V3(0, 0, 1)).normalize(), w = V3().crossVectors(ax, u);
    for (let k = 0; k < 4; k++) { const d0 = [u, w, u.clone().negate(), w.clone().negate()][k], d1 = [w, u.clone().negate(), w.clone().negate(), u][k];
      pb.quad(a.clone().addScaledVector(d0, r0), b.clone().addScaledVector(d0, r1), b.clone().addScaledVector(d1, r1), a.clone().addScaledVector(d1, r0), { sp: k < 2 ? spL : spD }); }
  };
  const dk = sheer(0.5) * 0.88, masts = [[1.5, 27, 0.55, 15, 0.52], [9.5, 20, 0.45, 11, 0.5]];
  // square sails on main and fore: vertical cloths of sycamore and holly, bellied forward and breathing
  for (const [mx, mh, mr, sw, top] of masts) {
    spar(V3(mx, dk, 0), V3(mx, mh, 0), mr, mr * 0.45, S.pear, S.walnut);
    const yTop = mh * 0.9, yFoot = dk + 2.6, NC = 6, NV = 6, belly = sw * 0.2;
    spar(V3(mx + 0.5, yTop, -sw / 2 - 0.8), V3(mx + 0.5, yTop, sw / 2 + 0.8), 0.34, 0.34, S.rosewood, S.ebony);
    const sp = (ci, vi) => { const zc = -0.5 + ci / NC, v = vi / NV, wd = sw * (1 - 0.1 * v); return V3(mx + 0.9 + belly * Math.sin(Math.PI * Math.min(1, v * 1.08)) * (1 - 1.6 * zc * zc), yTop + (yFoot - yTop) * v, zc * wd); };
    for (let c = 0; c < NC; c++) { const A = [], B = []; for (let v = 0; v <= NV; v++) { A.push(sp(c + 1, v)); B.push(sp(c, v)); } pb.strip(A, B, { sp: c % 2 ? S.holly : S.sycamore, move: sw * 0.045 }); }
    const pA = [], pB = []; for (let i = 0; i <= 3; i++) { pA.push(V3(mx + i * 1.5, mh - 0.2 - i * 0.12, 0)); pB.push(V3(mx + i * 1.5, mh - 1.3 + i * 0.1, 0)); }
    pb.strip(pA, pB, { sp: top > 0.51 ? S.pear : S.holly, move: 0.5 });                                    // pennant
  }
  // lateen mizzen
  const y0 = V3(-13.5, sheer(0.12) + 4.5, 0.5), y1 = V3(-4.5, sheer(0.12) + 16, 0.5);
  spar(V3(-9.5, sheer(0.12) + 2.9, 0), V3(-9.5, sheer(0.12) + 13, 0), 0.4, 0.22, S.pear, S.walnut); spar(y0, y1, 0.28, 0.2, S.rosewood, S.ebony);
  for (let c = 0; c < 4; c++) {
    const A = [], B = [], edge = (f, v) => { const top = V3().lerpVectors(y0, y1, f), foot = V3(-13.5 + 3 * f, sheer(0.12) + 4.2, 0.5); const p = V3().lerpVectors(top, foot, v); p.z += 1.6 * Math.sin(Math.PI * v) * Math.sin(Math.PI * Math.min(1, f + 0.15)); return p; };
    for (let v = 0; v <= 4; v++) { A.push(edge((c + 1) / 4, v / 4)); B.push(edge(c / 4, v / 4)); }
    pb.strip(A, B, { sp: c % 2 ? S.sycamore : S.holly, move: 0.35 });
  }
  return pb;
}

// ships carried up the curve on the staves they sit on: stern first, hinging up from the sheet like an inlay
function makeCurveShips(style, geo, mat, rng, seaU, side = 1) {
  // four ships 160 m apart, so one is always low on the curve where the quay sees her whole (bow down the slope, sails
  // full toward us) and one always stands high under the roll; they alternate sides of the centre line
  // round 7: the four ships on the curve 1.5 times as large (a number tuned on the whole wall for no still, after a plain look in
  // which four of four strangers preferred it): 30 m of hull at 4.2 times CURVE_GROW; their inlaid shadows read SCALE and grow with them.
  // She is carried stern first, so the whole loop is moved back down the sheet by the extra reach of her leading end (LEAD: the stern,
  // the model's -x end, 16.3 m of model from her middle by the geometry's bounds, times the scale she gained: 34.2 m), and her stern
  // keeps live's place against the lip, the batten, the rail and the posts to within 6 m of the loop (a rigid hull in a hollow of
  // 260 m: her keel's end comes to the lip's line 3.4 m later than live's, the top of her taller transom 5.5 m sooner)
  const CURVE_GROW = 1.5, SCALE = 4.2 * CURVE_GROW, LEAD = -new THREE.Box3().setFromBufferAttribute(geo.getAttribute('position')).min.x;
  const N = 4, GAP = 160, SPAN = N * GAP, S0 = SEA.flat - 70 - LEAD * (SCALE - 4.2), group = new THREE.Group(), ships = [];
  const x3 = [rng.range(-150, -40), rng.range(60, 190), rng.range(-260, -170)];
  // all four keels stand at |x| 205-315 m (since round 7 an upright ship reaches in to 154 m, where the outer third of the wall
  // begins at 183 m), so from the mole the ring is seen against plain
  // travelling staves and bands of sheen
  const xs = [205 + (-x3[0] - 40) * 0.6, -(215 + (x3[1] - 60) * 0.6), 250 + (-x3[2] - 170) * 0.7, -(232 + 0.3 * (x3[1] + x3[0] + 90))];
  for (let i = 0; i < N; i++) { const m = new THREE.Mesh(geo, mat); m.matrixAutoUpdate = false; m.frustumCulled = false; group.add(m); ships.push(m); }
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), P = new THREE.Vector3(), sw = {}, cv = {}, q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), sc = new THREE.Vector3(), M = new THREE.Matrix4();
  const state = [];
  return {
    group, state, dir: 1,
    update(time) {
      for (let i = 0; i < N; i++) {
        const tr = (((i * GAP + SEA.draw * time * this.dir) % SPAN) + SPAN) % SPAN, s = S0 + tr, x = xs[i];
        seaCurveJS(s, cv); swellJS(s, x, time * this.dir, sw);
        const th = cv.th + Math.atan(sw.slope) * 0.8, c = Math.cos(cv.th), sn = Math.sin(cv.th);
        P.set(x, cv.y + sw.h * c, cv.z - sw.h * sn);
        X.set(0, -Math.sin(th), -Math.cos(th)); Y.set(0, Math.cos(th), -Math.sin(th)); Z.crossVectors(X, Y);
        M.makeBasis(X, Y, Z); q.setFromRotationMatrix(M);
        // 1 upright .. 0 lying flat in the sheet (as she is born on the flat, and as she goes over the lip)
        const up = Math.min(smooth01(tr / 18), 1 - smooth01((tr - (SPAN - 30)) / 22));
        q2.setFromAxisAngle(X.set(0, 1, 0), (x < 0 ? 0.32 : -0.32) * up); q.multiply(q2);        // a quarter turned, so the quay sees her strakes
        q2.setFromAxisAngle(X.set(1, 0, 0), (1 - up) * Math.PI * 0.5 + 0.05 * Math.sin(time * 0.6 + i * 2.1) * up); q.multiply(q2);
        // (13) AT THE LIP SHE CLOSES INTO THE SHEET. A rigid hull lying flat is a tangent of the hollow, not a part of it: at the
        // loop's end her ends stood off the sheet (to 20 m behind its circle) and her stern passed the lip's end by 27 m of arc,
        // a block to 70 m across above the rail against the sky. So as she lies down there (and only there: her birth on the flat
        // is as it was) every measure of her shrinks by the lying down's own law, the one her beam has.
        const lip = 0.04 + 0.96 * (1 - smooth01((tr - (SPAN - 30)) / 22));
        sc.set(SCALE * lip, SCALE * lip, SCALE * lip * (0.04 + 0.96 * up));
        ships[i].matrix.compose(P, q, sc); ships[i].matrixWorldNeedsUpdate = true;
        state[i] = { s, x, theta: cv.th, up, tr };
      }
      // three shadow slots for four ships: the one nearest the lip has none. Round 11: the shadow of the ship about to be nearest
      // the lip sinks with the lying down of the ship ahead of her (it rides that ship's own `up`, the loop's state, no number of its
      // own), so that no shadow is given up, or taken, in one frame when the slots are dealt anew as a ship goes over the lip
      let top = 0; for (let i = 1; i < N; i++) if (state[i].tr > state[top].tr) top = i;
      seaU.uShSide.value = side;
      for (let k = 1; k < N; k++) {
        const st = state[(top + k) % N];
        seaU.uShadow.value[k - 1].set(st.x, st.s, 26 * SCALE * st.up * (k === N - 1 ? state[top].up : 1), -15 * SCALE);      // keel, her middle, shadow height, half length (bow down the slope)
      }
    },
  };
}
const smooth01 = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- the exit: a boxwood mazzocchio on a round bastion
// (course frame; ring centre at `at`, its axis along the course). Opening radius 7.5 m for the 14 m portal.
function buildRingAndBastion(pb, rng, sun, at) {
  const S = SPECIES, NSEG = 24, NF = 8, RM = 9.15, rm = 1.65, top = 1.3, BR = 13;
  const tp = (i, k) => { const a = (i / NSEG) * Math.PI * 2 + Math.PI / NSEG, b = (k / NF) * Math.PI * 2 + Math.PI / NF, r = RM + rm * Math.cos(b); return V3(at.x + r * Math.sin(a), at.y + r * Math.cos(a), at.z + rm * Math.sin(b)); };
  for (let i = 0; i < NSEG; i++) for (let k = 0; k < NF; k++) {
    const q = [tp(i, k), tp(i + 1, k), tp(i + 1, k + 1), tp(i, k + 1)], n = V3().crossVectors(q[1].clone().sub(q[0]), q[3].clone().sub(q[0])).normalize();
    const lit = n.dot(sun) > 0.05;
    pb.quad(q[0], q[1], q[2], q[3], { sp: (i + k) % 2 ? S.boxwood : lit ? S.ebony : S.bogoak, ang: (i + k) % 4 < 2 ? 0 : 1.57 });
  }
  // cradle: two turned cheeks under the ring
  for (const sx of [-1, 1]) pb.block(new THREE.Matrix4().makeTranslation(at.x + sx * 5.6, top + 1.0, at.z), 3.2, 2.0, 4.6, { sp: S.pear, top: S.holly, sides: sx > 0 ? S.pear : S.walnut, ends: S.rosewood });
  // bastion drum: graded strips round it, an ebony and holly string, a parquet fan on top
  const NB = 28, y0 = -1.2, bands = [[y0, 0.2, -1], [0.2, 0.55, S.ebony], [0.55, top - 0.25, -1], [top - 0.25, top, S.holly]];
  for (let k = 0; k < NB; k++) {
    const a0 = (k / NB) * Math.PI * 2, a1 = ((k + 1) / NB) * Math.PI * 2, am = (a0 + a1) / 2, n = V3(Math.sin(am), 0, Math.cos(am));
    const P = (a, y, r = BR) => V3(at.x + r * Math.sin(a), y, at.z + r * Math.cos(a));
    for (const [ya, yb, sp] of bands) pb.quad(P(a0, ya), P(a1, ya), P(a1, yb), P(a0, yb), { sp: sp >= 0 ? sp : gradeSpecies(n, sun, 1), ang: sp >= 0 ? 0 : 1.57 });
    const rr = [0, 4.5, 5.1, 9.6, 10.2, BR], rs = [S.pear, S.ebony, -1, S.ebony, S.oak];
    for (let r = 0; r < 5; r++) {
      const sp = rs[r] >= 0 ? rs[r] : (k % 2 ? S.holly : S.walnut), q = [P(a0, top, rr[r]), P(a1, top, rr[r]), P(a1, top, rr[r + 1]), P(a0, top, rr[r + 1])];
      if (r === 0) pb.quad(q[2], q[3], q[0], q[1], { sp, ang: 1.57 }); else pb.quad(q[1], q[0], q[3], q[2], { sp, ang: r === 2 ? 1.57 : 0 });
    }
    // the ring's inlaid shadow on the bastion floor, to the right of it: bog oak, scorched
    if (k === 0) pb.quad(V3(at.x - 3.5, top + 0.02, at.z - 1.9), V3(at.x - 3.5, top + 0.02, at.z + 2.1), V3(at.x - 11.8, top + 0.02, at.z + 4.4), V3(at.x - 11.8, top + 0.02, at.z + 0.4), { sp: S.bogoak, scorch: 1 });
  }
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const ownStyle = !opts.style, style = opts.style || await createStyle(ctx, { palette: opts.palette, exposure: opts.exposure });
  const rng = ctx.rng.fork('roll-top-hero');
  const courseFrame = opts.frame === 'course';
  const object = new THREE.Group(), inner = new THREE.Group(); object.add(inner);
  if (!courseFrame) { inner.rotation.y = Math.PI; inner.position.set(0, 0, (SEA.flat + SEA.R) / 2); }
  inner.updateMatrix();
  const toLocal = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(inner.matrix);
  const dirLocal = (x, y, z) => new THREE.Vector3(x, y, z).transformDirection(inner.matrix);

  await ctx.yield();
  const sea = buildSeaMeshes(style, detail, rng);
  inner.add(sea.far, sea.near);
  await ctx.yield();
  const parts = [];           // { update(time, drawn) }
  const sunC = SUN_COURSE.clone(), pb = style.builder();
  const lipInfo = await buildJoinery(ctx, pb, rng, sunC);
  const ringAt = new THREE.Vector3(0, 12, opts.ringZ ?? 285);
  if (opts.ring !== false) buildRingAndBastion(pb, rng, sunC, ringAt);
  await ctx.yield();
  const joinery = new THREE.Mesh(pb.build(), style.pieceMaterial()); joinery.frustumCulled = false; inner.add(joinery);
  const pieceMat = joinery.material, shipPb = style.builder();
  buildCaravel(shipPb, rng.fork('caravel'));
  const shipGeo = shipPb.build();
  const farGeo = shipGeo.clone(), fsr = farGeo.getAttribute('aSr').clone(), paler = [0, 1, 1, 1, 2, 3, 6, 4, 8, 9];      // walnut -> oak, pear and oak -> sycamore, rosewood -> pear, bog oak -> walnut
  for (let i = 0; i < fsr.count; i++) fsr.setX(i, paler[Math.round(fsr.getX(i))]);
  farGeo.setAttribute('aSr', fsr);
  await ctx.yield();
  await ctx.yield();
  const curveShips = makeCurveShips(style, farGeo, pieceMat, rng, sea.uniforms, opts.sunSide ?? 1);
  inner.add(curveShips.group); parts.push(curveShips);

  const camW = new THREE.Vector3(), camC = new THREE.Vector3(), sunW = new THREE.Vector3(), m3 = new THREE.Matrix3();
  const lipC = lipInfo.lip, P = (x, y, z) => toLocal(x, y, z), tmpS = {};
  const anchors = {
    // where the 14 m portal sits (centre) and the way it faces (back toward the quay, against the course)
    portalSeat: { position: P(ringAt.x, ringAt.y, ringAt.z), facing: dirLocal(0, 0, -1), radius: 7 },
    // the brief's line over the sea: quay edge, down to 3 m over the staves, up to 12 m, last 60 m straight to the ring
    flyThrough: [P(0, 5, -8), P(0, 3.4, 26), P(0, 3, 70), P(0, 3, 150), P(0, 7, 195), P(0, 12, 225), P(0, 12, 255), P(0, 12, ringAt.z)],
    quayEdge: { position: P(0, 0, 0), seaward: dirLocal(0, 0, 1), port: dirLocal(1, 0, 0) },
    viewpoints: { lowOnStaves: P(0, 3, 110), lookUpFrom: P(0, 3, 170), frontFar: P(0, 60, -220) },
    poiCurve: P(0, 150, SEA.flat + 225),            // where the gaze should lift to (the ship on the curve passes here)
    poiLip: P(0, lipC.y, lipC.z), wallFoot: P(0, 0, SEA.flat), wallFace: P(0, SEA.R, SEA.flat + SEA.R),
    runnerPort: P(SEA.halfWidth, 0, 0), runnerStarboard: P(-SEA.halfWidth, 0, 0),
    grooves: sea.uniforms.uGroove.value.map((x) => P(x, 0, 0)),     // the six routed grooves (lines of constant x) for caravels
    sun: dirLocal(SUN_COURSE.x, SUN_COURSE.y, SUN_COURSE.z),
  };
  const hero = {
    object, inner, style, sea: sea.uniforms, anchors,
    radius: 400, height: 440, center: toLocal(0, 150, SEA.flat - 100),     // radius frames the viewer's orbit; the true half-extent is about 700 m
    ground: false, groundY: 0,
    curveShips: curveShips.state,                  // live [{ s, x, theta, up, tr }] of the four ships on the curve
    // a caravel mesh (30 m, ship frame +X bow, +Y up, waterline y 0) sharing the hero's geometry and material
    makeCaravel() { return new THREE.Mesh(shipGeo, pieceMat); },
    // sea surface in the course frame: height of the sheet at (x, z) on the flat, at world time `time`
    seaHeight(x, z, time) { return swellJS(z, x, time * sea.dir, tmpS).h * (sea.uniforms.uSwell.value / SEA.swellH); },
    // 1 = drawn out and up the runners (default); -1 = the tambour reverses (the lid comes down)
    setDraw(dir) { sea.dir = dir < 0 ? -1 : 1; curveShips.dir = sea.dir; },
    // inlaid shadow of a ship on the sea (slots 3-11 are free; 0-2 are the curve ships): keel x, z of her middle (course),
    // height of the shadow (about her mast, 0 = none), half length (negative: bow toward the quay)
    setSeaShadow(x, z, height, halfLen, slot = 3) { sea.uniforms.uShadow.value[slot].set(x, z, height, halfLen); },
    setSwell(h) { sea.uniforms.uSwell.value = h; },       // 0.2 flat calm .. 0.9 default .. 1.8 a blow
    setProgress(u) { progress = u; },                     // nothing in the hero is timed to arrival; kept for the contract
    update(dt, time, camera) {
      style.uniforms.uTime.value = time;
      inner.updateWorldMatrix(true, false);
      if (camera) camW.setFromMatrixPosition(camera.matrixWorld); else camW.set(0, 10, 0);
      camC.copy(camW); inner.worldToLocal(camC);
      if (ownStyle) { m3.setFromMatrix4(inner.matrixWorld); style.uniforms.uSun.value.copy(sunW.copy(SUN_COURSE).applyMatrix3(m3).normalize()); }
      sea.update(time, camC, dt);
      for (const p of parts) p.update(time, dt);
    },
    dispose() { if (ownStyle) style.uniforms.uGrain.value.dispose(); },
  };
  let progress = 0;
  return hero;
}
