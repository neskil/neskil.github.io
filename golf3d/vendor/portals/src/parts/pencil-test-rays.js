// THE ARCADE OF LEAPS: hero set piece of "pencil-test-rays", and the home of that world's whole style.
// An animator's pencil test: 33 arches across a 17 m lane. Each arch is THE PLAN of a leap (its red arc of action, the
// spacing ticks, twelve blue ovals for the drawings not yet made) and one boldly shaded devil ray leaps it, rubbing out
// each oval as it fills it. Nothing is held behind the ray. Everything is ribbons, paper hulls and hatch in unlit
// ShaderMaterials; nothing is lit or blended.
//
// SIZE / PLACEMENT (local space): the lane runs along -Z from z = +200 to z = -200 (the piece's front faces +Z, the camera
//   travels toward -Z, +X is its right), water at y 0, feet of the arches at x = +-8.5, apexes 8-11 m. Arch i stands at
//   z = 200 - (6 + 12 i). Returned radius (40) and center are framing hints for the orbiting viewer; the true extent is
//   17 x 11 x 400 m (anchors.laneStart / laneEnd). ground: false (it brings its own paper sea unless opts.sea === false).
// OPTS: palette [paper, graphite, smudge, pale ghost, non-photo blue, red] (hex); detail 0.6-1 (below 0.8 six ovals to a
//   plan instead of twelve); style (a makeStyle() object to share: then YOU call style.update(time, renderer) each frame);
//   exposure (your post.exposure, default 1); stage [cleanInside, blueBeyond, layMetres] default [70, 220, 7.2];
//   sea: false / sky: false to leave out the paper sea disc (r 1500, blue 10 m grid) and the bare paper sky sphere;
//   preview: true halves every value (for a viewer that cannot switch bloom off: paper then stays under the bloom
//   threshold; default false, colours exact); previewS: metres to shift the lane clock by; somersault: true makes every
//   leap a somersault (the manta reel); shadowLen: how far the hatch shadows fall per metre of height (0.45).
// CLOCK: everything is a function of s = metres down the lane (0 at z = +200). By default update() takes s from the camera's
//   own position projected on the lane, so every event coincides with the eye wherever the world's path puts it (and runs
//   in real time at the brief's 18 m/s). hero.setProgress(s) overrides (null hands it back). Relative to the moment the eye
//   passes an arch (seconds = metres / 18): the arc of action is pencilled at -11.0 (TARC; arcs -2..8 fourteen seconds
//   sooner, so the colonnade stands at the first glance), then its 12 spacing ticks; the blue ovals of the plan are set
//   along it one after another from -7.6; the ray takes off uT2[i] seconds before the eye passes (opts.takeoff = { arch:
//   seconds } overrides; three seconds in the air, 36 drawings on twos). By default one arch in four (i % 4 = 0) is leapt
//   4.6 s ahead, so its ray lands 29 m in front of the eye and its crown splash opens at the foot in view; the others
//   (i % 4 = 2) only 2.0 s ahead: the ray rises as an open kite 20 m in front of us and goes over the top as we pass.
//   As it goes the arc pales behind it and every oval it fills is rubbed out; two blue kites stand on the next two ovals
//   (the drawings about to be made). When it has landed the arc is rubbed out too: NOTHING IS HELD, only the fading rings
//   of the splash. A pool of 14 arches is recycled down the lane (22 m behind the eye to 146 m ahead). Only every other
//   arch (the even ones) is leapt as the eye comes by; the odd ones and the last three (28-30) stay bare plan. Far ahead
//   of the eye arches -2..8 are leapt again and again, every five seconds, each time over a plan set out afresh (gLoop).
//   THE PLAN STOPS AT THE RAY'S OUTLINE: arcs, ticks, ovals and blue kites are drawn first and write no depth; bodies
//   (paper hull, tone, bold line) are drawn after them, so no guide line ever crosses a ray. Plans within ~8 m of the eye
//   pale away to paper (no line sweeps through the lens).
//   ARCHES -2 and -1 stand before the lane proper, the last is arch 30 (33 in all; the lane's last 34 m are open water before
//   the page). THE RAY is BODIED: an opaque paper hull with a smudged back, a bold thick-and-thin graphite line (spine,
//   creases, horns, whip tail) and a hatch shadow on the water, so nothing further off shows through it. By distance it
//   is an earlier stage of the same drawing (stageOf): clean inside stage[0], a rough scribble over its blue oval beyond.
//   Variety: arches up to 18 are leapt from the left (landing on the side the world's course keeps to), the rest from the
//   right; arches 9-13 lean; arches 20-22 are drawn larger (rays 1.3x, arc 1.14x wider).
//   hero.flipTest(t) runs the rare flip test (t = seconds since it began, negative = off): two runs of 1.7 s in which,
//   on each bare plan ahead of the eye (the odd arches, 20 to 118 m), one bold bodied key drawing stands, two keys further
//   on from arch to arch (so paper stands between them), the nearest arch showing two (one half way round from the other);
//   all step on at twelve a second: one ray caught in successive drawings. A key is a held pose: it does not flap.
//   Free leaps (makeLeapPool): o.flat may be a number (0.25: a banking ray) and o.dark -1 (the white belly whichever side
//   faces us: hatch, gill slits and two remoras).
//   AT THE WATER a ray is a slim dart: its wings drawn in to a third (gSlim), a lighter line, no wing creases or ribs, a
//   strip of tone down the spine and paper either side. The plan's blue beads stand all twelve on the arches within 38 m,
//   every fourth to 66 m; beyond that an arch is its arc and ticks only. Lines of a ray's back finer than the grain (far
//   off, or a wing seen edge-on) are left out.
//   BACK_GLSL (exported) is the drawing of a ray's back used by every bodied ray: tone along the sweep of the wings, light
//   on the leading edge, pressure along the spine, the spine, wing ribs and eyes in line. toSceneColor() is toScene() in JS.
// ANCHORS (local): axis; laneStart, laneEnd, footX; flyThrough (10 points: run-in, lane at y 2, tip-up, 20 degree climb;
//   above the water all the way); portalSeat { position, facing, radius 7, tiltDeg 20 } for the round peg hole;
//   slots (the two side peg slots); viewpoints { axis, under, side }; arches [{ z, s, from, somersault }]; timing.
//   (The world now stands its far margin askew to the lane and builds the page, the peg hole and the climb itself; the
//   flyThrough / portalSeat / slots anchors remain as the straight-on layout for anyone using the piece alone.)
// COST: about 100k triangles (mostly collapsed off-screen when not in use), 9 draw calls (7 without sea and sky), no lights,
//   no textures, build about 60 ms.
// EXPECTS AROUND IT: bare paper everywhere (post bloom 0, saturation and contrast 1), the rest of the sea drawn with
//   style.seaMaterial(), a ruled horizon, and the lifted page margin with the peg hole at anchors.portalSeat.
//
// STYLE EXPORTS (shade the whole world with these so the hero is not pasted in):
//   PALETTE, LANE                  the six pencils/paper and the lane's numbers.
//   makeStyle(palette, {exposure, stage}) -> style with shared style.uniforms (uPaper uGraphite uSmudge uPale uBlue uRed, uRes,
//     uTime, uStage) and:
//       style.GLSL          toScene() (exact colour: display colour -> scene value through the engine's ACES), hashes, value
//                           noise, clock12()/clock6() (stepped clocks), grainAt() (world-anchored pencil grain), hatchPhase()/
//                           hatchCov() (diagonal hatch, flat average when finer than 3 px), stageOf(dist) (0 clean 1 rough 2 blue).
//       style.RIBBON_GLSL   ribbon(P, Q, side, pressure, weight, out px): camera-facing ribbon, 2 cm at 8 m, floor 1.6 px;
//                           boil(): the wander of under half a line width on a stepped clock.
//       style.lineMaterial(vertexShader?, extraUniforms?)   any line; default vertex shader draws ribbonGeometry() strokes
//                           (held, boiling at 6). A custom one declares varyings vW, vCol, vUVK (u, v, strength), vPx.
//       style.paperMaterial()  hull in exact paper colour (occludes); style.toneMaterial(0 hatch | 1 smudge) for flat quads;
//       style.seaMaterial(cell) the ruled blue grid; style.skyMaterial() bare paper; style.update(time, renderer); dispose().
//   ribbonGeometry(strokes)        static strokes [{ pts, pencil 0 graphite 1 blue 2 red 3 pale 4 smudge, press, taper, seed }].
//   makeLeapPool(style, hero.rayUniforms, o)   free leaps on the open sea drawn by the Arcade's own shaders (#define SEA):
//                           placed by instance attributes in a window that wraps round the eye, on a clock of their own.
// Rules kept: colours are opaque mixes toward paper (never alpha), values step (never fade), thin marks never go under
// 1.6 px, the living step at 12 a second and held lines boil at 6, the camera alone is smooth.
import * as THREE from 'three';

export const PALETTE = ['#F4EEDC', '#333335', '#A9A7A1', '#D4D0C4', '#9FD3EA', '#D9472F'];
export const LANE = { length: 400, pitch: 12, count: 33, half: 8.5, speed: 18, zStart: 200 };

// ---------------------------------------------------------------------------------------------------------
// EXACT COLOUR: the engine shows  sRGB(grade(ACES(scene * exposure / 0.6))).  toScene() is the inverse of the
// ACES part, so a flat display colour D (linear-sRGB components of the hex) lands on its hex.
// ---------------------------------------------------------------------------------------------------------
function toneGLSL(exposure) {
  const inv = (e) => new THREE.Matrix3().fromArray(e).invert().elements.map((v) => v.toFixed(6)).join(',');
  const inI = inv([0.59719, 0.076, 0.0284, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777]);
  const outI = inv([1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602]);
  return /* glsl */`
  vec3 toScene(vec3 D){
    vec3 y = clamp(mat3(${outI})*clamp(D, 0., 0.95), 0.0004, 0.97);
    vec3 A = 0.983729*y - 1., B = 0.432951*y - 0.0245786, Cc = 0.238081*y + 0.000090537;
    vec3 v = (-B - sqrt(max(B*B - 4.*A*Cc, 0.)))/(2.*A);
    return max(mat3(${inI})*v, 0.)*${(0.6 / exposure).toFixed(5)};
  }`;
}

/** toSceneColor(color, exposure): the same inverse in JS, for the few colours a world hands to the engine (clamped to 0..1). */
export function toSceneColor(c, exposure = 1) {
  const m3 = (e, v) => [e[0] * v[0] + e[3] * v[1] + e[6] * v[2], e[1] * v[0] + e[4] * v[1] + e[7] * v[2], e[2] * v[0] + e[5] * v[1] + e[8] * v[2]];
  const inI = new THREE.Matrix3().fromArray([0.59719, 0.076, 0.0284, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777]).invert().elements;
  const outI = new THREE.Matrix3().fromArray([1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602]).invert().elements;
  const y = m3(outI, [c.r, c.g, c.b].map((v) => Math.min(v, 0.95))).map((v) => Math.min(0.97, Math.max(0.0004, v)));
  const v = y.map((q) => { const A = 0.983729 * q - 1, B = 0.432951 * q - 0.0245786, C = 0.238081 * q + 0.000090537; return (-B - Math.sqrt(Math.max(B * B - 4 * A * C, 0))) / (2 * A); });
  const o = m3(inI, v).map((q) => Math.min(1, Math.max(0, q) * 0.6 / exposure));
  return new THREE.Color().setRGB(o[0], o[1], o[2]);
}

