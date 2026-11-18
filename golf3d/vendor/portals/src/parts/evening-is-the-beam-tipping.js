// Evening Is the Beam Tipping: the hero (the brass beam, its sun, its moon, the ring and hook that hold the sky)
// and the STYLE KIT of the world: a balanced mobile of painted 6 mm birch ply, brass wire and waxed linen thread.
//
// READ THIS FIRST (world coder)
// COORDINATES. The hero is built in the brief's own numbers, shifted so the balance loop's plumb line is the origin:
//   hero-local = brief-world - (40, 0, 208).  Put hero.object at (40, 0, 208), no rotation, and every number in the
//   brief's "space" holds (balance loop at local (0,400,0), ring centre (0,420,0), hook y 640, beam along
//   (0.5,0,0.866): sun end at -240 m, moon end at +360 m). The DAY faces look toward -Z, where the brief's camera
//   enters, so in the set-piece viewer the brief's entry side is the late part of the orbit (u about 0.6-0.75).
// PROGRESS. Everything scripted hangs on one number: hero.setProgress(u) (u = flight progress 0..1). If it is never
//   called the hero runs a 40 s demo loop from time (that is what the viewer shows). style.setProgress(u) is called
//   by the hero; if the world shares one style it may call either.  eve = smoothstep(0.05,0.95,u) drives the beam
//   tilt (14.5 - 29 eve degrees), light height (17 -> 8 degrees), shadow tint and air.
//
// makeStyle(ctx, opts) -> style            opts: { palette: [7 hex, brief order], shadowSize: 2048, detail }
//   style.pal        linear THREE.Color pots: sun, moon, cloud, bird, boat, hill, night, brass, thread, plyLight,
//                    plyDark, room, roomEve, patch, airCool          (flat switch: the colour written is the colour shown)
//   style.U          shared uniforms (uTime, uEve, uLightDir, uTint, uAir*, uShadow*, uViewH, uShadeY = world heights
//                    between which the window's light gives out toward the ceiling, default 540..610); all materials below
//                    hold THESE objects, so driving them once drives the world
//   style.update(dt, time, camera)   every frame, before drawing: time, viewport height
//   style.setProgress(u), style.eveAt(u), style.tiltAt(u) (radians, + = sun end up)
//   style.plyMaterial      ONE unlit two-value ShaderMaterial for every painted slab (InstancedMesh only; see pieceMesh)
//   style.wireMaterial     brass rod, arm, loop, ring: two values + one soft cream highlight along the wire; never
//                          thinner than 1.5 px (it fattens with distance instead of shimmering)
//   style.linenMaterial    same shader, matte linen: knots and knot tails (shrinks away beyond ~450 m)
//   style.threadMaterial   camera-facing ribbon, never under 1.5 px wide, trades alpha for width, vanishes first in air
//   style.GLSL             the shared shader chunk (mobLit / mobValue / mobAir) for a material of your own (the far wall)
//   style.roomMaterial     the out-of-focus room for a dome (BackSide sphere that follows the camera): rose to mauve
//   style.slab(outline, o) extrude a closed outline [[x,y],...] (metres, counter-clockwise) into a 6 m ply slab with
//                          the saw wobble, day cap (+Z), evening cap (-Z), five-ply wall and the pencil-line inset ring
//   style.pieceMesh(geo, n)      InstancedMesh with the per-instance paint attributes; style.paint(mesh, i, {...})
//   style.tubeGeo(), style.loopGeo(R, r, turns), style.threadGeo(), style.knotGeo(seed)  + style.wireMesh(geo, n),
//   style.setTube(mesh, i, a, b, r), style.setThread(mesh, i, a, b)
//   style.shape(kind, k, size)   the maker's thirteen silhouettes ('cloud' 0..3, 'swallow' 0..1, 'hill' 0..2, 'wave' 0..1,
//                          'boat' 0..1) -> { outline, top, bot, slab, paint }:  const sh = style.shape('cloud', 3, 35);
//                          const m = style.pieceMesh(style.slab(sh.outline, sh.slab), n); style.paint(m, i, sh.paint);
//                          m.setMatrixAt(i, ...) every frame (rotation.y = PI shows the day face toward -Z). Cloud 3 is
//                          the chipped one. Hang threads from (0, sh.top, 0) and arms from (0, sh.bot, 0).
//   style.shadow     { target, camera, layer, focus(center), compile(renderer), render(renderer, scene) }:
//                    the one 2048 orthographic depth pass, 900 x 700 m, seen from the window. Casters are whatever
//                    has layer style.shadow.layer enabled (pieceMesh and wireMesh(.., cast=true) do it).
//                    The WORLD calls shadow.render(ctx.renderer, scene) once per frame in update() when it shares the
//                    style (opts.style); a hero that made its own style renders it itself.
//   style.dispose()  render target and textures not reachable from the scene
// POST the style expects: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } }.
//   Nothing is pre-corrected for a tone map and nothing exceeds 1. The brief's shadow tint (0.66,0.60,0.70 ->
//   0.52,0.50,0.68) is read as a painter's display multiplier and converted to linear in setProgress.
// NOTES: thin wire (arms, 0.5 m) is under one shadow texel: build it with wireMesh(geo, n) (cast = false); only the
//   1.6 m beam, the loops and the ring cast. Every style mesh is an InstancedMesh with frustumCulled = false.
//   In update(): write matrices, call style.update, then style.shadow.render; never make a material there.
//
// How each rule of the styleNote is kept: see the comment on each material below.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const BRIEF_PALETTE = ['#F08A2C', '#F6EBC8', '#3E73B8', '#C9402E', '#6F9E5B', '#2B2F5E', '#C8A24A'];
const PLY = 6;                       // 6 mm ply at 1000:1
const DEG = Math.PI / 180;
const BEAM_AXIS = new THREE.Vector3(0.5, 0, 0.866).normalize();   // from the sun end toward the moon end
const SUN_ARM = 240, MOON_ARM = 360, LOOP_Y = 400;

// ---- GLSL shared by every material of the style --------------------------------------------------------------
// Light: ONE light, the low window sun. Paint has two values: lit = pot, shadow = pot * uTint. The shadow edge is
// soft, of one fixed width (16 taps on a fixed disc, each a four-texel compare: no grain, no steps).
const GLSL_COMMON = /* glsl */`
uniform float uTime, uEve, uAirMax, uAirFar, uShadowOn, uShadowRange, uShadowSpan;
uniform vec2 uShadeY;
uniform vec3 uLightDir, uTint, uAirWarm, uAirCool;
uniform sampler2D uShadowMap;
uniform mat4 uShadowMat;
float mobHash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float mobNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mobHash(i), mobHash(i + vec2(1., 0.)), f.x), mix(mobHash(i + vec2(0., 1.)), mobHash(i + vec2(1., 1.)), f.x), f.y); }
float mobTap(vec2 uv){ return textureLod(uShadowMap, uv, 0.).r; }
// 1 = in the window's light, 0 = in another piece's shadow. soft scales the edge (1 for pieces).
// A shadow is ONE clean shape with ONE even soft edge: every tap compares whole texels of the depth picture (in or
// out, nothing between) and blends the four answers by the tap's place among them, so the outline is smooth and
// there is no depth arithmetic across an outline (that drew crack lines and blocks where casters stood behind each
// other). The edge has one fixed width (1.3 m radius), the same on every face. A caster further than MOB_REACH metres
// up the light casts nothing on a piece: in this room such a shadow has melted into the air, and a face wears the
// shadow of its neighbour, never the stacked blur of a whole tier.
const float MOB_REACH = 125.;
float mobIn(ivec2 t, ivec2 hi, float zb, float zf){ float d = texelFetch(uShadowMap, clamp(t, ivec2(0), hi), 0).r; return step(d, zb) * step(zf, d); }
float mobLitIn(vec3 wp, vec3 wn, float soft, vec2 fc){
  vec4 s = uShadowMat * vec4(wp + wn * 0.5, 1.);
  if (uShadowOn < 0.5 || s.x < 0.004 || s.x > 0.996 || s.y < 0.004 || s.y > 0.996) return 1.;
  vec2 res = vec2(textureSize(uShadowMap, 0)); ivec2 hi = ivec2(res) - 1;
  float z = s.z - 0.5, zb = z - 1.0 / max(uShadowRange, 1.), zf = z - MOB_REACH / max(uShadowRange, 1.);
  float rad = 1.3 * soft / max(uShadowSpan, 1.) * res.x;            // in texels
  vec2 base = s.xy * res - 0.5;
  float occ = 0.;
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    float a = fi * 2.39996, rr = sqrt((fi + 0.5) / 16.) * rad;
    vec2 q = base + vec2(cos(a), sin(a)) * rr, f = fract(q); ivec2 t = ivec2(floor(q));
    occ += mix(mix(mobIn(t, hi, zb, zf), mobIn(t + ivec2(1, 0), hi, zb, zf), f.x),
               mix(mobIn(t + ivec2(0, 1), hi, zb, zf), mobIn(t + ivec2(1, 1), hi, zb, zf), f.x), f.y);
  }
  return 1. - smoothstep(0.06, 0.94, occ / 16.);
}
float mobLit(vec3 wp, vec3 wn, float soft, vec2 fc){ return mobLitIn(wp, wn, soft, fc) * (1. - smoothstep(uShadeY.x, uShadeY.y, wp.y)); }
// two values, nothing else: the pot, or the pot times the one tint
vec3 mobValue(vec3 pot, float lit){ return pot * mix(uTint, vec3(1.), lit); }
// distance pales into the room's air: apricot toward the window, blue-grey away from it
vec3 mobAir(vec3 col, vec3 wp, float k){
  vec3 v = wp - cameraPosition; float d = length(v);
  float side = 0.5 - 0.5 * dot(v / max(d, 1e-3), uLightDir);
  return mix(col, mix(uAirCool, uAirWarm, side), clamp(d / max(uAirFar, 1.), 0., 1.) * uAirMax * k);
}
`;

