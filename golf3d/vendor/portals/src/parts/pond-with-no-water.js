// pond-with-no-water: THE FISH UNDER THE ROCK, after Bada Shanren (1626 to 1705).
// A boulder 220 m tall on a foot 12 m wide, its black underside leaning over nothing; under the bulge a 30 m fish hangs
// in blank paper, its squarish eye rolled up at us; a hunched bird sleeps on one leg on the north horn.
//
// HOW THE STYLE IS MADE (use these exports for everything else in the world, so it is all one hand):
//   post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } }. No inverse
//   tone map: colours are written as THREE.Color(hex) and land exact. No lights, no fog, no full-screen pass.
//   makeInk(palette) THE BRUSH OF ONE BUILD: { STYLE, setPalette, shellMaterial, hullMaterial, lineMaterial, dabMaterial,
//                    makePaperDome, leafMaterial }. STYLE is that build's shared uniforms (uTime, the six pigments, uWet =
//                    distance rule in metres, uViewH, uDry). buildHero makes one (or takes opts.ink) and returns it as
//                    hero.ink: the world takes every factory below from hero.ink. Nothing is kept at module level, so
//                    two instances of the world never share a brush. The hero's update() sets uTime and uViewH.
//   STYLE_GLSL       paperCol(dir), inkTone(load) (four inks as STEPS), distLoad(worldPos, n) (far = dry and pale, in a
//                    noise-broken front, never a fade to haze), fibre(), vnoise(), fbm3(). STYLE_FRAG_GLSL: fibreF() with LOD.
//   makePaperDome()  the sheet (fibres by view direction); copy the camera's world position to it each frame.
//   shellMaterial({ wash, deform })  OPAQUE PAPER SHELL with optional ink lying on it (GLSL wash() -> coverage, load).
//                    Paper is computed by view direction exactly as on the dome, so a shell only shows where it overlaps.
//   hullMaterial({ width, load, gaps, gapScale })  THE CONTOUR: the same geometry drawn again, back faces pushed out
//                    `width` metres: a blunt line of constant width in METRES round every silhouette, pooled, streaked dry
//                    beside its gaps, never closed. Needs smooth welded normals.
//   lineMaterial() + strokeGeometry(points, radius)  THE LINE: blunt tube, constant width, pooled start, dry streaked
//                    end, 2 px floor, uHead for a line still being drawn (stalks). Never tapers.
//   dabMaterial(load) + dabGeometry(rng, r)  one press of the brush (pupils, moss and thorn dots).
//   leafMaterial(count) + leafGeometry(rng, {...})  THE SWEEP: multiply-blended soaked ink with radial sweeps, paper
//                    slivers, black heart, hard grey tide line; per-leaf (wet, dried) state in uniforms.uLeaf.value[id].
//   makeEye(rng, size, mats)  THE EYE (fish, minnows, bird: every eye is this eye); .look(camWorldPos, dt) slides the pupil.
//   FISH_DEFORM      vertex sculling for a fish built head at -X (reuse for minnows with their own uTail uniform).
//
// buildHero(ctx, opts) -> { object, radius 78, height 222, center, anchors, update, setProgress(u), uniforms, ink, parts }
//   opts: palette (6 hex: paper, burnt, heavy, grey, pale, cinnabar), detail 0.6..1, brush 'loaded'|'dry'|'soaked',
//         fish 'hump'|'flat', rock 'anvil'|'lumps', bird 'mynah'|'quail'|'kingfisher' (all seeded if absent), dome (bool).
//   Local frame = the brief's world frame minus WORLD_OFFSET (36, 0, 332), NOT rotated: place object.position at the
//   offset. The camera comes from -Z. Origin is the rock's foot.
//   anchors (local): worldOffset; flyThrough (the brief's line from the bottom of the drop to the seal; the rock is
//   carved 11 m clear of its straight segments, so keep the spline near them); portalSeat { position, facing } for the
//   14 m seal opening; fishSnout/fishTail/fishCentre; fishEyeNW (the eye passed at 8 m) and fishEyeSE; horn, bird,
//   birdEye; minnowRest; viewpoints { reveal, eyePass, stem, exit }; variant (what the seed chose).
//   setProgress(u): call every frame with the path u: tail flick at 0.355..0.39, bird opens its eye at 0.945 and
//   changes legs at 0.955..0.975. Everything else (sculling, gill, bob, breathing, pupils) loops in update().
//   Cost: about 99k triangles, 28 draw calls, no lights, no textures, build about 230 ms in yielded steps.
//   Expects around it: the paper dome, leaves and stalks within 30 m of the path (the hero alone leaves much paper),
//   minnows at minnowRest, the cinnabar seal at portalSeat.
//   Viewer only: unless opts.dome is false the piece adds its own dome; opts.focus = fish|eye|reveal|bird|
//   foot|top|leaf frames one part. The piece reads no URL.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const PALETTE = ['#E8EAE3', '#0E0D0C', '#3A3A38', '#85867F', '#C3C5BD', '#B3261E'];

// ---------------------------------------------------------------------------------------------
// Shared uniforms: ONE object PER BUILD (makeInk). Every material made by that build's factories
// holds references to these, so setting STYLE.uTime.value etc. once a frame drives everything in that build only.
// ---------------------------------------------------------------------------------------------
export function makeInk(pal = PALETTE) {
  const STYLE = {
    uTime: { value: 0 },
    uPaper: { value: new THREE.Color(PALETTE[0]) }, uBurnt: { value: new THREE.Color(PALETTE[1]) }, uHeavy: { value: new THREE.Color(PALETTE[2]) },
    uGrey: { value: new THREE.Color(PALETTE[3]) }, uPale: { value: new THREE.Color(PALETTE[4]) }, uCinnabar: { value: new THREE.Color(PALETTE[5]) },
    uWet: { value: new THREE.Vector2(125, 300) },   // metres: ink fully loaded nearer than x, pale and dry beyond y
    uViewH: { value: 720 },                        // drawing-buffer height in pixels (for the 2 px floor of lines)
    uDry: { value: 0 },                            // 0 loaded brush .. 1 dry brush (variant): caps the wash at middle grey
  };
  const setPalette = (p) => { const k = ['uPaper', 'uBurnt', 'uHeavy', 'uGrey', 'uPale', 'uCinnabar']; for (let i = 0; i < 6; i++) if (p && p[i]) STYLE[k[i]].value.set(p[i]); };
  setPalette(pal);
  return {
    STYLE, setPalette,
    shellMaterial: (o) => shellMaterialS(STYLE, o), hullMaterial: (o) => hullMaterialS(STYLE, o), lineMaterial: (o) => lineMaterialS(STYLE, o),
    dabMaterial: (load, o) => dabMaterialS(STYLE, load, o), makePaperDome: (r) => paperDomeS(STYLE, r), leafMaterial: (c, o) => leafMaterialS(STYLE, c, o),
  };
}

// ---------------------------------------------------------------------------------------------
// STYLE_GLSL: the whole look in one chunk. Colours are written exactly (the world runs post.flat).
//   paperCol(dir)        paper with its fibres, by VIEW DIRECTION (same value on the dome and on every shell,
//                        so an opaque shell is invisible against the sheet until ink lands on it)
//   inkTone(load)        the four inks as STEPS: 0 pale wash, 1/3 middle grey, 2/3 heavy, 1 burnt (narrow blends)
//   distLoad(wp, n)      the style's distance rule: 1 near (loaded), falling in a noise-broken front to 0.12 far (dry, pale)
//   fibre(p)             long paper fibres in object space, 0..1 (shows through ink, tears dry edges)
//   vnoise / fbm3        value noise, safe on D3D (no textures, no derivatives)
// ---------------------------------------------------------------------------------------------
export const STYLE_GLSL = /* glsl */`
uniform float uTime, uViewH, uDry;
uniform vec3 uPaper, uBurnt, uHeavy, uGrey, uPale, uCinnabar;
uniform vec2 uWet;
float hash31(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x), mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y);
  float b = mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x), mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y);
  return mix(a, b, f.z);
}
float fbm3(vec3 p){ return 0.57 * vnoise(p) + 0.29 * vnoise(p * 2.03 + 7.1) + 0.14 * vnoise(p * 4.1 + 3.3); }
float fibre(vec3 p){
  vec3 q = p + 1.7 * vec3(vnoise(p * 0.21), vnoise(p * 0.21 + 9.0), vnoise(p * 0.21 + 4.0));
  return 0.6 * vnoise(q * vec3(5.5, 0.55, 5.5)) + 0.4 * vnoise(vec3(q.x * 0.82 + q.y * 0.57, q.y * 0.82 - q.x * 0.57, q.z + q.x * 0.3) * vec3(7.0, 0.8, 7.0) + 11.0);
}
vec3 paperCol(vec3 dir){
  vec3 d = dir / max(length(dir), 1e-4);
  vec3 w = d * 3.0 + 0.8 * vec3(vnoise(d * 2.3), vnoise(d * 2.3 + 5.0), vnoise(d * 2.3 + 9.0));
  float f = 0.6 * vnoise(w * vec3(34.0, 5.0, 34.0)) + 0.4 * vnoise(w.yzx * vec3(60.0, 9.0, 60.0));
  return uPaper * (0.988 + 0.024 * f);
}
vec3 inkTone(float load){
  load = clamp(load, 0.0, 1.0);
  vec3 c = mix(uPale, uGrey, smoothstep(0.14, 0.24, load));
  c = mix(c, uHeavy, smoothstep(0.46, 0.56, load));
  return mix(c, uBurnt, smoothstep(0.80, 0.90, load));
}
float distLoad(vec3 wp, float n){
  float d = length(wp - cameraPosition) + (n - 0.5) * 60.0;
  return mix(1.0, 0.12, smoothstep(uWet.x, uWet.y, d));
}
`;

// STYLE_FRAG_GLSL (fragment shaders only): fibreF(p) = fibre(p) that flattens to its average tint once the fibres are
// finer than about 3 pixels, so far ink is one flat tone and nothing shimmers.
export const STYLE_FRAG_GLSL = /* glsl */`
float fibreF(vec3 p){ float w = length(fwidth(p)) * 4.0; return mix(fibre(p), 0.47, smoothstep(0.35, 1.1, w)); }
`;
// GLSL: the 2 px floor for a line whose vertex normal points across its width. r = half width in metres.
const FLOOR_GLSL = /* glsl */`
float lineRadius(float r, vec4 mv){ return max(r, 1.1 * abs(mv.z) / max(projectionMatrix[1][1] * uViewH * 0.5, 1e-4) ); }
`;
const NO_DEFORM = 'vec3 deform(vec3 p, vec3 a){ return p; }';
const NO_WASH = 'vec2 wash(vec3 p, vec3 n, vec2 uv){ return vec2(0.0); }';

