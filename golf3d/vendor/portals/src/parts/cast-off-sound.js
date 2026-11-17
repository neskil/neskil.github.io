// CAST OFF / hero set piece: THE NEEDLES, casting off. Two turned wooden needles 300 m long, points held up and
// crossed (a plain X from the crest). The headland (a ribbed, bellied cliff 200 m wide) is FINISHED and its last row is
// being cast off: left of the crossing the live loops still sit on the left needle; right of it each loop has been
// passed over and laid down as a link of the cast-off chain, which hangs free along the top edge, drooping to the
// selvedge where the red waste yarn marks the start. One working strand runs taut from the working needle's point to a
// yarn ball the size of a hill (seven belts of real fat yarn wound over one another at fixed, well-separated slants),
// which turns as it pays out. Ends not darned in stand off the face. Everything is hand knitting in chunky wool: unlit
// ShaderMaterials that share one wool routine; colours are written as they are (the world sets post.flat = 1).
//
// HOW IT WORKS (one clock, uClock = loops cast off so far, 0..30; the world drives it from the flight)
//   The crossing travels once along the top, right to left. At the crossing the working needle thrusts through the
//   next loop and dips, the loop lifts, is passed over and flips down into the chain; a tug runs down that rib and a
//   ring of cream foam spreads where it reaches the surf. Both needles slide with the crossing.
//
// EXPORTS FOR THE WORLD CODER (shade the whole world with these)
//   PALETTE            the brief's seven hexes (+ black #2A2522 inside).
//   STYLE.uniforms     shared uniform objects: uTime, uExposure (SET to post.exposure), uSunDir (world, toward the
//                      sun patch), uWind (world, unit, leeward), uGale, uFuzz (3 = mohair day), uPale (max mix to
//                      cream, e-fold metres: the distance rule), uCream, uCool. The hero's update() writes uTime.
//   WOOL_GLSL          fragment chunk: toScene (display colour -> scene value), stitchField (knit V / purl bump
//                      lattice with <3 px flat-tint fallback), woolShade / woolShadeR (wrapped sun, cool shade lot,
//                      deeper dye-lot in recesses, pale halo, paler with distance), yarnShade / yarnPly for tubes.
//   FABRIC_GLSL        fabricShade(base, uvStitches, pattern, yarnRadius, N, worldPos, extraRecess).
//   WIND_GLSL          vertex chunk: uTime, uWind, uGale, uFuzz, gust(worldPos).
//   woolMaterial({vertexShader, fragmentShader, uniforms, ...})  any material in the style (chunks + shared uniforms).
//   fabricMaterial({pattern, stitch, color, stripe, stripeColor, scroll, vertexColors})  knitted ground: garter sea,
//                      stocking hill, k2p2 cliff, moss turf; uv in metres, displace the mesh yourself.
//   yarnTubeGeometry(points, radius, sides, closed) + yarnMaterial({color, plies, slide, vertexColors})  real yarn.
//   fuzzGeometry(list) + fuzzMaterial({anchor})  fuzz fin cards that lean leeward with the gusts.
//   woodMaterial({color, dark})  turned wood / horn (geometry lathed along +X).
//
// buildHero(ctx, opts) -> { object, radius 175, height 215, center, anchors, update, setProgress, setClock, crossing, uniforms }
//   opts.palette  seven hex strings in the brief's order.   opts.detail  0.6..1 thins fuzz and strand segments only.
//   Local frame: origin at the foot of the headland at sea level (y = 0 is the sea), fabric in the z = 0 plane
//   bellying toward +Z (the viewer), needles crossing near (x, 192, 0), knobs low at about x = -/+ 215, ball (64 m
//   radius, wound of 8 m strands) at about (-193, 34, 6) (anchors.ball). The piece brings no sea and no sky: it expects garter sea at y = 0 around it.
//   anchors (local): crossing; rotationY (object.rotation.y that puts the brief's crest on local +Z); viewpoints
//   (crest and under-the-needles, with lookAt); flyThrough (crest -> portal, > 40 m from every solid, freed strands
//   pass > 30 m overhead); portalSeat {position, facing} for the 14 m exit stitch; selvedgeTop / selvedgeFoot (the
//   live, right-hand edge where the red waste yarn hangs); hemLeft; ball, ballRadius, ballFeed; strandSources (three
//   live Vector3s: move them every frame to the Sound's unravelling edges, local space); knobLeft / knobRight.
//   setClock(loops) sets how many loops have been cast off (0..30; the world passes seconds of flight * 0.42);
//   setClock(-1) frees it (alone, the piece casts the whole row off in 50 s and starts again); setProgress(u, duration)
//   is the same keyed to u.
//   setDrop(rib, depth) ladders one rib from the needle down to `depth` metres (the rare dropped stitch; 0 mends it);
//   ribPoint(rib, depth, out) is the local point on that rib's face where the crochet hook should hold the loop.
//   Cost: about 85k triangles, 10 draw calls, 9 programs, no textures, no lights. Build about 100 ms, longest step < 40 ms.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

// ------------------------------------------------------------------------------------------------------------
// THE YARN: eight shades and no ninth. Brief order: cream, fawn, moorit, grey, indigo, light indigo, madder red;
// the eighth (black fleece) is fixed.
// ------------------------------------------------------------------------------------------------------------
export const PALETTE = ['#EFE6D2', '#C8A77E', '#6A4A33', '#8E9296', '#22406F', '#5F88B6', '#B8382A'];
const BLACK = '#2A2522', WOOD = '#B98B55', WOOD_DARK = '#7A5230', HORN = '#D9C7A0';

// One set of uniforms shared by every wool material in the world (pass these same objects to your own materials).
export const STYLE = {
  uniforms: {
    uTime: { value: 0 },
    uExposure: { value: 1.0 },                                   // set to the world's post.exposure (1.1)
    uSunDir: { value: new THREE.Vector3(0.82, 0.44, 0.37).normalize() },   // toward the sun patch of the shawl
    uWind: { value: new THREE.Vector3(-0.45, 0.0, -0.9).normalize() },     // the way the gale blows (leeward), unit xz
    uGale: { value: 1.0 },                                       // gust strength, 0.5 breeze .. 1 gale
    uFuzz: { value: 1.0 },                                       // 1 normal, 3 on a "mohair day"
    uPale: { value: new THREE.Vector2(0.5, 2400) },             // distance rule: max mix to cream, e-fold metres
    uCream: { value: new THREE.Color(PALETTE[0]) },              // what distance and fuzz fade toward
    uCool: { value: new THREE.Color('#DCE6EE') },                // the shawl's cool fill, multiplies the shade side
    uPxS: { value: 0.0027 },                                     // metres one pixel covers at one metre from the eye (the world and the hero keep it current)
  },
};

// Exact colour: the world returns post.flat = 1, so the engine skips its tone map and the linear colour a shader
// writes is the colour on screen. Wool colours are composed as THREE.Color values of the palette hexes and written
// as they are; toScene() only keeps them inside 0..1. (No inverse tone map anywhere.)
const TONE_GLSL = /* glsl */`
  uniform float uExposure;
  vec3 toScene(vec3 D){ return clamp(D, 0., 1.); }`;