// ---- the style ------------------------------------------------------------------------------------------------
export function makeStyle(ctx, opts = {}) {
  const hex = (opts.palette && opts.palette.length >= 7) ? opts.palette : BRIEF_PALETTE;
  const C = (h) => new THREE.Color(h);
  const pal = {
    sun: C(hex[0]), moon: C(hex[1]), cloud: C('#F4F1EA'), bird: C(hex[2]), boat: C(hex[3]), hill: C(hex[4]), night: C(hex[5]),
    brass: C(hex[6]), thread: C('#D9CDB8'), plyLight: C('#E6D3A8'), plyDark: C('#B98F5A'),
    room: C('#C99A93'), roomEve: C('#7E6A86'), patch: C('#F6C79A'), airCool: C('#8FA1C2'),
  };
  const SHADOW_W = 900, SHADOW_H = 700, SHADOW_RANGE = 1400, CAST_LAYER = 1;
  const size = opts.shadowSize || 2048;
  const target = new THREE.WebGLRenderTarget(size, Math.round(size * SHADOW_H / SHADOW_W), {
    type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    depthBuffer: true, stencilBuffer: false, generateMipmaps: false,
  });
  target.texture.colorSpace = THREE.NoColorSpace;
  const U = {
    uTime: { value: 0 }, uEve: { value: 0 }, uViewH: { value: 450 },
    uLightDir: { value: new THREE.Vector3(0.5, -0.3, 0.8).normalize() },
    uTint: { value: new THREE.Vector3(0.66, 0.60, 0.70) },
    uAirWarm: { value: pal.patch.clone() }, uAirCool: { value: pal.airCool.clone() },
    uAirMax: { value: 0.45 }, uAirFar: { value: 900 },
    uShadowMap: { value: target.texture }, uShadowMat: { value: new THREE.Matrix4() }, uShadowOn: { value: 0 },
    uShadowRange: { value: SHADOW_RANGE }, uShadowSpan: { value: SHADOW_W }, uShadeY: { value: new THREE.Vector2(540, 610) },
    uPlyLight: { value: pal.plyLight }, uPlyDark: { value: pal.plyDark }, uCream: { value: pal.moon },
  };
  // opts.tilt [deg at u 0, deg at u 1] and opts.eve [evening at u 0, at u 1] let the world run other hours (dawn runs
  // the beam the other way, day holds it near level, night begins half tipped); opts.elev [deg, deg] the window sun.
  const TILT = opts.tilt || [14.5, -14.5], EVE = opts.eve || [0, 1], ELEV = opts.elev || [17, 8];
  const eveAt = (u) => smoothstep(0.05, 0.95, u);
  const tiltAt = (u) => lerp(TILT[0], TILT[1], eveAt(u)) * DEG;
  let progress = 0;
  function setProgress(u) {
    progress = clamp(u, 0, 1);
    const e = lerp(EVE[0], EVE[1], eveAt(progress)), el = lerp(ELEV[0], ELEV[1], e) * DEG;
    U.uEve.value = e;
    U.uLightDir.value.set(0.53 * Math.cos(el), -Math.sin(el), 0.848 * Math.cos(el)).normalize();
    // the brief's tint is a painter's (display) multiplier; the pipeline is linear, so it is converted here
    U.uTint.value.set(Math.pow(lerp(0.66, 0.52, e), 2.2), Math.pow(lerp(0.60, 0.50, e), 2.2), Math.pow(lerp(0.70, 0.68, e), 2.2));
  }
  setProgress(0);

  // The shadow: ONE orthographic depth picture taken from the window, 900 x 700 m, linear depth - 0.5 in a
  // half-float target (linear filtered). Only objects with layer CAST_LAYER enabled are drawn into it.
  const shadowCam = new THREE.OrthographicCamera(-SHADOW_W / 2, SHADOW_W / 2, SHADOW_H / 2, -SHADOW_H / 2, 1, 1 + SHADOW_RANGE);
  shadowCam.layers.set(CAST_LAYER);
  // Only the faces turned AWAY from the window are drawn (second-depth shadows): a lit face then sits a whole slab
  // in front of its own stored depth, so there is no acne at any angle and almost no bias is needed.
  const depthMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: /* glsl */`void main(){
      #ifdef USE_INSTANCING
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.);
      #else
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
      #endif
    }`,
    fragmentShader: /* glsl */`void main(){ gl_FragColor = vec4(gl_FragCoord.z - 0.5, 0., 0., 1.); }`,
  });
  const focusPt = new THREE.Vector3(0, 300, 0), clearCol = new THREE.Color().setRGB(0.5, 0, 0), keepCol = new THREE.Color();
  const biasM = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  const upV = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3();
  function aimShadow() {
    const L = U.uLightDir.value;
    shadowCam.position.copy(focusPt).addScaledVector(L, -SHADOW_RANGE * 0.5);
    shadowCam.up.copy(upV); shadowCam.lookAt(tmpV.copy(focusPt));
    shadowCam.updateMatrixWorld(true);
    U.uShadowMat.value.copy(biasM).multiply(shadowCam.projectionMatrix).multiply(shadowCam.matrixWorldInverse);
  }
  const proxyScene = new THREE.Scene();
  const proxy = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), depthMaterial, 1);
  proxy.layers.set(CAST_LAYER); proxy.frustumCulled = false; proxyScene.add(proxy);
  const shadow = {
    target, camera: shadowCam, layer: CAST_LAYER, material: depthMaterial, width: SHADOW_W, height: SHADOW_H,
    /** world-space centre of the 900 x 700 m picture (the middle of the mobile) */
    focus(v) { focusPt.copy(v); },
    /** call once inside build(): compiles the depth program for this target so the first frame does not */
    compile(renderer) {
      if (!renderer) return;
      aimShadow();
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(target); renderer.compile(proxyScene, shadowCam, proxyScene); renderer.setRenderTarget(prev);
    },
    /** call once a frame after matrices are written: draws the casters of `scene` from the light */
    render(renderer, scene) {
      if (!renderer) return;
      aimShadow();
      const prevRT = renderer.getRenderTarget(), prevOv = scene.overrideMaterial, prevBg = scene.background, prevAuto = renderer.autoClear;
      const prevFog = scene.fog; scene.fog = null;      // fog is part of a program's identity: without it this is the program compile() made
      renderer.getClearColor(keepCol); const keepA = renderer.getClearAlpha();
      scene.overrideMaterial = depthMaterial; scene.background = null; renderer.autoClear = true;
      renderer.setRenderTarget(target); renderer.setClearColor(clearCol, 1);
      renderer.render(scene, shadowCam);
      renderer.setRenderTarget(prevRT); renderer.setClearColor(keepCol, keepA);
      scene.overrideMaterial = prevOv; scene.background = prevBg; renderer.autoClear = prevAuto; scene.fog = prevFog;
      U.uShadowOn.value = 1;
    },
  };

  // PLY: the one unlit two-value material of every painted piece. styleNote rules kept here:
  //  - seven pots, no mixing: a fragment is one pot (day cap = iColA, evening cap = iColB, their accent = iAccA/B)
  //  - bare five-ply edge: the wall (object normal z = 0) shows bands of plyLight / plyDark, 1.2 m each, running along
  //  - two values: pot, or pot * uTint under a soft-edged cast shadow or when the face looks away from the window
  //  - the hand: brush streaks along the long axis (uv.x), lap bands, thin-coat grain, chips to bare ply near a cut,
  //    and the pencil line 0.8 m inside one cut (aEdge.y marks which cut)
  //  - distance pales into the room's air
  const plyMaterial = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`
      attribute vec3 aEdge, iColA, iColB, iAccA, iAccB; attribute vec4 iAccBox, iMisc, iHand;
      varying vec3 vWP, vWN, vON, vOP, vEdge, vCA, vCB, vAA, vAB; varying vec2 vUv; varying vec4 vBox, vMisc, vHand;
      void main(){
        vHand = iHand;
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.);
        vWP = wp.xyz; vWN = mat3(modelMatrix) * mat3(instanceMatrix) * normal; vON = normal; vOP = position;
        vEdge = aEdge; vUv = uv; vCA = iColA; vCB = iColB; vAA = iAccA; vAB = iAccB; vBox = iAccBox; vMisc = iMisc;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      uniform vec3 uPlyLight, uPlyDark;
      varying vec3 vWP, vWN, vON, vOP, vEdge, vCA, vCB, vAA, vAB; varying vec2 vUv; varying vec4 vBox, vMisc, vHand;
      void main(){
        vec3 n = vWN / max(length(vWN), 1e-4);
        vec2 fw = fwidth(vOP.xy) + 1e-4; float fe = fwidth(vEdge.x) + 1e-4;
        float fy = fwidth(vUv.y), fz = fwidth(vOP.z) * (5. / ${PLY.toFixed(1)}) + 1e-4;
        // the per-piece seed is the same on every corner, but an interpolated varying still differs in its last bits
        // from triangle to triangle and pixel to pixel: it is snapped to the 64ths paint() wrote before anything reads it
        float sq = floor(vMisc.w * 64. + 0.5), seed = sq / 64., day = step(0.5, vON.z + 0.75);
        // the pot
        float inb = smoothstep(-fw.x, fw.x, vOP.x - vBox.x) * smoothstep(-fw.x, fw.x, vBox.z - vOP.x)
                  * smoothstep(-fw.y, fw.y, vOP.y - vBox.y) * smoothstep(-fw.y, fw.y, vBox.w - vOP.y);
        float eb = (vMisc.y > vMisc.x) ? smoothstep(-fe, fe, vEdge.x - vMisc.x) * smoothstep(-fe, fe, vMisc.y - vEdge.x) * smoothstep(0.35, 0.65, vEdge.z) : 1.;
        vec3 pot = mix(mix(vCB, vCA, day), mix(vAB, vAA, day), inb * eb);
        // the maker's spiral, one brush line in the accent pot on the evening face (asked for with box = [2000, pitch,
        // -1, outer radius]; the sun alone carries it): it wanders a little, starts off-centre and stops where he lifted the brush
        if (vBox.x > 1500.) {
          float rr = length(vOP.xy), th = rr > 0.5 ? atan(vOP.y, vOP.x) : 0.;
          float wob = 1.2 * (mobNoise(vOP.xy * 0.09 + seed) - 0.5), fr = max(fw.x, fw.y);
          float sp = abs(mod(rr + wob - vBox.y * th / 6.2832 + 0.5 * vBox.y, max(vBox.y, 1.)) - 0.5 * vBox.y);
          float hwS = 0.9 + 0.35 * mobNoise(vOP.xy * 0.05 + seed * 3.);
          float ln = (1. - smoothstep(hwS - fr, hwS + fr, sp)) * smoothstep(3.2, 4.6, rr) * (1. - smoothstep(vBox.w - 0.4, vBox.w + 0.4, rr + 0.35 * th));
          pot = mix(pot, vAB, ln * (1. - day));
        }
        // the hand
        // fine streaks fade before the pixel grid can beat with them; a broad stroke carries the brush to 100 m and more
        // every mark is gone before its period is five pixels: nothing can screen, weave or crawl
        float near = 1. - smoothstep(0.03, 0.08, fy), nearG = 1. - smoothstep(0.008, 0.022, fy), near2 = 1. - smoothstep(0.14, 0.36, fy);
        float broad = mobNoise(vec2(vUv.x * 0.018 + seed * 2.3, vUv.y * 0.55 + seed * 1.7 + day * 5.)) - 0.5;
        float streak = mobNoise(vec2(vUv.x * 0.045 + seed * 7.1, vUv.y * 2.4 + seed * 3.3 + day * 9.)) - 0.5;
        // lap bands: the coat laid in broad passes along the long axis. The band coordinate is the face's own smooth
        // uv (continuous over the whole cap), the seam wanders a metre or two, its edge is a ramp never under three
        // pixels wide, each band's value is a hash of two WHOLE numbers, and the laps fade out before a band is ~15 px
        float ly = vUv.y / max(vHand.w, 1.) + 0.18 * (mobNoise(vec2(vUv.x * 0.03, seed * 5. + day * 3.)) - 0.5);
        float fly = fwidth(ly) + 1e-5, lapI = floor(ly), lapW2 = min(max(0.07, 3. * fly), 0.5);
        float lapT = smoothstep(0.5 - lapW2, 0.5 + lapW2, ly - lapI), lapS = mod(sq, 89.) + day * 31.;
        float lap = (mix(mobHash(vec2(lapI, lapS)), mobHash(vec2(lapI + 1., lapS)), lapT) - 0.5) * (1. - smoothstep(0.02, 0.045, fly));
        float grain = mobNoise(vec2(vUv.x * 0.3 + seed, vUv.y * 9.));
        float thin = smoothstep(0.55, 0.95, mobNoise(vec2(vUv.x * 0.02 + seed * 3., vUv.y * 0.3 + day * 4.)));
        pot *= 1. + 0.09 * streak * near + 0.07 * broad * near2 + vHand.z * lap;
        pot = mix(pot, uPlyLight, thin * grain * 0.12 * nearG);
        float chipN = mobNoise(vOP.xy * 0.2 + seed * 11. + day * 3.) + 0.3 * (1. - clamp(vEdge.x / 1.4, 0., 1.));
        float chipT = 1.03 - 0.36 * clamp(vMisc.z, 0., 1.);
        float chip = step(0.01, vMisc.z) * smoothstep(chipT, chipT + 0.03, chipN) * (1. - smoothstep(0.9, 1.4, vEdge.x));
        pot = mix(pot, uPlyLight * (0.95 + 0.07 * grain), chip);
        // the pencil line, 0.8 m inside one cut; the two great pieces were drawn with a softer, broader lead (vHand.y)
        float hw = max(vHand.y, 0.02);
        float pl = (1. - smoothstep(hw - fe, hw + fe, abs(vEdge.x - 0.8))) * (1. - smoothstep(1.7 * hw, 5.7 * hw, fe)) * step(0.5, vEdge.y);
        pl *= 0.55 + 0.45 * mobNoise(vec2(vUv.x * 1.3, vUv.y * 1.3 + seed));
        pot = mix(pot, pot * 0.5, pl * (0.6 + 0.3 * step(0.12, hw)));
        // the bare five-ply edge
        float f = (vOP.z / ${PLY.toFixed(1)} + 0.5) * 5.;
        float tri = abs(fract((f - 0.5) * 0.5) * 2. - 1.);
        float dark = 1. - smoothstep(0.5 - fz, 0.5 + fz, tri);
        vec3 wall = mix(uPlyLight, uPlyDark, dark) * (0.97 + 0.06 * mobNoise(vec2(vUv.x * 0.25, floor(f) + seed)));
        pot = mix(wall, pot, step(0.5, abs(vON.z)));
        // two values and the air
        float lit = smoothstep(0.0, 0.1, dot(n, -uLightDir)) * mobLit(vWP, n, 1., gl_FragCoord.xy);
        gl_FragColor = vec4(min(mobAir(mobValue(pot, lit), vWP, vHand.x), vec3(1.)), 1.);
      }`,
  });

  // WIRE: brass alone shines. Two values like paint, plus ONE soft highlight along the wire toward cream (<= 1.0);
  // draw lines run along the wire (uv.y is the angle round it), so nothing crosses it. Vertex stage keeps every wire
  // at least 1.5 px thick. uVanish > 0 (linen knots and tails) shrinks the instance to nothing beyond that range.
  const wireShader = (color, shine, vanish, minPx = 0.75, air = 0.7) => new THREE.ShaderMaterial({
    uniforms: { ...U, uColor: { value: color }, uShine: { value: shine }, uVanish: { value: vanish }, uMinPx: { value: minPx },
      uBandLen: { value: 0 }, uBand0: { value: pal.boat }, uBand1: { value: pal.moon }, uBand2: { value: pal.night }, uFade: { value: 0 } }, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      uniform float uViewH, uVanish, uMinPx; attribute float aR; attribute vec3 aT;
      varying vec3 vWP, vWN, vT; varying vec2 vUv; varying float vCov;
      void main(){
        mat4 m = modelMatrix * instanceMatrix;
        vec4 wp = m * vec4(position, 1.);
        vec3 wn = mat3(m) * normal; wn /= max(length(wn), 1e-5);
        float dist = length(wp.xyz - cameraPosition);
        float pxm = 2. * dist / max(projectionMatrix[1][1] * uViewH, 1.);
        wp.xyz += wn * max(uMinPx * pxm - aR * length(m[1].xyz), 0.) * step(1e-4, aR);
        // how much of the drawn width is really wire (1 near the lens; far off the wire is held at its least width)
        vCov = clamp(aR * length(m[1].xyz) / max(uMinPx * pxm, 1e-4), 0., 1.);
        if (uVanish > 0.) wp.xyz = mix(m[3].xyz, wp.xyz, 1. - smoothstep(uVanish * 0.6, uVanish, dist));
        vWP = wp.xyz; vWN = wn; vUv = uv; vT = mat3(m) * aT;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: GLSL_COMMON + /* glsl */`
      uniform vec3 uColor, uCream, uBand0, uBand1, uBand2; uniform float uShine, uBandLen, uFade;
      varying vec3 vWP, vWN, vT; varying vec2 vUv; varying float vCov;
      void main(){
        vec3 n = vWN / max(length(vWN), 1e-4);
        vec3 v = cameraPosition - vWP; v /= max(length(v), 1e-3);
        // Brass alone shines. The half-way direction between the lens and the window is laid flat across the wire
        // (its part along the wire is taken out), so ONE cream line runs the whole length of every wire whatever the
        // angle it is seen from, also end-on and from below. The flank turned to that direction is the pot colour,
        // the far flank the shadow value: two values and the line, nothing else.
        vec3 h = v - uLightDir + vec3(0., 0.35, 0.);
        float tl = length(vT);
        if (tl > 1e-3) { vec3 a = vT / tl; h -= a * dot(a, h); }
        h /= max(length(h), 1e-3);
        float nh = dot(n, h);
        float flank = mix(smoothstep(-0.05, 0.3, dot(n, -uLightDir)), smoothstep(-0.45, -0.05, nh), step(0.01, uShine));
        float lit = flank * mobLit(vWP, n, 1., gl_FragCoord.xy);
        // draw lines from the die run along the wire (uv.y is the angle round it): nothing crosses it
        float fl = fwidth(vUv.y * 9.) + 1e-4;
        float draw = (1. - smoothstep(0.06 - fl, 0.06 + fl, abs(fract(vUv.y * 9. + 0.37) - 0.5))) * (1. - smoothstep(0.15, 0.45, fl));
        vec3 pot = uColor * (0.95 + 0.1 * mobNoise(vec2(vUv.y * 46., 0.5))) * (1. - 0.16 * draw * step(0.01, uShine));
        // the great rod alone is painted: sleeves of matte pot colour, 9 m in every 40 m, along its sun arm (uBandLen =
        // the rod's length in metres; 0 on every other wire). Paint does not shine: no cream line on a sleeve.
        float sM = vUv.x * uBandLen, fs = fwidth(sM) + 1e-4, ci = floor(sM / 40.), cf = sM - ci * 40.;
        float band = step(0.5, uBandLen) * smoothstep(-fs, fs, cf - 14.) * (1. - smoothstep(-fs, fs, cf - 23.)) * (1. - smoothstep(236., 238., sM));
        float k3 = mod(ci, 3.);
        pot = mix(pot, k3 < 0.5 ? uBand0 : (k3 < 1.5 ? uBand1 : uBand2), band);
        vec3 col = mobValue(pot, mix(lit, smoothstep(-0.05, 0.3, dot(n, -uLightDir)) * mobLit(vWP, n, 1., gl_FragCoord.xy), band));
        col = mix(col, uCream, smoothstep(0.80, 0.97, nh) * uShine * (0.3 + 0.7 * lit) * (1. - band));
        // (uFade 1, the far wire: it keeps its least width and trades opacity, as the linen does, down to three tenths)
        gl_FragColor = vec4(min(mobAir(col, vWP, ${air.toFixed(2)}), vec3(1.)), mix(1., max(0.3, vCov), uFade));
      }`,
  });
  const wireMaterial = wireShader(pal.brass, 0.8, 0);
  const beamMaterial = wireShader(pal.brass, 0.85, 0, 1.3, 0.3);      // the one great rod: never under 2.6 px, so it reads as a brass line from the entry
  beamMaterial.uniforms.uBandLen.value = SUN_ARM + MOON_ARM;
  const linenMaterial = wireShader(pal.thread, 0, 450);
  /** brass for the many small arms: the same wire, but far off it trades opacity for its least width (the air takes thin things first) */
  const farWireMaterial = wireShader(pal.brass, 0.8, 0);
  farWireMaterial.uniforms.uFade.value = 1; farWireMaterial.transparent = true;
  /** brass that hangs in the ceiling's own shadow (the hook): the same wire, with its own heights where the window's light gives out */
  const shadeWire = (y0, y1) => { const m = wireShader(pal.brass, 0.5, 0); m.uniforms.uShadeY = { value: new THREE.Vector2(y0, y1) }; return m; };

  // THREAD: waxed linen, a ribbon that always faces the lens. Never under 1.5 px wide: beyond that it keeps its
  // width and loses alpha, and it is the first thing the air takes (gone by ~800 m). One shadow tap per vertex.
  const threadMaterial = new THREE.ShaderMaterial({
    uniforms: { ...U, uColor: { value: pal.thread } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      uniform float uViewH, uShadowOn, uShadowRange; uniform sampler2D uShadowMap; uniform mat4 uShadowMat; uniform vec2 uShadeY;
      attribute vec3 iBow; varying vec3 vWP; varying float vA, vLit;
      void main(){
        mat4 m = modelMatrix * instanceMatrix;
        float t = position.x;
        vec3 ax = m[0].xyz;
        vec3 p = m[3].xyz + ax * t + iBow * (4. * t * (1. - t));
        vec3 tv = ax + iBow * (4. - 8. * t);
        vec3 toC = cameraPosition - p; float dist = length(toC);
        vec3 sd = cross(tv, toC); sd /= max(length(sd), 1e-4);
        float pxm = 2. * dist / max(projectionMatrix[1][1] * uViewH, 1.);
        float hw = max(0.125, 0.75 * pxm);
        p += sd * position.y * hw;
        vA = (0.125 / hw) * (1. - smoothstep(380., 820., dist));
        vec4 s = uShadowMat * vec4(p, 1.);
        float inside = step(0.004, s.x) * step(s.x, 0.996) * step(0.004, s.y) * step(s.y, 0.996) * uShadowOn;
        vLit = 1. - inside * step(textureLod(uShadowMap, s.xy, 0.).r, s.z - 0.5 - 2.5 / max(uShadowRange, 1.));
        vLit *= 1. - smoothstep(uShadeY.x, uShadeY.y, p.y);
        vWP = p;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor, uTint, uAirWarm, uAirCool, uLightDir; uniform float uAirMax, uAirFar;
      varying vec3 vWP; varying float vA, vLit;
      void main(){
        vec3 col = uColor * mix(uTint, vec3(1.), vLit);
        vec3 v = vWP - cameraPosition; float d = length(v);
        float side = 0.5 - 0.5 * dot(v / max(d, 1e-3), uLightDir);
        col = mix(col, mix(uAirCool, uAirWarm, side), clamp(d / max(uAirFar, 1.), 0., 1.) * uAirMax);
        gl_FragColor = vec4(min(col, vec3(1.)), clamp(vA, 0., 1.));
      }`,
  });

  // ROOM: the sky is the room, out of focus. For a BackSide sphere the world moves with the camera. Dusty rose,
  // darker to a ceiling lost overhead, deeper rose below (there is no floor), deepening to mauve with uEve; the
  // window (soft apricot, two blurred glazing bars) sits where the light comes from and is seen only on turning.
  const roomMaterial = new THREE.ShaderMaterial({
    uniforms: { ...U, uRoom: { value: pal.room }, uRoomEve: { value: pal.roomEve }, uPatch: { value: pal.patch } },
    side: THREE.BackSide, depthWrite: false,
    vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uRoom, uRoomEve, uPatch, uLightDir; uniform float uEve; varying vec3 vDir;
      void main(){
        vec3 d = vDir / max(length(vDir), 1e-4);
        vec3 base = mix(uRoom, uRoomEve, uEve);
        vec3 col = base * mix(1., 0.6, smoothstep(0.02, 0.85, d.y));
        col = mix(col, base * vec3(0.9, 0.8, 0.84), (1. - smoothstep(-0.9, 0., d.y)));
        vec2 lh = uLightDir.xz / max(length(uLightDir.xz), 1e-3);
        float f = -(d.x * lh.x + d.z * lh.y);
        vec2 q = vec2(d.x * lh.y - d.z * lh.x, d.y + uLightDir.y * 0.6) / max(f, 0.15);
        float win = smoothstep(0.15, 0.4, f) * (1. - smoothstep(0.2, 0.3, abs(q.x))) * (1. - smoothstep(0.36, 0.48, abs(q.y - 0.08)));
        float bars = 1. - 0.28 * max(1. - smoothstep(0.012, 0.05, abs(q.x)), 1. - smoothstep(0.012, 0.05, abs(q.y - 0.1)));
        col = mix(col, mix(uPatch, uPatch * vec3(0.9, 0.78, 0.8), uEve) * bars, win * 0.9);
        gl_FragColor = vec4(min(col, vec3(1.)), 1.);
      }`,
  });

  // ---- geometry of the style ---------------------------------------------------------------------------------
  /** A closed outline [[x,y],...] in metres, counter-clockwise, cut from 6 m ply by a saw that wanders `wobble` m.
   *  +Z cap = day face, -Z cap = evening face, wall = bare ply edge. Each cap has an inset ring (aEdge.x = metres
   *  from the cut) that carries the pencil line (o.line = [from, to] as fractions of the perimeter) and the
   *  ridge / crest accents (aEdge.z = 1 where the cut faces up). o.long 'x'|'y' = the brush direction. ~8 N triangles. */
  function slab(outline, o = {}) {
    const N = outline.length, wob = o.wobble ?? 0.4, seed = o.seed ?? 0, inset = o.inset ?? 1.6, longY = o.long === 'y';
    const line = o.line || [0.06, 0.4], h = PLY / 2;
    const P = outline.map((p) => [p[0], p[1]]);
    const E = new Array(N), VN = new Array(N), S = new Float32Array(N + 1);
    const frame = () => {
      for (let i = 0; i < N; i++) { const a = P[i], b = P[(i + 1) % N]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1e-6; E[i] = [dy / l, -dx / l]; S[i + 1] = S[i] + l; }
      for (let i = 0; i < N; i++) { const a = E[(i + N - 1) % N], b = E[i]; const x = a[0] + b[0], y = a[1] + b[1], l = Math.hypot(x, y) || 1e-6; VN[i] = [x / l, y / l]; }
    };
    frame();
    if (wob > 0) {
      const tot = S[N], k = tot * 0.085 / (2 * Math.PI);
      for (let i = 0; i < N; i++) { const a = 2 * Math.PI * S[i] / tot; const w = wob * ctx.noise.n2(Math.cos(a) * k + seed * 13.7, Math.sin(a) * k - seed * 5.3); P[i][0] += VN[i][0] * w; P[i][1] += VN[i][1] * w; }
      frame();
    }
    const segDist = (qx, qy) => { let m = 1e9; for (let i = 0; i < N; i++) { const a = P[i], b = P[(i + 1) % N]; const dx = b[0] - a[0], dy = b[1] - a[1]; const t = clamp(((qx - a[0]) * dx + (qy - a[1]) * dy) / (dx * dx + dy * dy + 1e-9), 0, 1); const ex = a[0] + dx * t - qx, ey = a[1] + dy * t - qy; const d = ex * ex + ey * ey; if (d < m) m = d; } return Math.sqrt(m); };
    const D = new Float32Array(N), Q = new Array(N);
    for (let i = 0; i < N; i++) {
      // mitred inset: the inner point is d from both cuts that meet here; where the shape is too thin, d halves
      let d = inset; const mit = Math.min(3, 1 / Math.max(0.2, VN[i][0] * E[i][0] + VN[i][1] * E[i][1]));
      for (let k = 0; k < 4; k++) { if (segDist(P[i][0] - VN[i][0] * d * mit, P[i][1] - VN[i][1] * d * mit) >= d * 0.9) break; d = k === 3 ? 0 : d * 0.5; }
      D[i] = d; Q[i] = [P[i][0] - VN[i][0] * d * mit, P[i][1] - VN[i][1] * d * mit];
    }
    const nv = 4 * N + 4 * N + 2 * N, pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), edge = new Float32Array(nv * 3), idx = [];
    const put = (v, x, y, z, nx, ny, nz, u0, v0, e0, e1, e2) => { pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z; nor[v * 3] = nx; nor[v * 3 + 1] = ny; nor[v * 3 + 2] = nz; uv[v * 2] = u0; uv[v * 2 + 1] = v0; edge[v * 3] = e0; edge[v * 3 + 1] = e1; edge[v * 3 + 2] = e2; };
    const tot = S[N];
    for (let i = 0; i < N; i++) {
      const f = S[i] / tot, ln = (line[0] <= line[1] ? (f >= line[0] && f <= line[1]) : (f >= line[0] || f <= line[1])) ? 1 : 0, top = VN[i][1] > 0.25 ? 1 : 0;
      const p = P[i], q = Q[i];
      put(i, p[0], p[1], h, 0, 0, 1, longY ? p[1] : p[0], longY ? p[0] : p[1], 0, ln, top);
      put(N + i, q[0], q[1], h, 0, 0, 1, longY ? q[1] : q[0], longY ? q[0] : q[1], D[i], ln, top);
      put(2 * N + i, p[0], p[1], -h, 0, 0, -1, longY ? p[1] : p[0], longY ? p[0] : p[1], 0, ln, top);
      put(3 * N + i, q[0], q[1], -h, 0, 0, -1, longY ? q[1] : q[0], longY ? q[0] : q[1], D[i], ln, top);
      // the field inside the inset ring has corners of its own, marked far from any cut: where the inset had to be
      // narrowed (a notch, a thin neck) the line, the chips and the ridge accents must not smear across the face
      put(8 * N + i, q[0], q[1], h, 0, 0, 1, longY ? q[1] : q[0], longY ? q[0] : q[1], 9, 0, 0);
      put(9 * N + i, q[0], q[1], -h, 0, 0, -1, longY ? q[1] : q[0], longY ? q[0] : q[1], 9, 0, 0);
      const j = (i + 1) % N;
      idx.push(i, j, N + j, i, N + j, N + i, 2 * N + i, 3 * N + j, 2 * N + j, 2 * N + i, 3 * N + i, 3 * N + j);
      // wall: its own four corners; a corner sharper than 35 degrees keeps the segment's own normal
      const eP = E[(i + N - 1) % N], e = E[i], eN = E[j], cs = 0.82;
      const n0 = (eP[0] * e[0] + eP[1] * e[1]) > cs ? VN[i] : e, n1 = (eN[0] * e[0] + eN[1] * e[1]) > cs ? VN[j] : e;
      const w = 4 * N + 4 * i, pj = P[j];
      put(w, p[0], p[1], h, n0[0], n0[1], 0, S[i], h, 0, 0, 0); put(w + 1, p[0], p[1], -h, n0[0], n0[1], 0, S[i], -h, 0, 0, 0);
      put(w + 2, pj[0], pj[1], -h, n1[0], n1[1], 0, S[i + 1], -h, 0, 0, 0); put(w + 3, pj[0], pj[1], h, n1[0], n1[1], 0, S[i + 1], h, 0, 0, 0);
      idx.push(w, w + 1, w + 2, w, w + 2, w + 3);
    }
    const tris = THREE.ShapeUtils.triangulateShape(Q.map((q) => new THREE.Vector2(q[0], q[1])), []);
    for (const t of tris) {
      let [a, b, c] = t; const A = Q[a], B = Q[b], Cc = Q[c];
      if ((B[0] - A[0]) * (Cc[1] - A[1]) - (B[1] - A[1]) * (Cc[0] - A[0]) < 0) { const s = b; b = c; c = s; }
      idx.push(8 * N + a, 8 * N + b, 8 * N + c, 9 * N + a, 9 * N + c, 9 * N + b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aEdge', new THREE.BufferAttribute(edge, 3));
    g.setIndex(nv > 65535 ? new THREE.BufferAttribute(new Uint32Array(idx), 1) : new THREE.BufferAttribute(new Uint16Array(idx), 1));
    g.computeBoundingSphere(); g.userData.outline = P;
    return g;
  }

  /** Wire builder: B.sweep(points, r, radial, closed) and B.ball(centre, r) collect into one geometry (B.geo()).
   *  Every vertex carries aR (its wire radius) so the vertex stage can hold 1.5 px; uv.y is the angle round the wire. */
  function wireBuilder() {
    const pos = [], nor = [], uv = [], ar = [], tan = [], idx = [];
    const t = new THREE.Vector3(), n = new THREE.Vector3(), b = new THREE.Vector3(), q = new THREE.Vector3();
    const B = {
      sweep(pts, r, radial = 6, closed = false) {
        const M = pts.length, base = pos.length / 3; let len = 0;
        for (let i = 0; i < M; i++) {
          const pa = pts[closed ? (i + M - 1) % M : Math.max(i - 1, 0)], pb = pts[closed ? (i + 1) % M : Math.min(i + 1, M - 1)];
          t.subVectors(pb, pa).normalize();
          if (i === 0) { n.set(0, 0, 1); if (Math.abs(t.z) > 0.9) n.set(0, 1, 0); }
          n.addScaledVector(t, -n.dot(t)); if (n.lengthSq() < 1e-8) n.set(t.y, -t.x, 0); n.normalize();
          b.crossVectors(t, n);
          if (i > 0) len += pts[i].distanceTo(pts[i - 1]);
          for (let k = 0; k <= radial; k++) {
            const a = (k / radial) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
            q.set(0, 0, 0).addScaledVector(n, c).addScaledVector(b, s);
            pos.push(pts[i].x + q.x * r, pts[i].y + q.y * r, pts[i].z + q.z * r); nor.push(q.x, q.y, q.z); uv.push(len, k / radial); ar.push(r); tan.push(t.x, t.y, t.z);
          }
        }
        const W = radial + 1, segs = closed ? M : M - 1;
        for (let i = 0; i < segs; i++) { const i2 = (i + 1) % M; for (let k = 0; k < radial; k++) { const a = base + i * W + k, c = base + i2 * W + k; idx.push(a, a + 1, c, a + 1, c + 1, c); } }
        return B;
      },
      ball(c, r) {
        const g = new THREE.IcosahedronGeometry(r, 1), p = g.attributes.position, base = pos.length / 3;
        for (let i = 0; i < p.count; i++) { q.fromBufferAttribute(p, i); const l = q.length() || 1; pos.push(c.x + q.x, c.y + q.y, c.z + q.z); nor.push(q.x / l, q.y / l, q.z / l); uv.push(0, 0.3); ar.push(r); tan.push(0, 0, 0); idx.push(base + i); }
        g.dispose(); return B;
      },
      /** flatten everything past `lim` metres along unit direction d (the filed flat on the ring) */
      file(d, lim) {
        for (let i = 0; i < pos.length; i += 3) { const s = pos[i] * d.x + pos[i + 1] * d.y + pos[i + 2] * d.z; if (s > lim) { pos[i] -= d.x * (s - lim); pos[i + 1] -= d.y * (s - lim); pos[i + 2] -= d.z * (s - lim); nor[i] = d.x; nor[i + 1] = d.y; nor[i + 2] = d.z; } }
        return B;
      },
      geo() {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aR', new THREE.Float32BufferAttribute(ar, 1));
        g.setAttribute('aT', new THREE.Float32BufferAttribute(tan, 3));          // the wire's own direction: the highlight runs along it
        g.setIndex(idx); g.computeBoundingSphere(); return g;
      },
    };
    return B;
  }
  /** unit rod along +X from 0 to 1, radius 1: place with setTube(mesh, i, a, b, r) */
  const tubeGeo = () => wireBuilder().sweep([new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0)], 1, 8).geo();
  /** the maker's twisted loop: an eye of radius R (in the XY plane, centre at the origin) of wire r, its two ends
   *  twisted `turns` times down a neck along -Y (neck length = turns * pitch * r; the rod or arm joins at its foot) */
  function loopGeo(R, r, turns = 2, pitch = 5) {
    const pts = [], hr = r * 1.05, L = turns * r * pitch, dl = Math.asin(Math.min(hr / R, 0.9)), nA = Math.max(8, Math.round(turns * 10));
    for (let k = 0; k < nA; k++) { const f = k / nA, a = f * turns * Math.PI * 2; pts.push(new THREE.Vector3(hr * Math.cos(a), -R - L * (1 - f), hr * Math.sin(a))); }
    for (let k = 0; k <= 22; k++) { const th = -Math.PI / 2 + dl + (k / 22) * (Math.PI * 2 - 2 * dl); pts.push(new THREE.Vector3(R * Math.cos(th), R * Math.sin(th), 0)); }
    for (let k = 1; k <= nA; k++) { const f = k / nA, a = Math.PI - f * turns * Math.PI * 2; pts.push(new THREE.Vector3(hr * Math.cos(a), -R - L * f, hr * Math.sin(a))); }
    return wireBuilder().sweep(pts, r, 6).geo();
  }
  /** thread strip: x = 0..1 along, y = -1/+1 the side; place with setThread(mesh, i, a, b, bow) */
  function threadGeo() {
    const p = [], ix = [], n = 8;
    for (let k = 0; k <= n; k++) { p.push(k / n, -1, 0, k / n, 1, 0); if (k < n) { const a = k * 2; ix.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix); return g;
  }
  /** a knot (origin = the knot) that leaves two tails 3 to 5 m long; use with linenMaterial */
  function knotGeo(seed = 1) {
    const r = ctx.core ? ctx.core.makeRng(seed * 977 + 13) : (() => 0.5), B = wireBuilder().ball(new THREE.Vector3(0, 0, 0), 0.42);
    for (let s = 0; s < 2; s++) {
      const az = r() * 6.283, len = 3 + 2 * r(), up = 0.2 + 0.5 * r(), curl = (r() - 0.5) * 1.6, pts = [];
      for (let k = 0; k <= 7; k++) { const f = k / 7, a = az + curl * f; pts.push(new THREE.Vector3(Math.cos(a) * len * 0.75 * f, (up * f - (0.5 + up) * f * f) * len, Math.sin(a) * len * 0.75 * f)); }
      B.sweep(pts, 0.125, 4);
    }
    return B.geo();
  }

  // ---- meshes ------------------------------------------------------------------------------------------------
  const own = (geo) => { const g = new THREE.BufferGeometry(); for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]); g.setIndex(geo.index); g.boundingSphere = geo.boundingSphere; g.userData = geo.userData; return g; };
  /** InstancedMesh of one slab shape, with the per-instance paint attributes (set them with paint()) */
  function pieceMesh(geo, count, cast = true) {
    const g = own(geo);
    const add = (name, n, fill) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(count * n), n); if (fill) for (let i = 0; i < count * n; i++) a.array[i] = fill[i % n]; g.setAttribute(name, a); };
    add('iColA', 3, [1, 1, 1]); add('iColB', 3, [1, 1, 1]); add('iAccA', 3, [1, 1, 1]); add('iAccB', 3, [1, 1, 1]); add('iAccBox', 4, [1, 1, -1, -1]); add('iMisc', 4, [0, 0, 0, 0]); add('iHand', 4, [1, 0.07, 0.05, 13]);
    const m = new THREE.InstancedMesh(g, plyMaterial, count);
    m.frustumCulled = false; if (cast) m.layers.enable(CAST_LAYER);
    return m;
  }
  /** paint instance i: { day, eve, dayAcc, eveAcc (THREE.Color pots), box [x0,y0,x1,y1] object metres where the
   *  accent pot goes, edge [from,to] metres from an upward cut (ridge line, crest; with box), chip 0..1, seed } */
  function paint(mesh, i, p) {
    const A = mesh.geometry.attributes, c3 = (a, c) => { if (c) a.setXYZ(i, c.r, c.g, c.b); };
    c3(A.iColA, p.day); c3(A.iColB, p.eve || p.day); c3(A.iAccA, p.dayAcc || p.day); c3(A.iAccB, p.eveAcc || p.eve || p.day);
    const b = p.box || [1, 1, -1, -1], e = p.edge || [0, 0];
    A.iAccBox.setXYZW(i, b[0], b[1], b[2], b[3]); A.iMisc.setXYZW(i, e[0], e[1], p.chip ?? 0, Math.round((p.seed ?? 0) * 64) / 64);
    // the hand, per piece: air (how much of the room's paling it takes), lineW (half-width of the pencil line, m), lap
    // (strength of the lap bands) and lapW (their width, m)
    A.iHand.setXYZW(i, p.air ?? 1, p.lineW ?? 0.07, p.lap ?? 0.05, p.lapW ?? 13);
    for (const k of ['iColA', 'iColB', 'iAccA', 'iAccB', 'iAccBox', 'iMisc', 'iHand']) A[k].needsUpdate = true;
  }
  /** InstancedMesh of a wire geometry (tube, loop, ring, knot); material = wireMaterial or linenMaterial */
  function wireMesh(geo, count, material = wireMaterial, cast = false) {
    const m = new THREE.InstancedMesh(geo, material, count); m.frustumCulled = false; if (cast) m.layers.enable(CAST_LAYER); return m;
  }
  /** InstancedMesh of threads (each needs iBow, the sideways bow of its middle in world metres) */
  function threadMesh(count) {
    const g = threadGeo(); g.setAttribute('iBow', new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3));
    const m = new THREE.InstancedMesh(g, threadMaterial, count); m.frustumCulled = false; m.renderOrder = 2; return m;
  }
  const _m = new THREE.Matrix4(), _d = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _e = _m.elements;
  /** rod from a to b (Vector3, the mesh's local space) of radius r */
  function setTube(mesh, i, a, b, r) {
    _d.subVectors(b, a); const l = _d.length() || 1e-6;
    _y.set(0, 1, 0); if (Math.abs(_d.y) > 0.99 * l) _y.set(1, 0, 0);
    _z.crossVectors(_d, _y).normalize(); _y.crossVectors(_z, _d).normalize();
    _e[0] = _d.x; _e[1] = _d.y; _e[2] = _d.z; _e[3] = 0; _e[4] = _y.x * r; _e[5] = _y.y * r; _e[6] = _y.z * r; _e[7] = 0;
    _e[8] = _z.x * r; _e[9] = _z.y * r; _e[10] = _z.z * r; _e[11] = 0; _e[12] = a.x; _e[13] = a.y; _e[14] = a.z; _e[15] = 1;
    mesh.setMatrixAt(i, _m); mesh.instanceMatrix.needsUpdate = true;
  }
  /** thread from a to b; bow (optional Vector3) pushes its middle sideways */
  function setThread(mesh, i, a, b, bow) {
    _e[0] = b.x - a.x; _e[1] = b.y - a.y; _e[2] = b.z - a.z; _e[3] = 0; _e[4] = 0; _e[5] = 1; _e[6] = 0; _e[7] = 0;
    _e[8] = 0; _e[9] = 0; _e[10] = 1; _e[11] = 0; _e[12] = a.x; _e[13] = a.y; _e[14] = a.z; _e[15] = 1;
    mesh.setMatrixAt(i, _m); mesh.instanceMatrix.needsUpdate = true;
    const B = mesh.geometry.attributes.iBow; if (bow) B.setXYZ(i, bow.x, bow.y, bow.z); else B.setXYZ(i, 0, 0, 0); B.needsUpdate = true;
  }
  const _size = new THREE.Vector2();
  return {
    /** the shared GLSL (uniform declarations, mobLit(wp, n, soft, fragCoord), mobValue, mobAir) for a material of your own,
     *  e.g. the far wall: new ShaderMaterial({ uniforms: { ...style.U }, fragmentShader: style.GLSL + ... mobLit(p, n, 4., gl_FragCoord.xy) }) */
    GLSL: GLSL_COMMON,
    pal, U, plyMaterial, wireMaterial, farWireMaterial, beamMaterial, linenMaterial, shadeWire, threadMaterial, roomMaterial, shadow, PLY,
    eveAt, tiltAt, setProgress, get progress() { return progress; },
    /** one of the maker's thirteen silhouettes: see styleShape below */
    shape: (kind, k, size) => styleShape(pal, kind, k, size),
    slab, wireBuilder, tubeGeo, loopGeo, threadGeo, knotGeo, pieceMesh, paint, wireMesh, threadMesh, setTube, setThread,
    /** every frame, before drawing */
    update(dt, time, camera) {
      U.uTime.value = time;
      if (ctx.renderer && ctx.renderer.getDrawingBufferSize) U.uViewH.value = Math.max(64, ctx.renderer.getDrawingBufferSize(_size).y);
    },
    dispose() { target.dispose(); depthMaterial.dispose(); proxy.geometry.dispose(); },
  };
}