// shellMaterial: the OPAQUE PAPER SHELL that gives true overlap (rock, fish, bird, anything solid).
//   wash:   GLSL defining  vec2 wash(vec3 p, vec3 n, vec2 uv)  -> (coverage 0..1, load 0..1) in object space; ink that
//           lies on the shell (wash blots with tide lines, back sweeps). Default: bare paper.
//   deform: GLSL defining  vec3 deform(vec3 p, vec3 a)  (a = attribute aAnim, zero if absent) for vertex animation.
function shellMaterialS(STYLE, { wash = NO_WASH, deform = NO_DEFORM, uniforms = {}, side = THREE.FrontSide } = {}) {
  return new THREE.ShaderMaterial({
    side, uniforms: { ...STYLE, uFib: { value: 1 }, uFar: { value: 0 }, uDrag: { value: 1 }, ...uniforms },     // uFib 0: one flat tone, no fibre in the ink (the bird's chest)
    vertexShader: STYLE_GLSL + /* glsl */`
      attribute vec3 aAnim; varying vec3 vP, vN, vW; varying vec2 vUv;
      ${deform}
      void main(){ vec3 p = deform(position, aAnim); vP = position; vN = normal; vUv = uv;
        vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: STYLE_GLSL + STYLE_FRAG_GLSL + /* glsl */`
      varying vec3 vP, vN, vW; varying vec2 vUv; uniform float uFib, uFar, uDrag;
      // what a wash() may tell the hand about its sweep (all optional): gQ = the stroke's own coordinates for the streak noise (one unit =
      // about 0.4 m across the hairs, about 9 m along them; set gOwn = 1 with it), gT = 0 where the brush landed .. 1 where it ran out,
      // gE = metres inside the sweep's edge (99: unknown, no rim)
      vec3 gQ = vec3(0.0); float gT = 0.35, gE = 99.0, gOwn = 0.0, gBig = 1.0;   // gBig: how many times larger than a leaf's the sweep is (the rock: its hand shows from further off)
      ${wash}
      void main(){
        vec3 n = vN / max(length(vN), 1e-4);
        vec2 k = wash(vP, n, vUv);
        float fb = fibreF(vP * 0.75);
        float pxs = length(fwidth(vP)) / gBig, nearH = (1.0 - smoothstep(0.07, 0.2, pxs)) * uDrag;          // close enough to see the hand (about 40 m)
        // FLYING WHITE: the brush dragged one way and its hairs split: streaks of bare paper 0.1 to 0.4 m wide and metres long ALONG the stroke,
        // more of them toward its end and beside its edge. In the stroke's own coordinates; gone (flat ink) before they are thinner than 2 pixels.
        vec3 sp = mix(vec3(dot(vP, vec3(0.80, 0.30, 0.52)) * 0.11, dot(vP, vec3(-0.30, 0.95, 0.0)) * 2.4, dot(vP, vec3(-0.52, -0.10, 0.80)) * 2.4), gQ, gOwn);
        float spw = length(fwidth(sp));
        float drag = 0.62 * vnoise(sp) + 0.38 * vnoise(sp * vec3(2.2, 2.2, 2.0) + 9.0);
        float edgeN = 1.0 - smoothstep(0.3, 2.6, gE);
        float dthr = mix(0.78, 0.47, clamp(0.85 * gT * gT + 0.3 * edgeN * step(gE, 90.0), 0.0, 1.0)), da = clamp(spw * 0.5, 0.012, 0.2);
        k.x *= 1.0 - nearH * smoothstep(dthr - da, dthr + da, drag) * (1.0 - smoothstep(0.4, 0.9, spw));
        float fleck = step(0.74, fibreF(vP * 1.9 + 5.0)) * step(0.6, vnoise(vP * 0.4 + 2.0)) * (1.0 - smoothstep(0.02, 0.05, pxs * gBig));   // scattered flecks where a fibre resisted (very near only, whatever the sweep's size)
        k.x *= 1.0 - nearH * fleck;
        float load = k.y * max(distLoad(vW, vnoise(vP * 0.013)), uFar) * (1.0 - 0.3 * uDry);                    // dry brush: a load over 1.2 (pupils, the bird) still lands black
        // the tide line: the ink pooled where the wet sweep stopped, a rim 0.3 to 0.6 m wide one step darker than the body beside it, broken
        float rimW = 0.3 + 0.3 * vnoise(vP * 0.35 + 4.0), rimOn = smoothstep(0.34, 0.44, vnoise(vP * 0.13 + 11.0));
        load += 0.34 * (1.0 - smoothstep(rimW - 0.06, rimW + 0.06, gE + 0.25 * (fb - 0.47))) * rimOn * nearH * step(load, 0.95);
        // the paper's fibre shows through the ink as fine lighter threads (one ink step lighter)
        float thread = max(smoothstep(0.605, 0.66, fibreF(vP * 0.55 + 41.0)) * (1.0 - smoothstep(0.05, 0.10, pxs)), smoothstep(0.62, 0.67, fibreF(vP * 1.5 + 7.0)) * (1.0 - smoothstep(0.018, 0.04, pxs)));
        load -= 0.30 * thread * nearH * uFib * step(load, 1.25);
        vec3 ink = inkTone(load) * (1.0 + 0.12 * uFib * (fb - 0.45) * (1.0 - 0.6 * min(load, 1.0)));    // fibres show through the ink
        vec3 col = mix(paperCol(vW - cameraPosition), min(ink, uPaper), clamp(k.x, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

// hullMaterial: the CONTOUR STROKE. Draw the shell's own geometry a second time with this (back faces, pushed out
// along the normal by `width` metres): a line of constant width in metres round every silhouette from every side,
// blunt, wobbling, pooled and streaked, and broken by `gaps` so the outline never closes.
//   width m, load 0..1 (which ink), gaps 0..1 (share of the outline left open), gapScale 1/m, streak vec3 (fibre stretch)
function hullMaterialS(STYLE, { width = 2, load = 1, gaps = 0.3, gapScale = 0.02, deform = NO_DEFORM, keep = '', uniforms = {}, floorPx = 1.1, minLoad = 0, body = 0.72,
  gapGLSL = 'float g = fbm3(vP * uGapS + 17.0), G = uGaps;' } = {}) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { ...STYLE, ...uniforms, uW: { value: width }, uLoad: { value: load }, uGaps: { value: gaps }, uGapS: { value: gapScale }, uFloorPx: { value: floorPx / 1.1 }, uMinLoad: { value: minLoad }, uBody: { value: body } },
    vertexShader: STYLE_GLSL + FLOOR_GLSL + /* glsl */`
      attribute vec3 aAnim; uniform float uW, uFloorPx; varying vec3 vP, vW, vN; varying vec2 vUv;
      ${deform}
      void main(){ vec3 p = deform(position, aAnim); vP = position; vN = normal; vUv = uv;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float wob = 0.75 + 0.5 * vnoise(position * 0.11 + 3.0);
        p += normal * max(uW * 0.5, lineRadius(0.0, mv) * uFloorPx) * 2.0 * wob;
        vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: STYLE_GLSL + STYLE_FRAG_GLSL + /* glsl */`
      uniform float uLoad, uGaps, uGapS, uMinLoad, uBody; varying vec3 vP, vW, vN; varying vec2 vUv;
      void main(){
        ${gapGLSL}                                               // where the brush lifted: the outline does not close
        float open = smoothstep(G - 0.02, G + 0.02, 1.0 - g);
        ${keep}
        float fb = fibreF(vP * 0.4);
        float dry = smoothstep(G + 0.02, G + 0.11, 1.0 - g);   // 0 beside a gap (streaked dry) .. 1 mid stroke (pooled)
        float pxs = length(fwidth(vP)), nearH = 1.0 - smoothstep(0.07, 0.2, pxs);
        if (open < 0.5 || fb < (1.0 - dry) * 0.62 + 0.3 * uDry) discard;
        if (nearH * (0.55 * fibreF(vP * 1.7 + 3.0) + 0.45 * vnoise(vP * vec3(2.2, 0.35, 2.2) + 9.0)) > 0.66) discard;   // flecks of paper the hairs skipped
        float load = max(uLoad * (uBody + (1.0 - uBody) * dry) * distLoad(vW, vnoise(vP * 0.013)), uMinLoad);
        vec3 ink = inkTone(load) * (1.0 + 0.45 * (fb - 0.45) * (1.0 - 0.6 * load));
        gl_FragColor = vec4(min(ink, uPaper), 1.0);
      }`,
  });
}

// lineMaterial: THE LINE (stalks, gill, mouth, eye ring, fin rays, rock creases). Use with strokeGeometry().
// Constant width in metres from end to end, blunt ends, pooled where it starts (s = 0), streaked dry over its last
// `dryLen` metres with what is behind showing through the streaks (discard, not paper paint), never under 2 px.
//   load 0..1 ink; uniforms.uHead (0..1, default 1): only this share of the line is drawn yet, with a wet bead at the
//   head (the stalks "still being drawn"): give such a line its own material and animate material.uniforms.uHead.
function lineMaterialS(STYLE, { load = 0.72, dryLen = 12, deform = NO_DEFORM, uniforms = {} } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...STYLE, uHead: { value: 1 }, uFloor: { value: 0 }, ...uniforms, uLoad: { value: load }, uDryLen: { value: dryLen } },
    vertexShader: STYLE_GLSL + FLOOR_GLSL + /* glsl */`
      attribute vec3 aAnim; attribute vec4 aStroke; uniform float uHead, uFloor; varying vec4 vS; varying vec3 vP, vW; varying float vA, vF;
      ${deform}
      void main(){ vec3 p = deform(position, aAnim); vS = aStroke; vP = position; vA = uv.y;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vec3 nv = normalMatrix * normal, ev = -mv.xyz;                                    // vF: 1 down the middle of the line as seen, 0 at its two edges
        vF = abs(dot(nv, ev)) / max(length(nv) * length(ev), 1e-4);
        float bead = 1.0 + 0.55 * step(uHead, 0.999) * exp(-abs(aStroke.x - uHead * aStroke.y) * 0.5)
                   + 0.2 * exp(-aStroke.x / max(1.3 * aStroke.w, 1e-3));                  // the blob where the loaded brush first touched
        float lr = max(lineRadius(aStroke.w, mv), uFloor * abs(mv.z) / max(projectionMatrix[1][1] * uViewH * 0.5, 1e-4));
        p += normal * (lr * bead - aStroke.w);
        vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: STYLE_GLSL + STYLE_FRAG_GLSL + /* glsl */`
      uniform float uLoad, uDryLen, uHead; varying vec4 vS; varying vec3 vP, vW; varying float vA, vF;
      void main(){
        float s = vS.x, len = max(vS.y, 1e-3), rw = max(vS.w, 0.05);
        if (s > uHead * len) discard;
        float dry = smoothstep(len - uDryLen, len, s) * step(0.999, uHead);
        // the brush running dry splits into two or three parallel HAIRS that run on for metres (long along the stroke, keyed to the stroke)
        float streak = vnoise(vec3(s * 0.035 / rw, vA * 7.0, vS.z * 7.0)) * 0.72 + 0.28 * fibreF(vP * 1.2);
        if (streak < dry * 0.8 + 0.25 * uDry - 0.04) discard;
        float pxs = length(fwidth(vP)), nearH = 1.0 - smoothstep(0.05, 0.16, pxs);
        float hair = 0.86 * vnoise(vec3(s * max(0.035 / rw, 2.6 / len), vA * 13.0, vS.z * 3.0 + 5.0)) + 0.14 * fibreF(vP * 2.3 + 2.0);   // each hair starts and stops inside the stroke
        float along = smoothstep(0.25, 0.9, s / len);                                                       // more of them toward the end of the stroke
        if (nearH * hair * smoothstep(0.3, 0.62, vF) > 0.675 - 0.055 * along) discard;                                                    // flying white: streaks of bare paper inside the stroke
        float pool = exp(-s / max(1.6 * vS.w, 1e-3)) + step(uHead, 0.999) * exp(-abs(s - uHead * len) * 0.4);
        // the ink settled: a faint darker edge either side of a slightly lighter core (near only; far the line is one tone)
        float rim = (1.0 - smoothstep(0.30, 0.52, vF)) * 0.12 - smoothstep(0.55, 0.9, vF) * 0.05 * step(hair, 0.5);
        float load = (uLoad + 0.3 * pool - 0.25 * dry + rim * nearH * (1.0 - dry)) * distLoad(vW, vnoise(vP * 0.013));
        float fb = fibreF(vP * 1.3);
        vec3 ink = inkTone(load) * (1.0 + 0.45 * (fb - 0.45) * (1.0 - 0.6 * clamp(load, 0.0, 1.0)));
        gl_FragColor = vec4(min(ink, uPaper), 1.0);
      }`,
  });
}

// dabMaterial: a flat dab of one ink (pupils, moss dots, thorn dots, the bird's lump): shell with full coverage.
function dabMaterialS(STYLE, load = 1, opt = {}) {
  return shellMaterialS(STYLE, { ...opt, uniforms: { uDrag: { value: opt.drag ?? 0 }, ...(opt.uniforms || {}) }, side: THREE.DoubleSide, wash: `vec2 wash(vec3 p, vec3 n, vec2 uv){ return vec2(1.0, ${load.toFixed(3)}); }` });
}

// paperDome: the sheet. Add it to the scene and copy the camera's world position to it every frame.
function paperDomeS(STYLE, radius = 3000) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 40, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: { ...STYLE },
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: STYLE_GLSL + 'varying vec3 vD; void main(){ gl_FragColor = vec4(paperCol(vD), 1.0); }',
  }));
  m.renderOrder = -10; m.frustumCulled = false;
  return m;
}