// everything every material of this style needs: pencils, paper, clocks, grain, hatch, stage of the drawing
const styleGLSL = (exposure) => /* glsl */`
  ${toneGLSL(exposure)}
  uniform vec3 uPaper, uGraphite, uSmudge, uPale, uBlue, uRed;
  uniform vec2 uRes;
  uniform float uTime;          // seconds, full rate
  uniform vec2 uSun;            // unit world xz direction the hatch shadows fall in (away from the sun circle)
  uniform vec3 uStage;          // x: clean inside (70 m), y: blue beyond (220 m), z: metres the clean line takes to lay (7.2)
  float hash11(float n){ return fract(sin(n*127.1 + 3.7)*43758.5453); }
  float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
  float hash31(vec3 p){ p = fract(p*vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y)*p.z); }
  float vnoise1(float x){ float i = floor(x), f = fract(x); f = f*f*(3. - 2.*f); return mix(hash11(i), hash11(i + 1.), f); }
  float vnoise2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
    return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y); }
  float vnoise3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); vec2 o = vec2(0., 1.);
    return mix(mix(mix(hash31(i), hash31(i + o.yxx), f.x), mix(hash31(i + o.xyx), hash31(i + o.yyx), f.x), f.y),
               mix(mix(hash31(i + o.xxy), hash31(i + o.yxy), f.x), mix(hash31(i + o.xyy), hash31(i + o.yyy), f.x), f.y), f.z); }
  // stepped clocks: the living are on twos (12 drawings a second), held lines are re-traced 6 times a second
  float clock12(){ return floor(uTime*12.); }
  float clock6(){ return floor(uTime*6.); }
  // pencil grain, anchored to the world (so it slides in parallax) at a cell of about 1.5 pixels whatever the distance
  float grainAt(vec3 w, float dist){
    float cell = 0.0035*max(dist, 0.3), l = log2(cell), f = fract(l);
    float c0 = exp2(floor(l));
    return mix(vnoise3(w/c0), vnoise3(w/(c0*2.)), f)*0.7 + 0.3*vnoise3(w/(c0*6.) + 9.);
  }
  // quick diagonal hatch on a plane: p = plane coordinates in metres with +x toward where shadows fall.
  // returns coverage 0..1; fw must be fwidth of the hatch phase taken by the caller. Finer than ~3 px it is the flat average.
  float hatchPhase(vec2 p, float period){ return (p.x*0.62 + p.y*0.78)/period + 0.35*vnoise2(p*0.45); }
  float hatchCov(float ph, float fw, vec2 p){
    float row = floor(ph), f = abs(fract(ph) - 0.5);
    float along = p.x*0.78 - p.y*0.62;
    float brk = step(0.22, vnoise2(vec2(along*0.35 + row*7.3, row*1.7)));      // strokes lift off the paper here and there
    fw = max(fw, 1e-4);
    float line = (1. - smoothstep(0.16 - fw, 0.16 + fw, f))*brk;
    return mix(line, 0.3, smoothstep(0.28, 0.4, fw));
  }
  // stage of the drawing by distance: 0 clean (inside uStage.x), 1 rough, 2 blue construction only (beyond uStage.y)
  float stageOf(float dist){ return step(uStage.x, dist) + step(uStage.y, dist); }
`;

// ribbon expansion shared by every line: P a point of the stroke and Q a point a little further along it (both world space)
const RIBBON_GLSL = /* glsl */`
  // returns the clip position; px = full width in pixels actually drawn (floor 1.6)
  vec4 ribbon(vec3 P, vec3 Q, float side, float press, float weight, out float px){
    vec4 a = projectionMatrix*viewMatrix*vec4(P, 1.), b = projectionMatrix*viewMatrix*vec4(Q, 1.);
    vec2 d = (b.xy/max(abs(b.w), 1e-4) - a.xy/max(abs(a.w), 1e-4))*uRes;
    float l = length(d); d = l > 1e-5 ? d/l : vec2(1., 0.);
    float dist = max(a.w, 0.3);
    float pxPerM = projectionMatrix[1][1]*uRes.y*0.5/dist;
    // a clean line is about 2 cm at 8 m and keeps that angular width further out
    px = max(max(0.02, 0.003*dist)*pxPerM*press*weight, 1.6);
    a.xy += vec2(-d.y, d.x)*side*px/uRes*a.w;
    a.z -= 0.0008*a.w;
    return a;
  }
  // boil: a wander of less than half a line width, re-seeded on a stepped clock
  vec3 boil(vec3 P, float seed, float clk, float dist){
    float h = seed*17.13 + clk*3.71;
    return P + (vec3(hash11(h), hash11(h + 1.3), hash11(h + 2.9)) - 0.5)*max(0.02, 0.003*dist)*0.45;
  }
`;

const LINE_FS = /* glsl */`
  varying vec3 vW, vCol; varying vec3 vUVK;      // u along (m), v across -1..1, strength 0..1
  varying float vPx;
  void main(){
    if (vUVK.z < 0.01) discard;
    float dist = max(length(vW - cameraPosition), 0.3);
    float g = grainAt(vW, dist);
    float edge = mix(1., 1. - vUVK.y*vUVK.y, smoothstep(2.2, 5., vPx));
    float cov = edge*(0.62 + 0.6*g)*(0.6 + 0.4*vUVK.z);
    if (cov < 0.5) discard;
    // opaque mix toward paper: never alpha, so nothing sorts
    float k = vUVK.z*(0.78 + 0.22*smoothstep(0.15, 0.6, g));
    gl_FragColor = vec4(toScene(mix(uPaper, vCol, k)), 1.);
  }
`;

// a plain held stroke (static polylines built with ribbonGeometry): boils at 6 a second
const HELD_VS = /* glsl */`
  attribute vec3 aNext; attribute vec4 aLine;    // side, u along (m), pressure, pencil (0 graphite 1 blue 2 red 3 pale 4 smudge)
  attribute float aSeed;
  varying vec3 vW, vCol; varying vec3 vUVK; varying float vPx;
  vec3 pencil(float id){ return id < 0.5 ? uGraphite : id < 1.5 ? uBlue : id < 2.5 ? uRed : id < 3.5 ? uPale : id < 4.5 ? uSmudge : id < 5.5 ? uBlue : id < 6.5 ? mix(uPale, uPaper, 0.4) : uGraphite; }
  void main(){
    vec3 P = (modelMatrix*vec4(position, 1.)).xyz, Q = (modelMatrix*vec4(aNext, 1.)).xyz;
    float dist = length(P - cameraPosition);
    vec3 o = boil(vec3(0.), aSeed + floor(aLine.y*0.5), clock6(), dist);
    gl_Position = ribbon(P + o, Q + o, aLine.x, aLine.z, 1., vPx);
    if ((aLine.w > 4.5 && aLine.w < 5.5 && dist > 85.) || (aLine.w > 6.5 && dist > 130.)) gl_Position = vec4(0., 0., 2., 1.);      // small notes are not there from afar
    vW = P; vCol = pencil(aLine.w); vUVK = vec3(aLine.y, aLine.x, 1.);
  }
`;

const SEA_FS = /* glsl */`
  varying vec3 vL, vW; uniform float uCell; uniform vec4 uLaneFade;
  float gridLine(float x, float fw, float px){ float d = abs(fract(x - 0.5) - 0.5)/max(fw, 1e-5); return 1. - smoothstep(px*0.5 - 0.5, px*0.5 + 0.5, d); }
  void main(){
    float dist = max(length(vW - cameraPosition), 0.3);
    vec2 q = vL.xz/uCell, fw = fwidth(q);
    // 10 m cells while a cell is wider than ~7 px, then every fifth line, then only paper (the horizon guide is a ribbon)
    vec2 fine = vec2(gridLine(q.x, fw.x, 1.25), gridLine(q.y, fw.y, 1.25))*(1. - smoothstep(0.09, 0.2, fw));
    vec2 q5 = q/5., fw5 = fw/5.;
    vec2 coarse = vec2(gridLine(q5.x, fw5.x, 1.4), gridLine(q5.y, fw5.y, 1.4))*(1. - smoothstep(0.08, 0.2, fw5));
    float g = grainAt(vW, dist);
    float line = max(max(fine.x, fine.y), max(coarse.x, coarse.y))*(0.55 + 0.45*smoothstep(0.1, 0.55, g));
    gl_FragColor = vec4(toScene(mix(uPaper, uBlue, clamp(line, 0., 1.))), 1.);
  }
`;
const TONE_FS = /* glsl */`
  // hatch (uMode 0) or thumb smudge (uMode 1) on a quad: uv -1..1 is the patch, world xz anchors the marks
  varying vec3 vW; varying vec2 vUv, vP; varying float vAmt; uniform float uMode;
  void main(){
    if (vAmt < 0.01) discard;
    float dist = max(length(vW - cameraPosition), 0.3);
    float rim = length(vUv) + 0.35*(vnoise2(vP*0.9 + 3.) - 0.5);
    if (rim > 0.5 + 0.5*vAmt) discard;
    vec2 p = vP; float ph = hatchPhase(p, dist < 5. ? 0.09 : dist < 12. ? 0.16 : dist < 34. ? 0.27 : 0.6), fw = fwidth(ph);
    float c = uMode > 0.5 ? 0.75 + 0.25*grainAt(vW, dist) : hatchCov(ph, fw, p);
    // the heart of a shadow is hatched a second time, across the first, and pressed harder (a value step deeper than its fringe)
    vec2 p2 = vec2(p.y, -p.x); float ph2 = hatchPhase(p2, dist < 5. ? 0.1 : dist < 12. ? 0.18 : dist < 34. ? 0.3 : 0.66), fw2 = fwidth(ph2);
    float heart = uMode > 0.5 ? 0. : step(rim, 0.22 + 0.4*vAmt)*step(dist, 90.);
    float c2 = hatchCov(ph2, fw2, p2)*heart;
    if (max(c, c2) < 0.25) discard;
    gl_FragColor = vec4(toScene(mix(uPaper, uMode > 0.5 ? uSmudge : mix(uSmudge, uGraphite, 0.26 + 0.34*heart*step(0.25, c2)), clamp(max(c, c2), 0., 1.))), 1.);
  }
`;

/**
 * makeStyle(palette, { exposure, stage }): the whole look as one object. Every material shares style.uniforms.
 */
export function makeStyle(palette = PALETTE, o = {}) {
  const col = (i) => new THREE.Color(palette[i] || PALETTE[i]);
  const exposure = o.exposure ?? 1;
  const stage = o.stage ?? [70, 220, 7.2];
  const uniforms = {
    uPaper: { value: col(0) }, uGraphite: { value: col(1) }, uSmudge: { value: col(2) }, uPale: { value: col(3) },
    uBlue: { value: col(4) }, uRed: { value: col(5) }, uRes: { value: new THREE.Vector2(800, 450) }, uTime: { value: 0 },
    uStage: { value: new THREE.Vector3(stage[0], stage[1], stage[2]) }, uSun: { value: new THREE.Vector2(1, 0) },
  };
  const GLSL = styleGLSL(exposure);
  const mats = [];
  const mk = (p) => { const m = new THREE.ShaderMaterial(p); mats.push(m); return m; };
  const style = {
    uniforms, GLSL, RIBBON_GLSL, LINE_FS, exposure,
    /** any ribbon material: vertexShader body must declare the varyings vW, vCol, vUVK, vPx and call ribbon(). */
    lineMaterial(vertexShader = HELD_VS, extra = {}) {
      return mk({ uniforms: { ...uniforms, ...extra }, vertexShader: GLSL + RIBBON_GLSL + vertexShader, fragmentShader: GLSL + LINE_FS, side: THREE.DoubleSide });
    },
    /** hull in the exact paper colour that only writes depth and paper (hides what is behind a drawing). */
    paperMaterial(extra = {}) {
      return mk({ uniforms: { ...uniforms, ...extra }, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2,
        vertexShader: 'void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
        fragmentShader: GLSL + 'void main(){ gl_FragColor = vec4(toScene(uPaper), 1.); }' });
    },
    /** hatch (mode 0) or smudge (mode 1) patch for flat quads lying in a plane; attribute aAmt 0..1 (optional) sizes it. */
    toneMaterial(mode = 0) {
      return mk({ uniforms: { ...uniforms, uMode: { value: mode } }, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
        vertexShader: 'varying vec3 vW; varying vec2 vUv, vP; varying float vAmt; void main(){ vUv = uv*2. - 1.; vAmt = 1.; vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vP = w.xz; gl_Position = projectionMatrix*viewMatrix*w; }',
        fragmentShader: GLSL + TONE_FS });
    },
    /** the sea: a sheet of paper ruled with the blue perspective grid (cells in metres, in the mesh's local xz). */
    seaMaterial(cell = 10) {
      return mk({ uniforms: { ...uniforms, uCell: { value: cell }, uLaneFade: { value: new THREE.Vector4() } }, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
        vertexShader: 'varying vec3 vL, vW; void main(){ vL = position; vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
        fragmentShader: GLSL + SEA_FS });
    },
    /** bare paper sky (inside of a big sphere or dome). */
    skyMaterial() {
      return mk({ uniforms, side: THREE.BackSide, depthWrite: false,
        vertexShader: 'void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
        fragmentShader: GLSL + 'void main(){ gl_FragColor = vec4(toScene(uPaper), 1.); }' });
    },
    ribbonGeometry,
    /** call once a frame: sets the clocks and the pixel size the line widths are measured in. */
    update(time, renderer) {
      uniforms.uTime.value = time;
      if (renderer) { renderer.getDrawingBufferSize(uniforms.uRes.value); if (uniforms.uRes.value.y < 2) uniforms.uRes.value.set(800, 450); }
    },
    dispose() { for (const m of mats) m.dispose(); },
  };
  return style;
}