// ---- outlines of the two great pieces (metres, counter-clockwise, hanging point at x = 0) -------------------------
/** the sun: a 90 m disc with a wavy fretted rim of 24 scallops, each cut a little differently */
function sunOutline(rng) {
  const pts = [], per = 12, depth = rng.range(3.0, 4.2), ph = rng.range(0, 1), amp = [];
  for (let k = 0; k < 24; k++) amp.push(rng.range(0.82, 1.12));
  for (let k = 0; k < 24; k++) for (let j = 0; j < per; j++) {
    const f = (j + 0.5) / per, th = ((k + f + ph) / 24) * Math.PI * 2;
    const lobe = Math.pow(Math.sin(f * Math.PI), 0.62);                       // round scallop, sharp notch between
    const r = 45 - depth * amp[k] * (1 - lobe) - (amp[k] - 1) * 1.2;
    pts.push([Math.cos(th) * r, Math.sin(th) * r]);
  }
  return pts;
}
/** the moon: a 60 m crescent, horns to +X, tilted on its thread; returns the outline with its centre of area on x = 0 */
function moonOutline(rng, R = 30) {
  const R0 = R / 30;
  const phi = rng.range(56, 66) * DEG, c = rng.range(14, 19) * R0, tilt = rng.range(-0.5, -0.2), pts = [];
  const tx = R * Math.cos(phi), ty = R * Math.sin(phi), Ri = Math.hypot(tx - c, ty), ai = Math.atan2(ty, tx - c);
  const nO = 44, nI = 30;
  for (let k = 0; k <= nO; k++) { const a = phi + (k / nO) * (Math.PI * 2 - 2 * phi); pts.push([R * Math.cos(a), R * Math.sin(a)]); }
  for (let k = 1; k < nI; k++) { const a = (Math.PI * 2 - ai) - (k / nI) * (Math.PI * 2 - 2 * ai); pts.push([c + Ri * Math.cos(a), Ri * Math.sin(a)]); }
  let A = 0, cx = 0, cy = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length], w = p[0] * q[1] - q[0] * p[1]; A += w; cx += (p[0] + q[0]) * w; cy += (p[1] + q[1]) * w; }
  cx /= 3 * A; cy /= 3 * A;
  const cs = Math.cos(tilt), sn = Math.sin(tilt);
  return pts.map((p) => { const x = p[0] - cx, y = p[1] - cy; return [x * cs - y * sn, x * sn + y * cs]; });
}
/** highest and lowest point of an outline on the plumb line x = 0 (where a thread ties on) */
function plumbEnds(outline) {
  let top = -1e9, bot = 1e9;
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    if ((a[0] <= 0) !== (b[0] <= 0)) { const y = a[1] + (b[1] - a[1]) * (-a[0] / (b[0] - a[0])); if (y > top) top = y; if (y < bot) bot = y; }
  }
  return { top, bot };
}