// The one wool routine. All colours in and out are display-linear (THREE.Color values of the palette hexes).
//   stitchField(uv, pat, r)  uv in stitches (x = column, y = row, world-anchored), pat = pattern id
//                            (0 stocking, 1 garter, 2 k2p2 rib, 3 moss, 4 k1p1 rib, 5 reverse stocking),
//                            r = yarn radius in stitch widths (0.2 chunky). Returns vec4(height 0..1,
//                            recess 0..1, slope.xy): knit V legs or purl bumps, ply twist in the recess term,
//                            and under ~3 px per stitch the flat average, so nothing shimmers.
//   woolShade(base, N, V, recess, dist)   wrapped sun, cool fill, darker dye-lot in recesses, pale fuzz halo on
//                            edges that face the light, and the distance rule (paler toward cream, never fog).
//   yarnPly(uvTube, plies)   recess term for a real yarn tube: uv = (metres along / thickness, around 0..1).
export const WOOL_GLSL = /* glsl */`
  ${TONE_GLSL}
  uniform float uTime, uGale, uFuzz;
  uniform vec3 uSunDir, uWind, uCream, uCool;
  uniform vec2 uPale;
  const float TAU = 6.2831853;
  float hash11(float n){ return fract(sin(n*127.1 + 3.7)*43758.5453); }
  float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
    return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y); }
  // gusts: a travelling 0..1 field over the ground, used by every loose thing
  float gust(vec3 wp){ return 0.5 + 0.5*sin(dot(wp.xz, uWind.xz)*0.045 - uTime*2.3 + sin(wp.x*0.021 + uTime*0.7)*1.7); }
  float knitAt(vec2 cell, float pat){
    if (pat < 0.5) return 1.;
    if (pat < 1.5) return mod(cell.y, 2.) < 1. ? 1. : 0.;
    if (pat < 2.5) return mod(cell.x, 4.) < 2. ? 1. : 0.;
    if (pat < 3.5) return mod(cell.x + cell.y, 2.) < 1. ? 1. : 0.;
    if (pat < 4.5) return mod(cell.x, 2.) < 1. ? 1. : 0.;
    return 0.;
  }
  // one yarn segment: xy = offset from the yarn's centre line / r, z = roundness (0 outside), w = 0..1 along
  vec4 yarnSeg(vec2 p, vec2 a, vec2 b, float r){
    vec2 pa = p - a, ba = b - a; float t = clamp(dot(pa, ba)/max(dot(ba, ba), 1e-5), 0., 1.);
    vec2 o = (pa - ba*t)/r; float d2 = dot(o, o);
    return vec4(o, sqrt(max(1. - d2, 0.)), t);
  }
  vec4 stitchField(vec2 uv, float pat, float r){
    vec2 fw2 = fwidth(uv); float fw = max(fw2.x, fw2.y);
    float flat_ = smoothstep(0.16, 0.36, fw);
    vec2 cell = floor(uv), f = fract(uv);
    float k = knitAt(cell, pat), ka = knitAt(cell + vec2(0., 1.), pat);
    vec4 best = vec4(0.); float ply = 0.;
    if (k > 0.5) {
      vec4 s; float sg;
      s = yarnSeg(f, vec2(0.5, -0.32), vec2(0.14, 0.78), r); if (s.z > best.z) { best = s; ply = s.w*2.6 + s.x*0.35; }
      s = yarnSeg(f, vec2(0.5, -0.32), vec2(0.86, 0.78), r); if (s.z > best.z) { best = s; ply = s.w*2.6 - s.x*0.35; }
      if (ka > 0.5) {
        s = yarnSeg(f, vec2(0.5, 0.68), vec2(0.14, 1.78), r); if (s.z >= best.z*0.9 && s.z > 0.) { best = s; ply = s.w*2.6 + s.x*0.35; }
        s = yarnSeg(f, vec2(0.5, 0.68), vec2(0.86, 1.78), r); if (s.z >= best.z*0.9 && s.z > 0.) { best = s; ply = s.w*2.6 - s.x*0.35; }
      }
    } else {
      vec4 s;
      s = yarnSeg(f, vec2(-0.08, 0.52), vec2(0.5, 0.80), r); if (s.z > best.z) { best = s; ply = s.w*1.6 + s.y*0.35; }
      s = yarnSeg(f, vec2(1.08, 0.52), vec2(0.5, 0.80), r); if (s.z > best.z) { best = s; ply = s.w*1.6 - s.y*0.35; }
      s = yarnSeg(f, vec2(0.0, 0.30), vec2(0.5, 0.04), r); if (s.z > best.z) { best = s; ply = s.w*1.6 + s.y*0.35 + 0.5; }
      s = yarnSeg(f, vec2(1.0, 0.30), vec2(0.5, 0.04), r); if (s.z > best.z) { best = s; ply = s.w*1.6 - s.y*0.35 + 0.5; }
    }
    float gap = 1. - smoothstep(0., 0.45, best.z);                       // between the yarns: deepest dye-lot
    float twist = smoothstep(0.55, 0.95, abs(sin(ply*TAU)))*(1. - smoothstep(0.3, 0.7, fw*2.5))*0.45*step(0.001, best.z);
    float rec = max(gap, twist) + (1. - k)*0.18;
    vec4 o = vec4(best.z, clamp(rec, 0., 1.), best.xy*(1. - best.z*0.35));
    float fx = smoothstep(0.16, 0.36, fw2.x), fy = smoothstep(0.16, 0.36, fw2.y);
    float wk = (pat < 0.5 || (pat > 1.5 && pat < 2.5) || (pat > 3.5 && pat < 4.5)) ? k : 0.;
    vec4 flatA = vec4(0.62, 0.20 + (1. - k)*0.12, 0., 0.);
    vec4 wale = vec4(0.62, 0.17 + (1. - k)*0.12 + 0.55*wk*(1. - smoothstep(0.03, 0.2, min(f.x, 1. - f.x))), 0., 0.);
    vec4 rowp = vec4(0.62, 0.17 + (1. - k)*0.12 + 0.4*(1. - smoothstep(0.06, 0.26, abs(f.y - (k > 0.5 ? 0.78 : 0.55)))), 0., 0.);
    return mix(mix(o, wale, fy), mix(rowp, flatA, fy), fx);
  }
  float yarnPly(vec2 uvTube, float plies){
    float fw = fwidth(uvTube.x)*plies*0.5 + fwidth(uvTube.y)*plies;
    float s = abs(sin((uvTube.y*plies + uvTube.x*0.55)*3.14159265));
    return (1. - smoothstep(0.0, 0.5, s))*(1. - smoothstep(0.25, 0.6, fw))*0.75;
  }
  // Nr = the normal the fuzz halo is judged by (the fabric's own, not each strand's, so dark wool stays dark)
  vec3 woolShadeR(vec3 base, vec3 N, vec3 Nr, vec3 V, float rec, float dist){
    float nl = dot(N, uSunDir), wrap = clamp(nl*0.5 + 0.5, 0., 1.);
    vec3 shade = base*(0.60 + 0.12*uCool)*uCool;                       // shade side: same wool, a lot deeper and cooler
    vec3 deep = base*base*0.55 + base*0.22;                            // recess: two shades deeper, a little richer
    vec3 c = mix(shade, base, smoothstep(0.30, 0.72, wrap));
    c = mix(c, deep, clamp(rec, 0., 1.)*0.85);
    float e = 1. - abs(dot(Nr, V)); float rim = e*e*e;
    c = mix(c, mix(base, uCream, 0.6), clamp(rim*(0.15 + 0.85*wrap)*0.6*uFuzz, 0., 0.8));   // fuzz halo, strongest toward the light
    float pale = uPale.x*(1. - exp(-dist/max(uPale.y, 1.)));
    return mix(c, uCream, pale);
  }
  vec3 woolShade(vec3 base, vec3 N, vec3 V, float rec, float dist){ return woolShadeR(base, N, N, V, rec, dist); }
  // a real yarn tube: ply twist in the recess, and the halo only when the tube is wide enough on screen to have an edge
  vec3 yarnShade(vec3 base, vec3 N, vec3 V, vec2 uvTube, float plies, float dist){
    float thin = smoothstep(0.08, 0.3, fwidth(uvTube.y));
    vec3 nr = mix(N, V, thin); nr = nr/max(length(nr), 1e-4);
    vec3 nd = mix(N, uSunDir, thin*0.65); nd = nd/max(length(nd), 1e-4);      // a thin yarn is its pigment, not its shaded side
    return woolShadeR(base, nd, nr, V, yarnPly(uvTube, plies)*(1. - thin), dist);
  }
`;

// For vertex shaders: the wind the loose things lean in (same uniforms).
export const WIND_GLSL = /* glsl */`
  uniform float uTime, uGale, uFuzz;
  uniform vec3 uWind;
  const float TAU = 6.2831853;
  float hash11(float n){ return fract(sin(n*127.1 + 3.7)*43758.5453); }
  float gust(vec3 wp){ return 0.5 + 0.5*sin(dot(wp.xz, uWind.xz)*0.045 - uTime*2.3 + sin(wp.x*0.021 + uTime*0.7)*1.7); }
`;

// Fabric: turn a stitch field into a shaded fragment. N = geometric normal (world), wp = world position,
// uvSt = stitch coordinates. Uses the screen derivatives of wp and uvSt for the row/column directions, so the
// rows follow the form whatever the mesh is.
export const FABRIC_GLSL = /* glsl */`
  vec3 fabricShade(vec3 base, vec2 uvSt, float pat, float r, vec3 N, vec3 wp, float extraRec){
    vec4 st = stitchField(uvSt, pat, r);
    vec3 dp1 = dFdx(wp), dp2 = dFdy(wp); vec2 d1 = dFdx(uvSt), d2 = dFdy(uvSt);
    vec3 T = dp1*d2.y - dp2*d1.y, B = dp2*d1.x - dp1*d2.x;
    float inv = 1./max(sqrt(max(dot(T, T), dot(B, B))), 1e-6); T *= inv; B *= inv;
    vec3 n = N*max(st.x, 0.3) + (T*st.z + B*st.w)*0.9;
    n = n/max(length(n), 1e-4);
    vec3 V = cameraPosition - wp; float dist = length(V); V = V/max(dist, 1e-4);
    vec3 nr = N*0.75 + n*0.25; nr = nr/max(length(nr), 1e-4);
    return woolShadeR(base, n, nr, V, clamp(st.y + extraRec, 0., 1.), dist);
  }
`;

const shared = (extra = {}) => ({ ...STYLE.uniforms, ...extra });

// Any material in the style: your GLSL after the wool chunks, sharing STYLE.uniforms. End a fragment with
//   gl_FragColor = vec4(toScene(col), 1.);
export function woolMaterial({ vertexShader, fragmentShader, uniforms = {}, ...rest }) {
  return new THREE.ShaderMaterial({
    uniforms: shared(uniforms),
    vertexShader: WIND_GLSL + vertexShader,
    fragmentShader: WOOL_GLSL + FABRIC_GLSL + fragmentShader,
    ...rest,
  });
}