/**
 * ribbonGeometry(strokes): static strokes for style.lineMaterial(). strokes = [{ pts: [[x,y,z],...], pencil: 0 graphite |
 * 1 blue | 2 red | 3 pale | 4 smudge, press: 1 (number or (t)=>number), taper: true, seed }]. Lay a rough line as 3-4 strokes
 * that miss each other; let blue strokes overshoot their corners.
 */
export function ribbonGeometry(strokes) {
  let n = 0; for (const s of strokes) n += s.pts.length;
  const pos = new Float32Array(n * 6), nxt = new Float32Array(n * 6), lin = new Float32Array(n * 8), sd = new Float32Array(n * 2), idx = [];
  let v = 0;
  strokes.forEach((s, si) => {
    const P = s.pts, m = P.length, seed = s.seed ?? si * 7.31; let len = 0;
    for (let i = 0; i < m; i++) {
      const a = P[i], b = i < m - 1 ? P[i + 1] : [2 * a[0] - P[i - 1][0], 2 * a[1] - P[i - 1][1], 2 * a[2] - P[i - 1][2]];
      if (i > 0) len += Math.hypot(a[0] - P[i - 1][0], a[1] - P[i - 1][1], a[2] - P[i - 1][2]);
      const t = i / (m - 1), base = typeof s.press === 'function' ? s.press(t) : (s.press ?? 1);
      const wob = 0.82 + 0.36 * (0.5 + 0.5 * Math.sin(seed * 12.9 + t * (5 + (seed % 3)) * 2.1));
      const pr = base * wob * (s.taper === false ? 1 : 0.45 + 0.55 * Math.min(1, Math.sin(Math.PI * Math.min(Math.max(t, 0.001), 0.999)) * 3));
      for (let k = 0; k < 2; k++) {
        pos.set(a, v * 3); nxt.set(b, v * 3); lin.set([k ? 1 : -1, len, pr, s.pencil ?? 0], v * 4); sd[v] = seed; v++;
      }
      if (i < m - 1) idx.push(v - 2, v - 1, v, v - 1, v + 1, v);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aNext', new THREE.BufferAttribute(nxt, 3));
  g.setAttribute('aLine', new THREE.BufferAttribute(lin, 4)); g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
  g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------------------------------------------------
// THE RAY: a flat deformable kite, so its planform edge is its silhouette. Planform in half-spans, nose +y (local z).
// ---------------------------------------------------------------------------------------------------------
const NPLAN = 48, NSLOT = 14;
function planform(rng) {
  const k = 0.94 + rng() * 0.12, sweep = rng.range(-0.03, 0.03);
  const V = (x, y) => new THREE.Vector3(x, y, 0);
  const seg = (pts, n) => new THREE.CatmullRomCurve3(pts, false, 'centripetal').getPoints(n);
  // right half: mouth notch -> cephalic fin (horn) -> convex leading edge -> falcate wing tip -> concave trailing edge -> pelvic -> tail root
  const horn = seg([V(0, 0.40 * k), V(0.06, 0.43 * k), V(0.115, 0.60 * k)], 3);
  const lead = seg([V(0.115, 0.60 * k), V(0.175, 0.44 * k), V(0.30, 0.40 * k), V(0.58, 0.31 * k), V(0.84, 0.11 + sweep), V(1.0, -0.15 + sweep)], 11);
  const trail = seg([V(1.0, -0.15 + sweep), V(0.84, -0.10 + sweep), V(0.56, -0.17 * k), V(0.30, -0.36 * k), V(0.12, -0.58 * k), V(0.045, -0.70 * k), V(0, -0.72 * k)], 10);
  const R = [...horn, ...lead.slice(1), ...trail.slice(1)];          // 25 points
  const out = R.map((p) => new THREE.Vector2(p.x, p.y));
  for (let i = R.length - 2; i >= 0; i--) out.push(new THREE.Vector2(-R[i].x, R[i].y));
  return out;                                                        // 49 points, closed
}

const RAY_GLSL = /* glsl */`
  uniform float uS, uSeed; uniform vec2 uFlip; uniform vec2 uPlan[${NPLAN + 1}];
  const float NS = ${NSLOT}.;
  uniform float uSomer, uShadowLen, uFlat;         // uFlat 1: the ray flies belly down, wings level (a leap to be looked at from above)
  uniform float uT2[34];                           // the Arcade: seconds before the eye passes arch i (index i + 2) that its ray takes off
  struct Arch { float i, T, H, dir, zc, span, ok, rollS, skew, big, wide, t2; };
  float gReal;                   // seconds on the eye's own clock (rubbing-out keeps to it)
  float gKey = 0.;               // 1 while a key of the flip test is being placed (a key never somersaults)
  float gTau;                    // the leap clock in seconds (set by archOf): the eye passes the arch at a.T
  float gOpen = 1.;              // how far the ray's wings are open in the pose just set (leapPose): 0 a dart at the water, 1 the flat kite
  float gSlim = 1.;              // ... and how far they are drawn in (the span of the dart as a part of the kite's)
  // seconds before a.T: the ray takes off (T2; it is three seconds in the air), the arc of action is pencilled (TARC)
#ifdef SEA
  #define TARC 10.5
#else
  #define TARC 11.0
#endif
#ifdef SEA
  // a free leap on the open sea: the same drawing, placed by instance attributes in a window that wraps round the eye,
  // looping on its own clock (arc at 0 s, the blue ovals of the plan from 0.45, the ray 1.2-4.2, its splash to 5.4)
  attribute vec4 aL0, aL1;       // base x, base z, heading, phase (s)  |  height (m), half span (m), leap length (m), id + seed
  uniform vec4 uSea;             // clock (s), window side (m), shown from (m), shown to (m) of the eye at mid-cycle
  uniform vec4 uCamV;            // eye x, z and its velocity x, z
  uniform vec3 uSeaP;            // period (s), metres the spot moves between cycles, heading scatter (rad)
  uniform vec4 uKeep[6];         // six segments (xz to xz) the leaps keep clear of (the camera's course)
  uniform vec4 uKeepR;           // clearance (m) | a half plane dot(xz, .yz) < .w outside which nothing leaps
  vec3 gO; vec2 gR; float gS;
  float segDist(vec2 p, vec4 sg){ vec2 pa = p - sg.xy, ba = sg.zw - sg.xy; return length(pa - ba*clamp(dot(pa, ba)/max(dot(ba, ba), 1e-4), 0., 1.)); }
  Arch archOf(float slot){
    Arch a; float tt = uSea.x + aL0.w, n = floor(tt/uSeaP.x);
    gTau = tt - n*uSeaP.x; gReal = gTau; a.big = 1.; a.wide = 1.; a.t2 = 9.3;
    float r = aL1.w*1.37 + n*0.618 + uSeed;
    vec2 c0 = uCamV.xy + uCamV.zw*(uSeaP.x*0.5 - gTau);    // where the eye will be half way through this cycle
    vec2 b = aL0.xy + (vec2(hash11(r + 0.2), hash11(r + 0.4)) - 0.5)*uSeaP.y;
    b += uSea.y*floor((c0 - b)/uSea.y + 0.5);
    float d0 = length(b - c0);
    a.i = aL1.w + n; a.ok = step(uSea.z, d0)*step(d0, uSea.w)*step(0., tt); a.T = 10.5;     // nothing before its clock starts
    a.ok *= step(uKeepR.x, min(min(min(segDist(b, uKeep[0]), segDist(b, uKeep[1])), min(segDist(b, uKeep[2]), segDist(b, uKeep[3]))), min(segDist(b, uKeep[4]), segDist(b, uKeep[5]))))*step(dot(b, uKeepR.yz), uKeepR.w);
    gS = aL1.z/17.;
    a.H = abs(aL1.x)*(uSeaP.y > 0.001 ? 0.75 + 0.5*hash11(r) : 1.)/gS; a.dir = aL1.x < 0. || hash11(r + 0.5) < 0.5 ? 1. : -1.; a.zc = 0.; a.span = aL1.y/gS;     // a negative height: always along the heading
    a.rollS = hash11(r + 0.77) < 0.5 || (uFlat > 0.01 && uFlat < 0.99) ? 1. : -1.; a.skew = (hash11(r + 0.93) - 0.5)*4./max(gS, 1.);     // (a long leap strays no further than a short one)
    float hd = aL0.z + (hash11(r + 0.11) - 0.5)*uSeaP.z; gR = vec2(cos(hd), sin(hd)); gO = vec3(b.x, 0., b.y);
    return a;
  }
  vec3 toWd(vec3 v){ return vec3(v.x*gR.x - v.z*gR.y, v.y, v.x*gR.y + v.z*gR.x); }
  vec3 toW(vec3 p){ return gO + toWd(p*gS); }
  vec3 shadowAt(vec3 C){ vec3 w = toW(vec3(C.x, 0., C.z)); w.xz += uSun.xy*uShadowLen*C.y*gS; return w; }
#else
  vec3 toW(vec3 p){ return (modelMatrix*vec4(p, 1.)).xyz; }
  vec3 toWd(vec3 v){ return mat3(modelMatrix)*v; }
  vec3 shadowAt(vec3 C){ return toW(vec3(C.x + uShadowLen*C.y, 0., C.z)); }
  // pool slot -> the arch it stands for just now (the window runs from 22 m behind the eye to 146 m ahead)
  Arch archOf(float slot){
    gReal = uS/18.; gTau = gReal;
    Arch a; float i0 = ceil((max(uS, -46.) - 22.)/12.);
    a.i = i0 + mod(slot - i0, NS);
    a.ok = step(-2.5, a.i)*step(a.i, 30.5);                 // arches -2 and -1 stand before the lane proper
    a.T = (6. + 12.*a.i)/18.; a.t2 = uT2[int(clamp(a.i + 2.5, 0., 33.))];
    float r = a.i*1.37 + uSeed;
    a.H = 8. + 2.4*hash11(r);
    a.dir = a.i < 18.5 ? 1. : -1.;                 // leapt from the left as far as arch 18 (the eye keeps right of the axis till then: the ray lands on its side, inside the frame), then from the right
    a.zc = 200. - (6. + 12.*a.i) + (hash11(r + 0.31) - 0.5)*1.6;
    a.span = 3.1 + 0.6*hash11(r + 0.57);
    a.rollS = hash11(r + 0.77) < 0.5 ? 1. : -1.;
    a.skew = (hash11(r + 0.93) - 0.5)*5.;
    // variety down the colonnade: arches 9-13 lean so that each crosses the next; arches 20-22 are
    // drawn half as large again
    if (a.i > 8.5 && a.i < 13.5) a.skew = 13.;
    a.big = a.i > 19.5 && a.i < 22.5 ? 1.3 : 1.; a.wide = a.big > 1.2 ? 1.14 : 1.;
    return a;
  }
  // the flip test: the wave's clock at this arch (below 0: not rolled yet), and whether key kq is the drawing in hand
  // (two runs of 1.7 s; on each of the six arches ahead one of six keys is the drawing in hand, one key further on from arch
  // to arch, and every arch steps one key on at twelve a second: ONE ray caught in successive drawings, a dart at a near
  // foot, a kite on a crown beyond, a dart going in further off, running down the colonnade)
  float flipClock(Arch a){ return (uFlip.x >= 0. && uFlip.x < 1.7) || (uFlip.x >= 2.5 && uFlip.x < 4.2) ? uFlip.x : -1.; }
  float flipIs(float fph, float kq, float i, float dA){
    float m = mod(floor(fph*12.) + i - floor(kq*0.5) + 60., 6.);
    float on = m < 0.5 || (dA < 46. && abs(m - 3.) < 0.5) ? 1. : 0.;
    return on*step(0.5, mod(i + 40., 2.))*step(20., dA)*step(dA, 118.);
  }
#endif
  // when the arc of action is pencilled, and when the blue ovals of the plan begin to be set along it
  float arcT0(Arch a){
    float t = a.T - TARC;
#ifndef SEA
    t -= 14.*step(a.i, 8.5);                       // the first arcs of the colonnade are pencilled in long before: it is there from the first glance
#endif
    return t;
  }
  // seconds since the ray of this leap took off (negative: not yet). Far ahead of the eye the first arches of the colonnade
  // are leapt again and again, every five seconds, each time over a plan set out afresh (gLoop), so the Arcade is alive
  // from the first glance; an arch's last leap is the one that meets the eye.
  float gLoop;
  float leapClock(Arch a){
    float x = gTau - (a.T - a.t2); gLoop = 0.;
#ifndef SEA
    if (a.i < 8.5 && x < -1.){ x = mod(x, 5.); if (x > 3.6) x -= 5.; gLoop = 1.; }
    else if (mod(a.i, 2.) > 0.5) x = min(x, -2.);  // every other arch is still only its plan when the eye comes by: two rays in the air at once, never a knot
    if (a.i > 27.5) x = min(x, -2.);               // the last three arches are never leapt: the plan stands bare before the page
#endif
    return x;
  }
  float planT0(Arch a){
#ifdef SEA
    return arcT0(a) + 0.45;
#else
    return a.i < 8.5 ? arcT0(a) + 0.5 : a.T - 7.6;
#endif
  }
  // A BODIED DRAWING (a cleaned-up ray is opaque: paper fill, tone, line). hk = (1 the leaping ray | 0 a key of the flip
  // test, its place k of twelve along the arc). Returns whether it is there, and its place on the arc.
  float bodyOf(Arch a, vec2 hk, out float l, out float t, out float tone){
    float show = a.ok; tone = 1.; l = 1.; gKey = hk.x > 0.5 ? 0. : 1.;
    if (hk.x > 0.5){
      float dr = floor(leapClock(a)*12.);
      show *= step(-0.5, dr)*step(dr, 35.5); t = (dr + 0.5)/36.;
    } else {
      t = (3.*hk.y + 1.5)/36.;
#ifdef SEA
      show = 0.;
#else
      float fph = flipClock(a), dA = 6. + 12.*a.i - uS;
      show *= (fph >= 0. ? flipIs(fph, hk.y, a.i, dA) : 0.)*step(a.T - TARC, gTau);
#endif
    }
    return show;
  }
  float isSomer(float i){ return max(uSomer, mod(i, 4.) > 2.5 ? 1. : 0.)*(1. - gKey); }
  vec3 arcPoint(Arch a, float l, float t){
    float H = a.H*(a.big > 1.2 ? 0.86 : 0.94);
    return vec3(a.dir*(-8.5 + 17.*t)*a.wide, 4.*H*t*(1. - t), a.zc + a.skew*(t - 0.5));
  }
  // pose of the ray at leap parameter t (0 leaves the water, 1 lands); l = 0 first ray, 1 the one that follows
  void leapPose(Arch a, float l, float t, out vec3 C, out vec3 hd, out vec3 wg, out vec3 nm, out float flap){
    float H = a.H*(a.big > 1.2 ? 0.86 : 0.94);
    C = arcPoint(a, l, t);
    vec2 tg = normalize(vec2(a.dir*17.*a.wide, 4.*H*(1. - 2.*t)));
    float sa = isSomer(a.i)*6.2832*smoothstep(0.1, 0.9, t)*a.dir;
    float cs = cos(sa), sn = sin(sa); tg = vec2(tg.x*cs - tg.y*sn, tg.x*sn + tg.y*cs);
    hd = vec3(tg, 0.);
    vec3 n0 = vec3(-tg.y, tg.x, 0.)*a.dir;
#ifdef SEA
    float open = smoothstep(0.04, 0.27, t)*(1. - smoothstep(0.73, 0.96, t));
#else
    float open = smoothstep(0.04, 0.25, t)*(1. - smoothstep(0.8, 0.98, t));       // (down the lane a ray stays open till it is nearly in the water: the nearest kite is the largest)
#endif
    gOpen = open; gSlim = mix(0.42, 1., open);
    // at the water the ray is a slim dart: its wings drawn in (a narrow lens with the spine down the middle), nearly flat to
    // the lane like the open kite over the top, so its two edges never close up into a blade
    float ro = 1.5708*mix(0.8, 1., open)*a.rollS*(1. - 0.9*uFlat);
    wg = vec3(0., 0., cos(ro)) + n0*sin(ro);
    nm = cross(wg, hd);
    flap = 0.12*(1. - open) + 0.2*sin(12.566*t + l)*open*(1. - gKey);       // (a key of the flip test is a held pose: no flap)
    // AN ANIMATOR NEVER DRAWS THE KITE EDGE-ON (a flat ray seen along its own plane is a black blade). Seen nose-on or
    // tail-on it is drawn with level wings lifted in a shallow V; seen within 25 degrees of its plane from the side it is
    // rolled just far enough to show its back.
    vec3 vd = cameraPosition - toW(C); vd /= max(length(vd), 1e-3);
    float cg = dot(toWd(nm), vd), ch = dot(toWd(wg), vd), cR = sqrt(cg*cg + ch*ch);
    float nose = (1. - smoothstep(0.3, 0.55, cR))*(uFlat > 0.01 ? 0. : 1.);       // (a banking or level ray keeps its own roll)
    if (nose > 0.001){
      wg = normalize(mix(wg, vec3(0., 0., wg.z < 0. ? -1. : 1.), nose)); nm = cross(wg, hd); flap += 0.42*nose*open;
      cg = dot(toWd(nm), vd); ch = dot(toWd(wg), vd); cR = sqrt(cg*cg + ch*ch);
    }
    float cT = min(0.42, 0.95*cR);
    if (cR > 0.3 && abs(cg) < cT && uFlat < 0.5){
      float bq = acos(clamp(cT/cR, 0., 1.)), aq = atan(ch, cg), ab = abs(aq);      // (cR is over 0.3 here: never atan(0, 0))
      float pq = (aq < 0. ? -1. : 1.)*(ab < 1.5708 ? ab - bq : ab - (3.14159 - bq));
      float cq = cos(pq), sq = sin(pq);
      vec3 w2 = wg*cq - nm*sq; nm = nm*cq + wg*sq; wg = w2;
    }
  }
  vec2 planAt(float f){ f = clamp(f, 0., ${NPLAN}.); int i = int(floor(f)); int i2 = min(i + 1, ${NPLAN});
    return mix(uPlan[i], uPlan[i2], f - float(i)); }
  vec3 rayLocal(vec2 p, float flap){
    float a = abs(p.x), be = flap*(0.2 + 0.8*a);
    return vec3(sign(p.x)*a*cos(be)*gSlim, a*sin(be)*gSlim + 0.05*max(0., 1. - a*2.5), p.y);
  }
  // planform point of mark number j of a part: 0 outline, 1 straight strokes (spine, creases), 2 tail, 3 blue oval, 4 blue axes
  vec2 markAt(float part, float j, float n, vec4 ab, float rough, float seed, float whip){
    float u = j/max(n, 1.);
    if (part < 0.5){
      if (rough < 0.5) return planAt(j);
      vec2 o = vec2(vnoise1(j*0.33 + seed), vnoise1(j*0.29 + seed + 40.)) - 0.5;
      return planAt(mod(j*1.31 + 5., ${NPLAN}.))*(1. + 0.07*(vnoise1(j*0.09 + seed) - 0.5)) + o*0.055;
    }
    if (part < 1.5) return mix(ab.xy, ab.zw, u) + vec2(0., 0.03*sin(u*3.1416));
    if (part < 2.5) return vec2(whip*u*u*0.62 + 0.06*sin(u*9. + whip*4.)*u, ab.y - (ab.y - ab.w)*u);
    if (part < 3.5){ float an = u*6.2832*1.24 + 0.5 + seed; float rr = 1. + 0.05*u;
      return vec2(1.07*rr*cos(an), -0.04 + 0.66*rr*sin(an)); }
    return mix(ab.xy, ab.zw, u);
  }
`;

// THE BACK OF A RAY as the animator shades it (shared by every bodied ray of the world): the side of the pencil laid along
// the sweep of the wings, paper left for the light along the leading edge, pressed harder along the spine and in strokes
// across the wings; then the spine, the ribs of the wings and the eyes in line. pl = planform (half spans, nose +y),
// e = 0 centre .. 1 outline .. 1.1 the smudge's overshoot, g = grain, fp = planform units to a pixel, tone = value step
// with distance (1 near). Returns the colour; a = 0 where nothing is drawn (the ragged edge of the overshoot).
export const BACK_GLSL = /* glsl */`
  float gDeep = 0.;              // 1: a drawing right under the eye: the softest pencil, a value step deeper
  float gRibs = 1.;              // 0: a ray folded to a dart (no wing ribs, no pressure: a strip of tone and its spine)
  float segD(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba*clamp(dot(pa, ba)/max(dot(ba, ba), 1e-5), 0., 1.)); }
  vec4 backTone(vec2 pl, float e, float g, float fp, float tone){
    float ax = abs(pl.x), nz = vnoise2(pl*4.3 + 7.);
    if (e > 1. && e > 0.94 + 0.2*nz) return vec4(0.);
    vec3 cSm = mix(uPaper, mix(uSmudge, uGraphite, 0.24*gDeep), tone), cDk = mix(uPaper, mix(uSmudge, uGraphite, 0.5 + 0.28*gDeep), tone), cGr = mix(uPaper, uGraphite, tone);
    float sw = pl.y + 0.42*ax;                                      // constant along the sweep of a wing
    float lead = 0.5 - 0.5*ax*sqrt(ax) - pl.y;                      // how far behind the leading edge
    float streak = vnoise2(vec2(ax*2.3 + 3., sw*12.))*0.62 + g*0.38;
    vec3 col = cSm;
    // light: the leading edge of each wing and a few gaps between the strokes stay paper
    float lit = step(0.2, ax)*(1. - smoothstep(0.03 + 0.05*nz, 0.05 + 0.05*nz, lead))*step(e, 1.);
    lit = max(lit, step(streak, 0.21)*step(0.3, ax));
    col = mix(col, uPaper, lit);
    // pressure: along the spine, and in strokes that follow the sweep across the middle of each wing
    float press = step(ax, 0.15 + 0.1*nz)*step(pl.y, 0.42);
    press = max(press, step(0.52, vnoise2(vec2(ax*3.1 + 9., sw*25.))*0.7 + g*0.3)*smoothstep(0.07, 0.13, lead)*(1. - smoothstep(0.26, 0.5 + 0.2*nz, lead)));
    col = mix(col, cDk, press*(1. - lit)*step(e, 1.));
    // a ray folded to a dart is a lens of line with only a strip of tone down its middle: paper either side of it
    if (gRibs < 0.5) col = mix(uPaper, cSm, step(ax, 0.36 + 0.2*nz)*step(e, 1.));
    // line: spine, three ribs to a wing, the eyes
    float lw = max(0.011, fp*0.75), d = segD(pl, vec2(0., 0.37), vec2(0., -0.64));
    vec2 q = vec2(ax, pl.y);
    for (int i = 0; i < 3; i++){ float fi = float(i);
      d = min(d, segD(q, vec2(0.13, 0.2 - 0.15*fi), vec2(0.5 - 0.06*fi, 0.1 - 0.13*fi)) + 0.004 + 9.*(1. - gRibs));
      d = min(d, segD(q, vec2(0.5 - 0.06*fi, 0.1 - 0.13*fi), vec2(0.86 - 0.2*fi, -0.11 - 0.07*fi)) + 0.008 + 9.*(1. - gRibs)); }
    d = min(d, length(q - vec2(0.15, 0.43)) - 0.02);
    col = mix(col, cGr, (1. - smoothstep(lw, lw + fp, d))*step(0.3, g + 0.4*step(d, lw*0.5))*step(e, 1.)*step(fp, 0.062));
    return vec4(col, 1.);
  }
`;

const RAY_VS = /* glsl */`
  attribute vec4 aV, aAB;        // part, j, side, n  |  stroke ends in planform
  attribute vec3 aI;             // instance: pool slot, kind (0 a key of the flip test | 1 the leaping ray and the blue drawings ahead of it | 2 a blue oval of the plan), k
  varying vec3 vW, vCol; varying vec3 vUVK; varying float vPx;
  vec3 place(vec2 p, vec3 C, vec3 hd, vec3 wg, vec3 nm, float flap, float span){
    vec3 r = rayLocal(p, flap); return C + span*(r.x*wg + r.y*nm + r.z*hd); }
  void main(){
    Arch a = archOf(aI.x);
    float tau = gTau, kind = aI.y, k = aI.z, show = a.ok, l = 1., t, live = 0., fut = 0., flip = 0., plan = 0., filled = -1.;
    float xLeap = leapClock(a), dr = floor(xLeap*12.);          // the drawing the leaping ray has reached (36 to a leap, on twos)
    float part = aV.x, j = aV.y, n = aV.w, u = j/max(n, 1.);
    gKey = kind < 0.5 ? 1. : 0.;
    if (kind < 0.5){
      // THE FLIP TEST (rare): the animator rolls the drawings and a wave runs down the colonnade: on every arch one bold
      // bodied ray steps round the plan, at a different place on each
      t = (3.*k + 1.5)/36.;
#ifdef SEA
      show = 0.;
#else
      float fph = flipClock(a), dF = 6. + 12.*a.i - uS;
      flip = fph >= 0. && flipIs(fph, k, a.i, dF) > 0.5 ? 1. : 0.;
      show *= flip*step(a.T - TARC, tau);     // (the bare plans ahead, never one so near that the frame would cut it)
#endif
    } else if (kind < 1.5){
      // THE LEAPING RAY, and the next two drawings of it, not yet made: blue kites standing on the next ovals of the plan
      float d = k - 4., kf = floor((dr + 2.)/3.) + d - 1.;
      live = 1. - step(0.5, abs(d)); fut = step(0.5, d);
      show *= step(-0.5, dr)*step(dr, 35.5)*step(-0.5, d)*(fut > 0.5 ? step(kf, 11.5) : 1.);
      t = fut > 0.5 ? (3.*kf + 1.5)/36. : (dr + 0.5)/36.;
    } else {
      // THE PLAN: twelve blue ovals along the arc of action, one for each drawing not yet made, set one after another when
      // the arc is pencilled. The ray rubs each out as it fills it.
      plan = 1.; t = (3.*k + 1.5)/36.;
      filled = xLeap - (3.*k + 1.)/12.;
      show *= step(planT0(a) + k*0.06, tau)*step(filled, 0.3)*(gLoop > 0.5 ? step(-1.4 + k*0.09, xLeap) : 1.);
    }
    vec3 C, hd, wg, nm; float flap; leapPose(a, l, t, C, hd, wg, nm, flap);
    float dist = length(toW(C) - cameraPosition);
    float st = stageOf(dist), cleanF = clamp((uStage.x - dist)/uStage.z, 0., 1.);
    float seed = aI.x*31. + k + kind*400. + a.i*0.37;
    float rough = part < 0.5 && live > 0.5 ? step(cleanF, u + 0.001) : 0.;
    float whip = sin(t*15. + 2. + a.i);
    vec2 p = markAt(part, j, n, aAB, rough, seed, whip), q = markAt(part, j + 0.5, n, aAB, rough, seed, whip);
    if (plan > 0.5){ float ps = st > 1.5 ? 0.85 : 0.4; p *= ps; q *= ps; }       // (an oval of the plan is only the mass of the body: a bead on the arc)
    float span = a.span*a.big;
    vec3 P = toW(place(p, C, hd, wg, nm, flap, span));
    vec3 Q = toW(place(q, C, hd, wg, nm, flap, span));
    // what is not yet drawn stands a little behind the drawing in hand, so no blue line ever crosses the bold ray
    if (live < 0.5 && flip < 0.5){ vec3 bk = normalize(P - cameraPosition + vec3(0., 1e-4, 0.))*0.6; P += bk; Q += bk; }
    // which marks exist at this stage of the drawing
    float blue = step(2.5, part);
    if (plan > 0.5) show *= part > 2.5 && part < 3.5 ? step(dist, 150.) : 0.;
#ifndef SEA
    if (plan > 0.5) show *= dist < 38. ? 1. : mod(k, 4.) < 0.5 ? step(dist, 66.) : 0.;      // (down the colonnade the beads thin out, then only the arcs stand)
#endif
    else if (fut > 0.5) show *= part < 0.5 ? step(dist, 150.) : 0.;
    else if (flip > 0.5) show *= 1. - blue;
    else if (blue < 0.5) show *= (1. - step(1.5, st))*(part < 0.5 ? 1. : step(0.999, cleanF));
    else show *= step(0.5, st)*(part < 3.5 || st > 1.5 ? 1. : 0.);     // a cleaned ray keeps no construction; a rough one is scribbled over its oval
    // value: stepped, never alpha. The drawing in hand is the sure bold line, thick and thin; what is to come is blue
    float press = 0.6 + 0.85*vnoise1(j*0.21 + seed), wt = 1., str = 1.;
    vec3 col = dist < 62. ? uGraphite : dist < 120. ? mix(uGraphite, uSmudge, 0.35) : mix(uGraphite, uSmudge, 0.6);
    wt = (dist < 14. ? 3.1 : dist < 32. ? 2.6 : dist < 62. ? 2.1 : 1.6)*(part > 0.5 ? 0.62 : 1.);
    if (fut > 0.5){ col = mix(uBlue, uPaper, k > 5.5 ? 0.3 : 0.); wt = 1.; press = 0.8; }
    if (plan > 0.5){ col = mix(uBlue, uPaper, filled >= 0. ? 0.6 : dist > 80. ? 0.3 : 0.); wt = dist < 45. ? 1.15 : 1.; press = 0.8; }
    if (blue > 0.5 && plan < 0.5){ col = uBlue; press = 0.8; wt = 1.; }
    if (part > 0.5 && part < 2.5) press *= 0.35 + 0.65*sin(3.1416*clamp(u, 0.02, 0.98))*(part > 1.5 ? 1.6*(1. - u) + 0.2 : 1.);
    if (flip > 0.5) wt = min(wt, part > 0.5 ? 1.3 : 2.1);
    if (live > 0.5 || flip > 0.5){
      wt *= mix(0.5, 1., smoothstep(0.1, 0.7, gOpen));
      // a dart keeps its outline (with the horns), its spine and its tail: the creases of the wings are for the open kite
      if (part > 0.5 && part < 1.5 && abs(aAB.x) > 0.05) show *= step(0.45, gOpen);
    }
    if (rough > 0.5){ press *= 0.85; wt = min(wt, 1.5); }
    vec3 o = boil(vec3(0.), seed + floor(j*0.25), live > 0.5 || flip > 0.5 ? clock12() : clock6(), dist);
    gl_Position = ribbon(P + o, Q + o, aV.z, press, wt, vPx);
    if (show < 0.5) gl_Position = vec4(0., 0., 2., 1.);
    if (live < 0.5 && flip < 0.5) str *= smoothstep(6., 11., dist);
    vW = P; vCol = col; vUVK = vec3(j*0.2, aV.z, show*str);
  }
`;

const HULL_VS = /* glsl */`
#ifdef SEA
  #define HULLSCALE gS
#else
  #define HULLSCALE 1.
#endif
  attribute vec3 aH;             // outline index j (centre: -1), ring (0 centre, 1 outline, 1.12 the smudge's overshoot), -
  attribute float aSlot; attribute vec2 aHK;        // aHK: 0 a held key | 1 the live ray, drawing number
  varying vec2 vPl; varying float vE, vDors, vTone, vSpan, vOpen; varying vec3 vW;
  void main(){
    Arch a = archOf(aSlot);
    float l, t, tone, show = bodyOf(a, aHK, l, t, tone);
    vec3 C, hd, wg, nm; float flap; leapPose(a, l, t, C, hd, wg, nm, flap);
    vOpen = gOpen;
    vec3 Cw = toW(C); float dist = length(Cw - cameraPosition);
    // (a body is there whatever the stage of the drawing: in the rough pass it is the scribbled ray's paper and tone)
    show *= step(dist, 112.);
    tone = dist < 46. ? 1. : dist < 80. ? 0.74 : 0.5;         // a value step paler with distance, never a fade
    vTone = tone;
    vec2 p = aH.x < -0.5 ? vec2(0., -0.05) : planAt(aH.x)*max(aH.y, 1.);
    vec3 r = rayLocal(p, flap);
    float span = a.span*a.big;
    vec4 w = vec4(toW(C + span*(r.x*wg + r.y*nm + r.z*hd)), 1.);
    vDors = dot(toWd(nm), cameraPosition - Cw); vPl = p*span*HULLSCALE; vSpan = span*HULLSCALE; vE = aH.y; vW = w.xyz;     // (planform in metres, whatever the length of a free leap)
    gl_Position = show > 0.5 ? projectionMatrix*viewMatrix*w : vec4(0., 0., 2., 1.);
  }
`;
const HULL_FS = /* glsl */`
  varying vec2 vPl; varying float vE, vDors, vTone, vSpan, vOpen; varying vec3 vW;
  uniform float uDark;           // 1: the smudged back whichever side faces us (the breaches: the one dark whole shape of their frame)
  float seg2(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba*clamp(dot(pa, ba)/max(dot(ba, ba), 1e-5), 0., 1.)); }
  void main(){
    float dist = max(length(vW - cameraPosition), 0.3), g = grainAt(vW, dist);
    float nz = vnoise2(vPl*1.3 + 7.), ph = hatchPhase(vPl, dist < 16. ? 0.25 : 0.3), fw = fwidth(ph);
    float ph2 = hatchPhase(vec2(vPl.y, -vPl.x), dist < 16. ? 0.29 : 0.34), fw2 = fwidth(ph2);
    float fp = max(length(fwidth(vPl)), 1e-4), lw = max(0.014, fp*0.7);
    vec3 col = uPaper;
    // (a ray further down the colonnade keeps its paper body but its tone is a value step paler)
    vec3 cSm = mix(uPaper, uSmudge, vTone), cGr = mix(uPaper, uGraphite, vTone);
    if ((vDors > 0. && uDark > -0.5) || uDark > 0.5){          // the dark back: tone, pressure, spine and ribs (backTone)
      gRibs = step(0.45, vOpen); gDeep = step(dist, 27.);
      vec4 c = backTone(vPl/max(vSpan, 0.1), vE, g, fp/max(vSpan, 0.1), vTone);
      if (c.a < 0.5) discard;
      col = c.rgb;
    } else {                  // white belly: paper, with the quick hatch on the side away from the sun circle
      if (vE > 1.) discard;
      float mh = vPl.x*0.5 - vPl.y*0.25 + 0.8*(nz - 0.5), m = step(0.0, mh);
      col = mix(uPaper, mix(cSm, cGr, 0.3), hatchCov(ph, fw, vPl)*m);
      vec2 pc = vec2(vPl.y, -vPl.x);                                 // cross-hatched where the belly turns furthest from the sun circle
      col = mix(col, mix(cSm, cGr, 0.5), hatchCov(ph2, fw2, pc)*step(0.75, mh)*step(dist, 60.));
      // two remoras ride under it: small dark fish, a lens of tone in line, the eye left as paper
      vec2 pn = vPl/max(vSpan, 0.1); float fpn = fp/max(vSpan, 0.1);
      float r1 = seg2(pn, vec2(0.11, -0.02), vec2(0.17, -0.40)) - 0.020*(1. - 0.7*smoothstep(-0.2, -0.42, pn.y));
      float r2 = seg2(pn, vec2(-0.27, 0.10), vec2(-0.37, -0.19)) - 0.018*(1. - 0.7*smoothstep(-0.02, -0.2, pn.y));
      float rm = min(r1, r2);
      col = mix(col, cSm, step(rm, 0.)*step(0.2, g)*step(fpn, 0.03));
      col = mix(col, uPaper, step(min(length(pn - vec2(0.118, -0.06)), length(pn - vec2(-0.283, 0.065))), 0.008)*step(fpn, 0.006));
      col = mix(col, cGr, (1. - smoothstep(0.003 + fpn*0.4, 0.003 + fpn*1.3, abs(rm)))*step(fpn, 0.03));
      vec2 g2 = vec2(abs(vPl.x), vPl.y); float dm = 1e3;
      for (int n = 0; n < 5; n++){ float fn = float(n); dm = min(dm, seg2(g2, vec2(0.26 + 0.03*fn, 0.42 - 0.17*fn), vec2(0.5 - 0.02*fn, 0.36 - 0.18*fn))); }
      dm = min(dm, seg2(g2, vec2(0., 0.86), vec2(0.2, 0.9)));
      col = mix(col, cGr, (1. - smoothstep(lw, lw + fp, dm))*0.9*step(fp, 0.2));
    }
    gl_FragColor = vec4(toScene(col), 1.);
  }
`;

function rayLineGeometry(keep = () => true) {
  const S = [[0, NPLAN, 0, 0, 0, 0], [1, 4, 0, 0.34, 0, -0.62], [1, 4, 0.13, 0.22, 0.64, -0.03], [1, 4, -0.13, 0.22, -0.64, -0.03],
    [2, 10, 0, -0.70, 0, -1.74], [3, 18, 0, 0, 0, 0], [4, 2, 0, 0.95, 0, -1.6], [4, 2, -1.25, -0.03, 1.25, -0.03]].filter((e) => keep(e[0]));
  const aV = [], aAB = [], idx = []; let v = 0;
  for (const [part, n, ax, ay, bx, by] of S) for (let j = 0; j <= n; j++) {
    for (let k = 0; k < 2; k++) { aV.push(part, j, k ? 1 : -1, n); aAB.push(ax, ay, bx, by); v++; }
    if (j < n) idx.push(v - 2, v - 1, v, v - 1, v + 1, v);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v * 3), 3));
  g.setAttribute('aV', new THREE.BufferAttribute(new Float32Array(aV), 4)); g.setAttribute('aAB', new THREE.BufferAttribute(new Float32Array(aAB), 4));
  g.setIndex(idx);
  return g;
}
function hullGeometry() {
  const aH = [-1, 0, 0], idx = [];
  for (let j = 0; j <= NPLAN; j++) aH.push(j, 1, 0, j, 1.12, 0);
  for (let j = 0; j < NPLAN; j++) { const a = 1 + j * 2; idx.push(0, a, a + 2, a, a + 1, a + 3, a, a + 3, a + 2); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(aH.length), 3));
  g.setAttribute('aH', new THREE.BufferAttribute(new Float32Array(aH), 3)); g.setIndex(idx);
  return g;
}

// the red arc of action with its spacing ticks: THE PLAN of a leap, pencilled in one stroke long before the ray leaps it.
// The ray rubs it out as it goes (the arc behind the ray is a step paler); half a second after the landing nothing is left.
const ARC_VS = /* glsl */`
  attribute vec4 aV;             // part (0 arc, 1 tick), j, side, n or tick number
  attribute float aSlot;
  varying vec3 vW, vCol; varying vec3 vUVK; varying float vPx;
  void main(){
    Arch a = archOf(aSlot);
    float tau = gTau, t0 = arcT0(a), press, seed = aSlot*3.1, ua;
    float xLeap = leapClock(a), tr = xLeap/3.;     // where the leaping ray is on it (above 1: it has landed)
    float fr = clamp(gLoop > 0.5 ? (xLeap + 1.4)/0.4 : (tau - t0)/0.4, 0., 1.), show = a.ok*step(t0, tau);
    vec3 p, q;
    if (aV.x < 0.5){
      float u = min(mix(-0.015, 1.015, aV.y/max(aV.w, 1.)), fr*1.03 - 0.015);
      p = arcPoint(a, 1., u); q = arcPoint(a, 1., u + 0.01); ua = u;
      press = 0.55 + 0.75*sin(3.1416*clamp(u, 0., 1.)) + 0.25*vnoise1(aV.y*0.4 + a.i);
    } else {
      float tk = (3.*aV.w + 1.5)/36.; ua = tk;
      vec3 c = arcPoint(a, 1., tk), e = arcPoint(a, 1., tk + 0.01) - c;
      vec3 nn = normalize(vec3(-e.y, e.x, 0.) + vec3(0., 1e-5, 0.))*(0.2 + 0.1*hash11(aV.w + a.i));
      p = c + nn*(aV.y*2. - 1.) + vec3(0.08*(hash11(aV.w*3. + a.i) - 0.5), 0., 0.); q = p + nn*0.5;
      show *= step(t0 + 0.45 + aV.w*0.05, tau)*(gLoop > 0.5 ? step(-0.95 + aV.w*0.05, xLeap) : 1.); press = 0.9;
    }
    vec3 P = toW(p), Q = toW(q);
    float dist = length(P - cameraPosition);
    vec3 bk = normalize(P - cameraPosition + vec3(0., 1e-4, 0.))*0.75; P += bk; Q += bk;      // (behind the bold ray and its blue drawings)
    if (aV.x > 0.5) show *= step(dist, 135.);          // spacing ticks finer than the line are left off
    show *= 1. - step(1.04, tr);                       // once the ray has landed nothing of the plan is left
    vec3 o = boil(vec3(0.), seed + floor(aV.y*0.2) + aV.x*9., clock6(), dist);
    gl_Position = ribbon(P + o, Q + o, aV.z, press, dist < 45. ? 2.1 : dist < 120. ? 1.7 : 1.4, vPx);
    if (show < 0.5) gl_Position = vec4(0., 0., 2., 1.);
    float rub = step(ua, tr), farA = 0.25*step(260., dist);         // far off the plan is a step paler
    vW = P; vCol = mix(uRed, uPaper, max(rub*0.42, farA)); vUVK = vec3(aV.y, aV.z, show*(1. - 0.25*rub)*smoothstep(5., 11., dist));
  }
`;
function arcGeometry(N = 40, ticks = 12) {
  const aV = [], idx = []; let v = 0;
  for (let j = 0; j <= N; j++) { aV.push(0, j, -1, N, 0, j, 1, N); v += 2; if (j < N) idx.push(v - 2, v - 1, v, v - 1, v + 1, v); }
  for (let k = 0; k < ticks; k++) { aV.push(1, 0, -1, k, 1, 0, 1, k, 1, 1, -1, k, 1, 1, 1, k); idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); v += 4; }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v * 3), 3));
  g.setAttribute('aV', new THREE.BufferAttribute(new Float32Array(aV), 4)); g.setIndex(idx);
  return g;
}
const slotAttr = (g, per = 1) => { const a = new Float32Array(NSLOT * per); for (let i = 0; i < a.length; i++) a[i] = i; g.setAttribute('aSlot', new THREE.InstancedBufferAttribute(a, 1)); g.instanceCount = a.length; return g; };

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = opts.detail ?? ctx.quality?.detail ?? 1;
  // the plain _part viewer cannot switch bloom off and bare paper is brighter than its threshold, so there (and only there)
  // the piece is drawn at half value: paper comes out a darker cream, the relations hold. Worlds get exact colour.
  const preview = opts.preview ?? false;      // (no page address is read: a world never needs it)
  const style = opts.style || makeStyle(opts.palette || PALETTE, { exposure: (opts.exposure ?? 1) * (preview ? 2.1 : 1), stage: opts.stage });
  const object = new THREE.Group(); object.name = 'arcade-of-leaps';
  const rayU = { uFlip: { value: new THREE.Vector2(-1, 0) }, uS: { value: 0 }, uSeed: { value: rng() * 50 }, uPlan: { value: planform(rng) },
    uSomer: { value: opts.somersault ? 1 : 0 }, uShadowLen: { value: opts.shadowLen ?? 0.45 }, uFlat: { value: 0 }, uDark: { value: 1 },
    // when each arch's ray takes off (s before the eye passes it; three seconds in the air): one in four lands well ahead of
    // the eye, its crown opening at the foot in front of us; one in four rises close in front and goes over the top as we pass
    uT2: { value: Array.from({ length: 34 }, (_, n) => (opts.takeoff && opts.takeoff[n - 2]) ?? (((n - 2) % 4 + 4) % 4 === 0 ? 4.6 : 2.0)) } };
  const withRay = (vs) => RAY_GLSL + vs;
  const add = (geo, mat, order = 0) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; object.add(m); return m; };
  const geos = [];

  if (opts.sky !== false) add(new THREE.SphereGeometry(2800, 16, 10), style.skyMaterial(), -0.5);
  if (opts.sea !== false) { const g = new THREE.CircleGeometry(1500, 48); g.rotateX(-Math.PI / 2); add(g, style.seaMaterial(10), -4); }
  await ctx.yield();

  // the leaping ray with the two blue drawings ahead of it (and, for the rare flip test only, five keys round the arc);
  // the twelve blue ovals of each arch's plan are a lighter ribbon set of their own
  const KEYS = [1, 3, 5, 7, 9, 11], NOVAL = detail < 0.8 ? 6 : 12;
  const rg = rayLineGeometry(), aI = [], aO = [], aF = [];
  for (let s = 0; s < NSLOT; s++) {
    for (const k of KEYS) aI.push(s, 0, k);
    aI.push(s, 1, 4); aF.push(s, 1, 5, s, 1, 6);
    for (let k = 0; k < NOVAL; k++) aO.push(s, 2, Math.round(k * 12 / NOVAL));
  }
  // the bodies: the leaping ray (and a flip-test key) has a paper hull with its thumb-smudged back, and a hatch shadow
  const bodyAttr = (g) => {
    const sl = [], hk = [];
    for (let s = 0; s < NSLOT; s++) { sl.push(s); hk.push(1, 0); for (const k of KEYS) { sl.push(s); hk.push(0, k); } }
    g.setAttribute('aSlot', new THREE.InstancedBufferAttribute(new Float32Array(sl), 1)); g.setAttribute('aHK', new THREE.InstancedBufferAttribute(new Float32Array(hk), 2));
    g.instanceCount = sl.length; return g;
  };
  rg.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array(aI), 3)); rg.instanceCount = aI.length / 3;
  const rayMat = style.lineMaterial(withRay(RAY_VS), rayU);
  add(rg, rayMat, 2); geos.push(rg);
  // THE PLAN STOPS AT THE RAY'S OUTLINE: everything not yet drawn (arcs of action, ticks, blue ovals, the blue kites ahead) is
  // laid first and writes no depth; the bodies are drawn after it, so no guide line ever crosses a ray, however the two stand
  const planMat = style.lineMaterial(withRay(RAY_VS), rayU); planMat.depthWrite = false;
  const og = rayLineGeometry((p) => p === 3);
  og.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array(aO), 3)); og.instanceCount = aO.length / 3;
  add(og, planMat, 0.5); geos.push(og);
  const fg = rayLineGeometry((p) => p === 0);
  fg.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array(aF), 3)); fg.instanceCount = aF.length / 3;
  add(fg, planMat, 0.5); geos.push(fg);
  await ctx.yield();
  const hg = bodyAttr(hullGeometry());
  const hullMat = new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, ...rayU }, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2,
    vertexShader: style.GLSL + RAY_GLSL + HULL_VS, fragmentShader: style.GLSL + BACK_GLSL + HULL_FS });
  add(hg, hullMat, 1); geos.push(hg);
  const ag = slotAttr(arcGeometry(48, 12));
  const arcMat = style.lineMaterial(withRay(ARC_VS), rayU); arcMat.depthWrite = false;
  add(ag, arcMat, 0.5); geos.push(ag);
  await ctx.yield();
  const sg = splashGeometry(rng);
  { const a = new Float32Array(NSLOT * 2); for (let i = 0; i < a.length; i++) a[i] = Math.floor(i / 2) * 4 + 2 + (i % 2); sg.setAttribute('aSlot', new THREE.InstancedBufferAttribute(a, 1)); sg.instanceCount = a.length; }
  add(sg, style.lineMaterial(withRay(SPLASH_VS), rayU), 2); geos.push(sg);
  const qg = new THREE.InstancedBufferGeometry();
  qg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1]), 3)); qg.setIndex([0, 2, 1, 0, 3, 2]); bodyAttr(qg);
  const shadowMat = new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, ...rayU, uMode: { value: 0 } }, side: THREE.DoubleSide,
    vertexShader: style.GLSL + RAY_GLSL + SHADOW_VS, fragmentShader: style.GLSL + TONE_FS });
  add(qg, shadowMat, 1); geos.push(qg);
  await ctx.yield();
  const lg = ribbonGeometry(laneStrokes(rng));
  const laneGuides = add(lg, style.lineMaterial(), 1); geos.push(lg);       // (round 20: handed to the world, which rubs them out under its paint)
  await ctx.yield();

  let override = null;
  const dbgS = opts.previewS ?? 0;            // metres to shift the lane clock by (for looking at the piece alone)
  const camL = new THREE.Vector3();
  const hero = {
    rayUniforms: rayU, laneGuides,
    object, style, radius: 40, height: 11, center: new THREE.Vector3(0, -1, 0), ground: false, groundY: 0,
    anchors: {
      axis: [0, 0, -1],                                   // the camera travels toward -Z (the piece's front faces +Z)
      laneStart: [0, 2, LANE.zStart], laneEnd: [0, 2, -LANE.zStart], footX: LANE.half,
      // a safe line: 60 m run-in, the lane 2 m above the water, the tip-up, the 20 degree climb to the peg hole
      flyThrough: [[0, 2, 260], [0, 2, 200], [0, 2, 100], [0, 2, 0], [0, 2, -100], [0, 2, -200], [0, 2.9, -210], [0, 9.7, -228.8], [0, 16.6, -247.6], [0, 23.4, -266.4]],
      portalSeat: { position: [0, 23.4, -266.4], facing: [0, -0.342, 0.94], radius: 7, tiltDeg: 20 },
      slots: [[-60, 23.4, -266.4], [60, 23.4, -266.4]],   // the two side peg slots of the lifted margin
      viewpoints: { axis: { from: [0, 2, 214], to: [0, 6, 0] }, under: { from: [0, 2, 60], to: [0, 7, 20] }, side: { from: [46, 4, 40], to: [0, 5, 0] } },
      arches: Array.from({ length: LANE.count }, (_, n) => { const i = n - 2; return { z: LANE.zStart - (6 + LANE.pitch * i), s: 6 + LANE.pitch * i, from: i < 19 ? -1 : 1, somersault: ((i % 4) + 4) % 4 === 3 }; }),   // two stand before the lane proper
      timing: { speed: LANE.speed, arcDrawn: -7.4, firstLeap: [-7.0, -4.0], secondLeap: [-4.35, -1.35], erased: [0.2, 1.1] },   // seconds relative to passing an arch
    },
    /** the rare flip test: seconds since the animator rolled the drawings (negative = off) and where on the lane (m) the wave starts */
    flipTest(t, fromS = rayU.uS.value) { rayU.uFlip.value.set(t, fromS); },
    /** metres down the lane (0 at the lane's start, 400 at its end); null hands the clock back to the camera's own position */
    setProgress(s) { override = s; },
    update(dt, time, camera) {
      if (!opts.style) style.update(time, ctx.renderer);
      object.updateWorldMatrix(true, false);
      camL.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(camL);
      rayU.uS.value = override ?? (LANE.zStart - camL.z + dbgS);
    },
    dispose() { for (const g of geos) g.dispose(); hullMat.dispose(); shadowMat.dispose(); if (!opts.style) style.dispose(); },
  };
  return hero;
}