// ---- the hero ---------------------------------------------------------------------------------------------------
// WHAT: the 600 m brass beam (rod 1.6 m, a curl at the balance point 40 % along, a twisted loop at each end, one of
//   them twisted a turn too many), the 90 m scalloped sun (orange day face, red evening face, five-ply edge) on 25 m
//   of thread under the short arm, the 60 m cream crescent under the long arm, the knots with their tails, the
//   thread up through the 16 m brass ring (filed flat) to the hook in the ceiling's shadow.
// SIZE: radius ~330 about center (0,400,0); spans y ~210..660. ground: false (nothing stands on anything).
// COST: ~8.2k triangles, 9 draw calls (+1 with the stage dome), no lights, no canvas textures, build ~80 ms;
//   the style's depth pass draws the 7 casters again into one 2048 x 1593 half-float target (one program).
// OPTS: palette (7 hex, brief order), stage (a stand-in room dome; default on only without opts.style),
//   hookY (height of the hook, default the brief's 640; the world brings it down into the last frames), ringR, ringW,
//   style (a shared makeStyle() result; then the WORLD drives style.update,
//   style.shadow.focus/compile/render), detail (0.6..1: only the radial fineness of rim and wire), sunTurn [u0,u1]
//   (the sun's half-turn window, default [0.36, 0.64]).
// LIVE: hero.setProgress(u); hero.setSunYaw(rad | null) to drive the half-turn yourself; hero.state { u, tilt,
//   sunPos, moonPos, sunYaw, moonYaw, sunBottom, moonBottom, sunEnd, moonEnd } (hero-local, rewritten every update:
//   hang the first arm of each tree from sunBottom / moonBottom); pure functions of u for laying the path:
//   hero.beamPoint(s, u, out) (s metres from the balance point, -240 sun end .. +360 moon end, rod centre line),
//   hero.sunCentre(u, out), hero.moonCentre(u, out), hero.sunYawAt(u).
// ANCHORS (hero-local): portalSeat { position (ring centre), normal (faces the arriving camera), radius 7 },
//   ringAxis (direction of the last straight: along the beam, climbing 10 degrees), flyThrough (ordered points of the
//   brief's line: entry, into the sun's tree, the sun pass 56 m east of its plumb line, the beam run 6 m beside and
//   9 m over the rod, the 62 m straight, the ring, beyond; >= 6 m clear of everything in this module at the u it is
//   passed), viewpoints { entry, sunFace, aboveBeam, reveal }, hook, pivot, sunPlumb, moonPlumb.
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = clamp(opts.detail ?? 1, 0.6, 1);
  const ownStyle = !opts.style, style = opts.style || makeStyle(ctx, { palette: opts.palette });
  const pal = style.pal, V = (x, y, z) => new THREE.Vector3(x, y, z);
  const object = new THREE.Group(); object.name = 'beam-sun-moon';
  await ctx.yield();

  // seeded choices (all draws up front, in a fixed order)
  const sunPts = sunOutline(rng), moonPts = moonOutline(rng, opts.moonR || 30);
  const sunSeed = rng.range(1, 40), moonSeed = rng.range(1, 40), lineAt = rng.range(0, 1);
  const twistSun = rng.chance(0.5), flatAng = rng.range(-2.5, -0.7), knotSeed = rng.int(1, 999);
  const ph = [0, 0, 0, 0, 0, 0].map(() => rng.range(0, Math.PI * 2)), knotYaw = [0, 0, 0, 0, 0, 0, 0, 0].map(() => rng.range(0, Math.PI * 2));
  const moonFace = rng.range(-0.5, 0.5), sunTurn = opts.sunTurn || [0.36, 0.64];

  // the two pieces
  const sunGeo = style.slab(sunPts, { seed: sunSeed, long: 'x', line: [0.02 + 0.03 * lineAt, 0.31 + 0.03 * lineAt] });      // the upper quarter both faces show the lens
  await ctx.yield();
  const moonGeo = style.slab(moonPts, { seed: moonSeed, long: 'y', line: [0.1, 0.42] });
  const sunEnds = plumbEnds(sunGeo.userData.outline), moonEnds = plumbEnds(moonGeo.userData.outline);
  const sun = style.pieceMesh(sunGeo, 1), moon = style.pieceMesh(moonGeo, 1);
  // the two great pieces: seen from furthest off, so they take about half the air's paling; a broad pencil line and
  // four lap bands that read from the 75 m of the sun pass
  const sunHand = { air: 0.55, lineW: 0.2, lap: 0.13, lapW: 24, eveAcc: pal.moon, box: [2000, 8.5, -1, 33] };   // the evening face carries the spiral
  style.paint(sun, 0, { day: pal.sun, eve: pal.boat, chip: 0.3, seed: sunSeed, ...sunHand });
  style.paint(moon, 0, { day: pal.moon, eve: pal.moon, chip: 0, seed: moonSeed, air: 0.6, lineW: 0.16, lap: 0.07, lapW: 16 });
  object.add(sun, moon);
  await ctx.yield();

  // brass: rod, loops, ring + hook
  const ROD = 0.8, EYE = 2.2, PITCH = 3, RING_R = opts.ringR || 7.5, RING_W = opts.ringW || 0.5, HOOK_Y = opts.hookY || 640;
  const neckSun = (twistSun ? 3 : 2) * ROD * PITCH, neckMoon = (twistSun ? 2 : 3) * ROD * PITCH, DROP = EYE + ROD * PITCH;
  const rod = style.wireMesh(style.tubeGeo(), 1, style.beamMaterial, true);
  const loopSun = style.wireMesh(style.loopGeo(EYE, ROD, twistSun ? 3 : 2, PITCH), 1, style.wireMaterial, true);
  const loopMoon = style.wireMesh(style.loopGeo(EYE, ROD, twistSun ? 2 : 3, PITCH), 1, style.wireMaterial, true);
  const curl = style.wireMesh(style.loopGeo(EYE, ROD, 1, PITCH), 1, style.wireMaterial, true);
  const pivot = V(0, LOOP_Y, 0), ringC = V(0, LOOP_Y + 12.5 + RING_R, 0);    // the thread from the balance loop to the ring is 12 m
  // opts.ringYaw turns the ring (and the last straight) about the thread, so the moon rises beside the ring, not behind it
  const axis = V(BEAM_AXIS.x * Math.cos(10 * DEG), Math.sin(10 * DEG), BEAM_AXIS.z * Math.cos(10 * DEG)).normalize().applyAxisAngle(V(0, 1, 0), opts.ringYaw || 0);
  const e1 = V(0, 1, 0).cross(axis).normalize(), e2 = axis.clone().cross(e1).normalize();
  const ringPts = [], nRing = Math.round(56 * detail);
  for (let k = 0; k < nRing; k++) { const a = (k / nRing) * Math.PI * 2; ringPts.push(ringC.clone().addScaledVector(e1, RING_R * Math.cos(a)).addScaledVector(e2, RING_R * Math.sin(a))); }
  const fdir = e1.clone().multiplyScalar(Math.cos(flatAng)).addScaledVector(e2, Math.sin(flatAng));
  // the hook, HK times the maker's 6 m screw hook so that it reads from the last straight; its stem runs up into the ceiling
  const hookPts = [], HK = opts.hookSize || 1, CEIL_Y = HOOK_Y + 6 * HK + 20;
  for (let k = 0; k <= 4; k++) hookPts.push(V(-3.2 * HK, CEIL_Y - k * 5, 0));
  for (let k = 0; k <= 16; k++) { const a = (k / 16) * Math.PI * 1.42; hookPts.push(V(-3.2 * HK * Math.cos(a), HOOK_Y + 6 * HK - 3.2 * HK * Math.sin(a), 0)); }
  const fixedGeo = style.wireBuilder().sweep(ringPts, RING_W, Math.round(10 * detail), true).file(fdir, ringC.dot(fdir) + RING_R + RING_W * 0.25).geo();
  const fixed = style.wireMesh(fixedGeo, 1, style.wireMaterial, true);
  fixed.setMatrixAt(0, new THREE.Matrix4());
  const hook = style.wireMesh(style.wireBuilder().sweep(hookPts, 0.9 * HK, 6).geo(), 1, style.shadeWire(HOOK_Y - 12, HOOK_Y + 2), true);
  hook.setMatrixAt(0, new THREE.Matrix4());
  object.add(hook);
  object.add(rod, loopSun, loopMoon, curl, fixed);
  await ctx.yield();

  // linen: four threads, eight knots
  const ringBot = ringC.clone().addScaledVector(e2, -RING_R), ringTop = ringC.clone().addScaledVector(e2, RING_R);
  const hookSeat = V(0, HOOK_Y + 3.7 * HK, 0), curlTop = V(0, LOOP_Y + EYE, 0);
  const threads = style.threadMesh(4), knots = style.wireMesh(style.knotGeo(knotSeed), 8, style.linenMaterial, false);
  style.setThread(threads, 2, curlTop, ringBot); style.setThread(threads, 3, ringTop, hookSeat);
  object.add(threads, knots);
  if (ownStyle) style.shadow.compile(ctx.renderer);
  await ctx.yield();

  // ---- the balance, in closed form ---------------------------------------------------------------------------
  const aT = V(0, 0, 0), upT = V(0, 0, 0), side = V(0, 1, 0).cross(BEAM_AXIS).normalize(), Y = V(0, 1, 0);
  const frame = (tilt) => { const c = Math.cos(tilt), s = Math.sin(tilt); aT.copy(BEAM_AXIS).multiplyScalar(c).addScaledVector(Y, -s); upT.copy(Y).multiplyScalar(c).addScaledVector(BEAM_AXIS, s); };
  const rodAt = (s, out) => out.copy(pivot).addScaledVector(upT, -DROP).addScaledVector(aT, s);
  const sunYawAt = (u) => Math.PI - 0.15 + Math.PI * smoothstep(sunTurn[0], sunTurn[1], u);
  const beamPoint = (s, u, out = V(0, 0, 0)) => { frame(style.tiltAt(u)); return rodAt(s, out); };
  const sunCentre = (u, out = V(0, 0, 0)) => { beamPoint(-SUN_ARM, u, out); out.y -= 70; return out; };
  const moonCentre = (u, out = V(0, 0, 0)) => { beamPoint(MOON_ARM, u, out); out.y -= 55; return out; };
  const state = { u: 0, tilt: 0, sunPos: V(0, 0, 0), moonPos: V(0, 0, 0), sunYaw: 0, moonYaw: 0, sunBottom: V(0, 0, 0), moonBottom: V(0, 0, 0), sunEnd: V(0, 0, 0), moonEnd: V(0, 0, 0) };
  let progress = -1, sunYawOver = null, moonYawOver = null;
  const m4 = new THREE.Matrix4(), bx = V(0, 0, 0), by = V(0, 0, 0), bz = V(0, 0, 0), p0 = V(0, 0, 0), p1 = V(0, 0, 0), bow = V(0, 0, 0), root = { scene: null };
  const basisAt = (mesh, x, y, pos) => { bz.crossVectors(x, y); m4.makeBasis(x, y, bz).setPosition(pos); mesh.setMatrixAt(0, m4); mesh.instanceMatrix.needsUpdate = true; };
  const yawAt = (mesh, i, yaw, pos) => { m4.makeRotationY(yaw).setPosition(pos); mesh.setMatrixAt(i, m4); mesh.instanceMatrix.needsUpdate = true; };
  function pose(time) {
    const u = progress >= 0 ? progress : 1 - Math.abs(((time / 30) % 2) - 1);
    if (ownStyle || progress < 0) style.setProgress(u);
    // the beam tips once, all flight long; it also breathes a third of a degree so it is never still
    const tilt = style.tiltAt(u) + (0.34 * Math.sin(time * 0.71 + ph[0]) + 0.13 * Math.sin(time * 1.63 + ph[1])) * DEG;
    frame(tilt);
    rodAt(-SUN_ARM, state.sunEnd); rodAt(MOON_ARM, state.moonEnd);
    rodAt(-SUN_ARM + EYE + neckSun, p0); rodAt(MOON_ARM - EYE - neckMoon, p1); style.setTube(rod, 0, p0, p1, ROD);
    by.copy(aT).multiplyScalar(-1); basisAt(loopSun, upT, by, state.sunEnd);
    bx.copy(upT).multiplyScalar(-1); basisAt(loopMoon, bx, aT, state.moonEnd);
    basisAt(curl, aT, upT, pivot);
    // loads stay plumb: they rise and sink, and turn on their threads
    const sy = sunYawOver !== null ? sunYawOver : sunYawAt(u) + 0.07 * Math.sin(time * 0.37 + ph[2]) + 0.03 * Math.sin(time * 1.1 + ph[3]);
    const my = moonYawOver !== null ? moonYawOver : Math.PI + moonFace + 0.3 * Math.sin(time * 0.29 + ph[4]) + 0.08 * Math.sin(time * 0.83 + ph[5]) - 0.5 * style.eveAt(u);
    state.u = u; state.tilt = tilt; state.sunYaw = sy; state.moonYaw = my;
    state.sunPos.copy(state.sunEnd); state.sunPos.y -= 70; state.moonPos.copy(state.moonEnd); state.moonPos.y -= 55;
    state.sunBottom.copy(state.sunPos); state.sunBottom.y += sunEnds.bot; state.moonBottom.copy(state.moonPos); state.moonBottom.y += moonEnds.bot;
    yawAt(sun, 0, sy, state.sunPos); yawAt(moon, 0, my, state.moonPos);
    // threads bow a little as the loads turn; knots ride with what they are tied to
    p0.copy(state.sunEnd); p0.y -= EYE; p1.copy(state.sunPos); p1.y += sunEnds.top - 0.4;
    bow.copy(side).multiplyScalar(0.5 * Math.sin(time * 0.71 + ph[0] + 0.6)); style.setThread(threads, 0, p0, p1, bow);
    yawAt(knots, 0, knotYaw[0] + sy * 0.5, p0); yawAt(knots, 1, sy + knotYaw[1], p1);
    p0.copy(state.moonEnd); p0.y -= EYE; p1.copy(state.moonPos); p1.y += moonEnds.top - 0.4;
    bow.copy(side).multiplyScalar(-0.6 * Math.sin(time * 0.71 + ph[0] + 0.9)); style.setThread(threads, 1, p0, p1, bow);
    yawAt(knots, 2, knotYaw[2] + my * 0.5, p0); yawAt(knots, 3, my + knotYaw[3], p1);
  }
  // what holds everything does not move at all
  yawAt(knots, 4, knotYaw[4], curlTop); yawAt(knots, 5, knotYaw[5], ringBot); yawAt(knots, 6, knotYaw[6], ringTop); yawAt(knots, 7, knotYaw[7], hookSeat);
  pose(0);

  // ---- anchors (hero-local; see header) ------------------------------------------------------------------------
  const right = V(0.866, 0, -0.5), lastStart = ringC.clone().addScaledVector(axis, -62);
  const run = (s, u) => beamPoint(s, u).addScaledVector(right, 6).add(V(0, 9 + DROP, 0));
  const sunPass = sunCentre(0.58).add(V(56, 2, 0));
  const anchors = {
    portalSeat: { position: ringC.clone(), normal: axis.clone().multiplyScalar(-1), radius: RING_R - RING_W },
    ringAxis: axis.clone(), pivot: pivot.clone(), hook: hookSeat.clone(), ceilingY: CEIL_Y, ringR: RING_R,
    sunPlumb: V(-BEAM_AXIS.x * SUN_ARM, 0, -BEAM_AXIS.z * SUN_ARM), moonPlumb: V(BEAM_AXIS.x * MOON_ARM, 0, BEAM_AXIS.z * MOON_ARM),
    flyThrough: [V(-40, 262, -728), V(-46, 264, -600), V(-56, 280, -400), V(-62, 300, -290), sunPass, run(-205, 0.7), run(-150, 0.76), run(-100, 0.82), lastStart, ringC.clone(), ringC.clone().addScaledVector(axis, 30)],
    viewpoints: { entry: V(-40, 262, -728), sunFace: sunCentre(0.52).add(V(56, -6, -70)), aboveBeam: run(-150, 0.76), reveal: lastStart.clone() },
  };
  // a stand-in room for judging the piece alone (opts.stage, default: only when the hero made its own style)
  let dome = null;
  if (opts.stage ?? ownStyle) {
    dome = new THREE.Mesh(new THREE.SphereGeometry(2600, 24, 12), style.roomMaterial);
    dome.renderOrder = -0.5; dome.frustumCulled = false; object.add(dome);
  }
  let rootScene = null;
  return {
    object, radius: 170, height: 300, center: V(0, 370, 0), anchors, style, state, ground: false, groundY: 0,
    pieces: { sun, moon, sunSeed, moonSeed, sunEnds, moonEnds, sunHand },
    setProgress(u) { progress = clamp(u, 0, 1); }, setSunYaw(a) { sunYawOver = a; }, setMoonYaw(a) { moonYawOver = a; },
    beamPoint, sunCentre, moonCentre, sunYawAt,
    update(dt, time, camera) {
      pose(time);
      if (dome && camera) { dome.position.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(dome.position); }
      if (!ownStyle) return;
      style.update(dt, time, camera);
      if (!rootScene) { let r = object; while (r.parent) r = r.parent; if (r.isScene) rootScene = r; }
      if (rootScene) { object.updateMatrixWorld(true); style.shadow.focus(p0.set(0, 330, 0).applyMatrix4(object.matrixWorld)); style.shadow.render(ctx.renderer, rootScene); }
    },
    dispose() { if (ownStyle) style.dispose(); },
  };
}