// Knitted ground for the rest of the world. Geometry needs position, normal, uv (METRES along column axis,
// metres along row axis, world-anchored) and optionally a `color` attribute (display colour per vertex).
//   pattern 0 stocking (hill) | 1 garter (sea) | 2 k2p2 (cliff) | 3 moss (turf) | 4 k1p1 | 5 reverse
//   stitch [w, h] metres; stripe [every n rows, offset] knitted in stripeColor (0 = none); scroll = rows/s the
//   lattice travels along +v (the swell arriving). Displace the mesh yourself; add uniforms as you need.
export function fabricMaterial({ pattern = 0, stitch = [1.5, 1.2], yarn = 0.2, color = PALETTE[3], stripe = [0, 0],
  stripeColor = PALETTE[0], scroll = 0, vertexColors = false, side = THREE.FrontSide } = {}) {
  return woolMaterial({
    side,
    uniforms: {
      uPat: { value: pattern }, uStitch: { value: new THREE.Vector2(stitch[0], stitch[1]) }, uYarn: { value: yarn },
      uColor: { value: new THREE.Color(color) }, uStripe: { value: new THREE.Vector2(stripe[0], stripe[1]) },
      uStripeCol: { value: new THREE.Color(stripeColor) }, uScroll: { value: scroll }, uVC: { value: vertexColors ? 1 : 0 },
    },
    vertexShader: /* glsl */`
      attribute vec3 color; varying vec3 vW, vN, vC; varying vec2 vUv;
      void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix)*normal; vC = color; vUv = uv;
        gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      uniform float uPat, uYarn, uScroll, uVC; uniform vec2 uStitch, uStripe; uniform vec3 uColor, uStripeCol;
      varying vec3 vW, vN, vC; varying vec2 vUv;
      void main(){
        vec2 st = vUv/max(uStitch, vec2(1e-3)); st.y -= uScroll*uTime;
        vec3 base = mix(uColor, vC, uVC);
        if (uStripe.x > 0.5 && mod(floor(st.y) + uStripe.y, uStripe.x) < 1.) base = uStripeCol;
        vec3 N = vN/max(length(vN), 1e-4); if (!gl_FrontFacing) N = -N;
        gl_FragColor = vec4(toScene(fabricShade(base, st, uPat, uYarn, N, vW, 0.)), 1.);
      }`,
  });
}

// A real yarn: tube along a polyline. uv.x = metres along / thickness, uv.y = around 0..1.
export function yarnTubeGeometry(points, radius = 0.8, sides = 6, closed = false) {
  const n = points.length, ring = sides + 1, pos = new Float32Array(n*ring*3), nor = new Float32Array(n*ring*3), uv = new Float32Array(n*ring*2);
  const idx = [], T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), prevT = new THREE.Vector3(), q = new THREE.Quaternion(), v = new THREE.Vector3();
  let len = 0;
  for (let i = 0; i < n; i++) {
    const a = points[closed ? (i - 1 + n) % n : Math.max(i - 1, 0)], b = points[closed ? (i + 1) % n : Math.min(i + 1, n - 1)];
    T.subVectors(b, a); if (T.lengthSq() < 1e-10) T.set(0, 1, 0); T.normalize();
    if (i === 0) { N.set(0, 1, 0); if (Math.abs(T.y) > 0.9) N.set(1, 0, 0); N.addScaledVector(T, -N.dot(T)).normalize(); }
    else { q.setFromUnitVectors(prevT, T); N.applyQuaternion(q); N.addScaledVector(T, -N.dot(T)).normalize(); len += points[i].distanceTo(points[i - 1]); }
    B.crossVectors(T, N); prevT.copy(T);
    for (let j = 0; j < ring; j++) {
      const a2 = (j/sides)*Math.PI*2, c = Math.cos(a2), s = Math.sin(a2), o = (i*ring + j)*3;
      v.copy(N).multiplyScalar(c).addScaledVector(B, s);
      nor[o] = v.x; nor[o + 1] = v.y; nor[o + 2] = v.z;
      pos[o] = points[i].x + v.x*radius; pos[o + 1] = points[i].y + v.y*radius; pos[o + 2] = points[i].z + v.z*radius;
      uv[(i*ring + j)*2] = len/(radius*2); uv[(i*ring + j)*2 + 1] = j/sides;
    }
    if (i < n - 1) for (let j = 0; j < sides; j++) { const p = i*ring + j; idx.push(p, p + ring, p + 1, p + 1, p + ring, p + ring + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}

// Yarn for static tubes from yarnTubeGeometry (the exit stitch, stays, i-cord, plies of the burn).
//   slide = ply stripes travelling along the yarn, thicknesses per second (a cable sliding, a strand running).
export function yarnMaterial({ color = PALETTE[4], plies = 3, slide = 0, vertexColors = false } = {}) {
  return woolMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uPlies: { value: plies }, uSlide: { value: slide }, uVC: { value: vertexColors ? 1 : 0 } },
    vertexShader: /* glsl */`
      attribute vec3 color; uniform float uVC; uniform vec3 uColor; varying vec3 vW, vN, vC; varying vec2 vUv;
      void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix)*normal; vUv = uv; vC = mix(uColor, color, uVC);
        gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      uniform float uPlies, uSlide; varying vec3 vW, vN, vC; varying vec2 vUv;
      void main(){ vec3 uColor = vC;
        vec3 N = vN/max(length(vN), 1e-4), V = cameraPosition - vW; float dist = length(V); V = V/max(dist, 1e-4);
        gl_FragColor = vec4(toScene(yarnShade(uColor, N, V, vec2(vUv.x - uSlide*uTime, vUv.y), uPlies, dist)), 1.);
      }`,
  });
}

// Turned wood or horn (the only things that are not wool): matte, long grain and lathe rings, same exact-colour
// routine and distance rule. Geometry must be lathed along local +X (grain runs along x).
export function woodMaterial({ color = WOOD, dark = WOOD_DARK } = {}) {
  return woolMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uDark: { value: new THREE.Color(dark) } },
    vertexShader: /* glsl */`
      varying vec3 vW, vN, vO;
      void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix)*normal; vO = position;
        gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor, uDark; varying vec3 vW, vN, vO;
      void main(){
        vec3 N = vN/max(length(vN), 1e-4), V = cameraPosition - vW; float dist = length(V); V = V/max(dist, 1e-4);
        float ang = atan(vO.z, vO.y + 1e-5);
        float g = vnoise(vec2(vO.x*0.035, ang*2.2 + vO.x*0.004))*0.6 + vnoise(vec2(vO.x*0.11, ang*5.))*0.4;
        float streak = smoothstep(0.42, 0.62, g);
        float ringW = fwidth(vO.x)*0.9;
        float rings = (1. - smoothstep(0.08, 0.2, abs(fract(vO.x*0.22) - 0.5)))*(1. - smoothstep(0.25, 0.6, ringW));
        vec3 base = mix(uColor, uDark, streak*0.55 + rings*0.18);
        float wrap = clamp(dot(N, uSunDir)*0.5 + 0.5, 0., 1.);
        vec3 c = mix(base*0.52*uCool, base, smoothstep(0.34, 0.66, wrap));
        c = mix(c, base*1.18 + 0.03, smoothstep(0.86, 0.97, wrap)*0.5);            // a worn, polished lot; not a highlight
        float e = 1. - abs(dot(N, V)); c = mix(c, uDark*0.7, e*e*e*0.5);
        c = mix(c, uCream, uPale.x*(1. - exp(-dist/max(uPale.y, 1.))));
        gl_FragColor = vec4(toScene(c), 1.);
      }`,
  });
}

// Fuzz fin cards: every outline in the world wears them. fuzzGeometry(list) takes [{ p:Vector3, n:Vector3 (unit,
// the way the hair stands), len, w, color:THREE.Color, id }] and makes one merged mesh; fuzzMaterial() leans the
// tips leeward with the gusts. `anchor` (optional GLSL) lets an animated owner carry its cards:
//   vec3 fuzzAnchor(vec3 p, float id)  -> local position of the card's root.
export function fuzzGeometry(list) {
  const n = list.length, pos = new Float32Array(n*12), dir = new Float32Array(n*12), cor = new Float32Array(n*16), col = new Float32Array(n*12), idx = new Uint32Array(n*6);
  for (let i = 0; i < n; i++) {
    const c = list[i], seed = (i*0.61803) % 1;
    for (let k = 0; k < 4; k++) {
      const o = (i*4 + k)*3;
      pos[o] = c.p.x; pos[o + 1] = c.p.y; pos[o + 2] = c.p.z;
      dir[o] = c.n.x*c.len; dir[o + 1] = c.n.y*c.len; dir[o + 2] = c.n.z*c.len;
      col[o] = c.color.r; col[o + 1] = c.color.g; col[o + 2] = c.color.b;
      const q = (i*4 + k)*4; cor[q] = ((k & 1) - 0.5)*c.w; cor[q + 1] = k >> 1; cor[q + 2] = seed; cor[q + 3] = c.id ?? 0;
    }
    idx.set([i*4, i*4 + 1, i*4 + 2, i*4 + 2, i*4 + 1, i*4 + 3], i*6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  g.setAttribute('aCorner', new THREE.BufferAttribute(cor, 4)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}
export function fuzzMaterial({ anchor = 'vec3 fuzzAnchor(vec3 p, float id){ return p; }', uniforms = {} } = {}) {
  return woolMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uNearFade: { value: new THREE.Vector2(0, 0.001) }, ...uniforms },      // uNearFade: cards fade out between these distances from the eye
    vertexShader: /* glsl */`
      attribute vec3 aDir, aCol; attribute vec4 aCorner; uniform float uPxS; varying vec3 vC; varying vec3 vUvS; varying float vDist, vEnd;
      ${anchor}
      void main(){
        vec3 root = (modelMatrix*vec4(fuzzAnchor(position, aCorner.w), 1.)).xyz;
        vec3 d = mat3(modelMatrix)*aDir; float len = length(d);
        float g = gust(root + aCorner.z*40.);
        vec3 tip = d*uFuzz + uWind*len*uFuzz*(0.35 + 0.9*g)*uGale + vec3(0., sin(uTime*7. + aCorner.z*40.)*0.08*len, 0.);
        vec3 toCam = cameraPosition - root; vDist = length(toCam);
        tip *= min(1., vDist*uPxS*30./max(length(tip), 1e-4));                    // no hair longer than about 30 px, whatever the day
        vEnd = abs(dot(tip, toCam))/max(length(tip)*vDist, 1e-4);
        vec3 side = cross(tip, toCam); side = side/max(length(side), 1e-4);
        vec3 w = root + tip*aCorner.y + side*aCorner.x*(1. + 0.5*aCorner.y);
        vC = aCol; vUvS = vec3(aCorner.x/max(abs(aCorner.x)*2., 1e-4) + 0.5, aCorner.y, aCorner.z);
        gl_Position = projectionMatrix*viewMatrix*vec4(w, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform vec2 uNearFade; varying vec3 vC; varying vec3 vUvS; varying float vDist, vEnd;
      void main(){
        float x = vUvS.x*7. + vUvS.z*13., fx = fwidth(x);
        float hair = 1. - smoothstep(0.12, 0.42, abs(fract(x + sin(vUvS.y*5. + vUvS.z*30.)*0.25) - 0.5));
        float lenK = 0.45 + 0.55*hash11(floor(x) + vUvS.z*91.);
        hair *= 1. - smoothstep(lenK*0.55, lenK, vUvS.y);
        hair *= 1. - smoothstep(0.3, 0.8, fx);                                               // too fine to be hairs: nothing (never a veil)
        float a = hair*(1. - smoothstep(0.0, 1.0, vUvS.y)*0.5)*0.6*smoothstep(uNearFade.x, uNearFade.y, vDist)*(1. - smoothstep(0.3, 0.7, vEnd));
        vec3 c = mix(vC, uCream, 0.35 + 0.3*vUvS.y);
        c = mix(c, uCream, uPale.x*(1. - exp(-vDist/max(uPale.y, 1.))));
        gl_FragColor = vec4(toScene(c), a);
      }`,
  });
}