// effects animation, on twos: loose loops (0-0.25 s), a clean crown with droplet circles (-0.55 s), two ellipses (-0.8 s) then rubbed out
const SPLASH_VS = /* glsl */`
  attribute vec4 aV; attribute vec2 aM;      // part (0 loops, 1 crown, 2 droplets, 3 ellipses), j, side, n | stroke number, random
  attribute float aSlot;                     // slot*4 + leap*2 + end (0 leaving the water, 1 landing)
  varying vec3 vW, vCol; varying vec3 vUVK; varying float vPx;
  vec3 splashPt(float part, float u, float m, float rnd, float age, float ph0){
    float th = u*6.2832;
    if (part < 0.5){ float g = 0.55 + age*2.6; th = th*1.18 + m*2.1; float ph = m*2.094 + ph0;
      vec2 lp = vec2(0.62*sin(th) + (m - 1.)*0.45, 1.05*(1. - cos(th)) + 0.1)*g; return vec3(lp.x*cos(ph), lp.y, lp.x*sin(ph)); }
    float g = 0.85 + (clamp(age, 0.25, 0.6) - 0.25)*1.1, R = 1.05*g;
    if (part < 1.5){ float sp = th*4. + ph0, tooth = floor(sp/3.14159);
      // scalloped rim: six leaves with round tops that lean outward and sharp valleys between them, every leaf its own height
      float yn = (0.42 + 0.58*pow(abs(sin(sp)), 0.7))*(0.7 + 0.3*hash11(tooth + ph0)), Rr = R*(1. + 0.42*yn);
      return vec3(Rr*cos(th), 0.1 + 1.3*g*yn, Rr*sin(th)); }
    // droplets: small circles thrown just clear of the leaf tips
    if (part < 2.5){ float an = ((floor(m*2. + 1.) + 0.5)*3.14159 - ph0)/4., r = 0.075 + 0.045*rnd;
      return vec3(cos(an)*R*1.42 + r*cos(th), (1.3 + 0.2*fract(rnd*7.3 + m*0.37))*g + r*sin(th), sin(an)*R*1.42); }
    float ge = 1. + (min(age, 1.15) - 0.7)*1.2, Re = (m < 0.5 ? 1.25 : 2.0)*ge; th = th*1.08 + m + ph0;
    return vec3(Re*cos(th), 0., Re*0.92*sin(th));
  }
  void main(){
    float slot = floor(aSlot/4. + 0.01), le = aSlot - slot*4., l = floor(le/2. + 0.01), e = le - l*2.;
    Arch a = archOf(slot);
#ifdef SEA
    float age = floor((leapClock(a) - e*3. + 0.04)*12.)/12.;
#else
    float age = floor((leapClock(a) - e*2.8 + 0.04)*12.)/12.;      // (the crown opens as the nose goes in, while the arch's foot is still in the frame)
#endif
    float part = aV.x, u = aV.y/aV.w, show = a.ok*step(0., age)*step(0.5, l);
    show *= part < 0.5 ? step(age, 0.24) : part < 2.5 ? step(0.25, age)*step(age, 0.94) : step(aM.x < 0.5 ? 0.25 : 0.7, age);     // the inner ellipse is the crown's foot
    vec3 F = arcPoint(a, l, e); F.y = 0.04;
#ifdef SEA
    float sc = a.span/2.5*(e > 0.5 ? 1.3 : 1.05), ph0 = a.i*2.3 + le;
#else
    float sc = a.span/2.5*(e > 0.5 ? 1.2 : 0.95), ph0 = a.i*2.3 + le;      // (a crown is a small, sure drawing: never larger than the ray that made it)
#endif
    if (part < 0.5) sc *= 0.6;                     // the first loose loops stay small: the crown is the drawing
    vec3 p = F + sc*splashPt(part, u, aM.x, aM.y, age, ph0), q = F + sc*splashPt(part, u + 0.02, aM.x, aM.y, age, ph0);
    vec3 Fw = toW(F);
    if (part > 0.5 && part < 1.5){
      // the crown is drawn as the animator would from the side: the row of leaves on our side stands, the far row lies low
      vec2 tc = cameraPosition.xz - Fw.xz; tc /= max(length(tc), 1e-3);
      vec2 dp = toW(p).xz - Fw.xz, dq = toW(q).xz - Fw.xz;
      float fp = dot(dp/max(length(dp), 1e-3), tc), fq = dot(dq/max(length(dq), 1e-3), tc);
      p.y = F.y + (p.y - F.y)*mix(0.3, 1., smoothstep(-0.45, 0.25, fp)); q.y = F.y + (q.y - F.y)*mix(0.3, 1., smoothstep(-0.45, 0.25, fq));
    }
    vec3 P = toW(p), Q = toW(q);
    float dist = length(Fw - cameraPosition), st = stageOf(dist);
    show *= 1. - step(1.5, st);
    // a near splash that the edge of the frame would cut is not drawn at all
    vec4 cF = projectionMatrix*viewMatrix*vec4(Fw, 1.);
    show *= max(step(34., dist), step(abs(cF.x), 0.78*cF.w))*(part < 2.5 ? step(9., dist) : step(3.5, dist));
#ifndef SEA
    show *= step(dist, 82.);
#endif
    float lev = step(45., dist) + step(95., dist) + step(150., dist), rub = step(1.15, age);
    vec3 col = lev < 0.5 ? uGraphite : lev < 1.5 ? mix(uGraphite, uSmudge, 0.6) : lev < 2.5 ? uSmudge : uPale;
    if (part < 0.5) col = mix(col, uSmudge, 0.6);
    if (part > 2.5) col = mix(col, uSmudge, 0.75);
    if (rub > 0.5) col = mix(uPale, uPaper, 0.45);
    if (st > 0.5 && part > 0.5 && part < 2.5) col = uBlue;          // not yet cleaned up: the crown is still construction
    float seed = aSlot*5.3 + aM.x*11. + part*3.;
    vec3 o = boil(vec3(0.), seed + floor(aV.y*0.25), rub > 0.5 ? clock6() : clock12(), dist)*1.6;
    gl_Position = ribbon(P + o, Q + o, aV.z, 0.7 + 0.5*vnoise1(aV.y*0.5 + seed), part > 0.5 && part < 1.5 ? (lev < 0.5 ? 2.4 : 1.6) : part < 2.5 ? 1.6 : 1.3, vPx);
    if (show < 0.5) gl_Position = vec4(0., 0., 2., 1.);
    vW = P; vCol = col; vUVK = vec3(aV.y*0.2, aV.z, show*(1. - 0.25*rub));
  }
`;
function splashGeometry(rng) {
  const S = []; for (let m = 0; m < 3; m++) S.push([0, 12, m]); S.push([1, 44, 0]); for (let m = 0; m < 4; m++) S.push([2, 8, m]); S.push([3, 24, 0], [3, 24, 1]);
  const aV = [], aM = [], idx = []; let v = 0;
  for (const [part, n, m] of S) { const r = rng(); for (let j = 0; j <= n; j++) {
    for (let k = 0; k < 2; k++) { aV.push(part, j, k ? 1 : -1, n); aM.push(m, r); v++; }
    if (j < n) idx.push(v - 2, v - 1, v, v - 1, v + 1, v);
  } }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v * 3), 3));
  g.setAttribute('aV', new THREE.BufferAttribute(new Float32Array(aV), 4)); g.setAttribute('aM', new THREE.BufferAttribute(new Float32Array(aM), 2)); g.setIndex(idx);
  return g;
}

