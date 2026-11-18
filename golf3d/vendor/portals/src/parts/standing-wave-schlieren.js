// The Standing Wave (world "standing-wave-schlieren"): hero set piece + the colour-schlieren STYLE KIT.
//
// !! COORDINATES. The brief says "+X east/downwind, +Z north", but in three.js (+Y up) that is a mirror image: flying east
// and banking LEFT takes you toward -Z, and the brief's pictures need the Horn on the LEFT and the wave face on the RIGHT
// while running "north". So here NORTH IS -Z: ridge along x 0, col at the origin (110 m up), the Horn at z -1400, the ring at
// about (150, 250, -420). Negate every z in the brief's "space" paragraph. (opts.hornZ = +1400 builds the literal mirror.)
// The hero's local frame IS that world frame: add hero.object at the origin, unrotated, unscaled (the exit clearing is in
// world space). y 0 = cirque floor; the lee valley floor is y -700.
//
// STYLE KIT   const style = makeStyle(ctx, { palette?, grade?, bloomSafe?, fringePx? })   (pass it to buildHero as opts.style)
//   palette        { field, rim, black, amber, ultra, fringe }: linear THREE.Colors already solved backwards through the tone map so
//                  they PRINT as the brief's hexes at grade { exposure 1, saturation 1.05, contrast 1.04 } (the engine defaults).
//   uniforms       shared by every material: uTime, uRes, uCam, the inks, uAlphaCap (0.55), uPx (fringe px), the clearing.
//   update(dt, time, camera)   call every frame (buildHero's update already does).
//   makeField(r)   THE SKY: a dome of flat jade with the round mirror vignette; copy the camera's world position to it each frame.
//                  (polish round 6) GRADED: uniforms.uGrade (warm low, cool high, deep below the horizon) mixes a little of the two inks
//                  and the rim into the field by world direction, so no heading has one flat tone; (0, 0, 0) is the flat field.
//   solid(geo, { flat?, instances?, fringe?, black? })   SOLIDS: Group [black body, pale inverted-hull fringe 1.5 px]. Closed or
//                  heightfield meshes need smooth vertex normals (winding: normals outward/up). Flat cut-outs: geo = cutout(outline,
//                  map) and { flat: true }. Solids are drawn LAST (renderOrder 100/101, after all air), so black is never tinted.
//   blackMat, blackMaterial(o), fringeMaterial(o)   o.vertexDecl / vertexHook / vertexPost = GLSL to animate both passes alike; o.size
//                  (metres) thins the fringe on things a few pixels big. Use them through solid({ fringe, black }).
//   AIR (translucent, depthWrite off, normal blending, give every air mesh a renderOrder under 100):
//   sheetMaterial(o)   stream-sheets: attribute aInfo = (flow coordinate, stream coordinate, slope signal, fade). Hair streamlines
//                  >= 1.5 px whose period doubles with distance, dashes sliding downwind at 30 m/s, amber where the sheet rises
//                  downwind and ultramarine where it falls, a faint wash (uFill) and marbling only where it lies flat.
//   marbleMaterial(o)  curdled air (rotor, lenses, thermals, plumes, the ring): uv = marbling cells, attribute aRel = (relief: + amber
//                  / - ultramarine, fade, scroll rate). Cells never smaller than 1/30 of the frame. o.sway bends ribbons, o.streak rolls.
//   ribbonGeometry(o)  the crossed 128-triangle ribbon for thermals / the chimney plume (instance it, material marbleMaterial({ sway })).
//   makeThreads(n, o)  vortex threads, one draw call: userData.set(i, p0, d0, d1, length, strength, seed) + userData.commit().
//                  For the ride: set the two wingtip threads every frame; strength or uniforms.uLen lengthens them with speed.
//   setClearing(a, b, rA, rB)  a cone of blank field (no ink) along a world-space segment; buildHero sets it along the exit line.
//   glsl, sway     the shared GLSL (noise, swMarble, swInk, swHair, swLines, swClear) and the bird sideslip function.
// HOW EACH RULE IS KEPT: four inks = palette, nothing else is ever written; solids = solid(); no shading anywhere (every material
// is unlit, no fog, no lights); a line = swLines() hair or a thread; turbulence = swMarble(); depth = overlap + the LOD of lines
// and marbling; vignette = the field shader (dust rings and the thermal wobble are the world's garnish pass).
//
// THE HERO   const hero = await buildHero(ctx, { style, palette, detail, ... })
//   opts: style (shared makeStyle), palette (brief hexes), detail 0.6-1 (sheets 12/9/6, flock), field (false if the world adds its
//   own style.makeField()), horn (false to leave the tooth to the world's terrain; hero.flow.groundY(x, z) is the ridge + Horn
//   height the air was shaped to, use it as the terrain base), ringPos / ringDir, clearRadius, lenses (3), rotor (thickness), birds (100).
//   World-side opts added by the world builder: westFade [x0, x1] (sheets print nothing west of x0: still air over the cirque),
//   sheetKeep [k...] (which of the twelve sheets to build), gapPx / line / fill / graze [a, b] (hair spacing in px, hair and wash
//   strength, and a fade for sheets seen edge-on, so no view stacks more than a few layers), debugView 1-5 (part-viewer close-ups).
//   style.uniforms.uEast: air east of that world x is not drawn (the world sweeps it east as the camera climbs to the col; 1e9 = off).
//   RULED STREAMLINES (the wave as the instrument draws it; _heroRules, style.ruleMaterial): every station of constant z is one
//   hair following the sheet's profile, amber where it rises, ultramarine over the top and where it plunges, ending just over the
//   crest so the hook's outline stands on blank field. opts.rules (false = none), rulePlan [[sheet, reach m, every n-th station]...],
//   ruleReach, ruleNear, ruleEnd, ruleLine, ruleWidth; sheetKeep [] builds no sheet surfaces at all (the world does this);
//   sheetFar [d0, d1] fades surface hairs with distance. makeFlow opts.swellWidth: how fast the wave dies away from the Horn.
//   fringeMaterial o.near / o.far [d0, d1], o.low [y0, y1], o.down [a, b]: where a solid wears no hair (close under the eye, far
//   off, low on the lee, or looked down on), so black lying on black is not scribbled over.
//   ADDED IN FIX ROUND 1. ONE INK PER PIXEL: marbleMaterial writes a claim depth (SW_FAINT / SW_STRONG, just under the far
//   plane) so the first wash on a pixel keeps it and washes never mix to mauve; ruled hairs and threads test against it and stop
//   where curdled air begins. marbleMaterial o.hard (ink or field, no thin tint), o.lod false (no octave steps), o.mask (the
//   whole body claims its pixels: the rotor), o.barrel (shown with uBarrel), o.swayBase / o.swayFreq (ribbons in world metres).
//   Shared uniforms uBarrel (0 from outside the wave, 1 inside it) and uThread (birds' threads shown) are the world's to drive.
//   Rules carry aKind: 0 always, 1 hoop of the barrel (x uBarrel), -1 the figure (x 1 - uBarrel, unbroken, ignores the exit
//   clearing), 2 always and unbroken (the world's billows). opts.ruleSection { flow, lines, gap, first, train, far } rules THE
//   SECTION (the wave whole, in the Horn's plane); opts.laneNear, opts.lensBarrel. The rotor is one masked shell (rotor = thickness).
//   makeFlow opts tallScale / swellSouth [z0, z1, floor] exist for a lower or south-dying wave (not used by the world now).
//   ADDED IN FIX ROUND 4 (motion and ink). ruleMaterial: every hair is long full-ink dashes whose gaps travel along it with time
//   (o.speed flow metres a second, o.period / o.gap as fractions of the frame width; the period is an octave chosen from the
//   hair's own screen scale, never shorter than speed / 1.5 m next to the eye); a hair's strength shortens its dashes, it never
//   tints them. Threads are ruled the same way and start at their source. Hairs are 2 px and more and alpha 1 in their core, washes
//   reach alpha 1 (uAlphaCap 1 is the world's), so the four inks print at their hexes. The ring's streaks are unbroken helical
//   hairs of field on the tube's near wall. fringeMaterial o.thin: no hair across a flat cut-out seen edge-on.
//   ROUND 8: marbleMaterial o.lines (a cell ruled as nested closed hairs instead of a flat patch; opts.rotorLines for the rotor);
//   opts.birdMin (no bird of the flock under this fraction of the frame's width), opts.birdPlan (each shows its plan to the eye of
//   the barrel; the value is the roll), opts.birdThreads false (the far flock rules no strokes); choughGeometry is a swept chevron.
//   Also exported: choughGeometry(style) (the flat 3 m bird; userData.tip = wingtip), makeFlow (flow.nz0 = the crest noise offset).
//   Returns the contract plus: style, flow (makeFlow: groundY, ridgeAir, point(k, i, z), sheetLine(k, z)), ring (Object3D, movable),
//   sheets[], size (true extents), setProgress(u).
//   anchors (local = world): portalSeat { position, direction (travel, 40 deg up), facing, radius 7 }; flyThrough [9 points: 30 m
//   before the col, the col lane (10 m over the col floor, sheets 6 m above and below), the dive, north along the foot of the face
//   between sheets 0 and 1, then 70 m straight into the ring]; colLane; viewpoints { cirque, col, barrel } ({ position, lookAt });
//   hornTop, crest, trough, lip, rotorCenter, lenses[], birds[].
//   True size: x -3400..11000, y -420..3600, z +1550..-3350 (radius/height/center returned are only what the part viewer orbits).
//   Cost: about 145k triangles, 37 draw calls (12 sheets, rotor, lenses, ring 2, flock 2, threads, Horn 2, field), no lights,
//   no textures, about 160 ms build with no step over a few ms.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const PALETTE = ['#BFE3CF', '#050608', '#F2A33A', '#2438B8', '#EAF7EE', '#4F8F7C'];
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------
// GLSL shared by every air material: noise, the knife-edge ink rule, the exit clearing.
// ---------------------------------------------------------------------------------------------
const GLSL = /* glsl */`
uniform float uTime;
uniform vec2 uRes;
uniform vec3 uAmber, uUltra;
uniform float uAlphaCap;
uniform vec3 uClrA, uClrB; uniform vec2 uClrR;
uniform float uEast;   // air east of this world x is not drawn yet (the world sweeps it east as the camera climbs to the col)
float swEast(vec3 wp){ return 1. - smoothstep(uEast, uEast + 500., wp.x); }
float swHash(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float swNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(swHash(i), swHash(i+vec2(1.,0.)), f.x), mix(swHash(i+vec2(0.,1.)), swHash(i+vec2(1.,1.)), f.x), f.y); }
float swFbm(vec2 p){ return swNoise(p) * .65 + swNoise(p * 2.13 + 17.3) * .35; }
// domain-warped marbling, large and slow; returns ~-1..1 "density gradient" along +x of the noise domain
float swMarble(vec2 p, float t){
  p = mat2(.8, -.6, .6, .8) * p;                        // the lattice of the noise never lines up with a ribbon's edges
  vec2 w = vec2(swFbm(p * .6 + vec2(0., t * .11)), swFbm(p * .6 + vec2(31.7, -t * .09)));
  vec2 q = p + (w - .5) * 2.2;
  float e = .22;
  return clamp((swFbm(q + vec2(e, 0.)) - swFbm(q - vec2(e, 0.))) * 3.4, -1., 1.);
}
// THE RULE: signal g > 0 (density rising downwind) prints amber, g < 0 prints ultramarine, 0 prints nothing.
// (blending is in linear light, where the dark falling ink is swamped by the bright field: it needs more cover to print as itself)
vec4 swInk(float g, float a){ return g >= 0. ? vec4(uAmber, min(a, uAlphaCap)) : vec4(uUltra, min(a * 1.45, min(uAlphaCap * 1.25, 1.))); }
// hair lines are not washes: they may print up to 0.85
vec4 swHair(float g, float a){ return vec4(g >= 0. ? uAmber : uUltra, min(a, 1.)); }
// ONE INK PER PIXEL. Washes never mix (amber over ultramarine prints mauve, a fifth ink): the first wash drawn on a pixel
// claims it by writing one of two depths just under the far plane (solids, drawn last, are all nearer and are untouched).
// A strong fragment (SW_STRONG) may print over a faint edge (SW_FAINT) but never over another strong one; ruled hairs test
// against SW_STRONG too, so they stop where curdled air begins.
#define SW_FAINT .999998
#define SW_STRONG .999996
// soft capsule of undisturbed air (the exit line): 0 inside, 1 outside
float swClear(vec3 wp){
  vec3 ab = uClrB - uClrA; float h = clamp(dot(wp - uClrA, ab) / max(dot(ab, ab), 1e-4), 0., 1.);
  float d = length(wp - uClrA - ab * h);
  float r = mix(uClrR.x, uClrR.y, h);
  return smoothstep(r * .5, r, d);
}
// hair lines of constant c (metres), >= ~1.5 px, period doubling with distance. fw = fwidth(c) taken by caller.
// returns vec2(line alpha, id hash of the nearest line at the coarse level)
vec2 swLines(float c, float fw, float p0, float gapPx){
  float l = log2(max(gapPx * fw / p0, 1e-4));
  float fl = floor(l), f = l - fl;
  float pa = p0 * exp2(fl + 1.);
  float wpx = fw * 1.05;                                  // line width in metres of c
  float da = abs(fract(c / pa + .5) - .5) * pa;
  float db = abs(fract(c / pa * 2. + .5) - .5) * pa * .5;
  float la = 1. - smoothstep(wpx * .25, wpx * .75, da);
  float lb = (1. - smoothstep(wpx * .25, wpx * .75, db)) * (1. - f);
  return vec2(max(la, lb), swHash(vec2(floor(c / pa * 2. + .5), fl)));
}
`;