// ------------------------------------------------------------------------------------------------------------
// THE NEEDLES at work. One clock (uClock, seconds; one hop a second, one row of thirty in 30 s, there and back
// in 60) drives every part, in the vertex shaders. Local frame: fabric hangs in the z = 0 plane, ribs along x.
// ------------------------------------------------------------------------------------------------------------
const NR = 30, WIDTH = 200, PITCH = WIDTH/NR, X0 = -WIDTH/2, ROWH = 5, CY = 192, ZOFF = 3.9, HOPAT = 0.62, NROWCOL = 24;
const KNIT_GLSL = /* glsl */`
  uniform float uClock, uXc; uniform vec2 uSlope; uniform vec3 uRows[${NROWCOL}];
  const float PITCH = ${PITCH.toFixed(5)}, X0 = ${X0.toFixed(1)}, ROWH = ${ROWH.toFixed(1)}, CY = ${CY.toFixed(1)}, ZOFF = ${ZOFF.toFixed(2)}, HOPAT = ${HOPAT.toFixed(2)};
  float ribX(float i){ return X0 + (i + 0.5)*PITCH; }
  // centre line of the needle holding the fabric at local x: the left needle left of the crossing, the right one right
  vec3 needleAt(float x){ float d = x - uXc, a = abs(d);
    return vec3(x, CY + uSlope.x*a, mix(-ZOFF, ZOFF, smoothstep(-5., 5., d)) - uSlope.y*a); }
  // CASTING OFF. The piece is finished: its rows stand still. The crossing travels once, right to left; rib i's loop
  // is passed over and let go at clock 29 - i + HOPAT. castAt < 0: still a live loop on the left needle.
  float castAt(float i){ return uClock - (29. - i + HOPAT); }
  float sinceHop(float i){ float c = castAt(i); return c < 0. ? 99. : c; }
  float rowsOf(float i, float delay){ return 40.; }
  // the top of the fabric at local x: left of the crossing it hangs 10.5 m under the left needle on its live loops;
  // right of it the cast-off chain hangs free, drooping from the last worked loop down to the selvedge
  vec3 topAt(float x){ float d = x - uXc, a = abs(d), off = smoothstep(0., 9., d); vec3 n = needleAt(x);
    n.y -= 10.5 + off*(1.5 + 0.1*a); n.z = mix(n.z, 1.2 - 0.3*uSlope.y*a, off); return n; }
  // the headland is a landform, not a flat cloth: it bellies seaward toward its foot and its ends wrap back
  float landZ(float x, float depth){
    float sd = clamp(depth/190., 0., 1.), xn = clamp((x - X0)/${(WIDTH/2).toFixed(1)} - 1., -1., 1.);
    float belly = sd*sqrt(sd)*46. + 12.*smoothstep(0.82, 1., sd);
    float lump = 7.*sin(x*0.045 + 1.3)*sin(depth*0.031 + x*0.012)*sd + 4.*sin(x*0.11 + depth*0.05)*sd;
    return belly*(1. - 0.5*xn*xn) - 26.*xn*xn*smoothstep(0., 0.6, sd) + lump;
  }
  vec3 rowColor(float r){ int k = int(mod(floor(r), ${NROWCOL}.)); return uRows[clamp(k, 0, ${NROWCOL - 1})]; }
`;

// where the crossing is at clock c (0..30, one pass from the right selvedge to the left): { xc, w (the rib whose loop
// is being passed over), f (phase of this hop 0..1) }
function knitState(c) {
  const t = clamp(c, 0, 29.999), k = Math.floor(t), f = t - k, e = smoothstep(0.42, 0.82, f), w = 29 - k;
  return { xc: X0 + (w + 1 - e)*PITCH, w, f, back: false, row: 0 };
}

function landZ(x, depth) {          // the same landform as the shader's landZ
  const sd = clamp(depth/190, 0, 1), xn = clamp((x - X0)/(WIDTH/2) - 1, -1, 1);
  const belly = sd*Math.sqrt(sd)*46 + 12*smoothstep(0.82, 1, sd), lump = 7*Math.sin(x*0.045 + 1.3)*Math.sin(depth*0.031 + x*0.012)*sd + 4*Math.sin(x*0.11 + depth*0.05)*sd;
  return belly*(1 - 0.5*xn*xn) - 26*xn*xn*smoothstep(0, 0.6, sd) + lump;
}