// the hatch shadow of the live ray on the water: falls to the right (+x of the lane), steps with the ray
const SHADOW_VS = /* glsl */`
#ifdef SEA
  #define SEASCALE gS
  #define SHADOWP w.xz*mat2(uSun.x, -uSun.y, uSun.y, uSun.x)
#else
  #define SEASCALE 1.
  #define SHADOWP position.xz*size + a.i
#endif
  attribute float aSlot; attribute vec2 aHK;
  varying vec3 vW; varying vec2 vUv, vP; varying float vAmt;
  void main(){
    Arch a = archOf(aSlot);
    float l, t, tone, show = bodyOf(a, aHK, l, t, tone);
    vec3 C = arcPoint(a, l, t);
    float open = smoothstep(0.08, 0.4, t)*(1. - smoothstep(0.62, 0.94, t));
    vec2 size = a.span*a.big*vec2(mix(0.7, 1.25, open), 1.3);
    vec4 w = vec4(shadowAt(C) + toWd(vec3(position.x*size.x, 0., position.z*size.y))*SEASCALE + vec3(0., 0.05, 0.), 1.);
    vW = w.xyz; vUv = position.xz; vP = SHADOWP;
    float dist = length(w.xyz - cameraPosition);
    vAmt = show*step(dist, 112.)*(1. - 0.45*C.y/11.);
    gl_Position = vAmt > 0.01 ? projectionMatrix*viewMatrix*w : vec4(0., 0., 2., 1.);
  }
`;