// ---------------------------------------------------------------------------------------------
// makeStyle(ctx, opts): the whole hand of the world. See header for what it returns.
// ---------------------------------------------------------------------------------------------
export function makeStyle(ctx, opts = {}) {
  const hex = opts.palette || PALETTE;
  const C = (i) => new THREE.Color(hex[i] || PALETTE[i]);
  // Tone-map compensation: the pipeline shows a flat linear colour c as grade(ACES(c * exposure / 0.6)), which is not the
  // hex you asked for. Each ink is therefore solved backwards (fixed-point) so that it PRINTS as its hex under the grade the
  // world will use (opts.grade = { exposure, saturation, contrast }, defaults = the engine's 1 / 1.05 / 1.04). Black is left alone.
  const G = Object.assign({ exposure: 1, saturation: 1.05, contrast: 1.04 }, opts.grade || {});
  const comp = (col) => {
    const fit = (v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081);
    const toS = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
    const fwd = (c) => {
      const x = c.map((v) => Math.max(v, 0) * G.exposure / 0.6);
      const a = [fit(0.59719 * x[0] + 0.35458 * x[1] + 0.04823 * x[2]), fit(0.076 * x[0] + 0.90834 * x[1] + 0.01566 * x[2]), fit(0.0284 * x[0] + 0.13383 * x[1] + 0.83777 * x[2])];
      let o = [1.60475 * a[0] - 0.53108 * a[1] - 0.07367 * a[2], -0.10208 * a[0] + 1.10813 * a[1] - 0.00605 * a[2], -0.00327 * a[0] - 0.07276 * a[1] + 1.07602 * a[2]].map((v) => clamp(v, 0, 1));
      const l = 0.2126 * o[0] + 0.7152 * o[1] + 0.0722 * o[2];
      return o.map((v) => toS(clamp((l + (v - l) * G.saturation - 0.5) * G.contrast + 0.5, 0, 1)));
    };
    const want = [col.r, col.g, col.b].map(toS); let c = [col.r, col.g, col.b];
    for (let it = 0; it < 160; it++) { const f = fwd(c); c = c.map((v, i) => clamp(v * Math.pow((want[i] + 0.02) / (f[i] + 0.02), 0.6), 1e-5, 6)); }
    return col.setRGB(c[0], c[1], c[2]);
  };
  const palette = { field: comp(C(0)), black: C(1), amber: comp(C(2)), ultra: comp(C(3)), fringe: comp(C(4)), rim: comp(C(5)) };
  // the true fringe hex needs a linear value near 2.5, which blooms. Unless the world runs with bloom off and says so
  // (opts.bloomSafe === false), hold its luminance under the bloom threshold: it prints as a slightly less white hair.
  if (opts.bloomSafe !== false) { const f = palette.fringe, l = 0.2126 * f.r + 0.7152 * f.g + 0.0722 * f.b; if (l > 0.85) f.multiplyScalar(0.85 / l); }
  const uniforms = {
    uTime: { value: 0 }, uRes: { value: new THREE.Vector2(800, 450) },
    uAmber: { value: palette.amber }, uUltra: { value: palette.ultra },
    uField: { value: palette.field }, uRim: { value: palette.rim }, uFringe: { value: palette.fringe },
    uAlphaCap: { value: 0.55 }, uPx: { value: opts.fringePx ?? 1.5 },
    uClrA: { value: new THREE.Vector3(0, -9999, 0) }, uClrB: { value: new THREE.Vector3(0, -9998, 0) }, uClrR: { value: new THREE.Vector2(1, 1) },
    uCam: { value: new THREE.Vector3() }, uEast: { value: 1e9 }, uBarrel: { value: 1 }, uThread: { value: 1 }, uLane: { value: 1 }, uLens: { value: 1 }, uFigClr: { value: 0 },
    uGrade: { value: new THREE.Vector3(0.3, 0.3, 0.4) }, uFigT: { value: new THREE.Vector2(0, 0) }, uFigG: { value: new THREE.Vector3(1, 1, 0) },   // FIX ROUND 2: the figure grows about its trough (base scale, gap scale, fan) as the eye flies in under it
  };
  const share = (extra = {}) => { const u = {}; for (const k in uniforms) u[k] = uniforms[k]; return Object.assign(u, extra); };
  // every mesh that needs the buffer size (field, fringes) calls hook(mesh): uRes follows the buffer being drawn
  const _sz = new THREE.Vector2();
  const hook = (mesh) => { mesh.onBeforeRender = (r, sc, cam) => { const rt = r.getRenderTarget(); if (rt) uniforms.uRes.value.set(rt.width, rt.height); else uniforms.uRes.value.copy(r.getDrawingBufferSize(_sz)); if (cam) uniforms.uCam.value.setFromMatrixPosition(cam.matrixWorld); }; return mesh; };

  // (1) FIELD: camera-following dome, flat jade, round mirror vignette from gl_FragCoord.
  function makeField(radius = 5000) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 2), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, uniforms: share(),
      vertexShader: `varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      // (polish round 6) THE GRADED FIELD. A colour-schlieren field is never one flat tone: the filter grades it. Fixed to the world
      // (not the glass), so every heading has its own ground: a warm band of the rising ink low over the land, the clear field at
      // mid-height, a deeper cool of the falling ink toward the zenith and downwind-low, all broad and soft (no edge anywhere), under
      // the mirror's vignette. uGrade = (warm, cool, deep) strengths, the world's to set per colourway.
      fragmentShader: `uniform vec3 uField, uRim, uAmber, uUltra, uGrade; uniform vec2 uRes; varying vec3 vDir;
        void main(){ vec2 d = (gl_FragCoord.xy - .5 * uRes) / max(.5 * length(uRes), 1.); float r = length(d);
          vec3 v = vDir / max(length(vDir), 1e-4); float e = v.y;
          float warm = (1. - smoothstep(-.02, .42, e)) * smoothstep(-.75, -.1, e) * (.75 + .25 * v.x);
          float cool = smoothstep(.18, .9, e) * (.8 - .2 * v.x);
          float deep = 1. - smoothstep(-.8, -.12, e);
          vec3 c = mix(uField, uAmber, warm * uGrade.x); c = mix(c, uUltra, cool * uGrade.y); c = mix(c, uRim, deep * uGrade.z);
          gl_FragColor = vec4(mix(c, uRim, smoothstep(.62, 1.04, r) * .9), 1.); }`,
    }));
    m.renderOrder = -0.5; m.frustumCulled = false; m.name = 'schlieren-field';
    return hook(m);
  }

  // (2) SOLIDS: flat black + inverted-hull fringe pushed out a screen-constant uPx along the projected normal.
  // For closed meshes use solid(geo) (smooth vertex normals needed). For flat cut-outs use solid(cutout(...), {flat:true}):
  // their 'normal' attribute holds the in-plane OUTWARD direction and the fringe is the same shape drawn a hair behind.
  // ORDER: air first (renderOrder < 100), solids last (body 100, fringe 101, in the transparent queue so they follow the air):
  // black is opaque to the instrument, so no air is ever printed over a solid, even air that is in front of it.
  const blackMat = new THREE.MeshBasicMaterial({ color: palette.black, fog: false, side: THREE.DoubleSide, transparent: true });
  const fringeVS = (decl, code, post) => /* glsl */`
    uniform vec2 uRes; uniform float uPx; uniform float uBack; uniform float uTime; uniform float uSize; uniform float uThin; uniform vec2 uNearF; uniform vec2 uLowF; uniform vec2 uDownF; uniform vec2 uFarF;
    ${decl}
    void main(){
      vec3 pos = position; vec3 nrm = normal;
      ${code}
      #ifdef USE_INSTANCING
      pos = (instanceMatrix * vec4(pos, 1.)).xyz; nrm = mat3(instanceMatrix) * nrm;
      #endif
      ${post}
      vec4 mv = modelViewMatrix * vec4(pos, 1.);
      vec3 mn = mat3(modelViewMatrix) * nrm;
      mv.xyz *= 1. + uBack;                                 // a hair further along the same ray: never in front of its own black
      vec4 cp = projectionMatrix * mv;
      vec4 cq = projectionMatrix * vec4(mv.xyz + mn * (.002 * max(-mv.z, 1.)), 1.);
      vec2 d = cq.xy / max(abs(cq.w), 1e-4) - cp.xy / max(abs(cp.w), 1e-4);
      d *= uRes; float l = length(d);
      d = l > 1e-5 ? d / l : vec2(0.);
      float px = uPx; if (uSize > 0.) px *= clamp(uSize * uRes.y / max(-mv.z, 1.) / 26., .0, 1.);   // uSize = object size in metres
      // o.thin (fix round 4): a flat cut-out seen nearly edge-on is a sliver of black; a full hair pushed out ACROSS it printed a white
      // patch bigger than the bird. The hair is dropped where its own direction is foreshortened away (l = the projected length of the
      // in-plane normal, against what it would be face-on)
      if (uThin > .5) px *= smoothstep(.15, .5, l / max(.002 * max(-mv.z, 1.) * projectionMatrix[1][1] / max(-mv.z, 1e-3) * uRes.y, 1e-6));
      vec3 wpF = (modelMatrix * vec4(pos, 1.)).xyz;
      // o.near: no hair close under the eye; o.far: none beyond a distance (a far forest seen from above is a black mass, not white dots); o.low: none on rock below a height; o.down: none on a thing looked down on (it lies on black)
      px *= smoothstep(uNearF.x, uNearF.y, -mv.z) * (1. - smoothstep(uFarF.x, uFarF.y, -mv.z)) * smoothstep(uLowF.x, uLowF.y, wpF.y) * (1. - smoothstep(uDownF.x, uDownF.y, (cameraPosition.y - wpF.y) / max(-mv.z, 1.)));
      cp.xy += d * (px * 2.) / uRes * cp.w;
      gl_Position = cp;
    }`;
  // o.vertexDecl / o.vertexHook / o.vertexPost: GLSL that may move 'pos' and 'nrm' before (object space) / after instancing, e.g. a wing beat;
  // give the SAME hook to blackMaterial(o) so hull and body move together.
  function fringeMaterial(o = {}) {
    return new THREE.ShaderMaterial({
      fog: false, transparent: true, side: o.flat ? THREE.DoubleSide : THREE.BackSide,
      uniforms: share(Object.assign({ uBack: { value: o.flat ? 0.004 : 0.0 }, uThin: { value: o.thin ? 1 : 0 }, uSize: { value: o.size ?? 0 }, uNearF: { value: new THREE.Vector2(o.near?.[0] ?? -2, o.near?.[1] ?? -1) }, uLowF: { value: new THREE.Vector2(o.low?.[0] ?? -1e6, o.low?.[1] ?? -9e5) }, uDownF: { value: new THREE.Vector2(o.down?.[0] ?? 1e5, o.down?.[1] ?? 1e6) }, uFarF: { value: new THREE.Vector2(o.far?.[0] ?? 1e8, o.far?.[1] ?? 2e8) } }, o.uniforms || {})),
      vertexShader: fringeVS(o.vertexDecl || '', o.vertexHook || '', o.vertexPost || ''),
      fragmentShader: `uniform vec3 uFringe; void main(){ gl_FragColor = vec4(uFringe, 1.); }`,
    });
  }
  function blackMaterial(o = {}) {
    return new THREE.ShaderMaterial({
      fog: false, transparent: true, side: THREE.DoubleSide, uniforms: share(Object.assign({ uBlack: { value: palette.black } }, o.uniforms || {})),
      vertexShader: `uniform float uTime; ${o.vertexDecl || ''}
        void main(){ vec3 pos = position; vec3 nrm = normal; ${o.vertexHook || ''}
        #ifdef USE_INSTANCING
        pos = (instanceMatrix * vec4(pos, 1.)).xyz;
        #endif
        ${o.vertexPost || ''}
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.); }`,
      fragmentShader: `uniform vec3 uBlack; void main(){ gl_FragColor = vec4(uBlack, 1.); }`,
    });
  }
  const fringeClosed = fringeMaterial({}), fringeFlat = fringeMaterial({ flat: true });
  // solid(geometry, {flat, instances}) -> Group [fringe hull, black]. With instances: n -> InstancedMesh pair sharing matrices
  // (set them with group.userData.setMatrixAt(i, m4) then group.userData.commit()).
  function solid(geo, o = {}) {
    const g = new THREE.Group(); const n = o.instances | 0;
    const mk = (mat) => (n ? new THREE.InstancedMesh(geo, mat, n) : new THREE.Mesh(geo, mat));
    const hull = hook(mk(o.fringe || (o.flat ? fringeFlat : fringeClosed))), body = mk(o.black || blackMat);
    hull.renderOrder = 101; body.renderOrder = 100; hull.frustumCulled = body.frustumCulled = !n && !o.noCull;
    g.add(body, hull); g.userData.hull = hull; g.userData.body = body;
    if (n) { g.userData.setMatrixAt = (i, m) => { hull.setMatrixAt(i, m); body.setMatrixAt(i, m); }; g.userData.commit = () => { hull.instanceMatrix.needsUpdate = body.instanceMatrix.needsUpdate = true; }; }
    return g;
  }
  return _styleAir(ctx, opts, { palette, uniforms, share, hook, makeField, blackMat, blackMaterial, fringeMaterial, solid, glsl: GLSL });
}

// GLSL: how a bird (and the thread it sheds) sideslips while holding station. seed.xy in 0..1.
const SWAY = /* glsl */`
vec3 swSway(vec2 seed, float t){
  float a = t * (.31 + seed.x * .23) + seed.y * 40., b = t * (.47 + seed.y * .19) + seed.x * 31.;
  return vec3(sin(a * .7) * 1.6 + sin(b * 1.9) * .5, sin(b) * 2.2 + sin(a * 2.3) * .6, sin(a) * 3.4 + cos(b * 1.3) * 1.3);
}`;
// the box of that sideslip: the farthest swSway carries a bird either way along x, y, z (the sums of its amplitudes above). Whoever
// keeps a swaying bird clear of a place counts with this box, so it is changed with the law or not at all.
const SWAY_BOX = [2.1, 2.8, 4.7];

function _styleAir(ctx, opts, S) {
  const { share, uniforms } = S;
  const airBase = { transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: THREE.NormalBlending };

  // (3a) STREAM-SHEET: attribute aInfo = (flow coordinate m [travel time * 30], stream coordinate c m, slope signal g, fade).
  // Hair streamlines of constant c with sliding dashes + faint drifting marbling; amber where the sheet rises downwind.
  function sheetMaterial(o = {}) {
    return new THREE.ShaderMaterial(Object.assign({}, airBase, {
      uniforms: share({ uSeed: { value: o.seed ?? 0 }, uPhase: { value: o.phase ?? 0 }, uFill: { value: o.fill ?? 0.065 }, uLine: { value: o.line ?? 0.8 },
        uGraze: { value: new THREE.Vector2(o.graze?.[0] ?? -1, o.graze?.[1] ?? -0.5) }, uFar: { value: new THREE.Vector2(o.far?.[0] ?? 1e8, o.far?.[1] ?? 2e8) }, uP0: { value: o.period ?? 3 }, uGap: { value: o.gapPx ?? 26 }, uCell: { value: o.cell ?? 520 }, uMarble: { value: o.marble ?? 0.5 }, uBreathe: { value: o.breathe ?? 2 } }),
      vertexShader: /* glsl */`uniform float uTime, uPhase, uBreathe; attribute vec4 aInfo; varying vec4 vInfo; varying vec3 vW;
        void main(){ vInfo = aInfo; vec3 p = position;
          p.y += uBreathe * sin(6.2832 * uTime / 8. + uPhase + position.x * .0016 + position.z * .0011);
          vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL + /* glsl */`
        uniform float uSeed, uFill, uLine, uP0, uGap, uCell, uMarble; uniform vec2 uGraze; uniform vec2 uFar; uniform vec3 uCam; varying vec4 vInfo; varying vec3 vW;
        void main(){
          float sF = vInfo.x - uTime * 30.; float c = vInfo.y + uSeed * 7.31;
          float fw = max(fwidth(c), 1e-5);
          float dist = distance(vW, uCam);
          float mb = swMarble(vec2(sF, c) / uCell + uSeed, uTime * .6);
          float flat_ = 1. - smoothstep(.07, .3, abs(vInfo.z));
          float g = vInfo.z * 1.6 + mb * uMarble * flat_;
          float fill = smoothstep(.05, .75, abs(g)) * uFill * (g < 0. ? .5 : 1.);
          vec2 ln = swLines(c, fw, uP0, uGap);
          float ld = log2(max(dist / 300., 1.)); float fl = floor(ld), ff = ld - fl; float dl = 36. * exp2(fl);
          float row = ln.y * 91.7;
          float d1 = swNoise(vec2(sF / dl + row, row)), d2 = swNoise(vec2(sF / (dl * 2.) + row, row + 5.));
          float dn = mix(d1, d2, ff);
          float dash = smoothstep(.42, .54, dn);
          float gl = g + (dn - .62) * .5 * flat_;
          float la = ln.x * dash * uLine * (1. - smoothstep(uFar.x, uFar.y, dist));   // full strength in both inks: a thinned ultramarine prints violet over amber
          float a = max(fill, la);
          float sg = la > fill ? gl : g;
          a *= vInfo.w * swClear(vW) * swEast(vW);
          // o.graze: a sheet seen edge-on prints nothing (keeps any view to a few layers); off by default
          vec3 gn = cross(dFdx(vW), dFdy(vW)); float gl2 = length(gn); vec3 gv = uCam - vW;
          float nv = gl2 > 1e-12 ? abs(dot(gn / gl2, gv / max(length(gv), 1e-4))) : 1.;
          a *= smoothstep(uGraze.x, uGraze.y, nv);
          if (a < .004) discard;
          gl_FragColor = swHair(sg, a);
        }`,
    }));
  }

  // (3b) MARBLE: curdled air (rotor shells, lenses, thermals, plumes). uv = marbling domain in cells (u scrolls: aRate cells/s),
  // attribute aRel = (relief signal added to the marbling [e.g. -1 upwind edge .. +1 lee edge => amber/blue flanks], fade, rate).
  // Cells are never drawn smaller than 1/30 of the frame width (they coarsen with distance instead).
  function marbleMaterial(o = {}) {
    return new THREE.ShaderMaterial(Object.assign({}, airBase, {
      side: o.side ?? THREE.DoubleSide, depthWrite: true, depthFunc: THREE.LessDepth,
      uniforms: share({ uLod: { value: o.lod === false ? 0 : 1 }, uMask: { value: o.mask ? 1 : 0 }, uMaskD: { value: o.maskDepth ?? 0.999996 }, uHard: { value: o.hard ? 1 : 0 }, uInBarrel: { value: o.barrel ? 1 : 0 }, uSwayB: { value: new THREE.Vector2(o.swayBase ?? 0, o.swayFreq ?? 1) }, uSeed: { value: o.seed ?? 0 }, uFill: { value: o.fill ?? 0.4 }, uRelief: { value: o.relief ?? 1 }, uCurdle: { value: o.curdle ?? 1 },
        uWarp: { value: o.warp ?? 0.25 }, uEdge: { value: o.edge ?? 0 }, uSway: { value: o.sway ?? 0 }, uSwayZ: { value: o.swayZ ?? 0 }, uSoft: { value: new THREE.Vector2(o.soft?.[0] ?? 0.1, o.soft?.[1] ?? 0.8) }, uStreak: { value: o.streak ?? 0 }, uStreakP: { value: o.streakPeriod ?? 0.5 }, uStreakH: { value: o.streakHelix ?? 0 }, uClearOn: { value: o.clear === false ? 0 : 1 }, uIso: { value: o.lines ?? 0 } }),   // o.lines (round 8): the curdling is DRAWN, not filled: each cell is a family of closed nested hairs (level lines of its own marbling, o.lines apart), see the fragment shader
      vertexShader: /* glsl */`uniform float uTime, uSway, uSwayZ; uniform vec2 uSwayB; uniform vec3 uCam; attribute vec3 aRel; varying vec2 vUv; varying vec3 vRel; varying vec3 vW; varying float vNV;
        void main(){ vRel = aRel; vUv = uv + vec2(uTime * aRel.z, 0.);
          vec3 p = position;
          #ifdef USE_INSTANCING
          p = (instanceMatrix * vec4(p, 1.)).xyz;
          #endif
          vec4 w = modelMatrix * vec4(p, 1.);
          // o.swayBase / o.swayFreq: for a ribbon built in world metres (the chimney plume) the sway is measured from its foot and its
          // ripples are metres long (per unit height they folded a 2 m ribbon into zigzags)
          float hgt = position.y - uSwayB.x; float sw = uSway * hgt * (sin(uTime * .9 + w.z * .31 + hgt * 2.1 * uSwayB.y) + .5 * sin(uTime * 2.3 + w.x * .17 + hgt * 5.3 * uSwayB.y)); w.x += sw; w.z += sw * uSwayZ;   // o.swayZ: the sway also shows to an eye looking downwind
          vW = w.xyz;
          vec3 n = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.)); vec3 v = uCam - w.xyz; vNV = abs(dot(n, v / max(length(v), 1e-4)));
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL + /* glsl */`
        uniform float uSeed, uFill, uRelief, uCurdle, uWarp, uEdge, uClearOn, uStreak, uStreakP, uLod, uMask, uMaskD, uHard, uInBarrel, uLens, uStreakH, uIso; uniform vec2 uSoft; varying vec2 vUv; varying vec3 vRel; varying vec3 vW; varying float vNV;
        void main(){
          // cells never under 1/30 of the frame: whole octaves on the finer axis (blended), a continuous stretch on the other
          float lx = uLod * max(0., log2(max(fwidth(vUv.x), 1e-6) * uRes.x / 30.)), ly = uLod * max(0., log2(max(fwidth(vUv.y), 1e-6) * uRes.x / 30.));   // o.lod false: big slow cells that need no coarsening (and no octave steps)
          float lm = min(lx, ly), fl = floor(lm), f = lm - fl;
          vec2 k = exp2(-fl) * vec2(exp2(-(lx - lm)), exp2(-(ly - lm)));
          float t = uTime * uWarp;
          float m = mix(swMarble(vUv * k + uSeed, t), swMarble(vUv * k * .5 + uSeed, t), f);
          float g = vRel.x * uRelief + m * uCurdle;
          float lim = uEdge > 0. ? smoothstep(0., uEdge, vNV) : 1.;
          float cover = smoothstep(uSoft.x, uSoft.y, abs(g)) * vRel.y * lim;
          // o.hard: ink or field and nothing between (a thin wash of amber on jade prints sand, which is not one of the four inks)
          // the exit clearing and the sweep east cut a wash off (at its ink's edge if hard, as a wipe if soft); they never thin it to a tint
          float ce = mix(1., swClear(vW) * swEast(vW), uClearOn);
          // (round 8) o.lines: TURBULENCE DRAWN IN HAIRS. A cell printed as one flat patch of ink read as cut paper stuck on a print of
          // 2 px lines. With o.lines the cell is ruled instead: the level lines of its own depth (how far the marbling stands over the
          // cell's edge), the first one the cell's outline, the rest nested inside it a level apart: closed curved families like the
          // rings of a fingerprint, two pixels wide at any range, never nearer one another than about seven pixels (whole octaves of
          // the level, so a far cell keeps its outline and loses inner rings), in the cell's own ink.
          float isoQ = (abs(g) - uSoft.x) / max(uSoft.y - uSoft.x, 1e-4) * vRel.y * lim * mix(1., swClear(vW) * swEast(vW), uClearOn);
          float isoF = max(length(vec2(dFdx(isoQ), dFdy(isoQ))), 1e-5);   // (round 9) the true slope: fwidth overstates it on a diagonal by up to 1.4, and the ring was a ragged pale pixel there
          if (uHard > .5) { cover *= ce; float fwc = max(fwidth(cover), 1e-4); cover = smoothstep(.38 - fwc, .38 + fwc, cover); ce = 1.; }   // a two-pixel edge at any range (a fixed band blurred to a tint where the cover changes slowly)
          if (uIso > 0.) { float stp = uIso * exp2(clamp(ceil(log2(max(isoF * 7. / uIso, 1e-6))), 0., 6.)), lv = max(isoQ - .42, 0.) / stp;
            float dpx = abs(lv - floor(lv + .5)) * stp / isoF;
            cover = step(.42, isoQ + isoF) * clamp(max(1.25, uRes.y * .0028) + .5 - dpx, 0., 1.)   /* (round 9) the weight of every other hair: two and a half pixels of full ink */ * step(lv, 9.5) * (lv < .5 ? 1. : step(stp, isoF * 64.)) * mix(1., step(.3, vRel.y * lim), step(.5, uMask)); ce = 1.; }   // (no ring on the flat crown of a cell, where the next level is over a tenth of the frame away: it was a stray little loop)
          float a = cover * uFill * smoothstep(.45, .55, ce)
            * mix(1., smoothstep(1. - uLens, 1.04 - uLens, cover), uInBarrel);   // o.barrel: the wash swells out of its core at full ink (an alpha fade would print grey, a fifth ink)
          a = uIso > 0. ? a : min(a, uAlphaCap);
          // optional streaks: bands of constant v that the wash leaves blank, their dashes sliding along u (the ring rolling)
          // (fix round 2: FINE streaks, a hair of field each, long dashes; the old half-width bands printed square blocks)
          if (uStreak > 0.) { float sv = (vUv.y + vUv.x * uStreakH) / uStreakP, id = floor(sv), band = abs(fract(sv) - .5) * 2., fs = max(fwidth(sv) * 2., 1e-4);   // o.streakHelix: the streaks wind round the tube
            // (fix round 4) each streak is one unbroken hair of field, two pixels and more wide, never nearer its neighbour than 9 px:
            // far off every second one is ruled (whole octaves, and the helix still closes), so there are no rows of dots
            // The octave is taken from the RANGE of the eye (one value for the whole ring: an octave per pixel broke each streak where the tube turns away)
            float spx = 1.6 * uRes.y / (1.2 * max(distance(vW, cameraPosition), 1.));            // px between neighbouring streaks, all ruled
            float kS = exp2(-clamp(ceil(log2(9. / max(spx, 1e-3))), 0., 2.));
            float fsv = max(fs * .5, 1e-5), bpx = abs(fract(sv * kS) - .5) / (fsv * kS);
            a *= 1. - uStreak * step(2.2, spx) * clamp(max(.8, .002 * uRes.y) + .5 - bpx, 0., 1.); }
          // o.mask: the whole body of this air (a roll of turbulence) claims its pixels, printed or not: no hair is ruled across it
          bool body = uMask > .5 && vRel.y * lim > .3;
          if (a < .004 && !body) discard;
          vec4 ink = uIso > 0. ? swHair(g, a) : swInk(g, a);
          gl_FragDepth = ink.a > .3 ? SW_STRONG : body ? uMaskD : SW_FAINT;
          gl_FragColor = ink;
        }`,
    }));
  }

  // (3c) VORTEX THREAD: instanced ribbon = one twisted pair of hairs (amber + ultramarine) along a quadratic streamline.
  // Instance attributes: iP0 (start), iD0 / iD1 (unit tangents at start / end), iPar (seed x, seed y, length m, 0..1 strength).
  function threadMaterial(o = {}) {
    return new THREE.ShaderMaterial(Object.assign({}, airBase, {
      depthFunc: THREE.LessDepth,
      uniforms: share({ uLen: { value: 1 }, uSpeed: { value: o.speed ?? 40 }, uSwayAmt: { value: o.sway ?? 1 }, uShow: o.always ? { value: 1 } : uniforms.uThread }),
      vertexShader: SWAY + /* glsl */`
        uniform float uTime, uLen, uSpeed, uSwayAmt, uEast, uShow; uniform vec2 uRes; uniform vec3 uCam; uniform vec2 uFigT; uniform vec3 uFigG;
        attribute vec3 iP0, iD0, iD1; attribute vec4 iPar; varying vec3 vT; varying vec2 vSeed;
        void main(){
          float t = position.x; float L = iPar.z * uLen;
          float figK = iPar.w > 1.5 ? uFigG.x : 1.;                    // strength 2: a thread of the figure's own birds, growing with the figure
          vec3 b1 = iD0 * (L * .5), b2 = b1 + iD1 * (L * .5);
          vec3 p = iP0 + b1 * (2. * t * (1. - t)) + b2 * (t * t);
          p.xy = uFigT + (p.xy - uFigT) * figK;
          vec3 tg = b1 * (1. - t) + (b2 - b1) * t;
          p += swSway(iPar.xy, uTime - t * L / uSpeed * .3) * uSwayAmt;   // (round 7) the stroke rides with its bird: a longer lag bent it into an S
          vec4 w = modelMatrix * vec4(p, 1.);
          vec3 v = w.xyz - uCam; float dist = max(length(v), 1e-3);
          vec3 sd = cross(mat3(modelMatrix) * tg, v); float sl = length(sd); sd = sl > 1e-5 ? sd / sl : vec3(0., 1., 0.);
          float pxm = dist * 2. / max(uRes.y, 1.) * .6;                 // ~metres per pixel at 60 deg fov
          float hw = pxm * 2.7;                                        // (round 7) one stroke of the hook's weight at any range: wider, the pair opened into two 1 px lines that wound round each other
          w.xyz += sd * position.y * hw;
          vT = vec3(t, position.y, hw / pxm); vSeed = vec2(iPar.x, min(iPar.w, 1.) * uShow * (1. - smoothstep(uEast, uEast + 500., w.x)));
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL + /* glsl */`
        varying vec3 vT; varying vec2 vSeed;
        void main(){
          float t = vT.x, v = vT.y; float hpx = max(vT.z, 1.);
          float ph = 6.2832 * (2.5 * t * (1. - .45 * t) + vSeed.x * 3.) - uTime * 2.2;
          float open = 0.; float amp = .72 * open; float y1 = cos(ph) * amp + .3 * (1. - open), y2 = -y1;   // far off: two parallel hairs
          float w = 1. / hpx;                                            // half line width in v units (a 2 px line: its core is wholly ink)
          float a1 = 1. - smoothstep(w * .6, w * 1.4, abs(v - y1)), a2 = 1. - smoothstep(w * .6, w * 1.4, abs(v - y2));
          // full ink or absent: the thread unwinds into dashes toward its end, and is shown or hidden dash by dash
          // (fix round 4) ruled like every hair: long dashes whose gaps travel downwind along the thread, in octaves of its own
          // length (a period is 8 to 17 percent of the frame); toward its end, and as it is shown or hidden, the dashes shorten
          float ft = max(fwidth(t), 1e-5);
          float N = clamp(exp2(floor(log2(1. / (ft * uRes.x * .085)))), 1., 8.);
          float dpT = ft * N;
          float gapT = max(max(3.5, uRes.x * .011) * dpT, .06);
          float duty = clamp(min((1. - t) * 2.6, (vSeed.y - .05) / .9), 0., 1.);
          float inkT = min(1. - gapT, duty);
          float life = step(.002, t) * clamp((inkT * .5 - abs(fract((t - uTime * .3 + vSeed.x * 7.) * N) - .5)) / dpT + .5, 0., 1.) * step(4. * dpT, inkT);
          float a = max(a1, a2) * life;
          if (a < .01) discard;
          gl_FragDepth = SW_STRONG;                                      // (never written) a thread stops where curdled air begins
          gl_FragColor = swHair(a1 >= a2 ? 1. : -1., a);
        }`,
    }));
  }
  // (3d) RULED STREAMLINES: the wave drawn the way the instrument draws it, one hair per streamline. A merged ribbon mesh;
  // each line lies in a plane of constant z and is widened to a screen-constant hair in the vertex shader.
  // Attributes: position (the streamline), aTan (unit tangent in xy), aRule (flow coordinate, signal g: + amber / - ultramarine,
  // fade, side -1/+1), aLod (distance beyond which this line is not ruled: far lines are ruled wider apart; row seed 0..1).
  function ruleMaterial(o = {}) {
    return new THREE.ShaderMaterial(Object.assign({}, airBase, {
      depthFunc: THREE.LessDepth, defines: o.fig ? { SW_FIG: 1 } : o.t3 ? { SW_T3: 1 } : {},   // o.t3: lines that leave the plane of constant z carry a 3D tangent (aT3); o.decl / o.hook: vertex code run on p (the line's own motion)
      uniforms: share({ uClaimD: { value: o.claim ?? 0.999996 }, uLine: { value: o.line ?? 1 }, uWidth: { value: o.width ?? 0.0045 }, uBreathe: { value: o.breathe ?? 2 }, uSpeed: { value: o.speed ?? 30 }, uPer: { value: o.period ?? 0.12 }, uGap: { value: o.gap ?? 0.011 }, uPmin: { value: 4 * Math.pow(2, Math.ceil(Math.log2(Math.max(Math.abs(o.speed ?? 30) / 1.5 / 4, 1)))) } }),   // o.speed: flow metres a second the gaps travel; o.period / o.gap: dash period and gap as fractions of the frame width
      vertexShader: /* glsl */`uniform float uTime, uBreathe, uEast, uWidth, uBarrel, uLane; uniform vec2 uRes; uniform vec3 uCam; uniform vec2 uFigT; uniform vec3 uFigG;
        attribute vec2 aTan; attribute vec4 aRule; attribute vec3 aLod; attribute float aKind; varying vec4 vR; varying vec3 vW; varying vec3 vH;
        #ifdef SW_FIG
        attribute vec4 aFig;   // (offset from the base streamline x, y; growth weight 0 upstream of the trough .. 1; fan weight)
        #endif
        #ifdef SW_T3
        attribute vec3 aT3;
        #endif
        ${o.decl || ''}
        void main(){
          vec3 p = position;
          ${o.hook || ''}
          #ifdef SW_FIG
          p.xy = uFigT + (position.xy - uFigT) * mix(1., uFigG.x, aFig.z) + aFig.xy * mix(1., uFigG.y * (1. + uFigG.z * aFig.w), aFig.z);
          #endif
          p.y += uBreathe * sin(6.2832 * uTime / 8. + aLod.y * 6.2832 + position.x * .0016 + position.z * .0011);
          vec4 w = modelMatrix * vec4(p, 1.);
          vec3 v = w.xyz - uCam; float dist = max(length(v), 1e-3);
          #ifdef SW_T3
          vec3 sd = cross(mat3(modelMatrix) * aT3, v);
          #else
          vec3 sd = cross(mat3(modelMatrix) * vec3(aTan, 0.), v);
          #endif
          float sl = length(sd); sd = sl > 1e-5 ? sd / sl : vec3(0., 0., 1.);
          float pxm = dist * 2. / max(projectionMatrix[1][1] * uRes.y, 1.);          // metres per pixel at this distance
          float hw = max(2., uRes.y * uWidth) * .5;                                  // half the hair, px (two pixels at least: one of them is always wholly ink, so the hair prints its hex)
          w.xyz += sd * aRule.w * (hw + 1.) * pxm;
          float lod = (1. - smoothstep(aLod.x * .7, aLod.x, dist)) * smoothstep(aLod.z * .4, max(aLod.z, 1e-3), dist + 1e-3) * (aKind > 1.5 ? 1. : aKind > .5 ? uBarrel : aKind < -.5 ? 1. : uLane);   // aKind 1: a hoop of the barrel, ruled only once the eye is inside it; -1: the figure seen from outside; 2: always, and unbroken like the figure
          vR = vec4(aRule.x, aRule.y, aRule.z * lod * (1. - smoothstep(uEast, uEast + 500., w.x)), aRule.w);
          vH = vec3(hw, aLod.y, aKind); vW = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: GLSL + /* glsl */`
        uniform float uLine, uSpeed, uPer, uGap, uPmin, uFigClr, uClaimD; uniform vec3 uCam; varying vec4 vR; varying vec3 vW; varying vec3 vH;
        void main(){
          float d = abs(vR.w) * (vH.x + 1.);
          float a = clamp(vH.x + .5 - d, 0., 1.);
          // FIX ROUND 4: THE AIR POURS. Every hair is ruled as long full-ink dashes whose gaps TRAVEL along it: the phase is the
          // flow coordinate minus time * speed, so the gaps stream while the eye and the shape stand still. The dash period is a
          // whole octave of 4 m chosen from the flow metres one pixel covers ALONG the hair (taken from the derivative, so it holds
          // at any range, growth or foreshortening): a period is 12 to 24 percent of the frame width (o.period), a gap about 1 percent of it,
          // never under 3.5 px. Octaves share their gaps (same phase, twice the period), so a hair running into the distance keeps
          // its gaps where two octaves meet. Rows are staggered by the hair's seed: gaps never line up into spokes.
          float sF = vR.x;
          float mpp = max(length(vec2(dFdx(sF), dFdy(sF))), 1e-5);
          float P = max(4. * exp2(ceil(log2(mpp * uRes.x * uPer / 4.))), uPmin);     // uPmin: next to the eye a period is long enough that a pixel sees under 1.5 gaps a second
          float ph = (sF - mod(uTime * uSpeed, 65536.) + vH.y * 977.3) / P;
          float dph = mpp / P;                                                        // phase per pixel along the hair
          float gapW = max(max(3.5, uRes.x * uGap) * dph, .06);                       // the gap, in phase (next to the eye: 6 percent of the period, a streak of field)
          float g = vR.y;
          // A HAIR IS AT FULL INK OR ABSENT (an alpha fade prints a tint, a fifth ink): the strength of a line (its ends, its
          // range, the sweep east, the clearing) only decides how much of each PERIOD is ruled: toward its end a hair's dashes
          // shorten, still at full ink and still travelling, and a dash under 4 px is not ruled at all (no sparkle)
          bool whole = abs(vH.z - .5) > 1.;
          float s = (whole ? mix(1., swClear(vW), vH.z < 0. ? uFigClr : 0.) : smoothstep(.03, .1, abs(g)) * swClear(vW)) * vR.z;
          float kk = whole ? .3 : .9;
          float duty = clamp((s - .5 + kk * .5) / kk, 0., 1.);
          float ink = min(1. - gapW, duty);                                           // ruled part of the period
          float dd = abs(fract(ph) - .5);
          a *= clamp((ink * .5 - dd) / max(dph, 1e-6) + .5, 0., 1.) * step(4. * dph, ink) * uLine;
          if (a < .01) discard;
          gl_FragDepth = uClaimD;                                                     // (never written: hairs only test against claimed washes; o.claim .999997 = these hairs also stop at a mask of o.maskDepth .999997, which nearer hairs print over)
          gl_FragColor = swHair(g, a);
        }`,
    }));
  }
  return _styleGeo(ctx, opts, Object.assign(S, { sheetMaterial, marbleMaterial, threadMaterial, ruleMaterial, sway: SWAY, swayBox: SWAY_BOX }));
}

function _styleGeo(ctx, opts, S) {
  const { uniforms } = S;
  // cutout(points, map): a flat black shape from an outline [[u,v],...] (either winding). map(u,v) -> [x,y,z] places it in 3D
  // (default the XY plane). Its 'normal' attribute is the in-plane OUTWARD direction, which is what the flat fringe needs.
  function cutout(points, map = (u, v) => [u, v, 0]) {
    const n = points.length; let pts = points.map((p) => new THREE.Vector2(p[0], p[1]));
    if (THREE.ShapeUtils.isClockWise(pts)) pts = pts.reverse();
    const tris = THREE.ShapeUtils.triangulateShape(pts, []);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n];
      let ex = b.x - a.x, ey = b.y - a.y, fx = c.x - b.x, fy = c.y - b.y;
      const el = Math.hypot(ex, ey) || 1, fl = Math.hypot(fx, fy) || 1;
      let ox = ey / el + fy / fl, oy = -ex / el - fx / fl; const ol = Math.hypot(ox, oy) || 1; ox /= ol; oy /= ol;   // CCW outline: outward = right of travel
      const P = map(b.x, b.y), Q = map(b.x + ox * 0.01, b.y + oy * 0.01);
      const dx = Q[0] - P[0], dy = Q[1] - P[1], dz = Q[2] - P[2], dl = Math.hypot(dx, dy, dz) || 1;
      pos.set(P, i * 3); nor.set([dx / dl, dy / dl, dz / dl], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setIndex(tris.flat());
    return g;
  }
  // ribbonGeometry: unit ribbon(s) for thermals and plumes, y 0..1, x -1..1 (crossed: a second one in the YZ plane).
  // uv = marbling cells (cellsU across, cellsV up; rate scrolls it upward), aRel.x = cross coordinate (upwind edge amber, lee blue).
  function ribbonGeometry(o = {}) {
    const segs = o.segs ?? 8, cu = o.cellsU ?? 1.2, cv = o.cellsV ?? 6, rate = o.rate ?? -0.35, planes = o.crossed === false ? 1 : 2;
    const pos = [], uv = [], rel = [], nor = [], idx = [];
    for (let pl = 0; pl < planes; pl++) for (let j = 0; j <= segs; j++) for (let i = 0; i <= 4; i++) {
      const x = i / 2 - 1, y = j / segs;
      const w = 0.55 + 0.45 * Math.sin(y * Math.PI * 0.9 + 0.2);
      pos.push(pl ? 0 : x * w, y, pl ? x * w : 0); nor.push(pl ? 1 : 0, 0, pl ? 0 : 1);
      uv.push(x * cu + pl * 3.7, y * cv);
      rel.push(-x * 0.9, (1 - x * x * x * x) * smoothstep(0, 0.12, y) * (1 - smoothstep(0.7, 1, y)), 0);
    }
    for (let pl = 0; pl < planes; pl++) for (let j = 0; j < segs; j++) for (let i = 0; i < 4; i++) {
      const a = pl * (segs + 1) * 5 + j * 5 + i; idx.push(a, a + 1, a + 6, a, a + 6, a + 5);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const r = new Float32Array(rel); for (let i = 2; i < r.length; i += 3) r[i] = 0; g.setAttribute('aRel', new THREE.BufferAttribute(r, 3));
    g.userData.rate = rate; g.setIndex(idx);
    // the upward scroll is in uv.y, which the marble shader does not scroll: bake it as a uv shear instead (u scrolls) by swapping axes
    const u = g.attributes.uv.array; for (let i = 0; i < u.length; i += 2) { const a = u[i]; u[i] = u[i + 1]; u[i + 1] = a; }
    for (let i = 2; i < r.length; i += 3) r[i] = rate;
    return g;
  }
  // makeThreads(n, o): n vortex threads in one draw call. set(i, p0, d0, d1, length, strength) with THREE.Vector3s (world/local
  // space of the mesh); seeds are fixed per thread. Call commit() after changing any. mesh.material.uniforms.uLen scales all lengths.
  function makeThreads(n, o = {}) {
    const segs = o.segs ?? 24, rng = o.rng || ctx.rng;
    const pos = [], idx = [];
    for (let i = 0; i <= segs; i++) { const t = i / segs; pos.push(t, -1, 0, t, 1, 0); }
    for (let i = 0; i < segs; i++) { const a = i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    const g = new THREE.InstancedBufferGeometry(); g.instanceCount = n;
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    const P0 = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3), D0 = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3),
      D1 = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3), Par = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
    for (let i = 0; i < n; i++) { Par.setXYZW(i, rng(), rng(), 150, 1); D0.setXYZ(i, 1, 0, 0); D1.setXYZ(i, 1, 0, 0); }
    g.setAttribute('iP0', P0); g.setAttribute('iD0', D0); g.setAttribute('iD1', D1); g.setAttribute('iPar', Par);
    const mesh = new THREE.Mesh(g, o.material || S.threadMaterial(o)); mesh.frustumCulled = false; mesh.renderOrder = o.renderOrder ?? 60;
    mesh.userData.set = (i, p0, d0, d1, len = 150, strength = 1, seed) => {
      P0.setXYZ(i, p0.x, p0.y, p0.z); D0.setXYZ(i, d0.x, d0.y, d0.z); D1.setXYZ(i, d1.x, d1.y, d1.z);
      if (seed) Par.setXY(i, seed[0], seed[1]); Par.setZ(i, len); Par.setW(i, strength);
    };
    mesh.userData.commit = () => { P0.needsUpdate = D0.needsUpdate = D1.needsUpdate = Par.needsUpdate = true; };
    return mesh;
  }
  // setClearing(a, b, rA, rB): keep a cone of undisturbed air (no ink at all) round the segment a-b (WORLD space), radius rA at a
  // growing to rB at b: the exit line, so the ring is staged against clear field.
  const setClearing = (a, b, rA, rB = rA) => { uniforms.uClrA.value.copy(a); uniforms.uClrB.value.copy(b); uniforms.uClrR.value.set(rA, rB); };
  const update = (dt, time, camera) => {
    uniforms.uTime.value = time;
    if (camera) uniforms.uCam.value.setFromMatrixPosition(camera.matrixWorld);
  };
  return Object.assign(S, { cutout, ribbonGeometry, makeThreads, setClearing, update });
}

// ---------------------------------------------------------------------------------------------
// THE FLOW (pure JS, no GL): the brief's space. +X east/downwind, +Z north, y above the cirque floor,
// ridge along x 0, col at z 0 (110 m), Horn at z 1400 (900 m). Everything that rides the air reads this.
// ---------------------------------------------------------------------------------------------
export function makeFlow(rng, noise, o = {}) {
  const NK = 12, hornZ = o.hornZ ?? -1400, hornH = o.hornH ?? 900;   // NORTH IS -Z (see header)
  const lean = o.lean ?? rng.range(0.85, 1.2), tall = (o.tall ?? rng.range(0.94, 1.06)) * (o.tallScale ?? 1), base0 = 66;
  const nz0 = rng.range(0, 100);
  // the ridge as the air feels it (smooth) and the swell of the wave toward the Horn
  const ridgeAir = (z) => 110 + 210 * (1 - Math.exp(-((z / 500) ** 2))) + (hornH - 320) * Math.exp(-(((z - hornZ) / 420) ** 2));
  const swellW = o.swellWidth ?? 1150;   // how fast the wave dies away from the Horn (the world narrows it so the crest is seen whole from the col)
  // o.swellSouth [z0, z1, floor]: south of the Horn the wave dies away to almost nothing, so from the col it is ONE figure
  // (tall at the Horn, down to the horizon by the col) and not a row of equal hoops
  const south = o.swellSouth, swell = (z) => { const fl = south ? lerp(0.35, south[2], smoothstep(south[0], south[1], hornZ < 0 ? z : -z)) : 0.35; return fl + (1 - fl) * Math.exp(-(((z - hornZ) / swellW) ** 2)); };
  // the black ground: ridge with the col notch, windward fall to the cirque (0), lee fall to the valley (-700), the Horn tooth
  function groundY(x, z) {
    const az = Math.abs(z);
    let crest = 110 + 150 * smoothstep(26, 170, az) + 70 * (1 - Math.exp(-((z / 650) ** 2)));
    crest += 46 * noise.ridged2(z / 210 + nz0, 3.1, 3) * smoothstep(40, 260, az);
    const dz = z - hornZ, sx = x > 0 ? x / 1.08 : x / 0.9, r = Math.hypot(sx, dz), th = Math.atan2(dz, sx || 1e-6);
    const rho = 470 + 250 * Math.abs(Math.sin(th)) ** 3 + 90 * Math.max(0, Math.cos(th)) ** 2 + 60 * Math.sin(th * 3 + nz0);
    const q = clamp(1 - r / rho, 0, 1);
    const jag = 1 + 0.1 * (noise.ridged2(x / 420 + 7, z / 420 + nz0, 2) - 0.5) * (1 - q * q);
    const tooth = (hornH - 330) * Math.pow(q, 1.85) * jag;
    const wx = x < 0 ? 1 - smoothstep(0, 1, Math.pow(clamp(-x / 520, 0, 1), 0.8)) : 0;
    const lx = x >= 0 ? smoothstep(0, 1, Math.pow(clamp(x / 950, 0, 1), 0.75)) : 0;
    const rough = 12 * (noise.fbm2(x / 240, z / 240 + nz0, 2)) * smoothstep(0, 120, Math.abs(x));
    const body = x < 0 ? crest * wx : lerp(crest, -700, lx);
    return body + tooth * (x < 0 ? lerp(0.25, 1, wx) : 1) + rough;
  }
  // base streamline (sheet 0) as control points for one z; index 5 is the ridge crest, 8 the trough
  const SHAPE = [[0.30, 0.06], [0.54, 0.25], [0.63, 0.5], [0.58, 0.78], [0.42, 0.98], [0.22, 1.06], [0.06, 1.10], [0.10, 1.21], [0.34, 1.27], [0.68, 1.22], [1.0, 1.02], [1.34, 0.64]];
  const TRAIN = [[1500, 0.40], [2600, 0.66], [3900, 0.36], [5200, 0.52], [6500, 0.32], [7800, 0.42], [9100, 0.35]];
  // metres between neighbouring sheets, and wind speed, at each control point
  const GAP = [30, 30, 24, 12, 6.5, 6, 9, 20, 30, /*shape*/ 34, 36, 36, 34, 32, 30, 30, 30, 32, 36, 40, 44, /*train*/ 44, 42, 40, 40, 40, 40, 40];
  const SPD = [30, 30, 30, 30, 30, 30, 34, 40, 42, 45, 45, 45, 45, 45, 45, 42, 40, 38, 36, 36, 36, 34, 32, 32, 30, 30, 30, 30];
  const SUB = [2, 3, 4, 4, 4, 4, 5, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2];   // samples per span
  const NS = SUB.reduce((a, b) => a + b, 0) + 1;
  const gapK = [0]; { let c = 0; for (let k = 1; k < NK; k++) { c += rng.range(0.45, 1.5); gapK.push(c); } const f = (NK - 1) / c; for (let k = 1; k < NK; k++) gapK[k] *= f; }
  const curve = new THREE.CatmullRomCurve3([], false, 'centripetal');
  function controls(z) {
    const R = ridgeAir(z), w = swell(z), H = 2050 * tall * Math.pow(w, 1.3);
    const xT = 420 + 300 * w, yT = -190 - 150 * (w - 0.48);
    const pts = [[-3400, base0], [-1700, base0], [-760, base0 + (R - base0) * 0.1], [-300, base0 + (R - base0) * 0.58], [-95, R - 6 - (R - 110) * 0.05],
      [0, R + 4], [130, R - 22 - (R - 110) * 0.06], [xT * 0.55, lerp(R, yT, 0.62)], [xT, yT]];
    for (const [a, b] of SHAPE) pts.push([xT + (a > 0.6 ? a : lerp(a, a * lean, b)) * H * (0.9 + 0.1 * lean), yT + b * H]);
    const xh = xT + 0.55 * H;
    for (const [a, b] of TRAIN) pts.push([xh + a, yT + b * H * (0.75 + 0.25 * w)]);
    return { pts, w };
  }
  // slice(z) -> { x, y, nx, ny (unit left normals = "up" side), gap, spd } sampled at NS points along the base streamline
  function slice(z) {
    const { pts, w } = controls(z);
    curve.points = pts.map((p) => new THREE.Vector3(p[0], p[1], 0));
    const x = new Float32Array(NS), y = new Float32Array(NS), nx = new Float32Array(NS), ny = new Float32Array(NS), gap = new Float32Array(NS), spd = new Float32Array(NS);
    const v = new THREE.Vector3(); let n = 0; const spans = pts.length - 1;
    for (let sp = 0; sp < spans; sp++) for (let j = 0; j < SUB[sp] + (sp === spans - 1 ? 1 : 0); j++) {
      const f = j / SUB[sp]; curve.getPoint((sp + f) / spans, v); x[n] = v.x; y[n] = v.y;
      const sm = f * f * (3 - 2 * f), gs = sp >= 8 ? 0.45 + 0.55 * w : 1;
      gap[n] = lerp(GAP[sp], GAP[sp + 1], sm) * gs; spd[n] = lerp(SPD[sp], SPD[sp + 1], sm); n++;
    }
    for (let i = 0; i < NS; i++) { const a = Math.max(0, i - 1), b = Math.min(NS - 1, i + 1); const tx = x[b] - x[a], ty = y[b] - y[a], l = Math.hypot(tx, ty) || 1; nx[i] = -ty / l; ny[i] = tx / l; }
    return { x, y, nx, ny, gap, spd, w };
  }
  // offset of sheet k (0..11, fractional allowed) from the base streamline, in units of the local gap. Even 6 m steps over the
  // crest with one doubled gap between sheets 0 and 1 (the camera's lane), irregular 10-40 m elsewhere.
  function offK(k, gapHere) {
    const even = k + clamp(k, 0, 1), irr = lerp(k, gapK[Math.floor(k)] + (k % 1) * ((gapK[Math.ceil(k)] ?? gapK[NK - 1]) - gapK[Math.floor(k)]), 0.8);
    const t = smoothstep(6.5, 16, gapHere);
    return lerp(even, irr + 0.5 * clamp(k, 0, 1), t);
  }
  // sheetLine(k, z | slice) -> polyline of sheet k at that z: { x[], y[] } (NS points)
  function sheetLine(k, zOrSlice) {
    const s = typeof zOrSlice === 'number' ? slice(zOrSlice) : zOrSlice; const X = new Float32Array(NS), Y = new Float32Array(NS);
    for (let i = 0; i < NS; i++) { const d = offK(k, s.gap[i]) * s.gap[i]; X[i] = s.x[i] + s.nx[i] * d; Y[i] = s.y[i] + s.ny[i] * d; }
    return { x: X, y: Y, slice: s };
  }
  // point(k, i, z): position and unit downwind tangent of sheet k (fractional = between sheets) at sample i (fractional)
  function point(k, i, z) {
    const L = sheetLine(k, z); const i0 = clamp(Math.floor(i), 0, NS - 2), f = clamp(i - i0, 0, 1);
    const px = lerp(L.x[i0], L.x[i0 + 1], f), py = lerp(L.y[i0], L.y[i0 + 1], f);
    const a = Math.max(0, i0 - 1), b = Math.min(NS - 1, i0 + 2); let tx = L.x[b] - L.x[a], ty = L.y[b] - L.y[a]; const l = Math.hypot(tx, ty) || 1;
    return { x: px, y: py, z, tx: tx / l, ty: ty / l, speed: L.slice.spd[i0], gap: L.slice.gap[i0] };
  }
  const IDX = { crest: 0, trough: 0, face: 0, lip: 0, top: 0 }; { let n = 0; const at = SUB.map((c) => { const v = n; n += c; return v; }); IDX.crest = at[5]; IDX.trough = at[8]; IDX.face = at[11]; IDX.lip = at[14]; IDX.top = at[16]; IDX.at = at; }
  return { NK, NS, hornZ, hornH, nz0, tall, ridgeAir, swell, groundY, slice, sheetLine, point, offK, IDX };
}

// ---------------------------------------------------------------------------------------------
// buildHero
// ---------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const style = opts.style || makeStyle(ctx, { palette: opts.palette });
  const flow = opts.flow || makeFlow(rng, ctx.noise, opts);
  const { NK, NS, IDX, hornZ } = flow; const sgn = hornZ < 0 ? -1 : 1;
  const root = new THREE.Group(); root.name = 'standing-wave';
  let field = null;
  if (opts.field !== false) { field = style.makeField(opts.fieldRadius ?? 5000); root.add(field); }
  await ctx.yield();

  // ---- the twelve stream-sheets --------------------------------------------------------------
  // slices: every 50 m along the camera's run north of the col (twisted quads kink the hair lines up close), coarse far off
  const ZS = [-1550, -1150, -800, -550, -350, -200]; for (let n = -100; n <= 650; n += 50) ZS.push(n);
  ZS.push(770, 910, 1090, 1290, 1490, 1720, 2000, 2350, 2800, 3350);
  const NZ = ZS.length, zAt = (j) => ZS[j] * sgn;
  const slices = [];
  for (let j = 0; j < NZ; j++) { slices.push(flow.slice(zAt(j))); if (j % 6 === 5) await ctx.yield(); }
  const sheetIdx = (() => { const a = new Uint32Array((NS - 1) * (NZ - 1) * 6); let n = 0;
    for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NS - 1; i++) { const p = j * NS + i; a[n++] = p; a[n++] = p + 1; a[n++] = p + NS + 1; a[n++] = p; a[n++] = p + NS + 1; a[n++] = p + NS; }
    return new THREE.BufferAttribute(a, 1); })();
  const deflect = (x, z) => { const d = (z - hornZ) / 380; return 210 * Math.exp(-((x / 420) ** 2)) * d * Math.exp(-d * d * 0.5); };
  const keep = opts.sheetKeep || (detail >= 0.95 ? null : detail >= 0.75 ? [0, 1, 2, 4, 5, 7, 8, 10, 11] : [0, 1, 2, 4, 7, 10]);
  const sheets = [], sheetGroup = new THREE.Group(); root.add(sheetGroup);
  const sheetSeed = rng.range(0, 50);
  for (let k = 0; k < NK; k++) {
    if (keep && !keep.includes(k)) continue;
    const pos = new Float32Array(NS * NZ * 3), info = new Float32Array(NS * NZ * 4);
    for (let j = 0; j < NZ; j++) {
      const z = zAt(j), L = flow.sheetLine(k, slices[j]), sl = slices[j];
      const zf = smoothstep(0, 2.2, j) * smoothstep(0, 2.2, NZ - 1 - j);
      let tau = 0; const taus = new Float32Array(NS);
      for (let i = 1; i < NS; i++) { tau += Math.hypot(L.x[i] - L.x[i - 1], L.y[i] - L.y[i - 1]) / ((sl.spd[i] + sl.spd[i - 1]) * 0.5) * 30; taus[i] = tau; }
      const t0 = taus[IDX.crest];
      for (let i = 0; i < NS; i++) {
        const o = j * NS + i, a = Math.max(0, i - 1), b = Math.min(NS - 1, i + 1);
        const tx = L.x[b] - L.x[a], ty = L.y[b] - L.y[a], tl = Math.hypot(tx, ty) || 1;
        pos[o * 3] = L.x[i]; pos[o * 3 + 1] = L.y[i]; pos[o * 3 + 2] = z;
        info[o * 4] = taus[i] - t0; info[o * 4 + 1] = z - deflect(L.x[i], z) * (1 - k / 30);
        info[o * 4 + 2] = (ty / tl) * lerp(1, 0.2, smoothstep(IDX.top + 3, IDX.top + 9, i));
        info[o * 4 + 3] = zf * smoothstep(0, 3, i) * smoothstep(0, 5, NS - 1 - i) * (opts.westFade ? smoothstep(opts.westFade[0], opts.westFade[1], L.x[i]) : 1);   // westFade: still air over the cirque prints nothing
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aInfo', new THREE.BufferAttribute(info, 4)); g.setIndex(sheetIdx);
    const m = new THREE.Mesh(g, style.sheetMaterial({ seed: sheetSeed + k * 1.618, phase: k * 0.9 + rng.range(0, 1), fill: opts.fill ?? 0.065, period: 3, gapPx: opts.gapPx, line: opts.line, graze: opts.graze, far: opts.sheetFar }));
    m.frustumCulled = false; m.renderOrder = 20 + k; m.name = 'sheet' + k;
    sheetGroup.add(m); sheets.push(m);
    await ctx.yield();
  }
  const H = { style, flow, root, rng, detail, opts, sheets, field, slices, sgn };
  await _heroRules(ctx, H);
  await _heroHorn(ctx, H);
  await _heroAir(ctx, H);
  await _heroRing(ctx, H);
  await _heroBirds(ctx, H);
  return _heroFinish(ctx, H);
}

// ---- the ruled streamlines: every sheet drawn as hairs of constant z, the hooked profile of the wave itself ----
// opts.rules = false leaves them out; opts.ruleSheets = which sheets are ruled; opts.ruleLine / ruleWidth = strength / width.
// Stations are 30 m apart along the camera's run and wider apart far off; a line of the finest class is only ruled within
// 900 m of the eye, the next within 1800 m, and so on, so the grain of the air coarsens with distance.
async function _heroRules(ctx, H) {
  const { flow, style, root, opts, sgn } = H; const { NS, IDX } = flow;
  if (opts.rules === false) return;
  // the plan: [sheet, reach in metres (the line is only ruled this near the eye), every n-th station]. The two sheets of the
  // camera's lane are ruled near the eye; the far-reaching entries are the HOOPS of the barrel (aKind 1: ruled by uBarrel, which
  // the world raises once the eye is inside the wave; seen from outside, hoops at many stations cross one another like a net).
  const plan = opts.rulePlan || [[0, 300, 1], [1, 300, 1], [4, 1e9, 2], [8, 1e9, 4]], STEP = 30, R = opts.ruleReach ?? 450;
  const stations = [];
  for (let n = -47; n <= 110; n++) {
    const zb = n * STEP + 13, step = zb >= -150 && zb <= 900 ? 1 : (zb > 900 && zb <= 1500) || (zb < -150 && zb >= -450) ? 2 : zb > 1500 && zb <= 2400 ? 4 : 8;
    if (((n % step) + step) % step !== 0) continue;
    const m = ((n % 8) + 8) % 8, lod = m === 0 ? 1e9 : m === 4 ? R * 4 : m % 2 === 0 ? R * 2 : R;
    stations.push([zb * sgn, lod, smoothstep(-1440, -1000, zb) * smoothstep(3330, 2700, zb), n, zb]);
  }
  const I0 = 5, SA = IDX.at[8], westFade = opts.westFade;
  const bias = (i) => 0.5 * smoothstep(IDX.at[13], IDX.at[15], i) * (1 - smoothstep(IDX.at[18], IDX.at[20], i));   // over the top of the crest: ultramarine
  const cr = (a, b, c, d, f) => 0.5 * (2 * b + (c - a) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (3 * b - 3 * c + d - a) * f * f * f);
  const mat = style.ruleMaterial({ line: opts.ruleLine, width: opts.ruleWidth });
  // samples along a line from the windward face to sample I1: three to a span round the hook
  const samples = (I1, SB) => { const ts = []; for (let i = I0; i < I1; i++) { const sub = i >= SA && i < SB ? 3 : 1; for (let e = 0; e < sub; e++) ts.push(i + e / sub); } ts.push(I1); return ts; };
  // lines: [{ L {x[], y[]}, sl (slice), z, lod, near, kind, end (sample where it has faded out), zf }]
  async function ruled(lines, ts, name, material = mat) {
    const NP = ts.length, NL = lines.length; if (!NL) return null;
    const pos = new Float32Array(NL * NP * 6), tan = new Float32Array(NL * NP * 4), rule = new Float32Array(NL * NP * 8), lodA = new Float32Array(NL * NP * 6), kind = new Float32Array(NL * NP * 2), figA = lines[0].B ? new Float32Array(NL * NP * 8) : null;
    const idx = new Uint32Array(NL * (NP - 1) * 6), taus = new Float32Array(NS); let v = 0, q = 0;
    for (let n = 0; n < NL; n++) {
      const { L, sl, z, lod, near, end, zf } = lines[n], from = lines[n].from ?? I0, seed = (n * 0.61803) % 1, base = v; let tau = 0;
      for (let i = 1; i < NS; i++) { tau += Math.hypot(L.x[i] - L.x[i - 1], L.y[i] - L.y[i - 1]) / ((sl.spd[i] + sl.spd[i - 1]) * 0.5) * 30; taus[i] = tau; }
      for (let j = 0; j < NP; j++) {
        const t = ts[j], i = Math.min(Math.floor(t), NS - 2), f = t - i, a = Math.max(0, i - 1), d = Math.min(NS - 1, i + 2);
        const x = cr(L.x[a], L.x[i], L.x[i + 1], L.x[d], f), y = cr(L.y[a], L.y[i], L.y[i + 1], L.y[d], f), e2 = 0.02;
        let tx = cr(L.x[a], L.x[i], L.x[i + 1], L.x[d], f + e2) - cr(L.x[a], L.x[i], L.x[i + 1], L.x[d], f - e2), ty = cr(L.y[a], L.y[i], L.y[i + 1], L.y[d], f + e2) - cr(L.y[a], L.y[i], L.y[i + 1], L.y[d], f - e2);
        const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const g = ty - (lines[n].still ? 0 : bias(t)), fade = zf * smoothstep(0, 3, t - from) * smoothstep(0, 7, end - t) * (westFade ? smoothstep(westFade[0], westFade[1], x) : 1);
        // the figure: position = the base streamline, aFig = this hair's offset from it (so base and gaps can grow apart)
        let bx = x, by = y, gw = 0, fw = 0; const Bc = lines[n].B;
        if (Bc) { bx = cr(Bc.x[a], Bc.x[i], Bc.x[i + 1], Bc.x[d], f); by = cr(Bc.y[a], Bc.y[i], Bc.y[i + 1], Bc.y[d], f); gw = lines[n].still ? 0 : smoothstep(IDX.trough - 2, IDX.trough + 4, t); fw = smoothstep(IDX.at[14], IDX.at[17], t) * (1 - smoothstep(IDX.at[18], IDX.at[20], t)); }
        for (let e = 0; e < 2; e++) {
          if (figA) { figA[v * 4] = x - bx; figA[v * 4 + 1] = y - by; figA[v * 4 + 2] = gw; figA[v * 4 + 3] = fw; }
          pos[v * 3] = bx; pos[v * 3 + 1] = by; pos[v * 3 + 2] = z; tan[v * 2] = tx; tan[v * 2 + 1] = ty;
          rule[v * 4] = lerp(taus[i], taus[i + 1], f); rule[v * 4 + 1] = g; rule[v * 4 + 2] = fade; rule[v * 4 + 3] = e ? 1 : -1;
          lodA[v * 3] = lod; lodA[v * 3 + 1] = seed; lodA[v * 3 + 2] = near; kind[v] = lines[n].kind; v++;
        }
      }
      for (let i = 0; i < NP - 1; i++) { const p = base + i * 2; idx[q++] = p; idx[q++] = p + 1; idx[q++] = p + 3; idx[q++] = p; idx[q++] = p + 3; idx[q++] = p + 2; }
      if (n % 4 === 3) await ctx.yield();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aTan', new THREE.BufferAttribute(tan, 2)); g.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
    g.setAttribute('aRule', new THREE.BufferAttribute(rule, 4)); g.setAttribute('aLod', new THREE.BufferAttribute(lodA, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    if (figA) g.setAttribute('aFig', new THREE.BufferAttribute(figA, 4));
    const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.renderOrder = 34; mesh.name = name; root.add(mesh); mesh.userData.ts = ts; mesh.userData.NP = NP;   // (round 9) the world builds a claim from the figure's own hairs
    await ctx.yield();
    return mesh;
  }
  // (a) the lane and the hoops
  const I1 = Math.min(NS - 9, IDX.at[opts.ruleEnd ?? 18] + 2), lines = [];
  for (let s = 0; s < stations.length; s++) {
    const [z, slod, zf, n, zb] = stations[s]; let sl = null;
    for (const [k, reach, every] of plan) {
      if (((n % every) + every) % every !== 0 || (reach < 1e8 && (zb > (opts.laneZ?.[1] ?? 800) || zb < (opts.laneZ?.[0] ?? -350)))) continue;
      if (!sl) sl = flow.slice(z);
      lines.push({ L: flow.sheetLine(k, sl), sl, z, lod: Math.min(slod, reach), near: reach < 1e8 ? (opts.laneNear ?? 0) : (opts.ruleNear ?? 380), kind: reach < 1e8 ? 0 : 1, end: reach < 1e8 ? (opts.laneEnd ?? I1) : I1, zf });
    }
    if (s % 4 === 3) await ctx.yield();
  }
  H.rules = await ruled(lines, samples(I1, IDX.at[19]), 'ruled-streamlines');
  // (b) THE SECTION: the wave whole, as one figure. In the plane of the Horn (where it stands tallest) a stack of streamlines
  // climbs the windward face packed tight, springs from the summit, plunges and rears into the nested hooks of the crest; a few
  // of them run on downwind over the lower crests of the train. Evenly spaced (opts.ruleSection { lines, gap m, train [..] }).
  const sec = opts.ruleSection;
  if (sec) {
    // sec.flow: the figure may have a flow of its own (the world draws it lower than the wave the birds ride, so that its
    // crest stands inside the frame from the col); aKind -1: it is the wave seen from OUTSIDE and fades as the hoops come.
    const f2 = sec.flow || flow, z = flow.hornZ + (sec.dz ?? 0), sl = f2.slice(z), NLs = sec.lines ?? 8, endAll = NS - 3, endHook = IDX.at[20] + 1, sLines = [];
    let gmax = 1; for (let i = IDX.at[9]; i < IDX.at[19]; i++) gmax = Math.max(gmax, sl.gap[i]);
    // FIX ROUND 2: the train downwind of the hook is drawn from a curve of its own (the flow's few control points gave kinked
    // zigzags): three round-topped crests stepping down, sec.crests [fractions of the figure's height], sec.wave (length / height)
    const i20 = IDX.at[20], Hf = 2050 * f2.tall * Math.pow(sl.w, 1.3), lam = (sec.wave ?? 0.75) * Hf, AM = sec.crests || [0.38, 0.25, 0.16], yL = sl.y[IDX.trough] + (sec.trainBase ?? 0.1) * Hf;
    const BX = Float32Array.from(sl.x), BY = Float32Array.from(sl.y), x20 = sl.x[i20], y20 = sl.y[i20];
    for (let i = i20 + 1; i < NS; i++) {
      const d = ((i - i20) / (NS - 1 - i20)) * 3.4 * lam; BX[i] = x20 + d;
      if (d < 0.4 * lam) BY[i] = yL + (y20 - yL) * (1 - Math.sin(Math.PI * 0.5 * d / (0.4 * lam)));
      else { const k = (d - 0.4 * lam) / lam, n = Math.min(2, Math.floor(k)); BY[i] = yL + AM[n] * Hf * (0.5 - 0.5 * Math.cos(TAU * k)); }
    }
    const BNX = new Float32Array(NS), BNY = new Float32Array(NS);
    for (let i = 0; i < NS; i++) { if (i <= i20) { BNX[i] = sl.nx[i]; BNY[i] = sl.ny[i]; } else { const a = i - 1, b = Math.min(NS - 1, i + 1), tx = BX[b] - BX[a], ty = BY[b] - BY[a], l = Math.hypot(tx, ty) || 1; BNX[i] = -ty / l; BNY[i] = tx / l; } }
    const B = { x: BX, y: BY };
    H.figT = new THREE.Vector2(sl.x[IDX.trough], sl.y[IDX.trough]); H.figH = Hf; H.figZ = z; H.figBase = B; H.figSlice = sl;
    for (let m = 0; m < NLs; m++) {
      const X = new Float32Array(NS), Y = new Float32Array(NS), run = (sec.train || [1, 4, 7]).includes(m);
      for (let i = 0; i < NS; i++) { const d = ((sec.first ?? 24) + m * (sec.gap ?? 58)) * Math.min(1, sl.gap[i] / gmax) * (i > i20 ? lerp(1, 0.45, smoothstep(i20, i20 + 5, i)) : 1); X[i] = BX[i] + BNX[i] * d; Y[i] = BY[i] + BNY[i] * d; }
      sLines.push({ L: { x: X, y: Y }, B, sl, z, lod: 1e9, near: 0, kind: -1, end: run ? endAll : endHook - (NLs - 1 - m) * (sec.stagger ?? 0.6), zf: 1 });
    }
    // sec.trainFar { z, x0, lam, amp, base, lines, gap }: the lower crests of the train, standing in a nearer plane to the right
    // of the figure as seen from the col: round-topped, each lower than the last, two or three hairs each
    const tf = sec.trainFar;
    if (tf) for (let m = 0; m < (tf.lines ?? 3); m++) {
      const X = new Float32Array(NS), Y = new Float32Array(NS);
      for (let i = 0; i < NS; i++) { const k = (i / (NS - 1)) * 3.5 - 0.25, n = clamp(Math.floor(k), 0, 2), a = (tf.amp ?? 130) * [1, 0.72, 0.5][n] * (k < 0 ? 0 : 1);
        X[i] = tf.x0 + k * tf.lam; Y[i] = (tf.base ?? 0) + a * (0.5 - 0.5 * Math.cos(TAU * k)) + m * (tf.gap ?? 26) * (0.35 + 0.65 * (0.5 - 0.5 * Math.cos(TAU * k))); }
      sLines.push({ L: { x: X, y: Y }, B: { x: X, y: Y }, still: true, sl, z: tf.z, lod: 1e9, near: 0, kind: -1, end: NS + 4, zf: 1, from: -4 });
    }
    H.section = await ruled(sLines, samples(endAll, NS), 'wave-section', style.ruleMaterial({ line: 1, width: sec.width ?? 0.0045, fig: true, speed: sec.speed ?? 85 })   /* (fix round 4) the crest pours: at the col a gap travels 4 to 5 percent of the frame width in a second and a half */);
    style.uniforms.uFigT.value.copy(H.figT);
  }
}

// ---- the Horn: a hooked black tooth on its stretch of ridge, with fringe ------------------------
async function _heroHorn(ctx, H) {
  const { flow, style, root, opts } = H;
  if (opts.horn === false) return;
  const SEG = 96, RINGS = 54, RMAX = opts.hornRadius ?? 1150, hz = flow.hornZ;
  const pos = new Float32Array((SEG * RINGS + 1) * 3), idx = [];
  let top = -1e9; for (let dx = -40; dx <= 40; dx += 8) for (let dz = -40; dz <= 40; dz += 8) top = Math.max(top, flow.groundY(dx, hz + dz));
  const put = (o, x, z) => {
    let y = flow.groundY(x, z); const t = clamp((y - 250) / Math.max(top - 250, 1), 0, 1);
    pos[o * 3] = x + 95 * t * t * t; pos[o * 3 + 1] = y; pos[o * 3 + 2] = z + 18 * t * t;      // the hook: the tip leans downwind
  };
  put(0, 0, hz);
  for (let r = 0; r < RINGS; r++) {
    const rr = RMAX * Math.pow((r + 1) / RINGS, 1.5);
    for (let s = 0; s < SEG; s++) {
      const a = (s / SEG) * TAU, o = 1 + r * SEG + s; put(o, Math.cos(a) * rr, hz + Math.sin(a) * rr * 1.25);
      if (r === RINGS - 1) pos[o * 3 + 1] -= 90; else if (r === RINGS - 2) pos[o * 3 + 1] -= 25;   // skirt sinks under the world's terrain
    }
    if (r % 8 === 7) await ctx.yield();
  }
  for (let s = 0; s < SEG; s++) idx.push(0, 1 + ((s + 1) % SEG), 1 + s);
  for (let r = 0; r < RINGS - 1; r++) for (let s = 0; s < SEG; s++) {
    const a = 1 + r * SEG + s, b = 1 + r * SEG + ((s + 1) % SEG), c = a + SEG, d = b + SEG; idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  await ctx.yield(); g.computeVertexNormals(); await ctx.yield();
  const horn = style.solid(g, { noCull: true }); horn.name = 'horn'; root.add(horn);
  H.horn = horn; H.hornTop = new THREE.Vector3(70, top, hz + 18);
}

// ---- the rotor (nine nested open shells of curdled air) and the lenses -----------------------------
async function _heroAir(ctx, H) {
  const { flow, style, root, rng, opts } = H;
  const waveAt = (z) => { const w = flow.swell(z), Hh = 2050 * (flow.tall ?? 1) * Math.pow(w, 1.3), xT = 420 + 300 * w, yT = -190 - 150 * (w - 0.48); return { w, Hh, xT, yT }; };
  H.waveAt = waveAt;
  {
    // THE ROTOR: one long roll of curdled air lying north to south in the hollow under the crest. ONE shell, seen from outside
    // (nine nested shells of opposite sign printed mauve where they overlapped): big slow cells, each one pure ink with field
    // between, turning once in 25 s; its whole body claims its pixels (o.mask), so no hair is ruled across it.
    const NA = 40, NZ = 48, Z0 = -320 * H.sgn, Z1 = 3200 * H.sgn, thick = Math.pow(opts.rotor ?? 1, 0.6), CELLS = Math.round(8 * thick);
    for (let s = 0; s < 36; s++) rng();          // (the draws of the old nine shells: everything built after keeps its numbers)
    const nv = (NA + 1) * (NZ + 1), pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), rel = new Float32Array(nv * 3), idx = [];
    const R0 = 0.15 * waveAt(flow.hornZ).Hh;
    let o = 0;
    for (let j = 0; j <= NZ; j++) {
      const z = lerp(Z0, Z1, j / NZ), W = waveAt(z), R = Math.max(0.15 * W.Hh * thick, opts.rotorMin ?? 0), cx = W.xT + 0.25 * W.Hh + (opts.rotorLump ?? 0) * R * 0.3 * Math.sin(z / 210 + 1), cy = W.yT + 0.05 * W.Hh + R + (opts.rotorLump ?? 0) * R * 0.22 * Math.sin(z / 170);
      const zf = smoothstep(0, 5, j) * smoothstep(0, 5, NZ - j);
      for (let i = 0; i <= NA; i++) {
        const f = i / NA, a = -f * TAU, ca = Math.cos(a), sa = Math.sin(a);   // clockwise seen from the south: over the top downwind
        const wob = 1 + 0.09 * Math.sin(z / 230 + a * 2) + 0.05 * Math.sin(z / 97 + a * 3 + 1.3) + (opts.rotorLump ?? 0) * (0.2 * Math.sin(z / 131 + a * 2 + 0.7) + 0.12 * Math.sin(z / 59 + a * 3));   // opts.rotorLump: a roll with a lumpy outline (a thin straight tube read as a printed ribbon)
        pos[o * 3] = cx + ca * R * wob * 1.12; pos[o * 3 + 1] = cy + sa * R * wob; pos[o * 3 + 2] = z;
        nor[o * 3] = ca; nor[o * 3 + 1] = sa; nor[o * 3 + 2] = 0;
        uv[o * 2] = f * CELLS; uv[o * 2 + 1] = z / (0.9 * R0);
        rel[o * 3] = -ca * 0.3; rel[o * 3 + 1] = zf; rel[o * 3 + 2] = CELLS / 25;
        o++;
      }
      if (j % 12 === 11) await ctx.yield();
    }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NA; i++) { const p = j * (NA + 1) + i; idx.push(p, p + 1, p + NA + 2, p, p + NA + 2, p + NA + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aRel', new THREE.BufferAttribute(rel, 3)); g.setIndex(idx);
    const rotor = new THREE.Mesh(g, style.marbleMaterial({ seed: rng.range(0, 40), fill: opts.rotorFill ?? 1, relief: 1, curdle: 1.6, warp: 0.5, edge: opts.rotorEdge ?? 0.5, soft: [0.5, 0.64], side: THREE.FrontSide, lod: false, mask: true, hard: true, lines: opts.rotorLines ?? 0 }));   // opts.rotorLines: the roll's cells ruled as nested hairs (see marbleMaterial o.lines)
    rotor.frustumCulled = false; rotor.renderOrder = 12; rotor.name = 'rotor'; root.add(rotor); H.rotor = rotor;
    const Wh = waveAt(flow.hornZ); H.rotorCenter = new THREE.Vector3(Wh.xT + 0.2 * Wh.Hh, Wh.yT + 0.2 * Wh.Hh, flow.hornZ);
  }
  await ctx.yield();
  {
    const NL = opts.lenses ?? 3, LEN = [1200, 900, 600, 760, 480], NU = 28, NV = 14;
    const nv = NL * (NU + 1) * (NV + 1), pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), rel = new Float32Array(nv * 3), idx = [];
    const Wh = waveAt(flow.hornZ), top = flow.point(NK_TOP, flow.IDX.top, flow.hornZ);
    let o = 0; H.lensCenters = [];
    for (let n = 0; n < NL; n++) {
      const LS = opts.lensShift || [0, 0, 0], L = LEN[n % 5], cx = top.x + 120 + n * rng.range(40, 110) + LS[0], cy = top.y + 330 + n * 250 + LS[1], cz = flow.hornZ + rng.range(-160, 160) - n * 60 + LS[2], base = o;
      H.lensCenters.push(new THREE.Vector3(cx, cy, cz));
      for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
        const th = (j / NV) * Math.PI, ph = (i / NU) * TAU;
        let x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph);
        const tip = 1 - 0.55 * Math.pow(Math.abs(z), 2.2);                         // almond: chord and thickness pinch toward the tips
        const px = x * L * 0.2 * tip - 0.05 * L * (1 - z * z) , py = y * L * 0.045 * tip * (y < 0 ? 0.4 : 1) + 0.012 * L * (1 - x * x), pz = z * L * 0.5;
        pos[o * 3] = cx + px; pos[o * 3 + 1] = cy + py; pos[o * 3 + 2] = cz + pz;
        const nl = Math.hypot(x / 0.2, y / 0.045, z / 0.5) || 1; nor[o * 3] = x / 0.2 / nl; nor[o * 3 + 1] = y / 0.045 / nl; nor[o * 3 + 2] = z / 0.5 / nl;
        uv[o * 2] = px / 260 + n * 7; uv[o * 2 + 1] = pz / 520 + n * 3;
        rel[o * 3] = -x * 1.05 - 0.12; rel[o * 3 + 1] = 1; rel[o * 3 + 2] = 0.05;
        o++;
      }
      for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const p = base + j * (NU + 1) + i; idx.push(p, p + 1, p + NU + 2, p, p + NU + 2, p + NU + 1); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aRel', new THREE.BufferAttribute(rel, 3)); g.setIndex(idx);
    const lenses = new THREE.Mesh(g, style.marbleMaterial({ seed: rng.range(0, 40), fill: 1, relief: 2.3, curdle: 0.22, warp: 0.2, edge: 0.2, soft: [0.14, 0.42], side: THREE.FrontSide, barrel: !!opts.lensBarrel }));
    lenses.frustumCulled = false; lenses.renderOrder = 10; lenses.name = 'lenses'; root.add(lenses); H.lenses = lenses;
  }
  await ctx.yield();
}
const NK_TOP = 11;

// ---- the ring: a torus of air rolling through itself, the way out ---------------------------------
async function _heroRing(ctx, H) {
  const { style, root, rng, opts } = H;
  const pos0 = new THREE.Vector3().fromArray(opts.ringPos || [150, 250, 420 * H.sgn]);
  const dir = new THREE.Vector3().fromArray(opts.ringDir || [0.14, Math.sin(40 * Math.PI / 180), Math.cos(40 * Math.PI / 180) * H.sgn]).normalize();
  const ring = new THREE.Group(); ring.name = 'ring'; ring.position.copy(pos0);
  ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  const inv = ring.quaternion.clone().invert(), wind = new THREE.Vector3(1, 0, 0).applyQuaternion(inv);     // downwind, in ring space
  const r = opts.ringTube ?? 1.7, R = (opts.ringHole ?? 14) / 2 + r - 0.1, NU = 96, NV = 20;
  const nv = (NU + 1) * (NV + 1), pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), rel = new Float32Array(nv * 3), idx = [];
  let o = 0;
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) {
    const a = (i / NU) * TAU, b = (j / NV) * TAU, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    const nx = ca * cb, ny = sa * cb, nz = sb;
    pos[o * 3] = ca * R + nx * r; pos[o * 3 + 1] = sa * R + ny * r; pos[o * 3 + 2] = nz * r;
    nor[o * 3] = nx; nor[o * 3 + 1] = ny; nor[o * 3 + 2] = nz;
    uv[o * 2] = (j / NV) * 2; uv[o * 2 + 1] = (i / NU) * 12;                  // streaks run round the tube and slide; 13 x 4 of them round the ring
    const side = (ca * wind.x + sa * wind.y) / Math.max(Math.hypot(wind.x, wind.y), 1e-3);
    rel[o * 3] = -side * 1.05 - nx * wind.x * 0.2; rel[o * 3 + 1] = 1; rel[o * 3 + 2] = 2 / 4;   // rolls through itself once in 4 s
    o++;
  }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const p = i * (NV + 1) + j; idx.push(p, p + 1, p + NV + 2, p, p + NV + 2, p + NV + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aRel', new THREE.BufferAttribute(rel, 3)); g.setIndex(idx);
  const torus = new THREE.Mesh(g, style.marbleMaterial({ seed: rng.range(0, 40), fill: 1, relief: 2.6, curdle: 0.5, warp: 0.6, edge: 0, soft: [0.12, 0.42], clear: false, streak: 1, streakPeriod: 0.5, streakHelix: 1, lod: false, hard: true, side: THREE.BackSide }));   // (fix round 4) the near wall of the tube only (its triangles are wound inward): through each streak the far wall's ink showed, broken by ITS streaks into rows of dots   // solid: amber windward half, ultramarine lee half, a curdled join at top and bottom
  torus.frustumCulled = false; torus.renderOrder = 70; ring.add(torus);
  // two fine wisps trailing downwind from the lee rim
  const wisps = style.makeThreads(2, { segs: 20, speed: 30, sway: 0.25, renderOrder: 71, rng, always: true });
  const lee = new THREE.Vector3(wind.x, wind.y, 0).normalize().multiplyScalar(R), up = new THREE.Vector3(0, 1, 0).applyQuaternion(inv);
  const d0 = wind.clone().addScaledVector(up, 0.1).normalize(), d1 = wind.clone().addScaledVector(up, 0.32).normalize();
  const perp = new THREE.Vector3().crossVectors(wind, new THREE.Vector3(0, 0, 1)).normalize().multiplyScalar(R * 0.8);
  const pn = perp.clone().normalize(), e0 = wind.clone().multiplyScalar(0.72).addScaledVector(pn, 0.7).normalize(), e1 = wind.clone().multiplyScalar(0.72).addScaledVector(pn, -0.7).normalize();   // (fix round 4) each leaves the rim outward and is bent downwind: a curved streamline, not a ruled straight
  wisps.userData.set(0, lee.clone().multiplyScalar(0.62).add(perp), e0, d0.clone().addScaledVector(up, 0.12).normalize(), 36, 1);
  wisps.userData.set(1, lee.clone().multiplyScalar(0.62).sub(perp), e1, d0.clone().addScaledVector(up, -0.12).normalize(), 36, 1);
  wisps.userData.commit(); ring.add(wisps);
  root.add(ring);
  H.ring = ring; H.ringPos = pos0; H.ringDir = dir;
  style.setClearing(pos0.clone().addScaledVector(dir, -110), pos0.clone().addScaledVector(dir, 1700), opts.clearRadius ?? 60, (opts.clearRadius ?? 60) * 8);
  await ctx.yield();
}

// ---- the flock: black choughs holding station on the face, each wingtip ruling a vortex thread ------
export function choughGeometry(style) {
  // (round 8) a CHEVRON: two swept, pointed wings, a body and a forked tail. The old plan (straight plank wings with fingered tips) was a
  // bar with a dot at any range under a hundredth of the frame; this one is a bird at twelve pixels.
  const half = [[0.78, 0], [0.66, 0.05], [0.52, 0.075], [0.44, 0.13], [0.36, 0.2], [0.12, 0.62], [-0.14, 1.1], [-0.36, 1.5], [-0.4, 1.2], [-0.36, 0.86], [-0.3, 0.52], [-0.3, 0.22],
    [-0.52, 0.13], [-0.86, 0.3], [-0.98, 0.27], [-0.84, 0]];
  const outline = half.concat(half.slice(1, -1).reverse().map(([u, v]) => [u, -v]));
  const dih = (v) => { const a = Math.abs(v); return a < 0.78 ? 0.3 * a : 0.234 - 0.12 * (a - 0.78); };
  const plan = style.cutout(outline, (u, v) => [u, dih(v), v]);
  const side = style.cutout([[0.7, -0.035], [0.6, 0.03], [0.52, 0.1], [0.4, 0.11], [0.15, 0.1], [-0.3, 0.06], [-0.8, 0.03], [-0.78, -0.02], [-0.3, -0.07], [0.1, -0.13], [0.36, -0.1], [0.5, -0.03], [0.6, -0.015]], (u, v) => [u, v, 0]);
  const g = mergeGeometries([plan, side]); g.userData.tip = [-0.36, dih(1.5), 1.5];
  return g;
}
async function _heroBirds(ctx, H) {
  const { flow, style, root, rng, opts, detail } = H; const { IDX, NS } = flow;
  // the default camera line, from the col lane (between sheets 0 and 1) to the ring
  const sg = H.sgn, lane = (k, i, z) => { const p = flow.point(k, i, z * sg); return new THREE.Vector3(p.x, p.y, z * sg); };
  const c = IDX.crest, S = H.ringPos.clone().addScaledVector(H.ringDir, -70);
  H.fly = [lane(0.5, c - 3, 0), lane(0.5, c, 0), lane(0.5, c + 2, 8), lane(0.5, c + 3.4, 40), lane(0.5, c + 4.2, 110), lane(0.5, c + 4.4, 200), lane(0.5, c + 4.4, 285), S, H.ringPos.clone()];
  await ctx.yield();
  const nearFly = (p) => { let d = 1e9; const ab = new THREE.Vector3(), ap = new THREE.Vector3();
    for (let i = 0; i < H.fly.length - 1; i++) { ab.subVectors(H.fly[i + 1], H.fly[i]); ap.subVectors(p, H.fly[i]); const h = clamp(ap.dot(ab) / Math.max(ab.lengthSq(), 1e-6), 0, i === H.fly.length - 2 ? 12 : 1); d = Math.min(d, ap.addScaledVector(ab, -h).length()); }
    return d; };
  const N = Math.round((opts.birds ?? 100) * detail), geo = choughGeometry(style), tip = geo.userData.tip;
  const iBird = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4); geo.setAttribute('iBird', iBird);
  const hookO = { flat: true, size: 3, uniforms: { uProg: { value: -1 } }, vertexDecl: 'attribute vec4 iBird; uniform float uProg;' + style.sway,
    vertexHook: `float rl = sin(uTime * (.5 + iBird.x * .4) + iBird.y * 30.) * .24 + sin(uTime * 1.7 + iBird.x * 50.) * .07;
      float cr = cos(rl), sr = sin(rl); pos.yz = vec2(pos.y * cr - pos.z * sr, pos.y * sr + pos.z * cr); nrm.yz = vec2(nrm.y * cr - nrm.z * sr, nrm.y * sr + nrm.z * cr);
      float ph = uProg < 0. ? fract(uTime / 22. + iBird.x) : clamp((uProg - .6) / .22, 0., 1.);
      float ex = iBird.z * smoothstep(0., .3, ph) * (1. - smoothstep(.5, 1., ph));
      pos.y += iBird.z * smoothstep(.02, .9, ph) * (1. - smoothstep(.9, 1., ph)) * sin(uTime * 15.7 + iBird.y * 20.) * abs(pos.z) * .42;`,
    vertexPost: `pos += swSway(iBird.xy, uTime); pos.x += ex * 150.; pos.y += ex * (-34. + 20. * iBird.w);` };
  // opts.birdMin (round 8): no bird is ever drawn smaller than this fraction of the frame's width (it grows about its own centre with
  // its range): a far chough is a small clean bird, never a speck of two or three pixels
  if (opts.birdMin) hookO.vertexPost = `{ vec3 oB = instanceMatrix[3].xyz; float sB = length(instanceMatrix[0].xyz) * 2.92; float kB = max(1., distance(cameraPosition, oB) * ${(opts.birdMin * 2.14).toFixed(4)} / max(sB, 1e-3)); pos = oB + (pos - oB) * kB; }` + hookO.vertexPost;
  hookO.thin = true;
  const fr = style.fringeMaterial(hookO), bl = style.blackMaterial(hookO);
  fr.uniforms.uProg = bl.uniforms.uProg = hookO.uniforms.uProg;
  const flock = style.solid(geo, { flat: true, instances: N, fringe: fr, black: bl }); flock.name = 'choughs';
  const threads = style.makeThreads(N * 2, { segs: 18, speed: 42, rng });
  const m = new THREE.Matrix4(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), P = new THREE.Vector3(), q = new THREE.Vector3(), d0 = new THREE.Vector3(), d1 = new THREE.Vector3();
  const A = H.ringPos.clone().addScaledVector(H.ringDir, -110), B = H.ringPos.clone().addScaledVector(H.ringDir, 700), AB = B.clone().sub(A);
  let placed = 0, tries = 0; H.birdPos = [];
  while (placed < N && tries < N * 12) {
    tries++;
    const near = placed < 12, far = !near && rng() < 0.12;
    const kf = near ? 1.5 + (placed % 4) : rng.int(0, 10) + 0.5;
    const i = near ? c + rng.range(3.2, 9) : lerp(IDX.trough - 6, IDX.lip - 1, Math.pow(rng(), 2.4));
    const z = sg * (near ? rng.range(70, 430) : far ? rng.range(800, 1900) : rng.range(40, 900));
    const sx = rng(), sy = rng(), yaw = rng.range(-0.35, 0.35), sc = rng.range(0.9, 1.2) * (near ? 1 : far ? 2.6 : 1.8), peel = !near && placed % 31 === 13 ? 1 : 0, pw = rng();
    const L = flow.sheetLine(kf, z), i0 = clamp(Math.floor(i), 1, NS - 3), f = i - i0;
    P.set(lerp(L.x[i0], L.x[i0 + 1], f), lerp(L.y[i0], L.y[i0 + 1], f), z);
    if (tries % 10 === 0) await ctx.yield();
    q.subVectors(P, A); const h = clamp(q.dot(AB) / AB.lengthSq(), 0, 1); if (q.addScaledVector(AB, -h).length() < 45) continue;
    if (nearFly(P) < 14 || (z * sg > 750 && P.x < 520) || P.y < flow.groundY(P.x, z) + 30) continue;
    let tx = L.x[i0 + 1] - L.x[i0 - 1], ty = L.y[i0 + 1] - L.y[i0 - 1], tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const seg = Math.hypot(L.x[i0 + 1] - L.x[i0], L.y[i0 + 1] - L.y[i0]) || 1, i2 = clamp(Math.round(i0 + 150 / seg), 1, NS - 2);
    let ux = L.x[i2 + 1] - L.x[i2 - 1], uy = L.y[i2 + 1] - L.y[i2 - 1]; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    X.set(-tx - 0.8, -ty * 0.45, yaw).normalize(); Y.set(X.y, -X.x, 0).normalize(); Z.crossVectors(X, Y).normalize(); Y.crossVectors(Z, X);
    if (opts.birdPlan) {   // (round 8) opts.birdPlan (the roll, radians): each bird shows its PLAN to the eye that flies up the barrel (wings across the line of sight, belly or back to the eye, head up the frame and turned into the wind): two swept wings, body, tail. Flying upwind with level wings it was seen from its wingtip, a blob
      q.subVectors(H.fly[4], P).normalize(); const dn = q.y < 0 ? -1 : 1; Y.copy(q).multiplyScalar(0.85 * dn); Y.y += 0.22; Y.normalize();
      Z.set(-q.z, 0, q.x); if (Z.lengthSq() < 1e-6) Z.set(1, 0, 0); Z.normalize().multiplyScalar(dn);   // across the line of sight, level
      d0.crossVectors(Y, Z).normalize(); const rl = opts.birdPlan + yaw; Z.multiplyScalar(Math.cos(rl)).addScaledVector(d0, Math.sin(rl)); Z.addScaledVector(Y, -Z.dot(Y)).normalize(); X.crossVectors(Y, Z).normalize(); }
    m.makeBasis(X, Y, Z); m.scale(q.set(sc, sc, sc)); m.setPosition(P);
    flock.userData.setMatrixAt(placed, m); iBird.setXYZW(placed, sx, sy, peel, pw);
    d0.set(tx, ty, 0); d1.set(ux, uy, 0);
    const TD = opts.threadDir, TL = opts.threadLen || [120, 170];   // opts.threadDir [x0, y0, x1, y1]: every thread streams the same way (the world's barrel is one ruled figure, not the local sheets)
    if (TD) { d0.set(TD[0], TD[1], 0).normalize(); d1.set(TD[2], TD[3], 0).normalize(); }
    for (let s = 0; s < 2; s++) { q.set(tip[0], tip[1], s ? -tip[2] : tip[2]).applyMatrix4(m); threads.userData.set(placed * 2 + s, q, d0, d1, lerp(TL[0], TL[1], (rng.range(120, 170) - 120) / 50), peel ? 0 : 1, [sx, sy]); }
    H.birdPos.push(P.clone()); placed++;
  }
  flock.userData.hull.count = flock.userData.body.count = placed; threads.geometry.instanceCount = placed * 2;
  flock.userData.commit(); threads.userData.commit();
  if (opts.birdThreads === false) threads.visible = false;   // (round 8) the far flock rules no strokes: at range a pair was a torn two-colour fragment beside a speck
  root.add(flock, threads); H.flock = flock; H.threads = threads; H.birdProg = hookO.uniforms.uProg;
  // keepBirdsOff(line, clear): no bird of this flock in the lane of a course. The guard above keeps a bird's HOME 14 m off this part's
  // own camera line; a world flies its own course (built from the line this part hands back, so it cannot be known here), and a bird
  // is not its home: it sideslips in the box of swSway, its skin reaches rG spans from its centre (the wings of a peeling bird beat
  // 0.63 further), birdMin grows it about its home with its range from the eye, and a peeling bird is carried up to 150 m east and 14
  // to 34 m down. line: the course as flown where the flock is drawn, x, y, z after one another in this part's own frame, points half
  // a metre apart or nearer. A bird whose box of wander (swept along its peel) comes nearer a point of the line than its reach and
  // `clear` is moved straight away from the line, no farther than clears it. Nothing is dealt again: its turn, its size and its seeds
  // stay, and its threads go with it. Hands back how many it moved. (`clear` is kept at the line's points: between two of them the
  // air can be some 5 mm less. The placing guards above are not asked again: a moved bird may stand under 30 m over the flow or inside
  // 14 m of this part's own camera line. It gives up after 80 rounds: three at most on seeds, nine under a reader's strain.)
  H.keepBirdsOff = (line, clear = 2.5) => {
    const pa = geo.attributes.position, hull = flock.userData.hull, iP0 = threads.geometry.attributes.iP0, n = Math.floor(line.length / 3), gk = (opts.birdMin || 0) * 2.14 / 2.92, BX = style.swayBox, e = m.elements;
    let rG = 0; for (let j = 0; j < pa.count; j++) rG = Math.max(rG, Math.hypot(pa.getX(j), pa.getY(j), pa.getZ(j)));
    const box = (x, y, z) => { const ax = Math.max(Math.abs(x) - BX[0], 0), ay = Math.max(Math.abs(y) - BX[1], 0), az = Math.max(Math.abs(z) - BX[2], 0); return Math.sqrt(ax * ax + ay * ay + az * az); };
    // the line by runs of 24 points, each run's box: a run the bird's whole sweep stands clear of is not walked point by point
    // (a hundred birds against fourteen hundred points is dear on a cold build; a run passed over holds no point the walk would take).
    const RUN = 24, nR = Math.ceil(n / RUN), rb = new Float32Array(nR * 6);
    for (let r = 0; r < nR; r++) { let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9, c0 = 1e9, c1 = -1e9;
      for (let j = r * RUN; j < Math.min(r * RUN + RUN, n); j++) { const x = line[j * 3], y = line[j * 3 + 1], z = line[j * 3 + 2]; if (x < a0) a0 = x; if (x > a1) a1 = x; if (y < b0) b0 = y; if (y > b1) b1 = y; if (z < c0) c0 = z; if (z > c1) c1 = z; }
      rb.set([a0 - 1e-3, a1 + 1e-3, b0 - 1e-3, b1 + 1e-3, c0 - 1e-3, c1 + 1e-3], r * 6); }
    let moved = 0;
    for (let b = 0; b < placed; b++) {
      hull.getMatrixAt(b, m); const sc = Math.hypot(e[0], e[1], e[2]), peel = iBird.getZ(b), vx = 150 * peel, vy = (-34 + 20 * iBird.getW(b)) * peel, vl = Math.sqrt(vx * vx + vy * vy), rB = rG + 0.63 * peel;
      const x0 = e[12], y0 = e[13], z0 = e[14]; let hx = x0, hy = y0, hz = z0;
      for (let round = 0; round < 80; round++) {
        let wd = 1e-3, wj = -1, wt = 0;   // the point of the line the bird wants most room from, and where along its peel it stands nearest that point
        for (let r = 0; r < nR; r++) { const a0 = rb[r * 6] - hx, a1 = rb[r * 6 + 1] - hx, b0 = rb[r * 6 + 2] - hy, b1 = rb[r * 6 + 3] - hy, c0 = rb[r * 6 + 4] - hz, c1 = rb[r * 6 + 5] - hz;
          const gx = Math.max(a0 - Math.max(vx, 0) - BX[0], Math.min(vx, 0) - BX[0] - a1, 0), gy = Math.max(b0 - Math.max(vy, 0) - BX[1], Math.min(vy, 0) - BX[1] - b1, 0), gz = Math.max(c0 - BX[2], -BX[2] - c1, 0);
          const fx = Math.max(Math.abs(a0), Math.abs(a1)), fy = Math.max(Math.abs(b0), Math.abs(b1)), fz = Math.max(Math.abs(c0), Math.abs(c1));
          if (Math.sqrt(gx * gx + gy * gy + gz * gz) > clear + rB * Math.max(sc, Math.sqrt(fx * fx + fy * fy + fz * fz) * gk)) continue;
         for (let j = r * RUN, j1 = Math.min(r * RUN + RUN, n); j < j1; j++) { const qx = line[j * 3] - hx, qy = line[j * 3 + 1] - hy, qz = line[j * 3 + 2] - hz, need = clear + rB * Math.max(sc, Math.sqrt(qx * qx + qy * qy + qz * qz) * gk);
          if (Math.abs(qz) - BX[2] > need) continue;
          if (peel && (Math.max(Math.min(vx, 0) - BX[0] - qx, qx - Math.max(vx, 0) - BX[0]) > need || Math.max(Math.min(vy, 0) - BX[1] - qy, qy - Math.max(vy, 0) - BX[1]) > need || (Math.abs(qx * vy - qy * vx) - BX[0] * Math.abs(vy) - BX[1] * Math.abs(vx)) / vl > need)) continue;   // (not near the whole band its peel sweeps: the search below is dear on a cold build)
          let d = box(qx, qy, qz), t = 0;
          if (peel) { let lo = 0, hi = 1; for (let it = 0; it < 40; it++) { const a = lo + (hi - lo) / 3, c = hi - (hi - lo) / 3; if (box(qx - a * vx, qy - a * vy, qz) < box(qx - c * vx, qy - c * vy, qz)) hi = c; else lo = a; } t = (lo + hi) / 2; d = box(qx - t * vx, qy - t * vy, qz); }
          if (need - d > wd) { wd = need - d; wj = j; wt = t; } } }
        if (wj < 0) break;
        const ja = Math.max(wj - 1, 0), jb = Math.min(wj + 1, n - 1); d0.set(line[jb * 3] - line[ja * 3], line[jb * 3 + 1] - line[ja * 3 + 1], line[jb * 3 + 2] - line[ja * 3 + 2]).normalize();
        d1.set(hx + wt * vx - line[wj * 3], hy + wt * vy - line[wj * 3 + 1], hz - line[wj * 3 + 2]); d1.addScaledVector(d0, -d1.dot(d0));
        if (d1.lengthSq() < 1e-6) { d1.set(d0.z, 0, -d0.x); if (d1.lengthSq() < 1e-6) d1.set(1, 0, 0); }   // a home on the line itself: to the side of the course, level
        d1.normalize(); hx += d1.x * (wd + 0.02); hy += d1.y * (wd + 0.02); hz += d1.z * (wd + 0.02);
      }
      if (hx === x0 && hy === y0 && hz === z0) continue;
      e[12] = hx; e[13] = hy; e[14] = hz; flock.userData.setMatrixAt(b, m); moved++;
      for (let s = 0; s < 2; s++) iP0.setXYZ(b * 2 + s, iP0.getX(b * 2 + s) + hx - x0, iP0.getY(b * 2 + s) + hy - y0, iP0.getZ(b * 2 + s) + hz - z0);
      if (H.birdPos[b]) H.birdPos[b].set(hx, hy, hz);
    }
    if (moved) { flock.userData.commit(); threads.userData.commit(); }
    return moved;
  };
  await ctx.yield();
}

// ---- anchors, update, hand-back ---------------------------------------------------------------------
function _heroFinish(ctx, H) {
  const { flow, style, root, opts } = H; const { IDX, hornZ } = flow;
  const P = (k, i, z) => { const p = flow.point(k, i, z); return new THREE.Vector3(p.x, p.y, z); };
  const crest = P(0, IDX.top, hornZ), trough = P(0, IDX.trough, hornZ), lip = P(11, IDX.lip, hornZ);
  const anchors = {
    portalSeat: { position: H.ringPos.clone(), direction: H.ringDir.clone(), facing: H.ringDir.clone().negate(), radius: 7 },
    flyThrough: H.fly,                                   // col lane -> dive -> north along the foot -> 70 m straight at 40 deg -> ring
    colLane: H.fly[1].clone(),                           // 10 m above the col floor, sheets 6 m above and below
    viewpoints: {
      col: { position: H.fly[1].clone(), lookAt: new THREE.Vector3(crest.x * 0.75, crest.y * 0.45, hornZ * 0.8) },
      barrel: { position: H.fly[5].clone(), lookAt: new THREE.Vector3(lip.x * 0.55, lip.y * 0.5, hornZ) },
      cirque: { position: new THREE.Vector3(-420, 14, 0), lookAt: new THREE.Vector3(0, 300, 0) },
    },
    hornTop: H.hornTop ? H.hornTop.clone() : new THREE.Vector3(0, flow.hornH, hornZ),
    crest, trough, lip, rotorCenter: H.rotorCenter.clone(), lenses: H.lensCenters, birds: H.birdPos,
  };
  const camPos = new THREE.Vector3();
  let progress = -1;
  // opts.view = { radius, height, center } overrides what the part viewer orbits; opts.debugView 1-5 picks a close-up
  // (1 barrel, 2 ring close, 3 a chough, 4 from the col with the hero turned round, 5 the ring from the approach)
  const dbg = String(opts.debugView || ''), b0 = H.birdPos[2] || crest;
  const VIEW = opts.view || (dbg === '1' ? DEBUG_VIEW : dbg === '2' ? { radius: 14, height: 10, center: [H.ringPos.x, H.ringPos.y, H.ringPos.z * H.sgn] }
    : dbg === '3' ? { radius: 3, height: 30, center: [b0.x, b0.y, b0.z * H.sgn] } : dbg === '4' ? { radius: 932, height: 3900, center: [-900, 800, -1200] }
    : dbg === '5' ? { radius: 46.5, height: -316, center: [H.ringPos.x, H.ringPos.y, H.ringPos.z * H.sgn] } : HERO_VIEW);
  if (dbg === '4') root.rotation.y = Math.PI;
  return {
    object: root, radius: VIEW.radius, height: VIEW.height, center: new THREE.Vector3(VIEW.center[0], VIEW.center[1], VIEW.center[2] * H.sgn),
    anchors, style, flow, ring: H.ring, sheets: H.sheets, ground: false, groundY: 0,
    size: { x: [-3400, crest.x + 9100], y: [-420, (H.lensCenters[H.lensCenters.length - 1] || crest).y + 80], z: [-1550 * H.sgn, 3350 * H.sgn] },
    // setProgress(u): path progress 0..1 from the world. Times the peel-off of three choughs to the camera's run along the
    // face (u 0.6-0.82). Leave unset (or pass -1) and they peel off on a 22 s loop instead.
    setProgress(u) { progress = u; H.birdProg.value = u; },
    keepBirdsOff: H.keepBirdsOff,   // (line, clear): see _heroBirds. A world calls it once its course is made
    update(dt, time, camera) {
      style.update(dt, time, camera);
      if (H.field && camera) { camera.getWorldPosition(camPos); root.worldToLocal(camPos); H.field.position.copy(camPos); }
    },
    dispose() {},
  };
}
// what the part viewer orbits (not the true size: see `size` on the returned object)
const HERO_VIEW = { radius: 1500, height: 1800, center: [1000, 1000, 1150] };
const DEBUG_VIEW = { radius: 250, height: -600, center: [200, 400, 770] };
