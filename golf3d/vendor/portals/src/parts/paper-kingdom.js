// THE UNFOLDING: hero set piece of "paper-kingdom".
//
// A great pop-up book, 300 m wide and 312 m deep, lying open on the valley floor. Its gutter (the fold between
// the two pages) is the city's main avenue, 30 m wide and 260 m long. About 200 paper townhouses, two V-fold
// bridges over the avenue, cut-out trees, a castle, layered skyline flats and a 70 m paper tower stand on the
// pages; a 60 m standing page with a circle cut clean out of it closes the far end of the avenue. Everything
// on the pages is a true parallelogram pop-up: it lies flat and shears upright (with a springy snap) in a wave
// that runs down the avenue and out from the gutter. A thousand origami cranes roost on the ridges, lift off,
// spiral up around the tower and pour down the avenue through the hole in the standing page.
//
// LOCAL SPACE  origin at the base centre of the book (y = 0, underside of the cover), +Y up. The gutter/avenue
//              runs along Z; the camera arrives from +Z and the standing page with the portal hole is at
//              z = -134 facing +Z. Page surface is y = 9. The tower is on the left (-X) of the avenue.
// SIZE         radius 220 (book corners), height 86 (tower finial); cranes reach y ~ 100; the ribbon bookmark
//              trails to z = +196 in front of the book.
// COST         about 33.5k triangles (22k of them the 1000 cranes), 5 draw calls (book, pop-ups, cranes, portal
//              glow, confetti), no lights.
//              One 1024 px canvas texture (baked paper shadows on the page). Build about 100-150 ms.
// LIGHTING     Self-lit paper shader (does NOT read scene lights): a warm key from opts.lightDir (default the
//              upper left, (-0.6, 0.7, 0.4)), lavender-grey shade, warm translucency on back-lit faces, baked
//              soft shadows on the page. Wants a pale cream sky, almost no fog (all materials respect
//              scene.fog), bloom threshold ~0.9: only the lit windows (HDR ~3) and the hole's light (HDR 4-6)
//              bloom. Change hero.uniforms.uSun / uAmbSky / uAmbShade (linear THREE.Color) to regrade.
//
// OPTS         palette     7 hex strings in brief order (cream, warm cream, tan, grey, ink, indigo, red).
//              lightDir    [x,y,z] world-space direction TO the key light (also bakes the page shadows).
//              cranes      number of cranes (default 1000).
//              confetti    number of confetti flakes (default 600, 0 disables).
//              craneSize   scale of a crane (default 1.45: wingspan about 5 m).
//              holeFill    true (default) draws a warm glowing disc behind the hole; pass false if the
//                          world's portal fills the hole (rim glow and light rays stay).
//              unfoldFrom / unfoldTo   path-u window of the unfolding wave (default 0.50 .. 0.76).
//              ceiling     (x, z, reach = 22) -> highest world y a solid may reach there, 1e9 when free: the
//                          world's camera corridor. Houses under it become low mansards, kites keep away.
//              craneAccent colour of the few accent cranes (default the palette red).
//              cranesFrom / cranesTo   path-u window of the cranes' lift-off and pour (default 0.72 .. 0.96).
//
// PROGRESS     hero.setWave(d): the wave front sits d metres along the fly-through past the book's corner
//              (waveDistance(x, z) is exported): pieces there start to rise, 20 m behind it they stand.
//              hero.setProgress(u), u = 0..1 along the world's path: drives the unfolding wave and the cranes
//              through the windows above (never the clock). hero.setUnfold(x) / hero.setCranes(x), x = 0..1,
//              drive the two directly. Default (never called) = u 0.9: city up, cranes spiralling and pouring.
//              Ambient motion (wing beats, circling, confetti, fluttering corners, window flicker) uses time.
//
// ANCHORS (local space)
//   portalSeat   { position, facing, radius }: centre of the circular hole (r 7.6 m) cut in the standing page,
//                facing +Z; seat the 14 m 'circle' portal here.
//   flyThrough   ordered Vector3 list (also exported as FLY_THROUGH): in over the right-hand page from its
//                outer edge, 25-35 m above the print and over the front rows, a left turn down onto the avenue, under both bridges
//                (z 44 and z 0, y 17-22), the climb past the tower, then 84 m straight and level into the hole
//                (y 36). Pass opts.ceiling so the houses under the way in stay low; cranes fly beside it.
//   beyond       point 60 m behind the hole on the same line.
//   gutter       { a, b }: ends of the fold line on the page surface.
//   avenue       { start, end, width: 30 }.
//   tower        { base, top, radius, wave }: the 70 m paper tower; wave = the setWave distance (metres) at which
//                its fold starts. craneColumn { center, radius, yMin, yMax }.
//   standingPage { center, width, height, z }.
//   bridges      [ { z, clearY, halfWidth } ]: underside apex height and clear half width of each bridge.
//   bookMin / bookMax   corners of the book's footprint (for seating it in the valley / carving terrain).
//   castle       Vector3: foot of the castle keep (right page on most seeds, left on some).
//   viewpoints   { far, reveal, gutter, avenue, tower }: good camera positions looking at `center`.
//
// EXPORTS      buildHero, plus craneGeometry() and GLSL_PAPER_LIGHT so the world can fold more paper the same way.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#f4ecdc', '#e6dcc6', '#c9bda2', '#8a8272', '#2a2a3a', '#1f3fa8', '#e23a2a'];

// ---- fixed proportions (metres) ----
const BX = 148, BZ = 150;            // half size of the page block
const PY = 9;                        // page surface height
const AVE = 15;                      // avenue half width
const ZA = 130, ZB = -130;           // avenue start (near, +Z) and end
const PAGE_Z = -134;                 // standing page plane
const PAGE_W = 48, PAGE_H = 60;      // standing page half width, height
const HOLE_R = 7.6, HOLE_Y = PY + 27;     // hole radius and centre height
const TWR = { x: -37, z: -8, h: 70 };

// unfold phase (0..1) of a point on the pages: the wave runs down the avenue and out from the gutter
// (waveDistance = metres the camera has flown past the book's right-hand edge when it is abreast of that point)
const WAVE_LEN = 446, PH0 = 0.08, PH1 = 0.84;
export const waveDistance = (x, z) => {
  const a = (152 - x) * 0.96 + (124 - z) * 0.26, b = 86 + (144 - z) + 0.35 * Math.abs(x);
  return lerp(b, a, smoothstep(-10, 30, x) * smoothstep(-20, 60, z));
};
const phaseAt = (x, z) => clamp(PH0 + PH1 * waveDistance(x, z) / WAVE_LEN, PH0, 0.97);
// the route the pop-ups are laid out around (local space == anchors.flyThrough)
export const FLY_THROUGH = [[152, 45, 124], [100, 40, 106], [50, 34, 96], [18, 27, 84], [3, 20, 62], [0, 17, 44], [0, 17.5, 18], [0, 25, -10], [0, 33.5, -36],
  [0, 36, -50], [0, 36, -92], [0, 36, -134]];
// same spring as the shader: 0 flat, settles at 1 with one overshoot
const springE = (unfold, phase) => { const t = Math.max(0, (unfold * 1.4 - phase) / 0.16); return 1 - Math.exp(-5 * t) * Math.cos(7 * t); };

// ---- geometry builder: quads/tris with per-face paper attributes ----
// uv = face coordinates in metres, aSize = face size (x <= 0: no edge line; x = -1: triangle, uv = barycentric)
// aFold = (fold dir x, fold dir z, phase)  phase < 0: static (x = flutter amplitude, y = flutter seed)
// aK = (kind, per-face seed)
function makeBuilder(rng) {
  const P = [], C = [], U = [], S = [], F = [], K = [];
  let fx = 0, fz = 0, ph = -1, seed = 0;
  const push = (p, r, g, b, u, v, sx, sy, kind) => { P.push(p[0], p[1], p[2]); C.push(r, g, b); U.push(u, v); S.push(sx, sy); F.push(fx, fz, ph); K.push(kind, seed); };
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const B = {
    fold(dx, dz, phase) { fx = dx; fz = dz; ph = phase; seed = Math.floor(rng() * 997); },
    still(amp = 0, s = 0) { fx = amp; fz = s; ph = -1; seed = Math.floor(rng() * 997); },
    // a (0,0)  b (w,0)  c (w,h)  d (0,h)
    quad(a, b, c, d, col, kind = 0, o = {}) {
      const t = 1 + (rng() - 0.5) * 2 * (o.tint ?? 0.05);
      const r = col.r * t, g = col.g * t, bl = col.b * t;
      const w = o.w ?? dist(a, b), h = o.h ?? dist(a, d);
      const sx = o.noEdge ? 0 : w, sy = h, u0 = o.u0 ?? 0, v0 = o.v0 ?? 0;
      if (o.uv) { // explicit uv per corner (metres), explicit size
        const q = o.uv, z = o.size;
        push(a, r, g, bl, q[0], q[1], z[0], z[1], kind); push(b, r, g, bl, q[2], q[3], z[0], z[1], kind); push(c, r, g, bl, q[4], q[5], z[0], z[1], kind);
        push(a, r, g, bl, q[0], q[1], z[0], z[1], kind); push(c, r, g, bl, q[4], q[5], z[0], z[1], kind); push(d, r, g, bl, q[6], q[7], z[0], z[1], kind);
        return;
      }
      push(a, r, g, bl, u0, v0, sx, sy, kind); push(b, r, g, bl, u0 + w, v0, sx, sy, kind); push(c, r, g, bl, u0 + w, v0 + h, sx, sy, kind);
      push(a, r, g, bl, u0, v0, sx, sy, kind); push(c, r, g, bl, u0 + w, v0 + h, sx, sy, kind); push(d, r, g, bl, u0, v0 + h, sx, sy, kind);
    },
    tri(a, b, c, col, kind = 0, o = {}) {
      const t = 1 + (rng() - 0.5) * 2 * (o.tint ?? 0.05);
      const r = col.r * t, g = col.g * t, bl = col.b * t;
      // approximate inradius scale so the barycentric edge line has a metric width
      const ab = dist(a, b), bc = dist(b, c), ca = dist(c, a), s = (ab + bc + ca) / 2;
      const area = Math.sqrt(Math.max(0, s * (s - ab) * (s - bc) * (s - ca)));
      const hh = o.noEdge ? 0 : (2 * area) / Math.max(ab, bc, ca, 1e-3);
      const sx = o.noEdge ? 0 : -1;
      push(a, r, g, bl, 1, 0, sx, hh, kind); push(b, r, g, bl, 0, 1, sx, hh, kind); push(c, r, g, bl, 0, 0, sx, hh, kind);
    },
    // four walls of a box, uv continuous in metres, bottom to top
    walls(x0, x1, z0, z1, y0, y1, col, kind = 1, o = {}) {
      B.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col, kind, o);
      B.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], col, kind, o);
      B.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], col, kind, o);
      B.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col, kind, o);
    },
    // n-gon frustum ring between (r0,y0) and (r1,y1) around (cx,cz)
    ring(cx, cz, r0, y0, r1, y1, n, col, kind = 0, rot = 0, o = {}) {
      for (let i = 0; i < n; i++) {
        const a0 = rot + (i / n) * Math.PI * 2, a1 = rot + ((i + 1) / n) * Math.PI * 2;
        const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        if (r1 < 0.01) B.tri([cx + c1 * r0, y0, cz + s1 * r0], [cx + c0 * r0, y0, cz + s0 * r0], [cx, y1, cz], col, kind, o);
        else B.quad([cx + c1 * r0, y0, cz + s1 * r0], [cx + c0 * r0, y0, cz + s0 * r0], [cx + c0 * r1, y1, cz + s0 * r1], [cx + c1 * r1, y1, cz + s1 * r1], col, kind, o);
      }
    },
    get tris() { return P.length / 9; },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      g.setAttribute('aSize', new THREE.Float32BufferAttribute(S, 2));
      g.setAttribute('aFold', new THREE.Float32BufferAttribute(F, 3));
      g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 2));
      return g;
    },
  };
  return B;
}

// ---- shared GLSL ----
const GLSL_COMMON = /* glsl */`
  uniform float uUnfold, uTime;
  const float PY = ${PY.toFixed(1)};
  float hash11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
  float hash21(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float springE(float phase){ float t = max(0., (uUnfold * 1.4 - phase) / .16); return 1. - exp(-5. * t) * cos(7. * t); }
  // parallelogram pop-up: every point swings about its own foot on the page, along the fold direction
  vec3 popup(vec3 p, vec2 dir, float e){
    float h = p.y - PY, th = mix(.05, 1.5708, e);
    return vec3(p.x + dir.x * h * cos(th), PY + h * sin(th), p.z + dir.y * h * cos(th));
  }
  float phaseAt(vec2 xz){
    float a = (152. - xz.x) * .96 + (124. - xz.y) * .26, b = 86. + (144. - xz.y) + .35 * abs(xz.x);
    float d = mix(b, a, smoothstep(-10., 30., xz.x) * smoothstep(-20., 60., xz.y));
    return clamp(${PH0.toFixed(2)} + ${PH1.toFixed(2)} * d / ${WAVE_LEN.toFixed(1)}, ${PH0.toFixed(2)}, .97);
  }
`;
export const GLSL_PAPER_LIGHT = /* glsl */`
  uniform vec3 uLightDir, uSun, uAmbSky, uAmbShade, uWarm;
  uniform float uCloudT;
  float plH(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float plN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(plH(i), plH(i + vec2(1., 0.)), f.x), mix(plH(i + vec2(0., 1.)), plH(i + 1.), f.x), f.y); }
  // the shadows of the cloud flats sliding over the desk: crisp-edged, like paper shadows
  float cloudShade(vec3 viewPos){
    vec3 w = cameraPosition + (vec4(viewPos, 0.) * viewMatrix).xyz;
    vec2 q = w.xz * .0040 + vec2(uCloudT * .042, uCloudT * .013);
    float n = plN(q) * .66 + plN(q * 2.7 + 7.3) * .34;
    return 1. - .46 * smoothstep(.555, .60, n);
  }
  // flat-shaded paper: geometric normal from derivatives (always faces the viewer), warm transmission when back-lit
  vec3 paperLight(vec3 alb, vec3 viewPos, float shadow, float ao, out vec3 n){
    n = normalize(cross(dFdx(viewPos), dFdy(viewPos)));
    vec3 L = normalize((viewMatrix * vec4(uLightDir, 0.)).xyz);
    vec3 nw = (vec4(n, 0.) * viewMatrix).xyz;
    float ndl = dot(n, L);
    vec3 amb = mix(uAmbShade, uAmbSky, nw.y * .5 + .5) * ao;
    vec3 sun = uSun * (max(ndl, 0.) * shadow + max(-ndl, 0.) * .26 * shadow) * cloudShade(viewPos);
    return alb * (amb + sun) + alb * uWarm * max(-ndl, 0.) * .10;
  }
`;