// the animator's lane: blue guide lines, foot crosses, spacing ticks and arch numbers, drawn on the water (static, boiling at 6)
export const DIGITS = ['0212100002', '1210', '021211010010', '02121101111000', '020111121110', '120201111000', '120200101101', '021210', '01021210000111', '110102121000'];
function laneStrokes(rng) {
  const S = [], y = 0.035, H = LANE.half, z0 = LANE.zStart;
  const run = (x, yy, za, zb, press) => { const pts = []; const n = Math.ceil(Math.abs(zb - za) / 14); for (let i = 0; i <= n; i++) pts.push([x + (rng() - 0.5) * 0.05, yy, za + (zb - za) * i / n]); S.push({ pts, pencil: 1, press, taper: false, seed: rng() * 90 }); };
  // the guides start well before the first arch and overshoot (the animator ruled them in from the bottom of the sheet)
  run(-H, y, z0 + 96, -z0 - 9, 1.0); run(H, y, z0 + 88, -z0 - 13, 1.0); run(0, y, z0 + 110, -z0 - 62, 0.8);
  run(-H - 0.25, y, z0 - 60, -z0 + 40, 0.6);                                       // a second try at the left line that was never rubbed out
  run(H + 0.3, y, z0 + 70, z0 + 4, 0.6);                                           // and one at the right, near the start
  for (let i = -2; i < LANE.count - 2; i++) {
    const z = z0 - (6 + LANE.pitch * i), first = i < 2;
    for (const sx of [-1, 1]) {
      const x = sx * H, r = (first ? 0.95 : 0.45) + rng() * 0.2, a = rng.range(-0.2, 0.2), pn = first ? 1 : 5;
      S.push({ pts: [[x - r * Math.cos(0.8 + a), y, z - r * Math.sin(0.8 + a)], [x + r * Math.cos(0.8 + a), y, z + r * Math.sin(0.8 + a)]], pencil: pn, press: first ? 1.2 : 0.9, seed: rng() * 90 });
      S.push({ pts: [[x - r * Math.cos(-0.8 + a), y, z - r * Math.sin(-0.8 + a)], [x + r * Math.cos(-0.8 + a), y, z + r * Math.sin(-0.8 + a)]], pencil: pn, press: first ? 1.2 : 0.9, seed: rng() * 90 });
    }
    S.push({ pts: [[-0.5 - rng() * 0.2, y, z], [0.5 + rng() * 0.2, y, z + rng.range(-0.05, 0.05)]], pencil: 5, press: 0.8, seed: rng() * 90 });
    // the arch's number, pencilled upright in the air beside its right foot (as the arcs are), so it reads as we come down the lane
    const num = String(i + 3), s = first ? 0.52 : 0.4; let ox = H + 1.5;
    for (const ch of num) {
      const d = DIGITS[+ch], pts = [];
      for (let k = 0; k + 1 < d.length; k += 2) pts.push([ox + (+d[k] + (rng() - 0.5) * 0.12) * s + (+d[k + 1]) * s * 0.1, 0.45 + (+d[k + 1] + (rng() - 0.5) * 0.1) * s, z + 0.4]);
      if (pts.length > 1) S.push({ pts, pencil: first ? 7 : 5, press: first ? 1.5 : 1.0, taper: false, seed: rng() * 90 });
      ox += s * 1.6;
    }
    // (a short blue rule under it, the way a note is underlined)
    if (first) S.push({ pts: [[H + 1.2, 0.3, z + 0.4], [ox + 0.2, 0.34, z + 0.4]], pencil: 1, press: 0.9, seed: rng() * 90 });
  }
  return S;
}