function needleGeometry(rng) {
  const L = 300, R = 3.5, pts = [], P = (r, x) => pts.push(new THREE.Vector2(r, x));
  P(0.0, 0); P(0.28, 0.15); P(0.62, 1.0); P(1.0, 3.2); P(1.7, 9); P(2.5, 17); P(3.1, 25); P(3.42, 33); P(R, 40);
  for (let i = 1; i <= 8; i++) P(R, 40 + (i/8)*244);
  // turned beads and the knob: three shapes by seed
  const kind = rng.int(0, 2), kr = rng.range(7.2, 8.6);
  P(R, 285.5); P(3.0, 286.3); P(3.0, 287); P(4.5, 287.8); P(4.7, 288.6); P(4.5, 289.4); P(3.1, 290.1); P(3.1, 290.8);
  if (kind === 0) for (let i = 0; i <= 10; i++) { const a = -1.15 + (i/10)*(Math.PI/2 + 1.15); P(Math.max(Math.cos(a)*kr, 0.01), 297 + Math.sin(a)*kr); }
  else if (kind === 1) { P(5.6, 291.6); P(kr, 293.5); P(kr + 0.5, 295.5); P(kr, 297.3); P(5.8, 298.6); P(4.6, 299.2); P(4.2, 300.6); P(3.0, 303); P(1.4, 304.6); P(0.01, 305); }
  else { P(kr + 1.2, 291.8); P(kr + 1.8, 292.8); P(kr + 1.8, 294.6); P(kr + 1.0, 295.6); P(4.2, 296.4); P(3.6, 297.6); P(4.4, 299.4); P(3.4, 301.2); P(1.6, 302.2); P(0.01, 302.5); }
  const g = new THREE.LatheGeometry(pts, 22);
  g.rotateZ(-Math.PI/2);          // lathe axis +Y -> local +X: point at x = 0, knob at x = 300
  return g;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : PALETTE).map((h) => new THREE.Color(h));
  const [cream, fawn, moorit, grey, indigo, indigo2, red] = pal, black = new THREE.Color(BLACK);
  STYLE.uniforms.uCream.value.copy(cream);
  const object = new THREE.Group(); object.name = 'the-needles';

  // per-seed: how the knitter holds the needles, the wood, the stripe sequence
  // the points are held UP and crossed, the knobs down toward the knitter's hands: from the crest the two needles are a plain X
  const tilt = -rng.range(0.24, 0.29), splay = rng.range(0.27, 0.33), POKE = 72;
  const woods = [[WOOD, WOOD_DARK], ['#C9A46A', '#8A6238'], ['#A8744A', '#6B4429']], wood = rng.pick(woods);
  const pairs = [[indigo, grey], [indigo, grey], [indigo, grey], [grey, grey], [grey, grey], [indigo, indigo], [indigo, indigo2], [grey, indigo2], [moorit, grey], [grey, cream]];
  const rows = []; { let r = 0; while (r < NROWCOL) { const p = r === 0 ? pairs[0] : rng.pick(pairs), n = Math.min(NROWCOL - r, p[0] === p[1] ? 2*rng.int(1, 2) : 2*rng.int(1, 3)); for (let i = 0; i < n; i++) rows.push(p[(r + i) % 2].clone()); r += n; } }
  const U = {
    uClock: { value: 0 }, uXc: { value: 0 }, uSlope: { value: new THREE.Vector2(tilt, splay) }, uRows: { value: rows },
    uDrop: { value: new THREE.Vector2(-9, 0) },      // the dropped stitch (rare): rib index, depth the ladder has run to (m)
  };

  // ---- the two needles ----
  await ctx.yield();
  const needleGeo = needleGeometry(rng), woodMat = woodMaterial({ color: wood[0], dark: wood[1] });
  const needleL = new THREE.Mesh(needleGeo, woodMat), needleR = new THREE.Mesh(needleGeo, woodMat);
  needleL.frustumCulled = needleR.frustumCulled = false;
  const dL = new THREE.Vector3(-1, tilt, -splay).normalize(), dR = new THREE.Vector3(1, tilt, -splay).normalize();      // (dR is re-aimed below: the working needle)
  const sL = 1/Math.abs(dL.x);                       // metres of needle per metre of x
  needleL.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dL); needleR.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dR);
  object.add(needleL, needleR);
  await ctx.yield();

  // ---- the new headland: thirty ribs hanging from the needles ----
  const SUB = 8, SEG = 56, fv = NR*(SUB + 1)*(SEG + 1), fpos = new Float32Array(fv*3), frib = new Float32Array(fv), fidx = [];
  for (let i = 0, o = 0; i < NR; i++) for (let a = 0; a <= SUB; a++) for (let b = 0; b <= SEG; b++, o++) {
    fpos[o*3] = X0 + (i + a/SUB)*PITCH; fpos[o*3 + 1] = Math.pow(b/SEG, 0.8); frib[o] = i;
    if (a < SUB && b < SEG) { const p = o, q = o + SEG + 1; fidx.push(p, q, p + 1, p + 1, q, q + 1); }
  }
  await ctx.yield();
  const fabGeo = new THREE.BufferGeometry();
  fabGeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3)); fabGeo.setAttribute('aRib', new THREE.BufferAttribute(frib, 1)); fabGeo.setIndex(fidx);
  const fabMat = woolMaterial({
    side: THREE.DoubleSide, uniforms: { ...U, uHem: { value: cream }, uBack: { value: grey.clone().lerp(indigo, 0.35) } },
    vertexShader: KNIT_GLSL + /* glsl */`
      attribute float aRib; varying vec3 vW; varying vec2 vSt; varying float vHem, vTug, vDepth, vCast;
      void main(){
        float x = position.x, t = position.y; vCast = smoothstep(-1., 2.5, x - uXc);
        vec3 top = topAt(x);
        float sh = sinceHop(aRib);
        float foot = 2.6 + 0.9*sin(uTime*0.9 + aRib*0.7);                   // the finished hem laps in the surf
        float depth = (1. - t)*(top.y - foot), y = top.y - depth;
        float rc = (x - X0)/PITCH, prof = cos(3.14159265*(rc - 0.5)); prof = prof/(0.35 + 0.65*abs(prof));
        float hang = 1. - smoothstep(0., 150., depth);
        float tg = sh - depth/140., tug = smoothstep(0., 0.1, tg)*(1. - smoothstep(0.1, 0.7, tg));
        float free = smoothstep(0., 70., depth)*(1. - 0.6*smoothstep(120., 190., depth));
        float z = top.z*hang + landZ(x, depth) + 2.5*prof + 2.2*tug + (gust(vec3(x*1.4 + y*0.9, 0., y*1.7)) - 0.5)*3.2*free*uGale;
        vSt = vec2(rc, rowsOf(aRib, depth/140.) - depth/ROWH); vHem = y - foot; vTug = tug; vDepth = depth;
        vec4 w = modelMatrix*vec4(x, y, z, 1.); vW = w.xyz;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: KNIT_GLSL + /* glsl */`
      uniform vec3 uHem, uBack; uniform vec2 uDrop; varying vec3 vW; varying vec2 vSt; varying float vHem, vTug, vDepth, vCast;
      void main(){
        // the dropped stitch: one rib laddered from the needle down to uDrop.y, only slack rungs left
        float inDrop = step(uDrop.x - 0.2, vSt.x)*step(vSt.x, uDrop.x + 1.2)*step(4.5, vDepth)*step(vDepth, uDrop.y);
        float rung = abs(fract(vDepth/ROWH + 0.18*sin((vSt.x - uDrop.x)*3.14159265)) - 0.5);
        if (inDrop > 0.5 && rung > 0.15) discard;
        vec3 N = cross(dFdx(vW), dFdy(vW)); N = N/max(length(N), 1e-6);
        vec3 V = cameraPosition - vW; if (dot(N, V) < 0.) N = -N;
        float prof = cos(3.14159265*(vSt.x - 0.5));
        float hemTop = 15. + 2.2*sin(vSt.x*TAU*0.5 + 1.), hem = 1. - smoothstep(hemTop - 0.6, hemTop + 0.6, vHem);
        bool isHem = hem > 0.5;
        vec2 uvS = isHem ? vec2(vSt.x*2., vHem/2.4) : vSt;
        vec3 base = isHem ? uHem : rowColor(vSt.y);
        if (inDrop > 0.5) base = mix(base, uHem, 0.35);
        if (!gl_FrontFacing) base = mix(base, uBack, 0.35);
        float groove = (1. - smoothstep(-0.7, 0.3, prof))*0.3;
        vec3 c = fabricShade(base, uvS, isHem ? 1. : 4., isHem ? 0.24 : 0.2, N, vW, groove + (isHem ? 0. : 0.));
        c = mix(c, c*1.06 + 0.02, vTug*0.5);
        // the outline is stitches too: scalloped selvedges and hem, and the live top row is open loops
        vec4 sf = stitchField(uvS, isHem ? 1. : 4., isHem ? 0.24 : 0.2);
        float edgeX = min(vSt.x, ${NR}. - vSt.x), sc = 0.10*(0.5 + 0.5*sin(vSt.y*TAU));
        if (edgeX < sc || vHem < 0.9*(0.5 + 0.5*cos(vSt.x*TAU*2.)) || (vDepth < 4.5 && sf.x < 0.05 && vCast < 0.5)) discard;
        gl_FragColor = vec4(toScene(c), 1.);
      }`,
  });
  const fabric = new THREE.Mesh(fabGeo, fabMat); fabric.frustumCulled = false; object.add(fabric);
  await ctx.yield();

  // ---- thirty live loops on the needles (real tube, one instanced call) ----
  const RL = 4.5, loopPts = [];
  for (let i = 0; i < 9; i++) { const t = i/9; loopPts.push(new THREE.Vector3(-1.6 + t*0.5, -11.8 + t*(11.8 + RL*Math.cos(2.5)) , 0.5 + t*(RL*Math.sin(2.5) - 0.5) - Math.sin(t*Math.PI)*0.5)); }
  for (let i = 0; i <= 28; i++) { const th = 2.5 - (i/28)*5.0; loopPts.push(new THREE.Vector3(-1.1 + (i/28)*2.2, RL*Math.cos(th), RL*Math.sin(th))); }
  for (let i = 1; i <= 9; i++) { const t = 1 - i/9; loopPts.push(new THREE.Vector3(1.6 - t*0.5, -11.8 + t*(11.8 + RL*Math.cos(2.5)), -0.5 - t*(RL*Math.sin(2.5) - 0.5) + Math.sin(t*Math.PI)*0.5)); }
  const loopBase = yarnTubeGeometry(loopPts, 0.82, 6), loopGeo = new THREE.InstancedBufferGeometry();
  loopGeo.index = loopBase.index; for (const k of ['position', 'normal', 'uv']) loopGeo.setAttribute(k, loopBase.getAttribute(k));
  loopGeo.setAttribute('aRib', new THREE.InstancedBufferAttribute(Float32Array.from({ length: NR }, (_, i) => i), 1));
  loopGeo.instanceCount = NR;
  const LOOP_GLSL = /* glsl */`
    // where a point of loop i (in the loop's own frame: needle along x, ring in yz, feet at y = -11.8) is now
    uniform float uPx; uniform vec3 uCamL;
    vec3 loopPoint(vec3 p, float i){
      float x = ribX(i), d = x - uXc, near = exp(-d*d/34.), up = smoothstep(-11.8, -3., p.y);
      float far = clamp(distance(needleAt(x), uCamL)/300., 0., 1.6);          // the loop in mid-hop is drawn out further the further off we are
      float sh = sinceHop(i), snug = smoothstep(0.05, 0.3, sh)*(1. - smoothstep(0.3, 0.9, sh));
      float big = clamp(distance(needleAt(x), uCamL)*uPx*1.45, 1., 1.9);      // from far off a loop is drawn large enough to count
      p.x += 0.8*p.z*up*big;                                // a stitch sits slanted on its needle, so it shows as a coil
      p.yz *= mix(1., big*(1. + (0.5 + 0.5*far)*near*near - 0.07*snug), up);
      p.y += (7.5 + 7.*far)*near*near*up;                              // the one in mid-hop is plainly lifted between the points
      p.x += (smoothstep(-5., 5., d)*2. - 1.)*uSlope.x*p.y*0.5;
      return needleAt(x) + p;
    }
    // ... and once it has been passed over it is laid down along the edge as one link of the cast-off chain
    vec3 loopNow(vec3 p, float i, out float cst){
      cst = smoothstep(0., 0.9, castAt(i));
      vec3 a = loopPoint(p, i);
      float x = ribX(i); vec2 dir = normalize(vec2(1., uSlope.x - 0.1));
      vec3 q = vec3(-(p.y + 3.6)*0.7, p.z*0.8, p.x*0.9 + 2.2);
      vec3 b = topAt(x) + vec3(dir.x*q.x - dir.y*q.y, dir.y*q.x + dir.x*q.y + 1.2, q.z);
      float arc = sin(3.14159265*cst);
      return mix(a, b, cst) + vec3(0., 6.*arc, 4.*arc);
    }`;
  const yarnVaryings = 'varying vec3 vW, vN, vC; varying vec2 vUv;';
  const LPX = { uPx: { value: 0.002 }, uCamL: { value: new THREE.Vector3() } };      // world size of a pixel per metre of distance; the eye in local space
  const yarnFrag = /* glsl */`
    ${yarnVaryings} uniform float uPlies;
    void main(){
      vec3 N = vN/max(length(vN), 1e-4), V = cameraPosition - vW; float dist = length(V); V = V/max(dist, 1e-4);
      gl_FragColor = vec4(toScene(yarnShade(vC, N, V, vUv, uPlies, dist)), 1.);
    }`;
  const loops = new THREE.Mesh(loopGeo, woolMaterial({
    uniforms: { ...U, ...LPX, uPlies: { value: 3 }, uChain: { value: indigo2.clone().lerp(cream, 0.3) } },
    vertexShader: KNIT_GLSL + LOOP_GLSL + /* glsl */`
      attribute float aRib; uniform vec3 uCream, uChain; ${yarnVaryings}
      void main(){
        float fat = max(1., distance(needleAt(ribX(aRib)), uCamL)*uPx*1.6/0.82);      // the yarn never thinner than about 3 px
        float cst; vec4 w = modelMatrix*vec4(loopNow(position + normal*0.82*(fat - 1.), aRib, cst), 1.); vW = w.xyz; vUv = uv;
        vN = mat3(modelMatrix)*mix(normal, vec3(-normal.y, normal.z, normal.x), cst);
        vC = rowColor(rowsOf(aRib, 0.) + 0.5); vC = mod(aRib, 2.) < 0.5 ? vC*0.86 : mix(vC, uCream, 0.34);      // every other loop a paler lot: they can be counted
        vC = mix(vC, mod(aRib, 2.) < 0.5 ? uChain : mix(uChain, uCream, 0.45), cst);                              // the chain is the working yarn
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: yarnFrag,
  }));
  loops.frustumCulled = false; object.add(loops);
  await ctx.yield();

  // ---- loose yarns: the working strand, the red waste yarn, ends not darned in (one call) ----
  // every strand is a straight run P0 -> P1 that sags, bows leeward, keeps its crimp and flutters at a free end
  const NS = 9, ballPos = new THREE.Vector3(-193 + rng.range(-4, 4), 34, 6 + rng.range(-6, 6)), BR = 64, SW = 8;      // SW: one wound strand, metres
  const sP0 = [], sP1 = [], sPar = [], sCol = [];
  const feed = ballPos.clone().add(new THREE.Vector3(14, BR + 6, -3));
  // 0 the working strand: the ball -> the working needle's point (P0 follows the crossing), taut, one fat yarn
  sP0.push(new THREE.Vector3(0, CY + 5, 0)); sP1.push(feed.clone()); sPar.push(new THREE.Vector4(11, 0, 0.1, 270)); sCol.push(indigo2.clone().lerp(indigo, 0.35));
  // 1-3 the red waste yarn at the selvedge: two tails streaming and a length hanging down the edge
  for (let i = 0; i < 3; i++) { sP0.push(new THREE.Vector3()); sP1.push(new THREE.Vector3()); sPar.push(new THREE.Vector4(i === 2 ? 2 : 4, i === 2 ? 1.6 : 4 + i, 0.5, i === 2 ? 70 : 62 - i*18)); sCol.push(red.clone()); }
  // 4-8 ends not darned in: loose tails standing off the face of the headland
  const ends = [];
  for (let i = 0; i < 5; i++) {
    ends.push({ x: rng.range(-88, 88), d: rng.range(28, 150), len: rng.range(14, 26) });
    sP0.push(new THREE.Vector3()); sP1.push(new THREE.Vector3()); sPar.push(new THREE.Vector4(1.5, rng.range(1.6, 2.6), 0.45, ends[i].len)); sCol.push(rng.pick([indigo, grey, indigo2, cream]).clone());
  }
  const segs = [120, 60, 50, 60, 28, 28, 28, 28, 28];
  const SSIDE = 6, sv = segs.reduce((a, n) => a + (n + 1)*(SSIDE + 1), 0), sA = new Float32Array(sv*3), sIdx = [];
  for (let k = 0, o = 0; k < NS; k++) for (let i = 0, SSEG = segs[k]; i <= SSEG; i++) for (let j = 0; j <= SSIDE; j++, o++) {
    sA[o*3] = i/SSEG; sA[o*3 + 1] = (j/SSIDE)*Math.PI*2; sA[o*3 + 2] = k;
    if (i < SSEG && j < SSIDE) { const p = o, q = o + SSIDE + 1; sIdx.push(p, q, p + 1, p + 1, q, q + 1); }
  }
  await ctx.yield();
  const strandGeo = new THREE.BufferGeometry(); strandGeo.setAttribute('position', new THREE.BufferAttribute(sA, 3)); strandGeo.setIndex(sIdx);
  const SU = { uP0: { value: sP0 }, uP1: { value: sP1 }, uPar: { value: sPar }, uCol: { value: sCol }, uWindL: { value: new THREE.Vector3(0, 0, 1) }, uPx: LPX.uPx, uPlies: { value: 3 }, uCamL: LPX.uCamL };
  const strands = new THREE.Mesh(strandGeo, woolMaterial({
    uniforms: { ...U, ...SU },
    vertexShader: /* glsl */`
      uniform vec3 uP0[${NS}], uP1[${NS}], uCol[${NS}], uWindL, uCamL; uniform vec4 uPar[${NS}]; uniform float uPx, uClock;
      ${yarnVaryings}
      vec3 curve(int k, float u){
        vec3 a = uP0[k], b = uP1[k]; vec4 par = uPar[k];
        vec3 p = mix(a, b, u); float bow = 4.*u*(1. - u), fk = float(k);
        vec3 ax = b - a; ax = ax/max(length(ax), 1e-3);
        vec3 sd = cross(ax, vec3(0., 1., 0.)); sd = sd/max(length(sd), 0.05); vec3 upv = cross(sd, ax);
        float g = gust(p + fk*37.);
        p.y -= par.x*bow*(1. - 0.12*g);
        p += uWindL*bow*par.x*(0.25 + 0.5*g)*uGale;
        float fl = par.y*u*(0.3 + 0.7*u);
        p += sd*sin(u*8. - uTime*6.1 + fk*1.7)*fl + upv*cos(u*6.3 - uTime*4.7 + fk)*fl*0.7;
        float s = u*par.w/${(PITCH*2).toFixed(3)};
        p += (sd*sin(s*TAU) + upv*sin(s*TAU*0.5 + fk))*par.z*(0.6 + 0.4*sin(s*0.9 + fk*3.));
        return p;
      }
      void main(){
        int k = int(position.z + 0.5); float u = position.x;
        vec3 p = curve(k, u), t = curve(k, min(u + 0.004, 1.)) - curve(k, max(u - 0.004, 0.));
        t = t/max(length(t), 1e-4);
        vec3 n1 = cross(t, vec3(0.31, 0.9, 0.3)); n1 = n1/max(length(n1), 1e-3); vec3 n2 = cross(t, n1);
        vec3 nr = n1*cos(position.y) + n2*sin(position.y);
        float r = (k == 0 ? max(1.5, distance(p, uCamL)*uPx*2.2) : max(0.82, distance(p, uCamL)*uPx*0.9))*(k >= 4 ? 1.25 - 0.5*u : 1.);
        vec4 w = modelMatrix*vec4(p + nr*r, 1.); vW = w.xyz; vN = mat3(modelMatrix)*nr; vC = uCol[k];
        float run = k == 0 ? uTime*7. : 0.;                              // the working yarn runs from the ball to the needle
        vUv = vec2(u*uPar[k].w/(k == 0 ? 3.0 : 1.64) + run, position.y/TAU);
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: yarnFrag,
  }));
  strands.frustumCulled = false; object.add(strands);
  await ctx.yield();

  // ---- the yarn ball, the size of a hill: plainly WOUND. Seven belts of real fat yarn, each belt a run of strands lying
  // side by side round the ball at its own decided slant, each wound over the one before (so a belt ends where its strands
  // dive under the next, strand by strand); the last two belts are a dozen full round wraps standing proud. The slants are
  // fixed (well apart from one another); the seed only turns the whole winding and picks the lots. ----
  const ball = new THREE.Group(); ball.position.copy(ballPos); object.add(ball);
  const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(BR - 6, 40, 24), woolMaterial({
    uniforms: { uCol: { value: indigo.clone().lerp(indigo2, 0.45).multiplyScalar(0.84) }, uRot: { value: new THREE.Matrix3() } },      // the mean of the lots, a little deeper: wool under wool, never a dark hollow
    vertexShader: /* glsl */`
      varying vec3 vW, vO;
      void main(){ vO = position; vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCol; uniform mat3 uRot; varying vec3 vW, vO;
      void main(){      // what shows in the chinks between belts: the yarn wound underneath, a deeper lot
        vec3 n = vO/max(length(vO), 1e-4); float c = dot(n, vec3(0.42, 0.56, 0.71))*${(BR/SW).toFixed(2)}, fw = fwidth(c);
        float gap = (1. - smoothstep(0.1, 0.3 + fw, abs(fract(c) - 0.5)))*(1. - smoothstep(0.25, 0.6, fw));
        vec3 N = uRot*n; vec3 V = cameraPosition - vW; float dist = length(V); V = V/max(dist, 1e-4);
        vec3 Nr = mix(N, V, 0.65); Nr = Nr/max(length(Nr), 1e-4);
        gl_FragColor = vec4(toScene(woolShadeR(uCol*(0.92 + 0.16*hash11(floor(c))), N, Nr, V, 0.2 + 0.5*gap, dist)), 1.);
      }`,
  }));
  ball.add(coreMesh);
  await ctx.yield();
  const AXES = [[-0.48, 0.46, 0.75], [0.92, 0.33, 0.2], [0.36, -0.28, 0.89], [-0.86, 0.5, -0.14], [0.6, -0.6, -0.5], [0.1, 0.95, 0.3], [-0.7, -0.2, 0.68], [0.52, 0.72, -0.46], [-0.24, 0.3, -0.92]];
  const NBELT = 9, BELT_N = [16, 7, 6, 6, 6, 6, 5, 5, 4], BELT_C = [0.0, 0.2, 0.3, -0.3, 0.35, -0.2, 0.25, 0.4, -0.45];      // (the first is the whole under-winding; every later belt shows a fifth of the ball or so)
  const turn = new THREE.Quaternion().setFromEuler(new THREE.Euler(rng.range(-0.3, 0.3), rng.range(0, Math.PI*2), rng.range(-0.3, 0.3)));
  const mixI = (t) => indigo.clone().lerp(indigo2, t);      // the ball is one yarn in its dye lots: mid blues, so the shade side still shows its strands
  const lots = [mixI(0.36), mixI(0.62), mixI(0.86), mixI(0.28), mixI(0.74), mixI(0.48), indigo2.clone().lerp(cream, 0.06)];      // lots a shade apart: belts, never a pale hoop on a dark ball
  const lot0 = rng.int(0, 6), belts = [], topPts = [];
  // (the seed's draws are taken exactly as the first winding took them, so nothing else in the world moves; the winding reads them in turn)
  const pool = []; for (const n of [16, 10, 9, 8, 6, 5, 4]) { pool.push(rng.range(0, 6.28)/6.28); for (let j = 0; j < n; j++) pool.push(rng.range(-0.5, 0.5) + 0.5, rng()); }
  let pi = 0; const draw = () => pool[(pi++) % pool.length];
  for (let k = 0; k < NBELT; k++) {
    const ax = new THREE.Vector3(...AXES[k]).normalize().applyQuaternion(turn), proud = k >= NBELT - 2, Rk = BR - 2 + k*1.2 + (proud ? 0.7 : 0), rad = proud ? 4.2 : 4.0, squash = proud ? 0.6 : 0.42;      // wound yarn flattens: each belt lies one strand's thickness over the last
    const e1 = new THREE.Vector3(0.3, 0.9, 0.31).cross(ax).normalize(), e2 = ax.clone().cross(e1), pitch = 2*rad*0.96/Rk, col = lots[(lot0 + k*3) % 7], ph = draw()*6.28;
    for (let j = 0; j < BELT_N[k]; j++) {
      const d0 = BELT_C[k] + (j - (BELT_N[k] - 1)/2)*pitch, SEGS = 52, pts = [], rads = [], Rs = Rk + (draw() - 0.5)*0.8;
      for (let i = 0; i <= SEGS; i++) {
        const a = (i % SEGS)/SEGS*Math.PI*2, d = clamp(d0 + 0.016*Math.sin(2*a + ph) + 0.008*Math.sin(5*a + ph*3 + j), -0.985, 0.985), rr = Math.sqrt(1 - d*d);
        const n = ax.clone().multiplyScalar(d).addScaledVector(e1, Math.cos(a)*rr).addScaledVector(e2, Math.sin(a)*rr);
        rads.push(n); pts.push(n.clone().multiplyScalar(Rs));
      }
      const SIDES = 8, g = yarnTubeGeometry(pts, rad, SIDES), pos = g.getAttribute('position'), nv = pos.count, ca = new Float32Array(nv*3), ra = new Float32Array(nv*3), la = new Float32Array(nv);
      const lot = 0.93 + 0.14*draw(), v = new THREE.Vector3(), tg = new THREE.Vector3(), lt = new THREE.Vector3();
      for (let q = 0; q < nv; q++) {
        const i = Math.floor(q/(SIDES + 1)), n = rads[i], c = pts[i]; v.fromBufferAttribute(pos, q).sub(c);
        tg.subVectors(pts[Math.min(i + 1, SEGS)], pts[Math.max(i - 1, 0)]); lt.crossVectors(tg, n).normalize(); la[q] = v.dot(lt)/rad;      // where across the strand: -1 .. 1
        const vr = v.dot(n); v.addScaledVector(n, vr*(squash - 1)).add(c); pos.setXYZ(q, v.x, v.y, v.z);                                // (the normals stay round: a flattened strand is still lit as round yarn)
        ca[q*3] = col.r*lot; ca[q*3 + 1] = col.g*lot; ca[q*3 + 2] = col.b*lot; ra[q*3] = n.x; ra[q*3 + 1] = n.y; ra[q*3 + 2] = n.z;
      }
      g.setAttribute('color', new THREE.BufferAttribute(ca, 3)); g.setAttribute('aRad', new THREE.BufferAttribute(ra, 3)); g.setAttribute('aLat', new THREE.BufferAttribute(la, 1)); belts.push(g);
      if (k >= 5) for (let i = 0; i < SEGS; i += 2) topPts.push({ p: pts[i], n: rads[i], c: col, r: rad*squash });
      await ctx.yield();
    }
  }
  const beltMesh = new THREE.Mesh(mergeGeometries(belts), woolMaterial({
    vertexShader: /* glsl */`
      attribute vec3 color, aRad; attribute float aLat; varying vec3 vW, vN, vR, vC; varying vec2 vUv; varying float vLat;
      void main(){ vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vN = mat3(modelMatrix)*normal; vR = mat3(modelMatrix)*aRad; vC = color; vUv = uv; vLat = aLat;
        gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      varying vec3 vW, vN, vR, vC; varying vec2 vUv; varying float vLat;
      void main(){
        vec3 N = vN/max(length(vN), 1e-4), R = vR/max(length(vR), 1e-4), V = cameraPosition - vW; float dist = length(V); V = V/max(dist, 1e-4);
        // a round strand lying among its neighbours: bright on its crown, the deeper lot where it turns down into the gap,
        // a hint of ply along it; the ball's own curve decides the pale halo, not each strand's edge
        float thin = smoothstep(0.25, 0.55, fwidth(vLat)), thinA = smoothstep(0.5, 1.1, fwidth(vLat)), h = sqrt(max(1. - vLat*vLat, 0.));
        float rec = mix(max(1. - smoothstep(0.1, 0.8, h), yarnPly(vUv, 3.)*0.5), 0.22, thin);
        vec3 n = mix(N, R, 0.25 + 0.75*thin); n = n/max(length(n), 1e-4);
        vec3 Rr = mix(R, V, 0.6); Rr = Rr/max(length(Rr), 1e-4);                    // (a quiet halo: the ball is wool to its edge, not a pale ring round a bubble)
        // each wound strand catches the light along its crown (a lighter lot, a little cream in it: wool, not a gloss) and keeps
        // that edge until it is two or three pixels wide, so the belts still read as wound yarn from across the Sound
        vec3 bc = vC*(1. + (0.2*smoothstep(0.5, 1., h) - 0.1*(1. - smoothstep(0., 0.5, h)))*(1. - thinA));
        bc = mix(bc, uCream, 0.08*smoothstep(0.72, 1., h)*(1. - thinA));
        gl_FragColor = vec4(toScene(woolShadeR(bc, n, Rr, V, rec, dist)), 1.);
      }`,
  }));
  ball.add(beltMesh); for (const g of belts) g.dispose();
  await ctx.yield();
  const bf = [], NBF = Math.round(260*detail);
  for (let i = 0; i < NBF; i++) { const t = topPts[rng.int(0, topPts.length - 1)];
    bf.push({ p: t.p.clone().addScaledVector(t.n, t.r*0.9), n: t.n, len: rng.range(2.2, 4.6), w: rng.range(3, 6), color: t.c }); }
  const ballFuzz = new THREE.Mesh(fuzzGeometry(bf), fuzzMaterial()); ballFuzz.frustumCulled = false; ball.add(ballFuzz);

  // fuzz on the live loops (carried by the same loop function) and along the top of the fabric
  const lf = [], fzc = grey.clone().lerp(indigo, 0.5), NLF = Math.round(9*detail);
  for (let i = 0; i < NR; i++) for (let k = 0; k < NLF; k++) {
    const th = rng.range(-2.2, 2.2), n = new THREE.Vector3(rng.range(-0.3, 0.3), Math.cos(th), Math.sin(th)).normalize();
    lf.push({ p: new THREE.Vector3(rng.range(-1, 1), (RL + 0.6)*Math.cos(th), (RL + 0.6)*Math.sin(th)), n, len: rng.range(1.6, 3.2), w: rng.range(2.2, 3.6), color: fzc, id: i });
  }
  const loopFuzz = new THREE.Mesh(fuzzGeometry(lf), fuzzMaterial({ uniforms: { ...U, ...LPX }, anchor: KNIT_GLSL + LOOP_GLSL + 'vec3 fuzzAnchor(vec3 p, float id){ float c; return loopNow(p, id, c); }' }));
  loopFuzz.frustumCulled = false; object.add(loopFuzz);
  await ctx.yield();

  // ---- the slop of cream garter foam where each rib's foot goes in ----
  const fq = new Float32Array(NR*4*3), fr = new Float32Array(NR*4), fi = [];
  for (let i = 0; i < NR; i++) { for (let k = 0; k < 4; k++) { fq[(i*4 + k)*3] = (k & 1)*2 - 1; fq[(i*4 + k)*3 + 2] = (k >> 1)*2 - 1; fr[i*4 + k] = i; } fi.push(i*4, i*4 + 2, i*4 + 1, i*4 + 1, i*4 + 2, i*4 + 3); }
  const foamGeo = new THREE.BufferGeometry(); foamGeo.setAttribute('position', new THREE.BufferAttribute(fq, 3)); foamGeo.setAttribute('aRib', new THREE.BufferAttribute(fr, 1)); foamGeo.setIndex(fi);
  const foam = new THREE.Mesh(foamGeo, woolMaterial({
    transparent: true, depthWrite: false, uniforms: { ...U, uHem: { value: cream } },
    vertexShader: KNIT_GLSL + /* glsl */`
      attribute float aRib; varying vec3 vW; varying vec3 vP;
      void main(){
        float sh = sinceHop(aRib), size = mix(5., 19., smoothstep(0.15, 5., sh));
        vP = vec3(position.xz, sh);
        vec4 w = modelMatrix*vec4(ribX(aRib) + position.x*size*0.8, 0.7, landZ(ribX(aRib), 190.) + 4. + position.z*size, 1.); vW = w.xyz;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uHem; varying vec3 vW; varying vec3 vP;
      void main(){
        float rad = length(vP.xy), ang = atan(vP.y, vP.x + 1e-5), sh = vP.z;
        float ring = rad*4.2 - sh*0.35, fr = fwidth(ring);
        float bump = abs(fract(ring) - 0.5)*2., seg = 0.5 + 0.5*sin(ang*(5. + 4.*floor(ring)) + floor(ring)*2.4);
        float ridge = (1. - smoothstep(0.35, 0.6 + fr, bump))*smoothstep(0.12, 0.3, seg);
        vec4 st = vec4(ridge, bump*0.5, 0., 0.);
        float a = smoothstep(0.15, 0.5, sh)*(1. - smoothstep(3., 6.5, sh))*smoothstep(0.1, 0.25, rad)*(1. - smoothstep(0.8, 1., rad))*ridge*0.9;
        vec3 V = cameraPosition - vW; float dist = length(V);
        gl_FragColor = vec4(toScene(woolShade(uHem, vec3(0., 1., 0.), V/max(dist, 1e-4), st.y*0.6, dist)), a);
      }`,
  }));
  foam.frustumCulled = false; foam.renderOrder = 2; object.add(foam);
  await ctx.yield();

  // ---- the clock and the frame-by-frame work ----
  // uClock counts loops cast off (0..30). The world drives it from the flight (setClock); alone, the piece casts the whole
  // row off in 50 s and starts again.
  let override = -1;
  const st = { xc: 0, w: 0, f: 0, back: false, row: 0 };
  const tmpQ = new THREE.Quaternion(), tmpV = new THREE.Vector3(), tmpM = new THREE.Matrix4(), size = new THREE.Vector2();
  const rollAxis = new THREE.Vector3(0.25, 0, 1).normalize(), cross = new THREE.Vector3(0, CY, 0);
  const tiltR = tilt*0.4;                                 // the working needle is held flatter: the cast-off edge hangs clear below it
  dR.set(1, tiltR, -splay).normalize(); needleR.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dR);
  // the fabric's top at local x (the shader's topAt)
  const topAt = (x, out) => { const d = x - st.xc, a = Math.abs(d), off = smoothstep(0, 9, d);
    return out.set(x, CY + tilt*a - 10.5 - off*(1.5 + 0.1*a), lerp(lerp(-ZOFF, ZOFF, smoothstep(-5, 5, d)) - splay*a, 1.2 - 0.3*splay*a, off)); };
  function update(dt, time, camera) {
    const c = clamp(override >= 0 ? override : (time*0.6) % 30, 0, 29.6);
    Object.assign(st, knitState(c));
    STYLE.uniforms.uTime.value = time; U.uClock.value = c; U.uXc.value = st.xc; cross.set(st.xc, CY, 0);
    // needles: both slide with the crossing; the working one thrusts through the next loop, dips, and draws back
    const T = smoothstep(0, 0.28, st.f) - smoothstep(0.5, 0.8, st.f);
    needleL.position.set(st.xc, CY, -ZOFF).addScaledVector(dL, -POKE);
    needleR.position.set(st.xc, CY - 0.8*T, ZOFF).addScaledVector(dR, -(POKE*0.55 + 6.5*T));
    // the working strand comes off the last loop on the working point and runs taut to the ball
    const ph = Math.PI*2*smoothstep(0.26, 0.56, st.f);
    sP0[0].set(st.xc + 2.5, CY + 5.2*Math.cos(ph) + 1.2, 5.2*Math.sin(ph));
    // red waste yarn at the right selvedge, where the casting off began
    topAt(WIDTH/2, tmpV); const sy = tmpV.y - 2.5, sz = tmpV.z + 2.2;
    object.updateWorldMatrix(true, false);
    const windL = SU.uWindL.value.copy(STYLE.uniforms.uWind.value).applyQuaternion(object.getWorldQuaternion(tmpQ).invert());
    for (let i = 0; i < 2; i++) { const len = sPar[1 + i].w; sP0[1 + i].set(WIDTH/2 + 1.6, sy - i*2.5, sz); sP1[1 + i].copy(sP0[1 + i]).addScaledVector(windL, len*0.9).add(tmpV.set(len*0.25, -len*0.22, 0)); }
    sP0[3].set(WIDTH/2 + 1.4, sy + 1, sz); sP1[3].set(WIDTH/2 + 2.2, sy - 56, sz*0.75 + 2);
    for (let i = 0; i < ends.length; i++) {
      const e = ends[i], P = sP0[4 + i]; topAt(e.x, tmpV);
      P.set(e.x, tmpV.y - e.d, tmpV.z*(1 - smoothstep(0, 150, e.d)) + landZ(e.x, e.d) + 2.2);
      sP1[4 + i].copy(P).addScaledVector(windL, e.len*0.7).add(tmpV.set(0, -e.len*0.4, e.len*0.45));
    }
    // the ball: turns as it pays out (its top runs toward the needles), lifts on the swell
    ball.position.y = ballPos.y + Math.sin(time*0.55)*2.2;
    ball.quaternion.setFromAxisAngle(rollAxis, -time*0.2);
    ball.updateWorldMatrix(false, false); coreMesh.material.uniforms.uRot.value.setFromMatrix4(tmpM.extractRotation(ball.matrixWorld));
    sP1[0].set(feed.x, feed.y + Math.sin(time*0.55)*2.2, feed.z);
    // thin yarns never thinner than a pixel and a half
    if (camera) {
      SU.uCamL.value.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(SU.uCamL.value);
      ctx.renderer?.getDrawingBufferSize(size);
      SU.uPx.value = STYLE.uniforms.uPxS.value = 2/(Math.max(camera.projectionMatrix.elements[5], 0.1)*Math.max(size.y || 720, 64));
    }
  }
  update(0, 0, null);

  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  return {
    object, radius: 175, height: 215, center: V3(-40, 118, 10), ground: true, groundY: 0,
    anchors: {
      crossing: V3(0, CY, 0),                        // where the needles cross (nominal; hero.crossing is live)
      rotationY: -2.03,                              // object.rotation.y that turns local +Z toward the crest in the brief's layout
      viewpoints: [{ position: V3(0, 106, 401), lookAt: V3(-30, 150, 0) }, { position: V3(-5, 58, 207), lookAt: V3(0, CY, 0) }],
      flyThrough: [V3(0, 106, 401), V3(-2, 92, 345), V3(-3.5, 75, 275), V3(-5, 58, 207)],
      portalSeat: { position: V3(-5, 58, 207), facing: V3(0.0, 0.24, 0.97).normalize() },
      selvedgeTop: V3(WIDTH/2, CY - 12, 0), selvedgeFoot: V3(WIDTH/2, 0, 0), hemLeft: V3(-WIDTH/2, 0, 0),
      ball: ballPos.clone(), ballRadius: BR + 12, ballFeed: feed.clone(),
      strandSources: [],                             // (the Sound no longer comes undone: the ball alone feeds the needles)
      knobLeft: V3(-260, CY + 260*tilt, -260*splay), knobRight: V3(260, CY + 260*tiltR, -260*splay),
    },
    crossing: cross,                                 // live local position of the crossing
    uniforms: { ...U, ...SU },
    setProgress(u, duration = 42) { override = 1 + clamp(u, 0, 1)*duration*0.6; },   // 0.6 loops cast off a second of flight
    setClock(loops) { override = loops; },           // or drive it yourself: loops cast off so far, 0..30 (negative: free-run)
    // the rare dropped stitch: rib 0..29 laddered down to `depth` metres below the needle (0 = mended); ribPoint gives
    // the local position of a point on that rib's face, for the crochet hook that works it back up
    setDrop(rib, depth) { U.uDrop.value.set(depth > 0.5 ? rib : -9, depth); },
    ribPoint(rib, depth, out = new THREE.Vector3()) { const x = X0 + (rib + 0.5)*PITCH; topAt(x, out); return out.set(x, out.y - depth, landZ(x, depth) + 3); },
    update,
    dispose() {},
  };
}