// ---- the paper material (book + every pop-up) ----
function makePaperMaterial(U) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true, vertexColors: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uUnfold: U.uUnfold, uTime: U.uTime, uLightDir: U.uLightDir, uSun: U.uSun,
      uAmbSky: U.uAmbSky, uAmbShade: U.uAmbShade, uWarm: U.uWarm, uInk: U.uInk, uRed: U.uRed, uBlue: U.uBlue, uHole: U.uHole, uGlow: U.uGlow, uShadow: U.uShadow,
      uCloudT: U.uTime, uPageCol: U.uPageCol },
    vertexShader: /* glsl */`
      attribute vec2 aSize; attribute vec3 aFold; attribute vec2 aK;
      uniform vec3 uHole;
      varying vec3 vRest, vView, vCol, vHole; varying vec2 vUv, vSize, vK; varying float vE, vPop;
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      void main(){
        vec3 p = position; float e = 1.;
        if (aFold.z >= 0.) {
          e = springE(aFold.z); float ec = clamp(e, 0., 1.);
          if (aK.x > 11.5) {                                  // the rosette round the hole: petal tips breathe toward the avenue
            float w = aSize.x < -.5 ? 1. - uv.x - uv.y : 0.;
            p.z += w * ec * (.8 * sin(uTime * 2.1 + aK.y) + .35 * sin(uTime * 4.3 + aK.y * 1.7));
            p.x += w * ec * .3 * sin(uTime * 1.7 + aK.y * 2.3);
          } else if (aK.x > 10.5) {                           // paper-doll chains: a ripple runs down the line of linked hands
            float h = max(p.y - PY, 0.) / 5. * ec, ph = (position.x + position.z) * .33;
            float r = .42 * sin(uTime * 1.7 + ph) + .18 * sin(uTime * 3.4 + ph * 2.1);
            p.x += h * r; p.z += h * r * .6;
          } else if (aK.x > 9.5) {                            // avenue trees: the cut-out crowns nod
            float h = max(p.y - PY - 1.5, 0.) / 8.; h *= h * ec;
            p.x += h * (.75 * sin(uTime * 1.25 + position.z * .31) + .3 * sin(uTime * 2.9 + position.z * 1.1));
            p.z += h * 1.1 * sin(uTime * .95 + position.z * .21 + 1.3);
          } else if (aK.x > 8.5) {                            // bunting: the pennant tips snap about in the draught
            float w = aSize.x < -.5 ? 1. - uv.x - uv.y : 0., ph = position.z * .55 + aK.y;
            p.x += w * ec * (.85 * sin(uTime * 3.1 + ph) + .4 * sin(uTime * 5.3 + ph * 1.7));
            p.z += w * ec * .5 * cos(uTime * 2.3 + ph);
            p.y += w * ec * .25 * sin(uTime * 4.1 + ph * 1.3);
          } else if (aK.x > 7.5) {                            // kites
            float k = (p.y - PY) / 60.; k *= k;
            p += vec3(sin(uTime * .5 + aK.y) * 5., sin(uTime * .8 + aK.y * 2.) * 1.6, cos(uTime * .37 + aK.y * 1.7) * 4.) * k;
            p.x += k * .9 * sin(uTime * 3.3 + p.y * .7 + aK.y);  // tail ripple
          } else if (aK.x > 1.5 && aK.x < 2.5) {              // the standing page: its top corners curl forward and flutter
            float c = smoothstep(24., 48., abs(uv.x - ${PAGE_W.toFixed(1)})) * smoothstep(30., ${PAGE_H.toFixed(1)}, uv.y); c *= c;
            p.z += c * (5. + 2.6 * sin(uTime * 1.3 + uv.x * .08) + 1.1 * sin(uTime * 2.9 + uv.x * .21));
            p.y -= c * (1.5 + .8 * sin(uTime * 1.3 + uv.x * .08));
          }
          p = popup(p, aFold.xy, e);
        }
        else if (aK.x > 6.5) { float w = uv.x / max(aSize.y, 1.); p.y += aFold.x * w * w * (.6 + sin(uTime * 1.7 + aFold.y + uv.y * .09) + .4 * sin(uTime * 3.1 + aFold.y * 2. + uv.y * .21)); }
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        vView = mvPosition.xyz; vHole = (modelViewMatrix * vec4(uHole, 1.)).xyz - mvPosition.xyz;
        vRest = position; vCol = color; vUv = uv; vSize = aSize; vK = aK; vE = e; vPop = step(0., aFold.z);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uInk, uRed, uBlue, uPageCol; uniform float uGlow; uniform sampler2D uShadow;
      varying vec3 vRest, vView, vCol, vHole; varying vec2 vUv, vSize, vK; varying float vE, vPop;
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      ${GLSL_PAPER_LIGHT}
      float vnoise(vec3 p){
        vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        float n = i.x + i.y * 57. + i.z * 113.;
        return mix(mix(mix(hash11(n), hash11(n + 1.), f.x), mix(hash11(n + 57.), hash11(n + 58.), f.x), f.y),
                   mix(mix(hash11(n + 113.), hash11(n + 114.), f.x), mix(hash11(n + 170.), hash11(n + 171.), f.x), f.y), f.z);
      }
      // printed lines of "words": p in metres, lh = line height
      float textInk(vec2 p, float lh){
        float row = floor(p.y / lh), fr = fract(p.y / lh);
        float band = step(.30, fr) * step(fr, .66);
        float cw = lh * .62, cx = floor(p.x / cw), fx = fract(p.x / cw);
        float word = step(.17, hash21(vec2(floor(cx * .37 + hash11(row) * 9.), row))) * step(.06, fx) * step(fx, .94);
        float para = step(hash11(row * 1.7 + 3.), .9);
        return band * mix(step(.5, hash21(vec2(cx, row))), 1., .75) * word * para;
      }
      // a column of print between x0 and x1: ragged right edge, paragraph breaks, short last lines, indents
      float textCol(vec2 p, float lh, float x0, float x1){
        float row = floor(p.y / lh), fr = fract(p.y / lh);
        float band = step(.30, fr) * step(fr, .66);
        float blank = step(hash11(row * 1.7 + 3. + x0), .12), last = step(hash11((row - 1.) * 1.7 + 3. + x0), .12), first = step(hash11((row + 1.) * 1.7 + 3. + x0), .12);
        float len = mix(mix(.86, 1., hash11(row * 3.1 + x0)), mix(.22, .7, hash11(row * 5.3 + x0)), last);
        float t = (p.x - x0) / (x1 - x0);
        float inside = step(first * .07, t) * step(t, len);
        float cw = lh * .62, cx = floor(p.x / cw), fx = fract(p.x / cw);
        float word = step(.17, hash21(vec2(floor(cx * .37 + hash11(row) * 9.), row))) * step(.06, fx) * step(fx, .94);
        return band * word * inside * (1. - blank) * mix(.7, 1., hash21(vec2(cx, row)));
      }
      float box(vec2 p, vec2 lo, vec2 hi){ return step(lo.x, p.x) * step(p.x, hi.x) * step(lo.y, p.y) * step(p.y, hi.y); }
      float frameLine(vec2 p, vec2 lo, vec2 hi, float w){ return box(p, lo, hi) - box(p, lo + w, hi - w); }
      void main(){
        float kind = vK.x, seed = floor(vK.y + .5), e = clamp(vE, 0., 1.);   // snap the interpolated per-face seed
        vec3 alb = vCol, emis = vec3(0.);
        float shadow = 1., ao = 1.;
        vec3 fp = vRest * vec3(.8, 2.3, .8);
        alb *= .93 + .12 * (vnoise(fp) * .6 + vnoise(fp * 3.7 + 11.) * .4);
        float ed = 1e3;
        if (vSize.x > 0.) ed = min(min(vUv.x, vSize.x - vUv.x), min(vUv.y, vSize.y - vUv.y));
        else if (vSize.x < -.5) ed = min(min(vUv.x, vUv.y), 1. - vUv.x - vUv.y) * vSize.y;
        float aa = fwidth(ed) + 1e-4;
        float line = (1. - smoothstep(.05, .05 + aa, ed)) * clamp(.3 / aa, 0., 1.);
        if (vPop > .5) ao = mix(.66, 1., smoothstep(0., 8., vRest.y - PY));

        if (kind > .5 && kind < 1.5) {                       // wall with cut-out windows lit from behind
          vec2 nc = max(floor(vSize / vec2(3.1, 3.5) + .03), 1.), cell = vSize / nc;   // +.03: vSize is interpolated, keep the count stable
          vec2 g = vUv / cell, id = floor(g), f = fract(g);
          float ok = step(2.2, vSize.x) * step(3., vSize.y);
          float win = step(abs(f.x - .5), .23) * step(.30, f.y) * step(f.y, .76) * ok;
          float frame = step(abs(f.x - .5), .29) * step(.25, f.y) * step(f.y, .81) * ok - win;
          float mull = max(step(abs(f.x - .5), .022), step(abs(f.y - .55), .016));
          float h = hash21(id + vec2(seed * .37, seed * .11)), lit = step(.36, h);
          alb = mix(alb, alb * .78, frame * .7);
          alb = mix(alb, mix(alb * vec3(.34, .34, .46), alb * .45, lit), win);
          float h2 = hash21(id + vec2(seed * .71 + 2., seed * .43));
          float flick = 1. + .15 * sin(uTime * (2.2 + h * 4.) + h2 * 40.) + step(.72, h2) * .22 * sin(uTime * 7.3 + h * 60.) * sin(uTime * 1.9 + h2 * 20.);
          emis += uWarm * win * lit * (1. - mull * .8) * (1.3 + 1.8 * hash21(id + vec2(seed * .13 + 5., seed * .29))) * flick * e * e;
        } else if (kind < 2.5 && kind > 1.5) {               // the standing page: print, ornament ring, light spilling from the cut
          vec2 c = vUv - vec2(${PAGE_W.toFixed(1)}, ${(HOLE_Y - PY).toFixed(1)}); float r = length(c);
          float mrg = step(7., vUv.x) * step(vUv.x, ${(2 * PAGE_W - 7).toFixed(1)}) * step(5., vUv.y) * step(vUv.y, ${(PAGE_H - 6).toFixed(1)});
          vec2 b0 = vec2(60., 7.5), b1 = vec2(88., 20.);                          // a blue engraved plate, bottom right
          float plate = box(vUv, b0, b1);
          float tx = (textCol(vUv, 1.9, 8., 45.) * box(vUv, vec2(8., 5.), vec2(45., 45.5)) + textCol(vUv, 1.9, 51., 88.) * box(vUv, vec2(51., 5.), vec2(88., 45.5)))
            * mrg * smoothstep(13., 13.6, r) * (1. - plate);
          alb = mix(alb, uInk, tx * .55 * (1. - step(vUv.x, 17.5) * step(36., vUv.y)));
          float hills = step(vUv.y, b0.y + 3.5 + 3. * vnoise(vec3(vUv.x * .35, 3., 1.)) + 2.4 * abs(sin(vUv.x * .42)));
          float rays = step(.5, fract(atan(vUv.y - b0.y - 4., vUv.x - 74.) * 3.2)) * step(3.2, length(vUv - vec2(74., b0.y + 4.)));
          vec3 pl = mix(mix(uBlue, vCol, .78), mix(uBlue, vCol, .52), rays);
          pl = mix(pl, mix(uBlue, uInk, .35), hills); pl = mix(pl, uRed, step(length(vUv - vec2(74., b0.y + 4.)), 2.6) * (1. - hills));
          alb = mix(alb, pl, plate * .92);
          alb = mix(alb, uInk, frameLine(vUv, b0 - .5, b1 + .5, .22) * .7);
          alb = mix(alb, uRed, box(vUv, vec2(46.6, 2.2), vec2(49.4, 3.6)) * .8);                       // folio mark
          alb = mix(alb, uInk, frameLine(vUv, vec2(4.5, 1.2), vec2(${(2 * PAGE_W - 4.5).toFixed(1)}, ${(PAGE_H - 3).toFixed(1)}), .16) * .35);
          vec2 dc = abs(vUv - vec2(12., 41.5));                                   // red drop cap and a heading rule
          float cap = step(max(dc.x, dc.y), 4.2) * (1. - step(max(dc.x, dc.y), 3.5) * step(.9, abs(dc.x - dc.y * .6)));
          alb = mix(alb, uRed, cap * .85);
          alb = mix(alb, uInk, step(abs(vUv.y - 49.5), 1.1) * step(22., vUv.x) * step(vUv.x, 74.) * step(.25, fract(vUv.x / 5.3)) * .6);
          float ra = fwidth(r);
          alb = mix(alb, uRed, (smoothstep(10.2 - ra, 10.2, r) - smoothstep(10.8, 10.8 + ra, r)) * .85);
          alb = mix(alb, uInk, (smoothstep(11.7 - ra, 11.7, r) - smoothstep(11.9, 11.9 + ra, r)) * .6);
          float dr = max(r - ${HOLE_R.toFixed(1)}, 0.);
          emis += uWarm * (2.2 * exp(-dr * 1.6) + .28 * exp(-dr * .2)) * uGlow;
        } else if (kind > 2.5 && kind < 3.5) {               // roof: shingle rows
          float rw = fract(vUv.y / 1.15), ra = fwidth(vUv.y / 1.15);
          alb *= 1. - .16 * (1. - smoothstep(.1, .1 + ra, rw)) * clamp(.4 / ra, 0., 1.);
        } else if (kind > 3.5 && kind < 4.5) {               // book page: avenue, rules, print, baked pop-up shadows
          vec2 q = vRest.xz; float ax = abs(q.x), ra = fwidth(ax) + 1e-4;
          float ave = 1. - smoothstep(${AVE.toFixed(1)} - .2, ${AVE.toFixed(1)}, ax);
          float inb = step(abs(q.y), 143.);
          // the printed spread: two columns of text a side, a red drop cap, an engraved map, a compass plate, a tinted title band
          vec2 pp = vec2(ax, q.y), sd = vec2(step(0., q.x) * 37., 0.);
          vec2 m0 = vec2(84., 60.), m1 = vec2(137., 118.), c0 = vec2(22., -78.), c1 = vec2(76., -26.), t0 = vec2(84., -126.), t1 = vec2(137., -110.), d0 = vec2(22., 124.), d1 = vec2(35., 138.);
          float mapB = box(pp, m0, m1), cmpB = box(pp, c0, c1), ttlB = box(pp, t0, t1), capB = box(pp, d0, d1);
          float colA = box(pp, vec2(22., -139.), vec2(76., 139.)), colB = box(pp, vec2(84., -139.), vec2(137., 139.));
          float tx = (textCol(vec2(ax, q.y + 400.) + sd, 2.6, 22. + sd.x, 76. + sd.x) * colA + textCol(vec2(ax, q.y + 400.) + sd, 2.6, 84. + sd.x, 137. + sd.x) * colB)
            * (1. - mapB) * (1. - cmpB) * (1. - ttlB) * (1. - box(pp, d0 - 1., d1 + vec2(2., 1.))) * inb;
          alb = mix(alb, uInk, tx * .36);
          vec3 wash = mix(uBlue, vCol, .80);
          // engraved map: contour lines in pale blue ink, a red route, a hatched sea
          float hgt = vnoise(vec3(q * .045 + sd.x, 2.)) * .65 + vnoise(vec3(q * .13, 9.)) * .35, hw = fwidth(hgt) * 9. + 1e-4;
          float cont = (1. - smoothstep(.08, .08 + hw, abs(fract(hgt * 9.) - .5) * 2.)) * clamp(.5 / hw, 0., 1.);
          float sea = step(hgt, .40) * step(.5, fract((q.x + q.y) * .45));
          vec3 mp = mix(vCol * .97, wash, sea * .55); mp = mix(mp, mix(uBlue, uInk, .3), cont * .55);
          mp = mix(mp, uRed, (1. - smoothstep(.0, .5, abs(pp.y - 89. - 14. * sin(pp.x * .11 + sd.x)) - .25)) * step(.4, fract(pp.x * .35)) * .8);
          alb = mix(alb, mp, mapB); alb = mix(alb, uInk, frameLine(pp, m0 - .8, m1 + .8, .3) * .6);
          // compass plate: rings and a sixteen-point star
          vec2 cc = pp - (c0 + c1) * .5; float cr = length(cc), ca = atan(cc.y, cc.x), cw = fwidth(cr) + 1e-4;
          float star = step(cr, 9. + 13. * pow(abs(cos(ca * 4.)), 6.) + 4. * pow(abs(cos(ca * 8. + 1.5708)), 10.));
          float rings = (1. - smoothstep(.12, .12 + cw, abs(cr - 23.))) + (1. - smoothstep(.1, .1 + cw, abs(cr - 20.5))) + step(.5, fract(ca * 5.093)) * step(20.5, cr) * step(cr, 23.);
          vec3 cp = mix(vCol * .98, wash, star * .7 * step(.5, fract(ca * 1.2732 + .125)) + star * .25);
          cp = mix(cp, uRed, step(cr, 2.2) * .85); cp = mix(cp, mix(uBlue, uInk, .3), clamp(rings, 0., 1.) * .55);
          alb = mix(alb, cp, cmpB); alb = mix(alb, uInk, frameLine(pp, c0 - .8, c1 + .8, .3) * .5);
          // title band and drop cap
          alb = mix(alb, wash, ttlB * .8); alb = mix(alb, uInk, ttlB * step(abs(pp.y + 118.), 1.6) * step(90., pp.x) * step(pp.x, 131.) * step(.22, fract(pp.x / 6.1)) * .55);
          vec2 dq = abs(pp - (d0 + d1) * .5);
          alb = mix(alb, uRed, capB * (1. - step(max(dq.x, dq.y), 5.2) * step(1.3, abs(dq.x - dq.y * .55))) * .85);
          // margin rules, running head
          alb = mix(alb, uRed, (smoothstep(140.2 - ra, 140.2, ax) - smoothstep(140.5, 140.5 + ra, ax)) * .55 * inb);
          alb = mix(alb, uInk, step(abs(abs(q.y) - 141.2), .14) * step(20., ax) * step(ax, 139.) * .45);
          // fold creases across the sheet (every 60 m, and one down each page): a lit lip and a lavender valley
          float fz = (fract((q.y + 30.) / 60. + .5) - .5) * 60., fxx = ax - 80.;
          float crease = exp(-fz * fz / 5.) + exp(-fxx * fxx / 5.) * .8;
          alb = mix(alb, alb * vec3(.78, .78, .90), clamp(crease, 0., 1.) * .55);
          alb *= 1. + .05 * (smoothstep(0., 6., fz) * exp(-abs(fz) / 9.) - smoothstep(0., 6., -fz) * exp(-abs(fz) / 9.));
          alb = mix(alb * vec3(.90, .89, .95), alb, smoothstep(0., 70., ax));           // the sheet curls down into the gutter
          // avenue: cut-paper paving, each tile its own off-white, joints scored in
          float brick = step(.5, fract(q.y / 12.)) * 2.5;
          float jz = fract(q.y / 6.), jx = fract((ax + brick) / 5.);
          float ja = fwidth(q.y / 6.), jb = fwidth(ax / 5.) + 1e-4;
          float joint = max((1. - smoothstep(.025, .025 + ja, jz)) * clamp(.25 / ja, 0., 1.), (1. - smoothstep(.03, .03 + jb, jx)) * clamp(.25 / jb, 0., 1.));
          float tile = hash21(vec2(floor(q.y / 6.), floor((ax + brick) / 5.)));
          alb *= 1. - ave * (.03 + .09 * tile * clamp(.5 / ja, 0., 1.) + .16 * joint);
          alb = mix(alb, alb * vec3(.84, .84, .93), ave * step(.86, tile) * clamp(.5 / ja, 0., 1.) * .6);
          alb = mix(alb, uBlue, (smoothstep(15.5 - ra, 15.5, ax) - smoothstep(15.85, 15.85 + ra, ax)) * .8 * inb);
          alb = mix(alb, uRed, (smoothstep(16.7 - ra, 16.7, ax) - smoothstep(16.9, 16.9 + ra, ax)) * .8 * inb);
          alb *= 1. - .45 * (1. - smoothstep(.12, .12 + ra, ax));
          alb = mix(alb, uRed, (1. - smoothstep(.3, .3 + ra, ax)) * step(fract(q.y / 9.), .55) * step(.12, ax) * .8 * inb);   // sewn binding thread
          ao = mix(.72, 1., smoothstep(0., 9., ax));          // the valley fold sits in shade
          float sh = texture2D(uShadow, (q + 150.) / 300.).r;
          shadow = 1. - sh * .85 * clamp(springE(phaseAt(q)), 0., 1.);
        } else if (kind > 5.5 && kind < 6.5) {               // fore-edge: the stack of page edges
          float l = fract(vUv.y * 5.), la = fwidth(vUv.y * 5.);
          alb *= 1. - .22 * step(l, .45) * clamp(.3 / la, 0., 1.);
        }
        if (vPop > .5) {                                      // lying flat, every piece is a bold printed cut-out of itself
          float up = smoothstep(.03, .5, e), hs = hash11(seed * 1.37 + 5.);
          bool body = (kind > .5 && kind < 1.5) || (kind > 2.5 && kind < 3.5);       // walls and roofs: printed in red, indigo or their own paper
          vec3 inkC = hs < .30 ? uRed : (hs < .52 ? mix(uBlue, uInk, .25) : alb);
          vec3 flatC = body ? mix(alb, inkC, .8) : alb;
          float keep = body || kind > 8.5 ? .9 : .55;
          alb = mix(mix(uPageCol * .93, flatC, keep), alb, up);
        }
        alb = mix(alb, alb * vec3(.56, .55, .66), line * .7);
        vec3 n;
        vec3 col = paperLight(alb * .8, vView, shadow, ao, n);
        float front = smoothstep(${(PAGE_Z + 0.5).toFixed(1)}, ${(PAGE_Z + 3).toFixed(1)}, vRest.z);
        float hl = max(dot(n, normalize(vHole)), 0.) / (1. + dot(vHole, vHole) / 1500.) * uGlow * front;
        col += alb * uWarm * hl * 1.5 + emis;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---- the book: cover boards, page block with a valley fold at the gutter, curling corners, ribbon ----
const pageY = (x) => { const ax = Math.abs(x); return PY - 2.0 * Math.exp(-((ax / 5) ** 2)) - (Math.max(ax - 136, 0) ** 2 / 144) * 1.6; };

function buildBook(B, rng, C) {
  B.still();
  const half = [0, 1, 2, 3.5, 5, 7, 10, 15, 25, 50, 80, 110, 136, 139, 142, 145, BX];
  const xs = [...half.slice(1).reverse().map((v) => -v), ...half];
  const zs = [-BZ, -90, -30, 30, 90, BZ];
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i], x1 = xs[i + 1], y0 = pageY(x0), y1 = pageY(x1);
    for (let j = 0; j < zs.length - 1; j++) {
      const z0 = zs[j], z1 = zs[j + 1];
      B.quad([x0, y0, z1], [x1, y1, z1], [x1, y1, z0], [x0, y0, z0], C.page, 4, { tint: 0.012, noEdge: true });
    }
    // fore-edges at the head and tail of the book follow the page profile
    for (const z of [-BZ, BZ]) B.quad([x0, 1.4, z], [x1, 1.4, z], [x1, y1, z], [x0, y0, z], C.edge, 6, { tint: 0.02, uv: [x0, 1.4, x1, 1.4, x1, y1, x0, y0], size: [0, 1] });
  }
  for (const sx of [-1, 1]) {
    const x = sx * BX, yt = pageY(x);
    B.quad([x, 1.4, -BZ], [x, 1.4, BZ], [x, yt, BZ], [x, yt, -BZ], C.edge, 6, { tint: 0.02, uv: [0, 1.4, 300, 1.4, 300, yt, 0, yt], size: [0, 1] });
  }
  // cover boards
  const cx = BX + 6, cz = BZ + 6;
  B.quad([-cx, 1.4, cz], [cx, 1.4, cz], [cx, 1.4, -cz], [-cx, 1.4, -cz], C.cover, 5, { tint: 0.02 });
  // the page block seen from above: six stepped leaves of the stack fanning out below the top sheet, each its own
  // off-white, so the book's edge reads as a thick wad of paper and not a line
  const K = 6, stackC = [C.edge, C.page, C.walls[1], C.page, C.edge, C.page];
  for (let k = 0; k < K; k++) {
    const o = 0.6 * (K - k), y = 1.4 + (k + 1) * 0.8, yb = y - 0.8, col = stackC[k];
    for (const sz of [-1, 1]) {
      const zi = sz * (BZ + o - 0.6), zo = sz * (BZ + o);
      B.quad([-BX - o, y, zo], [BX + o, y, zo], [BX + o, y, zi], [-BX - o, y, zi], col, 0, { tint: 0.03 });
      B.quad([-BX - o, yb, zo], [BX + o, yb, zo], [BX + o, y, zo], [-BX - o, y, zo], C.edge, 6, { tint: 0.02, uv: [0, yb, 300, yb, 300, y, 0, y], size: [0, 1] });
    }
    for (const sx of [-1, 1]) {
      const xi = sx * (BX + o - 0.6), xo = sx * (BX + o), zz = BZ + o - 0.6;
      B.quad([xo, y, -zz], [xo, y, zz], [xi, y, zz], [xi, y, -zz], col, 0, { tint: 0.03 });
      B.quad([xo, yb, -zz - 0.6], [xo, yb, zz + 0.6], [xo, y, zz + 0.6], [xo, y, -zz - 0.6], C.edge, 6, { tint: 0.02, uv: [0, yb, 300, yb, 300, y, 0, y], size: [0, 1] });
    }
  }
  // the cloth cover's turned-in lip: a raised 1.5 m rim with a lighter top face
  {
    const lw = 1.5, ly = 2.5;
    B.walls(-cx, cx, -cz, cz, 0, ly, C.coverDark, 5, { tint: 0.02, noEdge: true });
    B.walls(-cx + lw, cx - lw, -cz + lw, cz - lw, 1.4, ly, C.cover, 5, { tint: 0.02, noEdge: true });
    for (const sz of [-1, 1]) B.quad([-cx, ly, sz * cz], [cx, ly, sz * cz], [cx, ly, sz * (cz - lw)], [-cx, ly, sz * (cz - lw)], C.coverLight, 5, { tint: 0.03 });
    for (const sx of [-1, 1]) B.quad([sx * cx, ly, -cz + lw], [sx * cx, ly, cz - lw], [sx * (cx - lw), ly, cz - lw], [sx * (cx - lw), ly, -cz + lw], C.coverLight, 5, { tint: 0.03 });
  }
  // gilt-free inner rule on the cover margin (a thin paper strip)
  for (const sx of [-1, 1]) B.quad([sx * (BX + 2.2), 1.45, cz - 2], [sx * (BX + 3), 1.45, cz - 2], [sx * (BX + 3), 1.45, -cz + 2], [sx * (BX + 2.2), 1.45, -cz + 2], C.page, 0, { noEdge: true });

  // loose top leaves curling up at the outer corners (they flutter)
  const N = 7;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    if (rng() < 0.2) continue;
    const lift = rng.range(6, 13), pull = rng.range(3, 8), fs = rng() * 20;
    B.still(rng.range(0.5, 1.1), fs);
    const pt = (i, j) => {
      const ax = 112 + (i / N) * 36, az = 112 + (j / N) * 38;
      const w = clamp(((ax - 112) / 36 + (az - 112) / 38 - 0.75) / 1.25, 0, 1), w2 = w * w;
      return { p: [sx * (ax - pull * w2), pageY(ax) + 0.06 + lift * w2 + 1.2 * w, sz * (az - pull * 0.8 * w2)], w: w * 10, v: az };
    };
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
      if (c.w <= 0) continue;
      B.quad(a.p, b.p, c.p, d.p, C.page, 7, { tint: 0.015, uv: [a.w, a.v, b.w, b.v, c.w, c.v, d.w, d.v], size: [0, 10] });
    }
  }
  // red ribbon bookmark spilling out of the near end of the gutter
  B.still();
  const rx = rng.range(-9, 9), wig = rng.range(-1, 1);
  const rp = [[rx, PY - 0.4, 138], [rx + 0.3, PY - 0.2, 147], [rx + 0.5, PY - 0.6, 151.5], [rx + 1, 2.9, 156.4], [rx + 2, 0.2, 162], [rx + 5 * wig, 0.2, 171],
    [rx + 2 * wig, 0.2, 180], [rx + 7 * wig, 0.2, 189], [rx + 6 * wig, 0.2, 196]];
  for (let i = 0; i < rp.length - 1; i++) {
    const a = rp[i], b = rp[i + 1], w = 1.7;
    if (i === rp.length - 2) { // swallow-tail end
      B.tri([a[0] - w, a[1], a[2]], [a[0], a[1], a[2] + 2.5], [b[0] - w, b[1], b[2]], C.red, 0);
      B.tri([a[0] + w, a[1], a[2]], [b[0] + w, b[1], b[2]], [a[0], a[1], a[2] + 2.5], C.red, 0);
      B.tri([a[0] - w, a[1], a[2]], [a[0] + w, a[1], a[2]], [a[0], a[1], a[2] + 2.5], C.red, 0, { noEdge: true });
    } else B.quad([a[0] - w, a[1], a[2]], [a[0] + w, a[1], a[2]], [b[0] + w, b[1], b[2]], [b[0] - w, b[1], b[2]], C.red, 0, { tint: 0.04 });
  }
}

// ---- pop-up pieces. Every piece registers a shadow rectangle {x0,x1,z0,z1,h} for the baked page shadows ----
function house(B, rng, C, S, x0, x1, z0, z1, h, style, side) {
  const wall = rng.pick(C.walls), roofC = rng() < 0.12 ? C.red : rng() < 0.16 ? C.blueRoof : rng.pick(C.roofs);
  const y0 = PY, y1 = PY + h, w = x1 - x0, d = z1 - z0, ov = 0.55;
  B.walls(x0, x1, z0, z1, y0, y1, wall, 1);
  B.walls(x0 - 0.18, x1 + 0.18, z0 - 0.18, z1 + 0.18, y1 - 1.0, y1 - 0.5, C.walls[0], 0, { noEdge: true, tint: 0.02 });   // cornice strip
  B.walls(x0 - 0.12, x1 + 0.12, z0 - 0.12, z1 + 0.12, y0, y0 + 0.7, C.walls[2], 0, { noEdge: true, tint: 0.03 });           // plinth
  let top = h;
  if (style === 0 || style === 1) {                       // gabled, ridge along z (0) or x (1)
    const rh = (style === 0 ? w : d) * rng.range(0.42, 0.62); top = h + rh;
    if (style === 0) {
      const xm = (x0 + x1) / 2;
      B.quad([x0 - ov, y1 - 0.3, z1 + ov], [x0 - ov, y1 - 0.3, z0 - ov], [xm, y1 + rh, z0 - ov], [xm, y1 + rh, z1 + ov], roofC, 3);
      B.quad([x1 + ov, y1 - 0.3, z0 - ov], [x1 + ov, y1 - 0.3, z1 + ov], [xm, y1 + rh, z1 + ov], [xm, y1 + rh, z0 - ov], roofC, 3);
      B.tri([x0, y1, z1], [x1, y1, z1], [xm, y1 + rh, z1], wall, 0); B.tri([x1, y1, z0], [x0, y1, z0], [xm, y1 + rh, z0], wall, 0);
    } else {
      const zm = (z0 + z1) / 2;
      B.quad([x0 - ov, y1 - 0.3, z1 + ov], [x1 + ov, y1 - 0.3, z1 + ov], [x1 + ov, y1 + rh, zm], [x0 - ov, y1 + rh, zm], roofC, 3);
      B.quad([x1 + ov, y1 - 0.3, z0 - ov], [x0 - ov, y1 - 0.3, z0 - ov], [x0 - ov, y1 + rh, zm], [x1 + ov, y1 + rh, zm], roofC, 3);
      B.tri([x1, y1, z1], [x1, y1, z0], [x1, y1 + rh, zm], wall, 0); B.tri([x0, y1, z0], [x0, y1, z1], [x0, y1 + rh, zm], wall, 0);
    }
  } else if (style === 2) {                               // tower house: flared eave + steep pyramid
    const rh = Math.min(w, d) * rng.range(0.9, 1.5), xm = (x0 + x1) / 2, zm = (z0 + z1) / 2; top = h + rh;
    const a = [x0 - ov, y1 - 0.2, z1 + ov], b = [x1 + ov, y1 - 0.2, z1 + ov], c = [x1 + ov, y1 - 0.2, z0 - ov], e = [x0 - ov, y1 - 0.2, z0 - ov], t = [xm, y1 + rh, zm];
    B.tri(a, b, t, roofC, 3); B.tri(b, c, t, roofC, 3); B.tri(c, e, t, roofC, 3); B.tri(e, a, t, roofC, 3);
  } else if (style === 3) {                               // flat roof behind a stepped false front facing the avenue
    const xf = side > 0 ? x0 : x1, s1 = d * 0.22, s2 = d * 0.36, zm = (z0 + z1) / 2; top = h + 4.4;
    B.quad([x0, y1 - 0.5, z1], [x1, y1 - 0.5, z1], [x1, y1 - 0.5, z0], [x0, y1 - 0.5, z0], roofC, 0);
    B.quad([xf, y1, z0], [xf, y1, z1], [xf, y1 + 1.5, z1], [xf, y1 + 1.5, z0], wall, 0);
    B.quad([xf, y1 + 1.5, zm - s2], [xf, y1 + 1.5, zm + s2], [xf, y1 + 3, zm + s2], [xf, y1 + 3, zm - s2], wall, 0);
    B.quad([xf, y1 + 3, zm - s1], [xf, y1 + 3, zm + s1], [xf, y1 + 4.4, zm + s1], [xf, y1 + 4.4, zm - s1], wall, 0);
  } else {                                                // mansard
    const rh = rng.range(2.6, 3.8), ins = Math.min(w, d) * 0.22; top = h + rh;
    const lo = [[x0 - ov, z1 + ov], [x1 + ov, z1 + ov], [x1 + ov, z0 - ov], [x0 - ov, z0 - ov]], hi = [[x0 + ins, z1 - ins], [x1 - ins, z1 - ins], [x1 - ins, z0 + ins], [x0 + ins, z0 + ins]];
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; B.quad([lo[i][0], y1 - 0.2, lo[i][1]], [lo[j][0], y1 - 0.2, lo[j][1]], [hi[j][0], y1 + rh, hi[j][1]], [hi[i][0], y1 + rh, hi[i][1]], roofC, 3); }
    B.quad([hi[0][0], y1 + rh, hi[0][1]], [hi[1][0], y1 + rh, hi[1][1]], [hi[2][0], y1 + rh, hi[2][1]], [hi[3][0], y1 + rh, hi[3][1]], roofC, 0);
  }
  if (style !== 2 && rng() < 0.6) {                        // chimney
    const cxm = lerp(x0, x1, rng.range(0.25, 0.75)), czm = lerp(z0, z1, rng.range(0.2, 0.8)), ch = top - h + rng.range(0.8, 1.8);
    B.walls(cxm - 0.6, cxm + 0.6, czm - 0.6, czm + 0.6, y1, y1 + ch, C.walls[2], 0);
  }
  {                                                       // door with a little folded canopy on the avenue side
    const xf = side > 0 ? x0 - 0.06 : x1 + 0.06, zd = lerp(z0, z1, rng.range(0.3, 0.7)), out = side > 0 ? -1 : 1;
    B.quad([xf, y0, zd - 0.8], [xf, y0, zd + 0.8], [xf, y0 + 2.5, zd + 0.8], [xf, y0 + 2.5, zd - 0.8], C.ink, 0, { noEdge: true });
    B.quad([xf, y0 + 2.7, zd - 1.3], [xf, y0 + 2.7, zd + 1.3], [xf + out * 1.3, y0 + 2.1, zd + 1.3], [xf + out * 1.3, y0 + 2.1, zd - 1.3], rng() < 0.25 ? C.red : C.roofs[0], 0);
  }
  // paper strut behind (a folded brace from the page to the back wall)
  const sxm = lerp(x0, x1, 0.5);
  B.quad([sxm - 1, y0, z0 - h * 0.4], [sxm + 1, y0, z0 - h * 0.4], [sxm + 1, y0 + h * 0.6, z0], [sxm - 1, y0 + h * 0.6, z0], C.walls[1], 0);
  S.push({ x0, x1, z0, z1, h: h + (top - h) * 0.5 });
  return top;
}

const CROSS = [-88, -44, 0, 44, 88];       // cross streets (the two bridges stand in the +44 and 0 ones)
const BRIDGES = [44, 0];
const CASTLE = { x: 64, z: -80, r: 22 };

async function buildTown(B, rng, C, S, R, castleSide, ceiling, pause) {
  const ph = (x, z) => phaseAt(x, z) + rng.range(-0.015, 0.015);
  const reserved = (x, z) => (Math.abs(x - castleSide * CASTLE.x) < CASTLE.r + 6 && Math.abs(z - CASTLE.z) < CASTLE.r + 6) || Math.hypot(x - TWR.x, z - TWR.z) < 17;
  let count = 0;
  for (const side of [-1, 1]) {
    let xin = AVE + 3.6;
    for (let r = 0; r < 6; r++) {
      const depth = rng.range(10, 12.5);
      const segs = [-121, ...CROSS, 121];
      for (let s = 0; s < segs.length - 1; s++) {
        const zLo = segs[s] + (s === 0 ? 0 : 3.6), zHi = segs[s + 1] - (s === segs.length - 2 ? 0 : 3.6);
        let z = zHi - rng.range(0, 1.5);
        while (z - 7 > zLo) {
          let d = rng.range(7.5, 13.5); if (z - d - 7 < zLo) d = z - zLo;
          const z1 = z, z0 = z - d; z = z0 - (rng() < 0.2 ? rng.range(1.5, 3) : 0.35);
          const dd = depth - rng.range(0, 2.2), xa = side > 0 ? xin : -(xin + dd), xb = xa + dd, cx = (xa + xb) / 2, cz = (z0 + z1) / 2;
          if (reserved(cx, cz) || rng() < 0.05) continue;
          let style = rng.pick([0, 0, 0, 1, 1, 2, 3, 4, 4]);
          let h = 7.5 + r * 2.1 + rng.range(0, 5.5); if (style === 2) h += rng.range(3, 9);
          // under the camera's way in, the houses are low mansards (ceiling = highest allowed top, world y)
          const cap = Math.min(ceiling(cx, cz), ceiling(xa, z0), ceiling(xa, z1), ceiling(xb, z0), ceiling(xb, z1)) - PY;
          if (cap < h + 16) { if (cap < 10.5) continue; if (h + 9 > cap) { style = rng() < 0.3 ? 3 : 4; h = Math.min(h, cap - 6); } else if (style === 2) style = 0; }
          const p = ph(cx, cz); B.fold(0, 1, p);
          const top = house(B, rng, C, S, xa, xb, z0, z1, h, style, side); count++;
          const xm = cx, zm = cz;
          const y = style === 3 ? PY + h - 0.45 : PY + top;
          const line = style === 0 ? [xm, z0 + 0.8, xm, z1 - 0.8] : style === 1 ? [xa + 0.8, zm, xb - 0.8, zm] : style === 2 ? [xm, zm, xm, zm] : style === 3 ? [xa + 2, zm, xb - 2, zm] : [xm - 1.5, zm, xm + 1.5, zm];
          R.push({ a: line, y, p });
        }
      }
      xin += depth + (r % 2 === 1 ? 7 : 4.2);
      await pause();
    }
  }
  // cut-out trees lining the avenue (stage flats, they hinge straight up)
  for (const side of [-1, 1]) for (let z = 124; z > -124; z -= rng.range(9, 12.5)) {
    if (BRIDGES.some((b) => Math.abs(z - b) < 5.5)) continue;
    const x = side * (AVE + 1.3), h = rng.range(6, 10.5), w = h * rng.range(0.3, 0.42), kind = rng.int(0, 2);
    const col = rng() < 0.12 ? C.red : rng.pick(C.walls);
    B.fold(0, 1, ph(x, z));
    B.quad([x - 0.22, PY, z], [x + 0.22, PY, z], [x + 0.22, PY + h * 0.45, z], [x - 0.22, PY + h * 0.45, z], C.walls[2], 10, { noEdge: true });
    if (kind === 0) { B.tri([x - w, PY + h * 0.3, z], [x + w, PY + h * 0.3, z], [x, PY + h * 0.75, z], col, 10); B.tri([x - w * 0.75, PY + h * 0.55, z + 0.05], [x + w * 0.75, PY + h * 0.55, z + 0.05], [x, PY + h, z + 0.05], col, 10); }
    else { const n = kind === 1 ? 5 : 8, span = kind === 1 ? Math.PI : Math.PI * 2, cy = PY + h * (kind === 1 ? 0.42 : 0.68), rr = kind === 1 ? w * 1.5 : w * 1.05;
      for (let i = 0; i < n; i++) { const a0 = (i / n) * span, a1 = ((i + 1) / n) * span; B.tri([x + Math.cos(a0) * rr, cy + Math.sin(a0) * rr, z], [x + Math.cos(a1) * rr, cy + Math.sin(a1) * rr, z], [x, cy, z], col, 10, { tint: 0.1 }); } }
    S.push({ x0: x - w, x1: x + w, z0: z - 0.2, z1: z + 0.2, h: h, y0: h * 0.3 });
  }
  await pause();
  // paper bunting strung along both sides of the avenue (two perspective lines that converge on the hole)
  for (const side of [-1, 1]) {
    const x = side * (AVE + 1.3); let k = 0;
    for (let za = 122; za > -120; za -= 12) {
      const zb2 = za - 12; if (BRIDGES.some((b) => b < za + 2 && b > zb2 - 2)) continue;
      B.fold(0, 1, ph(x, (za + zb2) / 2));
      const yAt = (t) => PY + 8.2 - Math.sin(t * Math.PI) * 1.5;
      B.quad([x, yAt(0) - 0.05, za], [x, yAt(0.5) - 0.05, za - 6], [x, yAt(0.5) + 0.06, za - 6], [x, yAt(0) + 0.06, za], C.ink, 0, { noEdge: true });
      B.quad([x, yAt(0.5) - 0.05, za - 6], [x, yAt(1) - 0.05, zb2], [x, yAt(1) + 0.06, zb2], [x, yAt(0.5) + 0.06, za - 6], C.ink, 0, { noEdge: true });
      for (const zz of [za, zb2]) B.quad([x - 0.12, PY, zz], [x + 0.12, PY, zz], [x + 0.12, PY + 8.3, zz], [x - 0.12, PY + 8.3, zz], C.walls[2], 0, { noEdge: true });
      for (let i = 0; i < 8; i++, k++) {
        const t0 = (i + 0.12) / 8, t1 = (i + 0.88) / 8, tm = (i + 0.5) / 8, col = k % 4 === 0 ? C.red : k % 4 === 2 ? C.walls[2] : C.walls[0];
        B.tri([x, yAt(t0), za - t0 * 12], [x, yAt(t1), za - t1 * 12], [x - side * 0.3, yAt(tm) - 2.3, za - tm * 12], col, 9, { tint: 0.04 });
      }
    }
  }
  // layered skyline flats at the outer edge of each page: quilled hills, then faceted mountains
  for (const side of [-1, 1]) for (let layer = 0; layer < 2; layer++) {
    const x = side * (layer ? 133.5 : 124.5), col = layer ? C.far : C.walls[1];
    const peaks = []; for (let z = -112; z < 112; z += rng.range(14, 30)) peaks.push({ z: z + rng.range(-4, 4), h: layer ? rng.range(22, 43) : rng.range(9, 17), s: layer ? rng.range(1.1, 1.9) : rng.range(0.5, 0.9) });
    const hRaw = (z) => { let h = layer ? 9 : 4; for (const p of peaks) h = Math.max(h, p.h - p.s * Math.abs(z - p.z)); return h * smoothstep(0, 10, 110 - Math.abs(z)) + 1.5; };
    // the camera comes in over the right-hand page: its skyline stays low (foothills) so the city and the wave are seen
    // over it, rising to full mountains only beside the standing page; nothing reaches into the camera's corridor
    const lowK = (z) => (side === 1 ? lerp(1, layer ? 0.4 : 0.7, smoothstep(-110, -40, z)) : 1);
    const hAt = (z) => Math.max(1.5, Math.min(hRaw(z) * lowK(z), ceiling(x, z, 70) - PY - 2));
    const tones = [col, col, col, C.far2, C.farRed];
    const stops = [-108, ...peaks.map((p) => clamp(p.z, -104, 104)), 108];
    for (let z = -100; z < 108; z += 9) stops.push(z);
    stops.sort((a, b) => a - b);
    let chunkEnd = -108 + 36, p = ph(x, -108 + 18); B.fold(0, 1, p);
    for (let i = 0; i < stops.length - 1; i++) {
      const za = stops[i], zb = stops[i + 1]; if (zb - za < 0.3) continue;
      if (za >= chunkEnd) { chunkEnd += 36; p = ph(x, za + 18); B.fold(0, 1, p); B.quad([x - side, PY, za - 8], [x - side, PY, za - 5], [x, PY + 8, za + 1], [x, PY + 8, za + 0.2], C.walls[1], 0); }
      const ha = hAt(za), hb = hAt(zb);
      // each facet its own sheet (creased edges), a few of them lavender or rose; a darker foothill band and a white cap
      B.quad([x, PY, za], [x, PY, zb], [x, PY + hb, zb], [x, PY + ha, za], layer ? tones[i * 7 % 5] : col, 0, { tint: 0.045 });
      if (layer) {
        const fa = 0.3 + 0.12 * Math.sin(za * 0.21), fb = 0.3 + 0.12 * Math.sin(zb * 0.21);
        B.quad([x - side * 0.25, PY, za], [x - side * 0.25, PY, zb], [x - side * 0.25, PY + hb * fb, zb], [x - side * 0.25, PY + ha * fa, za], C.walls[2], 0, { noEdge: true, tint: 0.03 });
        B.quad([x - side * 0.3, PY + ha * 0.72, za], [x - side * 0.3, PY + hb * 0.72, zb], [x - side * 0.3, PY + hb, zb], [x - side * 0.3, PY + ha, za], C.page, 0, { noEdge: true, tint: 0.02 });
      }
      S.push({ x0: x - 0.3, x1: x + 0.3, z0: za, z1: zb, h: (ha + hb) / 2 });
    }
    await pause();
  }
  // two V-fold bridges across the avenue (camera flies under: clear 13 m either side at y 12, apex underside y 25)
  for (const zb of BRIDGES) {
    B.fold(0, 1, ph(0, zb));
    const under = (x) => (Math.abs(x) < 14 ? PY + 4 + 17 * Math.sqrt(1 - (x / 14) ** 2) : PY), topY = (x) => PY + 25.6 - 1.6 * (x / 20) ** 2;
    const xsb = []; for (let i = 0; i <= 20; i++) { const t = i / 20; xsb.push(-14 * Math.cos(t * Math.PI)); }
    const all = [-20.5, -17, ...xsb, 17, 20.5], col = C.walls[0];
    for (let i = 0; i < all.length - 1; i++) {
      const xa = all[i], xb = all[i + 1];
      const inside = Math.abs((xa + xb) / 2) < 14, ya = inside ? under(xa) : PY, yb = inside ? under(xb) : PY;
      for (const dz of [-2.2, 2.2]) B.quad([xa, ya, zb + dz], [xb, yb, zb + dz], [xb, topY(xb), zb + dz], [xa, topY(xa), zb + dz], col, 0, { noEdge: !inside ? false : true, tint: 0.03 });
      B.quad([xa, topY(xa) - 1.1, zb - 2.2], [xb, topY(xb) - 1.1, zb - 2.2], [xb, topY(xb) - 1.1, zb + 2.2], [xa, topY(xa) - 1.1, zb + 2.2], C.walls[1], 0, { noEdge: true });
      if (inside) B.quad([xa, ya, zb - 2.2], [xb, yb, zb - 2.2], [xb, yb, zb + 2.2], [xa, ya, zb + 2.2], C.walls[2], 0, { noEdge: true, tint: 0.03 });
    }
    for (const sx of [-1, 1]) for (const dz of [-2.45, 2.45]) {   // lit galleries in the piers, red keystone tag
      const xa = sx > 0 ? 14.9 : -19.9;
      B.quad([xa, PY + 1.5, zb + dz], [xa + 5, PY + 1.5, zb + dz], [xa + 5, PY + 19, zb + dz], [xa, PY + 19, zb + dz], col, 1);
    }
    for (const dz of [-2.45, 2.45]) B.tri([-1.6, PY + 25.4, zb + dz], [1.6, PY + 25.4, zb + dz], [0, PY + 22.2, zb + dz], C.red, 0);
    S.push({ x0: -20.5, x1: -14, z0: zb - 2.2, z1: zb + 2.2, h: 24 }, { x0: 14, x1: 20.5, z0: zb - 2.2, z1: zb + 2.2, h: 24 }, { x0: -14, x1: 14, z0: zb - 2.2, z1: zb + 2.2, h: 25, y0: 18 });
    R.push({ a: [-13, zb, 13, zb], y: PY + 25.4, p: phaseAt(0, zb) });
  }
  // ---- things that stand in the wave on the open page: cut-paper trees down every cross street and along the outer
  //      margins, and paper-doll chains (linked hands) along both kerbs and the fore-edges. All flats in planes that
  //      face the camera as it comes in over the right-hand page; each shears upright on its own phase. ----
  const pt = (x, z, t, y, off = 0) => [x + off, PY + y, z + t];
  const flatTree = (x, z, h, kind, col, wMax) => {
    const w = Math.min(h * rng.range(0.3, 0.42), wMax);
    B.fold(0, 1, phaseAt(x, z) + rng.range(-0.012, 0.012));
    B.quad(pt(x, z, -0.22, 0), pt(x, z, 0.22, 0), pt(x, z, 0.22, h * 0.45), pt(x, z, -0.22, h * 0.45), C.walls[2], 10, { noEdge: true });
    if (kind === 0) { B.tri(pt(x, z, -w, h * 0.3), pt(x, z, w, h * 0.3), pt(x, z, 0, h * 0.75), col, 10); B.tri(pt(x, z, -w * 0.75, h * 0.55, 0.05), pt(x, z, w * 0.75, h * 0.55, 0.05), pt(x, z, 0, h, 0.05), col, 10); }
    else { const n = kind === 1 ? 5 : 8, span = kind === 1 ? Math.PI : Math.PI * 2, cy = h * (kind === 1 ? 0.42 : 0.68), rr = kind === 1 ? w * 1.5 : w * 1.05;
      for (let i = 0; i < n; i++) { const a0 = (i / n) * span, a1 = ((i + 1) / n) * span; B.tri(pt(x, z, Math.cos(a0) * rr, cy + Math.sin(a0) * rr), pt(x, z, Math.cos(a1) * rr, cy + Math.sin(a1) * rr), pt(x, z, 0, cy), col, 10, { tint: 0.1 }); } }
    S.push({ x0: x - 0.2, x1: x + 0.2, z0: z - w, z1: z + w, h, y0: h * 0.3 });
  };
  const treeCol = () => { const t = rng(); return t < 0.17 ? C.red : t < 0.27 ? C.blue : rng.pick(C.walls); };
  await pause();
  const free = (x, z, h) => !reserved(x, z) && ceiling(x, z) - PY - 2 > h;
  for (const side of [-1, 1]) {
    for (const zc of CROSS) for (let ax = AVE + 9; ax < 118; ax += rng.range(9, 13)) {       // down the cross streets
      const x = side * ax, z = zc + rng.range(-1, 1), h = rng.range(6, 9.5);
      if (free(x, z, h)) flatTree(x, z, h, rng.int(0, 2), treeCol(), 2.3);
    }
    for (let z = 104; z > -106; z -= rng.range(8, 11.5)) {                                   // the outer margin
      const x = side * 139.6, h = rng.range(5.5, 8.5);
      if (free(x, z, h)) flatTree(x, z, h, rng.int(0, 2), treeCol(), 3.2);
    }
    await pause();
  }
  // a doll: skirt, linked arms, head; 3 m apart so the hands meet
  const doll = (x, z, h, col) => {
    B.fold(0, 1, phaseAt(x, z));
    B.quad(pt(x, z, -0.95, 0), pt(x, z, 0.95, 0), pt(x, z, 0.36, h * 0.66), pt(x, z, -0.36, h * 0.66), col, 11, { tint: 0.03 });
    B.quad(pt(x, z, -1.5, h * 0.47, 0.04), pt(x, z, 1.5, h * 0.47, 0.04), pt(x, z, 1.5, h * 0.60, 0.04), pt(x, z, -1.5, h * 0.60, 0.04), col, 11, { noEdge: true, tint: 0.03 });
    const cy = h * 0.82, r = h * 0.18;
    B.quad(pt(x, z, -r, cy), pt(x, z, 0, cy - r), pt(x, z, r, cy), pt(x, z, 0, cy + r), col, 11, { tint: 0.03 });
  };
  const chain = (x, zFrom, zTo, h) => {
    for (let z = zFrom; z > zTo; z -= 3) { const t = rng(); if (free(x, z, h)) doll(x, z, h, t < 0.17 ? C.red : t < 0.27 ? C.blue : C.walls[0]); }
    S.push({ x0: x - 0.2, x1: x + 0.2, z0: zTo, z1: zFrom, h: h * 0.6 });
  };
  const segs = [-121, ...CROSS, 121];
  for (const side of [-1, 1]) {
    for (let s = 0; s < segs.length - 1; s++) chain(side * (AVE - 1.3), segs[s + 1] - 6, segs[s] + 6, rng.range(4.2, 5.2));   // both kerbs
    await pause();
    for (const [za, zb2] of [[102, 40], [28, -32], [-44, -104]]) chain(side * 143.8, za, zb2, rng.range(4.6, 5.6));          // the fore-edges
  }
  return count;
}

// the 70 m paper tower: tapering eight-sided tiers with flared paper eaves, a red spire and a pinwheel finial.
// It leads the wave by about 45 m: its struts haul it upright before the houses of its own street rise
const TWR_PHASE = Math.max(PH0, phaseAt(TWR.x, TWR.z) - 0.085);
function buildTower(B, rng, C, S, R) {
  const { x, z } = TWR, p = TWR_PHASE, n = 8, rot = Math.PI / 8;
  B.fold(0, 1, p);
  const tiers = rng.int(5, 7), shaft = 55, pag = rng() < 0.6, rBase = rng.range(8.6, 10), rTop = rng.range(3.8, 4.6);
  B.ring(x, z, rBase + 3, PY, rBase + 1.4, PY + 2.6, n, C.walls[2], 0, rot);
  B.ring(x, z, rBase + 1.4, PY + 2.6, rBase + 0.2, PY + 2.6, n, C.walls[1], 0, rot, { noEdge: true });
  let y = PY + 2.6;
  for (let i = 0; i < tiers; i++) {
    const th = ((shaft - 2.6) / tiers) * lerp(1.12, 0.88, i / (tiers - 1)), r0 = lerp(rBase, rTop, i / tiers), r1 = lerp(rBase, rTop, (i + 0.8) / tiers);
    B.ring(x, z, r0, y, r1, y + th, n, i % 2 ? C.walls[1] : C.walls[0], 1, rot);
    const ye = y + th, fl = pag ? 3.4 - i * 0.2 : 1.6;
    // eave: a folded skirt that flares out and droops, with a paler upper fold
    B.ring(x, z, r1 + fl, ye - (pag ? 1.5 : 0.5), r1 * 0.9, ye + (pag ? 1.3 : 0.6), n, i === tiers - 1 ? C.red : C.roofs[i % C.roofs.length], 3, rot);
    B.ring(x, z, r1 + fl, ye - (pag ? 1.5 : 0.5), r1 + 0.1, ye - (pag ? 0.2 : 0.4), n, C.walls[2], 0, rot, { noEdge: true });
    if (pag) for (let k = 0; k < n; k++) {                   // upturned corner tips
      const a = rot + (k / n) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), rr = r1 + fl;
      B.tri([x + ca * (rr - 1.3) - sa * 0.5, ye - 1.2, z + sa * (rr - 1.3) + ca * 0.5], [x + ca * (rr - 1.3) + sa * 0.5, ye - 1.2, z + sa * (rr - 1.3) - ca * 0.5], [x + ca * (rr + 1.1), ye + 0.5, z + sa * (rr + 1.1)], C.walls[0], 0);
    }
    const rr = r1 + fl * 0.6;
    R.push({ a: [x - rr, z + rr, x + rr, z + rr], y: ye - 0.4, p, w: 3 }, { a: [x - rr, z - rr, x + rr, z - rr], y: ye - 0.4, p, w: 3 },
      { a: [x - rr, z - rr, x - rr, z + rr], y: ye - 0.4, p, w: 3 }, { a: [x + rr, z - rr, x + rr, z + rr], y: ye - 0.4, p, w: 3 });
    y = ye + (pag ? 1.3 : 0.6);
  }
  const ys = PY + TWR.h;
  B.ring(x, z, rTop + 1.6, y - 0.6, rTop * 0.7, y + 1.4, n, C.red, 3, rot);
  B.ring(x, z, rTop * 0.75, y + 1.2, 0, ys, n, C.red, 3, rot);
  // pinwheel finial (flat, in the plane of the fold so it lies down with the tower)
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + 0.3, b = a + 1.1; B.tri([x, ys + 2.5, z], [x + Math.cos(a) * 4.2, ys + 2.5 + Math.sin(a) * 4.2, z], [x + Math.cos(b) * 2.1, ys + 2.5 + Math.sin(b) * 2.1, z], k % 2 ? C.walls[0] : C.red, 0); }
  B.quad([x - 0.15, ys - 2, z], [x + 0.15, ys - 2, z], [x + 0.15, ys + 2.5, z], [x - 0.15, ys + 2.5, z], C.walls[2], 0, { noEdge: true });
  // the big paper struts that haul it upright
  for (const s of [-1, 1]) {
    B.quad([x - 1.6, PY, z + s * 27], [x + 1.6, PY, z + s * 27], [x + 1.6, PY + 30, z + s * 6.6], [x - 1.6, PY + 30, z + s * 6.6], C.walls[1], 0);
    B.quad([x - 1.6, PY, z + s * 27], [x - 1.6, PY, z + s * 21], [x - 1.6, PY + 24, z + s * 9], [x - 1.6, PY + 30, z + s * 6.6], C.walls[2], 0, { noEdge: true });
    S.push({ x0: x - 1.6, x1: x + 1.6, z0: z + s * 14, z1: z + s * 16, h: 16, y0: 12 });
  }
  S.push({ x0: x - rBase, x1: x + rBase, z0: z - rBase, z1: z + rBase, h: 20 }, { x0: x - 6.5, x1: x + 6.5, z0: z - 6.5, z1: z + 6.5, h: 62, y0: 18 });
}

function buildCastle(B, rng, C, S, R, side) {
  const cx = side * CASTLE.x, cz = CASTLE.z, r = CASTLE.r, wh = 11;
  const merlons = (ax, az, bx, bz, y, n) => { for (let i = 0; i < n; i++) { if (i % 2) continue; const t0 = i / n, t1 = (i + 1) / n; B.quad([lerp(ax, bx, t0), y, lerp(az, bz, t0)], [lerp(ax, bx, t1), y, lerp(az, bz, t1)], [lerp(ax, bx, t1), y + 1.7, lerp(az, bz, t1)], [lerp(ax, bx, t0), y + 1.7, lerp(az, bz, t0)], C.walls[0], 0); } };
  const cor = [[cx - r, cz + r], [cx + r, cz + r], [cx + r, cz - r], [cx - r, cz - r]];
  for (let i = 0; i < 4; i++) {                             // curtain walls
    const a = cor[i], b = cor[(i + 1) % 4], p = phaseAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    B.fold(0, 1, p);
    B.quad([a[0], PY, a[1]], [b[0], PY, b[1]], [b[0], PY + wh, b[1]], [a[0], PY + wh, a[1]], C.walls[1], 0);
    merlons(a[0], a[1], b[0], b[1], PY + wh, 17);
    R.push({ a: [a[0], a[1], b[0], b[1]], y: PY + wh + 1.7, p });
    S.push({ x0: Math.min(a[0], b[0]) - 0.3, x1: Math.max(a[0], b[0]) + 0.3, z0: Math.min(a[1], b[1]) - 0.3, z1: Math.max(a[1], b[1]) + 0.3, h: wh });
  }
  for (let i = 0; i < 4; i++) {                             // corner towers with cone roofs and pennants
    const [tx, tz] = cor[i], th = rng.range(17, 23), tr = 4.6, p = phaseAt(tx, tz);
    B.fold(0, 1, p);
    B.ring(tx, tz, tr, PY, tr * 0.92, PY + th, 8, C.walls[0], 1);
    B.ring(tx, tz, tr * 0.92 + 0.9, PY + th + 1.2, tr * 0.92, PY + th - 0.4, 8, C.walls[1], 0);
    B.ring(tx, tz, tr + 1.3, PY + th + 0.9, 0, PY + th + 10, 8, i === 0 || rng() < 0.3 ? C.red : C.blueRoof, 3);
    B.quad([tx - 0.1, PY + th + 10, tz], [tx + 0.1, PY + th + 10, tz], [tx + 0.1, PY + th + 14, tz], [tx - 0.1, PY + th + 10 + 4, tz], C.walls[2], 0, { noEdge: true });
    B.tri([tx, PY + th + 14, tz], [tx, PY + th + 12.2, tz], [tx + 3.2, PY + th + 13.1, tz], C.red, 0);
    S.push({ x0: tx - tr, x1: tx + tr, z0: tz - tr, z1: tz + tr, h: th + 4 });
  }
  // the keep
  const kw = 9, kd = 8, kh = rng.range(24, 30), pk = phaseAt(cx, cz);
  B.fold(0, 1, pk);
  B.walls(cx - kw, cx + kw, cz - kd, cz + kd, PY, PY + kh, C.walls[0], 1);
  const kc = [[cx - kw, cz + kd], [cx + kw, cz + kd], [cx + kw, cz - kd], [cx - kw, cz - kd]];
  for (let i = 0; i < 4; i++) merlons(kc[i][0], kc[i][1], kc[(i + 1) % 4][0], kc[(i + 1) % 4][1], PY + kh, 9);
  B.quad([cx - kw, PY + kh - 0.6, cz + kd], [cx + kw, PY + kh - 0.6, cz + kd], [cx + kw, PY + kh - 0.6, cz - kd], [cx - kw, PY + kh - 0.6, cz - kd], C.walls[2], 0);
  B.ring(cx, cz, 3.6, PY + kh - 0.6, 3.3, PY + kh + 9, 8, C.walls[1], 1);
  B.ring(cx, cz, 5, PY + kh + 8.6, 0, PY + kh + 19, 8, C.red, 3);
  B.tri([cx, PY + kh + 23, cz], [cx, PY + kh + 20.6, cz], [cx + 4, PY + kh + 21.8, cz], C.red, 0);
  B.quad([cx - 0.1, PY + kh + 19, cz], [cx + 0.1, PY + kh + 19, cz], [cx + 0.1, PY + kh + 23, cz], [cx - 0.1, PY + kh + 23, cz], C.walls[2], 0, { noEdge: true });
  B.quad([cx - 1.5, PY, cz + kd + 16], [cx + 1.5, PY, cz + kd + 16], [cx + 1.5, PY + 17, cz + kd], [cx - 1.5, PY + 17, cz + kd], C.walls[1], 0);
  R.push({ a: [cx - kw, cz + kd, cx + kw, cz + kd], y: PY + kh + 1.7, p: pk, w: 2 }, { a: [cx - kw, cz - kd, cx + kw, cz - kd], y: PY + kh + 1.7, p: pk, w: 2 });
  S.push({ x0: cx - kw, x1: cx + kw, z0: cz - kd, z1: cz + kd, h: kh + 5 });
  // gatehouse toward the avenue
  const gx = cx - side * r, pg = phaseAt(gx, cz); B.fold(0, 1, pg);
  house(B, rng, C, S, gx - 4.5, gx + 4.5, cz - 5, cz + 5, 15, 0, side);
}

// the standing page: a 96 x 60 m printed leaf with a circle cut clean out of it
const PAGE_PHASE = 0.02;
const pageZ = (x) => PAGE_Z - 5 * (x / PAGE_W) ** 2;   // the leaf bows gently away from the avenue
function buildStandingPage(B, rng, C, S, R) {
  B.fold(0, 1, PAGE_PHASE);
  const hy = HOLE_Y - PY, W = PAGE_W, H = PAGE_H;
  const ang = []; for (let i = 0; i < 56; i++) ang.push((i / 56) * Math.PI * 2);
  for (const [qx, qy] of [[W, H - hy], [-W, H - hy], [-W, -hy], [W, -hy]]) ang.push((Math.atan2(qy, qx) + Math.PI * 2) % (Math.PI * 2));
  ang.sort((a, b) => a - b);
  const outer = (a) => { const c = Math.cos(a), s = Math.sin(a); let t = 1e9; if (c > 1e-6) t = Math.min(t, W / c); if (c < -1e-6) t = Math.min(t, -W / c); if (s > 1e-6) t = Math.min(t, (H - hy) / s); if (s < -1e-6) t = Math.min(t, -hy / s); return t; };
  const rings = 5, pt = (a, j) => { const ro = outer(a), r = lerp(HOLE_R, ro, Math.pow(j / rings, 1.6)); return [Math.cos(a) * r, PY + hy + Math.sin(a) * r, pageZ(Math.cos(a) * r)]; };
  const uvOf = (p) => [p[0] + W, p[1] - PY];
  for (let i = 0; i < ang.length; i++) {
    const a0 = ang[i], a1 = i + 1 < ang.length ? ang[i + 1] : ang[0] + Math.PI * 2; if (a1 - a0 < 1e-4) continue;
    for (let j = 0; j < rings; j++) {
      const a = pt(a0, j), b = pt(a1, j), c = pt(a1, j + 1), d = pt(a0, j + 1);
      B.quad(a, b, c, d, C.page, 2, { tint: 0.008, uv: [...uvOf(a), ...uvOf(b), ...uvOf(c), ...uvOf(d)], size: [2 * W, H] });
    }
  }
  // a rosette of cut-paper rays round the hole: long gold rays behind short red petals, their tips lifted off the
  // page and breathing (kind 12)
  const ray = (a, r0, r1, wa, z0, z1, col) => {
    B.fold(0, 1, PAGE_PHASE);
    const q = (ang, r, zo) => { const x = Math.cos(ang) * r; return [x, PY + hy + Math.sin(ang) * r, pageZ(x) + zo]; };
    B.tri(q(a - wa, r0, z0), q(a + wa, r0, z0), q(a, r1, z1), col, 12, { tint: 0.06 });
  };
  const NR = 18, rot0 = rng() * 0.3;
  for (let i = 0; i < NR; i++) {
    const a = rot0 + (i / NR) * Math.PI * 2;
    ray(a + Math.PI / NR, 12.3, 17.4 + (i % 2) * 1.8, 0.08, 0.3, 1.5, C.gold);
    ray(a, 12.1, 15.4, 0.13, 0.5, 2.2, i % 6 === 3 ? C.walls[0] : C.red);
  }
  B.fold(0, 1, PAGE_PHASE);
  for (const sx of [-1, 1]) {                               // gusset struts behind
    const x = sx * 31;
    const zp = pageZ(x) - 0.2, zq = pageZ(x + sx * 5) - 0.2;
    B.tri([x, PY, zp], [x, PY, zp - 13], [x, PY + 40, zp], C.walls[1], 0);
    B.quad([x, PY, zp - 13], [x + sx * 5, PY, zq - 13], [x + sx * 5, PY + 40, zq], [x, PY + 40, zp], C.walls[2], 0);
  }
  R.push({ a: [-W + 3, pageZ(W - 3), -14, pageZ(14)], y: PY + H, p: PAGE_PHASE, w: 2.5 }, { a: [14, pageZ(14), W - 3, pageZ(W - 3)], y: PY + H, p: PAGE_PHASE, w: 2.5 });
  S.push({ x0: -W, x1: W, z0: PAGE_Z - 0.3, z1: PAGE_Z + 0.3, h: H });
}

// paper kites on strings above the outer rows (they sway, and lie down with everything else when the book is shut)
function buildKites(B, rng, C, ceiling) {
  const n = rng.int(7, 10);
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1, ax = side * rng.range(52, 112), az = rng.range(-70, 105), kx = ax + rng.range(-12, 12), kz = az - rng.range(8, 22), ky = PY + rng.range(46, 72);
    const col = rng.pick([C.red, C.red, C.blue, C.walls[0], C.walls[0], C.walls[1]]), w = rng.range(2.4, 3.2), h = w * 1.5;
    if (ceiling(kx, kz, 34) < 1e3 || ceiling(ax, az, 34) < 1e3 || ceiling((ax + kx) / 2, (az + kz) / 2, 34) < 1e3) continue;
    B.fold(0, 1, phaseAt(ax, az) + 0.03);
    B.quad([kx - w, ky, kz], [kx, ky - h * 1.2, kz], [kx + w, ky, kz], [kx, ky + h * 0.8, kz], col, 8, { tint: 0.03 });
    B.quad([kx - 0.12, ky - h * 1.2, kz + 0.05], [kx + 0.12, ky - h * 1.2, kz + 0.05], [kx + 0.12, ky + h * 0.8, kz + 0.05], [kx - 0.12, ky + h * 0.8, kz + 0.05], C.ink, 8, { noEdge: true });
    for (let k = 0; k < 5; k++) { const ty = ky - h * 1.2 - 1.6 - k * 2.1, tx = kx + Math.sin(k * 1.3 + i) * 0.9; B.tri([tx - 0.9, ty + 0.5, kz], [tx + 0.9, ty - 0.5, kz], [tx + 0.9, ty + 0.5, kz], k % 2 ? C.walls[0] : col, 8); B.tri([tx - 0.9, ty + 0.5, kz], [tx - 0.9, ty - 0.5, kz], [tx + 0.9, ty - 0.5, kz], k % 2 ? col : C.walls[0], 8, { noEdge: true }); }
    const segs = 6; let prev = [ax, PY + 14, az];                 // sagging string
    for (let k = 1; k <= segs; k++) { const t = k / segs, sag = Math.sin(t * Math.PI) * 5; const cur = [lerp(ax, kx, t), lerp(PY + 14, ky - h * 0.2, t) - sag, lerp(az, kz, t) + 0.02];
      B.quad([prev[0] - 0.09, prev[1], prev[2]], [prev[0] + 0.09, prev[1], prev[2]], [cur[0] + 0.09, cur[1], cur[2]], [cur[0] - 0.09, cur[1], cur[2]], C.ink, 8, { noEdge: true }); prev = cur; }
  }
}

// soft paper shadows of every pop-up, baked top-down into one texture (300 x 300 m)
function bakeShadows(S, light) {
  if (typeof document === 'undefined') { const d = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); d.needsUpdate = true; return d; }
  const N = 1024, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, N, N);
  const k = N / 300, ox = -light.x / Math.max(light.y, 0.2), oz = -light.z / Math.max(light.y, 0.2);
  g.fillStyle = '#fff';
  for (const s of S) {
    const y0 = s.y0 || 0, steps = Math.max(2, Math.ceil((s.h - y0) / 3));
    g.beginPath();
    for (let i = 0; i <= steps; i++) { const y = lerp(y0, s.h, i / steps); g.rect((s.x0 + ox * y + 150) * k, (s.z0 + oz * y + 150) * k, (s.x1 - s.x0) * k, (s.z1 - s.z0) * k); }
    g.fill();
  }
  // one blur pass over the whole sheet (soft-edged paper shadows)
  const c2 = document.createElement('canvas'); c2.width = c2.height = N; const g2 = c2.getContext('2d');
  try { g2.filter = 'blur(3px)'; } catch (e) { /* no filter support: hard shadows */ }
  g2.drawImage(cv, 0, 0);
  const t = new THREE.CanvasTexture(c2); t.flipY = false; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4;
  return t;
}

// ---- origami cranes: 22 triangles each, two-fold wing flap, roost -> spiral round the tower -> pour through the hole ----
const SPIRAL_END = 3.927, SPIRAL_TURNS = 2.75;
function spiralJS(a) {
  const ang = SPIRAL_END - (1 - a) * SPIRAL_TURNS * Math.PI * 2, r = lerp(30, 12, a * a * (3 - 2 * a));
  return new THREE.Vector3(TWR.x + Math.cos(ang) * r, PY + lerp(12, TWR.h + 16, a), TWR.z + Math.sin(ang) * r);
}
export function craneGeometry() {
  const P = [], W = [];
  const v = (p, side = 0, lvl = 0, shade = 1) => { P.push(p[0], p[1], p[2]); W.push(side, lvl, shade); };
  const tri = (a, b, c, sh = 1, wa = [0, 0], wb = [0, 0], wc = [0, 0]) => { v(a, wa[0], wa[1], sh); v(b, wb[0], wb[1], sh); v(c, wc[0], wc[1], sh); };
  const N = [0, 0, 0.55], T = [0, 0, -0.55], K = [0, -0.3, 0], Bk = [0, 0.2, 0], L = [-0.23, 0.05, 0], Rr = [0.23, 0.05, 0];
  tri(N, L, Bk, 1); tri(N, Bk, Rr, 0.96); tri(T, Bk, L, 0.97); tri(T, Rr, Bk, 1);
  tri(N, K, L, 0.9); tri(N, Rr, K, 0.88); tri(T, L, K, 0.9); tri(T, K, Rr, 0.88);
  const nt = [0, 0.82, 1.1], hd = [0, 0.56, 1.46];
  tri([-0.08, 0.05, 0.36], nt, [0, -0.12, 0.52], 0.97); tri([0, -0.12, 0.52], nt, [0.08, 0.05, 0.36], 0.92);
  tri(nt, hd, [-0.05, 0.62, 1.02], 1); tri(nt, [0.05, 0.62, 1.02], hd, 0.9);
  const tt = [0, 0.78, -1.2];
  tri([-0.08, 0.05, -0.36], [0, -0.12, -0.52], tt, 0.95); tri([0, -0.12, -0.52], [0.08, 0.05, -0.36], tt, 0.9);
  for (const s of [-1, 1]) {
    const Rf = [s * 0.12, 0.12, 0.32], Rb = [s * 0.12, 0.12, -0.3], Mf = [s * 0.85, 0.2, 0.44], Mb = [s * 0.85, 0.2, -0.18], T1 = [s * 1.78, 0.12, 0.0], T2 = [s * 1.42, 0.17, 0.32];
    tri(Rf, Mf, Mb, 1, [s, 0], [s, 1], [s, 1]); tri(Rf, Mb, Rb, 0.95, [s, 0], [s, 1], [s, 0]);
    tri(Mf, T2, Mb, 0.98, [s, 1], [s, 2], [s, 1]); tri(T2, T1, Mb, 0.93, [s, 2], [s, 2], [s, 1]);
  }
  return { P, W };
}

function buildCranes(rng, U, R, count, redShare) {
  const base = craneGeometry();
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(base.P, 3));
  g.setAttribute('aWing', new THREE.Float32BufferAttribute(base.W, 3));
  // weighted pick of roost lines (ridges near the tower are favoured)
  const cum = []; let tot = 0;
  for (const r of R) { const mx = (r.a[0] + r.a[2]) / 2, mz = (r.a[1] + r.a[3]) / 2, len = Math.hypot(r.a[2] - r.a[0], r.a[3] - r.a[1]); r.d = Math.hypot(mx - TWR.x, mz - TWR.z); tot += (r.w || 1) * (len + 3) * Math.exp(-r.d / 75); cum.push(tot); }
  const roost = new Float32Array(count * 3), fold = new Float32Array(count * 3), seed = new Float32Array(count * 4), off = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = rng() * tot; let lo = 0, hi = cum.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < t) lo = m + 1; else hi = m; }
    const r = R[lo], s = rng();
    roost.set([lerp(r.a[0], r.a[2], s), r.y + 0.36, lerp(r.a[1], r.a[3], s)], i * 3);
    fold.set([0, 1, r.p], i * 3);
    seed.set([rng(), clamp(((r.p - PH0) / PH1 * WAVE_LEN - 110) / 220, 0, 0.5) + rng() * 0.1, rng(), rng() < redShare ? 1 : 0], i * 4);
    let ox, oy, oz; do { ox = rng() * 2 - 1; oy = rng() * 2 - 1; oz = rng() * 2 - 1; } while (ox * ox + oy * oy + oz * oz > 1);
    off.set([ox, oy, oz], i * 3);
  }
  g.setAttribute('iRoost', new THREE.InstancedBufferAttribute(roost, 3));
  g.setAttribute('iFold', new THREE.InstancedBufferAttribute(fold, 3));
  g.setAttribute('iSeed', new THREE.InstancedBufferAttribute(seed, 4));
  g.setAttribute('iOff', new THREE.InstancedBufferAttribute(off, 3));
  g.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uUnfold: U.uUnfold, uTime: U.uTime, uCrane: U.uCrane, uSize: U.uCraneSize, uTower: U.uTower,
      uB0: U.uB0, uB1: U.uB1, uB2: U.uB2, uB3: U.uB3, uLightDir: U.uLightDir, uSun: U.uSun, uAmbSky: U.uAmbSky, uAmbShade: U.uAmbShade, uWarm: U.uWarm, uRed: U.uCraneRed, uPaper: U.uPaper, uCloudT: U.uTime },
    vertexShader: /* glsl */`
      attribute vec3 aWing, iRoost, iFold, iOff; attribute vec4 iSeed;
      uniform float uCrane, uSize; uniform vec3 uTower, uB0, uB1, uB2, uB3;
      varying vec3 vView; varying float vRed, vShade;
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      vec3 spiral(float a){
        float ang = ${SPIRAL_END.toFixed(4)} - (1. - a) * ${(SPIRAL_TURNS * Math.PI * 2).toFixed(4)}, r = mix(30., 12., smoothstep(0., 1., a));
        return uTower + vec3(cos(ang) * r, mix(12., ${(TWR.h + 16).toFixed(1)}, a), sin(ang) * r);
      }
      vec3 pathQ(float w){
        if (w < .62) return spiral(w / .62);
        float t = (w - .62) / .38, s = 1. - t;
        return s * s * s * uB0 + 3. * s * s * t * uB1 + 3. * s * t * t * uB2 + t * t * t * uB3;
      }
      vec2 rot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
      void main(){
        float e = clamp(springE(iFold.z), 0., 1.), rnd = iSeed.z;
        float roofUp = smoothstep(0., .6, clamp(springE(iFold.z + .03 + .07 * fract(rnd * 13.7)), 0., 1.));
        float take = smoothstep(iSeed.y, iSeed.y + .16, uCrane) * roofUp, gate = smoothstep(.4, .8, uCrane);
        float wf = fract(iSeed.x + uTime * .03 * (.85 + .3 * rnd));
        float w = wf * mix(.62, 1., gate);
        float sp = mix(7., 2.3, smoothstep(.72, .93, w));
        vec3 o = (iOff + .35 * vec3(sin(uTime * .7 + rnd * 31.), sin(uTime * .9 + rnd * 17.), cos(uTime * .6 + rnd * 23.))) * sp;
        vec3 q0 = pathQ(w) + o, q1 = pathQ(w + .004) + o;
        vec3 pos = mix(popup(iRoost, iFold.xy, e), q0, take) + vec3(0., sin(take * 3.1416) * 5., 0.);
        float yaw = rnd * 6.2832;
        vec3 fwd = normalize(mix(vec3(sin(yaw), 0., cos(yaw)), normalize(q1 - q0), take));
        vec3 right = normalize(cross(vec3(0., 1., 0.), fwd)), up = cross(fwd, right);
        float fl = uTime * (6.5 + rnd * 2.5) + rnd * 50.;
        float a1 = mix(1.0, .12 + .78 * sin(fl), take), a2 = mix(.25, .5 * sin(fl - 1.1), take);
        vec3 p = position;
        if (aWing.y > .5) {
          float s = aWing.x; vec2 root = vec2(s * .12, .12), mid = vec2(s * .85, .2), q = p.xy;
          if (aWing.y > 1.5) q = mid + rot(q - mid, s * a2);
          p.xy = root + rot(q - root, s * a1);
        }
        float fade = mix(smoothstep(.55, 1., e), smoothstep(0., .03, wf) * (1. - smoothstep(.965, 1., wf)), take);
        float camD = length((modelViewMatrix * vec4(pos, 1.)).xyz);
        p *= uSize * (.8 + .45 * fract(rnd * 7.31)) * fade * smoothstep(8., 26., camD);
        vec4 mvPosition = modelViewMatrix * vec4(pos + right * p.x + up * p.y + fwd * p.z, 1.);
        vView = mvPosition.xyz; vRed = iSeed.w; vShade = aWing.z;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uRed, uPaper;
      varying vec3 vView; varying float vRed, vShade;
      #include <fog_pars_fragment>
      ${GLSL_PAPER_LIGHT}
      void main(){
        vec3 n, alb = mix(uPaper, uRed, vRed) * vShade * .82;
        gl_FragColor = vec4(paperLight(alb, vView, 1., 1., n), 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'paper-cranes';
  return mesh;
}

// ---- light pouring through the hole: a glowing disc behind the cut and a cone of soft rays down the avenue ----
function buildGlow(rng, U, holeFill) {
  const P = [], V = [], hy = HOLE_Y;
  const quad = (a, b, c, d, type, seed) => { for (const [p, u, v] of [[a, 0, 0], [b, 1, 0], [c, 1, 1], [a, 0, 0], [c, 1, 1], [d, 0, 1]]) { P.push(p[0], p[1], p[2]); V.push(u, v, type, seed); } };
  if (holeFill) { const r = HOLE_R + 2; quad([-r, hy - r, PAGE_Z - 0.8], [r, hy - r, PAGE_Z - 0.8], [r, hy + r, PAGE_Z - 0.8], [-r, hy + r, PAGE_Z - 0.8], 0, 0); }
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng.range(-0.12, 0.12), da = rng.range(0.1, 0.19), L = rng.range(55, 120), tn = rng.range(0.1, 0.24), r0 = HOLE_R * 0.9, r1 = r0 + L * tn;
    const pt = (ang, r, z) => [Math.cos(ang) * r, hy + Math.sin(ang) * r, z];
    quad(pt(a - da, r0, PAGE_Z + 0.4), pt(a + da, r0, PAGE_Z + 0.4), pt(a + da * 0.8, r1, PAGE_Z + L), pt(a - da * 0.8, r1, PAGE_Z + L), 1, rng() * 30);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aV', new THREE.Float32BufferAttribute(V, 4));
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uWarm: U.uWarm, uGlow: U.uGlow, uTime: U.uTime, uUnfold: U.uUnfold },
    vertexShader: /* glsl */`
      attribute vec4 aV; varying vec4 vV;
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      void main(){ vV = aV; vec3 p = popup(position, vec2(0., 1.), springE(${PAGE_PHASE.toFixed(3)}));
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uWarm; uniform float uGlow, uTime; varying vec4 vV;
      #include <fog_pars_fragment>
      void main(){
        float I;
        if (vV.z < .5) { float r = length(vV.xy * 2. - 1.) * ${((HOLE_R + 2) / HOLE_R).toFixed(3)}; I = (1.6 + 1.1 * max(1. - r * r, 0.)) * (1. - smoothstep(.97, 1.03, r)); }
        else { float x = 1. - abs(vV.x * 2. - 1.); I = pow(1. - vV.y, 1.7) * smoothstep(0., .08, vV.y) * x * x * .3 * (.7 + .3 * sin(uTime * .8 + vV.w)); }
        vec3 col = mix(uWarm, vec3(1., .9, .72), .55) * I * uGlow;
        #ifdef USE_FOG
          #ifdef FOG_EXP2
            col *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          #else
            col *= 1. - smoothstep(fogNear, fogFar, vFogDepth);
          #endif
        #endif
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 3; m.name = 'paper-glow';
  return m;
}

// ---- drifting confetti (appears as the wave passes underneath) ----
function buildConfetti(rng, U, count) {
  const P = new Float32Array(count * 3), Sd = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { P.set([rng.range(-75, 75), rng() * 62, rng.range(-128, 136)], i * 3); Sd.set([rng(), rng(), rng()], i * 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('aS', new THREE.BufferAttribute(Sd, 3));
  const mat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uUnfold: U.uUnfold, uTime: U.uTime, uViewH: U.uViewH, uPaper: U.uPaper, uRed: U.uRed, uBlue: U.uBlue, uSun: U.uSun, uAmbSky: U.uAmbSky },
    vertexShader: /* glsl */`
      attribute vec3 aS; uniform float uViewH; varying vec3 vS; varying float vA;
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      void main(){
        vec3 p = position;
        p.y = PY + .5 + mod(p.y - uTime * (1.1 + aS.x * 1.7), 62.);
        p.x += sin(uTime * .55 + aS.y * 40.) * 3.5; p.z += cos(uTime * .43 + aS.z * 40.) * 3.5;
        float e = clamp(springE(phaseAt(p.xz) + .06), 0., 1.);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = clamp((.35 + .5 * aS.z) * e * projectionMatrix[1][1] * uViewH * .5 / max(-mvPosition.z, .1), 0., 40.);
        vS = aS; vA = e;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uPaper, uRed, uBlue, uSun, uAmbSky; uniform float uTime; varying vec3 vS; varying float vA;
      #include <fog_pars_fragment>
      void main(){
        if (vA < .02) discard;
        float a = uTime * (1.5 + vS.x * 3.) + vS.y * 60., c = cos(a), s = sin(a);
        vec2 q = gl_PointCoord - .5; q = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
        float flip = sin(uTime * (2. + vS.z * 4.) + vS.x * 30.);
        if (abs(q.x) > .34 || abs(q.y) > .06 + .2 * abs(flip)) discard;
        vec3 alb = vS.y < .09 ? uRed : (vS.y < .14 ? uBlue : uPaper);
        gl_FragColor = vec4(alb * .8 * (uAmbSky + uSun * (.25 + .6 * abs(flip))), 1.);
        #include <fog_fragment>
      }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.name = 'paper-confetti';
  return pts;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('paper-kingdom-hero');
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const mix = (a, b, t) => a.clone().lerp(b, t);
  const white = new THREE.Color(1, 1, 1);
  // per-seed variety: paper warmth, cover cloth, castle side, tower build, crane colours, layout (all from rng)
  const page = mix(pal[0], pal[1], rng.range(0, 0.35));
  const cover = rng.pick([mix(pal[5], pal[4], 0.3), mix(pal[5], pal[4], 0.55), mix(pal[6], pal[4], 0.38)]);
  const C = {
    page, edge: mix(pal[0], pal[2], 0.35), cover, coverDark: mix(cover, pal[4], 0.5), far: mix(pal[0], white, 0.25),
    walls: [pal[0], pal[1], mix(pal[1], pal[2], 0.55)], roofs: [pal[2], mix(pal[2], pal[3], 0.5), pal[3], mix(pal[1], pal[2], 0.5)],
    blueRoof: mix(pal[5], pal[3], 0.5), red: pal[6], ink: mix(pal[4], pal[3], 0.25), blue: pal[5],
    gold: new THREE.Color('#e9a92c'),
  };
  C.far2 = mix(C.far, pal[5], 0.10); C.farRed = mix(C.far, pal[6], 0.16); C.coverLight = mix(cover, pal[0], 0.32);
  const castleSide = rng() < 0.65 ? 1 : -1;
  const L = new THREE.Vector3(...(opts.lightDir || [-0.6, 0.7, 0.4])).normalize();

  const U = {
    uUnfold: { value: 1 }, uCrane: { value: 0.7 }, uTime: { value: 0 }, uGlow: { value: 1 }, uViewH: { value: 720 },
    uLightDir: { value: L }, uSun: { value: new THREE.Color(0.96, 0.86, 0.70) }, uAmbSky: { value: new THREE.Color(0.36, 0.36, 0.40) },
    uAmbShade: { value: new THREE.Color(0.23, 0.23, 0.35) }, uWarm: { value: new THREE.Color(1.0, 0.56, 0.2) },
    uInk: { value: pal[4] }, uRed: { value: pal[6] }, uBlue: { value: pal[5] }, uPaper: { value: mix(pal[0], white, 0.2) },
    uHole: { value: new THREE.Vector3(0, HOLE_Y, PAGE_Z) }, uShadow: { value: null }, uPageCol: { value: page }, uCraneRed: { value: new THREE.Color(opts.craneAccent || pal[6]) },
    uTower: { value: new THREE.Vector3(TWR.x, PY, TWR.z) }, uCraneSize: { value: opts.craneSize ?? 1.45 },
    uB0: { value: new THREE.Vector3() }, uB1: { value: new THREE.Vector3() }, uB2: { value: new THREE.Vector3(-9, HOLE_Y + 9, PAGE_Z + 52) }, uB3: { value: new THREE.Vector3(0, HOLE_Y, PAGE_Z - 18) },
  };
  U.uB0.value.copy(spiralJS(1));
  U.uB1.value.copy(spiralJS(1)).sub(spiralJS(0.995)).normalize().multiplyScalar(45).add(U.uB0.value);

  const object = new THREE.Group(); object.name = 'paper-kingdom-hero';
  const paper = makePaperMaterial(U);
  const S = [], R = [];

  await ctx.yield?.();
  const bookB = makeBuilder(rng.fork('book'));
  buildBook(bookB, rng.fork('book2'), C);
  const book = new THREE.Mesh(bookB.geometry(), paper); book.name = 'paper-book'; book.frustumCulled = false; object.add(book);
  await ctx.yield?.();

  const popB = makeBuilder(rng.fork('pop'));
  const ceiling = opts.ceiling || (() => 1e9);     // (x, z, reach) -> highest world y a solid may reach there (the camera's corridor)
  const houses = await buildTown(popB, rng.fork('town'), C, S, R, castleSide, ceiling, async () => { await ctx.yield?.(); });
  await ctx.yield?.();
  buildTower(popB, rng.fork('tower'), C, S, R);
  buildCastle(popB, rng.fork('castle'), C, S, R, castleSide);
  await ctx.yield?.();
  buildStandingPage(popB, rng.fork('page'), C, S, R);
  buildKites(popB, rng.fork('kites'), C, ceiling);
  await ctx.yield?.();
  const pops = new THREE.Mesh(popB.geometry(), paper); pops.name = 'paper-popups'; pops.frustumCulled = false; object.add(pops);
  await ctx.yield?.();

  U.uShadow.value = bakeShadows(S, L);
  await ctx.yield?.();

  const craneCount = opts.cranes ?? 1000;
  const cranes = buildCranes(rng.fork('cranes'), U, R, craneCount, rng.range(0.04, 0.09)); object.add(cranes);
  object.add(buildGlow(rng.fork('glow'), U, opts.holeFill !== false));
  const nConf = opts.confetti ?? 1200;
  if (nConf > 0) object.add(buildConfetti(rng.fork('confetti'), U, nConf));
  await ctx.yield?.();

  // ---- progress ----
  const uf0 = opts.unfoldFrom ?? 0.5, uf1 = opts.unfoldTo ?? 0.76, cf0 = opts.cranesFrom ?? 0.72, cf1 = opts.cranesTo ?? 0.96;
  const setUnfold = (x) => { U.uUnfold.value = clamp(x, 0, 1); const e = clamp(springE(U.uUnfold.value, PAGE_PHASE), 0, 1); U.uGlow.value = e * e * e; };
  const setCranes = (x) => { U.uCrane.value = clamp(x, 0, 1); };
  // put the wave front (where pieces start to rise) d metres along the camera's route past the book's corner
  const setWave = (d) => setUnfold(Math.max(0.05, (PH0 + PH1 * d / WAVE_LEN) / 1.4));
  const setProgress = (u) => { setUnfold((u - uf0) / (uf1 - uf0)); setCranes((u - cf0) / (cf1 - cf0)); };
  setProgress(0.9);

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const portalPos = V(0, HOLE_Y, PAGE_Z);
  const anchors = {
    portalSeat: { position: portalPos.clone(), facing: V(0, 0, 1), radius: HOLE_R },
    flyThrough: FLY_THROUGH.map((q) => V(q[0], q[1], q[2])),
    beyond: V(0, HOLE_Y, PAGE_Z - 60),
    gutter: { a: V(0, PY - 1.1, BZ), b: V(0, PY - 1.1, -BZ) },
    avenue: { start: V(0, PY, ZA), end: V(0, PY, ZB), width: AVE * 2 },
    tower: { base: V(TWR.x, PY, TWR.z), top: V(TWR.x, PY + TWR.h, TWR.z), radius: 13.5, wave: (TWR_PHASE - PH0) / PH1 * WAVE_LEN },
    craneColumn: { center: V(TWR.x, PY, TWR.z), radius: 30, yMin: PY + 12, yMax: PY + TWR.h + 16 },
    standingPage: { center: V(0, PY + PAGE_H / 2, PAGE_Z), width: PAGE_W * 2, height: PAGE_H, z: PAGE_Z },
    bridges: BRIDGES.map((z) => ({ z, clearY: PY + 21, halfWidth: 13 })),
    castle: V(castleSide * CASTLE.x, PY, CASTLE.z),
    bookMin: V(-BX - 6, 0, -BZ - 6), bookMax: V(BX + 6, PY, BZ + 6), pageY: PY,
    viewpoints: { far: V(170, 100, 330), reveal: V(120, PY + 42, 182), gutter: V(18, PY + 18, 84), avenue: V(0, PY + 8, 70), tower: V(12, PY + 26, -30) },
  };

  const size = new THREE.Vector2();
  return {
    object, radius: 220, height: PY + TWR.h + 7, center: V(0, 26, -12), anchors,
    uniforms: U, setProgress, setUnfold, setCranes, setWave,
    stats: { houses, cranes: craneCount, triangles: bookB.tris + popB.tris + craneCount * 22 + 34 },
    update(dt, time, camera) {
      U.uTime.value = time;
      ctx.renderer?.getDrawingBufferSize?.(size); if (size.y > 0) U.uViewH.value = size.y;
    },
    dispose() { U.uShadow.value?.dispose(); },
    ground: true, groundY: 0,
  };
}