/**
 * makeLeapPool(style, shared, o): free leaps on the open sea, drawn by the very shaders of the Arcade (arc of action first,
 * the plan ovals, one ray through it, crown splashes, hull, hatch shadow, the three stages by distance).
 * shared = hero.rayUniforms. o.leaps = [{ x, z, heading, phase, height, half, length, id, seed }] (metres, world space; the leap
 * crosses its spot along the heading; id a whole number, seed an optional fraction added to it where the leap's hash is seeded). o.skins = which drawings to draw: 4 the ray, 5 and 6 the blue kites on the next two ovals;
 * o.parts = (part) => bool to thin the ray's marks (3 and 4 are the blue oval and axes);
 * o.plan = how many blue ovals of the plan to draw along the arc (0 none, up to 12);
 * o.dark = the hull shows its smudged back from both sides; o.hull, o.shadow (bool); o.splash = [leap*2 + end, ...]; o.arc = [segments, ticks] or null.
 * o.keep = [Vector4, Vector4] two xz segments to stay clear of and o.keepR = Vector4(clearance, nx, nz, limit).
 * Window: o.window (side in metres of the square that wraps round the eye), o.from / o.to (shown when the eye will be that far
 * half way through the cycle), o.period (s), o.jitter (m the spot moves between cycles), o.scatter (rad of heading change).
 * Returns { group, set(clock, camX, camZ, velX, velZ), geos, mats } ; the caller disposes geos and mats.
 */