// strokeGeometry(points, radius, opt): a blunt tube of constant radius through `points` (Vector3[], smoothed unless
// opt.raw), with the attributes lineMaterial needs: aStroke = (metres from the start, total metres, seed, radius),
// uv.y = round the tube, normal = across the line. opt: { seed, radial = 6, step = metres per ring, anim: (p, s01) => [x,y,z] }
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _t = new THREE.Vector3();
export function strokeGeometry(points, radius, opt = {}) {
  const radial = opt.radial ?? 6, seed = opt.seed ?? 0;
  let pts = points;
  if (!opt.raw) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const n = Math.max(2, Math.ceil(curve.getLength() / (opt.step ?? radius * 2.5)));
    pts = curve.getSpacedPoints(n);
  }
  const n = pts.length, rings = n + 4;
  const pos = new Float32Array(rings * (radial + 1) * 3), nor = new Float32Array(pos.length), st = new Float32Array(rings * (radial + 1) * 4);
  const uv = new Float32Array(rings * (radial + 1) * 2), anim = opt.anim ? new Float32Array(pos.length) : null;
  let len = 0; const ss = [0];
  for (let i = 1; i < n; i++) { len += pts[i].distanceTo(pts[i - 1]); ss.push(len); }
  const N = new THREE.Vector3(0, 1, 0.31).normalize(), B = new THREE.Vector3();
  let k = 0;
  for (let r = 0; r < rings; r++) {
    const i = Math.min(n - 1, Math.max(0, r - 2));
    _t.copy(pts[Math.min(n - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize();
    B.crossVectors(_t, N); if (B.lengthSq() < 1e-6) B.set(1, 0, 0); B.normalize(); N.crossVectors(B, _t).normalize();
    const cap = r < 2 ? r : (r >= rings - 2 ? rings - 1 - r : 2);            // 0 tip, 1 shoulder, 2 body
    const rr = radius * (opt.width ? opt.width(ss[i] / Math.max(len, 1e-3)) : 1) * (cap === 0 ? 0.02 : cap === 1 ? 0.72 : 1), off = radius * (cap === 0 ? 0.42 : cap === 1 ? 0.3 : 0) * (r < 2 ? -1 : 1);
    _c.copy(pts[i]).addScaledVector(_t, off);
    for (let j = 0; j <= radial; j++, k++) {
      const a = (j / radial) * Math.PI * 2;
      _a.copy(N).multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
      pos[k * 3] = _c.x + _a.x * rr; pos[k * 3 + 1] = _c.y + _a.y * rr; pos[k * 3 + 2] = _c.z + _a.z * rr;
      nor[k * 3] = _a.x; nor[k * 3 + 1] = _a.y; nor[k * 3 + 2] = _a.z;
      st[k * 4] = ss[i]; st[k * 4 + 1] = len; st[k * 4 + 2] = seed; st[k * 4 + 3] = rr;
      uv[k * 2] = ss[i] / Math.max(len, 1e-3); uv[k * 2 + 1] = j / radial;
      if (anim) { const v = opt.anim(pts[i], ss[i] / Math.max(len, 1e-3)); anim[k * 3] = v[0]; anim[k * 3 + 1] = v[1]; anim[k * 3 + 2] = v[2]; }
    }
  }
  const idx = [];
  for (let r = 0; r < rings - 1; r++) for (let j = 0; j < radial; j++) {
    const a = r * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aStroke', new THREE.BufferAttribute(st, 4));
  if (anim) g.setAttribute('aAnim', new THREE.BufferAttribute(anim, 3));
  g.setIndex(idx);
  return g;
}

// dabGeometry: one press of the brush: a lopsided, slightly squarish blot of radius r in the XY plane facing +Z.
export function dabGeometry(rng, r = 1, n = 18, squarish = 0.5, rag = 1) {
  const pos = [0, 0, 0.06 * r], idx = [], ph = rng() * 6.28, e = 2 + squarish * 3, lop = 1 + (rng() - 0.5) * 0.5 * rag;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    const sq = Math.pow(Math.pow(Math.abs(c), e) + Math.pow(Math.abs(s), e), -1 / e);
    const rr = r * sq * (0.86 + rag * (0.16 * Math.sin(a * 2 + ph) + 0.1 * Math.sin(a * 5 + ph * 2.3)) + 0.08 * rag * (rng() - 0.5));
    pos.push(c * rr * lop, s * rr, 0);
    idx.push(0, 1 + i, 1 + ((i + 1) % n));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((n + 1) * 2), 2));
  return g;
}

// ---------------------------------------------------------------------------------------------
// THE ROCK: top-heavy on a foot a tenth of its width. A profile (r, y) swept round a leaning axis,
// with a south-west lobe that sags over the fish, a north lobe that ends in the horn, and soft lumps.
// ---------------------------------------------------------------------------------------------
const gauss = (x, s) => Math.exp(-(x * x) / (2 * s * s));
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
function cr(p0, p1, p2, p3, f) { const f2 = f * f, f3 = f2 * f; return 0.5 * ((2 * p1) + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f2 + (-p0 + 3 * p1 - 3 * p2 + p3) * f3); }

async function buildRock(ctx, rng, detail, V) {
  const noise = ctx.noise, NA = Math.round(160 * (0.6 + 0.4 * detail)), NT = Math.round(128 * (0.6 + 0.4 * detail));
  const top = new THREE.Vector2(-15 + rng.range(-4, 4), 5 + rng.range(-4, 4));         // where the mass sits over the foot
  const aSW = Math.atan2(-42 - top.y, -36 - top.x), aN = Math.atan2(66 - top.y, -34 - top.x);
  const E0 = 47 + rng.range(-3, 3), lobeSW = 24 + rng.range(-3, 5), lobeN = 19, droopSW = 20 + rng.range(-4, 6);
  const ph = rng() * 100, lump = 1 + (V.twoLumps ? 0.5 : 0), waist = V.twoLumps ? 0.62 : 1;
  const prof = (a) => {
    const E = E0 + lobeSW * gauss(angDiff(a, aSW), 0.8) + lobeN * gauss(angDiff(a, aN), 0.55) + 7 * noise.n2(Math.cos(a) * 1.3 + ph, Math.sin(a) * 1.3);
    const dr = droopSW * gauss(angDiff(a, aSW), 0.9) + 5 * noise.n2(Math.cos(a) * 2 + 9, Math.sin(a) * 2 + ph);
    return [[0, 0], [6.2, 0.4], [5.8, 7], [6.4, 26], [8.5, 50], [12.5, 72], [20, 90], [E * 0.5, 106 - dr * 0.45], [E * 0.86, 119 - dr],
      [E, 146 - dr * 0.4], [E * waist, 165], [E * 0.98, 180], [E * 0.86, 191], [E * 0.6, 198], [E * 0.3, 201], [0, 202]];
  };
  const W = NA + 1, pos = new Float32Array(W * (NT + 1) * 3), uv = new Float32Array(W * (NT + 1) * 2);
  for (let j = 0; j <= NA; j++) {
    const a = (j % NA) / NA * Math.PI * 2, P = prof(a), ca = Math.cos(a), sa = Math.sin(a), m = P.length - 1;
    for (let i = 0; i <= NT; i++) {
      const tt = Math.pow(i / NT, 0.9) * m, s = Math.min(m - 1, Math.floor(tt)), f = tt - s;
      const q = (k) => P[Math.max(0, Math.min(m, k))];
      let r = Math.max(0, cr(q(s - 1)[0], q(s)[0], q(s + 1)[0], q(s + 2)[0], f)), y = cr(q(s - 1)[1], q(s)[1], q(s + 1)[1], q(s + 2)[1], f);
      if (i === 0 || i === NT) r = 0;
      const lean = ctx.core.smoothstep(30, 150, y), cx = top.x * lean, cz = top.y * lean;
      let x = cx + ca * r, z = cz + sa * r;
      const big = ctx.core.smoothstep(60, 115, y), d = (noise.fbm3(x * 0.013 + ph, y * 0.013, z * 0.013, 3) * 7.5 * lump + noise.fbm3(x * 0.05, y * 0.05 + ph, z * 0.05, 2) * 1.5) * (0.12 + 0.88 * big);
      const oy = Math.max(105, Math.min(175, y)), ox = x - cx, ozz = z - cz, ol = Math.hypot(ox, y - oy, ozz) || 1;
      x += (ox / ol) * d; y += ((y - oy) / ol) * d * (i === 0 ? 0 : 1); z += (ozz / ol) * d;
      const hd = Math.hypot(x + 34, z - 66);
      y += 36 * gauss(hd, 18) * ctx.core.smoothstep(150, 190, y);                     // the north horn
      for (let q = 0; q < V.keepOut.length - 1; q++) {                                   // the camera line is kept clear by construction
        const A = V.keepOut[q], B = V.keepOut[q + 1], bx = B[0] - A[0], by = B[1] - A[1], bz = B[2] - A[2];
        const f = Math.max(0, Math.min(1, ((x - A[0]) * bx + (y - A[1]) * by + (z - A[2]) * bz) / (bx * bx + by * by + bz * bz)));
        const dx = x - A[0] - bx * f, dy = y - A[1] - by * f, dz = z - A[2] - bz * f, dl = Math.hypot(dx, dy, dz);
        if (dl < V.clear && dl > 1e-3) { const m = V.clear / dl - 1; x += dx * m; y += dy * m; z += dz * m; }
      }
      const k = (i * W + j) * 3; pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
      uv[(i * W + j) * 2] = j / NA; uv[(i * W + j) * 2 + 1] = i / NT;
    }
    await ctx.yield();
  }
  for (let i = 0; i <= NT; i++) for (let c = 0; c < 3; c++) pos[(i * W + NA) * 3 + c] = pos[(i * W) * 3 + c];
  const idx = new Uint32Array(NA * NT * 6); let k = 0;
  for (let i = 0; i < NT; i++) for (let j = 0; j < NA; j++) { const a = i * W + j, b = a + W; idx[k++] = a; idx[k++] = b; idx[k++] = a + 1; idx[k++] = a + 1; idx[k++] = b; idx[k++] = b + 1; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  await ctx.yield();
  g.computeVertexNormals();
  const nor = g.attributes.normal.array;
  for (let i = 0; i <= NT; i++) {                                                     // weld the seam and the poles so the hull has no crack
    const a = (i * W) * 3, b = (i * W + NA) * 3;
    for (let c = 0; c < 3; c++) { const v = (nor[a + c] + nor[b + c]) * 0.5; nor[a + c] = v; nor[b + c] = v; }
  }
  for (let j = 0; j <= NA; j++) { nor.set([0, -1, 0], j * 3); nor.set([0, 1, 0], (NT * W + j) * 3); }
  await ctx.yield();
  // look-up on the built surface: at(t 0..1 foot to crown, a radians) -> { p, n }
  const at = (t, a) => {
    const j = Math.round((((a / (Math.PI * 2)) % 1 + 1) % 1) * NA) % NA, i = Math.max(0, Math.min(NT, Math.round(t * NT))), q = (i * W + j) * 3;
    return { p: new THREE.Vector3(pos[q], pos[q + 1], pos[q + 2]), n: new THREE.Vector3(nor[q], nor[q + 1], nor[q + 2]) };
  };
  // horn tip: the highest vertex
  let hi = 0; for (let q = 1; q < pos.length; q += 3) if (pos[q] > pos[hi * 3 + 1]) hi = (q - 1) / 3;
  const horn = new THREE.Vector3(pos[hi * 3], pos[hi * 3 + 1], pos[hi * 3 + 2]);
  // nine wash blots in rock-local space (centre, radius), mostly low on the mass and on the stem
  const blots = [];
  for (let b = 0; b < 9; b++) {
    const s = at(b < 2 ? rng.range(0.12, 0.3) : rng.range(0.52, 0.86), b < 4 ? aSW + rng.range(-1.2, 1.2) : rng.range(0, 6.28));
    blots.push(new THREE.Vector4(s.p.x, s.p.y, s.p.z, (b < 2 ? rng.range(4.4, 6.2) : b < 4 ? rng.range(8, 14) : 0.01) * (V.soaked ? 1.5 : 1)));
  }
  { const b6 = at(0.3, 2.4).p, b7 = at(0.235, 1.45).p; blots[6].set(b6.x, b6.y, b6.z, 5.6); blots[7].set(b7.x, b7.y, b7.z, 4.6); }   // two on the stem's north side, where we orbit it
  { const b8 = at(0.8, aN + 1.6).p; blots[8].set(b8.x, b8.y, b8.z, 12); }                 // one on the west shoulder, under us as we come over it
  blots[4].set(horn.x - 7, horn.y - 19, horn.z - 3, 9.5); blots[5].set(horn.x + 2, horn.y - 30, horn.z + 9, 7);
  return { geo: g, at, horn, blots, aSW, aN, top };
}

const ROCK_WASH = /* glsl */`
uniform vec4 uBlot[9]; uniform float uSoak; uniform vec2 uAxis;
vec2 wash(vec3 p, vec3 n, vec2 uv){
  float nz = fbm3(p * 0.011 + 2.0), sl = vnoise(p * vec3(0.55, 0.05, 0.55) + 31.0);
  // the underside: the heaviest ink in the world, one solid mass stopped by a hard tide line where the rock turns upward.
  // Laid by smooth rock-local position only (never by the facet's normal), so its edge is a curve at any distance.
  vec2 dxz = p.xz - uAxis * smoothstep(30.0, 150.0, p.y); float rl = max(length(dxz), 1e-3); vec2 dd = dxz / rl;   // round the leaning axis
  float lob = 0.22 * (vnoise(vec3(dd * 2.6, 1.0)) - 0.5);
  float m = min(min(0.42, (p.y - 86.0 + (nz - 0.5) * 34.0) * 0.045), (158.0 + (nz - 0.5) * 30.0 + 60.0 * lob - p.y) * 0.045) + (nz - 0.5) * 0.3 + lob + uSoak * 0.2;
  float px = length(fwidth(p));
  float cov = smoothstep(0.10 - 0.02 * min(px, 1.0), 0.112, m), load = mix(0.74, 1.3, smoothstep(0.29, 0.35, m + (vnoise(p * 0.028 + 9.0) - 0.5) * 0.12 + (fibre(p * 0.6) - 0.47) * 0.09 * (1.0 - smoothstep(0.1, 0.3, px))));
  load = mix(0.74, load, smoothstep(0.15, 0.17, m) + smoothstep(0.5, 1.5, px));   // heavy beside the edge; the pooled dark tide line is laid on it by the shell (gE)
  vec2 sx = dd * 84.0; float swd = length(fwidth(sx));                    // past it the brush ran dry: streaks dragged on, paper between
  float stk = 0.6 * vnoise(vec3(sx, rl * 0.012 + p.y * 0.01)) + 0.4 * vnoise(vec3(sx * 0.31, 8.0 + p.y * 0.012));
  float past = 1.0 - smoothstep(-0.16, 0.10, m);
  float dcov = smoothstep(0.30 + 0.62 * past, 0.34 + 0.62 * past, stk) * (1.0 - smoothstep(0.5, 1.2, swd)) * step(0.001, past) * step(past, 0.999);
  load = mix(0.66, load, cov);
  cov = max(cov, dcov);
  cov *= mix(1.0, smoothstep(0.17, 0.2, sl + 0.5 * load), 1.0 - smoothstep(0.3, 0.9, px));   // slivers of bare paper the sweep left (near only)
  float belly = cov;
  gOwn = 1.0; gBig = 2.6; gQ = vec3(dd * 42.0, rl * 0.03 + p.y * 0.04);                                 // the sweeps ran up and outward round the bulge
  gE = (m - 0.11) * 22.0; gT = 0.25 + 0.5 * (1.0 - smoothstep(0.1, 0.3, m));
  // a few mid-grey wash blots on the bare paper of the stem and the shoulder: flat, no paper inside them, and a
  // darker tide line along the LOWER side only (the wash ran down and stopped); they never lie on the black
  float nb = fbm3(p * 0.03 + 8.0);
  for (int i = 0; i < 9; i++) {
    vec3 q = (p - uBlot[i].xyz) * vec3(1.0, mix(0.34, 0.7, smoothstep(60.0, 100.0, p.y)), 1.0);
    float rb = max(uBlot[i].w, 1e-3);
    float d = length(q) / rb + (nb - 0.5) * 1.1 + 0.2 + 0.5 * (vnoise(p * 0.3 + 3.0) - 0.5) + 0.25 * (vnoise(p * 0.9) - 0.5) * (1.0 - smoothstep(0.1, 0.5, px));
    float c = (1.0 - smoothstep(0.985, 1.0, d)) * (1.0 - belly);
    float lowSide = step(q.y, -0.12 * rb) * step(0.9, d);
    float l = mix(0.30 + 0.06 * uSoak, 0.62, lowSide);
    load = mix(load, l, c);
    cov = max(cov, c);
    gE = mix(gE, (1.0 - d) * rb * 0.6, c);
  }
  return vec2(cov, load);
}`;

// ---------------------------------------------------------------------------------------------
// THE FISH: 30 m of sulk. Local frame: snout at x = -15, tail at x = +15, +Y up, sides at +-Z.
// ---------------------------------------------------------------------------------------------
export const FISH_DEFORM = /* glsl */`
uniform float uTail;
vec3 deform(vec3 p, vec3 a){
  float s = clamp((p.x + 3.0) / 18.0, 0.0, 1.0); s *= s;
  p.z += s * (uTail * 7.0 + 0.8 * sin(uTime * 0.8 - p.x * 0.12));       // the tail hangs and sculls; uTail flicks it
  p.z += a.x * sin(uTime * 1.9 + a.y);                                   // fins scull
  p.z += sign(p.z) * a.z * (0.5 + 0.5 * sin(uTime * 1.25));              // the gill lifts
  return p;
}`;
const FISH_WASH = /* glsl */`
vec2 wash(vec3 p, vec3 n, vec2 uv){
  float s = uv.x, b = 1.0 - abs(uv.y - 0.5) * 2.0;                       // b: 1 on the back ridge, 0 on the belly
  float nz = fbm3(p * 0.33 + 5.0), sl = vnoise(vec3(p.x * 0.16, uv.y * 70.0, 2.0));
  // three sweeps along the back, each stopped by its own tide line, with slivers of paper where they meet
  float e = 0.50 + 0.10 * sin(s * 10.0 + 1.3) + (nz - 0.5) * 0.3 + 0.25 * (1.0 - smoothstep(0.0, 0.03, s)) - 0.2 * smoothstep(0.7, 0.86, s);
  float m = b - e;
  float gap = min(abs(s - 0.33 - (nz - 0.5) * 0.09 - b * 0.07), abs(s - 0.585 + (nz - 0.5) * 0.09 + b * 0.09));
  float gw = 0.006 + 0.011 * vnoise(vec3(uv.y * 9.0, s * 3.0, 4.0)) + 0.01 * (1.0 - b);                // the slivers open toward the belly
  float cov = smoothstep(0.0, 0.004, m) * smoothstep(gw, gw + 0.0015, gap) * (1.0 - smoothstep(0.84, 0.87, s + (nz - 0.5) * 0.05));
  float load = mix(0.36, mix(1.0, 0.72, smoothstep(0.5, 0.8, s)), smoothstep(0.026, 0.032, m));            // black, and ONE grey tide line
  cov *= smoothstep(0.16, 0.2, sl + 0.55 * load);
  float sy = uv.y * 170.0, fine = smoothstep(0.5, 1.1, fwidth(sy));                                       // dragged dry toward the tail: streaks, fibre between
  float stk = 0.55 * vnoise(vec3(s * 5.0, sy, 2.0)) + 0.45 * fibre(p * 1.6);
  float thr = (0.62 * smoothstep(0.36, 0.84, s) + 0.3 * (1.0 - smoothstep(0.0, 0.16, m)) * smoothstep(0.2, 0.45, s)) * (1.0 - fine);
  cov *= smoothstep(thr - 0.02, thr + 0.02, stk + 0.08);
  // the tail: dry rays, torn at the far edge
  float ray = vnoise(vec3(uv.y * 56.0, s * 3.0, 7.0)), far = smoothstep(0.86, 1.0, s);
  float tc = smoothstep(0.845, 0.855, s + (nz - 0.5) * 0.03) * smoothstep(0.16 + 0.5 * far, 0.22 + 0.5 * far, ray + 0.2 * fibre(p * 2.0));
  gOwn = 1.0; gQ = vec3(s * 3.3, uv.y * 58.0, 3.0); gT = smoothstep(0.45, 0.95, s) * 0.45; gE = 99.0;   // the lead, 12:20: the back keeps its black mass (its own dry drag toward the tail is above); no second tearing along its edge
  return vec2(max(cov, tc), mix(load, 0.86 - 0.45 * far, step(cov, tc - 0.001)));
}`;
const FIN_WASH = /* glsl */`
vec2 wash(vec3 p, vec3 n, vec2 uv){
  float ray = vnoise(vec3(uv.x * 13.0, floor(uv.x * 0.0) + 3.0, p.x * 0.05));
  float cov = smoothstep(0.12 + 0.4 * uv.y, 0.17 + 0.4 * uv.y, ray + 0.25 * fibre(p * 2.0));
  return vec2(cov, 0.95 - 0.5 * uv.y);
}`;

function buildFish(rng, detail, V) {
  const NS = Math.round(76 * (0.7 + 0.3 * detail)), NR = 28, L = 30, flat = V.flatHead ? 1 : 0;
  const key = (arr, s) => { const x = s * (arr.length - 1), i = Math.min(arr.length - 2, Math.floor(x)), f = x - i, q = (k) => arr[Math.max(0, Math.min(arr.length - 1, k))]; return cr(q(i - 1), q(i), q(i + 1), q(i + 2), f); };
  // half height, half width and centre line at 13 stations, snout to tail tip
  const HH = flat ? [1.0, 2.2, 2.9, 3.3, 3.5, 3.5, 3.3, 2.9, 2.3, 1.6, 1.15, 2.1, 3.0] : [1.5, 3.3, 4.3, 5.0, 5.4, 5.3, 4.8, 4.0, 3.0, 2.0, 1.3, 2.3, 3.3];
  const HW = flat ? [1.3, 2.3, 2.6, 2.7, 2.7, 2.6, 2.3, 1.9, 1.4, 0.9, 0.5, 0.2, 0.1] : [1.2, 2.1, 2.6, 2.9, 3.0, 2.9, 2.5, 2.0, 1.4, 0.9, 0.5, 0.2, 0.1];
  const YC = flat ? [-0.3, 0.0, 0.2, 0.4, 0.5, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0, 0.0, 0.0] : [-1.0, -0.5, 0.2, 0.9, 1.3, 1.4, 1.2, 0.9, 0.5, 0.2, 0.0, 0.1, 0.2];
  const j1 = rng.range(0.9, 1.1), j2 = rng.range(0.92, 1.08);
  const at = (s, th, out = new THREE.Vector3()) => {
    const nr = s < 0.05 ? Math.sqrt(Math.max(0, 1 - Math.pow(1 - s / 0.05, 2))) : 1, hh = key(HH, s) * j1 * nr, hw = key(HW, s) * j2 * nr, yc = key(YC, s), c = Math.cos(th), sn = Math.sin(th);
    const e = 2.6 - 0.6 * s, sq = Math.pow(Math.pow(Math.abs(c), e) + Math.pow(Math.abs(sn), e), -1 / e);   // a boxy section: blunt
    const fs = Math.max(0, (s - 0.86) / 0.14), fork = fs * 4.2 * (Math.pow(Math.abs(c), 1.5) - 0.6) + fs * 0.7 * Math.sin(th * 9 + 1);
    const belly = c > 0 ? 0.82 : 1;                                                                           // flatter under, humped over
    return out.set(-L / 2 + s * L * 0.94 + fork + 0.5 * Math.sin(th * 5 + s * 30) * fs, yc - c * sq * hh * belly, sn * sq * hw);
  };
  const W = NR + 1, pos = new Float32Array((NS + 3) * W * 3), uv = new Float32Array((NS + 3) * W * 2), v = new THREE.Vector3();
  for (let i = 0; i < NS + 3; i++) {
    const ii = Math.max(0, Math.min(NS, i - 1)), s = Math.pow(ii / NS, 1.25), closed = i === 0 || i === NS + 2;
    for (let j = 0; j <= NR; j++) {
      const th = (j % NR) / NR * Math.PI * 2; at(s, th, v);
      if (closed) { const c0 = at(s, 0, new THREE.Vector3()), c1 = at(s, Math.PI, new THREE.Vector3()); v.set((c0.x + c1.x) / 2 + (i === 0 ? -0.5 : 0), (c0.y + c1.y) / 2, 0); }
      pos.set([v.x, v.y, v.z], (i * W + j) * 3); uv.set([s, j / NR], (i * W + j) * 2);
    }
  }
  const idx = [];
  for (let i = 0; i < NS + 2; i++) for (let j = 0; j < NR; j++) { const a = i * W + j, b = a + W; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  const nor = g.attributes.normal.array;
  for (let i = 0; i < NS + 3; i++) { const a = (i * W) * 3, b = (i * W + NR) * 3; for (let c = 0; c < 3; c++) { const m = (nor[a + c] + nor[b + c]) * 0.5; nor[a + c] = m; nor[b + c] = m; } }
  for (let j = 0; j <= NR; j++) { nor.set([-1, 0, 0], j * 3); nor.set([1, 0, 0], ((NS + 2) * W + j) * 3); }
  // fins: ragged fans of rays. root on the body, pointing `dir`, lying in the plane spanned by dir and `across`
  const fan = (root, dir, across, len, spread, amp) => {
    const R = 7, S = 5, p = [], u = [], an = [], ix = [], phs = rng() * 6.28;
    for (let a = 0; a <= R; a++) {
      const f = a / R, ang = (f - 0.5) * spread, ll = len * (0.7 + 0.3 * Math.sin(f * Math.PI) + 0.14 * (rng() - 0.5));
      for (let k = 0; k <= S; k++) {
        const r = (0.04 + 0.96 * k / S) * ll;
        v.copy(root).addScaledVector(dir, Math.cos(ang) * r).addScaledVector(across, Math.sin(ang) * r);
        p.push(v.x, v.y, v.z); u.push(f, k / S); an.push(amp * (k / S) * (k / S), phs + f * 1.5, 0);
        if (a < R && k < S) { const q = a * (S + 1) + k, q2 = q + S + 1; ix.push(q, q2, q + 1, q + 1, q2, q2 + 1); }
      }
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
    fg.setAttribute('aAnim', new THREE.Float32BufferAttribute(an, 3)); fg.setIndex(ix); fg.computeVertexNormals();
    return fg;
  };
  const fins = [];
  for (const sg of [1, -1]) {                                                         // pectoral stubs, one a side, low behind the gill
    const r = at(0.3, sg * 0.62), d = new THREE.Vector3(0.62, -0.72, sg * 0.3).normalize();
    fins.push(fan(r, d, new THREE.Vector3(0.6, 0.5, sg * 0.25).normalize(), flat ? 3.6 : 4.4, 1.25, 0.8));
  }
  fins.push(fan(at(0.56, Math.PI), new THREE.Vector3(0.55, 0.83, 0).normalize(), new THREE.Vector3(1, 0, 0), flat ? 2.0 : 2.6, 1.5, 0.35));   // dorsal stub
  fins.push(fan(at(0.74, 0), new THREE.Vector3(0.6, -0.8, 0).normalize(), new THREE.Vector3(1, 0, 0), 2.6, 1.2, 0.5));                           // anal stub
  return { geo: g, at, fins: mergeGeometries(fins), L };
}

// ---------------------------------------------------------------------------------------------
// THE EYE. Every eye in this world is this eye: a lopsided squarish ring drawn in one stroke that overshoots its own
// start, bare paper inside, and the pupil, one dab, jammed against the upper rim. makeEye returns a group facing +Z
// (set it on the animal's side, +Y up) and look(cameraWorldPosition), which slides the pupil round the rim after us.
//   mats: { paper: shellMaterial(), ring: lineMaterial({ load: 1, dryLen: size }), dab: dabMaterial(1) }  (share them)
// ---------------------------------------------------------------------------------------------
export function makeEye(rng, size, mats) {
  const group = new THREE.Group(), k = size / 3.2, R = size / 2 - 0.225 * k, e = 3.0, ph = rng() * 6.28, lop = rng.range(1.04, 1.14);
  const rim = (a, f = 1) => { const c = Math.cos(a), s = Math.sin(a), sq = Math.pow(Math.pow(Math.abs(c), e) + Math.pow(Math.abs(s), e), -1 / e); return [c * sq * R * lop * f, s * sq * R * f * (1 + 0.07 * Math.sin(a + ph))]; };
  const pts = [], a0 = 3.5 + rng.range(-0.3, 0.3), n = 40;
  for (let i = 0; i <= n; i++) { const a = a0 - (i / n) * (Math.PI * 2 + 0.5), q = rim(a, 1 + 0.10 * (i / n)); pts.push(new THREE.Vector3(q[0], q[1], 0.16 * k)); }
  const ring = new THREE.Mesh(strokeGeometry(pts, 0.225 * k, { seed: rng() * 9, step: 0.22 * k, radial: 6 }), mats.ring);
  const disc = new THREE.Mesh(dabGeometry(rng, size * 0.56, 20, 0.6), mats.paper); disc.position.z = 0.05 * k;
  const rp = 0.74 * k, pupil = new THREE.Mesh(dabGeometry(rng, rp, 18, 0.15, 0.35), mats.dab);
  group.add(disc, ring, pupil);
  const v = new THREE.Vector3();
  const state = { a: Math.PI / 2 + rng.range(-0.25, 0.25), open: 1 };
  const place = () => { const q = rim(state.a, (R - 0.225 * k - rp * 0.42) / R); pupil.position.set(q[0], q[1], 0.36 * k); };
  place();
  return {
    group, pupil, ring, disc,
    look(camWorld, dt = 0.016) {                                       // the pupil keeps to the upper rim and slides toward us
      group.worldToLocal(v.copy(camWorld));
      let t = Math.PI / 2;
      if (v.z > 0) { const d = Math.atan2(v.y + size * 0.6, v.x) - Math.PI / 2; t = Math.PI / 2 + Math.max(-0.6, Math.min(0.6, angDiff(d, 0) * 0.8)); }
      state.a += (t - state.a) * Math.min(1, dt * 2.2); place();
    },
  };
}

// ---------------------------------------------------------------------------------------------
// THE BIRD on the horn: a hunched black lump on one leg, beak sunk in its chest. Local: faces +X, stands at y = 0.
// ---------------------------------------------------------------------------------------------
const BIRD_DEFORM = /* glsl */`
vec3 deform(vec3 p, vec3 a){ float b = sin(uTime * 1.05); return p + vec3(p.x, (p.y - 5.0) * 0.6, p.z) * 0.022 * b * step(4.2, p.y); }`;
const BIRD_WASH = /* glsl */`
vec2 wash(vec3 p, vec3 n, vec2 uv){
  float nz = fbm3(p * 0.4 + 3.0);
  float lo = vnoise(p * 0.22 + 3.0);
  float m = 0.72 - n.x * 0.95 + n.y * 0.45 + (lo - 0.5) * 0.4 + smoothstep(9.9, 10.7, p.y) + 0.9 * (1.0 - smoothstep(-1.2, -0.2, p.x));   // the chest faces forward; everything else is the back
  float back = smoothstep(0.43, 0.445, m);
  float sliver = (smoothstep(0.37, 0.378, m) - back) * step(0.42, vnoise(p * 0.55 + 7.0));      // the back sweep does not quite meet the chest
  float belly = smoothstep(-0.9, -0.82, n.y + 0.25 * n.x);                                      // bare paper underneath
  gOwn = 1.0; gQ = vec3(p.xz / max(length(p.xz), 0.3) * 8.5, p.y * 0.11); gT = (0.5 + 0.45 * (1.0 - smoothstep(2.5, 10.5, p.y))) * back; gE = mix(99.0, (m - 0.445) * 4.0, back);
  return vec2((1.0 - sliver) * max(back, belly), mix(0.345, 1.3, back));                        // ONE flat grey chest, black back (black even with a dry brush)
}`;
function buildBird(rng, kind) {
  const g = new THREE.SphereGeometry(1, 30, 22), p = g.attributes.position, v = new THREE.Vector3(), d = new THREE.Vector3();
  const sx = kind === 'quail' ? 4.6 : 3.9, sy = kind === 'quail' ? 3.6 : 4.3, cy = kind === 'quail' ? 6.6 : 8.2;
  const head = new THREE.Vector3(0.66, 0.75, 0).normalize(), tail = new THREE.Vector3(-0.8, -0.6, 0).normalize(), hk = kind === 'kingfisher' ? 1.25 : 1;
  for (let i = 0; i < p.count; i++) {
    d.fromBufferAttribute(p, i).normalize();
    const hd = Math.max(0, d.dot(head)), td = Math.max(0, d.dot(tail));
    const r = 1 + 0.5 * hk * Math.pow(hd, 3.5) + (kind === 'quail' ? 0.8 : 1.1) * Math.pow(td, 7) - 0.10 * Math.max(0, d.x) * Math.max(0, -d.y + 0.2);
    v.set(d.x * sx * r, d.y * sy * r, d.z * 3.3 * r * (1 - 0.25 * Math.pow(td, 4)));
    v.x += 1.35 * (v.y / sy) * (v.y > 0 ? 1 : 0.3);                                   // the hunch: the top leans forward over the chest
    p.setXYZ(i, v.x, v.y + cy, v.z);
  }
  g.computeVertexNormals();
  const lines = [], L = (pts, r) => lines.push(strokeGeometry(pts.map((q) => new THREE.Vector3(...q)), r, { seed: rng() * 9, step: 0.5 }));
  const bk = kind === 'kingfisher' ? 3.6 : 2.2;
  const bdir = new THREE.Vector3(0.62, -0.78, 0).normalize(), beak = new THREE.CylinderGeometry(0.28, 1.15, bk * 1.75, 7, 1);   // the beak, sunk in the chest
  beak.scale(1, 1, 0.6); beak.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), bdir));
  beak.translate(5.0 + bdir.x * bk * 0.875, cy + 3.5 + bdir.y * bk * 0.875, 0);
  for (const s of [1, -1]) L([[1.6, cy + 1.2, s * 3.25], [-0.6, cy + 0.6, s * 3.5], [-2.6, cy - 1.4, s * 3.1], [-3.8, cy - 3.2, s * 2.2]], 0.26);   // folded wing
  if (kind === 'quail') for (let t = 0; t < 2; t++) L([[-3.4 - t * 0.5, cy - 2.2, (t - 0.5) * 0.9], [-5.4 - t * 0.6, cy - 3.9 - t * 0.4, (t - 0.5) * 1.2], [-6.5 - t * 0.7, cy - 5.6 - t * 0.7, (t - 0.5) * 1.5]], 0.6);   // a stub of a tail, drooping
  else for (let t = 0; t < 3; t++) L([[-3.0 - t * 0.5, cy - 3.0, (t - 1) * 0.7], [-5.0 - t * 0.7, cy - 6.2 - t * 0.5, (t - 1) * 1.0], [-5.6 - t * 0.9, cy - 8.6 - t * 0.9, (t - 1) * 1.3]], 0.62);   // tail strokes
  const leg = (z) => {
    const a = [], S = (pts, r) => a.push(strokeGeometry(pts.map((q) => new THREE.Vector3(...q)), r, { seed: rng() * 9, step: 0.5 }));
    S([[0.5, cy - sy + 0.6, z], [0.9, 2.2, z], [0.3, 0.25, z]], 0.34);                                             // one sharp knee
    for (const t of [-0.7, 0, 0.7]) S([[0.3, 0.3, z], [1.3, 0.22, z + t * 0.9], [2.0, 0.18, z + t * 1.5]], 0.18);
    S([[0.3, 0.3, z], [-1.2, 0.2, z]], 0.18);
    return mergeGeometries(a);
  };
  return { geo: g, beak, lines: mergeGeometries(lines), legA: leg(0.5), legB: leg(-0.5), eyeAt: new THREE.Vector3(4.6 * (kind === 'kingfisher' ? 1.07 : 1), cy + 3.5 * (kind === 'kingfisher' ? 1.07 : 1), 0), eyeZ: kind === 'kingfisher' ? 2.1 : 1.95 };
}

// ---------------------------------------------------------------------------------------------
// THE SWEEP (the lotus leaf, and the only weather): ink that SOAKS. Drawn after the opaque shells with multiply
// blending (writes ink / paper), depth test on, depth write off: overlapping leaves darken as ink does, shells
// in front cut them out, nothing needs sorting.
//   leafGeometry(rng, { width, id, sweeps, droop, torn })  one cupped, drooping sheet (40 x 24 grid, 1.9k triangles),
//       never planar; origin at the neck (the top of its stalk). Merge all leaves into one mesh.
//   leafMaterial(count)  one material for all of them. material.uniforms.uLeaf.value[id] = Vector2(wet, dried):
//       wet 0 = a pale dry blot, 0..1 = the black heart wells and the front runs out along the sweeps to the tide
//       line and stops; dried 0..1 = one tone paler once we are past. Drive both from u, once per leaf, never looped.
// ---------------------------------------------------------------------------------------------
export function leafGeometry(rng, { width = 40, id = 0, sweeps = 7, droop = 0.3, torn = false, lean: leanOpt, plain = false } = {}) {
  // A LOPSIDED HOOD hanging to one side of its neck: the neck (origin) sits near one end of an egg-shaped mass, the
  // long side (toward `lean`) droops, the short side is nearly empty. Three to five unequal sweeps, notched where they
  // meet. uv = (angle from the long side 0..1, 0 at the neck .. 1 at the rim); aQ = the same point in the leaf's own
  // flat plane (long side = +x, 1 = half the width), which is what the ink is laid in; aCut = the angles of the slivers.
  const NA = 40, NR = 24, W = NA + 1, R = width / 2, pos = [], uv = [], lf = [], lq = [], lc = [], idx = [];
  const ph = rng() * 6.28, leanR = rng() * 6.28, tear = rng(), seed = rng() * 50, cup = rng.range(0.1, 0.22);
  const lean = leanOpt ?? leanR, n = 3 + (Math.round(sweeps) % 3), d = 0.28 + droop * 1.15;
  const hash = (k) => { const v = Math.sin(k * 12.9898 + seed * 78.233) * 43758.5453; return v - Math.floor(v); };
  const cuts = [];                                                 // where two sweeps meet (radians from the long side); 99 = none
  for (let k = 0; k < 4; k++) cuts.push(!plain && k < 1 + (n % 2) ? -2.0 + (k + 0.2 + 0.6 * hash(k)) * (4.0 / (n - 1)) : 99);
  const lop = plain ? 1.9 : 1, sq = plain ? 0.55 + 0.75 * hash(31) : 1;     // a far leaf: a lopsided mass, squashed or long, no two alike
  const bite = (tear - 0.5) * 2.0;
  for (let i = 0; i <= NR; i++) for (let j = 0; j <= NA; j++) {
    const x = (j % NA) / NA, b = x * Math.PI * 2, a = lean + b, f = i / NR, c1 = 0.5 + 0.5 * Math.cos(b);
    let rim = 0.44 + 0.56 * Math.pow(c1, 0.7);
    rim *= 1 + lop * (0.17 * Math.sin(2 * b + ph) + 0.12 * Math.sin(3 * b + ph * 1.7)) + 0.04 * Math.sin(7 * b + ph * 2.3);
    if (plain) rim *= 1 / Math.sqrt(Math.pow(Math.cos(b), 2) + Math.pow(Math.sin(b) / sq, 2)) * (sq > 1 ? 1 / sq : 1);
    for (let k = 0; k < 4; k++) if (cuts[k] < 90) { const dd = angDiff(b, cuts[k] + 0.4 * (((Math.abs(cuts[k]) * 7.3) % 1) - 0.5)); rim *= 1 - (0.08 + 0.16 * hash(k + 20)) * Math.exp(-(dd * dd) / 0.012); }
    if (torn) { const dd = angDiff(b, bite); rim *= 1 - 0.55 * Math.exp(-(dd * dd) / 0.05); }
    const rho = f * rim, r = rho * R;
    const y = R * (cup * 0.5 * Math.sin(Math.min(rho, 1) * Math.PI * 0.9) - d * Math.pow(rho, 1.3) * (0.35 + 0.65 * c1) + 0.035 * rho * rho * Math.sin(5 * b + ph));
    pos.push(Math.cos(a) * r, y, Math.sin(a) * r); uv.push(j / NA, f); lf.push(id, seed, R);
    lq.push(Math.cos(b) * rho, Math.sin(b) * rho); lc.push(cuts[0], cuts[1], cuts[2], cuts[3]);
    if (i < NR && j < NA) { const q = i * W + j, q2 = q + W; idx.push(q, q2, q + 1, q + 1, q2, q2 + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aLeaf', new THREE.Float32BufferAttribute(lf, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(lq, 2));
  g.setAttribute('aCut', new THREE.Float32BufferAttribute(lc, 4)); g.setIndex(idx);
  return g;
}
function leafMaterialS(STYLE, count = 32, { deform = NO_DEFORM, uniforms = {}, darkest = false } = {}) {
  const state = []; for (let i = 0; i < count; i++) state.push(new THREE.Vector2(0, 0));
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: darkest ? THREE.MinEquation : THREE.AddEquation,
    blendSrc: darkest ? THREE.OneFactor : THREE.DstColorFactor, blendDst: darkest ? THREE.OneFactor : THREE.ZeroFactor,
    uniforms: { ...STYLE, ...uniforms, uLeaf: { value: state }, uAbs: { value: darkest ? 1 : 0 } },
    vertexShader: STYLE_GLSL + /* glsl */`
      attribute vec3 aAnim, aLeaf; attribute vec2 aQ; attribute vec4 aCut; uniform vec2 uLeaf[${count}];
      varying vec3 vP, vL; varying vec2 vUv, vSt, vQ; varying vec4 vCut;
      ${deform}
      void main(){ vec3 p = deform(position, aAnim); vP = position; vUv = uv; vL = aLeaf; vQ = aQ; vCut = aCut;
        vSt = uLeaf[int(clamp(aLeaf.x + 0.5, 0.0, ${count - 1}.0))];
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: STYLE_GLSL + STYLE_FRAG_GLSL + /* glsl */`
      uniform float uAbs; varying vec3 vP, vL; varying vec2 vUv, vSt, vQ; varying vec4 vCut;
      void main(){
        float f = vUv.y, seed = vL.y, wet = vSt.x, dried = vSt.y;
        vec2 q = vQ; float rho = length(q); vec2 dir = q / max(rho, 1e-3);
        float th = atan(q.y, abs(q.x) < 1e-5 ? 1e-5 : q.x);
        float px = max(length(fwidth(q)), 1e-5);                                // leaf units per pixel
        float near = 1.0 - smoothstep(0.012, 0.03, px);                         // 1: big enough on screen to show the brush
        float isWet = smoothstep(0.0, 0.3, wet);
        // the wet: a blot round a heart that sits off-centre, toward the hanging side; it stops dead at ONE tide line
        vec2 hc = vec2(0.27, 0.08 * sin(seed));
        float nb = vnoise(vec3(q * 2.3, seed)), nb2 = vnoise(vec3(q * 6.5, seed + 4.0));
        float dh = length((q - hc) * vec2(0.82, 1.0)) + 0.24 * (nb - 0.5) + 0.07 * (nb2 - 0.5) * near;
        float tide = wet * 0.64;
        float inside = 1.0 - smoothstep(tide - px, tide + px, dh);
        float past = clamp((dh - tide) / 0.42, 0.0, 1.0);
        // beyond it the brush ran dry: parallel streaks dragged out from the neck, bare paper between them, hard-edged
        vec2 sd = dir * 8.0; float sw = length(fwidth(sd)) + 2.0 * (1.0 - smoothstep(0.02, 0.1, rho));
        float s1 = vnoise(vec3(sd, rho * 1.1 + seed)), s2 = vnoise(vec3(dir * 4.0, rho * 0.7 + seed + 9.0));
        float streak = clamp((0.62 * s1 + 0.38 * s2 - 0.5) * 2.4 + 0.5, 0.0, 1.0);
        float ext = vnoise(vec3(dir * 2.4, seed + 5.0));                                 // some sweeps drag far, some stop short
        float dryS = smoothstep(0.56, 0.70, ext);                                      // only some sweeps ran dry: the rest end wet and hard
        float farL = step(wet, -0.1);                                                  // a leaf beyond reach: one pale mass, one tide line, one ragged dry side
        float dryW = mix(0.42, 1.0, dryS);                                             // every sweep drags a little before it stops; some run right out
        float side = smoothstep(-0.25, 0.75, cos(th - seed * 2.0));                    // (far) the side the brush left by
        float D = mix(mix(0.04 + 0.30 * rho * rho, 0.06 + 0.9 * side * smoothstep(0.3, 0.95, rho), farL), (0.05 + 0.8 * past * past) * dryW, isWet) * (1.0 - inside) + 0.3 * uDry * (1.0 - inside) * dryS;
        D = max(D, 0.92 * smoothstep(0.62, 1.0, f) * mix(dryW, side, farL));                 // and every sweep runs dry before the rim, wet or not
        float aa = clamp(sw * 0.45, 0.008, 0.07);
        float fine = smoothstep(0.45, 1.0, sw);
        float cov = mix(smoothstep(D - aa, D + aa, streak), step(D, 0.56 + 0.1 * (s2 - 0.5)), fine);     // too fine to see: one flat blot with a hard edge
        float e = mix(0.93 + 0.07 * s2 - 0.04 * s1, 1.0, fine);
        cov *= 1.0 - smoothstep(e - clamp(1.5 * fwidth(f), 0.0008, 0.012), e, f);                                                        // each sweep ends torn
        float mpp = length(fwidth(vP));                       // metres per pixel: each size of the paper's long fibres shows only while it is a sliver a few pixels wide
        float fth = 0.84 - 0.08 * smoothstep(0.25, 0.95, rho) - 0.05 * past;
        float w0 = smoothstep(0.045, 0.09, mpp), w1 = smoothstep(0.011, 0.022, mpp) * (1.0 - smoothstep(0.06, 0.11, mpp)), w2 = 1.0 - smoothstep(0.014, 0.028, mpp);
        float hole = max(max(step(fth + 0.5 * (1.0 - w0), fibreF(vP.xzy * 0.15)), step(fth + 0.5 * (1.0 - w1), fibreF(vP.xzy * 0.6 + 13.0))), step(fth + 0.5 * (1.0 - w2), fibreF(vP.xzy * 2.4 + 29.0)));
        cov *= 1.0 - hole * step(0.08, rho) * (1.0 - fine) * near * step(0.74, vnoise(vec3(q * 3.1, seed + 21.0)) + 0.3 * past);   // flecks of bare paper where fibres resisted the ink: in patches, not everywhere
        // FLYING WHITE: where the brush ran dry its hairs split and left long streaks of bare paper ALONG the sweep (out from the neck),
        // 0.1 to 0.4 m wide, metres long, more of them toward the end of the stroke. Keyed to the leaf's own plane; flat when too fine.
        float R = max(vL.z, 1.0);
        vec2 fq = dir * (1.5 * R); float fww = length(fwidth(fq)) + 3.0 * (1.0 - smoothstep(0.03, 0.12, rho));
        float fly = 0.6 * vnoise(vec3(fq, rho * R * 0.10 + seed * 3.0)) + 0.4 * vnoise(vec3(fq * 2.3 + 17.0, rho * R * 0.17 + seed));
        float endS = smoothstep(0.58, 0.98, f), deep = inside * (1.0 - smoothstep(0.55, 1.0, dh / max(tide, 0.05)));
        float fray = mix(0.22, 1.0, smoothstep(0.38, 0.62, ext));                     // only some sweeps ran right out: the rest of the rim stays a wet mass with a hard edge
        float amt = clamp(0.06 + 0.55 * endS * fray + 0.5 * past * isWet * mix(0.5, 1.0, fray) + 0.25 * (1.0 - isWet) * smoothstep(0.3, 0.8, rho) - 0.6 * deep, 0.0, 1.0);
        float fthr = mix(0.80, 0.47, amt), fa = clamp(fww * 0.5, 0.015, 0.2);
        float white = smoothstep(fthr - fa, fthr + fa, fly) * (1.0 - smoothstep(0.4, 0.95, fww)) * (1.0 - farL);
        cov *= 1.0 - white;
        // slivers of bare paper where two sweeps failed to meet: few, bent, unequal, opening toward the rim
        float ath = px / max(rho, 0.05);
        for (int k = 0; k < 4; k++) {
          float c = vCut[k], hk = fract(abs(c) * 7.3), bend = 0.5 * (hk - 0.5);
          float dth = abs(mod(th - c - bend * rho + 3.14159265, 6.2831853) - 3.14159265);
          float w = (0.012 + 0.05 * fract(hk * 5.7)) * smoothstep(0.22 + 0.3 * hk, 0.85, rho);
          float sl = smoothstep(w - ath, w + ath, dth);
          cov *= mix(1.0, sl, clamp(w * rho / (1.5 * px), 0.0, 1.0) * step(c, 90.0) * (1.0 - farL));
        }
        // tone: burnt heart, heavy body, ONE grey line where the wet stopped (broken, never a ring), the same ink dragged dry beyond
        float heart = tide * (0.46 + 0.3 * (nb2 - 0.5));
        // graded only INSIDE the sweep: black pooled where the brush began, the hairs of the brush dragging heavy and grey toward the tide line
        float hair = vnoise(vec3(dir * 19.0, rho * 1.2 + seed + 3.0)), pool = vnoise(vec3(q * 4.6, seed + 7.0));
        float out01 = clamp((dh - heart) / max(tide - heart, 0.02), 0.0, 1.0);
        float body = 0.68 - 0.26 * smoothstep(0.50, 0.66, hair) * smoothstep(0.15, 0.9, out01) * near
                   + 0.30 * smoothstep(0.63, 0.73, pool + 0.2 * (1.0 - out01) + 0.25 * (fibreF(vP * 1.3) - 0.47)) * (1.0 - smoothstep(0.45, 0.6, out01)) * near;       // pools of burnt ink that ran from the heart
        float fb = fibreF(vP * 1.3), grain = (fb - 0.47) * near;
        float hw = 0.025 * near;                                                          // near, the heart grades into the body through the paper's grain, never along a clean curve
        float load = mix(1.0 - 0.36 * smoothstep(0.70, 0.76, hair * 0.6 + 0.4 * nb2) * smoothstep(0.1, 0.3, rho) * near, body, smoothstep(heart - px - hw, heart + px + hw, dh + 0.2 * grain + 0.2 * (hair - 0.5) * near));   // the black runs out along the hairs of the brush
        // the tide line: where the wet front stopped the ink POOLED, a rim one step darker than the body, 0.3 to 0.6 m wide, broken
        float bw = (0.3 + 0.3 * s2) / R, arc = smoothstep(0.40, 0.52, vnoise(vec3(dir * 1.6, seed + 2.0)) + 0.3 * (s1 - 0.5));
        float rimVis = smoothstep(1.6, 3.2, bw / px);                                   // a band, never a hairline: too thin to draw, it is left out
        load = mix(load, 1.0, smoothstep(tide - bw - px, tide - bw * 0.6 + px, dh + 0.012 * grain + 0.03 * (hair - 0.5)) * arc * near * rimVis * (1.0 - 0.5 * dried));
        float dragged = 0.64 - 0.30 * smoothstep(0.35, 0.75, past + 0.5 * (hair - 0.5)) * near;   // beyond the tide the same ink dragged dry: heavy, then grey
        float farTide = (1.0 - smoothstep(0.03, 0.03 + 2.0 * px, abs(dh - 0.46))) * arc * step(px, 0.02);   // (far) one grey line where the wet once stopped
        load = mix(mix(mix(0.08, 0.30, farTide * farL), dragged, isWet), load, inside);
        load *= mix(1.0, 0.6, dried) * (1.0 - 0.3 * uDry);
        // the paper's fibre shows THROUGH the ink as fine lighter threads (one ink step lighter), only while a thread is a few pixels wide
        float thr1 = smoothstep(0.605, 0.66, fibreF(vP.xzy * 0.55 + 41.0)) * (1.0 - smoothstep(0.05, 0.10, mpp));
        float thr2 = smoothstep(0.62, 0.67, fibreF(vP.xzy * 1.5 + 7.0)) * (1.0 - smoothstep(0.018, 0.04, mpp));
        load -= 0.30 * max(thr1, thr2) * near * step(0.05, rho);
        vec3 ink = inkTone(load) * (1.0 + 0.3 * (fb - 0.45) * (1.0 - 0.6 * clamp(load, 0.0, 1.0)));
        vec3 soak = min(ink, uPaper);                                                     // uAbs 1: MIN blending, the ink itself; 0: multiply, ink over paper
        // while the leaf is still wet the ink creeps about a metre past the tide line into the bare paper, pale, along the fibres
        float bl = (dh - tide) * R;
        float bn = 0.6 * fibreF(vP.xzy * 0.5 + 3.0) + 0.4 * fibreF(vP.xzy * 1.6 + 8.0);     // it wicks along the fibres in fingers: a hard-edged pale stain, never a soft gradient
        float bleed = smoothstep(-0.05, 0.05, bn - 0.15 - 0.55 * bl) * step(0.0, bl) * isWet * (1.0 - dried) * near * (1.0 - smoothstep(e - 0.07, e - 0.02, f));
        vec3 pale = min(inkTone(0.08), uPaper);
        vec3 one = max(uPaper, vec3(1e-3));
        vec3 under = mix(vec3(1.0), mix(pale / one, pale, uAbs), 0.85 * bleed);
        gl_FragColor = vec4(mix(under, mix(soak / one, soak, uAbs), clamp(cov, 0.0, 1.0)), 1.0);
      }`,
  });
}

// the camera line of the brief in the hero's local space (world = local + WORLD_OFFSET), from the bottom of the drop on
export const WORLD_OFFSET = [36, 0, 332];
const FLY = [[-36, 76, -156], [-40, 54, -100], [-46, 64, -46], [-2, 70, 34], [40, 98, -2], [0, 130, -88], [-70, 172, -94], [-102, 198, -66], [-94, 218, -32], [-72, 240, -6], [-55, 245, 12], [-46.5, 245, 30], [-46.5, 245, 80]];

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = Math.max(0.6, Math.min(1, opts.detail ?? 1));
  const ink = opts.ink || makeInk(opts.palette || PALETTE);
  const { STYLE, shellMaterial, hullMaterial, lineMaterial, dabMaterial, makePaperDome, leafMaterial } = ink;
  const roll = rng() < 0.6 ? 'loaded' : rng() < 0.5 ? 'dry' : 'soaked';
  const brush = opts.brush || roll;
  const V = { soaked: brush === 'soaked', dry: brush === 'dry', flatHead: opts.fish ? opts.fish === 'flat' : rng.chance(0.35),
    twoLumps: opts.rock ? opts.rock === 'lumps' : rng.chance(0.3), bird: opts.bird ?? rng.pick(['mynah', 'mynah', 'quail', 'kingfisher']), keepOut: FLY, clear: 11 };
  STYLE.uDry.value = V.dry ? 0.8 : 0;
  const preview = opts.dome ?? true;                             // alone (the set-piece viewer) it brings its own sheet; a world passes dome: false
  const object = new THREE.Group(); object.name = 'pond-with-no-water-hero';
  let dome = null;
  if (preview) { dome = makePaperDome(2600); dome.renderOrder = -0.5; object.add(dome); }

  // ---- rock
  const rock = await buildRock(ctx, rng.fork('rock'), detail, V);
  const rockShell = new THREE.Mesh(rock.geo, shellMaterial({ wash: ROCK_WASH, uniforms: { uBlot: { value: rock.blots }, uSoak: { value: V.soaked ? 1 : 0 }, uAxis: { value: rock.top }, uFar: { value: 0.86 } } }));
  const rockHull = new THREE.Mesh(rock.geo, hullMaterial({ width: 2.2, load: 1.0, gaps: 0.39, gapScale: 0.013, floorPx: 3.2, minLoad: 0.82, body: 0.93,
    gapGLSL: 'float lowR = 1.0 - smoothstep(0.33, 0.45, vUv.y); float g = mix(fbm3(vP * uGapS + 17.0), fbm3(vP * vec3(0.06, 0.03, 0.06) + 3.0), lowR), G = mix(uGaps, 0.3, lowR);' }));
  object.add(rockShell, rockHull);
  await ctx.yield();
  const rr = rng.fork('creases'), creases = [];
  const lay = (t0, t1, a0, a1, n, wob) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const f = i / n, s = rock.at(t0 + (t1 - t0) * f, a0 + (a1 - a0) * f + wob * Math.sin(f * 7 + a0)); pts.push(s.p.addScaledVector(s.n, 0.5)); }
    creases.push(strokeGeometry(pts, 1.0, { seed: rr() * 9, step: 2.5 }));
  };
  lay(0.03, 0.44, rock.aSW + 2.4 + rr.range(-0.4, 0.4), rock.aSW + 2.9, 10, 0.12);       // up the stem
  lay(0.05, 0.36, rock.aSW - 1.0, rock.aSW - 0.5 + rr.range(-0.3, 0.3), 9, 0.1);
  lay(0.40, 0.57, rock.aSW + 0.9, rock.aSW + 0.45, 8, 0.1);                               // out along the underside
  lay(0.58, 0.80, rock.aSW - 0.9 + rr.range(-0.3, 0.3), rock.aSW - 1.5, 10, 0.15);        // across the faces
  lay(0.62, 0.84, rock.aN + 1.0, rock.aN + 1.7 + rr.range(-0.3, 0.3), 10, 0.15);
  lay(0.80, 0.86, rock.aN - 1.5, rock.aN + 0.3, 12, 0.05);                                // round the shoulder
  lay(0.74, 0.93, rock.aN + 1.9, rock.aN + 1.3, 10, 0.12);                                // up the west shoulder toward the horn
  lay(0.70, 0.86, rock.aN + 2.5, rock.aN + 2.2, 8, 0.1);
  object.add(new THREE.Mesh(mergeGeometries(creases), lineMaterial({ load: 1.15, dryLen: 26 })));
  await ctx.yield();
  const dots = [], q = new THREE.Quaternion(), m4 = new THREE.Matrix4(), zAx = new THREE.Vector3(0, 0, 1), one = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < 12; i++) {                                                           // moss dots as big as carts, in threes, on the shoulder
    const c = Math.floor(i / 3), s = rock.at(0.875 + 0.02 * c + rr.range(-0.012, 0.012), rock.aN - 0.7 + c * 0.42 + rr.range(-0.08, 0.08) + (i % 3) * 0.07);
    const g = dabGeometry(rr, rr.range(1.6, 3.4), 14, 0.3);
    g.applyMatrix4(m4.compose(s.p.addScaledVector(s.n, 0.45), q.setFromUnitVectors(zAx, s.n.normalize()), one)); dots.push(g);
  }
  for (let i = 0; i < 7; i++) {                                                            // and up the horn's west flank, under the bird
    let best = null, bd = 1e9; const want = new THREE.Vector3(rock.horn.x - 4 - 1.6 * i + rr.range(-1.5, 1.5), rock.horn.y - 5 - 4.2 * i, rock.horn.z + rr.range(-7, 7));
    for (let a = 0; a < 40; a++) for (let t = 0; t < 26; t++) { const s = rock.at(0.66 + t * 0.01, rock.aN - 0.7 + a * 0.035), d2 = s.p.distanceToSquared(want); if (d2 < bd) { bd = d2; best = s; } }
    const g = dabGeometry(rr, rr.range(0.9, 1.9), 12, 0.3);
    g.applyMatrix4(m4.compose(best.p.addScaledVector(best.n.normalize(), 0.4), q.setFromUnitVectors(zAx, best.n), one)); dots.push(g);
    if (i % 2 === 1) await ctx.yield();
  }
  for (let i = 0; i < 9; i++) {                                                            // and in threes on the west shoulder
    const c = Math.floor(i / 3), s = rock.at(0.83 + 0.03 * c + rr.range(-0.012, 0.012), rock.aN + 1.15 + c * 0.38 + rr.range(-0.06, 0.06) + (i % 3) * 0.06);
    const g = dabGeometry(rr, rr.range(1.5, 3.0), 14, 0.3);
    g.applyMatrix4(m4.compose(s.p.addScaledVector(s.n, 0.45), q.setFromUnitVectors(zAx, s.n.normalize()), one)); dots.push(g);
  }
  const dab = dabMaterial(1.3);
  object.add(new THREE.Mesh(mergeGeometries(dots), dab));
  await ctx.yield();

  // ---- fish
  const fr = rng.fork('fish'), F = buildFish(fr, detail, V), uTail = { value: 0 };
  await ctx.yield();
  const fish = new THREE.Group(); fish.position.set(-28, 62, -42); fish.rotation.set(0, -Math.atan2(0.6, 0.8), -0.066);
  const fu = { uTail };
  fish.add(new THREE.Mesh(F.geo, shellMaterial({ wash: FISH_WASH, deform: FISH_DEFORM, uniforms: fu })));
  await ctx.yield();
  fish.add(new THREE.Mesh(F.geo, hullMaterial({ width: 0.45, load: 0.92, gaps: 0.26, gapScale: 0.1, deform: FISH_DEFORM, uniforms: fu, keep: 'if (vUv.x > 0.87) discard;' })));
  fish.add(new THREE.Mesh(F.fins, shellMaterial({ wash: FIN_WASH, deform: FISH_DEFORM, uniforms: fu, side: THREE.DoubleSide })));
  const fl = [], out = (s, th, k = 1.035) => { const v = F.at(s, th); v.y *= k; v.z *= k; return v; };
  const FL = (pts, lift) => fl.push(strokeGeometry(pts, 0.225, { seed: fr() * 9, step: 0.14, radial: 8, anim: () => [0, 0, lift] }));
  const nose = out(0, 1.25).add(out(0, -1.25)).multiplyScalar(0.5); nose.x -= 0.45;
  FL([out(0.115, 0.55), out(0.06, 0.9), out(0.022, 1.14), nose, out(0.022, -1.14), out(0.06, -0.9), out(0.115, -0.55)], 0);   // the mouth, turned down
  await ctx.yield();
  for (const sg of [1, -1]) { FL([out(0.265, sg * 2.5), out(0.3, sg * 2.05), out(0.312, sg * 1.5), out(0.295, sg * 1.0), out(0.26, sg * 0.66)], 0.4); await ctx.yield(); }   // gill
  const fishLine = lineMaterial({ load: 0.9, dryLen: 4, deform: FISH_DEFORM, uniforms: fu });
  fish.add(new THREE.Mesh(mergeGeometries(fl), fishLine));
  await ctx.yield();
  const eyeMats = { paper: shellMaterial(), ring: lineMaterial({ load: 1, dryLen: 3.2 }), dab };
  await ctx.yield();
  const eyes = [];
  for (const sg of [1, -1]) {
    const e = makeEye(fr, 3.2, eyeMats), p = F.at(0.15, sg * 2.0);
    const n = F.at(0.19, sg * 2.0).sub(F.at(0.11, sg * 2.0)).cross(F.at(0.15, sg * 2.25).sub(F.at(0.15, sg * 1.75))).normalize();
    if (n.z * sg < 0) n.negate();
    n.lerp(new THREE.Vector3(0, 0.1, sg), 0.6).normalize();
    e.group.position.copy(p).addScaledVector(n, 0.5); e.group.quaternion.setFromRotationMatrix(m4.lookAt(n, new THREE.Vector3(), new THREE.Vector3(0, 1, 0)));
    fish.add(e.group); eyes.push(e);
  }
  object.add(fish);
  await ctx.yield();

  // ---- bird on the horn
  const br = rng.fork('bird'), Bd = buildBird(br, V.bird), bird = new THREE.Group();
  await ctx.yield();
  const BS = 1.3; bird.scale.setScalar(BS);
  bird.position.copy(rock.horn).add(new THREE.Vector3(0, -0.3, 0)); bird.rotation.y = -Math.PI / 2 + br.range(-0.15, 0.15);
  bird.add(new THREE.Mesh(Bd.geo, shellMaterial({ wash: BIRD_WASH, deform: BIRD_DEFORM, uniforms: { uFib: { value: 0 } } })));
  await ctx.yield();
  bird.add(new THREE.Mesh(Bd.geo, hullMaterial({ width: 0.45, load: 1, gaps: 0.2, gapScale: 0.12, deform: BIRD_DEFORM })));
  const birdLine = lineMaterial({ load: 0.95, dryLen: 2.5 });
  bird.add(new THREE.Mesh(Bd.lines, birdLine), new THREE.Mesh(Bd.beak, dab));
  const hipY = 3.6, legs = [Bd.legA, Bd.legB].map((g) => { g.translate(0, -hipY, 0); const m = new THREE.Mesh(g, birdLine); m.position.y = hipY; bird.add(m); return m; });
  legs[1].scale.set(1, 0.12, 1);
  await ctx.yield();
  const birdEyes = [], bars = [];
  for (const sg of [1, -1]) {
    const e = makeEye(br, 1.75, eyeMats); e.group.position.set(Bd.eyeAt.x, Bd.eyeAt.y, sg * Bd.eyeZ); e.group.rotation.set(0, sg > 0 ? 0.5 : Math.PI - 0.5, 0);
    e.group.scale.setScalar(0.001); bird.add(e.group); birdEyes.push(e);
    const bar = new THREE.Mesh(strokeGeometry([new THREE.Vector3(-0.62, 0.08, 0), new THREE.Vector3(0, -0.07, 0), new THREE.Vector3(0.62, 0.04, 0)], 0.17, { seed: br() * 9, step: 0.3 }), birdLine);
    bar.position.copy(e.group.position); bar.position.z += sg * 0.25; bar.rotation.copy(e.group.rotation); bird.add(bar); bars.push(bar);
  }
  object.add(bird);
  await ctx.yield();

  // ---- anchors, progress, update
  object.updateMatrixWorld(true);
  const eyeWorld = eyes.map((e) => object.worldToLocal(e.group.getWorldPosition(new THREE.Vector3())));
  const anchors = {
    worldOffset: WORLD_OFFSET.slice(),                         // add to every local point below to get the brief's world coordinates
    flyThrough: FLY.map((p) => p.slice()),                     // bottom of the drop .. the seal; the rock is carved 11 m clear of these straight segments
    portalSeat: { position: [-46.5, 245, 80], facing: [0, 0, -1] },
    fishSnout: [-40, 63, -51], fishTail: [-16, 61, -33], fishCentre: [-28, 62, -42],
    fishEyeNW: eyeWorld[1].toArray(), fishEyeSE: eyeWorld[0].toArray(),   // NW is the one passed 8 m to starboard at u 0.36
    horn: rock.horn.toArray(), bird: [rock.horn.x, rock.horn.y + 6, rock.horn.z], birdEye: [rock.horn.x - 2.5, rock.horn.y + 9.8, rock.horn.z + 2.7],
    minnowRest: [10, 122, -66],                                // where the seven hang still under the bulge (world 46,122,266)
    viewpoints: { reveal: [-40, 54, -100], eyePass: [-46, 64, -46], stem: [-22, 67, -3], exit: [-45, 228, 40] },
    variant: { brush, fish: V.flatHead ? 'flat' : 'hump', rock: V.twoLumps ? 'lumps' : 'anvil', bird: V.bird },
  };
  const cam = new THREE.Vector3(), tmp = new THREE.Vector3(), size = new THREE.Vector2();
  const st = { u: -1, wake: 0, leg: 0 };
  const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  function setProgress(u) {
    st.u = u;
    const x = (u - 0.355) / 0.035;
    uTail.value = x > 0 && x < 1 ? Math.sin(x * Math.PI * 2) * (1 - x) * 1.1 : 0;       // the one flick, at u 0.37
    st.wake = ease((u - 0.945) / 0.012); st.leg = ease((u - 0.955) / 0.02);              // the bird opens one eye, then changes legs
    for (let i = 0; i < 2; i++) { birdEyes[i].group.scale.setScalar(Math.max(0.001, st.wake)); bars[i].scale.setScalar(Math.max(0.001, 1 - st.wake)); }
    legs[0].scale.y = 1 - 0.88 * st.leg; legs[1].scale.y = 0.12 + 0.88 * st.leg;
    bird.position.x = rock.horn.x; bird.position.z = rock.horn.z + 1.0 * st.leg * Math.cos(bird.rotation.y);
  }
  setProgress(0);
  if (preview && opts.focus === 'leaf') {              // viewer only: two leaves to judge the sweep (the world builds its own thirty)
    const lr = rng.fork('leafdemo'), lm = leafMaterial(4);
    const g0 = leafGeometry(lr, { width: 44, id: 0, sweeps: 7 }), g1 = leafGeometry(lr, { width: 30, id: 1, sweeps: 6, torn: true });
    g0.translate(-52, 112, -70); g1.translate(-10, 100, -78);
    lm.uniforms.uLeaf.value[0].set(1, 0); lm.uniforms.uLeaf.value[1].set(0.45, 0);
    const lmesh = new THREE.Mesh(mergeGeometries([g0, g1]), lm); lmesh.renderOrder = 5; object.add(lmesh);
  }
  // viewer only: &focus=fish|eye|bird|foot orbits that part closely (the _part viewer cannot otherwise come near)
  const focus = preview ? opts.focus ?? null : null;
  const FOC = { fish: [9, 14, anchors.fishCentre], eye: [3, 5, anchors.fishEyeNW], bird: [5, 10, anchors.bird], foot: [14, 40, [0, 60, 0]], top: [30, 30, [-30, 200, 40]], leaf: [26, 30, [-30, 96, -66]], reveal: [20, 30, anchors.fishCentre] }[focus];
  if (focus === 'bird' || focus === 'top') setProgress(0.97);
  return {
    object, radius: FOC ? FOC[0] : 78, height: FOC ? FOC[1] : 222, center: FOC ? new THREE.Vector3(...FOC[2]) : new THREE.Vector3(-18, 112, -6), anchors, ground: false, groundY: 0,
    uniforms: STYLE, ink, setProgress, parts: { fish, bird, rockShell, rockHull, eyes, birdEyes },
    update(dt, time, camera) {
      STYLE.uTime.value = time;
      if (ctx.renderer) STYLE.uViewH.value = ctx.renderer.getDrawingBufferSize(size).y;
      camera.getWorldPosition(cam);
      if (dome) dome.position.copy(object.worldToLocal(tmp.copy(cam)));
      fish.position.y = 62 + 0.55 * Math.sin(time * 0.33);                               // it hangs: not swimming, not falling
      fish.rotation.x = 0.03 * Math.sin(time * 0.27 + 1.0);
      const br = Math.sin(time * 1.15), br2 = Math.max(0, br);                           // the bird breathes: slow in, slower out
      bird.scale.set(BS * (1 + 0.022 * br), BS * (1 + 0.04 * br2 + 0.012 * br), BS * (1 + 0.035 * br));
      bird.rotation.z = 0.018 * Math.sin(time * 1.15 - 0.9);
      for (const e of eyes) e.look(cam, dt);
      if (st.wake > 0.5) for (const e of birdEyes) e.look(cam, dt);
    },
    dispose() {},
  };
}

// ---------------------------------------------------------------------------------------------
// THE REST OF THE CAST, for the world to place along the course (same parts, same hand as the hero's):
//   makeFish(ink, rng, { flat, detail, eyeMats })  a whole fish 30 units long, snout at -X (scale the group); .eyes[].look()
//   makeBird(ink, rng, kind, { eyeMats, awake })   a hunched bird about 14 units tall facing +X on one leg; asleep = eye as a bar
//   makeBoulder(ink, rng, { height, side })        a small rock top-heavy on a foot too small, black underside, open contour
// ---------------------------------------------------------------------------------------------
export function makeFish(ink, rng, { flat = false, detail = 1, eyeMats } = {}) {
  const F = buildFish(rng, detail, { flatHead: flat }), uTail = { value: 0 }, fu = { uTail }, group = new THREE.Group(), m4 = new THREE.Matrix4();
  group.add(new THREE.Mesh(F.geo, ink.shellMaterial({ wash: FISH_WASH, deform: FISH_DEFORM, uniforms: fu })));
  group.add(new THREE.Mesh(F.geo, ink.hullMaterial({ width: 0.45, load: 0.92, gaps: 0.26, gapScale: 0.1, deform: FISH_DEFORM, uniforms: fu, keep: 'if (vUv.x > 0.87) discard;' })));
  group.add(new THREE.Mesh(F.fins, ink.shellMaterial({ wash: FIN_WASH, deform: FISH_DEFORM, uniforms: fu, side: THREE.DoubleSide })));
  const fl = [], out = (s, th, k = 1.035) => { const v = F.at(s, th); v.y *= k; v.z *= k; return v; };
  const FL = (pts, lift) => fl.push(strokeGeometry(pts, 0.225, { seed: rng() * 9, step: 0.14, radial: 8, anim: () => [0, 0, lift] }));
  const nose = out(0, 1.25).add(out(0, -1.25)).multiplyScalar(0.5); nose.x -= 0.45;
  FL([out(0.115, 0.55), out(0.06, 0.9), out(0.022, 1.14), nose, out(0.022, -1.14), out(0.06, -0.9), out(0.115, -0.55)], 0);
  for (const sg of [1, -1]) FL([out(0.265, sg * 2.5), out(0.3, sg * 2.05), out(0.312, sg * 1.5), out(0.295, sg * 1.0), out(0.26, sg * 0.66)], 0.4);
  group.add(new THREE.Mesh(mergeGeometries(fl), ink.lineMaterial({ load: 0.9, dryLen: 4, deform: FISH_DEFORM, uniforms: fu })));
  const eyes = [];
  for (const sg of [1, -1]) {
    const e = makeEye(rng, 3.2, eyeMats), p = F.at(0.15, sg * 2.0);
    const n = F.at(0.19, sg * 2.0).sub(F.at(0.11, sg * 2.0)).cross(F.at(0.15, sg * 2.25).sub(F.at(0.15, sg * 1.75))).normalize();
    if (n.z * sg < 0) n.negate();
    n.lerp(new THREE.Vector3(0, 0.1, sg), 0.6).normalize();
    e.group.position.copy(p).addScaledVector(n, 0.5); e.group.quaternion.setFromRotationMatrix(m4.lookAt(n, new THREE.Vector3(), new THREE.Vector3(0, 1, 0)));
    group.add(e.group); eyes.push(e);
  }
  return { group, eyes, uTail };
}

export function makeBird(ink, rng, kind = 'quail', { eyeMats, awake = false } = {}) {
  const Bd = buildBird(rng, kind), group = new THREE.Group(), line = ink.lineMaterial({ load: 0.95, dryLen: 2.5 });
  group.add(new THREE.Mesh(Bd.geo, ink.shellMaterial({ wash: BIRD_WASH, deform: BIRD_DEFORM, uniforms: { uFib: { value: 0 } } })));
  group.add(new THREE.Mesh(Bd.geo, ink.hullMaterial({ width: 0.45, load: 1, gaps: 0.2, gapScale: 0.12, deform: BIRD_DEFORM })));
  const lines = [Bd.lines, Bd.legA], eyes = [];
  for (const sg of [1, -1]) {
    if (awake) {
      const e = makeEye(rng, 1.75, eyeMats); e.group.position.set(Bd.eyeAt.x, Bd.eyeAt.y, sg * Bd.eyeZ); e.group.rotation.set(0, sg > 0 ? 0.5 : Math.PI - 0.5, 0);
      group.add(e.group); eyes.push(e);
    } else {
      const bar = strokeGeometry([new THREE.Vector3(-0.62, 0.08, 0), new THREE.Vector3(0, -0.07, 0), new THREE.Vector3(0.62, 0.04, 0)], 0.17, { seed: rng() * 9, step: 0.3 });
      bar.rotateY(sg > 0 ? 0.5 : Math.PI - 0.5); bar.translate(Bd.eyeAt.x, Bd.eyeAt.y, sg * (Bd.eyeZ + 0.25)); lines.push(bar);
    }
  }
  group.add(new THREE.Mesh(mergeGeometries(lines), line), new THREE.Mesh(Bd.beak, eyeMats.dab));
  return { group, eyes };
}

const BOULDER_WASH = /* glsl */`
uniform float uSide;
vec2 wash(vec3 p, vec3 n, vec2 uv){
  float nz = fbm3(p * 0.09 + 2.0), side = 0.5 + 0.5 * cos(uv.x * 6.2831853 - uSide);
  float m = min(uv.y - 0.34 + (nz - 0.5) * 0.2, 0.56 + 0.2 * side + (nz - 0.5) * 0.22 - uv.y);        // the underside, heaviest on one side
  float cov = smoothstep(0.0, 0.012, m), load = mix(0.36, 1.3, smoothstep(0.035, 0.045, m));          // black, and ONE grey tide line
  cov *= smoothstep(0.17, 0.2, vnoise(p * vec3(0.9, 0.12, 0.9) + 31.0) + 0.5 * load);                 // slivers the sweep left
  return vec2(cov, load);
}`;
export function makeBoulder(ink, rng, { height = 30, side = 0 } = {}) {
  const NA = 44, NT = 36, W = NA + 1, H = height, pos = new Float32Array(W * (NT + 1) * 3), uv = new Float32Array(W * (NT + 1) * 2);
  const P = [[0, 0], [0.07, 0.01], [0.06, 0.12], [0.08, 0.3], [0.2, 0.46], [0.4, 0.58], [0.46, 0.74], [0.4, 0.88], [0.24, 0.97], [0, 1]];
  const ph = rng() * 6.28, ph2 = rng() * 6.28, lx = rng.range(-0.22, 0.22), lz = rng.range(-0.22, 0.22), m = P.length - 1;
  for (let i = 0; i <= NT; i++) for (let j = 0; j <= NA; j++) {
    const a = (j % NA) / NA * Math.PI * 2, tt = (i / NT) * m, s = Math.min(m - 1, Math.floor(tt)), f = tt - s, q = (k) => P[Math.max(0, Math.min(m, k))];
    let r = Math.max(0, cr(q(s - 1)[0], q(s)[0], q(s + 1)[0], q(s + 2)[0], f)) * H, y = cr(q(s - 1)[1], q(s)[1], q(s + 1)[1], q(s + 2)[1], f) * H;
    if (i === 0 || i === NT) r = 0;
    const big = Math.min(1, Math.max(0, (y / H - 0.3) / 0.25));
    r *= 1 + big * (0.24 * Math.sin(a * 2 + ph) + 0.13 * Math.sin(a * 3 + ph2 + y * 0.2) + 0.07 * Math.sin(a * 5 + y * 0.35 + ph));
    y += big * H * 0.05 * Math.sin(a * 2 + ph2);
    const k = (i * W + j) * 3; pos[k] = Math.cos(a) * r + lx * H * big; pos[k + 1] = y; pos[k + 2] = Math.sin(a) * r + lz * H * big;
    uv[(i * W + j) * 2] = j / NA; uv[(i * W + j) * 2 + 1] = i / NT;
  }
  const idx = [];
  for (let i = 0; i < NT; i++) for (let j = 0; j < NA; j++) { const a = i * W + j, b = a + W; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  const nor = g.attributes.normal.array;
  for (let i = 0; i <= NT; i++) { const a = (i * W) * 3, b = (i * W + NA) * 3; for (let c = 0; c < 3; c++) { const v = (nor[a + c] + nor[b + c]) * 0.5; nor[a + c] = v; nor[b + c] = v; } }
  for (let j = 0; j <= NA; j++) { nor.set([0, -1, 0], j * 3); nor.set([0, 1, 0], (NT * W + j) * 3); }
  const group = new THREE.Group();
  group.add(new THREE.Mesh(g, ink.shellMaterial({ wash: BOULDER_WASH, uniforms: { uSide: { value: side }, uFar: { value: 0.86 } } })));
  group.add(new THREE.Mesh(g, ink.hullMaterial({ width: 0.75, load: 1, gaps: 0.34, gapScale: 0.07, floorPx: 2.6, minLoad: 0.82, body: 0.93 })));
  let hi = 0; for (let q = 1; q < pos.length; q += 3) if (pos[q] > pos[hi * 3 + 1]) hi = (q - 1) / 3;
  const at = (t, a) => { const j = Math.round((((a / (Math.PI * 2)) % 1 + 1) % 1) * NA) % NA, i = Math.max(0, Math.min(NT, Math.round(t * NT))), q = (i * W + j) * 3; return { p: new THREE.Vector3(pos[q], pos[q + 1], pos[q + 2]), n: new THREE.Vector3(nor[q], nor[q + 1], nor[q + 2]).normalize() }; };
  return { group, top: new THREE.Vector3(pos[hi * 3], pos[hi * 3 + 1], pos[hi * 3 + 2]), at };
}