// ---- the maker's thirteen silhouettes (style.shape(kind, k)) ---------------------------------------------------------
// Each returns { outline (ccw, metres, plumb line through x = 0, y = 0 at the middle of its height), top, bot (where
// threads tie on), slab (options for style.slab), paint (for style.paint: the two faces from the same pots) }.
// kinds: 'cloud' k 0..3 (size = width, 60 or 35), 'swallow' k 0..1 (30 m span), 'hill' k 0..2 (40 x 14),
// 'wave' k 0..1 (34 x 7, scallops 12 m apart), 'boat' k 0..1 (18 m). Deterministic in (kind, k): no rng is drawn.
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
/** closed Catmull-Rom through pts; a point given as [x, y, 1] stays a sharp corner */
function spline(pts, per = 4) {
  const src = []; for (const p of pts) { if (p[2]) src.push(p, p, p); else src.push(p); }
  const n = src.length, out = [];
  for (let i = 0; i < n; i++) {
    const p0 = src[(i + n - 1) % n], p1 = src[i], p2 = src[(i + 1) % n], p3 = src[(i + 2) % n];
    if (p1 === p2) continue;
    for (let j = 0; j < per; j++) {
      const t = j / per, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  return out;
}
/** shift an outline so its centre of area is on x = 0 and its bounding height is centred on y = 0 */
function hangOutline(pts) {
  let A = 0, cx = 0, lo = 1e9, hi = -1e9;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length], w = p[0] * q[1] - q[0] * p[1]; A += w; cx += (p[0] + q[0]) * w; lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); }
  cx /= 3 * A; const cy = (lo + hi) / 2, out = pts.map((p) => [p[0] - cx, p[1] - cy]), e = plumbEnds(out);
  return { outline: out, top: e.top, bot: e.bot, dx: cx, dy: cy };
}
function cloudOutline(k, w) {
  const n = [4, 3, 5, 4][k % 4], s = w / 60, C = [];
  for (let i = 0; i < n; i++) {
    const f = n === 1 ? 0.5 : i / (n - 1), mid = 1 - Math.abs(f - 0.5 - (hash1(k * 7 + 1) - 0.5) * 0.3) * 1.5;
    const r = (7.5 + 6.5 * mid + 3 * (hash1(k * 13 + i * 3.1) - 0.5)) * s * (5 / (n + 1.2));
    C.push({ x: (f - 0.5) * (w - 2 * 8 * s) * 1.0, y: r * (0.42 + 0.5 * mid * hash1(k * 5 + i)), r });
  }
  const half = w / 2; C[0].x = -half + C[0].r; C[n - 1].x = half - C[n - 1].r;
  const top = [];
  for (let i = 0; i < n; i++) for (let a = 205; a >= -25; a -= 7) {
    const c = C[i], x = c.x + c.r * Math.cos(a * DEG), y = c.y + c.r * Math.sin(a * DEG);
    if (y < 0) continue;
    let inside = false; for (let j = 0; j < n; j++) if (j !== i) { const d = C[j]; if ((x - d.x) * (x - d.x) + (y - d.y) * (y - d.y) < d.r * d.r * 0.998) inside = true; }
    if (!inside) top.push([x, y]);
  }
  const L = top[0][0], R = top[top.length - 1][0], out = [[L, 0], [L * 0.5 + R * 0.5, 0], [R, 0]];
  for (let i = top.length - 1; i >= 0; i--) if (top[i][1] > 0.6) out.push(top[i]);
  return out;
}
function swallowOutline(k) {
  const sw = k % 2 ? 1.25 : 1, lo = k % 2 ? 0.82 : 1;                    // k 1: wings swept harder, lower wing shorter (banking)
  const half = [[8.6, 0, 1], [7.5, 0.95], [6.2, 1.35], [5.0, 1.5], [4.2, 2.1], [3.5, 5.0], [2.0 - sw, 8.6], [-0.4 * sw - 0.4, 11.9], [-3.2 * sw, 14.2], [-6.2 * sw, 15.0, 1],
    [-4.3 * sw, 12.5], [-2.7 * sw, 9.7], [-1.9, 6.9], [-2.0, 4.5], [-2.7, 2.6], [-4.6, 1.6], [-6.2, 1.5], [-8.6, 2.5], [-12.0, 4.3, 1], [-9.3, 2.0], [-7.5, 0.7]];
  const pts = half.map((p) => p.slice());
  pts.push([-6.7, 0, 1]);
  for (let i = half.length - 1; i >= 1; i--) { const p = half[i]; pts.push([p[0], -p[1] * (p[1] > 3 ? lo : 1), p[2]]); }
  return spline(pts, 3);
}
function hillOutline(k) {
  const humps = [[[-9, 9.5, 8], [7, 6.5, 7]], [[-12, 6, 6], [0, 10, 7], [12, 5.5, 6]], [[-6, 7, 9], [10, 10.5, 7]]][k % 3];
  const tx = [3.5, -18, -1][k % 3], top = [];                             // where the fretted tree line is cut
  const yAt = (x) => { let y = 2.6; for (const h of humps) { const d = (x - h[0]) / h[2]; y += h[1] * Math.exp(-d * d); } return Math.min(y, 13.4); };
  for (let x = 20; x >= -20; x -= 1) {
    if (x <= tx + 8 && x > tx) {                                           // four saw teeth, 2 m each: a row of firs
      const f = (tx + 8 - x) / 2, base = yAt(x) - 0.9;
      if (f % 1 === 0) { top.push([x, base, 1]); top.push([x - 0.35, base + 2.3, 1]); }
      continue;
    }
    top.push([x, yAt(x), (x === 20 || x === -20) ? 1 : 0]);
  }
  return spline([[-20, 0, 1], [0, 0, 1], [20, 0, 1], ...top], 2);
}
function waveOutline(k) {
  const ph = k % 2 ? 4.5 : 0, top = [];
  for (let x = 17; x >= -17; x -= 0.75) {
    const s = Math.abs(Math.sin(Math.PI * (x - ph) / 12)), y = 6.9 - 3.1 * Math.pow(s, 0.8);
    top.push([x - 0.9 * (1 - s) * (1 - s), y]);                           // crests lean a little the way the sea runs
  }
  return [[-17, 0], [-6, 0], [6, 0], [17, 0], ...top];
}
function boatOutline(k) {
  const lug = k % 2 === 1;
  const hull = [[-9.3, 3.1, 1], [-8.3, 1.3], [-6, 0.25], [0, 0], [5.5, 0.3], [8, 1.5], [9.7, 3.3, 1], [7.2, 2.8], [5.2, 2.7, 1]];
  const sail = lug
    ? [[5.6, 6.5], [4.6, 11.2, 1], [-3.4, 13.6, 1], [-4.1, 8], [-4.4, 2.7, 1]]
    : [[4.4, 6.2], [2.2, 10.2], [-1.6, 14.2, 1], [-2.6, 8.5], [-3.6, 2.7, 1]];
  return spline([...hull, ...sail, [-7, 2.8]], 3);
}
// the alternative cast (seeded by the world): geese for swallows, fish for boats, rooftops for hills
function gooseOutline() {
  const half = [[13, 0, 1], [11.6, 0.55], [9, 0.6], [5.4, 0.9], [3.6, 1.9], [3.1, 5.2], [1.6, 9.6], [-0.9, 13], [-4, 15, 1],
    [-3.4, 11], [-3, 7], [-3.6, 3.6], [-5.6, 2.1], [-8, 1.7], [-10.2, 1.3, 1]];
  const pts = half.map((p) => p.slice());
  pts.push([-9.4, 0]);
  for (let i = half.length - 1; i >= 1; i--) { const p = half[i]; pts.push([p[0], -p[1], p[2]]); }
  return spline(pts, 3);
}
function fishOutline() {
  return spline([[9, 0], [7, 2.2], [3, 3.6], [-1, 3.4], [-4.5, 1.7], [-6.4, 1.2], [-9, 4.3, 1], [-8, 0], [-9, -4.3, 1], [-6.4, -1.2], [-4.5, -1.7], [-1, -3.2], [3, -3.4], [7, -2]], 3);
}
function roofOutline() {
  return spline([[-20, 0, 1], [0, 0, 1], [20, 0, 1], [20, 4.5, 1], [17, 4.5, 1], [13.5, 9, 1], [10, 4.5, 1], [8, 4.5, 1], [3, 12.5, 1], [-2, 6, 1], [-4, 6, 1],
    [-8.5, 10.5, 1], [-13, 6, 1], [-15, 6, 1], [-15, 8.4, 1], [-17, 8.4, 1], [-17, 5, 1], [-20, 5, 1]], 2);
}
function styleShape(pal, kind, k = 0, size) {
  const ALL = [-1e4, -1e4, 1e4, 1e4];
  // every kind but the cloud takes `size` as a scale (1 = the maker's usual size): the far tiers are cut larger
  const z = kind === 'cloud' ? 1 : (size || 1), big = (pts) => z === 1 ? pts : pts.map((q) => [q[0] * z, q[1] * z, q[2]]);
  if (kind === 'goose') {
    const h = hangOutline(big(gooseOutline()));
    return { ...h, slab: { long: 'y', seed: 61, line: [0.02, 0.2], inset: 1.2 }, paint: { day: pal.cloud, eve: pal.night, dayAcc: pal.sun, eveAcc: pal.sun, box: [10.4 * z - h.dx, -1.5 * z - h.dy, 14 * z - h.dx, 1.5 * z - h.dy], seed: 23 } };
  }
  if (kind === 'fish') {
    const h = hangOutline(big(fishOutline()));
    return { ...h, slab: { long: 'x', seed: 63, line: [0.05, 0.3], inset: 1.0 }, paint: { day: pal.boat, eve: pal.night, dayAcc: pal.moon, eveAcc: pal.sun, box: [5.6 * z - h.dx, 0.6 * z - h.dy, 7.2 * z - h.dx, 2.0 * z - h.dy], seed: 29 } };
  }
  if (kind === 'roof') {
    const h = hangOutline(big(roofOutline()));
    return { ...h, slab: { long: 'x', seed: 67, line: [0.02, 0.3], inset: 1.6, wobble: 0.25 }, paint: { day: pal.boat, eve: pal.night, dayAcc: pal.boat, eveAcc: pal.moon, box: ALL, edge: [0.9 * z, 1.7 * z], seed: 31 } };
  }
  // two pieces cut for one picture (a bird and its shadow on a cloud): the same cloud cut tall (a cumulus: its lobes
  // stand 1.7 times as high over the same flat bottom), and the same swallow hung by its beak, climbing its thread
  if (kind === 'cumulus') {
    const w = size || 60, h = hangOutline(cloudOutline(k, w).map((q) => [q[0], q[1] * 1.7])), b = -h.dy;
    return { ...h, slab: { long: 'x', seed: 15 + k, line: [0.55, 0.9] }, paint: { day: pal.cloud, eve: pal.moon, dayAcc: pal.cloud, eveAcc: pal.sun, box: [-1e4, b + w * 0.045, 1e4, b + w * 0.125], chip: 0, seed: 5 + k } };
  }
  if (kind === 'climber') {
    const h = hangOutline(big(swallowOutline(k)).map((q) => [-q[1], q[0]]));
    return { ...h, slab: { long: 'x', seed: 25 + k, line: [0.02, 0.2], inset: 1.2 }, paint: { day: pal.bird, eve: pal.night, dayAcc: pal.moon, eveAcc: pal.moon, box: [-1.7 * z - h.dx, 4.3 * z - h.dy, 1.7 * z - h.dx, 7.1 * z - h.dy], seed: 9 + k } };
  }
  if (kind === 'cloud') {
    const w = size || 60, h = hangOutline(cloudOutline(k, w)), b = -h.dy;
    return { ...h, slab: { long: 'x', seed: 11 + k, line: [0.55, 0.9] }, paint: { day: pal.cloud, eve: pal.moon, dayAcc: pal.cloud, eveAcc: pal.sun, box: [-1e4, b + w * 0.035, 1e4, b + w * 0.1], chip: k === 3 ? 1 : 0, seed: 3 + k } };
  }
  if (kind === 'swallow') {
    const h = hangOutline(big(swallowOutline(k)));
    return { ...h, slab: { long: 'y', seed: 21 + k, line: [0.02, 0.2], inset: 1.2 }, paint: { day: pal.bird, eve: pal.night, dayAcc: pal.moon, eveAcc: pal.moon, box: [4.3 * z - h.dx, -1.7 * z - h.dy, 7.1 * z - h.dx, 1.7 * z - h.dy], seed: 7 + k } };
  }
  if (kind === 'hill') {
    const h = hangOutline(big(hillOutline(k)));
    return { ...h, slab: { long: 'x', seed: 31 + k, line: [0.02, 0.3], inset: 2.4 }, paint: { day: pal.hill, eve: pal.night, dayAcc: pal.hill, eveAcc: pal.moon, box: ALL, edge: [1.1 * z, 2.0 * z], seed: 13 + k } };
  }
  if (kind === 'wave') {
    const h = hangOutline(big(waveOutline(k)));
    return { ...h, slab: { long: 'x', seed: 41 + k, line: [0.02, 0.25], inset: 1.6 }, paint: { day: pal.bird, eve: pal.night, dayAcc: pal.bird, eveAcc: pal.moon, box: ALL, edge: [0.0 * z, 0.9 * z], seed: 17 + k } };
  }
  const h = hangOutline(big(boatOutline(k)));
  return { ...h, slab: { long: 'x', seed: 51 + k, line: [0.1, 0.3], inset: 1.0 }, paint: { day: pal.boat, eve: pal.night, dayAcc: pal.moon, eveAcc: pal.sun, box: [-1e4, 2.75 * z - h.dy, 1e4, 1e4], seed: 19 + k } };
}