export function makeLeapPool(style, shared, o = {}) {
  const L = o.leaps, group = new THREE.Group(), geos = [], mats = [];
  const U = { ...shared, uS: { value: 0 }, uFlip: { value: new THREE.Vector2(-1, 0) }, uFlat: { value: typeof o.flat === 'number' ? o.flat : o.flat ? 1 : 0 }, uDark: { value: typeof o.dark === 'number' ? o.dark : o.dark ? 1 : 0 },
    uSea: { value: new THREE.Vector4(0, o.window ?? 1e6, o.from ?? 0, o.to ?? 1e6) }, uCamV: { value: new THREE.Vector4() },
    uSeaP: { value: new THREE.Vector3(o.period ?? 11.2, o.jitter ?? 0, o.scatter ?? 0) },
    uKeep: { value: Array.from({ length: 6 }, (_, i) => (o.keep && o.keep[i]) || new THREE.Vector4(0, 1e5, 0, 1e5)) }, uKeepR: { value: o.keepR ?? new THREE.Vector4(0, 0, 0, 1) } };
  const inst = (g, per, extra) => {
    const n = L.length * per, a0 = new Float32Array(n * 4), a1 = new Float32Array(n * 4);
    L.forEach((l, i) => { for (let k = 0; k < per; k++) { const v = (i * per + k) * 4;
      a0.set([l.x, l.z, l.heading, l.phase], v); a1.set([l.height, l.half, l.length, (l.id ?? i) + (l.seed ?? 0)], v); } });
    g.setAttribute('aL0', new THREE.InstancedBufferAttribute(a0, 4)); g.setAttribute('aL1', new THREE.InstancedBufferAttribute(a1, 4));
    if (extra) extra(g, n); g.instanceCount = n; geos.push(g); return g;
  };
  const add = (g, m, order) => { m.defines = { SEA: 1 }; const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = order; group.add(mesh); mats.push(m); return mesh; };
  const fut = (o.skins ?? [4]).filter((k) => k > 4), nPlan = o.plan ?? 0;
  const bodyInst = (g, n) => { const hk = new Float32Array(n * 2); for (let i = 0; i < L.length; i++) hk.set([1, 0], i * 2); g.setAttribute('aHK', new THREE.InstancedBufferAttribute(hk, 2)); };
  const kindInst = (kind, ks) => (g, n) => {
    const aI = new Float32Array(n * 3);
    L.forEach((l, i) => ks.forEach((k, j) => aI.set([(l.id ?? i) + (l.seed ?? 0), kind, k], (i * ks.length + j) * 3)));
    g.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 3));
  };
  const rayMat = style.lineMaterial(RAY_GLSL + RAY_VS, U);
  // (the plan is laid first and writes no depth, the bodies after it: no guide line crosses a ray; see buildHero)
  const planMat = style.lineMaterial(RAY_GLSL + RAY_VS, U); planMat.depthWrite = false;
  add(inst(rayLineGeometry(o.parts), 1, kindInst(1, [4])), rayMat, 2);
  if (fut.length) add(inst(rayLineGeometry((p) => p === 0), fut.length, kindInst(1, fut)), planMat, 0.5);
  if (nPlan) add(inst(rayLineGeometry((p) => p === 3), nPlan, kindInst(2, Array.from({ length: nPlan }, (_, k) => Math.round(k * 12 / nPlan)))), planMat, 0.5);
  if (o.hull) add(inst(hullGeometry(), 1, bodyInst), new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, ...U }, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2,
    vertexShader: style.GLSL + RAY_GLSL + HULL_VS, fragmentShader: style.GLSL + BACK_GLSL + HULL_FS }), 1);
  if (o.arc) { const am = style.lineMaterial(RAY_GLSL + ARC_VS, U); am.depthWrite = false; add(inst(arcGeometry(o.arc[0], o.arc[1]), 1), am, 0.5); }
  const sp = o.splash ?? [];
  if (sp.length) add(inst(splashGeometry(o.rng), sp.length, (g, n) => {
    const a = new Float32Array(n); L.forEach((l, i) => sp.forEach((le, k) => { a[i * sp.length + k] = (l.id ?? i) * 4 + le; }));
    g.setAttribute('aSlot', new THREE.InstancedBufferAttribute(a, 1));
  }), style.lineMaterial(RAY_GLSL + SPLASH_VS, U), 2);
  if (o.shadow) {
    const qg = new THREE.InstancedBufferGeometry();
    qg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1]), 3)); qg.setIndex([0, 2, 1, 0, 3, 2]);
    add(inst(qg, 1, bodyInst), new THREE.ShaderMaterial({ uniforms: { ...style.uniforms, ...U, uMode: { value: 0 } }, side: THREE.DoubleSide,
      vertexShader: style.GLSL + RAY_GLSL + SHADOW_VS, fragmentShader: style.GLSL + TONE_FS }), 1);
  }
  return { group, geos, mats, uniforms: U,
    set(clock, cx, cz, vx, vz) { U.uSea.value.x = clock; U.uCamV.value.set(cx, cz, vx, vz); } };
}
